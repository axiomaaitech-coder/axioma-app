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
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { motion } from "framer-motion";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Percent, Banknote, Maximize2, Minimize2, Printer, Settings, LayoutDashboard, Lock } from "lucide-react";
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
import { obterDadosCupomEmpresa, salvarConfigCupom, type DadosEmpresaCupom } from "../../../../lib/pdvCupomHelpers";
import { conectarQz, listarImpressorasQz, imprimirEscPos } from "../../../../lib/qzTrayHelpers";

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
  sistemaInteligente: { pt: "Sistema Inteligente", en: "Intelligent System", es: "Sistema Inteligente" },
  idleTitulo: { pt: "Pronto pra vender", en: "Ready to sell", es: "Listo para vender" },
  idleSubtitulo: {
    pt: "Bipe o código de barras ou digite nome/SKU no campo acima.",
    en: "Scan the barcode or type the name/SKU in the field above.",
    es: "Escanee el código de barras o escriba nombre/SKU en el campo de arriba.",
  },
  ultimoItem: { pt: "Último item", en: "Last item", es: "Último ítem" },
  valorUnitario: { pt: "Valor unitário", en: "Unit price", es: "Valor unitario" },
  totalDoItem: { pt: "Total do item", en: "Item total", es: "Total del ítem" },
  labelCodigoBarras: { pt: "Código de barras", en: "Barcode", es: "Código de barras" },
  labelCodigoItem: { pt: "Código", en: "Code", es: "Código" },
  itensDaVenda: { pt: "Lista de Produtos", en: "Product List", es: "Lista de Productos" },
  telaCheia: { pt: "Tela cheia", en: "Full screen", es: "Pantalla completa" },
  sairTelaCheia: { pt: "Sair da tela cheia", en: "Exit full screen", es: "Salir de pantalla completa" },
  carrinhoVazio: { pt: "Nenhum item ainda. Bipe ou digite pra começar.", en: "No items yet. Scan or type to start.", es: "Ningún ítem todavía. Escanee o escriba para empezar." },
  limparCarrinho: { pt: "Limpar", en: "Clear", es: "Vaciar" },
  colNumero: { pt: "Nº Item", en: "Item No.", es: "N.° Ítem" },
  colCodigo: { pt: "Código", en: "Code", es: "Código" },
  colDescricao: { pt: "Descrição", en: "Description", es: "Descripción" },
  colQtd: { pt: "Qtd", en: "Qty", es: "Cant." },
  colValorUnit: { pt: "Vlr. Unit.", en: "Unit Price", es: "Valor Unit." },
  colTotal: { pt: "Total", en: "Total", es: "Total" },
  subtotal: { pt: "Subtotal", en: "Subtotal", es: "Subtotal" },
  desconto: { pt: "Desconto", en: "Discount", es: "Descuento" },
  tributosAproximados: { pt: "Valor aproximado dos tributos (Lei 12.741)", en: "Approximate taxes (Law 12.741)", es: "Valor aproximado de los tributos (Ley 12.741)" },
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
  estoqueInsuficiente: {
    pt: "Estoque insuficiente para {nome} (disponível: {saldo}). Peça autorização do dono ou administrador.",
    en: "Not enough stock for {nome} (available: {saldo}). Ask the owner or an admin to authorize.",
    es: "Stock insuficiente para {nome} (disponible: {saldo}). Pida autorización al propietario o administrador.",
  },
  estoqueInsuficienteAviso: {
    pt: "Atenção: {nome} vai ficar com estoque negativo (disponível: {saldo}).",
    en: "Warning: {nome} will end up with negative stock (available: {saldo}).",
    es: "Atención: {nome} quedará con stock negativo (disponible: {saldo}).",
  },
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

  // Cupom não-fiscal + impressão (PDV Fase 3, Etapa 3)
  cupomNaoFiscal: { pt: "CUPOM NÃO FISCAL", en: "NON-FISCAL RECEIPT", es: "COMPROBANTE NO FISCAL" },
  cupomNumeroVenda: { pt: "Venda nº", en: "Sale No.", es: "Venta N.°" },
  cupomOperador: { pt: "Operador", en: "Operator", es: "Operador" },
  cupomCaixa: { pt: "Caixa", en: "Register", es: "Caja" },
  imprimirComprovante: { pt: "Imprimir Nota", en: "Print Receipt", es: "Imprimir Nota" },
  reimprimirComprovante: { pt: "Reimprimir", en: "Reprint", es: "Reimprimir" },
  qzNaoConectado: {
    pt: "Impressora não conectada — verifique se o QZ Tray está aberto. Imprimindo pela tela.",
    en: "Printer not connected — check if QZ Tray is open. Printing from the screen instead.",
    es: "Impresora no conectada — verifique si QZ Tray está abierto. Imprimiendo desde la pantalla.",
  },
  qzErroImprimir: {
    pt: "Não foi possível imprimir na impressora térmica. Imprimindo pela tela.",
    en: "Could not print on the thermal printer. Printing from the screen instead.",
    es: "No fue posible imprimir en la impresora térmica. Imprimiendo desde la pantalla.",
  },
  qzImpressoraLabel: { pt: "Impressora térmica", en: "Thermal printer", es: "Impresora térmica" },
  qzImpressoraSelecione: { pt: "Nenhuma (usar impressão pela tela)", en: "None (use screen printing)", es: "Ninguna (usar impresión desde la pantalla)" },
  qzTestarConexao: { pt: "Testar conexão", en: "Test connection", es: "Probar conexión" },
  qzTestando: { pt: "Testando…", en: "Testing…", es: "Probando…" },
  qzStatusConectado: { pt: "✅ QZ Tray conectado", en: "✅ QZ Tray connected", es: "✅ QZ Tray conectado" },
  qzStatusDesconectado: {
    pt: "⚠️ QZ Tray não conectado — abra o programa QZ Tray no computador do caixa.",
    en: "⚠️ QZ Tray not connected — open the QZ Tray program on the register's computer.",
    es: "⚠️ QZ Tray no conectado — abra el programa QZ Tray en la computadora de la caja.",
  },
  qzStatusVerificando: { pt: "Verificando QZ Tray…", en: "Checking QZ Tray…", es: "Verificando QZ Tray…" },
  qzSemImpressoras: {
    pt: "Nenhuma impressora encontrada pelo QZ Tray.",
    en: "No printer found by QZ Tray.",
    es: "Ninguna impresora encontrada por QZ Tray.",
  },
  configurarImpressao: { pt: "Impressão", en: "Printing", es: "Impresión" },
  linkRetaguarda: { pt: "Retaguarda", en: "Back Office", es: "Retaguardia" },
  reautenticarTitulo: { pt: "Digite sua senha pra acessar a Retaguarda", en: "Enter your password to access the Back Office", es: "Ingrese su contraseña para acceder a la Retaguardia" },
  reautenticarSubtitulo: {
    pt: "Confirmação de segurança — protege a Retaguarda caso o dono se afaste do caixa.",
    en: "Security check — protects the Back Office in case the owner steps away from the register.",
    es: "Confirmación de seguridad — protege la Retaguardia si el propietario se aleja de la caja.",
  },
  senhaLabel: { pt: "Senha", en: "Password", es: "Contraseña" },
  senhaIncorreta: { pt: "Senha incorreta.", en: "Incorrect password.", es: "Contraseña incorrecta." },
  reautenticarConfirmar: { pt: "Confirmar", en: "Confirm", es: "Confirmar" },
  reautenticarConfirmando: { pt: "Confirmando…", en: "Confirming…", es: "Confirmando…" },
  reautenticarCancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  configCupomTitulo: { pt: "Impressão do cupom", en: "Receipt printing", es: "Impresión del comprobante" },
  configCupomImpressaoAutomaticaLabel: {
    pt: "Imprimir automaticamente ao finalizar a venda",
    en: "Print automatically when the sale is completed",
    es: "Imprimir automáticamente al finalizar la venta",
  },
  configCupomImpressaoAutomaticaAjuda: {
    pt: "Com uma impressora térmica selecionada abaixo e o QZ Tray aberto, o cupom sai sozinho na impressora, sem nenhuma tela de confirmação. Sem impressora selecionada (ou QZ Tray fechado), abre a tela de impressão do navegador pra confirmar.",
    en: "With a thermal printer selected below and QZ Tray open, the receipt prints by itself, with no confirmation screen. Without a printer selected (or QZ Tray closed), the browser's print screen opens to confirm.",
    es: "Con una impresora térmica seleccionada abajo y QZ Tray abierto, el comprobante se imprime solo, sin ninguna pantalla de confirmación. Sin impresora seleccionada (o QZ Tray cerrado), se abre la pantalla de impresión del navegador para confirmar.",
  },
  configCupomRodapeLabel: { pt: "Mensagem no rodapé do cupom (opcional)", en: "Receipt footer message (optional)", es: "Mensaje en el pie del comprobante (opcional)" },
  configCupomRodapePlaceholder: { pt: "Ex: Volte sempre!", en: "E.g.: Come back soon!", es: "Ej: ¡Vuelva siempre!" },
  configCupomSalvar: { pt: "Salvar", en: "Save", es: "Guardar" },
  configCupomSalvando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  configCupomSemPermissao: {
    pt: "Você não tem permissão para alterar a configuração de impressão. Peça para o proprietário.",
    en: "You don't have permission to change the printing configuration. Ask the owner.",
    es: "No tiene permiso para cambiar la configuración de impresión. Pida al propietario.",
  },
  configCupomErroGenerico: { pt: "Não foi possível salvar a configuração. Tente novamente.", en: "Could not save the configuration. Try again.", es: "No fue posible guardar la configuración. Intente de nuevo." },
  configCupomSalva: { pt: "Configuração de impressão salva.", en: "Printing configuration saved.", es: "Configuración de impresión guardada." },
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

const CHAVES_FORMA_PAGAMENTO: Record<string, keyof typeof txt> = {
  dinheiro: "formaPagamentoDinheiro", debito: "formaPagamentoDebito", credito: "formaPagamentoCredito",
  pix: "formaPagamentoPix", outro: "formaPagamentoOutro",
};
function labelFormaPagamento(codigo: string, lang: Idioma): string {
  const chave = CHAVES_FORMA_PAGAMENTO[codigo];
  return chave ? t(chave, lang) : codigo;
}

type ItemCarrinho = { produto: ProdutoPdv; quantidade: number };

// Cupom não-fiscal (PDV Fase 3, Etapa 3) — snapshot congelado no momento da
// venda: nunca relido do carrinho depois (que já foi limpo), permite
// reimprimir a qualquer momento até a próxima venda ser finalizada.
type ItemCupom = { nome: string; codigo: string; quantidade: number; precoUnit: number };
type CupomVenda = {
  vendaId: string;
  criadoEm: string;
  operador: string;
  caixa: string;
  itens: ItemCupom[];
  subtotal: number;
  desconto: number;
  tributoAproximado: number;
  totalAPagar: number;
  formaPagamento: string;
  cpfNota: string;
  valorRecebido: number;
  troco: number;
};

const CHAVE_REAUTH_RETAGUARDA = "retaguarda_reauth_ate";
const VALIDADE_REAUTH_MS = 15 * 60 * 1000;

export default function PdvVendaPage() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;
  const router = useRouter();

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
  // Calculadora de troco — só de exibição (rodapé da coluna direita, sempre
  // visível), NUNCA enviado ao banco/RPC. finalizar_venda continua sem
  // receber isto; é puramente informativo pro operador/caixa.
  const [valorRecebidoInput, setValorRecebidoInput] = useState("");
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

  // Re-autenticação por senha antes de abrir a Retaguarda — protege contra o
  // operador usar a máquina se o dono/admin se afastar deixando a sessão
  // logada. Não cria sessão nova (a sessão atual continua intacta);
  // signInWithPassword aqui serve só pra VALIDAR a credencial. Válida por 15
  // min via sessionStorage — mesma aba/dispositivo, some ao fechar a aba.
  const [reautenticarAberto, setReautenticarAberto] = useState(false);
  const [autenticandoRetaguarda, setAutenticandoRetaguarda] = useState(false);
  const [erroReauth, setErroReauth] = useState("");

  // Cupom não-fiscal + impressão automática (PDV Fase 3, Etapa 3).
  const [nomeOperador, setNomeOperador] = useState("");
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [dadosEmpresaCupom, setDadosEmpresaCupom] = useState<DadosEmpresaCupom | null>(null);
  const [ultimoCupom, setUltimoCupom] = useState<CupomVenda | null>(null);
  const [cupomJaImpresso, setCupomJaImpresso] = useState(false);
  const [configCupomAberto, setConfigCupomAberto] = useState(false);
  const [salvandoConfigCupom, setSalvandoConfigCupom] = useState(false);
  // Evita reimprimir automaticamente a mesma venda de novo a cada re-render
  // (ex: quando dadosEmpresaCupom termina de carregar depois do cupom já
  // estar montado) — só dispara uma vez por vendaId.
  const cupomAutoImpressoRef = useRef<string | null>(null);

  // QZ Tray (impressão térmica ESC/POS) — conecta uma vez ao abrir a tela
  // (não bloqueia nada se não conseguir: só sai already "desconectado" e o
  // resto do PDV funciona igual, caindo pro cupom HTML na hora de imprimir).
  const [statusQz, setStatusQz] = useState<"verificando" | "conectado" | "desconectado">("verificando");
  const [impressorasQz, setImpressorasQz] = useState<string[]>([]);

  // Modo tela cheia — Fullscreen API nativa no CONTAINER da Frente de Caixa
  // (não no <body>): o browser só desenha esse elemento e seus filhos,
  // então a TopNav e o aviso de cadastro (que vivem FORA dele, em
  // app/(interno)/layout.tsx) somem sozinhos, sem precisar esconder nada
  // via CSS/estado global. Esc do navegador já sai sozinho — só precisamos
  // escutar "fullscreenchange" pra sincronizar o ícone do botão.
  const pdvContainerRef = useRef<HTMLDivElement>(null);
  const [fullscreenAtivo, setFullscreenAtivo] = useState(false);

  useEffect(() => {
    function aoMudarFullscreen() { setFullscreenAtivo(!!document.fullscreenElement); }
    document.addEventListener("fullscreenchange", aoMudarFullscreen);
    return () => document.removeEventListener("fullscreenchange", aoMudarFullscreen);
  }, []);

  function alternarTelaCheia() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else pdvContainerRef.current?.requestFullscreen().catch(() => {});
  }

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  function handleClickRetaguarda() {
    const ate = Number(sessionStorage.getItem(CHAVE_REAUTH_RETAGUARDA) || 0);
    if (Date.now() < ate) { router.push("/pdv/retaguarda"); return; }
    setErroReauth("");
    setReautenticarAberto(true);
  }

  async function handleConfirmarReauth(senha: string) {
    if (!emailUsuario) { setErroReauth(t("senhaIncorreta", lang)); return; }
    setAutenticandoRetaguarda(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailUsuario, password: senha });
    setAutenticandoRetaguarda(false);
    if (error) { setErroReauth(t("senhaIncorreta", lang)); return; }
    sessionStorage.setItem(CHAVE_REAUTH_RETAGUARDA, String(Date.now() + VALIDADE_REAUTH_MS));
    setReautenticarAberto(false);
    router.push("/pdv/retaguarda");
  }

  useEffect(() => {
    (async () => {
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      const { data: authData } = await supabase.auth.getUser();
      setUserId(authData?.user?.id || null);
      setEmailUsuario(authData?.user?.email || null);
      setNomeOperador(
        authData?.user?.user_metadata?.nome ||
        authData?.user?.user_metadata?.full_name ||
        authData?.user?.email?.split("@")[0] || ""
      );
      if (!id) { setCarregandoPapel(false); return; }
      setPapel(await obterMeuPapel(id));
      setCarregandoPapel(false);
    })();
  }, [supabase]);

  // Nome/CNPJ/endereço (cabeçalho do cupom) + config de impressão salva pela
  // empresa — carregado uma vez por empresa, igual aos caixas.
  useEffect(() => {
    if (!empresaId) return;
    obterDadosCupomEmpresa(empresaId).then(setDadosEmpresaCupom);
  }, [empresaId]);

  // Tenta conectar no QZ Tray assim que a tela abre — só "aquece" a conexão
  // pra impressão automática não perder tempo depois; se falhar aqui, tenta
  // de novo sozinho na hora de imprimir (ver imprimirCupomAtual).
  useEffect(() => {
    let ativo = true;
    conectarQz().then((ok) => {
      if (!ativo) return;
      setStatusQz(ok ? "conectado" : "desconectado");
      if (ok) listarImpressorasQz().then((lista) => { if (ativo) setImpressorasQz(lista); });
    });
    return () => { ativo = false; };
  }, []);

  async function handleTestarQz() {
    setStatusQz("verificando");
    const ok = await conectarQz();
    setStatusQz(ok ? "conectado" : "desconectado");
    setImpressorasQz(ok ? await listarImpressorasQz() : []);
  }

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

    // Trava de estoque negativo: operador não passa; dono/admin seguem
    // (a autorização é a própria ação deles), só com aviso na tela — o
    // saldo aqui é o snapshot da busca, então é um alerta, não garantia
    // exata (concorrência real fica pro banco).
    const itemSemEstoque = carrinho.find((i) => i.quantidade > i.produto.saldo_disponivel);
    if (itemSemEstoque) {
      const vars = { nome: itemSemEstoque.produto.nome, saldo: itemSemEstoque.produto.saldo_disponivel };
      if (papel !== "dono" && papel !== "admin") {
        mostrarToast(t("estoqueInsuficiente", lang, vars), "erro");
        return;
      }
      mostrarToast(t("estoqueInsuficienteAviso", lang, vars), "info");
    }

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

    // Snapshot do cupom ANTES de limpar o carrinho — mesma lógica de
    // itensParaBaixa acima. Fica disponível pra impressão automática e pro
    // botão "Reimprimir" até a próxima venda ser finalizada.
    setUltimoCupom({
      vendaId,
      criadoEm: new Date().toISOString(),
      operador: nomeOperador,
      caixa: caixas.find((c) => c.id === caixaId)?.nome || "",
      itens: carrinho.map((i) => ({
        nome: i.produto.nome,
        codigo: i.produto.codigo_barras || i.produto.sku || "",
        quantidade: i.quantidade,
        precoUnit: i.produto.preco_venda ?? i.produto.preco_sugerido ?? 0,
      })),
      subtotal, desconto, tributoAproximado,
      totalAPagar: resultado.valorTotal ?? totalAPagar,
      formaPagamento, cpfNota: cpfLimpo,
      valorRecebido, troco,
    });
    setCupomJaImpresso(false);
    cupomAutoImpressoRef.current = null;

    mostrarToast(t("vendaConcluida", lang, { valor: moeda(resultado.valorTotal) }), "ok");
    setCarrinho([]);
    setUltimoAdicionadoId(null);
    setPainelFinalizarAberto(false);
    setFormaPagamento("");
    setCpfNotaInput("");
    setValorRecebidoInput("");
    // Reset completo da busca — sem isto o campo e o dropdown de resultados
    // ficam com os dados da venda anterior mesmo com o carrinho já vazio.
    setBusca("");
    setBuscaDebounced("");
    setResultados([]);
    inputBuscaRef.current?.focus();

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

  // Tenta a impressora térmica (ESC/POS via QZ Tray) primeiro, SE a empresa
  // tiver uma configurada; se o QZ não estiver conectado, ou a impressão
  // falhar, ou nenhuma impressora estiver configurada, cai pro cupom HTML
  // (window.print()) — a venda nunca fica sem forma de imprimir.
  async function imprimirCupomAtual(cupom: CupomVenda) {
    const impressora = dadosEmpresaCupom?.impressora;
    if (impressora) {
      const conectado = await conectarQz();
      if (conectado) {
        const comandos = montarComandosEscPos(dadosEmpresaCupom, cupom, lang);
        const resultado = await imprimirEscPos(impressora, comandos);
        if (!resultado.erro) { setCupomJaImpresso(true); return; }
        mostrarToast(t("qzErroImprimir", lang), "erro");
      } else {
        mostrarToast(t("qzNaoConectado", lang), "erro");
      }
    }
    imprimirHtmlEmIframe(gerarHtmlCupom(dadosEmpresaCupom, cupom, lang));
    setCupomJaImpresso(true);
  }

  function handleImprimirCupom() {
    if (ultimoCupom) imprimirCupomAtual(ultimoCupom);
  }

  async function handleSalvarConfigCupom(v: { impressaoAutomatica: boolean; rodape: string; impressora: string }) {
    if (!empresaId) return;
    setSalvandoConfigCupom(true);
    const resultado = await salvarConfigCupom(empresaId, v);
    setSalvandoConfigCupom(false);

    if (resultado.semPermissao) { mostrarToast(t("configCupomSemPermissao", lang), "erro"); return; }
    if (resultado.erro) { mostrarToast(t("configCupomErroGenerico", lang), "erro"); return; }
    setDadosEmpresaCupom((atual) => atual ? { ...atual, ...v } : atual);
    setConfigCupomAberto(false);
    mostrarToast(t("configCupomSalva", lang), "ok");
  }

  // Impressão automática ao finalizar (config por empresa, ligada por
  // padrão) — dispara só uma vez por venda. Sem impressora térmica
  // configurada (ou QZ Tray fora do ar), window.print() no navegador normal
  // abre o diálogo de confirmação; pra sair direto (sem diálogo) o Chrome do
  // caixa precisa estar aberto com a flag --kiosk-printing (ver nota na tela
  // de configuração).
  useEffect(() => {
    if (!ultimoCupom || !dadosEmpresaCupom?.impressaoAutomatica) return;
    if (cupomAutoImpressoRef.current === ultimoCupom.vendaId) return;
    cupomAutoImpressoRef.current = ultimoCupom.vendaId;
    const id = requestAnimationFrame(() => { imprimirCupomAtual(ultimoCupom); });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ultimoCupom, dadosEmpresaCupom?.impressaoAutomatica]);

  // O aviso "Venda concluída / Imprimir Nota" some sozinho depois de um
  // tempo — a impressão automática (efeito acima) já rodou bem antes disso,
  // então sumir da tela não atrapalha nada, só limpa o aviso já cumprido.
  // Some antes disso também se o operador já começar a próxima venda (ver
  // adicionarAoCarrinhoDireto).
  useEffect(() => {
    if (!ultimoCupom) return;
    const timer = setTimeout(() => setUltimoCupom(null), 9000);
    return () => clearTimeout(timer);
  }, [ultimoCupom]);

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
    // Bipar o primeiro item de uma venda nova é o sinal de que a anterior já
    // era — o aviso "Venda concluída / Imprimir Nota" dela não faz mais
    // sentido na tela (a impressão automática já rodou antes disso). Só
    // mexe no estado do aviso, não na venda em si.
    setUltimoCupom(null);
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
  const valorRecebido = Number(valorRecebidoInput.replace(",", ".")) || 0;
  const troco = valorRecebido - totalAPagar;

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
      <ConteudoPdv
        containerRef={pdvContainerRef} fullscreenAtivo={fullscreenAtivo} onAlternarTelaCheia={alternarTelaCheia}
        lang={lang} caixaAtual={caixaAtual} onTrocarCaixa={trocarCaixa}
        mostrarConfigCupom={papel !== "operador"} onAbrirConfigCupom={() => setConfigCupomAberto(true)}
        mostrarRetaguarda={papel === "dono" || papel === "admin"} onAbrirRetaguarda={handleClickRetaguarda}
      >
        {pendenciaBaixa && (
          <div className="shrink-0">
            <PendenciaBaixaBanner lang={lang} pendencia={pendenciaBaixa} tentando={retentandoBaixa} onTentarNovamente={handleTentarNovamenteBaixa} />
          </div>
        )}

        {/* Estrutura de PDV de supermercado em 2 colunas: esquerda (~35%)
            com os blocos emoldurados de bipagem/destaque do item; direita
            (~65%) com a lista de produtos + totais. Tudo SEMPRE montado, com
            carrinho vazio ou não — só o conteúdo interno muda (é o que
            garante "tudo visível desde o início"). ZERO SCROLL é requisito
            travado (também em tela cheia): todo bloco da esquerda é
            shrink-0 (tamanho mínimo já compacto) exceto o logo (flex-1,
            absorve/cede o que sobra); à direita só as LINHAS da tabela têm
            overflow-y-auto como rede de segurança pra carrinho com muitos
            itens — ver nota lá na função. `grande` (= tela cheia ativa)
            troca cada bloco pra uma variante com fonte/padding maiores —
            sobra espaço real (sem TopNav) pra números grandes e respirados. */}
        <div className={`flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[35%_1fr] ${fullscreenAtivo ? "gap-4" : "gap-2"}`}>
          {/* COLUNA ESQUERDA */}
          <div className={`min-h-0 flex flex-col ${fullscreenAtivo ? "gap-2" : "gap-1.5"}`}>
            <LogoBoxGrande lang={lang} idle={!itemDestaque} grande={fullscreenAtivo} />
            <CampoBuscaBox
              lang={lang} busca={busca} onBusca={setBusca} onKeyDown={handleBuscaKeyDown} inputRef={inputBuscaRef}
              termo={buscaDebounced} resultados={resultados} buscando={buscando} onAdicionar={adicionarAoCarrinho}
              grande={fullscreenAtivo}
            />
            {/* Valor unitário + Total do item lado a lado — quadros compactos
                e "quadrados" (visor de PDV), não mais 2 tiras compridas
                empilhadas. */}
            <div className={`grid grid-cols-2 shrink-0 ${fullscreenAtivo ? "gap-2" : "gap-1.5"}`}>
              <ValorUnitarioBox lang={lang} item={itemDestaque} grande={fullscreenAtivo} />
              <TotalDoItemBox lang={lang} item={itemDestaque} grande={fullscreenAtivo} />
            </div>
            <CodigoBox lang={lang} item={itemDestaque} grande={fullscreenAtivo} />
          </div>

          {/* COLUNA DIREITA */}
          <div className={`min-h-0 flex flex-col ${fullscreenAtivo ? "gap-2" : "gap-1.5"}`}>
            <TabelaItensVenda
              lang={lang} carrinho={carrinho} destaqueId={ultimoAdicionadoId}
              onAlterarQuantidade={alterarQuantidade} onRemover={removerItem}
              onLimpar={() => { setCarrinho([]); setUltimoAdicionadoId(null); inputBuscaRef.current?.focus(); }}
              grande={fullscreenAtivo}
            />
            <RodapeTotais
              lang={lang} subtotal={subtotal} desconto={desconto} tributoAproximado={tributoAproximado} totalAPagar={totalAPagar}
              carrinhoVazio={carrinho.length === 0}
              valorRecebidoInput={valorRecebidoInput} onValorRecebidoInput={setValorRecebidoInput} troco={troco}
              onFinalizar={() => setPainelFinalizarAberto(true)}
              onConfirmarRecebido={() => inputBuscaRef.current?.focus()}
              grande={fullscreenAtivo}
            />
          </div>
        </div>

        <AtalhosRodape lang={lang} grande={fullscreenAtivo} />

        {/* Modais/overlays PRECISAM ficar dentro do container de tela cheia:
            a Fullscreen API só desenha o elemento alvo e seus descendentes —
            fora dele (mesmo com position:fixed) fica invisível enquanto a
            tela cheia está ativa. Se ficassem fora, "Finalizar Venda" ou o
            preço-na-hora sumiriam pro operador nesse modo. */}
        {produtoParaPreco && (
          <DefinirPrecoModal
            lang={lang} produto={produtoParaPreco}
            precoInput={precoManualInput} onPrecoInput={setPrecoManualInput}
            onPrecoBlur={() => {
              const n = Number(precoManualInput.replace(",", "."));
              if (precoManualInput.trim() !== "" && !isNaN(n)) setPrecoManualInput(n.toFixed(2).replace(".", ","));
            }}
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

        {configCupomAberto && dadosEmpresaCupom && (
          <ConfigCupomModal
            lang={lang} config={dadosEmpresaCupom} salvando={salvandoConfigCupom}
            statusQz={statusQz} impressorasQz={impressorasQz} onTestarQz={handleTestarQz}
            onSalvar={handleSalvarConfigCupom}
            onCancelar={() => setConfigCupomAberto(false)}
          />
        )}

        {toast && <Toast toast={toast} />}

        {ultimoCupom && (
          <BotaoImprimirNota lang={lang} cupom={ultimoCupom} jaImpresso={cupomJaImpresso} onImprimir={handleImprimirCupom} />
        )}

        {reautenticarAberto && (
          <ModalReautenticarRetaguarda
            lang={lang} autenticando={autenticandoRetaguarda} erro={erroReauth}
            onConfirmar={handleConfirmarReauth}
            onCancelar={() => { setReautenticarAberto(false); setErroReauth(""); }}
          />
        )}
      </ConteudoPdv>
    </PdvLayout>
  );
}

// Container da Frente de Caixa — é ELE (não a página inteira) quem vira o
// elemento de tela cheia via Fullscreen API: fora do modo cheio se comporta
// exatamente como antes (flex-col h-full min-h-0, dentro do card do
// PdvLayout); no modo cheio vira ele mesmo o viewport inteiro (o browser
// aplica position:fixed+inset:0 automaticamente sobre :fullscreen) — TopNav,
// aviso de cadastro e até o cabeçalho/moldura do PdvLayout ficam de fora
// (são ancestrais do container, não descendentes), então somem sozinhos.
function ConteudoPdv({ containerRef, fullscreenAtivo, onAlternarTelaCheia, lang, caixaAtual, onTrocarCaixa, mostrarConfigCupom, onAbrirConfigCupom, mostrarRetaguarda, onAbrirRetaguarda, children }: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  fullscreenAtivo: boolean;
  onAlternarTelaCheia: () => void;
  lang: Idioma;
  caixaAtual: { nome: string } | undefined;
  onTrocarCaixa: () => void;
  mostrarConfigCupom: boolean;
  onAbrirConfigCupom: () => void;
  mostrarRetaguarda: boolean;
  onAbrirRetaguarda: () => void;
  children: React.ReactNode;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div
      ref={containerRef}
      className={fullscreenAtivo ? "flex flex-col h-screen p-3 md:p-4 overflow-hidden" : "flex flex-col h-full min-h-0"}
      style={fullscreenAtivo ? { background: tokens.fundo } : undefined}
    >
      <div className={`shrink-0 flex items-center justify-between mb-1.5 ${fullscreenAtivo ? "text-xs" : "text-[11px]"}`}>
        <span style={{ opacity: 0.7, color: tokens.texto }}>{t("caixaLabel", lang, { nome: caixaAtual?.nome || "" })}</span>
        <div className="flex items-center gap-4">
          {mostrarRetaguarda && (
            <button onClick={onAbrirRetaguarda} className="flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg"
              style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
              <LayoutDashboard size={13} />
              {t("linkRetaguarda", lang)}
            </button>
          )}
          {mostrarConfigCupom && (
            <button onClick={onAbrirConfigCupom} className="flex items-center gap-1.5 font-semibold" style={{ opacity: 0.7, color: tokens.texto }}>
              <Settings size={13} />
              {t("configurarImpressao", lang)}
            </button>
          )}
          <button onClick={onTrocarCaixa} className="font-semibold underline" style={{ opacity: 0.7, color: tokens.texto }}>{t("trocarCaixa", lang)}</button>
          <button onClick={onAlternarTelaCheia} className="flex items-center gap-1.5 font-semibold" style={{ opacity: 0.7, color: tokens.texto }}>
            {fullscreenAtivo ? <Minimize2 size={16} /> : <Maximize2 size={13} />}
            {t(fullscreenAtivo ? "sairTelaCheia" : "telaCheia", lang)}
          </button>
        </div>
      </div>
      {children}
    </div>
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

// Quadro genérico da coluna esquerda — label pequeno em cima, valor grande
// embaixo, mesma moldura (cardBg/cardBorda) que o resto do PDV já usa.
// grande=true (tela cheia) troca pra padding/fonte bem maiores — sobra
// espaço de verdade sem a TopNav, e é ali que o visor de PDV tem que ficar
// grande e respirado.
function QuadroValor({ label, valor, corValor, grande, tamanho }: {
  label: string; valor: string; corValor?: string; grande?: boolean; tamanho?: string;
}) {
  const { tokens } = useTemaPdv();
  const tamanhoFinal = tamanho ?? (grande ? "text-2xl md:text-3xl" : "text-lg md:text-xl");
  return (
    <div className={grande ? "shrink-0 rounded-xl px-3 py-2" : "shrink-0 rounded-xl px-2.5 py-1.5"}
      style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <p className={grande ? "text-[10px] font-bold uppercase tracking-wide mb-1 truncate" : "text-[9px] font-bold uppercase tracking-wide leading-none truncate"}
        style={{ color: tokens.cardTexto, opacity: 0.72 }}>{label}</p>
      <p className={`${tamanhoFinal} font-black truncate leading-tight`} style={{ color: corValor || tokens.cardTexto }}>{valor}</p>
    </div>
  );
}

// Quadro grande da logo — ocupa o espaço que no layout de referência seria
// o carrinho. Logo imponente + "PDV Axioma — Sistema Inteligente" como
// identidade fixa do caixa; idleTitulo/idleSubtitulo viram subtexto menor
// abaixo, só enquanto ocioso (nenhum item em destaque). Brilho sutil na
// logo só enquanto ocioso; a animação para sozinha assim que um item entra
// no carrinho.
function LogoBoxGrande({ lang, idle, grande }: { lang: Idioma; idle: boolean; grande?: boolean }) {
  const { tokens } = useTemaPdv();
  // ZERO SCROLL é prioridade máxima aqui (acima de deixar o logo grande):
  // é o ÚNICO bloco flex-1 da coluna, então ele quem absorve o espaço que
  // sobra dos outros (shrink-0). Sem min-height fixo — um número fixo
  // "mentiria" pro flexbox e deixaria conteúdo vazar quando a coluna
  // aperta (foi exatamente isso que cortou o subtítulo antes). Toda linha
  // de texto é truncate (1 linha só, com "…") — altura sempre previsível.
  // A logo em si usa `fill`+`object-contain` dentro de um wrapper flex-1
  // (não mais width/height fixos em px): ela cresce sozinha pra preencher
  // o espaço vertical que sobra no quadro (mais em tela cheia, onde sobra
  // mais espaço de verdade) sem nunca estourar — quem trava o limite é o
  // próprio flexbox, não um número chutado.
  return (
    <div className={`flex-1 min-h-0 rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden ${grande ? "p-4 gap-2" : "p-2 gap-1"}`}
      style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <motion.div
        className={`relative w-full min-h-0 flex-1 ${grande ? "max-w-[80%]" : "max-w-[74%]"}`}
        animate={idle ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
        transition={idle ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}>
        <Image src="/logo-aitech.png" alt="Axioma" fill sizes="(max-width: 1024px) 60vw, 25vw" className="object-contain" priority />
      </motion.div>
      <p className={`font-black truncate shrink-0 ${grande ? "text-lg" : "text-xs"}`} style={{ color: tokens.cardTexto }}>
        PDV Axioma — {t("sistemaInteligente", lang)}
      </p>
      {idle && (
        <div className="max-w-[90%] shrink-0">
          <p className={`font-semibold truncate ${grande ? "text-sm mb-0.5" : "text-[10px]"}`} style={{ color: tokens.cardTexto, opacity: 0.72 }}>{t("idleTitulo", lang)}</p>
          <p className={`truncate ${grande ? "text-xs" : "text-[9px]"}`} style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("idleSubtitulo", lang)}</p>
        </div>
      )}
    </div>
  );
}

// Quadro "Código de barras" — mesma moldura dos demais, com o campo de
// busca/bipe e o dropdown de resultados por dentro (posição relativa ao
// próprio quadro, igual ao comportamento de antes).
function CampoBuscaBox({ lang, busca, onBusca, onKeyDown, inputRef, termo, resultados, buscando, onAdicionar, grande }: {
  lang: Idioma; busca: string; onBusca: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  termo: string; resultados: ProdutoPdv[]; buscando: boolean; onAdicionar: (p: ProdutoPdv) => void;
  grande?: boolean;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className={`shrink-0 relative rounded-xl ${grande ? "px-3 py-2" : "px-2.5 py-1.5"}`} style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <p className={grande ? "text-[10px] font-bold uppercase tracking-wide mb-1" : "text-[9px] font-bold uppercase tracking-wide leading-none mb-1"}
        style={{ color: tokens.cardTexto, opacity: 0.72 }}>{t("labelCodigoBarras", lang)}</p>
      <CampoBusca lang={lang} busca={busca} onBusca={onBusca} onKeyDown={onKeyDown} inputRef={inputRef} grande={grande} />
      {busca.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-2xl overflow-hidden shadow-2xl">
          <ResultadosBusca lang={lang} termo={termo} resultados={resultados} buscando={buscando} onAdicionar={onAdicionar} />
        </div>
      )}
    </div>
  );
}

function ValorUnitarioBox({ lang, item, grande }: { lang: Idioma; item: ItemCarrinho | null; grande?: boolean }) {
  const precoUnit = item ? item.produto.preco_venda ?? item.produto.preco_sugerido ?? 0 : 0;
  return <QuadroValor label={t("valorUnitario", lang)} valor={moeda(precoUnit)} grande={grande} />;
}

function TotalDoItemBox({ lang, item, grande }: { lang: Idioma; item: ItemCarrinho | null; grande?: boolean }) {
  const precoUnit = item ? item.produto.preco_venda ?? item.produto.preco_sugerido ?? 0 : 0;
  const total = item ? precoUnit * item.quantidade : 0;
  // Sem corValor: tokens.acento em cima de tokens.cardBg (o fundo do próprio
  // quadro) não tem contraste garantido em todos os temas — cardTexto
  // (default do QuadroValor) é o único par sempre calibrado pra essa
  // superfície. O destaque vem do tamanho/peso da fonte, não da cor.
  return <QuadroValor label={t("totalDoItem", lang)} valor={moeda(total)} grande={grande} />;
}

function CodigoBox({ lang, item, grande }: { lang: Idioma; item: ItemCarrinho | null; grande?: boolean }) {
  const codigo = item ? item.produto.codigo_barras || item.produto.sku || "—" : "—";
  return <QuadroValor label={t("labelCodigoItem", lang)} valor={codigo} grande={grande} tamanho={grande ? "text-xl md:text-2xl" : "text-lg md:text-xl"} />;
}

// Grid, não <table> — de propósito: preciso do cabeçalho de colunas FORA
// da área que rola e só as LINHAS dentro de um flex-1/overflow-y-auto.
// Com <table>, thead/tbody não têm scroll independente sem truques (duas
// tabelas separadas, tamanhos de coluna sincronizados à mão — mais frágil
// que isto). Mesmas colunas via grid-template-columns idêntico no
// cabeçalho e em cada linha garante alinhamento.
const COLUNAS_GRID = "44px 96px minmax(0,1fr) 116px 96px 120px";

function TabelaItensVenda({ lang, carrinho, destaqueId, onAlterarQuantidade, onRemover, onLimpar, grande }: {
  lang: Idioma; carrinho: ItemCarrinho[]; destaqueId: string | null;
  onAlterarQuantidade: (produtoId: string, delta: number) => void;
  onRemover: (produtoId: string) => void;
  onLimpar: () => void;
  grande?: boolean;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className={`shrink-0 flex items-center justify-between ${grande ? "px-3 py-2" : "px-3 py-1.5"}`} style={{ background: tokens.acentoSuaveBg }}>
        <div className="flex items-center gap-1.5">
          <ShoppingCart size={grande ? 16 : 13} style={{ color: tokens.acento }} />
          <h3 className={grande ? "text-sm font-bold" : "text-xs font-bold"} style={{ color: tokens.texto }}>{t("itensDaVenda", lang)} ({carrinho.length})</h3>
        </div>
        <button onClick={onLimpar} disabled={carrinho.length === 0} className={`font-semibold disabled:opacity-40 ${grande ? "text-xs" : "text-[11px]"}`} style={{ color: tokens.textoMuted }}>{t("limparCarrinho", lang)}</button>
      </div>

      <div className={`shrink-0 grid items-center uppercase tracking-wide ${grande ? "px-3 py-1.5 text-[11px]" : "px-3 py-1 text-[10px]"}`}
        style={{ gridTemplateColumns: COLUNAS_GRID, color: tokens.cardTexto, opacity: 0.65, borderBottom: `1px solid ${tokens.cardBorda}` }}>
        <span>{t("colNumero", lang)}</span>
        <span>{t("colCodigo", lang)}</span>
        <span>{t("colDescricao", lang)}</span>
        <span className="text-center">{t("colQtd", lang)}</span>
        <span className="text-right">{t("colValorUnit", lang)}</span>
        <span className="text-right">{t("colTotal", lang)}</span>
      </div>

      {/* overflow-y-auto fica como rede de segurança só pro caso extremo de
          carrinho com dezenas de itens que não caibam nem no tamanho mínimo
          de linha legível — com o rodapé compactado, o caso comum (até
          ~8-10 itens numa tela de notebook, mais ainda em tela cheia) cabe
          inteiro sem rolar. */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {carrinho.length === 0 ? (
          <p className={`text-center ${grande ? "text-sm py-6" : "text-xs py-4"}`} style={{ color: tokens.cardTexto, opacity: 0.55 }}>{t("carrinhoVazio", lang)}</p>
        ) : (
          carrinho.map(({ produto, quantidade }, idx) => {
            const precoUnit = produto.preco_venda ?? produto.preco_sugerido ?? 0;
            const emDestaque = produto.id === destaqueId;
            return (
              <div key={produto.id} className={`grid items-center ${grande ? "px-3 py-1.5 text-sm md:text-base" : "px-3 py-1 text-xs md:text-sm"}`}
                style={{ gridTemplateColumns: COLUNAS_GRID, background: emDestaque ? tokens.acentoSuaveBg : "transparent", borderBottom: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
                <span style={{ opacity: 0.7 }}>{idx + 1}</span>
                <span className="truncate pr-2" style={{ opacity: 0.7 }}>{produto.codigo_barras || produto.sku || "—"}</span>
                <span className="font-semibold truncate pr-2">{produto.nome}</span>
                <div className={`flex items-center justify-center ${grande ? "gap-2" : "gap-1"}`}>
                  <button onClick={() => onAlterarQuantidade(produto.id, -1)} className={grande ? "p-1.5 rounded-md" : "p-0.5 rounded-md"} style={{ background: tokens.inputBg, color: tokens.inputTexto }}><Minus size={grande ? 15 : 11} /></button>
                  <span className={grande ? "w-6 text-center font-bold" : "w-4 text-center font-bold"}>{quantidade}</span>
                  <button onClick={() => onAlterarQuantidade(produto.id, 1)} className={grande ? "p-1.5 rounded-md" : "p-0.5 rounded-md"} style={{ background: tokens.inputBg, color: tokens.inputTexto }}><Plus size={grande ? 15 : 11} /></button>
                </div>
                <span className="text-right whitespace-nowrap">{moeda(precoUnit)}</span>
                <div className={`flex items-center justify-end whitespace-nowrap ${grande ? "gap-2" : "gap-1.5"}`}>
                  <span className="font-bold">{moeda(precoUnit * quantidade)}</span>
                  <button onClick={() => onRemover(produto.id)} className={grande ? "p-1.5 rounded-md shrink-0" : "p-0.5 rounded-md shrink-0"} style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}><Trash2 size={grande ? 15 : 11} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RodapeTotais({
  lang, subtotal, desconto, tributoAproximado, totalAPagar, carrinhoVazio,
  valorRecebidoInput, onValorRecebidoInput, troco, onFinalizar, onConfirmarRecebido, grande,
}: {
  lang: Idioma; subtotal: number; desconto: number; tributoAproximado: number; totalAPagar: number;
  carrinhoVazio: boolean; valorRecebidoInput: string; onValorRecebidoInput: (v: string) => void; troco: number;
  onFinalizar: () => void; onConfirmarRecebido: () => void; grande?: boolean;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className={`shrink-0 rounded-xl ${grande ? "p-3" : "p-2 md:p-2.5"}`} style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      {/* SUBTOTAL */}
      <div className={`flex items-center justify-between ${grande ? "mb-1.5" : "mb-1"}`}>
        <span className={grande ? "text-sm font-semibold" : "text-xs font-semibold"} style={{ color: tokens.cardTexto, opacity: 0.75 }}>{t("subtotal", lang)}</span>
        <span className={grande ? "text-xl font-black" : "text-base font-black"} style={{ color: tokens.cardTexto }}>{moeda(subtotal)}</span>
      </div>
      {desconto > 0 && (
        <div className={`flex items-center justify-between ${grande ? "mb-1.5 text-sm" : "mb-1 text-xs"}`} style={{ color: tokens.cardTexto }}>
          <span style={{ opacity: 0.75 }}>{t("desconto", lang)}</span>
          <span className="font-semibold">- {moeda(desconto)}</span>
        </div>
      )}

      <div className={`flex items-center justify-between gap-4 pt-1 ${grande ? "pt-1.5 mb-1.5" : "mb-1"}`} style={{ borderTop: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <span className={grande ? "text-sm font-bold" : "text-xs md:text-sm font-bold"} style={{ color: tokens.texto }}>{t("totalAPagar", lang)}</span>
        {/* cardTexto, não acento: tokens.acento em cima de tokens.cardBg não
            garante 4.5:1 em todos os temas (no intermediário os dois são
            azuis escuros próximos — quase some). O destaque fica no
            tamanho/peso da fonte, que já é o maior deste bloco. */}
        <span className={grande ? "text-3xl font-black" : "text-xl md:text-2xl font-black"} style={{ color: tokens.cardTexto }}>{moeda(totalAPagar)}</span>
      </div>

      {/* Tributo aproximado (Lei 12.741) — linha própria, legível, junto do
          Subtotal/Total a pagar (não mais espremida perto do rodapé). */}
      <div className={`flex items-center justify-between gap-3 font-semibold ${grande ? "mb-2 text-xs" : "mb-1.5 text-[11px]"}`} style={{ color: tokens.cardTexto }}>
        <span className="truncate">{t("tributosAproximados", lang)}</span>
        <span className="shrink-0">{moeda(tributoAproximado)}</span>
      </div>

      {/* TOTAL RECEBIDO e TROCO — lado a lado, curtos/compactos (cara de
          visor de PDV: pouca altura, número grande). Só de exibição:
          calculadora de troco pro operador, nunca vai pro finalizar_venda. */}
      <div className={`grid grid-cols-2 ${grande ? "gap-2 mb-2" : "gap-2 mb-1.5"}`}>
        <div className={grande ? "rounded-lg px-2.5 py-1.5" : "rounded-lg px-2 py-1"} style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
          <p className={`font-bold uppercase tracking-wide leading-none flex items-center gap-1 ${grande ? "text-[10px] mb-1" : "text-[9px] mb-0.5"}`} style={{ color: tokens.cardTexto, opacity: 0.7 }}>
            <Banknote size={grande ? 11 : 10} />{t("totalRecebido", lang)}
          </p>
          <input
            value={valorRecebidoInput} onChange={(e) => onValorRecebidoInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); onConfirmarRecebido(); } }}
            inputMode="decimal" placeholder="0,00"
            className={`w-full bg-transparent outline-none font-black ${grande ? "text-xl" : "text-base md:text-lg"}`}
            style={{ color: tokens.cardTexto }}
          />
        </div>
        <div className={grande ? "rounded-lg px-2.5 py-1.5" : "rounded-lg px-2 py-1"} style={{ background: tokens.acentoSuaveBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
          <p className={`font-bold uppercase tracking-wide leading-none ${grande ? "text-[10px] mb-1" : "text-[9px] mb-0.5"}`} style={{ color: tokens.cardTexto, opacity: 0.7 }}>{t("troco", lang)}</p>
          <p className={`font-black truncate ${grande ? "text-xl" : "text-base md:text-lg"}`} style={{ color: troco < 0 ? "#f87171" : tokens.acento }}>
            {troco < 0 ? t("faltam", lang, { valor: moeda(Math.abs(troco)) }) : moeda(troco)}
          </p>
        </div>
      </div>

      <button onClick={onFinalizar} disabled={carrinhoVazio}
        className={`w-full rounded-lg font-black disabled:opacity-40 ${grande ? "py-2 text-base" : "py-1.5 text-sm"}`}
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        {t("finalizarVenda", lang)}
      </button>
    </div>
  );
}

function AtalhosRodape({ lang, grande }: { lang: Idioma; grande?: boolean }) {
  const { tokens } = useTemaPdv();
  const atalhos: (keyof typeof txt)[] = ["atalhoEnter", "atalhoF2", "atalhoDelete", "atalhoEsc"];
  return (
    <div className={`shrink-0 flex items-center justify-center flex-wrap ${grande ? "gap-6 mt-2 pt-2 text-xs" : "gap-4 md:gap-6 mt-1.5 pt-1.5 text-[11px]"}`}
      style={{ color: tokens.textoMuted, borderTop: `1px solid ${tokens.acentoSuaveBorda}` }}>
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
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
function DefinirPrecoModal({ lang, produto, precoInput, onPrecoInput, onPrecoBlur, confirmando, onConfirmar, onCancelar }: {
  lang: Idioma; produto: ProdutoPdv;
  precoInput: string; onPrecoInput: (v: string) => void; onPrecoBlur: () => void;
  confirmando: boolean; onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: tokens.texto }}>{t("definirPrecoTitulo", lang)}</h3>
        <p className="text-base font-bold truncate mb-2" style={{ color: tokens.texto }}>{produto.nome}</p>
        <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("definirPrecoSubtitulo", lang)}</p>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("definirPrecoLabel", lang)}</label>
        <input
          value={precoInput} onChange={(e) => onPrecoInput(e.target.value)} onBlur={onPrecoBlur}
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

function ModalReautenticarRetaguarda({ lang, autenticando, erro, onConfirmar, onCancelar }: {
  lang: Idioma; autenticando: boolean; erro: string;
  onConfirmar: (senha: string) => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [senha, setSenha] = useState("");

  function handleConfirmar() {
    if (!senha) return;
    onConfirmar(senha);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center gap-2 mb-1">
          <Lock size={16} style={{ color: tokens.acento }} />
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("reautenticarTitulo", lang)}</h3>
        </div>
        <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("reautenticarSubtitulo", lang)}</p>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("senhaLabel", lang)}</label>
        <input
          value={senha} onChange={(e) => { setSenha(e.target.value); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleConfirmar(); }}
          type="password" autoFocus
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-2"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />
        {erro && <p className="text-xs font-semibold mb-3" style={{ color: "#f87171" }}>{erro}</p>}

        <div className="flex items-center gap-2 mt-2">
          <button onClick={onCancelar} disabled={autenticando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("reautenticarCancelar", lang)}
          </button>
          <button onClick={handleConfirmar} disabled={autenticando || !senha}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {autenticando && <Loader2 className="animate-spin" size={14} />}
            {autenticando ? t("reautenticarConfirmando", lang) : t("reautenticarConfirmar", lang)}
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

function CampoBusca({ lang, busca, onBusca, onKeyDown, inputRef, grande }: {
  lang: Idioma; busca: string; onBusca: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  grande?: boolean;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="relative">
      <Search size={grande ? 20 : 18} className={`absolute top-1/2 -translate-y-1/2 ${grande ? "left-3.5" : "left-3"}`} style={{ color: tokens.acento }} />
      <input
        ref={inputRef} autoFocus value={busca} onChange={(e) => onBusca(e.target.value)} onKeyDown={onKeyDown}
        placeholder={t("buscarPlaceholder", lang)}
        className={`w-full font-semibold outline-none rounded-xl ${grande ? "pl-10 pr-3 py-2.5 text-base md:text-lg" : "pl-9 pr-3 py-2 text-sm md:text-base"}`}
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
            <span className="text-sm font-bold" style={{ color: tokens.cardTexto }}>
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

// ============================================================================
// CUPOM NÃO-FISCAL + IMPRESSÃO (PDV Fase 3, Etapa 3)
// ============================================================================

// window.print() da PÁGINA inteira (mesmo só mostrando o cupom via
// visibility:hidden no resto) se mostrou frágil na prática: qualquer
// ancestral com transform/filter (framer-motion anima alguns blocos desta
// tela) vira "containing block" e pode cortar um position:fixed, e o modo
// tela cheia (Fullscreen API) também mexe no que o navegador desenha. Um
// <iframe> escondido com SÓ o HTML do cupom, sem nada da página por trás,
// não depende de nenhum desses dois — é o documento inteiro dele.
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function linhaHtml(label: string, valor: string, negrito?: boolean): string {
  return `<div style="display:flex;justify-content:space-between;gap:8px;${negrito ? "font-weight:700;" : ""}"><span>${escapeHtml(label)}</span><span>${escapeHtml(valor)}</span></div>`;
}

function gerarHtmlCupom(empresa: DadosEmpresaCupom | null, cupom: CupomVenda, lang: Idioma): string {
  const dataHora = new Date(cupom.criadoEm).toLocaleString("pt-BR");
  const separador = `<hr style="border:none;border-top:1px dashed #000;margin:6px 0">`;
  const itensHtml = cupom.itens.map((item) => `
    <p style="margin:2px 0">${escapeHtml(item.nome)}${item.codigo ? ` (${escapeHtml(item.codigo)})` : ""}</p>
    ${linhaHtml(`${item.quantidade} x ${moeda(item.precoUnit)}`, moeda(item.precoUnit * item.quantidade))}
  `).join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Cupom</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.4; color: #000; background: #fff; width: 72mm; margin: 0; padding: 4px; }
  p { margin: 2px 0; }
</style>
</head><body>
  <div style="text-align:center">
    ${empresa?.nome ? `<p style="font-weight:700">${escapeHtml(empresa.nome)}</p>` : ""}
    ${empresa?.cnpj ? `<p>CNPJ: ${escapeHtml(empresa.cnpj)}</p>` : ""}
    ${empresa?.endereco ? `<p>${escapeHtml(empresa.endereco)}</p>` : ""}
  </div>
  <p style="text-align:center;font-weight:700;margin:6px 0">${escapeHtml(t("cupomNaoFiscal", lang))}</p>
  <p>${dataHora}</p>
  <p>${escapeHtml(t("cupomNumeroVenda", lang))}: ${cupom.vendaId.slice(0, 8).toUpperCase()}</p>
  <p>${escapeHtml(t("cupomOperador", lang))}: ${escapeHtml(cupom.operador)}</p>
  <p>${escapeHtml(t("cupomCaixa", lang))}: ${escapeHtml(cupom.caixa)}</p>
  ${separador}
  ${itensHtml}
  ${separador}
  ${linhaHtml(t("subtotal", lang), moeda(cupom.subtotal))}
  ${cupom.desconto > 0 ? linhaHtml(t("desconto", lang), `- ${moeda(cupom.desconto)}`) : ""}
  ${linhaHtml(t("totalAPagar", lang), moeda(cupom.totalAPagar), true)}
  ${separador}
  ${linhaHtml(t("formaPagamentoLabel", lang), labelFormaPagamento(cupom.formaPagamento, lang))}
  ${cupom.valorRecebido > 0 ? linhaHtml(t("totalRecebido", lang), moeda(cupom.valorRecebido)) : ""}
  ${cupom.valorRecebido > 0 ? linhaHtml(t("troco", lang), moeda(Math.max(cupom.troco, 0))) : ""}
  ${cupom.cpfNota ? linhaHtml(t("cpfNotaLabel", lang), cupom.cpfNota) : ""}
  <p style="margin-top:6px">${escapeHtml(t("tributosAproximados", lang))}: ${moeda(cupom.tributoAproximado)}</p>
  ${empresa?.rodape ? `<p style="text-align:center;margin-top:8px">${escapeHtml(empresa.rodape)}</p>` : ""}
</body></html>`;
}

const IFRAME_IMPRESSAO_ID = "cupom-print-frame";

// Reaproveita o mesmo iframe entre impressões (evita empilhar um por venda).
// display:none NÃO é usado nele — um iframe com display:none não roda
// print() de forma confiável em todo navegador; 0x0px fora da tela é o que
// funciona em todos.
function imprimirHtmlEmIframe(html: string) {
  let iframe = document.getElementById(IFRAME_IMPRESSAO_ID) as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = IFRAME_IMPRESSAO_ID;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
  }
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) return;
  doc.open();
  doc.write(html);
  doc.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
}

// ============================================================================
// ESC/POS (PDV Fase 3, Etapa 4) — mesmo conteúdo/ordem do gerarHtmlCupom()
// (HTML) acima, só que em bytes crus de comando pra impressora térmica via
// QZ Tray (ver lib/qzTrayHelpers.ts). String simples no array = QZ Tray
// interpreta como comando raw automaticamente, sem precisar montar objeto.
// ============================================================================

const ESCPOS_LARGURA = 42; // Font A padrão em impressoras térmicas de 80mm.
// ponytail: largura fixa em 42 colunas — se a impressora do cliente usar
// fonte diferente (mais estreita/larga), ajustar aqui.
const ESC = "\x1B";
const GS = "\x1D";

// ESC/POS não garante acentuação sem escolher a codepage certa por modelo
// de impressora — tira acento antes de mandar, assim funciona igual em
// qualquer impressora térmica sem precisar testar codepage por cliente.
// ponytail: sem seleção de codepage. Upgrade: mandar ESC t <n> com a
// codepage certa pro modelo do cliente, se reclamarem de acento sumido.
// Marcas diacríticas combinantes (U+0300–U+036F) que sobram depois do NFD —
// evita literal de regex com caractere combinante solto no código-fonte
// (renderiza colado na letra anterior em muitos editores).
function semAcentoEscPos(s: string): string {
  return Array.from(s.normalize("NFD"))
    .filter((c) => { const cp = c.codePointAt(0)!; return cp < 0x0300 || cp > 0x036f; })
    .join("");
}

function linhaEscPos(esq: string, dir: string, largura = ESCPOS_LARGURA): string {
  const e = semAcentoEscPos(esq), d = semAcentoEscPos(dir);
  const espacos = Math.max(1, largura - e.length - d.length);
  return e + " ".repeat(espacos) + d + "\n";
}

function montarComandosEscPos(empresa: DadosEmpresaCupom | null, cupom: CupomVenda, lang: Idioma): string[] {
  const linhas: string[] = [ESC + "@"]; // inicializa a impressora

  linhas.push(ESC + "a" + "\x01"); // centralizado
  if (empresa?.nome) linhas.push(ESC + "E" + "\x01" + semAcentoEscPos(empresa.nome) + "\n" + ESC + "E" + "\x00");
  if (empresa?.cnpj) linhas.push(`CNPJ: ${empresa.cnpj}\n`);
  if (empresa?.endereco) linhas.push(semAcentoEscPos(empresa.endereco) + "\n");
  linhas.push(ESC + "E" + "\x01" + semAcentoEscPos(t("cupomNaoFiscal", lang)) + "\n" + ESC + "E" + "\x00");

  linhas.push(ESC + "a" + "\x00"); // volta pro alinhamento à esquerda
  linhas.push(new Date(cupom.criadoEm).toLocaleString("pt-BR") + "\n");
  linhas.push(`${semAcentoEscPos(t("cupomNumeroVenda", lang))}: ${cupom.vendaId.slice(0, 8).toUpperCase()}\n`);
  linhas.push(`${semAcentoEscPos(t("cupomOperador", lang))}: ${semAcentoEscPos(cupom.operador)}\n`);
  linhas.push(`${semAcentoEscPos(t("cupomCaixa", lang))}: ${semAcentoEscPos(cupom.caixa)}\n`);
  linhas.push("-".repeat(ESCPOS_LARGURA) + "\n");

  for (const item of cupom.itens) {
    linhas.push(semAcentoEscPos(item.nome) + (item.codigo ? ` (${item.codigo})` : "") + "\n");
    linhas.push(linhaEscPos(`${item.quantidade} x ${moeda(item.precoUnit)}`, moeda(item.precoUnit * item.quantidade)));
  }
  linhas.push("-".repeat(ESCPOS_LARGURA) + "\n");

  linhas.push(linhaEscPos(t("subtotal", lang), moeda(cupom.subtotal)));
  if (cupom.desconto > 0) linhas.push(linhaEscPos(t("desconto", lang), `- ${moeda(cupom.desconto)}`));
  linhas.push(GS + "!" + "\x11"); // negrito em dobro (largura+altura) só pro TOTAL
  linhas.push(linhaEscPos(t("totalAPagar", lang), moeda(cupom.totalAPagar), Math.floor(ESCPOS_LARGURA / 2)));
  linhas.push(GS + "!" + "\x00"); // volta ao tamanho normal
  linhas.push("-".repeat(ESCPOS_LARGURA) + "\n");

  linhas.push(linhaEscPos(t("formaPagamentoLabel", lang), labelFormaPagamento(cupom.formaPagamento, lang)));
  if (cupom.valorRecebido > 0) linhas.push(linhaEscPos(t("totalRecebido", lang), moeda(cupom.valorRecebido)));
  if (cupom.valorRecebido > 0) linhas.push(linhaEscPos(t("troco", lang), moeda(Math.max(cupom.troco, 0))));
  if (cupom.cpfNota) linhas.push(linhaEscPos(t("cpfNotaLabel", lang), cupom.cpfNota));
  linhas.push(`${semAcentoEscPos(t("tributosAproximados", lang))}: ${moeda(cupom.tributoAproximado)}\n`);

  if (empresa?.rodape) {
    linhas.push(ESC + "a" + "\x01");
    linhas.push(semAcentoEscPos(empresa.rodape) + "\n");
  }

  linhas.push("\n\n\n");
  linhas.push(GS + "V" + "\x00"); // corte de papel
  return linhas;
}

// Aviso tipo "toast", num canto — de propósito NÃO fica no centro/embaixo:
// ali cobria a lista de produtos e o rodapé de totais (Finalizar Venda da
// PRÓXIMA venda fica bem ali embaixo). Canto superior direito, abaixo da
// faixa de botões do topo, mesmo padrão de posição do Toast genérico desta
// tela — só que maior e some sozinho (ver useEffect de 9s + reset em
// adicionarAoCarrinhoDireto), nunca bloqueando o conteúdo por baixo.
// Fundo SEMPRE opaco (tokens.modalBg, não cardBg/acentoSuaveBg) — é um
// overlay por cima do conteúdo real da tela, não uma tinta sobre superfície
// já opaca.
function BotaoImprimirNota({ lang, cupom, jaImpresso, onImprimir }: {
  lang: Idioma; cupom: CupomVenda; jaImpresso: boolean; onImprimir: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed top-20 right-4 z-50 w-full max-w-xs flex flex-col items-stretch gap-2.5 rounded-2xl px-4 py-4 shadow-2xl" style={{ background: tokens.modalBg, border: `3px solid ${tokens.acento}` }}>
      <span className="text-sm font-bold text-center" style={{ color: tokens.texto }}>
        {t("vendaConcluida", lang, { valor: moeda(cupom.totalAPagar) })}
      </span>
      <button onClick={onImprimir}
        className="flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl text-lg font-black uppercase tracking-wide"
        style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
        <Printer size={22} />
        {t("imprimirComprovante", lang)}
      </button>
      {jaImpresso && (
        <button onClick={onImprimir} className="text-sm font-semibold underline" style={{ color: tokens.texto }}>
          {t("reimprimirComprovante", lang)}
        </button>
      )}
    </div>
  );
}

function ConfigCupomModal({ lang, config, salvando, statusQz, impressorasQz, onTestarQz, onSalvar, onCancelar }: {
  lang: Idioma; config: DadosEmpresaCupom; salvando: boolean;
  statusQz: "verificando" | "conectado" | "desconectado";
  impressorasQz: string[];
  onTestarQz: () => void;
  onSalvar: (v: { impressaoAutomatica: boolean; rodape: string; impressora: string }) => void;
  onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [impressaoAutomatica, setImpressaoAutomatica] = useState(config.impressaoAutomatica);
  const [rodape, setRodape] = useState(config.rodape);
  const [impressora, setImpressora] = useState(config.impressora);

  const chaveStatusQz = statusQz === "conectado" ? "qzStatusConectado" : statusQz === "desconectado" ? "qzStatusDesconectado" : "qzStatusVerificando";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: tokens.texto }}>{t("configCupomTitulo", lang)}</h3>

        <label className="flex items-start gap-2 mb-2 cursor-pointer">
          <input type="checkbox" checked={impressaoAutomatica} onChange={(e) => setImpressaoAutomatica(e.target.checked)} className="mt-0.5" />
          <span className="text-sm font-semibold" style={{ color: tokens.texto }}>{t("configCupomImpressaoAutomaticaLabel", lang)}</span>
        </label>
        <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("configCupomImpressaoAutomaticaAjuda", lang)}</p>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("qzImpressoraLabel", lang)}</label>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold" style={{ color: statusQz === "conectado" ? tokens.acento : statusQz === "desconectado" ? "#f87171" : tokens.textoMuted }}>
            {t(chaveStatusQz, lang)}
          </span>
          <button onClick={onTestarQz} disabled={statusQz === "verificando"} className="text-xs font-semibold underline disabled:opacity-50" style={{ color: tokens.texto }}>
            {statusQz === "verificando" ? t("qzTestando", lang) : t("qzTestarConexao", lang)}
          </button>
        </div>
        <select value={impressora} onChange={(e) => setImpressora(e.target.value)}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-1"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
          <option value="">{t("qzImpressoraSelecione", lang)}</option>
          {impressorasQz.map((nome) => <option key={nome} value={nome}>{nome}</option>)}
        </select>
        {statusQz === "conectado" && impressorasQz.length === 0 && (
          <p className="text-xs mb-3" style={{ color: "#f87171" }}>{t("qzSemImpressoras", lang)}</p>
        )}

        <label className="text-xs font-semibold block mb-1 mt-3" style={{ color: tokens.texto }}>{t("configCupomRodapeLabel", lang)}</label>
        <input
          value={rodape} onChange={(e) => setRodape(e.target.value)}
          placeholder={t("configCupomRodapePlaceholder", lang)}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={salvando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelarPainel", lang)}
          </button>
          <button onClick={() => onSalvar({ impressaoAutomatica, rodape, impressora })} disabled={salvando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {salvando && <Loader2 className="animate-spin" size={14} />}
            {salvando ? t("configCupomSalvando", lang) : t("configCupomSalvar", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
