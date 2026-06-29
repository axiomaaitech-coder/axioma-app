"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  consultarCNPJ, consultarCEP, validarCNPJ, limparCNPJ, formatarCNPJ, formatarCEP, formatarTelefone,
  carregarEmpresa, criarEmpresa, atualizarEmpresa,
  carregarSocios, criarSocio, atualizarSocio, excluirSocio, importarSociosDoQSA,
  carregarDocumentos, uploadDocumento, criarDocumento, gerarUrlDocumento, excluirDocumento,
  uploadLogo,
  carregarAuditoria,
  carregarObrigacoes, criarObrigacao, atualizarObrigacao, excluirObrigacao, gerarObrigacoesPadrao,
  carregarEquipe, convidarMembro, excluirMembro,
  calcularHealthScore, calcularComplianceScore,
  TIPOS_DOCUMENTOS, REGIMES_TRIBUTARIOS,
  type ScoreResultado,
} from "../../../lib/empresaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PORTES = ["MEI", "ME", "EPP", "Demais"];
const QUALIFICACOES_SOCIOS = ["Sócio", "Sócio Administrador", "Administrador", "Diretor", "Procurador", "Outros"];

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);
}

function formatData(iso: string): string {
  if (!iso) return "—";
  try { return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR"); } catch { return iso; }
}

function formatDataHora(iso: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }); } catch { return iso; }
}

export default function EmpresaPage() {
  const { t, idioma } = useLanguage();
  const inputLogoRef = useRef<HTMLInputElement>(null);
  const inputDocRef = useRef<HTMLInputElement>(null);

  // Estados principais
  const [userId, setUserId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [empresaForm, setEmpresaForm] = useState<any>({});
  const [socios, setSocios] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [equipe, setEquipe] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Scores
  const [healthScore, setHealthScore] = useState<ScoreResultado>({ score: 0, nivel: "—", cor: "#5a7a9a", itens: [] });
  const [complianceScore, setComplianceScore] = useState<ScoreResultado>({ score: 0, nivel: "—", cor: "#5a7a9a", itens: [] });

  // Aba ativa
  const [aba, setAba] = useState<"dados" | "socios" | "compliance" | "cofre" | "auditoria">("dados");

  // CNPJ auto-preenchimento
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [resultadoCNPJ, setResultadoCNPJ] = useState<any>(null);

  // CEP auto-preenchimento
  const [consultandoCEP, setConsultandoCEP] = useState(false);

  // Modais
  const [modalSocio, setModalSocio] = useState<any>(null); // null | "novo" | objeto sócio
  const [modalDocumento, setModalDocumento] = useState<any>(null);
  const [modalObrigacao, setModalObrigacao] = useState<any>(null);
  const [modalMembro, setModalMembro] = useState<any>(null);
  const [modalScoreDetalhe, setModalScoreDetalhe] = useState<"health" | "compliance" | null>(null);
  const [shareModalAberto, setShareModalAberto] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => { inicializar(); }, []);

  async function inicializar() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setUserId(user.id);
    await carregarTudo(user.id);
  }

  async function carregarTudo(uid: string) {
    setCarregando(true);
    try {
      let emp = await carregarEmpresa(uid);

      // Se não existe, cria uma empresa vazia automaticamente
      if (!emp) {
        const r = await criarEmpresa(uid, { nome: "Minha Empresa" });
        if (r.id) emp = await carregarEmpresa(uid);
      }

      if (emp) {
        setEmpresa(emp);
        setEmpresaForm(emp);
        const [s, d, o, e, a] = await Promise.all([
          carregarSocios(emp.id, uid),
          carregarDocumentos(emp.id, uid),
          carregarObrigacoes(emp.id, uid),
          carregarEquipe(emp.id, uid),
          carregarAuditoria(emp.id, uid, 100),
        ]);
        setSocios(s); setDocumentos(d); setObrigacoes(o); setEquipe(e); setAuditoria(a);
        setHealthScore(calcularHealthScore(emp, s, d));
        setComplianceScore(calcularComplianceScore(emp, o, d));
      }
    } catch (err: any) {
      showToast(err.message || "Erro ao carregar", "erro");
    }
    setCarregando(false);
  }

  // =========================================================================
  // CNPJ AUTO-PREENCHIMENTO
  // =========================================================================
  async function preencherPorCNPJ() {
    const cnpj = limparCNPJ(empresaForm.cnpj || "");
    if (!cnpj) { showToast("Digite o CNPJ primeiro", "erro"); return; }
    if (!validarCNPJ(cnpj)) { showToast("CNPJ inválido", "erro"); return; }

    setConsultandoCNPJ(true);
    const r = await consultarCNPJ(cnpj);
    setConsultandoCNPJ(false);

    if ("erro" in r) { showToast(r.erro, "erro"); return; }
    setResultadoCNPJ(r);
  }

  function aplicarDadosCNPJ() {
    if (!resultadoCNPJ) return;
    const d = resultadoCNPJ;
    const regime = d.opcao_mei ? "mei" : d.opcao_simples ? "simples" : empresaForm.regime_tributario;
    setEmpresaForm((prev: any) => ({
      ...prev,
      razao_social: d.razao_social || prev.razao_social,
      nome_fantasia: d.nome_fantasia || prev.nome_fantasia,
      cnpj: d.cnpj || prev.cnpj,
      cnae_principal: d.cnae_principal || prev.cnae_principal,
      cnae_descricao: d.cnae_descricao || prev.cnae_descricao,
      cnaes_secundarios: d.cnaes_secundarios || prev.cnaes_secundarios,
      natureza_juridica: d.natureza_juridica || prev.natureza_juridica,
      porte: d.porte || prev.porte,
      data_abertura: d.data_abertura || prev.data_abertura,
      capital_social: d.capital_social ?? prev.capital_social,
      situacao_cadastral: d.situacao_cadastral || prev.situacao_cadastral,
      opcao_simples: d.opcao_simples ?? prev.opcao_simples,
      opcao_mei: d.opcao_mei ?? prev.opcao_mei,
      regime_tributario: regime,
      cep: d.cep || prev.cep,
      logradouro: d.logradouro || prev.logradouro,
      numero: d.numero || prev.numero,
      complemento: d.complemento || prev.complemento,
      bairro: d.bairro || prev.bairro,
      cidade: d.cidade || prev.cidade,
      uf: d.uf || prev.uf,
      telefone_principal: d.telefone_principal || prev.telefone_principal,
      email_principal: d.email_principal || prev.email_principal,
      nome: prev.nome || d.nome_fantasia || d.razao_social,
    }));
    showToast("Dados aplicados! Clique em Salvar.", "ok");

    // Pergunta se quer importar sócios
    if (d.socios && d.socios.length > 0 && empresa) {
      if (window.confirm(`Encontramos ${d.socios.length} sócio(s) na Receita. Importar para o sistema?`)) {
        importarSociosDoQSA(empresa.id, userId!, d.socios).then((qtd) => {
          showToast(`${qtd} sócio(s) importado(s)`, "ok");
          carregarTudo(userId!);
        });
      }
    }
    setResultadoCNPJ(null);
  }

  // =========================================================================
  // CEP AUTO-PREENCHIMENTO
  // =========================================================================
  async function preencherPorCEP() {
    const cep = (empresaForm.cep || "").replace(/\D/g, "");
    if (cep.length !== 8) { showToast("CEP inválido", "erro"); return; }
    setConsultandoCEP(true);
    const r = await consultarCEP(cep);
    setConsultandoCEP(false);
    if ("erro" in r) { showToast(r.erro, "erro"); return; }
    setEmpresaForm((prev: any) => ({
      ...prev,
      cep: r.cep || prev.cep,
      logradouro: r.logradouro || prev.logradouro,
      bairro: r.bairro || prev.bairro,
      cidade: r.cidade || prev.cidade,
      uf: r.uf || prev.uf,
    }));
    showToast("Endereço preenchido!", "ok");
  }

  // =========================================================================
  // SALVAR EMPRESA
  // =========================================================================
  async function salvarEmpresa() {
    if (!empresa || !userId) return;
    setSalvando(true);
    const r = await atualizarEmpresa(empresa.id, userId, empresa, empresaForm);
    if (r.erro) showToast(r.erro, "erro");
    else { showToast("Dados salvos!", "ok"); await carregarTudo(userId); }
    setSalvando(false);
  }

  // =========================================================================
  // LOGO UPLOAD
  // =========================================================================
  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const r = await uploadLogo(file, userId);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    setEmpresaForm((prev: any) => ({ ...prev, logo_url: r.url }));
    showToast("Logo atualizada (clique em Salvar)", "ok");
    if (inputLogoRef.current) inputLogoRef.current.value = "";
  }

  // =========================================================================
  // SÓCIOS CRUD
  // =========================================================================
  async function salvarSocio(dados: any) {
    if (!empresa || !userId) return;
    if (modalSocio === "novo") {
      const r = await criarSocio(empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
      showToast("Sócio adicionado", "ok");
    } else {
      const r = await atualizarSocio(modalSocio.id, empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
      showToast("Sócio atualizado", "ok");
    }
    setModalSocio(null);
    await carregarTudo(userId);
  }

  async function removerSocio(socio: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(`Remover sócio "${socio.nome}"?`)) return;
    const r = await excluirSocio(socio.id, empresa.id, userId, socio.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast("Sócio removido", "ok");
    await carregarTudo(userId);
  }

  // =========================================================================
  // DOCUMENTOS CRUD
  // =========================================================================
  async function salvarDocumento(dados: any, arquivo: File | null) {
    if (!empresa || !userId) return;
    let storagePath: string | null = null;
    if (arquivo) {
      const up = await uploadDocumento(arquivo, empresa.id, userId, dados.tipo || "outros");
      if (up.erro) { showToast(up.erro, "erro"); return; }
      storagePath = up.path || null;
    }
    const r = await criarDocumento(empresa.id, userId, {
      ...dados,
      storage_path: storagePath,
      mime_type: arquivo?.type,
      tamanho_bytes: arquivo?.size,
    });
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast("Documento adicionado", "ok");
    setModalDocumento(null);
    await carregarTudo(userId);
  }

  async function removerDocumento(doc: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(`Remover documento "${doc.nome}"?`)) return;
    const r = await excluirDocumento(doc.id, empresa.id, userId, doc.storage_path, doc.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast("Documento removido", "ok");
    await carregarTudo(userId);
  }

  async function baixarDocumento(doc: any) {
    if (!doc.storage_path) { showToast("Arquivo não disponível", "erro"); return; }
    const url = await gerarUrlDocumento(doc.storage_path);
    if (url) window.open(url, "_blank"); else showToast("Erro ao gerar link", "erro");
  }

  // =========================================================================
  // OBRIGAÇÕES CRUD + GERAÇÃO AUTOMÁTICA
  // =========================================================================
  async function gerarCalendarioFiscal() {
    if (!empresa || !userId) return;
    if (!empresa.regime_tributario) { showToast("Defina o regime tributário primeiro", "erro"); return; }
    const ano = new Date().getFullYear();
    const lista = gerarObrigacoesPadrao(empresa.regime_tributario, ano);
    if (lista.length === 0) { showToast("Nenhuma obrigação padrão para este regime", "erro"); return; }
    if (!window.confirm(`Gerar ${lista.length} obrigações fiscais para ${ano}?`)) return;
    let ok = 0;
    for (const obr of lista) {
      const r = await criarObrigacao(empresa.id, userId, obr);
      if (!r.erro) ok++;
    }
    showToast(`${ok} obrigações criadas`, "ok");
    await carregarTudo(userId);
  }

  async function salvarObrigacao(dados: any) {
    if (!empresa || !userId) return;
    if (modalObrigacao === "novo") {
      const r = await criarObrigacao(empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
    } else {
      const r = await atualizarObrigacao(modalObrigacao.id, empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
    }
    setModalObrigacao(null);
    showToast("Obrigação salva", "ok");
    await carregarTudo(userId);
  }

  async function marcarObrigacaoPaga(obr: any) {
    if (!empresa || !userId) return;
    const r = await atualizarObrigacao(obr.id, empresa.id, userId, { status: "paga", valor_pago: obr.valor_estimado });
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast("Marcada como paga", "ok");
    await carregarTudo(userId);
  }

  async function removerObrigacao(obr: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(`Remover "${obr.nome}"?`)) return;
    const r = await excluirObrigacao(obr.id, empresa.id, userId, obr.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    await carregarTudo(userId);
  }

  // =========================================================================
  // EQUIPE
  // =========================================================================
  async function salvarMembro(dados: any) {
    if (!empresa || !userId) return;
    const r = await convidarMembro(empresa.id, userId, dados);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast("Convite registrado", "ok");
    setModalMembro(null);
    await carregarTudo(userId);
  }

  async function removerMembro(m: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(`Remover ${m.email_convidado}?`)) return;
    const r = await excluirMembro(m.id, empresa.id, userId, m.email_convidado);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    await carregarTudo(userId);
  }

  // =========================================================================
  // PDF "CARTÃO DE APRESENTAÇÃO" DA EMPRESA
  // =========================================================================
  async function exportarPDF() {
    if (!empresa) return;
    setExportando(true);
    try {
      const linhasEmp = [
        { campo: "Razão Social", valor: empresa.razao_social || "—" },
        { campo: "Nome Fantasia", valor: empresa.nome_fantasia || "—" },
        { campo: "CNPJ", valor: empresa.cnpj || "—" },
        { campo: "Inscrição Estadual", valor: empresa.inscricao_estadual || "—" },
        { campo: "Regime Tributário", valor: empresa.regime_tributario || "—" },
        { campo: "CNAE Principal", valor: empresa.cnae_principal ? `${empresa.cnae_principal} - ${empresa.cnae_descricao || ""}` : "—" },
        { campo: "Porte", valor: empresa.porte || "—" },
        { campo: "Endereço", valor: [empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade, empresa.uf].filter(Boolean).join(", ") || "—" },
        { campo: "CEP", valor: empresa.cep || "—" },
        { campo: "Telefone", valor: empresa.telefone_principal || "—" },
        { campo: "E-mail", valor: empresa.email_principal || "—" },
        { campo: "Website", valor: empresa.website || "—" },
        { campo: "Contador", valor: empresa.contador_nome || "—" },
        { campo: "CRC Contador", valor: empresa.contador_crc || "—" },
      ];

      await gerarPdfTabela({
        titulo: `Cartão de Apresentação - ${empresa.nome_fantasia || empresa.razao_social || empresa.nome}`,
        subtitulo: new Date().toLocaleDateString("pt-BR"),
        colunas: [
          { header: "CAMPO", key: "campo", width: 50, align: "left" as const },
          { header: "VALOR", key: "valor", width: 110, align: "left" as const },
        ],
        linhas: linhasEmp,
        resumo: [
          { label: "Health Score", valor: `${healthScore.score}/100 (${healthScore.nivel})` },
          { label: "Compliance Score", valor: `${complianceScore.score}/100 (${complianceScore.nivel})` },
          { label: "Sócios cadastrados", valor: String(socios.length) },
          { label: "Documentos no cofre", valor: String(documentos.length) },
        ],
        nomeArquivo: `axioma-empresa-${(empresa.nome_fantasia || empresa.razao_social || "empresa").replace(/\W/g, "_").toLowerCase()}.pdf`,
      });
    } catch (err: any) {
      showToast(err.message || "Erro ao gerar PDF", "erro");
    }
    setExportando(false);
  }

  // =========================================================================
  // CENTRO DE COMPARTILHAMENTO - Cartão de Apresentação da Empresa
  // =========================================================================
  function montarTextoCompartilhamento(): string {
    if (!empresa) return "Axioma AI.Tech";
    const endereco = [empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade, empresa.uf].filter(Boolean).join(", ");
    return [
      `🦅 *AXIOMA AI.TECH — Cartão da Empresa*`,
      ``,
      `🏢 *${empresa.nome_fantasia || empresa.razao_social || empresa.nome}*`,
      empresa.razao_social ? `📋 ${empresa.razao_social}` : "",
      empresa.cnpj ? `📄 CNPJ: ${empresa.cnpj}` : "",
      empresa.inscricao_estadual ? `🗂️ IE: ${empresa.inscricao_estadual}` : "",
      empresa.regime_tributario ? `🏛️ Regime: ${empresa.regime_tributario}` : "",
      ``,
      endereco ? `📍 ${endereco}` : "",
      empresa.cep ? `📮 CEP: ${empresa.cep}` : "",
      empresa.telefone_principal ? `📞 ${empresa.telefone_principal}` : "",
      empresa.email_principal ? `✉️ ${empresa.email_principal}` : "",
      empresa.website ? `🌐 ${empresa.website}` : "",
      ``,
      `📊 *Health Score:* ${healthScore.score}/100 (${healthScore.nivel})`,
      `🛡️ *Compliance Score:* ${complianceScore.score}/100 (${complianceScore.nivel})`,
      ``,
      `_Gerado por axiomaai.com.br_`,
    ].filter(Boolean).join("\n");
  }

  function shareWhatsApp() {
    const texto = encodeURIComponent(montarTextoCompartilhamento());
    window.open(`https://wa.me/?text=${texto}`, "_blank");
  }
  function shareTelegram() {
    const texto = encodeURIComponent(montarTextoCompartilhamento());
    window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${texto}`, "_blank");
  }
  function shareGmail() {
    const assunto = encodeURIComponent(`Axioma - Cartão da Empresa ${empresa?.nome_fantasia || empresa?.razao_social || ""}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  function shareOutlook() {
    const assunto = encodeURIComponent(`Axioma - Cartão da Empresa ${empresa?.nome_fantasia || empresa?.razao_social || ""}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  async function shareCopiarTexto() {
    try {
      await navigator.clipboard.writeText(montarTextoCompartilhamento().replace(/\*/g, ""));
      showToast("Cartão copiado!", "ok");
    } catch {
      showToast("Erro ao copiar", "erro");
    }
  }
  async function sharePdf() {
    await exportarPDF();
  }

  // =========================================================================
  function setCampo(campo: string, valor: any) {
    setEmpresaForm((prev: any) => ({ ...prev, [campo]: valor }));
  }

  const inputStyle = {
    background: "rgba(2,8,16,0.7)",
    border: "1px solid rgba(106,176,255,0.2)",
    color: "#c8d8f0",
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <ModuloLayout
      titulo="🏢 Empresa"
      subtitulo="Cadastro profissional, compliance e cofre de documentos"
      onExportarPDF={exportarPDF}
      exportando={exportando}
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg max-w-sm"
          style={{
            background: toast.tipo === "erro" ? "rgba(248,113,113,0.95)" : toast.tipo === "ok" ? "rgba(52,211,153,0.95)" : "rgba(106,176,255,0.95)",
            color: "#020810", fontWeight: 600, fontSize: 13,
          }}>{toast.msg}</div>
      )}

      {carregando && (
        <CanvasBox cor="#6ab0ff">
          <div className="py-12 text-center">
            <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm" style={{ color: "#6ab0ff" }}>Carregando empresa...</p>
          </div>
        </CanvasBox>
      )}

      {!carregando && empresa && (
        <div className="space-y-4">
          {/* HEADER: 2 SCORES + INFO RÁPIDA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Card empresa rápido */}
            <CanvasBox cor="#6ab0ff">
              <div className="flex items-center gap-3">
                {empresa.logo_url ? (
                  <img src={empresa.logo_url} alt="logo" className="w-16 h-16 rounded-xl object-contain" style={{ background: "rgba(2,8,16,0.5)" }} />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {(empresa.razao_social || empresa.nome || "?")[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Empresa</p>
                  <p className="text-sm font-bold truncate" style={{ color: "#c8d8f0" }}>{empresa.nome_fantasia || empresa.razao_social || empresa.nome}</p>
                  <p className="text-xs" style={{ color: "#6ab0ff" }}>{empresa.cnpj || "Sem CNPJ"}</p>
                </div>
              </div>
            </CanvasBox>

            {/* Health Score */}
            <CanvasBox cor={healthScore.cor}>
              <button onClick={() => setModalScoreDetalhe("health")} className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>📊 Health Score (Completude)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: healthScore.cor }}>{healthScore.score}</span>
                  <span style={{ color: "#5a7a9a" }}>/100</span>
                  <span className="text-xs font-bold" style={{ color: healthScore.cor }}>{healthScore.nivel}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>Clique pra detalhes</p>
              </button>
            </CanvasBox>

            {/* Compliance Score */}
            <CanvasBox cor={complianceScore.cor}>
              <button onClick={() => setModalScoreDetalhe("compliance")} className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🛡️ Compliance Score (Fiscal)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: complianceScore.cor }}>{complianceScore.score}</span>
                  <span style={{ color: "#5a7a9a" }}>/100</span>
                  <span className="text-xs font-bold" style={{ color: complianceScore.cor }}>{complianceScore.nivel}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>Clique pra detalhes</p>
              </button>
            </CanvasBox>
          </div>

          {/* BOTÃO COMPARTILHAR */}
          <button onClick={() => setShareModalAberto(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold sm:self-end"
            style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
            📤 Compartilhar Cartão da Empresa
          </button>

          {/* ABAS */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "dados", label: "🏢 Dados Cadastrais" },
              { key: "socios", label: `👥 Sócios & Equipe (${socios.length + equipe.length})` },
              { key: "compliance", label: `📋 Compliance & Fiscal (${obrigacoes.length})` },
              { key: "cofre", label: `📄 Cofre (${documentos.length})` },
              { key: "auditoria", label: "🔐 Auditoria" },
            ].map((a) => (
              <button key={a.key} onClick={() => setAba(a.key as any)}
                className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: aba === a.key ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.6)",
                  color: aba === a.key ? "#fff" : "#6ab0ff",
                  border: aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)",
                }}>
                {a.label}
              </button>
            ))}
          </div>

          {/* ============= ABA: DADOS CADASTRAIS ============= */}
          {aba === "dados" && (
            <div className="space-y-4">
              {/* CNPJ + Botão Mágico */}
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>🪄 Auto-preenchimento por CNPJ (Receita Federal)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={empresaForm.cnpj || ""} onChange={(e) => setCampo("cnpj", formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00" className="flex-1 px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
                  <button onClick={preencherPorCNPJ} disabled={consultandoCNPJ}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
                    {consultandoCNPJ ? "⏳ Consultando..." : "🪄 Preencher por CNPJ"}
                  </button>
                </div>
                <p className="text-[10px] mt-2" style={{ color: "#5a7a9a" }}>
                  ℹ️ Usa a API gratuita da BrasilAPI. Preenche razão social, endereço, CNAE, regime tributário e sócios automaticamente.
                </p>
              </CanvasBox>

              {/* Logo + Dados básicos */}
              <CanvasBox cor="#6ab0ff">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-1">
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>Logo</p>
                    {empresaForm.logo_url ? (
                      <img src={empresaForm.logo_url} alt="logo" className="w-24 h-24 rounded-xl object-contain" style={{ background: "rgba(2,8,16,0.5)" }} />
                    ) : (
                      <div className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-black" style={{ background: "rgba(2,8,16,0.5)", border: "1px dashed rgba(106,176,255,0.3)" }}>
                        <span style={{ color: "#5a7a9a" }}>?</span>
                      </div>
                    )}
                    <button onClick={() => inputLogoRef.current?.click()}
                      className="mt-2 text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                      📤 Upload Logo
                    </button>
                    <input ref={inputLogoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                  </div>
                  <div className="md:col-span-3 space-y-3">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Razão Social</label>
                      <input value={empresaForm.razao_social || ""} onChange={(e) => setCampo("razao_social", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Nome Fantasia</label>
                        <input value={empresaForm.nome_fantasia || ""} onChange={(e) => setCampo("nome_fantasia", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Inscrição Estadual</label>
                        <input value={empresaForm.inscricao_estadual || ""} onChange={(e) => setCampo("inscricao_estadual", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Inscrição Municipal</label>
                        <input value={empresaForm.inscricao_municipal || ""} onChange={(e) => setCampo("inscricao_municipal", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Porte</label>
                        <select value={empresaForm.porte || ""} onChange={(e) => setCampo("porte", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                          <option value="" style={{ background: "#020810" }}>—</option>
                          {PORTES.map((p) => <option key={p} value={p} style={{ background: "#020810" }}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CanvasBox>

              {/* Tributário */}
              <CanvasBox cor="#34d399">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>🏛️ Tributário</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Regime Tributário</label>
                    <select value={empresaForm.regime_tributario || ""} onChange={(e) => setCampo("regime_tributario", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                      <option value="" style={{ background: "#020810" }}>—</option>
                      {REGIMES_TRIBUTARIOS.map((r) => <option key={r.key} value={r.key} style={{ background: "#020810" }}>{r.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>CNAE Principal</label>
                    <input value={empresaForm.cnae_principal || ""} onChange={(e) => setCampo("cnae_principal", e.target.value)}
                      placeholder="6201-5/01" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Descrição CNAE</label>
                    <input value={empresaForm.cnae_descricao || ""} onChange={(e) => setCampo("cnae_descricao", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Natureza Jurídica</label>
                    <input value={empresaForm.natureza_juridica || ""} onChange={(e) => setCampo("natureza_juridica", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Capital Social (R$)</label>
                    <input type="number" step="0.01" value={empresaForm.capital_social || ""} onChange={(e) => setCampo("capital_social", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Data de Abertura</label>
                    <input type="date" value={empresaForm.data_abertura || ""} onChange={(e) => setCampo("data_abertura", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Situação Cadastral</label>
                    <select value={empresaForm.situacao_cadastral || ""} onChange={(e) => setCampo("situacao_cadastral", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                      <option value="" style={{ background: "#020810" }}>—</option>
                      <option value="ativa" style={{ background: "#020810" }}>Ativa</option>
                      <option value="suspensa" style={{ background: "#020810" }}>Suspensa</option>
                      <option value="inapta" style={{ background: "#020810" }}>Inapta</option>
                      <option value="baixada" style={{ background: "#020810" }}>Baixada</option>
                    </select>
                  </div>
                </div>
              </CanvasBox>

              {/* Endereço + CEP */}
              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>📍 Endereço</p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2 flex gap-2">
                    <input value={empresaForm.cep || ""} onChange={(e) => setCampo("cep", formatarCEP(e.target.value))}
                      placeholder="00000-000" className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    <button onClick={preencherPorCEP} disabled={consultandoCEP}
                      className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>
                      {consultandoCEP ? "..." : "🔍"}
                    </button>
                  </div>
                  <div className="md:col-span-3">
                    <input value={empresaForm.logradouro || ""} onChange={(e) => setCampo("logradouro", e.target.value)}
                      placeholder="Logradouro" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-1">
                    <input value={empresaForm.numero || ""} onChange={(e) => setCampo("numero", e.target.value)}
                      placeholder="Nº" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2">
                    <input value={empresaForm.complemento || ""} onChange={(e) => setCampo("complemento", e.target.value)}
                      placeholder="Complemento" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2">
                    <input value={empresaForm.bairro || ""} onChange={(e) => setCampo("bairro", e.target.value)}
                      placeholder="Bairro" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-2">
                    <input value={empresaForm.cidade || ""} onChange={(e) => setCampo("cidade", e.target.value)}
                      placeholder="Cidade" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-1">
                    <input value={empresaForm.uf || ""} onChange={(e) => setCampo("uf", e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="UF" maxLength={2} className="w-full px-3 py-2 rounded-lg text-sm uppercase" style={inputStyle} />
                  </div>
                </div>
              </CanvasBox>

              {/* Contato */}
              <CanvasBox cor="#6ab0ff">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>📞 Contato</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Telefone Principal</label>
                    <input value={empresaForm.telefone_principal || ""} onChange={(e) => setCampo("telefone_principal", formatarTelefone(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Telefone Secundário</label>
                    <input value={empresaForm.telefone_secundario || ""} onChange={(e) => setCampo("telefone_secundario", formatarTelefone(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>E-mail Principal</label>
                    <input type="email" value={empresaForm.email_principal || ""} onChange={(e) => setCampo("email_principal", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>E-mail Financeiro</label>
                    <input type="email" value={empresaForm.email_financeiro || ""} onChange={(e) => setCampo("email_financeiro", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>E-mail Contábil</label>
                    <input type="email" value={empresaForm.email_contabil || ""} onChange={(e) => setCampo("email_contabil", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Website</label>
                    <input value={empresaForm.website || ""} onChange={(e) => setCampo("website", e.target.value)}
                      placeholder="https://" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                </div>
              </CanvasBox>

              {/* Dados bancários */}
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>🏦 Dados Bancários Principais</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Banco</label>
                    <input value={empresaForm.banco_principal || ""} onChange={(e) => setCampo("banco_principal", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Agência</label>
                    <input value={empresaForm.agencia || ""} onChange={(e) => setCampo("agencia", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Conta</label>
                    <input value={empresaForm.conta || ""} onChange={(e) => setCampo("conta", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Chave PIX</label>
                    <input value={empresaForm.chave_pix || ""} onChange={(e) => setCampo("chave_pix", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                </div>
              </CanvasBox>

              {/* Contador */}
              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>👤 Contador</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Nome</label>
                    <input value={empresaForm.contador_nome || ""} onChange={(e) => setCampo("contador_nome", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>CRC</label>
                    <input value={empresaForm.contador_crc || ""} onChange={(e) => setCampo("contador_crc", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>Telefone</label>
                    <input value={empresaForm.contador_telefone || ""} onChange={(e) => setCampo("contador_telefone", formatarTelefone(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                  <div className="md:col-span-4">
                    <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>E-mail</label>
                    <input type="email" value={empresaForm.contador_email || ""} onChange={(e) => setCampo("contador_email", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </div>
                </div>
              </CanvasBox>

              {/* Salvar */}
              <button onClick={salvarEmpresa} disabled={salvando}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
                {salvando ? "⏳ Salvando..." : "✅ Salvar Dados da Empresa"}
              </button>
            </div>
          )}

          {/* ============= ABA: SÓCIOS & EQUIPE ============= */}
          {aba === "socios" && (
            <div className="space-y-4">
              {/* Sócios */}
              <CanvasBox cor="#6ab0ff">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>👥 Quadro Societário ({socios.length})</p>
                  <button onClick={() => setModalSocio("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    + Novo Sócio
                  </button>
                </div>
                {socios.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>Nenhum sócio cadastrado. Use o botão "Preencher por CNPJ" pra importar da Receita.</p>
                ) : (
                  <div className="space-y-2">
                    {socios.map((s: any) => (
                      <div key={s.id} className="rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap"
                        style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(106,176,255,0.15)" }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{s.nome}</p>
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>
                            {s.qualificacao || "—"} • {s.cpf_cnpj || "—"} • {s.tipo_pessoa}
                            {s.participacao_pct > 0 && <span style={{ color: "#34d399" }}> • {s.participacao_pct}%</span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setModalSocio(s)} title="Editar"
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>✏️</button>
                          <button onClick={() => removerSocio(s)} title="Remover"
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CanvasBox>

              {/* Equipe */}
              <CanvasBox cor="#a78bfa">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🧑‍💻 Equipe Interna ({equipe.length})</p>
                  <button onClick={() => setModalMembro("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
                    + Convidar Membro
                  </button>
                </div>
                {equipe.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>Nenhum membro convidado.</p>
                ) : (
                  <div className="space-y-2">
                    {equipe.map((m: any) => (
                      <div key={m.id} className="rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap"
                        style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(167,139,250,0.15)" }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{m.nome || m.email_convidado}</p>
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>
                            {m.cargo || "—"} • {m.papel} • {m.convite_aceito ? "✅ Aceito" : "⏳ Pendente"}
                          </p>
                        </div>
                        <button onClick={() => removerMembro(m)}
                          className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}
              </CanvasBox>
            </div>
          )}

          {/* ============= ABA: COMPLIANCE & FISCAL ============= */}
          {aba === "compliance" && (
            <div className="space-y-4">
              <CanvasBox cor={complianceScore.cor}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>📅 Calendário Fiscal ({obrigacoes.length})</p>
                    <p className="text-xs" style={{ color: "#c8d8f0" }}>
                      Regime: <strong style={{ color: complianceScore.cor }}>{empresa.regime_tributario || "não definido"}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={gerarCalendarioFiscal}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
                      🪄 Gerar Calendário Automático
                    </button>
                    <button onClick={() => setModalObrigacao("novo")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      + Nova Obrigação
                    </button>
                  </div>
                </div>
              </CanvasBox>

              {obrigacoes.length === 0 ? (
                <CanvasBox cor="#fbbf24">
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>
                    Nenhuma obrigação cadastrada. Defina o regime tributário e clique em "Gerar Calendário Automático".
                  </p>
                </CanvasBox>
              ) : (
                <div className="space-y-2">
                  {obrigacoes.map((o: any) => {
                    const hoje = new Date().toISOString().slice(0, 10);
                    const vencida = o.status === "pendente" && o.data_vencimento < hoje;
                    const corStatus = o.status === "paga" ? "#34d399" : vencida ? "#f87171" : o.status === "dispensada" ? "#5a7a9a" : "#fbbf24";
                    return (
                      <div key={o.id} className="rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap"
                        style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${corStatus}30` }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{o.nome}</p>
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>
                            📅 {formatData(o.data_vencimento)} • {o.tipo}
                            {o.valor_estimado > 0 && <span style={{ color: "#fbbf24" }}> • {formatBRL(o.valor_estimado)}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `${corStatus}20`, color: corStatus }}>
                            {vencida ? "VENCIDA" : o.status.toUpperCase()}
                          </span>
                          {o.status !== "paga" && (
                            <button onClick={() => marcarObrigacaoPaga(o)} title="Marcar paga"
                              className="px-2 py-1 rounded text-xs" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>✓</button>
                          )}
                          <button onClick={() => setModalObrigacao(o)} title="Editar"
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>✏️</button>
                          <button onClick={() => removerObrigacao(o)} title="Remover"
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============= ABA: COFRE DE DOCUMENTOS ============= */}
          {aba === "cofre" && (
            <div className="space-y-4">
              <CanvasBox cor="#fbbf24">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🗄️ Cofre Digital ({documentos.length})</p>
                    <p className="text-xs" style={{ color: "#c8d8f0" }}>PDF, imagens, planilhas. Até 50MB por arquivo. Criptografado.</p>
                  </div>
                  <button onClick={() => setModalDocumento("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>
                    📤 Novo Documento
                  </button>
                </div>
              </CanvasBox>

              {documentos.length === 0 ? (
                <CanvasBox cor="#6ab0ff">
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>
                    Nenhum documento. Adicione Contrato Social, Cartão CNPJ, Alvarás, Certidões.
                  </p>
                </CanvasBox>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documentos.map((d: any) => {
                    const tipo = TIPOS_DOCUMENTOS.find((t) => t.key === d.tipo) || TIPOS_DOCUMENTOS[16];
                    const hoje = new Date().toISOString().slice(0, 10);
                    const vencido = d.data_validade && d.data_validade < hoje;
                    return (
                      <div key={d.id} className="rounded-xl p-3" style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${vencido ? "#f87171" : "#fbbf24"}30` }}>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-2xl">{tipo.icon}</span>
                          {vencido && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.2)", color: "#f87171" }}>VENCIDO</span>}
                        </div>
                        <p className="text-sm font-bold truncate" style={{ color: "#c8d8f0" }}>{d.nome}</p>
                        <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{tipo.label}</p>
                        {d.data_validade && <p className="text-[10px] mt-1" style={{ color: vencido ? "#f87171" : "#fbbf24" }}>Válido até: {formatData(d.data_validade)}</p>}
                        <div className="flex gap-1 mt-2">
                          {d.storage_path && (
                            <button onClick={() => baixarDocumento(d)}
                              className="flex-1 px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>⬇️ Baixar</button>
                          )}
                          <button onClick={() => removerDocumento(d)}
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============= ABA: AUDITORIA ============= */}
          {aba === "auditoria" && (
            <div className="space-y-2">
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>🔐 Histórico de Alterações ({auditoria.length})</p>
                <p className="text-xs" style={{ color: "#c8d8f0" }}>Cada criação/edição/exclusão é registrada com data, hora e detalhes.</p>
              </CanvasBox>
              {auditoria.length === 0 ? (
                <CanvasBox cor="#6ab0ff">
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>Nenhuma alteração registrada ainda.</p>
                </CanvasBox>
              ) : (
                <div className="space-y-1">
                  {auditoria.map((a: any) => {
                    const icon = a.acao === "criar" ? "➕" : a.acao === "editar" ? "✏️" : "🗑️";
                    const cor = a.acao === "criar" ? "#34d399" : a.acao === "editar" ? "#6ab0ff" : "#f87171";
                    return (
                      <div key={a.id} className="rounded-lg p-3 flex items-start gap-3"
                        style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${cor}20` }}>
                        <span className="text-lg flex-shrink-0">{icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm" style={{ color: "#c8d8f0" }}>
                            {a.descricao || `${a.acao} em ${a.tabela}`}
                          </p>
                          {a.campo && <p className="text-[11px]" style={{ color: "#5a7a9a" }}>Campo: <strong>{a.campo}</strong></p>}
                          <p className="text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{formatDataHora(a.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============= MODAL: CENTRO DE COMPARTILHAMENTO ============= */}
      {shareModalAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setShareModalAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#5a7a9a" }}>📤 Centro de Compartilhamento</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#c8d8f0" }}>{empresa?.nome_fantasia || empresa?.razao_social || empresa?.nome}</p>
              </div>
              <button onClick={() => setShareModalAberto(false)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>

            {/* Mini-preview */}
            {empresa && (
              <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.6)", border: "1px solid rgba(106,176,255,0.15)" }}>
                <p style={{ color: "#c8d8f0" }}>
                  📄 <strong style={{ color: "#6ab0ff" }}>{empresa.cnpj || "Sem CNPJ"}</strong>
                </p>
                <p style={{ color: "#c8d8f0" }}>
                  📊 Health: <strong style={{ color: healthScore.cor }}>{healthScore.score}/100</strong> •
                  🛡️ Compliance: <strong style={{ color: complianceScore.cor }}>{complianceScore.score}/100</strong>
                </p>
              </div>
            )}

            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>Compartilhar via</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#25d366" }}>
                <span className="text-xl">📱</span>WhatsApp
              </button>
              <button onClick={shareTelegram}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.35)", color: "#229ed9" }}>
                <span className="text-xl">✈️</span>Telegram
              </button>
              <button onClick={shareGmail}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(234,67,53,0.12)", border: "1px solid rgba(234,67,53,0.35)", color: "#ea4335" }}>
                <span className="text-xl">📨</span>Gmail
              </button>
              <button onClick={shareOutlook}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(0,120,212,0.12)", border: "1px solid rgba(0,120,212,0.35)", color: "#0078d4" }}>
                <span className="text-xl">📩</span>Outlook
              </button>
              <button onClick={shareCopiarTexto}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <span className="text-xl">📋</span>Copiar
              </button>
              <button onClick={sharePdf} disabled={exportando}
                className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626" }}>
                <span className="text-xl">{exportando ? "⏳" : "📄"}</span>
                {exportando ? "Gerando..." : "PDF Cartão"}
              </button>
            </div>

            <button onClick={() => setShareModalAberto(false)}
              className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ============= MODAL: RESULTADO CNPJ ============= */}
      {resultadoCNPJ && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setResultadoCNPJ(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(167,139,250,0.4)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>🪄 Dados encontrados na Receita Federal</p>
              <button onClick={() => setResultadoCNPJ(null)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            <div className="rounded-lg p-3 space-y-1 mb-3" style={{ background: "rgba(2,8,16,0.6)" }}>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Razão Social:</span> <strong style={{ color: "#c8d8f0" }}>{resultadoCNPJ.razao_social}</strong></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Nome Fantasia:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.nome_fantasia || "—"}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Situação:</span> <span style={{ color: resultadoCNPJ.situacao_cadastral === "ativa" ? "#34d399" : "#fbbf24" }}>{resultadoCNPJ.situacao_cadastral}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Porte:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.porte}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>CNAE:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.cnae_principal} - {resultadoCNPJ.cnae_descricao}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Cidade/UF:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.cidade}/{resultadoCNPJ.uf}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>Sócios encontrados:</span> <strong style={{ color: "#a78bfa" }}>{resultadoCNPJ.socios?.length || 0}</strong></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResultadoCNPJ(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>Cancelar</button>
              <button onClick={aplicarDadosCNPJ}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>✓ Aplicar Dados</button>
            </div>
          </div>
        </div>
      )}

      {/* ============= MODAL: DETALHE DOS SCORES ============= */}
      {modalScoreDetalhe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
          onClick={() => setModalScoreDetalhe(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: `1px solid ${(modalScoreDetalhe === "health" ? healthScore : complianceScore).cor}40` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>
                {modalScoreDetalhe === "health" ? "📊 Health Score (Completude)" : "🛡️ Compliance Score (Fiscal)"}
              </p>
              <button onClick={() => setModalScoreDetalhe(null)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            <div className="space-y-1">
              {(modalScoreDetalhe === "health" ? healthScore : complianceScore).itens.map((it, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded"
                  style={{ background: it.ok ? "rgba(52,211,153,0.05)" : "rgba(248,113,113,0.05)" }}>
                  <span className="text-xs flex items-center gap-2">
                    {it.ok ? <span style={{ color: "#34d399" }}>✓</span> : <span style={{ color: "#f87171" }}>✗</span>}
                    <span style={{ color: "#c8d8f0" }}>{it.label}</span>
                  </span>
                  <span className="text-xs font-bold" style={{ color: it.ok ? "#34d399" : "#5a7a9a" }}>+{it.pontos}pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============= MODAL: SÓCIO ============= */}
      {modalSocio && (
        <ModalGenerico titulo={modalSocio === "novo" ? "Novo Sócio" : "Editar Sócio"} fechar={() => setModalSocio(null)}>
          <FormSocio inicial={modalSocio === "novo" ? {} : modalSocio} onSalvar={salvarSocio} cancelar={() => setModalSocio(null)} />
        </ModalGenerico>
      )}

      {/* ============= MODAL: DOCUMENTO ============= */}
      {modalDocumento && (
        <ModalGenerico titulo="Novo Documento" fechar={() => setModalDocumento(null)}>
          <FormDocumento onSalvar={salvarDocumento} cancelar={() => setModalDocumento(null)} />
        </ModalGenerico>
      )}

      {/* ============= MODAL: OBRIGAÇÃO ============= */}
      {modalObrigacao && (
        <ModalGenerico titulo={modalObrigacao === "novo" ? "Nova Obrigação Fiscal" : "Editar Obrigação"} fechar={() => setModalObrigacao(null)}>
          <FormObrigacao inicial={modalObrigacao === "novo" ? {} : modalObrigacao} onSalvar={salvarObrigacao} cancelar={() => setModalObrigacao(null)} />
        </ModalGenerico>
      )}

      {/* ============= MODAL: MEMBRO EQUIPE ============= */}
      {modalMembro && (
        <ModalGenerico titulo="Convidar Membro" fechar={() => setModalMembro(null)}>
          <FormMembro onSalvar={salvarMembro} cancelar={() => setModalMembro(null)} />
        </ModalGenerico>
      )}
    </ModuloLayout>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function ModalGenerico({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: any }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
      style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }}
      onClick={fechar}>
      <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
        style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)" }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{titulo}</p>
          <button onClick={fechar} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormSocio({ inicial, onSalvar, cancelar }: any) {
  const [form, setForm] = useState<any>(inicial || {});
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome completo *" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.cpf_cnpj || ""} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
        placeholder="CPF ou CNPJ" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo_pessoa || "PF"} onChange={(e) => setForm({ ...form, tipo_pessoa: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="PF" style={{ background: "#020810" }}>Pessoa Física</option>
          <option value="PJ" style={{ background: "#020810" }}>Pessoa Jurídica</option>
        </select>
        <select value={form.qualificacao || ""} onChange={(e) => setForm({ ...form, qualificacao: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="" style={{ background: "#020810" }}>Qualificação</option>
          {QUALIFICACOES_SOCIOS.map((q) => <option key={q} value={q} style={{ background: "#020810" }}>{q}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="0.01" value={form.participacao_pct || ""} onChange={(e) => setForm({ ...form, participacao_pct: parseFloat(e.target.value) || 0 })}
          placeholder="% Participação" className="px-3 py-2 rounded-lg text-sm" style={inp} />
        <input type="date" value={form.data_entrada || ""} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp} />
      </div>
      <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="E-mail" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        placeholder="Telefone" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>Cancelar</button>
        <button onClick={() => onSalvar(form)} disabled={!form.nome}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>✓ Salvar</button>
      </div>
    </div>
  );
}

function FormDocumento({ onSalvar, cancelar }: any) {
  const [form, setForm] = useState<any>({ tipo: "outros" });
  const [file, setFile] = useState<File | null>(null);
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm" style={inp}>
        {TIPOS_DOCUMENTOS.map((t) => <option key={t.key} value={t.key} style={{ background: "#020810" }}>{t.icon} {t.label}</option>)}
      </select>
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome do documento *" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.numero_documento || ""} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
        placeholder="Número/Protocolo" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>Emissão</label>
          <input type="date" value={form.data_emissao || ""} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>Validade</label>
          <input type="date" value={form.data_validade || ""} onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
      </div>
      <input value={form.orgao_emissor || ""} onChange={(e) => setForm({ ...form, orgao_emissor: e.target.value })}
        placeholder="Órgão emissor" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>Cancelar</button>
        <button onClick={() => onSalvar(form, file)} disabled={!form.nome}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>✓ Salvar</button>
      </div>
    </div>
  );
}

function FormObrigacao({ inicial, onSalvar, cancelar }: any) {
  const [form, setForm] = useState<any>(inicial || { status: "pendente", recorrencia: "mensal" });
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input value={form.tipo || ""} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        placeholder="Tipo (DAS, DCTF, ECF, ICMS, etc) *" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome *" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        placeholder="Descrição" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>Vencimento *</label>
          <input type="date" value={form.data_vencimento || ""} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>Valor estimado (R$)</label>
          <input type="number" step="0.01" value={form.valor_estimado || ""} onChange={(e) => setForm({ ...form, valor_estimado: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.status || "pendente"} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="pendente" style={{ background: "#020810" }}>Pendente</option>
          <option value="paga" style={{ background: "#020810" }}>Paga</option>
          <option value="atrasada" style={{ background: "#020810" }}>Atrasada</option>
          <option value="dispensada" style={{ background: "#020810" }}>Dispensada</option>
        </select>
        <select value={form.recorrencia || "mensal"} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="mensal" style={{ background: "#020810" }}>Mensal</option>
          <option value="trimestral" style={{ background: "#020810" }}>Trimestral</option>
          <option value="anual" style={{ background: "#020810" }}>Anual</option>
          <option value="unica" style={{ background: "#020810" }}>Única</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>Cancelar</button>
        <button onClick={() => onSalvar(form)} disabled={!form.tipo || !form.nome || !form.data_vencimento}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>✓ Salvar</button>
      </div>
    </div>
  );
}

function FormMembro({ onSalvar, cancelar }: any) {
  const [form, setForm] = useState<any>({ papel: "leitor" });
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input type="email" value={form.email_convidado || ""} onChange={(e) => setForm({ ...form, email_convidado: e.target.value })}
        placeholder="E-mail do convidado *" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder="Nome" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.cargo || ""} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
        placeholder="Cargo" className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm" style={inp}>
        <option value="admin" style={{ background: "#020810" }}>👑 Admin (acesso total)</option>
        <option value="financeiro" style={{ background: "#020810" }}>💰 Financeiro</option>
        <option value="contabil" style={{ background: "#020810" }}>📊 Contábil</option>
        <option value="leitor" style={{ background: "#020810" }}>👁️ Leitor (somente visualização)</option>
      </select>
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>Cancelar</button>
        <button onClick={() => onSalvar(form)} disabled={!form.email_convidado}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>✓ Convidar</button>
      </div>
    </div>
  );
}