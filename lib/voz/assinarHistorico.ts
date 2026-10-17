// Voz única do José: pede ao servidor a assinatura das respostas ANTIGAS da IA (histórico salvo), para o
// botão Ouvir usar a voz do José também nelas. O servidor confere no banco (RLS) — ver app/api/voz/assinar.
// Falha = sem assinatura (o Ouvir simplesmente não aparece naquela resposta; nunca voz robótica).
type Linha = { id?: unknown; role?: unknown; mensagem?: unknown }
export async function assinarHistorico(tela: 'ia-financeira' | 'ia-tributaria' | 'conversa', empresaId: string | null | undefined, hist: Linha[]): Promise<Record<string, string>> {
  const ids = hist.filter((h) => h.role === 'assistant' && h.id != null).map((h) => String(h.id)).slice(-100)
  if (!empresaId || !ids.length) return {}
  try {
    const res = await fetch('/api/voz/assinar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: empresaId, tela, ids }) })
    const j = await res.json().catch(() => null)
    return res.ok && j?.assinaturas && typeof j.assinaturas === 'object' ? j.assinaturas as Record<string, string> : {}
  } catch { return {} }
}
