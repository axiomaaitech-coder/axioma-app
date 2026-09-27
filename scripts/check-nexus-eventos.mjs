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
