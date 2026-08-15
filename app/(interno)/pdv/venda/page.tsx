"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapa 1: Frente de Caixa (carrinho em
// memória). Ainda NÃO grava turno_caixa/venda/item_venda — essas tabelas
// existem só como SQL de revisão (PDV-FASE3-ETAPA1-VENDAS-SQL.sql, não
// aplicado). "Finalizar Venda" fica desabilitado de propósito nesta etapa.
//
// Acessível a qualquer papel com vínculo na empresa (dono vende também em
// loja pequena) — diferente do Catálogo (/pdv), que é ferramenta de gestão e
// continua bloqueada pro operador. A busca de produto aqui sempre passa
// `papel` pra listarProdutosPdv(), que troca a fonte pra vw_produtos_seguro
// quando quem está logado é operador — nunca custo/margem chegam nesta tela,
// pra ninguém, porque a consulta nem seleciona essas colunas.
import { useEffect, useMemo, useRef, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { listarProdutosPdv, type ProdutoPdv } from "../../../../lib/pdvHelpers";

const txt = {
  titulo: { pt: "Frente de Caixa", en: "Checkout", es: "Caja" },
  subtitulo: {
    pt: "Busque por nome, SKU ou bipe o código de barras.",
    en: "Search by name, SKU, or scan the barcode.",
    es: "Busque por nombre, SKU o escanee el código de barras.",
  },
  buscarPlaceholder: { pt: "Nome, SKU ou código de barras…", en: "Name, SKU or barcode…", es: "Nombre, SKU o código de barras…" },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  buscando: { pt: "Buscando…", en: "Searching…", es: "Buscando…" },
  digiteParaBuscar: { pt: "Digite ao menos 2 caracteres pra buscar.", en: "Type at least 2 characters to search.", es: "Escriba al menos 2 caracteres para buscar." },
  semResultado: { pt: "Nenhum produto encontrado.", en: "No product found.", es: "Ningún producto encontrado." },
  estoque: { pt: "estoque", en: "stock", es: "stock" },
  precoNaoDefinido: { pt: "preço não definido", en: "price not set", es: "precio no definido" },
  carrinho: { pt: "Carrinho", en: "Cart", es: "Carrito" },
  carrinhoVazio: { pt: "Carrinho vazio. Busque um produto ao lado.", en: "Cart is empty. Search a product on the side.", es: "Carrito vacío. Busque un producto al lado." },
  limparCarrinho: { pt: "Limpar carrinho", en: "Clear cart", es: "Vaciar carrito" },
  total: { pt: "Total", en: "Total", es: "Total" },
  finalizarVenda: { pt: "Finalizar Venda", en: "Complete Sale", es: "Finalizar Venta" },
  finalizarEmBreve: {
    pt: "Fechamento de venda chega na próxima etapa — por enquanto o carrinho é só demonstração, nada é gravado.",
    en: "Completing a sale arrives in the next stage — for now the cart is a preview, nothing is saved.",
    es: "El cierre de venta llega en la próxima etapa — por ahora el carrito es solo demostración, nada se guarda.",
  },
  itemAdicionado: { pt: "Adicionado: {nome}", en: "Added: {nome}", es: "Agregado: {nome}" },
};

function t(chave: keyof typeof txt, lang: Idioma, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

function moeda(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type ItemCarrinho = { produto: ProdutoPdv; quantidade: number };

export default function PdvVendaPage() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;

  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!), []);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [resultados, setResultados] = useState<ProdutoPdv[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);
  const inputBuscaRef = useRef<HTMLInputElement>(null);

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
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

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    const termo = buscaDebounced.trim();
    if (!empresaId || termo.length < 2) { setResultados([]); return; }
    setBuscando(true);
    listarProdutosPdv(empresaId, { busca: termo, pagina: 0 }, papel).then(({ dados }) => {
      setResultados(dados);
      setBuscando(false);
      // Fluxo de bipagem: um bip de código de barras devolve exatamente um
      // produto batendo o código exato — adiciona sozinho, sem exigir clique.
      if (dados.length === 1 && dados[0].codigo_barras === termo) {
        adicionarAoCarrinho(dados[0]);
        setBusca("");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaDebounced, empresaId, papel]);

  function adicionarAoCarrinho(produto: ProdutoPdv) {
    setCarrinho((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id);
      if (existe) return atual.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      return [...atual, { produto, quantidade: 1 }];
    });
    mostrarToast(t("itemAdicionado", lang, { nome: produto.nome }), "ok");
    inputBuscaRef.current?.focus();
  }

  function alterarQuantidade(produtoId: string, delta: number) {
    setCarrinho((atual) =>
      atual
        .map((i) => (i.produto.id === produtoId ? { ...i, quantidade: i.quantidade + delta } : i))
        .filter((i) => i.quantidade > 0)
    );
  }

  function removerItem(produtoId: string) {
    setCarrinho((atual) => atual.filter((i) => i.produto.id !== produtoId));
  }

  const total = useMemo(
    () => carrinho.reduce((soma, i) => soma + (i.produto.preco_venda ?? i.produto.preco_sugerido ?? 0) * i.quantidade, 0),
    [carrinho]
  );

  const voltarPara = papel === "operador" ? "/dashboard" : "/pdv";

  if (carregandoPapel) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <CampoBusca lang={lang} busca={busca} onBusca={setBusca} inputRef={inputBuscaRef} />
          <ResultadosBusca
            lang={lang} termo={buscaDebounced} resultados={resultados} buscando={buscando}
            onAdicionar={adicionarAoCarrinho}
          />
        </div>
        <div className="lg:col-span-2">
          <PainelCarrinho
            lang={lang} carrinho={carrinho} total={total}
            onAlterarQuantidade={alterarQuantidade} onRemover={removerItem}
            onLimpar={() => setCarrinho([])}
            onFinalizar={() => mostrarToast(t("finalizarEmBreve", lang), "info")}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}
    </PdvLayout>
  );
}

function EstadoCarregando({ lang }: { lang: Idioma }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{t("carregando", lang)}</span>
    </div>
  );
}

function CampoBusca({ lang, busca, onBusca, inputRef }: {
  lang: Idioma; busca: string; onBusca: (v: string) => void; inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="relative mb-4">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.textoMuted }} />
      <input
        ref={inputRef} autoFocus value={busca} onChange={(e) => onBusca(e.target.value)}
        placeholder={t("buscarPlaceholder", lang)}
        className="w-full pl-9 pr-3 py-3 rounded-xl text-sm outline-none"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
      />
    </div>
  );
}

function ResultadosBusca({ lang, termo, resultados, buscando, onAdicionar }: {
  lang: Idioma; termo: string; resultados: ProdutoPdv[]; buscando: boolean; onAdicionar: (p: ProdutoPdv) => void;
}) {
  const { tokens } = useTemaPdv();

  if (buscando) return <EstadoCarregando lang={lang} />;
  if (termo.trim().length < 2) return <p className="text-sm py-6 text-center" style={{ color: tokens.textoMuted }}>{t("digiteParaBuscar", lang)}</p>;
  if (resultados.length === 0) return <p className="text-sm py-6 text-center" style={{ color: tokens.textoMuted }}>{t("semResultado", lang)}</p>;

  return (
    <div className="space-y-2">
      {resultados.map((produto) => (
        <button key={produto.id} onClick={() => onAdicionar(produto)}
          className="w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-transform hover:scale-[1.01]"
          style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: tokens.cardTexto }}>{produto.nome}</p>
            <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.7 }}>
              {produto.saldo_disponivel} {t("estoque", lang)}
              {produto.codigo_barras ? ` · ${produto.codigo_barras}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold" style={{ color: tokens.acento }}>
              {produto.preco_venda ? moeda(produto.preco_venda) : t("precoNaoDefinido", lang)}
            </span>
            <span className="p-1.5 rounded-lg" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
              <Plus size={14} />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

function PainelCarrinho({ lang, carrinho, total, onAlterarQuantidade, onRemover, onLimpar, onFinalizar }: {
  lang: Idioma; carrinho: ItemCarrinho[]; total: number;
  onAlterarQuantidade: (produtoId: string, delta: number) => void;
  onRemover: (produtoId: string) => void;
  onLimpar: () => void;
  onFinalizar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="rounded-xl p-4" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} style={{ color: tokens.acento }} />
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("carrinho", lang)}</h3>
        </div>
        {carrinho.length > 0 && (
          <button onClick={onLimpar} className="text-xs font-semibold" style={{ color: tokens.textoMuted }}>
            {t("limparCarrinho", lang)}
          </button>
        )}
      </div>

      {carrinho.length === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: tokens.textoMuted }}>{t("carrinhoVazio", lang)}</p>
      ) : (
        <div className="space-y-2 mb-4 max-h-[420px] overflow-y-auto">
          {carrinho.map(({ produto, quantidade }) => {
            const precoUnit = produto.preco_venda ?? produto.preco_sugerido ?? 0;
            return (
              <div key={produto.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate" style={{ color: tokens.cardTexto }}>{produto.nome}</p>
                  <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.7 }}>{moeda(precoUnit)} × {quantidade} = {moeda(precoUnit * quantidade)}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onAlterarQuantidade(produto.id, -1)} className="p-1 rounded-md" style={{ background: tokens.inputBg, color: tokens.cardTexto }}><Minus size={12} /></button>
                  <span className="text-xs w-5 text-center" style={{ color: tokens.cardTexto }}>{quantidade}</span>
                  <button onClick={() => onAlterarQuantidade(produto.id, 1)} className="p-1 rounded-md" style={{ background: tokens.inputBg, color: tokens.cardTexto }}><Plus size={12} /></button>
                  <button onClick={() => onRemover(produto.id)} className="p-1 rounded-md ml-1" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between mb-3 pt-3" style={{ borderTop: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <span className="text-sm font-semibold" style={{ color: tokens.texto }}>{t("total", lang)}</span>
        <span className="text-xl font-extrabold" style={{ color: tokens.acento }}>{moeda(total)}</span>
      </div>

      <button onClick={onFinalizar} disabled={carrinho.length === 0}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {t("finalizarVenda", lang)}
      </button>
    </div>
  );
}
