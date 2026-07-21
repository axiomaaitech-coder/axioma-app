"use client";
import { useState, useEffect } from "react";
import {
  Tag, Pencil, Trash2, Plus, X, Share2, Sparkles, AlertTriangle, TrendingUp,
  Zap, Percent, ShieldCheck, Sliders, Clock, Users, Award,
} from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  fBRL, fPct, CORES, FONTE_EXEC,
  montarDRE, margemContribuicao, coeficienteVariacao, concentracao,
  simularCenariosExecutivos, calcularImpactoPreco, calcularImpactoDesconto,
  estimarElasticidade, detectarOportunidadesPrecificacao, calcularIPPA, optRosca,
  type Lancamento, type ChoqueSimulador, type ResultadoCenario,
  type TipoOportunidadePrecificacao,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento,
  nomeTipoOportunidadePrecificacao, montarNarrativaOportunidadePrecificacao,
  montarNarrativaImpactoPreco, montarNarrativaImpactoDesconto,
  montarNarrativaElasticidade, montarNarrativaIPPA,
} from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COR_PRC = CORES.amarelo;
const COR_PRC_C = CORES.amareloC;

type ProdutoRow = {
  id: string; produto_servico: string; custo_total: number; margem_desejada: number;
  preco_sugerido: number; categoria: string | null; unidades_vendidas_mes: number | null; status: string | null;
  created_at?: string;
};
type ConcorrenteRow = { id: string; produto_id: string; nome_concorrente: string; preco: number; posicionamento: string | null };
type DecisaoRow = {
  id: string; produto_id: string; preco_anterior: number; preco_novo: number; motivo: string | null;
  unidades_no_momento: number | null; resultado_esperado: string | null; resultado_real: string | null; created_at: string;
};

const WAR_PRESETS: Record<string, Partial<ChoqueSimulador>> = {
  concorrenteReduz: { receitaPct: -15 },
  concorrenteAumenta: { receitaPct: 8 },
  inflacao: { custoFixoPct: 8, custoVariavelPct: 10 },
  selic: { jurosDividaPontos: 3 },
  cambio: { custoVariavelPct: 12 },
  crise: { receitaPct: -30, custoFixoPct: 10, custoVariavelPct: 15, jurosDividaPontos: 3 },
  mudancaTributaria: { custoVariavelPct: 5 },
  novoConcorrente: { receitaPct: -20 },
  explosaoDemanda: { receitaPct: 35 },
  quedaVendas: { receitaPct: -25 },
  mudancaFornecedores: { custoVariavelPct: -8 },
};

export default function Precificacao() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [produtos, setProdutos] = useState<ProdutoRow[]>([]);
  const [concorrentes, setConcorrentes] = useState<ConcorrenteRow[]>([]);
  const [decisoes, setDecisoes] = useState<DecisaoRow[]>([]);
  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [dividasRows, setDividasRows] = useState<{ valor_total: number; valor_pago: number; taxa_juros: number }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<ProdutoRow | null>(null);
  const [produtoServico, setProdutoServico] = useState("");
  const [custoTotal, setCustoTotal] = useState("");
  const [margemDesejada, setMargemDesejada] = useState("");
  const [impostos, setImpostos] = useState("");
  const [despesas, setDespesas] = useState("");
  const [categoria, setCategoria] = useState("");
  const [unidadesVendidasMes, setUnidadesVendidasMes] = useState("");
  const [status, setStatus] = useState("ativo");
  const [salvando, setSalvando] = useState(false);

  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState<string>("");
  const [precoCandidato, setPrecoCandidato] = useState("");
  const [descontoPct, setDescontoPct] = useState("10");
  const [novoConcorrenteNome, setNovoConcorrenteNome] = useState("");
  const [novoConcorrentePreco, setNovoConcorrentePreco] = useState("");
  const [novoConcorrentePosicionamento, setNovoConcorrentePosicionamento] = useState("");
  const [warChoque, setWarChoque] = useState<ChoqueSimulador>({ receitaPct: 0, custoFixoPct: 0, custoVariavelPct: 0, jurosDividaPontos: 0, aporteCapital: 0, retornoMensalAporte: 0 });
  const [warResultado, setWarResultado] = useState<ResultadoCenario[] | null>(null);

  const txt = {
    novo: idioma === "pt" ? "Novo Produto" : idioma === "en" ? "New Product" : "Nuevo Producto",
    editar: idioma === "pt" ? "Editar Produto" : idioma === "en" ? "Edit Product" : "Editar Producto",
    salvar: idioma === "pt" ? "Salvar" : idioma === "en" ? "Save" : "Guardar",
    cancelar: idioma === "pt" ? "Cancelar" : idioma === "en" ? "Cancel" : "Cancelar",
    semProdutos: idioma === "pt" ? "Nenhum produto cadastrado." : idioma === "en" ? "No products yet." : "Sin productos aún.",
    precoAtual: idioma === "pt" ? "Preço Atual" : idioma === "en" ? "Current Price" : "Precio Actual",
    custo: idioma === "pt" ? "Custo" : idioma === "en" ? "Cost" : "Costo",
    lucro: idioma === "pt" ? "Lucro" : idioma === "en" ? "Profit" : "Ganancia",
    margem: idioma === "pt" ? "Margem" : idioma === "en" ? "Margin" : "Margen",
    produtos: idioma === "pt" ? "Produtos" : idioma === "en" ? "Products" : "Productos",
    margemMedia: idioma === "pt" ? "Margem Média" : idioma === "en" ? "Avg Margin" : "Margen Prom.",
    menorPreco: idioma === "pt" ? "Menor Preço" : idioma === "en" ? "Min Price" : "Precio Mín.",
    maiorPreco: idioma === "pt" ? "Maior Preço" : idioma === "en" ? "Max Price" : "Precio Máx.",
    nomeLabel: idioma === "pt" ? "Nome do Produto/Serviço" : idioma === "en" ? "Product/Service Name" : "Nombre del Producto/Servicio",
    custoLabel: idioma === "pt" ? "Custo Total (R$)" : idioma === "en" ? "Total Cost (R$)" : "Costo Total (R$)",
    margemLabel: idioma === "pt" ? "Margem Desejada (%)" : idioma === "en" ? "Desired Margin (%)" : "Margen Deseado (%)",
    impostosLabel: idioma === "pt" ? "Impostos (%)" : idioma === "en" ? "Taxes (%)" : "Impuestos (%)",
    despesasLabel: idioma === "pt" ? "Despesas Operacionais (%)" : idioma === "en" ? "Operating Expenses (%)" : "Gastos Operativos (%)",
    categoriaLabel: idioma === "pt" ? "Categoria" : idioma === "en" ? "Category" : "Categoría",
    unidadesLabel: idioma === "pt" ? "Unidades Vendidas/Mês" : idioma === "en" ? "Units Sold/Month" : "Unidades Vendidas/Mes",
    statusLabel: idioma === "pt" ? "Status" : "Status",
    statusAtivo: idioma === "pt" ? "Ativo" : idioma === "en" ? "Active" : "Activo",
    statusDescontinuado: idioma === "pt" ? "Descontinuado" : idioma === "en" ? "Discontinued" : "Descontinuado",
    selecioneProduto: idioma === "pt" ? "Selecione um produto" : idioma === "en" ? "Select a product" : "Seleccione un producto",
  };

  useEffect(() => { carregarTudo(); }, []);

  async function carregarTudo() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const inicio12m = new Date(); inicio12m.setMonth(inicio12m.getMonth() - 11);
    const inicioIso = inicio12m.toISOString().slice(0, 10);
    const hoje = new Date().toISOString().slice(0, 10);

    const [{ data: prod }, { data: conc }, { data: dec }, { data: rec }, { data: cf }, { data: cv }, { data: dv }, { data: emp }] = await Promise.all([
      supabase.from("precificacao").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("concorrentes").select("*").eq("user_id", user.id),
      supabase.from("decisoes_precificacao").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioIso).lte("data", hoje),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioIso).lte("data", hoje),
      supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("user_id", user.id),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    setProdutos(prod || []); setConcorrentes(conc || []); setDecisoes(dec || []);
    setReceitasRows(rec || []); setCustosFixosRows(cf || []); setCustosVarRows(cv || []); setDividasRows(dv || []);
    setRegimeTributario(emp?.regime_tributario || "");
    setCarregando(false);
  }

  function calcularPreco(c: string, m: string, imp: string, desp: string): number {
    const custoNum = parseFloat(c || "0");
    const divisor = 1 - parseFloat(m || "0") / 100 - parseFloat(imp || "0") / 100 - parseFloat(desp || "0") / 100;
    if (divisor <= 0) return 0;
    return custoNum / divisor;
  }
  const precoPreview = calcularPreco(custoTotal, margemDesejada, impostos, despesas);

  function abrirNovo() {
    setEditando(null);
    setProdutoServico(""); setCustoTotal(""); setMargemDesejada(""); setImpostos(""); setDespesas("");
    setCategoria(""); setUnidadesVendidasMes(""); setStatus("ativo");
    setModalAberto(true);
  }
  function abrirEdicao(p: ProdutoRow) {
    setEditando(p);
    setProdutoServico(p.produto_servico); setCustoTotal(String(p.custo_total || ""));
    setMargemDesejada(String(p.margem_desejada || "")); setImpostos(""); setDespesas("");
    setCategoria(p.categoria || ""); setUnidadesVendidasMes(String(p.unidades_vendidas_mes || ""));
    setStatus(p.status || "ativo");
    setModalAberto(true);
  }
  function fecharModal() { setModalAberto(false); setEditando(null); }

  async function salvarProduto() {
    if (!produtoServico || !custoTotal || !margemDesejada) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = {
      produto_servico: produtoServico, custo_total: parseFloat(custoTotal), margem_desejada: parseFloat(margemDesejada),
      preco_sugerido: editando ? editando.preco_sugerido : calcularPreco(custoTotal, margemDesejada, impostos, despesas),
      categoria: categoria || null, unidades_vendidas_mes: unidadesVendidasMes ? parseFloat(unidadesVendidasMes) : null, status,
    };
    if (editando) await supabase.from("precificacao").update(payload).eq("id", editando.id);
    else await supabase.from("precificacao").insert({ ...payload, user_id: user.id });
    fecharModal(); setSalvando(false); await carregarTudo();
  }
  async function excluirProduto(id: string) {
    await supabase.from("precificacao").delete().eq("id", id); await carregarTudo();
  }

  // ═══════════════════════ DADOS REAIS DA EMPRESA (mesmo padrão de Simulações) ═══════════════════════
  const meses = 12;
  const receitasItens: Lancamento[] = receitasRows.map((r) => ({ valor: r.valor, data: r.data }));
  const receitaMensalMedia = receitasItens.reduce((s, r) => s + r.valor, 0) / meses;
  const custoVariavelMensalMedia = custosVarRows.reduce((s, c) => s + Number(c.valor || 0), 0) / meses;
  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);
  const dividaTotal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
  const despesasFinanceirasMensal = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago) * (d.taxa_juros / 100), 0);
  const receitaBrutaAnual = receitasItens.reduce((s, r) => s + r.valor, 0);
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, receitaBrutaAnual, receitaMensalMedia);
  const aliquotaEfetivaPct = receitaMensalMedia > 0 ? (impostoMensalEstimado / receitaMensalMedia) * 100 : 0;
  const dreAtual = montarDRE({
    receitaBruta: receitaMensalMedia, deducoes: receitaMensalMedia * (aliquotaEfetivaPct / 100),
    custoVariavel: custoVariavelMensalMedia, custoFixo: custoFixoMensalTotal, despesasFinanceiras: despesasFinanceirasMensal,
  });

  const temDados = produtos.length > 0;

  // ═══════════════════════ PRODUTOS COM DADOS DERIVADOS ═══════════════════════
  const produtosAtivos = produtos.filter((p) => p.status !== "descontinuado");
  const produtosDerivados = produtosAtivos.map((p) => {
    const unidades = p.unidades_vendidas_mes || 0;
    const receitaMensal = (p.preco_sugerido || 0) * unidades;
    const custoMensal = (p.custo_total || 0) * unidades;
    const mc = margemContribuicao(receitaMensal, custoMensal);
    const concorrentesProduto = concorrentes.filter((c) => c.produto_id === p.id);
    const precoConcorrenteMedia = concorrentesProduto.length > 0 ? concorrentesProduto.reduce((s, c) => s + c.preco, 0) / concorrentesProduto.length : null;
    const diferencaPctVsConcorrente = precoConcorrenteMedia && precoConcorrenteMedia > 0 ? (((p.preco_sugerido || 0) - precoConcorrenteMedia) / precoConcorrenteMedia) * 100 : null;
    return { produto: p, unidades, receitaMensal, margemPct: mc.pct, diferencaPctVsConcorrente, concorrentesProduto };
  });

  const oportunidades = detectarOportunidadesPrecificacao(
    produtosDerivados.filter((d) => d.unidades > 0).map((d) => ({ id: d.produto.id, nome: d.produto.produto_servico, margemPct: d.margemPct, receitaMensal: d.receitaMensal, diferencaPctVsConcorrente: d.diferencaPctVsConcorrente }))
  );

  // ═══════════════════════ IPPA ═══════════════════════
  const comDadosDeVenda = produtosDerivados.filter((d) => d.unidades > 0);
  const margemMediaCarteiraPct = comDadosDeVenda.length > 0 ? comDadosDeVenda.reduce((s, d) => s + d.margemPct, 0) / comDadosDeVenda.length : 0;
  const decisoesComDesconto = decisoes.filter((d) => d.preco_novo < d.preco_anterior).length;
  const pctDecisoesComDesconto = decisoes.length > 0 ? (decisoesComDesconto / decisoes.length) * 100 : 0;
  const concentracaoReceitaProdutosPct = comDadosDeVenda.length > 0
    ? concentracao(comDadosDeVenda.map((d) => ({ valor: d.receitaMensal, data: "" })), 0.2) : 0;
  const receitaMensalPorMes: Record<string, number> = {};
  receitasRows.forEach((r) => { const mesKey = r.data.slice(0, 7); receitaMensalPorMes[mesKey] = (receitaMensalPorMes[mesKey] || 0) + r.valor; });
  const coeficienteVariacaoReceitaPct = coeficienteVariacao(Object.values(receitaMensalPorMes));
  const comConcorrente = produtosDerivados.filter((d) => d.diferencaPctVsConcorrente !== null);
  const diferencaPctVsConcorrenteMedia = comConcorrente.length > 0 ? comConcorrente.reduce((s, d) => s + (d.diferencaPctVsConcorrente || 0), 0) / comConcorrente.length : null;

  const ippa = calcularIPPA({
    margemMediaCarteiraPct, margemSaudavelReferenciaPct: 30,
    pctDecisoesComDesconto, concentracaoReceitaProdutosPct, coeficienteVariacaoReceitaPct, diferencaPctVsConcorrenteMedia,
  });
  const NIVEL_LABEL: Record<string, string> = { critico: cx.prcNivelCritico, atencao: cx.prcNivelAtencao, bom: cx.prcNivelBom, excelente: cx.prcNivelExcelente };
  const NIVEL_COR: Record<string, string> = { critico: CORES.vermelho, atencao: CORES.amarelo, bom: CORES.verde, excelente: CORES.verde };
  const SUB_LABEL: Record<string, string> = { margem: cx.prcSubMargem, dependenciaDesconto: cx.prcSubDependenciaDesconto, concentracao: cx.prcSubConcentracao, estabilidade: cx.prcSubEstabilidade, competitividade: cx.prcSubCompetitividade };

  // ═══════════════════════ MOTOR DE PRECIFICAÇÃO POR VALOR ═══════════════════════
  const produtoSelecionado = produtos.find((p) => p.id === produtoSelecionadoId) || null;
  const derivadoSelecionado = produtosDerivados.find((d) => d.produto.id === produtoSelecionadoId) || null;
  const impactoPreco = produtoSelecionado && precoCandidato
    ? calcularImpactoPreco({
        custoUnitario: produtoSelecionado.custo_total || 0, unidadesVendidasMes: produtoSelecionado.unidades_vendidas_mes || 0,
        precoCandidato: parseFloat(precoCandidato), aliquotaEfetivaPct,
        receitaMensalProdutoAtual: derivadoSelecionado?.receitaMensal || 0,
        custoMensalProdutoAtual: (produtoSelecionado.custo_total || 0) * (produtoSelecionado.unidades_vendidas_mes || 0),
      })
    : null;

  async function aplicarPreco() {
    if (!produtoSelecionado || !precoCandidato) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const precoNovo = parseFloat(precoCandidato);
    await supabase.from("precificacao").update({ preco_sugerido: precoNovo }).eq("id", produtoSelecionado.id);
    await supabase.from("decisoes_precificacao").insert({
      user_id: user.id, produto_id: produtoSelecionado.id,
      preco_anterior: produtoSelecionado.preco_sugerido, preco_novo: precoNovo,
      motivo: "Motor de Precificação por Valor", unidades_no_momento: produtoSelecionado.unidades_vendidas_mes || 0,
    });
    setPrecoCandidato(""); await carregarTudo();
  }

  const impactoDesconto = derivadoSelecionado && produtoSelecionado
    ? calcularImpactoDesconto({
        precoAtual: produtoSelecionado.preco_sugerido || 0, custoUnitario: produtoSelecionado.custo_total || 0,
        unidadesVendidasMes: produtoSelecionado.unidades_vendidas_mes || 0, descontoPct: parseFloat(descontoPct || "0"), aliquotaEfetivaPct,
      })
    : null;

  // ═══════════════════════ ELASTICIDADE ═══════════════════════
  const decisoesProdutoSelecionado = decisoes.filter((d) => d.produto_id === produtoSelecionadoId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const historicoElasticidade = decisoesProdutoSelecionado.slice(0, -1).map((d, i) => ({
    precoAnterior: d.preco_novo, precoNovo: decisoesProdutoSelecionado[i + 1].preco_novo,
    unidadesAntes: d.unidades_no_momento || 0, unidadesDepois: decisoesProdutoSelecionado[i + 1].unidades_no_momento || 0,
  }));
  const elasticidade = estimarElasticidade(historicoElasticidade);

  // ═══════════════════════ CONCORRENTES ═══════════════════════
  async function adicionarConcorrente() {
    if (!produtoSelecionadoId || !novoConcorrenteNome || !novoConcorrentePreco) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("concorrentes").insert({
      user_id: user.id, produto_id: produtoSelecionadoId, nome_concorrente: novoConcorrenteNome,
      preco: parseFloat(novoConcorrentePreco), posicionamento: novoConcorrentePosicionamento || null,
    });
    setNovoConcorrenteNome(""); setNovoConcorrentePreco(""); setNovoConcorrentePosicionamento("");
    await carregarTudo();
  }
  async function removerConcorrente(id: string) { await supabase.from("concorrentes").delete().eq("id", id); await carregarTudo(); }

  // ═══════════════════════ WAR ROOM (reaproveita o motor de Simulações) ═══════════════════════
  function aplicarPresetGuerra(preset: keyof typeof WAR_PRESETS) {
    const p = WAR_PRESETS[preset];
    setWarChoque({ receitaPct: p.receitaPct ?? 0, custoFixoPct: p.custoFixoPct ?? 0, custoVariavelPct: p.custoVariavelPct ?? 0, jurosDividaPontos: p.jurosDividaPontos ?? 0, aporteCapital: 0, retornoMensalAporte: 0 });
  }
  function rodarWarRoom() {
    const resultado = simularCenariosExecutivos({
      receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
      custoVariavelMensalAtual: custoVariavelMensalMedia, despesasFinanceirasMensalAtual: despesasFinanceirasMensal,
      dividaTotalAtual: dividaTotal, aliquotaEfetivaPct, saldoCaixaAtual: 0, choque: warChoque, horizonteMeses: 12,
    });
    setWarResultado(resultado);
  }
  const NOME_CENARIO: Record<string, string> = { conservador: cx.invCenarioConservador, base: cx.invCenarioBase, otimista: cx.invCenarioOtimista, adverso: cx.invCenarioAdverso };

  // ═══════════════════════ MEMÓRIA ESTRATÉGICA ═══════════════════════
  async function atualizarResultadoReal(id: string, texto: string) {
    await supabase.from("decisoes_precificacao").update({ resultado_real: texto }).eq("id", id);
  }

  // ═══════════════════════ PAINEL DE ESPECIALISTAS + RECOMENDAÇÃO CONSOLIDADA ═══════════════════════
  const oportunidadesDestroiMargem = oportunidades.filter((o) => o.tipo === "destroiMargem");
  const oportunidadesRisco = oportunidades.filter((o) => o.tipo === "sobreprecificado" || o.tipo === "destroiMargem");
  const melhorOportunidade = oportunidades.find((o) => o.tipo === "premium" || o.tipo === "sustentaCaixa") || null;
  const piorOportunidade = oportunidadesRisco[0] || null;

  // ═══════════════════════ KPIs originais ═══════════════════════
  const margemMedia = produtos.length > 0 ? (produtos.reduce((a, p) => a + (p.margem_desejada || 0), 0) / produtos.length).toFixed(0) : "0";
  const menorPreco = produtos.length > 0 ? Math.min(...produtos.map((p) => p.preco_sugerido || 0)) : 0;
  const maiorPreco = produtos.length > 0 ? Math.max(...produtos.map((p) => p.preco_sugerido || 0)) : 0;

  const composicaoReceita = comDadosDeVenda.map((d, i) => ({ name: d.produto.produto_servico, value: d.receitaMensal, color: [CORES.amarelo, CORES.ouro, CORES.azul, CORES.verde, CORES.rosa, CORES.roxo][i % 6] }));
  const optComposicaoReceita = optRosca(composicaoReceita, COR_PRC, cx.total);

  const marquee = [
    "🚀 AXIOMA AI.TECH",
    `${cx.prcIppaTitulo}: ${ippa.total}/1000`,
    `${txt.produtos}: ${produtos.length}`,
    oportunidadesDestroiMargem[0] ? `⚠️ ${oportunidadesDestroiMargem[0].nome}` : "",
  ].filter(Boolean);

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: cx.prcTitulo, subtitulo: cx.prcSubtitulo,
        colunas: [
          { header: "Produto/Serviço", key: "produto", width: 4 },
          { header: "Custo (R$)", key: "custo", width: 2, align: "right" },
          { header: "Margem", key: "margem", width: 2, align: "right" },
          { header: "Preço (R$)", key: "preco", width: 2, align: "right" },
        ],
        linhas: produtos.map((p) => ({
          produto: p.produto_servico, custo: fmtN(p.custo_total || 0), margem: `${p.margem_desejada || 0}%`, preco: fmtN(p.preco_sugerido || 0),
        })),
        resumo: [
          { label: txt.produtos, valor: `${produtos.length}` },
          { label: cx.prcIppaTitulo, valor: `${ippa.total}/1000 (${NIVEL_LABEL[ippa.nivel]})` },
          { label: txt.margemMedia, valor: `${margemMedia}%` },
        ],
        nomeArquivo: `axioma-precificacao-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${cx.prcTitulo}`,
    `🏆 ${cx.prcIppaTitulo}: ${ippa.total}/1000 (${NIVEL_LABEL[ippa.nivel]})`,
    `📦 ${txt.produtos}: ${produtos.length}`,
    piorOportunidade ? `⚠️ ${montarNarrativaOportunidadePrecificacao(lang, piorOportunidade)}` : "",
    "_axiomaai.com.br_",
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${cx.prcTitulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  const inputStyle = { background: "rgba(255,255,255,0.04)", border: `1px solid ${COR_PRC}30`, color: "#c8d8f0" };
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <ModuloLayout titulo={cx.prcTitulo} subtitulo={cx.prcSubtitulo} onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: `${COR_PRC}20`, border: `1px solid ${COR_PRC}50`, color: COR_PRC_C }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* KPIs originais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: txt.produtos, value: `${produtos.length}`, cor: COR_PRC },
            { label: txt.margemMedia, value: `${margemMedia}%`, cor: CORES.verde },
            { label: txt.menorPreco, value: fmt(menorPreco), cor: CORES.azul },
            { label: txt.maiorPreco, value: fmt(maiorPreco), cor: CORES.roxo },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {!temDados ? (
          <CanvasBox cor={COR_PRC}>
            <div className="flex flex-col items-center justify-center py-16">
              <Tag size={48} style={{ color: "#4a3a10" }} className="mb-4" />
              <p className="text-sm text-center" style={{ color: "#5a7a9a" }}>{cx.prcNenhumProduto}</p>
            </div>
          </CanvasBox>
        ) : (
          <>
            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: `linear-gradient(90deg, ${COR_PRC}20, ${CORES.ouro}15)`, border: `1px solid ${COR_PRC}40` }}>
              <div className="marquee-prc py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map((rep) => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? COR_PRC_C : "#e2e8f0" }}>{m}<span style={{ color: COR_PRC }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-prc{animation:marqueePrc 30s linear infinite}@keyframes marqueePrc{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-prc:hover{animation-play-state:paused}`}</style>
            </div>

            {/* IPPA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}35` }}>
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} style={{ color: COR_PRC }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcIppaTitulo}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.prcIppaSub}</p>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-4xl font-black" style={{ color: NIVEL_COR[ippa.nivel], ...FONTE_EXEC }}>{ippa.total}</p>
                <div>
                  <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${NIVEL_COR[ippa.nivel]}18`, color: NIVEL_COR[ippa.nivel] }}>{NIVEL_LABEL[ippa.nivel]}</span>
                  <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{montarNarrativaIPPA(lang, ippa)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {ippa.subscores.map((s) => (
                  <div key={s.chave} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{SUB_LABEL[s.chave] || s.chave}</p>
                    <p className="text-sm font-black" style={{ color: COR_PRC_C }}>{Math.round(s.valor)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RADAR DE OPORTUNIDADES */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: COR_PRC }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcRadarTitulo}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.prcRadarSub}</p>
              {oportunidades.length === 0 ? (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{idioma === "pt" ? "Nenhuma oportunidade crítica detectada — cadastre unidades vendidas/mês pros produtos pra habilitar essa análise." : "No critical opportunity detected."}</p>
              ) : (
                <div className="space-y-2">
                  {oportunidades.map((o, i) => {
                    const corTipo = o.tipo === "destroiMargem" || o.tipo === "sobreprecificado" ? CORES.vermelho : o.tipo === "subprecificado" ? CORES.amarelo : CORES.verde;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl flex-wrap" style={{ background: `${corTipo}10`, border: `1px solid ${corTipo}25` }}>
                        <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{montarNarrativaOportunidadePrecificacao(lang, o)}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${corTipo}18`, color: corTipo }}>{nomeTipoOportunidadePrecificacao(lang, o.tipo as TipoOportunidadePrecificacao)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {composicaoReceita.length > 1 && <div className="mt-4"><ReactECharts option={optComposicaoReceita} style={{ height: 220, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} /></div>}
            </div>

            {/* SELETOR DE PRODUTO (usado pelo Motor, Desconto, Concorrentes, Elasticidade) */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
              <label className="text-[10px] font-black uppercase tracking-wider mb-2 block" style={{ color: COR_PRC_C }}>{txt.selecioneProduto}</label>
              <select value={produtoSelecionadoId} onChange={(e) => setProdutoSelecionadoId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle}>
                <option value="">—</option>
                {produtos.map((p) => (<option key={p.id} value={p.id}>{p.produto_servico}</option>))}
              </select>
            </div>

            {produtoSelecionado && (
              <>
                {/* MOTOR DE PRECIFICAÇÃO POR VALOR */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sliders size={16} style={{ color: COR_PRC }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcMotorTitulo}</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.prcMotorSub}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#94a3b8" }}>{cx.prcPrecoAtualLabel}</label>
                      <div className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.02)", color: "#94a3b8" }}>{fBRL(produtoSelecionado.preco_sugerido || 0)}</div>
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: COR_PRC_C }}>{cx.prcPrecoCandidatoLabel}</label>
                      <input type="number" value={precoCandidato} onChange={(e) => setPrecoCandidato(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: "#94a3b8" }}>{cx.prcUnidadesVendidasLabel}</label>
                      <div className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.02)", color: "#94a3b8" }}>{produtoSelecionado.unidades_vendidas_mes ?? "—"}</div>
                    </div>
                  </div>
                  {impactoPreco && (
                    <>
                      <p className="text-xs md:text-[13px] font-medium mb-3" style={{ color: "#e2e8f0" }}>{montarNarrativaImpactoPreco(lang, impactoPreco, produtoSelecionado.preco_sugerido || 0, parseFloat(precoCandidato))}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {[
                          { l: cx.prcImpactoReceitaLabel, v: fBRL(impactoPreco.deltaReceitaEmpresa), c: impactoPreco.deltaReceitaEmpresa >= 0 ? CORES.verde : CORES.vermelho },
                          { l: cx.prcImpactoLucroLabel, v: fBRL(impactoPreco.deltaLucroLiquidoEmpresa), c: impactoPreco.deltaLucroLiquidoEmpresa >= 0 ? CORES.verde : CORES.vermelho },
                          { l: cx.prcImpactoEbitdaLabel, v: fBRL(impactoPreco.deltaEbitdaEmpresa), c: impactoPreco.deltaEbitdaEmpresa >= 0 ? CORES.verde : CORES.vermelho },
                          { l: cx.prcMargemNovaLabel, v: fPct(impactoPreco.margemContribuicaoPct), c: COR_PRC_C },
                        ].map((k, i) => (
                          <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{k.l}</p>
                            <p className="text-xs font-black" style={{ color: k.c }}>{k.v}</p>
                          </div>
                        ))}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={aplicarPreco}
                        className="w-full py-3 rounded-xl text-sm font-bold" style={{ background: `linear-gradient(135deg, #7a5c00, ${COR_PRC})`, color: "#1a1400" }}>
                        {cx.prcAplicarPreco}
                      </motion.button>
                    </>
                  )}
                </div>

                {/* ENGENHARIA DE DESCONTOS */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Percent size={16} style={{ color: COR_PRC }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcDescontoTitulo}</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.prcDescontoSub}</p>
                  <div className="max-w-xs mb-3">
                    <label className="text-[9px] font-semibold tracking-wider uppercase mb-1.5 block" style={{ color: COR_PRC_C }}>{cx.prcDescontoPctLabel}</label>
                    <input type="number" value={descontoPct} onChange={(e) => setDescontoPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                  </div>
                  {impactoDesconto && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: impactoDesconto.dentroDoLimite ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${impactoDesconto.dentroDoLimite ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
                      {impactoDesconto.dentroDoLimite ? <ShieldCheck size={15} style={{ color: CORES.verdeC, flexShrink: 0, marginTop: 2 }} /> : <AlertTriangle size={15} style={{ color: CORES.vermelhoC, flexShrink: 0, marginTop: 2 }} />}
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: impactoDesconto.dentroDoLimite ? "#6ee7b7" : "#fca5a5" }}>{montarNarrativaImpactoDesconto(lang, impactoDesconto, parseFloat(descontoPct || "0"))}</p>
                    </div>
                  )}
                </div>

                {/* ELASTICIDADE */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} style={{ color: COR_PRC }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcElasticidadeTitulo}</p>
                  </div>
                  <p className="text-xs md:text-[13px] font-medium mt-2" style={{ color: elasticidade.temDadosSuficientes ? "#e2e8f0" : "#64748b" }}>{montarNarrativaElasticidade(lang, elasticidade)}</p>
                </div>

                {/* CONCORRENTES */}
                <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Users size={16} style={{ color: COR_PRC }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcConcorrentesTitulo}</p>
                  </div>
                  <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.prcConcorrentesSub}</p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                    <input placeholder={cx.prcConcorrenteNomeLabel} value={novoConcorrenteNome} onChange={(e) => setNovoConcorrenteNome(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                    <input type="number" placeholder={cx.prcConcorrentePrecoLabel} value={novoConcorrentePreco} onChange={(e) => setNovoConcorrentePreco(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                    <input placeholder={cx.prcConcorrentePosicionamentoLabel} value={novoConcorrentePosicionamento} onChange={(e) => setNovoConcorrentePosicionamento(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={adicionarConcorrente} className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold" style={{ background: `linear-gradient(135deg, #7a5c00, ${COR_PRC})`, color: "#1a1400" }}>
                      <Plus size={16} /> {cx.prcAdicionarConcorrente}
                    </motion.button>
                  </div>
                  {(derivadoSelecionado?.concorrentesProduto.length || 0) === 0 ? (
                    <p className="text-xs md:text-[13px] font-medium" style={{ color: "#64748b" }}>{cx.prcSemConcorrentes}</p>
                  ) : (
                    <div className="space-y-2">
                      {derivadoSelecionado?.concorrentesProduto.map((c) => (
                        <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{c.nome_concorrente} — {fBRL(c.preco)}{c.posicionamento ? ` (${c.posicionamento})` : ""}</p>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => removerConcorrente(c.id)}><Trash2 size={14} style={{ color: "#f87171" }} /></motion.button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* WAR ROOM */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} style={{ color: COR_PRC }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcWarRoomTitulo}</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#64748b" }}>{cx.prcWarRoomSub}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  ["concorrenteReduz", cx.prcCenarioConcorrenteReduz], ["concorrenteAumenta", cx.prcCenarioConcorrenteAumenta],
                  ["inflacao", cx.prcCenarioInflacao], ["selic", cx.prcCenarioSelic], ["cambio", cx.prcCenarioCambio],
                  ["crise", cx.prcCenarioCrise], ["mudancaTributaria", cx.prcCenarioMudancaTributaria], ["novoConcorrente", cx.prcCenarioNovoConcorrente],
                  ["explosaoDemanda", cx.prcCenarioExplosaoDemanda], ["quedaVendas", cx.prcCenarioQuedaVendas], ["mudancaFornecedores", cx.prcCenarioMudancaFornecedores],
                ] as [keyof typeof WAR_PRESETS, string][]).map(([k, l]) => (
                  <motion.button key={k} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => aplicarPresetGuerra(k)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold" style={{ background: `${COR_PRC}12`, border: `1px solid ${COR_PRC}35`, color: COR_PRC_C }}>
                    {l}
                  </motion.button>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={rodarWarRoom}
                className="w-full py-3 rounded-xl text-sm font-bold mb-4" style={{ background: `linear-gradient(135deg, #7a5c00, ${COR_PRC})`, color: "#1a1400" }}>
                {cx.simSimular}
              </motion.button>
              {warResultado && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {warResultado.map((r) => {
                    const corCenario = r.nome === "otimista" ? CORES.verde : r.nome === "adverso" ? CORES.vermelho : r.nome === "base" ? COR_PRC : CORES.azul;
                    return (
                      <div key={r.nome} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${corCenario}30` }}>
                        <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: corCenario }}>{NOME_CENARIO[r.nome]}</p>
                        <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{cx.invLucroLiquidoMensal}</p>
                        <p className="text-sm font-black" style={{ color: r.lucroLiquidoMensal >= 0 ? CORES.verde : CORES.vermelho }}>{fBRL(r.lucroLiquidoMensal)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* PAINEL DE ESPECIALISTAS */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-1">
                <Users size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcPainelEspecialistasTitulo}</p>
              </div>
              <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>{cx.prcPainelEspecialistasSub}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {[
                  { l: cx.prcEspecialistaCFO, t: `${cx.prcImpactoLucroLabel}: ${fBRL(dreAtual.lucroLiquido.valor)}` },
                  { l: cx.prcEspecialistaTributario, t: `${cx.prcImpactoTributarioLabel}: ${fPct(aliquotaEfetivaPct)} ${idioma === "pt" ? "sobre a receita" : "on revenue"}` },
                  { l: cx.prcEspecialistaComercial, t: `${cx.prcSubCompetitividade}: ${Math.round(ippa.subscores.find((s) => s.chave === "competitividade")?.valor || 0)}/100` },
                  { l: cx.prcEspecialistaRisco, t: `${cx.prcRadarTitulo}: ${oportunidadesRisco.length}` },
                  { l: cx.prcEspecialistaAnalista, t: elasticidade.temDadosSuficientes ? montarNarrativaElasticidade(lang, elasticidade) : cx.prcElasticidadeDadosInsuficientes },
                ].map((e, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{e.l}</p>
                    <p className="text-xs font-medium" style={{ color: "#e2e8f0" }}>{e.t}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{cx.prcRecomendacaoConsolidadaTitulo}</p>
              <div className="space-y-1.5 mb-3">
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <Sparkles size={15} style={{ color: CORES.ouro, flexShrink: 0, marginTop: 2 }} />
                  <p className="text-xs md:text-[13px] font-medium" style={{ color: "#f0d878" }}>{montarNarrativaIPPA(lang, ippa)}</p>
                </div>
                {piorOportunidade && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertTriangle size={15} style={{ color: CORES.vermelhoC, flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs md:text-[13px] font-medium" style={{ color: "#fca5a5" }}>{montarNarrativaOportunidadePrecificacao(lang, piorOportunidade)}</p>
                  </div>
                )}
                {melhorOportunidade && (
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    <Sparkles size={15} style={{ color: CORES.verdeC, flexShrink: 0, marginTop: 2 }} />
                    <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{montarNarrativaOportunidadePrecificacao(lang, melhorOportunidade)}</p>
                  </div>
                )}
              </div>
              <p className="text-[10px] italic leading-relaxed" style={{ color: "#4b5563" }}>{cx.prcTransparenciaTexto}</p>
            </div>

            {/* MEMÓRIA ESTRATÉGICA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(45,35,10,0.9), rgba(10,8,32,0.95))", border: `1px solid ${COR_PRC}30` }}>
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} style={{ color: COR_PRC }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.prcMemoriaTitulo}</p>
              </div>
              <p className="text-xs mb-4" style={{ color: "#64748b" }}>{cx.prcMemoriaSub}</p>
              {decisoes.length === 0 ? (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#64748b" }}>{cx.prcSemDecisoes}</p>
              ) : (
                <div className="space-y-2">
                  {[...decisoes].reverse().slice(0, 10).map((d) => {
                    const produtoNome = produtos.find((p) => p.id === d.produto_id)?.produto_servico || "—";
                    return (
                      <div key={d.id} className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                          <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{produtoNome}</p>
                          <p className="text-[11px]" style={{ color: "#94a3b8" }}>{fBRL(d.preco_anterior)} → {fBRL(d.preco_novo)}</p>
                        </div>
                        <input placeholder={cx.prcResultadoRealLabel} defaultValue={d.resultado_real || ""} onBlur={(e) => atualizarResultadoReal(d.id, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", color: "#c8d8f0" }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lista de produtos (CRUD) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtos.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={COR_PRC}>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-sm truncate mr-2" style={{ color: "#c8d8f0" }}>{p.produto_servico}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(p)}><Pencil size={15} style={{ color: "#6ab0ff" }} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirProduto(p.id)}><Trash2 size={15} style={{ color: "#f87171" }} /></motion.button>
                      </div>
                    </div>
                    <p className="text-2xl font-black mb-3" style={{ color: COR_PRC }}>{fmt(p.preco_sugerido || 0)}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between"><span className="text-xs" style={{ color: "#3a6090" }}>{txt.custo}</span><span className="text-xs font-black" style={{ color: "#f87171" }}>{fmt(p.custo_total || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-xs" style={{ color: "#3a6090" }}>{txt.margem}</span><span className="text-xs font-black" style={{ color: "#34d399" }}>{p.margem_desejada}%</span></div>
                      {p.categoria && <div className="flex justify-between"><span className="text-xs" style={{ color: "#3a6090" }}>{txt.categoriaLabel}</span><span className="text-xs font-black" style={{ color: "#94a3b8" }}>{p.categoria}</span></div>}
                    </div>
                  </CanvasBox>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal criar/editar produto */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }} className="w-full max-w-2xl">
              <CanvasBox cor={COR_PRC}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: COR_PRC }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {[
                      { label: txt.nomeLabel, value: produtoServico, set: setProdutoServico, type: "text" },
                      { label: txt.custoLabel, value: custoTotal, set: setCustoTotal, type: "number" },
                      { label: txt.margemLabel, value: margemDesejada, set: setMargemDesejada, type: "number" },
                      { label: txt.impostosLabel, value: impostos, set: setImpostos, type: "number" },
                      { label: txt.despesasLabel, value: despesas, set: setDespesas, type: "number" },
                      { label: txt.categoriaLabel, value: categoria, set: setCategoria, type: "text" },
                      { label: txt.unidadesLabel, value: unidadesVendidasMes, set: setUnidadesVendidasMes, type: "number" },
                    ].map((c, idx) => (
                      <div key={idx}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{c.label}</label>
                        <input type={c.type} value={c.value} onChange={(e) => c.set(e.target.value)} placeholder="0"
                          className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.statusLabel}</label>
                      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                        <option value="ativo">{txt.statusAtivo}</option>
                        <option value="descontinuado">{txt.statusDescontinuado}</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center items-center text-center gap-4">
                    <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{txt.precoAtual}</p>
                    <motion.p key={editando ? editando.preco_sugerido : precoPreview} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl font-black" style={{ color: COR_PRC }}>
                      {fmt(editando ? editando.preco_sugerido : precoPreview)}
                    </motion.p>
                    <div className="flex gap-3 w-full">
                      <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{txt.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarProduto} disabled={salvando}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: `linear-gradient(135deg, #92400e, ${COR_PRC})`, color: "#1a1400" }}>
                        {salvando ? "..." : txt.salvar}
                      </motion.button>
                    </div>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-start justify-center pt-20 pb-8 z-50 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor={COR_PRC}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: COR_PRC_C }}>AXIOMA AI.TECH</p>
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
