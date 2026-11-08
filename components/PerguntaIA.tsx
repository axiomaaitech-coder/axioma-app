'use client'
// Card "Pergunte à IA" das telas do RH: a moldura (card creme + efeito) em volta do chat completo da Inteligência
// Axioma (components/ChatInteligencia): conversa com histórico, microfone para ditar, Ouvir, conversa ao vivo e
// Memória da IA — a mesma experiência do José/IAs. Passa pelo motor central; a tela só diz quem ela é.
import { CanvasBox } from './CanvasBox'
import ChatInteligencia from './ChatInteligencia'

type Lang = 'pt' | 'en' | 'es'
export function PerguntaIA({ tela, empresaId, lang, temaClaro, titulo, sugestoes, contexto }: {
  tela: 'rh'; empresaId: string | null; lang: Lang; temaClaro: boolean; titulo: string; sugestoes: string[]; contexto?: () => string
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  return (
    <CanvasBox cor={temaClaro ? '#0f7a5a' : '#2ecc9b'} {...(temaClaro ? { fundo: '#f6f7c4', premium3d: true } : { premium3d: true })}>
      <ChatInteligencia tela={tela} empresaId={empresaId} lang={lang} claro={temaClaro} titulo={titulo} sugestoes={sugestoes}
        placeholder={L('Escreva ou fale sua pergunta', 'Type or say your question', 'Escriba o diga su pregunta')} contexto={contexto ?? (() => '')} />
      <p className="text-xs mt-2" style={{ color: temaClaro ? '#374151' : 'var(--axi-text-secondary)' }}>{L('A IA só lê o que você tem liberação para ver, nunca fala CPF, endereço, saúde ou salário de uma pessoa, e mostra de onde veio cada número.', 'The AI only reads what you are allowed to see, never says a person\'s ID, address, health or salary, and shows where each number came from.', 'La IA solo lee lo que usted puede ver, nunca dice el CPF, la dirección, la salud ni el salario de una persona, y muestra de dónde vino cada número.')}</p>
    </CanvasBox>
  )
}
