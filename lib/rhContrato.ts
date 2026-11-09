// Contrato que vale para a pessoa: o de admissão mais recente. Arquivo próprio para não criar volta de dependência
// (rhIA ↔ rhCustoPessoal ↔ rhSimulacao) — scripts/check-ciclos.mjs barra a publicação se houver.
export function contratoAtual<K extends { colaborador_id: string; data_admissao: string }>(contratos: K[]): Map<string, K> {
  const m = new Map<string, K>()
  for (const k of [...contratos].sort((a, b) => b.data_admissao.localeCompare(a.data_admissao))) if (!m.has(k.colaborador_id)) m.set(k.colaborador_id, k)
  return m
}
