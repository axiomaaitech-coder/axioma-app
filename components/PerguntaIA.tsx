'use client'
// Caixa "Pergunte à IA" reaproveitável por qualquer tela. Passa pelo motor central (lib/ia/cliente → /api/ia/motor):
// a tela informa só quem ela é (`tela`); o motor escolhe o provedor (OpenAI fora das telas da Anthropic),
// abre só as portas daquela tela e confere os números. Sem resposta do motor, avisa — nunca inventa.
import { useState } from 'react'
import { Sparkles, Send } from 'lucide-react'
import { CanvasBox } from './CanvasBox'
import { perguntarAoAxioma } from '../lib/ia/cliente'
import { FONTE_EXEC } from '../lib/cfoCore'

type Lang = 'pt' | 'en' | 'es'
export function PerguntaIA({ tela, empresaId, lang, temaClaro, titulo, sugestoes }: {
  tela: string; empresaId: string | null; lang: Lang; temaClaro: boolean; titulo: string; sugestoes: string[]
}) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const [pergunta, setPergunta] = useState('')
  const [resposta, setResposta] = useState<string | null>(null)
  const [pensando, setPensando] = useState(false)
  const VERDE = temaClaro ? '#0f7a5a' : '#2ecc9b'
  const TEXTO_SEC = temaClaro ? '#374151' : 'var(--axi-text-secondary)'
  const BORDA = temaClaro ? 'rgba(16,27,61,0.12)' : 'rgba(163,177,194,0.15)'
  const BTN = temaClaro ? 'linear-gradient(135deg, #0b5f46, #0f7a5a)' : 'linear-gradient(135deg, #0a4f3b, #0f7d5c)'

  async function enviar(texto: string) {
    const q = texto.trim()
    if (!q || pensando) return
    setPergunta(q); setPensando(true); setResposta(null)
    const r = await perguntarAoAxioma({ pergunta: q, empresaId, tela, lang })
    setPensando(false)
    setResposta(r?.resposta ?? L('A IA não respondeu agora. Tente de novo em instantes — os números da tela continuam valendo.', 'The AI did not answer now. Try again shortly — the numbers on screen still apply.', 'La IA no respondió ahora. Intente de nuevo en instantes — los números de la pantalla siguen valiendo.'))
  }

  return (
    <CanvasBox cor={VERDE} {...(temaClaro ? { fundo: '#f6f7c4', premium3d: true } : { premium3d: true })}>
      <p className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: temaClaro ? '#101b3d' : 'var(--axi-text-primary)', ...FONTE_EXEC }}><Sparkles size={16} style={{ color: VERDE }} /> {titulo}</p>
      <form onSubmit={(e) => { e.preventDefault(); void enviar(pergunta) }} className="flex gap-2">
        <input aria-label={titulo} value={pergunta} onChange={(e) => setPergunta(e.target.value)} placeholder={L('Escreva sua pergunta', 'Type your question', 'Escriba su pregunta')}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: temaClaro ? '#ffffff' : 'rgba(10,22,40,0.9)', border: `1px solid ${BORDA}`, color: 'var(--axi-text-primary)' }} />
        <button type="submit" disabled={pensando} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold" style={{ background: pensando ? '#4b5563' : BTN, color: '#fff' }}>
          <Send size={15} /> {pensando ? L('Pensando…', 'Thinking…', 'Pensando…') : L('Perguntar', 'Ask', 'Preguntar')}
        </button>
      </form>
      <div className="flex flex-wrap gap-2 mt-3">
        {sugestoes.map((s) => (
          <button key={s} onClick={() => void enviar(s)} className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: temaClaro ? '#101b3d' : 'rgba(46,204,155,0.12)', color: temaClaro ? '#fff' : '#2ecc9b', border: `1px solid ${temaClaro ? '#101b3d' : 'rgba(46,204,155,0.3)'}` }}>{s}</button>
        ))}
      </div>
      {resposta && <div className="mt-3 rounded-xl p-3 text-sm whitespace-pre-wrap" style={{ background: temaClaro ? 'rgba(255,255,255,0.5)' : 'rgba(2,8,16,0.5)', border: `1px solid ${BORDA}`, color: 'var(--axi-text-primary)' }}>{resposta}</div>}
      <p className="text-xs mt-2" style={{ color: TEXTO_SEC }}>{L('A IA só lê o que você tem liberação para ver e mostra de onde veio cada número.', 'The AI only reads what you are allowed to see and shows where each number came from.', 'La IA solo lee lo que usted puede ver y muestra de dónde vino cada número.')}</p>
    </CanvasBox>
  )
}
