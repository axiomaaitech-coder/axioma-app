"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../lib/LanguageContext";
import { serieRolling } from "../lib/cfoCore";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import ReactECharts from "echarts-for-react";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const T = {
  pt: {
    demo: "DEMO",
    metaAnual: "Meta Anual", metasCadastradas: "Metas Cadastradas", clientesAtivos: "Clientes Ativos", aReceber: "A Receber",
    inadimplencia: "Inadimplência", investimentos: "Investimentos",
    painelTitulo: "Análise Comercial & Crescimento", painelSub: "Metas · Clientes · Recebíveis · Investimentos",
    metasT: "Metas vs. Realizado", meta: "Meta", realizado: "Realizado", projecao: "Projeção",
    clientes: "Novos Clientes", inad: "Inadimplência", receber: "Contas a Receber", invest: "Investimentos",
    aVencer: "A vencer", vence30: "Vence 30d", atraso: "Em atraso", renegociado: "Renegociado",
    rendaFixa: "Renda Fixa", acoes: "Ações", fundos: "Fundos", caixa: "Caixa",
    investRendaFixa: "Renda Fixa", investRendaVariavel: "Renda Variável", investCripto: "Criptomoeda", investImovel: "Imóvel", investOutro: "Outros",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    verDemo: "Ver demonstração", verMeusDados: "Ver meus dados", modoDemoAtivo: "MODO DEMONSTRAÇÃO — dados fictícios, não são da sua empresa",
    semMeta: "Nenhuma meta cadastrada ainda", metasCadastradasMsg: "cadastrada(s) — abra o módulo Metas para ver o progresso de cada uma.",
    semCliente: "Nenhum cliente novo no período", semInadimplencia: "Nenhuma conta em atraso — tudo em dia! 🎉",
    semReceber: "Nenhuma conta a receber registrada ainda", semInvestimento: "Nenhum investimento registrado ainda",
  },
  en: {
    demo: "DEMO",
    metaAnual: "Annual Goal", metasCadastradas: "Goals Registered", clientesAtivos: "Active Clients", aReceber: "Receivables",
    inadimplencia: "Delinquency", investimentos: "Investments",
    painelTitulo: "Sales & Growth Analysis", painelSub: "Goals · Clients · Receivables · Investments",
    metasT: "Goals vs. Actual", meta: "Goal", realizado: "Actual", projecao: "Forecast",
    clientes: "New Clients", inad: "Delinquency", receber: "Receivables", invest: "Investments",
    aVencer: "Upcoming", vence30: "Due 30d", atraso: "Overdue", renegociado: "Renegotiated",
    rendaFixa: "Fixed Income", acoes: "Stocks", fundos: "Funds", caixa: "Cash",
    investRendaFixa: "Fixed Income", investRendaVariavel: "Variable Income", investCripto: "Crypto", investImovel: "Real Estate", investOutro: "Other",
    verModulo: "View module", total: "TOTAL",
    meses: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    verDemo: "View demo", verMeusDados: "View my data", modoDemoAtivo: "DEMO MODE — sample data, not your company's",
    semMeta: "No goals registered yet", metasCadastradasMsg: "registered — open the Goals module to see progress on each.",
    semCliente: "No new clients in the period", semInadimplencia: "No overdue accounts — all clear! 🎉",
    semReceber: "No receivables registered yet", semInvestimento: "No investments registered yet",
  },
  es: {
    demo: "DEMO",
    metaAnual: "Meta Anual", metasCadastradas: "Metas Registradas", clientesAtivos: "Clientes Activos", aReceber: "Por Cobrar",
    inadimplencia: "Morosidad", investimentos: "Inversiones",
    painelTitulo: "Análisis Comercial & Crecimiento", painelSub: "Metas · Clientes · Cobrar · Inversiones",
    metasT: "Metas vs. Realizado", meta: "Meta", realizado: "Realizado", projecao: "Proyección",
    clientes: "Nuevos Clientes", inad: "Morosidad", receber: "Cuentas por Cobrar", invest: "Inversiones",
    aVencer: "Por vencer", vence30: "Vence 30d", atraso: "Atrasado", renegociado: "Renegociado",
    rendaFixa: "Renta Fija", acoes: "Acciones", fundos: "Fondos", caixa: "Caja",
    investRendaFixa: "Renta Fija", investRendaVariavel: "Renta Variable", investCripto: "Criptomoneda", investImovel: "Inmueble", investOutro: "Otros",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    verDemo: "Ver demostración", verMeusDados: "Ver mis datos", modoDemoAtivo: "MODO DEMOSTRACIÓN — datos ficticios, no son de su empresa",
    semMeta: "Aún no hay metas registradas", metasCadastradasMsg: "registrada(s) — abra el módulo Metas para ver el progreso de cada una.",
    semCliente: "Sin clientes nuevos en el período", semInadimplencia: "Sin cuentas atrasadas — ¡todo al día! 🎉",
    semReceber: "Aún no hay cuentas por cobrar registradas", semInvestimento: "Aún no hay inversiones registradas",
  },
};

const C = {
  ouro: "#d4af37", ouroC: "#f0d878", roxo: "#8b5cf6", roxoC: "#c4b5fd",
  cyan: "#06b6d4", cyanC: "#67e8f9", verde: "#10b981", verdeC: "#6ee7b7",
  vermelho: "#ef4444", vermelhoC: "#fca5a5", laranja: "#f97316", laranjaC: "#fdba74",
  rosa: "#ec4899", rosaC: "#f9a8d4", azul: "#3b82f6", azulC: "#93c5fd", indigo: "#6366f1", teal: "#14b8a6",
};

const fBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
const fK = (n: number) => Math.abs(n) >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${Math.round(n)}`;

// Dados de exemplo — só aparecem quando o usuário liga "Ver demonstração".
const D = {
  meta:      [ 20000, 20000, 22000, 22000, 24000, 24000, 26000, 26000, 28000, 28000, 30000, 30000],
  realizado: [ 18400, 21200, 19800, 24600, 23100, 27400, 25900, 22800, 31200, 29400, 34800, 38200],
  projecao:  [  null,  null,  null,  null,  null,  null,  null,  null,  null, 29400, 35600, 41000],
  novosClientes: [ 4800, 7200, 5400, 9100, 6800, 11200, 8400, 6100, 12800, 10400, 14600, 17200],
  inadimplencia: [ 3200, 2800, 4100, 2400, 3600, 1900, 2700, 4400, 2100, 3300, 1800, 1400],
  receber: [{ k:"aVencer", v:84000, c:C.verde }, { k:"vence30", v:42000, c:C.cyan }, { k:"atraso", v:18000, c:C.vermelho }, { k:"renegociado", v:11000, c:C.laranja }],
  invest:  [{ k:"rendaFixa", v:96000, c:C.ouro }, { k:"acoes", v:48000, c:C.roxo }, { k:"fundos", v:32000, c:C.cyan }, { k:"caixa", v:24000, c:C.teal }],
};

// Dados reais da empresa ativa — preenchidos via Supabase (RLS já filtra pela empresa do usuário).
type RealCom = {
  clientesAtivos: number;
  metasCount: number;
  receberTotal: number;
  receberAVencer: number;
  receberVence30: number;
  receberAtraso: number;
  inadTotal: number;
  inadSerie: number[];
  investTotal: number;
  investCategorias: { categoria: string; value: number }[];
  novosClientesSerie: number[];
};

const REAL_VAZIO: RealCom = {
  clientesAtivos: 0, metasCount: 0, receberTotal: 0, receberAVencer: 0, receberVence30: 0, receberAtraso: 0,
  inadTotal: 0, inadSerie: Array(12).fill(0), investTotal: 0, investCategorias: [], novosClientesSerie: Array(12).fill(0),
};

const tip = {
  backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
  textStyle: { color: "#e2e8f0", fontSize: 13 },
  extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
};

function barrasV(dados: number[], meses: string[], cor: string, corC: string) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    tooltip: { ...tip, trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${corC}">${fBRL(p.value)}</b>` },
    xAxis: { type: "category", data: meses,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false },
      axisLabel: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [{
      type: "bar", barWidth: "60%",
      itemStyle: {
        borderRadius: [8, 8, 2, 2],
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corC }, { offset: 1, color: cor }] },
        shadowColor: cor + "60", shadowBlur: 12,
      },
      label: { show: true, position: "top", distance: 6, color: "#f1f5f9", fontSize: 10, fontWeight: 800, formatter: (p: any) => fK(p.value) },
      emphasis: { itemStyle: { shadowBlur: 24 } },
      data: dados,
    }],
  };
}

function linhaMetas(tt: any) {
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 58, right: 24, top: 40, bottom: 30, containLabel: false },
    legend: { top: 2, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 18, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 }, data: [tt.realizado, tt.meta, tt.projecao] },
    tooltip: { ...tip, trigger: "axis", borderColor: C.roxo,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.filter(p => p.value != null).map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: tt.realizado, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: C.roxo, shadowColor: C.roxo + "90", shadowBlur: 14 },
        itemStyle: { color: C.roxo, borderColor: "#0a0820", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(139,92,246,0.38)" }, { offset: 1, color: "rgba(139,92,246,0)" }] } },
        data: D.realizado },
      { name: tt.meta, type: "line", smooth: false, symbol: "none",
        lineStyle: { width: 2.5, color: C.ouro, type: "dashed", shadowColor: C.ouro + "70", shadowBlur: 8 },
        itemStyle: { color: C.ouro }, data: D.meta },
      { name: tt.projecao, type: "line", smooth: true, symbol: "emptyCircle", symbolSize: 7,
        lineStyle: { width: 3, color: C.cyan, type: "dotted", shadowColor: C.cyan + "70", shadowBlur: 10 },
        itemStyle: { color: C.cyan, borderColor: "#0a0820", borderWidth: 2 }, data: D.projecao },
    ],
  };
}

function rosca(dados: { name: string; value: number; color: string }[], cor: string, centro: string) {
  const total = dados.reduce((a, b) => a + b.value, 0);
  return {
    backgroundColor: "transparent", animationDuration: 1000,
    tooltip: { ...tip, trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b> <span style="color:${cor}">${p.percent}%</span>` },
    legend: { orient: "vertical", right: 4, top: "center", itemWidth: 11, itemHeight: 11, itemGap: 12, icon: "circle",
      textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 600 },
      formatter: (name: string) => { const d = dados.find(x => x.name === name); const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0; return `${name}  ${pct}%`; } },
    series: [{ type: "pie", radius: ["54%", "80%"], center: ["34%", "52%"], avoidLabelOverlap: false,
      itemStyle: { borderColor: "rgba(10,8,32,0.95)", borderWidth: 3, borderRadius: 5 },
      label: { show: false }, labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 26, shadowColor: cor + "80" } },
      data: dados.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })) }],
    graphic: [
      { type: "text", left: "34%", top: "45%", style: { text: fK(total), textAlign: "center", fill: "#f1f5f9", fontSize: 18, fontWeight: 900 }, z: 10 },
      { type: "text", left: "34%", top: "55%", style: { text: centro, textAlign: "center", fill: "#64748b", fontSize: 9, fontWeight: 700 }, z: 10 },
    ],
  };
}

export default function DashComercial() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const [demo, setDemo] = useState(false);
  const [real, setReal] = useState<RealCom>(REAL_VAZIO);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const hoje = new Date();
      const hojeStr = hoje.toISOString().slice(0, 10);
      const em30 = new Date(hoje.getTime() + 30 * 86400000).toISOString().slice(0, 10);
      const doze = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1).toISOString().slice(0, 10);
      const empresaId = await obterEmpresaAtiva();
      if (!ativo) return;
      if (!empresaId) return;

      const [
        { count: clientesAtivos },
        { data: clientesRows },
        { count: metasCount },
        { data: contasReceber },
        { data: investimentos },
      ] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).eq("status", "ativo"),
        supabase.from("clientes").select("created_at").eq("empresa_id", empresaId).gte("created_at", doze),
        supabase.from("metas").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId),
        supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento").eq("empresa_id", empresaId),
        supabase.from("investimentos").select("valor, categoria").eq("empresa_id", empresaId),
      ]);
      if (!ativo) return;

      const novosClientesSerie = serieRolling((clientesRows || []).map((c: any) => ({ valor: 1, data: c.created_at })), 12).map(b => b.value);

      const receberAberto = (contasReceber || []).filter((c: any) => c.status !== "recebido");
      const saldo = (c: any) => Math.max(0, Number(c.valor || 0) - Number(c.valor_recebido || 0));
      const receberTotal = receberAberto.reduce((s: number, c: any) => s + saldo(c), 0);
      const receberAVencer = receberAberto.filter((c: any) => !c.data_vencimento || c.data_vencimento >= em30).reduce((s: number, c: any) => s + saldo(c), 0);
      const receberVence30 = receberAberto.filter((c: any) => c.data_vencimento && c.data_vencimento >= hojeStr && c.data_vencimento < em30).reduce((s: number, c: any) => s + saldo(c), 0);
      const receberAtraso = receberAberto.filter((c: any) => c.data_vencimento && c.data_vencimento < hojeStr).reduce((s: number, c: any) => s + saldo(c), 0);

      const vencidos = receberAberto.filter((c: any) => c.data_vencimento && c.data_vencimento < hojeStr);
      const inadTotal = vencidos.reduce((s: number, c: any) => s + saldo(c), 0);
      const inadSerie = serieRolling(vencidos.map((c: any) => ({ valor: saldo(c), data: c.data_vencimento })), 12).map(b => b.value);

      const investTotal = (investimentos || []).reduce((s: number, i: any) => s + Number(i.valor || 0), 0);
      const catInvest = new Map<string, number>();
      (investimentos || []).forEach((i: any) => { const k = i.categoria || "outro"; catInvest.set(k, (catInvest.get(k) || 0) + Number(i.valor || 0)); });
      const investCategorias = Array.from(catInvest, ([categoria, value]) => ({ categoria, value })).filter(c => c.value > 0);

      setReal({
        clientesAtivos: clientesAtivos || 0, metasCount: metasCount || 0,
        receberTotal, receberAVencer, receberVence30, receberAtraso,
        inadTotal, inadSerie, investTotal, investCategorias, novosClientesSerie,
      });
    })();
    return () => { ativo = false; };
  }, []);

  // ── Demo (fixo, só pra ilustrar o layout) ──
  const totalMetaDemo = D.meta.reduce((a, b) => a + b, 0);
  const totalRealDemo = D.realizado.reduce((a, b) => a + b, 0);
  const totalReceberDemo = D.receber.reduce((a, b) => a + b.v, 0);
  const totalInvestDemo = D.invest.reduce((a, b) => a + b.v, 0);
  const totalInadDemo = D.inadimplencia.reduce((a, b) => a + b, 0);
  const pctMetaDemo = Math.round((totalRealDemo / totalMetaDemo) * 100);

  const mapaCatInvest: Record<string, string> = {
    renda_fixa: tt.investRendaFixa, renda_variavel: tt.investRendaVariavel,
    criptomoeda: tt.investCripto, imovel: tt.investImovel, outro: tt.investOutro,
  };

  const kpis = demo ? [
    { l: tt.metaAnual, v: `${pctMetaDemo}%`, c: C.roxo, i: "🎯", p: "/metas", d: "▲ 6,2%", up: true },
    { l: tt.clientesAtivos, v: "128", c: C.azul, i: "👥", p: "/clientes", d: "▲ 14,8%", up: true },
    { l: tt.aReceber, v: fBRL(totalReceberDemo), c: C.verde, i: "📥", p: "/contas-receber", d: "▲ 9,4%", up: true },
    { l: tt.inadimplencia, v: fBRL(totalInadDemo / 12), c: C.vermelho, i: "⚠️", p: "/inadimplencia", d: "▼ 32,1%", up: true },
    { l: tt.investimentos, v: fBRL(totalInvestDemo), c: C.ouro, i: "💎", p: "/investimentos", d: "▲ 18,7%", up: true },
  ] : [
    { l: tt.metasCadastradas, v: `${real.metasCount}`, c: C.roxo, i: "🎯", p: "/metas" },
    { l: tt.clientesAtivos, v: `${real.clientesAtivos}`, c: C.azul, i: "👥", p: "/clientes" },
    { l: tt.aReceber, v: fBRL(real.receberTotal), c: C.verde, i: "📥", p: "/contas-receber" },
    { l: tt.inadimplencia, v: fBRL(real.inadTotal), c: C.vermelho, i: "⚠️", p: "/inadimplencia" },
    { l: tt.investimentos, v: fBRL(real.investTotal), c: C.ouro, i: "💎", p: "/investimentos" },
  ];

  const marquee = demo ? [
    `🚀 AXIOMA AI.TECH`, `🎭 ${tt.demo}`,
    `${tt.metaAnual} ${pctMetaDemo}%`,
    `${tt.clientesAtivos} 128`,
    `${tt.aReceber} ${fBRL(totalReceberDemo)}`,
    `${tt.inadimplencia} ${fBRL(totalInadDemo / 12)}`,
    `${tt.investimentos} ${fBRL(totalInvestDemo)}`,
  ] : [
    `🚀 AXIOMA AI.TECH`,
    `${tt.metasCadastradas} ${real.metasCount}`,
    `${tt.clientesAtivos} ${real.clientesAtivos}`,
    `${tt.aReceber} ${fBRL(real.receberTotal)}`,
    `${tt.inadimplencia} ${fBRL(real.inadTotal)}`,
    `${tt.investimentos} ${fBRL(real.investTotal)}`,
  ];

  const Chart = ({ titulo, cor, path, option, altura, vazio }: { titulo: string; cor: string; path: string; option?: any; altura: number; vazio?: string }) => (
    <div className="rounded-xl p-4 relative" style={{ background: "rgba(8,6,24,0.55)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
          <p className="text-[13px] font-black" style={{ color: "#f1f5f9" }}>{titulo}</p>
          {demo && <span className="text-[9px] px-2 py-0.5 rounded font-black tracking-wider" style={{ background: `${C.ouro}30`, color: C.ouro, border: `1px solid ${C.ouro}60` }}>🎭 {tt.demo}</span>}
        </div>
        <button onClick={() => router.push(path)} className="px-2 py-0.5 rounded-md text-[9px] font-bold transition-all hover:scale-105"
          style={{ background: `${cor}15`, border: `1px solid ${cor}38`, color: cor }}>{tt.verModulo} →</button>
      </div>
      {option ? (
        <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
      ) : (
        <div className="flex items-center justify-center text-center px-4" style={{ height: altura, color: "#5a6a85", fontSize: 12, fontWeight: 600 }}>{vazio}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 w-full">

      {/* TOGGLE demo/real */}
      <div className="flex items-center justify-end gap-2">
        <button onClick={() => setDemo(v => !v)}
          className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all hover:scale-105"
          style={{ background: demo ? `${C.ouro}25` : "rgba(255,255,255,0.05)", border: `1px solid ${demo ? C.ouro : "rgba(148,163,184,0.3)"}`, color: demo ? C.ouroC : "#94a3b8" }}>
          🎭 {demo ? tt.verMeusDados : tt.verDemo}
        </button>
      </div>

      {demo && (
        <div className="w-full rounded-xl px-4 py-2.5 text-center" style={{ background: `${C.ouro}18`, border: `1px dashed ${C.ouro}` }}>
          <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: C.ouroC }}>🎭 {tt.modoDemoAtivo}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} onClick={() => router.push(k.p)}
            className="rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-4px] relative"
            style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: `1px solid ${k.c}22`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${k.c}60`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 26px ${k.c}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${k.c}22`; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}>
            {demo && <span className="absolute top-2 right-2 text-[7px] px-1.5 py-0.5 rounded font-black tracking-wider" style={{ background: `${C.ouro}30`, color: C.ouro }}>🎭 {tt.demo}</span>}
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{k.i}</span>
              {"d" in k && (k as any).d && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black" style={{ background: (k as any).up ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.16)", color: (k as any).up ? C.verde : C.vermelho }}>{(k as any).d}</span>
              )}
            </div>
            <p className="text-lg font-black tracking-tight" style={{ color: k.c }}>{k.v}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
          </div>
        ))}
      </div>

      {/* LETREIRO EM LOOP */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: demo ? `linear-gradient(90deg, ${C.ouro}22, ${C.ouro}12)` : "linear-gradient(90deg, rgba(6,182,212,0.12), rgba(212,175,55,0.10))", border: demo ? `1px solid ${C.ouro}55` : "1px solid rgba(6,182,212,0.22)" }}>
        <div className="marquee-com py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }}>
            {marquee.map((t, i) => (<span key={i} style={{ color: i === 0 ? "#67e8f9" : demo ? C.ouroC : "#e2e8f0" }}>{t}<span style={{ color: demo ? C.ouro : "#06b6d4" }}>{"  •  "}</span></span>))}
          </span>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden>
            {marquee.map((t, i) => (<span key={`b${i}`} style={{ color: i === 0 ? "#67e8f9" : demo ? C.ouroC : "#e2e8f0" }}>{t}<span style={{ color: demo ? C.ouro : "#06b6d4" }}>{"  •  "}</span></span>))}
          </span>
        </div>
        <style>{`
          .marquee-com { animation: marqueeCom 32s linear infinite; }
          @keyframes marqueeCom { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .marquee-com:hover { animation-play-state: paused; }
        `}</style>
      </div>

      {/* MODAL ÚNICO */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#d4af37)", boxShadow: "0 0 12px #06b6d4" }} />
            <div>
              <p className="text-base font-black" style={{ color: "#f1f5f9" }}>{tt.painelTitulo}</p>
              <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{tt.painelSub}</p>
            </div>
          </div>

          <div className="mb-4">
            {demo ? (
              <Chart titulo={tt.metasT} cor={C.roxo} path="/metas" option={linhaMetas(tt)} altura={280} />
            ) : (
              <Chart titulo={tt.metasT} cor={C.roxo} path="/metas" altura={280}
                vazio={real.metasCount > 0 ? `${real.metasCount} ${tt.metasCadastradasMsg}` : tt.semMeta} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {demo ? (
              <>
                <Chart titulo={tt.clientes} cor={C.azul} path="/clientes" option={barrasV(D.novosClientes, tt.meses, C.azul, C.azulC)} altura={260} />
                <Chart titulo={tt.inad} cor={C.rosa} path="/inadimplencia" option={barrasV(D.inadimplencia, tt.meses, C.rosa, C.rosaC)} altura={260} />
                <Chart titulo={tt.receber} cor={C.verde} path="/contas-receber" option={rosca(D.receber.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.verde, tt.total)} altura={220} />
                <Chart titulo={tt.invest} cor={C.ouro} path="/investimentos" option={rosca(D.invest.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.ouro, tt.total)} altura={220} />
              </>
            ) : (
              <>
                <Chart titulo={tt.clientes} cor={C.azul} path="/clientes" altura={260}
                  option={real.novosClientesSerie.some(v => v > 0) ? barrasV(real.novosClientesSerie, tt.meses, C.azul, C.azulC) : undefined}
                  vazio={tt.semCliente} />
                <Chart titulo={tt.inad} cor={C.rosa} path="/inadimplencia" altura={260}
                  option={real.inadSerie.some(v => v > 0) ? barrasV(real.inadSerie, tt.meses, C.rosa, C.rosaC) : undefined}
                  vazio={tt.semInadimplencia} />
                <Chart titulo={tt.receber} cor={C.verde} path="/contas-receber" altura={220}
                  option={real.receberTotal > 0 ? rosca([
                    { name: tt.aVencer, value: real.receberAVencer, color: C.verde },
                    { name: tt.vence30, value: real.receberVence30, color: C.cyan },
                    { name: tt.atraso, value: real.receberAtraso, color: C.vermelho },
                  ].filter(b => b.value > 0), C.verde, tt.total) : undefined}
                  vazio={tt.semReceber} />
                <Chart titulo={tt.invest} cor={C.ouro} path="/investimentos" altura={220}
                  option={real.investCategorias.length ? rosca(real.investCategorias.map((c, i) => ({ name: mapaCatInvest[c.categoria] || c.categoria, value: c.value, color: [C.ouro, C.roxo, C.cyan, C.teal, C.rosa][i % 5] })), C.ouro, tt.total) : undefined}
                  vazio={tt.semInvestimento} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
