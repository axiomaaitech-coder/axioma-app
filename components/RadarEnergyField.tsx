"use client";
import { ReactNode } from "react";

// Card "campo de energia" (espaço) pra envolver um elemento "hero" (hoje: o
// radar de Score 360 da IA Financeira). Fundo azul-marinho fixo (não segue
// tema Claro/Escuro, decorativo puro) com 3 camadas: linhas de fundo quase
// paradas, feixes de luz correndo por cima delas, cometas cruzando o campo e
// uma chuva de estrelas — todas com um "buraco" (mask) no centro pra passar
// por trás/pelos lados do conteúdo, nunca por cima. Aprovado via protótipo
// isolado antes de entrar aqui. Reservado pra um único elemento "hero" por
// tela, não é decoração genérica pra espalhar em outros cards.
const ESTRELAS = [
  { left: 25.6, size: 1.33, dur: 14.6, delay: -2.4, dx: 4, peak: 0.87 },
  { left: 94.6, size: 1.9, dur: 6.85, delay: -8.66, dx: -13, peak: 0.55 },
  { left: 86.8, size: 0.73, dur: 7.53, delay: -11.33, dx: -18, peak: 0.84 },
  { left: 68.8, size: 1.03, dur: 10.09, delay: -10.78, dx: -7, peak: 0.61 },
  { left: 26.2, size: 1.91, dur: 14.06, delay: -1.49, dx: -4, peak: 0.56 },
  { left: 53.0, size: 1.56, dur: 13.25, delay: -11.84, dx: -2, peak: 0.67 },
  { left: 64.0, size: 0.85, dur: 6.38, delay: -7.63, dx: -12, peak: 0.84 },
  { left: 5.0, size: 0.83, dur: 6.53, delay: -5.92, dx: -17, peak: 0.7 },
  { left: 38.3, size: 1.18, dur: 11.41, delay: -8.06, dx: -18, peak: 0.57 },
  { left: 4.7, size: 1.99, dur: 7.76, delay: -8.01, dx: 12, peak: 0.86 },
  { left: 9.3, size: 2.12, dur: 11.22, delay: -2.08, dx: 3, peak: 0.84 },
  { left: 46.5, size: 1.43, dur: 10.09, delay: -10.7, dx: -4, peak: 0.56 },
  { left: 64.8, size: 1.73, dur: 13.46, delay: -12.97, dx: 16, peak: 0.43 },
  { left: 87.9, size: 1.57, dur: 7.65, delay: -2.52, dx: -13, peak: 0.56 },
  { left: 67.7, size: 1.3, dur: 6.26, delay: -4.52, dx: -2, peak: 0.57 },
  { left: 91.5, size: 1.77, dur: 13.98, delay: -0.26, dx: -3, peak: 0.51 },
  { left: 61.0, size: 1.11, dur: 8.39, delay: -5.57, dx: -3, peak: 0.88 },
  { left: 42.2, size: 1.2, dur: 12.7, delay: -9.26, dx: -5, peak: 0.79 },
  { left: 7.5, size: 1.61, dur: 7.86, delay: -4.73, dx: 13, peak: 0.61 },
  { left: 53.7, size: 1.95, dur: 13.87, delay: -8.06, dx: 7, peak: 0.82 },
  { left: 84.6, size: 1.46, dur: 14.2, delay: -2.68, dx: -15, peak: 0.52 },
  { left: 2.6, size: 1.38, dur: 7.32, delay: -4.58, dx: -9, peak: 0.62 },
  { left: 51.3, size: 0.74, dur: 12.08, delay: -11.58, dx: -8, peak: 0.82 },
  { left: 92.4, size: 1.07, dur: 9.04, delay: -3.04, dx: -19, peak: 0.58 },
  { left: 36.9, size: 1.38, dur: 12.57, delay: -3.22, dx: -10, peak: 0.67 },
  { left: 48.4, size: 1.3, dur: 14.4, delay: -1.84, dx: 19, peak: 0.73 },
  { left: 27.8, size: 0.85, dur: 13.12, delay: -13.05, dx: -1, peak: 0.69 },
  { left: 2.4, size: 2.23, dur: 10.33, delay: -8.38, dx: -16, peak: 0.6 },
  { left: 97.2, size: 0.99, dur: 9.75, delay: -5.01, dx: -10, peak: 0.52 },
  { left: 80.8, size: 2.16, dur: 9.76, delay: -3.85, dx: -4, peak: 0.83 },
  { left: 18.0, size: 1.35, dur: 6.47, delay: -0.99, dx: -16, peak: 0.44 },
  { left: 94.7, size: 1.81, dur: 10.81, delay: -11.26, dx: 18, peak: 0.87 },
  { left: 49.1, size: 2.27, dur: 10.68, delay: -0.57, dx: 6, peak: 0.77 },
  { left: 38.2, size: 1.4, dur: 9.03, delay: -8.72, dx: 17, peak: 0.64 },
  { left: 16.8, size: 1.16, dur: 10.42, delay: -8.47, dx: 1, peak: 0.49 },
  { left: 55.8, size: 1.53, dur: 13.5, delay: -5.17, dx: -15, peak: 0.83 },
  { left: 14.7, size: 0.79, dur: 12.68, delay: -7.09, dx: 14, peak: 0.8 },
  { left: 43.6, size: 1.87, dur: 11.16, delay: -9.82, dx: -3, peak: 0.66 },
  { left: 68.3, size: 1.86, dur: 9.7, delay: -4.61, dx: 18, peak: 0.62 },
  { left: 17.1, size: 2.26, dur: 12.32, delay: -10.72, dx: -18, peak: 0.85 },
];

const COMETAS = [
  { left: 78, len: 150, cor: "#eaf4ff", dur: 2.6, delay: 0 },
  { left: 48, len: 95, cor: "#aee0ff", dur: 3.4, delay: 0.9 },
  { left: 92, len: 170, cor: "#eaf4ff", dur: 2.2, delay: 1.8 },
  { left: 20, len: 80, cor: "#9bf7d4", dur: 3.8, delay: 2.4 },
  { left: 62, len: 120, cor: "#eaf4ff", dur: 3.0, delay: 3.3 },
  { left: 8, len: 100, cor: "#aee0ff", dur: 2.8, delay: 4.1 },
];

export function RadarEnergyField({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "radial-gradient(120% 90% at 50% 10%, #0f2040 0%, #0a1628 42%, #04070f 100%)",
        border: "1px solid rgba(120,170,255,0.4)",
        boxShadow: "inset 0 1px 0 0 rgba(255,255,255,.06), 0 0 0 1px rgba(0,0,0,.4), 0 0 60px -10px rgba(106,176,255,.25)",
      }}
    >
      <div className="axi-energy-stars" />

      <div className="axi-energy-starfall">
        {ESTRELAS.map((s, i) => (
          <div
            key={i}
            className="axi-falling-star"
            style={{
              left: `${s.left}%`,
              width: s.size, height: s.size,
              boxShadow: `0 0 ${(s.size * 2.2).toFixed(1)}px rgba(255,255,255,.75)`,
              animationDuration: `${s.dur}s`,
              animationDelay: `${s.delay}s`,
              ["--dx" as any]: `${s.dx}px`,
              ["--peak" as any]: s.peak,
            }}
          />
        ))}
      </div>

      <svg className="axi-energy-field" viewBox="0 0 480 480" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="axiBeamGrad1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6ab0ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#aee0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ab0ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="axiBeamGrad2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0" />
            <stop offset="50%" stopColor="#9bf7d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path className="axi-base-path" d="M -20 90  C 140 40, 260 160, 500 70" style={{ animationDelay: "-2s" }} />
        <path className="axi-base-path" d="M -20 160 C 120 220, 300 80,  500 180" style={{ animationDelay: "-6s" }} />
        <path className="axi-base-path" d="M -20 260 C 160 300, 260 220, 500 300" style={{ animationDelay: "-1s" }} />
        <path className="axi-base-path" d="M -20 360 C 140 320, 300 420, 500 340" style={{ animationDelay: "-9s" }} />
        <path className="axi-base-path" d="M -20 420 C 180 460, 260 400, 500 440" style={{ animationDelay: "-4s" }} />
        <path className="axi-base-path" d="M 60 -20 C 10 140, 130 260, 70 500" style={{ animationDelay: "-7s" }} />
        <path className="axi-base-path" d="M 420 -20 C 470 160, 350 260, 430 500" style={{ animationDelay: "-3s" }} />

        <path className="axi-beam-path" d="M -20 90  C 140 40, 260 160, 500 70" stroke="url(#axiBeamGrad1)" style={{ animationDuration: "5s", animationDelay: "-1s", color: "#6ab0ff" }} />
        <path className="axi-beam-path" d="M -20 260 C 160 300, 260 220, 500 300" stroke="url(#axiBeamGrad2)" style={{ animationDuration: "6.4s", animationDelay: "-3s", color: "#34d399" }} />
        <path className="axi-beam-path" d="M -20 420 C 180 460, 260 400, 500 440" stroke="url(#axiBeamGrad1)" style={{ animationDuration: "5.6s", animationDelay: "-5s", color: "#6ab0ff" }} />
        <path className="axi-beam-path" d="M 60 -20 C 10 140, 130 260, 70 500" stroke="url(#axiBeamGrad2)" style={{ animationDuration: "7.2s", animationDelay: "-2s", color: "#34d399" }} />
      </svg>

      {COMETAS.map((m, i) => (
        <div
          key={i}
          className="axi-meteor"
          style={{
            left: `${m.left}%`,
            animationDuration: `${m.dur}s`,
            animationDelay: `${m.delay}s`,
            ["--len" as any]: `${m.len}px`,
            ["--mc" as any]: m.cor,
          }}
        >
          <div className="axi-meteor-tail" />
          <div className="axi-meteor-head" />
        </div>
      ))}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default RadarEnergyField;
