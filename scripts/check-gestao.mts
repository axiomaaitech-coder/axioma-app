// Portas de gestão (Central Intelligence, Etapa 3): mesmas contas das telas, só a Empresa pedida, falha nunca vira zero. Rodar: npx tsx scripts/check-gestao.mts
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const G = await import('../lib/financeiro/ferramentasGestao')
const { statusDaSaida } = await import('../lib/ia/portas')
const E = 'a0000000-0000-4000-8000-00000000e001', OUTRA = 'b0000000-0000-4000-8000-00000000e002'
const FUSO = 'America/Sao_Paulo'

type Linha = Record<string, unknown>
type Banco = { tab?: Record<string, Linha[]>; rpc?: Record<string, unknown>; falhaTab?: string[]; falhaRpc?: string[] }
const consultas: { t: string; empresa: unknown }[] = []
// Banco falso: aplica eq/lt/lte de verdade, para o filtro de Empresa e de data serem testados
function banco(b: Banco) {
  const from = (t: string) => {
    const filtros: ((l: Linha) => boolean)[] = []
    let empresa: unknown = null
    const res = () => {
      consultas.push({ t, empresa })
      if (b.falhaTab?.includes(t)) return { data: null, error: { message: 'banco fora' } }
      return { data: (b.tab?.[t] ?? []).filter((l) => filtros.every((f) => f(l))), error: null }
    }
    const q = {
      select: () => q, order: () => q,
      eq(c: string, v: unknown) { if (c === 'empresa_id') empresa = v; filtros.push((l) => l[c] === v); return q },
      lt(c: string, v: string) { filtros.push((l) => String(l[c]) < v); return q },
      lte(c: string, v: string) { filtros.push((l) => String(l[c]) <= v); return q },
      maybeSingle() { const r = res(); return Promise.resolve({ data: r.data?.[0] ?? null, error: r.error }) },
      range(de: number, ate: number) { const r = res(); return Promise.resolve(r.data ? { data: r.data.slice(de, ate + 1), error: null } : r) },
    }
    return q
  }
  const rpc = (nome: string) => Promise.resolve(b.falhaRpc?.includes(nome) ? { data: null, error: { message: 'rpc fora' } } : { data: b.rpc?.[nome] ?? [], error: null })
  return { from, rpc } as never
}
const rodar = async (b: Banco, nome: string, input: Linha = {}) => {
  const r = await G.executarFerramentaGestao({ supabase: banco(b), empresaId: E, fuso: FUSO }, nome, input)
  return { r, d: r.detalhes as Linha & Record<string, never> }
}

// ─── Tesouraria ───
const contas = [
  { conta_id: '1', conta_codigo: '1', conta_nome: 'Conta Itaú', tipo_liquidez: 'disponivel', banco_nome: 'Itaú', saldo: 10000 },
  { conta_id: '2', conta_codigo: '2', conta_nome: 'CDB', tipo_liquidez: 'aplicado', banco_nome: 'Itaú', saldo: 5000 },
  { conta_id: '3', conta_codigo: '3', conta_nome: 'Garantia', tipo_liquidez: 'restrito', banco_nome: null, saldo: 2000 },
]
const tesouraria: Banco = { tab: { tesouraria_config: [{ empresa_id: E, reserva_minima: 3000 }] }, rpc: { tesouraria_posicao: contas, tesouraria_fluxo_projetado: [{ saldo_atual: 15000, entradas_previstas: 4000, saidas_previstas: 1000 }] } }
{
  const { r, d } = await rodar(tesouraria, 'caixa_tesouraria')
  assert.equal(r.estado, 'verificado'); assert.equal(r.valor, 17000)
  assert.deepEqual([d.disponivel, d.aplicado, d.restrito, d.reserva_minima, d.caixa_livre], [10000, 5000, 2000, 3000, 7000], 'mesma conta da tela: livre = disponível − reserva')
  assert.deepEqual((d.previsao as unknown as { dias: number }[]).map((p) => p.dias), [7, 30, 60, 90])
  assert.equal((d.previsao as unknown as { saldo_otimista: number }[])[0].saldo_otimista, 18000, 'sem histórico de atraso: 15.000 + 4.000 − 1.000')
  assert.ok(r.consultado_em)
}
{
  const { r } = await rodar({ ...tesouraria, falhaRpc: ['tesouraria_posicao'] }, 'caixa_tesouraria')
  assert.equal(r.estado, 'erro', 'posição que falhou nunca vira caixa zero'); assert.equal(r.valor, null); assert.equal(statusDaSaida(JSON.stringify(r)), 'erro')
}
{
  const { r, d } = await rodar({ ...tesouraria, falhaRpc: ['tesouraria_fluxo_projetado'] }, 'caixa_tesouraria')
  assert.equal(r.estado, 'parcial', 'sem previsão: a posição vale, a previsão não'); assert.deepEqual(d.previsao, []); assert.equal(statusDaSaida(JSON.stringify(r)), 'parcial')
  assert.ok(r.limitacoes.some((l) => /previsão de caixa não pôde ser lida/.test(l)))
}
{
  const { r } = await rodar({ tab: {}, rpc: { tesouraria_posicao: contas } }, 'caixa_tesouraria')
  assert.ok(r.limitacoes.some((l) => /reserva mínima não cadastrada/.test(l)), 'reserva vazia é dita, não escondida')
}
assert.equal((await rodar({ ...tesouraria, falhaTab: ['tesouraria_config'] }, 'caixa_tesouraria')).r.estado, 'erro', 'sem ler a reserva não calcula caixa livre')

// ─── Fiscal ───
const ob = (nome: string, status: string, valor: number | null, dias: number) => ({ id: nome, nome, tipo: 'DAS', data_vencimento: '2026-11-20', status, valor, dias_restantes: dias });
{
  const b: Banco = { rpc: { fiscal_obrigacoes_proximas: [ob('DAS', 'pendente', 1850, 16), ob('Velha', 'pendente', 100, -3), ob('Paga', 'paga', 900, -40), ob('Dispensada', 'dispensada', 50, 5)] },
    tab: { mei_obrigacoes: [{ empresa_id: E, status: 'Pendente', tipo: 'DAS', competencia: '2026-10', data_vencimento: '2020-01-20', valor: null, valor_esperado: 86 }, { empresa_id: E, status: 'Entregue', tipo: 'DAS', data_vencimento: '2020-01-20' }, { empresa_id: E, status: 'Pendente', tipo: 'DAS', data_vencimento: '2999-01-01' }] } }
  const { r, d } = await rodar(b, 'obrigacoes_fiscais', { dias: 30 })
  assert.equal(r.valor, 3, 'paga e dispensada fora; MEI entregue e fora da janela também')
  assert.equal(d.total_estimado, 1950, 'lê o valor que o banco devolve'); assert.equal(d.atrasadas, 1)
  const mei = d.mei as unknown as { pendentes: number; atrasadas: number; itens: { valor: number }[] }
  assert.deepEqual([mei.pendentes, mei.atrasadas, mei.itens[0].valor], [1, 1, 86])
}
assert.equal((await rodar({ falhaRpc: ['fiscal_obrigacoes_proximas'] }, 'obrigacoes_fiscais', { dias: 30 })).r.estado, 'erro', 'falha nunca vira "nenhuma obrigação"')
assert.equal(statusDaSaida(JSON.stringify((await rodar({}, 'obrigacoes_fiscais', { dias: 9999 })).r)), 'vazio', 'sem obrigação é vazio, não erro')

// ─── Cadastros ───
{
  const hoje = new Date().toISOString().slice(0, 10)
  const c = (cliente_id: string | null, valor: number, recebido: number, venc: string, status = 'pendente') => ({ empresa_id: E, cliente_id, valor, valor_recebido: recebido, valor_desconto: 0, data_vencimento: venc, status })
  const b: Banco = { tab: {
    clientes: [{ empresa_id: E, status: 'ativo' }, { empresa_id: E, status: 'ativo' }, { empresa_id: E, status: 'inativo' }, { empresa_id: OUTRA, status: 'ativo' }],
    contas_receber: [c('a', 100, 0, '2020-01-01'), c('a', 50, 0, '2020-02-01'), c('b', 100, 100, '2020-01-01', 'recebido'), c('c', 100, 0, '2020-01-01', 'cancelado'), c(null, 70, 0, '2020-01-01'), c('d', 100, 0, '2999-01-01'), { ...c('z', 100, 0, '2020-01-01'), empresa_id: OUTRA }],
  } }
  const { r, d } = await rodar(b, 'cadastros', { tipo: 'clientes' })
  assert.equal(r.valor, 2, 'ativos só desta Empresa'); assert.equal(d.total_cadastrados, 3)
  assert.equal(d.inadimplentes, 1, 'cliente com 2 contas conta 1; quitado, cancelado, a vencer e outra Empresa não contam'); assert.equal(d.contas_vencidas_sem_cliente, 1)
  assert.ok(r.limitacoes.some((l) => /sem cliente/.test(l)))
  assert.ok(hoje)
  const f = await rodar({ tab: { fornecedores: [{ empresa_id: E, status: 'ativo' }, { empresa_id: E, status: 'inativo' }, { empresa_id: OUTRA, status: 'ativo' }] } }, 'cadastros', { tipo: 'fornecedores' })
  assert.equal(f.r.valor, 1); assert.equal(f.d.total_cadastrados, 2)
}
assert.equal((await rodar({ falhaTab: ['clientes'] }, 'cadastros', { tipo: 'clientes' })).r.estado, 'erro')
assert.equal((await rodar({ falhaTab: ['contas_receber'] }, 'cadastros', { tipo: 'clientes' })).r.estado, 'erro', 'sem contas não afirma zero inadimplentes')

// ─── Estoque ───
{
  const kpi = { empresa_id: E, valor_total_estoque: 109317, produtos_ativos: 5, produtos_inativos: 0, qtd_ruptura: 0, qtd_baixo_estoque: 2, qtd_capital_parado: 0, qtd_custo_subindo: 0 }
  const p = (saldo: number, medio: number) => ({ empresa_id: E, status: 'ativo', controla_estoque: true, saldo_disponivel: saldo, preco_medio: medio })
  const ok = await rodar({ tab: { vw_estoque_kpis: [kpi], produtos: [p(419, 98)] } }, 'estoque_resumo')
  assert.equal(ok.r.estado, 'verificado'); assert.equal(ok.r.valor, 109317); assert.equal(ok.d.baixo_estoque, 2)
  const semEntrada = await rodar({ tab: { vw_estoque_kpis: [kpi], produtos: [p(-15, 0), p(420, 0), p(0, 0), p(10, 5)] } }, 'estoque_resumo')
  assert.equal(semEntrada.r.estado, 'parcial', 'venda sem entrada: o valor é avisado como incompleto'); assert.equal(semEntrada.d.produtos_sem_entrada_registrada, 2)
  assert.equal(statusDaSaida(JSON.stringify((await rodar({ tab: {} }, 'estoque_resumo')).r)), 'vazio', 'sem produto com estoque')
}
assert.equal((await rodar({ falhaTab: ['vw_estoque_kpis'] }, 'estoque_resumo')).r.estado, 'erro', 'falha nunca vira estoque R$ 0')

// ─── Toda leitura de tabela é da Empresa pedida ───
for (const c of consultas) assert.equal(c.empresa, E, `${c.t} sem filtro de Empresa`)
assert.ok(consultas.length > 10)
console.log('check-gestao: Tesouraria, Fiscal, Cadastros e Estoque, tudo certo ✔')
