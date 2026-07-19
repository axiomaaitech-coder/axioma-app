"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import ReactECharts from "echarts-for-react";
import DashFinanceiro from "../../../components/DashFinanceiro";
import DashComercial from "../../../components/DashComercial";
import {
  carregarSnapshot, carregarBenchmark, calcularScore360, detectarAnomalias, gerarPlanoAcao,
  type SnapshotFinanceiro, type Score360, type Anomalia, type AcaoSugerida,
} from "../../../lib/iaFinanceiraHelpers";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const T = {
  pt: {
    bomDia: "Bom dia", boaTarde: "Boa tarde", boaNoite: "Boa noite",
    carregando: "Carregando Dashboard...", tagline: "Seu CFO Digital — powered by IA",
    receita: "Receita", custos: "Custos", lucro: "Lucro Líquido", margem: "Margem Líquida",
    inadimplencia: "Inadimplência", ticket: "Ticket Médio", score360: "Score 360°",
    receber: "A Receber", pagar: "A Pagar", endividamento: "Dívidas",
    evolucaoReceita: "Evolução de Receita",
    receitaL: "Receita", custosL: "Custos", lucroL: "Lucro",
    composicaoFinanceira: "Composição Financeira",
    receitaPct: "Receita Líq.", custoFixoPct: "Custos Fixos", custoVarPct: "Custos Variáveis", lucroPct: "Lucro",
    distribuicaoCustos: "Distribuição de Custos",
    insightsEmpresa: "Insights da Empresa",
    lancamentos: "Lançamentos", eficiencia: "Eficiência Op.",
    topCustos: "Top Categorias de Custo",
    dimensoesScore: "Dimensões Score 360°",
    alertasIA: "Alertas Inteligentes", semAlertas: "Todos indicadores saudáveis.",
    acoesIA: "Ações Prioritárias", impacto: "Impacto",
    obrigacoes: "Obrigações Fiscais", vence: "Vence", semObrig: "Nenhuma pendência.",
    modulos: "Módulos Axioma",
    painelModulos: "Painel de Módulos", painelModulosDesc: "Visão consolidada das áreas mais usadas da sua empresa",
    dfTitulo: "Dashboard Financeiro", dfSub: "Receita · Custos · Fluxo de Caixa · Endividamento",
    dcTitulo: "Dashboard Comercial & Crescimento", dcSub: "Metas · Clientes · Recebíveis · Investimentos",
    pmClientes: "clientes cadastrados", pmFornecedores: "fornecedores ativos", pmContasReceber: "títulos em aberto",
    pmContasPagar: "títulos a pagar", pmMetas: "metas em andamento", pmInvestimentos: "aportes registrados",
    pmDre: "resultado do período", pmCentrosCusto: "centros ativos", pmEndividamento: "dívidas ativas",
    compartilhar: "📤 Compartilhar", fechar: "Fechar", copiar: "Copiar",
    centroCompart: "Centro de Compartilhamento", compartilharVia: "Compartilhar via",
    gerando: "Gerando...", copiado: "Copiado!", erroCopiar: "Erro",
    mensal: "Mensal", deste_mes: "deste mês",
    mReceitas: "Receitas", mCustosF: "C.Fixos", mCustosV: "C.Variáveis", mDre: "DRE",
    mFluxo: "Fluxo", mClientes: "Clientes", mRelatorios: "Relatórios", mEmpresa: "Empresa",
    mIaFin: "IA Financ.", mIaTrib: "IA Tribut.", mMei: "MEI", mFornec: "Fornecedores",
  },
  en: {
    bomDia: "Good morning", boaTarde: "Good afternoon", boaNoite: "Good evening",
    carregando: "Loading Dashboard...", tagline: "Your Digital CFO — powered by AI",
    receita: "Revenue", custos: "Costs", lucro: "Net Profit", margem: "Net Margin",
    inadimplencia: "Delinquency", ticket: "Avg Ticket", score360: "Score 360°",
    receber: "Receivable", pagar: "Payable", endividamento: "Debt",
    evolucaoReceita: "Revenue Growth",
    receitaL: "Revenue", custosL: "Costs", lucroL: "Profit",
    composicaoFinanceira: "Financial Composition",
    receitaPct: "Net Revenue", custoFixoPct: "Fixed Costs", custoVarPct: "Variable Costs", lucroPct: "Profit",
    distribuicaoCustos: "Cost Distribution",
    insightsEmpresa: "Company Insights",
    lancamentos: "Entries", eficiencia: "Op. Efficiency",
    topCustos: "Top Cost Categories",
    dimensoesScore: "Score 360° Dimensions",
    alertasIA: "Smart Alerts", semAlertas: "All indicators healthy.",
    acoesIA: "Priority Actions", impacto: "Impact",
    obrigacoes: "Fiscal Obligations", vence: "Due", semObrig: "No pending items.",
    modulos: "Axioma Modules",
    painelModulos: "Modules Panel", painelModulosDesc: "Consolidated view of your company's most used areas",
    dfTitulo: "Financial Dashboard", dfSub: "Revenue · Costs · Cash Flow · Debt",
    dcTitulo: "Sales & Growth Dashboard", dcSub: "Goals · Clients · Receivables · Investments",
    pmClientes: "registered clients", pmFornecedores: "active suppliers", pmContasReceber: "open receivables",
    pmContasPagar: "payables due", pmMetas: "goals in progress", pmInvestimentos: "recorded investments",
    pmDre: "period result", pmCentrosCusto: "active centers", pmEndividamento: "active debts",
    compartilhar: "📤 Share", fechar: "Close", copiar: "Copy",
    centroCompart: "Sharing Center", compartilharVia: "Share via",
    gerando: "Generating...", copiado: "Copied!", erroCopiar: "Error",
    mensal: "Monthly", deste_mes: "this month",
    mReceitas: "Revenue", mCustosF: "Fixed", mCustosV: "Variable", mDre: "P&L",
    mFluxo: "Cash Flow", mClientes: "Clients", mRelatorios: "Reports", mEmpresa: "Company",
    mIaFin: "Fin.AI", mIaTrib: "Tax AI", mMei: "MEI", mFornec: "Suppliers",
  },
  es: {
    bomDia: "Buenos días", boaTarde: "Buenas tardes", boaNoite: "Buenas noches",
    carregando: "Cargando Dashboard...", tagline: "Su CFO Digital — impulsado por IA",
    receita: "Ingresos", custos: "Costos", lucro: "Beneficio Neto", margem: "Margen Neto",
    inadimplencia: "Morosidad", ticket: "Ticket Medio", score360: "Score 360°",
    receber: "Cobrar", pagar: "Pagar", endividamento: "Deuda",
    evolucaoReceita: "Evolución de Ingresos",
    receitaL: "Ingresos", custosL: "Costos", lucroL: "Beneficio",
    composicaoFinanceira: "Composición Financiera",
    receitaPct: "Ingreso Neto", custoFixoPct: "Costos Fijos", custoVarPct: "Costos Variables", lucroPct: "Beneficio",
    distribuicaoCustos: "Distribución de Costos",
    insightsEmpresa: "Insights de la Empresa",
    lancamentos: "Movimientos", eficiencia: "Eficiencia Op.",
    topCustos: "Top Categorías de Costo",
    dimensoesScore: "Dimensiones Score 360°",
    alertasIA: "Alertas Inteligentes", semAlertas: "Indicadores saludables.",
    acoesIA: "Acciones Prioritarias", impacto: "Impacto",
    obrigacoes: "Obligaciones Fiscales", vence: "Vence", semObrig: "Sin pendencias.",
    modulos: "Módulos Axioma",
    painelModulos: "Panel de Módulos", painelModulosDesc: "Vista consolidada de las áreas más usadas de su empresa",
    dfTitulo: "Dashboard Financiero", dfSub: "Ingresos · Costos · Flujo de Caja · Deuda",
    dcTitulo: "Dashboard Comercial & Crecimiento", dcSub: "Metas · Clientes · Cobrar · Inversiones",
    pmClientes: "clientes registrados", pmFornecedores: "proveedores activos", pmContasReceber: "títulos por cobrar",
    pmContasPagar: "títulos por pagar", pmMetas: "metas en curso", pmInvestimentos: "aportes registrados",
    pmDre: "resultado del período", pmCentrosCusto: "centros activos", pmEndividamento: "deudas activas",
    compartilhar: "📤 Compartir", fechar: "Cerrar", copiar: "Copiar",
    centroCompart: "Centro de Compartir", compartilharVia: "Compartir vía",
    gerando: "Generando...", copiado: "¡Copiado!", erroCopiar: "Error",
    mensal: "Mensual", deste_mes: "este mes",
    mReceitas: "Ingresos", mCustosF: "C.Fijos", mCustosV: "C.Variables", mDre: "Estado R.",
    mFluxo: "Flujo", mClientes: "Clientes", mRelatorios: "Informes", mEmpresa: "Empresa",
    mIaFin: "IA Financ.", mIaTrib: "IA Tribut.", mMei: "MEI", mFornec: "Proveedores",
  },
};

// Cores exatas da referência (roxa/azul/cyan/rosa/verde)
const COR = { roxo: "#8b5cf6", indigo: "#6366f1", azul: "#3b82f6", cyan: "#06b6d4", teal: "#14b8a6", rosa: "#ec4899", verde: "#10b981", laranja: "#f97316", vermelho: "#ef4444", amarelo: "#eab308" };
const CORES_DIST = [COR.roxo, COR.azul, COR.cyan, COR.rosa, COR.teal, COR.indigo, COR.laranja, COR.amarelo];
const CORES_COMP = [COR.verde, COR.vermelho, COR.laranja, COR.roxo];
const ttip = { background: "rgba(10,8,30,0.97)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "14px", color: "#e2e8f0", fontSize: "12px", padding: "8px 12px" };

function fBRL(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0); }
function fData(iso: string, l: string) { if (!iso) return "—"; try { return new Date(iso + "T00:00:00").toLocaleDateString(l === "en" ? "en-US" : l === "es" ? "es-ES" : "pt-BR"); } catch { return iso; } }

// Glass Card — estilo referência com borda sutil e hover glow
function GC({ children, cor = COR.roxo, onClick, className = "" }: { children: React.ReactNode; cor?: string; onClick?: () => void; className?: string }) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-4px] ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.92) 0%, rgba(10,8,35,0.96) 100%)", border: "1px solid rgba(99,102,241,0.12)", boxShadow: "0 4px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)" }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 12px 50px rgba(0,0,0,0.5), 0 0 25px ${cor}12, inset 0 1px 0 rgba(255,255,255,0.06)`; e.currentTarget.style.borderColor = `${cor}35`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.12)"; }}>
      {children}
    </div>
  );
}

// Sparkline
function Spark({ data, cor = COR.roxo, h = 40 }: { data: number[]; cor?: string; h?: number }) {
  if (!data || data.length < 2) return null;
  return (<ResponsiveContainer width="100%" height={h}><AreaChart data={data.map(v => ({ v }))}>
    <defs><linearGradient id={`s${cor.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cor} stopOpacity={0.5}/><stop offset="95%" stopColor={cor} stopOpacity={0}/></linearGradient></defs>
    <Area type="monotone" dataKey="v" stroke={cor} fill={`url(#s${cor.slice(1)})`} strokeWidth={2} dot={false} />
  </AreaChart></ResponsiveContainer>);
}

// Mini bars
function MBars({ data, cor = COR.roxo, h = 40 }: { data: number[]; cor?: string; h?: number }) {
  if (!data || data.length < 2) return null;
  return (<ResponsiveContainer width="100%" height={h}><BarChart data={data.map(v => ({ v: Math.max(0, v) }))}>
    <Bar dataKey="v" fill={cor} radius={[3, 3, 0, 0]} opacity={0.8} />
  </BarChart></ResponsiveContainer>);
}

// Barras GROSSAS estilo Power BI/Excel premium — para o Painel de Módulos
function fmtCompact(v: number): string {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1).replace(".0", "")}k`;
  return `${Math.round(v)}`;
}

// Rótulo customizado em cima de cada barra — valor formatado em R$
function ValueLabel(props: any) {
  const { x, y, width, value, cor } = props;
  return (
    <text x={x + width / 2} y={y - 8} textAnchor="middle" fill={cor || "#f1f5f9"} fontSize={12} fontWeight={800}>
      {typeof value === "number" ? fBRL(value) : value}
    </text>
  );
}

// ══════ PAINEL GROSSO ESTILO POWER BI — barras vivas, multicoloridas, com valores ══════
function BigBarPanel({ titulo, icone, cor, subtitulo, dados, path, router, altura = 340, horizontal = false }: {
  titulo: string; icone: string; cor: string; subtitulo: string;
  dados: { label: string; value: number; color: string }[]; path: string; router: any; altura?: number; horizontal?: boolean;
}) {
  const grad = (c: string) => ({
    type: "linear", x: 0, y: horizontal ? 0 : 0, x2: horizontal ? 1 : 0, y2: horizontal ? 0 : 1,
    colorStops: [{ offset: 0, color: c }, { offset: 1, color: c + "70" }],
  });

  const eixoCat = {
    type: "category" as const,
    data: dados.map(d => d.label),
    axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } },
    axisTick: { show: false },
    axisLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 },
  };
  const eixoVal = {
    type: "value" as const,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: "rgba(148,163,184,0.07)", type: "dashed" } },
    axisLabel: { color: "#64748b", fontSize: 11, formatter: (v: number) => fBRL(v) },
  };

  const option = {
    backgroundColor: "transparent",
    animationDuration: 800,
    animationEasing: "cubicOut",
    grid: horizontal
      ? { left: 130, right: 90, top: 16, bottom: 24, containLabel: false }
      : { left: 74, right: 24, top: 42, bottom: 34, containLabel: false },
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(10,8,30,0.97)",
      borderColor: cor,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: "#e2e8f0", fontSize: 13 },
      formatter: (p: any) => `<b style="color:${p.color?.colorStops?.[0]?.color || cor}">${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b>`,
    },
    xAxis: horizontal ? eixoVal : eixoCat,
    yAxis: horizontal ? eixoCat : eixoVal,
    series: [{
      type: "bar",
      barWidth: horizontal ? 30 : 64,
      data: dados.map(d => ({
        value: d.value,
        name: d.label,
        itemStyle: {
          color: grad(d.color),
          borderRadius: horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0],
          shadowColor: d.color + "60",
          shadowBlur: 14,
          shadowOffsetY: horizontal ? 0 : -2,
        },
      })),
      label: {
        show: true,
        position: horizontal ? "right" : "top",
        distance: 8,
        color: "#f1f5f9",
        fontSize: 12,
        fontWeight: 800,
        formatter: (p: any) => fBRL(p.value),
      },
      emphasis: { itemStyle: { shadowBlur: 26 }, scale: false },
    }],
  };

  return (
    <GC cor={cor}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-base font-black flex items-center gap-2" style={{ color: "#f1f5f9" }}>
              <span className="text-xl">{icone}</span>{titulo}
            </p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "#64748b" }}>{subtitulo}</p>
          </div>
          <button onClick={() => router.push(path)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
            style={{ background: `${cor}18`, border: `1px solid ${cor}40`, color: cor }}>
            {`Ver módulo →`}
          </button>
        </div>
        <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
      </div>
    </GC>
  );
}

// ══ DONUT ECharts estilo Power BI — aro grosso, % no centro, legenda lateral ══
function DonutPanel({ titulo, icone, cor, subtitulo, dados, path, router, centroLabel, centroValor, tag }: {
  titulo: string; icone: string; cor: string; subtitulo: string;
  dados: { name: string; value: number; color: string; pct?: number }[];
  path: string; router: any; centroLabel: string; centroValor: string; tag?: string;
}) {
  const total = dados.reduce((a, b) => a + b.value, 0);
  const option = {
    backgroundColor: "transparent",
    animationDuration: 900,
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(10,8,30,0.97)",
      borderColor: cor, borderWidth: 1, padding: [8, 12],
      textStyle: { color: "#e2e8f0", fontSize: 13 },
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b> &nbsp;<span style="color:${cor}">${p.percent}%</span>`,
    },
    legend: {
      orient: "vertical", right: "4%", top: "center",
      itemWidth: 14, itemHeight: 14, itemGap: 16, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 13, fontWeight: 600 },
      formatter: (name: string) => {
        const d = dados.find(x => x.name === name);
        const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0;
        return `${name}  ${pct}%`;
      },
    },
    series: [{
      type: "pie",
      radius: ["58%", "82%"],
      center: ["32%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: "rgba(10,8,32,0.9)", borderWidth: 3, borderRadius: 6 },
      label: { show: false },
      labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 8, itemStyle: { shadowBlur: 24, shadowColor: cor + "80" } },
      data: dados.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })),
    }],
    graphic: [
      { type: "text", left: "32%", top: "46%", style: { text: centroValor, textAlign: "center", fill: "#f1f5f9", fontSize: 22, fontWeight: 900 }, z: 10 },
      { type: "text", left: "32%", top: "55%", style: { text: centroLabel, textAlign: "center", fill: "#64748b", fontSize: 11, fontWeight: 700 }, z: 10 },
    ],
  };
  return (
    <GC cor={cor}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-base font-black flex items-center gap-2" style={{ color: "#f1f5f9" }}>
              <span className="text-xl">{icone}</span>{titulo}
              {tag && <span className="text-[9px] px-2 py-0.5 rounded-md font-bold" style={{ background: `${cor}25`, color: cor }}>{tag}</span>}
            </p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "#64748b" }}>{subtitulo}</p>
          </div>
          <button onClick={() => router.push(path)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 flex-shrink-0"
            style={{ background: `${cor}18`, border: `1px solid ${cor}40`, color: cor }}>
            {`Ver módulo →`}
          </button>
        </div>
        <ReactECharts option={option} style={{ height: 320, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
      </div>
    </GC>
  );
}

// Caixa hexagonal de KPI — estilo dos cards da referência (129 / 641 / 770)
function StatHex({ valor, label, cor, onClick }: { valor: string; label: string; cor: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 ${onClick ? "cursor-pointer" : ""}`}
      style={{
        clipPath: "polygon(25% 4%, 75% 4%, 96% 50%, 75% 96%, 25% 96%, 4% 50%)",
        background: `linear-gradient(160deg, ${cor}30, ${cor}10)`,
        border: `1px solid ${cor}50`,
        width: "128px", height: "128px",
        boxShadow: `0 0 25px ${cor}20`,
      }}>
      <p className="text-2xl font-black" style={{ color: cor }}>{valor}</p>
      <p className="text-[9px] font-bold uppercase tracking-wide mt-1 px-2" style={{ color: "#cbd5e1" }}>{label}</p>
    </div>
  );
}


export default function DashboardPage() {
  const router = useRouter();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];

  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [empresaNome, setEmpresaNome] = useState("");
  const [snap, setSnap] = useState<SnapshotFinanceiro | null>(null);
  const [score360, setScore360] = useState<Score360 | null>(null);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [acoes, setAcoes] = useState<AcaoSugerida[]>([]);
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [topCustos, setTopCustos] = useState<any[]>([]);
  const [distribuicao, setDistribuicao] = useState<any[]>([]);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [modulosData, setModulosData] = useState<any>(null);
  const [shareAberto, setShareAberto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: string } | null>(null);
  function showToast(m: string, t: string = "info") { setToast({ msg: m, tipo: t }); setTimeout(() => setToast(null), 3000); }

  const hora = new Date();
  const saudacao = hora.getHours() < 12 ? tt.bomDia : hora.getHours() < 18 ? tt.boaTarde : tt.boaNoite;

  useEffect(() => { init(); }, []);

  async function init() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setNomeUsuario((user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split("@")[0] || "").split(" ")[0]);
    const { data: emp } = await supabase.from("empresas").select("nome_fantasia, razao_social, nome").eq("user_id", user.id).limit(1).maybeSingle();
    if (emp) setEmpresaNome(emp.nome_fantasia || emp.razao_social || emp.nome || "");

    try {
      const s = await carregarSnapshot(user.id);
      const b = await carregarBenchmark(s.setor);
      const sc = calcularScore360(s, b);
      setSnap(s); setScore360(sc); setAnomalias(detectarAnomalias(s, b)); setAcoes(gerarPlanoAcao(s, sc, detectarAnomalias(s, b)));

      const nm = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      const evolReal = s.total_receitas_6m.map((r, i) => ({ mes: nm[(new Date().getMonth() - 5 + i + 12) % 12], receita: r, custos: s.total_custos_6m[i] || 0, lucro: r - (s.total_custos_6m[i] || 0) }));
      const temDadosEvolucao = s.total_receitas_6m.some(r => r > 0);

      const evolExemplo = [
        { mes: "Jan", receita: 8500, custos: 5200, lucro: 3300 },
        { mes: "Fev", receita: 9200, custos: 5500, lucro: 3700 },
        { mes: "Mar", receita: 11000, custos: 6100, lucro: 4900 },
        { mes: "Abr", receita: 10500, custos: 5900, lucro: 4600 },
        { mes: "Mai", receita: 12800, custos: 6400, lucro: 6400 },
        { mes: "Jun", receita: 14200, custos: 6800, lucro: 7400 },
      ];

      setEvolucao(temDadosEvolucao ? evolReal : evolExemplo);

      const { data: cv } = await supabase.from("custos_variaveis").select("valor, categoria").eq("user_id", user.id);
      const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal, categoria").eq("user_id", user.id);
      const m = new Map<string, number>();
      (cv || []).forEach((r: any) => { const c = r.categoria || "Variáveis"; m.set(c, (m.get(c) || 0) + Number(r.valor || 0)); });
      (cf || []).forEach((r: any) => { const c = r.categoria || "Fixos"; m.set(c, (m.get(c) || 0) + Number(r.valor_mensal || 0)); });
      const sorted = Array.from(m.entries()).map(([name, value], i) => ({ name, value: Math.round(value), color: CORES_DIST[i % CORES_DIST.length], pct: 0 })).sort((a, b) => b.value - a.value);
      const totalD = sorted.reduce((s, d) => s + d.value, 0);
      sorted.forEach(d => d.pct = totalD > 0 ? Math.round((d.value / totalD) * 100) : 0);

      // Se não tem dados reais, usa exemplo pra o Dashboard não ficar vazio
      const exemploDistribuicao = [
        { name: lang === "en" ? "Rent" : lang === "es" ? "Alquiler" : "Aluguel", value: 3500, color: CORES_DIST[0], pct: 28 },
        { name: lang === "en" ? "Payroll" : lang === "es" ? "Nómina" : "Folha", value: 5200, color: CORES_DIST[1], pct: 41 },
        { name: lang === "en" ? "Suppliers" : lang === "es" ? "Proveedores" : "Fornecedores", value: 2400, color: CORES_DIST[2], pct: 19 },
        { name: "Marketing", value: 1100, color: CORES_DIST[3], pct: 9 },
        { name: lang === "en" ? "Others" : lang === "es" ? "Otros" : "Outros", value: 380, color: CORES_DIST[4], pct: 3 },
      ];

      setTopCustos(sorted.length > 0 ? sorted.slice(0, 5) : exemploDistribuicao);
      setDistribuicao(sorted.length > 0 ? sorted.slice(0, 6) : exemploDistribuicao);

      const { data: ob } = await supabase.from("empresa_obrigacoes").select("nome, data_vencimento, status, valor_estimado")
        .eq("user_id", user.id).eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(4);
      setObrigacoes(ob || []);

      // Dados extras pro Painel de Módulos (barras grossas estilo Power BI)
      const [
        { data: clientesRows },
        { data: fornecedoresRows },
        { data: crAbertas },
        { data: cpAbertas },
        { data: metasRows },
        { data: investRows },
      ] = await Promise.all([
        Promise.resolve(supabase.from("clientes").select("id").eq("user_id", user.id)).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from("fornecedores").select("id, valor_total").eq("user_id", user.id)).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from("contas_receber").select("valor, valor_recebido, status").eq("user_id", user.id).neq("status", "recebido")).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from("contas_pagar").select("valor_total, valor_pago, status").eq("user_id", user.id).neq("status", "pago")).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from("metas").select("id, valor_meta, valor_atual").eq("user_id", user.id)).catch(() => ({ data: [] })),
        Promise.resolve(supabase.from("investimentos").select("id, valor").eq("user_id", user.id)).catch(() => ({ data: [] })),
      ]);

      setModulosData({
        clientesCount: (clientesRows || []).length,
        fornecedoresCount: (fornecedoresRows || []).length,
        fornecedoresTotal: (fornecedoresRows || []).reduce((sm: number, r: any) => sm + Number(r.valor_total || 0), 0),
        crCount: (crAbertas || []).length,
        crTotal: (crAbertas || []).reduce((sm: number, r: any) => sm + (Number(r.valor || 0) - Number(r.valor_recebido || 0)), 0),
        cpCount: (cpAbertas || []).length,
        cpTotal: (cpAbertas || []).reduce((sm: number, r: any) => sm + (Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0),
        metasCount: (metasRows || []).length,
        metasProgresso: (metasRows || []).length > 0 ? Math.round(((metasRows || []).reduce((sm: number, r: any) => sm + (Number(r.valor_meta) > 0 ? Math.min(1, Number(r.valor_atual || 0) / Number(r.valor_meta)) : 0), 0) / (metasRows || []).length) * 100) : 0,
        investTotal: (investRows || []).reduce((sm: number, r: any) => sm + Number(r.valor || 0), 0),
        investCount: (investRows || []).length,
      });
    } catch (err) { console.error(err); }
    setCarregando(false);
  }

  const mom = snap && snap.total_receitas_6m.length >= 2
    ? ((snap.total_receitas_6m[5] - snap.total_receitas_6m[4]) / Math.max(snap.total_receitas_6m[4], 1)) * 100 : 0;

  // Composição financeira (pra 2o donut)
  const composicaoReal = snap ? [
    { name: tt.lucroPct, value: Math.max(0, snap.lucro_liquido), color: COR.verde, pct: snap.receita_bruta > 0 ? Math.round((Math.max(0, snap.lucro_liquido) / snap.receita_bruta) * 100) : 0 },
    { name: tt.custoFixoPct, value: snap.custos_fixos, color: COR.vermelho, pct: snap.receita_bruta > 0 ? Math.round((snap.custos_fixos / snap.receita_bruta) * 100) : 0 },
    { name: tt.custoVarPct, value: snap.custos_variaveis, color: COR.laranja, pct: snap.receita_bruta > 0 ? Math.round((snap.custos_variaveis / snap.receita_bruta) * 100) : 0 },
  ].filter(d => d.value > 0) : [];

  const exemploComposicao = [
    { name: tt.lucroPct, value: 4200, color: COR.verde, pct: 35 },
    { name: tt.custoFixoPct, value: 4800, color: COR.vermelho, pct: 40 },
    { name: tt.custoVarPct, value: 3000, color: COR.laranja, pct: 25 },
  ];

  const composicao = composicaoReal.length > 0 ? composicaoReal : exemploComposicao;
  const usandoExemplo = composicaoReal.length === 0;

  // Share
  function mSh() { if (!snap || !score360) return "Axioma"; return [`🦅 *AXIOMA AI.TECH*`, empresaNome ? `🏢 *${empresaNome}*` : "", `🏆 Score: *${score360.total}/100*`, `💰 ${tt.receita}: ${fBRL(snap.receita_bruta)}`, `✅ ${tt.lucro}: ${fBRL(snap.lucro_liquido)}`, `📊 ${tt.margem}: ${snap.margem_liquida.toFixed(1)}%`, ``, `_axiomaai.com.br_`].filter(Boolean).join("\n"); }
  function sWA() { window.open(`https://wa.me/?text=${encodeURIComponent(mSh())}`, "_blank"); }
  function sTG() { window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${encodeURIComponent(mSh())}`, "_blank"); }
  function sGM() { window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(mSh().replace(/\*/g, ""))}`, "_blank"); }
  function sOL() { window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(mSh().replace(/\*/g, ""))}`, "_blank"); }
  async function sCp() { try { await navigator.clipboard.writeText(mSh().replace(/\*/g, "")); showToast(tt.copiado, "ok"); } catch { showToast(tt.erroCopiar, "erro"); } }

  async function exportarPDF() {
    if (!snap || !score360) return; setExportando(true);
    try { await gerarPdfTabela({ titulo: "Axioma Dashboard CFO", subtitulo: snap.periodo,
      colunas: [{ header: "MÉTRICA", key: "m", width: 55, align: "left" as const }, { header: "VALOR", key: "v", width: 40, align: "right" as const }],
      linhas: [{ m: tt.receita, v: fBRL(snap.receita_bruta) }, { m: tt.custos, v: fBRL(snap.custos_totais) }, { m: tt.lucro, v: fBRL(snap.lucro_liquido) }, { m: tt.margem, v: `${snap.margem_liquida.toFixed(1)}%` },
        ...score360.dimensoes.map(d => ({ m: lang === "en" ? d.nome_en : d.nome, v: `${d.score}/100` }))],
      resumo: [{ label: "Score 360°", valor: `${score360.total}/100` }], nomeArquivo: "axioma-dashboard.pdf" });
    } catch (e: any) { showToast(e.message, "erro"); } setExportando(false);
  }

  const dN = (d: any) => lang === "en" ? d.nome_en : lang === "es" ? d.nome_es : d.nome;
  const aN = (a: Anomalia) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const acN = (a: AcaoSugerida) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;

  const mods = [
    { l: tt.mReceitas, i: "💰", p: "/receitas", c: COR.verde }, { l: tt.mCustosF, i: "📌", p: "/custos-fixos", c: COR.vermelho },
    { l: tt.mCustosV, i: "📉", p: "/custos-variaveis", c: COR.laranja }, { l: tt.mDre, i: "📈", p: "/dre", c: COR.indigo },
    { l: tt.mFluxo, i: "💧", p: "/fluxo-caixa", c: COR.cyan }, { l: tt.mClientes, i: "👥", p: "/clientes", c: COR.azul },
    { l: tt.mRelatorios, i: "📊", p: "/relatorios", c: COR.amarelo }, { l: tt.mEmpresa, i: "🏢", p: "/empresa", c: COR.roxo },
    { l: tt.mIaFin, i: "🧠", p: "/ia-financeira", c: COR.rosa }, { l: tt.mIaTrib, i: "🏛️", p: "/ia-tributaria", c: COR.laranja },
    { l: tt.mFornec, i: "🏭", p: "/fornecedores", c: COR.teal }, { l: tt.mMei, i: "🧾", p: "/mei", c: COR.amarelo },
  ];

  return (
    <div className="min-h-screen p-3 md:p-5 overflow-auto" style={{ background: "linear-gradient(180deg, #06031a 0%, #020810 50%)" }}>
      {toast && (<div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm" style={{ background: toast.tipo === "erro" ? "rgba(239,68,68,0.95)" : "rgba(99,102,241,0.95)", color: "#fff", fontWeight: 700, fontSize: 13 }}>{toast.msg}</div>)}

      {carregando && (<div className="py-32 text-center"><div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className="text-sm font-semibold" style={{ color: COR.roxo }}>{tt.carregando}</p></div>)}

      {!carregando && snap && score360 && (
        <div className="space-y-5 w-full">

          {/* ══════ HERO VIDEO ══════ */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: "460px" }}>
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="/hero-axioma.mp4" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,3,26,0.55) 0%, rgba(6,3,26,0.25) 35%, rgba(6,3,26,0.55) 75%, rgba(6,3,26,0.85) 100%)" }} />
            {/* Logo grande em destaque, sempre visível */}
            <div className="absolute top-6 left-8 md:left-14 z-20 flex items-center gap-3">
              <img src="/logo-aitech.png" alt="Axioma AI.Tech" style={{ width: 56, height: 56, objectFit: "contain" }} />
              <div>
                <p className="text-xl md:text-2xl font-black tracking-wide" style={{ color: "#f1f5f9" }}>AXIOMA</p>
                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em]" style={{ color: "#c4b5fd" }}>AI.TECH</p>
              </div>
            </div>
            <div className="absolute inset-0 z-10 flex items-end justify-between px-8 md:px-14 pb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-black" style={{ color: "#f1f5f9" }}>
                  {saudacao}, <span style={{ color: "#c4b5fd" }}>{nomeUsuario}</span>
                </h1>
                {empresaNome && <p className="text-base mt-2 font-semibold" style={{ color: "#e2e8f0" }}>🏢 {empresaNome}</p>}
                <p className="text-sm mt-3 font-medium" style={{ color: "#94a3b8" }}>{tt.tagline}</p>
              </div>
              <div className="hidden md:flex gap-3">
                <button onClick={() => setShareAberto(true)} className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
                  style={{ background: "rgba(139,92,246,0.35)", border: "1px solid rgba(139,92,246,0.6)", color: "#e2e8f0", backdropFilter: "blur(8px)" }}>{tt.compartilhar}</button>
                <button onClick={exportarPDF} disabled={exportando} className="px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all hover:scale-105"
                  style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>{exportando ? tt.gerando : "📄 PDF"}</button>
              </div>
            </div>
          </div>

          {/* ══════ LETREIRO — DASHBOARD FINANCEIRO ══════ */}
          <div className="relative rounded-2xl overflow-hidden mt-2"
            style={{ background: "linear-gradient(120deg, rgba(139,92,246,0.16), rgba(10,8,32,0.6) 55%, rgba(6,182,212,0.10))", border: "1px solid rgba(139,92,246,0.28)" }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "linear-gradient(180deg, #8b5cf6, #06b6d4)", boxShadow: "0 0 18px #8b5cf6" }} />
            <div className="px-7 py-5 flex items-center gap-4">
              <span className="text-3xl">💼</span>
              <div>
                <h2 className="text-2xl md:text-[28px] font-black tracking-tight" style={{ fontFamily: "'Georgia','Times New Roman',serif", color: "#f8fafc", letterSpacing: "0.5px" }}>
                  {tt.dfTitulo}
                </h2>
                <p className="text-[11px] md:text-xs font-semibold mt-1 tracking-[0.18em] uppercase" style={{ color: "#a5b4fc" }}>{tt.dfSub}</p>
              </div>
            </div>
          </div>

          {/* ══════ DASHBOARD FINANCEIRO — full-bleed ══════ */}
          <div className="-mx-3 md:-mx-5 px-3 md:px-5 pt-2 pb-1">
            <DashFinanceiro />
          </div>

          {/* ══════ LETREIRO — DASHBOARD COMERCIAL ══════ */}
          <div className="relative rounded-2xl overflow-hidden mt-4"
            style={{ background: "linear-gradient(120deg, rgba(6,182,212,0.16), rgba(10,8,32,0.6) 55%, rgba(212,175,55,0.10))", border: "1px solid rgba(6,182,212,0.28)" }}>
            <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: "linear-gradient(180deg, #06b6d4, #d4af37)", boxShadow: "0 0 18px #06b6d4" }} />
            <div className="px-7 py-5 flex items-center gap-4">
              <span className="text-3xl">🚀</span>
              <div>
                <h2 className="text-2xl md:text-[28px] font-black tracking-tight" style={{ fontFamily: "'Georgia','Times New Roman',serif", color: "#f8fafc", letterSpacing: "0.5px" }}>
                  {tt.dcTitulo}
                </h2>
                <p className="text-[11px] md:text-xs font-semibold mt-1 tracking-[0.18em] uppercase" style={{ color: "#67e8f9" }}>{tt.dcSub}</p>
              </div>
            </div>
          </div>

          {/* ══════ DASHBOARD COMERCIAL — full-bleed ══════ */}
          <div className="-mx-3 md:-mx-5 px-3 md:px-5 pt-2 pb-1">
            <DashComercial />
          </div>

          {/* ══════ MÓDULOS — estilo Frontend/API/Backend da referência ══════ */}
          <GC cor={COR.indigo}>
            <div className="p-4">
              <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9" }}>⚡ {tt.modulos}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {mods.map((m, i) => (
                  <button key={i} onClick={() => router.push(m.p)}
                    className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl transition-all duration-200 hover:translate-y-[-4px]"
                    style={{ background: `${m.c}06`, border: `1px solid ${m.c}12` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${m.c}18`; e.currentTarget.style.borderColor = `${m.c}40`; e.currentTarget.style.boxShadow = `0 6px 20px ${m.c}15`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${m.c}06`; e.currentTarget.style.borderColor = `${m.c}12`; e.currentTarget.style.boxShadow = "none"; }}>
                    <span className="text-xl">{m.i}</span>
                    <span className="text-[8px] md:text-[9px] font-bold leading-tight text-center" style={{ color: m.c }}>{m.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </GC>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto" style={{ background: "rgba(6,3,26,0.92)", backdropFilter: "blur(10px)" }} onClick={() => setShareAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.98), rgba(10,8,35,0.99))", border: "1px solid rgba(139,92,246,0.25)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-black" style={{ color: "#f1f5f9" }}>{tt.centroCompart}</p>
              <button onClick={() => setShareAberto(false)} className="text-xl" style={{ color: "#475569" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {[
                { fn: sWA, l: "WhatsApp", i: "📱", bg: "rgba(37,211,102,0.1)", bd: "rgba(37,211,102,0.3)", c: "#25d366" },
                { fn: sTG, l: "Telegram", i: "✈️", bg: "rgba(34,158,217,0.1)", bd: "rgba(34,158,217,0.3)", c: "#229ed9" },
                { fn: sGM, l: "Gmail", i: "📨", bg: "rgba(234,67,53,0.1)", bd: "rgba(234,67,53,0.3)", c: "#ea4335" },
                { fn: sOL, l: "Outlook", i: "📩", bg: "rgba(0,120,212,0.1)", bd: "rgba(0,120,212,0.3)", c: "#0078d4" },
                { fn: sCp, l: tt.copiar, i: "📋", bg: "rgba(139,92,246,0.1)", bd: "rgba(139,92,246,0.3)", c: COR.roxo },
                { fn: exportarPDF, l: "PDF", i: exportando ? "⏳" : "📄", bg: "rgba(239,68,68,0.1)", bd: "rgba(239,68,68,0.3)", c: COR.vermelho },
              ].map((b, i) => (
                <button key={i} onClick={b.fn} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all hover:scale-105" style={{ background: b.bg, border: `1px solid ${b.bd}`, color: b.c }}><span className="text-xl">{b.i}</span>{b.l}</button>
              ))}
            </div>
            <button onClick={() => setShareAberto(false)} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: "rgba(139,92,246,0.1)", color: COR.roxo }}>{tt.fechar}</button>
          </div>
        </div>
      )}
    </div>
  );
}