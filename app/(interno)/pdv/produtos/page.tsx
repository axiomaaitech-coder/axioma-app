"use client";
// 🦅 AXIOMA AI.TECH — PDV: "Produtos Cadastrados" — mesmo padrão visual de
// navegação por cards do Catálogo (app/(interno)/pdv/page.tsx: nicho →
// categoria → sub-nicho, breadcrumb, grid), reaproveitado via
// components/PdvCatalogoNav.tsx (nenhum JSX duplicado entre os dois). A
// diferença: aqui só aparece nicho/categoria/sub-nicho que TEM produto (o
// Catálogo mostra a árvore curada inteira, vazia ou não, porque é de lá que
// se cadastra um produto novo em uma categoria ainda sem nada) — e cada
// produto já vem com editar/excluir, sem formulário de cadastro embutido.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { excluirProduto } from "../../../../lib/estoqueHelpers";
import { buscarNicho, type NichoPdvDef } from "../../../../lib/pdvCatalogoTaxonomia";
import { listarTodosProdutosPdv, SEM_SUBNICHO, type ProdutoPdv } from "../../../../lib/pdvHelpers";
import {
  EstadoCarregando, AvisoErro, Breadcrumb, CartaoNicho, BotaoSimples, EstadoVazio, LinhaProduto,
  type NivelCatalogo,
} from "../../../../components/PdvCatalogoNav";

const txt = {
  titulo: { pt: "PDV — Produtos Cadastrados", en: "POS — Registered Products", es: "PDV — Productos Registrados" },
  subtitulo: {
    pt: "Navegue por nicho, categoria e sub-nicho — só aparece onde tem produto.",
    en: "Browse by niche, category and sub-niche — only where products exist.",
    es: "Navegue por nicho, categoría y sub-nicho — solo donde hay productos.",
  },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  buscarPlaceholder: { pt: "Buscar por nome ou código de barras…", en: "Search by name or barcode…", es: "Buscar por nombre o código de barras…" },
  totalProdutos: { pt: "{n} produto(s) cadastrado(s)", en: "{n} registered product(s)", es: "{n} producto(s) registrado(s)" },
  resultadosBusca: { pt: "{n} resultado(s) para \"{termo}\"", en: "{n} result(s) for \"{termo}\"", es: "{n} resultado(s) para \"{termo}\"" },
  semProdutos: { pt: "Nenhum produto cadastrado ainda.", en: "No products registered yet.", es: "Ningún producto registrado todavía." },
  semResultadoBusca: { pt: "Nenhum produto encontrado para essa busca.", en: "No product found for this search.", es: "Ningún producto encontrado para esta búsqueda." },
  nichos: { pt: "Nichos", en: "Niches", es: "Nichos" },
  semCategoria: { pt: "Sem categoria definida", en: "No category defined", es: "Sin categoría definida" },
  semSubNicho: { pt: "Sem sub-nicho definido", en: "No sub-niche defined", es: "Sin sub-nicho definido" },
  estoqueDisponivel: { pt: "em estoque", en: "in stock", es: "en stock" },
  precoNaoDefinido: { pt: "preço não definido", en: "price not set", es: "precio no definido" },
  editar: { pt: "Editar", en: "Edit", es: "Editar" },
  excluir: { pt: "Excluir", en: "Delete", es: "Eliminar" },
  confirmarExclusaoTitulo: { pt: "Excluir produto?", en: "Delete product?", es: "¿Eliminar producto?" },
  confirmarExclusaoTexto: {
    pt: "Tem certeza que deseja excluir \"{nome}\"? Essa ação não pode ser desfeita.",
    en: "Are you sure you want to delete \"{nome}\"? This action cannot be undone.",
    es: "¿Está seguro de que desea eliminar \"{nome}\"? Esta acción no se puede deshacer.",
  },
  cancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  produtoExcluido: { pt: "Excluído: {nome}", en: "Deleted: {nome}", es: "Eliminado: {nome}" },
  produtoInativado: {
    pt: "\"{nome}\" já tem movimentações — marcado como inativo em vez de excluído.",
    en: "\"{nome}\" already has movements — marked inactive instead of deleted.",
    es: "\"{nome}\" ya tiene movimientos — marcado como inactivo en lugar de eliminado.",
  },
  produtoTemVenda: {
    pt: "Não é possível excluir \"{nome}\" — já tem venda registrada.",
    en: "Cannot delete \"{nome}\" — it already has a sale registered.",
    es: "No se puede eliminar \"{nome}\" — ya tiene una venta registrada.",
  },
  erroExcluir: { pt: "Não foi possível excluir. Tente novamente.", en: "Could not delete. Try again.", es: "No se pudo eliminar. Intente de nuevo." },
};

function t(chave: keyof typeof txt, lang: Idioma, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

const SEM_CATEGORIA = "__sem_categoria__";

export default function PdvProdutosCadastrados() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);

  const [produtos, setProdutos] = useState<ProdutoPdv[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [nivel, setNivel] = useState<NivelCatalogo>("nicho");
  const [nichoSel, setNichoSel] = useState<NichoPdvDef | null>(null);
  const [categoriaSel, setCategoriaSel] = useState<string | null>(null);
  const [subNichoSel, setSubNichoSel] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoPdv | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setCarregandoPapel(false); return; }
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      if (!id) { setCarregandoPapel(false); return; }
      setPapel(await obterMeuPapel(id));
      setCarregandoPapel(false);
    })();
  }, [supabase]);

  // Gestão de catálogo (editar/excluir) é tarefa do dono, mesmo gate já usado
  // no Catálogo (app/(interno)/pdv/page.tsx) — operador só tem a Frente de Caixa.
  useEffect(() => {
    if (!carregandoPapel && papel === "operador") router.push("/pdv/venda");
  }, [carregandoPapel, papel, router]);

  useEffect(() => {
    if (!empresaId || carregandoPapel || papel === "operador") return;
    setCarregandoProdutos(true);
    setErro(null);
    listarTodosProdutosPdv(empresaId)
      .then((dados) => { setProdutos(dados); setCarregandoProdutos(false); })
      .catch(() => { setErro(t("erroExcluir", lang)); setCarregandoProdutos(false); });
  }, [empresaId, carregandoPapel, papel, lang]);

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  const buscaAtiva = buscaDebounced.trim().length > 0;
  const resultadosBusca = useMemo(() => {
    if (!buscaAtiva) return [];
    const termo = buscaDebounced.trim().toLowerCase();
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo) || (p.codigo_barras || "").toLowerCase().includes(termo));
  }, [produtos, buscaDebounced, buscaAtiva]);

  // ── Cards de nicho: só quem tem produto, contagem tirada dos produtos já
  // carregados (nunca uma query à parte — é o mesmo dado, reagregar no
  // cliente aqui é mais barato que ir de novo no banco). ──
  const nichosComProduto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of produtos) { const seg = p.segmento || ""; mapa.set(seg, (mapa.get(seg) || 0) + 1); }
    const lista: { nicho: NichoPdvDef; qtd: number }[] = [];
    for (const [seg, qtd] of mapa) { const n = buscarNicho(seg); if (n) lista.push({ nicho: n, qtd }); }
    return lista.sort((a, b) => a.nicho.label[lang].localeCompare(b.nicho.label[lang], lang));
  }, [produtos, lang]);

  const categoriasComProduto = useMemo(() => {
    if (!nichoSel) return [];
    const mapa = new Map<string, number>();
    for (const p of produtos) {
      if ((p.segmento || "") !== nichoSel.value) continue;
      const cat = (p.categoria || "").trim() || SEM_CATEGORIA;
      mapa.set(cat, (mapa.get(cat) || 0) + 1);
    }
    return Array.from(mapa, ([valor, qtd]) => ({ valor, label: valor === SEM_CATEGORIA ? t("semCategoria", lang) : valor, qtd }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [produtos, nichoSel, lang]);

  const subNichosComProduto = useMemo(() => {
    if (!nichoSel || !categoriaSel) return [];
    const mapa = new Map<string, number>();
    for (const p of produtos) {
      if ((p.segmento || "") !== nichoSel.value) continue;
      const cat = (p.categoria || "").trim() || SEM_CATEGORIA;
      if (cat !== categoriaSel) continue;
      const sub = (p.subcategoria || "").trim() || SEM_SUBNICHO;
      mapa.set(sub, (mapa.get(sub) || 0) + 1);
    }
    return Array.from(mapa, ([valor, qtd]) => ({ valor, label: valor === SEM_SUBNICHO ? t("semSubNicho", lang) : valor, qtd }))
      .sort((a, b) => a.label.localeCompare(b.label, lang));
  }, [produtos, nichoSel, categoriaSel, lang]);

  const produtosDoGrupo = useMemo(() => {
    if (!nichoSel || !categoriaSel || !subNichoSel) return [];
    return produtos.filter((p) => {
      if ((p.segmento || "") !== nichoSel.value) return false;
      const cat = (p.categoria || "").trim() || SEM_CATEGORIA;
      if (cat !== categoriaSel) return false;
      const sub = (p.subcategoria || "").trim() || SEM_SUBNICHO;
      return sub === subNichoSel;
    });
  }, [produtos, nichoSel, categoriaSel, subNichoSel]);

  function abrirNicho(nicho: NichoPdvDef) { setNichoSel(nicho); setCategoriaSel(null); setSubNichoSel(null); setNivel("categoria"); }
  function abrirCategoria(categoria: string) { setCategoriaSel(categoria); setSubNichoSel(null); setNivel("subnicho"); }
  function abrirSubNicho(sub: string) { setSubNichoSel(sub); setNivel("produtos"); }

  function voltarPara(destino: NivelCatalogo) {
    setErro(null);
    if (destino === "nicho") { setNichoSel(null); setCategoriaSel(null); setSubNichoSel(null); setNivel("nicho"); }
    else if (destino === "categoria") { setCategoriaSel(null); setSubNichoSel(null); setNivel("categoria"); }
    else if (destino === "subnicho") { setSubNichoSel(null); setNivel("subnicho"); }
  }

  // Seta de voltar do topo — sobe exatamente um nível, mesmo princípio do
  // Catálogo (app/(interno)/pdv/page.tsx: handleSetaTopo). Só na raiz sai da tela.
  function handleSetaTopo() {
    if (nivel === "categoria") { voltarPara("nicho"); return; }
    if (nivel === "subnicho") { voltarPara("categoria"); return; }
    if (nivel === "produtos") { voltarPara("subnicho"); return; }
    router.push("/pdv");
  }

  async function confirmarExclusao() {
    if (!produtoParaExcluir) return;
    setExcluindo(true);
    const { erro: erroExclusao, inativadoEmVezDeExcluir, temVenda } = await excluirProduto(produtoParaExcluir.id);
    setExcluindo(false);
    const nome = produtoParaExcluir.nome;
    setProdutoParaExcluir(null);

    if (temVenda) { mostrarToast(t("produtoTemVenda", lang, { nome }), "erro"); return; }
    if (erroExclusao) { mostrarToast(t("erroExcluir", lang), "erro"); return; }
    mostrarToast(inativadoEmVezDeExcluir ? t("produtoInativado", lang, { nome }) : t("produtoExcluido", lang, { nome }), "info");
    setProdutos((lista) => lista.filter((p) => p.id !== produtoParaExcluir.id));
  }

  const rotulos = {
    estoqueLabel: t("estoqueDisponivel", lang), precoNaoDefinidoLabel: t("precoNaoDefinido", lang),
    editarLabel: t("editar", lang), excluirLabel: t("excluir", lang),
  };

  if (carregandoPapel || papel === "operador") {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
        <EstadoCarregando texto={t("carregando", lang)} />
      </PdvLayout>
    );
  }

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} aoVoltar={handleSetaTopo}>
      <BarraBusca lang={lang} busca={busca} onBusca={setBusca} />

      {erro && <AvisoErro texto={erro} />}

      {carregandoProdutos ? (
        <EstadoCarregando texto={t("carregando", lang)} />
      ) : produtos.length === 0 ? (
        <EstadoVazio texto={t("semProdutos", lang)} />
      ) : buscaAtiva ? (
        <>
          <p className="text-xs mb-3" style={{ opacity: 0.7 }}>{t("resultadosBusca", lang, { n: resultadosBusca.length, termo: buscaDebounced.trim() })}</p>
          {resultadosBusca.length === 0 ? (
            <EstadoVazio texto={t("semResultadoBusca", lang)} />
          ) : (
            <div className="space-y-2">
              {resultadosBusca.map((p) => <LinhaProduto key={p.id} produto={p} onExcluir={setProdutoParaExcluir} {...rotulos} />)}
            </div>
          )}
        </>
      ) : (
        <>
          <Breadcrumb
            lang={lang} nivel={nivel} nichoSel={nichoSel} categoriaSel={categoriaSel} subNichoSel={subNichoSel}
            nichosLabel={t("nichos", lang)} semSubNichoLabel={t("semSubNicho", lang)} semSubNichoValor={SEM_SUBNICHO}
            semCategoriaLabel={t("semCategoria", lang)} semCategoriaValor={SEM_CATEGORIA}
            onVoltar={voltarPara}
          />
          <p className="text-xs mb-3" style={{ opacity: 0.7 }}>{t("totalProdutos", lang, { n: produtos.length })}</p>

          {nivel === "nicho" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {nichosComProduto.map(({ nicho, qtd }) => (
                <CartaoNicho key={nicho.value} nicho={nicho} lang={lang} qtd={qtd} onClick={() => abrirNicho(nicho)} />
              ))}
            </div>
          )}

          {nivel === "categoria" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categoriasComProduto.map((c) => (
                <BotaoSimples key={c.valor} label={c.label} qtd={c.qtd} onClick={() => abrirCategoria(c.valor)} apagado={c.valor === SEM_CATEGORIA} />
              ))}
            </div>
          )}

          {nivel === "subnicho" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subNichosComProduto.map((s) => (
                <BotaoSimples key={s.valor} label={s.label} qtd={s.qtd} onClick={() => abrirSubNicho(s.valor)} apagado={s.valor === SEM_SUBNICHO} />
              ))}
            </div>
          )}

          {nivel === "produtos" && (
            <div className="space-y-2">
              {produtosDoGrupo.map((p) => <LinhaProduto key={p.id} produto={p} onExcluir={setProdutoParaExcluir} {...rotulos} />)}
            </div>
          )}
        </>
      )}

      {produtoParaExcluir && (
        <ModalConfirmarExclusao
          produto={produtoParaExcluir} lang={lang} excluindo={excluindo}
          onCancelar={() => setProdutoParaExcluir(null)} onConfirmar={confirmarExclusao}
        />
      )}

      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}
    </PdvLayout>
  );
}

function BarraBusca({ lang, busca, onBusca }: { lang: Idioma; busca: string; onBusca: (v: string) => void }) {
  const { tokens } = useTemaPdv();
  return (
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
  );
}

function ModalConfirmarExclusao({ produto, lang, excluindo, onCancelar, onConfirmar }: {
  produto: ProdutoPdv; lang: Idioma; excluindo: boolean; onCancelar: () => void; onConfirmar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
        <h3 className="text-base font-bold mb-2" style={{ color: tokens.cardTexto }}>{t("confirmarExclusaoTitulo", lang)}</h3>
        <p className="text-sm mb-5" style={{ color: tokens.cardTexto, opacity: 0.85 }}>{t("confirmarExclusaoTexto", lang, { nome: produto.nome })}</p>
        <div className="flex justify-end gap-2">
          <button disabled={excluindo} onClick={onCancelar} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "transparent", color: tokens.cardTexto, border: `1px solid ${tokens.cardTexto}` }}>
            {t("cancelar", lang)}
          </button>
          <button disabled={excluindo} onClick={onConfirmar} className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: "#ef4444", color: "#fff" }}>
            {excluindo ? t("carregando", lang) : t("excluir", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
