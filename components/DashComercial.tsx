"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../lib/LanguageContext";
import { serieRolling } from "../lib/cfoCore";
import { obterEmpresaAtiva } from "../lib/empresaHelpers";
import { fBRL, tip, tipClaro, EIXO, barrasV, rosca, fK } from "../lib/dashGraficos";
import { useDashClaro, BotaoDemo, BannerDemo, KpisDash, LetreiroDash, PainelDash, ChartDash, type KpiDash } from "./DashBlocos";

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

function linhaMetas(tt: any, claro = false) {
  const e = EIXO(claro);
  // Claro: realizado azul-marinho, meta verde-menta tracejada, projeção cinza pontilhada (chart-2/1/4)
  const [corReal, corMeta, corProj] = claro ? ["#101b3d", "#2ecc9b", "#6b7280"] : [C.roxo, C.ouro, C.cyan];
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 58, right: 24, top: 40, bottom: 30, containLabel: false },
    legend: { top: 2, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 18, icon: "roundRect",
      textStyle: { color: e.rotulo, fontSize: 12, fontWeight: 700 }, data: [tt.realizado, tt.meta, tt.projecao] },
    tooltip: { ...(claro ? tipClaro : tip), trigger: "axis", borderColor: corReal,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.filter(p => p.value != null).map(p => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: tt.meses,
      axisLine: { lineStyle: { color: e.linhaTempo } }, axisTick: { show: false },
      axisLabel: { color: e.rotuloTempo, fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: e.grade, type: "dashed" } },
      axisLabel: { color: e.rotuloFraco, fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: tt.realizado, type: "line", smooth: true, symbol: "circle", symbolSize: 8,
        lineStyle: { width: 4, color: corReal, shadowColor: corReal + "90", shadowBlur: claro ? 4 : 14 },
        itemStyle: { color: corReal, borderColor: e.bordaPonto, borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: claro ? [{ offset: 0, color: "rgba(16,27,61,0.22)" }, { offset: 1, color: "rgba(16,27,61,0)" }] : [{ offset: 0, color: "rgba(46,204,155,0.38)" }, { offset: 1, color: "rgba(46,204,155,0)" }] } },
        data: D.realizado },
      { name: tt.meta, type: "line", smooth: false, symbol: "none",
        lineStyle: { width: 2.5, color: corMeta, type: "dashed", shadowColor: corMeta + "70", shadowBlur: claro ? 0 : 8 },
        itemStyle: { color: corMeta }, data: D.meta },
      { name: tt.projecao, type: "line", smooth: true, symbol: "emptyCircle", symbolSize: 7,
        lineStyle: { width: 3, color: corProj, type: "dotted", shadowColor: corProj + "70", shadowBlur: claro ? 0 : 10 },
        itemStyle: { color: corProj, borderColor: e.bordaPonto, borderWidth: 2 }, data: D.projecao },
    ],
  };
}

export default function DashComercial() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const [demo, setDemo] = useState(false);
  const [real, setReal] = useState<RealCom>(REAL_VAZIO);
  const claro = useDashClaro();

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

  const kpis: KpiDash[] = demo ? [
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

  const chartBase = { demo, claro, rotuloDemo: tt.demo, rotuloVerModulo: tt.verModulo };

  return (
    <div className="space-y-4 w-full">

      <BotaoDemo demo={demo} onToggle={() => setDemo(v => !v)} claro={claro} rotulo={demo ? tt.verMeusDados : tt.verDemo} />
      {demo && <BannerDemo claro={claro} texto={tt.modoDemoAtivo} />}
      <KpisDash kpis={kpis} demo={demo} claro={claro} rotuloDemo={tt.demo} />
      <LetreiroDash itens={marquee} demo={demo} claro={claro}
        escuro={{ primeiro: "#67e8f9", separador: "#06b6d4", fundo: "linear-gradient(90deg, rgba(46,204,155,0.12), rgba(46,204,155,0.10))", borda: "1px solid rgba(46,204,155,0.22)" }} />

      {/* MODAL ÚNICO */}
      <PainelDash titulo={tt.painelTitulo} sub={tt.painelSub} claro={claro} barraEscuro={{ fundo: "linear-gradient(180deg,#06b6d4,#d4af37)", brilho: "#06b6d4" }}>
          <div className="mb-4">
            {demo ? (
              <ChartDash {...chartBase} titulo={tt.metasT} cor={C.roxo} path="/metas" option={linhaMetas(tt, claro)} altura={280} />
            ) : (
              <ChartDash {...chartBase} titulo={tt.metasT} cor={C.roxo} path="/metas" altura={280}
                vazio={real.metasCount > 0 ? `${real.metasCount} ${tt.metasCadastradasMsg}` : tt.semMeta} />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {demo ? (
              <>
                <ChartDash {...chartBase} titulo={tt.clientes} cor={C.azul} path="/clientes" option={barrasV(D.novosClientes, tt.meses, C.azul, C.azulC, claro)} altura={260} />
                <ChartDash {...chartBase} titulo={tt.inad} cor={C.rosa} path="/inadimplencia" option={barrasV(D.inadimplencia, tt.meses, C.rosa, C.rosaC, claro)} altura={260} />
                <ChartDash {...chartBase} titulo={tt.receber} cor={C.verde} path="/contas-receber" option={rosca(D.receber.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.verde, tt.total, claro)} altura={220} />
                <ChartDash {...chartBase} titulo={tt.invest} cor={C.ouro} path="/investimentos" option={rosca(D.invest.map(d => ({ name: (tt as any)[d.k], value: d.v, color: d.c })), C.ouro, tt.total, claro)} altura={220} />
              </>
            ) : (
              <>
                <ChartDash {...chartBase} titulo={tt.clientes} cor={C.azul} path="/clientes" altura={260}
                  option={real.novosClientesSerie.some(v => v > 0) ? barrasV(real.novosClientesSerie, tt.meses, C.azul, C.azulC, claro) : undefined}
                  vazio={tt.semCliente} />
                <ChartDash {...chartBase} titulo={tt.inad} cor={C.rosa} path="/inadimplencia" altura={260}
                  option={real.inadSerie.some(v => v > 0) ? barrasV(real.inadSerie, tt.meses, C.rosa, C.rosaC, claro) : undefined}
                  vazio={tt.semInadimplencia} />
                <ChartDash {...chartBase} titulo={tt.receber} cor={C.verde} path="/contas-receber" altura={220}
                  option={real.receberTotal > 0 ? rosca([
                    { name: tt.aVencer, value: real.receberAVencer, color: C.verde },
                    { name: tt.vence30, value: real.receberVence30, color: C.cyan },
                    { name: tt.atraso, value: real.receberAtraso, color: C.vermelho },
                  ].filter(b => b.value > 0), C.verde, tt.total, claro) : undefined}
                  vazio={tt.semReceber} />
                <ChartDash {...chartBase} titulo={tt.invest} cor={C.ouro} path="/investimentos" altura={220}
                  option={real.investCategorias.length ? rosca(real.investCategorias.map((c, i) => ({ name: mapaCatInvest[c.categoria] || c.categoria, value: c.value, color: [C.ouro, C.roxo, C.cyan, C.teal, C.rosa][i % 5] })), C.ouro, tt.total, claro) : undefined}
                  vazio={tt.semInvestimento} />
              </>
            )}
          </div>
      </PainelDash>
    </div>
  );
}
