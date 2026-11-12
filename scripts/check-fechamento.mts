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
