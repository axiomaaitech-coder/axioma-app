// Fechamento do mês: progresso ignora "não se aplica" e conta "sem dado" como não resolvido.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost'; process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
import assert from 'node:assert/strict'
const { progressoFechamento } = await import('../lib/fechamentoMes')
const T = { pt: '', en: '', es: '' }
const it = (status: 'ok' | 'pendente' | 'sem_dado' | 'nao_se_aplica') => ({ id: status + Math.random(), status, titulo: T, detalhe: T, rota: '/', acao: T })
assert.deepEqual(progressoFechamento([it('ok'), it('ok'), it('pendente'), it('nao_se_aplica')]), { ok: 2, total: 3, pct: 67, pronto: false })
assert.equal(progressoFechamento([it('ok'), it('sem_dado')]).pronto, false)
assert.deepEqual(progressoFechamento([it('ok'), it('nao_se_aplica')]), { ok: 1, total: 1, pct: 100, pronto: true })
assert.equal(progressoFechamento([it('nao_se_aplica')]).pronto, false)
console.log('check-fechamento: ok')
{ // custo fixo: uma conta para cada mês vigente (do início, no máximo 12 meses atrás, até a próxima conta)
  const { mesesDeVigencia } = await import('../lib/contasPagarHelpers')
  assert.deepEqual(mesesDeVigencia('2026-10-01', null, '2026-12', '2026-11-12'), ['2026-10', '2026-11', '2026-12'])
  assert.deepEqual(mesesDeVigencia(null, null, '2026-12', '2026-11-12'), ['2026-12'], 'sem início: só a próxima')
  assert.deepEqual(mesesDeVigencia('2027-01-01', null, '2026-12', '2026-11-12'), [], 'começa depois: nada')
  assert.deepEqual(mesesDeVigencia('2026-09-01', '2026-10-31', '2026-12', '2026-11-12'), ['2026-09', '2026-10'], 'encerrado: até o fim')
  assert.deepEqual(mesesDeVigencia('2020-01-01', null, '2026-11', '2026-11-12')[0], '2025-11', 'no máximo 12 meses atrás')
  assert.deepEqual(mesesDeVigencia('2025-12-15', null, '2026-01', '2026-01-05'), ['2025-12', '2026-01'], 'virada de ano')
  console.log('check-fechamento custo fixo por mês: ok')
}

// Data impossível ("-31" em mês de 30 dias) derrubava a leitura inteira no banco (erro 400).
const { ultimoDiaDoMes, ajustarDiaISO } = await import('../lib/datas')
assert.equal(ultimoDiaDoMes('2026-11'), '2026-11-30')
assert.equal(ultimoDiaDoMes('2028-02-10'), '2028-02-29')
assert.equal(ajustarDiaISO('2026-11-31'), '2026-11-30')
assert.equal(ajustarDiaISO('2026-02-31'), '2026-02-28')
assert.equal(ajustarDiaISO('2026-12-31'), '2026-12-31')
console.log('check-fechamento datas: ok')

// Rotas do Fechamento → tela de destino filtrada (lida de volta pela mesma função que as telas usam).
{
  const { rotaDoFechamento, lerFiltroDestino, periodoDoMes } = await import('../lib/filtroDestino')
  const r = rotaDoFechamento('/receitas', '2026-10', { categoria: 'sem' })
  assert.equal(r, '/receitas?mes=2026-10&de=fechamento&categoria=sem')
  const f = lerFiltroDestino(r.slice(r.indexOf('?')))
  assert.deepEqual(f, { mes: '2026-10', semCategoria: true, de: 'fechamento', novo: null })
  assert.equal(rotaDoFechamento('/contas-pagar?filtro=vencido', '2026-11'), '/contas-pagar?filtro=vencido&mes=2026-11&de=fechamento')
  assert.equal(lerFiltroDestino('?mes=2026-13').mes, null) // mês inválido não filtra nada
  assert.deepEqual(periodoDoMes('2026-11'), { inicio: '2026-11-01', fim: '2026-11-30' })
  console.log('check-fechamento rotas: ok')
}
