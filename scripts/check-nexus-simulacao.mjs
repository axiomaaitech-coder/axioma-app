// Self-check do "E se...?" do Nexus: node --no-warnings scripts/check-nexus-simulacao.mjs
import assert from 'node:assert/strict'
import { macroParaChoque, VARIAVEIS_ZERO, variaveisDoEvento } from '../lib/nexusSimulacaoMotor.ts'

const v = (o) => ({ ...VARIAVEIS_ZERO, ...o })

// Sem choque: nada muda
assert.deepEqual(macroParaChoque(VARIAVEIS_ZERO), { receitaPct: 0, custoFixoPct: 0, custoVariavelPct: 0, jurosDividaPontos: 0, aporteCapital: 0, retornoMensalAporte: 0 })

// Dólar sem exposição declarada não afeta nada (nunca estimar exposição)
assert.equal(macroParaChoque(v({ dolarPct: 20 })).custoVariavelPct, 0)
// Dólar +20% com 30% do custo variável em dólar → custo variável +6%
assert.equal(macroParaChoque(v({ dolarPct: 20, exposicaoCambialPct: 30 })).custoVariavelPct, 6)

// Selic +2 com 100% pós-fixada → +2 pontos nos juros; com 50% → +1
assert.equal(macroParaChoque(v({ selicPontos: 2 })).jurosDividaPontos, 2)
assert.equal(macroParaChoque(v({ selicPontos: 2, dividaPosFixadaPct: 50 })).jurosDividaPontos, 1)

// Inflação +3: custos +3; preço só sobe o que for repassado
const inf = macroParaChoque(v({ ipcaPontos: 3, repassePrecoPct: 50 }))
assert.equal(inf.custoFixoPct, 3); assert.equal(inf.custoVariavelPct, 3); assert.equal(inf.receitaPct, 1.5)

// Petróleo +30% com 20% do custo em combustível → +6%
assert.equal(macroParaChoque(v({ petroleoPct: 30, pesoCombustivelPct: 20 })).custoVariavelPct, 6)

// Choques somam no custo variável
assert.equal(macroParaChoque(v({ dolarPct: 10, exposicaoCambialPct: 50, petroleoPct: 10, pesoCombustivelPct: 10, ipcaPontos: 2 })).custoVariavelPct, 8)

// Evento → preset
assert.deepEqual(variaveisDoEvento('432', -0.25), { selicPontos: -0.25 })
assert.deepEqual(variaveisDoEvento('1', 3.1), { dolarPct: 3.1 })
assert.equal(variaveisDoEvento('21621', 3.1), null)
assert.equal(variaveisDoEvento('24369', 0.3), null)

console.log('OK — E se...? do Nexus')
