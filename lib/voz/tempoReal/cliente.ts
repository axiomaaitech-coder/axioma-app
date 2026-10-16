// ═══════════════════════════════════════════════════════════════
// AXIOMA VOICE INTELLIGENCE — PoC CONVERSA AO VIVO (navegador). Uma interface, dois fornecedores:
//   • Gemini Live: WebSocket com token efêmero (configuração travada no servidor); áudio PCM 16 kHz
//     sobe, PCM 24 kHz desce e é tocado em fila; "interrupted" do servidor corta a fila na hora.
//   • Qwen Omni Realtime: WebRTC (o navegador cuida de microfone e alto-falante); a troca SDP passa
//     pelo servidor do Axioma (/api/voz/tempo-real/sdp), que guarda a chave.
// Toda pergunta sobre a empresa chega como chamada da ferramenta `perguntar_ao_axioma` e é atendida
// por `consultar` (a tela chama /api/ia/motor). A sessão só abre no toque, mostra que o microfone
// está aberto e fecha sozinha em 60 s de silêncio ou 10 min. Nada de áudio/texto vai para log.
// ═══════════════════════════════════════════════════════════════
import type { IdiomaFala } from '../textoFala'
import type { FornecedorTR } from './servidor'

export type EstadoConversa = 'conectando' | 'ouvindo' | 'consultando' | 'falando' | 'encerrada' | 'erro'
export type MotivoFim = 'usuario' | 'silencio' | 'tempo_esgotado' | 'erro' | 'saiu_da_tela'
export type EventosConversa = {
  estado: (e: EstadoConversa) => void
  fala: (quem: 'voce' | 'jose', texto: string) => void // fala completa de cada lado (vai para o chat)
  erro: (mensagem: string) => void
  fim?: (motivo: MotivoFim) => void
}
export type OpcoesConversa = {
  fornecedor: FornecedorTR
  empresaId: string
  lang: IdiomaFala
  eventos: EventosConversa
  consultar: (pergunta: string) => Promise<string> // o cérebro: motor do Axioma
}
export type SessaoAoVivo = { encerrar: (motivo?: MotivoFim) => void }

const MSG_FALHA: Record<IdiomaFala, string> = {
  pt: 'Não foi possível manter a conversa ao vivo. Tente de novo ou use o chat.',
  en: 'Could not keep the live conversation. Try again or use the chat.',
  es: 'No fue posible mantener la conversación en vivo. Intente de nuevo o use el chat.',
}
const MSG_MICROFONE: Record<IdiomaFala, string> = {
  pt: 'O microfone está bloqueado. Libere no cadeado ao lado do endereço do site.',
  en: 'The microphone is blocked. Allow it in the lock icon next to the site address.',
  es: 'El micrófono está bloqueado. Habilítelo en el candado junto a la dirección del sitio.',
}

// ─── Áudio PCM (testado em scripts/check-voz-tempo-real.mts) ───
export function floatParaPcm16Base64(amostras: Float32Array): string {
  const bytes = new Uint8Array(amostras.length * 2)
  const v = new DataView(bytes.buffer)
  for (let i = 0; i < amostras.length; i++) {
    const s = Math.max(-1, Math.min(1, amostras[i]))
    v.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true)
  }
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}
export function pcm16Base64ParaFloat(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64)
  const n = Math.floor(bin.length / 2)
  const out = new Float32Array(new ArrayBuffer(n * 4))
  for (let i = 0; i < n; i++) {
    let x = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8)
    if (x >= 0x8000) x -= 0x10000
    out[i] = x / 0x8000
  }
  return out
}

// ─── Base comum: cronômetros (silêncio e duração), métricas e fim ───
type Inicio = { duracao_max_s: number; silencio_max_s: number }
function controle(o: OpcoesConversa, ini: Inicio, liberar: () => void) {
  const t0 = Date.now()
  let fim = false, tokensEntrada = 0, tokensSaida = 0, consultas = 0
  let ultimaFalaPessoa = 0, latenciaPrimeira = 0
  let silencio: ReturnType<typeof setTimeout> | null = null
  const maximo = setTimeout(() => encerrar('tempo_esgotado'), ini.duracao_max_s * 1000)
  const atividade = () => { if (silencio) clearTimeout(silencio); silencio = setTimeout(() => encerrar('silencio'), ini.silencio_max_s * 1000) }
  function encerrar(motivo: MotivoFim = 'usuario') {
    if (fim) return
    fim = true
    if (silencio) clearTimeout(silencio)
    clearTimeout(maximo)
    try { liberar() } catch { /* recurso já liberado */ }
    o.eventos.estado('encerrada')
    o.eventos.fim?.(motivo)
    // Só métricas (sem áudio/texto): duração, tokens, consultas, latência da 1ª resposta
    void fetch('/api/voz/tempo-real', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ empresa_id: o.empresaId, fornecedor: o.fornecedor, segundos: (Date.now() - t0) / 1000, tokens_entrada: tokensEntrada, tokens_saida: tokensSaida, consultas, latencia_primeira_fala_ms: latenciaPrimeira, motivo }),
    }).catch(() => {})
  }
  return {
    encerrar, atividade,
    encerrada: () => fim,
    tokens: (e: number, s: number) => { tokensEntrada += e || 0; tokensSaida += s || 0 },
    consultou: () => { consultas++ },
    pessoaFalou: () => { ultimaFalaPessoa = Date.now() },
    joseComecou: () => { if (!latenciaPrimeira && ultimaFalaPessoa) latenciaPrimeira = Date.now() - ultimaFalaPessoa },
  }
}

async function microfone(lang: IdiomaFala, o: OpcoesConversa): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } })
  } catch {
    o.eventos.erro(MSG_MICROFONE[lang]); o.eventos.estado('erro')
    return null
  }
}

// ═══ Gemini Live ═══
async function iniciarGemini(o: OpcoesConversa, ini: Inicio & { ws: string; token: string; modelo: string }): Promise<SessaoAoVivo> {
  const mic = await microfone(o.lang, o)
  if (!mic) return { encerrar: () => {} }
  const ws = new WebSocket(`${ini.ws}?access_token=${encodeURIComponent(ini.token)}`)
  const ctxIn = new AudioContext({ sampleRate: 16000 })
  const ctxOut = new AudioContext({ sampleRate: 24000 })
  let fontes: AudioBufferSourceNode[] = []
  let proximo = 0
  let processador: ScriptProcessorNode | null = null
  let falaPessoa = '', falaJose = ''
  const cancelados = new Set<string>()
  const pararSom = () => { fontes.forEach((f) => { try { f.stop() } catch { /* já parou */ } }); fontes = []; proximo = 0 }
  const c = controle(o, ini, () => {
    pararSom()
    processador?.disconnect()
    mic.getTracks().forEach((t) => t.stop())
    if (ws.readyState <= 1) ws.close()
    void ctxIn.close(); void ctxOut.close()
  })
  const enviar = (m: unknown) => { if (ws.readyState === 1) ws.send(JSON.stringify(m)) }
  const fecharTurno = () => {
    if (falaPessoa.trim()) o.eventos.fala('voce', falaPessoa.trim())
    if (falaJose.trim()) o.eventos.fala('jose', falaJose.trim())
    falaPessoa = ''; falaJose = ''
  }

  ws.onopen = () => enviar({ setup: { model: ini.modelo } }) // o token já traz a configuração travada
  ws.onerror = () => { if (!c.encerrada()) { o.eventos.erro(MSG_FALHA[o.lang]); c.encerrar('erro') } }
  ws.onclose = () => { if (!c.encerrada()) c.encerrar('erro') }
  ws.onmessage = async (ev) => {
    let m: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text()) } catch { return }
    if (m.setupComplete) {
      // Microfone só começa a subir depois que a sessão está pronta
      const fonte = ctxIn.createMediaStreamSource(mic)
      processador = ctxIn.createScriptProcessor(4096, 1, 1)
      const mudo = ctxIn.createGain(); mudo.gain.value = 0
      processador.onaudioprocess = (e) => enviar({ realtimeInput: { audio: { data: floatParaPcm16Base64(e.inputBuffer.getChannelData(0)), mimeType: 'audio/pcm;rate=16000' } } })
      fonte.connect(processador); processador.connect(mudo); mudo.connect(ctxIn.destination)
      o.eventos.estado('ouvindo'); c.atividade()
      return
    }
    if (m.usageMetadata) c.tokens(m.usageMetadata.promptTokenCount, m.usageMetadata.responseTokenCount)
    if (m.goAway) { c.encerrar('tempo_esgotado'); return }
    const sc = m.serverContent
    if (sc) {
      if (sc.interrupted) { pararSom(); o.eventos.estado('ouvindo') } // a pessoa falou por cima: corta na hora
      if (sc.inputTranscription?.text) { falaPessoa += sc.inputTranscription.text; c.pessoaFalou(); c.atividade() }
      if (sc.outputTranscription?.text) falaJose += sc.outputTranscription.text
      for (const parte of sc.modelTurn?.parts ?? []) {
        const dados = parte?.inlineData
        if (!dados?.data || !String(dados.mimeType ?? '').startsWith('audio/pcm')) continue
        const amostras = pcm16Base64ParaFloat(dados.data)
        const buf = ctxOut.createBuffer(1, amostras.length, 24000)
        buf.copyToChannel(amostras, 0)
        const f = ctxOut.createBufferSource(); f.buffer = buf; f.connect(ctxOut.destination)
        proximo = Math.max(proximo, ctxOut.currentTime); f.start(proximo); proximo += buf.duration
        fontes.push(f); f.onended = () => { fontes = fontes.filter((x) => x !== f) }
        c.joseComecou(); c.atividade(); o.eventos.estado('falando')
      }
      if (sc.turnComplete) { fecharTurno(); o.eventos.estado('ouvindo'); c.atividade() }
    }
    if (m.toolCallCancellation?.ids) for (const id of m.toolCallCancellation.ids) cancelados.add(String(id))
    if (m.toolCall?.functionCalls) {
      o.eventos.estado('consultando')
      const respostas = await Promise.all((m.toolCall.functionCalls as { id: string; name: string; args?: { pergunta?: string } }[]).map(async (fc) => {
        c.consultou()
        const resultado = fc.name === 'perguntar_ao_axioma' && fc.args?.pergunta ? await o.consultar(String(fc.args.pergunta).slice(0, 1000)) : 'Ferramenta desconhecida.'
        return { id: fc.id, name: fc.name, response: { resultado } }
      }))
      const validas = respostas.filter((r) => !cancelados.has(String(r.id)))
      if (validas.length) enviar({ toolResponse: { functionResponses: validas } })
      c.atividade()
    }
  }
  o.eventos.estado('conectando')
  return { encerrar: c.encerrar }
}

// ═══ Qwen Omni Realtime (WebRTC) ═══
async function iniciarQwen(o: OpcoesConversa, ini: Inicio & { sessao: Record<string, unknown> }): Promise<SessaoAoVivo> {
  const mic = await microfone(o.lang, o)
  if (!mic) return { encerrar: () => {} }
  const pc = new RTCPeerConnection({ iceServers: [] })
  const som = new Audio(); som.autoplay = true
  const trilha = mic.getAudioTracks()[0]
  trilha.enabled = false // só sobe áudio depois de a configuração ser confirmada (session.updated)
  pc.addTrack(trilha, mic)
  pc.ontrack = (e) => { som.srcObject = e.streams[0] ?? new MediaStream([e.track]) }
  const canal = pc.createDataChannel('oai-events')
  let respondendo = false, sessaoSemVoz = false
  let falaJose = ''
  const c = controle(o, ini, () => {
    mic.getTracks().forEach((t) => t.stop())
    try { canal.close() } catch { /* já fechado */ }
    pc.close(); som.srcObject = null
  })
  const enviar = (m: unknown) => { if (canal.readyState === 'open') canal.send(JSON.stringify(m)) }
  const configurar = () => enviar({ type: 'session.update', session: sessaoSemVoz ? { ...ini.sessao, voice: undefined } : ini.sessao })

  const tratar = async (ev: MessageEvent) => {
    let m: Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    try { m = JSON.parse(String(ev.data)) } catch { return }
    switch (m.type) {
      case 'session.created': configurar(); break
      case 'session.updated': trilha.enabled = true; o.eventos.estado('ouvindo'); c.atividade(); break
      case 'input_audio_buffer.speech_started':
        c.pessoaFalou(); c.atividade()
        if (respondendo) enviar({ type: 'response.cancel' }) // interrupção: a pessoa falou por cima
        o.eventos.estado('ouvindo'); break
      case 'conversation.item.input_audio_transcription.completed':
        if (m.transcript?.trim()) o.eventos.fala('voce', String(m.transcript).trim()); c.atividade(); break
      case 'response.created': respondendo = true; break
      case 'response.audio_transcript.delta':
        falaJose += m.delta ?? ''; c.joseComecou(); c.atividade(); o.eventos.estado('falando'); break
      case 'response.audio_transcript.done':
        if ((m.transcript ?? falaJose).trim()) o.eventos.fala('jose', String(m.transcript ?? falaJose).trim()); falaJose = ''; break
      case 'response.function_call_arguments.done': {
        o.eventos.estado('consultando'); c.consultou()
        let pergunta = ''
        try { pergunta = String(JSON.parse(m.arguments ?? '{}').pergunta ?? '') } catch { /* argumento inválido */ }
        const resultado = m.name === 'perguntar_ao_axioma' && pergunta ? await o.consultar(pergunta.slice(0, 1000)) : 'Ferramenta desconhecida.'
        enviar({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: m.call_id, output: resultado } })
        enviar({ type: 'response.create' })
        c.atividade(); break
      }
      case 'response.done':
        respondendo = false
        c.tokens(m.response?.usage?.input_tokens, m.response?.usage?.output_tokens)
        o.eventos.estado('ouvindo'); break
      case 'error':
        // Voz masculina configurada não existe neste modelo: tenta de novo com a voz padrão
        if (!sessaoSemVoz && /voice/i.test(String(m.error?.param ?? m.error?.message ?? ''))) { sessaoSemVoz = true; configurar(); break }
        if (/response/i.test(String(m.error?.message ?? '')) && /cancel/i.test(String(m.error?.message ?? ''))) break // cancelar sem resposta ativa
        o.eventos.erro(MSG_FALHA[o.lang]); c.encerrar('erro'); break
    }
  }
  canal.onmessage = tratar
  pc.ondatachannel = ({ channel }) => { channel.onmessage = tratar }
  pc.onconnectionstatechange = () => { if (['failed', 'disconnected'].includes(pc.connectionState) && !c.encerrada()) { o.eventos.erro(MSG_FALHA[o.lang]); c.encerrar('erro') } }

  o.eventos.estado('conectando')
  try {
    await pc.setLocalDescription(await pc.createOffer())
    await new Promise<void>((ok) => {
      if (pc.iceGatheringState === 'complete') return ok()
      const t = setTimeout(ok, 3000) // não espera para sempre: segue com os candidatos já reunidos
      pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); ok() } }
    })
    const res = await fetch(`/api/voz/tempo-real/sdp?empresa_id=${encodeURIComponent(o.empresaId)}&lang=${o.lang}`, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: pc.localDescription?.sdp ?? '' })
    if (!res.ok) throw new Error(String(res.status))
    await pc.setRemoteDescription({ type: 'answer', sdp: await res.text() })
  } catch {
    o.eventos.erro(MSG_FALHA[o.lang]); c.encerrar('erro')
  }
  return { encerrar: c.encerrar }
}

// ─── Ponto de entrada: pede a sessão ao servidor (regras de acesso lá) e conecta ───
export async function iniciarConversaAoVivo(o: OpcoesConversa): Promise<SessaoAoVivo | null> {
  o.eventos.estado('conectando')
  let ini: Record<string, unknown>
  try {
    const res = await fetch('/api/voz/tempo-real', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empresa_id: o.empresaId, lang: o.lang, fornecedor: o.fornecedor }) })
    ini = await res.json()
    if (!res.ok) { o.eventos.erro(typeof ini?.mensagem === 'string' ? ini.mensagem : MSG_FALHA[o.lang]); o.eventos.estado('erro'); return null }
  } catch { o.eventos.erro(MSG_FALHA[o.lang]); o.eventos.estado('erro'); return null }
  const base = { duracao_max_s: Number(ini.duracao_max_s) || 600, silencio_max_s: Number(ini.silencio_max_s) || 60 }
  return o.fornecedor === 'gemini'
    ? iniciarGemini(o, { ...base, ws: String(ini.ws), token: String(ini.token), modelo: String(ini.modelo) })
    : iniciarQwen(o, { ...base, sessao: (ini.sessao ?? {}) as Record<string, unknown> })
}
