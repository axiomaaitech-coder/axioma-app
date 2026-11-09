"use client";
// Cartão "Indicadores de pessoas (CFO)" (2026-11-09, item 4): pessoal sobre o faturamento, faturamento/custo/lucro por pessoa e
// o headcount de cada Centro de Custo × o real do RH. Mesma conta da IA (lib/rhIndicadores + lib/rhIndicadoresBase). Só lê.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gauge, AlertTriangle } from "lucide-react";
import { CanvasBox } from "../CanvasBox";
import { createBrowserClient } from "../../lib/supabaseBrowser";
import { obterEmpresaAtiva } from "../../lib/empresaHelpers";
import { hojeISO } from "../../lib/datas";
import { lerPodeRh } from "../../lib/rhAcesso";
import { carregarIndicadoresPessoas } from "../../lib/rhIndicadoresBase";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
type Lang = "pt" | "en" | "es";
const brl = (n: number | null) => (n == null ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));

export function IndicadoresPessoasCard({ lang, temaClaro, ondeEsta }: { lang: Lang; temaClaro: boolean; ondeEsta?: "rh" | "centros-custo" }) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [d, setD] = useState<{ estado: "carregando" | "sem_acesso" | "erro" | "ok"; r?: Awaited<ReturnType<typeof carregarIndicadoresPessoas>> }>({ estado: "carregando" });
  useEffect(() => { void (async () => {
    const eid = await obterEmpresaAtiva();
    if (!eid) { setD({ estado: "sem_acesso" }); return; }
    const pode = await lerPodeRh(supabase, eid, ["ver", "salario"]);
    if (!pode) { setD({ estado: "erro" }); return; }
    if (!pode.ver || !pode.salario) { setD({ estado: "sem_acesso" }); return; }
    try { setD({ estado: "ok", r: await carregarIndicadoresPessoas(supabase, eid, hojeISO(), true) }); } catch { setD({ estado: "erro" }); }
  })(); }, []);
  const verde = temaClaro ? "#0f7a5a" : "#2ecc9b", laranja = temaClaro ? "#9a3412" : "#fbbf24", texto2 = temaClaro ? "#374151" : "var(--axi-text-secondary)", titulo = temaClaro ? "#101b3d" : "var(--axi-text-primary)";
  const nested = { background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: `1px solid ${temaClaro ? "rgba(16,27,61,0.12)" : "rgba(163,177,194,0.15)"}` };
  const cartao = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : { premium3d: true };
  const alerta = (a: string) => (lang === "pt" ? a : a.startsWith("o custo de pessoal passa") ? L("", "personnel cost exceeds average monthly revenue", "el costo de personal supera la facturación media mensual")
    : a.startsWith("a folha não está") ? L("", "payroll is not (fully) entered in Fixed Costs: the income statement profit is higher than the real one", "la nómina no está (toda) registrada en Costos Fijos: la utilidad del estado de resultados es mayor que la real")
    : L("", "cost centers with a \"headcount\" different from HR: allocation by people uses the typed number", "centros de costo con \"headcount\" distinto de RR. HH.: el prorrateo por personas usa el número digitado"));
  return (
    <CanvasBox cor={verde} {...cartao}>
      <p className="text-sm font-black flex items-center gap-2 mb-3" style={{ color: titulo }}><Gauge size={16} /> {L("Indicadores de pessoas (CFO)", "People indicators (CFO)", "Indicadores de personas (CFO)")}</p>
      {d.estado === "carregando" ? <p className="text-sm" style={{ color: texto2 }}>{L("Calculando…", "Calculating…", "Calculando…")}</p>
      : d.estado === "sem_acesso" ? <p className="text-sm" style={{ color: texto2 }}>{L("Só para quem tem a liberação de salário do RH.", "Only for people with HR salary access.", "Solo para quien tiene habilitación de salario en RR. HH.")}</p>
      : d.estado === "erro" || !d.r ? <p className="text-sm" style={{ color: texto2 }}>{L("Não foi possível calcular agora (falha de conexão). Recarregue a página.", "Could not calculate now (connection failure). Reload the page.", "No se pudo calcular ahora (falla de conexión). Recargue la página.")}</p>
      : (() => { const r = d.r!; return (<>
        {r.alertas.length > 0 && <ul className="space-y-1 mb-3 text-xs">{r.alertas.map((a) => <li key={a} className="flex gap-2 font-semibold" style={{ color: laranja }}><AlertTriangle size={14} className="shrink-0" /> {alerta(a)}</li>)}</ul>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[[L("Pessoal sobre o faturamento", "Personnel over revenue", "Personal sobre la facturación"), r.pessoal_sobre_faturamento_pct == null ? "—" : `${String(r.pessoal_sobre_faturamento_pct).replace(".", ",")}%`],
            [L("Faturamento por pessoa / mês", "Revenue per person / month", "Facturación por persona / mes"), brl(r.faturamento_por_pessoa)],
            [L("Custo médio por pessoa / mês", "Average cost per person / month", "Costo medio por persona / mes"), brl(r.custo_medio_por_pessoa)],
            [L("Lucro por pessoa / mês", "Profit per person / month", "Utilidad por persona / mes"), brl(r.lucro_por_pessoa)]].map(([n, v]) => (
            <div key={n} className="rounded-xl p-2" style={nested}><p style={{ color: texto2 }}>{n}</p><p className="font-bold text-sm" style={{ color: titulo }}>{v}</p></div>))}
        </div>
        <p className="text-xs mt-2" style={{ color: texto2 }}>{L(`${r.pessoas} pessoa(s) ativa(s); médias mensais da DRE de ${r.periodo_dre.de.split("-").reverse().join("/")} a ${r.periodo_dre.ate.split("-").reverse().join("/")}.`, `${r.pessoas} active person(s); monthly averages of the income statement from ${r.periodo_dre.de} to ${r.periodo_dre.ate}.`, `${r.pessoas} persona(s) activa(s); promedios mensuales del estado de resultados de ${r.periodo_dre.de.split("-").reverse().join("/")} a ${r.periodo_dre.ate.split("-").reverse().join("/")}.`)}</p>
        {r.centros.length > 0 && <div className="mt-3">
          <p className="text-xs font-bold mb-1" style={{ color: titulo }}>{L("Headcount dos Centros de Custo × RH", "Cost center headcount × HR", "Headcount de los Centros de Costo × RR. HH.")}</p>
          <ul className="text-xs space-y-1">{r.centros.map((c) => (
            <li key={c.nome} className="flex justify-between gap-2 rounded-lg px-2 py-1" style={nested}>
              <span style={{ color: titulo }}>{c.nome}</span>
              <span style={{ color: c.confere === false ? laranja : texto2 }}>{L("digitado", "typed", "digitado")}: <b>{c.headcountCadastrado ?? "—"}</b> · RH: <b>{c.pessoasRh}</b> {c.confere === true ? "✓" : c.confere === false ? "⚠" : ""}</span>
            </li>))}</ul>
          {ondeEsta !== "centros-custo" && <Link href="/centros-custo" className="inline-block mt-1 text-xs underline font-bold" style={{ color: verde }}>{L("Abrir Centros de Custo ›", "Open Cost Centers ›", "Abrir Centros de Costo ›")}</Link>}
        </div>}
      </>); })()}
    </CanvasBox>
  );
}
