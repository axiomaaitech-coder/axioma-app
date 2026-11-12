// Filtro que chega pela URL vindo de outra tela (2026-11-12: cada item do Fechamento do mês leva à tela que resolve,
// já filtrada no mês e no que falta). Uma leitura só para todas as telas de destino.
import { ultimoDiaDoMes } from './datas'

export type FiltroDestino = { mes: string | null; semCategoria: boolean; de: string | null; novo: string | null }
const MES = /^\d{4}-(0[1-9]|1[0-2])$/

export function lerFiltroDestino(search: string = typeof window === 'undefined' ? '' : window.location.search): FiltroDestino {
  const p = new URLSearchParams(search)
  const mes = p.get('mes')
  return { mes: mes && MES.test(mes) ? mes : null, semCategoria: p.get('categoria') === 'sem', de: p.get('de'), novo: p.get('novo') }
}

export const periodoDoMes = (mes: string) => ({ inicio: `${mes}-01`, fim: ultimoDiaDoMes(mes) })

/** "outubro de 2026" no idioma da tela. */
export function nomeDoMes(mes: string, lang: 'pt' | 'en' | 'es'): string {
  const [a, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

/** Rota de destino de cada item do Fechamento do mês: tela de origem + mês + o recorte que falta conferir. */
export function rotaDoFechamento(base: string, mes: string, extra: Record<string, string> = {}): string {
  const [caminho, q] = base.split('?')
  const p = new URLSearchParams(q)
  p.set('mes', mes); p.set('de', 'fechamento')
  for (const [k, v] of Object.entries(extra)) p.set(k, v)
  return `${caminho}?${p.toString()}`
}

/** Tira os parâmetros do filtro da barra de endereço (o filtro fica na tela; recarregar não reaplica). */
export function limparFiltroDaUrl(manter: string[] = []) {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  for (const k of [...p.keys()]) if (!manter.includes(k)) p.delete(k)
  const q = p.toString()
  window.history.replaceState(null, '', window.location.pathname + (q ? `?${q}` : ''))
}
