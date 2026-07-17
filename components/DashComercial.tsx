"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";
import ReactECharts from "echarts-for-react";

// ══════════════════════════════════════════════════════════════
// I18N
// ══════════════════════════════════════════════════════════════
const T = {
  pt: {
    titulo: "Dashboard Comercial & Crescimento",
    subtitulo: "Metas · Clientes · Recebíveis · Investimentos · Fornecedores",
    demo: "DEMO",
    metaAnual: "Meta Anual", clientesAtivos: "Clientes Ativos", aReceber: "A Receber",
    inadimplencia: "Inadimplência", investimentos: "Investimentos", ticketMedio: "Ticket Médio",
    metasTitulo: "Metas vs. Realizado — Evolução Anual",
    metasSub: "Acompanhamento do objetivo de faturamento mês a mês",
    meta: "Meta", realizado: "Realizado", projecao: "Projeção",
    clientesTitulo: "Novos Clientes — Mês a Mês",
    clientesSub: "Aquisição anual por competência",
    inadTitulo: "Inadimplência — Mês a Mês",
    inadSub: "Valor em atraso por competência",
    receberTitulo: "Contas a Receber",
    receberSub: "Composição por faixa de vencimento",
    investTitulo: "Investimentos",
    investSub: "Alocação da carteira",
    aVencer: "A vencer", vence30: "Vence 30d", atraso: "Em atraso", renegociado: "Renegociado",
    rendaFixa: "Renda Fixa", acoes: "Ações", fundos: "Fundos", caixa: "Caixa",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  },
  en: {
    titulo: "Sales & Growth Dashboard",
    subtitulo: "Goals · Clients · Receivables · Investments · Suppliers",
    demo: "DEMO",
    metaAnual: "Annual Goal", clientesAtivos: "Active Clients", aReceber: "Receivables",
    inadimplencia: "Delinquency", investimentos: "Investments", ticketMedio: "Avg Ticket",
    metasTitulo: "Goals vs. Actual — Annual Evolution",
    metasSub: "Revenue objective tracking month by month",
    meta: "Goal", realizado: "Actual", projecao: "Forecast",
    clientesTitulo: "New Clients — Month by Month",
    clientesSub: "Annual acquisition",
    inadTitulo: "Delinquency — Month by Month",
    inadSub: "Overdue amount by period",
    receberTitulo: "Accounts Receivable",
    receberSub: "Composition by due date",
    investTitulo: "Investments",
    investSub: "Portfolio allocation",
    aVencer: "Upcoming", vence30: "Due 30d", atraso: "Overdue", renegociado: "Renegotiated",
    rendaFixa: "Fixed Income", acoes: "Stocks", fundos: "Funds", caixa: "Cash",
    verModulo: "View module", total: "TOTAL",
    meses: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  es: {
    titulo: "Dashboard Comercial & Crecimiento",
    subtitulo: "Metas · Clientes · Cobrar · Inversiones · Proveedores",
    demo: "DEMO",
    metaAnual: "Meta Anual", clientesAtivos: "Clientes Activos", aReceber: "Por Cobrar",
    inadimplencia: "Morosidad", investimentos: "Inversiones", ticketMedio: "Ticket Medio",
    metasTitulo: "Metas vs. Realizado — Evolución Anual",
    metasSub: "Seguimiento del objetivo de facturación mes a mes",
    meta: "Meta", realizado: "Realizado", projecao: "Proyección",
    clientesTitulo: "Nuevos Clientes — Mes a Mes",
    clientesSub: "Adquisición anual",
    inadTitulo: "Morosidad — Mes a Mes",
    inadSub: "Valor atrasado por período",
    receberTitulo: "Cuentas por Cobrar",
    receberSub: "Composición por vencimiento",
    investTitulo: "Inversiones",
    investSub: "Asignación de cartera",
    aVencer: "Por vencer", vence30: "Vence 30d", atraso: "Atrasado", renegociado: "Renegociado",
    rendaFixa: "Renta Fija", acoes: "Acciones", fundos: "Fondos", caixa: "Caja",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
  },
};

const C = {
  ouro: "#d4af37", ouroClaro: "#f0d878",
  roxo: "#8b5cf6", roxoClaro: "#c4b5fd",
  cyan: "#06b6d4", cyanClaro: "#67e8f9",
  verde: "#10b981", verdeClaro: "#6ee7b7",
  vermelho: "#ef4444", vermelhoClaro: "#fca5a5",
  laranja: "#f97316", laranjaClaro: "#fdba74",
  rosa: "#ec4899", rosaClaro: "#f9a8d4",
  azul: "#3b82f6", azulClaro: "#93c5fd",
  indigo: "#6366f1", teal: "#14b8a6",
};

function fBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}
function fK(n: number) {
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(n)}`;
}

// ══════════════════════════════════════════════════════════════
// DADOS DEMO
// ══════════════════════════════════════════════════════════════
const DEMO = {
  meta:      [ 20000, 20000, 22000, 22000, 24000, 24000, 26000, 26000, 28000, 28000, 30000, 30000],
  realizado: [ 18400, 21200, 19800, 24600, 23100, 27400, 25900, 22800, 31200, 29400, 34800, 38200],
  projecao:  [  null,  null,  null,  null,  null,  null,  null,  null,  null, 29400, 35600, 41000],
  novosClientes: [ 4800, 7200, 5400, 9100, 6800, 11200, 8400, 6100, 12800, 10400, 14600, 17200],
  inadimplencia: [ 3200, 2800, 4100, 2400, 3600, 1900, 2700, 4400, 2100, 3300, 1800, 1400],
  receber: [
    { name: "aVencer", value: 84000, color: C.verde },
    { name: "vence30", value: 42000, color: C.cyan },
    { name: "atraso", value: 18000, color: C.vermelho },
    { name: "renegociado", value: 11000, color: C.laranja },
  ],
  investimentos: [
    { name: "rendaFixa", value: 96000, color: C.ouro },
    { name: "acoes", value: 48000, color: C.roxo },
    { name: "fundos", value: 32000, color: C.cyan },
    { name: "caixa", value: 24000, color: C.teal },
  ],
};

function Panel({ children, cor, titulo, subtitulo, path, router, verModulo, demo }: {
  children: React.ReactNode; cor: string; titulo: string; subtitulo: string;
  path: string; router: any; verModulo: string; demo: string;
}) {
  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-3px] h-full"
      style={{
        background: "linear-gradient(160deg, rgba(20,15,55,0.94) 0%, rgba(10,8,32,0.97) 100%)",
        border: "1px solid rgba(99,102,241,0.13)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${cor}45`; e.currentTarget.style.boxShadow = `0 14px 50px rgba(0,0,0,0.5), 0 0 28px ${cor}18`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.13)"; e.currentTarget.style.boxShadow = "0 4px 30px rgba(0,0,0,0.4)"; }}>
      <div className="p-5">
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 rounded-full flex-shrink-0" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} />
              <p className="text-[15px] font-black truncate" style={{ color: "#f1f5f9" }}>{titulo}</p>
              <span className="text-[8px] px-1.5 py-0.5 rounded font-black flex-shrink-0" style={{ background: `${cor}22`, color: cor }}>{demo}</span>
            </div>
            <p className="text-[10px] font-medium mt-1 ml-3 truncate" style={{ color: "#64748b" }}>{subtitulo}</p>
          </div>
          <button onClick={() => router.push(path)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105 flex-shrink-0 whitespace-nowrap"
            style={{ background: `${cor}15`, border: `1px solid ${cor}38`, color: cor }}>
            {verModulo} →
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function DashComercial() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const totalMeta = DEMO.meta.reduce((a, b) => a + b, 0);
  const totalReal = DEMO.realizado.reduce((a, b) => a + b, 0);
  const totalReceber = DEMO.receber.reduce((a, b) => a + b.value, 0);
  const totalInvest = DEMO.investimentos.reduce((a, b) => a + b.value, 0);
  const totalInad = DEMO.inadimplencia.reduce((a, b) => a + b, 0);
  const pctMeta = Math.round((totalReal / totalMeta) * 100);

  const tip = {
    backgroundColor: "rgba(10,8,30,0.97)",
    borderWidth: 1, padding: [10, 14],
    textStyle: { color: "#e2e8f0", fontSize: 13 },
    extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
  };

  // ── LINHA: Metas vs Realizado ──
  const optMetas = {
    backgroundColor: "transparent",
    animationDuration: 1100,
    grid: { left: 62, right: 28, top: 46, bottom: 34, containLabel: false },
    legend: {
      top: 4, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 20, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 },
      data: [tt.realizado, tt.meta, tt.projecao],
    },
    tooltip: { ...tip, trigger: "axis", borderColor: C.roxo, axisPointer: { type: "line", lineStyle: { color: "rgba(139,92,246,0.35)", width: 2 } },
      formatter: (ps: any[]) => `<b style="font-size:13px">${ps[0].axisValue}</b><br/>` + ps.filter(p => p.value != null).map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      {
        name: tt.realizado, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: C.roxo, shadowColor: C.roxo + "90", shadowBlur: 14 },
        itemStyle: { color: C.roxo, borderColor: "#0a0820", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: "rgba(139,92,246,0.38)" }, { offset: 1, color: "rgba(139,92,246,0)" }] } },
        data: DEMO.realizado,
      },
      {
        name: tt.meta, type: "line", smooth: false, symbol: "none",
        lineStyle: { width: 2.5, color: C.ouro, type: "dashed", shadowColor: C.ouro + "70", shadowBlur: 8 },
        itemStyle: { color: C.ouro },
        data: DEMO.meta,
      },
      {
        name: tt.projecao, type: "line", smooth: true, symbol: "emptyCircle", symbolSize: 7,
        lineStyle: { width: 3, color: C.cyan, type: "dotted", shadowColor: C.cyan + "70", shadowBlur: 10 },
        itemStyle: { color: C.cyan, borderColor: "#0a0820", borderWidth: 2 },
        data: DEMO.projecao,
      },
    ],
  };

  const barrasH = (dados: number[], cor: string, corClaro: string) => ({
    backgroundColor: "transparent",
    animationDuration: 900, animationDelay: (i: number) => i * 40,
    grid: { left: 46, right: 86, top: 10, bottom: 10, containLabel: false },
    tooltip: { ...tip, trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${corClaro}">${fBRL(p.value)}</b>` },
    xAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.05)", type: "dashed" } }, axisLabel: { show: false } },
    yAxis: { type: "category", data: tt.meses, inverse: true,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: "#e2e8f0", fontSize: 13, fontWeight: 800 } },
    series: [{
      type: "bar", barWidth: "82%",
      itemStyle: {
        borderRadius: [0, 7, 7, 0],
        color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: cor }, { offset: 1, color: corClaro }] },
        shadowColor: cor + "55", shadowBlur: 10,
      },
      label: { show: true, position: "right", distance: 9, color: "#f1f5f9", fontSize: 12, fontWeight: 800, formatter: (p: any) => fK(p.value) },
      emphasis: { itemStyle: { shadowBlur: 22 } },
      data: dados,
    }],
  });

  const rosca = (dados: { name: string; value: number; color: string }[], cor: string, centroLabel: string) => {
    const total = dados.reduce((a, b) => a + b.value, 0);
    return {
      backgroundColor: "transparent",
      animationDuration: 1000,
      tooltip: { ...tip, trigger: "item", borderColor: cor,
        formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b> <span style="color:${cor}">${p.percent}%</span>` },
      legend: {
        orient: "vertical", right: 4, top: "center", itemWidth: 11, itemHeight: 11, itemGap: 13, icon: "circle",
        textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 600 },
        formatter: (name: string) => {
          const d = dados.find(x => x.name === name);
          const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0;
          return `${name}  ${pct}%`;
        },
      },
      series: [{
        type: "pie", radius: ["55%", "80%"], center: ["31%", "52%"], avoidLabelOverlap: false,
        itemStyle: { borderColor: "rgba(10,8,32,0.95)", borderWidth: 3, borderRadius: 5 },
        label: { show: false }, labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 26, shadowColor: cor + "80" } },
        data: dados.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
      }],
      graphic: [
        { type: "text", left: "31%", top: "45%", style: { text: fK(total), textAlign: "center", fill: "#f1f5f9", fontSize: 19, fontWeight: 900 }, z: 10 },
        { type: "text", left: "31%", top: "55%", style: { text: centroLabel, textAlign: "center", fill: "#64748b", fontSize: 9, fontWeight: 700 }, z: 10 },
      ],
    };
  };

  const kpis = [
    { l: tt.metaAnual, v: `${pctMeta}%`, c: C.roxo, i: "🎯", p: "/metas", d: "▲ 6,2%", up: true },
    { l: tt.clientesAtivos, v: "128", c: C.azul, i: "👥", p: "/clientes", d: "▲ 14,8%", up: true },
    { l: tt.aReceber, v: fBRL(totalReceber), c: C.verde, i: "📥", p: "/contas-receber", d: "▲ 9,4%", up: true },
    { l: tt.inadimplencia, v: fBRL(totalInad / 12), c: C.vermelho, i: "⚠️", p: "/inadimplencia", d: "▼ 32,1%", up: true },
    { l: tt.investimentos, v: fBRL(totalInvest), c: C.ouro, i: "💎", p: "/investimentos", d: "▲ 18,7%", up: true },
  ];

  return (
    <div className="space-y-4 w-full">

        {/* ═══ CABEÇALHO ═══ */}
        <div className="flex items-end justify-between flex-wrap gap-2 px-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>🚀 {tt.titulo}</h1>
            <p className="text-[11px] font-medium mt-1" style={{ color: "#64748b" }}>{tt.subtitulo}</p>
          </div>
        </div>

        {/* ═══ KPIs ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpis.map((k, i) => (
            <div key={i} onClick={() => router.push(k.p)}
              className="rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-4px]"
              style={{
                background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))",
                border: `1px solid ${k.c}22`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${k.c}60`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 26px ${k.c}22`; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${k.c}22`; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{k.i}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded font-black"
                  style={{ background: k.up ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.16)", color: k.up ? C.verde : C.vermelho }}>{k.d}</span>
              </div>
              <p className="text-lg font-black tracking-tight" style={{ color: k.c }}>{k.v}</p>
              <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
            </div>
          ))}
        </div>

        {/* ═══ LINHA: METAS VS REALIZADO ═══ */}
        <Panel cor={C.roxo} titulo={tt.metasTitulo} subtitulo={tt.metasSub}
          path="/metas" router={router} verModulo={tt.verModulo} demo={tt.demo}>
          <ReactECharts option={optMetas} style={{ height: 340, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
        </Panel>

        {/* ═══ BARRAS H + ROSCAS ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          <div className="lg:col-span-4">
            <Panel cor={C.azul} titulo={tt.clientesTitulo} subtitulo={tt.clientesSub}
              path="/clientes" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts option={barrasH(DEMO.novosClientes, C.azul, C.azulClaro)} style={{ height: 620, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>

          <div className="lg:col-span-4">
            <Panel cor={C.rosa} titulo={tt.inadTitulo} subtitulo={tt.inadSub}
              path="/inadimplencia" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts option={barrasH(DEMO.inadimplencia, C.rosa, C.rosaClaro)} style={{ height: 620, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <Panel cor={C.verde} titulo={tt.receberTitulo} subtitulo={tt.receberSub}
              path="/contas-receber" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts
                option={rosca(DEMO.receber.map(d => ({ ...d, name: (tt as any)[d.name] })), C.verde, tt.total)}
                style={{ height: 288, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>

            <Panel cor={C.ouro} titulo={tt.investTitulo} subtitulo={tt.investSub}
              path="/investimentos" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts
                option={rosca(DEMO.investimentos.map(d => ({ ...d, name: (tt as any)[d.name] })), C.ouro, tt.total)}
                style={{ height: 288, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>
        </div>

      </div>
  );
}