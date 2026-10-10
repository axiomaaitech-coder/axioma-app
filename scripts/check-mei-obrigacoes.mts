// Conferência das regras do motor de obrigações MEI (lib/meiObrigacoesMotor.ts).
// Rodar: npx tsx scripts/check-mei-obrigacoes.mts
// As mesmas regras rodam no banco (MEI-MOTOR-OBRIGACOES-SQL.sql) e são testadas lá por
// MEI-MOTOR-OBRIGACOES-TESTE-SQL.sql (RLS, trava, chave repetida, estorno).
import assert from 'node:assert/strict'
process.env.TZ ||= 'America/Sao_Paulo'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const m = await import('../lib/meiObrigacoesMotor')

// 12 períodos por vencimento; competência = mês anterior; sem duplicar
const p26 = m.periodosDoAno(2026, 20)
assert.equal(p26.length, 12)
assert.equal(new Set(p26.map((p) => p.competencia)).size, 12)
assert.deepEqual(p26[0], { competencia: '2025-12', vencimento: '2026-01-20' })
assert.deepEqual(p26[11], { competencia: '2026-11', vencimento: '2026-12-20' })
assert.equal(m.periodosDoAno(2027).length, 12)
// reexecutar dá o mesmo resultado (idempotente) e dia 31 não estoura fevereiro
assert.deepEqual(m.periodosDoAno(2026, 20), p26)
assert.equal(m.periodosDoAno(2026, 31)[1].vencimento, '2026-02-28')
// MEI aberto em maio/2026: começa na competência 05/2026 (vence junho)
assert.equal(m.periodosDoAno(2026, 20, '2026-05-14')[0].competencia, '2026-05')

// valor pela regra da competência (fonte: Simples Nacional 02/01/2025 e 02/01/2026)
const r25 = { salario_minimo: 1518, inss_pct: 5, inss_pct_tac: 12, icms: 1, iss: 5 }
const r26 = { salario_minimo: 1621, inss_pct: 5, inss_pct_tac: 12, icms: 1, iss: 5 }
assert.equal(m.valorDAS(r25, 'Serviços'), 80.9)
assert.equal(m.valorDAS(r26, 'Serviços'), 86.05)
assert.equal(m.valorDAS(r26, 'Comércio'), 82.05)
assert.equal(m.valorDAS(r26, 'Comércio e Serviços'), 87.05)
// caminhoneiro ("Transporte"): INSS 12% + ICMS
assert.equal(m.valorDAS(r26, 'Transporte'), 195.52)
assert.equal(m.valorDAS(r25, 'Transporte'), 183.16)

// situação: integral, parcial, projeção nunca é "pendente", legado sem pagamento
const oficial = { natureza: 'oficial' as const, valor_esperado: 86.05 }
assert.equal(m.situacaoPorValores(oficial, 86.05), 'pago')
assert.equal(m.situacaoPorValores(oficial, 40), 'parcial')
assert.equal(m.situacaoPorValores(oficial, 0), 'pendente')
assert.equal(m.situacaoPorValores({ ...oficial, situacao: 'aguardando_conciliacao' }, 0), 'aguardando_conciliacao')
assert.equal(m.situacaoPorValores({ natureza: 'projecao', valor_esperado: 86.05 }, 0), 'previsto')

// guia com vários meses: quita do mais antigo; sobra NÃO some (vira excedente pra confirmar)
const abertas = [{ id: 'b', data_vencimento: '2026-09-20', saldo: 86.05 }, { id: 'a', data_vencimento: '2026-08-20', saldo: 86.05 }]
assert.deepEqual(m.planejarAlocacao(172.10, abertas), { alocacoes: [{ obrigacao_id: 'a', valor: 86.05, encargos: 0 }, { obrigacao_id: 'b', valor: 86.05, encargos: 0 }], excedente: 0 })
assert.deepEqual(m.planejarAlocacao(100, abertas).alocacoes.map((x) => x.valor), [86.05, 13.95])
assert.equal(m.planejarAlocacao(180, abertas).excedente, 7.9)

// totais: pago ≠ pendente ≠ projeção (nunca somados num número só)
const res = m.consolidarResumo([
  { situacao: 'pago', natureza: 'oficial', quantidade: 2, valor_esperado: 172.1, valor_pago: 172.1, encargos_pagos: 5, saldo: 0, saldo_vencido: 0 },
  { situacao: 'pendente', natureza: 'oficial', quantidade: 2, valor_esperado: 172.1, valor_pago: 0, encargos_pagos: 0, saldo: 172.1, saldo_vencido: 86.05 },
  { situacao: 'aguardando_conciliacao', natureza: 'oficial', quantidade: 1, valor_esperado: 86.05, valor_pago: 0, encargos_pagos: 0, saldo: 0, saldo_vencido: 0 },
  { situacao: 'previsto', natureza: 'projecao', quantidade: 3, valor_esperado: 258.15, valor_pago: 0, encargos_pagos: 0, saldo: 258.15, saldo_vencido: 0 },
])
assert.equal(res.pago, 172.1)
assert.equal(res.pendenteOficial, 172.1)     // projeção fora da dívida
assert.equal(res.vencido, 86.05)
assert.equal(res.aguardandoConciliacao, 86.05)
assert.equal(res.projecao, 258.15)

// conciliação: nº da guia = vínculo; "parece DAS" com valor igual = só sugestão; Pix qualquer = nada
const guias = [{ id: 'g1', numero_documento: '07.20.26250.1234567-8', valor_total: 86.05, data_vencimento: '2026-09-20', competencias: ['2026-08'], status: 'emitida' }]
const ab = [{ id: 'o8', competencia: '2026-08', saldo: 86.05 }, { id: 'o9', competencia: '2026-09', saldo: 86.05 }]
const c = m.conciliarExtrato([
  { id: 't1', descricao: 'PAGTO DAS 0720262501234567-8', valor: -86.05, data: '2026-09-18' },
  { id: 't2', descricao: 'PIX RECEITA FEDERAL', valor: -86.05, data: '2026-09-19' },
  { id: 't3', descricao: 'PIX JOAO SILVA', valor: -86.05, data: '2026-09-19' },
], guias, ab)
assert.equal(c.find((x) => x.transacaoId === 't1')?.confianca, 'vinculo')
assert.deepEqual(c.find((x) => x.transacaoId === 't1')?.obrigacaoIds, ['o8'])
assert.equal(c.find((x) => x.transacaoId === 't2')?.confianca, 'sugestao')
assert.equal(c.find((x) => x.transacaoId === 't3'), undefined)

// DRE do MEI: DAS real por competência (dez/25 = SM 2025), mês sem obrigação usa o DAS da categoria
assert.deepEqual(m.competenciasNoPeriodo('2025-11-01', '2026-02-28'), ['2025-11', '2025-12', '2026-01', '2026-02'])
const obrDRE = [{ competencia: '2025-12', valor_esperado: 80.9 }, { competencia: '2026-01', valor_esperado: 86.05 }]
assert.equal(m.deducoesMEI(obrDRE, '2025-12-01', '2026-01-31', 86.05), 166.95)
assert.equal(m.deducoesMEI(obrDRE, '2025-11-01', '2026-01-31', 80.9), 247.85) // nov/25 sem obrigação → DAS da categoria
assert.equal(m.deducoesMEI([{ competencia: '2026-03', valor_esperado: 195.52 }], '2026-03-01', '2026-03-31', 86.05), 195.52) // caminhoneiro

console.log('check-mei-obrigacoes OK')
