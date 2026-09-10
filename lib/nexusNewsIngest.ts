import type { SupabaseClient } from '@supabase/supabase-js'
import { XMLParser } from 'fast-xml-parser'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — ingestão de notícia (RSS aberto, sem chave). Compartilhado
// por dois consumidores:
//   - app/api/nexus/news/route.ts   → cache-aside por canal (chamada pela tela)
//   - app/api/nexus/ingest/bcb/route.ts → cron diário (força refresh dos 4
//     canais 1x/dia, reaproveitando o único cron do plano Hobby)
// Fonte principal: Agência Brasil (EBC, CC-BY, https://rss.ebc.com.br/).
// Complementares: InfoMoney e Money Times (mercado/moedas), Agência Senado
// (reforma tributária — conteúdo público oficial do Senado Federal, sem
// login). DW Brasil e Câmara dos Deputados foram avaliados e descartados —
// DW nunca respondeu; a RSS legada da Câmara (www2.camara.leg.br/
// camaranoticias/dinamico/agenciaCamaraRSS/*) devolve 503 (sistema fora do
// ar) e o portal novo (www.camara.leg.br/noticias) não expõe RSS.
//
// CORREÇÃO 2026-09-10: o botão "Ver mais / Reforma Tributária" linkava pro
// gov.br/fazenda, que exige login ("Conteúdo Restrito") — trocado por lista
// ampliada dentro do próprio Axioma (ver nexus/page.tsx), com cada notícia
// linkando pra matéria original aberta (Agência Senado/Brasil), nunca uma
// página que peça login.
//
// Cada FEED tem try/catch isolado (buscarEGravarFeeds) — um feed fora do ar
// nunca derruba o canal inteiro. Se TODOS os feeds do canal falharem, quem
// chamar recebe FeedError('todos_feeds_falharam') e decide o que fazer
// (a rota de tela cai pro demo; o cron só loga e segue pro próximo canal).
//
// ponytail: sem lock entre "cache expirado?" e o INSERT — duas requisições
// simultâneas no exato momento em que o cache expira podem buscar os feeds
// 2x em vez de 1. Aceitável (feeds são grátis, sem limite de taxa); se virar
// problema, trocar por um lock (SELECT ... FOR UPDATE numa linha de controle).
// ═══════════════════════════════════════════════════════════════

export const LIMITE_POR_CANAL = 8

// Curto de propósito — vira aviso genérico traduzido na tela, nunca aparece
// cru pro usuário. Serve pra diagnosticar sem adivinhar.
export type MotivoDemo =
  | 'sem_service_role'
  | 'todos_feeds_falharam'
  | 'sem_resultado'
  | 'falha_upsert'
  | 'sem_dado_no_banco'
  | 'erro_inesperado'

export class FeedError extends Error {
  constructor(public motivo: MotivoDemo, detalhe?: string) {
    super(detalhe || motivo)
  }
}

type FeedKey = 'ebcEconomia' | 'ebcInternacional' | 'ebcPolitica' | 'infoMoney' | 'moneyTimes' | 'senadoNoticias'

// Feeds abertos confirmados (respondem XML válido, sem chave, sem paywall,
// sem login). senadoNoticias é feed geral do Senado (sem editoria dedicada
// de tributação) — filtrado pelas mesmas palavras-chave do canal
// reforma-tributaria, igual já acontece com o feed geral de política da EBC.
const FEEDS: Record<FeedKey, { url: string; fonte: string }> = {
  ebcEconomia: { url: 'https://agenciabrasil.ebc.com.br/rss/economia/feed.xml', fonte: 'Agência Brasil' },
  ebcInternacional: { url: 'https://agenciabrasil.ebc.com.br/rss/internacional/feed.xml', fonte: 'Agência Brasil' },
  ebcPolitica: { url: 'https://agenciabrasil.ebc.com.br/rss/politica/feed.xml', fonte: 'Agência Brasil' },
  infoMoney: { url: 'https://www.infomoney.com.br/feed/', fonte: 'InfoMoney' },
  moneyTimes: { url: 'https://www.moneytimes.com.br/feed/', fonte: 'Money Times' },
  senadoNoticias: { url: 'https://www12.senado.leg.br/noticias/rss.xml', fonte: 'Agência Senado' },
}

// Nomes reais das fontes RSS que este código sabe produzir — usado pela
// rota de leitura como allow-list (nunca servir uma linha de fonte que não
// seja uma destas, mesmo que sobre alguma linha antiga de outra origem no
// banco — ex: Currents, removida). Fonte única de verdade: deriva de FEEDS,
// nunca lista solta que possa ficar dessincronizada.
export const FONTES_RSS_ATIVAS: string[] = Array.from(new Set(Object.values(FEEDS).map((f) => f.fonte)))

// Metadados de licença pra garantir a fonte (nexus_source) sem SQL novo —
// UPSERT idempotente feito pelo próprio código de ingestão (service_role).
const LICENCA_FONTE: Record<string, { endpoint: string; license: string }> = {
  'Agência Brasil': { endpoint: 'https://rss.ebc.com.br/', license: 'Creative Commons CC-BY (Agência Brasil/EBC) — uso comercial permitido com crédito' },
  'InfoMoney': { endpoint: 'https://www.infomoney.com.br/feed/', license: 'RSS público — uso editorial de manchete/resumo, com crédito e link pra fonte' },
  'Money Times': { endpoint: 'https://www.moneytimes.com.br/feed/', license: 'RSS público — uso editorial de manchete/resumo, com crédito e link pra fonte' },
  'Agência Senado': { endpoint: 'https://www12.senado.leg.br/noticias/rss.xml', license: 'Conteúdo público oficial do Senado Federal — uso editorial de manchete/resumo, com crédito e link pra fonte, sem login' },
}

// Palavras-chave dos canais que filtram por assunto (moedas/reforma tributária
// não têm feed dedicado — filtram um feed geral). EXCLUIR em reforma-tributaria
// existe especificamente pra tirar esporte/entretenimento que o feed de
// política às vezes mistura (bug relatado: jogo de futebol aparecendo lá).
const PALAVRAS_MOEDAS = /d[oó]lar|c[aâ]mbio|\breal\b|\beuro\b|moeda|bolsa|ibovespa|commodit|petr[oó]leo/i
const PALAVRAS_REFORMA_INCLUIR = /reforma tribut[aá]ria|tribut[aá]ri|\bibs\b|\bcbs\b|\biva\b|imposto|al[ií]quota|split payment|comit[eê] gestor|regulamenta[çc][aã]o|plp\s*108/i
const PALAVRAS_REFORMA_EXCLUIR = /futebol|\bjogo\b|\bgol\b|jogador|campeonato|libertadores|sele[çc][aã]o|s[ée]rie a|s[ée]rie b|f[óo]rmula 1|olimp[íi]ada|\bbbb\b|novela|\bcopa\b/i

export const CANAIS_FONTES: Record<string, { feeds: FeedKey[]; incluir?: RegExp; excluir?: RegExp; limite?: number }> = {
  'economia-br': { feeds: ['ebcEconomia', 'infoMoney'] },
  'moedas': { feeds: ['infoMoney', 'moneyTimes', 'ebcEconomia'], incluir: PALAVRAS_MOEDAS },
  'mundo': { feeds: ['ebcInternacional'] },
  // limite maior que os demais canais — alimenta a lista ampliada do botão
  // "Ver mais / Reforma Tributária" na tela (nexus/page.tsx) com conteúdo
  // de verdade, não só repetir os mesmos itens já visíveis na TV.
  'reforma-tributaria': { feeds: ['ebcEconomia', 'ebcPolitica', 'senadoNoticias'], incluir: PALAVRAS_REFORMA_INCLUIR, excluir: PALAVRAS_REFORMA_EXCLUIR, limite: 20 },
}

export function limiteDoCanal(canal: string): number {
  return CANAIS_FONTES[canal]?.limite ?? LIMITE_POR_CANAL
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

  // Nem todo feed tem <link> por item (a Agência Senado só traz <guid>, que
  // no feed dela já é a URL pública da matéria) — cai pro guid quando faltar.
  const urlDoItem = (it: any): string => {
    if (typeof it.link === 'string' && it.link.trim() !== '') return it.link.trim()
    if (typeof it.guid === 'string' && it.guid.trim() !== '') return it.guid.trim()
    return ''
  }

  return lista
    .map((it: any) => {
      const descricao = typeof it.description === 'string' ? it.description : ''
      const imagemDestaque = typeof it['imagem-destaque'] === 'string' ? it['imagem-destaque'] : null
      return {
        titulo: typeof it.title === 'string' ? it.title.trim() : '',
        resumoHtml: descricao,
        imagem_url: imagemDestaque || extrairImagem(descricao),
        url_original: urlDoItem(it),
        data: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
      }
    })
    .filter((it: ItemFeed) => it.titulo !== '' && it.url_original !== '')
}

// UPSERT idempotente da fonte em nexus_source — sem isso a Agência
// Brasil/InfoMoney/Money Times não têm source_id. onConflict por
// source_name (UNIQUE) evita duplicar.
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
    console.error(`[nexusNewsIngest] Falha ao garantir fonte ${nomeFonte}:`, error.message)
    return null
  }
  return (data?.source_id as string) ?? null
}

// Busca todos os feeds do canal, filtra por palavra-chave (quando o canal
// tiver), dedupe por canonical_url e grava em nexus_news via upsert. Lança
// FeedError quando não há nada pra gravar — quem chama decide o que fazer
// (rota de tela cai pro demo; cron loga e segue pro próximo canal).
export async function buscarEGravarFeeds(supabase: SupabaseClient, canal: string) {
  const cfg = CANAIS_FONTES[canal]
  if (!cfg) throw new FeedError('erro_inesperado', `canal desconhecido: ${canal}`)

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
      console.error(`[nexusNewsIngest] Falha lendo feed ${feed.fonte} (${feed.url}) pro canal ${canal}:`, err instanceof Error ? err.message : err)
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
  const linhasBrutas = Array.from(vistos.values()).slice(0, limiteDoCanal(canal))

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
    console.error(`[nexusNewsIngest] Falha no upsert pro canal ${canal}:`, error.message)
    throw new FeedError('falha_upsert', error.message)
  }
}
