// ═══════════════════════════════════════════════════════════════
// FERRAMENTAS FINANCEIRAS do motor (Plano 3, Tarefa 1). Leem com o cliente do USUÁRIO (RLS: só empresas dele)
// e sempre filtram por empresa_id; calculam com as funções puras de lib/financeiro/calculos e devolvem o
// contrato padrão (lib/financeiro/contrato). Só leitura. Período: motor temporal (lib/financeiro/periodos).
// Reaproveitam a base da DRE por competência (lib/dreCompetencia) e o caixa (lib/caixaSaldo).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { lerTodas } from '../lerTodas'
import { hojeISO, somarDiasISO, somarMesesISO } from '../datas'
import { carregarBaseDRE } from '../dreCompetencia'
import { saldoCaixaRealizado } from '../caixaSaldo'
import { NOMES_PERIODO, periodoAnterior, resolverPeriodo, type Granularidade, type Periodo } from './periodos'
import { falhou, resultado, type ResultadoFinanceiro } from './contrato'
import { agrupar, comparar, custosFixosNoMes, movimentosRealizados, saldoPagar, saldoReceber, serie, somaFaixa, totalizarPagar, totalizarReceber, type CustoFixo, type TituloPagar, type TituloReceber } from './calculos'
import { coerenciaPagar, coerenciaReceber, cruzamentos, duplicidadesPagar, duplicidadesReceber, resumoAchados } from './reconciliacao'
import { definicao } from './semantica'

type Esquema = { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] }
type Ferramenta = { name: string; description: string; input_schema: Esquema; strict: true }
const obj = (properties: Record<string, unknown>): Esquema => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })
const periodo = { type: 'string', enum: NOMES_PERIODO, description: 'Período em palavras (no fuso da empresa). Use "personalizado" com inicio/fim para datas exatas.' }
const inicio = { type: ['string', 'null'], description: 'Só com periodo "personalizado": AAAA-MM-DD (senão null).' }
const fim = { type: ['string', 'null'], description: 'Só com periodo "personalizado": AAAA-MM-DD (senão null).' }
const compararC = { type: 'boolean', description: 'true = comparar com o período anterior equivalente.' }

export const FERRAMENTAS_FINANCEIRAS: Ferramenta[] = [
  { name: 'resumo_financeiro', strict: true, description: 'Resumo verificado da empresa HOJE: caixa realizado (não é dinheiro livre), contas a receber e a pagar em aberto e vencidas, dívidas, faturamento e lucro do mês pela DRE. Use para "como está a empresa".', input_schema: obj({}) },
  { name: 'titulos', strict: true, description: 'Contas a receber ou a pagar: em aberto, vencido e a vencer (saldo = valor − desconto − já pago), filtrando pelo VENCIMENTO no período ("vence esta semana"). Lista os maiores com cliente/fornecedor.',
    input_schema: obj({ tipo: { type: 'string', enum: ['receber', 'pagar'] }, periodo, inicio, fim }) },
  { name: 'movimentos_realizados', strict: true, description: 'CAIXA: quanto entrou (recebimentos de clientes + PDV pago na hora) e saiu (pagamentos) no período, pela data do recebimento/pagamento.',
    input_schema: obj({ periodo, inicio, fim, comparar: compararC }) },
  { name: 'faturamento', strict: true, description: 'Faturamento por COMPETÊNCIA (igual à DRE: receitas + contas a receber + PDV) no período, por dia/semana/mês/ano, com comparação opcional. Mostra também a soma da tela Receitas para transparência.',
    input_schema: obj({ periodo, inicio, fim, granularidade: { type: 'string', enum: ['dia', 'semana', 'mes', 'ano'] }, comparar: compararC }) },
  { name: 'despesas', strict: true, description: 'Despesas por COMPETÊNCIA (custos variáveis + contas a pagar operacionais, como na DRE) no período, agrupadas por categoria, fornecedor ou lançamento, com comparação opcional.',
    input_schema: obj({ periodo, inicio, fim, agrupar_por: { type: 'string', enum: ['categoria', 'fornecedor', 'lancamento'] }, comparar: compararC }) },
  { name: 'receitas_por_cliente', strict: true, description: 'Receita por cliente no período (competência): contas a receber e receitas digitadas com cliente, maiores primeiro.',
    input_schema: obj({ periodo, inicio, fim }) },
  { name: 'custos_fixos_mes', strict: true, description: 'Custos fixos de um mês (AAAA-MM): total ativo, quantos ativos, encerrados (não contam) e futuros.',
    input_schema: obj({ mes: { type: 'string', description: 'AAAA-MM' } }) },
  { name: 'reconciliacao', strict: true, description: 'Confere inconsistências: duplicidades (com e sem identificador), status × valores, pagamentos/recebimentos sem data, vencimento antes da emissão, lançamentos sem categoria, receitas × contas a receber, Fluxo de Caixa "confirmado" e PDV. Só aponta; não corrige nada.',
    input_schema: obj({}) },
]
export const NOMES_FERRAMENTAS_FINANCEIRAS = new Set(FERRAMENTAS_FINANCEIRAS.map((f) => f.name))

type Ctx = { supabase: SupabaseClient; empresaId: string; fuso: string }
const pedirPeriodo = (input: Record<string, unknown>, hoje: string): Periodo | { erro: string } =>
  resolverPeriodo(String(input.periodo ?? 'este_mes'), hoje, { inicio: input.inicio as string | undefined, fim: input.fim as string | undefined })
async function ler<T>(nome: string, p: PromiseLike<{ data: T[] | null; error: { message: string } | null }>): Promise<T[]> {
  const r = await p
  if (r.error) throw new Error(`${nome}: ${r.error.message}`)
  return r.data ?? []
}
const receberCols = 'id, valor, valor_recebido, valor_desconto, taxa_multa, taxa_juros, data_vencimento, data_emissao, data_recebimento, status, cliente_id, descricao, categoria, numero_documento, competencia'
const pagarCols = 'id, valor_total, valor_pago, data_vencimento, data_emissao, data_pagamento, status, fornecedor_id, descricao, categoria, numero_nota, chave_acesso'
async function nomes(supabase: SupabaseClient, tabela: 'clientes' | 'fornecedores', ids: unknown[]) {
  const unicos = [...new Set(ids.filter(Boolean).map(String))].slice(0, 500)
  if (!unicos.length) return new Map<string, string>()
  const data = await ler(tabela, supabase.from(tabela).select('id, nome').in('id', unicos))
  return new Map((data as { id: string; nome: string }[]).map((l) => [String(l.id), String(l.nome ?? '')]))
}
const diaVenda = (v: { finalizada_em?: string | null; criado_em?: string | null }, fuso: string) => { const t = v.finalizada_em || v.criado_em; return t ? hojeISO(new Date(t), fuso) : '' }

export async function executarFerramentaFinanceira(ctx: Ctx, nome: string, input: Record<string, unknown>): Promise<ResultadoFinanceiro> {
  const { supabase, empresaId, fuso } = ctx
  const hoje = hojeISO(new Date(), fuso)
  try {
    switch (nome) {
      case 'titulos': {
        const p = pedirPeriodo({ periodo: 'tudo', ...input }, hoje); if ('erro' in p) return falhou('titulos', p.erro)
        if (input.tipo === 'pagar') {
          const l = await ler('contas_pagar', lerTodas(() => supabase.from('contas_pagar').select(pagarCols).eq('empresa_id', empresaId).order('id'))) as TituloPagar[]
          const faixa = p.nome === 'tudo' ? undefined : p
          const t = totalizarPagar(l, hoje, faixa)
          const abertos = l.filter((c) => !/cancel/i.test(String(c.status)) && saldoPagar(c) > 0 && (!faixa || (c.data_vencimento && c.data_vencimento >= faixa.inicio && c.data_vencimento <= faixa.fim))).sort((a, b) => saldoPagar(b) - saldoPagar(a)).slice(0, 15)
          const forn = await nomes(supabase, 'fornecedores', abertos.map((c) => c.fornecedor_id))
          return resultado({ indicador: 'contas_pagar_aberto', definicao: definicao('contas_pagar_aberto'), estado: 'verificado', valor: t.aberto, unidade: 'BRL', periodo: faixa ? p : null, criterio_data: faixa ? 'data de vencimento dentro do período; vencido = antes de hoje' : 'posição de hoje (todos os vencimentos)',
            fontes: ['contas_pagar', 'fornecedores'], registros: t.titulos_abertos, limitacoes: [],
            detalhes: { ...t, hoje, maiores: abertos.map((c) => ({ fornecedor: forn.get(String(c.fornecedor_id)) ?? null, descricao: c.descricao, saldo: saldoPagar(c), vencimento: c.data_vencimento, vencida: !!c.data_vencimento && c.data_vencimento < hoje })) } })
        }
        const l = await ler('contas_receber', lerTodas(() => supabase.from('contas_receber').select(receberCols).eq('empresa_id', empresaId).order('id'))) as TituloReceber[]
        const faixa = p.nome === 'tudo' ? undefined : p
        const t = totalizarReceber(l, hoje, faixa)
        const abertos = l.filter((c) => !/cancel/i.test(String(c.status)) && saldoReceber(c, hoje).principal > 0 && (!faixa || (c.data_vencimento && c.data_vencimento >= faixa.inicio && c.data_vencimento <= faixa.fim))).sort((a, b) => saldoReceber(b, hoje).principal - saldoReceber(a, hoje).principal).slice(0, 15)
        const cli = await nomes(supabase, 'clientes', abertos.map((c) => c.cliente_id))
        return resultado({ indicador: 'contas_receber_aberto', definicao: definicao('contas_receber_aberto'), estado: 'verificado', valor: t.aberto, unidade: 'BRL', periodo: faixa ? p : null, criterio_data: faixa ? 'data de vencimento dentro do período; vencido = antes de hoje' : 'posição de hoje (todos os vencimentos)',
          fontes: ['contas_receber', 'clientes'], registros: t.titulos_abertos, limitacoes: ['"aberto_atualizado" inclui multa e juros de atraso, como a tela Contas a Receber'],
          detalhes: { ...t, hoje, maiores: abertos.map((c) => { const s = saldoReceber(c, hoje); return { cliente: cli.get(String(c.cliente_id)) ?? null, descricao: c.descricao, saldo: s.principal, saldo_atualizado: s.atualizado, vencimento: c.data_vencimento, dias_atraso: s.dias } }) } })
      }
      case 'movimentos_realizados': {
        const p = pedirPeriodo(input, hoje); if ('erro' in p) return falhou('movimentos_realizados', p.erro)
        const ant = input.comparar ? periodoAnterior(p, hoje) : null
        const desde = ant ? ant.inicio : p.inicio
        const [rec, pag, vd] = await Promise.all([
          ler('contas_receber', lerTodas(() => supabase.from('contas_receber').select(receberCols).eq('empresa_id', empresaId).gte('data_recebimento', desde).lte('data_recebimento', p.fim).order('id'))),
          ler('contas_pagar', lerTodas(() => supabase.from('contas_pagar').select(pagarCols).eq('empresa_id', empresaId).gte('data_pagamento', desde).lte('data_pagamento', p.fim).order('id'))),
          ler('venda', lerTodas(() => supabase.from('venda').select('valor_total, status, forma_pagamento, finalizada_em, criado_em, cancelada_em').eq('empresa_id', empresaId).eq('status', 'finalizada').gte('criado_em', `${desde}T00:00:00-03:00`).order('id'))),
        ])
        const vendas = (vd as { valor_total: number; forma_pagamento: string | null; finalizada_em: string | null; criado_em: string | null; cancelada_em: string | null }[]).map((v) => ({ dia: diaVenda(v, fuso), valor: Number(v.valor_total) || 0, forma: v.forma_pagamento, cancelada: !!v.cancelada_em }))
        const m = movimentosRealizados(rec as TituloReceber[], pag as TituloPagar[], vendas, p)
        const lim: string[] = []
        if (m.recebimentos_sem_data || m.pagamentos_sem_data) lim.push(`${m.recebimentos_sem_data} recebimento(s) e ${m.pagamentos_sem_data} pagamento(s) sem data não puderam ser datados`)
        lim.push('custos e receitas digitados sem conta a pagar/receber não entram aqui (estão no Fluxo de Caixa e na competência)')
        let comp = null
        if (ant) { const a = movimentosRealizados(rec as TituloReceber[], pag as TituloPagar[], vendas, ant); comp = { periodo_anterior: ant.rotulo, recebido_total: comparar({ valor: m.recebido_total, registros: m.registros }, { valor: a.recebido_total, registros: a.registros }), pago: comparar({ valor: m.pago_fornecedores, registros: m.registros }, { valor: a.pago_fornecedores, registros: a.registros }) } }
        return resultado({ indicador: 'receita_recebida', definicao: `${definicao('receita_recebida')} Pagos: ${definicao('despesas_pagas')}`, estado: m.recebimentos_sem_data || m.pagamentos_sem_data ? 'parcial' : 'verificado', valor: m.saldo_do_periodo, unidade: 'BRL', periodo: p,
          criterio_data: 'data do recebimento / data do pagamento (caixa)', fontes: ['contas_receber', 'contas_pagar', 'venda (PDV)'], registros: m.registros, limitacoes: lim, detalhes: { ...m, comparacao: comp } })
      }
      case 'faturamento': {
        const p = pedirPeriodo(input, hoje); if ('erro' in p) return falhou('faturamento', p.erro)
        const ant = input.comparar ? periodoAnterior(p, hoje) : null
        const base = await carregarBaseDRE(empresaId, ant ? ant.inicio : p.inicio, p.fim, supabase as never)
        if (base.falhou) return falhou('faturamento', 'leitura da base da DRE falhou')
        const g = (['dia', 'semana', 'mes', 'ano'].includes(String(input.granularidade)) ? input.granularidade : 'mes') as Granularidade
        const atual = somaFaixa(base.receitas, p)
        const lanc = await ler('receitas', lerTodas(() => supabase.from('receitas').select('valor, data').eq('empresa_id', empresaId).gte('data', p.inicio).lte('data', p.fim).order('id')))
        const devol = somaFaixa(base.devolucoes, p)
        return resultado({ indicador: 'faturamento_competencia', definicao: definicao('faturamento_competencia'), estado: 'verificado', valor: atual.valor, unidade: 'BRL', periodo: p, criterio_data: 'competência (mês do fato)',
          fontes: ['receitas', 'contas_receber', 'venda (PDV)'], registros: atual.registros,
          limitacoes: [...(atual.registros === 0 ? ['não há registros de receita no período'] : []), ...(ant && somaFaixa(base.receitas, ant).registros === 0 ? ['período anterior sem registros: comparação sem base'] : [])],
          detalhes: { serie: serie(base.receitas, p, g), granularidade: g, devolucoes_pdv: devol.valor, receitas_lancadas_tela_receitas: somaFaixa((lanc as { valor: number; data: string }[]), p).valor,
            comparacao: ant ? { periodo_anterior: ant.rotulo, anterior: somaFaixa(base.receitas, ant).valor, ...comparar(atual, somaFaixa(base.receitas, ant)) } : null } })
      }
      case 'despesas': {
        const p = pedirPeriodo(input, hoje); if ('erro' in p) return falhou('despesas', p.erro)
        const ant = input.comparar ? periodoAnterior(p, hoje) : null
        const por = String(input.agrupar_por ?? 'categoria')
        const base = await carregarBaseDRE(empresaId, ant ? ant.inicio : p.inicio, p.fim, supabase as never)
        if (base.falhou) return falhou('despesas', 'leitura da base da DRE falhou')
        const noPeriodo = base.custos.filter((c) => c.data >= p.inicio && c.data <= p.fim)
        let grupos
        if (por === 'fornecedor') {
          const cps = await ler('contas_pagar', lerTodas(() => supabase.from('contas_pagar').select('id, fornecedor_id').eq('empresa_id', empresaId).order('id')))
          const fornDe = new Map((cps as { id: string; fornecedor_id: string | null }[]).map((c) => [String(c.id), c.fornecedor_id]))
          const forn = await nomes(supabase, 'fornecedores', [...fornDe.values()])
          grupos = agrupar(noPeriodo, (c) => (c.origem === 'conta_pagar' ? forn.get(String(fornDe.get(c.id))) ?? 'Fornecedor não informado' : 'Custo digitado (sem fornecedor)'), (c) => c.valor)
        } else if (por === 'lancamento') grupos = agrupar(noPeriodo, (c) => `${c.descricao ?? c.categoria ?? 'sem descrição'} (${c.data})`, (c) => c.valor, 30)
        else grupos = agrupar(noPeriodo, (c) => c.categoria ?? 'Sem categoria', (c) => c.valor)
        const atual = somaFaixa(base.custos, p)
        return resultado({ indicador: 'despesas_competencia', definicao: definicao('despesas_competencia'), estado: 'verificado', valor: atual.valor, unidade: 'BRL', periodo: p, criterio_data: 'competência (custo: data; conta a pagar: emissão)',
          fontes: ['custos_variaveis', 'contas_pagar'], registros: atual.registros, limitacoes: ['custos fixos não entram aqui (use custos_fixos_mes ou a DRE)', ...(atual.registros === 0 ? ['não há despesas no período'] : [])],
          detalhes: { agrupado_por: por, ...grupos, comparacao: ant ? { periodo_anterior: ant.rotulo, anterior: somaFaixa(base.custos, ant).valor, ...comparar(atual, somaFaixa(base.custos, ant)) } : null } })
      }
      case 'receitas_por_cliente': {
        const p = pedirPeriodo(input, hoje); if ('erro' in p) return falhou('receitas_por_cliente', p.erro)
        const [cr, rc] = await Promise.all([
          ler('contas_receber', lerTodas(() => supabase.from('contas_receber').select(receberCols).eq('empresa_id', empresaId).order('id'))),
          ler('receitas', lerTodas(() => supabase.from('receitas').select('id, valor, data, cliente_id, origem_tabela').eq('empresa_id', empresaId).gte('data', p.inicio).lte('data', p.fim).order('id'))),
        ])
        const itens: { cliente: string | null; valor: number }[] = []
        for (const c of cr as TituloReceber[]) {
          if (/cancel/i.test(String(c.status))) continue
          const d = String(c.competencia || c.data_emissao || c.data_vencimento || '').slice(0, 10)
          if (d >= p.inicio && d <= p.fim) itens.push({ cliente: c.cliente_id ?? null, valor: (Number(c.valor) || 0) - (Number(c.valor_desconto) || 0) })
        }
        for (const r of rc as { valor: number; cliente_id: string | null; origem_tabela: string | null }[]) if (r.origem_tabela !== 'contas_receber') itens.push({ cliente: r.cliente_id, valor: Number(r.valor) || 0 })
        const cli = await nomes(supabase, 'clientes', itens.map((i) => i.cliente))
        const g = agrupar(itens, (i) => (i.cliente ? cli.get(String(i.cliente)) ?? 'Cliente sem cadastro' : 'Sem cliente informado'), (i) => i.valor)
        return resultado({ indicador: 'faturamento_competencia', definicao: 'Receita do período agrupada por cliente (competência).', estado: 'verificado', valor: g.total, unidade: 'BRL', periodo: p, criterio_data: 'competência (conta a receber: competência → emissão → vencimento; receita: data)',
          fontes: ['contas_receber', 'receitas', 'clientes'], registros: itens.length, limitacoes: ['vendas do PDV sem cliente não entram nesta divisão'], detalhes: g })
      }
      case 'custos_fixos_mes': {
        const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(input.mes)) ? String(input.mes) : hoje.slice(0, 7)
        const l = await ler('custos_fixos', supabase.from('custos_fixos').select('id, descricao, categoria, valor_mensal, data_inicio, data_fim, created_at').eq('empresa_id', empresaId)) as CustoFixo[]
        const r = custosFixosNoMes(l, mes)
        return resultado({ indicador: 'custos_fixos', definicao: definicao('custos_fixos'), estado: 'verificado', valor: r.total_ativo, unidade: 'BRL', periodo: resolverPeriodo('personalizado', hoje, { inicio: `${mes}-01`, fim: somarDiasISO(somarMesesISO(`${mes}-01`, 1), -1) }) as Periodo,
          criterio_data: 'vigência (data_inicio → data_fim)', fontes: ['custos_fixos'], registros: r.ativos, limitacoes: r.sem_data_inicio ? [`${r.sem_data_inicio} custo(s) sem data de início usam a data do cadastro`] : [], detalhes: r })
      }
      case 'resumo_financeiro': {
        const [caixa, cr, cp, dv, base] = await Promise.all([
          saldoCaixaRealizado(supabase, empresaId, hoje),
          ler('contas_receber', lerTodas(() => supabase.from('contas_receber').select(receberCols).eq('empresa_id', empresaId).order('id'))),
          ler('contas_pagar', lerTodas(() => supabase.from('contas_pagar').select(pagarCols).eq('empresa_id', empresaId).order('id'))),
          ler('dividas', supabase.from('dividas').select('valor_total, valor_pago')).then((l) => l as { valor_total: number; valor_pago: number }[]),
          carregarBaseDRE(empresaId, `${hoje.slice(0, 7)}-01`, hoje, supabase as never),
        ])
        const mes = resolverPeriodo('este_mes', hoje) as Periodo
        const lim = ['caixa realizado não desconta contas a pagar nem reservas (não é dinheiro livre)', 'lançamentos do Fluxo de Caixa com status "confirmado" ficam fora do caixa (decisão pendente)']
        if (caixa.erro) lim.push('caixa: leitura falhou')
        if (base.falhou) lim.push('faturamento do mês: leitura falhou')
        return resultado({ indicador: 'resumo_financeiro', definicao: 'Posição de hoje com as definições do catálogo semântico.', estado: caixa.erro || base.falhou ? 'parcial' : 'verificado', valor: null, unidade: 'LISTA', periodo: mes, criterio_data: 'posição de hoje; faturamento do mês por competência',
          fontes: ['fluxo_caixa', 'venda', 'contas_receber', 'contas_pagar', 'dividas', 'DRE por competência'], registros: (cr as unknown[]).length + (cp as unknown[]).length, limitacoes: lim,
          detalhes: { hoje, caixa_realizado: caixa.erro ? null : caixa.saldo, a_receber: totalizarReceber(cr as TituloReceber[], hoje), a_pagar: totalizarPagar(cp as TituloPagar[], hoje),
            dividas_saldo: dv.reduce((s, d) => s + Math.max(0, (Number(d.valor_total) || 0) - (Number(d.valor_pago) || 0)), 0), faturamento_mes_ate_hoje: base.falhou ? null : somaFaixa(base.receitas, mes).valor,
            despesas_variaveis_mes_ate_hoje: base.falhou ? null : somaFaixa(base.custos, mes).valor, para_lucro_do_mes: 'use a ferramenta dre (inclui impostos, custos fixos e juros)' } })
      }
      case 'reconciliacao': {
        const [cr, cp, rc, fc, vd] = await Promise.all([
          ler('contas_receber', lerTodas(() => supabase.from('contas_receber').select(receberCols).eq('empresa_id', empresaId).order('id'))),
          ler('contas_pagar', lerTodas(() => supabase.from('contas_pagar').select(`${pagarCols}`).eq('empresa_id', empresaId).order('id'))),
          ler('receitas', lerTodas(() => supabase.from('receitas').select('id, valor, status, origem_tabela, origem_id, data').eq('empresa_id', empresaId).order('id'))),
          ler('fluxo_caixa', lerTodas(() => supabase.from('fluxo_caixa').select('id, status, tipo, valor').eq('empresa_id', empresaId).order('id'))),
          ler('venda', lerTodas(() => supabase.from('venda').select('id, status, finalizada_em').eq('empresa_id', empresaId).eq('status', 'finalizada').order('id'))),
        ])
        const achados = [
          ...duplicidadesPagar(cp as TituloPagar[]), ...duplicidadesReceber(cr as TituloReceber[]),
          ...coerenciaPagar(cp as TituloPagar[]), ...coerenciaReceber(cr as TituloReceber[]),
          ...cruzamentos({ receitas: rc as never, fluxo: fc as never, vendasSemData: (vd as { id: string; finalizada_em: string | null }[]).filter((v) => !v.finalizada_em).map((v) => v.id) }),
        ]
        const sem = achados.filter((a) => a.tipo === 'sem_categoria')
        const outros = achados.filter((a) => a.tipo !== 'sem_categoria')
        return resultado({ indicador: 'reconciliacao', definicao: 'Conferência de consistência: só aponta, não corrige.', estado: 'verificado', valor: achados.length, unidade: 'QTD', periodo: null, criterio_data: 'todos os registros da empresa',
          fontes: ['contas_receber', 'contas_pagar', 'receitas', 'fluxo_caixa', 'venda'], registros: (cr as unknown[]).length + (cp as unknown[]).length + (rc as unknown[]).length,
          limitacoes: ['mesmo valor sozinho não é tratado como duplicidade'], detalhes: { resumo: resumoAchados(achados), achados: outros.slice(0, 30), sem_categoria: { quantidade: sem.length, ids: sem.slice(0, 20).flatMap((a) => a.ids) } } })
      }
      default: return falhou(nome, 'ferramenta desconhecida')
    }
  } catch (err) {
    return falhou(nome, err instanceof Error ? err.message : String(err))
  }
}
