// ═══════════════════════════════════════════════════════════════
// MOTOR DE PESQUISA NEXUS — o botão "Pesquisar" de todo card/janela do Nexus
// (indicadores, moedas, petróleo, matérias-primas, combustíveis, comércio
// exterior, ciclo econômico, países, notícias e eventos do radar).
//
// Devolve, pra pessoa conferir por conta própria:
//  • o DADO OFICIAL: valor, mês/dia de referência, fonte, página pública e hora da coleta;
//  • as REPORTAGENS que o Axioma coletou sobre o tema (título, veículo, data, link);
//  • a leitura do JOSÉ: resumo robusto e conciso + pontos + efeito na empresa.
// Anti-invenção: a IA só cita reportagens pelo NÚMERO da lista; título, veículo,
// data e link vêm do banco. Sem IA, a pesquisa sai assinada "Motor de Pesquisa
// Nexus" com o dado e as reportagens (nunca erro vazio).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { jsonDoJose, usoZerado, type Uso } from './ia/motor'
import { paginaDaFonte } from './nexusFontesLinks'
import type { IdiomaJoseph } from './nexusJoseph'

type Tema = { titulo: Record<IdiomaJoseph, string>; series: string[]; termos: string[] }

// Termos de busca de cada tema (pt + en, porque há veículos nacionais e internacionais).
const TEMAS: Record<string, Tema> = {
  '1': { titulo: { pt: 'Dólar', en: 'US Dollar', es: 'Dólar' }, series: ['1', 'BCE:USD'], termos: ['dólar', 'câmbio', 'dollar', 'real '] },
  '21619': { titulo: { pt: 'Euro', en: 'Euro', es: 'Euro' }, series: ['21619', 'BCE:EUR'], termos: ['euro', 'zona do euro', 'eurozone', 'BCE', 'ECB'] },
  '21623': { titulo: { pt: 'Libra esterlina', en: 'British pound', es: 'Libra esterlina' }, series: ['21623', 'BCE:GBP'], termos: ['libra', 'Reino Unido', 'pound', 'Bank of England', 'UK '] },
  '21621': { titulo: { pt: 'Iene', en: 'Japanese yen', es: 'Yen' }, series: ['21621', 'BCE:JPY'], termos: ['iene', 'Japão', 'yen', 'Japan'] },
  'BCE:CNY': { titulo: { pt: 'Yuan', en: 'Chinese yuan', es: 'Yuan' }, series: ['BCE:CNY'], termos: ['yuan', 'China', 'chinês', 'Chinese'] },
  '432': { titulo: { pt: 'Selic e juros', en: 'Selic rate and interest', es: 'Selic e intereses' }, series: ['432'], termos: ['Selic', 'juros', 'Copom', 'Banco Central', 'interest rate'] },
  '433': { titulo: { pt: 'Inflação (IPCA)', en: 'Inflation (IPCA)', es: 'Inflación (IPCA)' }, series: ['433'], termos: ['IPCA', 'inflação', 'preços', 'inflation'] },
  '24369': { titulo: { pt: 'Desemprego', en: 'Unemployment', es: 'Desempleo' }, series: ['24369'], termos: ['desemprego', 'emprego', 'PNAD', 'trabalho', 'unemployment', 'jobs'] },
  '24363': { titulo: { pt: 'Atividade econômica (IBC-Br)', en: 'Economic activity (IBC-Br)', es: 'Actividad económica (IBC-Br)' }, series: ['24363'], termos: ['IBC-Br', 'atividade econômica', 'PIB', 'economia brasileira', 'GDP'] },
  'IBGE:VAREJO': { titulo: { pt: 'Vendas do comércio', en: 'Retail sales', es: 'Ventas del comercio' }, series: ['IBGE:VAREJO'], termos: ['varejo', 'vendas', 'comércio', 'consumo', 'retail'] },
  'IBGE:SERVICOS': { titulo: { pt: 'Setor de serviços', en: 'Services sector', es: 'Sector servicios' }, series: ['IBGE:SERVICOS'], termos: ['serviços', 'setor de serviços', 'services'] },
  'IBGE:INDUSTRIA': { titulo: { pt: 'Produção industrial', en: 'Industrial output', es: 'Producción industrial' }, series: ['IBGE:INDUSTRIA'], termos: ['indústria', 'produção industrial', 'fábrica', 'industrial', 'manufacturing'] },
  'IPEA:BRENT': { titulo: { pt: 'Petróleo Brent', en: 'Brent crude', es: 'Petróleo Brent' }, series: ['IPEA:BRENT'], termos: ['petróleo', 'Brent', 'Petrobras', 'OPEP', 'oil', 'OPEC', 'crude'] },
  'FMI:SOJA': { titulo: { pt: 'Soja', en: 'Soybeans', es: 'Soja' }, series: ['FMI:SOJA'], termos: ['soja', 'agronegócio', 'safra', 'soybean', 'grain'] },
  'FMI:MILHO': { titulo: { pt: 'Milho', en: 'Corn', es: 'Maíz' }, series: ['FMI:MILHO'], termos: ['milho', 'safra', 'corn', 'grain'] },
  'FMI:CAFE': { titulo: { pt: 'Café', en: 'Coffee', es: 'Café' }, series: ['FMI:CAFE'], termos: ['café', 'coffee'] },
  'FMI:MINERIO': { titulo: { pt: 'Minério de ferro', en: 'Iron ore', es: 'Mineral de hierro' }, series: ['FMI:MINERIO'], termos: ['minério', 'Vale', 'siderurgia', 'aço', 'iron ore', 'steel'] },
  'FMI:ACUCAR': { titulo: { pt: 'Açúcar', en: 'Sugar', es: 'Azúcar' }, series: ['FMI:ACUCAR'], termos: ['açúcar', 'cana', 'usinas', 'sugar', 'ethanol'] },
  'ANP:GASOLINA': { titulo: { pt: 'Gasolina', en: 'Gasoline', es: 'Gasolina' }, series: ['ANP:GASOLINA'], termos: ['gasolina', 'combustível', 'combustíveis', 'Petrobras', 'postos'] },
  'ANP:DIESEL': { titulo: { pt: 'Diesel', en: 'Diesel', es: 'Diésel' }, series: ['ANP:DIESEL'], termos: ['diesel', 'combustível', 'frete', 'caminhoneiros', 'Petrobras'] },
  'ANP:ETANOL': { titulo: { pt: 'Etanol', en: 'Ethanol', es: 'Etanol' }, series: ['ANP:ETANOL'], termos: ['etanol', 'álcool', 'usinas', 'cana', 'ethanol'] },
  'ANP:GLP': { titulo: { pt: 'Gás de cozinha', en: 'Cooking gas', es: 'Gas de cocina' }, series: ['ANP:GLP'], termos: ['gás de cozinha', 'botijão', 'GLP', 'gás'] },
  'COMEX:EXPORT': { titulo: { pt: 'Exportações', en: 'Exports', es: 'Exportaciones' }, series: ['COMEX:EXPORT'], termos: ['exportação', 'exportações', 'balança comercial', 'tarifa', 'exports', 'tariff', 'trade'] },
  'COMEX:IMPORT': { titulo: { pt: 'Importações', en: 'Imports', es: 'Importaciones' }, series: ['COMEX:IMPORT'], termos: ['importação', 'importações', 'balança comercial', 'tarifa', 'imports', 'tariff', 'trade'] },
  'OCDE:CLI:BRA': { titulo: { pt: 'Ciclo econômico do Brasil', en: 'Brazil business cycle', es: 'Ciclo económico de Brasil' }, series: ['OCDE:CLI:BRA'], termos: ['economia brasileira', 'crescimento', 'recessão', 'PIB', 'Brazil economy'] },
  'OCDE:CLI:CHN': { titulo: { pt: 'Ciclo econômico da China', en: 'China business cycle', es: 'Ciclo económico de China' }, series: ['OCDE:CLI:CHN'], termos: ['China', 'chinesa', 'Pequim', 'Chinese economy', 'Beijing'] },
  'pais:USA': { titulo: { pt: 'Economia dos EUA', en: 'US economy', es: 'Economía de EE. UU.' }, series: ['WB:USA:NY.GDP.MKTP.KD.ZG', 'WB:USA:FP.CPI.TOTL.ZG'], termos: ['EUA', 'Estados Unidos', 'Fed', 'Trump', 'United States', 'Federal Reserve', 'Wall Street'] },
  'pais:CHN': { titulo: { pt: 'Economia da China', en: 'China economy', es: 'Economía de China' }, series: ['WB:CHN:NY.GDP.MKTP.KD.ZG', 'WB:CHN:FP.CPI.TOTL.ZG'], termos: ['China', 'chinesa', 'Pequim', 'Chinese', 'Beijing'] },
  'pais:EMU': { titulo: { pt: 'Economia da Zona do Euro', en: 'Euro Area economy', es: 'Economía de la Zona Euro' }, series: ['WB:EMU:NY.GDP.MKTP.KD.ZG', 'WB:EMU:FP.CPI.TOTL.ZG'], termos: ['Europa', 'zona do euro', 'BCE', 'União Europeia', 'Europe', 'eurozone', 'EU '] },
}

export type MateriaPesquisa = { titulo: string; veiculo: string; data: string; url: string | null; resumo: string | null }
export type DadoPesquisa = { serie: string; nome: string; valor: number; data: string; frequencia: string | null; fonte: string | null; pagina: string | null; coletadoEm: string | null; anterior: { valor: number; data: string } | null }
export type ResultadoPesquisa = {
  titulo: string
  assinatura: 'José' | 'Motor de Pesquisa Nexus'
  dados: DadoPesquisa[]
  resumo: string | null
  pontos: string[]
  paraEmpresa: string | null
  materias: MateriaPesquisa[]
  geradoEm: string
}

const NOME_IDIOMA: Record<IdiomaJoseph, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
const esc = (t: string) => t.replace(/[%,()]/g, ' ').trim()

// Cache por instância do servidor (3h): o mesmo tema não paga IA de novo a cada clique.
const cache = new Map<string, { quando: number; r: ResultadoPesquisa }>()
const TTL = 3 * 3600000

export async function pesquisarNexus(supabase: SupabaseClient, tema: string, lang: IdiomaJoseph, uso: Uso = usoZerado()): Promise<ResultadoPesquisa> {
  const chave = `${tema}|${lang}`
  const guardado = cache.get(chave)
  if (guardado && Date.now() - guardado.quando < TTL) return guardado.r

  // ─── 1. O que pesquisar ───
  let titulo = tema
  let series: string[] = []
  let termos: string[] = []
  let foco = '' // texto do evento/notícia de origem, quando o botão veio de um deles
  if (TEMAS[tema]) ({ series, termos } = TEMAS[tema], titulo = TEMAS[tema].titulo[lang])
  else if (tema.startsWith('noticia:') || tema.startsWith('evento:')) {
    const id = tema.split(':')[1]
    const { data } = tema.startsWith('noticia:')
      ? await supabase.from('nexus_news').select('title, translated_summary').eq('id', id).maybeSingle()
      : await supabase.from('nexus_global_event').select('title, description').eq('event_id', id).maybeSingle()
    const linha = (data ?? {}) as { title?: string; translated_summary?: string | null; description?: string | null }
    titulo = linha.title ?? titulo
    foco = `${linha.title ?? ''}. ${linha.translated_summary ?? linha.description ?? ''}`.trim()
    // Palavras fortes do título (5+ letras) viram a busca das reportagens relacionadas.
    termos = [...new Set((linha.title ?? '').split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length >= 5).slice(0, 6))]
  }
  if (!termos.length && !series.length) throw new Error('tema desconhecido')

  // ─── 2. Dado oficial (com fonte, página e hora da coleta) ───
  const [{ data: fontes }, ...linhasSeries] = await Promise.all([
    supabase.from('nexus_source').select('source_id, source_name'),
    ...series.map((c) => supabase.from('nexus_economic_series').select('serie_codigo, serie_nome, valor, data_referencia, frequencia, retrieved_at, source_id')
      .eq('serie_codigo', c).order('data_referencia', { ascending: false }).limit(40)),
  ])
  const nomeFonte = (id: unknown) => (fontes ?? []).find((f) => f.source_id === id)?.source_name as string | undefined
  const dados: DadoPesquisa[] = linhasSeries.map((r) => {
    const ls = (r.data ?? []) as Record<string, unknown>[]
    if (!ls.length) return null
    const a = ls[0]
    const alvo = new Date(new Date(`${a.data_referencia}T00:00:00Z`).getTime() - 28 * 86400000).toISOString().slice(0, 10)
    const ant = ls.find((l) => (l.data_referencia as string) <= alvo)
    const fonte = nomeFonte(a.source_id) ?? null
    return {
      serie: a.serie_codigo as string, nome: (a.serie_nome as string) ?? (a.serie_codigo as string), valor: Number(a.valor), data: a.data_referencia as string,
      frequencia: (a.frequencia as string | null) ?? null, fonte, pagina: paginaDaFonte(fonte), coletadoEm: (a.retrieved_at as string | null) ?? null,
      anterior: ant ? { valor: Number(ant.valor), data: ant.data_referencia as string } : null,
    }
  }).filter((d): d is DadoPesquisa => d !== null)

  // ─── 3. Reportagens coletadas (últimos 30 dias) ───
  const desde = new Date(Date.now() - 30 * 86400000).toISOString()
  const ou = termos.map((t) => `title.ilike.%${esc(t)}%`).join(',')
  const { data: noticias } = ou
    ? await supabase.from('nexus_news').select('id, title, translated_summary, canonical_url, publication_date, nexus_source(source_name)')
      .gte('publication_date', desde).or(ou).order('publication_date', { ascending: false }).limit(10)
    : { data: [] }
  const materias: MateriaPesquisa[] = ((noticias ?? []) as unknown as { title: string; translated_summary: string | null; canonical_url: string | null; publication_date: string; nexus_source: { source_name: string } | null }[])
    .map((n) => ({ titulo: n.title, veiculo: n.nexus_source?.source_name ?? 'fonte jornalística', data: n.publication_date, url: n.canonical_url, resumo: n.translated_summary }))

  // ─── 4. Leitura do José (só com o que está acima) ───
  const base: ResultadoPesquisa = { titulo, assinatura: 'Motor de Pesquisa Nexus', dados, resumo: null, pontos: [], paraEmpresa: null, materias, geradoEm: new Date().toISOString() }
  if (!dados.length && !materias.length) { cache.set(chave, { quando: Date.now(), r: base }); return base }
  try {
    const listaDados = dados.map((d) => `- ${d.nome}: ${d.valor} (ref. ${d.data}, fonte ${d.fonte ?? 'oficial'})${d.anterior ? `; ~1 mês antes: ${d.anterior.valor} (ref. ${d.anterior.data})` : ''}`).join('\n')
    const listaMaterias = materias.map((m, i) => `[${i + 1}] ${m.data.slice(0, 10)} — ${m.veiculo}: ${m.titulo}${m.resumo ? ` | ${m.resumo.slice(0, 400)}` : ''}`).join('\n')
    const { texto } = await jsonDoJose({
      nivel: 'analise', rotulo: 'pesquisa nexus', uso,
      sistema: `Você é José, a inteligência do Axioma Nexus, escrevendo para donos de pequenas e médias empresas brasileiras. Explique o tema pesquisado usando SOMENTE os dados oficiais e as reportagens numeradas abaixo.
Regras invioláveis:
- Nunca invente número, data, declaração, veículo ou reportagem. Reportagem é "relatado por fonte jornalística", não fato oficial.
- "resumo": 70 a 120 palavras, robusto e conciso: o que está acontecendo, por que, e o que os números oficiais mostram (cite o número e o mês/data).
- "pontos": 3 a 5 itens curtos e verificáveis, cada um com número/data ou o veículo que relatou.
- "para_empresa": 1 a 2 frases práticas sobre o efeito numa pequena/média empresa brasileira.
- "materias": para cada reportagem RELEVANTE ao tema (no máximo 6), o número dela na lista e um resumo de 20 a 40 palavras do que ela diz. Ignore as que não tratam do tema.
- Se a base for fraca, diga isso no resumo em vez de completar com suposição.
- Nunca se identifique como IA, Claude ou modelo de linguagem. Você é o José, do Axioma.
- Responda em ${NOME_IDIOMA[lang]}.`,
      mensagem: `TEMA PESQUISADO: ${titulo}${foco ? `\nORIGEM DA PESQUISA: ${foco}` : ''}\nHoje: ${new Date().toISOString().slice(0, 10)}\n\nDADOS OFICIAIS:\n${listaDados || '- nenhum dado oficial ligado a este tema'}\n\nREPORTAGENS COLETADAS PELO AXIOMA (últimos 30 dias):\n${listaMaterias || '- nenhuma'}`,
      esquema: {
        type: 'object', additionalProperties: false, required: ['resumo', 'pontos', 'para_empresa', 'materias'],
        properties: {
          resumo: { type: 'string' }, pontos: { type: 'array', items: { type: 'string' } }, para_empresa: { type: 'string' },
          materias: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['numero', 'resumo'], properties: { numero: { type: 'integer' }, resumo: { type: 'string' } } } },
        },
      },
    })
    const j = JSON.parse(texto) as { resumo: string; pontos: string[]; para_empresa: string; materias: { numero: number; resumo: string }[] }
    // Só reportagens da lista (pelo número); título/veículo/data/link continuam os do banco.
    const escolhidas = (j.materias ?? []).filter((m) => m.numero >= 1 && m.numero <= materias.length)
      .map((m) => ({ ...materias[m.numero - 1], resumo: m.resumo }))
    const r: ResultadoPesquisa = { ...base, assinatura: 'José', resumo: j.resumo, pontos: j.pontos ?? [], paraEmpresa: j.para_empresa, materias: escolhidas.length ? escolhidas : materias }
    cache.set(chave, { quando: Date.now(), r })
    return r
  } catch {
    // As 3 IAs falharam: entrega o dado e as reportagens, sem a leitura (não guarda no cache).
    return base
  }
}
