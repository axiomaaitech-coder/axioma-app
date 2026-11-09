// Custo de pessoal do RH (ponte RH ↔ financeiro): contas conferidas à mão, centavo a centavo.
import assert from 'node:assert/strict'
const C = await import('../lib/rhCustoPessoal')

const k = (id: string, cod = '101', dep: string | null = 'd1') => ({ id, colaborador_id: `c${id}`, cod_categ: cod, departamento_id: dep })
const m = (v: number, und = 5) => ({ und_sal_fixo: und, valor: v })

// Simples, R$ 3.000: 13º 250,00 · férias+1/3 333,33 · FGTS 8% de 3.583,33 = 286,67 · patronal no DAS → 3.870,00
let c = C.custoMensalContrato(k('1'), m(3000), 'simples')!
assert.deepEqual([c.salario, c.provisoes, c.fgts, c.inss_patronal, c.total], [300000, 58333, 28667, 0, 387000])
// Presumido: + 20% de 3.583,33 = 716,67 → 4.586,67
assert.equal(C.custoMensalContrato(k('1'), m(3000), 'presumido')!.total, 458667)
// Aprendiz (103), R$ 1.500 no Simples: FGTS 2% de 1.791,67 = 35,83 → 1.827,50
assert.equal(C.custoMensalContrato(k('2', '103'), m(1500), 'simples')!.total, 182750)
// MEI, R$ 1.600: FGTS 152,89 + 3% patronal de 1.911,11 = 57,33 → 2.121,33
assert.equal(C.custoMensalContrato(k('3'), m(1600), 'mei')!.total, 212133)
// Doméstico (104), R$ 2.000: FGTS 191,11 + 3,2% 76,44 + 8,8% 210,22 + provisões 388,89 → 2.866,66
assert.equal(C.custoMensalContrato(k('4', '104'), m(2000), 'simples')!.total, 286666)
// por hora e sem salário não entram
assert.equal(C.custoMensalContrato(k('5'), m(30, 1), 'simples'), null)
assert.equal(C.custoMensalContrato(k('5'), undefined, 'simples'), null)
// regime não informado: sem patronal, avisado
assert.equal(C.custoMensalContrato(k('1'), m(3000), null)!.patronal_calculado, false)

// agregado por departamento e centro de custo
const r = C.custoPessoal({ contratos: [k('1'), k('2', '103', 'd2'), k('6', '101', null), k('7')], regime: 'simples', atividadeFiscal: 'comercio',
  salario: new Map([['1', m(3000)], ['2', m(1500)], ['6', m(20, 1)]]),
  departamentos: new Map([['d1', { nome: 'Comercial', centro_custo_id: 'cc1' }], ['d2', { nome: 'Administrativo', centro_custo_id: null }]]), centros: new Map([['cc1', 'Loja']]) })
assert.equal(r.pessoas_contadas, 2); assert.equal(r.nao_mensais, 1); assert.equal(r.sem_salario, 1)
assert.equal(r.custo_total_mensal, 5697.5) // 3.870,00 + 1.827,50
assert.deepEqual(r.por_departamento, [{ nome: 'Comercial', custo_mensal: 3870, pessoas: 1 }, { nome: 'Administrativo', custo_mensal: 1827.5, pessoas: 1 }])
assert.deepEqual(r.por_centro_custo.map((x) => x.nome), ['Loja', 'sem centro de custo'])
assert.ok(r.limitacoes.some((l) => /hora, dia/.test(l)) && r.limitacoes.some((l) => /sem salário/.test(l)))

// regime pelo texto do cadastro
assert.deepEqual(['mei', 'simples', 'simples_nacional', 'lucro_presumido', 'lucro_real', '', null].map(C.regimeDaEmpresa), ['mei', 'simples', 'simples', 'presumido', 'real', null, null])

// ponte com o financeiro: não soma, compara
assert.equal(C.compararComFinanceiro(5697.5, 0).situacao, 'folha_nao_lancada')
assert.equal(C.compararComFinanceiro(5697.5, 5600).situacao, 'confere')
assert.equal(C.compararComFinanceiro(5697.5, 3000).situacao, 'lancado_a_menos')
assert.equal(C.compararComFinanceiro(5697.5, 9000).situacao, 'lancado_a_mais')
assert.equal(C.compararComFinanceiro(5697.5, 3000).diferenca, 2697.5)
// IA: a pergunta abre a porta certa, e só nas telas que precisam (ponte RH ↔ financeiro)
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
const { telaPodeUsarPorta } = await import('../lib/ia/portas')
for (const q of ['Quanto custa a minha folha?', 'qual o custo de pessoal por departamento', 'quanto pago de encargos e FGTS', 'quanto custa um funcionário de 3 mil?', 'a folha está lançada no financeiro?'])
  assert.ok(planejarConsulta(q, 'rh').portas.includes('rh_custo_pessoal'), q)
for (const q of ['Quanto ganha a Ana?', 'quando acaba a experiência do Bruno', 'em que departamento está o Diego'])
  assert.ok(planejarConsulta(q, 'rh').portas.includes('rh_colaborador'), q)
for (const t of ['rh', 'rh-colaboradores', 'centros-custo', 'contas-pagar', 'tesouraria', 'ia-tributaria', 'mei-painel', null]) assert.ok(telaPodeUsarPorta(t, 'rh_custo_pessoal'), String(t))
assert.ok(!telaPodeUsarPorta('clientes', 'rh_custo_pessoal') && !telaPodeUsarPorta('pdv', 'rh_custo_pessoal'))
assert.ok(telaPodeUsarPorta('rh', 'rh_colaborador') && !telaPodeUsarPorta('contas-receber', 'rh_colaborador'))
console.log('check-rh-custo ok')
