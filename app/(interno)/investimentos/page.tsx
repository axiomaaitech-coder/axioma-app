"use client";
import { useState, useEffect } from "react";
import {
  TrendingUp, Trash2, X, Pencil, Share2, Sparkles, ShieldCheck, AlertTriangle,
  Wallet, PiggyBank, Landmark, Sliders, Layers, Plus,
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
  resolverPeriodo, montarDRE, semaforoSaude, optRosca,
  dividaEbitda,
  rentabilidadeLiquidaAnual, detectarCustoOportunidade, escadaLiquidezInvestimentos,
  detectarCapitalOcioso, calcularScoreInvestimento, calcularRadarRiscoInvestimento,
  gerarConselhoInvestimento, compararAlocacoes, simularCenariosExecutivos,
  type Lancamento, type Periodo, type PeriodoPreset, type DividaBase, type CorSaude,
  type TipoInvestimento, type Liquidez, type StatusInvestimento, type InvestimentoItem,
  type CategoriaAlocacao, type ParametroAlocacao, type ResultadoAlocacao, type ChoqueSimulador, type ResultadoCenario,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento,
  montarConselhoInvestimento, nomeCategoriaAlocacao, montarNarrativaAlocacao, montarNarrativaCenario,
} from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";
import { buscarIndicadoresMacro, type IndicadoresMacro } from "../../../lib/bcbApi";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type InvestimentoRow = {
  id: string; nome: string; valor: number; tipo: TipoInvestimento; data: string; rentabilidade: number;
  data_vencimento: string | null; indexador: string | null; instituicao: string | null;
  liquidez: Liquidez | null; status: StatusInvestimento | null;
};

const corTipo: Record<TipoInvestimento, string> = {
  renda_fixa: CORES.verde, renda_variavel: CORES.amarelo, criptomoeda: CORES.roxo, imovel: CORES.azul, outro: CORES.rosa,
};

function inicioJanela24m(ate: string): string {
  const d = new Date(ate + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() - 23, 1).toISOString().slice(0, 10);
}
function inicioRolling12(ate: string): string {
  const d = new Date(ate + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() - 11, 1).toISOString().slice(0, 10);
}
function mesesNoPeriodo(periodo: Periodo): number {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const dias = (fim.getTime() - ini.getTime()) / 86400000;
  return Math.max(1, Math.round(dias / 30));
}

// Bar chart local para valores em % (score/radar) — optBarrasV do alicerce formata em R$,
// unidade errada pra essas duas séries. Escopo pequeno demais pra virar helper do cfoCore.
function optBarrasPct(dados: number[], labels: string[], cores: string[]) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 40, right: 16, top: 24, bottom: 28, containLabel: false },
    tooltip: {
      backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
      textStyle: { color: "#e2e8f0", fontSize: 13 }, extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
      trigger: "item" as const, formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${p.value.toFixed(0)}%</b>`,
    },
    xAxis: { type: "category" as const, data: labels, axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false }, axisLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: 700, interval: 0, rotate: labels.some(l => l.length > 8) ? 20 : 0 } },
    yAxis: { type: "value" as const, max: 100, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" as const } }, axisLabel: { color: "#64748b", fontSize: 10, formatter: "{value}%" } },
    series: [{
      type: "bar" as const, barWidth: "50%",
      itemStyle: { borderRadius: [8, 8, 2, 2], color: (p: any) => cores[p.dataIndex] || CORES.azul },
      label: { show: true, position: "top" as const, distance: 6, color: "#f1f5f9", fontSize: 10, fontWeight: 800, formatter: (p: any) => `${p.value.toFixed(0)}%` },
      data: dados,
    }],
  };
}

export default function Investimentos() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [investimentos, setInvestimentos] = useState<InvestimentoRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<InvestimentoRow | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [analiseAberta, setAnaliseAberta] = useState(false);

  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<TipoInvestimento>("renda_fixa");
  const [data, setData] = useState("");
  const [rentabilidade, setRentabilidade] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [indexador, setIndexador] = useState("");
  const [instituicao, setInstituicao] = useState("");
  const [liquidez, setLiquidez] = useState<Liquidez>("no_vencimento");
  const [status, setStatus] = useState<StatusInvestimento>("ativo");

  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [dividasRows, setDividasRows] = useState<{ descricao: string; valor_total: number; valor_pago: number; taxa_juros: number }[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<{ tipo: string; valor: number; status: string }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");
  const [macro, setMacro] = useState<IndicadoresMacro | null>(null);

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));
  const periodo = resolverPeriodo(presetPeriodo, personalizado);

  // ═══════════════════════ FASE 2 — CAPITAL ALLOCATION ENGINE ═══════════════════════
  const [opcoesAlocacao, setOpcoesAlocacao] = useState<ParametroAlocacao[]>([]);
  const [novaCategoria, setNovaCategoria] = useState<CategoriaAlocacao>("cdb");
  const [novoValorAlocacao, setNovoValorAlocacao] = useState("");
  const [novoRetornoPct, setNovoRetornoPct] = useState("");
  const [novoGanhoMensal, setNovoGanhoMensal] = useState("");

  // ═══════════════════════ FASE 2 — SIMULADOR EXECUTIVO ═══════════════════════
  const [choqueReceita, setChoqueReceita] = useState("0");
  const [choqueCustoFixo, setChoqueCustoFixo] = useState("0");
  const [choqueCustoVariavel, setChoqueCustoVariavel] = useState("0");
  const [choqueJuros, setChoqueJuros] = useState("0");
  const [choqueAporte, setChoqueAporte] = useState("0");
  const [choqueRetornoAporte, setChoqueRetornoAporte] = useState("0");
  const [cenarios, setCenarios] = useState<ResultadoCenario[] | null>(null);

  const CATEGORIAS_FINANCEIRAS: CategoriaAlocacao[] = ["cdb", "tesouro", "fundos", "debentures"];

  const txt = {
    titulo: idioma === "pt" ? "Investimentos" : idioma === "en" ? "Investments" : "Inversiones",
    subtitulo: idioma === "pt" ? "Centro de Inteligência para Alocação de Capital" : idioma === "en" ? "Capital Allocation Intelligence Center" : "Centro de Inteligencia para Asignación de Capital",
    novo: idioma === "pt" ? "Novo Investimento" : idioma === "en" ? "New Investment" : "Nueva Inversión",
    editar: idioma === "pt" ? "Editar Investimento" : idioma === "en" ? "Edit Investment" : "Editar Inversión",
    totalInvestido: idioma === "pt" ? "Total Investido" : idioma === "en" ? "Total Invested" : "Total Invertido",
    semInv: idioma === "pt" ? "Nenhum investimento cadastrado." : idioma === "en" ? "No investments yet." : "Sin inversiones aún.",
    ativos: idioma === "pt" ? "Ativos" : idioma === "en" ? "Assets" : "Activos",
    melhorRent: idioma === "pt" ? "Melhor Rent." : idioma === "en" ? "Best Return" : "Mejor Rent.",
    buscar: idioma === "pt" ? "Buscar investimento..." : idioma === "en" ? "Search investment..." : "Buscar inversión...",
    nomeLabel: idioma === "pt" ? "Nome" : idioma === "en" ? "Name" : "Nombre",
    valorLabel: idioma === "pt" ? "Valor" : idioma === "en" ? "Value" : "Valor",
    dataLabel: idioma === "pt" ? "Data da Aplicação" : idioma === "en" ? "Investment Date" : "Fecha de Inversión",
    rentLabel: idioma === "pt" ? "Rentabilidade % a.a." : idioma === "en" ? "Return % p.a." : "Rentabilidad % anual",
    tipoLabel: idioma === "pt" ? "Tipo" : idioma === "en" ? "Type" : "Tipo",
    salvarBtn: idioma === "pt" ? "Salvar" : idioma === "en" ? "Save" : "Guardar",
    cancelarBtn: idioma === "pt" ? "Cancelar" : idioma === "en" ? "Cancel" : "Cancelar",
  };

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);
  useEffect(() => { buscarIndicadoresMacro().then(setMacro); }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const inicioHist = inicioJanela24m(periodo.fim);

    const [{ data: inv }, { data: rec }, { data: cf }, { data: cv }, { data: dv }, { data: fc }, { data: emp }] = await Promise.all([
      supabase.from("investimentos").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", periodo.fim),
      // Leitura só (SELECT) — nunca escreve em dividas. Base do custo de oportunidade real.
      supabase.from("dividas").select("descricao, valor_total, valor_pago, taxa_juros").eq("user_id", user.id),
      // Todo o histórico realizado — mesma definição de "caixa disponível" do Fluxo de Caixa.
      supabase.from("fluxo_caixa").select("tipo, valor, status").eq("user_id", user.id),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    setInvestimentos(inv || []);
    setReceitasRows(rec || []);
    setCustosFixosRows(cf || []);
    setCustosVarRows(cv || []);
    setDividasRows(dv || []);
    setFluxoCaixaRows(fc || []);
    setRegimeTributario(emp?.regime_tributario || "");
    setCarregando(false);
  };

  function limparCampos() {
    setNome(""); setValor(""); setTipo("renda_fixa"); setData(""); setRentabilidade("");
    setDataVencimento(""); setIndexador(""); setInstituicao(""); setLiquidez("no_vencimento"); setStatus("ativo");
  }

  function abrirNovo() {
    setEditando(null); limparCampos(); setErroModal(null); setModalAberto(true);
  }

  function abrirEdicao(inv: InvestimentoRow) {
    setEditando(inv); setNome(inv.nome); setValor(String(inv.valor)); setTipo(inv.tipo);
    setData(inv.data); setRentabilidade(String(inv.rentabilidade || ""));
    setDataVencimento(inv.data_vencimento || ""); setIndexador(inv.indexador || "");
    setInstituicao(inv.instituicao || ""); setLiquidez(inv.liquidez || "no_vencimento"); setStatus(inv.status || "ativo");
    setErroModal(null); setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false); setEditando(null); setErroModal(null); limparCampos();
  }

  async function salvar() {
    if (!nome || !valor || !data) return;
    setSalvando(true); setErroModal(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = {
      nome, valor: parseFloat(valor), tipo, data, rentabilidade: parseFloat(rentabilidade || "0"),
      data_vencimento: dataVencimento || null, indexador: indexador || null,
      instituicao: instituicao || null, liquidez, status,
    };
    const { error } = editando
      ? await supabase.from("investimentos").update(payload).eq("id", editando.id)
      : await supabase.from("investimentos").insert({ ...payload, user_id: user.id });

    if (error) { setErroModal(error.message); setSalvando(false); return; }
    fecharModal(); setSalvando(false); await carregarTudo();
  }

  async function excluir(id: string) {
    await supabase.from("investimentos").delete().eq("id", id);
    setInvestimentos(investimentos.filter((i) => i.id !== id));
  }

  const investimentosFiltrados = investimentos.filter((i) => i.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalInvestido = investimentos.reduce((s, i) => s + (i.valor || 0), 0);
  const melhorRent = investimentos.length > 0 ? Math.max(...investimentos.map((i) => i.rentabilidade || 0)) : 0;

  // ═══════════════════════ INTELIGÊNCIA CFO ═══════════════════════
  const itens: InvestimentoItem[] = investimentos.map((i) => ({
    id: i.id, nome: i.nome, valor: Number(i.valor || 0), tipo: i.tipo, data: i.data,
    rentabilidade: Number(i.rentabilidade || 0), data_vencimento: i.data_vencimento,
    indexador: i.indexador, instituicao: i.instituicao, liquidez: i.liquidez, status: i.status || "ativo",
  }));
  const ativos = itens.filter((i) => i.status !== "resgatado");
  const temDados = ativos.length > 0;
  const capitalInvestido = ativos.reduce((s, i) => s + i.valor, 0);

  const caixaDisponivel = fluxoCaixaRows.filter((l) => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);
  const patrimonioTotal = caixaDisponivel + capitalInvestido;

  const meses = mesesNoPeriodo(periodo);
  const receitasItens: Lancamento[] = receitasRows.map((r) => ({ valor: r.valor, data: r.data }));
  const receitaBrutaPeriodo = receitasItens.reduce((s, r) => s + r.valor, 0);
  const receitaMensalMedia = receitaBrutaPeriodo / meses;
  const custoVarPeriodo = custosVarRows.reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);
  const custoOperacionalMensal = custoFixoMensalTotal + custoVarPeriodo / meses;

  const dividaTotal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
  const despesasFinanceirasMensal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago) * (d.taxa_juros / 100), 0);
  const inicioRb12 = inicioRolling12(periodo.fim);
  const rb12 = receitasItens.filter((r) => r.data >= inicioRb12 && r.data <= periodo.fim).reduce((s, r) => s + r.valor, 0);
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, rb12, receitaMensalMedia);
  const dreEstimado = montarDRE({
    receitaBruta: receitaBrutaPeriodo, deducoes: impostoMensalEstimado * meses,
    custoVariavel: custoVarPeriodo, custoFixo: custoFixoMensalTotal * meses, despesasFinanceiras: despesasFinanceirasMensal * meses,
  });
  const ebitdaAnualizado = (dreEstimado.ebitda.valor / meses) * 12;
  const dividaEbitdaX = dividaEbitda(dividaTotal, ebitdaAnualizado);

  const dividasBase: DividaBase[] = dividasRows.map((d) => ({ descricao: d.descricao, valor_total: d.valor_total, valor_pago: d.valor_pago, parcelas: 1, vencimento: "", taxa_juros: d.taxa_juros }));

  const cdiAtual = macro?.cdi ?? 0;
  const cdiMensalPct = cdiAtual > 0 ? (Math.pow(1 + cdiAtual / 100, 1 / 12) - 1) * 100 : 0;

  // ═══════════════════════ FASE 2 — CUSTO DE CAPITAL DA EMPRESA ═══════════════════════
  // Referência única pro Allocation Engine: a taxa da dívida mais cara ativa (o que a empresa
  // já paga hoje) ou o CDI se não houver dívida — mesma régua do custo de oportunidade.
  const dividasComSaldo = dividasBase.filter((d) => d.valor_total - d.valor_pago > 0 && d.taxa_juros > 0);
  const taxaMaisCaraAM = dividasComSaldo.length ? Math.max(...dividasComSaldo.map((d) => d.taxa_juros)) : 0;
  const custoCapitalAnualPct = dividasComSaldo.length ? (Math.pow(1 + taxaMaisCaraAM / 100, 12) - 1) * 100 : cdiAtual;

  function adicionarOpcaoAlocacao() {
    if (!novoValorAlocacao) return;
    const valorNum = parseFloat(novoValorAlocacao);
    const financeira = CATEGORIAS_FINANCEIRAS.includes(novaCategoria);
    const opcao: ParametroAlocacao = {
      id: `${Date.now()}`, categoria: novaCategoria, valor: valorNum,
      retornoMensalPct: financeira ? parseFloat(novoRetornoPct || "0") : undefined,
      ganhoMensalEstimado: !financeira
        ? (novaCategoria === "reducao_divida" ? valorNum * (taxaMaisCaraAM / 100) : parseFloat(novoGanhoMensal || "0"))
        : undefined,
    };
    setOpcoesAlocacao([...opcoesAlocacao, opcao]);
    setNovoValorAlocacao(""); setNovoRetornoPct(""); setNovoGanhoMensal("");
  }

  function removerOpcaoAlocacao(id: string) {
    setOpcoesAlocacao(opcoesAlocacao.filter((o) => o.id !== id));
  }

  const resultadosAlocacao = compararAlocacoes(opcoesAlocacao, { custoCapitalAnualPct });

  function simularCenariosClick(prefillAporte?: number, prefillRetorno?: number) {
    const choque: ChoqueSimulador = {
      receitaPct: parseFloat(choqueReceita || "0"), custoFixoPct: parseFloat(choqueCustoFixo || "0"),
      custoVariavelPct: parseFloat(choqueCustoVariavel || "0"), jurosDividaPontos: parseFloat(choqueJuros || "0"),
      aporteCapital: prefillAporte ?? parseFloat(choqueAporte || "0"),
      retornoMensalAporte: prefillRetorno ?? parseFloat(choqueRetornoAporte || "0"),
    };
    const aliquotaEfetivaPct = receitaMensalMedia > 0 ? (impostoMensalEstimado / receitaMensalMedia) * 100 : 0;
    const resultado = simularCenariosExecutivos({
      receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
      custoVariavelMensalAtual: custoVarPeriodo / meses, despesasFinanceirasMensalAtual: despesasFinanceirasMensal,
      dividaTotalAtual: dividaTotal, aliquotaEfetivaPct, saldoCaixaAtual: caixaDisponivel, choque, horizonteMeses: 12,
    });
    setCenarios(resultado);
  }

  function simularOportunidade(r: ResultadoAlocacao) {
    setChoqueAporte(String(r.valor)); setChoqueRetornoAporte(String(r.retornoMensalRS));
    simularCenariosClick(r.valor, r.retornoMensalRS);
  }

  const temDadosFinanceiros = receitaMensalMedia > 0 || custoFixoMensalTotal > 0;

  const oportunidades = temDados ? detectarCustoOportunidade(ativos, dividasBase) : [];
  const capitalOcioso = detectarCapitalOcioso(caixaDisponivel, custoOperacionalMensal, cdiMensalPct);

  const escada = escadaLiquidezInvestimentos(ativos, 12).map((b, i) => (i === 12 ? { ...b, label: "12m+" } : b));
  const liquidezImediataPct = capitalInvestido > 0 ? (escada[0].valor / capitalInvestido) * 100 : 0;
  const liquidez12mPct = capitalInvestido > 0 ? (escada.reduce((s, b) => s + b.valor, 0) / capitalInvestido) * 100 : 0;

  const porTipoMap: Record<string, number> = {};
  ativos.forEach((i) => { porTipoMap[i.tipo] = (porTipoMap[i.tipo] || 0) + i.valor; });
  const tipoMaisConcentrado = Object.entries(porTipoMap).sort((a, b) => b[1] - a[1])[0];
  const concentracaoTipoPct = capitalInvestido > 0 && tipoMaisConcentrado ? (tipoMaisConcentrado[1] / capitalInvestido) * 100 : 0;

  const porInstMap: Record<string, number> = {};
  ativos.forEach((i) => { const k = i.instituicao || "—"; porInstMap[k] = (porInstMap[k] || 0) + i.valor; });
  const instMaisConcentrada = Object.entries(porInstMap).sort((a, b) => b[1] - a[1])[0];
  const concentracaoInstituicaoPct = capitalInvestido > 0 && instMaisConcentrada ? (instMaisConcentrada[1] / capitalInvestido) * 100 : 0;

  const pctRendaVariavelCripto = capitalInvestido > 0 ? ((porTipoMap["renda_variavel"] || 0) + (porTipoMap["criptomoeda"] || 0)) / capitalInvestido * 100 : 0;

  const rentabilidadeMediaLiquidaAA = capitalInvestido > 0
    ? ativos.reduce((s, i) => s + rentabilidadeLiquidaAnual(i) * i.valor, 0) / capitalInvestido
    : 0;

  const radarRisco = calcularRadarRiscoInvestimento({
    concentracaoTipoPct, concentracaoInstituicaoPct, liquidezImediataPct, dividaEbitdaX, pctRendaVariavelCripto,
  });
  const exposicaoRiscoPct = radarRisco.reduce((s, r) => s + r.score, 0) / radarRisco.length;
  const corExposicao = semaforoSaude(radarRisco);

  const score = calcularScoreInvestimento({
    concentracaoTipoPct, liquidezImediataPct, rentabilidadeMediaLiquidaAA, cdiAtual,
    capitalOciosoPct: caixaDisponivel > 0 ? ((capitalOcioso?.valor || 0) / caixaDisponivel) * 100 : 0,
    custoOportunidadeAtivo: oportunidades.length > 0,
  });
  const scoreNivelLabel: Record<string, string> = { critico: cx.invScoreCritico, atencao: cx.invScoreAtencao, bom: cx.invScoreBom, excelente: cx.invScoreExcelente };

  const gatilhos = temDados ? gerarConselhoInvestimento({
    oportunidades, capitalOcioso, concentracaoTipoPct,
    tipoMaisConcentrado: tipoMaisConcentrado ? (cx as any)[`invTipo${tipoMaisConcentrado[0].split("_").map(w => w[0].toUpperCase() + w.slice(1)).join("")}`] || tipoMaisConcentrado[0] : "",
    rentabilidadeMediaLiquidaAA, cdiAtual,
  }) : [];
  const conselhos = gatilhos.map((g) => montarConselhoInvestimento(lang, g));

  // ═══════════════════════ GRÁFICOS ═══════════════════════
  const NOME_TIPO: Record<TipoInvestimento, string> = {
    renda_fixa: cx.invTipoRendaFixa, renda_variavel: cx.invTipoRendaVariavel, criptomoeda: cx.invTipoCriptomoeda, imovel: cx.invTipoImovel, outro: cx.invTipoOutro,
  };
  const composicaoTipo = (Object.keys(porTipoMap) as TipoInvestimento[]).map((tp) => ({ name: NOME_TIPO[tp] || tp, value: porTipoMap[tp], color: corTipo[tp] || CORES.azul }));
  const optComposicaoTipo = optRosca(composicaoTipo, CORES.azul, cx.total);

  const PALETA_INST = [CORES.azul, CORES.ouro, CORES.verde, CORES.rosa, CORES.laranja, CORES.cyan, CORES.roxo];
  const composicaoInst = Object.entries(porInstMap).map(([nome, valor], i) => ({ name: nome, value: valor, color: PALETA_INST[i % PALETA_INST.length] }));
  const optComposicaoInst = optRosca(composicaoInst, CORES.ouro, cx.total);

  const RISCO_LABEL: Record<string, string> = {
    concentracaoTipo: cx.invRiscoConcentracaoTipo, concentracaoInstituicao: cx.invRiscoConcentracaoInstituicao,
    liquidez: cx.invRiscoLiquidez, iliquidezEndividada: cx.invRiscoIliquidezEndividada, volatilidade: cx.invRiscoVolatilidade,
  };
  const CORHEX: Record<CorSaude, string> = { verde: CORES.verde, amarelo: CORES.amarelo, vermelho: CORES.vermelho };
  const optRadarRisco = optBarrasPct(radarRisco.map(r => r.score), radarRisco.map(r => RISCO_LABEL[r.chave]), radarRisco.map(r => CORHEX[r.cor]));

  const SUB_LABEL: Record<string, string> = { diversificacao: cx.invDiversificacao, liquidez: cx.invLiquidezImediata, rentabilidade: cx.invRentabilidadeConsolidada, caixa: cx.invCaixaDisponivel, eficiencia: cx.invCustoOportunidadeTitulo };
  const optScoreBreakdown = optBarrasPct(score.subscores.map(s => s.valor), score.subscores.map(s => SUB_LABEL[s.chave] || s.chave), score.subscores.map(() => CORES.azul));

  const escadaLabels = escada.map((b) => b.label);
  const escadaValores = escada.map((b) => b.valor);

  const kpisCFO = [
    { l: cx.invScoreTitulo, v: `${score.total}`, c: score.cor === "verde" ? CORES.verde : score.cor === "amarelo" ? CORES.amarelo : CORES.vermelho, i: "🏆" },
    { l: cx.invRentabilidadeConsolidada, v: fPct(rentabilidadeMediaLiquidaAA), c: cdiAtual > 0 && rentabilidadeMediaLiquidaAA >= cdiAtual ? CORES.verde : CORES.amarelo, i: "📈" },
    { l: cx.invLiquidezImediata, v: fPct(liquidezImediataPct), c: liquidezImediataPct >= 40 ? CORES.verde : liquidezImediataPct >= 20 ? CORES.amarelo : CORES.vermelho, i: "💧" },
    { l: cx.invExposicaoRisco, v: fPct(exposicaoRiscoPct), c: corExposicao === "verde" ? CORES.verde : corExposicao === "amarelo" ? CORES.amarelo : CORES.vermelho, i: "⚠️" },
    { l: cx.invCapitalOcioso, v: capitalOcioso ? fBRL(capitalOcioso.valor) : fBRL(0), c: capitalOcioso ? CORES.vermelho : CORES.verde, i: "💤" },
    { l: cx.invDiversificacao, v: fPct(Math.max(0, 100 - concentracaoTipoPct)), c: concentracaoTipoPct > 70 ? CORES.vermelho : concentracaoTipoPct > 50 ? CORES.amarelo : CORES.verde, i: "🧩" },
  ];

  const marquee = [
    "🚀 AXIOMA AI.TECH", `${cx.invPatrimonioTotal} ${fBRL(patrimonioTotal)}`,
    `${cx.invScoreTitulo}: ${score.total}`, `${cx.invRentabilidadeConsolidada}: ${fPct(rentabilidadeMediaLiquidaAA)}`,
    oportunidades[0] ? `⚡ ${fBRL(oportunidades[0].economiaMensalEstimada)}/mês` : "",
  ].filter(Boolean);

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: txt.titulo, subtitulo: txt.subtitulo,
        colunas: [
          { header: "Ativo", key: "nome", width: 4 },
          { header: "Tipo", key: "tipo", width: 3 },
          { header: "Instituição", key: "inst", width: 3 },
          { header: "Vencimento", key: "venc", width: 2 },
          { header: "Rentab. Líq.", key: "rent", width: 2, align: "right" },
          { header: "Valor (R$)", key: "valor", width: 3, align: "right" },
        ],
        linhas: investimentosFiltrados.map((i) => ({
          nome: i.nome, tipo: NOME_TIPO[i.tipo] || i.tipo, inst: i.instituicao || "—",
          venc: i.data_vencimento ? new Date(i.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—",
          rent: `${rentabilidadeLiquidaAnual({ tipo: i.tipo, rentabilidade: i.rentabilidade, data: i.data }).toFixed(1)}% a.a.`,
          valor: fmtN(i.valor || 0),
        })),
        resumo: [
          { label: txt.totalInvestido, valor: `R$ ${fmtN(totalInvestido)}` },
          { label: cx.invPatrimonioTotal, valor: `R$ ${fmtN(patrimonioTotal)}` },
          { label: cx.invScoreTitulo, valor: `${score.total} (${scoreNivelLabel[score.nivel]})` },
          { label: cx.invRentabilidadeConsolidada, valor: `${rentabilidadeMediaLiquidaAA.toFixed(1)}% a.a.` },
        ],
        nomeArquivo: `axioma-investimentos-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${txt.titulo}`,
    `💰 ${cx.invPatrimonioTotal}: ${fBRL(patrimonioTotal)}`,
    `🏆 ${cx.invScoreTitulo}: ${score.total} (${scoreNivelLabel[score.nivel]})`,
    `📈 ${cx.invRentabilidadeConsolidada}: ${fPct(rentabilidadeMediaLiquidaAA)}`,
    oportunidades[0] ? `⚡ ${conselhos[0]}` : "",
    "_axiomaai.com.br_",
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${txt.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

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
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={CORES.azul} lang={lang} />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: txt.totalInvestido, value: fBRL(totalInvestido), cor: CORES.azul },
            { label: txt.ativos, value: `${investimentos.length}`, cor: CORES.ouro },
            { label: txt.melhorRent, value: `${melhorRent}% a.a.`, cor: CORES.verde },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {!temDados ? (
          <CanvasBox cor={CORES.azul}>
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
              <p className="text-sm text-center" style={{ color: "#5a7a9a" }}>{cx.invSemDados}</p>
            </div>
          </CanvasBox>
        ) : (
          <>
            {/* RADAR DE RISCOS — semáforo resumo */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${corExposicao === "verde" ? "rgba(16,185,129,0.3)" : corExposicao === "amarelo" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} style={{ color: CORES.azul }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invRadarRiscoTitulo}</p>
                <span className="inline-block rounded-full flex-shrink-0" style={{ width: 14, height: 14, background: CORHEX[corExposicao], boxShadow: `0 0 10px ${CORHEX[corExposicao]}` }} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {radarRisco.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <span className="inline-block rounded-full flex-shrink-0" style={{ width: 9, height: 9, background: CORHEX[r.cor] }} />
                    <p className="text-xs font-medium" style={{ color: "#cbd5e1" }}>{RISCO_LABEL[r.chave]}</p>
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

            {/* INDICADORES DE MERCADO (BCB) */}
            {macro && (
              <div className="rounded-2xl p-3 md:p-4" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(59,130,246,0.2)" }}>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <Landmark size={14} style={{ color: CORES.azul }} />
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
                      <p className="text-sm font-black" style={{ color: CORES.azulC }}>{m.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.14), rgba(212,175,55,0.10))", border: "1px solid rgba(59,130,246,0.24)" }}>
              <div className="marquee-inv py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map((rep) => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? CORES.azulC : "#e2e8f0" }}>{m}<span style={{ color: CORES.azul }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-inv{animation:marqueeInv 30s linear infinite}@keyframes marqueeInv{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-inv:hover{animation-play-state:paused}`}</style>
            </div>

            {/* ESCADA DE LIQUIDEZ */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} style={{ color: CORES.azul }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invEscadaLiquidezTitulo}</p>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#e2e8f0" }}>
                {fPct(liquidez12mPct)} {idioma === "pt" ? "do capital investido libera nos próximos 12 meses." : idioma === "en" ? "of invested capital frees up over the next 12 months." : "del capital invertido se libera en los próximos 12 meses."}
              </p>
              <SubChart titulo={cx.invEscadaLiquidezTitulo} cor={CORES.azul} option={{
                backgroundColor: "transparent", animationDuration: 900,
                grid: { left: 52, right: 16, top: 20, bottom: 28 },
                tooltip: { backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14], textStyle: { color: "#e2e8f0", fontSize: 13 }, extraCssText: "border-radius:12px;", trigger: "item" as const, formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${CORES.azulC}">${fBRL(p.value)}</b>` },
                xAxis: { type: "category" as const, data: escadaLabels, axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false }, axisLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: 700 } },
                yAxis: { type: "value" as const, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" as const } }, axisLabel: { color: "#64748b", fontSize: 10 } },
                series: [{ type: "bar" as const, barWidth: "58%", itemStyle: { borderRadius: [8, 8, 2, 2], color: CORES.azul, shadowColor: CORES.azul + "55", shadowBlur: 12 }, data: escadaValores }],
              }} altura={220} />
            </div>

            {/* CUSTO DE OPORTUNIDADE vs DÍVIDA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${oportunidades.length ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.2)"}` }}>
              <div className="flex items-center gap-2 mb-3">
                {oportunidades.length ? <AlertTriangle size={16} style={{ color: CORES.vermelho }} /> : <PiggyBank size={16} style={{ color: CORES.azul }} />}
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invCustoOportunidadeTitulo}</p>
              </div>
              {oportunidades.length > 0 ? (
                <div className="space-y-2">
                  {oportunidades.slice(0, 5).map((o, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: "#fca5a5" }}>{montarConselhoInvestimento(lang, { tipo: "resgatarEQuitar", oportunidade: o })}</p>
                      <p className="text-sm font-black flex-shrink-0" style={{ color: CORES.vermelho }}>{fBRL(o.economiaMensalEstimada)}/m</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{cx.invSemOportunidade}</p>
              )}
            </div>

            {/* MODAL ÚNICO — abre a Análise de Investimentos */}
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setAnaliseAberta(true)}
              className="w-full rounded-2xl overflow-hidden text-left"
              style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5 flex items-center gap-3">
                <span className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: "linear-gradient(180deg,#3b82f6,#d4af37)", boxShadow: "0 0 12px #3b82f6" }} />
                <div>
                  <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.invModalAnaliseTitulo}</p>
                  <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>{cx.invModalAnaliseSub}</p>
                </div>
              </div>
            </motion.button>

            {/* CONSELHO CFO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invConselhoTitulo}</p>
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
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{cx.invSemGatilho}</p>
              )}
            </div>
          </>
        )}

        {/* ═══════════════════════ FASE 2 — CAPITAL ALLOCATION ENGINE + SIMULADOR EXECUTIVO ═══════════════════════ */}
        {temDadosFinanceiros && (
          <>
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(59,130,246,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Layers size={16} style={{ color: CORES.azul }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invAllocationTitulo}</p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.invAllocationSub}</p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <select value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value as CategoriaAlocacao)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,130,246,0.2)", color: "#c8d8f0" }}>
                  {(["cdb", "tesouro", "fundos", "debentures", "expansao", "equipamento", "marketing", "contratacao", "automacao", "reducao_divida"] as CategoriaAlocacao[]).map((c) => (
                    <option key={c} value={c}>{nomeCategoriaAlocacao(lang, c)}</option>
                  ))}
                </select>
                <input type="number" placeholder={cx.invValorAlocarLabel} value={novoValorAlocacao} onChange={(e) => setNovoValorAlocacao(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.2)", color: "#c8d8f0" }} />
                {CATEGORIAS_FINANCEIRAS.includes(novaCategoria) ? (
                  <input type="number" placeholder={cx.invRetornoMensalLabel} value={novoRetornoPct} onChange={(e) => setNovoRetornoPct(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.2)", color: "#c8d8f0" }} />
                ) : novaCategoria === "reducao_divida" ? (
                  <div className="flex items-center px-3 py-2.5 rounded-xl text-xs" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(59,130,246,0.1)", color: "#64748b" }}>
                    {taxaMaisCaraAM > 0 ? `${fPct(taxaMaisCaraAM)}/m (dívida mais cara)` : "—"}
                  </div>
                ) : (
                  <input type="number" placeholder={cx.invGanhoMensalLabel} value={novoGanhoMensal} onChange={(e) => setNovoGanhoMensal(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,130,246,0.2)", color: "#c8d8f0" }} />
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={adicionarOpcaoAlocacao}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "#fff" }}>
                  <Plus size={16} /> {cx.invAdicionarOpcao}
                </motion.button>
              </div>

              {/* RADAR DE OPORTUNIDADES */}
              <p className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: CORES.ouro }}>{cx.invRadarOportunidadesTitulo}</p>
              {resultadosAlocacao.length === 0 ? (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#64748b" }}>{cx.invSemOpcoes}</p>
              ) : (
                <div className="space-y-2">
                  {resultadosAlocacao.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl flex-wrap" style={{ background: r.prioridade === 1 ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${r.prioridade === 1 ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.06)"}` }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-black flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: r.prioridade === 1 ? CORES.ouro : "rgba(255,255,255,0.08)", color: r.prioridade === 1 ? "#1a1400" : "#94a3b8" }}>{r.prioridade}</span>
                        <p className="text-xs md:text-[13px] font-medium truncate" style={{ color: "#e2e8f0" }}>{montarNarrativaAlocacao(lang, r)}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: r.risco === "alto" ? "rgba(239,68,68,0.15)" : r.risco === "medio" ? "rgba(234,179,8,0.15)" : "rgba(16,185,129,0.15)", color: r.risco === "alto" ? CORES.vermelho : r.risco === "medio" ? CORES.amarelo : CORES.verde }}>
                          {r.risco === "alto" ? cx.invRiscoAlto : r.risco === "medio" ? cx.invRiscoMedio : cx.invRiscoBaixo}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => simularOportunidade(r)}
                          className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(59,130,246,0.15)", color: CORES.azulC }}>
                          {cx.invUsarNaSimulacao}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => removerOpcaoAlocacao(r.id)}>
                          <Trash2 size={14} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SIMULADOR EXECUTIVO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Sliders size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.invSimuladorTitulo}</p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.invSimuladorSub}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {[
                  { l: cx.invChoqueReceita, v: choqueReceita, set: setChoqueReceita },
                  { l: cx.invChoqueCustoFixo, v: choqueCustoFixo, set: setChoqueCustoFixo },
                  { l: cx.invChoqueCustoVariavel, v: choqueCustoVariavel, set: setChoqueCustoVariavel },
                  { l: cx.invChoqueJuros, v: choqueJuros, set: setChoqueJuros },
                  { l: cx.invChoqueAporte, v: choqueAporte, set: setChoqueAporte },
                  { l: cx.invChoqueRetornoAporte, v: choqueRetornoAporte, set: setChoqueRetornoAporte },
                ].map((f, i) => (
                  <div key={i}>
                    <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#5a8fd4" }}>{f.l}</label>
                    <input type="number" value={f.v} onChange={(e) => f.set(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(212,175,55,0.2)", color: "#c8d8f0" }} />
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => simularCenariosClick()}
                className="w-full py-3 rounded-xl text-sm font-bold mb-4"
                style={{ background: "linear-gradient(135deg, #7a5c00, #d4af37)", color: "#1a1400" }}>
                {cx.invSimular}
              </motion.button>

              {cenarios && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {cenarios.map((r) => {
                    const nomeLabel: Record<string, string> = { conservador: cx.invCenarioConservador, base: cx.invCenarioBase, otimista: cx.invCenarioOtimista, adverso: cx.invCenarioAdverso };
                    const corCenario = r.nome === "otimista" ? CORES.verde : r.nome === "adverso" ? CORES.vermelho : r.nome === "base" ? CORES.azul : CORES.amarelo;
                    return (
                      <div key={r.nome} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${corCenario}30` }}>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: corCenario }}>{nomeLabel[r.nome]}</p>
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
              )}
            </div>
          </>
        )}

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={txt.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Lista */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : investimentosFiltrados.length === 0 ? (
          <CanvasBox cor={CORES.azul}>
            <div className="flex flex-col items-center justify-center py-16">
              <TrendingUp size={48} style={{ color: "#1a3a5a" }} className="mb-4" />
              <p className="text-sm" style={{ color: "#3a6090" }}>{txt.semInv}</p>
            </div>
          </CanvasBox>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {investimentosFiltrados.map((inv, i) => {
              const cor = corTipo[inv.tipo] || CORES.azul;
              const liquidaAA = rentabilidadeLiquidaAnual({ tipo: inv.tipo, rentabilidade: inv.rentabilidade, data: inv.data });
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 mr-2">
                        <h3 className="font-bold text-sm mb-1 truncate" style={{ color: "#c8d8f0" }}>{inv.nome}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${cor}20`, color: cor, border: `1px solid ${cor}40` }}>
                            {NOME_TIPO[inv.tipo] || inv.tipo}
                          </span>
                          {inv.status === "resgatado" && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(148,163,184,0.15)", color: "#94a3b8" }}>{cx.invStatusResgatado}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(inv)}>
                          <Pencil size={16} style={{ color: CORES.azul }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(inv.id)}>
                          <Trash2 size={16} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-2" style={{ color: cor }}>{fBRL(inv.valor)}</p>
                    <div className="flex justify-between flex-wrap gap-1">
                      <p className="text-xs" style={{ color: "#3a6090" }}>{new Date(inv.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                      {inv.instituicao && <p className="text-xs" style={{ color: "#5a7a9a" }}>{inv.instituicao}</p>}
                      {liquidaAA > 0 && <p className="text-xs font-black" style={{ color: CORES.verde }}>{liquidaAA.toFixed(1)}% a.a. líq.</p>}
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Análise (Power BI style) */}
      <AnimatePresence>
        {analiseAberta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onClick={() => setAnaliseAberta(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.22 }} className="w-full max-w-4xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.97), rgba(10,8,32,0.99))", border: "1px solid rgba(99,102,241,0.2)" }}>
                <div className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#3b82f6,#d4af37)", boxShadow: "0 0 12px #3b82f6" }} />
                      <div>
                        <p className="text-base md:text-lg font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.invModalAnaliseTitulo}</p>
                        <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>{cx.invModalAnaliseSub}</p>
                      </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setAnaliseAberta(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>

                  <div className="mb-4">
                    <SubChart titulo={cx.invGraficoComposicaoTipo} cor={CORES.azul} option={optComposicaoTipo} altura={260} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SubChart titulo={cx.invRiscoConcentracaoInstituicao} cor={CORES.ouro} option={optComposicaoInst} altura={240} />
                    <SubChart titulo={cx.invRadarRiscoTitulo} cor={CORES.vermelho} option={optRadarRisco} altura={240} />
                    <SubChart titulo={cx.invScoreTitulo} cor={CORES.azul} option={optScoreBreakdown} altura={240} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md">
              <CanvasBox cor={CORES.azul}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: CORES.azulC }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>

                {erroModal && (
                  <div className="mb-4 px-3 py-2.5 rounded-xl text-xs font-medium" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                    {erroModal}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.nomeLabel}</label>
                    <input value={nome} onChange={(e) => setNome(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.valorLabel}</label>
                      <input type="number" value={valor} onChange={(e) => setValor(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.rentLabel}</label>
                      <input type="number" value={rentabilidade} onChange={(e) => setRentabilidade(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.dataLabel}</label>
                      <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.invVencimentoLabel}</label>
                      <input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.invInstituicaoLabel}</label>
                    <input value={instituicao} onChange={(e) => setInstituicao(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.tipoLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(NOME_TIPO) as TipoInvestimento[]).map((op) => (
                        <motion.button key={op} whileTap={{ scale: 0.97 }} onClick={() => setTipo(op)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: tipo === op ? `${corTipo[op]}25` : "rgba(59,111,212,0.05)", color: tipo === op ? corTipo[op] : "#5a7a9a", border: `1px solid ${tipo === op ? `${corTipo[op]}50` : "rgba(59,111,212,0.1)"}` }}>
                          {NOME_TIPO[op]}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.invLiquidezLabel}</label>
                      <select value={liquidez} onChange={(e) => setLiquidez(e.target.value as Liquidez)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                        <option value="diaria">{cx.invLiquidezDiaria}</option>
                        <option value="curto_prazo">{cx.invLiquidezCurtoPrazo}</option>
                        <option value="longo_prazo">{cx.invLiquidezLongoPrazo}</option>
                        <option value="no_vencimento">{cx.invLiquidezNoVencimento}</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.invStatusLabel}</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value as StatusInvestimento)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                        <option value="ativo">{cx.invStatusAtivo}</option>
                        <option value="resgatado">{cx.invStatusResgatado}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.invIndexadorLabel}</label>
                    <input value={indexador} onChange={(e) => setIndexador(e.target.value)} placeholder="Ex: 110% CDI, IPCA+6%, Prefixado"
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{txt.cancelarBtn}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #1e3a8a, #3b82f6)", color: "#fff" }}>
                      {salvando ? "..." : txt.salvarBtn}
                    </motion.button>
                  </div>
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
