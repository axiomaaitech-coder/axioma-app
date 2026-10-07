// Régua de atualidade do Nexus, compartilhada entre a ingestão (grava) e a
// tela (recalcula na leitura — o valor gravado só vale no dia da coleta; se o
// cron parar, a tela precisa mostrar "desatualizado" sozinha, nunca congelar
// em "atualizado hoje").
import { agora } from "./datas";

export type FreshnessStatus = "live" | "fresh" | "recent" | "stale" | "expired" | "unknown"

export function calcularFreshness(dataReferenciaISO: string, frequencia: string | null, hoje = new Date(agora())): FreshnessStatus {
  let ref = new Date(`${dataReferenciaISO}T00:00:00Z`)
  if (Number.isNaN(ref.getTime())) return "unknown"
  // Série mensal: o mês de referência só termina no último dia (o BCB grava "01/08" pro
  // IPCA de agosto inteiro). Medir a partir do dia 1 marcava como "desatualizado" o
  // último dado que o IBGE já tinha divulgado — a régua conta a partir do fim do mês.
  if (frequencia === "mensal" || frequencia === "mensal_defasada") ref = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 0))
  let dias = Math.floor((Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) - ref.getTime()) / 86400000)
  const ehDiaria = frequencia === "diaria" || frequencia === "event_driven"
  if (ehDiaria) {
    if (dias <= 1) return "live"
    if (dias <= 3) return "fresh"
    if (dias <= 7) return "recent"
    if (dias <= 30) return "stale"
    return "expired"
  }
  // semanal (ANP): pesquisa de domingo a sábado, publicada na semana seguinte.
  if (frequencia === "semanal") {
    if (dias <= 9) return "live"
    if (dias <= 16) return "recent"
    if (dias <= 30) return "stale"
    return "expired"
  }
  // anual (Banco Mundial): o dado de um ano sai só no meio do ano seguinte —
  // referência de até ~2 anos atrás ainda é o mais recente disponível.
  if (frequencia === "anual") {
    if (dias <= 730) return "live"
    if (dias <= 1095) return "recent"
    return "stale"
  }
  // mensal_defasada: mesma régua da mensal, deslocada pelo atraso normal de
  // publicação (~60 dias) — o dado mais novo que existe nunca aparece como
  // "desatualizado".
  if (frequencia === "mensal_defasada") dias -= 60
  if (dias <= 35) return "live"
  if (dias <= 45) return "fresh"
  if (dias <= 60) return "recent"
  if (dias <= 90) return "stale"
  return "expired"
}

// Saúde de uma fonte (painel "Saúde das fontes"): o cron roda 1x/dia, então
// até 36h sem sucesso ainda é normal. Falha mais nova que o último sucesso =
// a última tentativa quebrou (amanhã o cron tenta de novo sozinho).
export type SaudeFonte = "ok" | "falhou" | "parada" | "nunca" | "desligada"

export function calcularSaudeFonte(ativa: boolean, ultimoSucesso: string | null, ultimaFalha: string | null, agora = new Date()): SaudeFonte {
  if (!ativa) return "desligada"
  if (!ultimoSucesso) return ultimaFalha ? "falhou" : "nunca"
  const ok = new Date(ultimoSucesso).getTime()
  if (ultimaFalha && new Date(ultimaFalha).getTime() > ok) return "falhou"
  return agora.getTime() - ok <= 36 * 3600000 ? "ok" : "parada"
}

// ─── Nota de confiança da fonte (0-100), recalculada a cada coleta ───
// autoridade (quem publica) 50% + atualidade (última coleta boa) 30% +
// consistência (bate com outra fonte oficial?) 20%. Sem 2ª fonte pra
// comparar, consistência neutra (80). Grava nas colunas *_score de nexus_source.
const AUTORIDADE: Record<string, number> = {
  central_bank: 95, statistics_api: 95, government_api: 90, regulatory_source: 90,
  international_org: 90, public_dataset: 85, news_source: 60,
}
export type ConfiancaFonte = { nota: number; autoridade: number; atualidade: number; consistencia: number }

export function calcularConfiancaFonte(
  tipo: string, ultimoSucesso: string | null, ultimaFalha: string | null, concordancia: number | null = null, agora = new Date(),
): ConfiancaFonte {
  const autoridade = AUTORIDADE[tipo] ?? 70
  const horas = ultimoSucesso ? (agora.getTime() - new Date(ultimoSucesso).getTime()) / 3600000 : Infinity
  let atualidade = horas <= 36 ? 100 : horas <= 72 ? 70 : horas <= 168 ? 40 : ultimoSucesso ? 10 : 0
  if (ultimaFalha && (!ultimoSucesso || new Date(ultimaFalha) > new Date(ultimoSucesso))) atualidade = Math.max(0, atualidade - 30)
  const consistencia = concordancia ?? 80
  return { nota: Math.round(autoridade * 0.5 + atualidade * 0.3 + consistencia * 0.2), autoridade, atualidade, consistencia }
}

// Diferença entre o mesmo dado em duas fontes oficiais → nota de consistência.
export const concordanciaPct = (a: number, b: number) => {
  const dif = Math.abs(a - b) / Math.abs(b) * 100
  return dif <= 0.5 ? 100 : dif <= 1.5 ? 80 : 40
}

// ─── Pausa automática ───
// Fonte que funcionava e está fora há mais de 1 dia espera 6h entre
// tentativas — não martela quem limita pedidos, mas o Nexus (premium) nunca
// fica mais que algumas horas sem tentar recuperar o dado (decisão do Elias, 2026-09-28).
export const HORAS_PAUSA = 6
export function fonteEmPausa(ultimoSucesso: string | null, ultimaFalha: string | null, agora = new Date()): boolean {
  // Nunca funcionou = fonte nova ou corrigida agora: tenta em toda coleta (pausar
  // aqui travou a correção da OCDE em 2026-09-28).
  if (!ultimaFalha || !ultimoSucesso) return false
  const falhando = new Date(ultimaFalha) > new Date(ultimoSucesso)
  if (!falhando) return false
  if (agora.getTime() - new Date(ultimoSucesso).getTime() <= 86400000) return false
  return agora.getTime() - new Date(ultimaFalha).getTime() < HORAS_PAUSA * 3600000
}
