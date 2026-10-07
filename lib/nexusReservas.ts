// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — fontes reserva (regra do Elias, 2026-10-06: nenhum robô do
// Nexus pode ficar sem dado; sempre uma 2ª fonte e, se possível, uma 3ª).
//
// Como funciona (roda no fim de toda coleta, depois das fontes principais):
//  1. Para cada indicador, olha a data mais recente gravada (qualquer fonte).
//  2. Se estiver atrasada (ou vazia), tenta a 2ª fonte; se falhar, a 3ª.
//  3. A reserva só grava as DATAS QUE FALTAM — nunca duplica um dia que a
//     principal já tem — e com o source_id da própria reserva (procedência honesta).
//  4. Quando a principal volta e traz aquela data, a linha da reserva some
//     (a principal sempre vence).
// Todas as fontes abaixo são gratuitas, sem cadastro, e foram conferidas em
// 2026-10-06 contra a principal (mesmos valores).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import * as XLSX from 'xlsx'
import { buscarComRetentativa } from './nexusRede'
import { calcularFreshness } from './nexusFreshness'
import { garantirFonte, type Fonte, PAISES_BM, codigoBM } from './nexusFontesMundo'
import { fimDoMes, type Ponto } from './nexusLeitoresFontes'

type ModoData = 'inicio' | 'fim' // 1º dia do mês (séries do BCB) ou último (séries do IBGE/FMI/Comex)
type Leitor = { fonte: Fonte; ler: () => Promise<Ponto[]> }
type Indicador = {
  codigo: string
  principal: string // source_name da fonte principal (a que vence quando volta)
  frequencia: string
  meta: { nome: string; categoria: string; country: string; moeda?: string; unidade?: string }
  reservas: Leitor[]
}

const dataDoMes = (ano: number, mes: number, modo: ModoData) => modo === 'fim' ? fimDoMes(ano, mes) : `${ano}-${String(mes).padStart(2, '0')}-01`
const doisDec = (v: number) => Math.round(v * 100) / 100

// ─── Fontes (cadastradas sozinhas em nexus_source na 1ª vez) ───
const F_IPEA: Fonte = { nome: 'IPEA Data', tipo: 'public_dataset', provedor: 'Instituto de Pesquisa Econômica Aplicada (IPEA)', endpoint: 'http://www.ipeadata.gov.br/api/odata4', frequencia: 'daily', licenca: 'dados abertos (IPEA)' }
const F_SIDRA: Fonte = { nome: 'IBGE Dados Abertos', tipo: 'statistics_api', provedor: 'Instituto Brasileiro de Geografia e Estatística (IBGE)', endpoint: 'https://servicodados.ibge.gov.br/api/v3/agregados', frequencia: 'monthly', licenca: 'dados abertos (IBGE)' }
const F_SGS: Fonte = { nome: 'BCB SGS', tipo: 'central_bank', provedor: 'Banco Central do Brasil', endpoint: 'https://api.bcb.gov.br/dados/serie', frequencia: 'daily', licenca: 'dados abertos (BCB)' }
const F_COPOM: Fonte = { nome: 'BCB Copom (histórico de taxas)', tipo: 'central_bank', provedor: 'Banco Central do Brasil — site', endpoint: 'https://www.bcb.gov.br/api/servico/sitebcb/historicotaxasjuros', frequencia: 'event_driven', licenca: 'dados abertos (BCB)' }
const F_FRANKFURTER: Fonte = { nome: 'Frankfurter (espelho do BCE)', tipo: 'fx_api', provedor: 'Frankfurter — taxas de referência do BCE', endpoint: 'https://api.frankfurter.dev/v1', frequencia: 'daily', licenca: 'código aberto; dados do BCE' }
const F_PINK: Fonte = { nome: 'Banco Mundial — Pink Sheet', tipo: 'international_org', provedor: 'World Bank Commodity Price Data (Pink Sheet)', endpoint: 'https://www.worldbank.org/en/research/commodity-markets', frequencia: 'monthly', licenca: 'CC BY 4.0' }
const F_FMI_DM: Fonte = { nome: 'FMI DataMapper', tipo: 'international_org', provedor: 'International Monetary Fund — World Economic Outlook', endpoint: 'https://www.imf.org/external/datamapper/api/v1', frequencia: 'annual', licenca: 'reutilização livre com citação (FMI)' }

// ─── Leitores ───
const ipea = (serie: string, modo: ModoData | 'dia', transformar: (v: number) => number = (v) => v): Leitor => ({
  fonte: F_IPEA,
  ler: async () => {
    const res = await buscarComRetentativa(`http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='${serie}')`, { timeoutMs: 30000 })
    if (!res.ok) throw new Error(`IPEA ${serie}: HTTP ${res.status}`)
    const json = await res.json() as { value?: { VALDATA: string; VALVALOR: number | null }[] }
    return (json.value ?? []).filter((p) => p.VALVALOR != null).slice(-24).map((p) => {
      const [a, m] = p.VALDATA.slice(0, 7).split('-').map(Number)
      return { data: modo === 'dia' ? p.VALDATA.slice(0, 10) : dataDoMes(a, m, modo), valor: transformar(Number(p.VALVALOR)) }
    })
  },
})

const sidra = (consulta: string, modo: ModoData): Leitor => ({
  fonte: F_SIDRA,
  ler: async () => {
    const res = await buscarComRetentativa(`https://servicodados.ibge.gov.br/api/v3/agregados/${consulta}`)
    if (!res.ok) throw new Error(`SIDRA: HTTP ${res.status}`)
    const json = await res.json() as { resultados?: { series?: { serie?: Record<string, string> }[] }[] }[]
    const serie = json[0]?.resultados?.[0]?.series?.[0]?.serie ?? {}
    return Object.entries(serie).filter(([per, v]) => /^\d{6}$/.test(per) && v !== '' && Number.isFinite(Number(v)))
      .map(([per, v]) => ({ data: dataDoMes(Number(per.slice(0, 4)), Number(per.slice(4, 6)), modo), valor: Number(v) }))
  },
})

const sgs = (codigo: string, modo: ModoData): Leitor => ({
  fonte: F_SGS,
  ler: async () => {
    const res = await buscarComRetentativa(`https://api.bcb.gov.br/dados/serie/bcdata.sgs.${codigo}/dados/ultimos/20?formato=json`, { timeoutMs: 15000 }) // o BCB recusa (HTTP 400) pedidos acima de 20
    if (!res.ok) throw new Error(`SGS ${codigo}: HTTP ${res.status}`)
    const json = await res.json() as { data: string; valor: string }[]
    return (Array.isArray(json) ? json : []).filter((p) => Number.isFinite(parseFloat(p.valor))).map((p) => {
      const [, m, a] = p.data.split('/').map(Number)
      return { data: dataDoMes(a, m, modo), valor: parseFloat(p.valor) }
    })
  },
})

// Selic meta pelo histórico do Copom: monta o valor de cada dia dos últimos 30.
const copomSelic = (): Leitor => ({
  fonte: F_COPOM,
  ler: async () => {
    const res = await buscarComRetentativa(F_COPOM.endpoint)
    if (!res.ok) throw new Error(`Copom: HTTP ${res.status}`)
    const json = await res.json() as { conteudo?: { DataInicioVigencia: string; DataFimVigencia: string | null; MetaSelic: number | null }[] }
    const vig = (json.conteudo ?? []).filter((c) => c.MetaSelic != null)
    const pontos: Ponto[] = []
    for (let i = 30; i >= 0; i--) {
      const dia = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
      const v = vig.find((c) => c.DataInicioVigencia.slice(0, 10) <= dia && (!c.DataFimVigencia || c.DataFimVigencia.slice(0, 10) >= dia))
      if (v) pontos.push({ data: dia, valor: Number(v.MetaSelic) })
    }
    return pontos
  },
})

// R$ por 1 unidade da moeda (mesma conta do BCE), últimos 30 dias úteis publicados.
const frankfurter = (moeda: string): Leitor => ({
  fonte: F_FRANKFURTER,
  ler: async () => {
    const inicio = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const res = await buscarComRetentativa(`https://api.frankfurter.dev/v1/${inicio}..?from=${moeda}&to=BRL`)
    if (!res.ok) throw new Error(`Frankfurter ${moeda}: HTTP ${res.status}`)
    const json = await res.json() as { rates?: Record<string, { BRL?: number }> }
    return Object.entries(json.rates ?? {}).filter(([, r]) => Number.isFinite(r.BRL)).map(([data, r]) => ({ data, valor: Number(r.BRL) }))
  },
})

// Pink Sheet: o link da planilha muda todo mês — sempre o da página oficial
// (nunca um arquivo antigo guardado). Baixada uma vez por coleta.
let pinkSheet: Promise<unknown[][]> | null = null
async function lerPinkSheet(): Promise<unknown[][]> {
  const pagina = await buscarComRetentativa(F_PINK.endpoint, { headers: { 'User-Agent': 'Mozilla/5.0 (Axioma Nexus)' } })
  if (!pagina.ok) throw new Error(`Pink Sheet (página): HTTP ${pagina.status}`)
  const link = /https:\/\/thedocs\.worldbank\.org[^"']*CMO-Historical-Data-Monthly\.xlsx/.exec(await pagina.text())?.[0]
  if (!link) throw new Error('Pink Sheet: link da planilha não encontrado na página')
  const arq = await buscarComRetentativa(link, { timeoutMs: 40000 })
  if (!arq.ok) throw new Error(`Pink Sheet (planilha): HTTP ${arq.status}`)
  const wb = XLSX.read(new Uint8Array(await arq.arrayBuffer()), { type: 'array' })
  return XLSX.utils.sheet_to_json(wb.Sheets['Monthly Prices'], { header: 1, raw: true }) as unknown[][]
}
const pink = (coluna: string, transformar: (v: number) => number = (v) => v): Leitor => ({
  fonte: F_PINK,
  ler: async () => {
    pinkSheet ??= lerPinkSheet().catch((err) => { pinkSheet = null; throw err })
    const linhas = await pinkSheet
    const cab = linhas.find((l) => Array.isArray(l) && l.includes(coluna)) as unknown[] | undefined
    const i = cab ? cab.indexOf(coluna) : -1
    if (i < 0) throw new Error(`Pink Sheet: coluna "${coluna}" não encontrada`)
    return linhas.filter((l) => /^\d{4}M\d{2}$/.test(String(l?.[0]))).slice(-24)
      .filter((l) => typeof l[i] === 'number')
      .map((l) => { const [a, m] = String(l[0]).split('M').map(Number); return { data: fimDoMes(a, m), valor: doisDec(transformar(l[i] as number)) } })
  },
})

// FMI (WEO): só anos já encerrados — o resto é projeção e não entra como dado.
const ISO_FMI: Record<string, string> = { EMU: 'EUQ' }
const fmiDataMapper = (indicador: string, iso: string): Leitor => ({
  fonte: F_FMI_DM,
  ler: async () => {
    const res = await buscarComRetentativa(`${F_FMI_DM.endpoint}/${indicador}`, { timeoutMs: 30000 })
    if (!res.ok) throw new Error(`FMI DataMapper: HTTP ${res.status}`)
    const json = await res.json() as { values?: Record<string, Record<string, Record<string, number>>> }
    const anos = json.values?.[indicador]?.[ISO_FMI[iso] ?? iso] ?? {}
    const ultimoAno = new Date().getUTCFullYear() - 1
    return Object.entries(anos).map(([ano, v]) => ({ ano: Number(ano), v })).filter((x) => x.ano <= ultimoAno && x.ano >= ultimoAno - 3 && Number.isFinite(x.v))
      .map((x) => ({ data: `${x.ano}-12-31`, valor: doisDec(x.v) }))
  },
})

// ─── Quem é reserva de quem (ordem = 2ª, 3ª) ───
// Exportado também pra conferência (scripts/testar-reservas-nexus.cjs).
export const INDICADORES: Indicador[] = [
  { codigo: '433', principal: 'BCB SGS', frequencia: 'mensal', meta: { nome: 'IPCA — variação mensal (%)', categoria: 'inflation', country: 'BR', unidade: '%' },
    reservas: [sidra('1737/periodos/-12/variaveis/63?localidades=N1[all]', 'inicio'), ipea('PRECOS12_IPCAG12', 'inicio')] },
  { codigo: '24369', principal: 'BCB SGS', frequencia: 'mensal', meta: { nome: 'Taxa de desocupação (%)', categoria: 'labor', country: 'BR', unidade: '%' },
    reservas: [sidra('6381/periodos/-12/variaveis/4099?localidades=N1[all]', 'inicio'), ipea('PNADC12_TDESOC12', 'inicio')] },
  { codigo: '24363', principal: 'BCB SGS', frequencia: 'mensal_defasada', meta: { nome: 'IBC-Br — atividade econômica (índice)', categoria: 'economic_activity', country: 'BR', unidade: 'índice' },
    reservas: [ipea('SGS12_IBCBR12', 'inicio')] },
  { codigo: '432', principal: 'BCB SGS', frequencia: 'diaria', meta: { nome: 'Selic meta (% a.a.)', categoria: 'interest_rate', country: 'BR', unidade: '% a.a.' },
    reservas: [copomSelic()] },
  { codigo: 'IBGE:VAREJO', principal: 'IBGE Dados Abertos', frequencia: 'mensal_defasada', meta: { nome: 'Vendas do comércio varejista (volume, índice 2022=100, IBGE/PMC)', categoria: 'economic_activity', country: 'BR', unidade: 'índice' },
    reservas: [sgs('28473', 'fim'), ipea('PMC12_IVVRNSA12', 'fim')] },
  { codigo: 'IBGE:SERVICOS', principal: 'IBGE Dados Abertos', frequencia: 'mensal_defasada', meta: { nome: 'Volume de serviços (índice 2022=100, IBGE/PMS)', categoria: 'economic_activity', country: 'BR', unidade: 'índice' },
    reservas: [ipea('PMS12_RRSSA12', 'fim')] },
  { codigo: 'IBGE:INDUSTRIA', principal: 'IBGE Dados Abertos', frequencia: 'mensal_defasada', meta: { nome: 'Produção industrial (índice 2022=100, IBGE/PIM)', categoria: 'economic_activity', country: 'BR', unidade: 'índice' },
    reservas: [sgs('28503', 'fim')] },
  { codigo: 'COMEX:EXPORT', principal: 'Comex Stat', frequencia: 'mensal_defasada', meta: { nome: 'Exportações do Brasil (US$ bilhões no mês, Comex Stat/MDIC)', categoria: 'trade', country: 'BR', moeda: 'USD', unidade: 'US$ bi' },
    reservas: [ipea('SECEX12_XVTOT12', 'fim', (v) => doisDec(v / 1000))] }, // IPEA em US$ milhões
  { codigo: 'COMEX:IMPORT', principal: 'Comex Stat', frequencia: 'mensal_defasada', meta: { nome: 'Importações do Brasil (US$ bilhões no mês, Comex Stat/MDIC)', categoria: 'trade', country: 'BR', moeda: 'USD', unidade: 'US$ bi' },
    reservas: [ipea('SECEX12_MVTOT12', 'fim', (v) => doisDec(v / 1000))] },
  { codigo: 'IPEA:BRENT', principal: 'IPEA Data', frequencia: 'diaria', meta: { nome: 'Petróleo Brent (US$/barril)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US$/barril' },
    reservas: [pink('Crude oil, Brent')] }, // média mensal: cobre o buraco até o diário voltar
  { codigo: 'FMI:SOJA', principal: 'FMI', frequencia: 'mensal_defasada', meta: { nome: 'Soja em grão (US$/tonelada, FMI)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US$/t' }, reservas: [pink('Soybeans')] },
  { codigo: 'FMI:MILHO', principal: 'FMI', frequencia: 'mensal_defasada', meta: { nome: 'Milho (US$/tonelada, FMI)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US$/t' }, reservas: [pink('Maize')] },
  { codigo: 'FMI:CAFE', principal: 'FMI', frequencia: 'mensal_defasada', meta: { nome: 'Café arábica (centavos de US$ por libra-peso, FMI)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US¢/lb' },
    reservas: [pink('Coffee, Arabica', (v) => (v * 100) / 2.20462)] }, // Pink Sheet em US$/kg
  { codigo: 'FMI:MINERIO', principal: 'FMI', frequencia: 'mensal_defasada', meta: { nome: 'Minério de ferro (US$/tonelada seca, FMI)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US$/t' }, reservas: [pink('Iron ore, cfr spot')] },
  { codigo: 'FMI:ACUCAR', principal: 'FMI', frequencia: 'mensal_defasada', meta: { nome: 'Açúcar (centavos de US$ por libra-peso, FMI)', categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: 'US¢/lb' },
    reservas: [pink('Sugar, world', (v) => (v * 100) / 2.20462)] }, // Pink Sheet em US$/kg
  ...(['CNY', 'USD', 'EUR', 'GBP', 'JPY'] as const).map((m): Indicador => ({
    codigo: `BCE:${m}`, principal: 'Banco Central Europeu', frequencia: 'diaria',
    meta: { nome: `${m} em reais (via BCE)`, categoria: 'fx', country: 'WORLD', moeda: 'BRL', unidade: 'R$' }, reservas: [frankfurter(m)],
  })),
  ...PAISES_BM.flatMap((p) => [
    { ind: 'NY.GDP.MKTP.KD.ZG', fmi: 'NGDP_RPCH', rotulo: 'crescimento do PIB (% a.a.)', categoria: 'gdp' },
    { ind: 'FP.CPI.TOTL.ZG', fmi: 'PCPIPCH', rotulo: 'inflação (% a.a.)', categoria: 'inflation' },
  ].map((x): Indicador => ({
    codigo: codigoBM(p.iso, x.ind), principal: 'Banco Mundial', frequencia: 'anual',
    meta: { nome: `${p.nome} — ${x.rotulo}`, categoria: x.categoria, country: p.iso, unidade: '%' }, reservas: [fmiDataMapper(x.fmi, p.iso)],
  }))),
]

function atrasada(ultimaData: string | null, frequencia: string): boolean {
  if (!ultimaData) return true
  const s = calcularFreshness(ultimaData, frequencia)
  return frequencia === 'diaria' ? !['live', 'fresh'].includes(s) : ['stale', 'expired', 'unknown'].includes(s)
}

// Grava só as datas que faltam, com o source_id da reserva.
async function preencher(supabase: SupabaseClient, ind: Indicador, leitor: Leitor, pontos: Ponto[]): Promise<number> {
  const sourceId = await garantirFonte(supabase, leitor.fonte)
  const { data: existentes, error } = await supabase.from('nexus_economic_series').select('data_referencia')
    .eq('serie_codigo', ind.codigo).in('data_referencia', pontos.map((p) => p.data))
  if (error) throw new Error(`leitura de ${ind.codigo}: ${error.message}`)
  const tem = new Set((existentes ?? []).map((e) => e.data_referencia as string))
  const novas = pontos.filter((p) => !tem.has(p.data)).map((p) => ({
    source_id: sourceId, serie_codigo: ind.codigo, serie_nome: ind.meta.nome, categoria: ind.meta.categoria, country: ind.meta.country,
    moeda: ind.meta.moeda ?? null, unidade: ind.meta.unidade ?? null, frequencia: ind.frequencia, valor: p.valor, data_referencia: p.data,
    retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(p.data, ind.frequencia),
  }))
  if (!novas.length) return 0
  const { data, error: erroGravar } = await supabase.from('nexus_economic_series').upsert(novas, { onConflict: 'source_id,serie_codigo,data_referencia' }).select('serie_codigo')
  if (erroGravar || (data?.length ?? 0) < novas.length) throw new Error(`gravação de ${ind.codigo}: ${erroGravar?.message ?? 'linhas faltando'}`)
  return novas.length
}

// A principal voltou com estas datas: as linhas da reserva nessas datas saem.
async function aposentarReservas(supabase: SupabaseClient, ind: Indicador, principalId: string): Promise<number> {
  const { data: linhas, error } = await supabase.from('nexus_economic_series').select('data_referencia, source_id')
    .eq('serie_codigo', ind.codigo).order('data_referencia', { ascending: false }).limit(400)
  if (error || !linhas) return 0
  const daPrincipal = new Set(linhas.filter((l) => l.source_id === principalId).map((l) => l.data_referencia as string))
  const superadas = [...new Set(linhas.filter((l) => l.source_id !== principalId && daPrincipal.has(l.data_referencia as string)).map((l) => l.data_referencia as string))]
  if (!superadas.length) return 0
  const { data, error: erroApagar } = await supabase.from('nexus_economic_series').delete()
    .eq('serie_codigo', ind.codigo).neq('source_id', principalId).in('data_referencia', superadas).select('serie_codigo')
  if (erroApagar) { Sentry.captureException(new Error(`[nexus/reservas] aposentar ${ind.codigo}: ${erroApagar.message}`)); return 0 }
  return data?.length ?? 0
}

// Etapa da coleta: cobre com reserva todo indicador atrasado e limpa reservas superadas.
export async function cobrirComReservas(supabase: SupabaseClient): Promise<{ cobertos: string[]; semReserva: string[]; aposentadas: number }> {
  pinkSheet = null // planilha nova a cada coleta
  const { data: fontes } = await supabase.from('nexus_source').select('source_id, source_name')
  const idDe = (nome: string) => fontes?.find((f) => f.source_name === nome)?.source_id as string | undefined
  const cobertos: string[] = []
  const semReserva: string[] = []
  let aposentadas = 0
  await Promise.all(INDICADORES.map(async (ind) => {
    try {
      const principalId = idDe(ind.principal)
      if (principalId) aposentadas += await aposentarReservas(supabase, ind, principalId)
      const { data: ultima } = await supabase.from('nexus_economic_series').select('data_referencia')
        .eq('serie_codigo', ind.codigo).order('data_referencia', { ascending: false }).limit(1).maybeSingle()
      if (!atrasada((ultima?.data_referencia as string | undefined) ?? null, ind.frequencia)) return
      const motivos: string[] = []
      for (const leitor of ind.reservas) {
        try {
          const pontos = await leitor.ler()
          if (!pontos.length) { motivos.push(`${leitor.fonte.nome}: sem pontos`); continue }
          const n = await preencher(supabase, ind, leitor, pontos)
          // 0 novos = a reserva respondeu e também não tem dado mais novo (atraso normal de publicação): não é alarme.
          if (n > 0) {
            cobertos.push(`${ind.codigo} ← ${leitor.fonte.nome} (${n} novo${n === 1 ? '' : 's'})`)
            // Reserva preencheu = principal fora/atrasada: fica registrado pra acompanhar.
            Sentry.captureMessage(`[nexus/reservas] ${ind.codigo} coberto por ${leitor.fonte.nome}`, { level: 'warning', extra: { novos: n } })
          }
          return
        } catch (err) { motivos.push(`${leitor.fonte.nome}: ${err instanceof Error ? err.message : String(err)}`) }
      }
      semReserva.push(`${ind.codigo} (${motivos.join(' | ')})`)
      Sentry.captureMessage(`[nexus/reservas] ${ind.codigo} atrasado e nenhuma reserva respondeu`, { level: 'error', extra: { motivos } })
    } catch (err) {
      semReserva.push(`${ind.codigo} (${err instanceof Error ? err.message : String(err)})`)
    }
  }))
  return { cobertos, semReserva, aposentadas }
}
