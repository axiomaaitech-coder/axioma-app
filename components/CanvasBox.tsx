"use client";
import { ReactNode } from "react";
import { motion } from "motion/react";

// CanvasBox LIMPO — borda sutil + acento estático no topo. Sem partículas, sem piscar.
// Aceita corB/corC/corD por compatibilidade com os módulos antigos (são ignorados).
//
// `motionIndex`/`glow` são opt-in (undefined por padrão) — sem eles o card
// renderiza exatamente como sempre renderizou, então nenhum dos outros
// módulos que já usam CanvasBox muda de comportamento. Só telas que passam
// esses props explicitamente (MEI Painel/Cockpit, nesta rodada) ganham a
// entrada em fade+slide-up com stagger e o brilho discreto no hover.
// Sombra "painel 3D" (bisel de luz) + glow verde no hover — valores exatos de
// public/referencias/tema-tokens.md §4/§5.1, usados só quando premium3d=true
// (opt-in, hoje só o tema Claro do MEI passa isso).
const SOMBRA_3D = "inset 0 1px 0 0 rgba(255,255,255,0.12), inset 0 -1px 0 0 rgba(0,0,0,0.25), 0 1px 2px rgba(16,27,61,0.3), 0 24px 48px -12px rgba(16,27,61,0.55)";

export function CanvasBox({
  children,
  cor = "#6ab0ff",
  motionIndex,
  glow = false,
  destaque = false,
  fundo: fundoProp,
  premium3d = false,
}: {
  children: ReactNode;
  cor?: string;
  corB?: string;
  corC?: string;
  corD?: string;
  motionIndex?: number;
  glow?: boolean;
  /** Card "de destaque" (opt-in) — no tema Claro o fundo (var(--axi-card-destaque-bg))
   * ganha um tingimento azul pra se destacar do card branco comum. No
   * "dark" não muda nada (mesmo --axi-surface de sempre). */
  destaque?: boolean;
  /** Sobrescreve o fundo do card (opt-in) — usado pro card "creme" do tema
   * Claro (public/referencias). Tem prioridade sobre `destaque`. */
  fundo?: string;
  /** Efeito "card premium"/"block navy 3D" da referência (opt-in): sombra com
   * bisel de luz + barra verde no topo que aparece no hover + glow verde. */
  premium3d?: boolean;
}) {
  const classeDestaque = destaque ? " axi-card-destaque" : "";
  const classePremium3d = premium3d ? " axi-card-premium3d" : "";
  const fundo = fundoProp ?? (destaque ? "var(--axi-card-destaque-bg)" : "var(--axi-surface)");
  const conteudo = (
    <>
      {/* acento fino no topo (estático) */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}80, transparent)` }}
      />
      {glow && (
        <div
          className="axi-card-glare absolute inset-0 pointer-events-none opacity-0"
          style={{ background: `linear-gradient(115deg, transparent 30%, ${cor}18 50%, transparent 70%)` }}
        />
      )}
      {premium3d && (
        <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: "#2ecc9b" }} />
      )}
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </>
  );

  const boxShadow = premium3d ? SOMBRA_3D : "0 1px 2px rgba(0,0,0,0.3)";

  if (motionIndex === undefined && !glow) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden${classeDestaque}${classePremium3d}`}
        style={{
          background: fundo,
          border: `1px solid ${cor}26`,
          boxShadow,
        }}
      >
        {conteudo}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: (motionIndex ?? 0) * 0.06 }}
      whileHover={glow ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`relative rounded-2xl overflow-hidden${glow ? " axi-card-hoverglow" : ""}${classeDestaque}${classePremium3d}`}
      style={{
        background: fundo,
        border: `1px solid ${cor}26`,
        boxShadow,
      }}
    >
      {conteudo}
    </motion.div>
  );
}

export default CanvasBox;
