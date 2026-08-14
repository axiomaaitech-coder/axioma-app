"use client";
// 🦅 AXIOMA AI.TECH — formulário de cadastro de produto/serviço do PDV,
// extraído de app/(interno)/pdv/cadastro/page.tsx pra ser usado em DOIS
// lugares: a página cheia (/pdv/cadastro — picker manual, edição por ?id=,
// bipagem em massa) e inline no nível "produtos" da navegação do Catálogo
// (app/(interno)/pdv/page.tsx), onde nicho/categoria/sub-nicho já vêm
// prontos da navegação. Uma fonte só de verdade: a calculadora de
// precificação (Etapa 2), as sugestões inteligentes (Etapa 3), o chat da
// inteligência do Axioma (Etapa 4) e a proteção contra falha silenciosa no
// salvamento vivem só aqui — corrigir num lugar corrige nos dois.
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ScanBarcode, Loader2, Sparkles, CheckCircle2, AlertTriangle, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTemaPdv } from "./PdvLayout";
import { precoPorDivisor, margemReal, lucroPorUnidade, situacaoMargem, type SituacaoMargem } from "../lib/cfoCore";
import type { Idioma } from "../lib/translations";
import {
  type Produto, criarProduto, atualizarProduto, buscarProdutoPorId,
  criarMovimentacao, consultarEan, type ConsultaEanResposta, buscarProdutoPorCodigo,
  buscarUltimaCompraProduto, type UltimaCompraProduto,
  carregarRentabilidadePorCategoria, type ItemRentabilidade,
  carregarComparativoFornecedores, type FornecedorComparativo,
} from "../lib/estoqueHelpers";
import { CHAVE_PERECIVEL, type CampoNicho } from "../lib/categoriaInteligente";
import { buscarSugestoesColuna } from "../lib/sugestaoInteligente";
import { type NichoPdvDef, type CategoriaPdv, type SubNichoPdv, subNichoEhServico } from "../lib/pdvCatalogoTaxonomia";
import { consultarIA, verificarNomeDuplicado } from "../lib/pdvHelpers";
import { buscarSugestoesSemente } from "../lib/pdvAutocompleteSemente";

// Botões de ação (Salvar/Consultar) usam tokens.acaoBg/acaoTexto — verde só
// sobrevive no tema escuro (ver components/PdvLayout.tsx). Âmbar continua
// fixo nos dois temas: é cor de status (sugestão/alerta), não identidade.
const AMBAR = "#f5b942";

// Botão do assistente é widget de suporte (estilo WhatsApp/Intercom) — cor
// fixa de destaque, não segue os tokens de tema (precisa saltar aos olhos
// nos 3 temas igualmente).
const VERDE_SUPORTE = "#22c55e";

// Etapa 4 — teto de perguntas por sessão de cadastro (protege o crédito da
// OpenAI). Conta só perguntas que de fato chegaram à OpenAI (ver AssistenteAxioma).
const LIMITE_PERGUNTAS_ASSISTENTE = 10;

const txt = {
  campoNome: { pt: "Nome", en: "Name", es: "Nombre" },
  campoCodigoBarras: { pt: "Código de Barras (EAN)", en: "Barcode (EAN)", es: "Código de Barras (EAN)" },
  consultar: { pt: "Consultar", en: "Look up", es: "Consultar" },
  campoMarca: { pt: "Marca", en: "Brand", es: "Marca" },
  campoCategoria: { pt: "Categoria", en: "Category", es: "Categoría" },
  campoPrecoVenda: { pt: "Preço de Venda", en: "Sale Price", es: "Precio de Venta" },
  campoUnidade: { pt: "Unidade", en: "Unit", es: "Unidad" },
  campoEstoqueMinimo: { pt: "Estoque Mínimo", en: "Minimum Stock", es: "Stock Mínimo" },
  campoStatus: { pt: "Status", en: "Status", es: "Estado" },
  statusAtivo: { pt: "Ativo", en: "Active", es: "Activo" },
  statusInativo: { pt: "Inativo", en: "Inactive", es: "Inactivo" },
  camposEspecificos: { pt: "Campos deste sub-nicho", en: "Fields for this sub-niche", es: "Campos de este sub-nicho" },
  blocoLote: { pt: "Lote / Validade (primeira entrada)", en: "Batch / Expiry (first entry)", es: "Lote / Vencimiento (primera entrada)" },
  campoNumeroLote: { pt: "Nº do Lote", en: "Batch No.", es: "N.º de Lote" },
  campoValidade: { pt: "Validade", en: "Expiry Date", es: "Vencimiento" },
  campoQuantidade: { pt: "Quantidade", en: "Quantity", es: "Cantidad" },

  sugeridoCosmos: { pt: "Preenchido pelo catálogo — confira", en: "Filled from catalog — please check", es: "Completado por el catálogo — revise" },
  sugeridoIA: { pt: "Sugestão automática — não confirmado, confira com atenção", en: "Automatic suggestion — unverified, please review carefully", es: "Sugerencia automática — sin confirmar, revise con atención" },
  nenhumaSugestao: { pt: "Nenhuma sugestão encontrada — preencha manualmente.", en: "No suggestion found — fill in manually.", es: "No se encontró sugerencia — complete manualmente." },
  produtoJaCadastrado: { pt: "Já cadastrado — abrindo para edição", en: "Already registered — opening for edit", es: "Ya registrado — abriendo para editar" },

  nomeDuplicadoTitulo: { pt: "Já existe um item com esse nome neste nicho", en: "An item with this name already exists in this niche", es: "Ya existe un ítem con ese nombre en este nicho" },
  abrirExistente: { pt: "Abrir o existente", en: "Open existing", es: "Abrir el existente" },
  criarMesmoAssim: { pt: "Criar mesmo assim", en: "Create anyway", es: "Crear de todos modos" },

  salvar: { pt: "Salvar", en: "Save", es: "Guardar" },
  salvando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  toastSalvo: { pt: "Salvo: {nome}", en: "Saved: {nome}", es: "Guardado: {nome}" },
  toastAtualizado: { pt: "Atualizado: {nome}", en: "Updated: {nome}", es: "Actualizado: {nome}" },
  toastNomeObrigatorio: { pt: "Digite o nome", en: "Enter a name", es: "Ingrese el nombre" },

  precificacaoTitulo: { pt: "Precificação", en: "Pricing", es: "Precificación" },
  campoCustoCompra: { pt: "Custo de Compra (R$)", en: "Purchase Cost (R$)", es: "Costo de Compra (R$)" },
  campoDespesasVariaveis: { pt: "Despesas Variáveis (%)", en: "Variable Expenses (%)", es: "Gastos Variables (%)" },
  campoMargemDesejada: { pt: "Margem Desejada (%)", en: "Desired Margin (%)", es: "Margen Deseado (%)" },
  labelMargemReal: { pt: "Margem Real", en: "Real Margin", es: "Margen Real" },
  labelLucroUnidade: { pt: "Lucro por Unidade", en: "Profit per Unit", es: "Ganancia por Unidad" },
  avisoDivisorInvalido: {
    pt: "Despesas + margem somam 100% ou mais — impossível calcular um preço. Reduza os percentuais.",
    en: "Expenses + margin add up to 100% or more — impossible to calculate a price. Reduce the percentages.",
    es: "Gastos + margen suman 100% o más — imposible calcular un precio. Reduzca los porcentajes.",
  },
  usarEsteValor: { pt: "Usar este valor", en: "Use this value", es: "Usar este valor" },
  sugCustoCarregando: { pt: "Buscando última compra…", en: "Looking up last purchase…", es: "Buscando última compra…" },
  sugCustoComDado: { pt: "Última compra: {valor} em {data}", en: "Last purchase: {valor} on {data}", es: "Última compra: {valor} el {data}" },
  sugCustoSemDado: { pt: "Ainda sem histórico de compra deste produto.", en: "No purchase history for this product yet.", es: "Aún sin historial de compra de este producto." },
  sugMargemCarregando: { pt: "Calculando margem sugerida da categoria…", en: "Calculating suggested category margin…", es: "Calculando margen sugerido de la categoría…" },
  sugMargemComDado: {
    pt: "Margem média de {categoria}, com base no preço sugerido do catálogo: {v}%",
    en: "Average margin for {categoria}, based on the catalog's suggested price: {v}%",
    es: "Margen medio de {categoria}, basado en el precio sugerido del catálogo: {v}%",
  },
  sugMargemSemDado: { pt: "Ainda sem dado de margem para esta categoria.", en: "No margin data for this category yet.", es: "Aún sin dato de margen para esta categoría." },
  sugFornecedorCarregando: { pt: "Buscando dados do fornecedor…", en: "Looking up supplier data…", es: "Buscando datos del proveedor…" },
  sugFornecedorComDado: {
    pt: "Fornecedor vinculado a este produto: {fornecedor} — preço médio {valor}, {n} entregas, última em {data}",
    en: "Supplier linked to this product: {fornecedor} — average price {valor}, {n} deliveries, last on {data}",
    es: "Proveedor vinculado a este producto: {fornecedor} — precio medio {valor}, {n} entregas, última el {data}",
  },
  sugFornecedorSemVinculo: { pt: "Nenhum fornecedor vinculado a este produto.", en: "No supplier linked to this product.", es: "Ningún proveedor vinculado a este producto." },
  sugFornecedorSemDado: { pt: "Fornecedor vinculado, mas ainda sem histórico de compras.", en: "Supplier linked, but no purchase history yet.", es: "Proveedor vinculado, pero aún sin historial de compras." },
  alertaPrejuizoTitulo: { pt: "Prejuízo por Unidade", en: "Loss per Unit", es: "Pérdida por Unidad" },
  alertaPrejuizoTexto: {
    pt: "Vendendo a esse preço, você perde {v} em cada unidade.",
    en: "At this price, you lose {v} on every unit sold.",
    es: "Vendiendo a este precio, pierde {v} en cada unidad.",
  },
  alertaMargemApertadaTitulo: { pt: "Margem Apertada", en: "Tight Margin", es: "Margen Ajustado" },
  alertaMargemApertadaTexto: {
    pt: "Margem real de {v}% — considere revisar o preço ou o custo.",
    en: "Real margin of {v}% — consider reviewing the price or cost.",
    es: "Margen real de {v}% — considere revisar el precio o el costo.",
  },
  alertaMargemSaudavel: { pt: "Margem saudável: {v}%", en: "Healthy margin: {v}%", es: "Margen saludable: {v}%" },
  confirmarPrejuizoTitulo: { pt: "Salvar mesmo com prejuízo?", en: "Save even at a loss?", es: "¿Guardar aunque esté con pérdida?" },
  confirmarPrejuizoTexto: {
    pt: "Vender abaixo do custo + despesas dá prejuízo real, não só margem baixa.",
    en: "Selling below cost + expenses is a real loss, not just a thin margin.",
    es: "Vender por debajo del costo + gastos genera una pérdida real, no solo un margen bajo.",
  },
  confirmarPrejuizoValor: { pt: "{v} de prejuízo por unidade", en: "{v} loss per unit", es: "{v} de pérdida por unidad" },
  btnCancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  btnSalvarMesmoAssim: { pt: "Salvar mesmo assim", en: "Save anyway", es: "Guardar de todas formas" },

  // ---- Etapa 4 — Assistente da inteligência do Axioma (chat contextual) ----
  assistenteBotao: { pt: "Assistente Axioma", en: "Axioma Assistant", es: "Asistente Axioma" },
  assistenteTitulo: { pt: "Inteligência do Axioma", en: "Axioma's intelligence", es: "Inteligencia de Axioma" },
  assistenteVazio: {
    pt: "Pergunte sobre como preencher, margem do ramo ou boas práticas de cadastro.",
    en: "Ask about how to fill in fields, typical margins, or registration best practices.",
    es: "Pregunta sobre cómo completar, margen del rubro o buenas prácticas de registro.",
  },
  assistentePlaceholder: { pt: "Digite sua pergunta...", en: "Type your question...", es: "Escribe tu pregunta..." },
  assistenteEnviar: { pt: "Enviar", en: "Send", es: "Enviar" },
  assistenteLimparConversa: { pt: "Limpar conversa", en: "Clear conversation", es: "Limpiar conversación" },
  assistenteLimiteAtingido: {
    pt: "Limite de perguntas desta sessão atingido. Recarregue a página para continuar.",
    en: "Question limit for this session reached. Reload the page to continue.",
    es: "Límite de preguntas de esta sesión alcanzado. Recarga la página para continuar.",
  },
  assistenteErro: {
    pt: "Não consegui responder agora. Tente novamente em instantes.",
    en: "Couldn't answer right now. Try again in a moment.",
    es: "No pude responder ahora. Intenta de nuevo en unos instantes.",
  },
  assistenteIndisponivel: { pt: "Assistente indisponível no momento.", en: "Assistant unavailable right now.", es: "Asistente no disponible en este momento." },
  assistenteLimiteRede: {
    pt: "Muitas perguntas em pouco tempo. Aguarde um instante e tente de novo.",
    en: "Too many questions in a short time. Wait a moment and try again.",
    es: "Demasiadas preguntas en poco tiempo. Espera un momento e intenta de nuevo.",
  },
};

export type Lang = Idioma;
export function t(chave: keyof typeof txt, lang: Lang, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

export function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export type OrigemSugestao = "base" | "cosmos" | "ia" | null;
export type FormPdv = Partial<Produto> & { atributos_nicho: Record<string, any> };

export function formVazio(segmento?: string): FormPdv {
  return { unidade: "UN", status: "ativo", estoque_minimo: 0, atributos_nicho: {}, segmento };
}

// Categoria/sub-nicho não têm value estável fora da taxonomia curada (o
// Catálogo e o produto salvo só guardam o label) — casa por label nos 3
// idiomas. Usado tanto pra herdar da navegação (query params/nível do
// Catálogo) quanto pra reabrir um produto existente em modo edição.
export function encontrarCategoriaPorLabel(nicho: NichoPdvDef, label: string): CategoriaPdv | null {
  return nicho.categorias.find((c) => [c.label.pt, c.label.en, c.label.es].some((l) => l.toLowerCase() === label.toLowerCase())) || null;
}
export function encontrarSubNichoPorLabel(categoria: CategoriaPdv, label: string): SubNichoPdv | null {
  return categoria.subNichos.find((s) => [s.label.pt, s.label.en, s.label.es].some((l) => l.toLowerCase() === label.toLowerCase())) || null;
}

function preencherSeVazio<T extends Record<string, any>>(prev: T, sugeridos: Set<string>, campo: string, valor: any) {
  const vazio = prev[campo] === undefined || prev[campo] === null || prev[campo] === "" || prev[campo] === 0;
  const preenche = vazio && valor !== undefined && valor !== null && valor !== "";
  if (!preenche) return prev[campo];
  sugeridos.add(campo);
  return valor;
}

// ============================================================================
// CASCATA — camadas 1+2 (base própria + Cosmos). Camada 3 (IA) é função
// separada. Reaproveitadas tal e qual tanto pelo Cadastro Único (hook abaixo)
// quanto pela Bipagem em Massa (que continua só em pdv/cadastro/page.tsx).
// ============================================================================
export async function rodarCascataBase(empresaId: string | null, codigo: string): Promise<{ jaExiste: Produto | null; patch: Record<string, any>; sugeridos: Set<string>; origem: OrigemSugestao }> {
  const sugeridos = new Set<string>();
  if (!codigo || !empresaId) return { jaExiste: null, patch: {}, sugeridos, origem: null };

  const existente = await buscarProdutoPorCodigo(empresaId, codigo);
  if (existente) return { jaExiste: existente, patch: {}, sugeridos, origem: "base" };

  const r: ConsultaEanResposta = await consultarEan(codigo);
  const patch: Record<string, any> = {};
  if (r.status === "ok") {
    const base = { nome: undefined, categoria: undefined } as Record<string, any>;
    const p = (campo: string, valor: any) => { const v = preencherSeVazio(base, sugeridos, campo, valor); if (sugeridos.has(campo)) patch[campo] = v; };
    p("nome", r.nome); p("marca", r.marca); p("categoria", r.categoria); p("ncm", r.ncm);
    p("peso", r.peso); p("altura", r.altura); p("largura", r.largura); p("comprimento", r.comprimento);
    p("ipi", r.ipi); p("icms", r.icms); p("pis", r.pis); p("cofins", r.cofins);
    p("preco_sugerido", r.precoSugerido);
    return { jaExiste: null, patch, sugeridos, origem: Object.keys(patch).length > 0 ? "cosmos" : null };
  }
  return { jaExiste: null, patch, sugeridos, origem: null };
}

export async function rodarCamadaIA(lang: Lang, codigo: string): Promise<{ patch: Record<string, any>; sugeridos: Set<string> }> {
  const sugeridos = new Set<string>();
  const patch: Record<string, any> = {};
  if (!codigo) return { patch, sugeridos };
  const r = await consultarIA(codigo, lang);
  if (r.status === "ok") {
    if (r.nome) { patch.nome = r.nome; sugeridos.add("nome"); }
    if (r.marca) { patch.marca = r.marca; sugeridos.add("marca"); }
    if (r.categoria) { patch.categoria = r.categoria; sugeridos.add("categoria"); }
  }
  return { patch, sugeridos };
}

// ============================================================================
// HOOK — todo o estado + regras do Cadastro Único (form, cálculo de
// precificação, sugestões da Etapa 3, salvar protegido contra falha
// silenciosa). Extraído de PDVCadastroInner sem mudar comportamento — só
// trocou closures de estado de página por parâmetros explícitos, pra poder
// ser chamado tanto da página cheia quanto do nível "produtos" do Catálogo.
// ============================================================================
export function useCadastroProdutoPdv(args: {
  empresaId: string | null;
  userId: string | null;
  lang: Lang;
  nichoSel: NichoPdvDef | null;
  categoriaSel: CategoriaPdv | null;
  subNichoSel: SubNichoPdv | null;
  produtoParaEditar?: Produto | null;
  cargaProgramaticaRef?: React.MutableRefObject<boolean>;
  mostrarToast: (msg: string, tipo?: "ok" | "erro" | "info") => void;
  onSalvo?: () => void;
}) {
  const { empresaId, userId, lang, nichoSel, categoriaSel, subNichoSel, produtoParaEditar, mostrarToast, onSalvo } = args;
  const refInterno = useRef(false);
  const cargaProgramaticaRef = args.cargaProgramaticaRef || refInterno;

  const [form, setForm] = useState<FormPdv>(formVazio());
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [camposSugeridos, setCamposSugeridos] = useState<Set<string>>(new Set());
  const [origemSugestao, setOrigemSugestao] = useState<OrigemSugestao>(null);
  const [consultando, setConsultando] = useState(false);
  const [duplicado, setDuplicado] = useState<{ id: string; nome: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [loteInicial, setLoteInicial] = useState({ numero_lote: "", data_validade: "", quantidade: "" });
  const [sugestoesHistorico, setSugestoesHistorico] = useState<Record<string, string[]>>({});

  // ---- Precificação (custo, despesas%, margem desejada%) — despesas%/margem
  // desejada% não têm coluna em produtos (só preco_custo/preco_venda são
  // reais), então ficam só em estado local, resetam a cada cadastro.
  const [despesasPct, setDespesasPct] = useState("");
  const [margemDesejadaPct, setMargemDesejadaPct] = useState("");
  const [calculadoraTocada, setCalculadoraTocada] = useState(false);
  const [modalPrejuizoAberto, setModalPrejuizoAberto] = useState(false);
  const [forcarCriacaoPendente, setForcarCriacaoPendente] = useState(false);

  // ---- Sugestões inteligentes (Etapa 3) ----
  const [sugestaoCusto, setSugestaoCusto] = useState<UltimaCompraProduto | null>(null);
  const [sugestaoFornecedor, setSugestaoFornecedor] = useState<FornecedorComparativo | null>(null);
  const [carregandoSugestaoProduto, setCarregandoSugestaoProduto] = useState(false);
  const [sugestaoMargem, setSugestaoMargem] = useState<ItemRentabilidade | null>(null);
  const [carregandoSugestaoMargem, setCarregandoSugestaoMargem] = useState(false);

  useEffect(() => {
    if (!nichoSel) return;
    if (cargaProgramaticaRef.current) { cargaProgramaticaRef.current = false; return; }
    setForm(formVazio(nichoSel.value));
    setProdutoEditando(null); setCamposSugeridos(new Set()); setOrigemSugestao(null); setDuplicado(null);
    setLoteInicial({ numero_lote: "", data_validade: "", quantidade: "" });
    setDespesasPct(""); setMargemDesejadaPct(""); setCalculadoraTocada(false);
  }, [nichoSel?.value, categoriaSel?.value, subNichoSel?.value]);

  // ---- Carrega um produto pra edição quando o chamador injeta um (edição
  // por ?id= na página cheia). Quem busca o produto e resolve nicho/categoria/
  // sub-nicho continua no chamador (é URL-aware); aqui só populamos o form.
  useEffect(() => {
    if (!produtoParaEditar) return;
    setProdutoEditando(produtoParaEditar);
    setForm({ ...produtoParaEditar, atributos_nicho: produtoParaEditar.atributos_nicho || {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtoParaEditar?.id]);

  useEffect(() => {
    setSugestaoCusto(null); setSugestaoFornecedor(null);
    if (!empresaId || !produtoEditando) return;
    setCarregandoSugestaoProduto(true);
    (async () => {
      const [ultimaCompra, fornecedores] = await Promise.all([
        buscarUltimaCompraProduto(empresaId, produtoEditando.id),
        produtoEditando.fornecedor_id ? carregarComparativoFornecedores(empresaId) : Promise.resolve([] as FornecedorComparativo[]),
      ]);
      setSugestaoCusto(ultimaCompra);
      setSugestaoFornecedor(fornecedores.find((f) => f.fornecedor_id === produtoEditando.fornecedor_id) || null);
      setCarregandoSugestaoProduto(false);
    })();
  }, [empresaId, produtoEditando?.id]);

  useEffect(() => {
    setSugestaoMargem(null);
    if (!empresaId || !categoriaSel) return;
    setCarregandoSugestaoMargem(true);
    (async () => {
      const lista = await carregarRentabilidadePorCategoria(empresaId);
      const labels = [categoriaSel.label.pt, categoriaSel.label.en, categoriaSel.label.es].map((l) => l.toLowerCase());
      setSugestaoMargem(lista.find((i) => labels.includes((i.chave || "").toLowerCase())) || null);
      setCarregandoSugestaoMargem(false);
    })();
  }, [empresaId, categoriaSel?.value]);

  // ---- Cálculo de precificação — fórmula do divisor e margem real vêm do
  // cfoCore (fonte única), nunca reimplementadas aqui.
  const custoNum = Number(form.preco_custo) || 0;
  const despesasFracao = (Number(despesasPct) || 0) / 100;
  const margemFracao = (Number(margemDesejadaPct) || 0) / 100;
  const divisorInvalido = despesasFracao + margemFracao >= 1;
  const precoSugerido = divisorInvalido ? 0 : precoPorDivisor(custoNum, [despesasFracao, margemFracao]);
  const margemRealPct = margemReal(Number(form.preco_venda) || 0, custoNum);
  const lucroUnidade = lucroPorUnidade(Number(form.preco_venda) || 0, custoNum, despesasFracao);
  const situacaoAtual: SituacaoMargem | null = custoNum > 0 ? situacaoMargem(lucroUnidade, margemRealPct) : null;

  useEffect(() => {
    if (!calculadoraTocada || custoNum <= 0 || divisorInvalido) return;
    setForm((f) => ({ ...f, preco_venda: Number(precoSugerido.toFixed(2)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [custoNum, despesasFracao, margemFracao, calculadoraTocada]);

  function onChangeCusto(v: any) {
    setCalculadoraTocada(true);
    onChangeCampo("preco_custo", v);
  }
  function onChangeDespesasPct(v: any) {
    setCalculadoraTocada(true);
    setDespesasPct(v);
  }
  function onChangeMargemDesejadaPct(v: any) {
    setCalculadoraTocada(true);
    setMargemDesejadaPct(v);
  }

  function onChangeCampo(campo: string, valor: any) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setCamposSugeridos((s) => { if (!s.has(campo)) return s; const n = new Set(s); n.delete(campo); return n; });
  }
  function onChangeAtributo(chave: string, valor: any) {
    setForm((f) => ({ ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [chave]: valor } }));
    setCamposSugeridos((s) => { const chaveSugerida = `attr:${chave}`; if (!s.has(chaveSugerida)) return s; const n = new Set(s); n.delete(chaveSugerida); return n; });
  }

  function garantirSugestaoHistorico(coluna: "nome" | "marca" | "categoria") {
    if (!empresaId || sugestoesHistorico[coluna] !== undefined) return;
    setSugestoesHistorico((s) => ({ ...s, [coluna]: [] }));
    buscarSugestoesColuna(empresaId, coluna).then((v) => setSugestoesHistorico((s) => ({ ...s, [coluna]: v })));
  }

  async function handleConsultarAvulso() {
    const codigo = (form.codigo_barras || "").trim();
    if (!codigo || consultando) return;
    setConsultando(true); setDuplicado(null);
    try {
      const { jaExiste, patch, sugeridos, origem } = await rodarCascataBase(empresaId, codigo);
      if (jaExiste) {
        setProdutoEditando(jaExiste); setForm({ ...jaExiste, atributos_nicho: jaExiste.atributos_nicho || {} });
        setOrigemSugestao(null); setCamposSugeridos(new Set());
        setDespesasPct(""); setMargemDesejadaPct(""); setCalculadoraTocada(false);
        mostrarToast(t("produtoJaCadastrado", lang), "info");
        return;
      }
      setForm((f) => ({ ...f, ...patch }));
      setCamposSugeridos((s) => new Set([...s, ...sugeridos]));
      setOrigemSugestao(origem);

      if (!patch.nome && !form.nome) {
        const ia = await rodarCamadaIA(lang, codigo);
        if (ia.sugeridos.size > 0) {
          setForm((f) => ({ ...f, ...ia.patch }));
          setCamposSugeridos((s) => new Set([...s, ...ia.sugeridos]));
          setOrigemSugestao("ia");
        } else {
          mostrarToast(t("nenhumaSugestao", lang), "info");
        }
      }
    } finally {
      setConsultando(false);
    }
  }

  async function salvarAvulso(forcarCriacao = false, confirmadoPrejuizo = false) {
    if (!empresaId || !userId || !nichoSel) return;
    if (!form.nome?.trim()) { mostrarToast(t("toastNomeObrigatorio", lang), "erro"); return; }

    if (!subNichoEhServico(nichoSel, subNichoSel) && situacaoAtual === "prejuizo" && !confirmadoPrejuizo) {
      setForcarCriacaoPendente(forcarCriacao);
      setModalPrejuizoAberto(true);
      return;
    }

    if (!produtoEditando && !form.codigo_barras && !forcarCriacao) {
      const achado = await verificarNomeDuplicado(empresaId, nichoSel.value, form.nome);
      if (achado) { setDuplicado(achado); return; }
    }
    setDuplicado(null);
    setSalvando(true);
    try {
      const payload: Partial<Produto> = {
        ...form,
        segmento: nichoSel.value,
        categoria: categoriaSel ? categoriaSel.label[lang] : form.categoria,
        subcategoria: subNichoSel ? subNichoSel.label[lang] : form.subcategoria,
        controla_estoque: !subNichoEhServico(nichoSel, subNichoSel),
      };
      let produtoId = produtoEditando?.id;
      if (produtoEditando) {
        const { erro } = await atualizarProduto(produtoEditando.id, payload);
        if (erro) { mostrarToast(erro, "erro"); return; }
        mostrarToast(t("toastAtualizado", lang, { nome: form.nome }));
      } else {
        const { id, erro } = await criarProduto(empresaId, userId, payload);
        if (erro) { mostrarToast(erro, "erro"); return; }
        produtoId = id;
        mostrarToast(t("toastSalvo", lang, { nome: form.nome }));
      }
      const qtdLote = Number(loteInicial.quantidade) || 0;
      if (!produtoEditando && produtoId && (form.atributos_nicho || {})[CHAVE_PERECIVEL] && loteInicial.numero_lote.trim() && qtdLote > 0) {
        await criarMovimentacao(empresaId, userId, {
          produto_id: produtoId, tipo: "entrada", quantidade: qtdLote,
          custo_unitario: form.preco_custo || null, status_recebimento: "confirmada",
          lote: { numero_lote: loteInicial.numero_lote.trim(), data_validade: loteInicial.data_validade || undefined },
        });
      }
      setForm(formVazio(nichoSel.value)); setProdutoEditando(null); setCamposSugeridos(new Set()); setOrigemSugestao(null);
      setLoteInicial({ numero_lote: "", data_validade: "", quantidade: "" });
      setDespesasPct(""); setMargemDesejadaPct(""); setCalculadoraTocada(false);
      onSalvo?.();
    } finally {
      setSalvando(false);
    }
  }

  return {
    form, produtoEditando, camposSugeridos, origemSugestao, consultando, duplicado, salvando, loteInicial, sugestoesHistorico,
    despesasPct, margemDesejadaPct, divisorInvalido, margemRealPct, lucroUnidade, situacaoAtual,
    modalPrejuizoAberto, setModalPrejuizoAberto, forcarCriacaoPendente,
    sugestaoCusto, sugestaoFornecedor, carregandoSugestaoProduto, sugestaoMargem, carregandoSugestaoMargem,
    onChangeCusto, onChangeDespesasPct, onChangeMargemDesejadaPct, onChangeCampo, onChangeAtributo,
    garantirSugestaoHistorico, handleConsultarAvulso, salvarAvulso,
    onLoteChange: (campo: string, v: string) => setLoteInicial((l) => ({ ...l, [campo]: v })),
    onFecharDuplicado: () => setDuplicado(null),
    onAbrirExistente: async () => {
      if (!duplicado) return;
      const p = await buscarProdutoPorId(duplicado.id);
      if (p) { setProdutoEditando(p); setForm({ ...p, atributos_nicho: p.atributos_nicho || {} }); setCamposSugeridos(new Set()); setOrigemSugestao(null); }
      setDuplicado(null);
    },
  };
}

// ============================================================================
// CAMPOS COMUNS (input básico, select, campo de nicho dinâmico)
// ============================================================================
export function Campo({ label, value, onChange, tipo = "text", sugerido, lista, onFocus, emCard }: {
  label: string; value: any; onChange: (v: any) => void; tipo?: "text" | "number" | "date";
  sugerido?: boolean; lista?: string[]; onFocus?: () => void; emCard?: boolean;
}) {
  const { tokens } = useTemaPdv();
  const listId = useRef(`dl-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: sugerido ? AMBAR : emCard ? tokens.cardTexto : tokens.textoSecundario }}>
        {label} {sugerido && <Sparkles size={11} />}
      </label>
      <input
        type={tipo} value={value ?? ""} onFocus={onFocus} list={lista ? listId : undefined}
        onChange={(e) => onChange(tipo === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${sugerido ? "rgba(245,185,66,0.5)" : tokens.inputBorda}`, color: tokens.inputTexto }}
      />
      {lista && <datalist id={listId}>{lista.map((v, i) => <option key={i} value={v} />)}</datalist>}
    </div>
  );
}

export function CampoSelectSimples({ label, value, onChange, opcoes, sugerido, emCard }: { label: string; value: any; onChange: (v: any) => void; opcoes: { value: string; label: string }[]; sugerido?: boolean; emCard?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: sugerido ? AMBAR : emCard ? tokens.cardTexto : tokens.textoSecundario }}>{label} {sugerido && <Sparkles size={11} />}</label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${sugerido ? "rgba(245,185,66,0.5)" : tokens.inputBorda}`, color: tokens.inputTexto }}>
        <option value="">—</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function CamposDoSubNicho({ lang, campos, atributos, onChange, sugeridos, emCard }: {
  lang: Lang; campos: CampoNicho[]; atributos: Record<string, any>; onChange: (chave: string, v: any) => void; sugeridos?: Set<string>; emCard?: boolean;
}) {
  const { tokens } = useTemaPdv();
  if (campos.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: emCard ? tokens.cardTexto : tokens.acento }}>{t("camposEspecificos", lang)}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {campos.filter((c) => !c.dependeDe || !!atributos[c.dependeDe]).map((campo) => {
          const valor = atributos[campo.chave];
          const sugerido = sugeridos?.has(`attr:${campo.chave}`);
          if (campo.tipo === "boolean") {
            return (
              <label key={campo.chave} className="flex items-center gap-2 cursor-pointer select-none py-2">
                <input type="checkbox" checked={!!valor} onChange={(e) => onChange(campo.chave, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-xs font-semibold" style={{ color: emCard ? tokens.cardTexto : tokens.texto }}>{campo.label[lang]}</span>
              </label>
            );
          }
          if (campo.tipo === "select") {
            return <CampoSelectSimples key={campo.chave} label={campo.label[lang]} value={valor} onChange={(v) => onChange(campo.chave, v)}
              opcoes={(campo.opcoes || []).map((o) => ({ value: o.value, label: o.label[lang] }))} sugerido={sugerido} emCard={emCard} />;
          }
          return <Campo key={campo.chave} label={campo.label[lang]} value={valor} tipo={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"} onChange={(v) => onChange(campo.chave, v)} sugerido={sugerido} emCard={emCard} />;
        })}
      </div>
    </div>
  );
}

// ============================================================================
// AVISO DE DUPLICIDADE (nome idêntico, sem código de barras)
// ============================================================================
export function AvisoDuplicado({ lang, nome, onAbrirExistente, onCriarMesmoAssim, onFechar }: {
  lang: Lang; nome: string; onAbrirExistente: () => void; onCriarMesmoAssim: () => void; onFechar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(245,185,66,0.1)", border: "1px solid rgba(245,185,66,0.4)" }}>
      <p className="text-sm font-semibold mb-1" style={{ color: AMBAR }}>{t("nomeDuplicadoTitulo", lang)}</p>
      <p className="text-xs mb-3" style={{ color: tokens.texto }}>"{nome}"</p>
      <div className="flex gap-2 flex-wrap">
        <button onClick={onAbrirExistente} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,185,66,0.2)", color: AMBAR }}>{t("abrirExistente", lang)}</button>
        <button onClick={onCriarMesmoAssim} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>{t("criarMesmoAssim", lang)}</button>
        <button onClick={onFechar} className="px-3 py-2 rounded-lg text-xs" style={{ color: tokens.textoMuted }}>✕</button>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL DE CONFIRMAÇÃO — genérico (título/mensagem/valor em destaque/
// callbacks), pra servir futuras confirmações do PDV além desta.
// ============================================================================
export function ModalConfirmacao({ aberto, titulo, mensagem, valorDestaque, textoCancelar, textoConfirmar, onCancelar, onConfirmar }: {
  aberto: boolean; titulo: string; mensagem: string; valorDestaque?: string;
  textoCancelar: string; textoConfirmar: string; onCancelar: () => void; onConfirmar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm rounded-2xl p-5" style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}` }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
                <AlertTriangle size={20} style={{ color: "#f87171" }} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{titulo}</h3>
                <p className="text-xs mt-1" style={{ color: tokens.textoSecundario }}>{mensagem}</p>
              </div>
            </div>
            {valorDestaque && (
              <p className="text-lg font-black text-center py-2.5 mb-4 rounded-xl" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)" }}>
                {valorDestaque}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={onCancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ color: tokens.cardTexto, border: `1px solid ${tokens.cardTexto}`, opacity: 0.85 }}>
                {textoCancelar}
              </button>
              <button onClick={onConfirmar} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
                {textoConfirmar}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ASSISTENTE DA INTELIGÊNCIA DO AXIOMA — chat de ajuda contextual (Etapa 4).
// Sob demanda: nunca chama a API sozinho, só quando o lojista envia. Cada
// pergunta soma no contador de sessão (LIMITE_PERGUNTAS_ASSISTENTE) — o
// contador só sobe quando a pergunta de fato chegou à OpenAI (status "ok" ou
// "erro"), nunca em "nao_configurado" (nunca tentou) ou 429 (bloqueado antes
// de chegar na rota) — isso mede tentativa de custo real, não clique do botão.
// ============================================================================
type MensagemAssistente = { role: "user" | "assistant"; content: string };
type CampoContextoAssistente = { label: string; tipo?: string; preenchido: boolean; valor?: string };

// Etapa 5 — traduz o form atual (campos fixos + atributos_nicho do sub-nicho)
// numa lista estruturada {label, tipo, preenchido[, valor]} pro chat guiar
// campo a campo sem precisar de print. Só Nome e Categoria vão com valor —
// o resto é só um booleano (preenchido ou não), nunca o dado em si.
function montarCamposParaAssistente(args: {
  lang: Lang; ehServico: boolean; form: FormPdv; despesasPct: string; margemDesejadaPct: string;
  loteInicial: { numero_lote: string; data_validade: string; quantidade: string };
  emEdicao: boolean; camposSubNicho: CampoNicho[];
}): CampoContextoAssistente[] {
  const { lang, ehServico, form, despesasPct, margemDesejadaPct, loteInicial, emEdicao, camposSubNicho } = args;
  const atributos = form.atributos_nicho || {};
  const preenchido = (v: any) => v !== undefined && v !== null && v !== "" && v !== 0;
  const lista: CampoContextoAssistente[] = [];
  const add = (label: string, valor: any, comValor = false) => {
    const ok = preenchido(valor);
    lista.push({ label, preenchido: ok, valor: comValor && ok ? String(valor).slice(0, 80) : undefined });
  };

  if (!ehServico) add(t("campoCodigoBarras", lang), form.codigo_barras);
  add(t("campoNome", lang), form.nome, true);
  add(t("campoCategoria", lang), form.categoria, true);
  if (!ehServico) {
    add(t("campoMarca", lang), form.marca);
    add(t("campoUnidade", lang), form.unidade);
    add(t("campoEstoqueMinimo", lang), form.estoque_minimo);
    add(t("campoCustoCompra", lang), form.preco_custo);
    add(t("campoDespesasVariaveis", lang), despesasPct);
    add(t("campoMargemDesejada", lang), margemDesejadaPct);
  }
  add(t("campoPrecoVenda", lang), form.preco_venda);
  add(t("campoStatus", lang), form.status);

  for (const campo of camposSubNicho) {
    if (campo.dependeDe && !atributos[campo.dependeDe]) continue;
    lista.push({ label: campo.label[lang], tipo: campo.tipo, preenchido: preenchido(atributos[campo.chave]) });
  }

  if (!ehServico && !emEdicao && !!atributos[CHAVE_PERECIVEL]) {
    add(t("campoNumeroLote", lang), loteInicial.numero_lote);
    add(t("campoValidade", lang), loteInicial.data_validade);
    add(t("campoQuantidade", lang), loteInicial.quantidade);
  }

  return lista;
}

export function AssistenteAxioma({ lang, nichoLabel, categoriaLabel, subNichoLabel, tipo, form, despesasPct, margemDesejadaPct, loteInicial, emEdicao, camposSubNicho }: {
  lang: Lang; nichoLabel: string; categoriaLabel: string | null; subNichoLabel: string | null; tipo: "produto" | "servico";
  form: FormPdv; despesasPct: string; margemDesejadaPct: string;
  loteInicial: { numero_lote: string; data_validade: string; quantidade: string };
  emEdicao: boolean; camposSubNicho: CampoNicho[];
}) {
  const { tokens } = useTemaPdv();
  const [aberto, setAberto] = useState(false);
  const [historico, setHistorico] = useState<MensagemAssistente[]>([]);
  const [pergunta, setPergunta] = useState("");
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [contador, setContador] = useState(0);
  const limiteAtingido = contador >= LIMITE_PERGUNTAS_ASSISTENTE;

  async function enviar() {
    const texto = pergunta.trim();
    if (!texto || pensando || limiteAtingido) return;
    const historicoNoEnvio = historico;
    const campos = montarCamposParaAssistente({ lang, ehServico: tipo === "servico", form, despesasPct, margemDesejadaPct, loteInicial, emEdicao, camposSubNicho });
    setPergunta(""); setErro(null); setPensando(true);
    setHistorico((h) => [...h, { role: "user", content: texto }]);
    try {
      const resp = await fetch("/api/pdv/assistente-cadastro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, historico: historicoNoEnvio, nicho: nichoLabel, categoria: categoriaLabel, subNicho: subNichoLabel, tipo, idioma: lang, campos }),
      });
      if (!resp.ok) { setErro(resp.status === 429 ? t("assistenteLimiteRede", lang) : t("assistenteErro", lang)); return; }
      const dados = await resp.json();
      if (dados.status === "ok") {
        setContador((c) => c + 1);
        setHistorico((h) => [...h, { role: "assistant", content: dados.resposta }]);
      } else if (dados.status === "nao_configurado") {
        setErro(t("assistenteIndisponivel", lang));
      } else {
        setContador((c) => c + 1);
        setErro(t("assistenteErro", lang));
      }
    } catch {
      setErro(t("assistenteErro", lang));
    } finally {
      setPensando(false);
    }
  }

  function limparConversa() {
    setHistorico([]);
    setErro(null);
  }

  return (
    <>
      {!aberto && (
        <button onClick={() => setAberto(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 pl-4 pr-5 py-3.5 rounded-full text-sm font-bold text-white"
          style={{ background: VERDE_SUPORTE, boxShadow: `0 4px 24px ${VERDE_SUPORTE}80, 0 2px 8px rgba(0,0,0,0.25)` }}>
          <MessageCircle size={20} /> {t("assistenteBotao", lang)}
        </button>
      )}

      <AnimatePresence>
        {aberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed left-0 right-0 bottom-0 top-14 md:top-16 z-50 flex items-center justify-center p-3 sm:p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-2xl p-4 flex flex-col"
              style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}`, maxHeight: "100%", height: "min(640px, 100%)" }}>
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Image src="/logo-aitech.png" alt="Axioma" width={18} height={18} className="object-contain" />
                  <h3 className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{t("assistenteTitulo", lang)}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {historico.length > 0 && (
                    <button onClick={limparConversa} className="text-xs underline" style={{ color: tokens.textoMuted }}>
                      {t("assistenteLimparConversa", lang)}
                    </button>
                  )}
                  <button onClick={() => setAberto(false)} className="text-xs px-2 py-1" style={{ color: tokens.textoMuted }}>✕</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-3" style={{ minHeight: 220 }}>
                {historico.length === 0 && !pensando && (
                  <p className="text-xs" style={{ color: tokens.textoMuted }}>{t("assistenteVazio", lang)}</p>
                )}
                {historico.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="text-base px-3 py-2 rounded-lg max-w-[85%]"
                      style={m.role === "user"
                        ? { background: tokens.acaoBg, color: tokens.acaoTexto }
                        : { background: "#eef4ff", border: "1px solid #dbeafe", color: "#0f172a" }}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {pensando && <Loader2 className="animate-spin" size={14} style={{ color: tokens.textoMuted }} />}
              </div>

              {erro && <p className="text-xs mb-2" style={{ color: "#f87171" }}>{erro}</p>}
              {limiteAtingido && <p className="text-xs mb-2" style={{ color: AMBAR }}>{t("assistenteLimiteAtingido", lang)}</p>}

              <div className="flex gap-2 shrink-0">
                <input value={pergunta} onChange={(e) => setPergunta(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }}
                  disabled={pensando || limiteAtingido}
                  placeholder={t("assistentePlaceholder", lang)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs outline-none disabled:opacity-50"
                  style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}`, color: tokens.inputTexto }} />
                <button onClick={enviar} disabled={pensando || limiteAtingido || !pergunta.trim()}
                  className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-40 shrink-0"
                  style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
                  {pensando ? <Loader2 className="animate-spin" size={13} /> : t("assistenteEnviar", lang)}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================================================
// PRECIFICAÇÃO — custo, despesas%, margem desejada%, sugestão de preço e
// alerta de prejuízo. Só produto (nunca serviço). Cálculo vem inteiro do
// cfoCore (precoPorDivisor/margemReal/lucroPorUnidade/situacaoMargem).
// ============================================================================
function LinhaSugestao({ carregando, texto, onUsar, textoUsar }: { carregando?: boolean; texto: string; onUsar?: () => void; textoUsar?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center gap-2 text-xs">
      {carregando ? <Loader2 className="animate-spin shrink-0" size={12} style={{ color: tokens.textoMuted }} /> : <Sparkles className="shrink-0" size={12} style={{ color: AMBAR }} />}
      <span className="flex-1 min-w-0" style={{ color: tokens.textoSecundario }}>{texto}</span>
      {onUsar && <button onClick={onUsar} className="shrink-0 underline font-semibold" style={{ color: tokens.acento }}>{textoUsar}</button>}
    </div>
  );
}

function BlocoPrecificacao({
  lang, custo, despesasPct, margemDesejadaPct, divisorInvalido, margemRealPct, lucroUnidade, situacao,
  onChangeCusto, onChangeDespesasPct, onChangeMargemDesejadaPct,
  categoriaLabel, temProdutoSalvo, produtoTemFornecedor, sugestaoCusto, sugestaoFornecedor, carregandoSugestaoProduto, sugestaoMargem, carregandoSugestaoMargem,
}: {
  lang: Lang; custo: number | null | undefined; despesasPct: string; margemDesejadaPct: string;
  divisorInvalido: boolean; margemRealPct: number; lucroUnidade: number; situacao: SituacaoMargem | null;
  onChangeCusto: (v: any) => void; onChangeDespesasPct: (v: any) => void; onChangeMargemDesejadaPct: (v: any) => void;
  categoriaLabel: string | null; temProdutoSalvo: boolean; produtoTemFornecedor: boolean;
  sugestaoCusto: UltimaCompraProduto | null; sugestaoFornecedor: FornecedorComparativo | null; carregandoSugestaoProduto: boolean;
  sugestaoMargem: ItemRentabilidade | null; carregandoSugestaoMargem: boolean;
}) {
  const { tokens } = useTemaPdv();
  const temCusto = !!custo && custo > 0;
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: tokens.acento }}>{t("precificacaoTitulo", lang)}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Campo label={t("campoCustoCompra", lang)} tipo="number" value={custo} onChange={onChangeCusto} />
        <Campo label={t("campoDespesasVariaveis", lang)} tipo="number" value={despesasPct} onChange={onChangeDespesasPct} />
        <Campo label={t("campoMargemDesejada", lang)} tipo="number" value={margemDesejadaPct} onChange={onChangeMargemDesejadaPct} />
      </div>

      {(temProdutoSalvo || categoriaLabel) && (
        <div className="space-y-1.5">
          {temProdutoSalvo && (
            carregandoSugestaoProduto ? (
              <LinhaSugestao carregando texto={t("sugCustoCarregando", lang)} />
            ) : sugestaoCusto ? (
              <LinhaSugestao texto={t("sugCustoComDado", lang, { valor: moeda(sugestaoCusto.custoUnitario), data: dataCurta(sugestaoCusto.dataHora) })}
                onUsar={() => onChangeCusto(sugestaoCusto.custoUnitario)} textoUsar={t("usarEsteValor", lang)} />
            ) : (
              <LinhaSugestao texto={t("sugCustoSemDado", lang)} />
            )
          )}

          {categoriaLabel && (
            carregandoSugestaoMargem ? (
              <LinhaSugestao carregando texto={t("sugMargemCarregando", lang)} />
            ) : sugestaoMargem?.margem_media != null ? (
              <LinhaSugestao texto={t("sugMargemComDado", lang, { categoria: categoriaLabel, v: sugestaoMargem.margem_media.toFixed(1) })}
                onUsar={() => onChangeMargemDesejadaPct(sugestaoMargem.margem_media!.toFixed(1))} textoUsar={t("usarEsteValor", lang)} />
            ) : (
              <LinhaSugestao texto={t("sugMargemSemDado", lang)} />
            )
          )}

          {temProdutoSalvo && (
            carregandoSugestaoProduto ? (
              <LinhaSugestao carregando texto={t("sugFornecedorCarregando", lang)} />
            ) : sugestaoFornecedor ? (
              <LinhaSugestao texto={t("sugFornecedorComDado", lang, {
                fornecedor: sugestaoFornecedor.fornecedor_nome,
                valor: sugestaoFornecedor.preco_medio_compra != null ? moeda(sugestaoFornecedor.preco_medio_compra) : "—",
                n: String(sugestaoFornecedor.frequencia_entregas),
                data: sugestaoFornecedor.ultima_entrada ? dataCurta(sugestaoFornecedor.ultima_entrada) : "—",
              })} />
            ) : (
              <LinhaSugestao texto={t(produtoTemFornecedor ? "sugFornecedorSemDado" : "sugFornecedorSemVinculo", lang)} />
            )
          )}
        </div>
      )}

      {divisorInvalido && (
        <p className="text-xs" style={{ color: "#f87171" }}>{t("avisoDivisorInvalido", lang)}</p>
      )}

      {temCusto && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.textoMuted }}>{t("labelMargemReal", lang)}</p>
              <p className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{margemRealPct.toFixed(1)}%</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
              <p className="text-[10px] uppercase tracking-wide" style={{ color: tokens.textoMuted }}>{t("labelLucroUnidade", lang)}</p>
              <p className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{moeda(lucroUnidade)}</p>
            </div>
          </div>

          {situacao === "prejuizo" && (
            <div className="p-3 rounded-xl flex items-start gap-2.5" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)" }}>
              <AlertTriangle size={18} style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }} />
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: "#f87171" }}>{t("alertaPrejuizoTitulo", lang)}</p>
                <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.85 }}>{t("alertaPrejuizoTexto", lang, { v: moeda(Math.abs(lucroUnidade)) })}</p>
              </div>
            </div>
          )}
          {situacao === "apertada" && (
            <div className="p-3 rounded-xl flex items-start gap-2.5" style={{ background: "rgba(245,185,66,0.12)", border: "1px solid rgba(245,185,66,0.35)" }}>
              <AlertTriangle size={18} style={{ color: AMBAR, flexShrink: 0, marginTop: 1 }} />
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: AMBAR }}>{t("alertaMargemApertadaTitulo", lang)}</p>
                <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.85 }}>{t("alertaMargemApertadaTexto", lang, { v: margemRealPct.toFixed(1) })}</p>
              </div>
            </div>
          )}
          {situacao === "saudavel" && (
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#34d399" }}>
              <CheckCircle2 size={15} /> {t("alertaMargemSaudavel", lang, { v: margemRealPct.toFixed(1) })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================================
// FORMULÁRIO AVULSO — apresentação pura (recebe tudo via props). Usado por
// FormularioCadastroPdv abaixo, e continua sendo o formulário do Cadastro
// Único na página cheia.
// ============================================================================
export function FormularioAvulso({
  lang, nichoSel, subNichoSel, form, produtoEditando, camposSugeridos, origemSugestao, consultando, duplicado, salvando, loteInicial,
  sugestoesHistorico, onChangeCampo, onChangeAtributo, onConsultar, onGarantirHistorico, onSalvar, onCriarMesmoAssim, onAbrirExistente, onLoteChange, onFecharDuplicado,
  despesasPct, margemDesejadaPct, divisorInvalido, margemRealPct, lucroUnidade, situacaoAtual,
  onChangeCusto, onChangeDespesasPct, onChangeMargemDesejadaPct,
  categoriaLabel, temProdutoSalvo, produtoTemFornecedor, sugestaoCusto, sugestaoFornecedor, carregandoSugestaoProduto, sugestaoMargem, carregandoSugestaoMargem,
}: {
  lang: Lang; nichoSel: NichoPdvDef; subNichoSel: SubNichoPdv | null; form: FormPdv; produtoEditando: Produto | null;
  camposSugeridos: Set<string>; origemSugestao: OrigemSugestao; consultando: boolean; duplicado: { id: string; nome: string } | null; salvando: boolean;
  loteInicial: { numero_lote: string; data_validade: string; quantidade: string };
  sugestoesHistorico: Record<string, string[]>;
  onChangeCampo: (c: string, v: any) => void; onChangeAtributo: (c: string, v: any) => void;
  onConsultar: () => void; onGarantirHistorico: (c: "nome" | "marca" | "categoria") => void;
  onSalvar: () => void; onCriarMesmoAssim: () => void; onAbrirExistente: () => void; onLoteChange: (c: string, v: string) => void; onFecharDuplicado: () => void;
  despesasPct: string; margemDesejadaPct: string; divisorInvalido: boolean; margemRealPct: number; lucroUnidade: number; situacaoAtual: SituacaoMargem | null;
  onChangeCusto: (v: any) => void; onChangeDespesasPct: (v: any) => void; onChangeMargemDesejadaPct: (v: any) => void;
  categoriaLabel: string | null; temProdutoSalvo: boolean; produtoTemFornecedor: boolean;
  sugestaoCusto: UltimaCompraProduto | null; sugestaoFornecedor: FornecedorComparativo | null; carregandoSugestaoProduto: boolean;
  sugestaoMargem: ItemRentabilidade | null; carregandoSugestaoMargem: boolean;
}) {
  const { tokens } = useTemaPdv();
  const ehServico = subNichoEhServico(nichoSel, subNichoSel);
  const perecivel = !!(form.atributos_nicho || {})[CHAVE_PERECIVEL];

  return (
    <div className="space-y-4">
      {duplicado && <AvisoDuplicado lang={lang} nome={duplicado.nome} onAbrirExistente={onAbrirExistente} onCriarMesmoAssim={onCriarMesmoAssim} onFechar={onFecharDuplicado} />}

      {origemSugestao === "ia" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(245,185,66,0.1)", color: AMBAR }}>
          <Sparkles size={13} /> {t("sugeridoIA", lang)}
        </div>
      )}
      {origemSugestao === "cosmos" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: tokens.acentoSuaveBg, color: tokens.acento }}>
          <CheckCircle2 size={13} /> {t("sugeridoCosmos", lang)}
        </div>
      )}

      {!ehServico && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Campo label={t("campoCodigoBarras", lang)} value={form.codigo_barras} onChange={(v) => onChangeCampo("codigo_barras", v)} />
          </div>
          <button onClick={onConsultar} disabled={consultando || !form.codigo_barras}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-40"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {consultando ? <Loader2 className="animate-spin" size={15} /> : <ScanBarcode size={15} />} {t("consultar", lang)}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label={t("campoNome", lang)} value={form.nome} onChange={(v) => onChangeCampo("nome", v)}
          sugerido={camposSugeridos.has("nome")} lista={buscarSugestoesSemente(subNichoSel?.value, form.nome || "", sugestoesHistorico.nome || [])} onFocus={() => onGarantirHistorico("nome")} />
        <Campo label={t("campoCategoria", lang)} value={form.categoria} onChange={(v) => onChangeCampo("categoria", v)}
          sugerido={camposSugeridos.has("categoria")} lista={sugestoesHistorico.categoria} onFocus={() => onGarantirHistorico("categoria")} />
      </div>

      {!ehServico && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Campo label={t("campoMarca", lang)} value={form.marca} onChange={(v) => onChangeCampo("marca", v)}
            sugerido={camposSugeridos.has("marca")} lista={sugestoesHistorico.marca} onFocus={() => onGarantirHistorico("marca")} />
          <Campo label={t("campoUnidade", lang)} value={form.unidade} onChange={(v) => onChangeCampo("unidade", v)} />
          <Campo label={t("campoEstoqueMinimo", lang)} tipo="number" value={form.estoque_minimo} onChange={(v) => onChangeCampo("estoque_minimo", v)} />
        </div>
      )}

      {!ehServico && (
        <BlocoPrecificacao
          lang={lang} custo={form.preco_custo} despesasPct={despesasPct} margemDesejadaPct={margemDesejadaPct}
          divisorInvalido={divisorInvalido} margemRealPct={margemRealPct} lucroUnidade={lucroUnidade} situacao={situacaoAtual}
          onChangeCusto={onChangeCusto} onChangeDespesasPct={onChangeDespesasPct} onChangeMargemDesejadaPct={onChangeMargemDesejadaPct}
          categoriaLabel={categoriaLabel} temProdutoSalvo={temProdutoSalvo} produtoTemFornecedor={produtoTemFornecedor}
          sugestaoCusto={sugestaoCusto} sugestaoFornecedor={sugestaoFornecedor} carregandoSugestaoProduto={carregandoSugestaoProduto}
          sugestaoMargem={sugestaoMargem} carregandoSugestaoMargem={carregandoSugestaoMargem}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label={t("campoPrecoVenda", lang)} tipo="number" value={form.preco_venda} onChange={(v) => onChangeCampo("preco_venda", v)} sugerido={camposSugeridos.has("preco_venda")} />
        <CampoSelectSimples label={t("campoStatus", lang)} value={form.status} onChange={(v) => onChangeCampo("status", v)}
          opcoes={[{ value: "ativo", label: t("statusAtivo", lang) }, { value: "inativo", label: t("statusInativo", lang) }]} />
      </div>

      <CamposDoSubNicho lang={lang} campos={subNichoSel?.campos || []} atributos={form.atributos_nicho || {}} onChange={onChangeAtributo} sugeridos={camposSugeridos} />

      {!ehServico && !produtoEditando && perecivel && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tokens.acento }}>{t("blocoLote", lang)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Campo label={t("campoNumeroLote", lang)} value={loteInicial.numero_lote} onChange={(v) => onLoteChange("numero_lote", v)} />
            <Campo label={t("campoValidade", lang)} tipo="date" value={loteInicial.data_validade} onChange={(v) => onLoteChange("data_validade", v)} />
            <Campo label={t("campoQuantidade", lang)} tipo="number" value={loteInicial.quantidade} onChange={(v) => onLoteChange("quantidade", v)} />
          </div>
        </div>
      )}

      <button onClick={onSalvar} disabled={salvando}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {salvando ? t("salvando", lang) : t("salvar", lang)}
      </button>
    </div>
  );
}

// ============================================================================
// COMPONENTE COMPARTILHADO — Modal de prejuízo + Assistente Axioma +
// Formulário Avulso, juntos. É isso que a página /pdv/cadastro e o nível
// "produtos" de pdv/page.tsx renderizam, cada um passando seu próprio
// nicho/categoria/sub-nicho já resolvidos e seu próprio mostrarToast/onSalvo.
// ============================================================================
export function FormularioCadastroPdv({
  empresaId, userId, lang, nichoSel, categoriaSel, subNichoSel, produtoParaEditar, cargaProgramaticaRef, mostrarToast, onSalvo,
}: {
  empresaId: string | null; userId: string | null; lang: Lang;
  nichoSel: NichoPdvDef; categoriaSel: CategoriaPdv | null; subNichoSel: SubNichoPdv | null;
  produtoParaEditar?: Produto | null; cargaProgramaticaRef?: React.MutableRefObject<boolean>;
  mostrarToast: (msg: string, tipo?: "ok" | "erro" | "info") => void; onSalvo?: () => void;
}) {
  const c = useCadastroProdutoPdv({ empresaId, userId, lang, nichoSel, categoriaSel, subNichoSel, produtoParaEditar, cargaProgramaticaRef, mostrarToast, onSalvo });

  return (
    <>
      <ModalConfirmacao
        aberto={c.modalPrejuizoAberto}
        titulo={t("confirmarPrejuizoTitulo", lang)}
        mensagem={t("confirmarPrejuizoTexto", lang)}
        valorDestaque={t("confirmarPrejuizoValor", lang, { v: moeda(Math.abs(c.lucroUnidade)) })}
        textoCancelar={t("btnCancelar", lang)}
        textoConfirmar={t("btnSalvarMesmoAssim", lang)}
        onCancelar={() => c.setModalPrejuizoAberto(false)}
        onConfirmar={() => { c.setModalPrejuizoAberto(false); c.salvarAvulso(c.forcarCriacaoPendente, true); }}
      />

      <AssistenteAxioma
        lang={lang} nichoLabel={nichoSel.label[lang]} categoriaLabel={categoriaSel?.label[lang] || null}
        subNichoLabel={subNichoSel?.label[lang] || null} tipo={subNichoEhServico(nichoSel, subNichoSel) ? "servico" : "produto"}
        form={c.form} despesasPct={c.despesasPct} margemDesejadaPct={c.margemDesejadaPct} loteInicial={c.loteInicial}
        emEdicao={!!c.produtoEditando} camposSubNicho={subNichoSel?.campos || []}
      />

      <FormularioAvulso
        lang={lang} nichoSel={nichoSel} subNichoSel={subNichoSel}
        form={c.form} produtoEditando={c.produtoEditando} camposSugeridos={c.camposSugeridos} origemSugestao={c.origemSugestao}
        consultando={c.consultando} duplicado={c.duplicado} salvando={c.salvando} loteInicial={c.loteInicial}
        sugestoesHistorico={c.sugestoesHistorico}
        onChangeCampo={c.onChangeCampo} onChangeAtributo={c.onChangeAtributo}
        onConsultar={c.handleConsultarAvulso} onGarantirHistorico={c.garantirSugestaoHistorico}
        onSalvar={() => c.salvarAvulso(false)} onCriarMesmoAssim={() => c.salvarAvulso(true)}
        onAbrirExistente={c.onAbrirExistente}
        onLoteChange={c.onLoteChange} onFecharDuplicado={c.onFecharDuplicado}
        despesasPct={c.despesasPct} margemDesejadaPct={c.margemDesejadaPct} divisorInvalido={c.divisorInvalido}
        margemRealPct={c.margemRealPct} lucroUnidade={c.lucroUnidade} situacaoAtual={c.situacaoAtual}
        onChangeCusto={c.onChangeCusto} onChangeDespesasPct={c.onChangeDespesasPct} onChangeMargemDesejadaPct={c.onChangeMargemDesejadaPct}
        categoriaLabel={categoriaSel?.label[lang] || null} temProdutoSalvo={!!c.produtoEditando} produtoTemFornecedor={!!c.produtoEditando?.fornecedor_id}
        sugestaoCusto={c.sugestaoCusto} sugestaoFornecedor={c.sugestaoFornecedor} carregandoSugestaoProduto={c.carregandoSugestaoProduto}
        sugestaoMargem={c.sugestaoMargem} carregandoSugestaoMargem={c.carregandoSugestaoMargem}
      />
    </>
  );
}
