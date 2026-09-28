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

