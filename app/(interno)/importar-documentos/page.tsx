"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  parseArquivo,
  autodetectarMapeamento,
  type ResultadoParse,
  type LinhaImportada,
  type DestinoTabela,
  type MapeamentoColunas,
} from "../../../lib/importarParsers";
import {
  hashArquivo,
  hashLinha,
  buscarImportacaoPorHash,
  marcarDuplicatasPorLinha,
  uploadArquivo,
  criarImportacao,
  gravarLinhas,
  reverterImportacao,
  carregarStatsMes,
  carregarTemplates,
  salvarTemplate,
  gerarUrlAssinada,
  listarLinhasImportacao,
  editarLinhaImportada,
  deletarLinhaImportada,
  excluirRegistroImportacao,
  listarExcecoes,
  resolverExcecao,
  listarTimeline,
  abrirExcecaoFormatoReforma,
  sugerirClassificacoes,
  normalizarPadraoChave,
  detectarPossiveisDuplicatas,
  type StatsMes,
  type ResultadoGravacao,
  type SugestaoClassificacao,
  type PossivelDuplicata,
} from "../../../lib/importarHelpers";
import { obterEmpresaAtiva, carregarEmpresaPorId } from "../../../lib/empresaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// I18N - termos novos do módulo (idioma carrega o resto via t.importar)
// ============================================================================
const T = {
  pt: {
    dashboard: "Painel de Importações - Este Mês",
    totalImportado: "Total Importado",
    docsProcessados: "Documentos Processados",
    taxaSucesso: "Taxa de Sucesso",
    duplicadasEvitadas: "Duplicatas Evitadas",
    tempoMedio: "Tempo Médio",
    horasEconomizadas: "Horas Economizadas",
    visaoGeral: "Visão Geral",
    historico: "Histórico",
    duplicataGlobal: "Este arquivo já foi importado",
    duplicataGlobalMsg: "Detectamos que este arquivo idêntico já foi importado em",
    importarAssim: "Importar mesmo assim",
    cancelar: "Cancelar",
    formatosSuportados: "OFX, XML NF-e, CSV, XLSX, XLS, PDF",
    arrasteAqui: "Arraste seu arquivo aqui",
    ouClique: "ou clique para selecionar",
    processando: "Processando arquivo...",
    calcHash: "Verificando duplicatas...",
    parseando: "Lendo conteúdo do arquivo...",
    uploadStorage: "Salvando no cofre seguro...",
    dedup: "Cruzando com base existente...",
    preview: "Revisão antes de Importar",
    tipoDetectado: "Tipo detectado",
    destino: "Destino",
    destinoLabels: {
      fluxo_caixa: "Fluxo de Caixa",
      receitas: "Receitas",
      custos_fixos: "Custos Fixos",
      custos_variaveis: "Custos Variáveis",
      contas_pagar: "Contas a Pagar",
      contas_receber: "Contas a Receber",
      fornecedores: "Fornecedores",
      dividas: "Endividamento",
    } as Record<string, string>,
    statusLabels: {
      aguardando_revisao: "Aguardando",
      concluido: "Concluído",
      parcialmente: "Parcial",
      revertido: "Desfeito",
      erro: "Erro",
      processado: "Concluído",
      falhou: "Erro",
    } as Record<string, string>,
    destinoTodasLinhas: "(todas as linhas)",
    destinoDiferentesPorLinha: "destinos diferentes por linha (confira abaixo)",
    destinoMultiplos: "— múltiplos —",
    destinoSelecionadas: "Destino das selecionadas:",
    aplicar: "Aplicar",
    confiraDestino: "Sugestão automática com baixa confiança — confira.",
    linhasDetectadas: "linhas detectadas",
    linhasSelecionadas: "selecionadas",
    duplicadasMarcadas: "duplicatas marcadas",
    valorTotal: "Valor total",
    selecionarTodos: "Selecionar todos",
    desselecionar: "Desselecionar tudo",
    mapeamentoColunas: "Mapeamento de Colunas",
    mapeamentoNecessario: "Identifique as colunas do seu arquivo",
    salvarTemplate: "Salvar como Template",
    templatesDisponiveis: "Templates Salvos",
    nomeTemplate: "Nome do template (ex: Extrato Itaú)",
    confirmarImport: "Confirmar Importação",
    importando: "Importando...",
    sucessoImport: "Importação concluída!",
    importadas: "importadas",
    duplicadas: "duplicadas",
    ignoradas: "ignoradas",
    erros: "erros",
    novoImporte: "Nova Importação",
    semImportacoes: "Nenhuma importação ainda. Comece arrastando um arquivo!",
    filtroStatus: "Status",
    filtroDestino: "Destino",
    todos: "Todos",
    detalhes: "Ver detalhes",
    baixarOriginal: "Baixar original",
    compartilhar: "Compartilhar",
    desfazer: "Desfazer",
    desfazerConfirma: "Tem certeza? Isso vai REMOVER todos os lançamentos criados por esta importação.",
    desfazendo: "Desfazendo...",
    desfeito: "Importação desfeita",
    desfeitoComFalhas: "Desfeito, mas alguns registros de controle da reversão falharam.",
    editadoComAvisoTrilha: "Linha atualizada, mas o registro de auditoria/totais falhou.",
    compartilharTitulo: "Resumo da importação",
    arquivoCopiado: "Resumo copiado para área de transferência",
    arquivoLabel: "Arquivo",
    dataImportacaoLabel: "Data Importação",
    resultadoLabel: "Resultado",
    nenhumaSelecionada: "Selecione pelo menos uma linha para importar",
    coluna: "Coluna",
    data: "Data",
    valor: "Valor",
    descricao: "Descrição",
    categoria: "Categoria",
    documento: "Documento",
    naoMapeado: "Não mapeado",
    simular: "Simular",
    simulando: "Simulando...",
    resultadoSimulacao: "Resultado da simulação (nada foi gravado ainda)",
    excecoes: "Fila de Exceções",
    excecaoPendente: "Pendente",
    excecaoResolvida: "Resolvida",
    resolver: "Marcar como resolvida",
    resolvendo: "Resolvendo...",
    semExcecoes: "Nenhuma exceção nesta importação.",
    timeline: "Linha do Tempo",
    semTimeline: "Sem eventos registrados.",
    motivo: "Motivo",
    possivelDuplicata: "Possível Duplicata",
    pareceIgualA: "Parece igual a",
    horaConfere: "Mesma hora exata — bate perfeito",
    semHoraDisponivel: "hora não disponível pra confirmar automaticamente",
    importarMesmoAssim: "Importar mesmo assim",
    pular: "Pular",
    somar: "Somar ao existente",
    aplicarATodasPendentes: "Aplicar a todas as pendentes",
    duplicataPendente: "Resolva as possíveis duplicatas antes de continuar",
    verificandoDuplicatas: "Conferindo possíveis duplicatas...",
    linhaJaSomada: "Somado ao lançamento existente",
  },
  en: {
    dashboard: "Import Panel - This Month",
    totalImportado: "Total Imported",
    docsProcessados: "Documents Processed",
    taxaSucesso: "Success Rate",
    duplicadasEvitadas: "Duplicates Avoided",
    tempoMedio: "Average Time",
    horasEconomizadas: "Hours Saved",
    visaoGeral: "Overview",
    historico: "History",
    duplicataGlobal: "This file has been imported",
    duplicataGlobalMsg: "This identical file was already imported on",
    importarAssim: "Import anyway",
    cancelar: "Cancel",
    formatosSuportados: "OFX, XML NF-e, CSV, XLSX, XLS, PDF",
    arrasteAqui: "Drop your file here",
    ouClique: "or click to select",
    processando: "Processing file...",
    calcHash: "Checking for duplicates...",
    parseando: "Reading file contents...",
    uploadStorage: "Saving to secure vault...",
    dedup: "Cross-checking existing data...",
    preview: "Review before Import",
    tipoDetectado: "Detected type",
    destino: "Destination",
    destinoLabels: {
      fluxo_caixa: "Cash Flow",
      receitas: "Revenue",
      custos_fixos: "Fixed Costs",
      custos_variaveis: "Variable Costs",
      contas_pagar: "Accounts Payable",
      contas_receber: "Accounts Receivable",
      fornecedores: "Suppliers",
      dividas: "Debt",
    } as Record<string, string>,
    statusLabels: {
      aguardando_revisao: "Pending",
      concluido: "Completed",
      parcialmente: "Partial",
      revertido: "Undone",
      erro: "Error",
      processado: "Completed",
      falhou: "Error",
    } as Record<string, string>,
    destinoTodasLinhas: "(all rows)",
    destinoDiferentesPorLinha: "different destinations per row (check below)",
    destinoMultiplos: "— multiple —",
    destinoSelecionadas: "Destination for selected:",
    aplicar: "Apply",
    confiraDestino: "Automatic suggestion with low confidence — please check.",
    linhasDetectadas: "rows detected",
    linhasSelecionadas: "selected",
    duplicadasMarcadas: "duplicates marked",
    valorTotal: "Total value",
    selecionarTodos: "Select all",
    desselecionar: "Deselect all",
    mapeamentoColunas: "Column Mapping",
    mapeamentoNecessario: "Identify the columns in your file",
    salvarTemplate: "Save as Template",
    templatesDisponiveis: "Saved Templates",
    nomeTemplate: "Template name (e.g. Bank Statement)",
    confirmarImport: "Confirm Import",
    importando: "Importing...",
    sucessoImport: "Import completed!",
    importadas: "imported",
    duplicadas: "duplicates",
    ignoradas: "ignored",
    erros: "errors",
    novoImporte: "New Import",
    semImportacoes: "No imports yet. Start by dragging a file!",
    filtroStatus: "Status",
    filtroDestino: "Destination",
    todos: "All",
    detalhes: "View details",
    baixarOriginal: "Download original",
    compartilhar: "Share",
    desfazer: "Undo",
    desfazerConfirma: "Are you sure? This will REMOVE all entries created by this import.",
    desfazendo: "Undoing...",
    desfeito: "Import undone",
    desfeitoComFalhas: "Undone, but some rollback control records failed.",
    editadoComAvisoTrilha: "Entry updated, but the audit/totals record failed.",
    compartilharTitulo: "Import summary",
    arquivoCopiado: "Summary copied to clipboard",
    arquivoLabel: "File",
    dataImportacaoLabel: "Import Date",
    resultadoLabel: "Result",
    nenhumaSelecionada: "Select at least one row to import",
    coluna: "Column",
    data: "Date",
    valor: "Value",
    descricao: "Description",
    categoria: "Category",
    documento: "Document",
    naoMapeado: "Not mapped",
    simular: "Simulate",
    simulando: "Simulating...",
    resultadoSimulacao: "Simulation result (nothing saved yet)",
    excecoes: "Exception Queue",
    excecaoPendente: "Pending",
    excecaoResolvida: "Resolved",
    resolver: "Mark as resolved",
    resolvendo: "Resolving...",
    semExcecoes: "No exceptions on this import.",
    timeline: "Timeline",
    semTimeline: "No events recorded.",
    motivo: "Reason",
    possivelDuplicata: "Possible Duplicate",
    pareceIgualA: "Looks like",
    horaConfere: "Exact same time — perfect match",
    semHoraDisponivel: "time not available to auto-confirm",
    importarMesmoAssim: "Import anyway",
    pular: "Skip",
    somar: "Add to existing",
    aplicarATodasPendentes: "Apply to all pending",
    duplicataPendente: "Resolve the possible duplicates before continuing",
    verificandoDuplicatas: "Checking possible duplicates...",
    linhaJaSomada: "Added to existing entry",
  },
  es: {
    dashboard: "Panel de Importaciones - Este Mes",
    totalImportado: "Total Importado",
    docsProcessados: "Documentos Procesados",
    taxaSucesso: "Tasa de Éxito",
    duplicadasEvitadas: "Duplicados Evitados",
    tempoMedio: "Tiempo Promedio",
    horasEconomizadas: "Horas Ahorradas",
    visaoGeral: "Visión General",
    historico: "Historial",
    duplicataGlobal: "Este archivo ya fue importado",
    duplicataGlobalMsg: "Detectamos que este archivo idéntico ya fue importado el",
    importarAssim: "Importar de todos modos",
    cancelar: "Cancelar",
    formatosSuportados: "OFX, XML NF-e, CSV, XLSX, XLS, PDF",
    arrasteAqui: "Arrastra tu archivo aquí",
    ouClique: "o haz clic para seleccionar",
    processando: "Procesando archivo...",
    calcHash: "Verificando duplicados...",
    parseando: "Leyendo contenido...",
    uploadStorage: "Guardando en bóveda segura...",
    dedup: "Cruzando con base existente...",
    preview: "Revisión antes de Importar",
    tipoDetectado: "Tipo detectado",
    destino: "Destino",
    destinoLabels: {
      fluxo_caixa: "Flujo de Caja",
      receitas: "Ingresos",
      custos_fixos: "Costos Fijos",
      custos_variaveis: "Costos Variables",
      contas_pagar: "Cuentas por Pagar",
      contas_receber: "Cuentas por Cobrar",
      fornecedores: "Proveedores",
      dividas: "Deuda",
    } as Record<string, string>,
    statusLabels: {
      aguardando_revisao: "Pendiente",
      concluido: "Completado",
      parcialmente: "Parcial",
      revertido: "Deshecho",
      erro: "Error",
      processado: "Completado",
      falhou: "Error",
    } as Record<string, string>,
    destinoTodasLinhas: "(todas las filas)",
    destinoDiferentesPorLinha: "destinos diferentes por fila (revise abajo)",
    destinoMultiplos: "— múltiples —",
    destinoSelecionadas: "Destino de las seleccionadas:",
    aplicar: "Aplicar",
    confiraDestino: "Sugerencia automática con baja confianza — revise.",
    linhasDetectadas: "filas detectadas",
    linhasSelecionadas: "seleccionadas",
    duplicadasMarcadas: "duplicados marcados",
    valorTotal: "Valor total",
    selecionarTodos: "Seleccionar todo",
    desselecionar: "Deseleccionar todo",
    mapeamentoColunas: "Mapeo de Columnas",
    mapeamentoNecessario: "Identifica las columnas de tu archivo",
    salvarTemplate: "Guardar como Plantilla",
    templatesDisponiveis: "Plantillas Guardadas",
    nomeTemplate: "Nombre de plantilla (ej: Extracto Banco)",
    confirmarImport: "Confirmar Importación",
    importando: "Importando...",
    sucessoImport: "¡Importación completada!",
    importadas: "importadas",
    duplicadas: "duplicadas",
    ignoradas: "ignoradas",
    erros: "errores",
    novoImporte: "Nueva Importación",
    semImportacoes: "Aún no hay importaciones. ¡Comienza arrastrando un archivo!",
    filtroStatus: "Estado",
    filtroDestino: "Destino",
    todos: "Todos",
    detalhes: "Ver detalles",
    baixarOriginal: "Descargar original",
    compartilhar: "Compartir",
    desfazer: "Deshacer",
    desfazerConfirma: "¿Estás seguro? Esto ELIMINARÁ todas las entradas creadas por esta importación.",
    desfazendo: "Deshaciendo...",
    desfeito: "Importación deshecha",
    desfeitoComFalhas: "Deshecho, pero algunos registros de control de la reversión fallaron.",
    editadoComAvisoTrilha: "Línea actualizada, pero el registro de auditoría/totales falló.",
    compartilharTitulo: "Resumen de importación",
    arquivoCopiado: "Resumen copiado al portapapeles",
    arquivoLabel: "Archivo",
    dataImportacaoLabel: "Fecha de Importación",
    resultadoLabel: "Resultado",
    nenhumaSelecionada: "Selecciona al menos una fila para importar",
    coluna: "Columna",
    data: "Fecha",
    valor: "Valor",
    descricao: "Descripción",
    categoria: "Categoría",
    documento: "Documento",
    naoMapeado: "Sin mapear",
    simular: "Simular",
    simulando: "Simulando...",
    resultadoSimulacao: "Resultado de la simulación (nada se guardó todavía)",
    excecoes: "Cola de Excepciones",
    excecaoPendente: "Pendiente",
    excecaoResolvida: "Resuelta",
    resolver: "Marcar como resuelta",
    resolvendo: "Resolviendo...",
    semExcecoes: "Sin excepciones en esta importación.",
    timeline: "Línea de Tiempo",
    semTimeline: "Sin eventos registrados.",
    motivo: "Motivo",
    possivelDuplicata: "Posible Duplicado",
    pareceIgualA: "Parece igual a",
    horaConfere: "Misma hora exacta — coincide perfecto",
    semHoraDisponivel: "hora no disponible para confirmar automáticamente",
    importarMesmoAssim: "Importar de todos modos",
    pular: "Omitir",
    somar: "Sumar al existente",
    aplicarATodasPendentes: "Aplicar a todas las pendientes",
    duplicataPendente: "Resuelva los posibles duplicados antes de continuar",
    verificandoDuplicatas: "Verificando posibles duplicados...",
    linhaJaSomada: "Sumado al registro existente",
  },
};

// Destinos disponíveis com cor e ícone (idioma-neutros — o rótulo em texto
// vem sempre de tt.destinoLabels/tt.statusLabels, nunca fixo aqui, pra não
// vazar português/inglês dentro de outro idioma).
const DESTINOS: Array<{ key: DestinoTabela; icon: string; cor: string }> = [
  { key: "fluxo_caixa", icon: "💸", cor: "#6ab0ff" },
  { key: "receitas", icon: "💰", cor: "#34d399" },
  { key: "custos_fixos", icon: "📌", cor: "#fbbf24" },
  { key: "custos_variaveis", icon: "📊", cor: "#a78bfa" },
  { key: "contas_pagar", icon: "🧾", cor: "#f87171" },
  { key: "contas_receber", icon: "💵", cor: "#10b981" },
  { key: "fornecedores", icon: "🏢", cor: "#fb923c" },
  { key: "dividas", icon: "📋", cor: "#ef4444" },
];

const STATUS_INFO: Record<string, { cor: string }> = {
  aguardando_revisao: { cor: "#fbbf24" },
  concluido: { cor: "#34d399" },
  parcialmente: { cor: "#6ab0ff" },
  revertido: { cor: "#3a5a8a" },
  erro: { cor: "#f87171" },
  processado: { cor: "#34d399" },
  falhou: { cor: "#f87171" },
};

function destinoLabel(tt: any, key: string): string {
  return tt?.destinoLabels?.[key] || key;
}

function statusLabel(tt: any, status: string): string {
  return tt?.statusLabels?.[status] || status;
}

// Resumo de um array de destino por linha pra 1 rótulo só (cabeçalho da
// importação, template, PDF) — o destino REAL de cada linha continua vindo
// de importacao_linhas.destino_tabela, isso aqui é só pra exibição.
function destinoPredominante(destinos: DestinoTabela[]): DestinoTabela {
  if (destinos.length === 0) return "fluxo_caixa";
  const contagem = new Map<DestinoTabela, number>();
  destinos.forEach((d) => contagem.set(d, (contagem.get(d) || 0) + 1));
  let melhor: DestinoTabela = destinos[0];
  let max = 0;
  contagem.forEach((qtd, d) => {
    if (qtd > max) { max = qtd; melhor = d; }
  });
  return melhor;
}

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

function formatData(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

function formatDataHora(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ImportarDocumentosPage() {
  const { t, idioma } = useLanguage();
  const imp = t.importar;
  const langAtual = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[langAtual];
  const inputRef = useRef<HTMLInputElement>(null);

  // Estados base
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [empresaCnpj, setEmpresaCnpj] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [aba, setAba] = useState<"visao" | "historico">("visao");
  const [exportando, setExportando] = useState(false);

  // Estados de upload/parse
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [etapa, setEtapa] = useState<"" | "hash" | "parse" | "upload" | "dedup">("");
  const [hashFile, setHashFile] = useState<string>("");
  const [duplicataGlobal, setDuplicataGlobal] = useState<any>(null);

  // Estados de preview
  const [resultado, setResultado] = useState<ResultadoParse | null>(null);
  const [linhas, setLinhas] = useState<LinhaImportada[]>([]);
  const [selecionadas, setSelecionadas] = useState<boolean[]>([]);
  const [duplicadas, setDuplicadas] = useState<boolean[]>([]);
  // Distribuição automática de destino: um destino por LINHA, não por
  // arquivo inteiro (extrato pode ter entrada e saída, NF-e pode ser venda
  // ou compra). Inicializado com a sugestão do parser, sempre trocável.
  const [destinos, setDestinos] = useState<DestinoTabela[]>([]);
  const [mapeamento, setMapeamento] = useState<MapeamentoColunas>({});
  const [confirmando, setConfirmando] = useState(false);
  const [sucesso, setSucesso] = useState<any>(null);
  const [simulando, setSimulando] = useState(false);
  const [simulacao, setSimulacao] = useState<ResultadoGravacao | null>(null);
  // Motor de aprendizado (Fase 1): sugestão por descrição normalizada — só sugere, nunca decide sozinho
  const [sugestoes, setSugestoes] = useState<Map<string, SugestaoClassificacao>>(new Map());

  // Possível duplicata cross-módulo: null = sem suspeita nessa linha.
  // decisoesDuplicata: null = pendente (linha fica desmarcada até decidir).
  const [possiveisDuplicatas, setPossiveisDuplicatas] = useState<(PossivelDuplicata | null)[]>([]);
  const [decisoesDuplicata, setDecisoesDuplicata] = useState<("importar" | "pular" | "somar" | null)[]>([]);
  const [verificandoDuplicatas, setVerificandoDuplicatas] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [nomeNovoTemplate, setNomeNovoTemplate] = useState("");
  const [mostrarSalvarTemplate, setMostrarSalvarTemplate] = useState(false);

  // Histórico
  const [historico, setHistorico] = useState<any[]>([]);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [revertendo, setRevertendo] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroDestino, setFiltroDestino] = useState<string>("todos");
  const [loadingHistorico, setLoadingHistorico] = useState(true);

  // Linhas de cada importação (carregadas sob demanda quando expande)
  const [linhasPorImportacao, setLinhasPorImportacao] = useState<Record<string, any[]>>({});
  const [carregandoLinhas, setCarregandoLinhas] = useState<string | null>(null);

  // Fila de exceções + linha do tempo de cada importação (Fase 1, carregadas junto com as linhas)
  const [excecoesPorImportacao, setExcecoesPorImportacao] = useState<Record<string, any[]>>({});
  const [timelinePorImportacao, setTimelinePorImportacao] = useState<Record<string, any[]>>({});
  const [resolvendoExcecao, setResolvendoExcecao] = useState<string | null>(null);

  // Modal de edição de linha
  const [linhaEditando, setLinhaEditando] = useState<any | null>(null);
  const [formEdicao, setFormEdicao] = useState<{ data: string; valor: string; descricao: string; categoria: string }>({
    data: "", valor: "", descricao: "", categoria: "",
  });
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [deletandoLinha, setDeletandoLinha] = useState<string | null>(null);

  // Modal Centro de Compartilhamento + Excluir registro
  const [shareModal, setShareModal] = useState<any | null>(null);
  const [gerandoPdfIndividual, setGerandoPdfIndividual] = useState(false);
  const [excluindoRegistro, setExcluindoRegistro] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState<StatsMes>({
    total_importado: 0, docs_processados: 0, docs_total: 0,
    taxa_sucesso: 0, duplicadas_evitadas: 0, tempo_medio_seg: 0, horas_economizadas: 0,
  });

  // Toast simples
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const empId = await obterEmpresaAtiva();
    setEmpresaId(empId);
    if (empId) {
      carregarEmpresaPorId(empId).then((emp) => setEmpresaCnpj(emp?.cnpj || null));
    }

    await Promise.all([
      empId ? carregarStatsMes(empId).then(setStats) : Promise.resolve(),
      empId ? carregarHistoricoLista(empId) : Promise.resolve(),
      empId ? carregarTemplates(empId).then(setTemplates) : Promise.resolve(),
    ]);
  }

  async function carregarHistoricoLista(empId: string) {
    setLoadingHistorico(true);
    const { data } = await supabase
      .from("importacoes")
      .select("*")
      .eq("empresa_id", empId)
      .order("created_at", { ascending: false })
      .limit(50);
    setHistorico(data || []);
    setLoadingHistorico(false);
  }

  // =========================================================================
  // FLUXO DE UPLOAD
  // =========================================================================

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setArrastando(true); }
  function onDragLeave() { setArrastando(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setArrastando(false);
    const file = e.dataTransfer.files[0];
    if (file) processarArquivo(file);
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  }

  async function processarArquivo(file: File) {
    if (!userId || !empresaId) return;
    setArquivoSelecionado(file);
    setResultado(null);
    setSucesso(null);
    setDuplicataGlobal(null);

    try {
      // 1) Hash + check duplicata global
      setEtapa("hash");
      const hash = await hashArquivo(file);
      setHashFile(hash);

      const dup = await buscarImportacaoPorHash(empresaId, hash);
      if (dup) {
        setDuplicataGlobal(dup);
        setEtapa("");
        return;
      }

      // 2) Parse
      await processarParse(file);
    } catch (err: any) {
      showToast(err.message || "Erro ao processar", "erro");
      setEtapa("");
    }
  }

  async function processarParse(file: File) {
    if (!userId || !empresaId) return;
    setEtapa("parse");
    const res = await parseArquivo(file, empresaCnpj || undefined, langAtual);

    setResultado(res);
    setLinhas(res.linhas);
    setSelecionadas(res.linhas.map((l) => Boolean(l.data && l.valor !== undefined)));
    const destinosIniciais = res.linhas.map((l) => l.destinoSugerido || res.destinoSugerido);
    setDestinos(destinosIniciais);
    setMapeamento(res.mapeamentoAuto || {});
    setSugestoes(new Map());

    // 3) Dedup por linha (hash idêntico — camada de baixo)
    setEtapa("dedup");
    const dups = await marcarDuplicatasPorLinha(empresaId, res.linhas, destinosIniciais);
    setDuplicadas(dups);
    // Linhas duplicadas começam desmarcadas
    setSelecionadas((prev) => prev.map((s, i) => s && !dups[i]));
    setEtapa("");

    // 3b) Possível duplicata cross-módulo (camada A MAIS — "parece repetido,
    // confirme"): compara contra os registros reais de 6 tabelas, não só o
    // hash de importações passadas. Linha suspeita nasce desmarcada até o
    // usuário decidir — nada grava sozinho.
    setPossiveisDuplicatas(res.linhas.map(() => null));
    setDecisoesDuplicata(res.linhas.map(() => null));
    if (empresaId) {
      setVerificandoDuplicatas(true);
      detectarPossiveisDuplicatas(empresaId, res.linhas).then((possiveis) => {
        setPossiveisDuplicatas(possiveis);
        setDecisoesDuplicata(possiveis.map(() => null));
        setSelecionadas((prev) => prev.map((s, i) => (possiveis[i] ? false : s)));
        setVerificandoDuplicatas(false);
      });
    }

    // 4) Motor de aprendizado: sugere categoria/destino com base em importações
    // anteriores parecidas — só sugere, nunca preenche sozinho.
    if (empresaId) {
      sugerirClassificacoes(empresaId, res.linhas.map((l) => l.descricao || "")).then(setSugestoes);
    }
  }

  function continuarMesmoComDuplicata() {
    if (arquivoSelecionado) {
      setDuplicataGlobal(null);
      processarParse(arquivoSelecionado);
    }
  }

  function cancelarUpload() {
    setArquivoSelecionado(null);
    setResultado(null);
    setLinhas([]);
    setSelecionadas([]);
    setDuplicadas([]);
    setHashFile("");
    setDuplicataGlobal(null);
    setEtapa("");
    setSucesso(null);
    setSimulacao(null);
    setSugestoes(new Map());
    setPossiveisDuplicatas([]);
    setDecisoesDuplicata([]);
    setMostrarSalvarTemplate(false);
    setNomeNovoTemplate("");
    if (inputRef.current) inputRef.current.value = "";
  }

  // =========================================================================
  // PREVIEW: edição inline e seleção
  // =========================================================================

  function toggleLinha(i: number) {
    setSelecionadas((prev) => prev.map((s, idx) => (idx === i ? !s : s)));
  }

  function selecionarTodas(v: boolean) {
    setSelecionadas(linhas.map(() => v));
  }

  // Override do destino sugerido — o usuário decide, a sugestão nunca é
  // definitiva. "apenasSelecionadas" reaproveita as checkboxes de importação
  // que o usuário já está usando pra marcar quais linhas quer mexer.
  function mudarDestinoLinha(i: number, novoDestino: DestinoTabela) {
    setDestinos((prev) => prev.map((d, idx) => (idx === i ? novoDestino : d)));
  }

  function aplicarDestinoEmMassa(novoDestino: DestinoTabela, apenasSelecionadas: boolean) {
    setDestinos((prev) => prev.map((d, i) => (!apenasSelecionadas || selecionadas[i] ? novoDestino : d)));
  }

  // Decisão do usuário sobre 1 linha com possível duplicata — nada grava
  // sozinho, isso só resolve a pendência que libera (ou não) a linha.
  function resolverDuplicata(i: number, decisao: "importar" | "pular" | "somar") {
    setDecisoesDuplicata((prev) => prev.map((d, idx) => (idx === i ? decisao : d)));
    setSelecionadas((prev) => prev.map((s, idx) => (idx === i ? decisao !== "pular" : s)));
  }

  function resolverDuplicataEmMassa(decisao: "importar" | "pular" | "somar") {
    setDecisoesDuplicata((prev) => prev.map((d, i) => (possiveisDuplicatas[i] && d === null ? decisao : d)));
    setSelecionadas((prev) => prev.map((s, i) => (possiveisDuplicatas[i] && decisoesDuplicata[i] === null ? decisao !== "pular" : s)));
  }

  function editarLinha(i: number, campo: "data" | "valor" | "descricao" | "categoria", valor: any) {
    const novas = [...linhas];
    if (campo === "valor") novas[i] = { ...novas[i], valor: parseFloat(valor) || 0 };
    else novas[i] = { ...novas[i], [campo]: valor };
    setLinhas(novas);
  }

  async function aplicarMapeamento(novoMap: MapeamentoColunas) {
    if (!arquivoSelecionado || !resultado) return;
    setMapeamento(novoMap);

    // Re-parseia com o novo mapeamento
    setEtapa("parse");
    try {
      const ext = arquivoSelecionado.name.toLowerCase().split(".").pop();
      let novoResult: ResultadoParse;
      if (ext === "csv" || ext === "tsv" || ext === "txt") {
        const { parseCSV } = await import("../../../lib/importarParsers");
        const texto = await arquivoSelecionado.text();
        novoResult = await parseCSV(texto, novoMap, undefined, arquivoSelecionado.name, langAtual);
      } else if (ext === "xlsx" || ext === "xls" || ext === "ods") {
        const { parseXLSX } = await import("../../../lib/importarParsers");
        const buffer = await arquivoSelecionado.arrayBuffer();
        novoResult = await parseXLSX(buffer, novoMap, ext === "xls" ? "xls" : "xlsx", arquivoSelecionado.name, langAtual);
      } else {
        setEtapa("");
        return;
      }
      setResultado(novoResult);
      setLinhas(novoResult.linhas);
      setSelecionadas(novoResult.linhas.map((l) => Boolean(l.data && l.valor !== undefined)));
      const novosDestinos = novoResult.linhas.map((l) => l.destinoSugerido || novoResult.destinoSugerido);
      setDestinos(novosDestinos);
      setPossiveisDuplicatas(novoResult.linhas.map(() => null));
      setDecisoesDuplicata(novoResult.linhas.map(() => null));
      if (empresaId) {
        const dups = await marcarDuplicatasPorLinha(empresaId, novoResult.linhas, novosDestinos);
        setDuplicadas(dups);
        setSelecionadas((prev) => prev.map((s, i) => s && !dups[i]));
      }
      if (empresaId) {
        setVerificandoDuplicatas(true);
        detectarPossiveisDuplicatas(empresaId, novoResult.linhas).then((possiveis) => {
          setPossiveisDuplicatas(possiveis);
          setDecisoesDuplicata(possiveis.map(() => null));
          setSelecionadas((prev) => prev.map((s, i) => (possiveis[i] ? false : s)));
          setVerificandoDuplicatas(false);
        });
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao remapear", "erro");
    }
    setEtapa("");
  }

  // Template define um destino padrão pra TODAS as linhas — o usuário ainda
  // pode trocar linha a linha depois via o dropdown de override. Espera o
  // re-parse terminar antes de aplicar, senão a sugestão automática
  // sobrescreveria o padrão do template.
  async function aplicarTemplate(template: any) {
    if (template?.mapeamento) {
      await aplicarMapeamento(template.mapeamento);
      if (template.destino_padrao) {
        setDestinos((prev) => prev.map(() => template.destino_padrao as DestinoTabela));
      }
    }
  }

  async function salvarComoTemplate() {
    if (!userId || !empresaId || !nomeNovoTemplate.trim() || !arquivoSelecionado) return;
    try {
      const ext = arquivoSelecionado.name.toLowerCase().split(".").pop() || "csv";
      const { erro } = await salvarTemplate({
        userId,
        empresaId,
        nome: nomeNovoTemplate.trim(),
        tipoArquivo: ext,
        destinoPadrao: destinoPredominante(destinos),
        mapeamento,
      });
      if (erro) { showToast(erro, "erro"); return; }
      setNomeNovoTemplate("");
      setMostrarSalvarTemplate(false);
      const novos = await carregarTemplates(empresaId);
      setTemplates(novos);
      showToast("Template salvo!", "ok");
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar template", "erro");
    }
  }

  // =========================================================================
  // CONFIRMAR IMPORTAÇÃO
  // =========================================================================

  // Simulador: MESMO caminho de confirmarImportacao (mesmos builders, mesma
  // validação de linha), só que com dryRun=true — sem upload, sem cabeçalho,
  // sem gravar nada real. É por isso que não existe uma função de simulação
  // paralela: se um dia o caminho real mudar, o simulador muda junto.
  function montarSomarAlvo() {
    return linhas.map((_, i) => {
      const pd = possiveisDuplicatas[i];
      return decisoesDuplicata[i] === "somar" && pd ? { tabela: pd.candidato.tabela, id: pd.candidato.id } : null;
    });
  }

  async function simularImportacao() {
    if (!userId || !resultado) return;
    if (pendentesDuplicata > 0) {
      showToast(tt.duplicataPendente, "erro");
      return;
    }
    const totalSel = selecionadas.filter((s, i) => s && !duplicadas[i]).length;
    if (totalSel === 0) {
      showToast(tt.nenhumaSelecionada, "erro");
      return;
    }
    setSimulando(true);
    setSimulacao(null);
    try {
      const result = await gravarLinhas({
        userId,
        empresaId,
        importacaoId: "simulacao",
        linhas,
        selecionadas,
        duplicadas,
        destinos,
        dryRun: true,
        somarAlvo: montarSomarAlvo(),
      });
      setSimulacao(result);
    } catch (err: any) {
      showToast(err.message || "Erro ao simular", "erro");
    }
    setSimulando(false);
  }

  async function confirmarImportacao() {
    if (!userId || !arquivoSelecionado || !resultado) return;
    if (pendentesDuplicata > 0) {
      showToast(tt.duplicataPendente, "erro");
      return;
    }
    const totalSel = selecionadas.filter((s, i) => s && !duplicadas[i]).length;
    if (totalSel === 0) {
      showToast(tt.nenhumaSelecionada, "erro");
      return;
    }

    setConfirmando(true);
    const tInicio = Date.now();

    try {
      // 1) Upload pro Storage
      setEtapa("upload");
      const storagePath = await uploadArquivo(arquivoSelecionado, userId, hashFile);

      // 2) Cria cabeçalho
      const importacaoId = await criarImportacao({
        userId,
        empresaId,
        nomeArquivo: arquivoSelecionado.name,
        hash: hashFile,
        storagePath,
        tipoArquivo: resultado.formato,
        mimeType: arquivoSelecionado.type || "application/octet-stream",
        tamanhoBytes: arquivoSelecionado.size,
        tipoDocumento: destinoLabel(tt, destinoPredominante(destinos)),
        destino: destinoPredominante(destinos),
        totalLinhas: linhas.length,
        mapeamentoUsado: mapeamento,
      });

      // 2b) Layout da Reforma Tributária incoerente (CFOP/CST/NCM/IBS-CBS) →
      // abre exceção pra revisão, não bloqueia a importação em si.
      await abrirExcecaoFormatoReforma({ empresaId, userId, importacaoId, resultado });

      // 3) Grava linhas
      const result = await gravarLinhas({
        userId,
        empresaId,
        importacaoId,
        linhas,
        selecionadas,
        duplicadas,
        destinos,
        somarAlvo: montarSomarAlvo(),
      });

      // 4) Atualiza tempo de processamento — métrica não-crítica (a importação em si já
      // foi gravada por gravarLinhas() acima); só reporta pro Sentry, sem toast, pra não
      // confundir o usuário com um erro numa gravação que na prática já deu certo.
      const { data: dataTempo, error: erroTempo } = await supabase
        .from("importacoes")
        .update({ tempo_processamento_ms: Date.now() - tInicio })
        .eq("id", importacaoId)
        .select("id");
      if (erroTempo || !dataTempo || dataTempo.length === 0) {
        Sentry.captureException(new Error(`Falha ao atualizar importacoes: ${erroTempo?.message || "0 linhas afetadas (RLS?)"}`), { extra: { tabela: "importacoes", operacao: "update tempo_processamento_ms", importacaoId } });
      }

      setSucesso({ ...result, importacaoId });
      setSimulacao(null);
      setEtapa("");

      // Refresh
      await Promise.all([
        (empresaId ? carregarStatsMes(empresaId).then(setStats) : Promise.resolve()),
        (empresaId ? carregarHistoricoLista(empresaId) : Promise.resolve()),
      ]);
    } catch (err: any) {
      showToast(err.message || "Erro ao confirmar", "erro");
      setEtapa("");
    }
    setConfirmando(false);
  }

  // =========================================================================
  // HISTÓRICO: desfazer, baixar, compartilhar, expandir, editar, deletar
  // =========================================================================

  async function expandirImportacao(id: string) {
    if (expandida === id) {
      setExpandida(null);
      return;
    }
    setExpandida(id);
    if (!linhasPorImportacao[id] && userId && empresaId) {
      setCarregandoLinhas(id);
      try {
        const [lns, excs, tml] = await Promise.all([
          listarLinhasImportacao(id, empresaId),
          listarExcecoes(id, empresaId),
          listarTimeline(id, empresaId),
        ]);
        setLinhasPorImportacao((prev) => ({ ...prev, [id]: lns }));
        setExcecoesPorImportacao((prev) => ({ ...prev, [id]: excs }));
        setTimelinePorImportacao((prev) => ({ ...prev, [id]: tml }));
      } catch (err: any) {
        showToast(err.message || "Erro ao carregar linhas", "erro");
      }
      setCarregandoLinhas(null);
    }
  }

  async function resolverExcecaoUI(excecaoId: string, importacaoId: string) {
    if (!empresaId) return;
    setResolvendoExcecao(excecaoId);
    try {
      const r = await resolverExcecao(excecaoId, empresaId, `Resolvida em ${new Date().toLocaleString("pt-BR")}`);
      if (r.erro) {
        showToast(r.erro, "erro");
      } else {
        const excs = await listarExcecoes(importacaoId, empresaId);
        setExcecoesPorImportacao((prev) => ({ ...prev, [importacaoId]: excs }));
        showToast(tt.excecaoResolvida, "ok");
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao resolver", "erro");
    }
    setResolvendoExcecao(null);
  }

  function abrirEdicao(linha: any) {
    setLinhaEditando(linha);
    setFormEdicao({
      data: linha.data_lancamento || "",
      valor: String(linha.valor || ""),
      descricao: linha.descricao || "",
      categoria: linha.categoria || "",
    });
  }

  function fecharEdicao() {
    setLinhaEditando(null);
    setFormEdicao({ data: "", valor: "", descricao: "", categoria: "" });
  }

  async function salvarEdicao() {
    if (!linhaEditando || !userId || !empresaId) return;
    setSalvandoEdicao(true);
    try {
      const valorNum = parseFloat(formEdicao.valor.replace(",", "."));
      if (isNaN(valorNum)) {
        showToast("Valor inválido", "erro");
        setSalvandoEdicao(false);
        return;
      }
      const r = await editarLinhaImportada(linhaEditando.id, userId, empresaId, {
        data: formEdicao.data || undefined,
        valor: valorNum,
        descricao: formEdicao.descricao || undefined,
        categoria: formEdicao.categoria || undefined,
      });
      if (r.erro) {
        showToast(r.erro, "erro");
      } else {
        showToast(r.avisoTrilha ? tt.editadoComAvisoTrilha : "Linha atualizada", r.avisoTrilha ? "erro" : "ok");
        // Recarrega as linhas dessa importação + histórico + stats
        const impId = linhaEditando.importacao_id;
        const lns = await listarLinhasImportacao(impId, empresaId);
        setLinhasPorImportacao((prev) => ({ ...prev, [impId]: lns }));
        await Promise.all([
          (empresaId ? carregarStatsMes(empresaId).then(setStats) : Promise.resolve()),
          (empresaId ? carregarHistoricoLista(empresaId) : Promise.resolve()),
        ]);
        fecharEdicao();
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao salvar", "erro");
    }
    setSalvandoEdicao(false);
  }

  async function deletarLinha(linha: any) {
    if (!userId || !empresaId) return;
    if (!window.confirm("Tem certeza? Esta linha será removida do destino.")) return;
    setDeletandoLinha(linha.id);
    try {
      const r = await deletarLinhaImportada(linha.id, userId, empresaId);
      if (r.erro) {
        showToast(r.erro, "erro");
      } else {
        showToast(r.avisoTrilha ? tt.editadoComAvisoTrilha : "Linha removida", r.avisoTrilha ? "erro" : "ok");
        const impId = linha.importacao_id;
        const lns = await listarLinhasImportacao(impId, empresaId);
        setLinhasPorImportacao((prev) => ({ ...prev, [impId]: lns }));
        await Promise.all([
          (empresaId ? carregarStatsMes(empresaId).then(setStats) : Promise.resolve()),
          (empresaId ? carregarHistoricoLista(empresaId) : Promise.resolve()),
        ]);
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao deletar", "erro");
    }
    setDeletandoLinha(null);
  }

  async function desfazerImportacao(id: string) {
    if (!userId || !empresaId) return;
    if (!window.confirm(tt.desfazerConfirma)) return;
    setRevertendo(id);
    try {
      const r = await reverterImportacao(id, userId, empresaId);
      if (r.erros.length > 0) {
        showToast(`${tt.desfeitoComFalhas} (${r.removidas} ${tt.importadas})`, "erro");
      } else {
        showToast(`${tt.desfeito} (${r.removidas} ${tt.importadas})`, "ok");
      }
      await Promise.all([
        (empresaId ? carregarStatsMes(empresaId).then(setStats) : Promise.resolve()),
        (empresaId ? carregarHistoricoLista(empresaId) : Promise.resolve()),
      ]);
    } catch (err: any) {
      showToast(err.message || "Erro ao desfazer", "erro");
    }
    setRevertendo(null);
  }

  // ========== CENTRO DE COMPARTILHAMENTO ===================================

  function montarTextoResumo(item: any, formato: "curto" | "longo" = "longo"): string {
    const dest = destinoLabel(tt, item.destino);
    const stInfo = statusLabel(tt, item.status);

    if (formato === "curto") {
      return [
        `🦅 *Axioma AI.Tech*`,
        `📄 ${item.nome_arquivo}`,
        `✅ ${item.linhas_importadas || 0} ${tt.importadas} • 💰 ${formatBRL(Number(item.valor_total_importado) || 0)}`,
        `🎯 ${dest}`,
      ].join("\n");
    }

    return [
      `🦅 *AXIOMA AI.TECH — ${tt.compartilharTitulo}*`,
      ``,
      `📄 ${tt.arquivoLabel}: *${item.nome_arquivo}*`,
      `📅 ${tt.data}: ${formatDataHora(item.created_at)}`,
      `🎯 ${tt.destino}: *${dest}*`,
      `📊 ${tt.filtroStatus}: ${stInfo}`,
      ``,
      `*${tt.resultadoLabel}:*`,
      `✅ ${item.linhas_importadas || 0} ${tt.importadas}`,
      `⚠️ ${item.linhas_duplicadas || 0} ${tt.duplicadas}`,
      `❌ ${item.linhas_erro || 0} ${tt.erros}`,
      ``,
      `💰 *${tt.valorTotal}:* ${formatBRL(Number(item.valor_total_importado) || 0)}`,
      ``,
      `_Gerado por axiomaai.com.br_`,
    ].join("\n");
  }

  function abrirShareModal(item: any) {
    setShareModal(item);
  }

  function fecharShareModal() {
    setShareModal(null);
  }

  function shareWhatsApp() {
    if (!shareModal) return;
    const texto = encodeURIComponent(montarTextoResumo(shareModal, "longo"));
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }

  function shareTelegram() {
    if (!shareModal) return;
    const texto = encodeURIComponent(montarTextoResumo(shareModal, "longo"));
    const titulo = encodeURIComponent(`Axioma - ${shareModal.nome_arquivo}`);
    window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${texto}`, "_blank");
  }

  function shareGmail() {
    if (!shareModal) return;
    const assunto = encodeURIComponent(`Axioma - ${shareModal.nome_arquivo}`);
    const corpo = encodeURIComponent(montarTextoResumo(shareModal, "longo").replace(/\*/g, ""));
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${assunto}&body=${corpo}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function shareOutlook() {
    if (!shareModal) return;
    const assunto = encodeURIComponent(`Axioma - ${shareModal.nome_arquivo}`);
    const corpo = encodeURIComponent(montarTextoResumo(shareModal, "longo").replace(/\*/g, ""));
    window.open(
      `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${assunto}&body=${corpo}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function shareCopiarTexto() {
    if (!shareModal) return;
    try {
      await navigator.clipboard.writeText(montarTextoResumo(shareModal, "longo").replace(/\*/g, ""));
      showToast(tt.arquivoCopiado, "ok");
    } catch {
      showToast("Erro ao copiar", "erro");
    }
  }

  async function shareCopiarLinkArquivo() {
    if (!shareModal || !shareModal.storage_path) {
      showToast("Arquivo original nao disponivel", "erro");
      return;
    }
    const url = await gerarUrlAssinada(shareModal.storage_path, 86400); // 24h
    if (!url) {
      showToast("Erro ao gerar link seguro", "erro");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link seguro copiado (valido por 24h)", "ok");
    } catch {
      window.prompt("Link seguro (valido por 24h):", url);
    }
  }

  async function shareBaixarPdfIndividual() {
    if (!shareModal || !userId || !empresaId) return;
    setGerandoPdfIndividual(true);
    try {
      // Carrega as linhas dessa importação (com cache)
      let lns = linhasPorImportacao[shareModal.id];
      if (!lns) {
        lns = await listarLinhasImportacao(shareModal.id, empresaId);
        setLinhasPorImportacao((prev) => ({ ...prev, [shareModal.id]: lns }));
      }

      const dest = destinoLabel(tt, shareModal.destino);
      const stInfo = statusLabel(tt, shareModal.status);

      const colunas = [
        { header: "#", key: "num", width: 12, align: "left" as const },
        { header: tt.data.toUpperCase(), key: "data", width: 22, align: "left" as const },
        { header: tt.descricao.toUpperCase(), key: "desc", width: 70, align: "left" as const },
        { header: tt.categoria.toUpperCase(), key: "cat", width: 30, align: "left" as const },
        { header: tt.filtroStatus.toUpperCase(), key: "st", width: 22, align: "left" as const },
        { header: tt.valor.toUpperCase(), key: "valor", width: 28, align: "right" as const },
      ];

      const linhasPdf = (lns || []).map((l: any) => ({
        num: String(l.linha_numero || ""),
        data: l.data_lancamento ? new Date(l.data_lancamento).toLocaleDateString("pt-BR") : "—",
        desc: l.descricao || "—",
        cat: l.categoria || "—",
        st: l.status || "—",
        valor: formatBRL(Number(l.valor) || 0),
      }));

      const resumo = [
        { label: tt.arquivoLabel, valor: shareModal.nome_arquivo },
        { label: tt.dataImportacaoLabel, valor: formatDataHora(shareModal.created_at) },
        { label: tt.destino, valor: dest },
        { label: tt.filtroStatus, valor: stInfo },
        { label: tt.importadas, valor: String(shareModal.linhas_importadas || 0) },
        { label: tt.duplicadas, valor: String(shareModal.linhas_duplicadas || 0) },
        { label: tt.erros, valor: String(shareModal.linhas_erro || 0) },
        { label: tt.valorTotal, valor: formatBRL(Number(shareModal.valor_total_importado) || 0) },
      ];

      await gerarPdfTabela({
        titulo: `Importação - ${shareModal.nome_arquivo}`,
        subtitulo: `${formatDataHora(shareModal.created_at)} • ${dest}`,
        colunas,
        linhas: linhasPdf,
        resumo,
        nomeArquivo: `axioma-importacao-${shareModal.nome_arquivo.replace(/\.[^.]+$/, "")}-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      showToast("PDF gerado", "ok");
    } catch (err: any) {
      showToast(err.message || "Erro ao gerar PDF", "erro");
    }
    setGerandoPdfIndividual(false);
  }

  // ========== EXCLUIR REGISTRO (só erro/revertido) ==========================

  async function excluirRegistro(item: any) {
    if (!userId || !empresaId) return;
    if (!window.confirm(`Tem certeza que deseja excluir o registro de "${item.nome_arquivo}"?\n\nIsso remove APENAS o histórico desta importação (status: ${item.status}). Nenhum lançamento será afetado.`)) {
      return;
    }
    setExcluindoRegistro(item.id);
    try {
      const r = await excluirRegistroImportacao(item.id, userId, empresaId);
      if (r.erro) {
        showToast(r.erro, "erro");
      } else {
        showToast("Registro removido do historico", "ok");
        await Promise.all([
          (empresaId ? carregarStatsMes(empresaId).then(setStats) : Promise.resolve()),
          (empresaId ? carregarHistoricoLista(empresaId) : Promise.resolve()),
        ]);
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao excluir", "erro");
    }
    setExcluindoRegistro(null);
  }

  // ========== AÇÕES LEGADAS ================================================

  async function baixarOriginal(item: any) {
    if (!item.storage_path) {
      showToast("Arquivo original nao disponivel", "erro");
      return;
    }
    const url = await gerarUrlAssinada(item.storage_path);
    if (url) window.open(url, "_blank");
    else showToast("Erro ao gerar link", "erro");
  }

  // Função antiga renomeada — agora abre o modal Centro de Compartilhamento
  function compartilharImportacao(item: any) {
    abrirShareModal(item);
  }

  // =========================================================================
  // PDF GERENCIAL
  // =========================================================================

  async function exportarPDF() {
    setExportando(true);
    try {
      const colunas = [
        { header: tt.data.toUpperCase(), key: "data", width: 22, align: "left" as const },
        { header: tt.arquivoLabel.toUpperCase(), key: "arquivo", width: 60, align: "left" as const },
        { header: tt.destino.toUpperCase(), key: "destino", width: 35, align: "left" as const },
        { header: tt.filtroStatus.toUpperCase(), key: "status", width: 25, align: "left" as const },
        { header: tt.importadas.toUpperCase(), key: "importadas", width: 20, align: "right" as const },
        { header: tt.valorTotal.toUpperCase(), key: "valor", width: 28, align: "right" as const },
      ];

      const linhasPdf = historico.map((h: any) => ({
        data: formatData(h.created_at),
        arquivo: h.nome_arquivo || "—",
        destino: h.destino ? destinoLabel(tt, h.destino) : "—",
        status: statusLabel(tt, h.status),
        importadas: String(h.linhas_importadas || 0),
        valor: formatBRL(Number(h.valor_total_importado) || 0),
      }));

      const resumo = [
        { label: tt.totalImportado, valor: formatBRL(stats.total_importado) },
        { label: tt.docsProcessados, valor: `${stats.docs_processados} / ${stats.docs_total}` },
        { label: tt.taxaSucesso, valor: `${stats.taxa_sucesso}%` },
        { label: tt.duplicadasEvitadas, valor: String(stats.duplicadas_evitadas) },
        { label: tt.horasEconomizadas, valor: `${stats.horas_economizadas}h` },
      ];

      await gerarPdfTabela({
        titulo: `Importações - ${tt.dashboard}`,
        subtitulo: new Date().toLocaleDateString("pt-BR"),
        colunas,
        linhas: linhasPdf,
        resumo,
        nomeArquivo: `axioma-importacoes-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err: any) {
      showToast(err.message || "Erro ao gerar PDF", "erro");
    }
    setExportando(false);
  }

  // =========================================================================
  // FILTROS DO HISTÓRICO
  // =========================================================================

  const historicoFiltrado = historico.filter((h: any) => {
    if (filtroStatus !== "todos" && h.status !== filtroStatus) return false;
    if (filtroDestino !== "todos" && h.destino !== filtroDestino) return false;
    return true;
  });

  // =========================================================================
  // CONTADORES DO PREVIEW
  // =========================================================================

  const totalSelecionadas = selecionadas.filter((s, i) => s && !duplicadas[i]).length;
  const totalDuplicadas = duplicadas.filter(Boolean).length;
  const pendentesDuplicata = possiveisDuplicatas.filter((p, i) => p && decisoesDuplicata[i] === null).length;
  const valorTotalPreview = linhas.reduce(
    (sum, l, i) => (selecionadas[i] && !duplicadas[i] ? sum + (l.valor || 0) : sum),
    0
  );

  return (
    <ModuloLayout
      titulo={`📄 ${imp?.titulo || "Importar Documentos"}`}
      subtitulo={imp?.subtitulo || "Central de importação inteligente — OFX, NF-e, CSV, XLSX"}
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)",
            color: "#020810", fontWeight: 600, fontSize: 13,
          }}>
          {toast.msg}
        </div>
      )}

      {/* ABAS */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: "visao", label: `📊 ${tt.visaoGeral}` },
          { key: "historico", label: `🕓 ${tt.historico} (${historico.length})` },
        ].map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: aba === a.key ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.6)",
              color: aba === a.key ? "#fff" : "#6ab0ff",
              border: aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>

      {aba === "visao" && (
        <div className="space-y-5">
          {/* DASHBOARD CFO */}
          <CanvasBox cor="#6ab0ff">
            <p className="text-xs font-semibold mb-4 tracking-wider uppercase" style={{ color: "#5a7a9a" }}>
              📊 {tt.dashboard}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: tt.totalImportado, valor: formatBRL(stats.total_importado), cor: "#34d399", icon: "💰" },
                { label: tt.docsProcessados, valor: `${stats.docs_processados}/${stats.docs_total}`, cor: "#6ab0ff", icon: "📄" },
                { label: tt.taxaSucesso, valor: `${stats.taxa_sucesso}%`, cor: "#a78bfa", icon: "🎯" },
                { label: tt.duplicadasEvitadas, valor: String(stats.duplicadas_evitadas), cor: "#fbbf24", icon: "🛡️" },
                { label: tt.tempoMedio, valor: `${stats.tempo_medio_seg}s`, cor: "#fb923c", icon: "⏱️" },
                { label: tt.horasEconomizadas, valor: `${stats.horas_economizadas}h`, cor: "#10b981", icon: "⚡" },
              ].map((card, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.6)", border: `1px solid ${card.cor}30` }}>
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#5a7a9a" }}>{card.label}</span>
                    <span className="text-base">{card.icon}</span>
                  </div>
                  <p className="text-base md:text-lg font-bold truncate" style={{ color: card.cor }}>{card.valor}</p>
                </div>
              ))}
            </div>
          </CanvasBox>

          {/* DUPLICATA GLOBAL DETECTADA */}
          {duplicataGlobal && (
            <CanvasBox cor="#fbbf24">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-base mb-1" style={{ color: "#fbbf24" }}>{tt.duplicataGlobal}</p>
                    <p className="text-sm" style={{ color: "#c8d8f0" }}>
                      {tt.duplicataGlobalMsg} <strong>{formatDataHora(duplicataGlobal.created_at)}</strong>
                      {duplicataGlobal.linhas_importadas > 0 && ` (${duplicataGlobal.linhas_importadas} ${tt.importadas})`}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{duplicataGlobal.nome_arquivo}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button onClick={cancelarUpload}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                    {tt.cancelar}
                  </button>
                  <button onClick={continuarMesmoComDuplicata}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>
                    {tt.importarAssim}
                  </button>
                </div>
              </div>
            </CanvasBox>
          )}

          {/* DROP ZONE */}
          {!arquivoSelecionado && !sucesso && !duplicataGlobal && (
            <CanvasBox cor={arrastando ? "#6ab0ff" : "#3b6fd4"}>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="text-center cursor-pointer py-8 sm:py-12 rounded-xl transition-all"
                style={{
                  background: arrastando ? "rgba(106,176,255,0.08)" : "transparent",
                  border: `2px dashed ${arrastando ? "#6ab0ff" : "rgba(106,176,255,0.25)"}`,
                }}
              >
                <div className="text-5xl sm:text-6xl mb-4">📥</div>
                <p className="text-base sm:text-lg font-semibold mb-1" style={{ color: "#c8d8f0" }}>{tt.arrasteAqui}</p>
                <p className="text-xs sm:text-sm mb-4" style={{ color: "#5a7a9a" }}>{tt.ouClique}</p>
                <span className="inline-block px-3 py-1.5 rounded-full text-[11px]" style={{ background: "rgba(59,111,212,0.15)", color: "#6ab0ff" }}>
                  {tt.formatosSuportados}
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.xml,.xlsx,.xls,.csv,.tsv,.txt,.ofx,.qfx,.ods"
                  className="hidden"
                  onChange={onFileChange}
                />
              </div>
            </CanvasBox>
          )}

          {/* PROCESSANDO */}
          {etapa && !duplicataGlobal && (
            <CanvasBox cor="#6ab0ff">
              <div className="text-center py-6">
                <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-semibold text-sm" style={{ color: "#6ab0ff" }}>
                  {etapa === "hash" && tt.calcHash}
                  {etapa === "parse" && tt.parseando}
                  {etapa === "upload" && tt.uploadStorage}
                  {etapa === "dedup" && tt.dedup}
                </p>
                {arquivoSelecionado && (
                  <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{arquivoSelecionado.name}</p>
                )}
              </div>
            </CanvasBox>
          )}

          {/* PREVIEW */}
          {resultado && !sucesso && !etapa && (
            <PreviewBlock
              tt={tt}
              imp={imp}
              resultado={resultado}
              linhas={linhas}
              selecionadas={selecionadas}
              duplicadas={duplicadas}
              destinos={destinos}
              setDestinos={setDestinos}
              mudarDestinoLinha={mudarDestinoLinha}
              aplicarDestinoEmMassa={aplicarDestinoEmMassa}
              templates={templates}
              mapeamento={mapeamento}
              aplicarMapeamento={aplicarMapeamento}
              aplicarTemplate={aplicarTemplate}
              toggleLinha={toggleLinha}
              selecionarTodas={selecionarTodas}
              editarLinha={editarLinha}
              cancelarUpload={cancelarUpload}
              confirmarImportacao={confirmarImportacao}
              confirmando={confirmando}
              simularImportacao={simularImportacao}
              simulando={simulando}
              simulacao={simulacao}
              sugestoes={sugestoes}
              possiveisDuplicatas={possiveisDuplicatas}
              decisoesDuplicata={decisoesDuplicata}
              resolverDuplicata={resolverDuplicata}
              resolverDuplicataEmMassa={resolverDuplicataEmMassa}
              pendentesDuplicata={pendentesDuplicata}
              verificandoDuplicatas={verificandoDuplicatas}
              totalSelecionadas={totalSelecionadas}
              totalDuplicadas={totalDuplicadas}
              valorTotalPreview={valorTotalPreview}
              mostrarSalvarTemplate={mostrarSalvarTemplate}
              setMostrarSalvarTemplate={setMostrarSalvarTemplate}
              nomeNovoTemplate={nomeNovoTemplate}
              setNomeNovoTemplate={setNomeNovoTemplate}
              salvarComoTemplate={salvarComoTemplate}
            />
          )}

          {/* SUCESSO */}
          {sucesso && (
            <CanvasBox cor="#34d399">
              <div className="text-center py-6 space-y-4">
                <div className="text-5xl">✅</div>
                <p className="text-lg font-bold" style={{ color: "#34d399" }}>{tt.sucessoImport}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                  {[
                    { label: tt.importadas, valor: sucesso.importadas, cor: "#34d399" },
                    { label: tt.duplicadas, valor: sucesso.duplicadas, cor: "#fbbf24" },
                    { label: tt.ignoradas, valor: sucesso.ignoradas, cor: "#5a7a9a" },
                    { label: tt.erros, valor: sucesso.erro, cor: "#f87171" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.6)", border: `1px solid ${s.cor}30` }}>
                      <p className="text-xl font-bold" style={{ color: s.cor }}>{s.valor}</p>
                      <p className="text-xs" style={{ color: "#5a7a9a" }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {sucesso.valor_total > 0 && (
                  <p className="text-sm" style={{ color: "#c8d8f0" }}>
                    {tt.valorTotal}: <strong style={{ color: "#34d399" }}>{formatBRL(sucesso.valor_total)}</strong>
                  </p>
                )}
                <button onClick={cancelarUpload}
                  className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {tt.novoImporte}
                </button>
              </div>
            </CanvasBox>
          )}
        </div>
      )}

      {aba === "historico" && (
        <HistoricoBlock
          tt={tt}
          historico={historicoFiltrado}
          loadingHistorico={loadingHistorico}
          expandida={expandida}
          expandirImportacao={expandirImportacao}
          revertendo={revertendo}
          desfazerImportacao={desfazerImportacao}
          baixarOriginal={baixarOriginal}
          compartilharImportacao={compartilharImportacao}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          filtroDestino={filtroDestino}
          setFiltroDestino={setFiltroDestino}
          linhasPorImportacao={linhasPorImportacao}
          carregandoLinhas={carregandoLinhas}
          abrirEdicao={abrirEdicao}
          deletarLinha={deletarLinha}
          deletandoLinha={deletandoLinha}
          excluirRegistro={excluirRegistro}
          excluindoRegistro={excluindoRegistro}
          excecoesPorImportacao={excecoesPorImportacao}
          timelinePorImportacao={timelinePorImportacao}
          resolverExcecaoUI={resolverExcecaoUI}
          resolvendoExcecao={resolvendoExcecao}
        />
      )}

      {/* MODAL DE EDIÇÃO DE LINHA */}
      {linhaEditando && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={fecharEdicao}
        >
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#5a7a9a" }}>✏️ Editar Lançamento</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#c8d8f0" }}>Linha #{linhaEditando.linha_numero}</p>
              </div>
              <button onClick={fecharEdicao} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Data</label>
                <input
                  type="date"
                  value={formEdicao.data}
                  onChange={(e) => setFormEdicao({ ...formEdicao, data: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formEdicao.valor}
                  onChange={(e) => setFormEdicao({ ...formEdicao, valor: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(2,8,16,0.7)", color: "#34d399", border: "1px solid rgba(106,176,255,0.2)" }}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Descrição</label>
                <input
                  type="text"
                  value={formEdicao.descricao}
                  onChange={(e) => setFormEdicao({ ...formEdicao, descricao: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}
                />
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Categoria</label>
                <input
                  type="text"
                  value={formEdicao.categoria}
                  onChange={(e) => setFormEdicao({ ...formEdicao, categoria: e.target.value })}
                  placeholder="Ex: Vendas, Aluguel, Salário..."
                  className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(2,8,16,0.7)", color: "#a78bfa", border: "1px solid rgba(106,176,255,0.2)" }}
                />
              </div>

              <div className="rounded-lg p-2 text-[11px]" style={{ background: "rgba(106,176,255,0.05)", color: "#5a7a9a" }}>
                ℹ️ A alteração será aplicada em <strong style={{ color: "#6ab0ff" }}>{linhaEditando.destino_tabela}</strong> e registrada no histórico de auditoria.
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={fecharEdicao}
                disabled={salvandoEdicao}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}
              >
                Cancelar
              </button>
              <button
                onClick={salvarEdicao}
                disabled={salvandoEdicao}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}
              >
                {salvandoEdicao ? "Salvando..." : "✓ Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRO DE COMPARTILHAMENTO */}
      {shareModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={fecharShareModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-5"
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-wider" style={{ color: "#5a7a9a" }}>📤 Centro de Compartilhamento</p>
                <p className="text-sm font-bold mt-0.5 truncate" style={{ color: "#c8d8f0" }}>{shareModal.nome_arquivo}</p>
              </div>
              <button onClick={fecharShareModal} className="text-xl ml-2" style={{ color: "#5a7a9a" }}>✕</button>
            </div>

            {/* Mini-preview do resumo */}
            <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.6)", border: "1px solid rgba(106,176,255,0.15)" }}>
              <p style={{ color: "#5a7a9a" }}>
                📅 {formatDataHora(shareModal.created_at)} •
                🎯 <span style={{ color: "#6ab0ff" }}>{destinoLabel(tt, shareModal.destino)}</span>
              </p>
              <p>
                <span style={{ color: "#34d399" }}>✅ {shareModal.linhas_importadas || 0}</span> •
                <span style={{ color: "#fbbf24" }}> ⚠️ {shareModal.linhas_duplicadas || 0}</span> •
                <span style={{ color: "#f87171" }}> ❌ {shareModal.linhas_erro || 0}</span> •
                <span style={{ color: "#c8d8f0" }}> 💰 {formatBRL(Number(shareModal.valor_total_importado) || 0)}</span>
              </p>
            </div>

            {/* Grid de canais */}
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>Compartilhar via</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#25d366" }}>
                <span className="text-xl">📱</span>
                WhatsApp
              </button>
              <button onClick={shareTelegram}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.35)", color: "#229ed9" }}>
                <span className="text-xl">✈️</span>
                Telegram
              </button>
              <button onClick={shareGmail}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{ background: "rgba(234,67,53,0.12)", border: "1px solid rgba(234,67,53,0.35)", color: "#ea4335" }}>
                <span className="text-xl">📨</span>
                Gmail
              </button>
              <button onClick={shareOutlook}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{ background: "rgba(0,120,212,0.12)", border: "1px solid rgba(0,120,212,0.35)", color: "#0078d4" }}>
                <span className="text-xl">📩</span>
                Outlook
              </button>
              <button onClick={shareCopiarTexto}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <span className="text-xl">📋</span>
                Copiar Resumo
              </button>
              {shareModal.storage_path && (
                <button onClick={shareCopiarLinkArquivo}
                  className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90"
                  style={{ background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.35)", color: "#fb923c" }}>
                  <span className="text-xl">🔗</span>
                  Link Seguro 24h
                </button>
              )}
              <button onClick={shareBaixarPdfIndividual} disabled={gerandoPdfIndividual}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626" }}>
                <span className="text-xl">{gerandoPdfIndividual ? "⏳" : "📄"}</span>
                {gerandoPdfIndividual ? "Gerando..." : "PDF Individual"}
              </button>
            </div>

            <div className="rounded-lg p-2 text-[11px] mb-3" style={{ background: "rgba(106,176,255,0.05)", color: "#5a7a9a" }}>
              ℹ️ Use <strong style={{ color: "#ea4335" }}>Gmail</strong> ou <strong style={{ color: "#0078d4" }}>Outlook</strong> para enviar por email diretamente do navegador. O <strong style={{ color: "#fb923c" }}>Link Seguro</strong> expira em 24h.
            </div>

            <button onClick={fecharShareModal}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}

// ============================================================================
// PREVIEW BLOCK (componente filho — pra página ficar legível)
// ============================================================================

function PreviewBlock(props: any) {
  const {
    tt, resultado, linhas, selecionadas, duplicadas, destinos, mudarDestinoLinha, aplicarDestinoEmMassa,
    templates, mapeamento, aplicarMapeamento, aplicarTemplate,
    toggleLinha, selecionarTodas, editarLinha,
    cancelarUpload, confirmarImportacao, confirmando,
    simularImportacao, simulando, simulacao, sugestoes,
    possiveisDuplicatas, decisoesDuplicata, resolverDuplicata, resolverDuplicataEmMassa,
    pendentesDuplicata, verificandoDuplicatas,
    totalSelecionadas, totalDuplicadas, valorTotalPreview,
    mostrarSalvarTemplate, setMostrarSalvarTemplate,
    nomeNovoTemplate, setNomeNovoTemplate, salvarComoTemplate,
  } = props;

  const destinoResumo = destinoPredominante(destinos);
  const destInfo = DESTINOS.find((d) => d.key === destinoResumo) || DESTINOS[0];
  const multiplosDestinos = new Set(destinos).size > 1;
  const [destinoMassa, setDestinoMassa] = useState<DestinoTabela>(destinoResumo);
  const precisaMap = resultado.precisaMapeamento && (resultado.colunas?.length || 0) > 0;
  const camposMap: Array<{ key: keyof MapeamentoColunas; label: string }> = [
    { key: "data", label: tt.data },
    { key: "valor", label: tt.valor },
    { key: "descricao", label: tt.descricao },
    { key: "categoria", label: tt.categoria },
    { key: "documento", label: tt.documento },
    { key: "cnpj", label: "CNPJ" },
  ];

  return (
    <CanvasBox cor={destInfo.cor}>
      <div className="space-y-4">
        {/* Header do preview */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b" style={{ borderColor: "rgba(106,176,255,0.15)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.preview}</p>
            <p className="text-base font-bold" style={{ color: "#c8d8f0" }}>
              <span className="mr-2">{destInfo.icon}</span>
              {resultado.linhas.length} {tt.linhasDetectadas}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>
              {tt.tipoDetectado}: <strong style={{ color: destInfo.cor }}>{resultado.formato.toUpperCase()}</strong>
              {multiplosDestinos && (
                <span className="ml-2" style={{ color: "#fbbf24" }}>· {tt.destinoDiferentesPorLinha}</span>
              )}
            </p>
          </div>

          {/* Aplicar destino a TODAS as linhas de uma vez — cada linha ainda
              pode ser trocada individualmente na tabela abaixo. */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.destino} {tt.destinoTodasLinhas}</label>
            <select
              value={multiplosDestinos ? "" : destinoResumo}
              onChange={(e) => aplicarDestinoEmMassa(e.target.value as DestinoTabela, false)}
              className="px-3 py-2 rounded-lg text-sm focus:outline-none"
              style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}
            >
              {multiplosDestinos && (
                <option value="" disabled style={{ background: "#020810" }}>{tt.destinoMultiplos}</option>
              )}
              {DESTINOS.map((d) => (
                <option key={d.key} value={d.key} style={{ background: "#020810" }}>
                  {d.icon} {destinoLabel(tt, d.key)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.templatesDisponiveis}</p>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl: any) => (
                <button key={tpl.id} onClick={() => aplicarTemplate(tpl)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.25)" }}>
                  📋 {tpl.nome}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mapeamento de colunas */}
        {precisaMap && (
          <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.25)" }}>
            <div className="flex items-start gap-2 mb-3">
              <span className="text-lg">🗺️</span>
              <div>
                <p className="text-sm font-bold" style={{ color: "#fbbf24" }}>{tt.mapeamentoColunas}</p>
                <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.mapeamentoNecessario}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {camposMap.map((c) => (
                <div key={c.key}>
                  <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{c.label}</label>
                  <select
                    value={(mapeamento[c.key] as string) || ""}
                    onChange={(e) => aplicarMapeamento({ ...mapeamento, [c.key]: e.target.value || undefined })}
                    className="w-full px-2 py-1.5 rounded-lg text-xs"
                    style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}
                  >
                    <option value="" style={{ background: "#020810" }}>{tt.naoMapeado}</option>
                    {(resultado.colunas || []).map((col: string) => (
                      <option key={col} value={col} style={{ background: "#020810" }}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Salvar template */}
            <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(251,191,36,0.2)" }}>
              {!mostrarSalvarTemplate ? (
                <button onClick={() => setMostrarSalvarTemplate(true)}
                  className="text-xs font-semibold"
                  style={{ color: "#fbbf24" }}>
                  💾 {tt.salvarTemplate}
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={nomeNovoTemplate}
                    onChange={(e) => setNomeNovoTemplate(e.target.value)}
                    placeholder={tt.nomeTemplate}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(251,191,36,0.3)" }}
                  />
                  <button onClick={salvarComoTemplate}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>
                    💾 OK
                  </button>
                  <button onClick={() => { setMostrarSalvarTemplate(false); setNomeNovoTemplate(""); }}
                    className="px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => selecionarTodas(true)}
            className="px-2.5 py-1 rounded-lg" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
            ✓ {tt.selecionarTodos}
          </button>
          <button onClick={() => selecionarTodas(false)}
            className="px-2.5 py-1 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
            ✕ {tt.desselecionar}
          </button>
          <span className="ml-auto text-[11px]" style={{ color: "#5a7a9a" }}>
            <strong style={{ color: "#34d399" }}>{totalSelecionadas}</strong> {tt.linhasSelecionadas}
            {totalDuplicadas > 0 && <> · <strong style={{ color: "#fbbf24" }}>{totalDuplicadas}</strong> {tt.duplicadasMarcadas}</>}
          </span>
        </div>

        {/* Aplicar destino em massa às linhas marcadas (mesmo padrão da
            confirmação de duplicata: seleção + ação em massa) */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span style={{ color: "#5a7a9a" }}>{tt.destinoSelecionadas}</span>
          <select
            value={destinoMassa}
            onChange={(e) => setDestinoMassa(e.target.value as DestinoTabela)}
            className="px-2 py-1 rounded-lg text-[11px]"
            style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}
          >
            {DESTINOS.map((d) => (
              <option key={d.key} value={d.key} style={{ background: "#020810" }}>{d.icon} {destinoLabel(tt, d.key)}</option>
            ))}
          </select>
          <button onClick={() => aplicarDestinoEmMassa(destinoMassa, true)}
            className="px-2.5 py-1 rounded-lg font-semibold" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>
            {tt.aplicar}
          </button>
        </div>

        {/* Tabela DESKTOP */}
        <div className="hidden md:block rounded-xl overflow-hidden" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.15)" }}>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-xs">
              <thead style={{ background: "rgba(10,22,40,0.95)", position: "sticky", top: 0 }}>
                <tr>
                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a", width: 40 }}></th>
                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>{tt.data}</th>
                  <th className="px-2 py-2 text-right" style={{ color: "#5a7a9a" }}>{tt.valor}</th>
                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>{tt.descricao}</th>
                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>{tt.categoria}</th>
                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>{tt.destino}</th>
                </tr>
              </thead>
              <tbody>
                {linhas.slice(0, 200).map((l: LinhaImportada, i: number) => {
                  const isDup = duplicadas[i];
                  const isSel = selecionadas[i];
                  const linhaInvalida = !l.data || l.valor === undefined;
                  const confereDestino = l.confiancaDestino === "baixa";
                  return (
                    <tr key={i} className="border-t" style={{
                      borderColor: "rgba(106,176,255,0.08)",
                      background: !isSel ? "rgba(2,8,16,0.7)" : isDup ? "rgba(251,191,36,0.05)" : "transparent",
                      opacity: !isSel ? 0.5 : 1,
                    }}>
                      <td className="px-2 py-1.5">
                        <input type="checkbox" checked={isSel} onChange={() => toggleLinha(i)}
                          className="cursor-pointer" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="date"
                          value={l.data || ""}
                          onChange={(e) => editarLinha(i, "data", e.target.value)}
                          className="bg-transparent text-xs w-28 focus:outline-none"
                          style={{ color: linhaInvalida && !l.data ? "#f87171" : "#c8d8f0" }}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={l.valor ?? ""}
                          onChange={(e) => editarLinha(i, "valor", e.target.value)}
                          className="bg-transparent text-xs w-24 text-right focus:outline-none"
                          style={{ color: linhaInvalida && l.valor === undefined ? "#f87171" : "#34d399" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={l.descricao || ""}
                          onChange={(e) => editarLinha(i, "descricao", e.target.value)}
                          className="bg-transparent text-xs w-full focus:outline-none"
                          style={{ color: "#c8d8f0" }}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={l.categoria || ""}
                            onChange={(e) => editarLinha(i, "categoria", e.target.value)}
                            placeholder="—"
                            className="bg-transparent text-xs w-full focus:outline-none"
                            style={{ color: "#a78bfa" }}
                          />
                          {!l.categoria && sugestoes.get(normalizarPadraoChave(l.descricao || ""))?.categoria && (
                            <button
                              type="button"
                              title={`${tt.motivo}: ${sugestoes.get(normalizarPadraoChave(l.descricao || ""))?.categoria}`}
                              onClick={() => editarLinha(i, "categoria", sugestoes.get(normalizarPadraoChave(l.descricao || ""))?.categoria || "")}
                              className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0"
                              style={{ background: "rgba(212,175,55,0.15)", color: "#d4af37" }}
                            >
                              💡 {sugestoes.get(normalizarPadraoChave(l.descricao || ""))?.categoria}
                            </button>
                          )}
                          {isDup && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap"
                              style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                              DUP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex items-center gap-1">
                          <select
                            value={destinos[i]}
                            onChange={(e) => mudarDestinoLinha(i, e.target.value as DestinoTabela)}
                            className="text-[11px] px-1.5 py-1 rounded-lg focus:outline-none"
                            style={{
                              background: "rgba(2,8,16,0.7)",
                              color: confereDestino ? "#fbbf24" : "#c8d8f0",
                              border: `1px solid ${confereDestino ? "rgba(251,191,36,0.4)" : "rgba(106,176,255,0.2)"}`,
                            }}
                          >
                            {DESTINOS.map((d) => (
                              <option key={d.key} value={d.key} style={{ background: "#020810" }}>{d.icon} {destinoLabel(tt, d.key)}</option>
                            ))}
                          </select>
                          {confereDestino && (
                            <span
                              title={l.motivoDestino || tt.confiraDestino}
                              className="text-[10px] cursor-help"
                              style={{ color: "#fbbf24" }}
                            >
                              ⚠️
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {linhas.length > 200 && (
            <p className="text-[10px] text-center py-2" style={{ color: "#5a7a9a" }}>
              Mostrando primeiras 200 de {linhas.length} linhas (todas serão importadas se selecionadas)
            </p>
          )}
        </div>

        {/* Tabela MOBILE (cards) */}
        <div className="md:hidden space-y-2 max-h-96 overflow-auto">
          {linhas.slice(0, 50).map((l: LinhaImportada, i: number) => {
            const isDup = duplicadas[i];
            const isSel = selecionadas[i];
            return (
              <div key={i} className="rounded-lg p-2.5" style={{
                background: !isSel ? "rgba(2,8,16,0.7)" : isDup ? "rgba(251,191,36,0.06)" : "rgba(2,8,16,0.5)",
                border: "1px solid rgba(106,176,255,0.1)",
                opacity: !isSel ? 0.55 : 1,
              }}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={isSel} onChange={() => toggleLinha(i)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{l.data ? new Date(l.data).toLocaleDateString("pt-BR") : "—"}</span>
                      <span className="text-sm font-bold" style={{ color: "#34d399" }}>{formatBRL(l.valor || 0)}</span>
                    </div>
                    <p className="text-xs truncate" style={{ color: "#c8d8f0" }}>{l.descricao || "—"}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {l.categoria && (
                        <span className="text-[10px]" style={{ color: "#a78bfa" }}>{l.categoria}</span>
                      )}
                      {isDup && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                          DUPLICADA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <select
                        value={destinos[i]}
                        onChange={(e) => mudarDestinoLinha(i, e.target.value as DestinoTabela)}
                        className="flex-1 text-[11px] px-1.5 py-1 rounded-lg focus:outline-none"
                        style={{
                          background: "rgba(2,8,16,0.7)",
                          color: l.confiancaDestino === "baixa" ? "#fbbf24" : "#c8d8f0",
                          border: `1px solid ${l.confiancaDestino === "baixa" ? "rgba(251,191,36,0.4)" : "rgba(106,176,255,0.2)"}`,
                        }}
                      >
                        {DESTINOS.map((d) => (
                          <option key={d.key} value={d.key} style={{ background: "#020810" }}>{d.icon} {destinoLabel(tt, d.key)}</option>
                        ))}
                      </select>
                      {l.confiancaDestino === "baixa" && (
                        <span title={l.motivoDestino || tt.confiraDestino} className="text-[10px]" style={{ color: "#fbbf24" }}>⚠️</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {linhas.length > 50 && (
            <p className="text-[10px] text-center py-2" style={{ color: "#5a7a9a" }}>
              Mostrando 50 de {linhas.length}
            </p>
          )}
        </div>

        {/* Possível Duplicata — cross-módulo, estilo "aviso de PIX repetido".
            Nada grava sozinho: cada linha suspeita fica desmarcada até o
            usuário decidir. */}
        {verificandoDuplicatas && (
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <p className="text-xs" style={{ color: "#fbbf24" }}>⏳ {tt.verificandoDuplicatas}</p>
          </div>
        )}
        {possiveisDuplicatas.some((p: any) => p) && (
          <div className="rounded-xl p-3" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.3)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fbbf24" }}>
                ⚠️ {tt.possivelDuplicata} {pendentesDuplicata > 0 ? `(${pendentesDuplicata})` : ""}
              </p>
              {pendentesDuplicata > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] self-center" style={{ color: "#5a7a9a" }}>{tt.aplicarATodasPendentes}:</span>
                  <button onClick={() => resolverDuplicataEmMassa("importar")} className="text-[10px] px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>{tt.importarMesmoAssim}</button>
                  <button onClick={() => resolverDuplicataEmMassa("pular")} className="text-[10px] px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(148,163,184,0.15)", color: "#cbd5e1" }}>{tt.pular}</button>
                  <button onClick={() => resolverDuplicataEmMassa("somar")} className="text-[10px] px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>{tt.somar}</button>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {possiveisDuplicatas.map((pd: any, i: number) => {
                if (!pd) return null;
                const linha = linhas[i];
                const decisao = decisoesDuplicata[i];
                const labelTabela = destinoLabel(tt, pd.candidato.tabela);
                return (
                  <div key={i} className="rounded-lg p-2.5" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(251,191,36,0.15)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#c8d8f0" }}>
                      Linha {i + 1}: {linha.descricao || "—"} · {formatBRL(linha.valor || 0)} · {linha.data ? formatData(linha.data) : "—"}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "#fbbf24" }}>
                      {tt.pareceIgualA}: {pd.candidato.descricao || "—"} · {formatBRL(pd.candidato.valor)} · {formatData(pd.candidato.data)} · {labelTabela}
                      {pd.horaComparada && <span style={{ color: "#f87171" }}> — {tt.horaConfere}</span>}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{pd.motivo}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button onClick={() => resolverDuplicata(i, "importar")}
                        className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                        style={{ background: decisao === "importar" ? "rgba(52,211,153,0.3)" : "rgba(52,211,153,0.12)", color: "#34d399", border: decisao === "importar" ? "1px solid #34d399" : "none" }}>
                        {tt.importarMesmoAssim}
                      </button>
                      <button onClick={() => resolverDuplicata(i, "pular")}
                        className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                        style={{ background: decisao === "pular" ? "rgba(148,163,184,0.3)" : "rgba(148,163,184,0.12)", color: "#cbd5e1", border: decisao === "pular" ? "1px solid #cbd5e1" : "none" }}>
                        {tt.pular}
                      </button>
                      <button onClick={() => resolverDuplicata(i, "somar")}
                        className="text-[10px] px-2 py-1 rounded-lg font-semibold"
                        style={{ background: decisao === "somar" ? "rgba(106,176,255,0.3)" : "rgba(106,176,255,0.12)", color: "#6ab0ff", border: decisao === "somar" ? "1px solid #6ab0ff" : "none" }}>
                        {tt.somar}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Simulador — mesmo caminho da importação real, nada é gravado */}
        {simulacao && (
          <div className="rounded-xl p-3" style={{ background: "rgba(106,176,255,0.06)", border: "1px solid rgba(106,176,255,0.25)" }}>
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>🔍 {tt.resultadoSimulacao}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: tt.importadas, valor: simulacao.importadas, cor: "#34d399" },
                { label: tt.duplicadas, valor: simulacao.duplicadas, cor: "#fbbf24" },
                { label: tt.ignoradas, valor: simulacao.ignoradas, cor: "#5a7a9a" },
                { label: tt.erros, valor: simulacao.erro, cor: "#f87171" },
              ].map((s: any, i: number) => (
                <div key={i} className="rounded-lg p-2 text-center" style={{ background: "rgba(2,8,16,0.5)" }}>
                  <p className="text-lg font-bold" style={{ color: s.cor }}>{s.valor}</p>
                  <p className="text-[10px]" style={{ color: "#5a7a9a" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo + Ações */}
        <div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.25)" }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.valorTotal}</p>
              <p className="text-xl font-bold" style={{ color: "#34d399" }}>{formatBRL(valorTotalPreview)}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={cancelarUpload}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                {tt.cancelar}
              </button>
              <button onClick={simularImportacao} disabled={simulando || totalSelecionadas === 0 || pendentesDuplicata > 0}
                title={pendentesDuplicata > 0 ? tt.duplicataPendente : undefined}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "rgba(106,176,255,0.12)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.3)" }}>
                {simulando ? `⏳ ${tt.simulando}` : `🔍 ${tt.simular}`}
              </button>
              <button onClick={confirmarImportacao} disabled={confirmando || totalSelecionadas === 0 || pendentesDuplicata > 0}
                title={pendentesDuplicata > 0 ? tt.duplicataPendente : undefined}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
                {confirmando ? `⏳ ${tt.importando}` : `✓ ${tt.confirmarImport} (${totalSelecionadas})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CanvasBox>
  );
}

// ============================================================================
// HISTÓRICO BLOCK
// ============================================================================

function HistoricoBlock(props: any) {
  const {
    tt, historico, loadingHistorico, expandida, expandirImportacao,
    revertendo, desfazerImportacao, baixarOriginal, compartilharImportacao,
    filtroStatus, setFiltroStatus, filtroDestino, setFiltroDestino,
    linhasPorImportacao, carregandoLinhas, abrirEdicao, deletarLinha, deletandoLinha,
    excluirRegistro, excluindoRegistro,
    excecoesPorImportacao, timelinePorImportacao, resolverExcecaoUI, resolvendoExcecao,
  } = props;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <CanvasBox cor="#6ab0ff">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.filtroStatus}</label>
            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}>
              <option value="todos" style={{ background: "#020810" }}>{tt.todos}</option>
              {Object.keys(STATUS_INFO).map((k) => (
                <option key={k} value={k} style={{ background: "#020810" }}>{statusLabel(tt, k)}</option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.filtroDestino}</label>
            <select value={filtroDestino} onChange={(e) => setFiltroDestino(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: "rgba(2,8,16,0.7)", color: "#c8d8f0", border: "1px solid rgba(106,176,255,0.2)" }}>
              <option value="todos" style={{ background: "#020810" }}>{tt.todos}</option>
              {DESTINOS.map((d) => (
                <option key={d.key} value={d.key} style={{ background: "#020810" }}>{d.icon} {destinoLabel(tt, d.key)}</option>
              ))}
            </select>
          </div>
        </div>
      </CanvasBox>

      {loadingHistorico ? (
        <CanvasBox cor="#6ab0ff">
          <div className="py-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </CanvasBox>
      ) : historico.length === 0 ? (
        <CanvasBox cor="#6ab0ff">
          <div className="py-8 text-center"><p style={{ color: "#5a7a9a" }}>{tt.semImportacoes}</p></div>
        </CanvasBox>
      ) : (
        historico.map((item: any) => {
          const destInfo = DESTINOS.find((d) => d.key === item.destino) || DESTINOS[0];
          const stInfo = STATUS_INFO[item.status] || { cor: "#6ab0ff" };
          const isExp = expandida === item.id;
          const podeDesfazer = item.status === "concluido" || item.status === "parcialmente";
          const podeExcluirRegistro = item.status === "erro" || item.status === "revertido" || item.status === "falhou";
          return (
            <CanvasBox key={item.id} cor={destInfo.cor}>
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{destInfo.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate" style={{ color: "#c8d8f0" }}>{item.nome_arquivo}</p>
                      <p className="text-xs mt-0.5" style={{ color: destInfo.cor }}>→ {destinoLabel(tt, item.destino)}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#5a7a9a" }}>{formatDataHora(item.created_at)}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-lg text-[11px] font-semibold flex-shrink-0"
                    style={{ background: `${stInfo.cor}20`, color: stInfo.cor }}>
                    {statusLabel(tt, item.status)}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: tt.importadas, valor: item.linhas_importadas || 0, cor: "#34d399" },
                    { label: tt.duplicadas, valor: item.linhas_duplicadas || 0, cor: "#fbbf24" },
                    { label: tt.erros, valor: item.linhas_erro || 0, cor: "#f87171" },
                    { label: tt.valorTotal, valor: formatBRL(Number(item.valor_total_importado) || 0), cor: "#6ab0ff" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg p-2" style={{ background: "rgba(2,8,16,0.5)" }}>
                      <p className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{s.label}</p>
                      <p className="text-sm font-bold" style={{ color: s.cor }}>{s.valor}</p>
                    </div>
                  ))}
                </div>

                {/* Detalhes expandidos */}
                {isExp && (
                  <div className="space-y-3">
                    {/* Metadados */}
                    <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.1)" }}>
                      <p style={{ color: "#5a7a9a" }}>
                        Hash: <span style={{ color: "#c8d8f0", fontFamily: "monospace", fontSize: 10 }}>{(item.hash_arquivo || "").slice(0, 32)}...</span>
                      </p>
                      {item.tipo_arquivo && <p style={{ color: "#5a7a9a" }}>Formato: <span style={{ color: "#c8d8f0" }}>{item.tipo_arquivo.toUpperCase()}</span></p>}
                      {item.tamanho_bytes > 0 && <p style={{ color: "#5a7a9a" }}>Tamanho: <span style={{ color: "#c8d8f0" }}>{(item.tamanho_bytes / 1024).toFixed(1)} KB</span></p>}
                      {item.tempo_processamento_ms > 0 && <p style={{ color: "#5a7a9a" }}>Tempo: <span style={{ color: "#c8d8f0" }}>{(item.tempo_processamento_ms / 1000).toFixed(1)}s</span></p>}
                      {item.mensagem_erro && <p style={{ color: "#f87171" }}>⚠️ {item.mensagem_erro}</p>}
                      {item.revertido_em && <p style={{ color: "#fbbf24" }}>↩️ Desfeito em {formatDataHora(item.revertido_em)}</p>}
                    </div>

                    {/* Fila de Exceções — o que o sistema não decidiu sozinho */}
                    <div className="rounded-lg p-3" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(248,113,113,0.15)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#f87171" }}>⚠️ {tt.excecoes}</p>
                      {(excecoesPorImportacao[item.id] || []).length === 0 ? (
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.semExcecoes}</p>
                      ) : (
                        <div className="space-y-2">
                          {excecoesPorImportacao[item.id].map((exc: any) => (
                            <div key={exc.id} className="flex items-start justify-between gap-2 rounded-lg p-2" style={{ background: "rgba(248,113,113,0.06)" }}>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold" style={{ color: "#f87171" }}>
                                  {exc.tipo} {exc.linha_numero ? `— linha ${exc.linha_numero}` : ""}
                                </p>
                                <p className="text-[11px] mt-0.5" style={{ color: "#c8d8f0" }}>{tt.motivo}: {exc.motivo}</p>
                                <p className="text-[10px] mt-0.5" style={{ color: exc.status === "pendente" ? "#fbbf24" : "#34d399" }}>
                                  {exc.status === "pendente" ? tt.excecaoPendente : tt.excecaoResolvida}
                                </p>
                              </div>
                              {exc.status === "pendente" && (
                                <button
                                  onClick={() => resolverExcecaoUI(exc.id, item.id)}
                                  disabled={resolvendoExcecao === exc.id}
                                  className="px-2 py-1 rounded-lg text-[10px] font-semibold flex-shrink-0 disabled:opacity-50"
                                  style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}
                                >
                                  {resolvendoExcecao === exc.id ? tt.resolvendo : tt.resolver}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Linha do Tempo */}
                    <div className="rounded-lg p-3" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.1)" }}>
                      <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>🕒 {tt.timeline}</p>
                      {(timelinePorImportacao[item.id] || []).length === 0 ? (
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.semTimeline}</p>
                      ) : (
                        <div className="space-y-1.5">
                          {timelinePorImportacao[item.id].map((ev: any) => (
                            <div key={ev.id} className="flex items-start gap-2 text-xs">
                              <span style={{ color: "#5a7a9a" }} className="flex-shrink-0">{formatDataHora(ev.created_at)}</span>
                              <span style={{ color: "#c8d8f0" }}>
                                <strong style={{ color: "#6ab0ff" }}>{ev.evento}</strong>{ev.descricao ? ` — ${ev.descricao}` : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de linhas importadas com lápis/lixeira */}
                    {carregandoLinhas === item.id ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs mt-2" style={{ color: "#5a7a9a" }}>Carregando linhas...</p>
                      </div>
                    ) : linhasPorImportacao[item.id] ? (
                      <div>
                        <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>
                          📋 Lançamentos desta Importação ({linhasPorImportacao[item.id].length})
                        </p>

                        {/* Tabela DESKTOP */}
                        <div className="hidden md:block rounded-lg overflow-hidden" style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.1)" }}>
                          <div className="max-h-80 overflow-auto">
                            <table className="w-full text-xs">
                              <thead style={{ background: "rgba(10,22,40,0.95)", position: "sticky", top: 0 }}>
                                <tr>
                                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>#</th>
                                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>Data</th>
                                  <th className="px-2 py-2 text-right" style={{ color: "#5a7a9a" }}>Valor</th>
                                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>Descrição</th>
                                  <th className="px-2 py-2 text-left" style={{ color: "#5a7a9a" }}>Categoria</th>
                                  <th className="px-2 py-2 text-center" style={{ color: "#5a7a9a" }}>Status</th>
                                  <th className="px-2 py-2 text-right" style={{ color: "#5a7a9a" }}>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {linhasPorImportacao[item.id].map((ln: any) => {
                                  const editavel = ln.status === "importada";
                                  return (
                                    <tr key={ln.id} className="border-t" style={{
                                      borderColor: "rgba(106,176,255,0.08)",
                                      opacity: editavel ? 1 : 0.55,
                                    }}>
                                      <td className="px-2 py-1.5" style={{ color: "#5a7a9a" }}>{ln.linha_numero}</td>
                                      <td className="px-2 py-1.5" style={{ color: "#c8d8f0" }}>{ln.data_lancamento ? new Date(ln.data_lancamento).toLocaleDateString("pt-BR") : "—"}</td>
                                      <td className="px-2 py-1.5 text-right font-semibold" style={{ color: "#34d399" }}>{formatBRL(Number(ln.valor) || 0)}</td>
                                      <td className="px-2 py-1.5" style={{ color: "#c8d8f0", maxWidth: 200 }}>
                                        <div className="truncate">{ln.descricao || "—"}</div>
                                      </td>
                                      <td className="px-2 py-1.5" style={{ color: "#a78bfa" }}>{ln.categoria || "—"}</td>
                                      <td className="px-2 py-1.5 text-center">
                                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{
                                          background: ln.status === "importada" ? "rgba(52,211,153,0.15)" :
                                                       ln.status === "duplicada" ? "rgba(251,191,36,0.15)" :
                                                       ln.status === "revertida" ? "rgba(58,90,138,0.2)" :
                                                       ln.status === "erro" ? "rgba(248,113,113,0.15)" : "rgba(106,176,255,0.1)",
                                          color: ln.status === "importada" ? "#34d399" :
                                                 ln.status === "duplicada" ? "#fbbf24" :
                                                 ln.status === "revertida" ? "#5a7a9a" :
                                                 ln.status === "erro" ? "#f87171" : "#6ab0ff",
                                        }}>
                                          {ln.status}
                                        </span>
                                      </td>
                                      <td className="px-2 py-1.5 text-right">
                                        {editavel && (
                                          <div className="flex gap-1 justify-end">
                                            <button onClick={() => abrirEdicao(ln)}
                                              title="Editar"
                                              className="px-1.5 py-1 rounded hover:opacity-80"
                                              style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>
                                              ✏️
                                            </button>
                                            <button onClick={() => deletarLinha(ln)} disabled={deletandoLinha === ln.id}
                                              title="Excluir"
                                              className="px-1.5 py-1 rounded hover:opacity-80 disabled:opacity-30"
                                              style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                                              {deletandoLinha === ln.id ? "⏳" : "🗑️"}
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Cards MOBILE */}
                        <div className="md:hidden space-y-2 max-h-80 overflow-auto">
                          {linhasPorImportacao[item.id].map((ln: any) => {
                            const editavel = ln.status === "importada";
                            return (
                              <div key={ln.id} className="rounded-lg p-2.5" style={{
                                background: "rgba(2,8,16,0.5)",
                                border: "1px solid rgba(106,176,255,0.1)",
                                opacity: editavel ? 1 : 0.55,
                              }}>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-[10px]" style={{ color: "#5a7a9a" }}>#{ln.linha_numero} · {ln.data_lancamento ? new Date(ln.data_lancamento).toLocaleDateString("pt-BR") : "—"}</span>
                                  <span className="text-sm font-bold" style={{ color: "#34d399" }}>{formatBRL(Number(ln.valor) || 0)}</span>
                                </div>
                                <p className="text-xs truncate mb-1" style={{ color: "#c8d8f0" }}>{ln.descricao || "—"}</p>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px]" style={{ color: "#a78bfa" }}>{ln.categoria || "—"}</span>
                                  {editavel && (
                                    <div className="flex gap-1">
                                      <button onClick={() => abrirEdicao(ln)}
                                        className="px-2 py-1 rounded text-xs"
                                        style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>
                                        ✏️ Editar
                                      </button>
                                      <button onClick={() => deletarLinha(ln)} disabled={deletandoLinha === ln.id}
                                        className="px-2 py-1 rounded text-xs disabled:opacity-30"
                                        style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                                        {deletandoLinha === ln.id ? "⏳" : "🗑️"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => expandirImportacao(item.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                    {isExp ? "▲" : "▼"} {tt.detalhes}
                  </button>
                  {item.storage_path && (
                    <button onClick={() => baixarOriginal(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                      ⬇️ {tt.baixarOriginal}
                    </button>
                  )}
                  <button onClick={() => compartilharImportacao(item)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>
                    📤 {tt.compartilhar}
                  </button>
                  {podeDesfazer && (
                    <button onClick={() => desfazerImportacao(item.id)} disabled={revertendo === item.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ml-auto"
                      style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                      {revertendo === item.id ? `⏳ ${tt.desfazendo}` : `↩️ ${tt.desfazer}`}
                    </button>
                  )}
                  {podeExcluirRegistro && (
                    <button onClick={() => excluirRegistro(item)} disabled={excluindoRegistro === item.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 ml-auto"
                      style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171" }}>
                      {excluindoRegistro === item.id ? "⏳ Excluindo..." : "🗑️ Excluir registro"}
                    </button>
                  )}
                </div>
              </div>
            </CanvasBox>
          );
        })
      )}
    </div>
  );
}