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
  carregarEquipe, convidarMembro, excluirMembro,
  calcularHealthScore, calcularComplianceScore,
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
    // Equipe
    equipeInterna: "🧑‍💻 Equipe Interna",
    convidarMembro: "+ Convidar Membro",
    semMembros: "Nenhum membro convidado.",
    convidarMembroTitulo: "Convidar Membro",
    emailConvidado: "E-mail do convidado *",
    cargo: "Cargo",
    papelAdmin: "👑 Admin (acesso total)",
    papelFinanceiro: "💰 Financeiro",
    papelContabil: "📊 Contábil",
    papelLeitor: "👁️ Leitor (somente visualização)",
    aceito: "✅ Aceito",
    pendente: "⏳ Pendente",
    convidar: "✓ Convidar",
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
    toastEnderecoPreenchido: "Endereço preenchido!",
    toastDadosAplicados: "Dados aplicados! Clique em Salvar.",
    toastSociosImportados: (n: number) => `${n} sócio(s) importado(s)`,
    toastConfirmImportarSocios: (n: number) => `Encontramos ${n} sócio(s) na Receita. Importar para o sistema?`,
    toastDadosSalvos: "Dados salvos!",
    toastErroCarregar: "Erro ao carregar",
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
    toastConviteRegistrado: "Convite registrado",
    toastConfirmRemoverMembro: (email: string) => `Remover ${email}?`,
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
    equipeInterna: "🧑‍💻 Internal Team",
    convidarMembro: "+ Invite Member",
    semMembros: "No members invited yet.",
    convidarMembroTitulo: "Invite Member",
    emailConvidado: "Invitee e-mail *",
    cargo: "Position",
    papelAdmin: "👑 Admin (full access)",
    papelFinanceiro: "💰 Financial",
    papelContabil: "📊 Accounting",
    papelLeitor: "👁️ Reader (view only)",
    aceito: "✅ Accepted",
    pendente: "⏳ Pending",
    convidar: "✓ Invite",
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
    toastEnderecoPreenchido: "Address filled!",
    toastDadosAplicados: "Data applied! Click Save.",
    toastSociosImportados: (n: number) => `${n} partner(s) imported`,
    toastConfirmImportarSocios: (n: number) => `Found ${n} partner(s). Import into system?`,
    toastDadosSalvos: "Data saved!",
    toastErroCarregar: "Loading error",
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
    toastConviteRegistrado: "Invitation registered",
    toastConfirmRemoverMembro: (email: string) => `Remove ${email}?`,
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
    equipeInterna: "🧑‍💻 Equipo Interno",
    convidarMembro: "+ Invitar Miembro",
    semMembros: "Ningún miembro invitado.",
    convidarMembroTitulo: "Invitar Miembro",
    emailConvidado: "Correo del invitado *",
    cargo: "Cargo",
    papelAdmin: "👑 Admin (acceso total)",
    papelFinanceiro: "💰 Financiero",
    papelContabil: "📊 Contable",
    papelLeitor: "👁️ Lector (solo visualización)",
    aceito: "✅ Aceptado",
    pendente: "⏳ Pendiente",
    convidar: "✓ Invitar",
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
    toastEnderecoPreenchido: "¡Dirección rellenada!",
    toastDadosAplicados: "¡Datos aplicados! Haga clic en Guardar.",
    toastSociosImportados: (n: number) => `${n} socio(s) importado(s)`,
    toastConfirmImportarSocios: (n: number) => `Encontramos ${n} socio(s). ¿Importar al sistema?`,
    toastDadosSalvos: "¡Datos guardados!",
    toastErroCarregar: "Error al cargar",
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
    toastConviteRegistrado: "Invitación registrada",
    toastConfirmRemoverMembro: (email: string) => `¿Eliminar ${email}?`,
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
  const [equipe, setEquipe] = useState<any[]>([]);
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

  // Modais
  const [modalSocio, setModalSocio] = useState<any>(null);
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

  // Qualificações de sócio traduzidas
  const qualificacoesSocios = [
    tt.qualSocio, tt.qualSocioAdm, tt.qualAdministrador, tt.qualDiretor, tt.qualProcurador, tt.qualOutros,
  ];

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
      // obterEmpresaAtiva() já garante a criação (dono/convidado/"Minha Empresa" automática) —
      // não repetir a criação aqui evita duas empresas por corrida (ver SQL-EMPRESA-PADRAO.sql).
      const empresaAtivaId = await obterEmpresaAtiva();
      const emp = empresaAtivaId ? await carregarEmpresaPorId(empresaAtivaId) : null;
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
      showToast(err.message || tt.toastErroCarregar, "erro");
    }
    setCarregando(false);
  }

  // CNPJ
  async function preencherPorCNPJ() {
    const cnpj = limparCNPJ(empresaForm.cnpj || "");
    if (!cnpj) { showToast(tt.toastDigiteCnpj, "erro"); return; }
    if (!validarCNPJ(cnpj)) { showToast(tt.toastCnpjInvalido, "erro"); return; }
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
    showToast(tt.toastDadosAplicados, "ok");
    if (d.socios && d.socios.length > 0 && empresa) {
      if (window.confirm(tt.toastConfirmImportarSocios(d.socios.length))) {
        importarSociosDoQSA(empresa.id, userId!, d.socios).then((qtd) => {
          showToast(tt.toastSociosImportados(qtd), "ok");
          carregarTudo(userId!);
        });
      }
    }
    setResultadoCNPJ(null);
  }

  async function preencherPorCEP(cepDigitado?: string) {
    const cep = (cepDigitado ?? empresaForm.cep ?? "").replace(/\D/g, "");
    if (cep.length !== 8) { showToast(tt.toastCepInvalido, "erro"); return; }
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
    showToast(tt.toastEnderecoPreenchido, "ok");
  }

  async function salvarEmpresa() {
    if (!empresa || !userId) return;
    setSalvando(true);
    const r = await atualizarEmpresa(empresa.id, userId, empresa, empresaForm);
    if (r.erro) showToast(r.erro, "erro");
    else { showToast(tt.toastDadosSalvos, "ok"); await carregarTudo(userId); }
    setSalvando(false);
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
    await carregarTudo(userId);
  }

  async function removerSocio(socio: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverSocio(socio.nome))) return;
    const r = await excluirSocio(socio.id, empresa.id, userId, socio.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastSocioRemovido, "ok");
    await carregarTudo(userId);
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
    await carregarTudo(userId);
  }

  async function removerDocumento(doc: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverDoc(doc.nome))) return;
    const r = await excluirDocumento(doc.id, empresa.id, userId, doc.storage_path, doc.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastDocRemovido, "ok");
    await carregarTudo(userId);
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
    showToast(tt.toastObrigSalva, "ok");
    await carregarTudo(userId);
  }

  async function marcarObrigacaoPaga(obr: any) {
    if (!empresa || !userId) return;
    const r = await atualizarObrigacao(obr.id, empresa.id, userId, { status: "paga", valor_pago: obr.valor_estimado });
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastMarcadaPaga, "ok");
    await carregarTudo(userId);
  }

  async function removerObrigacao(obr: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverObrig(obr.nome))) return;
    const r = await excluirObrigacao(obr.id, empresa.id, userId, obr.nome);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    await carregarTudo(userId);
  }

  // Equipe
  async function salvarMembro(dados: any) {
    if (!empresa || !userId) return;
    const r = await convidarMembro(empresa.id, userId, dados);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    showToast(tt.toastConviteRegistrado, "ok");
    setModalMembro(null);
    await carregarTudo(userId);
  }

  async function removerMembro(m: any) {
    if (!empresa || !userId) return;
    if (!window.confirm(tt.toastConfirmRemoverMembro(m.email_convidado))) return;
    const r = await excluirMembro(m.id, empresa.id, userId, m.email_convidado);
    if (r.erro) { showToast(r.erro, "erro"); return; }
    await carregarTudo(userId);
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
              { key: "socios", label: `${tt.abaSocios} (${socios.length + equipe.length})` },
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
              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#5a7a9a" }}>{tt.autoCnpjTitulo}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input value={empresaForm.cnpj || ""} onChange={(e) => setCampo("cnpj", formatarCNPJ(e.target.value))}
                    placeholder="00.000.000/0000-00" className="flex-1 px-3 py-2.5 rounded-lg text-sm" style={inputStyle} />
                  <button onClick={preencherPorCNPJ} disabled={consultandoCNPJ}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
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
                    <FieldLabel label={tt.razaoSocial}>
                      <input value={empresaForm.razao_social || ""} onChange={(e) => setCampo("razao_social", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    </FieldLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FieldLabel label={tt.nomeFantasia}>
                        <input value={empresaForm.nome_fantasia || ""} onChange={(e) => setCampo("nome_fantasia", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.inscricaoEstadual}>
                        <input value={empresaForm.inscricao_estadual || ""} onChange={(e) => setCampo("inscricao_estadual", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.inscricaoMunicipal}>
                        <input value={empresaForm.inscricao_municipal || ""} onChange={(e) => setCampo("inscricao_municipal", e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                      </FieldLabel>
                      <FieldLabel label={tt.porte}>
                        <select value={empresaForm.porte || ""} onChange={(e) => setCampo("porte", e.target.value)}
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
                  <FieldLabel label={tt.regimeTributario}>
                    <select value={empresaForm.regime_tributario || ""} onChange={(e) => setCampo("regime_tributario", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle}>
                      <option value="" style={{ background: "#020810" }}>—</option>
                      {REGIMES_TRIBUTARIOS.map((r) => <option key={r.key} value={r.key} style={{ background: "#020810" }}>{r.label}</option>)}
                    </select>
                  </FieldLabel>
                  <FieldLabel label={tt.cnaePrincipal}>
                    <input value={empresaForm.cnae_principal || ""} onChange={(e) => setCampo("cnae_principal", e.target.value)}
                      placeholder="6201-5/01" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <div className="md:col-span-2">
                    <FieldLabel label={tt.cnaeDescricao}>
                      <input value={empresaForm.cnae_descricao || ""} onChange={(e) => setCampo("cnae_descricao", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    </FieldLabel>
                  </div>
                  <FieldLabel label={tt.naturezaJuridica}>
                    <input value={empresaForm.natureza_juridica || ""} onChange={(e) => setCampo("natureza_juridica", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.capitalSocial}>
                    <input type="number" step="0.01" value={empresaForm.capital_social || ""} onChange={(e) => setCampo("capital_social", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.dataAbertura}>
                    <input type="date" value={empresaForm.data_abertura || ""} onChange={(e) => setCampo("data_abertura", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.situacaoCadastral}>
                    <select value={empresaForm.situacao_cadastral || ""} onChange={(e) => setCampo("situacao_cadastral", e.target.value)}
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
                  <div className="md:col-span-2 flex gap-2">
                    <input value={empresaForm.cep || ""} onChange={(e) => {
                        const v = formatarCEP(e.target.value);
                        setCampo("cep", v);
                        if (v.replace(/\D/g, "").length === 8) preencherPorCEP(v);
                      }}
                      placeholder="00000-000" className="flex-1 px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                    <button onClick={() => preencherPorCEP()} disabled={consultandoCEP}
                      className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>{consultandoCEP ? "..." : "🔍"}</button>
                  </div>
                  <div className="md:col-span-3"><input value={empresaForm.logradouro || ""} onChange={(e) => setCampo("logradouro", e.target.value)} placeholder={tt.logradouro} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-1"><input value={empresaForm.numero || ""} onChange={(e) => setCampo("numero", e.target.value)} placeholder={tt.numero} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.complemento || ""} onChange={(e) => setCampo("complemento", e.target.value)} placeholder={tt.complemento} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.bairro || ""} onChange={(e) => setCampo("bairro", e.target.value)} placeholder={tt.bairro} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-2"><input value={empresaForm.cidade || ""} onChange={(e) => setCampo("cidade", e.target.value)} placeholder={tt.cidade} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></div>
                  <div className="md:col-span-1"><input value={empresaForm.uf || ""} onChange={(e) => setCampo("uf", e.target.value.toUpperCase().slice(0, 2))} placeholder={tt.uf} maxLength={2} className="w-full px-3 py-2 rounded-lg text-sm uppercase" style={inputStyle} /></div>
                </div>
              </CanvasBox>

              <CanvasBox cor="#6ab0ff">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.contato}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FieldLabel label={tt.telefonePrincipal}>
                    <input value={empresaForm.telefone_principal || ""} onChange={(e) => setCampo("telefone_principal", formatarTelefone(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.telefoneSecundario}>
                    <input value={empresaForm.telefone_secundario || ""} onChange={(e) => setCampo("telefone_secundario", formatarTelefone(e.target.value))} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailPrincipal}>
                    <input type="email" value={empresaForm.email_principal || ""} onChange={(e) => setCampo("email_principal", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailFinanceiro}>
                    <input type="email" value={empresaForm.email_financeiro || ""} onChange={(e) => setCampo("email_financeiro", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.emailContabil}>
                    <input type="email" value={empresaForm.email_contabil || ""} onChange={(e) => setCampo("email_contabil", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                  <FieldLabel label={tt.website}>
                    <input value={empresaForm.website || ""} onChange={(e) => setCampo("website", e.target.value)} placeholder="https://" className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} />
                  </FieldLabel>
                </div>
              </CanvasBox>

              <CanvasBox cor="#a78bfa">
                <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: "#5a7a9a" }}>{tt.bancario}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <FieldLabel label={tt.banco}><input value={empresaForm.banco_principal || ""} onChange={(e) => setCampo("banco_principal", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.agencia}><input value={empresaForm.agencia || ""} onChange={(e) => setCampo("agencia", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.conta}><input value={empresaForm.conta || ""} onChange={(e) => setCampo("conta", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
                  <FieldLabel label={tt.chavePix}><input value={empresaForm.chave_pix || ""} onChange={(e) => setCampo("chave_pix", e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={inputStyle} /></FieldLabel>
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

              <button onClick={salvarEmpresa} disabled={salvando}
                className="w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #047857, #10b981)", color: "#fff" }}>
                {salvando ? tt.salvando : tt.salvarEmpresa}
              </button>
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

              <CanvasBox cor="#a78bfa">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{tt.equipeInterna} ({equipe.length})</p>
                  <button onClick={() => setModalMembro("novo")}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>{tt.convidarMembro}</button>
                </div>
                {equipe.length === 0 ? (
                  <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.semMembros}</p>
                ) : (
                  <div className="space-y-2">
                    {equipe.map((m: any) => (
                      <div key={m.id} className="rounded-lg p-3 flex items-center justify-between gap-2 flex-wrap"
                        style={{ background: "rgba(2,8,16,0.5)", border: "1px solid rgba(167,139,250,0.15)" }}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold" style={{ color: "#c8d8f0" }}>{m.nome || m.email_convidado}</p>
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>
                            {m.cargo || "—"} • {m.papel} • {m.convite_aceito ? tt.aceito : tt.pendente}
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
                          {a.campo && <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{tt.campo}: <strong>{a.campo}</strong></p>}
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
      {modalMembro && (
        <ModalGenerico titulo={tt.convidarMembroTitulo} fechar={() => setModalMembro(null)}>
          <FormMembro onSalvar={salvarMembro} cancelar={() => setModalMembro(null)} tt={tt} />
        </ModalGenerico>
      )}
    </ModuloLayout>
  );
}

// =============================================================================
// COMPONENTES AUXILIARES
// =============================================================================

function FieldLabel({ label, children }: { label: string; children: any }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{label}</label>
      {children}
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

function FormMembro({ onSalvar, cancelar, tt }: any) {
  const [form, setForm] = useState<any>({ papel: "leitor" });
  const inp = { background: "rgba(2,8,16,0.7)", border: "1px solid rgba(106,176,255,0.2)", color: "#c8d8f0" };
  return (
    <div className="space-y-3">
      <input type="email" value={form.email_convidado || ""} onChange={(e) => setForm({ ...form, email_convidado: e.target.value })}
        placeholder={tt.emailConvidado} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.nome || ""} onChange={(e) => setForm({ ...form, nome: e.target.value })}
        placeholder={tt.nome} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <input value={form.cargo || ""} onChange={(e) => setForm({ ...form, cargo: e.target.value })}
        placeholder={tt.cargo} className="w-full px-3 py-2 rounded-lg text-sm" style={inp} />
      <select value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value })}
        className="w-full px-3 py-2 rounded-lg text-sm" style={inp}>
        <option value="admin" style={{ background: "#020810" }}>{tt.papelAdmin}</option>
        <option value="financeiro" style={{ background: "#020810" }}>{tt.papelFinanceiro}</option>
        <option value="contabil" style={{ background: "#020810" }}>{tt.papelContabil}</option>
        <option value="leitor" style={{ background: "#020810" }}>{tt.papelLeitor}</option>
      </select>
      <div className="flex gap-2">
        <button onClick={cancelar} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>{tt.cancelar}</button>
        <button onClick={() => onSalvar(form)} disabled={!form.email_convidado}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6d28d9, #a78bfa)", color: "#fff" }}>{tt.convidar}</button>
      </div>
    </div>
  );
}