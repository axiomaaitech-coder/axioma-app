'use client'
// Faixa que separa as partes do Nexus (pedido do Elias): linha verde-menta com
// um brilho que corre devagar e um feixe de trigo no centro — o símbolo do José
// (os celeiros de José do Egito). Mesma faixa nos 2 temas; respeita a
// preferência de movimento reduzido (o brilho para, a linha fica).
import { motion, useReducedMotion } from 'framer-motion'

export function DivisorNexus({ rotulo }: { rotulo?: string }) {
  const reduzir = useReducedMotion()
  return (
    <div className="relative flex items-center gap-3 py-2" role="separator" aria-label={rotulo}>
      <div className="relative flex-1 h-[2px] overflow-hidden rounded-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(46,204,155,0.55))' }}>
        {!reduzir && (
          <motion.span className="absolute top-0 h-full w-24" style={{ background: 'linear-gradient(90deg, transparent, #2ecc9b, transparent)' }}
            animate={{ left: ['-25%', '110%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }} aria-hidden />
        )}
      </div>

      <span className="flex items-center gap-2 shrink-0">
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 18 L10 5" stroke="#2ecc9b" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="10" cy="4" rx="1.6" ry="3" fill="#2ecc9b" />
          <ellipse cx="7.4" cy="8" rx="1.4" ry="2.6" fill="#2ecc9b" transform="rotate(-30 7.4 8)" />
          <ellipse cx="12.6" cy="8" rx="1.4" ry="2.6" fill="#2ecc9b" transform="rotate(30 12.6 8)" />
          <ellipse cx="7.2" cy="12.2" rx="1.4" ry="2.6" fill="#2ecc9b" transform="rotate(-30 7.2 12.2)" />
          <ellipse cx="12.8" cy="12.2" rx="1.4" ry="2.6" fill="#2ecc9b" transform="rotate(30 12.8 12.2)" />
        </svg>
        {rotulo && <span className="text-[11px] font-bold tracking-wide" style={{ color: '#2ecc9b' }}>{rotulo}</span>}
      </span>

      <div className="relative flex-1 h-[2px] overflow-hidden rounded-full" style={{ background: 'linear-gradient(90deg, rgba(46,204,155,0.55), transparent)' }}>
        {!reduzir && (
          <motion.span className="absolute top-0 h-full w-24" style={{ background: 'linear-gradient(90deg, transparent, #2ecc9b, transparent)' }}
            animate={{ left: ['-25%', '110%'] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2, delay: 1.6 }} aria-hidden />
        )}
      </div>
    </div>
  )
}
