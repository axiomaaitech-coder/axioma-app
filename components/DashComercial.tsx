"use client";
import { useRouter } from "next/navigation";
import { useLanguage } from "../lib/LanguageContext";
import ReactECharts from "echarts-for-react";

const T = {
  pt: {
    demo: "DEMO",
    metaAnual: "Meta Anual", clientesAtivos: "Clientes Ativos", aReceber: "A Receber",
    inadimplencia: "Inadimplência", investimentos: "Investimentos",
    painelTitulo: "Análise Comercial & Crescimento", painelSub: "Metas · Clientes · Recebíveis · Investimentos",
    metasT: "Metas vs. Realizado", meta: "Meta", realizado: "Realizado", projecao: "Projeção",
    clientes: "Novos Clientes", inad: "Inadimplência", receber: "Contas a Receber", invest: "Investimentos",
    aVencer: "A vencer", vence30: "Vence 30d", atraso: "Em atraso", renegociado: "Renegociado",
    rendaFixa: "Renda Fixa", acoes: "Ações", fundos: "Fundos", caixa: "Caixa",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  },
  en: {
    demo: "DEMO",
    metaAnual: "Annual Goal", clientesAtivos: "Active Clients", aReceber: "Receivables",
    inadimplencia: "Delinquency", investimentos: "Investments",
    painelTitulo: "Sales & Growth Analysis", painelSub: "Goals · Clients · Receivables · Investments",
    metasT: "Goals vs. Actual", meta: "Goal", realizado: "Actual", projecao: "Forecast",
    clientes: "New Clients", inad: "Delinquency", receber: "Receivables", invest: "Investments",
    aVencer: "Upcoming", vence30: "Due 30d", atraso: "Overdue", renegociado: "Renegotiated",
    rendaFixa: "Fixed Income", acoes: "Stocks", fundos: "Funds", caixa: "Cash",
    verModulo: "View module", total: "TOTAL",
    meses: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
  es: {
    demo: "DEMO",
    metaAnual: "Meta Anual", clientesAtivos: "Clientes Activos", aReceber: "Por Cobrar",
    inadimplencia: "Morosidad", investimentos: "Inversiones",
    painelTitulo: "Análisis Comercial & Crecimiento", painelSub: "Metas · Clientes · Cobrar · Inversiones",
    metasT: "Metas vs. Realizado", meta: "Meta", realizado: "Realizado", projecao: "Proyección",
    clientes: "Nuevos Clientes", inad: "Morosidad", receber: "Cuentas por Cobrar", invest: "Inversiones",
    aVencer: "Por vencer", vence30: "Vence 30d", atraso: "Atrasado", renegociado: "Renegociado",
    rendaFixa: "Renta Fija", acoes: "Acciones", fundos: "Fondos", caixa: "Caja",
    verModulo: "Ver módulo", total: "TOTAL",
    meses: ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"],
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

const D = {
  meta:      [ 20000, 20000, 22000, 22000, 24000, 24000, 26000, 26000, 28000, 28000, 30000, 30000],
  realizado: [ 18400, 21200, 19800, 24600, 23100, 27400, 25900, 22800, 31200, 29400, 34800, 38200],
  projecao:  [  null,  null,  null,  null,  null,  null,  null,  null,  null, 29400, 35600, 41000],
  novosClientes: [ 4800, 7200, 5400, 9100, 6800, 11200, 8400, 6100, 12800, 10400, 14600, 17200],
  inadimplencia: [ 3200, 2800, 4100, 2400, 3600, 1900, 2700, 4400, 2100, 3300, 1800, 1400],
  receber: [{ k:"aVencer", v:84000, c:C.verde }, { k:"vence30", v:42000, c:C.cyan }, { k:"atraso", v:18000, c:C.vermelho }, { k:"renegociado", v:11000, c:C.laranja }],
  invest:  [{ k:"rendaFixa", v:96000, c:C.ouro }, { k:"acoes", v:48000, c:C.roxo }, { k:"fundos", v:32000, c:C.cyan }, { k:"caixa", v:24000, c:C.teal }],
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

  const totalMeta = D.meta.reduce((a, b) => a + b, 0);
  const totalReal = D.realizado.reduce((a, b) => a + b, 0);
  const totalReceber = D.receber.reduce((a, b) => a + b.v, 0);
  const totalInvest = D.invest.reduce((a, b) => a + b.v, 0);
  const totalInad = D.inadimplencia.reduce((a, b) => a + b, 0);
  const pctMeta = Math.round((totalReal / totalMeta) * 100);

  const kpis = [
    { l: tt.metaAnual, v: `${pctMeta}%`, c: C.roxo, i: "🎯", p: "/metas", d: "▲ 6,2%", up: true },
    { l: tt.clientesAtivos, v: "128", c: C.azul, i: "👥", p: "/clientes", d: "▲ 14,8%", up: true },
    { l: tt.aReceber, v: fBRL(totalReceber), c: C.verde, i: "📥", p: "/contas-receber", d: "▲ 9,4%", up: true },
    { l: tt.inadimplencia, v: fBRL(totalInad / 12), c: C.vermelho, i: "⚠️", p: "/inadimplencia", d: "▼ 32,1%", up: true },
    { l: tt.investimentos, v: fBRL(totalInvest), c: C.ouro, i: "💎", p: "/investimentos", d: "▲ 18,7%", up: true },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`,
    `${tt.metaAnual} ${pctMeta}%`,
    `${tt.clientesAtivos} 128`,
    `${tt.aReceber} ${fBRL(totalReceber)}`,
    `${tt.inadimplencia} ${fBRL(totalInad / 12)}`,
    `${tt.investimentos} ${fBRL(totalInvest)}`,
  ];

  const Chart = ({ titulo, cor, path, option, altura }: { titulo: string; cor: string; path: string; option: any; altura: number }) => (
    <div className="rounded-xl p-4" style={{ background: "rgba(8,6,24,0.55)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
          <p className="text-[13px] font-black" style={{ color: "#f1f5f9" }}>{titulo}</p>
          <span className="text-[7px] px-1.5 py-0.5 rounded font-black" style={{ background: `${cor}22`, color: cor }}>{tt.demo}</span>
        </div>
        <button onClick={() => router.push(path)} className="px-2 py-0.5 rounded-md text-[9px] font-bold transition-all hover:scale-105"
          style={{ background: `${cor}15`, border: `1px solid ${cor}38`, color: cor }}>{tt.verModulo} →</button>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  return (
    <div className="space-y-4 w-full">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} onClick={() => router.push(k.p)}
            className="rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:translate-y-[-4px]"
            style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: `1px solid ${k.c}22`, boxShadow: "0 4px 24px rgba(0,0,0,0.4)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${k.c}60`; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 26px ${k.c}22`; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${k.c}22`; e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)"; }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{k.i}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded font-black" style={{ background: k.up ? "rgba(16,185,129,0.16)" : "rgba(239,68,68,0.16)", color: k.up ? C.verde : C.vermelho }}>{k.d}</span>
            </div>
            <p className="text-lg font-black tracking-tight" style={{ color: k.c }}>{k.v}</p>
            <p className="text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
          </div>
        ))}
      </div>

      {/* LETREIRO EM LOOP */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.12), rgba(212,175,55,0.10))", border: "1px solid rgba(6,182,212,0.22)" }}>
        <div className="marquee-com py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }}>
            {marquee.map((t, i) => (<span key={i} style={{ color: i === 0 ? "#67e8f9" : "#e2e8f0" }}>{t}<span style={{ color: "#06b6d4" }}>{"  •  "}</span></span>))}
          </span>
          <span className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden>
            {marquee.map((t, i) => (<span key={`b${i}`} style={{ color: i === 0 ? "#67e8f9" : "#e2e8f0" }}>{t}<span style={{ color: "#06b6d4" }}>{"  •  "}</span></span>))}
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
            <Chart titulo={tt.metasT} cor={C.roxo} path="/metas" option={linhaMetas(tt)} altura={280} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Chart titulo={tt.clientes} cor={C.azul} path="/clientes" option={barrasV(D.novosClientes, tt.meses, C.azul, C.azulC)} altura={260} />
            <Chart titulo={tt.inad} cor={C.rosa} path="/inadimplencia" option={barrasV(D.inadimplencia, tt.meses, C.rosa, C.rosaC)} altura={260} />
            <Chart titulo={tt.receber} cor={C.verde} path="/contas-receber" option={rosca(D.receber.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.verde, tt.total)} altura={220} />
            <Chart titulo={tt.invest} cor={C.ouro} path="/investimentos" option={rosca(D.invest.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.ouro, tt.total)} altura={220} />
          </div>
        </div>
      </div>
    </div>
  );
}