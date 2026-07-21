"use client";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  Pencil, Trash2, X, Phone, Mail, MapPin, FileText, ChevronRight, ChevronLeft,
  Award, Users, AlertTriangle, Clock, MessageCircle, Send, HeartPulse, Layers,
  Share2, Briefcase, Globe, ShoppingBag, ClipboardList, Radar as IconRadar,
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
  nomeClassificacao,
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

type FormCliente = {
  nome: string; email: string; telefone: string; documento: string; status: string;
  razaoSocial: string; nomeFantasia: string; inscricaoEstadual: string; whatsapp: string; site: string;
  responsavel: string; cargo: string; segmento: string; porte: string; regimeTributario: string;
  numFuncionarios: string; faturamentoEstimado: string; origem: string; responsavelComercial: string;
  condicaoPagamento: string; prazoMedio: string; limiteCredito: string; classificacao: string;
  estado: string; cidade: string; dataPrimeiraCompra: string; observacoes: string;
};
const FORM_VAZIO: FormCliente = {
  nome: "", email: "", telefone: "", documento: "", status: "ativo",
  razaoSocial: "", nomeFantasia: "", inscricaoEstadual: "", whatsapp: "", site: "",
  responsavel: "", cargo: "", segmento: "", porte: "", regimeTributario: "",
  numFuncionarios: "", faturamentoEstimado: "", origem: "", responsavelComercial: "",
  condicaoPagamento: "", prazoMedio: "", limiteCredito: "", classificacao: "cliente",
  estado: "", cidade: "", dataPrimeiraCompra: "", observacoes: "",
};

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

  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);

  const [modalConta, setModalConta] = useState(false);
  const [descricaoConta, setDescricaoConta] = useState("");
  const [valorConta, setValorConta] = useState("");
  const [vencimentoConta, setVencimentoConta] = useState("");
  const [clienteConta, setClienteConta] = useState("");
  const [salvandoConta, setSalvandoConta] = useState(false);

  const [inputChat, setInputChat] = useState("");
  const [mensagensChat, setMensagensChat] = useState<{ role: "user" | "assistant"; texto: string }[]>([]);
  const [chatCarregando, setChatCarregando] = useState(false);

  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { carregarDados(); buscarEstados().then((r) => setEstados(r.dados)); }, []);

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
    if (!descricaoConta.trim() || !valorConta || !vencimentoConta) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("contas_receber").insert({ descricao: descricaoConta, valor: parseFloat(valorConta), data_vencimento: vencimentoConta, status: "pendente", cliente_id: clienteConta || null, user_id: user.id, empresa_id: empresaId });
    setModalConta(false);
    setDescricaoConta(""); setValorConta(""); setVencimentoConta(""); setClienteConta("");
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
    });
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false); setEditandoCliente(null); setForm(FORM_VAZIO); setMunicipios([]);
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

  const valorEmAtrasoCarteira = snapshotCarteira.clientesSnapshot.reduce((s, c) => s + c.valorEmAtrasoAtual, 0);
  const inadimplenciaCarteiraPct = snapshotCarteira.valorTotalCarteira > 0 ? (valorEmAtrasoCarteira / snapshotCarteira.valorTotalCarteira) * 100 : 0;
  const top5Valor = [...snapshotCarteira.clientesSnapshot].sort((a, b) => b.valorTotalCobrado - a.valorTotalCobrado).slice(0, 5).reduce((s, c) => s + c.valorTotalCobrado, 0);
  const concentracaoTop5Pct = snapshotCarteira.valorTotalCarteira > 0 ? (top5Valor / snapshotCarteira.valorTotalCarteira) * 100 : 0;

  const distribuicaoNiveis = { critico: 0, atencao: 0, bom: 0, excelente: 0 } as Record<string, number>;
  intel.forEach((i) => { distribuicaoNiveis[i.ivca.nivel]++; });

  const kpisCarteira = useMemo(() => calcularKpisCarteiraExecutivo(clientes, intel), [clientes, intel]);
  const radarCarteira = useMemo(() => montarRadarCarteira(intel), [intel]);
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
      onNovo={() => { setEditandoCliente(null); setForm(FORM_VAZIO); setModalCliente(true); }}
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

      {/* Modal Cliente — Cadastro Executivo */}
      <AnimatePresence>
        {modalCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-10 pb-8 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-2xl">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoCliente ? cl.editarCliente : cl.novoCliente}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalCliente} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>

                <div className="space-y-5">
                  {/* Identificação */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>{tt.secIdentificacao}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Campo label={cl.nome} value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                      <Campo label={tt.lblRazaoSocial} value={form.razaoSocial} onChange={(v) => setForm({ ...form, razaoSocial: v })} />
                      <Campo label={tt.lblNomeFantasia} value={form.nomeFantasia} onChange={(v) => setForm({ ...form, nomeFantasia: v })} />
                      <Campo label={cl.documento} value={form.documento} onChange={(v) => setForm({ ...form, documento: v })} />
                      <Campo label={tt.lblInscricaoEstadual} value={form.inscricaoEstadual} onChange={(v) => setForm({ ...form, inscricaoEstadual: v })} />
                      <CampoSelect label={tt.lblStatus} value={form.status} onChange={(v) => setForm({ ...form, status: v })} opcoes={[{ value: "ativo", label: cl.ativo }, { value: "inativo", label: cl.inativo }]} />
                    </div>
                  </div>

                  {/* Contato */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>{tt.secContato}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Campo label={cl.telefone} value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
                      <Campo label={tt.lblWhatsapp} value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
                      <Campo label={cl.email} value={form.email} onChange={(v) => setForm({ ...form, email: v })} tipo="email" />
                      <Campo label={tt.lblSite} value={form.site} onChange={(v) => setForm({ ...form, site: v })} />
                      <Campo label={tt.lblResponsavel} value={form.responsavel} onChange={(v) => setForm({ ...form, responsavel: v })} />
                      <Campo label={tt.lblCargo} value={form.cargo} onChange={(v) => setForm({ ...form, cargo: v })} />
                    </div>
                  </div>

                  {/* Comercial */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>{tt.secComercial}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Campo label={tt.lblSegmento} value={form.segmento} onChange={(v) => setForm({ ...form, segmento: v })} />
                      <CampoSelect label={tt.lblPorte} value={form.porte} onChange={(v) => setForm({ ...form, porte: v })} opcoes={tt.portePorte} />
                      <CampoSelect label={tt.lblRegimeTributario} value={form.regimeTributario} onChange={(v) => setForm({ ...form, regimeTributario: v })} opcoes={tt.regimes} />
                      <CampoSelect label={tt.lblClassificacao} value={form.classificacao} onChange={(v) => setForm({ ...form, classificacao: v })} opcoes={tt.classificacoes} />
                      <Campo label={tt.lblNumFuncionarios} value={form.numFuncionarios} onChange={(v) => setForm({ ...form, numFuncionarios: v })} tipo="number" />
                      <Campo label={tt.lblFaturamentoEstimado} value={form.faturamentoEstimado} onChange={(v) => setForm({ ...form, faturamentoEstimado: v })} tipo="number" />
                      <Campo label={tt.lblOrigem} value={form.origem} onChange={(v) => setForm({ ...form, origem: v })} />
                      <Campo label={tt.lblResponsavelComercial} value={form.responsavelComercial} onChange={(v) => setForm({ ...form, responsavelComercial: v })} />
                      <Campo label={tt.lblCondicaoPagamento} value={form.condicaoPagamento} onChange={(v) => setForm({ ...form, condicaoPagamento: v })} />
                      <Campo label={tt.lblPrazoMedio} value={form.prazoMedio} onChange={(v) => setForm({ ...form, prazoMedio: v })} tipo="number" />
                      <Campo label={tt.lblLimiteCredito} value={form.limiteCredito} onChange={(v) => setForm({ ...form, limiteCredito: v })} tipo="number" />
                      <Campo label={tt.lblDataPrimeiraCompra} value={form.dataPrimeiraCompra} onChange={(v) => setForm({ ...form, dataPrimeiraCompra: v })} tipo="date" />
                    </div>
                  </div>

                  {/* Endereço Inteligente */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>{tt.secEndereco}</p>
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

                  {/* Observações */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: "#6ab0ff" }}>{tt.secObs}</p>
                    <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      rows={2} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none" style={inputStyle} />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModalCliente} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvarCliente} disabled={salvandoCliente}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {salvandoCliente ? "..." : cl.salvarCliente}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Conta */}
      <AnimatePresence>
        {modalConta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cl.novaCobranca}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalConta(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: cl.descricao, value: descricaoConta, set: setDescricaoConta, type: "text" },
                    { label: cl.valor, value: valorConta, set: setValorConta, type: "number" },
                    { label: cl.vencimento, value: vencimentoConta, set: setVencimentoConta, type: "date" },
                  ].map((campo) => (
                    <div key={campo.label}>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input type={campo.type} value={campo.value} onChange={(e) => campo.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.cliente}</label>
                    <select value={clienteConta} onChange={(e) => setClienteConta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {cl.cliente} --</option>
                      {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConta(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
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
      </AnimatePresence>

      {/* Centro de Compartilhamento */}
      <AnimatePresence>
        {shareAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-start justify-center pt-20 pb-8 z-50 px-4 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
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
      </AnimatePresence>
    </ModuloLayout>
  );
}
