"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import {
  carregarSnapshot, carregarBenchmark, calcularScore360, detectarAnomalias,
  gerarProjecoes, simularWhatIf, gerarPlanoAcao, gerarResumoNarrado,
  montarPromptCFO, respostaPorRegras, salvarMensagem, carregarHistorico, limparHistorico,
  type SnapshotFinanceiro, type Score360, type Anomalia, type Projecao, type AcaoSugerida, type BenchmarkSetor,
} from "../../../lib/iaFinanceiraHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// I18N PT/EN/ES
// ============================================================================
const T = {
  pt: {
    titulo: "🧠 IA Financeira",
    subtitulo: "Seu CFO Digital — análise inteligente com dados reais",
    carregando: "Carregando inteligência...",
    // Abas
    abaScore: "🏆 Score 360°",
    abaChat: "💬 Chat CFO",
    abaAnomalias: "🔍 Anomalias",
    abaProjecoes: "🔮 Projeções",
    abaWhatIf: "⚡ What-If",
    abaPlano: "🎯 Plano de Ação",
    abaResumo: "📊 Resumo Executivo",
    abaBenchmark: "📈 Benchmark",
    // Score
    scoreEmpresarial: "Score Empresarial 360°",
    dimensoes: "Dimensões",
    indicadores: "Indicadores",
    sugestao: "Sugestão IA",
    bom: "Bom",
    atencao: "Atenção",
    critico: "Crítico",
    // Chat
    chatTitulo: "💬 Chat com seu CFO Digital",
    chatPlaceholder: "Pergunte sobre suas finanças...",
    chatAnalisando: "Analisando seus dados...",
    chatLimpar: "🗑️ Limpar histórico",
    chatLimparConfirm: "Limpar todo o histórico de conversas?",
    chatSugestoes: ["Qual minha margem líquida?", "Como reduzir custos?", "Como está meu fluxo de caixa?", "Qual meu score empresarial?"],
    // Anomalias
    anomaliasTitulo: "🔍 Anomalias & Alertas",
    anomaliasVazio: "Nenhuma anomalia detectada. Seus indicadores estão dentro do esperado.",
    alerta: "Alerta",
    info: "Info",
    // Projeções
    projecoesTitulo: "🔮 Projeção de Receita — Próximos 6 Meses",
    otimista: "Otimista",
    realista: "Realista",
    pessimista: "Pessimista",
    projecoesVazio: "Sem dados suficientes para projeções. Cadastre ao menos 2 meses de receitas.",
    // What-If
    whatIfTitulo: "⚡ Simulador What-If",
    whatIfDescricao: "Simule cenários e veja o impacto no lucro e margem da sua empresa.",
    cenarioReceita: "Receita sobe/desce %",
    cenarioCustosFix: "Custos fixos sobem/descem %",
    cenarioCustosVar: "Custos variáveis sobem/descem %",
    cenarioPreco: "Preço sobe/desce %",
    simular: "Simular",
    lucroAntes: "Lucro Antes",
    lucroDepois: "Lucro Depois",
    diferenca: "Diferença",
    margemAntes: "Margem Antes",
    margemDepois: "Margem Depois",
    // Plano de Ação
    planoTitulo: "🎯 Plano de Ação IA",
    planoDescricao: "5 ações prioritárias baseadas nos seus dados reais.",
    planoVazio: "Cadastre dados financeiros para receber ações personalizadas.",
    impacto: "Impacto estimado",
    prioridade: "Prioridade",
    // Resumo
    resumoTitulo: "📊 Resumo Executivo Narrado",
    resumoDescricao: "IA analisa seus dados e gera o relatório do mês.",
    // Benchmark
    benchmarkTitulo: "📈 Benchmark Setorial",
    benchmarkDescricao: "Compare seus indicadores com a média do setor.",
    seuValor: "Seu valor",
    faixaSetor: "Faixa do setor",
    // Share
    compartilhar: "📤 Compartilhar",
    centroCompart: "Centro de Compartilhamento",
    compartilharVia: "Compartilhar via",
    fechar: "Fechar",
    copiar: "Copiar",
    pdfRelatorio: "PDF Relatório",
    gerando: "Gerando...",
    cartaoCopiado: "Copiado!",
    erroCopiar: "Erro ao copiar",
  },
  en: {
    titulo: "🧠 Financial AI",
    subtitulo: "Your Digital CFO — intelligent analysis with real data",
    carregando: "Loading intelligence...",
    abaScore: "🏆 Score 360°",
    abaChat: "💬 CFO Chat",
    abaAnomalias: "🔍 Anomalies",
    abaProjecoes: "🔮 Projections",
    abaWhatIf: "⚡ What-If",
    abaPlano: "🎯 Action Plan",
    abaResumo: "📊 Executive Summary",
    abaBenchmark: "📈 Benchmark",
    scoreEmpresarial: "Business Score 360°",
    dimensoes: "Dimensions",
    indicadores: "Indicators",
    sugestao: "AI Suggestion",
    bom: "Good",
    atencao: "Caution",
    critico: "Critical",
    chatTitulo: "💬 Chat with your Digital CFO",
    chatPlaceholder: "Ask about your finances...",
    chatAnalisando: "Analyzing your data...",
    chatLimpar: "🗑️ Clear history",
    chatLimparConfirm: "Clear all conversation history?",
    chatSugestoes: ["What's my net margin?", "How to reduce costs?", "How's my cash flow?", "What's my business score?"],
    anomaliasTitulo: "🔍 Anomalies & Alerts",
    anomaliasVazio: "No anomalies detected. Your indicators are within expected range.",
    alerta: "Alert",
    info: "Info",
    projecoesTitulo: "🔮 Revenue Projection — Next 6 Months",
    otimista: "Optimistic",
    realista: "Realistic",
    pessimista: "Pessimistic",
    projecoesVazio: "Not enough data for projections. Register at least 2 months of revenues.",
    whatIfTitulo: "⚡ What-If Simulator",
    whatIfDescricao: "Simulate scenarios and see the impact on your profit and margin.",
    cenarioReceita: "Revenue up/down %",
    cenarioCustosFix: "Fixed costs up/down %",
    cenarioCustosVar: "Variable costs up/down %",
    cenarioPreco: "Price up/down %",
    simular: "Simulate",
    lucroAntes: "Profit Before",
    lucroDepois: "Profit After",
    diferenca: "Difference",
    margemAntes: "Margin Before",
    margemDepois: "Margin After",
    planoTitulo: "🎯 AI Action Plan",
    planoDescricao: "5 priority actions based on your real data.",
    planoVazio: "Register financial data to receive personalized actions.",
    impacto: "Estimated impact",
    prioridade: "Priority",
    resumoTitulo: "📊 Narrated Executive Summary",
    resumoDescricao: "AI analyzes your data and generates the monthly report.",
    benchmarkTitulo: "📈 Industry Benchmark",
    benchmarkDescricao: "Compare your indicators with industry average.",
    seuValor: "Your value",
    faixaSetor: "Industry range",
    compartilhar: "📤 Share",
    centroCompart: "Sharing Center",
    compartilharVia: "Share via",
    fechar: "Close",
    copiar: "Copy",
    pdfRelatorio: "PDF Report",
    gerando: "Generating...",
    cartaoCopiado: "Copied!",
    erroCopiar: "Copy error",
  },
  es: {
    titulo: "🧠 IA Financiera",
    subtitulo: "Su CFO Digital — análisis inteligente con datos reales",
    carregando: "Cargando inteligencia...",
    abaScore: "🏆 Score 360°",
    abaChat: "💬 Chat CFO",
    abaAnomalias: "🔍 Anomalías",
    abaProjecoes: "🔮 Proyecciones",
    abaWhatIf: "⚡ What-If",
    abaPlano: "🎯 Plan de Acción",
    abaResumo: "📊 Resumen Ejecutivo",
    abaBenchmark: "📈 Benchmark",
    scoreEmpresarial: "Score Empresarial 360°",
    dimensoes: "Dimensiones",
    indicadores: "Indicadores",
    sugestao: "Sugerencia IA",
    bom: "Bueno",
    atencao: "Atención",
    critico: "Crítico",
    chatTitulo: "💬 Chat con su CFO Digital",
    chatPlaceholder: "Pregunte sobre sus finanzas...",
    chatAnalisando: "Analizando sus datos...",
    chatLimpar: "🗑️ Limpiar historial",
    chatLimparConfirm: "¿Limpiar todo el historial de conversaciones?",
    chatSugestoes: ["¿Cuál es mi margen neto?", "¿Cómo reducir costos?", "¿Cómo está mi flujo de caja?", "¿Cuál es mi score empresarial?"],
    anomaliasTitulo: "🔍 Anomalías & Alertas",
    anomaliasVazio: "Sin anomalías detectadas. Sus indicadores están dentro de lo esperado.",
    alerta: "Alerta",
    info: "Info",
    projecoesTitulo: "🔮 Proyección de Ingresos — Próximos 6 Meses",
    otimista: "Optimista",
    realista: "Realista",
    pessimista: "Pesimista",
    projecoesVazio: "Datos insuficientes para proyecciones. Registre al menos 2 meses de ingresos.",
    whatIfTitulo: "⚡ Simulador What-If",
    whatIfDescricao: "Simule escenarios y vea el impacto en su beneficio y margen.",
    cenarioReceita: "Ingresos suben/bajan %",
    cenarioCustosFix: "Costos fijos suben/bajan %",
    cenarioCustosVar: "Costos variables suben/bajan %",
    cenarioPreco: "Precio sube/baja %",
    simular: "Simular",
    lucroAntes: "Beneficio Antes",
    lucroDepois: "Beneficio Después",
    diferenca: "Diferencia",
    margemAntes: "Margen Antes",
    margemDepois: "Margen Después",
    planoTitulo: "🎯 Plan de Acción IA",
    planoDescricao: "5 acciones prioritarias basadas en sus datos reales.",
    planoVazio: "Registre datos financieros para recibir acciones personalizadas.",
    impacto: "Impacto estimado",
    prioridade: "Prioridad",
    resumoTitulo: "📊 Resumen Ejecutivo Narrado",
    resumoDescricao: "IA analiza sus datos y genera el informe del mes.",
    benchmarkTitulo: "📈 Benchmark Sectorial",
    benchmarkDescricao: "Compare sus indicadores con el promedio del sector.",
    seuValor: "Su valor",
    faixaSetor: "Rango del sector",
    compartilhar: "📤 Compartir",
    centroCompart: "Centro de Compartir",
    compartilharVia: "Compartir vía",
    fechar: "Cerrar",
    copiar: "Copiar",
    pdfRelatorio: "PDF Informe",
    gerando: "Generando...",
    cartaoCopiado: "¡Copiado!",
    erroCopiar: "Error al copiar",
  },
};

const tooltipStyle = { background: "rgba(2,8,16,0.97)", border: "1px solid rgba(106,176,255,0.3)", borderRadius: "12px", color: "#c8d8f0", fontSize: "12px" };

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}

export default function IAFinanceiraPage() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];
  const chatRef = useRef<HTMLDivElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [aba, setAba] = useState<"score" | "chat" | "anomalias" | "projecoes" | "whatif" | "plano" | "resumo" | "benchmark">("score");

  // Dados reais
  const [snap, setSnap] = useState<SnapshotFinanceiro | null>(null);
  const [score360, setScore360] = useState<Score360 | null>(null);
  const [bench, setBench] = useState<BenchmarkSetor | null>(null);
  const [anomalias, setAnomalias] = useState<Anomalia[]>([]);
  const [projecoes, setProjecoes] = useState<Projecao[]>([]);
  const [acoes, setAcoes] = useState<AcaoSugerida[]>([]);
  const [resumo, setResumo] = useState("");

  // Chat
  const [mensagens, setMensagens] = useState<{ role: string; texto: string }[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [chatCarregando, setChatCarregando] = useState(false);

  // What-If
  const [whatIfTipo, setWhatIfTipo] = useState("receita_pct");
  const [whatIfValor, setWhatIfValor] = useState(10);
  const [whatIfResultado, setWhatIfResultado] = useState<any>(null);

  // Share
  const [shareAberto, setShareAberto] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => { inicializar(); }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [mensagens, chatCarregando]);

  async function inicializar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setUserId(user.id);
    await carregarTudo(user.id);
  }

  async function carregarTudo(uid: string) {
    setCarregando(true);
    try {
      const snapshot = await carregarSnapshot(uid);
      const benchmark = await carregarBenchmark(snapshot.setor);
      const score = calcularScore360(snapshot, benchmark);
      const anom = detectarAnomalias(snapshot, benchmark);
      const proj = gerarProjecoes(snapshot);
      const plano = gerarPlanoAcao(snapshot, score, anom);
      const res = gerarResumoNarrado(snapshot, score, benchmark, lang);

      setSnap(snapshot);
      setBench(benchmark);
      setScore360(score);
      setAnomalias(anom);
      setProjecoes(proj);
      setAcoes(plano);
      setResumo(res);

      // Carregar histórico de chat
      const hist = await carregarHistorico(uid);
      if (hist.length > 0) {
        setMensagens(hist.map(h => ({ role: h.role, texto: h.mensagem })));
      } else {
        const msgInicial = lang === "en"
          ? `Hello! I'm your Digital CFO. Your Business Score is ${score.total}/100. Ask me anything about your finances.`
          : lang === "es"
          ? `¡Hola! Soy su CFO Digital. Su Score Empresarial es ${score.total}/100. Pregunte lo que quiera sobre sus finanzas.`
          : `Olá! Sou seu CFO Digital. Seu Score Empresarial é ${score.total}/100. Pergunte o que quiser sobre suas finanças.`;
        setMensagens([{ role: "assistant", texto: msgInicial }]);
      }
    } catch (err: any) {
      showToast(err.message || "Erro", "erro");
    }
    setCarregando(false);
  }

  // =========================================================================
  // CHAT
  // =========================================================================
  async function enviarMensagem(texto: string) {
    if (!texto.trim() || chatCarregando || !snap || !score360 || !userId) return;
    const novas = [...mensagens, { role: "user", texto }];
    setMensagens(novas);
    setInputChat("");
    setChatCarregando(true);

    await salvarMensagem(userId, "user", texto);

    // Tentar Claude API primeiro, fallback pra regras
    let resposta = "";
    let modelo = "regras";

    try {
      const res = await fetch("/api/ia-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // A rota (app/api/ia-chat/route.ts) espera {mensagem, historico, contexto} — antes
          // este fetch mandava {prompt, mensagens} e nunca acertava o contrato real, então
          // sempre caía no fallback de regras mesmo com ANTHROPIC_API_KEY ativa.
          mensagem: montarPromptCFO(snap, score360, bench, texto, lang),
          historico: novas.slice(-10).map(m => ({ role: m.role, content: m.texto })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        resposta = data.resposta || "";
        modelo = "claude";
      }
    } catch {}

    // Fallback: resposta por regras
    if (!resposta) {
      resposta = respostaPorRegras(snap, score360, bench, texto, lang);
    }

    setMensagens([...novas, { role: "assistant", texto: resposta }]);
    await salvarMensagem(userId, "assistant", resposta, { score: score360.total }, modelo);
    setChatCarregando(false);
  }

  async function onLimparHistorico() {
    if (!userId) return;
    if (!window.confirm(tt.chatLimparConfirm)) return;
    await limparHistorico(userId);
    setMensagens([{ role: "assistant", texto: lang === "en" ? "History cleared. How can I help?" : lang === "es" ? "Historial limpio. ¿Cómo puedo ayudar?" : "Histórico limpo. Como posso ajudar?" }]);
  }

  // =========================================================================
  // WHAT-IF
  // =========================================================================
  function executarWhatIf() {
    if (!snap) return;
    const resultado = simularWhatIf(snap, { tipo: whatIfTipo, valor: whatIfValor });
    setWhatIfResultado(resultado);
  }

  // =========================================================================
  // SHARE
  // =========================================================================
  function montarTextoShare(): string {
    if (!snap || !score360) return "Axioma AI.Tech";
    return [
      `🦅 *AXIOMA AI.TECH — IA Financeira*`,
      ``,
      `🏆 *Score 360°:* ${score360.total}/100 (${lang === "en" ? score360.nivel_en : lang === "es" ? score360.nivel_es : score360.nivel})`,
      ``,
      `💰 ${lang === "en" ? "Revenue" : lang === "es" ? "Ingresos" : "Receita"}: ${formatBRL(snap.receita_bruta)}`,
      `📊 ${lang === "en" ? "Net Margin" : lang === "es" ? "Margen Neto" : "Margem Líquida"}: ${snap.margem_liquida.toFixed(1)}%`,
      `✅ ${lang === "en" ? "Net Profit" : lang === "es" ? "Beneficio" : "Lucro"}: ${formatBRL(snap.lucro_liquido)}`,
      ``,
      score360.dimensoes.map(d => `${lang === "en" ? d.nome_en : lang === "es" ? d.nome_es : d.nome}: ${d.score}/100`).join("\n"),
      ``,
      `_axiomaai.com.br_`,
    ].join("\n");
  }

  function shareWhatsApp() { window.open(`https://wa.me/?text=${encodeURIComponent(montarTextoShare())}`, "_blank"); }
  function shareTelegram() { window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${encodeURIComponent(montarTextoShare())}`, "_blank"); }
  function shareGmail() {
    const s = encodeURIComponent("Axioma IA Financeira"); const b = encodeURIComponent(montarTextoShare().replace(/\*/g, ""));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${s}&body=${b}`, "_blank", "noopener,noreferrer");
  }
  function shareOutlook() {
    const s = encodeURIComponent("Axioma IA Financeira"); const b = encodeURIComponent(montarTextoShare().replace(/\*/g, ""));
    window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${s}&body=${b}`, "_blank", "noopener,noreferrer");
  }
  async function shareCopiar() {
    try { await navigator.clipboard.writeText(montarTextoShare().replace(/\*/g, "")); showToast(tt.cartaoCopiado, "ok"); }
    catch { showToast(tt.erroCopiar, "erro"); }
  }

  // PDF
  async function exportarPDF() {
    if (!snap || !score360) return;
    setExportando(true);
    try {
      await gerarPdfTabela({
        titulo: `${tt.titulo} — Score ${score360.total}/100`,
        subtitulo: snap.periodo,
        colunas: [
          { header: lang === "en" ? "INDICATOR" : lang === "es" ? "INDICADOR" : "INDICADOR", key: "ind", width: 55, align: "left" as const },
          { header: lang === "en" ? "VALUE" : "VALOR", key: "val", width: 35, align: "right" as const },
          { header: "STATUS", key: "st", width: 25, align: "left" as const },
        ],
        linhas: [
          { ind: lang === "en" ? "Revenue" : "Receita", val: formatBRL(snap.receita_bruta), st: "—" },
          { ind: lang === "en" ? "Net Profit" : "Lucro Líquido", val: formatBRL(snap.lucro_liquido), st: snap.lucro_liquido >= 0 ? "OK" : "⚠️" },
          { ind: lang === "en" ? "Gross Margin" : "Margem Bruta", val: `${snap.margem_bruta.toFixed(1)}%`, st: snap.margem_bruta >= 40 ? "OK" : "⚠️" },
          { ind: lang === "en" ? "Net Margin" : "Margem Líquida", val: `${snap.margem_liquida.toFixed(1)}%`, st: snap.margem_liquida >= 10 ? "OK" : "⚠️" },
          { ind: lang === "en" ? "Delinquency" : "Inadimplência", val: `${snap.inadimplencia_pct.toFixed(1)}%`, st: snap.inadimplencia_pct <= 5 ? "OK" : "⚠️" },
          ...score360.dimensoes.map(d => ({ ind: lang === "en" ? d.nome_en : d.nome, val: `${d.score}/100`, st: d.score >= 60 ? "OK" : "⚠️" })),
        ],
        resumo: [
          { label: "Score 360°", valor: `${score360.total}/100 (${lang === "en" ? score360.nivel_en : score360.nivel})` },
          { label: lang === "en" ? "Period" : "Período", valor: snap.periodo },
        ],
        nomeArquivo: `axioma-ia-financeira-${snap.periodo.replace("/", "-")}.pdf`,
      });
    } catch (err: any) { showToast(err.message, "erro"); }
    setExportando(false);
  }

  const inputStyle = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  const dimNome = (d: any) => lang === "en" ? d.nome_en : lang === "es" ? d.nome_es : d.nome;
  const dimSugestao = (d: any) => lang === "en" ? d.sugestao_en : lang === "es" ? d.sugestao_es : d.sugestao;
  const anomTitulo = (a: Anomalia) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const anomDesc = (a: Anomalia) => lang === "en" ? a.descricao_en : lang === "es" ? a.descricao_es : a.descricao;
  const acaoTitulo = (a: AcaoSugerida) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const acaoDesc = (a: AcaoSugerida) => lang === "en" ? a.descricao_en : lang === "es" ? a.descricao_es : a.descricao;

  return (
    <ModuloLayout titulo={tt.titulo} subtitulo={tt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}

      {carregando && (
        <CanvasBox cor="#a78bfa">
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#a78bfa" }}>{tt.carregando}</p>
          </div>
        </CanvasBox>
      )}

      {!carregando && snap && score360 && (
        <div className="space-y-4">
          {/* HEADER: Score 360 + Resumo rápido */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <CanvasBox cor={score360.cor}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🏆 Score 360°</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: score360.cor }}>{score360.total}</span>
                <span style={{ color: "#5a7a9a" }}>/100</span>
              </div>
              <p className="text-xs font-bold" style={{ color: score360.cor }}>{lang === "en" ? score360.nivel_en : lang === "es" ? score360.nivel_es : score360.nivel}</p>
            </CanvasBox>
            {[
              { label: lang === "en" ? "Revenue" : lang === "es" ? "Ingresos" : "Receita", valor: formatBRL(snap.receita_bruta), cor: "#34d399" },
              { label: lang === "en" ? "Net Profit" : lang === "es" ? "Beneficio" : "Lucro Líquido", valor: formatBRL(snap.lucro_liquido), cor: snap.lucro_liquido >= 0 ? "#6ab0ff" : "#f87171" },
              { label: lang === "en" ? "Net Margin" : lang === "es" ? "Margen" : "Margem", valor: `${snap.margem_liquida.toFixed(1)}%`, cor: "#a78bfa" },
            ].map((c, i) => (
              <CanvasBox key={i} cor={c.cor}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{c.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: c.cor }}>{c.valor}</p>
              </CanvasBox>
            ))}
          </div>

          {/* Botão share + Abas */}
          <button onClick={() => setShareAberto(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
            {tt.compartilhar}
          </button>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "score", label: tt.abaScore },
              { key: "chat", label: tt.abaChat },
              { key: "anomalias", label: `${tt.abaAnomalias} (${anomalias.length})` },
              { key: "projecoes", label: tt.abaProjecoes },
              { key: "whatif", label: tt.abaWhatIf },
              { key: "plano", label: `${tt.abaPlano} (${acoes.length})` },
              { key: "resumo", label: tt.abaResumo },
              { key: "benchmark", label: tt.abaBenchmark },
            ].map((a) => (
              <button key={a.key} onClick={() => setAba(a.key as any)}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: aba === a.key ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.6)",
                  color: aba === a.key ? "#fff" : "#6ab0ff",
                  border: aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)",
                }}>{a.label}</button>
            ))}
          </div>

          {/* ABA SCORE 360 */}
          {aba === "score" && (
            <div className="space-y-4">
              {/* Radar Chart */}
              <CanvasBox cor={score360.cor}>
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.scoreEmpresarial}</p>
                <ResponsiveContainer width="100%" height={320}>
                  <RadarChart data={score360.dimensoes.map(d => ({ subject: dimNome(d), score: d.score, benchmark: 70, fullMark: 100 }))}>
                    <defs>
                      <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={score360.cor} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={score360.cor} stopOpacity={0.05} />
                      </radialGradient>
                    </defs>
                    <PolarGrid stroke="rgba(106,176,255,0.12)" gridType="polygon" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#c8d8f0", fontSize: 12, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#5a7a9a", fontSize: 10 }} axisLine={false} />
                    <Radar name="Benchmark" dataKey="benchmark" stroke="#fbbf24" strokeWidth={1} strokeDasharray="4 4" fill="transparent" dot={false} />
                    <Radar name="Score" dataKey="score" stroke={score360.cor} fill="url(#radarGrad)" strokeWidth={2.5}
                      dot={(props: any) => {
                        const dim = score360.dimensoes[props.index];
                        if (!dim) return <circle key={props.index} cx={props.cx} cy={props.cy} r={6} fill={score360.cor} stroke="#020810" strokeWidth={2} />;
                        return (
                          <g key={props.index}>
                            <circle cx={props.cx} cy={props.cy} r={10} fill={dim.cor} fillOpacity={0.2} />
                            <circle cx={props.cx} cy={props.cy} r={6} fill={dim.cor} stroke="#020810" strokeWidth={2} />
                            <text x={props.cx} y={props.cy - 14} textAnchor="middle" fill={dim.cor} fontSize={11} fontWeight={700}>{dim.score}</text>
                          </g>
                        );
                      }}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="flex items-center justify-center gap-4 mt-2 text-[10px] flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: score360.cor }}></span> <span style={{ color: "#5a7a9a" }}>Score</span></span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ background: "#fbbf24", borderTop: "1px dashed #fbbf24" }}></span> <span style={{ color: "#5a7a9a" }}>Benchmark (70)</span></span>
                </div>
              </CanvasBox>

              {/* Cards por dimensão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {score360.dimensoes.map((d, i) => (
                  <CanvasBox key={i} cor={d.cor}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold" style={{ color: d.cor }}>{dimNome(d)}</p>
                      <span className="text-lg font-black" style={{ color: d.cor }}>{d.score}</span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {d.indicadores.map((ind, j) => (
                        <div key={j} className="flex items-center justify-between text-xs">
                          <span style={{ color: "#c8d8f0" }}>{ind.nome}</span>
                          <div className="flex items-center gap-2">
                            <span style={{ color: ind.status === "bom" ? "#34d399" : ind.status === "atencao" ? "#fbbf24" : "#f87171" }}>{ind.valor}</span>
                            {ind.status !== "bom" && (
                              <a href="/empresa" className="text-[10px] px-1 py-0.5 rounded" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>✏️</a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg p-2" style={{ background: `${d.cor}10`, border: `1px solid ${d.cor}20` }}>
                      <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: "#5a7a9a" }}>💡 {tt.sugestao}</p>
                      <p className="text-[11px]" style={{ color: "#c8d8f0" }}>{dimSugestao(d)}</p>
                    </div>
                  </CanvasBox>
                ))}
              </div>
            </div>
          )}

          {/* ABA CHAT */}
          {aba === "chat" && (
            <CanvasBox cor="#6ab0ff">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{tt.chatTitulo}</p>
                <button onClick={onLimparHistorico} className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{tt.chatLimpar}</button>
              </div>
              <div ref={chatRef} className="space-y-3 min-h-48 max-h-96 overflow-y-auto mb-4 pr-1">
                {mensagens.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap"
                      style={{ background: m.role === "user" ? "rgba(106,176,255,0.15)" : "rgba(10,22,40,0.8)", border: `1px solid ${m.role === "user" ? "rgba(106,176,255,0.3)" : "rgba(106,176,255,0.1)"}`, color: "#c8d8f0" }}>
                      {m.texto}
                    </div>
                  </div>
                ))}
                {chatCarregando && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-2xl text-sm" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(106,176,255,0.1)", color: "#5a7a9a" }}>
                      {tt.chatAnalisando} <span className="animate-pulse">●●●</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {tt.chatSugestoes.map((s, i) => (
                  <button key={i} onClick={() => enviarMensagem(s)}
                    className="text-[11px] px-3 py-1.5 rounded-lg" style={{ background: "rgba(106,176,255,0.08)", border: "1px solid rgba(106,176,255,0.2)", color: "#6ab0ff" }}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={inputChat} onChange={(e) => setInputChat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && enviarMensagem(inputChat)}
                  placeholder={tt.chatPlaceholder} className="flex-1 px-4 py-3 rounded-xl text-sm" style={inputStyle} />
                <button onClick={() => enviarMensagem(inputChat)} disabled={chatCarregando || !inputChat.trim()}
                  className="px-4 py-3 rounded-xl font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  ➤
                </button>
              </div>
            </CanvasBox>
          )}

          {/* ABA ANOMALIAS */}
          {aba === "anomalias" && (
            <div className="space-y-3">
              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.anomaliasTitulo}</p>
              </CanvasBox>
              {anomalias.length === 0 ? (
                <CanvasBox cor="#34d399"><p className="text-xs py-6 text-center" style={{ color: "#34d399" }}>{tt.anomaliasVazio}</p></CanvasBox>
              ) : (
                anomalias.map((a, i) => {
                  const cor = a.severidade === "alerta" ? "#f87171" : a.severidade === "atencao" ? "#fbbf24" : "#34d399";
                  const icon = a.severidade === "alerta" ? "🚨" : a.severidade === "atencao" ? "⚠️" : "ℹ️";
                  return (
                    <CanvasBox key={i} cor={cor}>
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold" style={{ color: cor }}>{anomTitulo(a)}</p>
                            {a.metrica && <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${cor}20`, color: cor }}>{a.metrica}</span>}
                          </div>
                          <p className="text-xs" style={{ color: "#c8d8f0" }}>{anomDesc(a)}</p>
                        </div>
                      </div>
                    </CanvasBox>
                  );
                })
              )}
            </div>
          )}

          {/* ABA PROJEÇÕES */}
          {aba === "projecoes" && (
            <CanvasBox cor="#a78bfa">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.projecoesTitulo}</p>
              {projecoes.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.projecoesVazio}</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={projecoes}>
                    <defs>
                      <linearGradient id="gOt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/><stop offset="95%" stopColor="#34d399" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gRe" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6ab0ff" stopOpacity={0.3}/><stop offset="95%" stopColor="#6ab0ff" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gPe" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                    <XAxis dataKey="mes" stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatBRL(Number(v) || 0)} />
                    <Area type="monotone" dataKey="otimista" stroke="#34d399" fill="url(#gOt)" strokeWidth={2} name={tt.otimista} />
                    <Area type="monotone" dataKey="realista" stroke="#6ab0ff" fill="url(#gRe)" strokeWidth={2} name={tt.realista} />
                    <Area type="monotone" dataKey="pessimista" stroke="#f87171" fill="url(#gPe)" strokeWidth={2} name={tt.pessimista} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CanvasBox>
          )}

          {/* ABA WHAT-IF */}
          {aba === "whatif" && (
            <div className="space-y-4">
              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.whatIfTitulo}</p>
                <p className="text-xs mb-4" style={{ color: "#c8d8f0" }}>{tt.whatIfDescricao}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <select value={whatIfTipo} onChange={(e) => setWhatIfTipo(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                    <option value="receita_pct" style={{ background: "#020810" }}>{tt.cenarioReceita}</option>
                    <option value="custos_fixos_pct" style={{ background: "#020810" }}>{tt.cenarioCustosFix}</option>
                    <option value="custos_var_pct" style={{ background: "#020810" }}>{tt.cenarioCustosVar}</option>
                    <option value="preco_pct" style={{ background: "#020810" }}>{tt.cenarioPreco}</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <input type="range" min={-50} max={50} value={whatIfValor} onChange={(e) => setWhatIfValor(Number(e.target.value))}
                      className="flex-1" />
                    <span className="text-sm font-bold min-w-12 text-center" style={{ color: whatIfValor >= 0 ? "#34d399" : "#f87171" }}>
                      {whatIfValor >= 0 ? "+" : ""}{whatIfValor}%
                    </span>
                  </div>
                  <button onClick={executarWhatIf}
                    className="px-4 py-2 rounded-lg text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>
                    {tt.simular}
                  </button>
                </div>
                {whatIfResultado && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: tt.lucroAntes, valor: formatBRL(whatIfResultado.lucro_antes), cor: "#6ab0ff" },
                      { label: tt.lucroDepois, valor: formatBRL(whatIfResultado.lucro_depois), cor: whatIfResultado.lucro_depois >= 0 ? "#34d399" : "#f87171" },
                      { label: tt.diferenca, valor: `${whatIfResultado.diferenca >= 0 ? "+" : ""}${formatBRL(whatIfResultado.diferenca)}`, cor: whatIfResultado.diferenca >= 0 ? "#34d399" : "#f87171" },
                      { label: tt.margemAntes, valor: `${whatIfResultado.margem_antes.toFixed(1)}%`, cor: "#a78bfa" },
                      { label: tt.margemDepois, valor: `${whatIfResultado.margem_depois.toFixed(1)}%`, cor: whatIfResultado.margem_depois > whatIfResultado.margem_antes ? "#34d399" : "#f87171" },
                    ].map((c, i) => (
                      <div key={i} className="rounded-xl p-3 text-center" style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${c.cor}30` }}>
                        <p className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{c.label}</p>
                        <p className="text-base font-bold mt-1" style={{ color: c.cor }}>{c.valor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CanvasBox>
            </div>
          )}

          {/* ABA PLANO DE AÇÃO */}
          {aba === "plano" && (
            <div className="space-y-3">
              <CanvasBox cor="#34d399">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.planoTitulo}</p>
                <p className="text-xs" style={{ color: "#c8d8f0" }}>{tt.planoDescricao}</p>
              </CanvasBox>
              {acoes.length === 0 ? (
                <CanvasBox cor="#fbbf24"><p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.planoVazio}</p></CanvasBox>
              ) : (
                acoes.map((a, i) => {
                  const corCat = a.categoria === "custo" ? "#f87171" : a.categoria === "receita" ? "#34d399" : a.categoria === "cobranca" ? "#fbbf24" : a.categoria === "fiscal" ? "#a78bfa" : "#6ab0ff";
                  return (
                    <CanvasBox key={i} cor={corCat}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0"
                          style={{ background: `${corCat}20`, color: corCat }}>
                          {a.prioridade}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{acaoTitulo(a)}</p>
                          <p className="text-xs mt-1" style={{ color: "#a8b8d0" }}>{acaoDesc(a)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${corCat}15`, color: corCat }}>{tt.impacto}: {a.impacto_estimado}</span>
                          </div>
                        </div>
                      </div>
                    </CanvasBox>
                  );
                })
              )}
            </div>
          )}

          {/* ABA RESUMO EXECUTIVO */}
          {aba === "resumo" && (
            <CanvasBox cor="#6ab0ff">
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.resumoTitulo}</p>
              <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.resumoDescricao}</p>
              <div className="rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed"
                style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                {resumo}
              </div>
            </CanvasBox>
          )}

          {/* ABA BENCHMARK */}
          {aba === "benchmark" && bench && (
            <div className="space-y-3">
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.benchmarkTitulo}</p>
                <p className="text-xs" style={{ color: "#c8d8f0" }}>{tt.benchmarkDescricao}</p>
                <p className="text-xs mt-1" style={{ color: "#a78bfa" }}>
                  {lang === "en" ? "Industry" : lang === "es" ? "Sector" : "Setor"}: <strong>{bench.setor}</strong>
                </p>
              </CanvasBox>
              {[
                { label: lang === "en" ? "Gross Margin" : lang === "es" ? "Margen Bruto" : "Margem Bruta", valor: snap.margem_bruta, min: bench.margem_bruta_min, max: bench.margem_bruta_max, unit: "%" },
                { label: lang === "en" ? "Net Margin" : lang === "es" ? "Margen Neto" : "Margem Líquida", valor: snap.margem_liquida, min: bench.margem_liquida_min, max: bench.margem_liquida_max, unit: "%" },
                { label: lang === "en" ? "Delinquency" : lang === "es" ? "Morosidad" : "Inadimplência", valor: snap.inadimplencia_pct, min: 0, max: bench.inadimplencia_max, unit: "%" },
                { label: lang === "en" ? "Cost/Revenue" : lang === "es" ? "Costo/Ingreso" : "Custo/Receita", valor: snap.receita_bruta > 0 ? (snap.custos_totais / snap.receita_bruta) * 100 : 0, min: 0, max: bench.custo_sobre_receita_max, unit: "%" },
              ].map((b, i) => {
                const dentro = b.label.includes("Inadimplência") || b.label.includes("Delinquency") || b.label.includes("Morosidad") || b.label.includes("Custo") || b.label.includes("Cost") || b.label.includes("Costo")
                  ? b.valor <= b.max
                  : b.valor >= b.min;
                return (
                  <CanvasBox key={i} cor={dentro ? "#34d399" : "#f87171"}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{b.label}</p>
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.faixaSetor}: {b.min.toFixed(0)}-{b.max.toFixed(0)}{b.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black" style={{ color: dentro ? "#34d399" : "#f87171" }}>{b.valor.toFixed(1)}{b.unit}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: dentro ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: dentro ? "#34d399" : "#f87171" }}>
                          {dentro ? "✓" : "✗"} {tt.seuValor}
                        </span>
                      </div>
                    </div>
                  </CanvasBox>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL SHARE */}
      {shareAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setShareAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)" }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{tt.centroCompart}</p>
              <button onClick={() => setShareAberto(false)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            {snap && score360 && (
              <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.6)", border: "1px solid rgba(106,176,255,0.15)" }}>
                <p style={{ color: "#c8d8f0" }}>🏆 Score: <strong style={{ color: score360.cor }}>{score360.total}/100</strong> • 💰 {formatBRL(snap.receita_bruta)} • 📊 {snap.margem_liquida.toFixed(1)}%</p>
              </div>
            )}
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.compartilharVia}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#25d366" }}>
                <span className="text-xl">📱</span>WhatsApp</button>
              <button onClick={shareTelegram} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.35)", color: "#229ed9" }}>
                <span className="text-xl">✈️</span>Telegram</button>
              <button onClick={shareGmail} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(234,67,53,0.12)", border: "1px solid rgba(234,67,53,0.35)", color: "#ea4335" }}>
                <span className="text-xl">📨</span>Gmail</button>
              <button onClick={shareOutlook} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(0,120,212,0.12)", border: "1px solid rgba(0,120,212,0.35)", color: "#0078d4" }}>
                <span className="text-xl">📩</span>Outlook</button>
              <button onClick={shareCopiar} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <span className="text-xl">📋</span>{tt.copiar}</button>
              <button onClick={exportarPDF} disabled={exportando} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626" }}>
                <span className="text-xl">{exportando ? "⏳" : "📄"}</span>{exportando ? tt.gerando : tt.pdfRelatorio}</button>
            </div>
            <button onClick={() => setShareAberto(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.fechar}</button>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}