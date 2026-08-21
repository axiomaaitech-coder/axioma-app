"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../lib/LanguageContext";
import { serieRolling } from "../lib/cfoCore";
import ReactECharts from "echarts-for-react";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const T = {
  pt: {
    demo: "DEMO",
    receitaTotal: "Receita Total", custosFixos: "Custos Fixos", custosVariaveis: "Custos Variáveis",
    saldoCaixa: "Saldo em Caixa", dividaTotal: "Dívida Total",
    painelTitulo: "Análise Financeira Anual", painelSub: "Endividamento · Custos · Fluxo de Caixa · Receita",
    endivid: "Endividamento", saldoDevedor: "Saldo Devedor", amortizacao: "Amortização", juros: "Juros", jaPago: "Pago",
    cf: "Custos Fixos", cv: "Custos Variáveis", fluxo: "Fluxo de Caixa", receita: "Receita",
    entradas: "Entradas", saidas: "Saídas", investido: "Investido", reserva: "Reserva",
    vendas: "Vendas", servicos: "Serviços", recorrente: "Recorrente", outros: "Outros",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    verDemo: "Ver demonstração", verMeusDados: "Ver meus dados", modoDemoAtivo: "MODO DEMONSTRAÇÃO — dados fictícios, não são da sua empresa",
    semReceita: "Nenhuma receita registrada ainda", semCustoFixo: "Nenhum custo fixo cadastrado ainda",
    semCustoVariavel: "Nenhum custo variável registrado ainda", semDivida: "Nenhuma dívida cadastrada ainda",
  },
  en: {
    demo: "DEMO",
    receitaTotal: "Total Revenue", custosFixos: "Fixed Costs", custosVariaveis: "Variable Costs",
    saldoCaixa: "Cash Balance", dividaTotal: "Total Debt",
    painelTitulo: "Annual Financial Analysis", painelSub: "Debt · Costs · Cash Flow · Revenue",
    endivid: "Debt", saldoDevedor: "Outstanding", amortizacao: "Amortization", juros: "Interest", jaPago: "Paid",
    cf: "Fixed Costs", cv: "Variable Costs", fluxo: "Cash Flow", receita: "Revenue",
    entradas: "Inflows", saidas: "Outflows", investido: "Invested", reserva: "Reserve",
    vendas: "Sales", servicos: "Services", recorrente: "Recurring", outros: "Others",
    verModulo: "View module", total: "TOTAL",
    meses: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    verDemo: "View demo", verMeusDados: "View my data", modoDemoAtivo: "DEMO MODE — sample data, not your company's",
    semReceita: "No revenue recorded yet", semCustoFixo: "No fixed costs registered yet",
    semCustoVariavel: "No variable costs recorded yet", semDivida: "No debts registered yet",
  },
  es: {
    demo: "DEMO",
    receitaTotal: "Ingresos Totales", custosFixos: "Costos Fijos", custosVariaveis: "Costos Variables",
    saldoCaixa: "Saldo en Caja", dividaTotal: "Deuda Total",
    painelTitulo: "Análisis Financiero Anual", painelSub: "Deuda · Costos · Flujo de Caja · Ingresos",
    endivid: "Deuda", saldoDevedor: "Saldo Deudor", amortizacao: "Amortización", juros: "Intereses", jaPago: "Pagado",
    cf: "Costos Fijos", cv: "Costos Variables", fluxo: "Flujo de Caja", receita: "Ingresos",
    entradas: "Entradas", saidas: "Salidas", investido: "Invertido", reserva: "Reserva",
    vendas: "Ventas", servicos: "Servicios", recorrente: "Recurrente", outros: "Otros",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    verDemo: "Ver demostración", verMeusDados: "Ver mis datos", modoDemoAtivo: "MODO DEMOSTRACIÓN — datos ficticios, no son de su empresa",
    semReceita: "Aún no hay ingresos registrados", semCustoFixo: "Aún no hay costos fijos registrados",
    semCustoVariavel: "Aún no hay costos variables registrados", semDivida: "Aún no hay deudas registradas",
  },
};

const C = {
  ouro: "#d4af37", ouroC: "#f0d878", roxo: "#8b5cf6", roxoC: "#c4b5fd",
  cyan: "#06b6d4", cyanC: "#67e8f9", verde: "#10b981", verdeC: "#6ee7b7",
  vermelho: "#ef4444", vermelhoC: "#fca5a5", laranja: "#f97316", laranjaC: "#fdba74",
  rosa: "#ec4899", rosaC: "#f9a8d4", azul: "#3b82f6", indigo: "#6366f1", teal: "#14b8a6",
};

const fBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
const fK = (n: number) => Math.abs(n) >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${Math.round(n)}`;

// Dados de exemplo — só aparecem quando o usuário liga "Ver demonstração".
const D = {
  saldoDevedor: [248000,236500,228900,214200,205800,189400,176300,168900,151200,138700,122400,108900],
  amortizacao:  [ 11500, 12400, 10700, 14700,  8400, 16400, 13100,  7400, 17700, 12500, 16300, 13500],
  juros:        [  4960,  4730,  4578,  4284,  4116,  3788,  3526,  3378,  3024,  2774,  2448,  2178],
  custosFixos:  [ 18400, 18400, 18900, 18900, 19400, 19400, 19800, 19800, 20200, 20200, 20600, 21000],
  custosVar:    [  9200, 11400,  8700, 13600, 10200, 15800, 12300,  9800, 16400, 14100, 18900, 21300],
  fluxo:   [{ k:"entradas", v:284000, c:C.verde }, { k:"saidas", v:149000, c:C.vermelho }, { k:"investido", v:42000, c:C.roxo }, { k:"reserva", v:68000, c:C.cyan }],
  receita: [{ k:"vendas", v:142000, c:C.ouro }, { k:"servicos", v:78000, c:C.roxo }, { k:"recorrente", v:51000, c:C.cyan }, { k:"outros", v:13000, c:C.teal }],
};

// Dados reais da empresa ativa — preenchidos via Supabase (RLS já filtra pela empresa do usuário).
type RealFin = {
  receitaTotal: number;
  receitaCategorias: { name: string; value: number }[];
  custosFixosTotal: number;
  custosFixosCategorias: { name: string; value: number }[];
  custosVarMedia: number;
  custosVarSerie: number[];
  saldoCaixa: number;
  dividaTotal: number;
  dividaPaga: number;
  temDivida: boolean;
};

const REAL_VAZIO: RealFin = {
  receitaTotal: 0, receitaCategorias: [], custosFixosTotal: 0, custosFixosCategorias: [],
  custosVarMedia: 0, custosVarSerie: Array(12).fill(0), saldoCaixa: 0,
  dividaTotal: 0, dividaPaga: 0, temDivida: false,
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

function linhaEndiv(tt: any) {
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 58, right: 24, top: 40, bottom: 30, containLabel: false },
    legend: { top: 2, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 18, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 }, data: [tt.saldoDevedor, tt.amortizacao, tt.juros] },
    tooltip: { ...tip, trigger: "axis", borderColor: C.rosa,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: tt.saldoDevedor, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: C.rosa, shadowColor: C.rosa + "90", shadowBlur: 14 },
        itemStyle: { color: C.rosa, borderColor: "#0a0820", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(236,72,153,0.35)" }, { offset: 1, color: "rgba(236,72,153,0)" }] } },
        data: D.saldoDevedor },
      { name: tt.amortizacao, type: "line", smooth: true, symbol: "circle", symbolSize: 7,
        lineStyle: { width: 3, color: C.verde, shadowColor: C.verde + "80", shadowBlur: 10 },
        itemStyle: { color: C.verde, borderColor: "#0a0820", borderWidth: 2 }, data: D.amortizacao },
      { name: tt.juros, type: "line", smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { width: 2.5, color: C.ouro, type: "dashed", shadowColor: C.ouro + "70", shadowBlur: 8 },
        itemStyle: { color: C.ouro, borderColor: "#0a0820", borderWidth: 2 }, data: D.juros },
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

export default function DashFinanceiro() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const [demo, setDemo] = useState(false);
  const [real, setReal] = useState<RealFin>(REAL_VAZIO);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
      const doze = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1).toISOString().slice(0, 10);

      const [{ data: receitasMes }, { data: receitas12m }, { data: custosFix }, { data: custosVar12m }, { data: custosVarMes }, { data: dividas }] = await Promise.all([
        supabase.from("receitas").select("valor").gte("data", inicioMes).lte("data", fimMes),
        supabase.from("receitas").select("valor, data, categoria").gte("data", doze),
        supabase.from("custos_fixos").select("valor_mensal, categoria"),
        supabase.from("custos_variaveis").select("valor, data").gte("data", doze),
        supabase.from("custos_variaveis").select("valor").gte("data", inicioMes).lte("data", fimMes),
        supabase.from("dividas").select("valor_total, valor_pago"),
      ]);
      if (!ativo) return;

      const receitaTotal = (receitasMes || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
      const custosFixosTotal = (custosFix || []).reduce((s: number, r: any) => s + Number(r.valor_mensal || 0), 0);
      const custosVarMesTotal = (custosVarMes || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

      const catReceita = new Map<string, number>();
      (receitas12m || []).forEach((r: any) => { const k = r.categoria || "—"; catReceita.set(k, (catReceita.get(k) || 0) + Number(r.valor || 0)); });
      const receitaCategorias = Array.from(catReceita, ([name, value]) => ({ name, value })).filter(c => c.value > 0);

      const catFixo = new Map<string, number>();
      (custosFix || []).forEach((r: any) => { const k = r.categoria || "—"; catFixo.set(k, (catFixo.get(k) || 0) + Number(r.valor_mensal || 0)); });
      const custosFixosCategorias = Array.from(catFixo, ([name, value]) => ({ name, value })).filter(c => c.value > 0);

      const custosVarSerie = serieRolling((custosVar12m || []).map((r: any) => ({ valor: r.valor, data: r.data })), 12).map(b => b.value);
      const custosVarMedia = custosVarSerie.reduce((a, b) => a + b, 0) / 12;

      const dividaTotal = (dividas || []).reduce((s: number, d: any) => s + Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0)), 0);
      const dividaPaga = (dividas || []).reduce((s: number, d: any) => s + Number(d.valor_pago || 0), 0);

      setReal({
        receitaTotal, receitaCategorias, custosFixosTotal, custosFixosCategorias,
        custosVarMedia, custosVarSerie, saldoCaixa: receitaTotal - custosFixosTotal - custosVarMesTotal,
        dividaTotal, dividaPaga, temDivida: (dividas || []).length > 0,
      });
    })();
    return () => { ativo = false; };
  }, []);

  // ── Demo (fixo, só pra ilustrar o layout) ──
  const totalReceitaDemo = D.receita.reduce((a, b) => a + b.v, 0);
  const totalCFDemo = D.custosFixos.reduce((a, b) => a + b, 0);
  const totalCVDemo = D.custosVar.reduce((a, b) => a + b, 0);
  const saldoCaixaDemo = D.fluxo[0].v - D.fluxo[1].v;
  const dividaAtualDemo = D.saldoDevedor[D.saldoDevedor.length - 1];

  const kpis = demo ? [
    { l: tt.receitaTotal, v: fBRL(totalReceitaDemo), c: C.ouro, i: "💰", p: "/receitas", d: "▲ 12,4%", up: true },
    { l: tt.custosFixos, v: fBRL(totalCFDemo / 12), c: C.vermelho, i: "📌", p: "/custos-fixos", d: "▲ 3,1%", up: false },
    { l: tt.custosVariaveis, v: fBRL(totalCVDemo / 12), c: C.laranja, i: "📉", p: "/custos-variaveis", d: "▲ 8,7%", up: false },
    { l: tt.saldoCaixa, v: fBRL(saldoCaixaDemo), c: C.cyan, i: "💧", p: "/fluxo-caixa", d: "▲ 21,3%", up: true },
    { l: tt.dividaTotal, v: fBRL(dividaAtualDemo), c: C.rosa, i: "⚖️", p: "/endividamento", d: "▼ 56,1%", up: true },
  ] : [
    { l: tt.receitaTotal, v: fBRL(real.receitaTotal), c: C.ouro, i: "💰", p: "/receitas" },
    { l: tt.custosFixos, v: fBRL(real.custosFixosTotal), c: C.vermelho, i: "📌", p: "/custos-fixos" },
    { l: tt.custosVariaveis, v: fBRL(real.custosVarMedia), c: C.laranja, i: "📉", p: "/custos-variaveis" },
    { l: tt.saldoCaixa, v: fBRL(real.saldoCaixa), c: C.cyan, i: "💧", p: "/fluxo-caixa" },
    { l: tt.dividaTotal, v: fBRL(real.dividaTotal), c: C.rosa, i: "⚖️", p: "/endividamento" },
  ];

  const marquee = demo ? [
    `🚀 AXIOMA AI.TECH`, `🎭 ${tt.demo}`,
    `${tt.receitaTotal} ${fBRL(totalReceitaDemo)}`,
    `${tt.custosFixos} ${fBRL(totalCFDemo / 12)}`,
    `${tt.custosVariaveis} ${fBRL(totalCVDemo / 12)}`,
    `${tt.saldoCaixa} ${fBRL(saldoCaixaDemo)}`,
    `${tt.dividaTotal} ${fBRL(dividaAtualDemo)}`,
  ] : [
    `🚀 AXIOMA AI.TECH`,
    `${tt.receitaTotal} ${fBRL(real.receitaTotal)}`,
    `${tt.custosFixos} ${fBRL(real.custosFixosTotal)}`,
    `${tt.custosVariaveis} ${fBRL(real.custosVarMedia)}`,
    `${tt.saldoCaixa} ${fBRL(real.saldoCaixa)}`,
    `${tt.dividaTotal} ${fBRL(real.dividaTotal)}`,
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
      <div className="relative rounded-xl overflow-hidden" style={{ background: demo ? `linear-gradient(90deg, ${C.ouro}22, ${C.ouro}12)` : "linear-gradient(90deg, rgba(139,92,246,0.12), rgba(6,182,212,0.10))", border: demo ? `1px solid ${C.ouro}55` : "1px solid rgba(139,92,246,0.22)" }}>
        <div className="marquee-fin py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }}>
            {marquee.map((t, i) => (<span key={i} style={{ color: i === 0 ? "#c4b5fd" : demo ? C.ouroC : "#e2e8f0" }}>{t}<span style={{ color: demo ? C.ouro : "#8b5cf6" }}>{"  •  "}</span></span>))}
          </span>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden>
            {marquee.map((t, i) => (<span key={`b${i}`} style={{ color: i === 0 ? "#c4b5fd" : demo ? C.ouroC : "#e2e8f0" }}>{t}<span style={{ color: demo ? C.ouro : "#8b5cf6" }}>{"  •  "}</span></span>))}
          </span>
        </div>
        <style>{`
          .marquee-fin { animation: marqueeFin 32s linear infinite; }
          @keyframes marqueeFin { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .marquee-fin:hover { animation-play-state: paused; }
        `}</style>
      </div>

      {/* MODAL ÚNICO com TODOS os gráficos */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#8b5cf6,#06b6d4)", boxShadow: "0 0 12px #8b5cf6" }} />
            <div>
              <p className="text-base font-black" style={{ color: "#f1f5f9" }}>{tt.painelTitulo}</p>
              <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{tt.painelSub}</p>
            </div>
          </div>

          <div className="mb-4">
            {demo ? (
              <Chart titulo={tt.endivid} cor={C.rosa} path="/endividamento" option={linhaEndiv(tt)} altura={280} />
            ) : (
              <Chart titulo={tt.endivid} cor={C.rosa} path="/endividamento" altura={280}
                option={real.temDivida ? rosca([{ name: tt.jaPago, value: real.dividaPaga, color: C.verde }, { name: tt.saldoDevedor, value: real.dividaTotal, color: C.rosa }], C.rosa, tt.total) : undefined}
                vazio={tt.semDivida} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {demo ? (
              <>
                <Chart titulo={tt.cf} cor={C.vermelho} path="/custos-fixos" option={barrasV(D.custosFixos, tt.meses, C.vermelho, C.vermelhoC)} altura={260} />
                <Chart titulo={tt.cv} cor={C.laranja} path="/custos-variaveis" option={barrasV(D.custosVar, tt.meses, C.laranja, C.laranjaC)} altura={260} />
                <Chart titulo={tt.fluxo} cor={C.cyan} path="/fluxo-caixa" option={rosca(D.fluxo.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.cyan, tt.total)} altura={220} />
                <Chart titulo={tt.receita} cor={C.ouro} path="/receitas" option={rosca(D.receita.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.ouro, tt.total)} altura={220} />
              </>
            ) : (
              <>
                <Chart titulo={tt.cf} cor={C.vermelho} path="/custos-fixos" altura={260}
                  option={real.custosFixosCategorias.length ? barrasV(real.custosFixosCategorias.map(c => c.value), real.custosFixosCategorias.map(c => c.name), C.vermelho, C.vermelhoC) : undefined}
                  vazio={tt.semCustoFixo} />
                <Chart titulo={tt.cv} cor={C.laranja} path="/custos-variaveis" altura={260}
                  option={real.custosVarSerie.some(v => v > 0) ? barrasV(real.custosVarSerie, tt.meses, C.laranja, C.laranjaC) : undefined}
                  vazio={tt.semCustoVariavel} />
                <Chart titulo={tt.fluxo} cor={C.cyan} path="/fluxo-caixa" altura={220}
                  option={real.receitaTotal > 0 || real.custosFixosTotal > 0 ? rosca([{ name: tt.entradas, value: real.receitaTotal, color: C.verde }, { name: tt.saidas, value: Math.max(0, real.receitaTotal - real.saldoCaixa), color: C.vermelho }], C.cyan, tt.total) : undefined}
                  vazio={tt.semReceita} />
                <Chart titulo={tt.receita} cor={C.ouro} path="/receitas" altura={220}
                  option={real.receitaCategorias.length ? rosca(real.receitaCategorias.map((c, i) => ({ name: c.name, value: c.value, color: [C.ouro, C.roxo, C.cyan, C.teal, C.rosa][i % 5] })), C.ouro, tt.total) : undefined}
                  vazio={tt.semReceita} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
