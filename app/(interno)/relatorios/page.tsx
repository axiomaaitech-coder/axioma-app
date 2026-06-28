"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line } from "recharts";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  montarPeriodo,
  carregarDRE,
  carregarEvolucao12Meses,
  carregarDistribuicaoCustos,
  carregarKPIs,
  calcularScoreCFO,
  gerarInsights,
  nomeMesPt,
  type Periodo,
  type DRE,
  type PontoEvolucao,
  type CategoriaCusto,
  type KPI,
  type Insight,
} from "../../../lib/relatoriosHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// I18N - termos novos (o restante vem de t.relatorios)
// ============================================================================
const T = {
  pt: {
    abaExecutivo: "Dashboard Executivo",
    abaDre: "DRE Gerencial",
    abaEvolucao: "Evolução 12 Meses",
    abaDistribuicao: "Distribuição de Custos",
    abaKpis: "KPIs & Score CFO",
    periodo: "Período",
    mes: "Mês",
    ano: "Ano",
    scoreCFO: "Score CFO",
    nivelExcelente: "Excelente",
    nivelBom: "Bom",
    nivelRegular: "Regular",
    nivelAtencao: "Atenção",
    nivelCritico: "Crítico",
    insightsAutomaticos: "Insights Automáticos",
    semDadosPeriodo: "Sem lançamentos neste período. Cadastre receitas e custos primeiro.",
    receitaBruta: "Receita Bruta",
    receitaLiquida: "Receita Líquida",
    deducoes: "Deduções (Impostos)",
    custosVar: "Custos Variáveis",
    margemContrib: "Margem de Contribuição",
    custosFix: "Custos Fixos",
    lucroOp: "Lucro Operacional (EBITDA)",
    despesasFin: "Despesas Financeiras",
    lucroLiquido: "Lucro Líquido",
    pctReceita: "% Receita",
    receita: "Receita",
    custos: "Custos",
    lucro: "Lucro",
    margem: "Margem",
    benchmark: "Benchmark Brasil",
    metaProp: "Meta",
    acimaMeta: "Acima da meta",
    abaixoMeta: "Abaixo da meta",
    compartilhar: "Compartilhar",
    compartilharVia: "Compartilhar via",
    fechar: "Fechar",
    centroCompart: "Centro de Compartilhamento",
    miniResumo: "Resumo Executivo",
    rentabilidade: "Rentabilidade",
    liquidez: "Liquidez",
    endividamento: "Endividamento",
    operacional: "Operacional",
    crescimento: "Crescimento",
  },
  en: {
    abaExecutivo: "Executive Dashboard",
    abaDre: "Income Statement",
    abaEvolucao: "12-Month Evolution",
    abaDistribuicao: "Cost Distribution",
    abaKpis: "KPIs & CFO Score",
    periodo: "Period",
    mes: "Month",
    ano: "Year",
    scoreCFO: "CFO Score",
    nivelExcelente: "Excellent",
    nivelBom: "Good",
    nivelRegular: "Regular",
    nivelAtencao: "Attention",
    nivelCritico: "Critical",
    insightsAutomaticos: "Automatic Insights",
    semDadosPeriodo: "No entries in this period. Add revenues and costs first.",
    receitaBruta: "Gross Revenue",
    receitaLiquida: "Net Revenue",
    deducoes: "Deductions (Taxes)",
    custosVar: "Variable Costs",
    margemContrib: "Contribution Margin",
    custosFix: "Fixed Costs",
    lucroOp: "Operating Profit (EBITDA)",
    despesasFin: "Financial Expenses",
    lucroLiquido: "Net Profit",
    pctReceita: "% Revenue",
    receita: "Revenue",
    custos: "Costs",
    lucro: "Profit",
    margem: "Margin",
    benchmark: "Brazil Benchmark",
    metaProp: "Target",
    acimaMeta: "Above target",
    abaixoMeta: "Below target",
    compartilhar: "Share",
    compartilharVia: "Share via",
    fechar: "Close",
    centroCompart: "Sharing Center",
    miniResumo: "Executive Summary",
    rentabilidade: "Profitability",
    liquidez: "Liquidity",
    endividamento: "Debt",
    operacional: "Operational",
    crescimento: "Growth",
  },
  es: {
    abaExecutivo: "Dashboard Ejecutivo",
    abaDre: "Estado de Resultados",
    abaEvolucao: "Evolución 12 Meses",
    abaDistribuicao: "Distribución de Costos",
    abaKpis: "KPIs & Score CFO",
    periodo: "Período",
    mes: "Mes",
    ano: "Año",
    scoreCFO: "Score CFO",
    nivelExcelente: "Excelente",
    nivelBom: "Bueno",
    nivelRegular: "Regular",
    nivelAtencao: "Atención",
    nivelCritico: "Crítico",
    insightsAutomaticos: "Insights Automáticos",
    semDadosPeriodo: "Sin movimientos en este período. Registra ingresos y costos primero.",
    receitaBruta: "Ingreso Bruto",
    receitaLiquida: "Ingreso Neto",
    deducoes: "Deducciones (Impuestos)",
    custosVar: "Costos Variables",
    margemContrib: "Margen de Contribución",
    custosFix: "Costos Fijos",
    lucroOp: "Beneficio Operativo (EBITDA)",
    despesasFin: "Gastos Financieros",
    lucroLiquido: "Beneficio Neto",
    pctReceita: "% Ingreso",
    receita: "Ingresos",
    custos: "Costos",
    lucro: "Beneficio",
    margem: "Margen",
    benchmark: "Benchmark Brasil",
    metaProp: "Meta",
    acimaMeta: "Sobre la meta",
    abaixoMeta: "Bajo la meta",
    compartilhar: "Compartir",
    compartilharVia: "Compartir vía",
    fechar: "Cerrar",
    centroCompart: "Centro de Compartir",
    miniResumo: "Resumen Ejecutivo",
    rentabilidade: "Rentabilidad",
    liquidez: "Liquidez",
    endividamento: "Endeudamiento",
    operacional: "Operativo",
    crescimento: "Crecimiento",
  },
};

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const tooltipStyle = {
  background: "rgba(2,8,16,0.97)",
  border: "1px solid rgba(106,176,255,0.3)",
  borderRadius: "12px",
  color: "#c8d8f0",
  fontSize: "12px",
};

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}

export default function Relatorios() {
  const { t, idioma } = useLanguage();
  const tt = T[(idioma as "pt" | "en" | "es") || "pt"];

  const hoje = new Date();
  const [ano, setAno] = useState<number>(hoje.getFullYear());
  const [mes, setMes] = useState<number>(hoje.getMonth() + 1);
  const [aba, setAba] = useState<"executivo" | "dre" | "evolucao" | "distribuicao" | "kpis">("executivo");
  const [exportando, setExportando] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Dados reais
  const [userId, setUserId] = useState<string | null>(null);
  const [dre, setDre] = useState<DRE | null>(null);
  const [evolucao, setEvolucao] = useState<PontoEvolucao[]>([]);
  const [distribuicao, setDistribuicao] = useState<CategoriaCusto[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [scoreCFO, setScoreCFO] = useState<{ score: number; nivel: string; cor: string }>({ score: 0, nivel: "—", cor: "#5a7a9a" });
  const [insights, setInsights] = useState<Insight[]>([]);

  // Share modal
  const [shareModalAberto, setShareModalAberto] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    inicializar();
  }, []);

  useEffect(() => {
    if (userId) carregarTudo(userId);
    // eslint-disable-next-line
  }, [ano, mes, userId]);

  async function inicializar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function carregarTudo(uid: string) {
    setCarregando(true);
    try {
      const periodo = montarPeriodo(ano, mes);
      const dreNovo = await carregarDRE(uid, periodo);
      const [evNovo, distNovo, kpisNovos] = await Promise.all([
        carregarEvolucao12Meses(uid, ano, mes),
        carregarDistribuicaoCustos(uid, periodo),
        carregarKPIs(uid, periodo, dreNovo),
      ]);
      const score = calcularScoreCFO(kpisNovos);
      const insightsNovos = gerarInsights(dreNovo, evNovo, kpisNovos, distNovo, score);

      setDre(dreNovo);
      setEvolucao(evNovo);
      setDistribuicao(distNovo);
      setKpis(kpisNovos);
      setScoreCFO(score);
      setInsights(insightsNovos);
    } catch (err: any) {
      showToast(err.message || "Erro ao carregar relatórios", "erro");
    }
    setCarregando(false);
  }

  // =========================================================================
  // PDF EXPORT — usa gerarPdfTabela (preto/branco profissional)
  // =========================================================================
  async function exportarPDF() {
    if (!dre) return;
    setExportando(true);
    try {
      let titulo = "Relatório Gerencial";
      let colunas: any[] = [];
      let linhas: any[] = [];

      if (aba === "dre" || aba === "executivo") {
        titulo = `DRE Gerencial - ${MESES[mes - 1]}/${ano}`;
        colunas = [
          { header: "LINHA", key: "linha", width: 70, align: "left" },
          { header: "VALOR", key: "valor", width: 35, align: "right" },
          { header: "% RECEITA", key: "pct", width: 25, align: "right" },
        ];
        linhas = [
          { linha: tt.receitaBruta, valor: formatBRL(dre.receita_bruta), pct: "100,0%" },
          { linha: `(-) ${tt.deducoes}`, valor: formatBRL(-dre.deducoes), pct: `${dre.pct_deducoes.toFixed(1)}%` },
          { linha: `= ${tt.receitaLiquida}`, valor: formatBRL(dre.receita_liquida), pct: `${(dre.receita_liquida / Math.max(dre.receita_bruta, 1) * 100).toFixed(1)}%` },
          { linha: `(-) ${tt.custosVar}`, valor: formatBRL(-dre.custos_variaveis), pct: `${dre.pct_custos_variaveis.toFixed(1)}%` },
          { linha: `= ${tt.margemContrib}`, valor: formatBRL(dre.margem_contribuicao), pct: `${dre.pct_margem_contribuicao.toFixed(1)}%` },
          { linha: `(-) ${tt.custosFix}`, valor: formatBRL(-dre.custos_fixos), pct: `${dre.pct_custos_fixos.toFixed(1)}%` },
          { linha: `= ${tt.lucroOp}`, valor: formatBRL(dre.lucro_operacional), pct: `${(dre.lucro_operacional / Math.max(dre.receita_bruta, 1) * 100).toFixed(1)}%` },
          { linha: `(-) ${tt.despesasFin}`, valor: formatBRL(-dre.despesas_financeiras), pct: `${(dre.despesas_financeiras / Math.max(dre.receita_bruta, 1) * 100).toFixed(1)}%` },
          { linha: `= ${tt.lucroLiquido}`, valor: formatBRL(dre.lucro_liquido), pct: `${dre.pct_lucro_liquido.toFixed(1)}%` },
        ];
      } else if (aba === "evolucao") {
        titulo = "Evolução Financeira 12 Meses";
        colunas = [
          { header: "MÊS", key: "mes", width: 30, align: "left" },
          { header: "RECEITA", key: "rec", width: 35, align: "right" },
          { header: "CUSTOS", key: "cus", width: 35, align: "right" },
          { header: "LUCRO", key: "luc", width: 30, align: "right" },
          { header: "MARGEM", key: "mar", width: 22, align: "right" },
        ];
        linhas = evolucao.map((e) => ({
          mes: `${e.mes}/${e.ano}`,
          rec: formatBRL(e.receita),
          cus: formatBRL(e.custos),
          luc: formatBRL(e.lucro),
          mar: `${e.margem}%`,
        }));
      } else if (aba === "distribuicao") {
        titulo = `Distribuição de Custos - ${MESES[mes - 1]}/${ano}`;
        colunas = [
          { header: "CATEGORIA", key: "cat", width: 70, align: "left" },
          { header: "VALOR", key: "val", width: 35, align: "right" },
          { header: "% TOTAL", key: "pct", width: 25, align: "right" },
        ];
        linhas = distribuicao.map((d) => ({
          cat: d.name,
          val: formatBRL(d.value),
          pct: `${d.pct}%`,
        }));
      } else if (aba === "kpis") {
        titulo = `KPIs CFO - ${MESES[mes - 1]}/${ano} - Score: ${scoreCFO.score}/100 (${scoreCFO.nivel})`;
        colunas = [
          { header: "INDICADOR", key: "nome", width: 55, align: "left" },
          { header: "VALOR", key: "val", width: 30, align: "right" },
          { header: "META", key: "meta", width: 25, align: "right" },
          { header: "STATUS", key: "st", width: 25, align: "left" },
        ];
        linhas = kpis.map((k) => ({
          nome: k.nome,
          val: k.valor,
          meta: k.meta,
          st: k.atingido ? "OK" : "Abaixo",
        }));
      }

      const resumo = [
        { label: tt.periodo, valor: `${MESES[mes - 1]}/${ano}` },
        { label: tt.receitaBruta, valor: formatBRL(dre.receita_bruta) },
        { label: tt.lucroLiquido, valor: formatBRL(dre.lucro_liquido) },
        { label: tt.scoreCFO, valor: `${scoreCFO.score}/100 (${scoreCFO.nivel})` },
      ];

      await gerarPdfTabela({
        titulo,
        subtitulo: new Date().toLocaleDateString("pt-BR"),
        colunas,
        linhas,
        resumo,
        nomeArquivo: `axioma-relatorio-${aba}-${ano}-${String(mes).padStart(2, "0")}.pdf`,
      });
    } catch (err: any) {
      showToast(err.message || "Erro ao gerar PDF", "erro");
    }
    setExportando(false);
  }

  // =========================================================================
  // SHARE
  // =========================================================================
  function montarTextoCompartilhamento(): string {
    if (!dre) return "Axioma AI.Tech";
    return [
      `🦅 *AXIOMA AI.TECH — Relatório CFO*`,
      ``,
      `📅 Período: *${MESES[mes - 1]}/${ano}*`,
      ``,
      `💰 ${tt.receitaBruta}: ${formatBRL(dre.receita_bruta)}`,
      `📉 Custos Totais: ${formatBRL(dre.custos_variaveis + dre.custos_fixos)}`,
      `✅ ${tt.lucroLiquido}: ${formatBRL(dre.lucro_liquido)}`,
      `📊 Margem Líquida: ${dre.pct_lucro_liquido.toFixed(1)}%`,
      ``,
      `🎯 *Score CFO:* ${scoreCFO.score}/100 (${scoreCFO.nivel})`,
      ``,
      `_Gerado por axiomaai.com.br_`,
    ].join("\n");
  }

  function shareWhatsApp() {
    const texto = encodeURIComponent(montarTextoCompartilhamento());
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }
  function shareTelegram() {
    const texto = encodeURIComponent(montarTextoCompartilhamento());
    window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${texto}`, "_blank");
  }
  function shareGmail() {
    const assunto = encodeURIComponent(`Axioma - Relatório CFO ${MESES[mes - 1]}/${ano}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  function shareOutlook() {
    const assunto = encodeURIComponent(`Axioma - Relatório CFO ${MESES[mes - 1]}/${ano}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  async function shareCopiarTexto() {
    try {
      await navigator.clipboard.writeText(montarTextoCompartilhamento().replace(/\*/g, ""));
      showToast("Resumo copiado!", "ok");
    } catch {
      showToast("Erro ao copiar", "erro");
    }
  }
  async function sharePdf() {
    await exportarPDF();
  }

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================

  const dreLinhas = dre ? [
    { label: tt.receitaBruta, valor: dre.receita_bruta, pct: 100, tipo: "receita" },
    { label: `(−) ${tt.deducoes}`, valor: -dre.deducoes, pct: -dre.pct_deducoes, tipo: "deducao" },
    { label: `= ${tt.receitaLiquida}`, valor: dre.receita_liquida, pct: dre.receita_bruta > 0 ? (dre.receita_liquida / dre.receita_bruta) * 100 : 0, tipo: "subtotal" },
    { label: `(−) ${tt.custosVar}`, valor: -dre.custos_variaveis, pct: -dre.pct_custos_variaveis, tipo: "custo" },
    { label: `= ${tt.margemContrib}`, valor: dre.margem_contribuicao, pct: dre.pct_margem_contribuicao, tipo: "subtotal" },
    { label: `(−) ${tt.custosFix}`, valor: -dre.custos_fixos, pct: -dre.pct_custos_fixos, tipo: "custo" },
    { label: `= ${tt.lucroOp}`, valor: dre.lucro_operacional, pct: dre.receita_bruta > 0 ? (dre.lucro_operacional / dre.receita_bruta) * 100 : 0, tipo: "subtotal" },
    { label: `(−) ${tt.despesasFin}`, valor: -dre.despesas_financeiras, pct: dre.receita_bruta > 0 ? -(dre.despesas_financeiras / dre.receita_bruta) * 100 : 0, tipo: "custo" },
    { label: `= ${tt.lucroLiquido}`, valor: dre.lucro_liquido, pct: dre.pct_lucro_liquido, tipo: "lucro" },
  ] : [];

  const semDados = !carregando && dre && dre.receita_bruta === 0 && dre.custos_variaveis === 0 && dre.custos_fixos === 0;

  return (
    <ModuloLayout
      titulo={`📊 ${t.relatorios?.titulo || "Relatórios"}`}
      subtitulo={t.relatorios?.subtitulo || "Análise gerencial profissional nível CFO"}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)",
            color: "#020810", fontWeight: 600, fontSize: 13,
          }}>
          {toast.msg}
        </div>
      )}

      {/* TOPO: período + abas + share */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Seletor de período + Share */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex gap-2 items-center">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.periodo}:</label>
            <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}>
              {MESES.map((m, i) => <option key={i} value={i + 1} style={{ background: "#020810" }}>{m}</option>)}
            </select>
            <select value={ano} onChange={(e) => setAno(Number(e.target.value))}
              className="px-3 py-2 rounded-lg text-sm"
              style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} style={{ background: "#020810" }}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => setShareModalAberto(true)}
            className="px-4 py-2 rounded-lg text-sm font-semibold sm:ml-auto"
            style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
            📤 {tt.compartilhar}
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "executivo", label: `📊 ${tt.abaExecutivo}` },
            { key: "dre", label: `📈 ${tt.abaDre}` },
            { key: "evolucao", label: `💸 ${tt.abaEvolucao}` },
            { key: "distribuicao", label: `🥧 ${tt.abaDistribuicao}` },
            { key: "kpis", label: `🎯 ${tt.abaKpis}` },
          ].map((a) => (
            <button key={a.key} onClick={() => setAba(a.key as any)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
              style={{
                background: aba === a.key ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.6)",
                color: aba === a.key ? "#fff" : "#6ab0ff",
                border: aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)",
              }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Carregando */}
      {carregando && (
        <CanvasBox cor="#6ab0ff">
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#6ab0ff" }}>Carregando dados...</p>
          </div>
        </CanvasBox>
      )}

      {/* Sem dados */}
      {!carregando && semDados && (
        <CanvasBox cor="#fbbf24">
          <div className="py-8 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-semibold mb-2" style={{ color: "#fbbf24" }}>{tt.semDadosPeriodo}</p>
            <p className="text-xs" style={{ color: "#5a7a9a" }}>Receitas, Custos Fixos, Custos Variáveis ou Importar Documentos</p>
          </div>
        </CanvasBox>
      )}

      {/* ABA: EXECUTIVO ====================================================== */}
      {!carregando && !semDados && aba === "executivo" && dre && (
        <div className="space-y-4">
          {/* SCORE CFO */}
          <CanvasBox cor={scoreCFO.cor}>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="text-center md:text-left flex-1">
                <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>🎯 {tt.scoreCFO}</p>
                <div className="flex items-baseline gap-2 justify-center md:justify-start">
                  <span className="text-5xl md:text-6xl font-black" style={{ color: scoreCFO.cor }}>{scoreCFO.score}</span>
                  <span className="text-xl" style={{ color: "#5a7a9a" }}>/ 100</span>
                </div>
                <p className="text-sm font-bold mt-1" style={{ color: scoreCFO.cor }}>{scoreCFO.nivel}</p>
              </div>

              {/* Mini KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-[2]">
                {[
                  { label: tt.receitaBruta, valor: formatBRL(dre.receita_bruta), cor: "#34d399" },
                  { label: tt.lucroLiquido, valor: formatBRL(dre.lucro_liquido), cor: dre.lucro_liquido >= 0 ? "#6ab0ff" : "#f87171" },
                  { label: "Margem Líquida", valor: `${dre.pct_lucro_liquido.toFixed(1)}%`, cor: "#a78bfa" },
                  { label: "Custos Totais", valor: formatBRL(dre.custos_variaveis + dre.custos_fixos), cor: "#fbbf24" },
                ].map((c, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.6)", border: `1px solid ${c.cor}30` }}>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{c.label}</p>
                    <p className="text-base font-bold mt-1 truncate" style={{ color: c.cor }}>{c.valor}</p>
                  </div>
                ))}
              </div>
            </div>
          </CanvasBox>

          {/* INSIGHTS */}
          {insights.length > 0 && (
            <CanvasBox cor="#a78bfa">
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>💡 {tt.insightsAutomaticos}</p>
              <div className="space-y-2">
                {insights.map((ins, i) => {
                  const cor = ins.tipo === "positivo" ? "#34d399" : ins.tipo === "alerta" ? "#f87171" : ins.tipo === "atencao" ? "#fbbf24" : "#6ab0ff";
                  const icon = ins.tipo === "positivo" ? "✅" : ins.tipo === "alerta" ? "🚨" : ins.tipo === "atencao" ? "⚠️" : "ℹ️";
                  return (
                    <div key={i} className="rounded-xl p-3 flex items-start gap-3"
                      style={{ background: `${cor}10`, border: `1px solid ${cor}30` }}>
                      <span className="text-lg flex-shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: cor }}>{ins.titulo}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#c8d8f0" }}>{ins.texto}</p>
                      </div>
                      {ins.metrica && (
                        <span className="text-sm font-bold flex-shrink-0" style={{ color: cor }}>{ins.metrica}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CanvasBox>
          )}

          {/* GRÁFICO MINI EVOLUÇÃO 6M */}
          {evolucao.length > 0 && (
            <CanvasBox cor="#6ab0ff">
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>📈 Tendência Últimos 6 Meses</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evolucao.slice(-6)}>
                  <defs>
                    <linearGradient id="gExec1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                  <XAxis dataKey="mes" stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                  <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#gExec1)" strokeWidth={2} name={tt.lucro} />
                </AreaChart>
              </ResponsiveContainer>
            </CanvasBox>
          )}
        </div>
      )}

      {/* ABA: DRE ============================================================ */}
      {!carregando && !semDados && aba === "dre" && dre && (
        <CanvasBox cor="#6ab0ff">
          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.abaDre}</p>
            <h3 className="font-bold text-base" style={{ color: "#c8d8f0" }}>
              {MESES[mes - 1]} / {ano}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(106,176,255,0.2)" }}>
                  <th className="text-left py-2 px-2 text-[10px] uppercase" style={{ color: "#5a7a9a" }}></th>
                  <th className="text-right py-2 px-2 text-[10px] uppercase" style={{ color: "#5a7a9a" }}>Valor</th>
                  <th className="text-right py-2 px-2 text-[10px] uppercase hidden sm:table-cell" style={{ color: "#5a7a9a" }}>{tt.pctReceita}</th>
                </tr>
              </thead>
              <tbody>
                {dreLinhas.map((item, i) => (
                  <tr key={i} style={{
                    background: item.tipo === "subtotal" || item.tipo === "lucro" ? "rgba(106,176,255,0.05)" : "transparent",
                  }}>
                    <td className="py-2.5 px-2" style={{
                      color: item.tipo === "subtotal" || item.tipo === "lucro" ? "#c8d8f0" : "#a8b8d0",
                      fontWeight: item.tipo === "subtotal" || item.tipo === "lucro" ? 700 : 400,
                      paddingLeft: item.tipo === "custo" || item.tipo === "deducao" ? "20px" : "8px",
                    }}>
                      {item.label}
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold" style={{
                      color: item.valor >= 0 ? "#34d399" : "#f87171",
                      fontSize: item.tipo === "lucro" ? "16px" : "14px",
                    }}>
                      {formatBRL(item.valor)}
                    </td>
                    <td className="py-2.5 px-2 text-right hidden sm:table-cell" style={{ color: "#5a7a9a" }}>
                      {item.pct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Comentário automático */}
          <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(106,176,255,0.05)", border: "1px solid rgba(106,176,255,0.15)" }}>
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>💡 Análise</p>
            <p className="text-xs" style={{ color: "#c8d8f0" }}>
              {dre.lucro_liquido >= 0
                ? `Você fechou o mês com lucro líquido de ${formatBRL(dre.lucro_liquido)} (${dre.pct_lucro_liquido.toFixed(1)}% sobre receita).`
                : `Atenção: prejuízo líquido de ${formatBRL(Math.abs(dre.lucro_liquido))} no período. Revise custos e precificação.`}
              {" "}
              Sua margem de contribuição foi de {dre.pct_margem_contribuicao.toFixed(1)}%
              {dre.pct_margem_contribuicao >= 40 ? " (saudável, acima de 40%)." : " (atenção: o ideal é acima de 40%)."}
            </p>
          </div>
        </CanvasBox>
      )}

      {/* ABA: EVOLUÇÃO ======================================================= */}
      {!carregando && !semDados && aba === "evolucao" && evolucao.length > 0 && (
        <div className="space-y-4">
          <CanvasBox cor="#6ab0ff">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.abaEvolucao}</p>
            <h3 className="font-bold mb-4" style={{ color: "#c8d8f0" }}>Receita × Custos × Lucro</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={evolucao}>
                <defs>
                  <linearGradient id="gEvR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ab0ff" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6ab0ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEvL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEvC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                <XAxis dataKey="mes" stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="receita" stroke="#6ab0ff" fill="url(#gEvR)" strokeWidth={2} name={tt.receita} />
                <Area type="monotone" dataKey="custos" stroke="#f87171" fill="url(#gEvC)" strokeWidth={2} name={tt.custos} />
                <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#gEvL)" strokeWidth={2} name={tt.lucro} />
              </AreaChart>
            </ResponsiveContainer>
          </CanvasBox>

          {/* Margem */}
          <CanvasBox cor="#a78bfa">
            <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{tt.margem} Líquida (%)</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={evolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                <XAxis dataKey="mes" stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                <YAxis stroke="#5a7a9a" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="margem" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#a78bfa", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CanvasBox>
        </div>
      )}

      {/* ABA: DISTRIBUIÇÃO ================================================== */}
      {!carregando && !semDados && aba === "distribuicao" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {distribuicao.length === 0 ? (
            <div className="md:col-span-2">
              <CanvasBox cor="#fbbf24">
                <div className="py-8 text-center">
                  <p style={{ color: "#5a7a9a" }}>Sem custos cadastrados neste período</p>
                </div>
              </CanvasBox>
            </div>
          ) : (
            <>
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>Distribuição por Categoria</p>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={distribuicao} cx="50%" cy="50%" outerRadius={100} dataKey="value"
                      label={(entry: any) => `${entry.pct}%`} labelLine={false}>
                      {distribuicao.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-1 mt-2 text-[11px]">
                  {distribuicao.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }}></span>
                      <span className="truncate" style={{ color: "#c8d8f0" }}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </CanvasBox>

              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>Ranking de Categorias</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribuicao} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                    <XAxis type="number" stroke="#5a7a9a" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" stroke="#5a7a9a" tick={{ fontSize: 10 }} width={100} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatBRL(v)} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {distribuicao.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CanvasBox>
            </>
          )}
        </div>
      )}

      {/* ABA: KPIs ========================================================== */}
      {!carregando && !semDados && aba === "kpis" && (
        <div className="space-y-4">
          {/* Score destacado */}
          <CanvasBox cor={scoreCFO.cor}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🎯 {tt.scoreCFO}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black" style={{ color: scoreCFO.cor }}>{scoreCFO.score}</span>
                  <span style={{ color: "#5a7a9a" }}>/ 100</span>
                  <span className="text-sm font-bold ml-2" style={{ color: scoreCFO.cor }}>{scoreCFO.nivel}</span>
                </div>
              </div>
              <div className="text-xs text-right" style={{ color: "#5a7a9a" }}>
                <p>Atingidos: <strong style={{ color: "#34d399" }}>{kpis.filter((k) => k.atingido).length}</strong> de {kpis.length}</p>
              </div>
            </div>
          </CanvasBox>

          {/* Grid KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.map((k, i) => (
              <CanvasBox key={i} cor={k.atingido ? "#34d399" : "#f87171"}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{k.nome}</p>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                    background: k.atingido ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)",
                    color: k.atingido ? "#34d399" : "#f87171",
                  }}>
                    {k.atingido ? "✓" : "✗"}
                  </span>
                </div>
                <p className="text-2xl font-black mb-1" style={{ color: k.atingido ? "#34d399" : "#f87171" }}>{k.valor}</p>
                <p className="text-[10px]" style={{ color: "#5a7a9a" }}>
                  {tt.metaProp}: <strong>{k.meta}</strong>
                </p>
                <p className="text-[10px] mt-2" style={{ color: "#a8b8d0" }}>{k.descricao}</p>
              </CanvasBox>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE COMPARTILHAMENTO ========================================== */}
      {shareModalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setShareModalAberto(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5"
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#5a7a9a" }}>📤 {tt.centroCompart}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#c8d8f0" }}>Relatório CFO {MESES[mes - 1]}/{ano}</p>
              </div>
              <button onClick={() => setShareModalAberto(false)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>

            {/* Mini-preview */}
            {dre && (
              <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.6)", border: "1px solid rgba(106,176,255,0.15)" }}>
                <p style={{ color: "#c8d8f0" }}>
                  💰 Receita: <strong style={{ color: "#34d399" }}>{formatBRL(dre.receita_bruta)}</strong> •
                  ✅ Lucro: <strong style={{ color: dre.lucro_liquido >= 0 ? "#6ab0ff" : "#f87171" }}>{formatBRL(dre.lucro_liquido)}</strong>
                </p>
                <p style={{ color: "#c8d8f0" }}>
                  🎯 Score CFO: <strong style={{ color: scoreCFO.cor }}>{scoreCFO.score}/100 ({scoreCFO.nivel})</strong>
                </p>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.compartilharVia}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#25d366" }}>
                <span className="text-xl">📱</span>WhatsApp
              </button>
              <button onClick={shareTelegram}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.35)", color: "#229ed9" }}>
                <span className="text-xl">✈️</span>Telegram
              </button>
              <button onClick={shareGmail}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(234,67,53,0.12)", border: "1px solid rgba(234,67,53,0.35)", color: "#ea4335" }}>
                <span className="text-xl">📨</span>Gmail
              </button>
              <button onClick={shareOutlook}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(0,120,212,0.12)", border: "1px solid rgba(0,120,212,0.35)", color: "#0078d4" }}>
                <span className="text-xl">📩</span>Outlook
              </button>
              <button onClick={shareCopiarTexto}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <span className="text-xl">📋</span>Copiar Resumo
              </button>
              <button onClick={sharePdf} disabled={exportando}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50 sm:col-span-3"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626" }}>
                <span className="text-xl">{exportando ? "⏳" : "📄"}</span>
                {exportando ? "Gerando..." : "Baixar PDF Profissional"}
              </button>
            </div>

            <button onClick={() => setShareModalAberto(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
              {tt.fechar}
            </button>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}