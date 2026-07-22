"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Search, Trash2, Pencil, X, Building2, FileText, CheckCircle2, Check,
  AlertTriangle, Download, Sparkles, Clock, Share2, ChevronRight, Gauge, Trophy,
} from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { buscarEstados, buscarMunicipios, type EstadoIBGE, type MunicipioIBGE } from "../../../lib/ibgeApi";
import { consultarCEP, validarCPF, formatarCPF } from "../../../lib/enderecoHelpers";
import { validarCNPJ, formatarCNPJ, formatarTelefone } from "../../../lib/empresaHelpers";
import {
  resolverPeriodo, periodoAnterior, optRadar, optBarrasV, optRosca, optVelocimetro, radarRenovacoes,
  serieRolling, detectarAnomaliasHistoricas, detectarDesperdicio, montarDRE, simularCenariosExecutivos, FONTE_EXEC,
  type Periodo, type PeriodoPreset, type ItemRenovavel, type Lancamento, type ItemDespesa, type ChoqueSimulador,
} from "../../../lib/cfoCore";
import { cfoT, canaisCompartilhamento } from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";
import {
  TIPOS_DOCUMENTO_FORNECEDOR,
  listarContatos, criarContato, atualizarContato, excluirContato,
  uploadDocumentoFornecedor, listarDocumentos, criarDocumentoFornecedor, atualizarDocumentoFornecedor, excluirDocumentoFornecedor, gerarUrlDocumentoFornecedor,
  listarContratos, criarContrato, atualizarContrato, excluirContrato,
  listarProdutos, criarProduto, atualizarProduto, excluirProduto,
  listarInteracoes, criarInteracao, atualizarInteracao, excluirInteracao,
  documentosVencendo, contratosVencendo,
  comprasNoPeriodo, concentracaoFornecedores, diversificacaoFornecedores, curvaABC, distribuicaoGeografica,
  riscoMedioCarteira, qualidadeMediaCarteira, pontualidadePagamento, tempoMedioRelacionamentoDias,
  rankingScoreAxioma, scoreMedioCarteiraAxioma,
  inflacaoFornecedor, oportunidadesConsolidacao, fornecedoresParados, precoAcimaMediaInterna,
  pctChoqueDoFornecedor, estimativaCaixaPrazo, avaliarCreditoReforma, sugerirDadosContaPorFornecedor,
  type FornecedorContato, type FornecedorDocumento, type FornecedorContrato, type FornecedorProduto, type FornecedorInteracao,
} from "../../../lib/fornecedorHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Identidade visual do módulo — âmbar/bronze (diferente do azul neutro usado em status)
const AMBAR = "#f59e0b";
const BRONZE = "#b45309";

const categorias = ["Produtos", "Marketing", "Logística", "Tecnologia", "Serviços", "Outros"];
const formasPagamento = ["PIX", "Crédito", "Débito", "Boleto", "Dinheiro", "Transferência"];
const moedas = ["BRL", "USD", "EUR"];

// Campos de formulário fora do componente — evita remount do input a cada tecla
const inputCls = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,158,11,0.2)", color: "#c8d8f0" };
const selectStyle = { background: "rgba(10,22,40,0.95)", border: "1px solid rgba(245,158,11,0.2)", color: "#c8d8f0" };
const labelCls = "text-xs font-semibold mb-1 block";
const labelStyle = { color: "#d4a017" };

function Campo({ label, value, onChange, onBlur, tipo = "text", placeholder, erro }: { label: string; value: string; onChange: (v: string) => void; onBlur?: () => void; tipo?: string; placeholder?: string; erro?: string }) {
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <input type={tipo} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder}
        className={inputCls} style={inputStyle} />
      {erro && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{erro}</p>}
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

// Códigos ISO-3166 alpha-2 — os nomes vêm de Intl.DisplayNames no idioma ativo,
// então não precisa manter ~195 nomes traduzidos à mão.
const CODIGOS_PAISES = [
  "BR", "US", "CA", "MX", "AR", "CL", "CO", "PE", "UY", "PY", "BO", "EC", "VE",
  "PT", "ES", "FR", "DE", "IT", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI",
  "IE", "GB", "PL", "CZ", "GR", "RO", "HU", "RU", "UA",
  "CN", "JP", "KR", "IN", "SG", "AE", "SA", "IL", "TR",
  "AU", "NZ", "ZA", "EG", "NG",
] as const;

function nomesPaises(locale: string): { value: string; label: string }[] {
  let dn: Intl.DisplayNames | null = null;
  try { dn = new Intl.DisplayNames([locale], { type: "region" }); } catch { dn = null; }
  return CODIGOS_PAISES
    .map((c) => ({ value: c, label: dn?.of(c) || c }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

function CampoPaisAutocomplete({ label, value, onChange, opcoes }: { label: string; value: string; onChange: (v: string) => void; opcoes: { value: string; label: string }[] }) {
  const atual = opcoes.find((o) => o.value === value);
  return (
    <div>
      <label className={labelCls} style={labelStyle}>{label}</label>
      <input key={value} list="axioma-paises" defaultValue={atual?.label || value}
        onChange={(e) => {
          const escolhido = opcoes.find((o) => o.label === e.target.value || o.value === e.target.value.toUpperCase());
          if (escolhido) onChange(escolhido.value);
        }}
        className={inputCls} style={inputStyle} />
      <datalist id="axioma-paises">
        {opcoes.map((o) => <option key={o.value} value={o.label} />)}
      </datalist>
    </div>
  );
}

type Fornecedor = {
  id: string;
  nome: string;
  produto_servico: string;
  contato: string;
  valor_mensal: number;
  categoria?: string;
  tipo_pessoa?: string;
  documento?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  responsavel?: string;
  pais?: string | null;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
  condicao_pagamento?: string;
  status?: string;
  observacoes?: string;
  // Fase 1 — Cadastro Enterprise (colunas novas, opcionais até o SQL rodar no Supabase)
  porte?: string | null;
  regime_tributario?: string | null;
  inscricao_municipal?: string | null;
  contribuinte_icms?: string | null;
  prazo_medio_dias?: number | null;
  moeda?: string | null;
  centro_custo_id?: string | null;
  forma_pagamento_preferencial?: string | null;
  nivel_qualidade?: string | null;
  certificacoes?: string | null;
  observacoes_qualidade?: string | null;
  classificacao_risco?: string | null;
  nivel_dependencia?: string | null;
  created_at?: string | null;
};

type ContaPagar = {
  id: string;
  fornecedor_id: string | null;
  descricao: string;
  numero_nota?: string;
  categoria?: string;
  valor_total: number;
  valor_pago: number;
  forma_pagamento?: string;
  parcelas?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: string;
  observacoes?: string;
};

const fornVazio = {
  nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "",
  tipo_pessoa: "PJ", documento: "", razao_social: "", nome_fantasia: "", inscricao_estadual: "",
  email: "", telefone: "", responsavel: "", pais: "BR", cep: "", endereco: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", banco: "", agencia: "", conta: "", chave_pix: "",
  condicao_pagamento: "", status: "ativo", observacoes: "",
  porte: "", inscricao_municipal: "", regime_tributario: "", contribuinte_icms: "",
  prazo_medio_dias: "", moeda: "BRL", centro_custo_id: "", forma_pagamento_preferencial: "",
  nivel_qualidade: "", certificacoes: "", observacoes_qualidade: "",
  classificacao_risco: "", nivel_dependencia: "",
};

const contaVazia = {
  fornecedor_id: "", descricao: "", numero_nota: "", categoria: categorias[0],
  valor_total: "", valor_pago: "", forma_pagamento: formasPagamento[0], parcelas: "1",
  data_emissao: "", data_vencimento: "", observacoes: "",
};

const ETAPAS_CADASTRO = ["identificacao", "contatos", "endereco", "documentacao", "fiscal", "financeiro", "contratos", "produtos", "qualidade", "risco", "ia", "observacoes"] as const;
type EtapaCadastro = typeof ETAPAS_CADASTRO[number];

const T = {
  pt: {
    etapaNomes: { identificacao: "Identificação", contatos: "Contatos", endereco: "Endereço", documentacao: "Documentos", fiscal: "Fiscal", financeiro: "Financeiro", contratos: "Contratos", produtos: "Produtos", qualidade: "Qualidade", risco: "Risco", ia: "Inteligência IA", observacoes: "Observações" } as Record<EtapaCadastro, string>,
    anterior: "Anterior", proximo: "Próximo", concluirCadastro: "Concluir Cadastro", editarFornecedor: "Editar Fornecedor",
    lblTipoPessoa: "Tipo de Pessoa", pessoaJuridica: "Pessoa Jurídica", pessoaFisica: "Pessoa Física",
    lblRazaoSocial: "Razão Social", lblNomeFantasia: "Nome Fantasia", lblPorte: "Porte",
    portes: [{ value: "mei", label: "MEI" }, { value: "me", label: "Microempresa" }, { value: "epp", label: "Pequeno Porte" }, { value: "medio", label: "Médio Porte" }, { value: "grande", label: "Grande Porte" }],
    lblCategoria: "Categoria", lblStatus: "Status", ativo: "Ativo", inativo: "Inativo",
    lblValorMensal: "Gasto Mensal (R$)", lblResumoFornecimento: "Resumo do Fornecimento",
    contatoPrincipalTitulo: "Contato Principal", lblResponsavel: "Responsável", lblTelefone: "Telefone", lblEmail: "E-mail",
    outrosContatosTitulo: "Outros Contatos", outrosContatosVazio: "Nenhum contato adicional cadastrado.",
    adicionarContato: "Adicionar Contato", lblNomeContato: "Nome", lblCargoContato: "Cargo", lblWhatsapp: "WhatsApp",
    contatoPrincipalCheck: "Marcar como contato principal da lista",
    salveFornecedorPrimeiro: "Preencha o nome na etapa Identificação e clique em Próximo para liberar esta etapa.",
    erroNomeObrigatorio: "Falta o nome na etapa Identificação — preencha para concluir o cadastro.",
    salvarAlteracoes: "Salvar Alterações", cancelarEdicao: "Cancelar",
    erroCnpjInvalido: "CNPJ inválido — confira os dígitos.", erroCpfInvalido: "CPF inválido — confira os dígitos.",
    erroEmailInvalido: "E-mail inválido.", erroTelefoneInvalido: "Telefone inválido — use DDD + número.",
    erroCepInvalido: "CEP inválido — use 8 dígitos.",
    paisLabel: "País", paisValor: "Brasil", lblCep: "CEP", buscandoCep: "buscando...",
    lblEnderecoRua: "Endereço", lblNumero: "Nº", lblBairro: "Bairro", lblComplemento: "Compl.",
    lblEstado: "Estado", lblCidade: "Cidade", selecioneEstado: "Selecione o estado", selecioneCidade: "Selecione a cidade",
    digiteCidadeManual: "Digite a cidade", selecioneEstadoPrimeiro: "Selecione o estado primeiro",
    documentacaoTitulo: "Documentos", documentosVazio: "Nenhum documento cadastrado.",
    lblTipoDocumento: "Tipo", lblNomeDocumento: "Nome do Documento", lblNumeroDocumento: "Número",
    lblEmissao: "Emissão", lblValidade: "Validade", statusVencido: "Vencido", statusAVencer: "A vencer",
    lblArquivo: "Arquivo", adicionarDocumento: "Adicionar Documento", enviando: "Enviando...", baixar: "Baixar",
    lblInscricaoEstadual: "Inscrição Estadual", lblInscricaoMunicipal: "Inscrição Municipal", lblRegimeTributario: "Regime Tributário",
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Lucro Presumido" }, { value: "real", label: "Lucro Real" }, { value: "mei", label: "MEI" }, { value: "nao_informado", label: "Não Informado" }],
    lblContribuinteIcms: "Contribuinte de ICMS", contribuintes: [{ value: "sim", label: "Sim" }, { value: "nao", label: "Não" }, { value: "isento", label: "Isento" }],
    lblBanco: "Banco", lblAgencia: "Agência", lblConta: "Conta", lblPix: "Chave PIX",
    lblCondicaoPagamento: "Condição de Pagamento", lblPrazoMedio: "Prazo Médio (dias)", lblMoeda: "Moeda",
    lblCentroCusto: "Centro de Custo", selecioneCentroCusto: "Sem centro de custo",
    lblFormaPagamentoPreferencial: "Forma de Pagamento Preferencial",
    contratosTitulo: "Contratos", contratosVazio: "Nenhum contrato cadastrado.",
    lblDescricaoContrato: "Descrição", lblDataInicio: "Início", lblDataFim: "Fim",
    lblRenovacaoAutomatica: "Renovação Automática", lblIndiceReajuste: "Índice de Reajuste",
    lblValorContratado: "Valor Contratado", lblValorUtilizado: "Valor Utilizado", saldoContrato: "Saldo",
    adicionarContrato: "Adicionar Contrato",
    produtosTitulo: "Produtos e Serviços", produtosVazio: "Nenhum produto/serviço cadastrado.",
    lblDescricaoProduto: "Descrição", lblCategoriaProduto: "Categoria", lblValorUnitario: "Valor Unitário", lblUnidade: "Unidade",
    adicionarProduto: "Adicionar",
    qualidadeTitulo: "Qualidade", lblNivelQualidade: "Nível de Qualidade",
    niveisQualidade: [{ value: "nao_avaliado", label: "Não Avaliado" }, { value: "ruim", label: "Ruim" }, { value: "regular", label: "Regular" }, { value: "bom", label: "Bom" }, { value: "excelente", label: "Excelente" }],
    lblCertificacoes: "Certificações", certificacoesPlaceholder: "ex: ISO 9001, ISO 14001",
    lblObservacoesQualidade: "Observações de Qualidade",
    riscoTitulo: "Risco", riscoTexto: "Classificação manual — sem cálculo automático nesta fase.",
    lblClassificacaoRisco: "Classificação de Risco",
    classificacoesRisco: [{ value: "baixo", label: "Baixo" }, { value: "medio", label: "Médio" }, { value: "alto", label: "Alto" }],
    lblNivelDependencia: "Dependência do Fornecedor",
    niveisDependencia: [{ value: "baixo", label: "Baixo — facilmente substituível" }, { value: "medio", label: "Médio" }, { value: "alto", label: "Alto — crítico para a operação" }],
    iaTitulo: "Inteligência IA", iaTexto: "Reservado para a próxima fase de IA real (Claude API). Quando a chave for ativada, este espaço vai trazer um parecer executivo automático sobre este fornecedor.",
    lblObservacoesGerais: "Observações", timelineTitulo: "Timeline de Interações", timelineVazio: "Nenhuma interação registrada.",
    lblDataInteracao: "Data", lblTipoInteracao: "Tipo", lblDescricaoInteracao: "Descrição", adicionarInteracao: "Registrar Interação",
    kpiDocumentosVencer: "Documentos a Vencer (30d)", kpiContratosVencer: "Contratos a Vencer (30d)",
    remover: "Remover",
    dashboardTitulo: "Dashboard Executivo", dashboardSub: "Visão consolidada da carteira de fornecedores — clique em qualquer indicador para o detalhe.",
    kpiTotal: "Total de Fornecedores", kpiAtivos: "Fornecedores Ativos", kpiInativos: "Fornecedores Inativos",
    kpiValorContratado: "Valor Total Contratado", kpiComprasMes: "Compras do Mês", kpiComprasAno: "Compras do Ano",
    kpiEconomiaObtida: "Economia Obtida", kpiEconomiaPotencial: "Economia Potencial", kpiIndiceNegociacao: "Índice de Negociação",
    kpiDependenciaFinanceira: "Dependência Financeira", kpiDiversificacao: "Diversificação da Cadeia",
    kpiRiscoMedio: "Risco Médio da Carteira", kpiLeadTime: "Lead Time Médio", kpiPontualidade: "Pontualidade de Pagamento",
    kpiQualidade: "Índice de Qualidade", kpiEstabilidade: "Índice de Estabilidade", kpiScoreMedio: "Score Médio dos Fornecedores",
    semDados: "Sem dados suficientes",
    semContratos: "Nenhum contrato cadastrado ainda na etapa Contratos do cadastro.",
    semCompras: "Ainda não há contas a pagar vinculadas a fornecedores suficientes.",
    semClassificacao: "Classifique os fornecedores na etapa Qualidade/Risco do cadastro pra este indicador acender.",
    semPagamentos: "Ainda não há contas pagas suficientes pra calcular pontualidade.",
    semScore: "Score entra em cena assim que houver fornecedores com qualidade/risco/pontualidade suficientes.",
    semInfraestrutura: "Precisa de um módulo que o Axioma ainda não tem (histórico de cotação/preço negociado ou rastreio de entrega) — nada inventado aqui.",
    unidadeMeses: "meses",
    rotuloRisco: ["Baixo", "Médio", "Alto"],
    rotuloQualidade: ["Ruim", "Regular", "Bom", "Excelente"],
    curvaAbcTitulo: "Curva ABC de Fornecedores", curvaAbcSub: "Concentração de gasto — poucos fornecedores puxando a maior parte da compra.",
    curvaAbcVazio: "Sem contas a pagar vinculadas a fornecedores ainda.",
    classeA: "Classe A (80% do gasto)", classeB: "Classe B (até 95%)", classeC: "Classe C (restante)",
    geoTitulo: "Distribuição Geográfica", geoSub: "Fornecedores por estado, conforme o cadastro.",
    geoVazio: "Cadastre o Estado na etapa Endereço pra este mapa acender.",
    radarTitulo: "Radar de Risco da Carteira", radarSub: "Visão consolidada de risco, dependência, concentração, qualidade e pontualidade.",
    radarVazio: "Precisa de fornecedores com risco/qualidade classificados e histórico de compras.",
    eixoRisco: "Risco", eixoDependencia: "Dependência", eixoConcentracao: "Concentração", eixoQualidadeInv: "Qualidade (invertida)", eixoPontualidadeInv: "Atraso de Pagamento",
    escadaTitulo: "Escada de Vencimentos", escadaSub: "Documentos e contratos vencendo nos próximos 6 meses.",
    escadaVazio: "Nenhum documento ou contrato com data de vencimento cadastrada ainda.",
    critRisco: "Risco", critCompliance: "Compliance", critRelacionamento: "Relacionamento",
    critConfiabilidade: "Confiabilidade", critPreco: "Preço", critCapacidadeEntrega: "Capacidade de Entrega",
    critSaudeFinanceira: "Saúde Financeira", critSustentabilidade: "Sustentabilidade", critInovacao: "Inovação", critFlexibilidade: "Flexibilidade",
    nivelCritico: "Crítico", nivelAtencao: "Atenção", nivelSaudavel: "Saudável",
    scoreAxiomaTitulo: "Score Corporativo Axioma", verScore: "Ver Score",
    criteriosTitulo: "Critérios do Score", semDadosCriterio: "Sem dados", pesoLabel: "Peso", contribuicaoLabel: "Contribuição",
    rankingTitulo: "Ranking Axioma", rankingSub: "Fornecedores ordenados pelo Score Corporativo Axioma (0-1000).",
    rankingVazio: "Nenhum fornecedor cadastrado ainda.",
    inteligenciaTitulo: "Inteligência de Compras", inteligenciaSub: "Análises automáticas sobre o que já foi comprado — dado real, nunca inventado.",
    lblSelecioneFornecedor: "Fornecedor",
    evolucaoComprasTitulo: "Evolução de Compras", evolucaoComprasVazio: "Sem histórico de compras para este fornecedor ainda.",
    inflacaoTitulo: "Inflação do Fornecedor", inflacaoVazio: "Precisa de compras no período atual e no anterior para comparar.",
    tendenciaTitulo: "Tendência de Reajuste", tendenciaVazio: "Nenhum padrão de reajuste detectado ainda.",
    tendenciaAcimaMedia: "Acima da própria média", tendenciaAumentoRecorrente: "Aumento recorrente",
    sazonalidadeTitulo: "Sazonalidade", sazonalidadeSub: "Distribuição das compras nos últimos 12 meses — fica mais precisa com mais anos de histórico.", sazonalidadeVazio: "Sem compras registradas ainda.",
    desperdiciosTitulo: "Desperdícios", desperdiciosSub: "Descrições de conta muito parecidas — possível cobrança duplicada.", desperdiciosVazio: "Nenhum desperdício detectado.",
    consolidacaoTitulo: "Oportunidades de Consolidação", consolidacaoSub: "Fornecedores ativos na mesma categoria — economia estimada ao concentrar no de menor ticket médio.", consolidacaoVazio: "Nenhuma categoria com mais de um fornecedor ativo com histórico de compra.",
    economiaEstimadaLabel: "Economia estimada", maisBaratoTag: "menor ticket",
    alertasPainelTitulo: "Painel de Alertas", alertasPainelSub: "Tudo que pede atenção agora, com ação sugerida.", alertasVazio: "Nenhum alerta no momento — carteira sob controle.",
    alertaParadoTitulo: "Fornecedor parado", alertaParadoDesc: "Sem novas compras há", alertaParadoAcao: "Confirmar se o fornecimento continua ativo ou encerrar o cadastro.",
    alertaRiscoTitulo: "Fornecedor em risco", alertaRiscoDesc: "Classificado como risco alto no cadastro.", alertaRiscoAcao: "Revisar dependência e ter um plano B para este fornecedor.",
    alertaContratoTitulo: "Contrato vencendo", alertaContratoAcao: "Iniciar renegociação ou renovação antes do vencimento.",
    alertaDocumentoTitulo: "Documento vencendo", alertaDocumentoAcao: "Solicitar a atualização do documento ao fornecedor.",
    alertaPrecoTitulo: "Preço acima da média interna", alertaPrecoDesc: "Ticket médio acima da média da categoria em", alertaPrecoAcao: "Renegociar ou comparar com os demais fornecedores da categoria.",
    alertaDependenciaTitulo: "Dependência elevada", alertaDependenciaDesc: "Responde por", alertaDependenciaAcao: "Buscar um segundo fornecedor para essa categoria.",
    alertaConcentracaoTitulo: "Compras concentradas", alertaConcentracaoDesc: "Índice de diversificação da carteira em", alertaConcentracaoAcao: "Diversificar a base de fornecedores ativos.",
    alertaAumentoTitulo: "Aumento recorrente de preço", alertaAumentoDesc: "Subiu em 3 compras seguidas:", alertaAumentoAcao: "Questionar o motivo do aumento com o fornecedor.",
    alertaQuedaQualidadeLegenda: "Queda de Qualidade — reservado, precisa de histórico de avaliação ao longo do tempo (ainda não existe).",
    doTotalComprado: "do total comprado",
    simuladorTitulo: "Simulador Executivo", simuladorSub: "Simule o impacto de uma decisão sobre um fornecedor antes de decidir — caixa, margem, EBITDA e capital de giro.",
    lblTipoCenario: "Tipo de Cenário", cenarioTroca: "Troca de Fornecedor", cenarioPreco: "Mudança de Preço", cenarioPrazo: "Mudança de Prazo", cenarioCambio: "Mudança Cambial", cenarioPerda: "Perda de Fornecedor Estratégico", cenarioNovo: "Novo Fornecedor",
    lblFornecedorSimulado: "Fornecedor", lblTipoCusto: "Esse gasto conta como", tipoCustoFixo: "Custo Fixo", tipoCustoVariavel: "Custo Variável",
    lblNovoValor: "Novo Valor Mensal (R$)", lblDeltaPreco: "Variação de Preço (%)", lblDeltaDias: "Variação no Prazo (dias)",
    lblChoqueCambio: "Variação Cambial (%)", lblExposicaoCambial: "% Indexado a Dólar", lblValorSubstituto: "Valor do Substituto (R$, 0 se não substituir)", lblHorizonte: "Horizonte (meses)",
    simuladorVazio: "Selecione um fornecedor e preencha os dados do cenário para simular. Precisa de Receitas/Custos cadastrados para calcular o impacto.",
    colCenario: "Cenário", colReceita: "Receita", colEbitda: "EBITDA", colLucro: "Lucro Líquido", colCaixa: "Caixa Projetado", colMargem: "Margem",
    nomeConservador: "Conservador", nomeBase: "Base", nomeOtimista: "Otimista", nomeAdverso: "Adverso",
    notaCapitalGiro: "Capital de giro aproximado pelo impacto no caixa disponível — o Axioma não tem balanço patrimonial completo (ativo/passivo circulante) ainda.",
    reformaTitulo: "Reforma Tributária 2026 por Fornecedor", reformaSub: "Potencial de cada fornecedor gerar crédito tributário no IVA dual (CBS/IBS), com base no cadastro.",
    reformaAviso: "As alíquotas finais do IBS/CBS ainda não estão regulamentadas — por isso não calculamos R$ de impacto, só o potencial estrutural de crédito. Atualiza automaticamente quando a legislação fechar.",
    nivelPleno: "Crédito Pleno", nivelParcial: "Crédito Parcial", nivelBaixo: "Crédito Baixo", nivelIndefinido: "Indefinido",
    reformaVazio: "Nenhum fornecedor ativo cadastrado ainda.",
    iaExecutivaTitulo: "IA Executiva", iaExecutivaSub: "Recomendações em linguagem de CFO — motor por regras, com o fio pronto pra IA real quando a chave for ativada.",
    iaExecutivaAviso: "Este parecer é gerado por regras determinísticas sobre dado real, não por um modelo de linguagem — mesma transparência do resto do Axioma.",
    iaResumo1: "Carteira com", iaResumo2: "fornecedores ativos monitorados. Score médio Axioma:", iaSemDados: "Cadastre fornecedores para a IA Executiva começar a gerar recomendações.",
    iaInterrupcao1: "Risco de interrupção de fornecimento:", iaInterrupcao2: "fornecedor(es) parado(s) ou classificado(s) como risco alto.",
    iaAumento1: "Detectado aumento anormal de preço em", iaAumento2: "item(ns) recorrente(s) — investigar antes que vire hábito.",
    iaRenegociacao1: "fornecedor(es) com ticket médio acima da média interna da categoria — oportunidade de renegociação.",
    iaEconomia1: "Economia potencial de", iaEconomia2: "identificada ao consolidar fornecedores redundantes.",
    iaNovosFornecedores: "Carteira pouco diversificada — considerar buscar novos fornecedores pra reduzir dependência.",
    iaContratos1: "contrato(s) vencendo em breve — iniciar renegociação agora.",
    iaConcentracao1: "Dependência elevada de", iaConcentracao2: "— concentra", iaOperacional: "Risco operacional médio da carteira está elevado — priorizar plano de contingência para os fornecedores de risco alto.",
    iaImpacto1: "Impacto financeiro em jogo: até", iaImpacto2: "em economia potencial e",
    explicacoes: {
      total: "Contagem simples de todos os fornecedores cadastrados, ativos e inativos.",
      ativos: "Fornecedores com status Ativo no cadastro.",
      inativos: "Fornecedores com status Inativo no cadastro.",
      valorContratado: "Soma do campo Valor Contratado de todos os contratos cadastrados na etapa Contratos.",
      comprasMes: "Soma das contas a pagar emitidas no mês atual, vinculadas a qualquer fornecedor.",
      comprasAno: "Soma das contas a pagar emitidas no ano atual.",
      economiaObtida: "Precisaria de um histórico de preço de tabela vs. preço negociado por compra — o Axioma não guarda isso ainda.",
      economiaPotencial: "Mesmo motivo do indicador anterior — sem base de preço de referência pra comparar.",
      indiceNegociacao: "Exigiria comparar cotações recebidas vs. valor fechado — é o módulo de Cotação/RFQ, ainda não construído.",
      dependenciaFinanceira: "Percentual do total pago a fornecedores que está concentrado no único maior fornecedor — quanto maior, mais arriscado depender dele.",
      diversificacao: "Índice 0-100 baseado na distribuição do gasto entre fornecedores (Herfindahl invertido) — 100 é gasto bem espalhado, 0 é tudo num só.",
      riscoMedio: "Média da Classificação de Risco (Baixo/Médio/Alto) preenchida manualmente no cadastro de cada fornecedor.",
      leadTime: "Mediria o tempo entre pedido e entrega — o Axioma hoje só registra prazo de pagamento, não prazo de entrega.",
      pontualidade: "Percentual das contas pagas por nós dentro do vencimento — mede nosso desempenho pagando, não o desempenho do fornecedor entregando.",
      qualidade: "Média do Nível de Qualidade preenchido manualmente no cadastro de cada fornecedor.",
      estabilidade: "Tempo médio, em meses, desde o cadastro de cada fornecedor ativo — quanto maior, mais estável a relação.",
      scoreMedio: "Média do Score Corporativo Axioma (0-1000, 14 critérios com peso próprio) entre os fornecedores que já têm pelo menos um critério com dado real.",
    },
  },
  en: {
    etapaNomes: { identificacao: "Identification", contatos: "Contacts", endereco: "Address", documentacao: "Documents", fiscal: "Tax", financeiro: "Financial", contratos: "Contracts", produtos: "Products", qualidade: "Quality", risco: "Risk", ia: "AI Intelligence", observacoes: "Notes" } as Record<EtapaCadastro, string>,
    anterior: "Back", proximo: "Next", concluirCadastro: "Finish Registration", editarFornecedor: "Edit Supplier",
    lblTipoPessoa: "Type", pessoaJuridica: "Company", pessoaFisica: "Individual",
    lblRazaoSocial: "Legal Name", lblNomeFantasia: "Trade Name", lblPorte: "Company Size",
    portes: [{ value: "mei", label: "Sole Trader" }, { value: "me", label: "Micro" }, { value: "epp", label: "Small" }, { value: "medio", label: "Medium" }, { value: "grande", label: "Large" }],
    lblCategoria: "Category", lblStatus: "Status", ativo: "Active", inativo: "Inactive",
    lblValorMensal: "Monthly Spend (R$)", lblResumoFornecimento: "Supply Summary",
    contatoPrincipalTitulo: "Main Contact", lblResponsavel: "Contact Person", lblTelefone: "Phone", lblEmail: "Email",
    outrosContatosTitulo: "Other Contacts", outrosContatosVazio: "No additional contacts yet.",
    adicionarContato: "Add Contact", lblNomeContato: "Name", lblCargoContato: "Role", lblWhatsapp: "WhatsApp",
    contatoPrincipalCheck: "Mark as the list's primary contact",
    salveFornecedorPrimeiro: "Fill the name in Identification and click Next to unlock this step.",
    erroNomeObrigatorio: "Name is missing in the Identification step — fill it in to finish the registration.",
    salvarAlteracoes: "Save Changes", cancelarEdicao: "Cancel",
    erroCnpjInvalido: "Invalid CNPJ — check the digits.", erroCpfInvalido: "Invalid CPF — check the digits.",
    erroEmailInvalido: "Invalid e-mail.", erroTelefoneInvalido: "Invalid phone — use area code + number.",
    erroCepInvalido: "Invalid ZIP code — use 8 digits.",
    paisLabel: "Country", paisValor: "Brazil", lblCep: "ZIP Code", buscandoCep: "searching...",
    lblEnderecoRua: "Street", lblNumero: "No.", lblBairro: "District", lblComplemento: "Compl.",
    lblEstado: "State", lblCidade: "City", selecioneEstado: "Select state", selecioneCidade: "Select city",
    digiteCidadeManual: "Type the city", selecioneEstadoPrimeiro: "Select state first",
    documentacaoTitulo: "Documents", documentosVazio: "No documents yet.",
    lblTipoDocumento: "Type", lblNomeDocumento: "Document Name", lblNumeroDocumento: "Number",
    lblEmissao: "Issue Date", lblValidade: "Expiry", statusVencido: "Expired", statusAVencer: "Expiring soon",
    lblArquivo: "File", adicionarDocumento: "Add Document", enviando: "Uploading...", baixar: "Download",
    lblInscricaoEstadual: "State Reg.", lblInscricaoMunicipal: "Municipal Reg.", lblRegimeTributario: "Tax Regime",
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Presumed Profit" }, { value: "real", label: "Real Profit" }, { value: "mei", label: "Sole Trader" }, { value: "nao_informado", label: "Not Informed" }],
    lblContribuinteIcms: "ICMS Taxpayer", contribuintes: [{ value: "sim", label: "Yes" }, { value: "nao", label: "No" }, { value: "isento", label: "Exempt" }],
    lblBanco: "Bank", lblAgencia: "Branch", lblConta: "Account", lblPix: "PIX Key",
    lblCondicaoPagamento: "Payment Terms", lblPrazoMedio: "Avg. Term (days)", lblMoeda: "Currency",
    lblCentroCusto: "Cost Center", selecioneCentroCusto: "No cost center",
    lblFormaPagamentoPreferencial: "Preferred Payment Method",
    contratosTitulo: "Contracts", contratosVazio: "No contracts yet.",
    lblDescricaoContrato: "Description", lblDataInicio: "Start", lblDataFim: "End",
    lblRenovacaoAutomatica: "Auto-Renewal", lblIndiceReajuste: "Adjustment Index",
    lblValorContratado: "Contracted Value", lblValorUtilizado: "Used Value", saldoContrato: "Balance",
    adicionarContrato: "Add Contract",
    produtosTitulo: "Products & Services", produtosVazio: "No products/services yet.",
    lblDescricaoProduto: "Description", lblCategoriaProduto: "Category", lblValorUnitario: "Unit Price", lblUnidade: "Unit",
    adicionarProduto: "Add",
    qualidadeTitulo: "Quality", lblNivelQualidade: "Quality Level",
    niveisQualidade: [{ value: "nao_avaliado", label: "Not Rated" }, { value: "ruim", label: "Poor" }, { value: "regular", label: "Fair" }, { value: "bom", label: "Good" }, { value: "excelente", label: "Excellent" }],
    lblCertificacoes: "Certifications", certificacoesPlaceholder: "e.g. ISO 9001, ISO 14001",
    lblObservacoesQualidade: "Quality Notes",
    riscoTitulo: "Risk", riscoTexto: "Manual classification — no automatic scoring in this phase.",
    lblClassificacaoRisco: "Risk Classification",
    classificacoesRisco: [{ value: "baixo", label: "Low" }, { value: "medio", label: "Medium" }, { value: "alto", label: "High" }],
    lblNivelDependencia: "Supplier Dependency",
    niveisDependencia: [{ value: "baixo", label: "Low — easily replaceable" }, { value: "medio", label: "Medium" }, { value: "alto", label: "High — critical to operations" }],
    iaTitulo: "AI Intelligence", iaTexto: "Reserved for the next phase of real AI (Claude API). Once the key is activated, this space will bring an automatic executive assessment of this supplier.",
    lblObservacoesGerais: "Notes", timelineTitulo: "Interaction Timeline", timelineVazio: "No interactions logged yet.",
    lblDataInteracao: "Date", lblTipoInteracao: "Type", lblDescricaoInteracao: "Description", adicionarInteracao: "Log Interaction",
    kpiDocumentosVencer: "Documents Expiring (30d)", kpiContratosVencer: "Contracts Expiring (30d)",
    remover: "Remove",
    dashboardTitulo: "Executive Dashboard", dashboardSub: "Consolidated view of the supplier portfolio — click any indicator for detail.",
    kpiTotal: "Total Suppliers", kpiAtivos: "Active Suppliers", kpiInativos: "Inactive Suppliers",
    kpiValorContratado: "Total Contracted Value", kpiComprasMes: "Purchases This Month", kpiComprasAno: "Purchases This Year",
    kpiEconomiaObtida: "Savings Achieved", kpiEconomiaPotencial: "Potential Savings", kpiIndiceNegociacao: "Negotiation Index",
    kpiDependenciaFinanceira: "Financial Dependency", kpiDiversificacao: "Supply Chain Diversification",
    kpiRiscoMedio: "Portfolio Average Risk", kpiLeadTime: "Average Lead Time", kpiPontualidade: "Payment Punctuality",
    kpiQualidade: "Quality Index", kpiEstabilidade: "Stability Index", kpiScoreMedio: "Average Supplier Score",
    semDados: "Not enough data",
    semContratos: "No contract registered yet in the Contracts step of the registration.",
    semCompras: "Not enough bills linked to suppliers yet.",
    semClassificacao: "Rate suppliers in the Quality/Risk step of the registration to light this up.",
    semPagamentos: "Not enough paid bills yet to calculate punctuality.",
    semScore: "The score appears once enough suppliers have quality/risk/punctuality data.",
    semInfraestrutura: "Needs a module Axioma doesn't have yet (quote/price history or delivery tracking) — nothing faked here.",
    unidadeMeses: "months",
    rotuloRisco: ["Low", "Medium", "High"],
    rotuloQualidade: ["Poor", "Fair", "Good", "Excellent"],
    curvaAbcTitulo: "Supplier ABC Curve", curvaAbcSub: "Spend concentration — few suppliers driving most of the purchases.",
    curvaAbcVazio: "No bills linked to suppliers yet.",
    classeA: "Class A (80% of spend)", classeB: "Class B (up to 95%)", classeC: "Class C (remaining)",
    geoTitulo: "Geographic Distribution", geoSub: "Suppliers by state, based on registration.",
    geoVazio: "Register the State in the Address step to light this up.",
    radarTitulo: "Portfolio Risk Radar", radarSub: "Consolidated view of risk, dependency, concentration, quality and punctuality.",
    radarVazio: "Needs suppliers with risk/quality rated and purchase history.",
    eixoRisco: "Risk", eixoDependencia: "Dependency", eixoConcentracao: "Concentration", eixoQualidadeInv: "Quality (inverted)", eixoPontualidadeInv: "Payment Delay",
    escadaTitulo: "Expiration Ladder", escadaSub: "Documents and contracts expiring in the next 6 months.",
    escadaVazio: "No document or contract with an expiration date yet.",
    critRisco: "Risk", critCompliance: "Compliance", critRelacionamento: "Relationship",
    critConfiabilidade: "Reliability", critPreco: "Price", critCapacidadeEntrega: "Delivery Capacity",
    critSaudeFinanceira: "Financial Health", critSustentabilidade: "Sustainability", critInovacao: "Innovation", critFlexibilidade: "Flexibility",
    nivelCritico: "Critical", nivelAtencao: "Attention", nivelSaudavel: "Healthy",
    scoreAxiomaTitulo: "Axioma Corporate Score", verScore: "View Score",
    criteriosTitulo: "Score Criteria", semDadosCriterio: "No data", pesoLabel: "Weight", contribuicaoLabel: "Contribution",
    rankingTitulo: "Axioma Ranking", rankingSub: "Suppliers ranked by the Axioma Corporate Score (0-1000).",
    rankingVazio: "No supplier registered yet.",
    inteligenciaTitulo: "Purchase Intelligence", inteligenciaSub: "Automatic analysis of what's already been purchased — real data, never invented.",
    lblSelecioneFornecedor: "Supplier",
    evolucaoComprasTitulo: "Purchase Evolution", evolucaoComprasVazio: "No purchase history for this supplier yet.",
    inflacaoTitulo: "Supplier Inflation", inflacaoVazio: "Needs purchases in both the current and previous period to compare.",
    tendenciaTitulo: "Price Adjustment Trend", tendenciaVazio: "No adjustment pattern detected yet.",
    tendenciaAcimaMedia: "Above its own average", tendenciaAumentoRecorrente: "Recurring increase",
    sazonalidadeTitulo: "Seasonality", sazonalidadeSub: "Purchase distribution over the last 12 months — gets more accurate with more years of history.", sazonalidadeVazio: "No purchases recorded yet.",
    desperdiciosTitulo: "Waste", desperdiciosSub: "Very similar bill descriptions — possible duplicate charge.", desperdiciosVazio: "No waste detected.",
    consolidacaoTitulo: "Consolidation Opportunities", consolidacaoSub: "Active suppliers in the same category — estimated savings by concentrating on the one with the lowest average ticket.", consolidacaoVazio: "No category with more than one active supplier with purchase history.",
    economiaEstimadaLabel: "Estimated savings", maisBaratoTag: "lowest ticket",
    alertasPainelTitulo: "Alerts Panel", alertasPainelSub: "Everything that needs attention now, with a suggested action.", alertasVazio: "No alerts right now — portfolio under control.",
    alertaParadoTitulo: "Inactive supplier", alertaParadoDesc: "No new purchases for", alertaParadoAcao: "Confirm whether supply is still active or close the registration.",
    alertaRiscoTitulo: "Supplier at risk", alertaRiscoDesc: "Rated as high risk in the registration.", alertaRiscoAcao: "Review dependency and have a backup plan for this supplier.",
    alertaContratoTitulo: "Contract expiring", alertaContratoAcao: "Start renegotiation or renewal before expiry.",
    alertaDocumentoTitulo: "Document expiring", alertaDocumentoAcao: "Request an updated document from the supplier.",
    alertaPrecoTitulo: "Price above internal average", alertaPrecoDesc: "Average ticket above the category average by", alertaPrecoAcao: "Renegotiate or compare with other suppliers in the category.",
    alertaDependenciaTitulo: "High dependency", alertaDependenciaDesc: "Accounts for", alertaDependenciaAcao: "Look for a second supplier for this category.",
    alertaConcentracaoTitulo: "Concentrated purchases", alertaConcentracaoDesc: "Portfolio diversification index at", alertaConcentracaoAcao: "Diversify the active supplier base.",
    alertaAumentoTitulo: "Recurring price increase", alertaAumentoDesc: "Rose across 3 consecutive purchases:", alertaAumentoAcao: "Ask the supplier about the reason for the increase.",
    alertaQuedaQualidadeLegenda: "Quality Decline — reserved, needs a rating history over time (doesn't exist yet).",
    doTotalComprado: "of total purchases",
    simuladorTitulo: "Executive Simulator", simuladorSub: "Simulate the impact of a supplier decision before deciding — cash, margin, EBITDA and working capital.",
    lblTipoCenario: "Scenario Type", cenarioTroca: "Supplier Swap", cenarioPreco: "Price Change", cenarioPrazo: "Payment Term Change", cenarioCambio: "FX Change", cenarioPerda: "Loss of Strategic Supplier", cenarioNovo: "New Supplier",
    lblFornecedorSimulado: "Supplier", lblTipoCusto: "This spend counts as", tipoCustoFixo: "Fixed Cost", tipoCustoVariavel: "Variable Cost",
    lblNovoValor: "New Monthly Value (R$)", lblDeltaPreco: "Price Change (%)", lblDeltaDias: "Term Change (days)",
    lblChoqueCambio: "FX Change (%)", lblExposicaoCambial: "% Indexed to USD", lblValorSubstituto: "Replacement Value (R$, 0 if not replacing)", lblHorizonte: "Horizon (months)",
    simuladorVazio: "Select a supplier and fill in the scenario data to simulate. Needs registered Revenue/Costs to calculate the impact.",
    colCenario: "Scenario", colReceita: "Revenue", colEbitda: "EBITDA", colLucro: "Net Profit", colCaixa: "Projected Cash", colMargem: "Margin",
    nomeConservador: "Conservative", nomeBase: "Base", nomeOtimista: "Optimistic", nomeAdverso: "Adverse",
    notaCapitalGiro: "Working capital approximated by the impact on available cash — Axioma doesn't have a full balance sheet (current assets/liabilities) yet.",
    reformaTitulo: "2026 Tax Reform by Supplier", reformaSub: "Each supplier's potential to generate tax credit under the dual VAT (CBS/IBS), based on registration data.",
    reformaAviso: "Final IBS/CBS rates aren't regulated yet — so we don't compute a R$ impact, only the structural credit potential. Updates automatically once legislation is finalized.",
    nivelPleno: "Full Credit", nivelParcial: "Partial Credit", nivelBaixo: "Low Credit", nivelIndefinido: "Undefined",
    reformaVazio: "No active supplier registered yet.",
    iaExecutivaTitulo: "Executive AI", iaExecutivaSub: "CFO-voice recommendations — rules engine, wired for real AI once the key is activated.",
    iaExecutivaAviso: "This assessment is generated by deterministic rules over real data, not a language model — same transparency as the rest of Axioma.",
    iaResumo1: "Portfolio with", iaResumo2: "active suppliers monitored. Average Axioma Score:", iaSemDados: "Register suppliers for Executive AI to start generating recommendations.",
    iaInterrupcao1: "Supply interruption risk:", iaInterrupcao2: "supplier(s) inactive or rated high risk.",
    iaAumento1: "Abnormal price increase detected in", iaAumento2: "recurring item(s) — investigate before it becomes a habit.",
    iaRenegociacao1: "supplier(s) with average ticket above the category's internal average — renegotiation opportunity.",
    iaEconomia1: "Potential savings of", iaEconomia2: "identified by consolidating redundant suppliers.",
    iaNovosFornecedores: "Portfolio poorly diversified — consider looking for new suppliers to reduce dependency.",
    iaContratos1: "contract(s) expiring soon — start renegotiation now.",
    iaConcentracao1: "High dependency on", iaConcentracao2: "— accounts for", iaOperacional: "Average portfolio operational risk is elevated — prioritize a contingency plan for high-risk suppliers.",
    iaImpacto1: "Financial impact at stake: up to", iaImpacto2: "in potential savings and",
    explicacoes: {
      total: "Simple count of all registered suppliers, active and inactive.",
      ativos: "Suppliers with Active status in the registration.",
      inativos: "Suppliers with Inactive status in the registration.",
      valorContratado: "Sum of the Contracted Value field across all contracts registered in the Contracts step.",
      comprasMes: "Sum of bills issued this month, linked to any supplier.",
      comprasAno: "Sum of bills issued this year.",
      economiaObtida: "Would need a list-price vs. negotiated-price history per purchase — Axioma doesn't store that yet.",
      economiaPotencial: "Same reason as above — no reference price base to compare against.",
      indiceNegociacao: "Would require comparing received quotes vs. closed value — that's the Quote/RFQ module, not built yet.",
      dependenciaFinanceira: "Share of total paid to suppliers concentrated in the single largest supplier — the higher, the riskier the dependency.",
      diversificacao: "0-100 index based on how spend is spread across suppliers (inverted Herfindahl) — 100 is well spread, 0 is all in one.",
      riscoMedio: "Average of the Risk Classification (Low/Medium/High) manually set in each supplier's registration.",
      leadTime: "Would measure time between order and delivery — Axioma today only tracks payment terms, not delivery time.",
      pontualidade: "Share of bills we paid on time — measures our performance paying, not the supplier's delivery performance.",
      qualidade: "Average of the Quality Level manually set in each supplier's registration.",
      estabilidade: "Average time, in months, since each active supplier was registered — the higher, the more stable the relationship.",
      scoreMedio: "Average Axioma Corporate Score (0-1000, 14 weighted criteria) among suppliers with at least one criterion backed by real data.",
    },
  },
  es: {
    etapaNomes: { identificacao: "Identificación", contatos: "Contactos", endereco: "Dirección", documentacao: "Documentos", fiscal: "Fiscal", financeiro: "Financiero", contratos: "Contratos", produtos: "Productos", qualidade: "Calidad", risco: "Riesgo", ia: "Inteligencia IA", observacoes: "Observaciones" } as Record<EtapaCadastro, string>,
    anterior: "Anterior", proximo: "Siguiente", concluirCadastro: "Finalizar Registro", editarFornecedor: "Editar Proveedor",
    lblTipoPessoa: "Tipo", pessoaJuridica: "Persona Jurídica", pessoaFisica: "Persona Física",
    lblRazaoSocial: "Razón Social", lblNomeFantasia: "Nombre Comercial", lblPorte: "Tamaño",
    portes: [{ value: "mei", label: "Autónomo" }, { value: "me", label: "Microempresa" }, { value: "epp", label: "Pequeña" }, { value: "medio", label: "Mediana" }, { value: "grande", label: "Grande" }],
    lblCategoria: "Categoría", lblStatus: "Estado", ativo: "Activo", inativo: "Inactivo",
    lblValorMensal: "Gasto Mensual (R$)", lblResumoFornecimento: "Resumen del Suministro",
    contatoPrincipalTitulo: "Contacto Principal", lblResponsavel: "Responsable", lblTelefone: "Teléfono", lblEmail: "Correo",
    outrosContatosTitulo: "Otros Contactos", outrosContatosVazio: "Ningún contacto adicional registrado.",
    adicionarContato: "Agregar Contacto", lblNomeContato: "Nombre", lblCargoContato: "Cargo", lblWhatsapp: "WhatsApp",
    contatoPrincipalCheck: "Marcar como contacto principal de la lista",
    salveFornecedorPrimeiro: "Complete el nombre en Identificación y haga clic en Siguiente para desbloquear esta etapa.",
    erroNomeObrigatorio: "Falta el nombre en la etapa Identificación — complételo para finalizar el registro.",
    salvarAlteracoes: "Guardar Cambios", cancelarEdicao: "Cancelar",
    erroCnpjInvalido: "CNPJ inválido — revise los dígitos.", erroCpfInvalido: "CPF inválido — revise los dígitos.",
    erroEmailInvalido: "E-mail inválido.", erroTelefoneInvalido: "Teléfono inválido — use código de área + número.",
    erroCepInvalido: "Código postal inválido — use 8 dígitos.",
    paisLabel: "País", paisValor: "Brasil", lblCep: "Código Postal", buscandoCep: "buscando...",
    lblEnderecoRua: "Dirección", lblNumero: "Nº", lblBairro: "Barrio", lblComplemento: "Compl.",
    lblEstado: "Estado", lblCidade: "Ciudad", selecioneEstado: "Seleccione el estado", selecioneCidade: "Seleccione la ciudad",
    digiteCidadeManual: "Escriba la ciudad", selecioneEstadoPrimeiro: "Seleccione el estado primero",
    documentacaoTitulo: "Documentos", documentosVazio: "Ningún documento registrado.",
    lblTipoDocumento: "Tipo", lblNomeDocumento: "Nombre del Documento", lblNumeroDocumento: "Número",
    lblEmissao: "Emisión", lblValidade: "Validez", statusVencido: "Vencido", statusAVencer: "Por vencer",
    lblArquivo: "Archivo", adicionarDocumento: "Agregar Documento", enviando: "Enviando...", baixar: "Descargar",
    lblInscricaoEstadual: "Registro Estatal", lblInscricaoMunicipal: "Registro Municipal", lblRegimeTributario: "Régimen Tributario",
    regimes: [{ value: "simples", label: "Simples Nacional" }, { value: "presumido", label: "Lucro Presumido" }, { value: "real", label: "Lucro Real" }, { value: "mei", label: "Autónomo" }, { value: "nao_informado", label: "No Informado" }],
    lblContribuinteIcms: "Contribuyente de ICMS", contribuintes: [{ value: "sim", label: "Sí" }, { value: "nao", label: "No" }, { value: "isento", label: "Exento" }],
    lblBanco: "Banco", lblAgencia: "Agencia", lblConta: "Cuenta", lblPix: "Clave PIX",
    lblCondicaoPagamento: "Condición de Pago", lblPrazoMedio: "Plazo Medio (días)", lblMoeda: "Moneda",
    lblCentroCusto: "Centro de Costo", selecioneCentroCusto: "Sin centro de costo",
    lblFormaPagamentoPreferencial: "Forma de Pago Preferida",
    contratosTitulo: "Contratos", contratosVazio: "Ningún contrato registrado.",
    lblDescricaoContrato: "Descripción", lblDataInicio: "Inicio", lblDataFim: "Fin",
    lblRenovacaoAutomatica: "Renovación Automática", lblIndiceReajuste: "Índice de Reajuste",
    lblValorContratado: "Valor Contratado", lblValorUtilizado: "Valor Utilizado", saldoContrato: "Saldo",
    adicionarContrato: "Agregar Contrato",
    produtosTitulo: "Productos y Servicios", produtosVazio: "Ningún producto/servicio registrado.",
    lblDescricaoProduto: "Descripción", lblCategoriaProduto: "Categoría", lblValorUnitario: "Valor Unitario", lblUnidade: "Unidad",
    adicionarProduto: "Agregar",
    qualidadeTitulo: "Calidad", lblNivelQualidade: "Nivel de Calidad",
    niveisQualidade: [{ value: "nao_avaliado", label: "No Evaluado" }, { value: "ruim", label: "Malo" }, { value: "regular", label: "Regular" }, { value: "bom", label: "Bueno" }, { value: "excelente", label: "Excelente" }],
    lblCertificacoes: "Certificaciones", certificacoesPlaceholder: "ej: ISO 9001, ISO 14001",
    lblObservacoesQualidade: "Observaciones de Calidad",
    riscoTitulo: "Riesgo", riscoTexto: "Clasificación manual — sin cálculo automático en esta fase.",
    lblClassificacaoRisco: "Clasificación de Riesgo",
    classificacoesRisco: [{ value: "baixo", label: "Bajo" }, { value: "medio", label: "Medio" }, { value: "alto", label: "Alto" }],
    lblNivelDependencia: "Dependencia del Proveedor",
    niveisDependencia: [{ value: "baixo", label: "Bajo — fácilmente sustituible" }, { value: "medio", label: "Medio" }, { value: "alto", label: "Alto — crítico para la operación" }],
    iaTitulo: "Inteligencia IA", iaTexto: "Reservado para la próxima fase de IA real (Claude API). Cuando la clave sea activada, este espacio traerá un dictamen ejecutivo automático sobre este proveedor.",
    lblObservacoesGerais: "Observaciones", timelineTitulo: "Cronología de Interacciones", timelineVazio: "Ninguna interacción registrada.",
    lblDataInteracao: "Fecha", lblTipoInteracao: "Tipo", lblDescricaoInteracao: "Descripción", adicionarInteracao: "Registrar Interacción",
    kpiDocumentosVencer: "Documentos por Vencer (30d)", kpiContratosVencer: "Contratos por Vencer (30d)",
    remover: "Eliminar",
    dashboardTitulo: "Panel Ejecutivo", dashboardSub: "Vista consolidada de la cartera de proveedores — haga clic en cualquier indicador para el detalle.",
    kpiTotal: "Total de Proveedores", kpiAtivos: "Proveedores Activos", kpiInativos: "Proveedores Inactivos",
    kpiValorContratado: "Valor Total Contratado", kpiComprasMes: "Compras del Mes", kpiComprasAno: "Compras del Año",
    kpiEconomiaObtida: "Ahorro Obtenido", kpiEconomiaPotencial: "Ahorro Potencial", kpiIndiceNegociacao: "Índice de Negociación",
    kpiDependenciaFinanceira: "Dependencia Financiera", kpiDiversificacao: "Diversificación de la Cadena",
    kpiRiscoMedio: "Riesgo Medio de la Cartera", kpiLeadTime: "Lead Time Medio", kpiPontualidade: "Puntualidad de Pago",
    kpiQualidade: "Índice de Calidad", kpiEstabilidade: "Índice de Estabilidad", kpiScoreMedio: "Score Medio de los Proveedores",
    semDados: "Datos insuficientes",
    semContratos: "Ningún contrato registrado aún en la etapa Contratos del registro.",
    semCompras: "Aún no hay suficientes cuentas por pagar vinculadas a proveedores.",
    semClassificacao: "Clasifique los proveedores en la etapa Calidad/Riesgo del registro para activar este indicador.",
    semPagamentos: "Aún no hay suficientes cuentas pagadas para calcular la puntualidad.",
    semScore: "El score aparece cuando haya proveedores con suficiente calidad/riesgo/puntualidad.",
    semInfraestrutura: "Necesita un módulo que Axioma aún no tiene (historial de cotización/precio negociado o seguimiento de entrega) — nada inventado aquí.",
    unidadeMeses: "meses",
    rotuloRisco: ["Bajo", "Medio", "Alto"],
    rotuloQualidade: ["Malo", "Regular", "Bueno", "Excelente"],
    curvaAbcTitulo: "Curva ABC de Proveedores", curvaAbcSub: "Concentración de gasto — pocos proveedores generan la mayor parte de las compras.",
    curvaAbcVazio: "Aún no hay cuentas por pagar vinculadas a proveedores.",
    classeA: "Clase A (80% del gasto)", classeB: "Clase B (hasta 95%)", classeC: "Clase C (resto)",
    geoTitulo: "Distribución Geográfica", geoSub: "Proveedores por estado, según el registro.",
    geoVazio: "Registre el Estado en la etapa Dirección para activar este mapa.",
    radarTitulo: "Radar de Riesgo de la Cartera", radarSub: "Vista consolidada de riesgo, dependencia, concentración, calidad y puntualidad.",
    radarVazio: "Necesita proveedores con riesgo/calidad clasificados e historial de compras.",
    eixoRisco: "Riesgo", eixoDependencia: "Dependencia", eixoConcentracao: "Concentración", eixoQualidadeInv: "Calidad (invertida)", eixoPontualidadeInv: "Atraso de Pago",
    escadaTitulo: "Escalera de Vencimientos", escadaSub: "Documentos y contratos que vencen en los próximos 6 meses.",
    escadaVazio: "Ningún documento o contrato con fecha de vencimiento registrada aún.",
    critRisco: "Riesgo", critCompliance: "Cumplimiento", critRelacionamento: "Relación",
    critConfiabilidade: "Confiabilidad", critPreco: "Precio", critCapacidadeEntrega: "Capacidad de Entrega",
    critSaudeFinanceira: "Salud Financiera", critSustentabilidade: "Sostenibilidad", critInovacao: "Innovación", critFlexibilidade: "Flexibilidad",
    nivelCritico: "Crítico", nivelAtencao: "Atención", nivelSaudavel: "Saludable",
    scoreAxiomaTitulo: "Score Corporativo Axioma", verScore: "Ver Score",
    criteriosTitulo: "Criterios del Score", semDadosCriterio: "Sin datos", pesoLabel: "Peso", contribuicaoLabel: "Contribución",
    rankingTitulo: "Ranking Axioma", rankingSub: "Proveedores ordenados por el Score Corporativo Axioma (0-1000).",
    rankingVazio: "Ningún proveedor registrado aún.",
    inteligenciaTitulo: "Inteligencia de Compras", inteligenciaSub: "Análisis automáticos sobre lo que ya se compró — dato real, nunca inventado.",
    lblSelecioneFornecedor: "Proveedor",
    evolucaoComprasTitulo: "Evolución de Compras", evolucaoComprasVazio: "Sin historial de compras para este proveedor aún.",
    inflacaoTitulo: "Inflación del Proveedor", inflacaoVazio: "Necesita compras en el período actual y en el anterior para comparar.",
    tendenciaTitulo: "Tendencia de Reajuste", tendenciaVazio: "Ningún patrón de reajuste detectado aún.",
    tendenciaAcimaMedia: "Por encima de su propio promedio", tendenciaAumentoRecorrente: "Aumento recurrente",
    sazonalidadeTitulo: "Estacionalidad", sazonalidadeSub: "Distribución de las compras en los últimos 12 meses — se vuelve más precisa con más años de historial.", sazonalidadeVazio: "Sin compras registradas aún.",
    desperdiciosTitulo: "Desperdicios", desperdiciosSub: "Descripciones de cuenta muy parecidas — posible cobro duplicado.", desperdiciosVazio: "Ningún desperdicio detectado.",
    consolidacaoTitulo: "Oportunidades de Consolidación", consolidacaoSub: "Proveedores activos en la misma categoría — ahorro estimado al concentrar en el de menor ticket promedio.", consolidacaoVazio: "Ninguna categoría con más de un proveedor activo con historial de compra.",
    economiaEstimadaLabel: "Ahorro estimado", maisBaratoTag: "menor ticket",
    alertasPainelTitulo: "Panel de Alertas", alertasPainelSub: "Todo lo que necesita atención ahora, con una acción sugerida.", alertasVazio: "Ningún alerta por ahora — cartera bajo control.",
    alertaParadoTitulo: "Proveedor detenido", alertaParadoDesc: "Sin nuevas compras hace", alertaParadoAcao: "Confirmar si el suministro sigue activo o cerrar el registro.",
    alertaRiscoTitulo: "Proveedor en riesgo", alertaRiscoDesc: "Clasificado como riesgo alto en el registro.", alertaRiscoAcao: "Revisar la dependencia y tener un plan B para este proveedor.",
    alertaContratoTitulo: "Contrato por vencer", alertaContratoAcao: "Iniciar renegociación o renovación antes del vencimiento.",
    alertaDocumentoTitulo: "Documento por vencer", alertaDocumentoAcao: "Solicitar la actualización del documento al proveedor.",
    alertaPrecoTitulo: "Precio por encima del promedio interno", alertaPrecoDesc: "Ticket promedio por encima del promedio de la categoría en", alertaPrecoAcao: "Renegociar o comparar con los demás proveedores de la categoría.",
    alertaDependenciaTitulo: "Dependencia elevada", alertaDependenciaDesc: "Representa", alertaDependenciaAcao: "Buscar un segundo proveedor para esta categoría.",
    alertaConcentracaoTitulo: "Compras concentradas", alertaConcentracaoDesc: "Índice de diversificación de la cartera en", alertaConcentracaoAcao: "Diversificar la base de proveedores activos.",
    alertaAumentoTitulo: "Aumento recurrente de precio", alertaAumentoDesc: "Subió en 3 compras seguidas:", alertaAumentoAcao: "Preguntar al proveedor el motivo del aumento.",
    alertaQuedaQualidadeLegenda: "Caída de Calidad — reservado, necesita un historial de evaluación en el tiempo (aún no existe).",
    doTotalComprado: "del total comprado",
    simuladorTitulo: "Simulador Ejecutivo", simuladorSub: "Simule el impacto de una decisión sobre un proveedor antes de decidir — caja, margen, EBITDA y capital de trabajo.",
    lblTipoCenario: "Tipo de Escenario", cenarioTroca: "Cambio de Proveedor", cenarioPreco: "Cambio de Precio", cenarioPrazo: "Cambio de Plazo", cenarioCambio: "Cambio Cambiario", cenarioPerda: "Pérdida de Proveedor Estratégico", cenarioNovo: "Nuevo Proveedor",
    lblFornecedorSimulado: "Proveedor", lblTipoCusto: "Este gasto cuenta como", tipoCustoFixo: "Costo Fijo", tipoCustoVariavel: "Costo Variable",
    lblNovoValor: "Nuevo Valor Mensual (R$)", lblDeltaPreco: "Variación de Precio (%)", lblDeltaDias: "Variación en el Plazo (días)",
    lblChoqueCambio: "Variación Cambiaria (%)", lblExposicaoCambial: "% Indexado al Dólar", lblValorSubstituto: "Valor del Sustituto (R$, 0 si no sustituye)", lblHorizonte: "Horizonte (meses)",
    simuladorVazio: "Seleccione un proveedor y complete los datos del escenario para simular. Necesita Ingresos/Costos registrados para calcular el impacto.",
    colCenario: "Escenario", colReceita: "Ingresos", colEbitda: "EBITDA", colLucro: "Utilidad Neta", colCaixa: "Caja Proyectada", colMargem: "Margen",
    nomeConservador: "Conservador", nomeBase: "Base", nomeOtimista: "Optimista", nomeAdverso: "Adverso",
    notaCapitalGiro: "Capital de trabajo aproximado por el impacto en la caja disponible — Axioma aún no tiene un balance completo (activo/pasivo circulante).",
    reformaTitulo: "Reforma Tributaria 2026 por Proveedor", reformaSub: "Potencial de cada proveedor de generar crédito tributario en el IVA dual (CBS/IBS), según el registro.",
    reformaAviso: "Las alícuotas finales del IBS/CBS aún no están reglamentadas — por eso no calculamos impacto en R$, solo el potencial estructural de crédito. Se actualiza automáticamente cuando la legislación se cierre.",
    nivelPleno: "Crédito Pleno", nivelParcial: "Crédito Parcial", nivelBaixo: "Crédito Bajo", nivelIndefinido: "Indefinido",
    reformaVazio: "Ningún proveedor activo registrado aún.",
    iaExecutivaTitulo: "IA Ejecutiva", iaExecutivaSub: "Recomendaciones en lenguaje de CFO — motor por reglas, con el cable listo para IA real cuando se active la clave.",
    iaExecutivaAviso: "Este dictamen es generado por reglas determinísticas sobre datos reales, no por un modelo de lenguaje — misma transparencia del resto de Axioma.",
    iaResumo1: "Cartera con", iaResumo2: "proveedores activos monitoreados. Score promedio Axioma:", iaSemDados: "Registre proveedores para que la IA Ejecutiva empiece a generar recomendaciones.",
    iaInterrupcao1: "Riesgo de interrupción de suministro:", iaInterrupcao2: "proveedor(es) detenido(s) o clasificado(s) como riesgo alto.",
    iaAumento1: "Aumento anormal de precio detectado en", iaAumento2: "ítem(s) recurrente(s) — investigar antes de que se vuelva hábito.",
    iaRenegociacao1: "proveedor(es) con ticket promedio por encima del promedio interno de la categoría — oportunidad de renegociación.",
    iaEconomia1: "Ahorro potencial de", iaEconomia2: "identificado al consolidar proveedores redundantes.",
    iaNovosFornecedores: "Cartera poco diversificada — considerar buscar nuevos proveedores para reducir la dependencia.",
    iaContratos1: "contrato(s) por vencer pronto — iniciar renegociación ahora.",
    iaConcentracao1: "Dependencia elevada de", iaConcentracao2: "— representa", iaOperacional: "El riesgo operacional promedio de la cartera está elevado — priorizar un plan de contingencia para los proveedores de riesgo alto.",
    iaImpacto1: "Impacto financiero en juego: hasta", iaImpacto2: "en ahorro potencial y",
    explicacoes: {
      total: "Conteo simple de todos los proveedores registrados, activos e inactivos.",
      ativos: "Proveedores con estado Activo en el registro.",
      inativos: "Proveedores con estado Inactivo en el registro.",
      valorContratado: "Suma del campo Valor Contratado de todos los contratos registrados en la etapa Contratos.",
      comprasMes: "Suma de las cuentas por pagar emitidas en el mes actual, vinculadas a cualquier proveedor.",
      comprasAno: "Suma de las cuentas por pagar emitidas en el año actual.",
      economiaObtida: "Necesitaría un historial de precio de lista vs. precio negociado por compra — Axioma aún no lo guarda.",
      economiaPotencial: "Mismo motivo que el anterior — sin base de precio de referencia para comparar.",
      indiceNegociacao: "Requeriría comparar cotizaciones recibidas vs. valor cerrado — es el módulo de Cotización/RFQ, aún no construido.",
      dependenciaFinanceira: "Porcentaje del total pagado a proveedores concentrado en el único mayor proveedor — cuanto mayor, más riesgosa la dependencia.",
      diversificacao: "Índice 0-100 basado en la distribución del gasto entre proveedores (Herfindahl invertido) — 100 es gasto bien distribuido, 0 es todo en uno.",
      riscoMedio: "Promedio de la Clasificación de Riesgo (Bajo/Medio/Alto) definida manualmente en el registro de cada proveedor.",
      leadTime: "Mediría el tiempo entre el pedido y la entrega — Axioma hoy solo registra el plazo de pago, no el plazo de entrega.",
      pontualidade: "Porcentaje de cuentas que pagamos a tiempo — mide nuestro desempeño pagando, no el desempeño de entrega del proveedor.",
      qualidade: "Promedio del Nivel de Calidad definido manualmente en el registro de cada proveedor.",
      estabilidade: "Tiempo promedio, en meses, desde el registro de cada proveedor activo — cuanto mayor, más estable la relación.",
      scoreMedio: "Promedio del Score Corporativo Axioma (0-1000, 14 criterios con peso propio) entre proveedores que ya tienen al menos un criterio con dato real.",
    },
  },
};

export default function Fornecedores() {
  const { t, idioma } = useLanguage();
  const lang = (idioma === "en" || idioma === "es" ? idioma : "pt") as "pt" | "en" | "es";
  const tt = T[lang];

  const [aba, setAba] = useState<"fornecedores" | "contas">("fornecedores");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [todosDocumentos, setTodosDocumentos] = useState<FornecedorDocumento[]>([]);
  const [todosContratos, setTodosContratos] = useState<FornecedorContrato[]>([]);
  const [todasInteracoes, setTodasInteracoes] = useState<FornecedorInteracao[]>([]);
  const [scoreDrillId, setScoreDrillId] = useState<string | null>(null);
  const [fornecedorEvolucaoId, setFornecedorEvolucaoId] = useState<string | null>(null);

  // Simulador Executivo (Fase 5) — ponto de partida real da empresa (leitura, nunca escreve)
  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [dividasRows, setDividasRows] = useState<{ valor_total: number; valor_pago: number; taxa_juros: number }[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<{ tipo: string; valor: number; status: string }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");

  const [tipoCenario, setTipoCenario] = useState<"troca" | "preco" | "prazo" | "cambio" | "perda" | "novo">("preco");
  const [fornecedorSimuladoId, setFornecedorSimuladoId] = useState<string | null>(null);
  const [tipoCustoSimulado, setTipoCustoSimulado] = useState<"fixo" | "variavel">("variavel");
  const [novoValorMensal, setNovoValorMensal] = useState("");
  const [deltaPrecoPct, setDeltaPrecoPct] = useState("0");
  const [deltaDiasPrazo, setDeltaDiasPrazo] = useState("0");
  const [choqueCambioPct, setChoqueCambioPct] = useState("0");
  const [exposicaoCambialFornPct, setExposicaoCambialFornPct] = useState("0");
  const [valorSubstituto, setValorSubstituto] = useState("");
  const [horizonteSimulacao, setHorizonteSimulacao] = useState("12");
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaContas, setBuscaContas] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const [estados, setEstados] = useState<EstadoIBGE[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioIBGE[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<{ id: string; nome: string }[]>([]);

  // Modal Fornecedor — wizard
  const [modalForn, setModalForn] = useState(false);
  const [editandoForn, setEditandoForn] = useState<Fornecedor | null>(null);
  const [fornecedorAtualId, setFornecedorAtualId] = useState<string | null>(null);
  const [nf, setNf] = useState({ ...fornVazio });
  const [salvandoForn, setSalvandoForn] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [etapaCadastro, setEtapaCadastro] = useState(0);

  const [contatosForn, setContatosForn] = useState<FornecedorContato[]>([]);
  const [documentosForn, setDocumentosForn] = useState<FornecedorDocumento[]>([]);
  const [contratosForn, setContratosForn] = useState<FornecedorContrato[]>([]);
  const [produtosForn, setProdutosForn] = useState<FornecedorProduto[]>([]);
  const [interacoesForn, setInteracoesForn] = useState<FornecedorInteracao[]>([]);

  const [novoContato, setNovoContato] = useState({ nome: "", cargo: "", email: "", telefone: "", whatsapp: "", principal: false });
  const [editandoContatoId, setEditandoContatoId] = useState<string | null>(null);
  const [novoDocumento, setNovoDocumento] = useState({ tipo: TIPOS_DOCUMENTO_FORNECEDOR[0].key, nome: "", numero_documento: "", data_emissao: "", data_validade: "" });
  const [arquivoDocumento, setArquivoDocumento] = useState<File | null>(null);
  const [enviandoDocumento, setEnviandoDocumento] = useState(false);
  const [editandoDocumentoId, setEditandoDocumentoId] = useState<string | null>(null);
  const [novoContrato, setNovoContrato] = useState({ descricao: "", data_inicio: "", data_fim: "", renovacao_automatica: false, indice_reajuste: "", valor_contratado: "", valor_utilizado: "" });
  const [editandoContratoId, setEditandoContratoId] = useState<string | null>(null);
  const [novoProduto, setNovoProduto] = useState({ descricao: "", categoria: "", valor_unitario: "", unidade: "" });
  const [editandoProdutoId, setEditandoProdutoId] = useState<string | null>(null);
  const hoje0 = new Date().toISOString().split("T")[0];
  const [novaInteracao, setNovaInteracao] = useState({ data: hoje0, tipo: "", descricao: "" });
  const [editandoInteracaoId, setEditandoInteracaoId] = useState<string | null>(null);
  const [erroCadastro, setErroCadastro] = useState<string | null>(null);
  const [errosForm, setErrosForm] = useState<Record<string, string>>({});

  // Modal Conta
  const [modalConta, setModalConta] = useState(false);
  const [editandoConta, setEditandoConta] = useState<ContaPagar | null>(null);
  const [nc, setNc] = useState({ ...contaVazia });
  const [salvandoConta, setSalvandoConta] = useState(false);

  // Dashboard Executivo (Fase 2)
  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [periodoPersonalizado, setPeriodoPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));
  const [drillDown, setDrillDown] = useState<string | null>(null);
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
    if (!modalForn || nf.pais !== "BR" || !nf.uf) { setMunicipios([]); return; }
    buscarMunicipios(nf.uf).then((r) => setMunicipios(r.dados));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nf.uf, nf.pais, modalForn]);

  const carregarDados = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).maybeSingle();
    setEmpresaId(empresa?.id || null);
    const { data: forn } = await supabase.from("fornecedores").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    const { data: cp } = await supabase.from("contas_pagar").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true });
    const { data: docs } = await supabase.from("fornecedor_documentos").select("*").eq("user_id", user.id);
    const { data: contratos } = await supabase.from("fornecedor_contratos").select("*").eq("user_id", user.id);
    const { data: interacoes } = await supabase.from("fornecedor_interacoes").select("*").eq("user_id", user.id);

    // Ponto de partida real da empresa pro Simulador Executivo (Fase 5) — leitura, nunca escreve.
    // Mesmo padrão de fetch já usado em Simulações/Investimentos.
    const inicioJanela = (() => { const d = new Date(); d.setMonth(d.getMonth() - 11); d.setDate(1); return d.toISOString().slice(0, 10); })();
    const [{ data: rec }, { data: cf }, { data: cv }, { data: dv }, { data: fc }, { data: emp2 }] = await Promise.all([
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioJanela),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioJanela),
      supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("user_id", user.id),
      supabase.from("fluxo_caixa").select("tipo, valor, status").eq("user_id", user.id),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    setFornecedores(forn || []);
    setContas(cp || []);
    setTodosDocumentos(docs || []);
    setTodosContratos(contratos || []);
    setTodasInteracoes(interacoes || []);
    setReceitasRows(rec || []);
    setCustosFixosRows(cf || []);
    setCustosVarRows(cv || []);
    setDividasRows(dv || []);
    setFluxoCaixaRows(fc || []);
    setRegimeTributario(emp2?.regime_tributario || "");
    setCarregando(false);
  };

  // ---------- FORNECEDOR ----------
  // Validação leve (onBlur) — aviso amigável, nunca bloqueia o fluxo (mesmo princípio
  // de "nunca quebra o modal" já usado no resto do módulo).
  const validarCampoForm = (campo: string, valor: string) => {
    if (!valor.trim()) { setErrosForm((prev) => ({ ...prev, [campo]: "" })); return; }
    let erro = "";
    if (campo === "documento") {
      const ok = nf.tipo_pessoa === "PF" ? validarCPF(valor) : validarCNPJ(valor);
      if (!ok) erro = nf.tipo_pessoa === "PF" ? tt.erroCpfInvalido : tt.erroCnpjInvalido;
    } else if (campo === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) erro = tt.erroEmailInvalido;
    } else if (campo === "telefone") {
      if (valor.replace(/\D/g, "").length < 10) erro = tt.erroTelefoneInvalido;
    } else if (campo === "cep") {
      if (valor.replace(/\D/g, "").length !== 8) erro = tt.erroCepInvalido;
    }
    setErrosForm((prev) => ({ ...prev, [campo]: erro }));
  };

  const limparEdicaoItens = () => {
    setEditandoContatoId(null); setEditandoDocumentoId(null); setEditandoContratoId(null);
    setEditandoProdutoId(null); setEditandoInteracaoId(null); setErroCadastro(null); setErrosForm({});
  };

  const abrirNovoForn = () => {
    setEditandoForn(null); setFornecedorAtualId(null); setNf({ ...fornVazio }); setEtapaCadastro(0);
    setContatosForn([]); setDocumentosForn([]); setContratosForn([]); setProdutosForn([]); setInteracoesForn([]);
    limparEdicaoItens();
    setModalForn(true);
  };

  const abrirEdicaoForn = async (f: Fornecedor) => {
    setEditandoForn(f);
    setFornecedorAtualId(f.id);
    setNf({
      nome: f.nome || "", categoria: f.categoria || categorias[0], produto_servico: f.produto_servico || "",
      contato: f.contato || "", valor_mensal: String(f.valor_mensal || ""),
      tipo_pessoa: f.tipo_pessoa || "PJ", documento: f.documento || "", razao_social: f.razao_social || "",
      nome_fantasia: f.nome_fantasia || "", inscricao_estadual: f.inscricao_estadual || "",
      email: f.email || "", telefone: f.telefone || "", responsavel: f.responsavel || "",
      pais: f.pais || "BR", cep: f.cep || "", endereco: f.endereco || "", numero: f.numero || "", complemento: f.complemento || "",
      bairro: f.bairro || "", cidade: f.cidade || "", uf: f.uf || "", banco: f.banco || "",
      agencia: f.agencia || "", conta: f.conta || "", chave_pix: f.chave_pix || "",
      condicao_pagamento: f.condicao_pagamento || "", status: f.status || "ativo", observacoes: f.observacoes || "",
      porte: f.porte || "", inscricao_municipal: f.inscricao_municipal || "", regime_tributario: f.regime_tributario || "",
      contribuinte_icms: f.contribuinte_icms || "", prazo_medio_dias: f.prazo_medio_dias != null ? String(f.prazo_medio_dias) : "",
      moeda: f.moeda || "BRL", centro_custo_id: f.centro_custo_id || "", forma_pagamento_preferencial: f.forma_pagamento_preferencial || "",
      nivel_qualidade: f.nivel_qualidade || "", certificacoes: f.certificacoes || "", observacoes_qualidade: f.observacoes_qualidade || "",
      classificacao_risco: f.classificacao_risco || "", nivel_dependencia: f.nivel_dependencia || "",
    });
    setEtapaCadastro(0);
    limparEdicaoItens();
    setModalForn(true);
    const [ct, dc, cr, pr, it] = await Promise.all([
      listarContatos(f.id), listarDocumentos(f.id), listarContratos(f.id), listarProdutos(f.id), listarInteracoes(f.id),
    ]);
    setContatosForn(ct); setDocumentosForn(dc); setContratosForn(cr); setProdutosForn(pr); setInteracoesForn(it);
  };

  const fecharModalForn = () => {
    setModalForn(false); setEditandoForn(null); setFornecedorAtualId(null); setNf({ ...fornVazio }); setEtapaCadastro(0);
    setContatosForn([]); setDocumentosForn([]); setContratosForn([]); setProdutosForn([]); setInteracoesForn([]);
    limparEdicaoItens();
  };

  // Busca endereço automático pelo CEP — regra global do projeto (helper compartilhado
  // em lib/enderecoHelpers.ts, mesmo usado em Empresa). Só se aplica pra Brasil (ViaCEP).
  const buscarCep = async (cepDigitado: string) => {
    if (nf.pais !== "BR") return;
    const cepLimpo = cepDigitado.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setBuscandoCep(true);
    const r = await consultarCEP(cepLimpo);
    if (!("erro" in r)) {
      setNf((prev) => ({
        ...prev,
        endereco: r.logradouro || prev.endereco,
        bairro: r.bairro || prev.bairro,
        cidade: r.cidade || prev.cidade,
        uf: r.uf || prev.uf,
      }));
    }
    setBuscandoCep(false);
  };

  // Salva os campos-base do fornecedor (insert na primeira vez, update depois).
  // Chamado a cada avanço de etapa — garante que Documentos/Contratos/Produtos/Contatos
  // (que dependem de um fornecedor_id real) já tenham onde se pendurar.
  const persistirBase = async (): Promise<string | null> => {
    if (!nf.nome.trim()) return null;
    setSalvandoForn(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoForn(false); return null; }
    const payload: any = {
      nome: nf.nome, categoria: nf.categoria, produto_servico: nf.produto_servico, contato: nf.contato,
      valor_mensal: parseFloat(nf.valor_mensal || "0"),
      tipo_pessoa: nf.tipo_pessoa, documento: nf.documento, razao_social: nf.razao_social,
      nome_fantasia: nf.nome_fantasia, inscricao_estadual: nf.inscricao_estadual,
      email: nf.email, telefone: nf.telefone, responsavel: nf.responsavel,
      pais: nf.pais || "BR", cep: nf.cep, endereco: nf.endereco, numero: nf.numero, complemento: nf.complemento,
      bairro: nf.bairro, cidade: nf.cidade, uf: nf.uf, banco: nf.banco, agencia: nf.agencia,
      conta: nf.conta, chave_pix: nf.chave_pix, condicao_pagamento: nf.condicao_pagamento,
      status: nf.status, observacoes: nf.observacoes,
      porte: nf.porte || null, inscricao_municipal: nf.inscricao_municipal || null,
      regime_tributario: nf.regime_tributario || null, contribuinte_icms: nf.contribuinte_icms || null,
      prazo_medio_dias: nf.prazo_medio_dias ? parseInt(nf.prazo_medio_dias) : null,
      moeda: nf.moeda || "BRL", centro_custo_id: nf.centro_custo_id || null,
      forma_pagamento_preferencial: nf.forma_pagamento_preferencial || null,
      nivel_qualidade: nf.nivel_qualidade || null, certificacoes: nf.certificacoes || null,
      observacoes_qualidade: nf.observacoes_qualidade || null,
      classificacao_risco: nf.classificacao_risco || null, nivel_dependencia: nf.nivel_dependencia || null,
    };
    let id = fornecedorAtualId;
    if (id) {
      await supabase.from("fornecedores").update(payload).eq("id", id);
    } else {
      const { data, error } = await supabase.from("fornecedores").insert({ ...payload, user_id: user.id }).select("id").single();
      if (error || !data) { setSalvandoForn(false); return null; }
      id = data.id;
      setFornecedorAtualId(id);
    }
    setSalvandoForn(false);
    return id;
  };

  // Único campo hoje tratado como obrigatório de fato (persistirBase recusa sem ele).
  // Se faltar, aponta a etapa Identificação em vez de falhar silenciosamente.
  const validarCadastroCompleto = (): boolean => {
    if (!nf.nome.trim()) {
      setEtapaCadastro(0);
      setErroCadastro(tt.erroNomeObrigatorio);
      return false;
    }
    setErroCadastro(null);
    return true;
  };

  const avancarEtapa = async () => {
    if (!validarCadastroCompleto()) return;
    const id = await persistirBase();
    if (!id) return;
    setEtapaCadastro((e) => e + 1);
  };

  const concluirCadastro = async () => {
    if (!validarCadastroCompleto()) return;
    const id = await persistirBase();
    if (!id) return;
    fecharModalForn();
    await carregarDados();
  };

  const excluirForn = async (id: string) => {
    // ponytail: apaga o fornecedor e os registros filhos (cascade no banco), mas não
    // remove os arquivos órfãos do Storage — upgrade futuro se o volume de documentos justificar.
    await supabase.from("fornecedores").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  // ---------- CONTATOS ----------
  const adicionarContato = async () => {
    if (!fornecedorAtualId || !novoContato.nome.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editandoContatoId) await atualizarContato(editandoContatoId, novoContato);
    else await criarContato(fornecedorAtualId, user.id, novoContato);
    setNovoContato({ nome: "", cargo: "", email: "", telefone: "", whatsapp: "", principal: false });
    setEditandoContatoId(null);
    setContatosForn(await listarContatos(fornecedorAtualId));
  };
  const editarContato = (c: FornecedorContato) => {
    setNovoContato({ nome: c.nome || "", cargo: c.cargo || "", email: c.email || "", telefone: c.telefone || "", whatsapp: c.whatsapp || "", principal: !!c.principal });
    setEditandoContatoId(c.id);
  };
  const cancelarEdicaoContato = () => {
    setNovoContato({ nome: "", cargo: "", email: "", telefone: "", whatsapp: "", principal: false });
    setEditandoContatoId(null);
  };
  const removerContato = async (id: string) => {
    await excluirContato(id);
    if (editandoContatoId === id) cancelarEdicaoContato();
    if (fornecedorAtualId) setContatosForn(await listarContatos(fornecedorAtualId));
  };

  // ---------- DOCUMENTOS ----------
  const adicionarDocumento = async () => {
    if (!fornecedorAtualId || !novoDocumento.nome.trim()) return;
    setEnviandoDocumento(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setEnviandoDocumento(false); return; }
    let storage_path: string | undefined, mime_type: string | undefined, tamanho_bytes: number | undefined;
    if (arquivoDocumento) {
      const up = await uploadDocumentoFornecedor(arquivoDocumento, fornecedorAtualId, user.id, novoDocumento.tipo);
      if (up.erro) { setEnviandoDocumento(false); return; }
      storage_path = up.path; mime_type = arquivoDocumento.type; tamanho_bytes = arquivoDocumento.size;
    }
    if (editandoDocumentoId) {
      // Só troca o arquivo se um novo foi escolhido — corrigir nome/validade não exige reupload.
      const dados: Partial<FornecedorDocumento> = { ...novoDocumento };
      if (storage_path) { dados.storage_path = storage_path; dados.mime_type = mime_type; dados.tamanho_bytes = tamanho_bytes; }
      await atualizarDocumentoFornecedor(editandoDocumentoId, dados);
    } else {
      await criarDocumentoFornecedor(fornecedorAtualId, user.id, { ...novoDocumento, storage_path, mime_type, tamanho_bytes });
    }
    setNovoDocumento({ tipo: TIPOS_DOCUMENTO_FORNECEDOR[0].key, nome: "", numero_documento: "", data_emissao: "", data_validade: "" });
    setArquivoDocumento(null);
    setEditandoDocumentoId(null);
    setDocumentosForn(await listarDocumentos(fornecedorAtualId));
    setEnviandoDocumento(false);
  };
  const editarDocumento = (d: FornecedorDocumento) => {
    setNovoDocumento({ tipo: d.tipo || TIPOS_DOCUMENTO_FORNECEDOR[0].key, nome: d.nome || "", numero_documento: d.numero_documento || "", data_emissao: d.data_emissao || "", data_validade: d.data_validade || "" });
    setArquivoDocumento(null);
    setEditandoDocumentoId(d.id);
  };
  const cancelarEdicaoDocumento = () => {
    setNovoDocumento({ tipo: TIPOS_DOCUMENTO_FORNECEDOR[0].key, nome: "", numero_documento: "", data_emissao: "", data_validade: "" });
    setArquivoDocumento(null);
    setEditandoDocumentoId(null);
  };
  const removerDocumento = async (doc: FornecedorDocumento) => {
    await excluirDocumentoFornecedor(doc);
    if (editandoDocumentoId === doc.id) cancelarEdicaoDocumento();
    if (fornecedorAtualId) setDocumentosForn(await listarDocumentos(fornecedorAtualId));
  };
  const baixarDocumento = async (doc: FornecedorDocumento) => {
    if (!doc.storage_path) return;
    const url = await gerarUrlDocumentoFornecedor(doc.storage_path);
    if (url) window.open(url, "_blank");
  };

  // ---------- CONTRATOS ----------
  const adicionarContrato = async () => {
    if (!fornecedorAtualId || !novoContrato.descricao.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dados = {
      descricao: novoContrato.descricao, data_inicio: novoContrato.data_inicio || null, data_fim: novoContrato.data_fim || null,
      renovacao_automatica: novoContrato.renovacao_automatica, indice_reajuste: novoContrato.indice_reajuste || null,
      valor_contratado: novoContrato.valor_contratado ? parseFloat(novoContrato.valor_contratado) : null,
      valor_utilizado: novoContrato.valor_utilizado ? parseFloat(novoContrato.valor_utilizado) : 0,
    };
    if (editandoContratoId) await atualizarContrato(editandoContratoId, dados);
    else await criarContrato(fornecedorAtualId, user.id, dados);
    setNovoContrato({ descricao: "", data_inicio: "", data_fim: "", renovacao_automatica: false, indice_reajuste: "", valor_contratado: "", valor_utilizado: "" });
    setEditandoContratoId(null);
    setContratosForn(await listarContratos(fornecedorAtualId));
    carregarDados();
  };
  const editarContrato = (c: FornecedorContrato) => {
    setNovoContrato({
      descricao: c.descricao || "", data_inicio: c.data_inicio || "", data_fim: c.data_fim || "",
      renovacao_automatica: !!c.renovacao_automatica, indice_reajuste: c.indice_reajuste || "",
      valor_contratado: c.valor_contratado != null ? String(c.valor_contratado) : "", valor_utilizado: c.valor_utilizado != null ? String(c.valor_utilizado) : "",
    });
    setEditandoContratoId(c.id);
  };
  const cancelarEdicaoContrato = () => {
    setNovoContrato({ descricao: "", data_inicio: "", data_fim: "", renovacao_automatica: false, indice_reajuste: "", valor_contratado: "", valor_utilizado: "" });
    setEditandoContratoId(null);
  };
  const removerContrato = async (id: string) => {
    await excluirContrato(id);
    if (editandoContratoId === id) cancelarEdicaoContrato();
    if (fornecedorAtualId) setContratosForn(await listarContratos(fornecedorAtualId));
    carregarDados();
  };

  // ---------- PRODUTOS ----------
  const adicionarProduto = async () => {
    if (!fornecedorAtualId || !novoProduto.descricao.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dados = {
      descricao: novoProduto.descricao, categoria: novoProduto.categoria || null,
      valor_unitario: novoProduto.valor_unitario ? parseFloat(novoProduto.valor_unitario) : null,
      unidade: novoProduto.unidade || null,
    };
    if (editandoProdutoId) await atualizarProduto(editandoProdutoId, dados);
    else await criarProduto(fornecedorAtualId, user.id, dados);
    setNovoProduto({ descricao: "", categoria: "", valor_unitario: "", unidade: "" });
    setEditandoProdutoId(null);
    setProdutosForn(await listarProdutos(fornecedorAtualId));
  };
  const editarProduto = (p: FornecedorProduto) => {
    setNovoProduto({ descricao: p.descricao || "", categoria: p.categoria || "", valor_unitario: p.valor_unitario != null ? String(p.valor_unitario) : "", unidade: p.unidade || "" });
    setEditandoProdutoId(p.id);
  };
  const cancelarEdicaoProduto = () => {
    setNovoProduto({ descricao: "", categoria: "", valor_unitario: "", unidade: "" });
    setEditandoProdutoId(null);
  };
  const removerProduto = async (id: string) => {
    await excluirProduto(id);
    if (editandoProdutoId === id) cancelarEdicaoProduto();
    if (fornecedorAtualId) setProdutosForn(await listarProdutos(fornecedorAtualId));
  };

  // ---------- INTERAÇÕES ----------
  const adicionarInteracao = async () => {
    if (!fornecedorAtualId || !novaInteracao.descricao.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editandoInteracaoId) await atualizarInteracao(editandoInteracaoId, novaInteracao);
    else await criarInteracao(fornecedorAtualId, user.id, novaInteracao);
    setNovaInteracao({ data: hoje0, tipo: "", descricao: "" });
    setEditandoInteracaoId(null);
    setInteracoesForn(await listarInteracoes(fornecedorAtualId));
  };
  const editarInteracao = (it: FornecedorInteracao) => {
    setNovaInteracao({ data: it.data || hoje0, tipo: it.tipo || "", descricao: it.descricao || "" });
    setEditandoInteracaoId(it.id);
  };
  const cancelarEdicaoInteracao = () => {
    setNovaInteracao({ data: hoje0, tipo: "", descricao: "" });
    setEditandoInteracaoId(null);
  };
  const removerInteracao = async (id: string) => {
    await excluirInteracao(id);
    if (editandoInteracaoId === id) cancelarEdicaoInteracao();
    if (fornecedorAtualId) setInteracoesForn(await listarInteracoes(fornecedorAtualId));
  };

  // ---------- CONTA A PAGAR ----------
  const calcStatus = (total: number, pago: number, venc?: string) => {
    if (pago >= total && total > 0) return "pago";
    if (pago > 0 && pago < total) return "parcial";
    const hj = new Date().toISOString().split("T")[0];
    if (venc && venc < hj) return "vencido";
    return "pendente";
  };

  const abrirNovaConta = () => { setEditandoConta(null); setNc({ ...contaVazia }); setModalConta(true); };

  const abrirEdicaoConta = (c: ContaPagar) => {
    setEditandoConta(c);
    setNc({
      fornecedor_id: c.fornecedor_id || "", descricao: c.descricao || "", numero_nota: c.numero_nota || "",
      categoria: c.categoria || categorias[0], valor_total: String(c.valor_total || ""),
      valor_pago: String(c.valor_pago || ""), forma_pagamento: c.forma_pagamento || formasPagamento[0],
      parcelas: String(c.parcelas || "1"), data_emissao: c.data_emissao || "",
      data_vencimento: c.data_vencimento || "", observacoes: c.observacoes || "",
    });
    setModalConta(true);
  };

  const fecharModalConta = () => { setModalConta(false); setEditandoConta(null); setNc({ ...contaVazia }); };

  const salvarConta = async () => {
    if (!nc.descricao || !nc.valor_total) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoConta(false); return; }
    const total = parseFloat(nc.valor_total || "0");
    const pago = parseFloat(nc.valor_pago || "0");
    const status = calcStatus(total, pago, nc.data_vencimento);
    const payload: any = {
      fornecedor_id: nc.fornecedor_id || null, descricao: nc.descricao, numero_nota: nc.numero_nota,
      categoria: nc.categoria, valor_total: total, valor_pago: pago, forma_pagamento: nc.forma_pagamento,
      parcelas: parseInt(nc.parcelas || "1"), data_emissao: nc.data_emissao || null,
      data_vencimento: nc.data_vencimento || null,
      data_pagamento: status === "pago" ? new Date().toISOString().split("T")[0] : null,
      status, observacoes: nc.observacoes, empresa_id: empresaId,
    };
    if (editandoConta) {
      await supabase.from("contas_pagar").update(payload).eq("id", editandoConta.id);
    } else {
      await supabase.from("contas_pagar").insert({ ...payload, user_id: user.id });
    }
    fecharModalConta(); await carregarDados(); setSalvandoConta(false);
  };

  const excluirConta = async (id: string) => {
    await supabase.from("contas_pagar").delete().eq("id", id);
    setContas(contas.filter(c => c.id !== id));
  };

  const quitarConta = async (c: ContaPagar) => {
    await supabase.from("contas_pagar").update({
      valor_pago: c.valor_total, status: "pago", data_pagamento: new Date().toISOString().split("T")[0],
    }).eq("id", c.id);
    await carregarDados();
  };

  // ---------- Cálculos ----------
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];

  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.documento || "").toLowerCase().includes(busca.toLowerCase()) ||
    (f.nome_fantasia || "").toLowerCase().includes(busca.toLowerCase())
  );

  const contasFiltradas = contas.filter(c => {
    const fnome = fornecedores.find(f => f.id === c.fornecedor_id)?.nome || "";
    return c.descricao.toLowerCase().includes(buscaContas.toLowerCase()) ||
      fnome.toLowerCase().includes(buscaContas.toLowerCase());
  });

  const totalPago = contas.reduce((s, c) => s + (c.valor_pago || 0), 0);
  const totalEmAberto = contas.reduce((s, c) => s + Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0)), 0);
  const totalVencido = contas.filter(c => c.status !== "pago" && c.data_vencimento && c.data_vencimento < hoje)
    .reduce((s, c) => s + Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0)), 0);

  const alertasDocumentos = documentosVencendo(todosDocumentos, 30);
  const alertasContratos = contratosVencendo(todosContratos, 30);
  const qtdDocVencer = alertasDocumentos.vencidos.length + alertasDocumentos.aVencer.length;
  const qtdContratoVencer = alertasContratos.vencidos.length + alertasContratos.aVencer.length;

  function alertasDoFornecedor(fid: string) {
    const docs = documentosVencendo(todosDocumentos.filter(d => d.fornecedor_id === fid), 30);
    const cts = contratosVencendo(todosContratos.filter(c => c.fornecedor_id === fid), 30);
    return docs.vencidos.length + docs.aVencer.length + cts.vencidos.length + cts.aVencer.length;
  }

  function statusLabel(s?: string) {
    if (s === "pago") return idioma === "pt" ? "Pago" : "Paid";
    if (s === "parcial") return idioma === "pt" ? "Parcial" : "Partial";
    if (s === "vencido") return idioma === "pt" ? "Vencido" : "Overdue";
    return idioma === "pt" ? "Pendente" : "Pending";
  }
  function statusCor(s?: string) {
    if (s === "pago") return "#34d399";
    if (s === "parcial") return "#6ab0ff";
    if (s === "vencido") return "#f87171";
    return "#fbbf24";
  }

  // ---------- PDF ----------
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (aba === "fornecedores") {
        gerarPdfTabela({
          titulo: t.fornecedores.titulo,
          subtitulo: t.fornecedores.subtitulo,
          colunas: [
            { header: "Nome", key: "nome", width: 3 },
            { header: "CNPJ/CPF", key: "doc", width: 3 },
            { header: "Categoria", key: "cat", width: 2 },
            { header: "Contato", key: "contato", width: 3 },
            { header: "PIX", key: "pix", width: 3 },
            { header: "Status", key: "status", width: 2 },
          ],
          linhas: fornecedoresFiltrados.map((f) => ({
            nome: f.nome,
            doc: f.documento || "-",
            cat: f.categoria || "-",
            contato: f.telefone || f.contato || "-",
            pix: f.chave_pix || "-",
            status: (f.status || "ativo") === "ativo" ? "Ativo" : "Inativo",
          })),
          resumo: [
            { label: "Total de Fornecedores", valor: `${fornecedores.length}` },
            { label: "A Pagar (em aberto)", valor: `R$ ${fmtN(totalEmAberto)}` },
            { label: "Total Pago", valor: `R$ ${fmtN(totalPago)}` },
          ],
          nomeArquivo: `axioma-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      } else {
        gerarPdfTabela({
          titulo: `${t.fornecedores.titulo} - Contas a Pagar`,
          subtitulo: t.fornecedores.subtitulo,
          colunas: [
            { header: "Descrição", key: "desc", width: 3 },
            { header: "Fornecedor", key: "forn", width: 3 },
            { header: "Vencimento", key: "venc", width: 2 },
            { header: "Forma", key: "forma", width: 2 },
            { header: "Status", key: "status", width: 2 },
            { header: "Total (R$)", key: "total", width: 2, align: "right" },
            { header: "Pago (R$)", key: "pago", width: 2, align: "right" },
            { header: "Resta (R$)", key: "resta", width: 2, align: "right" },
          ],
          linhas: contasFiltradas.map((c) => ({
            desc: c.descricao,
            forn: fornecedores.find(f => f.id === c.fornecedor_id)?.nome || "-",
            venc: c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-",
            forma: c.forma_pagamento || "-",
            status: statusLabel(c.status),
            total: fmtN(c.valor_total),
            pago: fmtN(c.valor_pago),
            resta: fmtN(Math.max(0, c.valor_total - c.valor_pago)),
          })),
          resumo: [
            { label: "Total das Contas", valor: `R$ ${fmtN(contas.reduce((s, c) => s + c.valor_total, 0))}` },
            { label: "Total Pago", valor: `R$ ${fmtN(totalPago)}` },
            { label: "A Pagar (em aberto)", valor: `R$ ${fmtN(totalEmAberto)}` },
            { label: "Vencido", valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-contas-pagar-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      }
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ========== DASHBOARD EXECUTIVO (Fase 2) ==========
  const cx = cfoT(lang);
  const periodo = resolverPeriodo(presetPeriodo, periodoPersonalizado);
  const comprasPeriodo = comprasNoPeriodo(contas, periodo);
  const comprasAno = comprasNoPeriodo(contas, resolverPeriodo("ano_atual"));
  const valorTotalContratado = todosContratos.reduce((s, c) => s + (c.valor_contratado || 0), 0);
  const concentracao = concentracaoFornecedores(fornecedores, contas);
  const diversificacao = diversificacaoFornecedores(contas);
  const curvaABCData = curvaABC(fornecedores, contas);
  const geoData = distribuicaoGeografica(fornecedores);
  const riscoCarteira = riscoMedioCarteira(fornecedores);
  const qualidadeCarteira = qualidadeMediaCarteira(fornecedores);
  const pontualidade = pontualidadePagamento(contas);
  const tempoRelacionamentoDias = tempoMedioRelacionamentoDias(fornecedores);

  // ========== SCORE CORPORATIVO AXIOMA (Fase 3) ==========
  const rankingAxioma = rankingScoreAxioma(fornecedores, contas, todosDocumentos, todasInteracoes);
  const scoreCarteira = scoreMedioCarteiraAxioma(rankingAxioma);
  const NOME_CRITERIO: Record<string, string> = {
    qualidade: tt.kpiQualidade, pontualidade: tt.kpiPontualidade, risco: tt.critRisco, compliance: tt.critCompliance,
    dependencia: tt.kpiDependenciaFinanceira, estabilidade: tt.kpiEstabilidade, relacionamento: tt.critRelacionamento,
    confiabilidade: tt.critConfiabilidade, preco: tt.critPreco, capacidadeEntrega: tt.critCapacidadeEntrega,
    saudeFinanceira: tt.critSaudeFinanceira, sustentabilidade: tt.critSustentabilidade, inovacao: tt.critInovacao,
    flexibilidade: tt.critFlexibilidade,
  };
  const NIVEL_SCORE_COR: Record<string, string> = { critico: "#f87171", atencao: AMBAR, saudavel: "#34d399" };
  const NIVEL_SCORE_LABEL: Record<string, string> = { critico: tt.nivelCritico, atencao: tt.nivelAtencao, saudavel: tt.nivelSaudavel };
  const scoreDrillItem = rankingAxioma.find((r) => r.fornecedor.id === scoreDrillId) || null;
  const velocimetroOption = scoreDrillItem ? optVelocimetro(scoreDrillItem.score.total, 1000, [
    { ate: 400, cor: "#f87171" }, { ate: 700, cor: AMBAR }, { ate: 1000, cor: "#34d399" },
  ]) : null;

  const itensRenovaveis: ItemRenovavel[] = [
    ...todosDocumentos.filter(d => d.data_validade).map(d => ({ descricao: d.nome, valor: 0, data_renovacao: d.data_validade, categoria: tt.documentacaoTitulo })),
    ...todosContratos.filter(c => c.data_fim).map(c => ({ descricao: c.descricao || "-", valor: c.valor_contratado || 0, data_renovacao: c.data_fim, categoria: tt.contratosTitulo })),
  ];
  const escadaVencimentos = radarRenovacoes(itensRenovaveis, 180);
  function corUrgencia(u: string) {
    if (u === "vencido") return "#f87171";
    if (u === "critico") return "#f87171";
    if (u === "proximo") return "#fbbf24";
    return "#6ab0ff";
  }
  function textoUrgencia(dias: number) {
    if (dias < 0) return `${cx.diasVencido} ${Math.abs(dias)} ${cx.dias}`;
    if (dias === 0) return cx.hoje;
    if (dias === 1) return cx.amanha;
    return `${cx.renovaEm} ${dias} ${cx.dias}`;
  }

  const radarNormalizado = [
    riscoCarteira.amostraSuficiente ? ((riscoCarteira.media - 1) / 2) * 100 : 0,
    concentracao.amostraSuficiente ? concentracao.percentualMaior : 0,
    diversificacao.amostraSuficiente ? 100 - diversificacao.indice : 0,
    qualidadeCarteira.amostraSuficiente ? 100 - ((qualidadeCarteira.media - 1) / 3) * 100 : 0,
    pontualidade.amostraSuficiente ? 100 - pontualidade.percentual : 0,
  ];
  const radarTemDado = riscoCarteira.amostraSuficiente || concentracao.amostraSuficiente || diversificacao.amostraSuficiente || qualidadeCarteira.amostraSuficiente || pontualidade.amostraSuficiente;
  const radarOption = optRadar(
    [
      { nome: tt.eixoRisco, max: 100 }, { nome: tt.eixoDependencia, max: 100 }, { nome: tt.eixoConcentracao, max: 100 },
      { nome: tt.eixoQualidadeInv, max: 100 }, { nome: tt.eixoPontualidadeInv, max: 100 },
    ],
    radarNormalizado, "#f87171",
  );

  const curvaABCOption = curvaABCData.length > 0 ? optBarrasV(
    curvaABCData.slice(0, 10).map(c => c.valor),
    curvaABCData.slice(0, 10).map(c => c.nome.length > 10 ? c.nome.slice(0, 9) + "…" : c.nome),
    AMBAR, "#fcd34d",
    curvaABCData.slice(0, 10).map(c => c.classe === "A" ? "#f87171" : c.classe === "B" ? "#fbbf24" : "#34d399"),
  ) : null;

  const geoOption = geoData.length > 0 ? optRosca(
    geoData.slice(0, 8).map((g, i) => ({ name: g.uf, value: g.quantidade, color: [AMBAR, "#fbbf24", "#34d399", "#6ab0ff", "#a78bfa", "#f87171", "#14b8a6", "#ec4899"][i % 8] })),
    AMBAR, idioma === "pt" ? "Estados" : idioma === "es" ? "Estados" : "States",
  ) : null;

  const rotuloRiscoTxt = riscoCarteira.amostraSuficiente ? tt.rotuloRisco[Math.min(2, Math.round(riscoCarteira.media) - 1)] : "—";
  const rotuloQualidadeTxt = qualidadeCarteira.amostraSuficiente ? tt.rotuloQualidade[Math.min(3, Math.round(qualidadeCarteira.media) - 1)] : "—";

  type KpiTile = { key: string; label: string; valor: string; cor: string; vazio: boolean; mensagemVazio?: string; sub?: string };
  const kpis: KpiTile[] = [
    { key: "total", label: tt.kpiTotal, valor: `${fornecedores.length}`, cor: AMBAR, vazio: fornecedores.length === 0, mensagemVazio: tt.semDados },
    { key: "ativos", label: tt.kpiAtivos, valor: `${fornecedores.filter(f => (f.status || "ativo") === "ativo").length}`, cor: "#34d399", vazio: fornecedores.length === 0, mensagemVazio: tt.semDados },
    { key: "inativos", label: tt.kpiInativos, valor: `${fornecedores.filter(f => f.status === "inativo").length}`, cor: "#f87171", vazio: fornecedores.length === 0, mensagemVazio: tt.semDados },
    { key: "valorContratado", label: tt.kpiValorContratado, valor: fmt(valorTotalContratado), cor: AMBAR, vazio: todosContratos.length === 0, mensagemVazio: tt.semContratos },
    { key: "comprasMes", label: tt.kpiComprasMes, valor: fmt(comprasPeriodo), cor: "#6ab0ff", vazio: contas.length === 0, mensagemVazio: tt.semCompras },
    { key: "comprasAno", label: tt.kpiComprasAno, valor: fmt(comprasAno), cor: "#6ab0ff", vazio: contas.length === 0, mensagemVazio: tt.semCompras },
    { key: "economiaObtida", label: tt.kpiEconomiaObtida, valor: "—", cor: "#5a7a9a", vazio: true, mensagemVazio: tt.semInfraestrutura },
    { key: "economiaPotencial", label: tt.kpiEconomiaPotencial, valor: "—", cor: "#5a7a9a", vazio: true, mensagemVazio: tt.semInfraestrutura },
    { key: "indiceNegociacao", label: tt.kpiIndiceNegociacao, valor: "—", cor: "#5a7a9a", vazio: true, mensagemVazio: tt.semInfraestrutura },
    { key: "dependenciaFinanceira", label: tt.kpiDependenciaFinanceira, valor: concentracao.amostraSuficiente ? `${concentracao.percentualMaior}%` : "—", cor: !concentracao.amostraSuficiente ? "#5a7a9a" : concentracao.percentualMaior > 50 ? "#f87171" : AMBAR, vazio: !concentracao.amostraSuficiente, mensagemVazio: tt.semCompras, sub: concentracao.nomeMaior || undefined },
    { key: "diversificacao", label: tt.kpiDiversificacao, valor: diversificacao.amostraSuficiente ? `${diversificacao.indice}/100` : "—", cor: !diversificacao.amostraSuficiente ? "#5a7a9a" : "#34d399", vazio: !diversificacao.amostraSuficiente, mensagemVazio: tt.semCompras },
    { key: "riscoMedio", label: tt.kpiRiscoMedio, valor: rotuloRiscoTxt, cor: !riscoCarteira.amostraSuficiente ? "#5a7a9a" : riscoCarteira.media >= 2.5 ? "#f87171" : riscoCarteira.media >= 1.5 ? AMBAR : "#34d399", vazio: !riscoCarteira.amostraSuficiente, mensagemVazio: tt.semClassificacao },
    { key: "leadTime", label: tt.kpiLeadTime, valor: "—", cor: "#5a7a9a", vazio: true, mensagemVazio: tt.semInfraestrutura },
    { key: "pontualidade", label: tt.kpiPontualidade, valor: pontualidade.amostraSuficiente ? `${pontualidade.percentual}%` : "—", cor: !pontualidade.amostraSuficiente ? "#5a7a9a" : pontualidade.percentual >= 80 ? "#34d399" : pontualidade.percentual >= 50 ? AMBAR : "#f87171", vazio: !pontualidade.amostraSuficiente, mensagemVazio: tt.semPagamentos },
    { key: "qualidade", label: tt.kpiQualidade, valor: rotuloQualidadeTxt, cor: !qualidadeCarteira.amostraSuficiente ? "#5a7a9a" : qualidadeCarteira.media >= 3 ? "#34d399" : qualidadeCarteira.media >= 2 ? AMBAR : "#f87171", vazio: !qualidadeCarteira.amostraSuficiente, mensagemVazio: tt.semClassificacao },
    { key: "estabilidade", label: tt.kpiEstabilidade, valor: fornecedores.length > 0 ? `${Math.round(tempoRelacionamentoDias / 30)} ${tt.unidadeMeses}` : "—", cor: "#a78bfa", vazio: fornecedores.length === 0, mensagemVazio: tt.semDados },
    { key: "scoreMedio", label: tt.kpiScoreMedio, valor: scoreCarteira.amostraSuficiente ? `${scoreCarteira.media}` : "—", cor: !scoreCarteira.amostraSuficiente ? "#5a7a9a" : scoreCarteira.media > 700 ? "#34d399" : scoreCarteira.media > 400 ? AMBAR : "#f87171", vazio: !scoreCarteira.amostraSuficiente, mensagemVazio: tt.semScore },
  ];
  const kpiAtivo = kpis.find(k => k.key === drillDown) || null;

  // ========== INTELIGÊNCIA DE COMPRAS (Fase 4) ==========
  const fornecedoresComHistorico = fornecedores.filter(f => contas.some(c => c.fornecedor_id === f.id));
  const fornecedorEvolucaoAtual = fornecedores.find(f => f.id === fornecedorEvolucaoId) || fornecedoresComHistorico[0] || null;
  const contasEvolucao: Lancamento[] = fornecedorEvolucaoAtual
    ? contas.filter(c => c.fornecedor_id === fornecedorEvolucaoAtual.id).map(c => ({ valor: c.valor_total, data: c.data_emissao || c.data_vencimento || "", categoria: c.categoria, status: c.status, descricao: c.descricao }))
    : [];
  const serieEvolucao = serieRolling(contasEvolucao, 12);
  const evolucaoOption = contasEvolucao.length > 0 ? optBarrasV(serieEvolucao.map(s => s.value), serieEvolucao.map(s => s.label), AMBAR, "#fcd34d") : null;
  const inflacao = fornecedorEvolucaoAtual ? inflacaoFornecedor(contas.filter(c => c.fornecedor_id === fornecedorEvolucaoAtual.id), periodo, periodoAnterior(periodo)) : null;
  const tendenciaFornecedor = detectarAnomaliasHistoricas(contasEvolucao);

  const contasTodasLanc: Lancamento[] = contas.map(c => ({ valor: c.valor_total, data: c.data_emissao || c.data_vencimento || "", categoria: c.categoria, status: c.status, descricao: c.descricao }));
  const sazonalidadeSerie = serieRolling(contasTodasLanc, 12);
  const sazonalidadeOption = contas.length > 0 ? optBarrasV(sazonalidadeSerie.map(s => s.value), sazonalidadeSerie.map(s => s.label), "#6ab0ff", "#93c5fd") : null;

  const itensDespesaContas: ItemDespesa[] = contas.map(c => ({ descricao: c.descricao, valor: c.valor_total, categoria: c.categoria || undefined }));
  const desperdicios = detectarDesperdicio(itensDespesaContas);

  const consolidacao = oportunidadesConsolidacao(fornecedores, contas);
  const parados = fornecedoresParados(fornecedores, contas, 90);
  const precosAltos = precoAcimaMediaInterna(fornecedores, contas, 20);
  const anomaliasCarteira = detectarAnomaliasHistoricas(contasTodasLanc);

  // ========== PAINEL DE ALERTAS (Fase 4) ==========
  type Severidade = "atencao" | "critico";
  type AlertaFornecedor = { tipo: string; severidade: Severidade; titulo: string; descricao: string; acao: string };
  const alertas: AlertaFornecedor[] = [];

  parados.forEach(p => alertas.push({
    tipo: "parado", severidade: p.diasParado >= 180 ? "critico" : "atencao",
    titulo: `${tt.alertaParadoTitulo}: ${p.nome}`, descricao: `${tt.alertaParadoDesc} ${p.diasParado} ${cx.dias}.`, acao: tt.alertaParadoAcao,
  }));

  fornecedores.filter(f => f.classificacao_risco === "alto" && (f.status || "ativo") === "ativo").forEach(f => alertas.push({
    tipo: "risco", severidade: "critico",
    titulo: `${tt.alertaRiscoTitulo}: ${f.nome}`, descricao: tt.alertaRiscoDesc, acao: tt.alertaRiscoAcao,
  }));

  escadaVencimentos.filter(r => r.categoria === tt.contratosTitulo && r.urgencia !== "futuro").forEach(r => alertas.push({
    tipo: "contrato_vencendo", severidade: r.urgencia === "proximo" ? "atencao" : "critico",
    titulo: `${tt.alertaContratoTitulo}: ${r.descricao}`, descricao: textoUrgencia(r.diasRestantes), acao: tt.alertaContratoAcao,
  }));

  escadaVencimentos.filter(r => r.categoria === tt.documentacaoTitulo && r.urgencia !== "futuro").forEach(r => alertas.push({
    tipo: "documento_vencendo", severidade: r.urgencia === "proximo" ? "atencao" : "critico",
    titulo: `${tt.alertaDocumentoTitulo}: ${r.descricao}`, descricao: textoUrgencia(r.diasRestantes), acao: tt.alertaDocumentoAcao,
  }));

  precosAltos.forEach(p => alertas.push({
    tipo: "preco_alto", severidade: p.percentualAcima >= 50 ? "critico" : "atencao",
    titulo: `${tt.alertaPrecoTitulo}: ${p.nome}`, descricao: `${tt.alertaPrecoDesc} ${p.percentualAcima}% (${p.categoria}).`, acao: tt.alertaPrecoAcao,
  }));

  const totalCarteiraContas = contas.reduce((s, c) => s + (c.valor_total || 0), 0);
  fornecedores.filter(f => (f.status || "ativo") === "ativo").forEach(f => {
    const gasto = contas.filter(c => c.fornecedor_id === f.id).reduce((s, c) => s + (c.valor_total || 0), 0);
    if (totalCarteiraContas <= 0 || gasto <= 0) return;
    const pct = (gasto / totalCarteiraContas) * 100;
    if (pct >= 30) alertas.push({
      tipo: "dependencia", severidade: pct >= 50 ? "critico" : "atencao",
      titulo: `${tt.alertaDependenciaTitulo}: ${f.nome}`, descricao: `${tt.alertaDependenciaDesc} ${Math.round(pct)}%.`, acao: tt.alertaDependenciaAcao,
    });
  });

  if (diversificacao.amostraSuficiente && diversificacao.indice < 40) alertas.push({
    tipo: "concentracao", severidade: diversificacao.indice < 20 ? "critico" : "atencao",
    titulo: tt.alertaConcentracaoTitulo, descricao: `${tt.alertaConcentracaoDesc} ${diversificacao.indice}/100.`, acao: tt.alertaConcentracaoAcao,
  });

  anomaliasCarteira.filter(a => a.tipo === "aumento_recorrente").slice(0, 8).forEach(a => alertas.push({
    tipo: "aumento_preco", severidade: "critico",
    titulo: `${tt.alertaAumentoTitulo}: ${a.descricao}`, descricao: `${tt.alertaAumentoDesc} ${fmt(a.valorReferencia)} → ${fmt(a.valorAtual)}.`, acao: tt.alertaAumentoAcao,
  }));

  alertas.sort((a, b) => (a.severidade === "critico" ? 0 : 1) - (b.severidade === "critico" ? 0 : 1));
  const alertasCriticos = alertas.filter(a => a.severidade === "critico").length;
  const alertasAtencao = alertas.filter(a => a.severidade === "atencao").length;

  // ========== SIMULADOR EXECUTIVO (Fase 5A) — ponto de partida real da empresa ==========
  const receitaBruta12m = receitasRows.reduce((s, r) => s + (r.valor || 0), 0);
  const receitaMensalMedia = receitaBruta12m / 12;
  const custoVar12m = custosVarRows.reduce((s, c) => s + Number(c.valor || 0), 0);
  const custoVariavelMensalMedia = custoVar12m / 12;
  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);
  const dividaTotalSim = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
  const despesasFinanceirasMensalSim = dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago) * (d.taxa_juros / 100), 0);
  const impostoMensalEstimadoSim = calcularImpostoRegime(regimeTributario, receitaBruta12m, receitaMensalMedia);
  const aliquotaEfetivaPctSim = receitaMensalMedia > 0 ? (impostoMensalEstimadoSim / receitaMensalMedia) * 100 : 0;
  const caixaDisponivelSim = fluxoCaixaRows.filter(l => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);
  const temDadosSimulador = receitaMensalMedia > 0 || custoFixoMensalTotal > 0 || custoVariavelMensalMedia > 0;

  const dreHojeSim = montarDRE({
    receitaBruta: receitaMensalMedia, deducoes: receitaMensalMedia * (aliquotaEfetivaPctSim / 100),
    custoVariavel: custoVariavelMensalMedia, custoFixo: custoFixoMensalTotal, despesasFinanceiras: despesasFinanceirasMensalSim,
  });

  const fornecedorSimulado = fornecedores.find(f => f.id === fornecedorSimuladoId) || null;
  const contasFornSimulado = fornecedorSimulado ? contas.filter(c => c.fornecedor_id === fornecedorSimulado.id) : [];
  const valorAtualFornSimulado = fornecedorSimulado
    ? (contasFornSimulado.length > 0 ? contasFornSimulado.reduce((s, c) => s + (c.valor_total || 0), 0) / 12 : (fornecedorSimulado.valor_mensal || 0))
    : 0;

  const baseMensalRelevante = tipoCustoSimulado === "fixo" ? custoFixoMensalTotal : custoVariavelMensalMedia;
  let deltaValorMensalSim = 0;
  let deltaCaixaPrazoSim = 0;
  if (tipoCenario === "troca") deltaValorMensalSim = parseFloat(novoValorMensal || "0") - valorAtualFornSimulado;
  else if (tipoCenario === "preco") deltaValorMensalSim = valorAtualFornSimulado * (parseFloat(deltaPrecoPct || "0") / 100);
  else if (tipoCenario === "prazo") deltaCaixaPrazoSim = estimativaCaixaPrazo(valorAtualFornSimulado, parseFloat(deltaDiasPrazo || "0"));
  else if (tipoCenario === "cambio") deltaValorMensalSim = valorAtualFornSimulado * ((parseFloat(choqueCambioPct || "0") * (parseFloat(exposicaoCambialFornPct || "0") / 100)) / 100);
  else if (tipoCenario === "perda") deltaValorMensalSim = parseFloat(valorSubstituto || "0") - valorAtualFornSimulado;
  else if (tipoCenario === "novo") deltaValorMensalSim = parseFloat(novoValorMensal || "0");

  const choquePctSim = pctChoqueDoFornecedor(deltaValorMensalSim, baseMensalRelevante);
  const choqueSimulador: ChoqueSimulador = {
    receitaPct: 0, custoFixoPct: tipoCustoSimulado === "fixo" ? choquePctSim : 0, custoVariavelPct: tipoCustoSimulado === "variavel" ? choquePctSim : 0,
    jurosDividaPontos: 0, aporteCapital: 0, retornoMensalAporte: 0,
  };
  const podeSimular = temDadosSimulador && fornecedorSimulado != null && (tipoCenario === "prazo" || baseMensalRelevante > 0);
  const cenariosSimulados = podeSimular ? simularCenariosExecutivos({
    receitaMensalAtual: receitaMensalMedia, custoFixoMensalAtual: custoFixoMensalTotal,
    custoVariavelMensalAtual: custoVariavelMensalMedia, despesasFinanceirasMensalAtual: despesasFinanceirasMensalSim,
    dividaTotalAtual: dividaTotalSim, aliquotaEfetivaPct: aliquotaEfetivaPctSim,
    saldoCaixaAtual: caixaDisponivelSim + deltaCaixaPrazoSim, choque: choqueSimulador, horizonteMeses: parseInt(horizonteSimulacao || "12") || 12,
  }) : [];
  const NOME_CENARIO_LABEL: Record<string, string> = { conservador: tt.nomeConservador, base: tt.nomeBase, otimista: tt.nomeOtimista, adverso: tt.nomeAdverso };

  // ========== REFORMA TRIBUTÁRIA 2026 POR FORNECEDOR (Fase 5B) ==========
  const creditoReforma = avaliarCreditoReforma(fornecedores);
  const contagemCredito = { pleno: 0, parcial: 0, baixo: 0, indefinido: 0 };
  creditoReforma.forEach(c => { contagemCredito[c.nivel]++; });
  const NIVEL_CREDITO_COR: Record<string, string> = { pleno: "#34d399", parcial: AMBAR, baixo: "#f87171", indefinido: "#5a7a9a" };
  const NIVEL_CREDITO_LABEL: Record<string, string> = { pleno: tt.nivelPleno, parcial: tt.nivelParcial, baixo: tt.nivelBaixo, indefinido: tt.nivelIndefinido };

  // ========== IA EXECUTIVA — modo por regras (Fase 5C) ==========
  // Fase futura: tentar POST /api/ia-chat ({mensagem, historico, contexto}, mesmo padrão de
  // enviarPerguntaZIA em Clientes) antes de cair aqui. Nenhuma chamada de rede nesta fase —
  // ANTHROPIC_API_KEY segue desativada por decisão do Elias.
  type InsightExecutivo = { severidade: "positivo" | "atencao" | "critico"; texto: string };
  const insightsExecutivos: InsightExecutivo[] = [];
  const qtdRiscoAlto = fornecedores.filter(f => f.classificacao_risco === "alto" && (f.status || "ativo") === "ativo").length;
  if (parados.length > 0 || qtdRiscoAlto > 0) insightsExecutivos.push({ severidade: "critico", texto: `${tt.iaInterrupcao1} ${parados.length + qtdRiscoAlto} ${tt.iaInterrupcao2}` });
  if (anomaliasCarteira.length > 0) insightsExecutivos.push({ severidade: "atencao", texto: `${tt.iaAumento1} ${anomaliasCarteira.length} ${tt.iaAumento2}` });
  if (precosAltos.length > 0) insightsExecutivos.push({ severidade: "atencao", texto: `${precosAltos.length} ${tt.iaRenegociacao1}` });
  const economiaTotalConsolidacao = consolidacao.reduce((s, g) => s + g.economiaEstimada, 0);
  if (economiaTotalConsolidacao > 0) insightsExecutivos.push({ severidade: "positivo", texto: `${tt.iaEconomia1} ${fmt(economiaTotalConsolidacao)} ${tt.iaEconomia2}` });
  if (diversificacao.amostraSuficiente && diversificacao.indice < 40) insightsExecutivos.push({ severidade: "atencao", texto: tt.iaNovosFornecedores });
  const contratosCriticosIA = escadaVencimentos.filter(r => r.categoria === tt.contratosTitulo && (r.urgencia === "vencido" || r.urgencia === "critico")).length;
  if (contratosCriticosIA > 0) insightsExecutivos.push({ severidade: "critico", texto: `${contratosCriticosIA} ${tt.iaContratos1}` });
  if (concentracao.amostraSuficiente && concentracao.percentualMaior > 40) insightsExecutivos.push({ severidade: concentracao.percentualMaior > 50 ? "critico" : "atencao", texto: `${tt.iaConcentracao1} ${concentracao.nomeMaior} ${tt.iaConcentracao2} ${concentracao.percentualMaior}%.` });
  if (riscoCarteira.amostraSuficiente && riscoCarteira.media >= 2) insightsExecutivos.push({ severidade: "atencao", texto: tt.iaOperacional });
  const valorEmRiscoContratos = escadaVencimentos.filter(r => r.categoria === tt.contratosTitulo && r.urgencia !== "futuro").reduce((s, r) => s + r.valor, 0);
  if (economiaTotalConsolidacao > 0 || valorEmRiscoContratos > 0) insightsExecutivos.push({ severidade: "positivo", texto: `${tt.iaImpacto1} ${fmt(economiaTotalConsolidacao)} ${tt.iaImpacto2} ${fmt(valorEmRiscoContratos)}.` });
  const resumoExecutivoIA = fornecedores.length === 0 ? tt.iaSemDados : `${tt.iaResumo1} ${fornecedores.length} ${tt.iaResumo2} ${scoreCarteira.amostraSuficiente ? `${scoreCarteira.media}/1000` : tt.semDados}.`;

  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${tt.dashboardTitulo}`,
    `🏭 ${tt.kpiTotal}: ${fornecedores.length}`,
    `💰 ${tt.kpiComprasAno}: ${fmt(comprasAno)}`,
    scoreCarteira.amostraSuficiente ? `⭐ ${tt.kpiScoreMedio}: ${scoreCarteira.media}/1000` : "",
    "_axiomaai.com.br_",
  ].filter(Boolean).join("\n");
  const canaisShare = canaisCompartilhamento(textoShare, `${tt.dashboardTitulo} — Axioma`);
  const copiarShare = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  const botaoNovaConta = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={abrirNovaConta}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
      + {idioma === "pt" ? "Nova Conta a Pagar" : "New Bill"}
    </motion.button>
  );

  return (
    <ModuloLayout
      titulo={t.fornecedores.titulo}
      subtitulo={t.fornecedores.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={abrirNovoForn}
      labelBotao={t.fornecedores.novoFornecedor}
      botaoExtra={botaoNovaConta}
    >
      <div className="space-y-4">

        {/* ====== DASHBOARD EXECUTIVO (Fase 2) ====== */}
        <CanvasBox cor={AMBAR}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{tt.dashboardTitulo}</h3>
              <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.dashboardSub}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={periodoPersonalizado} onChangePersonalizado={setPeriodoPersonalizado} cor={AMBAR} lang={lang} />
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: "rgba(245,158,11,0.12)", border: `1px solid ${AMBAR}40`, color: AMBAR }}>
                <Share2 size={14} /> {cx.compartilhar}
              </motion.button>
            </div>
          </div>

          {/* Grid de 17 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-5">
            {kpis.map((k) => (
              <button key={k.key} onClick={() => setDrillDown(k.key)} className="text-left rounded-xl p-3 transition-all hover:scale-[1.02]"
                style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${k.cor}30` }}>
                <p className="text-[10px] font-semibold tracking-wider uppercase mb-1.5" style={{ color: "#5a7a9a" }}>{k.label}</p>
                <p className="text-lg font-black" style={{ color: k.cor, ...FONTE_EXEC }}>{k.valor}</p>
                {k.sub && <p className="text-[10px] truncate mt-0.5" style={{ color: "#5a7a9a" }}>{k.sub}</p>}
                {k.vazio && <p className="text-[9px] mt-1 flex items-center gap-1" style={{ color: "#5a7a9a" }}><ChevronRight size={9} /> {tt.semDados}</p>}
              </button>
            ))}
          </div>

          {/* Curva ABC + Distribuição Geográfica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.curvaAbcTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.curvaAbcSub}</p>
              {curvaABCOption ? (
                <>
                  <ReactECharts option={curvaABCOption} style={{ height: 220 }} notMerge lazyUpdate />
                  <div className="flex items-center gap-3 mt-2 flex-wrap text-[10px]">
                    <span className="flex items-center gap-1" style={{ color: "#f87171" }}>● {tt.classeA}</span>
                    <span className="flex items-center gap-1" style={{ color: "#fbbf24" }}>● {tt.classeB}</span>
                    <span className="flex items-center gap-1" style={{ color: "#34d399" }}>● {tt.classeC}</span>
                  </div>
                </>
              ) : <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.curvaAbcVazio}</p>}
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.geoTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.geoSub}</p>
              {geoOption ? <ReactECharts option={geoOption} style={{ height: 220 }} notMerge lazyUpdate /> : <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.geoVazio}</p>}
            </div>
          </div>

          {/* Radar de Risco + Escada de Vencimentos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.radarTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.radarSub}</p>
              {radarTemDado ? <ReactECharts option={radarOption} style={{ height: 240 }} notMerge lazyUpdate /> : <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.radarVazio}</p>}
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.escadaTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.escadaSub}</p>
              {escadaVencimentos.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.escadaVazio}</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {escadaVencimentos.slice(0, 12).map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: `${corUrgencia(r.urgencia)}0e`, border: `1px solid ${corUrgencia(r.urgencia)}30` }}>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{r.descricao}</p>
                        <p className="text-[10px] font-medium" style={{ color: corUrgencia(r.urgencia) }}>{r.categoria} · {textoUrgencia(r.diasRestantes)}</p>
                      </div>
                      {r.valor > 0 && <p className="text-xs font-black flex-shrink-0 ml-2" style={{ color: corUrgencia(r.urgencia) }}>{fmt(r.valor)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ranking Axioma (Fase 3) */}
          <div className="rounded-xl p-4 mt-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
            <p className="text-sm font-black mb-0.5 flex items-center gap-2" style={{ color: "#f1f5f9", ...FONTE_EXEC }}><Trophy size={15} style={{ color: AMBAR }} /> {tt.rankingTitulo}</p>
            <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.rankingSub}</p>
            {rankingAxioma.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.rankingVazio}</p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {rankingAxioma.map((r, i) => (
                  <button key={r.fornecedor.id} onClick={() => setScoreDrillId(r.fornecedor.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: `${NIVEL_SCORE_COR[r.score.nivel]}0e`, border: `1px solid ${NIVEL_SCORE_COR[r.score.nivel]}30` }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-black w-5 flex-shrink-0" style={{ color: "#5a7a9a" }}>#{i + 1}</span>
                      <div className="min-w-0 text-left">
                        <p className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{r.fornecedor.nome}</p>
                        <p className="text-[10px]" style={{ color: NIVEL_SCORE_COR[r.score.nivel] }}>{NIVEL_SCORE_LABEL[r.score.nivel]}</p>
                      </div>
                    </div>
                    <p className="text-base font-black flex-shrink-0 ml-2" style={{ color: NIVEL_SCORE_COR[r.score.nivel], ...FONTE_EXEC }}>{r.score.total}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CanvasBox>

        {/* ====== INTELIGÊNCIA DE COMPRAS (Fase 4) ====== */}
        <CanvasBox cor={AMBAR}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{tt.inteligenciaTitulo}</h3>
              <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.inteligenciaSub}</p>
            </div>
            {fornecedoresComHistorico.length > 0 && (
              <select value={fornecedorEvolucaoAtual?.id || ""} onChange={(e) => setFornecedorEvolucaoId(e.target.value)}
                className="px-3 py-2 rounded-xl text-xs font-bold focus:outline-none cursor-pointer"
                style={{ background: "rgba(10,22,40,0.9)", border: `1px solid ${AMBAR}40`, color: AMBAR }}>
                {fornecedoresComHistorico.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            )}
          </div>

          {/* Evolução + Inflação + Tendência de Reajuste */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="lg:col-span-2 rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.evolucaoComprasTitulo}{fornecedorEvolucaoAtual ? ` — ${fornecedorEvolucaoAtual.nome}` : ""}</p>
              {evolucaoOption ? <ReactECharts option={evolucaoOption} style={{ height: 200 }} notMerge lazyUpdate /> : <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.evolucaoComprasVazio}</p>}
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.inflacaoTitulo}</p>
              {inflacao && inflacao.amostraSuficiente ? (
                <div>
                  <p className="text-2xl font-black" style={{ color: inflacao.variacaoPct > 0 ? "#f87171" : inflacao.variacaoPct < 0 ? "#34d399" : "#6ab0ff", ...FONTE_EXEC }}>
                    {inflacao.variacaoPct > 0 ? "+" : ""}{inflacao.variacaoPct}%
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "#5a7a9a" }}>{fmt(inflacao.ticketAnterior)} → {fmt(inflacao.ticketAtual)}</p>
                </div>
              ) : <p className="text-xs py-4" style={{ color: "#5a7a9a" }}>{tt.inflacaoVazio}</p>}
            </div>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
            <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.tendenciaTitulo}{fornecedorEvolucaoAtual ? ` — ${fornecedorEvolucaoAtual.nome}` : ""}</p>
            {tendenciaFornecedor.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "#5a7a9a" }}>{tt.tendenciaVazio}</p>
            ) : (
              <div className="space-y-1.5">
                {tendenciaFornecedor.slice(0, 6).map((a, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)" }}>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{a.descricao}</p>
                      <p className="text-[10px]" style={{ color: "#f87171" }}>{a.tipo === "aumento_recorrente" ? tt.tendenciaAumentoRecorrente : tt.tendenciaAcimaMedia}</p>
                    </div>
                    <p className="text-xs font-black flex-shrink-0 ml-2" style={{ color: "#f87171" }}>{fmt(a.valorReferencia)} → {fmt(a.valorAtual)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sazonalidade + Desperdícios */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.sazonalidadeTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.sazonalidadeSub}</p>
              {sazonalidadeOption ? <ReactECharts option={sazonalidadeOption} style={{ height: 200 }} notMerge lazyUpdate /> : <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.sazonalidadeVazio}</p>}
            </div>
            <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
              <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.desperdiciosTitulo}</p>
              <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.desperdiciosSub}</p>
              {desperdicios.alertas.length === 0 ? (
                <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.desperdiciosVazio}</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {desperdicios.alertas.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(248,113,113,0.08)" }}>
                      <p className="text-xs truncate" style={{ color: "#e2e8f0" }}>{d.descricao}</p>
                      <p className="text-xs font-black flex-shrink-0 ml-2" style={{ color: "#f87171" }}>{fmt(d.valorPotencial)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Oportunidades de Consolidação */}
          <div className="rounded-xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${AMBAR}20` }}>
            <p className="text-sm font-black mb-0.5" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.consolidacaoTitulo}</p>
            <p className="text-[10px] mb-3" style={{ color: "#5a7a9a" }}>{tt.consolidacaoSub}</p>
            {consolidacao.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.consolidacaoVazio}</p>
            ) : (
              <div className="space-y-3">
                {consolidacao.slice(0, 5).map((g) => (
                  <div key={g.categoria} className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-black" style={{ color: AMBAR }}>{g.categoria}</p>
                      <p className="text-xs font-black" style={{ color: "#34d399" }}>{tt.economiaEstimadaLabel}: {fmt(g.economiaEstimada)}</p>
                    </div>
                    <div className="space-y-1">
                      {g.fornecedores.map((f, idx) => (
                        <div key={f.id} className="flex items-center justify-between text-[11px]">
                          <span style={{ color: "#c8d8f0" }}>{f.nome} {idx === 0 && <span className="px-1.5 py-0.5 rounded-full ml-1" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", fontSize: "9px" }}>{tt.maisBaratoTag}</span>}</span>
                          <span style={{ color: "#5a7a9a" }}>{fmt(f.ticketMedio)}/{idioma === "pt" ? "compra" : idioma === "es" ? "compra" : "purchase"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CanvasBox>

        {/* ====== PAINEL DE ALERTAS (Fase 4) ====== */}
        <CanvasBox cor={alertasCriticos > 0 ? "#f87171" : alertasAtencao > 0 ? AMBAR : "#34d399"}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{tt.alertasPainelTitulo}</h3>
              <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.alertasPainelSub}</p>
            </div>
            <div className="flex items-center gap-2">
              {alertasCriticos > 0 && <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{alertasCriticos} {tt.nivelCritico}</span>}
              {alertasAtencao > 0 && <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: AMBAR }}>{alertasAtencao} {tt.nivelAtencao}</span>}
            </div>
          </div>

          {alertas.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.alertasVazio}</p>
          ) : (
            <div className="space-y-2">
              {alertas.map((a, i) => (
                <div key={i} className="rounded-xl p-3 flex items-start gap-3" style={{ background: `${NIVEL_SCORE_COR[a.severidade]}0e`, border: `1px solid ${NIVEL_SCORE_COR[a.severidade]}30` }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: NIVEL_SCORE_COR[a.severidade] }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold" style={{ color: "#e2e8f0" }}>{a.titulo}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{a.descricao}</p>
                    <p className="text-[11px] mt-1 font-semibold" style={{ color: NIVEL_SCORE_COR[a.severidade] }}>→ {a.acao}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] mt-4 pt-3" style={{ color: "#5a7a9a", borderTop: "1px solid rgba(255,255,255,0.06)" }}>{tt.alertaQuedaQualidadeLegenda}</p>
        </CanvasBox>

        {/* ====== SIMULADOR EXECUTIVO (Fase 5A) ====== */}
        <CanvasBox cor={AMBAR}>
          <div className="mb-4">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
            <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{tt.simuladorTitulo}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.simuladorSub}</p>
          </div>

          {!temDadosSimulador ? (
            <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.simuladorVazio}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <CampoSelect label={tt.lblTipoCenario} value={tipoCenario} onChange={(v) => setTipoCenario(v as typeof tipoCenario)}
                  opcoes={[{ value: "troca", label: tt.cenarioTroca }, { value: "preco", label: tt.cenarioPreco }, { value: "prazo", label: tt.cenarioPrazo }, { value: "cambio", label: tt.cenarioCambio }, { value: "perda", label: tt.cenarioPerda }, { value: "novo", label: tt.cenarioNovo }]} />
                <CampoSelect label={tt.lblFornecedorSimulado} value={fornecedorSimuladoId || ""} onChange={setFornecedorSimuladoId}
                  opcoes={fornecedores.filter(f => (f.status || "ativo") === "ativo").map(f => ({ value: f.id, label: f.nome }))} />
                <CampoSelect label={tt.lblTipoCusto} value={tipoCustoSimulado} onChange={(v) => setTipoCustoSimulado(v as typeof tipoCustoSimulado)}
                  opcoes={[{ value: "fixo", label: tt.tipoCustoFixo }, { value: "variavel", label: tt.tipoCustoVariavel }]} />
                <Campo label={tt.lblHorizonte} value={horizonteSimulacao} onChange={setHorizonteSimulacao} tipo="number" />

                {(tipoCenario === "troca" || tipoCenario === "novo") && <Campo label={tt.lblNovoValor} value={novoValorMensal} onChange={setNovoValorMensal} tipo="number" />}
                {tipoCenario === "preco" && <Campo label={tt.lblDeltaPreco} value={deltaPrecoPct} onChange={setDeltaPrecoPct} tipo="number" />}
                {tipoCenario === "prazo" && <Campo label={tt.lblDeltaDias} value={deltaDiasPrazo} onChange={setDeltaDiasPrazo} tipo="number" />}
                {tipoCenario === "cambio" && (<>
                  <Campo label={tt.lblChoqueCambio} value={choqueCambioPct} onChange={setChoqueCambioPct} tipo="number" />
                  <Campo label={tt.lblExposicaoCambial} value={exposicaoCambialFornPct} onChange={setExposicaoCambialFornPct} tipo="number" />
                </>)}
                {tipoCenario === "perda" && <Campo label={tt.lblValorSubstituto} value={valorSubstituto} onChange={setValorSubstituto} tipo="number" />}
              </div>

              {!podeSimular ? (
                <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.simuladorVazio}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ color: "#5a7a9a" }}>
                        <th className="text-left py-2 font-semibold">{tt.colCenario}</th>
                        <th className="text-right py-2 font-semibold">{tt.colReceita}</th>
                        <th className="text-right py-2 font-semibold">{tt.colEbitda}</th>
                        <th className="text-right py-2 font-semibold">{tt.colLucro}</th>
                        <th className="text-right py-2 font-semibold">{tt.colMargem}</th>
                        <th className="text-right py-2 font-semibold">{tt.colCaixa}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <td className="py-2 font-bold" style={{ color: "#94a3b8" }}>{cx.hoje}</td>
                        <td className="text-right py-2" style={{ color: "#94a3b8" }}>{fmt(dreHojeSim.receitaBruta.valor)}</td>
                        <td className="text-right py-2" style={{ color: "#94a3b8" }}>{fmt(dreHojeSim.ebitda.valor)}</td>
                        <td className="text-right py-2 font-bold" style={{ color: "#94a3b8" }}>{fmt(dreHojeSim.lucroLiquido.valor)}</td>
                        <td className="text-right py-2" style={{ color: "#94a3b8" }}>{receitaMensalMedia > 0 ? ((dreHojeSim.lucroLiquido.valor / receitaMensalMedia) * 100).toFixed(1) : "0.0"}%</td>
                        <td className="text-right py-2 font-bold" style={{ color: "#94a3b8" }}>{fmt(caixaDisponivelSim)}</td>
                      </tr>
                      {cenariosSimulados.map((c) => {
                        const margem = c.receitaMensal > 0 ? (c.lucroLiquidoMensal / c.receitaMensal) * 100 : 0;
                        const cor = c.nome === "adverso" ? "#f87171" : c.nome === "otimista" ? "#34d399" : c.nome === "conservador" ? AMBAR : "#6ab0ff";
                        return (
                          <tr key={c.nome} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                            <td className="py-2 font-bold" style={{ color: cor }}>{NOME_CENARIO_LABEL[c.nome]}</td>
                            <td className="text-right py-2" style={{ color: "#c8d8f0" }}>{fmt(c.receitaMensal)}</td>
                            <td className="text-right py-2" style={{ color: "#c8d8f0" }}>{fmt(c.ebitdaMensal)}</td>
                            <td className="text-right py-2 font-bold" style={{ color: c.lucroLiquidoMensal >= 0 ? "#34d399" : "#f87171" }}>{fmt(c.lucroLiquidoMensal)}</td>
                            <td className="text-right py-2" style={{ color: "#c8d8f0" }}>{margem.toFixed(1)}%</td>
                            <td className="text-right py-2 font-bold" style={{ color: c.saldoCaixaProjetado >= caixaDisponivelSim ? "#34d399" : "#f87171" }}>{fmt(c.saldoCaixaProjetado)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <p className="text-[10px] mt-3" style={{ color: "#5a7a9a" }}>{tt.notaCapitalGiro}</p>
                </div>
              )}
            </>
          )}
        </CanvasBox>

        {/* ====== REFORMA TRIBUTÁRIA 2026 (Fase 5B) ====== */}
        <CanvasBox cor={AMBAR}>
          <div className="mb-4">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
            <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{tt.reformaTitulo}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.reformaSub}</p>
          </div>
          <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: `1px solid ${AMBAR}30` }}>
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: AMBAR }} />
            <p className="text-xs" style={{ color: "#e2e8f0" }}>{tt.reformaAviso}</p>
          </div>

          {creditoReforma.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: "#5a7a9a" }}>{tt.reformaVazio}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {(["pleno", "parcial", "baixo", "indefinido"] as const).map((nivel) => (
                  <div key={nivel} className="rounded-xl p-3 text-center" style={{ background: `${NIVEL_CREDITO_COR[nivel]}0e`, border: `1px solid ${NIVEL_CREDITO_COR[nivel]}30` }}>
                    <p className="text-xl font-black" style={{ color: NIVEL_CREDITO_COR[nivel], ...FONTE_EXEC }}>{contagemCredito[nivel]}</p>
                    <p className="text-[10px] mt-1" style={{ color: NIVEL_CREDITO_COR[nivel] }}>{NIVEL_CREDITO_LABEL[nivel]}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {creditoReforma.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <p className="text-xs truncate" style={{ color: "#e2e8f0" }}>{c.nome}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2" style={{ background: `${NIVEL_CREDITO_COR[c.nivel]}18`, color: NIVEL_CREDITO_COR[c.nivel] }}>{NIVEL_CREDITO_LABEL[c.nivel]}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CanvasBox>

        {/* ====== IA EXECUTIVA (Fase 5C) ====== */}
        <CanvasBox cor={AMBAR}>
          <div className="mb-4">
            <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "#c8d8f0", ...FONTE_EXEC }}><Sparkles size={16} style={{ color: AMBAR }} /> {tt.iaExecutivaTitulo}</h3>
            <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{tt.iaExecutivaSub}</p>
          </div>
          <div className="rounded-xl p-3 mb-4" style={{ background: "rgba(245,158,11,0.06)", border: `1px solid ${AMBAR}20` }}>
            <p className="text-xs" style={{ color: "#94a3b8" }}>{tt.iaExecutivaAviso}</p>
          </div>
          <p className="text-sm font-semibold mb-4" style={{ color: "#e2e8f0" }}>{resumoExecutivoIA}</p>

          {insightsExecutivos.length === 0 ? (
            <p className="text-xs py-6 text-center" style={{ color: "#5a7a9a" }}>{tt.alertasVazio}</p>
          ) : (
            <div className="space-y-2">
              {insightsExecutivos.map((ins, i) => {
                const cor = ins.severidade === "critico" ? "#f87171" : ins.severidade === "atencao" ? AMBAR : "#34d399";
                return (
                  <div key={i} className="rounded-xl p-3 flex items-start gap-3" style={{ background: `${cor}0e`, border: `1px solid ${cor}30` }}>
                    {ins.severidade === "positivo" ? <Sparkles size={14} className="flex-shrink-0 mt-0.5" style={{ color: cor }} /> : <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: cor }} />}
                    <p className="text-xs" style={{ color: "#e2e8f0" }}>{ins.texto}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CanvasBox>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: idioma === "pt" ? "Fornecedores" : "Suppliers", value: `${fornecedores.length}`, cor: AMBAR },
            { label: idioma === "pt" ? "A Pagar (aberto)" : "Payable", value: fmt(totalEmAberto), cor: "#fbbf24" },
            { label: idioma === "pt" ? "Total Pago" : "Total Paid", value: fmt(totalPago), cor: "#34d399" },
            { label: idioma === "pt" ? "Vencido" : "Overdue", value: fmt(totalVencido), cor: "#f87171" },
            { label: tt.kpiDocumentosVencer, value: `${qtdDocVencer}`, cor: qtdDocVencer > 0 ? "#f87171" : "#5a7a9a" },
            { label: tt.kpiContratosVencer, value: `${qtdContratoVencer}`, cor: qtdContratoVencer > 0 ? "#f87171" : "#5a7a9a" },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
              <p className="text-xl font-bold" style={{ color: card.cor }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {[
            { key: "fornecedores", label: idioma === "pt" ? "Fornecedores" : "Suppliers", Icon: Building2 },
            { key: "contas", label: idioma === "pt" ? "Contas a Pagar" : "Payables", Icon: FileText },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBusca(""); setBuscaContas(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: aba === a.key ? "rgba(245,158,11,0.2)" : "rgba(10,20,36,0.7)", color: aba === a.key ? AMBAR : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(245,158,11,0.4)" : "rgba(59,111,212,0.15)"}` }}>
              <a.Icon size={15} /> {a.label}
            </motion.button>
          ))}
        </div>

        {/* ====== ABA FORNECEDORES ====== */}
        {aba === "fornecedores" && (
          <div className="space-y-3">
            <CanvasBox cor={AMBAR}>
              <div className="flex items-center gap-2">
                <Search size={16} style={{ color: "#5a7a9a" }} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
              </div>
            </CanvasBox>

            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fornecedoresFiltrados.length === 0 ? (
              <CanvasBox cor={AMBAR}>
                <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{t.fornecedores.semFornecedores}</p></div>
              </CanvasBox>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fornecedoresFiltrados.map((f, i) => {
                  const contasForn = contas.filter(c => c.fornecedor_id === f.id);
                  const aberto = contasForn.reduce((s, c) => s + Math.max(0, c.valor_total - c.valor_pago), 0);
                  const alertas = alertasDoFornecedor(f.id);
                  const scoreItem = rankingAxioma.find(r => r.fornecedor.id === f.id);
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor={AMBAR}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "rgba(245,158,11,0.2)", color: AMBAR }}>{f.nome.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{f.nome}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: AMBAR }}>{f.categoria || "-"}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (f.status || "ativo") === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: (f.status || "ativo") === "ativo" ? "#34d399" : "#f87171" }}>
                                  {(f.status || "ativo") === "ativo" ? (idioma === "pt" ? "Ativo" : "Active") : (idioma === "pt" ? "Inativo" : "Inactive")}
                                </span>
                                {alertas > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>
                                    <AlertTriangle size={10} /> {alertas}
                                  </span>
                                )}
                                {scoreItem && scoreItem.score.total > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-bold" style={{ background: `${NIVEL_SCORE_COR[scoreItem.score.nivel]}18`, color: NIVEL_SCORE_COR[scoreItem.score.nivel] }}>
                                    <Gauge size={10} /> {scoreItem.score.total}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => setScoreDrillId(f.id)} title={tt.verScore} style={{ color: AMBAR }}><Gauge size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoForn(f)} style={{ color: AMBAR }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirForn(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs" style={{ color: "#5a7a9a" }}>
                          {f.documento && <p>📄 {f.documento}</p>}
                          {(f.telefone || f.contato) && <p>📞 {f.telefone || f.contato}</p>}
                          {f.email && <p className="truncate">✉️ {f.email}</p>}
                          {f.chave_pix && <p className="truncate">🔑 PIX: {f.chave_pix}</p>}
                          {f.produto_servico && <p>📦 {f.produto_servico}</p>}
                        </div>
                        {contasForn.length > 0 && (
                          <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: "1px solid rgba(245,158,11,0.1)" }}>
                            <div className="text-center rounded-xl p-2" style={{ background: "rgba(251,191,36,0.08)" }}>
                              <p className="text-xs font-black" style={{ color: "#fbbf24" }}>{fmt(aberto)}</p>
                              <p style={{ color: "#5a7a9a", fontSize: "9px" }}>{idioma === "pt" ? "Em aberto" : "Open"}</p>
                            </div>
                            <div className="text-center rounded-xl p-2" style={{ background: "rgba(245,158,11,0.08)" }}>
                              <p className="text-xs font-black" style={{ color: AMBAR }}>{contasForn.length}</p>
                              <p style={{ color: "#5a7a9a", fontSize: "9px" }}>{idioma === "pt" ? "Contas" : "Bills"}</p>
                            </div>
                          </div>
                        )}
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== ABA CONTAS A PAGAR ====== */}
        {aba === "contas" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <div className="flex items-center gap-2">
                <Search size={16} style={{ color: "#5a7a9a" }} />
                <input value={buscaContas} onChange={(e) => setBuscaContas(e.target.value)} placeholder={idioma === "pt" ? "Buscar por descrição ou fornecedor..." : "Search..."} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
              </div>
            </CanvasBox>

            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : contasFiltradas.length === 0 ? (
              <CanvasBox cor="#fbbf24">
                <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhuma conta a pagar cadastrada." : "No payables yet."}</p></div>
              </CanvasBox>
            ) : (
              <div className="space-y-3">
                {contasFiltradas.map((c, i) => {
                  const fnome = fornecedores.find(f => f.id === c.fornecedor_id)?.nome;
                  const resta = Math.max(0, c.valor_total - c.valor_pago);
                  const prog = c.valor_total > 0 ? (c.valor_pago / c.valor_total) * 100 : 0;
                  const cor = statusCor(c.status);
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor={cor}>
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{c.descricao}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {fnome && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: AMBAR }}>🏭 {fnome}</span>}
                              {c.forma_pagamento && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>{c.forma_pagamento}</span>}
                              {c.numero_nota && <span className="text-xs" style={{ color: "#5a7a9a" }}>NF: {c.numero_nota}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: `${cor}15`, color: cor }}>{statusLabel(c.status)}</span>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoConta(c)} style={{ color: AMBAR }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirConta(c.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: idioma === "pt" ? "Total" : "Total", val: fmt(c.valor_total), cor: "#c8d8f0" },
                            { label: idioma === "pt" ? "Pago" : "Paid", val: fmt(c.valor_pago), cor: "#34d399" },
                            { label: idioma === "pt" ? "Resta" : "Remaining", val: fmt(resta), cor: "#fbbf24" },
                          ].map((s) => (
                            <div key={s.label}>
                              <p className="text-xs mb-0.5" style={{ color: "#5a7a9a" }}>{s.label}</p>
                              <p className="text-sm font-black" style={{ color: s.cor }}>{s.val}</p>
                            </div>
                          ))}
                        </div>
                        <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(prog, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, #1a3a8f, ${cor})` }} />
                        </div>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-xs" style={{ color: "#5a7a9a" }}>
                            {c.data_vencimento ? `${idioma === "pt" ? "Vence" : "Due"}: ${new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                            {c.parcelas && c.parcelas > 1 ? ` · ${c.parcelas}x` : ""}
                          </span>
                          {c.status !== "pago" && (
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => quitarConta(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                              <CheckCircle2 size={13} /> {idioma === "pt" ? "Quitar" : "Settle"}
                            </motion.button>
                          )}
                        </div>
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== MODAL FORNECEDOR — Cadastro Enterprise em etapas ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalForn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto">
                <CanvasBox cor={AMBAR}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoForn ? tt.editarFornecedor : t.fornecedores.novoFornecedor}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalForn} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>

                  {erroCadastro && (
                    <div className="mb-4 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.12)", color: "#f87171" }}>{erroCadastro}</div>
                  )}

                  {/* Stepper */}
                  <div className="flex items-start gap-0.5 mb-5 overflow-x-auto pb-1">
                    {ETAPAS_CADASTRO.map((et, idx) => (
                      <button key={et} onClick={() => setEtapaCadastro(idx)} className="flex flex-col items-center gap-1 flex-shrink-0 px-1.5" style={{ opacity: idx <= etapaCadastro ? 1 : 0.45 }}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
                          style={{ background: idx < etapaCadastro ? "#34d399" : idx === etapaCadastro ? AMBAR : "rgba(148,163,184,0.15)", color: idx <= etapaCadastro ? "#fff" : "#64748b" }}>
                          {idx < etapaCadastro ? <Check size={12} /> : idx + 1}
                        </div>
                        <span className="text-[8px] whitespace-nowrap" style={{ color: idx === etapaCadastro ? AMBAR : "#5a7a9a" }}>{tt.etapaNomes[et]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 min-h-[220px]">
                    {ETAPAS_CADASTRO[etapaCadastro] === "identificacao" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CampoSelect label={tt.lblTipoPessoa} value={nf.tipo_pessoa} onChange={(v) => setNf({ ...nf, tipo_pessoa: v })} opcoes={[{ value: "PJ", label: tt.pessoaJuridica }, { value: "PF", label: tt.pessoaFisica }]} />
                        <Campo label={nf.tipo_pessoa === "PF" ? "CPF" : "CNPJ"} value={nf.documento}
                          onChange={(v) => setNf({ ...nf, documento: nf.tipo_pessoa === "PF" ? formatarCPF(v) : formatarCNPJ(v) })}
                          onBlur={() => validarCampoForm("documento", nf.documento)} erro={errosForm.documento} />
                        <Campo label={`${idioma === "pt" ? "Nome / Apelido" : "Name"} *`} value={nf.nome} onChange={(v) => setNf({ ...nf, nome: v })} />
                        <Campo label={tt.lblRazaoSocial} value={nf.razao_social} onChange={(v) => setNf({ ...nf, razao_social: v })} />
                        <Campo label={tt.lblNomeFantasia} value={nf.nome_fantasia} onChange={(v) => setNf({ ...nf, nome_fantasia: v })} />
                        <CampoSelect label={tt.lblPorte} value={nf.porte} onChange={(v) => setNf({ ...nf, porte: v })} opcoes={tt.portes} />
                        <CampoSelect label={tt.lblCategoria} value={nf.categoria} onChange={(v) => setNf({ ...nf, categoria: v })} opcoes={categorias.map(c => ({ value: c, label: c }))} />
                        <CampoSelect label={tt.lblStatus} value={nf.status} onChange={(v) => setNf({ ...nf, status: v })} opcoes={[{ value: "ativo", label: tt.ativo }, { value: "inativo", label: tt.inativo }]} />
                        <Campo label={tt.lblValorMensal} value={nf.valor_mensal} onChange={(v) => setNf({ ...nf, valor_mensal: v })} tipo="number" />
                        <Campo label={tt.lblResumoFornecimento} value={nf.produto_servico} onChange={(v) => setNf({ ...nf, produto_servico: v })} />
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "contatos" && (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.contatoPrincipalTitulo}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Campo label={tt.lblResponsavel} value={nf.responsavel} onChange={(v) => setNf({ ...nf, responsavel: v })} />
                            <Campo label={tt.lblTelefone} value={nf.telefone} onChange={(v) => setNf({ ...nf, telefone: formatarTelefone(v) })}
                              onBlur={() => validarCampoForm("telefone", nf.telefone)} erro={errosForm.telefone} />
                            <div className="md:col-span-2"><Campo label={tt.lblEmail} value={nf.email} onChange={(v) => setNf({ ...nf, email: v })} tipo="email"
                              onBlur={() => validarCampoForm("email", nf.email)} erro={errosForm.email} /></div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.outrosContatosTitulo}</p>
                          {!fornecedorAtualId ? (
                            <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.salveFornecedorPrimeiro}</p>
                          ) : (
                            <>
                              {contatosForn.length === 0 ? (
                                <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.outrosContatosVazio}</p>
                              ) : (
                                <div className="space-y-1.5 mb-3">
                                  {contatosForn.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: "#c8d8f0" }}>{c.nome} {c.principal && <span style={{ color: AMBAR }}>★</span>}</p>
                                        <p className="text-[10px] truncate" style={{ color: "#5a7a9a" }}>{[c.cargo, c.telefone, c.email].filter(Boolean).join(" · ")}</p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => editarContato(c)} style={{ color: AMBAR }}><Pencil size={13} /></button>
                                        <button onClick={() => removerContato(c.id)} style={{ color: "#f87171" }}><Trash2 size={13} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <Campo label={tt.lblNomeContato} value={novoContato.nome} onChange={(v) => setNovoContato({ ...novoContato, nome: v })} />
                                <Campo label={tt.lblCargoContato} value={novoContato.cargo} onChange={(v) => setNovoContato({ ...novoContato, cargo: v })} />
                                <Campo label={tt.lblEmail} value={novoContato.email} onChange={(v) => setNovoContato({ ...novoContato, email: v })} />
                                <Campo label={tt.lblTelefone} value={novoContato.telefone} onChange={(v) => setNovoContato({ ...novoContato, telefone: formatarTelefone(v) })} />
                                <Campo label={tt.lblWhatsapp} value={novoContato.whatsapp} onChange={(v) => setNovoContato({ ...novoContato, whatsapp: v })} />
                                <div className="flex items-end"><CampoCheckbox label={tt.contatoPrincipalCheck} checked={novoContato.principal} onChange={(v) => setNovoContato({ ...novoContato, principal: v })} /></div>
                                <div className="col-span-2 flex gap-2">
                                  <button onClick={adicionarContato} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{editandoContatoId ? tt.salvarAlteracoes : `+ ${tt.adicionarContato}`}</button>
                                  {editandoContatoId && <button onClick={cancelarEdicaoContato} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.cancelarEdicao}</button>}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "endereco" && (
                      <div className="space-y-3">
                        <div className="max-w-[280px]">
                          <CampoPaisAutocomplete label={tt.paisLabel} value={nf.pais} onChange={(v) => setNf({ ...nf, pais: v, uf: "", cidade: "" })} opcoes={nomesPaises(idioma === "pt" ? "pt-BR" : idioma === "es" ? "es-ES" : "en-US")} />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={labelCls} style={labelStyle}>{tt.lblCep} {buscandoCep && <span style={{ color: "#34d399", fontWeight: 400 }}>· {tt.buscandoCep}</span>}</label>
                            <input value={nf.cep} onChange={(e) => { const v = e.target.value; setNf({ ...nf, cep: v }); if (v.replace(/\D/g, "").length === 8) buscarCep(v); }}
                              onBlur={() => validarCampoForm("cep", nf.cep)} placeholder="00000-000" className={inputCls} style={inputStyle} />
                            {errosForm.cep && <p className="text-[10px] mt-1" style={{ color: "#f87171" }}>{errosForm.cep}</p>}
                          </div>
                          {nf.pais === "BR" ? (
                            <>
                              <CampoSelect label={tt.lblEstado} value={nf.uf} onChange={(v) => setNf({ ...nf, uf: v, cidade: "" })} opcoes={estados.map((e) => ({ value: e.sigla, label: `${e.sigla} — ${e.nome}` }))} placeholder={tt.selecioneEstado} />
                              {municipios.length > 0 ? (
                                <CampoSelect label={tt.lblCidade} value={nf.cidade} onChange={(v) => setNf({ ...nf, cidade: v })} opcoes={municipios.map((m) => ({ value: m.nome, label: m.nome }))} placeholder={tt.selecioneCidade} />
                              ) : (
                                <Campo label={tt.lblCidade} value={nf.cidade} onChange={(v) => setNf({ ...nf, cidade: v })} placeholder={nf.uf ? tt.digiteCidadeManual : tt.selecioneEstadoPrimeiro} />
                              )}
                            </>
                          ) : (
                            <>
                              <Campo label={tt.lblEstado} value={nf.uf} onChange={(v) => setNf({ ...nf, uf: v })} />
                              <Campo label={tt.lblCidade} value={nf.cidade} onChange={(v) => setNf({ ...nf, cidade: v })} />
                            </>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="col-span-2"><Campo label={tt.lblEnderecoRua} value={nf.endereco} onChange={(v) => setNf({ ...nf, endereco: v })} /></div>
                          <Campo label={tt.lblNumero} value={nf.numero} onChange={(v) => setNf({ ...nf, numero: v })} />
                          <Campo label={tt.lblBairro} value={nf.bairro} onChange={(v) => setNf({ ...nf, bairro: v })} />
                          <Campo label={tt.lblComplemento} value={nf.complemento} onChange={(v) => setNf({ ...nf, complemento: v })} />
                        </div>
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "documentacao" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.documentacaoTitulo}</p>
                        {!fornecedorAtualId ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.salveFornecedorPrimeiro}</p>
                        ) : (
                          <>
                            {documentosForn.length === 0 ? (
                              <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.documentosVazio}</p>
                            ) : (
                              <div className="space-y-1.5 mb-3">
                                {documentosForn.map((d) => {
                                  const vencido = d.data_validade && d.data_validade < hoje;
                                  const aVencer = d.data_validade && !vencido && documentosVencendo([d], 30).aVencer.length > 0;
                                  const tipoInfo = TIPOS_DOCUMENTO_FORNECEDOR.find(t => t.key === d.tipo);
                                  return (
                                    <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: "#c8d8f0" }}>{tipoInfo?.icon} {d.nome}</p>
                                        {d.data_validade && <p className="text-[10px]" style={{ color: vencido ? "#f87171" : aVencer ? "#fbbf24" : "#5a7a9a" }}>{tt.lblValidade}: {new Date(d.data_validade + "T00:00:00").toLocaleDateString("pt-BR")} {vencido ? `· ${tt.statusVencido}` : aVencer ? `· ${tt.statusAVencer}` : ""}</p>}
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        {d.storage_path && <button onClick={() => baixarDocumento(d)} style={{ color: AMBAR }}><Download size={13} /></button>}
                                        <button onClick={() => editarDocumento(d)} style={{ color: AMBAR }}><Pencil size={13} /></button>
                                        <button onClick={() => removerDocumento(d)} style={{ color: "#f87171" }}><Trash2 size={13} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                              <CampoSelect label={tt.lblTipoDocumento} value={novoDocumento.tipo} onChange={(v) => setNovoDocumento({ ...novoDocumento, tipo: v })} opcoes={TIPOS_DOCUMENTO_FORNECEDOR.map(t => ({ value: t.key, label: `${t.icon} ${t.label}` }))} />
                              <Campo label={tt.lblNomeDocumento} value={novoDocumento.nome} onChange={(v) => setNovoDocumento({ ...novoDocumento, nome: v })} />
                              <Campo label={tt.lblNumeroDocumento} value={novoDocumento.numero_documento} onChange={(v) => setNovoDocumento({ ...novoDocumento, numero_documento: v })} />
                              <Campo label={tt.lblEmissao} value={novoDocumento.data_emissao} onChange={(v) => setNovoDocumento({ ...novoDocumento, data_emissao: v })} tipo="date" />
                              <Campo label={tt.lblValidade} value={novoDocumento.data_validade} onChange={(v) => setNovoDocumento({ ...novoDocumento, data_validade: v })} tipo="date" />
                              <div>
                                <label className={labelCls} style={labelStyle}>{tt.lblArquivo}</label>
                                <input type="file" onChange={(e) => setArquivoDocumento(e.target.files?.[0] || null)} className={inputCls} style={inputStyle} />
                              </div>
                              <div className="col-span-2 flex gap-2">
                                <button onClick={adicionarDocumento} disabled={enviandoDocumento} className="flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{enviandoDocumento ? tt.enviando : (editandoDocumentoId ? tt.salvarAlteracoes : `+ ${tt.adicionarDocumento}`)}</button>
                                {editandoDocumentoId && <button onClick={cancelarEdicaoDocumento} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.cancelarEdicao}</button>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "fiscal" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblInscricaoEstadual} value={nf.inscricao_estadual} onChange={(v) => setNf({ ...nf, inscricao_estadual: v })} />
                        <Campo label={tt.lblInscricaoMunicipal} value={nf.inscricao_municipal} onChange={(v) => setNf({ ...nf, inscricao_municipal: v })} />
                        <CampoSelect label={tt.lblRegimeTributario} value={nf.regime_tributario} onChange={(v) => setNf({ ...nf, regime_tributario: v })} opcoes={tt.regimes} />
                        <CampoSelect label={tt.lblContribuinteIcms} value={nf.contribuinte_icms} onChange={(v) => setNf({ ...nf, contribuinte_icms: v })} opcoes={tt.contribuintes} />
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "financeiro" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Campo label={tt.lblBanco} value={nf.banco} onChange={(v) => setNf({ ...nf, banco: v })} />
                        <Campo label={tt.lblAgencia} value={nf.agencia} onChange={(v) => setNf({ ...nf, agencia: v })} />
                        <Campo label={tt.lblConta} value={nf.conta} onChange={(v) => setNf({ ...nf, conta: v })} />
                        <Campo label={tt.lblPix} value={nf.chave_pix} onChange={(v) => setNf({ ...nf, chave_pix: v })} />
                        <Campo label={tt.lblCondicaoPagamento} value={nf.condicao_pagamento} onChange={(v) => setNf({ ...nf, condicao_pagamento: v })} placeholder={idioma === "pt" ? "ex: 30 dias" : "e.g. 30 days"} />
                        <Campo label={tt.lblPrazoMedio} value={nf.prazo_medio_dias} onChange={(v) => setNf({ ...nf, prazo_medio_dias: v })} tipo="number" />
                        <CampoSelect label={tt.lblMoeda} value={nf.moeda} onChange={(v) => setNf({ ...nf, moeda: v })} opcoes={moedas.map(m => ({ value: m, label: m }))} />
                        <CampoSelect label={tt.lblFormaPagamentoPreferencial} value={nf.forma_pagamento_preferencial} onChange={(v) => setNf({ ...nf, forma_pagamento_preferencial: v })} opcoes={formasPagamento.map(f => ({ value: f, label: f }))} />
                        <CampoSelect label={tt.lblCentroCusto} value={nf.centro_custo_id} onChange={(v) => setNf({ ...nf, centro_custo_id: v })} opcoes={centrosCusto.map(c => ({ value: c.id, label: c.nome }))} placeholder={tt.selecioneCentroCusto} />
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "contratos" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.contratosTitulo}</p>
                        {!fornecedorAtualId ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.salveFornecedorPrimeiro}</p>
                        ) : (
                          <>
                            {contratosForn.length === 0 ? (
                              <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.contratosVazio}</p>
                            ) : (
                              <div className="space-y-1.5 mb-3">
                                {contratosForn.map((c) => {
                                  const vencido = c.data_fim && c.data_fim < hoje;
                                  const saldo = (c.valor_contratado || 0) - (c.valor_utilizado || 0);
                                  return (
                                    <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                      <div className="min-w-0">
                                        <p className="text-xs font-semibold truncate" style={{ color: "#c8d8f0" }}>{c.descricao} {c.renovacao_automatica && "🔄"}</p>
                                        <p className="text-[10px]" style={{ color: vencido ? "#f87171" : "#5a7a9a" }}>
                                          {c.data_fim ? `${tt.lblDataFim}: ${new Date(c.data_fim + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                                          {c.valor_contratado ? ` · ${tt.saldoContrato}: ${fmt(saldo)}` : ""}
                                          {vencido ? ` · ${tt.statusVencido}` : ""}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => editarContrato(c)} style={{ color: AMBAR }}><Pencil size={13} /></button>
                                        <button onClick={() => removerContrato(c.id)} style={{ color: "#f87171" }}><Trash2 size={13} /></button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                              <div className="col-span-2"><Campo label={tt.lblDescricaoContrato} value={novoContrato.descricao} onChange={(v) => setNovoContrato({ ...novoContrato, descricao: v })} /></div>
                              <Campo label={tt.lblDataInicio} value={novoContrato.data_inicio} onChange={(v) => setNovoContrato({ ...novoContrato, data_inicio: v })} tipo="date" />
                              <Campo label={tt.lblDataFim} value={novoContrato.data_fim} onChange={(v) => setNovoContrato({ ...novoContrato, data_fim: v })} tipo="date" />
                              <Campo label={tt.lblIndiceReajuste} value={novoContrato.indice_reajuste} onChange={(v) => setNovoContrato({ ...novoContrato, indice_reajuste: v })} placeholder="IGPM, IPCA..." />
                              <div className="flex items-end"><CampoCheckbox label={tt.lblRenovacaoAutomatica} checked={novoContrato.renovacao_automatica} onChange={(v) => setNovoContrato({ ...novoContrato, renovacao_automatica: v })} /></div>
                              <Campo label={tt.lblValorContratado} value={novoContrato.valor_contratado} onChange={(v) => setNovoContrato({ ...novoContrato, valor_contratado: v })} tipo="number" />
                              <Campo label={tt.lblValorUtilizado} value={novoContrato.valor_utilizado} onChange={(v) => setNovoContrato({ ...novoContrato, valor_utilizado: v })} tipo="number" />
                              <div className="col-span-2 flex gap-2">
                                <button onClick={adicionarContrato} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{editandoContratoId ? tt.salvarAlteracoes : `+ ${tt.adicionarContrato}`}</button>
                                {editandoContratoId && <button onClick={cancelarEdicaoContrato} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.cancelarEdicao}</button>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "produtos" && (
                      <div>
                        <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.produtosTitulo}</p>
                        {!fornecedorAtualId ? (
                          <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.salveFornecedorPrimeiro}</p>
                        ) : (
                          <>
                            {produtosForn.length === 0 ? (
                              <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.produtosVazio}</p>
                            ) : (
                              <div className="space-y-1.5 mb-3">
                                {produtosForn.map((p) => (
                                  <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold truncate" style={{ color: "#c8d8f0" }}>{p.descricao}</p>
                                      <p className="text-[10px] truncate" style={{ color: "#5a7a9a" }}>{[p.categoria, p.unidade, p.valor_unitario ? fmt(p.valor_unitario) : null].filter(Boolean).join(" · ")}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button onClick={() => editarProduto(p)} style={{ color: AMBAR }}><Pencil size={13} /></button>
                                      <button onClick={() => removerProduto(p.id)} style={{ color: "#f87171" }}><Trash2 size={13} /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                              <div className="col-span-2"><Campo label={tt.lblDescricaoProduto} value={novoProduto.descricao} onChange={(v) => setNovoProduto({ ...novoProduto, descricao: v })} /></div>
                              <Campo label={tt.lblCategoriaProduto} value={novoProduto.categoria} onChange={(v) => setNovoProduto({ ...novoProduto, categoria: v })} />
                              <Campo label={tt.lblUnidade} value={novoProduto.unidade} onChange={(v) => setNovoProduto({ ...novoProduto, unidade: v })} placeholder="un, kg, hora..." />
                              <Campo label={tt.lblValorUnitario} value={novoProduto.valor_unitario} onChange={(v) => setNovoProduto({ ...novoProduto, valor_unitario: v })} tipo="number" />
                              <div className="flex items-end gap-2">
                                <button onClick={adicionarProduto} className="flex-1 py-3 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{editandoProdutoId ? tt.salvarAlteracoes : `+ ${tt.adicionarProduto}`}</button>
                                {editandoProdutoId && <button onClick={cancelarEdicaoProduto} className="px-3 py-3 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.cancelarEdicao}</button>}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "qualidade" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <CampoSelect label={tt.lblNivelQualidade} value={nf.nivel_qualidade} onChange={(v) => setNf({ ...nf, nivel_qualidade: v })} opcoes={tt.niveisQualidade} />
                        <Campo label={tt.lblCertificacoes} value={nf.certificacoes} onChange={(v) => setNf({ ...nf, certificacoes: v })} placeholder={tt.certificacoesPlaceholder} />
                        <div className="md:col-span-2"><CampoTextarea label={tt.lblObservacoesQualidade} value={nf.observacoes_qualidade} onChange={(v) => setNf({ ...nf, observacoes_qualidade: v })} linhas={3} /></div>
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "risco" && (
                      <div className="space-y-3">
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.riscoTexto}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <CampoSelect label={tt.lblClassificacaoRisco} value={nf.classificacao_risco} onChange={(v) => setNf({ ...nf, classificacao_risco: v })} opcoes={tt.classificacoesRisco} />
                          <CampoSelect label={tt.lblNivelDependencia} value={nf.nivel_dependencia} onChange={(v) => setNf({ ...nf, nivel_dependencia: v })} opcoes={tt.niveisDependencia} />
                        </div>
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "ia" && (
                      <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                        <Sparkles size={28} style={{ color: AMBAR, opacity: 0.6 }} />
                        <p className="text-xs font-black" style={{ color: AMBAR }}>{tt.iaTitulo}</p>
                        <p className="text-xs max-w-sm" style={{ color: "#5a7a9a" }}>{tt.iaTexto}</p>
                      </div>
                    )}

                    {ETAPAS_CADASTRO[etapaCadastro] === "observacoes" && (
                      <div className="space-y-4">
                        <CampoTextarea label={tt.lblObservacoesGerais} value={nf.observacoes} onChange={(v) => setNf({ ...nf, observacoes: v })} linhas={3} />
                        <div>
                          <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.timelineTitulo}</p>
                          {!fornecedorAtualId ? (
                            <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.salveFornecedorPrimeiro}</p>
                          ) : (
                            <>
                              {interacoesForn.length === 0 ? (
                                <p className="text-xs mb-3" style={{ color: "#5a7a9a" }}>{tt.timelineVazio}</p>
                              ) : (
                                <div className="space-y-1.5 mb-3 max-h-40 overflow-y-auto pr-1">
                                  {interacoesForn.map((it) => (
                                    <div key={it.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                                      <div className="min-w-0 flex items-start gap-2">
                                        <Clock size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#5a7a9a" }} />
                                        <div className="min-w-0">
                                          <p className="text-[10px]" style={{ color: "#5a7a9a" }}>{new Date(it.data + "T00:00:00").toLocaleDateString("pt-BR")} {it.tipo ? `· ${it.tipo}` : ""}</p>
                                          <p className="text-xs truncate" style={{ color: "#c8d8f0" }}>{it.descricao}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <button onClick={() => editarInteracao(it)} style={{ color: AMBAR }}><Pencil size={13} /></button>
                                        <button onClick={() => removerInteracao(it.id)} style={{ color: "#f87171" }}><Trash2 size={13} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                                <Campo label={tt.lblDataInteracao} value={novaInteracao.data} onChange={(v) => setNovaInteracao({ ...novaInteracao, data: v })} tipo="date" />
                                <Campo label={tt.lblTipoInteracao} value={novaInteracao.tipo} onChange={(v) => setNovaInteracao({ ...novaInteracao, tipo: v })} placeholder="Reunião, e-mail..." />
                                <div className="col-span-2"><Campo label={tt.lblDescricaoInteracao} value={novaInteracao.descricao} onChange={(v) => setNovaInteracao({ ...novaInteracao, descricao: v })} /></div>
                                <div className="col-span-2 flex gap-2">
                                  <button onClick={adicionarInteracao} className="flex-1 py-2 rounded-lg text-xs font-bold" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{editandoInteracaoId ? tt.salvarAlteracoes : `+ ${tt.adicionarInteracao}`}</button>
                                  {editandoInteracaoId && <button onClick={cancelarEdicaoInteracao} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.cancelarEdicao}</button>}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    {etapaCadastro > 0 ? (
                      <button onClick={() => setEtapaCadastro(etapaCadastro - 1)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{tt.anterior}</button>
                    ) : (
                      <button onClick={fecharModalForn} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    )}
                    {etapaCadastro < ETAPAS_CADASTRO.length - 1 ? (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={avancarEtapa} disabled={salvandoForn}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{salvandoForn ? t.geral.carregando : tt.proximo}</motion.button>
                    ) : (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={concluirCadastro} disabled={salvandoForn}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${BRONZE}, ${AMBAR})`, color: "#fff" }}>{salvandoForn ? t.geral.carregando : tt.concluirCadastro}</motion.button>
                    )}
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ====== MODAL CONTA A PAGAR ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {modalConta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center z-[100] px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-lg max-h-[calc(100vh-8rem)] overflow-y-auto">
                <CanvasBox cor="#fbbf24">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#fbbf24" }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoConta ? (idioma === "pt" ? "Editar Conta a Pagar" : "Edit Bill") : (idioma === "pt" ? "Nova Conta a Pagar" : "New Bill")}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalConta} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Fornecedor" : "Supplier"}</label>
                      <select value={nc.fornecedor_id} onChange={(e) => {
                          const fid = e.target.value;
                          const f = fornecedores.find((x) => x.id === fid);
                          setNc((prev) => ({ ...prev, fornecedor_id: fid, ...(f ? sugerirDadosContaPorFornecedor(f, prev.data_emissao) : {}) }));
                        }} className={inputCls} style={selectStyle}>
                        <option value="">-- {idioma === "pt" ? "Selecione" : "Select"} --</option>
                        {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Descrição" : "Description"} *</label>
                      <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Valor Total (R$)" : "Total (R$)"} *</label>
                        <input type="number" value={nc.valor_total} onChange={(e) => setNc({ ...nc, valor_total: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Valor Pago (R$)" : "Paid (R$)"}</label>
                        <input type="number" value={nc.valor_pago} onChange={(e) => setNc({ ...nc, valor_pago: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Forma de Pagamento" : "Payment Method"}</label>
                        <select value={nc.forma_pagamento} onChange={(e) => setNc({ ...nc, forma_pagamento: e.target.value })} className={inputCls} style={selectStyle}>
                          {formasPagamento.map(f => <option key={f}>{f}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Parcelas" : "Installments"}</label>
                        <input type="number" value={nc.parcelas} onChange={(e) => setNc({ ...nc, parcelas: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Emissão" : "Issue Date"}</label>
                        <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Vencimento" : "Due Date"}</label>
                        <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Nº Nota Fiscal" : "Invoice No."}</label>
                        <input value={nc.numero_nota} onChange={(e) => setNc({ ...nc, numero_nota: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Categoria" : "Category"}</label>
                        <select value={nc.categoria} onChange={(e) => setNc({ ...nc, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                          {categorias.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Observações" : "Notes"}</label>
                      <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={fecharModalConta} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarConta} disabled={salvandoConta}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                        {salvandoConta ? t.geral.carregando : (idioma === "pt" ? "Salvar Conta" : "Save Bill")}
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

      {/* ====== DRILL-DOWN de KPI ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {kpiAtivo && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setDrillDown(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <CanvasBox cor={kpiAtivo.cor === "#5a7a9a" ? AMBAR : kpiAtivo.cor}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{kpiAtivo.label}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setDrillDown(null)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>
                  <p className="text-3xl font-black mb-3" style={{ color: kpiAtivo.cor, ...FONTE_EXEC }}>{kpiAtivo.valor}</p>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "#c8d8f0" }}>{(tt.explicacoes as Record<string, string>)[kpiAtivo.key]}</p>
                  {kpiAtivo.vazio && kpiAtivo.mensagemVazio && (
                    <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: "rgba(245,158,11,0.08)", border: `1px solid ${AMBAR}30` }}>
                      <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" style={{ color: AMBAR }} />
                      <p className="text-xs" style={{ color: "#e2e8f0" }}>{kpiAtivo.mensagemVazio}</p>
                    </div>
                  )}
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ====== DETALHAMENTO — Score Corporativo Axioma (Fase 3) ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {scoreDrillItem && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setScoreDrillId(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
                className="w-full max-w-xl max-h-[calc(100vh-8rem)] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <CanvasBox cor={NIVEL_SCORE_COR[scoreDrillItem.score.nivel]}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{scoreDrillItem.fornecedor.nome}</h3>
                      <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.scoreAxiomaTitulo}</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setScoreDrillId(null)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>

                  {velocimetroOption && <ReactECharts option={velocimetroOption} style={{ height: 200 }} notMerge lazyUpdate />}
                  <div className="flex justify-center -mt-3 mb-4">
                    <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${NIVEL_SCORE_COR[scoreDrillItem.score.nivel]}18`, color: NIVEL_SCORE_COR[scoreDrillItem.score.nivel] }}>{NIVEL_SCORE_LABEL[scoreDrillItem.score.nivel]}</span>
                  </div>

                  <p className="text-xs font-black mb-2" style={{ color: AMBAR }}>{tt.criteriosTitulo}</p>
                  <div className="space-y-1.5">
                    {scoreDrillItem.score.criterios.map((c) => (
                      <div key={c.chave} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{NOME_CRITERIO[c.chave]}</p>
                          <p className="text-[10px]" style={{ color: "#5a7a9a" }}>{tt.pesoLabel}: {c.peso}</p>
                        </div>
                        {c.semDados ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "rgba(148,163,184,0.1)", color: "#5a7a9a" }}>{tt.semDadosCriterio}</span>
                        ) : (
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black" style={{ color: (c.valor || 0) >= 70 ? "#34d399" : (c.valor || 0) >= 40 ? AMBAR : "#f87171" }}>{Math.round(c.valor as number)}</p>
                            <p className="text-[9px]" style={{ color: "#5a7a9a" }}>+{c.contribuicao} {tt.contribuicaoLabel.toLowerCase()}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CanvasBox>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ====== CENTRO DE COMPARTILHAMENTO ====== */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {shareAberto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-start justify-center pt-24 pb-8 z-[100] px-4 overflow-y-auto"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <CanvasBox cor={AMBAR}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: BRONZE }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {canaisShare.map((c) => (
                      <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                        style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>{c.nome}</a>
                    ))}
                    <button onClick={copiarShare} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>{copiado ? cx.copiado : cx.copiar}</button>
                    <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.4)", color: "#fca5a5" }}>PDF</button>
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
