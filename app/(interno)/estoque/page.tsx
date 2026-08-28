"use client";
import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import {
  Search, Pencil, Trash2, X, AlertTriangle, Truck, ImagePlus, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Share2, ScanBarcode,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../../../lib/LanguageContext";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela, textoResumoPdf, textoDetalhadoPdf, type ArgsPdfTabela } from "../../../lib/gerarPdfTabela";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";
import { fBRL, fBRL2, optBarrasComparativo, optRosca, optBarrasH, FONTE_EXEC, precoPorMarkup, margemReal } from "../../../lib/cfoCore";
import { comprimirImagem } from "../../../lib/imagemHelpers";
import { useLeitorCodigoBarras } from "../../../lib/estoqueDeviceAdapter";
import {
  type Produto, type MovimentacaoComProduto, type EstoqueLote, type AvisoEstoque, type AvisoValidade,
  type KpisEstoque, type ComposicaoItem, type EvolucaoMes, type TipoMovimentacao,
  type CampoPersonalizadoEmpresa, type ItemGiro, type ItemCurvaABC, type ItemCapitalImobilizado,
  type ItemRentabilidade, type FornecedorComparativo, type AlertaReposicao, type ContagemSegmento,
  PAGE_SIZE, listarProdutos, criarProduto, atualizarProduto, excluirProduto, buscarProdutoPorCodigo,
  listarMovimentacoes, criarMovimentacao, atualizarMovimentacao, excluirMovimentacao, confirmarRecebimento,
  listarLotesProduto, sugerirConsumoFefo,
  carregarAvisosEstoque, carregarAvisosValidade, carregarKpisEstoque,
  carregarComposicaoPorCategoria, carregarComposicaoPorFornecedor, carregarEvolucaoEstoque,
  listarFornecedoresParaDropdown, listarCentrosCustoParaDropdown,
  uploadImagemProduto, urlImagemProduto, carregarConfigEstoqueEmpresa, definirSegmentoPadraoEmpresa,
  adicionarCampoPersonalizado, removerCampoPersonalizado, MAX_CAMPOS_PERSONALIZADOS, carregarContagemPorSegmento,
  carregarGiroEstoque, carregarCurvaABC, carregarCapitalImobilizado,
  carregarRentabilidadePorCategoria, carregarRentabilidadePorFornecedor, carregarRentabilidadePorMarca,
  carregarComparativoFornecedores, calcularAlertasReposicao,
  atualizarProdutosEmLote, exportarProdutosExcel, exportarProdutosCsv, importarProdutosArquivo,
  type ConsultaEanResposta, consultarEan,
} from "../../../lib/estoqueHelpers";
import {
  type Segmento, SEGMENTOS, CAMPOS_CONDICIONAIS_POR_SEGMENTO, CHAVE_PERECIVEL, sugerirCategoria, registrarAprendizadoCategoria,
} from "../../../lib/categoriaInteligente";
import { gerarEtiquetasPDF } from "../../../lib/etiquetaHelpers";
import { buscarSugestoesColuna, buscarSugestoesAtributo, buscarCombosLocalizacao, type ColunaComSugestao, type ComboLocalizacao } from "../../../lib/sugestaoInteligente";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Identidade visual do módulo — jade/verde-mineral + acento bronze
const JADE = "#047857";
const JADE_ESCURO = "#065f46";
const BRONZE = "#a16207";
const POSITIVO = "#34d399";
const NEGATIVO = "#f87171";
const NEUTRO = "#6ab0ff";
const ATENCAO = "#f59e0b";

const inputCls = "w-full px-3 py-2.5 rounded-xl focus:outline-none text-sm";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: `1px solid rgba(4,120,87,0.25)`, color: "#c8d8f0" };
const selectStyle = { background: "rgba(10,22,40,0.95)", border: `1px solid rgba(4,120,87,0.25)`, color: "#c8d8f0" };
const labelCls = "text-xs font-semibold mb-1 block";
const labelStyle = { color: BRONZE };

function Campo({ label, value, onChange, tipo = "text", placeholder, onKeyDown, onBlur, onFocus, readOnly, lista, dica }: {
  label: string; value: string; onChange?: (v: string) => void; tipo?: string; placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; onBlur?: () => void; onFocus?: () => void; readOnly?: boolean; lista?: string[]; dica?: string;
}) {
  const listId = lista ? `dl-${label.replace(/\s/g, "")}` : undefined;
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <input type={tipo} value={value} onChange={(e) => onChange?.(e.target.value)} onKeyDown={onKeyDown} onBlur={onBlur} onFocus={onFocus}
        readOnly={readOnly} placeholder={placeholder} className={inputCls}
        style={{ ...inputStyle, opacity: readOnly ? 0.6 : 1 }} list={listId} />
      {lista && (
        <datalist id={listId}>
          {lista.map((o) => <option key={o} value={o} />)}
        </datalist>
      )}
      {dica && <p className="text-[10px] mt-0.5 italic" style={{ color: "#5a7a9a" }}>{dica}</p>}
    </div>
  );
}
// Moeda com 2 casas sempre visíveis (fBRL do cfoCore corta pra inteiro de
// propósito nos dashboards executivos — aqui, na lista/ficha de Produtos, o
// usuário precisa ver o centavo exato).
const moeda = (n: number | null | undefined) => `R$ ${fBRL2(n || 0)}`;

// Aceita vírgula OU ponto como decimal (e ponto como separador de milhar
// quando junto com vírgula, ex: "1.234,56") — o <input type="number"> nativo
// rejeita vírgula em vários navegadores e descartava os centavos digitados.
function parseMoeda(texto: string): number | null {
  const limpo = texto.trim().replace(/[^\d.,-]/g, "");
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = parseFloat(normalizado);
  return isNaN(n) ? null : Math.round(n * 100) / 100;
}

function CampoMoeda({ label, valor, onChange, dica }: {
  label: string; valor: number | null | undefined; onChange: (v: number | null) => void; dica?: string;
}) {
  const [texto, setTexto] = useState(valor != null ? valor.toFixed(2).replace(".", ",") : "");
  const [focado, setFocado] = useState(false);
  useEffect(() => {
    if (!focado) setTexto(valor != null ? valor.toFixed(2).replace(".", ",") : "");
  }, [valor, focado]);
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <input type="text" inputMode="decimal" value={texto}
        onFocus={() => setFocado(true)}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => {
          setFocado(false);
          const numero = parseMoeda(texto);
          setTexto(numero != null ? numero.toFixed(2).replace(".", ",") : "");
          onChange(numero);
        }}
        placeholder="0,00" className={inputCls} style={inputStyle} />
      {dica && <p className="text-[10px] mt-0.5 italic" style={{ color: "#5a7a9a" }}>{dica}</p>}
    </div>
  );
}

function CampoSelect({ label, value, onChange, opcoes, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; opcoes: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} style={selectStyle}>
        <option value="">{placeholder || "--"}</option>
        {opcoes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function CampoTextarea({ label, value, onChange, linhas = 2 }: { label: string; value: string; onChange: (v: string) => void; linhas?: number }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={linhas} className={`${inputCls} resize-none`} style={inputStyle} />
    </div>
  );
}
function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-black uppercase tracking-wider mt-5 mb-2 first:mt-0" style={{ color: JADE }}>{children}</h4>;
}

function SecaoColapsavel({ titulo, aberta, onToggle, children }: { titulo: string; aberta: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-1.5 mt-5 mb-2 first:mt-0">
        <h4 className="text-xs font-black uppercase tracking-wider" style={{ color: JADE }}>{titulo}</h4>
        {aberta ? <ChevronUp size={14} style={{ color: JADE }} /> : <ChevronDown size={14} style={{ color: JADE }} />}
      </button>
      {aberta && children}
    </div>
  );
}

function ModalPremium({ aberto, onFechar, titulo, children, largo }: {
  aberto: boolean; onFechar: () => void; titulo: string; children: React.ReactNode; largo?: boolean;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
            className={largo ? "w-full max-w-2xl" : "w-full max-w-md"}>
            <CanvasBox cor={JADE}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
                  <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
              </div>
              {children}
            </CanvasBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Paginacao({ pagina, total, onMudar, et }: { pagina: number; total: number; onMudar: (p: number) => void; et: any }) {
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <div className="flex items-center justify-between mt-4 text-xs" style={{ color: "#5a7a9a" }}>
      <span>{total} {total === 1 ? et.paginacaoRegistro : et.paginacaoRegistros} — {et.paginacaoPagina} {pagina + 1} {et.paginacaoDe} {totalPaginas}</span>
      <div className="flex gap-2">
        <button onClick={() => onMudar(Math.max(0, pagina - 1))} disabled={pagina === 0}
          className="p-1.5 rounded-lg disabled:opacity-30" style={{ background: "rgba(4,120,87,0.12)" }}><ChevronLeft size={16} /></button>
        <button onClick={() => onMudar(Math.min(totalPaginas - 1, pagina + 1))} disabled={pagina >= totalPaginas - 1}
          className="p-1.5 rounded-lg disabled:opacity-30" style={{ background: "rgba(4,120,87,0.12)" }}><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

const UNIDADES = ["UN", "CX", "KG", "L", "PC", "PAR", "M", "M2", "M3"];

export default function EstoquePage() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const et = t.estoque;
  const [userId, setUserId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"painel" | "produtos" | "movimentacoes" | "avisos" | "inteligencia" | "copiloto">("painel");
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" | "info" } | null>(null);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);

  const [fornecedoresDrop, setFornecedoresDrop] = useState<{ id: string; nome: string }[]>([]);
  const [centrosCustoDrop, setCentrosCustoDrop] = useState<{ id: string; nome: string }[]>([]);

  const TIPOS_MOV: { value: TipoMovimentacao; label: string; cor: string }[] = [
    { value: "entrada", label: et.tipoEntrada, cor: POSITIVO },
    { value: "saida", label: et.tipoSaida, cor: NEGATIVO },
    { value: "transferencia", label: et.tipoTransferencia, cor: NEUTRO },
    { value: "perda", label: et.tipoPerda, cor: NEGATIVO },
    { value: "ajuste", label: et.tipoAjuste, cor: ATENCAO },
    { value: "inventario", label: et.tipoInventario, cor: ATENCAO },
    { value: "devolucao", label: et.tipoDevolucao, cor: NEUTRO },
  ];

  const SEVERIDADE_LABEL: Record<string, string> = {
    vencido: et.sevVencido, ultimo_dia: et.sevUltimoDia, critico_7: et.sevCritico7,
    atencao_30: et.sevAtencao30, aviso_60: et.sevAviso60, monitorar_90: et.sevMonitorar90, ok: et.sevOk,
  };

  // ---- Produtos ----
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [paginaProdutos, setPaginaProdutos] = useState(0);
  const [buscaProdutos, setBuscaProdutos] = useState("");
  const [filtroStatusProdutos, setFiltroStatusProdutos] = useState<"ativo" | "inativo" | "todos">("ativo");
  const [filtroSegmento, setFiltroSegmento] = useState<string>("todos");
  const [contagemSegmentos, setContagemSegmentos] = useState<ContagemSegmento[]>([]);
  const [gruposFechados, setGruposFechados] = useState<Set<string>>(new Set());
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [formProduto, setFormProduto] = useState<Partial<Produto>>({});
  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [comprimindoImagem, setComprimindoImagem] = useState(false);
  const [categoriaSugerida, setCategoriaSugerida] = useState<string | null>(null);

  // ---- Calculadora de preço (custo de cadastro + markup → preço sugerido) ----
  // Preço Sugerido é 100% derivado (custo × (1 + markup/100)) — nunca editado
  // direto, por isso não existe mais estado de "override manual" aqui.
  const [markupPct, setMarkupPct] = useState("");

  // ---- Lote inicial (produto perecível novo) ----
  const [loteInicial, setLoteInicial] = useState({ numero_lote: "", data_fabricacao: "", data_validade: "", quantidade: "", custo_unitario: "" });

  // ---- Camaleão (config da empresa) ----
  const [empresaSegmentoPadrao, setEmpresaSegmentoPadrao] = useState<string | null>(null);
  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizadoEmpresa[]>([]);
  const [mostrarNovoCampo, setMostrarNovoCampo] = useState(false);
  const [novoCampoNome, setNovoCampoNome] = useState("");
  const [novoCampoTipo, setNovoCampoTipo] = useState<"text" | "number" | "date">("text");
  const [secaoCamposNichoAberta, setSecaoCamposNichoAberta] = useState(true);
  const [secaoFiscalAberta, setSecaoFiscalAberta] = useState(true);

  // ---- Auto-cadastro por EAN (Cosmos) ----
  const [consultandoEan, setConsultandoEan] = useState(false);

  // ---- Sugestão inteligente (autocomplete por histórico) ----
  const [sugestoes, setSugestoes] = useState<Record<string, string[]>>({});
  const [combosLocalizacao, setCombosLocalizacao] = useState<ComboLocalizacao[]>([]);

  // ---- Inteligência (Fase 2) ----
  const [giroEstoque, setGiroEstoque] = useState<ItemGiro[]>([]);
  const [curvaAbc, setCurvaAbc] = useState<ItemCurvaABC[]>([]);
  const [capitalImobilizado, setCapitalImobilizado] = useState<ItemCapitalImobilizado[]>([]);
  const [rentabilidadeCategoria, setRentabilidadeCategoria] = useState<ItemRentabilidade[]>([]);
  const [rentabilidadeFornecedor, setRentabilidadeFornecedor] = useState<ItemRentabilidade[]>([]);
  const [rentabilidadeMarca, setRentabilidadeMarca] = useState<ItemRentabilidade[]>([]);
  const [comparativoFornecedores, setComparativoFornecedores] = useState<FornecedorComparativo[]>([]);
  const [alertasReposicao, setAlertasReposicao] = useState<AlertaReposicao[]>([]);

  // ---- Automações ----
  const [produtosSelecionados, setProdutosSelecionados] = useState<Set<string>>(new Set());
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [formLote, setFormLote] = useState<Partial<Produto>>({});
  const [salvandoLote, setSalvandoLote] = useState(false);
  const [importando, setImportando] = useState(false);
  const [gerandoEtiquetas, setGerandoEtiquetas] = useState(false);

  // ---- Movimentações ----
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComProduto[]>([]);
  const [totalMovimentacoes, setTotalMovimentacoes] = useState(0);
  const [paginaMovimentacoes, setPaginaMovimentacoes] = useState(0);
  const [filtroTipoMov, setFiltroTipoMov] = useState<TipoMovimentacao | "todos">("todos");
  const [modalMovAberto, setModalMovAberto] = useState(false);
  const [movEditando, setMovEditando] = useState<MovimentacaoComProduto | null>(null);
  const [formMov, setFormMov] = useState<any>({});
  const [salvandoMov, setSalvandoMov] = useState(false);
  const [buscaProdutoMov, setBuscaProdutoMov] = useState("");
  const [resultadosProdutoMov, setResultadosProdutoMov] = useState<Produto[]>([]);
  const [produtoSelecionadoMov, setProdutoSelecionadoMov] = useState<Produto | null>(null);
  const [lotesProdutoMov, setLotesProdutoMov] = useState<EstoqueLote[]>([]);

  // ---- Painel ----
  const [kpis, setKpis] = useState<KpisEstoque | null>(null);
  const [composicaoCategoria, setComposicaoCategoria] = useState<ComposicaoItem[]>([]);
  const [composicaoFornecedor, setComposicaoFornecedor] = useState<ComposicaoItem[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoMes[]>([]);
  const [avisosValidadeResumo, setAvisosValidadeResumo] = useState<AvisoValidade[]>([]);

  // ---- Avisos ----
  const [avisosEstoque, setAvisosEstoque] = useState<AvisoEstoque[]>([]);
  const [avisosValidade, setAvisosValidade] = useState<AvisoValidade[]>([]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" | "info" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => { inicializar(); }, []);

  async function inicializar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setUserId(user.id);
    const empId = await obterEmpresaAtiva();
    setEmpresaId(empId);
    if (empId) {
      const [fs, cs, config] = await Promise.all([
        listarFornecedoresParaDropdown(empId), listarCentrosCustoParaDropdown(empId), carregarConfigEstoqueEmpresa(empId),
      ]);
      setFornecedoresDrop(fs); setCentrosCustoDrop(cs);
      setEmpresaSegmentoPadrao(config.segmentoPadrao);
      setCamposPersonalizados(config.camposPersonalizados);
      const segmentoSalvo = typeof window !== "undefined" ? window.localStorage.getItem(`axioma_estoque_segmento_${empId}`) : null;
      if (segmentoSalvo) setFiltroSegmento(segmentoSalvo);
    }
    setCarregando(false);
  }

  function selecionarSegmento(valor: string) {
    setFiltroSegmento(valor);
    setPaginaProdutos(0);
    if (empresaId && typeof window !== "undefined") window.localStorage.setItem(`axioma_estoque_segmento_${empresaId}`, valor);
  }

  // ---- Carregamento por aba (evita buscar tudo de uma vez) ----
  const carregarProdutos = useCallback(async () => {
    if (!empresaId) return;
    const { dados, total } = await listarProdutos(empresaId, {
      pagina: paginaProdutos, busca: buscaProdutos, status: filtroStatusProdutos,
      segmento: filtroSegmento, segmentoPadraoEmpresa: empresaSegmentoPadrao,
    });
    setProdutos(dados); setTotalProdutos(total);
    const contagem = await carregarContagemPorSegmento(empresaId);
    setContagemSegmentos(contagem);
  }, [empresaId, paginaProdutos, buscaProdutos, filtroStatusProdutos, filtroSegmento, empresaSegmentoPadrao]);

  const carregarMovimentacoes = useCallback(async () => {
    if (!empresaId) return;
    const { dados, total } = await listarMovimentacoes(empresaId, { pagina: paginaMovimentacoes, tipo: filtroTipoMov === "todos" ? undefined : filtroTipoMov });
    setMovimentacoes(dados); setTotalMovimentacoes(total);
  }, [empresaId, paginaMovimentacoes, filtroTipoMov]);

  const carregarPainel = useCallback(async () => {
    if (!empresaId) return;
    const [k, cat, forn, evo, val] = await Promise.all([
      carregarKpisEstoque(empresaId), carregarComposicaoPorCategoria(empresaId),
      carregarComposicaoPorFornecedor(empresaId), carregarEvolucaoEstoque(empresaId, 6),
      carregarAvisosValidade(empresaId),
    ]);
    setKpis(k); setComposicaoCategoria(cat); setComposicaoFornecedor(forn); setEvolucao(evo);
    setAvisosValidadeResumo(val);
  }, [empresaId]);

  const carregarAvisos = useCallback(async () => {
    if (!empresaId) return;
    const [ae, av] = await Promise.all([carregarAvisosEstoque(empresaId), carregarAvisosValidade(empresaId)]);
    setAvisosEstoque(ae); setAvisosValidade(av);
  }, [empresaId]);

  const carregarInteligencia = useCallback(async () => {
    if (!empresaId) return;
    const [giro, abc, capital, rentCat, rentForn, rentMarca, comparativo] = await Promise.all([
      carregarGiroEstoque(empresaId), carregarCurvaABC(empresaId), carregarCapitalImobilizado(empresaId),
      carregarRentabilidadePorCategoria(empresaId), carregarRentabilidadePorFornecedor(empresaId), carregarRentabilidadePorMarca(empresaId),
      carregarComparativoFornecedores(empresaId),
    ]);
    setGiroEstoque(giro); setCurvaAbc(abc); setCapitalImobilizado(capital);
    setRentabilidadeCategoria(rentCat); setRentabilidadeFornecedor(rentForn); setRentabilidadeMarca(rentMarca);
    setComparativoFornecedores(comparativo);
    setAlertasReposicao(calcularAlertasReposicao(giro));
  }, [empresaId]);

  useEffect(() => { if (aba === "produtos") carregarProdutos(); }, [aba, carregarProdutos]);
  useEffect(() => { if (aba === "movimentacoes") carregarMovimentacoes(); }, [aba, carregarMovimentacoes]);
  useEffect(() => { if (aba === "painel") carregarPainel(); }, [aba, carregarPainel]);
  useEffect(() => { if (aba === "avisos") carregarAvisos(); }, [aba, carregarAvisos]);
  useEffect(() => { if (aba === "inteligencia" || aba === "copiloto") carregarInteligencia(); }, [aba, carregarInteligencia]);

  // ---- Agrupamento visual da lista de Produtos: Segmento → Categoria ----
  // Só reorganiza o que já veio da página atual (30 produtos, já filtrados
  // pelo servidor) — nunca é um recálculo/soma pesada no navegador, é só
  // agrupamento de exibição. Multi-tenant já foi resolvido na consulta.
  type GrupoCategoria = { categoria: string; produtos: Produto[] };
  type GrupoSegmento = { segmento: string; label: string; categorias: GrupoCategoria[] };

  const gruposProdutos = useMemo<GrupoSegmento[]>(() => {
    const porSegmento = new Map<string, Produto[]>();
    for (const p of produtos) {
      const seg = p.segmento || empresaSegmentoPadrao || "generico";
      if (!porSegmento.has(seg)) porSegmento.set(seg, []);
      porSegmento.get(seg)!.push(p);
    }
    const grupos = Array.from(porSegmento.entries()).map(([seg, lista]) => {
      const porCategoria = new Map<string, Produto[]>();
      for (const p of lista) {
        const cat = p.categoria?.trim() || "—";
        if (!porCategoria.has(cat)) porCategoria.set(cat, []);
        porCategoria.get(cat)!.push(p);
      }
      const segInfo = SEGMENTOS.find((s) => s.value === seg);
      return {
        segmento: seg,
        label: segInfo ? segInfo.label[idioma] : seg,
        categorias: Array.from(porCategoria.entries())
          .map(([categoria, lista2]) => ({ categoria, produtos: lista2 }))
          .sort((a, b) => a.categoria.localeCompare(b.categoria)),
      };
    });
    return grupos.sort((a, b) => a.label.localeCompare(b.label));
  }, [produtos, empresaSegmentoPadrao, idioma]);

  function toggleGrupo(chave: string) {
    setGruposFechados((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave); else novo.add(chave);
      return novo;
    });
  }

  function linhaProduto(p: Produto) {
    return (
      <tr key={p.id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
        <td className="py-2 px-3">
          <input type="checkbox" className="w-4 h-4 rounded" checked={produtosSelecionados.has(p.id)} onChange={() => toggleSelecionado(p.id)} />
        </td>
        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg relative overflow-hidden flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(4,120,87,0.25)" }}>
              <ImagePlus size={14} style={{ color: "#5a7a9a" }} />
              {p.imagem_principal && (
                <img src={urlImagemProduto(p.imagem_principal)} alt="" className="absolute inset-0 w-8 h-8 object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none"; }} />
              )}
            </div>
            {p.nome}
          </div>
        </td>
        <td className="py-2 px-3" style={{ color: "#94a3b8" }}>{p.codigo_interno || p.codigo_barras || "—"}</td>
        <td className="py-2 px-3" style={{ color: "#94a3b8" }}>{p.categoria || "—"}</td>
        <td className="py-2 px-3 text-right font-semibold" style={{ color: p.saldo_disponivel <= 0 ? NEGATIVO : p.saldo_disponivel <= p.estoque_minimo ? ATENCAO : "#c8d8f0" }}>{p.saldo_disponivel}</td>
        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{moeda(p.preco_medio)}</td>
        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{moeda(p.preco_venda ?? p.preco_sugerido)}</td>
        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: p.status === "ativo" ? "rgba(52,211,153,0.15)" : "rgba(90,122,154,0.15)", color: p.status === "ativo" ? POSITIVO : "#5a7a9a" }}>{p.status === "ativo" ? et.statusAtivo : et.statusInativo}</span></td>
        <td className="py-2 px-3 text-right">
          <button onClick={() => abrirModalProduto(p)} className="p-1.5 rounded-lg mr-1" style={{ color: NEUTRO }}><Pencil size={15} /></button>
          <button onClick={() => excluirProdutoHandler(p)} className="p-1.5 rounded-lg" style={{ color: NEGATIVO }}><Trash2 size={15} /></button>
        </td>
      </tr>
    );
  }

  function linhaGrupo(chave: string, nivel: 1 | 2, texto: string) {
    return (
      <tr key={chave} className="cursor-pointer select-none" onClick={() => toggleGrupo(chave)}
        style={{ background: nivel === 1 ? "rgba(4,120,87,0.12)" : "rgba(255,255,255,0.03)" }}>
        <td colSpan={9} className={`py-${nivel === 1 ? "2" : "1.5"} px-3 font-bold text-xs`} style={{ color: nivel === 1 ? BRONZE : "#94a3b8", paddingLeft: nivel === 1 ? 12 : 30 }}>
          <span className="inline-flex items-center gap-1.5 uppercase tracking-wide">
            {gruposFechados.has(chave) ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
            {texto}
          </span>
        </td>
      </tr>
    );
  }

  // ---- Leitor de código de barras — busca/scan no mesmo campo da lista de Produtos ----
  const leitorProdutos = useLeitorCodigoBarras(async (codigo) => {
    if (!empresaId) return;
    const encontrado = await buscarProdutoPorCodigo(empresaId, codigo);
    if (encontrado) abrirModalProduto(encontrado);
    else setBuscaProdutos(codigo);
  });

  // ================= PRODUTOS =================
  function abrirModalProduto(produto?: Produto) {
    setProdutoEditando(produto || null);
    setFormProduto(produto ? { ...produto } : { unidade: "UN", status: "ativo", estoque_minimo: 0, atributos_nicho: {} });
    setArquivoImagem(null);
    setPreviewImagem((old) => { if (old) URL.revokeObjectURL(old); return null; });
    setCategoriaSugerida(null);
    const custoAtual = produto?.preco_custo || 0;
    setMarkupPct(custoAtual > 0 && produto?.preco_sugerido ? (((produto.preco_sugerido - custoAtual) / custoAtual) * 100).toFixed(1) : "");
    setLoteInicial({ numero_lote: "", data_fabricacao: "", data_validade: "", quantidade: "", custo_unitario: "" });
    setSugestoes({});
    setCombosLocalizacao([]);
    if (empresaId) buscarCombosLocalizacao(empresaId).then(setCombosLocalizacao);
    setModalProdutoAberto(true);
  }

  // Busca a sugestão só quando o campo é focado (não ao abrir o modal
  // inteiro) e guarda em cache — foco repetido no mesmo campo não refaz a
  // consulta. Digitação livre nunca é bloqueada: é só um <datalist>.
  function garantirSugestaoColuna(coluna: ColunaComSugestao) {
    const chaveCache = `col:${coluna}`;
    if (!empresaId || sugestoes[chaveCache] !== undefined) return;
    setSugestoes((s) => ({ ...s, [chaveCache]: [] }));
    buscarSugestoesColuna(empresaId, coluna).then((valores) => setSugestoes((s) => ({ ...s, [chaveCache]: valores })));
  }

  function garantirSugestaoAtributo(chaveAtributo: string) {
    const chaveCache = `attr:${chaveAtributo}`;
    if (!empresaId || sugestoes[chaveCache] !== undefined) return;
    setSugestoes((s) => ({ ...s, [chaveCache]: [] }));
    buscarSugestoesAtributo(empresaId, chaveAtributo).then((valores) => setSugestoes((s) => ({ ...s, [chaveCache]: valores })));
  }

  function aplicarComboLocalizacao(combo: ComboLocalizacao) {
    setFormProduto((f) => ({ ...f, rua: combo.rua, prateleira: combo.prateleira, nivel: combo.nivel, posicao: combo.posicao }));
  }

  async function handleConsultarEan() {
    const ean = (formProduto.codigo_barras || "").trim();
    if (!ean || consultandoEan) return;
    setConsultandoEan(true);
    try {
      const r: ConsultaEanResposta = await consultarEan(ean);
      if (r.status === "nao_configurado") { mostrarToast(et.toastEanNaoConfigurado, "info"); return; }
      if (r.status === "nao_encontrado") { mostrarToast(et.toastEanNaoEncontrado, "info"); return; }
      if (r.status === "erro") { mostrarToast(r.mensagem || et.toastEanErro, "erro"); return; }

      setFormProduto((f) => ({
        ...f,
        nome: r.nome ?? f.nome,
        marca: r.marca ?? f.marca,
        categoria: r.categoria ?? f.categoria,
        ncm: r.ncm ?? f.ncm,
        peso: r.peso ?? f.peso,
        altura: r.altura ?? f.altura,
        largura: r.largura ?? f.largura,
        comprimento: r.comprimento ?? f.comprimento,
        ipi: r.ipi ?? f.ipi,
        icms: r.icms ?? f.icms,
        pis: r.pis ?? f.pis,
        cofins: r.cofins ?? f.cofins,
      }));

      if (r.imagemBase64) {
        try {
          const blob = await (await fetch(r.imagemBase64)).blob();
          const arquivo = new File([blob], `ean-${ean}.jpg`, { type: blob.type || "image/jpeg" });
          const comprimido = await comprimirImagem(arquivo);
          setArquivoImagem(comprimido);
          setPreviewImagem((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(comprimido); });
        } catch {
          // imagem é enriquecimento — o resto dos dados já preencheu, não trava por isso
        }
      }
      mostrarToast(et.toastEanPreenchido, "ok");
    } finally {
      setConsultandoEan(false);
    }
  }

  function aplicarCalculoPreco(custo: number, markup: number) {
    setFormProduto((f) => ({ ...f, preco_sugerido: precoPorMarkup(custo, markup) }));
  }

  const segmentoEfetivo = ((formProduto.segmento || empresaSegmentoPadrao || "generico") as Segmento);

  async function sugerirCategoriaSeVazia() {
    if (!empresaId || formProduto.categoria || !formProduto.nome?.trim()) return;
    const sugestao = await sugerirCategoria(empresaId, segmentoEfetivo, formProduto.nome, idioma);
    if (sugestao) {
      setCategoriaSugerida(sugestao);
      setFormProduto((f) => ({ ...f, categoria: sugestao }));
    }
  }

  async function salvarProduto() {
    if (!empresaId || !userId) return;
    if (!formProduto.nome?.trim()) { mostrarToast(et.toastNomeObrigatorio, "erro"); return; }
    setSalvandoProduto(true);
    try {
      let produtoId = produtoEditando?.id;
      if (produtoEditando) {
        // preco_medio/preco_medio_anterior são contábeis, mantidos só pela trigger de
        // movimentação (ver comentário no topo de estoqueHelpers.ts) — o cadastro/comercial
        // nunca escreve neles, mesmo carregando o valor atual no state pra exibição.
        const { preco_medio, preco_medio_anterior, ...comercial } = formProduto;
        const { erro } = await atualizarProduto(produtoEditando.id, comercial);
        if (erro) { mostrarToast(erro, "erro"); return; }
      } else {
        const { id, erro } = await criarProduto(empresaId, userId, formProduto);
        if (erro) { mostrarToast(erro, "erro"); return; }
        produtoId = id;
      }
      if (arquivoImagem && produtoId) {
        const { path, erro } = await uploadImagemProduto(arquivoImagem, empresaId, produtoId);
        let erroVinculo: string | undefined;
        if (path) { const r = await atualizarProduto(produtoId, { imagem_principal: path }); erroVinculo = r.erro; }
        if (erro) mostrarToast(`${et.toastImagemFalhou}: ${erro}`, "info");
        else if (erroVinculo) mostrarToast(`${et.toastImagemVinculoFalhou}: ${erroVinculo}`, "info");
      }
      // Produto perecível novo com lote preenchido: registra a primeira entrada
      // reaproveitando criarMovimentacao() (mesmo caminho de "Nova Movimentação").
      const qtdLote = Number(loteInicial.quantidade) || 0;
      if (!produtoEditando && produtoId && (formProduto.atributos_nicho || {})[CHAVE_PERECIVEL] && loteInicial.numero_lote.trim() && qtdLote > 0) {
        const { erro } = await criarMovimentacao(empresaId, userId, {
          produto_id: produtoId,
          tipo: "entrada",
          quantidade: qtdLote,
          custo_unitario: loteInicial.custo_unitario ? Number(loteInicial.custo_unitario) : (formProduto.preco_custo || null),
          status_recebimento: "confirmada",
          lote: {
            numero_lote: loteInicial.numero_lote.trim(),
            data_fabricacao: loteInicial.data_fabricacao || undefined,
            data_validade: loteInicial.data_validade || undefined,
          },
        });
        if (erro) mostrarToast(`${et.toastLoteFalhou}: ${erro}`, "info");
      }
      // Aprende quando o usuário corrige a sugestão automática — próxima vez já vem certo.
      if (categoriaSugerida && formProduto.categoria && formProduto.categoria !== categoriaSugerida) {
        registrarAprendizadoCategoria(empresaId, formProduto.nome, formProduto.categoria);
      }
      mostrarToast(produtoEditando ? et.toastProdutoAtualizado : et.toastProdutoSalvo);
      setModalProdutoAberto(false);
      carregarProdutos();
    } finally {
      setSalvandoProduto(false);
    }
  }

  async function excluirProdutoHandler(produto: Produto) {
    if (!confirm(`${et.confirmarExclusaoProduto} "${produto.nome}"?`)) return;
    const { erro, inativadoEmVezDeExcluir, temVenda } = await excluirProduto(produto.id);
    if (temVenda) { mostrarToast(et.toastProdutoTemVenda, "erro"); return; }
    if (erro) { mostrarToast(erro, "erro"); return; }
    mostrarToast(inativadoEmVezDeExcluir ? et.toastProdutoInativado : et.toastProdutoExcluido, "info");
    carregarProdutos();
  }

  async function excluirCampoPersonalizadoHandler(campo: CampoPersonalizadoEmpresa) {
    if (!empresaId) return;
    if (!confirm(`${et.confirmarExclusaoCampoPersonalizado} "${campo.nome}"?`)) return;
    const { erro } = await removerCampoPersonalizado(empresaId, campo.chave);
    if (erro) { mostrarToast(erro, "erro"); return; }
    setCamposPersonalizados((c) => c.filter((x) => x.chave !== campo.chave));
    setFormProduto((f) => {
      const atributos = { ...(f.atributos_nicho || {}) };
      delete atributos[campo.chave];
      return { ...f, atributos_nicho: atributos };
    });
    mostrarToast(et.toastCampoPersonalizadoExcluido, "info");
  }

  // ================= AUTOMAÇÕES (seleção, lote, excel/csv, etiquetas) =================
  function toggleSelecionado(id: string) {
    setProdutosSelecionados((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }
  function toggleSelecionarTodos() {
    setProdutosSelecionados((s) => (s.size === produtos.length ? new Set() : new Set(produtos.map((p) => p.id))));
  }

  async function handleExportar(formato: "excel" | "csv") {
    if (!empresaId) return;
    setExportando(true);
    try {
      const alvo = produtosSelecionados.size > 0
        ? produtos.filter((p) => produtosSelecionados.has(p.id))
        : (await listarProdutos(empresaId, { busca: buscaProdutos, status: filtroStatusProdutos, limite: 5000 })).dados;
      if (formato === "excel") exportarProdutosExcel(alvo); else exportarProdutosCsv(alvo);
    } finally {
      setExportando(false);
    }
  }

  async function handleImportarArquivo(file: File) {
    if (!empresaId || !userId) return;
    setImportando(true);
    try {
      const { ok, erro } = await importarProdutosArquivo(file, empresaId, userId);
      if (erro) { mostrarToast(erro, "erro"); return; }
      mostrarToast(`${ok} ${et.toastImportadoOk}`, "ok");
      carregarProdutos();
    } finally {
      setImportando(false);
    }
  }

  async function handleGerarEtiquetas() {
    const alvo = produtosSelecionados.size > 0 ? produtos.filter((p) => produtosSelecionados.has(p.id)) : produtos;
    if (alvo.length === 0) return;
    setGerandoEtiquetas(true);
    try {
      await gerarEtiquetasPDF(alvo);
    } finally {
      setGerandoEtiquetas(false);
    }
  }

  async function salvarLote() {
    if (produtosSelecionados.size === 0) return;
    const payload: Partial<Produto> = {};
    (Object.keys(formLote) as (keyof Produto)[]).forEach((k) => {
      const v = formLote[k];
      if (v !== undefined && v !== "") (payload as any)[k] = v;
    });
    if (Object.keys(payload).length === 0) { setModalLoteAberto(false); return; }
    setSalvandoLote(true);
    try {
      const { erro } = await atualizarProdutosEmLote(Array.from(produtosSelecionados), payload);
      if (erro) { mostrarToast(erro, "erro"); return; }
      mostrarToast(`${produtosSelecionados.size} ${et.toastLoteAtualizado}`, "ok");
      setModalLoteAberto(false);
      setProdutosSelecionados(new Set());
      carregarProdutos();
    } finally {
      setSalvandoLote(false);
    }
  }

  // ================= MOVIMENTAÇÕES =================
  function abrirModalMovimentacao(mov?: MovimentacaoComProduto) {
    setMovEditando(mov || null);
    setFormMov(mov ? { ...mov, data_hora: mov.data_hora.slice(0, 16) } : {
      tipo: "entrada", quantidade: 1, status_recebimento: "confirmada", destino_saldo: "disponivel",
      data_hora: new Date().toISOString().slice(0, 16),
    });
    setBuscaProdutoMov("");
    setResultadosProdutoMov([]);
    setProdutoSelecionadoMov(null);
    setLotesProdutoMov([]);
    if (mov) {
      supabase.from("produtos").select("*").eq("id", mov.produto_id).maybeSingle().then(({ data }) => {
        if (data) { setProdutoSelecionadoMov(data); listarLotesProduto(data.id).then(setLotesProdutoMov); }
      });
    }
    setModalMovAberto(true);
  }

  async function buscarProdutosMov(termo: string) {
    setBuscaProdutoMov(termo);
    if (!empresaId || termo.trim().length < 2) { setResultadosProdutoMov([]); return; }
    const { dados } = await listarProdutos(empresaId, { busca: termo, status: "ativo" });
    setResultadosProdutoMov(dados.slice(0, 8));
  }

  function selecionarProdutoMov(p: Produto) {
    setProdutoSelecionadoMov(p);
    setFormMov((f: any) => ({ ...f, produto_id: p.id }));
    setResultadosProdutoMov([]);
    setBuscaProdutoMov(p.nome);
    listarLotesProduto(p.id).then(setLotesProdutoMov);
  }

  const leitorMov = useLeitorCodigoBarras(async (codigo) => {
    if (!empresaId) return;
    const encontrado = await buscarProdutoPorCodigo(empresaId, codigo);
    if (encontrado) selecionarProdutoMov(encontrado);
    else mostrarToast(et.toastCodigoNaoEncontrado, "info");
  });

  async function salvarMovimentacao() {
    if (!empresaId || !userId) return;
    if (!formMov.produto_id) { mostrarToast(et.toastSelecioneProduto, "erro"); return; }
    if (!formMov.quantidade || Number(formMov.quantidade) <= 0) { mostrarToast(et.toastQuantidadeInvalida, "erro"); return; }
    setSalvandoMov(true);
    try {
      if (movEditando) {
        const { erro } = await atualizarMovimentacao(movEditando.id, {
          tipo: formMov.tipo, quantidade: Number(formMov.quantidade),
          custo_unitario: formMov.custo_unitario ? Number(formMov.custo_unitario) : null,
          status_recebimento: formMov.status_recebimento, destino_saldo: formMov.destino_saldo,
          motivo: formMov.motivo, documento_ref: formMov.documento_ref,
          data_hora: formMov.data_hora ? new Date(formMov.data_hora).toISOString() : undefined,
        });
        if (erro) { mostrarToast(erro, "erro"); return; }
        mostrarToast(et.toastMovAtualizada);
      } else {
        const { erro } = await criarMovimentacao(empresaId, userId, {
          produto_id: formMov.produto_id, tipo: formMov.tipo, quantidade: Number(formMov.quantidade),
          custo_unitario: formMov.custo_unitario ? Number(formMov.custo_unitario) : null,
          status_recebimento: formMov.status_recebimento, destino_saldo: formMov.destino_saldo,
          motivo: formMov.motivo, documento_ref: formMov.documento_ref, origem: "manual",
          data_hora: formMov.data_hora ? new Date(formMov.data_hora).toISOString() : undefined,
          lote: formMov.numero_lote ? { numero_lote: formMov.numero_lote, data_validade: formMov.data_validade, data_fabricacao: formMov.data_fabricacao } : undefined,
          lote_id: formMov.tipo === "saida" ? (formMov.lote_id || fefoSugestao[0]?.lote.id || null) : undefined,
        });
        if (erro) { mostrarToast(erro, "erro"); return; }
        mostrarToast(et.toastMovSalva);
      }
      setModalMovAberto(false);
      carregarMovimentacoes();
    } finally {
      setSalvandoMov(false);
    }
  }

  async function excluirMovimentacaoHandler(id: string) {
    if (!confirm(et.confirmarExclusaoMov)) return;
    const { erro } = await excluirMovimentacao(id);
    if (erro) { mostrarToast(erro, "erro"); return; }
    mostrarToast(et.toastMovExcluida);
    carregarMovimentacoes();
  }

  async function confirmarRecebimentoHandler(id: string) {
    const { erro } = await confirmarRecebimento(id);
    if (erro) { mostrarToast(erro, "erro"); return; }
    mostrarToast(et.toastRecebimentoConfirmado);
    carregarMovimentacoes();
  }

  const fefoSugestao = formMov.tipo === "saida" && lotesProdutoMov.length > 0 && formMov.quantidade
    ? sugerirConsumoFefo(lotesProdutoMov, Number(formMov.quantidade)) : [];

  // ================= PDF =================
  function montarArgsPdfAtual(): ArgsPdfTabela | null {
    if (aba === "produtos") {
      return {
        titulo: `${et.titulo} — ${et.abaProdutos}`, subtitulo: `${totalProdutos}`,
        colunas: [
          { header: et.colNome, key: "nome", width: 3 }, { header: et.colCodigo, key: "codigo", width: 2 },
          { header: et.colCategoria, key: "categoria", width: 2 }, { header: et.colSaldo, key: "saldo", width: 1, align: "right" },
          { header: et.colPrecoMedio, key: "precoMedio", width: 1.5, align: "right" },
          { header: et.colPrecoVenda, key: "precoVenda", width: 1.5, align: "right" }, { header: et.colStatus, key: "status", width: 1 },
        ],
        linhas: produtos.map((p) => ({
          nome: p.nome, codigo: p.codigo_interno || "—", categoria: p.categoria || "—",
          saldo: String(p.saldo_disponivel), precoMedio: moeda(p.preco_medio), precoVenda: moeda(p.preco_venda ?? p.preco_sugerido), status: p.status,
        })),
        nomeArquivo: "axioma-estoque-produtos.pdf",
      };
    }
    if (aba === "movimentacoes") {
      return {
        titulo: `${et.titulo} — ${et.abaMovimentacoes}`, subtitulo: `${totalMovimentacoes}`,
        colunas: [
          { header: et.colData, key: "data", width: 1.5 }, { header: et.colProduto, key: "produto", width: 2.5 },
          { header: et.colTipo, key: "tipo", width: 1 }, { header: et.colQtd, key: "qtd", width: 1, align: "right" },
          { header: et.colValor, key: "valor", width: 1.5, align: "right" },
        ],
        linhas: movimentacoes.map((m) => ({
          data: new Date(m.data_hora).toLocaleDateString("pt-BR"), produto: m.produto_nome, tipo: m.tipo,
          qtd: String(m.quantidade), valor: m.valor_total != null ? fBRL(m.valor_total) : "—",
        })),
        nomeArquivo: "axioma-estoque-movimentacoes.pdf",
      };
    }
    if (aba === "avisos") {
      return {
        titulo: `${et.titulo} — ${et.abaAvisos}`, subtitulo: `${avisosEstoque.length + avisosValidade.length}`,
        colunas: [
          { header: et.colProduto, key: "produto", width: 3 }, { header: et.abaAvisos, key: "aviso", width: 2 },
          { header: et.colStatus, key: "detalhe", width: 2 },
        ],
        linhas: [
          ...avisosEstoque.flatMap((a) => {
            const tags: string[] = [];
            if (a.ruptura) tags.push(et.avisoRuptura);
            if (a.baixo_estoque) tags.push(et.avisoBaixoEstoque);
            if (a.capital_parado) tags.push(et.avisoCapitalParado);
            if (a.custo_subindo) tags.push(et.avisoCustoSubindo);
            return tags.map((tag) => ({ produto: a.nome, aviso: tag, detalhe: `${et.colSaldo}: ${a.saldo_disponivel}` }));
          }),
          ...avisosValidade.map((v) => ({ produto: v.produto_nome, aviso: SEVERIDADE_LABEL[v.severidade], detalhe: `${v.numero_lote || "—"} — ${new Date(v.data_validade).toLocaleDateString("pt-BR")}` })),
        ],
        nomeArquivo: "axioma-estoque-avisos.pdf",
      };
    }
    return null;
  }

  async function exportarPDF() {
    const args = montarArgsPdfAtual();
    if (!args) return;
    setExportando(true);
    try {
      gerarPdfTabela(args, (msg) => mostrarToast(msg, "erro"), lang);
    } finally {
      setExportando(false);
    }
  }

  if (carregando) {
    return <ModuloLayout titulo={et.titulo} subtitulo={et.carregando}><div className="text-center py-20" style={{ color: "#5a7a9a" }}>{et.carregando}</div></ModuloLayout>;
  }

  const opcoesFornecedor = fornecedoresDrop.map((f) => ({ value: f.id, label: f.nome }));
  const opcoesCentroCusto = centrosCustoDrop.map((c) => ({ value: c.id, label: c.nome }));
  const argsShare = montarArgsPdfAtual();

  return (
    <ModuloLayout
      titulo={et.titulo} subtitulo={et.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={aba === "produtos" ? () => abrirModalProduto() : aba === "movimentacoes" ? () => abrirModalMovimentacao() : undefined}
      labelBotao={aba === "produtos" ? et.novoProduto : et.novaMovimentacao}
      botaoExtra={(aba === "produtos" || aba === "movimentacoes" || aba === "avisos") && (
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, ${JADE_ESCURO}, ${JADE})`, color: "#fff" }}>
          <Share2 size={16} /> {et.compartilhar}
        </motion.button>
      )}
    >
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)", color: "#020810", fontWeight: 600, fontSize: 13 }}>
          {toast.msg}
        </div>
      )}

      {/* ABAS */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { key: "painel", label: `📊 ${et.abaPainel}` },
          { key: "produtos", label: `📦 ${et.abaProdutos} (${totalProdutos})` },
          { key: "movimentacoes", label: `🔄 ${et.abaMovimentacoes}` },
          { key: "avisos", label: `⚠️ ${et.abaAvisos} (${avisosEstoque.length + avisosValidade.length || 0})` },
          { key: "inteligencia", label: `🧠 ${et.abaInteligencia}` },
          { key: "copiloto", label: `🤖 ${et.abaCopiloto}` },
        ].map((a) => (
          <button key={a.key} onClick={() => setAba(a.key as any)}
            className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: aba === a.key ? `linear-gradient(135deg, ${JADE_ESCURO}, ${JADE})` : "rgba(10,22,40,0.6)",
              color: aba === a.key ? "#fff" : JADE,
              border: aba === a.key ? `1px solid ${JADE}` : "1px solid rgba(4,120,87,0.2)",
            }}>
            {a.label}
          </button>
        ))}
      </div>

      {!empresaId && (
        <CanvasBox cor={NEGATIVO}><p style={{ color: "#c8d8f0" }}>{et.empresaNaoEncontrada}</p></CanvasBox>
      )}

      {/* ================= PAINEL ================= */}
      {empresaId && aba === "painel" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: et.kpiValorTotal, valor: fBRL(kpis?.valor_total_estoque || 0), cor: JADE },
              { label: et.kpiProdutosAtivos, valor: String(kpis?.produtos_ativos || 0), cor: NEUTRO },
              { label: et.kpiProdutosInativos, valor: String(kpis?.produtos_inativos || 0), cor: "#5a7a9a" },
              { label: et.kpiRuptura, valor: String(kpis?.qtd_ruptura || 0), cor: NEGATIVO },
              { label: et.kpiBaixoEstoque, valor: String(kpis?.qtd_baixo_estoque || 0), cor: ATENCAO },
              { label: et.kpiProxValidade, valor: String(avisosValidadeResumo.filter((v) => v.severidade !== "vencido").length), cor: ATENCAO },
              { label: et.kpiVencidos, valor: String(avisosValidadeResumo.filter((v) => v.severidade === "vencido").length), cor: NEGATIVO },
              { label: et.kpiCapitalParado, valor: String(kpis?.qtd_capital_parado || 0), cor: BRONZE },
            ].map((k) => (
              <CanvasBox key={k.label} cor={k.cor}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: "#5a7a9a" }}>{k.label}</p>
                <p className="text-xl font-black" style={{ ...FONTE_EXEC, color: k.cor }}>{k.valor}</p>
              </CanvasBox>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <CanvasBox cor={JADE}>
              <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.graficoCategoria}</p>
              {composicaoCategoria.length > 0 ? (
                <ReactECharts style={{ height: 260 }} option={optRosca(
                  composicaoCategoria.map((c, i) => ({ name: c.chave, value: c.valor_total, color: [JADE, BRONZE, NEUTRO, ATENCAO, POSITIVO, NEGATIVO][i % 6] })),
                  JADE, fBRL(kpis?.valor_total_estoque || 0)
                )} />
              ) : <p className="text-xs py-10 text-center" style={{ color: "#5a7a9a" }}>{et.semDadosCategoria}</p>}
            </CanvasBox>
            <CanvasBox cor={BRONZE}>
              <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.graficoFornecedor}</p>
              {composicaoFornecedor.length > 0 ? (
                <ReactECharts style={{ height: 260 }} option={optBarrasH(
                  composicaoFornecedor.map((f) => f.valor_total), composicaoFornecedor.map((f) => f.chave), BRONZE, "#d4a017"
                )} />
              ) : <p className="text-xs py-10 text-center" style={{ color: "#5a7a9a" }}>{et.semDadosFornecedor}</p>}
            </CanvasBox>
          </div>

          <CanvasBox cor={JADE}>
            <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.graficoEvolucao}</p>
            {evolucao.length > 0 ? (
              <ReactECharts style={{ height: 260 }} option={optBarrasComparativo(
                evolucao.map((e) => e.entradas_qtd), evolucao.map((e) => e.saidas_qtd),
                evolucao.map((e) => new Date(e.periodo).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })),
                POSITIVO, NEGATIVO, et.tipoEntrada, et.tipoSaida
              )} />
            ) : <p className="text-xs py-10 text-center" style={{ color: "#5a7a9a" }}>{et.semDadosEvolucao}</p>}
          </CanvasBox>

          <CanvasBox cor="#5a7a9a">
            <p className="text-sm font-bold mb-2" style={{ color: "#c8d8f0" }}>{et.maisVendidosTitulo}</p>
            <p className="text-xs" style={{ color: "#5a7a9a" }}>{et.maisVendidosTexto}</p>
          </CanvasBox>
        </div>
      )}

      {/* ================= PRODUTOS ================= */}
      {empresaId && aba === "produtos" && (
        <div>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5a7a9a" }} />
              <input value={buscaProdutos} onChange={(e) => { setBuscaProdutos(e.target.value); setPaginaProdutos(0); }}
                onKeyDown={leitorProdutos.onKeyDown}
                placeholder={et.buscarPlaceholder}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="flex gap-2">
              {([
                { key: "ativo" as const, label: et.statusAtivo },
                { key: "inativo" as const, label: et.statusInativo },
                { key: "todos" as const, label: et.statusTodos },
              ]).map((s) => (
                <button key={s.key} onClick={() => { setFiltroStatusProdutos(s.key); setPaginaProdutos(0); }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: filtroStatusProdutos === s.key ? JADE : "rgba(10,22,40,0.6)", color: filtroStatusProdutos === s.key ? "#fff" : "#94a3b8" }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {(() => {
              const contarPara = (c: ContagemSegmento) => filtroStatusProdutos === "ativo" ? c.qtd_ativo : filtroStatusProdutos === "inativo" ? c.qtd_inativo : c.qtd_total;
              const visiveis = contagemSegmentos.filter((c) => contarPara(c) > 0);
              const totalTodos = visiveis.reduce((soma, c) => soma + contarPara(c), 0);
              return (
                <>
                  <button onClick={() => selecionarSegmento("todos")}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
                    style={{ background: filtroSegmento === "todos" ? JADE : "rgba(10,22,40,0.6)", color: filtroSegmento === "todos" ? "#fff" : "#94a3b8" }}>
                    {et.statusTodos} ({totalTodos})
                  </button>
                  {visiveis.map((c) => {
                    const info = SEGMENTOS.find((s) => s.value === c.segmento);
                    return (
                      <button key={c.segmento} onClick={() => selecionarSegmento(c.segmento)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
                        style={{ background: filtroSegmento === c.segmento ? JADE : "rgba(10,22,40,0.6)", color: filtroSegmento === c.segmento ? "#fff" : "#94a3b8" }}>
                        {info ? info.label[idioma] : c.segmento} ({contarPara(c)})
                      </button>
                    );
                  })}
                </>
              );
            })()}
          </div>

          <CanvasBox cor={BRONZE}>
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-52">
                <CampoSelect label={`${et.campoSegmento} (${et.secaoSegmento.toLowerCase()})`} value={empresaSegmentoPadrao || ""}
                  onChange={async (v) => {
                    if (!empresaId) return;
                    setEmpresaSegmentoPadrao(v || null);
                    const { erro } = await definirSegmentoPadraoEmpresa(empresaId, v);
                    if (erro) mostrarToast(erro === "SEM_PERMISSAO_ESCRITA" ? et.toastSemPermissaoEscrita : erro, "erro");
                  }}
                  opcoes={SEGMENTOS.map((s) => ({ value: s.value, label: s.label[idioma] }))} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <p className="text-xs font-bold mr-1" style={{ color: "#c8d8f0" }}>{et.automacoesTitulo}</p>
              {produtosSelecionados.size > 0 && (
                <span className="text-[11px] px-2 py-1 rounded-lg font-semibold" style={{ background: "rgba(4,120,87,0.15)", color: JADE }}>
                  {produtosSelecionados.size} {et.itensSelecionados}
                </span>
              )}
              <button onClick={() => { setFormLote({}); setModalLoteAberto(true); }} disabled={produtosSelecionados.size === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>{et.editarEmLote}</button>
              <button onClick={handleGerarEtiquetas} disabled={gerandoEtiquetas || produtos.length === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>{et.gerarEtiquetas}</button>
              <button onClick={() => handleExportar("excel")} disabled={exportando}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>{et.exportarExcel}</button>
              <button onClick={() => handleExportar("csv")} disabled={exportando}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0" }}>{et.exportarCsv}</button>
              <label className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: "rgba(255,255,255,0.06)", color: "#c8d8f0", opacity: importando ? 0.4 : 1 }}>
                {et.importarArquivo}
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" disabled={importando}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImportarArquivo(f); e.target.value = ""; }} />
              </label>
            </div>
          </CanvasBox>

          <CanvasBox cor={JADE}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold w-8">
                      <input type="checkbox" className="w-4 h-4 rounded" checked={produtos.length > 0 && produtosSelecionados.size === produtos.length} onChange={toggleSelecionarTodos} />
                    </th>
                    <th className="pb-2 px-3 font-semibold">{et.colNome}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colCodigo}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colCategoria}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colSaldo}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colPrecoMedio}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colPrecoVenda}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colStatus}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colAcoes}</th>
                  </tr>
                </thead>
                <tbody>
                  {gruposProdutos.map((grupoSeg) => {
                    const chaveSeg = `seg:${grupoSeg.segmento}`;
                    const totalSeg = grupoSeg.categorias.reduce((n, c) => n + c.produtos.length, 0);
                    return (
                      <Fragment key={chaveSeg}>
                        {filtroSegmento === "todos" && linhaGrupo(chaveSeg, 1, `${grupoSeg.label} (${totalSeg})`)}
                        {(filtroSegmento !== "todos" || !gruposFechados.has(chaveSeg)) && grupoSeg.categorias.map((grupoCat) => {
                          const chaveCat = `${chaveSeg}|cat:${grupoCat.categoria}`;
                          return (
                            <Fragment key={chaveCat}>
                              {linhaGrupo(chaveCat, 2, `${grupoCat.categoria} (${grupoCat.produtos.length})`)}
                              {!gruposFechados.has(chaveCat) && grupoCat.produtos.map((p) => linhaProduto(p))}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                  {produtos.length === 0 && (
                    <tr><td colSpan={9} className="py-10 text-center text-xs" style={{ color: "#5a7a9a" }}>{et.semProdutos}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Paginacao pagina={paginaProdutos} total={totalProdutos} onMudar={setPaginaProdutos} et={et} />
          </CanvasBox>
        </div>
      )}

      {/* ================= MOVIMENTAÇÕES ================= */}
      {empresaId && aba === "movimentacoes" && (
        <div>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            <button onClick={() => { setFiltroTipoMov("todos"); setPaginaMovimentacoes(0); }}
              className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
              style={{ background: filtroTipoMov === "todos" ? JADE : "rgba(10,22,40,0.6)", color: filtroTipoMov === "todos" ? "#fff" : "#94a3b8" }}>{et.statusTodos}</button>
            {TIPOS_MOV.map((tp) => (
              <button key={tp.value} onClick={() => { setFiltroTipoMov(tp.value); setPaginaMovimentacoes(0); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap"
                style={{ background: filtroTipoMov === tp.value ? tp.cor : "rgba(10,22,40,0.6)", color: filtroTipoMov === tp.value ? "#020810" : "#94a3b8" }}>{tp.label}</button>
            ))}
          </div>

          <CanvasBox cor={JADE}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold">{et.colData}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colProduto}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colTipo}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colQtd}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colValor}</th>
                    <th className="pb-2 px-3 font-semibold">{et.colSituacao}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colAcoes}</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map((m) => {
                    const tipoInfo = TIPOS_MOV.find((tp) => tp.value === m.tipo);
                    return (
                      <tr key={m.id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <td className="py-2 px-3" style={{ color: "#94a3b8" }}>{new Date(m.data_hora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{m.produto_nome}</td>
                        <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${tipoInfo?.cor}22`, color: tipoInfo?.cor }}>{tipoInfo?.label}</span></td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{m.quantidade}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{m.valor_total != null ? fBRL(m.valor_total) : "—"}</td>
                        <td className="py-2 px-3">
                          {m.tipo === "entrada" && m.status_recebimento === "em_transito" ? (
                            <button onClick={() => confirmarRecebimentoHandler(m.id)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.15)", color: ATENCAO }}>
                              <Truck size={11} /> {et.emTransitoConfirmar}
                            </button>
                          ) : (
                            <span className="text-[10px]" style={{ color: "#5a7a9a" }}>—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button onClick={() => abrirModalMovimentacao(m)} className="p-1.5 rounded-lg mr-1" style={{ color: NEUTRO }}><Pencil size={15} /></button>
                          <button onClick={() => excluirMovimentacaoHandler(m.id)} className="p-1.5 rounded-lg" style={{ color: NEGATIVO }}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {movimentacoes.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-xs" style={{ color: "#5a7a9a" }}>{et.semMovimentacoes}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Paginacao pagina={paginaMovimentacoes} total={totalMovimentacoes} onMudar={setPaginaMovimentacoes} et={et} />
          </CanvasBox>
        </div>
      )}

      {/* ================= AVISOS ================= */}
      {empresaId && aba === "avisos" && (
        <div className="space-y-5">
          <CanvasBox cor={NEGATIVO}>
            <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#c8d8f0" }}><AlertTriangle size={16} /> {et.avisosEstoqueTitulo}</p>
            {avisosEstoque.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.avisosEstoqueVazio}</p>
            ) : (
              <div className="space-y-2">
                {avisosEstoque.map((a) => (
                  <div key={a.produto_id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{a.nome}</p>
                      <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{et.colSaldo}: {a.saldo_disponivel} · {et.colPrecoMedio}: {fBRL(a.preco_medio)}</p>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {a.ruptura && <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(248,113,113,0.15)", color: NEGATIVO }}>{et.avisoRuptura}</span>}
                      {a.baixo_estoque && <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(245,158,11,0.15)", color: ATENCAO }}>{et.avisoBaixoEstoque}</span>}
                      {a.capital_parado && <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(161,98,7,0.15)", color: BRONZE }}>{et.avisoCapitalParado}</span>}
                      {a.custo_subindo && <span className="px-2 py-1 rounded-lg text-[10px] font-bold" style={{ background: "rgba(106,176,255,0.15)", color: NEUTRO }}>{et.avisoCustoSubindo}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CanvasBox>

          <CanvasBox cor={ATENCAO}>
            <p className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "#c8d8f0" }}>⏳ {et.avisosValidadeTitulo}</p>
            {avisosValidade.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.avisosValidadeVazio}</p>
            ) : (
              <div className="space-y-2">
                {avisosValidade.map((v) => {
                  const cor = v.severidade === "vencido" || v.severidade === "ultimo_dia" || v.severidade === "critico_7" ? NEGATIVO
                    : v.severidade === "atencao_30" || v.severidade === "aviso_60" ? ATENCAO : NEUTRO;
                  return (
                    <div key={v.lote_id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{v.produto_nome}</p>
                        <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{v.numero_lote || "—"} · {et.colQtd}: {v.quantidade_atual} · {new Date(v.data_validade).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap" style={{ background: `${cor}22`, color: cor }}>{SEVERIDADE_LABEL[v.severidade]}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CanvasBox>
        </div>
      )}

      {/* ================= INTELIGÊNCIA ================= */}
      {empresaId && aba === "inteligencia" && (
        <div className="space-y-5">
          <CanvasBox cor={JADE}>
            <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.intCurvaAbcTitulo}</p>
            {curvaAbc.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : (
              <>
                <ReactECharts style={{ height: 240 }} option={optBarrasH(
                  curvaAbc.slice(0, 10).map((c) => c.valor_saida_90d),
                  curvaAbc.slice(0, 10).map((c) => c.nome),
                  JADE, "#34d399",
                  curvaAbc.slice(0, 10).map((c) => c.classe_abc === "A" ? POSITIVO : c.classe_abc === "B" ? ATENCAO : NEGATIVO)
                )} />
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left" style={{ color: BRONZE }}>
                      <th className="pb-2 px-3 font-semibold">{et.colProduto}</th>
                      <th className="pb-2 px-3 font-semibold text-right">{et.colValor}</th>
                      <th className="pb-2 px-3 font-semibold text-right">%</th>
                      <th className="pb-2 px-3 font-semibold">{et.colStatus}</th>
                    </tr></thead>
                    <tbody>
                      {curvaAbc.map((c) => (
                        <tr key={c.produto_id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                          <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{c.nome}</td>
                          <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{fBRL(c.valor_saida_90d)}</td>
                          <td className="py-2 px-3 text-right" style={{ color: "#94a3b8" }}>{c.pct_acumulado}%</td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{
                              background: c.classe_abc === "A" ? "rgba(52,211,153,0.15)" : c.classe_abc === "B" ? "rgba(245,158,11,0.15)" : c.classe_abc === "C" ? "rgba(248,113,113,0.15)" : "rgba(90,122,154,0.15)",
                              color: c.classe_abc === "A" ? POSITIVO : c.classe_abc === "B" ? ATENCAO : c.classe_abc === "C" ? NEGATIVO : "#5a7a9a",
                            }}>{c.classe_abc === "A" ? et.intClasseA : c.classe_abc === "B" ? et.intClasseB : c.classe_abc === "C" ? et.intClasseC : et.intSemGiro}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </CanvasBox>

          <CanvasBox cor={NEUTRO}>
            <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.intGiroTitulo}</p>
            {giroEstoque.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold">{et.colProduto}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colSaldo}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColGiro}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColVelocidade}</th>
                  </tr></thead>
                  <tbody>
                    {giroEstoque.map((g) => (
                      <tr key={g.produto_id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{g.nome}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{g.saldo_disponivel}</td>
                        <td className="py-2 px-3 text-right font-semibold" style={{ color: g.giro_90d == null ? "#5a7a9a" : g.giro_90d >= 1 ? POSITIVO : g.giro_90d > 0 ? ATENCAO : NEGATIVO }}>{g.giro_90d ?? "—"}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#94a3b8" }}>{g.velocidade_consumo_diaria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CanvasBox>

          <CanvasBox cor={BRONZE}>
            <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.intCapitalTitulo}</p>
            {capitalImobilizado.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold">{et.colProduto}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColCapital}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColDiasParado}</th>
                  </tr></thead>
                  <tbody>
                    {capitalImobilizado.slice().sort((a, b) => (b.dias_sem_movimento ?? 0) - (a.dias_sem_movimento ?? 0)).map((c) => (
                      <tr key={c.produto_id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{c.nome}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{fBRL(c.capital_imobilizado)}</td>
                        <td className="py-2 px-3 text-right font-semibold" style={{ color: (c.dias_sem_movimento ?? 0) > 60 ? NEGATIVO : (c.dias_sem_movimento ?? 0) > 30 ? ATENCAO : "#94a3b8" }}>
                          {c.dias_sem_movimento ?? et.intSemMovimento}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CanvasBox>

          <CanvasBox cor={ATENCAO}>
            <p className="text-sm font-bold mb-2" style={{ color: "#c8d8f0" }}>{et.intReposicaoTitulo}</p>
            {giroEstoque.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p>
              : alertasReposicao.length === 0 ? <p className="text-xs py-4" style={{ color: "#5a7a9a" }}>{et.intSemLeadTime}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold">{et.colProduto}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.colSaldo}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColPontoReposicao}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColDiasRestantes}</th>
                  </tr></thead>
                  <tbody>
                    {alertasReposicao.map((a) => (
                      <tr key={a.produto_id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{a.nome}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{a.saldo_disponivel}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#94a3b8" }}>{a.pontoReposicao}</td>
                        <td className="py-2 px-3 text-right font-bold" style={{ color: NEGATIVO }}>{a.diasRestantes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CanvasBox>

          <CanvasBox cor={JADE}>
            <p className="text-sm font-bold mb-1" style={{ color: "#c8d8f0" }}>{et.intRentabilidadeTitulo}</p>
            <p className="text-[11px] mb-3 italic" style={{ color: "#5a7a9a" }}>{et.intRentabilidadeAviso}</p>
            {rentabilidadeCategoria.length === 0 && rentabilidadeFornecedor.length === 0 && rentabilidadeMarca.length === 0 ? (
              <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { titulo: et.campoCategoria, itens: rentabilidadeCategoria },
                  { titulo: et.campoFornecedor, itens: rentabilidadeFornecedor },
                  { titulo: et.campoMarca, itens: rentabilidadeMarca },
                ].map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="text-xs font-bold mb-2" style={{ color: BRONZE }}>{grupo.titulo}</p>
                    {grupo.itens.map((it) => (
                      <div key={it.chave} className="flex justify-between text-xs py-1 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <span style={{ color: "#c8d8f0" }}>{it.chave}</span>
                        <span style={{ color: it.margem_media == null ? "#5a7a9a" : it.margem_media > 0 ? POSITIVO : NEGATIVO }}>
                          {it.margem_media == null ? "—" : `${it.margem_media.toFixed(1)}%`}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {[...rentabilidadeCategoria, ...rentabilidadeFornecedor, ...rentabilidadeMarca].some((it) => it.margem_media == null) && (
              <p className="text-[11px] mt-3 italic" style={{ color: "#5a7a9a" }}>{et.intRentabilidadeSemDado}</p>
            )}
          </CanvasBox>

          <CanvasBox cor={NEUTRO}>
            <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.intComparativoFornecedorTitulo}</p>
            {comparativoFornecedores.length === 0 ? <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left" style={{ color: BRONZE }}>
                    <th className="pb-2 px-3 font-semibold">{et.campoFornecedor}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColPrecoMedioCompra}</th>
                    <th className="pb-2 px-3 font-semibold text-right">{et.intColFrequencia}</th>
                    <th className="pb-2 px-3 font-semibold">{et.intColUltimaEntrada}</th>
                  </tr></thead>
                  <tbody>
                    {comparativoFornecedores.map((f) => (
                      <tr key={f.fornecedor_id} className="border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                        <td className="py-2 px-3" style={{ color: "#c8d8f0" }}>{f.fornecedor_nome}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#c8d8f0" }}>{f.preco_medio_compra != null ? fBRL(f.preco_medio_compra) : "—"}</td>
                        <td className="py-2 px-3 text-right" style={{ color: "#94a3b8" }}>{f.frequencia_entregas}</td>
                        <td className="py-2 px-3" style={{ color: "#94a3b8" }}>{f.ultima_entrada ? new Date(f.ultima_entrada).toLocaleDateString("pt-BR") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CanvasBox>
        </div>
      )}

      {/* ================= COPILOTO ================= */}
      {empresaId && aba === "copiloto" && (
        <div className="space-y-5">
          {capitalImobilizado.length === 0 && curvaAbc.length === 0 ? (
            <CanvasBox cor="#5a7a9a"><p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{et.copilotoSemDados}</p></CanvasBox>
          ) : (
            <>
              <CanvasBox cor={NEGATIVO}>
                <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.copilotoParadoTitulo}</p>
                {capitalImobilizado.slice().sort((a, b) => (b.dias_sem_movimento ?? 0) - (a.dias_sem_movimento ?? 0)).slice(0, 5).map((c) => (
                  <div key={c.produto_id} className="flex justify-between text-sm py-1.5 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                    <span style={{ color: "#c8d8f0" }}>{c.nome}</span>
                    <span style={{ color: NEGATIVO }}>{c.dias_sem_movimento ?? et.intSemMovimento} {typeof c.dias_sem_movimento === "number" ? (idioma === "pt" ? "dias" : idioma === "es" ? "días" : "days") : ""}</span>
                  </div>
                ))}
              </CanvasBox>

              <CanvasBox cor={BRONZE}>
                <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.copilotoDinheiroParadoTitulo}</p>
                {capitalImobilizado.slice().sort((a, b) => b.capital_imobilizado - a.capital_imobilizado).slice(0, 5).map((c) => (
                  <div key={c.produto_id} className="flex justify-between text-sm py-1.5 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                    <span style={{ color: "#c8d8f0" }}>{c.nome}</span>
                    <span style={{ color: BRONZE }}>{fBRL(c.capital_imobilizado)}</span>
                  </div>
                ))}
              </CanvasBox>

              <CanvasBox cor={ATENCAO}>
                <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.copilotoReporTitulo}</p>
                {alertasReposicao.length === 0 ? <p className="text-xs" style={{ color: "#5a7a9a" }}>{et.intSemLeadTime}</p> : alertasReposicao.slice(0, 5).map((a) => (
                  <div key={a.produto_id} className="flex justify-between text-sm py-1.5 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                    <span style={{ color: "#c8d8f0" }}>{a.nome}</span>
                    <span style={{ color: ATENCAO }}>{a.pontoReposicao} un.</span>
                  </div>
                ))}
              </CanvasBox>

              <CanvasBox cor={NEUTRO}>
                <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.copilotoPromoverTitulo}</p>
                {(() => {
                  const idsParados = new Set(capitalImobilizado.filter((c) => (c.dias_sem_movimento ?? 0) > 30).map((c) => c.produto_id));
                  const classeCParada = curvaAbc.filter((c) => c.classe_abc === "C" && idsParados.has(c.produto_id));
                  return classeCParada.length === 0 ? <p className="text-xs" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : classeCParada.slice(0, 5).map((c) => (
                    <div key={c.produto_id} className="flex justify-between text-sm py-1.5 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                      <span style={{ color: "#c8d8f0" }}>{c.nome}</span>
                      <span style={{ color: NEUTRO }}>Classe C</span>
                    </div>
                  ));
                })()}
              </CanvasBox>

              <CanvasBox cor={NEGATIVO}>
                <p className="text-sm font-bold mb-3" style={{ color: "#c8d8f0" }}>{et.copilotoRupturaTitulo}</p>
                {alertasReposicao.filter((a) => (a.diasRestantes ?? 99) <= 7).length === 0 ? <p className="text-xs" style={{ color: "#5a7a9a" }}>{et.intSemDados}</p> : (
                  alertasReposicao.filter((a) => (a.diasRestantes ?? 99) <= 7).map((a) => (
                    <div key={a.produto_id} className="flex justify-between text-sm py-1.5 border-t" style={{ borderColor: "rgba(4,120,87,0.1)" }}>
                      <span style={{ color: "#c8d8f0" }}>{a.nome}</span>
                      <span style={{ color: NEGATIVO }} className="font-bold">{a.diasRestantes} {idioma === "pt" ? "dias" : idioma === "es" ? "días" : "days"}</span>
                    </div>
                  ))
                )}
              </CanvasBox>
            </>
          )}
        </div>
      )}

      {/* ================= MODAL PRODUTO ================= */}
      <ModalPremium aberto={modalProdutoAberto} onFechar={() => setModalProdutoAberto(false)} titulo={produtoEditando ? et.modalEditarProduto : et.modalNovoProduto} largo>
        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-3">
          <SecaoTitulo>{et.secaoSegmento}</SecaoTitulo>
          <CampoSelect label={`${et.campoSegmento} ${et.segmentoPadraoHint}`} value={formProduto.segmento || ""}
            onChange={(v) => setFormProduto((f) => ({ ...f, segmento: v || null }))}
            opcoes={SEGMENTOS.map((s) => ({ value: s.value, label: s.label[idioma] }))} />

          <SecaoTitulo>{et.secaoIdentificacao}</SecaoTitulo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label={et.campoNome} value={formProduto.nome || ""} onChange={(v) => setFormProduto((f) => ({ ...f, nome: v }))} onBlur={sugerirCategoriaSeVazia} />
            <Campo label={et.campoCodigoInterno} value={formProduto.codigo_interno || ""} onChange={(v) => setFormProduto((f) => ({ ...f, codigo_interno: v }))} />
            <div className="flex items-end gap-1">
              <div className="flex-1">
                <Campo label={et.campoCodigoBarras} value={formProduto.codigo_barras || ""} onChange={(v) => setFormProduto((f) => ({ ...f, codigo_barras: v }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleConsultarEan(); } }} />
              </div>
              <button type="button" onClick={handleConsultarEan} disabled={consultandoEan || !formProduto.codigo_barras?.trim()}
                title={et.botaoBuscarEan} className="p-2.5 rounded-xl shrink-0 disabled:opacity-40" style={{ background: "rgba(4,120,87,0.15)", color: JADE }}>
                <ScanBarcode size={17} className={consultandoEan ? "animate-pulse" : ""} />
              </button>
            </div>
            <Campo label={et.campoSku} value={formProduto.sku || ""} onChange={(v) => setFormProduto((f) => ({ ...f, sku: v }))} />
            <Campo label={et.campoCategoria} value={formProduto.categoria || ""}
              onChange={(v) => { setFormProduto((f) => ({ ...f, categoria: v })); }}
              dica={categoriaSugerida && formProduto.categoria === categoriaSugerida ? et.sugeridoAutomaticamente : undefined} />
            <Campo label={et.campoSubcategoria} value={formProduto.subcategoria || ""} onChange={(v) => setFormProduto((f) => ({ ...f, subcategoria: v }))} />
            <Campo label={et.campoMarca} value={formProduto.marca || ""} onChange={(v) => setFormProduto((f) => ({ ...f, marca: v }))} />
            <Campo label={et.campoFabricante} value={formProduto.fabricante || ""} onChange={(v) => setFormProduto((f) => ({ ...f, fabricante: v }))} />
            <CampoSelect label={et.campoFornecedor} value={formProduto.fornecedor_id || ""} onChange={(v) => setFormProduto((f) => ({ ...f, fornecedor_id: v || null }))} opcoes={opcoesFornecedor} />
          </div>
          <CampoTextarea label={et.campoDescricao} value={formProduto.descricao || ""} onChange={(v) => setFormProduto((f) => ({ ...f, descricao: v }))} />

          <SecaoTitulo>{et.secaoDimensoes}</SecaoTitulo>
          <div className="grid grid-cols-3 gap-3">
            <Campo label={et.campoUnidade} value={formProduto.unidade || "UN"} onChange={(v) => setFormProduto((f) => ({ ...f, unidade: v }))} lista={UNIDADES} />
            <Campo label={et.campoPeso} tipo="number" value={String(formProduto.peso ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, peso: v ? Number(v) : null }))} />
            <Campo label={et.campoCor} value={formProduto.cor || ""} onChange={(v) => setFormProduto((f) => ({ ...f, cor: v }))} />
            <Campo label={et.campoAltura} tipo="number" value={String(formProduto.altura ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, altura: v ? Number(v) : null }))} />
            <Campo label={et.campoLargura} tipo="number" value={String(formProduto.largura ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, largura: v ? Number(v) : null }))} />
            <Campo label={et.campoComprimento} tipo="number" value={String(formProduto.comprimento ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, comprimento: v ? Number(v) : null }))} />
            <Campo label={et.campoVolume} tipo="number" value={String(formProduto.volume ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, volume: v ? Number(v) : null }))} />
            <Campo label={et.campoModelo} value={formProduto.modelo || ""} onChange={(v) => setFormProduto((f) => ({ ...f, modelo: v }))} />
          </div>

          <SecaoTitulo>{et.secaoLocalizacao}</SecaoTitulo>
          {combosLocalizacao.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="text-[10px] font-semibold" style={{ color: "#5a7a9a" }}>{et.localizacoesJaUsadas}</span>
              {combosLocalizacao.map((c, i) => (
                <button key={i} type="button" onClick={() => aplicarComboLocalizacao(c)}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: "rgba(4,120,87,0.1)", color: JADE }}>
                  {[c.rua, c.prateleira, c.nivel, c.posicao].filter(Boolean).join(" / ") || "—"}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-4 gap-3">
            <Campo label={et.campoRua} value={formProduto.rua || ""} onChange={(v) => setFormProduto((f) => ({ ...f, rua: v }))}
              onFocus={() => garantirSugestaoColuna("rua")} lista={sugestoes["col:rua"]} />
            <Campo label={et.campoPrateleira} value={formProduto.prateleira || ""} onChange={(v) => setFormProduto((f) => ({ ...f, prateleira: v }))}
              onFocus={() => garantirSugestaoColuna("prateleira")} lista={sugestoes["col:prateleira"]} />
            <Campo label={et.campoNivel} value={formProduto.nivel || ""} onChange={(v) => setFormProduto((f) => ({ ...f, nivel: v }))}
              onFocus={() => garantirSugestaoColuna("nivel")} lista={sugestoes["col:nivel"]} />
            <Campo label={et.campoPosicao} value={formProduto.posicao || ""} onChange={(v) => setFormProduto((f) => ({ ...f, posicao: v }))}
              onFocus={() => garantirSugestaoColuna("posicao")} lista={sugestoes["col:posicao"]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoSelect label={et.campoCentroCusto} value={formProduto.centro_custo_id || ""} onChange={(v) => setFormProduto((f) => ({ ...f, centro_custo_id: v || null }))} opcoes={opcoesCentroCusto} />
            <Campo label={et.campoContaContabil} value={formProduto.conta_contabil || ""} onChange={(v) => setFormProduto((f) => ({ ...f, conta_contabil: v }))}
              onFocus={() => garantirSugestaoColuna("conta_contabil")} lista={sugestoes["col:conta_contabil"]} />
          </div>

          {(CAMPOS_CONDICIONAIS_POR_SEGMENTO[segmentoEfetivo] || []).length > 0 && (
            <SecaoColapsavel titulo={et.secaoCamposNicho} aberta={secaoCamposNichoAberta} onToggle={() => setSecaoCamposNichoAberta((a) => !a)}>
              <div className="grid grid-cols-3 gap-3">
                {(CAMPOS_CONDICIONAIS_POR_SEGMENTO[segmentoEfetivo] || [])
                  .filter((campo) => !campo.dependeDe || !!(formProduto.atributos_nicho || {})[campo.dependeDe])
                  .map((campo) => {
                  const valorAtual = (formProduto.atributos_nicho || {})[campo.chave];
                  if (campo.tipo === "boolean") {
                    return (
                      <label key={campo.chave} className="flex items-center gap-2 cursor-pointer select-none py-2">
                        <input type="checkbox" checked={!!valorAtual} className="w-4 h-4 rounded"
                          onChange={(e) => setFormProduto((f) => ({ ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [campo.chave]: e.target.checked } }))} />
                        <span className="text-xs font-semibold" style={labelStyle}>{campo.label[idioma]}</span>
                      </label>
                    );
                  }
                  if (campo.tipo === "select") {
                    return (
                      <CampoSelect key={campo.chave} label={campo.label[idioma]} value={valorAtual || ""}
                        onChange={(v) => setFormProduto((f) => ({ ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [campo.chave]: v } }))}
                        opcoes={(campo.opcoes || []).map((o) => ({ value: o.value, label: o.label[idioma] }))} />
                    );
                  }
                  return (
                    <Campo key={campo.chave} label={campo.label[idioma]} tipo={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"} value={String(valorAtual ?? "")}
                      onChange={(v) => setFormProduto((f) => ({ ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [campo.chave]: campo.tipo === "number" ? (v ? Number(v) : null) : v } }))}
                      onFocus={campo.tipo === "text" ? () => garantirSugestaoAtributo(campo.chave) : undefined}
                      lista={campo.tipo === "text" ? sugestoes[`attr:${campo.chave}`] : undefined} />
                  );
                })}
              </div>
            </SecaoColapsavel>
          )}

          {!produtoEditando && !!(formProduto.atributos_nicho || {})[CHAVE_PERECIVEL] && (
            <>
              <SecaoTitulo>{et.secaoLoteInicial}</SecaoTitulo>
              <div className="grid grid-cols-3 gap-3">
                <Campo label={et.campoNumeroLote} value={loteInicial.numero_lote} onChange={(v) => setLoteInicial((l) => ({ ...l, numero_lote: v }))} />
                <Campo label={et.campoDataFabricacao} tipo="date" value={loteInicial.data_fabricacao} onChange={(v) => setLoteInicial((l) => ({ ...l, data_fabricacao: v }))} />
                <Campo label={et.campoValidade} tipo="date" value={loteInicial.data_validade} onChange={(v) => setLoteInicial((l) => ({ ...l, data_validade: v }))} />
                <Campo label={et.campoQuantidade} tipo="number" value={loteInicial.quantidade} onChange={(v) => setLoteInicial((l) => ({ ...l, quantidade: v }))} />
                <Campo label={et.campoCustoUnitario} tipo="number" value={loteInicial.custo_unitario} onChange={(v) => setLoteInicial((l) => ({ ...l, custo_unitario: v }))} />
              </div>
            </>
          )}

          <SecaoTitulo>{et.secaoCamposPersonalizados}</SecaoTitulo>
          <div className="grid grid-cols-3 gap-3">
            {camposPersonalizados.map((campo) => (
              <div key={campo.chave} className="flex items-end gap-1">
                <div className="flex-1">
                  <Campo label={campo.nome} tipo={campo.tipo === "number" ? "number" : campo.tipo === "date" ? "date" : "text"}
                    value={String((formProduto.atributos_nicho || {})[campo.chave] ?? "")}
                    onChange={(v) => setFormProduto((f) => ({ ...f, atributos_nicho: { ...(f.atributos_nicho || {}), [campo.chave]: campo.tipo === "number" ? (v ? Number(v) : null) : v } }))} />
                </div>
                <button type="button" onClick={() => excluirCampoPersonalizadoHandler(campo)} className="p-2.5 rounded-xl shrink-0" style={{ color: NEGATIVO }} title={et.excluirCampoPersonalizado}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          {!mostrarNovoCampo ? (
            camposPersonalizados.length < MAX_CAMPOS_PERSONALIZADOS && (
              <button onClick={() => setMostrarNovoCampo(true)} className="text-xs font-semibold" style={{ color: JADE }}>{et.adicionarCampoPersonalizado}</button>
            )
          ) : (
            <div className="grid grid-cols-3 gap-3 items-end p-3 rounded-xl" style={{ background: "rgba(4,120,87,0.06)" }}>
              <Campo label={et.campoNomeDoCampo} value={novoCampoNome} onChange={setNovoCampoNome} />
              <CampoSelect label={et.campoTipoDoCampo} value={novoCampoTipo} onChange={(v) => setNovoCampoTipo(v as any)}
                opcoes={[{ value: "text", label: et.tipoTexto }, { value: "number", label: et.tipoNumero }, { value: "date", label: et.tipoData }]} />
              <button onClick={async () => {
                if (!empresaId || !novoCampoNome.trim()) return;
                const chave = novoCampoNome.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
                const novo = { chave, nome: novoCampoNome.trim(), tipo: novoCampoTipo };
                const { erro } = await adicionarCampoPersonalizado(empresaId, camposPersonalizados, novo);
                if (erro) { mostrarToast(erro === "SEM_PERMISSAO_ESCRITA" ? et.toastSemPermissaoEscrita : erro, "erro"); return; }
                setCamposPersonalizados((c) => [...c, novo]);
                setNovoCampoNome(""); setNovoCampoTipo("text"); setMostrarNovoCampo(false);
              }} className="py-2.5 rounded-xl text-sm font-semibold" style={{ background: JADE, color: "#fff" }}>{et.salvarCampo}</button>
            </div>
          )}

          <SecaoTitulo>{et.secaoPrecos}</SecaoTitulo>
          {produtoEditando && (
            <div className="p-3 rounded-xl mb-1" style={{ background: "rgba(4,120,87,0.08)" }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: "#5a7a9a" }}>{et.campoCustoMedioSistema}</p>
              <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{moeda(formProduto.preco_medio)}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <CampoMoeda label={et.campoCusto} valor={formProduto.preco_custo}
              onChange={(v) => {
                const custo = v ?? 0;
                setFormProduto((f) => ({ ...f, preco_custo: custo }));
                aplicarCalculoPreco(custo, Number(markupPct) || 0);
              }} />
            <Campo label={et.campoMarkupPct} tipo="number" value={markupPct}
              onChange={(v) => {
                setMarkupPct(v);
                aplicarCalculoPreco(Number(formProduto.preco_custo) || 0, Number(v) || 0);
              }} />
            {/* Preço Sugerido é só leitura — resultado do cálculo acima (custo × (1 + markup/100)),
                nunca digitado direto. Mesmo padrão visual do quadro "Custo Médio (sistema)" logo acima:
                informativo, não um input. */}
            <div>
              <p className={labelCls} style={labelStyle}>{et.campoPrecoSugerido}</p>
              <p className="text-sm py-2" style={{ color: "#c8d8f0" }}>{moeda(formProduto.preco_sugerido)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 items-start">
            <CampoMoeda label={et.campoPrecoVenda} valor={formProduto.preco_venda}
              onChange={(v) => setFormProduto((f) => ({ ...f, preco_venda: v }))} />
            <div className="flex flex-col justify-center">
              {(formProduto.preco_sugerido || 0) > 0 && (
                <button type="button"
                  onClick={() => setFormProduto((f) => ({ ...f, preco_venda: f.preco_sugerido ?? null }))}
                  className="text-xs font-semibold underline text-left mt-6" style={{ color: NEUTRO }}>
                  {et.linkUsarSugestao} ({moeda(formProduto.preco_sugerido)})
                </button>
              )}
            </div>
            {(formProduto.preco_venda || 0) > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold" style={{ color: POSITIVO }}>
                  {et.campoMargemReal}: {margemReal(formProduto.preco_venda || 0, formProduto.preco_custo || 0).toFixed(1)}%
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CampoMoeda label={et.campoPrecoMinimo} valor={formProduto.preco_minimo} onChange={(v) => setFormProduto((f) => ({ ...f, preco_minimo: v }))} />
            <CampoMoeda label={et.campoPrecoPromocional} valor={formProduto.preco_promocional} onChange={(v) => setFormProduto((f) => ({ ...f, preco_promocional: v }))} />
            {produtoEditando && (
              <div><p className={labelCls} style={labelStyle}>{et.campoMargemMarkup}</p><p className="text-sm py-2" style={{ color: "#c8d8f0" }}>{(formProduto.margem ?? 0).toFixed(1)}% / {(formProduto.markup ?? 0).toFixed(1)}%</p></div>
            )}
          </div>

          <SecaoColapsavel titulo={et.secaoFiscal} aberta={secaoFiscalAberta} onToggle={() => setSecaoFiscalAberta((a) => !a)}>
            <div className="grid grid-cols-4 gap-3">
              <Campo label={et.campoNcm} value={formProduto.ncm || ""} onChange={(v) => setFormProduto((f) => ({ ...f, ncm: v }))} />
              <Campo label={et.campoCest} value={formProduto.cest || ""} onChange={(v) => setFormProduto((f) => ({ ...f, cest: v }))} />
              <Campo label={et.campoCfop} value={formProduto.cfop_padrao || ""} onChange={(v) => setFormProduto((f) => ({ ...f, cfop_padrao: v }))} />
              <Campo label={et.campoIpi} tipo="number" value={String(formProduto.ipi ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, ipi: v ? Number(v) : null }))} />
              <Campo label={et.campoIcms} tipo="number" value={String(formProduto.icms ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, icms: v ? Number(v) : null }))} />
              <Campo label={et.campoPis} tipo="number" value={String(formProduto.pis ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, pis: v ? Number(v) : null }))} />
              <Campo label={et.campoCofins} tipo="number" value={String(formProduto.cofins ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, cofins: v ? Number(v) : null }))} />
              <Campo label={et.campoIss} tipo="number" value={String(formProduto.iss ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, iss: v ? Number(v) : null }))} />
            </div>
          </SecaoColapsavel>

          <SecaoTitulo>{et.secaoControle}</SecaoTitulo>
          <div className="grid grid-cols-3 gap-3">
            <Campo label={et.campoEstoqueMinimo} tipo="number" value={String(formProduto.estoque_minimo ?? 0)} onChange={(v) => setFormProduto((f) => ({ ...f, estoque_minimo: Number(v) }))} />
            <Campo label={et.campoEstoqueMaximo} tipo="number" value={String(formProduto.estoque_maximo ?? "")} onChange={(v) => setFormProduto((f) => ({ ...f, estoque_maximo: v ? Number(v) : null }))} />
            <CampoSelect label={et.colStatus} value={formProduto.status || "ativo"} onChange={(v) => setFormProduto((f) => ({ ...f, status: v as any }))} opcoes={[{ value: "ativo", label: et.statusAtivo }, { value: "inativo", label: et.statusInativo }]} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>{et.campoImagem}</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl relative overflow-hidden flex items-center justify-center shrink-0" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(4,120,87,0.25)" }}>
                <ImagePlus size={20} style={{ color: "#5a7a9a" }} />
                {(previewImagem || formProduto.imagem_principal) && (
                  <img src={previewImagem || urlImagemProduto(formProduto.imagem_principal!)} alt="" className="absolute inset-0 w-16 h-16 object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }} />
                )}
              </div>
              <label className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm cursor-pointer" style={{ ...inputStyle, opacity: comprimindoImagem ? 0.6 : 1 }}>
                <ImagePlus size={16} /> {comprimindoImagem ? et.comprimindoImagem : (arquivoImagem?.name || et.escolherArquivo)}
                <input type="file" accept="image/*" className="hidden" disabled={comprimindoImagem}
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setComprimindoImagem(true);
                    try {
                      const comprimido = await comprimirImagem(f);
                      setArquivoImagem(comprimido);
                      setPreviewImagem((old) => { if (old) URL.revokeObjectURL(old); return URL.createObjectURL(comprimido); });
                    } catch {
                      mostrarToast(et.toastImagemProcessarFalhou, "erro");
                    } finally {
                      setComprimindoImagem(false);
                    }
                  }} />
              </label>
            </div>
          </div>
          <CampoTextarea label={et.campoObservacoes} value={formProduto.observacoes || ""} onChange={(v) => setFormProduto((f) => ({ ...f, observacoes: v }))} />

          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalProdutoAberto(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>{et.cancelar}</button>
            <button onClick={salvarProduto} disabled={salvandoProduto} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${JADE_ESCURO}, ${JADE})`, color: "#fff" }}>
              {salvandoProduto ? et.salvando : et.salvar}
            </button>
          </div>
        </div>
      </ModalPremium>

      {/* ================= MODAL EDIÇÃO EM LOTE ================= */}
      <ModalPremium aberto={modalLoteAberto} onFechar={() => setModalLoteAberto(false)} titulo={`${et.editarEmLote} (${produtosSelecionados.size})`}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label={et.campoCategoria} value={formLote.categoria || ""} onChange={(v) => setFormLote((f) => ({ ...f, categoria: v }))} />
            <Campo label={et.campoMarca} value={formLote.marca || ""} onChange={(v) => setFormLote((f) => ({ ...f, marca: v }))} />
            <CampoSelect label={et.campoFornecedor} value={formLote.fornecedor_id || ""} onChange={(v) => setFormLote((f) => ({ ...f, fornecedor_id: v || undefined }))} opcoes={opcoesFornecedor} />
            <CampoSelect label={et.campoCentroCusto} value={formLote.centro_custo_id || ""} onChange={(v) => setFormLote((f) => ({ ...f, centro_custo_id: v || undefined }))} opcoes={opcoesCentroCusto} />
            <Campo label={et.campoEstoqueMinimo} tipo="number" value={String(formLote.estoque_minimo ?? "")} onChange={(v) => setFormLote((f) => ({ ...f, estoque_minimo: v ? Number(v) : undefined }))} />
            <CampoSelect label={et.colStatus} value={formLote.status || ""} onChange={(v) => setFormLote((f) => ({ ...f, status: (v || undefined) as any }))} opcoes={[{ value: "ativo", label: et.statusAtivo }, { value: "inativo", label: et.statusInativo }]} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalLoteAberto(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>{et.cancelar}</button>
            <button onClick={salvarLote} disabled={salvandoLote} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${JADE_ESCURO}, ${JADE})`, color: "#fff" }}>
              {salvandoLote ? et.salvando : et.aplicarEmLote}
            </button>
          </div>
        </div>
      </ModalPremium>

      {/* ================= MODAL MOVIMENTAÇÃO ================= */}
      <ModalPremium aberto={modalMovAberto} onFechar={() => setModalMovAberto(false)} titulo={movEditando ? et.modalEditarMovimentacao : et.modalNovaMovimentacao}>
        <div className="space-y-3">
          <div>
            <label className={labelCls} style={labelStyle}>{et.campoNome.replace(" *", "")} *</label>
            <input value={buscaProdutoMov} onChange={(e) => buscarProdutosMov(e.target.value)} onKeyDown={leitorMov.onKeyDown}
              placeholder={et.campoProdutoBusca} disabled={!!movEditando}
              className={inputCls} style={{ ...inputStyle, opacity: movEditando ? 0.6 : 1 }} />
            {resultadosProdutoMov.length > 0 && (
              <div className="mt-1 rounded-xl overflow-hidden" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(4,120,87,0.25)" }}>
                {resultadosProdutoMov.map((p) => (
                  <button key={p.id} onClick={() => selecionarProdutoMov(p)} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5" style={{ color: "#c8d8f0" }}>
                    {p.nome} <span style={{ color: "#5a7a9a" }}>· {et.colSaldo.toLowerCase()} {p.saldo_disponivel}</span>
                  </button>
                ))}
              </div>
            )}
            {produtoSelecionadoMov && (
              <p className="text-[11px] mt-1" style={{ color: POSITIVO }}>{produtoSelecionadoMov.nome} ({et.colSaldo}: {produtoSelecionadoMov.saldo_disponivel})</p>
            )}
          </div>

          <CampoSelect label={et.campoTipo} value={formMov.tipo || "entrada"} onChange={(v) => setFormMov((f: any) => ({ ...f, tipo: v }))}
            opcoes={TIPOS_MOV.map((tp) => ({ value: tp.value, label: tp.label }))} />

          <div className="grid grid-cols-2 gap-3">
            <Campo label={et.campoQuantidade} tipo="number" value={String(formMov.quantidade ?? "")} onChange={(v) => setFormMov((f: any) => ({ ...f, quantidade: v }))} />
            {formMov.tipo === "entrada" && (
              <Campo label={et.campoCustoUnitario} tipo="number" value={String(formMov.custo_unitario ?? "")} onChange={(v) => setFormMov((f: any) => ({ ...f, custo_unitario: v }))} />
            )}
          </div>

          {formMov.tipo === "entrada" && (
            <CampoSelect label={et.campoSituacaoRecebimento} value={formMov.status_recebimento || "confirmada"} onChange={(v) => setFormMov((f: any) => ({ ...f, status_recebimento: v }))}
              opcoes={[{ value: "confirmada", label: et.opcaoConfirmada }, { value: "em_transito", label: et.opcaoEmTransito }]} />
          )}

          {(formMov.tipo === "ajuste" || formMov.tipo === "inventario") && (
            <CampoSelect label={et.campoOndeAplicarAjuste} value={formMov.destino_saldo || "disponivel"} onChange={(v) => setFormMov((f: any) => ({ ...f, destino_saldo: v }))}
              opcoes={[{ value: "disponivel", label: et.opcaoDisponivel }, { value: "reservado", label: et.opcaoReservado }]} />
          )}

          {formMov.tipo === "entrada" && (
            <div className="grid grid-cols-2 gap-3">
              <Campo label={et.campoNumeroLote} value={formMov.numero_lote || ""} onChange={(v) => setFormMov((f: any) => ({ ...f, numero_lote: v }))} />
              <Campo label={et.campoValidade} tipo="date" value={formMov.data_validade || ""} onChange={(v) => setFormMov((f: any) => ({ ...f, data_validade: v }))} />
            </div>
          )}

          {formMov.tipo === "saida" && lotesProdutoMov.length > 0 && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)" }}>
              <CampoSelect label={et.sugestaoFefoTitulo}
                value={formMov.lote_id || fefoSugestao[0]?.lote.id || ""}
                onChange={(v) => setFormMov((f: any) => ({ ...f, lote_id: v }))}
                opcoes={lotesProdutoMov.map((l) => ({
                  value: l.id,
                  label: `${l.numero_lote || "—"} · ${l.quantidade_atual} · ${l.data_validade ? new Date(l.data_validade).toLocaleDateString("pt-BR") : "—"}`,
                }))} />
            </div>
          )}

          <Campo label={et.campoDataHora} tipo="datetime-local" value={formMov.data_hora || ""} onChange={(v) => setFormMov((f: any) => ({ ...f, data_hora: v }))} />
          <Campo label={et.campoDocumentoRef} value={formMov.documento_ref || ""} onChange={(v) => setFormMov((f: any) => ({ ...f, documento_ref: v }))} placeholder={et.campoDocumentoRefPlaceholder} />
          <CampoTextarea label={et.campoMotivo} value={formMov.motivo || ""} onChange={(v) => setFormMov((f: any) => ({ ...f, motivo: v }))} />

          <div className="flex gap-2 pt-2">
            <button onClick={() => setModalMovAberto(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8" }}>{et.cancelar}</button>
            <button onClick={salvarMovimentacao} disabled={salvandoMov} className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${JADE_ESCURO}, ${JADE})`, color: "#fff" }}>
              {salvandoMov ? et.salvando : et.salvar}
            </button>
          </div>
        </div>
      </ModalPremium>

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={idioma}
        textoResumo={argsShare ? textoResumoPdf(argsShare) : et.titulo}
        textoDetalhado={argsShare ? textoDetalhadoPdf(argsShare) : undefined}
        assunto={`${et.titulo} — Axioma`}
        onExportarPDF={argsShare ? () => gerarPdfTabela(argsShare, (msg) => mostrarToast(msg, "erro"), lang) : undefined}
        cor={JADE}
      />
    </ModuloLayout>
  );
}
