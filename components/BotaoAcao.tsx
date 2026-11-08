'use client'
// Botão de ação com microinterações (pedido do Elias, 2026-11-08): cresce de leve no mouse/toque, mostra que está
// trabalhando (girando + texto), confirma com ✓ por um instante e treme de leve se der erro. Respeita "reduzir movimento"
// do sistema. Uso: <BotaoAcao executar={async () => ok} texto=... textoTrabalhando=... textoFeito=... estilo=... />
// `executar` devolve true (deu certo) ou false (deu errado — a tela já mostrou o motivo).
import { useState, type CSSProperties, type ReactNode } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

export function BotaoAcao({ executar, texto, textoTrabalhando, textoFeito, icone, estilo, className = '', desativado }: {
  executar: () => Promise<boolean | void> | boolean | void; texto: ReactNode; textoTrabalhando: string; textoFeito?: string
  icone?: ReactNode; estilo?: CSSProperties; className?: string; desativado?: boolean
}) {
  const reduzir = useReducedMotion()
  const [fase, setFase] = useState<'parado' | 'trabalhando' | 'feito' | 'erro'>('parado')
  async function clicar() {
    if (fase === 'trabalhando' || desativado) return
    setFase('trabalhando')
    let ok: boolean | void = false
    try { ok = await executar() } catch { ok = false }
    if (ok === false) { setFase('erro'); setTimeout(() => setFase('parado'), 450); return }
    setFase(textoFeito ? 'feito' : 'parado')
    if (textoFeito) setTimeout(() => setFase('parado'), 1400)
  }
  const ocupado = fase === 'trabalhando'
  return (
    <motion.button type="button" onClick={() => void clicar()} disabled={ocupado || desativado} aria-busy={ocupado}
      whileHover={reduzir || ocupado || desativado ? undefined : { scale: 1.03, y: -1 }}
      whileTap={reduzir || ocupado || desativado ? undefined : { scale: 0.97 }}
      animate={fase === 'erro' && !reduzir ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: fase === 'erro' ? 0.35 : 0.15 }}
      className={`flex items-center justify-center gap-2 font-bold ${className}`}
      style={{ ...estilo, ...(desativado ? { background: '#6b7280', cursor: 'not-allowed' } : {}), ...(ocupado ? { cursor: 'progress' } : {}) }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={fase} className="flex items-center gap-2"
          initial={reduzir ? false : { opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={reduzir ? undefined : { opacity: 0, y: -4 }} transition={{ duration: 0.15 }}>
          {fase === 'trabalhando' ? <><Loader2 size={16} className={reduzir ? '' : 'animate-spin'} /> {textoTrabalhando}</>
            : fase === 'feito' ? <><Check size={16} /> {textoFeito}</>
            : <>{icone}{texto}</>}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}
