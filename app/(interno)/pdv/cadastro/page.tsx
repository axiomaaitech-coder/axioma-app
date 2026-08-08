"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScanBarcode, Loader2, Trash2, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import {
  type Produto, criarProduto, atualizarProduto, excluirProduto, buscarProdutoPorCodigo, buscarProdutoPorId,
  criarMovimentacao, consultarEan, type ConsultaEanResposta,
} from "../../../../lib/estoqueHelpers";
import { CHAVE_PERECIVEL, type CampoNicho } from "../../../../lib/categoriaInteligente";
import { buscarSugestoesColuna } from "../../../../lib/sugestaoInteligente";
import { NICHOS_PDV, type NichoPdvDef, type CategoriaPdv, type SubNichoPdv } from "../../../../lib/pdvCatalogoTaxonomia";
import { consultarIA, verificarNomeDuplicado } from "../../../../lib/pdvHelpers";
import { buscarSugestoesSemente } from "../../../../lib/pdvAutocompleteSemente";

// Botões de ação (Salvar/Consultar) usam tokens.acaoBg/acaoTexto — verde só
// sobrevive no tema escuro (ver components/PdvLayout.tsx). Âmbar continua
// fixo nos dois temas: é cor de status (sugestão/alerta), não identidade.
const AMBAR = "#f5b942";

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
};

type Lang = Idioma;
function t(chave: keyof typeof txt, lang: Lang, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

type OrigemSugestao = "base" | "cosmos" | "ia" | null;
type FormPdv = Partial<Produto> & { atributos_nicho: Record<string, any> };

function formVazio(segmento?: string): FormPdv {
  return { unidade: "UN", status: "ativo", estoque_minimo: 0, atributos_nicho: {}, segmento };
}

function preencherSeVazio<T extends Record<string, any>>(prev: T, sugeridos: Set<string>, campo: string, valor: any) {
  const vazio = prev[campo] === undefined || prev[campo] === null || prev[campo] === "" || prev[campo] === 0;
  const preenche = vazio && valor !== undefined && valor !== null && valor !== "";
  if (!preenche) return prev[campo];
  sugeridos.add(campo);
  return valor;
}

export default function PDVCadastro() {
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
    setSubNichoSel(categoriaSel?.subNichos.find((x) => x.value === valor) || null);
  }

  const pronto = !!(nichoSel && (nichoSel.categorias.length === 0 || (categoriaSel && subNichoSel)));

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

  useEffect(() => {
    if (!nichoSel) return;
    setForm(formVazio(nichoSel.value));
    setProdutoEditando(null); setCamposSugeridos(new Set()); setOrigemSugestao(null); setDuplicado(null);
    setLoteInicial({ numero_lote: "", data_validade: "", quantidade: "" });
  }, [nichoSel?.value, categoriaSel?.value, subNichoSel?.value]);

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

  async function salvarAvulso(forcarCriacao = false) {
    if (!empresaId || !userId || !nichoSel) return;
    if (!form.nome?.trim()) { mostrarToast(t("toastNomeObrigatorio", lang), "erro"); return; }

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
        controla_estoque: nichoSel.modo !== "servico",
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
        <div className="flex items-center justify-center py-16 gap-2" style={{ color: "#5a7a9a" }}>
          <Loader2 className="animate-spin" size={18} /><span className="text-sm">{t("carregando", lang)}</span>
        </div>
      </PdvLayout>
    );
  }

  if (papel === "operador") {
    return (
      <PdvLayout titulo={t("operadorTitulo", lang)} subtitulo="">
        <div className="flex items-center justify-center py-16 px-4">
          <p className="text-sm text-center max-w-md" style={{ color: "#5a7a9a" }}>{t("operadorCorpo", lang)}</p>
        </div>
      </PdvLayout>
    );
  }

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
      {toast && <ToastPdv msg={toast.msg} tipo={toast.tipo} />}

      <SeletorNicho lang={lang} nichoSel={nichoSel} categoriaSel={categoriaSel} subNichoSel={subNichoSel}
        onNicho={selecionarNicho} onCategoria={selecionarCategoria} onSubNicho={selecionarSubNicho} />

      {!pronto ? (
        <TextoEscolhaNicho lang={lang} />
      ) : (
        <>
          <div className="flex gap-2 mb-5 mt-4">
            <AbaBotao ativo={modo === "avulso"} onClick={() => setModo("avulso")} texto={t("abaAvulso", lang)} />
            <AbaBotao ativo={modo === "massa"} onClick={() => nichoSel!.modo !== "servico" && setModo("massa")} texto={t("abaMassa", lang)} desabilitado={nichoSel!.modo === "servico"} />
          </div>

          {modo === "massa" && nichoSel!.modo === "servico" && (
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
            />
          )}

          {modo === "massa" && nichoSel!.modo !== "servico" && (
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
        style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}`, color: tokens.texto }}>
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
      style={{ background: ativo ? tokens.acentoSuaveBorda : tokens.cardBg, color: ativo ? tokens.acento : tokens.textoMuted, border: `1px solid ${ativo ? tokens.acento : tokens.cardBorda}` }}>
      {texto}
    </button>
  );
}

// ============================================================================
// CAMPOS COMUNS (input básico, select, campo de nicho dinâmico)
// ============================================================================
function Campo({ label, value, onChange, tipo = "text", sugerido, lista, onFocus }: {
  label: string; value: any; onChange: (v: any) => void; tipo?: "text" | "number" | "date";
  sugerido?: boolean; lista?: string[]; onFocus?: () => void;
}) {
  const { tokens } = useTemaPdv();
  const listId = useRef(`dl-${Math.random().toString(36).slice(2)}`).current;
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: sugerido ? AMBAR : tokens.textoSecundario }}>
        {label} {sugerido && <Sparkles size={11} />}
      </label>
      <input
        type={tipo} value={value ?? ""} onFocus={onFocus} list={lista ? listId : undefined}
        onChange={(e) => onChange(tipo === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${sugerido ? "rgba(245,185,66,0.5)" : tokens.inputBorda}`, color: tokens.texto }}
      />
      {lista && <datalist id={listId}>{lista.map((v, i) => <option key={i} value={v} />)}</datalist>}
    </div>
  );
}

function CampoSelectSimples({ label, value, onChange, opcoes, sugerido }: { label: string; value: any; onChange: (v: any) => void; opcoes: { value: string; label: string }[]; sugerido?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <label className="text-xs font-semibold flex items-center gap-1.5 mb-1" style={{ color: sugerido ? AMBAR : tokens.textoSecundario }}>{label} {sugerido && <Sparkles size={11} />}</label>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-sm"
        style={{ background: tokens.inputBg, border: `1px solid ${sugerido ? "rgba(245,185,66,0.5)" : tokens.inputBorda}`, color: tokens.texto }}>
        <option value="">—</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CamposDoSubNicho({ lang, campos, atributos, onChange, sugeridos }: {
  lang: Lang; campos: CampoNicho[]; atributos: Record<string, any>; onChange: (chave: string, v: any) => void; sugeridos?: Set<string>;
}) {
  const { tokens } = useTemaPdv();
  if (campos.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: tokens.acento }}>{t("camposEspecificos", lang)}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {campos.filter((c) => !c.dependeDe || !!atributos[c.dependeDe]).map((campo) => {
          const valor = atributos[campo.chave];
          const sugerido = sugeridos?.has(`attr:${campo.chave}`);
          if (campo.tipo === "boolean") {
            return (
              <label key={campo.chave} className="flex items-center gap-2 cursor-pointer select-none py-2">
                <input type="checkbox" checked={!!valor} onChange={(e) => onChange(campo.chave, e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-xs font-semibold" style={{ color: tokens.texto }}>{campo.label[lang]}</span>
              </label>
            );
          }
          if (campo.tipo === "select") {
            return <CampoSelectSimples key={campo.chave} label={campo.label[lang]} value={valor} onChange={(v) => onChange(campo.chave, v)}
              opcoes={(campo.opcoes || []).map((o) => ({ value: o.value, label: o.label[lang] }))} sugerido={sugerido} />;
          }
          return <Campo key={campo.chave} label={campo.label[lang]} value={valor} tipo={campo.tipo === "number" ? "number" : "text"} onChange={(v) => onChange(campo.chave, v)} sugerido={sugerido} />;
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
        <button onClick={onCriarMesmoAssim} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: tokens.acentoSuaveBorda, color: tokens.acento }}>{t("criarMesmoAssim", lang)}</button>
        <button onClick={onFechar} className="px-3 py-2 rounded-lg text-xs" style={{ color: tokens.textoMuted }}>✕</button>
      </div>
    </div>
  );
}

// ============================================================================
// FORMULÁRIO AVULSO
// ============================================================================
function FormularioAvulso({
  lang, nichoSel, subNichoSel, form, produtoEditando, camposSugeridos, origemSugestao, consultando, duplicado, salvando, loteInicial,
  sugestoesHistorico, onChangeCampo, onChangeAtributo, onConsultar, onGarantirHistorico, onSalvar, onCriarMesmoAssim, onAbrirExistente, onLoteChange, onFecharDuplicado,
}: {
  lang: Lang; nichoSel: NichoPdvDef; subNichoSel: SubNichoPdv | null; form: FormPdv; produtoEditando: Produto | null;
  camposSugeridos: Set<string>; origemSugestao: OrigemSugestao; consultando: boolean; duplicado: { id: string; nome: string } | null; salvando: boolean;
  loteInicial: { numero_lote: string; data_validade: string; quantidade: string };
  sugestoesHistorico: Record<string, string[]>;
  onChangeCampo: (c: string, v: any) => void; onChangeAtributo: (c: string, v: any) => void;
  onConsultar: () => void; onGarantirHistorico: (c: "nome" | "marca" | "categoria") => void;
  onSalvar: () => void; onCriarMesmoAssim: () => void; onAbrirExistente: () => void; onLoteChange: (c: string, v: string) => void; onFecharDuplicado: () => void;
}) {
  const { tokens } = useTemaPdv();
  const ehServico = nichoSel.modo === "servico";
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
          style={{ color: tokens.texto }}
        />
        {processando && <Loader2 className="animate-spin" size={16} style={{ color: tokens.acento }} />}
      </div>

      <AnimatePresence>
        {cartaoPendente && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="p-4 rounded-xl space-y-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
            <p className="text-xs" style={{ color: cartaoPendente.nome && cartaoPendente.categoria ? AMBAR : tokens.textoSecundario }}>
              {cartaoPendente.nome && cartaoPendente.categoria ? t("precoParaSalvar", lang) : t("faltaCompletar", lang)}
            </p>

            {origemPendente === "cosmos" && <div className="flex items-center gap-1.5 text-xs" style={{ color: tokens.acento }}><CheckCircle2 size={13} /> {t("sugeridoCosmos", lang)}</div>}
            {origemPendente === "ia" && <div className="flex items-center gap-1.5 text-xs" style={{ color: AMBAR }}><Sparkles size={13} /> {t("sugeridoIA", lang)}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label={t("campoNome", lang)} value={cartaoPendente.nome} onChange={(v) => onChangeCartao("nome", v)} sugerido={camposSugeridosPendente.has("nome")} lista={buscarSugestoesSemente(subNichoSel?.value, cartaoPendente.nome || "")} />
              <Campo label={t("campoCategoria", lang)} value={cartaoPendente.categoria} onChange={(v) => onChangeCartao("categoria", v)} sugerido={camposSugeridosPendente.has("categoria")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Campo label={t("campoMarca", lang)} value={cartaoPendente.marca} onChange={(v) => onChangeCartao("marca", v)} sugerido={camposSugeridosPendente.has("marca")} />
              <Campo label={t("campoPrecoVenda", lang)} tipo="number" value={cartaoPendente.preco_venda} onChange={(v) => onChangeCartao("preco_venda", v)} />
            </div>

            <CamposDoSubNicho lang={lang} campos={subNichoSel?.campos || []} atributos={cartaoPendente.atributos_nicho || {}} onChange={onChangeAtributoCartao} />

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
              <button onClick={onPular} className="px-4 py-2.5 rounded-lg text-sm" style={{ color: tokens.textoSecundario, border: `1px solid ${tokens.cardBorda}` }}>{t("pular", lang)}</button>
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
                <span className="text-xs truncate" style={{ color: tokens.texto }}>{item.nome}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <a href="/estoque" className="p-1.5 rounded-lg" style={{ color: tokens.textoSecundario }} title={t("editar", lang)}><ExternalLink size={13} /></a>
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
