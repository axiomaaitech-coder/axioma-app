// Plano 3, Tarefa 1 — MOTOR FINANCEIRO: períodos, cálculos, reconciliação, contrato, ferramentas e isolamento.
// Dados SINTÉTICOS com resultado conhecido (contas feitas à mão nos comentários). Testa as fórmulas, não o modelo.
// Rodar: npx tsx scripts/check-financeiro.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const P = await import('../lib/financeiro/periodos')
const C = await import('../lib/financeiro/calculos')
const R = await import('../lib/financeiro/reconciliacao')
const K = await import('../lib/financeiro/contrato')
const S = await import('../lib/financeiro/semantica')
const F = await import('../lib/financeiro/ferramentasFinanceiras')
const ok = (nome: string) => console.log(`OK — ${nome}`)
type Per = { inicio: string; fim: string; nome: string; parcial: boolean; dias: number; rotulo: string }
const per = (n: string, hoje: string, x?: { inicio?: string; fim?: string }) => P.resolverPeriodo(n, hoje, x) as Per

// ═══ 13. Períodos, fuso e viradas ═══
{
  const h = '2026-10-16' // sexta-feira
  assert.deepEqual([per('esta_semana', h).inicio, per('esta_semana', h).fim], ['2026-10-12', '2026-10-18'], 'semana = segunda a domingo')
  assert.deepEqual([per('semana_anterior', h).inicio, per('semana_anterior', h).fim], ['2026-10-05', '2026-10-11'])
  assert.equal(per('esta_semana', h).dias, 7, '"esta semana" nunca vira 30 dias')
  assert.deepEqual([per('ultimos_7_dias', h).inicio, per('ultimos_7_dias', h).fim], ['2026-10-10', '2026-10-16'])
  assert.deepEqual([per('mes_anterior', h).inicio, per('mes_anterior', h).fim], ['2026-09-01', '2026-09-30'])
  assert.deepEqual([per('este_trimestre', h).inicio, per('este_trimestre', h).fim], ['2026-10-01', '2026-12-31'])
  assert.deepEqual([per('ultimos_12_meses', h).inicio, per('ultimos_12_meses', h).fim], ['2025-11-01', '2026-10-31'])
  // viradas: semana que cruza o ano; mês anterior de janeiro; trimestre anterior do 1º tri; bissexto
  assert.deepEqual([per('esta_semana', '2027-01-01').inicio, per('esta_semana', '2027-01-01').fim], ['2026-12-28', '2027-01-03'])
  assert.deepEqual([per('mes_anterior', '2027-01-15').inicio, per('mes_anterior', '2027-01-15').fim], ['2026-12-01', '2026-12-31'])
  assert.deepEqual([per('trimestre_anterior', '2027-02-10').inicio, per('trimestre_anterior', '2027-02-10').fim], ['2026-10-01', '2026-12-31'])
  assert.equal(per('mes_anterior', '2028-03-10').fim, '2028-02-29', 'bissexto')
  assert.equal(per('este_mes', h).parcial, true, 'mês corrente é parcial'); assert.equal(per('mes_anterior', h).parcial, false)
  assert.ok('erro' in (P.resolverPeriodo('personalizado', h, { inicio: '2026-09-31', fim: '2026-10-01' }) as object), 'data inexistente recusa')
  assert.ok('erro' in (P.resolverPeriodo('personalizado', h, { inicio: '2026-10-10', fim: '2026-10-01' }) as object), 'fim antes do início recusa')
  // 5. correção de período: agosto → setembro = consulta nova com o período certo
  const ago = per('personalizado', h, { inicio: '2026-08-01', fim: '2026-08-31' }), set = per('personalizado', h, { inicio: '2026-09-01', fim: '2026-09-30' })
  assert.notDeepEqual([ago.inicio, ago.fim], [set.inicio, set.fim])
  // comparação equivalente: mês parcial (1–16/10) × mesmo trecho de setembro; mês fechado × mês fechado
  const antParcial = P.periodoAnterior(per('este_mes', h) as never, h)
  assert.deepEqual([antParcial.inicio, antParcial.fim], ['2026-09-01', '2026-09-16'], 'parcial compara com o mesmo trecho')
  const antSet = P.periodoAnterior(set as never, h); assert.deepEqual([antSet.inicio, antSet.fim], ['2026-08-01', '2026-08-31'])
  const antSem = P.periodoAnterior(per('semana_anterior', h) as never, h); assert.deepEqual([antSem.inicio, antSem.fim], ['2026-09-28', '2026-10-04'])
  const antAno = P.periodoAnterior(per('ano_anterior', h) as never, h); assert.deepEqual([antAno.inicio, antAno.fim], ['2024-01-01', '2024-12-31'])
  // fuso: 02h UTC de 17/10 ainda é dia 16 em São Paulo (lib/datas.hojeISO)
  const { hojeISO } = await import('../lib/datas')
  assert.equal(hojeISO(new Date('2026-10-17T02:00:00Z'), 'America/Sao_Paulo'), '2026-10-16')
  assert.equal(hojeISO(new Date('2026-10-17T02:00:00Z'), 'Europe/Lisbon'), '2026-10-17')
  // balde semanal/mensal/anual
  assert.equal(P.balde('2026-10-16', 'semana'), '2026-10-12'); assert.equal(P.balde('2026-10-16', 'mes'), '2026-10'); assert.equal(P.balde('2026-10-16', 'ano'), '2026')
  ok('13/5/4 períodos: semana, mês, trimestre, ano, 12 meses, viradas, bissexto, fuso, correção e período equivalente')
}

// ═══ 14. Centavos ═══
{
  assert.equal(K.somaReais([0.1, 0.2]), 0.3, '0,1 + 0,2 = 0,30 exato')
  assert.equal(K.somaReais([1234.56, 0.01, 0.005]), 1234.58, 'arredonda cada valor ao centavo')
  ok('14 precisão monetária em centavos')
}

// ═══ 1/2. Títulos: aberto, vencido, a vencer, liquidado, cancelado ═══
const hoje = '2026-10-16'
const receber = [
  { id: 'r1', valor: 1000, valor_recebido: 0, data_vencimento: '2026-10-10', status: 'vencido', cliente_id: 'c1', descricao: 'A', taxa_multa: 2, taxa_juros: 1 }, // vencida 6 dias
  { id: 'r2', valor: 500, valor_recebido: 200, data_vencimento: '2026-10-14', status: 'parcial', cliente_id: 'c2', descricao: 'B' }, // vencida, saldo 300
  { id: 'r3', valor: 800, valor_desconto: 50, valor_recebido: 0, data_vencimento: '2026-10-20', status: 'pendente', cliente_id: 'c1', descricao: 'C' }, // a vencer, saldo 750
  { id: 'r4', valor: 300, valor_recebido: 300, data_vencimento: '2026-10-01', data_recebimento: '2026-10-02', status: 'recebido', cliente_id: 'c3', descricao: 'D' }, // liquidada
  { id: 'r5', valor: 9999, valor_recebido: 0, data_vencimento: '2026-10-05', status: 'cancelado', cliente_id: 'c3', descricao: 'E' }, // cancelada: fora
]
const pagar = [
  { id: 'p1', valor_total: 400, valor_pago: 0, data_vencimento: '2026-10-12', status: 'pendente', fornecedor_id: 'f1', descricao: 'Luz', categoria: 'Energia' },
  { id: 'p2', valor_total: 250.55, valor_pago: 100, data_vencimento: '2026-10-18', status: 'parcial', fornecedor_id: 'f2', descricao: 'Peças', categoria: 'Insumos', data_pagamento: '2026-10-15' },
  { id: 'p3', valor_total: 90, valor_pago: 90, data_vencimento: '2026-10-05', data_pagamento: '2026-10-05', status: 'pago', fornecedor_id: 'f1', descricao: 'Água', categoria: 'Água' },
]
{
  const t = C.totalizarReceber(receber as never, hoje)
  // aberto = 1000 + 300 + 750 = 2050; vencido = 1000 + 300 = 1300; a vencer = 750
  assert.deepEqual([t.aberto, t.vencido, t.a_vencer, t.titulos_abertos, t.titulos_vencidos, t.cancelados_ignorados], [2050, 1300, 750, 3, 2, 1])
  // atualizado: r1 multa 2% (20) + juros 1% × 6/30 (2) = 1022; r2 sem taxa 300; r3 750 → 2072
  assert.equal(t.aberto_atualizado, 2072, 'mesma conta da tela Contas a Receber (multa + juros)')
  const semana = C.totalizarReceber(receber as never, hoje, per('esta_semana', hoje))
  assert.deepEqual([semana.aberto, semana.vencido, semana.a_vencer], [300, 300, 0], 'vence esta semana (12–18/10): só r2 (14/10); r1 venceu dia 10 e r3 vence dia 20')
  const proximos = C.totalizarReceber(receber as never, hoje, per('proximos_7_dias', hoje))
  assert.deepEqual([proximos.aberto, proximos.vencido], [750, 0], 'próximos 7 dias (16–22/10): r3')
  const tp = C.totalizarPagar(pagar as never, hoje)
  assert.deepEqual([tp.aberto, tp.vencido, tp.a_vencer], [550.55, 400, 150.55])
  ok('1/2 contas a pagar e receber: aberto, vencido, a vencer, liquidado e cancelado; filtro "esta semana" pelo vencimento')
}

// ═══ 2/19. Realizado (caixa) e parcial ═══
{
  const vendas = [{ dia: '2026-10-15', valor: 80, forma: 'pix', cancelada: false }, { dia: '2026-10-15', valor: 70, forma: 'credito', cancelada: false }, { dia: '2026-10-15', valor: 60, forma: 'dinheiro', cancelada: true }]
  const semRec = [...receber, { id: 'r6', valor: 100, valor_recebido: 100, data_vencimento: '2026-10-03', status: 'recebido' }]
  const m = C.movimentosRealizados(semRec as never, pagar as never, vendas, per('este_mes', hoje))
  // recebido: r4 300 (02/10); PDV: 80 (pix; crédito e cancelada fora); pago: p2 100 (15/10) + p3 90 (05/10)
  assert.deepEqual([m.recebido_clientes, m.recebido_pdv, m.recebido_total, m.pago_fornecedores, m.saldo_do_periodo], [300, 80, 380, 190, 190])
  assert.equal(m.recebimentos_sem_data, 2, 'r2 (R$ 200 parcial) e r6 têm valor recebido sem data: contados e viram resposta parcial')
  ok('2/19 realizado × previsto: recebido, PDV, pago; crédito e cancelada fora; sem data → parcial')
}

// ═══ 3/4. Séries e comparação ═══
{
  const itens = [{ valor: 100, data: '2026-09-02' }, { valor: 50, data: '2026-09-30' }, { valor: 200, data: '2026-10-01' }, { valor: 10.1, data: '2026-10-12' }, { valor: 0.2, data: '2026-10-13' }]
  assert.deepEqual(C.serie(itens, { inicio: '2026-09-01', fim: '2026-10-31' }, 'mes'), [{ chave: '2026-09', valor: 150 }, { chave: '2026-10', valor: 210.3 }])
  assert.deepEqual(C.serie(itens, { inicio: '2026-10-01', fim: '2026-10-31' }, 'semana'), [{ chave: '2026-09-28', valor: 200 }, { chave: '2026-10-12', valor: 10.3 }])
  assert.deepEqual(C.serie(itens, { inicio: '2026-01-01', fim: '2026-12-31' }, 'ano'), [{ chave: '2026', valor: 360.3 }])
  const atual = C.somaFaixa(itens, { inicio: '2026-10-01', fim: '2026-10-31' }), ant = C.somaFaixa(itens, { inicio: '2026-09-01', fim: '2026-09-30' })
  assert.deepEqual(C.comparar(atual, ant), { diferenca: 60.3, variacao_pct: 40.2, cobertura_anterior: true })
  assert.deepEqual(C.comparar(atual, { valor: 0, registros: 0 }), { diferenca: 210.3, variacao_pct: null, cobertura_anterior: false }, 'sem base anterior: não inventa %')
  ok('3/4 receitas por semana, mês e ano; comparação com período equivalente e sem base')
}

// ═══ 6. Custos fixos ativos × encerrados ═══
{
  const cf = [
    { id: 'a', valor_mensal: 1000, data_inicio: '2026-01-01', data_fim: null }, { id: 'b', valor_mensal: 300, data_inicio: '2026-01-01', data_fim: '2026-08-31' },
    { id: 'c', valor_mensal: 200, data_inicio: '2026-11-01', data_fim: null }, { id: 'd', valor_mensal: 50, data_inicio: null, created_at: '2026-02-10T10:00:00' },
  ]
  const set = C.custosFixosNoMes(cf as never, '2026-09'), ago = C.custosFixosNoMes(cf as never, '2026-08')
  assert.deepEqual([set.total_ativo, set.ativos, set.encerrados, set.futuros, set.sem_data_inicio], [1050, 2, 1, 1, 1], 'setembro: a + d; b encerrou em agosto; c é futuro')
  assert.equal(ago.total_ativo, 1350, 'agosto ainda conta b')
  ok('6 custos fixos: ativo, encerrado, futuro e sem data de início')
}

// ═══ 9/10/16. Reconciliação: duplicidade, divergência, rastreio ═══
{
  const cp = [
    { id: 'x1', valor_total: 500, valor_pago: 0, fornecedor_id: 'f1', numero_nota: '123', data_vencimento: '2026-10-20', descricao: 'Nota 123', status: 'pendente', categoria: 'Insumos' },
    { id: 'x2', valor_total: 500, valor_pago: 0, fornecedor_id: 'f1', numero_nota: '123', data_vencimento: '2026-10-20', descricao: 'Nota 123', status: 'pendente', categoria: 'Insumos' },
    { id: 'x3', valor_total: 700, valor_pago: 0, fornecedor_id: 'f2', data_vencimento: '2026-10-25', descricao: 'Serviço', status: 'pendente', categoria: 'Serv' },
    { id: 'x4', valor_total: 700, valor_pago: 0, fornecedor_id: 'f2', data_vencimento: '2026-10-25', descricao: 'Serviço', status: 'pendente', categoria: 'Serv' },
    { id: 'x5', valor_total: 700, valor_pago: 0, fornecedor_id: 'f9', data_vencimento: '2026-11-25', descricao: 'Outro', status: 'pendente', categoria: 'Serv' }, // mesmo valor, outro fornecedor: NÃO é duplicidade
    { id: 'x6', valor_total: 100, valor_pago: 40, fornecedor_id: 'f3', data_vencimento: '2026-10-01', data_emissao: '2026-10-05', descricao: 'Pago errado', status: 'pago', categoria: '' },
  ]
  const dup = R.duplicidadesPagar(cp as never)
  assert.deepEqual(dup.map((d) => [d.classe, d.ids]), [['correspondencia_confirmada', ['x1', 'x2']], ['possivel_correspondencia', ['x3', 'x4']]], 'nota igual = confirmada; sem nota = possível; mesmo valor sozinho = nada')
  const coe = R.coerenciaPagar(cp as never).map((a) => [a.tipo, a.ids[0]])
  assert.deepEqual(coe, [['status_pago_com_saldo', 'x6'], ['pagamento_sem_data', 'x6'], ['vencimento_antes_da_emissao', 'x6'], ['sem_categoria', 'x6']])
  const cruz = R.cruzamentos({ receitas: [{ id: 'rc1', valor: 110000, status: 'pendente', origem_tabela: 'contas_receber' }], fluxo: [{ id: 'f1', status: 'confirmado', tipo: 'entrada', valor: 17273.31 }, { id: 'f2', status: 'confirmado', tipo: 'saida', valor: 350 }], vendasSemData: [] })
  assert.deepEqual(cruz.map((a) => [a.tipo, a.classe, a.valor]), [['receita_pendente_de_conta_a_receber', 'divergencia', 110000], ['fluxo_status_confirmado', 'informacao_insuficiente', 16923.31]])
  assert.deepEqual(R.resumoAchados([...dup, ...cruz]), { total: 4, confirmadas: 1, possiveis: 1, divergencias: 1, insuficientes: 1 })
  ok('9/10/16 reconciliação: duplicidade confirmada × possível, mesmo valor não basta, status × valor, datas, fontes divergentes, ids rastreáveis')
}

// ═══ 15/16. Contrato: rastreável, parcial explícito, catálogo ═══
{
  const r = K.resultado({ indicador: 'contas_receber_aberto', definicao: 'x', estado: 'verificado', valor: 10, unidade: 'BRL', periodo: per('este_mes', hoje) as never, criterio_data: 'vencimento', fontes: ['contas_receber'], registros: 2, limitacoes: [] })
  assert.equal(r.ref, 'contas_receber_aberto|2026-10-01..2026-10-31|vencimento', 'referência para rastrear o valor')
  assert.ok(r.limitacoes.some((l) => l.includes('período ainda em andamento')), 'período parcial vira limitação explícita')
  assert.equal(K.falhou('titulos', 'timeout').estado, 'erro')
  for (const i of S.INDICADORES) assert.ok(i.definicao && i.formula && i.data && i.regime, `catálogo completo: ${i.id}`)
  assert.ok(S.INDICADORES.find((i) => i.id === 'caixa_realizado')!.definicao.includes('Não é dinheiro livre'))
  assert.ok(S.INDICADORES.find((i) => i.id === 'folha')!.limitacoes[0].startsWith('indisponível'))
  ok('15/16 contrato: valor com período, critério, fontes, registros, estado e referência; catálogo com definição de cada indicador')
}

// ═══ 8/11/19. Ferramentas com banco simulado: DUAS empresas, erro, vazio, parcial ═══
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
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222'
const tab = {
  contas_receber: [...receber.map((r) => ({ ...r, empresa_id: A })), { id: 'rb', valor: 77777, valor_recebido: 0, data_vencimento: '2026-10-11', status: 'pendente', cliente_id: 'cb', empresa_id: B }],
  contas_pagar: [...pagar.map((r) => ({ ...r, empresa_id: A })), { id: 'pb', valor_total: 88888, valor_pago: 0, data_vencimento: '2026-10-11', status: 'pendente', empresa_id: B }],
  clientes: [{ id: 'c1', nome: 'Cliente Um' }, { id: 'c2', nome: 'Cliente Dois' }, { id: 'cb', nome: 'Cliente da Outra Empresa' }],
  fornecedores: [{ id: 'f1', nome: 'Energia SA' }, { id: 'f2', nome: 'Peças Ltda' }],
  custos_fixos: [{ id: 'k1', empresa_id: A, valor_mensal: 1000, data_inicio: '2026-01-01' }, { id: 'k2', empresa_id: B, valor_mensal: 5555, data_inicio: '2026-01-01' }],
}
{
  const { db } = bancoFalso(tab)
  const ctx = { supabase: db, empresaId: A, fuso: 'America/Sao_Paulo' }
  const rec = await F.executarFerramentaFinanceira(ctx, 'titulos', { tipo: 'receber', periodo: 'tudo', inicio: null, fim: null })
  const det = rec.detalhes as { aberto: number; maiores: { cliente: string }[] }
  assert.equal(rec.estado, 'verificado'); assert.ok(det.aberto < 77777 && det.maiores.every((m) => m.cliente !== 'Cliente da Outra Empresa'), '11 isolamento: nada da empresa B')
  const pag = await F.executarFerramentaFinanceira(ctx, 'titulos', { tipo: 'pagar', periodo: 'tudo', inicio: null, fim: null })
  assert.ok((pag.valor as number) < 88888, '11 isolamento em contas a pagar')
  const cf = await F.executarFerramentaFinanceira(ctx, 'custos_fixos_mes', { mes: '2026-09' })
  assert.equal(cf.valor, 1000, '11 isolamento em custos fixos (5555 é da empresa B)')
  assert.equal(cf.periodo?.fim, '2026-09-30', 'último dia do mês certo')
  // 8: erro ≠ vazio
  const { db: dbErro } = bancoFalso(tab, ['contas_pagar'])
  const err = await F.executarFerramentaFinanceira({ ...ctx, supabase: dbErro }, 'titulos', { tipo: 'pagar', periodo: 'tudo', inicio: null, fim: null })
  assert.equal(err.estado, 'erro'); assert.ok(err.limitacoes[0].startsWith('não foi possível consultar agora'), '8 falha de banco vira erro explícito, nunca zero')
  const { db: dbVazio } = bancoFalso({ ...tab, contas_pagar: [] })
  const vaz = await F.executarFerramentaFinanceira({ ...ctx, supabase: dbVazio }, 'titulos', { tipo: 'pagar', periodo: 'tudo', inicio: null, fim: null })
  assert.deepEqual([vaz.estado, vaz.registros, vaz.valor], ['verificado', 0, 0], '8 sem registros = vazio verificado (o motor marca "vazio")')
  const M = await import('../lib/ia/motor')
  assert.equal(M.statusDaSaida(JSON.stringify(vaz)), 'vazio'); assert.equal(M.statusDaSaida(JSON.stringify(err)), 'erro'); assert.equal(M.statusDaSaida(JSON.stringify(rec)), 'ok')
  const per1 = await F.executarFerramentaFinanceira(ctx, 'titulos', { tipo: 'receber', periodo: 'personalizado', inicio: '2026-10-20', fim: '2026-10-01' })
  assert.equal(per1.estado, 'erro', 'parâmetro de período inválido é recusado')
  ok('8/11/19 ferramentas: duas empresas sem vazamento, erro ≠ vazio, parâmetro inválido recusado')
}

// ═══ 7/3/9 ponta a ponta: faturamento, despesas, DRE e reconciliação com o banco simulado ═══
{
  const t2 = {
    ...tab,
    receitas: [
      { id: 'q1', empresa_id: A, valor: 1000, data: '2026-09-10', categoria: 'Serviços', status: 'recebido' },
      { id: 'q2', empresa_id: A, valor: 500, data: '2026-08-05', categoria: 'Serviços', status: 'recebido' },
      { id: 'q3', empresa_id: A, valor: 300, data: '2026-09-15', status: 'recebido', origem_tabela: 'contas_receber', origem_id: 'r4' }, // criada ao receber: a conta já conta
      { id: 'qb', empresa_id: B, valor: 99999, data: '2026-09-10', status: 'recebido' },
    ],
    contas_receber: [{ id: 'cr9', empresa_id: A, valor: 2000, valor_desconto: 100, data_emissao: '2026-09-20', data_vencimento: '2026-10-20', status: 'pendente', cliente_id: 'c1' }],
    venda: [{ id: 'v1', empresa_id: A, valor_total: 250, status: 'finalizada', forma_pagamento: 'pix', criado_em: '2026-09-25T15:00:00Z', finalizada_em: '2026-09-25T15:00:00Z', cancelada_em: null }],
    custos_variaveis: [{ id: 'cv1', empresa_id: A, valor: 400, data: '2026-09-12', categoria: 'Insumos', descricao: 'Matéria-prima' }, { id: 'cvb', empresa_id: B, valor: 8888, data: '2026-09-12', categoria: 'X' }],
    contas_pagar: [{ id: 'cp9', empresa_id: A, valor_total: 600, valor_pago: 0, data_emissao: '2026-09-05', data_vencimento: '2026-10-05', status: 'pendente', categoria: 'Serviços de terceiros', fornecedor_id: 'f2' }],
    custos_fixos: [{ id: 'k1', empresa_id: A, valor_mensal: 1000, data_inicio: '2026-01-01', descricao: 'Aluguel' }],
    empresas: [{ id: A, regime_tributario: 'mei', atividade_fiscal: 'servico', mei_dados: { categoria_mei: 'Serviços' } }],
    dividas: [], fluxo_caixa: [],
  }
  const { db } = bancoFalso(t2)
  const ctx = { supabase: db, empresaId: A, fuso: 'America/Sao_Paulo' }
  const set = { periodo: 'personalizado', inicio: '2026-09-01', fim: '2026-09-30' }
  const fat = await F.executarFerramentaFinanceira(ctx, 'faturamento', { ...set, granularidade: 'mes', comparar: true })
  // setembro por competência: q1 1000 + conta a receber 1900 (2000 − 100, emissão 20/09) + PDV 250 = 3150 (q3 não conta 2×; qb é da outra empresa)
  assert.equal(fat.valor, 3150, '7/3 faturamento por competência sem contar 2× e sem a outra empresa')
  const comp = (fat.detalhes as { comparacao: { anterior: number; diferenca: number } }).comparacao
  assert.deepEqual([comp.anterior, comp.diferenca], [500, 2650], 'comparação com agosto (q2 500)')
  const desp = await F.executarFerramentaFinanceira(ctx, 'despesas', { ...set, agrupar_por: 'categoria', comparar: false })
  assert.equal(desp.valor, 1000, 'despesas de setembro: custo 400 + conta a pagar 600 (emissão 05/09); 8888 é da outra empresa')
  const D = await import('../lib/ia/ferramentaDre')
  const dre = await D.consultarDRE(db, A, { mes_inicio: '2026-09', mes_fim: '2026-09' }, 'America/Sao_Paulo') as Record<string, number>
  assert.equal(dre.receita_bruta, 3150); assert.equal(dre.custos_variaveis, 1000); assert.equal(dre.custos_fixos, 1000)
  assert.equal(dre.lucro_liquido, Math.round((3150 - dre.impostos_deducoes - 1000 - 1000) * 100) / 100, '7 DRE: receita − impostos − variáveis − fixos − juros (0)')
  const rec = await F.executarFerramentaFinanceira(ctx, 'reconciliacao', {})
  assert.equal(rec.estado, 'verificado'); assert.ok(typeof (rec.detalhes as { resumo: { total: number } }).resumo.total === 'number')
  ok('7/3/9 ponta a ponta: faturamento por competência (sem 2× nem outra empresa), comparação, despesas, DRE e reconciliação')
}

// ═══ 12/17/18/20 e ligação no motor ═══
{
  const ferr = readFileSync('lib/ia/ferramentas.ts', 'utf8')
  assert.ok(ferr.includes('...(FERRAMENTAS_FINANCEIRAS as Ferramenta[])') && ferr.includes('NOMES_FERRAMENTAS_FINANCEIRAS.has(nome)'), 'ferramentas novas disponíveis para a IA (OpenAI e Claude)')
  assert.ok(!/SERVICE_ROLE|supabaseServico/.test(readFileSync('lib/financeiro/ferramentasFinanceiras.ts', 'utf8')), 'sem chave de serviço: só RLS do usuário')
  assert.ok(/\.eq\('empresa_id', empresaId\)/.test(readFileSync('lib/financeiro/ferramentasFinanceiras.ts', 'utf8')), 'toda leitura filtra a empresa')
  const motor = readFileSync('lib/ia/motor.ts', 'utf8')
  assert.ok(motor.includes('Caixa realizado NÃO é dinheiro livre para gastar') && motor.includes('Correlação no tempo não é causa'), 'regras da camada CFO no prompt')
  for (const f of F.FERRAMENTAS_FINANCEIRAS) assert.ok(f.input_schema.required.length === Object.keys(f.input_schema.properties).length, `${f.name}: esquema estrito`)
  ok('12/17/18/20 cobertos por check-voz-faseD (operador, cobrança única), check-voz-faseB (consulta repetida) e check-voz-tempo-real (voz); ferramentas ligadas ao motor')
}
console.log('check-financeiro: tudo certo ✔')
