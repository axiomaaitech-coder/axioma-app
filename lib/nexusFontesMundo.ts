// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — fontes mundiais gratuitas (sem mensalidade, sem cadastro):
//  • IPEA Data — petróleo Brent diário (série EIA366_PBRENT366, US$/barril);
//  • Banco Mundial — crescimento do PIB e inflação anuais dos parceiros que
//    mais pesam pro Brasil (EUA, China, Zona do Euro, Argentina, Japão,
//    Reino Unido, Índia, México).
// Só servidor (cron, service_role). Grava em nexus_economic_series (mesma
// tabela do BCB) — o José (chat, painel, plano) passa a enxergar sozinho.
// Cada fonte isolada: uma falhar não derruba a outra nem a coleta do BCB.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import { calcularFreshness } from './nexusFreshness'
import { buscarComRetentativa } from './nexusRede'
import * as XLSX from 'xlsx'
import { buscarFeedRSS } from './nexusNewsIngest'
import { moedasEmReais, lerCsvFmi, fimDoMes, linksResumoAnp, lerResumoAnp, lerCsvOcde, lerDbnomicsOcde, lerComex, type Ponto } from './nexusLeitoresFontes'

export type Fonte = { nome: string; tipo: string; provedor: string; endpoint: string; frequencia: string; licenca: string }

export async function garantirFonte(supabase: SupabaseClient, f: Fonte): Promise<string> {
  const { data: existente } = await supabase.from('nexus_source').select('source_id').eq('source_name', f.nome).maybeSingle()
  if (existente?.source_id) return existente.source_id as string
  const { data, error } = await supabase.from('nexus_source').insert({
    source_name: f.nome, source_type: f.tipo, provider: f.provedor, country: 'WORLD', endpoint: f.endpoint,
    license: f.licenca, access_type: 'public', auth_type: 'none', update_frequency: f.frequencia, active: true,
  }).select('source_id').single()
  if (error || !data) throw new Error(`cadastro da fonte ${f.nome}: ${error?.message}`)
  return data.source_id as string
}

// Alimenta a "Saúde das fontes" — falha aqui mostraria status errado sem ninguém
// saber, então vai pro log do servidor (auditoria 2026-09-28; antes o erro era ignorado).
async function marcar(supabase: SupabaseClient, sourceId: string, ok: boolean) {
  // varredura:ok — service role; erro checado logo abaixo
  const { error } = await supabase.from('nexus_source').update(ok ? { last_success: new Date().toISOString() } : { last_failure: new Date().toISOString() }).eq('source_id', sourceId)
  if (error) {
    console.error('[nexus] falha ao marcar saúde da fonte', sourceId, error.message)
    // A retentativa em 6h depende disto: precisa aparecer no Sentry, não só no log.
    Sentry.captureException(new Error(`[nexus] falha ao marcar saúde da fonte ${sourceId}: ${error.message}`), { extra: { sourceId, ok } })
  }
}

// ─── Petróleo Brent (IPEA) ───
export const SERIE_BRENT = 'IPEA:BRENT'
const URL_BRENT = "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='EIA366_PBRENT366')"

export async function ingerirBrent(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'IPEA Data', tipo: 'public_dataset', provedor: 'Instituto de Pesquisa Econômica Aplicada (IPEA)',
    endpoint: URL_BRENT, frequencia: 'daily', licenca: 'dados abertos (IPEA)',
  })
  try {
    const res = await buscarComRetentativa(URL_BRENT, { timeoutMs: 30000 })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { value?: { VALDATA: string; VALVALOR: number | null }[] }
    const pontos = (json.value ?? []).filter((p) => p.VALVALOR != null).slice(-90)
    if (pontos.length === 0) throw new Error('sem pontos')
    const linhas = pontos.map((p) => {
      const data = p.VALDATA.slice(0, 10)
      return {
        source_id: sourceId, serie_codigo: SERIE_BRENT, serie_nome: 'Petróleo Brent (US$/barril)', categoria: 'commodity',
        country: 'WORLD', moeda: 'USD', unidade: 'US$/barril', frequencia: 'diaria', valor: Number(p.VALVALOR), data_referencia: data,
        retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(data, 'diaria'),
      }
    })
    // varredura:ok — service role; erro checado logo abaixo
    const { error } = await supabase.from('nexus_economic_series').upsert(linhas, { onConflict: 'source_id,serie_codigo,data_referencia' })
    if (error) throw new Error(error.message)
    await marcar(supabase, sourceId, true)
    return `${linhas.length} pontos`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── Banco Mundial ───
export const PAISES_BM: { iso: string; nome: string }[] = [
  { iso: 'USA', nome: 'EUA' }, { iso: 'CHN', nome: 'China' }, { iso: 'EMU', nome: 'Zona do Euro' }, { iso: 'ARG', nome: 'Argentina' },
  { iso: 'JPN', nome: 'Japão' }, { iso: 'GBR', nome: 'Reino Unido' }, { iso: 'IND', nome: 'Índia' }, { iso: 'MEX', nome: 'México' },
]
const INDICADORES_BM = [
  { codigo: 'NY.GDP.MKTP.KD.ZG', rotulo: 'crescimento do PIB (% a.a.)', categoria: 'gdp' },
  { codigo: 'FP.CPI.TOTL.ZG', rotulo: 'inflação (% a.a.)', categoria: 'inflation' },
]
export const codigoBM = (iso: string, indicador: string) => `WB:${iso}:${indicador}`

export async function ingerirBancoMundial(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'Banco Mundial', tipo: 'international_org', provedor: 'World Bank Open Data',
    endpoint: 'https://api.worldbank.org/v2/country/{paises}/indicator/{indicador}', frequencia: 'annual', licenca: 'CC BY 4.0',
  })
  let total = 0
  const erros: string[] = []
  for (const ind of INDICADORES_BM) {
    try {
      const url = `https://api.worldbank.org/v2/country/${PAISES_BM.map((p) => p.iso).join(';')}/indicator/${ind.codigo}?format=json&mrv=4&per_page=200`
      const res = await buscarComRetentativa(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as [unknown, { countryiso3code: string; date: string; value: number | null }[] | null]
      const linhas = (json[1] ?? []).filter((p) => p.value != null).map((p) => {
        const pais = PAISES_BM.find((x) => x.iso === p.countryiso3code)
        const data = `${p.date}-12-31`
        return {
          source_id: sourceId, serie_codigo: codigoBM(p.countryiso3code, ind.codigo), serie_nome: `${pais?.nome ?? p.countryiso3code} — ${ind.rotulo}`,
          categoria: ind.categoria, country: p.countryiso3code, unidade: '%', frequencia: 'anual', valor: Number(p.value), data_referencia: data,
          retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(data, 'anual'),
        }
      })
      if (linhas.length) {
        // varredura:ok — service role; erro checado logo abaixo
        const { error } = await supabase.from('nexus_economic_series').upsert(linhas, { onConflict: 'source_id,serie_codigo,data_referencia' })
        if (error) throw new Error(error.message)
      }
      total += linhas.length
    } catch (err) {
      erros.push(`${ind.codigo}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  await marcar(supabase, sourceId, erros.length === 0)
  return erros.length ? `${total} pontos; erros: ${erros.join(' | ')}` : `${total} pontos`
}

// Grava pontos de uma série (mesmo formato do Brent) — upsert idempotente.
async function gravarSerie(
  supabase: SupabaseClient, sourceId: string,
  s: { codigo: string; nome: string; categoria: string; country: string; moeda?: string; unidade: string; frequencia: string },
  pontos: Ponto[],
) {
  if (pontos.length === 0) throw new Error(`${s.codigo}: sem pontos`)
  // varredura:ok — service role; erro checado logo abaixo
  const { error } = await supabase.from('nexus_economic_series').upsert(pontos.map((p) => ({
    source_id: sourceId, serie_codigo: s.codigo, serie_nome: s.nome, categoria: s.categoria, country: s.country, moeda: s.moeda ?? null,
    unidade: s.unidade, frequencia: s.frequencia, valor: p.valor, data_referencia: p.data,
    retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(p.data, s.frequencia),
  })), { onConflict: 'source_id,serie_codigo,data_referencia' })
  if (error) throw new Error(`${s.codigo}: ${error.message}`)
}

// ─── Moedas pelo Banco Central Europeu ───
// Yuan: o BCB não publica. Dólar, euro, libra e iene: 2ª fonte oficial, usada
// como reserva (se o BCB atrasar) e pra confirmar movimento forte de câmbio.
// O BCE publica tudo contra o euro; R$ por X = (R$/EUR) ÷ (X/EUR), mesma data.
export const SERIE_YUAN = 'BCE:CNY'
const MOEDAS_BCE: { moeda: string; nome: string; country: string }[] = [
  { moeda: 'CNY', nome: 'Yuan chinês (R$ por yuan, via BCE)', country: 'CHN' },
  { moeda: 'USD', nome: 'Dólar (R$ por dólar, via BCE — fonte reserva)', country: 'USA' },
  { moeda: 'EUR', nome: 'Euro (R$ por euro, via BCE — fonte reserva)', country: 'EMU' },
  { moeda: 'GBP', nome: 'Libra (R$ por libra, via BCE — fonte reserva)', country: 'GBR' },
  { moeda: 'JPY', nome: 'Iene (R$ por iene, via BCE — fonte reserva)', country: 'JPN' },
]
const URL_BCE = 'https://data-api.ecb.europa.eu/service/data/EXR/D.CNY+BRL+USD+GBP+JPY.EUR.SP00.A?format=csvdata&lastNObservations=90'

export async function ingerirMoedasBce(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'Banco Central Europeu', tipo: 'central_bank', provedor: 'European Central Bank (ECB Data Portal)',
    endpoint: URL_BCE, frequencia: 'daily', licenca: 'reutilização livre com citação (BCE)',
  })
  try {
    const res = await buscarComRetentativa(URL_BCE)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const series = moedasEmReais(await res.text())
    let total = 0
    for (const m of MOEDAS_BCE) {
      const pontos = series.get(m.moeda) ?? []
      await gravarSerie(supabase, sourceId, { codigo: `BCE:${m.moeda}`, nome: m.nome, categoria: 'fx', country: m.country, moeda: 'BRL', unidade: 'R$', frequencia: 'diaria' }, pontos)
      total += pontos.length
    }
    await marcar(supabase, sourceId, true)
    return `${total} pontos`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── Matérias-primas (FMI, Primary Commodity Prices — mensal) ───
export const COMMODITIES_FMI = [
  { codigo: 'FMI:SOJA', fmi: 'PSOYB', nome: 'Soja em grão (US$/tonelada, FMI)', unidade: 'US$/t' },
  { codigo: 'FMI:MILHO', fmi: 'PMAIZMT', nome: 'Milho (US$/tonelada, FMI)', unidade: 'US$/t' },
  { codigo: 'FMI:CAFE', fmi: 'PCOFFOTM', nome: 'Café arábica (centavos de US$ por libra-peso, FMI)', unidade: 'US¢/lb' },
  { codigo: 'FMI:MINERIO', fmi: 'PIORECR', nome: 'Minério de ferro (US$/tonelada seca, FMI)', unidade: 'US$/t' },
  { codigo: 'FMI:ACUCAR', fmi: 'PSUGAISA', nome: 'Açúcar (centavos de US$ por libra-peso, FMI)', unidade: 'US¢/lb' },
] as const
const urlFmi = () => `https://api.imf.org/external/sdmx/2.1/data/IMF.RES,PCPS/G001.${COMMODITIES_FMI.map((c) => c.fmi).join('+')}.USD.M?startPeriod=${new Date().getUTCFullYear() - 2}-01`
export async function ingerirCommodities(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'FMI', tipo: 'international_org', provedor: 'Fundo Monetário Internacional — Primary Commodity Prices',
    endpoint: 'https://api.imf.org/external/sdmx/2.1/data/IMF.RES,PCPS', frequencia: 'monthly', licenca: 'uso livre com citação (FMI)',
  })
  try {
    const res = await buscarComRetentativa(urlFmi(), { headers: { Accept: 'application/vnd.sdmx.data+csv;version=1.0.0' }, timeoutMs: 30000 })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const series = lerCsvFmi(await res.text())
    let total = 0
    for (const c of COMMODITIES_FMI) {
      const pts = series.get(c.fmi) ?? []
      await gravarSerie(supabase, sourceId, { codigo: c.codigo, nome: c.nome, categoria: 'commodity', country: 'WORLD', moeda: 'USD', unidade: c.unidade, frequencia: 'mensal_defasada' }, pts)
      total += pts.length
    }
    await marcar(supabase, sourceId, true)
    return `${total} pontos`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── IBGE (vendas do comércio, serviços, indústria — índice com ajuste sazonal) ───
export const SERIES_IBGE = [
  { codigo: 'IBGE:VAREJO', nome: 'Vendas do comércio varejista (volume, índice 2022=100, IBGE/PMC)', q: '8880/periodos/-24/variaveis/7170?localidades=N1[all]&classificacao=11046[56734]' },
  { codigo: 'IBGE:SERVICOS', nome: 'Volume de serviços (índice 2022=100, IBGE/PMS)', q: '5906/periodos/-24/variaveis/7168?localidades=N1[all]&classificacao=11046[56726]' },
  { codigo: 'IBGE:INDUSTRIA', nome: 'Produção industrial (índice 2022=100, IBGE/PIM)', q: '8888/periodos/-24/variaveis/12607?localidades=N1[all]&classificacao=544[129314]' },
] as const

export async function ingerirIbge(supabase: SupabaseClient): Promise<string> {
  // Mesmo nome da fonte cadastrada no Push 01 (estava "sem nenhuma coleta").
  const sourceId = await garantirFonte(supabase, {
    nome: 'IBGE Dados Abertos', tipo: 'statistics_api', provedor: 'Instituto Brasileiro de Geografia e Estatística (IBGE)',
    endpoint: 'https://servicodados.ibge.gov.br/api/v3/agregados', frequencia: 'monthly', licenca: 'dados abertos (IBGE)',
  })
  let total = 0
  const erros: string[] = []
  for (const s of SERIES_IBGE) {
    try {
      const res = await buscarComRetentativa(`https://servicodados.ibge.gov.br/api/v3/agregados/${s.q}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as { resultados?: { series?: { serie?: Record<string, string> }[] }[] }[]
      const serie = json[0]?.resultados?.[0]?.series?.[0]?.serie ?? {}
      const pts = Object.entries(serie)
        .filter(([per, v]) => /^\d{6}$/.test(per) && v !== '' && Number.isFinite(Number(v)))
        .map(([per, v]) => ({ data: fimDoMes(Number(per.slice(0, 4)), Number(per.slice(4, 6))), valor: Number(v) }))
      await gravarSerie(supabase, sourceId, { codigo: s.codigo, nome: s.nome, categoria: 'economic_activity', country: 'BR', unidade: 'índice', frequencia: 'mensal_defasada' }, pts)
      total += pts.length
    } catch (err) {
      erros.push(`${s.codigo}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  await marcar(supabase, sourceId, erros.length === 0)
  return erros.length ? `${total} pontos; erros: ${erros.join(' | ')}` : `${total} pontos`
}

// ─── ANP (preço médio nos postos do Brasil, semanal) ───
const PAGINA_ANP = 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas'
export const COMBUSTIVEIS_ANP = [
  { codigo: 'ANP:GASOLINA', produto: 'GASOLINA COMUM', nome: 'Gasolina comum (R$/litro, média Brasil, ANP)', unidade: 'R$/l' },
  { codigo: 'ANP:DIESEL', produto: 'OLEO DIESEL S10', nome: 'Óleo diesel S10 (R$/litro, média Brasil, ANP)', unidade: 'R$/l' },
  { codigo: 'ANP:ETANOL', produto: 'ETANOL HIDRATADO', nome: 'Etanol hidratado (R$/litro, média Brasil, ANP)', unidade: 'R$/l' },
  { codigo: 'ANP:GLP', produto: 'GLP', nome: 'Gás de cozinha GLP (R$/botijão 13 kg, média Brasil, ANP)', unidade: 'R$/13kg' },
] as const

export async function ingerirAnp(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'ANP', tipo: 'regulatory_source', provedor: 'Agência Nacional do Petróleo, Gás Natural e Biocombustíveis (ANP)',
    endpoint: PAGINA_ANP, frequencia: 'weekly', licenca: 'dados abertos (ANP)',
  })
  try {
    const pag = await buscarComRetentativa(PAGINA_ANP, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AxiomaNexus/1.0)' } })
    if (!pag.ok) throw new Error(`página HTTP ${pag.status}`)
    // 4 semanas mais recentes por coleta (~300 KB cada); o histórico vai se acumulando no banco.
    const links = linksResumoAnp(await pag.text()).slice(0, 4)
    if (links.length === 0) throw new Error('nenhum resumo semanal na página')
    const porCodigo = new Map<string, Ponto[]>()
    for (const url of links) {
      const res = await buscarComRetentativa(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AxiomaNexus/1.0)' }, timeoutMs: 30000 })
      if (!res.ok) continue
      const wb = XLSX.read(Buffer.from(await res.arrayBuffer()), { type: 'buffer' })
      const aba = wb.Sheets['BRASIL']
      if (!aba) continue
      const precos = lerResumoAnp(XLSX.utils.sheet_to_json<unknown[]>(aba, { header: 1 }))
      for (const c of COMBUSTIVEIS_ANP) {
        const p = precos.get(c.produto)
        if (p) porCodigo.set(c.codigo, [...(porCodigo.get(c.codigo) ?? []), p])
      }
    }
    let total = 0
    for (const c of COMBUSTIVEIS_ANP) {
      const pts = porCodigo.get(c.codigo) ?? []
      await gravarSerie(supabase, sourceId, { codigo: c.codigo, nome: c.nome, categoria: 'energy', country: 'BR', moeda: 'BRL', unidade: c.unidade, frequencia: 'semanal' }, pts)
      total += pts.length
    }
    await marcar(supabase, sourceId, true)
    return `${total} pontos`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── Comex Stat (MDIC) — exportações e importações do Brasil, mensal ───
export const SERIES_COMEX = [
  { codigo: 'COMEX:EXPORT', flow: 'export', nome: 'Exportações do Brasil (US$ bilhões no mês, Comex Stat/MDIC)' },
  { codigo: 'COMEX:IMPORT', flow: 'import', nome: 'Importações do Brasil (US$ bilhões no mês, Comex Stat/MDIC)' },
] as const

export async function ingerirComex(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'Comex Stat', tipo: 'trade_data', provedor: 'Ministério do Desenvolvimento, Indústria, Comércio e Serviços (MDIC)',
    endpoint: 'https://api-comexstat.mdic.gov.br/general', frequencia: 'monthly', licenca: 'dados abertos (MDIC)',
  })
  const ano = new Date().getUTCFullYear()
  let total = 0
  const erros: string[] = []
  for (const s of SERIES_COMEX) {
    try {
      const res = await buscarComRetentativa('https://api-comexstat.mdic.gov.br/general', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, timeoutMs: 30000,
        body: JSON.stringify({ flow: s.flow, monthDetail: true, period: { from: `${ano - 1}-01`, to: `${ano}-12` }, metrics: ['metricFOB'] }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const pts = lerComex(await res.json())
      await gravarSerie(supabase, sourceId, { codigo: s.codigo, nome: s.nome, categoria: 'trade', country: 'BR', moeda: 'USD', unidade: 'US$ bi', frequencia: 'mensal_defasada' }, pts)
      total += pts.length
    } catch (err) {
      erros.push(`${s.codigo}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  await marcar(supabase, sourceId, erros.length === 0)
  return erros.length ? `${total} pontos; erros: ${erros.join(' | ')}` : `${total} pontos`
}

// ─── OCDE — indicador antecedente composto (ciclo econômico), mensal ───
// Acima de 100 = economia tende a crescer acima da tendência nos próximos meses.
export const PAISES_OCDE = [
  { area: 'BRA', nome: 'Brasil' }, { area: 'CHN', nome: 'China' }, { area: 'USA', nome: 'EUA' }, { area: 'G20', nome: 'G20' },
] as const
const URL_DBNOMICS_OCDE = () => `https://api.db.nomics.world/v22/series/OECD/DSD_STES@DF_CLI?observations=1&limit=10&dimensions=${encodeURIComponent(JSON.stringify({ REF_AREA: PAISES_OCDE.map((p) => p.area), FREQ: ['M'], MEASURE: ['LI'], ADJUSTMENT: ['AA'], TRANSFORMATION: ['IX'], METHODOLOGY: ['H'] }))}`
const URL_OCDE = () => `https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI,/${PAISES_OCDE.map((p) => p.area).join('+')}.M.LI...AA...H?startPeriod=${new Date().getUTCFullYear() - 2}-01`

export async function ingerirOcde(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'OCDE', tipo: 'international_org', provedor: 'Organização para a Cooperação e Desenvolvimento Econômico (OCDE)',
    endpoint: 'https://sdmx.oecd.org/public/rest/data/OECD.SDD.STES,DSD_STES@DF_CLI', frequencia: 'monthly', licenca: 'uso livre com citação (OCDE)',
  })
  try {
    // OCDE direta primeiro; ela costuma barrar IP de nuvem (Vercel nunca conseguiu) —
    // aí o mesmo indicador vem do espelho DBnomics (gratuito, ~2-3 meses mais atrasado).
    let series = new Map<string, Ponto[]>(), via = 'OCDE'
    try {
      const res = await buscarComRetentativa(URL_OCDE(), { headers: { Accept: 'application/vnd.sdmx.data+csv', 'Accept-Encoding': 'gzip' }, timeoutMs: 20000 }, [3000]) // OCDE às vezes dá 500 com br/zstd
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      series = lerCsvOcde(await res.text())
      if (!series.size) throw new Error('resposta sem dados')
    } catch (err) {
      const res = await buscarComRetentativa(URL_DBNOMICS_OCDE(), { timeoutMs: 20000 })
      if (!res.ok) throw new Error(`OCDE: ${err instanceof Error ? err.message : String(err)}; DBnomics: HTTP ${res.status}`)
      series = lerDbnomicsOcde(await res.json(), new Date().getUTCFullYear() - 2)
      via = `DBnomics (OCDE direta: ${err instanceof Error ? err.message : String(err)})`
    }
    let total = 0
    for (const p of PAISES_OCDE) {
      const pts = series.get(p.area) ?? []
      await gravarSerie(supabase, sourceId, { codigo: `OCDE:CLI:${p.area}`, nome: `Indicador antecedente da OCDE — ${p.nome} (100 = tendência; acima = aceleração à frente)`, categoria: 'leading_indicator', country: p.area, unidade: 'índice', frequencia: 'mensal_defasada' }, pts)
      total += pts.length
    }
    await marcar(supabase, sourceId, true)
    return `${total} pontos via ${via}`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── GDELT (conflitos, sanções, tarifas, acordos comerciais) ───
// DOC API gratuita, sem cadastro. Limite: 1 consulta a cada 5s — por isso só
// 2 consultas, com 6s entre elas. Manchetes em inglês, canal 'geopolitica':
// NÃO vão pra TV (os canais da TV são outros); servem de contexto pro José,
// que escreve a leitura dele no idioma de quem lê.
export const CANAL_GEOPOLITICA = 'geopolitica'
const CONSULTAS_GDELT = [
  '(brazil OR brazilian) (tariff OR sanctions OR "trade agreement" OR "trade deal" OR embargo OR "trade war")',
  '(tariff OR sanctions OR embargo OR "trade war" OR "oil supply" OR "shipping route" OR ceasefire OR invasion)',
]
const urlGdelt = (q: string) => `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`${q} sourcelang:english`)}&mode=artlist&maxrecords=12&format=json&timespan=2d&sort=hybridrel`

const RESERVAS_GEOPOLITICA = [
  { nome: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { nome: 'ONU News', url: 'https://news.un.org/feed/subscribe/en/news/all/rss.xml' },
  { nome: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
]
// Mesmos assuntos das consultas do GDELT (comércio, sanções, conflitos, energia, rotas).
export const PALAVRAS_GEOPOLITICA = /tariff|sanction|embargo|trade (war|deal|agreement|talks)|ceasefire|invasion|\bwars?\b|conflict|missile|troops|attack|\boil\b|opec|shipping|strait|blockade|export|import|brazil|china|nato|nuclear/i

// "20260927T120000Z" → ISO
const dataGdelt = (s: string) => s.length >= 15 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z` : null

export async function ingerirGdelt(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'GDELT', tipo: 'news_source', provedor: 'The GDELT Project',
    endpoint: 'https://api.gdeltproject.org/api/v2/doc/doc', frequencia: 'daily', licenca: 'uso livre com citação (GDELT)',
  })
  const vistos = new Map<string, Record<string, unknown>>()
  const erros: string[] = []
  for (const [i, q] of CONSULTAS_GDELT.entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 6000))
    try {
      const res = await buscarComRetentativa(urlGdelt(q), {}, [6000, 12000]) // limite do GDELT: 1 pedido a cada 5s
      const texto = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      // Estourou o limite ou não achou nada: GDELT devolve texto/objeto vazio, não erro HTTP.
      const json = texto.trim().startsWith('{') ? JSON.parse(texto) as { articles?: { url: string; title: string; seendate: string; socialimage?: string }[] } : null
      if (!json) throw new Error(`resposta não-JSON: ${texto.slice(0, 80)}`)
      for (const a of json.articles ?? []) {
        if (!a.url || !a.title || vistos.has(a.url)) continue
        vistos.set(a.url, {
          source_id: sourceId, title: a.title, original_title: a.title, original_language: 'en',
          publication_date: dataGdelt(a.seendate), canonical_url: a.url, imagem_url: a.socialimage || null, canal: CANAL_GEOPOLITICA,
        })
      }
    } catch (err) {
      erros.push(err instanceof Error ? err.message : String(err))
    }
  }
  const doGdelt = vistos.size
  await marcar(supabase, sourceId, doGdelt > 0 && erros.length < CONSULTAS_GDELT.length)

  // O GDELT recusa por limite (429) quase sempre de IP de nuvem — o mundo nunca
  // pode ficar sem manchete no Nexus. RSS internacionais abertos rodam SEMPRE junto,
  // filtrados pelos mesmos assuntos, cada um com a própria fonte na Saúde das fontes.
  const reservas = await Promise.all(RESERVAS_GEOPOLITICA.map(async (f) => {
    const id = await garantirFonte(supabase, { nome: f.nome, tipo: 'news_source', provedor: f.nome, endpoint: f.url, frequencia: 'hourly', licenca: 'RSS público — só manchete e link, com crédito, como contexto do José' })
    try {
      const itens = (await buscarFeedRSS(f.url)).filter((it) => PALAVRAS_GEOPOLITICA.test(it.titulo)).slice(0, 10)
      for (const it of itens) if (!vistos.has(it.url_original)) vistos.set(it.url_original, {
        source_id: id, title: it.titulo, original_title: it.titulo, original_language: 'en',
        publication_date: it.data, canonical_url: it.url_original, imagem_url: it.imagem_url, canal: CANAL_GEOPOLITICA,
      })
      await marcar(supabase, id, true)
      return `${f.nome}: ${itens.length}`
    } catch (err) {
      await marcar(supabase, id, false)
      return `${f.nome}: erro ${err instanceof Error ? err.message : String(err)}`
    }
  }))

  const linhas = [...vistos.values()]
  if (linhas.length) {
    // varredura:ok — service role; erro checado logo abaixo
    const { error } = await supabase.from('nexus_news').upsert(linhas, { onConflict: 'canonical_url' })
    if (error) erros.push(error.message)
  }
  return `${linhas.length} manchetes (GDELT ${doGdelt}; ${reservas.join('; ')})${erros.length ? `; erros: ${erros.join(' | ')}` : ''}`
}
