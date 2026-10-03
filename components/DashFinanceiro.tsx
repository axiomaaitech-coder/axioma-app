"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../lib/LanguageContext";
import { serieRolling, serieCores } from "../lib/cfoCore";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { fBRL, fK, tip, tipClaro, EIXO, barrasV, rosca } from "../lib/dashGraficos";
import { useDashClaro, BotaoDemo, BannerDemo, KpisDash, LetreiroDash, PainelDash, ChartDash, type KpiDash } from "./DashBlocos";

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
  ouro: "#2ecc9b", ouroC: "#7fe3c3", roxo: "#2ecc9b", roxoC: "#7fe3c3",
  cyan: "#2ecc9b", cyanC: "#7fe3c3", verde: "#34d399", verdeC: "#6ee7b7",
  vermelho: "#ef4444", vermelhoC: "#fca5a5", laranja: "#f97316", laranjaC: "#fdba74",
  rosa: "#f87171", rosaC: "#fca5a5", azul: "#2ecc9b", indigo: "#2ecc9b", teal: "#2ecc9b",
};


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

function linhaEndiv(tt: any, claro = false) {
  const e = EIXO(claro);
  const [corSaldo, corAmort, corJuros] = claro ? ["#101b3d", "#2ecc9b", "#6b7280"] : [C.rosa, C.verde, C.ouro];
  const borda = e.bordaPonto;
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 58, right: 24, top: 40, bottom: 30, containLabel: false },
    legend: { top: 2, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 18, icon: "roundRect",
      textStyle: { color: e.rotulo, fontSize: 12, fontWeight: 700 }, data: [tt.saldoDevedor, tt.amortizacao, tt.juros] },
    tooltip: { ...(claro ? tipClaro : tip), trigger: "axis", borderColor: corSaldo,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: e.linhaTempo } }, axisTick: { show: false },
      axisLabel: { color: e.rotuloTempo, fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: e.grade, type: "dashed" } },
      axisLabel: { color: e.rotuloFraco, fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: tt.saldoDevedor, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: corSaldo, shadowColor: corSaldo + "90", shadowBlur: claro ? 4 : 14 },
        itemStyle: { color: corSaldo, borderColor: borda, borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: claro ? [{ offset: 0, color: "rgba(16,27,61,0.22)" }, { offset: 1, color: "rgba(16,27,61,0)" }] : [{ offset: 0, color: "rgba(46,204,155,0.35)" }, { offset: 1, color: "rgba(46,204,155,0)" }] } },
        data: D.saldoDevedor },
      { name: tt.amortizacao, type: "line", smooth: true, symbol: "circle", symbolSize: 7,
        lineStyle: { width: 3, color: corAmort, shadowColor: corAmort + "80", shadowBlur: claro ? 4 : 10 },
        itemStyle: { color: corAmort, borderColor: borda, borderWidth: 2 }, data: D.amortizacao },
      { name: tt.juros, type: "line", smooth: true, symbol: "circle", symbolSize: 6,
        lineStyle: { width: 2.5, color: corJuros, type: "dashed", shadowColor: corJuros + "70", shadowBlur: claro ? 0 : 8 },
        itemStyle: { color: corJuros, borderColor: borda, borderWidth: 2 }, data: D.juros },
    ],
  };
}

export default function DashFinanceiro() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const [demo, setDemo] = useState(false);
  const [real, setReal] = useState<RealFin>(REAL_VAZIO);
  const claro = useDashClaro();

  useEffect(() => {
    let ativo = true;
    (async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().slice(0, 10);
      const doze = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1).toISOString().slice(0, 10);
      const empresaId = await obterEmpresaAtiva();
      if (!ativo) return;
      if (!empresaId) return;

      const [{ data: receitasMes }, { data: receitas12m }, { data: custosFix }, { data: custosVar12m }, { data: custosVarMes }, { data: dividas }] = await Promise.all([
        supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicioMes).lte("data", fimMes),
        supabase.from("receitas").select("valor, data, categoria").eq("empresa_id", empresaId).gte("data", doze),
        supabase.from("custos_fixos").select("valor_mensal, categoria").eq("empresa_id", empresaId),
        supabase.from("custos_variaveis").select("valor, data").eq("empresa_id", empresaId).gte("data", doze),
        supabase.from("custos_variaveis").select("valor").eq("empresa_id", empresaId).gte("data", inicioMes).lte("data", fimMes),
        supabase.from("dividas").select("valor_total, valor_pago").eq("empresa_id", empresaId),
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

  const kpis: KpiDash[] = demo ? [
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

  const chartBase = { demo, claro, rotuloDemo: tt.demo, rotuloVerModulo: tt.verModulo };

  return (
    <div className="space-y-4 w-full">

      <BotaoDemo demo={demo} onToggle={() => setDemo(v => !v)} claro={claro} rotulo={demo ? tt.verMeusDados : tt.verDemo} />
      {demo && <BannerDemo claro={claro} texto={tt.modoDemoAtivo} />}
      <KpisDash kpis={kpis} demo={demo} claro={claro} rotuloDemo={tt.demo} />
      <LetreiroDash itens={marquee} demo={demo} claro={claro}
        escuro={{ primeiro: "#c4b5fd", separador: "#8b5cf6", fundo: "linear-gradient(90deg, rgba(46,204,155,0.12), rgba(46,204,155,0.10))", borda: "1px solid rgba(46,204,155,0.22)" }} />

      {/* MODAL ÚNICO com TODOS os gráficos */}
      <PainelDash titulo={tt.painelTitulo} sub={tt.painelSub} claro={claro} barraEscuro={{ fundo: "linear-gradient(180deg,#8b5cf6,#06b6d4)", brilho: "#8b5cf6" }}>
          <div className="mb-4">
            {demo ? (
              <ChartDash {...chartBase} titulo={tt.endivid} cor={C.rosa} path="/endividamento" option={linhaEndiv(tt, claro)} altura={280} />
            ) : (
              <ChartDash {...chartBase} titulo={tt.endivid} cor={C.rosa} path="/endividamento" altura={280}
                option={real.temDivida ? rosca([{ name: tt.jaPago, value: real.dividaPaga, color: C.verde }, { name: tt.saldoDevedor, value: real.dividaTotal, color: C.rosa }], C.rosa, tt.total, claro) : undefined}
                vazio={tt.semDivida} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {demo ? (
              <>
                <ChartDash {...chartBase} titulo={tt.cf} cor={C.vermelho} path="/custos-fixos" option={barrasV(D.custosFixos, tt.meses, C.vermelho, C.vermelhoC, claro)} altura={260} />
                <ChartDash {...chartBase} titulo={tt.cv} cor={C.laranja} path="/custos-variaveis" option={barrasV(D.custosVar, tt.meses, C.laranja, C.laranjaC, claro)} altura={260} />
                <ChartDash {...chartBase} titulo={tt.fluxo} cor={C.cyan} path="/fluxo-caixa" option={rosca(D.fluxo.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.cyan, tt.total, claro)} altura={220} />
                <ChartDash {...chartBase} titulo={tt.receita} cor={C.ouro} path="/receitas" option={rosca(D.receita.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.ouro, tt.total, claro)} altura={220} />
              </>
            ) : (
              <>
                <ChartDash {...chartBase} titulo={tt.cf} cor={C.vermelho} path="/custos-fixos" altura={260}
                  option={real.custosFixosCategorias.length ? barrasV(real.custosFixosCategorias.map(c => c.value), real.custosFixosCategorias.map(c => c.name), C.vermelho, C.vermelhoC, claro) : undefined}
                  vazio={tt.semCustoFixo} />
                <ChartDash {...chartBase} titulo={tt.cv} cor={C.laranja} path="/custos-variaveis" altura={260}
                  option={real.custosVarSerie.some(v => v > 0) ? barrasV(real.custosVarSerie, tt.meses, C.laranja, C.laranjaC, claro) : undefined}
                  vazio={tt.semCustoVariavel} />
                <ChartDash {...chartBase} titulo={tt.fluxo} cor={C.cyan} path="/fluxo-caixa" altura={220}
                  option={real.receitaTotal > 0 || real.custosFixosTotal > 0 ? rosca([{ name: tt.entradas, value: real.receitaTotal, color: C.verde }, { name: tt.saidas, value: Math.max(0, real.receitaTotal - real.saldoCaixa), color: C.vermelho }], C.cyan, tt.total, claro) : undefined}
                  vazio={tt.semReceita} />
                <ChartDash {...chartBase} titulo={tt.receita} cor={C.ouro} path="/receitas" altura={220}
                  option={real.receitaCategorias.length ? rosca(real.receitaCategorias.map((c, i) => ({ name: c.name, value: c.value, color: serieCores(claro)[i % 5] })), C.ouro, tt.total, claro) : undefined}
                  vazio={tt.semReceita} />
              </>
            )}
          </div>
      </PainelDash>
    </div>
  );
}
