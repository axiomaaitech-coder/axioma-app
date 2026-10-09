// Conferência do núcleo MEI (datas, teto, DAS na virada do ano).
// Rodar: npx tsx scripts/check-mei.mts  (com TZ do Brasil: o erro de data só aparece fora de UTC)
import assert from 'node:assert/strict'
process.env.TZ ||= 'America/Sao_Paulo'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { faturamentoAnoMEI, receitasBrutasPorMes, competenciasDASDoAno, calcularDividaDASAcumulada } = await import('../lib/meiHelpers')
const { dataLocal } = await import('../lib/datas')

// Venda do dia 1º fica no próprio mês/ano (antes caía no anterior)
assert.equal(dataLocal('2026-01-01').getFullYear(), 2026)
assert.equal(dataLocal('2026-03-01').getMonth(), 2)
const vendas = [{ valor: 1000, data: '2026-01-01' }, { valor: 500, data: '2025-12-31' }, { valor: 200, data: '2026-02-10', considera_teto_mei: false }]
assert.equal(faturamentoAnoMEI(vendas, 2026), 1000)
assert.equal(receitasBrutasPorMes(vendas, 2026)[0].total, 1000)

// DAS de dezembro do ano anterior vence em janeiro e entra na dívida
const hoje = new Date(2026, 1, 15) // 15/02/2026
const comps = competenciasDASDoAno([], 2026, 20, '2024-05-10', hoje)
assert.deepEqual(comps.map((c) => c.competencia), ['2025-12'])
assert.equal(calcularDividaDASAcumulada(comps, 80, 15, hoje).atrasos.length, 1)
// pago (marcado no Histórico) sai da dívida
const pago = competenciasDASDoAno([{ id: '1', tipo: 'DAS', competencia: '2025-12', data_vencimento: null, status: 'Entregue', data_entrega: null } as never], 2026, 20, '2024-05-10', hoje)
assert.equal(calcularDividaDASAcumulada(pago, 80, 15, hoje).atrasos.length, 0)
// MEI aberto este ano não herda dezembro
assert.deepEqual(competenciasDASDoAno([], 2026, 20, '2026-01-05', hoje).map((c) => c.competencia), []) // jan/26 só vence 20/02
const { dasMensalPorCategoria, percentualIsentoPorCategoria } = await import('../lib/meiHelpers')
assert.equal(dasMensalPorCategoria('Transporte'), 195.52) // caminhoneiro: 12% do SM + ICMS
assert.equal(percentualIsentoPorCategoria('Transporte'), 0.08) // cargas
console.log('check-mei OK')
