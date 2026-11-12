// Split payment: contas conferidas à mão.
import assert from 'node:assert/strict'
const { simularSplit, CENARIOS_SPLIT } = await import('../lib/splitPayment')
// Receita 100 mil, 100% tributável, compras com crédito 40 mil, 11,3%, 40 dias no caixa hoje
const r = simularSplit({ receitaMensal: 100000, pctTributavel: 100, comprasComCreditoMensal: 40000, aliquotaPct: 11.3, diasImpostoNoCaixa: 40, caixaHoje: 10000 })
assert.equal(r.retidoBruto, 11300)            // 100.000 × 11,3%
assert.equal(r.creditos, 4520)                // 40.000 × 11,3%
assert.equal(r.retidoLiquido, 6780)           // 11.300 − 4.520
assert.equal(r.capitalGiroLiquido, 9040)      // 6.780 × 40/30
assert.equal(r.capitalGiroPiorCaso, 15066.67) // 11.300 × 40/30
assert.equal(r.pctReceitaRetida, 11.3)
assert.equal(r.caixaCobre, false)
assert.ok(r.alertas.some((a) => /cenário com créditos/.test(a)))
// metade tributável: base 50 mil; compras maiores que a base são limitadas e geram aviso
const m = simularSplit({ receitaMensal: 100000, pctTributavel: 50, comprasComCreditoMensal: 60000, aliquotaPct: 10, diasImpostoNoCaixa: 30 })
assert.equal(m.base, 50000); assert.equal(m.retidoBruto, 5000); assert.equal(m.creditos, 5000); assert.equal(m.retidoLiquido, 0)
assert.ok(m.alertas.some((a) => /passam da receita/.test(a)))
// sem receita não inventa número
const z = simularSplit({ receitaMensal: 0, pctTributavel: 100, comprasComCreditoMensal: 0, aliquotaPct: 11.3, diasImpostoNoCaixa: 40 })
assert.equal(z.retidoBruto, 0); assert.equal(z.pctReceitaRetida, 0); assert.equal(z.caixaCobre, null)
assert.deepEqual(CENARIOS_SPLIT.map((c) => c.aliquotaPct), [11.3, 9.21, 27.91, 26.5])
console.log('check-split: ok')
