"use client";

// Fundo "aurora" — 2 manchas de gradiente que se movem muito devagar
// (42s, ver @keyframes axiAurora em globals.css), só pra módulos/seções
// com mais espaço vazio ganharem um elemento vivo e discreto. Só
// transform (60fps), pointer-events:none, respeita prefers-reduced-motion
// via CSS. Opt-in — nenhuma tela herda isso sem importar.
export function AuroraBackground({ corA = "var(--axi-accent)", corB = "#a78bfa" }: { corA?: string; corB?: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="axi-aurora-blob absolute rounded-full"
        style={{ width: "60%", height: "60%", left: "-10%", top: "-15%", background: corA, opacity: 0.08, filter: "blur(60px)" }}
      />
      <div
        className="axi-aurora-blob absolute rounded-full"
        style={{ width: "50%", height: "50%", right: "-10%", bottom: "-10%", background: corB, opacity: 0.06, filter: "blur(60px)", animationDelay: "-21s" }}
      />
    </div>
  );
}

export default AuroraBackground;
