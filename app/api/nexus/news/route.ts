import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 2 (correção): notícia real (Currents API,
// grátis, uso comercial permitido) servida com cache-aside em nexus_news.
//
// GET /api/nexus/news?canal=<economia-br|moedas|mundo|reforma-tributaria>
// Chamada pela própria tela (não é cron) — por isso a defesa do limite
// grátis da API está AQUI: só busca de novo na Currents se a última busca
// deste canal foi há mais de CACHE_HORAS; do contrário serve do banco
// (rápido, sem limite). O SQL que essa rota depende (colunas imagem_url/
// canal em nexus_news + índice único em canonical_url + seed da fonte
// 'Currents') está em NEXUS-PUSH03-NEWS-SQL.txt — já aplicado.
//
// Autenticação da Currents é por HEADER (Authorization: Bearer <chave>), não
// por query string — confirmado no painel deles. /v1/latest-news é o canal
// geral (Economia BR), /v1/search com "keywords" é usado pelos canais de
// termo (moedas/mundo/reforma tributária). A resposta traz os itens em
// `data.news[]` (nunca "articles").
//
// Toda vez que cai pro demo por causa de falha/config faltando, o campo
// `motivo` (curto, sem vazar a chave) explica por quê — ver MotivoDemo.
// Detalhe de status/corpo de erro vai só pro console do servidor.
//
// ponytail: checagem "cache expirado?" e novo INSERT não são atômicos —
// duas requisições simultâneas no exato momento em que o cache expira
// podem disparar 2 buscas na Currents em vez de 1. Aceitável no tráfego
// atual (poucos usuários); se isso passar a estourar o limite grátis,
// trocar por um lock (ex: SELECT ... FOR UPDATE numa linha de controle).
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 20

type NoticiaResposta = {
  id: string
  titulo: string
  resumo: string
  imagem_url: string | null
  fonte: string
  url_original: string
  data: string
  canal: string
}

// Curto de propósito — vira aviso genérico traduzido na tela, nunca
// aparece cru pro usuário. Serve pra diagnosticar sem adivinhar.
type MotivoDemo =
  | 'sem_service_role'
  | 'sem_chave'
  | `currents_${number}`
  | 'currents_resposta_invalida'
  | 'sem_resultado'
  | 'falha_upsert'
  | 'sem_dado_no_banco'
  | 'erro_inesperado'

type RespostaRota = {
  fonte: 'real' | 'demo'
  noticias: NoticiaResposta[]
  motivo?: MotivoDemo
}

class CurrentsError extends Error {
  constructor(public motivo: MotivoDemo, detalhe?: string) {
    super(detalhe || motivo)
  }
}

const CACHE_HORAS = 4
const LIMITE_POR_CANAL = 8

// economia-br usa o canal geral (latest-news); os demais buscam por termo
// (search) — foco pedido: Bovespa, dólar, petróleo/commodities, economia,
// Reforma Tributária.
const CANAIS_QUERY: Record<string, { endpoint: 'latest-news' | 'search'; language: string; country?: string; keywords?: string }> = {
  'economia-br': { endpoint: 'latest-news', language: 'pt', country: 'BR' },
  'moedas': { endpoint: 'search', language: 'pt', keywords: 'dólar câmbio' },
  'mundo': { endpoint: 'search', language: 'pt', keywords: 'petróleo commodities' },
  'reforma-tributaria': { endpoint: 'search', language: 'pt', keywords: 'reforma tributária' },
}

export async function GET(request: NextRequest) {
  const canal = request.nextUrl.searchParams.get('canal') || ''
  if (!CANAIS_QUERY[canal]) {
    return NextResponse.json({ error: `canal inválido: ${canal}` }, { status: 400 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ fonte: 'demo', noticias: [], motivo: 'sem_service_role' } satisfies RespostaRota)
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { data: ultima } = await supabase
      .from('nexus_news')
      .select('created_at')
      .eq('canal', canal)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const cacheExpirado = !ultima || Date.now() - new Date(ultima.created_at as string).getTime() > CACHE_HORAS * 3600000

    let motivoBusca: MotivoDemo | undefined
    if (cacheExpirado) {
      const apiKey = process.env.CURRENTS_API_KEY
      if (!apiKey) {
        motivoBusca = 'sem_chave'
        console.error(`[nexus/news] CURRENTS_API_KEY não configurada — canal ${canal} cai pro demo`)
      } else {
        try {
          await buscarEGravarCurrents(supabase, canal, apiKey)
        } catch (err) {
          if (err instanceof CurrentsError) {
            motivoBusca = err.motivo
          } else {
            motivoBusca = 'erro_inesperado'
            console.error(`[nexus/news] Falha inesperada buscando Currents pro canal ${canal}:`, err)
          }
        }
      }
    }

    return NextResponse.json(await lerDoBanco(supabase, canal, motivoBusca))
  } catch (err) {
    // Qualquer falha inesperada (ex: SQL do PUSH03 não aplicado ainda) cai
    // pro demo — nunca 500 cru pra tela, ela já sabe tratar 'demo'.
    console.error(`[nexus/news] Falha inesperada na rota pro canal ${canal}:`, err)
    return NextResponse.json({ fonte: 'demo', noticias: [], motivo: 'erro_inesperado' } satisfies RespostaRota)
  }
}

async function lerDoBanco(supabase: SupabaseClient, canal: string, motivoBusca?: MotivoDemo): Promise<RespostaRota> {
  const { data, error } = await supabase
    .from('nexus_news')
    .select('id, title, translated_summary, imagem_url, canonical_url, publication_date')
    .eq('canal', canal)
    .order('publication_date', { ascending: false })
    .limit(LIMITE_POR_CANAL)

  if (error) {
    console.error(`[nexus/news] Falha lendo nexus_news pro canal ${canal}:`, error.message)
  }

  const noticias: NoticiaResposta[] = (data || [])
    .filter((n) => n.title && n.canonical_url)
    .map((n) => ({
      id: n.id as string,
      titulo: n.title as string,
      resumo: (n.translated_summary as string) || '',
      imagem_url: (n.imagem_url as string) || null,
      fonte: 'Currents',
      url_original: n.canonical_url as string,
      data: (n.publication_date as string) || new Date().toISOString(),
      canal,
    }))

  if (noticias.length === 0) {
    return { fonte: 'demo', noticias: [], motivo: motivoBusca || 'sem_dado_no_banco' }
  }

  return { fonte: 'real', noticias, motivo: motivoBusca }
}

async function buscarEGravarCurrents(supabase: SupabaseClient, canal: string, apiKey: string) {
  const cfg = CANAIS_QUERY[canal]
  const params = new URLSearchParams({ language: cfg.language })
  if (cfg.country) params.set('country', cfg.country)
  if (cfg.keywords) params.set('keywords', cfg.keywords)

  const url = `https://api.currentsapi.services/v1/${cfg.endpoint}?${params.toString()}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })

  const bodyText = await res.text()
  if (!res.ok) {
    console.error(`[nexus/news] Currents HTTP ${res.status} pro canal ${canal} (${url.replace(/keywords=[^&]*/, 'keywords=…')}): ${bodyText.slice(0, 500)}`)
    throw new CurrentsError(`currents_${res.status}` as MotivoDemo)
  }

  let data: any
  try {
    data = JSON.parse(bodyText)
  } catch {
    console.error(`[nexus/news] Currents devolveu corpo não-JSON pro canal ${canal}: ${bodyText.slice(0, 300)}`)
    throw new CurrentsError('currents_resposta_invalida')
  }

  const itens = Array.isArray(data?.news) ? data.news : []
  if (itens.length === 0) {
    console.error(`[nexus/news] Currents sem itens pro canal ${canal} — status da resposta: ${data?.status}`)
    throw new CurrentsError('sem_resultado')
  }

  const { data: fonte } = await supabase
    .from('nexus_source')
    .select('source_id')
    .eq('source_name', 'Currents')
    .maybeSingle()

  const linhas = itens
    .slice(0, LIMITE_POR_CANAL)
    .map((n: any) => ({
      source_id: fonte?.source_id ?? null,
      title: typeof n.title === 'string' ? n.title : null,
      original_title: typeof n.title === 'string' ? n.title : null,
      original_language: cfg.language,
      translated_summary: typeof n.description === 'string' ? n.description.slice(0, 500) : null,
      author: typeof n.author === 'string' ? n.author : null,
      publication_date: n.published ? new Date(n.published).toISOString() : new Date().toISOString(),
      canonical_url: typeof n.url === 'string' ? n.url : null,
      // Currents manda o literal "None" (string) quando não há imagem — nunca
      // gravar isso; fica null e a tela usa o placeholder padrão dela.
      imagem_url: typeof n.image === 'string' && n.image !== 'None' ? n.image : null,
      canal,
    }))
    .filter((l: { canonical_url: string | null }) => !!l.canonical_url)

  if (linhas.length === 0) {
    console.error(`[nexus/news] Currents devolveu itens sem canonical_url utilizável pro canal ${canal}`)
    throw new CurrentsError('sem_resultado')
  }

  const { error } = await supabase.from('nexus_news').upsert(linhas, { onConflict: 'canonical_url' })
  if (error) {
    console.error(`[nexus/news] Falha no upsert pro canal ${canal}:`, error.message)
    throw new CurrentsError('falha_upsert', error.message)
  }
}

// Sem tela nesta rota (JSON puro) — i18n PT/EN/ES não se aplica aqui; a
// tela (app/(interno)/nexus/page.tsx) que traduz os rótulos ao redor do
// conteúdo (a notícia em si vem no idioma que a Currents devolveu).
