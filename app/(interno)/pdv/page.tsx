"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search, ExternalLink, Loader2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import PdvLayout, { useTemaPdv } from "../../../components/PdvLayout";
import { useLanguage } from "../../../lib/LanguageContext";
import type { Idioma } from "../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../lib/empresaHelpers";
import { carregarContagemPorSegmento, type ContagemSegmento } from "../../../lib/estoqueHelpers";
import {
  NICHOS_PDV, buscarNicho, type NichoPdvDef, type ModoNicho, type DivisaoPrimaria,
} from "../../../lib/pdvCatalogoTaxonomia";
import {
  listarCategoriasReais, listarSubNichosReais, listarProdutosPdv, SEM_SUBNICHO,
  PDV_PAGE_SIZE, type ProdutoPdv,
} from "../../../lib/pdvHelpers";

// Botões de ação e preço usam tokens.acaoBg/acento (verde só sobrevive no
// tema escuro, via tokens — ver components/PdvLayout.tsx). Nenhuma cor fixa
// aqui: cards, bordas, labels de seção e navegação seguem o tema inteiro.

const txt = {
  titulo: { pt: "PDV — Catálogo", en: "POS — Catalog", es: "PDV — Catálogo" },
  subtitulo: {
    pt: "Navegue por nicho, categoria e sub-nicho até chegar nos produtos.",
    en: "Browse by niche, category and sub-niche down to the products.",
    es: "Navegue por nicho, categoría y sub-nicho hasta llegar a los productos.",
  },
  novoProdutoServico: { pt: "+ Novo Produto/Serviço", en: "+ New Product/Service", es: "+ Nuevo Producto/Servicio" },
  importarNfe: { pt: "Importar XML da NF-e", en: "Import NF-e XML", es: "Importar XML de NF-e" },
  operadorTitulo: { pt: "PDV — Ponto de Venda", en: "POS — Point of Sale", es: "PDV — Punto de Venta" },
  operadorSubtitulo: {
    pt: "Frente de caixa em construção.",
    en: "Checkout screen under construction.",
    es: "Pantalla de venta en construcción.",
  },
  operadorCorpo: {
    pt: "Em breve você vai poder vender por aqui. Volte mais tarde.",
    en: "Soon you'll be able to sell from here. Check back later.",
    es: "Pronto podrás vender desde aquí. Vuelve más tarde.",
  },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  nichos: { pt: "Nichos", en: "Niches", es: "Nichos" },
  filtroTodos: { pt: "Todos", en: "All", es: "Todos" },
  filtroAlimentos: { pt: "Alimentos", en: "Food", es: "Alimentos" },
  filtroNaoAlimentos: { pt: "Não-Alimentos", en: "Non-Food", es: "No Alimentos" },
  modoProduto: { pt: "Modo Produto", en: "Product Mode", es: "Modo Producto" },
  modoMisto: { pt: "Modo Misto", en: "Mixed Mode", es: "Modo Mixto" },
  modoServico: { pt: "Modo Serviço", en: "Service Mode", es: "Modo Servicio" },
  voltar: { pt: "Voltar", en: "Back", es: "Volver" },
  categorias: { pt: "Categorias", en: "Categories", es: "Categorías" },
  subNichos: { pt: "Sub-nichos", en: "Sub-niches", es: "Sub-nichos" },
  semSubNicho: { pt: "Sem sub-nicho definido", en: "No sub-niche defined", es: "Sin sub-nicho definido" },
  outrasCategorias: { pt: "Outras categorias cadastradas", en: "Other registered categories", es: "Otras categorías registradas" },
  outrosSubNichos: { pt: "Outros sub-nichos cadastrados", en: "Other registered sub-niches", es: "Otros sub-nichos registrados" },
  buscarPlaceholder: { pt: "Buscar por nome, SKU ou código de barras…", en: "Search by name, SKU or barcode…", es: "Buscar por nombre, SKU o código de barras…" },
  semProdutos: { pt: "Nenhum produto cadastrado aqui ainda.", en: "No products registered here yet.", es: "Ningún producto registrado aquí todavía." },
  semProdutosDica: {
    pt: "Cadastre manualmente, importe um XML de NF-e ou bipe um código de barras já conhecido.",
    en: "Register manually, import an NF-e XML, or scan an already-known barcode.",
    es: "Registre manualmente, importe un XML de NF-e o escanee un código de barras ya conocido.",
  },
  semCategoriaAinda: { pt: "Nenhuma categoria com produto ainda.", en: "No category with products yet.", es: "Ninguna categoría con productos todavía." },
  verNoEstoque: { pt: "Ver/editar no Estoque", en: "View/edit in Inventory", es: "Ver/editar en Inventario" },
  estoqueDisponivel: { pt: "em estoque", en: "in stock", es: "en stock" },
  precoNaoDefinido: { pt: "preço não definido", en: "price not set", es: "precio no definido" },
  anterior: { pt: "Anterior", en: "Previous", es: "Anterior" },
  proxima: { pt: "Próxima", en: "Next", es: "Siguiente" },
  paginaDe: { pt: "Página {a} de {b}", en: "Page {a} of {b}", es: "Página {a} de {b}" },
  produtosEncontrados: { pt: "{n} produto(s)", en: "{n} product(s)", es: "{n} producto(s)" },
  erroCarregar: { pt: "Não foi possível carregar. Tente novamente.", en: "Could not load. Try again.", es: "No se pudo cargar. Intente de nuevo." },
};

type Nivel = "nicho" | "categoria" | "subnicho" | "produtos";
type FiltroDivisao = "todos" | DivisaoPrimaria;

function t(chave: keyof typeof txt, lang: Idioma, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

function moeda(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const ORDEM_MODO: ModoNicho[] = ["produto", "misto", "servico"];

export default function PDV() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;
  const router = useRouter();

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);
  const [contagem, setContagem] = useState<ContagemSegmento[]>([]);

  const [nivel, setNivel] = useState<Nivel>("nicho");
  const [filtroDivisao, setFiltroDivisao] = useState<FiltroDivisao>("todos");
  const [nichoSel, setNichoSel] = useState<NichoPdvDef | null>(null);
  const [categoriaSel, setCategoriaSel] = useState<string | null>(null); // label real (curada ou real)
  const [subNichoSel, setSubNichoSel] = useState<string | null>(null); // label real ou SEM_SUBNICHO

  const [categoriasReais, setCategoriasReais] = useState<string[] | null>(null);
  const [subNichosReais, setSubNichosReais] = useState<string[] | null>(null);
  const [carregandoNivel, setCarregandoNivel] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [produtos, setProdutos] = useState<ProdutoPdv[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");

  // Cache em memória da sessão — nunca refaz a mesma consulta ao voltar.
  const cacheCategorias = useRef(new Map<string, string[]>());
  const cacheSubNichos = useRef(new Map<string, string[]>());

  useEffect(() => {
    (async () => {
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      if (!id) { setCarregandoPapel(false); return; }
      const [meuPapel, contagemSegmentos] = await Promise.all([
        obterMeuPapel(id),
        carregarContagemPorSegmento(id),
      ]);
      setPapel(meuPapel);
      setContagem(contagemSegmentos);
      setCarregandoPapel(false);
    })();
  }, []);

  // Debounce da busca (300ms), só reseta paginação quando o termo muda de verdade.
  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => { setPagina(0); }, [buscaDebounced, nichoSel, categoriaSel, subNichoSel]);

  useEffect(() => {
    if (nivel !== "produtos" || !empresaId || !nichoSel) return;
    setCarregandoNivel(true);
    setErro(null);
    listarProdutosPdv(empresaId, {
      segmento: nichoSel.value,
      categoria: categoriaSel || undefined,
      subNicho: subNichoSel || undefined,
      busca: buscaDebounced || undefined,
      pagina,
    }).then(({ dados, total }) => {
      setProdutos(dados);
      setTotalProdutos(total);
      setCarregandoNivel(false);
    }).catch(() => { setErro(t("erroCarregar", lang)); setCarregandoNivel(false); });
  }, [nivel, empresaId, nichoSel, categoriaSel, subNichoSel, buscaDebounced, pagina, lang]);

  // Correção 2 (2026-08): o header do PdvLayout já é um título grande — só que
  // ficava sempre travado em "PDV — Catálogo", então o usuário não via em que
  // nível da navegação estava sem olhar o breadcrumb pequeno. Agora o título
  // muda com o nível, o breadcrumb continua existindo por baixo (clicável),
  // não é substituído.
  const tituloAtual = useMemo(() => {
    if (nivel === "categoria") return nichoSel?.label[lang] || t("titulo", lang);
    if (nivel === "subnicho") return categoriaSel || nichoSel?.label[lang] || t("titulo", lang);
    if (nivel === "produtos") {
      if (subNichoSel && subNichoSel !== SEM_SUBNICHO) return subNichoSel;
      return categoriaSel || nichoSel?.label[lang] || t("titulo", lang);
    }
    return t("titulo", lang);
  }, [nivel, nichoSel, categoriaSel, subNichoSel, lang]);

  const subtituloAtual = useMemo(() => {
    if (nivel === "nicho") return t("subtitulo", lang);
    const partes = [nichoSel?.label[lang], categoriaSel, subNichoSel && subNichoSel !== SEM_SUBNICHO ? subNichoSel : null].filter(Boolean) as string[];
    return partes.join(" › ");
  }, [nivel, nichoSel, categoriaSel, subNichoSel, lang]);

  const qtdPorSegmento = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const c of contagem) mapa.set(c.segmento, c.qtd_ativo);
    return mapa;
  }, [contagem]);

  // Alimentos/Não-Alimentos: filtro visual sobre os NICHOS, nunca um nível
  // novo na árvore (a taxonomia continua com 3 níveis, sem exceção).
  const nichosFiltrados = useMemo(() => {
    if (filtroDivisao === "todos") return NICHOS_PDV;
    return NICHOS_PDV.filter((n) => n.divisaoPrimaria === filtroDivisao);
  }, [filtroDivisao]);

  const nichosPorModo = useMemo(() => {
    const grupos: Record<ModoNicho, NichoPdvDef[]> = { produto: [], misto: [], servico: [] };
    for (const n of nichosFiltrados) if (n.value !== "generico") grupos[n.modo].push(n);
    return grupos;
  }, [nichosFiltrados]);

  async function abrirNicho(nicho: NichoPdvDef) {
    setNichoSel(nicho); setCategoriaSel(null); setSubNichoSel(null);
    if (nicho.categorias.length === 0) { setNivel("produtos"); return; }
    setNivel("categoria");
    const chave = nicho.value;
    if (cacheCategorias.current.has(chave)) { setCategoriasReais(cacheCategorias.current.get(chave)!); return; }
    if (!empresaId) return;
    setCarregandoNivel(true); setErro(null);
    try {
      const reais = await listarCategoriasReais(empresaId, nicho.value);
      cacheCategorias.current.set(chave, reais);
      setCategoriasReais(reais);
    } catch { setErro(t("erroCarregar", lang)); } finally { setCarregandoNivel(false); }
  }

  async function abrirCategoria(categoriaLabel: string) {
    if (!nichoSel) return;
    setCategoriaSel(categoriaLabel); setSubNichoSel(null); setNivel("subnicho");
    const chave = `${nichoSel.value}|${categoriaLabel}`;
    if (cacheSubNichos.current.has(chave)) { setSubNichosReais(cacheSubNichos.current.get(chave)!); return; }
    if (!empresaId) return;
    setCarregandoNivel(true); setErro(null);
    try {
      const reais = await listarSubNichosReais(empresaId, nichoSel.value, categoriaLabel);
      cacheSubNichos.current.set(chave, reais);
      setSubNichosReais(reais);
    } catch { setErro(t("erroCarregar", lang)); } finally { setCarregandoNivel(false); }
  }

  function abrirSubNicho(subNicho: string) {
    setSubNichoSel(subNicho);
    setNivel("produtos");
  }

  function voltarPara(destino: Nivel) {
    setErro(null);
    if (destino === "nicho") { setNichoSel(null); setCategoriaSel(null); setSubNichoSel(null); setNivel("nicho"); }
    else if (destino === "categoria") { setCategoriaSel(null); setSubNichoSel(null); setNivel("categoria"); }
    else if (destino === "subnicho") { setSubNichoSel(null); setNivel("subnicho"); }
  }

  // Seta de voltar do topo (PdvLayout) — sobe exatamente UM nível da
  // navegação do catálogo, reaproveitando o MESMO estado (`nivel` + a
  // própria voltarPara) que já move o breadcrumb. Nunca um controle
  // paralelo. Só na raiz ("nicho") sai do PDV de verdade.
  function handleSetaTopo() {
    if (nivel === "categoria") { voltarPara("nicho"); return; }
    if (nivel === "subnicho") { voltarPara("categoria"); return; }
    if (nivel === "produtos") {
      // Nicho sem categoria (ex: genérico) pula direto nicho→produtos —
      // voltar daqui tem que pular direto de volta pra nicho também.
      voltarPara(nichoSel && nichoSel.categorias.length > 0 ? "subnicho" : "nicho");
      return;
    }
    router.push("/dashboard"); // já está na raiz (nivel === "nicho")
  }

  // ============================================================================
  // GATE — operador não navega catálogo nesta fase (decisão registrada:
  // liberação de leitura pro balconista fica pra Fase 3, junto da venda).
  // ============================================================================
  if (carregandoPapel) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/dashboard">
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (papel === "operador") {
    return (
      <PdvLayout titulo={t("operadorTitulo", lang)} subtitulo={t("operadorSubtitulo", lang)}>
        <AvisoOperador lang={lang} />
      </PdvLayout>
    );
  }

  return (
    <PdvLayout
      titulo={tituloAtual} subtitulo={subtituloAtual} aoVoltar={handleSetaTopo}
      botaoExtra={<BotoesHeader lang={lang} />}
    >
      <Breadcrumb lang={lang} nivel={nivel} nichoSel={nichoSel} categoriaSel={categoriaSel} subNichoSel={subNichoSel} onVoltar={voltarPara} />

      {erro && <AvisoErro texto={erro} />}

      {nivel === "nicho" && (
        <SecaoNichos
          lang={lang} filtroDivisao={filtroDivisao} onFiltroChange={setFiltroDivisao}
          nichosPorModo={nichosPorModo} qtdPorSegmento={qtdPorSegmento} onAbrirNicho={abrirNicho}
        />
      )}

      {nivel === "categoria" && nichoSel && (
        <ListaCarregavel carregando={carregandoNivel}>
          <GradeCategorias
            lang={lang}
            nicho={nichoSel}
            categoriasReais={categoriasReais || []}
            onSelecionar={abrirCategoria}
          />
        </ListaCarregavel>
      )}

      {nivel === "subnicho" && nichoSel && categoriaSel && (
        <ListaCarregavel carregando={carregandoNivel}>
          <GradeSubNichos
            lang={lang}
            nicho={nichoSel}
            categoria={categoriaSel}
            subNichosReais={subNichosReais || []}
            onSelecionar={abrirSubNicho}
          />
        </ListaCarregavel>
      )}

      {nivel === "produtos" && nichoSel && (
        <ListaProdutos
          lang={lang}
          produtos={produtos}
          total={totalProdutos}
          pagina={pagina}
          carregando={carregandoNivel}
          busca={busca}
          onBusca={setBusca}
          onPaginaAnterior={() => setPagina((p) => Math.max(0, p - 1))}
          onPaginaProxima={() => setPagina((p) => p + 1)}
        />
      )}
    </PdvLayout>
  );
}

// ============================================================================
// SUBCOMPONENTES — cada um lê o próprio tema via useTemaPdv() (só funciona
// corretamente sendo componente próprio: é renderizado DENTRO da árvore do
// PdvLayout/Provider, diferente de JSX solto no corpo de PDV()).
// ============================================================================

function EstadoCarregando({ lang }: { lang: Idioma }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{t("carregando", lang)}</span>
    </div>
  );
}

function AvisoOperador({ lang }: { lang: Idioma }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 px-4">
      <p className="text-sm text-center max-w-md" style={{ color: tokens.textoMuted }}>{t("operadorCorpo", lang)}</p>
    </div>
  );
}

function BotoesHeader({ lang }: { lang: Idioma }) {
  // Botão de ação — verde só no tema escuro (tokens.acaoBg já resolve isso).
  // Nos temas 2/3 vira azul forte + texto branco, nunca verde sobre claro.
  const { tokens } = useTemaPdv();
  return (
    <>
      <Link href="/pdv/cadastro" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        <Plus size={16} /> {t("novoProdutoServico", lang)}
      </Link>
      <Link href="/pdv/importar-nfe" className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto, opacity: 0.88 }}>
        {t("importarNfe", lang)}
      </Link>
    </>
  );
}

function AvisoErro({ texto }: { texto: string }) {
  const { tema } = useTemaPdv();
  const claro = tema !== "escuro";
  return (
    <div className="mb-4 px-4 py-3 rounded-xl text-sm"
      style={{ background: claro ? "rgba(220,38,38,0.08)" : "rgba(239,68,68,0.12)", color: claro ? "#b91c1c" : "#fca5a5", border: `1px solid ${claro ? "rgba(220,38,38,0.25)" : "rgba(239,68,68,0.3)"}` }}>
      {texto}
    </div>
  );
}

function SecaoNichos({ lang, filtroDivisao, onFiltroChange, nichosPorModo, qtdPorSegmento, onAbrirNicho }: {
  lang: Idioma; filtroDivisao: FiltroDivisao; onFiltroChange: (f: FiltroDivisao) => void;
  nichosPorModo: Record<ModoNicho, NichoPdvDef[]>; qtdPorSegmento: Map<string, number>; onAbrirNicho: (n: NichoPdvDef) => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {(["todos", "alimentos", "nao_alimentos"] as FiltroDivisao[]).map((f) => (
          <button key={f} onClick={() => onFiltroChange(f)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: filtroDivisao === f ? tokens.filtroAtivoBg : tokens.filtroInativoBg,
              color: filtroDivisao === f ? tokens.filtroAtivoTexto : tokens.filtroInativoTexto,
              border: `1px solid ${filtroDivisao === f ? tokens.filtroAtivoBorda : tokens.filtroInativoBorda}`,
            }}>
            {f === "todos" ? t("filtroTodos", lang) : f === "alimentos" ? t("filtroAlimentos", lang) : t("filtroNaoAlimentos", lang)}
          </button>
        ))}
      </div>
      {ORDEM_MODO.map((modo) => (
        nichosPorModo[modo].length > 0 && (
          <div key={modo}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.acento }}>
              {modo === "produto" ? t("modoProduto", lang) : modo === "misto" ? t("modoMisto", lang) : t("modoServico", lang)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {nichosPorModo[modo].map((nicho) => (
                <CartaoNicho key={nicho.value} nicho={nicho} lang={lang} qtd={qtdPorSegmento.get(nicho.value) || 0} onClick={() => onAbrirNicho(nicho)} />
              ))}
            </div>
          </div>
        )
      ))}
      {filtroDivisao === "todos" && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.acento }}>{t("nichos", lang)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <CartaoNicho nicho={buscarNicho("generico")!} lang={lang} qtd={qtdPorSegmento.get("generico") || 0} onClick={() => onAbrirNicho(buscarNicho("generico")!)} />
          </div>
        </div>
      )}
    </div>
  );
}

function Breadcrumb({ lang, nivel, nichoSel, categoriaSel, subNichoSel, onVoltar }: {
  lang: Idioma; nivel: Nivel; nichoSel: NichoPdvDef | null; categoriaSel: string | null; subNichoSel: string | null;
  onVoltar: (destino: Nivel) => void;
}) {
  const { tokens } = useTemaPdv();
  if (nivel === "nicho") return null;
  const itens: { label: string; destino: Nivel | null }[] = [
    { label: t("nichos", lang), destino: "nicho" },
  ];
  if (nichoSel) itens.push({ label: nichoSel.label[lang], destino: nichoSel.categorias.length ? "categoria" : null });
  if (categoriaSel) itens.push({ label: categoriaSel, destino: "subnicho" });
  if (subNichoSel) itens.push({ label: subNichoSel === SEM_SUBNICHO ? t("semSubNicho", lang) : subNichoSel, destino: null });

  return (
    <div className="flex items-center flex-wrap gap-1 mb-4 text-xs">
      {itens.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={12} style={{ color: tokens.textoMuted }} />}
          {item.destino ? (
            <button onClick={() => onVoltar(item.destino!)} className="hover:underline font-medium" style={{ color: tokens.acento }}>{item.label}</button>
          ) : (
            <span style={{ color: tokens.textoSecundario }}>{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

function CartaoNicho({ nicho, lang, qtd, onClick }: { nicho: NichoPdvDef; lang: Idioma; qtd: number; onClick: () => void }) {
  const { tokens } = useTemaPdv();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="flex flex-col items-start gap-1 p-4 rounded-xl text-left min-h-[76px]"
      style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}
    >
      <span className="text-sm font-semibold" style={{ color: tokens.cardTexto }}>{nicho.label[lang]}</span>
      {qtd > 0 && <span className="text-xs font-semibold" style={{ color: tokens.cardTexto, opacity: 0.75 }}>{qtd}</span>}
    </motion.button>
  );
}

function ListaCarregavel({ carregando, children }: { carregando: boolean; children: React.ReactNode }) {
  const { tokens } = useTemaPdv();
  if (carregando) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse h-16 rounded-xl" style={{ background: tokens.cardBg, opacity: 0.4 }} />
        ))}
      </div>
    );
  }
  return <>{children}</>;
}

function GradeCategorias({ lang, nicho, categoriasReais, onSelecionar }: {
  lang: Idioma; nicho: NichoPdvDef; categoriasReais: string[]; onSelecionar: (categoria: string) => void;
}) {
  const { tokens } = useTemaPdv();
  const curadas = nicho.categorias.map((c) => c.label[lang]);
  const todasCuradasTextos = nicho.categorias.flatMap((c) => [c.label.pt, c.label.en, c.label.es]);
  const outras = categoriasReais.filter((real) => !todasCuradasTextos.some((c) => c.toLowerCase() === real.toLowerCase()));

  if (nicho.categorias.length === 0 && outras.length === 0) {
    return <EstadoVazio texto={t("semCategoriaAinda", lang)} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.acento }}>{t("categorias", lang)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {curadas.map((label, i) => (
            <BotaoSimples key={i} label={label} onClick={() => onSelecionar(label)} />
          ))}
        </div>
      </div>
      {outras.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.textoSecundario }}>{t("outrasCategorias", lang)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {outras.map((label, i) => (
              <BotaoSimples key={i} label={label} onClick={() => onSelecionar(label)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GradeSubNichos({ lang, nicho, categoria, subNichosReais, onSelecionar }: {
  lang: Idioma; nicho: NichoPdvDef; categoria: string; subNichosReais: string[]; onSelecionar: (subNicho: string) => void;
}) {
  const { tokens } = useTemaPdv();
  const cat = nicho.categorias.find((c) => c.label.pt === categoria || c.label.en === categoria || c.label.es === categoria);
  const curadas = (cat?.subNichos || []).map((s) => s.label[lang]);
  const todasCuradasTextos = (cat?.subNichos || []).flatMap((s) => [s.label.pt, s.label.en, s.label.es]);
  const outras = subNichosReais.filter((real) => !todasCuradasTextos.some((c) => c.toLowerCase() === real.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.acento }}>{t("subNichos", lang)}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {curadas.map((label, i) => (
            <BotaoSimples key={i} label={label} onClick={() => onSelecionar(label)} />
          ))}
          <BotaoSimples label={t("semSubNicho", lang)} onClick={() => onSelecionar(SEM_SUBNICHO)} apagado />
        </div>
      </div>
      {outras.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: tokens.textoSecundario }}>{t("outrosSubNichos", lang)}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {outras.map((label, i) => (
              <BotaoSimples key={i} label={label} onClick={() => onSelecionar(label)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BotaoSimples({ label, onClick, apagado }: { label: string; onClick: () => void; apagado?: boolean }) {
  const { tokens } = useTemaPdv();
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="p-3.5 rounded-xl text-left text-sm font-medium min-h-[52px]"
      style={{
        background: apagado ? tokens.fundoContainer : tokens.cardBg,
        border: `1px solid ${apagado ? tokens.bordaContainer : tokens.cardBorda}`,
        color: apagado ? tokens.textoMuted : tokens.cardTexto,
      }}
    >
      {label}
    </motion.button>
  );
}

function EstadoVazio({ texto, dica }: { texto: string; dica?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-1">
      <p className="text-sm" style={{ color: tokens.textoSecundario }}>{texto}</p>
      {dica && <p className="text-xs max-w-sm" style={{ color: tokens.textoMuted }}>{dica}</p>}
    </div>
  );
}

function ListaProdutos({ lang, produtos, total, pagina, carregando, busca, onBusca, onPaginaAnterior, onPaginaProxima }: {
  lang: Idioma; produtos: ProdutoPdv[]; total: number; pagina: number; carregando: boolean; busca: string;
  onBusca: (v: string) => void; onPaginaAnterior: () => void; onPaginaProxima: () => void;
}) {
  const { tokens } = useTemaPdv();
  const totalPaginas = Math.max(1, Math.ceil(total / PDV_PAGE_SIZE));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-xl" style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}` }}>
        <Search size={16} style={{ color: tokens.inputTexto, opacity: 0.7 }} />
        <input
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
          placeholder={t("buscarPlaceholder", lang)}
          className="bg-transparent outline-none text-sm flex-1"
          style={{ color: tokens.inputTexto }}
        />
      </div>

      {carregando ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse h-14 rounded-xl" style={{ background: tokens.cardBg, opacity: 0.4 }} />
          ))}
        </div>
      ) : produtos.length === 0 ? (
        <EstadoVazio texto={t("semProdutos", lang)} dica={t("semProdutosDica", lang)} />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: tokens.textoMuted }}>{t("produtosEncontrados", lang, { n: total })}</p>
          <div className="space-y-2">
            {produtos.map((p) => (
              <LinhaProduto key={p.id} produto={p} lang={lang} />
            ))}
          </div>
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4 text-xs" style={{ color: tokens.textoSecundario }}>
              <button onClick={onPaginaAnterior} disabled={pagina === 0} className="px-3 py-2 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${tokens.cardBorda}` }}>
                {t("anterior", lang)}
              </button>
              <span>{t("paginaDe", lang, { a: pagina + 1, b: totalPaginas })}</span>
              <button onClick={onPaginaProxima} disabled={pagina + 1 >= totalPaginas} className="px-3 py-2 rounded-lg disabled:opacity-40" style={{ border: `1px solid ${tokens.cardBorda}` }}>
                {t("proxima", lang)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LinhaProduto({ produto, lang }: { produto: ProdutoPdv; lang: Idioma }) {
  const { tokens } = useTemaPdv();
  const preco = produto.preco_venda ?? produto.preco_sugerido;
  return (
    <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl flex-wrap" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: tokens.cardTexto }}>{produto.nome}</p>
        <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.72 }}>
          {produto.codigo_barras || produto.sku || "—"} · {produto.saldo_disponivel} {t("estoqueDisponivel", lang)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold" style={{ color: tokens.cardTexto, opacity: preco ? 1 : 0.6 }}>
          {preco ? moeda(preco) : t("precoNaoDefinido", lang)}
        </span>
        <a href="/estoque" className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85, border: `1px solid ${tokens.cardTexto}` }}>
          {t("verNoEstoque", lang)} <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
