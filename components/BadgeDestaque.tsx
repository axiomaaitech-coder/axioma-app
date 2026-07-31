"use client";
import { Star } from "lucide-react";
import { CORES } from "../lib/cfoCore";

// Selo premium permanente (reutilizável — MEI hoje, PDV depois).
// Dourado champagne discreto, sem "carnaval": substitui o antigo selo
// laranja "NOVO" que envelhecia.
const LABELS: Record<string, string> = { pt: "PRO", en: "PRO", es: "PRO" };

export function BadgeDestaque({ lang = "pt", label }: { lang?: string; label?: string }) {
  const texto = label || LABELS[lang] || LABELS.pt;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${CORES.ouro}22, ${CORES.ouro}10)`,
        color: CORES.ouro,
        border: `1px solid ${CORES.ouro}50`,
        boxShadow: `0 0 8px ${CORES.ouro}30`,
      }}
    >
      <Star size={9} fill={CORES.ouro} strokeWidth={0} />
      {texto}
    </span>
  );
}

export default BadgeDestaque;
