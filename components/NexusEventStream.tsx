'use client'
// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 6: Nexus Event Stream. Card discreto que aparece no
// canto durante a navegação com o evento de impacto alto mais recente ainda
// não visto ("minha Axioma está observando o mundo por mim" — Push 03).
// Regras do Push 03: aparece suave, não bloqueia, permite fechar / ver depois
// / abrir, nunca repete o mesmo evento, e tem "não mostrar avisos".
// Fora do Nexus (lá os eventos já estão na tela) e fora do PDV (operador
// precisa de foco no caixa). Preferências ficam no navegador (localStorage /
// sessionStorage) — conveniência por pessoa, sempre com try/catch.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe2, X } from 'lucide-react'
import { useLanguage } from '../lib/LanguageContext'
import { useThemeAxioma } from '../lib/ThemeContext'
import { PALETA, VERDE_SOLIDO } from '../lib/nexusTema'
import { obterEventosDestaque, type EventoNexus } from '../lib/nexusHelpers'
import { textoEvento } from '../lib/nexusEventDetector'

const CHAVE_VISTOS = 'nexus-stream-vistos'      // eventos fechados/abertos (não mostra de novo)
const CHAVE_DESLIGADO = 'nexus-stream-desligado' // "não mostrar avisos"
const CHAVE_DEPOIS = 'nexus-stream-depois'       // "ver depois": some só nesta visita
const ATRASO_MS = 5000

const ler = (armazem: Storage | undefined, chave: string): string | null => { try { return armazem?.getItem(chave) ?? null } catch { return null } }
const gravar = (armazem: Storage | undefined, chave: string, valor: string) => { try { armazem?.setItem(chave, valor) } catch { /* navegador sem armazenamento: só não lembra */ } }
// Ligar/desligar o Radar — usado aqui ("Não mostrar avisos") e no card
// "Radar Global" da seção "O que o Nexus faz por você" (/nexus).
export const radarLigado = (): boolean => ler(globalThis.localStorage, CHAVE_DESLIGADO) !== '1'
export const definirRadar = (ligado: boolean) => {
  gravar(globalThis.localStorage, CHAVE_DESLIGADO, ligado ? '0' : '1')
  if (ligado) { try { globalThis.sessionStorage?.removeItem(CHAVE_DEPOIS) } catch { /* sem armazenamento */ } }
}
const vistos = (): string[] => { try { return JSON.parse(ler(globalThis.localStorage, CHAVE_VISTOS) || '[]') } catch { return [] } }

export default function NexusEventStream() {
  const pathname = usePathname()
  const router = useRouter()
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG } = PALETA[tema]
  const [evento, setEvento] = useState<EventoNexus | null>(null)

  const foraDeAlcance = !pathname || pathname.startsWith('/nexus') || pathname.startsWith('/pdv')

  useEffect(() => {
    if (foraDeAlcance || evento) return
    if (!radarLigado() || ler(globalThis.sessionStorage, CHAVE_DEPOIS) === '1') return
    let cancelado = false
    const t = setTimeout(async () => {
      const lista = await obterEventosDestaque()
      const jaVistos = new Set(vistos())
      const proximo = lista.find((e) => !jaVistos.has(e.id))
      if (!cancelado && proximo) setEvento(proximo)
    }, ATRASO_MS)
    return () => { cancelado = true; clearTimeout(t) }
  }, [foraDeAlcance, evento])

  const marcarVisto = (id: string) => gravar(globalThis.localStorage, CHAVE_VISTOS, JSON.stringify([...vistos(), id].slice(-100)))
  const fechar = () => { if (evento) marcarVisto(evento.id); setEvento(null) }
  const verDepois = () => { gravar(globalThis.sessionStorage, CHAVE_DEPOIS, '1'); setEvento(null) }
  const desligar = () => { definirRadar(false); setEvento(null) }
  const abrir = () => { if (!evento) return; marcarVisto(evento.id); router.push(`/nexus?evento=${evento.id}`); setEvento(null) }

  const texto = evento ? (evento.payload ? textoEvento(evento.payload, lang) : { titulo: evento.tituloPt, descricao: '' }) : null
  const ACENTO = temaClaro ? '#16a97d' : CIANO

  return (
    <AnimatePresence>
      {evento && texto && !foraDeAlcance && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          role="status" aria-live="polite"
          className={`fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[340px] z-[65] rounded-2xl p-4 overflow-hidden axi-card-premium3d`}
          style={{ background: PAINEL_BG, border: `1px solid ${ACENTO}55`, boxShadow: temaClaro ? '0 16px 40px -12px rgba(16,27,61,0.45)' : '0 16px 40px -12px rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        >
          <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: ACENTO }}>
              <Globe2 size={13} aria-hidden /> José · {L('Radar Global', 'Global Radar', 'Radar Global')}
            </p>
            <button onClick={fechar} aria-label={L('Fechar', 'Close', 'Cerrar')} className={`p-1 rounded-lg ${temaClaro ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}>
              <X size={14} style={{ color: CINZA }} />
            </button>
          </div>
          <p className="text-sm font-bold leading-snug mb-1" style={{ color: TITULO }}>{texto.titulo}</p>
          <p className="text-[11px] mb-3" style={{ color: TEXTO, opacity: 0.85 }}>
            {L('Impacto potencial: alto', 'Potential impact: high', 'Impacto potencial: alto')}
            {evento.confidence != null && <> · {L('confiabilidade', 'reliability', 'fiabilidad')} {Math.round(evento.confidence)}/100</>}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={abrir} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}20`, border: `1px solid ${CIANO}60`, color: CIANO }}>
              {L('Ver análise', 'See analysis', 'Ver análisis')}
            </button>
            <button onClick={verDepois} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: TEXTO }}>
              {L('Ver depois', 'Later', 'Ver después')}
            </button>
            <button onClick={desligar} className="ml-auto text-[10px] underline" style={{ color: CINZA }}>
              {L('Não mostrar avisos', "Don't show alerts", 'No mostrar avisos')}
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
