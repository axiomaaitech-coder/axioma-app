// Os 12 cenários obrigatórios do pedido da Central Intelligence (seção 19). Rodar: npx tsx scripts/check-cenarios.mts
// Banco simulado, sem IA de verdade: confere o que o SERVIDOR faz. As mesmas perguntas foram feitas ao vivo no site.
// Onde o Axioma ainda não tem o módulo (RH), o esperado hoje é "não há dado", nunca um número; o cenário muda quando o RH existir.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { executarFerramentaFinanceira } = await import('../lib/financeiro/ferramentasFinanceiras')
const R = await import('../lib/financeiro/relatorios')
const { indicador } = await import('../lib/financeiro/semantica')
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
const { consolidar } = await import('../lib/ia/consolidacao')
const { passarPelaPorta, PORTAS, confiabilidadeDaResposta } = await import('../lib/ia/portas')
const { hojeISO, somarDiasISO } = await import('../lib/datas')

type Linha = Record<string, unknown>
const E = 'a0000000-0000-4000-8000-00000000e001', OUTRA = 'b0000000-0000-4000-8000-00000000e002'
const FUSO = 'America/Sao_Paulo'
const hoje = hojeISO(new Date(), FUSO)
const ok = (n: number, t: string) => console.log(`OK — Teste ${n}: ${t}`)

// Banco falso: aplica os filtros de verdade e conta o que foi lido
function banco(tab: Record<string, Linha[]>, falhar: string[] = []) {
  const lidas: string[] = []
  const from = (t: string) => {
    const fs: ((l: Linha) => boolean)[] = []
    const res = () => { lidas.push(t); return falhar.includes(t) ? { data: null, error: { message: 'banco fora' } } : { data: (tab[t] ?? []).filter((l) => fs.every((f) => f(l))), error: null } }
    const q: Record<string, unknown> = {
      select: () => q, order: () => q, limit: () => q, is: () => q, not: () => q, or: () => q,
      eq(c: string, v: unknown) { if (!c.includes('.')) fs.push((l) => l[c] === v); return q },
      neq(c: string, v: unknown) { fs.push((l) => l[c] !== v); return q },
      gt(c: string, v: unknown) { fs.push((l) => Number(l[c]) > Number(v)); return q },
      lt(c: string, v: string) { fs.push((l) => l[c] != null && String(l[c]) < v); return q },
      gte(c: string, v: string) { fs.push((l) => String(l[c] ?? '') >= String(v).slice(0, 10)); return q },
      lte(c: string, v: string) { fs.push((l) => l[c] != null && String(l[c]) <= v); return q },
      in(c: string, v: unknown[]) { fs.push((l) => v.includes(l[c])); return q },
      range(de: number, ate: number) { const r = res(); return Promise.resolve(r.data ? { data: r.data.slice(de, ate + 1), error: null } : r) },
      maybeSingle() { const r = res(); return Promise.resolve({ data: r.data?.[0] ?? null, error: r.error }) },
      then(a: (v: unknown) => unknown, b?: (e: unknown) => unknown) { return Promise.resolve(res()).then(a, b) },
    }
    return q
  }
  return { db: { from, rpc: (n: string) => Promise.resolve(falhar.includes(n) ? { data: null, error: { message: 'fora' } } : { data: [], error: null }) } as never, lidas }
}

const d = (n: number) => somarDiasISO(hoje, n)
const tab: Record<string, Linha[]> = {
  empresas: [{ id: E, nome: 'Teste', regime_tributario: 'simples' }, { id: OUTRA, nome: 'Outra', regime_tributario: 'simples' }],
  clientes: [{ id: 'c1', empresa_id: E, nome: 'Cliente Um', status: 'ativo' }, { id: 'cx', empresa_id: OUTRA, nome: 'Cliente Alheio', status: 'ativo' }],
  fornecedores: [{ id: 'f1', empresa_id: E, nome: 'Forn Um', status: 'ativo' }],
  contas_receber: [
    { id: 'r1', empresa_id: E, valor: 1000, valor_recebido: 0, valor_desconto: 0, data_vencimento: d(-10), data_emissao: d(-20), status: 'pendente', cliente_id: 'c1', descricao: 'vencida' },
    { id: 'r2', empresa_id: E, valor: 500, valor_recebido: 100, valor_desconto: 0, data_vencimento: d(10), data_emissao: d(-5), status: 'parcial', cliente_id: 'c1', descricao: 'a vencer' },
    { id: 'r3', empresa_id: E, valor: 9000, valor_recebido: 0, valor_desconto: 0, data_vencimento: d(5), data_emissao: d(-5), status: 'cancelado', cliente_id: 'c1', descricao: 'cancelada' },
    { id: 'rx', empresa_id: OUTRA, valor: 77777, valor_recebido: 0, valor_desconto: 0, data_vencimento: d(5), data_emissao: d(-5), status: 'pendente', cliente_id: 'cx', descricao: 'alheia' },
  ],
  contas_pagar: [
    { id: 'p1', empresa_id: E, valor_total: 300, valor_pago: 0, data_vencimento: d(-3), data_emissao: d(-9), status: 'vencido', fornecedor_id: 'f1', descricao: 'luz', categoria: 'Outros' },
    { id: 'p2', empresa_id: E, valor_total: 800, valor_pago: 200, data_vencimento: d(9), data_emissao: d(-2), status: 'parcial', fornecedor_id: 'f1', descricao: 'mercadoria', categoria: 'Produtos' },
    { id: 'px', empresa_id: OUTRA, valor_total: 66666, valor_pago: 0, data_vencimento: d(9), data_emissao: d(-2), status: 'pendente', fornecedor_id: 'fx', descricao: 'alheia', categoria: 'Outros' },
  ],
  receitas: [{ id: 'x1', empresa_id: E, valor: 2000, data: d(-1), categoria: 'Serviços', status: 'recebido', cliente_id: 'c1' }],
  custos_variaveis: [{ id: 'cv1', empresa_id: E, valor: 400, data: d(-1), categoria: 'Outros', descricao: 'c' }],
  custos_fixos: [], dividas: [], fluxo_caixa: [{ id: 'fc1', empresa_id: E, tipo: 'entrada', valor: 900, data: d(-1), status: 'realizado' }],
}
const ctx = (b = banco(tab)) => ({ supabase: b.db, empresaId: E, fuso: FUSO })
const titulos = (tipo: string, b = banco(tab)) => executarFerramentaFinanceira(ctx(b), 'titulos', { tipo, periodo: 'tudo', inicio: null, fim: null })

// ─── 1. RH ───
{
  const p = planejarConsulta('Quantos funcionários ativos temos?')
  assert.deepEqual(p.indisponiveis, []); assert.deepEqual(p.portas, ['rh_pessoas'], 'só a porta do RH; não consulta Financeiro, Vendas nem Estoque')
  assert.equal(indicador('funcionarios')?.ferramenta, 'rh_pessoas'); assert.equal(indicador('folha')?.indisponivel, true)
  ok(1, 'funcionários: a porta do RH responde; a folha completa segue indisponível (Fase 4)')
}
// ─── 2 e 3. Recebíveis e pagáveis ───
{
  const b = banco(tab); const r = await titulos('receber', b)
  assert.equal(r.valor, 1400, '1000 vencidos + 400 a vencer; cancelada e outra Empresa fora'); assert.equal(r.estado, 'verificado'); assert.ok(r.fontes.includes('contas_receber')); assert.ok(r.consultado_em)
  const dr = r.detalhes as { vencido: number; a_vencer: number }; assert.deepEqual([dr.vencido, dr.a_vencer], [1000, 400], 'em aberto, vencido e a vencer separados')
  assert.ok(!b.lidas.includes('contas_pagar'), 'só a fonte de recebíveis')
  ok(2, 'a receber vem de Contas a Receber, com filtro e origem')
  const b2 = banco(tab); const p = await titulos('pagar', b2)
  assert.equal(p.valor, 900); assert.ok(p.fontes.includes('contas_pagar')); assert.ok(!b2.lidas.includes('contas_receber'))
  ok(3, 'a pagar vem de Contas a Pagar')
}
// ─── 4. Os dois juntos, sem misturar ───
{
  const p = planejarConsulta('Quanto temos a receber e quanto temos a pagar?')
  assert.deepEqual(p.intencoes, ['a_receber', 'a_pagar'])
  const [r, g] = await Promise.all([titulos('receber'), titulos('pagar')])
  assert.deepEqual([r.indicador, r.valor, g.indicador, g.valor], ['contas_receber_aberto', 1400, 'contas_pagar_aberto', 900], 'cada um com o seu; nada compensado')
  ok(4, 'receber e pagar: consultas independentes, sem compensar valores')
}
// ─── 5. Relatório executivo ───
const executivo = async (falhar: string[] = [], t = tab) => R.gerarRelatorio(ctx(banco(t, falhar)), R.validarPedido({ tipo: 'executivo', periodo: 'este_mes', lang: 'pt' })!)
{
  const rel = await executivo(); assert.ok(!('erro' in rel))
  if (!('erro' in rel)) {
    assert.ok(rel.fontes_consultadas.length >= 3, 'mais de uma fonte, cada uma identificada')
    for (const f of rel.fontes_consultadas) { assert.ok(f.nome); assert.ok(!Number.isNaN(Date.parse(f.consultado_em)), 'com horário') }
    assert.ok(rel.resumo.length > 0 && rel.secoes.length > 0); assert.ok(rel.gerado_em && rel.fuso === FUSO)
  }
  ok(5, 'relatório executivo com origem e horário de cada fonte')
}
// ─── 6. Cruzamento ───
{
  const p = planejarConsulta('Qual é o faturamento, o custo operacional, o custo com funcionários e o lucro da empresa?')
  assert.ok(p.portas.includes('faturamento') && p.portas.includes('dre') && p.portas.includes('rh_salarios')); assert.deepEqual(p.indisponiveis, [], 'custo com funcionários: salário-base do RH, com o aviso de que não é a folha')
  assert.equal(p.execucao, 'paralela')
  ok(6, 'cruzamento: cada indicador na sua porta; custo com funcionários pela porta de salários do RH')
}
// ─── 7. Falha de módulo ───
{
  const rel = await executivo(['custos_variaveis']); assert.ok(!('erro' in rel))
  if (!('erro' in rel)) {
    assert.equal(rel.estado, 'parcial', 'nunca "completo" com fonte fora'); assert.ok(rel.fontes_consultadas.some((f) => f.estado === 'erro'), 'mostra qual falhou')
    assert.ok(rel.limitacoes.some((l) => /ficou de fora|ficaram de fora|não é zero|falhou/.test(l)), 'aviso explícito')
  }
  assert.ok('erro' in await R.gerarRelatorio(ctx(banco(tab, ['contas_receber', 'contas_pagar', 'receitas', 'custos_variaveis', 'custos_fixos', 'fluxo_caixa', 'venda', 'dividas', 'clientes'])), R.validarPedido({ tipo: 'contas_receber', periodo: 'este_mes', lang: 'pt' })!), 'tudo fora: erro, não relatório zerado')
  assert.equal(confiabilidadeDaResposta({ respondeu: true, exige: true, registro: [{ nome: 'titulos', status: 'ok', ms: 1 }, { nome: 'dre', status: 'erro', ms: 1 }], naoConferidos: 0 }), 'parcial')
  ok(7, 'módulo fora: relatório parcial, com aviso (testado com módulos que existem; RH entra quando existir)')
}
// ─── 8. Segurança ───
{
  let abriu = 0; const exec = async () => { abriu++; return '{"itens":[]}' }
  const negado = await passarPelaPorta({ empresaId: E, papel: 'operador', nome: 'titulos', executar: exec })
  assert.equal(abriu, 0, 'operador nem chega ao banco'); assert.ok(JSON.parse(negado.saida).negado)
  assert.ok(JSON.parse((await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'select_tudo', executar: exec })).saida).erro, 'ferramenta inventada não executa'); assert.equal(abriu, 0)
  const r = await titulos('receber'); assert.ok(!JSON.stringify(r).includes('Alheio') && !JSON.stringify(r).includes('77777'), 'nada da outra Empresa')
  const pedidoOutra = R.validarPedido({ tipo: 'executivo', periodo: 'este_mes', lang: 'pt', empresa_id: OUTRA })!
  assert.ok(!('empresa_id' in pedidoOutra), 'empresa vem da sessão no servidor, nunca do pedido')
  assert.ok(readFileSync('app/api/ia/motor/route.ts', 'utf8').includes("acao: 'ia.motor.bloqueado'"), 'tentativa registrada')
  ok(8, 'segurança: operador barrado, ferramenta inventada recusada, outra Empresa invisível e tentativa registrada')
}
// ─── 9. Duplicidade ───
{
  // A mesma venda como conta a receber e como receita gerada ao receber: conta uma vez
  const t2 = { ...tab, contas_receber: [{ id: 'd1', empresa_id: E, valor: 1000, valor_recebido: 1000, valor_desconto: 0, data_vencimento: hoje, data_emissao: hoje, data_recebimento: hoje, status: 'recebido', cliente_id: 'c1' }],
    receitas: [{ id: 'd2', empresa_id: E, valor: 1000, data: hoje, categoria: 'Vendas', status: 'recebido', origem_tabela: 'contas_receber', origem_id: 'd1' }], venda: [] }
  const f = await executarFerramentaFinanceira(ctx(banco(t2)), 'faturamento', { periodo: 'hoje', inicio: null, fim: null, granularidade: 'dia', comparar: false })
  assert.equal(f.valor, 1000, 'o mesmo evento em dois módulos conta uma vez só')
  const lado = consolidar([{ nome: 'resumo_financeiro', saida: JSON.stringify({ indicador: 'resumo_financeiro', fontes: ['a'], moeda: 'BRL', consultado_em: 'T', detalhes: { caixa_realizado: 10 } }) }, { nome: 'caixa_tesouraria', saida: JSON.stringify({ indicador: 'caixa_posicao', fontes: ['b'], moeda: 'BRL', consultado_em: 'T', detalhes: { disponivel: 20 } }) }])
  assert.equal(lado.divergencias.length, 1, 'divergência é mostrada, nunca somada nem escolhida')
  ok(9, 'duplicidade: mesmo evento conta uma vez; divergência entre módulos fica visível')
}
// ─── 10. Desempenho ───
{
  const inicio = Date.now()
  const lentas = await Promise.all(Array.from({ length: 200 }, (_, i) => passarPelaPorta({ empresaId: E, papel: 'dono', nome: Object.keys(PORTAS)[i % Object.keys(PORTAS).length], executar: async () => { await new Promise((r) => setTimeout(r, 20)); return '{"itens":[1]}' } })))
  assert.equal(lentas.length, 200); assert.ok(lentas.every((l) => l.saida === '{"itens":[1]}')); assert.ok(Date.now() - inicio < 2000, '200 consultas simultâneas sem fila travando')
  const presa = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'dividas', tempoMs: 30, executar: () => new Promise(() => {}) })
  assert.equal(presa.motivo, 'tempo', 'consulta presa não prende a resposta')
  const grande = Array.from({ length: 30000 }, (_, i) => ({ id: `g${i}`, empresa_id: E, valor: 10, valor_recebido: 0, valor_desconto: 0, data_vencimento: d(i % 2 ? -1 : 1), status: 'pendente', cliente_id: 'c1', descricao: 'x' }))
  const t0 = Date.now(); const r = await titulos('receber', banco({ ...tab, contas_receber: grande }))
  assert.equal(r.valor, 300000, '30 mil títulos somados sem cortar em 1000'); assert.ok(Date.now() - t0 < 5000, `grande volume: ${Date.now() - t0} ms`)
  assert.ok(JSON.stringify(r).length < 30000, 'o que vai para a IA é resumo, não 30 mil linhas')
  ok(10, `desempenho: 200 consultas simultâneas, consulta presa cortada, 30 mil títulos em ${Date.now() - t0} ms`)
}
// ─── 11. Consistência temporal ───
{
  const rel = await executivo(); assert.ok(!('erro' in rel))
  if (!('erro' in rel)) assert.ok(rel.limitacoes.some((l) => /não em um único instante/.test(l)), 'relatório avisa que não é uma fotografia única')
  const c = consolidar([{ nome: 'a', saida: JSON.stringify({ fontes: ['a'], consultado_em: '2026-11-07T10:00:01Z' }) }, { nome: 'b', saida: JSON.stringify({ fontes: ['b'], consultado_em: '2026-11-07T10:00:04Z' }) }])
  assert.deepEqual(c.coleta, { de: '2026-11-07T10:00:01Z', ate: '2026-11-07T10:00:04Z', fontes: 2 }, 'intervalo registrado na auditoria')
  ok(11, 'consistência temporal: horário de cada fonte e aviso de coleta em sequência')
}
// ─── 12. Dado inexistente ───
{
  for (const id of ['folha', 'fornecedor_deve']) { const i = indicador(id)!; assert.equal(i.indisponivel, true); assert.equal(i.ferramenta, undefined, 'sem ferramenta: não há número para fabricar') }
  assert.deepEqual(planejarConsulta('Algum fornecedor me deve?').indisponiveis, ['fornecedor_deve'])
  ok(12, 'dado inexistente: dito como inexistente, sem fabricar resultado')
}
console.log('check-cenarios: os 12 cenários passaram ✔')
