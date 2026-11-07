// ═══════════════════════════════════════════════════════════════
// CONSOLIDAÇÃO das consultas de uma resposta (Central Intelligence). Não soma nada: confere o que voltou das portas.
// De quando é cada dado, de onde veio, se a moeda é a mesma e se dois módulos discordam sobre a mesma informação.
// Divergência não é resolvida escolhendo um valor: as duas fontes aparecem. Pura, sem banco e sem IA.
// ═══════════════════════════════════════════════════════════════
import type { Idioma } from './motor'

export type SaidaConsulta = { nome: string; saida: string }
export type Divergencia = { assunto: 'caixa' | 'pdv_maior_que_faturamento'; a: number; b: number; diferenca: number }
export type Consolidacao = {
  coleta: { de: string; ate: string; fontes: number } | null
  sem_origem: string[]; moedas: string[]; periodos: string[]; divergencias: Divergencia[]
}

type Lido = { indicador?: string; valor?: number | null; moeda?: string; fontes?: string[]; consultado_em?: string; origem?: { modulo: string; consultado_em: string }; negado?: boolean; erro?: string; estado?: string
  periodo?: { inicio: string; fim: string } | null; detalhes?: { caixa_realizado?: number | null; disponivel?: number | null } }

// Consulta antiga, de antes do contrato padrão, também sai com módulo e horário: nenhum número sem origem
export function comOrigem(saida: string, modulo: string | undefined, agora = () => new Date().toISOString()): string {
  try {
    const j = JSON.parse(saida) as Lido
    if (!j || typeof j !== 'object' || Array.isArray(j) || j.consultado_em || j.erro || !modulo) return saida
    return JSON.stringify({ ...j, origem: { modulo, consultado_em: agora() } })
  } catch { return saida }
}

const ler = (s: string): Lido | null => { try { const j = JSON.parse(s) as Lido; return j && typeof j === 'object' ? j : null } catch { return null } }
const TOLERANCIA = 0.01 // 1 centavo

export function consolidar(saidas: SaidaConsulta[]): Consolidacao {
  const lidos = saidas.map((s) => ({ nome: s.nome, j: ler(s.saida) }))
  const validos = lidos.filter((l) => l.j && !l.j.erro && !l.j.negado && l.j.estado !== 'erro')
  const horarios = validos.map((l) => l.j!.consultado_em ?? l.j!.origem?.consultado_em).filter((h): h is string => !!h).sort()
  const acharIndicador = (id: string) => validos.find((l) => l.j!.indicador === id)?.j

  const divergencias: Divergencia[] = []
  // Mesma pergunta ("quanto tem em caixa"), duas contas oficiais: Fluxo de Caixa (realizado) e Tesouraria (razão contábil)
  const realizado = acharIndicador('resumo_financeiro')?.detalhes?.caixa_realizado
  const posicao = acharIndicador('caixa_posicao')?.detalhes?.disponivel
  if (typeof realizado === 'number' && typeof posicao === 'number' && Math.abs(realizado - posicao) > TOLERANCIA) {
    divergencias.push({ assunto: 'caixa', a: realizado, b: posicao, diferenca: Math.round((posicao - realizado) * 100) / 100 })
  }
  // PDV é parte do faturamento: no mesmo período, nunca pode ser maior
  const fat = acharIndicador('faturamento_competencia'), pdv = acharIndicador('pdv_vendas')
  const mesmoPeriodo = fat?.periodo && pdv?.periodo && fat.periodo.inicio === pdv.periodo.inicio && fat.periodo.fim === pdv.periodo.fim
  if (mesmoPeriodo && typeof fat?.valor === 'number' && typeof pdv?.valor === 'number' && pdv.valor - fat.valor > TOLERANCIA) {
    divergencias.push({ assunto: 'pdv_maior_que_faturamento', a: pdv.valor, b: fat.valor, diferenca: Math.round((pdv.valor - fat.valor) * 100) / 100 })
  }

  return {
    coleta: horarios.length ? { de: horarios[0], ate: horarios[horarios.length - 1], fontes: horarios.length } : null,
    sem_origem: validos.filter((l) => !l.j!.fontes?.length && !l.j!.origem).map((l) => l.nome),
    moedas: [...new Set(validos.map((l) => l.j!.moeda).filter((m): m is string => !!m))],
    periodos: [...new Set(validos.map((l) => l.j!.periodo).filter((p): p is { inicio: string; fim: string } => !!p).map((p) => `${p.inicio}..${p.fim}`))],
    divergencias,
  }
}

const brl = (v: number, lang: Idioma) => `R$ ${v.toLocaleString(lang === 'en' ? 'en-US' : 'pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
// Aviso fixo, fora do texto do modelo: a pessoa vê as duas fontes mesmo que a resposta só cite uma
export function avisosDaConsolidacao(c: Consolidacao, lang: Idioma): string[] {
  const avisos = c.divergencias.map((d) => d.assunto === 'caixa'
    ? { pt: `Atenção: o caixa do Fluxo de Caixa (${brl(d.a, lang)}) e o da Tesouraria (${brl(d.b, lang)}) não batem. Confira em Conferência antes de decidir.`,
        en: `Note: cash in Cash Flow (${brl(d.a, lang)}) and in Treasury (${brl(d.b, lang)}) do not match. Check Reconciliation before deciding.`,
        es: `Atención: la caja del Flujo de Caja (${brl(d.a, lang)}) y la de Tesorería (${brl(d.b, lang)}) no coinciden. Revise Conciliación antes de decidir.` }[lang]
    : { pt: `Atenção: as vendas do PDV (${brl(d.a, lang)}) passam do faturamento (${brl(d.b, lang)}) no mesmo período. Confira em Conferência.`,
        en: `Note: POS sales (${brl(d.a, lang)}) exceed revenue (${brl(d.b, lang)}) in the same period. Check Reconciliation.`,
        es: `Atención: las ventas del PDV (${brl(d.a, lang)}) superan la facturación (${brl(d.b, lang)}) en el mismo período. Revise Conciliación.` }[lang])
  if (c.moedas.length > 1) avisos.push({ pt: 'Atenção: há valores em moedas diferentes; eles não foram somados.', en: 'Note: there are amounts in different currencies; they were not added together.', es: 'Atención: hay valores en monedas diferentes; no se sumaron.' }[lang])
  return avisos
}
