// AXIOMA VOICE INTELLIGENCE — Fase 2: texto da resposta → texto para FALAR (navegador e servidor).
// Sem dependências: tira markdown, emoji e símbolos que a voz leria em voz alta ("asterisco", "cerquilha"),
// e junta a ressalva fixa quando o motor avisou que algum valor não foi conferido.
export type IdiomaFala = 'pt' | 'en' | 'es'
export const MAX_CARACTERES_FALA = 3800 // ~4 min de fala (OpenAI aceita até 4096 com a ressalva); resposta maior é cortada no fim de uma frase

const RESSALVA: Record<IdiomaFala, string> = {
  pt: 'Atenção: algum valor desta resposta não pôde ser conferido nos seus dados. Confira na tela antes de decidir.',
  en: 'Note: some amount in this answer could not be checked against your data. Check it on screen before deciding.',
  es: 'Atención: algún valor de esta respuesta no pudo verificarse con sus datos. Revíselo en pantalla antes de decidir.',
}

export function textoParaFala(texto: string, lang: IdiomaFala, ressalva = false): string {
  let t = String(texto ?? '')
    .replace(/```[\s\S]*?```/g, ' ')                      // bloco de código: não se lê
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')                // imagem
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')              // link: lê só o nome
    .replace(/https?:\/\/\S+/g, ' ')                      // endereço solto
    // [ \t] e não \s: \s pularia a quebra de linha e juntaria as linhas sem pausa
    .replace(/^[ \t]{0,3}#{1,6}[ \t]*/gm, '')             // títulos
    .replace(/^[ \t]*(?:[-*+•]|\d+[.)])[ \t]+/gm, '')     // marcadores de lista
    .replace(/^[ \t]*\|?[ \t:]*-{2,}[-:| \t]*$/gm, '')    // linha separadora de tabela
    .replace(/\|/g, ', ')                                 // células de tabela
    .replace(/[*_~`>#]+/g, '')                            // negrito/itálico/citação
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '') // emoji
    .replace(/[ \t]*\n[\s,]*/g, '. ')                     // cada linha (título, item) vira uma pausa
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.!?:;,])(\s*[.,])+/g, '$1')               // não dobra pontuação ("Caixa:." → "Caixa:")
    .replace(/^[\s.,]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  if (t.length > MAX_CARACTERES_FALA) {
    const corte = t.slice(0, MAX_CARACTERES_FALA)
    const fim = Math.max(corte.lastIndexOf('. '), corte.lastIndexOf('? '), corte.lastIndexOf('! '))
    t = fim > MAX_CARACTERES_FALA / 2 ? corte.slice(0, fim + 1) : corte
  }
  return ressalva && t ? `${t} ${RESSALVA[lang]}` : t
}

// Frases curtas (a voz do navegador corta falas longas no Chrome; em frases ela não para no meio)
export function dividirEmFrases(texto: string, max = 220): string[] {
  const partes = texto.match(/[^.!?]+[.!?]*\s*/g) ?? [texto]
  const out: string[] = []
  for (const p of partes) {
    const s = p.trim()
    if (!s) continue
    if (s.length <= max) { out.push(s); continue }
    let resto = s
    while (resto.length > max) {
      const i = resto.lastIndexOf(', ', max)
      const n = i > max / 3 ? i + 1 : max
      out.push(resto.slice(0, n).trim()); resto = resto.slice(n)
    }
    if (resto.trim()) out.push(resto.trim())
  }
  return out
}
