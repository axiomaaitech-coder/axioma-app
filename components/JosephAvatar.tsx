'use client'
// ═══════════════════════════════════════════════════════════════
// José — personagem do Nexus, inspirado em José do Egito (Gênesis 37–50):
// o jovem que interpretava os sinais e preparou o Egito para os 7 anos de
// fartura e os 7 de seca. Desenho próprio em SVG:
//  • nemes (lenço dos governantes do Egito) listrado nas cores do Axioma;
//  • colar usekh em faixas coloridas — aceno à "túnica de muitas cores";
//  • na testa, um feixe de trigo no lugar da cobra (uraeus): nada de símbolo
//    religioso egípcio, só o celeiro que ele encheu.
// Estados: "parado" (flutua e pisca), "pensando" (o trigo brilha e cresce).
// ═══════════════════════════════════════════════════════════════
import { motion } from 'framer-motion'

type Estado = 'parado' | 'pensando'

export function JosephAvatar({ tamanho = 64, estado = 'parado', comFundo = true }: { tamanho?: number; estado?: Estado; comFundo?: boolean }) {
  const pensando = estado === 'pensando'
  return (
    <motion.svg
      width={tamanho} height={tamanho} viewBox="0 0 120 120" role="img" aria-label="José"
      animate={{ y: [0, -2.5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="jz-fundo" cx="50%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#17406e" />
          <stop offset="100%" stopColor="#0a1628" />
        </radialGradient>
        <linearGradient id="jz-pele" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c98c5e" />
          <stop offset="100%" stopColor="#a86c43" />
        </linearGradient>
        <clipPath id="jz-circulo"><circle cx="60" cy="60" r="58" /></clipPath>
        <pattern id="jz-listras" width="8" height="120" patternUnits="userSpaceOnUse">
          <rect width="8" height="120" fill="#101b3d" />
          <rect width="4" height="120" fill="#2ecc9b" />
        </pattern>
      </defs>

      {comFundo && <circle cx="60" cy="60" r="58" fill="url(#jz-fundo)" stroke="#2ecc9b" strokeOpacity="0.55" strokeWidth="2" />}

      <g clipPath={comFundo ? 'url(#jz-circulo)' : undefined}>
        {/* abas do nemes caindo sobre os ombros (atrás do rosto) */}
        <path d="M30 52 L22 104 L42 104 L44 64 Z" fill="url(#jz-listras)" />
        <path d="M90 52 L98 104 L78 104 L76 64 Z" fill="url(#jz-listras)" />

        {/* pescoço e ombros */}
        <rect x="51" y="74" width="18" height="14" rx="4" fill="url(#jz-pele)" />
        <path d="M24 120 C26 98 42 90 60 90 C78 90 94 98 96 120 Z" fill="#f4efe2" />

        {/* colar usekh — faixas coloridas (túnica de muitas cores) */}
        <path d="M34 101 C40 92 50 88 60 88 C70 88 80 92 86 101" fill="none" stroke="#2ecc9b" strokeWidth="4" />
        <path d="M31 107 C38 97 49 93 60 93 C71 93 82 97 89 107" fill="none" stroke="#38bdf8" strokeWidth="4" />
        <path d="M29 113 C36 102 48 98 60 98 C72 98 84 102 91 113" fill="none" stroke="#f5a623" strokeWidth="4" />
        <path d="M28 119 C35 107 47 103 60 103 C73 103 85 107 92 119" fill="none" stroke="#e05780" strokeWidth="4" />

        {/* rosto */}
        <ellipse cx="60" cy="58" rx="19" ry="22" fill="url(#jz-pele)" />
        <ellipse cx="41.5" cy="60" rx="3" ry="5" fill="#a86c43" />
        <ellipse cx="78.5" cy="60" rx="3" ry="5" fill="#a86c43" />

        {/* sobrancelhas */}
        <path d="M47 50 Q52.5 47 57 50" stroke="#2b1a10" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M63 50 Q67.5 47 73 50" stroke="#2b1a10" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* olhos amendoados com traço de kohl, piscando */}
        <motion.g
          style={{ transformOrigin: '60px 56px' }}
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ duration: 4.5, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
        >
          <path d="M47 56 Q52 52.5 57 56 Q52 59 47 56 Z" fill="#fff" />
          <path d="M63 56 Q68 52.5 73 56 Q68 59 63 56 Z" fill="#fff" />
          <circle cx="52" cy="56" r="2" fill="#2b1a10" />
          <circle cx="68" cy="56" r="2" fill="#2b1a10" />
          <path d="M46 56 Q52 52 58 56 L61 55" stroke="#101b3d" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M59 55 L62 56 Q68 52 74 56" stroke="#101b3d" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </motion.g>

        {/* nariz e sorriso sereno */}
        <path d="M60 58 L58.5 65 Q60 66.5 61.5 65" stroke="#8a5534" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <path d="M54.5 70 Q60 74 65.5 70" stroke="#6e3a22" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* nemes: topo do lenço e faixa da testa */}
        <path d="M36 50 C36 30 46 22 60 22 C74 22 84 30 84 50 L80 45 C78 36 71 32 60 32 C49 32 42 36 40 45 Z" fill="url(#jz-listras)" />
        <path d="M38 46 C44 40 52 38 60 38 C68 38 76 40 82 46 L80 49 C74 44 67 42 60 42 C53 42 46 44 40 49 Z" fill="#101b3d" stroke="#2ecc9b" strokeWidth="1" />

        {/* feixe de trigo na testa (no lugar da cobra) */}
        <motion.g
          style={{ transformOrigin: '60px 40px' }}
          animate={pensando ? { scale: [1, 1.25, 1], opacity: [0.85, 1, 0.85] } : { scale: 1, opacity: 1 }}
          transition={pensando ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          <path d="M60 42 L60 30" stroke="#f5a623" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="60" cy="29" rx="1.6" ry="3" fill="#f5a623" />
          <ellipse cx="57.6" cy="32.5" rx="1.4" ry="2.6" fill="#f5a623" transform="rotate(-28 57.6 32.5)" />
          <ellipse cx="62.4" cy="32.5" rx="1.4" ry="2.6" fill="#f5a623" transform="rotate(28 62.4 32.5)" />
          <ellipse cx="57.4" cy="36.5" rx="1.4" ry="2.6" fill="#f5a623" transform="rotate(-28 57.4 36.5)" />
          <ellipse cx="62.6" cy="36.5" rx="1.4" ry="2.6" fill="#f5a623" transform="rotate(28 62.6 36.5)" />
        </motion.g>
      </g>

      {/* aura de trigo enquanto interpreta */}
      {pensando && (
        <motion.circle cx="60" cy="60" r="58" fill="none" stroke="#2ecc9b" strokeWidth="2"
          initial={{ opacity: 0.6, scale: 1 }} animate={{ opacity: 0, scale: 1.18 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
          style={{ transformOrigin: '60px 60px' }} />
      )}
    </motion.svg>
  )
}
