"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search, Pencil, Trash2, X, Plus, CheckCircle2, RotateCcw, Undo2, Paperclip,
  Upload, FileText, AlertTriangle, Sparkles, Landmark, Share2,
  TrendingUp, TrendingDown, Pin, Gauge, Settings, XCircle, History, ChevronDown, ChevronRight, Link2,
  Send, MessageCircleQuestion, ListChecks, ClipboardList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../../../lib/LanguageContext";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import { obterEmpresaAtiva, obterMeuPapel, listarEquipe, type MembroEquipe } from "../../../lib/empresaHelpers";
import { CATEGORIAS_DESPESA, labelCategoriaDespesa } from "../../../lib/categoriasDespesa";
import { parseXMLNFe, type ItemNFe } from "../../../lib/importarParsers";
import { buscarFornecedorPorCnpj, registrarNfeComItens } from "../../../lib/pdvNfeHelpers";
import {
  conferirNfe, diferencaPct, listarMatchResultados, listarDivergencias, decidirMatchResultado,
  type MatchResultadoListado, type DivergenciaListada, type TipoDivergencia,
} from "../../../lib/matchEngineHelpers";
import {
  listarPedidosCompra, listarItensPedido, criarPedidoCompra, editarPedidoCompra, excluirPedidoCompra, cancelarPedidoCompra, reativarPedidoCompra,
  type PedidoCompraListado, type PedidoCompraItemInput,
} from "../../../lib/pedidoCompraHelpers";
import { rankingScoreAxioma, inflacaoFornecedor, statusEfetivo, type FornecedorRow, type ScoreAxiomaFornecedor } from "../../../lib/fornecedorHelpers";
import { carregarLancamentosOrigem, carregarRateios, custosPorCentroReal, type LancamentoOrigem, type RateioRow } from "../../../lib/centroCustoHelpers";
import { resolverPeriodo, periodoAnterior, serieRolling, mesesPorLang, detectarAnomaliasHistoricas, normalizarTexto, type Lancamento, type AnomaliaHistorica } from "../../../lib/cfoCore";
import {
  type ContaPagar, type ContaPagarDocumento, type NfeJaImportada, type ConfigAp, type DuplicataDetectada,
  listarContasPagar, criarContaPagar, editarContaPagar, darBaixaContaPagar, estornarBaixaContaPagar, excluirContaPagar,
  gerarContaDeCustoFixo, listarDocumentos, anexarDocumento, excluirDocumento, gerarUrlDocumento,
  classificarCategoria, checarNfeJaImportadaNoPdv,
  obterConfigAp, salvarConfigAp, detectarDuplicata, registrarAuditoriaAp,
  calcularForecastAp, priorizarPagamentos, type ForecastAp, type HorizonteForecastDias, HORIZONTES_FORECAST_AP, type ItemPrioridadePagamento,
  solicitarAprovacao, listarAprovacoesPendentes, decidirAprovacao, type AprovacaoPendente,
  listarAuditoriaConta, type AuditoriaAp,
  detectarDespesasRecorrentes, transformarPadraoEmCustoFixo, type PadraoRecorrenteDetectado,
  detectarCobrancasAcimaMedia, type CobrancaAcimaMedia,
  detectarMultasEvitaveis, type MultaEvitavel,
  detectarDuplicidadesPassadas, type ParDuplicidadePassada,
  detectarDescontosAproveitaveis, type DescontoAproveitavel,
  detectarDescontosPerdidos, type DescontoPerdido,
  avaliarDescontosComForecast, type DescontoComForecast,
  montarEvidenceGraph, type EvidenceGraphAp,
  avaliarAntecipacaoConjunta, type ResultadoAntecipacaoConjunta,
  montarBriefingAp, type ItemBriefingAp,
  responderPerguntaApPorRegra,
} from "../../../lib/contasPagarHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VERDE = "#34d399";
const VERMELHO = "#f87171";
const AZUL = "#6ab0ff";
const AMBAR = "#f59e0b";
const CINZA = "#5a7a9a";
const ROXO = "#a78bfa";

const FORMAS_PAGAMENTO = ["PIX", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Transferência"];
const PAPEIS_ESCRITA = ["dono", "admin", "financeiro"];
const TIPOS_DOC = [
  { key: "boleto", label: { pt: "Boleto", en: "Bill slip", es: "Boleto" } },
  { key: "nota_fiscal", label: { pt: "Nota Fiscal", en: "Invoice", es: "Factura" } },
  { key: "comprovante", label: { pt: "Comprovante", en: "Receipt", es: "Comprobante" } },
  { key: "outro", label: { pt: "Outro", en: "Other", es: "Otro" } },
];
const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024;

type Fornecedor = FornecedorRow & { nivel_dependencia?: string | null };
type CentroCusto = { id: string; nome: string };
type CustoFixo = { id: string; descricao: string; valor_mensal: number; dia_vencimento: number; categoria?: string | null; centro_custo_id?: string | null };

const contaVazia = {
  fornecedor_id: "", descricao: "", numero_nota: "", chave_acesso: "", categoria: "" as string,
  valor_total: "", data_emissao: "", data_vencimento: "", forma_pagamento: FORMAS_PAGAMENTO[0],
  parcelas: "1", centro_custo_id: "", observacoes: "", taxa_multa_mensal: "",
  desconto_disponivel_pct: "", desconto_data_limite: "",
};

export default function ContasPagarPage() {
  const { idioma } = useLanguage();
  const L = (pt: string, en: string, es: string) => (idioma === "en" ? en : idioma === "es" ? es : pt);
  const cat = (c: string) => labelCategoriaDespesa(c, idioma as "pt" | "en" | "es");

  const [toast, setToast] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "erro" | "ok" = "erro") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const podeEditar = papel != null && PAPEIS_ESCRITA.includes(papel);
  const [configAp, setConfigAp] = useState<ConfigAp | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroVencDe, setFiltroVencDe] = useState("");
  const [filtroVencAte, setFiltroVencAte] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    setEmailUsuario(user.email || null);
    const empId = await obterEmpresaAtiva();
    setEmpresaId(empId);
    if (empId) setPapel(await obterMeuPapel(empId));
    const [cp, { data: forn }, { data: cc }, { data: cf }, cfgAp] = await Promise.all([
      empId ? listarContasPagar(empId) : Promise.resolve([]),
      empId
        ? supabase.from("fornecedores")
            .select("id, nome, nivel_dependencia, status, categoria, nivel_qualidade, classificacao_risco, uf, cidade, created_at, tipo_pessoa, regime_tributario, contribuinte_icms, valor_mensal, centro_custo_id")
            .eq("empresa_id", empId).order("nome")
        : Promise.resolve({ data: [] as Fornecedor[] }),
      empId
        ? supabase.from("centros_custo").select("id, nome").eq("empresa_id", empId).order("nome")
        : Promise.resolve({ data: [] as CentroCusto[] }),
      empId
        ? supabase.from("custos_fixos").select("id, descricao, valor_mensal, dia_vencimento, categoria, centro_custo_id").eq("empresa_id", empId).order("dia_vencimento")
        : Promise.resolve({ data: [] as CustoFixo[] }),
      empId ? obterConfigAp(empId) : Promise.resolve(null),
    ]);
    setContas(cp);
    setFornecedores(forn || []);
    setCentrosCusto(cc || []);
    setCustosFixos(cf || []);
    setConfigAp(cfgAp);
    setLoading(false);
  }

  // ========== CÁLCULOS ==========
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];
  const em7dias = new Date(); em7dias.setDate(em7dias.getDate() + 7);
  const em7ISO = em7dias.toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);
  const nomeFornecedor = (id?: string | null) => fornecedores.find((f) => f.id === id)?.nome || "—";
  const resta = (c: ContaPagar) => Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0));

  const kpis = useMemo(() => {
    // BUG CRÍTICO 2026-08-30 — usar o statusEfetivo (mesma função da linha e
    // do filtro) em vez do c.status cru: garante que uma conta paga nunca
    // conte como "em aberto"/"vencida" nem suma de "pagas no mês" por causa
    // de qualquer divergência entre o texto gravado e o valor_pago real.
    const abertas = contas.filter((c) => statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento) !== "pago");
    const vencendo7 = abertas.filter((c) => c.data_vencimento && c.data_vencimento >= hoje && c.data_vencimento <= em7ISO);
    const vencidas = contas.filter((c) => statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento) === "vencido");
    const pagasNoMes = contas.filter((c) => statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento) === "pago" && (c.data_pagamento || "").slice(0, 7) === mesAtual);
    return {
      totalEmAberto: abertas.reduce((s, c) => s + resta(c), 0),
      vencendoEm7: vencendo7.reduce((s, c) => s + resta(c), 0),
      vencidas: vencidas.reduce((s, c) => s + resta(c), 0),
      pagasNoMes: pagasNoMes.reduce((s, c) => s + (c.valor_pago || 0), 0),
    };
  }, [contas, hoje, em7ISO, mesAtual]);

  const contasFiltradas = useMemo(() => {
    return contas.filter((c) => {
      if (filtroStatus !== "todos" && statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento) !== filtroStatus) return false;
      if (filtroFornecedor && c.fornecedor_id !== filtroFornecedor) return false;
      if (filtroCategoria && c.categoria !== filtroCategoria) return false;
      if (filtroVencDe && (!c.data_vencimento || c.data_vencimento < filtroVencDe)) return false;
      if (filtroVencAte && (!c.data_vencimento || c.data_vencimento > filtroVencAte)) return false;
      if (!busca) return true;
      const alvo = `${c.descricao} ${nomeFornecedor(c.fornecedor_id)} ${c.numero_nota || ""}`.toLowerCase();
      return alvo.includes(busca.toLowerCase());
    });
  }, [contas, busca, filtroStatus, filtroFornecedor, filtroCategoria, filtroVencDe, filtroVencAte, fornecedores]);

  function statusLabel(s?: string | null) {
    if (s === "pago") return L("Pago", "Paid", "Pagado");
    if (s === "parcial") return L("Parcial", "Partial", "Parcial");
    if (s === "vencido") return L("Vencida", "Overdue", "Vencida");
    if (s === "aguardando_aprovacao") return L("Aguardando Aprovação", "Awaiting Approval", "Esperando Aprobación");
    return L("Pendente", "Pending", "Pendiente");
  }
  function statusCor(s?: string | null) {
    if (s === "pago") return VERDE;
    if (s === "parcial") return AZUL;
    if (s === "vencido") return VERMELHO;
    if (s === "aguardando_aprovacao") return ROXO;
    return CINZA;
  }

  // ========== COMPARTILHAR — reaproveita 100% CentroCompartilhamento ==========
  const [shareAberto, setShareAberto] = useState(false);
  const textoResumo = L(
    `Contas a Pagar Axioma: em aberto ${fmt(kpis.totalEmAberto)}, vencendo em 7 dias ${fmt(kpis.vencendoEm7)}, vencidas ${fmt(kpis.vencidas)}.`,
    `Axioma Accounts Payable: outstanding ${fmt(kpis.totalEmAberto)}, due in 7 days ${fmt(kpis.vencendoEm7)}, overdue ${fmt(kpis.vencidas)}.`,
    `Cuentas por Pagar Axioma: abierto ${fmt(kpis.totalEmAberto)}, vence en 7 días ${fmt(kpis.vencendoEm7)}, vencidas ${fmt(kpis.vencidas)}.`,
  );
  const textoDetalhado = [
    `🦅 AXIOMA AI.TECH — ${L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")} (${L("detalhado", "detailed", "detallado")})`,
    ...contasFiltradas.map((c) =>
      `${c.descricao} | ${nomeFornecedor(c.fornecedor_id)} | ${c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-"} | ${statusLabel(statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento))} | ${fmt(c.valor_total)}`
    ),
  ].join("\n");

  // ========== COMMIT 3 (Entrega 2) — ABA INTELIGÊNCIA (prioridade) ==========
  // ========== ENTREGA 3, COMMIT 1 — FORECAST MULTI-HORIZONTE ==========
  const [aba, setAba] = useState<"central" | "inteligencia" | "aprovacoes" | "pedidos" | "conferencia" | "historico">("central");
  const [forecastAp, setForecastAp] = useState<ForecastAp | null>(null);
  const [carregandoForecast, setCarregandoForecast] = useState(false);
  const [horizonteSelecionado, setHorizonteSelecionado] = useState<HorizonteForecastDias>(30);
  const [proximasAPagar, setProximasAPagar] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (aba !== "inteligencia" || !empresaId || forecastAp) return;
    (async () => {
      setCarregandoForecast(true);
      setForecastAp(await calcularForecastAp(empresaId));
      setCarregandoForecast(false);
    })();
  }, [aba, empresaId]);

  const pontoForecast = forecastAp?.pontos.find((p) => p.horizonteDias === horizonteSelecionado) || null;

  // ========== ENTREGA 3, COMMIT 2 — SUPPLIER HEALTH SCORE NO CONTEXTO DE AP ==========
  // Reaproveita 100% rankingScoreAxioma (fornecedorHelpers.ts, já em produção em
  // Fornecedores) — aqui só busca os 2 dados extras que o cálculo precisa
  // (documentos e interações do fornecedor) e traz o resultado pro contexto de
  // pagamento. Carrega 1 vez (não é por aba, precisa em "central" e "inteligencia").
  const [scoreFornecedores, setScoreFornecedores] = useState<{ fornecedor: FornecedorRow; score: ScoreAxiomaFornecedor }[]>([]);
  const [scoreCarregado, setScoreCarregado] = useState(false);

  useEffect(() => {
    if (!empresaId || fornecedores.length === 0 || scoreCarregado) return;
    const empId = empresaId;
    (async () => {
      const [{ data: docs }, { data: interacoes }] = await Promise.all([
        supabase.from("fornecedor_documentos").select("*").eq("empresa_id", empId),
        supabase.from("fornecedor_interacoes").select("*").eq("empresa_id", empId),
      ]);
      setScoreFornecedores(rankingScoreAxioma(fornecedores, contas, docs || [], interacoes || []));
      setScoreCarregado(true);
    })();
  }, [empresaId, fornecedores, contas, scoreCarregado]);

  // Edge case obrigatório: conta sem fornecedor_id, fornecedor sem entrada no
  // ranking (ainda não carregou) ou score sem NENHUM critério com dado real —
  // nunca vira NaN nem quebra a fila, só mostra "sem score".
  function scoreDoFornecedor(fornecedorId: string | null | undefined): ScoreAxiomaFornecedor | null {
    if (!fornecedorId) return null;
    const item = scoreFornecedores.find((r) => r.fornecedor.id === fornecedorId);
    if (!item) return null;
    if (item.score.criterios.every((c) => c.semDados)) return null;
    return item.score;
  }

  function corDoNivelScore(nivel: ScoreAxiomaFornecedor["nivel"]): string {
    return nivel === "critico" ? VERMELHO : nivel === "atencao" ? AMBAR : VERDE;
  }

  const prioridades: ItemPrioridadePagamento[] = useMemo(
    () => priorizarPagamentos(contas, fornecedores, idioma as "pt" | "en" | "es"),
    [contas, fornecedores, idioma]
  );

  // Fixado sobe pro topo, sem embaralhar o resto — sort é estável (garantido
  // desde ES2019), então dentro de cada grupo (fixado / não fixado) a ordem
  // de prioridade que priorizarPagamentos já calculou é preservada.
  const prioridadesOrdenadas: ItemPrioridadePagamento[] = useMemo(
    () => [...prioridades].sort((a, b) => {
      const aFixado = proximasAPagar.has(a.conta.id);
      const bFixado = proximasAPagar.has(b.conta.id);
      return aFixado === bFixado ? 0 : aFixado ? -1 : 1;
    }),
    [prioridades, proximasAPagar]
  );

  // ========== ENTREGA 3, COMMIT 3 — RECURRING EXPENSE INTELLIGENCE ==========
  const padroesRecorrentes: PadraoRecorrenteDetectado[] = useMemo(
    () => detectarDespesasRecorrentes(contas),
    [contas]
  );

  const [padraoParaTransformar, setPadraoParaTransformar] = useState<PadraoRecorrenteDetectado | null>(null);
  const [formCustoFixo, setFormCustoFixo] = useState({ descricao: "", valorMensal: "", diaVencimento: "", categoria: "", centroCustoId: "" });
  const [transformando, setTransformando] = useState(false);

  function abrirTransformarPadrao(padrao: PadraoRecorrenteDetectado) {
    const dia = padrao.ultimaConta.data_vencimento ? Math.min(28, new Date(padrao.ultimaConta.data_vencimento + "T00:00:00").getDate()) : 1;
    setFormCustoFixo({
      descricao: padrao.descricaoExemplo,
      valorMensal: padrao.valorMedio.toFixed(2),
      diaVencimento: String(dia),
      categoria: padrao.categoria || "",
      centroCustoId: padrao.centroCustoId || "",
    });
    setPadraoParaTransformar(padrao);
  }

  async function confirmarTransformarPadrao() {
    if (!padraoParaTransformar || !userId || !empresaId) return;
    const valorMensal = Number(formCustoFixo.valorMensal);
    if (!formCustoFixo.descricao.trim() || !valorMensal || valorMensal <= 0) {
      showToast(L("Preencha descrição e valor mensal.", "Fill in description and monthly amount.", "Complete descripción y valor mensual."), "erro");
      return;
    }
    setTransformando(true);
    const resultado = await transformarPadraoEmCustoFixo(
      userId, empresaId,
      {
        descricao: formCustoFixo.descricao.trim(), valorMensal,
        diaVencimento: Number(formCustoFixo.diaVencimento) || 1,
        categoria: formCustoFixo.categoria || null, centroCustoId: formCustoFixo.centroCustoId || null,
      },
      padraoParaTransformar.idsContas, mesAtual,
    );
    setTransformando(false);
    if (resultado.erro) {
      showToast(L("Não foi possível criar o custo fixo. Tente novamente.", "Could not create the fixed cost. Try again.", "No se pudo crear el costo fijo. Intente de nuevo."), "erro");
      return;
    }
    showToast(L("Custo fixo criado a partir do padrão detectado.", "Fixed cost created from the detected pattern.", "Costo fijo creado a partir del patrón detectado."), "ok");
    setPadraoParaTransformar(null);
    await carregar();
  }

  // ========== ENTREGA 3, COMMIT 4 — VALUE RECOVERY (parte 1) ==========
  const cobrancasAcimaMedia: CobrancaAcimaMedia[] = useMemo(
    () => detectarCobrancasAcimaMedia(fornecedores, contas),
    [fornecedores, contas]
  );

  const duplicidadesPassadas: ParDuplicidadePassada[] = useMemo(
    () => detectarDuplicidadesPassadas(contas),
    [contas]
  );

  const [multasEvitaveis, setMultasEvitaveis] = useState<MultaEvitavel[]>([]);
  const [totalMultasEvitaveis, setTotalMultasEvitaveis] = useState(0);
  const [carregandoValueRecovery, setCarregandoValueRecovery] = useState(false);

  useEffect(() => {
    if (aba !== "inteligencia" || !empresaId) return;
    let ativo = true;
    setCarregandoValueRecovery(true);
    detectarMultasEvitaveis(empresaId).then((r) => {
      if (!ativo) return;
      setMultasEvitaveis(r.multas);
      setTotalMultasEvitaveis(r.totalRecuperavel);
      setCarregandoValueRecovery(false);
    });
    return () => { ativo = false; };
  }, [aba, empresaId]);

  // ========== ENTREGA 3, COMMIT 5 — VALUE RECOVERY (parte 2, desconto por
  // pagamento antecipado) ==========
  const descontosAproveitaveis: DescontoAproveitavel[] = useMemo(
    () => detectarDescontosAproveitaveis(contas),
    [contas]
  );

  // ========== ENTREGA 4, COMMIT 2 — DYNAMIC DISCOUNT ENGINE ==========
  // Cruza os descontos aproveitáveis acima com o AP Forecast (Entrega 3,
  // Commit 1) — fecha o loop do Commit 5. Avaliação isolada por conta (ver
  // comentário em avaliarDescontosComForecast).
  const descontosComForecast: DescontoComForecast[] = useMemo(
    () => avaliarDescontosComForecast(descontosAproveitaveis, forecastAp),
    [descontosAproveitaveis, forecastAp]
  );

  // ========== ENTREGA 4, COMMIT DE MELHORIA — IMPACTO CUMULATIVO ==========
  const [descontosSelecionados, setDescontosSelecionados] = useState<Set<string>>(new Set());
  const [antecipacaoConjunta, setAntecipacaoConjunta] = useState<ResultadoAntecipacaoConjunta | null>(null);
  const [carregandoAntecipacaoConjunta, setCarregandoAntecipacaoConjunta] = useState(false);

  function alternarDescontoSelecionado(contaId: string) {
    setDescontosSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(contaId)) novo.delete(contaId); else novo.add(contaId);
      return novo;
    });
  }

  useEffect(() => {
    if (!empresaId || descontosSelecionados.size === 0) { setAntecipacaoConjunta(null); return; }
    let ativo = true;
    setCarregandoAntecipacaoConjunta(true);
    avaliarAntecipacaoConjunta(empresaId, Array.from(descontosSelecionados)).then((r) => {
      if (!ativo) return;
      setAntecipacaoConjunta(r);
      setCarregandoAntecipacaoConjunta(false);
    });
    return () => { ativo = false; };
  }, [empresaId, descontosSelecionados]);

  const descontosPerdidos: DescontoPerdido[] = useMemo(
    () => detectarDescontosPerdidos(contas),
    [contas]
  );

  const totalRecuperacaoEstimada = useMemo(
    () =>
      cobrancasAcimaMedia.reduce((s, c) => s + c.valorRecuperavelEstimado, 0) +
      totalMultasEvitaveis +
      descontosAproveitaveis.reduce((s, d) => s + d.valorDesconto, 0) +
      descontosPerdidos.reduce((s, d) => s + d.valorPerdido, 0),
    [cobrancasAcimaMedia, totalMultasEvitaveis, descontosAproveitaveis, descontosPerdidos]
  );

  // "Revisar" reaproveita 100% o filtro já existente da aba Central — nunca
  // marca/exclui nada sozinho, só leva o dono pro contexto certo pra decidir.
  function revisarNoCentral(fornecedorId?: string | null) {
    setAba("central");
    if (fornecedorId) setFiltroFornecedor(fornecedorId);
  }

  // ========== ENTREGA 3, COMMIT 6 — SPEND ANALYTICS ==========
  const SEM_CATEGORIA_KEY = "__sem_categoria__";
  const SEM_FORNECEDOR_KEY = "__sem_fornecedor__";

  // 1) Por categoria — groupBy inline sobre as contas já carregadas, mesmo
  // padrão já usado no Dashboard/DashFinanceiro (sem função nova em lib).
  const spendPorCategoria = useMemo(() => {
    const totais = new Map<string, number>();
    contas.forEach((c) => {
      const chave = c.categoria || SEM_CATEGORIA_KEY;
      totais.set(chave, (totais.get(chave) || 0) + (c.valor_total || 0));
    });
    const totalGeral = contas.reduce((s, c) => s + (c.valor_total || 0), 0);
    return Array.from(totais.entries())
      .map(([chave, valor]) => ({
        chave,
        label: chave === SEM_CATEGORIA_KEY ? L("Sem categoria", "No category", "Sin categoría") : cat(chave),
        valor,
        pct: totalGeral > 0 ? Math.round((valor / totalGeral) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [contas, idioma]);

  // 2) Por fornecedor — reaproveita 100% inflacaoFornecedor (fornecedorHelpers.ts,
  // já em produção em Fornecedores) pra classificar tendência do ticket médio.
  // Mesmo limiar de ±1% do compararPeriodos (cfoCore.ts) pra decidir "estável".
  type TendenciaFornecedor = "subindo" | "caindo" | "estavel" | "sem_dados";
  const spendPorFornecedor = useMemo(() => {
    const periodoAtual = resolverPeriodo("mes_atual");
    const periodoAnt = periodoAnterior(periodoAtual);
    const totais = new Map<string, number>();
    contas.forEach((c) => {
      const chave = c.fornecedor_id || SEM_FORNECEDOR_KEY;
      totais.set(chave, (totais.get(chave) || 0) + (c.valor_total || 0));
    });
    return Array.from(totais.entries())
      .map(([chave, valor]) => {
        if (chave === SEM_FORNECEDOR_KEY) {
          return { fornecedorId: null as string | null, nome: L("Sem fornecedor", "No supplier", "Sin proveedor"), valor, tendencia: "sem_dados" as TendenciaFornecedor, variacaoPct: 0 };
        }
        const contasDoForn = contas.filter((c) => c.fornecedor_id === chave);
        const infl = inflacaoFornecedor(contasDoForn, periodoAtual, periodoAnt);
        const tendencia: TendenciaFornecedor = !infl.amostraSuficiente ? "sem_dados" : Math.abs(infl.variacaoPct) < 1 ? "estavel" : infl.variacaoPct > 0 ? "subindo" : "caindo";
        return { fornecedorId: chave, nome: nomeFornecedor(chave), valor, tendencia, variacaoPct: infl.variacaoPct };
      })
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);
  }, [contas, fornecedores, idioma]);

  // 3) Por centro de custo — reaproveita carregarLancamentosOrigem +
  // custosPorCentroReal (centroCustoHelpers.ts, já blindado por empresa_id
  // nesta mesma auditoria) — contas_pagar já é uma das origens que esse motor
  // cruza com rateio, nenhuma consulta nova.
  const [origensCentroCusto, setOrigensCentroCusto] = useState<LancamentoOrigem[]>([]);
  const [rateiosCentroCusto, setRateiosCentroCusto] = useState<RateioRow[]>([]);
  const [carregandoSpendCentro, setCarregandoSpendCentro] = useState(false);

  useEffect(() => {
    if (aba !== "inteligencia" || !empresaId) return;
    let ativo = true;
    setCarregandoSpendCentro(true);
    Promise.all([
      carregarLancamentosOrigem(empresaId, "contas_pagar"),
      carregarRateios(empresaId),
    ]).then(([origens, rateios]) => {
      if (!ativo) return;
      setOrigensCentroCusto(origens);
      setRateiosCentroCusto(rateios);
      setCarregandoSpendCentro(false);
    });
    return () => { ativo = false; };
  }, [aba, empresaId]);

  const spendPorCentroCusto = useMemo(() => {
    const porCentro = custosPorCentroReal(origensCentroCusto, rateiosCentroCusto);
    // custosPorCentroReal só soma quem TEM centro atribuído (direto ou via
    // rateio) — o restante (sem centro e sem rateio) fica de fora dela por
    // padrão em todo o módulo de Centro de Custos; somamos à parte aqui só
    // pra não esconder gasto nenhum do total do painel.
    const idsComRateio = new Set(rateiosCentroCusto.map((r) => `${r.origem_tabela}:${r.origem_id}`));
    const semCentro = origensCentroCusto
      .filter((o) => !o.centro_custo_id && !idsComRateio.has(`${o.tabela}:${o.id}`))
      .reduce((s, o) => s + o.valor, 0);
    const totalGeral = Object.values(porCentro).reduce((s, v) => s + v, 0) + semCentro;
    const linhas = Object.entries(porCentro).map(([centroId, valor]) => ({
      centroId, nome: centrosCusto.find((c) => c.id === centroId)?.nome || centroId, valor,
      pct: totalGeral > 0 ? Math.round((valor / totalGeral) * 1000) / 10 : 0,
    }));
    if (semCentro > 0) {
      linhas.push({ centroId: "", nome: L("Sem centro de custo", "No cost center", "Sin centro de costo"), valor: semCentro, pct: totalGeral > 0 ? Math.round((semCentro / totalGeral) * 1000) / 10 : 0 });
    }
    return linhas.sort((a, b) => b.valor - a.valor);
  }, [origensCentroCusto, rateiosCentroCusto, centrosCusto, idioma]);

  // 4) Tendência — reaproveita 100% serieRolling (cfoCore.ts, mesmo motor do
  // Dashboard). Só o rótulo do mês é remontado aqui pra respeitar o idioma
  // (serieRolling sempre devolve o nome do mês em PT).
  const MESES_TENDENCIA = 12;
  const tendenciaMensal = useMemo(() => {
    const lancamentos: Lancamento[] = contas
      .filter((c) => c.data_emissao || c.data_vencimento)
      .map((c) => ({ valor: c.valor_total || 0, data: (c.data_emissao || c.data_vencimento) as string }));
    const valores = serieRolling(lancamentos, MESES_TENDENCIA).map((b) => b.value);
    const hojeRef = new Date();
    const nomesMes = mesesPorLang(idioma);
    const labels: string[] = [];
    for (let i = MESES_TENDENCIA - 1; i >= 0; i--) {
      const d = new Date(hojeRef.getFullYear(), hojeRef.getMonth() - i, 1);
      labels.push(nomesMes[d.getMonth()]);
    }
    return labels.map((label, i) => ({ label, valor: valores[i] || 0 }));
  }, [contas, idioma]);

  const maiorValorTendencia = Math.max(1, ...tendenciaMensal.map((t) => t.valor));

  // ========== ENTREGA 4, COMMIT 1 — FRAUD & ANOMALY ENGINE (por regra, sem
  // IA). Reaproveita 100% detectarAnomaliasHistoricas (cfoCore.ts) — mesma
  // função já usada em Fornecedores sobre esta mesma tabela, mesmo
  // mapeamento ContaPagar→Lancamento do Commit 6. Zero função nova. Sempre
  // ALERTA pra revisar, nunca afirmação de erro — pode ter explicação
  // legítima (reajuste combinado, nota emitida em duplicidade por engano
  // do próprio fornecedor, etc.). Ângulo diferente do Commit 4 (Cobranças
  // Acima da Média): aquele compara fornecedor contra os outros da mesma
  // categoria; este compara um lançamento contra o PRÓPRIO histórico (pela
  // descrição normalizada) — detecta inclusive quem não tem nenhum outro
  // fornecedor comparável na categoria pra entrar no Commit 4.
  const anomaliasContasPagar = useMemo(() => {
    const lancamentos: Lancamento[] = contas
      .filter((c) => c.data_emissao || c.data_vencimento)
      .map((c) => ({ valor: c.valor_total || 0, data: (c.data_emissao || c.data_vencimento) as string, categoria: c.categoria || undefined, status: c.status || undefined, descricao: c.descricao }));
    return detectarAnomaliasHistoricas(lancamentos);
  }, [contas]);

  // Contagem de ocorrências por descrição — só pra mostrar "com base em N
  // lançamentos" na explicação (transparência). Mesma normalização que a
  // própria função usa pra agrupar, não é um agrupamento novo/paralelo.
  const contagemPorDescricaoAnomalia = useMemo(() => {
    const m = new Map<string, number>();
    contas.forEach((c) => {
      if (!c.data_emissao && !c.data_vencimento) return;
      const chave = normalizarTexto(c.descricao || "");
      if (!chave) return;
      m.set(chave, (m.get(chave) || 0) + 1);
    });
    return m;
  }, [contas]);

  const anomaliasAcimaMedia = anomaliasContasPagar.filter((a) => a.tipo === "acima_media");
  const anomaliasAumentoRecorrente = anomaliasContasPagar.filter((a) => a.tipo === "aumento_recorrente");

  function percentualAnomalia(a: AnomaliaHistorica): number | null {
    if (a.valorReferencia <= 0) return null;
    return Math.round(((a.valorAtual - a.valorReferencia) / a.valorReferencia) * 100);
  }

  function revisarPorDescricaoNoCentral(descricao: string) {
    setAba("central");
    setBusca(descricao);
  }

  // Persistido em localStorage (por empresa) — decisão de "onde guarda": não
  // é dado de negócio real (não afeta cálculo nenhum, é só um lembrete visual
  // pessoal de "olho nessa conta"), e criar coluna/tabela nova em Contas a
  // Pagar só pra isso seria SQL novo pra algo que o navegador já resolve.
  // Some se o dono limpar os dados do site — aceitável pra esse tipo de marca.
  function chavePinos(empId: string) { return `axioma:ap:proximasAPagar:${empId}`; }

  useEffect(() => {
    if (!empresaId) return;
    try {
      const salvo = localStorage.getItem(chavePinos(empresaId));
      if (salvo) setProximasAPagar(new Set(JSON.parse(salvo)));
    } catch {}
  }, [empresaId]);

  function alternarProximaAPagar(id: string) {
    setProximasAPagar((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      if (empresaId) {
        try { localStorage.setItem(chavePinos(empresaId), JSON.stringify(Array.from(novo))); } catch {}
      }
      return novo;
    });
  }

  // ========== COMMIT 4 — CONFIGURAÇÃO AP ==========
  // Só dono (não admin): listarEquipe() já é uma RPC restrita a dono em todo
  // o resto do app (listar_equipe recusa quem não é dono) — a lista de
  // aprovadores usa a mesma fonte, então a tela de configurar quem aprova
  // segue a mesma fronteira de acesso já estabelecida, sem abrir uma exceção
  // nova só pra este módulo.
  const podeConfigurarAp = papel === "dono";
  const [equipe, setEquipe] = useState<MembroEquipe[]>([]);
  const [modalConfigAp, setModalConfigAp] = useState(false);
  const [configForm, setConfigForm] = useState({
    limite: "500", aprovadores: [] as string[], bloquearDuplicata: true, diasJanela: "30",
    toleranciaValor: "2", toleranciaQuantidade: "0",
  });
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  async function abrirConfigAp() {
    if (empresaId) setEquipe((await listarEquipe(empresaId)).dados);
    setConfigForm({
      limite: String(configAp?.limite_aprovacao_automatica ?? 500),
      aprovadores: configAp?.aprovadores || [],
      bloquearDuplicata: configAp?.bloquear_duplicata ?? true,
      diasJanela: String(configAp?.dias_janela_duplicata ?? 30),
      // != null (via ??), nunca || — 0% é uma tolerância válida (bater exato),
      // não "ausência de valor" (bug que já corrigimos no Commit 2).
      toleranciaValor: String(configAp?.match_tolerancia_valor_pct ?? 2),
      toleranciaQuantidade: String(configAp?.match_tolerancia_quantidade_pct ?? 0),
    });
    setModalConfigAp(true);
  }

  function alternarAprovador(userId2: string) {
    setConfigForm((prev) => ({
      ...prev,
      aprovadores: prev.aprovadores.includes(userId2) ? prev.aprovadores.filter((u) => u !== userId2) : [...prev.aprovadores, userId2],
    }));
  }

  async function salvarConfiguracaoAp() {
    if (!empresaId) return;
    const toleranciaValor = parseFloat(configForm.toleranciaValor);
    const toleranciaQuantidade = parseFloat(configForm.toleranciaQuantidade);
    if (isNaN(toleranciaValor) || isNaN(toleranciaQuantidade)) {
      showToast(L("Informe um número válido nas tolerâncias.", "Enter a valid number for the tolerances.", "Ingrese un número válido en las tolerancias."), "erro");
      return;
    }
    if (toleranciaValor < 0 || toleranciaQuantidade < 0) {
      showToast(L("A tolerância não pode ser negativa.", "Tolerance can't be negative.", "La tolerancia no puede ser negativa."), "erro");
      return;
    }
    if (toleranciaValor > 100 || toleranciaQuantidade > 100) {
      showToast(L("Tolerância acima de 100% não faz sentido — revise o número.", "Tolerance above 100% doesn't make sense — check the number.", "Tolerancia superior al 100% no tiene sentido — revise el número."), "erro");
      return;
    }
    setSalvandoConfig(true);
    const { erro } = await salvarConfigAp(empresaId, {
      limite_aprovacao_automatica: parseFloat(configForm.limite || "500"),
      aprovadores: configForm.aprovadores,
      bloquear_duplicata: configForm.bloquearDuplicata,
      dias_janela_duplicata: parseInt(configForm.diasJanela || "30"),
      match_tolerancia_valor_pct: toleranciaValor,
      match_tolerancia_quantidade_pct: toleranciaQuantidade,
    });
    if (erro) {
      showToast(L("Não foi possível salvar a configuração. Tente novamente.", "Could not save the configuration. Try again.", "No se pudo guardar la configuración. Intente de nuevo."), "erro");
      setSalvandoConfig(false);
      return;
    }
    setConfigAp(await obterConfigAp(empresaId));
    setModalConfigAp(false);
    setSalvandoConfig(false);
  }

  // ========== COMMIT 4 — APROVAÇÕES PENDENTES ==========
  const podeAprovar = papel === "dono" || (!!userId && (configAp?.aprovadores || []).includes(userId));
  const [aprovacoes, setAprovacoes] = useState<AprovacaoPendente[]>([]);
  const [carregandoAprovacoes, setCarregandoAprovacoes] = useState(false);
  const [motivoDecisao, setMotivoDecisao] = useState<Record<string, string>>({});
  const [decidindoId, setDecidindoId] = useState<string | null>(null);

  useEffect(() => {
    // Também carrega na aba Inteligência — o CFO AP Briefing (Entrega 4,
    // Commit 5) precisa saber quantas aprovações estão pendentes mesmo que
    // o dono nunca tenha aberto a aba Aprovações nesta sessão.
    if ((aba !== "aprovacoes" && aba !== "inteligencia") || !empresaId) return;
    const empId = empresaId;
    (async () => {
      setCarregandoAprovacoes(true);
      setAprovacoes(await listarAprovacoesPendentes(empId));
      setCarregandoAprovacoes(false);
    })();
  }, [aba, empresaId]);

  // ========== ENTREGA 4, COMMIT 5 — CFO AP BRIEFING V1 + NATURAL LANGUAGE CFO V1 ==========
  // Puramente derivado do que a tela já carregou/calculou — zero fetch novo,
  // zero motor novo. montarBriefingAp/responderPerguntaApPorRegra (lib) são o
  // único ponto de geração de texto, prontos pra virar IA real (/api/ia-chat,
  // mesmo padrão ZIA) sem mexer nesta tela.
  const aprovacoesPendentesValor = useMemo(() => aprovacoes.reduce((s, a) => s + (a.valor || 0), 0), [aprovacoes]);

  const briefingAp = useMemo(() => montarBriefingAp({
    lang: idioma as "pt" | "en" | "es",
    forecastAp,
    totalVencido: kpis.vencidas,
    totalVencendo7: kpis.vencendoEm7,
    aprovacoesPendentesQtd: aprovacoes.length,
    aprovacoesPendentesValor,
    totalRecuperacaoEstimada,
    duplicidadesPassadas,
    anomalias: anomaliasContasPagar,
  }), [idioma, forecastAp, kpis.vencidas, kpis.vencendoEm7, aprovacoes.length, aprovacoesPendentesValor, totalRecuperacaoEstimada, duplicidadesPassadas, anomaliasContasPagar]);

  function irParaItemBriefing(item: ItemBriefingAp) {
    setAba(item.abaAlvo);
    if (item.filtroStatus) setFiltroStatus(item.filtroStatus);
  }

  const [perguntaCfo, setPerguntaCfo] = useState("");
  const [respostaCfo, setRespostaCfo] = useState<string | null>(null);
  const [carregandoRespostaCfo, setCarregandoRespostaCfo] = useState(false);

  function contextoCfoPorRegra() {
    return {
      lang: idioma as "pt" | "en" | "es",
      forecastAp,
      spendPorCategoria,
      spendPorFornecedor,
      duplicidadesPassadas,
      descontosComForecast,
      multasEvitaveis,
      anomalias: anomaliasContasPagar,
      aprovacoesPendentesQtd: aprovacoes.length,
    };
  }

  // Vira texto o MESMO dado real que o V1 por regra já usa (nada novo é
  // calculado aqui) — só números prontos, nunca uma pergunta ou acesso a
  // banco. É isso que a IA recebe: interpreta o que já está pronto, nunca
  // inventa um valor que não esteja nesta lista.
  function montarContextoCfoIa(): string {
    const linhas: string[] = [];
    linhas.push(L(
      "Você é a inteligência financeira do Axioma, especializada em Contas a Pagar de PMEs brasileiras. Responda de forma direta e prática, como um CFO experiente conversando com o dono do negócio. Use SOMENTE os números abaixo — nunca invente ou estime um valor que não esteja aqui; se a pergunta pedir algo que não está nos dados, diga claramente que ainda não tem essa informação.",
      "You are Axioma's financial intelligence, specialized in Accounts Payable for Brazilian SMBs. Respond directly and practically, like an experienced CFO talking to the business owner. Use ONLY the numbers below — never invent or estimate a value that isn't here; if the question asks for something not in the data, clearly say you don't have that information yet.",
      "Usted es la inteligencia financiera de Axioma, especializada en Cuentas por Pagar de PYMEs brasileñas. Responda de forma directa y práctica, como un CFO experimentado hablando con el dueño del negocio. Use SOLO los números abajo — nunca invente o estime un valor que no esté aquí; si la pregunta pide algo que no está en los datos, diga claramente que todavía no tiene esa información."
    ));
    linhas.push("");
    linhas.push(L("DADOS REAIS DESTA EMPRESA:", "REAL DATA FOR THIS COMPANY:", "DATOS REALES DE ESTA EMPRESA:"));

    if (forecastAp) {
      for (const h of HORIZONTES_FORECAST_AP) {
        const ponto = forecastAp.pontos.find((p) => p.horizonteDias === h);
        if (!ponto) continue;
        const totalAPagar = Math.max(0, ponto.saldoProjetadoSemPagamentos - ponto.saldoProjetadoOtimista);
        const rupturaTxt = ponto.ruptura ? ` (${L("caixa fica negativo em", "cash goes negative in", "caja queda negativa en")} ${ponto.ruptura.diasRestantes} ${L("dias", "days", "días")})` : "";
        linhas.push(`- ${L("Previsto pagar em", "Expected to pay in", "Previsto a pagar en")} ${h} ${L("dias", "days", "días")}: ${fmt(totalAPagar)}${rupturaTxt}`);
      }
    }
    linhas.push(`- ${L("Total vencido agora", "Total overdue now", "Total vencido ahora")}: ${fmt(kpis.vencidas)}`);
    linhas.push(`- ${L("Vencendo em 7 dias", "Due in 7 days", "Vence en 7 días")}: ${fmt(kpis.vencendoEm7)}`);
    linhas.push(`- ${L("Aprovações pendentes", "Pending approvals", "Aprobaciones pendientes")}: ${aprovacoes.length}`);
    if (spendPorCategoria.length > 0) {
      linhas.push(`- ${L("Maiores categorias de gasto", "Biggest spending categories", "Mayores categorías de gasto")}: ${spendPorCategoria.slice(0, 3).map((c) => `${c.label} (${fmt(c.valor)}, ${c.pct}%)`).join(", ")}`);
    }
    if (spendPorFornecedor.length > 0) {
      linhas.push(`- ${L("Maiores fornecedores", "Biggest suppliers", "Mayores proveedores")}: ${spendPorFornecedor.slice(0, 3).map((f) => `${f.nome} (${fmt(f.valor)})`).join(", ")}`);
    }
    linhas.push(`- ${L("Possíveis duplicatas detectadas", "Possible duplicates detected", "Posibles duplicados detectados")}: ${duplicidadesPassadas.length}`);
    if (descontosComForecast.length > 0) {
      const totalDesconto = descontosComForecast.reduce((s, d) => s + d.valorDesconto, 0);
      linhas.push(`- ${L("Descontos disponíveis por pagamento antecipado", "Discounts available for early payment", "Descuentos disponibles por pago anticipado")}: ${descontosComForecast.length} (${fmt(totalDesconto)} ${L("no total", "total", "en total")})`);
    }
    if (multasEvitaveis.length > 0) {
      const totalMultas = multasEvitaveis.reduce((s, m) => s + m.valorMulta, 0);
      linhas.push(`- ${L("Multas por atraso pagas recentemente que davam pra evitar", "Recently paid late fees that could've been avoided", "Multas por atraso pagadas recientemente que se podían evitar")}: ${multasEvitaveis.length} (${fmt(totalMultas)} ${L("no total", "total", "en total")})`);
    }
    if (anomaliasContasPagar.length > 0) {
      linhas.push(`- ${L("Anomalias de gasto detectadas", "Spending anomalies detected", "Anomalías de gasto detectadas")}: ${anomaliasContasPagar.length}`);
    }
    if (totalRecuperacaoEstimada > 0) {
      linhas.push(`- ${L("Recuperação total estimada (descontos + multas evitáveis)", "Total estimated recovery (discounts + avoidable fees)", "Recuperación total estimada (descuentos + multas evitables)")}: ${fmt(totalRecuperacaoEstimada)}`);
    }
    return linhas.join("\n");
  }

  // IA real (OpenAI, via /api/ia-chat) primeiro; se falhar ou estiver fora,
  // cai no V1 por regra que já existia — nunca quebra, só troca de fonte.
  // Mesmo padrão do MEI IA Advisor (fetch + catch vazio + fallback síncrono).
  async function perguntarAoCfo(perguntaDireta?: string) {
    const pergunta = (perguntaDireta ?? perguntaCfo).trim();
    if (!pergunta) return;
    if (perguntaDireta) setPerguntaCfo(perguntaDireta);

    setCarregandoRespostaCfo(true);
    let resposta = "";
    try {
      const res = await fetch("/api/ia-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: pergunta, historico: [], contexto: montarContextoCfoIa(), provedor: "openai" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.resposta) resposta = data.resposta;
      }
    } catch {}

    if (!resposta) {
      showToast(L("Respondendo com base em regras — a inteligência do Axioma está indisponível no momento.", "Answering based on rules — Axioma's intelligence is unavailable right now.", "Respondiendo con base en reglas — la inteligencia de Axioma está indisponible en este momento."), "erro");
      resposta = responderPerguntaApPorRegra(pergunta, contextoCfoPorRegra());
    }
    setRespostaCfo(resposta);
    setCarregandoRespostaCfo(false);
  }

  const PERGUNTAS_SUGERIDAS_CFO: Record<"pt" | "en" | "es", string[]> = {
    pt: ["Quanto vou pagar em 30 dias?", "Onde estou gastando mais?", "Tem conta duplicada?", "Algum desconto pra aproveitar?", "Meu caixa aguenta?"],
    en: ["How much will I pay in 30 days?", "Where am I spending the most?", "Any duplicate bills?", "Any discount to grab?", "Can my cash handle it?"],
    es: ["¿Cuánto voy a pagar en 30 días?", "¿Dónde estoy gastando más?", "¿Hay cuentas duplicadas?", "¿Algún descuento para aprovechar?", "¿Mi caja aguanta?"],
  };

  // Carregado sempre que a empresa é conhecida (não só pra quem aprova) —
  // tanto a fila de Aprovações Pendentes quanto o Histórico precisam
  // resolver nome de usuário, e nomear colega de equipe não é dado sensível
  // (a própria tela de Equipe já mostra isso pra qualquer membro).
  const [equipeCache, setEquipeCache] = useState<MembroEquipe[]>([]);
  useEffect(() => { if (empresaId) listarEquipe(empresaId).then((r) => setEquipeCache(r.dados)); }, [empresaId]);

  function nomeUsuario(id?: string | null): string {
    if (!id) return "—";
    const m = equipeCache.find((e) => e.user_id === id);
    return m?.nome || m?.email || `${id.slice(0, 8)}…`;
  }

  async function decidir(aprovacaoId: string, decisao: "aprovada" | "rejeitada") {
    if (!empresaId) return;
    const motivo = (motivoDecisao[aprovacaoId] || "").trim();
    if (decisao === "rejeitada" && !motivo) {
      showToast(L("Informe o motivo da rejeição.", "Enter the rejection reason.", "Informe el motivo del rechazo."), "erro");
      return;
    }
    setDecidindoId(aprovacaoId);
    const { erro } = await decidirAprovacao(aprovacaoId, decisao, motivo || undefined);
    if (erro) {
      showToast(L("Não foi possível registrar a decisão. Tente novamente.", "Could not register the decision. Try again.", "No se pudo registrar la decisión. Intente de nuevo."), "erro");
      setDecidindoId(null);
      return;
    }
    setAprovacoes(await listarAprovacoesPendentes(empresaId));
    await carregar();
    setDecidindoId(null);
  }

  // ========== COMMIT 4 — PEDIDO DE COMPRA (MATCH ENGINE 3-WAY) ==========
  // Tela mínima: criar um pedido pra um fornecedor é o gesto que liga o
  // nível 3-way pra ele (ver criarPedidoCompra) — não existe toggle separado
  // em Fornecedores. Fornecedor sem nenhum pedido continua 100% nível base.
  type PedidoItemForm = { descricao: string; codigo_fornecedor: string; ean: string; quantidade: string; valor_unitario: string };
  const itemPedidoVazio: PedidoItemForm = { descricao: "", codigo_fornecedor: "", ean: "", quantidade: "", valor_unitario: "" };

  const [pedidosCompra, setPedidosCompra] = useState<PedidoCompraListado[]>([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(false);
  const [modalPedido, setModalPedido] = useState(false);
  const [editandoPedido, setEditandoPedido] = useState<PedidoCompraListado | null>(null);
  const [formPedido, setFormPedido] = useState({ fornecedor_id: "", numero: "", data_emissao: hoje, observacao: "" });
  const [itensPedidoForm, setItensPedidoForm] = useState<PedidoItemForm[]>([{ ...itemPedidoVazio }]);
  const [salvandoPedido, setSalvandoPedido] = useState(false);

  useEffect(() => {
    if (aba !== "pedidos" || !empresaId) return;
    const empId = empresaId;
    (async () => { setCarregandoPedidos(true); setPedidosCompra(await listarPedidosCompra(empId)); setCarregandoPedidos(false); })();
  }, [aba, empresaId]);

  function abrirNovoPedido() {
    setEditandoPedido(null);
    setFormPedido({ fornecedor_id: "", numero: "", data_emissao: hoje, observacao: "" });
    setItensPedidoForm([{ ...itemPedidoVazio }]);
    setModalPedido(true);
  }

  async function abrirEdicaoPedido(p: PedidoCompraListado) {
    if (!empresaId) return;
    setEditandoPedido(p);
    setFormPedido({ fornecedor_id: p.fornecedor_id || "", numero: p.numero, data_emissao: p.data_emissao || hoje, observacao: p.observacao || "" });
    const itens = await listarItensPedido(empresaId, p.id);
    setItensPedidoForm(itens.length > 0 ? itens.map((it) => ({
      descricao: it.descricao, codigo_fornecedor: it.codigo_fornecedor || "", ean: it.ean || "",
      quantidade: String(it.quantidade), valor_unitario: String(it.valor_unitario),
    })) : [{ ...itemPedidoVazio }]);
    setModalPedido(true);
  }

  function fecharModalPedido() { setModalPedido(false); setEditandoPedido(null); }

  function atualizarItemPedido(idx: number, campo: keyof PedidoItemForm, valor: string) {
    setItensPedidoForm((atual) => { const copia = [...atual]; copia[idx] = { ...copia[idx], [campo]: valor }; return copia; });
  }
  function adicionarItemPedido() { setItensPedidoForm((atual) => [...atual, { ...itemPedidoVazio }]); }
  function removerItemPedido(idx: number) { setItensPedidoForm((atual) => (atual.length <= 1 ? atual : atual.filter((_, i) => i !== idx))); }

  const totalFormPedido = itensPedidoForm.reduce((s, it) => s + (parseFloat(it.quantidade || "0") * parseFloat(it.valor_unitario || "0") || 0), 0);

  async function salvarPedido() {
    if (!empresaId || !userId) return;
    if (!formPedido.fornecedor_id || !formPedido.numero.trim()) {
      showToast(L("Selecione o fornecedor e informe o número do pedido.", "Select the supplier and enter the order number.", "Seleccione el proveedor e ingrese el número de la orden."), "erro");
      return;
    }
    const itensValidos: PedidoCompraItemInput[] = itensPedidoForm
      .filter((it) => it.descricao.trim() && parseFloat(it.quantidade || "0") > 0)
      .map((it) => ({
        descricao: it.descricao.trim(), codigo_fornecedor: it.codigo_fornecedor.trim() || null, ean: it.ean.trim() || null,
        quantidade: parseFloat(it.quantidade), valor_unitario: parseFloat(it.valor_unitario || "0"),
      }));
    if (itensValidos.length === 0) {
      showToast(L("Inclua ao menos um item com descrição e quantidade.", "Include at least one item with a description and quantity.", "Incluya al menos un ítem con descripción y cantidad."), "erro");
      return;
    }
    setSalvandoPedido(true);
    if (editandoPedido) {
      const { erro } = await editarPedidoCompra(empresaId, editandoPedido.id, {
        numero: formPedido.numero.trim(), dataEmissao: formPedido.data_emissao || null, observacao: formPedido.observacao || null, itens: itensValidos,
      });
      if (erro === "tem_nota_vinculada") {
        showToast(L("Este pedido já tem nota vinculada — não dá pra trocar os itens. Crie um novo pedido para itens adicionais.", "This order already has a linked invoice — its items can't be replaced. Create a new order for additional items.", "Esta orden ya tiene factura vinculada — no se pueden reemplazar los ítems. Cree una nueva orden para ítems adicionales."), "erro");
        setSalvandoPedido(false);
        return;
      }
      if (erro) {
        showToast(L("Não foi possível salvar o pedido. Tente novamente.", "Could not save the order. Try again.", "No se pudo guardar la orden. Intente de nuevo."), "erro");
        setSalvandoPedido(false);
        return;
      }
    } else {
      const { erro } = await criarPedidoCompra(userId, empresaId, {
        fornecedorId: formPedido.fornecedor_id, numero: formPedido.numero.trim(), dataEmissao: formPedido.data_emissao || null, observacao: formPedido.observacao || null, itens: itensValidos,
      });
      if (erro) {
        showToast(L("Não foi possível criar o pedido. Tente novamente.", "Could not create the order. Try again.", "No se pudo crear la orden. Intente de nuevo."), "erro");
        setSalvandoPedido(false);
        return;
      }
    }
    fecharModalPedido();
    setPedidosCompra(await listarPedidosCompra(empresaId));
    setSalvandoPedido(false);
  }

  async function excluirPedido(p: PedidoCompraListado) {
    if (!empresaId) return;
    const { erro } = await excluirPedidoCompra(empresaId, p.id);
    if (erro === "tem_nota_vinculada") {
      showToast(L("Este pedido já tem nota vinculada — não é possível excluir. Cancele o pedido em vez de excluir.", "This order already has a linked invoice — it can't be deleted. Cancel it instead of deleting.", "Esta orden ya tiene factura vinculada — no se puede eliminar. Cancele la orden en lugar de eliminarla."), "erro");
      return;
    }
    if (erro) {
      showToast(L("Não foi possível excluir o pedido. Tente novamente.", "Could not delete the order. Try again.", "No se pudo eliminar la orden. Intente de nuevo."), "erro");
      return;
    }
    setPedidosCompra(await listarPedidosCompra(empresaId));
  }

  async function cancelarPedido(p: PedidoCompraListado) {
    if (!empresaId) return;
    const { erro } = await cancelarPedidoCompra(empresaId, p.id, p.status);
    if (erro === "ja_faturado") {
      showToast(L("Este pedido já foi totalmente faturado — não faz sentido cancelar.", "This order was already fully invoiced — cancelling doesn't apply.", "Esta orden ya fue totalmente facturada — no tiene sentido cancelarla."), "erro");
      return;
    }
    if (erro) {
      showToast(L("Não foi possível cancelar o pedido. Tente novamente.", "Could not cancel the order. Try again.", "No se pudo cancelar la orden. Intente de nuevo."), "erro");
      return;
    }
    setPedidosCompra(await listarPedidosCompra(empresaId));
  }

  async function reativarPedido(p: PedidoCompraListado) {
    if (!empresaId) return;
    const { erro } = await reativarPedidoCompra(empresaId, p.id);
    if (erro) {
      showToast(L("Não foi possível reativar o pedido. Tente novamente.", "Could not reactivate the order. Try again.", "No se pudo reactivar la orden. Intente de nuevo."), "erro");
      return;
    }
    setPedidosCompra(await listarPedidosCompra(empresaId));
  }

  function labelStatusPedido(status: string): string {
    const mapa: Record<string, [string, string, string]> = {
      aberto: ["Aberto", "Open", "Abierta"], parcial: ["Parcial", "Partial", "Parcial"],
      recebido: ["Recebido", "Received", "Recibida"], faturado: ["Faturado", "Invoiced", "Facturada"],
      cancelado: ["Cancelado", "Cancelled", "Cancelada"],
    };
    const t = mapa[status] || [status, status, status];
    return L(t[0], t[1], t[2]);
  }

  function corStatusPedido(status: string): string {
    if (status === "faturado") return VERDE;
    if (status === "cancelado") return CINZA;
    if (status === "parcial") return AMBAR;
    return AZUL; // aberto/recebido
  }

  // ========== COMMIT 3 — FILA DE EXCEÇÃO (MOTOR DE MATCH) ==========
  const [filtroConferencia, setFiltroConferencia] = useState<"excecao" | "ok" | "todas">("excecao");
  const [matchResultados, setMatchResultados] = useState<MatchResultadoListado[]>([]);
  const [carregandoConferencia, setCarregandoConferencia] = useState(false);
  const [divergenciasPorMatch, setDivergenciasPorMatch] = useState<Record<string, DivergenciaListada[]>>({});
  const [decidindoMatchId, setDecidindoMatchId] = useState<string | null>(null);
  const [reconferindoId, setReconferindoId] = useState<string | null>(null);

  useEffect(() => {
    if (aba !== "conferencia" || !empresaId) return;
    const empId = empresaId;
    const filtro = filtroConferencia === "todas" ? undefined : filtroConferencia;
    (async () => {
      setCarregandoConferencia(true);
      setMatchResultados(await listarMatchResultados(empId, filtro));
      setCarregandoConferencia(false);
    })();
  }, [aba, empresaId, filtroConferencia]);

  async function recarregarConferencia() {
    if (!empresaId) return;
    setMatchResultados(await listarMatchResultados(empresaId, filtroConferencia === "todas" ? undefined : filtroConferencia));
  }

  async function alternarConferenciaExpandida(matchId: string) {
    const estavaExpandido = expandido.has(matchId);
    alternarExpandido(matchId);
    if (!estavaExpandido && !divergenciasPorMatch[matchId] && empresaId) {
      const divs = await listarDivergencias(empresaId, matchId);
      setDivergenciasPorMatch((prev) => ({ ...prev, [matchId]: divs }));
    }
  }

  async function decidirMatch(m: MatchResultadoListado, decisao: "aprovado" | "rejeitado") {
    if (!empresaId || !userId) return;
    setDecidindoMatchId(m.id);
    const { erro } = await decidirMatchResultado(empresaId, m.id, decisao, userId);
    if (erro) {
      showToast(L("Não foi possível registrar a decisão. Tente novamente.", "Could not register the decision. Try again.", "No se pudo registrar la decisión. Intente de nuevo."), "erro");
      setDecidindoMatchId(null);
      return;
    }
    if (m.contasPagarId) {
      await registrarAuditoriaAp(m.contasPagarId, decisao === "aprovado" ? "match_aprovado" : "match_rejeitado", null, { match_resultado_id: m.id, chave_acesso: m.chaveAcesso, numero_nf: m.numeroNf });
    }
    await recarregarConferencia();
    setDecidindoMatchId(null);
  }

  async function reconferirNota(m: MatchResultadoListado) {
    if (!empresaId) return;
    setReconferindoId(m.id);
    const resultado = await conferirNfe(empresaId, m.nfeImportadaId);
    if (resultado.erro) {
      showToast(L("Não foi possível reconferir esta nota. Tente novamente.", "Could not re-check this invoice. Try again.", "No se pudo reconciliar esta factura. Intente de nuevo."), "erro");
    } else {
      showToast(
        resultado.status === "ok"
          ? L("Reconferido: tudo bate agora.", "Re-checked: everything matches now.", "Reconciliado: todo coincide ahora.")
          : L(`Reconferido: ${resultado.divergencias.length} divergência(s) ainda encontrada(s).`, `Re-checked: ${resultado.divergencias.length} discrepancy(ies) still found.`, `Reconciliado: ${resultado.divergencias.length} discrepancia(s) todavía encontradas.`),
        resultado.status === "ok" ? "ok" : "erro"
      );
      setDivergenciasPorMatch((prev) => { const copia = { ...prev }; delete copia[m.id]; return copia; });
      await recarregarConferencia();
    }
    setReconferindoId(null);
  }

  function corStatusMatch(status: string): string {
    if (status === "ok") return VERDE;
    if (status === "excecao") return VERMELHO;
    if (status === "aprovado") return VERDE;
    if (status === "rejeitado") return CINZA;
    return CINZA;
  }

  function labelStatusMatch(status: string): string {
    const mapa: Record<string, [string, string, string]> = {
      ok: ["Conferida", "Matched", "Conciliada"],
      excecao: ["Divergência", "Discrepancy", "Discrepancia"],
      aprovado: ["Aprovada mesmo assim", "Approved anyway", "Aprobada de todos modos"],
      rejeitado: ["Rejeitada", "Rejected", "Rechazada"],
      pendente: ["Ainda não conferida", "Not checked yet", "Todavía no conciliada"],
    };
    const t = mapa[status] || [status, status, status];
    return L(t[0], t[1], t[2]);
  }

  function labelTipoDivergencia(tipo: TipoDivergencia): string {
    const mapa: Record<TipoDivergencia, [string, string, string]> = {
      valor: ["Valor", "Amount", "Valor"],
      quantidade: ["Quantidade", "Quantity", "Cantidad"],
      nao_recebido: ["Não recebido", "Not received", "No recibido"],
      recebido_sem_nota: ["Recebido sem nota", "Received, no line", "Recibido sin línea"],
      sem_conta: ["Sem conta a pagar", "No bill yet", "Sin cuenta a pagar"],
      sem_pedido: ["Sem pedido de compra", "No purchase order", "Sin orden de compra"],
      pedido_nao_faturado: ["Pedido não faturado", "Order not invoiced", "Pedido no facturado"],
      divergencia_pedido: ["Diferente do pedido", "Differs from order", "Diferente de la orden"],
      reprovado_inspecao: ["Reprovado na inspeção", "Failed inspection", "Rechazado en inspección"],
    };
    const t = mapa[tipo];
    return L(t[0], t[1], t[2]);
  }

  // Frase humana por divergência — nada de nome de tabela/coluna, só o que
  // mudou. nfeItemId nulo em tipo 'valor' é o caso especial "nota x conta a
  // pagar" (não é um item específico).
  function explicarDivergencia(d: DivergenciaListada): string {
    const pct = (esp: number, enc: number) => Math.round(diferencaPct(esp, enc));
    switch (d.tipo) {
      case "valor": {
        const esp = d.esperado ?? 0, enc = d.encontrado ?? 0;
        if (d.nfeItemId === null) {
          return L(
            `${d.descricaoItem}: a nota totaliza ${fmt(esp)}, a conta a pagar está em ${fmt(enc)} — ${pct(esp, enc)}% de diferença.`,
            `${d.descricaoItem}: the invoice totals ${fmt(esp)}, the bill is at ${fmt(enc)} — ${pct(esp, enc)}% difference.`,
            `${d.descricaoItem}: la factura totaliza ${fmt(esp)}, la cuenta está en ${fmt(enc)} — ${pct(esp, enc)}% de diferencia.`
          );
        }
        const acima = enc > esp;
        return L(
          `${d.descricaoItem}: a nota cobra ${fmt(esp)}, recebido a ${fmt(enc)} — ${pct(esp, enc)}% ${acima ? "acima" : "abaixo"}.`,
          `${d.descricaoItem}: the invoice charges ${fmt(esp)}, received at ${fmt(enc)} — ${pct(esp, enc)}% ${acima ? "above" : "below"}.`,
          `${d.descricaoItem}: la factura cobra ${fmt(esp)}, recibido a ${fmt(enc)} — ${pct(esp, enc)}% ${acima ? "por encima" : "por debajo"}.`
        );
      }
      case "quantidade": {
        const esp = d.esperado ?? 0, enc = d.encontrado ?? 0;
        return L(
          `${d.descricaoItem}: a nota tem ${esp} un., recebido ${enc} un. — ${pct(esp, enc)}% de diferença.`,
          `${d.descricaoItem}: the invoice has ${esp} un., received ${enc} un. — ${pct(esp, enc)}% difference.`,
          `${d.descricaoItem}: la factura tiene ${esp} un., recibido ${enc} un. — ${pct(esp, enc)}% de diferencia.`
        );
      }
      case "nao_recebido":
        return L(
          `${d.descricaoItem}: consta na nota (${d.esperado ?? 0} un.) mas não há recebimento de estoque vinculado.`,
          `${d.descricaoItem}: on the invoice (${d.esperado ?? 0} un.) but no linked stock receipt.`,
          `${d.descricaoItem}: consta en la factura (${d.esperado ?? 0} un.) pero no hay recepción de stock vinculada.`
        );
      case "recebido_sem_nota":
        return L(
          `${d.descricaoItem}: há recebimento de estoque vinculado a esta nota sem item correspondente nela.`,
          `${d.descricaoItem}: there's a stock receipt linked to this invoice with no matching line on it.`,
          `${d.descricaoItem}: hay una recepción de stock vinculada a esta factura sin ítem correspondiente en ella.`
        );
      case "sem_conta":
        return L(
          `${d.descricaoItem} (${fmt(d.esperado ?? 0)}) ainda não virou conta a pagar.`,
          `${d.descricaoItem} (${fmt(d.esperado ?? 0)}) hasn't become a bill yet.`,
          `${d.descricaoItem} (${fmt(d.esperado ?? 0)}) todavía no se convirtió en cuenta a pagar.`
        );
      case "sem_pedido":
        return L(
          `${d.descricaoItem}: veio nesta nota mas não bate com nenhum item de pedido de compra em aberto deste fornecedor.`,
          `${d.descricaoItem}: on this invoice but doesn't match any open purchase order line for this supplier.`,
          `${d.descricaoItem}: vino en esta factura pero no coincide con ningún ítem de orden de compra abierta de este proveedor.`
        );
      case "pedido_nao_faturado":
        return L(
          `${d.descricaoItem}: consta no pedido de compra (${d.esperado ?? 0} un.) mas ainda não veio em nenhuma nota deste fornecedor.`,
          `${d.descricaoItem}: on the purchase order (${d.esperado ?? 0} un.) but hasn't arrived on any invoice from this supplier yet.`,
          `${d.descricaoItem}: consta en la orden de compra (${d.esperado ?? 0} un.) pero todavía no llegó en ninguna factura de este proveedor.`
        );
      case "divergencia_pedido": {
        const esp = d.esperado ?? 0, enc = d.encontrado ?? 0;
        return L(
          `${d.descricaoItem}: o pedido de compra previa ${fmt(esp)}, a nota traz ${fmt(enc)} — ${pct(esp, enc)}% de diferença.`,
          `${d.descricaoItem}: the purchase order expected ${fmt(esp)}, the invoice brings ${fmt(enc)} — ${pct(esp, enc)}% difference.`,
          `${d.descricaoItem}: la orden de compra preveía ${fmt(esp)}, la factura trae ${fmt(enc)} — ${pct(esp, enc)}% de diferencia.`
        );
      }
      default:
        return d.descricaoItem;
    }
  }

  // ========== COMMIT 4 — HISTÓRICO (AUDITORIA) ==========
  const [contaHistoricoId, setContaHistoricoId] = useState("");
  const [auditoria, setAuditoria] = useState<AuditoriaAp[]>([]);
  const [carregandoAuditoria, setCarregandoAuditoria] = useState(false);
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!contaHistoricoId || !empresaId) { setAuditoria([]); return; }
    const empId = empresaId;
    (async () => {
      setCarregandoAuditoria(true);
      setAuditoria(await listarAuditoriaConta(contaHistoricoId, empId));
      setCarregandoAuditoria(false);
    })();
  }, [contaHistoricoId, empresaId]);

  // ========== ENTREGA 4, COMMIT 3 — EVIDENCE GRAPH V1 ==========
  const [contaRastreabilidade, setContaRastreabilidade] = useState<ContaPagar | null>(null);
  const [evidenceGraph, setEvidenceGraph] = useState<EvidenceGraphAp | null>(null);
  const [carregandoEvidenceGraph, setCarregandoEvidenceGraph] = useState(false);

  async function abrirRastreabilidade(c: ContaPagar) {
    if (!empresaId) return;
    setContaRastreabilidade(c);
    setEvidenceGraph(null);
    setCarregandoEvidenceGraph(true);
    const grafo = await montarEvidenceGraph(c, nomeFornecedor(c.fornecedor_id), empresaId);
    setEvidenceGraph(grafo);
    setCarregandoEvidenceGraph(false);
  }
  function fecharRastreabilidade() { setContaRastreabilidade(null); setEvidenceGraph(null); }

  function acaoLabel(acao: string): string {
    const mapa: Record<string, [string, string, string]> = {
      criou: ["Criou", "Created", "Creó"], editou: ["Editou", "Edited", "Editó"],
      baixou: ["Deu baixa", "Paid", "Pagó"], estornou: ["Estornou", "Reversed", "Reversó"],
      excluiu: ["Excluiu", "Deleted", "Eliminó"], aprovou: ["Aprovou", "Approved", "Aprobó"],
      rejeitou: ["Rejeitou", "Rejected", "Rechazó"],
      duplicata_detectada: ["Duplicata detectada", "Duplicate detected", "Duplicado detectado"],
      duplicata_ignorada: ["Duplicata ignorada", "Duplicate ignored", "Duplicado ignorado"],
      match_aprovado: ["Divergência de conferência aprovada", "Match discrepancy approved", "Discrepancia de conciliación aprobada"],
      match_rejeitado: ["Divergência de conferência rejeitada", "Match discrepancy rejected", "Discrepancia de conciliación rechazada"],
    };
    const t = mapa[acao] || [acao, acao, acao];
    return L(t[0], t[1], t[2]);
  }

  function alternarExpandido(id: string) {
    setExpandido((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  // ========== MODAL NOVA/EDITAR CONTA ==========
  const [modalConta, setModalConta] = useState(false);
  const [editando, setEditando] = useState<ContaPagar | null>(null);
  const [nc, setNc] = useState({ ...contaVazia });
  const [salvando, setSalvando] = useState(false);
  const [sugestaoCategoria, setSugestaoCategoria] = useState<string | null>(null);
  // Detalhe da NF-e (se a conta atual do modal veio de um XML importado) —
  // nfeImportadaId nulo = ainda não existe estoque_nfe_importadas pra essa
  // chave, então precisa gravar cabeçalho+itens ao salvar; preenchido = a
  // nota já foi registrada por outra tela (PDV), só vincula, nunca duplica.
  const [nfeParaGravar, setNfeParaGravar] = useState<{ chaveAcesso: string; itens: ItemNFe[]; nfeImportadaId: string | null } | null>(null);

  function abrirNovaConta() { setEditando(null); setNc({ ...contaVazia }); setSugestaoCategoria(null); setNfeParaGravar(null); setModalConta(true); }
  function abrirEdicaoConta(c: ContaPagar) {
    setEditando(c);
    setNc({
      fornecedor_id: c.fornecedor_id || "", descricao: c.descricao || "", numero_nota: c.numero_nota || "",
      chave_acesso: c.chave_acesso || "",
      categoria: c.categoria || "", valor_total: String(c.valor_total || ""),
      data_emissao: c.data_emissao || "", data_vencimento: c.data_vencimento || "",
      forma_pagamento: c.forma_pagamento || FORMAS_PAGAMENTO[0], parcelas: String(c.parcelas || "1"),
      centro_custo_id: c.centro_custo_id || "", observacoes: c.observacoes || "",
      taxa_multa_mensal: c.taxa_multa_mensal != null ? String(c.taxa_multa_mensal) : "",
      desconto_disponivel_pct: c.desconto_disponivel_pct != null ? String(c.desconto_disponivel_pct) : "",
      desconto_data_limite: c.desconto_data_limite || "",
    });
    setSugestaoCategoria(null);
    setNfeParaGravar(null);
    setModalConta(true);
  }
  function fecharModalConta() { setModalConta(false); setEditando(null); setNc({ ...contaVazia }); setSugestaoCategoria(null); setNfeParaGravar(null); }

  async function sugerirCategoriaPorDescricao() {
    if (nc.categoria || !nc.descricao.trim()) return;
    const sugestao = await classificarCategoria(empresaId, nc.descricao);
    if (sugestao) setSugestaoCategoria(sugestao);
  }

  async function salvarConta() {
    if (!nc.descricao || !nc.valor_total || !nc.data_vencimento || !userId) return;

    // Desconto por pagamento antecipado — os dois campos são opcionais, mas
    // se preenchidos precisam fazer sentido: 0% não é desconto (é ausência
    // dele, deixa em branco), e prazo já vencido no ato do cadastro não serve
    // pra nada. Barra aqui pra nunca gravar lixo nas colunas novas.
    let descontoPct: number | null = null;
    if (nc.desconto_disponivel_pct.trim()) {
      descontoPct = parseFloat(nc.desconto_disponivel_pct);
      if (isNaN(descontoPct) || descontoPct <= 0 || descontoPct > 100) {
        showToast(L("O desconto deve ser um percentual entre 0 e 100 (ex: 2 para 2%).", "The discount must be a percentage between 0 and 100 (e.g. 2 for 2%).", "El descuento debe ser un porcentaje entre 0 y 100 (ej: 2 para 2%)."), "erro");
        return;
      }
    }
    let descontoDataLimite: string | null = null;
    if (nc.desconto_data_limite.trim()) {
      // Só barra data no passado quando o valor está sendo definido/alterado
      // agora — editar outro campo de uma conta antiga cujo prazo de desconto
      // já passou não pode travar por causa disso.
      const dataMudou = nc.desconto_data_limite !== (editando?.desconto_data_limite || "");
      if (dataMudou && nc.desconto_data_limite < hoje) {
        showToast(L("A data limite do desconto já passou. Corrija a data ou deixe o campo em branco.", "The discount deadline has already passed. Fix the date or leave the field blank.", "La fecha límite del descuento ya pasó. Corrija la fecha o deje el campo en blanco."), "erro");
        return;
      }
      descontoDataLimite = nc.desconto_data_limite;
    }

    const dados = {
      fornecedor_id: nc.fornecedor_id || null, descricao: nc.descricao, numero_nota: nc.numero_nota || null,
      chave_acesso: nc.chave_acesso || null,
      categoria: nc.categoria || "Outros", valor_total: parseFloat(nc.valor_total || "0"),
      valor_pago: editando?.valor_pago || 0, data_emissao: nc.data_emissao || null, data_vencimento: nc.data_vencimento,
      forma_pagamento: nc.forma_pagamento, parcelas: parseInt(nc.parcelas || "1"),
      centro_custo_id: nc.centro_custo_id || null, observacoes: nc.observacoes || null,
      taxa_multa_mensal: nc.taxa_multa_mensal ? parseFloat(nc.taxa_multa_mensal) : null,
      desconto_disponivel_pct: descontoPct, desconto_data_limite: descontoDataLimite,
    };

    if (editando) {
      // Edição não passa pela checagem de duplicidade — a conta já existe,
      // não está sendo criada de novo.
      setSalvando(true);
      const resultado = await editarContaPagar(editando.id, dados);
      if (resultado.erro) {
        showToast(L("Não foi possível salvar a conta. Tente novamente.", "Could not save the bill. Try again.", "No se pudo guardar la cuenta. Intente de nuevo."), "erro");
        setSalvando(false);
        return;
      }
      fecharModalConta(); await carregar(); setSalvando(false);
      return;
    }

    // Nova conta: checa duplicidade ANTES de inserir (mesmo caminho serve
    // pro formulário manual e pra Importar XML NF-e, que também termina
    // caindo neste modal antes de salvar).
    if (!empresaId) return;
    setSalvando(true);
    const { duplicatas } = await detectarDuplicata({
      empresaId, fornecedorId: nc.fornecedor_id || null, valorTotal: dados.valor_total,
      dataEmissao: nc.data_emissao || nc.data_vencimento, numeroNota: nc.numero_nota || null,
      diasJanela: configAp?.dias_janela_duplicata,
    });
    const relevantes = duplicatas.filter((d) => d.score >= 70);
    if (relevantes.length === 0) {
      await inserirContaDeFato(dados);
      return;
    }
    setDuplicatas(relevantes);
    setDadosPendentes(dados);
    setSenhaForcar(""); setErroForcar("");
    setModalDuplicata(true);
    const { erro: erroAuditoria } = await registrarAuditoriaAp(relevantes[0].contas_pagar_id, "duplicata_detectada", null, { candidata: dados, similares: relevantes });
    if (erroAuditoria) showToast(L("O registro de auditoria desta duplicidade falhou.", "The audit record for this duplicate failed.", "El registro de auditoría de este duplicado falló."), "erro");
    setSalvando(false);
  }

  async function inserirContaDeFato(dados: Record<string, any>, ignorouDuplicata: boolean = false) {
    if (!userId) return;
    setSalvando(true);
    const resultado = await criarContaPagar(userId, empresaId, dados);
    if (resultado.erro || !resultado.id) {
      showToast(L("Não foi possível salvar a conta. Tente novamente.", "Could not save the bill. Try again.", "No se pudo guardar la cuenta. Intente de nuevo."), "erro");
      setSalvando(false);
      return;
    }
    if (ignorouDuplicata) {
      const { erro: erroAuditoria } = await registrarAuditoriaAp(resultado.id, "duplicata_ignorada", null, { duplicatas });
      if (erroAuditoria) showToast(L("Conta salva, mas o registro de auditoria falhou.", "Bill saved, but the audit record failed.", "Cuenta guardada, pero el registro de auditoría falló."), "erro");
    }
    // Entrega 2 Commit 4 — só DEPOIS do insert, como pedido: decide sozinha
    // (auto_aprovada) ou trava a conta em 'aguardando_aprovacao' até alguém
    // decidir na aba Aprovações Pendentes.
    const { erro: erroAprovacao } = await solicitarAprovacao(resultado.id);
    if (erroAprovacao) {
      showToast(L("Conta salva, mas não foi possível definir o status de aprovação. Verifique na aba Aprovações Pendentes.", "Bill saved, but could not set the approval status. Check the Pending Approvals tab.", "Cuenta guardada, pero no se pudo definir el estado de aprobación. Revise en la pestaña Aprobaciones Pendientes."), "erro");
    }
    // Conta veio de um XML e essa NF-e ainda não tem estoque_nfe_importadas
    // (nenhuma tela gravou antes) — grava cabeçalho + nfe_itens agora, pelo
    // mesmo caminho único que o PDV usa. Se a nota já foi importada pelo PDV
    // (nfeImportadaId preenchido), não regrava — só o vínculo por
    // chave_acesso na conta (acima) já é suficiente.
    let nfeImportadaIdParaConferir = nfeParaGravar?.nfeImportadaId || null;
    if (empresaId && nfeParaGravar && !nfeParaGravar.nfeImportadaId) {
      const { id: nfeIdGravado, erro: erroNfe } = await registrarNfeComItens(empresaId, userId, {
        chaveAcesso: nfeParaGravar.chaveAcesso, numeroNf: dados.numero_nota || undefined,
        fornecedorId: dados.fornecedor_id || null, valorTotal: dados.valor_total,
        itens: nfeParaGravar.itens,
      });
      if (erroNfe) {
        showToast(L("Conta salva, mas o detalhe da NF-e não pôde ser gravado para o motor de conferência. Tente reimportar o XML depois.", "Bill saved, but the NF-e detail could not be saved for the matching engine. Try re-importing the XML later.", "Cuenta guardada, pero el detalle de la NF-e no se pudo guardar para el motor de conciliación. Intente reimportar el XML después."), "erro");
      } else {
        nfeImportadaIdParaConferir = nfeIdGravado || null;
      }
    }
    // Conferência roda sob demanda, junto do próprio salvar — vale tanto pra
    // nota nova quanto pra vínculo com nota já importada pelo PDV (agora ela
    // ganha a conta que faltava). Detalhe das divergências: aba Conferência de Notas.
    if (empresaId && nfeImportadaIdParaConferir) {
      const conferencia = await conferirNfe(empresaId, nfeImportadaIdParaConferir);
      if (!conferencia.erro) {
        if (conferencia.status === "ok") showToast(L("Conta salva e conferida: tudo bate com o recebimento.", "Bill saved and matched: everything checks out against receiving.", "Cuenta guardada y conciliada: todo coincide con la recepción."), "ok");
        else showToast(L(`Conta salva. Conferência encontrou ${conferencia.divergencias.length} divergência(s) nesta nota — veja o detalhe na aba Conferência de Notas.`, `Bill saved. Match check found ${conferencia.divergencias.length} discrepancy(ies) on this invoice — see the details in the Invoice Matching tab.`, `Cuenta guardada. La conciliación encontró ${conferencia.divergencias.length} discrepancia(s) en esta factura — vea el detalle en la pestaña Conciliación de Facturas.`), "erro");
      }
    }
    fecharModalConta(); fecharModalDuplicata(); await carregar(); setSalvando(false);
  }

  // ========== COMMIT 2 — MODAL DE POSSÍVEL DUPLICATA ==========
  const [modalDuplicata, setModalDuplicata] = useState(false);
  const [duplicatas, setDuplicatas] = useState<DuplicataDetectada[]>([]);
  const [dadosPendentes, setDadosPendentes] = useState<Record<string, any> | null>(null);
  const [mostrarForcar, setMostrarForcar] = useState(false);
  const [senhaForcar, setSenhaForcar] = useState("");
  const [erroForcar, setErroForcar] = useState("");
  const [forcando, setForcando] = useState(false);

  const maiorScoreDuplicata = duplicatas.reduce((m, d) => Math.max(m, d.score), 0);
  const duplicataBloqueada = maiorScoreDuplicata >= 90 && (configAp?.bloquear_duplicata ?? true);

  function fecharModalDuplicata() {
    setModalDuplicata(false); setDuplicatas([]); setDadosPendentes(null);
    setMostrarForcar(false); setSenhaForcar(""); setErroForcar("");
  }

  async function salvarMesmoAssim() {
    if (!dadosPendentes) return;
    await inserirContaDeFato(dadosPendentes, true);
  }

  function vincularAExistente(dup: DuplicataDetectada) {
    const existente = contas.find((c) => c.id === dup.contas_pagar_id);
    if (!existente) return;
    fecharModalDuplicata();
    fecharModalConta();
    abrirEdicaoConta(existente);
  }

  async function confirmarForcarSenha() {
    if (!emailUsuario || !senhaForcar || !dadosPendentes) return;
    setForcando(true); setErroForcar("");
    const { error } = await supabase.auth.signInWithPassword({ email: emailUsuario, password: senhaForcar });
    if (error) {
      setErroForcar(L("Senha incorreta.", "Incorrect password.", "Contraseña incorrecta."));
      setForcando(false);
      return;
    }
    setForcando(false);
    await inserirContaDeFato(dadosPendentes, true);
  }

  async function excluir(c: ContaPagar) {
    const { erro } = await excluirContaPagar(c.id, c.status);
    if (erro === "conta_paga") {
      showToast(L("Não é possível excluir uma conta já paga. Estorne a baixa primeiro.", "You can't delete a bill that's already paid. Reverse the payment first.", "No se puede eliminar una cuenta ya pagada. Primero reversa el pago."), "erro");
      return;
    }
    if (erro) {
      showToast(L("Não foi possível excluir a conta. Tente novamente.", "Could not delete the bill. Try again.", "No se pudo eliminar la cuenta. Intente de nuevo."), "erro");
      return;
    }
    await carregar();
  }

  // ========== MODAL BAIXA / ESTORNO ==========
  const [modalBaixa, setModalBaixa] = useState(false);
  const [contaBaixa, setContaBaixa] = useState<ContaPagar | null>(null);
  const [valorBaixa, setValorBaixa] = useState("");
  const [dataBaixa, setDataBaixa] = useState("");
  const [formaBaixa, setFormaBaixa] = useState(FORMAS_PAGAMENTO[0]);
  const [processandoBaixa, setProcessandoBaixa] = useState(false);

  function abrirBaixa(c: ContaPagar) {
    setContaBaixa(c);
    setValorBaixa(resta(c).toFixed(2));
    setDataBaixa(hoje);
    setFormaBaixa(c.forma_pagamento || FORMAS_PAGAMENTO[0]);
    setModalBaixa(true);
  }
  function fecharBaixa() { setModalBaixa(false); setContaBaixa(null); }

  async function confirmarBaixa() {
    if (!contaBaixa || !valorBaixa || !dataBaixa) return;
    setProcessandoBaixa(true);
    const novoPago = (contaBaixa.valor_pago || 0) + parseFloat(valorBaixa);
    const { erro } = await darBaixaContaPagar(contaBaixa, novoPago, dataBaixa, formaBaixa);
    if (erro) {
      showToast(L("Não foi possível registrar a baixa. Tente novamente.", "Could not register the payment. Try again.", "No se pudo registrar el pago. Intente de nuevo."), "erro");
      setProcessandoBaixa(false);
      return;
    }
    fecharBaixa(); await carregar(); setProcessandoBaixa(false);
  }

  async function estornar(c: ContaPagar) {
    const { erro } = await estornarBaixaContaPagar(c);
    if (erro) {
      showToast(L("Não foi possível estornar a baixa. Tente novamente.", "Could not reverse the payment. Try again.", "No se pudo reversar el pago. Intente de nuevo."), "erro");
      return;
    }
    await carregar();
  }

  // ========== MODAL GERAR DE CUSTO FIXO ==========
  const [modalCustoFixo, setModalCustoFixo] = useState(false);
  const [gerando, setGerando] = useState<string | null>(null);

  async function gerarDeCustoFixo(cf: CustoFixo) {
    if (!userId || !empresaId) return;
    setGerando(cf.id);
    const resultado = await gerarContaDeCustoFixo(userId, empresaId, cf, mesAtual);
    if (resultado.erro) {
      showToast(L("Não foi possível gerar a conta. Tente novamente.", "Could not generate the bill. Try again.", "No se pudo generar la cuenta. Intente de nuevo."), "erro");
    } else if (resultado.jaExiste) {
      showToast(L("Este custo fixo já gerou uma conta a pagar neste mês.", "This fixed cost already generated a bill this month.", "Este costo fijo ya generó una cuenta a pagar este mes."), "ok");
    } else {
      showToast(L("Conta a pagar gerada com sucesso.", "Bill generated successfully.", "Cuenta a pagar generada con éxito."), "ok");
      await carregar();
    }
    setGerando(null);
  }

  // ========== MODAL ANEXO ==========
  const [modalAnexo, setModalAnexo] = useState(false);
  const [contaAnexo, setContaAnexo] = useState<ContaPagar | null>(null);
  const [documentos, setDocumentos] = useState<ContaPagarDocumento[]>([]);
  const [tipoNovoDoc, setTipoNovoDoc] = useState("boleto");
  const [enviandoDoc, setEnviandoDoc] = useState(false);

  async function abrirAnexo(c: ContaPagar) {
    if (!empresaId) return;
    setContaAnexo(c);
    setDocumentos(await listarDocumentos(c.id, empresaId));
    setModalAnexo(true);
  }
  function fecharAnexo() { setModalAnexo(false); setContaAnexo(null); setDocumentos([]); }

  async function enviarAnexo(file: File) {
    if (!contaAnexo || !userId || !empresaId) return;
    if (!/^(application\/pdf|image\/)/.test(file.type)) {
      showToast(L("Envie um PDF ou uma imagem.", "Upload a PDF or an image.", "Envíe un PDF o una imagen."), "erro");
      return;
    }
    if (file.size > TAMANHO_MAX_ANEXO) {
      showToast(L("Arquivo muito grande (máx. 10MB).", "File too large (max 10MB).", "Archivo demasiado grande (máx. 10MB)."), "erro");
      return;
    }
    setEnviandoDoc(true);
    const { erro } = await anexarDocumento(file, contaAnexo.id, userId, empresaId, tipoNovoDoc);
    if (erro) {
      showToast(L("Não foi possível anexar o arquivo. Tente novamente.", "Could not attach the file. Try again.", "No se pudo adjuntar el archivo. Intente de nuevo."), "erro");
      setEnviandoDoc(false);
      return;
    }
    setDocumentos(await listarDocumentos(contaAnexo.id, empresaId));
    setEnviandoDoc(false);
  }

  async function abrirDocumento(doc: ContaPagarDocumento) {
    const url = await gerarUrlDocumento(doc.storage_path);
    if (url) window.open(url, "_blank");
  }

  async function removerDocumento(doc: ContaPagarDocumento) {
    const { erro } = await excluirDocumento(doc);
    if (erro) {
      showToast(L("Não foi possível excluir o documento. Tente novamente.", "Could not delete the document. Try again.", "No se pudo eliminar el documento. Intente de nuevo."), "erro");
      return;
    }
    if (contaAnexo && empresaId) setDocumentos(await listarDocumentos(contaAnexo.id, empresaId));
  }

  // ========== IMPORTAR XML NF-E (com trava anti-duplicação) ==========
  const [processandoNfe, setProcessandoNfe] = useState(false);
  const [avisoNfeDuplicada, setAvisoNfeDuplicada] = useState<{ nfe: NfeJaImportada; dados: any } | null>(null);

  async function importarXmlNfe(file: File) {
    if (!empresaId || !userId) return;
    setProcessandoNfe(true);
    try {
      const texto = await file.text();
      const resultado = await parseXMLNFe(texto, undefined, idioma as any);
      const md = resultado.metadados || {};
      if (!md.chave_acesso && !md.razao_social) {
        showToast(L("Arquivo não reconhecido como NF-e válida.", "File not recognized as a valid NF-e.", "Archivo no reconocido como NF-e válida."), "erro");
        setProcessandoNfe(false);
        return;
      }
      const jaImportada = md.chave_acesso ? await checarNfeJaImportadaNoPdv(empresaId, md.chave_acesso) : null;
      if (jaImportada) {
        setAvisoNfeDuplicada({ nfe: jaImportada, dados: md });
        setProcessandoNfe(false);
        return;
      }
      await abrirModalComDadosNfe(md, null, resultado.itensNFe || []);
    } catch {
      showToast(L("Não foi possível ler o arquivo XML.", "Could not read the XML file.", "No se pudo leer el archivo XML."), "erro");
    }
    setProcessandoNfe(false);
  }

  async function abrirModalComDadosNfe(md: any, vincularNfeId: string | null, itensNfe: ItemNFe[] = []) {
    let fornecedorId = "";
    if (md.cnpj_emitente && empresaId) {
      const forn = await buscarFornecedorPorCnpj(empresaId, md.cnpj_emitente);
      if (forn) fornecedorId = forn.id;
    }
    setEditando(null);
    setNc({
      ...contaVazia,
      fornecedor_id: fornecedorId,
      descricao: md.fantasia || md.razao_social || "",
      numero_nota: md.numero_nf || "",
      chave_acesso: md.chave_acesso || "",
      valor_total: md.valor_total ? String(md.valor_total) : "",
      data_emissao: md.data_emissao || "",
      observacoes: vincularNfeId ? L(
        `Vinculada à compra já importada pelo PDV (NF-e ${md.numero_nf || ""}).`,
        `Linked to the purchase already imported by the POS (NF-e ${md.numero_nf || ""}).`,
        `Vinculada a la compra ya importada por el PDV (NF-e ${md.numero_nf || ""}).`,
      ) : "",
    });
    setNfeParaGravar(md.chave_acesso ? { chaveAcesso: md.chave_acesso, itens: itensNfe, nfeImportadaId: vincularNfeId } : null);
    setSugestaoCategoria(null);
    setModalConta(true);
    setAvisoNfeDuplicada(null);
  }

  // ========== RENDER ==========
  const semDados = contas.length === 0;

  return (
    <ModuloLayout
      titulo={L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")}
      subtitulo={L("Central de obrigações com fornecedores — vencimentos, baixas e anexos num só lugar.", "Supplier obligations center — due dates, payments and attachments in one place.", "Central de obligaciones con proveedores — vencimientos, pagos y adjuntos en un solo lugar.")}
      onNovo={podeEditar ? abrirNovaConta : undefined}
      labelBotao={L("Nova Conta", "New Bill", "Nueva Cuenta")}
      botaoExtra={
        <>
          {podeEditar && (
            <>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setModalCustoFixo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(167,139,250,0.15)", color: ROXO, border: "1px solid rgba(167,139,250,0.3)" }}>
                <Landmark size={16} />{L("Gerar de Custo Fixo", "Generate from Fixed Cost", "Generar de Costo Fijo")}
              </motion.button>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                <Upload size={16} />{processandoNfe ? L("Lendo…", "Reading…", "Leyendo…") : L("Importar XML NF-e", "Import NF-e XML", "Importar XML NF-e")}
                <input type="file" accept=".xml" className="hidden" disabled={processandoNfe}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importarXmlNfe(f); e.target.value = ""; }} />
              </label>
            </>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(106,176,255,0.15)", color: AZUL, border: "1px solid rgba(106,176,255,0.3)" }}>
            <Share2 size={16} />{L("Compartilhar", "Share", "Compartir")}
          </motion.button>
        </>
      }
    >
      {!podeEditar && papel && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: AMBAR }}>
          <AlertTriangle size={14} />
          {L("Seu perfil tem acesso somente leitura a Contas a Pagar.", "Your profile has read-only access to Accounts Payable.", "Su perfil tiene acceso solo lectura a Cuentas por Pagar.")}
        </div>
      )}

      {avisoNfeDuplicada && (
        <div className="mb-4">
          <CanvasBox cor={AMBAR}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
            <p className="text-sm font-semibold mb-3" style={{ color: "#c8d8f0" }}>
              {L(`Esta NF-e já foi importada pelo PDV para estoque em ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("pt-BR")}. Deseja vincular esta conta a pagar à compra existente?`,
                `This NF-e was already imported by the POS into inventory on ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("en-US")}. Link this bill to the existing purchase?`,
                `Esta NF-e ya fue importada por el PDV al inventario el ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("es-ES")}. ¿Vincular esta cuenta a la compra existente?`)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => abrirModalComDadosNfe(avisoNfeDuplicada.dados, avisoNfeDuplicada.nfe.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: VERDE }}>
                {L("Sim, vincular", "Yes, link", "Sí, vincular")}
              </button>
              <button onClick={() => setAvisoNfeDuplicada(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: CINZA }}>
                {L("Não", "No", "No")}
              </button>
            </div>
          </CanvasBox>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setAba("central")} className="px-4 py-2 rounded-xl text-sm font-bold"
          style={aba === "central" ? { background: "rgba(245,158,11,0.2)", color: AMBAR, border: `1px solid ${AMBAR}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          {L("Command Center", "Command Center", "Command Center")}
        </button>
        <button onClick={() => setAba("inteligencia")} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={aba === "inteligencia" ? { background: "rgba(167,139,250,0.2)", color: ROXO, border: `1px solid ${ROXO}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          <Gauge size={14} />{L("Inteligência", "Intelligence", "Inteligencia")}
        </button>
        <button onClick={() => setAba("aprovacoes")} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={aba === "aprovacoes" ? { background: "rgba(52,211,153,0.2)", color: VERDE, border: `1px solid ${VERDE}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          <CheckCircle2 size={14} />{L("Aprovações Pendentes", "Pending Approvals", "Aprobaciones Pendientes")}
        </button>
        <button onClick={() => setAba("pedidos")} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={aba === "pedidos" ? { background: "rgba(106,176,255,0.2)", color: AZUL, border: `1px solid ${AZUL}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          <ClipboardList size={14} />{L("Pedidos de Compra", "Purchase Orders", "Órdenes de Compra")}
        </button>
        <button onClick={() => setAba("conferencia")} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={aba === "conferencia" ? { background: "rgba(248,113,113,0.2)", color: VERMELHO, border: `1px solid ${VERMELHO}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          <ListChecks size={14} />{L("Conferência de Notas", "Invoice Matching", "Conciliación de Facturas")}
        </button>
        <button onClick={() => setAba("historico")} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
          style={aba === "historico" ? { background: "rgba(106,176,255,0.2)", color: AZUL, border: `1px solid ${AZUL}50` } : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
          <History size={14} />{L("Histórico", "History", "Historial")}
        </button>
        {podeConfigurarAp && (
          <button onClick={abrirConfigAp} className="ml-auto px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
            style={{ background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
            <Settings size={14} />⚙️ {L("Configuração AP", "AP Configuration", "Configuración AP")}
          </button>
        )}
      </div>

      {aba === "central" && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: L("Total em Aberto", "Total Outstanding", "Total Abierto"), valor: kpis.totalEmAberto, cor: AMBAR },
              { label: L("Vencendo em 7 dias", "Due in 7 days", "Vence en 7 días"), valor: kpis.vencendoEm7, cor: AZUL },
              { label: L("Vencidas", "Overdue", "Vencidas"), valor: kpis.vencidas, cor: VERMELHO },
              { label: L("Pagas no Mês", "Paid this Month", "Pagadas este Mes"), valor: kpis.pagasNoMes, cor: VERDE },
            ].map((k) => (
              <CanvasBox key={k.label} cor={k.cor}>
                <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{k.label}</p>
                <p className="text-lg md:text-xl font-black" style={{ color: k.cor }}>{semDados ? "—" : fmt(k.valor)}</p>
              </CanvasBox>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CINZA }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L("Buscar...", "Search...", "Buscar...")}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
            </div>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
              <option value="todos">{L("Todos os status", "All statuses", "Todos los estados")}</option>
              <option value="pendente">{statusLabel("pendente")}</option>
              <option value="parcial">{statusLabel("parcial")}</option>
              <option value="vencido">{statusLabel("vencido")}</option>
              <option value="pago">{statusLabel("pago")}</option>
              <option value="aguardando_aprovacao">{statusLabel("aguardando_aprovacao")}</option>
            </select>
            <select value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
              <option value="">{L("Todos os fornecedores", "All suppliers", "Todos los proveedores")}</option>
              {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
              <option value="">{L("Todas as categorias", "All categories", "Todas las categorías")}</option>
              {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
            </select>
            <input type="date" value={filtroVencDe} onChange={(e) => setFiltroVencDe(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
            <input type="date" value={filtroVencAte} onChange={(e) => setFiltroVencAte(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
          </div>

          {/* Lista */}
          {loading ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
          ) : contasFiltradas.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L("Nenhuma conta a pagar encontrada.", "No bills found.", "No se encontraron cuentas.")}</p>
          ) : (
            <div className="space-y-2">
              {contasFiltradas.map((c) => {
                const statusExibido = statusEfetivo(c.status, c.valor_total, c.valor_pago, c.data_vencimento);
                const cor = statusCor(statusExibido);
                return (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                    style={{ background: proximasAPagar.has(c.id) ? "rgba(167,139,250,0.08)" : "rgba(10,20,36,0.6)", border: proximasAPagar.has(c.id) ? `1px solid ${ROXO}50` : `1px solid ${cor}25` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate flex items-center gap-1.5" style={{ color: "#c8d8f0" }}>
                        {proximasAPagar.has(c.id) && (
                          <span title={L("Fixada em Prioridade de Pagamento", "Pinned in Payment Priority", "Fijada en Prioridad de Pago")}>
                            <Pin size={12} fill={ROXO} style={{ color: ROXO }} />
                          </span>
                        )}
                        {c.descricao}
                      </p>
                      <p className="text-xs flex items-center gap-1.5" style={{ color: CINZA }}>
                        {nomeFornecedor(c.fornecedor_id)} · {c.categoria ? cat(c.categoria) : "—"}
                        {(() => {
                          const scoreForn = scoreDoFornecedor(c.fornecedor_id);
                          return scoreForn ? (
                            <span className="px-1.5 py-0.5 rounded font-bold" title={L("Score de saúde do fornecedor", "Supplier health score", "Score de salud del proveedor")}
                              style={{ background: `${corDoNivelScore(scoreForn.nivel)}20`, color: corDoNivelScore(scoreForn.nivel) }}>
                              {scoreForn.total}
                            </span>
                          ) : (
                            <span title={L("Sem score ainda", "No score yet", "Sin score todavía")} style={{ opacity: 0.5 }}>{L("sem score", "no score", "sin score")}</span>
                          );
                        })()}
                      </p>
                    </div>
                    <div className="text-xs" style={{ color: CINZA }}>
                      {L("Vence", "Due", "Vence")} {c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                    </div>
                    <p className="text-sm font-bold w-28 text-right" style={{ color: "#c8d8f0" }}>{fmt(c.valor_total)}</p>
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold text-center w-24" style={{ background: `${cor}15`, color: cor }}>{statusLabel(statusExibido)}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirAnexo(c)} title={L("Anexar boleto/nota", "Attach invoice/receipt", "Adjuntar boleta/factura")} style={{ color: AZUL }}><Paperclip size={15} /></motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirRastreabilidade(c)} title={L("Ver rastreabilidade", "View traceability", "Ver trazabilidad")} style={{ color: ROXO }}><Link2 size={15} /></motion.button>
                      {podeEditar && (
                        <>
                          {c.status !== "pago" && c.status !== "aguardando_aprovacao" && (
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirBaixa(c)} title={L("Dar baixa (marcar como pago)", "Register payment (mark as paid)", "Registrar pago (marcar como pagado)")} style={{ color: VERDE }}><CheckCircle2 size={15} /></motion.button>
                          )}
                          {(c.status === "pago" || c.status === "parcial") && (
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => estornar(c)} title={L("Estornar pagamento (desfazer baixa)", "Reverse payment (undo payment)", "Revertir pago (deshacer pago)")} style={{ color: CINZA }}><Undo2 size={15} /></motion.button>
                          )}
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoConta(c)} title={L("Editar conta", "Edit bill", "Editar cuenta")} style={{ color: AMBAR }}><Pencil size={15} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c)} title={L("Excluir conta", "Delete bill", "Eliminar cuenta")} style={{ color: c.status === "pago" ? "rgba(248,113,113,0.3)" : VERMELHO }}><Trash2 size={15} /></motion.button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {aba === "inteligencia" && (
        <div className="space-y-4">
          {/* Card CFO AP Briefing V1 + Natural Language CFO V1 (Entrega 4, Commit 5) */}
          <CanvasBox cor={ROXO}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ROXO }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              <Sparkles size={18} style={{ color: ROXO }} />
              {L("O que merece sua atenção hoje", "What deserves your attention today", "Qué merece su atención hoy")}
            </h3>
            {briefingAp.length === 0 ? (
              <p className="text-sm" style={{ color: CINZA }}>
                {L("Tudo tranquilo — nenhum ponto crítico detectado no momento.", "All clear — no critical point detected right now.", "Todo tranquilo — ningún punto crítico detectado por el momento.")}
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {briefingAp.map((item, i) => {
                  const cor = item.severidade === "critico" ? VERMELHO : item.severidade === "atencao" ? AMBAR : AZUL;
                  return (
                    <button key={i} onClick={() => irParaItemBriefing(item)}
                      className="w-full text-left rounded-xl p-3 flex items-center justify-between gap-3"
                      style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${cor}30` }}>
                      <span className="text-sm flex items-center gap-2" style={{ color: "#c8d8f0" }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cor }} />
                        {item.texto}
                      </span>
                      <ChevronRight size={16} style={{ color: CINZA }} className="flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: CINZA }}>
                <MessageCircleQuestion size={14} />
                {L("Pergunte ao Axioma CFO", "Ask Axioma CFO", "Pregunte al Axioma CFO")}
              </p>
              <div className="flex gap-2 mb-2">
                <input value={perguntaCfo} onChange={(e) => setPerguntaCfo(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") perguntarAoCfo(); }}
                  disabled={carregandoRespostaCfo}
                  placeholder={L("Ex.: quanto vou pagar em 30 dias?", "E.g.: how much will I pay in 30 days?", "Ej.: ¿cuánto voy a pagar en 30 días?")}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm disabled:opacity-60" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(167,139,250,0.2)", color: "#c8d8f0" }} />
                <button onClick={() => perguntarAoCfo()} disabled={carregandoRespostaCfo} className="px-3 py-2.5 rounded-xl flex items-center justify-center disabled:opacity-60" style={{ background: "rgba(167,139,250,0.2)", color: ROXO, border: `1px solid ${ROXO}50` }}>
                  <Send size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(PERGUNTAS_SUGERIDAS_CFO[idioma as "pt" | "en" | "es"] || PERGUNTAS_SUGERIDAS_CFO.pt).map((sug) => (
                  <button key={sug} onClick={() => perguntarAoCfo(sug)} disabled={carregandoRespostaCfo} className="px-2.5 py-1 rounded-full text-[11px] disabled:opacity-60" style={{ background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
                    {sug}
                  </button>
                ))}
              </div>
              {carregandoRespostaCfo ? (
                <div className="rounded-xl p-3" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <p className="text-sm" style={{ color: CINZA }}>{L("Pensando...", "Thinking...", "Pensando...")}</p>
                </div>
              ) : respostaCfo && (
                <div className="rounded-xl p-3" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.25)" }}>
                  <p className="text-sm" style={{ color: "#c8d8f0" }}>{respostaCfo}</p>
                </div>
              )}
            </div>
          </CanvasBox>

          {/* Card Forecast AP Multi-Horizonte (Entrega 3, Commit 1) */}
          <CanvasBox cor={pontoForecast && pontoForecast.ruptura ? VERMELHO : AZUL}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: pontoForecast && pontoForecast.ruptura ? VERMELHO : AZUL }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              {pontoForecast && pontoForecast.ruptura ? <TrendingDown size={18} style={{ color: VERMELHO }} /> : <TrendingUp size={18} style={{ color: AZUL }} />}
              {L("Previsão de Caixa (AP Forecast)", "Cash Forecast (AP Forecast)", "Previsión de Caja (AP Forecast)")}
            </h3>
            {carregandoForecast ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Calculando...", "Calculating...", "Calculando...")}</p>
            ) : !forecastAp || !pontoForecast ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Sem dados suficientes.", "Not enough data.", "Datos insuficientes.")}</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  {HORIZONTES_FORECAST_AP.map((h) => (
                    <button key={h} onClick={() => setHorizonteSelecionado(h)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={horizonteSelecionado === h
                        ? { background: "rgba(106,176,255,0.2)", color: AZUL, border: `1px solid ${AZUL}50` }
                        : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
                      {L(`${h} dias`, `${h} days`, `${h} días`)}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(106,176,255,0.15)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{L("Saldo Atual", "Current Balance", "Saldo Actual")}</p>
                    <p className="text-lg font-black" style={{ color: "#c8d8f0" }}>{fmt(forecastAp.saldoAtual)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pontoForecast.saldoProjetadoOtimista < 0 ? VERMELHO : VERDE}30` }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{L("Cenário Otimista (em dia, sem multa)", "Optimistic Scenario (on time, no fee)", "Escenario Optimista (a tiempo, sin multa)")}</p>
                    <p className="text-lg font-black" style={{ color: pontoForecast.saldoProjetadoOtimista < 0 ? VERMELHO : VERDE }}>{fmt(pontoForecast.saldoProjetadoOtimista)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${pontoForecast.saldoProjetadoPessimista < 0 ? VERMELHO : AMBAR}30` }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{L("Cenário Pessimista (com desvio real de atraso)", "Pessimistic Scenario (real delay deviation)", "Escenario Pesimista (con desvío real de atraso)")}</p>
                    <p className="text-lg font-black" style={{ color: pontoForecast.saldoProjetadoPessimista < 0 ? VERMELHO : AMBAR }}>{fmt(pontoForecast.saldoProjetadoPessimista)}</p>
                  </div>
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{L("Projetado sem pagar pendentes", "Projected without paying pending", "Proyectado sin pagar pendientes")}</p>
                    <p className="text-lg font-black" style={{ color: "#c8d8f0" }}>{fmt(pontoForecast.saldoProjetadoSemPagamentos)}</p>
                  </div>
                </div>
                <p className="text-xs mb-3" style={{ color: CINZA }}>
                  {forecastAp.amostraAtrasoSuficiente
                    ? L(`Cenário pessimista baseado no histórico real desta empresa: em média, ${forecastAp.fatorAtrasoHistoricoPct}% de sobretaxa em contas pagas com atraso e multa combinada (${forecastAp.amostraAtrasoHistorico} ocorrência(s)).`,
                        `Pessimistic scenario based on this company's real history: on average, ${forecastAp.fatorAtrasoHistoricoPct}% overpay on bills paid late with an agreed fee (${forecastAp.amostraAtrasoHistorico} occurrence(s)).`,
                        `Escenario pesimista basado en el historial real de esta empresa: en promedio, ${forecastAp.fatorAtrasoHistoricoPct}% de sobrecosto en cuentas pagadas con atraso y multa acordada (${forecastAp.amostraAtrasoHistorico} ocurrencia(s)).`)
                    : L("Sem histórico suficiente de atraso com multa combinada ainda — cenário pessimista igual ao otimista (nada é estimado sem dado real).",
                        "Not enough history of late payments with an agreed fee yet — pessimistic scenario equals the optimistic one (nothing is estimated without real data).",
                        "Sin historial suficiente de atraso con multa acordada todavía — el escenario pesimista es igual al optimista (nada se estima sin datos reales).")}
                </p>
                {pontoForecast.ruptura ? (
                  <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.35)" }}>
                    <AlertTriangle size={16} style={{ color: VERMELHO }} />
                    <p className="text-sm font-semibold" style={{ color: VERMELHO }}>
                      {L(`Saldo fica negativo em ${pontoForecast.ruptura.diasRestantes} dias (${new Date(pontoForecast.ruptura.data + "T00:00:00").toLocaleDateString("pt-BR")}), projetado em ${fmt(pontoForecast.ruptura.saldoProjetado)}.`,
                        `Balance goes negative in ${pontoForecast.ruptura.diasRestantes} days (${new Date(pontoForecast.ruptura.data + "T00:00:00").toLocaleDateString("en-US")}), projected at ${fmt(pontoForecast.ruptura.saldoProjetado)}.`,
                        `El saldo queda negativo en ${pontoForecast.ruptura.diasRestantes} días (${new Date(pontoForecast.ruptura.data + "T00:00:00").toLocaleDateString("es-ES")}), proyectado en ${fmt(pontoForecast.ruptura.saldoProjetado)}.`)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: VERDE }}>
                    {L(`Sem ruptura de caixa prevista nos próximos ${horizonteSelecionado} dias.`, `No cash shortfall expected in the next ${horizonteSelecionado} days.`, `Sin ruptura de caja prevista en los próximos ${horizonteSelecionado} días.`)}
                  </p>
                )}
              </>
            )}
          </CanvasBox>

          {/* Card Prioridade de Pagamento */}
          <CanvasBox cor={ROXO}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ROXO }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-3" style={{ color: "#c8d8f0" }}>{L("Prioridade de Pagamento", "Payment Priority", "Prioridad de Pago")}</h3>
            {prioridadesOrdenadas.length === 0 ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Nenhuma conta pendente para priorizar.", "No pending bills to prioritize.", "Ninguna cuenta pendiente para priorizar.")}</p>
            ) : (
              <div className="space-y-2">
                {prioridadesOrdenadas.map((item, i) => (
                  <div key={item.conta.id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={proximasAPagar.has(item.conta.id)
                      ? { background: "rgba(167,139,250,0.1)", border: `1px solid ${ROXO}50` }
                      : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.15)" }}>
                    <span className="text-xs font-black w-6 text-center flex-shrink-0" style={{ color: CINZA }}>#{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{item.conta.descricao} · {nomeFornecedor(item.conta.fornecedor_id)}</p>
                      <p className="text-xs" style={{ color: CINZA }}>{item.explicacao}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" title={L("Score de prioridade de pagamento", "Payment priority score", "Score de prioridad de pago")}
                      style={{ background: `${item.score >= 70 ? VERMELHO : item.score >= 40 ? AMBAR : VERDE}20`, color: item.score >= 70 ? VERMELHO : item.score >= 40 ? AMBAR : VERDE }}>
                      {item.score}
                    </span>
                    {(() => {
                      const scoreForn = scoreDoFornecedor(item.conta.fornecedor_id);
                      return scoreForn ? (
                        <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" title={L("Score de saúde do fornecedor", "Supplier health score", "Score de salud del proveedor")}
                          style={{ background: `${corDoNivelScore(scoreForn.nivel)}20`, color: corDoNivelScore(scoreForn.nivel) }}>
                          {L("Forn.", "Sup.", "Prov.")} {scoreForn.total}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg text-xs flex-shrink-0" style={{ color: CINZA, background: "rgba(255,255,255,0.04)" }}>
                          {L("sem score", "no score", "sin score")}
                        </span>
                      );
                    })()}
                    <button onClick={() => alternarProximaAPagar(item.conta.id)}
                      title={proximasAPagar.has(item.conta.id) ? L("Fixado no topo — clique pra desafixar", "Pinned to top — click to unpin", "Fijado arriba — clic para desfijar") : L("Fixar no topo", "Pin to top", "Fijar arriba")}
                      className="flex-shrink-0 p-1.5 rounded-lg"
                      style={proximasAPagar.has(item.conta.id)
                        ? { color: ROXO, background: "rgba(167,139,250,0.2)", border: `1px solid ${ROXO}` }
                        : { color: CINZA, background: "transparent", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <Pin size={16} fill={proximasAPagar.has(item.conta.id) ? ROXO : "none"} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CanvasBox>

          {/* Card Despesas Recorrentes Detectadas (Entrega 3, Commit 3) */}
          <CanvasBox cor={AMBAR}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              <RotateCcw size={18} style={{ color: AMBAR }} />
              {L("Despesas Recorrentes Detectadas", "Detected Recurring Expenses", "Gastos Recurrentes Detectados")}
            </h3>
            <p className="text-xs mb-3" style={{ color: CINZA }}>
              {L("Mesmo fornecedor, valor parecido (±10%) e intervalo regular em pelo menos 3 lançamentos que ainda não viraram Custo Fixo.",
                "Same supplier, similar amount (±10%) and a regular interval across at least 3 entries that haven't become a Fixed Cost yet.",
                "Mismo proveedor, valor parecido (±10%) e intervalo regular en al menos 3 lanzamientos que todavía no son Costo Fijo.")}
            </p>
            {padroesRecorrentes.length === 0 ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Nenhum padrão recorrente novo encontrado.", "No new recurring pattern found.", "Ningún patrón recurrente nuevo encontrado.")}</p>
            ) : (
              <div className="space-y-2">
                {padroesRecorrentes.map((p) => (
                  <div key={p.idsContas.join(",")} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{p.descricaoExemplo} · {nomeFornecedor(p.fornecedorId)}</p>
                      <p className="text-xs" style={{ color: CINZA }}>
                        {L(`${p.ocorrencias} ocorrências · ~${fmt(p.valorMedio)} a cada ~${p.intervaloMedioDias} dias`,
                          `${p.ocorrencias} occurrences · ~${fmt(p.valorMedio)} every ~${p.intervaloMedioDias} days`,
                          `${p.ocorrencias} ocurrencias · ~${fmt(p.valorMedio)} cada ~${p.intervaloMedioDias} días`)}
                      </p>
                    </div>
                    {p.podeVirarCustoFixo ? (
                      podeEditar && (
                        <button onClick={() => abrirTransformarPadrao(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0"
                          style={{ background: "rgba(245,158,11,0.15)", color: AMBAR, border: `1px solid ${AMBAR}50` }}>
                          {L("Transformar em Custo Fixo", "Turn into Fixed Cost", "Convertir en Costo Fijo")}
                        </button>
                      )
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-[10px] flex-shrink-0" style={{ color: CINZA, background: "rgba(255,255,255,0.04)" }} title={L("Recorrência não mensal — Custo Fixo hoje só modela despesa mensal.", "Non-monthly recurrence — Fixed Cost today only models monthly expenses.", "Recurrencia no mensual — Costo Fijo hoy solo modela gasto mensual.")}>
                        {L("recorrência não mensal", "non-monthly recurrence", "recurrencia no mensual")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CanvasBox>

          {/* Card Recuperação de Valor (Entrega 3, Commit 4 — Value Recovery parte 1) */}
          <CanvasBox cor={VERDE}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERDE }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              <Sparkles size={18} style={{ color: VERDE }} />
              {L("Recuperação de Valor", "Value Recovery", "Recuperación de Valor")}
            </h3>
            <p className="text-xs mb-3" style={{ color: CINZA }}>
              {L("Potencial de recuperação estimado: ", "Estimated recovery potential: ", "Potencial de recuperación estimado: ")}
              <span className="font-black" style={{ color: VERDE }}>{fmt(totalRecuperacaoEstimada)}</span>
              {" — "}
              {L("são sugestões pra revisar, não valores confirmados. Nada aqui é excluído ou alterado sozinho.",
                "these are suggestions to review, not confirmed values. Nothing here is deleted or changed automatically.",
                "son sugerencias para revisar, no valores confirmados. Nada aquí se elimina o cambia solo.")}
            </p>

            {/* 1) Cobranças acima da média histórica */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                {L("Cobranças Acima da Média Histórica", "Bills Above Historical Average", "Cobros Por Encima del Promedio Histórico")}
              </h4>
              {cobrancasAcimaMedia.length === 0 ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Nenhuma cobrança fora do padrão encontrada.", "No out-of-pattern bill found.", "Ningún cobro fuera de patrón encontrado.")}</p>
              ) : (
                <div className="space-y-2">
                  {cobrancasAcimaMedia.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{c.nome}</p>
                        <p className="text-xs" style={{ color: CINZA }}>
                          {L(`Ticket médio ${fmt(c.ticketMedio)} vs. média de ${cat(c.categoria)} de ${fmt(c.mediaGrupo)} (${c.percentualAcima}% acima, ${c.qtdCompras} compras)`,
                            `Average ticket ${fmt(c.ticketMedio)} vs. ${cat(c.categoria)} average of ${fmt(c.mediaGrupo)} (${c.percentualAcima}% above, ${c.qtdCompras} purchases)`,
                            `Ticket promedio ${fmt(c.ticketMedio)} vs. promedio de ${cat(c.categoria)} de ${fmt(c.mediaGrupo)} (${c.percentualAcima}% arriba, ${c.qtdCompras} compras)`)}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" style={{ background: `${VERDE}20`, color: VERDE }}>{fmt(c.valorRecuperavelEstimado)}</span>
                      <button onClick={() => revisarNoCentral(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                        {L("Revisar", "Review", "Revisar")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2) Multas evitáveis */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                {L("Multas Evitáveis", "Avoidable Late Fees", "Multas Evitables")}
              </h4>
              {carregandoValueRecovery ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Calculando...", "Calculating...", "Calculando...")}</p>
              ) : multasEvitaveis.length === 0 ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Nenhuma multa com caixa comprovado pra pagar em dia.", "No late fee with proven cash to pay on time.", "Ninguna multa con caja comprobada para pagar a tiempo.")}</p>
              ) : (
                <div className="space-y-2">
                  {multasEvitaveis.map((m) => (
                    <div key={m.contaId} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{m.descricao} · {nomeFornecedor(m.fornecedorId)}</p>
                        <p className="text-xs" style={{ color: CINZA }}>
                          {L(`Paga com ${m.diasAtraso} dias de atraso — o caixa realizado em ${new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")} já era ${fmt(m.saldoNaData)}, suficiente pra pagar em dia.`,
                            `Paid ${m.diasAtraso} days late — realized cash on ${new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("en-US")} was already ${fmt(m.saldoNaData)}, enough to pay on time.`,
                            `Pagada con ${m.diasAtraso} días de atraso — la caja realizada el ${new Date(m.dataVencimento + "T00:00:00").toLocaleDateString("es-ES")} ya era ${fmt(m.saldoNaData)}, suficiente para pagar a tiempo.`)}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" style={{ background: `${VERDE}20`, color: VERDE }}>{fmt(m.valorMulta)}</span>
                      <button onClick={() => revisarNoCentral(m.fornecedorId)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                        {L("Revisar", "Review", "Revisar")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3) Duplicidades passadas */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                {L("Possíveis Duplicidades (revisão sugerida)", "Possible Duplicates (suggested review)", "Posibles Duplicados (revisión sugerida)")}
              </h4>
              {duplicidadesPassadas.length === 0 ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Nenhum par parecido encontrado.", "No similar pair found.", "Ningún par parecido encontrado.")}</p>
              ) : (
                <div className="space-y-2">
                  {duplicidadesPassadas.map((p) => (
                    <div key={`${p.contaA.id}-${p.contaB.id}`} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>
                          {p.contaA.descricao} ({fmt(p.contaA.valor_total)}) {L("e", "and", "y")} {p.contaB.descricao} ({fmt(p.contaB.valor_total)})
                        </p>
                        <p className="text-xs" style={{ color: CINZA }}>
                          {nomeFornecedor(p.contaA.fornecedor_id)} — {L("verifique estes pares: podem ser a mesma conta lançada 2x, ou duas cobranças legítimas parecidas.", "check these pairs: they may be the same bill entered twice, or two legitimate similar charges.", "revise estos pares: pueden ser la misma cuenta registrada 2 veces, o dos cobros legítimos parecidos.")}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" title={L("Score de semelhança", "Similarity score", "Score de semejanza")} style={{ background: `${p.score >= 85 ? VERMELHO : AMBAR}20`, color: p.score >= 85 ? VERMELHO : AMBAR }}>
                        {p.score}
                      </span>
                      <button onClick={() => revisarNoCentral(p.contaA.fornecedor_id)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                        {L("Revisar", "Review", "Revisar")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4) Desconto ainda aproveitável (Commit 5) + veredicto de caixa (Entrega 4, Commit 2) */}
            <div className="mb-4">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                {L("Desconto Ainda Aproveitável", "Discount Still Available", "Descuento Todavía Aprovechable")}
              </h4>
              <p className="text-[10px] mb-2" style={{ color: CINZA }}>
                {L("Avaliação isolada, uma conta por vez — marque a caixinha de mais de uma pra ver o efeito CUMULATIVO real de antecipar todas juntas.",
                  "Isolated evaluation, one bill at a time — check the box on more than one to see the real CUMULATIVE effect of moving all of them up together.",
                  "Evaluación aislada, una cuenta por vez — marque la casilla de más de una para ver el efecto CUMULATIVO real de anticipar todas juntas.")}
              </p>
              {descontosComForecast.length === 0 ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Nenhum desconto por pagamento antecipado em aberto.", "No open early-payment discount.", "Ningún descuento por pago anticipado abierto.")}</p>
              ) : (
                <div className="space-y-2">
                  {descontosComForecast.map((d) => (
                    <div key={d.contaId} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <input type="checkbox" checked={descontosSelecionados.has(d.contaId)} onChange={() => alternarDescontoSelecionado(d.contaId)}
                        title={L("Incluir no cálculo de impacto cumulativo", "Include in the cumulative impact calculation", "Incluir en el cálculo de impacto acumulativo")}
                        className="flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{d.descricao} · {nomeFornecedor(d.fornecedorId)}</p>
                        <p className="text-xs" style={{ color: CINZA }}>
                          {L(`Pague até ${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("pt-BR")} (${d.diasRestantes} dias) e economize ${fmt(d.valorDesconto)} — ${d.percentual}% de desconto`,
                            `Pay by ${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("en-US")} (${d.diasRestantes} days) and save ${fmt(d.valorDesconto)} — ${d.percentual}% discount`,
                            `Pague antes del ${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("es-ES")} (${d.diasRestantes} días) y ahorre ${fmt(d.valorDesconto)} — ${d.percentual}% de descuento`)}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: d.veredicto === "seguro" ? VERDE : d.veredicto === "aperta_caixa" ? AMBAR : CINZA }}>
                          {d.veredicto === "seguro" &&
                            L(`✓ Vale a pena e o caixa aguenta — saldo projetado até lá continua positivo (${fmt(d.saldoProjetadoNoPrazo || 0)}).`,
                              `✓ Worth it and cash can handle it — projected balance through then stays positive (${fmt(d.saldoProjetadoNoPrazo || 0)}).`,
                              `✓ Vale la pena y la caja aguanta — el saldo proyectado hasta entonces sigue positivo (${fmt(d.saldoProjetadoNoPrazo || 0)}).`)}
                          {d.veredicto === "aperta_caixa" &&
                            L(`⚠ Vale o desconto, mas aperta o caixa — saldo projetado no cenário conservador fica em ${fmt(d.saldoProjetadoNoPrazo || 0)} até o prazo.`,
                              `⚠ Worth the discount, but tightens cash — projected balance in the conservative scenario is ${fmt(d.saldoProjetadoNoPrazo || 0)} by the deadline.`,
                              `⚠ Vale el descuento, pero aprieta la caja — el saldo proyectado en el escenario conservador queda en ${fmt(d.saldoProjetadoNoPrazo || 0)} hasta el plazo.`)}
                          {d.veredicto === "sem_dados" && d.motivoSemDados === "carregando" &&
                            L("Calculando impacto no caixa...", "Calculating cash impact...", "Calculando impacto en la caja...")}
                          {d.veredicto === "sem_dados" && d.motivoSemDados === "sem_historico_caixa" &&
                            L("Sem dados de fluxo suficientes pra avaliar o impacto no caixa.", "Not enough cash flow data to assess the cash impact.", "Sin datos de flujo suficientes para evaluar el impacto en la caja.")}
                          {d.veredicto === "sem_dados" && d.motivoSemDados === "prazo_fora_do_forecast" &&
                            L("Prazo além do alcance do forecast (90 dias) — sem veredicto de caixa.", "Deadline beyond the forecast's reach (90 days) — no cash verdict.", "Plazo más allá del alcance del forecast (90 días) — sin veredicto de caja.")}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0"
                        style={{
                          background: `${d.veredicto === "aperta_caixa" ? AMBAR : d.veredicto === "sem_dados" ? CINZA : VERDE}20`,
                          color: d.veredicto === "aperta_caixa" ? AMBAR : d.veredicto === "sem_dados" ? CINZA : VERDE,
                        }}>
                        {fmt(d.valorDesconto)}
                      </span>
                      <button onClick={() => revisarNoCentral(d.fornecedorId)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                        {L("Revisar", "Review", "Revisar")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Impacto cumulativo das selecionadas (Entrega 4, Commit de melhoria) */}
              {descontosSelecionados.size > 0 && (
                <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${ROXO}30` }}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: ROXO }}>
                    {L(`Impacto de Antecipar as ${descontosSelecionados.size} Selecionadas Juntas`, `Impact of Moving Up the ${descontosSelecionados.size} Selected Together`, `Impacto de Anticipar las ${descontosSelecionados.size} Seleccionadas Juntas`)}
                  </p>
                  {carregandoAntecipacaoConjunta || !antecipacaoConjunta ? (
                    <p className="text-xs" style={{ color: CINZA }}>{L("Recalculando o forecast com as datas antecipadas...", "Recalculating the forecast with the moved-up dates...", "Recalculando el forecast con las fechas anticipadas...")}</p>
                  ) : antecipacaoConjunta.motivoSemDados === "sem_historico_caixa" ? (
                    <p className="text-xs" style={{ color: CINZA }}>
                      {L(`Economia total: ${fmt(antecipacaoConjunta.economiaTotal)}. Sem dados de fluxo suficientes pra avaliar o impacto no caixa.`,
                        `Total savings: ${fmt(antecipacaoConjunta.economiaTotal)}. Not enough cash flow data to assess the cash impact.`,
                        `Ahorro total: ${fmt(antecipacaoConjunta.economiaTotal)}. Sin datos de flujo suficientes para evaluar el impacto en la caja.`)}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs" style={{ color: "#c8d8f0" }}>
                        {L(`Economia total: `, `Total savings: `, `Ahorro total: `)}
                        <span className="font-black" style={{ color: VERDE }}>{fmt(antecipacaoConjunta.economiaTotal)}</span>
                      </p>
                      {antecipacaoConjunta.dataCritica && antecipacaoConjunta.saldoResultantePessimista !== null && (
                        <p className="text-xs" style={{ color: "#c8d8f0" }}>
                          {L(`Se antecipar todas, o saldo projetado (cenário conservador) cai pra `, `If you move up all of them, the projected balance (conservative scenario) drops to `, `Si anticipa todas, el saldo proyectado (escenario conservador) baja a `)}
                          <span className="font-black" style={{ color: antecipacaoConjunta.saldoResultantePessimista >= 0 ? AMBAR : VERMELHO }}>{fmt(antecipacaoConjunta.saldoResultantePessimista)}</span>
                          {L(` até ${new Date(antecipacaoConjunta.dataCritica + "T00:00:00").toLocaleDateString("pt-BR")} (prazo do desconto mais distante entre as selecionadas).`,
                            ` by ${new Date(antecipacaoConjunta.dataCritica + "T00:00:00").toLocaleDateString("en-US")} (the furthest discount deadline among the selected bills).`,
                            ` hasta el ${new Date(antecipacaoConjunta.dataCritica + "T00:00:00").toLocaleDateString("es-ES")} (el plazo de descuento más lejano entre las seleccionadas).`)}
                        </p>
                      )}
                      {antecipacaoConjunta.rupturaCausada && (
                        <p className="text-xs font-bold flex items-center gap-1.5 p-2 rounded-lg" style={{ color: VERMELHO, background: `${VERMELHO}15` }}>
                          <AlertTriangle size={14} />
                          {L(`Esse conjunto causa ruptura de caixa em ${antecipacaoConjunta.rupturaCausada.diasRestantes} dias (${new Date(antecipacaoConjunta.rupturaCausada.data + "T00:00:00").toLocaleDateString("pt-BR")}), mesmo que alguma pareça segura isolada.`,
                            `This combination causes a cash shortfall in ${antecipacaoConjunta.rupturaCausada.diasRestantes} days (${new Date(antecipacaoConjunta.rupturaCausada.data + "T00:00:00").toLocaleDateString("en-US")}), even if some looked safe in isolation.`,
                            `Este conjunto causa ruptura de caja en ${antecipacaoConjunta.rupturaCausada.diasRestantes} días (${new Date(antecipacaoConjunta.rupturaCausada.data + "T00:00:00").toLocaleDateString("es-ES")}), aunque alguna pareciera segura de forma aislada.`)}
                        </p>
                      )}
                      {antecipacaoConjunta.contasForaDoHorizonte.length > 0 && (
                        <p className="text-[10px]" style={{ color: CINZA }}>
                          {L(`${antecipacaoConjunta.contasForaDoHorizonte.length} conta(s) selecionada(s) tem prazo de desconto além dos 90 dias do forecast — economia contada no total acima, mas o impacto no caixa dessas não entrou no cálculo.`,
                            `${antecipacaoConjunta.contasForaDoHorizonte.length} selected bill(s) have a discount deadline beyond the forecast's 90 days — savings counted in the total above, but their cash impact wasn't included in the calculation.`,
                            `${antecipacaoConjunta.contasForaDoHorizonte.length} cuenta(s) seleccionada(s) tienen plazo de descuento más allá de los 90 días del forecast — ahorro contado en el total arriba, pero el impacto en la caja de esas no entró en el cálculo.`)}
                        </p>
                      )}
                      <p className="text-[10px] italic" style={{ color: CINZA }}>
                        {L("O sistema nunca antecipa pagamento sozinho — isso é só simulação. Você decide.", "The system never moves up a payment on its own — this is only a simulation. You decide.", "El sistema nunca anticipa un pago solo — esto es solo una simulación. Usted decide.")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5) Desconto perdido (Commit 5) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                {L("Desconto Perdido", "Missed Discount", "Descuento Perdido")}
              </h4>
              {descontosPerdidos.length === 0 ? (
                <p className="text-xs" style={{ color: CINZA }}>{L("Nenhum desconto por pagamento antecipado perdido.", "No early-payment discount missed.", "Ningún descuento por pago anticipado perdido.")}</p>
              ) : (
                <div className="space-y-2">
                  {descontosPerdidos.map((d) => (
                    <div key={d.contaId} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{d.descricao} · {nomeFornecedor(d.fornecedorId)}</p>
                        <p className="text-xs" style={{ color: CINZA }}>
                          {d.motivo === "pago_apos_limite"
                            ? L(`Paga depois do prazo (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("pt-BR")}) — deixou de economizar ${fmt(d.valorPerdido)} (${d.percentual}%)`,
                                `Paid after the deadline (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("en-US")}) — missed saving ${fmt(d.valorPerdido)} (${d.percentual}%)`,
                                `Pagada después del plazo (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("es-ES")}) — dejó de ahorrar ${fmt(d.valorPerdido)} (${d.percentual}%)`)
                            : L(`Prazo (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("pt-BR")}) passou e a conta ainda não foi paga — ${fmt(d.valorPerdido)} (${d.percentual}%) em risco`,
                                `Deadline (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("en-US")}) passed and the bill isn't paid yet — ${fmt(d.valorPerdido)} (${d.percentual}%) at risk`,
                                `El plazo (${new Date(d.dataLimite + "T00:00:00").toLocaleDateString("es-ES")}) pasó y la cuenta todavía no fue pagada — ${fmt(d.valorPerdido)} (${d.percentual}%) en riesgo`)}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-xs font-black flex-shrink-0" style={{ background: `${VERDE}20`, color: VERDE }}>{fmt(d.valorPerdido)}</span>
                      <button onClick={() => revisarNoCentral(d.fornecedorId)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                        {L("Revisar", "Review", "Revisar")}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CanvasBox>

          {/* Card Análise de Gasto (Entrega 3, Commit 6 — Spend Analytics) */}
          <CanvasBox cor={AZUL}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              <Landmark size={18} style={{ color: AZUL }} />
              {L("Análise de Gasto", "Spend Analytics", "Análisis de Gasto")}
            </h3>

            {contas.length === 0 ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Sem contas suficientes pra analisar ainda.", "Not enough bills to analyze yet.", "Sin cuentas suficientes para analizar todavía.")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1) Por categoria */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>{L("Por Categoria", "By Category", "Por Categoría")}</h4>
                  <div className="space-y-1.5">
                    {spendPorCategoria.map((s) => (
                      <div key={s.chave}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span style={{ color: "#c8d8f0" }}>{s.label}</span>
                          <span style={{ color: CINZA }}>{fmt(s.valor)} ({s.pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, s.pct)}%`, background: AZUL }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2) Por fornecedor */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>{L("Por Fornecedor (Top 10)", "By Supplier (Top 10)", "Por Proveedor (Top 10)")}</h4>
                  <div className="space-y-1.5">
                    {spendPorFornecedor.map((s) => (
                      <div key={s.fornecedorId || "sem-fornecedor"} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1" style={{ color: "#c8d8f0" }}>{s.nome}</span>
                        <span className="flex-shrink-0 ml-2" style={{ color: CINZA }}>{fmt(s.valor)}</span>
                        <span className="flex-shrink-0 ml-2 px-1.5 py-0.5 rounded font-bold"
                          style={{
                            color: s.tendencia === "subindo" ? VERMELHO : s.tendencia === "caindo" ? VERDE : CINZA,
                            background: s.tendencia === "subindo" ? `${VERMELHO}15` : s.tendencia === "caindo" ? `${VERDE}15` : "rgba(255,255,255,0.04)",
                          }}
                          title={L("Tendência do ticket médio (mês atual vs. anterior)", "Average ticket trend (this month vs. last)", "Tendencia del ticket promedio (mes actual vs. anterior)")}>
                          {s.tendencia === "subindo" ? "↑" : s.tendencia === "caindo" ? "↓" : "–"}
                          {s.tendencia !== "sem_dados" && s.tendencia !== "estavel" ? ` ${Math.abs(Math.round(s.variacaoPct))}%` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3) Por centro de custo */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>{L("Por Centro de Custo", "By Cost Center", "Por Centro de Costo")}</h4>
                  {carregandoSpendCentro ? (
                    <p className="text-xs" style={{ color: CINZA }}>{L("Calculando...", "Calculating...", "Calculando...")}</p>
                  ) : spendPorCentroCusto.length === 0 ? (
                    <p className="text-xs" style={{ color: CINZA }}>{L("Nenhum gasto atribuído a centro de custo ainda.", "No spend assigned to a cost center yet.", "Ningún gasto asignado a un centro de costo todavía.")}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {spendPorCentroCusto.map((s) => (
                        <div key={s.centroId || "sem-centro"}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span style={{ color: "#c8d8f0" }}>{s.nome}</span>
                            <span style={{ color: CINZA }}>{fmt(s.valor)} ({s.pct}%)</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, s.pct)}%`, background: AZUL }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4) Tendência mensal */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>{L("Evolução do Gasto (12 meses)", "Spend Trend (12 months)", "Evolución del Gasto (12 meses)")}</h4>
                  <div className="flex items-end gap-1" style={{ height: "80px" }}>
                    {tendenciaMensal.map((t, i) => (
                      <div key={i} className="flex-1 rounded-t" title={`${t.label}: ${fmt(t.valor)}`}
                        style={{ height: `${Math.max(2, (t.valor / maiorValorTendencia) * 100)}%`, background: `${AZUL}80`, minWidth: "4px" }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] mt-1" style={{ color: CINZA }}>
                    <span>{tendenciaMensal[0]?.label}</span>
                    <span>{tendenciaMensal[tendenciaMensal.length - 1]?.label}</span>
                  </div>
                </div>
              </div>
            )}
          </CanvasBox>

          {/* Card Pontos de Atenção (Entrega 4, Commit 1 — Fraud & Anomaly Engine) */}
          <CanvasBox cor={AMBAR}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
            <h3 className="text-base font-bold mb-1 flex items-center gap-2" style={{ color: "#c8d8f0" }}>
              <AlertTriangle size={18} style={{ color: AMBAR }} />
              {L("Pontos de Atenção", "Points to Review", "Puntos de Atención")}
            </h3>
            <p className="text-xs mb-3" style={{ color: CINZA }}>
              {L("Cada item aqui compara um lançamento com o PRÓPRIO histórico (diferente da Recuperação de Valor, que compara fornecedores entre si). Pode ter explicação legítima — reajuste combinado, nota emitida errada pelo fornecedor, etc. É só um alerta pra revisar, nunca uma afirmação de erro.",
                "Each item here compares one bill against its OWN history (different from Value Recovery, which compares suppliers against each other). There may be a legitimate explanation — an agreed price adjustment, an invoice the supplier issued incorrectly, etc. It's only a heads-up to review, never a claim of a mistake.",
                "Cada ítem aquí compara un lanzamiento con su PROPIO historial (diferente de Recuperación de Valor, que compara proveedores entre sí). Puede tener una explicación legítima — reajuste acordado, factura emitida por error del proveedor, etc. Es solo una alerta para revisar, nunca una afirmación de error.")}
            </p>

            {anomaliasContasPagar.length === 0 ? (
              <p className="text-sm" style={{ color: CINZA }}>{L("Nenhum ponto de atenção encontrado — histórico ainda curto ou tudo dentro do padrão.", "No points to review found — history still short or everything within the usual pattern.", "Ningún punto de atención encontrado — historial todavía corto o todo dentro del patrón.")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Muito acima do histórico */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                    {L("Muito Acima do Histórico", "Well Above History", "Muy Por Encima del Historial")}
                  </h4>
                  {anomaliasAcimaMedia.length === 0 ? (
                    <p className="text-xs" style={{ color: CINZA }}>{L("Nada fora do padrão aqui.", "Nothing out of pattern here.", "Nada fuera de patrón aquí.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {anomaliasAcimaMedia.map((a, i) => {
                        const pct = percentualAnomalia(a);
                        const n = contagemPorDescricaoAnomalia.get(normalizarTexto(a.descricao)) || 0;
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{a.descricao}</p>
                              <p className="text-xs" style={{ color: CINZA }}>
                                {L(`${fmt(a.valorAtual)}${pct !== null ? ` está ${pct}% acima` : " acima"} da média histórica desta descrição (${fmt(a.valorReferencia)}), com base em ${n} lançamento(s).`,
                                  `${fmt(a.valorAtual)}${pct !== null ? ` is ${pct}% above` : " above"} this description's historical average (${fmt(a.valorReferencia)}), based on ${n} bill(s).`,
                                  `${fmt(a.valorAtual)}${pct !== null ? ` está ${pct}% por encima` : " por encima"} del promedio histórico de esta descripción (${fmt(a.valorReferencia)}), con base en ${n} cuenta(s).`)}
                              </p>
                            </div>
                            <button onClick={() => revisarPorDescricaoNoCentral(a.descricao)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                              {L("Revisar", "Review", "Revisar")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Aumento silencioso */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#c8d8f0" }}>
                    {L("Aumento Silencioso (3 altas seguidas)", "Silent Increase (3 rises in a row)", "Aumento Silencioso (3 subidas seguidas)")}
                  </h4>
                  {anomaliasAumentoRecorrente.length === 0 ? (
                    <p className="text-xs" style={{ color: CINZA }}>{L("Nenhuma subida recorrente encontrada.", "No recurring increase found.", "Ninguna subida recurrente encontrada.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {anomaliasAumentoRecorrente.map((a, i) => {
                        const pct = percentualAnomalia(a);
                        const n = contagemPorDescricaoAnomalia.get(normalizarTexto(a.descricao)) || 0;
                        return (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(245,158,11,0.15)" }}>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{a.descricao}</p>
                              <p className="text-xs" style={{ color: CINZA }}>
                                {L(`Subiu 3 vezes seguidas: de ${fmt(a.valorReferencia)} pra ${fmt(a.valorAtual)}${pct !== null ? ` (+${pct}%)` : ""}, com base em ${n} lançamento(s).`,
                                  `Rose 3 times in a row: from ${fmt(a.valorReferencia)} to ${fmt(a.valorAtual)}${pct !== null ? ` (+${pct}%)` : ""}, based on ${n} bill(s).`,
                                  `Subió 3 veces seguidas: de ${fmt(a.valorReferencia)} a ${fmt(a.valorAtual)}${pct !== null ? ` (+${pct}%)` : ""}, con base en ${n} cuenta(s).`)}
                              </p>
                            </div>
                            <button onClick={() => revisarPorDescricaoNoCentral(a.descricao)} className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>
                              {L("Revisar", "Review", "Revisar")}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CanvasBox>
        </div>
      )}

      {aba === "aprovacoes" && (
        <CanvasBox cor={VERDE}>
          <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERDE }}>AXIOMA AI.TECH</p>
          <h3 className="text-base font-bold mb-1" style={{ color: "#c8d8f0" }}>{L("Aprovações Pendentes", "Pending Approvals", "Aprobaciones Pendientes")}</h3>
          {!podeAprovar && (
            <p className="text-xs mb-3" style={{ color: CINZA }}>{L("Você pode ver a fila, mas só quem está habilitado como aprovador pode decidir.", "You can see the queue, but only an enabled approver can decide.", "Puede ver la cola, pero solo un aprobador habilitado puede decidir.")}</p>
          )}
          {carregandoAprovacoes ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
          ) : aprovacoes.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>{L("Nenhuma aprovação pendente.", "No pending approvals.", "Ninguna aprobación pendiente.")}</p>
          ) : (
            <div className="space-y-2 mt-3">
              {aprovacoes.map((a) => (
                <div key={a.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(52,211,153,0.15)" }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{a.contas_pagar?.descricao || "—"}</p>
                      <p className="text-xs" style={{ color: CINZA }}>
                        {L("Solicitado por", "Requested by", "Solicitado por")} {nomeUsuario(a.solicitante_id)} · {fmt(a.valor)} · {L("vencimento", "due", "vencimiento")} {a.contas_pagar?.data_vencimento ? new Date(a.contas_pagar.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                      </p>
                    </div>
                    {podeAprovar && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input value={motivoDecisao[a.id] || ""} onChange={(e) => setMotivoDecisao({ ...motivoDecisao, [a.id]: e.target.value })}
                          placeholder={L("Motivo (obrigatório se rejeitar)", "Reason (required to reject)", "Motivo (obligatorio si rechaza)")}
                          className="px-3 py-2 rounded-lg text-xs w-56" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                        <button onClick={() => decidir(a.id, "aprovada")} disabled={decidindoId === a.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1" style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                          <CheckCircle2 size={13} />{L("Aprovar", "Approve", "Aprobar")}
                        </button>
                        <button onClick={() => decidir(a.id, "rejeitada")} disabled={decidindoId === a.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1" style={{ background: "rgba(248,113,113,0.15)", color: VERMELHO, border: "1px solid rgba(248,113,113,0.3)" }}>
                          <XCircle size={13} />{L("Rejeitar", "Reject", "Rechazar")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CanvasBox>
      )}

      {aba === "pedidos" && (
        <CanvasBox cor={AZUL}>
          <div className="flex justify-between items-start mb-1 gap-3 flex-wrap">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
              <h3 className="text-base font-bold" style={{ color: "#c8d8f0" }}>{L("Pedidos de Compra", "Purchase Orders", "Órdenes de Compra")}</h3>
            </div>
            {podeEditar && (
              <button onClick={abrirNovoPedido} className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 flex-shrink-0"
                style={{ background: "rgba(106,176,255,0.15)", color: AZUL, border: "1px solid rgba(106,176,255,0.3)" }}>
                <Plus size={15} />{L("Novo Pedido", "New Order", "Nueva Orden")}
              </button>
            )}
          </div>
          <p className="text-xs mb-4" style={{ color: CINZA }}>
            {L("Criar um pedido pra um fornecedor liga a Conferência de Notas no nível completo (Pedido × Recebimento × Fatura) pra ele — sem isso, todo fornecedor fica só no nível base.", "Creating an order for a supplier switches Invoice Matching to the full level (Order × Receiving × Invoice) for them — without it, every supplier stays on the base level.", "Crear una orden para un proveedor activa la Conciliación de Facturas en el nivel completo (Orden × Recepción × Factura) para él — sin eso, todo proveedor queda en el nivel base.")}
          </p>

          {carregandoPedidos ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
          ) : pedidosCompra.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>{L("Nenhum pedido de compra criado ainda.", "No purchase orders created yet.", "Ninguna orden de compra creada todavía.")}</p>
          ) : (
            <div className="space-y-2 mt-1">
              {pedidosCompra.map((p) => (
                <div key={p.id} className="p-3 rounded-xl flex items-center justify-between gap-3 flex-wrap" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${corStatusPedido(p.status)}30` }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{p.fornecedorNome || L("Fornecedor não identificado", "Supplier not identified", "Proveedor no identificado")}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${corStatusPedido(p.status)}20`, color: corStatusPedido(p.status) }}>
                        {labelStatusPedido(p.status)}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: CINZA }}>
                      {L("Pedido", "Order", "Orden")} {p.numero} · {fmt(p.valor_total || 0)}{p.data_emissao ? ` · ${new Date(p.data_emissao + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                    </p>
                  </div>
                  {podeEditar && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.status === "cancelado" ? (
                        <>
                          <button onClick={() => reativarPedido(p)} className="p-2 rounded-lg" style={{ color: VERDE }} title={L("Reativar pedido", "Reactivate order", "Reactivar orden")}><RotateCcw size={15} /></button>
                          <button onClick={() => excluirPedido(p)} className="p-2 rounded-lg" style={{ color: VERMELHO }} title={L("Excluir permanentemente", "Delete permanently", "Eliminar permanentemente")}><Trash2 size={15} /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => abrirEdicaoPedido(p)} className="p-2 rounded-lg" style={{ color: AZUL }} title={L("Editar", "Edit", "Editar")}><Pencil size={15} /></button>
                          {(p.status === "aberto" || p.status === "parcial") && (
                            <button onClick={() => cancelarPedido(p)} className="p-2 rounded-lg" style={{ color: AMBAR }} title={L("Cancelar pedido", "Cancel order", "Cancelar orden")}><XCircle size={15} /></button>
                          )}
                          <button onClick={() => excluirPedido(p)} className="p-2 rounded-lg" style={{ color: VERMELHO }} title={L("Excluir", "Delete", "Eliminar")}><Trash2 size={15} /></button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CanvasBox>
      )}

      {aba === "conferencia" && (
        <CanvasBox cor={VERMELHO}>
          <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERMELHO }}>AXIOMA AI.TECH</p>
          <h3 className="text-base font-bold mb-1" style={{ color: "#c8d8f0" }}>{L("Conferência de Notas", "Invoice Matching", "Conciliación de Facturas")}</h3>
          <p className="text-xs mb-3" style={{ color: CINZA }}>
            {L("Conferência inteligente do Axioma: casa cada nota importada com o que foi recebido no estoque e com a conta a pagar — sem pedido de compra, automático.", "Axioma's smart matching: checks every imported invoice against what was received into stock and against the bill — no purchase order needed, automatic.", "Conciliación inteligente de Axioma: coteja cada factura importada con lo recibido en stock y con la cuenta a pagar — sin orden de compra, automático.")}
          </p>

          <div className="flex gap-2 mb-4">
            {(["excecao", "ok", "todas"] as const).map((f) => (
              <button key={f} onClick={() => setFiltroConferencia(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={filtroConferencia === f
                  ? { background: "rgba(248,113,113,0.15)", color: VERMELHO, border: `1px solid ${VERMELHO}40` }
                  : { background: "rgba(255,255,255,0.04)", color: CINZA, border: "1px solid rgba(255,255,255,0.08)" }}>
                {f === "excecao" ? L("Divergências", "Discrepancies", "Discrepancias") : f === "ok" ? L("Conferidas", "Matched", "Conciliadas") : L("Todas", "All", "Todas")}
              </button>
            ))}
          </div>

          {!podeEditar && (
            <p className="text-xs mb-3" style={{ color: CINZA }}>{L("Você pode ver a fila e os detalhes, mas só dono, admin ou financeiro decidem uma divergência.", "You can see the queue and details, but only owner, admin or finance can decide on a discrepancy.", "Puede ver la cola y los detalles, pero solo dueño, admin o financiero deciden una discrepancia.")}</p>
          )}

          {carregandoConferencia ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
          ) : matchResultados.length === 0 ? (
            <p className="text-sm mt-3" style={{ color: CINZA }}>
              {filtroConferencia === "excecao"
                ? L("Nenhuma nota com divergência agora — tudo que foi conferido bateu.", "No invoice with discrepancies right now — everything checked out.", "Ninguna factura con discrepancias ahora — todo lo conciliado coincidió.")
                : filtroConferencia === "ok"
                ? L("Nenhuma nota conferida sem divergência ainda.", "No invoice matched cleanly yet.", "Ninguna factura conciliada sin discrepancias todavía.")
                : L("Nenhuma nota conferida ainda — importe uma NF-e pelo PDV ou por aqui pra começar.", "No invoice checked yet — import an NF-e from the POS or here to get started.", "Ninguna factura conciliada todavía — importe una NF-e desde el PDV o aquí para empezar.")}
            </p>
          ) : (
            <div className="space-y-2 mt-1">
              {matchResultados.map((m) => (
                <div key={m.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${corStatusMatch(m.status)}30` }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>
                          {m.fornecedorNome || L("Fornecedor não identificado", "Supplier not identified", "Proveedor no identificado")}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${corStatusMatch(m.status)}20`, color: corStatusMatch(m.status) }}>
                          {labelStatusMatch(m.status)}
                        </span>
                        {m.nivel === "3way" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.15)", color: ROXO }}>3-way</span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: CINZA }}>
                        {L("NF-e", "Invoice", "NF-e")} {m.numeroNf || "—"} · {fmt(m.valorNota || 0)} · {L("score", "score", "puntaje")} {m.score ?? "—"}
                        {m.divergenciasCount > 0 && ` · ${m.divergenciasCount} ${L("divergência(s)", "discrepancy(ies)", "discrepancia(s)")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      {podeEditar && (
                        <button onClick={() => reconferirNota(m)} disabled={reconferindoId === m.id}
                          className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1" style={{ background: "rgba(106,176,255,0.15)", color: AZUL, border: "1px solid rgba(106,176,255,0.3)" }}>
                          <RotateCcw size={13} />{reconferindoId === m.id ? L("Conferindo…", "Checking…", "Conciliando…") : L("Reconferir", "Re-check", "Reconciliar")}
                        </button>
                      )}
                      {podeEditar && m.status === "excecao" && (
                        <>
                          <button onClick={() => decidirMatch(m, "aprovado")} disabled={decidindoMatchId === m.id}
                            className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1" style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                            <CheckCircle2 size={13} />{L("Aprovar mesmo assim", "Approve anyway", "Aprobar de todos modos")}
                          </button>
                          <button onClick={() => decidirMatch(m, "rejeitado")} disabled={decidindoMatchId === m.id}
                            className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-60 flex items-center gap-1" style={{ background: "rgba(248,113,113,0.15)", color: VERMELHO, border: "1px solid rgba(248,113,113,0.3)" }}>
                            <XCircle size={13} />{L("Rejeitar", "Reject", "Rechazar")}
                          </button>
                        </>
                      )}
                      <button onClick={() => alternarConferenciaExpandida(m.id)} className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: AZUL }}>
                        {expandido.has(m.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {L("Detalhes", "Details", "Detalles")}
                      </button>
                    </div>
                  </div>

                  {expandido.has(m.id) && (
                    <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-[10px] uppercase font-bold mb-2" style={{ color: CINZA }}>
                        {L("Chave de acesso", "Access key", "Clave de acceso")}: {m.chaveAcesso || "—"} · {L("Conta", "Bill", "Cuenta")}: {m.contaDescricao || L("ainda não existe", "doesn't exist yet", "todavía no existe")}
                      </p>
                      {!divergenciasPorMatch[m.id] ? (
                        <p className="text-xs" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
                      ) : divergenciasPorMatch[m.id].length === 0 ? (
                        <p className="text-xs" style={{ color: VERDE }}>{L("Nenhuma divergência — nota, recebimento e conta batem.", "No discrepancy — invoice, receiving and bill all match.", "Ninguna discrepancia — factura, recepción y cuenta coinciden.")}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {divergenciasPorMatch[m.id].map((d) => (
                            <div key={d.id} className="p-2 rounded-lg text-xs" style={{ background: "rgba(0,0,0,0.2)", color: "#c8d8f0" }}>
                              <span className="font-bold" style={{ color: VERMELHO }}>{labelTipoDivergencia(d.tipo)}</span> — {explicarDivergencia(d)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CanvasBox>
      )}

      {aba === "historico" && (
        <CanvasBox cor={AZUL}>
          <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
          <h3 className="text-base font-bold mb-3" style={{ color: "#c8d8f0" }}>{L("Histórico da Conta", "Bill History", "Historial de la Cuenta")}</h3>
          <select value={contaHistoricoId} onChange={(e) => setContaHistoricoId(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
            <option value="">-- {L("Selecione uma conta", "Select a bill", "Seleccione una cuenta")} --</option>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.descricao} ({fmt(c.valor_total)})</option>)}
          </select>

          {!contaHistoricoId ? (
            <p className="text-sm" style={{ color: CINZA }}>{L("Selecione uma conta acima para ver a timeline de ações.", "Select a bill above to see its action timeline.", "Seleccione una cuenta arriba para ver la línea de tiempo de acciones.")}</p>
          ) : carregandoAuditoria ? (
            <p className="text-sm" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
          ) : auditoria.length === 0 ? (
            <p className="text-sm" style={{ color: CINZA }}>{L("Nenhum registro de auditoria ainda.", "No audit records yet.", "Ningún registro de auditoría todavía.")}</p>
          ) : (
            <div className="space-y-2">
              {auditoria.map((ev) => (
                <div key={ev.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(106,176,255,0.12)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{acaoLabel(ev.acao)}</p>
                      <p className="text-xs" style={{ color: CINZA }}>{nomeUsuario(ev.usuario_id)} · {new Date(ev.criado_em).toLocaleString("pt-BR")}</p>
                    </div>
                    {(ev.antes || ev.depois) && (
                      <button onClick={() => alternarExpandido(ev.id)} className="flex items-center gap-1 text-xs font-semibold flex-shrink-0" style={{ color: AZUL }}>
                        {expandido.has(ev.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {L("Detalhes", "Details", "Detalles")}
                      </button>
                    )}
                  </div>
                  {expandido.has(ev.id) && (ev.antes || ev.depois) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {ev.antes && (
                        <div>
                          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: VERMELHO }}>{L("Antes", "Before", "Antes")}</p>
                          <pre className="text-[10px] p-2 rounded-lg overflow-x-auto" style={{ background: "rgba(0,0,0,0.3)", color: "#c8d8f0" }}>{JSON.stringify(ev.antes, null, 2)}</pre>
                        </div>
                      )}
                      {ev.depois && (
                        <div>
                          <p className="text-[10px] uppercase font-bold mb-1" style={{ color: VERDE }}>{L("Depois", "After", "Después")}</p>
                          <pre className="text-[10px] p-2 rounded-lg overflow-x-auto" style={{ background: "rgba(0,0,0,0.3)", color: "#c8d8f0" }}>{JSON.stringify(ev.depois, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CanvasBox>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : "rgba(52,211,153,0.95)", color: "#0a1420" }}>
          {toast.msg}
        </div>
      )}

      {/* ====== MODAL NOVA/EDITAR CONTA ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalConta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-lg">
                <CanvasBox cor={AMBAR}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? L("Editar Conta a Pagar", "Edit Bill", "Editar Cuenta a Pagar") : L("Nova Conta a Pagar", "New Bill", "Nueva Cuenta a Pagar")}</h3>
                    </div>
                    <button onClick={fecharModalConta} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Fornecedor", "Supplier", "Proveedor")}</label>
                      <select value={nc.fornecedor_id} onChange={(e) => setNc({ ...nc, fornecedor_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                        {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Descrição", "Description", "Descripción")} *</label>
                      <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} onBlur={sugerirCategoriaPorDescricao}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Valor Total (R$)", "Total (R$)", "Total (R$)")} *</label>
                        <input type="number" value={nc.valor_total} onChange={(e) => setNc({ ...nc, valor_total: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Categoria", "Category", "Categoría")}</label>
                        <select value={nc.categoria} onChange={(e) => { setNc({ ...nc, categoria: e.target.value }); setSugestaoCategoria(null); }}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                          {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
                        </select>
                        {sugestaoCategoria && !nc.categoria && (
                          <button onClick={() => { setNc({ ...nc, categoria: sugestaoCategoria }); setSugestaoCategoria(null); }}
                            className="mt-1 text-[10px] font-semibold flex items-center gap-1" style={{ color: ROXO }}>
                            <Sparkles size={10} /> {cat(sugestaoCategoria)}
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Emissão", "Issue Date", "Emisión")}</label>
                        <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Vencimento", "Due Date", "Vencimiento")} *</label>
                        <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Nº Nota Fiscal", "Invoice No.", "Nº Factura")}</label>
                        <input value={nc.numero_nota} onChange={(e) => setNc({ ...nc, numero_nota: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Forma de Pagamento", "Payment Method", "Forma de Pago")}</label>
                        <select value={nc.forma_pagamento} onChange={(e) => setNc({ ...nc, forma_pagamento: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Centro de Custo", "Cost Center", "Centro de Costo")}</label>
                        <select value={nc.centro_custo_id} onChange={(e) => setNc({ ...nc, centro_custo_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Sem centro de custo", "No cost center", "Sin centro de costo")} --</option>
                          {centrosCusto.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Multa/Juros por Atraso (%/mês)", "Late Penalty/Interest (%/mo.)", "Multa/Interés por Atraso (%/mes)")}</label>
                        <input type="number" step="0.01" value={nc.taxa_multa_mensal} onChange={(e) => setNc({ ...nc, taxa_multa_mensal: e.target.value })}
                          placeholder={L("Opcional", "Optional", "Opcional")}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Desconto por Pagamento Antecipado (%)", "Early Payment Discount (%)", "Descuento por Pago Anticipado (%)")}</label>
                        <input type="number" step="0.01" min="0" max="100" value={nc.desconto_disponivel_pct}
                          onChange={(e) => setNc({ ...nc, desconto_disponivel_pct: e.target.value, desconto_data_limite: e.target.value.trim() ? nc.desconto_data_limite : "" })}
                          placeholder={L("Opcional, ex: 2 para 2%", "Optional, e.g. 2 for 2%", "Opcional, ej: 2 para 2%")}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Desconto Válido Até", "Discount Valid Until", "Descuento Válido Hasta")}</label>
                        <input type="date" value={nc.desconto_data_limite} onChange={(e) => setNc({ ...nc, desconto_data_limite: e.target.value })}
                          disabled={!nc.desconto_disponivel_pct.trim()}
                          className="w-full px-4 py-3 rounded-xl text-sm disabled:opacity-50" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                        <p className="text-[10px] mt-1" style={{ color: CINZA }}>{L("Preencha os dois só se o fornecedor oferecer desconto por antecipar o pagamento.", "Only fill both if the supplier offers a discount for early payment.", "Complete ambos solo si el proveedor ofrece descuento por pago anticipado.")}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Observações", "Notes", "Observaciones")}</label>
                      <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2}
                        className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={fecharModalConta} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarConta} disabled={salvando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                        {salvando ? L("Salvando...", "Saving...", "Guardando...") : L("Salvar Conta", "Save Bill", "Guardar Cuenta")}
                      </button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL PEDIDO DE COMPRA (Match Engine — Commit 4) ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalPedido && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-2xl">
                <CanvasBox cor={AZUL}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoPedido ? L("Editar Pedido de Compra", "Edit Purchase Order", "Editar Orden de Compra") : L("Novo Pedido de Compra", "New Purchase Order", "Nueva Orden de Compra")}</h3>
                    </div>
                    <button onClick={fecharModalPedido} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Fornecedor", "Supplier", "Proveedor")} *</label>
                        <select value={formPedido.fornecedor_id} disabled={!!editandoPedido} onChange={(e) => setFormPedido({ ...formPedido, fornecedor_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm disabled:opacity-60" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                          {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Número do Pedido", "Order Number", "Número de la Orden")} *</label>
                        <input value={formPedido.numero} onChange={(e) => setFormPedido({ ...formPedido, numero: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Data de Emissão", "Issue Date", "Fecha de Emisión")}</label>
                        <input type="date" value={formPedido.data_emissao} onChange={(e) => setFormPedido({ ...formPedido, data_emissao: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Observação", "Note", "Observación")}</label>
                      <input value={formPedido.observacao} onChange={(e) => setFormPedido({ ...formPedido, observacao: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>

                    <div className="pt-2">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-semibold" style={{ color: AZUL }}>{L("Itens do Pedido", "Order Items", "Ítems de la Orden")}</label>
                        <button onClick={adicionarItemPedido} className="text-xs font-semibold flex items-center gap-1" style={{ color: VERDE }}><Plus size={13} />{L("Item", "Item", "Ítem")}</button>
                      </div>
                      <div className="space-y-2">
                        {itensPedidoForm.map((it, idx) => (
                          <div key={idx} className="p-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                            <div className="grid grid-cols-12 gap-2 items-center">
                              <input value={it.descricao} onChange={(e) => atualizarItemPedido(idx, "descricao", e.target.value)} placeholder={L("Descrição", "Description", "Descripción")}
                                className="col-span-4 px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                              <input value={it.codigo_fornecedor} onChange={(e) => atualizarItemPedido(idx, "codigo_fornecedor", e.target.value)} placeholder={L("Cód. fornecedor", "Supplier code", "Cód. proveedor")}
                                className="col-span-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                              <input value={it.ean} onChange={(e) => atualizarItemPedido(idx, "ean", e.target.value)} placeholder="EAN"
                                className="col-span-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                              <input type="number" value={it.quantidade} onChange={(e) => atualizarItemPedido(idx, "quantidade", e.target.value)} placeholder={L("Qtd.", "Qty.", "Cant.")}
                                className="col-span-1 px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                              <input type="number" step="0.01" value={it.valor_unitario} onChange={(e) => atualizarItemPedido(idx, "valor_unitario", e.target.value)} placeholder={L("Vlr. unit.", "Unit price", "Precio unit.")}
                                className="col-span-2 px-2 py-1.5 rounded-lg text-xs" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                              <button onClick={() => removerItemPedido(idx)} className="col-span-1 flex justify-center" title={L("Remover item", "Remove item", "Quitar ítem")} style={{ color: VERMELHO }}><Trash2 size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-bold mt-2 text-right" style={{ color: "#c8d8f0" }}>{L("Total", "Total", "Total")}: {fmt(totalFormPedido)}</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={fecharModalPedido} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarPedido} disabled={salvandoPedido} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #1e40af, #6ab0ff)", color: "#fff" }}>
                        {salvandoPedido ? L("Salvando...", "Saving...", "Guardando...") : L("Salvar Pedido", "Save Order", "Guardar Orden")}
                      </button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL POSSÍVEL DUPLICATA (Entrega 2 — Commit 2) ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalDuplicata && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[110] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-lg">
                <CanvasBox cor={VERMELHO}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERMELHO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0" }}>
                        ⚠️ {L("Possível conta duplicada", "Possible duplicate bill", "Posible cuenta duplicada")}
                      </h3>
                    </div>
                    <button onClick={fecharModalDuplicata} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>

                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {duplicatas.map((d) => (
                      <div key={d.contas_pagar_id} className="p-3 rounded-xl flex items-center justify-between gap-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${d.score >= 90 ? VERMELHO : AMBAR}40` }}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{d.descricao}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {L("Nº nota", "Invoice no.", "Nº factura")} {d.numero_nota || "—"} · {fmt(d.valor_total)} · {L("emissão", "issued", "emisión")} {d.data_emissao ? new Date(d.data_emissao + "T00:00:00").toLocaleDateString("pt-BR") : "—"} · {L("vencimento", "due", "vencimiento")} {d.data_vencimento ? new Date(d.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2 py-1 rounded-lg text-xs font-black" style={{ background: `${d.score >= 90 ? VERMELHO : AMBAR}20`, color: d.score >= 90 ? VERMELHO : AMBAR }}>
                            {d.score}%
                          </span>
                          {podeEditar && (
                            <button onClick={() => vincularAExistente(d)} className="text-[10px] font-semibold underline" style={{ color: AZUL }}>
                              {L("Vincular a esta", "Link to this one", "Vincular a esta")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {duplicataBloqueada ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold" style={{ color: VERMELHO }}>
                        {L("Semelhança muito alta — salvar foi bloqueado por padrão. Só dono/admin pode forçar, confirmando a senha.", "Very high similarity — saving was blocked by default. Only owner/admin can force it, confirming their password.", "Similitud muy alta — guardar fue bloqueado por defecto. Solo dueño/admin puede forzar, confirmando su contraseña.")}
                      </p>
                      {(papel === "dono" || papel === "admin") ? (
                        !mostrarForcar ? (
                          <div className="flex gap-3">
                            <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                            <button onClick={() => setMostrarForcar(true)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #7f1d1d, #f87171)", color: "#fff" }}>
                              {L("Forçar (senha do dono)", "Force (owner password)", "Forzar (contraseña del dueño)")}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input type="password" value={senhaForcar} onChange={(e) => setSenhaForcar(e.target.value)}
                              placeholder={L("Sua senha", "Your password", "Su contraseña")}
                              className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(248,113,113,0.3)", color: "#c8d8f0" }} />
                            {erroForcar && <p className="text-xs" style={{ color: VERMELHO }}>{erroForcar}</p>}
                            <div className="flex gap-3">
                              <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                              <button onClick={confirmarForcarSenha} disabled={forcando || !senhaForcar} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #7f1d1d, #f87171)", color: "#fff" }}>
                                {forcando ? L("Confirmando...", "Confirming...", "Confirmando...") : L("Confirmar e Salvar", "Confirm and Save", "Confirmar y Guardar")}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <button onClick={fecharModalDuplicata} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Entendi", "Got it", "Entendido")}</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarMesmoAssim} disabled={salvando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                        {L("Salvar mesmo assim", "Save anyway", "Guardar de todos modos")}
                      </button>
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL BAIXA ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalBaixa && contaBaixa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-sm">
                <CanvasBox cor={VERDE}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERDE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Dar Baixa", "Register Payment", "Registrar Pago")}</h3>
                    </div>
                    <button onClick={fecharBaixa} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{contaBaixa.descricao}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Valor Pago (R$)", "Amount Paid (R$)", "Valor Pagado (R$)")}</label>
                      <input type="number" value={valorBaixa} onChange={(e) => setValorBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Data do Pagamento", "Payment Date", "Fecha de Pago")}</label>
                      <input type="date" value={dataBaixa} onChange={(e) => setDataBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Forma de Pagamento", "Payment Method", "Forma de Pago")}</label>
                      <select value={formaBaixa} onChange={(e) => setFormaBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <button onClick={confirmarBaixa} disabled={processandoBaixa} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff" }}>
                      {processandoBaixa ? L("Confirmando...", "Confirming...", "Confirmando...") : L("Confirmar Baixa", "Confirm Payment", "Confirmar Pago")}
                    </button>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL GERAR DE CUSTO FIXO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalCustoFixo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={ROXO}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ROXO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Gerar de Custo Fixo", "Generate from Fixed Cost", "Generar de Costo Fijo")}</h3>
                    </div>
                    <button onClick={() => setModalCustoFixo(false)} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{L(`Custos fixos do mês ${mesAtual} — clique em Gerar para criar a conta a pagar correspondente.`, `Fixed costs for ${mesAtual} — click Generate to create the matching bill.`, `Costos fijos de ${mesAtual} — haga clic en Generar para crear la cuenta correspondiente.`)}</p>
                  {custosFixos.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: CINZA }}>{L("Nenhum custo fixo cadastrado.", "No fixed costs registered.", "Ningún costo fijo registrado.")}</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {custosFixos.map((cf) => (
                        <div key={cf.id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.15)" }}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{cf.descricao}</p>
                            <p className="text-xs" style={{ color: CINZA }}>{fmt(cf.valor_mensal)} · {L("dia", "day", "día")} {cf.dia_vencimento}</p>
                          </div>
                          <button onClick={() => gerarDeCustoFixo(cf)} disabled={gerando === cf.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 disabled:opacity-60"
                            style={{ background: "rgba(167,139,250,0.15)", color: ROXO, border: "1px solid rgba(167,139,250,0.3)" }}>
                            {gerando === cf.id ? "..." : L("Gerar", "Generate", "Generar")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL ANEXO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalAnexo && contaAnexo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={AZUL}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Anexos", "Attachments", "Adjuntos")}</h3>
                    </div>
                    <button onClick={fecharAnexo} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{contaAnexo.descricao}</p>

                  {podeEditar && (
                    <div className="flex gap-2 mb-4">
                      <select value={tipoNovoDoc} onChange={(e) => setTipoNovoDoc(e.target.value)}
                        className="px-3 py-2 rounded-lg text-xs flex-shrink-0" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        {TIPOS_DOC.map((td) => <option key={td.key} value={td.key}>{(td.label as any)[idioma] || td.label.pt}</option>)}
                      </select>
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                        <Upload size={14} />{enviandoDoc ? L("Enviando...", "Uploading...", "Enviando...") : L("Enviar arquivo", "Upload file", "Enviar archivo")}
                        <input type="file" accept=".pdf,image/*" className="hidden" disabled={enviandoDoc}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarAnexo(f); e.target.value = ""; }} />
                      </label>
                    </div>
                  )}

                  {documentos.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: CINZA }}>{L("Nenhum documento anexado.", "No documents attached.", "Ningún documento adjunto.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(106,176,255,0.15)" }}>
                          <button onClick={() => abrirDocumento(doc)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                            <FileText size={16} style={{ color: AZUL }} />
                            <span className="text-sm truncate" style={{ color: "#c8d8f0" }}>{doc.nome}</span>
                          </button>
                          {podeEditar && (
                            <button onClick={() => removerDocumento(doc)} title={L("Remover documento", "Remove document", "Quitar documento")} style={{ color: VERMELHO }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL RASTREABILIDADE (Entrega 4, Commit 3 — Evidence Graph V1) ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {contaRastreabilidade && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-lg">
                <CanvasBox cor={ROXO}>
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ROXO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0" }}><Link2 size={18} />{L("Rastreabilidade", "Traceability", "Trazabilidad")}</h3>
                    </div>
                    <button onClick={fecharRastreabilidade} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-4" style={{ color: CINZA }}>{contaRastreabilidade.descricao} · {fmt(contaRastreabilidade.valor_total)}</p>

                  {carregandoEvidenceGraph || !evidenceGraph ? (
                    <p className="text-sm" style={{ color: CINZA }}>{L("Montando a cadeia de evidências...", "Assembling the evidence chain...", "Armando la cadena de evidencias...")}</p>
                  ) : (
                    <div className="space-y-2">
                      {/* 1. Fornecedor */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${(evidenceGraph.fornecedor.presente ? VERDE : CINZA)}30` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: evidenceGraph.fornecedor.presente ? VERDE : CINZA }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c8d8f0" }}>{L("Fornecedor", "Supplier", "Proveedor")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {evidenceGraph.fornecedor.presente ? evidenceGraph.fornecedor.nome : L("Sem fornecedor vinculado", "No supplier linked", "Sin proveedor vinculado")}
                          </p>
                        </div>
                      </div>

                      {/* 2. Contrato */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${(evidenceGraph.contrato.status === "ativo" ? VERDE : AMBAR)}30` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: evidenceGraph.contrato.status === "ativo" ? VERDE : evidenceGraph.contrato.status === "encerrado" ? AMBAR : CINZA }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c8d8f0" }}>{L("Contrato", "Contract", "Contrato")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {evidenceGraph.contrato.status === "sem_contrato" && L("Nenhum contrato cadastrado pra este fornecedor", "No contract registered for this supplier", "Ningún contrato registrado para este proveedor")}
                            {evidenceGraph.contrato.status === "ativo" && L(`Contrato vigente${evidenceGraph.contrato.descricao ? `: ${evidenceGraph.contrato.descricao}` : ""}`, `Active contract${evidenceGraph.contrato.descricao ? `: ${evidenceGraph.contrato.descricao}` : ""}`, `Contrato vigente${evidenceGraph.contrato.descricao ? `: ${evidenceGraph.contrato.descricao}` : ""}`)}
                            {evidenceGraph.contrato.status === "encerrado" && L(`Contrato encerrado${evidenceGraph.contrato.dataFim ? ` em ${new Date(evidenceGraph.contrato.dataFim + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}`, `Contract ended${evidenceGraph.contrato.dataFim ? ` on ${new Date(evidenceGraph.contrato.dataFim + "T00:00:00").toLocaleDateString("en-US")}` : ""}`, `Contrato finalizado${evidenceGraph.contrato.dataFim ? ` el ${new Date(evidenceGraph.contrato.dataFim + "T00:00:00").toLocaleDateString("es-ES")}` : ""}`)}
                          </p>
                        </div>
                      </div>

                      {/* 3. Pedido — não capturado hoje */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px dashed ${CINZA}40` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: CINZA }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: CINZA }}>{L("Pedido de Compra", "Purchase Order", "Pedido de Compra")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>{L("Não capturado hoje — depende do futuro módulo de Pedido de Compra.", "Not captured today — depends on the future Purchase Order module.", "No capturado hoy — depende del futuro módulo de Pedido de Compra.")}</p>
                        </div>
                      </div>

                      {/* 4. Recebimento — não capturado hoje */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: `1px dashed ${CINZA}40` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: CINZA }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: CINZA }}>{L("Recebimento", "Goods Receipt", "Recepción")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>{L("Não capturado hoje — depende do futuro módulo de Pedido de Compra.", "Not captured today — depends on the future Purchase Order module.", "No capturado hoy — depende del futuro módulo de Pedido de Compra.")}</p>
                        </div>
                      </div>

                      {/* 5. Fatura */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${VERDE}30` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: VERDE }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c8d8f0" }}>{L("Fatura", "Invoice", "Factura")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {L(`${fmt(evidenceGraph.fatura.valorTotal)}${evidenceGraph.fatura.numeroNota ? ` · Nota ${evidenceGraph.fatura.numeroNota}` : ""} · ${evidenceGraph.fatura.qtdDocumentosAnexados} anexo(s)`,
                              `${fmt(evidenceGraph.fatura.valorTotal)}${evidenceGraph.fatura.numeroNota ? ` · Invoice ${evidenceGraph.fatura.numeroNota}` : ""} · ${evidenceGraph.fatura.qtdDocumentosAnexados} attachment(s)`,
                              `${fmt(evidenceGraph.fatura.valorTotal)}${evidenceGraph.fatura.numeroNota ? ` · Nota ${evidenceGraph.fatura.numeroNota}` : ""} · ${evidenceGraph.fatura.qtdDocumentosAnexados} adjunto(s)`)}
                          </p>
                        </div>
                      </div>

                      {/* 6. Pagamento */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${(evidenceGraph.pagamento.status === "pago" ? VERDE : AMBAR)}30` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: evidenceGraph.pagamento.status === "pago" ? VERDE : AMBAR }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c8d8f0" }}>{L("Pagamento", "Payment", "Pago")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {evidenceGraph.pagamento.status === "pago"
                              ? L(`Pago em ${evidenceGraph.pagamento.dataPagamento ? new Date(evidenceGraph.pagamento.dataPagamento + "T00:00:00").toLocaleDateString("pt-BR") : "—"} (${fmt(evidenceGraph.pagamento.valorPago)}) · ${evidenceGraph.pagamento.qtdEventosAuditoria} evento(s) na trilha`,
                                  `Paid on ${evidenceGraph.pagamento.dataPagamento ? new Date(evidenceGraph.pagamento.dataPagamento + "T00:00:00").toLocaleDateString("en-US") : "—"} (${fmt(evidenceGraph.pagamento.valorPago)}) · ${evidenceGraph.pagamento.qtdEventosAuditoria} audit event(s)`,
                                  `Pagado el ${evidenceGraph.pagamento.dataPagamento ? new Date(evidenceGraph.pagamento.dataPagamento + "T00:00:00").toLocaleDateString("es-ES") : "—"} (${fmt(evidenceGraph.pagamento.valorPago)}) · ${evidenceGraph.pagamento.qtdEventosAuditoria} evento(s) en la trilla`)
                              : L(`Ainda pendente · ${evidenceGraph.pagamento.qtdEventosAuditoria} evento(s) na trilha`,
                                  `Still pending · ${evidenceGraph.pagamento.qtdEventosAuditoria} audit event(s)`,
                                  `Todavía pendiente · ${evidenceGraph.pagamento.qtdEventosAuditoria} evento(s) en la trilla`)}
                          </p>
                        </div>
                      </div>

                      {/* 7. Banco */}
                      <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${(evidenceGraph.banco.status === "reconciliado" ? VERDE : evidenceGraph.banco.status === "nao_reconciliado" ? AMBAR : CINZA)}30` }}>
                        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: evidenceGraph.banco.status === "reconciliado" ? VERDE : evidenceGraph.banco.status === "nao_reconciliado" ? AMBAR : CINZA }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#c8d8f0" }}>{L("Banco", "Bank", "Banco")}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {evidenceGraph.banco.status === "nao_conectado" && L("Open Finance não conectado nesta empresa.", "Open Finance not connected for this company.", "Open Finance no conectado en esta empresa.")}
                            {evidenceGraph.banco.status === "nao_reconciliado" && L("Conectado, mas nenhuma transação bancária reconciliada com esta conta ainda.", "Connected, but no bank transaction reconciled with this bill yet.", "Conectado, pero ninguna transacción bancaria reconciliada con esta cuenta todavía.")}
                            {evidenceGraph.banco.status === "reconciliado" && evidenceGraph.banco.transacao &&
                              L(`Reconciliado: ${evidenceGraph.banco.transacao.descricao} (${fmt(evidenceGraph.banco.transacao.valor)}) em ${new Date(evidenceGraph.banco.transacao.data + "T00:00:00").toLocaleDateString("pt-BR")}`,
                                `Reconciled: ${evidenceGraph.banco.transacao.descricao} (${fmt(evidenceGraph.banco.transacao.valor)}) on ${new Date(evidenceGraph.banco.transacao.data + "T00:00:00").toLocaleDateString("en-US")}`,
                                `Reconciliado: ${evidenceGraph.banco.transacao.descricao} (${fmt(evidenceGraph.banco.transacao.valor)}) el ${new Date(evidenceGraph.banco.transacao.data + "T00:00:00").toLocaleDateString("es-ES")}`)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL CONFIGURAÇÃO AP ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalConfigAp && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={CINZA}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: CINZA }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0" }}><Settings size={18} />{L("Configuração AP", "AP Configuration", "Configuración AP")}</h3>
                    </div>
                    <button onClick={() => setModalConfigAp(false)} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Limite de Aprovação Automática (R$)", "Auto-approval Limit (R$)", "Límite de Aprobación Automática (R$)")}</label>
                      <input type="number" value={configForm.limite} onChange={(e) => setConfigForm({ ...configForm, limite: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      <p className="text-[10px] mt-1" style={{ color: CINZA }}>{L("Contas com valor acima disso pedem aprovação antes de poder ser pagas.", "Bills above this amount need approval before they can be paid.", "Cuentas con valor superior a esto piden aprobación antes de poder pagarse.")}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Aprovadores", "Approvers", "Aprobadores")}</label>
                      <p className="text-[10px] mb-1" style={{ color: CINZA }}>{L("O dono da empresa pode sempre aprovar, mesmo sem estar na lista.", "The company owner can always approve, even if not on this list.", "El dueño de la empresa siempre puede aprobar, incluso sin estar en la lista.")}</p>
                      <div className="space-y-1 max-h-40 overflow-y-auto rounded-xl p-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(106,176,255,0.1)" }}>
                        {equipe.length === 0 ? (
                          <p className="text-xs px-2 py-1" style={{ color: CINZA }}>{L("Ninguém além de você tem acesso ainda.", "No one besides you has access yet.", "Nadie además de usted tiene acceso todavía.")}</p>
                        ) : equipe.filter((m) => m.origem === "ativo" && m.user_id).map((m) => (
                          <label key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer" style={{ background: configForm.aprovadores.includes(m.user_id!) ? "rgba(52,211,153,0.1)" : "transparent" }}>
                            <input type="checkbox" checked={configForm.aprovadores.includes(m.user_id!)} onChange={() => alternarAprovador(m.user_id!)} />
                            <span className="text-xs" style={{ color: "#c8d8f0" }}>{m.nome || m.email} <span style={{ color: CINZA }}>({m.papel})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={configForm.bloquearDuplicata} onChange={(e) => setConfigForm({ ...configForm, bloquearDuplicata: e.target.checked })} />
                      <span className="text-xs font-semibold" style={{ color: AZUL }}>{L("Bloquear duplicata quase certa (score ≥90%) por padrão", "Block near-certain duplicates (score ≥90%) by default", "Bloquear duplicado casi seguro (score ≥90%) por defecto")}</span>
                    </label>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Janela de Busca de Duplicata (dias)", "Duplicate Search Window (days)", "Ventana de Búsqueda de Duplicado (días)")}</label>
                      <input type="number" value={configForm.diasJanela} onChange={(e) => setConfigForm({ ...configForm, diasJanela: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <p className="text-xs font-bold mt-2 mb-1 flex items-center gap-2" style={{ color: "#c8d8f0" }}><ListChecks size={14} />{L("Conferência de Notas", "Invoice Matching", "Conciliación de Facturas")}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Tolerância de valor (%)", "Amount tolerance (%)", "Tolerancia de valor (%)")}</label>
                          <input type="number" min="0" value={configForm.toleranciaValor} onChange={(e) => setConfigForm({ ...configForm, toleranciaValor: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Tolerância de quantidade (%)", "Quantity tolerance (%)", "Tolerancia de cantidad (%)")}</label>
                          <input type="number" min="0" value={configForm.toleranciaQuantidade} onChange={(e) => setConfigForm({ ...configForm, toleranciaQuantidade: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                        </div>
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: CINZA }}>{L("Variação até esse percentual não vira exceção — ex: 2% cobre diferença de frete ou arredondamento entre a nota, o recebimento e a conta a pagar.", "A variance up to this percentage doesn't become an exception — e.g. 2% covers freight or rounding differences between the invoice, receiving and the bill.", "Una variación hasta ese porcentaje no se convierte en excepción — ej: 2% cubre diferencia de flete o redondeo entre la factura, la recepción y la cuenta a pagar.")}</p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setModalConfigAp(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarConfiguracaoAp} disabled={salvandoConfig} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #334155, #64748b)", color: "#fff" }}>
                        {salvandoConfig ? L("Salvando...", "Saving...", "Guardando...") : L("Salvar Configuração", "Save Configuration", "Guardar Configuración")}
                      </button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL TRANSFORMAR PADRÃO RECORRENTE EM CUSTO FIXO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {padraoParaTransformar && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={AMBAR}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0" }}><RotateCcw size={18} />{L("Transformar em Custo Fixo", "Turn into Fixed Cost", "Convertir en Costo Fijo")}</h3>
                    </div>
                    <button onClick={() => setPadraoParaTransformar(null)} title={L("Fechar", "Close", "Cerrar")} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>
                    {L(`Detectado com ${padraoParaTransformar.ocorrencias} lançamentos de ${nomeFornecedor(padraoParaTransformar.fornecedorId)}. Confira os dados antes de confirmar — nada é criado sem sua aprovação.`,
                      `Detected across ${padraoParaTransformar.ocorrencias} entries from ${nomeFornecedor(padraoParaTransformar.fornecedorId)}. Review the data before confirming — nothing is created without your approval.`,
                      `Detectado con ${padraoParaTransformar.ocorrencias} lanzamientos de ${nomeFornecedor(padraoParaTransformar.fornecedorId)}. Revise los datos antes de confirmar — nada se crea sin su aprobación.`)}
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Descrição", "Description", "Descripción")} *</label>
                      <input value={formCustoFixo.descricao} onChange={(e) => setFormCustoFixo({ ...formCustoFixo, descricao: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Valor Mensal (R$)", "Monthly Amount (R$)", "Valor Mensual (R$)")} *</label>
                        <input type="number" step="0.01" value={formCustoFixo.valorMensal} onChange={(e) => setFormCustoFixo({ ...formCustoFixo, valorMensal: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Dia de Vencimento", "Due Day", "Día de Vencimiento")} *</label>
                        <input type="number" min={1} max={28} value={formCustoFixo.diaVencimento} onChange={(e) => setFormCustoFixo({ ...formCustoFixo, diaVencimento: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Categoria", "Category", "Categoría")}</label>
                        <select value={formCustoFixo.categoria} onChange={(e) => setFormCustoFixo({ ...formCustoFixo, categoria: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                          {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Centro de Custo", "Cost Center", "Centro de Costo")}</label>
                        <select value={formCustoFixo.centroCustoId} onChange={(e) => setFormCustoFixo({ ...formCustoFixo, centroCustoId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Sem centro de custo", "No cost center", "Sin centro de costo")} --</option>
                          {centrosCusto.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <p className="text-[10px]" style={{ color: CINZA }}>
                      {L("As contas antigas desse padrão passam a ficar vinculadas a este Custo Fixo, e a conta deste mês é gerada automaticamente (sem duplicar se já existir).",
                        "The old bills from this pattern get linked to this Fixed Cost, and this month's bill is generated automatically (no duplicate if one already exists).",
                        "Las cuentas antiguas de ese patrón quedan vinculadas a este Costo Fijo, y la cuenta de este mes se genera automáticamente (sin duplicar si ya existe).")}
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setPadraoParaTransformar(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={confirmarTransformarPadrao} disabled={transformando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#fff" }}>
                        {transformando ? L("Criando...", "Creating...", "Creando...") : L("Confirmar e Criar", "Confirm and Create", "Confirmar y Crear")}
                      </button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={idioma}
        textoResumo={textoResumo}
        textoDetalhado={textoDetalhado}
        assunto={`${L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")} — Axioma`}
        cor={AZUL}
      />
    </ModuloLayout>
  );
}
