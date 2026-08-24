"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search, Pencil, Trash2, X, Plus, CheckCircle2, RotateCcw, Paperclip,
  Upload, FileText, AlertTriangle, Sparkles, Landmark, Share2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBrowserClient } from "@supabase/ssr";
import { useLanguage } from "../../../lib/LanguageContext";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import { obterEmpresaAtiva, obterMeuPapel } from "../../../lib/empresaHelpers";
import { CATEGORIAS_DESPESA, labelCategoriaDespesa } from "../../../lib/categoriasDespesa";
import { parseXMLNFe } from "../../../lib/importarParsers";
import { buscarFornecedorPorCnpj } from "../../../lib/pdvNfeHelpers";
import {
  type ContaPagar, type ContaPagarDocumento, type NfeJaImportada, type ConfigAp, type DuplicataDetectada,
  listarContasPagar, criarContaPagar, editarContaPagar, darBaixaContaPagar, estornarBaixaContaPagar, excluirContaPagar,
  gerarContaDeCustoFixo, listarDocumentos, anexarDocumento, excluirDocumento, gerarUrlDocumento,
  classificarCategoria, checarNfeJaImportadaNoPdv,
  obterConfigAp, detectarDuplicata, registrarAuditoriaAp,
} from "../../../lib/contasPagarHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VERDE = "#34d399";
const VERMELHO = "#f87171";
const AZUL = "#6ab0ff";
const AMBAR = "#f59e0b";
const CINZA = "#5a7a9a";
const ROXO = "#a78bfa";

const FORMAS_PAGAMENTO = ["PIX", "Boleto", "Cartão de Crédito", "Cartão de Débito", "Dinheiro", "Transferência"];
const PAPEIS_ESCRITA = ["dono", "admin", "financeiro"];
const TIPOS_DOC = [
  { key: "boleto", label: { pt: "Boleto", en: "Bill slip", es: "Boleto" } },
  { key: "nota_fiscal", label: { pt: "Nota Fiscal", en: "Invoice", es: "Factura" } },
  { key: "comprovante", label: { pt: "Comprovante", en: "Receipt", es: "Comprobante" } },
  { key: "outro", label: { pt: "Outro", en: "Other", es: "Otro" } },
];
const TAMANHO_MAX_ANEXO = 10 * 1024 * 1024;

type Fornecedor = { id: string; nome: string; nivel_dependencia?: string | null };
type CentroCusto = { id: string; nome: string };
type CustoFixo = { id: string; descricao: string; valor_mensal: number; dia_vencimento: number; categoria?: string | null; centro_custo_id?: string | null };

const contaVazia = {
  fornecedor_id: "", descricao: "", numero_nota: "", categoria: "" as string,
  valor_total: "", data_emissao: "", data_vencimento: "", forma_pagamento: FORMAS_PAGAMENTO[0],
  parcelas: "1", centro_custo_id: "", observacoes: "",
};

export default function ContasPagarPage() {
  const { idioma } = useLanguage();
  const L = (pt: string, en: string, es: string) => (idioma === "en" ? en : idioma === "es" ? es : pt);
  const cat = (c: string) => labelCategoriaDespesa(c, idioma as "pt" | "en" | "es");

  const [toast, setToast] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "erro" | "ok" = "erro") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }

  const [loading, setLoading] = useState(true);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailUsuario, setEmailUsuario] = useState<string | null>(null);
  const [papel, setPapel] = useState<string | null>(null);
  const podeEditar = papel != null && PAPEIS_ESCRITA.includes(papel);
  const [configAp, setConfigAp] = useState<ConfigAp | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroFornecedor, setFiltroFornecedor] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroVencDe, setFiltroVencDe] = useState("");
  const [filtroVencAte, setFiltroVencAte] = useState("");

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    setEmailUsuario(user.email || null);
    const empId = await obterEmpresaAtiva();
    setEmpresaId(empId);
    if (empId) setPapel(await obterMeuPapel(empId));
    const [cp, { data: forn }, { data: cc }, { data: cf }, cfgAp] = await Promise.all([
      listarContasPagar(),
      supabase.from("fornecedores").select("id, nome, nivel_dependencia").order("nome"),
      supabase.from("centros_custo").select("id, nome").order("nome"),
      supabase.from("custos_fixos").select("id, descricao, valor_mensal, dia_vencimento, categoria, centro_custo_id").order("dia_vencimento"),
      empId ? obterConfigAp(empId) : Promise.resolve(null),
    ]);
    setContas(cp);
    setFornecedores(forn || []);
    setCentrosCusto(cc || []);
    setCustosFixos(cf || []);
    setConfigAp(cfgAp);
    setLoading(false);
  }

  // ========== CÁLCULOS ==========
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];
  const em7dias = new Date(); em7dias.setDate(em7dias.getDate() + 7);
  const em7ISO = em7dias.toISOString().split("T")[0];
  const mesAtual = hoje.slice(0, 7);
  const nomeFornecedor = (id?: string | null) => fornecedores.find((f) => f.id === id)?.nome || "—";
  const resta = (c: ContaPagar) => Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0));

  const kpis = useMemo(() => {
    const abertas = contas.filter((c) => c.status !== "pago");
    const vencendo7 = abertas.filter((c) => c.data_vencimento && c.data_vencimento >= hoje && c.data_vencimento <= em7ISO);
    const vencidas = contas.filter((c) => c.status === "vencido");
    const pagasNoMes = contas.filter((c) => c.status === "pago" && (c.data_pagamento || "").slice(0, 7) === mesAtual);
    return {
      totalEmAberto: abertas.reduce((s, c) => s + resta(c), 0),
      vencendoEm7: vencendo7.reduce((s, c) => s + resta(c), 0),
      vencidas: vencidas.reduce((s, c) => s + resta(c), 0),
      pagasNoMes: pagasNoMes.reduce((s, c) => s + (c.valor_pago || 0), 0),
    };
  }, [contas, hoje, em7ISO, mesAtual]);

  const contasFiltradas = useMemo(() => {
    return contas.filter((c) => {
      if (filtroStatus !== "todos" && (c.status || "pendente") !== filtroStatus) return false;
      if (filtroFornecedor && c.fornecedor_id !== filtroFornecedor) return false;
      if (filtroCategoria && c.categoria !== filtroCategoria) return false;
      if (filtroVencDe && (!c.data_vencimento || c.data_vencimento < filtroVencDe)) return false;
      if (filtroVencAte && (!c.data_vencimento || c.data_vencimento > filtroVencAte)) return false;
      if (!busca) return true;
      const alvo = `${c.descricao} ${nomeFornecedor(c.fornecedor_id)} ${c.numero_nota || ""}`.toLowerCase();
      return alvo.includes(busca.toLowerCase());
    });
  }, [contas, busca, filtroStatus, filtroFornecedor, filtroCategoria, filtroVencDe, filtroVencAte, fornecedores]);

  function statusLabel(s?: string | null) {
    if (s === "pago") return L("Pago", "Paid", "Pagado");
    if (s === "parcial") return L("Parcial", "Partial", "Parcial");
    if (s === "vencido") return L("Vencida", "Overdue", "Vencida");
    return L("Pendente", "Pending", "Pendiente");
  }
  function statusCor(s?: string | null) {
    if (s === "pago") return VERDE;
    if (s === "parcial") return AZUL;
    if (s === "vencido") return VERMELHO;
    return CINZA;
  }

  // ========== COMPARTILHAR — reaproveita 100% CentroCompartilhamento ==========
  const [shareAberto, setShareAberto] = useState(false);
  const textoResumo = L(
    `Contas a Pagar Axioma: em aberto ${fmt(kpis.totalEmAberto)}, vencendo em 7 dias ${fmt(kpis.vencendoEm7)}, vencidas ${fmt(kpis.vencidas)}.`,
    `Axioma Accounts Payable: outstanding ${fmt(kpis.totalEmAberto)}, due in 7 days ${fmt(kpis.vencendoEm7)}, overdue ${fmt(kpis.vencidas)}.`,
    `Cuentas por Pagar Axioma: abierto ${fmt(kpis.totalEmAberto)}, vence en 7 días ${fmt(kpis.vencendoEm7)}, vencidas ${fmt(kpis.vencidas)}.`,
  );
  const textoDetalhado = [
    `🦅 AXIOMA AI.TECH — ${L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")} (${L("detalhado", "detailed", "detallado")})`,
    ...contasFiltradas.map((c) =>
      `${c.descricao} | ${nomeFornecedor(c.fornecedor_id)} | ${c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-"} | ${statusLabel(c.status)} | ${fmt(c.valor_total)}`
    ),
  ].join("\n");

  // ========== MODAL NOVA/EDITAR CONTA ==========
  const [modalConta, setModalConta] = useState(false);
  const [editando, setEditando] = useState<ContaPagar | null>(null);
  const [nc, setNc] = useState({ ...contaVazia });
  const [salvando, setSalvando] = useState(false);
  const [sugestaoCategoria, setSugestaoCategoria] = useState<string | null>(null);

  function abrirNovaConta() { setEditando(null); setNc({ ...contaVazia }); setSugestaoCategoria(null); setModalConta(true); }
  function abrirEdicaoConta(c: ContaPagar) {
    setEditando(c);
    setNc({
      fornecedor_id: c.fornecedor_id || "", descricao: c.descricao || "", numero_nota: c.numero_nota || "",
      categoria: c.categoria || "", valor_total: String(c.valor_total || ""),
      data_emissao: c.data_emissao || "", data_vencimento: c.data_vencimento || "",
      forma_pagamento: c.forma_pagamento || FORMAS_PAGAMENTO[0], parcelas: String(c.parcelas || "1"),
      centro_custo_id: c.centro_custo_id || "", observacoes: c.observacoes || "",
    });
    setSugestaoCategoria(null);
    setModalConta(true);
  }
  function fecharModalConta() { setModalConta(false); setEditando(null); setNc({ ...contaVazia }); setSugestaoCategoria(null); }

  async function sugerirCategoriaPorDescricao() {
    if (nc.categoria || !nc.descricao.trim()) return;
    const sugestao = await classificarCategoria(empresaId, nc.descricao);
    if (sugestao) setSugestaoCategoria(sugestao);
  }

  async function salvarConta() {
    if (!nc.descricao || !nc.valor_total || !nc.data_vencimento || !userId) return;
    const dados = {
      fornecedor_id: nc.fornecedor_id || null, descricao: nc.descricao, numero_nota: nc.numero_nota || null,
      categoria: nc.categoria || "Outros", valor_total: parseFloat(nc.valor_total || "0"),
      valor_pago: editando?.valor_pago || 0, data_emissao: nc.data_emissao || null, data_vencimento: nc.data_vencimento,
      forma_pagamento: nc.forma_pagamento, parcelas: parseInt(nc.parcelas || "1"),
      centro_custo_id: nc.centro_custo_id || null, observacoes: nc.observacoes || null,
    };

    if (editando) {
      // Edição não passa pela checagem de duplicidade — a conta já existe,
      // não está sendo criada de novo.
      setSalvando(true);
      const resultado = await editarContaPagar(editando.id, dados);
      if (resultado.erro) {
        showToast(L("Não foi possível salvar a conta. Tente novamente.", "Could not save the bill. Try again.", "No se pudo guardar la cuenta. Intente de nuevo."), "erro");
        setSalvando(false);
        return;
      }
      fecharModalConta(); await carregar(); setSalvando(false);
      return;
    }

    // Nova conta: checa duplicidade ANTES de inserir (mesmo caminho serve
    // pro formulário manual e pra Importar XML NF-e, que também termina
    // caindo neste modal antes de salvar).
    if (!empresaId) return;
    setSalvando(true);
    const { duplicatas } = await detectarDuplicata({
      empresaId, fornecedorId: nc.fornecedor_id || null, valorTotal: dados.valor_total,
      dataEmissao: nc.data_emissao || nc.data_vencimento, numeroNota: nc.numero_nota || null,
      diasJanela: configAp?.dias_janela_duplicata,
    });
    const relevantes = duplicatas.filter((d) => d.score >= 70);
    if (relevantes.length === 0) {
      await inserirContaDeFato(dados);
      return;
    }
    setDuplicatas(relevantes);
    setDadosPendentes(dados);
    setSenhaForcar(""); setErroForcar("");
    setModalDuplicata(true);
    await registrarAuditoriaAp(relevantes[0].contas_pagar_id, "duplicata_detectada", null, { candidata: dados, similares: relevantes });
    setSalvando(false);
  }

  async function inserirContaDeFato(dados: Record<string, any>, ignorouDuplicata: boolean = false) {
    if (!userId) return;
    setSalvando(true);
    const resultado = await criarContaPagar(userId, empresaId, dados);
    if (resultado.erro || !resultado.id) {
      showToast(L("Não foi possível salvar a conta. Tente novamente.", "Could not save the bill. Try again.", "No se pudo guardar la cuenta. Intente de nuevo."), "erro");
      setSalvando(false);
      return;
    }
    if (ignorouDuplicata) await registrarAuditoriaAp(resultado.id, "duplicata_ignorada", null, { duplicatas });
    fecharModalConta(); fecharModalDuplicata(); await carregar(); setSalvando(false);
  }

  // ========== COMMIT 2 — MODAL DE POSSÍVEL DUPLICATA ==========
  const [modalDuplicata, setModalDuplicata] = useState(false);
  const [duplicatas, setDuplicatas] = useState<DuplicataDetectada[]>([]);
  const [dadosPendentes, setDadosPendentes] = useState<Record<string, any> | null>(null);
  const [mostrarForcar, setMostrarForcar] = useState(false);
  const [senhaForcar, setSenhaForcar] = useState("");
  const [erroForcar, setErroForcar] = useState("");
  const [forcando, setForcando] = useState(false);

  const maiorScoreDuplicata = duplicatas.reduce((m, d) => Math.max(m, d.score), 0);
  const duplicataBloqueada = maiorScoreDuplicata >= 90 && (configAp?.bloquear_duplicata ?? true);

  function fecharModalDuplicata() {
    setModalDuplicata(false); setDuplicatas([]); setDadosPendentes(null);
    setMostrarForcar(false); setSenhaForcar(""); setErroForcar("");
  }

  async function salvarMesmoAssim() {
    if (!dadosPendentes) return;
    await inserirContaDeFato(dadosPendentes, true);
  }

  function vincularAExistente(dup: DuplicataDetectada) {
    const existente = contas.find((c) => c.id === dup.contas_pagar_id);
    if (!existente) return;
    fecharModalDuplicata();
    fecharModalConta();
    abrirEdicaoConta(existente);
  }

  async function confirmarForcarSenha() {
    if (!emailUsuario || !senhaForcar || !dadosPendentes) return;
    setForcando(true); setErroForcar("");
    const { error } = await supabase.auth.signInWithPassword({ email: emailUsuario, password: senhaForcar });
    if (error) {
      setErroForcar(L("Senha incorreta.", "Incorrect password.", "Contraseña incorrecta."));
      setForcando(false);
      return;
    }
    setForcando(false);
    await inserirContaDeFato(dadosPendentes, true);
  }

  async function excluir(c: ContaPagar) {
    const { erro } = await excluirContaPagar(c.id, c.status);
    if (erro === "conta_paga") {
      showToast(L("Não é possível excluir uma conta já paga. Estorne a baixa primeiro.", "You can't delete a bill that's already paid. Reverse the payment first.", "No se puede eliminar una cuenta ya pagada. Primero reversa el pago."), "erro");
      return;
    }
    if (erro) {
      showToast(L("Não foi possível excluir a conta. Tente novamente.", "Could not delete the bill. Try again.", "No se pudo eliminar la cuenta. Intente de nuevo."), "erro");
      return;
    }
    await carregar();
  }

  // ========== MODAL BAIXA / ESTORNO ==========
  const [modalBaixa, setModalBaixa] = useState(false);
  const [contaBaixa, setContaBaixa] = useState<ContaPagar | null>(null);
  const [valorBaixa, setValorBaixa] = useState("");
  const [dataBaixa, setDataBaixa] = useState("");
  const [formaBaixa, setFormaBaixa] = useState(FORMAS_PAGAMENTO[0]);
  const [processandoBaixa, setProcessandoBaixa] = useState(false);

  function abrirBaixa(c: ContaPagar) {
    setContaBaixa(c);
    setValorBaixa(resta(c).toFixed(2));
    setDataBaixa(hoje);
    setFormaBaixa(c.forma_pagamento || FORMAS_PAGAMENTO[0]);
    setModalBaixa(true);
  }
  function fecharBaixa() { setModalBaixa(false); setContaBaixa(null); }

  async function confirmarBaixa() {
    if (!contaBaixa || !valorBaixa || !dataBaixa) return;
    setProcessandoBaixa(true);
    const novoPago = (contaBaixa.valor_pago || 0) + parseFloat(valorBaixa);
    const { erro } = await darBaixaContaPagar(contaBaixa, novoPago, dataBaixa, formaBaixa);
    if (erro) {
      showToast(L("Não foi possível registrar a baixa. Tente novamente.", "Could not register the payment. Try again.", "No se pudo registrar el pago. Intente de nuevo."), "erro");
      setProcessandoBaixa(false);
      return;
    }
    fecharBaixa(); await carregar(); setProcessandoBaixa(false);
  }

  async function estornar(c: ContaPagar) {
    const { erro } = await estornarBaixaContaPagar(c);
    if (erro) {
      showToast(L("Não foi possível estornar a baixa. Tente novamente.", "Could not reverse the payment. Try again.", "No se pudo reversar el pago. Intente de nuevo."), "erro");
      return;
    }
    await carregar();
  }

  // ========== MODAL GERAR DE CUSTO FIXO ==========
  const [modalCustoFixo, setModalCustoFixo] = useState(false);
  const [gerando, setGerando] = useState<string | null>(null);

  async function gerarDeCustoFixo(cf: CustoFixo) {
    if (!userId) return;
    setGerando(cf.id);
    const resultado = await gerarContaDeCustoFixo(userId, empresaId, cf, mesAtual);
    if (resultado.erro) {
      showToast(L("Não foi possível gerar a conta. Tente novamente.", "Could not generate the bill. Try again.", "No se pudo generar la cuenta. Intente de nuevo."), "erro");
    } else if (resultado.jaExiste) {
      showToast(L("Este custo fixo já gerou uma conta a pagar neste mês.", "This fixed cost already generated a bill this month.", "Este costo fijo ya generó una cuenta a pagar este mes."), "ok");
    } else {
      showToast(L("Conta a pagar gerada com sucesso.", "Bill generated successfully.", "Cuenta a pagar generada con éxito."), "ok");
      await carregar();
    }
    setGerando(null);
  }

  // ========== MODAL ANEXO ==========
  const [modalAnexo, setModalAnexo] = useState(false);
  const [contaAnexo, setContaAnexo] = useState<ContaPagar | null>(null);
  const [documentos, setDocumentos] = useState<ContaPagarDocumento[]>([]);
  const [tipoNovoDoc, setTipoNovoDoc] = useState("boleto");
  const [enviandoDoc, setEnviandoDoc] = useState(false);

  async function abrirAnexo(c: ContaPagar) {
    setContaAnexo(c);
    setDocumentos(await listarDocumentos(c.id));
    setModalAnexo(true);
  }
  function fecharAnexo() { setModalAnexo(false); setContaAnexo(null); setDocumentos([]); }

  async function enviarAnexo(file: File) {
    if (!contaAnexo || !userId || !empresaId) return;
    if (!/^(application\/pdf|image\/)/.test(file.type)) {
      showToast(L("Envie um PDF ou uma imagem.", "Upload a PDF or an image.", "Envíe un PDF o una imagen."), "erro");
      return;
    }
    if (file.size > TAMANHO_MAX_ANEXO) {
      showToast(L("Arquivo muito grande (máx. 10MB).", "File too large (max 10MB).", "Archivo demasiado grande (máx. 10MB)."), "erro");
      return;
    }
    setEnviandoDoc(true);
    const { erro } = await anexarDocumento(file, contaAnexo.id, userId, empresaId, tipoNovoDoc);
    if (erro) {
      showToast(L("Não foi possível anexar o arquivo. Tente novamente.", "Could not attach the file. Try again.", "No se pudo adjuntar el archivo. Intente de nuevo."), "erro");
      setEnviandoDoc(false);
      return;
    }
    setDocumentos(await listarDocumentos(contaAnexo.id));
    setEnviandoDoc(false);
  }

  async function abrirDocumento(doc: ContaPagarDocumento) {
    const url = await gerarUrlDocumento(doc.storage_path);
    if (url) window.open(url, "_blank");
  }

  async function removerDocumento(doc: ContaPagarDocumento) {
    const { erro } = await excluirDocumento(doc);
    if (erro) {
      showToast(L("Não foi possível excluir o documento. Tente novamente.", "Could not delete the document. Try again.", "No se pudo eliminar el documento. Intente de nuevo."), "erro");
      return;
    }
    if (contaAnexo) setDocumentos(await listarDocumentos(contaAnexo.id));
  }

  // ========== IMPORTAR XML NF-E (com trava anti-duplicação) ==========
  const [processandoNfe, setProcessandoNfe] = useState(false);
  const [avisoNfeDuplicada, setAvisoNfeDuplicada] = useState<{ nfe: NfeJaImportada; dados: any } | null>(null);

  async function importarXmlNfe(file: File) {
    if (!empresaId || !userId) return;
    setProcessandoNfe(true);
    try {
      const texto = await file.text();
      const resultado = await parseXMLNFe(texto, undefined, idioma as any);
      const md = resultado.metadados || {};
      if (!md.chave_acesso && !md.razao_social) {
        showToast(L("Arquivo não reconhecido como NF-e válida.", "File not recognized as a valid NF-e.", "Archivo no reconocido como NF-e válida."), "erro");
        setProcessandoNfe(false);
        return;
      }
      const jaImportada = md.chave_acesso ? await checarNfeJaImportadaNoPdv(empresaId, md.chave_acesso) : null;
      if (jaImportada) {
        setAvisoNfeDuplicada({ nfe: jaImportada, dados: md });
        setProcessandoNfe(false);
        return;
      }
      await abrirModalComDadosNfe(md, null);
    } catch {
      showToast(L("Não foi possível ler o arquivo XML.", "Could not read the XML file.", "No se pudo leer el archivo XML."), "erro");
    }
    setProcessandoNfe(false);
  }

  async function abrirModalComDadosNfe(md: any, vincularNfeId: string | null) {
    let fornecedorId = "";
    if (md.cnpj_emitente && empresaId) {
      const forn = await buscarFornecedorPorCnpj(empresaId, md.cnpj_emitente);
      if (forn) fornecedorId = forn.id;
    }
    setEditando(null);
    setNc({
      ...contaVazia,
      fornecedor_id: fornecedorId,
      descricao: md.fantasia || md.razao_social || "",
      numero_nota: md.numero_nf || "",
      valor_total: md.valor_total ? String(md.valor_total) : "",
      data_emissao: md.data_emissao || "",
      observacoes: vincularNfeId ? L(
        `Vinculada à compra já importada pelo PDV (NF-e ${md.numero_nf || ""}).`,
        `Linked to the purchase already imported by the POS (NF-e ${md.numero_nf || ""}).`,
        `Vinculada a la compra ya importada por el PDV (NF-e ${md.numero_nf || ""}).`,
      ) : "",
    });
    setSugestaoCategoria(null);
    setModalConta(true);
    setAvisoNfeDuplicada(null);
  }

  // ========== RENDER ==========
  const semDados = contas.length === 0;

  return (
    <ModuloLayout
      titulo={L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")}
      subtitulo={L("Central de obrigações com fornecedores — vencimentos, baixas e anexos num só lugar.", "Supplier obligations center — due dates, payments and attachments in one place.", "Central de obligaciones con proveedores — vencimientos, pagos y adjuntos en un solo lugar.")}
      onNovo={podeEditar ? abrirNovaConta : undefined}
      labelBotao={L("Nova Conta", "New Bill", "Nueva Cuenta")}
      botaoExtra={
        <>
          {podeEditar && (
            <>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setModalCustoFixo(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "rgba(167,139,250,0.15)", color: ROXO, border: "1px solid rgba(167,139,250,0.3)" }}>
                <Landmark size={16} />{L("Gerar de Custo Fixo", "Generate from Fixed Cost", "Generar de Costo Fijo")}
              </motion.button>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm cursor-pointer"
                style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                <Upload size={16} />{processandoNfe ? L("Lendo…", "Reading…", "Leyendo…") : L("Importar XML NF-e", "Import NF-e XML", "Importar XML NF-e")}
                <input type="file" accept=".xml" className="hidden" disabled={processandoNfe}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importarXmlNfe(f); e.target.value = ""; }} />
              </label>
            </>
          )}
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "rgba(106,176,255,0.15)", color: AZUL, border: "1px solid rgba(106,176,255,0.3)" }}>
            <Share2 size={16} />{L("Compartilhar", "Share", "Compartir")}
          </motion.button>
        </>
      }
    >
      {!podeEditar && papel && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", color: AMBAR }}>
          <AlertTriangle size={14} />
          {L("Seu perfil tem acesso somente leitura a Contas a Pagar.", "Your profile has read-only access to Accounts Payable.", "Su perfil tiene acceso solo lectura a Cuentas por Pagar.")}
        </div>
      )}

      {avisoNfeDuplicada && (
        <div className="mb-4">
          <CanvasBox cor={AMBAR}>
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
            <p className="text-sm font-semibold mb-3" style={{ color: "#c8d8f0" }}>
              {L(`Esta NF-e já foi importada pelo PDV para estoque em ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("pt-BR")}. Deseja vincular esta conta a pagar à compra existente?`,
                `This NF-e was already imported by the POS into inventory on ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("en-US")}. Link this bill to the existing purchase?`,
                `Esta NF-e ya fue importada por el PDV al inventario el ${new Date(avisoNfeDuplicada.nfe.created_at).toLocaleDateString("es-ES")}. ¿Vincular esta cuenta a la compra existente?`)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => abrirModalComDadosNfe(avisoNfeDuplicada.dados, avisoNfeDuplicada.nfe.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: VERDE }}>
                {L("Sim, vincular", "Yes, link", "Sí, vincular")}
              </button>
              <button onClick={() => setAvisoNfeDuplicada(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: CINZA }}>
                {L("Não", "No", "No")}
              </button>
            </div>
          </CanvasBox>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: L("Total em Aberto", "Total Outstanding", "Total Abierto"), valor: kpis.totalEmAberto, cor: AMBAR },
          { label: L("Vencendo em 7 dias", "Due in 7 days", "Vence en 7 días"), valor: kpis.vencendoEm7, cor: AZUL },
          { label: L("Vencidas", "Overdue", "Vencidas"), valor: kpis.vencidas, cor: VERMELHO },
          { label: L("Pagas no Mês", "Paid this Month", "Pagadas este Mes"), valor: kpis.pagasNoMes, cor: VERDE },
        ].map((k) => (
          <CanvasBox key={k.label} cor={k.cor}>
            <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: CINZA }}>{k.label}</p>
            <p className="text-lg md:text-xl font-black" style={{ color: k.cor }}>{semDados ? "—" : fmt(k.valor)}</p>
          </CanvasBox>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: CINZA }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L("Buscar...", "Search...", "Buscar...")}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
        </div>
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
          <option value="todos">{L("Todos os status", "All statuses", "Todos los estados")}</option>
          <option value="pendente">{statusLabel("pendente")}</option>
          <option value="parcial">{statusLabel("parcial")}</option>
          <option value="vencido">{statusLabel("vencido")}</option>
          <option value="pago">{statusLabel("pago")}</option>
        </select>
        <select value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
          <option value="">{L("Todos os fornecedores", "All suppliers", "Todos los proveedores")}</option>
          {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
          <option value="">{L("Todas as categorias", "All categories", "Todas las categorías")}</option>
          {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
        </select>
        <input type="date" value={filtroVencDe} onChange={(e) => setFiltroVencDe(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
        <input type="date" value={filtroVencAte} onChange={(e) => setFiltroVencAte(e.target.value)} className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
      </div>

      {/* Lista */}
      {loading ? (
        <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L("Carregando...", "Loading...", "Cargando...")}</p>
      ) : contasFiltradas.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L("Nenhuma conta a pagar encontrada.", "No bills found.", "No se encontraron cuentas.")}</p>
      ) : (
        <div className="space-y-2">
          {contasFiltradas.map((c) => {
            const cor = statusCor(c.status);
            return (
              <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-xl p-3 md:p-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4"
                style={{ background: "rgba(10,20,36,0.6)", border: `1px solid ${cor}25` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{c.descricao}</p>
                  <p className="text-xs" style={{ color: CINZA }}>{nomeFornecedor(c.fornecedor_id)} · {c.categoria ? cat(c.categoria) : "—"}</p>
                </div>
                <div className="text-xs" style={{ color: CINZA }}>
                  {L("Vence", "Due", "Vence")} {c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                </div>
                <p className="text-sm font-bold w-28 text-right" style={{ color: "#c8d8f0" }}>{fmt(c.valor_total)}</p>
                <span className="px-2 py-1 rounded-lg text-xs font-semibold text-center w-24" style={{ background: `${cor}15`, color: cor }}>{statusLabel(c.status)}</span>
                <div className="flex items-center gap-2 flex-shrink-0 justify-end">
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirAnexo(c)} title={L("Anexos", "Attachments", "Adjuntos")} style={{ color: AZUL }}><Paperclip size={15} /></motion.button>
                  {podeEditar && (
                    <>
                      {c.status !== "pago" && (
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirBaixa(c)} title={L("Dar baixa", "Register payment", "Registrar pago")} style={{ color: VERDE }}><CheckCircle2 size={15} /></motion.button>
                      )}
                      {(c.status === "pago" || c.status === "parcial") && (
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => estornar(c)} title={L("Estornar baixa", "Reverse payment", "Reversar pago")} style={{ color: AMBAR }}><RotateCcw size={15} /></motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoConta(c)} title={L("Editar", "Edit", "Editar")} style={{ color: AMBAR }}><Pencil size={15} /></motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c)} title={L("Excluir", "Delete", "Eliminar")} style={{ color: c.status === "pago" ? "rgba(248,113,113,0.3)" : VERMELHO }}><Trash2 size={15} /></motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : "rgba(52,211,153,0.95)", color: "#0a1420" }}>
          {toast.msg}
        </div>
      )}

      {/* ====== MODAL NOVA/EDITAR CONTA ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalConta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-lg">
                <CanvasBox cor={AMBAR}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AMBAR }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? L("Editar Conta a Pagar", "Edit Bill", "Editar Cuenta a Pagar") : L("Nova Conta a Pagar", "New Bill", "Nueva Cuenta a Pagar")}</h3>
                    </div>
                    <button onClick={fecharModalConta} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Fornecedor", "Supplier", "Proveedor")}</label>
                      <select value={nc.fornecedor_id} onChange={(e) => setNc({ ...nc, fornecedor_id: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                        {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Descrição", "Description", "Descripción")} *</label>
                      <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} onBlur={sugerirCategoriaPorDescricao}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Valor Total (R$)", "Total (R$)", "Total (R$)")} *</label>
                        <input type="number" value={nc.valor_total} onChange={(e) => setNc({ ...nc, valor_total: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Categoria", "Category", "Categoría")}</label>
                        <select value={nc.categoria} onChange={(e) => { setNc({ ...nc, categoria: e.target.value }); setSugestaoCategoria(null); }}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Selecione", "Select", "Seleccione")} --</option>
                          {CATEGORIAS_DESPESA.map((c) => <option key={c} value={c}>{cat(c)}</option>)}
                        </select>
                        {sugestaoCategoria && !nc.categoria && (
                          <button onClick={() => { setNc({ ...nc, categoria: sugestaoCategoria }); setSugestaoCategoria(null); }}
                            className="mt-1 text-[10px] font-semibold flex items-center gap-1" style={{ color: ROXO }}>
                            <Sparkles size={10} /> {cat(sugestaoCategoria)}
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Emissão", "Issue Date", "Emisión")}</label>
                        <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Vencimento", "Due Date", "Vencimiento")} *</label>
                        <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Nº Nota Fiscal", "Invoice No.", "Nº Factura")}</label>
                        <input value={nc.numero_nota} onChange={(e) => setNc({ ...nc, numero_nota: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Forma de Pagamento", "Payment Method", "Forma de Pago")}</label>
                        <select value={nc.forma_pagamento} onChange={(e) => setNc({ ...nc, forma_pagamento: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Centro de Custo", "Cost Center", "Centro de Costo")}</label>
                        <select value={nc.centro_custo_id} onChange={(e) => setNc({ ...nc, centro_custo_id: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                          <option value="">-- {L("Sem centro de custo", "No cost center", "Sin centro de costo")} --</option>
                          {centrosCusto.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Observações", "Notes", "Observaciones")}</label>
                      <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2}
                        className="w-full px-4 py-3 rounded-xl text-sm resize-none" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={fecharModalConta} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarConta} disabled={salvando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                        {salvando ? L("Salvando...", "Saving...", "Guardando...") : L("Salvar Conta", "Save Bill", "Guardar Cuenta")}
                      </button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL POSSÍVEL DUPLICATA (Entrega 2 — Commit 2) ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalDuplicata && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[110] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-lg">
                <CanvasBox cor={VERMELHO}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERMELHO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0" }}>
                        ⚠️ {L("Possível conta duplicada", "Possible duplicate bill", "Posible cuenta duplicada")}
                      </h3>
                    </div>
                    <button onClick={fecharModalDuplicata} style={{ color: CINZA }}><X size={20} /></button>
                  </div>

                  <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                    {duplicatas.map((d) => (
                      <div key={d.contas_pagar_id} className="p-3 rounded-xl flex items-center justify-between gap-3"
                        style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${d.score >= 90 ? VERMELHO : AMBAR}40` }}>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{d.descricao}</p>
                          <p className="text-xs" style={{ color: CINZA }}>
                            {L("Nº nota", "Invoice no.", "Nº factura")} {d.numero_nota || "—"} · {fmt(d.valor_total)} · {L("emissão", "issued", "emisión")} {d.data_emissao ? new Date(d.data_emissao + "T00:00:00").toLocaleDateString("pt-BR") : "—"} · {L("vencimento", "due", "vencimiento")} {d.data_vencimento ? new Date(d.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="px-2 py-1 rounded-lg text-xs font-black" style={{ background: `${d.score >= 90 ? VERMELHO : AMBAR}20`, color: d.score >= 90 ? VERMELHO : AMBAR }}>
                            {d.score}%
                          </span>
                          {podeEditar && (
                            <button onClick={() => vincularAExistente(d)} className="text-[10px] font-semibold underline" style={{ color: AZUL }}>
                              {L("Vincular a esta", "Link to this one", "Vincular a esta")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {duplicataBloqueada ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold" style={{ color: VERMELHO }}>
                        {L("Semelhança muito alta — salvar foi bloqueado por padrão. Só dono/admin pode forçar, confirmando a senha.", "Very high similarity — saving was blocked by default. Only owner/admin can force it, confirming their password.", "Similitud muy alta — guardar fue bloqueado por defecto. Solo dueño/admin puede forzar, confirmando su contraseña.")}
                      </p>
                      {(papel === "dono" || papel === "admin") ? (
                        !mostrarForcar ? (
                          <div className="flex gap-3">
                            <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                            <button onClick={() => setMostrarForcar(true)} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #7f1d1d, #f87171)", color: "#fff" }}>
                              {L("Forçar (senha do dono)", "Force (owner password)", "Forzar (contraseña del dueño)")}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <input type="password" value={senhaForcar} onChange={(e) => setSenhaForcar(e.target.value)}
                              placeholder={L("Sua senha", "Your password", "Su contraseña")}
                              className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(248,113,113,0.3)", color: "#c8d8f0" }} />
                            {erroForcar && <p className="text-xs" style={{ color: VERMELHO }}>{erroForcar}</p>}
                            <div className="flex gap-3">
                              <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                              <button onClick={confirmarForcarSenha} disabled={forcando || !senhaForcar} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #7f1d1d, #f87171)", color: "#fff" }}>
                                {forcando ? L("Confirmando...", "Confirming...", "Confirmando...") : L("Confirmar e Salvar", "Confirm and Save", "Confirmar y Guardar")}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <button onClick={fecharModalDuplicata} className="w-full py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Entendi", "Got it", "Entendido")}</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={fecharModalDuplicata} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: CINZA }}>{L("Cancelar", "Cancel", "Cancelar")}</button>
                      <button onClick={salvarMesmoAssim} disabled={salvando} className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                        {L("Salvar mesmo assim", "Save anyway", "Guardar de todos modos")}
                      </button>
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL BAIXA ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalBaixa && contaBaixa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-sm">
                <CanvasBox cor={VERDE}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: VERDE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Dar Baixa", "Register Payment", "Registrar Pago")}</h3>
                    </div>
                    <button onClick={fecharBaixa} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{contaBaixa.descricao}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Valor Pago (R$)", "Amount Paid (R$)", "Valor Pagado (R$)")}</label>
                      <input type="number" value={valorBaixa} onChange={(e) => setValorBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Data do Pagamento", "Payment Date", "Fecha de Pago")}</label>
                      <input type="date" value={dataBaixa} onChange={(e) => setDataBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: AZUL }}>{L("Forma de Pagamento", "Payment Method", "Forma de Pago")}</label>
                      <select value={formaBaixa} onChange={(e) => setFormaBaixa(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        {FORMAS_PAGAMENTO.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <button onClick={confirmarBaixa} disabled={processandoBaixa} className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff" }}>
                      {processandoBaixa ? L("Confirmando...", "Confirming...", "Confirmando...") : L("Confirmar Baixa", "Confirm Payment", "Confirmar Pago")}
                    </button>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL GERAR DE CUSTO FIXO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalCustoFixo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={ROXO}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ROXO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Gerar de Custo Fixo", "Generate from Fixed Cost", "Generar de Costo Fijo")}</h3>
                    </div>
                    <button onClick={() => setModalCustoFixo(false)} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{L(`Custos fixos do mês ${mesAtual} — clique em Gerar para criar a conta a pagar correspondente.`, `Fixed costs for ${mesAtual} — click Generate to create the matching bill.`, `Costos fijos de ${mesAtual} — haga clic en Generar para crear la cuenta correspondiente.`)}</p>
                  {custosFixos.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: CINZA }}>{L("Nenhum custo fixo cadastrado.", "No fixed costs registered.", "Ningún costo fijo registrado.")}</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {custosFixos.map((cf) => (
                        <div key={cf.id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(167,139,250,0.15)" }}>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{cf.descricao}</p>
                            <p className="text-xs" style={{ color: CINZA }}>{fmt(cf.valor_mensal)} · {L("dia", "day", "día")} {cf.dia_vencimento}</p>
                          </div>
                          <button onClick={() => gerarDeCustoFixo(cf)} disabled={gerando === cf.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 disabled:opacity-60"
                            style={{ background: "rgba(167,139,250,0.15)", color: ROXO, border: "1px solid rgba(167,139,250,0.3)" }}>
                            {gerando === cf.id ? "..." : L("Gerar", "Generate", "Generar")}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      {/* ====== MODAL ANEXO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalAnexo && contaAnexo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md">
                <CanvasBox cor={AZUL}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: AZUL }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{L("Anexos", "Attachments", "Adjuntos")}</h3>
                    </div>
                    <button onClick={fecharAnexo} style={{ color: CINZA }}><X size={20} /></button>
                  </div>
                  <p className="text-xs mb-3" style={{ color: CINZA }}>{contaAnexo.descricao}</p>

                  {podeEditar && (
                    <div className="flex gap-2 mb-4">
                      <select value={tipoNovoDoc} onChange={(e) => setTipoNovoDoc(e.target.value)}
                        className="px-3 py-2 rounded-lg text-xs flex-shrink-0" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(106,176,255,0.15)", color: "#c8d8f0" }}>
                        {TIPOS_DOC.map((td) => <option key={td.key} value={td.key}>{(td.label as any)[idioma] || td.label.pt}</option>)}
                      </select>
                      <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                        style={{ background: "rgba(52,211,153,0.15)", color: VERDE, border: "1px solid rgba(52,211,153,0.3)" }}>
                        <Upload size={14} />{enviandoDoc ? L("Enviando...", "Uploading...", "Enviando...") : L("Enviar arquivo", "Upload file", "Enviar archivo")}
                        <input type="file" accept=".pdf,image/*" className="hidden" disabled={enviandoDoc}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarAnexo(f); e.target.value = ""; }} />
                      </label>
                    </div>
                  )}

                  {documentos.length === 0 ? (
                    <p className="text-sm text-center py-6" style={{ color: CINZA }}>{L("Nenhum documento anexado.", "No documents attached.", "Ningún documento adjunto.")}</p>
                  ) : (
                    <div className="space-y-2">
                      {documentos.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(106,176,255,0.15)" }}>
                          <button onClick={() => abrirDocumento(doc)} className="flex items-center gap-2 min-w-0 flex-1 text-left">
                            <FileText size={16} style={{ color: AZUL }} />
                            <span className="text-sm truncate" style={{ color: "#c8d8f0" }}>{doc.nome}</span>
                          </button>
                          {podeEditar && (
                            <button onClick={() => removerDocumento(doc)} style={{ color: VERMELHO }}><Trash2 size={14} /></button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body
      )}

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={idioma}
        textoResumo={textoResumo}
        textoDetalhado={textoDetalhado}
        assunto={`${L("Contas a Pagar", "Accounts Payable", "Cuentas por Pagar")} — Axioma`}
        cor={AZUL}
      />
    </ModuloLayout>
  );
}
