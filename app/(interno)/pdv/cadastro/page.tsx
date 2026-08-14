"use client";
// 🦅 AXIOMA AI.TECH — página cheia do Cadastro PDV: picker Nicho→Categoria→
// Sub-nicho, edição por ?id=, herança da navegação por query params, e
// Bipagem em Massa (só existe aqui). O Cadastro Único (form/precificação/
// sugestões/chat) foi extraído pra components/PdvCadastroProduto.tsx — essa
// página só resolve empresa/produto/navegação e delega o resto pro
// <FormularioCadastroPdv>, a mesma fonte usada inline no nível "produtos"
// do Catálogo (app/(interno)/pdv/page.tsx).
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ScanBarcode, Loader2, Trash2, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { type Produto, criarProduto, excluirProduto, buscarProdutoPorId } from "../../../../lib/estoqueHelpers";
import { NICHOS_PDV, type NichoPdvDef, type CategoriaPdv, type SubNichoPdv, subNichoEhServico } from "../../../../lib/pdvCatalogoTaxonomia";
import { buscarSugestoesSemente } from "../../../../lib/pdvAutocompleteSemente";
import {
  FormularioCadastroPdv, AssistenteAxioma, Campo, CamposDoSubNicho,
  rodarCascataBase, rodarCamadaIA, formVazio, encontrarCategoriaPorLabel, encontrarSubNichoPorLabel,
  type FormPdv, type OrigemSugestao,
} from "../../../../components/PdvCadastroProduto";

// Botões de ação (Salvar) usam tokens.acaoBg/acaoTexto — verde só sobrevive
// no tema escuro (ver components/PdvLayout.tsx). Âmbar continua fixo nos
// dois temas: é cor de status (sugestão/alerta), não identidade.
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
  campoMarca: { pt: "Marca", en: "Brand", es: "Marca" },
  campoCategoria: { pt: "Categoria", en: "Category", es: "Categoría" },
  campoPrecoVenda: { pt: "Preço de Venda", en: "Sale Price", es: "Precio de Venta" },
  campoUnidade: { pt: "Unidade", en: "Unit", es: "Unidad" },
  campoEstoqueMinimo: { pt: "Estoque Mínimo", en: "Minimum Stock", es: "Stock Mínimo" },
  campoStatus: { pt: "Status", en: "Status", es: "Estado" },
  statusAtivo: { pt: "Ativo", en: "Active", es: "Activo" },
  statusInativo: { pt: "Inativo", en: "Inactive", es: "Inactivo" },

  sugeridoCosmos: { pt: "Preenchido pelo catálogo — confira", en: "Filled from catalog — please check", es: "Completado por el catálogo — revise" },
  sugeridoIA: { pt: "Sugestão automática — não confirmado, confira com atenção", en: "Automatic suggestion — unverified, please review carefully", es: "Sugerencia automática — sin confirmar, revise con atención" },
  buscarSugestaoIA: { pt: "Tentar sugestão automática", en: "Try automatic suggestion", es: "Intentar sugerencia automática" },
  nenhumaSugestao: { pt: "Nenhuma sugestão encontrada — preencha manualmente.", en: "No suggestion found — fill in manually.", es: "No se encontró sugerencia — complete manualmente." },
  produtoJaCadastrado: { pt: "Já cadastrado — abrindo para edição", en: "Already registered — opening for edit", es: "Ya registrado — abriendo para editar" },

  salvar: { pt: "Salvar", en: "Save", es: "Guardar" },
  salvando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  toastSalvo: { pt: "Salvo: {nome}", en: "Saved: {nome}", es: "Guardado: {nome}" },
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
};

type Lang = Idioma;
function t(chave: keyof typeof txt, lang: Lang, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
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
  // id) — impede o efeito de reset dentro do hook (useCadastroProdutoPdv) de
  // apagar o que acabamos de carregar só porque nichoSel/categoriaSel/
  // subNichoSel mudaram.
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

  // ---- Edição por id (link "Editar" da lista do Catálogo) — resolve nicho/
  // categoria/sub-nicho (é URL-aware, por isso continua aqui) e passa o
  // produto pronto pra <FormularioCadastroPdv>; quem popula o form a partir
  // dele é o hook useCadastroProdutoPdv (fonte única, sem duplicar). Confirma
  // empresa_id do produto contra a empresa ativa (multi-tenant) — nunca
  // confia só no id da URL. Espera empresaId carregar primeiro.
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
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
      setProdutoParaEditar(produto);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, [empresaId]);

  // ============================================================================
  // BIPAGEM EM MASSA — só existe na página cheia, não faz sentido inline no
  // Catálogo. Reaproveita rodarCascataBase/rodarCamadaIA/formVazio (mesma
  // fonte do Cadastro Único, importados de components/PdvCadastroProduto).
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
      const { jaExiste, patch, sugeridos, origem } = await rodarCascataBase(empresaId, codigo);
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
      const ia = await rodarCamadaIA(lang, cartaoPendente.codigo_barras);
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

          {/* No modo avulso o <FormularioCadastroPdv> já renderiza seu próprio
              AssistenteAxioma — só duplicamos aqui pro modo massa, pra manter
              sempre exatamente um botão de chat visível, nunca dois. */}
          {modo === "massa" && (
            <>
              <AssistenteAxioma
                lang={lang} nichoLabel={nichoSel!.label[lang]} categoriaLabel={categoriaSel?.label[lang] || null}
                subNichoLabel={subNichoSel?.label[lang] || null} tipo={subNichoEhServico(nichoSel, subNichoSel) ? "servico" : "produto"}
                form={formVazio(nichoSel!.value)} despesasPct="" margemDesejadaPct=""
                loteInicial={{ numero_lote: "", data_validade: "", quantidade: "" }}
                emEdicao={false} camposSubNicho={subNichoSel?.campos || []}
              />
              {subNichoEhServico(nichoSel, subNichoSel) && (
                <p className="text-xs mb-4" style={{ color: AMBAR }}>{t("massaIndisponivelServico", lang)}</p>
              )}
            </>
          )}

          {modo === "avulso" && (
            <FormularioCadastroPdv
              empresaId={empresaId} userId={userId} lang={lang}
              nichoSel={nichoSel!} categoriaSel={categoriaSel} subNichoSel={subNichoSel}
              produtoParaEditar={produtoParaEditar} cargaProgramaticaRef={cargaProgramaticaRef}
              mostrarToast={mostrarToast}
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
