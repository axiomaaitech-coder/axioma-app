"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { motion, useReducedMotion } from "framer-motion";

// Aura de energia estilo "onda sonora" — reservada para o UM elemento
// "hero" de cada tela que merece esse destaque (hoje: o radar de Score
// 360° da IA Financeira). Não é decoração genérica pra espalhar em
// cards — é o "orçamento de ousadia" gasto num lugar só (ver skill
// frontend-design).
//
// Duas camadas, cada uma com a ferramenta certa pro tipo de movimento:
// - GSAP (imperativo, bom pra timeline contínua): os pulsos de sonar
//   que se expandem e desaparecem, em cascata.
// - Framer Motion (declarativo, bom pra estado por item): o anel de
//   barrinhas tipo equalizador/onda sonora, cada uma com seu próprio
//   delay, formando uma onda girando ao redor do card.
//
// Cor é fixa em azul-tech por decisão explícita do Elias pra este efeito
// específico (não passa por corTema — é a identidade visual do efeito,
// não um acento estrutural do tema).
const AZUL_ENERGIA = "#3b82f6";
const AZUL_ENERGIA_GLOW = "#60a5fa";

export function EnergyAura({
  cor = AZUL_ENERGIA,
  corGlow = AZUL_ENERGIA_GLOW,
  raio = 190,
  barras = 28,
  children,
  className = "",
}: {
  cor?: string;
  corGlow?: string;
  raio?: number;
  barras?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const reduzido = useReducedMotion();
  const rippleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (reduzido) return;
    const tweens = rippleRefs.current
      .filter((el): el is HTMLDivElement => !!el)
      .map((el, i) =>
        gsap.fromTo(
          el,
          { scale: 0.5, opacity: 0.5 },
          { scale: 1.7, opacity: 0, duration: 2.6, repeat: -1, delay: i * 0.85, ease: "power1.out" }
        )
      );
    return () => { tweens.forEach((t) => t.kill()); };
  }, [reduzido]);

  const angulos = Array.from({ length: barras }, (_, i) => (360 / barras) * i);

  return (
    <div className={`relative ${className}`}>
      <div className="absolute -inset-8 md:-inset-11 pointer-events-none flex items-center justify-center" aria-hidden="true">
        {/* Pulsos de sonar — GSAP */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => { rippleRefs.current[i] = el; }}
            className="absolute rounded-full"
            style={{ width: raio * 1.3, height: raio * 1.3, border: `1px solid ${cor}`, opacity: 0 }}
          />
        ))}

        {/* Brilho ambiente estático */}
        <div
          className="absolute rounded-full"
          style={{ width: raio * 1.6, height: raio * 1.6, background: `radial-gradient(circle, ${corGlow}30, transparent 70%)`, filter: "blur(18px)" }}
        />

        {/* Anel de onda sonora — Framer Motion */}
        <div className="absolute inset-0">
          {angulos.map((deg, i) => (
            <div key={i} className="absolute left-1/2 top-1/2" style={{ transform: `rotate(${deg}deg)` }}>
              <motion.div
                className="rounded-full"
                style={{
                  position: "absolute",
                  left: -1.5,
                  top: -(raio / 2) - 16,
                  width: 3,
                  height: 14,
                  background: `linear-gradient(180deg, ${corGlow}, ${cor})`,
                  transformOrigin: "50% 100%",
                  boxShadow: `0 0 6px 1px ${cor}80`,
                }}
                animate={reduzido ? undefined : { scaleY: [0.35, 1, 0.35], opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: (i / angulos.length) * 1.3 }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default EnergyAura;
