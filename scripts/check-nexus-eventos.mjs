// Self-check do detector de eventos do Nexus: node scripts/check-nexus-eventos.mjs
import assert from 'node:assert/strict'
import { detectarEventosSerie, textoEvento, travaDaVerdade } from '../lib/nexusEventDetector.ts'

// ini padrão numa segunda-feira: 7 pontos cabem na mesma semana ISO
const dias = (vals, ini = '2026-09-07') => vals.map((valor, i) => {
  const d = new Date(`${ini}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + i)
  return { data: d.toISOString().slice(0, 10), valor }
})

// Dólar calmo: nenhum evento
assert.equal(detectarEventosSerie('1', dias([5.0, 5.01, 5.02, 5.0, 5.03, 5.04, 5.02])).length, 0)

// Dólar +4% em 5 obs, com alta seguindo na mesma semana: 1 evento só, o maior
const fx = detectarEventosSerie('1', dias([5.0, 5.05, 5.1, 5.12, 5.15, 5.2, 5.25]))
assert.equal(fx.length, 1)
assert.equal(fx[0].natureza, 'signal')
assert.equal(fx[0].payload.direcao, 'alta')
assert.ok(fx[0].payload.variacao >= 3)
// idempotente: mesmo histórico → mesma chave
assert.equal(detectarEventosSerie('1', dias([5.0, 5.05, 5.1, 5.12, 5.15, 5.2, 5.25]))[0].source_event_ref, fx[0].source_event_ref)

// Queda do euro
assert.equal(detectarEventosSerie('21619', dias([6, 5.95, 5.9, 5.85, 5.8, 5.75]))[0].payload.direcao, 'queda')

// Selic: só onde muda, como decisão oficial
const selic = detectarEventosSerie('432', dias([14, 14, 14.5, 14.5, 14.25]))
assert.equal(selic.length, 2)
assert.ok(selic.every((e) => e.natureza === 'official_decision'))
assert.match(textoEvento(selic[0].payload, 'pt').titulo, /eleva a Selic para 14,50%/)
assert.match(textoEvento(selic[1].payload, 'en').titulo, /cuts Selic to 14.25%/)

// IPCA: forte e deflação viram fato; mês normal não
const ipca = detectarEventosSerie('433', dias([0.3, 0.62, 0.2, -0.11], '2026-01-01'))
assert.deepEqual(ipca.map((e) => e.event_type), ['ipca_forte', 'ipca_deflacao'])

// Desemprego: 0,3 p.p. dispara, 0,1 não
assert.equal(detectarEventosSerie('24369', dias([5.6, 5.3, 5.2])).length, 1)

// Atividade: ±1%
assert.equal(detectarEventosSerie('24363', dias([110, 111.5, 111.6])).length, 1)

// Série desconhecida: nada
assert.equal(detectarEventosSerie('999', dias([1, 100])).length, 0)

// Gravidade sempre 0-100
for (const e of [...fx, ...selic, ...ipca]) assert.ok(e.severity >= 0 && e.severity <= 100)

assert.equal(travaDaVerdade('official', 'pt').nivel, 'oficial')
assert.equal(travaDaVerdade(null, 'es').nivel, 'nao_confirmado')

console.log('OK — detector de eventos do Nexus')

// Régua de atualidade (lib/nexusFreshness.ts)
const { calcularFreshness } = await import('../lib/nexusFreshness.ts')
const hoje = new Date('2026-09-26T12:00:00Z')
assert.equal(calcularFreshness('2026-09-25', 'diaria', hoje), 'live')
assert.equal(calcularFreshness('2026-09-10', 'diaria', hoje), 'stale')
assert.equal(calcularFreshness('2026-07-01', 'mensal_defasada', hoje), 'live') // desemprego de julho, publicado em setembro
assert.equal(calcularFreshness('2026-07-01', 'mensal', hoje), 'stale')
assert.equal(calcularFreshness('lixo', 'diaria', hoje), 'unknown')
console.log('OK — régua de atualidade')

// Petróleo: ±8% em 5 pregões vira sinal de energia; oscilação menor não
const brentForte = detectarEventosSerie('IPEA:BRENT', dias([127.8, 124, 121, 119.7, 116, 114.9]))
assert.equal(brentForte.length, 1)
assert.equal(brentForte[0].category, 'energy')
assert.equal(brentForte[0].payload.direcao, 'queda')
assert.match(textoEvento(brentForte[0].payload, 'pt').titulo, /Petróleo despenca/)
assert.equal(detectarEventosSerie('IPEA:BRENT', dias([100, 101, 102, 101, 103, 104])).length, 0)
console.log('OK — alerta de petróleo')

// Yuan entra na regra de câmbio
assert.equal(detectarEventosSerie('BCE:CNY', dias([0.75, 0.76, 0.77, 0.775, 0.78, 0.785]))[0].event_type, 'fx_5d')

// Matéria-prima: ±8% no mês vira sinal; 3% não
const cafe = detectarEventosSerie('FMI:CAFE', [{ data: '2026-06-30', valor: 300 }, { data: '2026-07-31', valor: 330 }, { data: '2026-08-31', valor: 335 }])
assert.equal(cafe.length, 1)
assert.equal(cafe[0].category, 'commodity')
assert.match(textoEvento(cafe[0].payload, 'pt').titulo, /Café dispara 10,0% no mês/)

// Setor do IBGE: ±1,5% no mês vira fato
const varejo = detectarEventosSerie('IBGE:VAREJO', [{ data: '2026-06-30', valor: 110 }, { data: '2026-07-31', valor: 108 }])
assert.equal(varejo[0].event_type, 'setor_variacao')
assert.match(textoEvento(varejo[0].payload, 'en').titulo, /Retail sales falls 1.8% in the month/)
console.log('OK — yuan, matérias-primas e setores do IBGE')

// Leitores das fontes novas
const { moedasEmReais, lerCsvFmi } = await import('../lib/nexusLeitoresFontes.ts')
const csvBce = 'KEY,FREQ,CURRENCY,CURRENCY_DENOM,EXR_TYPE,EXR_SUFFIX,TIME_PERIOD,OBS_VALUE\nEXR.D.BRL.EUR.SP00.A,D,BRL,EUR,SP00,A,2026-09-25,5.9091\nEXR.D.CNY.EUR.SP00.A,D,CNY,EUR,SP00,A,2026-09-25,7.6551\nEXR.D.CNY.EUR.SP00.A,D,CNY,EUR,SP00,A,2026-09-26,7.7'
const moedas = moedasEmReais(csvBce)
assert.deepEqual(moedas.get('CNY'), [{ data: '2026-09-25', valor: 0.771917 }])
assert.deepEqual(moedas.get('EUR'), [{ data: '2026-09-25', valor: 5.9091 }])
const csvFmi = 'DATAFLOW,COUNTRY,INDICATOR,DATA_TRANSFORMATION,FREQUENCY,TIME_PERIOD,OBS_VALUE,X\nIMF.RES:PCPS(9.0.0),G001,PSOYB,USD,M,2026-M08,449.04392,0,"texto, com vírgula"\nIMF.RES:PCPS(9.0.0),G001,PSOYB,USD,M,2026-M02,420,0'
assert.deepEqual(lerCsvFmi(csvFmi).get('PSOYB'), [{ data: '2026-02-28', valor: 420 }, { data: '2026-08-31', valor: 449.04 }])
console.log('OK — leitores BCE e FMI')

// Combustível nos postos: ±3% na semana vira fato
const diesel = detectarEventosSerie('ANP:DIESEL', [{ data: '2026-09-19', valor: 7.0 }, { data: '2026-09-26', valor: 7.33 }])
assert.equal(diesel[0].event_type, 'combustivel_semana')
assert.match(textoEvento(diesel[0].payload, 'pt').titulo, /Diesel sobe 4,7% nos postos/)
assert.equal(detectarEventosSerie('ANP:GASOLINA', [{ data: '2026-09-19', valor: 6.5 }, { data: '2026-09-26', valor: 6.55 }]).length, 0)
console.log('OK — combustíveis nos postos')

// Leitores ANP, OCDE e Comex
const { linksResumoAnp, lerResumoAnp, lerCsvOcde, lerComex } = await import('../lib/nexusLeitoresFontes.ts')
assert.deepEqual(linksResumoAnp('<a href="https://x/resumo_semanal_lpc_2026-09-20_2026-09-26.xlsx">a</a><a href="https://x/revendas_lpc_1.xlsx">b</a><a href="https://x/resumo_semanal_lpc_2026-09-20_2026-09-26.xlsx">c</a>'), ['https://x/resumo_semanal_lpc_2026-09-20_2026-09-26.xlsx'])
const anp = lerResumoAnp([['DATA INICIAL', 'DATA FINAL', 'BRASIL', 'PRODUTO'], [46285, 46291, 'BRASIL', 'OLEO DIESEL S10', 3147, 'R$/l', 7.33]])
assert.deepEqual(anp.get('OLEO DIESEL S10'), { data: '2026-09-26', valor: 7.33 })
const ocde = lerCsvOcde('DATAFLOW,REF_AREA,FREQ,TIME_PERIOD,OBS_VALUE\nX,BRA,M,2026-08,102.6276\nX,BRA,M,2026-07,102.5')
assert.deepEqual(ocde.get('BRA'), [{ data: '2026-07-31', valor: 102.5 }, { data: '2026-08-31', valor: 102.63 }])
assert.deepEqual(lerComex({ data: { list: [{ year: '2026', monthNumber: '08', metricFOB: '33157804370' }] } }), [{ data: '2026-08-31', valor: 33.16 }])
console.log('OK — leitores ANP, OCDE e Comex')
