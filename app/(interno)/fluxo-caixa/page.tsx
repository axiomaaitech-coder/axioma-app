"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Pencil, Trash2, X, Share2, Sparkles, Zap, ShieldAlert, MessageSquareText } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import {
  fBRL, fBRL2, fPct, fK, CORES, serieRolling, serieSemanal, optLinhaMulti,
  resolverPeriodo, periodoAnterior, filtrarPorPeriodo, compararPeriodos,
  detectarRupturaCaixa, desvioMedioPrevistoRealizado, projecaoSaldoComCenarios, FONTE_EXEC,
  type Lancamento, type Periodo, type PeriodoPreset, type ComparativoPeriodo, type EventoCaixa,
} from "../../../lib/cfoCore";
import { cfoT, canaisCompartilhamento, montarNarrativaVariacao, montarNarrativaRuptura } from "../../../lib/cfoTextos";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LancamentoFC = {
  id: string; descricao: string; tipo: string;
  valor: number; data: string; status: string;
};

function isoHoje(): string { return new Date().toISOString().slice(0, 10); }

// Janela de histórico buscada — 24 meses pra trás (comparativo/precisão) e até
// 120 dias pra frente (previstos futuros, base da ruptura de caixa e da projeção).
// Nunca busca o histórico inteiro de uma vez, escala pra empresa de qualquer idade.
function inicioJanelaHistorica(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 23, 1).toISOString().slice(0, 10);
}
function fimJanelaFutura(fimPeriodo: string): string {
  const hoje = new Date();
  const futuro = new Date(hoje); futuro.setDate(hoje.getDate() + 120);
  const fimSel = new Date(fimPeriodo + "T00:00:00");
  return (futuro > fimSel ? futuro : fimSel).toISOString().slice(0, 10);
}

const tip = {
  backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
  textStyle: { color: "#e2e8f0", fontSize: 13 },
  extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
};

// Barras agrupadas Entradas x Saídas — específico dessa visão, não genérico o bastante pro alicerce
function optEntradasSaidas(labels: string[], entradas: number[], saidas: number[], cxE: string, cxS: string) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    legend: { top: 0, right: 0, itemWidth: 14, itemHeight: 9, itemGap: 14, textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 }, data: [cxE, cxS] },
    tooltip: { ...tip, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.map((p) => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false }, axisLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } }, axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: cxE, type: "bar", barGap: "10%", itemStyle: { borderRadius: [4, 4, 0, 0], color: CORES.verde }, data: entradas },
      { name: cxS, type: "bar", itemStyle: { borderRadius: [4, 4, 0, 0], color: CORES.vermelho }, data: saidas },
    ],
  };
}

export default function FluxoCaixa() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [lancamentos, setLancamentos] = useState<LancamentoFC[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<LancamentoFC | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [visaoSemanal, setVisaoSemanal] = useState(true);

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));

  const periodo = resolverPeriodo(presetPeriodo, personalizado);
  const periodoAnt = periodoAnterior(periodo);

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("fluxo_caixa").select("*").eq("user_id", user.id)
      .gte("data", inicioJanelaHistorica(periodo.fim)).lte("data", fimJanelaFutura(periodo.fim))
      .order("data", { ascending: false });
    setLancamentos(data || []);
    setCarregando(false);
  };

  const abrirEdicao = (l: LancamentoFC) => {
    setEditando(l);
    setNovo({ descricao: l.descricao, tipo: l.tipo, valor: String(l.valor), data: l.data, status: l.status });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor || !novo.data) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, tipo: novo.tipo, valor: parseFloat(novo.valor), data: novo.data, status: novo.status };
    editando
      ? await supabase.from("fluxo_caixa").update(payload).eq("id", editando.id)
      : await supabase.from("fluxo_caixa").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarTudo(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("fluxo_caixa").delete().eq("id", id);
    setLancamentos(lancamentos.filter(l => l.id !== id));
  };

  const totalEntradas = lancamentos.filter(l => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const totalSaidas = lancamentos.filter(l => l.tipo === "saida").reduce((acc, l) => acc + l.valor, 0);
  const saldoAtual = totalEntradas - totalSaidas;
  const temDados = lancamentos.length > 0;

  // ═══════════════════════════ INTELIGÊNCIA CFO ═══════════════════════════
  const entradasItens: Lancamento[] = lancamentos.filter(l => l.tipo === "entrada").map(l => ({ valor: l.valor, data: l.data, status: l.status, descricao: l.descricao }));
  const saidasItens: Lancamento[] = lancamentos.filter(l => l.tipo === "saida").map(l => ({ valor: l.valor, data: l.data, status: l.status, descricao: l.descricao }));

  const entradasNoPeriodo = filtrarPorPeriodo(entradasItens, periodo);
  const entradasNoPeriodoAnt = filtrarPorPeriodo(entradasItens, periodoAnt);
  const saidasNoPeriodo = filtrarPorPeriodo(saidasItens, periodo);
  const saidasNoPeriodoAnt = filtrarPorPeriodo(saidasItens, periodoAnt);

  const comparativoEntradas: ComparativoPeriodo = compararPeriodos(entradasNoPeriodo, entradasNoPeriodoAnt);
  const comparativoSaidas: ComparativoPeriodo = compararPeriodos(saidasNoPeriodo, saidasNoPeriodoAnt);

  const saldoPeriodoAtual = comparativoEntradas.atual - comparativoSaidas.atual;
  const saldoPeriodoAnterior = comparativoEntradas.anterior - comparativoSaidas.anterior;
  const comparativoSaldo: ComparativoPeriodo = (() => {
    const variacaoValor = saldoPeriodoAtual - saldoPeriodoAnterior;
    const variacaoPct = saldoPeriodoAnterior !== 0 ? (variacaoValor / Math.abs(saldoPeriodoAnterior)) * 100 : (saldoPeriodoAtual !== 0 ? 100 : 0);
    const direcao: ComparativoPeriodo["direcao"] = Math.abs(variacaoPct) < 1 ? "estavel" : variacaoValor > 0 ? "alta" : "baixa";
    return { atual: saldoPeriodoAtual, anterior: saldoPeriodoAnterior, variacaoValor, variacaoPct, direcao };
  })();

  // Saldo real de caixa hoje (só o que já foi realizado, não o previsto)
  const saldoAtualReal = entradasItens.filter(e => e.status === "realizado").reduce((a, r) => a + r.valor, 0)
    - saidasItens.filter(s => s.status === "realizado").reduce((a, r) => a + r.valor, 0);

  const hoje = isoHoje();
  const entradasFuturasPrevistas: EventoCaixa[] = entradasItens.filter(e => e.status === "previsto" && e.data >= hoje).map(e => ({ data: e.data, valor: e.valor }));
  const saidasFuturasPrevistas: EventoCaixa[] = saidasItens.filter(s => s.status === "previsto" && s.data >= hoje).map(s => ({ data: s.data, valor: s.valor }));

  const ruptura = detectarRupturaCaixa(saldoAtualReal, entradasFuturasPrevistas, saidasFuturasPrevistas, 90);

  const desvioEntradas = desvioMedioPrevistoRealizado(entradasItens);
  const desvioSaidas = desvioMedioPrevistoRealizado(saidasItens);
  const precisaoPrevisao = Math.max(0, 100 - Math.min(100, (Math.abs(desvioEntradas) + Math.abs(desvioSaidas)) / 2));
  const bandaCenario = Math.min(50, Math.max(5, (Math.abs(desvioEntradas) + Math.abs(desvioSaidas)) / 2));

  const narrativaSaldo = temDados ? montarNarrativaVariacao(lang, {
    metrica: lang === "en" ? "Cash balance" : lang === "es" ? "Saldo de caja" : "Saldo de caixa",
    pct: comparativoSaldo.variacaoPct,
  }) : "";
  const narrativaRuptura = ruptura ? montarNarrativaRuptura(lang, ruptura.data, ruptura.diasRestantes) : "";

  const insights: { tipo: "alerta" | "positivo"; texto: string }[] = [];
  if (temDados) {
    if (ruptura) insights.push({ tipo: "alerta", texto: narrativaRuptura });
    if (comparativoSaidas.direcao === "alta" && comparativoEntradas.direcao !== "alta" && comparativoSaidas.variacaoPct > 10) {
      insights.push({ tipo: "alerta", texto: lang === "en" ? "Outflows growing faster than inflows this period." : lang === "es" ? "Las salidas crecen más rápido que las entradas en este período." : "Saídas crescendo mais rápido que entradas neste período." });
    }
    if (!ruptura && saldoAtualReal > 0 && comparativoSaldo.direcao === "alta") insights.push({ tipo: "positivo", texto: cx.semRupturaPrevista });
  }

  // ═══════════════════════════ GRÁFICOS ═══════════════════════════
  const serieVisao = visaoSemanal ? serieSemanal(entradasNoPeriodo, 13, periodo.fim) : serieRolling(entradasNoPeriodo, 12, periodo.fim);
  const serieSaidasVisao = visaoSemanal ? serieSemanal(saidasNoPeriodo, 13, periodo.fim) : serieRolling(saidasNoPeriodo, 12, periodo.fim);
  const optBarras = optEntradasSaidas(serieVisao.map(b => b.label), serieVisao.map(b => b.value), serieSaidasVisao.map(b => b.value), t.fluxoCaixa.totalEntradas, t.fluxoCaixa.totalSaidas);

  const projecao = projecaoSaldoComCenarios(saldoAtualReal, entradasFuturasPrevistas, saidasFuturasPrevistas, 13, bandaCenario);
  const optProjecao = optLinhaMulti(
    [
      { nome: cx.cenarioOtimista, dados: projecao.otimista, cor: CORES.verde, tipo: "dashed" as const },
      { nome: cx.cenarioPrevisto, dados: projecao.previsto, cor: CORES.cyan, area: true },
      { nome: cx.cenarioPessimista, dados: projecao.pessimista, cor: CORES.vermelho, tipo: "dashed" as const },
    ],
    projecao.labels, CORES.cyan
  );

  const kpisCFO = [
    { l: cx.saldoAtual, v: fBRL(saldoAtualReal), c: saldoAtualReal >= 0 ? CORES.cyan : CORES.vermelho, i: "💰", delta: null as ComparativoPeriodo | null, invertido: false },
    { l: t.fluxoCaixa.totalEntradas, v: fBRL(comparativoEntradas.atual), c: CORES.verde, i: "📈", delta: comparativoEntradas, invertido: false },
    { l: t.fluxoCaixa.totalSaidas, v: fBRL(comparativoSaidas.atual), c: CORES.vermelho, i: "📉", delta: comparativoSaidas, invertido: true },
    { l: t.fluxoCaixa.saldoAtual, v: fBRL(saldoPeriodoAtual), c: saldoPeriodoAtual >= 0 ? CORES.verde : CORES.vermelho, i: "⚖️", delta: comparativoSaldo, invertido: false },
    { l: cx.rupturaCaixaTitulo, v: ruptura ? `${ruptura.diasRestantes}d` : "—", c: ruptura ? CORES.vermelho : CORES.verde, i: "🚨", delta: null, invertido: false },
    { l: cx.precisaoPrevisao, v: fPct(precisaoPrevisao), c: precisaoPrevisao >= 80 ? CORES.verde : precisaoPrevisao >= 60 ? CORES.amarelo : CORES.vermelho, i: "🎯", delta: null, invertido: false },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.saldoAtual} ${fBRL(saldoAtualReal)}`,
    `${t.fluxoCaixa.totalEntradas} ${fBRL(comparativoEntradas.atual)}`, `${t.fluxoCaixa.totalSaidas} ${fBRL(comparativoSaidas.atual)}`,
    ruptura ? `${cx.rupturaCaixaTitulo}: ${ruptura.diasRestantes}d` : cx.semRupturaPrevista,
  ].filter(Boolean);

  const DeltaBadge = ({ comp, invertido }: { comp: ComparativoPeriodo; invertido: boolean }) => {
    if (comp.direcao === "estavel") return <span className="text-[9px] font-bold" style={{ color: "#64748b" }}>{cx.periodoEstavel}</span>;
    const bom = invertido ? comp.direcao === "baixa" : comp.direcao === "alta";
    const cor = bom ? CORES.verde : CORES.vermelho;
    const seta = comp.direcao === "alta" ? "▲" : "▼";
    return <span className="text-[9px] font-bold" style={{ color: cor }}>{seta} {fPct(Math.abs(comp.variacaoPct))} {cx.vsPeriodoAnterior}</span>;
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

  // ═══════════════════════════ PDF ═══════════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: t.fluxoCaixa.titulo, subtitulo: t.fluxoCaixa.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 }, { header: "Tipo", key: "tipo", width: 2 },
          { header: "Data", key: "data", width: 2 }, { header: "Status", key: "status", width: 2 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
        ],
        linhas: lancamentos.map((l) => ({
          descricao: l.descricao, tipo: l.tipo === "entrada" ? "Entrada" : "Saída",
          data: l.data ? new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR") : "-",
          status: l.status === "realizado" ? "Realizado" : "Previsto",
          valor: `${l.tipo === "entrada" ? "+" : "-"} ${fBRL2(l.valor)}`,
        })),
        resumo: [
          { label: "Total de Entradas", valor: `R$ ${fBRL2(totalEntradas)}` },
          { label: "Total de Saídas", valor: `R$ ${fBRL2(totalSaidas)}` },
          { label: "Saldo Atual (realizado)", valor: `R$ ${fBRL2(saldoAtualReal)}` },
          { label: cx.rupturaCaixaTitulo, valor: ruptura ? `${ruptura.data} (${ruptura.diasRestantes}d)` : "—" },
        ],
        nomeArquivo: `axioma-fluxo-caixa-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════════ COMPARTILHAR ═══════════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.fluxoCaixa.titulo}`,
    `💰 ${cx.saldoAtual}: ${fBRL(saldoAtualReal)}`,
    `📈 ${t.fluxoCaixa.totalEntradas}: ${fBRL(comparativoEntradas.atual)}`,
    `📉 ${t.fluxoCaixa.totalSaidas}: ${fBRL(comparativoSaidas.atual)}`,
    ruptura ? `🚨 ${narrativaRuptura}` : `✅ ${cx.semRupturaPrevista}`,
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${t.fluxoCaixa.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  return (
    <ModuloLayout titulo={t.fluxoCaixa.titulo} subtitulo={t.fluxoCaixa.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" }); setModalAberto(true); }}
      labelBotao={t.fluxoCaixa.novoLancamento}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={CORES.cyan} lang={lang} />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.fluxoCaixa.totalEntradas, value: `R$ ${totalEntradas.toLocaleString("pt-BR")}`, cor: "#34d399", Icon: TrendingUp },
            { label: t.fluxoCaixa.totalSaidas, value: `R$ ${totalSaidas.toLocaleString("pt-BR")}`, cor: "#f87171", Icon: TrendingDown },
            { label: t.fluxoCaixa.saldoAtual, value: `R$ ${saldoAtual.toLocaleString("pt-BR")}`, cor: saldoAtual >= 0 ? "#34d399" : "#f87171", Icon: saldoAtual >= 0 ? TrendingUp : AlertTriangle },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{card.label}</p>
                  <card.Icon size={16} style={{ color: card.cor }} />
                </div>
                <p className="text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* CAMADA CFO */}
        {temDados && (
          <>
            {/* ALERTA DE RUPTURA — o diferencial mundial, sempre visível quando existe */}
            {ruptura && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(60,10,10,0.7), rgba(10,8,32,0.95))", border: "1px solid rgba(239,68,68,0.4)" }}>
                <div className="flex items-center gap-3">
                  <ShieldAlert size={22} style={{ color: CORES.vermelho, flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-black" style={{ color: "#fca5a5", ...FONTE_EXEC }}>{cx.rupturaCaixaTitulo}</p>
                    <p className="text-xs md:text-sm mt-1" style={{ color: "#fecaca" }}>{narrativaRuptura}</p>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs CFO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-3 md:p-4"
                  style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c, ...FONTE_EXEC }}>{k.v}</p>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
                  {k.delta && <div className="mt-1"><DeltaBadge comp={k.delta} invertido={k.invertido} /></div>}
                </motion.div>
              ))}
            </div>

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.14), rgba(59,130,246,0.10))", border: "1px solid rgba(6,182,212,0.24)" }}>
              <div className="marquee-fc py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#67e8f9" : "#e2e8f0" }}>{m}<span style={{ color: "#06b6d4" }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-fc{animation:marqueeFc 30s linear infinite}@keyframes marqueeFc{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-fc:hover{animation-play-state:paused}`}</style>
            </div>

            {/* NARRATIVA */}
            {narrativaSaldo && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(6,182,212,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText size={16} style={{ color: CORES.cyan }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.narrativaTitulo}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>{narrativaSaldo}</p>
              </div>
            )}

            {/* MODAL ÚNICO */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#06b6d4,#3b82f6)", boxShadow: "0 0 12px #06b6d4" }} />
                    <div>
                      <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.previsao}</p>
                      <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.cenarioOtimista} · {cx.cenarioPrevisto} · {cx.cenarioPessimista}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 rounded-xl p-1" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(6,182,212,0.2)" }}>
                    {[{ v: true, l: cx.visaoSemanal }, { v: false, l: cx.visaoMensal }].map((opt) => (
                      <button key={opt.l} onClick={() => setVisaoSemanal(opt.v)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={{ background: visaoSemanal === opt.v ? "rgba(6,182,212,0.3)" : "transparent", color: visaoSemanal === opt.v ? CORES.cyan : "#5a7a9a" }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <SubChart titulo={cx.previsao} cor={CORES.cyan} option={optProjecao} altura={280} />
                </div>

                <SubChart titulo={`${t.fluxoCaixa.totalEntradas} × ${t.fluxoCaixa.totalSaidas}`} cor={CORES.azul} option={optBarras} altura={260} />
              </div>
            </div>

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

        {/* Tabela lançamentos */}
        <CanvasBox cor="#a78bfa">
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{t.fluxoCaixa.lancamentos}</h3>
          </div>
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{t.fluxoCaixa.semLancamentos}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                    {[t.geral.descricao, "Tipo", t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                      <th key={i} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l, i) => (
                    <motion.tr key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      whileHover={{ backgroundColor: "rgba(167,139,250,0.02)" }}
                      style={{ borderBottom: i < lancamentos.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                      <td className="px-4 md:px-6 py-4 text-sm" style={{ color: "#c8d8f0" }}>{l.descricao}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                          {l.tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm" style={{ color: "#5a7a9a" }}>{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? "#34d399" : "#fbbf24" }}>
                          {l.status === "realizado" ? t.fluxoCaixa.realizado : t.fluxoCaixa.previsto}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-black" style={{ color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                        {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex gap-3">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(l)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(l.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CanvasBox>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Lançamento" : t.fluxoCaixa.novoLancamento}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                    <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>Tipo</label>
                    <div className="flex gap-2">
                      {["entrada", "saida"].map((tipo) => (
                        <motion.button key={tipo} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, tipo })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.tipo === tipo ? (tipo === "entrada" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)") : "rgba(59,111,212,0.05)", color: novo.tipo === tipo ? (tipo === "entrada" ? "#34d399" : "#f87171") : "#5a7a9a", border: `1px solid ${novo.tipo === tipo ? (tipo === "entrada" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)") : "rgba(59,111,212,0.1)"}` }}>
                          {tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {[
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
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.status}</label>
                    <div className="flex gap-2">
                      {["previsto", "realizado"].map((s) => (
                        <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, status: s })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.status === s ? "rgba(106,176,255,0.2)" : "rgba(59,111,212,0.05)", color: novo.status === s ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${novo.status === s ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.1)"}` }}>
                          {s === "previsto" ? t.fluxoCaixa.previsto : t.fluxoCaixa.realizado}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fluxoCaixa.salvarLancamento}
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
                  <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.4)", color: "#67e8f9" }}>PDF</button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}
