"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapa 1: Frente de Caixa.
// Sub-etapa "abrir turno de caixa" JÁ grava de verdade em public.caixa/
// public.turno_caixa (PDV-FASE3-ETAPA1-VENDAS-SQL.sql, aplicado 2026-08-16).
// O carrinho em si continua em memória — "Finalizar Venda" (gravar venda +
// item_venda) e a baixa de estoque são as próximas sub-etapas, ainda não
// implementadas; o botão fica desabilitado de propósito por enquanto.
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
import {
  listarCaixasAtivos, buscarTurnoAbertoPorCaixa, abrirTurno,
  finalizarVenda, baixarEstoqueVenda, atualizarStatusBaixaEstoque,
  type Caixa, type TurnoCaixa, type ItemBaixaEstoque,
} from "../../../../lib/pdvVendaHelpers";

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
  itemAdicionado: { pt: "Adicionado: {nome}", en: "Added: {nome}", es: "Agregado: {nome}" },
  formaPagamentoLabel: { pt: "Forma de pagamento", en: "Payment method", es: "Forma de pago" },
  formaPagamentoSelecione: { pt: "Selecione…", en: "Select…", es: "Seleccione…" },
  formaPagamentoDinheiro: { pt: "Dinheiro", en: "Cash", es: "Efectivo" },
  formaPagamentoDebito: { pt: "Cartão de débito", en: "Debit card", es: "Tarjeta de débito" },
  formaPagamentoCredito: { pt: "Cartão de crédito", en: "Credit card", es: "Tarjeta de crédito" },
  formaPagamentoPix: { pt: "Pix", en: "Pix", es: "Pix" },
  formaPagamentoOutro: { pt: "Outro", en: "Other", es: "Otro" },
  cpfNotaLabel: { pt: "CPF na nota (opcional)", en: "Tax ID on receipt (optional)", es: "CPF en la nota (opcional)" },
  cpfNotaPlaceholder: { pt: "Somente números", en: "Numbers only", es: "Solo números" },
  cpfNotaInvalido: { pt: "CPF inválido — informe 11 números ou deixe em branco.", en: "Invalid tax ID — enter 11 digits or leave it blank.", es: "CPF inválido — indique 11 números o deje en blanco." },
  formaPagamentoObrigatoria: { pt: "Selecione a forma de pagamento.", en: "Select a payment method.", es: "Seleccione la forma de pago." },
  confirmarVenda: { pt: "Confirmar Venda", en: "Confirm Sale", es: "Confirmar Venta" },
  confirmandoVenda: { pt: "Confirmando…", en: "Confirming…", es: "Confirmando…" },
  cancelarPainel: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  vendaConcluida: { pt: "Venda concluída — {valor}", en: "Sale completed — {valor}", es: "Venta concluida — {valor}" },
  erroFinalizarGenerico: { pt: "Não foi possível finalizar a venda. Tente novamente.", en: "Could not complete the sale. Try again.", es: "No fue posible finalizar la venta. Intente de nuevo." },
  erroTurnoFechado: { pt: "O turno de caixa não está mais aberto. Atualize a página.", en: "The register shift is no longer open. Refresh the page.", es: "El turno de caja ya no está abierto. Actualice la página." },
  erroSemItens: { pt: "Adicione ao menos um item ao carrinho.", en: "Add at least one item to the cart.", es: "Agregue al menos un ítem al carrito." },
  erroProdutoSemPreco: { pt: "Um dos produtos não tem preço de venda definido.", en: "One of the products has no selling price set.", es: "Uno de los productos no tiene precio de venta definido." },
  baixandoEstoque: { pt: "Atualizando estoque…", en: "Updating stock…", es: "Actualizando stock…" },
  baixaEstoqueFalhouParcial: {
    pt: "Venda concluída, mas alguns itens não tiveram o estoque baixado.",
    en: "Sale completed, but some items did not have their stock deducted.",
    es: "Venta concluida, pero algunos ítems no tuvieron su stock descontado.",
  },
  pendenciaBaixaTitulo: { pt: "Itens sem baixa de estoque", en: "Items with pending stock deduction", es: "Ítems sin descuento de stock" },
  tentarNovamenteBaixa: { pt: "Tentar novamente", en: "Try again", es: "Intentar de nuevo" },
  tentandoNovamente: { pt: "Tentando…", en: "Trying…", es: "Intentando…" },
  baixaEstoqueConcluida: { pt: "Estoque atualizado.", en: "Stock updated.", es: "Stock actualizado." },
  semCaixaCadastrado: {
    pt: "Nenhum caixa cadastrado nesta empresa. Fale com o proprietário.",
    en: "No register set up for this company. Talk to the owner.",
    es: "Ningún caja registrada en esta empresa. Hable con el propietario.",
  },
  escolherCaixaTitulo: { pt: "Qual caixa você está operando?", en: "Which register are you working at?", es: "¿Qué caja está operando?" },
  escolherCaixaSelecione: { pt: "Selecione um caixa…", en: "Select a register…", es: "Seleccione una caja…" },
  escolherCaixaConfirmar: { pt: "Confirmar", en: "Confirm", es: "Confirmar" },
  verificandoCaixa: { pt: "Verificando o caixa…", en: "Checking the register…", es: "Verificando la caja…" },
  abrirCaixaTitulo: { pt: "Abrir Caixa", en: "Open Register", es: "Abrir Caja" },
  abrirCaixaSubtitulo: {
    pt: "Nenhum turno em aberto neste caixa. Informe o fundo de troco pra começar a vender.",
    en: "No shift open on this register yet. Enter the starting cash to begin selling.",
    es: "Ningún turno abierto en esta caja. Indique el fondo de caja para empezar a vender.",
  },
  fundoTroco: { pt: "Fundo de troco (dinheiro na gaveta)", en: "Starting cash (till float)", es: "Fondo de caja (dinero en la gaveta)" },
  observacaoOpcional: { pt: "Observação (opcional)", en: "Note (optional)", es: "Observación (opcional)" },
  abrirCaixaBotao: { pt: "Abrir Caixa", en: "Open Register", es: "Abrir Caja" },
  abrindoCaixa: { pt: "Abrindo…", en: "Opening…", es: "Abriendo…" },
  caixaAberto: { pt: "Caixa aberto.", en: "Register open.", es: "Caja abierta." },
  caixaJaEstavaAberto: { pt: "Esse caixa já estava aberto — retomando o turno em andamento.", en: "This register was already open — resuming the ongoing shift.", es: "Esa caja ya estaba abierta — retomando el turno en curso." },
  erroAbrirCaixa: { pt: "Não foi possível abrir o caixa. Tente novamente.", en: "Could not open the register. Try again.", es: "No fue posible abrir la caja. Intente de nuevo." },
  fundoTrocoInvalido: { pt: "Informe um valor de fundo de troco válido (0 ou mais).", en: "Enter a valid starting cash amount (0 or more).", es: "Indique un fondo de caja válido (0 o más)." },
  caixaLabel: { pt: "Caixa: {nome}", en: "Register: {nome}", es: "Caja: {nome}" },
  trocarCaixa: { pt: "Trocar caixa", en: "Switch register", es: "Cambiar caja" },
};

function t(chave: keyof typeof txt, lang: Idioma, vars?: Record<string, string | number>): string {
  let s = txt[chave][lang];
  if (vars) for (const k of Object.keys(vars)) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

// Mapeia o código AX0xx devolvido por finalizar_venda (PDV-FASE3-ETAPA2-
// FINALIZAR-VENDA-SQL.sql) pra mensagem traduzida — nunca mostra o texto em
// português que o Postgres devolve. Códigos sem mapeamento específico aqui
// (AX012 cliente inválido, AX013/AX014 item/produto — não deveriam
// acontecer nesta tela, que só manda produto_id vindo da própria busca) caem
// no genérico.
function mensagemErroFinalizar(codigo: string | undefined, lang: Idioma): string {
  switch (codigo) {
    case "AX009": return t("erroTurnoFechado", lang);
    case "AX010": return t("erroSemItens", lang);
    case "AX011": return t("cpfNotaInvalido", lang);
    case "AX015": return t("erroProdutoSemPreco", lang);
    default: return t("erroFinalizarGenerico", lang);
  }
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
  const [userId, setUserId] = useState<string | null>(null);
  const [carregandoPapel, setCarregandoPapel] = useState(true);

  // Sub-etapa "abrir turno de caixa" — turno é por CAIXA físico (chave em
  // localStorage por empresa, pensado pra terminal fixo: cada computador do
  // balcão sempre opera o mesmo caixa), não por usuário. Enquanto não há
  // turno aberto pro caixa escolhido, a tela mostra o painel de abertura em
  // vez do carrinho — vender sem turno não é permitido (venda.turno_caixa_id
  // é NOT NULL).
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [carregandoCaixas, setCarregandoCaixas] = useState(true);
  const [caixaId, setCaixaId] = useState<string | null>(null);
  const [turno, setTurno] = useState<TurnoCaixa | null>(null);
  const [carregandoTurno, setCarregandoTurno] = useState(false);
  const [valorAberturaInput, setValorAberturaInput] = useState("");
  const [observacaoAbertura, setObservacaoAbertura] = useState("");
  const [abrindoCaixaFlag, setAbrindoCaixaFlag] = useState(false);

  // Sub-etapa "Finalizar Venda" — painel de confirmação (forma de pagamento
  // + CPF opcional na nota) e, depois de gravada, a baixa de estoque item a
  // item. pendenciaBaixa é o que garante que "quais produtos não baixaram"
  // fica visível na tela até resolver — venda.estoque_baixado (banco) é a
  // fonte durável, isto aqui é só a projeção na tela da sessão atual.
  const [painelFinalizarAberto, setPainelFinalizarAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [cpfNotaInput, setCpfNotaInput] = useState("");
  const [finalizandoVenda, setFinalizandoVenda] = useState(false);
  const [baixandoEstoqueFlag, setBaixandoEstoqueFlag] = useState(false);
  const [pendenciaBaixa, setPendenciaBaixa] = useState<{ vendaId: string; totalItens: number; itensFalhos: ItemBaixaEstoque[] } | null>(null);
  const [retentandoBaixa, setRetentandoBaixa] = useState(false);

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
      const { data: authData } = await supabase.auth.getUser();
      setUserId(authData?.user?.id || null);
      if (!id) { setCarregandoPapel(false); return; }
      setPapel(await obterMeuPapel(id));
      setCarregandoPapel(false);
    })();
  }, [supabase]);

  // Carrega os caixas da empresa e retoma o caixa escolhido neste terminal
  // da última vez (localStorage), se ele ainda estiver ativo.
  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      setCarregandoCaixas(true);
      const dados = await listarCaixasAtivos(empresaId);
      setCaixas(dados);
      setCarregandoCaixas(false);
      const salvo = typeof window !== "undefined" ? window.localStorage.getItem(`axioma_pdv_caixa_${empresaId}`) : null;
      if (salvo && dados.some((c) => c.id === salvo)) setCaixaId(salvo);
    })();
  }, [empresaId]);

  // Assim que um caixa está escolhido, verifica se já existe turno aberto
  // nele (aberto por qualquer pessoa, inclusive outro operador mais cedo).
  useEffect(() => {
    if (!caixaId) { setTurno(null); return; }
    setCarregandoTurno(true);
    buscarTurnoAbertoPorCaixa(caixaId).then((t) => {
      setTurno(t);
      setCarregandoTurno(false);
    });
  }, [caixaId]);

  function escolherCaixa(id: string) {
    setCaixaId(id);
    if (empresaId && typeof window !== "undefined") window.localStorage.setItem(`axioma_pdv_caixa_${empresaId}`, id);
  }

  function trocarCaixa() {
    setCaixaId(null);
    setTurno(null);
    if (empresaId && typeof window !== "undefined") window.localStorage.removeItem(`axioma_pdv_caixa_${empresaId}`);
  }

  async function handleAbrirCaixa() {
    if (!empresaId || !caixaId || !userId) return;
    const valor = Number(valorAberturaInput.replace(",", "."));
    if (isNaN(valor) || valor < 0) { mostrarToast(t("fundoTrocoInvalido", lang), "erro"); return; }

    setAbrindoCaixaFlag(true);
    const resultado = await abrirTurno(empresaId, caixaId, userId, valor, observacaoAbertura.trim() || undefined);
    setAbrindoCaixaFlag(false);

    if (resultado.jaAberto) {
      const existente = await buscarTurnoAbertoPorCaixa(caixaId);
      setTurno(existente);
      mostrarToast(t("caixaJaEstavaAberto", lang), "info");
      return;
    }
    if (resultado.erro || !resultado.turno) {
      mostrarToast(t("erroAbrirCaixa", lang), "erro");
      return;
    }
    setTurno(resultado.turno);
    setValorAberturaInput("");
    setObservacaoAbertura("");
    mostrarToast(t("caixaAberto", lang), "ok");
  }

  async function handleConfirmarVenda() {
    if (!empresaId || !userId || !turno || carrinho.length === 0) return;
    if (!formaPagamento) { mostrarToast(t("formaPagamentoObrigatoria", lang), "erro"); return; }
    const cpfLimpo = cpfNotaInput.replace(/\D/g, "");
    if (cpfLimpo && cpfLimpo.length !== 11) { mostrarToast(t("cpfNotaInvalido", lang), "erro"); return; }

    setFinalizandoVenda(true);
    const itensRpc = carrinho.map((i) => ({ produto_id: i.produto.id, quantidade: i.quantidade }));
    const resultado = await finalizarVenda(turno.id, itensRpc, {
      formaPagamento, cpfNota: cpfLimpo || undefined,
    });
    setFinalizandoVenda(false);

    if (resultado.erro || !resultado.vendaId) {
      mostrarToast(mensagemErroFinalizar(resultado.codigo, lang), "erro");
      return; // carrinho intacto — operador pode corrigir e tentar de novo
    }

    // Venda gravada — daqui pra frente é sucesso real, então já limpa o
    // carrinho e fecha o painel. Guarda os itens ANTES de limpar, pra baixa
    // de estoque não depender mais do estado do carrinho.
    const itensParaBaixa: ItemBaixaEstoque[] = carrinho.map((i) => ({ produtoId: i.produto.id, nome: i.produto.nome, quantidade: i.quantidade }));
    const vendaId = resultado.vendaId;
    mostrarToast(t("vendaConcluida", lang, { valor: moeda(resultado.valorTotal) }), "ok");
    setCarrinho([]);
    setPainelFinalizarAberto(false);
    setFormaPagamento("");
    setCpfNotaInput("");

    setBaixandoEstoqueFlag(true);
    const { falhas } = await baixarEstoqueVenda(empresaId, userId, vendaId, itensParaBaixa);
    await atualizarStatusBaixaEstoque(vendaId, falhas.length === 0 ? "concluido" : falhas.length === itensParaBaixa.length ? "pendente" : "parcial");
    setBaixandoEstoqueFlag(false);

    if (falhas.length > 0) {
      setPendenciaBaixa({ vendaId, totalItens: itensParaBaixa.length, itensFalhos: falhas });
      mostrarToast(t("baixaEstoqueFalhouParcial", lang), "erro");
    }
  }

  async function handleTentarNovamenteBaixa() {
    if (!pendenciaBaixa || !empresaId || !userId) return;
    setRetentandoBaixa(true);
    const { falhas } = await baixarEstoqueVenda(empresaId, userId, pendenciaBaixa.vendaId, pendenciaBaixa.itensFalhos);
    await atualizarStatusBaixaEstoque(pendenciaBaixa.vendaId, falhas.length === 0 ? "concluido" : falhas.length === pendenciaBaixa.totalItens ? "pendente" : "parcial");
    setRetentandoBaixa(false);

    if (falhas.length === 0) {
      setPendenciaBaixa(null);
      mostrarToast(t("baixaEstoqueConcluida", lang), "ok");
    } else {
      setPendenciaBaixa({ ...pendenciaBaixa, itensFalhos: falhas });
      mostrarToast(t("baixaEstoqueFalhouParcial", lang), "erro");
    }
  }

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

  if (carregandoPapel || carregandoCaixas) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (caixas.length === 0) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <p className="text-sm py-8 text-center" style={{ color: "#f87171" }}>{t("semCaixaCadastrado", lang)}</p>
      </PdvLayout>
    );
  }

  if (!caixaId) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <EscolherCaixaPanel lang={lang} caixas={caixas} onEscolher={escolherCaixa} />
      </PdvLayout>
    );
  }

  if (carregandoTurno) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <EstadoCarregando lang={lang} texto={t("verificandoCaixa", lang)} />
      </PdvLayout>
    );
  }

  if (!turno) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
        <AbrirCaixaPanel
          lang={lang}
          valorAberturaInput={valorAberturaInput} onValorAbertura={setValorAberturaInput}
          observacao={observacaoAbertura} onObservacao={setObservacaoAbertura}
          abrindo={abrindoCaixaFlag} onAbrir={handleAbrirCaixa}
        />
        {toast && <Toast toast={toast} />}
      </PdvLayout>
    );
  }

  const caixaAtual = caixas.find((c) => c.id === caixaId);

  return (
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara}>
      <div className="flex items-center justify-between mb-4 text-xs">
        <span style={{ opacity: 0.7 }}>{t("caixaLabel", lang, { nome: caixaAtual?.nome || "" })}</span>
        <button onClick={trocarCaixa} className="font-semibold underline" style={{ opacity: 0.7 }}>{t("trocarCaixa", lang)}</button>
      </div>

      {pendenciaBaixa && (
        <PendenciaBaixaBanner lang={lang} pendencia={pendenciaBaixa} tentando={retentandoBaixa} onTentarNovamente={handleTentarNovamenteBaixa} />
      )}

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
            onFinalizar={() => setPainelFinalizarAberto(true)}
          />
        </div>
      </div>

      {painelFinalizarAberto && (
        <FinalizarVendaModal
          lang={lang} total={total}
          formaPagamento={formaPagamento} onFormaPagamento={setFormaPagamento}
          cpfNotaInput={cpfNotaInput} onCpfNotaInput={setCpfNotaInput}
          confirmando={finalizandoVenda}
          onConfirmar={handleConfirmarVenda}
          onCancelar={() => setPainelFinalizarAberto(false)}
        />
      )}

      {baixandoEstoqueFlag && (
        <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ background: "rgba(2,8,16,0.5)" }}>
          <div className="rounded-xl px-5 py-4 flex items-center gap-2" style={{ background: "#0b1622", color: "#fff" }}>
            <Loader2 className="animate-spin" size={16} />
            <span className="text-sm">{t("baixandoEstoque", lang)}</span>
          </div>
        </div>
      )}

      {toast && <Toast toast={toast} />}
    </PdvLayout>
  );
}

function Toast({ toast }: { toast: { msg: string; tipo: "ok" | "erro" | "info" } }) {
  return (
    <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
      style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
      {toast.msg}
    </div>
  );
}

function EstadoCarregando({ lang, texto }: { lang: Idioma; texto?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{texto || t("carregando", lang)}</span>
    </div>
  );
}

function EscolherCaixaPanel({ lang, caixas, onEscolher }: { lang: Idioma; caixas: Caixa[]; onEscolher: (id: string) => void }) {
  const { tokens } = useTemaPdv();
  const [selecionado, setSelecionado] = useState("");
  return (
    <div className="max-w-sm mx-auto rounded-xl p-5 mt-8" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <h3 className="text-sm font-bold mb-3" style={{ color: tokens.texto }}>{t("escolherCaixaTitulo", lang)}</h3>
      <select value={selecionado} onChange={(e) => setSelecionado(e.target.value)}
        className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-3"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
        <option value="">{t("escolherCaixaSelecione", lang)}</option>
        {caixas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <button onClick={() => selecionado && onEscolher(selecionado)} disabled={!selecionado}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {t("escolherCaixaConfirmar", lang)}
      </button>
    </div>
  );
}

function AbrirCaixaPanel({ lang, valorAberturaInput, onValorAbertura, observacao, onObservacao, abrindo, onAbrir }: {
  lang: Idioma; valorAberturaInput: string; onValorAbertura: (v: string) => void;
  observacao: string; onObservacao: (v: string) => void;
  abrindo: boolean; onAbrir: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="max-w-sm mx-auto rounded-xl p-5 mt-8" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <h3 className="text-sm font-bold mb-1" style={{ color: tokens.texto }}>{t("abrirCaixaTitulo", lang)}</h3>
      <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("abrirCaixaSubtitulo", lang)}</p>

      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("fundoTroco", lang)}</label>
      <input
        value={valorAberturaInput} onChange={(e) => onValorAbertura(e.target.value)}
        inputMode="decimal" placeholder="0,00" autoFocus
        className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-3"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
      />

      <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("observacaoOpcional", lang)}</label>
      <input
        value={observacao} onChange={(e) => onObservacao(e.target.value)}
        className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-4"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
      />

      <button onClick={onAbrir} disabled={abrindo}
        className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {abrindo && <Loader2 className="animate-spin" size={14} />}
        {abrindo ? t("abrindoCaixa", lang) : t("abrirCaixaBotao", lang)}
      </button>
    </div>
  );
}

function FinalizarVendaModal({
  lang, total, formaPagamento, onFormaPagamento, cpfNotaInput, onCpfNotaInput, confirmando, onConfirmar, onCancelar,
}: {
  lang: Idioma; total: number;
  formaPagamento: string; onFormaPagamento: (v: string) => void;
  cpfNotaInput: string; onCpfNotaInput: (v: string) => void;
  confirmando: boolean; onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.5)" }}>
      <div className="w-full max-w-sm rounded-xl p-5" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("finalizarVenda", lang)}</h3>
          <span className="text-lg font-extrabold" style={{ color: tokens.acento }}>{moeda(total)}</span>
        </div>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("formaPagamentoLabel", lang)}</label>
        <select value={formaPagamento} onChange={(e) => onFormaPagamento(e.target.value)}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-3"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
          <option value="">{t("formaPagamentoSelecione", lang)}</option>
          <option value="dinheiro">{t("formaPagamentoDinheiro", lang)}</option>
          <option value="debito">{t("formaPagamentoDebito", lang)}</option>
          <option value="credito">{t("formaPagamentoCredito", lang)}</option>
          <option value="pix">{t("formaPagamentoPix", lang)}</option>
          <option value="outro">{t("formaPagamentoOutro", lang)}</option>
        </select>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("cpfNotaLabel", lang)}</label>
        <input
          value={cpfNotaInput} onChange={(e) => onCpfNotaInput(e.target.value)}
          placeholder={t("cpfNotaPlaceholder", lang)} inputMode="numeric"
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={confirmando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.cardTexto }}>
            {t("cancelarPainel", lang)}
          </button>
          <button onClick={onConfirmar} disabled={confirmando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {confirmando && <Loader2 className="animate-spin" size={14} />}
            {confirmando ? t("confirmandoVenda", lang) : t("confirmarVenda", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function PendenciaBaixaBanner({ lang, pendencia, tentando, onTentarNovamente }: {
  lang: Idioma;
  pendencia: { vendaId: string; totalItens: number; itensFalhos: ItemBaixaEstoque[] };
  tentando: boolean;
  onTentarNovamente: () => void;
}) {
  return (
    <div className="mb-4 rounded-xl p-4" style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.4)" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: "#f87171" }}>{t("pendenciaBaixaTitulo", lang)}</p>
          <p className="text-xs" style={{ color: "#f87171", opacity: 0.85 }}>
            {pendencia.itensFalhos.map((i) => i.nome).join(", ")}
          </p>
        </div>
        <button onClick={onTentarNovamente} disabled={tentando}
          className="px-3 py-2 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-2 shrink-0"
          style={{ background: "#f87171", color: "#020810" }}>
          {tentando && <Loader2 className="animate-spin" size={12} />}
          {tentando ? t("tentandoNovamente", lang) : t("tentarNovamenteBaixa", lang)}
        </button>
      </div>
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
