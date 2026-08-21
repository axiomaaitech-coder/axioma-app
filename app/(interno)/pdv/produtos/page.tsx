"use client";
// 🦅 AXIOMA AI.TECH — PDV: "Produtos Cadastrados" — visão plana de TODO o
// catálogo da empresa, agrupada por nicho→categoria→sub-nicho (mesmas 3
// colunas da taxonomia curada, ver lib/pdvCatalogoTaxonomia.ts), pensada pra
// achar/editar/excluir um produto sem precisar navegar nicho por nicho como
// o Catálogo (app/(interno)/pdv/page.tsx) já faz. Reaproveita 100%: o mesmo
// formulário de cadastro (/pdv/cadastro?id=) pra editar, o mesmo
// excluirProduto() (lib/estoqueHelpers.ts) pra excluir — nenhuma lógica nova
// de venda/turno/finalizar, nenhuma mudança na navegação por nicho existente.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Search, Loader2, Pencil, Trash2 } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { excluirProduto } from "../../../../lib/estoqueHelpers";
import { buscarNicho } from "../../../../lib/pdvCatalogoTaxonomia";
import { listarTodosProdutosPdv, type ProdutoPdv } from "../../../../lib/pdvHelpers";

// Preço por unidade precisa de 2 casas SEMPRE — fBRL (lib/cfoCore.ts) é pra
// totais agregados grandes (arredonda pro real cheio de propósito), errado
// aqui. Mesmo moeda() local que app/(interno)/pdv/page.tsx e
// app/(interno)/pdv/venda/page.tsx já usam pro mesmo tipo de campo.
function moeda(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const txt = {
  titulo: { pt: "PDV — Produtos Cadastrados", en: "POS — Registered Products", es: "PDV — Productos Registrados" },
  subtitulo: {
    pt: "Veja, edite ou exclua qualquer produto do seu catálogo.",
    en: "View, edit or delete any product in your catalog.",
    es: "Vea, edite o elimine cualquier producto de su catálogo.",
  },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  buscarPlaceholder: { pt: "Buscar por nome ou código de barras…", en: "Search by name or barcode…", es: "Buscar por nombre o código de barras…" },
  totalProdutos: { pt: "{n} produto(s) cadastrado(s)", en: "{n} registered product(s)", es: "{n} producto(s) registrado(s)" },
  semProdutos: { pt: "Nenhum produto cadastrado ainda.", en: "No products registered yet.", es: "Ningún producto registrado todavía." },
  semResultadoBusca: { pt: "Nenhum produto encontrado para essa busca.", en: "No product found for this search.", es: "Ningún producto encontrado para esta búsqueda." },
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
const SEM_SUB = "__sem_sub__";

type SubGrupo = { chave: string; label: string; produtos: ProdutoPdv[] };
type CategoriaGrupo = { chave: string; label: string; subs: SubGrupo[]; total: number };
type NichoGrupo = { chave: string; label: string; categorias: CategoriaGrupo[]; total: number };

// Agrupa em 3 níveis reaproveitando as MESMAS colunas do Catálogo (segmento,
// categoria, subcategoria — ver lib/pdvHelpers.ts). `produtos` já chega
// ordenado por nome da consulta (listarTodosProdutosPdv), e filter/Map
// preservam essa ordem — nenhum resort de produto dentro do grupo é preciso,
// só os RÓTULOS de nicho/categoria/sub-nicho são ordenados alfabeticamente.
function montarArvore(produtos: ProdutoPdv[], lang: Idioma): NichoGrupo[] {
  const porNicho = new Map<string, ProdutoPdv[]>();
  for (const p of produtos) {
    const seg = p.segmento || "";
    if (!porNicho.has(seg)) porNicho.set(seg, []);
    porNicho.get(seg)!.push(p);
  }

  const nichos: NichoGrupo[] = [];
  for (const [seg, prodsNicho] of porNicho) {
    const nichoLabel = buscarNicho(seg)?.label[lang] || seg || "—";

    const porCategoria = new Map<string, ProdutoPdv[]>();
    for (const p of prodsNicho) {
      const cat = (p.categoria || "").trim() || SEM_CATEGORIA;
      if (!porCategoria.has(cat)) porCategoria.set(cat, []);
      porCategoria.get(cat)!.push(p);
    }

    const categorias: CategoriaGrupo[] = [];
    for (const [cat, prodsCat] of porCategoria) {
      const catLabel = cat === SEM_CATEGORIA ? t("semCategoria", lang) : cat;

      const porSub = new Map<string, ProdutoPdv[]>();
      for (const p of prodsCat) {
        const sub = (p.subcategoria || "").trim() || SEM_SUB;
        if (!porSub.has(sub)) porSub.set(sub, []);
        porSub.get(sub)!.push(p);
      }

      const subs: SubGrupo[] = Array.from(porSub, ([sub, prodsSub]) => ({
        chave: `${seg}|${cat}|${sub}`,
        label: sub === SEM_SUB ? t("semSubNicho", lang) : sub,
        produtos: prodsSub,
      })).sort((a, b) => a.label.localeCompare(b.label, lang));

      categorias.push({ chave: `${seg}|${cat}`, label: catLabel, subs, total: prodsCat.length });
    }
    categorias.sort((a, b) => a.label.localeCompare(b.label, lang));

    nichos.push({ chave: seg, label: nichoLabel, categorias, total: prodsNicho.length });
  }
  nichos.sort((a, b) => a.label.localeCompare(b.label, lang));
  return nichos;
}

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

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [expandido, setExpandido] = useState<Set<string>>(new Set());
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<ProdutoPdv | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    (async () => {
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

  const produtosFiltrados = useMemo(() => {
    const termo = buscaDebounced.trim().toLowerCase();
    if (!termo) return produtos;
    return produtos.filter((p) => p.nome.toLowerCase().includes(termo) || (p.codigo_barras || "").toLowerCase().includes(termo));
  }, [produtos, buscaDebounced]);

  const arvore = useMemo(() => montarArvore(produtosFiltrados, lang), [produtosFiltrados, lang]);
  const buscaAtiva = buscaDebounced.trim().length > 0;

  function alternarExpandido(chave: string) {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(chave)) next.delete(chave); else next.add(chave);
      return next;
    });
  }
  const estaExpandido = (chave: string) => buscaAtiva || expandido.has(chave);

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

  if (carregandoPapel || papel === "operador") {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv">
      {erro && <AvisoErro texto={erro} />}

      <BarraBusca lang={lang} busca={busca} onBusca={setBusca} />

      {carregandoProdutos ? (
        <EstadoCarregando lang={lang} />
      ) : produtos.length === 0 ? (
        <EstadoVazio texto={t("semProdutos", lang)} />
      ) : (
        <>
          <ResumoTotal lang={lang} total={produtos.length} />
          {arvore.length === 0 ? (
            <EstadoVazio texto={t("semResultadoBusca", lang)} />
          ) : (
            <div className="space-y-2">
              {arvore.map((nicho) => (
                <GrupoNicho
                  key={nicho.chave} grupo={nicho} lang={lang}
                  expandido={estaExpandido} onToggle={alternarExpandido}
                  onExcluir={setProdutoParaExcluir}
                />
              ))}
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

// ============================================================================
// SUBCOMPONENTES — cada um lê o próprio tema via useTemaPdv() (só funciona
// corretamente sendo componente próprio, renderizado dentro da árvore do
// PdvLayout/Provider — mesmo padrão de app/(interno)/pdv/page.tsx).
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

function EstadoVazio({ texto }: { texto: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 px-4 text-center">
      <p className="text-sm" style={{ color: tokens.textoSecundario }}>{texto}</p>
    </div>
  );
}

function ResumoTotal({ lang, total }: { lang: Idioma; total: number }) {
  const { tokens } = useTemaPdv();
  return <p className="text-xs mb-3" style={{ color: tokens.textoMuted }}>{t("totalProdutos", lang, { n: total })}</p>;
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

function CabecalhoGrupo({ label, total, nivel, onClick, expandido }: {
  label: string; total: number; nivel: 0 | 1 | 2; onClick: () => void; expandido: boolean;
}) {
  const { tokens } = useTemaPdv();
  const tamanhos = ["text-sm font-bold", "text-sm font-semibold", "text-xs font-semibold"] as const;
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-1.5 py-2.5 px-2 rounded-lg text-left"
      style={{ marginLeft: nivel * 16 }}>
      {expandido ? <ChevronDown size={14} style={{ color: tokens.acento }} /> : <ChevronRight size={14} style={{ color: tokens.acento }} />}
      <span className={tamanhos[nivel]} style={{ color: tokens.cardTexto }}>{label}</span>
      <span className="text-xs" style={{ color: tokens.textoMuted }}>({total})</span>
    </button>
  );
}

function GrupoNicho({ grupo, lang, expandido, onToggle, onExcluir }: {
  grupo: NichoGrupo; lang: Idioma; expandido: (chave: string) => boolean; onToggle: (chave: string) => void; onExcluir: (p: ProdutoPdv) => void;
}) {
  const { tokens } = useTemaPdv();
  const aberto = expandido(grupo.chave);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <CabecalhoGrupo label={grupo.label} total={grupo.total} nivel={0} onClick={() => onToggle(grupo.chave)} expandido={aberto} />
      {aberto && (
        <div className="pb-2">
          {grupo.categorias.map((cat) => (
            <GrupoCategoria key={cat.chave} grupo={cat} lang={lang} expandido={expandido} onToggle={onToggle} onExcluir={onExcluir} />
          ))}
        </div>
      )}
    </div>
  );
}

function GrupoCategoria({ grupo, lang, expandido, onToggle, onExcluir }: {
  grupo: CategoriaGrupo; lang: Idioma; expandido: (chave: string) => boolean; onToggle: (chave: string) => void; onExcluir: (p: ProdutoPdv) => void;
}) {
  const aberto = expandido(grupo.chave);
  return (
    <div>
      <CabecalhoGrupo label={grupo.label} total={grupo.total} nivel={1} onClick={() => onToggle(grupo.chave)} expandido={aberto} />
      {aberto && (
        <div>
          {grupo.subs.map((sub) => (
            <GrupoSub key={sub.chave} grupo={sub} lang={lang} expandido={expandido} onToggle={onToggle} onExcluir={onExcluir} />
          ))}
        </div>
      )}
    </div>
  );
}

function GrupoSub({ grupo, lang, expandido, onToggle, onExcluir }: {
  grupo: SubGrupo; lang: Idioma; expandido: (chave: string) => boolean; onToggle: (chave: string) => void; onExcluir: (p: ProdutoPdv) => void;
}) {
  const aberto = expandido(grupo.chave);
  return (
    <div>
      <CabecalhoGrupo label={grupo.label} total={grupo.produtos.length} nivel={2} onClick={() => onToggle(grupo.chave)} expandido={aberto} />
      {aberto && (
        <div className="space-y-2 px-2 pb-2" style={{ marginLeft: 48 }}>
          {grupo.produtos.map((p) => (
            <LinhaProduto key={p.id} produto={p} lang={lang} onExcluir={onExcluir} />
          ))}
        </div>
      )}
    </div>
  );
}

function LinhaProduto({ produto, lang, onExcluir }: { produto: ProdutoPdv; lang: Idioma; onExcluir: (p: ProdutoPdv) => void }) {
  const { tokens } = useTemaPdv();
  const preco = produto.preco_venda ?? produto.preco_sugerido;
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-xl flex-wrap" style={{ background: tokens.fundoContainer, border: `1px solid ${tokens.bordaContainer}` }}>
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
        <a href={`/pdv/cadastro?id=${produto.id}`} title={t("editar", lang)} className="p-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85, border: `1px solid ${tokens.cardTexto}` }}>
          <Pencil size={14} />
        </a>
        <button onClick={() => onExcluir(produto)} title={t("excluir", lang)} className="p-1.5 rounded-lg" style={{ color: tokens.cardTexto, opacity: 0.85, border: `1px solid ${tokens.cardTexto}` }}>
          <Trash2 size={14} />
        </button>
      </div>
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
