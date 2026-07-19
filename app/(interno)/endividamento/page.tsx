"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, X, Pencil, Share2, AlertTriangle, Sparkles, Zap, ShieldCheck, Clock, Sliders } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import {
  fBRL, fPct, CORES, FONTE_EXEC,
  resolverPeriodo,
  montarDRE, semaforoSaude, optBarrasV, optLinhaMulti,
  escadaVencimentos, ordenarAvalanche, coberturaJuros, dividaEbitda, dividaReceita,
  comprometimentoMensal, fluxoCaixaSobreDivida, calcularSinaisSolvencia,
  simularRefinanciamento, projetarQuitacao, runwayDivida, gerarConselhoDivida,
  type Lancamento, type Periodo, type PeriodoPreset, type DividaBase, type CorSaude,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento, montarNarrativaMuro, montarNarrativaRunwayDivida, montarConselhoDivida,
} from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tipos = ["Empréstimo bancário", "Cartão de crédito", "Cheque especial", "Financiamento", "Carta de crédito", "Outros"];

type Divida = {
  id: string; descricao: string; tipo: string; valor_total: number;
  valor_pago: number; parcelas: number; vencimento: string; taxa_juros: number;
};

function inicioJanelaHistorica(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 23, 1).toISOString().slice(0, 10);
}

function inicioRolling12(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 11, 1).toISOString().slice(0, 10);
}

function mesesNoPeriodo(periodo: Periodo): number {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const dias = (fim.getTime() - ini.getTime()) / 86400000;
  return Math.max(1, Math.round(dias / 30));
}

export default function Endividamento() {
  const { t } = useLanguage();
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [dividas, setDividas] = useState<Divida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<{ tipo: string; valor: number; data: string; status: string }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));
  const periodo = resolverPeriodo(presetPeriodo, personalizado);

  const [simDividaId, setSimDividaId] = useState("");
  const [simNovaTaxa, setSimNovaTaxa] = useState("");
  const [simNovoPrazo, setSimNovoPrazo] = useState("");

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const inicioHist = inicioJanelaHistorica(periodo.fim);

    const [{ data: dv }, { data: rec }, { data: cf }, { data: cv }, { data: fc }, { data: emp }] = await Promise.all([
      supabase.from("dividas").select("*").eq("user_id", user.id).order("vencimento", { ascending: true }),
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      // Leitura só (SELECT) — caixa realmente movimentado no período, base do indicador Fluxo de Caixa/Dívida. Nunca escreve.
      supabase.from("fluxo_caixa").select("tipo, valor, data, status").eq("user_id", user.id).gte("data", periodo.inicio).lte("data", periodo.fim),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    setDividas(dv || []);
    setReceitasRows(rec || []);
    setCustosFixosRows(cf || []);
    setCustosVarRows(cv || []);
    setFluxoCaixaRows(fc || []);
    setRegimeTributario(emp?.regime_tributario || "");
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  };

  const abrirEdicao = (d: Divida) => {
    setEditando(d);
    setNovo({ descricao: d.descricao, tipo: d.tipo, valor_total: String(d.valor_total), valor_pago: String(d.valor_pago), parcelas: String(d.parcelas), vencimento: d.vencimento, taxa_juros: String(d.taxa_juros) });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor_total) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = {
      descricao: novo.descricao, tipo: novo.tipo,
      valor_total: parseFloat(novo.valor_total),
      valor_pago: parseFloat(novo.valor_pago || "0"),
      parcelas: parseInt(novo.parcelas || "1"),
      vencimento: novo.vencimento,
      taxa_juros: parseFloat(novo.taxa_juros || "0"),
    };
    editando
      ? await supabase.from("dividas").update(payload).eq("id", editando.id)
      : await supabase.from("dividas").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarTudo(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("dividas").delete().eq("id", id);
    setDividas(dividas.filter(d => d.id !== id));
  };

  const dividasFiltradas = dividas.filter(d => d.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalDivida = dividas.reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = dividas.reduce((acc, d) => acc + d.valor_pago, 0);
  const totalRestante = totalDivida - totalPago;
  const temDados = dividas.length > 0;

  // ═══════════════════════ INTELIGÊNCIA CFO — SOLVÊNCIA ═══════════════════════
  const dividasBase: DividaBase[] = dividas.map(d => ({ descricao: d.descricao, tipo: d.tipo, valor_total: d.valor_total, valor_pago: d.valor_pago, parcelas: d.parcelas, vencimento: d.vencimento, taxa_juros: d.taxa_juros }));

  const dividaTotal = dividas.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
  const parcelaMensalTotal = dividas.reduce((s, d) => {
    const saldo = Math.max(0, d.valor_total - d.valor_pago);
    return saldo > 0 ? s + saldo / Math.max(1, d.parcelas) : s;
  }, 0);
  const despesasFinanceirasMensal = dividas.reduce((s, d) => {
    const saldo = Math.max(0, d.valor_total - d.valor_pago);
    return s + saldo * (d.taxa_juros / 100);
  }, 0);

  const meses = mesesNoPeriodo(periodo);
  const receitasItens: Lancamento[] = receitasRows.map(r => ({ valor: r.valor, data: r.data }));
  const receitaBrutaPeriodo = receitasItens.reduce((s, r) => s + r.valor, 0);
  const receitaMensalMedia = receitaBrutaPeriodo / meses;
  const receitaAnualizada = receitaMensalMedia * 12;

  const custoVarPeriodo = custosVarRows.reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);

  const inicioRb12 = inicioRolling12(periodo.fim);
  const rb12 = receitasItens.filter(r => r.data >= inicioRb12 && r.data <= periodo.fim).reduce((s, r) => s + r.valor, 0);
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, rb12, receitaMensalMedia);

  // EBITDA reaproveitado do núcleo do DRE — mesma fonte de verdade, zero lógica duplicada.
  const dreEstimado = montarDRE({
    receitaBruta: receitaBrutaPeriodo, deducoes: impostoMensalEstimado * meses,
    custoVariavel: custoVarPeriodo, custoFixo: custoFixoMensalTotal * meses,
    despesasFinanceiras: despesasFinanceirasMensal * meses,
  });
  const ebitdaMensalMedio = dreEstimado.ebitda.valor / meses;
  const ebitdaAnualizado = ebitdaMensalMedio * 12;

  const coberturaJurosX = coberturaJuros(ebitdaMensalMedio, despesasFinanceirasMensal);
  const dividaEbitdaX = dividaEbitda(dividaTotal, ebitdaAnualizado);
  const dividaReceitaPct = dividaReceita(dividaTotal, receitaAnualizada);
  const comprometimentoMensalPct = comprometimentoMensal(parcelaMensalTotal, receitaMensalMedia);

  const caixaRealizadoPeriodo = fluxoCaixaRows.filter(l => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);
  const caixaMensalMedio = caixaRealizadoPeriodo / meses;
  const fluxoCaixaSobreDividaPct = fluxoCaixaSobreDivida(caixaMensalMedio, dividaTotal);

  const sinaisSolvencia = calcularSinaisSolvencia({ coberturaJurosX, dividaEbitdaX, dividaReceitaPct, comprometimentoMensalPct, fluxoCaixaSobreDividaPct });
  const corSolvencia: CorSaude = semaforoSaude(sinaisSolvencia);
  const SINAL_LABEL: Record<string, string> = {
    coberturaJuros: cx.coberturaJurosLabel, dividaEbitda: cx.dividaEbitdaLabel, dividaReceita: cx.dividaReceitaLabel,
    comprometimentoMensal: cx.comprometimentoMensalLabel, fluxoCaixaSobreDivida: cx.fluxoCaixaSobreDividaLabel,
  };

  // ═══════════════════════ ESCADA DE VENCIMENTOS ═══════════════════════
  const escada = escadaVencimentos(dividasBase, ebitdaMensalMedio, 24, 40);
  const proximoMuro = escada.find(b => b.muro);
  const narrativaMuro = temDados ? (proximoMuro ? montarNarrativaMuro(lang, proximoMuro) : cx.semMuro) : "";

  // ═══════════════════════ AVALANCHE ═══════════════════════
  const avalanche = ordenarAvalanche(dividasBase);

  // ═══════════════════════ RUNWAY DA DÍVIDA ═══════════════════════
  const runwayMeses = runwayDivida(dividasBase, 120);
  const narrativaRunway = temDados ? montarNarrativaRunwayDivida(lang, runwayMeses) : "";

  // ═══════════════════════ CONSELHO CFO ═══════════════════════
  const gatilhosConselho = gerarConselhoDivida({ avalanche, escada, coberturaJurosX, dividaEbitdaX });
  const conselhos = gatilhosConselho.map(g => montarConselhoDivida(lang, g));

  // ═══════════════════════ PROJEÇÃO DE QUITAÇÃO ═══════════════════════
  const folgaExtraMensal = Math.max(0, Math.round(ebitdaMensalMedio * 0.1));
  const projMinimo = projetarQuitacao(dividasBase, "minimo", 60);
  const projAvalanche = projetarQuitacao(dividasBase, "avalanche", 60, folgaExtraMensal);

  // ═══════════════════════ SIMULADOR DE REFINANCIAMENTO ═══════════════════════
  const dividaSimulada = dividas.find(d => d.id === simDividaId);
  const resultadoSim = dividaSimulada && simNovaTaxa && simNovoPrazo ? simularRefinanciamento({
    saldoDevedor: Math.max(0, dividaSimulada.valor_total - dividaSimulada.valor_pago),
    taxaJurosAtualAM: dividaSimulada.taxa_juros,
    parcelasRestantesAtual: Math.max(1, dividaSimulada.parcelas),
    novaTaxaAM: parseFloat(simNovaTaxa),
    novoPrazoParcelas: parseInt(simNovoPrazo),
  }) : null;

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: t.endividamento.titulo,
        subtitulo: t.endividamento.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Tipo", key: "tipo", width: 3 },
          { header: "Total (R$)", key: "total", width: 2, align: "right" },
          { header: "Pago (R$)", key: "pago", width: 2, align: "right" },
          { header: "Restante (R$)", key: "restante", width: 2, align: "right" },
          { header: "Juros", key: "juros", width: 2, align: "right" },
        ],
        linhas: dividasFiltradas.map((d) => ({
          descricao: d.descricao, tipo: d.tipo, total: fmtN(d.valor_total), pago: fmtN(d.valor_pago),
          restante: fmtN(d.valor_total - d.valor_pago), juros: `${d.taxa_juros}% a.m.`,
        })),
        resumo: [
          { label: "Total de Dívidas", valor: `R$ ${fmtN(totalDivida)}` },
          { label: "Saldo Restante", valor: `R$ ${fmtN(totalRestante)}` },
          { label: cx.coberturaJurosLabel, valor: coberturaJurosX !== null ? `${coberturaJurosX.toFixed(1)}x` : cx.semJuros },
          { label: cx.dividaEbitdaLabel, valor: dividaEbitdaX !== null ? `${dividaEbitdaX.toFixed(1)}x` : cx.semEbitda },
          { label: cx.runwayDividaTitulo, valor: runwayMeses !== null ? `${runwayMeses}m` : cx.naoQuitaHorizonte },
        ],
        nomeArquivo: `axioma-endividamento-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.endividamento.titulo}`,
    `💳 ${t.endividamento.saldoRestante}: ${fBRL(totalRestante)}`,
    `🛡️ ${cx.coberturaJurosLabel}: ${coberturaJurosX !== null ? `${coberturaJurosX.toFixed(1)}x` : cx.semJuros}`,
    `⚖️ ${cx.dividaEbitdaLabel}: ${dividaEbitdaX !== null ? `${dividaEbitdaX.toFixed(1)}x` : cx.semEbitda}`,
    narrativaRunway ? `⏳ ${narrativaRunway}` : "",
    proximoMuro ? `⚠️ ${narrativaMuro}` : "",
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${t.endividamento.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  // ═══════════════════════ GRÁFICOS ═══════════════════════
  const escadaLabels = escada.map(b => b.label);
  const escadaValores = escada.map(b => b.valor);
  const escadaCores = escada.map(b => b.muro ? CORES.vermelho : null);
  const optEscada = optBarrasV(escadaValores, escadaLabels, CORES.rosa, CORES.rosaC, escadaCores);

  const maxMesesQuit = Math.max(projMinimo.length, projAvalanche.length);
  const labelsQuit = Array.from({ length: maxMesesQuit }, (_, i) => `M${i}`);
  const serieMin = Array.from({ length: maxMesesQuit }, (_, i) => projMinimo[i]?.saldoDevedor ?? 0);
  const serieAva = Array.from({ length: maxMesesQuit }, (_, i) => projAvalanche[i]?.saldoDevedor ?? 0);
  const optQuitacao = optLinhaMulti(
    [
      { nome: cx.cenarioMinimoLabel, dados: serieMin, cor: CORES.rosa, area: true },
      { nome: cx.cenarioAvalancheLabel, dados: serieAva, cor: CORES.verde },
    ],
    labelsQuit, CORES.rosa
  );

  const kpisCFO = [
    { l: cx.coberturaJurosLabel, v: coberturaJurosX === null ? cx.semJuros : `${coberturaJurosX.toFixed(1)}x`, c: coberturaJurosX === null ? CORES.verde : coberturaJurosX < 1.5 ? CORES.vermelho : coberturaJurosX < 3 ? CORES.amarelo : CORES.verde, i: "🛡️" },
    { l: cx.dividaEbitdaLabel, v: dividaEbitdaX === null ? cx.semEbitda : `${dividaEbitdaX.toFixed(1)}x`, c: dividaEbitdaX === null ? CORES.amarelo : dividaEbitdaX > 4 ? CORES.vermelho : dividaEbitdaX > 2 ? CORES.amarelo : CORES.verde, i: "⚖️" },
    { l: cx.dividaReceitaLabel, v: fPct(dividaReceitaPct), c: dividaReceitaPct > 50 ? CORES.vermelho : dividaReceitaPct > 30 ? CORES.amarelo : CORES.verde, i: "📊" },
    { l: cx.comprometimentoMensalLabel, v: fPct(comprometimentoMensalPct), c: comprometimentoMensalPct > 20 ? CORES.vermelho : comprometimentoMensalPct > 10 ? CORES.amarelo : CORES.verde, i: "💳" },
    { l: cx.fluxoCaixaSobreDividaLabel, v: fPct(fluxoCaixaSobreDividaPct), c: fluxoCaixaSobreDividaPct < 10 ? CORES.vermelho : fluxoCaixaSobreDividaPct < 20 ? CORES.amarelo : CORES.verde, i: "💰" },
    { l: cx.runwayDividaTitulo, v: runwayMeses !== null ? `${runwayMeses}m` : "∞", c: runwayMeses === null ? CORES.vermelho : runwayMeses > 36 ? CORES.amarelo : CORES.verde, i: "⏳" },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${t.endividamento.saldoRestante} ${fBRL(totalRestante)}`,
    `${cx.coberturaJurosLabel} ${coberturaJurosX !== null ? `${coberturaJurosX.toFixed(1)}x` : cx.semJuros}`,
    `${cx.dividaEbitdaLabel} ${dividaEbitdaX !== null ? `${dividaEbitdaX.toFixed(1)}x` : cx.semEbitda}`,
    `${cx.runwayDividaTitulo}: ${runwayMeses !== null ? `${runwayMeses}m` : "∞"}`,
  ].filter(Boolean);

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
    <ModuloLayout titulo={t.endividamento.titulo} subtitulo={t.endividamento.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} labelBotao={t.endividamento.novaDivida}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" }); setModalAberto(true); }}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={CORES.rosa} lang={lang} />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.endividamento.totalDividas, value: fBRL(totalDivida), cor: "#f87171" },
            { label: t.endividamento.totalPago, value: fBRL(totalPago), cor: "#34d399" },
            { label: t.endividamento.saldoRestante, value: fBRL(totalRestante), cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {!temDados ? (
          <CanvasBox cor={CORES.rosa}>
            <p className="text-sm text-center py-8" style={{ color: "#5a7a9a" }}>{cx.semDividaTitulo}</p>
          </CanvasBox>
        ) : (
          <>
            {/* SEMÁFORO DE SOLVÊNCIA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${corSolvencia === "verde" ? "rgba(16,185,129,0.3)" : corSolvencia === "amarelo" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} style={{ color: CORES.rosa }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.indicadoresSolvenciaTitulo}</p>
                <span className="inline-block rounded-full flex-shrink-0" style={{ width: 14, height: 14, background: corSolvencia === "verde" ? CORES.verde : corSolvencia === "amarelo" ? CORES.amarelo : CORES.vermelho, boxShadow: `0 0 10px ${corSolvencia === "verde" ? CORES.verde : corSolvencia === "amarelo" ? CORES.amarelo : CORES.vermelho}` }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {sinaisSolvencia.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="inline-block rounded-full flex-shrink-0" style={{ width: 9, height: 9, background: s.cor === "verde" ? CORES.verde : s.cor === "amarelo" ? CORES.amarelo : CORES.vermelho }} />
                    <p className="text-xs font-medium" style={{ color: "#cbd5e1" }}>{SINAL_LABEL[s.chave]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KPIs CFO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-3 md:p-4"
                  style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c, ...FONTE_EXEC }}>{k.v}</p>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
                </motion.div>
              ))}
            </div>

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(236,72,153,0.14), rgba(139,92,246,0.10))", border: "1px solid rgba(236,72,153,0.24)" }}>
              <div className="marquee-end py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#f9a8d4" : "#e2e8f0" }}>{m}<span style={{ color: CORES.rosa }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-end{animation:marqueeEnd 30s linear infinite}@keyframes marqueeEnd{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-end:hover{animation-play-state:paused}`}</style>
            </div>

            {/* ESCADA DE VENCIMENTOS */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${proximoMuro ? "rgba(239,68,68,0.3)" : "rgba(236,72,153,0.2)"}` }}>
              <div className="flex items-center gap-2 mb-2">
                {proximoMuro ? <AlertTriangle size={16} style={{ color: CORES.vermelho }} /> : <ShieldCheck size={16} style={{ color: CORES.rosa }} />}
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.escadaVencimentosTitulo}</p>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: proximoMuro ? "#fca5a5" : "#e2e8f0" }}>{narrativaMuro}</p>
              <SubChart titulo={cx.escadaVencimentosTitulo} cor={CORES.rosa} option={optEscada} altura={240} />
            </div>

            {/* MÉTODO AVALANCHE */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(236,72,153,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: CORES.rosa }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.avalancheTitulo}</p>
              </div>
              <div className="space-y-2">
                {avalanche.map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl" style={{ background: a.cara ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${a.cara ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xs font-black flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: a.ordem === 1 ? CORES.rosa : "rgba(255,255,255,0.08)", color: a.ordem === 1 ? "#fff" : "#94a3b8" }}>{a.ordem}</span>
                      <p className="text-sm font-bold truncate" style={{ color: "#e2e8f0" }}>{a.descricao}</p>
                      {a.cara && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(239,68,68,0.15)", color: CORES.vermelho }}>{cx.dividaCaraTag}</span>}
                      {a.ordem === 1 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(236,72,153,0.15)", color: CORES.rosa }}>{cx.quitarPrimeiroLabel}</span>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black" style={{ color: a.cara ? CORES.vermelho : "#e2e8f0" }}>{fPct(a.taxaJurosAM)}/m</p>
                      <p className="text-[10px]" style={{ color: "#64748b" }}>{fBRL(a.saldoDevedor)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MODAL ÚNICO — Projeção de Quitação + Simulador */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#ec4899,#8b5cf6)", boxShadow: "0 0 12px #ec4899" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.projecaoQuitacaoTitulo}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.cenarioMinimoLabel} × {cx.cenarioAvalancheLabel}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <SubChart titulo={cx.projecaoQuitacaoTitulo} cor={CORES.rosa} option={optQuitacao} altura={280} />
                </div>

                {/* Simulador de Refinanciamento */}
                <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${CORES.rosa}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sliders size={15} style={{ color: CORES.rosa }} />
                    <p className="text-[13px] font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simuladorTitulo}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <select value={simDividaId} onChange={(e) => setSimDividaId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(236,72,153,0.2)", color: "#c8d8f0" }}>
                      <option value="">{t.geral.descricao}...</option>
                      {dividas.filter(d => d.valor_total - d.valor_pago > 0).map(d => (
                        <option key={d.id} value={d.id}>{d.descricao} ({fPct(d.taxa_juros)}/m)</option>
                      ))}
                    </select>
                    <input type="number" placeholder={cx.novaTaxaLabel} value={simNovaTaxa} onChange={(e) => setSimNovaTaxa(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,72,153,0.2)", color: "#c8d8f0" }} />
                    <input type="number" placeholder={cx.novoPrazoLabel} value={simNovoPrazo} onChange={(e) => setSimNovoPrazo(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(236,72,153,0.2)", color: "#c8d8f0" }} />
                  </div>
                  {resultadoSim && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { l: cx.economiaJurosLabel, v: fBRL(resultadoSim.economiaJurosMensal), c: resultadoSim.economiaJurosMensal >= 0 ? CORES.verde : CORES.vermelho },
                        { l: cx.liberacaoCaixaLabel, v: fBRL(resultadoSim.liberacaoCaixaMensal), c: resultadoSim.liberacaoCaixaMensal >= 0 ? CORES.verde : CORES.vermelho },
                        { l: "Nova Parcela", v: fBRL(resultadoSim.parcelaNova), c: CORES.rosa },
                        { l: "Economia Total", v: fBRL(resultadoSim.economiaJurosTotal), c: resultadoSim.economiaJurosTotal >= 0 ? CORES.verde : CORES.vermelho },
                      ].map((c, i) => (
                        <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{c.l}</p>
                          <p className="text-sm font-black" style={{ color: c.c }}>{c.v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CONSELHO CFO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.conselhoDividaTitulo}</p>
              </div>
              {conselhos.length > 0 ? (
                <div className="space-y-2">
                  {conselhos.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                      <Sparkles size={15} style={{ color: CORES.ouro, flexShrink: 0 }} />
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: "#f0d878" }}>{s}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{cx.semGatilhoDivida}</p>
              )}
            </div>

            {/* Regra de ouro + Runway */}
            <div className="rounded-2xl p-4 md:p-5 flex items-center gap-3" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${runwayMeses === null ? "rgba(239,68,68,0.25)" : "rgba(236,72,153,0.2)"}` }}>
              <Clock size={18} style={{ color: runwayMeses === null ? CORES.vermelho : CORES.rosa, flexShrink: 0 }} />
              <div>
                <p className="text-sm" style={{ color: runwayMeses === null ? "#fca5a5" : "#e2e8f0" }}>{narrativaRunway}</p>
                <p className="text-xs mt-1" style={{ color: "#64748b" }}>{cx.regraOuroNegociar}</p>
              </div>
            </div>
          </>
        )}

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <Search size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.endividamento.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Lista dívidas */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dividasFiltradas.length === 0 ? (
          <CanvasBox cor="#f87171">
            <div className="text-center py-8"><p style={{ color: "#5a7a9a" }}>{t.endividamento.semDividas}</p></div>
          </CanvasBox>
        ) : (
          <div className="space-y-4">
            {dividasFiltradas.map((d, i) => {
              const progresso = (d.valor_pago / d.valor_total) * 100;
              const restante = d.valor_total - d.valor_pago;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor="#f87171">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold mb-1" style={{ color: "#c8d8f0" }}>{d.descricao}</h3>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{d.tipo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{t.endividamento.taxaJuros}</p>
                          <p className="font-black text-sm" style={{ color: "#fbbf24" }}>{d.taxa_juros}% a.m.</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(d)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(d.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                      {[
                        { label: t.endividamento.valorTotal, value: fBRL(d.valor_total), cor: "#f87171" },
                        { label: t.endividamento.jaPago, value: fBRL(d.valor_pago), cor: "#34d399" },
                        { label: t.endividamento.restante, value: fBRL(restante), cor: "#fbbf24" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{item.label}</p>
                          <p className="font-black text-sm" style={{ color: item.cor }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "#5a7a9a" }}>{t.endividamento.progresso}</span>
                        <span className="text-xs font-black" style={{ color: "#6ab0ff" }}>{progresso.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progresso, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.08 }}
                          className="h-2 rounded-full"
                          style={{ background: `linear-gradient(90deg, #1a3a8f, #6ab0ff)` }} />
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 flex-wrap gap-1">
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{t.endividamento.vencimento}: {new Date(d.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{d.parcelas}x {t.endividamento.parcelas}</span>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
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
              <CanvasBox cor="#f87171">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#f87171" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Dívida" : t.endividamento.novaDivida}</h3>
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
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {tipos.map(tp => <option key={tp}>{tp}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t.endividamento.valorTotal, key: "valor_total" },
                      { label: t.endividamento.jaPago, key: "valor_pago" },
                      { label: t.endividamento.parcelas, key: "parcelas" },
                      { label: t.endividamento.taxaJuros, key: "taxa_juros" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                        <input type="number" value={novo[key as keyof typeof novo]}
                          onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.vencimento}</label>
                    <input type="date" value={novo.vencimento} onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.endividamento.salvarDivida}
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
