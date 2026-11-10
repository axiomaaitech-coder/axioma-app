// ═══════════════════════════════════════════════════════════════
// RH · Controle de férias (2026-11-09, item 6 do plano). Puro e testável. Regras da CLT conferidas no Planalto (09/11/2026):
//   art. 130  dias pelo nº de faltas injustificadas no período aquisitivo: ≤5 → 30; 6–14 → 24; 15–23 → 18; 24–32 → 12; >32 → 0
//   art. 134  concedidas nos 12 meses seguintes ao período aquisitivo (período concessivo)
//   art. 134 § 1º  até 3 partes: uma com 14 dias ou mais e as outras com 5 ou mais
//   art. 134 § 3º  vedado começar nos 2 dias antes de feriado ou do descanso semanal (aviso: sexta e sábado, se o descanso é domingo)
//   art. 135  aviso por escrito com 30 dias de antecedência
//   art. 137  dias concedidos depois do período concessivo são pagos em dobro
//   art. 143  abono pecuniário: vender até 1/3 do período
//   art. 145  pagamento até 2 dias antes do início
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'

export type ParteFerias = { id?: string; aquisitivo_inicio: string; gozo_inicio: string; dias: number; abono_dias: number; faltas_periodo?: number | null }
const somaDias = (iso: string, n: number) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)
const somaAnos = (iso: string, n: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCFullYear(d.getUTCFullYear() + n); return d.toISOString().slice(0, 10) }
const entre = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000)

export function diasPorFaltas(faltas: number | null | undefined): number {
  const f = Number(faltas) || 0
  return f <= 5 ? 30 : f <= 14 ? 24 : f <= 23 ? 18 : f <= 32 ? 12 : 0
}

export type StatusPeriodo = 'em_aquisicao' | 'a_conceder' | 'quitado' | 'vencida'
export type Periodo = {
  aquisitivo_inicio: string; aquisitivo_fim: string; concessivo_fim: string; direito: number; usados: number; saldo: number
  status: StatusPeriodo; dias_para_vencer: number | null; dias_em_dobro: number; partes: (ParteFerias & { fim: string; pagamento_ate: string; em_dobro: number })[]
}

// Períodos aquisitivos desde a admissão até hoje (ou o desligamento), com o que já foi programado/gozado em cada um.
export function periodosFerias(p: { dataAdmissao: string; hoje: string; dataDesligamento?: string | null; partes: ParteFerias[] }): Periodo[] {
  const limite = p.dataDesligamento && p.dataDesligamento < p.hoje ? p.dataDesligamento : p.hoje
  const out: Periodo[] = []
  for (let n = 0; n < 60; n++) {
    const ini = somaAnos(p.dataAdmissao, n)
    if (ini > limite) break
    const fim = somaDias(somaAnos(p.dataAdmissao, n + 1), -1)
    const concessivoFim = somaDias(somaAnos(p.dataAdmissao, n + 2), -1)
    const partes = p.partes.filter((x) => x.aquisitivo_inicio === ini).sort((a, b) => a.gozo_inicio.localeCompare(b.gozo_inicio))
    const faltas = partes.reduce((m, x) => Math.max(m, Number(x.faltas_periodo) || 0), 0)
    const direito = diasPorFaltas(faltas)
    const usados = partes.reduce((s, x) => s + x.dias + x.abono_dias, 0)
    const saldo = Math.max(0, direito - usados)
    const partesInfo = partes.map((x) => {
      const fimGozo = somaDias(x.gozo_inicio, x.dias - 1)
      // art. 137: só os dias que caem depois do período concessivo são pagos em dobro
      const emDobro = x.gozo_inicio > concessivoFim ? x.dias : fimGozo > concessivoFim ? entre(concessivoFim, fimGozo) : 0
      return { ...x, fim: fimGozo, pagamento_ate: somaDias(x.gozo_inicio, -2), em_dobro: emDobro }
    })
    const status: StatusPeriodo = fim >= p.hoje ? 'em_aquisicao' : saldo === 0 ? 'quitado' : p.hoje > concessivoFim ? 'vencida' : 'a_conceder'
    out.push({ aquisitivo_inicio: ini, aquisitivo_fim: fim, concessivo_fim: concessivoFim, direito, usados, saldo, status,
      dias_para_vencer: status === 'a_conceder' ? entre(p.hoje, concessivoFim) : null,
      dias_em_dobro: partesInfo.reduce((s, x) => s + x.em_dobro, 0) + (status === 'vencida' ? saldo : 0), partes: partesInfo })
  }
  return out
}

// Custo extra da dobra (art. 137): mais uma remuneração dos dias em dobro, com o 1/3 — salário ÷ 30 × dias × 4/3.
export const valorDobra = (salarioMensal: number, dias: number) => reais(Math.round((centavos(salarioMensal) * dias * 4) / 3 / 30))
// Remuneração das férias pagas até 2 dias antes (art. 145): (dias + abono) × salário ÷ 30 × 4/3. Sem médias de variáveis.
export const valorFerias = (salarioMensal: number, dias: number, abono: number) => reais(Math.round((centavos(salarioMensal) * (dias + abono) * 4) / 3 / 30))

// Confere uma parte nova (ou editada) antes de gravar. erros impedem; avisos só informam.
export function conferirParte(periodo: Periodo, nova: ParteFerias, hoje: string): { erros: string[]; avisos: string[] } {
  const erros: string[] = [], avisos: string[] = []
  const outras = periodo.partes.filter((x) => !nova.id || x.id !== nova.id)
  const direito = diasPorFaltas(Math.max(Number(nova.faltas_periodo) || 0, ...outras.map((x) => Number(x.faltas_periodo) || 0)))
  const usadosOutras = outras.reduce((s, x) => s + x.dias + x.abono_dias, 0)
  if (direito === 0) erros.push('mais de 32 faltas no período: não há direito a férias (CLT art. 130)')
  if (nova.dias < 5) erros.push('nenhuma parte pode ter menos de 5 dias (CLT art. 134 § 1º)')
  if (nova.gozo_inicio <= periodo.aquisitivo_fim) erros.push(`só depois de completar o período aquisitivo, a partir de ${somaDias(periodo.aquisitivo_fim, 1).split('-').reverse().join('/')} (CLT art. 134)`)
  if (usadosOutras + nova.dias + nova.abono_dias > direito) erros.push(`passa do direito do período: ${direito} dias, já usados ${usadosOutras}`)
  const abonoTotal = outras.reduce((s, x) => s + x.abono_dias, 0) + nova.abono_dias
  if (abonoTotal > Math.floor(direito / 3)) erros.push(`o abono vendido pode ser no máximo 1/3 do período: ${Math.floor(direito / 3)} dias (CLT art. 143)`)
  const partes = [...outras.map((x) => x.dias), nova.dias]
  if (partes.length > 3) erros.push('as férias podem ser divididas em no máximo 3 partes (CLT art. 134 § 1º)')
  const restante = direito - usadosOutras - nova.dias - nova.abono_dias
  // ainda tem de ser possível ter uma parte de 14 dias ou mais
  if (!partes.some((d) => d >= 14) && !(partes.length < 3 && restante >= 14)) erros.push('uma das partes precisa ter 14 dias ou mais (CLT art. 134 § 1º)')
  const fimNova = somaDias(nova.gozo_inicio, nova.dias - 1)
  for (const x of outras) if (nova.gozo_inicio <= x.fim && fimNova >= x.gozo_inicio) erros.push(`coincide com outra parte (${x.gozo_inicio.split('-').reverse().join('/')})`)
  if (fimNova > periodo.concessivo_fim) avisos.push(`termina depois de ${periodo.concessivo_fim.split('-').reverse().join('/')} (fim do prazo): os dias fora do prazo são pagos em dobro (CLT art. 137)`)
  const w = new Date(`${nova.gozo_inicio}T12:00:00Z`).getUTCDay()
  if (w === 5 || w === 6) avisos.push('começa na sexta ou no sábado: é proibido iniciar nos 2 dias antes do descanso semanal (CLT art. 134 § 3º) — se o descanso da pessoa é domingo, mude a data')
  if (entre(hoje, nova.gozo_inicio) < 30) avisos.push('menos de 30 dias até o início: o aviso de férias deve ser dado por escrito com 30 dias (CLT art. 135)')
  return { erros, avisos }
}
