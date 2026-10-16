// AXIOMA VOICE INTELLIGENCE — Fase 2: texto da resposta → texto para FALAR (navegador e servidor).
// Sem dependências: tira markdown, emoji e símbolos que a voz leria em voz alta ("asterisco", "cerquilha"),
// e junta a ressalva fixa quando o motor avisou que algum valor não foi conferido.
import { numerosParaFala } from './numerosFala'

export type IdiomaFala = 'pt' | 'en' | 'es'
export const MAX_CARACTERES_FALA = 3800 // ~4 min de fala (OpenAI aceita até 4096 com a ressalva); resposta maior é cortada no fim de uma frase

const RESSALVA: Record<IdiomaFala, string> = {
  pt: 'Atenção: algum valor desta resposta não pôde ser conferido nos seus dados. Confira na tela antes de decidir.',
  en: 'Note: some amount in this answer could not be checked against your data. Check it on screen before deciding.',
  es: 'Atención: algún valor de esta respuesta no pudo verificarse con sus datos. Revíselo en pantalla antes de decidir.',
}

// Tom de diretor em reunião com o dono (pedido do Elias 2026-10-16): chama pelo nome, diz de onde veio a
// resposta e fecha se colocando à disposição. Sem "senhor/senhora": o gênero não é deduzido do nome.
const ABERTURA: Record<IdiomaFala, (nome: string) => string> = {
  pt: (n) => `${n ? `${n}, conforme` : 'Conforme'} a sua pergunta, analisei os dados da empresa e preparei a seguinte resposta.`,
  en: (n) => `${n ? `${n}, regarding` : 'Regarding'} your question, I have analyzed the company's data and prepared the following answer.`,
  es: (n) => `${n ? `${n}, conforme a` : 'Conforme a'} su pregunta, analicé los datos de la empresa y preparé la siguiente respuesta.`,
}
const FECHAMENTO: Record<IdiomaFala, string> = {
  pt: 'Fico à disposição para aprofundar qualquer ponto.',
  en: 'I remain at your disposal to go deeper into any point.',
  es: 'Quedo a su disposición para profundizar en cualquier punto.',
}
// Primeiro nome limpo (só letras), ou vazio — nunca prefixo de e-mail
export function primeiroNome(nome: unknown): string {
  const p = String(nome ?? '').trim().split(/\s+/)[0] ?? ''
  if (!/^[\p{L}'-]{2,30}$/u.test(p)) return ''
  return p.charAt(0).toLocaleUpperCase() + p.slice(1).toLocaleLowerCase()
}

export function textoParaFala(texto: string, lang: IdiomaFala, ressalva = false, nome?: string | null): string {
  let t = numerosParaFala(String(texto ?? ''), lang)      // dinheiro por extenso ANTES de tudo (o ponto de milhar não pode virar pausa)
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
  if (!t) return ''
  if (nome !== undefined) t = `${ABERTURA[lang](primeiroNome(nome))} ${t}` // undefined = sem abertura (testes/uso interno)
  if (ressalva) t = `${t} ${RESSALVA[lang]}`
  return nome !== undefined ? `${t} ${FECHAMENTO[lang]}` : t
}

// Frases curtas (a voz do navegador corta falas longas no Chrome; em frases ela não para no meio)
export function dividirEmFrases(texto: string, max = 220): string[] {
  // Só corta em ponto seguido de espaço: "59.000" nunca é fim de frase
  const partes = texto.split(/(?<=[.!?])\s+/)
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
