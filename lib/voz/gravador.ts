// AXIOMA VOICE INTELLIGENCE — Fase 1: gravação no NAVEGADOR (sem React; testada em scripts/check-voz-fase1.mts).
// Padrões dos maiores sistemas de voz (Alipay/Alibaba, ING/BBVA, guias de VUI — docs/VOICE-INTELLIGENCE.md §8):
//  • microfone só depois do clique; indicador visível de que está ouvindo (nível do som + tempo);
//  • para sozinho após ~2,5 s de silêncio depois que a pessoa começou a falar (detecção de voz simples por energia);
//  • limite duro de 60 s e 2 MB; cancelar descarta tudo; o microfone é SEMPRE liberado (fim, cancelamento ou falha);
//  • nada é enviado antes de a pessoa encerrar; nenhuma identificação por voz (biometria) é feita.

export const LIMITE_MS = 60_000
export const LIMITE_BYTES = 2 * 1024 * 1024
// 3,5 s: quem pausa para pensar no meio da pergunta não tem a frase cortada (Elias 2026-10-15)
export const SILENCIO_MS = 3_500
const BITS_POR_SEGUNDO = 32_000 // 60 s ≈ 240 KB: bem abaixo de 2 MB

// Preserva o que a pessoa já digitou: junta com um espaço, sem duplicar espaço nem pontuação colada.
export function juntarTexto(anterior: string, novo: string): string {
  const a = (anterior ?? '').replace(/\s+$/, ''), n = (novo ?? '').trim()
  if (!n) return anterior ?? ''
  return a ? `${a} ${n}` : n
}

// Formato que este navegador grava e a OpenAI aceita (Chrome/Edge: webm; Firefox: ogg/webm; Safari/iPhone: mp4).
export function escolherFormato(suporta: (t: string) => boolean): string | null {
  for (const t of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (suporta(t)) return t
  return null
}

export type ErroGravador = 'sem_suporte' | 'negado' | 'sem_microfone' | 'grande_demais' | 'vazio' | 'falha'
export type Ambiente = {
  getUserMedia?: (c: MediaStreamConstraints) => Promise<MediaStream>
  MediaRecorder?: { new (s: MediaStream, o?: MediaRecorderOptions): MediaRecorder; isTypeSupported?: (t: string) => boolean }
  AudioContext?: { new (): AudioContext }
  agora?: () => number
  aCada?: (fn: () => void, ms: number) => unknown
  pararACada?: (id: unknown) => void
}

export class GravadorVoz {
  private stream: MediaStream | null = null
  private rec: MediaRecorder | null = null
  private partes: Blob[] = []
  private relogio: unknown = null
  private ctx: AudioContext | null = null
  private inicio = 0
  private ultimaVoz = 0
  private falou = false
  private cancelado = false
  private resolver: ((b: Blob) => void) | null = null
  private rejeitar: ((e: ErroGravador) => void) | null = null
  formato: string | null = null

  constructor(private amb: Ambiente, private aoNivel: (nivel: number, ms: number) => void = () => {}) {}

  static suportado(amb: Ambiente): boolean {
    return !!amb.getUserMedia && !!amb.MediaRecorder && !!escolherFormato((t) => amb.MediaRecorder?.isTypeSupported?.(t) ?? false)
  }

  // Pede o microfone (só aqui, depois do clique) e começa a gravar. Devolve { final }: a promessa do áudio
  // (dentro de um objeto — uma async que devolve Promise esperaria a gravação inteira acabar).
  async iniciar(): Promise<{ final: Promise<Blob> }> {
    const amb = this.amb
    if (!GravadorVoz.suportado(amb)) throw 'sem_suporte' as ErroGravador
    this.formato = escolherFormato((t) => amb.MediaRecorder!.isTypeSupported?.(t) ?? false)
    try {
      this.stream = await amb.getUserMedia!({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } })
    } catch (e) {
      const nome = (e as { name?: string })?.name
      throw (nome === 'NotAllowedError' || nome === 'SecurityError' ? 'negado' : nome === 'NotFoundError' || nome === 'OverconstrainedError' ? 'sem_microfone' : 'falha') as ErroGravador
    }
    const agora = amb.agora ?? (() => Date.now())
    const final = new Promise<Blob>((ok, erro) => { this.resolver = ok; this.rejeitar = erro })
    try {
      this.rec = new amb.MediaRecorder!(this.stream, { mimeType: this.formato!, audioBitsPerSecond: BITS_POR_SEGUNDO })
    } catch { this.liberar(); throw 'falha' as ErroGravador }
    this.rec.ondataavailable = (ev: BlobEvent) => { if (ev.data && ev.data.size) this.partes.push(ev.data) }
    this.rec.onstop = () => this.finalizar()
    this.rec.onerror = () => { this.liberar(); this.rejeitar?.('falha') }
    this.inicio = this.ultimaVoz = agora()
    this.rec.start(1000)
    this.medirNivel()
    const aCada = amb.aCada ?? ((fn, ms) => setInterval(fn, ms))
    this.relogio = aCada(() => this.vigiar(), 200)
    return { final }
  }

  parar() { if (this.rec && this.rec.state !== 'inactive') this.rec.stop() }

  cancelar() {
    this.cancelado = true
    if (this.rec && this.rec.state !== 'inactive') { try { this.rec.stop() } catch { /* já parado */ } }
    this.partes = []
    this.liberar()
    this.rejeitar?.('vazio')
  }

  // Limite de tempo e parada por silêncio (só depois que a pessoa começou a falar)
  private vigiar() {
    const agora = (this.amb.agora ?? (() => Date.now()))()
    const nivel = this.nivelAtual()
    if (nivel > 0.02) { this.falou = true; this.ultimaVoz = agora } // 0,02: voz baixa também conta como fala
    this.aoNivel(nivel, agora - this.inicio)
    if (agora - this.inicio >= LIMITE_MS) this.parar()
    else if (this.falou && agora - this.ultimaVoz >= SILENCIO_MS) this.parar()
  }

  private analisador: AnalyserNode | null = null
  private amostras: Uint8Array<ArrayBuffer> | null = null
  private medirNivel() {
    if (!this.amb.AudioContext || !this.stream) { this.falou = true; return } // sem medidor: só limite de tempo
    try {
      this.ctx = new this.amb.AudioContext()
      this.analisador = this.ctx.createAnalyser(); this.analisador.fftSize = 512
      this.ctx.createMediaStreamSource(this.stream).connect(this.analisador)
      this.amostras = new Uint8Array(new ArrayBuffer(this.analisador.fftSize))
    } catch { this.falou = true }
  }
  private nivelAtual(): number {
    if (!this.analisador || !this.amostras) return 0
    this.analisador.getByteTimeDomainData(this.amostras)
    let soma = 0
    for (const v of this.amostras) { const x = (v - 128) / 128; soma += x * x }
    return Math.sqrt(soma / this.amostras.length)
  }

  private finalizar() {
    const tipo = this.formato?.split(';')[0] ?? 'audio/webm'
    const blob = new Blob(this.partes, { type: tipo })
    this.partes = []
    this.liberar()
    if (this.cancelado) return
    if (!blob.size) return this.rejeitar?.('vazio')
    if (blob.size > LIMITE_BYTES) return this.rejeitar?.('grande_demais')
    this.resolver?.(blob)
  }

  // Desliga o microfone (a luz de "gravando" do navegador apaga) e o medidor. Seguro chamar várias vezes.
  liberar() {
    if (this.relogio != null) { (this.amb.pararACada ?? ((id) => clearInterval(id as ReturnType<typeof setInterval>)))(this.relogio); this.relogio = null }
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null }
    this.analisador = null
  }
}
