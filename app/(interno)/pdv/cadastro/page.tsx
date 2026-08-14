"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScanBarcode, Loader2, Trash2, ExternalLink, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { precoPorDivisor, margemReal, lucroPorUnidade, situacaoMargem, type SituacaoMargem } from "../../../../lib/cfoCore";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import {
  type Produto, criarProduto, atualizarProduto, excluirProduto, buscarProdutoPorCodigo, buscarProdutoPorId,
  criarMovimentacao, consultarEan, type ConsultaEanResposta,
  buscarUltimaCompraProduto, type UltimaCompraProduto,
  carregarRentabilidadePorCategoria, type ItemRentabilidade,
  carregarComparativoFornecedores, type FornecedorComparativo,
} from "../../../../lib/estoqueHelpers";
import { CHAVE_PERECIVEL, type CampoNicho } from "../../../../lib/categoriaInteligente";
import { buscarSugestoesColuna } from "../../../../lib/sugestaoInteligente";
import { NICHOS_PDV, type NichoPdvDef, type CategoriaPdv, type SubNichoPdv, subNichoEhServico } from "../../../../lib/pdvCatalogoTaxonomia";
import { consultarIA, verificarNomeDuplicado } from "../../../../lib/pdvHelpers";
import { buscarSugestoesSemente } from "../../../../lib/pdvAutocompleteSemente";

// Botões de ação (Salvar/Consultar) usam tokens.acaoBg/acaoTexto — verde só
// sobrevive no tema escuro (ver components/PdvLayout.tsx). Âmbar continua
// fixo nos dois temas: é cor de status (sugestão/alerta), não identidade.
const AMBAR = "#f5b942";

// Etapa 4 — teto de perguntas por sessão de cadastro (protege o crédito da
// OpenAI). Conta só perguntas que de fato chegaram à OpenAI (ver AssistenteAxioma).
const LIMITE_PERGUNTAS_ASSISTENTE = 10;

const txt = {
  titulo: { pt: "PDV — Cadastro", en: "POS — Registration", es: "PDV — Registro" },
  subtitulo: {
    pt: "Cadastro inteligente de produto ou serviço — o mínimo de digitação possível.",
    en: "Smart product/service registration — as little typing as possible.",
    es: "Registro inteligente de producto o servicio — el mínimo de escritura posible.",
  },
  voltarCatalogo: { pt: "Voltar ao Catálogo", en: "Back to Catalog", es: "Volver al Catálogo" },
  operadorTitulo: { pt: "PDV — Ponto de Venda", en: "POS — Point of Sale", es: "PDV — Punto de Venta" },
  operadorCorpo: { pt: "Em breve você vai poder vender por aqui. Volte mais tarde.", en: "Soon you'll be able to sell from here. Check back later.", es: "Pronto podrás vender desde aquí. Vuelve más tarde." },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },

  nicho: { pt: "Nicho", en: "Niche", es: "Nicho" },
  categoria: { pt: "Categoria", en: "Category", es: "Categoría" },
  subNicho: { pt: "Sub-nicho", en: "Sub-niche", es: "Sub-nicho" },
  selecione: { pt: "Selecione…", en: "Select…", es: "Seleccione…" },
  escolhaNicho: { pt: "Escolha um nicho, categoria e sub-nicho para começar.", en: "Choose a niche, category and sub-niche to start.", es: "Elija un nicho, categoría y sub-nicho para empezar." },

  abaAvulso: { pt: "Cadastro Único", en: "Single Registration", es: "Registro Único" },
  abaMassa: { pt: "Bipagem em Massa", en: "Bulk Scanning", es: "Escaneo en Masa" },
  massaIndisponivelServico: {
    pt: "Bipagem em massa é só para produto/misto (precisa de código de barras). Serviço não tem código — use o Cadastro Único.",
    en: "Bulk scanning is only for product/mixed niches (needs a barcode). Services have no barcode — use Single Registration.",
    es: "El escaneo en masa es solo para producto/mixto (necesita código de barras). Servicio no tiene código — use Registro Único.",
  },

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

  sugestaoAutomatica: { pt: "Sugestão automática", en: "Automatic suggestion", es: "Sugerencia automática" },
  sugeridoCosmos: { pt: "Preenchido pelo catálogo — confira", en: "Filled from catalog — please check", es: "Completado por el catálogo — revise" },
  sugeridoIA: { pt: "Sugestão automática — não confirmado, confira com atenção", en: "Automatic suggestion — unverified, please review carefully", es: "Sugerencia automática — sin confirmar, revise con atención" },
  buscarSugestaoIA: { pt: "Tentar sugestão automática", en: "Try automatic suggestion", es: "Intentar sugerencia automática" },
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

  bipeAqui: { pt: "Bipe ou digite o código de barras e pressione Enter", en: "Scan or type the barcode and press Enter", es: "Escanee o escriba el código de barras y presione Enter" },
  sessaoTitulo: { pt: "Salvos nesta sessão", en: "Saved this session", es: "Guardados en esta sesión" },
  sessaoVazia: { pt: "Nenhum item salvo ainda nesta sessão.", en: "No items saved yet this session.", es: "Ningún ítem guardado todavía en esta sesión." },
  desfazer: { pt: "Desfazer", en: "Undo", es: "Deshacer" },
  editar: { pt: "Editar", en: "Edit", es: "Editar" },
  toastDesfeito: { pt: "Desfeito: {nome}", en: "Undone: {nome}", es: "Deshecho: {nome}" },
  pular: { pt: "Pular", en: "Skip", es: "Saltar" },
  precoParaSalvar: { pt: "Confirme o preço para salvar automático", en: "Confirm the price to auto-save", es: "Confirme el precio para guardar automático" },
  faltaCompletar: { pt: "Falta completar — confira e salve", en: "Needs completing — review and save", es: "Falta completar — revise y guarde" },
  erroProdutoNaoEncontrado: {
    pt: "Produto não encontrado ou não pertence à sua empresa. Escolha o nicho abaixo para cadastrar um novo.",
    en: "Product not found or doesn't belong to your company. Choose a niche below to register a new one.",
    es: "Producto no encontrado o no pertenece a su empresa. Elija el nicho abajo para registrar uno nuevo.",
  },

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
  assistenteBotao: { pt: "Ajuda da inteligência do Axioma", en: "Help from Axioma's intelligence", es: "Ayuda de la inteligencia de Axioma" },
  assistenteTitulo: { pt: "Inteligência do Axioma", en: "Axioma's intelligence", es: "Inteligencia de Axioma" },
  assistenteVazio: {
    pt: "Pergunte sobre como preencher, margem do ramo ou boas práticas de cadastro.",
    en: "Ask about how to fill in fields, typical margins, or registration best practices.",
    es: "Pregunta sobre cómo completar, margen del rubro o buenas prácticas de registro.",
  },
  assistentePlaceholder: { pt: "Digite sua pergunta...", en: "Type your question...", es: "Escribe tu pregunta..." },
  assistenteEnviar: { pt: "Enviar", en: "Send", es: "Enviar" },
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

type Lang = Idioma;
function t(chave: keyof typeof txt, lang: Lang, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

type OrigemSugestao = "base" | "cosmos" | "ia" | null;
type FormPdv = Partial<Produto> & { atributos_nicho: Record<string, any> };

function formVazio(segmento?: string): FormPdv {
  return { unidade: "UN", status: "ativo", estoque_minimo: 0, atributos_nicho: {}, segmento };
}

// Categoria/sub-nicho não têm value estável fora da taxonomia curada (o
// Catálogo e o produto salvo só guardam o label) — casa por label nos 3
// idiomas. Usado tanto pra herdar da navegação (query params) quanto pra
// reabrir um produto existente em modo edição (produto.categoria/subcategoria).
function encontrarCategoriaPorLabel(nicho: NichoPdvDef, label: string): CategoriaPdv | null {
  return nicho.categorias.find((c) => [c.label.pt, c.label.en, c.label.es].some((l) => l.toLowerCase() === label.toLowerCase())) || null;
}
function encontrarSubNichoPorLabel(categoria: CategoriaPdv, label: string): SubNichoPdv | null {
  return categoria.subNichos.find((s) => [s.label.pt, s.label.en, s.label.es].some((l) => l.toLowerCase() === label.toLowerCase())) || null;
}

function preencherSeVazio<T extends Record<string, any>>(prev: T, sugeridos: Set<string>, campo: string, valor: any) {
  const vazio = prev[campo] === undefined || prev[campo] === null || prev[campo] === "" || prev[campo] === 0;
  const preenche = vazio && valor !== undefined && valor !== null && valor !== "";
  if (!preenche) return prev[campo];
  sugeridos.add(campo);
  return valor;
}

// useSearchParams exige Suspense no App Router (mesmo padrão já usado em
// components/PostHogPageView.tsx, aqui só que local à página).
export default function PDVCadastro() {
  return (
    <Suspense fallback={null}>
      <PDVCadastroInner />
    </Suspense>
  );
}

function PDVCadastroInner() {
  const { idioma } = useLanguage();
  const lang: Lang = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Lang;
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCarregandoPapel(false); return; }
      setUserId(user.id);
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      if (id) setPapel(await obterMeuPapel(id));
      setCarregandoPapel(false);
    })();
  }, [supabase]);

  // ---- Picker Nicho → Categoria → Sub-nicho (define modo + campos) ----
  const [nichoSel, setNichoSel] = useState<NichoPdvDef | null>(null);
  const [categoriaSel, setCategoriaSel] = useState<CategoriaPdv | null>(null);
  const [subNichoSel, setSubNichoSel] = useState<SubNichoPdv | null>(null);
  const [modo, setModo] = useState<"avulso" | "massa">("avulso");
  // true só durante uma carga programática (herdar da navegação ou editar por
  // id) — impede o efeito de reset (abaixo, na seção AVULSO) de apagar o que
  // acabamos de carregar só porque nichoSel/categoriaSel/subNichoSel mudaram.
  const cargaProgramaticaRef = useRef(false);

  function selecionarNicho(valor: string) {
    const n = NICHOS_PDV.find((x) => x.value === valor) || null;
    setNichoSel(n); setCategoriaSel(null); setSubNichoSel(null);
    if (n?.modo === "servico" && modo === "massa") setModo("avulso");
  }
  function selecionarCategoria(valor: string) {
    const c = nichoSel?.categorias.find((x) => x.value === valor) || null;
    setCategoriaSel(c); setSubNichoSel(null);
  }
  function selecionarSubNicho(valor: string) {
    const s = categoriaSel?.subNichos.find((x) => x.value === valor) || null;
    setSubNichoSel(s);
    if (subNichoEhServico(nichoSel, s) && modo === "massa") setModo("avulso");
  }

  const pronto = !!(nichoSel && (nichoSel.categorias.length === 0 || (categoriaSel && subNichoSel)));

  // ---- Herda nicho/categoria/sub-nicho da navegação (query params do link
  // "+ Novo Produto/Serviço" do Catálogo) — só na montagem. segmento casa por
  // value (slug estável); categoria/subnicho casam por label nos 3 idiomas,
  // porque é isso que o Catálogo manda (categoria "real"/não-curada não tem
  // value na taxonomia). Se um param não existir ou não bater com nada, essa
  // etapa fica como estava — o lojista escolhe manual, sem quebrar nada.
  const searchParams = useSearchParams();
  const [erroProdutoId, setErroProdutoId] = useState<string | null>(null);
  useEffect(() => {
    if (searchParams.get("id")) return; // edição por id tem o próprio efeito, mais abaixo — não disputa com este
    const segmentoParam = searchParams.get("segmento");
    if (!segmentoParam) return;
    const nicho = NICHOS_PDV.find((n) => n.value === segmentoParam);
    if (!nicho) return;
    cargaProgramaticaRef.current = true;
    setNichoSel(nicho);

    const categoriaParam = searchParams.get("categoria");
    if (!categoriaParam) return;
    const categoria = encontrarCategoriaPorLabel(nicho, categoriaParam);
    if (!categoria) return;
    setCategoriaSel(categoria);

    const subNichoParam = searchParams.get("subnicho");
    if (!subNichoParam) return;
    const sub = encontrarSubNichoPorLabel(categoria, subNichoParam);
    if (sub) setSubNichoSel(sub);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // CASCATA — camadas 1+2 (base própria + Cosmos), reaproveitadas sem mudança.
  // Camada 3 (IA) é função separada, chamada automática só no avulso.
  // ============================================================================
  async function rodarCascataBase(codigo: string): Promise<{ jaExiste: Produto | null; patch: Record<string, any>; sugeridos: Set<string>; origem: OrigemSugestao }> {
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

  async function rodarCamadaIA(codigo: string): Promise<{ patch: Record<string, any>; sugeridos: Set<string> }> {
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
  // AVULSO
  // ============================================================================
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
  // true só depois que o lojista mexe em Custo/Despesas%/Margem% — sem isso,
  // abrir um produto existente pra editar sobrescreveria o preço já salvo
  // com "custo ÷ 1" no instante em que a tela carrega (despesas/margem
  // sempre começam vazias, mesmo em produto já precificado).
  const [calculadoraTocada, setCalculadoraTocada] = useState(false);
  const [modalPrejuizoAberto, setModalPrejuizoAberto] = useState(false);
  const [forcarCriacaoPendente, setForcarCriacaoPendente] = useState(false);

  // ---- Sugestões inteligentes (Etapa 3) — só leitura de dados que já
  // existem (estoque_movimentacoes / views de rentabilidade e fornecedores).
  // Regra de ouro: sem histórico real, nunca inventa dado — cada uma tem
  // estado vazio honesto próprio, mostrado abaixo em BlocoPrecificacao.
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

  // ---- Edição por id (link "Editar" da lista do Catálogo) — carrega o
  // produto real, entra no MESMO modo produtoEditando já usado pelo fluxo de
  // bipagem (nome duplicado → "abrir existente"), só que por essa porta nova.
  // Confirma empresa_id do produto contra a empresa ativa (multi-tenant) —
  // nunca confia só no id da URL. Espera empresaId carregar primeiro.
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (!idParam || !empresaId) return;
    (async () => {
      const produto = await buscarProdutoPorId(idParam);
      if (!produto || produto.empresa_id !== empresaId) {
        setErroProdutoId(t("erroProdutoNaoEncontrado", lang));
        return;
      }
      const nicho = NICHOS_PDV.find((n) => n.value === produto.segmento) || null;
      cargaProgramaticaRef.current = true;
      setNichoSel(nicho);
      const categoria = nicho && produto.categoria ? encontrarCategoriaPorLabel(nicho, produto.categoria) : null;
      setCategoriaSel(categoria);
      const sub = categoria && produto.subcategoria ? encontrarSubNichoPorLabel(categoria, produto.subcategoria) : null;
      setSubNichoSel(sub);
      setProdutoEditando(produto);
      setForm({ ...produto, atributos_nicho: produto.atributos_nicho || {} });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, [empresaId]);

  // ---- Sugestão de Custo + Fornecedor (Etapa 3) — só produto já salvo
  // (produtoEditando), porque estoque_movimentacoes.produto_id e
  // produtos.fornecedor_id só existem depois do primeiro save. As duas
  // sugestões compartilham essa mesma leva de consulta, disparada junto.
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

  // ---- Sugestão de Margem por Categoria (Etapa 3) — roda em produto novo e
  // em edição, porque só depende da categoria escolhida, não de produto
  // salvo. Casa por label nos 3 idiomas (mesmo critério de encontrarCategoriaPorLabel),
  // porque produtos.categoria já salvos podem estar em qualquer um dos 3.
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
  // cfoCore (fonte única), nunca reimplementadas aqui. lucroPorUnidade já
  // desconta despesas variáveis; margemReal sozinha não vê despesa nenhuma.
  const custoNum = Number(form.preco_custo) || 0;
  const despesasFracao = (Number(despesasPct) || 0) / 100;
  const margemFracao = (Number(margemDesejadaPct) || 0) / 100;
  const divisorInvalido = despesasFracao + margemFracao >= 1;
  const precoSugerido = divisorInvalido ? 0 : precoPorDivisor(custoNum, [despesasFracao, margemFracao]);
  const margemRealPct = margemReal(Number(form.preco_venda) || 0, custoNum);
  const lucroUnidade = lucroPorUnidade(Number(form.preco_venda) || 0, custoNum, despesasFracao);
  const situacaoAtual: SituacaoMargem | null = custoNum > 0 ? situacaoMargem(lucroUnidade, margemRealPct) : null;

  // Só preenche "Preço de Venda" depois que o lojista mexeu na calculadora —
  // o campo continua 100% editável por cima a qualquer momento; só volta a
  // ser recalculado se ele mexer em Custo/Despesas/Margem de novo.
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
      const { jaExiste, patch, sugeridos, origem } = await rodarCascataBase(codigo);
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
        const ia = await rodarCamadaIA(codigo);
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
    } finally {
      setSalvando(false);
    }
  }

  // ============================================================================
  // BIPAGEM EM MASSA
  // ============================================================================
  type ItemSessao = { id: string; nome: string; precoVenda: number | null };
  const [sessaoItens, setSessaoItens] = useState<ItemSessao[]>([]);
  const [codigoAtual, setCodigoAtual] = useState("");
  const [processandoScan, setProcessandoScan] = useState(false);
  const [cartaoPendente, setCartaoPendente] = useState<FormPdv | null>(null);
  const [origemPendente, setOrigemPendente] = useState<OrigemSugestao>(null);
  const [camposSugeridosPendente, setCamposSugeridosPendente] = useState<Set<string>>(new Set());
  const [salvandoPendente, setSalvandoPendente] = useState(false);
  const [consultandoIaPendente, setConsultandoIaPendente] = useState(false);
  const inputCodigoRef = useRef<HTMLInputElement>(null);

  function refocarInput() {
    requestAnimationFrame(() => inputCodigoRef.current?.focus());
  }

  async function handleScan() {
    const codigo = codigoAtual.trim();
    if (!codigo || !empresaId || !userId || !nichoSel || processandoScan || cartaoPendente) return;
    setProcessandoScan(true);
    try {
      const { jaExiste, patch, sugeridos, origem } = await rodarCascataBase(codigo);
      if (jaExiste) {
        mostrarToast(t("produtoJaCadastrado", lang) + `: ${jaExiste.nome}`, "info");
        setCodigoAtual(""); return;
      }

      const tentativo: FormPdv = {
        ...formVazio(nichoSel.value),
        codigo_barras: codigo,
        categoria: categoriaSel?.label[lang], subcategoria: subNichoSel?.label[lang],
        ...patch,
      };
      // CRITÉRIO ESTRITO (Exigência 1/3): só salva sozinho com nome + categoria +
      // preço de venda preenchidos e origem NUNCA "ia" (palpite não vira dado
      // sozinho). preco_venda nunca vem de cascata nenhuma (Cosmos só dá preço
      // MÉDIO NACIONAL → preco_sugerido, nunca o preço real desta loja) — então
      // na prática isso quase sempre pausa pro operador confirmar o preço, que é
      // exatamente a única informação que nenhuma cascata pode adivinhar por ele.
      const completo = !!(tentativo.nome && tentativo.categoria && tentativo.preco_venda);
      if (completo && origem !== "ia") {
        const { id, erro } = await criarProduto(empresaId, userId, { ...tentativo, controla_estoque: true });
        if (erro) {
          setCartaoPendente(tentativo); setOrigemPendente(origem); setCamposSugeridosPendente(sugeridos);
        } else {
          setSessaoItens((s) => [{ id: id!, nome: tentativo.nome!, precoVenda: tentativo.preco_venda ?? null }, ...s]);
          mostrarToast(t("toastSalvo", lang, { nome: tentativo.nome! }));
        }
        setCodigoAtual("");
      } else {
        setCartaoPendente(tentativo); setOrigemPendente(origem); setCamposSugeridosPendente(sugeridos);
      }
    } finally {
      setProcessandoScan(false);
      refocarInput();
    }
  }

  function onChangeCartaoPendente(campo: string, valor: any) {
    setCartaoPendente((f) => (f ? { ...f, [campo]: valor } : f));
    setCamposSugeridosPendente((s) => { if (!s.has(campo)) return s; const n = new Set(s); n.delete(campo); return n; });
  }

  async function dispararIaPendente() {
    if (!cartaoPendente?.codigo_barras || consultandoIaPendente) return;
    setConsultandoIaPendente(true);
    try {
      const ia = await rodarCamadaIA(cartaoPendente.codigo_barras);
      if (ia.sugeridos.size > 0) {
        setCartaoPendente((f) => (f ? { ...f, ...ia.patch } : f));
        setCamposSugeridosPendente((s) => new Set([...s, ...ia.sugeridos]));
        setOrigemPendente("ia");
      } else {
        mostrarToast(t("nenhumaSugestao", lang), "info");
      }
    } finally {
      setConsultandoIaPendente(false);
    }
  }

  async function salvarCartaoPendente() {
    if (!cartaoPendente || !empresaId || !userId || !nichoSel) return;
    if (!cartaoPendente.nome?.trim()) { mostrarToast(t("toastNomeObrigatorio", lang), "erro"); return; }
    setSalvandoPendente(true);
    try {
      const { id, erro } = await criarProduto(empresaId, userId, { ...cartaoPendente, controla_estoque: true });
      if (erro) { mostrarToast(erro, "erro"); return; }
      setSessaoItens((s) => [{ id: id!, nome: cartaoPendente.nome!, precoVenda: cartaoPendente.preco_venda ?? null }, ...s]);
      mostrarToast(t("toastSalvo", lang, { nome: cartaoPendente.nome! }));
      setCartaoPendente(null); setOrigemPendente(null); setCamposSugeridosPendente(new Set()); setCodigoAtual("");
      refocarInput();
    } finally {
      setSalvandoPendente(false);
    }
  }

  function pularCartaoPendente() {
    setCartaoPendente(null); setOrigemPendente(null); setCamposSugeridosPendente(new Set()); setCodigoAtual("");
    refocarInput();
  }

  async function desfazerItemSessao(item: ItemSessao) {
    const { erro } = await excluirProduto(item.id);
    if (erro) { mostrarToast(erro, "erro"); return; }
    setSessaoItens((s) => s.filter((x) => x.id !== item.id));
    mostrarToast(t("toastDesfeito", lang, { nome: item.nome }), "info");
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  if (carregandoPapel) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (papel === "operador") {
    return (
      <PdvLayout titulo={t("operadorTitulo", lang)} subtitulo="">
        <AvisoOperador lang={lang} />
      </PdvLayout>
    );
  }

  // Correção 2: título grande reflete o caminho escolhido (nicho > categoria >
  // sub-nicho), mesmo padrão do Catálogo — antes ficava sempre "PDV — Cadastro".
  const tituloCadastro = subNichoSel?.label[lang] || categoriaSel?.label[lang] || nichoSel?.label[lang] || t("titulo", lang);
  const subtituloCadastro = [nichoSel?.label[lang], categoriaSel?.label[lang], subNichoSel?.label[lang]].filter(Boolean).join(" › ") || t("subtitulo", lang);

  return (
    <PdvLayout titulo={tituloCadastro} subtitulo={subtituloCadastro} voltarPara="/pdv">
      {toast && <ToastPdv msg={toast.msg} tipo={toast.tipo} />}
      {erroProdutoId && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>
          {erroProdutoId}
        </div>
      )}
      <ModalConfirmacao
        aberto={modalPrejuizoAberto}
        titulo={t("confirmarPrejuizoTitulo", lang)}
        mensagem={t("confirmarPrejuizoTexto", lang)}
        valorDestaque={t("confirmarPrejuizoValor", lang, { v: moeda(Math.abs(lucroUnidade)) })}
        textoCancelar={t("btnCancelar", lang)}
        textoConfirmar={t("btnSalvarMesmoAssim", lang)}
        onCancelar={() => setModalPrejuizoAberto(false)}
        onConfirmar={() => { setModalPrejuizoAberto(false); salvarAvulso(forcarCriacaoPendente, true); }}
      />

      <SeletorNicho lang={lang} nichoSel={nichoSel} categoriaSel={categoriaSel} subNichoSel={subNichoSel}
        onNicho={selecionarNicho} onCategoria={selecionarCategoria} onSubNicho={selecionarSubNicho} />

      {!pronto ? (
        <TextoEscolhaNicho lang={lang} />
      ) : (
        <>
          <div className="flex gap-2 mb-5 mt-4">
            <AbaBotao ativo={modo === "avulso"} onClick={() => setModo("avulso")} texto={t("abaAvulso", lang)} />
            <AbaBotao ativo={modo === "massa"} onClick={() => !subNichoEhServico(nichoSel, subNichoSel) && setModo("massa")} texto={t("abaMassa", lang)} desabilitado={subNichoEhServico(nichoSel, subNichoSel)} />
          </div>

          <AssistenteAxioma
            lang={lang} nichoLabel={nichoSel!.label[lang]} categoriaLabel={categoriaSel?.label[lang] || null}
            subNichoLabel={subNichoSel?.label[lang] || null} tipo={subNichoEhServico(nichoSel, subNichoSel) ? "servico" : "produto"}
          />

          {modo === "massa" && subNichoEhServico(nichoSel, subNichoSel) && (
            <p className="text-xs mb-4" style={{ color: AMBAR }}>{t("massaIndisponivelServico", lang)}</p>
          )}

          {modo === "avulso" && (
            <FormularioAvulso
              lang={lang} nichoSel={nichoSel!} subNichoSel={subNichoSel}
              form={form} produtoEditando={produtoEditando} camposSugeridos={camposSugeridos} origemSugestao={origemSugestao}
              consultando={consultando} duplicado={duplicado} salvando={salvando} loteInicial={loteInicial}
              sugestoesHistorico={sugestoesHistorico}
              onChangeCampo={onChangeCampo} onChangeAtributo={onChangeAtributo}
              onConsultar={handleConsultarAvulso} onGarantirHistorico={garantirSugestaoHistorico}
              onSalvar={() => salvarAvulso(false)} onCriarMesmoAssim={() => salvarAvulso(true)}
              onAbrirExistente={async () => {
                if (!duplicado) return;
                const p = await buscarProdutoPorId(duplicado.id);
                if (p) { setProdutoEditando(p); setForm({ ...p, atributos_nicho: p.atributos_nicho || {} }); setCamposSugeridos(new Set()); setOrigemSugestao(null); }
                setDuplicado(null);
              }}
              onLoteChange={(campo, v) => setLoteInicial((l) => ({ ...l, [campo]: v }))}
              onFecharDuplicado={() => setDuplicado(null)}
              despesasPct={despesasPct} margemDesejadaPct={margemDesejadaPct} divisorInvalido={divisorInvalido}
              margemRealPct={margemRealPct} lucroUnidade={lucroUnidade} situacaoAtual={situacaoAtual}
              onChangeCusto={onChangeCusto} onChangeDespesasPct={onChangeDespesasPct} onChangeMargemDesejadaPct={onChangeMargemDesejadaPct}
              categoriaLabel={categoriaSel?.label[lang] || null} temProdutoSalvo={!!produtoEditando} produtoTemFornecedor={!!produtoEditando?.fornecedor_id}
              sugestaoCusto={sugestaoCusto} sugestaoFornecedor={sugestaoFornecedor} carregandoSugestaoProduto={carregandoSugestaoProduto}
              sugestaoMargem={sugestaoMargem} carregandoSugestaoMargem={carregandoSugestaoMargem}
            />
          )}

          {modo === "massa" && !subNichoEhServico(nichoSel, subNichoSel) && (
            <BipagemMassa
              lang={lang} subNichoSel={subNichoSel}
              codigoAtual={codigoAtual} onCodigoChange={setCodigoAtual} onScan={handleScan}
              processando={processandoScan} inputRef={inputCodigoRef}
              cartaoPendente={cartaoPendente} origemPendente={origemPendente} camposSugeridosPendente={camposSugeridosPendente}
              consultandoIa={consultandoIaPendente} salvandoPendente={salvandoPendente}
              onChangeCartao={onChangeCartaoPendente} onChangeAtributoCartao={(chave, v) => setCartaoPendente((f) => (f ? { ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [chave]: v } } : f))}
              onDispararIa={dispararIaPendente} onSalvarPendente={salvarCartaoPendente} onPular={pularCartaoPendente}
              sessaoItens={sessaoItens} onDesfazer={desfazerItemSessao}
            />
          )}
        </>
      )}
    </PdvLayout>
  );
}

function EstadoCarregando({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} /><span className="text-sm">{t("carregando", lang)}</span>
    </div>
  );
}

function AvisoOperador({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <p className="text-sm text-center max-w-md" style={{ color: tokens.textoMuted }}>{t("operadorCorpo", lang)}</p>
    </div>
  );
}

function ToastPdv({ msg, tipo }: { msg: string; tipo: "ok" | "erro" | "info" }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
      style={{
        background: tipo === "erro" ? "rgba(239,68,68,0.95)" : tipo === "info" ? "rgba(30,41,59,0.95)" : tokens.acaoBg,
        color: tipo === "ok" ? tokens.acaoTexto : "#fff",
      }}>
      {msg}
    </div>
  );
}

// ============================================================================
// SELETOR NICHO → CATEGORIA → SUB-NICHO
// ============================================================================
function SeletorNicho({ lang, nichoSel, categoriaSel, subNichoSel, onNicho, onCategoria, onSubNicho }: {
  lang: Lang; nichoSel: NichoPdvDef | null; categoriaSel: CategoriaPdv | null; subNichoSel: SubNichoPdv | null;
  onNicho: (v: string) => void; onCategoria: (v: string) => void; onSubNicho: (v: string) => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <Selecao label={t("nicho", lang)} value={nichoSel?.value || ""} onChange={onNicho}
        opcoes={NICHOS_PDV.map((n) => ({ value: n.value, label: n.label[lang] }))} />
      <Selecao label={t("categoria", lang)} value={categoriaSel?.value || ""} onChange={onCategoria}
        opcoes={(nichoSel?.categorias || []).map((c) => ({ value: c.value, label: c.label[lang] }))} desabilitado={!nichoSel || nichoSel.categorias.length === 0} />
      <Selecao label={t("subNicho", lang)} value={subNichoSel?.value || ""} onChange={onSubNicho}
        opcoes={(categoriaSel?.subNichos || []).map((s) => ({ value: s.value, label: s.label[lang] }))} desabilitado={!categoriaSel} />
    </div>
  );
}

function TextoEscolhaNicho({ lang }: { lang: Lang }) {
  const { tokens } = useTemaPdv();
  return <p className="text-sm text-center py-10" style={{ color: tokens.textoSecundario }}>{t("escolhaNicho", lang)}</p>;
}

function Selecao({ label, value, onChange, opcoes, desabilitado }: { label: string; value: string; onChange: (v: string) => void; opcoes: { value: string; label: string }[]; desabilitado?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.textoSecundario }}>{label}</label>
      <select value={value} disabled={desabilitado} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm disabled:opacity-40"
        style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.inputTexto }}>
        <option value="">—</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function AbaBotao({ ativo, onClick, texto, desabilitado }: { ativo: boolean; onClick: () => void; texto: string; desabilitado?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <button onClick={onClick} disabled={desabilitado}
      className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-30"
      style={{
        background: ativo ? tokens.acaoBg : tokens.cardBg,
        color: ativo ? tokens.acaoTexto : tokens.cardTexto,
        border: `1px solid ${ativo ? tokens.acaoBg : tokens.cardBorda}`,
        opacity: ativo ? 1 : 0.75,
      }}>
      {texto}
    </button>
  );
}

// ============================================================================
// CAMPOS COMUNS (input básico, select, campo de nicho dinâmico)
// ============================================================================
function Campo({ label, value, onChange, tipo = "text", sugerido, lista, onFocus, emCard }: {
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

function CampoSelectSimples({ label, value, onChange, opcoes, sugerido, emCard }: { label: string; value: any; onChange: (v: any) => void; opcoes: { value: string; label: string }[]; sugerido?: boolean; emCard?: boolean }) {
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

function CamposDoSubNicho({ lang, campos, atributos, onChange, sugeridos, emCard }: {
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
function AvisoDuplicado({ lang, nome, onAbrirExistente, onCriarMesmoAssim, onFechar }: {
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
function ModalConfirmacao({ aberto, titulo, mensagem, valorDestaque, textoCancelar, textoConfirmar, onCancelar, onConfirmar }: {
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

function AssistenteAxioma({ lang, nichoLabel, categoriaLabel, subNichoLabel, tipo }: {
  lang: Lang; nichoLabel: string; categoriaLabel: string | null; subNichoLabel: string | null; tipo: "produto" | "servico";
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
    setPergunta(""); setErro(null); setPensando(true);
    setHistorico((h) => [...h, { role: "user", content: texto }]);
    try {
      const resp = await fetch("/api/pdv/assistente-cadastro", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: texto, historico: historicoNoEnvio, nicho: nichoLabel, categoria: categoriaLabel, subNicho: subNichoLabel, tipo, idioma: lang }),
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

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold mb-4"
        style={{ background: tokens.acentoSuaveBg, color: tokens.acento }}>
        <Sparkles size={13} /> {t("assistenteBotao", lang)}
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl p-4 flex flex-col"
              style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}`, maxHeight: "80vh" }}>
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={15} style={{ color: tokens.acento }} />
                  <h3 className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{t("assistenteTitulo", lang)}</h3>
                </div>
                <button onClick={() => setAberto(false)} className="text-xs px-2 py-1" style={{ color: tokens.textoMuted }}>✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 mb-3" style={{ minHeight: 80 }}>
                {historico.length === 0 && !pensando && (
                  <p className="text-xs" style={{ color: tokens.textoMuted }}>{t("assistenteVazio", lang)}</p>
                )}
                {historico.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="text-xs px-3 py-2 rounded-lg max-w-[85%]"
                      style={m.role === "user"
                        ? { background: tokens.acaoBg, color: tokens.acaoTexto }
                        : { background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
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
// FORMULÁRIO AVULSO
// ============================================================================
function FormularioAvulso({
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
// PRECIFICAÇÃO — custo, despesas%, margem desejada%, sugestão de preço e
// alerta de prejuízo. Só produto (nunca serviço — o chamador já filtra com
// !ehServico). Cálculo vem inteiro do cfoCore (precoPorDivisor/margemReal/
// lucroPorUnidade/situacaoMargem) — aqui só monta a tela.
// ============================================================================
// Uma linha por sugestão — ícone Sparkles (achou dado) ou Loader2
// (carregando), texto e botão "Usar" opcional. Sem cor de status (o dado
// ainda não foi aplicado, então não é nem alerta nem confirmação).
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
// BIPAGEM EM MASSA
// ============================================================================
function BipagemMassa({
  lang, subNichoSel, codigoAtual, onCodigoChange, onScan, processando, inputRef,
  cartaoPendente, origemPendente, camposSugeridosPendente, consultandoIa, salvandoPendente,
  onChangeCartao, onChangeAtributoCartao, onDispararIa, onSalvarPendente, onPular, sessaoItens, onDesfazer,
}: {
  lang: Lang; subNichoSel: SubNichoPdv | null; codigoAtual: string; onCodigoChange: (v: string) => void; onScan: () => void;
  processando: boolean; inputRef: React.RefObject<HTMLInputElement | null>;
  cartaoPendente: FormPdv | null; origemPendente: OrigemSugestao; camposSugeridosPendente: Set<string>;
  consultandoIa: boolean; salvandoPendente: boolean;
  onChangeCartao: (c: string, v: any) => void; onChangeAtributoCartao: (c: string, v: any) => void;
  onDispararIa: () => void; onSalvarPendente: () => void; onPular: () => void;
  sessaoItens: { id: string; nome: string; precoVenda: number | null }[]; onDesfazer: (item: { id: string; nome: string; precoVenda: number | null }) => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <ScanBarcode size={18} style={{ color: tokens.acento }} />
        <input
          ref={inputRef} autoFocus value={codigoAtual} disabled={!!cartaoPendente}
          onChange={(e) => onCodigoChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onScan(); } }}
          placeholder={t("bipeAqui", lang)}
          className="bg-transparent outline-none text-sm flex-1 disabled:opacity-40"
          style={{ color: tokens.inputTexto }}
        />
        {processando && <Loader2 className="animate-spin" size={16} style={{ color: tokens.acento }} />}
      </div>

      <AnimatePresence>
        {cartaoPendente && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl space-y-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
            <p className="text-xs font-semibold" style={{ color: cartaoPendente.nome && cartaoPendente.categoria ? AMBAR : tokens.cardTexto }}>
              {cartaoPendente.nome && cartaoPendente.categoria ? t("precoParaSalvar", lang) : t("faltaCompletar", lang)}
            </p>

            {origemPendente === "cosmos" && <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: tokens.cardTexto }}><CheckCircle2 size={13} /> {t("sugeridoCosmos", lang)}</div>}
            {origemPendente === "ia" && <div className="flex items-center gap-1.5 text-xs" style={{ color: AMBAR }}><Sparkles size={13} /> {t("sugeridoIA", lang)}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo emCard label={t("campoNome", lang)} value={cartaoPendente.nome} onChange={(v) => onChangeCartao("nome", v)} sugerido={camposSugeridosPendente.has("nome")} lista={buscarSugestoesSemente(subNichoSel?.value, cartaoPendente.nome || "")} />
              <Campo emCard label={t("campoCategoria", lang)} value={cartaoPendente.categoria} onChange={(v) => onChangeCartao("categoria", v)} sugerido={camposSugeridosPendente.has("categoria")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo emCard label={t("campoMarca", lang)} value={cartaoPendente.marca} onChange={(v) => onChangeCartao("marca", v)} sugerido={camposSugeridosPendente.has("marca")} />
              <Campo emCard label={t("campoPrecoVenda", lang)} tipo="number" value={cartaoPendente.preco_venda} onChange={(v) => onChangeCartao("preco_venda", v)} />
            </div>

            <CamposDoSubNicho emCard lang={lang} campos={subNichoSel?.campos || []} atributos={cartaoPendente.atributos_nicho || {}} onChange={onChangeAtributoCartao} />

            {!cartaoPendente.nome && (
              <button onClick={onDispararIa} disabled={consultandoIa}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,185,66,0.15)", color: AMBAR }}>
                {consultandoIa ? <Loader2 className="animate-spin" size={13} /> : <Sparkles size={13} />} {t("buscarSugestaoIA", lang)}
              </button>
            )}

            <div className="flex gap-2">
              <button onClick={onSalvarPendente} disabled={salvandoPendente}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-60" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
                {salvandoPendente ? t("salvando", lang) : t("salvar", lang)}
              </button>
              <button onClick={onPular} className="px-4 py-2.5 rounded-lg text-sm font-semibold" style={{ color: tokens.cardTexto, border: `1px solid ${tokens.cardTexto}`, opacity: 0.85 }}>{t("pular", lang)}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tokens.acento }}>{t("sessaoTitulo", lang)} ({sessaoItens.length})</p>
        {sessaoItens.length === 0 ? (
          <p className="text-xs" style={{ color: tokens.textoMuted }}>{t("sessaoVazia", lang)}</p>
        ) : (
          <div className="space-y-1.5">
            {sessaoItens.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
                <span className="text-xs font-medium truncate" style={{ color: tokens.cardTexto }}>{item.nome}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <a href="/estoque" className="p-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85 }} title={t("editar", lang)}><ExternalLink size={13} /></a>
                  <button onClick={() => onDesfazer(item)} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ color: "#f87171" }}>
                    <Trash2 size={13} /> {t("desfazer", lang)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
