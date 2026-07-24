"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, X, Pencil, Share2, AlertTriangle, Sparkles, Zap, MessageSquareText } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import {
  fBRL, fBRL2, fPct, CORES, porCategoria, optRosca, optBarrasV, optLinhaMulti, optLinhaPrevisao, serieRolling,
  margemContribuicao, pontoEquilibrio, margemSeguranca, coeficienteVariacao, pesoSobreReceita,
  resolverPeriodo, periodoAnterior, filtrarPorPeriodo, compararPeriodos, compararPeriodosPorCategoria,
  detectarAnomaliasHistoricas, preverTendencia, FONTE_EXEC,
  type Lancamento, type Periodo, type PeriodoPreset, type ComparativoPeriodo,
} from "../../../lib/cfoCore";
import { cfoT, canaisCompartilhamento, montarNarrativaVariacao, montarNarrativaMargem, montarSugestao } from "../../../lib/cfoTextos";
import { registrarAuditoriaCentro } from "../../../lib/centroCustoHelpers";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Marketing", "Logística", "Matéria-prima", "Comissões", "Embalagens", "Outros"];
const CAT_COR: Record<string, string> = {
  "Marketing": CORES.laranja, "Logística": CORES.cyan, "Matéria-prima": CORES.roxo,
  "Comissões": CORES.amarelo, "Embalagens": CORES.teal, "Outros": CORES.rosa,
};

type CustoVariavel = {
  id: string; descricao: string; valor: number; data: string; categoria: string;
  centro_custo_id?: string | null;
};

// Janela de histórico buscada no banco — limitada por design (não busca a vida toda da
// empresa de uma vez). 24 meses cobre comparativo + anomalias + projeção com folga,
// e escala igual pra empresa nova ou com anos de dado.
function inicioJanelaHistorica(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 23, 1).toISOString().slice(0, 10);
}

export default function CustosVariaveis() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [custos, setCustos] = useState<CustoVariavel[]>([]);
  const [custoFixoTotal, setCustoFixoTotal] = useState(0);
  const [receitas, setReceitas] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CustoVariavel | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], centro_custo_id: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [centrosCusto, setCentrosCusto] = useState<{ id: string; nome: string }[]>([]);

  // Seletor de período — controla comparativo, narrativa, anomalias e projeção
  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));

  const periodo = resolverPeriodo(presetPeriodo, personalizado);
  const periodoAnt = periodoAnterior(periodo);

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const inicioHistorico = inicioJanelaHistorica(periodo.fim);

    const [{ data: cv }, { data: cf }, { data: rec }] = await Promise.all([
      supabase.from("custos_variaveis").select("*")
        .gte("data", inicioHistorico).lte("data", periodo.fim).order("data", { ascending: false }),
      // Leitura só (SELECT) de Custos Fixos — necessária pro Ponto de Equilíbrio. Nunca escreve nessa tabela.
      supabase.from("custos_fixos").select("valor_mensal"),
      // Leitura só (SELECT) de Receitas — necessária pra Margem de Contribuição. Nunca escreve nessa tabela.
      // Limitada à mesma janela histórica — não traz o histórico inteiro da empresa de uma vez.
      supabase.from("receitas").select("valor, data")
        .gte("data", inicioHistorico).lte("data", periodo.fim),
    ]);

    setCustos(cv || []);
    setCustoFixoTotal((cf || []).reduce((s, c: any) => s + Number(c.valor_mensal || 0), 0));
    setReceitas((rec || []).map((r: any) => ({ valor: Number(r.valor || 0), data: r.data })));
    supabase.from("centros_custo").select("id, nome").then(({ data }) => setCentrosCusto(data || []));
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], centro_custo_id: "" });
  };

  const abrirEdicao = (c: CustoVariavel) => {
    setEditando(c);
    setNovo({ descricao: c.descricao, valor: String(c.valor), data: c.data, categoria: c.categoria, centro_custo_id: c.centro_custo_id || "" });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const empresaId = await obterEmpresaAtiva();
    if (!empresaId) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, valor: parseFloat(novo.valor), data: novo.data || new Date().toISOString().slice(0, 10), categoria: novo.categoria, centro_custo_id: novo.centro_custo_id || null };
    if (editando) {
      const { error } = await supabase.from("custos_variaveis").update(payload).eq("id", editando.id);
      if (!error) {
        await registrarAuditoriaCentro({ userId: user.id, empresaId, centroId: novo.centro_custo_id || null, tabela: "custos_variaveis", registroId: editando.id, acao: "editar", descricao: `Custo variável editado: ${novo.descricao}` });
        fecharModal(); await carregarTudo();
      }
    } else {
      const { data, error } = await supabase.from("custos_variaveis").insert({ ...payload, user_id: user.id, empresa_id: empresaId }).select("id").single();
      if (!error && data) {
        await registrarAuditoriaCentro({ userId: user.id, empresaId, centroId: novo.centro_custo_id || null, tabela: "custos_variaveis", registroId: data.id, acao: "criar", descricao: `Custo variável criado: ${novo.descricao}` });
        fecharModal(); await carregarTudo();
      }
    }
    setSalvando(false);
  };

  const excluir = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const empresaId = await obterEmpresaAtiva();
    const custo = custos.find(c => c.id === id);
    await supabase.from("custos_variaveis").delete().eq("id", id);
    if (user) await registrarAuditoriaCentro({ userId: user.id, empresaId, centroId: custo?.centro_custo_id || null, tabela: "custos_variaveis", registroId: id, acao: "excluir", descricao: `Custo variável excluído: ${custo?.descricao || id}` });
    setCustos(custos.filter(c => c.id !== id));
  };

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMes = custos.reduce((acc, c) => acc + c.valor, 0);
  const maiorCusto = custos.length > 0 ? Math.max(...custos.map(c => c.valor)) : 0;
  const temDados = custos.length > 0;

  // ═══════════════════════ INTELIGÊNCIA CFO (alicerce) ═══════════════════════
  const custoVariavelItens: Lancamento[] = custos.map(c => ({ valor: c.valor, data: c.data, categoria: c.categoria, descricao: c.descricao }));

  const custosNoPeriodo = filtrarPorPeriodo(custoVariavelItens, periodo);
  const custosNoPeriodoAnt = filtrarPorPeriodo(custoVariavelItens, periodoAnt);
  const receitasNoPeriodo = filtrarPorPeriodo(receitas, periodo);
  const receitasNoPeriodoAnt = filtrarPorPeriodo(receitas, periodoAnt);

  const comparativoCV: ComparativoPeriodo = compararPeriodos(custosNoPeriodo, custosNoPeriodoAnt);
  const comparativoReceita: ComparativoPeriodo = compararPeriodos(receitasNoPeriodo, receitasNoPeriodoAnt);
  const comparativoCategoria = compararPeriodosPorCategoria(custosNoPeriodo, custosNoPeriodoAnt, categorias);

  const mc = margemContribuicao(comparativoReceita.atual, comparativoCV.atual);
  const mcAnt = margemContribuicao(comparativoReceita.anterior, comparativoCV.anterior);
  const pe = pontoEquilibrio(custoFixoTotal, mc.pct);
  const ms = margemSeguranca(comparativoReceita.atual, pe);

  const serieCVHist = serieRolling(custoVariavelItens, 12, periodo.fim);
  const volatilidade = coeficienteVariacao(serieCVHist.slice(-6).map(b => b.value));
  const pesoReceita = pesoSobreReceita(comparativoCV.atual, comparativoReceita.atual);

  const anomalias = detectarAnomaliasHistoricas(custoVariavelItens).slice(0, 3);
  const sugestoes = anomalias.slice(0, 3).map(a => montarSugestao(lang, a));

  const previsaoCV = preverTendencia(serieCVHist.map(b => b.value), 3);

  const metricaLabel = lang === "en" ? "Variable costs" : lang === "es" ? "Costos variables" : "Custos variáveis";
  const narrativaVariacao = temDados ? montarNarrativaVariacao(lang, {
    metrica: metricaLabel, pct: comparativoCV.variacaoPct,
    categoriaPrincipal: comparativoCategoria[0]?.categoria, valorCategoriaPrincipal: comparativoCategoria[0]?.variacaoValor,
  }) : "";
  const narrativaMargem = temDados && comparativoReceita.atual > 0 ? montarNarrativaMargem(lang, mcAnt.pct, mc.pct) : "";

  const insights: { tipo: "alerta" | "positivo"; texto: string }[] = [];
  if (temDados) {
    if (pe === null) insights.push({ tipo: "alerta", texto: cx.alertaSemBreakeven });
    else if (ms !== null && ms < 15) insights.push({ tipo: "alerta", texto: cx.alertaMargemBaixa });
    if (volatilidade > 25) insights.push({ tipo: "alerta", texto: cx.alertaVolatilidade });
    if (comparativoCV.direcao === "alta" && comparativoReceita.direcao !== "alta" && comparativoCV.variacaoPct > 5) {
      insights.push({ tipo: "alerta", texto: cx.alertaSangriaMargem });
    }
    if (pe !== null && ms !== null && ms >= 30) insights.push({ tipo: "positivo", texto: cx.positivoMargemSaudavel });
  }

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: t.custosVariaveis.titulo,
        subtitulo: t.custosVariaveis.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Categoria", key: "categoria", width: 3 },
          { header: "Data", key: "data", width: 2 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
        ],
        linhas: custosFiltrados.map((c) => ({
          descricao: c.descricao,
          categoria: c.categoria,
          data: c.data ? new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR") : "-",
          valor: fBRL2(c.valor),
        })),
        resumo: [
          { label: "Total no Período", valor: `R$ ${fBRL2(comparativoCV.atual)}` },
          { label: "Lançamentos", valor: `${custos.length}` },
          { label: "Maior Custo", valor: `R$ ${fBRL2(maiorCusto)}` },
          { label: "Margem de Contribuição", valor: fPct(mc.pct) },
          { label: "Ponto de Equilíbrio", valor: pe !== null ? `R$ ${fBRL2(pe)}` : cx.semBreakeven },
        ],
        nomeArquivo: `axioma-custos-variaveis-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.custosVariaveis.titulo}`,
    `📉 ${cx.custoVariavelMes}: ${fBRL(comparativoCV.atual)}`,
    `📊 ${cx.margemContribuicao}: ${fPct(mc.pct)}`,
    pe !== null ? `⚖️ ${cx.pontoEquilibrio}: ${fBRL(pe)}` : `⚠️ ${cx.semBreakeven}`,
    ms !== null ? `🛡️ ${cx.margemSeguranca}: ${fPct(ms)}` : "",
    narrativaVariacao ? `💬 ${narrativaVariacao}` : "",
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${t.custosVariaveis.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  // ═══════════════════════ GRÁFICOS ═══════════════════════
  const composicao = porCategoria(custosNoPeriodo, categorias, CAT_COR);
  const optCat = optRosca(composicao, CORES.laranja, cx.custoVariavelMes.toUpperCase());

  const topCustos = [...custosNoPeriodo].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0)).slice(0, 8) as (Lancamento & { descricao: string })[];
  const optTop = optBarrasV(
    topCustos.map(c => Number(c.valor) || 0),
    topCustos.map(c => (c.descricao || "").length > 8 ? c.descricao.slice(0, 7) + "…" : c.descricao),
    CORES.amarelo, CORES.amareloC
  );

  const labelsHist = serieCVHist.map(b => b.label);
  const peSerie: number[] = pe !== null ? Array(12).fill(pe) : [];
  const optMargem = optLinhaMulti(
    [
      { nome: lang === "en" ? "Revenue" : lang === "es" ? "Ingresos" : "Receita", dados: serieRolling(receitas, 12, periodo.fim).map(b => b.value), cor: CORES.verde, area: true },
      { nome: t.custosVariaveis.titulo, dados: serieCVHist.map(b => b.value), cor: CORES.laranja },
      { nome: cx.pontoEquilibrio, dados: peSerie, cor: CORES.rosa, tipo: "dashed" as const },
    ],
    labelsHist, CORES.laranja
  );

  const labelsProj = ["+1", "+2", "+3"];
  const optProjecao = optLinhaPrevisao(
    [...serieCVHist.slice(-6).map(b => b.value), ...Array(3).fill(null)],
    previsaoCV,
    [...serieCVHist.slice(-6).map(b => b.label), ...labelsProj],
    cx.realizado, cx.projetado, CORES.laranja, CORES.laranjaC
  );

  const kpisCFO = [
    { l: cx.custoVariavelMes, v: fBRL(comparativoCV.atual), c: CORES.laranja, i: "📉", delta: comparativoCV, polaridadeInvertida: true },
    { l: cx.margemContribuicao, v: fPct(mc.pct), c: CORES.verde, i: "📊", delta: null as ComparativoPeriodo | null, polaridadeInvertida: false },
    { l: cx.pontoEquilibrio, v: pe !== null ? fBRL(pe) : cx.semBreakeven, c: CORES.cyan, i: "⚖️", delta: null, polaridadeInvertida: false },
    { l: cx.margemSeguranca, v: ms !== null ? fPct(ms) : "—", c: ms === null ? CORES.rosa : ms < 15 ? CORES.vermelho : ms < 30 ? CORES.amarelo : CORES.verde, i: "🛡️", delta: null, polaridadeInvertida: false },
    { l: cx.volatilidade, v: fPct(volatilidade), c: volatilidade > 25 ? CORES.vermelho : volatilidade > 15 ? CORES.amarelo : CORES.verde, i: "🌊", delta: null, polaridadeInvertida: false },
    { l: cx.pesoReceita, v: fPct(pesoReceita), c: CORES.roxo, i: "⚡", delta: null, polaridadeInvertida: false },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.custoVariavelMes} ${fBRL(comparativoCV.atual)}`,
    `${cx.margemContribuicao} ${fPct(mc.pct)}`,
    pe !== null ? `${cx.pontoEquilibrio} ${fBRL(pe)}` : cx.semBreakeven,
    ms !== null ? `${cx.margemSeguranca} ${fPct(ms)}` : "",
    `${cx.volatilidade} ${fPct(volatilidade)}`,
  ].filter(Boolean);

  const DeltaBadge = ({ comp, invertido }: { comp: ComparativoPeriodo; invertido: boolean }) => {
    if (comp.direcao === "estavel") {
      return <span className="text-[9px] font-bold" style={{ color: "#64748b" }}>{cx.periodoEstavel}</span>;
    }
    const bom = invertido ? comp.direcao === "baixa" : comp.direcao === "alta";
    const cor = bom ? CORES.verde : CORES.vermelho;
    const seta = comp.direcao === "alta" ? "▲" : "▼";
    return (
      <span className="text-[9px] font-bold" style={{ color: cor }}>
        {seta} {fPct(Math.abs(comp.variacaoPct))} {cx.vsPeriodoAnterior}
      </span>
    );
  };

  const SubChart = ({ titulo, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-[13px] font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{titulo}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  return (
    <ModuloLayout titulo={t.custosVariaveis.titulo} subtitulo={t.custosVariaveis.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} labelBotao={t.custosVariaveis.novoCusto}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], centro_custo_id: "" }); setModalAberto(true); }}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo
            preset={presetPeriodo} onChangePreset={setPresetPeriodo}
            personalizado={personalizado} onChangePersonalizado={setPersonalizado}
            cor={CORES.laranja} lang={lang}
          />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.custosVariaveis.totalMes, value: fBRL(totalMes), cor: "#f97316" },
            { label: t.custosVariaveis.lancamentos, value: `${custos.length}`, cor: "#6ab0ff" },
            { label: t.custosVariaveis.maiorCusto, value: fBRL(maiorCusto), cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-base md:text-2xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* CAMADA CFO */}
        {temDados && (
          <>
            {/* KPIs CFO com comparativo vs período anterior */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-3 md:p-4"
                  style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c, ...FONTE_EXEC }}>{k.v}</p>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
                  {k.delta && <div className="mt-1"><DeltaBadge comp={k.delta} invertido={k.polaridadeInvertida} /></div>}
                </motion.div>
              ))}
            </div>

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(249,115,22,0.14), rgba(251,191,36,0.10))", border: "1px solid rgba(249,115,22,0.24)" }}>
              <div className="marquee-cv py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#fdba74" : "#e2e8f0" }}>{m}<span style={{ color: "#f97316" }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-cv{animation:marqueeCv 30s linear infinite}@keyframes marqueeCv{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-cv:hover{animation-play-state:paused}`}</style>
            </div>

            {/* NARRATIVA AUTOMÁTICA — "o que mudou", sempre citando a origem do número */}
            {(narrativaVariacao || narrativaMargem) && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(249,115,22,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText size={16} style={{ color: CORES.laranja }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.narrativaTitulo}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>
                  {narrativaVariacao} {narrativaMargem}
                </p>
              </div>
            )}

            {/* MODAL ÚNICO — Análise de Margem */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#f97316,#fbbf24)", boxShadow: "0 0 12px #f97316" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.analiseMargem}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.subAnaliseMargem}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <SubChart titulo={cx.analiseMargem} cor={CORES.laranja} option={optMargem} altura={280} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <SubChart titulo={t.geral.categoria} cor={CORES.laranja} option={optCat} altura={260} />
                  <SubChart titulo={lang === "en" ? "Top Costs" : lang === "es" ? "Mayores Costos" : "Maiores Custos"} cor={CORES.amarelo} option={optTop} altura={260} />
                  <SubChart titulo={cx.previsao} cor={CORES.roxo} option={optProjecao} altura={260} />
                </div>
              </div>
            </div>

            {/* ANOMALIAS HISTÓRICAS / PRICE CREEP */}
            {anomalias.length > 0 && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(40,20,10,0.6), rgba(10,8,32,0.95))", border: "1px solid rgba(249,115,22,0.25)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} style={{ color: CORES.laranja }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.anomaliasTitulo}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {anomalias.map((a, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.25)" }}>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "#e2e8f0" }}>{a.descricao}</p>
                        <p className="text-[10px] font-medium" style={{ color: CORES.laranja }}>
                          {a.tipo === "aumento_recorrente" ? cx.itemRenegociar : `${fBRL(a.valorAtual)} ${cx.acimaPropriaMedia} (${fBRL(a.valorReferencia)})`}
                        </p>
                      </div>
                      <p className="text-sm font-black flex-shrink-0 ml-2" style={{ color: CORES.laranja }}>{fBRL(a.impacto)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUGESTÕES ACIONÁVEIS */}
            {sugestoes.length > 0 && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} style={{ color: CORES.ouro }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.sugestoesTitulo}</p>
                </div>
                <div className="space-y-2">
                  {sugestoes.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                      <Sparkles size={15} style={{ color: CORES.ouro, flexShrink: 0 }} />
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: "#f0d878" }}>{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: CORES.ouro }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.insights}</p>
                </div>
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: ins.tipo === "alerta" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${ins.tipo === "alerta" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                      {ins.tipo === "alerta" ? <AlertTriangle size={15} style={{ color: CORES.vermelho, flexShrink: 0 }} /> : <Zap size={15} style={{ color: CORES.verde, flexShrink: 0 }} />}
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: ins.tipo === "alerta" ? "#fca5a5" : "#6ee7b7" }}>{ins.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <Search size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosVariaveis.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Tabela */}
        <CanvasBox cor="#f97316">
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                    {[t.geral.descricao, t.geral.categoria, t.geral.data, t.geral.valor, t.geral.acoes].map(h => (
                      <th key={h} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {custosFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#5a7a9a" }}>{t.custosVariaveis.semCustos}</td></tr>
                  ) : custosFiltrados.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ backgroundColor: "rgba(249,115,22,0.02)" }}
                      style={{ borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                      <td className="px-4 md:px-6 py-3 text-sm" style={{ color: "#c8d8f0" }}>{c.descricao}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${CAT_COR[c.categoria]}18`, color: CAT_COR[c.categoria] || "#6ab0ff" }}>{c.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#5a7a9a" }}>{new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#f97316" }}>{fBRL(c.valor)}</td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(c)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c.id)} style={{ color: "#f97316" }}><Trash2 size={16} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CanvasBox>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#f97316">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#f97316" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? (lang === "en" ? "Edit Variable Cost" : lang === "es" ? "Editar Costo Variable" : "Editar Custo Variável") : t.custosVariaveis.novoCusto}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t.geral.descricao, key: "descricao", type: "text" },
                    { label: t.geral.valor, key: "valor", type: "number" },
                    { label: t.geral.data, key: "data", type: "date" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                      <input type={type} value={novo[key as keyof typeof novo]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>
                      {lang === "en" ? "Cost Center" : lang === "es" ? "Centro de Costo" : "Centro de Custo"} <span style={{ color: "#5a7a9a", textTransform: "none", letterSpacing: 0 }}>({lang === "en" ? "optional" : lang === "es" ? "opcional" : "opcional"})</span>
                    </label>
                    <select value={novo.centro_custo_id} onChange={(e) => setNovo({ ...novo, centro_custo_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {lang === "en" ? "No cost center" : lang === "es" ? "Sin centro de costo" : "Sem centro de custo"} --</option>
                      {centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #9a3412, #f97316)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.custosVariaveis.salvarCusto}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centro de Compartilhamento */}
      <AnimatePresence>
        {shareAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor="#8b5cf6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#c4b5fd" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canais.map(c => (
                    <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>{c.nome}</a>
                  ))}
                  <button onClick={copiar} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>{copiado ? cx.copiado : cx.copiar}</button>
                  <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.4)", color: "#fdba74" }}>PDF</button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}
