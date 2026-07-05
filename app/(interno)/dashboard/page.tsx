"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  carregarSnapshot, carregarBenchmark, calcularScore360, detectarAnomalias, gerarPlanoAcao,
  type SnapshotFinanceiro, type Score360, type Anomalia, type AcaoSugerida,
} from "../../../lib/iaFinanceiraHelpers";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// I18N
const T = {
  pt: {
    bomDia: "Bom dia", boaTarde: "Boa tarde", boaNoite: "Boa noite",
    carregando: "Carregando Dashboard...", tagline: "Seu CFO Digital — powered by IA",
    receita: "Receita", custos: "Custos", lucro: "Lucro Líquido", margem: "Margem Líquida",
    inadimplencia: "Inadimplência", ticket: "Ticket Médio", score360: "Score 360°",
    receber: "A Receber", pagar: "A Pagar", endividamento: "Endividamento",
    evolucaoReceita: "Evolução de Receita", receitaL: "Receita", custosL: "Custos", lucroL: "Lucro",
    insightsEmpresa: "Insights da Empresa",
    lancamentos: "Lançamentos", clientes: "Clientes", eficiencia: "Eficiência",
    deste_mes: "deste mês", vsMes: "vs mês anterior",
    topCustos: "Top Categorias de Custo", topCustosDesc: "Ranking por valor mensal",
    distribuicao: "Distribuição de Custos",
    dimensoesScore: "Dimensões Score 360°",
    alertasIA: "Alertas IA", semAlertas: "Nenhum alerta ativo.",
    acoesIA: "Ações Prioritárias", impacto: "Impacto",
    obrigacoes: "Obrigações Fiscais", vence: "Vence", semObrig: "Sem obrigações pendentes.",
    modulos: "Módulos Axioma",
    compartilhar: "📤 Compartilhar", fechar: "Fechar", copiar: "Copiar",
    centroCompart: "Centro de Compartilhamento", compartilharVia: "Compartilhar via",
    gerando: "Gerando...", copiado: "Copiado!", erroCopiar: "Erro",
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
    evolucaoReceita: "Revenue Growth", receitaL: "Revenue", custosL: "Costs", lucroL: "Profit",
    insightsEmpresa: "Company Insights",
    lancamentos: "Entries", clientes: "Clients", eficiencia: "Efficiency",
    deste_mes: "this month", vsMes: "vs last month",
    topCustos: "Top Cost Categories", topCustosDesc: "Ranked by monthly value",
    distribuicao: "Cost Distribution",
    dimensoesScore: "Score 360° Dimensions",
    alertasIA: "AI Alerts", semAlertas: "No active alerts.",
    acoesIA: "Priority Actions", impacto: "Impact",
    obrigacoes: "Fiscal Obligations", vence: "Due", semObrig: "No pending obligations.",
    modulos: "Axioma Modules",
    compartilhar: "📤 Share", fechar: "Close", copiar: "Copy",
    centroCompart: "Sharing Center", compartilharVia: "Share via",
    gerando: "Generating...", copiado: "Copied!", erroCopiar: "Error",
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
    evolucaoReceita: "Evolución de Ingresos", receitaL: "Ingresos", custosL: "Costos", lucroL: "Beneficio",
    insightsEmpresa: "Insights de la Empresa",
    lancamentos: "Movimientos", clientes: "Clientes", eficiencia: "Eficiencia",
    deste_mes: "este mes", vsMes: "vs mes anterior",
    topCustos: "Top Categorías de Costo", topCustosDesc: "Ranking por valor mensual",
    distribuicao: "Distribución de Costos",
    dimensoesScore: "Dimensiones Score 360°",
    alertasIA: "Alertas IA", semAlertas: "Sin alertas activas.",
    acoesIA: "Acciones Prioritarias", impacto: "Impacto",
    obrigacoes: "Obligaciones Fiscales", vence: "Vence", semObrig: "Sin obligaciones pendientes.",
    modulos: "Módulos Axioma",
    compartilhar: "📤 Compartir", fechar: "Cerrar", copiar: "Copiar",
    centroCompart: "Centro de Compartir", compartilharVia: "Compartir vía",
    gerando: "Generando...", copiado: "¡Copiado!", erroCopiar: "Error",
    mReceitas: "Ingresos", mCustosF: "C.Fijos", mCustosV: "C.Variables", mDre: "Estado R.",
    mFluxo: "Flujo", mClientes: "Clientes", mRelatorios: "Informes", mEmpresa: "Empresa",
    mIaFin: "IA Financ.", mIaTrib: "IA Tribut.", mMei: "MEI", mFornec: "Proveedores",
  },
};

const CORES = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#a78bfa", "#818cf8", "#f472b6"];
const ttip = { background: "rgba(15,10,40,0.97)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "12px", color: "#e2e8f0", fontSize: "12px" };
function fBRL(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0); }
function fData(iso: string, l: string) { if (!iso) return "—"; try { return new Date(iso + "T00:00:00").toLocaleDateString(l === "en" ? "en-US" : l === "es" ? "es-ES" : "pt-BR"); } catch { return iso; } }

// ============================================================================
// DASH CARD — estilo da referência: fundo glass escuro, borda sutil, hover glow
// ============================================================================
function DC({ children, cor = "#8b5cf6", onClick, className = "" }: {
  children: React.ReactNode; cor?: string; onClick?: () => void; className?: string;
}) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-3px] ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "linear-gradient(160deg, rgba(20,15,50,0.95) 0%, rgba(12,10,35,0.98) 100%)",
        border: `1px solid rgba(99,102,241,0.15)`,
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.5), 0 0 20px ${cor}15`;
        e.currentTarget.style.borderColor = `${cor}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.4)";
        e.currentTarget.style.borderColor = "rgba(99,102,241,0.15)";
      }}
    >{children}</div>
  );
}

// Mini sparkline
function Spark({ data, cor = "#8b5cf6", h = 35 }: { data: number[]; cor?: string; h?: number }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <AreaChart data={data.map(v => ({ v }))}>
        <defs><linearGradient id={`sp${cor.replace("#","")}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={cor} stopOpacity={0.4}/><stop offset="95%" stopColor={cor} stopOpacity={0}/></linearGradient></defs>
        <Area type="monotone" dataKey="v" stroke={cor} fill={`url(#sp${cor.replace("#","")})`} strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Mini bar chart (como na referência "Conversion Rate")
function MiniBars({ data, cor = "#8b5cf6", h = 35 }: { data: number[]; cor?: string; h?: number }) {
  if (!data || data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data.map(v => ({ v }))}>
        <Bar dataKey="v" fill={cor} radius={[2, 2, 0, 0]} opacity={0.7} />
      </BarChart>
    </ResponsiveContainer>
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
  const [shareAberto, setShareAberto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: string } | null>(null);
  function showToast(msg: string, tipo: string = "info") { setToast({ msg, tipo }); setTimeout(() => setToast(null), 3000); }

  const hora = new Date();
  const saudacao = hora.getHours() < 12 ? tt.bomDia : hora.getHours() < 18 ? tt.boaTarde : tt.boaNoite;

  useEffect(() => { init(); }, []);

  async function init() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const nc = user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    setNomeUsuario(nc.split(" ")[0]);
    const { data: emp } = await supabase.from("empresas").select("nome_fantasia, razao_social, nome").eq("user_id", user.id).limit(1).maybeSingle();
    if (emp) setEmpresaNome(emp.nome_fantasia || emp.razao_social || emp.nome || "");

    try {
      const s = await carregarSnapshot(user.id);
      const b = await carregarBenchmark(s.setor);
      const sc = calcularScore360(s, b);
      const an = detectarAnomalias(s, b);
      const ac = gerarPlanoAcao(s, sc, an);
      setSnap(s); setScore360(sc); setAnomalias(an); setAcoes(ac);

      // Evolução
      const nm = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
      setEvolucao(s.total_receitas_6m.map((r, i) => ({
        mes: nm[(new Date().getMonth() - 5 + i + 12) % 12],
        receita: r, custos: s.total_custos_6m[i] || 0, lucro: r - (s.total_custos_6m[i] || 0),
      })));

      // Top custos
      const { data: cv } = await supabase.from("custos_variaveis").select("valor, categoria").eq("user_id", user.id);
      const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal, categoria").eq("user_id", user.id);
      const m = new Map<string, number>();
      (cv || []).forEach((r: any) => { const c = r.categoria || "Variáveis"; m.set(c, (m.get(c) || 0) + Number(r.valor || 0)); });
      (cf || []).forEach((r: any) => { const c = r.categoria || "Fixos"; m.set(c, (m.get(c) || 0) + Number(r.valor_mensal || 0)); });
      const sorted = Array.from(m.entries()).map(([name, value], i) => ({ name, value: Math.round(value), color: CORES[i % CORES.length] })).sort((a, b) => b.value - a.value);
      setTopCustos(sorted.slice(0, 5));
      setDistribuicao(sorted.slice(0, 6));

      // Obrigações
      const { data: ob } = await supabase.from("empresa_obrigacoes").select("nome, data_vencimento, status, valor_estimado")
        .eq("user_id", user.id).eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(4);
      setObrigacoes(ob || []);
    } catch (err) { console.error(err); }
    setCarregando(false);
  }

  const mom = snap && snap.total_receitas_6m.length >= 2
    ? ((snap.total_receitas_6m[5] - snap.total_receitas_6m[4]) / Math.max(snap.total_receitas_6m[4], 1)) * 100 : 0;

  // Share
  function mShare() {
    if (!snap || !score360) return "Axioma AI.Tech";
    return [`🦅 *AXIOMA AI.TECH — Dashboard CFO*`, empresaNome ? `🏢 *${empresaNome}*` : "",
      `🏆 Score: *${score360.total}/100*`, `💰 ${tt.receita}: ${fBRL(snap.receita_bruta)}`,
      `✅ ${tt.lucro}: ${fBRL(snap.lucro_liquido)}`, `📊 ${tt.margem}: ${snap.margem_liquida.toFixed(1)}%`,
      ``, `_axiomaai.com.br_`].filter(Boolean).join("\n");
  }
  function sWA() { window.open(`https://wa.me/?text=${encodeURIComponent(mShare())}`, "_blank"); }
  function sTG() { window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${encodeURIComponent(mShare())}`, "_blank"); }
  function sGM() { window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(mShare().replace(/\*/g, ""))}`, "_blank"); }
  function sOL() { window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(mShare().replace(/\*/g, ""))}`, "_blank"); }
  async function sCp() { try { await navigator.clipboard.writeText(mShare().replace(/\*/g, "")); showToast(tt.copiado, "ok"); } catch { showToast(tt.erroCopiar, "erro"); } }

  async function exportarPDF() {
    if (!snap || !score360) return; setExportando(true);
    try {
      await gerarPdfTabela({ titulo: "Axioma Dashboard CFO", subtitulo: snap.periodo,
        colunas: [{ header: "MÉTRICA", key: "m", width: 55, align: "left" as const }, { header: "VALOR", key: "v", width: 40, align: "right" as const }],
        linhas: [{ m: tt.receita, v: fBRL(snap.receita_bruta) }, { m: tt.custos, v: fBRL(snap.custos_totais) }, { m: tt.lucro, v: fBRL(snap.lucro_liquido) }, { m: tt.margem, v: `${snap.margem_liquida.toFixed(1)}%` },
          ...score360.dimensoes.map(d => ({ m: lang === "en" ? d.nome_en : d.nome, v: `${d.score}/100` }))],
        resumo: [{ label: "Score 360°", valor: `${score360.total}/100` }], nomeArquivo: `axioma-dashboard.pdf`,
      });
    } catch (err: any) { showToast(err.message, "erro"); } setExportando(false);
  }

  const dN = (d: any) => lang === "en" ? d.nome_en : lang === "es" ? d.nome_es : d.nome;
  const aN = (a: Anomalia) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const acN = (a: AcaoSugerida) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;

  const mods = [
    { l: tt.mReceitas, i: "💰", p: "/receitas", c: "#34d399" },
    { l: tt.mCustosF, i: "📌", p: "/custos-fixos", c: "#f87171" },
    { l: tt.mCustosV, i: "📉", p: "/custos-variaveis", c: "#fb923c" },
    { l: tt.mDre, i: "📈", p: "/dre", c: "#6366f1" },
    { l: tt.mFluxo, i: "💧", p: "/fluxo-caixa", c: "#06b6d4" },
    { l: tt.mClientes, i: "👥", p: "/clientes", c: "#22d3ee" },
    { l: tt.mRelatorios, i: "📊", p: "/relatorios", c: "#fbbf24" },
    { l: tt.mEmpresa, i: "🏢", p: "/empresa", c: "#a78bfa" },
    { l: tt.mIaFin, i: "🧠", p: "/ia-financeira", c: "#f472b6" },
    { l: tt.mIaTrib, i: "🏛️", p: "/ia-tributaria", c: "#fb923c" },
    { l: tt.mFornec, i: "🏭", p: "/fornecedores", c: "#14b8a6" },
    { l: tt.mMei, i: "🧾", p: "/mei", c: "#f97316" },
  ];

  return (
    <div className="min-h-screen p-3 md:p-5 overflow-auto" style={{ background: "linear-gradient(180deg, #080420 0%, #020810 40%)" }}>
      {toast && (<div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm" style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : "rgba(99,102,241,0.95)", color: "#fff", fontWeight: 600, fontSize: 13 }}>{toast.msg}</div>)}

      {carregando && (
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: "#8b5cf6" }}>{tt.carregando}</p>
        </div>
      )}

      {!carregando && snap && score360 && (
        <div className="space-y-4 max-w-[1440px] mx-auto">

          {/* ============ HERO VIDEO ============ */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: "220px" }}>
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" src="/hero-axioma.mp4" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,4,32,0.75), rgba(2,8,16,0.5), rgba(139,92,246,0.1))" }} />
            <div className="absolute inset-0 z-10 flex items-center justify-between px-6 md:px-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest" style={{ color: "#c4b5fd" }}>
                  {hora.toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h1 className="text-2xl md:text-3xl font-black mt-1" style={{ color: "#f1f5f9" }}>
                  {saudacao}, <span style={{ color: "#c4b5fd" }}>{nomeUsuario}</span>
                </h1>
                {empresaNome && <p className="text-sm mt-1 font-semibold" style={{ color: "#e2e8f0" }}>🏢 {empresaNome}</p>}
                <p className="text-[11px] mt-2" style={{ color: "#94a3b8" }}>{tt.tagline}</p>
              </div>
              <div className="hidden md:flex gap-3">
                <button onClick={() => setShareAberto(true)} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{ background: "rgba(139,92,246,0.3)", border: "1px solid rgba(139,92,246,0.5)", color: "#e2e8f0" }}>{tt.compartilhar}</button>
                <button onClick={exportarPDF} disabled={exportando} className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all hover:scale-105"
                  style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>
                  {exportando ? tt.gerando : "📄 PDF"}</button>
              </div>
            </div>
          </div>

          {/* ============ LINHA 1: KPIs (esq) + GRÁFICO GRANDE (dir) — estilo referência ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* COLUNA ESQUERDA: 4 KPIs empilhados */}
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              {/* Receita — com sparkline */}
              <DC cor="#8b5cf6" onClick={() => router.push("/receitas")}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.receita}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: mom >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: mom >= 0 ? "#34d399" : "#f87171" }}>
                      {mom >= 0 ? "↑" : "↓"}{Math.abs(mom).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xl font-black" style={{ color: "#e2e8f0" }}>{fBRL(snap.receita_bruta)}</p>
                  <div className="mt-2"><Spark data={snap.total_receitas_6m} cor="#8b5cf6" /></div>
                </div>
              </DC>

              {/* Lucro — com mini bars */}
              <DC cor={snap.lucro_liquido >= 0 ? "#34d399" : "#f87171"} onClick={() => router.push("/dre")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>{tt.lucro}</p>
                  <p className="text-xl font-black" style={{ color: snap.lucro_liquido >= 0 ? "#34d399" : "#f87171" }}>{fBRL(snap.lucro_liquido)}</p>
                  <div className="mt-2"><MiniBars data={snap.total_receitas_6m.map((r, i) => r - (snap.total_custos_6m[i] || 0))} cor={snap.lucro_liquido >= 0 ? "#34d399" : "#f87171"} /></div>
                </div>
              </DC>

              {/* Margem — com indicador */}
              <DC cor="#06b6d4" onClick={() => router.push("/relatorios")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>{tt.margem}</p>
                  <p className="text-2xl font-black" style={{ color: snap.margem_liquida >= 10 ? "#06b6d4" : "#fbbf24" }}>{snap.margem_liquida.toFixed(1)}%</p>
                  <div className="mt-2 rounded-full h-1.5" style={{ background: "rgba(6,182,212,0.15)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.max(0, snap.margem_liquida * 2))}%`, background: "linear-gradient(90deg, #06b6d4, #8b5cf6)" }} />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>Benchmark: 15-25%</p>
                </div>
              </DC>

              {/* Score 360 — com barra de progresso */}
              <DC cor={score360.cor} onClick={() => router.push("/ia-financeira")}>
                <div className="p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>🏆 Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: score360.cor }}>{score360.total}</span>
                    <span className="text-xs" style={{ color: "#64748b" }}>/100</span>
                  </div>
                  <p className="text-[10px] font-bold mt-1" style={{ color: score360.cor }}>
                    {lang === "en" ? score360.nivel_en : lang === "es" ? score360.nivel_es : score360.nivel}
                  </p>
                  <div className="mt-2 rounded-full h-1.5" style={{ background: "rgba(139,92,246,0.15)" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${score360.total}%`, background: `linear-gradient(90deg, ${score360.cor}, #8b5cf6)` }} />
                  </div>
                </div>
              </DC>
            </div>

            {/* COLUNA DIREITA: Gráfico grande "Revenue Growth" */}
            <div className="lg:col-span-8">
              <DC cor="#6366f1">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-base font-bold" style={{ color: "#e2e8f0" }}>📈 {tt.evolucaoReceita}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#64748b" }}>{tt.deste_mes}</p>
                    </div>
                    <div className="flex gap-4 text-[10px]">
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }}></span><span style={{ color: "#94a3b8" }}>{tt.receitaL}</span></span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#f87171" }}></span><span style={{ color: "#94a3b8" }}>{tt.custosL}</span></span>
                      <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }}></span><span style={{ color: "#94a3b8" }}>{tt.lucroL}</span></span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={evolucao}>
                      <defs>
                        <linearGradient id="gDR2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gDC2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gDL2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.06)" />
                      <XAxis dataKey="mes" stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
                      <Area type="monotone" dataKey="receita" stroke="#8b5cf6" fill="url(#gDR2)" strokeWidth={2.5} dot={{ fill: "#8b5cf6", r: 3 }} />
                      <Area type="monotone" dataKey="custos" stroke="#f87171" fill="url(#gDC2)" strokeWidth={1.5} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#gDL2)" strokeWidth={2} dot={{ fill: "#34d399", r: 3 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DC>
            </div>
          </div>

          {/* ============ LINHA 2: Insights + Top Custos (ranking) + Distribuição (donut) ============ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Customer Insights → Insights da Empresa */}
            <DC cor="#a78bfa" onClick={() => router.push("/ia-financeira")}>
              <div className="p-5">
                <p className="text-sm font-bold mb-4" style={{ color: "#e2e8f0" }}>💡 {tt.insightsEmpresa}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <p className="text-2xl font-black" style={{ color: "#a78bfa" }}>{snap.qtd_lancamentos}</p>
                    <p className="text-[9px] uppercase mt-1" style={{ color: "#94a3b8" }}>{tt.lancamentos}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
                    <p className="text-2xl font-black" style={{ color: "#34d399" }}>{snap.inadimplencia_pct.toFixed(0)}%</p>
                    <p className="text-[9px] uppercase mt-1" style={{ color: "#94a3b8" }}>{tt.inadimplencia}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
                    <p className="text-2xl font-black" style={{ color: "#06b6d4" }}>{fBRL(snap.ticket_medio)}</p>
                    <p className="text-[9px] uppercase mt-1" style={{ color: "#94a3b8" }}>{tt.ticket}</p>
                  </div>
                </div>
                {/* Mini KPIs extras */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(52,211,153,0.05)" }}>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>{tt.receber}</span>
                    <span className="text-xs font-bold" style={{ color: "#34d399" }}>{fBRL(snap.contas_receber)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(248,113,113,0.05)" }}>
                    <span className="text-[10px]" style={{ color: "#94a3b8" }}>{tt.pagar}</span>
                    <span className="text-xs font-bold" style={{ color: "#f87171" }}>{fBRL(snap.contas_pagar)}</span>
                  </div>
                </div>
              </div>
            </DC>

            {/* Order Performance → Top Custos (ranking com barras) */}
            <DC cor="#6366f1" onClick={() => router.push("/custos-fixos")}>
              <div className="p-5">
                <p className="text-sm font-bold mb-1" style={{ color: "#e2e8f0" }}>📊 {tt.topCustos}</p>
                <p className="text-[10px] mb-4" style={{ color: "#64748b" }}>{tt.topCustosDesc}</p>
                {topCustos.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "#64748b" }}>—</p>
                ) : (
                  <div className="space-y-3">
                    {topCustos.map((c, i) => {
                      const maxVal = topCustos[0]?.value || 1;
                      const pct = (c.value / maxVal) * 100;
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs flex items-center gap-2" style={{ color: "#e2e8f0" }}>
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }}></span>
                              {c.name}
                            </span>
                            <span className="text-xs font-bold" style={{ color: c.color }}>{fBRL(c.value)}</span>
                          </div>
                          <div className="rounded-full h-1.5" style={{ background: "rgba(99,102,241,0.1)" }}>
                            <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DC>

            {/* Revenue Breakdown → Distribuição (donut) */}
            <DC cor="#06b6d4" onClick={() => router.push("/relatorios")}>
              <div className="p-5">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>🥧 {tt.distribuicao}</p>
                {distribuicao.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "#64748b" }}>—</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={distribuicao} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={2}>
                          {distribuicao.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip contentStyle={ttip} formatter={(v: number) => fBRL(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {distribuicao.slice(0, 4).map((d, i) => (
                        <div key={i} className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span><span style={{ color: "#94a3b8" }}>{d.name}</span></span>
                          <span className="font-bold" style={{ color: "#e2e8f0" }}>{fBRL(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </DC>
          </div>

          {/* ============ LINHA 3: Score Radar + Alertas + Ações ============ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Radar */}
            <DC cor="#8b5cf6" onClick={() => router.push("/ia-financeira")}>
              <div className="p-4">
                <p className="text-sm font-bold mb-2" style={{ color: "#e2e8f0" }}>{tt.dimensoesScore}</p>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={score360.dimensoes.map(d => ({ s: dN(d), v: d.score, b: 70, f: 100 }))}>
                    <defs><radialGradient id="rGD2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6}/><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05}/></radialGradient></defs>
                    <PolarGrid stroke="rgba(139,92,246,0.12)" gridType="polygon" />
                    <PolarAngleAxis dataKey="s" tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar dataKey="b" stroke="#fbbf24" strokeWidth={1} strokeDasharray="3 3" fill="transparent" dot={false} />
                    <Radar dataKey="v" stroke="#a78bfa" fill="url(#rGD2)" strokeWidth={2}
                      dot={(p: any) => { const d = score360.dimensoes[p.index]; return d ? <circle key={p.index} cx={p.cx} cy={p.cy} r={4} fill={d.cor} stroke="#0f0a28" strokeWidth={2} /> : null; }} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-5 gap-1 mt-1">{score360.dimensoes.map((d, i) => <div key={i} className="text-center"><p className="text-xs font-black" style={{ color: d.cor }}>{d.score}</p></div>)}</div>
              </div>
            </DC>

            {/* Alertas */}
            <DC cor="#fbbf24">
              <div className="p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>🔍 {tt.alertasIA}</p>
                {anomalias.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#34d399" }}>✅ {tt.semAlertas}</p> : (
                  <div className="space-y-2">{anomalias.slice(0, 4).map((a, i) => {
                    const c = a.severidade === "alerta" ? "#f87171" : a.severidade === "atencao" ? "#fbbf24" : "#34d399";
                    return (<div key={i} className="rounded-lg p-2.5 transition-all hover:translate-x-1" style={{ background: `${c}08`, border: `1px solid ${c}15` }}>
                      <p className="text-[11px] font-bold" style={{ color: c }}>{a.severidade === "alerta" ? "🚨" : "⚠️"} {aN(a)}</p>
                    </div>);
                  })}</div>
                )}
              </div>
            </DC>

            {/* Ações + Obrigações */}
            <DC cor="#34d399">
              <div className="p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>🎯 {tt.acoesIA}</p>
                {acoes.length === 0 ? <p className="text-xs py-3 text-center" style={{ color: "#64748b" }}>—</p> : (
                  <div className="space-y-2 mb-4">{acoes.slice(0, 2).map((a, i) => {
                    const c = a.categoria === "custo" ? "#f87171" : a.categoria === "receita" ? "#34d399" : "#8b5cf6";
                    return (<div key={i} className="rounded-lg p-2 flex items-start gap-2 transition-all hover:translate-x-1" style={{ background: "rgba(15,10,40,0.5)", border: `1px solid ${c}20` }}>
                      <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: `${c}20`, color: c }}>{a.prioridade}</span>
                      <div><p className="text-[11px] font-bold" style={{ color: "#e2e8f0" }}>{acN(a)}</p><p className="text-[9px]" style={{ color: c }}>{tt.impacto}: {a.impacto_estimado}</p></div>
                    </div>);
                  })}</div>
                )}
                {/* Obrigações inline */}
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94a3b8" }}>📅 {tt.obrigacoes}</p>
                {obrigacoes.length === 0 ? <p className="text-[10px]" style={{ color: "#64748b" }}>{tt.semObrig}</p> : (
                  <div className="space-y-1">{obrigacoes.slice(0, 2).map((o, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded text-[10px]" style={{ background: "rgba(15,10,40,0.3)" }}>
                      <span className="truncate" style={{ color: "#94a3b8" }}>{o.nome}</span>
                      <span className="font-bold flex-shrink-0 ml-1" style={{ color: "#a78bfa" }}>{fData(o.data_vencimento, lang)}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            </DC>
          </div>

          {/* ============ LINHA 4: MÓDULOS — estilo Frontend/API/Backend da referência ============ */}
          <DC cor="#6366f1">
            <div className="p-4">
              <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>⚡ {tt.modulos}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
                {mods.map((m, i) => (
                  <button key={i} onClick={() => router.push(m.p)}
                    className="flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all duration-200 hover:translate-y-[-3px]"
                    style={{ background: `${m.c}08`, border: `1px solid ${m.c}15` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${m.c}20`; e.currentTarget.style.borderColor = `${m.c}40`; e.currentTarget.style.boxShadow = `0 4px 15px ${m.c}20`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${m.c}08`; e.currentTarget.style.borderColor = `${m.c}15`; e.currentTarget.style.boxShadow = "none"; }}>
                    <span className="text-lg">{m.i}</span>
                    <span className="text-[8px] md:text-[9px] font-semibold leading-tight text-center" style={{ color: m.c }}>{m.l}</span>
                  </button>
                ))}
              </div>
            </div>
          </DC>

        </div>
      )}

      {/* MODAL SHARE */}
      {shareAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto" style={{ background: "rgba(8,4,32,0.9)", backdropFilter: "blur(8px)" }} onClick={() => setShareAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(160deg, rgba(20,15,50,0.98), rgba(12,10,35,0.99))", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{tt.centroCompart}</p>
              <button onClick={() => setShareAberto(false)} className="text-xl" style={{ color: "#64748b" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={sWA} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}><span className="text-xl">📱</span>WhatsApp</button>
              <button onClick={sTG} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.3)", color: "#229ed9" }}><span className="text-xl">✈️</span>Telegram</button>
              <button onClick={sGM} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.3)", color: "#ea4335" }}><span className="text-xl">📨</span>Gmail</button>
              <button onClick={sOL} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(0,120,212,0.1)", border: "1px solid rgba(0,120,212,0.3)", color: "#0078d4" }}><span className="text-xl">📩</span>Outlook</button>
              <button onClick={sCp} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}><span className="text-xl">📋</span>{tt.copiar}</button>
              <button onClick={exportarPDF} disabled={exportando} className="flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626" }}><span className="text-xl">{exportando ? "⏳" : "📄"}</span>PDF</button>
            </div>
            <button onClick={() => setShareAberto(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{tt.fechar}</button>
          </div>
        </div>
      )}
    </div>
  );
}