import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 03, Parte 3 (correção): troca de fonte — a Currents
// API (paga/paywall pra Folha) deu lugar a RSS de fontes abertas e grátis,
// SEM CHAVE: Agência Brasil (EBC, conteúdo CC-BY) como principal, InfoMoney e
// Money Times como complemento de mercado. Cache-aside em nexus_news
// mantido (só rebusca se a última busca deste canal foi há mais de
// CACHE_HORAS; do contrário serve do banco).
//
// Cada canal escuta um ou mais feeds (ver CANAIS_FONTES) e cada FEED tem
// try/catch isolado (buscarEGravarFeeds) — um feed fora do ar nunca derruba
// o canal inteiro nem a página; só reduz o que entra no lote. Se TODOS os
// feeds do canal falharem, cai pro demo com `motivo` explicando por quê.
//
// Crédito da fonte é exigência da licença CC-BY da Agência Brasil — por
// isso `fonte` na resposta vem sempre do nome real do veículo (via join
// com nexus_source), nunca de um texto genérico.
//
// ponytail: sem lock entre "cache expirado?" e o INSERT — duas requisições
// simultâneas no exato momento em que o cache expira podem buscar os feeds
// 2x em vez de 1. Aceitável (feeds são grátis, sem limite de taxa); se virar
// problema, trocar por um lock (SELECT ... FOR UPDATE numa linha de controle).
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

// Curto de propósito — vira aviso genérico traduzido na tela, nunca aparece
// cru pro usuário. Serve pra diagnosticar sem adivinhar.
type MotivoDemo =
  | 'sem_service_role'
  | 'todos_feeds_falharam'
  | 'sem_resultado'
  | 'falha_upsert'
  | 'sem_dado_no_banco'
  | 'erro_inesperado'

type RespostaRota = {
  fonte: 'real' | 'demo'
  noticias: NoticiaResposta[]
  motivo?: MotivoDemo
}

class FeedError extends Error {
  constructor(public motivo: MotivoDemo, detalhe?: string) {
    super(detalhe || motivo)
  }
}

const CACHE_HORAS = 4
const LIMITE_POR_CANAL = 8

type FeedKey = 'ebcEconomia' | 'ebcInternacional' | 'ebcPolitica' | 'infoMoney' | 'moneyTimes'

// Feeds abertos confirmados (respondem XML válido, sem chave, sem paywall).
// DW Brasil foi avaliado e descartado — não foi possível achar uma URL de
// feed que respondesse (ver histórico do pedido); se algum dia existir, basta
// somar uma entrada aqui.
const FEEDS: Record<FeedKey, { url: string; fonte: string; idioma: string }> = {
  ebcEconomia: { url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', fonte: 'Agência Brasil', idioma: 'pt' },
  ebcInternacional: { url: 'https://agenciabrasil.ebc.com.br/rss/internacional/feed.xml', fonte: 'Agência Brasil', idioma: 'pt' },
  ebcPolitica: { url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml', fonte: 'Agência Brasil', idioma: 'pt' },
  infoMoney: { url: 'https://www.infomoney.com.br/feed/', fonte: 'InfoMoney', idioma: 'pt' },
  moneyTimes: { url: 'https://www.moneytimes.com.br/feed/', fonte: 'Money Times', idioma: 'pt' },
}

// Metadados de licença pra garantir a fonte (nexus_source) sem SQL novo —
// UPSERT idempotente feito pelo próprio código de ingestão (service_role).
const LICENCA_FONTE: Record<string, { endpoint: string; license: string }> = {
  'Agência Brasil': { endpoint: 'https://rss.ebc.com.br/', license: 'Creative Commons CC-BY (Agência Brasil/EBC) — uso comercial permitido com crédito' },
  'InfoMoney': { endpoint: 'https://www.infomoney.com.br/feed/', license: 'RSS público — uso editorial de manchete/resumo, com crédito e link pra fonte' },
  'Money Times': { endpoint: 'https://www.moneytimes.com.br/feed/', license: 'RSS público — uso editorial de manchete/resumo, com crédito e link pra fonte' },
}

// Palavras-chave dos canais que filtram por assunto (moedas/reforma tributária
// não têm feed dedicado — filtram um feed geral). EXCLUIR em reforma-tributaria
// existe especificamente pra tirar esporte/entretenimento que o feed de
// política às vezes mistura (bug relatado: jogo de futebol aparecendo lá).
const PALAVRAS_MOEDAS = /d[oó]lar|c[aâ]mbio|\breal\b|\beuro\b|moeda|bolsa|ibovespa|commodit|petr[oó]leo/i
const PALAVRAS_REFORMA_INCLUIR = /reforma tribut[aá]ria|tribut[aá]ri|\bibs\b|\bcbs\b|\biva\b|imposto|al[ií]quota|split payment|comit[eê] gestor|regulamenta[çc][aã]o/i
const PALAVRAS_REFORMA_EXCLUIR = /futebol|\bjogo\b|\bgol\b|jogador|campeonato|libertadores|sele[çc][aã]o|s[ée]rie a|s[ée]rie b|f[óo]rmula 1|olimp[íi]ada|\bbbb\b|novela|\bcopa\b/i

const CANAIS_FONTES: Record<string, { feeds: FeedKey[]; incluir?: RegExp; excluir?: RegExp }> = {
  'economia-br': { feeds: ['ebcEconomia', 'infoMoney'] },
  'moedas': { feeds: ['infoMoney', 'moneyTimes', 'ebcEconomia'], incluir: PALAVRAS_MOEDAS },
  'mundo': { feeds: ['ebcInternacional'] },
  'reforma-tributaria': { feeds: ['ebcEconomia', 'ebcPolitica'], incluir: PALAVRAS_REFORMA_INCLUIR, excluir: PALAVRAS_REFORMA_EXCLUIR },
}

export async function GET(request: NextRequest) {
  const canal = request.nextUrl.searchParams.get('canal') || ''
  if (!CANAIS_FONTES[canal]) {
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
  const { data, error } = await supabase
    .from('nexus_news')
    .select('id, title, translated_summary, imagem_url, canonical_url, publication_date, nexus_source(source_name)')
    .eq('canal', canal)
    .order('publication_date', { ascending: false })
    .limit(LIMITE_POR_CANAL)

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

type ItemFeed = {
  titulo: string
  resumoHtml: string
  imagem_url: string | null
  url_original: string
  data: string
}

const parserXML = new XMLParser({ ignoreAttributes: true })

function extrairImagem(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m ? m[1] : null
}

// Corta a lista de "Notícias relacionadas" que a Agência Brasil embute no
// fim da descrição (senão o resumo vira uma lista de links, não o resumo).
function resumoDeDescricao(html: string): string {
  const semRelacionadas = html.split(/not[íi]cias relacionadas/i)[0]
  const texto = semRelacionadas.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim()
  return texto.slice(0, 500)
}

async function buscarFeedRSS(url: string): Promise<ItemFeed[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AxiomaNexus/1.0; +https://axioma.ai.tech)' },
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const xml = await res.text()
  const doc = parserXML.parse(xml)
  const brutos = doc?.rss?.channel?.item
  const lista = Array.isArray(brutos) ? brutos : brutos ? [brutos] : []

  return lista
    .filter((it: any) => typeof it.link === 'string' && it.link.trim() !== '')
    .map((it: any) => {
      const descricao = typeof it.description === 'string' ? it.description : ''
      const imagemDestaque = typeof it['imagem-destaque'] === 'string' ? it['imagem-destaque'] : null
      return {
        titulo: typeof it.title === 'string' ? it.title.trim() : '',
        resumoHtml: descricao,
        imagem_url: imagemDestaque || extrairImagem(descricao),
        url_original: it.link.trim(),
        data: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
      }
    })
    .filter((it: ItemFeed) => it.titulo !== '')
}

// UPSERT idempotente da fonte em nexus_source — sem isso a Agência
// Brasil/InfoMoney/Money Times não têm source_id (a seed do PUSH03 só
// cobria "Currents"). onConflict por source_name (UNIQUE) evita duplicar.
async function garantirFonte(supabase: SupabaseClient, nomeFonte: string): Promise<string | null> {
  const meta = LICENCA_FONTE[nomeFonte]
  const { data, error } = await supabase
    .from('nexus_source')
    .upsert(
      {
        source_name: nomeFonte,
        source_type: 'news_source',
        provider: nomeFonte,
        category: 'news',
        endpoint: meta?.endpoint ?? null,
        license: meta?.license ?? null,
        access_type: 'public',
        auth_type: 'none',
        update_frequency: 'hourly',
        active: true,
      },
      { onConflict: 'source_name' },
    )
    .select('source_id')
    .maybeSingle()

  if (error) {
    console.error(`[nexus/news] Falha ao garantir fonte ${nomeFonte}:`, error.message)
    return null
  }
  return (data?.source_id as string) ?? null
}

async function buscarEGravarFeeds(supabase: SupabaseClient, canal: string) {
  const cfg = CANAIS_FONTES[canal]

  const brutos: (ItemFeed & { fonte: string })[] = []
  let algumFeedOk = false

  for (const chaveFeed of cfg.feeds) {
    const feed = FEEDS[chaveFeed]
    try {
      const itens = await buscarFeedRSS(feed.url)
      algumFeedOk = true
      for (const it of itens) brutos.push({ ...it, fonte: feed.fonte })
    } catch (err) {
      // Isolado por feed — um feed fora do ar não derruba o canal inteiro.
      console.error(`[nexus/news] Falha lendo feed ${feed.fonte} (${feed.url}) pro canal ${canal}:`, err instanceof Error ? err.message : err)
    }
  }

  if (!algumFeedOk) throw new FeedError('todos_feeds_falharam')

  const filtrados = brutos.filter((it) => {
    const texto = `${it.titulo} ${it.resumoHtml}`
    if (cfg.incluir && !cfg.incluir.test(texto)) return false
    if (cfg.excluir && cfg.excluir.test(texto)) return false
    return true
  })

  // dedupe do lote por canonical_url (mantém a 1ª ocorrência) — o mesmo link
  // pode aparecer em mais de um feed do mesmo canal (ex: moedas lê 3 feeds).
  const vistos = new Map<string, ItemFeed & { fonte: string }>()
  for (const it of filtrados) {
    if (!vistos.has(it.url_original)) vistos.set(it.url_original, it)
  }
  const linhasBrutas = Array.from(vistos.values()).slice(0, LIMITE_POR_CANAL)

  if (linhasBrutas.length === 0) throw new FeedError('sem_resultado')

  const nomesFonte = Array.from(new Set(linhasBrutas.map((l) => l.fonte)))
  const idsPorFonte = new Map<string, string | null>()
  for (const nome of nomesFonte) {
    idsPorFonte.set(nome, await garantirFonte(supabase, nome))
  }

  const linhas = linhasBrutas.map((it) => ({
    source_id: idsPorFonte.get(it.fonte) ?? null,
    title: it.titulo,
    original_title: it.titulo,
    original_language: 'pt',
    translated_summary: resumoDeDescricao(it.resumoHtml),
    author: null,
    publication_date: it.data,
    canonical_url: it.url_original,
    imagem_url: it.imagem_url,
    canal,
  }))

  const { error } = await supabase.from('nexus_news').upsert(linhas, { onConflict: 'canonical_url' })
  if (error) {
    console.error(`[nexus/news] Falha no upsert pro canal ${canal}:`, error.message)
    throw new FeedError('falha_upsert', error.message)
  }
}

// Sem tela nesta rota (JSON puro) — i18n PT/EN/ES não se aplica aqui; a
// tela (app/(interno)/nexus/page.tsx) que traduz os rótulos ao redor do
// conteúdo (a notícia em si vem em português, idioma de todos os feeds).
