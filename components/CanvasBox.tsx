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
export function CanvasBox({
  children,
  cor = "#6ab0ff",
  motionIndex,
  glow = false,
  destaque = false,
}: {
  children: ReactNode;
  cor?: string;
  corB?: string;
  corC?: string;
  corD?: string;
  motionIndex?: number;
  glow?: boolean;
  /** Card "de destaque" (opt-in) — no tema Esmeralda ganha fundo verde
   * sólido + texto branco (var(--axi-card-destaque-*)); em "dark"/"xms"
   * não muda nada (o token cai de volta em --axi-surface normal). */
  destaque?: boolean;
}) {
  const classeDestaque = destaque ? " axi-card-destaque" : "";
  const fundo = destaque ? "var(--axi-card-destaque-bg)" : "var(--axi-surface)";
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
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </>
  );

  if (motionIndex === undefined && !glow) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden${classeDestaque}`}
        style={{
          background: fundo,
          border: `1px solid ${cor}26`,
          boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
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
      className={`relative rounded-2xl overflow-hidden${glow ? " axi-card-hoverglow" : ""}${classeDestaque}`}
      style={{
        background: fundo,
        border: `1px solid ${cor}26`,
        boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {conteudo}
    </motion.div>
  );
}

export default CanvasBox;
