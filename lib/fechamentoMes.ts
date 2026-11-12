// ═══════════════════════════════════════════════════════════════
// Fechamento do mês guiado (2026-11-12, item 2 da pesquisa "CFO no mundo": a Kingdee monta sozinha a lista do
// fechamento e aponta as exceções). Um checklist por competência, com o que falta, quanto e onde resolver.
// Só lê: cada item reaproveita a mesma fonte da tela de origem (Conferência, contas, custos fixos, RH, obrigações).
// Leitura que falha vira "sem_dado" com aviso — nunca "ok" calado.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { lerTodas } from './lerTodas'
import { custosFixosNoMes, type CustoFixo } from './financeiro/calculos'
import { carregarConferencia } from './conferenciaHelpers'

type T3 = { pt: string; en: string; es: string }
export type StatusItem = 'ok' | 'pendente' | 'sem_dado' | 'nao_se_aplica'
export type ItemFechamento = { id: string; status: StatusItem; titulo: T3; detalhe: T3; qtd?: number; valor?: number; rota: string; acao: T3 }

const t = (pt: string, en: string, es: string): T3 => ({ pt, en, es })
const ultimoDia = (mes: string) => { const [a, m] = mes.split('-').map(Number); return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}` }
const soma = (l: { v: number }[]) => Math.round(l.reduce((s, x) => s + x.v, 0) * 100) / 100

/** Progresso: itens resolvidos ÷ itens que se aplicam (sem_dado conta como não resolvido). */
export function progressoFechamento(itens: ItemFechamento[]) {
  const aplicaveis = itens.filter((i) => i.status !== 'nao_se_aplica')
  const ok = aplicaveis.filter((i) => i.status === 'ok').length
  return { ok, total: aplicaveis.length, pct: aplicaveis.length ? Math.round((ok / aplicaveis.length) * 100) : 100, pronto: aplicaveis.length > 0 && ok === aplicaveis.length }
}

export async function carregarChecklistFechamento(sb: SupabaseClient, empresaId: string, mes: string, hoje: string): Promise<ItemFechamento[]> {
  const inicio = `${mes}-01`, fim = ultimoDia(mes), limiteVencido = fim < hoje ? fim : hoje
  const ler = (tab: string, cols: string, f: (q: any) => any) => lerTodas(() => f(sb.from(tab).select(cols).eq('empresa_id', empresaId)).order('id'))
  const [rec, cv, cp, cr, cf, rh, ob, conf] = await Promise.all([
    ler('receitas', 'id, valor, categoria', (q) => q.gte('data', inicio).lte('data', fim)),
    ler('custos_variaveis', 'id, valor, categoria', (q) => q.gte('data', inicio).lte('data', fim)),
    ler('contas_pagar', 'id, valor_total, valor_pago, status, data_vencimento', (q) => q.gte('data_vencimento', inicio).lt('data_vencimento', limiteVencido)),
    ler('contas_receber', 'id, valor, valor_recebido, valor_desconto, status, data_vencimento', (q) => q.gte('data_vencimento', inicio).lt('data_vencimento', limiteVencido)),
    ler('custos_fixos', 'id, descricao, categoria, valor_mensal, data_inicio, data_fim, created_at', (q) => q.eq('categoria', 'Folha de pagamento')),
    // RH: contratos ativos no mês (sem liberação do RH a RLS devolve vazio → o item vira "não se aplica", nunca "pendente" falso)
    ler('rh_contratos', 'id, data_admissao, data_desligamento', (q) => q.lte('data_admissao', fim)),
    ler('empresa_obrigacoes', 'id, nome, status, data_vencimento, valor_estimado', (q) => q.gte('data_vencimento', inicio).lte('data_vencimento', fim)),
    carregarConferencia(empresaId, inicio, fim).catch(() => null),
  ])
  const itens: ItemFechamento[] = []
  const semDado = (id: string, titulo: T3, rota: string, acao: T3): ItemFechamento => ({ id, status: 'sem_dado', titulo, detalhe: t('Não foi possível ler agora. Recarregue a página.', 'Could not read now. Reload the page.', 'No se pudo leer ahora. Recargue la página.'), rota, acao })

  // 1–2. Lançamentos do mês sem categoria (DRE por categoria e relatórios ficam incompletos)
  for (const [id, r, titulo, rota] of [
    ['receitas_categoria', rec, t('Receitas com categoria', 'Revenue categorized', 'Ingresos con categoría'), '/receitas'],
    ['custos_categoria', cv, t('Custos variáveis com categoria', 'Variable costs categorized', 'Costos variables con categoría'), '/custos-variaveis'],
  ] as const) {
    const acao = t('Abrir e categorizar ›', 'Open and categorize ›', 'Abrir y categorizar ›')
    if (r.error) { itens.push(semDado(id, titulo, rota, acao)); continue }
    const sem = (r.data as { valor: number; categoria: string | null }[]).filter((x) => !String(x.categoria ?? '').trim())
    itens.push({ id, titulo, rota, acao, qtd: sem.length, valor: soma(sem.map((x) => ({ v: Number(x.valor) || 0 }))), status: sem.length ? 'pendente' : 'ok',
      detalhe: sem.length ? t(`${sem.length} lançamento(s) sem categoria no mês.`, `${sem.length} entry(ies) without category this month.`, `${sem.length} registro(s) sin categoría en el mes.`) : t('Tudo categorizado.', 'All categorized.', 'Todo categorizado.') })
  }

  // 3–4. Contas que venceram no mês e continuam em aberto
  {
    const titulo = t('Contas a pagar do mês resolvidas', 'Month payables settled', 'Cuentas por pagar del mes resueltas'), rota = '/contas-pagar?filtro=vencido', acao = t('Pagar ou renegociar ›', 'Pay or renegotiate ›', 'Pagar o renegociar ›')
    if (cp.error) itens.push(semDado('pagar_vencidas', titulo, rota, acao))
    else {
      const ab = (cp.data as { valor_total: number; valor_pago: number; status: string }[]).filter((c) => !['pago', 'cancelado'].includes(String(c.status)) && Number(c.valor_total) - Number(c.valor_pago || 0) > 0.004)
      const v = soma(ab.map((c) => ({ v: Number(c.valor_total) - Number(c.valor_pago || 0) })))
      itens.push({ id: 'pagar_vencidas', titulo, rota, acao, qtd: ab.length, valor: v, status: ab.length ? 'pendente' : 'ok',
        detalhe: ab.length ? t(`${ab.length} conta(s) vencida(s) em aberto.`, `${ab.length} overdue bill(s) open.`, `${ab.length} cuenta(s) vencida(s) abierta(s).`) : t('Nada vencido em aberto.', 'Nothing overdue open.', 'Nada vencido abierto.') })
    }
  }
  {
    const titulo = t('Contas a receber do mês resolvidas', 'Month receivables settled', 'Cuentas por cobrar del mes resueltas'), rota = '/contas-receber?filtro=vencido', acao = t('Cobrar ›', 'Collect ›', 'Cobrar ›')
    if (cr.error) itens.push(semDado('receber_vencidas', titulo, rota, acao))
    else {
      const ab = (cr.data as { valor: number; valor_recebido: number; valor_desconto: number; status: string }[]).filter((c) => !['recebido', 'cancelado'].includes(String(c.status)) && Number(c.valor) - Number(c.valor_desconto || 0) - Number(c.valor_recebido || 0) > 0.004)
      const v = soma(ab.map((c) => ({ v: Number(c.valor) - Number(c.valor_desconto || 0) - Number(c.valor_recebido || 0) })))
      itens.push({ id: 'receber_vencidas', titulo, rota, acao, qtd: ab.length, valor: v, status: ab.length ? 'pendente' : 'ok',
        detalhe: ab.length ? t(`${ab.length} conta(s) vencida(s) sem receber.`, `${ab.length} overdue bill(s) not received.`, `${ab.length} cuenta(s) vencida(s) sin cobrar.`) : t('Tudo recebido ou dentro do prazo.', 'All received or within terms.', 'Todo cobrado o dentro del plazo.') })
    }
  }

  // 5. Folha: quem tem funcionário no RH precisa da folha em Custos Fixos, senão a DRE do mês não vê o custo de pessoal
  {
    const titulo = t('Folha do mês lançada', 'Month payroll entered', 'Nómina del mes registrada'), rota = '/custos-fixos', acao = t('Lançar a folha ›', 'Enter payroll ›', 'Registrar la nómina ›')
    if (cf.error || rh.error) itens.push(semDado('folha', titulo, rota, acao))
    else {
      const ativos = (rh.data as { data_desligamento: string | null }[]).filter((k) => !k.data_desligamento || k.data_desligamento >= inicio).length
      const folha = custosFixosNoMes(cf.data as unknown as CustoFixo[], mes).total_ativo
      itens.push(ativos === 0
        ? { id: 'folha', titulo, rota, acao, status: 'nao_se_aplica', detalhe: t('Sem funcionários no RH neste mês (ou sem liberação para ver o RH).', 'No employees in HR this month (or no HR access).', 'Sin empleados en RR. HH. este mes (o sin acceso a RR. HH.).') }
        : { id: 'folha', titulo, rota, acao, qtd: ativos, valor: folha, status: folha > 0 ? 'ok' : 'pendente',
            detalhe: folha > 0 ? t(`Folha em Custos Fixos para ${ativos} contrato(s).`, `Payroll in Fixed Costs for ${ativos} contract(s).`, `Nómina en Costos Fijos para ${ativos} contrato(s).`) : t(`${ativos} contrato(s) no RH e nenhuma "Folha de pagamento" em Custos Fixos: a DRE não vê o custo de pessoal.`, `${ativos} contract(s) in HR and no "Folha de pagamento" in Fixed Costs: the income statement misses personnel cost.`, `${ativos} contrato(s) en RR. HH. y ninguna "Folha de pagamento" en Costos Fijos: el estado de resultados no ve el costo de personal.`) })
    }
  }

  // 6. Obrigações fiscais que vencem no mês
  {
    const titulo = t('Obrigações fiscais do mês em dia', 'Month tax obligations done', 'Obligaciones fiscales del mes al día'), rota = '/empresa?aba=compliance', acao = t('Ver obrigações ›', 'See obligations ›', 'Ver obligaciones ›')
    if (ob.error) itens.push(semDado('obrigacoes', titulo, rota, acao))
    else {
      const todas = ob.data as { status: string; valor_estimado: number | null }[]
      const pend = todas.filter((o) => !['pago', 'paga', 'concluida', 'concluído', 'entregue', 'dispensada'].includes(String(o.status).toLowerCase()))
      itens.push(todas.length === 0
        ? { id: 'obrigacoes', titulo, rota, acao, status: 'nao_se_aplica', detalhe: t('Nenhuma obrigação cadastrada para este mês.', 'No obligation registered for this month.', 'Ninguna obligación registrada para este mes.') }
        : { id: 'obrigacoes', titulo, rota, acao, qtd: pend.length, valor: soma(pend.map((o) => ({ v: Number(o.valor_estimado) || 0 }))), status: pend.length ? 'pendente' : 'ok',
            detalhe: pend.length ? t(`${pend.length} de ${todas.length} obrigação(ões) ainda pendente(s).`, `${pend.length} of ${todas.length} obligation(s) still pending.`, `${pend.length} de ${todas.length} obligación(es) aún pendiente(s).`) : t(`${todas.length} obrigação(ões) cumprida(s).`, `${todas.length} obligation(s) done.`, `${todas.length} obligación(es) cumplida(s).`) })
    }
  }

  // 7. Conferência: DRE × Contabilidade e Contas pagas/recebidas × Fluxo de Caixa batendo no mês
  {
    const titulo = t('Conferência do mês batendo', 'Month reconciliation matching', 'Conciliación del mes cuadrando'), rota = '/conferencia', acao = t('Abrir Conferência ›', 'Open Reconciliation ›', 'Abrir Conciliación ›')
    if (!conf || conf.falhou) itens.push(semDado('conferencia', titulo, rota, acao))
    else {
      const linha = conf.meses.find((m) => m.mes === mes)
      const pares = linha ? [linha.receitaDreXContabil, linha.custoDreXContabil, linha.pagoXFluxo, linha.recebidoXFluxo] : []
      const difs = pares.filter((p) => !p.ok).length + conf.casos.length
      itens.push({ id: 'conferencia', titulo, rota, acao, qtd: difs, status: difs ? 'pendente' : 'ok',
        detalhe: difs ? t(`${difs} diferença(s) entre DRE, Contabilidade e Fluxo de Caixa.`, `${difs} difference(s) between income statement, Accounting and Cash Flow.`, `${difs} diferencia(s) entre estado de resultados, Contabilidad y Flujo de Caja.`) : t('DRE, Contabilidade e Fluxo de Caixa batem.', 'Income statement, Accounting and Cash Flow match.', 'Estado de resultados, Contabilidad y Flujo de Caja cuadran.') })
    }
  }
  return itens
}
