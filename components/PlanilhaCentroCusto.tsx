"use client";
// 🦅 AXIOMA AI.TECH - Planilha Inteligente do Centro de Custos (Fase 3)
// Grade própria (sem lib de terceiros) — sticky nativo via CSS, virtualização simples
// por janela de scroll, fórmula escopada (lib/formulaHelpers.ts) que grava valor
// congelado na tabela de origem. Camada de análise (subtotal/total/% do total/desvio)
// é derivada em tempo real pelo React, sempre "viva".
//
// ponytail: seleção múltipla é por LINHA (clique/Ctrl/Shift), não célula-a-célula livre
// como no Excel de verdade — pra uma grade de lançamentos (1 linha = 1 registro), somar
// linhas selecionadas cobre o caso de uso real; selecionar células de colunas de texto
// (categoria, status) não teria leitura numérica de qualquer forma. Ampliar pra seleção
// retangular de células se algum dia for pedido especificamente.
import { useState, useMemo, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import * as XLSX from "xlsx";
import { Pencil, Lock, ChevronDown, ChevronRight, Filter, ArrowUp, ArrowDown, Download, FileSpreadsheet, X } from "lucide-react";
import { gerarPdfTabela } from "../lib/gerarPdfTabela";
import { optBarrasH, optBarrasComparativo } from "../lib/cfoCore";
import { avaliarFormula, pareceFormula } from "../lib/formulaHelpers";
import { LABEL_ORIGEM, type OrigemTabela, type CampoEditavel, atualizarCampoOrigem, type OrcamentoRow, orcamentoDoPeriodo } from "../lib/centroCustoHelpers";

export type LinhaPlanilha = {
  id: string;
  tabela: OrigemTabela;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;             // ISO; "" quando não aplicável (custos fixos usa diaVencimento)
  diaVencimento?: number;   // só custos_fixos
  centroId: string | null;
  centroNome: string;
  fornecedorId?: string | null;
  fornecedorNome?: string;
  status?: string;          // só contas_pagar — somente leitura
  valorPago?: number;       // só contas_pagar — contexto pro recálculo de status
};

type Lang = "pt" | "en" | "es";
type Agrupador = "nenhum" | "centro" | "categoria" | "periodo";
type ColunaId = "tabela" | "descricao" | "categoria" | "valor" | "data" | "centro" | "fornecedor" | "status" | "pctTotal";

const T: Record<Lang, Record<string, string>> = {
  pt: {
    origem: "Origem", descricao: "Descrição", categoria: "Categoria", valor: "Valor", data: "Data",
    centro: "Centro de Custo", fornecedor: "Fornecedor", status: "Status", pctTotal: "% do Total",
    subtotal: "Subtotal", totalGeral: "Total Geral", buscar: "Buscar descrição...",
    agruparPor: "Agrupar por", semAgrupamento: "Sem agrupamento", porCentro: "Centro", porCategoria: "Categoria", porPeriodo: "Período",
    exportarCSV: "CSV", exportarXLSX: "Excel", exportarPDF: "PDF",
    linhaSelecionada: "linha selecionada", linhasSelecionadas: "linhas selecionadas",
    soma: "Soma", media: "Média", contagem: "Contagem",
    dentroOrcamento: "dentro do orçamento", estourouOrcamento: "acima do orçamento", semOrcamento: "sem orçamento definido",
    limparFiltros: "Limpar filtros", todos: "Todos", nenhumResultado: "Nenhum lançamento encontrado com esses filtros.",
    somenteLeitura: "Somente leitura — calculado a partir do valor e do pagamento. Pra mudar, use a tela de Fornecedores.",
    formulaTooltip: "Fórmula aplicada como valor no momento da edição — não recalcula sozinha depois (dado financeiro é fato registrado).",
    rankingCentros: "Ranking de Centros por Custo", maioresDesvios: "Maiores Desvios vs Orçamento", curvaABC: "Curva ABC de Custos",
    evolucaoMensal: "Evolução Mensal", orcadoRealizado: "Orçado × Realizado por Mês",
    orcadoS: "Orçado", realizadoS: "Realizado", semDados: "Sem dados suficientes para este gráfico.",
    erroSalvar: "Erro ao salvar", selecionarTodos: "Selecionar todos", filtrar: "Filtrar",
  },
  en: {
    origem: "Source", descricao: "Description", categoria: "Category", valor: "Amount", data: "Date",
    centro: "Cost Center", fornecedor: "Supplier", status: "Status", pctTotal: "% of Total",
    subtotal: "Subtotal", totalGeral: "Grand Total", buscar: "Search description...",
    agruparPor: "Group by", semAgrupamento: "No grouping", porCentro: "Center", porCategoria: "Category", porPeriodo: "Period",
    exportarCSV: "CSV", exportarXLSX: "Excel", exportarPDF: "PDF",
    linhaSelecionada: "row selected", linhasSelecionadas: "rows selected",
    soma: "Sum", media: "Average", contagem: "Count",
    dentroOrcamento: "within budget", estourouOrcamento: "over budget", semOrcamento: "no budget defined",
    limparFiltros: "Clear filters", todos: "All", nenhumResultado: "No entries found with these filters.",
    somenteLeitura: "Read-only — calculated from amount and payment. To change it, use the Suppliers screen.",
    formulaTooltip: "Formula applied as a value at edit time — doesn't recalculate later (financial data is a recorded fact).",
    rankingCentros: "Cost Ranking by Center", maioresDesvios: "Biggest Budget Deviations", curvaABC: "ABC Cost Curve",
    evolucaoMensal: "Monthly Evolution", orcadoRealizado: "Budget × Actual by Month",
    orcadoS: "Budget", realizadoS: "Actual", semDados: "Not enough data for this chart.",
    erroSalvar: "Error saving", selecionarTodos: "Select all", filtrar: "Filter",
  },
  es: {
    origem: "Origen", descricao: "Descripción", categoria: "Categoría", valor: "Valor", data: "Fecha",
    centro: "Centro de Costo", fornecedor: "Proveedor", status: "Estado", pctTotal: "% del Total",
    subtotal: "Subtotal", totalGeral: "Total General", buscar: "Buscar descripción...",
    agruparPor: "Agrupar por", semAgrupamento: "Sin agrupación", porCentro: "Centro", porCategoria: "Categoría", porPeriodo: "Período",
    exportarCSV: "CSV", exportarXLSX: "Excel", exportarPDF: "PDF",
    linhaSelecionada: "fila seleccionada", linhasSelecionadas: "filas seleccionadas",
    soma: "Suma", media: "Promedio", contagem: "Cantidad",
    dentroOrcamento: "dentro del presupuesto", estourouOrcamento: "sobre el presupuesto", semOrcamento: "sin presupuesto definido",
    limparFiltros: "Limpiar filtros", todos: "Todos", nenhumResultado: "Ningún movimiento encontrado con estos filtros.",
    somenteLeitura: "Solo lectura — calculado a partir del valor y el pago. Para cambiarlo, use la pantalla de Proveedores.",
    formulaTooltip: "Fórmula aplicada como valor en el momento de la edición — no se recalcula después (el dato financiero es un hecho registrado).",
    rankingCentros: "Ranking de Centros por Costo", maioresDesvios: "Mayores Desvíos vs Presupuesto", curvaABC: "Curva ABC de Costos",
    evolucaoMensal: "Evolución Mensual", orcadoRealizado: "Presupuestado × Realizado por Mes",
    orcadoS: "Presupuestado", realizadoS: "Realizado", semDados: "Datos insuficientes para este gráfico.",
    erroSalvar: "Error al guardar", selecionarTodos: "Seleccionar todo", filtrar: "Filtrar",
  },
};

const COLUNAS: { id: ColunaId; letra: string; editavel: boolean; largura: number }[] = [
  { id: "tabela", letra: "A", editavel: false, largura: 108 },
  { id: "descricao", letra: "B", editavel: true, largura: 220 },
  { id: "categoria", letra: "C", editavel: true, largura: 140 },
  { id: "valor", letra: "D", editavel: true, largura: 130 },
  { id: "data", letra: "E", editavel: true, largura: 110 },
  { id: "centro", letra: "F", editavel: true, largura: 150 },
  { id: "fornecedor", letra: "G", editavel: true, largura: 150 },
  { id: "status", letra: "H", editavel: false, largura: 100 },
  { id: "pctTotal", letra: "I", editavel: false, largura: 90 },
];

const VINHO = "#9f1239", BORDO = "#881337", COBRE = "#b87333";
const VERMELHO = "#f87171", AMBAR = "#f59e0b", VERDE = "#34d399";

const fmt = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type CentroLeve = { id: string; nome: string; orcamento_mensal?: number | null };

export type PlanilhaCentroCustoProps = {
  linhas: LinhaPlanilha[];
  centros: CentroLeve[];
  orcamentos: OrcamentoRow[];
  fornecedores: { id: string; nome: string }[];
  categoriasPorTabela: Partial<Record<OrigemTabela, string[]>>;
  userId: string | null;
  idioma: Lang;
  onSalvo: () => void;
};

export default function PlanilhaCentroCusto({ linhas, centros, orcamentos, fornecedores, categoriasPorTabela, userId, idioma, onSalvo }: PlanilhaCentroCustoProps) {
  const t = T[idioma];

  const [busca, setBusca] = useState("");
  const [filtroTabela, setFiltroTabela] = useState<Set<OrigemTabela> | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<Set<string> | null>(null);
  const [filtroCentro, setFiltroCentro] = useState<Set<string> | null>(null);
  const [colunaFiltroAberta, setColunaFiltroAberta] = useState<ColunaId | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ coluna: ColunaId; dir: "asc" | "desc" } | null>(null);
  const [agrupador, setAgrupador] = useState<Agrupador>("centro");
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set());
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [ultimoClicado, setUltimoClicado] = useState<string | null>(null);
  const [editando, setEditando] = useState<{ id: string; coluna: ColunaId } | null>(null);
  const [valorEdicao, setValorEdicao] = useState("");
  const [salvandoId, setSalvandoId] = useState<string | null>(null);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const getOrcamentoCentro = (centroId: string) => {
    const c = centros.find(x => x.id === centroId);
    if (!c) return 0;
    const periodoAtual = new Date().toISOString().slice(0, 7);
    return orcamentoDoPeriodo(orcamentos, c.id, periodoAtual, c.orcamento_mensal || 0);
  };

  // ---------- FILTRAGEM ----------
  const linhasFiltradas = useMemo(() => {
    return linhas.filter(l => {
      if (busca && !l.descricao.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroTabela && !filtroTabela.has(l.tabela)) return false;
      if (filtroCategoria && !filtroCategoria.has(l.categoria || "-")) return false;
      if (filtroCentro && !filtroCentro.has(l.centroId || "sem-centro")) return false;
      return true;
    });
  }, [linhas, busca, filtroTabela, filtroCategoria, filtroCentro]);

  // ---------- ORDENAÇÃO ----------
  const linhasOrdenadas = useMemo(() => {
    if (!ordenacao) return linhasFiltradas;
    const dir = ordenacao.dir === "asc" ? 1 : -1;
    const chave = (l: LinhaPlanilha): string | number => {
      switch (ordenacao.coluna) {
        case "descricao": return l.descricao.toLowerCase();
        case "categoria": return (l.categoria || "").toLowerCase();
        case "valor": return l.valor;
        case "data": return l.data || String(l.diaVencimento || 0);
        case "centro": return l.centroNome.toLowerCase();
        case "fornecedor": return (l.fornecedorNome || "").toLowerCase();
        case "status": return l.status || "";
        case "tabela": return l.tabela;
        default: return "";
      }
    };
    return [...linhasFiltradas].sort((a, b) => {
      const va = chave(a), vb = chave(b);
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [linhasFiltradas, ordenacao]);

  const totalGeral = useMemo(() => linhasOrdenadas.reduce((s, l) => s + l.valor, 0), [linhasOrdenadas]);

  // ---------- AGRUPAMENTO ----------
  type Grupo = { chave: string; nome: string; linhas: LinhaPlanilha[]; subtotal: number; orcado: number };
  const grupos: Grupo[] = useMemo(() => {
    if (agrupador === "nenhum") {
      return [{ chave: "todos", nome: "", linhas: linhasOrdenadas, subtotal: totalGeral, orcado: 0 }];
    }
    const mapa = new Map<string, { nome: string; linhas: LinhaPlanilha[] }>();
    linhasOrdenadas.forEach(l => {
      const chave = agrupador === "centro" ? (l.centroId || "sem-centro")
        : agrupador === "categoria" ? (l.categoria || "-")
        : (l.data ? l.data.slice(0, 7) : "-");
      const nome = agrupador === "centro" ? l.centroNome : agrupador === "categoria" ? (l.categoria || "-") : (l.data ? l.data.slice(0, 7) : "-");
      if (!mapa.has(chave)) mapa.set(chave, { nome, linhas: [] });
      mapa.get(chave)!.linhas.push(l);
    });
    return Array.from(mapa.entries()).map(([chave, v]) => ({
      chave, nome: v.nome, linhas: v.linhas,
      subtotal: v.linhas.reduce((s, l) => s + l.valor, 0),
      orcado: agrupador === "centro" ? getOrcamentoCentro(chave) : 0,
    })).sort((a, b) => b.subtotal - a.subtotal);
  }, [linhasOrdenadas, agrupador, totalGeral, centros, orcamentos]);

  // ---------- LISTA DE RENDER (achatada, pra virtualização + endereçamento de fórmula) ----------
  type LinhaRender =
    | { tipo: "grupo"; chave: string; nome: string; subtotal: number; orcado: number; qtd: number }
    | { tipo: "linha"; linha: LinhaPlanilha; numeroFormula: number }
    | { tipo: "subtotal"; nome: string; subtotal: number; orcado: number }
    | { tipo: "total" };

  const linhasRenderNumeradasRef = useRef<LinhaPlanilha[]>([]);
  const listaRender: LinhaRender[] = useMemo(() => {
    const out: LinhaRender[] = [];
    const numeradas: LinhaPlanilha[] = [];
    grupos.forEach(g => {
      if (agrupador !== "nenhum") {
        out.push({ tipo: "grupo", chave: g.chave, nome: g.nome, subtotal: g.subtotal, orcado: g.orcado, qtd: g.linhas.length });
        if (gruposColapsados.has(g.chave)) return;
      }
      g.linhas.forEach(l => { numeradas.push(l); out.push({ tipo: "linha", linha: l, numeroFormula: numeradas.length }); });
      if (agrupador !== "nenhum") out.push({ tipo: "subtotal", nome: g.nome, subtotal: g.subtotal, orcado: g.orcado });
    });
    out.push({ tipo: "total" });
    linhasRenderNumeradasRef.current = numeradas;
    return out;
  }, [grupos, agrupador, gruposColapsados]);

  // ---------- VIRTUALIZAÇÃO SIMPLES (janela por scroll, sem lib) ----------
  const ALTURA_LINHA = 38;
  const ALTURA_VISIVEL = 520;
  const BUFFER = 8;
  const primeiroIdx = Math.max(0, Math.floor(scrollTop / ALTURA_LINHA) - BUFFER);
  const qtdVisivel = Math.ceil(ALTURA_VISIVEL / ALTURA_LINHA) + BUFFER * 2;
  const ultimoIdx = Math.min(listaRender.length, primeiroIdx + qtdVisivel);
  const janelaRender = listaRender.slice(primeiroIdx, ultimoIdx);

  // ---------- FÓRMULA: endereçamento A1 sobre a lista atualmente visível ----------
  function obterValorCelula(endereco: string): number | null {
    const m = endereco.match(/^([A-Z]+)([0-9]+)$/);
    if (!m) return null;
    const letra = m[1], num = parseInt(m[2]);
    const linha = linhasRenderNumeradasRef.current[num - 1];
    if (!linha) return null;
    const col = COLUNAS.find(c => c.letra === letra);
    if (!col) return null;
    const bruto: any =
      col.id === "valor" ? linha.valor :
      col.id === "descricao" ? linha.descricao :
      col.id === "categoria" ? linha.categoria :
      col.id === "centro" ? linha.centroNome :
      col.id === "fornecedor" ? linha.fornecedorNome :
      col.id === "status" ? linha.status : null;
    const n = Number(bruto);
    return isNaN(n) ? null : n;
  }

  // ---------- SELEÇÃO DE LINHAS (status bar) ----------
  function clicarLinha(id: string, evento: React.MouseEvent) {
    const flat = linhasRenderNumeradasRef.current.map(l => l.id);
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (evento.shiftKey && ultimoClicado) {
        const iA = flat.indexOf(ultimoClicado), iB = flat.indexOf(id);
        if (iA >= 0 && iB >= 0) {
          const [ini, fim] = iA < iB ? [iA, iB] : [iB, iA];
          for (let i = ini; i <= fim; i++) novo.add(flat[i]);
          return novo;
        }
      }
      if (evento.ctrlKey || evento.metaKey) {
        if (novo.has(id)) novo.delete(id); else novo.add(id);
        return novo;
      }
      return new Set([id]);
    });
    setUltimoClicado(id);
  }

  const estatisticasSelecao = useMemo(() => {
    const valores = linhasRenderNumeradasRef.current.filter(l => selecionados.has(l.id)).map(l => l.valor);
    const soma = valores.reduce((s, v) => s + v, 0);
    return { qtd: valores.length, soma, media: valores.length > 0 ? soma / valores.length : 0 };
  }, [selecionados, listaRender]);

  // ---------- EDIÇÃO ----------
  function abrirEdicao(linha: LinhaPlanilha, coluna: ColunaId) {
    const col = COLUNAS.find(c => c.id === coluna);
    if (!col?.editavel) return;
    if (coluna === "fornecedor" && linha.tabela !== "contas_pagar") return;
    setEditando({ id: linha.id, coluna });
    setErroEdicao(null);
    const atual =
      coluna === "descricao" ? linha.descricao :
      coluna === "categoria" ? linha.categoria :
      coluna === "valor" ? String(linha.valor) :
      coluna === "data" ? (linha.tabela === "custos_fixos" ? String(linha.diaVencimento || "") : (linha.data || "")) :
      coluna === "centro" ? (linha.centroId || "") :
      coluna === "fornecedor" ? (linha.fornecedorId || "") : "";
    setValorEdicao(atual);
  }

  function cancelarEdicao() {
    setEditando(null); setValorEdicao(""); setErroEdicao(null);
  }

  async function confirmarEdicao(linha: LinhaPlanilha) {
    if (!editando || !userId) { cancelarEdicao(); return; }
    const coluna = editando.coluna;
    let valorFinal: any = valorEdicao;

    if (coluna === "valor") {
      if (pareceFormula(valorEdicao)) {
        const { valor, erro } = avaliarFormula(valorEdicao, obterValorCelula);
        if (erro) { setErroEdicao(erro); return; }
        valorFinal = valor;
      } else {
        const n = parseFloat(valorEdicao.replace(",", "."));
        if (isNaN(n)) { setErroEdicao(t.erroSalvar); return; }
        valorFinal = n;
      }
    }
    if (coluna === "data" && linha.tabela === "custos_fixos") {
      const n = parseInt(valorEdicao);
      if (isNaN(n) || n < 1 || n > 31) { setErroEdicao(t.erroSalvar); return; }
      valorFinal = n;
    }

    const campo: CampoEditavel = coluna === "centro" ? "centro_custo_id" : coluna === "fornecedor" ? "fornecedor_id"
      : coluna === "data" && linha.tabela === "custos_fixos" ? "dia_vencimento" : (coluna as CampoEditavel);

    setSalvandoId(linha.id);
    const { erro } = await atualizarCampoOrigem(userId, linha.tabela, linha.id, campo, valorFinal || null, {
      centroId: linha.centroId, valorPagoAtual: linha.valorPago, dataVencimentoAtual: linha.data,
    });
    setSalvandoId(null);
    if (erro) { setErroEdicao(erro); return; }
    cancelarEdicao();
    onSalvo();
  }

  function onKeyDownEdicao(e: React.KeyboardEvent, linha: LinhaPlanilha) {
    if (e.key === "Enter") { e.preventDefault(); confirmarEdicao(linha); }
    else if (e.key === "Escape") { e.preventDefault(); cancelarEdicao(); }
  }

  // ---------- EXPORTAÇÃO ----------
  function linhasParaExportar() {
    return linhasOrdenadas.map(l => ({
      [t.origem]: LABEL_ORIGEM[l.tabela][idioma], [t.descricao]: l.descricao, [t.categoria]: l.categoria || "",
      [t.valor]: l.valor, [t.data]: l.tabela === "custos_fixos" ? l.diaVencimento : l.data,
      [t.centro]: l.centroNome, [t.fornecedor]: l.fornecedorNome || "", [t.status]: l.status || "",
    }));
  }

  function exportarXLSX() {
    const ws = XLSX.utils.json_to_sheet(linhasParaExportar());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Centro de Custo");
    XLSX.writeFile(wb, `axioma-centro-custo-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
  function exportarCSV() {
    const ws = XLSX.utils.json_to_sheet(linhasParaExportar());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Centro de Custo");
    XLSX.writeFile(wb, `axioma-centro-custo-${new Date().toISOString().slice(0, 10)}.csv`, { bookType: "csv" });
  }
  function exportarPDF() {
    gerarPdfTabela({
      titulo: idioma === "pt" ? "Planilha do Centro de Custos" : idioma === "es" ? "Planilla de Centro de Costos" : "Cost Center Spreadsheet",
      subtitulo: `${linhasOrdenadas.length} ${idioma === "pt" ? "lançamentos" : idioma === "es" ? "movimientos" : "entries"}`,
      colunas: [
        { header: t.origem, key: "origem", width: 2 }, { header: t.descricao, key: "descricao", width: 4 },
        { header: t.categoria, key: "categoria", width: 2 }, { header: t.centro, key: "centro", width: 3 },
        { header: t.valor, key: "valor", width: 2, align: "right" },
      ],
      linhas: linhasOrdenadas.map(l => ({ origem: LABEL_ORIGEM[l.tabela][idioma], descricao: l.descricao, categoria: l.categoria || "-", centro: l.centroNome, valor: fmt(l.valor) })),
      resumo: [{ label: t.totalGeral, valor: fmt(totalGeral) }],
      nomeArquivo: `axioma-centro-custo-${new Date().toISOString().slice(0, 10)}.pdf`,
    });
  }

  // ---------- GRÁFICOS ----------
  const [filtroGraficoCentro, setFiltroGraficoCentro] = useState<string | null>(null);
  useEffect(() => { setFiltroCentro(filtroGraficoCentro ? new Set([filtroGraficoCentro]) : null); }, [filtroGraficoCentro]);

  const totalPorCentro = useMemo(() => {
    const m = new Map<string, number>();
    linhasFiltradas.forEach(l => m.set(l.centroId || "sem-centro", (m.get(l.centroId || "sem-centro") || 0) + l.valor));
    return centros.map(c => ({ nome: c.nome, id: c.id, valor: m.get(c.id) || 0 })).filter(c => c.valor > 0).sort((a, b) => b.valor - a.valor);
  }, [linhasFiltradas, centros]);

  const optRanking = useMemo(() => {
    const top = totalPorCentro.slice(0, 8);
    return optBarrasH(top.map(c => c.valor), top.map(c => c.nome), VINHO, COBRE);
  }, [totalPorCentro]);

  const desvios = useMemo(() => {
    return centros.map(c => {
      const custo = totalPorCentro.find(x => x.id === c.id)?.valor || 0;
      const orcado = getOrcamentoCentro(c.id);
      return { nome: c.nome, desvio: orcado > 0 ? custo - orcado : 0, orcado };
    }).filter(d => d.orcado > 0).sort((a, b) => Math.abs(b.desvio) - Math.abs(a.desvio)).slice(0, 8);
  }, [totalPorCentro, centros, orcamentos]);
  const optDesvios = useMemo(() => optBarrasH(desvios.map(d => d.desvio), desvios.map(d => d.nome), VERMELHO, AMBAR, desvios.map(d => d.desvio >= 0 ? VERMELHO : VERDE)), [desvios]);

  const curvaABC = useMemo(() => {
    const total = totalPorCentro.reduce((s, c) => s + c.valor, 0);
    let acumulado = 0;
    return totalPorCentro.map(c => {
      acumulado += c.valor;
      const pct = total > 0 ? (acumulado / total) * 100 : 0;
      return { ...c, classe: pct <= 80 ? "A" : pct <= 95 ? "B" : "C" };
    });
  }, [totalPorCentro]);
  const optCurvaABC = useMemo(() => optBarrasH(
    curvaABC.map(c => c.valor), curvaABC.map(c => `${c.nome} (${c.classe})`), VINHO, COBRE,
    curvaABC.map(c => c.classe === "A" ? VINHO : c.classe === "B" ? COBRE : "#64748b"),
  ), [curvaABC]);

  const evolucaoMensal = useMemo(() => {
    const m = new Map<string, number>();
    linhasFiltradas.forEach(l => { if (l.data) m.set(l.data.slice(0, 7), (m.get(l.data.slice(0, 7)) || 0) + l.valor); });
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [linhasFiltradas]);
  const optEvolucao = useMemo(() => optBarrasH(evolucaoMensal.map(([, v]) => v), evolucaoMensal.map(([k]) => k), VINHO, COBRE), [evolucaoMensal]);

  const orcadoRealizadoMensal = useMemo(() => {
    const meses = evolucaoMensal.map(([k]) => k);
    const orcadoTotal = centros.reduce((s, c) => s + (c.orcamento_mensal || 0), 0);
    return { meses, orcado: meses.map(() => orcadoTotal) };
  }, [evolucaoMensal, centros]);
  const optOrcadoRealizado = useMemo(() => optBarrasComparativo(
    orcadoRealizadoMensal.orcado, evolucaoMensal.map(([, v]) => v), orcadoRealizadoMensal.meses, COBRE, VINHO, t.orcadoS, t.realizadoS,
  ), [orcadoRealizadoMensal, evolucaoMensal, t]);

  // ---------- FILTRO POPOVER (funil por coluna) ----------
  function valoresDistintos(coluna: ColunaId): { valor: string; label: string }[] {
    if (coluna === "tabela") return (["custos_fixos", "custos_variaveis", "contas_pagar"] as OrigemTabela[]).map(k => ({ valor: k, label: LABEL_ORIGEM[k][idioma] }));
    if (coluna === "categoria") { const s = new Set(linhas.map(l => l.categoria || "-")); return Array.from(s).sort().map(v => ({ valor: v, label: v })); }
    if (coluna === "centro") return centros.map(c => ({ valor: c.id, label: c.nome }));
    return [];
  }
  function filtroAtivo(coluna: ColunaId): Set<string> | null {
    if (coluna === "tabela") return filtroTabela;
    if (coluna === "categoria") return filtroCategoria;
    if (coluna === "centro") return filtroCentro;
    return null;
  }
  function alternarFiltro(coluna: ColunaId, valor: string) {
    const setters = { tabela: setFiltroTabela, categoria: setFiltroCategoria, centro: setFiltroCentro } as const;
    const setter = (setters as any)[coluna];
    if (!setter) return;
    setter((prev: Set<string> | null) => {
      const base = prev ? new Set(prev) : new Set(valoresDistintos(coluna).map(v => v.valor));
      if (base.has(valor)) base.delete(valor); else base.add(valor);
      return base;
    });
  }
  function limparFiltros() {
    setBusca(""); setFiltroTabela(null); setFiltroCategoria(null); setFiltroCentro(null); setFiltroGraficoCentro(null);
  }

  const corStatus = (status?: string) => status === "pago" ? VERDE : status === "vencido" ? VERMELHO : status === "parcial" ? AMBAR : "#5a7a9a";
  const labelHeader = (c: ColunaId) => (t as any)[c === "tabela" ? "origem" : c === "centro" ? "centro" : c === "fornecedor" ? "fornecedor" : c === "pctTotal" ? "pctTotal" : c];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder={t.buscar}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none flex-1 min-w-[160px]"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${VINHO}30`, color: "#c8d8f0" }} />
        <select value={agrupador} onChange={e => setAgrupador(e.target.value as Agrupador)}
          className="px-3 py-2 rounded-lg text-xs focus:outline-none" style={{ background: "rgba(10,22,40,0.95)", border: `1px solid ${VINHO}30`, color: "#c8d8f0" }}>
          <option value="nenhum">{t.semAgrupamento}</option>
          <option value="centro">{t.agruparPor}: {t.porCentro}</option>
          <option value="categoria">{t.agruparPor}: {t.porCategoria}</option>
          <option value="periodo">{t.agruparPor}: {t.porPeriodo}</option>
        </select>
        {(busca || filtroTabela || filtroCategoria || filtroCentro) && (
          <button onClick={limparFiltros} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: VERMELHO }}>{t.limparFiltros}</button>
        )}
        <div className="flex gap-1.5 ml-auto">
          <button onClick={exportarCSV} className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: `${VINHO}18`, color: VINHO }}><FileSpreadsheet size={13} />{t.exportarCSV}</button>
          <button onClick={exportarXLSX} className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: `${VINHO}18`, color: VINHO }}><FileSpreadsheet size={13} />{t.exportarXLSX}</button>
          <button onClick={exportarPDF} className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5" style={{ background: "#dc262618", color: "#dc2626" }}><Download size={13} />{t.exportarPDF}</button>
        </div>
      </div>

      {/* Grade */}
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${VINHO}25`, background: "rgba(10,22,40,0.8)" }}>
        <div ref={scrollRef} onScroll={e => setScrollTop(e.currentTarget.scrollTop)} style={{ maxHeight: ALTURA_VISIVEL, overflow: "auto", position: "relative" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <colgroup>{COLUNAS.map(c => <col key={c.id} style={{ width: c.largura }} />)}</colgroup>
            <thead>
              <tr>
                {COLUNAS.map((c, i) => (
                  <th key={c.id} style={{
                    position: "sticky", top: 0, left: i === 0 ? 0 : undefined, zIndex: i === 0 ? 3 : 2,
                    background: "#0a1628", borderBottom: `1px solid ${VINHO}40`, borderRight: "1px solid rgba(255,255,255,0.05)",
                    padding: "8px 10px", textAlign: "left",
                  }}>
                    <div className="flex items-center justify-between gap-1">
                      <button onClick={() => setOrdenacao(prev => ({ coluna: c.id, dir: prev?.coluna === c.id && prev.dir === "asc" ? "desc" : "asc" }))}
                        className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1" style={{ color: BORDO }}>
                        {c.letra} · {labelHeader(c.id)}
                        {ordenacao?.coluna === c.id && (ordenacao.dir === "asc" ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                      </button>
                      {["tabela", "categoria", "centro"].includes(c.id) && (
                        <button onClick={() => setColunaFiltroAberta(colunaFiltroAberta === c.id ? null : c.id)}>
                          <Filter size={11} style={{ color: filtroAtivo(c.id) ? VINHO : "#5a7a9a" }} />
                        </button>
                      )}
                    </div>
                    {colunaFiltroAberta === c.id && (
                      <div className="absolute mt-2 z-20 rounded-xl p-2 max-h-56 overflow-y-auto" style={{ background: "#0f1f38", border: `1px solid ${VINHO}40`, minWidth: 180, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px]" style={{ color: "#5a7a9a" }}>{t.filtrar}</span>
                          <button onClick={() => setColunaFiltroAberta(null)}><X size={12} style={{ color: "#5a7a9a" }} /></button>
                        </div>
                        {valoresDistintos(c.id).map(v => {
                          const ativo = filtroAtivo(c.id);
                          const marcado = !ativo || ativo.has(v.valor);
                          return (
                            <label key={v.valor} className="flex items-center gap-2 py-0.5 cursor-pointer">
                              <input type="checkbox" checked={marcado} onChange={() => alternarFiltro(c.id, v.valor)} />
                              <span className="text-xs truncate" style={{ color: "#c8d8f0" }}>{v.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr style={{ height: primeiroIdx * ALTURA_LINHA }}><td colSpan={COLUNAS.length} /></tr>
              {janelaRender.length === 0 && (
                <tr><td colSpan={COLUNAS.length} className="text-center py-10 text-xs" style={{ color: "#5a7a9a" }}>{t.nenhumResultado}</td></tr>
              )}
              {janelaRender.map((r, idx) => {
                if (r.tipo === "grupo") {
                  const colapsado = gruposColapsados.has(r.chave);
                  const corOrc = r.orcado > 0 ? (r.subtotal > r.orcado ? VERMELHO : r.subtotal > r.orcado * 0.85 ? AMBAR : VERDE) : "#5a7a9a";
                  return (
                    <tr key={`g-${r.chave}-${idx}`} style={{ height: ALTURA_LINHA, background: "rgba(159,18,57,0.08)", cursor: "pointer" }}
                      onClick={() => setGruposColapsados(prev => { const n = new Set(prev); n.has(r.chave) ? n.delete(r.chave) : n.add(r.chave); return n; })}>
                      <td colSpan={3} style={{ position: "sticky", left: 0, background: "#12233f", padding: "6px 10px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                        <span className="flex items-center gap-1.5 text-xs font-bold" style={{ color: VINHO }}>
                          {colapsado ? <ChevronRight size={13} /> : <ChevronDown size={13} />} {r.nome || "-"} <span style={{ color: "#5a7a9a", fontWeight: 400 }}>({r.qtd})</span>
                        </span>
                      </td>
                      <td style={{ padding: "6px 10px", fontWeight: 800, color: VINHO }}>{fmt(r.subtotal)}</td>
                      <td colSpan={r.orcado > 0 ? 1 : 5} style={{ padding: "6px 10px", fontSize: 11, color: "#5a7a9a" }}>
                        {r.orcado > 0 ? <span style={{ color: corOrc, fontWeight: 700 }}>{r.subtotal > r.orcado ? t.estourouOrcamento : t.dentroOrcamento}</span> : t.semOrcamento}
                      </td>
                      {r.orcado > 0 && <td colSpan={4} />}
                    </tr>
                  );
                }
                if (r.tipo === "subtotal") {
                  const corOrc = r.orcado > 0 ? (r.subtotal > r.orcado ? VERMELHO : r.subtotal > r.orcado * 0.85 ? AMBAR : VERDE) : "#5a7a9a";
                  return (
                    <tr key={`st-${idx}`} style={{ height: ALTURA_LINHA, background: "rgba(184,115,51,0.07)", borderTop: `1px solid ${COBRE}30` }}>
                      <td colSpan={3} style={{ position: "sticky", left: 0, background: "#0f1c30", padding: "6px 10px" }}>
                        <span className="text-xs font-bold" style={{ color: COBRE }}>{t.subtotal} — {r.nome}</span>
                      </td>
                      <td style={{ padding: "6px 10px", fontWeight: 800, color: COBRE }}>{fmt(r.subtotal)}</td>
                      <td colSpan={5} style={{ padding: "6px 10px", fontSize: 11, color: corOrc, fontWeight: r.orcado > 0 ? 700 : 400 }}>
                        {r.orcado > 0 ? `${fmt(r.orcado)} ${t.orcadoS.toLowerCase()}` : ""}
                      </td>
                    </tr>
                  );
                }
                if (r.tipo === "total") {
                  return (
                    <tr key="total" style={{ height: ALTURA_LINHA + 4, background: "rgba(159,18,57,0.18)", borderTop: `2px solid ${VINHO}` }}>
                      <td colSpan={3} style={{ position: "sticky", left: 0, background: "#1a0e17", padding: "8px 10px" }}>
                        <span className="text-sm font-black" style={{ color: BORDO }}>{t.totalGeral}</span>
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 900, fontSize: 13, color: BORDO }}>{fmt(totalGeral)}</td>
                      <td colSpan={5} />
                    </tr>
                  );
                }
                const l = r.linha;
                const selecionada = selecionados.has(l.id);
                const pctTotal = totalGeral > 0 ? (l.valor / totalGeral) * 100 : 0;
                return (
                  <tr key={l.id} onClick={(e) => clicarLinha(l.id, e)}
                    style={{ height: ALTURA_LINHA, background: selecionada ? "rgba(159,18,57,0.15)" : "transparent", cursor: "pointer" }}>
                    {/* A - Origem (com o número de linha usado no endereçamento de fórmula, ex: D3) */}
                    <td style={{ position: "sticky", left: 0, background: selecionada ? "#241220" : "#0d1a2e", padding: "4px 10px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                      <span className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono" style={{ color: "#3d4d63" }}>{r.numeroFormula}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${VINHO}18`, color: VINHO }}>{LABEL_ORIGEM[l.tabela][idioma]}</span>
                      </span>
                    </td>
                    {/* B - Descrição */}
                    <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "descricao"} valor={l.descricao} display={l.descricao}
                      onAbrir={() => abrirEdicao(l, "descricao")} onConfirmar={() => confirmarEdicao(l)}
                      valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id} tipo="texto" />
                    {/* C - Categoria */}
                    <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "categoria"} valor={l.categoria} display={l.categoria || "-"}
                      onAbrir={() => abrirEdicao(l, "categoria")} onConfirmar={() => confirmarEdicao(l)}
                      valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id}
                      tipo="select" opcoes={(categoriasPorTabela[l.tabela] || []).map(c => ({ value: c, label: c }))} />
                    {/* D - Valor */}
                    <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "valor"} valor={String(l.valor)} display={fmt(l.valor)}
                      onAbrir={() => abrirEdicao(l, "valor")} onConfirmar={() => confirmarEdicao(l)}
                      valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id}
                      tipo="valor" tooltipFormula={t.formulaTooltip}
                      erro={editando?.id === l.id && editando.coluna === "valor" ? erroEdicao : null} />
                    {/* E - Data */}
                    <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "data"}
                      valor={l.tabela === "custos_fixos" ? String(l.diaVencimento || "") : l.data}
                      display={l.tabela === "custos_fixos" ? `Dia ${l.diaVencimento || "-"}` : (l.data ? new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR") : "-")}
                      onAbrir={() => abrirEdicao(l, "data")} onConfirmar={() => confirmarEdicao(l)}
                      valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id}
                      tipo={l.tabela === "custos_fixos" ? "numero" : "data"} />
                    {/* F - Centro */}
                    <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "centro"} valor={l.centroId || ""} display={l.centroNome}
                      onAbrir={() => abrirEdicao(l, "centro")} onConfirmar={() => confirmarEdicao(l)}
                      valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id}
                      tipo="select" opcoes={centros.map(c => ({ value: c.id, label: c.nome }))} />
                    {/* G - Fornecedor */}
                    {l.tabela === "contas_pagar" ? (
                      <CelulaEditavel ativo={editando?.id === l.id && editando.coluna === "fornecedor"} valor={l.fornecedorId || ""} display={l.fornecedorNome || "-"}
                        onAbrir={() => abrirEdicao(l, "fornecedor")} onConfirmar={() => confirmarEdicao(l)}
                        valorEdicao={valorEdicao} setValorEdicao={setValorEdicao} onKeyDown={(e) => onKeyDownEdicao(e, l)} salvando={salvandoId === l.id}
                        tipo="select" opcoes={fornecedores.map(f => ({ value: f.id, label: f.nome }))} />
                    ) : <td style={{ padding: "4px 10px", color: "#3d4d63" }}>—</td>}
                    {/* H - Status (somente leitura) */}
                    {l.tabela === "contas_pagar" ? (
                      <td title={t.somenteLeitura} style={{ padding: "4px 10px" }}>
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold w-fit" style={{ background: `${corStatus(l.status)}18`, color: corStatus(l.status) }}>
                          <Lock size={9} /> {l.status || "-"}
                        </span>
                      </td>
                    ) : <td style={{ padding: "4px 10px", color: "#3d4d63" }}>—</td>}
                    {/* I - % do Total (viva) */}
                    <td style={{ padding: "4px 10px", fontSize: 11, color: "#5a7a9a" }}>{pctTotal.toFixed(1)}%</td>
                  </tr>
                );
              })}
              <tr style={{ height: Math.max(0, (listaRender.length - ultimoIdx)) * ALTURA_LINHA }}><td colSpan={COLUNAS.length} /></tr>
            </tbody>
          </table>
        </div>

        {/* Barra de status estilo Excel */}
        <div className="flex items-center justify-end gap-4 px-4 py-2 text-xs" style={{ borderTop: `1px solid ${VINHO}25`, background: "#0a1628", color: "#5a7a9a" }}>
          {estatisticasSelecao.qtd > 0 ? (
            <>
              <span>{estatisticasSelecao.qtd} {estatisticasSelecao.qtd === 1 ? t.linhaSelecionada : t.linhasSelecionadas}</span>
              <span>{t.soma}: <b style={{ color: "#c8d8f0" }}>{fmt(estatisticasSelecao.soma)}</b></span>
              <span>{t.media}: <b style={{ color: "#c8d8f0" }}>{fmt(estatisticasSelecao.media)}</b></span>
              <span>{t.contagem}: <b style={{ color: "#c8d8f0" }}>{estatisticasSelecao.qtd}</b></span>
            </>
          ) : <span>{linhasOrdenadas.length} · {t.totalGeral}: <b style={{ color: "#c8d8f0" }}>{fmt(totalGeral)}</b></span>}
        </div>
      </div>

      {/* Gráficos interativos — clicar numa barra de centro filtra a planilha */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {[
          { titulo: t.rankingCentros, opt: optRanking, vazio: totalPorCentro.length === 0, onClick: (nome: string) => setFiltroGraficoCentro(totalPorCentro.find(c => c.nome === nome)?.id || null) },
          { titulo: t.maioresDesvios, opt: optDesvios, vazio: desvios.length === 0, onClick: (nome: string) => setFiltroGraficoCentro(centros.find(c => c.nome === nome)?.id || null) },
          { titulo: t.curvaABC, opt: optCurvaABC, vazio: curvaABC.length === 0 },
          { titulo: t.evolucaoMensal, opt: optEvolucao, vazio: evolucaoMensal.length === 0 },
        ].map((g, i) => (
          <div key={i} className="rounded-2xl p-3" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${VINHO}20` }}>
            <p className="text-xs font-black mb-2" style={{ color: BORDO }}>{g.titulo}</p>
            {g.vazio ? <p className="text-xs py-10 text-center" style={{ color: "#5a7a9a" }}>{t.semDados}</p> : (
              <ReactECharts option={g.opt} style={{ height: 240 }} notMerge lazyUpdate
                onEvents={g.onClick ? { click: (p: any) => g.onClick!(p.name) } : undefined} />
            )}
          </div>
        ))}
        <div className="rounded-2xl p-3 lg:col-span-2" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${VINHO}20` }}>
          <p className="text-xs font-black mb-2" style={{ color: BORDO }}>{t.orcadoRealizado}</p>
          {evolucaoMensal.length === 0 ? <p className="text-xs py-10 text-center" style={{ color: "#5a7a9a" }}>{t.semDados}</p> : (
            <ReactECharts option={optOrcadoRealizado} style={{ height: 260 }} notMerge lazyUpdate />
          )}
        </div>
      </div>
      {filtroGraficoCentro && (
        <button onClick={() => setFiltroGraficoCentro(null)} className="text-xs underline" style={{ color: VINHO }}>
          {idioma === "pt" ? "Limpar filtro do gráfico" : idioma === "es" ? "Limpiar filtro del gráfico" : "Clear chart filter"}
        </button>
      )}
    </div>
  );
}

// ---------- Célula editável genérica ----------
function CelulaEditavel(props: {
  ativo: boolean; valor: string; display: string;
  onAbrir: () => void; onConfirmar: () => void;
  valorEdicao: string; setValorEdicao: (v: string) => void; onKeyDown: (e: React.KeyboardEvent) => void;
  salvando: boolean; tipo: "texto" | "numero" | "data" | "select" | "valor";
  opcoes?: { value: string; label: string }[]; tooltipFormula?: string; erro?: string | null;
}) {
  const { ativo, display, onAbrir, onConfirmar, valorEdicao, setValorEdicao, onKeyDown, salvando, tipo, opcoes, tooltipFormula, erro } = props;
  if (!ativo) {
    return (
      <td onDoubleClick={onAbrir} onClick={(e) => { e.stopPropagation(); }}
        style={{ padding: "4px 10px", color: "#c8d8f0", fontSize: 12, cursor: "text", opacity: salvando ? 0.5 : 1 }}
        title={tipo === "valor" ? tooltipFormula : undefined}>
        <span className="flex items-center gap-1">
          {display}
          {tipo === "valor" && <Pencil size={9} style={{ color: "#3d4d63", flexShrink: 0 }} />}
        </span>
      </td>
    );
  }
  return (
    <td style={{ padding: "2px 4px" }}>
      {tipo === "select" ? (
        <select autoFocus value={valorEdicao} onChange={e => setValorEdicao(e.target.value)} onBlur={onConfirmar} onKeyDown={onKeyDown}
          className="w-full px-2 py-1 rounded text-xs focus:outline-none" style={{ background: "#0f1f38", border: `1px solid ${VINHO}`, color: "#c8d8f0" }}>
          <option value="">-</option>
          {opcoes?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input autoFocus value={valorEdicao} onChange={e => setValorEdicao(e.target.value)} onBlur={onConfirmar} onKeyDown={onKeyDown}
          type={tipo === "data" ? "date" : tipo === "numero" ? "number" : "text"}
          className="w-full px-2 py-1 rounded text-xs focus:outline-none" style={{ background: "#0f1f38", border: `1px solid ${VINHO}`, color: "#c8d8f0" }} />
      )}
      {erro && <p className="text-[9px] mt-0.5" style={{ color: "#f87171" }}>{erro}</p>}
    </td>
  );
}
