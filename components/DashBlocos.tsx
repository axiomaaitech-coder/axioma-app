"use client";
// ═══════════════════════════════════════════════════════════════
// Blocos visuais compartilhados pelos 2 painéis do Dashboard principal
// (DashFinanceiro / DashComercial) — antes cada um tinha uma cópia idêntica
// de KPIs, letreiro, caixa de gráfico, painel e botão/aviso de demo.
//
// `claro` = tema Claro (tema-tokens.md): card de seção creme #f6f7c4 +
// premium3d, caixinha interna bege, texto azul-marinho/#374151, letreiro
// sólido navy com destaque verde-menta, demo sem dourado (verde-menta),
// botão de utilidade verde sólido. claro=false = visual de sempre.
// ═══════════════════════════════════════════════════════════════
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import ReactECharts from "echarts-for-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { useThemeAxioma } from "../lib/ThemeContext";

const OURO = "#d4af37", OURO_C = "#f0d878";
const CARD_CLARO = { background: "#f6f7c4", border: "1px solid rgba(16,27,61,0.12)" };
const NESTED_CLARO = { background: "rgba(255,255,255,0.5)", border: "1px solid rgba(16,27,61,0.12)" };
const VERDE_SOLIDO = { background: "linear-gradient(135deg, #16a97d, #2ecc9b)", color: "#fff" };
const SELO_DEMO_CLARO = { background: "#2ecc9b", color: "#101b3d" };

export function useDashClaro() {
  const { tema } = useThemeAxioma();
  return tema === "xms";
}

export type KpiDash = { l: string; v: string; c: string; i: string; p: string; d?: string; up?: boolean };

export function BotaoDemo({ demo, onToggle, claro, rotulo }: { demo: boolean; onToggle: () => void; claro: boolean; rotulo: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={onToggle}
        className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
        style={claro
          ? (demo ? { background: "#2ecc9b", border: "1px solid #2ecc9b", color: "#101b3d" } : { background: "rgba(16,27,61,0.06)", border: "1px solid rgba(16,27,61,0.15)", color: "#374151" })
          : { background: demo ? `${OURO}25` : "rgba(255,255,255,0.05)", border: `1px solid ${demo ? OURO : "rgba(148,163,184,0.3)"}`, color: demo ? OURO_C : "#94a3b8" }}>
        🎭 {rotulo}
      </button>
    </div>
  );
}

export function BannerDemo({ claro, texto }: { claro: boolean; texto: string }) {
  return (
    <div className="w-full rounded-xl px-4 py-2.5 text-center" style={claro ? { background: "rgba(46,204,155,0.15)", border: "1px dashed #16a97d" } : { background: `${OURO}18`, border: `1px dashed ${OURO}` }}>
      <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: claro ? "#101b3d" : OURO_C }}>🎭 {texto}</span>
    </div>
  );
}

export function KpisDash({ kpis, demo, claro, rotuloDemo }: { kpis: KpiDash[]; demo: boolean; claro: boolean; rotuloDemo: string }) {
  const router = useRouter();
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((k, i) => (
        <div key={i} onClick={() => router.push(k.p)}
          className={`rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] relative${" axi-card-premium3d axi-card-faixa"}`}
          style={claro ? CARD_CLARO : { background: "linear-gradient(160deg, rgba(16,32,58,0.94), rgba(10,22,40,0.97))", border: `1px solid ${k.c}22`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
          onMouseEnter={claro ? undefined : (e) => { e.currentTarget.style.borderColor = `${k.c}60`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 26px ${k.c}22`; }}
          onMouseLeave={claro ? undefined : (e) => { e.currentTarget.style.borderColor = `${k.c}22`; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}>
          {demo && <span className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded font-black tracking-wider" style={claro ? SELO_DEMO_CLARO : { background: `${OURO}30`, color: OURO }}>🎭 {rotuloDemo}</span>}
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{k.i}</span>
            {k.d && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-black" style={claro
                ? { background: k.up ? "#16a97d" : "#ff5a6b", color: k.up ? "#ffffff" : "#2b0007" }
                : { background: k.up ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.16)", color: k.up ? "#10b981" : "#ef4444" }}>{k.d}</span>
            )}
          </div>
          {/* Claro: número em azul-marinho (legível no creme); a cor da categoria fica no Escuro */}
          <p className="text-lg font-black tracking-tight" style={{ color: claro ? "#101b3d" : k.c }}><AnimatedNumber value={k.v} /></p>
          <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: claro ? "#374151" : "#64748b" }}>{k.l}</p>
        </div>
      ))}
    </div>
  );
}

// Cores do Escuro de cada painel (primeiro item, separador, fundo, borda) — no
// Claro todos viram o letreiro padrão: sólido navy, texto branco, verde-menta.
export type CoresLetreiroEscuro = { primeiro: string; separador: string; fundo: string; borda: string };

export function LetreiroDash({ itens, demo, claro, escuro }: { itens: string[]; demo: boolean; claro: boolean; escuro: CoresLetreiroEscuro }) {
  const corItem = (i: number) => claro ? (i === 0 ? "#2ecc9b" : "#ffffff") : (i === 0 ? escuro.primeiro : demo ? OURO_C : "#e2e8f0");
  const corSep = claro ? "#2ecc9b" : demo ? OURO : escuro.separador;
  const linha = (prefixo: string) => itens.map((t, i) => (<span key={prefixo + i} style={{ color: corItem(i) }}>{t}<span style={{ color: corSep }}>{"  •  "}</span></span>));
  return (
    <div className="relative rounded-xl overflow-hidden" style={claro ? { background: "#101b3d", border: "1px solid #101b3d" } : { background: demo ? `linear-gradient(90deg, ${OURO}22, ${OURO}12)` : escuro.fundo, border: demo ? `1px solid ${OURO}55` : escuro.borda }}>
      <div className="marquee-dash py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
        <span className="text-sm font-bold tracking-wide">{linha("a")}</span>
        <span className="text-sm font-bold tracking-wide" aria-hidden>{linha("b")}</span>
      </div>
      <style>{`
        .marquee-dash { animation: marqueeDash 32s linear infinite; }
        @keyframes marqueeDash { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .marquee-dash:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}

export function PainelDash({ titulo, sub, barraEscuro, claro, children }: { titulo: string; sub: string; barraEscuro: { fundo: string; brilho: string }; claro: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-2xl overflow-hidden${" axi-card-premium3d axi-card-faixa"}`}
      style={claro ? CARD_CLARO : { background: "linear-gradient(160deg, rgba(16,32,58,0.94), rgba(10,22,40,0.97))", border: "1px solid rgba(46,204,155,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 rounded-full" style={{ background: claro ? "linear-gradient(180deg,#101b3d,#2ecc9b)" : barraEscuro.fundo, boxShadow: claro ? undefined : `0 0 12px ${barraEscuro.brilho}` }} />
          <div>
            <p className="text-base font-black" style={{ color: claro ? "#101b3d" : "#f1f5f9" }}>{titulo}</p>
            <p className="text-[10px] font-medium" style={{ color: claro ? "#374151" : "#64748b" }}>{sub}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ChartDash({ titulo, cor, path, option, altura, vazio, demo, claro, rotuloDemo, rotuloVerModulo }: {
  titulo: string; cor: string; path: string; option?: any; altura: number; vazio?: string;
  demo: boolean; claro: boolean; rotuloDemo: string; rotuloVerModulo: string;
}) {
  const router = useRouter();
  return (
    <div className="rounded-xl p-4 relative" style={claro ? NESTED_CLARO : { background: "rgba(2,8,16,0.55)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: claro ? "#2ecc9b" : cor, boxShadow: claro ? undefined : `0 0 8px ${cor}` }} />
          <p className="text-[13px] font-black" style={{ color: claro ? "#101b3d" : "#f1f5f9" }}>{titulo}</p>
          {demo && <span className="text-[9px] px-2 py-0.5 rounded font-black tracking-wider" style={claro ? SELO_DEMO_CLARO : { background: `${OURO}30`, color: OURO, border: `1px solid ${OURO}60` }}>🎭 {rotuloDemo}</span>}
        </div>
        <button onClick={() => router.push(path)} className="px-2 py-0.5 rounded-md text-[9px] font-bold transition-all hover:scale-105"
          style={claro ? VERDE_SOLIDO : { background: `${cor}15`, border: `1px solid ${cor}38`, color: cor }}>{rotuloVerModulo} →</button>
      </div>
      {option ? (
        <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
      ) : (
        <div className="flex items-center justify-center text-center px-4" style={{ height: altura, color: claro ? "#374151" : "#5a6a85", fontSize: 12, fontWeight: 600 }}>{vazio}</div>
      )}
    </div>
  );
}
