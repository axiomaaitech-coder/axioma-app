"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, LabelList,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
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
function BigBarPanel({ titulo, icone, cor, subtitulo, dados, path, router, altura = 380, horizontal = false }: {
  titulo: string; icone: string; cor: string; subtitulo: string;
  dados: { label: string; value: number; color: string }[]; path: string; router: any; altura?: number; horizontal?: boolean;
}) {
  return (
    <GC cor={cor}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
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
        <ResponsiveContainer width="100%" height={altura}>
          <BarChart data={dados} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 28, right: 24, left: horizontal ? 8 : 0, bottom: 0 }} barCategoryGap="10%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" horizontal={!horizontal} vertical={horizontal} />
            {horizontal ? (
              <>
                <XAxis type="number" stroke="#334155" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                <YAxis type="category" dataKey="label" stroke="#334155" tick={{ fontSize: 12, fill: "#e2e8f0", fontWeight: 700 }} width={110} />
              </>
            ) : (
              <>
                <XAxis dataKey="label" stroke="#334155" tick={{ fontSize: 12, fill: "#e2e8f0", fontWeight: 700 }} />
                <YAxis stroke="#334155" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              </>
            )}
            <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
            <Bar dataKey="value" radius={horizontal ? [0, 12, 12, 0] : [12, 12, 4, 4]} barSize={horizontal ? 46 : 92}>
              {dados.map((d, i) => <Cell key={i} fill={d.color} />)}
              <LabelList dataKey="value" position={horizontal ? "right" : "top"}
                formatter={(v: number) => fBRL(v)}
                style={{ fill: "#f1f5f9", fontSize: 12, fontWeight: 800 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
        supabase.from("clientes").select("id").eq("user_id", user.id).then(r => r).catch(() => ({ data: [] })),
        supabase.from("fornecedores").select("id, valor_total").eq("user_id", user.id).then(r => r).catch(() => ({ data: [] })),
        supabase.from("contas_receber").select("valor, valor_recebido, status").eq("user_id", user.id).neq("status", "recebido").then(r => r).catch(() => ({ data: [] })),
        supabase.from("contas_pagar").select("valor_total, valor_pago, status").eq("user_id", user.id).neq("status", "pago").then(r => r).catch(() => ({ data: [] })),
        supabase.from("metas").select("id, valor_meta, valor_atual").eq("user_id", user.id).then(r => r).catch(() => ({ data: [] })),
        supabase.from("investimentos").select("id, valor").eq("user_id", user.id).then(r => r).catch(() => ({ data: [] })),
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
              <div className="flex items-center justify-center rounded-2xl" style={{ width: 56, height: 56, background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.5)", backdropFilter: "blur(10px)" }}>
                <span className="text-3xl">🦅</span>
              </div>
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

          {/* ══════ LINHA 1: 4 KPIs (esq) + GRÁFICO GRANDE (dir) ══════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 4 KPIs em grid 2x2 */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {/* Receita + sparkline */}
              <GC cor={COR.roxo} onClick={() => router.push("/receitas")}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "#94a3b8" }}>{tt.receita}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-black" style={{ background: mom >= 0 ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: mom >= 0 ? COR.verde : COR.vermelho }}>
                      {mom >= 0 ? "▲" : "▼"} {Math.abs(mom).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xl font-black tracking-tight" style={{ color: "#f1f5f9" }}>{fBRL(snap.receita_bruta)}</p>
                  <div className="mt-2"><Spark data={snap.total_receitas_6m} cor={COR.roxo} /></div>
                </div>
              </GC>

              {/* Lucro + mini bars */}
              <GC cor={snap.lucro_liquido >= 0 ? COR.verde : COR.vermelho} onClick={() => router.push("/dre")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#94a3b8" }}>{tt.lucro}</p>
                  <p className="text-xl font-black tracking-tight" style={{ color: snap.lucro_liquido >= 0 ? COR.verde : COR.vermelho }}>{fBRL(snap.lucro_liquido)}</p>
                  <div className="mt-2"><MBars data={snap.total_receitas_6m.map((r, i) => r - (snap.total_custos_6m[i] || 0))} cor={snap.lucro_liquido >= 0 ? COR.verde : COR.vermelho} /></div>
                </div>
              </GC>

              {/* Margem + barra */}
              <GC cor={COR.cyan} onClick={() => router.push("/relatorios")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#94a3b8" }}>{tt.margem}</p>
                  <p className="text-2xl font-black" style={{ color: snap.margem_liquida >= 10 ? COR.cyan : COR.amarelo }}>{snap.margem_liquida.toFixed(1)}%</p>
                  <div className="mt-3 rounded-full h-2" style={{ background: "rgba(6,182,212,0.12)" }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, snap.margem_liquida * 2.5))}%`, background: `linear-gradient(90deg, ${COR.cyan}, ${COR.roxo})` }} />
                  </div>
                </div>
              </GC>

              {/* Score 360 */}
              <GC cor={score360.cor} onClick={() => router.push("/ia-financeira")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: "#94a3b8" }}>🏆 Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: score360.cor }}>{score360.total}</span>
                    <span className="text-sm font-bold" style={{ color: "#475569" }}>/100</span>
                  </div>
                  <p className="text-[10px] font-bold mt-1" style={{ color: score360.cor }}>{lang === "en" ? score360.nivel_en : lang === "es" ? score360.nivel_es : score360.nivel}</p>
                </div>
              </GC>
            </div>

            {/* Gráfico grande — Revenue Growth */}
            <div className="lg:col-span-8">
              <GC cor={COR.indigo}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-base font-black" style={{ color: "#f1f5f9" }}>📈 {tt.evolucaoReceita}</p>
                      <p className="text-[10px] font-medium mt-0.5" style={{ color: "#64748b" }}>{tt.mensal} • {tt.deste_mes}</p>
                    </div>
                    <div className="flex gap-4 text-[10px] font-bold">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: COR.roxo }}></span><span style={{ color: "#cbd5e1" }}>{tt.receitaL}</span></span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: COR.vermelho }}></span><span style={{ color: "#cbd5e1" }}>{tt.custosL}</span></span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: COR.verde }}></span><span style={{ color: "#cbd5e1" }}>{tt.lucroL}</span></span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={evolucao}>
                      <defs>
                        <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COR.roxo} stopOpacity={0.5}/><stop offset="100%" stopColor={COR.roxo} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COR.vermelho} stopOpacity={0.15}/><stop offset="100%" stopColor={COR.vermelho} stopOpacity={0}/></linearGradient>
                        <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={COR.verde} stopOpacity={0.35}/><stop offset="100%" stopColor={COR.verde} stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.06)" />
                      <XAxis dataKey="mes" stroke="#334155" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} />
                      <YAxis stroke="#334155" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
                      <Area type="monotone" dataKey="receita" stroke={COR.roxo} fill="url(#gR)" strokeWidth={3} dot={{ fill: COR.roxo, r: 4, strokeWidth: 2, stroke: "#0f0a28" }} />
                      <Area type="monotone" dataKey="custos" stroke={COR.vermelho} fill="url(#gC)" strokeWidth={1.5} strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="lucro" stroke={COR.verde} fill="url(#gL)" strokeWidth={2.5} dot={{ fill: COR.verde, r: 3, strokeWidth: 2, stroke: "#0f0a28" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GC>
            </div>
          </div>

          {/* ══════ LINHA 2: Insights + Top Custos + Distribuição Custos (DONUT GROSSO) ══════ */}
          <div className="grid grid-cols-1 gap-5">

            {/* Insights da Empresa — estilo Customer Insights */}
            <GC cor={COR.roxo} onClick={() => router.push("/ia-financeira")}>
              <div className="p-5">
                <p className="text-sm font-black mb-4" style={{ color: "#f1f5f9" }}>💡 {tt.insightsEmpresa}</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <p className="text-2xl font-black" style={{ color: "#f1f5f9" }}>{snap.qtd_lancamentos}</p>
                    <p className="text-[8px] uppercase tracking-wider font-bold mt-1" style={{ color: "#94a3b8" }}>{tt.lancamentos}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.1)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    <p className="text-2xl font-black" style={{ color: "#f1f5f9" }}>{snap.inadimplencia_pct.toFixed(0)}%</p>
                    <p className="text-[8px] uppercase tracking-wider font-bold mt-1" style={{ color: "#94a3b8" }}>{tt.inadimplencia}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <p className="text-2xl font-black" style={{ color: "#f1f5f9" }}>{fBRL(snap.ticket_medio)}</p>
                    <p className="text-[8px] uppercase tracking-wider font-bold mt-1" style={{ color: "#94a3b8" }}>{tt.ticket}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[{ l: tt.receber, v: fBRL(snap.contas_receber), c: COR.verde }, { l: tt.pagar, v: fBRL(snap.contas_pagar), c: COR.vermelho }, { l: tt.endividamento, v: fBRL(snap.endividamento_total), c: COR.roxo }].map((r, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg transition-all hover:translate-x-1" style={{ background: `${r.c}08`, border: `1px solid ${r.c}12` }}>
                      <span className="text-[11px] font-bold" style={{ color: "#94a3b8" }}>{r.l}</span>
                      <span className="text-sm font-black" style={{ color: r.c }}>{r.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GC>

            {/* Top Custos — estilo Order Performance com ranking + barras */}
            <GC cor={COR.indigo} onClick={() => router.push("/custos-fixos")}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black" style={{ color: "#f1f5f9" }}>📊 {tt.topCustos}</p>
                  <span className="text-[10px] px-2 py-1 rounded-lg font-bold" style={{ background: "rgba(99,102,241,0.15)", color: COR.indigo }}>{topCustos.length}</span>
                </div>
                {topCustos.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: "#475569" }}>—</p> : (
                  <div className="space-y-3">
                    {topCustos.map((c, i) => {
                      const maxV = topCustos[0]?.value || 1;
                      return (
                        <div key={i} className="transition-all hover:translate-x-1">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold flex items-center gap-2" style={{ color: "#e2e8f0" }}>
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }}></span>{c.name}
                            </span>
                            <span className="text-xs font-black" style={{ color: c.color }}>{fBRL(c.value)}</span>
                          </div>
                          <div className="rounded-full h-2" style={{ background: "rgba(99,102,241,0.08)" }}>
                            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${(c.value / maxV) * 100}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}aa)` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </GC>

            {/* ★ DONUT GROSSO — Distribuição de Custos — estilo Traffic Sources da referência */}
            <GC cor={COR.cyan} onClick={() => router.push("/relatorios")}>
              <div className="p-5">
                <p className="text-sm font-black mb-4" style={{ color: "#f1f5f9" }}>
                  🥧 {tt.distribuicaoCustos}
                  {distribuicao === topCustos && topCustos[0]?.name === (lang === "en" ? "Rent" : lang === "es" ? "Alquiler" : "Aluguel") && (
                    <span className="ml-2 text-[9px] px-2 py-0.5 rounded-md font-bold" style={{ background: "rgba(139,92,246,0.2)", color: COR.roxo }}>
                      {lang === "en" ? "SAMPLE" : lang === "es" ? "EJEMPLO" : "EXEMPLO"}
                    </span>
                  )}
                </p>
                {distribuicao.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: "#475569" }}>—</p> : (
                  <div className="flex items-center gap-4">
                    {/* Donut GROSSO igual referência */}
                    <div className="flex-shrink-0" style={{ width: "280px", height: "280px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={distribuicao} cx="50%" cy="50%" innerRadius={78} outerRadius={132} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                            {distribuicao.map((d, i) => <Cell key={i} fill={d.color} stroke="rgba(10,8,35,0.8)" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Dados ao lado do donut — estilo referência com % e cor */}
                    <div className="flex-1 space-y-2">
                      {distribuicao.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }}></span>
                          <span className="text-[11px] font-medium flex-1 truncate" style={{ color: "#cbd5e1" }}>{d.name}</span>
                          <span className="text-sm font-black" style={{ color: "#f1f5f9" }}>{d.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </GC>
          </div>

          {/* ══════ LINHA 3: Composição Financeira (2o DONUT) + Radar Score + Alertas/Ações ══════ */}
          <div className="grid grid-cols-1 gap-5">

            {/* ★ 2o DONUT — Composição Financeira (Receita = Lucro + CF + CV) */}
            <GC cor={COR.verde} onClick={() => router.push("/dre")}>
              <div className="p-5">
                <p className="text-sm font-black mb-4" style={{ color: "#f1f5f9" }}>
                  💰 {tt.composicaoFinanceira}
                  {usandoExemplo && (
                    <span className="ml-2 text-[9px] px-2 py-0.5 rounded-md font-bold" style={{ background: "rgba(139,92,246,0.2)", color: COR.roxo }}>
                      {lang === "en" ? "SAMPLE" : lang === "es" ? "EJEMPLO" : "EXEMPLO"}
                    </span>
                  )}
                </p>
                {composicao.length === 0 ? <p className="text-xs py-8 text-center" style={{ color: "#475569" }}>—</p> : (
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0" style={{ width: "280px", height: "280px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={composicao} cx="50%" cy="50%" innerRadius={78} outerRadius={132} dataKey="value" paddingAngle={3} startAngle={90} endAngle={-270}>
                            {composicao.map((d, i) => <Cell key={i} fill={d.color} stroke="rgba(10,8,35,0.8)" strokeWidth={2} />)}
                          </Pie>
                          <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2.5">
                      {composicao.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }}></span>
                          <span className="text-[11px] font-medium flex-1" style={{ color: "#cbd5e1" }}>{d.name}</span>
                          <span className="text-sm font-black" style={{ color: "#f1f5f9" }}>{d.pct}%</span>
                        </div>
                      ))}
                      <div className="pt-2 mt-2" style={{ borderTop: "1px solid rgba(99,102,241,0.1)" }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold" style={{ color: "#94a3b8" }}>{tt.receita}</span>
                          <span className="text-sm font-black" style={{ color: COR.roxo }}>{fBRL(snap.receita_bruta)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </GC>

            {/* Radar Score */}
            <GC cor={COR.roxo} onClick={() => router.push("/ia-financeira")}>
              <div className="p-4">
                <p className="text-sm font-black mb-2" style={{ color: "#f1f5f9" }}>🏆 {tt.dimensoesScore}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={score360.dimensoes.map(d => ({ s: dN(d), v: d.score, b: 70, f: 100 }))}>
                    <defs><radialGradient id="rG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor={COR.roxo} stopOpacity={0.7}/><stop offset="100%" stopColor={COR.roxo} stopOpacity={0.05}/></radialGradient></defs>
                    <PolarGrid stroke="rgba(139,92,246,0.1)" gridType="polygon" />
                    <PolarAngleAxis dataKey="s" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 700 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="b" stroke={COR.amarelo} strokeWidth={1} strokeDasharray="3 3" fill="transparent" dot={false} />
                    <Radar dataKey="v" stroke={COR.roxo} fill="url(#rG)" strokeWidth={2.5}
                      dot={(p: any) => { const d = score360.dimensoes[p.index]; return d ? <circle key={p.index} cx={p.cx} cy={p.cy} r={5} fill={d.cor} stroke="#0a0823" strokeWidth={2} /> : null; }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-5 gap-1 mt-1">{score360.dimensoes.map((d, i) => <div key={i} className="text-center"><p className="text-xs font-black" style={{ color: d.cor }}>{d.score}</p></div>)}</div>
              </div>
            </GC>

            {/* Alertas + Ações + Obrigações */}
            <GC cor={COR.rosa}>
              <div className="p-4">
                {/* Alertas */}
                <p className="text-sm font-black mb-2" style={{ color: "#f1f5f9" }}>🔍 {tt.alertasIA}</p>
                {anomalias.length === 0 ? <p className="text-[11px] mb-3" style={{ color: COR.verde }}>✅ {tt.semAlertas}</p> : (
                  <div className="space-y-1.5 mb-3">{anomalias.slice(0, 2).map((a, i) => {
                    const c = a.severidade === "alerta" ? COR.vermelho : a.severidade === "atencao" ? COR.amarelo : COR.verde;
                    return (<div key={i} className="rounded-lg p-2 transition-all hover:translate-x-1" style={{ background: `${c}08`, border: `1px solid ${c}12` }}>
                      <p className="text-[10px] font-bold" style={{ color: c }}>{a.severidade === "alerta" ? "🚨" : "⚠️"} {aN(a)}</p>
                    </div>);
                  })}</div>
                )}
                {/* Ações */}
                <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>🎯 {tt.acoesIA}</p>
                {acoes.length === 0 ? <p className="text-[10px] mb-3" style={{ color: "#475569" }}>—</p> : (
                  <div className="space-y-1.5 mb-3">{acoes.slice(0, 2).map((a, i) => {
                    const c = a.categoria === "custo" ? COR.vermelho : a.categoria === "receita" ? COR.verde : COR.roxo;
                    return (<div key={i} className="flex items-start gap-1.5 p-2 rounded-lg transition-all hover:translate-x-1" style={{ background: "rgba(15,10,40,0.4)" }}>
                      <span className="text-[10px] font-black" style={{ color: c }}>{a.prioridade}.</span>
                      <div><p className="text-[10px] font-bold" style={{ color: "#e2e8f0" }}>{acN(a)}</p></div>
                    </div>);
                  })}</div>
                )}
                {/* Obrigações */}
                <p className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: "#94a3b8" }}>📅 {tt.obrigacoes}</p>
                {obrigacoes.length === 0 ? <p className="text-[10px]" style={{ color: "#475569" }}>{tt.semObrig}</p> : (
                  <div className="space-y-1">{obrigacoes.slice(0, 2).map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded text-[10px]" style={{ background: "rgba(15,10,40,0.3)" }}>
                      <span className="truncate font-medium" style={{ color: "#94a3b8" }}>{o.nome}</span>
                      <span className="font-bold flex-shrink-0 ml-1" style={{ color: COR.roxo }}>{fData(o.data_vencimento, lang)}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            </GC>
          </div>

          {/* ══════ PAINÉIS EMPILHADOS ESTILO POWER BI — barras grossas, cores vivas, valores nas barras ══════ */}
          <div className="space-y-4">
            <div className="px-1">
              <p className="text-lg font-black" style={{ color: "#f1f5f9" }}>📊 {tt.painelModulos}</p>
              <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>{tt.painelModulosDesc}</p>
            </div>

            {/* Evolução de Receita — mensal */}
            <BigBarPanel titulo={tt.mReceitas} icone="💰" cor={COR.roxo} subtitulo={tt.deste_mes} path="/receitas" router={router}
              dados={evolucao.map(e => ({ label: e.mes, value: e.receita, color: COR.roxo }))} />

            {/* Evolução de Lucro — mensal */}
            <BigBarPanel titulo={tt.lucro} icone="📈" cor={snap.lucro_liquido >= 0 ? COR.verde : COR.vermelho} subtitulo={tt.pmDre} path="/dre" router={router}
              dados={evolucao.map(e => ({ label: e.mes, value: e.lucro, color: e.lucro >= 0 ? COR.verde : COR.vermelho }))} />

            {/* Custos por Categoria — cores vivas distintas por barra, horizontal */}
            {topCustos.length > 0 && (
              <BigBarPanel titulo={tt.topCustos} icone="📉" cor={COR.vermelho} subtitulo={tt.custos} path="/custos-fixos" router={router}
                dados={topCustos.map(c => ({ label: c.name, value: c.value, color: c.color }))} horizontal altura={220} />
            )}

            {/* Composição Financeira — Lucro x Custos Fixos x Custos Variáveis, cores vivas */}
            {composicao.length > 0 && (
              <BigBarPanel titulo={tt.composicaoFinanceira} icone="💠" cor={COR.cyan} subtitulo={tt.receita + ": " + fBRL(snap.receita_bruta)} path="/relatorios" router={router}
                dados={composicao.map(c => ({ label: c.name, value: c.value, color: c.color }))} />
            )}

            {/* Score 360° por Dimensão — cada barra com a cor da própria dimensão */}
            <BigBarPanel titulo={tt.dimensoesScore} icone="🏆" cor={score360.cor} subtitulo={`Score total: ${score360.total}/100`} path="/ia-financeira" router={router}
              dados={score360.dimensoes.map(d => ({ label: dN(d), value: d.score, color: d.cor }))} altura={230} />

            {/* Linha de KPIs hexagonais — Relacionamento & Compromissos */}
            <GC cor={COR.cyan}>
              <div className="p-5">
                <p className="text-base font-black mb-4" style={{ color: "#f1f5f9" }}>🤝 {tt.insightsEmpresa}</p>
                <div className="flex flex-wrap items-center justify-around gap-4">
                  <StatHex valor={String(modulosData?.clientesCount ?? 0)} label={tt.mClientes} cor={COR.cyan} onClick={() => router.push("/clientes")} />
                  <StatHex valor={String(modulosData?.fornecedoresCount ?? 0)} label={tt.mFornec} cor={COR.teal} onClick={() => router.push("/fornecedores")} />
                  <StatHex valor={fmtCompact(modulosData?.crTotal ?? 0)} label={tt.contasReceber} cor={COR.verde} onClick={() => router.push("/contas-receber")} />
                  <StatHex valor={fmtCompact(modulosData?.cpTotal ?? 0)} label={tt.contasPagar} cor={COR.laranja} onClick={() => router.push("/fornecedores")} />
                  <StatHex valor={`${snap.inadimplencia_pct.toFixed(0)}%`} label={tt.inadimplencia} cor={COR.rosa} onClick={() => router.push("/contas-receber")} />
                </div>
              </div>
            </GC>

            {/* Linha de KPIs hexagonais — Crescimento & Capital */}
            <GC cor={COR.amarelo}>
              <div className="p-5">
                <p className="text-base font-black mb-4" style={{ color: "#f1f5f9" }}>🚀 {lang === "en" ? "Growth & Capital" : lang === "es" ? "Crecimiento & Capital" : "Crescimento & Capital"}</p>
                <div className="flex flex-wrap items-center justify-around gap-4">
                  <StatHex valor={`${modulosData?.metasProgresso ?? 0}%`} label="Metas" cor={COR.amarelo} onClick={() => router.push("/metas")} />
                  <StatHex valor={fmtCompact(modulosData?.investTotal ?? 0)} label="Investimentos" cor={COR.indigo} onClick={() => router.push("/investimentos")} />
                  <StatHex valor={fmtCompact(snap.endividamento_total)} label={tt.endividamento} cor={COR.rosa} onClick={() => router.push("/endividamento")} />
                  <StatHex valor={`${snap.margem_liquida.toFixed(0)}%`} label={tt.margem} cor={COR.verde} onClick={() => router.push("/ia-tributaria")} />
                  <StatHex valor={`${score360.total}`} label="Score 360°" cor={score360.cor} onClick={() => router.push("/ia-financeira")} />
                </div>
              </div>
            </GC>
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