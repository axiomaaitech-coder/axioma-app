// Simulador "Contratar ou não": contas conferidas à mão.
import assert from 'node:assert/strict'
const S = await import('../lib/rhSimulacao')

const base = { receitaMediaMensal: 50000, lucroMedioMensal: 6000, custoPessoalAtual: 9288, caixa: 20000 }
// R$ 3.000 no Simples, início em nov/2026: custo mensal 3.870,00 (mesma conta do custo de pessoal)
const r = S.simularContratacao({ salario: 3000, quantidade: 1, codCateg: '101', regime: 'simples', mesInicio: '2026-11', base })!
assert.equal(r.custo_mensal_total, 3870); assert.equal(r.custo_12_meses, 46440)
const mes = (m: string) => r.fluxo.find((x) => x.mes === m)!.valor
// nov: só a 1ª parcela do 13º (2/12 de 3.000 = 500 → metade 250)
assert.equal(mes('2026-11'), 250)
// dez: salário de nov 3.000 + FGTS 240 + 2ª parcela 250 + FGTS da 1ª parcela 20
assert.equal(mes('2026-12'), 3510)
// jan: salário de dez 3.000 + FGTS 240 + FGTS da 2ª parcela 20
assert.equal(mes('2027-01'), 3260)
// fev a nov/2027: salário + FGTS do mês anterior (o 13º de 2027 cai fora da janela)
assert.equal(mes('2027-06'), 3240); assert.equal(mes('2027-11'), 3240)
assert.equal(r.caixa_primeiro_ano, 39420)
// impacto: lucro 6.000 − 3.870 = 2.130; pessoal 9.288 → 13.158 sobre 50.000 = 18,6% → 26,3%; fôlego 20.000 / 3.870 = 5 meses
assert.equal(r.impacto.lucro_medio_mensal_depois, 2130)
assert.equal(r.impacto.pessoal_sobre_faturamento_antes_pct, 18.6); assert.equal(r.impacto.pessoal_sobre_faturamento_depois_pct, 26.3)
assert.equal(r.impacto.meses_de_folego_no_caixa, 5)
assert.ok(r.alertas.some((a) => /13º/.test(a)))
// 2 pessoas no Presumido: 4.586,67 × 2; lucro fica negativo → alerta
const r2 = S.simularContratacao({ salario: 3000, quantidade: 2, codCateg: '101', regime: 'presumido', mesInicio: '2027-02', base })!
assert.equal(r2.custo_mensal_total, 9173.34); assert.ok(r2.alertas.some((a) => /NEGATIVO/.test(a)))
// INSS patronal 20% entra no caixa do mês seguinte: 6.000 + 8% 480 + 20% 1.200
assert.equal(r2.fluxo.find((x) => x.mes === '2027-03')!.valor, 7680)
// sem base (empresa sem DRE): simula assim mesmo, impacto vazio
const r3 = S.simularContratacao({ salario: 1621, quantidade: 1, codCateg: '103', regime: 'simples', mesInicio: '2027-01', base: { receitaMediaMensal: null, lucroMedioMensal: null, custoPessoalAtual: null, caixa: null } })!
assert.equal(r3.impacto.lucro_medio_mensal_depois, null); assert.ok(r3.custo_mensal_total > 1621)
assert.equal(S.simularContratacao({ salario: 0, quantidade: 1, codCateg: '101', regime: 'simples', mesInicio: '2027-01', base }), null)
// IA: pergunta de contratar abre o simulador; "contrato do Bruno" não
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
for (const q of ['Posso contratar alguém de R$ 2.500?', 'quanto custa contratar 2 vendedores', 'vale a pena abrir uma nova vaga?']) assert.ok(planejarConsulta(q, 'rh').portas.includes('rh_simular_contratacao'), q)
assert.ok(!planejarConsulta('quando acaba o contrato do Bruno', 'rh').portas.includes('rh_simular_contratacao'))
assert.ok(planejarConsulta('posso contratar mais um?', 'centros-custo').portas.includes('rh_simular_contratacao'))
// folha fora da DRE e pessoal acima do faturamento viram aviso (lucro da DRE inflado)
const r4 = S.simularContratacao({ salario: 3000, quantidade: 1, codCateg: '101', regime: 'simples', mesInicio: '2026-12', base: { receitaMediaMensal: 8166.79, lucroMedioMensal: 6393.69, custoPessoalAtual: 9288, caixa: 100000, folhaForaDaDre: true } })!
assert.ok(r4.alertas.some((a) => /MAIOR que o real/.test(a)) && r4.alertas.some((a) => /passa do faturamento/.test(a)))
assert.equal(r4.fluxo[0].valor, 250) // dez: só a 2ª parcela do 13º (1/12)
console.log('check-rh-simulacao ok')
