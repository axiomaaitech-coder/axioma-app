// Carteira de clientes: ticket médio por cobrança e nenhuma nota de risco para quem nunca foi cobrado.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
import assert from 'node:assert/strict'
const c = await import('../lib/clienteIntelHelpers')
const cli = (id: string, nome: string) => ({ id, nome, email: '', telefone: '', documento: '', cidade: '', status: 'ativo', created_at: '2026-10-01T00:00:00Z' }) as never
const conta = (id: string, cliente_id: string, valor: number, extra: Record<string, unknown> = {}) => ({ id, descricao: id, valor, cliente_id, data_vencimento: '2026-10-20', data_emissao: '2026-10-05', status: 'pendente', ...extra }) as never
const carteira = c.montarSnapshotsCarteira(
  [cli('a', 'Bom Preço'), cli('b', 'Hotel'), cli('c', 'Farma'), cli('d', 'Sem compra'), cli('e', 'Outro sem compra')],
  [conta('1', 'a', 45320.75, { status: 'recebido', valor_recebido: 45320.75, data_recebimento: '2026-11-07' }), conta('2', 'b', 18750.40), conta('3', 'c', 27430.10)],
  [],
)
// 91.501,25 em 3 cobranças = 30.500,42 (antes dividia pelos 5 clientes cadastrados)
assert.ok(Math.abs(carteira.ticketMedioCarteira - 30500.416666) < 0.01, String(carteira.ticketMedioCarteira))
const ranking = c.rankingScoreAxiomaCliente(carteira)
assert.deepEqual(ranking.map((r) => r.s.cliente.nome).sort(), ['Bom Preço', 'Farma', 'Hotel'], 'cliente sem cobrança não recebe nota')
console.log('check-clientes-carteira: ok')
