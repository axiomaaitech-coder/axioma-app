"use client";
// 🦅 AXIOMA AI.TECH — PDV: Retaguarda do Caixa. Área exclusiva dono/admin —
// operador/financeiro/contabil/leitor são redirecionados pra /pdv/venda
// assim que o papel carrega. Essa checagem aqui é só a PRIMEIRA camada
// (evita renderizar a tela); a proteção de verdade é no banco — toda leitura
// sensível (resumo do dia, vendas por categoria, prejuízo, fechar turno,
// sangria/suprimento, salvar config) passa pelas funções retaguarda_* que
// recusam quem não é dono/admin com erro AX020, mesmo se alguém chamasse
// direto pela API sem passar por esta tela. Ver PDV-RETAGUARDA-SQL-REVISAO.txt.
//
// NÃO dá baixa de estoque nem grava venda de novo — só lê, soma e agrupa o
// que finalizar_venda() + criarMovimentacao() já gravaram na hora da venda.
import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, RefreshCw, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Loader2, Search, X, Eye, ChevronDown, ChevronUp, Pencil, Trash2,
  Calculator, Banknote,
} from "lucide-react";
import PdvLayout, { useTemaPdv } from "../../../../components/PdvLayout";
import { CardGenerico, BreadcrumbGenerico, EstadoVazio, type ItemBreadcrumb } from "../../../../components/PdvCatalogoNav";
import { useLanguage } from "../../../../lib/LanguageContext";
import type { Idioma } from "../../../../lib/translations";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../../lib/empresaHelpers";
import {
  obterConfigRetaguarda, salvarConfigRetaguarda, obterResumoDia, obterVendasPorProduto,
  obterVendasProdutoDetalhe, obterItensPrejuizo, listarTurnosAbertos, fecharTurno,
  registrarMovimentacao, obterComposicaoEsperado, listarMovimentacoesTurno,
  editarMovimentacao, excluirMovimentacao, obterUsuarioAtualId, hojeLocal,
  type ConfigRetaguarda, type ModoRetaguarda, type ResumoDia, type VendaPorProduto,
  type VendaDetalheProduto, type ItemPrejuizo, type TurnoAberto, type ResultadoFechamento,
  type ComposicaoLinha, type MovimentacaoCaixa,
} from "../../../../lib/retaguardaHelpers";

const CHAVE_CONFIGURADO_LOCAL = "axioma_retaguarda_configurado_";
const INTERVALO_ATUALIZACAO_MS = 30000;

const txt = {
  titulo: { pt: "Retaguarda do Caixa", en: "Cash Back Office", es: "Retaguardia de Caja" },
  subtitulo: {
    pt: "Acompanhe as vendas e feche o caixa com segurança.",
    en: "Track sales and close the register safely.",
    es: "Siga las ventas y cierre la caja con seguridad.",
  },
  carregando: { pt: "Carregando…", en: "Loading…", es: "Cargando…" },
  redirecionando: { pt: "Redirecionando…", en: "Redirecting…", es: "Redirigiendo…" },

  assistenteTitulo: { pt: "Como você quer acompanhar o caixa?", en: "How do you want to track the register?", es: "¿Cómo quiere seguir la caja?" },
  assistenteSubtitulo: {
    pt: "3 perguntas rápidas — dá pra mudar depois a qualquer momento no botão Configurar.",
    en: "3 quick questions — you can change this later anytime in the Configure button.",
    es: "3 preguntas rápidas — puede cambiarlo después en cualquier momento en el botón Configurar.",
  },
  perguntaModo: { pt: "Como acompanhar o caixa?", en: "How to track the register?", es: "¿Cómo seguir la caja?" },
  opcaoAoVivo: { pt: "Ao vivo", en: "Live", es: "En vivo" },
  opcaoSoFechamento: { pt: "Só fechamento", en: "Closing only", es: "Solo cierre" },
  opcaoAmbos: { pt: "Os dois", en: "Both", es: "Ambos" },
  perguntaConferirGaveta: { pt: "Conferir a gaveta no fechamento?", en: "Count the drawer at closing?", es: "¿Contar la gaveta al cierre?" },
  perguntaVerLucro: { pt: "Ver lucro real e margem?", en: "See real profit and margin?", es: "¿Ver ganancia real y margen?" },
  opcaoSim: { pt: "Sim", en: "Yes", es: "Sí" },
  opcaoNao: { pt: "Não", en: "No", es: "No" },
  assistenteSalvar: { pt: "Salvar e continuar", en: "Save and continue", es: "Guardar y continuar" },
  assistenteSalvando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  assistenteCancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  configurar: { pt: "Configurar", en: "Configure", es: "Configurar" },
  configSalva: { pt: "Configuração salva.", en: "Configuration saved.", es: "Configuración guardada." },

  totalVendidoHoje: { pt: "Total vendido hoje", en: "Total sold today", es: "Total vendido hoy" },
  numeroVendas: { pt: "Nº de vendas", en: "No. of sales", es: "N.° de ventas" },
  ticketMedio: { pt: "Ticket médio", en: "Average ticket", es: "Ticket promedio" },
  lucroRealHoje: { pt: "Lucro real hoje", en: "Real profit today", es: "Ganancia real hoy" },
  itensSemCustoAviso: {
    pt: "{n} item(ns) vendido(s) sem custo cadastrado — o lucro pode estar subestimado.",
    en: "{n} item(s) sold without a registered cost — profit may be understated.",
    es: "{n} ítem(s) vendido(s) sin costo registrado — la ganancia puede estar subestimada.",
  },

  atualizar: { pt: "Atualizar", en: "Refresh", es: "Actualizar" },
  atualizadoAs: { pt: "Atualizado às {hora}", en: "Updated at {hora}", es: "Actualizado a las {hora}" },

  abaAoVivo: { pt: "Ao vivo", en: "Live", es: "En vivo" },
  abaFechamento: { pt: "Fechamento", en: "Closing", es: "Cierre" },

  vendasPorCategoriaTitulo: { pt: "Vendas por categoria / sub-nicho / produto", en: "Sales by category / sub-niche / product", es: "Ventas por categoría / sub-nicho / producto" },
  colQtd: { pt: "Qtd", en: "Qty", es: "Cant." },
  colLucro: { pt: "Lucro", en: "Profit", es: "Ganancia" },
  colHorario: { pt: "Horário", en: "Time", es: "Horario" },
  colValorUnit: { pt: "Valor unitário", en: "Unit price", es: "Valor unitario" },
  colTotal: { pt: "Total", en: "Total", es: "Total" },
  semVendasHoje: { pt: "Nenhuma venda registrada hoje ainda.", en: "No sales recorded today yet.", es: "Ninguna venta registrada hoy todavía." },
  semResultadoBusca: { pt: "Nenhum resultado para essa busca.", en: "No results for this search.", es: "Ningún resultado para esta búsqueda." },
  navCategoriasRaiz: { pt: "Categorias", en: "Categories", es: "Categorías" },
  buscarProdutoPlaceholder: { pt: "Buscar produto ou categoria…", en: "Search product or category…", es: "Buscar producto o categoría…" },
  verDetalhes: { pt: "Ver detalhes", en: "View details", es: "Ver detalles" },
  totalConsolidado: { pt: "Total do dia", en: "Day total", es: "Total del día" },
  estoqueImpacto: {
    pt: "Vendeu {vendido} un — estoque baixou de {antes} pra {depois}.",
    en: "Sold {vendido} un — stock dropped from {antes} to {depois}.",
    es: "Vendió {vendido} un — el stock bajó de {antes} a {depois}.",
  },

  alertaPrejuizoTitulo: { pt: "Itens vendidos com prejuízo hoje", en: "Items sold at a loss today", es: "Ítems vendidos con pérdida hoy" },
  prejuizoDetalhe: { pt: "Prejuízo de {valor} por unidade × {qtd} = {total}", en: "Loss of {valor} per unit × {qtd} = {total}", es: "Pérdida de {valor} por unidad × {qtd} = {total}" },

  turnoLabel: { pt: "Caixa", en: "Register", es: "Caja" },
  selecioneTurno: { pt: "Selecione o caixa pra fechar…", en: "Select the register to close…", es: "Seleccione la caja para cerrar…" },
  nenhumTurnoAberto: { pt: "Nenhum caixa aberto no momento.", en: "No register currently open.", es: "Ninguna caja abierta en este momento." },
  abertoDesde: { pt: "Aberto desde {hora}", en: "Open since {hora}", es: "Abierta desde {hora}" },
  fundoAbertura: { pt: "Fundo de abertura: {valor}", en: "Opening float: {valor}", es: "Fondo de apertura: {valor}" },
  sangria: { pt: "Sangria", en: "Cash out", es: "Retiro" },
  suprimento: { pt: "Suprimento", en: "Cash in", es: "Refuerzo" },
  valorContadoLabel: { pt: "Valor contado na gaveta", en: "Amount counted in the drawer", es: "Valor contado en la gaveta" },
  abrirCalculadora: { pt: "Calculadora", en: "Calculator", es: "Calculadora" },
  abrirContagemGaveta: { pt: "Contagem de gaveta", en: "Drawer count", es: "Conteo de gaveta" },
  calculadoraTitulo: { pt: "Calculadora", en: "Calculator", es: "Calculadora" },
  calculadoraHistorico: { pt: "Histórico", en: "History", es: "Historial" },
  usarValorContado: { pt: "Usar este total no Valor Contado", en: "Use this total as Amount Counted", es: "Usar este total como Valor Contado" },
  contagemGavetaTitulo: { pt: "Contagem de gaveta", en: "Drawer count", es: "Conteo de gaveta" },
  totalGeral: { pt: "Total geral", en: "Grand total", es: "Total general" },
  notasLabel: { pt: "Notas", en: "Bills", es: "Billetes" },
  moedasLabel: { pt: "Moedas", en: "Coins", es: "Monedas" },
  qtdLabel: { pt: "qtd", en: "qty", es: "cant." },
  limparTudo: { pt: "Limpar tudo", en: "Clear all", es: "Limpiar todo" },
  fecharCaixa: { pt: "Fechar Caixa", en: "Close Register", es: "Cerrar Caja" },
  confirmarEFecharSemConferencia: { pt: "Confirmar e fechar turno", en: "Confirm and close shift", es: "Confirmar y cerrar turno" },
  fechando: { pt: "Fechando…", en: "Closing…", es: "Cerrando…" },
  confirmarFechamentoTitulo: { pt: "Fechar o caixa?", en: "Close the register?", es: "¿Cerrar la caja?" },
  confirmarFechamentoTexto: {
    pt: "Essa ação não pode ser desfeita. O turno será marcado como fechado.",
    en: "This action cannot be undone. The shift will be marked as closed.",
    es: "Esta acción no se puede deshacer. El turno se marcará como cerrado.",
  },
  confirmar: { pt: "Confirmar", en: "Confirm", es: "Confirmar" },
  cancelar: { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  esperado: { pt: "Esperado", en: "Expected", es: "Esperado" },
  contado: { pt: "Contado", en: "Counted", es: "Contado" },
  diferenca: { pt: "Diferença", en: "Difference", es: "Diferencia" },
  sobra: { pt: "Sobra de {valor}", en: "Surplus of {valor}", es: "Sobrante de {valor}" },
  falta: { pt: "Falta {valor}", en: "Missing {valor}", es: "Falta {valor}" },
  bateuCerto: { pt: "Bateu certinho.", en: "Matched exactly.", es: "Coincidió exacto." },
  turnoFechadoSucesso: { pt: "Caixa fechado com sucesso.", en: "Register closed successfully.", es: "Caja cerrada con éxito." },
  resultadoFechamentoTitulo: { pt: "Resultado do fechamento", en: "Closing result", es: "Resultado del cierre" },
  verComposicao: { pt: "Como esse valor foi calculado?", en: "How was this calculated?", es: "¿Cómo se calculó este valor?" },
  composicaoTitulo: { pt: "Composição do esperado", en: "Expected amount breakdown", es: "Composición del esperado" },
  compAbertura: { pt: "Fundo de abertura", en: "Opening float", es: "Fondo de apertura" },
  compVendas: { pt: "Vendas em dinheiro deste turno", en: "Cash sales this shift", es: "Ventas en efectivo de este turno" },
  maisItens: { pt: "(+ {n} item(ns))", en: "(+ {n} item(s))", es: "(+ {n} ítem(s))" },
  nenhumRegistro: { pt: "Nenhum registro.", en: "No records.", es: "Ningún registro." },
  totalEsperadoLinha: { pt: "= Esperado", en: "= Expected", es: "= Esperado" },

  modalSangriaTitulo: { pt: "Registrar sangria", en: "Register cash out", es: "Registrar retiro" },
  modalSuprimentoTitulo: { pt: "Registrar suprimento", en: "Register cash in", es: "Registrar refuerzo" },
  valorLabel: { pt: "Valor", en: "Amount", es: "Valor" },
  motivoLabel: { pt: "Motivo (opcional)", en: "Reason (optional)", es: "Motivo (opcional)" },
  registrar: { pt: "Registrar", en: "Register", es: "Registrar" },
  registrando: { pt: "Registrando…", en: "Registering…", es: "Registrando…" },
  sangriaRegistrada: { pt: "Sangria registrada.", en: "Cash out recorded.", es: "Retiro registrado." },
  suprimentoRegistrado: { pt: "Suprimento registrado.", en: "Cash in recorded.", es: "Refuerzo registrado." },
  lancamentosTitulo: { pt: "Lançamentos deste turno", en: "This shift's entries", es: "Movimientos de este turno" },
  nenhumaMovimentacao: { pt: "Nenhuma sangria ou suprimento registrado neste turno.", en: "No cash out or cash in recorded this shift.", es: "Ningún retiro o refuerzo registrado en este turno." },
  voce: { pt: "você", en: "you", es: "usted" },
  editarMovimentacaoBotao: { pt: "Editar", en: "Edit", es: "Editar" },
  excluirMovimentacaoBotao: { pt: "Excluir", en: "Delete", es: "Eliminar" },
  editarMovimentacaoTitulo: { pt: "Editar {tipo}", en: "Edit {tipo}", es: "Editar {tipo}" },
  tipoNaoMuda: { pt: "O tipo (sangria/suprimento) não pode ser alterado — só valor e motivo.", en: "The type (cash out/cash in) can't be changed — only amount and reason.", es: "El tipo (retiro/refuerzo) no se puede cambiar — solo valor y motivo." },
  editarMovimentacaoSalvar: { pt: "Salvar", en: "Save", es: "Guardar" },
  editarMovimentacaoSalvando: { pt: "Salvando…", en: "Saving…", es: "Guardando…" },
  movimentacaoEditada: { pt: "Lançamento atualizado.", en: "Entry updated.", es: "Movimiento actualizado." },
  confirmarExclusaoTitulo: { pt: "Excluir lançamento?", en: "Delete entry?", es: "¿Eliminar movimiento?" },
  confirmarExclusaoTexto: {
    pt: "Tem certeza que deseja excluir esta {tipo} de {valor}? Essa ação não pode ser desfeita.",
    en: "Are you sure you want to delete this {tipo} of {valor}? This action cannot be undone.",
    es: "¿Seguro que desea eliminar este {tipo} de {valor}? Esta acción no se puede deshacer.",
  },
  excluir: { pt: "Excluir", en: "Delete", es: "Eliminar" },
  excluindo: { pt: "Excluindo…", en: "Deleting…", es: "Eliminando…" },
  movimentacaoExcluida: { pt: "Lançamento excluído.", en: "Entry deleted.", es: "Movimiento eliminado." },
  erroMovimentacaoNaoEncontrada: { pt: "Lançamento não encontrado.", en: "Entry not found.", es: "Movimiento no encontrado." },

  erroSemPermissao: { pt: "Você não tem permissão para acessar a retaguarda.", en: "You don't have permission to access the back office.", es: "No tiene permiso para acceder a la retaguardia." },
  erroTurnoNaoEncontrado: { pt: "Caixa não encontrado.", en: "Register not found.", es: "Caja no encontrada." },
  erroTurnoJaFechado: { pt: "Esse caixa já está fechado.", en: "This register is already closed.", es: "Esa caja ya está cerrada." },
  erroValorInvalido: { pt: "Informe um valor válido, maior que zero.", en: "Enter a valid amount, greater than zero.", es: "Indique un valor válido, mayor que cero." },
  erroConferenciaDesligada: { pt: "A conferência de gaveta está desligada nas configurações.", en: "Drawer counting is turned off in settings.", es: "El conteo de gaveta está desactivado en la configuración." },
  erroValorContadoObrigatorio: { pt: "Informe o valor contado na gaveta.", en: "Enter the amount counted in the drawer.", es: "Indique el valor contado en la gaveta." },
  erroGenerico: { pt: "Não foi possível completar a ação. Tente novamente.", en: "Could not complete the action. Try again.", es: "No fue posible completar la acción. Intente de nuevo." },
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

function totalEsperadoDeLinhas(linhas: ComposicaoLinha[]): number {
  const soma = (c: string) => linhas.filter((l) => l.componente === c).reduce((s, l) => s + l.valor, 0);
  return soma("abertura") + soma("venda") + soma("suprimento") - soma("sangria");
}

function mensagemErro(codigo: string | undefined, lang: Idioma): string {
  switch (codigo) {
    case "AX020": return t("erroSemPermissao", lang);
    case "AX021": return t("erroTurnoNaoEncontrado", lang);
    case "AX022": return t("erroTurnoJaFechado", lang);
    case "AX024": return t("erroValorInvalido", lang);
    case "AX025": return t("erroConferenciaDesligada", lang);
    case "AX027": return t("erroValorContadoObrigatorio", lang);
    case "AX028": return t("erroMovimentacaoNaoEncontrada", lang);
    default: return t("erroGenerico", lang);
  }
}

export default function RetaguardaPage() {
  const { idioma } = useLanguage();
  const lang: Idioma = (["pt", "en", "es"].includes(idioma) ? idioma : "pt") as Idioma;
  const router = useRouter();

  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [carregandoAcesso, setCarregandoAcesso] = useState(true);
  const acessoLiberado = papel === "dono" || papel === "admin";

  const [config, setConfig] = useState<ConfigRetaguarda | null>(null);
  const [carregandoConfig, setCarregandoConfig] = useState(true);
  const [configuradoLocal, setConfiguradoLocal] = useState(false);
  const [assistenteAberto, setAssistenteAberto] = useState(false);
  const [salvandoConfig, setSalvandoConfig] = useState(false);

  const [aba, setAba] = useState<"ao_vivo" | "fechamento">("ao_vivo");
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [produtosVendidos, setProdutosVendidos] = useState<VendaPorProduto[]>([]);
  const [prejuizos, setPrejuizos] = useState<ItemPrejuizo[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const [turnosAbertos, setTurnosAbertos] = useState<TurnoAberto[]>([]);
  const [turnoSelecionado, setTurnoSelecionado] = useState<string | null>(null);
  const [valorContadoInput, setValorContadoInput] = useState("");
  const [modalMovimentacao, setModalMovimentacao] = useState<"sangria" | "suprimento" | null>(null);
  const [registrandoMovimentacao, setRegistrandoMovimentacao] = useState(false);
  const [confirmarFechamentoAberto, setConfirmarFechamentoAberto] = useState(false);
  const [fechando, setFechando] = useState(false);
  const [resultadoFechamento, setResultadoFechamento] = useState<ResultadoFechamento | null>(null);

  // Composição do "Esperado" (abertura + vendas em dinheiro + suprimentos −
  // sangrias) linha a linha — carregada assim que um turno é selecionado na
  // aba de fechamento, e reaproveitada depois de fechar o turno (não é
  // limpa no fechamento) pra o botão "Ver detalhes" continuar funcionando
  // no card de resultado.
  const [composicao, setComposicao] = useState<{ turnoId: string; linhas: ComposicaoLinha[] } | null>(null);
  const [carregandoComposicao, setCarregandoComposicao] = useState(false);
  const [modalComposicaoAberto, setModalComposicaoAberto] = useState(false);

  // Lançamentos (sangria/suprimento) do turno selecionado — editar/excluir
  // só valem com o turno aberto (o banco também barra com AX022, mas a UI já
  // esconde os botões nesse caso).
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoCaixa[]>([]);
  const [carregandoMovimentacoes, setCarregandoMovimentacoes] = useState(false);
  const [movimentacaoEditando, setMovimentacaoEditando] = useState<MovimentacaoCaixa | null>(null);
  const [salvandoEdicaoMovimentacao, setSalvandoEdicaoMovimentacao] = useState(false);
  const [movimentacaoExcluindo, setMovimentacaoExcluindo] = useState<MovimentacaoCaixa | null>(null);
  const [excluindoMovimentacao, setExcluindoMovimentacao] = useState(false);

  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  // Acesso: só dono/admin. Primeira camada — a de verdade é no banco
  // (AX020 nas funções retaguarda_*).
  useEffect(() => {
    (async () => {
      const id = await obterEmpresaAtiva();
      setEmpresaId(id);
      obterUsuarioAtualId().then(setUserId);
      if (!id) { setCarregandoAcesso(false); return; }
      const p = await obterMeuPapel(id);
      setPapel(p);
      setCarregandoAcesso(false);
      if (p !== "dono" && p !== "admin") router.push("/pdv/venda");
    })();
  }, [router]);

  // Config — carrega do banco, e confere a "flag local" de primeira visita
  // (não existe coluna de banco pra isso: os defaults de retaguarda_modo/
  // conferir_gaveta/ver_lucro já são valores válidos por si só, então uso
  // localStorage só pra decidir se mostra o assistente na abertura — os
  // valores de verdade sempre vêm do banco, isto aqui só controla a
  // PERGUNTA aparecer ou não).
  useEffect(() => {
    if (!empresaId || !acessoLiberado) return;
    setCarregandoConfig(true);
    obterConfigRetaguarda(empresaId).then((c) => {
      setConfig(c);
      setAba(c.modo === "fechamento" ? "fechamento" : "ao_vivo");
      setCarregandoConfig(false);
      const salvo = typeof window !== "undefined" ? window.localStorage.getItem(CHAVE_CONFIGURADO_LOCAL + empresaId) : null;
      setConfiguradoLocal(!!salvo);
    });
  }, [empresaId, acessoLiberado]);

  async function handleSalvarConfig(novaConfig: ConfigRetaguarda) {
    if (!empresaId) return;
    setSalvandoConfig(true);
    const resultado = await salvarConfigRetaguarda(empresaId, novaConfig);
    setSalvandoConfig(false);
    if (resultado.erro) { mostrarToast(mensagemErro(resultado.codigo, lang), "erro"); return; }
    setConfig(novaConfig);
    setAba(novaConfig.modo === "fechamento" ? "fechamento" : "ao_vivo");
    if (typeof window !== "undefined") window.localStorage.setItem(CHAVE_CONFIGURADO_LOCAL + empresaId, "1");
    setConfiguradoLocal(true);
    setAssistenteAberto(false);
    mostrarToast(t("configSalva", lang), "ok");
  }

  // Números do dia — painel ao vivo E fechamento usam o mesmo resumo diário.
  // Atualiza sozinho a cada 30s enquanto a tela estiver aberta e configurada.
  async function carregarDadosDoDia() {
    if (!empresaId) return;
    setCarregandoDados(true);
    const dataHoje = hojeLocal();
    const [r, pv, p] = await Promise.all([
      obterResumoDia(empresaId, dataHoje),
      obterVendasPorProduto(empresaId, dataHoje),
      obterItensPrejuizo(empresaId, dataHoje),
    ]);
    if (r.erro) mostrarToast(mensagemErro(r.codigo, lang), "erro"); else setResumo(r.resumo!);
    if (pv.erro) mostrarToast(mensagemErro(pv.codigo, lang), "erro"); else setProdutosVendidos(pv.dados);
    if (p.erro) mostrarToast(mensagemErro(p.codigo, lang), "erro"); else setPrejuizos(p.dados);
    setCarregandoDados(false);
    setUltimaAtualizacao(new Date());
  }

  useEffect(() => {
    if (!empresaId || !acessoLiberado || !config || !configuradoLocal) return;
    carregarDadosDoDia();
    const intervalo = setInterval(carregarDadosDoDia, INTERVALO_ATUALIZACAO_MS);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, acessoLiberado, config, configuradoLocal]);

  // Caixas abertos — só relevante pra aba de fechamento.
  async function carregarTurnosAbertos() {
    if (!empresaId) return;
    const turnos = await listarTurnosAbertos(empresaId);
    setTurnosAbertos(turnos);
    setTurnoSelecionado((atual) => (atual && turnos.some((t) => t.id === atual)) ? atual : (turnos.length === 1 ? turnos[0].id : null));
  }

  useEffect(() => {
    if (!empresaId || !acessoLiberado || !config || !configuradoLocal) return;
    if (config.modo === "ao_vivo") return;
    carregarTurnosAbertos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, acessoLiberado, config, configuradoLocal]);

  async function carregarComposicao(turnoId: string) {
    setCarregandoComposicao(true);
    const r = await obterComposicaoEsperado(turnoId);
    setCarregandoComposicao(false);
    if (r.erro) { mostrarToast(mensagemErro(r.codigo, lang), "erro"); return; }
    setComposicao({ turnoId, linhas: r.dados });
  }

  async function carregarMovimentacoes(turnoId: string) {
    setCarregandoMovimentacoes(true);
    const dados = await listarMovimentacoesTurno(turnoId);
    setMovimentacoes(dados);
    setCarregandoMovimentacoes(false);
  }

  useEffect(() => {
    if (!turnoSelecionado) return;
    carregarComposicao(turnoSelecionado);
    carregarMovimentacoes(turnoSelecionado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoSelecionado]);

  // Depois de registrar/editar/excluir uma sangria/suprimento: a lista E o
  // "Esperado" (que soma/subtrai essas movimentações) precisam refletir a
  // mudança — os dois vêm de fontes diferentes (tabela direta vs. RPC de
  // composição), então recarrega os dois.
  function recarregarMovimentacoesEComposicao() {
    if (turnoSelecionado) { carregarMovimentacoes(turnoSelecionado); carregarComposicao(turnoSelecionado); }
  }

  async function handleRegistrarMovimentacao(valor: number, motivo: string) {
    if (!turnoSelecionado || !modalMovimentacao) return;
    setRegistrandoMovimentacao(true);
    const resultado = await registrarMovimentacao(turnoSelecionado, modalMovimentacao, valor, motivo || undefined);
    setRegistrandoMovimentacao(false);
    if (resultado.erro) { mostrarToast(mensagemErro(resultado.codigo, lang), "erro"); return; }
    mostrarToast(t(modalMovimentacao === "sangria" ? "sangriaRegistrada" : "suprimentoRegistrado", lang), "ok");
    setModalMovimentacao(null);
    recarregarMovimentacoesEComposicao();
  }

  async function handleSalvarEdicaoMovimentacao(valor: number, motivo: string) {
    if (!movimentacaoEditando) return;
    setSalvandoEdicaoMovimentacao(true);
    const resultado = await editarMovimentacao(movimentacaoEditando.id, valor, motivo || undefined);
    setSalvandoEdicaoMovimentacao(false);
    if (resultado.erro) { mostrarToast(mensagemErro(resultado.codigo, lang), "erro"); return; }
    mostrarToast(t("movimentacaoEditada", lang), "ok");
    setMovimentacaoEditando(null);
    recarregarMovimentacoesEComposicao();
  }

  async function handleConfirmarExclusaoMovimentacao() {
    if (!movimentacaoExcluindo) return;
    setExcluindoMovimentacao(true);
    const resultado = await excluirMovimentacao(movimentacaoExcluindo.id);
    setExcluindoMovimentacao(false);
    if (resultado.erro) { mostrarToast(mensagemErro(resultado.codigo, lang), "erro"); return; }
    mostrarToast(t("movimentacaoExcluida", lang), "ok");
    setMovimentacaoExcluindo(null);
    recarregarMovimentacoesEComposicao();
  }

  async function handleFecharTurno() {
    if (!turnoSelecionado || !config) return;
    const valorContado = valorContadoInput.trim() ? Number(valorContadoInput.replace(",", ".")) : null;
    if (config.conferirGaveta && valorContado === null) {
      mostrarToast(t("erroValorContadoObrigatorio", lang), "erro");
      return;
    }
    setFechando(true);
    const resultado = await fecharTurno(turnoSelecionado, valorContado);
    setFechando(false);
    if (resultado.erro) { mostrarToast(mensagemErro(resultado.codigo, lang), "erro"); return; }
    setResultadoFechamento(resultado.resultado!);
    setConfirmarFechamentoAberto(false);
    setTurnoSelecionado(null);
    setValorContadoInput("");
    mostrarToast(t("turnoFechadoSucesso", lang), "ok");
    carregarTurnosAbertos();
  }

  if (carregandoAcesso) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv/venda">
        <EstadoCarregando lang={lang} />
      </PdvLayout>
    );
  }

  if (!acessoLiberado) {
    return (
      <PdvLayout titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv/venda">
        <EstadoCarregando lang={lang} texto={t("redirecionando", lang)} />
      </PdvLayout>
    );
  }

  const mostrarAoVivo = config && (config.modo === "ao_vivo" || config.modo === "ambos");
  const mostrarFechamento = config && (config.modo === "fechamento" || config.modo === "ambos");
  const mostrarAbas = config?.modo === "ambos";

  return (
    <PdvLayout
      titulo={t("titulo", lang)} subtitulo={t("subtitulo", lang)} voltarPara="/pdv/venda"
      botaoExtra={
        configuradoLocal ? (
          <BotaoSecundario onClick={() => setAssistenteAberto(true)}>
            <Settings size={14} />
            {t("configurar", lang)}
          </BotaoSecundario>
        ) : undefined
      }
    >
      {carregandoConfig || !config ? (
        <EstadoCarregando lang={lang} />
      ) : (
        <>
          {!configuradoLocal ? (
            <Assistente lang={lang} configAtual={config} salvando={salvandoConfig} podeCancelar={false} onSalvar={handleSalvarConfig} onCancelar={() => {}} />
          ) : (
            <div className="flex flex-col gap-4">
              <CardsResumo lang={lang} resumo={resumo} verLucro={config.verLucro} carregando={carregandoDados} ultimaAtualizacao={ultimaAtualizacao} onAtualizar={carregarDadosDoDia} />

              {mostrarAbas && (
                <div className="flex gap-2">
                  <BotaoAba selecionado={aba === "ao_vivo"} onClick={() => setAba("ao_vivo")}>{t("abaAoVivo", lang)}</BotaoAba>
                  <BotaoAba selecionado={aba === "fechamento"} onClick={() => setAba("fechamento")}>{t("abaFechamento", lang)}</BotaoAba>
                </div>
              )}

              {(mostrarAoVivo && (!mostrarAbas || aba === "ao_vivo")) && (
                <PainelAoVivo lang={lang} empresaId={empresaId!} data={hojeLocal()} produtos={produtosVendidos} prejuizos={prejuizos} verLucro={config.verLucro} carregando={carregandoDados} />
              )}

              {(mostrarFechamento && (!mostrarAbas || aba === "fechamento")) && (
                <PainelFechamento
                  lang={lang} config={config} turnos={turnosAbertos} turnoSelecionado={turnoSelecionado}
                  onSelecionarTurno={setTurnoSelecionado}
                  valorContadoInput={valorContadoInput} onValorContadoInput={setValorContadoInput}
                  onAbrirMovimentacao={setModalMovimentacao}
                  onFecharCaixa={() => setConfirmarFechamentoAberto(true)}
                  resultadoFechamento={resultadoFechamento}
                  composicaoTotal={composicao && turnoSelecionado && composicao.turnoId === turnoSelecionado ? totalEsperadoDeLinhas(composicao.linhas) : null}
                  composicaoCarregando={carregandoComposicao}
                  composicaoDisponivel={!!(composicao && resultadoFechamento && composicao.turnoId === resultadoFechamento.turnoId)}
                  onVerComposicao={() => setModalComposicaoAberto(true)}
                  movimentacoes={movimentacoes} carregandoMovimentacoes={carregandoMovimentacoes} userId={userId}
                  onEditarMovimentacao={setMovimentacaoEditando} onExcluirMovimentacao={setMovimentacaoExcluindo}
                />
              )}
            </div>
          )}
        </>
      )}

      {assistenteAberto && config && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
          <Assistente lang={lang} configAtual={config} salvando={salvandoConfig} podeCancelar comoModal onSalvar={handleSalvarConfig} onCancelar={() => setAssistenteAberto(false)} />
        </div>
      )}

      {modalMovimentacao && (
        <ModalMovimentacao
          lang={lang} tipo={modalMovimentacao} registrando={registrandoMovimentacao}
          onConfirmar={handleRegistrarMovimentacao} onCancelar={() => setModalMovimentacao(null)}
        />
      )}

      {confirmarFechamentoAberto && (
        <ModalConfirmarFechamento lang={lang} fechando={fechando} onConfirmar={handleFecharTurno} onCancelar={() => setConfirmarFechamentoAberto(false)} />
      )}

      {modalComposicaoAberto && composicao && (
        <ModalComposicaoEsperado lang={lang} linhas={composicao.linhas} onFechar={() => setModalComposicaoAberto(false)} />
      )}

      {movimentacaoEditando && (
        <ModalEditarMovimentacao
          lang={lang} movimentacao={movimentacaoEditando} salvando={salvandoEdicaoMovimentacao}
          onConfirmar={handleSalvarEdicaoMovimentacao} onCancelar={() => setMovimentacaoEditando(null)}
        />
      )}

      {movimentacaoExcluindo && (
        <ModalConfirmarExclusaoMovimentacao
          lang={lang} movimentacao={movimentacaoExcluindo} excluindo={excluindoMovimentacao}
          onConfirmar={handleConfirmarExclusaoMovimentacao} onCancelar={() => setMovimentacaoExcluindo(null)}
        />
      )}

      {toast && <Toast toast={toast} />}
    </PdvLayout>
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

function Toast({ toast }: { toast: { msg: string; tipo: "ok" | "erro" } }) {
  return (
    <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
      style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : "rgba(52,211,153,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
      {toast.msg}
    </div>
  );
}

function BotaoSecundario({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  const { tokens } = useTemaPdv();
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold"
      style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
      {children}
    </button>
  );
}

function BotaoAba({ selecionado, onClick, children }: { selecionado: boolean; onClick: () => void; children: React.ReactNode }) {
  const { tokens } = useTemaPdv();
  return (
    <button onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-bold"
      style={selecionado
        ? { background: tokens.acaoBg, color: tokens.acaoTexto }
        : { background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
      {children}
    </button>
  );
}

// ============================================================================
// ASSISTENTE — 3 perguntas em botões
// ============================================================================

function GrupoBotoes<T extends string | boolean>({ opcoes, valor, onSelecionar }: {
  opcoes: { valor: T; label: string }[]; valor: T; onSelecionar: (v: T) => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="flex gap-2 flex-wrap">
      {opcoes.map((o) => (
        <button key={String(o.valor)} onClick={() => onSelecionar(o.valor)}
          className="px-4 py-2.5 rounded-xl text-sm font-bold"
          style={o.valor === valor
            ? { background: tokens.acaoBg, color: tokens.acaoTexto }
            : { background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Assistente({ lang, configAtual, salvando, podeCancelar, comoModal, onSalvar, onCancelar }: {
  lang: Idioma; configAtual: ConfigRetaguarda; salvando: boolean; podeCancelar: boolean; comoModal?: boolean;
  onSalvar: (c: ConfigRetaguarda) => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [modo, setModo] = useState<ModoRetaguarda>(configAtual.modo);
  const [conferirGaveta, setConferirGaveta] = useState(configAtual.conferirGaveta);
  const [verLucro, setVerLucro] = useState(configAtual.verLucro);

  const conteudo = (
    <div className={comoModal ? "w-full max-w-lg rounded-2xl p-6" : "max-w-lg mx-auto rounded-2xl p-6"} style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
      <h3 className="text-lg font-bold mb-1" style={{ color: tokens.texto }}>{t("assistenteTitulo", lang)}</h3>
      <p className="text-xs mb-5" style={{ color: tokens.textoMuted }}>{t("assistenteSubtitulo", lang)}</p>

      <p className="text-sm font-semibold mb-2" style={{ color: tokens.texto }}>{t("perguntaModo", lang)}</p>
      <div className="mb-5">
        <GrupoBotoes
          opcoes={[
            { valor: "ao_vivo", label: t("opcaoAoVivo", lang) },
            { valor: "fechamento", label: t("opcaoSoFechamento", lang) },
            { valor: "ambos", label: t("opcaoAmbos", lang) },
          ]}
          valor={modo} onSelecionar={setModo}
        />
      </div>

      <p className="text-sm font-semibold mb-2" style={{ color: tokens.texto }}>{t("perguntaConferirGaveta", lang)}</p>
      <div className="mb-5">
        <GrupoBotoes
          opcoes={[{ valor: true, label: t("opcaoSim", lang) }, { valor: false, label: t("opcaoNao", lang) }]}
          valor={conferirGaveta} onSelecionar={setConferirGaveta}
        />
      </div>

      <p className="text-sm font-semibold mb-2" style={{ color: tokens.texto }}>{t("perguntaVerLucro", lang)}</p>
      <div className="mb-6">
        <GrupoBotoes
          opcoes={[{ valor: true, label: t("opcaoSim", lang) }, { valor: false, label: t("opcaoNao", lang) }]}
          valor={verLucro} onSelecionar={setVerLucro}
        />
      </div>

      <div className="flex items-center gap-2">
        {podeCancelar && (
          <button onClick={onCancelar} disabled={salvando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("assistenteCancelar", lang)}
          </button>
        )}
        <button onClick={() => onSalvar({ modo, conferirGaveta, verLucro })} disabled={salvando}
          className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
          {salvando && <Loader2 className="animate-spin" size={14} />}
          {salvando ? t("assistenteSalvando", lang) : t("assistenteSalvar", lang)}
        </button>
      </div>
    </div>
  );

  return conteudo;
}

// ============================================================================
// RESUMO DO DIA
// ============================================================================

function CardEstat({ label, valor, cor }: { label: string; valor: string; cor?: string }) {
  const { tokens } = useTemaPdv();
  return (
    <div className="rounded-xl p-3 md:p-4" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <p className="text-[11px] font-bold uppercase tracking-wide mb-1 truncate" style={{ color: tokens.cardTexto, opacity: 0.72 }}>{label}</p>
      <p className="text-xl md:text-2xl font-black truncate" style={{ color: cor || tokens.cardTexto }}>{valor}</p>
    </div>
  );
}

function CardsResumo({ lang, resumo, verLucro, carregando, ultimaAtualizacao, onAtualizar }: {
  lang: Idioma; resumo: ResumoDia | null; verLucro: boolean; carregando: boolean;
  ultimaAtualizacao: Date | null; onAtualizar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="text-xs" style={{ color: tokens.textoMuted }}>
          {ultimaAtualizacao && t("atualizadoAs", lang, { hora: ultimaAtualizacao.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) })}
        </div>
        <button onClick={onAtualizar} disabled={carregando} className="flex items-center gap-1.5 text-xs font-semibold disabled:opacity-50" style={{ color: tokens.acento }}>
          <RefreshCw size={13} className={carregando ? "animate-spin" : ""} />
          {t("atualizar", lang)}
        </button>
      </div>

      <div className={`grid grid-cols-2 ${verLucro ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
        <CardEstat label={t("totalVendidoHoje", lang)} valor={moeda(resumo?.totalVendido ?? 0)} />
        <CardEstat label={t("numeroVendas", lang)} valor={String(resumo?.qtdVendas ?? 0)} />
        <CardEstat label={t("ticketMedio", lang)} valor={moeda(resumo?.ticketMedio ?? 0)} />
        {verLucro && <CardEstat label={t("lucroRealHoje", lang)} valor={moeda(resumo?.lucroReal ?? 0)} cor={tokens.acento} />}
      </div>

      {!!resumo?.itensSemCusto && resumo.itensSemCusto > 0 && (
        <div className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)" }}>
          <AlertTriangle size={14} style={{ color: "#fbbf24" }} className="shrink-0 mt-0.5" />
          <p className="text-xs" style={{ color: "#fbbf24" }}>{t("itensSemCustoAviso", lang, { n: resumo.itensSemCusto })}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAINEL AO VIVO — categorias + alerta de prejuízo
// ============================================================================

function PainelAoVivo({ lang, empresaId, data, produtos, prejuizos, verLucro, carregando }: {
  lang: Idioma; empresaId: string; data: string; produtos: VendaPorProduto[]; prejuizos: ItemPrejuizo[]; verLucro: boolean; carregando: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <NavegacaoVendasPorProduto lang={lang} empresaId={empresaId} data={data} produtos={produtos} verLucro={verLucro} carregando={carregando} />

      {prejuizos.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.4)" }}>
          <div className="px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} style={{ color: "#f87171" }} />
            <h3 className="text-sm font-bold" style={{ color: "#f87171" }}>{t("alertaPrejuizoTitulo", lang)}</h3>
          </div>
          <div className="px-4 pb-3 flex flex-col gap-2">
            {prejuizos.map((p, idx) => (
              <div key={idx} className="text-xs" style={{ color: "#f87171" }}>
                <span className="font-semibold">{p.produtoNome}</span>
                {" — "}
                {t("prejuizoDetalhe", lang, { valor: moeda(p.prejuizoUnitario), qtd: p.quantidade, total: moeda(p.prejuizoUnitario * p.quantidade) })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NAVEGAÇÃO EM CARDS — Categoria → Sub-nicho → Produtos → modal de detalhe
// Sem "Nicho" de propósito: cada loja opera dentro de um "modo" de negócio
// só, então Categoria já é o primeiro nível pro dono (decisão registrada em
// PDV-RETAGUARDA-FASE2-DETALHE-PRODUTO-SQL.txt). Os 3 níveis vêm de UMA
// chamada só (retaguarda_vendas_por_produto) — a navegação agrupa em
// memória, sem repetir consulta ao banco a cada clique.
// ============================================================================

function agruparPorChave<T>(itens: T[], chave: (i: T) => string): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const k = chave(item);
    if (!mapa.has(k)) mapa.set(k, []);
    mapa.get(k)!.push(item);
  }
  return mapa;
}

function NavegacaoVendasPorProduto({ lang, empresaId, data, produtos, verLucro, carregando }: {
  lang: Idioma; empresaId: string; data: string; produtos: VendaPorProduto[]; verLucro: boolean; carregando: boolean;
}) {
  const { tokens } = useTemaPdv();
  const [nivel, setNivel] = useState<"categoria" | "subnicho" | "produtos">("categoria");
  const [categoriaSel, setCategoriaSel] = useState<string | null>(null);
  const [subNichoSel, setSubNichoSel] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [produtoModal, setProdutoModal] = useState<VendaPorProduto | null>(null);
  const [detalheVendas, setDetalheVendas] = useState<VendaDetalheProduto[]>([]);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const termo = busca.trim().toLowerCase();
  const filtrados = termo
    ? produtos.filter((p) =>
        p.produtoNome.toLowerCase().includes(termo) ||
        p.categoria.toLowerCase().includes(termo) ||
        p.subNicho.toLowerCase().includes(termo))
    : produtos;
  const textoVazio = t(termo ? "semResultadoBusca" : "semVendasHoje", lang);

  function voltarPara(destino: "categoria" | "subnicho") {
    if (destino === "categoria") { setCategoriaSel(null); setSubNichoSel(null); setNivel("categoria"); }
    else { setSubNichoSel(null); setNivel("subnicho"); }
  }

  async function abrirDetalhe(produto: VendaPorProduto) {
    setProdutoModal(produto);
    setCarregandoDetalhe(true);
    const r = await obterVendasProdutoDetalhe(empresaId, produto.produtoId, data);
    setDetalheVendas(r.dados);
    setCarregandoDetalhe(false);
  }

  const itensBreadcrumb: ItemBreadcrumb[] = [];
  if (nivel !== "categoria") {
    itensBreadcrumb.push({ label: t("navCategoriasRaiz", lang), onClick: () => voltarPara("categoria") });
    if (categoriaSel) itensBreadcrumb.push({ label: categoriaSel, onClick: nivel === "produtos" ? () => voltarPara("subnicho") : undefined });
    if (nivel === "produtos" && subNichoSel) itensBreadcrumb.push({ label: subNichoSel });
  }

  let conteudo: React.ReactNode;

  if (nivel === "categoria") {
    const cards = Array.from(agruparPorChave(filtrados, (p) => p.categoria).entries())
      .map(([categoria, itens]) => ({
        categoria,
        quantidade: itens.reduce((s, i) => s + i.quantidade, 0),
        valorVendido: itens.reduce((s, i) => s + i.valorVendido, 0),
        lucroReal: verLucro ? itens.reduce((s, i) => s + (i.lucroReal || 0), 0) : null,
      }))
      .sort((a, b) => b.valorVendido - a.valorVendido);

    conteudo = cards.length === 0 ? <EstadoVazio texto={textoVazio} /> : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <CardGenerico key={c.categoria} label={c.categoria}
            sublabel={`${c.quantidade} ${t("colQtd", lang).toLowerCase()} · ${moeda(c.valorVendido)}${verLucro && c.lucroReal !== null ? ` · ${t("colLucro", lang)}: ${moeda(c.lucroReal)}` : ""}`}
            onClick={() => { setCategoriaSel(c.categoria); setNivel("subnicho"); }} />
        ))}
      </div>
    );
  } else if (nivel === "subnicho") {
    const doNivel = filtrados.filter((p) => p.categoria === categoriaSel);
    const cards = Array.from(agruparPorChave(doNivel, (p) => p.subNicho).entries())
      .map(([subNicho, itens]) => ({
        subNicho,
        quantidade: itens.reduce((s, i) => s + i.quantidade, 0),
        valorVendido: itens.reduce((s, i) => s + i.valorVendido, 0),
        lucroReal: verLucro ? itens.reduce((s, i) => s + (i.lucroReal || 0), 0) : null,
      }))
      .sort((a, b) => b.valorVendido - a.valorVendido);

    conteudo = cards.length === 0 ? <EstadoVazio texto={textoVazio} /> : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <CardGenerico key={c.subNicho} label={c.subNicho}
            sublabel={`${c.quantidade} ${t("colQtd", lang).toLowerCase()} · ${moeda(c.valorVendido)}${verLucro && c.lucroReal !== null ? ` · ${t("colLucro", lang)}: ${moeda(c.lucroReal)}` : ""}`}
            onClick={() => { setSubNichoSel(c.subNicho); setNivel("produtos"); }} />
        ))}
      </div>
    );
  } else {
    const doNivel = filtrados
      .filter((p) => p.categoria === categoriaSel && p.subNicho === subNichoSel)
      .sort((a, b) => b.valorVendido - a.valorVendido);

    conteudo = doNivel.length === 0 ? <EstadoVazio texto={textoVazio} /> : (
      <div className="flex flex-col gap-2">
        {doNivel.map((p) => {
          const saldoAntes = p.saldoAtual + p.quantidade;
          return (
            <div key={p.produtoId} className="flex items-center justify-between gap-3 p-3.5 rounded-xl flex-wrap"
              style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: tokens.cardTexto }}>{p.produtoNome}</p>
                <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.7 }}>
                  {t("estoqueImpacto", lang, { vendido: p.quantidade, antes: saldoAntes, depois: p.saldoAtual })}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{p.quantidade} {t("colQtd", lang).toLowerCase()}</p>
                  <p className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{moeda(p.valorVendido)}</p>
                </div>
                {verLucro && (
                  <div className="text-right">
                    <p className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("colLucro", lang)}</p>
                    <p className="text-sm font-bold" style={{ color: tokens.acento }}>{moeda(p.lucroReal)}</p>
                  </div>
                )}
                <button onClick={() => abrirDetalhe(p)} title={t("verDetalhes", lang)}
                  className="p-2 rounded-lg" style={{ background: tokens.inputBg, color: tokens.acento }}>
                  <Eye size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ background: tokens.acentoSuaveBg }}>
        <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("vendasPorCategoriaTitulo", lang)}</h3>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: tokens.textoMuted }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t("buscarProdutoPlaceholder", lang)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
            style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }} />
        </div>
      </div>

      <div className="p-4">
        <BreadcrumbGenerico itens={itensBreadcrumb} />
        {carregando && produtos.length === 0 ? <EstadoCarregando lang={lang} /> : conteudo}
      </div>

      {produtoModal && (
        <ModalDetalheProduto lang={lang} produto={produtoModal} vendas={detalheVendas} carregando={carregandoDetalhe}
          onFechar={() => { setProdutoModal(null); setDetalheVendas([]); }} />
      )}
    </div>
  );
}

function ModalDetalheProduto({ lang, produto, vendas, carregando, onFechar }: {
  lang: Idioma; produto: VendaPorProduto; vendas: VendaDetalheProduto[]; carregando: boolean; onFechar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const totalQtd = vendas.reduce((s, v) => s + v.quantidade, 0);
  const totalValor = vendas.reduce((s, v) => s + v.subtotal, 0);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-bold truncate" style={{ color: tokens.texto }}>{produto.produtoNome}</h3>
          <button onClick={onFechar} className="shrink-0" style={{ color: tokens.textoMuted }}><X size={18} /></button>
        </div>

        {carregando ? (
          <EstadoCarregando lang={lang} />
        ) : vendas.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("semVendasHoje", lang)}</p>
        ) : (
          <>
            <div className="overflow-x-auto mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${tokens.cardBorda}` }}>
                    <th className="text-left px-2 py-2 font-semibold text-xs uppercase" style={{ color: tokens.textoMuted }}>{t("colHorario", lang)}</th>
                    <th className="text-right px-2 py-2 font-semibold text-xs uppercase" style={{ color: tokens.textoMuted }}>{t("colQtd", lang)}</th>
                    <th className="text-right px-2 py-2 font-semibold text-xs uppercase" style={{ color: tokens.textoMuted }}>{t("colValorUnit", lang)}</th>
                    <th className="text-right px-2 py-2 font-semibold text-xs uppercase" style={{ color: tokens.textoMuted }}>{t("colTotal", lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((v) => (
                    <tr key={v.vendaId} style={{ borderBottom: `1px solid ${tokens.cardBorda}`, color: tokens.texto }}>
                      <td className="px-2 py-2 whitespace-nowrap">{new Date(v.horario).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                      <td className="px-2 py-2 text-right">{v.quantidade}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">{moeda(v.precoUnitario)}</td>
                      <td className="px-2 py-2 text-right whitespace-nowrap font-semibold">{moeda(v.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: tokens.acentoSuaveBg }}>
              <span className="text-xs font-bold" style={{ color: tokens.texto }}>{t("totalConsolidado", lang)}</span>
              <span className="text-sm font-black" style={{ color: tokens.texto }}>{totalQtd} {t("colQtd", lang).toLowerCase()} · {moeda(totalValor)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PAINEL FECHAMENTO
// ============================================================================

function PainelFechamento({
  lang, config, turnos, turnoSelecionado, onSelecionarTurno,
  valorContadoInput, onValorContadoInput, onAbrirMovimentacao, onFecharCaixa, resultadoFechamento,
  composicaoTotal, composicaoCarregando, composicaoDisponivel, onVerComposicao,
  movimentacoes, carregandoMovimentacoes, userId, onEditarMovimentacao, onExcluirMovimentacao,
}: {
  lang: Idioma; config: ConfigRetaguarda; turnos: TurnoAberto[]; turnoSelecionado: string | null;
  onSelecionarTurno: (id: string) => void;
  valorContadoInput: string; onValorContadoInput: (v: string) => void;
  onAbrirMovimentacao: (tipo: "sangria" | "suprimento") => void;
  onFecharCaixa: () => void;
  resultadoFechamento: ResultadoFechamento | null;
  composicaoTotal: number | null;
  composicaoCarregando: boolean;
  composicaoDisponivel: boolean;
  onVerComposicao: () => void;
  movimentacoes: MovimentacaoCaixa[];
  carregandoMovimentacoes: boolean;
  userId: string | null;
  onEditarMovimentacao: (m: MovimentacaoCaixa) => void;
  onExcluirMovimentacao: (m: MovimentacaoCaixa) => void;
}) {
  const { tokens } = useTemaPdv();
  const turno = turnos.find((t2) => t2.id === turnoSelecionado) || null;
  const [calculadoraAberta, setCalculadoraAberta] = useState(false);
  const [contagemAberta, setContagemAberta] = useState(false);

  function aplicarValorContado(valor: number) {
    onValorContadoInput(valor.toFixed(2).replace(".", ","));
  }

  return (
    <div className="flex flex-col gap-4">
      {resultadoFechamento && (
        <CardResultadoFechamento lang={lang} resultado={resultadoFechamento}
          onVerComposicao={composicaoDisponivel ? onVerComposicao : undefined} />
      )}

      <div className="rounded-2xl p-4" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
        {turnos.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("nenhumTurnoAberto", lang)}</p>
        ) : (
          <>
            <label className="text-xs font-semibold block mb-1" style={{ color: tokens.cardTexto, opacity: 0.72 }}>{t("turnoLabel", lang)}</label>
            <select value={turnoSelecionado || ""} onChange={(e) => onSelecionarTurno(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-2"
              style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}>
              <option value="">{t("selecioneTurno", lang)}</option>
              {turnos.map((t2) => <option key={t2.id} value={t2.id}>{t2.caixaNome}</option>)}
            </select>

            {turno && (
              <>
                <p className="text-xs mb-4" style={{ color: tokens.cardTexto, opacity: 0.65 }}>
                  {t("abertoDesde", lang, { hora: new Date(turno.abertoEm).toLocaleString("pt-BR") })} · {t("fundoAbertura", lang, { valor: moeda(turno.valorAbertura) })}
                </p>

                <div className="flex items-center justify-between gap-3 mb-4 rounded-xl p-3" style={{ background: tokens.acentoSuaveBg }}>
                  <div>
                    <p className="text-[11px] font-bold uppercase" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("esperado", lang)}</p>
                    {composicaoCarregando && composicaoTotal === null ? (
                      <Loader2 className="animate-spin mt-1" size={16} style={{ color: tokens.cardTexto }} />
                    ) : (
                      <p className="text-lg font-black" style={{ color: tokens.cardTexto }}>{moeda(composicaoTotal ?? 0)}</p>
                    )}
                  </div>
                  {composicaoTotal !== null && (
                    <button onClick={onVerComposicao} className="flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ color: tokens.acento }}>
                      <Search size={13} />
                      {t("verComposicao", lang)}
                    </button>
                  )}
                </div>

                {config.conferirGaveta && (
                  <>
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => onAbrirMovimentacao("sangria")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "rgba(248,113,113,0.15)", color: "#f87171", border: "1px solid rgba(248,113,113,0.35)" }}>
                        <ArrowUpCircle size={15} />
                        {t("sangria", lang)}
                      </button>
                      <button onClick={() => onAbrirMovimentacao("suprimento")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold"
                        style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.35)" }}>
                        <ArrowDownCircle size={15} />
                        {t("suprimento", lang)}
                      </button>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("lancamentosTitulo", lang)}</p>
                    <ListaMovimentacoes lang={lang} movimentacoes={movimentacoes} carregando={carregandoMovimentacoes}
                      turnoAberto userId={userId} onEditar={onEditarMovimentacao} onExcluir={onExcluirMovimentacao} />

                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold" style={{ color: tokens.cardTexto, opacity: 0.72 }}>{t("valorContadoLabel", lang)}</label>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCalculadoraAberta(true)} title={t("abrirCalculadora", lang)}
                          className="p-1.5 rounded-lg" style={{ background: tokens.inputBg, color: tokens.acento }}>
                          <Calculator size={14} />
                        </button>
                        <button onClick={() => setContagemAberta(true)} title={t("abrirContagemGaveta", lang)}
                          className="p-1.5 rounded-lg" style={{ background: tokens.inputBg, color: tokens.acento }}>
                          <Banknote size={14} />
                        </button>
                      </div>
                    </div>
                    <input
                      value={valorContadoInput} onChange={(e) => onValorContadoInput(e.target.value)}
                      inputMode="decimal" placeholder="0,00"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-4"
                      style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
                    />
                  </>
                )}

                <button onClick={onFecharCaixa}
                  className="w-full py-3 rounded-xl text-sm font-black"
                  style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
                  {config.conferirGaveta ? t("fecharCaixa", lang) : t("confirmarEFecharSemConferencia", lang)}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {calculadoraAberta && (
        <ModalCalculadora lang={lang} onUsar={aplicarValorContado} onFechar={() => setCalculadoraAberta(false)} />
      )}
      {contagemAberta && (
        <ModalContagemGaveta lang={lang} onUsar={aplicarValorContado} onFechar={() => setContagemAberta(false)} />
      )}
    </div>
  );
}

function ListaMovimentacoes({ lang, movimentacoes, carregando, turnoAberto, userId, onEditar, onExcluir }: {
  lang: Idioma; movimentacoes: MovimentacaoCaixa[]; carregando: boolean; turnoAberto: boolean; userId: string | null;
  onEditar: (m: MovimentacaoCaixa) => void; onExcluir: (m: MovimentacaoCaixa) => void;
}) {
  const { tokens } = useTemaPdv();
  if (carregando && movimentacoes.length === 0) {
    return <div className="mb-4"><EstadoCarregando lang={lang} /></div>;
  }
  if (movimentacoes.length === 0) {
    return <p className="text-xs text-center py-3 mb-4" style={{ color: tokens.cardTexto, opacity: 0.55 }}>{t("nenhumaMovimentacao", lang)}</p>;
  }
  return (
    <div className="flex flex-col gap-2 mb-4">
      {movimentacoes.map((m) => {
        const cor = m.tipo === "sangria" ? "#f87171" : "#34d399";
        const Icone = m.tipo === "sangria" ? ArrowUpCircle : ArrowDownCircle;
        return (
          <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl p-2.5"
            style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
            <div className="flex items-center gap-2 min-w-0">
              <Icone size={16} style={{ color: cor }} className="shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold" style={{ color: tokens.cardTexto }}>
                  {t(m.tipo, lang)} · {moeda(m.valor)}
                </p>
                <p className="text-[11px] truncate" style={{ color: tokens.cardTexto, opacity: 0.65 }}>
                  {new Date(m.criadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  {m.motivo ? ` · ${m.motivo}` : ""}
                  {m.usuarioId === userId ? ` · ${t("voce", lang)}` : ""}
                </p>
              </div>
            </div>
            {turnoAberto && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => onEditar(m)} title={t("editarMovimentacaoBotao", lang)}
                  className="p-1.5 rounded-lg" style={{ background: tokens.inputBg, color: tokens.acento }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => onExcluir(m)} title={t("excluirMovimentacaoBotao", lang)}
                  className="p-1.5 rounded-lg" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CardResultadoFechamento({ lang, resultado, onVerComposicao }: { lang: Idioma; resultado: ResultadoFechamento; onVerComposicao?: () => void }) {
  const { tokens } = useTemaPdv();
  const diferenca = resultado.diferenca;
  const corDiferenca = diferenca === null ? tokens.cardTexto : diferenca === 0 ? tokens.acento : diferenca > 0 ? "#34d399" : "#f87171";
  return (
    <div className="rounded-2xl p-4" style={{ background: tokens.cardBg, border: `2px solid ${tokens.acento}` }}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold" style={{ color: tokens.cardTexto }}>{t("resultadoFechamentoTitulo", lang)}</h3>
        {onVerComposicao && (
          <button onClick={onVerComposicao} className="flex items-center gap-1.5 text-xs font-bold shrink-0" style={{ color: tokens.acento }}>
            <Search size={13} />
            {t("verComposicao", lang)}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase mb-1" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("esperado", lang)}</p>
          <p className="text-lg font-black" style={{ color: tokens.cardTexto }}>{moeda(resultado.valorEsperado)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase mb-1" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("contado", lang)}</p>
          <p className="text-lg font-black" style={{ color: tokens.cardTexto }}>{moeda(resultado.valorContado)}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase mb-1" style={{ color: tokens.cardTexto, opacity: 0.65 }}>{t("diferenca", lang)}</p>
          <p className="text-lg font-black" style={{ color: corDiferenca }}>
            {diferenca === null ? "—" : diferenca === 0 ? t("bateuCerto", lang) : diferenca > 0 ? t("sobra", lang, { valor: moeda(diferenca) }) : t("falta", lang, { valor: moeda(Math.abs(diferenca)) })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAIS
// ============================================================================

function ModalMovimentacao({ lang, tipo, registrando, onConfirmar, onCancelar }: {
  lang: Idioma; tipo: "sangria" | "suprimento"; registrando: boolean;
  onConfirmar: (valor: number, motivo: string) => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [valorInput, setValorInput] = useState("");
  const [motivo, setMotivo] = useState("");

  function handleConfirmar() {
    const valor = Number(valorInput.replace(",", "."));
    if (!valor || valor <= 0 || isNaN(valor)) return;
    onConfirmar(valor, motivo.trim());
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: tokens.texto }}>
          {t(tipo === "sangria" ? "modalSangriaTitulo" : "modalSuprimentoTitulo", lang)}
        </h3>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("valorLabel", lang)}</label>
        <input
          value={valorInput} onChange={(e) => setValorInput(e.target.value)}
          inputMode="decimal" placeholder="0,00" autoFocus
          className="w-full px-3 py-3 rounded-xl text-lg font-bold outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("motivoLabel", lang)}</label>
        <input
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={registrando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelar", lang)}
          </button>
          <button onClick={handleConfirmar} disabled={registrando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {registrando && <Loader2 className="animate-spin" size={14} />}
            {registrando ? t("registrando", lang) : t("registrar", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SecaoComposicao({ titulo, total, sinal, cor, expandido, onToggle, vazio, lang, children }: {
  titulo: string; total: number; sinal: "+" | "−"; cor: string; expandido: boolean; onToggle: () => void;
  vazio: boolean; lang: Idioma; children: React.ReactNode;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="rounded-xl p-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
      <button onClick={onToggle} disabled={vazio} className="w-full flex items-center justify-between gap-2 text-left disabled:opacity-60">
        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: tokens.cardTexto }}>
          {!vazio && (expandido ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
          {titulo}
        </span>
        <span className="text-sm font-black shrink-0" style={{ color: cor }}>{sinal} {moeda(total)}</span>
      </button>
      {vazio ? (
        <p className="text-[11px] mt-1" style={{ color: tokens.cardTexto, opacity: 0.5 }}>{t("nenhumRegistro", lang)}</p>
      ) : expandido ? (
        <div className="mt-1">{children}</div>
      ) : null}
    </div>
  );
}

function ModalComposicaoEsperado({ lang, linhas, onFechar }: {
  lang: Idioma; linhas: ComposicaoLinha[]; onFechar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [expandido, setExpandido] = useState<Record<string, boolean>>({ venda: true, suprimento: false, sangria: false });
  function toggle(c: string) { setExpandido((a) => ({ ...a, [c]: !a[c] })); }

  const porComponente = (c: string) => linhas.filter((l) => l.componente === c);
  const somar = (c: string) => porComponente(c).reduce((s, l) => s + l.valor, 0);
  const dataHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const abertura = porComponente("abertura")[0] || null;
  const vendas = porComponente("venda").slice().sort((a, b) => (a.numeroSequencial || 0) - (b.numeroSequencial || 0));
  const suprimentos = porComponente("suprimento");
  const sangrias = porComponente("sangria");

  const totalAbertura = abertura?.valor || 0;
  const totalVendas = somar("venda");
  const totalSuprimentos = somar("suprimento");
  const totalSangrias = somar("sangria");
  const totalEsperado = totalAbertura + totalVendas + totalSuprimentos - totalSangrias;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-lg rounded-2xl p-6 max-h-[85vh] overflow-y-auto" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center justify-between mb-4 gap-3">
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("composicaoTitulo", lang)}</h3>
          <button onClick={onFechar} className="shrink-0" style={{ color: tokens.textoMuted }}><X size={18} /></button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-xl p-3" style={{ background: tokens.cardBg, border: `1px solid ${tokens.cardBorda}` }}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold" style={{ color: tokens.cardTexto }}>{t("compAbertura", lang)}</p>
                {abertura && <p className="text-[11px]" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{dataHora(abertura.horario)}</p>}
              </div>
              <p className="text-sm font-black shrink-0" style={{ color: tokens.cardTexto }}>{moeda(totalAbertura)}</p>
            </div>
          </div>

          <SecaoComposicao titulo={t("compVendas", lang)} total={totalVendas} sinal="+" cor={tokens.cardTexto} lang={lang}
            expandido={expandido.venda} onToggle={() => toggle("venda")} vazio={vendas.length === 0}>
            {vendas.map((v) => (
              <div key={v.referenciaId} className="flex items-center justify-between gap-2 py-1.5" style={{ borderTop: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
                <div className="min-w-0">
                  <p className="text-xs">
                    <span className="font-bold">#{v.numeroSequencial}</span>{" · "}
                    <span style={{ opacity: 0.75 }}>{dataHora(v.horario)}</span>
                  </p>
                  <p className="text-xs truncate" style={{ opacity: 0.85 }}>
                    {v.produtoPrincipal}
                    {(v.qtdItens || 0) > 1 ? ` ${t("maisItens", lang, { n: (v.qtdItens || 1) - 1 })}` : ""}
                  </p>
                </div>
                <span className="text-xs font-bold shrink-0">{moeda(v.valor)}</span>
              </div>
            ))}
          </SecaoComposicao>

          <SecaoComposicao titulo={t("suprimento", lang)} total={totalSuprimentos} sinal="+" cor="#34d399" lang={lang}
            expandido={expandido.suprimento} onToggle={() => toggle("suprimento")} vazio={suprimentos.length === 0}>
            {suprimentos.map((s) => (
              <div key={s.referenciaId} className="flex items-center justify-between gap-2 py-1.5" style={{ borderTop: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
                <div className="min-w-0">
                  <p className="text-xs" style={{ opacity: 0.75 }}>{dataHora(s.horario)}</p>
                  {s.motivo && <p className="text-xs truncate" style={{ opacity: 0.85 }}>{s.motivo}</p>}
                </div>
                <span className="text-xs font-bold shrink-0">{moeda(s.valor)}</span>
              </div>
            ))}
          </SecaoComposicao>

          <SecaoComposicao titulo={t("sangria", lang)} total={totalSangrias} sinal="−" cor="#f87171" lang={lang}
            expandido={expandido.sangria} onToggle={() => toggle("sangria")} vazio={sangrias.length === 0}>
            {sangrias.map((s) => (
              <div key={s.referenciaId} className="flex items-center justify-between gap-2 py-1.5" style={{ borderTop: `1px solid ${tokens.cardBorda}`, color: tokens.cardTexto }}>
                <div className="min-w-0">
                  <p className="text-xs" style={{ opacity: 0.75 }}>{dataHora(s.horario)}</p>
                  {s.motivo && <p className="text-xs truncate" style={{ opacity: 0.85 }}>{s.motivo}</p>}
                </div>
                <span className="text-xs font-bold shrink-0">{moeda(s.valor)}</span>
              </div>
            ))}
          </SecaoComposicao>

          <div className="flex items-center justify-between px-3 py-3 rounded-xl mt-1" style={{ background: tokens.acaoBg }}>
            <span className="text-xs font-black" style={{ color: tokens.acaoTexto }}>{t("totalEsperadoLinha", lang)}</span>
            <span className="text-lg font-black" style={{ color: tokens.acaoTexto }}>{moeda(totalEsperado)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalEditarMovimentacao({ lang, movimentacao, salvando, onConfirmar, onCancelar }: {
  lang: Idioma; movimentacao: MovimentacaoCaixa; salvando: boolean;
  onConfirmar: (valor: number, motivo: string) => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  const [valorInput, setValorInput] = useState(String(movimentacao.valor).replace(".", ","));
  const [motivo, setMotivo] = useState(movimentacao.motivo || "");

  function handleConfirmar() {
    const valor = Number(valorInput.replace(",", "."));
    if (!valor || valor <= 0 || isNaN(valor)) return;
    onConfirmar(valor, motivo.trim());
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-1" style={{ color: tokens.texto }}>
          {t("editarMovimentacaoTitulo", lang, { tipo: t(movimentacao.tipo, lang) })}
        </h3>
        <p className="text-xs mb-4" style={{ color: tokens.textoMuted }}>{t("tipoNaoMuda", lang)}</p>

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("valorLabel", lang)}</label>
        <input
          value={valorInput} onChange={(e) => setValorInput(e.target.value)}
          inputMode="decimal" placeholder="0,00" autoFocus
          className="w-full px-3 py-3 rounded-xl text-lg font-bold outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <label className="text-xs font-semibold block mb-1" style={{ color: tokens.texto }}>{t("motivoLabel", lang)}</label>
        <input
          value={motivo} onChange={(e) => setMotivo(e.target.value)}
          className="w-full px-3 py-3 rounded-xl text-sm outline-none mb-4"
          style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }}
        />

        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={salvando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelar", lang)}
          </button>
          <button onClick={handleConfirmar} disabled={salvando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {salvando && <Loader2 className="animate-spin" size={14} />}
            {salvando ? t("editarMovimentacaoSalvando", lang) : t("editarMovimentacaoSalvar", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarExclusaoMovimentacao({ lang, movimentacao, excluindo, onConfirmar, onCancelar }: {
  lang: Idioma; movimentacao: MovimentacaoCaixa; excluindo: boolean;
  onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: "2px solid #f87171" }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} style={{ color: "#f87171" }} />
          <h3 className="text-sm font-bold" style={{ color: "#f87171" }}>{t("confirmarExclusaoTitulo", lang)}</h3>
        </div>
        <p className="text-sm mb-5" style={{ color: tokens.texto }}>
          {t("confirmarExclusaoTexto", lang, { tipo: t(movimentacao.tipo, lang).toLowerCase(), valor: moeda(movimentacao.valor) })}
        </p>
        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={excluindo}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelar", lang)}
          </button>
          <button onClick={onConfirmar} disabled={excluindo}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#f87171", color: "#020810" }}>
            {excluindo && <Loader2 className="animate-spin" size={14} />}
            {excluindo ? t("excluindo", lang) : t("excluir", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CALCULADORA — reducer simples (mesmo padrão de calculadora de bolso: um
// valor pendente + operador + "aguardando novo número" depois de um
// operador ou do "="). useReducer em vez de vários useState soltos porque
// as transições dependem umas das outras (operador precisa saber se já tem
// valor pendente pra encadear "12 + 3 + 4" sem apertar "=" no meio).
// ============================================================================

type OperadorCalc = "+" | "-" | "×" | "÷";
type EstadoCalculadora = {
  display: string; valorAnterior: number | null; operador: OperadorCalc | null;
  aguardandoNovoValor: boolean; historico: string[];
};
type AcaoCalculadora =
  | { tipo: "digito"; valor: string }
  | { tipo: "operador"; valor: OperadorCalc }
  | { tipo: "igual" }
  | { tipo: "limpar" }
  | { tipo: "apagar" }
  | { tipo: "sinal" };

const ESTADO_INICIAL_CALCULADORA: EstadoCalculadora = { display: "0", valorAnterior: null, operador: null, aguardandoNovoValor: false, historico: [] };

function formatarNumeroCalc(v: number): string {
  return v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcularOperacao(a: number, b: number, op: OperadorCalc): number | null {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? null : a / b;
  }
}

function reducerCalculadora(estado: EstadoCalculadora, acao: AcaoCalculadora): EstadoCalculadora {
  switch (acao.tipo) {
    case "digito": {
      if (estado.display === "Erro" || estado.aguardandoNovoValor) {
        return { ...estado, display: acao.valor === "," ? "0," : acao.valor, aguardandoNovoValor: false };
      }
      if (acao.valor === ",") {
        return estado.display.includes(",") ? estado : { ...estado, display: estado.display + "," };
      }
      if (estado.display === "0") return { ...estado, display: acao.valor };
      if (estado.display.replace(/[,-]/g, "").length >= 12) return estado;
      return { ...estado, display: estado.display + acao.valor };
    }
    case "operador": {
      const atual = Number(estado.display.replace(",", "."));
      if (estado.valorAnterior !== null && estado.operador && !estado.aguardandoNovoValor) {
        const resultado = calcularOperacao(estado.valorAnterior, atual, estado.operador);
        if (resultado === null) return { ...ESTADO_INICIAL_CALCULADORA, display: "Erro", historico: estado.historico };
        return { display: formatarNumeroCalc(resultado), valorAnterior: resultado, operador: acao.valor, aguardandoNovoValor: true, historico: estado.historico };
      }
      return { ...estado, valorAnterior: atual, operador: acao.valor, aguardandoNovoValor: true };
    }
    case "igual": {
      if (estado.valorAnterior === null || !estado.operador) return estado;
      const atual = Number(estado.display.replace(",", "."));
      const resultado = calcularOperacao(estado.valorAnterior, atual, estado.operador);
      if (resultado === null) return { ...ESTADO_INICIAL_CALCULADORA, display: "Erro", historico: estado.historico };
      const linha = `${formatarNumeroCalc(estado.valorAnterior)} ${estado.operador} ${formatarNumeroCalc(atual)} = ${formatarNumeroCalc(resultado)}`;
      return { display: formatarNumeroCalc(resultado), valorAnterior: null, operador: null, aguardandoNovoValor: true, historico: [linha, ...estado.historico].slice(0, 5) };
    }
    case "limpar":
      return { ...ESTADO_INICIAL_CALCULADORA, historico: estado.historico };
    case "apagar": {
      if (estado.display === "Erro" || estado.aguardandoNovoValor) return { ...estado, display: "0", aguardandoNovoValor: false };
      if (estado.display.length <= 1 || (estado.display.length === 2 && estado.display.startsWith("-"))) return { ...estado, display: "0" };
      return { ...estado, display: estado.display.slice(0, -1) };
    }
    case "sinal":
      return estado.display === "0" || estado.display === "Erro" ? estado
        : { ...estado, display: estado.display.startsWith("-") ? estado.display.slice(1) : "-" + estado.display };
    default:
      return estado;
  }
}

function ModalCalculadora({ lang, onUsar, onFechar }: { lang: Idioma; onUsar: (valor: number) => void; onFechar: () => void }) {
  const { tokens } = useTemaPdv();
  const [estado, dispatch] = useReducer(reducerCalculadora, ESTADO_INICIAL_CALCULADORA);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key >= "0" && e.key <= "9") { dispatch({ tipo: "digito", valor: e.key }); return; }
      if (e.key === "," || e.key === ".") { dispatch({ tipo: "digito", valor: "," }); return; }
      if (e.key === "+") { dispatch({ tipo: "operador", valor: "+" }); return; }
      if (e.key === "-") { dispatch({ tipo: "operador", valor: "-" }); return; }
      if (e.key === "*") { dispatch({ tipo: "operador", valor: "×" }); return; }
      if (e.key === "/") { e.preventDefault(); dispatch({ tipo: "operador", valor: "÷" }); return; }
      if (e.key === "Enter" || e.key === "=") { dispatch({ tipo: "igual" }); return; }
      if (e.key === "Backspace") { dispatch({ tipo: "apagar" }); return; }
      if (e.key === "Escape") { onFechar(); return; }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const botoesLinha1: { label: string; acao: AcaoCalculadora }[] = [
    { label: "C", acao: { tipo: "limpar" } },
    { label: "CE", acao: { tipo: "apagar" } },
    { label: "±", acao: { tipo: "sinal" } },
    { label: "÷", acao: { tipo: "operador", valor: "÷" } },
  ];
  const linhasNumericas: { label: string; acao: AcaoCalculadora; operador?: boolean }[][] = [
    [{ label: "7", acao: { tipo: "digito", valor: "7" } }, { label: "8", acao: { tipo: "digito", valor: "8" } }, { label: "9", acao: { tipo: "digito", valor: "9" } }, { label: "×", acao: { tipo: "operador", valor: "×" }, operador: true }],
    [{ label: "4", acao: { tipo: "digito", valor: "4" } }, { label: "5", acao: { tipo: "digito", valor: "5" } }, { label: "6", acao: { tipo: "digito", valor: "6" } }, { label: "-", acao: { tipo: "operador", valor: "-" }, operador: true }],
    [{ label: "1", acao: { tipo: "digito", valor: "1" } }, { label: "2", acao: { tipo: "digito", valor: "2" } }, { label: "3", acao: { tipo: "digito", valor: "3" } }, { label: "+", acao: { tipo: "operador", valor: "+" }, operador: true }],
  ];

  function BotaoCalc({ label, acao, estilo, className }: { label: string; acao: AcaoCalculadora; estilo?: "operador" | "acao" | "igual"; className?: string }) {
    return (
      <button onClick={() => dispatch(acao)} className={`py-3 rounded-xl text-base font-bold ${className || ""}`}
        style={estilo === "operador" ? { background: tokens.acentoSuaveBg, color: tokens.acento }
          : estilo === "acao" ? { background: "rgba(248,113,113,0.12)", color: "#f87171" }
          : estilo === "igual" ? { background: tokens.acaoBg, color: tokens.acaoTexto }
          : { background: tokens.inputBg, color: tokens.inputTexto }}>
        {label}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("calculadoraTitulo", lang)}</h3>
          <button onClick={onFechar} style={{ color: tokens.textoMuted }}><X size={18} /></button>
        </div>

        <div className="rounded-xl px-4 py-4 mb-3 text-right overflow-hidden" style={{ background: tokens.inputBg, border: `1px solid ${tokens.inputBorda}` }}>
          <p className="text-3xl font-black truncate" style={{ color: tokens.inputTexto }}>{estado.display}</p>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {botoesLinha1.map((b) => <BotaoCalc key={b.label} label={b.label} acao={b.acao} estilo={b.label === "÷" ? "operador" : "acao"} />)}
          {linhasNumericas.map((linha) => linha.map((b) => <BotaoCalc key={b.label} label={b.label} acao={b.acao} estilo={b.operador ? "operador" : undefined} />))}
          <BotaoCalc label="0" acao={{ tipo: "digito", valor: "0" }} className="col-span-2" />
          <BotaoCalc label="," acao={{ tipo: "digito", valor: "," }} />
          <BotaoCalc label="=" acao={{ tipo: "igual" }} estilo="igual" />
        </div>

        {estado.historico.length > 0 && (
          <div className="mb-3 max-h-24 overflow-y-auto rounded-xl p-2" style={{ background: tokens.acentoSuaveBg }}>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("calculadoraHistorico", lang)}</p>
            {estado.historico.map((linha, i) => (
              <p key={i} className="text-xs" style={{ color: tokens.cardTexto, opacity: 0.85 }}>{linha}</p>
            ))}
          </div>
        )}

        <button onClick={() => { onUsar(Number(estado.display.replace(",", ".")) || 0); onFechar(); }}
          disabled={estado.display === "Erro"}
          className="w-full py-3 rounded-xl text-sm font-black disabled:opacity-50"
          style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
          {t("usarValorContado", lang)}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// CONTAGEM DE GAVETA — notas/moedas BR, persistida em session storage
// ENQUANTO O MODAL ESTIVER ABERTO (limpa só ao usar o total ou "limpar
// tudo") — protege contra fechar o modal sem querer no meio da contagem.
// ============================================================================

const CHAVE_CONTAGEM_GAVETA = "retaguarda_contagem_gaveta";
const DENOMINACOES_NOTAS = [200, 100, 50, 20, 10, 5, 2];
const DENOMINACOES_MOEDAS = [1, 0.5, 0.25, 0.1, 0.05];

function LinhaDenominacao({ valor, qtd, onQtd, lang }: { valor: number; qtd: string; onQtd: (q: string) => void; lang: Idioma }) {
  const { tokens } = useTemaPdv();
  const subtotal = valor * (Number(qtd) || 0);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-bold w-16 shrink-0" style={{ color: tokens.cardTexto }}>{moeda(valor)}</span>
      <input value={qtd} onChange={(e) => onQtd(e.target.value.replace(/[^0-9]/g, ""))}
        inputMode="numeric" placeholder="0" aria-label={t("qtdLabel", lang)}
        className="w-16 px-2 py-2 rounded-lg text-sm text-center outline-none shrink-0"
        style={{ background: tokens.inputBg, color: tokens.inputTexto, border: `1px solid ${tokens.inputBorda}` }} />
      <span className="text-[10px] font-bold uppercase shrink-0" style={{ color: tokens.cardTexto, opacity: 0.5 }}>{t("qtdLabel", lang)}</span>
      <span className="text-sm font-bold ml-auto text-right" style={{ color: tokens.cardTexto }}>{moeda(subtotal)}</span>
    </div>
  );
}

function ModalContagemGaveta({ lang, onUsar, onFechar }: { lang: Idioma; onUsar: (valor: number) => void; onFechar: () => void }) {
  const { tokens } = useTemaPdv();
  const [quantidades, setQuantidades] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const salvo = sessionStorage.getItem(CHAVE_CONTAGEM_GAVETA);
      if (salvo) setQuantidades(JSON.parse(salvo));
    } catch { /* sessionStorage indisponível — segue com os campos vazios */ }
  }, []);

  function atualizarQtd(valor: number, qtd: string) {
    setQuantidades((atual) => {
      const novo = { ...atual, [String(valor)]: qtd };
      try { sessionStorage.setItem(CHAVE_CONTAGEM_GAVETA, JSON.stringify(novo)); } catch { /* segue só em memória */ }
      return novo;
    });
  }

  function limparTudo() {
    setQuantidades({});
    try { sessionStorage.removeItem(CHAVE_CONTAGEM_GAVETA); } catch { /* nada a limpar */ }
  }

  const total = [...DENOMINACOES_NOTAS, ...DENOMINACOES_MOEDAS]
    .reduce((s, v) => s + v * (Number(quantidades[String(v)]) || 0), 0);

  function handleUsar() {
    onUsar(total);
    try { sessionStorage.removeItem(CHAVE_CONTAGEM_GAVETA); } catch { /* nada a limpar */ }
    onFechar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-5 max-h-[85vh] overflow-y-auto" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold" style={{ color: tokens.texto }}>{t("contagemGavetaTitulo", lang)}</h3>
          <button onClick={onFechar} style={{ color: tokens.textoMuted }}><X size={18} /></button>
        </div>

        <div className="rounded-xl p-3 mb-4 text-center" style={{ background: tokens.acaoBg }}>
          <p className="text-[11px] font-bold uppercase" style={{ color: tokens.acaoTexto, opacity: 0.85 }}>{t("totalGeral", lang)}</p>
          <p className="text-2xl font-black" style={{ color: tokens.acaoTexto }}>{moeda(total)}</p>
        </div>

        <p className="text-[11px] font-bold uppercase mb-2" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("notasLabel", lang)}</p>
        <div className="flex flex-col gap-2 mb-4">
          {DENOMINACOES_NOTAS.map((v) => (
            <LinhaDenominacao key={v} valor={v} qtd={quantidades[String(v)] || ""} onQtd={(q) => atualizarQtd(v, q)} lang={lang} />
          ))}
        </div>

        <p className="text-[11px] font-bold uppercase mb-2" style={{ color: tokens.cardTexto, opacity: 0.6 }}>{t("moedasLabel", lang)}</p>
        <div className="flex flex-col gap-2 mb-4">
          {DENOMINACOES_MOEDAS.map((v) => (
            <LinhaDenominacao key={v} valor={v} qtd={quantidades[String(v)] || ""} onQtd={(q) => atualizarQtd(v, q)} lang={lang} />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={limparTudo} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("limparTudo", lang)}
          </button>
          <button onClick={handleUsar} className="flex-1 py-3 rounded-xl text-sm font-black" style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {t("usarValorContado", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalConfirmarFechamento({ lang, fechando, onConfirmar, onCancelar }: {
  lang: Idioma; fechando: boolean; onConfirmar: () => void; onCancelar: () => void;
}) {
  const { tokens } = useTemaPdv();
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: "rgba(2,8,16,0.6)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: tokens.modalBg, border: `1px solid ${tokens.acentoSuaveBorda}` }}>
        <h3 className="text-sm font-bold mb-2" style={{ color: tokens.texto }}>{t("confirmarFechamentoTitulo", lang)}</h3>
        <p className="text-xs mb-5" style={{ color: tokens.textoMuted }}>{t("confirmarFechamentoTexto", lang)}</p>
        <div className="flex items-center gap-2">
          <button onClick={onCancelar} disabled={fechando}
            className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
            style={{ background: tokens.inputBg, color: tokens.inputTexto }}>
            {t("cancelar", lang)}
          </button>
          <button onClick={onConfirmar} disabled={fechando}
            className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: tokens.acaoBg, color: tokens.acaoTexto }}>
            {fechando && <Loader2 className="animate-spin" size={14} />}
            {fechando ? t("fechando", lang) : t("confirmar", lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
