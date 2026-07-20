"use client";
import { useState, useEffect } from "react";
import {
  Sliders, Target, Dices, TrendingUp, AlertTriangle, Sparkles, Share2, X,
  Landmark, Zap, Percent, ShieldCheck,
} from "lucide-react";
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
  resolverPeriodo, montarDRE,
  simularCenariosExecutivos, analiseSensibilidade, simulacaoMonteCarlo,
  gerarChoquePreset, receitaPctParaMultiplicarLucro, optBarrasV,
  type Lancamento, type Periodo, type PeriodoPreset,
  type ChoqueSimulador, type ResultadoCenario, type ImpactoSensibilidade, type ResultadoMonteCarlo,
  type PresetSimulacao, type DriverSensibilidade,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento,
  montarNarrativaSensibilidade, montarNarrativaMonteCarlo, montarNarrativaRiscoRuptura,
  montarNarrativaOportunidadeCenario, montarNarrativaRegimeTributario, nomeDriverSensibilidade,
} from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";
import { buscarIndicadoresMacro, type IndicadoresMacro } from "../../../lib/bcbApi";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PRATAC = "#cbd5e1";

type RegimeSimulado = "simples nacional" | "presumido" | "real";
type ResultadoTributario = { regime: RegimeSimulado; impostoMensal: number; lucroLiquido: number };
type ResultadoSimulacao = {
  choque: ChoqueSimulador; cenarios: ResultadoCenario[];
  sensibilidade: ImpactoSensibilidade[]; monteCarlo: ResultadoMonteCarlo; tributario: ResultadoTributario[];
};

function inicioJanela12m(ate: string): string {
  const d = new Date(ate + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() - 11, 1).toISOString().slice(0, 10);
}
function mesesNoPeriodo(periodo: Periodo): number {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const dias = (fim.getTime() - ini.getTime()) / 86400000;
  return Math.max(1, Math.round(dias / 30));
}

export default function Simulacoes() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [macro, setMacro] = useState<IndicadoresMacro | null>(null);

  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [dividasRows, setDividasRows] = useState<{ valor_total: number; valor_pago: number; taxa_juros: number }[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<{ tipo: string; valor: number; status: string }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("ultimos_12_meses");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("ultimos_12_meses"));
  const periodo = resolverPeriodo(presetPeriodo, personalizado);

  // ═══════════════════════ CHOQUES ═══════════════════════
  const [choqueReceita, setChoqueReceita] = useState("0");
  const [choqueCustoFixo, setChoqueCustoFixo] = useState("0");
  const [choqueCustoVariavel, setChoqueCustoVariavel] = useState("0");
  const [choqueJuros, setChoqueJuros] = useState("0");
  const [choqueAporte, setChoqueAporte] = useState("0");
  const [choqueRetornoAporte, setChoqueRetornoAporte] = useState("0");
  const [choqueCambio, setChoqueCambio] = useState("0");
  const [exposicaoCambial, setExposicaoCambial] = useState("0");
  const [horizonteMeses, setHorizonteMeses] = useState("12");
  const [reduzirCustosPct, setReduzirCustosPct] = useState("10");
  const [reduzirJurosPontos, setReduzirJurosPontos] = useState("2");
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null);

  const txt = {
    titulo: cx.simTitulo, subtitulo: cx.simSubtitulo,
  };

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);
  useEffect(() => { buscarIndicadoresMacro().then(setMacro); }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const inicioHist = inicioJanela12m(periodo.fim);
    const [{ data: rec }, { data: cf }, { data: cv }, { data: dv }, { data: fc }, { data: emp }] = await Promise.all([
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      // Leitura só (SELECT) — nunca escreve em dividas.
      supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("user_id", user.id),
      // Mesma definição de "caixa disponível" do Fluxo de Caixa/Investimentos.
      supabase.from("fluxo_caixa").select("tipo, valor, status").eq("user_id", user.id),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    setReceitasRows(rec || []);
    setCustosFixosRows(cf || []);
    setCustosVarRows(cv || []);
    setDividasRows(dv || []);
    setFluxoCaixaRows(fc || []);
    setRegimeTributario(emp?.regime_tributario || "");
    setCarregando(false);
  };

  // ═══════════════════════ PONTO DE PARTIDA (dados reais) ═══════════════════════
  const meses = mesesNoPeriodo(periodo);
  const receitasItens: Lancamento[] = receitasRows.map((r) => ({ valor: r.valor, data: r.data }));
  const receitaBrutaPeriodo = receitasItens.reduce((s, r) => s + r.valor, 0);
  const receitaMensalMedia = receitaBrutaPeriodo / meses;
  const custoVarPeriodo = custosVarRows.reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoVariavelMensalMedia = custoVarPeriodo / meses;
  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);

  const dividaTotal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
  const despesasFinanceirasMensal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago) * (d.taxa_juros / 100), 0);
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, receitaBrutaPeriodo, receitaMensalMedia);
  const aliquotaEfetivaPct = receitaMensalMedia > 0 ? (impostoMensalEstimado / receitaMensalMedia) * 100 : 0;

  const caixaDisponivel = fluxoCaixaRows.filter((l) => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);

  const dreAtual = montarDRE({
    receitaBruta: receitaMensalMedia, deducoes: receitaMensalMedia * (aliquotaEfetivaPct / 100),
    custoVariavel: custoVariavelMensalMedia, custoFixo: custoFixoMensalTotal, despesasFinanceiras: despesasFinanceirasMensal,
  });
  const lucroAtualMensal = dreAtual.lucroLiquido.valor;

  const temDadosSimulacao = receitaMensalMedia > 0 || custoFixoMensalTotal > 0;

  // ═══════════════════════ OBJETIVOS / PRESETS ═══════════════════════
  function aplicarChoquePresetParcial(p: Partial<ChoqueSimulador>) {
    if (p.receitaPct !== undefined) setChoqueReceita(String(p.receitaPct));
    if (p.custoFixoPct !== undefined) setChoqueCustoFixo(String(p.custoFixoPct));
    if (p.custoVariavelPct !== undefined) setChoqueCustoVariavel(String(p.custoVariavelPct));
    if (p.jurosDividaPontos !== undefined) setChoqueJuros(String(p.jurosDividaPontos));
    if (p.aporteCapital !== undefined) setChoqueAporte(String(p.aporteCapital));
    if (p.retornoMensalAporte !== undefined) setChoqueRetornoAporte(String(p.retornoMensalAporte));
  }

  function aplicarPreset(preset: PresetSimulacao) {
    const p = gerarChoquePreset(preset, {
      custoPct: parseFloat(reduzirCustosPct || "10"), jurosPontos: parseFloat(reduzirJurosPontos || "2"),
    });
    aplicarChoquePresetParcial(p);
  }

  function aplicarPresetTriplicarLucro() {
    const pct = receitaPctParaMultiplicarLucro(lucroAtualMensal, receitaMensalMedia, dreAtual.margemContribuicaoPct, 3);
    if (pct !== null) aplicarChoquePresetParcial({ receitaPct: Math.round(pct * 10) / 10, custoFixoPct: 0, custoVariavelPct: 0 });
  }

  // ═══════════════════════ RODAR SIMULAÇÃO ═══════════════════════
  const NOME_REGIME: Record<RegimeSimulado, string> = {
    "simples nacional": cx.simRegimeSimples, presumido: cx.simRegimePresumido, real: cx.simRegimeReal,
  };

  function rodarSimulacao() {
    const choque: ChoqueSimulador = {
      receitaPct: parseFloat(choqueReceita || "0"), custoFixoPct: parseFloat(choqueCustoFixo || "0"),
      custoVariavelPct: parseFloat(choqueCustoVariavel || "0"), jurosDividaPontos: parseFloat(choqueJuros || "0"),
      aporteCapital: parseFloat(choqueAporte || "0"), retornoMensalAporte: parseFloat(choqueRetornoAporte || "0"),
    };
    const horizonte = Math.max(1, parseInt(horizonteMeses || "12"));

    const cenarios = simularCenariosExecutivos({
      receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
      custoVariavelMensalAtual: custoVariavelMensalMedia, despesasFinanceirasMensalAtual: despesasFinanceirasMensal,
      dividaTotalAtual: dividaTotal, aliquotaEfetivaPct, saldoCaixaAtual: caixaDisponivel, choque, horizonteMeses: horizonte,
    });

    const sensibilidade = analiseSensibilidade({
      receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
      custoVariavelMensalAtual: custoVariavelMensalMedia, despesasFinanceirasMensalAtual: despesasFinanceirasMensal,
      dividaTotalAtual: dividaTotal, aliquotaEfetivaPct, exposicaoCambialPct: parseFloat(exposicaoCambial || "0"),
    });

    const monteCarlo = simulacaoMonteCarlo({
      receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
      custoVariavelMensalAtual: custoVariavelMensalMedia, despesasFinanceirasMensalAtual: despesasFinanceirasMensal,
      dividaTotalAtual: dividaTotal, aliquotaEfetivaPct, saldoCaixaAtual: caixaDisponivel, choque, horizonteMeses: horizonte,
    });

    const receitaSimulada = receitaMensalMedia * (1 + choque.receitaPct / 100) + choque.retornoMensalAporte;
    const custoVariavelSimulado = custoVariavelMensalMedia * (1 + choque.custoVariavelPct / 100);
    const custoFixoSimulado = custoFixoMensalTotal * (1 + choque.custoFixoPct / 100);
    const tributario: ResultadoTributario[] = (["simples nacional", "presumido", "real"] as RegimeSimulado[]).map((regime) => {
      const impostoMensal = calcularImpostoRegime(regime, receitaSimulada * 12, receitaSimulada);
      const dre = montarDRE({
        receitaBruta: receitaSimulada, deducoes: impostoMensal,
        custoVariavel: custoVariavelSimulado, custoFixo: custoFixoSimulado, despesasFinanceiras: despesasFinanceirasMensal,
      });
      return { regime, impostoMensal, lucroLiquido: dre.lucroLiquido.valor };
    });

    setResultado({ choque, cenarios, sensibilidade, monteCarlo, tributario });
  }

  const cenarioBase = resultado?.cenarios.find((c) => c.nome === "base") || null;
  const cenarioOtimista = resultado?.cenarios.find((c) => c.nome === "otimista") || null;
  const melhorTributario = resultado ? resultado.tributario.reduce((best, r) => (r.lucroLiquido > best.lucroLiquido ? r : best), resultado.tributario[0]) : null;
  const economiaTributaria = resultado && cenarioBase && melhorTributario ? melhorTributario.lucroLiquido - cenarioBase.lucroLiquidoMensal : 0;

  // ═══════════════════════ CONSELHO EXECUTIVO ═══════════════════════
  const riscos: string[] = [];
  const oportunidadesTxt: string[] = [];
  if (resultado && cenarioBase && cenarioOtimista) {
    if (resultado.monteCarlo.probabilidadeRupturaCaixaPct > 15) riscos.push(montarNarrativaRiscoRuptura(lang, resultado.monteCarlo.probabilidadeRupturaCaixaPct));
    if (resultado.sensibilidade.length > 0) riscos.push(montarNarrativaSensibilidade(lang, resultado.sensibilidade));
    if (cenarioOtimista.lucroLiquidoMensal > cenarioBase.lucroLiquidoMensal * 1.15) {
      oportunidadesTxt.push(montarNarrativaOportunidadeCenario(lang, cenarioBase.lucroLiquidoMensal, cenarioOtimista.lucroLiquidoMensal));
    }
    if (melhorTributario) oportunidadesTxt.push(montarNarrativaRegimeTributario(lang, NOME_REGIME[melhorTributario.regime], economiaTributaria));
  }
  const nivelConfianca: "baixo" | "medio" | "alto" = !resultado ? "medio"
    : resultado.monteCarlo.probabilidadeRupturaCaixaPct > 30 ? "baixo"
    : resultado.monteCarlo.probabilidadeRupturaCaixaPct > 10 ? "medio" : "alto";
  const NIVEL_LABEL: Record<string, string> = { baixo: cx.simConfiancaBaixo, medio: cx.simConfiancaMedio, alto: cx.simConfiancaAlto };
  const NIVEL_COR: Record<string, string> = { baixo: CORES.vermelho, medio: CORES.amarelo, alto: CORES.verde };
  const planoAcao: string[] = [];
  if (resultado) {
    planoAcao.push(cx.simPlanoAcaoRevisarCusto);
    if (resultado.monteCarlo.probabilidadeRupturaCaixaPct > 15) planoAcao.push(cx.simPlanoAcaoAumentarReserva);
    if (cenarioOtimista && cenarioBase && cenarioOtimista.lucroLiquidoMensal > cenarioBase.lucroLiquidoMensal * 1.15) planoAcao.push(cx.simPlanoAcaoAproveitarOportunidade);
    if (resultado.monteCarlo.probabilidadeRupturaCaixaPct <= 15 && riscos.length <= 1) planoAcao.push(cx.simPlanoAcaoManterMonitorando);
  }

  // ═══════════════════════ GRÁFICO — CENÁRIOS ═══════════════════════
  const NOME_CENARIO: Record<string, string> = { conservador: cx.invCenarioConservador ?? "", base: cx.invCenarioBase ?? "", otimista: cx.invCenarioOtimista ?? "", adverso: cx.invCenarioAdverso ?? "" };
  const optCenarios = resultado ? optBarrasV(
    resultado.cenarios.map((c) => c.lucroLiquidoMensal),
    resultado.cenarios.map((c) => NOME_CENARIO[c.nome] || c.nome),
    CORES.indigo, "#a5b4fc",
  ) : null;

  const marquee = [
    "🚀 AXIOMA AI.TECH",
    `${cx.simPontoPartidaTitulo}: ${fBRL(receitaMensalMedia)}/${idioma === "pt" ? "mês" : idioma === "en" ? "mo" : "mes"}`,
    resultado && cenarioBase ? `${cx.simCenariosTitulo}: ${fBRL(cenarioBase.lucroLiquidoMensal)}` : "",
    resultado ? `🎲 ${cx.simProbLucroPositivo}: ${fPct(resultado.monteCarlo.probabilidadeLucroPositivoPct)}` : "",
  ].filter(Boolean);

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: txt.titulo, subtitulo: txt.subtitulo,
        colunas: [
          { header: "Cenário", key: "nome", width: 3 },
          { header: "Lucro Líquido/Mês", key: "lucro", width: 3, align: "right" },
          { header: "Saldo de Caixa (horizonte)", key: "saldo", width: 3, align: "right" },
        ],
        linhas: (resultado?.cenarios || []).map((c) => ({
          nome: NOME_CENARIO[c.nome] || c.nome, lucro: fmtN(c.lucroLiquidoMensal), saldo: fmtN(c.saldoCaixaProjetado),
        })),
        resumo: resultado ? [
          { label: cx.simProbLucroPositivo, valor: `${resultado.monteCarlo.probabilidadeLucroPositivoPct.toFixed(1)}%` },
          { label: cx.simProbRupturaCaixa, valor: `${resultado.monteCarlo.probabilidadeRupturaCaixaPct.toFixed(1)}%` },
          { label: cx.simNivelConfiancaLabel, valor: NIVEL_LABEL[nivelConfianca] },
        ] : [],
        nomeArquivo: `axioma-simulacoes-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${txt.titulo}`,
    resultado && cenarioBase ? `💰 ${cx.simCenariosTitulo} (${cx.invCenarioBase}): ${fBRL(cenarioBase.lucroLiquidoMensal)}/mês` : "",
    resultado ? `🎲 ${cx.simProbLucroPositivo}: ${fPct(resultado.monteCarlo.probabilidadeLucroPositivoPct)}` : "",
    resultado ? `⚠️ ${cx.simProbRupturaCaixa}: ${fPct(resultado.monteCarlo.probabilidadeRupturaCaixaPct)}` : "",
    "_axiomaai.com.br_",
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${txt.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: `1px solid ${CORES.indigo}30`, color: "#c8d8f0" };

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={CORES.indigo} lang={lang} />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {!temDadosSimulacao ? (
          <CanvasBox cor={CORES.indigo}>
            <div className="flex flex-col items-center justify-center py-16">
              <Sliders size={48} style={{ color: "#2e2a5a" }} className="mb-4" />
              <p className="text-sm text-center" style={{ color: "#5a7a9a" }}>{cx.simSemDados}</p>
            </div>
          </CanvasBox>
        ) : (
          <>
            {/* PONTO DE PARTIDA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}35` }}>
              <div className="flex items-center gap-2 mb-1">
                <Landmark size={16} style={{ color: CORES.indigo }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simPontoPartidaTitulo}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simPontoPartidaSub}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { l: cx.simReceitaMensalLabel, v: fBRL(receitaMensalMedia) },
                  { l: cx.simCustoFixoMensalLabel, v: fBRL(custoFixoMensalTotal) },
                  { l: cx.simCustoVariavelMensalLabel, v: fBRL(custoVariavelMensalMedia) },
                  { l: cx.simDividaTotalLabel, v: fBRL(dividaTotal) },
                  { l: cx.simCaixaDisponivelLabel, v: fBRL(caixaDisponivel) },
                  { l: cx.simRegimeAtualLabel, v: regimeTributario || "—" },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{m.l}</p>
                    <p className="text-xs md:text-sm font-black truncate" style={{ color: PRATAC }}>{m.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* INDICADORES DE MERCADO */}
            {macro && (
              <div className="rounded-2xl p-3 md:p-4" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <Percent size={14} style={{ color: CORES.indigo }} />
                    <p className="text-xs font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invIndicadoresMacro}</p>
                  </div>
                  <p className="text-[9px]" style={{ color: macro.fonte === "bcb" ? "#64748b" : CORES.amarelo }}>{macro.fonte === "bcb" ? cx.invFonteBcb : cx.invFonteFallback}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { l: cx.invSelic, v: fPct(macro.selic) }, { l: cx.invCdi, v: fPct(macro.cdi) },
                    { l: cx.invIpca, v: fPct(macro.ipca12m) }, { l: cx.invDolar, v: `R$ ${macro.usdBrl.toFixed(2)}` },
                  ].map((m, i) => (
                    <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{m.l}</p>
                      <p className="text-sm font-black" style={{ color: "#a5b4fc" }}>{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Letreiro */}
            {resultado && (
              <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(99,102,241,0.16), rgba(148,163,184,0.10))", border: "1px solid rgba(99,102,241,0.28)" }}>
                <div className="marquee-sim py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                  {[0, 1].map((rep) => (
                    <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                      {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#a5b4fc" : "#e2e8f0" }}>{m}<span style={{ color: CORES.indigo }}>{"  •  "}</span></span>))}
                    </span>
                  ))}
                </div>
                <style>{`.marquee-sim{animation:marqueeSim 30s linear infinite}@keyframes marqueeSim{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-sim:hover{animation-play-state:paused}`}</style>
              </div>
            )}

            {/* OBJETIVOS RÁPIDOS */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <Target size={16} style={{ color: CORES.indigo }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simObjetivosTitulo}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simObjetivosSub}</p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => aplicarPreset("dobrarFaturamento")}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${CORES.indigo}40`, color: "#a5b4fc" }}>
                  {cx.simObjDobrarFaturamento}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={aplicarPresetTriplicarLucro}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${CORES.indigo}40`, color: "#a5b4fc" }}>
                  {cx.simObjTriplicarLucro}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => aplicarPreset("melhorarFluxoCaixa")}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${CORES.indigo}40`, color: "#a5b4fc" }}>
                  {cx.simObjMelhorarFluxoCaixa}
                </motion.button>
                <div className="flex items-center gap-1.5 rounded-xl pl-3 pr-1.5 py-1" style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${CORES.indigo}40` }}>
                  <button onClick={() => aplicarPreset("reduzirCustos")} className="text-xs font-bold" style={{ color: "#a5b4fc" }}>{cx.simObjReduzirCustos}</button>
                  <input type="number" value={reduzirCustosPct} onChange={(e) => setReduzirCustosPct(e.target.value)}
                    className="w-12 px-1.5 py-1 rounded-lg text-xs text-center focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }} />
                  <span className="text-[10px]" style={{ color: "#64748b" }}>%</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl pl-3 pr-1.5 py-1" style={{ background: "rgba(99,102,241,0.12)", border: `1px solid ${CORES.indigo}40` }}>
                  <button onClick={() => aplicarPreset("reduzirDivida")} className="text-xs font-bold" style={{ color: "#a5b4fc" }}>{cx.simObjReduzirDivida}</button>
                  <input type="number" value={reduzirJurosPontos} onChange={(e) => setReduzirJurosPontos(e.target.value)}
                    className="w-12 px-1.5 py-1 rounded-lg text-xs text-center focus:outline-none" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }} />
                  <span className="text-[10px]" style={{ color: "#64748b" }}>pts</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => aplicarPreset("crise")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(239,68,68,0.12)", border: `1px solid ${CORES.vermelho}40`, color: CORES.vermelhoC }}>
                  <Zap size={12} /> {cx.simPresetCrise}
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => aplicarPreset("expansao")}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(16,185,129,0.12)", border: `1px solid ${CORES.verde}40`, color: CORES.verdeC }}>
                  <Zap size={12} /> {cx.simPresetExpansao}
                </motion.button>
              </div>
            </div>

            {/* CHOQUES / MOTOR DE SIMULAÇÃO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={16} style={{ color: CORES.indigo }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invSimuladorTitulo}</p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.invSimuladorSub}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {[
                  { l: cx.invChoqueReceita, v: choqueReceita, set: setChoqueReceita },
                  { l: cx.invChoqueCustoFixo, v: choqueCustoFixo, set: setChoqueCustoFixo },
                  { l: cx.invChoqueCustoVariavel, v: choqueCustoVariavel, set: setChoqueCustoVariavel },
                  { l: cx.invChoqueJuros, v: choqueJuros, set: setChoqueJuros },
                  { l: cx.invChoqueAporte, v: choqueAporte, set: setChoqueAporte },
                  { l: cx.invChoqueRetornoAporte, v: choqueRetornoAporte, set: setChoqueRetornoAporte },
                  { l: cx.simHorizonteLabel, v: horizonteMeses, set: setHorizonteMeses },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#818cf8" }}>{f.l}</label>
                    <input type="number" value={f.v} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                  </div>
                ))}
              </div>

              {/* Câmbio — avançado, só entra na Análise de Sensibilidade se exposição > 0 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#818cf8" }}>{cx.simChoqueCambio}</label>
                  <input type="number" value={choqueCambio} onChange={(e) => setChoqueCambio(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#818cf8" }}>{cx.simExposicaoCambial}</label>
                  <input type="number" value={exposicaoCambial} onChange={(e) => setExposicaoCambial(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={rodarSimulacao}
                className="w-full py-3 rounded-xl text-sm font-bold"
                style={{ background: `linear-gradient(135deg, #312e81, ${CORES.indigo})`, color: "#fff" }}>
                {cx.simSimular}
              </motion.button>
            </div>

            {resultado && cenarioBase && (
              <>
                {/* CENÁRIOS */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} style={{ color: CORES.indigo }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simCenariosTitulo}</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simCenariosSub}</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    {resultado.cenarios.map((r) => {
                      const corCenario = r.nome === "otimista" ? CORES.verde : r.nome === "adverso" ? CORES.vermelho : r.nome === "base" ? CORES.indigo : CORES.amarelo;
                      return (
                        <div key={r.nome} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${corCenario}30` }}>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: corCenario }}>{NOME_CENARIO[r.nome]}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.invLucroLiquidoMensal}</p>
                          <p className="text-sm font-black mb-2" style={{ color: r.lucroLiquidoMensal >= 0 ? CORES.verde : CORES.vermelho }}>{fBRL(r.lucroLiquidoMensal)}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.invSaldoProjetado12m}</p>
                          <p className="text-sm font-black mb-2" style={{ color: r.saldoCaixaProjetado >= 0 ? "#e2e8f0" : CORES.vermelho }}>{fBRL(r.saldoCaixaProjetado)}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.invRunwayCritico}</p>
                          <p className="text-xs font-black" style={{ color: r.runwayMeses !== null ? CORES.vermelho : CORES.verde }}>{r.runwayMeses !== null ? `${r.runwayMeses}m` : cx.invSemRunway}</p>
                        </div>
                      );
                    })}
                  </div>
                  {optCenarios && <ReactECharts option={optCenarios} style={{ height: 220, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />}
                </div>

                {/* ANÁLISE DE SENSIBILIDADE */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} style={{ color: CORES.indigo }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simSensibilidadeTitulo}</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simSensibilidadeSub}</p>
                  <div className="space-y-2">
                    {resultado.sensibilidade.map((s) => (
                      <div key={s.driver} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{nomeDriverSensibilidade(lang, s.driver as DriverSensibilidade)}</p>
                          <p className="text-[10px] font-black" style={{ color: "#a5b4fc" }}>{fPct(s.pesoPct)} {cx.simPeso}</p>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.pesoPct)}%`, background: `linear-gradient(90deg, ${CORES.indigo}, #a5b4fc)` }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span style={{ color: CORES.vermelhoC }}>{cx.simDesfavoravel}: {fBRL(s.impactoDesfavoravelRS)}</span>
                          <span style={{ color: CORES.verdeC }}>{cx.simFavoravel}: {fBRL(s.impactoFavoravelRS)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MONTE CARLO */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Dices size={16} style={{ color: CORES.indigo }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simMonteCarloTitulo}</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simMonteCarloSub} ({resultado.monteCarlo.iteracoes.toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")} {cx.simIteracoes})</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.08)", border: `1px solid ${CORES.verde}30` }}>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{cx.simProbLucroPositivo}</p>
                      <p className="text-xl font-black" style={{ color: CORES.verde }}>{fPct(resultado.monteCarlo.probabilidadeLucroPositivoPct)}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: resultado.monteCarlo.probabilidadeRupturaCaixaPct > 15 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${resultado.monteCarlo.probabilidadeRupturaCaixaPct > 15 ? CORES.vermelho : "rgba(255,255,255,0.1)"}30` }}>
                      <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{cx.simProbRupturaCaixa}</p>
                      <p className="text-xl font-black" style={{ color: resultado.monteCarlo.probabilidadeRupturaCaixaPct > 15 ? CORES.vermelho : "#e2e8f0" }}>{fPct(resultado.monteCarlo.probabilidadeRupturaCaixaPct)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { l: "P10", v: resultado.monteCarlo.lucroLiquidoP10 }, { l: cx.simMediana, v: resultado.monteCarlo.lucroLiquidoP50 }, { l: "P90", v: resultado.monteCarlo.lucroLiquidoP90 },
                    ].map((m, i) => (
                      <div key={i} className="rounded-xl px-3 py-2 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{m.l}</p>
                        <p className="text-xs font-black" style={{ color: m.v >= 0 ? PRATAC : CORES.vermelhoC }}>{fBRL(m.v)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TRIBUTÁRIO */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: `1px solid ${CORES.indigo}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark size={16} style={{ color: CORES.indigo }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simTributarioTitulo}</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.simTributarioSub}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {resultado.tributario.map((t) => {
                      const isMelhor = melhorTributario?.regime === t.regime;
                      return (
                        <div key={t.regime} className="rounded-xl p-3" style={{ background: isMelhor ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${isMelhor ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.08)"}` }}>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-black" style={{ color: "#e2e8f0" }}>{NOME_REGIME[t.regime]}</p>
                            {isMelhor && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.15)", color: CORES.ouro }}>{cx.simRegimeMelhorTag}</span>}
                          </div>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.simImpostoMensalLabel}</p>
                          <p className="text-xs font-black mb-1.5" style={{ color: PRATAC }}>{fBRL(t.impostoMensal)}</p>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.simLucroLiquidoRegimeLabel}</p>
                          <p className="text-sm font-black" style={{ color: t.lucroLiquido >= 0 ? CORES.verde : CORES.vermelho }}>{fBRL(t.lucroLiquido)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CONSELHO EXECUTIVO */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(30,27,75,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} style={{ color: CORES.ouro }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.simConselhoTitulo}</p>
                  </div>
                  <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>{cx.simConselhoSub}</p>

                  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{cx.simResumoLabel}</p>
                  <p className="text-xs md:text-[13px] font-medium mb-4" style={{ color: "#e2e8f0" }}>{montarNarrativaMonteCarlo(lang, resultado.monteCarlo)}</p>

                  {riscos.length > 0 && (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.vermelhoC }}>{cx.simRiscosLabel}</p>
                      <div className="space-y-1.5 mb-4">
                        {riscos.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <AlertTriangle size={13} style={{ color: CORES.vermelhoC, flexShrink: 0, marginTop: 2 }} />
                            <p className="text-xs font-medium" style={{ color: "#fca5a5" }}>{r}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {oportunidadesTxt.length > 0 && (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.verdeC }}>{cx.simOportunidadesLabel}</p>
                      <div className="space-y-1.5 mb-4">
                        {oportunidadesTxt.map((o, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <Sparkles size={13} style={{ color: CORES.verdeC, flexShrink: 0, marginTop: 2 }} />
                            <p className="text-xs font-medium" style={{ color: "#6ee7b7" }}>{o}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: "#a5b4fc" }}>{cx.simPremissasLabel}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {[
                      { l: cx.simPremissaReceita, v: fBRL(receitaMensalMedia) },
                      { l: cx.simPremissaCustoFixo, v: fBRL(custoFixoMensalTotal) },
                      { l: cx.simPremissaCustoVariavel, v: fBRL(custoVariavelMensalMedia) },
                      { l: cx.invChoqueReceita, v: `${resultado.choque.receitaPct}%` },
                    ].map((p, i) => (
                      <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{p.l}</p>
                        <p className="text-xs font-black" style={{ color: PRATAC }}>{p.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#a5b4fc" }}>{cx.simNivelConfiancaLabel}</p>
                    <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${NIVEL_COR[nivelConfianca]}18`, color: NIVEL_COR[nivelConfianca] }}>{NIVEL_LABEL[nivelConfianca]}</span>
                  </div>

                  {planoAcao.length > 0 && (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{cx.simPlanoAcaoLabel}</p>
                      <div className="space-y-1.5 mb-4">
                        {planoAcao.map((a, i) => (
                          <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                            <ShieldCheck size={15} style={{ color: CORES.ouro, flexShrink: 0 }} />
                            <p className="text-xs md:text-[13px] font-medium" style={{ color: "#f0d878" }}>{a}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{cx.simLimitacoesLabel}</p>
                  <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#64748b" }}>{cx.simLimitacoesTexto}</p>
                  <p className="text-[10px] italic leading-relaxed" style={{ color: "#4b5563" }}>{cx.simTransparenciaTexto}</p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Centro de Compartilhamento */}
      <AnimatePresence>
        {shareAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-start justify-center pt-20 pb-8 z-50 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor={CORES.indigo}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#a5b4fc" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canais.map((c) => (
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
