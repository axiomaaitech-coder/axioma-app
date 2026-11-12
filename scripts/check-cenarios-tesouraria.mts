// Cenários versionados da Tesouraria: versão por nome, foto do resultado e variáveis limpas. npx tsx scripts/check-cenarios-tesouraria.mts
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
import assert from 'node:assert/strict'
const { agruparVersoes, proximaVersao, variaveisDoCenario, fotoDaSimulacao, STRESS_VARIAVEIS_NEUTRAS } = await import('../lib/tesourariaHelpers')

const V = STRESS_VARIAVEIS_NEUTRAS
const c = (id: string, nome: string, em: string) => ({ id, nome, tipo: 'custom' as const, variaveis: { ...V }, criado_em: em })
const lista = [c('a', 'Filial nova', '2026-10-01T10:00:00Z'), c('b', 'Corte 10%', '2026-11-01T10:00:00Z'), c('c', ' filial NOVA ', '2026-11-10T10:00:00Z')]
const g = agruparVersoes(lista)
assert.equal(g.length, 2)
assert.equal(g[0].nome.trim().toLowerCase(), 'filial nova') // grupo com versão mais recente primeiro
assert.deepEqual(g[0].versoes.map((v) => [v.id, v.versao]), [['c', 2], ['a', 1]])
assert.equal(proximaVersao(g, 'FILIAL NOVA'), 3)
assert.equal(proximaVersao(g, 'Outro'), 1)

const sujo = { variaveis: { ...V, receitaPct: 10, foto: { em: 'x' }, lixo: 5 } as never }
const limpo = variaveisDoCenario(sujo)
assert.equal(limpo.receitaPct, 10)
assert.equal('foto' in limpo, false)
assert.equal('lixo' in limpo, false)

const foto = fotoDaSimulacao({
  pontos: [{ horizonteDias: 90, saldoProjetadoBase: 0, saldoProjetadoSimulado: 1234.567, delta: 0, abaixoDaReserva: false }],
  caixaDisponivelSimulado: 10.005, rupturaHorizonte: null, liquidityScoreSimulado: { total: 70 } as never,
}, '2026-11-12')
assert.equal(foto.saldos[90], 1234.57)
assert.equal(foto.score, 70)
console.log('check-cenarios-tesouraria: ok')
