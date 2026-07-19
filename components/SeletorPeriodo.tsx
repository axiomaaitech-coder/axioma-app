"use client";
import { Calendar } from "lucide-react";
import { cfoT } from "../lib/cfoTextos";
import type { Periodo, PeriodoPreset } from "../lib/cfoCore";

type Props = {
  preset: PeriodoPreset;
  onChangePreset: (p: PeriodoPreset) => void;
  personalizado: Periodo;
  onChangePersonalizado: (p: Periodo) => void;
  cor: string;
  lang: "pt" | "en" | "es";
};

// Seletor de período — compartilhado por todos os módulos CFO.
// Controla qual janela de tempo alimenta comparativo, narrativa, anomalias e projeção.
export default function SeletorPeriodo({ preset, onChangePreset, personalizado, onChangePersonalizado, cor, lang }: Props) {
  const cx = cfoT(lang);

  const opcoes: { valor: PeriodoPreset; label: string }[] = [
    { valor: "mes_atual", label: cx.periodoMesAtual },
    { valor: "mes_anterior", label: cx.periodoMesAnterior },
    { valor: "trimestre_atual", label: cx.periodoTrimestreAtual },
    { valor: "ano_atual", label: cx.periodoAnoAtual },
    { valor: "ultimos_12_meses", label: cx.periodoUltimos12 },
    { valor: "personalizado", label: cx.periodoPersonalizado },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 px-2" style={{ color: cor }}>
        <Calendar size={14} />
      </div>
      <select
        value={preset}
        onChange={(e) => onChangePreset(e.target.value as PeriodoPreset)}
        className="px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
        style={{ background: "rgba(10,22,40,0.9)", border: `1px solid ${cor}40`, color: cor }}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>{o.label}</option>
        ))}
      </select>

      {preset === "personalizado" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={personalizado.inicio}
            onChange={(e) => onChangePersonalizado({ ...personalizado, inicio: e.target.value })}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cor}30`, color: "#c8d8f0" }}
          />
          <span style={{ color: "#5a7a9a" }}>—</span>
          <input
            type="date"
            value={personalizado.fim}
            onChange={(e) => onChangePersonalizado({ ...personalizado, fim: e.target.value })}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cor}30`, color: "#c8d8f0" }}
          />
        </div>
      )}
    </div>
  );
}
