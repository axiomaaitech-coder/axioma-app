// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — lado da TELA. Única forma de uma tela do Axioma falar com a
// IA (docs/MOTOR-IA.md). A tela manda só a pergunta, a empresa e, se quiser,
// os números/formato dela; o motor decide nível, provedor e modelo (trava).
// Nunca lança: falha (sem empresa, rede, motor fora) = null → a tela usa as
// respostas por regras que já tem.
// ═══════════════════════════════════════════════════════════════

export type PerguntaAxioma = {
  pergunta: string
  empresaId: string | null | undefined
  tela: string
  lang?: 'pt' | 'en' | 'es'
  historico?: { role: string; content: string }[] // o motor descarta no servidor qualquer papel que não seja user/assistant
  contextoTela?: string
}

export async function perguntarAoAxioma(p: PerguntaAxioma): Promise<{ resposta: string; nivel: string } | null> {
  if (!p.empresaId || !p.pergunta.trim()) return null
  try {
    const res = await fetch('/api/ia/motor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: p.pergunta, empresa_id: p.empresaId, tela: p.tela, lang: p.lang ?? 'pt', historico: p.historico ?? [], contexto_tela: p.contextoTela }),
    })
    if (!res.ok) return null
    const json = await res.json().catch(() => null)
    return typeof json?.resposta === 'string' && json.resposta.trim() ? { resposta: json.resposta.trim(), nivel: String(json.nivel ?? '') } : null
  } catch {
    return null
  }
}
