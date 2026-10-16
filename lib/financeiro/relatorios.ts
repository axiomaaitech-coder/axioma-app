// ═══════════════════════════════════════════════════════════════
// RELATÓRIOS EXECUTIVOS CFO (Plano 3, Tarefa 2). Monta a estrutura `Relatorio` (lib/financeiro/relatorioTipos)
// que alimenta a tela, o PDF e o José — ninguém recalcula. Números SÓ de:
//   • executarFerramentaFinanceira (Tarefa 1, testadas), • consultarDRE (mesmo cálculo da tela DRE),
//   • leituras com o cliente do USUÁRIO (RLS) + filtro empresa_id, somadas em centavos.
// Achados e recomendações saem de REGRAS sobre esses números (com evidência, prioridade e confiança),
// nunca de texto livre de IA. Só leitura: nada é gravado, corrigido ou apagado.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { hojeISO, somarDiasISO } from '../datas'
import { lerTodas } from '../lerTodas'
import { diaDoTimestamp } from '../dreCompetencia'
import { saldoCaixaRealizado } from '../caixaSaldo'
import { consultarDRE } from '../ia/ferramentaDre'
import { executarFerramentaFinanceira } from './ferramentasFinanceiras'
import { diasEntre, periodoAnterior, resolverPeriodo, type Periodo } from './periodos'
import { comparar, saldoPagar, saldoReceber, type TituloPagar, type TituloReceber } from './calculos'
import { centavos, reais, type EstadoResultado, type ResultadoFinanceiro } from './contrato'
import { TIPOS_RELATORIO, type Achado, type Indicador, type Lang, type PedidoRelatorio, type Relatorio, type Secao, type TipoColuna, type TipoRelatorio } from './relatorioTipos'
import { L, fmtData, fmtMoeda, fmtPct, nomeFonte, rotuloPeriodo, tituloRelatorio, tx } from './relatorioTextos'

export type CtxRelatorio = { supabase: SupabaseClient; empresaId: string; fuso: string }
type RF = ResultadoFinanceiro
type Comp = { anterior: number | null; diferenca: number | null; variacao_pct: number | null }
type Dre = {
  receita_bruta: number; devolucoes: number; impostos_deducoes: number; receita_liquida: number; custos_variaveis: number; margem_contribuicao: number
  margem_contribuicao_pct: number | null; custos_fixos: number; resultado_operacional: number; juros_pagos: number; juros_estimados_dividas: number
  lucro_liquido: number; lucro_liquido_pct: number | null; registros: number; regime_tributario: string
  receitas_por_categoria: { categoria: string; valor: number }[]; custos_variaveis_por_categoria: { categoria: string; valor: number }[]
  periodo: { de: string; ate: string; meses: number }; estado: EstadoResultado; sem_movimento: boolean
}
const r2 = (v: number) => Math.round(v * 100) / 100
const pctDe = (parte: number, total: number) => (total ? r2((parte / total) * 100) : null)
const MAX_DIAS = 731 // 24 meses: o mesmo teto da DRE

// Números que as regras de achados e o resumo usam (cada relatório preenche o que consultou)
type Numeros = Partial<{
  faturamento: number; fatVar: number | null; despesas: number; despVar: number | null; lucro: number; margem: number | null
  recebido: number; pago: number; caixa: number | null; receberAberto: number; receberVencido: number; pagarAberto: number; pagarVencido: number
  receber30: number; pagar30: number; topCliente: { nome: string; pct: number }; dividaSaldo: number; jurosMes: number; fatMensal: number
  obrigVencidas: { qtd: number; valor: number }; difCaixa: { qtd: number; valor: number }; canceladas: { qtd: number; valor: number }
  vendas: { qtd: number; valor: number }; reconc: { confirmadas: number; possiveis: number; divergencias: number; insuficientes: number; total: number }
}>

// ─── Coletor: estado, fontes, referências e limitações de cada consulta usada ───
function coletor(lang: Lang) {
  const estados: EstadoResultado[] = [], fontes = new Set<string>(), refs: string[] = [], lim: string[] = []
  const nomeConsulta = (n: string) => ({
    faturamento: L(lang, 'faturamento', 'revenue', 'facturación'), despesas: L(lang, 'despesas', 'expenses', 'gastos'), movimentos_realizados: L(lang, 'recebimentos e pagamentos', 'receipts and payments', 'cobros y pagos'),
    resumo_financeiro: L(lang, 'posição de hoje', "today's position", 'posición de hoy'), titulos: L(lang, 'contas a receber/pagar', 'receivables/payables', 'cuentas por cobrar/pagar'),
    receitas_por_cliente: L(lang, 'receita por cliente', 'revenue by client', 'ingreso por cliente'), custos_fixos_mes: L(lang, 'custos fixos', 'fixed costs', 'costos fijos'),
    reconciliacao: L(lang, 'conferência de consistência', 'consistency check', 'verificación de consistencia'), dre: 'DRE',
  } as Record<string, string>)[n] ?? n
  return {
    usar(nome: string, r: RF): RF | null {
      estados.push(r.estado); refs.push(r.ref); r.fontes.forEach((f) => fontes.add(f))
      if (r.estado === 'erro' || r.estado === 'indisponivel') { lim.push(L(lang, `Não foi possível consultar ${nomeConsulta(nome)} agora: esse dado ficou de fora (não é zero).`, `Could not query ${nomeConsulta(nome)} now: this data was left out (it is not zero).`, `No fue posible consultar ${nomeConsulta(nome)} ahora: ese dato quedó fuera (no es cero).`)); return null }
      return r
    },
    dre(d: Dre | null, ref: string, rotulo?: string): Dre | null {
      refs.push(`dre|${ref}`); fontes.add('DRE por competência')
      if (!d) { estados.push('erro'); lim.push(L(lang, `Não foi possível consultar a DRE${rotulo ? ` (${rotulo})` : ''} agora: lucro e margem ficaram de fora.`, `Could not query the income statement${rotulo ? ` (${rotulo})` : ''} now: profit and margin were left out.`, `No fue posible consultar el estado de resultados${rotulo ? ` (${rotulo})` : ''} ahora: utilidad y margen quedaron fuera.`)); return null }
      estados.push(d.estado === 'parcial' ? 'parcial' : 'verificado')
      if (d.sem_movimento) this.limitar(L(lang, `Sem receitas nem custos registrados de ${d.periodo.de} a ${d.periodo.ate}: a DRE não tem dados para mostrar resultado (não significa lucro zero).`, `No revenue or costs recorded from ${d.periodo.de} to ${d.periodo.ate}: the income statement has no data to show a result (it does not mean zero profit).`, `Sin ingresos ni costos registrados de ${d.periodo.de} a ${d.periodo.ate}: el estado de resultados no tiene datos para mostrar resultado (no significa utilidad cero).`))
      return d
    },
    leitura(tabelas: string[], ok: boolean, ref: string) {
      refs.push(ref); tabelas.forEach((t) => fontes.add(t)); estados.push(ok ? 'verificado' : 'erro')
      if (!ok) lim.push(L(lang, `A leitura de ${tabelas.map((t) => nomeFonte(t, lang)).join(', ')} falhou agora: esse dado ficou de fora (não é zero).`, `Reading ${tabelas.map((t) => nomeFonte(t, lang)).join(', ')} failed now: this data was left out (it is not zero).`, `La lectura de ${tabelas.map((t) => nomeFonte(t, lang)).join(', ')} falló ahora: ese dato quedó fuera (no es cero).`))
    },
    limitar(t: string) { if (!lim.includes(t)) lim.push(t) },
    fim() {
      const ok = estados.filter((e) => e === 'verificado' || e === 'nao_aplicavel').length
      const ruins = estados.filter((e) => e === 'erro' || e === 'indisponivel').length
      const estado: EstadoResultado = estados.length && ruins === estados.length ? 'erro' : ruins || estados.includes('parcial') ? 'parcial' : ok ? 'verificado' : 'indisponivel'
      return { estado, fontes: [...new Set([...fontes].map((f) => nomeFonte(f, lang)))], refs, limitacoes: lim }
    },
  }
}

async function ler<T>(p: PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[] | null> {
  try { const r = await p; return r.error ? null : (r.data ?? []) } catch { return null }
}
async function dreDe(ctx: CtxRelatorio, faixa: { inicio: string; fim: string }): Promise<Dre | null> {
  try {
    const r = await consultarDRE(ctx.supabase, ctx.empresaId, { mes_inicio: faixa.inicio.slice(0, 7), mes_fim: faixa.fim.slice(0, 7) }, ctx.fuso)
    return 'erro' in r ? null : (r as unknown as Dre)
  } catch { return null }
}
const comp = (atual: number, anterior: number | null, registrosAnt: number): Comp | undefined =>
  anterior == null ? undefined : { anterior, ...((c) => ({ diferenca: c.diferenca, variacao_pct: c.variacao_pct }))(comparar({ valor: atual, registros: 1 }, { valor: anterior, registros: registrosAnt })) }
const ind = (rotulo: string, valor: number | null | undefined, unidade: Indicador['unidade'], classe: Indicador['classe'], c?: Comp, nota?: string): Indicador =>
  ({ rotulo, valor: valor ?? null, unidade, classe, ...(c ?? {}), ...(nota ? { nota } : {}) })
const tabela = (id: string, titulo: string, colunas: [string, TipoColuna][], linhas: (string | number | null)[][], lang: Lang, total?: (string | number | null)[]): Secao =>
  ({ id, titulo, tipo: 'tabela', colunas: colunas.map(([rotulo, tipo]) => ({ rotulo, tipo })), linhas, ...(total ? { total } : {}), vazio: tx(lang, 'sem_dados') })

// Faixas de atraso (aging) — dias de atraso = dias depois do vencimento (mesma conta de calculos.saldoReceber)
const FAIXAS: [number, number, [string, string, string]][] = [
  [-Infinity, 0, ['A vencer', 'Not yet due', 'Por vencer']], [1, 30, ['1 a 30 dias', '1 to 30 days', '1 a 30 días']], [31, 60, ['31 a 60 dias', '31 to 60 days', '31 a 60 días']],
  [61, 90, ['61 a 90 dias', '61 to 90 days', '61 a 90 días']], [91, Infinity, ['Mais de 90 dias', 'Over 90 days', 'Más de 90 días']],
]
function aging(itens: { dias: number; saldo: number }[], lang: Lang) {
  const total = itens.reduce((s, i) => s + centavos(i.saldo), 0)
  const linhas = FAIXAS.map(([de, ate, nome]) => {
    const f = itens.filter((i) => i.dias >= de && i.dias <= ate)
    const c = f.reduce((s, i) => s + centavos(i.saldo), 0)
    return [L(lang, ...nome), f.length, reais(c), total ? r2((c / total) * 100) : 0]
  })
  return { linhas, total: reais(total), qtd: itens.length }
}

// ─── Regras de achados: só disparam com número consultado; evidência = os próprios números ───
function achadosPorRegras(n: Numeros, lang: Lang): Achado[] {
  const m = (v: number) => fmtMoeda(v, lang), p = (v: number) => fmtPct(v, lang)
  const out: Achado[] = []
  if (n.lucro != null && n.lucro < 0) out.push({ tipo: 'calculo', prioridade: 'alta', confianca: 'media',
    titulo: L(lang, 'Prejuízo no período', 'Loss in the period', 'Pérdida en el período'),
    evidencia: L(lang, `Lucro líquido pela DRE de ${m(n.lucro)} (impostos estimados pelo regime).`, `Net profit per income statement of ${m(n.lucro)} (taxes estimated by regime).`, `Utilidad neta según estado de resultados de ${m(n.lucro)} (impuestos estimados por régimen).`),
    recomendacao: L(lang, 'Revisar as maiores despesas e os custos fixos do período e conferir se toda a receita foi lançada.', 'Review the largest expenses and fixed costs of the period and check that all revenue was recorded.', 'Revisar los mayores gastos y costos fijos del período y verificar que todo el ingreso fue registrado.') })
  else if (n.margem != null && n.margem >= 0 && n.margem < 5 && (n.faturamento ?? 0) > 0) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'media',
    titulo: L(lang, 'Margem líquida baixa', 'Low net margin', 'Margen neto bajo'),
    evidencia: L(lang, `Margem líquida de ${p(n.margem)} pela DRE.`, `Net margin of ${p(n.margem)} per income statement.`, `Margen neto de ${p(n.margem)} según estado de resultados.`),
    recomendacao: L(lang, 'Avaliar preços e custos variáveis: uma variação pequena de custo já zera o lucro.', 'Assess prices and variable costs: a small cost change already wipes out profit.', 'Evaluar precios y costos variables: una pequeña variación de costo ya elimina la utilidad.') })
  if (n.receberVencido != null && n.receberVencido > 0) {
    const pv = pctDe(n.receberVencido, n.receberAberto ?? 0) ?? 0
    out.push({ tipo: 'fato', prioridade: pv >= 30 ? 'alta' : 'media', confianca: 'alta',
      titulo: L(lang, 'Valores vencidos a receber', 'Overdue receivables', 'Cobros vencidos'),
      evidencia: L(lang, `${m(n.receberVencido)} vencidos de ${m(n.receberAberto ?? 0)} em aberto (${p(pv)}).`, `${m(n.receberVencido)} overdue out of ${m(n.receberAberto ?? 0)} open (${p(pv)}).`, `${m(n.receberVencido)} vencidos de ${m(n.receberAberto ?? 0)} abiertos (${p(pv)}).`),
      recomendacao: L(lang, 'Cobrar primeiro os maiores valores e os atrasos mais antigos (veja a tabela de atraso).', 'Collect the largest amounts and the oldest delays first (see the overdue table).', 'Cobrar primero los mayores valores y los atrasos más antiguos (vea la tabla de atraso).') })
  }
  if (n.pagarVencido != null && n.pagarVencido > 0) out.push({ tipo: 'fato', prioridade: 'alta', confianca: 'alta',
    titulo: L(lang, 'Contas a pagar vencidas', 'Overdue payables', 'Cuentas por pagar vencidas'),
    evidencia: L(lang, `${m(n.pagarVencido)} vencidos e não pagos.`, `${m(n.pagarVencido)} overdue and unpaid.`, `${m(n.pagarVencido)} vencidos y no pagados.`),
    recomendacao: L(lang, 'Priorizar o que gera multa, juros ou corte de serviço e negociar o restante com os fornecedores.', 'Prioritize what generates fines, interest or service cuts and negotiate the rest with suppliers.', 'Priorizar lo que genera multa, intereses o corte de servicio y negociar el resto con los proveedores.') })
  if (n.receber30 != null && n.pagar30 != null && n.pagar30 > n.receber30 + Math.max(0, n.caixa ?? 0)) out.push({ tipo: 'calculo', prioridade: 'alta', confianca: 'media',
    titulo: L(lang, 'Risco de falta de caixa nos próximos 30 dias', 'Cash shortfall risk in the next 30 days', 'Riesgo de falta de caja en los próximos 30 días'),
    evidencia: L(lang, `A pagar nos próximos 30 dias ${m(n.pagar30)}; a receber ${m(n.receber30)}; caixa realizado ${m(n.caixa ?? 0)}.`, `Payables in the next 30 days ${m(n.pagar30)}; receivables ${m(n.receber30)}; realized cash ${m(n.caixa ?? 0)}.`, `Por pagar en los próximos 30 días ${m(n.pagar30)}; por cobrar ${m(n.receber30)}; caja realizada ${m(n.caixa ?? 0)}.`),
    recomendacao: L(lang, 'Antecipar recebimentos, renegociar vencimentos ou reservar caixa antes das datas.', 'Bring receipts forward, renegotiate due dates or reserve cash before the dates.', 'Adelantar cobros, renegociar vencimientos o reservar caja antes de las fechas.') })
  if (n.recebido != null && n.pago != null && n.pago > n.recebido && n.pago > 0) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'alta',
    titulo: L(lang, 'Saiu mais dinheiro do que entrou', 'More money went out than came in', 'Salió más dinero del que entró'),
    evidencia: L(lang, `Recebido ${m(n.recebido)} e pago ${m(n.pago)} no período (caixa).`, `Received ${m(n.recebido)} and paid ${m(n.pago)} in the period (cash).`, `Cobrado ${m(n.recebido)} y pagado ${m(n.pago)} en el período (caja).`),
    recomendacao: L(lang, 'Conferir se foi pontual (compra grande, imposto anual) ou recorrente.', 'Check whether it was one-off (large purchase, annual tax) or recurring.', 'Verificar si fue puntual (compra grande, impuesto anual) o recurrente.') })
  if (n.topCliente && n.topCliente.pct >= 40) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'alta',
    titulo: L(lang, 'Receita concentrada em um cliente', 'Revenue concentrated in one client', 'Ingreso concentrado en un cliente'),
    evidencia: L(lang, `${n.topCliente.nome} responde por ${p(n.topCliente.pct)} da receita com cliente informado.`, `${n.topCliente.nome} accounts for ${p(n.topCliente.pct)} of revenue with an identified client.`, `${n.topCliente.nome} representa ${p(n.topCliente.pct)} del ingreso con cliente informado.`),
    recomendacao: L(lang, 'Reduzir a dependência: perder esse cliente afetaria muito o faturamento.', 'Reduce dependence: losing this client would heavily affect revenue.', 'Reducir la dependencia: perder este cliente afectaría mucho la facturación.') })
  if (n.fatVar != null && n.fatVar <= -10) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'media',
    titulo: L(lang, 'Faturamento caiu', 'Revenue dropped', 'La facturación bajó'),
    evidencia: L(lang, `Variação de ${p(n.fatVar)} contra o período anterior equivalente.`, `Change of ${p(n.fatVar)} versus the equivalent previous period.`, `Variación de ${p(n.fatVar)} frente al período anterior equivalente.`),
    recomendacao: L(lang, 'Ver quais clientes ou produtos reduziram e se há sazonalidade.', 'See which clients or products decreased and whether there is seasonality.', 'Ver qué clientes o productos redujeron y si hay estacionalidad.') })
  if (n.despVar != null && n.despVar >= 15) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'media',
    titulo: L(lang, 'Despesas subiram', 'Expenses rose', 'Los gastos subieron'),
    evidencia: L(lang, `Variação de ${p(n.despVar)} contra o período anterior equivalente.`, `Change of ${p(n.despVar)} versus the equivalent previous period.`, `Variación de ${p(n.despVar)} frente al período anterior equivalente.`),
    recomendacao: L(lang, 'Conferir as categorias que mais cresceram (tabela de despesas).', 'Check the categories that grew the most (expenses table).', 'Verificar las categorías que más crecieron (tabla de gastos).') })
  if (n.dividaSaldo != null && n.dividaSaldo > 0 && n.fatMensal != null && n.fatMensal > 0 && n.dividaSaldo / n.fatMensal >= 6) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'media',
    titulo: L(lang, 'Endividamento alto em relação ao faturamento', 'High debt relative to revenue', 'Endeudamiento alto respecto a la facturación'),
    evidencia: L(lang, `Saldo devedor de ${m(n.dividaSaldo)} equivale a ${r2(n.dividaSaldo / n.fatMensal)} meses de faturamento médio (${m(n.fatMensal)}/mês).`, `Outstanding debt of ${m(n.dividaSaldo)} equals ${r2(n.dividaSaldo / n.fatMensal)} months of average revenue (${m(n.fatMensal)}/month).`, `Saldo de deuda de ${m(n.dividaSaldo)} equivale a ${r2(n.dividaSaldo / n.fatMensal)} meses de facturación media (${m(n.fatMensal)}/mes).`),
    recomendacao: L(lang, 'Priorizar a quitação das dívidas com juros mais altos e evitar novas sem plano de pagamento.', 'Prioritize paying off the highest-interest debts and avoid new ones without a payment plan.', 'Priorizar la cancelación de las deudas con intereses más altos y evitar nuevas sin plan de pago.') })
  if (n.obrigVencidas && n.obrigVencidas.qtd > 0) out.push({ tipo: 'fato', prioridade: 'alta', confianca: 'alta',
    titulo: L(lang, 'Obrigações fiscais vencidas sem pagamento registrado', 'Overdue tax obligations with no payment recorded', 'Obligaciones fiscales vencidas sin pago registrado'),
    evidencia: L(lang, `${n.obrigVencidas.qtd} obrigação(ões) vencida(s), estimativa de ${m(n.obrigVencidas.valor)}.`, `${n.obrigVencidas.qtd} overdue obligation(s), estimated at ${m(n.obrigVencidas.valor)}.`, `${n.obrigVencidas.qtd} obligación(es) vencida(s), estimación de ${m(n.obrigVencidas.valor)}.`),
    recomendacao: L(lang, 'Conferir se já foram pagas fora do Axioma; se não, emitir a guia atualizada com multa e juros.', 'Check whether they were paid outside Axioma; if not, issue the updated slip with fine and interest.', 'Verificar si ya fueron pagadas fuera de Axioma; si no, emitir la guía actualizada con multa e intereses.') })
  if (n.difCaixa && n.difCaixa.qtd > 0) out.push({ tipo: 'fato', prioridade: 'media', confianca: 'alta',
    titulo: L(lang, 'Diferença no fechamento de caixa', 'Difference at cash closing', 'Diferencia en el cierre de caja'),
    evidencia: L(lang, `${n.difCaixa.qtd} turno(s) fechado(s) com diferença; soma de ${m(n.difCaixa.valor)}.`, `${n.difCaixa.qtd} shift(s) closed with a difference; total ${m(n.difCaixa.valor)}.`, `${n.difCaixa.qtd} turno(s) cerrado(s) con diferencia; suma de ${m(n.difCaixa.valor)}.`),
    recomendacao: L(lang, 'Conferir sangrias, trocos e vendas canceladas desses turnos com o operador.', 'Check withdrawals, change and cancelled sales of those shifts with the operator.', 'Verificar retiros, cambio y ventas canceladas de esos turnos con el operador.') })
  if (n.canceladas && n.vendas && n.vendas.qtd > 0 && n.canceladas.qtd / (n.vendas.qtd + n.canceladas.qtd) >= 0.1) out.push({ tipo: 'calculo', prioridade: 'media', confianca: 'alta',
    titulo: L(lang, 'Muitas vendas canceladas', 'Many cancelled sales', 'Muchas ventas canceladas'),
    evidencia: L(lang, `${n.canceladas.qtd} cancelada(s) (${m(n.canceladas.valor)}) contra ${n.vendas.qtd} concluída(s).`, `${n.canceladas.qtd} cancelled (${m(n.canceladas.valor)}) versus ${n.vendas.qtd} completed.`, `${n.canceladas.qtd} cancelada(s) (${m(n.canceladas.valor)}) frente a ${n.vendas.qtd} concluida(s).`),
    recomendacao: L(lang, 'Ver quem cancelou e o motivo; cancelamento frequente pode ser erro de operação.', 'See who cancelled and why; frequent cancellation may be an operating error.', 'Ver quién canceló y el motivo; la cancelación frecuente puede ser error de operación.') })
  if (n.reconc && n.reconc.confirmadas > 0) out.push({ tipo: 'fato', prioridade: 'alta', confianca: 'alta',
    titulo: L(lang, 'Lançamentos duplicados confirmados', 'Confirmed duplicate entries', 'Registros duplicados confirmados'),
    evidencia: L(lang, `${n.reconc.confirmadas} caso(s) com o mesmo identificador (chave da nota ou número do documento).`, `${n.reconc.confirmadas} case(s) with the same identifier (invoice key or document number).`, `${n.reconc.confirmadas} caso(s) con el mismo identificador (clave de la factura o número de documento).`),
    recomendacao: L(lang, 'Revisar cada caso na tela de origem; a exclusão exige a aprovação de um supervisor.', 'Review each case on its source screen; deletion requires a supervisor approval.', 'Revisar cada caso en la pantalla de origen; la eliminación exige la aprobación de un supervisor.') })
  if (n.reconc && n.reconc.divergencias + n.reconc.possiveis > 0) out.push({ tipo: 'interpretacao', prioridade: 'media', confianca: 'media',
    titulo: L(lang, 'Dados com divergência ou possível duplicidade', 'Data with divergence or possible duplicate', 'Datos con divergencia o posible duplicidad'),
    evidencia: L(lang, `${n.reconc.divergencias} divergência(s) e ${n.reconc.possiveis} possível(is) duplicidade(s).`, `${n.reconc.divergencias} divergence(s) and ${n.reconc.possiveis} possible duplicate(s).`, `${n.reconc.divergencias} divergencia(s) y ${n.reconc.possiveis} posible(s) duplicidad(es).`),
    recomendacao: L(lang, 'Conferir antes de usar estes números em decisões: eles podem mudar o resultado.', 'Check before using these numbers for decisions: they may change the result.', 'Verificar antes de usar estos números en decisiones: pueden cambiar el resultado.') })
  const ordem = { alta: 0, media: 1, baixa: 2 }
  return out.sort((a, b) => ordem[a.prioridade] - ordem[b.prioridade])
}

function resumoDe(n: Numeros, lang: Lang): string[] {
  const m = (v: number) => fmtMoeda(v, lang), p = (v: number) => fmtPct(v, lang)
  const out: string[] = []
  if (n.faturamento != null) out.push(L(lang, `Faturamento de ${m(n.faturamento)} no período (competência)${n.fatVar != null ? `, ${p(n.fatVar)} contra o período anterior` : ''}.`, `Revenue of ${m(n.faturamento)} in the period (accrual)${n.fatVar != null ? `, ${p(n.fatVar)} versus the previous period` : ''}.`, `Facturación de ${m(n.faturamento)} en el período (devengo)${n.fatVar != null ? `, ${p(n.fatVar)} frente al período anterior` : ''}.`))
  if (n.lucro != null) out.push(L(lang, `Lucro líquido de ${m(n.lucro)}${n.margem != null ? ` (margem de ${p(n.margem)})` : ''} pela DRE, com impostos estimados pelo regime.`, `Net profit of ${m(n.lucro)}${n.margem != null ? ` (margin ${p(n.margem)})` : ''} per income statement, with taxes estimated by regime.`, `Utilidad neta de ${m(n.lucro)}${n.margem != null ? ` (margen de ${p(n.margem)})` : ''} según estado de resultados, con impuestos estimados por régimen.`))
  if (n.recebido != null && n.pago != null) out.push(L(lang, `No caixa entraram ${m(n.recebido)} e saíram ${m(n.pago)} no período.`, `Cash in was ${m(n.recebido)} and cash out ${m(n.pago)} in the period.`, `En caja entraron ${m(n.recebido)} y salieron ${m(n.pago)} en el período.`))
  if (n.receberAberto != null) out.push(L(lang, `Há ${m(n.receberAberto)} a receber em aberto, dos quais ${m(n.receberVencido ?? 0)} vencidos.`, `There are ${m(n.receberAberto)} in open receivables, of which ${m(n.receberVencido ?? 0)} overdue.`, `Hay ${m(n.receberAberto)} por cobrar abiertos, de los cuales ${m(n.receberVencido ?? 0)} vencidos.`))
  if (n.pagarAberto != null) out.push(L(lang, `Há ${m(n.pagarAberto)} a pagar em aberto, dos quais ${m(n.pagarVencido ?? 0)} vencidos.`, `There are ${m(n.pagarAberto)} in open payables, of which ${m(n.pagarVencido ?? 0)} overdue.`, `Hay ${m(n.pagarAberto)} por pagar abiertos, de los cuales ${m(n.pagarVencido ?? 0)} vencidos.`))
  if (n.despesas != null && n.faturamento == null) out.push(L(lang, `Despesas de ${m(n.despesas)} no período${n.despVar != null ? ` (${p(n.despVar)} contra o anterior)` : ''}.`, `Expenses of ${m(n.despesas)} in the period${n.despVar != null ? ` (${p(n.despVar)} versus previous)` : ''}.`, `Gastos de ${m(n.despesas)} en el período${n.despVar != null ? ` (${p(n.despVar)} frente al anterior)` : ''}.`))
  if (n.dividaSaldo != null) out.push(L(lang, `Saldo devedor de dívidas de ${m(n.dividaSaldo)}${n.jurosMes ? `, com juros estimados de ${m(n.jurosMes)} por mês` : ''}.`, `Outstanding debt balance of ${m(n.dividaSaldo)}${n.jurosMes ? `, with estimated interest of ${m(n.jurosMes)} per month` : ''}.`, `Saldo de deudas de ${m(n.dividaSaldo)}${n.jurosMes ? `, con intereses estimados de ${m(n.jurosMes)} por mes` : ''}.`))
  if (n.vendas) out.push(L(lang, `${n.vendas.qtd} venda(s) no PDV somando ${m(n.vendas.valor)}.`, `${n.vendas.qtd} POS sale(s) totaling ${m(n.vendas.valor)}.`, `${n.vendas.qtd} venta(s) en el PDV sumando ${m(n.vendas.valor)}.`))
  if (n.reconc) out.push(L(lang, `${n.reconc.total} ponto(s) de atenção nos dados (só apontados, nada foi alterado).`, `${n.reconc.total} data attention point(s) (only flagged, nothing was changed).`, `${n.reconc.total} punto(s) de atención en los datos (solo señalados, nada fue alterado).`))
  return out
}

const metodologiaBase = (lang: Lang) => [
  L(lang, 'Competência = mês em que o fato aconteceu (venda, serviço, despesa). Caixa = data em que o dinheiro entrou ou saiu.', 'Accrual = month the event happened (sale, service, expense). Cash = date the money came in or went out.', 'Devengo = mes en que ocurrió el hecho (venta, servicio, gasto). Caja = fecha en que el dinero entró o salió.'),
  L(lang, 'Períodos com início e fim incluídos, no fuso horário da Empresa. Somas feitas em centavos. Registros cancelados ficam de fora.', 'Periods include start and end dates, in the Company time zone. Sums done in cents. Cancelled records are excluded.', 'Períodos con inicio y fin incluidos, en la zona horaria de la Empresa. Sumas en centavos. Registros cancelados quedan fuera.'),
  L(lang, 'Saldo a receber = valor − desconto − já recebido. Saldo a pagar = total − já pago. Vencido = vencimento antes de hoje.', 'Receivable balance = amount − discount − already received. Payable balance = total − already paid. Overdue = due date before today.', 'Saldo por cobrar = valor − descuento − ya cobrado. Saldo por pagar = total − ya pagado. Vencido = vencimiento antes de hoy.'),
  L(lang, 'Lucro e margem pela DRE do Axioma (mesmo cálculo da tela DRE). Impostos são estimativa pelo regime tributário; a guia real pode diferir.', 'Profit and margin per the Axioma income statement (same calculation as the DRE screen). Taxes are an estimate by tax regime; the actual slip may differ.', 'Utilidad y margen según el estado de resultados de Axioma (mismo cálculo de la pantalla DRE). Los impuestos son estimación por régimen; la guía real puede diferir.'),
  L(lang, 'Riscos e recomendações saem de regras fixas sobre os números deste relatório, com a evidência ao lado.', 'Risks and recommendations come from fixed rules over the numbers in this report, with the evidence alongside.', 'Riesgos y recomendaciones salen de reglas fijas sobre los números de este informe, con la evidencia al lado.'),
]

// ─── Montagem ───
export async function gerarRelatorio(ctx: CtxRelatorio, pedido: PedidoRelatorio): Promise<Relatorio | { erro: string }> {
  const lang: Lang = pedido.lang === 'en' || pedido.lang === 'es' ? pedido.lang : 'pt'
  if (!(TIPOS_RELATORIO as readonly string[]).includes(pedido.tipo)) return { erro: L(lang, 'Tipo de relatório desconhecido.', 'Unknown report type.', 'Tipo de informe desconocido.') }
  const hoje = hojeISO(new Date(), ctx.fuso)
  const per = resolverPeriodo(pedido.periodo === 'tudo' ? 'este_mes' : pedido.periodo, hoje, { inicio: pedido.inicio ?? undefined, fim: pedido.fim ?? undefined })
  if ('erro' in per) return { erro: L(lang, 'Período inválido: confira as datas de início e fim.', 'Invalid period: check the start and end dates.', 'Período inválido: verifique las fechas de inicio y fin.') }
  if (diasEntre(per.inicio, per.fim) > MAX_DIAS) return { erro: L(lang, 'Escolha um período de até 24 meses.', 'Choose a period of up to 24 months.', 'Elija un período de hasta 24 meses.') }
  const p: Periodo = per
  const ant = pedido.comparar ? periodoAnterior(p, hoje) : null
  const C = coletor(lang)
  const args = { periodo: p.nome, inicio: p.nome === 'personalizado' ? p.inicio : null, fim: p.nome === 'personalizado' ? p.fim : null }
  const F = async (nome: string, input: Record<string, unknown>) => C.usar(nome, await executarFerramentaFinanceira(ctx, nome, input))
  const n: Numeros = {}
  const secoes: Secao[] = []
  const tipo = pedido.tipo as TipoRelatorio
  const mesInteiro = p.inicio.slice(8) === '01' && somarDiasISO(p.fim, 1).slice(8) === '01'
  const avisoDreMensal = () => { if (!mesInteiro) C.limitar(L(lang, `A DRE é mensal: lucro e margem usam os meses inteiros de ${p.inicio.slice(0, 7)} a ${p.fim.slice(0, 7)}.`, `The income statement is monthly: profit and margin use the full months from ${p.inicio.slice(0, 7)} to ${p.fim.slice(0, 7)}.`, `El estado de resultados es mensual: utilidad y margen usan los meses completos de ${p.inicio.slice(0, 7)} a ${p.fim.slice(0, 7)}.`)) }

  if (tipo === 'executivo') {
    const [fat, mov, desp, res, cli, d] = await Promise.all([
      F('faturamento', { ...args, granularidade: 'mes', comparar: !!ant }), F('movimentos_realizados', { ...args, comparar: false }),
      F('despesas', { ...args, agrupar_por: 'categoria', comparar: !!ant }), F('resumo_financeiro', {}), F('receitas_por_cliente', args), dreDe(ctx, p),
    ])
    const dre = C.dre(d, `${p.inicio}..${p.fim}`); avisoDreMensal()
    const fc = (fat?.detalhes as { comparacao?: { anterior: number; diferenca: number; variacao_pct: number | null } } | undefined)?.comparacao
    const dc = (desp?.detalhes as { comparacao?: { anterior: number; diferenca: number; variacao_pct: number | null } } | undefined)?.comparacao
    const md = mov?.detalhes as { recebido_total: number; pago_fornecedores: number } | undefined
    const rd = res?.detalhes as { caixa_realizado: number | null; a_receber: { aberto: number; vencido: number }; a_pagar: { aberto: number; vencido: number }; dividas_saldo: number } | undefined
    if (fat) { n.faturamento = fat.valor as number; n.fatVar = fc?.variacao_pct ?? null }
    if (desp) { n.despesas = desp.valor as number; n.despVar = dc?.variacao_pct ?? null }
    if (dre && !dre.sem_movimento) { n.lucro = dre.lucro_liquido; n.margem = dre.lucro_liquido_pct }
    if (md) { n.recebido = md.recebido_total; n.pago = md.pago_fornecedores }
    if (rd) { n.caixa = rd.caixa_realizado; n.receberAberto = rd.a_receber.aberto; n.receberVencido = rd.a_receber.vencido; n.pagarAberto = rd.a_pagar.aberto; n.pagarVencido = rd.a_pagar.vencido; n.dividaSaldo = rd.dividas_saldo }
    const g = (cli?.detalhes as { grupos?: { nome: string; valor: number; pct: number; registros: number }[] } | undefined)?.grupos ?? []
    const comCliente = g.filter((x) => x.nome !== 'Sem cliente informado')
    if (comCliente.length) { const tot = comCliente.reduce((s, x) => s + x.valor, 0); n.topCliente = { nome: comCliente[0].nome, pct: pctDe(comCliente[0].valor, tot) ?? 0 } }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(tx(lang, 'faturamento'), fat?.valor, 'BRL', 'calculo', fc ? { anterior: fc.anterior, diferenca: fc.diferenca, variacao_pct: fc.variacao_pct } : undefined),
      ind(tx(lang, 'despesas'), desp?.valor, 'BRL', 'calculo', dc ? { anterior: dc.anterior, diferenca: dc.diferenca, variacao_pct: dc.variacao_pct } : undefined),
      ind(tx(lang, 'lucro'), dre?.lucro_liquido, 'BRL', 'estimativa', undefined, L(lang, 'impostos estimados pelo regime', 'taxes estimated by regime', 'impuestos estimados por régimen')),
      ind(tx(lang, 'margem'), dre?.lucro_liquido_pct, 'PCT', 'estimativa'),
      ind(tx(lang, 'recebido'), md?.recebido_total, 'BRL', 'calculo'), ind(tx(lang, 'pago'), md?.pago_fornecedores, 'BRL', 'calculo'),
      ind(tx(lang, 'caixa'), rd?.caixa_realizado, 'BRL', 'calculo'),
      ind(tx(lang, 'a_receber'), rd?.a_receber.aberto, 'BRL', 'calculo'), ind(tx(lang, 'a_receber_vencido'), rd?.a_receber.vencido, 'BRL', 'calculo'),
      ind(tx(lang, 'a_pagar'), rd?.a_pagar.aberto, 'BRL', 'calculo'), ind(tx(lang, 'a_pagar_vencido'), rd?.a_pagar.vencido, 'BRL', 'calculo'),
      ind(tx(lang, 'dividas'), rd?.dividas_saldo, 'BRL', 'calculo'),
    ] })
    secoes.push(tabela('clientes', L(lang, 'Maiores clientes do período', 'Largest clients of the period', 'Mayores clientes del período'), [[tx(lang, 'cliente'), 'texto'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']], g.slice(0, 5).map((x) => [x.nome, x.valor, x.pct]), lang))
    const gd = (desp?.detalhes as { grupos?: { nome: string; valor: number; pct: number }[] } | undefined)?.grupos ?? []
    secoes.push(tabela('despesas', L(lang, 'Maiores despesas por categoria', 'Largest expenses by category', 'Mayores gastos por categoría'), [[tx(lang, 'categoria'), 'texto'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']], gd.slice(0, 5).map((x) => [x.nome, x.valor, x.pct]), lang))
    C.limitar(L(lang, 'Caixa realizado não desconta contas a pagar nem reservas: não é dinheiro livre. Lançamentos "confirmado" do Fluxo de Caixa ficam fora (decisão pendente).', 'Realized cash does not deduct payables or reserves: it is not free cash. "Confirmed" Cash Flow entries are left out (pending decision).', 'La caja realizada no descuenta cuentas por pagar ni reservas: no es dinero libre. Los registros "confirmado" del Flujo de Caja quedan fuera (decisión pendiente).'))
  }

  if (tipo === 'dre') {
    const [d, da] = await Promise.all([dreDe(ctx, p), ant ? dreDe(ctx, ant) : Promise.resolve(null)])
    const dre = C.dre(d, `${p.inicio}..${p.fim}`)
    const dra = ant ? C.dre(da, `${ant.inicio}..${ant.fim}`, tx(lang, 'anterior')) : null
    avisoDreMensal()
    if (dre) {
      if (!dre.sem_movimento) { n.faturamento = dre.receita_bruta; n.lucro = dre.lucro_liquido; n.margem = dre.lucro_liquido_pct }
      if (dra) n.fatVar = comparar({ valor: dre.receita_bruta, registros: 1 }, { valor: dra.receita_bruta, registros: dra.registros }).variacao_pct
      const linhas: [string, keyof Dre][] = [['receita_bruta', 'receita_bruta'], ['devolucoes', 'devolucoes'], ['impostos', 'impostos_deducoes'], ['receita_liquida', 'receita_liquida'], ['custos_variaveis', 'custos_variaveis'], ['margem_contribuicao', 'margem_contribuicao'], ['custos_fixos', 'custos_fixos'], ['resultado_operacional', 'resultado_operacional'], ['juros_pagos', 'juros_pagos'], ['juros_estimados', 'juros_estimados_dividas'], ['lucro_liquido', 'lucro_liquido']]
      const cols: [string, TipoColuna][] = [[tx(lang, 'linha'), 'texto'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'pct_receita'), 'pct'], ...(dra ? [[tx(lang, 'anterior'), 'moeda'], [tx(lang, 'variacao'), 'pct']] as [string, TipoColuna][] : [])]
      secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
        ind(tx(lang, 'receita_bruta'), dre.receita_bruta, 'BRL', 'calculo', dra ? comp(dre.receita_bruta, dra.receita_bruta, dra.registros) : undefined),
        ind(tx(lang, 'lucro'), dre.lucro_liquido, 'BRL', 'estimativa', dra ? comp(dre.lucro_liquido, dra.lucro_liquido, dra.registros) : undefined),
        ind(tx(lang, 'margem'), dre.lucro_liquido_pct, 'PCT', 'estimativa'),
        ind(tx(lang, 'margem_contribuicao').replace(/^= /, ''), dre.margem_contribuicao_pct, 'PCT', 'calculo'),
      ] })
      secoes.push(tabela('dre', tituloRelatorio('dre', lang), cols, linhas.map(([k, c]) => {
        const v = dre[c] as number
        const base = [tx(lang, k as never), v, pctDe(v, dre.receita_bruta)]
        if (!dra) return base
        return [...base, dra[c] as number, comparar({ valor: v, registros: 1 }, { valor: dra[c] as number, registros: dra.registros }).variacao_pct]
      }), lang))
      secoes.push(tabela('rec_cat', L(lang, 'Receitas por categoria', 'Revenue by category', 'Ingresos por categoría'), [[tx(lang, 'categoria'), 'texto'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'pct_receita'), 'pct']], dre.receitas_por_categoria.map((x) => [x.categoria, x.valor, pctDe(x.valor, dre.receita_bruta)]), lang))
      secoes.push(tabela('cus_cat', L(lang, 'Custos variáveis por categoria', 'Variable costs by category', 'Costos variables por categoría'), [[tx(lang, 'categoria'), 'texto'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'pct_receita'), 'pct']], dre.custos_variaveis_por_categoria.map((x) => [x.categoria, x.valor, pctDe(x.valor, dre.receita_bruta)]), lang))
      C.limitar(L(lang, 'Estrutura disponível: o Axioma separa custos variáveis e custos fixos, não "custo dos produtos vendidos" × "despesas operacionais"; por isso lucro bruto e despesas operacionais não aparecem separados. Resultado financeiro = juros pagos + juros estimados das dívidas. Tributos sobre o lucro (IRPJ/CSLL do Lucro Presumido/Real) não são apurados à parte.', 'Available structure: Axioma separates variable and fixed costs, not "cost of goods sold" × "operating expenses"; so gross profit and operating expenses are not shown separately. Financial result = interest paid + estimated debt interest. Income taxes (IRPJ/CSLL) are not computed separately.', 'Estructura disponible: Axioma separa costos variables y fijos, no "costo de lo vendido" × "gastos operativos"; por eso la utilidad bruta y los gastos operativos no aparecen separados. Resultado financiero = intereses pagados + intereses estimados de deudas. Los impuestos sobre la utilidad (IRPJ/CSLL) no se calculan aparte.'))
      C.limitar(L(lang, `Regime tributário considerado: ${dre.regime_tributario}. Impostos são estimativa; a guia real pode diferir.`, `Tax regime considered: ${dre.regime_tributario}. Taxes are an estimate; the actual slip may differ.`, `Régimen tributario considerado: ${dre.regime_tributario}. Los impuestos son estimación; la guía real puede diferir.`))
    }
  }

  if (tipo === 'fluxo_caixa') {
    const fimSaldo = p.fim > hoje ? hoje : p.fim
    const saldoEm = (dia: string) => saldoCaixaRealizado(ctx.supabase, ctx.empresaId, dia).catch(() => ({ saldo: 0, erro: 'falha' }))
    const [mov, res, r30, p30, sIni, sFim] = await Promise.all([
      F('movimentos_realizados', { ...args, comparar: !!ant }), F('resumo_financeiro', {}),
      F('titulos', { tipo: 'receber', periodo: 'proximos_30_dias', inicio: null, fim: null }), F('titulos', { tipo: 'pagar', periodo: 'proximos_30_dias', inicio: null, fim: null }),
      saldoEm(somarDiasISO(p.inicio, -1)), p.inicio <= hoje ? saldoEm(fimSaldo) : Promise.resolve(null),
    ])
    C.leitura(['fluxo_caixa', 'venda'], !sIni.erro && !sFim?.erro, `caixa_realizado|${somarDiasISO(p.inicio, -1)}..${fimSaldo}`)
    const saldoIni = sIni.erro ? null : sIni.saldo, saldoFim = !sFim || sFim.erro ? null : sFim.saldo
    const md = mov?.detalhes as { recebido_clientes: number; recebido_pdv: number; recebido_total: number; pago_fornecedores: number; saldo_do_periodo: number; recebimentos_sem_data: number; pagamentos_sem_data: number; comparacao: { recebido_total: Comp & { cobertura_anterior?: boolean }; pago: Comp } | null } | undefined
    const rd = res?.detalhes as { caixa_realizado: number | null; a_receber: { vencido: number; aberto: number }; a_pagar: { vencido: number; aberto: number } } | undefined
    const rec30 = (r30?.detalhes as { a_vencer?: number } | undefined)?.a_vencer ?? null, pag30 = (p30?.detalhes as { a_vencer?: number } | undefined)?.a_vencer ?? null
    if (md) { n.recebido = md.recebido_total; n.pago = md.pago_fornecedores
      if (md.recebimentos_sem_data || md.pagamentos_sem_data) C.limitar(L(lang, `${md.recebimentos_sem_data} recebimento(s) e ${md.pagamentos_sem_data} pagamento(s) sem data ficaram fora do período.`, `${md.recebimentos_sem_data} receipt(s) and ${md.pagamentos_sem_data} payment(s) without a date were left out of the period.`, `${md.recebimentos_sem_data} cobro(s) y ${md.pagamentos_sem_data} pago(s) sin fecha quedaron fuera del período.`)) }
    if (rd) { n.caixa = rd.caixa_realizado; n.receberVencido = rd.a_receber.vencido; n.receberAberto = rd.a_receber.aberto; n.pagarVencido = rd.a_pagar.vencido; n.pagarAberto = rd.a_pagar.aberto }
    if (rec30 != null && pag30 != null) { n.receber30 = rec30; n.pagar30 = pag30 }
    const cr = md?.comparacao?.recebido_total, cp = md?.comparacao?.pago
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(L(lang, 'Recebido de clientes', 'Received from clients', 'Cobrado a clientes'), md?.recebido_clientes, 'BRL', 'calculo'),
      ind(L(lang, 'Recebido no PDV (pago na hora)', 'Received at POS (paid on the spot)', 'Cobrado en el PDV (pagado al momento)'), md?.recebido_pdv, 'BRL', 'calculo'),
      ind(tx(lang, 'recebido'), md?.recebido_total, 'BRL', 'calculo', cr ? { anterior: md!.recebido_total - (cr.diferenca ?? 0), diferenca: cr.diferenca, variacao_pct: cr.variacao_pct } : undefined),
      ind(tx(lang, 'pago'), md?.pago_fornecedores, 'BRL', 'calculo', cp ? { anterior: md!.pago_fornecedores - (cp.diferenca ?? 0), diferenca: cp.diferenca, variacao_pct: cp.variacao_pct } : undefined),
      ind(L(lang, 'Saldo do período (entradas − saídas)', 'Period balance (in − out)', 'Saldo del período (entradas − salidas)'), md?.saldo_do_periodo, 'BRL', 'calculo'),
      ind(L(lang, 'Saldo de caixa no início do período', 'Cash balance at period start', 'Saldo de caja al inicio del período'), saldoIni, 'BRL', 'calculo', undefined, L(lang, `fim do dia ${fmtData(somarDiasISO(p.inicio, -1), lang)}`, `end of ${fmtData(somarDiasISO(p.inicio, -1), lang)}`, `fin del día ${fmtData(somarDiasISO(p.inicio, -1), lang)}`)),
      ind(L(lang, 'Saldo de caixa no fim do período', 'Cash balance at period end', 'Saldo de caja al final del período'), saldoFim, 'BRL', 'calculo', undefined, L(lang, `fim do dia ${fmtData(fimSaldo, lang)}`, `end of ${fmtData(fimSaldo, lang)}`, `fin del día ${fmtData(fimSaldo, lang)}`)),
      ind(L(lang, 'Variação do saldo de caixa', 'Change in cash balance', 'Variación del saldo de caja'), saldoIni != null && saldoFim != null ? reais(centavos(saldoFim) - centavos(saldoIni)) : null, 'BRL', 'calculo'),
      ind(tx(lang, 'caixa'), rd?.caixa_realizado, 'BRL', 'calculo'),
    ] })
    C.limitar(L(lang, 'Saldos de caixa vêm do Fluxo de Caixa (lançamentos realizados) + PDV pago na hora; entradas e saídas acima vêm das baixas de contas a receber/pagar + PDV. Lançamentos digitados direto no Fluxo de Caixa explicam a diferença entre os dois.', 'Cash balances come from Cash Flow (realized entries) + POS paid on the spot; inflows and outflows above come from receivable/payable settlements + POS. Entries typed directly in Cash Flow explain the difference between the two.', 'Los saldos de caja vienen del Flujo de Caja (registros realizados) + PDV pagado al momento; entradas y salidas arriba vienen de las bajas de cuentas por cobrar/pagar + PDV. Los registros digitados directo en el Flujo de Caja explican la diferencia entre ambos.'))
    const proj = rd?.caixa_realizado != null && rec30 != null && pag30 != null ? reais(centavos(rd.caixa_realizado) + centavos(rec30) - centavos(pag30)) : null
    secoes.push(tabela('proximos', L(lang, 'Próximos 30 dias (pelo vencimento)', 'Next 30 days (by due date)', 'Próximos 30 días (por vencimiento)'), [[tx(lang, 'descricao'), 'texto'], [tx(lang, 'valor'), 'moeda']], [
      [tx(lang, 'caixa'), rd?.caixa_realizado ?? null],
      [L(lang, '(+) A receber nos próximos 30 dias', '(+) Receivable in the next 30 days', '(+) Por cobrar en los próximos 30 días'), rec30],
      [L(lang, '(−) A pagar nos próximos 30 dias', '(−) Payable in the next 30 days', '(−) Por pagar en los próximos 30 días'), pag30],
      [L(lang, '= Projeção simples em 30 dias (estimativa)', '= Simple 30-day projection (estimate)', '= Proyección simple a 30 días (estimación)'), proj],
      [tx(lang, 'a_receber_vencido'), rd?.a_receber.vencido ?? null], [tx(lang, 'a_pagar_vencido'), rd?.a_pagar.vencido ?? null],
    ], lang))
    C.limitar(L(lang, 'A projeção não inclui vencidos, vendas futuras do PDV, custos fixos sem conta a pagar nem impostos sem guia.', 'The projection excludes overdue items, future POS sales, fixed costs without a payable and taxes without a slip.', 'La proyección no incluye vencidos, ventas futuras del PDV, costos fijos sin cuenta por pagar ni impuestos sin guía.'))
    C.limitar(L(lang, 'Lançamentos "confirmado" do Fluxo de Caixa ficam fora do caixa realizado (decisão pendente).', '"Confirmed" Cash Flow entries are left out of realized cash (pending decision).', 'Los registros "confirmado" del Flujo de Caja quedan fuera de la caja realizada (decisión pendiente).'))
  }

  if (tipo === 'contas_receber' || tipo === 'contas_pagar') {
    const receber = tipo === 'contas_receber'
    const [pos, noPer, mov, linhas] = await Promise.all([
      F('titulos', { tipo: receber ? 'receber' : 'pagar', periodo: 'tudo', inicio: null, fim: null }),
      F('titulos', { tipo: receber ? 'receber' : 'pagar', ...args }),
      F('movimentos_realizados', { ...args, comparar: false }),
      receber
        ? ler(lerTodas(() => ctx.supabase.from('contas_receber').select('id, valor, valor_recebido, valor_desconto, taxa_multa, taxa_juros, data_vencimento, status').eq('empresa_id', ctx.empresaId).order('id')))
        : ler(lerTodas(() => ctx.supabase.from('contas_pagar').select('id, valor_total, valor_pago, data_vencimento, status').eq('empresa_id', ctx.empresaId).order('id'))),
    ])
    C.leitura([receber ? 'contas_receber' : 'contas_pagar'], linhas != null, `aging|${receber ? 'receber' : 'pagar'}|${hoje}`)
    const d = pos?.detalhes as { aberto: number; aberto_atualizado?: number; vencido: number; a_vencer: number; titulos_abertos: number; titulos_vencidos: number; maiores: { cliente?: string | null; fornecedor?: string | null; descricao: string | null; saldo: number; vencimento: string | null; dias_atraso?: number; vencida?: boolean }[] } | undefined
    const md = mov?.detalhes as { recebido_clientes: number; pago_fornecedores: number } | undefined
    if (d) { if (receber) { n.receberAberto = d.aberto; n.receberVencido = d.vencido } else { n.pagarAberto = d.aberto; n.pagarVencido = d.vencido } }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(tx(lang, receber ? 'a_receber' : 'a_pagar'), d?.aberto, 'BRL', 'calculo'),
      ...(receber ? [ind(L(lang, 'Em aberto com multa e juros', 'Open with fine and interest', 'Abierto con multa e intereses'), d?.aberto_atualizado, 'BRL', 'calculo')] : []),
      ind(tx(lang, receber ? 'a_receber_vencido' : 'a_pagar_vencido'), d?.vencido, 'BRL', 'calculo'),
      ind(L(lang, '% vencido', '% overdue', '% vencido'), d ? pctDe(d.vencido, d.aberto) : null, 'PCT', 'calculo'),
      ind(L(lang, 'Títulos vencidos', 'Overdue items', 'Títulos vencidos'), d?.titulos_vencidos, 'QTD', 'fato'),
      ind(L(lang, 'Vencendo no período', 'Due in the period', 'Venciendo en el período'), noPer?.valor, 'BRL', 'calculo'),
      ind(receber ? tx(lang, 'recebido') : tx(lang, 'pago'), receber ? md?.recebido_clientes : md?.pago_fornecedores, 'BRL', 'calculo'),
    ] })
    if (linhas) {
      const itens = receber
        ? (linhas as TituloReceber[]).filter((c) => !/cancel/i.test(String(c.status))).map((c) => { const s = saldoReceber(c, hoje); return { dias: s.dias, saldo: s.principal } }).filter((i) => i.saldo > 0)
        : (linhas as TituloPagar[]).filter((c) => !/cancel/i.test(String(c.status))).map((c) => ({ dias: c.data_vencimento && c.data_vencimento < hoje ? diasEntre(c.data_vencimento, hoje) - 1 : 0, saldo: saldoPagar(c) })).filter((i) => i.saldo > 0)
      const a = aging(itens, lang)
      secoes.push(tabela('aging', L(lang, 'Posição por atraso (hoje)', 'Position by delay (today)', 'Posición por atraso (hoy)'), [[tx(lang, 'faixa'), 'texto'], [tx(lang, 'quantidade'), 'numero'], [tx(lang, 'saldo'), 'moeda'], [tx(lang, 'participacao'), 'pct']], a.linhas, lang, ['Total', a.qtd, a.total, a.qtd ? 100 : 0]))
    }
    secoes.push(tabela('maiores', L(lang, 'Maiores saldos em aberto', 'Largest open balances', 'Mayores saldos abiertos'),
      [[tx(lang, receber ? 'cliente' : 'fornecedor'), 'texto'], [tx(lang, 'descricao'), 'texto'], [tx(lang, 'vencimento'), 'data'], ...(receber ? [[tx(lang, 'dias_atraso'), 'numero']] as [string, TipoColuna][] : []), [tx(lang, 'saldo'), 'moeda']],
      (d?.maiores ?? []).map((x) => [(receber ? x.cliente : x.fornecedor) ?? L(lang, 'Não informado', 'Not informed', 'No informado'), x.descricao ?? '—', x.vencimento, ...(receber ? [x.dias_atraso ?? 0] : []), x.saldo]), lang))
    if (receber) C.limitar(L(lang, 'Multa e juros de atraso seguem as taxas cadastradas em cada conta (mesma conta da tela Contas a Receber).', 'Late fees and interest follow the rates registered on each item (same calculation as the Accounts Receivable screen).', 'Multa e intereses siguen las tasas registradas en cada cuenta (mismo cálculo de la pantalla Cuentas por Cobrar).'))
  }

  if (tipo === 'receitas') {
    const dias = diasEntre(p.inicio, p.fim)
    const gran = dias <= 31 ? 'dia' : dias <= 92 ? 'semana' : 'mes'
    const [fat, cli, d] = await Promise.all([F('faturamento', { ...args, granularidade: gran, comparar: !!ant }), F('receitas_por_cliente', args), dreDe(ctx, p)])
    const dre = C.dre(d, `${p.inicio}..${p.fim}`); avisoDreMensal()
    const fd = fat?.detalhes as { serie: { chave: string; valor: number }[]; devolucoes_pdv: number; receitas_lancadas_tela_receitas: number; comparacao: { anterior: number; diferenca: number; variacao_pct: number | null } | null } | undefined
    if (fat) { n.faturamento = fat.valor as number; n.fatVar = fd?.comparacao?.variacao_pct ?? null }
    const g = (cli?.detalhes as { grupos?: { nome: string; valor: number; pct: number; registros: number }[] } | undefined)?.grupos ?? []
    const comCliente = g.filter((x) => x.nome !== 'Sem cliente informado')
    if (comCliente.length) { const tot = comCliente.reduce((s, x) => s + x.valor, 0); n.topCliente = { nome: comCliente[0].nome, pct: pctDe(comCliente[0].valor, tot) ?? 0 } }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(tx(lang, 'faturamento'), fat?.valor, 'BRL', 'calculo', fd?.comparacao ? { anterior: fd.comparacao.anterior, diferenca: fd.comparacao.diferenca, variacao_pct: fd.comparacao.variacao_pct } : undefined),
      ind(L(lang, 'Devoluções e cancelamentos do PDV', 'POS returns and cancellations', 'Devoluciones y cancelaciones del PDV'), fd?.devolucoes_pdv, 'BRL', 'calculo'),
      ind(L(lang, 'Soma da tela Receitas (só lançamentos digitados)', 'Revenue screen total (typed entries only)', 'Suma de la pantalla Ingresos (solo registros digitados)'), fd?.receitas_lancadas_tela_receitas, 'BRL', 'fato', undefined, L(lang, 'não é o faturamento: não inclui contas a receber nem PDV', 'not the revenue: excludes receivables and POS', 'no es la facturación: no incluye cuentas por cobrar ni PDV')),
      ind(L(lang, 'Receita bruta pela DRE (meses inteiros)', 'Gross revenue per income statement (full months)', 'Ingreso bruto según estado de resultados (meses completos)'), dre?.receita_bruta, 'BRL', 'calculo'),
    ] })
    secoes.push(tabela('serie', L(lang, gran === 'dia' ? 'Faturamento por dia' : gran === 'semana' ? 'Faturamento por semana (início na segunda)' : 'Faturamento por mês', gran === 'dia' ? 'Revenue by day' : gran === 'semana' ? 'Revenue by week (starting Monday)' : 'Revenue by month', gran === 'dia' ? 'Facturación por día' : gran === 'semana' ? 'Facturación por semana (inicia el lunes)' : 'Facturación por mes'),
      [[tx(lang, 'periodo_col'), gran === 'mes' ? 'texto' : 'data'], [tx(lang, 'valor'), 'moeda']], (fd?.serie ?? []).map((s) => [s.chave, s.valor]), lang, fd ? ['Total', fat!.valor as number] : undefined))
    secoes.push(tabela('clientes', L(lang, 'Receita por cliente', 'Revenue by client', 'Ingreso por cliente'), [[tx(lang, 'cliente'), 'texto'], [tx(lang, 'registros'), 'numero'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']], g.map((x) => [x.nome, x.registros, x.valor, x.pct]), lang))
    if (dre) secoes.push(tabela('rec_cat', L(lang, 'Receitas por categoria (DRE)', 'Revenue by category (income statement)', 'Ingresos por categoría (estado de resultados)'), [[tx(lang, 'categoria'), 'texto'], [tx(lang, 'valor'), 'moeda']], dre.receitas_por_categoria.map((x) => [x.categoria, x.valor]), lang))
    C.limitar(L(lang, 'Vendas do PDV sem cliente não entram na divisão por cliente.', 'POS sales without a client are not in the split by client.', 'Las ventas del PDV sin cliente no entran en la división por cliente.'))
  }

  if (tipo === 'despesas') {
    const mesCf = (p.fim > hoje ? hoje : p.fim).slice(0, 7)
    const [cat, forn, cf, d] = await Promise.all([F('despesas', { ...args, agrupar_por: 'categoria', comparar: !!ant }), F('despesas', { ...args, agrupar_por: 'fornecedor', comparar: false }), F('custos_fixos_mes', { mes: mesCf }), dreDe(ctx, p)])
    const dre = C.dre(d, `${p.inicio}..${p.fim}`); avisoDreMensal()
    const cd = cat?.detalhes as { grupos: { nome: string; valor: number; pct: number; registros: number }[]; comparacao: { anterior: number; diferenca: number; variacao_pct: number | null } | null } | undefined
    const fdd = forn?.detalhes as { grupos: { nome: string; valor: number; pct: number; registros: number }[] } | undefined
    const cfd = cf?.detalhes as { total_ativo: number; ativos: number; encerrados: number } | undefined
    if (cat) { n.despesas = cat.valor as number; n.despVar = cd?.comparacao?.variacao_pct ?? null }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(tx(lang, 'despesas'), cat?.valor, 'BRL', 'calculo', cd?.comparacao ? { anterior: cd.comparacao.anterior, diferenca: cd.comparacao.diferenca, variacao_pct: cd.comparacao.variacao_pct } : undefined, L(lang, 'custos variáveis + contas a pagar', 'variable costs + payables', 'costos variables + cuentas por pagar')),
      ind(L(lang, 'Custos fixos do período (DRE)', 'Fixed costs of the period (income statement)', 'Costos fijos del período (estado de resultados)'), dre?.custos_fixos, 'BRL', 'calculo'),
      ind(L(lang, `Custos fixos ativos em ${mesCf}`, `Active fixed costs in ${mesCf}`, `Costos fijos activos en ${mesCf}`), cfd?.total_ativo, 'BRL', 'calculo', undefined, cfd ? L(lang, `${cfd.ativos} ativo(s); ${cfd.encerrados} encerrado(s) não contam`, `${cfd.ativos} active; ${cfd.encerrados} ended not counted`, `${cfd.ativos} activo(s); ${cfd.encerrados} cerrado(s) no cuentan`) : undefined),
      ind(L(lang, 'Despesas sobre a receita', 'Expenses over revenue', 'Gastos sobre el ingreso'), dre && cat ? pctDe((cat.valor as number) + dre.custos_fixos, dre.receita_bruta) : null, 'PCT', 'calculo'),
    ] })
    secoes.push(tabela('categorias', L(lang, 'Despesas por categoria', 'Expenses by category', 'Gastos por categoría'), [[tx(lang, 'categoria'), 'texto'], [tx(lang, 'registros'), 'numero'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']], (cd?.grupos ?? []).map((x) => [x.nome, x.registros, x.valor, x.pct]), lang, cat ? ['Total', null, cat.valor as number, 100] : undefined))
    secoes.push(tabela('fornecedores', L(lang, 'Despesas por fornecedor', 'Expenses by supplier', 'Gastos por proveedor'), [[tx(lang, 'fornecedor'), 'texto'], [tx(lang, 'registros'), 'numero'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']], (fdd?.grupos ?? []).map((x) => [x.nome, x.registros, x.valor, x.pct]), lang))
    C.limitar(L(lang, 'Folha de pagamento não tem cadastro no Axioma: só entra se foi lançada como conta a pagar ou custo.', 'Payroll has no record in Axioma: it is only included if entered as a payable or cost.', 'La nómina no tiene registro en Axioma: solo entra si fue registrada como cuenta por pagar o costo.'))
  }

  if (tipo === 'endividamento') {
    const [dv, res, f12] = await Promise.all([
      ler(ctx.supabase.from('dividas').select('id, descricao, tipo, valor_total, valor_pago, parcelas, vencimento, taxa_juros, status').eq('empresa_id', ctx.empresaId) as never) as Promise<{ descricao: string | null; tipo: string | null; valor_total: number; valor_pago: number; parcelas: number | null; vencimento: string | null; taxa_juros: number | null; status: string | null }[] | null>,
      F('resumo_financeiro', {}), F('faturamento', { periodo: 'ultimos_12_meses', inicio: null, fim: null, granularidade: 'mes', comparar: false }),
    ])
    C.leitura(['dividas'], dv != null, `dividas|${hoje}`)
    const rd = res?.detalhes as { a_pagar: { aberto: number; vencido: number } } | undefined
    const lista = (dv ?? []).map((x) => { const saldo = reais(Math.max(0, centavos(x.valor_total) - centavos(x.valor_pago))); return { ...x, saldo, juros: r2(saldo * ((Number(x.taxa_juros) || 0) / 100)) } }).sort((a, b) => b.saldo - a.saldo)
    const saldo = reais(lista.reduce((s, x) => s + centavos(x.saldo), 0)), juros = r2(lista.reduce((s, x) => s + x.juros, 0))
    if (dv) { n.dividaSaldo = saldo; n.jurosMes = juros }
    if (f12) n.fatMensal = r2((f12.valor as number) / 12)
    if (rd) { n.pagarAberto = rd.a_pagar.aberto; n.pagarVencido = rd.a_pagar.vencido }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(tx(lang, 'dividas'), dv ? saldo : null, 'BRL', 'calculo'),
      ind(L(lang, 'Juros estimados por mês', 'Estimated interest per month', 'Intereses estimados por mes'), dv ? juros : null, 'BRL', 'estimativa', undefined, L(lang, 'saldo × taxa mensal cadastrada', 'balance × registered monthly rate', 'saldo × tasa mensual registrada')),
      ind(tx(lang, 'a_pagar'), rd?.a_pagar.aberto, 'BRL', 'calculo'),
      ind(L(lang, 'Compromissos totais (dívidas + a pagar)', 'Total commitments (debt + payables)', 'Compromisos totales (deudas + por pagar)'), dv && rd ? reais(centavos(saldo) + centavos(rd.a_pagar.aberto)) : null, 'BRL', 'calculo'),
      ind(L(lang, 'Faturamento médio mensal (12 meses)', 'Average monthly revenue (12 months)', 'Facturación media mensual (12 meses)'), n.fatMensal, 'BRL', 'calculo'),
      ind(L(lang, 'Dívida em meses de faturamento', 'Debt in months of revenue', 'Deuda en meses de facturación'), dv && n.fatMensal ? r2(saldo / n.fatMensal) : null, 'QTD', 'calculo'),
    ] })
    secoes.push(tabela('dividas', L(lang, 'Dívidas cadastradas', 'Registered debts', 'Deudas registradas'), [[tx(lang, 'descricao'), 'texto'], [tx(lang, 'tipo'), 'texto'], [tx(lang, 'parcelas'), 'numero'], [tx(lang, 'juros_mes'), 'pct'], [tx(lang, 'vencimento'), 'data'], [tx(lang, 'saldo'), 'moeda']],
      lista.map((x) => [x.descricao ?? '—', x.tipo ?? '—', x.parcelas, x.taxa_juros, x.vencimento, x.saldo]), lang, dv ? ['Total', null, null, null, null, saldo] : undefined))
    C.limitar(L(lang, 'Juros por mês são estimativa sobre o saldo de hoje; o Axioma não guarda o histórico do saldo das dívidas.', 'Monthly interest is an estimate on today\'s balance; Axioma does not keep the history of debt balances.', 'Los intereses mensuales son estimación sobre el saldo de hoy; Axioma no guarda el historial del saldo de las deudas.'))
  }

  if (tipo === 'tributario') {
    const [ob, gu, mei, emp, d] = await Promise.all([
      ler(lerTodas(() => ctx.supabase.from('empresa_obrigacoes').select('id, nome, tipo, competencia, data_vencimento, valor_estimado, valor_pago, status').eq('empresa_id', ctx.empresaId).gte('data_vencimento', p.inicio).lte('data_vencimento', p.fim).order('id'))) as Promise<{ nome: string | null; tipo: string | null; competencia: string | null; data_vencimento: string | null; valor_estimado: number | null; valor_pago: number | null; status: string | null }[] | null>,
      ler(lerTodas(() => ctx.supabase.from('guias_arrecadacao').select('id, tipo, data_vencimento, valor_total, status').eq('empresa_id', ctx.empresaId).gte('data_vencimento', p.inicio).lte('data_vencimento', p.fim).order('id'))) as Promise<{ tipo: string | null; data_vencimento: string | null; valor_total: number | null; status: string | null }[] | null>,
      ler(lerTodas(() => ctx.supabase.from('mei_obrigacoes').select('id, tipo, descricao, competencia, data_vencimento, valor_esperado, valor, status').eq('empresa_id', ctx.empresaId).gte('data_vencimento', p.inicio).lte('data_vencimento', p.fim).order('id'))) as Promise<{ tipo: string | null; descricao: string | null; competencia: string | null; data_vencimento: string | null; valor_esperado: number | null; valor: number | null; status: string | null }[] | null>,
      ctx.supabase.from('empresas').select('regime_tributario').eq('id', ctx.empresaId).maybeSingle().then((r) => r, () => ({ data: null, error: true })),
      dreDe(ctx, p),
    ])
    C.leitura(['empresa_obrigacoes'], ob != null, `obrigacoes|${p.inicio}..${p.fim}|vencimento`)
    C.leitura(['guias_arrecadacao'], gu != null, `guias|${p.inicio}..${p.fim}|vencimento`)
    C.leitura(['mei_obrigacoes'], mei != null, `mei_obrigacoes|${p.inicio}..${p.fim}|vencimento`)
    const dre = C.dre(d, `${p.inicio}..${p.fim}`); avisoDreMensal()
    const quitado = (s: unknown) => /pag|quit|entreg|conclu/i.test(String(s ?? ''))
    const linhas = [
      ...(ob ?? []).map((o) => ({ nome: o.nome ?? o.tipo ?? '—', comp: o.competencia, venc: o.data_vencimento, est: Number(o.valor_estimado) || 0, pago: Number(o.valor_pago) || 0, status: o.status })),
      ...(mei ?? []).map((o) => ({ nome: o.descricao ?? o.tipo ?? '—', comp: o.competencia, venc: o.data_vencimento, est: Number(o.valor_esperado ?? o.valor) || 0, pago: quitado(o.status) ? Number(o.valor ?? o.valor_esperado) || 0 : 0, status: o.status })),
    ].sort((a, b) => String(a.venc).localeCompare(String(b.venc)))
    const vencidas = linhas.filter((l) => l.venc && l.venc < hoje && !quitado(l.status) && l.pago <= 0)
    const soma = (f: (l: typeof linhas[number]) => number, l = linhas) => reais(l.reduce((s, x) => s + centavos(f(x)), 0))
    if (ob || mei) n.obrigVencidas = { qtd: vencidas.length, valor: soma((l) => l.est, vencidas) }
    const guias = gu ?? []
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(L(lang, 'Obrigações com vencimento no período (estimado)', 'Obligations due in the period (estimated)', 'Obligaciones con vencimiento en el período (estimado)'), ob || mei ? soma((l) => l.est) : null, 'BRL', 'estimativa'),
      ind(L(lang, 'Pago registrado', 'Recorded as paid', 'Pagado registrado'), ob || mei ? soma((l) => l.pago) : null, 'BRL', 'fato'),
      ind(L(lang, 'Vencidas sem pagamento', 'Overdue without payment', 'Vencidas sin pago'), ob || mei ? vencidas.length : null, 'QTD', 'fato'),
      ind(L(lang, 'Guias de impostos no período', 'Tax slips in the period', 'Guías de impuestos en el período'), gu ? reais(guias.reduce((s, g) => s + centavos(g.valor_total), 0)) : null, 'BRL', 'fato'),
      ind(L(lang, 'Impostos sobre vendas pela DRE (estimativa)', 'Sales taxes per income statement (estimate)', 'Impuestos sobre ventas según estado de resultados (estimación)'), dre?.impostos_deducoes, 'BRL', 'estimativa'),
    ] })
    secoes.push(tabela('obrigacoes', L(lang, 'Obrigações do período', 'Obligations of the period', 'Obligaciones del período'), [[tx(lang, 'descricao'), 'texto'], [L(lang, 'Competência', 'Period', 'Competencia'), 'texto'], [tx(lang, 'vencimento'), 'data'], [tx(lang, 'estimado'), 'moeda'], [tx(lang, 'pago_col'), 'moeda'], [tx(lang, 'status'), 'texto']],
      linhas.map((l) => [l.nome, l.comp ? String(l.comp).slice(0, 7) : '—', l.venc, l.est, l.pago, l.status ?? '—']), lang))
    secoes.push(tabela('guias', L(lang, 'Guias de impostos', 'Tax slips', 'Guías de impuestos'), [[tx(lang, 'tipo'), 'texto'], [tx(lang, 'vencimento'), 'data'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'status'), 'texto']], guias.map((g) => [g.tipo ?? '—', g.data_vencimento, Number(g.valor_total) || 0, g.status ?? '—']), lang))
    const regime = (emp as { data: { regime_tributario?: string | null } | null }).data?.regime_tributario
    C.limitar(L(lang, `Regime tributário cadastrado: ${regime || 'não informado'}. Valores de obrigações são estimativas; a guia oficial prevalece. As regras da Reforma Tributária podem mudar valores a partir de 2026.`, `Registered tax regime: ${regime || 'not informed'}. Obligation amounts are estimates; the official slip prevails. Tax Reform rules may change amounts from 2026.`, `Régimen tributario registrado: ${regime || 'no informado'}. Los valores de obligaciones son estimaciones; la guía oficial prevalece. Las reglas de la Reforma Tributaria pueden cambiar valores a partir de 2026.`))
  }

  if (tipo === 'pdv') {
    const desde = somarDiasISO(ant ? ant.inicio : p.inicio, -1)
    const [vd, tc, mv] = await Promise.all([
      ler(lerTodas(() => ctx.supabase.from('venda').select('id, status, forma_pagamento, valor_total, desconto_total, criado_em, finalizada_em, cancelada_em').eq('empresa_id', ctx.empresaId).gte('criado_em', `${desde}T00:00:00Z`).order('id'))) as Promise<{ status: string | null; forma_pagamento: string | null; valor_total: number | null; desconto_total: number | null; criado_em: string | null; finalizada_em: string | null; cancelada_em: string | null }[] | null>,
      ler(lerTodas(() => ctx.supabase.from('turno_caixa').select('id, status, valor_abertura, valor_fechamento, valor_esperado, aberto_em, fechado_em').eq('empresa_id', ctx.empresaId).gte('aberto_em', `${desde}T00:00:00Z`).order('id'))) as Promise<{ status: string | null; valor_fechamento: number | null; valor_esperado: number | null; aberto_em: string | null; fechado_em: string | null }[] | null>,
      ler(lerTodas(() => ctx.supabase.from('caixa_movimentacao').select('id, tipo, valor, criado_em').eq('empresa_id', ctx.empresaId).gte('criado_em', `${desde}T00:00:00Z`).order('id'))) as Promise<{ tipo: string | null; valor: number | null; criado_em: string | null }[] | null>,
    ])
    C.leitura(['venda'], vd != null, `pdv|${p.inicio}..${p.fim}|dia da venda`)
    C.leitura(['turno_caixa'], tc != null, `turnos|${p.inicio}..${p.fim}|fechamento`)
    C.leitura(['caixa_movimentacao'], mv != null, `sangrias|${p.inicio}..${p.fim}|data`)
    const dia = (v: { finalizada_em: string | null; criado_em: string | null }) => diaDoTimestamp(v.finalizada_em || v.criado_em, ctx.fuso) ?? ''
    const cancelada = (v: { status: string | null; cancelada_em: string | null }) => !!v.cancelada_em || /cancel/i.test(String(v.status))
    const noP = (vd ?? []).filter((v) => { const x = dia(v); return x >= p.inicio && x <= p.fim })
    const ok = noP.filter((v) => !cancelada(v) && v.status === 'finalizada'), canc = noP.filter(cancelada)
    const soma = (l: { valor_total: number | null }[]) => reais(l.reduce((s, v) => s + centavos(v.valor_total), 0))
    const total = soma(ok)
    let compV: Comp | undefined
    if (ant && vd) { const okA = vd.filter((v) => { const x = dia(v); return x >= ant.inicio && x <= ant.fim && !cancelada(v) && v.status === 'finalizada' }); compV = comp(total, soma(okA), okA.length) }
    const turnos = (tc ?? []).filter((t) => { const x = diaDoTimestamp(t.fechado_em, ctx.fuso) ?? ''; return t.fechado_em && x >= p.inicio && x <= p.fim && t.valor_fechamento != null && t.valor_esperado != null })
    const comDif = turnos.map((t) => ({ t, dif: reais(centavos(t.valor_fechamento) - centavos(t.valor_esperado)) })).filter((x) => x.dif !== 0)
    const movs = (mv ?? []).filter((m) => { const x = diaDoTimestamp(m.criado_em, ctx.fuso) ?? ''; return x >= p.inicio && x <= p.fim })
    if (vd) { n.vendas = { qtd: ok.length, valor: total }; n.canceladas = { qtd: canc.length, valor: soma(canc) } }
    if (tc) n.difCaixa = { qtd: comDif.length, valor: reais(comDif.reduce((s, x) => s + centavos(x.dif), 0)) }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: [
      ind(L(lang, 'Vendas concluídas', 'Completed sales', 'Ventas concluidas'), vd ? total : null, 'BRL', 'calculo', compV),
      ind(L(lang, 'Quantidade de vendas', 'Number of sales', 'Cantidad de ventas'), vd ? ok.length : null, 'QTD', 'fato'),
      ind(L(lang, 'Ticket médio', 'Average ticket', 'Ticket medio'), vd && ok.length ? r2(total / ok.length) : null, 'BRL', 'calculo'),
      ind(L(lang, 'Descontos concedidos', 'Discounts given', 'Descuentos otorgados'), vd ? reais(ok.reduce((s, v) => s + centavos(v.desconto_total), 0)) : null, 'BRL', 'calculo'),
      ind(L(lang, 'Vendas canceladas', 'Cancelled sales', 'Ventas canceladas'), vd ? soma(canc) : null, 'BRL', 'calculo', undefined, vd ? L(lang, `${canc.length} venda(s)`, `${canc.length} sale(s)`, `${canc.length} venta(s)`) : undefined),
      ind(L(lang, 'Diferença nos fechamentos de caixa', 'Difference at cash closings', 'Diferencia en los cierres de caja'), tc ? n.difCaixa!.valor : null, 'BRL', 'calculo', undefined, tc ? L(lang, `${turnos.length} turno(s) fechado(s), ${comDif.length} com diferença`, `${turnos.length} closed shift(s), ${comDif.length} with difference`, `${turnos.length} turno(s) cerrado(s), ${comDif.length} con diferencia`) : undefined),
    ] })
    const porForma = new Map<string, { n: number; c: number }>()
    for (const v of ok) { const k = v.forma_pagamento || '—'; const a = porForma.get(k) ?? { n: 0, c: 0 }; a.n++; a.c += centavos(v.valor_total); porForma.set(k, a) }
    const formaNome = (f: string) => ({ dinheiro: L(lang, 'Dinheiro', 'Cash', 'Efectivo'), pix: 'PIX', debito: L(lang, 'Débito', 'Debit', 'Débito'), credito: L(lang, 'Crédito', 'Credit', 'Crédito') } as Record<string, string>)[f] ?? f
    secoes.push(tabela('formas', L(lang, 'Vendas por forma de pagamento', 'Sales by payment method', 'Ventas por forma de pago'), [[tx(lang, 'forma'), 'texto'], [tx(lang, 'vendas'), 'numero'], [tx(lang, 'valor'), 'moeda'], [tx(lang, 'participacao'), 'pct']],
      [...porForma.entries()].sort((a, b) => b[1].c - a[1].c).map(([f, a]) => [formaNome(f), a.n, reais(a.c), pctDe(reais(a.c), total)]), lang, vd ? ['Total', ok.length, total, ok.length ? 100 : 0] : undefined))
    const porTipo = new Map<string, number>()
    for (const m of movs) porTipo.set(m.tipo || '—', (porTipo.get(m.tipo || '—') ?? 0) + centavos(m.valor))
    secoes.push(tabela('movs', L(lang, 'Sangrias e suprimentos', 'Cash withdrawals and deposits', 'Retiros y aportes de caja'), [[tx(lang, 'tipo'), 'texto'], [tx(lang, 'valor'), 'moeda']], [...porTipo.entries()].map(([t, c]) => [t, reais(c)]), lang))
    secoes.push(tabela('turnos', L(lang, 'Turnos fechados com diferença', 'Shifts closed with a difference', 'Turnos cerrados con diferencia'), [[L(lang, 'Fechado em', 'Closed on', 'Cerrado el'), 'data'], [L(lang, 'Esperado', 'Expected', 'Esperado'), 'moeda'], [L(lang, 'Contado', 'Counted', 'Contado'), 'moeda'], [tx(lang, 'variacao'), 'moeda']],
      comDif.map((x) => [diaDoTimestamp(x.t.fechado_em, ctx.fuso), Number(x.t.valor_esperado), Number(x.t.valor_fechamento), x.dif]), lang))
    C.limitar(L(lang, 'Vendas no crédito entram aqui pela data da venda; no caixa entram só quando a operadora repassa.', 'Credit card sales appear here by sale date; in cash they only enter when the card company pays out.', 'Las ventas a crédito entran aquí por la fecha de venta; en caja entran solo cuando la operadora transfiere.'))
  }

  if (tipo === 'conciliacao') {
    const rec = await F('reconciliacao', {})
    const d = rec?.detalhes as { resumo: { total: number; confirmadas: number; possiveis: number; divergencias: number; insuficientes: number }; achados: { tipo: string; classe: string; motivo: string; ids: string[]; valor?: number }[]; sem_categoria: { quantidade: number } } | undefined
    if (d) n.reconc = d.resumo
    const classe = (c: string) => ({ correspondencia_confirmada: L(lang, 'Duplicidade confirmada', 'Confirmed duplicate', 'Duplicidad confirmada'), possivel_correspondencia: L(lang, 'Possível duplicidade', 'Possible duplicate', 'Posible duplicidad'), divergencia: L(lang, 'Divergência', 'Divergence', 'Divergencia'), informacao_insuficiente: L(lang, 'Informação insuficiente', 'Insufficient information', 'Información insuficiente') } as Record<string, string>)[c] ?? c
    const TIPO: Record<string, [string, string, string]> = {
      duplicidade_conta_pagar: ['Conta a pagar repetida', 'Repeated payable', 'Cuenta por pagar repetida'], duplicidade_conta_receber: ['Conta a receber repetida', 'Repeated receivable', 'Cuenta por cobrar repetida'],
      fluxo_status_confirmado: ['Fluxo de Caixa "confirmado" fora do caixa', 'Cash Flow "confirmed" outside cash', 'Flujo de Caja "confirmado" fuera de caja'], pagamento_sem_data: ['Pagamento sem data', 'Payment without date', 'Pago sin fecha'],
      recebimento_sem_data: ['Recebimento sem data', 'Receipt without date', 'Cobro sin fecha'], receita_pendente_de_conta_a_receber: ['Receita pendente criada de conta a receber', 'Pending revenue created from a receivable', 'Ingreso pendiente creado de cuenta por cobrar'],
      status_pago_com_saldo: ['Marcada como paga, mas com saldo', 'Marked paid but with balance', 'Marcada como pagada, pero con saldo'], status_pendente_quitada: ['Pendente, mas já quitada', 'Pending but already settled', 'Pendiente, pero ya liquidada'],
      status_recebido_com_saldo: ['Marcada como recebida, mas com saldo', 'Marked received but with balance', 'Marcada como cobrada, pero con saldo'], vencimento_antes_da_emissao: ['Vencimento antes da emissão', 'Due date before issue date', 'Vencimiento antes de la emisión'],
      venda_pdv_sem_data: ['Venda do PDV sem data de finalização', 'POS sale without completion date', 'Venta del PDV sin fecha de finalización'],
    }
    secoes.push({ id: 'indicadores', titulo: tx(lang, 'indicadores'), tipo: 'indicadores', itens: d ? [
      ind(L(lang, 'Pontos de atenção', 'Attention points', 'Puntos de atención'), d.resumo.total, 'QTD', 'fato'),
      ind(classe('correspondencia_confirmada'), d.resumo.confirmadas, 'QTD', 'fato'), ind(classe('possivel_correspondencia'), d.resumo.possiveis, 'QTD', 'fato'),
      ind(classe('divergencia'), d.resumo.divergencias, 'QTD', 'fato'), ind(classe('informacao_insuficiente'), d.resumo.insuficientes, 'QTD', 'fato'),
      ind(L(lang, 'Lançamentos sem categoria', 'Entries without category', 'Registros sin categoría'), d.sem_categoria.quantidade, 'QTD', 'fato'),
    ] : [] })
    secoes.push(tabela('achados', L(lang, 'Pontos encontrados (nada foi alterado)', 'Points found (nothing was changed)', 'Puntos encontrados (nada fue alterado)'), [[tx(lang, 'tipo'), 'texto'], [tx(lang, 'classe'), 'texto'], [tx(lang, 'quantidade'), 'numero'], [tx(lang, 'valor'), 'moeda'], ...(lang === 'pt' ? [[tx(lang, 'motivo'), 'texto']] as [string, TipoColuna][] : [])],
      (d?.achados ?? []).map((a) => [TIPO[a.tipo] ? L(lang, ...TIPO[a.tipo]) : a.tipo, classe(a.classe), a.ids.length, a.valor ?? null, ...(lang === 'pt' ? [a.motivo] : [])]), lang))
    C.limitar(L(lang, 'Mesmo valor sozinho não é tratado como duplicidade. A conferência só aponta: corrigir ou excluir é feito na tela de origem, com aprovação de supervisor.', 'Same amount alone is not treated as a duplicate. The check only flags: fixing or deleting is done on the source screen, with supervisor approval.', 'El mismo valor solo no se trata como duplicidad. La verificación solo señala: corregir o eliminar se hace en la pantalla de origen, con aprobación de supervisor.'))
  }

  // Empresa (nome e documento) — leitura com RLS; falha não derruba o relatório
  const emp = await Promise.resolve(ctx.supabase.from('empresas').select('nome, nome_fantasia, razao_social, cnpj').eq('id', ctx.empresaId).maybeSingle()).catch(() => ({ data: null }))
  const e = (emp as { data: { nome?: string; nome_fantasia?: string | null; razao_social?: string | null; cnpj?: string | null } | null }).data
  if (p.parcial) C.limitar(L(lang, 'O período ainda não terminou: os valores são parciais e não se comparam a um período fechado.', 'The period has not ended yet: values are partial and not comparable to a closed period.', 'El período aún no terminó: los valores son parciales y no se comparan con un período cerrado.'))
  const achados = achadosPorRegras(n, lang)
  const fim = C.fim()
  if (fim.estado === 'erro') return { erro: L(lang, 'Não foi possível consultar os dados agora. Tente de novo em instantes.', 'Could not query the data now. Try again in a moment.', 'No fue posible consultar los datos ahora. Intente de nuevo en instantes.') }
  return {
    tipo, titulo: tituloRelatorio(tipo, lang), lang,
    empresa: { nome: e?.nome_fantasia || e?.nome || e?.razao_social || '—', documento: e?.cnpj ?? null },
    periodo: { inicio: p.inicio, fim: p.fim, rotulo: rotuloPeriodo(p.nome, p.inicio, p.fim, lang), parcial: p.parcial },
    comparado_com: ant ? rotuloPeriodo('anterior', ant.inicio, ant.fim, lang) : null,
    gerado_em: new Date().toISOString(), fuso: ctx.fuso, estado: fim.estado,
    resumo: resumoDe(n, lang), secoes, achados, limitacoes: fim.limitacoes, fontes: fim.fontes, metodologia: metodologiaBase(lang), refs: fim.refs,
  }
}

// Pedido vindo da tela/chat: só aceita tipo e período conhecidos; o resto vira padrão seguro
const PERIODOS_RELATORIO = ['hoje', 'ontem', 'esta_semana', 'semana_anterior', 'ultimos_7_dias', 'este_mes', 'mes_anterior', 'ultimos_30_dias', 'este_trimestre', 'trimestre_anterior', 'este_ano', 'ano_anterior', 'ultimos_12_meses', 'personalizado'] as const
export function validarPedido(c: unknown): PedidoRelatorio | null {
  const o = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>
  if (!(TIPOS_RELATORIO as readonly string[]).includes(String(o.tipo))) return null
  const periodo = (PERIODOS_RELATORIO as readonly string[]).includes(String(o.periodo)) ? String(o.periodo) : 'este_mes'
  const data = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)
  const lang = o.lang === 'en' || o.lang === 'es' ? o.lang : 'pt'
  return { tipo: o.tipo as TipoRelatorio, periodo, inicio: periodo === 'personalizado' ? data(o.inicio) : null, fim: periodo === 'personalizado' ? data(o.fim) : null, comparar: o.comparar === true, lang }
}

// ─── Ferramenta do motor (José e chats): o MESMO relatório, resumido para a IA ler, + o pedido para a tela ───
export const FERRAMENTA_RELATORIO = {
  name: 'relatorio', strict: true as const,
  description: 'Gera um relatório executivo CFO (os mesmos números da tela Relatórios e do PDF): executivo, dre, fluxo_caixa, contas_receber, contas_pagar, receitas, despesas, endividamento, tributario, pdv ou conciliacao. Devolve resumo, indicadores, tabelas principais, riscos com evidência, recomendações e limitações. Use quando pedirem relatório, PDF, DRE do mês, comparação com período anterior, maiores despesas ou "o que falta de dados". Diga o período adotado; a tela mostra o botão para abrir o relatório e baixar o PDF.',
  input_schema: { type: 'object' as const, additionalProperties: false as const, required: ['tipo', 'periodo', 'inicio', 'fim', 'comparar'], properties: {
    tipo: { type: 'string', enum: [...TIPOS_RELATORIO] },
    periodo: { type: 'string', enum: [...PERIODOS_RELATORIO], description: 'Período em palavras no fuso da empresa ("último mês" fechado = mes_anterior). "personalizado" exige inicio/fim.' },
    inicio: { type: ['string', 'null'], description: 'Só com "personalizado": AAAA-MM-DD (senão null).' },
    fim: { type: ['string', 'null'], description: 'Só com "personalizado": AAAA-MM-DD (senão null).' },
    comparar: { type: 'boolean', description: 'true = comparar com o período anterior equivalente.' },
  } },
}
export async function relatorioParaIA(ctx: CtxRelatorio, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  const pedido = validarPedido({ ...input, lang: 'pt' })
  if (!pedido) return { erro: 'tipo de relatório inválido' }
  const r = await gerarRelatorio(ctx, pedido)
  if ('erro' in r) return { erro: r.erro }
  return {
    indicador: `relatorio_${r.tipo}`, estado: r.estado, titulo: r.titulo, periodo: r.periodo, comparado_com: r.comparado_com, resumo: r.resumo,
    indicadores: r.secoes.flatMap((s) => (s.tipo === 'indicadores' ? s.itens.map((i) => ({ rotulo: i.rotulo, valor: i.valor, unidade: i.unidade, classe: i.classe, anterior: i.anterior, variacao_pct: i.variacao_pct, nota: i.nota })) : [])),
    tabelas: r.secoes.flatMap((s) => (s.tipo === 'tabela' ? [{ titulo: s.titulo, colunas: s.colunas.map((c) => c.rotulo), linhas: s.linhas.slice(0, 8), total: s.total ?? null, mais_linhas: Math.max(0, s.linhas.length - 8) }] : [])),
    achados: r.achados, limitacoes: r.limitacoes, fontes: r.fontes, refs: r.refs,
    pedido: { tipo: pedido.tipo, periodo: pedido.periodo, inicio: pedido.inicio, fim: pedido.fim, comparar: pedido.comparar },
  }
}
