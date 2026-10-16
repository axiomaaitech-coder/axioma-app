// ═══════════════════════════════════════════════════════════════
// MOTOR TEMPORAL do Axioma (Plano 3, Tarefa 1 — 2026-10-16). Puro e determinístico (testado em
// scripts/check-financeiro.mts). Datas sempre AAAA-MM-DD no FUSO DA EMPRESA ("hoje" vem de hojeISO(fuso));
// intervalos sempre FECHADOS [inicio, fim] (os dois dias entram). Semana = segunda a domingo (padrão
// brasileiro de calendário comercial). "Esta semana" nunca vira 30 dias; período corrigido = novo cálculo.
// ═══════════════════════════════════════════════════════════════
import { somarDiasISO, somarMesesISO } from '../datas'

export type NomePeriodo =
  | 'hoje' | 'ontem' | 'esta_semana' | 'semana_anterior' | 'ultimos_7_dias' | 'proximos_7_dias' | 'proximos_30_dias'
  | 'este_mes' | 'mes_anterior' | 'ultimos_30_dias' | 'este_trimestre' | 'trimestre_anterior'
  | 'este_ano' | 'ano_anterior' | 'ultimos_12_meses' | 'personalizado' | 'tudo'
export const NOMES_PERIODO: NomePeriodo[] = ['hoje', 'ontem', 'esta_semana', 'semana_anterior', 'ultimos_7_dias', 'proximos_7_dias', 'proximos_30_dias', 'este_mes', 'mes_anterior', 'ultimos_30_dias', 'este_trimestre', 'trimestre_anterior', 'este_ano', 'ano_anterior', 'ultimos_12_meses', 'personalizado', 'tudo']
export type Periodo = { nome: NomePeriodo; inicio: string; fim: string; rotulo: string; dias: number; parcial: boolean }

const ISO = /^\d{4}-\d{2}-\d{2}$/
const valido = (d: string) => ISO.test(d) && !Number.isNaN(Date.parse(`${d}T12:00:00Z`)) && new Date(`${d}T12:00:00Z`).toISOString().slice(0, 10) === d
export const diasEntre = (inicio: string, fim: string) => Math.round((Date.parse(`${fim}T12:00:00Z`) - Date.parse(`${inicio}T12:00:00Z`)) / 86400000) + 1
const diaSemana = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay() // 0 = domingo
const segunda = (d: string) => somarDiasISO(d, -((diaSemana(d) + 6) % 7))
const primeiroDoMes = (d: string) => `${d.slice(0, 7)}-01`
const ultimoDoMes = (d: string) => somarDiasISO(somarMesesISO(primeiroDoMes(d), 1), -1)
const fmt = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`

// `parcial` = o período ainda não terminou (inclui dias futuros): o valor dele não é comparável a um período fechado
function montar(nome: NomePeriodo, inicio: string, fim: string, hoje: string, rotulo: string): Periodo {
  return { nome, inicio, fim, rotulo: `${rotulo} (${fmt(inicio)} a ${fmt(fim)})`, dias: diasEntre(inicio, fim), parcial: fim > hoje && inicio <= hoje }
}

export function resolverPeriodo(nome: string, hoje: string, personalizado?: { inicio?: string; fim?: string }): Periodo | { erro: string } {
  if (!valido(hoje)) return { erro: 'data de hoje inválida' }
  switch (nome as NomePeriodo) {
    case 'hoje': return montar('hoje', hoje, hoje, hoje, 'hoje')
    case 'ontem': { const o = somarDiasISO(hoje, -1); return montar('ontem', o, o, hoje, 'ontem') }
    case 'esta_semana': { const s = segunda(hoje); return montar('esta_semana', s, somarDiasISO(s, 6), hoje, 'esta semana') }
    case 'semana_anterior': { const s = somarDiasISO(segunda(hoje), -7); return montar('semana_anterior', s, somarDiasISO(s, 6), hoje, 'semana anterior') }
    case 'ultimos_7_dias': return montar('ultimos_7_dias', somarDiasISO(hoje, -6), hoje, hoje, 'últimos 7 dias')
    case 'proximos_7_dias': return montar('proximos_7_dias', hoje, somarDiasISO(hoje, 6), hoje, 'próximos 7 dias')
    case 'proximos_30_dias': return montar('proximos_30_dias', hoje, somarDiasISO(hoje, 29), hoje, 'próximos 30 dias')
    case 'este_mes': return montar('este_mes', primeiroDoMes(hoje), ultimoDoMes(hoje), hoje, 'este mês')
    case 'mes_anterior': { const p = primeiroDoMes(somarMesesISO(primeiroDoMes(hoje), -1)); return montar('mes_anterior', p, ultimoDoMes(p), hoje, 'mês anterior') }
    case 'ultimos_30_dias': return montar('ultimos_30_dias', somarDiasISO(hoje, -29), hoje, hoje, 'últimos 30 dias')
    case 'este_trimestre': case 'trimestre_anterior': {
      const m = Number(hoje.slice(5, 7)), a = Number(hoje.slice(0, 4))
      let q = Math.floor((m - 1) / 3), ano = a
      if (nome === 'trimestre_anterior') { q -= 1; if (q < 0) { q = 3; ano -= 1 } }
      const ini = `${ano}-${String(q * 3 + 1).padStart(2, '0')}-01`
      return montar(nome as NomePeriodo, ini, ultimoDoMes(somarMesesISO(ini, 2)), hoje, `${q + 1}º trimestre de ${ano}`)
    }
    case 'este_ano': return montar('este_ano', `${hoje.slice(0, 4)}-01-01`, `${hoje.slice(0, 4)}-12-31`, hoje, `ano de ${hoje.slice(0, 4)}`)
    case 'ano_anterior': { const a = Number(hoje.slice(0, 4)) - 1; return montar('ano_anterior', `${a}-01-01`, `${a}-12-31`, hoje, `ano de ${a}`) }
    case 'ultimos_12_meses': return montar('ultimos_12_meses', primeiroDoMes(somarMesesISO(primeiroDoMes(hoje), -11)), ultimoDoMes(hoje), hoje, 'últimos 12 meses')
    case 'tudo': return montar('tudo', '1900-01-01', '2999-12-31', hoje, 'todo o histórico')
    case 'personalizado': {
      const ini = String(personalizado?.inicio ?? ''), fim = String(personalizado?.fim ?? '')
      if (!valido(ini) || !valido(fim)) return { erro: 'período personalizado precisa de início e fim no formato AAAA-MM-DD' }
      if (fim < ini) return { erro: 'o fim do período é anterior ao início' }
      if (diasEntre(ini, fim) > 3660) return { erro: 'período maior que 10 anos' }
      return montar('personalizado', ini, fim, hoje, 'período escolhido')
    }
    default: return { erro: `período desconhecido: ${nome}` }
  }
}

// Período equivalente anterior para comparação: mês → mês anterior inteiro; ano → ano anterior;
// semana → semana anterior; trimestre → trimestre anterior; demais → mesmo número de dias logo antes.
// Período corrente PARCIAL é comparado com o mesmo trecho do anterior (ex.: 1–16/10 × 1–16/09).
export function periodoAnterior(p: Periodo, hoje: string): Periodo {
  const fimEfetivo = p.parcial ? hoje : p.fim
  const mesmoMes = p.inicio.slice(8) === '01' && (p.fim === ultimoDoMes(p.fim) || p.parcial)
  if (['este_mes', 'mes_anterior', 'este_trimestre', 'trimestre_anterior', 'este_ano', 'ano_anterior', 'ultimos_12_meses'].includes(p.nome) || (p.nome === 'personalizado' && mesmoMes)) {
    const meses = p.nome.includes('ano') ? 12 : p.nome.includes('trimestre') ? 3 : p.nome === 'ultimos_12_meses' ? 12 : Math.max(1, Math.round(diasEntre(p.inicio, p.fim) / 30.44))
    const ini = somarMesesISO(p.inicio, -meses)
    const fim = p.parcial ? somarMesesISO(fimEfetivo, -meses) : somarDiasISO(somarMesesISO(somarDiasISO(p.fim, 1), -meses), -1)
    return montar('personalizado', ini, fim, hoje, 'período anterior equivalente')
  }
  const dias = diasEntre(p.inicio, fimEfetivo)
  const fim = somarDiasISO(p.inicio, -1)
  return montar('personalizado', somarDiasISO(fim, -(dias - 1)), fim, hoje, 'período anterior equivalente')
}

// Agrupamento de uma data em balde: dia, semana (segunda), mês ou ano
export type Granularidade = 'dia' | 'semana' | 'mes' | 'ano'
export function balde(data: string, g: Granularidade): string {
  if (g === 'dia') return data
  if (g === 'semana') return segunda(data)
  if (g === 'mes') return data.slice(0, 7)
  return data.slice(0, 4)
}
export const dentro = (data: string | null | undefined, p: { inicio: string; fim: string }) => !!data && data >= p.inicio && data <= p.fim
