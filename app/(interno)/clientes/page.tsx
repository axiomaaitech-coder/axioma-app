"use client";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  Pencil, Trash2, X, Phone, Mail, MapPin, FileText, ChevronRight, ChevronLeft,
  Award, Users, AlertTriangle, Clock, MessageCircle, Send, HeartPulse, Layers,
  Share2, Briefcase, Globe, ShoppingBag, ClipboardList, Radar as IconRadar,
  Check, Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { CORES, FONTE_EXEC, optDispersao, optBarrasV } from "../../../lib/cfoCore";
import { cfoT, canaisCompartilhamento } from "../../../lib/cfoTextos";
import { buscarEstados, buscarMunicipios, type EstadoIBGE, type MunicipioIBGE } from "../../../lib/ibgeApi";
import {
  montarSnapshotsCarteira, calcularIVCA, calcularSaudeCliente, detectarSinaisCliente,
  montarConselhoExecutivo, montarNarrativaIVCA, nomeSubscoreIVCA, nomeTipoSinal,
  montarNarrativaSinal, montarTimelineCliente, enviarPerguntaZIA, ordenarSinaisPorSeveridade,
  montarRadarCarteira, calcularKpisCarteiraExecutivo, receitaPorSegmento, receitaPorCidade,
  receitaPorEstado, sugestaoAcaoCobranca, montarParecerExecutivo, resumoComprasCliente,
  nomeClassificacao, scoreRecebimento, probabilidadeInadimplenciaConta, previsaoFaturamentoCliente,
  healthScoreCarteira, riscoCarteiraAgregado, classificarTendencia, serieRecebimentosFutura,
  type ClienteRow, type ContaRow, type InadimplenciaRow, type Idioma3, type TipoSinalCliente,
} from "../../../lib/clienteIntelHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NIVEL_COR: Record<string, string> = { critico: CORES.vermelho, atencao: CORES.amarelo, bom: CORES.verde, excelente: CORES.verde };
const SEVERIDADE_COR: Record<string, string> = { risco: CORES.vermelho, atencao: CORES.amarelo, positivo: CORES.verde };
const SINAL_ICONE: Record<TipoSinalCliente, string> = { premium: "🏆", prontoParaUpsell: "📈", emRisco: "⚠️", negligenciado: "🕳️", geraCaixaRecorrente: "💧", concentracaoAlta: "🎯" };

// Campos de formulário fora do componente — evita remount do input a cada tecla
// (se ficassem definidos dentro de ClientesPage, mudariam de identidade a cada render).
const inputCls = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };
const selectStyle = { background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };
const labelCls = "text-xs font-semibold mb-1 block";
const labelStyle = { color: "#5a8fd4" };

function Campo({ label, value, onChange, tipo = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; tipo?: string; placeholder?: string }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <input type={tipo} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={inputCls} style={inputStyle} />
    </div>
  );
}

function CampoSelect({ label, value, onChange, opcoes, placeholder }: { label: string; value: string; onChange: (v: string) => void; opcoes: { value: string; label: string }[]; placeholder?: string }) {
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

function CampoTextarea({ label, value, onChange, placeholder, linhas = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; linhas?: number }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={linhas}
        className={`${inputCls} resize-none`} style={inputStyle} />
    </div>
  );
}

function CampoCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded" />
      <span className="text-xs font-semibold" style={labelStyle}>{label}</span>
    </label>
  );
}

type FormCliente = {
  nome: string; email: string; telefone: string; documento: string; status: string;
  razaoSocial: string; nomeFantasia: string; inscricaoEstadual: string; whatsapp: string; site: string;
  responsavel: string; cargo: string; segmento: string; porte: string; regimeTributario: string;
  numFuncionarios: string; faturamentoEstimado: string; origem: string; responsavelComercial: string;
  condicaoPagamento: string; prazoMedio: string; limiteCredito: string; classificacao: string;
  estado: string; cidade: string; dataPrimeiraCompra: string; observacoes: string; documentosLinks: string;
};
const FORM_VAZIO: FormCliente = {
  nome: "", email: "", telefone: "", documento: "", status: "ativo",
  razaoSocial: "", nomeFantasia: "", inscricaoEstadual: "", whatsapp: "", site: "",
  responsavel: "", cargo: "", segmento: "", porte: "", regimeTributario: "",
  numFuncionarios: "", faturamentoEstimado: "", origem: "", responsavelComercial: "",
  condicaoPagamento: "", prazoMedio: "", limiteCredito: "", classificacao: "cliente",
  estado: "", cidade: "", dataPrimeiraCompra: "", observacoes: "", documentosLinks: "",
};

type FormConta = {
  descricao: string; valor: string; vencimento: string; emissao: string; clienteId: string;
  numeroDocumento: string; categoria: string; formaRecebimento: string; parcelas: string;
  taxaJuros: string; taxaMulta: string; valorDesconto: string; observacoes: string;
  contratoRef: string; centroCustoId: string; contaContabil: string; bancoRecebedor: string;
  competencia: string; recorrente: boolean; frequenciaRecorrencia: string; anexoUrl: string;
};
const FORM_CONTA_VAZIO: FormConta = {
  descricao: "", valor: "", vencimento: "", emissao: "", clienteId: "",
  numeroDocumento: "", categoria: "", formaRecebimento: "", parcelas: "",
  taxaJuros: "", taxaMulta: "", valorDesconto: "", observacoes: "",
  contratoRef: "", centroCustoId: "", contaContabil: "", bancoRecebedor: "",
  competencia: "", recorrente: false, frequenciaRecorrencia: "", anexoUrl: "",
};

const ETAPAS_CADASTRO = ["identificacao", "contato", "endereco", "fiscal", "financeiro", "comercial", "cobrancas", "riscos", "documentos", "ia", "observacoes"] as const;
type EtapaCadastro = typeof ETAPAS_CADASTRO[number];

const T = {
  pt: {
    abaCarteira: "📊 Carteira", abaCliente: "🧬 Cliente", abaCobrancas: "💳 Cobranças",
    carteiraExecutiva: "Mapa Executivo da Carteira", carteiraSub: "Cada cliente como ativo financeiro — valor, risco e oportunidade em um só lugar.",
    valorCarteira: "Valor da Carteira", ticketMedioCarteira: "Ticket Médio", inadimplenciaCarteira: "Inadimplência da Carteira", concentracaoTop5: "Concentração Top 5",
    distribuicaoIvca: "Distribuição por IVCA", faixaCritico: "Crítico", faixaAtencao: "Atenção", faixaBom: "Saudável", faixaExcelente: "Premium",
    mapaValor: "Mapa de Valor dos Clientes", mapaValorSub: "IVCA (valor) × Segurança (100 = baixo risco). Tamanho do ponto = ticket médio. Clique numa bolha pra abrir o cliente.",
    mapaValorVazio: "Cadastre pelo menos 2 clientes com cobranças para habilitar o Mapa de Valor.",
    listaClientes: "Clientes ordenados por IVCA",
    selecioneCliente: "Selecione um cliente na Carteira para abrir o Digital Twin.",
    voltarCarteira: "Voltar à Carteira",
    tempoDeCasa: "Cliente há",
    meses: "meses",
    ivcaTitulo: "IVCA — Índice de Valor do Cliente Axioma", ivcaSub: "Score proprietário 0-1000, só com dado real: pontualidade, volume, recorrência, tendência e risco.",
    saudeTitulo: "Saúde do Cliente", saudePagamento: "Pagamento", saudeRelacionamento: "Relacionamento", saudeRecorrencia: "Recorrência", saudeComercial: "Comercial",
    radarTitulo: "Radar de Sinais", radarSub: "Oportunidades e riscos detectados automaticamente — sempre com o motivo.",
    radarVazio: "Nenhum sinal crítico detectado para este cliente.",
    conselhoTitulo: "Conselho Executivo do Cliente", conselhoSub: "Cada especialista lê o mesmo dado real sob sua ótica.",
    recomendacaoConsolidada: "Recomendação Consolidada da ZIA",
    ziaTitulo: "Pergunte à ZIA sobre este cliente", ziaSub: "Responde com o dado real deste cliente (modo regras — ativa IA real quando a chave estiver ligada).",
    ziaPlaceholder: "Ex: esse cliente merece desconto?", ziaPensando: "Analisando...",
    timelineTitulo: "Linha do Tempo Financeira", timelineVazio: "Nenhum evento registrado ainda.",
    dadosCadastrais: "Dados Cadastrais", contasDoCliente: "Cobranças deste cliente",
    verTodasCobrancas: "Ver Todas as Cobranças",
    // Compartilhamento
    compartilhar: "Compartilhar",
    // Cadastro executivo
    secIdentificacao: "Identificação", secContato: "Contato", secComercial: "Comercial", secEndereco: "Endereço Inteligente", secObs: "Observações",
    lblRazaoSocial: "Razão Social", lblNomeFantasia: "Nome Fantasia", lblInscricaoEstadual: "Inscrição Estadual",
    lblWhatsapp: "WhatsApp", lblSite: "Site", lblResponsavel: "Responsável", lblCargo: "Cargo",
    lblSegmento: "Segmento", lblPorte: "Porte da Empresa", lblRegimeTributario: "Regime Tributário",
    lblNumFuncionarios: "Nº de Funcionários", lblFaturamentoEstimado: "Faturamento Estimado (R$)",
    lblOrigem: "Origem do Cliente", lblResponsavelComercial: "Responsável Comercial",
    lblCondicaoPagamento: "Condição de Pagamento", lblPrazoMedio: "Prazo Médio (dias)", lblLimiteCredito: "Limite de Crédito (R$)",
    lblClassificacao: "Classificação", lblEstado: "Estado (UF)", lblCidade: "Cidade", lblDataPrimeiraCompra: "Data da Primeira Compra",
    lblObservacoes: "Observações", lblStatus: "Status",
    selecioneEstado: "-- Estado --", selecioneCidade: "-- Cidade --", selecioneEstadoPrimeiro: "Selecione o estado primeiro",
    digiteCidadeManual: "Cidade (digite — lista automática indisponível no momento)",
    portePorte: [{ value: "mei", label: "MEI" }, { value: "micro", label: "Micro" }, { value: "pequena", label: "Pequena" }, { value: "media", label: "Média" }, { value: "grande", label: "Grande" }],
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Lucro Presumido" }, { value: "real", label: "Lucro Real" }, { value: "mei", label: "MEI" }, { value: "isento", label: "Isento" }],
    classificacoes: [{ value: "lead", label: "Lead" }, { value: "cliente", label: "Cliente" }, { value: "parceiro", label: "Parceiro" }, { value: "estrategico", label: "Estratégico" }, { value: "premium", label: "Premium" }],
    // Dashboard executivo
    dashExecTitulo: "Dashboard Executivo da Carteira", dashExecSub: "Indicadores de gestão de clientes — só com dado real.",
    kpiAtivos: "Clientes Ativos", kpiNovosMes: "Novos no Mês", kpiInativos: "Clientes Inativos", kpiTempoRelac: "Tempo Médio de Relacionamento",
    kpiPremium: "Clientes Premium", kpiEstrategico: "Clientes Estratégicos", kpiEmRisco: "Clientes em Risco", kpiNegligenciado: "Negligenciados",
    // Radar executivo
    radarExecTitulo: "Radar Executivo", radarExecSub: "Toda a carteira agrupada por sinal — clique num grupo para filtrar a lista abaixo.",
    radarLimparFiltro: "Limpar filtro", radarFiltrando: "Filtrando por",
    nomeSinalPlural: { premium: "Premium", prontoParaUpsell: "Prontos p/ Upsell", emRisco: "Em Risco", negligenciado: "Negligenciados", geraCaixaRecorrente: "Caixa Recorrente", concentracaoAlta: "Concentração Alta" } as Record<TipoSinalCliente, string>,
    // Receita por grupo
    receitaSegmentoTitulo: "Receita por Segmento", receitaCidadeTitulo: "Receita por Cidade", receitaEstadoTitulo: "Receita por Estado",
    semDadoAgrupado: "Preencha segmento/cidade/estado no cadastro dos clientes para este painel ganhar detalhe.",
    // Top listas
    topIvcaTitulo: "Top 5 — IVCA", topValorTitulo: "Top 5 — Valor Cobrado", topCrescimentoTitulo: "Top 5 — Crescimento",
    // Compras
    comprasTitulo: "Resumo de Compras", ultimaCompra: "Última Compra", maiorCompra: "Maior Compra", primeiraCompra: "Primeira Compra", semRegistro: "—",
    // Parecer executivo
    parecerTitulo: "Parecer Executivo", parecerSub: "Resumo, pontos fortes/fracos, riscos e próximo passo — 100% regra sobre dado real, não gerado por IA generativa (ativa quando a chave for ligada).",
    parecerResumo: "Resumo Executivo", parecerFortes: "Pontos Fortes", parecerFracos: "Pontos Fracos", parecerRiscos: "Riscos", parecerOportunidades: "Oportunidades",
    parecerSugestao: "Sugestão", parecerProximoPasso: "Próximo Passo",
    // Cobranças detalhe
    verDetalhes: "Detalhes", ocultarDetalhes: "Ocultar", parcelasLbl: "Parcelas", jurosLbl: "Juros", multaLbl: "Multa",
    formaRecebLbl: "Forma de Recebimento", observacoesLbl: "Observações", sugestaoAcaoLbl: "Sugestão de Ação", semObservacoes: "Nenhuma observação.",
    // Wizard de cadastro
    etapaNomes: { identificacao: "Identificação", contato: "Contato", endereco: "Endereço", fiscal: "Fiscal", financeiro: "Financeiro", comercial: "Comercial", cobrancas: "Cobranças", riscos: "Riscos", documentos: "Documentos", ia: "Inteligência IA", observacoes: "Observações" } as Record<EtapaCadastro, string>,
    anterior: "Anterior", proximo: "Próximo", finalizarCadastro: "Salvar Cliente",
    secFiscal: "Fiscal", secFinanceiro: "Financeiro",
    paisLabel: "País", paisValor: "Brasil",
    semDadosNovoCliente: "Disponível depois de salvar o cliente e registrar o primeiro histórico.",
    riscoEtapaTitulo: "Risco calculado (somente leitura)", cobrancasEtapaTitulo: "Cobranças deste cliente (somente leitura)",
    iaEtapaTitulo: "Prévia do Parecer Executivo (somente leitura)",
    lblDocumentosLinks: "Links de Documentos", documentosLinksPlaceholder: "Um link por linha (ex: contrato no Google Drive)",
    // Cobrança Enterprise
    secBasico: "Básico", secDocumentacao: "Documentação", secPagamento: "Pagamento", secInteligenciaConta: "Inteligência", secAnexoObs: "Anexo & Observações",
    lblContrato: "Contrato Relacionado", lblNumeroCobranca: "Número da Cobrança", lblCategoria: "Categoria da Receita",
    lblCentroReceita: "Centro de Receita", lblContaContabil: "Conta Contábil", lblBancoRecebedor: "Banco Recebedor",
    lblEmissao: "Emissão", lblCompetencia: "Competência", lblDesconto: "Desconto (R$)", lblValorFinal: "Valor Final",
    lblRecorrente: "Cobrança Recorrente", lblFrequencia: "Frequência", lblAnexoUrl: "Link do Anexo",
    freqOpcoes: [{ value: "mensal", label: "Mensal" }, { value: "trimestral", label: "Trimestral" }, { value: "anual", label: "Anual" }],
    scoreRecebimentoLbl: "Score de Recebimento", probInadimplenciaLbl: "Probabilidade de Inadimplência", previsaoIaLbl: "Previsão (regra, não IA generativa)",
    selecioneClientePrevisao: "Selecione um cliente e vencimento para ver a previsão.",
  },
  en: {
    abaCarteira: "📊 Portfolio", abaCliente: "🧬 Client", abaCobrancas: "💳 Receivables",
    carteiraExecutiva: "Portfolio Executive Map", carteiraSub: "Every client as a financial asset — value, risk and opportunity in one place.",
    valorCarteira: "Portfolio Value", ticketMedioCarteira: "Avg. Ticket", inadimplenciaCarteira: "Portfolio Default", concentracaoTop5: "Top 5 Concentration",
    distribuicaoIvca: "IVCA Distribution", faixaCritico: "Critical", faixaAtencao: "Attention", faixaBom: "Healthy", faixaExcelente: "Premium",
    mapaValor: "Client Value Map", mapaValorSub: "IVCA (value) × Safety (100 = low risk). Dot size = avg. ticket. Click a bubble to open the client.",
    mapaValorVazio: "Register at least 2 clients with billing to enable the Value Map.",
    listaClientes: "Clients ranked by IVCA",
    selecioneCliente: "Select a client in the Portfolio to open the Digital Twin.",
    voltarCarteira: "Back to Portfolio",
    tempoDeCasa: "Client for",
    meses: "months",
    ivcaTitulo: "IVCA — Axioma Client Value Index", ivcaSub: "Proprietary 0-1000 score, real data only: punctuality, volume, recurrence, trend and risk.",
    saudeTitulo: "Client Health", saudePagamento: "Payment", saudeRelacionamento: "Relationship", saudeRecorrencia: "Recurrence", saudeComercial: "Commercial",
    radarTitulo: "Signal Radar", radarSub: "Opportunities and risks detected automatically — always with the reason.",
    radarVazio: "No critical signal detected for this client.",
    conselhoTitulo: "Client Executive Board", conselhoSub: "Each specialist reads the same real data from their angle.",
    recomendacaoConsolidada: "ZIA Consolidated Recommendation",
    ziaTitulo: "Ask ZIA about this client", ziaSub: "Answers using this client's real data (rules mode — upgrades to real AI once the key is active).",
    ziaPlaceholder: "E.g.: does this client deserve a discount?", ziaPensando: "Thinking...",
    timelineTitulo: "Financial Timeline", timelineVazio: "No event recorded yet.",
    dadosCadastrais: "Registration Data", contasDoCliente: "This client's billings",
    verTodasCobrancas: "View All Receivables",
    compartilhar: "Share",
    secIdentificacao: "Identification", secContato: "Contact", secComercial: "Commercial", secEndereco: "Smart Address", secObs: "Notes",
    lblRazaoSocial: "Legal Name", lblNomeFantasia: "Trade Name", lblInscricaoEstadual: "State Registration",
    lblWhatsapp: "WhatsApp", lblSite: "Website", lblResponsavel: "Contact Person", lblCargo: "Role",
    lblSegmento: "Segment", lblPorte: "Company Size", lblRegimeTributario: "Tax Regime",
    lblNumFuncionarios: "Employees", lblFaturamentoEstimado: "Estimated Revenue (R$)",
    lblOrigem: "Client Origin", lblResponsavelComercial: "Account Owner",
    lblCondicaoPagamento: "Payment Terms", lblPrazoMedio: "Avg. Term (days)", lblLimiteCredito: "Credit Limit (R$)",
    lblClassificacao: "Classification", lblEstado: "State", lblCidade: "City", lblDataPrimeiraCompra: "First Purchase Date",
    lblObservacoes: "Notes", lblStatus: "Status",
    selecioneEstado: "-- State --", selecioneCidade: "-- City --", selecioneEstadoPrimeiro: "Select the state first",
    digiteCidadeManual: "City (type — automatic list unavailable right now)",
    portePorte: [{ value: "mei", label: "Sole Proprietor" }, { value: "micro", label: "Micro" }, { value: "pequena", label: "Small" }, { value: "media", label: "Medium" }, { value: "grande", label: "Large" }],
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Presumed Profit" }, { value: "real", label: "Real Profit" }, { value: "mei", label: "Sole Proprietor" }, { value: "isento", label: "Exempt" }],
    classificacoes: [{ value: "lead", label: "Lead" }, { value: "cliente", label: "Customer" }, { value: "parceiro", label: "Partner" }, { value: "estrategico", label: "Strategic" }, { value: "premium", label: "Premium" }],
    dashExecTitulo: "Portfolio Executive Dashboard", dashExecSub: "Client management indicators — real data only.",
    kpiAtivos: "Active Clients", kpiNovosMes: "New This Month", kpiInativos: "Inactive Clients", kpiTempoRelac: "Avg. Relationship Time",
    kpiPremium: "Premium Clients", kpiEstrategico: "Strategic Clients", kpiEmRisco: "At-Risk Clients", kpiNegligenciado: "Neglected",
    radarExecTitulo: "Executive Radar", radarExecSub: "The whole portfolio grouped by signal — click a group to filter the list below.",
    radarLimparFiltro: "Clear filter", radarFiltrando: "Filtering by",
    nomeSinalPlural: { premium: "Premium", prontoParaUpsell: "Upsell Ready", emRisco: "At Risk", negligenciado: "Neglected", geraCaixaRecorrente: "Recurring Cash", concentracaoAlta: "High Concentration" } as Record<TipoSinalCliente, string>,
    receitaSegmentoTitulo: "Revenue by Segment", receitaCidadeTitulo: "Revenue by City", receitaEstadoTitulo: "Revenue by State",
    semDadoAgrupado: "Fill in segment/city/state in client records for this panel to gain detail.",
    topIvcaTitulo: "Top 5 — IVCA", topValorTitulo: "Top 5 — Billed Value", topCrescimentoTitulo: "Top 5 — Growth",
    comprasTitulo: "Purchase Summary", ultimaCompra: "Last Purchase", maiorCompra: "Largest Purchase", primeiraCompra: "First Purchase", semRegistro: "—",
    parecerTitulo: "Executive Opinion", parecerSub: "Summary, strengths/weaknesses, risks and next step — 100% rules over real data, not generated by a language model (upgrades once the key is active).",
    parecerResumo: "Executive Summary", parecerFortes: "Strengths", parecerFracos: "Weaknesses", parecerRiscos: "Risks", parecerOportunidades: "Opportunities",
    parecerSugestao: "Suggestion", parecerProximoPasso: "Next Step",
    verDetalhes: "Details", ocultarDetalhes: "Hide", parcelasLbl: "Installments", jurosLbl: "Interest", multaLbl: "Late Fee",
    formaRecebLbl: "Payment Method", observacoesLbl: "Notes", sugestaoAcaoLbl: "Suggested Action", semObservacoes: "No notes.",
    etapaNomes: { identificacao: "Identification", contato: "Contact", endereco: "Address", fiscal: "Tax", financeiro: "Financial", comercial: "Commercial", cobrancas: "Receivables", riscos: "Risk", documentos: "Documents", ia: "AI Intelligence", observacoes: "Notes" } as Record<EtapaCadastro, string>,
    anterior: "Back", proximo: "Next", finalizarCadastro: "Save Customer",
    secFiscal: "Tax", secFinanceiro: "Financial",
    paisLabel: "Country", paisValor: "Brazil",
    semDadosNovoCliente: "Available after saving the client and registering the first history.",
    riscoEtapaTitulo: "Calculated risk (read-only)", cobrancasEtapaTitulo: "This client's receivables (read-only)",
    iaEtapaTitulo: "Executive Opinion preview (read-only)",
    lblDocumentosLinks: "Document Links", documentosLinksPlaceholder: "One link per line (e.g. contract on Google Drive)",
    secBasico: "Basic", secDocumentacao: "Documentation", secPagamento: "Payment", secInteligenciaConta: "Intelligence", secAnexoObs: "Attachment & Notes",
    lblContrato: "Related Contract", lblNumeroCobranca: "Charge Number", lblCategoria: "Revenue Category",
    lblCentroReceita: "Revenue Center", lblContaContabil: "Ledger Account", lblBancoRecebedor: "Receiving Bank",
    lblEmissao: "Issue Date", lblCompetencia: "Reference Month", lblDesconto: "Discount (R$)", lblValorFinal: "Final Value",
    lblRecorrente: "Recurring Charge", lblFrequencia: "Frequency", lblAnexoUrl: "Attachment Link",
    freqOpcoes: [{ value: "mensal", label: "Monthly" }, { value: "trimestral", label: "Quarterly" }, { value: "anual", label: "Yearly" }],
    scoreRecebimentoLbl: "Collection Score", probInadimplenciaLbl: "Default Probability", previsaoIaLbl: "Forecast (rule-based, not generative AI)",
    selecioneClientePrevisao: "Select a client and due date to see the forecast.",
  },
  es: {
    abaCarteira: "📊 Cartera", abaCliente: "🧬 Cliente", abaCobrancas: "💳 Cobros",
    carteiraExecutiva: "Mapa Ejecutivo de la Cartera", carteiraSub: "Cada cliente como activo financiero — valor, riesgo y oportunidad en un solo lugar.",
    valorCarteira: "Valor de la Cartera", ticketMedioCarteira: "Ticket Promedio", inadimplenciaCarteira: "Impago de la Cartera", concentracaoTop5: "Concentración Top 5",
    distribuicaoIvca: "Distribución por IVCA", faixaCritico: "Crítico", faixaAtencao: "Atención", faixaBom: "Saludable", faixaExcelente: "Premium",
    mapaValor: "Mapa de Valor de Clientes", mapaValorSub: "IVCA (valor) × Seguridad (100 = bajo riesgo). Tamaño del punto = ticket promedio. Clic en una burbuja para abrir el cliente.",
    mapaValorVazio: "Registre al menos 2 clientes con cobros para habilitar el Mapa de Valor.",
    listaClientes: "Clientes ordenados por IVCA",
    selecioneCliente: "Seleccione un cliente en la Cartera para abrir el Digital Twin.",
    voltarCarteira: "Volver a la Cartera",
    tempoDeCasa: "Cliente hace",
    meses: "meses",
    ivcaTitulo: "IVCA — Índice de Valor del Cliente Axioma", ivcaSub: "Score propietario 0-1000, solo con dato real: puntualidad, volumen, recurrencia, tendencia y riesgo.",
    saudeTitulo: "Salud del Cliente", saudePagamento: "Pago", saudeRelacionamento: "Relación", saudeRecorrencia: "Recurrencia", saudeComercial: "Comercial",
    radarTitulo: "Radar de Señales", radarSub: "Oportunidades y riesgos detectados automáticamente — siempre con el motivo.",
    radarVazio: "Ninguna señal crítica detectada para este cliente.",
    conselhoTitulo: "Consejo Ejecutivo del Cliente", conselhoSub: "Cada especialista lee el mismo dato real desde su óptica.",
    recomendacaoConsolidada: "Recomendación Consolidada de la ZIA",
    ziaTitulo: "Pregúntale a la ZIA sobre este cliente", ziaSub: "Responde con el dato real de este cliente (modo reglas — mejora a IA real cuando la clave esté activa).",
    ziaPlaceholder: "Ej: ¿este cliente merece descuento?", ziaPensando: "Analizando...",
    timelineTitulo: "Línea de Tiempo Financiera", timelineVazio: "Ningún evento registrado todavía.",
    dadosCadastrais: "Datos de Registro", contasDoCliente: "Cobros de este cliente",
    verTodasCobrancas: "Ver Todos los Cobros",
    compartilhar: "Compartir",
    secIdentificacao: "Identificación", secContato: "Contacto", secComercial: "Comercial", secEndereco: "Dirección Inteligente", secObs: "Observaciones",
    lblRazaoSocial: "Razón Social", lblNomeFantasia: "Nombre Comercial", lblInscricaoEstadual: "Inscripción Estatal",
    lblWhatsapp: "WhatsApp", lblSite: "Sitio Web", lblResponsavel: "Responsable", lblCargo: "Cargo",
    lblSegmento: "Segmento", lblPorte: "Tamaño de la Empresa", lblRegimeTributario: "Régimen Tributario",
    lblNumFuncionarios: "Nº de Empleados", lblFaturamentoEstimado: "Facturación Estimada (R$)",
    lblOrigem: "Origen del Cliente", lblResponsavelComercial: "Responsable Comercial",
    lblCondicaoPagamento: "Condición de Pago", lblPrazoMedio: "Plazo Promedio (días)", lblLimiteCredito: "Límite de Crédito (R$)",
    lblClassificacao: "Clasificación", lblEstado: "Estado", lblCidade: "Ciudad", lblDataPrimeiraCompra: "Fecha de la Primera Compra",
    lblObservacoes: "Observaciones", lblStatus: "Estado",
    selecioneEstado: "-- Estado --", selecioneCidade: "-- Ciudad --", selecioneEstadoPrimeiro: "Seleccione el estado primero",
    digiteCidadeManual: "Ciudad (escriba — lista automática no disponible ahora)",
    portePorte: [{ value: "mei", label: "Autónomo" }, { value: "micro", label: "Micro" }, { value: "pequena", label: "Pequeña" }, { value: "media", label: "Mediana" }, { value: "grande", label: "Grande" }],
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Lucro Presumido" }, { value: "real", label: "Lucro Real" }, { value: "mei", label: "Autónomo" }, { value: "isento", label: "Exento" }],
    classificacoes: [{ value: "lead", label: "Lead" }, { value: "cliente", label: "Cliente" }, { value: "parceiro", label: "Socio" }, { value: "estrategico", label: "Estratégico" }, { value: "premium", label: "Premium" }],
    dashExecTitulo: "Dashboard Ejecutivo de la Cartera", dashExecSub: "Indicadores de gestión de clientes — solo con dato real.",
    kpiAtivos: "Clientes Activos", kpiNovosMes: "Nuevos del Mes", kpiInativos: "Clientes Inactivos", kpiTempoRelac: "Tiempo Promedio de Relación",
    kpiPremium: "Clientes Premium", kpiEstrategico: "Clientes Estratégicos", kpiEmRisco: "Clientes en Riesgo", kpiNegligenciado: "Descuidados",
    radarExecTitulo: "Radar Ejecutivo", radarExecSub: "Toda la cartera agrupada por señal — clic en un grupo para filtrar la lista de abajo.",
    radarLimparFiltro: "Limpiar filtro", radarFiltrando: "Filtrando por",
    nomeSinalPlural: { premium: "Premium", prontoParaUpsell: "Listos p/ Upsell", emRisco: "En Riesgo", negligenciado: "Descuidados", geraCaixaRecorrente: "Caja Recurrente", concentracaoAlta: "Concentración Alta" } as Record<TipoSinalCliente, string>,
    receitaSegmentoTitulo: "Ingresos por Segmento", receitaCidadeTitulo: "Ingresos por Ciudad", receitaEstadoTitulo: "Ingresos por Estado",
    semDadoAgrupado: "Complete segmento/ciudad/estado en el registro de clientes para que este panel gane detalle.",
    topIvcaTitulo: "Top 5 — IVCA", topValorTitulo: "Top 5 — Valor Cobrado", topCrescimentoTitulo: "Top 5 — Crecimiento",
    comprasTitulo: "Resumen de Compras", ultimaCompra: "Última Compra", maiorCompra: "Mayor Compra", primeiraCompra: "Primera Compra", semRegistro: "—",
    parecerTitulo: "Parecer Ejecutivo", parecerSub: "Resumen, fortalezas/debilidades, riesgos y próximo paso — 100% reglas sobre dato real, no generado por IA generativa (mejora cuando la clave esté activa).",
    parecerResumo: "Resumen Ejecutivo", parecerFortes: "Fortalezas", parecerFracos: "Debilidades", parecerRiscos: "Riesgos", parecerOportunidades: "Oportunidades",
    parecerSugestao: "Sugerencia", parecerProximoPasso: "Próximo Paso",
    verDetalhes: "Detalles", ocultarDetalhes: "Ocultar", parcelasLbl: "Cuotas", jurosLbl: "Interés", multaLbl: "Multa",
    formaRecebLbl: "Forma de Cobro", observacoesLbl: "Observaciones", sugestaoAcaoLbl: "Sugerencia de Acción", semObservacoes: "Sin observaciones.",
    etapaNomes: { identificacao: "Identificación", contato: "Contacto", endereco: "Dirección", fiscal: "Fiscal", financeiro: "Financiero", comercial: "Comercial", cobrancas: "Cobros", riscos: "Riesgo", documentos: "Documentos", ia: "Inteligencia IA", observacoes: "Observaciones" } as Record<EtapaCadastro, string>,
    anterior: "Anterior", proximo: "Siguiente", finalizarCadastro: "Guardar Cliente",
    secFiscal: "Fiscal", secFinanceiro: "Financiero",
    paisLabel: "País", paisValor: "Brasil",
    semDadosNovoCliente: "Disponible después de guardar el cliente y registrar el primer historial.",
    riscoEtapaTitulo: "Riesgo calculado (solo lectura)", cobrancasEtapaTitulo: "Cobros de este cliente (solo lectura)",
    iaEtapaTitulo: "Vista previa del Parecer Ejecutivo (solo lectura)",
    lblDocumentosLinks: "Enlaces de Documentos", documentosLinksPlaceholder: "Un enlace por línea (ej: contrato en Google Drive)",
    secBasico: "Básico", secDocumentacao: "Documentación", secPagamento: "Pago", secInteligenciaConta: "Inteligencia", secAnexoObs: "Anexo y Observaciones",
    lblContrato: "Contrato Relacionado", lblNumeroCobranca: "Número del Cobro", lblCategoria: "Categoría del Ingreso",
    lblCentroReceita: "Centro de Ingreso", lblContaContabil: "Cuenta Contable", lblBancoRecebedor: "Banco Receptor",
    lblEmissao: "Emisión", lblCompetencia: "Periodo Contable", lblDesconto: "Descuento (R$)", lblValorFinal: "Valor Final",
    lblRecorrente: "Cobro Recurrente", lblFrequencia: "Frecuencia", lblAnexoUrl: "Enlace del Anexo",
    freqOpcoes: [{ value: "mensal", label: "Mensual" }, { value: "trimestral", label: "Trimestral" }, { value: "anual", label: "Anual" }],
    scoreRecebimentoLbl: "Score de Cobro", probInadimplenciaLbl: "Probabilidad de Impago", previsaoIaLbl: "Previsión (regla, no IA generativa)",
    selecioneClientePrevisao: "Seleccione un cliente y vencimiento para ver la previsión.",
  },
};

export default function ClientesPage() {
  const { t, idioma } = useLanguage();
  const cl = t.clientes;
  const lang = (idioma as Idioma3) || "pt";
  const tt = T[lang];
  const cx = cfoT(lang);

  const [aba, setAba] = useState<"carteira" | "cliente" | "cobrancas">("carteira");
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [contas, setContas] = useState<ContaRow[]>([]);
  const [inadimplencias, setInadimplencias] = useState<InadimplenciaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [buscaCarteira, setBuscaCarteira] = useState("");
  const [buscaContas, setBuscaContas] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [filtroSinalCarteira, setFiltroSinalCarteira] = useState<TipoSinalCliente | null>(null);
  const [cobrancaExpandidaId, setCobrancaExpandidaId] = useState<string | null>(null);

  const [modalCliente, setModalCliente] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<ClienteRow | null>(null);
  const [form, setForm] = useState<FormCliente>(FORM_VAZIO);
  const [salvandoCliente, setSalvandoCliente] = useState(false);
  const [etapaCadastro, setEtapaCadastro] = useState(0);

  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<{ id: string; nome: string }[]>([]);

  const [modalConta, setModalConta] = useState(false);
  const [formConta, setFormConta] = useState<FormConta>(FORM_CONTA_VAZIO);
  const [salvandoConta, setSalvandoConta] = useState(false);

  const [inputChat, setInputChat] = useState("");
  const [mensagensChat, setMensagensChat] = useState<{ role: "user" | "assistant"; texto: string }[]>([]);
  const [chatCarregando, setChatCarregando] = useState(false);

  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    carregarDados();
    buscarEstados().then((r) => setEstados(r.dados));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("centros_custo").select("id, nome").eq("user_id", user.id).then(({ data }) => setCentrosCusto(data || []));
    });
  }, []);

  useEffect(() => {
    if (!modalCliente || !form.estado) { setMunicipios([]); return; }
    buscarMunicipios(form.estado).then((r) => setMunicipios(r.dados));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.estado, modalCliente]);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const [{ data: clientesData }, { data: contasData }, { data: inadData }] = await Promise.all([
      supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("contas_receber").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true }),
      supabase.from("inadimplencia").select("*").eq("user_id", user.id),
    ]);
    setClientes(clientesData || []);
    setContas(contasData || []);
    setInadimplencias(inadData || []);
    setLoading(false);
  }

  async function salvarCliente() {
    if (!form.nome.trim()) return;
    setSalvandoCliente(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoCliente(false); return; }
    const payload = {
      nome: form.nome, email: form.email, telefone: form.telefone, documento: form.documento,
      cidade: form.cidade, status: form.status,
      razao_social: form.razaoSocial || null, nome_fantasia: form.nomeFantasia || null,
      inscricao_estadual: form.inscricaoEstadual || null, whatsapp: form.whatsapp || null, site: form.site || null,
      responsavel: form.responsavel || null, cargo: form.cargo || null, segmento: form.segmento || null,
      porte: form.porte || null, regime_tributario: form.regimeTributario || null,
      num_funcionarios: form.numFuncionarios ? parseInt(form.numFuncionarios) : null,
      faturamento_estimado: form.faturamentoEstimado ? parseFloat(form.faturamentoEstimado) : null,
      origem: form.origem || null, responsavel_comercial: form.responsavelComercial || null,
      condicao_pagamento: form.condicaoPagamento || null,
      prazo_medio_dias: form.prazoMedio ? parseInt(form.prazoMedio) : null,
      limite_credito: form.limiteCredito ? parseFloat(form.limiteCredito) : null,
      classificacao: form.classificacao || null, estado: form.estado || null,
      data_primeira_compra: form.dataPrimeiraCompra || null, observacoes: form.observacoes || null,
      documentos_links: form.documentosLinks || null,
    };
    if (editandoCliente) {
      await supabase.from("clientes").update(payload).eq("id", editandoCliente.id);
    } else {
      await supabase.from("clientes").insert({ ...payload, user_id: user.id, empresa_id: empresaId });
    }
    fecharModalCliente(); setSalvandoCliente(false); carregarDados();
  }

  async function excluirCliente(id: string) {
    await supabase.from("clientes").delete().eq("id", id);
    if (clienteSelecionadoId === id) { setClienteSelecionadoId(null); setAba("carteira"); }
    carregarDados();
  }

  async function salvarConta() {
    if (!formConta.descricao.trim() || !formConta.valor || !formConta.vencimento) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoConta(false); return; }
    await supabase.from("contas_receber").insert({
      descricao: formConta.descricao, valor: parseFloat(formConta.valor), data_vencimento: formConta.vencimento,
      data_emissao: formConta.emissao || null, status: "pendente", cliente_id: formConta.clienteId || null,
      numero_documento: formConta.numeroDocumento || null, categoria: formConta.categoria || null,
      forma_recebimento: formConta.formaRecebimento || null,
      parcelas: formConta.parcelas ? parseInt(formConta.parcelas) : null,
      taxa_juros: formConta.taxaJuros ? parseFloat(formConta.taxaJuros) : null,
      taxa_multa: formConta.taxaMulta ? parseFloat(formConta.taxaMulta) : null,
      valor_desconto: formConta.valorDesconto ? parseFloat(formConta.valorDesconto) : null,
      observacoes: formConta.observacoes || null,
      contrato_ref: formConta.contratoRef || null, centro_custo_id: formConta.centroCustoId || null,
      conta_contabil: formConta.contaContabil || null, banco_recebedor: formConta.bancoRecebedor || null,
      competencia: formConta.competencia || null, recorrente: formConta.recorrente,
      frequencia_recorrencia: formConta.recorrente ? (formConta.frequenciaRecorrencia || null) : null,
      anexo_url: formConta.anexoUrl || null,
      user_id: user.id, empresa_id: empresaId,
    });
    setModalConta(false); setFormConta(FORM_CONTA_VAZIO);
    setSalvandoConta(false); carregarDados();
  }

  async function marcarRecebido(id: string) {
    await supabase.from("contas_receber").update({ status: "recebido", data_recebimento: new Date().toISOString().split("T")[0] }).eq("id", id);
    carregarDados();
  }

  function abrirDigitalTwin(id: string) {
    setClienteSelecionadoId(id); setAba("cliente");
    setMensagensChat([]); setInputChat("");
  }

  function abrirEditarCliente(cliente: ClienteRow) {
    setEditandoCliente(cliente);
    setForm({
      nome: cliente.nome, email: cliente.email || "", telefone: cliente.telefone || "", documento: cliente.documento || "",
      status: cliente.status || "ativo",
      razaoSocial: cliente.razao_social || "", nomeFantasia: cliente.nome_fantasia || "", inscricaoEstadual: cliente.inscricao_estadual || "",
      whatsapp: cliente.whatsapp || "", site: cliente.site || "", responsavel: cliente.responsavel || "", cargo: cliente.cargo || "",
      segmento: cliente.segmento || "", porte: cliente.porte || "", regimeTributario: cliente.regime_tributario || "",
      numFuncionarios: cliente.num_funcionarios != null ? String(cliente.num_funcionarios) : "",
      faturamentoEstimado: cliente.faturamento_estimado != null ? String(cliente.faturamento_estimado) : "",
      origem: cliente.origem || "", responsavelComercial: cliente.responsavel_comercial || "",
      condicaoPagamento: cliente.condicao_pagamento || "",
      prazoMedio: cliente.prazo_medio_dias != null ? String(cliente.prazo_medio_dias) : "",
      limiteCredito: cliente.limite_credito != null ? String(cliente.limite_credito) : "",
      classificacao: cliente.classificacao || "cliente", estado: cliente.estado || "", cidade: cliente.cidade || "",
      dataPrimeiraCompra: cliente.data_primeira_compra || "", observacoes: cliente.observacoes || "",
      documentosLinks: cliente.documentos_links || "",
    });
    setEtapaCadastro(0);
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false); setEditandoCliente(null); setForm(FORM_VAZIO); setMunicipios([]); setEtapaCadastro(0);
  }

  const hoje = new Date().toISOString().split("T")[0];
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ═══════════════════════ INTELIGÊNCIA DA CARTEIRA (dado real) ═══════════════════════
  const snapshotCarteira = useMemo(() => montarSnapshotsCarteira(clientes, contas, inadimplencias), [clientes, contas, inadimplencias]);

  const intel = useMemo(() => snapshotCarteira.clientesSnapshot.map((s) => {
    const ivca = calcularIVCA(s, snapshotCarteira);
    const saude = calcularSaudeCliente(s, ivca);
    const sinais = detectarSinaisCliente(s, ivca, snapshotCarteira);
    return { s, ivca, saude, sinais };
  }), [snapshotCarteira]);

  const intelOrdenado = useMemo(() => [...intel].sort((a, b) => b.ivca.total - a.ivca.total), [intel]);
  const intelFiltrado = intelOrdenado
    .filter((i) => i.s.cliente.nome.toLowerCase().includes(buscaCarteira.toLowerCase()))
    .filter((i) => !filtroSinalCarteira || i.sinais.some((x) => x.tipo === filtroSinalCarteira));
  const clienteAtual = intel.find((i) => i.s.cliente.id === clienteSelecionadoId) || null;
  const intelDoClienteEditando = editandoCliente ? intel.find((i) => i.s.cliente.id === editandoCliente.id) || null : null;
  const contasDoClienteEditando = editandoCliente ? contas.filter((c) => c.cliente_id === editandoCliente.id) : [];
  const parecerDoClienteEditando = intelDoClienteEditando ? montarParecerExecutivo(lang, intelDoClienteEditando.s, intelDoClienteEditando.ivca, intelDoClienteEditando.sinais) : null;

  const intelDoClienteConta = intel.find((i) => i.s.cliente.id === formConta.clienteId) || null;
  const diasParaVencerConta = formConta.vencimento ? Math.round((new Date(formConta.vencimento + "T00:00:00").getTime() - new Date(hoje + "T00:00:00").getTime()) / 86400000) : null;
  const previewCobranca = intelDoClienteConta && diasParaVencerConta != null ? {
    score: scoreRecebimento(intelDoClienteConta.ivca.subscores.find((x) => x.chave === "pontualidade")?.valor ?? 60, diasParaVencerConta),
    prob: probabilidadeInadimplenciaConta(intelDoClienteConta.ivca.subscores.find((x) => x.chave === "risco")?.valor ?? 50),
  } : null;
  const valorFinalConta = (parseFloat(formConta.valor) || 0) - (parseFloat(formConta.valorDesconto) || 0)
    + ((parseFloat(formConta.valor) || 0) * ((parseFloat(formConta.taxaJuros) || 0) / 100))
    + ((parseFloat(formConta.valor) || 0) * ((parseFloat(formConta.taxaMulta) || 0) / 100));

  const valorEmAtrasoCarteira = snapshotCarteira.clientesSnapshot.reduce((s, c) => s + c.valorEmAtrasoAtual, 0);
  const inadimplenciaCarteiraPct = snapshotCarteira.valorTotalCarteira > 0 ? (valorEmAtrasoCarteira / snapshotCarteira.valorTotalCarteira) * 100 : 0;
  const top5Valor = [...snapshotCarteira.clientesSnapshot].sort((a, b) => b.valorTotalCobrado - a.valorTotalCobrado).slice(0, 5).reduce((s, c) => s + c.valorTotalCobrado, 0);
  const concentracaoTop5Pct = snapshotCarteira.valorTotalCarteira > 0 ? (top5Valor / snapshotCarteira.valorTotalCarteira) * 100 : 0;

  const distribuicaoNiveis = { critico: 0, atencao: 0, bom: 0, excelente: 0 } as Record<string, number>;
  intel.forEach((i) => { distribuicaoNiveis[i.ivca.nivel]++; });

  const kpisCarteira = useMemo(() => calcularKpisCarteiraExecutivo(clientes, intel), [clientes, intel]);
  const radarCarteira = useMemo(() => montarRadarCarteira(intel), [intel]);

  // Motor de IA / Dashboard ampliado — tudo reaproveitando snapshots e subscores já calculados.
  const recebimentoPrevisto = contas.filter((c) => c.status === "pendente" && c.data_vencimento >= hoje).reduce((s, c) => s + c.valor, 0);
  const recebimentoConfirmado = contas.filter((c) => c.status === "recebido").reduce((s, c) => s + (c.valor_recebido ?? c.valor), 0);
  const recebimentoEmRisco = contas.filter((c) => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);
  const dependenciaMaiorCliente = snapshotCarteira.valorTotalCarteira > 0 && intel.length > 0
    ? Math.max(...intel.map((i) => i.s.valorTotalCobrado)) / snapshotCarteira.valorTotalCarteira * 100 : 0;
  const qtdExpansao = intel.filter((i) => classificarTendencia(i.ivca.subscores.find((x) => x.chave === "tendencia")?.valor ?? 50) === "expansao").length;
  const qtdQueda = intel.filter((i) => classificarTendencia(i.ivca.subscores.find((x) => x.chave === "tendencia")?.valor ?? 50) === "queda").length;
  const receitaRecorrente = contas.filter((c) => c.recorrente).reduce((s, c) => s + c.valor, 0);
  const receitaNaoRecorrente = contas.filter((c) => !c.recorrente).reduce((s, c) => s + c.valor, 0);
  const temContaRecorrenteMarcada = contas.some((c) => c.recorrente);
  const healthCarteira = useMemo(() => healthScoreCarteira(intel), [intel]);
  const riscoCarteira = useMemo(() => riscoCarteiraAgregado(intel), [intel]);
  const optFluxoFuturo = useMemo(() => {
    const serie = serieRecebimentosFutura(contas, 8);
    return optBarrasV(serie.map((s) => s.previsto + s.confirmado), serie.map((s) => s.label), CORES.cyan, CORES.cyanC);
  }, [contas]);
  const grupoSegmento = useMemo(() => receitaPorSegmento(intel, lang).slice(0, 8), [intel, lang]);
  const grupoCidade = useMemo(() => receitaPorCidade(intel, lang).slice(0, 8), [intel, lang]);
  const grupoEstado = useMemo(() => receitaPorEstado(intel, lang).slice(0, 8), [intel, lang]);

  const top5Ivca = intelOrdenado.slice(0, 5);
  const top5PorValor = useMemo(() => [...intel].sort((a, b) => b.s.valorTotalCobrado - a.s.valorTotalCobrado).slice(0, 5), [intel]);
  const top5Crescimento = useMemo(() => [...intel].sort((a, b) => {
    const ta = a.ivca.subscores.find((x) => x.chave === "tendencia")?.valor || 0;
    const tb = b.ivca.subscores.find((x) => x.chave === "tendencia")?.valor || 0;
    return tb - ta;
  }).slice(0, 5), [intel]);

  const optMapaValor = useMemo(() => {
    const pontos = intel.map((i) => ({
      nome: i.s.cliente.nome, x: i.ivca.total,
      y: i.ivca.subscores.find((s) => s.chave === "risco")?.valor || 0,
      cor: NIVEL_COR[i.ivca.nivel],
      tamanho: 14 + Math.min(30, (i.s.ticketMedio / (snapshotCarteira.ticketMedioCarteira || 1)) * 10),
    }));
    return optDispersao(pontos, "IVCA", lang === "en" ? "Safety" : lang === "es" ? "Seguridad" : "Segurança", 1000);
  }, [intel, snapshotCarteira.ticketMedioCarteira, lang]);

  const optSegmento = useMemo(() => optBarrasV(grupoSegmento.map((g) => g.valor), grupoSegmento.map((g) => g.chave), CORES.azul, CORES.azulC), [grupoSegmento]);
  const optCidade = useMemo(() => optBarrasV(grupoCidade.map((g) => g.valor), grupoCidade.map((g) => g.chave), CORES.verde, CORES.verdeC), [grupoCidade]);
  const optEstado = useMemo(() => optBarrasV(grupoEstado.map((g) => g.valor), grupoEstado.map((g) => g.chave), CORES.roxo, CORES.roxoC), [grupoEstado]);

  // ═══════════════════════ COBRANÇAS ═══════════════════════
  const totalReceber = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido").reduce((s, c) => s + (c.valor_recebido ?? c.valor), 0);
  const totalVencido = contas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);

  const contasFiltradas = clienteSelecionadoId && aba === "cobrancas"
    ? contas.filter(c => c.cliente_id === clienteSelecionadoId)
    : contas.filter(c => {
        const clienteNome = clientes.find(cx2 => cx2.id === c.cliente_id)?.nome || "";
        return c.descricao.toLowerCase().includes(buscaContas.toLowerCase()) ||
          clienteNome.toLowerCase().includes(buscaContas.toLowerCase());
      });

  function getStatusCor(status: string | null | undefined, vencimento: string) {
    if (status === "recebido") return { cor: "#34d399", bg: "rgba(52,211,153,0.1)", label: cl.recebido };
    if (vencimento < hoje) return { cor: "#f87171", bg: "rgba(248,113,113,0.1)", label: cl.vencido };
    return { cor: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: cl.pendente };
  }

  function diasAtrasoConta(conta: ContaRow): number {
    if (conta.status === "recebido" || conta.data_vencimento >= hoje) return 0;
    return Math.round((new Date(hoje).getTime() - new Date(conta.data_vencimento).getTime()) / 86400000);
  }

  // ═══════════════════════ ZIA ═══════════════════════
  async function perguntarZIA(texto: string) {
    if (!texto.trim() || chatCarregando || !clienteAtual) return;
    const novas: { role: "user" | "assistant"; texto: string }[] = [...mensagensChat, { role: "user", texto }];
    setMensagensChat(novas); setInputChat(""); setChatCarregando(true);
    const { resposta } = await enviarPerguntaZIA(texto, novas, lang, clienteAtual.s, clienteAtual.ivca, clienteAtual.sinais);
    setMensagensChat([...novas, { role: "assistant", texto: resposta }]);
    setChatCarregando(false);
  }

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      if (aba === "cobrancas") {
        gerarPdfTabela({
          titulo: `${cl.titulo} - ${cl.abaContas}`,
          subtitulo: clienteAtual ? clienteAtual.s.cliente.nome : cl.subtitulo,
          colunas: [
            { header: "Descrição", key: "descricao", width: 4 },
            { header: "Cliente", key: "cliente", width: 3 },
            { header: "Vencimento", key: "venc", width: 2 },
            { header: "Status", key: "status", width: 2 },
            { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
          ],
          linhas: contasFiltradas.map((c) => {
            const cliNome = clientes.find(x => x.id === c.cliente_id)?.nome || "-";
            const st = c.status === "recebido" ? cl.recebido : (c.data_vencimento < hoje ? cl.vencido : cl.pendente);
            return {
              descricao: c.descricao, cliente: cliNome,
              venc: c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-",
              status: st, valor: fmtN(c.valor),
            };
          }),
          resumo: [
            { label: cl.totalReceber, valor: `R$ ${fmtN(totalReceber)}` },
            { label: cl.totalRecebido, valor: `R$ ${fmtN(totalRecebido)}` },
            { label: cl.totalVencido, valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-cobrancas-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      } else {
        gerarPdfTabela({
          titulo: `${cl.titulo} - ${tt.carteiraExecutiva}`,
          subtitulo: clienteAtual ? clienteAtual.s.cliente.nome : cl.subtitulo,
          colunas: [
            { header: "Nome", key: "nome", width: 3 },
            { header: "IVCA", key: "ivca", width: 1 },
            { header: "Nível", key: "nivel", width: 2 },
            { header: "Ticket Médio", key: "ticket", width: 2, align: "right" },
            { header: "Status", key: "status", width: 2 },
          ],
          linhas: intelFiltrado.map((i) => ({
            nome: i.s.cliente.nome, ivca: `${i.ivca.total}/1000`, nivel: i.ivca.nivel,
            ticket: fmtN(i.s.ticketMedio), status: i.s.cliente.status === "ativo" ? cl.ativo : cl.inativo,
          })),
          resumo: [
            { label: cl.totalClientes, valor: `${clientes.length}` },
            { label: tt.valorCarteira, valor: `R$ ${fmtN(snapshotCarteira.valorTotalCarteira)}` },
            { label: tt.ticketMedioCarteira, valor: `R$ ${fmtN(snapshotCarteira.ticketMedioCarteira)}` },
            { label: tt.inadimplenciaCarteira, valor: `${fmtN(inadimplenciaCarteiraPct)}%` },
          ],
          nomeArquivo: `axioma-carteira-clientes-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      }
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${cl.titulo}`,
    `👥 ${cl.totalClientes}: ${clientes.length} · ${tt.valorCarteira}: ${fmt(snapshotCarteira.valorTotalCarteira)}`,
    `🎯 ${tt.ticketMedioCarteira}: ${fmt(snapshotCarteira.ticketMedioCarteira)}`,
    kpisCarteira.qtdEmRisco > 0 ? `⚠️ ${kpisCarteira.qtdEmRisco} ${tt.nomeSinalPlural.emRisco}` : "",
    kpisCarteira.qtdPremium > 0 ? `🏆 ${kpisCarteira.qtdPremium} ${tt.nomeSinalPlural.premium}` : "",
    "_axiomaai.com.br_",
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${cl.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  const marquee = [
    `🚀 AXIOMA AI.TECH`,
    `${tt.valorCarteira}: ${fmt(snapshotCarteira.valorTotalCarteira)}`,
    `${tt.ticketMedioCarteira}: ${fmt(snapshotCarteira.ticketMedioCarteira)}`,
    kpisCarteira.qtdPremium > 0 ? `${kpisCarteira.qtdPremium} ${tt.nomeSinalPlural.premium}` : "",
    kpisCarteira.qtdEmRisco > 0 ? `${kpisCarteira.qtdEmRisco} ${tt.nomeSinalPlural.emRisco}` : "",
    top5Ivca[0] ? `IVCA: ${top5Ivca[0].s.cliente.nome} (${top5Ivca[0].ivca.total})` : "",
  ].filter(Boolean);

  const botaoCobranca = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalConta(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cl.novaCobranca}
    </motion.button>
  );

  const botaoCompartilhar = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={() => setShareAberto(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(106,176,255,0.15)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.3)" }}>
      <Share2 size={16} /> {tt.compartilhar}
    </motion.button>
  );

  const timeline = clienteAtual ? montarTimelineCliente(lang, clienteAtual.s) : [];
  const especialistas = clienteAtual ? montarConselhoExecutivo(lang, clienteAtual.s, clienteAtual.ivca, clienteAtual.sinais) : null;
  const parecer = clienteAtual ? montarParecerExecutivo(lang, clienteAtual.s, clienteAtual.ivca, clienteAtual.sinais) : null;
  const compras = clienteAtual ? resumoComprasCliente(clienteAtual.s) : null;

  return (
    <ModuloLayout titulo={`👥 ${cl.titulo}`} subtitulo={cl.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCliente(null); setForm(FORM_VAZIO); setEtapaCadastro(0); setModalCliente(true); }}
      labelBotao={cl.novoCliente} botaoExtra={<div className="flex gap-2 flex-wrap">{botaoCobranca}{botaoCompartilhar}</div>}>
      <div className="space-y-4">

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[{ key: "carteira", label: tt.abaCarteira }, { key: "cliente", label: tt.abaCliente }, { key: "cobrancas", label: tt.abaCobrancas }].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBuscaCarteira(""); setBuscaContas(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,20,36,0.7)", color: aba === a.key ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}` }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══════════════════════ ABA CARTEIRA ═══════════════════════ */}
            {aba === "carteira" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
                    { label: tt.valorCarteira, valor: fmt(snapshotCarteira.valorTotalCarteira), cor: "#34d399" },
                    { label: tt.ticketMedioCarteira, valor: fmt(snapshotCarteira.ticketMedioCarteira), cor: "#fbbf24" },
                    { label: tt.inadimplenciaCarteira, valor: `${fmtN(inadimplenciaCarteiraPct)}%`, cor: inadimplenciaCarteiraPct > 15 ? "#f87171" : "#34d399" },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <CanvasBox cor={card.cor}>
                        <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{card.label}</p>
                        <p className="text-xl font-black" style={{ color: card.cor }}>{card.valor}</p>
                      </CanvasBox>
                    </motion.div>
                  ))}
                </div>

                {/* Letreiro */}
                {marquee.length > 0 && (
                  <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(106,176,255,0.12), rgba(52,211,153,0.10))", border: "1px solid rgba(106,176,255,0.22)" }}>
                    <div className="marquee-cli py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                      <span className="text-[13px] font-bold tracking-wide" style={FONTE_EXEC}>
                        {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#93c5fd" : "#e2e8f0" }}>{m}<span style={{ color: "#6ab0ff" }}>{"  •  "}</span></span>))}
                      </span>
                      <span className="text-[13px] font-bold tracking-wide" style={FONTE_EXEC} aria-hidden>
                        {marquee.map((m, i) => (<span key={`b${i}`} style={{ color: i === 0 ? "#93c5fd" : "#e2e8f0" }}>{m}<span style={{ color: "#6ab0ff" }}>{"  •  "}</span></span>))}
                      </span>
                    </div>
                    <style>{`
                      .marquee-cli { animation: marqueeCli 32s linear infinite; }
                      @keyframes marqueeCli { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                      .marquee-cli:hover { animation-play-state: paused; }
                    `}</style>
                  </div>
                )}

                {/* Dashboard Executivo */}
                <CanvasBox cor="#6ab0ff">
                  <p className="text-sm font-black mb-1" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.dashExecTitulo}</p>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.dashExecSub}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: tt.kpiAtivos, valor: `${snapshotCarteira.qtdClientesAtivos}`, cor: "#34d399" },
                      { label: tt.kpiNovosMes, valor: `${kpisCarteira.clientesNovosMes}`, cor: "#6ab0ff" },
                      { label: tt.kpiInativos, valor: `${kpisCarteira.clientesInativos}`, cor: "#94a3b8" },
                      { label: tt.kpiTempoRelac, valor: `${Math.round(kpisCarteira.tempoMedioRelacionamentoDias / 30)} ${tt.meses}`, cor: "#fbbf24" },
                      { label: tt.kpiPremium, valor: `${kpisCarteira.qtdPremium}`, cor: CORES.ouro },
                      { label: tt.kpiEstrategico, valor: `${kpisCarteira.qtdEstrategico}`, cor: "#8b5cf6" },
                      { label: tt.kpiEmRisco, valor: `${kpisCarteira.qtdEmRisco}`, cor: "#f87171" },
                      { label: tt.kpiNegligenciado, valor: `${kpisCarteira.qtdNegligenciado}`, cor: "#f97316" },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{k.label}</p>
                        <p className="text-base font-black" style={{ color: k.cor }}>{k.valor}</p>
                      </div>
                    ))}
                  </div>
                </CanvasBox>

                {/* Motor de Inteligência — recebimentos, dependência, expansão/queda, recorrência, health/risco */}
                <CanvasBox cor="#06b6d4">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity size={16} style={{ color: CORES.cyan }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.dashExecTitulo} — {lang === "en" ? "Cash & Trends" : lang === "es" ? "Caja y Tendencias" : "Caixa & Tendências"}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {[
                      { label: lang === "en" ? "Expected Receivables" : lang === "es" ? "Cobro Previsto" : "Recebimento Previsto", valor: fmt(recebimentoPrevisto), cor: "#6ab0ff" },
                      { label: lang === "en" ? "Confirmed Receivables" : lang === "es" ? "Cobro Confirmado" : "Recebimento Confirmado", valor: fmt(recebimentoConfirmado), cor: "#34d399" },
                      { label: lang === "en" ? "At-Risk Receivables" : lang === "es" ? "Cobro en Riesgo" : "Recebimento em Risco", valor: fmt(recebimentoEmRisco), cor: "#f87171" },
                      { label: lang === "en" ? "Top Client Dependency" : lang === "es" ? "Dependencia Mayor Cliente" : "Dependência Maior Cliente", valor: `${fmtN(dependenciaMaiorCliente)}%`, cor: dependenciaMaiorCliente > 30 ? "#f87171" : "#94a3b8" },
                      { label: lang === "en" ? "Clients Expanding" : lang === "es" ? "Clientes en Expansión" : "Clientes em Expansão", valor: `${qtdExpansao}`, cor: "#34d399" },
                      { label: lang === "en" ? "Clients Declining" : lang === "es" ? "Clientes en Caída" : "Clientes em Queda", valor: `${qtdQueda}`, cor: "#f87171" },
                      { label: lang === "en" ? "Portfolio Health Score" : lang === "es" ? "Health Score de Cartera" : "Health Score da Carteira", valor: `${healthCarteira}/100`, cor: healthCarteira >= 70 ? "#34d399" : healthCarteira >= 40 ? "#fbbf24" : "#f87171" },
                      { label: lang === "en" ? "Portfolio Risk" : lang === "es" ? "Riesgo de Cartera" : "Risco da Carteira", valor: `${riscoCarteira}/100`, cor: riscoCarteira <= 30 ? "#34d399" : riscoCarteira <= 60 ? "#fbbf24" : "#f87171" },
                    ].map((k) => (
                      <div key={k.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{k.label}</p>
                        <p className="text-base font-black" style={{ color: k.cor }}>{k.valor}</p>
                      </div>
                    ))}
                  </div>
                  {temContaRecorrenteMarcada && (
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="rounded-xl p-3" style={{ background: "rgba(52,211,153,0.06)" }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{lang === "en" ? "Recurring Revenue" : lang === "es" ? "Ingresos Recurrentes" : "Receita Recorrente"}</p>
                        <p className="text-base font-black" style={{ color: "#34d399" }}>{fmt(receitaRecorrente)}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <p className="text-[9px] uppercase tracking-wider mb-1" style={{ color: "#64748b" }}>{lang === "en" ? "Non-Recurring Revenue" : lang === "es" ? "Ingresos No Recurrentes" : "Receita Não Recorrente"}</p>
                        <p className="text-base font-black" style={{ color: "#94a3b8" }}>{fmt(receitaNaoRecorrente)}</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs font-black mb-1" style={{ color: "#f1f5f9" }}>{lang === "en" ? "Future Cash Flow — Receivables Time Map" : lang === "es" ? "Flujo Futuro — Mapa Temporal de Cobros" : "Fluxo Futuro — Mapa Temporal de Recebimentos"}</p>
                  {contas.length > 0 ? (
                    <ReactECharts option={optFluxoFuturo} style={{ height: 200, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
                  ) : (
                    <p className="text-[11px] py-4 text-center" style={{ color: "#5a7a9a" }}>{tt.semDadoAgrupado}</p>
                  )}
                </CanvasBox>

                {/* Radar Executivo */}
                <CanvasBox cor="#f97316">
                  <div className="flex items-center gap-2 mb-1">
                    <IconRadar size={16} style={{ color: "#f97316" }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.radarExecTitulo}</p>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.radarExecSub}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(Object.keys(radarCarteira) as TipoSinalCliente[]).map((tipo) => {
                      const ativo = filtroSinalCarteira === tipo;
                      const cor = SEVERIDADE_COR[radarCarteira[tipo][0]?.severidade || "atencao"];
                      return (
                        <button key={tipo} onClick={() => setFiltroSinalCarteira(ativo ? null : tipo)}
                          className="rounded-xl p-3 text-left transition-all"
                          style={{ background: ativo ? `${cor}20` : "rgba(255,255,255,0.03)", border: `1px solid ${ativo ? cor : "rgba(148,163,184,0.12)"}` }}>
                          <p className="text-lg font-black" style={{ color: cor }}>{radarCarteira[tipo].length}</p>
                          <p className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: "#94a3b8" }}>{SINAL_ICONE[tipo]} {tt.nomeSinalPlural[tipo]}</p>
                        </button>
                      );
                    })}
                  </div>
                  {filtroSinalCarteira && (
                    <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
                      <span>{tt.radarFiltrando}: <b>{tt.nomeSinalPlural[filtroSinalCarteira]}</b></span>
                      <button onClick={() => setFiltroSinalCarteira(null)} className="px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(106,176,255,0.12)", color: "#6ab0ff" }}>{tt.radarLimparFiltro}</button>
                    </div>
                  )}
                </CanvasBox>

                <CanvasBox cor="#d4af37">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={16} style={{ color: CORES.ouro }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.distribuicaoIvca}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { chave: "excelente", label: tt.faixaExcelente, cor: CORES.verde },
                      { chave: "bom", label: tt.faixaBom, cor: CORES.verde },
                      { chave: "atencao", label: tt.faixaAtencao, cor: CORES.amarelo },
                      { chave: "critico", label: tt.faixaCritico, cor: CORES.vermelho },
                    ].map((f) => (
                      <div key={f.chave} className="rounded-xl p-3 text-center" style={{ background: `${f.cor}10`, border: `1px solid ${f.cor}25` }}>
                        <p className="text-lg font-black" style={{ color: f.cor }}>{distribuicaoNiveis[f.chave]}</p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{f.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: "#64748b" }}>{tt.concentracaoTop5}: <b style={{ color: concentracaoTop5Pct > 50 ? "#f87171" : "#94a3b8" }}>{fmtN(concentracaoTop5Pct)}%</b></p>
                </CanvasBox>

                {/* Top listas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { titulo: tt.topIvcaTitulo, lista: top5Ivca, valor: (i: typeof top5Ivca[0]) => `${i.ivca.total}/1000` },
                    { titulo: tt.topValorTitulo, lista: top5PorValor, valor: (i: typeof top5Ivca[0]) => fmt(i.s.valorTotalCobrado) },
                    { titulo: tt.topCrescimentoTitulo, lista: top5Crescimento, valor: (i: typeof top5Ivca[0]) => `${Math.round(i.ivca.subscores.find((x) => x.chave === "tendencia")?.valor || 0)}/100` },
                  ].map((bloco) => (
                    <CanvasBox key={bloco.titulo} cor="#6ab0ff">
                      <p className="text-xs font-black mb-2" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{bloco.titulo}</p>
                      <div className="space-y-1.5">
                        {bloco.lista.map((i, idx) => (
                          <button key={i.s.cliente.id} onClick={() => abrirDigitalTwin(i.s.cliente.id)} className="w-full flex items-center justify-between text-left px-2 py-1 rounded-lg hover:bg-white/5">
                            <span className="text-xs truncate" style={{ color: "#c8d8f0" }}>{idx + 1}. {i.s.cliente.nome}</span>
                            <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: "#6ab0ff" }}>{bloco.valor(i)}</span>
                          </button>
                        ))}
                        {bloco.lista.length === 0 && <p className="text-xs" style={{ color: "#5a7a9a" }}>—</p>}
                      </div>
                    </CanvasBox>
                  ))}
                </div>

                {/* Receita por Segmento/Cidade/Estado */}
                {intel.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { titulo: tt.receitaSegmentoTitulo, opt: optSegmento, temDado: grupoSegmento.some((g) => g.chave !== "Não informado" && g.chave !== "Not informed" && g.chave !== "No informado") },
                      { titulo: tt.receitaCidadeTitulo, opt: optCidade, temDado: grupoCidade.some((g) => g.chave !== "Não informado" && g.chave !== "Not informed" && g.chave !== "No informado") },
                      { titulo: tt.receitaEstadoTitulo, opt: optEstado, temDado: grupoEstado.some((g) => g.chave !== "Não informado" && g.chave !== "Not informed" && g.chave !== "No informado") },
                    ].map((bloco) => (
                      <CanvasBox key={bloco.titulo} cor="#8b5cf6">
                        <p className="text-xs font-black mb-2" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{bloco.titulo}</p>
                        {bloco.temDado ? (
                          <ReactECharts option={bloco.opt} style={{ height: 180, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
                        ) : (
                          <p className="text-[11px] py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.semDadoAgrupado}</p>
                        )}
                      </CanvasBox>
                    ))}
                  </div>
                )}

                <CanvasBox cor="#6ab0ff">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} style={{ color: "#6ab0ff" }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.mapaValor}</p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#64748b" }}>{tt.mapaValorSub}</p>
                  {intel.length > 1 ? (
                    <ReactECharts option={optMapaValor} style={{ height: 260, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }}
                      onEvents={{ click: (params: any) => { const item = intel[params.dataIndex]; if (item) abrirDigitalTwin(item.s.cliente.id); } }} />
                  ) : (
                    <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.mapaValorVazio}</p>
                  )}
                </CanvasBox>

                <CanvasBox cor="#3b6fd4">
                  <input value={buscaCarteira} onChange={(e) => setBuscaCarteira(e.target.value)}
                    placeholder={cl.buscar}
                    className="w-full text-sm focus:outline-none bg-transparent py-1"
                    style={{ color: "#c8d8f0" }} />
                </CanvasBox>

                {intelFiltrado.length === 0 ? (
                  <CanvasBox cor="#6ab0ff"><div className="p-8 text-center"><p style={{ color: "#5a7a9a" }}>{cl.semClientes}</p></div></CanvasBox>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {intelFiltrado.map(({ s, ivca, sinais }, i) => {
                      const piorSinal = ordenarSinaisPorSeveridade(sinais)[0];
                      return (
                        <motion.div key={s.cliente.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <CanvasBox cor={NIVEL_COR[ivca.nivel]}>
                            <button onClick={() => abrirDigitalTwin(s.cliente.id)} className="w-full text-left">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-black"
                                  style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                                  {s.cliente.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{s.cliente.nome}</p>
                                  <p className="text-[10px]" style={{ color: "#5a7a9a" }}>
                                    {s.cliente.classificacao ? `${nomeClassificacao(lang, s.cliente.classificacao)} · ` : ""}{tt.ticketMedioCarteira}: {fmt(s.ticketMedio)}
                                  </p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-lg font-black" style={{ color: NIVEL_COR[ivca.nivel] }}>{ivca.total}</p>
                                  <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>IVCA</p>
                                </div>
                                <ChevronRight size={16} style={{ color: "#5a7a9a" }} />
                              </div>
                              {piorSinal && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${SEVERIDADE_COR[piorSinal.severidade]}18`, color: SEVERIDADE_COR[piorSinal.severidade] }}>
                                  {nomeTipoSinal(lang, piorSinal.tipo)}
                                </span>
                              )}
                            </button>
                          </CanvasBox>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════ ABA CLIENTE (DIGITAL TWIN) ═══════════════════════ */}
            {aba === "cliente" && (
              !clienteAtual ? (
                <CanvasBox cor="#6ab0ff">
                  <div className="p-8 text-center">
                    <p style={{ color: "#5a7a9a" }}>{tt.selecioneCliente}</p>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setAba("carteira")}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                      style={{ background: "rgba(106,176,255,0.12)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.3)" }}>
                      <ChevronLeft size={14} /> {tt.voltarCarteira}
                    </motion.button>
                  </div>
                </CanvasBox>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <CanvasBox cor="#6ab0ff">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={() => setAba("carteira")} style={{ color: "#5a7a9a" }}><ChevronLeft size={20} /></button>
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                        {clienteAtual.s.cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base" style={{ color: "#c8d8f0" }}>{clienteAtual.s.cliente.nome}</p>
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.tempoDeCasa} {Math.max(0, Math.round(clienteAtual.s.tempoComoClienteDias / 30))} {tt.meses}</p>
                      </div>
                      {clienteAtual.s.cliente.classificacao && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(212,175,55,0.12)", color: CORES.ouro }}>
                          {nomeClassificacao(lang, clienteAtual.s.cliente.classificacao)}
                        </span>
                      )}
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: clienteAtual.s.cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: clienteAtual.s.cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                        {clienteAtual.s.cliente.status === "ativo" ? cl.ativo : cl.inativo}
                      </span>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCliente(clienteAtual.s.cliente)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCliente(clienteAtual.s.cliente.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                    </div>
                  </CanvasBox>

                  {/* IVCA */}
                  <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(10,30,45,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(106,176,255,0.3)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={16} style={{ color: "#6ab0ff" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.ivcaTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.ivcaSub}</p>
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <p className="text-4xl font-black" style={{ color: NIVEL_COR[clienteAtual.ivca.nivel], ...FONTE_EXEC }}>{clienteAtual.ivca.total}</p>
                      <div>
                        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${NIVEL_COR[clienteAtual.ivca.nivel]}18`, color: NIVEL_COR[clienteAtual.ivca.nivel] }}>{clienteAtual.ivca.nivel.toUpperCase()}</span>
                        <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{montarNarrativaIVCA(lang, clienteAtual.ivca)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {clienteAtual.ivca.subscores.map((sub) => (
                        <div key={sub.chave} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{nomeSubscoreIVCA(lang, sub.chave)}</p>
                          <p className="text-sm font-black" style={{ color: "#93c5fd" }}>{Math.round(sub.valor)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Saúde */}
                  <CanvasBox cor="#34d399">
                    <div className="flex items-center gap-2 mb-3">
                      <HeartPulse size={16} style={{ color: "#34d399" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.saudeTitulo}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: tt.saudePagamento, v: clienteAtual.saude.pagamento },
                        { label: tt.saudeRelacionamento, v: clienteAtual.saude.relacionamento },
                        { label: tt.saudeRecorrencia, v: clienteAtual.saude.recorrencia },
                        { label: tt.saudeComercial, v: clienteAtual.saude.comercial },
                      ].map((g) => {
                        const cor = g.v >= 70 ? CORES.verde : g.v >= 40 ? CORES.amarelo : CORES.vermelho;
                        return (
                          <div key={g.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[10px] mb-1.5" style={{ color: "#64748b" }}>{g.label}</p>
                            <p className="text-sm font-black mb-1.5" style={{ color: cor }}>{Math.round(g.v)}/100</p>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.round(g.v)}%`, background: cor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CanvasBox>

                  {/* Resumo de Compras */}
                  {compras && (
                    <CanvasBox cor="#fbbf24">
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag size={16} style={{ color: "#fbbf24" }} />
                        <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.comprasTitulo}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[10px] mb-1" style={{ color: "#64748b" }}>{tt.ultimaCompra}</p>
                          <p className="text-xs font-black" style={{ color: "#c8d8f0" }}>{compras.ultima ? fmt(compras.ultima.valor) : tt.semRegistro}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[10px] mb-1" style={{ color: "#64748b" }}>{tt.maiorCompra}</p>
                          <p className="text-xs font-black" style={{ color: "#c8d8f0" }}>{compras.maior ? fmt(compras.maior.valor) : tt.semRegistro}</p>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[10px] mb-1" style={{ color: "#64748b" }}>{tt.primeiraCompra}</p>
                          <p className="text-xs font-black" style={{ color: "#c8d8f0" }}>{compras.primeira ? new Date(compras.primeira + "T00:00:00").toLocaleDateString("pt-BR") : tt.semRegistro}</p>
                        </div>
                      </div>
                    </CanvasBox>
                  )}

                  {/* Radar de Sinais */}
                  <CanvasBox cor="#f97316">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={16} style={{ color: "#f97316" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.radarTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.radarSub}</p>
                    {clienteAtual.sinais.length === 0 ? (
                      <p className="text-xs font-medium" style={{ color: "#6ee7b7" }}>{tt.radarVazio}</p>
                    ) : (
                      <div className="space-y-2">
                        {ordenarSinaisPorSeveridade(clienteAtual.sinais).map((sinal, i) => {
                          const cor = SEVERIDADE_COR[sinal.severidade];
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl flex-wrap" style={{ background: `${cor}10`, border: `1px solid ${cor}25` }}>
                              <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{montarNarrativaSinal(lang, sinal)}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${cor}18`, color: cor }}>{nomeTipoSinal(lang, sinal.tipo)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CanvasBox>

                  {/* Parecer Executivo */}
                  {parecer && (
                    <CanvasBox cor="#a78bfa">
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardList size={16} style={{ color: "#a78bfa" }} />
                        <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.parecerTitulo}</p>
                      </div>
                      <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>{tt.parecerSub}</p>
                      <div className="mb-3">
                        <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: "#a78bfa" }}>{tt.parecerResumo}</p>
                        <p className="text-xs" style={{ color: "#e2e8f0" }}>{parecer.resumo}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: CORES.verde }}>{tt.parecerFortes}</p>
                          <ul className="space-y-1">{parecer.pontosFortes.map((p, i) => <li key={i} className="text-xs" style={{ color: "#e2e8f0" }}>• {p}</li>)}</ul>
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: CORES.vermelho }}>{tt.parecerFracos}</p>
                          <ul className="space-y-1">{parecer.pontosFracos.map((p, i) => <li key={i} className="text-xs" style={{ color: "#e2e8f0" }}>• {p}</li>)}</ul>
                        </div>
                      </div>
                      {parecer.riscos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: CORES.vermelho }}>{tt.parecerRiscos}</p>
                          <ul className="space-y-1">{parecer.riscos.map((p, i) => <li key={i} className="text-xs" style={{ color: "#e2e8f0" }}>• {p}</li>)}</ul>
                        </div>
                      )}
                      {parecer.oportunidades.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: CORES.verde }}>{tt.parecerOportunidades}</p>
                          <ul className="space-y-1">{parecer.oportunidades.map((p, i) => <li key={i} className="text-xs" style={{ color: "#e2e8f0" }}>• {p}</li>)}</ul>
                        </div>
                      )}
                      <div className="px-3 py-2.5 rounded-xl mb-3" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)" }}>
                        <p className="text-[9px] font-black uppercase mb-1" style={{ color: CORES.cyan }}>{lang === "en" ? "Revenue Forecast" : lang === "es" ? "Previsión de Facturación" : "Previsão de Faturamento"}</p>
                        <p className="text-xs" style={{ color: "#e2e8f0" }}>{previsaoFaturamentoCliente(lang, clienteAtual.s).texto}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)" }}>
                          <p className="text-[9px] font-black uppercase mb-1" style={{ color: "#a78bfa" }}>{tt.parecerSugestao}</p>
                          <p className="text-xs" style={{ color: "#e2e8f0" }}>{parecer.sugestao}</p>
                        </div>
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                          <p className="text-[9px] font-black uppercase mb-1" style={{ color: CORES.ouro }}>{tt.parecerProximoPasso}</p>
                          <p className="text-xs" style={{ color: "#e2e8f0" }}>{parecer.proximoPasso}</p>
                        </div>
                      </div>
                    </CanvasBox>
                  )}

                  {/* Conselho Executivo */}
                  {especialistas && (
                    <CanvasBox cor="#d4af37">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} style={{ color: CORES.ouro }} />
                        <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.conselhoTitulo}</p>
                      </div>
                      <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>{tt.conselhoSub}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {especialistas.cards.map((e, i) => (
                          <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{e.papel}</p>
                            <p className="text-xs font-medium" style={{ color: "#e2e8f0" }}>{e.texto}</p>
                          </div>
                        ))}
                      </div>
                      {especialistas.recomendacoes.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{tt.recomendacaoConsolidada}</p>
                          <div className="space-y-1.5">
                            {especialistas.recomendacoes.map((sinal, i) => (
                              <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{montarNarrativaSinal(lang, sinal)}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CanvasBox>
                  )}

                  {/* ZIA */}
                  <CanvasBox cor="#8b5cf6">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle size={16} style={{ color: CORES.roxo }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.ziaTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.ziaSub}</p>
                    {mensagensChat.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-72 overflow-y-auto pr-1">
                        {mensagensChat.map((m, i) => (
                          <div key={i} className="px-3 py-2 rounded-xl text-xs md:text-[13px]" style={{
                            background: m.role === "user" ? "rgba(106,176,255,0.1)" : "rgba(139,92,246,0.1)",
                            border: `1px solid ${m.role === "user" ? "rgba(106,176,255,0.25)" : "rgba(139,92,246,0.25)"}`,
                            color: "#e2e8f0", marginLeft: m.role === "user" ? "15%" : 0, marginRight: m.role === "user" ? 0 : "15%",
                          }}>{m.texto}</div>
                        ))}
                        {chatCarregando && <p className="text-xs" style={{ color: "#64748b" }}>{tt.ziaPensando}</p>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={inputChat} onChange={(e) => setInputChat(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && perguntarZIA(inputChat)}
                        placeholder={tt.ziaPlaceholder}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)", color: "#c8d8f0" }} />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={chatCarregando || !inputChat.trim()}
                        onClick={() => perguntarZIA(inputChat)}
                        className="px-3 rounded-xl flex items-center justify-center" style={{ background: CORES.roxo, color: "#fff" }}>
                        <Send size={16} />
                      </motion.button>
                    </div>
                  </CanvasBox>

                  {/* Linha do Tempo */}
                  <CanvasBox cor="#6ab0ff">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} style={{ color: "#6ab0ff" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.timelineTitulo}</p>
                    </div>
                    {timeline.length === 0 ? (
                      <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.timelineVazio}</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {timeline.slice(0, 30).map((ev, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] flex-shrink-0 pt-0.5" style={{ color: "#5a7a9a", width: 72 }}>{new Date(ev.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                            <p className="text-xs" style={{ color: "#c8d8f0" }}>{ev.texto}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CanvasBox>

                  {/* Dados cadastrais + contas */}
                  <CanvasBox cor="#6ab0ff">
                    <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.dadosCadastrais}</p>
                    <div className="space-y-1.5 mb-4">
                      {clienteAtual.s.cliente.razao_social && <div className="flex items-center gap-2"><Briefcase size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.razao_social}</p></div>}
                      {clienteAtual.s.cliente.email && <div className="flex items-center gap-2"><Mail size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.email}</p></div>}
                      {clienteAtual.s.cliente.telefone && <div className="flex items-center gap-2"><Phone size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.telefone}</p></div>}
                      {clienteAtual.s.cliente.whatsapp && <div className="flex items-center gap-2"><Phone size={11} style={{ color: "#34d399" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.whatsapp}</p></div>}
                      {clienteAtual.s.cliente.site && <div className="flex items-center gap-2"><Globe size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.site}</p></div>}
                      {(clienteAtual.s.cliente.cidade || clienteAtual.s.cliente.estado) && <div className="flex items-center gap-2"><MapPin size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{[clienteAtual.s.cliente.cidade, clienteAtual.s.cliente.estado].filter(Boolean).join(" - ")}</p></div>}
                      {clienteAtual.s.cliente.documento && <div className="flex items-center gap-2"><FileText size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.documento}</p></div>}
                      {clienteAtual.s.cliente.segmento && <div className="flex items-center gap-2"><Layers size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.segmento}</p></div>}
                      {clienteAtual.s.cliente.responsavel && <div className="flex items-center gap-2"><Users size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.responsavel}{clienteAtual.s.cliente.cargo ? ` — ${clienteAtual.s.cliente.cargo}` : ""}</p></div>}
                      {clienteAtual.s.cliente.observacoes && <div className="flex items-start gap-2"><FileText size={11} style={{ color: "#5a7a9a", marginTop: 2 }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.observacoes}</p></div>}
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setAba("cobrancas")}
                      className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                      {tt.verTodasCobrancas} <ChevronRight size={14} />
                    </motion.button>
                  </CanvasBox>
                </div>
              )
            )}

            {/* ═══════════════════════ ABA COBRANÇAS ═══════════════════════ */}
            {aba === "cobrancas" && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-start">
                  <div className="flex-1">
                    <CanvasBox cor="#3b6fd4">
                      <input value={buscaContas} onChange={(e) => { setBuscaContas(e.target.value); }}
                        placeholder={idioma === "pt" ? "Buscar por descrição ou cliente..." : "Search..."}
                        className="w-full text-sm focus:outline-none bg-transparent py-1"
                        style={{ color: "#c8d8f0" }} />
                    </CanvasBox>
                  </div>
                  {clienteSelecionadoId && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl flex-shrink-0"
                      style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.3)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                        {(clientes.find(c => c.id === clienteSelecionadoId)?.nome || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#6ab0ff" }}>{clientes.find(c => c.id === clienteSelecionadoId)?.nome}</span>
                      <motion.button whileHover={{ scale: 1.1 }} onClick={() => setClienteSelecionadoId(null)} style={{ color: "#5a7a9a" }}><X size={14} /></motion.button>
                    </motion.div>
                  )}
                </div>
                {contasFiltradas.length === 0 ? (
                  <CanvasBox cor="#34d399">
                    <div className="p-8 text-center"><p style={{ color: "#5a7a9a" }}>{cl.semContas}</p></div>
                  </CanvasBox>
                ) : contasFiltradas.map((conta, i) => {
                  const clienteDaConta = clientes.find(c => c.id === conta.cliente_id);
                  const statusInfo = getStatusCor(conta.status, conta.data_vencimento);
                  const expandida = cobrancaExpandidaId === conta.id;
                  const atraso = diasAtrasoConta(conta);
                  const sugestao = atraso > 0 ? sugestaoAcaoCobranca(lang, atraso) : "";
                  const temDetalhe = !!(conta.parcelas || conta.taxa_juros || conta.taxa_multa || conta.forma_recebimento || conta.observacoes || sugestao);
                  return (
                    <motion.div key={conta.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor={statusInfo.cor}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{conta.descricao}</p>
                            {clienteDaConta && !clienteSelecionadoId && (
                              <button onClick={() => setClienteSelecionadoId(clienteDaConta.id)} className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>👤 {clienteDaConta.nome}</button>
                            )}
                            <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{cl.vencimento}: {new Date(conta.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-black" style={{ color: statusInfo.cor }}>{fmt(conta.valor)}</p>
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.cor }}>{statusInfo.label}</span>
                            {conta.status === "pendente" && (
                              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                                onClick={() => marcarRecebido(conta.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                                {cl.marcarRecebido}
                              </motion.button>
                            )}
                            {temDetalhe && (
                              <button onClick={() => setCobrancaExpandidaId(expandida ? null : conta.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                style={{ background: "rgba(148,163,184,0.12)", color: "#94a3b8", border: "1px solid rgba(148,163,184,0.25)" }}>
                                {expandida ? tt.ocultarDetalhes : tt.verDetalhes}
                              </button>
                            )}
                          </div>
                        </div>
                        {expandida && (
                          <div className="mt-3 pt-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderTop: "1px solid rgba(148,163,184,0.12)" }}>
                            {conta.parcelas != null && <div><p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.parcelasLbl}</p><p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{conta.parcelas}x</p></div>}
                            {conta.taxa_juros != null && <div><p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.jurosLbl}</p><p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{conta.taxa_juros}%</p></div>}
                            {conta.taxa_multa != null && <div><p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.multaLbl}</p><p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{conta.taxa_multa}%</p></div>}
                            {conta.forma_recebimento && <div><p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.formaRecebLbl}</p><p className="text-xs font-bold" style={{ color: "#c8d8f0" }}>{conta.forma_recebimento}</p></div>}
                            {conta.observacoes && <div className="col-span-2 md:col-span-4"><p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.observacoesLbl}</p><p className="text-xs" style={{ color: "#c8d8f0" }}>{conta.observacoes}</p></div>}
                            {sugestao && (
                              <div className="col-span-2 md:col-span-4 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }}>
                                <p className="text-[9px] uppercase font-black mb-0.5" style={{ color: "#f97316" }}>{tt.sugestaoAcaoLbl}</p>
                                <p className="text-xs" style={{ color: "#e2e8f0" }}>{sugestao}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Cliente — Cadastro Executivo em etapas */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalCliente && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
                <CanvasBox cor="#6ab0ff">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoCliente ? cl.editarCliente : cl.novoCliente}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalCliente} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>

                  {/* Stepper */}
                  <div className="flex items-start gap-0.5 mb-5 overflow-x-auto pb-1">
                    {ETAPAS_CADASTRO.map((et, idx) => (
                      <button key={et} onClick={() => setEtapaCadastro(idx)} className="flex flex-col items-center gap-1 flex-shrink-0 px-1.5" style={{ opacity: idx <= etapaCadastro ? 1 : 0.45 }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ background: idx < etapaCadastro ? CORES.verde : idx === etapaCadastro ? "#6ab0ff" : "rgba(148,163,184,0.15)", color: idx <= etapaCadastro ? "#fff" : "#64748b" }}>
                          {idx < etapaCadastro ? <Check size={12} /> : idx + 1}
                        </div>
                        <span className="text-[8px] whitespace-nowrap" style={{ color: idx === etapaCadastro ? "#6ab0ff" : "#5a7a9a" }}>{tt.etapaNomes[et]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 min-h-[220px]">
                    {ETAPAS_CADASTRO[etapaCadastro] === "identificacao" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={cl.nome} value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                        <Campo label={tt.lblRazaoSocial} value={form.razaoSocial} onChange={(v) => setForm({ ...form, razaoSocial: v })} />
                        <Campo label={tt.lblNomeFantasia} value={form.nomeFantasia} onChange={(v) => setForm({ ...form, nomeFantasia: v })} />
                        <Campo label={cl.documento} value={form.documento} onChange={(v) => setForm({ ...form, documento: v })} />
                        <CampoSelect label={tt.lblStatus} value={form.status} onChange={(v) => setForm({ ...form, status: v })} opcoes={[{ value: "ativo", label: cl.ativo }, { value: "inativo", label: cl.inativo }]} />
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "contato" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={cl.telefone} value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
                        <Campo label={tt.lblWhatsapp} value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                        <Campo label={cl.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} tipo="email" />
                        <Campo label={tt.lblSite} value={form.site} onChange={(v) => setForm({ ...form, site: v })} />
                        <Campo label={tt.lblResponsavel} value={form.responsavel} onChange={(v) => setForm({ ...form, responsavel: v })} />
                        <Campo label={tt.lblCargo} value={form.cargo} onChange={(v) => setForm({ ...form, cargo: v })} />
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "endereco" && (
                      <div className="space-y-3">
                        <div className="max-w-[220px]">
                          <label className={labelCls} style={labelStyle}>{tt.paisLabel}</label>
                          <input value={tt.paisValor} disabled className={inputCls} style={{ ...inputStyle, opacity: 0.6 }} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <CampoSelect label={tt.lblEstado} value={form.estado} onChange={(v) => setForm({ ...form, estado: v, cidade: "" })}
                            opcoes={estados.map((e) => ({ value: e.sigla, label: `${e.sigla} — ${e.nome}` }))} placeholder={tt.selecioneEstado} />
                          {municipios.length > 0 ? (
                            <CampoSelect label={tt.lblCidade} value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })}
                              opcoes={municipios.map((m) => ({ value: m.nome, label: m.nome }))} placeholder={tt.selecioneCidade} />
                          ) : (
                            <Campo label={tt.lblCidade} value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })}
                              placeholder={form.estado ? tt.digiteCidadeManual : tt.selecioneEstadoPrimeiro} />
                          )}
                        </div>
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "fiscal" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblInscricaoEstadual} value={form.inscricaoEstadual} onChange={(v) => setForm({ ...form, inscricaoEstadual: v })} />
                        <CampoSelect label={tt.lblRegimeTributario} value={form.regimeTributario} onChange={(v) => setForm({ ...form, regimeTributario: v })} opcoes={tt.regimes} />
                        <CampoSelect label={tt.lblPorte} value={form.porte} onChange={(v) => setForm({ ...form, porte: v })} opcoes={tt.portePorte} />
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "financeiro" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblFaturamentoEstimado} value={form.faturamentoEstimado} onChange={(v) => setForm({ ...form, faturamentoEstimado: v })} tipo="number" />
                        <Campo label={tt.lblLimiteCredito} value={form.limiteCredito} onChange={(v) => setForm({ ...form, limiteCredito: v })} tipo="number" />
                        <Campo label={tt.lblCondicaoPagamento} value={form.condicaoPagamento} onChange={(v) => setForm({ ...form, condicaoPagamento: v })} />
                        <Campo label={tt.lblPrazoMedio} value={form.prazoMedio} onChange={(v) => setForm({ ...form, prazoMedio: v })} tipo="number" />
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "comercial" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblSegmento} value={form.segmento} onChange={(v) => setForm({ ...form, segmento: v })} />
                        <CampoSelect label={tt.lblClassificacao} value={form.classificacao} onChange={(v) => setForm({ ...form, classificacao: v })} opcoes={tt.classificacoes} />
                        <Campo label={tt.lblOrigem} value={form.origem} onChange={(v) => setForm({ ...form, origem: v })} />
                        <Campo label={tt.lblResponsavelComercial} value={form.responsavelComercial} onChange={(v) => setForm({ ...form, responsavelComercial: v })} />
                        <Campo label={tt.lblDataPrimeiraCompra} value={form.dataPrimeiraCompra} onChange={(v) => setForm({ ...form, dataPrimeiraCompra: v })} tipo="date" />
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "cobrancas" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: "#fbbf24" }}>{tt.cobrancasEtapaTitulo}</p>
                        {contasDoClienteEditando.length === 0 ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.semDadosNovoCliente}</p>
                        ) : (
                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {contasDoClienteEditando.slice(0, 15).map((c) => (
                              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                <span className="text-xs truncate" style={{ color: "#c8d8f0" }}>{c.descricao}</span>
                                <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color: c.status === "recebido" ? "#34d399" : "#fbbf24" }}>{fmt(c.valor)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "riscos" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: "#f87171" }}>{tt.riscoEtapaTitulo}</p>
                        {!intelDoClienteEditando ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.semDadosNovoCliente}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-2xl font-black" style={{ color: NIVEL_COR[intelDoClienteEditando.ivca.nivel] }}>{intelDoClienteEditando.ivca.total}<span className="text-xs" style={{ color: "#64748b" }}>/1000</span></p>
                            {ordenarSinaisPorSeveridade(intelDoClienteEditando.sinais).slice(0, 4).map((s, i) => (
                              <p key={i} className="text-xs" style={{ color: "#e2e8f0" }}>• {montarNarrativaSinal(lang, s)}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "documentos" && (
                      <CampoTextarea label={tt.lblDocumentosLinks} value={form.documentosLinks} onChange={(v) => setForm({ ...form, documentosLinks: v })} placeholder={tt.documentosLinksPlaceholder} linhas={4} />
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "ia" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: "#a78bfa" }}>{tt.iaEtapaTitulo}</p>
                        {!parecerDoClienteEditando ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.semDadosNovoCliente}</p>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-xs" style={{ color: "#e2e8f0" }}>{parecerDoClienteEditando.resumo}</p>
                            <p className="text-xs" style={{ color: "#a78bfa" }}>→ {parecerDoClienteEditando.sugestao}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {ETAPAS_CADASTRO[etapaCadastro] === "observacoes" && (
                      <CampoTextarea label={tt.lblObservacoes} value={form.observacoes} onChange={(v) => setForm({ ...form, observacoes: v })} linhas={3} />
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {etapaCadastro > 0 ? (
                      <button onClick={() => setEtapaCadastro(etapaCadastro - 1)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{tt.anterior}</button>
                    ) : (
                      <button onClick={fecharModalCliente} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    )}
                    {etapaCadastro < ETAPAS_CADASTRO.length - 1 ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setEtapaCadastro(etapaCadastro + 1)}
                        className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>{tt.proximo}</motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCliente} disabled={salvandoCliente}
                        className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>{salvandoCliente ? "..." : tt.finalizarCadastro}</motion.button>
                    )}
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal Conta — Cobrança Enterprise */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalConta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
                <CanvasBox cor="#34d399">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399" }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cl.novaCobranca}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => { setModalConta(false); setFormConta(FORM_CONTA_VAZIO); }} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>

                  <div className="space-y-5">
                    {/* Básico */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{tt.secBasico}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={cl.descricao} value={formConta.descricao} onChange={(v) => setFormConta({ ...formConta, descricao: v })} />
                        <CampoSelect label={cl.cliente} value={formConta.clienteId} onChange={(v) => setFormConta({ ...formConta, clienteId: v })}
                          opcoes={clientes.map((c) => ({ value: c.id, label: c.nome }))} placeholder={`-- ${cl.cliente} --`} />
                        <Campo label={cl.valor} value={formConta.valor} onChange={(v) => setFormConta({ ...formConta, valor: v })} tipo="number" />
                        <Campo label={tt.lblDesconto} value={formConta.valorDesconto} onChange={(v) => setFormConta({ ...formConta, valorDesconto: v })} tipo="number" />
                        <Campo label={tt.lblEmissao} value={formConta.emissao} onChange={(v) => setFormConta({ ...formConta, emissao: v })} tipo="date" />
                        <Campo label={cl.vencimento} value={formConta.vencimento} onChange={(v) => setFormConta({ ...formConta, vencimento: v })} tipo="date" />
                        <Campo label={tt.lblCompetencia} value={formConta.competencia} onChange={(v) => setFormConta({ ...formConta, competencia: v })} tipo="date" />
                        <div className="rounded-xl px-4 py-3" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
                          <p className="text-[10px] uppercase" style={{ color: "#64748b" }}>{tt.lblValorFinal}</p>
                          <p className="text-sm font-black" style={{ color: "#34d399" }}>{fmt(valorFinalConta)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Documentação */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{tt.secDocumentacao}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblNumeroCobranca} value={formConta.numeroDocumento} onChange={(v) => setFormConta({ ...formConta, numeroDocumento: v })} />
                        <Campo label={tt.lblCategoria} value={formConta.categoria} onChange={(v) => setFormConta({ ...formConta, categoria: v })} />
                        <Campo label={tt.lblContrato} value={formConta.contratoRef} onChange={(v) => setFormConta({ ...formConta, contratoRef: v })} />
                        <CampoSelect label={tt.lblCentroReceita} value={formConta.centroCustoId} onChange={(v) => setFormConta({ ...formConta, centroCustoId: v })}
                          opcoes={centrosCusto.map((c) => ({ value: c.id, label: c.nome }))} />
                        <Campo label={tt.lblContaContabil} value={formConta.contaContabil} onChange={(v) => setFormConta({ ...formConta, contaContabil: v })} />
                        <Campo label={tt.lblBancoRecebedor} value={formConta.bancoRecebedor} onChange={(v) => setFormConta({ ...formConta, bancoRecebedor: v })} />
                      </div>
                    </div>

                    {/* Pagamento */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{tt.secPagamento}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.formaRecebLbl} value={formConta.formaRecebimento} onChange={(v) => setFormConta({ ...formConta, formaRecebimento: v })} />
                        <Campo label={tt.parcelasLbl} value={formConta.parcelas} onChange={(v) => setFormConta({ ...formConta, parcelas: v })} tipo="number" />
                        <Campo label={tt.jurosLbl} value={formConta.taxaJuros} onChange={(v) => setFormConta({ ...formConta, taxaJuros: v })} tipo="number" />
                        <Campo label={tt.multaLbl} value={formConta.taxaMulta} onChange={(v) => setFormConta({ ...formConta, taxaMulta: v })} tipo="number" />
                        <CampoCheckbox label={tt.lblRecorrente} checked={formConta.recorrente} onChange={(v) => setFormConta({ ...formConta, recorrente: v })} />
                        {formConta.recorrente && (
                          <CampoSelect label={tt.lblFrequencia} value={formConta.frequenciaRecorrencia} onChange={(v) => setFormConta({ ...formConta, frequenciaRecorrencia: v })} opcoes={tt.freqOpcoes} />
                        )}
                      </div>
                    </div>

                    {/* Inteligência — preview somente leitura */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{tt.secInteligenciaConta}</p>
                      {!previewCobranca ? (
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.selecioneClientePrevisao}</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.scoreRecebimentoLbl}</p>
                            <p className="text-sm font-black" style={{ color: previewCobranca.score >= 70 ? "#34d399" : previewCobranca.score >= 40 ? "#fbbf24" : "#f87171" }}>{previewCobranca.score}/100</p>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>{tt.probInadimplenciaLbl}</p>
                            <p className="text-sm font-black" style={{ color: previewCobranca.prob <= 30 ? "#34d399" : previewCobranca.prob <= 60 ? "#fbbf24" : "#f87171" }}>{previewCobranca.prob}%</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Anexo & Observações */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#34d399" }}>{tt.secAnexoObs}</p>
                      <div className="space-y-3">
                        <Campo label={tt.lblAnexoUrl} value={formConta.anexoUrl} onChange={(v) => setFormConta({ ...formConta, anexoUrl: v })} placeholder="https://..." />
                        <CampoTextarea label={tt.observacoesLbl} value={formConta.observacoes} onChange={(v) => setFormConta({ ...formConta, observacoes: v })} linhas={2} />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button onClick={() => { setModalConta(false); setFormConta(FORM_CONTA_VAZIO); }} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={salvarConta} disabled={salvandoConta}
                        className="flex-1 py-3 rounded-xl text-sm font-bold"
                        style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                        {salvandoConta ? "..." : cl.salvarCobranca}
                      </motion.button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Centro de Compartilhamento */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {shareAberto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-start justify-center pt-24 pb-8 z-[100] px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md max-h-[calc(100vh-8rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <CanvasBox cor="#6ab0ff">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {canais.map((c) => (
                      <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>{c.nome}</a>
                    ))}
                    <button onClick={copiar} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>{copiado ? cx.copiado : cx.copiar}</button>
                    <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.4)", color: "#fdba74" }}>PDF</button>
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ModuloLayout>
  );
}
