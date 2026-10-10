// Conferência da DRE por competência (lib/dreCompetencia.ts). Rodar: npx tsx scripts/check-dre-competencia.mts
import assert from 'node:assert/strict'
process.env.TZ ||= 'America/Sao_Paulo'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const d = await import('../lib/dreCompetencia')

// D1 — custo fixo só nos meses de vigência; nunca retroativo nem futuro
const cfs = [
  { id: 'a', valor_mensal: 38000, inicio: '2026-10-07', fim: null },          // cadastrado em out/26
  { id: 'b', valor_mensal: 1000, inicio: '2026-01-15', fim: '2026-03-31' },    // encerrado em março
]
assert.equal(d.custoFixoNoPeriodo(cfs, '2026-01-01', '2026-10-31', '2026-10-10'), 38000 + 3000) // antes: 39.000 × 10 = 390.000
assert.equal(d.custoFixoDoMes(cfs, '2026-09', '2026-10-10'), 0)
assert.equal(d.custoFixoDoMes(cfs, '2026-11', '2026-10-10'), 0)                // mês futuro: não presume
assert.equal(d.custoFixoNoPeriodo(cfs, '2026-01-01', '2026-12-31', '2026-10-10'), 41000)

// Receita: conta a receber pela competência; receita criada pelo RECEBIMENTO não conta 2x; PDV entra
const { receitas, devolucoes } = d.itensReceita(
  [{ id: 'r1', valor: 500, data: '2026-10-02' }, { id: 'r2', valor: 900, data: '2026-10-20', origem_tabela: 'contas_receber' }],
  [{ id: 'cr1', valor: 1000, valor_desconto: 100, status: 'recebido', data_emissao: '2026-09-28', data_vencimento: '2026-10-20' },
   { id: 'cr2', valor: 700, status: 'cancelado', data_emissao: '2026-10-01' }],
  [{ id: 'v1', valor_total: 200, status: 'finalizada', finalizada_em: '2026-10-10T02:30:00Z' },          // 09/10 23:30 no Brasil
   { id: 'v2', valor_total: 50, status: 'cancelada', finalizada_em: '2026-10-05T15:00:00Z', cancelada_em: '2026-10-06T15:00:00Z' }],
)
assert.deepEqual(receitas.map((r) => [r.origem, r.valor, r.data]), [
  ['receita_manual', 500, '2026-10-02'], ['conta_receber', 900, '2026-09-28'], ['pdv', 200, '2026-10-09'], ['pdv', 50, '2026-10-05'],
])
assert.deepEqual(devolucoes.map((r) => [r.valor, r.data]), [[50, '2026-10-06']])
assert.equal(d.somaNoPeriodo(receitas, '2026-10-01', '2026-10-31'), 750) // 500 + 200 + 50 (a conta a receber é de setembro)

// Custo: conta a pagar pela emissão; custo criado pelo PAGAMENTO não conta 2x; nota já lançada não duplica;
// custo fixo, imposto e DAS ficam fora (têm linha própria)
const custos = d.itensCusto(
  [{ id: 'c1', valor: 300, data: '2026-10-03' },
   { id: 'c2', valor: 42000, data: '2026-10-07', origem_tabela: 'contas_pagar', origem_id: 'p1', rastreio_id: 'rx' },  // do pagamento
   { id: 'c3', valor: 5000, data: '2026-10-01', origem_tabela: 'contas_pagar', origem_id: 'p2', rastreio_id: null }],  // da nota
  [{ id: 'p1', valor_total: 92000, data_emissao: '2026-09-15', categoria: 'Produtos' },
   { id: 'p2', valor_total: 5000, data_emissao: '2026-10-01', chave_acesso: 'K1' },
   { id: 'p2b', valor_total: 5000, data_emissao: '2026-11-01', chave_acesso: 'K1' },                     // 2ª parcela da mesma nota
   { id: 'p3', valor_total: 38000, data_emissao: '2026-10-05', custo_fixo_id: 'a' },
   { id: 'p4', valor_total: 86.05, data_emissao: '2026-10-01', categoria: 'Impostos', mei_obrigacao_id: 'o' },
   { id: 'p5', valor_total: 999, data_emissao: '2026-10-01', status: 'cancelado' }],
)
assert.deepEqual(custos.map((c) => [c.id, c.origem, c.valor]), [['c1', 'custo_manual', 300], ['c3', 'custo_nota', 5000], ['p1', 'conta_pagar', 92000]])
assert.equal(d.somaNoPeriodo(custos, '2026-09-01', '2026-09-30'), 92000) // competência = emissão (setembro), não o pagamento

assert.equal(d.diaDoTimestamp('2026-10-10T02:30:00Z'), '2026-10-09')
assert.deepEqual(d.mesesEntre('2025-11-15', '2026-02-01'), ['2025-11', '2025-12', '2026-01', '2026-02'])
// Devoluções reduzem a receita líquida; anexo do Simples pela atividade (não sempre o III)
const { montarDRE } = await import('../lib/cfoCore')
const dre = montarDRE({ receitaBruta: 1000, devolucoes: 50, deducoes: 60, custoVariavel: 300, custoFixo: 200, despesasFinanceiras: 10 })
assert.equal(dre.receitaLiquida.valor, 890)
assert.equal(dre.lucroLiquido.valor, 380)
const { anexoSimplesDaAtividade, calcularAliquotaSimples } = await import('../lib/iaTributariaHelpers')
assert.deepEqual(anexoSimplesDaAtividade('comercio'), { anexo: 'I', exigeValidacao: false })
assert.deepEqual(anexoSimplesDaAtividade('industria'), { anexo: 'II', exigeValidacao: false })
assert.equal(anexoSimplesDaAtividade('servico').exigeValidacao, true)
assert.equal(anexoSimplesDaAtividade(null).exigeValidacao, true)
assert.equal(calcularAliquotaSimples(100000, 'II'), 4.5) // 1ª faixa do Anexo II
// PDV no Fluxo: realizado no dia, crédito previsto D+30, cancelada fora, agrupado por dia
const fx = d.lancamentosPdvFluxo([
  { id: 'a', valor_total: 100, status: 'finalizada', forma_pagamento: 'pix', finalizada_em: '2026-10-05T15:00:00Z' },
  { id: 'b', valor_total: 50, status: 'finalizada', forma_pagamento: 'dinheiro', finalizada_em: '2026-10-05T18:00:00Z' },
  { id: 'c', valor_total: 300, status: 'finalizada', forma_pagamento: 'credito', finalizada_em: '2026-10-05T19:00:00Z' },
  { id: 'e', valor_total: 999, status: 'cancelada', forma_pagamento: 'pix', finalizada_em: '2026-10-05T19:00:00Z', cancelada_em: '2026-10-05T20:00:00Z' },
])
assert.deepEqual(fx.map((l) => [l.status, l.data, l.valor]), [['previsto', '2026-11-04', 300], ['realizado', '2026-10-05', 150]])
// Conferência: soma contábil por natureza e quanto de cada pagamento chegou ao motor
const cf = await import('../lib/conferenciaHelpers')
const part = [
  { valor: 1000, tipo: 'credito', plano_de_contas: { codigo: '6.01' }, lancamento_contabil: { data: '2026-10-02' } },
  { valor: 100, tipo: 'debito', plano_de_contas: { codigo: '6.01' }, lancamento_contabil: { data: '2026-10-03' } },   // estorno
  { valor: 300, tipo: 'debito', plano_de_contas: { codigo: '8.02' }, lancamento_contabil: { data: '2026-10-03' } },
  { valor: 999, tipo: 'credito', plano_de_contas: { codigo: '6.01' }, lancamento_contabil: { data: '2026-11-01' } },  // outro mês
]
assert.equal(cf.somaContabil(part, ['6'], 'credito', '2026-10-01', '2026-10-31'), 900)
assert.equal(cf.somaContabil(part, ['7', '8'], 'debito', '2026-10-01', '2026-10-31'), 300)
const rast = cf.rastreadoPorConta([{ origem_id: 'p1', tipo: 'ap_pagamento', valor: 50000 }, { origem_id: 'p1', tipo: 'ap_pagamento', valor: 42840 }, { origem_id: 'p2', tipo: 'ap_pagamento', valor: 100 }, { origem_id: 'p2', tipo: 'ap_estorno', valor: 100 }])
assert.equal(rast.get('p1'), 92840)
assert.equal(rast.get('p2'), 0)
console.log('check-dre-competencia OK')
