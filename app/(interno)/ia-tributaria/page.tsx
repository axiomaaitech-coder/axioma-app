"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { AnimatedNumber } from "../../../components/AnimatedNumber";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { tratarFalhaCarregamento, tratarFalhaExportacao } from "../../../lib/erroUiHelpers";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import {
  carregarDadosFiscais, simularRegimes, calcularCargaTributaria, calcularScoreFiscal,
  calcularEconomiaTributaria, gerarAlertasReforma, gerarDiagnosticoFiscal,
  montarPromptTributario, respostaTributariaPorRegras, salvarMensagemTrib, carregarHistoricoTrib, limparHistoricoTrib,
  type DadosFiscais, type SimulacaoRegime, type ScoreFiscal, type AlertaReforma, type AtividadeFiscal,
} from "../../../lib/iaTributariaHelpers";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import { useThemeAxioma } from "../../../lib/ThemeContext";
import { ThemeToggle } from "../../../components/ThemeToggle";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const T = {
  pt: {
    titulo: "🏛️ IA Tributária", subtitulo: "Seu Consultor Fiscal Digital — simulação, economia e compliance",
    carregando: "Carregando inteligência fiscal...",
    abaScore: "🛡️ Score Fiscal", abaChat: "💬 Chat Fiscal", abaSimulador: "🏛️ Simulador de Regime",
    abaCarga: "📊 Carga Tributária", abaEconomia: "💰 Economia", abaReforma: "🔔 Reforma 2026",
    abaDiagnostico: "📋 Diagnóstico", abaCalendario: "📅 Calendário",
    scoreFiscal: "Score Fiscal", scoreFiscalDesc: "Adequação fiscal e compliance da sua empresa.",
    chatTitulo: "💬 Chat com seu Consultor Fiscal Digital", chatPlaceholder: "Pergunte sobre impostos, regime, DAS...",
    chatAnalisando: "Consultando legislação...", chatLimpar: "🗑️ Limpar",
    chatLimparConfirm: "Limpar todo o histórico?",
    chatErroLimpar: "Não foi possível limpar o histórico no servidor — pode reaparecer ao recarregar. Tente novamente.",
    chatSugestoes: ["Qual o melhor regime pra mim?", "Quanto pago de imposto?", "O que muda com a reforma?", "Como calcular o DAS?"],
    simuladorTitulo: "🏛️ Comparativo de Regimes Tributários", simuladorDesc: "Simulação com seus dados reais. O mais barato aparece primeiro.",
    regimeAtual: "Atual", recomendado: "MAIS BARATO", inelegivel: "Inelegível", porMes: "/mês", porAno: "/ano",
    aliquotaEfetiva: "Alíq. efetiva", economiaPorAno: "Economia/ano vs atual",
    cargaTitulo: "📊 Sua Carga Tributária Real", cargaDesc: "Quanto você paga de imposto sobre o faturamento.",
    cargaSobreReceita: "da receita em impostos", composicao: "Composição",
    economiaTitulo: "💰 Economia Tributária Potencial", economiaDesc: "Quanto sua empresa pode economizar com otimização fiscal.",
    economiaMensal: "Economia mensal", economiaAnual: "Economia anual", regimeIdeal: "Regime ideal",
    acoesEconomia: "Ações para economizar",
    reformaTitulo: "🔔 Reforma Tributária 2026-2033", reformaDesc: "Timeline e impactos da transição IBS/CBS no seu negócio.",
    positivo: "Positivo", neutro: "Neutro", negativo: "Atenção",
    diagnosticoTitulo: "📋 Diagnóstico Fiscal Completo", diagnosticoDesc: "IA analisa todos os seus dados e gera parecer tributário.",
    calendarioTitulo: "📅 Calendário Fiscal", calendarioDesc: "Veja e gerencie suas obrigações no módulo Empresa → Compliance & Fiscal.",
    irParaEmpresa: "Ir para Empresa → Compliance",
    compartilhar: "📤 Compartilhar", centroCompart: "Centro de Compartilhamento", compartilharVia: "Compartilhar via",
    fechar: "Fechar", copiar: "Copiar", pdfRelatorio: "PDF Relatório", gerando: "Gerando...",
    copiado: "Copiado!", erroCopiar: "Erro ao copiar",
  },
  en: {
    titulo: "🏛️ Tax AI", subtitulo: "Your Digital Tax Consultant — simulation, savings and compliance",
    carregando: "Loading tax intelligence...",
    abaScore: "🛡️ Tax Score", abaChat: "💬 Tax Chat", abaSimulador: "🏛️ Regime Simulator",
    abaCarga: "📊 Tax Burden", abaEconomia: "💰 Savings", abaReforma: "🔔 Reform 2026",
    abaDiagnostico: "📋 Diagnosis", abaCalendario: "📅 Calendar",
    scoreFiscal: "Tax Score", scoreFiscalDesc: "Your company's fiscal adequacy and compliance.",
    chatTitulo: "💬 Chat with your Digital Tax Consultant", chatPlaceholder: "Ask about taxes, regime, DAS...",
    chatAnalisando: "Consulting legislation...", chatLimpar: "🗑️ Clear",
    chatLimparConfirm: "Clear all history?",
    chatErroLimpar: "Could not clear the history on the server — it may reappear on reload. Try again.",
    chatSugestoes: ["What's the best regime for me?", "How much tax do I pay?", "What changes with the reform?", "How to calculate DAS?"],
    simuladorTitulo: "🏛️ Tax Regime Comparison", simuladorDesc: "Simulation with your real data. Cheapest appears first.",
    regimeAtual: "Current", recomendado: "CHEAPEST", inelegivel: "Ineligible", porMes: "/mo", porAno: "/yr",
    aliquotaEfetiva: "Eff. rate", economiaPorAno: "Savings/year vs current",
    cargaTitulo: "📊 Your Real Tax Burden", cargaDesc: "How much you pay in taxes on revenue.",
    cargaSobreReceita: "of revenue in taxes", composicao: "Breakdown",
    economiaTitulo: "💰 Potential Tax Savings", economiaDesc: "How much your company can save with tax optimization.",
    economiaMensal: "Monthly savings", economiaAnual: "Annual savings", regimeIdeal: "Ideal regime",
    acoesEconomia: "Savings actions",
    reformaTitulo: "🔔 Tax Reform 2026-2033", reformaDesc: "Timeline and impacts of IBS/CBS transition on your business.",
    positivo: "Positive", neutro: "Neutral", negativo: "Attention",
    diagnosticoTitulo: "📋 Complete Tax Diagnosis", diagnosticoDesc: "AI analyzes all your data and generates tax opinion.",
    calendarioTitulo: "📅 Fiscal Calendar", calendarioDesc: "View and manage obligations in Company → Compliance & Fiscal.",
    irParaEmpresa: "Go to Company → Compliance",
    compartilhar: "📤 Share", centroCompart: "Sharing Center", compartilharVia: "Share via",
    fechar: "Close", copiar: "Copy", pdfRelatorio: "PDF Report", gerando: "Generating...",
    copiado: "Copied!", erroCopiar: "Copy error",
  },
  es: {
    titulo: "🏛️ IA Tributaria", subtitulo: "Su Consultor Fiscal Digital — simulación, ahorro y cumplimiento",
    carregando: "Cargando inteligencia fiscal...",
    abaScore: "🛡️ Score Fiscal", abaChat: "💬 Chat Fiscal", abaSimulador: "🏛️ Simulador de Régimen",
    abaCarga: "📊 Carga Tributaria", abaEconomia: "💰 Ahorro", abaReforma: "🔔 Reforma 2026",
    abaDiagnostico: "📋 Diagnóstico", abaCalendario: "📅 Calendario",
    scoreFiscal: "Score Fiscal", scoreFiscalDesc: "Adecuación fiscal y cumplimiento de su empresa.",
    chatTitulo: "💬 Chat con su Consultor Fiscal Digital", chatPlaceholder: "Pregunte sobre impuestos, régimen, DAS...",
    chatAnalisando: "Consultando legislación...", chatLimpar: "🗑️ Limpiar",
    chatLimparConfirm: "¿Limpiar todo el historial?",
    chatErroLimpar: "No se pudo limpiar el historial en el servidor — puede reaparecer al recargar. Intente de nuevo.",
    chatSugestoes: ["¿Cuál es el mejor régimen?", "¿Cuánto pago de impuesto?", "¿Qué cambia con la reforma?", "¿Cómo calcular el DAS?"],
    simuladorTitulo: "🏛️ Comparativo de Regímenes", simuladorDesc: "Simulación con sus datos reales. El más barato aparece primero.",
    regimeAtual: "Actual", recomendado: "MÁS BARATO", inelegivel: "No elegible", porMes: "/mes", porAno: "/año",
    aliquotaEfetiva: "Alíc. efectiva", economiaPorAno: "Ahorro/año vs actual",
    cargaTitulo: "📊 Su Carga Tributaria Real", cargaDesc: "Cuánto paga de impuestos sobre la facturación.",
    cargaSobreReceita: "de los ingresos en impuestos", composicao: "Composición",
    economiaTitulo: "💰 Ahorro Tributario Potencial", economiaDesc: "Cuánto puede ahorrar su empresa con optimización fiscal.",
    economiaMensal: "Ahorro mensual", economiaAnual: "Ahorro anual", regimeIdeal: "Régimen ideal",
    acoesEconomia: "Acciones de ahorro",
    reformaTitulo: "🔔 Reforma Tributaria 2026-2033", reformaDesc: "Timeline e impactos de la transición IBS/CBS en su negocio.",
    positivo: "Positivo", neutro: "Neutro", negativo: "Atención",
    diagnosticoTitulo: "📋 Diagnóstico Fiscal Completo", diagnosticoDesc: "IA analiza todos sus datos y genera opinión tributaria.",
    calendarioTitulo: "📅 Calendario Fiscal", calendarioDesc: "Vea y gestione obligaciones en Empresa → Cumplimiento & Fiscal.",
    irParaEmpresa: "Ir a Empresa → Cumplimiento",
    compartilhar: "📤 Compartir", centroCompart: "Centro de Compartir", compartilharVia: "Compartir vía",
    fechar: "Cerrar", copiar: "Copiar", pdfRelatorio: "PDF Informe", gerando: "Generando...",
    copiado: "¡Copiado!", erroCopiar: "Error al copiar",
  },
};

// Paleta por tema — "dark" é o padrão de sempre (inalterado). "xms" (Tema
// Claro) segue os valores exatos de public/referencias/tema-tokens.md.
const PALETA = {
  dark: { VERDE: "#34d399", VERMELHO: "#f87171", AMARELO: "#fbbf24", AZULC: "#6ab0ff", ROXO: "#a78bfa", CINZA: "#5a7a9a", TEXTO: "#c8d8f0", CAMPO_BG: "rgba(2,8,16,0.6)", TOOLTIP_BG: "rgba(2,8,16,0.97)" },
  xms: { VERDE: "#16a97d", VERMELHO: "#ff5a6b", AMARELO: "#f5a623", AZULC: "#2ecc9b", ROXO: "#101b3d", CINZA: "#374151", TEXTO: "#101b3d", CAMPO_BG: "#ffffff", TOOLTIP_BG: "#ffffff" },
} as const;
function formatBRL(n: number) { return `R$ ${(n || 0).toLocaleString("pt-BR")}`; }
// Versão com centavos exatos — usar em cópia/compartilhamento/PDF (nunca arredondar valor monetário fora da tela).
function formatBRL2(n: number) { return `R$ ${(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// Não existe campo de atividade fiscal nem de alíquota de ISS municipal no
// cadastro da empresa hoje — enquanto isso não vira campo real (migração
// separada), a escolha fica aqui, manual, sempre visível quando afeta o
// número de Lucro Presumido. Nunca assume Serviços/32% ou ISS 5% em
// silêncio: sem escolha, mostra o aviso explícito.
function ControleAtividadeFiscal({ lang, atividadeFiscal, setAtividadeFiscal, issMunicipalPct, setIssMunicipalPct }: {
  lang: "pt" | "en" | "es";
  atividadeFiscal: AtividadeFiscal | "";
  setAtividadeFiscal: (v: AtividadeFiscal | "") => void;
  issMunicipalPct: string;
  setIssMunicipalPct: (v: string) => void;
}) {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const { VERDE, AMARELO, CINZA, TEXTO, CAMPO_BG } = PALETA[tema];
  const campoBorda = temaClaro ? "1px solid rgba(16,27,61,0.18)" : "1px solid rgba(106,176,255,0.2)";
  return (
    <CanvasBox cor={atividadeFiscal ? VERDE : AMARELO} fundo={temaClaro ? "#f6f7c4" : undefined} premium3d={temaClaro}>
      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: CINZA }}>
        {L("Atividade fiscal (Lucro Presumido)", "Tax activity (Presumed Profit)", "Actividad fiscal (Lucro Presumido)")}
      </p>
      {!atividadeFiscal && (
        <p className="text-xs mb-2" style={{ color: AMARELO }}>
          ⚠️ {L("Presumindo Serviços (32%) e ISS 5% — confirme a atividade da empresa abaixo pro número ficar exato.",
            "Assuming Services (32%) and 5% ISS — confirm the company's activity below for an exact number.",
            "Presumiendo Servicios (32%) e ISS 5% — confirme la actividad de la empresa abajo para un número exacto.")}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <select value={atividadeFiscal} onChange={(e) => setAtividadeFiscal(e.target.value as AtividadeFiscal | "")}
          className="px-3 py-2 rounded-lg text-xs" style={{ background: CAMPO_BG, border: campoBorda, color: TEXTO }}>
          <option value="">{L("Não confirmada (assume Serviços)", "Not confirmed (assumes Services)", "No confirmada (asume Servicios)")}</option>
          <option value="servicos">{L("Serviços — presunção 32%", "Services — 32% presumption", "Servicios — presunción 32%")}</option>
          <option value="comercio_industria">{L("Comércio/Indústria — presunção 8%", "Trade/Industry — 8% presumption", "Comercio/Industria — presunción 8%")}</option>
          <option value="revenda_combustivel">{L("Revenda de combustível — presunção 1,6%", "Fuel resale — 1.6% presumption", "Reventa de combustible — presunción 1,6%")}</option>
        </select>
        {atividadeFiscal === "servicos" && (
          <input type="number" min={2} max={5} step={0.5} value={issMunicipalPct} onChange={(e) => setIssMunicipalPct(e.target.value)}
            placeholder={L("ISS do município (2 a 5%, padrão 5%)", "Municipal ISS (2 to 5%, default 5%)", "ISS del municipio (2 a 5%, por defecto 5%)")}
            className="px-3 py-2 rounded-lg text-xs w-56" style={{ background: CAMPO_BG, border: campoBorda, color: TEXTO }} />
        )}
      </div>
    </CanvasBox>
  );
}

export default function IATributariaPage() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];
  const chatRef = useRef<HTMLDivElement>(null);
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const classePremium3d = temaClaro ? " axi-card-premium3d" : "";
  const { VERDE, VERMELHO, AMARELO, AZULC, ROXO, CINZA, TEXTO, CAMPO_BG, TOOLTIP_BG } = PALETA[tema];
  const campoBorda = temaClaro ? "1px solid rgba(16,27,61,0.18)" : "1px solid rgba(106,176,255,0.2)";
  const tooltipStyle = { background: TOOLTIP_BG, border: `1px solid ${temaClaro ? "rgba(16,27,61,0.18)" : "rgba(106,176,255,0.3)"}`, borderRadius: "12px", color: TEXTO, fontSize: "12px" };
  // Card creme + efeito premium3d (borda verde-menta no hover), igual ao
  // Painel MEI/Receitas — spread em todo <CanvasBox> de nível de seção.
  const cartaoTema = temaClaro ? { fundo: "#f6f7c4", premium3d: true } : {};

  const [userId, setUserId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [aba, setAba] = useState<"score" | "chat" | "simulador" | "carga" | "economia" | "reforma" | "diagnostico" | "calendario">("score");

  const [dados, setDados] = useState<DadosFiscais | null>(null);
  const [scoreFiscal, setScoreFiscal] = useState<ScoreFiscal | null>(null);
  const [simulacoes, setSimulacoes] = useState<SimulacaoRegime[]>([]);
  const [carga, setCarga] = useState<any>(null);
  const [economia, setEconomia] = useState<any>(null);
  const [alertasReforma, setAlertasReforma] = useState<AlertaReforma[]>([]);
  const [diagnostico, setDiagnostico] = useState("");

  const [mensagens, setMensagens] = useState<{ role: string; texto: string }[]>([]);
  const [inputChat, setInputChat] = useState("");
  const [chatCarregando, setChatCarregando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);

  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") { setToast({ msg, tipo }); setTimeout(() => setToast(null), 3000); }

  // Atividade fiscal e ISS municipal: não existe campo no cadastro da
  // empresa hoje (confirmado — precisaria de migração, fora do escopo desta
  // correção). Enquanto isso não existe, ficam como escolha manual nesta
  // tela, nunca um valor chutado sem avisar — vazio = "não confirmada",
  // e o simulador/carga real usam o default documentado (Serviços 32%,
  // ISS 5%) mostrando aviso explícito na tela.
  const [atividadeFiscal, setAtividadeFiscal] = useState<AtividadeFiscal | "">("");
  const [issMunicipalPct, setIssMunicipalPct] = useState("");

  useEffect(() => { inicializar(); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [mensagens, chatCarregando]);

  // Recalcula score/simulação/carga/diagnóstico sempre que os dados fiscais
  // OU a atividade/ISS escolhidos mudarem — sem precisar recarregar do
  // banco. Separado do carregamento de histórico do chat (que só roda uma
  // vez, não deve reiniciar toda vez que o dono troca a atividade no
  // dropdown).
  useEffect(() => {
    if (!dados) return;
    const atividade = atividadeFiscal || undefined;
    const issPct = issMunicipalPct ? Number(issMunicipalPct) : undefined;
    const sf = calcularScoreFiscal(dados);
    const sims = simularRegimes(dados, atividade, issPct);
    const c = calcularCargaTributaria(dados, atividade, issPct);
    const eco = calcularEconomiaTributaria(dados);
    const diag = gerarDiagnosticoFiscal(dados, sf, c, eco, lang);
    setScoreFiscal(sf); setSimulacoes(sims); setCarga(c); setEconomia(eco); setDiagnostico(diag);
  }, [dados, atividadeFiscal, issMunicipalPct, lang]);

  async function inicializar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setUserId(user.id);
    await carregarTudo(user.id);
  }

  async function carregarTudo(uid: string) {
    setCarregando(true);
    try {
      const empId = await obterEmpresaAtiva();
      setEmpresaId(empId);
      const d = await carregarDadosFiscais(uid, empId);
      const alertas = gerarAlertasReforma();
      const sf = calcularScoreFiscal(d);

      setDados(d); setAlertasReforma(alertas);

      const hist = await carregarHistoricoTrib(uid);
      if (hist.length > 0) {
        setMensagens(hist.map(h => ({ role: h.role, texto: h.mensagem })));
      } else {
        const msg = lang === "en" ? `Hello! I'm your Tax Consultant. Your Tax Score is ${sf.score}/100. Ask me anything.`
          : lang === "es" ? `¡Hola! Soy su Consultor Fiscal. Su Score Fiscal es ${sf.score}/100. Pregunte lo que quiera.`
          : `Olá! Sou seu Consultor Fiscal Digital. Seu Score Fiscal é ${sf.score}/100. Pergunte o que quiser.`;
        setMensagens([{ role: "assistant", texto: msg }]);
      }
    } catch (err) { showToast(tratarFalhaCarregamento("ia-tributaria.carregarTudo", err, lang), "erro"); }
    setCarregando(false);
  }

  async function enviarMensagem(texto: string) {
    if (!texto.trim() || chatCarregando || !dados || !scoreFiscal || !userId) return;
    const novas = [...mensagens, { role: "user", texto }];
    setMensagens(novas); setInputChat(""); setChatCarregando(true);
    await salvarMensagemTrib(userId, empresaId, "user", texto);

    let resposta = "", modelo = "regras";
    try {
      const res = await fetch("/api/ia-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        // A rota espera {mensagem, historico, contexto} — antes mandava {prompt, mensagens} e
        // nunca acertava o contrato real, então sempre caía no fallback de regras.
        body: JSON.stringify({ mensagem: montarPromptTributario(dados, scoreFiscal, carga, texto, lang), historico: novas.slice(-10).map(m => ({ role: m.role, content: m.texto })) }),
      });
      if (res.ok) { const data = await res.json(); resposta = data.resposta || ""; modelo = "claude"; }
    } catch {}
    if (!resposta) resposta = respostaTributariaPorRegras(dados, scoreFiscal, carga, texto, lang);

    setMensagens([...novas, { role: "assistant", texto: resposta }]);
    await salvarMensagemTrib(userId, empresaId, "assistant", resposta, { score: scoreFiscal.score }, modelo);
    setChatCarregando(false);
  }

  async function onLimpar() {
    if (!userId || !window.confirm(tt.chatLimparConfirm)) return;
    const { erro } = await limparHistoricoTrib(userId);
    if (erro) showToast(tt.chatErroLimpar, "erro");
    setMensagens([{ role: "assistant", texto: lang === "en" ? "History cleared." : lang === "es" ? "Historial limpio." : "Histórico limpo." }]);
  }

  // Share
  function montarTextoShare(): string {
    if (!dados || !scoreFiscal) return "Axioma AI.Tech";
    return [`🦅 *AXIOMA AI.TECH — IA Tributária*`, ``, `🛡️ *Score Fiscal:* ${scoreFiscal.score}/100`,
      `📊 Carga: ${carga?.carga_pct.toFixed(1)}%`, `💰 ${lang === "en" ? "Revenue" : "Receita"}: ${formatBRL2(dados.receita_bruta_mensal)}${tt.porMes}`,
      `🏛️ ${lang === "en" ? "Regime" : "Regime"}: ${dados.regime_atual || "—"}`,
      economia?.economia_mensal > 0 ? `💰 ${tt.economiaMensal}: ${formatBRL2(economia.economia_mensal)}` : "",
      ``, `_axiomaai.com.br_`].filter(Boolean).join("\n");
  }
  function montarTextoDetalhado(): string {
    return [`AXIOMA AI.TECH — IA Tributária (detalhado)`, ...simulacoes.filter(s => s.elegivel).map(s =>
      `${s.regime_label} | ${lang === "en" ? "Tax/mo" : "Imposto/mês"} ${formatBRL2(s.imposto_mensal)} | ${s.aliquota_efetiva}% | ${lang === "en" ? "Savings/yr" : "Economia/ano"} ${formatBRL2(s.economia_vs_atual)}`
    )].join("\n");
  }

  async function exportarPDF() {
    if (!dados || !scoreFiscal) return;
    setExportando(true);
    try {
      await gerarPdfTabela({
        titulo: `${tt.titulo} — Score ${scoreFiscal.score}/100`, subtitulo: `${dados.regime_atual || "—"}`,
        colunas: [
          { header: lang === "en" ? "REGIME" : "REGIME", key: "reg", width: 40, align: "left" as const },
          { header: lang === "en" ? "TAX/MO" : "IMPOSTO/MÊS", key: "imp", width: 30, align: "right" as const },
          { header: lang === "en" ? "EFF.RATE" : "ALÍQ.EFET.", key: "aliq", width: 25, align: "right" as const },
          { header: lang === "en" ? "SAVINGS/YR" : "ECONOMIA/ANO", key: "eco", width: 30, align: "right" as const },
        ],
        linhas: simulacoes.filter(s => s.elegivel).map(s => ({ reg: s.regime_label, imp: formatBRL2(s.imposto_mensal), aliq: `${s.aliquota_efetiva}%`, eco: formatBRL2(s.economia_vs_atual) })),
        resumo: [
          { label: "Score Fiscal", valor: `${scoreFiscal.score}/100 (${lang === "en" ? scoreFiscal.nivel_en : scoreFiscal.nivel})` },
          { label: lang === "en" ? "Tax Burden" : "Carga Tributária", valor: `${carga?.carga_pct.toFixed(1)}%` },
        ],
        nomeArquivo: `axioma-ia-tributaria.pdf`,
      }, (msg) => showToast(msg, "erro"), lang);
    } catch (err) { showToast(tratarFalhaExportacao("ia-tributaria.exportarPDF", err, lang), "erro"); }
    setExportando(false);
  }

  const sfLabel = (it: any) => lang === "en" ? it.label_en : lang === "es" ? it.label_es : it.label;
  const reformaTit = (a: AlertaReforma) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;
  const reformaDesc = (a: AlertaReforma) => lang === "en" ? a.descricao_en : lang === "es" ? a.descricao_es : a.descricao;
  const ecoTit = (a: any) => lang === "en" ? a.titulo_en : lang === "es" ? a.titulo_es : a.titulo;

  const CORES_PIE = [AZULC, VERDE, AMARELO, ROXO, VERMELHO];

  return (
    <div data-theme={tema}>
    <ModuloLayout titulo={tt.titulo} subtitulo={tt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}
      headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined}
      corExportar={temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : undefined}
      botaoExtra={<ThemeToggle />}>
      {toast && (<div className="fixed top-28 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm" style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : temaClaro ? "rgba(46,204,155,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>{toast.msg}</div>)}

      {carregando && (<CanvasBox cor={ROXO} {...cartaoTema}><div className="py-12 text-center"><div className="w-10 h-10 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm" style={{ color: ROXO }}>{tt.carregando}</p></div></CanvasBox>)}

      {!carregando && dados && scoreFiscal && (
        <div className="space-y-4">
          {/* HEADER */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <CanvasBox cor={scoreFiscal.cor} {...cartaoTema}>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: CINZA }}>🛡️ {tt.scoreFiscal}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black" style={{ color: scoreFiscal.cor }}><AnimatedNumber value={String(scoreFiscal.score)} /></span>
                <span style={{ color: CINZA }}>/100</span>
              </div>
              <p className="text-xs font-bold" style={{ color: scoreFiscal.cor }}>{lang === "en" ? scoreFiscal.nivel_en : lang === "es" ? scoreFiscal.nivel_es : scoreFiscal.nivel}</p>
            </CanvasBox>
            {[
              { label: lang === "en" ? "Tax Burden" : "Carga", valor: `${carga?.carga_pct.toFixed(1)}%`, cor: carga?.carga_pct > 15 ? AMARELO : VERDE },
              { label: lang === "en" ? "Tax/Month" : "Imposto/Mês", valor: formatBRL(carga?.imposto_mensal || 0), cor: VERMELHO },
              { label: lang === "en" ? "Savings" : "Economia", valor: economia?.economia_mensal > 0 ? formatBRL(economia.economia_mensal) + tt.porMes : "—", cor: VERDE },
            ].map((c, i) => (
              <CanvasBox key={i} cor={c.cor}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: CINZA }}>{c.label}</p>
                <p className="text-xl font-black mt-1" style={{ color: c.cor }}><AnimatedNumber value={c.valor} /></p>
              </CanvasBox>
            ))}
          </div>

          {/* Regime atual + editar */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs" style={{ color: CINZA }}>
              {lang === "en" ? "Current regime" : lang === "es" ? "Régimen actual" : "Regime atual"}: <strong style={{ color: AZULC }}>{dados.regime_atual || (lang === "en" ? "Not defined" : lang === "es" ? "No definido" : "Não definido")}</strong>
            </span>
            <a href="/empresa" className="text-xs px-2 py-1 rounded-lg" style={{ background: temaClaro ? "rgba(46,204,155,0.1)" : "rgba(106,176,255,0.1)", color: AZULC }}>
              ✏️ {lang === "en" ? "Edit in Company" : lang === "es" ? "Editar en Empresa" : "Editar na Empresa"}
            </a>
          </div>

          <button onClick={() => setShareAberto(true)} className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>{tt.compartilhar}</button>

          {/* ABAS */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "score", label: tt.abaScore }, { key: "chat", label: tt.abaChat },
              { key: "simulador", label: tt.abaSimulador }, { key: "carga", label: tt.abaCarga },
              { key: "economia", label: tt.abaEconomia }, { key: "reforma", label: tt.abaReforma },
              { key: "diagnostico", label: tt.abaDiagnostico }, { key: "calendario", label: tt.abaCalendario },
            ].map((a) => (
              <button key={a.key} onClick={() => setAba(a.key as any)}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
                style={{ background: aba === a.key ? (temaClaro ? "#16a97d" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)") : (temaClaro ? "#101b3d" : "rgba(10,22,40,0.6)"), color: aba === a.key ? "#fff" : (temaClaro ? "#ffffff" : AZULC), border: temaClaro ? "none" : (aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)") }}>{a.label}</button>
            ))}
          </div>

          {/* SCORE FISCAL */}
          {aba === "score" && (
            <CanvasBox cor={scoreFiscal.cor} {...cartaoTema}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.scoreFiscal}</p>
              <p className="text-xs mb-4" style={{ color: TEXTO }}>{tt.scoreFiscalDesc}</p>
              <div className="space-y-1">
                {scoreFiscal.itens.map((it, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: it.ok ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)" }}>
                    <span className="text-xs flex items-center gap-2">
                      {it.ok ? <span style={{ color: VERDE }}>✓</span> : <span style={{ color: VERMELHO }}>✗</span>}
                      <span style={{ color: TEXTO }}>{sfLabel(it)}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: it.ok ? VERDE : CINZA }}>+{it.pontos}pts</span>
                      {!it.ok && (
                        <a href="/empresa" className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: temaClaro ? "rgba(46,204,155,0.1)" : "rgba(106,176,255,0.1)", color: AZULC }}>
                          ✏️
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CanvasBox>
          )}

          {/* CHAT */}
          {aba === "chat" && (
            <CanvasBox cor={AZULC} {...cartaoTema}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold" style={{ color: TEXTO }}>{tt.chatTitulo}</p>
                <button onClick={onLimpar} className="text-[10px] px-2 py-1 rounded" style={{ background: "rgba(248,113,113,0.15)", color: VERMELHO }}>{tt.chatLimpar}</button>
              </div>
              <div ref={chatRef} className="space-y-3 min-h-48 max-h-96 overflow-y-auto mb-4 pr-1">
                {mensagens.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap"
                      style={{ background: m.role === "user" ? (temaClaro ? "rgba(46,204,155,0.15)" : "rgba(106,176,255,0.15)") : (temaClaro ? "rgba(255,255,255,0.6)" : "rgba(10,22,40,0.8)"), border: `1px solid ${m.role === "user" ? (temaClaro ? "rgba(46,204,155,0.3)" : "rgba(106,176,255,0.3)") : (temaClaro ? "rgba(16,27,61,0.12)" : "rgba(106,176,255,0.1)")}`, color: TEXTO }}>{m.texto}</div>
                  </div>
                ))}
                {chatCarregando && (<div className="flex justify-start"><div className="px-4 py-3 rounded-2xl text-sm" style={{ background: temaClaro ? "rgba(255,255,255,0.6)" : "rgba(10,22,40,0.8)", color: CINZA }}>{tt.chatAnalisando} <span className="animate-pulse">●●●</span></div></div>)}
              </div>
              <div className="flex gap-2 mb-3 flex-wrap">
                {tt.chatSugestoes.map((s, i) => (<button key={i} onClick={() => enviarMensagem(s)} className="text-[11px] px-3 py-1.5 rounded-lg" style={{ background: temaClaro ? "rgba(46,204,155,0.08)" : "rgba(106,176,255,0.08)", border: temaClaro ? "1px solid rgba(46,204,155,0.2)" : "1px solid rgba(106,176,255,0.2)", color: AZULC }}>{s}</button>))}
              </div>
              <div className="flex gap-2">
                <input value={inputChat} onChange={(e) => setInputChat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && enviarMensagem(inputChat)}
                  placeholder={tt.chatPlaceholder} className="flex-1 px-4 py-3 rounded-xl text-sm" style={{ background: CAMPO_BG, border: campoBorda, color: TEXTO }} />
                <button onClick={() => enviarMensagem(inputChat)} disabled={chatCarregando || !inputChat.trim()}
                  className="px-4 py-3 rounded-xl font-semibold disabled:opacity-50" style={{ background: temaClaro ? "linear-gradient(135deg, #16a97d, #2ecc9b)" : "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>➤</button>
              </div>
            </CanvasBox>
          )}

          {/* SIMULADOR DE REGIME */}
          {aba === "simulador" && (
            <div className="space-y-3">
              <CanvasBox cor={ROXO} {...cartaoTema}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.simuladorTitulo}</p>
                <p className="text-xs" style={{ color: TEXTO }}>{tt.simuladorDesc}</p>
              </CanvasBox>
              <ControleAtividadeFiscal
                lang={lang} atividadeFiscal={atividadeFiscal} setAtividadeFiscal={setAtividadeFiscal}
                issMunicipalPct={issMunicipalPct} setIssMunicipalPct={setIssMunicipalPct}
              />
              {simulacoes.map((s, i) => {
                const isAtual = s.regime === (dados.regime_atual || "").toLowerCase();
                const cor = i === 0 && s.elegivel ? VERDE : s.elegivel ? AZULC : CINZA;
                return (
                  <CanvasBox key={i} cor={cor}>
                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <p className="text-sm font-bold" style={{ color: TEXTO }}>{s.regime_label}</p>
                        <div className="flex gap-2 mt-1">
                          {isAtual && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: temaClaro ? "rgba(46,204,155,0.15)" : "rgba(106,176,255,0.15)", color: AZULC }}>{tt.regimeAtual}</span>}
                          {i === 0 && s.elegivel && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(52,211,153,0.15)", color: VERDE }}>{tt.recomendado}</span>}
                          {!s.elegivel && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.15)", color: VERMELHO }}>{tt.inelegivel}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black" style={{ color: cor }}>{formatBRL(s.imposto_mensal)}<span className="text-xs font-normal" style={{ color: CINZA }}>{tt.porMes}</span></p>
                        <p className="text-xs" style={{ color: CINZA }}>{tt.aliquotaEfetiva}: {s.aliquota_efetiva}%</p>
                      </div>
                    </div>
                    <p className="text-[11px] mb-1" style={{ color: temaClaro ? "#374151" : "#a8b8d0" }}>{lang === "en" ? s.detalhamento_en : lang === "es" ? s.detalhamento_es : s.detalhamento}</p>
                    {s.economia_vs_atual > 0 && !isAtual && s.elegivel && (
                      <p className="text-xs font-bold mt-1" style={{ color: VERDE }}>💰 {tt.economiaPorAno}: {formatBRL(s.economia_vs_atual)}</p>
                    )}
                    {s.motivo_inelegivel && <p className="text-[10px] mt-1" style={{ color: VERMELHO }}>⚠️ {s.motivo_inelegivel}</p>}
                  </CanvasBox>
                );
              })}
            </div>
          )}

          {/* CARGA TRIBUTÁRIA */}
          {aba === "carga" && carga && (
            <div className="space-y-4">
              <ControleAtividadeFiscal
                lang={lang} atividadeFiscal={atividadeFiscal} setAtividadeFiscal={setAtividadeFiscal}
                issMunicipalPct={issMunicipalPct} setIssMunicipalPct={setIssMunicipalPct}
              />
              <CanvasBox cor={carga.carga_pct > 15 ? AMARELO : VERDE} {...cartaoTema}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.cargaTitulo}</p>
                <p className="text-xs mb-4" style={{ color: TEXTO }}>{tt.cargaDesc}</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black" style={{ color: carga.carga_pct > 15 ? AMARELO : VERDE }}><AnimatedNumber value={`${carga.carga_pct.toFixed(1)}%`} /></span>
                  <span className="text-sm" style={{ color: CINZA }}>{tt.cargaSobreReceita}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{ background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <p className="text-[10px] uppercase" style={{ color: CINZA }}>{tt.porMes}</p>
                    <p className="text-lg font-bold" style={{ color: VERMELHO }}>{formatBRL(carga.imposto_mensal)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: "1px solid rgba(248,113,113,0.2)" }}>
                    <p className="text-[10px] uppercase" style={{ color: CINZA }}>{tt.porAno}</p>
                    <p className="text-lg font-bold" style={{ color: VERMELHO }}>{formatBRL(carga.imposto_anual)}</p>
                  </div>
                </div>
              </CanvasBox>
              {carga.composicao.length > 1 && (
                <CanvasBox cor={ROXO} {...cartaoTema}>
                  <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: CINZA }}>{tt.composicao}</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={carga.composicao} cx="50%" cy="50%" outerRadius={80} dataKey="valor" label={(e: any) => `${e.nome}: ${e.pct.toFixed(1)}%`} labelLine={false}>
                        {carga.composicao.map((_: any, i: number) => <Cell key={i} fill={CORES_PIE[i % CORES_PIE.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => formatBRL(Number(v) || 0)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CanvasBox>
              )}
            </div>
          )}

          {/* ECONOMIA */}
          {aba === "economia" && economia && (
            <div className="space-y-4">
              <CanvasBox cor={VERDE} {...cartaoTema}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.economiaTitulo}</p>
                <p className="text-xs mb-4" style={{ color: TEXTO }}>{tt.economiaDesc}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
                    <p className="text-[10px] uppercase" style={{ color: CINZA }}>{tt.economiaMensal}</p>
                    <p className="text-2xl font-black" style={{ color: VERDE }}><AnimatedNumber value={formatBRL(economia.economia_mensal)} /></p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)" }}>
                    <p className="text-[10px] uppercase" style={{ color: CINZA }}>{tt.economiaAnual}</p>
                    <p className="text-2xl font-black" style={{ color: VERDE }}><AnimatedNumber value={formatBRL(economia.economia_anual)} /></p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ background: temaClaro ? "rgba(46,204,155,0.1)" : "rgba(106,176,255,0.1)", border: temaClaro ? "1px solid rgba(46,204,155,0.3)" : "1px solid rgba(106,176,255,0.3)" }}>
                    <p className="text-[10px] uppercase" style={{ color: CINZA }}>{tt.regimeIdeal}</p>
                    <p className="text-lg font-bold" style={{ color: AZULC }}>{economia.regime_ideal}</p>
                  </div>
                </div>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: CINZA }}>{tt.acoesEconomia}</p>
                <div className="space-y-2">
                  {economia.acoes.map((a: any, i: number) => (
                    <div key={i} className="rounded-lg p-3 flex items-center justify-between" style={{ background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <p className="text-xs" style={{ color: TEXTO }}>{ecoTit(a)}</p>
                      <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: VERDE }}>{a.economia}</span>
                    </div>
                  ))}
                </div>
              </CanvasBox>
            </div>
          )}

          {/* REFORMA */}
          {aba === "reforma" && (
            <div className="space-y-3">
              <CanvasBox cor={AMARELO} {...cartaoTema}>
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.reformaTitulo}</p>
                <p className="text-xs" style={{ color: TEXTO }}>{tt.reformaDesc}</p>
              </CanvasBox>
              {alertasReforma.map((a, i) => {
                const cor = a.impacto === "positivo" ? VERDE : a.impacto === "negativo" ? VERMELHO : AMARELO;
                const icon = a.impacto === "positivo" ? "✅" : a.impacto === "negativo" ? "⚠️" : "ℹ️";
                const label = a.impacto === "positivo" ? tt.positivo : a.impacto === "negativo" ? tt.negativo : tt.neutro;
                return (
                  <CanvasBox key={i} cor={cor}>
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-bold" style={{ color: TEXTO }}>{reformaTit(a)}</p>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: `${cor}15`, color: cor }}>{label} • {a.data}</span>
                        </div>
                        <p className="text-xs" style={{ color: temaClaro ? "#374151" : "#a8b8d0" }}>{reformaDesc(a)}</p>
                      </div>
                    </div>
                  </CanvasBox>
                );
              })}
            </div>
          )}

          {/* DIAGNÓSTICO */}
          {aba === "diagnostico" && (
            <CanvasBox cor={AZULC} {...cartaoTema}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.diagnosticoTitulo}</p>
              <p className="text-xs mb-3" style={{ color: CINZA }}>{tt.diagnosticoDesc}</p>
              <div className="rounded-xl p-4 whitespace-pre-wrap text-sm leading-relaxed"
                style={{ background: temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)", border: temaClaro ? "1px solid rgba(46,204,155,0.15)" : "1px solid rgba(106,176,255,0.15)", color: TEXTO }}>{diagnostico}</div>
            </CanvasBox>
          )}

          {/* CALENDÁRIO */}
          {aba === "calendario" && (
            <CanvasBox cor={AMARELO} {...cartaoTema}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: CINZA }}>{tt.calendarioTitulo}</p>
              <p className="text-xs mb-4" style={{ color: TEXTO }}>{tt.calendarioDesc}</p>
              <a href="/empresa" className="inline-block px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #b45309, #f5a623)", color: "#fff" }}>{tt.irParaEmpresa}</a>
            </CanvasBox>
          )}
        </div>
      )}

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={montarTextoShare()}
        textoDetalhado={montarTextoDetalhado()}
        assunto={`${tt.titulo} — Axioma`}
        onExportarPDF={exportarPDF}
        cor={AZULC}
      />
    </ModuloLayout>
    </div>
  );
}