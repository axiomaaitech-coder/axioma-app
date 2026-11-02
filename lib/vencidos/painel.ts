// Painel geral de Contas Vencidas (Overdue Command Center, Fase 2 etapa 1): filtros e números do topo.
// Puro (sem banco): recebe a análise já carregada (lib/vencidos/dados) e devolve o que a tela mostra.
// Todo número sai do motor (lib/vencidos/motor) — nada recalculado aqui.
import * as M from './motor'
import type { AnaliseVencidos, ItemVencido } from './dados'

export type Situacao = 'todas' | 'disputa' | 'promessa' | 'negociacao' | 'sem_acompanhamento'
export type Filtros = { busca: string; faixa: number; situacao: Situacao; inicio: string; fim: string } // faixa -1 = todas

export const filtrosIniciais = (inicio: string, fim: string): Filtros => ({ busca: '', faixa: -1, situacao: 'todas', inicio, fim })

const texto = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const casaBusca = (t: M.Titulo, busca: string) => !busca || texto(`${t.contraparteNome} ${t.descricao ?? ''}`).includes(texto(busca))

export function filtrar(itens: ItemVencido[], f: Filtros, hoje: string, limites: number[]): ItemVencido[] {
  return itens.filter((i) => {
    if (!casaBusca(i.titulo, f.busca.trim())) return false
    if (f.faixa >= 0 && M.faixaDe(M.diasAtraso(i.titulo.vencimento, hoje), limites) !== f.faixa) return false
    const temPromessa = !!i.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida', 'descumprida'].includes(i.promessa)
    if (f.situacao === 'disputa') return i.disputa.aberta
    if (f.situacao === 'promessa') return temPromessa
    if (f.situacao === 'negociacao') return i.emNegociacao
    if (f.situacao === 'sem_acompanhamento') return !i.disputa.aberta && !temPromessa && !i.emNegociacao
    return true
  })
}

export function resumoPainel(a: AnaliseVencidos, f: Filtros) {
  const receber = filtrar(a.receber, f, a.hoje, a.limites), pagar = filtrar(a.pagar, f, a.hoje, a.limites)
  const soma = (l: ItemVencido[], v: (i: ItemVencido) => number) => Math.round(l.reduce((s, i) => s + v(i), 0) * 100) / 100
  const totalReceber = soma(receber, (i) => i.saldo), totalPagar = soma(pagar, (i) => i.saldo)
  // recuperado: títulos da busca (cliente) pagos com atraso dentro do período
  const recuperado = M.recuperadoNoPeriodo(a.titulosReceber.filter((t) => casaBusca(t, f.busca.trim())), f.inicio, f.fim)
  const comScore = receber.filter((i) => i.risco.score != null)
  const promessas = receber.filter((i) => i.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(i.promessa))
  const disputas = [...receber, ...pagar].filter((i) => i.disputa.aberta)
  const previsao = M.previsaoRecuperacao(receber.map((i) => ({ titulo: i.titulo, risco: i.risco.score, caso: i.caso ? { tituloId: i.titulo.id, disputaStatus: i.caso.disputa_status, disputaValor: i.caso.disputa_valor } : null, prometido: i.promessaFalta, emNegociacao: i.emNegociacao })), a.hoje)
  // aging dos títulos que passam nos filtros (inclui a faixa "a vencer" do mesmo cliente/fornecedor)
  const ids = new Set([...receber, ...pagar].map((i) => i.titulo.id))
  const doAging = (l: M.Titulo[]) => l.filter((t) => ids.has(t.id) || (f.faixa < 0 && f.situacao === 'todas' && casaBusca(t, f.busca.trim()) && t.vencimento >= a.hoje))
  return {
    receber, pagar, totalReceber, totalPagar, diferenca: Math.round((totalReceber - totalPagar) * 100) / 100,
    recuperado, taxaRecuperacao: recuperado + totalReceber > 0 ? Math.round((recuperado / (recuperado + totalReceber)) * 1000) / 10 : null,
    // valor em risco = saldo incontroverso × risco/1000 de quem tem score; quem não tem histórico fica à parte
    valorEmRisco: soma(comScore, (i) => i.disputa.incontroverso * (i.risco.score! / 1000)),
    semScore: soma(receber.filter((i) => i.risco.score == null), (i) => i.saldo), qtdSemScore: receber.length - comScore.length,
    promessasPendentes: promessas.length, valorPrometido: soma(promessas, (i) => i.promessaFalta),
    promessasDescumpridas: receber.filter((i) => i.promessa === 'descumprida').length,
    disputasAbertas: disputas.length, valorContestado: soma(disputas, (i) => i.disputa.contestado),
    previsao, agingReceber: M.aging(doAging(a.titulosReceber), a.hoje, a.limites, a.legais), agingPagar: M.aging(doAging(a.titulosPagar), a.hoje, a.limites, a.legais),
  }
}
