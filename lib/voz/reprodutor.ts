// AXIOMA VOICE INTELLIGENCE — Fase B: UM reprodutor de voz para a tela inteira (navegador).
// Garante: só uma resposta fala por vez; parar() corta o áudio DE VERDADE (pausa o <audio>, aborta o
// pedido ao servidor e cancela a fala do aparelho); pedido antigo que chega depois de um parar() é
// descartado (nunca começa a falar sozinho). Voz do servidor só com resposta assinada pelo motor;
// sem fornecedor ou com falha → voz do aparelho (anti-falha). Usado pelo botão Ouvir e pelo modo conversa.
import { dividirEmFrases, textoParaFala, type IdiomaFala } from './textoFala'
import { estadoConversaGlobal } from './tempoReal/sessaoGlobal'

export type EstadoFala = 'parado' | 'carregando' | 'falando'
export type PedidoFala = { chave: string; texto: string; lang: IdiomaFala; empresaId: string; assinatura?: string | null; ressalva?: boolean }
type Situacao = { ativa: boolean; fornecedor: string | null; nome: string }

const LOCALE: Record<IdiomaFala, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }
// Nomes das vozes masculinas/femininas que Windows, Edge, Mac, Android e iPhone instalam (pt/en/es)
const MASCULINAS = /\b(antonio|daniel|donato|f[áa]bio|humberto|j[úu]lio|nicolau|val[ée]rio|leandro|thiago|felipe|guy|andrew|brian|christopher|eric|roger|steffan|david|mark|ryan|alex|fred|aaron|rishi|tom|[áa]lvaro|jorge|pablo|ra[úu]l|gonzalo|dar[íi]o|tom[áa]s|diego|carlos|male|masculin)/i
const FEMININAS = /\b(francisca|thalita|maria|luciana|leila|yara|brenda|elza|giovanna|manuela|helena|joana|catarina|fernanda|raquel|ana|aria|jenny|michelle|emma|ava|zira|hazel|susan|samantha|karen|moira|tessa|elvira|dalia|laura|paulina|m[óo]nica|sabina|female|feminin|google portugu[êe]s|google espa[ñn]ol|google us english)/i

// ─── Situação da voz por empresa: uma consulta só (lista com 30 respostas não faz 30 pedidos) ───
const situacoes = new Map<string, Promise<Situacao>>()
export function situacaoVoz(empresaId: string): Promise<Situacao> {
  if (!situacoes.has(empresaId)) {
    situacoes.set(empresaId, fetch(`/api/voz/falar?empresa_id=${encodeURIComponent(empresaId)}`).then((x) => x.json())
      .then((j) => ({ ativa: !!j?.ativa, fornecedor: typeof j?.fornecedor === 'string' ? j.fornecedor : null, nome: typeof j?.nome === 'string' ? j.nome : '' }))
      .catch(() => { situacoes.delete(empresaId); return { ativa: false, fornecedor: null, nome: '' } }))
  }
  return situacoes.get(empresaId)!
}

// ─── Estado global (quem está falando) com aviso para os botões ───
let atual: { chave: string; estado: EstadoFala } = { chave: '', estado: 'parado' }
const ouvintes = new Set<() => void>()
const mudar = (chave: string, estado: EstadoFala) => { atual = { chave, estado }; ouvintes.forEach((f) => f()) }
export const estadoFala = () => atual
export function assinarFala(f: () => void): () => void { ouvintes.add(f); return () => { ouvintes.delete(f) } }

let audio: HTMLAudioElement | null = null
let ctrl: AbortController | null = null
let geracao = 0 // cada falar()/parar() invalida o anterior (resposta atrasada não fala)
const cacheAudio = new Map<string, string>() // chave → URL do áudio já gerado (ouvir de novo não paga de novo)

export function pararFala() {
  geracao++
  ctrl?.abort(); ctrl = null
  if (audio) { audio.onended = null; audio.pause() }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  if (atual.estado !== 'parado') mudar('', 'parado')
}

function melhorVoz(lang: IdiomaFala): SpeechSynthesisVoice | null {
  const vozes = window.speechSynthesis.getVoices()
  const loc = LOCALE[lang].toLowerCase()
  const doIdioma = vozes.filter((v) => v.lang.toLowerCase().replace('_', '-') === loc)
  const lista = doIdioma.length ? doIdioma : vozes.filter((v) => v.lang.toLowerCase().startsWith(lang))
  // Voz MASCULINA (pedido do Elias 2026-10-16): homem natural > homem comum > qualquer natural; feminina por último
  const nota = (v: SpeechSynthesisVoice) => (MASCULINAS.test(v.name) ? 10 : 0) + (FEMININAS.test(v.name) ? -10 : 0) + (/natural|neural|online/i.test(v.name) ? 3 : 0)
  return [...lista].sort((a, b) => nota(b) - nota(a))[0] ?? null
}

function falarNoAparelho(p: PedidoFala, nome: string, minha: number): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false
  const synth = window.speechSynthesis
  synth.cancel()
  const frases = dividirEmFrases(textoParaFala(p.texto, p.lang, p.ressalva, nome))
  if (!frases.length) return false
  const voz = melhorVoz(p.lang)
  frases.forEach((f, i) => {
    const u = new SpeechSynthesisUtterance(f)
    u.lang = LOCALE[p.lang]; if (voz) u.voice = voz; u.rate = 0.98; u.pitch = 0.95
    if (i === frases.length - 1) u.onend = () => { if (minha === geracao) mudar('', 'parado') }
    u.onerror = (ev) => { if (ev.error !== 'interrupted' && ev.error !== 'canceled' && minha === geracao) mudar('', 'parado') }
    synth.speak(u)
  })
  mudar(p.chave, 'falando')
  return true
}

function tocar(p: PedidoFala, url: string, minha: number) {
  audio = audio ?? new Audio()
  audio.src = url
  audio.onended = () => { if (minha === geracao) mudar('', 'parado') }
  audio.play().then(() => { if (minha === geracao) mudar(p.chave, 'falando'); else audio?.pause() }).catch(() => { if (minha === geracao) mudar('', 'parado') })
}

// Fala uma resposta. Devolve false se não houver como falar (voz desligada, aparelho sem voz).
export async function falar(p: PedidoFala): Promise<boolean> {
  // Uma voz por vez (CEO, 2026-10-16): com a conversa ao vivo aberta, nada mais fala por cima
  if (estadoConversaGlobal().ativa) return false
  pararFala()
  const minha = ++geracao
  const sit = await situacaoVoz(p.empresaId)
  if (minha !== geracao) return false
  if (!sit.ativa || !p.texto.trim()) return false
  const emCache = cacheAudio.get(p.chave)
  if (emCache) { tocar(p, emCache, minha); return true }
  // Voz única do José (CEO, 2026-10-16): havendo a voz do José, nada de voz robótica do computador
  if (sit.fornecedor && !p.assinatura) return false
  if (!sit.fornecedor) return falarNoAparelho(p, sit.nome, minha)
  mudar(p.chave, 'carregando')
  ctrl = new AbortController()
  try {
    const res = await fetch('/api/voz/falar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ empresa_id: p.empresaId, texto: p.texto, assinatura: p.assinatura, lang: p.lang, ressalva: !!p.ressalva }),
    })
    if (!res.ok) throw new Error(String(res.status))
    const blob = await res.blob()
    if (minha !== geracao) return false // parado (ou outra resposta pedida) enquanto o áudio chegava
    const url = URL.createObjectURL(blob)
    cacheAudio.set(p.chave, url)
    tocar(p, url, minha)
    return true
  } catch {
    if (minha !== geracao) return false
    mudar('', 'parado')
    return false // voz do José indisponível agora: o botão avisa (sem cair na voz robótica)
  }
}

// Chrome carrega as vozes do aparelho depois: pede a lista cedo para a 1ª fala já sair com a voz certa
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => window.speechSynthesis.getVoices())
}
