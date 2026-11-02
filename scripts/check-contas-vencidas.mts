// Contas Vencidas — regra de "vencida com saldo". Rodar: npx tsx scripts/check-contas-vencidas.mts
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { separarVencidas } = await import('../lib/contasVencidasHelpers')

const hoje = '2026-11-02'
const l = (id: string, venc: string | null, status: string, total: number, quitado: number) => ({ id, descricao: id, status, data_vencimento: venc, total, quitado, nome: null })
const r = separarVencidas([
  l('vence-hoje', '2026-11-02', 'pendente', 100, 0),   // não venceu ainda
  l('paga', '2026-10-01', 'pago', 100, 100),
  l('cancelada', '2026-10-01', 'cancelado', 100, 0),
  l('sem-data', null, 'pendente', 100, 0),
  l('quitada-sem-status', '2026-10-01', 'pendente', 100, 100), // saldo zero
  l('parcial', '2026-10-20', 'parcial', 1000, 400),     // 13 dias, falta 600
  l('antiga', '2026-08-04', 'vencido', 50, 0),          // 90 dias
], 'receber', hoje)

assert.deepEqual(r.map((c) => c.id), ['antiga', 'parcial'])
assert.equal(r[0].dias, 90)
assert.equal(r[1].saldo, 600)
assert.equal(r[1].dias, 13)
console.log('check-contas-vencidas: ok')
