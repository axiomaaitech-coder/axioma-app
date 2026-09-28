// Leitores puros das respostas do BCE (CSV) e do FMI (CSV SDMX) — sem rede,
// sem banco, pra poder testar: node scripts/check-nexus-eventos.mjs
export type Ponto = { data: string; valor: number }

// R$ por yuan = (R$ por euro) ÷ (yuan por euro), na mesma data.
export function yuanEmReais(csv: string): Ponto[] {
  const brl = new Map<string, number>(), cny = new Map<string, number>()
  for (const linha of csv.split('\n').slice(1)) {
    const c = linha.split(',') // KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE,...
    const v = Number(c[7])
    if (!c[6] || !Number.isFinite(v) || v <= 0) continue
    if (c[2] === 'BRL') brl.set(c[6], v)
    if (c[2] === 'CNY') cny.set(c[6], v)
  }
  return [...brl].filter(([d]) => cny.has(d))
    .map(([data, v]) => ({ data, valor: Math.round((v / cny.get(data)!) * 1e4) / 1e4 }))
    .sort((a, b) => a.data.localeCompare(b.data))
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

