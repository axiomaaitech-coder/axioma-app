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
