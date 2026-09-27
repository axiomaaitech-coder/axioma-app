// Régua de atualidade do Nexus, compartilhada entre a ingestão (grava) e a
// tela (recalcula na leitura — o valor gravado só vale no dia da coleta; se o
// cron parar, a tela precisa mostrar "desatualizado" sozinha, nunca congelar
// em "atualizado hoje").
export type FreshnessStatus = "live" | "fresh" | "recent" | "stale" | "expired" | "unknown"

export function calcularFreshness(dataReferenciaISO: string, frequencia: string | null, hoje = new Date()): FreshnessStatus {
  const ref = new Date(`${dataReferenciaISO}T00:00:00Z`)
  if (Number.isNaN(ref.getTime())) return "unknown"
  let dias = Math.floor((Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) - ref.getTime()) / 86400000)
  const ehDiaria = frequencia === "diaria" || frequencia === "event_driven"
  if (ehDiaria) {
    if (dias <= 1) return "live"
    if (dias <= 3) return "fresh"
    if (dias <= 7) return "recent"
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
