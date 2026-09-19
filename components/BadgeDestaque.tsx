"use client";
import { Star } from "lucide-react";
import { CORES } from "../lib/cfoCore";
import { useThemeAxioma } from "../lib/ThemeContext";

// Selo premium permanente (reutilizável — MEI hoje, PDV depois).
// Dourado champagne discreto no Escuro (identidade original, intocada).
// Dourado não é cor da paleta padrão (tema-tokens.md) - no Claro vira
// verde-menta, mesma regra já aplicada em todo o resto do app.
const LABELS: Record<string, string> = { pt: "PRO", en: "PRO", es: "PRO" };

export function BadgeDestaque({ lang = "pt", label }: { lang?: string; label?: string }) {
  const { tema } = useThemeAxioma();
  const cor = tema === "xms" ? "#2ecc9b" : CORES.ouro;
  const texto = label || LABELS[lang] || LABELS.pt;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-full"
      style={{
        background: `linear-gradient(135deg, ${cor}22, ${cor}10)`,
        color: cor,
        border: `1px solid ${cor}50`,
        boxShadow: `0 0 8px ${cor}30`,
      }}
    >
      <Star size={9} fill={cor} strokeWidth={0} />
      {texto}
    </span>
  );
}

export default BadgeDestaque;
