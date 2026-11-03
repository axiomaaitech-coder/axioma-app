// Relatório completo de Contas Vencidas (Overdue Intelligence, Fase 2 etapa 14). Puro: monta as seções com os
// MESMOS números da tela (resumoPainel com os filtros atuais + piloto + alertas da análise). A tela só escolhe
// o formato: PDF (uma tabela Seção | Item | Valor | Detalhe) ou Excel (uma aba por seção).
import type { AnaliseVencidos, ItemVencido } from './dados'
import type { resumoPainel } from './painel'
import { nomeAcao, nomeRegraPiloto, nomeNivel, textoAlerta, type Lang } from './textos'

export type Celula = string | number
export type Secao = { nome: string; linhas: Record<string, Celula>[] }

export function montarRelatorio(a: AnaliseVencidos, r: ReturnType<typeof resumoPainel>, lang: Lang, fmt: (v: number) => string, dataTxt: (d: string) => string): Secao[] {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [cItem, cValor, cDetalhe] = [L('Item', 'Item', 'Ítem'), L('Valor', 'Value', 'Valor'), L('Detalhe', 'Detail', 'Detalle')]
  const linha = (item: string, valor: Celula, detalhe = '') => ({ [cItem]: item, [cValor]: valor, [cDetalhe]: detalhe })
  const pct = (v: number | null) => (v == null ? '—' : `${v.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { maximumFractionDigits: 1 })}%`)
  const dias = L('dias', 'days', 'días')

  const resumo: Secao = { nome: L('Resumo', 'Summary', 'Resumen'), linhas: [
    linha(L('A receber vencido', 'Overdue receivable', 'Por cobrar vencido'), fmt(r.totalReceber), `${r.receber.length} ${L('contas', 'bills', 'cuentas')}`),
    linha(L('A pagar vencido', 'Overdue payable', 'Por pagar vencido'), fmt(r.totalPagar), `${r.pagar.length} ${L('contas', 'bills', 'cuentas')}`),
    linha(L('Diferença (receber − pagar)', 'Difference (receivable − payable)', 'Diferencia (cobrar − pagar)'), fmt(r.diferenca)),
    linha(L('Recuperado no período', 'Recovered in period', 'Recuperado en el período'), fmt(r.recuperado), `${L('taxa', 'rate', 'tasa')} ${pct(r.taxaRecuperacao)}`),
    linha(L('Valor em risco', 'Amount at risk', 'Valor en riesgo'), fmt(r.valorEmRisco), L('saldo não contestado × nota de risco', 'undisputed balance × risk score', 'saldo no disputado × nota de riesgo')),
    linha(L('Sem histórico para nota', 'No history for a score', 'Sin historial para nota'), fmt(r.semScore), `${r.qtdSemScore} ${L('contas', 'bills', 'cuentas')}`),
    linha(L('Promessas em aberto', 'Open promises', 'Promesas abiertas'), r.promessasPendentes, `${fmt(r.valorPrometido)} · ${L('promessa não é caixa', 'a promise is not cash', 'la promesa no es caja')}`),
    linha(L('Promessas descumpridas', 'Broken promises', 'Promesas incumplidas'), r.promessasDescumpridas),
    linha(L('Divergências abertas', 'Open disputes', 'Divergencias abiertas'), r.disputasAbertas, fmt(r.valorContestado)),
    ...r.previsao.horizontes.map((h) => linha(L(`Previsão de recebimento em ${h.horizonteDias} dias`, `Expected collection in ${h.horizonteDias} days`, `Previsión de cobro en ${h.horizonteDias} días`), fmt(h.valor))),
  ] }

  const faixas = (lado: string, ag: typeof r.agingReceber) => ag.faixas.map((x) => linha(`${lado} · ${x.rotulo} ${dias}`, fmt(x.saldo), `${x.qtd} ${L('contas', 'bills', 'cuentas')} · ${pct(x.pctSaldo)}`))
  const aging: Secao = { nome: L('Atraso por faixa', 'Overdue by range', 'Atraso por rango'), linhas: [...faixas(L('A receber', 'Receivable', 'Por cobrar'), r.agingReceber), ...faixas(L('A pagar', 'Payable', 'Por pagar'), r.agingPagar)] }

  const piloto: Secao = { nome: L('Ações de hoje', 'Today’s actions', 'Acciones de hoy'), linhas: a.piloto.map((x) => linha(`${nomeRegraPiloto(lang, x.regra)} · ${x.nome || '—'}`, fmt(x.saldo), `${x.dias} ${dias} · ${x.dominio === 'pagar' ? L('a pagar', 'payable', 'por pagar') : L('a receber', 'receivable', 'por cobrar')}`)) }

  const alertas: Secao = { nome: L('Alertas', 'Alerts', 'Alertas'), linhas: a.alertas.map((x) => linha(textoAlerta(lang, x), nomeNivel(lang, x.severidade))) }

  const contas = (nome: string, l: ItemVencido[]): Secao => ({ nome, linhas: l.map((i) => ({
    [L('Nome', 'Name', 'Nombre')]: i.titulo.contraparteNome || '—', [L('Vencimento', 'Due date', 'Vencimiento')]: dataTxt(i.titulo.vencimento),
    [L('Dias de atraso', 'Days overdue', 'Días de atraso')]: i.encargos.dias, [L('Saldo', 'Balance', 'Saldo')]: fmt(i.saldo),
    [L('Total atualizado', 'Updated total', 'Total actualizado')]: fmt(i.encargos.total),
    [L('Nota de risco', 'Risk score', 'Nota de riesgo')]: i.titulo.dominio === 'receber' ? (i.risco.score ?? L('sem histórico', 'no history', 'sin historial')) : '—',
    [L('Próxima ação', 'Next action', 'Próxima acción')]: nomeAcao(lang, i.acao.acao),
  })) })

  return [resumo, aging, piloto, alertas, contas(L('A receber vencidas', 'Overdue receivables', 'Por cobrar vencidas'), r.receber), contas(L('A pagar vencidas', 'Overdue payables', 'Por pagar vencidas'), r.pagar)]
}

// PDF: tudo numa tabela só (o gerador do Axioma faz uma tabela por documento); contas viram Item | Valor | Detalhe
export function linhasPdf(secoes: Secao[], lang: Lang): Record<string, string>[] {
  const s = lang === 'en' ? 'Section' : lang === 'es' ? 'Sección' : 'Seção'
  return secoes.flatMap((sec) => sec.linhas.map((l) => {
    const v = Object.values(l).map(String)
    // seção de contas: Nome · Vencimento | Saldo | dias · total · nota · ação
    return v.length === 3 ? { [s]: sec.nome, a: v[0], b: v[1], c: v[2] } : { [s]: sec.nome, a: `${v[0]} · ${v[1]}`, b: v[3], c: `${v[2]} d · ${v[4]} · ${v[5]} · ${v[6]}` }
  }))
}
