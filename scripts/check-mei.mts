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
const { calcularImpostoRegime, categoriaMeiDaEmpresa } = await import('../lib/iaTributariaHelpers')
assert.equal(calcularImpostoRegime('mei', 50000, 4000, undefined, undefined, 'Transporte'), 195.52) // antes: sempre Serviços
assert.equal(calcularImpostoRegime('mei', 50000, 4000), 86.05)
assert.equal(categoriaMeiDaEmpresa({ regime_tributario: 'mei', mei_dados: [{ categoria_mei: 'Comércio' }] }), 'Comércio')
assert.equal(categoriaMeiDaEmpresa({ regime_tributario: 'mei', mei_dados: { categoria_mei: 'Indústria' } }), 'Indústria')
const { tetoProporcionalMEI, efeitoExcessoMEI } = await import('../lib/meiHelpers')
assert.equal(tetoProporcionalMEI(null, 2026).teto, 81000)
assert.equal(tetoProporcionalMEI(null, 2026, 'Transporte').teto, 251600)          // caminhoneiro (LC 188/2021)
assert.equal(tetoProporcionalMEI('2026-03-15', 2026).teto, 67500)                 // mar–dez = 10 meses × 6.750
assert.equal(tetoProporcionalMEI('2026-03-15', 2026, 'Transporte').teto, 209666.7) // 10 × 20.966,67
assert.deepEqual(efeitoExcessoMEI(90000, 81000), { situacao: 'ate20', excesso: 9000, limite20: 97200 })
assert.equal(efeitoExcessoMEI(100000, 81000).situacao, 'acima20')
console.log('check-mei OK')

// receita da DASN-SIMEI separada por tipo
{
  const { receitaDASNPorTipo: f } = await import('../lib/meiHelpers')
  const rs = [{ valor: 100, data: '2026-03-01', categoria: 'Vendas de produtos' }, { valor: 50, data: '2026-04-01', categoria: 'Prestação de serviços' }, { valor: 30, data: '2026-05-01', categoria: 'Outras' }, { valor: 999, data: '2025-05-01', categoria: 'Outras' }, { valor: 7, data: '2026-05-01', categoria: 'Outras', considera_teto_mei: false }]
  const a = f(rs, 2026, 'Serviços'); if (a.comercio !== 100 || a.servicos !== 80 || a.semTipo !== 0 || a.foraDoLimite !== 7 || a.qtdForaDoLimite !== 1) throw new Error('dasn servicos ' + JSON.stringify(a))
  if (f(rs, 2026, 'Comércio e Serviços').semTipo !== 30) throw new Error('dasn misto')
  if (f(rs, 2026, 'Comércio').comercio !== 130) throw new Error('dasn comercio')
  console.log('ok dasn por tipo')
}

// IRPF 2026 (tabela de maio/2025 + desconto simplificado + redutor da Lei 15.270/2025)
const { calcularIRPF } = await import('../lib/meiHelpers')
assert.equal(calcularIRPF(5000, 2026).imposto, 0) // até R$ 5 mil não paga
assert.equal(calcularIRPF(3000, 2026).imposto, 0)
// exemplo da Receita: R$ 6.000 → tabela 574,29 − redutor 179,75 = 394,54
assert.equal(calcularIRPF(6000, 2026).imposto, 394.54)
assert.equal(calcularIRPF(8000, 2026).imposto, Math.round(((8000 - 607.2) * 0.275 - 908.73) * 100) / 100) // sem redutor
assert.equal(calcularIRPF(5000, 2025).imposto, 312.89) // antes da Lei 15.270
console.log('check-mei IRPF 2026: ok')

// Pergunta 184 do P&R IRPF 2026 (Receita): comércio, receita 80 mil, despesas 20 mil → lucro 60 mil, isento 6.400, tributável 53.600
const { rendaTributavelMEI, despesasAnoMEI } = await import('../lib/meiHelpers')
assert.deepEqual(rendaTributavelMEI(80000, 20000, 'Comércio'), { lucro: 60000, isento: 6400, tributavel: 53600 })
// despesa maior que o lucro presumido: isento limitado ao lucro, nada tributável
assert.deepEqual(rendaTributavelMEI(50000, 40000, 'Serviços'), { lucro: 10000, isento: 10000, tributavel: 0 })
assert.equal(despesasAnoMEI([{ valor: 100, data: '2026-03-10' }, { valor: 50, data: '2025-12-31' }], [{ valor_mensal: 10 }], 2026, 10), 200)
console.log('check-mei renda tributável MEI: ok')

// Fração de IR no preço: renda baixa em 2026 não paga → 0; sem receita → aproximação conservadora
const { fracaoIRPFExposicao } = await import('../lib/meiHelpers')
assert.equal(fracaoIRPFExposicao('Serviços', 6000, 1000), 0) // tributável 3.080/mês < R$ 5 mil
assert.equal(fracaoIRPFExposicao('Serviços'), (1 - 0.32) * 0.275)
console.log('check-mei fração IR no preço: ok')
