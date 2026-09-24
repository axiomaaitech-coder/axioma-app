"use client";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// Card azul com ondas sonoras de verdade — linhas onduladas horizontais,
// tipo onda do mar/forma de onda de áudio, fluindo continuamente lado a
// lado, em camadas (cada uma num tom de azul e velocidade diferente,
// "tocando em sinfonia"). Reservado pro elemento "hero" de uma tela (hoje:
// o radar de Score 360° da IA Financeira) — não é decoração genérica pra
// espalhar em outros cards.
//
// Técnica: cada onda é um <path> SVG com um padrão senoidal que se repete
// a cada 300 unidades; o GSAP desloca o path em X por exatamente um
// período (-300) num loop infinito e linear — como o desenho se repete
// exatamente nesse ponto, o "salto" do fim do loop pro início é invisível,
// e o efeito visual é uma onda que nunca para de correr. Só transform
// (translateX), GPU-only. Respeita prefers-reduced-motion (fica parado).
export function SoundWaveCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const wave1 = useRef<SVGPathElement>(null);
  const wave2 = useRef<SVGPathElement>(null);
  const wave3 = useRef<SVGPathElement>(null);

  useEffect(() => {
    const reduzido = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduzido) return;
    const tweens = [
      wave1.current ? gsap.to(wave1.current, { x: -300, duration: 6, repeat: -1, ease: "none" }) : null,
      wave2.current ? gsap.to(wave2.current, { x: -300, duration: 9, repeat: -1, ease: "none" }) : null,
      wave3.current ? gsap.to(wave3.current, { x: -300, duration: 13, repeat: -1, ease: "none" }) : null,
    ].filter((t): t is gsap.core.Tween => !!t);
    return () => { tweens.forEach((t) => t.kill()); };
  }, []);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: "linear-gradient(180deg, #0b2559 0%, #123a7a 55%, #1a4a99 100%)", border: "1px solid rgba(96,165,250,0.4)" }}
    >
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 300" preserveAspectRatio="none" aria-hidden="true">
        <path ref={wave3} d="M0,80 C50,40 100,120 150,80 C200,40 250,120 300,80 C350,40 400,120 450,80 C500,40 550,120 600,80 C650,40 700,120 750,80 C800,40 850,120 900,80 C950,40 1000,120 1050,80 C1100,40 1150,120 1200,80" fill="none" stroke="#1e40af" strokeWidth="3" opacity="0.55" />
        <path ref={wave2} d="M0,150 C50,105 100,195 150,150 C200,105 250,195 300,150 C350,105 400,195 450,150 C500,105 550,195 600,150 C650,105 700,195 750,150 C800,105 850,195 900,150 C950,105 1000,195 1050,150 C1100,105 1150,195 1200,150" fill="none" stroke="#3b82f6" strokeWidth="3" opacity="0.6" />
        <path ref={wave1} d="M0,220 C50,180 100,260 150,220 C200,180 250,260 300,220 C350,180 400,260 450,220 C500,180 550,260 600,220 C650,180 700,260 750,220 C800,180 850,260 900,220 C950,180 1000,260 1050,220 C1100,180 1150,260 1200,220" fill="none" stroke="#93c5fd" strokeWidth="3" opacity="0.65" />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default SoundWaveCard;
