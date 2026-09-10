import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { buscarEGravarFeeds, FeedError, CANAIS_FONTES, FONTES_RSS_ATIVAS, limiteDoCanal, type MotivoDemo } from '@/lib/nexusNewsIngest'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 4 (correção definitiva): a fonte de RSS
// aberta (Agência Brasil/InfoMoney/Money Times) já existia, mas linha
// ANTIGA gravada pela extinta integração paga podia sobrar em nexus_news
// (apagar a chave da API não limpa o banco) e o cache-aside servia
// qualquer linha do canal, incluindo essas. Agora `lerDoBanco` só devolve
// linha cujo source_id está no conjunto ATIVO de fontes RSS (FONTES_RSS_
// ATIVAS, calculado a partir de quem a ingestão realmente sabe produzir) —
// mesmo que sobre lixo de fonte antiga no banco, nunca aparece na tela.
//
// A ingestão em si (busca + parse + upsert) mora em lib/nexusNewsIngest.ts,
// compartilhada com o cron diário do BCB (app/api/nexus/ingest/bcb/route.ts)
// — o mesmo cron agora também força o refresh dos 4 canais de notícia 1x/dia
// (plano Hobby só permite 1 cron; reaproveitar em vez de criar um novo).
//
// Cache-aside continua igual: só rebusca se a última busca deste canal foi
// há mais de CACHE_HORAS; ?refresh=1 ignora essa checagem (útil pra testar
// na hora sem esperar o cache vencer — sem proteção extra porque o pior caso
// é só uma chamada a mais nos feeds grátis, nenhum dado sensível envolvido).
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
  motivo?: MotivoDemo
}

const CACHE_HORAS = 4

export async function GET(request: NextRequest) {
  const canal = request.nextUrl.searchParams.get('canal') || ''
  if (!CANAIS_FONTES[canal]) {
    return NextResponse.json({ error: `canal inválido: ${canal}` }, { status: 400 })
  }
  const forcarRefresh = request.nextUrl.searchParams.get('refresh') === '1'

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

    const cacheExpirado = forcarRefresh || !ultima || Date.now() - new Date(ultima.created_at as string).getTime() > CACHE_HORAS * 3600000

    let motivoBusca: MotivoDemo | undefined
    if (cacheExpirado) {
      try {
        await buscarEGravarFeeds(supabase, canal)
      } catch (err) {
        if (err instanceof FeedError) {
          motivoBusca = err.motivo
        } else {
          motivoBusca = 'erro_inesperado'
          console.error(`[nexus/news] Falha inesperada buscando RSS pro canal ${canal}:`, err)
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
  // Allow-list por source_id — nunca serve linha de fonte fora do conjunto
  // RSS ativo (protege contra sobra de fonte antiga/descontinuada no banco).
  const { data: fontesAtivas, error: erroFontes } = await supabase
    .from('nexus_source')
    .select('source_id')
    .in('source_name', FONTES_RSS_ATIVAS)

  if (erroFontes) {
    console.error(`[nexus/news] Falha lendo fontes ativas:`, erroFontes.message)
  }
  const idsAtivos = (fontesAtivas || []).map((f: any) => f.source_id as string)

  if (idsAtivos.length === 0) {
    return { fonte: 'demo', noticias: [], motivo: motivoBusca || 'sem_dado_no_banco' }
  }

  const { data, error } = await supabase
    .from('nexus_news')
    .select('id, title, translated_summary, imagem_url, canonical_url, publication_date, nexus_source(source_name)')
    .eq('canal', canal)
    .in('source_id', idsAtivos)
    .order('publication_date', { ascending: false })
    .limit(limiteDoCanal(canal))

  if (error) {
    console.error(`[nexus/news] Falha lendo nexus_news pro canal ${canal}:`, error.message)
  }

  const noticias: NoticiaResposta[] = (data || [])
    .filter((n: any) => n.title && n.canonical_url)
    .map((n: any) => ({
      id: n.id as string,
      titulo: n.title as string,
      resumo: (n.translated_summary as string) || '',
      imagem_url: (n.imagem_url as string) || null,
      // nexus_source vem como objeto (FK única source_id → nexus_source) —
      // fallback genérico só se a fonte não puder ser identificada (nunca
      // deveria acontecer, já que garantirFonte roda antes de todo upsert).
      fonte: n.nexus_source?.source_name || 'Fonte externa',
      url_original: n.canonical_url as string,
      data: (n.publication_date as string) || new Date().toISOString(),
      canal,
    }))

  if (noticias.length === 0) {
    return { fonte: 'demo', noticias: [], motivo: motivoBusca || 'sem_dado_no_banco' }
  }

  return { fonte: 'real', noticias, motivo: motivoBusca }
}

// Sem tela nesta rota (JSON puro) — i18n PT/EN/ES não se aplica aqui; a
// tela (app/(interno)/nexus/page.tsx) que traduz os rótulos ao redor do
// conteúdo (a notícia em si vem em português, idioma de todos os feeds).
