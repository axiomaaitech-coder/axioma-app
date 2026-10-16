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

// assinatura: só respostas do motor podem ser lidas em voz (/api/voz/falar confere)
export async function perguntarAoAxioma(p: PerguntaAxioma): Promise<{ resposta: string; nivel: string; assinatura?: string; ressalva?: boolean } | null> {
  if (!p.empresaId || !p.pergunta.trim()) return null
  try {
    const res = await fetch('/api/ia/motor', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta: p.pergunta, empresa_id: p.empresaId, tela: p.tela, lang: p.lang ?? 'pt', historico: p.historico ?? [], contexto_tela: p.contextoTela }),
    })
    const json = await res.json().catch(() => null)
    // Saldo de IA acabou: a tela mostra o aviso (no idioma) no lugar da resposta, em vez de cair calada nas regras.
    if (res.status === 402 && typeof json?.mensagem === 'string') return { resposta: json.mensagem, nivel: 'sem_saldo' }
    // Operador de caixa: aviso de acesso no lugar de uma análise sobre dados que ele não enxerga.
    if (res.status === 403 && typeof json?.mensagem === 'string') return { resposta: json.mensagem, nivel: 'sem_acesso' }
    if (!res.ok) return null
    // Sem .trim() na resposta assinada: a assinatura vale para o texto exato do motor
    return typeof json?.resposta === 'string' && json.resposta.trim() ? { resposta: json.resposta, nivel: String(json.nivel ?? ''), assinatura: typeof json.assinatura === 'string' ? json.assinatura : undefined, ressalva: Number(json?.verificacao?.nao_conferidos ?? 0) > 0 } : null
  } catch {
    return null
  }
}
