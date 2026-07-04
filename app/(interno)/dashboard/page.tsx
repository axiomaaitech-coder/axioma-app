"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from "recharts";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  carregarSnapshot, carregarBenchmark, calcularScore360, detectarAnomalias, gerarPlanoAcao, gerarResumoNarrado,
  type SnapshotFinanceiro, type Score360, type Anomalia, type AcaoSugerida,
} from "../../../lib/iaFinanceiraHelpers";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// ============================================================================
// I18N
// ============================================================================
const T = {
  pt: {
    bomDia: "Bom dia", boaTarde: "Boa tarde", boaNoite: "Boa noite",
    carregando: "Carregando Dashboard...",
    receita: "Receita", custos: "Custos Totais", lucro: "Lucro Líquido", margem: "Margem Líquida",
    inadimplencia: "Inadimplência", ticket: "Ticket Médio", score360: "Score 360°", endividamento: "Endividamento",
    evolucaoReceita: "Evolução de Receita",
    receitaLabel: "Receita", custosLabel: "Custos", lucroLabel: "Lucro",
    distribuicaoCustos: "Distribuição de Custos",
    topCategorias: "Top Categorias de Custo",
    scoreDimensoes: "Dimensões do Score",
    alertasIA: "Alertas da IA",
    semAlertas: "Nenhum alerta. Indicadores saudáveis.",
    acoesIA: "Plano de Ação IA",
    semAcoes: "Cadastre dados para ações personalizadas.",
    impacto: "Impacto",
    obrigacoesFiscais: "Obrigações Fiscais",
    semObrigacoes: "Nenhuma obrigação pendente.",
    vence: "Vence",
    resumoIA: "Resumo IA do Mês",
    acessoRapido: "Acesso Rápido aos Módulos",
    verMais: "Ver mais →",
    compartilhar: "📤 Compartilhar", fechar: "Fechar", copiar: "Copiar",
    centroCompart: "Centro de Compartilhamento", compartilharVia: "Compartilhar via",
    pdfDash: "PDF Dashboard", gerando: "Gerando...", copiado: "Copiado!", erroCopiar: "Erro",
    // Quick access
    qReceitas: "Receitas", qCustosF: "C. Fixos", qCustosV: "C. Variáveis", qDre: "DRE",
    qFluxo: "Fluxo Caixa", qClientes: "Clientes", qRelatorios: "Relatórios", qEmpresa: "Empresa",
    qIaFin: "IA Financeira", qIaTrib: "IA Tributária", qMei: "MEI", qFornecedores: "Fornecedores",
    contasReceber: "Contas a Receber", contasPagar: "Contas a Pagar",
    vsMesAnterior: "vs mês anterior",
    deste_mes: "deste mês",
  },
  en: {
    bomDia: "Good morning", boaTarde: "Good afternoon", boaNoite: "Good evening",
    carregando: "Loading Dashboard...",
    receita: "Revenue", custos: "Total Costs", lucro: "Net Profit", margem: "Net Margin",
    inadimplencia: "Delinquency", ticket: "Avg Ticket", score360: "Score 360°", endividamento: "Debt",
    evolucaoReceita: "Revenue Growth",
    receitaLabel: "Revenue", custosLabel: "Costs", lucroLabel: "Profit",
    distribuicaoCustos: "Cost Distribution",
    topCategorias: "Top Cost Categories",
    scoreDimensoes: "Score Dimensions",
    alertasIA: "AI Alerts",
    semAlertas: "No alerts. Healthy indicators.",
    acoesIA: "AI Action Plan",
    semAcoes: "Register data for personalized actions.",
    impacto: "Impact",
    obrigacoesFiscais: "Fiscal Obligations",
    semObrigacoes: "No pending obligations.",
    vence: "Due",
    resumoIA: "AI Monthly Summary",
    acessoRapido: "Quick Module Access",
    verMais: "See more →",
    compartilhar: "📤 Share", fechar: "Close", copiar: "Copy",
    centroCompart: "Sharing Center", compartilharVia: "Share via",
    pdfDash: "PDF Dashboard", gerando: "Generating...", copiado: "Copied!", erroCopiar: "Error",
    qReceitas: "Revenue", qCustosF: "Fixed Costs", qCustosV: "Var Costs", qDre: "P&L",
    qFluxo: "Cash Flow", qClientes: "Clients", qRelatorios: "Reports", qEmpresa: "Company",
    qIaFin: "Financial AI", qIaTrib: "Tax AI", qMei: "MEI", qFornecedores: "Suppliers",
    contasReceber: "Receivables", contasPagar: "Payables",
    vsMesAnterior: "vs last month",
    deste_mes: "this month",
  },
  es: {
    bomDia: "Buenos días", boaTarde: "Buenas tardes", boaNoite: "Buenas noches",
    carregando: "Cargando Dashboard...",
    receita: "Ingresos", custos: "Costos Totales", lucro: "Beneficio Neto", margem: "Margen Neto",
    inadimplencia: "Morosidad", ticket: "Ticket Medio", score360: "Score 360°", endividamento: "Deuda",
    evolucaoReceita: "Evolución de Ingresos",
    receitaLabel: "Ingresos", custosLabel: "Costos", lucroLabel: "Beneficio",
    distribuicaoCustos: "Distribución de Costos",
    topCategorias: "Top Categorías de Costo",
    scoreDimensoes: "Dimensiones del Score",
    alertasIA: "Alertas IA",
    semAlertas: "Sin alertas. Indicadores saludables.",
    acoesIA: "Plan de Acción IA",
    semAcoes: "Registre datos para acciones personalizadas.",
    impacto: "Impacto",
    obrigacoesFiscais: "Obligaciones Fiscales",
    semObrigacoes: "Sin obligaciones pendientes.",
    vence: "Vence",
    resumoIA: "Resumen IA del Mes",
    acessoRapido: "Acceso Rápido a Módulos",
    verMais: "Ver más →",
    compartilhar: "📤 Compartir", fechar: "Cerrar", copiar: "Copiar",
    centroCompart: "Centro de Compartir", compartilharVia: "Compartir vía",
    pdfDash: "PDF Dashboard", gerando: "Generando...", copiado: "¡Copiado!", erroCopiar: "Error",
    qReceitas: "Ingresos", qCustosF: "C. Fijos", qCustosV: "C. Variables", qDre: "Estado Res.",
    qFluxo: "Flujo Caja", qClientes: "Clientes", qRelatorios: "Informes", qEmpresa: "Empresa",
    qIaFin: "IA Financiera", qIaTrib: "IA Tributaria", qMei: "MEI", qFornecedores: "Proveedores",
    contasReceber: "Cobrar", contasPagar: "Pagar",
    vsMesAnterior: "vs mes anterior",
    deste_mes: "este mes",
  },
};

const CORES_PIE = ["#8b5cf6", "#6366f1", "#3b82f6", "#06b6d4", "#14b8a6", "#a78bfa", "#818cf8"];
const tooltipStyle = { background: "rgba(15,10,40,0.97)", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "12px", color: "#e2e8f0", fontSize: "12px" };

function formatBRL(n: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0); }
function formatData(iso: string, lang: string) { if (!iso) return "—"; try { return new Date(iso + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR"); } catch { return iso; } }

// ============================================================================
// CARD COMPONENT — hover com elevação + glow
// ============================================================================
function DashCard({ children, cor = "#8b5cf6", onClick, className = "" }: {
  children: React.ReactNode; cor?: string; onClick?: () => void; className?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:translate-y-[-4px] hover:shadow-2xl ${onClick ? "cursor-pointer" : ""} ${className}`}
      style={{
        background: "linear-gradient(145deg, rgba(15,10,40,0.95), rgba(10,8,30,0.98))",
        border: `1px solid ${cor}25`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.3), 0 0 0 0 ${cor}00`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 30px ${cor}20, inset 0 1px 0 ${cor}15`;
        e.currentTarget.style.borderColor = `${cor}50`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.3), 0 0 0 0 ${cor}00`;
        e.currentTarget.style.borderColor = `${cor}25`;
      }}
    >
      {children}
    </div>
  );
}

// Mini sparkline (inline pequeno)
function MiniSparkline({ data, cor = "#8b5cf6", height = 30 }: { data: number[]; cor?: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const chartData = data.map((v, i) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={cor} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// DASHBOARD PRINCIPAL
// ============================================================================
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
  const [resumo, setResumo] = useState("");
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [distribuicaoCustos, setDistribuicaoCustos] = useState<any[]>([]);

  const [shareAberto, setShareAberto] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") { setToast({ msg, tipo }); setTimeout(() => setToast(null), 3000); }

  const hora = new Date();
  const saudacao = hora.getHours() < 12 ? tt.bomDia : hora.getHours() < 18 ? tt.boaTarde : tt.boaNoite;

  useEffect(() => { inicializar(); }, []);

  async function inicializar() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const nomeCompleto = user.user_metadata?.nome || user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    setNomeUsuario(nomeCompleto.split(" ")[0]);

    const { data: emp } = await supabase.from("empresas").select("nome_fantasia, razao_social, nome").eq("user_id", user.id).limit(1).maybeSingle();
    if (emp) setEmpresaNome(emp.nome_fantasia || emp.razao_social || emp.nome || "");

    try {
      const snapshot = await carregarSnapshot(user.id);
      const bench = await carregarBenchmark(snapshot.setor);
      const score = calcularScore360(snapshot, bench);
      const anom = detectarAnomalias(snapshot, bench);
      const plano = gerarPlanoAcao(snapshot, score, anom);
      const res = gerarResumoNarrado(snapshot, score, bench, lang);

      setSnap(snapshot);
      setScore360(score);
      setAnomalias(anom);
      setAcoes(plano);
      setResumo(res);

      // Evolução
      const nomesMeses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      setEvolucao(snapshot.total_receitas_6m.map((r, i) => ({
        mes: nomesMeses[(new Date().getMonth() - 5 + i + 12) % 12],
        receita: r,
        custos: snapshot.total_custos_6m[i] || 0,
        lucro: r - (snapshot.total_custos_6m[i] || 0),
      })));

      // Distribuição de custos (pra donut chart)
      const { data: cv } = await supabase.from("custos_variaveis").select("valor, categoria").eq("user_id", user.id);
      const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal, categoria").eq("user_id", user.id);
      const mapa = new Map<string, number>();
      (cv || []).forEach((r: any) => { const cat = r.categoria || "Variáveis"; mapa.set(cat, (mapa.get(cat) || 0) + Number(r.valor || 0)); });
      (cf || []).forEach((r: any) => { const cat = r.categoria || "Fixos"; mapa.set(cat, (mapa.get(cat) || 0) + Number(r.valor_mensal || 0)); });
      const dist = Array.from(mapa.entries()).map(([name, value], i) => ({ name, value: Math.round(value), color: CORES_PIE[i % CORES_PIE.length] })).sort((a, b) => b.value - a.value).slice(0, 6);
      setDistribuicaoCustos(dist);

      // Obrigações
      const { data: obr } = await supabase.from("empresa_obrigacoes").select("nome, tipo, data_vencimento, status, valor_estimado")
        .eq("user_id", user.id).eq("status", "pendente").order("data_vencimento", { ascending: true }).limit(4);
      setObrigacoes(obr || []);
    } catch (err) { console.error(err); }
    setCarregando(false);
  }

  // Variação MoM
  const momVar = snap && snap.total_receitas_6m.length >= 2
    ? ((snap.total_receitas_6m[5] - snap.total_receitas_6m[4]) / Math.max(snap.total_receitas_6m[4], 1)) * 100
    : 0;

  // Share
  function montarTextoShare() {
    if (!snap || !score360) return "Axioma AI.Tech";
    return [`🦅 *AXIOMA AI.TECH — Dashboard CFO*`, ``, empresaNome ? `🏢 *${empresaNome}*` : "",
      `🏆 Score: *${score360.total}/100*`, `💰 ${tt.receita}: ${formatBRL(snap.receita_bruta)}`,
      `📊 ${tt.margem}: ${snap.margem_liquida.toFixed(1)}%`, `✅ ${tt.lucro}: ${formatBRL(snap.lucro_liquido)}`,
      ``, `_axiomaai.com.br_`].filter(Boolean).join("\n");
  }
  function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(montarTextoShare())}`, "_blank"); }
  function shareTelegram() { window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${encodeURIComponent(montarTextoShare())}`, "_blank"); }
  function shareGmail() { window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(montarTextoShare().replace(/\*/g, ""))}`, "_blank"); }
  function shareOutlook() { window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent("Axioma Dashboard")}&body=${encodeURIComponent(montarTextoShare().replace(/\*/g, ""))}`, "_blank"); }
  async function shareCopiar() { try { await navigator.clipboard.writeText(montarTextoShare().replace(/\*/g, "")); showToast(tt.copiado, "ok"); } catch { showToast(tt.erroCopiar, "erro"); } }

  async function exportarPDF() {
    if (!snap || !score360) return;
    setExportando(true);
    try {
      await gerarPdfTabela({
        titulo: "Axioma Dashboard CFO", subtitulo: snap.periodo,
        colunas: [{ header: "MÉTRICA", key: "m", width: 55, align: "left" as const }, { header: "VALOR", key: "v", width: 40, align: "right" as const }],
        linhas: [
          { m: tt.receita, v: formatBRL(snap.receita_bruta) }, { m: tt.custos, v: formatBRL(snap.custos_totais) },
          { m: tt.lucro, v: formatBRL(snap.lucro_liquido) }, { m: tt.margem, v: `${snap.margem_liquida.toFixed(1)}%` },
          ...score360.dimensoes.map(d => ({ m: lang === "en" ? d.nome_en : d.nome, v: `${d.score}/100` })),
        ],
        resumo: [{ label: "Score 360°", valor: `${score360.total}/100` }],
        nomeArquivo: `axioma-dashboard.pdf`,
      });
    } catch (err: any) { showToast(err.message, "erro"); }
    setExportando(false);
  }

  const dimNome = (d: any) => lang === "en" ? d.nome_en : lang === "es" ? d.nome_es : d.nome;
  const anomTitulo = (a: Anomalia) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const acaoTitulo = (a: AcaoSugerida) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;

  const quickLinks = [
    { label: tt.qReceitas, icon: "💰", path: "/receitas", cor: "#34d399" },
    { label: tt.qCustosF, icon: "📌", path: "/custos-fixos", cor: "#f87171" },
    { label: tt.qCustosV, icon: "📉", path: "/custos-variaveis", cor: "#fb923c" },
    { label: tt.qDre, icon: "📈", path: "/dre", cor: "#6366f1" },
    { label: tt.qFluxo, icon: "💧", path: "/fluxo-caixa", cor: "#06b6d4" },
    { label: tt.qClientes, icon: "👥", path: "/clientes", cor: "#22d3ee" },
    { label: tt.qRelatorios, icon: "📊", path: "/relatorios", cor: "#fbbf24" },
    { label: tt.qEmpresa, icon: "🏢", path: "/empresa", cor: "#a78bfa" },
    { label: tt.qIaFin, icon: "🧠", path: "/ia-financeira", cor: "#f472b6" },
    { label: tt.qIaTrib, icon: "🏛️", path: "/ia-tributaria", cor: "#fb923c" },
    { label: tt.qFornecedores, icon: "🏭", path: "/fornecedores", cor: "#14b8a6" },
    { label: tt.qMei, icon: "🧾", path: "/mei", cor: "#f97316" },
  ];

  return (
    <div className="min-h-screen p-3 md:p-5 overflow-auto" style={{ background: "linear-gradient(180deg, #080420, #020810 40%)" }}>
      {toast && (<div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm" style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(99,102,241,0.95)", color: "#fff", fontWeight: 600, fontSize: 13 }}>{toast.msg}</div>)}

      {carregando && (
        <div className="py-32 text-center">
          <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm" style={{ color: "#8b5cf6" }}>{tt.carregando}</p>
        </div>
      )}

      {!carregando && snap && score360 && (
        <div className="space-y-4 max-w-[1400px] mx-auto">
          {/* ============ HERO COM VÍDEO ============ */}
          <div className="relative rounded-2xl overflow-hidden" style={{ height: "240px" }}>
            <video
              autoPlay loop muted playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="/hero-axioma.mp4"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(8,4,32,0.7), rgba(2,8,16,0.6), rgba(139,92,246,0.15))" }} />
            <div className="absolute inset-0 z-10 flex items-center px-6 md:px-10">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#a78bfa" }}>
                  {hora.toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
                <h1 className="text-2xl md:text-3xl font-black" style={{ color: "#f1f5f9" }}>
                  {saudacao}, <span style={{ color: "#c4b5fd" }}>{nomeUsuario}</span>
                </h1>
                {empresaNome && <p className="text-sm mt-1 font-semibold" style={{ color: "#e2e8f0" }}>🏢 {empresaNome}</p>}
                <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>
                  {lang === "en" ? "Your Digital CFO — powered by AI" : lang === "es" ? "Su CFO Digital — impulsado por IA" : "Seu CFO Digital — powered by IA"}
                </p>
              </div>
              <div className="hidden md:flex items-center gap-4">
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}>
                  <p className="text-2xl font-black" style={{ color: score360.cor }}>{score360.total}</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>Score 360°</p>
                </div>
                <div className="text-center px-4 py-2 rounded-xl" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
                  <p className="text-2xl font-black" style={{ color: "#34d399" }}>{formatBRL(snap.receita_bruta)}</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.receita}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ============ LINHA 1: KPIs PRINCIPAIS ============ */}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShareAberto(true)} className="px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6d28d9, #8b5cf6)", color: "#fff" }}>{tt.compartilhar}</button>
            <button onClick={exportarPDF} disabled={exportando} className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)" }}>
              {exportando ? tt.gerando : `📄 PDF`}</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Receita com sparkline */}
            <DashCard cor="#8b5cf6" onClick={() => router.push("/receitas")}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.receita}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                    background: momVar >= 0 ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                    color: momVar >= 0 ? "#34d399" : "#f87171",
                  }}>{momVar >= 0 ? "↑" : "↓"} {Math.abs(momVar).toFixed(1)}%</span>
                </div>
                <p className="text-2xl font-black" style={{ color: "#e2e8f0" }}>{formatBRL(snap.receita_bruta)}</p>
                <div className="mt-2"><MiniSparkline data={snap.total_receitas_6m} cor="#8b5cf6" /></div>
                <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>{tt.deste_mes}</p>
              </div>
            </DashCard>

            {/* Lucro */}
            <DashCard cor={snap.lucro_liquido >= 0 ? "#34d399" : "#f87171"} onClick={() => router.push("/dre")}>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>{tt.lucro}</p>
                <p className="text-2xl font-black" style={{ color: snap.lucro_liquido >= 0 ? "#34d399" : "#f87171" }}>{formatBRL(snap.lucro_liquido)}</p>
                <div className="mt-2"><MiniSparkline data={snap.total_receitas_6m.map((r, i) => r - (snap.total_custos_6m[i] || 0))} cor={snap.lucro_liquido >= 0 ? "#34d399" : "#f87171"} /></div>
                <p className="text-[10px] mt-1" style={{ color: "#64748b" }}>{tt.margem}: {snap.margem_liquida.toFixed(1)}%</p>
              </div>
            </DashCard>

            {/* Score 360 */}
            <DashCard cor={score360.cor} onClick={() => router.push("/ia-financeira")}>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>🏆 {tt.score360}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black" style={{ color: score360.cor }}>{score360.total}</span>
                  <span className="text-sm" style={{ color: "#64748b" }}>/100</span>
                </div>
                <p className="text-xs font-bold mt-1" style={{ color: score360.cor }}>
                  {lang === "en" ? score360.nivel_en : lang === "es" ? score360.nivel_es : score360.nivel}
                </p>
                {/* Mini barra de progresso */}
                <div className="mt-3 rounded-full h-2" style={{ background: "rgba(139,92,246,0.15)" }}>
                  <div className="h-2 rounded-full transition-all duration-1000" style={{ width: `${score360.total}%`, background: `linear-gradient(90deg, ${score360.cor}, #8b5cf6)` }} />
                </div>
              </div>
            </DashCard>

            {/* Custos + Inadimplência */}
            <DashCard cor="#f87171" onClick={() => router.push("/custos-fixos")}>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#94a3b8" }}>{tt.custos}</p>
                <p className="text-2xl font-black" style={{ color: "#f87171" }}>{formatBRL(snap.custos_totais)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.inadimplencia}</p>
                    <p className="text-sm font-bold" style={{ color: snap.inadimplencia_pct <= 5 ? "#34d399" : "#fbbf24" }}>{snap.inadimplencia_pct.toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.ticket}</p>
                    <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>{formatBRL(snap.ticket_medio)}</p>
                  </div>
                </div>
              </div>
            </DashCard>
          </div>

          {/* ============ LINHA 2: GRÁFICO GRANDE + RADAR + DONUT ============ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Gráfico de evolução — ocupa 7 colunas */}
            <div className="lg:col-span-7">
              <DashCard cor="#6366f1">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>📈 {tt.evolucaoReceita}</p>
                    <div className="flex gap-3 text-[10px]">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }}></span> {tt.receitaLabel}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#f87171" }}></span> {tt.custosLabel}</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#34d399" }}></span> {tt.lucroLabel}</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={evolucao}>
                      <defs>
                        <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.2}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                        <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139,92,246,0.08)" />
                      <XAxis dataKey="mes" stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                      <Area type="monotone" dataKey="receita" stroke="#8b5cf6" fill="url(#gR)" strokeWidth={2.5} />
                      <Area type="monotone" dataKey="custos" stroke="#f87171" fill="url(#gC)" strokeWidth={1.5} strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#gL)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashCard>
            </div>

            {/* Coluna direita: Radar + Donut */}
            <div className="lg:col-span-5 grid grid-cols-1 gap-4">
              {/* Radar */}
              <DashCard cor="#a78bfa" onClick={() => router.push("/ia-financeira")}>
                <div className="p-4">
                  <p className="text-sm font-bold mb-2" style={{ color: "#e2e8f0" }}>{tt.scoreDimensoes}</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={score360.dimensoes.map(d => ({ subject: dimNome(d), score: d.score, fullMark: 100 }))}>
                      <defs>
                        <radialGradient id="rGDash" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </radialGradient>
                      </defs>
                      <PolarGrid stroke="rgba(139,92,246,0.15)" gridType="polygon" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke="#a78bfa" fill="url(#rGDash)" strokeWidth={2}
                        dot={(props: any) => {
                          const dim = score360.dimensoes[props.index];
                          return dim ? <circle key={props.index} cx={props.cx} cy={props.cy} r={4} fill={dim.cor} stroke="#0f0a28" strokeWidth={2} /> : null;
                        }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </DashCard>

              {/* Donut chart */}
              {distribuicaoCustos.length > 0 && (
                <DashCard cor="#06b6d4" onClick={() => router.push("/relatorios")}>
                  <div className="p-4">
                    <p className="text-sm font-bold mb-2" style={{ color: "#e2e8f0" }}>{tt.distribuicaoCustos}</p>
                    <div className="flex items-center gap-3">
                      <ResponsiveContainer width="50%" height={130}>
                        <PieChart>
                          <Pie data={distribuicaoCustos} cx="50%" cy="50%" innerRadius={30} outerRadius={55} dataKey="value" paddingAngle={2}>
                            {distribuicaoCustos.map((d, i) => <Cell key={i} fill={d.color} />)}
                          </Pie>
                          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-1">
                        {distribuicaoCustos.slice(0, 4).map((d, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }}></span>
                            <span className="truncate" style={{ color: "#94a3b8" }}>{d.name}</span>
                            <span className="ml-auto font-bold flex-shrink-0" style={{ color: "#e2e8f0" }}>{formatBRL(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </DashCard>
              )}
            </div>
          </div>

          {/* ============ LINHA 3: ALERTAS + AÇÕES + OBRIGAÇÕES ============ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alertas IA */}
            <DashCard cor="#fbbf24">
              <div className="p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>🔍 {tt.alertasIA}</p>
                {anomalias.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "#34d399" }}>✅ {tt.semAlertas}</p>
                ) : (
                  <div className="space-y-2">
                    {anomalias.slice(0, 3).map((a, i) => {
                      const cor = a.severidade === "alerta" ? "#f87171" : a.severidade === "atencao" ? "#fbbf24" : "#34d399";
                      return (
                        <div key={i} className="rounded-lg p-2.5 transition-all hover:translate-x-1" style={{ background: `${cor}08`, border: `1px solid ${cor}20` }}>
                          <p className="text-xs font-bold" style={{ color: cor }}>{a.severidade === "alerta" ? "🚨" : "⚠️"} {anomTitulo(a)}</p>
                        </div>
                      );
                    })}
                    <button onClick={() => router.push("/ia-financeira")} className="text-[11px] w-full text-center py-1 transition-all hover:text-indigo-300" style={{ color: "#8b5cf6" }}>{tt.verMais}</button>
                  </div>
                )}
              </div>
            </DashCard>

            {/* Plano de Ação */}
            <DashCard cor="#34d399">
              <div className="p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>🎯 {tt.acoesIA}</p>
                {acoes.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "#64748b" }}>{tt.semAcoes}</p>
                ) : (
                  <div className="space-y-2">
                    {acoes.slice(0, 3).map((a, i) => {
                      const corCat = a.categoria === "custo" ? "#f87171" : a.categoria === "receita" ? "#34d399" : "#8b5cf6";
                      return (
                        <div key={i} className="rounded-lg p-2.5 flex items-start gap-2 transition-all hover:translate-x-1" style={{ background: "rgba(15,10,40,0.5)", border: `1px solid ${corCat}20` }}>
                          <span className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: `${corCat}20`, color: corCat }}>{a.prioridade}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{acaoTitulo(a)}</p>
                            <p className="text-[10px]" style={{ color: corCat }}>{tt.impacto}: {a.impacto_estimado}</p>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => router.push("/ia-financeira")} className="text-[11px] w-full text-center py-1 transition-all hover:text-indigo-300" style={{ color: "#8b5cf6" }}>{tt.verMais}</button>
                  </div>
                )}
              </div>
            </DashCard>

            {/* Obrigações Fiscais */}
            <DashCard cor="#a78bfa">
              <div className="p-4">
                <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>📅 {tt.obrigacoesFiscais}</p>
                {obrigacoes.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "#64748b" }}>{tt.semObrigacoes}</p>
                ) : (
                  <div className="space-y-2">
                    {obrigacoes.map((o, i) => {
                      const vencida = o.data_vencimento < new Date().toISOString().slice(0, 10);
                      return (
                        <div key={i} className="rounded-lg p-2.5 flex items-center justify-between transition-all hover:translate-x-1" style={{ background: "rgba(15,10,40,0.5)", border: `1px solid ${vencida ? "#f87171" : "#a78bfa"}20` }}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: "#e2e8f0" }}>{o.nome}</p>
                            <p className="text-[10px]" style={{ color: "#64748b" }}>{tt.vence}: {formatData(o.data_vencimento, lang)}</p>
                          </div>
                          {o.valor_estimado > 0 && <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color: vencida ? "#f87171" : "#a78bfa" }}>{formatBRL(o.valor_estimado)}</span>}
                        </div>
                      );
                    })}
                    <button onClick={() => router.push("/empresa")} className="text-[11px] w-full text-center py-1 transition-all hover:text-indigo-300" style={{ color: "#8b5cf6" }}>{tt.verMais}</button>
                  </div>
                )}
              </div>
            </DashCard>
          </div>

          {/* ============ RESUMO IA ============ */}
          <DashCard cor="#6366f1">
            <div className="p-4">
              <p className="text-sm font-bold mb-2" style={{ color: "#e2e8f0" }}>🤖 {tt.resumoIA}</p>
              <div className="rounded-xl p-3 text-sm whitespace-pre-wrap leading-relaxed" style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", color: "#cbd5e1" }}>
                {resumo}
              </div>
            </div>
          </DashCard>

          {/* ============ CONTAS A RECEBER/PAGAR ============ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <DashCard cor="#34d399" onClick={() => router.push("/contas-receber")}>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.contasReceber}</p>
                <p className="text-lg font-black mt-1" style={{ color: "#34d399" }}>{formatBRL(snap.contas_receber)}</p>
              </div>
            </DashCard>
            <DashCard cor="#f87171" onClick={() => router.push("/fornecedores")}>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.contasPagar}</p>
                <p className="text-lg font-black mt-1" style={{ color: "#f87171" }}>{formatBRL(snap.contas_pagar)}</p>
              </div>
            </DashCard>
            <DashCard cor="#a78bfa" onClick={() => router.push("/ia-financeira")}>
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.endividamento}</p>
                <p className="text-lg font-black mt-1" style={{ color: "#a78bfa" }}>{formatBRL(snap.endividamento_total)}</p>
              </div>
            </DashCard>
            <DashCard cor="#06b6d4">
              <div className="p-3">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#94a3b8" }}>{tt.margem}</p>
                <p className="text-lg font-black mt-1" style={{ color: snap.margem_liquida >= 10 ? "#34d399" : "#fbbf24" }}>{snap.margem_liquida.toFixed(1)}%</p>
              </div>
            </DashCard>
          </div>

          {/* ============ ACESSO RÁPIDO ============ */}
          <DashCard cor="#8b5cf6">
            <div className="p-4">
              <p className="text-sm font-bold mb-3" style={{ color: "#e2e8f0" }}>⚡ {tt.acessoRapido}</p>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {quickLinks.map((item, i) => (
                  <button key={i} onClick={() => router.push(item.path)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-center transition-all duration-200 hover:translate-y-[-3px] hover:shadow-lg"
                    style={{ background: `${item.cor}08`, border: `1px solid ${item.cor}15` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `${item.cor}20`; e.currentTarget.style.borderColor = `${item.cor}40`; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = `${item.cor}08`; e.currentTarget.style.borderColor = `${item.cor}15`; }}>
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-[8px] md:text-[9px] font-semibold leading-tight" style={{ color: item.cor }}>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </DashCard>
        </div>
      )}

      {/* MODAL SHARE */}
      {shareAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto" style={{ background: "rgba(8,4,32,0.9)", backdropFilter: "blur(8px)" }} onClick={() => setShareAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(145deg, rgba(15,10,40,0.98), rgba(10,8,30,0.99))", border: "1px solid rgba(139,92,246,0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{tt.centroCompart}</p>
              <button onClick={() => setShareAberto(false)} className="text-xl" style={{ color: "#64748b" }}>✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", color: "#25d366" }}><span className="text-xl">📱</span>WhatsApp</button>
              <button onClick={shareTelegram} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.3)", color: "#229ed9" }}><span className="text-xl">✈️</span>Telegram</button>
              <button onClick={shareGmail} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(234,67,53,0.1)", border: "1px solid rgba(234,67,53,0.3)", color: "#ea4335" }}><span className="text-xl">📨</span>Gmail</button>
              <button onClick={shareOutlook} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(0,120,212,0.1)", border: "1px solid rgba(0,120,212,0.3)", color: "#0078d4" }}><span className="text-xl">📩</span>Outlook</button>
              <button onClick={shareCopiar} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}><span className="text-xl">📋</span>{tt.copiar}</button>
              <button onClick={exportarPDF} disabled={exportando} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50" style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626" }}><span className="text-xl">{exportando ? "⏳" : "📄"}</span>PDF</button>
            </div>
            <button onClick={() => setShareAberto(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{tt.fechar}</button>
          </div>
        </div>
      )}
    </div>
  );
}