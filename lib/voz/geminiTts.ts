// ═══════════════════════════════════════════════════════════════
// Voz ÚNICA do José (pedido do CEO, 2026-10-16): o botão Ouvir usa a MESMA voz da conversa ao vivo —
// Google, voz "Charon" (masculina, informativa) — em vez da voz do computador. Só servidor (chave
// GEMINI_API_KEY). Formato novo do Google (Interactions API, docs de 16/10/2026): o texto é lido como
// transcrição literal; o tom vai em `speech_metadata.style`. Se o Google mudar/recusar, tenta o formato
// antigo (generateContent) e, se falhar, a rota responde erro e o navegador lê com a voz do aparelho.
// Funções puras testadas em scripts/check-voz-fase2.mts.
// ═══════════════════════════════════════════════════════════════
import type { IdiomaFala } from './textoFala'

export const VOZ_JOSE = 'Charon'
const ESTILO: Record<IdiomaFala, string> = {
  pt: 'diretor financeiro em reunião de diretoria, português do Brasil, voz masculina grave, calma, formal e segura, pausas curtas entre as ideias',
  en: 'finance director in a board meeting, deep male voice, calm, formal and confident, short pauses between ideas',
  es: 'director financiero en una reunión de directorio, voz masculina grave, tranquila, formal y segura, pausas breves entre ideas',
}

export function corpoInteracao(texto: string, lang: IdiomaFala, modelo: string, voz = VOZ_JOSE) {
  return {
    model: modelo,
    input: [{ type: 'user_input', content: [{ type: 'text', text: texto, annotations: [{ type: 'speech_metadata', style: ESTILO[lang] }] }] }],
    response_format: { type: 'audio', mime_type: 'audio/wav' },
    generation_config: { speech_config: [{ voice: voz }] },
  }
}
export function corpoGenerateContent(texto: string, lang: IdiomaFala, voz = VOZ_JOSE) {
  return {
    contents: [{ parts: [{ text: `(${ESTILO[lang]}) ${texto}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } } },
  }
}

// Acha o áudio (base64) na resposta, em qualquer um dos dois formatos do Google
export function extrairAudio(json: unknown): { base64: string; mime: string } | null {
  let achado: { base64: string; mime: string } | null = null
  const visitar = (n: unknown) => {
    if (achado || !n || typeof n !== 'object') return
    const o = n as Record<string, unknown>
    // Interactions: { type: 'audio', data, mime_type? } · generateContent: { inlineData: { mimeType, data } }
    if (o.type === 'audio' && typeof o.data === 'string') { achado = { base64: o.data, mime: String(o.mime_type ?? o.mimeType ?? 'audio/wav') }; return }
    const inl = o.inlineData as Record<string, unknown> | undefined
    if (inl && typeof inl.data === 'string' && String(inl.mimeType ?? '').startsWith('audio')) { achado = { base64: inl.data, mime: String(inl.mimeType) }; return }
    for (const v of Object.values(o)) visitar(v)
  }
  visitar(json)
  return achado
}

const ehWav = (b: Uint8Array) => b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 // "RIFF"
// PCM 16 bits mono → WAV (o <audio> do navegador não toca PCM cru)
export function pcmParaWav(pcm: Uint8Array, taxa = 24000): Uint8Array {
  const wav = new Uint8Array(44 + pcm.length)
  const v = new DataView(wav.buffer)
  const txt = (o: number, s: string) => { for (let i = 0; i < s.length; i++) wav[o + i] = s.charCodeAt(i) }
  txt(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); txt(8, 'WAVE')
  txt(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true)
  v.setUint32(24, taxa, true); v.setUint32(28, taxa * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true)
  txt(36, 'data'); v.setUint32(40, pcm.length, true)
  wav.set(pcm, 44)
  return wav
}
export function audioParaWav(a: { base64: string; mime: string }): Uint8Array {
  const bytes = Uint8Array.from(Buffer.from(a.base64, 'base64'))
  if (ehWav(bytes)) return bytes
  const taxa = Number(a.mime.match(/rate=(\d+)/)?.[1]) || 24000
  return pcmParaWav(bytes, taxa)
}

export async function sintetizarGemini(texto: string, lang: IdiomaFala, chave: string, modelo: string, modeloReserva: string): Promise<Uint8Array> {
  const cabecalho = { 'x-goog-api-key': chave, 'Content-Type': 'application/json' }
  const tentativas: (() => Promise<Response>)[] = [
    () => fetch('https://generativelanguage.googleapis.com/v1beta/interactions', { method: 'POST', signal: AbortSignal.timeout(45000), headers: cabecalho, body: JSON.stringify(corpoInteracao(texto, lang, modelo)) }),
    () => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modeloReserva)}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(45000), headers: cabecalho, body: JSON.stringify(corpoGenerateContent(texto, lang)) }),
  ]
  const motivos: string[] = []
  for (const tentar of tentativas) {
    try {
      const res = await tentar()
      if (!res.ok) { motivos.push(String(res.status)); continue } // corpo do erro não é lido nem registrado
      const audio = extrairAudio(await res.json())
      if (audio) return audioParaWav(audio)
      motivos.push('sem áudio')
    } catch (e) { motivos.push(e instanceof Error ? e.name : 'erro') }
  }
  throw new Error(`gemini tts ${motivos.join(' / ')}`)
}
