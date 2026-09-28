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
import { calcularFreshness } from './nexusFreshness'
import { buscarComRetentativa } from './nexusRede'
import { moedasEmReais, lerCsvFmi, fimDoMes, type Ponto } from './nexusLeitoresFontes'

type Fonte = { nome: string; tipo: string; provedor: string; endpoint: string; frequencia: string; licenca: string }

async function garantirFonte(supabase: SupabaseClient, f: Fonte): Promise<string> {
  const { data: existente } = await supabase.from('nexus_source').select('source_id').eq('source_name', f.nome).maybeSingle()
  if (existente?.source_id) return existente.source_id as string
  const { data, error } = await supabase.from('nexus_source').insert({
    source_name: f.nome, source_type: f.tipo, provider: f.provedor, country: 'WORLD', endpoint: f.endpoint,
    license: f.licenca, access_type: 'public', auth_type: 'none', update_frequency: f.frequencia, active: true,
  }).select('source_id').single()
  if (error || !data) throw new Error(`cadastro da fonte ${f.nome}: ${error?.message}`)
  return data.source_id as string
}

async function marcar(supabase: SupabaseClient, sourceId: string, ok: boolean) {
  await supabase.from('nexus_source').update(ok ? { last_success: new Date().toISOString() } : { last_failure: new Date().toISOString() }).eq('source_id', sourceId)
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
  const linhas = [...vistos.values()]
  if (linhas.length) {
    const { error } = await supabase.from('nexus_news').upsert(linhas, { onConflict: 'canonical_url' })
    if (error) erros.push(error.message)
  }
  await marcar(supabase, sourceId, linhas.length > 0 && erros.length < CONSULTAS_GDELT.length)
  return erros.length ? `${linhas.length} manchetes; erros: ${erros.join(' | ')}` : `${linhas.length} manchetes`
}
