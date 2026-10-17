// Plano 3, Tarefa 2 — RELATÓRIOS CFO, PDF e ligação com José. Dados SINTÉTICOS com resultado feito à mão.
// Testa a montagem (lib/financeiro/relatorios), o PDF (lib/financeiro/relatorioPdf), a ferramenta do motor e a rota.
// Rodar: npx tsx scripts/check-relatorios.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const R = await import('../lib/financeiro/relatorios')
const PDF = await import('../lib/financeiro/relatorioPdf')
const TX = await import('../lib/financeiro/relatorioTextos')
const F = await import('../lib/financeiro/ferramentasFinanceiras')
const D = await import('../lib/ia/ferramentaDre')
const { hojeISO, somarDiasISO } = await import('../lib/datas')
const P = await import('../lib/financeiro/periodos')
type Rel = import('../lib/financeiro/relatorioTipos').Relatorio
const ok = (nome: string) => console.log(`OK — ${nome}`)
const FUSO = 'America/Sao_Paulo'
const hoje = hojeISO(new Date(), FUSO)
const M = P.resolverPeriodo('mes_anterior', hoje) as { inicio: string; fim: string }
const d = (n: number) => somarDiasISO(M.inicio, n)            // dia n do mês anterior (0 = dia 1)
const ts = (dia: string) => `${dia}T15:00:00Z`                // meio do dia: mesmo dia em São Paulo

type Linha = Record<string, unknown>
function bancoFalso(tabelas: Record<string, Linha[]>, falhar: string[] = []) {
  const consultas: string[] = []
  class Q {
    private f: ((l: Linha) => boolean)[] = []
    constructor(private t: string) {}
    select() { return this } order() { return this } limit() { return this }
    eq(c: string, v: unknown) { if (!c.includes('.')) this.f.push((l) => l[c] === v); return this }
    gte(c: string, v: string) { this.f.push((l) => String(l[c] ?? '') >= String(v).slice(0, 10)); return this }
    lte(c: string, v: string) { this.f.push((l) => l[c] != null && String(l[c]) <= v); return this }
    in(c: string, v: unknown[]) { this.f.push((l) => v.includes(l[c])); return this }
    private res() { consultas.push(this.t); return falhar.includes(this.t) ? { data: null, error: { message: 'timeout' } } : { data: (tabelas[this.t] ?? []).filter((l) => this.f.every((fn) => fn(l))), error: null } }
    range(de: number, ate: number) { const r = this.res(); return Promise.resolve(r.data ? { data: r.data.slice(de, ate + 1), error: null } : r) }
    maybeSingle() { const r = this.res(); return Promise.resolve({ data: r.data?.[0] ?? null, error: r.error }) }
    then(ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) { return Promise.resolve(this.res()).then(ok, ko) }
  }
  return { db: { from: (t: string) => new Q(t) } as never, consultas }
}
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222', C = '33333333-3333-4333-8333-333333333333'
const tab: Record<string, Linha[]> = {
  empresas: [{ id: A, nome: 'Empresa Teste', nome_fantasia: 'Padaria Teste', cnpj: '12.345.678/0001-90', regime_tributario: 'mei', atividade_fiscal: 'servico', mei_dados: { categoria_mei: 'Serviços' } },
    { id: B, nome: 'Outra Empresa', regime_tributario: 'simples' }, { id: C, nome: 'Empresa Só Custos', regime_tributario: 'mei', mei_dados: { categoria_mei: 'Serviços' } }],
  clientes: [{ id: 'c1', nome: 'Cliente Um' }, { id: 'c2', nome: 'Cliente Dois' }, { id: 'cb', nome: 'Cliente da Outra Empresa' }],
  fornecedores: [{ id: 'f1', nome: 'Energia SA' }, { id: 'f2', nome: 'Peças Ltda' }],
  receitas: [{ id: 'r1', empresa_id: A, valor: 1000, data: d(5), categoria: 'Serviços', cliente_id: 'c1', status: 'recebido' },
    { id: 'rb', empresa_id: B, valor: 99999, data: d(5), status: 'recebido' }],
  contas_receber: [
    // liquidação PARCIAL: 2000 − 100 desconto − 500 recebidos = 1400 em aberto, vencida há 40 dias
    { id: 'cr1', empresa_id: A, valor: 2000, valor_desconto: 100, valor_recebido: 500, data_emissao: d(10), data_vencimento: somarDiasISO(hoje, -40), data_recebimento: d(12), status: 'parcial', cliente_id: 'c1' },
    { id: 'cr2', empresa_id: A, valor: 800, valor_recebido: 0, data_emissao: d(15), data_vencimento: somarDiasISO(hoje, 10), status: 'pendente', cliente_id: 'c2' },
    { id: 'cr3', empresa_id: A, valor: 5000, valor_recebido: 0, data_emissao: d(15), data_vencimento: somarDiasISO(hoje, 10), status: 'cancelado', cliente_id: 'c2' },
    { id: 'crb', empresa_id: B, valor: 77777, valor_recebido: 0, data_emissao: d(3), data_vencimento: somarDiasISO(hoje, -3), status: 'pendente', cliente_id: 'cb' },
  ],
  venda: [
    { id: 'v1', empresa_id: A, valor_total: 250, desconto_total: 10, status: 'finalizada', forma_pagamento: 'pix', criado_em: ts(d(3)), finalizada_em: ts(d(3)), cancelada_em: null },
    { id: 'v2', empresa_id: A, valor_total: 300, desconto_total: 0, status: 'finalizada', forma_pagamento: 'credito', criado_em: ts(d(4)), finalizada_em: ts(d(4)), cancelada_em: null },
    { id: 'v3', empresa_id: A, valor_total: 100, desconto_total: 0, status: 'finalizada', forma_pagamento: 'dinheiro', criado_em: ts(d(3)), finalizada_em: ts(d(3)), cancelada_em: ts(d(3)) }, // estorno
    { id: 'vb', empresa_id: B, valor_total: 66666, status: 'finalizada', forma_pagamento: 'pix', criado_em: ts(d(3)), finalizada_em: ts(d(3)), cancelada_em: null },
  ],
  custos_variaveis: [{ id: 'cv1', empresa_id: A, valor: 400, data: d(6), categoria: 'Insumos', descricao: 'Farinha' }, { id: 'cvb', empresa_id: B, valor: 8888, data: d(6), categoria: 'X' }],
  contas_pagar: [
    { id: 'cp1', empresa_id: A, valor_total: 600, valor_pago: 200, data_emissao: d(2), data_vencimento: somarDiasISO(hoje, -5), data_pagamento: d(8), status: 'parcial', categoria: 'Energia', fornecedor_id: 'f1' },
    { id: 'cp2', empresa_id: A, valor_total: 1500, valor_pago: 0, data_emissao: d(20), data_vencimento: somarDiasISO(hoje, 20), status: 'pendente', categoria: 'Peças', fornecedor_id: 'f2' },
    { id: 'cpb', empresa_id: B, valor_total: 88888, valor_pago: 0, data_emissao: d(2), data_vencimento: somarDiasISO(hoje, 3), status: 'pendente' },
    { id: 'cc1', empresa_id: C, valor_total: 900, valor_pago: 0, data_emissao: d(2), data_vencimento: somarDiasISO(hoje, 3), status: 'pendente', categoria: 'Aluguel' },
  ],
  custos_fixos: [{ id: 'k1', empresa_id: A, valor_mensal: 1000, data_inicio: '2026-01-01', descricao: 'Aluguel' }, { id: 'kb', empresa_id: B, valor_mensal: 5555, data_inicio: '2026-01-01' }],
  dividas: [{ id: 'd1', empresa_id: A, descricao: 'Empréstimo banco', tipo: 'emprestimo', valor_total: 50000, valor_pago: 10000, parcelas: 24, taxa_juros: 2, vencimento: somarDiasISO(hoje, 15), status: 'ativo' },
    { id: 'db', empresa_id: B, descricao: 'Dívida B', valor_total: 123456, valor_pago: 0, taxa_juros: 3 }],
  fluxo_caixa: [{ id: 'fc1', empresa_id: A, tipo: 'entrada', valor: 3000, data: somarDiasISO(M.inicio, -1), status: 'realizado' },
    { id: 'fc2', empresa_id: A, tipo: 'saida', valor: 500, data: d(9), status: 'realizado' }, { id: 'fcb', empresa_id: B, tipo: 'entrada', valor: 55555, data: d(1), status: 'realizado' }],
  empresa_obrigacoes: [{ id: 'o1', empresa_id: A, nome: 'DAS', tipo: 'das', competencia: d(0), data_vencimento: d(19), valor_estimado: 80.9, valor_pago: 0, status: 'pendente' },
    { id: 'o2', empresa_id: A, nome: 'ISS', tipo: 'iss', competencia: d(0), data_vencimento: d(9), valor_estimado: 50, valor_pago: 50, status: 'pago' }],
  guias_arrecadacao: [{ id: 'g1', empresa_id: A, tipo: 'DAS', data_vencimento: d(19), valor_total: 80.9, status: 'emitida' }],
  mei_obrigacoes: [],
  turno_caixa: [{ id: 't1', empresa_id: A, status: 'fechado', valor_abertura: 100, valor_esperado: 350, valor_fechamento: 340, aberto_em: ts(d(3)), fechado_em: ts(d(3)) }],
  caixa_movimentacao: [{ id: 'm1', empresa_id: A, tipo: 'sangria', valor: 50, criado_em: ts(d(3)) }],
}
const ctxA = (falhar: string[] = [], t = tab) => ({ supabase: bancoFalso(t, falhar).db, empresaId: A, fuso: FUSO })
const gerar = async (tipo: string, extra: Record<string, unknown> = {}, ctx = ctxA()) => {
  const r = await R.gerarRelatorio(ctx, R.validarPedido({ tipo, periodo: 'mes_anterior', comparar: false, lang: 'pt', ...extra })!)
  assert.ok(!('erro' in r), `${tipo}: gerou`); return r as Rel
}
const ind = (r: Rel, rotulo: string) => r.secoes.flatMap((s) => (s.tipo === 'indicadores' ? s.itens : [])).find((i) => i.rotulo === rotulo)
const tabela = (r: Rel, id: string) => r.secoes.find((s) => s.id === id) as Extract<Rel['secoes'][number], { tipo: 'tabela' }>
const TODOS = ['executivo', 'dre', 'fluxo_caixa', 'contas_receber', 'contas_pagar', 'receitas', 'despesas', 'endividamento', 'tributario', 'pdv', 'conciliacao'] as const

// ═══ 1/8/12. Relatório executivo com dados válidos = mesmas consultas da Tarefa 1; nada da outra empresa ═══
const exe = await gerar('executivo', { comparar: true })
{
  const ctx = ctxA()
  const fat = await F.executarFerramentaFinanceira(ctx, 'faturamento', { periodo: 'mes_anterior', inicio: null, fim: null, granularidade: 'mes', comparar: false })
  const dre = await D.consultarDRE(ctx.supabase, A, { mes_inicio: M.inicio.slice(0, 7), mes_fim: M.fim.slice(0, 7) }, FUSO) as Record<string, number>
  assert.equal(ind(exe, 'Faturamento (competência)')!.valor, fat.valor, '1 faturamento do relatório = ferramenta faturamento')
  assert.equal(ind(exe, 'Lucro líquido (DRE)')!.valor, dre.lucro_liquido, '1 lucro do relatório = DRE')
  // 1000 receita + 1900 (cr1) + 800 (cr2) + PDV 250 + 300 (crédito é venda por competência) + 100 da venda cancelada,
  // que a DRE soma na receita bruta e tira à parte como devolução = 4350
  assert.equal(fat.valor, 4350, 'faturamento por competência feito à mão')
  assert.equal(ind(exe, 'Despesas (competência)')!.valor, 2500, 'despesas: 400 + 600 + 1500')
  assert.equal(ind(exe, 'A receber em aberto')!.valor, 2200, '6 liquidação parcial: 1400 + 800 (cancelada fora)')
  assert.equal(ind(exe, 'A receber vencido')!.valor, 1400)
  assert.equal(ind(exe, 'A pagar em aberto')!.valor, 1900, '600 − 200 pagos + 1500')
  assert.equal(ind(exe, 'Dívidas (saldo devedor)')!.valor, 40000, 'dívida da outra empresa fora')
  // 8: competência ≠ caixa — recebido no mês = 500 (cr1) + 250 (PDV pix; crédito e cancelada fora)
  assert.equal(ind(exe, 'Recebido no período (caixa)')!.valor, 750, '8 caixa ≠ competência')
  const json = JSON.stringify(exe)
  for (const alheio of ['99999', '77777', '66666', '88888', '123456', '55555', 'Cliente da Outra Empresa']) assert.ok(!json.includes(alheio), `12 isolamento: ${alheio} não aparece`)
  assert.equal(exe.empresa.nome, 'Padaria Teste'); assert.equal(exe.estado, 'verificado')
  assert.ok(exe.achados.some((a) => a.titulo === 'Valores vencidos a receber' && a.evidencia.includes('1.400,00')), 'achado com evidência numérica')
  assert.ok(exe.achados.every((a) => a.evidencia && ['fato', 'calculo', 'interpretacao', 'hipotese'].includes(a.tipo)), 'achado separa fato/cálculo/interpretação')
  ok('1/6/8/12 executivo: mesmos números da Tarefa 1, parcial respeitada, caixa ≠ competência, sem outra empresa')
}

// ═══ Todos os 11 tipos geram, em 3 idiomas, com os MESMOS números (21) ═══
for (const tipo of TODOS) {
  const [pt, en, es] = await Promise.all((['pt', 'en', 'es'] as const).map((lang) => gerar(tipo, { lang, comparar: true })))
  const nums = (r: Rel) => JSON.stringify(r.secoes.map((s) => (s.tipo === 'indicadores' ? s.itens.map((i) => i.valor) : s.tipo === 'tabela' ? s.linhas.map((l) => l.filter((v) => typeof v === 'number')) : [])))
  assert.equal(nums(en), nums(pt), `21 ${tipo}: mesmos números em inglês`); assert.equal(nums(es), nums(pt), `21 ${tipo}: mesmos números em espanhol`)
  assert.notEqual(en.titulo, pt.titulo)
  for (const l of en.limitacoes) assert.ok(!/\b(não|período|dívidas)\b/.test(l), `21 ${tipo}: limitação em inglês sem português: ${l}`)
  assert.ok(pt.metodologia.length >= 5 && pt.fontes.length > 0 && pt.refs.length > 0, `${tipo}: fontes, metodologia e referências`)
}
ok('21 os 11 relatórios geram em pt/en/es com números idênticos e textos traduzidos')

// ═══ 2/4/11. Empresa sem movimentação: sem NaN, % sem divisão por zero, DRE marcada insuficiente ═══
{
  const vazio = Object.fromEntries(Object.entries(tab).map(([k, v]) => [k, k === 'empresas' ? v : []]))
  const r = await gerar('executivo', {}, ctxA([], vazio))
  assert.ok(!JSON.stringify(r).includes('NaN') && !JSON.stringify(r).includes('Infinity'), '4 sem NaN/Infinity')
  assert.equal(ind(r, 'Margem líquida')!.valor, null, '4 margem sem receita = sem valor (não 0% nem divisão por zero)')
  assert.equal(r.estado, 'parcial'); assert.ok(r.limitacoes.some((l) => l.includes('não significa lucro zero')), '11 DRE sem dados declarada')
  assert.ok(!r.resumo.some((s) => s.includes('Lucro líquido')), '2 não resume lucro inexistente')
  const dre = await gerar('dre', {}, ctxA([], vazio))
  assert.ok(dre.limitacoes.some((l) => l.includes('lucro bruto')), '11 DRE explica as linhas que o Axioma não separa')
  const pc = await gerar('contas_receber', {}, ctxA([], vazio))
  assert.equal(ind(pc, '% vencido')!.valor, null, '4 % vencido com zero em aberto = sem valor')
  ok('2/4/11 sem movimento: nada inventado, sem divisão por zero, DRE insuficiente declarada')
}

// ═══ 3. Sem histórico para comparar: anterior = 0 sem registros → sem % ═══
{
  const f = ind(exe, 'Faturamento (competência)')!
  assert.equal(f.anterior, 0); assert.equal(f.variacao_pct, null, '3 período anterior sem registros: sem percentual enganoso')
  assert.ok(exe.comparado_com?.startsWith('Período anterior equivalente'))
  ok('3 comparação sem base não gera porcentagem')
}

// ═══ 3b. Período em andamento: compara o MESMO trecho (lançamento com data futura não entra na comparação) ═══
{
  const E = P.resolverPeriodo('este_mes', hoje) as { inicio: string; fim: string }
  if (E.fim > hoje) {
    const t3 = { ...tab, receitas: [...tab.receitas, { id: 'h1', empresa_id: A, valor: 1000, data: hoje }, { id: 'h2', empresa_id: A, valor: 700, data: E.fim }] }
    const r = await gerar('executivo', { periodo: 'este_mes', comparar: true }, ctxA([], t3))
    const f = ind(r, 'Faturamento (competência)')!
    assert.ok((f.valor ?? 0) >= 1700, 'valor do mês inteiro inclui o lançamento com data futura')
    assert.ok(f.nota?.startsWith('comparação de') && f.nota.includes(TX.fmtMoeda((f.valor ?? 0) - 700, 'pt')), `3b nota mostra o trecho comparado sem o futuro: ${f.nota}`)
    assert.ok(r.resumo[0].includes('mesmo trecho do período anterior'))
    ok('3b mês em andamento: comparação no mesmo trecho dos dois lados, explicada na nota')
  }
}

// ═══ 5. Valores negativos e estornos ═══
{
  const r = await R.gerarRelatorio({ supabase: bancoFalso(tab).db, empresaId: C, fuso: FUSO }, R.validarPedido({ tipo: 'executivo', periodo: 'mes_anterior', lang: 'pt' })!) as Rel
  assert.ok((ind(r, 'Lucro líquido (DRE)')!.valor ?? 0) < 0, '5 lucro negativo preservado')
  assert.ok(r.achados[0].titulo === 'Prejuízo no período' && r.achados[0].prioridade === 'alta', '5 prejuízo vira risco de prioridade alta')
  const rec = await gerar('receitas')
  assert.equal(ind(rec, 'Devoluções e cancelamentos do PDV')!.valor, 100, '5 venda cancelada = devolução (estorno), fora do faturamento')
  ok('5 negativos e estornos aparecem, sem sumir')
}

// ═══ 7. Vencidos e a vencer (faixas de atraso) ═══
{
  const r = await gerar('contas_receber')
  const ag = tabela(r, 'aging')
  assert.deepEqual(ag.linhas.map((l) => l[2]), [800, 0, 1400, 0, 0], '7 a vencer 800; 31–60 dias 1400 (40 dias de atraso)')
  assert.deepEqual(ag.total, ['Total', 2, 2200, 100])
  const p = await gerar('contas_pagar')
  assert.deepEqual(tabela(p, 'aging').linhas.map((l) => l[2]), [1500, 400, 0, 0, 0], '7 a pagar: 1500 a vencer, 400 com 5 dias')
  ok('7 faixas de atraso batem com o cálculo à mão')
}

// ═══ 9/22. PDV × caixa e conciliação ═══
{
  const pdv = await gerar('pdv')
  assert.equal(ind(pdv, 'Vendas concluídas')!.valor, 550, 'PDV: 250 + 300 (cancelada fora)')
  assert.equal(ind(pdv, 'Ticket médio')!.valor, 275)
  assert.equal(ind(pdv, 'Diferença nos fechamentos de caixa')!.valor, -10, '9 caixa contado 340 × esperado 350')
  assert.ok(pdv.achados.some((a) => a.titulo === 'Diferença no fechamento de caixa'))
  assert.deepEqual(tabela(pdv, 'movs').linhas, [['sangria', 50]])
  const dup = { ...tab, contas_pagar: [...tab.contas_pagar, { id: 'x1', empresa_id: A, valor_total: 70, valor_pago: 0, data_vencimento: d(5), chave_acesso: 'CH1', status: 'pendente' }, { id: 'x2', empresa_id: A, valor_total: 70, valor_pago: 0, data_vencimento: d(5), chave_acesso: 'CH1', status: 'pendente' },
    { id: 'y1', empresa_id: A, valor_total: 33, valor_pago: 0, data_vencimento: d(6), status: 'pendente', fornecedor_id: 'f1', descricao: 'a' }, { id: 'y2', empresa_id: A, valor_total: 33, valor_pago: 0, data_vencimento: d(7), status: 'pendente', fornecedor_id: 'f2', descricao: 'b' }] }
  const c = await gerar('conciliacao', {}, ctxA([], dup))
  assert.ok(c.achados.some((a) => a.titulo === 'Lançamentos duplicados confirmados' && a.prioridade === 'alta'), '22 mesma chave da nota = duplicidade confirmada')
  assert.ok(tabela(c, 'achados').linhas.every((l) => !(String(l[0]).includes('repetida') && l[3] === 33)), '22 mesmo valor sozinho NÃO é duplicidade')
  assert.ok(c.limitacoes.some((l) => l.includes('aprovação de supervisor')), 'só aponta; corrigir exige supervisor')
  ok('9/22 PDV: diferença de caixa e cancelamento separados; conciliação confirma só com identificador')
}

// ═══ 10. Falha de consulta = parcial com aviso (nunca zero); tudo falhando = erro ═══
{
  const r = await gerar('executivo', {}, ctxA(['contas_pagar']))
  assert.equal(r.estado, 'parcial', '10 uma consulta falhou: relatório parcial')
  assert.equal(ind(r, 'A pagar em aberto')!.valor, null, '10 valor que falhou fica vazio, não zero')
  assert.ok(r.limitacoes.some((l) => l.includes('não é zero')))
  const todas = await R.gerarRelatorio(ctxA(Object.keys(tab)), R.validarPedido({ tipo: 'endividamento', periodo: 'mes_anterior' })!)
  assert.ok('erro' in todas, '10 tudo falhando: erro explícito')
  assert.equal(R.validarPedido({ tipo: 'qualquer' }), null, 'tipo desconhecido recusado')
  const longo = await R.gerarRelatorio(ctxA(), R.validarPedido({ tipo: 'dre', periodo: 'personalizado', inicio: '2020-01-01', fim: '2026-01-01' })!)
  assert.ok('erro' in longo, 'período maior que 24 meses recusado')
  ok('10 falhas: parcial declarado, sem zero falso; erro total explícito; pedido inválido recusado')
}

// ═══ Fluxo de caixa: saldo inicial/final do Fluxo de Caixa + PDV ═══
{
  const r = await gerar('fluxo_caixa')
  assert.equal(ind(r, 'Saldo de caixa no início do período')!.valor, 3000)
  assert.equal(ind(r, 'Saldo de caixa no fim do período')!.valor, 2750, '3000 − 500 + PDV pix 250 (crédito e cancelada fora)')
  assert.equal(ind(r, 'Variação do saldo de caixa')!.valor, -250)
  ok('fluxo de caixa: saldo inicial, final e variação feitos à mão')
}

// ═══ 15/17/18/19. PDF = tela; formatação; paginação; falha tratada ═══
const textoPdf = (r: Rel) => Buffer.from(PDF.montarPdfRelatorio(r).output('arraybuffer')).toString('latin1')
{
  for (const lang of ['pt', 'en', 'es'] as const) {
    const r = await gerar('executivo', { lang, comparar: true })
    const raw = textoPdf(r)
    for (const s of r.secoes) if (s.tipo === 'indicadores') for (const i of s.itens) if (i.valor != null) assert.ok(raw.includes(TX.formatarIndicador(i, lang).replace(/−/g, '-')), `15 ${lang}: "${i.rotulo}" ${TX.formatarIndicador(i, lang)} está no PDF`)
    assert.ok(raw.includes(r.titulo), `PDF com título em ${lang}`)
  }
  assert.equal(TX.fmtMoeda(1400, 'pt'), 'R$ 1.400,00'); assert.equal(TX.fmtMoeda(1400, 'en'), 'R$1,400.00'); assert.ok(TX.fmtMoeda(1400.5, 'es').includes('1400,50'))
  assert.equal(TX.fmtData('2026-10-05', 'pt'), '05/10/2026'); assert.equal(TX.fmtData('2026-10-05', 'en'), '10/05/2026'); assert.equal(TX.fmtPct(-12.345, 'pt'), '-12,3%')
  assert.equal(TX.fmtMoeda(null, 'pt'), '—'); assert.equal(TX.fmtMoeda(NaN, 'pt'), '—')
  // 18: tabela com 400 linhas quebra em várias páginas, com cabeçalho e "Página i/N" em todas
  const grande: Rel = { ...exe, secoes: [{ id: 'g', titulo: 'Tabela longa', tipo: 'tabela', colunas: [{ rotulo: 'Descrição', tipo: 'texto' }, { rotulo: 'Valor', tipo: 'moeda' }], linhas: Array.from({ length: 400 }, (_, i) => [`Lançamento número ${i + 1} com descrição longa para quebrar a linha da tabela dentro da coluna`, -i * 1.5]) }] }
  const doc = PDF.montarPdfRelatorio(grande); const n = doc.getNumberOfPages()
  assert.ok(n >= 10, `18 relatório extenso paginado (${n} páginas)`)
  const raw = Buffer.from(doc.output('arraybuffer')).toString('latin1')
  assert.ok(raw.includes(`Página ${n}/${n}`) && raw.includes('Lançamento número 400') && raw.includes('-R$ 598,50'), '18 última linha, negativo e rodapé presentes')
  // 19: falha ao montar o PDF é tratada na tela (mensagem + nova tentativa), nunca silenciosa
  const tela = readFileSync('components/RelatorioCFO.tsx', 'utf8')
  assert.ok(/catch \{\s*setErro\(L\("O PDF não pôde ser montado/.test(tela) && tela.includes('Tentar de novo'), '19 falha do PDF vira aviso com nova tentativa')
  assert.ok(!tela.includes('reduce(') && !tela.includes('centavos'), 'tela não soma nada: só formata')
  assert.ok(tela.includes('formatarIndicador') && tela.includes('fmtCelula') && readFileSync('lib/financeiro/relatorioPdf.ts', 'utf8').includes('formatarIndicador'), '15 tela e PDF usam a mesma formatação')
  ok('15/17/18/19 PDF com os mesmos valores da tela nos 3 idiomas, formatação, paginação longa e falha tratada')
}

// ═══ 16. José/chats: a ferramenta "relatorio" devolve os MESMOS números e o pedido para a tela ═══
{
  const FER = await import('../lib/ia/ferramentas')
  assert.ok(FER.FERRAMENTAS.some((f) => f.name === 'relatorio'), 'ferramenta disponível para a IA')
  const saida = JSON.parse(await FER.executarFerramenta(bancoFalso(tab).db, A, 'relatorio', { tipo: 'executivo', periodo: 'mes_anterior', inicio: null, fim: null, comparar: true }, FUSO))
  const tela = exe.secoes.flatMap((s) => (s.tipo === 'indicadores' ? s.itens.map((i) => i.valor) : []))
  assert.deepEqual(saida.indicadores.map((i: { valor: number | null }) => i.valor), tela, '16 José lê os mesmos valores da tela/PDF')
  assert.deepEqual(saida.pedido, { tipo: 'executivo', periodo: 'mes_anterior', inicio: null, fim: null, comparar: true })
  const M2 = await import('../lib/ia/motor')
  assert.equal(M2.statusDaSaida(JSON.stringify(saida)), 'ok')
  const motor = readFileSync('lib/ia/motor.ts', 'utf8')
  assert.ok(motor.includes("nome === 'relatorio' && status !== 'erro'") && motor.includes('relatorio: resposta ? consulta.relatorio'), '16 motor devolve o pedido do relatório à tela')
  for (const f of ['components/ChatInteligencia.tsx', 'app/(interno)/nexus/JosephChat.tsx', 'app/(interno)/ia-financeira/page.tsx', 'app/(interno)/ia-tributaria/page.tsx', 'app/(interno)/mei/ia-advisor/page.tsx']) assert.ok(/<AcoesRelatorio[\s\S]{0,600}?pedido=/.test(readFileSync(f, 'utf8')), `relatório após a consulta (cartão "gerado com sucesso" + PDF da resposta) em ${f}`)
  const comp = readFileSync('components/RelatorioCFO.tsx', 'utf8')
  assert.ok(comp.includes('seu relatório está feito') && comp.includes('Baixar relatório em PDF') && comp.includes('fetch("/api/relatorios/gerar"') && !comp.includes('Relatório desta resposta'), 'cartão grande baixa o PDF completo pela mesma rota autorizada; sem PDF de texto solto')
  assert.ok(M2.pediuRelatorio('José, gere um relatório disso pra eu imprimir') && !M2.pediuRelatorio('quanto faturei este mês?'))
  assert.deepEqual([M2.pedidoRelatorioDaPergunta('gere a DRE do mês passado').tipo, M2.pedidoRelatorioDaPergunta('gere a DRE do mês passado').periodo], ['dre', 'mes_anterior'])
  assert.equal(M2.pedidoRelatorioDaPergunta('quero um relatório disso').tipo, 'executivo')
  assert.equal(M2.pedidoRelatorioDaPergunta('relatório em PDF', 'ia-tributaria').tipo, 'tributario')
  const t = M2.avisarRelatorioConcluido('Fato: faturamento de R$ 394.000. Infelizmente não posso gerar PDF ou arquivos para imprimir, só informações.', 'pt')
  assert.ok(!/não posso/.test(t) && t.endsWith('Seu relatório está feito e está aí embaixo, em PDF, com todas as informações que você pediu.') && t.includes('R$ 394.000'), `recusa trocada pelo aviso: ${t}`)
  assert.ok(motor.includes("pediuRelatorio(pergunta)) await consultarFerramenta(consulta, 'relatorio'"), 'pedido de relatório sem a ferramenta: o sistema monta')
  ok('16 José e chats: ferramenta relatorio com os mesmos números e botão para abrir o PDF')
}

// ═══ 13/14/20. Rota: login, empresa pela RLS, operador barrado, sem cobrança, auditoria sem valores ═══
{
  const rota = readFileSync('app/api/relatorios/gerar/route.ts', 'utf8')
  assert.ok(rota.includes("if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })"), '13 sem login = 401')
  assert.ok(rota.includes("from('empresas').select('id, uf, cidade').eq('id', empresaId)") && rota.includes('status: 404'), '13 empresa alheia (RLS) = 404')
  assert.ok(rota.includes('podeUsarIAFinanceira') && rota.includes('status: 403'), '14 operador = 403')
  const M2 = await import('../lib/ia/motor')
  assert.equal(M2.podeUsarIAFinanceira('operador'), false); assert.equal(M2.podeUsarIAFinanceira('admin'), true)
  assert.ok(!/consumirIA|SERVICE_ROLE|clienteServico/.test(rota), '20 relatório não gasta saldo de IA nem usa chave de serviço')
  assert.ok(!/SERVICE_ROLE|clienteServico/.test(readFileSync('lib/financeiro/relatorios.ts', 'utf8')), 'montagem só com o cliente do usuário (RLS)')
  const aud = rota.slice(rota.indexOf('registrarAuditoria({'))
  const usados = [...aud.slice(0, aud.indexOf('}))')).matchAll(/rel\.(\w+)(\.\w+)?/g)].map((m) => m[1] + (m[2] ?? ''))
  assert.ok(usados.length && usados.every((u) => /^(tipo|estado|comparado_com|periodo(\.inicio|\.fim)?|\w+\.length)$/.test(u)), `auditoria guarda só contagens e metadados: ${usados}`)
  ok('13/14/20 rota protegida, operador barrado, sem cobrança duplicada, auditoria minimizada')
}
// ═══ Conversas salvas: o relatório não some ao sair do módulo; isolamento por empresa E por pessoa ═══
{
  for (const f of ['components/ChatInteligencia.tsx', 'app/(interno)/nexus/JosephChat.tsx', 'app/(interno)/ia-financeira/page.tsx', 'app/(interno)/ia-tributaria/page.tsx', 'app/(interno)/mei/ia-advisor/page.tsx']) {
    const t = readFileSync(f, 'utf8')
    assert.ok(t.includes('useConversaSalva') && t.includes('<BarraConversas') && /onNota=\{\w+\.id \?/.test(t) && /onApagar=\{\w+\.id \?/.test(t), `conversa salva + lápis + lixeira em ${f}`)
  }
  const sql = readFileSync('docs/sql/IA-CONVERSAS-SQL.sql', 'utf8')
  assert.ok((sql.match(/user_id = \(select auth\.uid\(\)\) and empresa_id in \(select public\.empresas_do_usuario_operacional\(\)\)/g) ?? []).length >= 4, 'RLS: só a própria pessoa, só nas empresas dela (leitura e escrita)')
  const motor = readFileSync('components/ConversasIA.tsx', 'utf8')
  assert.ok(motor.includes('relatorio: m.relatorio ?? null') && motor.includes('select("id, role, texto, relatorio, nota")'), 'o pedido do relatório é guardado e o cartão volta ao reabrir')
  assert.ok(!/delete\(\)[^;]*\.lt\(|setTimeout\([^)]*apagar/.test(motor), 'nada é apagado sozinho: só pela lixeira')
  ok('conversas salvas: relatório e conversa ficam até o cliente apagar; lápis e lixeira; RLS por empresa e por pessoa')
}
console.log('check-relatorios: tudo certo ✔')
