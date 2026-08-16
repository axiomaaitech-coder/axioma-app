"use client";
// 🦅 AXIOMA AI.TECH — PDV Fase 3: Frente de Caixa.
// Redesenho (2026-08-16) — estrutura de PDV de supermercado real: entrada
// de código no topo, destaque do item mais recente, tabela de itens da
// venda, rodapé de totais com números grandes, atalhos de teclado pro
// operador não depender do mouse. Tema "azul" novo em components/PdvLayout.tsx.
// TODA a lógica (abertura de turno, finalizar_venda, baixa de estoque,
// pendência de baixa) é a mesma de antes — só a camada visual mudou aqui.
//
// Acessível a qualquer papel com vínculo na empresa (dono vende também em
// loja pequena) — diferente do Catálogo (/pdv), que é ferramenta de gestão e
// continua bloqueada pro operador. A busca de produto aqui sempre passa
// `papel` pra listarProdutosPdv(), que troca a fonte pra vw_produtos_seguro
// quando quem está logado é operador — nunca custo/margem chegam nesta tela,
// pra ninguém, porque a consulta nem seleciona essas colunas.
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Percent, Banknote } from "lucide-react";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import { listarProdutosPdv, type ProdutoPdv } from "../../../../lib/pdvHelpers";
import {
  listarCaixasAtivos, buscarTurnoAbertoPorCaixa, abrirTurno,
  finalizarVenda, baixarEstoqueVenda, atualizarStatusBaixaEstoque, definirPrecoVenda,
  type Caixa, type TurnoCaixa, type ItemBaixaEstoque,
} from "../../../../lib/pdvVendaHelpers";

// Lei 12.741/2012 (transparência fiscal ao consumidor) — percentual fixo,
// só informativo. NÃO entra em nenhum cálculo de finalizar_venda nem é
// enviado ao banco, é puramente de exibição nesta etapa.
// ponytail: percentual único aproximado; tabela IBPT oficial por NCM (valor
// real por produto) é etapa fiscal futura — não decidir sozinho quando
// chegar a hora.
const PERCENTUAL_TRIBUTO_APROXIMADO = 0.13;

const txt = {
  titulo: { pt: "Frente de Caixa", en: "Checkout", es: "Caja" },
  subtitulo: {
    pt: "Bipe o código de barras ou digite pra buscar.",
    en: "Scan the barcode or type to search.",
    es: "Escanee el código de barras o escriba para buscar.",
  },
  buscarPlaceholder: { pt: "Código de barras, nome ou SKU…", en: "Barcode, name or SKU…", es: "Código de barras, nombre o SKU…" },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  buscando: { pt: "Buscando…", en: "Searching…", es: "Buscando…" },
  digiteParaBuscar: { pt: "Digite ao menos 2 caracteres pra buscar.", en: "Type at least 2 characters to search.", es: "Escriba al menos 2 caracteres para buscar." },
  semResultado: { pt: "Nenhum produto encontrado.", en: "No product found.", es: "Ningún producto encontrado." },
  estoque: { pt: "estoque", en: "stock", es: "stock" },
  precoNaoDefinido: { pt: "preço não definido", en: "price not set", es: "precio no definido" },
  precoSugeridoBadge: { pt: "{valor} (sugerido)", en: "{valor} (suggested)", es: "{valor} (sugerido)" },
  definirPrecoTitulo: { pt: "Definir preço de venda", en: "Set selling price", es: "Definir precio de venta" },
  definirPrecoSubtitulo: {
    pt: "Este produto ainda não tem preço de venda cadastrado. Informe o preço pra vender agora — ele fica salvo no produto pras próximas vendas.",
    en: "This product doesn't have a selling price yet. Enter the price to sell now — it's saved on the product for next time.",
    es: "Este producto aún no tiene precio de venta. Indique el precio para vender ahora — queda guardado en el producto para las próximas ventas.",
  },
  definirPrecoLabel: { pt: "Preço de venda", en: "Selling price", es: "Precio de venta" },
  definirPrecoConfirmar: { pt: "Confirmar e adicionar", en: "Confirm and add", es: "Confirmar y agregar" },
  definirPrecoConfirmando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  definirPrecoInvalido: { pt: "Informe um preço válido, maior que zero.", en: "Enter a valid price greater than zero.", es: "Indique un precio válido, mayor que cero." },
  definirPrecoSemPermissao: {
    pt: "Você não tem permissão para definir preço de venda. Peça para o proprietário ou administrador.",
    en: "You don't have permission to set a selling price. Ask the owner or an administrator.",
    es: "No tiene permiso para definir el precio de venta. Pida al propietario o administrador.",
  },
  definirPrecoErroGenerico: { pt: "Não foi possível salvar o preço. Tente novamente.", en: "Could not save the price. Try again.", es: "No fue posible guardar el precio. Intente de nuevo." },
  itemAdicionado: { pt: "Adicionado: {nome}", en: "Added: {nome}", es: "Agregado: {nome}" },
  idleTitulo: { pt: "Pronto pra vender", en: "Ready to sell", es: "Listo para vender" },
  idleSubtitulo: {
    pt: "Bipe o código de barras ou digite nome/SKU no campo acima.",
    en: "Scan the barcode or type the name/SKU in the field above.",
    es: "Escanee el código de barras o escriba nombre/SKU en el campo de arriba.",
  },
  ultimoItem: { pt: "Último item", en: "Last item", es: "Último ítem" },
  valorUnitario: { pt: "Valor unitário", en: "Unit price", es: "Valor unitario" },
  totalDoItem: { pt: "Total do item", en: "Item total", es: "Total del ítem" },
  itensDaVenda: { pt: "Itens da venda", en: "Sale items", es: "Ítems de la venta" },
  carrinhoVazio: { pt: "Nenhum item ainda. Bipe ou digite pra começar.", en: "No items yet. Scan or type to start.", es: "Ningún ítem todavía. Escanee o escriba para empezar." },
  limparCarrinho: { pt: "Limpar", en: "Clear", es: "Vaciar" },
  colNumero: { pt: "Nº", en: "No.", es: "N.°" },
  colCodigo: { pt: "Código", en: "Code", es: "Código" },
  colDescricao: { pt: "Descrição", en: "Description", es: "Descripción" },
  colQtd: { pt: "Qtd", en: "Qty", es: "Cant." },
  colValorUnit: { pt: "Valor Unit.", en: "Unit Price", es: "Valor Unit." },
  colTotal: { pt: "Total", en: "Total", es: "Total" },
  subtotal: { pt: "Subtotal", en: "Subtotal", es: "Subtotal" },
  desconto: { pt: "Desconto", en: "Discount", es: "Descuento" },
  tributosAproximados: { pt: "Valor aproximado dos tributos", en: "Approximate tax amount", es: "Valor aproximado de tributos" },
  totalAPagar: { pt: "Total a pagar", en: "Total due", es: "Total a pagar" },
  finalizarVenda: { pt: "Finalizar Venda", en: "Complete Sale", es: "Finalizar Venta" },
  formaPagamentoLabel: { pt: "Forma de pagamento", en: "Payment method", es: "Forma de pago" },
  formaPagamentoSelecione: { pt: "Selecione…", en: "Select…", es: "Seleccione…" },
  formaPagamentoDinheiro: { pt: "Dinheiro", en: "Cash", es: "Efectivo" },
  formaPagamentoDebito: { pt: "Cartão de débito", en: "Debit card", es: "Tarjeta de débito" },
  formaPagamentoCredito: { pt: "Cartão de crédito", en: "Credit card", es: "Tarjeta de crédito" },
  formaPagamentoPix: { pt: "Pix", en: "Pix", es: "Pix" },
  formaPagamentoOutro: { pt: "Outro", en: "Other", es: "Otro" },
  totalRecebido: { pt: "Total recebido", en: "Amount received", es: "Total recibido" },
  troco: { pt: "Troco", en: "Change", es: "Vuelto" },
  faltam: { pt: "Faltam {valor}", en: "Missing {valor}", es: "Faltan {valor}" },
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
  atalhoEnter: { pt: "Enter — adicionar", en: "Enter — add", es: "Enter — agregar" },
  atalhoF2: { pt: "F2 — finalizar", en: "F2 — checkout", es: "F2 — finalizar" },
  atalhoDelete: { pt: "Delete — remover último", en: "Delete — remove last", es: "Delete — quitar último" },
  atalhoEsc: { pt: "Esc — fechar/cancelar", en: "Esc — close/cancel", es: "Esc — cerrar/cancelar" },
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
  // Só apresentação (qual linha vira o bloco "Último item" e ganha destaque
  // na tabela) — não influencia nenhum cálculo nem o que é enviado ao banco.
  const [ultimoAdicionadoId, setUltimoAdicionadoId] = useState<string | null>(null);
  // "Preço na hora da venda" — produto sem preco_venda (típico de produto
  // cadastrado no Estoque, que só preenche preco_custo/preco_sugerido) abre
  // este painel em vez de ir direto pro carrinho. Ver definirPrecoVenda()
  // em lib/pdvVendaHelpers.ts pra por que isso é um UPDATE normal em
  // produtos, sujeito à mesma RLS de sempre (operador não consegue).
  const [produtoParaPreco, setProdutoParaPreco] = useState<ProdutoPdv | null>(null);
  const [precoManualInput, setPrecoManualInput] = useState("");
  const [definindoPreco, setDefinindoPreco] = useState(false);
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
    buscarTurnoAbertoPorCaixa(caixaId).then((turnoEncontrado) => {
      setTurno(turnoEncontrado);
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
    setUltimoAdicionadoId(null);
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

  // Mutação de verdade do carrinho — só chamada depois que o produto JÁ TEM
  // preço de venda garantido (existente, ou acabou de ser definido no
  // painel abaixo). Nunca chamada direto pra um produto sem preço.
  function adicionarAoCarrinhoDireto(produto: ProdutoPdv) {
    setCarrinho((atual) => {
      const existe = atual.find((i) => i.produto.id === produto.id);
      if (existe) return atual.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      return [...atual, { produto, quantidade: 1 }];
    });
    setUltimoAdicionadoId(produto.id);
    mostrarToast(t("itemAdicionado", lang, { nome: produto.nome }), "ok");
    inputBuscaRef.current?.focus();
  }

  // Gate: produto sem preco_venda não vai direto pro carrinho — abre o
  // painel "Definir preço" (pré-preenchido com preco_sugerido, se houver)
  // pra não perder a venda nem deixar item sem preço entrar no carrinho.
  function adicionarAoCarrinho(produto: ProdutoPdv) {
    if (produto.preco_venda != null) { adicionarAoCarrinhoDireto(produto); return; }
    setProdutoParaPreco(produto);
    setPrecoManualInput(produto.preco_sugerido != null ? String(produto.preco_sugerido) : "");
  }

  async function handleConfirmarPrecoManual() {
    if (!produtoParaPreco) return;
    const preco = Number(precoManualInput.replace(",", "."));
    if (!preco || preco <= 0 || isNaN(preco)) { mostrarToast(t("definirPrecoInvalido", lang), "erro"); return; }

    setDefinindoPreco(true);
    const resultado = await definirPrecoVenda(produtoParaPreco.id, preco);
    setDefinindoPreco(false);

    if (resultado.semPermissao) { mostrarToast(t("definirPrecoSemPermissao", lang), "erro"); return; }
    if (resultado.erro) { mostrarToast(t("definirPrecoErroGenerico", lang), "erro"); return; }

    const produtoComPreco: ProdutoPdv = { ...produtoParaPreco, preco_venda: preco };
    adicionarAoCarrinhoDireto(produtoComPreco);
    setProdutoParaPreco(null);
    setPrecoManualInput("");
  }

  // Enter no campo de busca adiciona o topo da lista de resultados — o
  // operador não precisa soltar o teclado pra clicar quando digita em vez
  // de bipar.
  function handleBuscaKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter" || resultados.length === 0) return;
    adicionarAoCarrinho(resultados[0]);
    setBusca("");
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

  // Se o item em destaque saiu do carrinho (removido ou zerado), o destaque
  // recai pro último item que sobrou — nunca aponta pra um produto que não
  // está mais na venda.
  useEffect(() => {
    if (ultimoAdicionadoId && carrinho.some((i) => i.produto.id === ultimoAdicionadoId)) return;
    setUltimoAdicionadoId(carrinho.length > 0 ? carrinho[carrinho.length - 1].produto.id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carrinho]);

  // Atalhos de teclado — F2 finaliza, Delete remove o item em destaque, Esc
  // fecha o painel de finalizar (ou limpa a busca). Ignorados quando o foco
  // está num campo de texto (senão Delete apagaria letra ao editar CPF etc).
  useEffect(() => {
    if (!turno) return;
    function onKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const emCampoDeTexto = tag === "input" || tag === "select" || tag === "textarea";

      if (e.key === "F2") {
        e.preventDefault();
        if (carrinho.length > 0 && !painelFinalizarAberto) setPainelFinalizarAberto(true);
        return;
      }
      if (e.key === "Escape") {
        if (painelFinalizarAberto) setPainelFinalizarAberto(false);
        else if (busca) setBusca("");
        return;
      }
      if (e.key === "Delete" && !emCampoDeTexto && !painelFinalizarAberto && ultimoAdicionadoId) {
        e.preventDefault();
        removerItem(ultimoAdicionadoId);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [turno, carrinho.length, painelFinalizarAberto, busca, ultimoAdicionadoId]);

  const subtotal = useMemo(
    () => carrinho.reduce((soma, i) => soma + (i.produto.preco_venda ?? i.produto.preco_sugerido ?? 0) * i.quantidade, 0),
    [carrinho]
  );
  // Reservado pra quando desconto por venda ganhar campo próprio na tela —
  // finalizar_venda(p_desconto_total) já aceita, só não tem controle aqui
  // ainda (fora do escopo deste redesenho, só layout/tema/imposto).
  const desconto = 0;
  const totalAPagar = Math.max(subtotal - desconto, 0);
  const tributoAproximado = totalAPagar * PERCENTUAL_TRIBUTO_APROXIMADO;

  const itemDestaque = carrinho.find((i) => i.produto.id === ultimoAdicionadoId) || null;

  const voltarPara = papel === "operador" ? "/dashboard" : "/pdv";

  if (carregandoPapel || carregandoCaixas) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (caixas.length === 0) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
        <p className="text-sm py-8 text-center" style={{ color: "#f87171" }}>{t("semCaixaCadastrado", lang)}</p>
      </PdvLayout>
    );
  }

  if (!caixaId) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
        <LogoAxioma tamanho={64} />
        <EscolherCaixaPanel lang={lang} caixas={caixas} onEscolher={escolherCaixa} />
      </PdvLayout>
    );
  }

  if (carregandoTurno) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
        <EstadoCarregando lang={lang} texto={t("verificandoCaixa", lang)} />
      </PdvLayout>
    );
  }

  if (!turno) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
        <LogoAxioma tamanho={64} />
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
    <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara={voltarPara} telaCheia>
      {/* flex-col h-full: só a faixa do meio (destaque + tabela) rola por
          dentro — busca, totais e atalhos ficam sempre visíveis, a página
          inteira nunca precisa de scroll (telaCheia trava a altura em
          "viewport menos TopNav" lá no PdvLayout). */}
      <div className="flex flex-col h-full min-h-0">
        <div className="shrink-0 flex items-center justify-between mb-2 text-xs">
          <span style={{ opacity: 0.7 }}>{t("caixaLabel", lang, { nome: caixaAtual?.nome || "" })}</span>
          <button onClick={trocarCaixa} className="font-semibold underline" style={{ opacity: 0.7 }}>{t("trocarCaixa", lang)}</button>
        </div>

        {pendenciaBaixa && (
          <div className="shrink-0">
            <PendenciaBaixaBanner lang={lang} pendencia={pendenciaBaixa} tentando={retentandoBaixa} onTentarNovamente={handleTentarNovamenteBaixa} />
          </div>
        )}

        <div className="shrink-0 relative mb-3">
          <CampoBusca lang={lang} busca={busca} onBusca={setBusca} onKeyDown={handleBuscaKeyDown} inputRef={inputBuscaRef} />
          {busca.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden shadow-2xl">
              <ResultadosBusca lang={lang} termo={buscaDebounced} resultados={resultados} buscando={buscando} onAdicionar={adicionarAoCarrinho} />
            </div>
          )}
        </div>

        {/* Estrutura SEMPRE montada, com carrinho vazio ou não — só o
            conteúdo interno muda. É o que garante "tudo visível desde o
            início" (destaque + cabeçalho da tabela nunca somem). */}
        <div className="flex-1 min-h-0 flex flex-col">
          <DestaqueItemAtual lang={lang} item={itemDestaque} />
          <TabelaItensVenda
            lang={lang} carrinho={carrinho} destaqueId={ultimoAdicionadoId}
            onAlterarQuantidade={alterarQuantidade} onRemover={removerItem}
            onLimpar={() => { setCarrinho([]); setUltimoAdicionadoId(null); }}
          />
        </div>

        <div className="shrink-0">
          <RodapeTotais
            lang={lang} subtotal={subtotal} desconto={desconto} tributoAproximado={tributoAproximado} totalAPagar={totalAPagar}
            carrinhoVazio={carrinho.length === 0}
            onFinalizar={() => setPainelFinalizarAberto(true)}
          />
          <AtalhosRodape lang={lang} />
        </div>
      </div>

      {produtoParaPreco && (
        <DefinirPrecoModal
          lang={lang} produto={produtoParaPreco}
          precoInput={precoManualInput} onPrecoInput={setPrecoManualInput}
          confirmando={definindoPreco}
          onConfirmar={handleConfirmarPrecoManual}
          onCancelar={() => { setProdutoParaPreco(null); setPrecoManualInput(""); }}
        />
      )}

      {painelFinalizarAberto && (
        <FinalizarVendaModal
          lang={lang} totalAPagar={totalAPagar} tributoAproximado={tributoAproximado}
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

// Marca Axioma — usada nas telas de pré-venda (escolher caixa / abrir
// caixa) sempre estática. A versão animada (glow contínuo) fica só na tela
// ociosa do carrinho (IdleHero), pra não cansar o operador em 8h de uso.
function LogoAxioma({ tamanho }: { tamanho: number }) {
  return (
    <div className="flex justify-center mb-6">
      <Image src="/logo-aitech.png" alt="Axioma" width={tamanho} height={tamanho} priority />
    </div>
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

// cor?: em cima de uma superfície cardBg (dentro de um card), passe
// tokens.cardTexto explicitamente — tokens.textoMuted (default) só tem
// contraste correto sobre fundoContainer/acentoSuaveBg, não sobre cardBg
// (que é uma cor OPOSTA em alguns temas, ex: intermediario tem cardBg
// escuro com página clara — textoMuted escuro sumiria ali).
function EstadoCarregando({ lang, texto, cor }: { lang: Idioma; texto?: string; cor?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex items-center justify-center py-16 gap-2" style={{ color: cor || tokens.textoMuted }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm">{texto || t("carregando", lang)}</span>
    </div>
  );
}

function EscolherCaixaPanel({ lang, caixas, onEscolher }: { lang: Idioma; caixas: Caixa[]; onEscolher: (id: string) => void }) {
  const { tokens } = useTemaPdv();
  const [selecionado, setSelecionado] = useState("");
  return (
    <div className="max-w-sm mx-auto rounded-xl p-5" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
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
    <div className="max-w-sm mx-auto rounded-xl p-5" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
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

// Bloco "destaque" SEMPRE montado (mesma altura reservada tenha item ou
// não) — com item nenhum, mostra um estado ocioso compacto (logo pulsando
// bem sutil + texto), nunca um hero de tela cheia: o requisito é a
// ESTRUTURA inteira visível desde o início, não uma tela de boas-vindas
// separada. A animação já para sozinha assim que item != null, porque o
// ramo ocioso deixa de renderizar (sem precisar de lógica extra).
function DestaqueItemAtual({ lang, item }: { lang: Idioma; item: ItemCarrinho | null }) {
  const { tokens } = useTemaPdv();

  if (!item) {
    return (
      <div className="shrink-0 rounded-2xl p-4 mb-3 flex items-center gap-3"
        style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
        <motion.div
          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0">
          <Image src="/logo-aitech.png" alt="Axioma" width={36} height={36} />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm md:text-base font-bold truncate" style={{ color: tokens.cardTexto }}>{t("idleTitulo", lang)}</p>
          <p className="text-xs truncate" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("idleSubtitulo", lang)}</p>
        </div>
      </div>
    );
  }

  const precoUnit = item.produto.preco_venda ?? item.produto.preco_sugerido ?? 0;
  return (
    <div className="shrink-0 rounded-2xl p-4 md:p-5 mb-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: tokens.acento, opacity: 0.85 }}>{t("ultimoItem", lang)}</p>
      <p className="text-lg md:text-2xl font-extrabold truncate mb-2" style={{ color: tokens.cardTexto }}>{item.produto.nome}</p>
      <div className="flex items-end gap-8 flex-wrap">
        <div>
          <p className="text-xs font-semibold" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("valorUnitario", lang)}</p>
          <p className="text-base md:text-xl font-bold" style={{ color: tokens.cardTexto }}>{moeda(precoUnit)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("totalDoItem", lang)}</p>
          <p className="text-xl md:text-3xl font-black" style={{ color: tokens.acento }}>{moeda(precoUnit * item.quantidade)}</p>
        </div>
      </div>
    </div>
  );
}

// Grid, não <table> — de propósito: preciso do cabeçalho de colunas FORA
// da área que rola e só as LINHAS dentro de um flex-1/overflow-y-auto.
// Com <table>, thead/tbody não têm scroll independente sem truques (duas
// tabelas separadas, tamanhos de coluna sincronizados à mão — mais frágil
// que isto). Mesmas colunas via grid-template-columns idêntico no
// cabeçalho e em cada linha garante alinhamento.
const COLUNAS_GRID = "44px 96px minmax(0,1fr) 116px 96px 120px";

function TabelaItensVenda({ lang, carrinho, destaqueId, onAlterarQuantidade, onRemover, onLimpar }: {
  lang: Idioma; carrinho: ItemCarrinho[]; destaqueId: string | null;
  onAlterarQuantidade: (produtoId: string, delta: number) => void;
  onRemover: (produtoId: string) => void;
  onLimpar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5" style={{ background: tokens.acentoSuaveBg }}>
        <div className="flex items-center gap-2">
          <ShoppingCart size={16} style={{ color: tokens.acento }} />
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("itensDaVenda", lang)} ({carrinho.length})</h3>
        </div>
        <button onClick={onLimpar} disabled={carrinho.length === 0} className="text-xs font-semibold disabled:opacity-40" style={{ color: tokens.textoMuted }}>{t("limparCarrinho", lang)}</button>
      </div>

      <div className="shrink-0 grid items-center px-4 py-2 text-xs uppercase tracking-wide"
        style={{ gridTemplateColumns: COLUNAS_GRID, color: tokens.cardTexto, opacity: 0.65, borderBottom: `1px solid ${tokens.cardBorda}` }}>
        <span>{t("colNumero", lang)}</span>
        <span>{t("colCodigo", lang)}</span>
        <span>{t("colDescricao", lang)}</span>
        <span className="text-center">{t("colQtd", lang)}</span>
        <span className="text-right">{t("colValorUnit", lang)}</span>
        <span className="text-right">{t("colTotal", lang)}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {carrinho.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: tokens.cardTexto, opacity: 0.55 }}>{t("carrinhoVazio", lang)}</p>
        ) : (
          carrinho.map(({ produto, quantidade }, idx) => {
            const precoUnit = produto.preco_venda ?? produto.preco_sugerido ?? 0;
            const emDestaque = produto.id === destaqueId;
            return (
              <div key={produto.id} className="grid items-center px-4 py-2 text-sm md:text-base"
                style={{ gridTemplateColumns: COLUNAS_GRID, background: emDestaque ? tokens.acentoSuaveBg : "transparent", borderBottom: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
                <span style={{ opacity: 0.7 }}>{idx + 1}</span>
                <span className="truncate pr-2" style={{ opacity: 0.7 }}>{produto.codigo_barras || produto.sku || "—"}</span>
                <span className="font-semibold truncate pr-2">{produto.nome}</span>
                <div className="flex items-center justify-center gap-1.5">
                  <button onClick={() => onAlterarQuantidade(produto.id, -1)} className="p-1 rounded-md" style={{ background: tokens.inputBg, color: tokens.inputTexto }}><Minus size={12} /></button>
                  <span className="w-5 text-center font-bold">{quantidade}</span>
                  <button onClick={() => onAlterarQuantidade(produto.id, 1)} className="p-1 rounded-md" style={{ background: tokens.inputBg, color: tokens.inputTexto }}><Plus size={12} /></button>
                </div>
                <span className="text-right whitespace-nowrap">{moeda(precoUnit)}</span>
                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                  <span className="font-bold">{moeda(precoUnit * quantidade)}</span>
                  <button onClick={() => onRemover(produto.id)} className="p-1 rounded-md shrink-0" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RodapeTotais({ lang, subtotal, desconto, tributoAproximado, totalAPagar, carrinhoVazio, onFinalizar }: {
  lang: Idioma; subtotal: number; desconto: number; tributoAproximado: number; totalAPagar: number;
  carrinhoVazio: boolean; onFinalizar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="rounded-2xl p-3 md:p-4" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className="flex flex-col gap-1 mb-2 text-sm" style={{ color: tokens.cardTexto }}>
        <div className="flex items-center justify-between">
          <span style={{ opacity: 0.75 }}>{t("subtotal", lang)}</span>
          <span className="font-semibold">{moeda(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex items-center justify-between">
            <span style={{ opacity: 0.75 }}>{t("desconto", lang)}</span>
            <span className="font-semibold">- {moeda(desconto)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1" style={{ opacity: 0.75 }}><Percent size={13} />{t("tributosAproximados", lang)}</span>
          <span className="font-semibold">{moeda(tributoAproximado)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pt-2 mb-3 flex-wrap" style={{ borderTop: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <span className="text-base md:text-lg font-bold" style={{ color: tokens.texto }}>{t("totalAPagar", lang)}</span>
        <span className="text-3xl md:text-4xl font-black" style={{ color: tokens.acento }}>{moeda(totalAPagar)}</span>
      </div>

      <button onClick={onFinalizar} disabled={carrinhoVazio}
        className="w-full py-3 rounded-2xl text-base md:text-lg font-black disabled:opacity-40"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {t("finalizarVenda", lang)}
      </button>
    </div>
  );
}

function AtalhosRodape({ lang }: { lang: Idioma }) {
  const { tokens } = useTemaPdv();
  const atalhos: (keyof typeof txt)[] = ["atalhoEnter", "atalhoF2", "atalhoDelete", "atalhoEsc"];
  return (
    <div className="shrink-0 flex items-center justify-center gap-4 md:gap-6 flex-wrap mt-2 text-xs" style={{ color: tokens.textoMuted }}>
      {atalhos.map((chave) => <span key={chave}>{t(chave, lang)}</span>)}
    </div>
  );
}

function FinalizarVendaModal({
  lang, totalAPagar, tributoAproximado, formaPagamento, onFormaPagamento, cpfNotaInput, onCpfNotaInput, confirmando, onConfirmar, onCancelar,
}: {
  lang: Idioma; totalAPagar: number; tributoAproximado: number;
  formaPagamento: string; onFormaPagamento: (v: string) => void;
  cpfNotaInput: string; onCpfNotaInput: (v: string) => void;
  confirmando: boolean; onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  // Calculadora de troco — só de exibição, NUNCA enviado ao banco/RPC. O
  // valor gravado em venda continua vindo só do que finalizar_venda calcula.
  const [valorRecebidoInput, setValorRecebidoInput] = useState("");
  const valorRecebido = Number(valorRecebidoInput.replace(",", ".")) || 0;
  const troco = valorRecebido - totalAPagar;
  const mostrarTroco = formaPagamento === "dinheiro";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: tokens.texto }}>{t("finalizarVenda", lang)}</h3>
        <p className="text-4xl font-black mb-1" style={{ color: tokens.acento }}>{moeda(totalAPagar)}</p>
        <p className="text-xs flex items-center gap-1 mb-4" style={{ color: tokens.textoMuted }}>
          <Percent size={12} />{t("tributosAproximados", lang)}: {moeda(tributoAproximado)}
        </p>

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

        <AnimatePresence>
          {mostrarTroco && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 gap-3 mb-3 overflow-hidden">
              <div>
                <label className="text-xs font-semibold flex items-center gap-1 mb-1" style={{ color: tokens.texto }}><Banknote size={13} />{t("totalRecebido", lang)}</label>
                <input
                  value={valorRecebidoInput} onChange={(e) => setValorRecebidoInput(e.target.value)}
                  inputMode="decimal" placeholder="0,00" autoFocus
                  className="w-full px-3 py-3 rounded-xl text-lg font-bold outline-none"
                  style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("troco", lang)}</label>
                <div className="w-full px-3 py-3 rounded-xl text-lg font-black"
                  style={{ background: tokens.inputBg, color: troco < 0 ? "#f87171" : tokens.acento, border: `1px solid ${tokens.inputBorda}` }}>
                  {troco < 0 ? t("faltam", lang, { valor: moeda(Math.abs(troco)) }) : moeda(troco)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
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

// Nunca mostra custo/margem — ProdutoPdv (lib/pdvHelpers.ts) já não tem
// esses campos (COLUNAS_SEGURAS), então não tem como vazar aqui mesmo que
// o operador dispare este painel.
function DefinirPrecoModal({ lang, produto, precoInput, onPrecoInput, confirmando, onConfirmar, onCancelar }: {
  lang: Idioma; produto: ProdutoPdv;
  precoInput: string; onPrecoInput: (v: string) => void;
  confirmando: boolean; onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: tokens.texto }}>{t("definirPrecoTitulo", lang)}</h3>
        <p className="text-base font-bold truncate mb-2" style={{ color: tokens.texto }}>{produto.nome}</p>
        <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("definirPrecoSubtitulo", lang)}</p>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("definirPrecoLabel", lang)}</label>
        <input
          value={precoInput} onChange={(e) => onPrecoInput(e.target.value)}
          inputMode="decimal" placeholder="0,00" autoFocus
          className="w-full px-3 py-3 rounded-xl text-lg font-bold outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={confirmando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelarPainel", lang)}
          </button>
          <button onClick={onConfirmar} disabled={confirmando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {confirmando && <Loader2 className="animate-spin" size={14} />}
            {confirmando ? t("definirPrecoConfirmando", lang) : t("definirPrecoConfirmar", lang)}
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

function CampoBusca({ lang, busca, onBusca, onKeyDown, inputRef }: {
  lang: Idioma; busca: string; onBusca: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="relative">
      <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: tokens.acento }} />
      <input
        ref={inputRef} autoFocus value={busca} onChange={(e) => onBusca(e.target.value)} onKeyDown={onKeyDown}
        placeholder={t("buscarPlaceholder", lang)}
        className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-lg md:text-xl font-semibold outline-none"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `2px solid ${tokens.inputBorda}` }}
      />
    </div>
  );
}

function ResultadosBusca({ lang, termo, resultados, buscando, onAdicionar }: {
  lang: Idioma; termo: string; resultados: ProdutoPdv[]; buscando: boolean; onAdicionar: (p: ProdutoPdv) => void;
}) {
  const { tokens } = useTemaPdv();

  // Este dropdown sempre fica sobre tokens.cardBg (ver div de fora, embaixo)
  // — nunca tokens.textoMuted aqui, ele só tem contraste sobre fundoContainer/
  // acentoSuaveBg. cardBg é uma superfície com brilho OPOSTO ao da página em
  // alguns temas (ex: intermediario), então o texto certo é sempre cardTexto.
  let conteudo: React.ReactNode;
  if (buscando) conteudo = <EstadoCarregando lang={lang} cor={tokens.cardTexto} />;
  else if (termo.trim().length < 2) conteudo = <p className="text-sm py-6 text-center" style={{ color: tokens.cardTexto, opacity: 0.7 }}>{t("digiteParaBuscar", lang)}</p>;
  else if (resultados.length === 0) conteudo = <p className="text-sm py-6 text-center" style={{ color: tokens.cardTexto, opacity: 0.7 }}>{t("semResultado", lang)}</p>;
  else conteudo = (
    <div className="max-h-80 overflow-y-auto">
      {resultados.map((produto) => (
        <button key={produto.id} onClick={() => onAdicionar(produto)}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
          style={{ borderTop: `1px solid ${tokens.cardBorda}` }}>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: tokens.cardTexto }}>{produto.nome}</p>
            <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.7 }}>
              {produto.saldo_disponivel} {t("estoque", lang)}
              {produto.codigo_barras ? ` · ${produto.codigo_barras}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-bold" style={{ color: tokens.acento }}>
              {produto.preco_venda
                ? moeda(produto.preco_venda)
                : produto.preco_sugerido
                  ? t("precoSugeridoBadge", lang, { valor: moeda(produto.preco_sugerido) })
                  : t("precoNaoDefinido", lang)}
            </span>
            <span className="p-1.5 rounded-lg" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
              <Plus size={14} />
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  return <div style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>{conteudo}</div>;
}
