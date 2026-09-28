// Leitores puros das respostas do BCE (CSV) e do FMI (CSV SDMX) — sem rede,
// sem banco, pra poder testar: node scripts/check-nexus-eventos.mjs
export type Ponto = { data: string; valor: number }

// Código BCB → código BCE da mesma moeda (R$ por unidade): fonte reserva e confirmação.
export const RESERVA_BCE: Record<string, string> = { '1': 'BCE:USD', '21619': 'BCE:EUR', '21623': 'BCE:GBP', '21621': 'BCE:JPY' }

// Usa a reserva só quando o BCB está atrasado: sem dado, ou 3+ dias atrás do BCE.
export function usarReserva(dataPrincipal: string | null, dataReserva: string | null): boolean {
  if (!dataReserva) return false
  if (!dataPrincipal) return true
  return (Date.parse(dataReserva) - Date.parse(dataPrincipal)) / 86400000 >= 3
}

// R$ por moeda X = (R$ por euro) ÷ (X por euro), na mesma data; o euro é o próprio R$/EUR.
// CSV do BCE: KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,...
export function moedasEmReais(csv: string): Map<string, Ponto[]> {
  const porMoeda = new Map<string, Map<string, number>>()
  for (const linha of csv.split('\n').slice(1)) {
    const c = linha.split(',')
    const v = Number(c[7])
    if (!c[2] || !c[6] || !Number.isFinite(v) || v <= 0) continue
    if (!porMoeda.has(c[2])) porMoeda.set(c[2], new Map())
    porMoeda.get(c[2])!.set(c[6], v)
  }
  const brl = porMoeda.get('BRL') ?? new Map<string, number>()
  const out = new Map<string, Ponto[]>()
  out.set('EUR', [...brl].map(([data, v]) => ({ data, valor: Math.round(v * 1e4) / 1e4 })).sort((a, b) => a.data.localeCompare(b.data)))
  for (const [moeda, serie] of porMoeda) {
    if (moeda === 'BRL') continue
    out.set(moeda, [...brl].filter(([d]) => serie.has(d))
      .map(([data, v]) => ({ data, valor: Math.round((v / serie.get(data)!) * 1e6) / 1e6 }))
      .sort((a, b) => a.data.localeCompare(b.data)))
  }
  return out
}

// Último dia do mês (2026, 8) → 2026-08-31.
export const fimDoMes = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10)

// CSV do FMI: DATAFLOW,COUNTRY,INDICATOR,DATA_TRANSFORMATION,FREQUENCY,TIME_PERIOD(2026-M08),OBS_VALUE,...
// As 7 primeiras colunas nunca têm vírgula dentro; o texto longo entre aspas vem depois.
export function lerCsvFmi(csv: string): Map<string, Ponto[]> {
  const out = new Map<string, Ponto[]>()
  for (const linha of csv.split('\n').slice(1)) {
    const c = linha.split(',')
    const m = /^(\d{4})-M(\d{2})$/.exec(c[5] ?? '')
    const v = Number(c[6])
    if (!m || !Number.isFinite(v)) continue
    out.set(c[2], [...(out.get(c[2]) ?? []), { data: fimDoMes(Number(m[1]), Number(m[2])), valor: Math.round(v * 100) / 100 }])
  }
  for (const pts of out.values()) pts.sort((a, b) => a.data.localeCompare(b.data))
  return out
}


// ─── ANP — resumo semanal de preços nos postos (planilha, aba BRASIL) ───
// Links "resumo_semanal_lpc_*.xlsx" da página da ANP, do mais novo pro mais antigo
// (a página já lista nessa ordem; o nome do arquivo não tem padrão fixo de data).
export function linksResumoAnp(html: string): string[] {
  const vistos = new Set<string>()
  for (const m of html.matchAll(/href="([^"]*resumo_semanal_lpc_[^"]+\.xlsx)"/g)) vistos.add(m[1])
  return [...vistos]
}

// Linhas da aba BRASIL (sheet_to_json header:1): DATA INICIAL, DATA FINAL, BRASIL,
// PRODUTO, Nº POSTOS, UNIDADE, PREÇO MÉDIO REVENDA, ... Datas vêm como número serial
// do Excel. Devolve produto → ponto (data = fim da semana, valor = preço médio).
export function lerResumoAnp(linhas: unknown[][]): Map<string, Ponto> {
  const out = new Map<string, Ponto>()
  for (const l of linhas) {
    const fim = Number(l[1]), produto = String(l[3] ?? '').trim(), preco = Number(l[6])
    if (l[2] !== 'BRASIL' || !produto || !Number.isFinite(fim) || !Number.isFinite(preco) || preco <= 0) continue
    const data = new Date(Date.UTC(1899, 11, 30) + fim * 86400000).toISOString().slice(0, 10)
    out.set(produto, { data, valor: preco })
  }
  return out
}

// ─── OCDE — indicador antecedente composto (CLI), CSV SDMX ───
// Colunas: DATAFLOW,REF_AREA,FREQ,...,TIME_PERIOD(2026-08),OBS_VALUE,... — posição
// achada pelo cabeçalho. Data = último dia do mês.
export function lerCsvOcde(csv: string): Map<string, Ponto[]> {
  const [cab, ...linhas] = csv.split('\n')
  const col = cab.split(',')
  const iArea = col.indexOf('REF_AREA'), iPer = col.indexOf('TIME_PERIOD'), iVal = col.indexOf('OBS_VALUE')
  const out = new Map<string, Ponto[]>()
  if (iArea < 0 || iPer < 0 || iVal < 0) return out
  for (const linha of linhas) {
    const c = linha.split(',')
    const m = /^(\d{4})-(\d{2})$/.exec(c[iPer] ?? '')
    const v = Number(c[iVal])
    if (!m || !Number.isFinite(v)) continue
    out.set(c[iArea], [...(out.get(c[iArea]) ?? []), { data: fimDoMes(Number(m[1]), Number(m[2])), valor: Math.round(v * 100) / 100 }])
  }
  for (const pts of out.values()) pts.sort((a, b) => a.data.localeCompare(b.data))
  return out
}

// ─── OCDE via DBnomics (espelho gratuito) — reserva quando a OCDE barra a nuvem ───
// JSON: series.docs[] com dimensions.REF_AREA, period[] (2026-05) e value[] (número ou "NA").
export function lerDbnomicsOcde(json: { series?: { docs?: { dimensions?: { REF_AREA?: string }; period?: string[]; value?: (number | string)[] }[] } }, desdeAno: number): Map<string, Ponto[]> {
  const out = new Map<string, Ponto[]>()
  for (const s of json.series?.docs ?? []) {
    const area = s.dimensions?.REF_AREA
    if (!area) continue
    const pts: Ponto[] = []
    ;(s.period ?? []).forEach((per, i) => {
      const m = /^(\d{4})-(\d{2})$/.exec(per)
      const v = Number(s.value?.[i])
      if (m && Number(m[1]) >= desdeAno && typeof s.value?.[i] === 'number' && Number.isFinite(v)) pts.push({ data: fimDoMes(Number(m[1]), Number(m[2])), valor: Math.round(v * 100) / 100 })
    })
    out.set(area, pts)
  }
  return out
}

// ─── Comex Stat (MDIC) — total mensal exportado/importado, US$ FOB ───
export function lerComex(json: { data?: { list?: { year: string; monthNumber: string; metricFOB: string }[] } }): Ponto[] {
  return (json.data?.list ?? [])
    .map((l) => ({ data: fimDoMes(Number(l.year), Number(l.monthNumber)), valor: Math.round(Number(l.metricFOB) / 1e7) / 100 })) // US$ bilhões
    .filter((p) => Number.isFinite(p.valor) && p.valor > 0)
    .sort((a, b) => a.data.localeCompare(b.data))
}
