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
  /** Opt-in — fundo branco + texto azul-marinho (tema Claro), no lugar do
   * fundo escuro fixo de sempre (que fica ilegível sobre página clara).
   * undefined = comportamento idêntico ao de sempre. */
  temaClaro?: boolean;
};

// Seletor de período — compartilhado por todos os módulos CFO.
// Controla qual janela de tempo alimenta comparativo, narrativa, anomalias e projeção.
export default function SeletorPeriodo({ preset, onChangePreset, personalizado, onChangePersonalizado, cor, lang, temaClaro }: Props) {
  const cx = cfoT(lang);
  const campoBg = temaClaro ? "#ffffff" : "rgba(10,22,40,0.9)";
  const campoInputBg = temaClaro ? "#ffffff" : "rgba(255,255,255,0.04)";
  const campoTexto = temaClaro ? "#101b3d" : cor;
  const campoInputTexto = temaClaro ? "#101b3d" : "#c8d8f0";
  const separador = temaClaro ? "#374151" : "#5a7a9a";

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
        style={{ background: campoBg, border: `1px solid ${cor}40`, color: campoTexto }}
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
            style={{ background: campoInputBg, border: `1px solid ${cor}30`, color: campoInputTexto }}
          />
          <span style={{ color: separador }}>—</span>
          <input
            type="date"
            value={personalizado.fim}
            onChange={(e) => onChangePersonalizado({ ...personalizado, fim: e.target.value })}
            className="px-3 py-2 rounded-xl text-xs focus:outline-none"
            style={{ background: campoInputBg, border: `1px solid ${cor}30`, color: campoInputTexto }}
          />
        </div>
      )}
    </div>
  );
}
