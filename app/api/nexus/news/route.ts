import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 2: notícia real (Currents API, grátis,
// uso comercial permitido) servida com cache-aside em nexus_news.
//
// GET /api/nexus/news?canal=<economia-br|moedas|mundo|reforma-tributaria>
// Chamada pela própria tela (não é cron) — por isso a defesa do limite
// grátis da API está AQUI: só busca de novo na Currents se a última busca
// deste canal foi há mais de CACHE_HORAS; do contrário serve do banco
// (rápido, sem limite). O SQL que essa rota depende (colunas imagem_url/
// canal em nexus_news + índice único em canonical_url + seed da fonte
// 'Currents') está em NEXUS-PUSH03-NEWS-SQL.txt, AINDA NÃO aplicado —
// por isso todo esse fluxo tem que degradar pro demo sem quebrar se essas
// colunas/linha ainda não existirem no banco (ver catch geral no fim).
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

type RespostaRota = {
  fonte: 'real' | 'demo'
  noticias: NoticiaResposta[]
  aviso?: string
}

const CACHE_HORAS = 4
const LIMITE_POR_CANAL = 8

// Termos por canal — foco pedido: Bovespa, dólar, petróleo/commodities,
// economia, Reforma Tributária.
const CANAIS_QUERY: Record<string, { language: string; category?: string; keywords: string }> = {
  'economia-br': { language: 'pt', category: 'business', keywords: 'Bovespa OR Ibovespa OR economia Brasil' },
  'moedas': { language: 'pt', keywords: 'dólar OR câmbio OR moedas' },
  'mundo': { language: 'en', keywords: 'oil OR commodities OR global economy' },
  'reforma-tributaria': { language: 'pt', keywords: 'reforma tributária OR IBS OR CBS' },
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
      return NextResponse.json({ fonte: 'demo', noticias: [], aviso: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor' } satisfies RespostaRota)
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

    let avisoBusca: string | undefined
    if (cacheExpirado) {
      const apiKey = process.env.CURRENTS_API_KEY
      if (!apiKey) {
        avisoBusca = 'CURRENTS_API_KEY não configurada no servidor — servindo conteúdo já salvo (ou demo)'
      } else {
        try {
          await buscarEGravarCurrents(supabase, canal, apiKey)
        } catch (err) {
          avisoBusca = `Falha ao buscar Currents: ${err instanceof Error ? err.message : String(err)}`
        }
      }
    }

    return NextResponse.json(await lerDoBanco(supabase, canal, avisoBusca))
  } catch (err) {
    // Qualquer falha inesperada (ex: colunas do PUSH03 ainda não aplicadas)
    // cai pro demo — nunca 500 cru pra tela, ela já sabe tratar 'demo'.
    const motivo = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ fonte: 'demo', noticias: [], aviso: `Falha inesperada: ${motivo}` } satisfies RespostaRota)
  }
}

async function lerDoBanco(supabase: SupabaseClient, canal: string, avisoBusca?: string): Promise<RespostaRota> {
  const { data, error } = await supabase
    .from('nexus_news')
    .select('id, title, translated_summary, imagem_url, canonical_url, publication_date')
    .eq('canal', canal)
    .order('publication_date', { ascending: false })
    .limit(LIMITE_POR_CANAL)

  if (error || !data || data.length === 0) {
    return { fonte: 'demo', noticias: [], aviso: avisoBusca || error?.message }
  }

  const noticias: NoticiaResposta[] = data
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
    return { fonte: 'demo', noticias: [], aviso: avisoBusca }
  }

  return { fonte: 'real', noticias, aviso: avisoBusca }
}

async function buscarEGravarCurrents(supabase: SupabaseClient, canal: string, apiKey: string) {
  const cfg = CANAIS_QUERY[canal]
  const params = new URLSearchParams({ apiKey, language: cfg.language, keywords: cfg.keywords })
  if (cfg.category) params.set('category', cfg.category)

  const res = await fetch(`https://api.currentsapi.services/v1/search?${params.toString()}`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const body = await res.json()
  const itens = Array.isArray(body?.news) ? body.news : []
  if (itens.length === 0) return

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
      imagem_url: typeof n.image === 'string' && n.image !== 'None' ? n.image : null,
      canal,
    }))
    .filter((l: { canonical_url: string | null }) => !!l.canonical_url)

  if (linhas.length === 0) return

  const { error } = await supabase.from('nexus_news').upsert(linhas, { onConflict: 'canonical_url' })
  if (error) throw new Error(error.message)
}

// Sem tela nesta rota (JSON puro) — i18n PT/EN/ES não se aplica aqui; a
// tela (app/(interno)/nexus/page.tsx) que traduz os rótulos ao redor do
// conteúdo (a notícia em si vem no idioma que a Currents devolveu).
