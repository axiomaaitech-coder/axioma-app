"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  consultarCNPJ, consultarCEP, validarCNPJ, limparCNPJ, formatarCNPJ, formatarCEP, formatarTelefone,
  atualizarEmpresa,
  obterEmpresaAtiva, carregarEmpresaPorId,
  carregarSocios, criarSocio, atualizarSocio, excluirSocio, importarSociosDoQSA,
  carregarDocumentos, uploadDocumento, criarDocumento, gerarUrlDocumento, excluirDocumento,
  uploadLogo,
  carregarAuditoria,
  carregarObrigacoes, criarObrigacao, atualizarObrigacao, excluirObrigacao, gerarObrigacoesPadrao,
  calcularHealthScore, calcularComplianceScore,
  listarBancos, type Banco,
  detectarTipoChavePix, formatarChavePix,
  formatarMoedaBR, moedaBRParaNumero,
  sugerirRegimePorPorte,
  TIPOS_DOCUMENTOS, REGIMES_TRIBUTARIOS,
  type ScoreResultado,
} from "../../../lib/empresaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// I18N COMPLETO PT/EN/ES
// ============================================================================
const T = {
  pt: {
    // Header
    titulo: "🏢 Empresa",
    subtitulo: "Cadastro profissional, compliance e cofre de documentos",
    empresaNaoEncontrada: "Não encontramos sua empresa agora",
    empresaNaoEncontradaSub: "Isso pode ser só uma instabilidade — recarregue a página. Se continuar, fale com a gente.",
    recarregarPagina: "Recarregar página",
    empresa: "Empresa",
    semCnpj: "Sem CNPJ",
    healthScore: "📊 Health Score (Completude)",
    complianceScore: "🛡️ Compliance Score (Fiscal)",
    cliquePraDetalhes: "Clique para detalhes",
    compartilharCartao: "📤 Compartilhar Cartão da Empresa",
    carregandoEmpresa: "Carregando empresa...",
    // Abas
    abaDados: "🏢 Dados Cadastrais",
    abaSocios: "👥 Sócios & Equipe",
    abaCompliance: "📋 Compliance & Fiscal",
    abaCofre: "📄 Cofre",
    abaAuditoria: "🔐 Auditoria",
    // CNPJ
    autoCnpjTitulo: "🪄 Auto-preenchimento por CNPJ (Receita Federal)",
    autoCnpjInfo: "ℹ️ Usa a API gratuita da BrasilAPI. Preenche razão social, endereço, CNAE, regime tributário e sócios automaticamente.",
    consultando: "⏳ Consultando...",
    sugeridoBadge: "Sugestão automática — edite se quiser",
    buscarBanco: "Buscar banco...",
    selecioneBanco: "Selecione o banco",
    nenhumBancoEncontrado: "Nenhum banco encontrado",
    pixTipoDetectado: "Tipo detectado",
    pixTipo_cpf: "CPF", pixTipo_cnpj: "CNPJ", pixTipo_email: "E-mail", pixTipo_telefone: "Telefone", pixTipo_aleatoria: "Chave aleatória",
    preencherCnpj: "🪄 Preencher por CNPJ",
    // Dados básicos
    logo: "Logo",
    uploadLogo: "📤 Upload Logo",
    razaoSocial: "Razão Social",
    nomeFantasia: "Nome Fantasia",
    inscricaoEstadual: "Inscrição Estadual",
    inscricaoMunicipal: "Inscrição Municipal",
    porte: "Porte",
    // Tributário
    tributario: "🏛️ Tributário",
    regimeTributario: "Regime Tributário",
    cnaePrincipal: "CNAE Principal",
    cnaeDescricao: "Descrição CNAE",
    naturezaJuridica: "Natureza Jurídica",
    capitalSocial: "Capital Social (R$)",
    dataAbertura: "Data de Abertura",
    situacaoCadastral: "Situação Cadastral",
    situacaoAtiva: "Ativa",
    situacaoSuspensa: "Suspensa",
    situacaoInapta: "Inapta",
    situacaoBaixada: "Baixada",
    // Endereço
    endereco: "📍 Endereço",
    logradouro: "Logradouro",
    numero: "Nº",
    complemento: "Complemento",
    bairro: "Bairro",
    cidade: "Cidade",
    uf: "UF",
    // Contato
    contato: "📞 Contato",
    telefonePrincipal: "Telefone Principal",
    telefoneSecundario: "Telefone Secundário",
    emailPrincipal: "E-mail Principal",
    emailFinanceiro: "E-mail Financeiro",
    emailContabil: "E-mail Contábil",
    website: "Website",
    // Banco
    bancario: "🏦 Dados Bancários Principais",
    banco: "Banco",
    agencia: "Agência",
    conta: "Conta",
    chavePix: "Chave PIX",
    // Contador
    contador: "👤 Contador",
    nome: "Nome",
    crc: "CRC",
    telefone: "Telefone",
    email: "E-mail",
    // Botões
    salvarEmpresa: "✅ Salvar Dados da Empresa",
    limparCampos: "Limpar campos",
    limparCamposModalTitulo: "Limpar campos do cadastro?",
    limparCamposModalTexto: "Isso vai esvaziar todos os campos de Dados Cadastrais na tela: razão social, fantasia, IE/IM, porte, dados tributários, endereço, contato, dados bancários e contador.",
    limparCamposModalNaoAfeta: "Sócios, documentos do Cofre, Compliance e a trilha de Auditoria NÃO são afetados — são outras abas, outros registros.",
    limparCamposModalAviso: "Os campos só ficam vazios na tela. Nada é apagado no banco até você clicar em \"Salvar Dados da Empresa\".",
    limparCamposConfirmar: "Limpar campos",
    toastCamposLimpos: "Campos esvaziados — clique em Salvar para aplicar.",
    salvando: "⏳ Salvando...",
    salvar: "✓ Salvar",
    cancelar: "Cancelar",
    fechar: "Fechar",
    editar: "Editar",
    remover: "Remover",
    // Sócios
    quadroSocietario: "👥 Quadro Societário",
    novoSocio: "+ Novo Sócio",
    semSocios: "Nenhum sócio cadastrado. Use o botão 'Preencher por CNPJ' para importar da Receita.",
    novoSocioTitulo: "Novo Sócio",
    editarSocioTitulo: "Editar Sócio",
    nomeCompleto: "Nome completo *",
    cpfCnpj: "CPF ou CNPJ",
    pessoaFisica: "Pessoa Física",
    pessoaJuridica: "Pessoa Jurídica",
    qualificacao: "Qualificação",
    participacaoPct: "% Participação",
    dataEntrada: "Data de Entrada",
    // Compliance
    calendarioFiscal: "📅 Calendário Fiscal",
    regime: "Regime",
    naoDefinido: "não definido",
    gerarCalendario: "🪄 Gerar Calendário Automático",
    novaObrigacao: "+ Nova Obrigação",
    semObrigacoes: "Nenhuma obrigação cadastrada. Defina o regime tributário e clique em 'Gerar Calendário Automático'.",
    novaObrigacaoTitulo: "Nova Obrigação Fiscal",
    editarObrigacaoTitulo: "Editar Obrigação",
    tipoObrigacao: "Tipo (DAS, DCTF, ECF, ICMS, etc) *",
    nomeObrigacao: "Nome *",
    descricao: "Descrição",
    vencimento: "Vencimento *",
    valorEstimado: "Valor estimado (R$)",
    statusPendente: "Pendente",
    statusPaga: "Paga",
    statusAtrasada: "Atrasada",
    statusDispensada: "Dispensada",
    statusVencida: "VENCIDA",
    recorrenciaMensal: "Mensal",
    recorrenciaTrimestral: "Trimestral",
    recorrenciaAnual: "Anual",
    recorrenciaUnica: "Única",
    marcarPaga: "Marcar paga",
    // Cofre
    cofreDigital: "🗄️ Cofre Digital",
    cofreInfo: "PDF, imagens, planilhas. Até 50MB por arquivo. Criptografado.",
    novoDocumento: "📤 Novo Documento",
    semDocumentos: "Nenhum documento. Adicione Contrato Social, Cartão CNPJ, Alvarás, Certidões.",
    documentoVencido: "VENCIDO",
    validoAte: "Válido até",
    baixar: "⬇️ Baixar",
    novoDocumentoTitulo: "Novo Documento",
    nomeDocumento: "Nome do documento *",
    numeroDocumento: "Número/Protocolo",
    emissao: "Emissão",
    validade: "Validade",
    orgaoEmissor: "Órgão emissor",
    // Auditoria
    historico: "🔐 Histórico de Alterações",
    auditoriaInfo: "Cada criação/edição/exclusão é registrada com data, hora e detalhes.",
    auditEmpresa: "Empresa",
    auditPor: "Por",
    auditDe: "De",
    auditPara: "Para",
    auditValorRedigido: "Alteração registrada — conteúdo não exibido (dado pessoal de terceiro)",
    semAuditoria: "Nenhuma alteração registrada ainda.",
    campo: "Campo",
    // CNPJ modal
    cnpjResultadoTitulo: "🪄 Dados encontrados na Receita Federal",
    cnpjRazao: "Razão Social",
    cnpjFantasia: "Nome Fantasia",
    cnpjSituacao: "Situação",
    cnpjPorte: "Porte",
    cnpjCnae: "CNAE",
    cnpjCidadeUf: "Cidade/UF",
    cnpjSociosEncontrados: "Sócios encontrados",
    cnpjAplicar: "✓ Aplicar Dados",
    // Share
    centroCompart: "📤 Centro de Compartilhamento",
    compartilharVia: "Compartilhar via",
    pdfCartao: "PDF Cartão",
    gerando: "Gerando...",
    copiar: "Copiar",
    // Toasts
    toastDigiteCnpj: "Digite o CNPJ primeiro",
    toastCnpjInvalido: "CNPJ inválido",
    toastCepInvalido: "CEP inválido",
    toastCnpjNaoEncontrado: "CNPJ não encontrado na Receita Federal",
    toastCepNaoEncontrado: "CEP não encontrado",
    toastServicoIndisponivel: "Serviço de consulta indisponível no momento. Tente novamente em instantes.",
    erroCnpjInvalido: "CNPJ inválido (dígitos verificadores não conferem)",
    erroCepInvalido: "CEP deve ter 8 dígitos",
    erroEmailInvalido: "E-mail em formato inválido",
    toastEnderecoPreenchido: "Endereço preenchido!",
    toastDadosAplicados: "Dados aplicados! Clique em Salvar.",
    toastSociosImportados: (n: number) => `${n} sócio(s) importado(s)`,
    toastSociosImportadosComIgnorados: (n: number, ign: number) => `${n} sócio(s) importado(s) — ${ign} já cadastrado(s), ignorado(s)`,
    toastConfirmImportarSocios: (n: number) => `Encontramos ${n} sócio(s) na Receita. Importar para o sistema?`,
    toastDadosSalvos: "Dados salvos!",
    toastErroCarregar: "Erro ao carregar",
    toastSemPermissaoEscrita: "Não salvou — sua conta não tem permissão de edição para esta empresa. Fale com o proprietário.",
    toastLogoAtualizada: "Logo atualizada (clique em Salvar)",
    toastSocioAdicionado: "Sócio adicionado",
    toastSocioAtualizado: "Sócio atualizado",
    toastSocioRemovido: "Sócio removido",
    toastConfirmRemoverSocio: (nome: string) => `Remover sócio "${nome}"?`,
    toastDocAdicionado: "Documento adicionado",
    toastDocRemovido: "Documento removido",
    toastConfirmRemoverDoc: (nome: string) => `Remover documento "${nome}"?`,
    toastArquivoIndisponivel: "Arquivo não disponível",
    toastErroGerarLink: "Erro ao gerar link",
    toastDefinaRegime: "Defina o regime tributário primeiro",
    toastNenhumaObrigPadrao: "Nenhuma obrigação padrão para este regime",
    toastConfirmGerarObrig: (n: number, ano: number) => `Gerar ${n} obrigações fiscais para ${ano}?`,
    toastObrigCriadas: (n: number) => `${n} obrigações criadas`,
    toastObrigSalva: "Obrigação salva",
    toastMarcadaPaga: "Marcada como paga",
    toastConfirmRemoverObrig: (nome: string) => `Remover "${nome}"?`,
    toastCartaoCopiado: "Cartão copiado!",
    toastErroCopiar: "Erro ao copiar",
    toastErroPdf: "Erro ao gerar PDF",
    // Qualificações sócios (traduzido em runtime)
    qualSocio: "Sócio",
    qualSocioAdm: "Sócio Administrador",
    qualAdministrador: "Administrador",
    qualDiretor: "Diretor",
    qualProcurador: "Procurador",
    qualOutros: "Outros",
  },
  en: {
    titulo: "🏢 Company",
    subtitulo: "Professional registration, compliance and document vault",
    empresaNaoEncontrada: "We couldn't find your company right now",
    empresaNaoEncontradaSub: "This might just be a hiccup — reload the page. If it keeps happening, reach out to us.",
    recarregarPagina: "Reload page",
    empresa: "Company",
    semCnpj: "No Tax ID",
    healthScore: "📊 Health Score (Completeness)",
    complianceScore: "🛡️ Compliance Score (Fiscal)",
    cliquePraDetalhes: "Click for details",
    compartilharCartao: "📤 Share Company Card",
    carregandoEmpresa: "Loading company...",
    abaDados: "🏢 Registration Data",
    abaSocios: "👥 Partners & Team",
    abaCompliance: "📋 Compliance & Fiscal",
    abaCofre: "📄 Vault",
    abaAuditoria: "🔐 Audit",
    autoCnpjTitulo: "🪄 Auto-fill by Tax ID (Federal Revenue)",
    autoCnpjInfo: "ℹ️ Uses free BrasilAPI. Auto-fills legal name, address, business activity, tax regime and partners.",
    consultando: "⏳ Looking up...",
    sugeridoBadge: "Auto-suggested — edit if you want",
    buscarBanco: "Search bank...",
    selecioneBanco: "Select the bank",
    nenhumBancoEncontrado: "No bank found",
    pixTipoDetectado: "Detected type",
    pixTipo_cpf: "CPF", pixTipo_cnpj: "Tax ID", pixTipo_email: "E-mail", pixTipo_telefone: "Phone", pixTipo_aleatoria: "Random key",
    preencherCnpj: "🪄 Fill by Tax ID",
    logo: "Logo",
    uploadLogo: "📤 Upload Logo",
    razaoSocial: "Legal Name",
    nomeFantasia: "Trade Name",
    inscricaoEstadual: "State Registration",
    inscricaoMunicipal: "Municipal Registration",
    porte: "Size",
    tributario: "🏛️ Tax",
    regimeTributario: "Tax Regime",
    cnaePrincipal: "Main Activity Code",
    cnaeDescricao: "Activity Description",
    naturezaJuridica: "Legal Nature",
    capitalSocial: "Share Capital (R$)",
    dataAbertura: "Founding Date",
    situacaoCadastral: "Status",
    situacaoAtiva: "Active",
    situacaoSuspensa: "Suspended",
    situacaoInapta: "Unfit",
    situacaoBaixada: "Closed",
    endereco: "📍 Address",
    logradouro: "Street",
    numero: "Nº",
    complemento: "Complement",
    bairro: "District",
    cidade: "City",
    uf: "State",
    contato: "📞 Contact",
    telefonePrincipal: "Main Phone",
    telefoneSecundario: "Secondary Phone",
    emailPrincipal: "Main E-mail",
    emailFinanceiro: "Financial E-mail",
    emailContabil: "Accounting E-mail",
    website: "Website",
    bancario: "🏦 Main Banking Data",
    banco: "Bank",
    agencia: "Branch",
    conta: "Account",
    chavePix: "PIX Key",
    contador: "👤 Accountant",
    nome: "Name",
    crc: "License #",
    telefone: "Phone",
    email: "E-mail",
    salvarEmpresa: "✅ Save Company Data",
    limparCampos: "Clear fields",
    limparCamposModalTitulo: "Clear the registration fields?",
    limparCamposModalTexto: "This will empty every field in Company Data on screen: legal name, trade name, state/municipal registration, size, tax data, address, contact, banking data and accountant.",
    limparCamposModalNaoAfeta: "Partners, Vault documents, Compliance and the Audit trail are NOT affected — those are other tabs, other records.",
    limparCamposModalAviso: "Fields are only emptied on screen. Nothing is deleted in the database until you click \"Save Company Data\".",
    limparCamposConfirmar: "Clear fields",
    toastCamposLimpos: "Fields cleared — click Save to apply.",
    salvando: "⏳ Saving...",
    salvar: "✓ Save",
    cancelar: "Cancel",
    fechar: "Close",
    editar: "Edit",
    remover: "Remove",
    quadroSocietario: "👥 Partners",
    novoSocio: "+ New Partner",
    semSocios: "No partners registered. Use 'Fill by Tax ID' to import from Federal Revenue.",
    novoSocioTitulo: "New Partner",
    editarSocioTitulo: "Edit Partner",
    nomeCompleto: "Full name *",
    cpfCnpj: "ID Document",
    pessoaFisica: "Individual",
    pessoaJuridica: "Legal Entity",
    qualificacao: "Role",
    participacaoPct: "% Ownership",
    dataEntrada: "Entry Date",
    calendarioFiscal: "📅 Fiscal Calendar",
    regime: "Regime",
    naoDefinido: "not defined",
    gerarCalendario: "🪄 Auto-generate Calendar",
    novaObrigacao: "+ New Obligation",
    semObrigacoes: "No obligations. Define the tax regime and click 'Auto-generate Calendar'.",
    novaObrigacaoTitulo: "New Fiscal Obligation",
    editarObrigacaoTitulo: "Edit Obligation",
    tipoObrigacao: "Type (DAS, DCTF, ECF, ICMS, etc) *",
    nomeObrigacao: "Name *",
    descricao: "Description",
    vencimento: "Due date *",
    valorEstimado: "Estimated value (R$)",
    statusPendente: "Pending",
    statusPaga: "Paid",
    statusAtrasada: "Overdue",
    statusDispensada: "Waived",
    statusVencida: "OVERDUE",
    recorrenciaMensal: "Monthly",
    recorrenciaTrimestral: "Quarterly",
    recorrenciaAnual: "Annual",
    recorrenciaUnica: "One-time",
    marcarPaga: "Mark as paid",
    cofreDigital: "🗄️ Digital Vault",
    cofreInfo: "PDFs, images, spreadsheets. Up to 50MB per file. Encrypted.",
    novoDocumento: "📤 New Document",
    semDocumentos: "No documents yet. Add Articles of Incorporation, Tax ID Card, Permits, Certificates.",
    documentoVencido: "EXPIRED",
    validoAte: "Valid until",
    baixar: "⬇️ Download",
    novoDocumentoTitulo: "New Document",
    nomeDocumento: "Document name *",
    numeroDocumento: "Number/Protocol",
    emissao: "Issued",
    validade: "Expires",
    orgaoEmissor: "Issuing authority",
    historico: "🔐 Change History",
    auditoriaInfo: "Every creation/edit/deletion is logged with date, time and details.",
    auditEmpresa: "Company",
    auditPor: "By",
    auditDe: "From",
    auditPara: "To",
    auditValorRedigido: "Change logged — content not shown (third party's personal data)",
    semAuditoria: "No changes recorded yet.",
    campo: "Field",
    cnpjResultadoTitulo: "🪄 Data found in Federal Revenue",
    cnpjRazao: "Legal Name",
    cnpjFantasia: "Trade Name",
    cnpjSituacao: "Status",
    cnpjPorte: "Size",
    cnpjCnae: "Activity",
    cnpjCidadeUf: "City/State",
    cnpjSociosEncontrados: "Partners found",
    cnpjAplicar: "✓ Apply Data",
    centroCompart: "📤 Sharing Center",
    compartilharVia: "Share via",
    pdfCartao: "Card PDF",
    gerando: "Generating...",
    copiar: "Copy",
    toastDigiteCnpj: "Enter the Tax ID first",
    toastCnpjInvalido: "Invalid Tax ID",
    toastCepInvalido: "Invalid ZIP",
    toastCnpjNaoEncontrado: "Tax ID not found in the Federal Revenue database",
    toastCepNaoEncontrado: "ZIP code not found",
    toastServicoIndisponivel: "Lookup service unavailable right now. Try again shortly.",
    erroCnpjInvalido: "Invalid Tax ID (check digits don't match)",
    erroCepInvalido: "ZIP code must have 8 digits",
    erroEmailInvalido: "Invalid e-mail format",
    toastEnderecoPreenchido: "Address filled!",
    toastDadosAplicados: "Data applied! Click Save.",
    toastSociosImportados: (n: number) => `${n} partner(s) imported`,
    toastSociosImportadosComIgnorados: (n: number, ign: number) => `${n} partner(s) imported — ${ign} already registered, skipped`,
    toastConfirmImportarSocios: (n: number) => `Found ${n} partner(s). Import into system?`,
    toastDadosSalvos: "Data saved!",
    toastErroCarregar: "Loading error",
    toastSemPermissaoEscrita: "Not saved — your account doesn't have edit permission for this company. Contact the owner.",
    toastLogoAtualizada: "Logo updated (click Save)",
    toastSocioAdicionado: "Partner added",
    toastSocioAtualizado: "Partner updated",
    toastSocioRemovido: "Partner removed",
    toastConfirmRemoverSocio: (nome: string) => `Remove partner "${nome}"?`,
    toastDocAdicionado: "Document added",
    toastDocRemovido: "Document removed",
    toastConfirmRemoverDoc: (nome: string) => `Remove document "${nome}"?`,
    toastArquivoIndisponivel: "File not available",
    toastErroGerarLink: "Error generating link",
    toastDefinaRegime: "Define the tax regime first",
    toastNenhumaObrigPadrao: "No standard obligations for this regime",
    toastConfirmGerarObrig: (n: number, ano: number) => `Generate ${n} fiscal obligations for ${ano}?`,
    toastObrigCriadas: (n: number) => `${n} obligations created`,
    toastObrigSalva: "Obligation saved",
    toastMarcadaPaga: "Marked as paid",
    toastConfirmRemoverObrig: (nome: string) => `Remove "${nome}"?`,
    toastCartaoCopiado: "Card copied!",
    toastErroCopiar: "Copy error",
    toastErroPdf: "PDF error",
    qualSocio: "Partner",
    qualSocioAdm: "Managing Partner",
    qualAdministrador: "Administrator",
    qualDiretor: "Director",
    qualProcurador: "Attorney-in-fact",
    qualOutros: "Others",
  },
  es: {
    titulo: "🏢 Empresa",
    subtitulo: "Registro profesional, cumplimiento y bóveda de documentos",
    empresaNaoEncontrada: "No encontramos su empresa en este momento",
    empresaNaoEncontradaSub: "Puede ser solo una inestabilidad — recargue la página. Si continúa, contáctenos.",
    recarregarPagina: "Recargar página",
    empresa: "Empresa",
    semCnpj: "Sin CNPJ",
    healthScore: "📊 Health Score (Completitud)",
    complianceScore: "🛡️ Compliance Score (Fiscal)",
    cliquePraDetalhes: "Haga clic para detalles",
    compartilharCartao: "📤 Compartir Tarjeta de la Empresa",
    carregandoEmpresa: "Cargando empresa...",
    abaDados: "🏢 Datos Registrales",
    abaSocios: "👥 Socios & Equipo",
    abaCompliance: "📋 Cumplimiento & Fiscal",
    abaCofre: "📄 Bóveda",
    abaAuditoria: "🔐 Auditoría",
    autoCnpjTitulo: "🪄 Auto-rellenar por CNPJ (Receita Federal)",
    autoCnpjInfo: "ℹ️ Usa la API gratuita de BrasilAPI. Rellena razón social, dirección, CNAE, régimen tributario y socios automáticamente.",
    consultando: "⏳ Consultando...",
    sugeridoBadge: "Sugerencia automática — edite si quiere",
    buscarBanco: "Buscar banco...",
    selecioneBanco: "Seleccione el banco",
    nenhumBancoEncontrado: "Ningún banco encontrado",
    pixTipoDetectado: "Tipo detectado",
    pixTipo_cpf: "CPF", pixTipo_cnpj: "CNPJ", pixTipo_email: "Correo", pixTipo_telefone: "Teléfono", pixTipo_aleatoria: "Clave aleatoria",
    preencherCnpj: "🪄 Rellenar por CNPJ",
    logo: "Logo",
    uploadLogo: "📤 Subir Logo",
    razaoSocial: "Razón Social",
    nomeFantasia: "Nombre Comercial",
    inscricaoEstadual: "Inscripción Estatal",
    inscricaoMunicipal: "Inscripción Municipal",
    porte: "Tamaño",
    tributario: "🏛️ Tributario",
    regimeTributario: "Régimen Tributario",
    cnaePrincipal: "CNAE Principal",
    cnaeDescricao: "Descripción CNAE",
    naturezaJuridica: "Naturaleza Jurídica",
    capitalSocial: "Capital Social (R$)",
    dataAbertura: "Fecha de Apertura",
    situacaoCadastral: "Situación",
    situacaoAtiva: "Activa",
    situacaoSuspensa: "Suspendida",
    situacaoInapta: "Inepta",
    situacaoBaixada: "Cerrada",
    endereco: "📍 Dirección",
    logradouro: "Calle",
    numero: "Nº",
    complemento: "Complemento",
    bairro: "Barrio",
    cidade: "Ciudad",
    uf: "Estado",
    contato: "📞 Contacto",
    telefonePrincipal: "Teléfono Principal",
    telefoneSecundario: "Teléfono Secundario",
    emailPrincipal: "Correo Principal",
    emailFinanceiro: "Correo Financiero",
    emailContabil: "Correo Contable",
    website: "Sitio Web",
    bancario: "🏦 Datos Bancarios Principales",
    banco: "Banco",
    agencia: "Agencia",
    conta: "Cuenta",
    chavePix: "Clave PIX",
    contador: "👤 Contador",
    nome: "Nombre",
    crc: "CRC",
    telefone: "Teléfono",
    email: "Correo",
    salvarEmpresa: "✅ Guardar Datos de la Empresa",
    limparCampos: "Limpiar campos",
    limparCamposModalTitulo: "¿Limpiar los campos del registro?",
    limparCamposModalTexto: "Esto vaciará todos los campos de Datos de la Empresa en pantalla: razón social, nombre fantasía, IE/IM, porte, datos tributarios, dirección, contacto, datos bancarios y contador.",
    limparCamposModalNaoAfeta: "Socios, documentos de la Bóveda, Cumplimiento y el registro de Auditoría NO se ven afectados — son otras pestañas, otros registros.",
    limparCamposModalAviso: "Los campos solo se vacían en pantalla. Nada se elimina en la base de datos hasta que haga clic en \"Guardar Datos de la Empresa\".",
    limparCamposConfirmar: "Limpiar campos",
    toastCamposLimpos: "Campos vaciados — haga clic en Guardar para aplicar.",
    salvando: "⏳ Guardando...",
    salvar: "✓ Guardar",
    cancelar: "Cancelar",
    fechar: "Cerrar",
    editar: "Editar",
    remover: "Eliminar",
    quadroSocietario: "👥 Cuadro Societario",
    novoSocio: "+ Nuevo Socio",
    semSocios: "No hay socios registrados. Use 'Rellenar por CNPJ' para importar desde Receita Federal.",
    novoSocioTitulo: "Nuevo Socio",
    editarSocioTitulo: "Editar Socio",
    nomeCompleto: "Nombre completo *",
    cpfCnpj: "CPF o CNPJ",
    pessoaFisica: "Persona Física",
    pessoaJuridica: "Persona Jurídica",
    qualificacao: "Calificación",
    participacaoPct: "% Participación",
    dataEntrada: "Fecha de Entrada",
    calendarioFiscal: "📅 Calendario Fiscal",
    regime: "Régimen",
    naoDefinido: "no definido",
    gerarCalendario: "🪄 Generar Calendario Automático",
    novaObrigacao: "+ Nueva Obligación",
    semObrigacoes: "No hay obligaciones. Defina el régimen tributario y haga clic en 'Generar Calendario Automático'.",
    novaObrigacaoTitulo: "Nueva Obligación Fiscal",
    editarObrigacaoTitulo: "Editar Obligación",
    tipoObrigacao: "Tipo (DAS, DCTF, ECF, ICMS, etc) *",
    nomeObrigacao: "Nombre *",
    descricao: "Descripción",
    vencimento: "Vencimiento *",
    valorEstimado: "Valor estimado (R$)",
    statusPendente: "Pendiente",
    statusPaga: "Pagada",
    statusAtrasada: "Atrasada",
    statusDispensada: "Dispensada",
    statusVencida: "VENCIDA",
    recorrenciaMensal: "Mensual",
    recorrenciaTrimestral: "Trimestral",
    recorrenciaAnual: "Anual",
    recorrenciaUnica: "Única",
    marcarPaga: "Marcar pagada",
    cofreDigital: "🗄️ Bóveda Digital",
    cofreInfo: "PDF, imágenes, hojas de cálculo. Hasta 50MB por archivo. Encriptado.",
    novoDocumento: "📤 Nuevo Documento",
    semDocumentos: "No hay documentos. Agregue Contrato Social, Tarjeta CNPJ, Permisos, Certificados.",
    documentoVencido: "VENCIDO",
    validoAte: "Válido hasta",
    baixar: "⬇️ Descargar",
    novoDocumentoTitulo: "Nuevo Documento",
    nomeDocumento: "Nombre del documento *",
    numeroDocumento: "Número/Protocolo",
    emissao: "Emisión",
    validade: "Validez",
    orgaoEmissor: "Órgano emisor",
    historico: "🔐 Historial de Cambios",
    auditoriaInfo: "Cada creación/edición/eliminación queda registrada con fecha, hora y detalles.",
    auditEmpresa: "Empresa",
    auditPor: "Por",
    auditDe: "De",
    auditPara: "Para",
    auditValorRedigido: "Cambio registrado — contenido no mostrado (dato personal de tercero)",
    semAuditoria: "Sin cambios registrados todavía.",
    campo: "Campo",
    cnpjResultadoTitulo: "🪄 Datos encontrados en Receita Federal",
    cnpjRazao: "Razón Social",
    cnpjFantasia: "Nombre Comercial",
    cnpjSituacao: "Situación",
    cnpjPorte: "Tamaño",
    cnpjCnae: "CNAE",
    cnpjCidadeUf: "Ciudad/Estado",
    cnpjSociosEncontrados: "Socios encontrados",
    cnpjAplicar: "✓ Aplicar Datos",
    centroCompart: "📤 Centro de Compartir",
    compartilharVia: "Compartir vía",
    pdfCartao: "PDF Tarjeta",
    gerando: "Generando...",
    copiar: "Copiar",
    toastDigiteCnpj: "Ingrese el CNPJ primero",
    toastCnpjInvalido: "CNPJ inválido",
    toastCepInvalido: "CEP inválido",
    toastCnpjNaoEncontrado: "CNPJ no encontrado en la Receita Federal",
    toastCepNaoEncontrado: "CEP no encontrado",
    toastServicoIndisponivel: "Servicio de consulta no disponible en este momento. Intente de nuevo en instantes.",
    erroCnpjInvalido: "CNPJ inválido (dígitos verificadores no coinciden)",
    erroCepInvalido: "El CEP debe tener 8 dígitos",
    erroEmailInvalido: "Formato de correo inválido",
    toastEnderecoPreenchido: "¡Dirección rellenada!",
    toastDadosAplicados: "¡Datos aplicados! Haga clic en Guardar.",
    toastSociosImportados: (n: number) => `${n} socio(s) importado(s)`,
    toastSociosImportadosComIgnorados: (n: number, ign: number) => `${n} socio(s) importado(s) — ${ign} ya registrado(s), omitido(s)`,
    toastConfirmImportarSocios: (n: number) => `Encontramos ${n} socio(s). ¿Importar al sistema?`,
    toastDadosSalvos: "¡Datos guardados!",
    toastErroCarregar: "Error al cargar",
    toastSemPermissaoEscrita: "No se guardó — su cuenta no tiene permiso de edición para esta empresa. Hable con el propietario.",
    toastLogoAtualizada: "Logo actualizado (haga clic en Guardar)",
    toastSocioAdicionado: "Socio agregado",
    toastSocioAtualizado: "Socio actualizado",
    toastSocioRemovido: "Socio eliminado",
    toastConfirmRemoverSocio: (nome: string) => `¿Eliminar socio "${nome}"?`,
    toastDocAdicionado: "Documento agregado",
    toastDocRemovido: "Documento eliminado",
    toastConfirmRemoverDoc: (nome: string) => `¿Eliminar documento "${nome}"?`,
    toastArquivoIndisponivel: "Archivo no disponible",
    toastErroGerarLink: "Error al generar enlace",
    toastDefinaRegime: "Defina el régimen tributario primero",
    toastNenhumaObrigPadrao: "Sin obligaciones estándar para este régimen",
    toastConfirmGerarObrig: (n: number, ano: number) => `¿Generar ${n} obligaciones fiscales para ${ano}?`,
    toastObrigCriadas: (n: number) => `${n} obligaciones creadas`,
    toastObrigSalva: "Obligación guardada",
    toastMarcadaPaga: "Marcada como pagada",
    toastConfirmRemoverObrig: (nome: string) => `¿Eliminar "${nome}"?`,
    toastCartaoCopiado: "¡Tarjeta copiada!",
    toastErroCopiar: "Error al copiar",
    toastErroPdf: "Error en PDF",
    qualSocio: "Socio",
    qualSocioAdm: "Socio Administrador",
    qualAdministrador: "Administrador",
    qualDiretor: "Director",
    qualProcurador: "Apoderado",
    qualOutros: "Otros",
  },
};

const PORTES = ["MEI", "ME", "EPP", "Demais"];

function formatBRL(n: number, idioma: string): string {
  const locale = idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR";
  return new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(n || 0);
}

function formatData(iso: string, idioma: string): string {
  if (!iso) return "—";
  try {
    const locale = idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR";
    return new Date(iso + "T00:00:00").toLocaleDateString(locale);
  } catch { return iso; }
}

function formatDataHora(iso: string, idioma: string): string {
  if (!iso) return "—";
  try {
    const locale = idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR";
    return new Date(iso).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  } catch { return iso; }
}

export default function EmpresaPage() {
  const { idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const tt = T[lang];
  const inputLogoRef = useRef<HTMLInputElement>(null);

  // Estados principais
  const [userId, setUserId] = useState<string | null>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [empresaForm, setEmpresaForm] = useState<any>({});
  const [socios, setSocios] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [obrigacoes, setObrigacoes] = useState<any[]>([]);
  const [auditoria, setAuditoria] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  // Scores
  const [healthScore, setHealthScore] = useState<ScoreResultado>({ score: 0, nivel: "—", cor: "#5a7a9a", itens: [] });
  const [complianceScore, setComplianceScore] = useState<ScoreResultado>({ score: 0, nivel: "—", cor: "#5a7a9a", itens: [] });

  // Aba
  const [aba, setAba] = useState<"dados" | "socios" | "compliance" | "cofre" | "auditoria">("dados");

  // CNPJ/CEP
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [resultadoCNPJ, setResultadoCNPJ] = useState<any>(null);
  const [consultandoCEP, setConsultandoCEP] = useState(false);
  const [ultimoCepConsultado, setUltimoCepConsultado] = useState("");

  // Preenchimento inteligente — campos sugeridos por regra (visíveis, nunca
  // impostos) e erros de validação em tempo real, por campo.
  const [camposSugeridos, setCamposSugeridos] = useState<Set<string>>(new Set());
  const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});

  // Banco — seletor com busca (BrasilAPI, server-side). O próprio campo de
  // texto filtra a lista ao digitar (typeahead) — sem coluna nova no banco,
  // continua salvando o nome em banco_principal, só a UI de escolha muda.
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancoDropdownAberto, setBancoDropdownAberto] = useState(false);

  // Modais
  const [modalSocio, setModalSocio] = useState<any>(null);
  const [modalDocumento, setModalDocumento] = useState<any>(null);
  const [modalObrigacao, setModalObrigacao] = useState<any>(null);
  const [modalScoreDetalhe, setModalScoreDetalhe] = useState<"health" | "compliance" | null>(null);
  const [shareModalAberto, setShareModalAberto] = useState(false);
  const [modalLimparAberto, setModalLimparAberto] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; tipo: "info" | "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "info" | "erro" | "ok" = "info") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3000);
  }

  // Qualificações de sócio traduzidas
  const qualificacoesSocios = [
    tt.qualSocio, tt.qualSocioAdm, tt.qualAdministrador, tt.qualDiretor, tt.qualProcurador, tt.qualOutros,
  ];

  useEffect(() => { carregarTudo(); listarBancos().then(setBancos); }, []);

  // Uma função só, auto-suficiente (mesmo padrão do Cockpit e dos outros
  // módulos: um único carregar() que já busca o usuário por dentro) — antes
  // era inicializar() + carregarTudo(uid), duas funções em cadeia, e um erro
  // em QUALQUER ponto de inicializar() (antes de chamar carregarTudo) nunca
  // tinha try/catch nem garantia de setCarregando(false), deixando a tela
  // travada em "carregando" pra sempre sem nenhum aviso. O finally abaixo
  // garante que isso nunca mais acontece, não importa onde algo falhe.
  async function carregarTudo() {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // obterEmpresaAtiva() já garante a criação (dono/convidado/"Minha Empresa" automática) —
      // não repetir a criação aqui evita duas empresas por corrida (ver SQL-EMPRESA-PADRAO.sql).
      const empresaAtivaId = await obterEmpresaAtiva();
      const emp = empresaAtivaId ? await carregarEmpresaPorId(empresaAtivaId) : null;
      if (emp) {
        setEmpresa(emp);
        setEmpresaForm(emp);
        const [s, d, o, a] = await Promise.all([
          carregarSocios(emp.id, user.id),
          carregarDocumentos(emp.id, user.id),
          carregarObrigacoes(emp.id, user.id),
          carregarAuditoria(emp.id, user.id, 100),
        ]);
        setSocios(s); setDocumentos(d); setObrigacoes(o); setAuditoria(a);
        setHealthScore(calcularHealthScore(emp, s, d));
        setComplianceScore(calcularComplianceScore(emp, o, d));
      }
    } catch (err: any) {
      showToast(err.message || tt.toastErroCarregar, "erro");
    } finally {
      setCarregando(false);
    }
  }

  // Traduz o código de erro estável que os helpers devolvem (SEM_PERMISSAO_ESCRITA,
  // invalido/nao_encontrado/indisponivel do CNPJ/CEP) — mesmo padrão de mensagemErro() em /equipe.
  function mensagemErroCodigo(contexto: "cnpj" | "cep", codigo: string | undefined, fallback: string): string {
    if (codigo === "indisponivel") return tt.toastServicoIndisponivel;
    if (contexto === "cnpj") {
      if (codigo === "invalido") return tt.toastCnpjInvalido;
      if (codigo === "nao_encontrado") return tt.toastCnpjNaoEncontrado;
    } else {
      if (codigo === "invalido") return tt.toastCepInvalido;
      if (codigo === "nao_encontrado") return tt.toastCepNaoEncontrado;
    }
    return fallback;
  }

  // Preenche um campo só se estiver vazio (Ressalva do Elias: nunca apagar
  // dado já digitado). Quando preenche, marca como "sugerido" pra tela
  // mostrar o selo — some sozinho assim que o usuário editar o campo
  // (ver onChangeCampo).
  function preencherSeVazio(prev: any, sugeridosNovos: Set<string>, campo: string, valor: any) {
    const vazio = prev[campo] === undefined || prev[campo] === null || prev[campo] === "" || prev[campo] === 0;
    const preenche = vazio && valor !== undefined && valor !== null && valor !== "";
    if (!preenche) return prev[campo];
    sugeridosNovos.add(campo);
    return valor;
  }

  // onChange de todo campo passa por aqui — sai da lista de "sugerido" no
  // instante em que o usuário mexe, mesmo que retype o mesmo valor.
  function onChangeCampo(campo: string, valor: any) {
    setCampo(campo, valor);
    setCamposSugeridos((prev) => {
      if (!prev.has(campo)) return prev;
      const novo = new Set(prev);
      novo.delete(campo);
      return novo;
    });
    setErrosCampo((prev) => {
      if (!(campo in prev)) return prev;
      const novo = { ...prev };
      delete novo[campo];
      return novo;
    });
  }

  // Recarrega só a lista de sócios (e o Health Score, que depende dela) —
  // nunca chamar carregarTudo() depois de mexer em sócios: carregarTudo()
  // faz setEmpresaForm(emp) com o registro do BANCO, e isso apaga qualquer
  // edição em andamento no rascunho do cadastro (empresa/empresaForm) que
  // ainda não foi salva — foi exatamente esse o bug do "Aplicar Dados":
  // aplicava os campos do CNPJ no rascunho, importava os sócios, e o
  // carregarTudo() que vinha em seguida apagava o rascunho de volta.
  async function recarregarSocios() {
    if (!empresa || !userId) return;
    const s = await carregarSocios(empresa.id, userId);
    setSocios(s);
    setHealthScore(calcularHealthScore(empresa, s, documentos));
  }

  // CNPJ
  async function preencherPorCNPJ() {
    const cnpj = limparCNPJ(empresaForm.cnpj || "");
    if (!cnpj) { showToast(tt.toastDigiteCnpj, "erro"); return; }
    if (!validarCNPJ(cnpj)) { setErrosCampo((p) => ({ ...p, cnpj: tt.erroCnpjInvalido })); return; }
    setConsultandoCNPJ(true);
    const r = await consultarCNPJ(cnpj);
    setConsultandoCNPJ(false);
    if ("erro" in r) { showToast(mensagemErroCodigo("cnpj", r.codigo, r.erro), "erro"); return; }
    setResultadoCNPJ(r);
  }

  function aplicarDadosCNPJ() {
    if (!resultadoCNPJ) return;
    const d = resultadoCNPJ;
    const sugeridosNovos = new Set<string>();
    setEmpresaForm((prev: any) => {
      const p = (campo: string, valor: any) => preencherSeVazio(prev, sugeridosNovos, campo, valor);
      // Regime: dado REAL da Receita (opcao_mei/opcao_simples) tem prioridade
      // sobre a sugestão por porte — só quando não há nenhum dos dois é que o
      // campo fica sem sugestão (ex.: porte "Demais").
      const regimeReal = d.opcao_mei ? "mei" : d.opcao_simples ? "simples" : null;
      const regime = regimeReal || sugerirRegimePorPorte(d.porte);
      return {
        ...prev,
        razao_social: p("razao_social", d.razao_social),
        nome_fantasia: p("nome_fantasia", d.nome_fantasia),
        cnpj: prev.cnpj || d.cnpj,
        cnae_principal: p("cnae_principal", d.cnae_principal),
        cnae_descricao: p("cnae_descricao", d.cnae_descricao),
        cnaes_secundarios: prev.cnaes_secundarios?.length ? prev.cnaes_secundarios : d.cnaes_secundarios,
        natureza_juridica: p("natureza_juridica", d.natureza_juridica),
        porte: p("porte", d.porte),
        data_abertura: p("data_abertura", d.data_abertura),
        capital_social: p("capital_social", d.capital_social),
        situacao_cadastral: p("situacao_cadastral", d.situacao_cadastral),
        opcao_simples: prev.opcao_simples ?? d.opcao_simples,
        opcao_mei: prev.opcao_mei ?? d.opcao_mei,
        regime_tributario: p("regime_tributario", regime),
        cep: p("cep", d.cep),
        logradouro: p("logradouro", d.logradouro),
        numero: p("numero", d.numero),
        complemento: p("complemento", d.complemento),
        bairro: p("bairro", d.bairro),
        cidade: p("cidade", d.cidade),
        uf: p("uf", d.uf),
        telefone_principal: p("telefone_principal", d.telefone_principal),
        email_principal: p("email_principal", d.email_principal),
        chave_pix: p("chave_pix", d.cnpj ? formatarChavePix(limparCNPJ(d.cnpj)) : undefined),
        nome: prev.nome || d.nome_fantasia || d.razao_social,
      };
    });
    setCamposSugeridos((prev) => new Set([...prev, ...sugeridosNovos]));
    showToast(tt.toastDadosAplicados, "ok");
    if (d.socios && d.socios.length > 0 && empresa) {
      if (window.confirm(tt.toastConfirmImportarSocios(d.socios.length))) {
        importarSociosDoQSA(empresa.id, userId!, d.socios, socios).then(({ importados, ignorados }) => {
          showToast(ignorados > 0 ? tt.toastSociosImportadosComIgnorados(importados, ignorados) : tt.toastSociosImportados(importados), "ok");
          recarregarSocios();
        });
      }
    }
    setResultadoCNPJ(null);
  }

  async function preencherPorCEP(cepDigitado?: string) {
    const cep = (cepDigitado ?? empresaForm.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) { setErrosCampo((p) => ({ ...p, cep: tt.erroCepInvalido })); return; }
    if (cep === ultimoCepConsultado) return; // Ressalva do Elias: sem consulta repetida pro mesmo CEP.
    setConsultandoCEP(true);
    const r = await consultarCEP(cep);
    setConsultandoCEP(false);
    if ("erro" in r) { showToast(mensagemErroCodigo("cep", r.codigo, r.erro), "erro"); return; }
    setUltimoCepConsultado(cep);
    const sugeridosNovos = new Set<string>();
    setEmpresaForm((prev: any) => {
      const p = (campo: string, valor: any) => preencherSeVazio(prev, sugeridosNovos, campo, valor);
      return {
        ...prev,
        cep: prev.cep || r.cep,
        logradouro: p("logradouro", r.logradouro),
        bairro: p("bairro", r.bairro),
        cidade: p("cidade", r.cidade),
        uf: p("uf", r.uf),
      };
    });
    setCamposSugeridos((prev) => new Set([...prev, ...sugeridosNovos]));
    showToast(tt.toastEnderecoPreenchido, "ok");
  }

  function onBlurCEP() {
    const cep = (empresaForm.cep || "").replace(/\D/g, "");
    if (cep.length === 8 && cep !== ultimoCepConsultado) preencherPorCEP(cep);
  }

  // Sugestões por regra a partir do e-mail principal (domínio) — disparadas
  // ao sair do campo, nunca sobrescrevem o que já tiver conteúdo.
  function onBlurEmailPrincipal() {
    const email = (empresaForm.email_principal || "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    const dominio = email.split("@")[1];
    const sugeridosNovos = new Set<string>();
    setEmpresaForm((prev: any) => {
      const p = (campo: string, valor: any) => preencherSeVazio(prev, sugeridosNovos, campo, valor);
      return {
        ...prev,
        email_financeiro: p("email_financeiro", `financeiro@${dominio}`),
        email_contabil: p("email_contabil", `contabil@${dominio}`),
        website: p("website", `https://${dominio}`),
        chave_pix: p("chave_pix", email),
      };
    });
    setCamposSugeridos((prev) => new Set([...prev, ...sugeridosNovos]));
  }

  async function salvarEmpresa() {
    if (!empresa || !userId) return;
    setSalvando(true);
    const r = await atualizarEmpresa(empresa.id, userId, empresa, empresaForm);
    if (r.erro) showToast(r.erro === "SEM_PERMISSAO_ESCRITA" ? tt.toastSemPermissaoEscrita : r.erro, "erro");
    else { showToast(tt.toastDadosSalvos, "ok"); await carregarTudo(); }
    setSalvando(false);
  }

  // Só mexe no rascunho (empresaForm) — nada é apagado no banco aqui. O
  // usuário ainda precisa clicar em Salvar pra gravar os campos vazios.
  // Nunca toca em sócios/documentos/obrigações/auditoria — são outras
  // tabelas, outras abas, não fazem parte do "cadastro" limpo aqui.
  function limparCampos() {
    setEmpresaForm((prev: any) => ({
      ...prev,
      cnpj: "",
      razao_social: "", nome_fantasia: "", inscricao_estadual: "", inscricao_municipal: "", porte: "",
      regime_tributario: "", cnae_principal: "", cnae_descricao: "", cnaes_secundarios: [], natureza_juridica: "",
      capital_social: 0, data_abertura: "", situacao_cadastral: "", opcao_simples: false, opcao_mei: false,
      cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "",
      telefone_principal: "", telefone_secundario: "", email_principal: "", email_financeiro: "", email_contabil: "", website: "",
      banco_principal: "", agencia: "", conta: "", chave_pix: "",
      contador_nome: "", contador_crc: "", contador_telefone: "", contador_email: "",
    }));
    setCamposSugeridos(new Set()); // nenhum campo vazio pode continuar marcado como "sugerido"
    setErrosCampo({});
    setResultadoCNPJ(null);
    setUltimoCepConsultado(""); // libera nova consulta de CEP sem a trava de "mesmo CEP de antes"
    setModalLimparAberto(false);
    showToast(tt.toastCamposLimpos, "ok");
  }

  async function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const r = await uploadLogo(file, userId);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    setEmpresaForm((prev: any) => ({ ...prev, logo_url: r.url }));
    showToast(tt.toastLogoAtualizada, "ok");
    if (inputLogoRef.current) inputLogoRef.current.value = "";
  }

  // Sócios CRUD
  async function salvarSocio(dados: any) {
    if (!empresa || !userId) return;
    if (modalSocio === "novo") {
      const r = await criarSocio(empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
      showToast(tt.toastSocioAdicionado, "ok");
    } else {
      const r = await atualizarSocio(modalSocio.id, empresa.id, userId, dados);
      if (r.erro) { showToast(r.erro, "erro"); return; }
      showToast(tt.toastSocioAtualizado, "ok");
    }
    setModalSocio(null);
    await recarregarSocios();
  }

  async function removerSocio(socio: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverSocio(socio.nome))) return;
    const r = await excluirSocio(socio.id, empresa.id, userId);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastSocioRemovido, "ok");
    await recarregarSocios();
  }

  // Documentos
  async function salvarDocumento(dados: any, arquivo: File | null) {
    if (!empresa || !userId) return;
    let storagePath: string | null = null;
    if (arquivo) {
      const up = await uploadDocumento(arquivo, empresa.id, userId, dados.tipo || "outros");
      if (up.erro) { showToast(up.erro, "erro"); return; }
      storagePath = up.path || null;
    }
    const r = await criarDocumento(empresa.id, userId, {
      ...dados, storage_path: storagePath, mime_type: arquivo?.type, tamanho_bytes: arquivo?.size,
    });
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastDocAdicionado, "ok");
    setModalDocumento(null);
    await carregarTudo();
  }

  async function removerDocumento(doc: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverDoc(doc.nome))) return;
    const r = await excluirDocumento(doc.id, empresa.id, userId, doc.storage_path, doc.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastDocRemovido, "ok");
    await carregarTudo();
  }

  async function baixarDocumento(doc: any) {
    if (!doc.storage_path) { showToast(tt.toastArquivoIndisponivel, "erro"); return; }
    const url = await gerarUrlDocumento(doc.storage_path);
    if (url) window.open(url, "_blank"); else showToast(tt.toastErroGerarLink, "erro");
  }

  // Obrigações
  async function gerarCalendarioFiscal() {
    if (!empresa || !userId) return;
    if (!empresa.regime_tributario) { showToast(tt.toastDefinaRegime, "erro"); return; }
    const ano = new Date().getFullYear();
    const lista = gerarObrigacoesPadrao(empresa.regime_tributario, ano);
    if (lista.length === 0) { showToast(tt.toastNenhumaObrigPadrao, "erro"); return; }
    if (!window.confirm(tt.toastConfirmGerarObrig(lista.length, ano))) return;
    let ok = 0;
    for (const obr of lista) {
      const r = await criarObrigacao(empresa.id, userId, obr);
      if (!r.erro) ok++;
    }
    showToast(tt.toastObrigCriadas(ok), "ok");
    await carregarTudo();
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
    showToast(tt.toastObrigSalva, "ok");
    await carregarTudo();
  }

  async function marcarObrigacaoPaga(obr: any) {
    if (!empresa || !userId) return;
    const r = await atualizarObrigacao(obr.id, empresa.id, userId, { status: "paga", valor_pago: obr.valor_estimado });
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastMarcadaPaga, "ok");
    await carregarTudo();
  }

  async function removerObrigacao(obr: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverObrig(obr.nome))) return;
    const r = await excluirObrigacao(obr.id, empresa.id, userId, obr.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    await carregarTudo();
  }

  // Compartilhamento
  function montarTextoCompartilhamento(): string {
    if (!empresa) return "Axioma AI.Tech";
    const endereco = [empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade, empresa.uf].filter(Boolean).join(", ");
    return [
      `🦅 *AXIOMA AI.TECH*`,
      ``,
      `🏢 *${empresa.nome_fantasia || empresa.razao_social || empresa.nome}*`,
      empresa.razao_social ? `📋 ${empresa.razao_social}` : "",
      empresa.cnpj ? `📄 CNPJ: ${empresa.cnpj}` : "",
      empresa.inscricao_estadual ? `🗂️ IE: ${empresa.inscricao_estadual}` : "",
      empresa.regime_tributario ? `🏛️ ${tt.regime}: ${empresa.regime_tributario}` : "",
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
      `_axiomaai.com.br_`,
    ].filter(Boolean).join("\n");
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(montarTextoCompartilhamento())}`, "_blank");
  }
  function shareTelegram() {
    window.open(`https://t.me/share/url?url=https://axiomaai.com.br&text=${encodeURIComponent(montarTextoCompartilhamento())}`, "_blank");
  }
  function shareGmail() {
    const assunto = encodeURIComponent(`Axioma - ${empresa?.nome_fantasia || empresa?.razao_social || ""}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  function shareOutlook() {
    const assunto = encodeURIComponent(`Axioma - ${empresa?.nome_fantasia || empresa?.razao_social || ""}`);
    const corpo = encodeURIComponent(montarTextoCompartilhamento().replace(/\*/g, ""));
    window.open(`https://outlook.live.com/owa/?path=/mail/action/compose&subject=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
  }
  async function shareCopiarTexto() {
    try {
      await navigator.clipboard.writeText(montarTextoCompartilhamento().replace(/\*/g, ""));
      showToast(tt.toastCartaoCopiado, "ok");
    } catch { showToast(tt.toastErroCopiar, "erro"); }
  }

  // PDF
  async function exportarPDF() {
    if (!empresa) return;
    setExportando(true);
    try {
      const linhasEmp = [
        { campo: tt.razaoSocial, valor: empresa.razao_social || "—" },
        { campo: tt.nomeFantasia, valor: empresa.nome_fantasia || "—" },
        { campo: "CNPJ", valor: empresa.cnpj || "—" },
        { campo: tt.inscricaoEstadual, valor: empresa.inscricao_estadual || "—" },
        { campo: tt.regimeTributario, valor: empresa.regime_tributario || "—" },
        { campo: tt.cnaePrincipal, valor: empresa.cnae_principal ? `${empresa.cnae_principal} - ${empresa.cnae_descricao || ""}` : "—" },
        { campo: tt.porte, valor: empresa.porte || "—" },
        { campo: tt.endereco.replace(/📍\s*/, ""), valor: [empresa.logradouro, empresa.numero, empresa.bairro, empresa.cidade, empresa.uf].filter(Boolean).join(", ") || "—" },
        { campo: "CEP", valor: empresa.cep || "—" },
        { campo: tt.telefone, valor: empresa.telefone_principal || "—" },
        { campo: tt.email, valor: empresa.email_principal || "—" },
        { campo: tt.website, valor: empresa.website || "—" },
        { campo: tt.contador.replace(/👤\s*/, ""), valor: empresa.contador_nome || "—" },
        { campo: `CRC ${tt.contador.replace(/👤\s*/, "")}`, valor: empresa.contador_crc || "—" },
      ];
      await gerarPdfTabela({
        titulo: `${tt.compartilharCartao.replace(/📤\s*/, "")} - ${empresa.nome_fantasia || empresa.razao_social || empresa.nome}`,
        subtitulo: new Date().toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR"),
        colunas: [
          { header: tt.campo.toUpperCase(), key: "campo", width: 50, align: "left" as const },
          { header: lang === "en" ? "VALUE" : lang === "es" ? "VALOR" : "VALOR", key: "valor", width: 110, align: "left" as const },
        ],
        linhas: linhasEmp,
        resumo: [
          { label: "Health Score", valor: `${healthScore.score}/100 (${healthScore.nivel})` },
          { label: "Compliance Score", valor: `${complianceScore.score}/100 (${complianceScore.nivel})` },
        ],
        nomeArquivo: `axioma-empresa-${(empresa.nome_fantasia || empresa.razao_social || "empresa").replace(/\W/g, "_").toLowerCase()}.pdf`,
      });
    } catch (err: any) {
      showToast(err.message || tt.toastErroPdf, "erro");
    }
    setExportando(false);
  }

  function setCampo(campo: string, valor: any) {
    setEmpresaForm((prev: any) => ({ ...prev, [campo]: valor }));
  }

  const inputStyle = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  // Secundário de propósito — nunca pode se confundir com "Salvar" (verde) nem
  // com "Exportar PDF" (vermelho #dc2626, padrão do projeto). Âmbar de alerta
  // suave, com contraste real no fundo escuro (não some como o cinza de antes).
  const estiloLimparCampos = { background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.5)", color: "#fbbf24" };

  return (
    <ModuloLayout titulo={tt.titulo} subtitulo={tt.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
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
            <p className="text-sm" style={{ color: "#6ab0ff" }}>{tt.carregandoEmpresa}</p>
          </div>
        </CanvasBox>
      )}

      {/* Estado vazio honesto — nunca mais fica em branco quando a empresa não
          é encontrada. Antes, esse caso não tinha nenhuma tela própria: o
          carregamento podia terminar (ou travar) sem nenhum aviso. */}
      {!carregando && !empresa && (
        <CanvasBox cor="#f87171">
          <div className="py-12 text-center">
            <p className="text-3xl mb-3">🏢</p>
            <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{tt.empresaNaoEncontrada}</p>
            <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{tt.empresaNaoEncontradaSub}</p>
            <button onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.12)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.3)" }}>
              {tt.recarregarPagina}
            </button>
          </div>
        </CanvasBox>
      )}

      {!carregando && empresa && (
        <div className="space-y-4">
          {/* Header com 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.empresa}</p>
                  <p className="text-sm font-bold truncate" style={{ color: "#c8d8f0" }}>{empresa.nome_fantasia || empresa.razao_social || empresa.nome}</p>
                  <p className="text-xs" style={{ color: "#6ab0ff" }}>{empresa.cnpj || tt.semCnpj}</p>
                </div>
              </div>
            </CanvasBox>

            <CanvasBox cor={healthScore.cor}>
              <button onClick={() => setModalScoreDetalhe("health")} className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.healthScore}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: healthScore.cor }}>{healthScore.score}</span>
                  <span style={{ color: "#5a7a9a" }}>/100</span>
                  <span className="text-xs font-bold" style={{ color: healthScore.cor }}>{healthScore.nivel}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>{tt.cliquePraDetalhes}</p>
              </button>
            </CanvasBox>

            <CanvasBox cor={complianceScore.cor}>
              <button onClick={() => setModalScoreDetalhe("compliance")} className="w-full text-left">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.complianceScore}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black" style={{ color: complianceScore.cor }}>{complianceScore.score}</span>
                  <span style={{ color: "#5a7a9a" }}>/100</span>
                  <span className="text-xs font-bold" style={{ color: complianceScore.cor }}>{complianceScore.nivel}</span>
                </div>
                <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>{tt.cliquePraDetalhes}</p>
              </button>
            </CanvasBox>
          </div>

          <button onClick={() => setShareModalAberto(true)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
            {tt.compartilharCartao}
          </button>

          {/* Abas */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: "dados", label: tt.abaDados },
              { key: "socios", label: `${tt.abaSocios} (${socios.length})` },
              { key: "compliance", label: `${tt.abaCompliance} (${obrigacoes.length})` },
              { key: "cofre", label: `${tt.abaCofre} (${documentos.length})` },
              { key: "auditoria", label: tt.abaAuditoria },
            ].map((a) => (
              <button key={a.key} onClick={() => setAba(a.key as any)}
                className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: aba === a.key ? "linear-gradient(135deg, #1a3a8f, #2a5fd4)" : "rgba(10,22,40,0.6)",
                  color: aba === a.key ? "#fff" : "#6ab0ff",
                  border: aba === a.key ? "1px solid #6ab0ff" : "1px solid rgba(106,176,255,0.2)",
                }}>{a.label}</button>
            ))}
          </div>

          {/* ABA DADOS */}
          {aba === "dados" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setModalLimparAberto(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold"
                  style={estiloLimparCampos}>
                  {tt.limparCampos}
                </button>
              </div>

              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.autoCnpjTitulo}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input value={empresaForm.cnpj || ""} onChange={(e) => onChangeCampo("cnpj", formatarCNPJ(e.target.value))}
                      onBlur={() => { if (empresaForm.cnpj && !validarCNPJ(limparCNPJ(empresaForm.cnpj))) setErrosCampo((p) => ({ ...p, cnpj: tt.erroCnpjInvalido })); }}
                      placeholder="00.000.000/0000-00" className="w-full px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
                    {errosCampo.cnpj && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{errosCampo.cnpj}</p>}
                  </div>
                  <button onClick={preencherPorCNPJ} disabled={consultandoCNPJ}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 shrink-0"
                    style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>
                    {consultandoCNPJ ? tt.consultando : tt.preencherCnpj}
                  </button>
                </div>
                <p className="text-[10px] mt-2" style={{ color: "#5a7a9a" }}>{tt.autoCnpjInfo}</p>
              </CanvasBox>

              <CanvasBox cor="#6ab0ff">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="md:col-span-1">
                    <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.logo}</p>
                    {empresaForm.logo_url ? (
                      <img src={empresaForm.logo_url} alt="logo" className="w-24 h-24 rounded-xl object-contain" style={{ background: "rgba(2,8,16,0.5)" }} />
                    ) : (
                      <div className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-black" style={{ background: "rgba(2,8,16,0.5)", border: "1px dashed rgba(106,176,255,0.3)" }}>
                        <span style={{ color: "#5a7a9a" }}>?</span>
                      </div>
                    )}
                    <button onClick={() => inputLogoRef.current?.click()}
                      className="mt-2 text-xs px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.uploadLogo}</button>
                    <input ref={inputLogoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
                  </div>
                  <div className="md:col-span-3 space-y-3">
                    <FieldLabel label={tt.razaoSocial} sugerido={camposSugeridos.has("razao_social")} sugeridoTexto={tt.sugeridoBadge}>
                      <input value={empresaForm.razao_social || ""} onChange={(e) => onChangeCampo("razao_social", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    </FieldLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FieldLabel label={tt.nomeFantasia} sugerido={camposSugeridos.has("nome_fantasia")} sugeridoTexto={tt.sugeridoBadge}>
                        <input value={empresaForm.nome_fantasia || ""} onChange={(e) => onChangeCampo("nome_fantasia", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.inscricaoEstadual}>
                        <input value={empresaForm.inscricao_estadual || ""} onChange={(e) => onChangeCampo("inscricao_estadual", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.inscricaoMunicipal}>
                        <input value={empresaForm.inscricao_municipal || ""} onChange={(e) => onChangeCampo("inscricao_municipal", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.porte} sugerido={camposSugeridos.has("porte")} sugeridoTexto={tt.sugeridoBadge}>
                        <select value={empresaForm.porte || ""} onChange={(e) => {
                            onChangeCampo("porte", e.target.value);
                            // Sugestão por porte só entra se o regime ainda estiver vazio — nunca sobrescreve.
                            if (!empresaForm.regime_tributario) {
                              const sugestao = sugerirRegimePorPorte(e.target.value);
                              if (sugestao) { setCampo("regime_tributario", sugestao); setCamposSugeridos((prev) => new Set([...prev, "regime_tributario"])); }
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                          <option value="" style={{ background: "#020810" }}>—</option>
                          {PORTES.map((p) => <option key={p} value={p} style={{ background: "#020810" }}>{p}</option>)}
                        </select>
                      </FieldLabel>
                    </div>
                  </div>
                </div>
              </CanvasBox>

              <CanvasBox cor="#34d399">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.tributario}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldLabel label={tt.regimeTributario} sugerido={camposSugeridos.has("regime_tributario")} sugeridoTexto={tt.sugeridoBadge}>
                    <select value={empresaForm.regime_tributario || ""} onChange={(e) => onChangeCampo("regime_tributario", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                      <option value="" style={{ background: "#020810" }}>—</option>
                      {REGIMES_TRIBUTARIOS.map((r) => <option key={r.key} value={r.key} style={{ background: "#020810" }}>{r.label}</option>)}
                    </select>
                  </FieldLabel>
                  <FieldLabel label={tt.cnaePrincipal} sugerido={camposSugeridos.has("cnae_principal")} sugeridoTexto={tt.sugeridoBadge}>
                    <input value={empresaForm.cnae_principal || ""} onChange={(e) => onChangeCampo("cnae_principal", e.target.value)}
                      placeholder="6201-5/01" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <div className="md:col-span-2">
                    <FieldLabel label={tt.cnaeDescricao} sugerido={camposSugeridos.has("cnae_descricao")} sugeridoTexto={tt.sugeridoBadge}>
                      <input value={empresaForm.cnae_descricao || ""} onChange={(e) => onChangeCampo("cnae_descricao", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    </FieldLabel>
                  </div>
                  <FieldLabel label={tt.naturezaJuridica} sugerido={camposSugeridos.has("natureza_juridica")} sugeridoTexto={tt.sugeridoBadge}>
                    <input value={empresaForm.natureza_juridica || ""} onChange={(e) => onChangeCampo("natureza_juridica", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.capitalSocial} sugerido={camposSugeridos.has("capital_social")} sugeridoTexto={tt.sugeridoBadge}
                    erro={errosCampo.capital_social}>
                    <input value={empresaForm.capital_social ? formatarMoedaBR(empresaForm.capital_social) : ""}
                      onChange={(e) => {
                        const num = moedaBRParaNumero(e.target.value);
                        onChangeCampo("capital_social", num);
                        setErrosCampo((p) => { if (!("capital_social" in p)) return p; const n = { ...p }; delete n.capital_social; return n; });
                      }}
                      inputMode="numeric" placeholder="R$ 0,00" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.dataAbertura} sugerido={camposSugeridos.has("data_abertura")} sugeridoTexto={tt.sugeridoBadge}>
                    <input type="date" value={empresaForm.data_abertura || ""} onChange={(e) => onChangeCampo("data_abertura", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.situacaoCadastral} sugerido={camposSugeridos.has("situacao_cadastral")} sugeridoTexto={tt.sugeridoBadge}>
                    <select value={empresaForm.situacao_cadastral || ""} onChange={(e) => onChangeCampo("situacao_cadastral", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                      <option value="" style={{ background: "#020810" }}>—</option>
                      <option value="ativa" style={{ background: "#020810" }}>{tt.situacaoAtiva}</option>
                      <option value="suspensa" style={{ background: "#020810" }}>{tt.situacaoSuspensa}</option>
                      <option value="inapta" style={{ background: "#020810" }}>{tt.situacaoInapta}</option>
                      <option value="baixada" style={{ background: "#020810" }}>{tt.situacaoBaixada}</option>
                    </select>
                  </FieldLabel>
                </div>
              </CanvasBox>

              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.endereco}</p>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="md:col-span-2">
                    <div className="flex gap-2">
                      <input value={empresaForm.cep || ""} onChange={(e) => {
                          const v = formatarCEP(e.target.value);
                          onChangeCampo("cep", v);
                          if (v.replace(/\D/g, "").length === 8) preencherPorCEP(v);
                        }}
                        onBlur={onBlurCEP}
                        placeholder="00000-000" className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      <button onClick={() => preencherPorCEP()} disabled={consultandoCEP}
                        className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                        style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>{consultandoCEP ? "..." : "🔍"}</button>
                    </div>
                    {errosCampo.cep && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{errosCampo.cep}</p>}
                  </div>
                  <div className="md:col-span-3"><input value={empresaForm.logradouro || ""} onChange={(e) => onChangeCampo("logradouro", e.target.value)} placeholder={tt.logradouro} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-1"><input value={empresaForm.numero || ""} onChange={(e) => onChangeCampo("numero", e.target.value)} placeholder={tt.numero} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.complemento || ""} onChange={(e) => onChangeCampo("complemento", e.target.value)} placeholder={tt.complemento} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.bairro || ""} onChange={(e) => onChangeCampo("bairro", e.target.value)} placeholder={tt.bairro} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.cidade || ""} onChange={(e) => onChangeCampo("cidade", e.target.value)} placeholder={tt.cidade} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-1"><input value={empresaForm.uf || ""} onChange={(e) => onChangeCampo("uf", e.target.value.toUpperCase().slice(0, 2))} placeholder={tt.uf} maxLength={2} className="w-full px-3 py-2 rounded-lg text-sm uppercase" style={inputStyle} /></div>
                </div>
              </CanvasBox>

              <CanvasBox cor="#6ab0ff">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.contato}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldLabel label={tt.telefonePrincipal} sugerido={camposSugeridos.has("telefone_principal")} sugeridoTexto={tt.sugeridoBadge}>
                    <input value={empresaForm.telefone_principal || ""} onChange={(e) => onChangeCampo("telefone_principal", formatarTelefone(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.telefoneSecundario}>
                    <input value={empresaForm.telefone_secundario || ""} onChange={(e) => onChangeCampo("telefone_secundario", formatarTelefone(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailPrincipal} sugerido={camposSugeridos.has("email_principal")} sugeridoTexto={tt.sugeridoBadge}
                    erro={errosCampo.email_principal}>
                    <input type="email" value={empresaForm.email_principal || ""} onChange={(e) => onChangeCampo("email_principal", e.target.value)}
                      onBlur={() => {
                        onBlurEmailPrincipal();
                        const v = (empresaForm.email_principal || "").trim();
                        if (v && !/^\S+@\S+\.\S+$/.test(v)) setErrosCampo((p) => ({ ...p, email_principal: tt.erroEmailInvalido }));
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailFinanceiro} sugerido={camposSugeridos.has("email_financeiro")} sugeridoTexto={tt.sugeridoBadge}
                    erro={errosCampo.email_financeiro}>
                    <input type="email" value={empresaForm.email_financeiro || ""} onChange={(e) => onChangeCampo("email_financeiro", e.target.value)}
                      onBlur={() => { const v = (empresaForm.email_financeiro || "").trim(); setErrosCampo((p) => { const n = { ...p }; if (v && !/^\S+@\S+\.\S+$/.test(v)) n.email_financeiro = tt.erroEmailInvalido; else delete n.email_financeiro; return n; }); }}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailContabil} sugerido={camposSugeridos.has("email_contabil")} sugeridoTexto={tt.sugeridoBadge}
                    erro={errosCampo.email_contabil}>
                    <input type="email" value={empresaForm.email_contabil || ""} onChange={(e) => onChangeCampo("email_contabil", e.target.value)}
                      onBlur={() => { const v = (empresaForm.email_contabil || "").trim(); setErrosCampo((p) => { const n = { ...p }; if (v && !/^\S+@\S+\.\S+$/.test(v)) n.email_contabil = tt.erroEmailInvalido; else delete n.email_contabil; return n; }); }}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.website} sugerido={camposSugeridos.has("website")} sugeridoTexto={tt.sugeridoBadge}>
                    <input value={empresaForm.website || ""} onChange={(e) => onChangeCampo("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                </div>
              </CanvasBox>

              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.bancario}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <FieldLabel label={tt.banco}>
                    <div className="relative">
                      <input value={empresaForm.banco_principal || ""}
                        onChange={(e) => { onChangeCampo("banco_principal", e.target.value); setBancoDropdownAberto(true); }}
                        onFocus={() => setBancoDropdownAberto(true)}
                        onBlur={() => setTimeout(() => setBancoDropdownAberto(false), 150)}
                        placeholder={tt.buscarBanco} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      {bancoDropdownAberto && bancos.length > 0 && (() => {
                        const filtro = (empresaForm.banco_principal || "").toLowerCase();
                        const encontrados = bancos.filter((b) => !filtro || b.nome.toLowerCase().includes(filtro)).slice(0, 30);
                        return (
                          <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg shadow-lg"
                            style={{ background: "#0a1628", border: "1px solid rgba(106,176,255,0.3)" }}>
                            {encontrados.length === 0 ? (
                              <p className="px-3 py-2 text-xs" style={{ color: "#5a7a9a" }}>{tt.nenhumBancoEncontrado}</p>
                            ) : encontrados.map((b) => (
                              <button key={b.codigo} type="button" onMouseDown={(e) => e.preventDefault()}
                                onClick={() => { onChangeCampo("banco_principal", b.nome); setBancoDropdownAberto(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-white/5" style={{ color: "#c8d8f0" }}>
                                {b.codigo} - {b.nome}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </FieldLabel>
                  <FieldLabel label={tt.agencia}><input value={empresaForm.agencia || ""} onChange={(e) => onChangeCampo("agencia", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.conta}><input value={empresaForm.conta || ""} onChange={(e) => onChangeCampo("conta", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.chavePix} sugerido={camposSugeridos.has("chave_pix")} sugeridoTexto={tt.sugeridoBadge}>
                    <input value={empresaForm.chave_pix || ""}
                      onChange={(e) => onChangeCampo("chave_pix", e.target.value)}
                      onBlur={(e) => onChangeCampo("chave_pix", formatarChavePix(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    {empresaForm.chave_pix && detectarTipoChavePix(empresaForm.chave_pix) && (
                      <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>
                        {tt.pixTipoDetectado}: {(tt as any)[`pixTipo_${detectarTipoChavePix(empresaForm.chave_pix)}`]}
                      </p>
                    )}
                  </FieldLabel>
                </div>
              </CanvasBox>

              <CanvasBox cor="#fbbf24">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.contador}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2"><FieldLabel label={tt.nome}><input value={empresaForm.contador_nome || ""} onChange={(e) => setCampo("contador_nome", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel></div>
                  <FieldLabel label={tt.crc}><input value={empresaForm.contador_crc || ""} onChange={(e) => setCampo("contador_crc", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.telefone}><input value={empresaForm.contador_telefone || ""} onChange={(e) => setCampo("contador_telefone", formatarTelefone(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <div className="md:col-span-4"><FieldLabel label={tt.email}><input type="email" value={empresaForm.contador_email || ""} onChange={(e) => setCampo("contador_email", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel></div>
                </div>
              </CanvasBox>

              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setModalLimparAberto(true)}
                  className="sm:w-auto w-full px-4 py-3 rounded-xl text-sm font-semibold order-2 sm:order-1"
                  style={estiloLimparCampos}>
                  {tt.limparCampos}
                </button>
                <button onClick={salvarEmpresa} disabled={salvando}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 order-1 sm:order-2"
                  style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
                  {salvando ? tt.salvando : tt.salvarEmpresa}
                </button>
              </div>
            </div>
          )}

          {/* ABA SÓCIOS */}
          {aba === "socios" && (
            <div className="space-y-4">
              <CanvasBox cor="#6ab0ff">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.quadroSocietario} ({socios.length})</p>
                  <button onClick={() => setModalSocio("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>{tt.novoSocio}</button>
                </div>
                {socios.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.semSocios}</p>
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
                          <button onClick={() => setModalSocio(s)} title={tt.editar}
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>✏️</button>
                          <button onClick={() => removerSocio(s)} title={tt.remover}
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CanvasBox>
            </div>
          )}

          {/* ABA COMPLIANCE */}
          {aba === "compliance" && (
            <div className="space-y-4">
              <CanvasBox cor={complianceScore.cor}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.calendarioFiscal} ({obrigacoes.length})</p>
                    <p className="text-xs" style={{ color: "#c8d8f0" }}>
                      {tt.regime}: <strong style={{ color: complianceScore.cor }}>{empresa.regime_tributario || tt.naoDefinido}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={gerarCalendarioFiscal}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>{tt.gerarCalendario}</button>
                    <button onClick={() => setModalObrigacao("novo")}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>{tt.novaObrigacao}</button>
                  </div>
                </div>
              </CanvasBox>

              {obrigacoes.length === 0 ? (
                <CanvasBox cor="#fbbf24"><p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.semObrigacoes}</p></CanvasBox>
              ) : (
                <div className="space-y-2">
                  {obrigacoes.map((o: any) => {
                    const hoje = new Date().toISOString().slice(0, 10);
                    const vencida = o.status === "pendente" && o.data_vencimento < hoje;
                    const corStatus = o.status === "paga" ? "#34d399" : vencida ? "#f87171" : o.status === "dispensada" ? "#5a7a9a" : "#fbbf24";
                    const labelStatus = vencida ? tt.statusVencida :
                      o.status === "paga" ? tt.statusPaga.toUpperCase() :
                      o.status === "atrasada" ? tt.statusAtrasada.toUpperCase() :
                      o.status === "dispensada" ? tt.statusDispensada.toUpperCase() : tt.statusPendente.toUpperCase();
                    return (
                      <div key={o.id} className="rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap"
                        style={{ background: "rgba(2,8,16,0.5)", border: `1px solid ${corStatus}30` }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{o.nome}</p>
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>
                            📅 {formatData(o.data_vencimento, lang)} • {o.tipo}
                            {o.valor_estimado > 0 && <span style={{ color: "#fbbf24" }}> • {formatBRL(o.valor_estimado, lang)}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `${corStatus}20`, color: corStatus }}>{labelStatus}</span>
                          {o.status !== "paga" && (
                            <button onClick={() => marcarObrigacaoPaga(o)} title={tt.marcarPaga}
                              className="px-2 py-1 rounded text-xs" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>✓</button>
                          )}
                          <button onClick={() => setModalObrigacao(o)} title={tt.editar}
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>✏️</button>
                          <button onClick={() => removerObrigacao(o)} title={tt.remover}
                            className="px-2 py-1 rounded text-xs" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ABA COFRE */}
          {aba === "cofre" && (
            <div className="space-y-4">
              <CanvasBox cor="#fbbf24">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.cofreDigital} ({documentos.length})</p>
                    <p className="text-xs" style={{ color: "#c8d8f0" }}>{tt.cofreInfo}</p>
                  </div>
                  <button onClick={() => setModalDocumento("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>{tt.novoDocumento}</button>
                </div>
              </CanvasBox>

              {documentos.length === 0 ? (
                <CanvasBox cor="#6ab0ff"><p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.semDocumentos}</p></CanvasBox>
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
                          {vencido && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(248,113,113,0.2)", color: "#f87171" }}>{tt.documentoVencido}</span>}
                        </div>
                        <p className="text-sm font-bold truncate" style={{ color: "#c8d8f0" }}>{d.nome}</p>
                        <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{tipo.label}</p>
                        {d.data_validade && <p className="text-[10px] mt-1" style={{ color: vencido ? "#f87171" : "#fbbf24" }}>{tt.validoAte}: {formatData(d.data_validade, lang)}</p>}
                        <div className="flex gap-1 mt-2">
                          {d.storage_path && (
                            <button onClick={() => baixarDocumento(d)}
                              className="flex-1 px-2 py-1 rounded text-xs" style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff" }}>{tt.baixar}</button>
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

          {/* ABA AUDITORIA */}
          {aba === "auditoria" && (
            <div className="space-y-2">
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.historico} ({auditoria.length})</p>
                <p className="text-xs" style={{ color: "#c8d8f0" }}>{tt.auditoriaInfo}</p>
              </CanvasBox>
              {auditoria.length === 0 ? (
                <CanvasBox cor="#6ab0ff"><p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.semAuditoria}</p></CanvasBox>
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
                          <p className="text-sm" style={{ color: "#c8d8f0" }}>{a.descricao || `${a.acao} → ${a.tabela}`}</p>
                          {a.empresa_nome && <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{tt.auditEmpresa}: <strong>{a.empresa_nome}</strong></p>}
                          {(a.autor_nome || a.autor_email) && (
                            <p className="text-[11px]" style={{ color: "#5a7a9a" }}>
                              {tt.auditPor}: <strong>{a.autor_nome || a.autor_email}</strong>{a.autor_nome && a.autor_email ? ` (${a.autor_email})` : ""}
                            </p>
                          )}
                          {a.campo && <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{tt.campo}: <strong>{a.campo}</strong></p>}
                          {a.campo && (a.valor_antes !== undefined || a.valor_depois !== undefined) && (
                            a.valor_antes?.redigido || a.valor_depois?.redigido ? (
                              <p className="text-[11px] italic" style={{ color: "#5a7a9a" }}>{tt.auditValorRedigido}</p>
                            ) : (
                              <p className="text-[11px]" style={{ color: "#5a7a9a" }}>
                                {tt.auditDe}: <strong>{String(a.valor_antes?.[a.campo] ?? "—")}</strong> → {tt.auditPara}: <strong>{String(a.valor_depois?.[a.campo] ?? "—")}</strong>
                              </p>
                            )
                          )}
                          <p className="text-[10px] mt-0.5" style={{ color: "#5a7a9a" }}>{formatDataHora(a.created_at, lang)}</p>
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

      {/* MODAL LIMPAR CAMPOS */}
      {modalLimparAberto && (
        <ModalGenerico titulo={tt.limparCamposModalTitulo} fechar={() => setModalLimparAberto(false)}>
          <p className="text-sm mb-3" style={{ color: "#c8d8f0" }}>{tt.limparCamposModalTexto}</p>
          <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.limparCamposModalNaoAfeta}</p>
          <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ color: "#fbbf24", background: "rgba(251,191,36,0.1)" }}>
            {tt.limparCamposModalAviso}
          </p>
          <div className="flex flex-col sm:flex-row-reverse gap-2">
            <button onClick={() => setModalLimparAberto(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {tt.cancelar}
            </button>
            <button onClick={limparCampos}
              className="sm:w-auto w-full px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(90,122,154,0.35)", color: "#5a7a9a" }}>
              {tt.limparCamposConfirmar}
            </button>
          </div>
        </ModalGenerico>
      )}

      {/* MODAL CNPJ */}
      {resultadoCNPJ && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setResultadoCNPJ(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(167,139,250,0.4)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "#a78bfa" }}>{tt.cnpjResultadoTitulo}</p>
              <button onClick={() => setResultadoCNPJ(null)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            <div className="rounded-lg p-3 space-y-1 mb-3" style={{ background: "rgba(2,8,16,0.6)" }}>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjRazao}:</span> <strong style={{ color: "#c8d8f0" }}>{resultadoCNPJ.razao_social}</strong></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjFantasia}:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.nome_fantasia || "—"}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjSituacao}:</span> <span style={{ color: resultadoCNPJ.situacao_cadastral === "ativa" ? "#34d399" : "#fbbf24" }}>{resultadoCNPJ.situacao_cadastral}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjPorte}:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.porte}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjCnae}:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.cnae_principal} - {resultadoCNPJ.cnae_descricao}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjCidadeUf}:</span> <span style={{ color: "#c8d8f0" }}>{resultadoCNPJ.cidade}/{resultadoCNPJ.uf}</span></p>
              <p className="text-xs"><span style={{ color: "#5a7a9a" }}>{tt.cnpjSociosEncontrados}:</span> <strong style={{ color: "#a78bfa" }}>{resultadoCNPJ.socios?.length || 0}</strong></p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResultadoCNPJ(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.cancelar}</button>
              <button onClick={aplicarDadosCNPJ} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>{tt.cnpjAplicar}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SCORE DETALHE */}
      {modalScoreDetalhe && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setModalScoreDetalhe(null)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: `1px solid ${(modalScoreDetalhe === "health" ? healthScore : complianceScore).cor}40` }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>
                {modalScoreDetalhe === "health" ? tt.healthScore : tt.complianceScore}
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

      {/* MODAL SHARE */}
      {shareModalAberto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }} onClick={() => setShareModalAberto(false)}>
          <div className="w-full max-w-lg rounded-2xl p-5" onClick={(e) => e.stopPropagation()}
            style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(106,176,255,0.3)", boxShadow: "0 0 60px rgba(106,176,255,0.15)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.centroCompart}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#c8d8f0" }}>{empresa?.nome_fantasia || empresa?.razao_social || empresa?.nome}</p>
              </div>
              <button onClick={() => setShareModalAberto(false)} className="text-xl" style={{ color: "#5a7a9a" }}>✕</button>
            </div>
            {empresa && (
              <div className="rounded-xl p-3 mb-4 text-xs space-y-1" style={{ background: "rgba(2,8,16,0.6)", border: "1px solid rgba(106,176,255,0.15)" }}>
                <p style={{ color: "#c8d8f0" }}>📄 <strong style={{ color: "#6ab0ff" }}>{empresa.cnpj || tt.semCnpj}</strong></p>
                <p style={{ color: "#c8d8f0" }}>
                  📊 Health: <strong style={{ color: healthScore.cor }}>{healthScore.score}/100</strong> • 🛡️ Compliance: <strong style={{ color: complianceScore.cor }}>{complianceScore.score}/100</strong>
                </p>
              </div>
            )}
            <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.compartilharVia}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.35)", color: "#25d366" }}>
                <span className="text-xl">📱</span>WhatsApp
              </button>
              <button onClick={shareTelegram} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(34,158,217,0.12)", border: "1px solid rgba(34,158,217,0.35)", color: "#229ed9" }}>
                <span className="text-xl">✈️</span>Telegram
              </button>
              <button onClick={shareGmail} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(234,67,53,0.12)", border: "1px solid rgba(234,67,53,0.35)", color: "#ea4335" }}>
                <span className="text-xl">📨</span>Gmail
              </button>
              <button onClick={shareOutlook} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(0,120,212,0.12)", border: "1px solid rgba(0,120,212,0.35)", color: "#0078d4" }}>
                <span className="text-xl">📩</span>Outlook
              </button>
              <button onClick={shareCopiarTexto} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90"
                style={{ background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.35)", color: "#a78bfa" }}>
                <span className="text-xl">📋</span>{tt.copiar}
              </button>
              <button onClick={exportarPDF} disabled={exportando} className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#dc2626" }}>
                <span className="text-xl">{exportando ? "⏳" : "📄"}</span>
                {exportando ? tt.gerando : tt.pdfCartao}
              </button>
            </div>
            <button onClick={() => setShareModalAberto(false)} className="w-full py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.fechar}</button>
          </div>
        </div>
      )}

      {/* MODAIS FORMULÁRIO */}
      {modalSocio && (
        <ModalGenerico titulo={modalSocio === "novo" ? tt.novoSocioTitulo : tt.editarSocioTitulo} fechar={() => setModalSocio(null)}>
          <FormSocio inicial={modalSocio === "novo" ? {} : modalSocio} onSalvar={salvarSocio} cancelar={() => setModalSocio(null)} tt={tt} qualificacoes={qualificacoesSocios} />
        </ModalGenerico>
      )}
      {modalDocumento && (
        <ModalGenerico titulo={tt.novoDocumentoTitulo} fechar={() => setModalDocumento(null)}>
          <FormDocumento onSalvar={salvarDocumento} cancelar={() => setModalDocumento(null)} tt={tt} />
        </ModalGenerico>
      )}
      {modalObrigacao && (
        <ModalGenerico titulo={modalObrigacao === "novo" ? tt.novaObrigacaoTitulo : tt.editarObrigacaoTitulo} fechar={() => setModalObrigacao(null)}>
          <FormObrigacao inicial={modalObrigacao === "novo" ? {} : modalObrigacao} onSalvar={salvarObrigacao} cancelar={() => setModalObrigacao(null)} tt={tt} />
        </ModalGenerico>
      )}
    </ModuloLayout>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function FieldLabel({ label, children, sugerido, sugeridoTexto, erro }: {
  label: string; children: any; sugerido?: boolean; sugeridoTexto?: string; erro?: string;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider flex items-center gap-1.5 flex-wrap" style={{ color: "#5a7a9a" }}>
        {label}
        {sugerido && (
          <span className="text-[9px] normal-case font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
            ✨ {sugeridoTexto}
          </span>
        )}
      </label>
      {children}
      {erro && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{erro}</p>}
    </div>
  );
}

function ModalGenerico({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: any }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
      style={{ background: "rgba(2,8,16,0.85)", backdropFilter: "blur(4px)" }} onClick={fechar}>
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

function FormSocio({ inicial, onSalvar, cancelar, tt, qualificacoes }: any) {
  const [form, setForm] = useState<any>(inicial || {});
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder={tt.nomeCompleto} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.cpf_cnpj || ""} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })}
        placeholder={tt.cpfCnpj} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <select value={form.tipo_pessoa || "PF"} onChange={(e) => setForm({ ...form, tipo_pessoa: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="PF" style={{ background: "#020810" }}>{tt.pessoaFisica}</option>
          <option value="PJ" style={{ background: "#020810" }}>{tt.pessoaJuridica}</option>
        </select>
        <select value={form.qualificacao || ""} onChange={(e) => setForm({ ...form, qualificacao: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="" style={{ background: "#020810" }}>{tt.qualificacao}</option>
          {qualificacoes.map((q: string) => <option key={q} value={q} style={{ background: "#020810" }}>{q}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="0.01" value={form.participacao_pct || ""} onChange={(e) => setForm({ ...form, participacao_pct: parseFloat(e.target.value) || 0 })}
          placeholder={tt.participacaoPct} className="px-3 py-2 rounded-lg text-sm" style={inp} />
        <input type="date" value={form.data_entrada || ""} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp} />
      </div>
      <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder={tt.email} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.telefone || ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })}
        placeholder={tt.telefone} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.cancelar}</button>
        <button onClick={() => onSalvar(form)} disabled={!form.nome}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>{tt.salvar}</button>
      </div>
    </div>
  );
}

function FormDocumento({ onSalvar, cancelar, tt }: any) {
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
        placeholder={tt.nomeDocumento} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.numero_documento || ""} onChange={(e) => setForm({ ...form, numero_documento: e.target.value })}
        placeholder={tt.numeroDocumento} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{tt.emissao}</label>
          <input type="date" value={form.data_emissao || ""} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{tt.validade}</label>
          <input type="date" value={form.data_validade || ""} onChange={(e) => setForm({ ...form, data_validade: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
      </div>
      <input value={form.orgao_emissor || ""} onChange={(e) => setForm({ ...form, orgao_emissor: e.target.value })}
        placeholder={tt.orgaoEmissor} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.cancelar}</button>
        <button onClick={() => onSalvar(form, file)} disabled={!form.nome}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #b45309, #d97706)", color: "#fff" }}>{tt.salvar}</button>
      </div>
    </div>
  );
}

function FormObrigacao({ inicial, onSalvar, cancelar, tt }: any) {
  const [form, setForm] = useState<any>(inicial || { status: "pendente", recorrencia: "mensal" });
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input value={form.tipo || ""} onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        placeholder={tt.tipoObrigacao} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder={tt.nomeObrigacao} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        placeholder={tt.descricao} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{tt.vencimento}</label>
          <input type="date" value={form.data_vencimento || ""} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
        <div>
          <label className="text-[10px] uppercase" style={{ color: "#5a7a9a" }}>{tt.valorEstimado}</label>
          <input type="number" step="0.01" value={form.valor_estimado || ""} onChange={(e) => setForm({ ...form, valor_estimado: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.status || "pendente"} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="pendente" style={{ background: "#020810" }}>{tt.statusPendente}</option>
          <option value="paga" style={{ background: "#020810" }}>{tt.statusPaga}</option>
          <option value="atrasada" style={{ background: "#020810" }}>{tt.statusAtrasada}</option>
          <option value="dispensada" style={{ background: "#020810" }}>{tt.statusDispensada}</option>
        </select>
        <select value={form.recorrencia || "mensal"} onChange={(e) => setForm({ ...form, recorrencia: e.target.value })}
          className="px-3 py-2 rounded-lg text-sm" style={inp}>
          <option value="mensal" style={{ background: "#020810" }}>{tt.recorrenciaMensal}</option>
          <option value="trimestral" style={{ background: "#020810" }}>{tt.recorrenciaTrimestral}</option>
          <option value="anual" style={{ background: "#020810" }}>{tt.recorrenciaAnual}</option>
          <option value="unica" style={{ background: "#020810" }}>{tt.recorrenciaUnica}</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.cancelar}</button>
        <button onClick={() => onSalvar(form)} disabled={!form.tipo || !form.nome || !form.data_vencimento}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>{tt.salvar}</button>
      </div>
    </div>
  );
}