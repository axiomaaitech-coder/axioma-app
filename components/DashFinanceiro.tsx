"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";
import ReactECharts from "echarts-for-react";

// ══════════════════════════════════════════════════════════════
// I18N
// ══════════════════════════════════════════════════════════════
const T = {
  pt: {
    titulo: "Dashboard Financeiro", subtitulo: "Visão consolidada · Receita · Custos · Caixa · Endividamento",
    demo: "DEMO",
    receitaTotal: "Receita Total", custosFixos: "Custos Fixos", custosVariaveis: "Custos Variáveis",
    lucroLiquido: "Lucro Líquido", saldoCaixa: "Saldo em Caixa", dividaTotal: "Dívida Total",
    endividamentoTitulo: "Endividamento — Evolução Anual",
    endividamentoSub: "Saldo devedor e amortização mês a mês",
    dividaSaldo: "Saldo Devedor", amortizacao: "Amortização", juros: "Juros",
    cfTitulo: "Custos Fixos — Mês a Mês",
    cfSub: "Gastos fixos anuais por competência",
    cvTitulo: "Custos Variáveis — Mês a Mês",
    cvSub: "Gastos variáveis anuais por competência",
    fluxoTitulo: "Fluxo de Caixa",
    fluxoSub: "Composição das entradas e saídas",
    receitaTitulo: "Receita por Origem",
    receitaSub: "Distribuição do faturamento",
    entradas: "Entradas", saidas: "Saídas", investido: "Investido", reserva: "Reserva",
    vendas: "Vendas", servicos: "Serviços", recorrente: "Recorrente", outros: "Outros",
    verModulo: "Ver módulo",
    total: "TOTAL", meses: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    vsAnterior: "vs mês anterior",
  },
  en: {
    titulo: "Financial Dashboard", subtitulo: "Consolidated view · Revenue · Costs · Cash · Debt",
    demo: "DEMO",
    receitaTotal: "Total Revenue", custosFixos: "Fixed Costs", custosVariaveis: "Variable Costs",
    lucroLiquido: "Net Profit", saldoCaixa: "Cash Balance", dividaTotal: "Total Debt",
    endividamentoTitulo: "Debt — Annual Evolution",
    endividamentoSub: "Outstanding balance and amortization month by month",
    dividaSaldo: "Outstanding", amortizacao: "Amortization", juros: "Interest",
    cfTitulo: "Fixed Costs — Month by Month",
    cfSub: "Annual fixed expenses",
    cvTitulo: "Variable Costs — Month by Month",
    cvSub: "Annual variable expenses",
    fluxoTitulo: "Cash Flow",
    fluxoSub: "Inflows and outflows composition",
    receitaTitulo: "Revenue by Source",
    receitaSub: "Revenue distribution",
    entradas: "Inflows", saidas: "Outflows", investido: "Invested", reserva: "Reserve",
    vendas: "Sales", servicos: "Services", recorrente: "Recurring", outros: "Others",
    verModulo: "View module",
    total: "TOTAL", meses: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    vsAnterior: "vs last month",
  },
  es: {
    titulo: "Dashboard Financiero", subtitulo: "Vista consolidada · Ingresos · Costos · Caja · Deuda",
    demo: "DEMO",
    receitaTotal: "Ingresos Totales", custosFixos: "Costos Fijos", custosVariaveis: "Costos Variables",
    lucroLiquido: "Beneficio Neto", saldoCaixa: "Saldo en Caja", dividaTotal: "Deuda Total",
    endividamentoTitulo: "Endeudamiento — Evolución Anual",
    endividamentoSub: "Saldo deudor y amortización mes a mes",
    dividaSaldo: "Saldo Deudor", amortizacao: "Amortización", juros: "Intereses",
    cfTitulo: "Costos Fijos — Mes a Mes",
    cfSub: "Gastos fijos anuales",
    cvTitulo: "Costos Variables — Mes a Mes",
    cvSub: "Gastos variables anuales",
    fluxoTitulo: "Flujo de Caja",
    fluxoSub: "Composición de entradas y salidas",
    receitaTitulo: "Ingresos por Origen",
    receitaSub: "Distribución de la facturación",
    entradas: "Entradas", saidas: "Salidas", investido: "Invertido", reserva: "Reserva",
    vendas: "Ventas", servicos: "Servicios", recorrente: "Recurrente", outros: "Otros",
    verModulo: "Ver módulo",
    total: "TOTAL", meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
    vsAnterior: "vs mes anterior",
  },
};

// ══════════════════════════════════════════════════════════════
// PALETA — alto luxo
// ══════════════════════════════════════════════════════════════
const C = {
  ouro: "#d4af37", ouroClaro: "#f0d878",
  roxo: "#8b5cf6", roxoClaro: "#c4b5fd",
  cyan: "#06b6d4", cyanClaro: "#67e8f9",
  verde: "#10b981", verdeClaro: "#6ee7b7",
  vermelho: "#ef4444", vermelhoClaro: "#fca5a5",
  laranja: "#f97316", laranjaClaro: "#fdba74",
  rosa: "#ec4899", azul: "#3b82f6", indigo: "#6366f1", teal: "#14b8a6",
};

function fBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}
function fK(n: number) {
  if (Math.abs(n) >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`;
  return `R$ ${Math.round(n)}`;
}

// ══════════════════════════════════════════════════════════════
// DADOS DEMO (fictícios — substituir por Supabase quando ativar)
// ══════════════════════════════════════════════════════════════
const DEMO = {
  // Endividamento: saldo caindo ao longo do ano com amortizações distintas
  dividaSaldo:   [248000, 236500, 228900, 214200, 205800, 189400, 176300, 168900, 151200, 138700, 122400, 108900],
  amortizacao:   [ 11500,  12400,  10700,  14700,   8400,  16400,  13100,   7400,  17700,  12500,  16300,  13500],
  juros:         [  4960,   4730,   4578,   4284,   4116,   3788,   3526,   3378,   3024,   2774,   2448,   2178],
  custosFixos:   [ 18400,  18400,  18900,  18900,  19400,  19400,  19800,  19800,  20200,  20200,  20600,  21000],
  custosVar:     [  9200,  11400,   8700,  13600,  10200,  15800,  12300,   9800,  16400,  14100,  18900,  21300],
  fluxo: [
    { name: "entradas", value: 284000, color: C.verde },
    { name: "saidas", value: 149000, color: C.vermelho },
    { name: "investido", value: 42000, color: C.roxo },
    { name: "reserva", value: 68000, color: C.cyan },
  ],
  receita: [
    { name: "vendas", value: 142000, color: C.ouro },
    { name: "servicos", value: 78000, color: C.roxo },
    { name: "recorrente", value: 51000, color: C.cyan },
    { name: "outros", value: 13000, color: C.teal },
  ],
};

// ══════════════════════════════════════════════════════════════
// CARD BASE
// ══════════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════════
// PÁGINA
// ══════════════════════════════════════════════════════════════
export default function DashFinanceiro() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const totalReceita = DEMO.receita.reduce((a, b) => a + b.value, 0);
  const totalCF = DEMO.custosFixos.reduce((a, b) => a + b, 0);
  const totalCV = DEMO.custosVar.reduce((a, b) => a + b, 0);
  const lucro = totalReceita - (totalCF + totalCV) / 12;
  const saldoCaixa = DEMO.fluxo[0].value - DEMO.fluxo[1].value;
  const dividaAtual = DEMO.dividaSaldo[DEMO.dividaSaldo.length - 1];

  const tip = {
    backgroundColor: "rgba(10,8,30,0.97)",
    borderWidth: 1,
    padding: [10, 14],
    textStyle: { color: "#e2e8f0", fontSize: 13 },
    extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
  };

  // ── LINHA: Endividamento ──
  const optEndiv = {
    backgroundColor: "transparent",
    animationDuration: 1100,
    grid: { left: 62, right: 28, top: 46, bottom: 34, containLabel: false },
    legend: {
      top: 4, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 20, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 },
      data: [tt.dividaSaldo, tt.amortizacao, tt.juros],
    },
    tooltip: { ...tip, trigger: "axis", borderColor: C.rosa, axisPointer: { type: "line", lineStyle: { color: "rgba(236,72,153,0.35)", width: 2 } },
      formatter: (ps: any[]) => `<b style="font-size:13px">${ps[0].axisValue}</b><br/>` + ps.map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      {
        name: tt.dividaSaldo, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: C.rosa, shadowColor: C.rosa + "90", shadowBlur: 14 },
        itemStyle: { color: C.rosa, borderColor: "#0a0820", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: "rgba(236,72,153,0.35)" }, { offset: 1, color: "rgba(236,72,153,0)" }] } },
        data: DEMO.dividaSaldo,
      },
      {
        name: tt.amortizacao, type: "line", smooth: true, symbol: "circle", symbolSize: 7,
        lineStyle: { width: 3, color: C.verde, shadowColor: C.verde + "80", shadowBlur: 10 },
        itemStyle: { color: C.verde, borderColor: "#0a0820", borderWidth: 2 },
        data: DEMO.amortizacao,
      },
      {
        name: tt.juros, type: "line", smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { width: 2.5, color: C.ouro, type: "dashed", shadowColor: C.ouro + "70", shadowBlur: 8 },
        itemStyle: { color: C.ouro, borderColor: "#0a0820", borderWidth: 2 },
        data: DEMO.juros,
      },
    ],
  };

  // ── BARRAS HORIZONTAIS ──
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

  // ── ROSCA ──
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
    { l: tt.receitaTotal, v: fBRL(totalReceita), c: C.ouro, i: "💰", p: "/receitas", d: "▲ 12,4%", up: true },
    { l: tt.custosFixos, v: fBRL(totalCF / 12), c: C.vermelho, i: "📌", p: "/custos-fixos", d: "▲ 3,1%", up: false },
    { l: tt.custosVariaveis, v: fBRL(totalCV / 12), c: C.laranja, i: "📉", p: "/custos-variaveis", d: "▲ 8,7%", up: false },
    { l: tt.saldoCaixa, v: fBRL(saldoCaixa), c: C.cyan, i: "💧", p: "/fluxo-caixa", d: "▲ 21,3%", up: true },
    { l: tt.dividaTotal, v: fBRL(dividaAtual), c: C.rosa, i: "⚖️", p: "/endividamento", d: "▼ 56,1%", up: true },
  ];

  return (
    <div className="space-y-4 w-full">

        {/* ═══ CABEÇALHO ═══ */}
        <div className="flex items-end justify-between flex-wrap gap-2 px-1">
          <div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>💼 {tt.titulo}</h1>
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

        {/* ═══ LINHA: ENDIVIDAMENTO (topo, largura total) ═══ */}
        <Panel cor={C.rosa} titulo={tt.endividamentoTitulo} subtitulo={tt.endividamentoSub}
          path="/endividamento" router={router} verModulo={tt.verModulo} demo={tt.demo}>
          <ReactECharts option={optEndiv} style={{ height: 340, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
        </Panel>

        {/* ═══ BARRAS H (Custos Fixos | Custos Variáveis) + ROSCAS (Fluxo | Receita) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Custos Fixos */}
          <div className="lg:col-span-4">
            <Panel cor={C.vermelho} titulo={tt.cfTitulo} subtitulo={tt.cfSub}
              path="/custos-fixos" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts option={barrasH(DEMO.custosFixos, C.vermelho, C.vermelhoClaro)} style={{ height: 620, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>

          {/* Custos Variáveis */}
          <div className="lg:col-span-4">
            <Panel cor={C.laranja} titulo={tt.cvTitulo} subtitulo={tt.cvSub}
              path="/custos-variaveis" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts option={barrasH(DEMO.custosVar, C.laranja, C.laranjaClaro)} style={{ height: 620, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>

          {/* Roscas empilhadas: Fluxo de Caixa + Receita */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Panel cor={C.cyan} titulo={tt.fluxoTitulo} subtitulo={tt.fluxoSub}
              path="/fluxo-caixa" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts
                option={rosca(DEMO.fluxo.map(d => ({ ...d, name: (tt as any)[d.name] })), C.cyan, tt.total)}
                style={{ height: 288, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>

            <Panel cor={C.ouro} titulo={tt.receitaTitulo} subtitulo={tt.receitaSub}
              path="/receitas" router={router} verModulo={tt.verModulo} demo={tt.demo}>
              <ReactECharts
                option={rosca(DEMO.receita.map(d => ({ ...d, name: (tt as any)[d.name] })), C.ouro, tt.total)}
                style={{ height: 288, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
            </Panel>
          </div>
        </div>

      </div>
  );
}