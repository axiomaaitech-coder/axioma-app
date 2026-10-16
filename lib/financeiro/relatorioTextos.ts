// Textos dos relatórios (pt/en/es). A FÓRMULA e o significado de cada indicador são os mesmos nos 3 idiomas
// (lib/financeiro/semantica.ts): aqui só muda a língua. Formatação de moeda/data/número pelo idioma.
import type { Lang, TipoRelatorio } from './relatorioTipos'
import type { EstadoResultado } from './contrato'

const D = {
  titulo_executivo: ['Relatório Executivo Financeiro', 'Executive Financial Report', 'Informe Ejecutivo Financiero'],
  titulo_dre: ['DRE — Demonstração do Resultado (competência)', 'Income Statement (accrual)', 'Estado de Resultados (devengo)'],
  titulo_fluxo_caixa: ['Fluxo de Caixa e Tesouraria', 'Cash Flow and Treasury', 'Flujo de Caja y Tesorería'],
  titulo_contas_receber: ['Contas a Receber', 'Accounts Receivable', 'Cuentas por Cobrar'],
  titulo_contas_pagar: ['Contas a Pagar', 'Accounts Payable', 'Cuentas por Pagar'],
  titulo_receitas: ['Receitas', 'Revenue', 'Ingresos'],
  titulo_despesas: ['Custos e Despesas', 'Costs and Expenses', 'Costos y Gastos'],
  titulo_endividamento: ['Endividamento e Compromissos', 'Debt and Commitments', 'Endeudamiento y Compromisos'],
  titulo_tributario: ['Tributos e Obrigações', 'Taxes and Obligations', 'Tributos y Obligaciones'],
  titulo_pdv: ['PDV e Operação Comercial', 'POS and Sales Operation', 'PDV y Operación Comercial'],
  titulo_conciliacao: ['Conciliação e Consistência dos Dados', 'Data Reconciliation and Consistency', 'Conciliación y Consistencia de Datos'],
  resumo: ['Resumo executivo', 'Executive summary', 'Resumen ejecutivo'],
  indicadores: ['Indicadores principais', 'Key indicators', 'Indicadores principales'],
  riscos: ['Riscos e pontos de atenção', 'Risks and attention points', 'Riesgos y puntos de atención'],
  recomendacoes: ['Recomendações', 'Recommendations', 'Recomendaciones'],
  limitacoes: ['Limitações e dados ausentes', 'Limitations and missing data', 'Limitaciones y datos faltantes'],
  metodologia: ['Fontes e metodologia', 'Sources and methodology', 'Fuentes y metodología'],
  faturamento: ['Faturamento (competência)', 'Revenue (accrual)', 'Facturación (devengo)'],
  recebido: ['Recebido no período (caixa)', 'Received in the period (cash)', 'Cobrado en el período (caja)'],
  pago: ['Pago no período (caixa)', 'Paid in the period (cash)', 'Pagado en el período (caja)'],
  despesas: ['Despesas (competência)', 'Expenses (accrual)', 'Gastos (devengo)'],
  lucro: ['Lucro líquido (DRE)', 'Net profit (income statement)', 'Utilidad neta (estado de resultados)'],
  margem: ['Margem líquida', 'Net margin', 'Margen neto'],
  caixa: ['Caixa realizado (não é dinheiro livre)', 'Realized cash (not free cash)', 'Caja realizada (no es dinero libre)'],
  a_receber: ['A receber em aberto', 'Open receivables', 'Por cobrar abierto'],
  a_receber_vencido: ['A receber vencido', 'Overdue receivables', 'Por cobrar vencido'],
  a_pagar: ['A pagar em aberto', 'Open payables', 'Por pagar abierto'],
  a_pagar_vencido: ['A pagar vencido', 'Overdue payables', 'Por pagar vencido'],
  dividas: ['Dívidas (saldo devedor)', 'Debt (outstanding balance)', 'Deudas (saldo pendiente)'],
  receita_bruta: ['Receita bruta', 'Gross revenue', 'Ingreso bruto'],
  devolucoes: ['(−) Devoluções e cancelamentos', '(−) Returns and cancellations', '(−) Devoluciones y cancelaciones'],
  impostos: ['(−) Impostos sobre vendas (estimativa pelo regime)', '(−) Sales taxes (estimate by tax regime)', '(−) Impuestos sobre ventas (estimación por régimen)'],
  receita_liquida: ['= Receita líquida', '= Net revenue', '= Ingreso neto'],
  custos_variaveis: ['(−) Custos variáveis', '(−) Variable costs', '(−) Costos variables'],
  margem_contribuicao: ['= Margem de contribuição', '= Contribution margin', '= Margen de contribución'],
  custos_fixos: ['(−) Custos fixos', '(−) Fixed costs', '(−) Costos fijos'],
  resultado_operacional: ['= Resultado operacional', '= Operating result', '= Resultado operativo'],
  juros_pagos: ['(−) Juros pagos', '(−) Interest paid', '(−) Intereses pagados'],
  juros_estimados: ['(−) Juros estimados das dívidas', '(−) Estimated debt interest', '(−) Intereses estimados de deudas'],
  lucro_liquido: ['= Lucro líquido', '= Net profit', '= Utilidad neta'],
  linha: ['Linha', 'Line', 'Línea'], valor: ['Valor', 'Amount', 'Valor'], pct_receita: ['% da receita', '% of revenue', '% del ingreso'],
  anterior: ['Período anterior', 'Previous period', 'Período anterior'], variacao: ['Variação', 'Change', 'Variación'],
  categoria: ['Categoria', 'Category', 'Categoría'], cliente: ['Cliente', 'Client', 'Cliente'], fornecedor: ['Fornecedor', 'Supplier', 'Proveedor'],
  descricao: ['Descrição', 'Description', 'Descripción'], vencimento: ['Vencimento', 'Due date', 'Vencimiento'], saldo: ['Saldo', 'Balance', 'Saldo'],
  dias_atraso: ['Dias de atraso', 'Days overdue', 'Días de atraso'], participacao: ['Participação', 'Share', 'Participación'], registros: ['Registros', 'Records', 'Registros'],
  periodo_col: ['Período', 'Period', 'Período'], juros_mes: ['Juros ao mês', 'Monthly interest', 'Interés mensual'], parcelas: ['Parcelas', 'Installments', 'Cuotas'],
  status: ['Situação', 'Status', 'Situación'], tipo: ['Tipo', 'Type', 'Tipo'], estimado: ['Estimado', 'Estimated', 'Estimado'], pago_col: ['Pago', 'Paid', 'Pagado'],
  faixa: ['Faixa de atraso', 'Overdue range', 'Rango de atraso'], quantidade: ['Quantidade', 'Count', 'Cantidad'],
  sem_dados: ['Não há registros para os filtros usados.', 'No records for the filters used.', 'No hay registros para los filtros usados.'],
  forma: ['Forma de pagamento', 'Payment method', 'Forma de pago'], vendas: ['Vendas', 'Sales', 'Ventas'],
  classe: ['Classificação', 'Classification', 'Clasificación'], motivo: ['Motivo', 'Reason', 'Motivo'],
} as const
const I: Record<Lang, number> = { pt: 0, en: 1, es: 2 }
export type ChaveTexto = keyof typeof D
export const tx = (lang: Lang, k: ChaveTexto) => D[k][I[lang]]
export const tituloRelatorio = (tipo: TipoRelatorio, lang: Lang) => tx(lang, `titulo_${tipo}` as ChaveTexto)

const LOCALE: Record<Lang, string> = { pt: 'pt-BR', en: 'en-US', es: 'es-ES' }
export const fmtMoeda = (v: number | null | undefined, lang: Lang) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat(LOCALE[lang], { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v))
export const fmtPct = (v: number | null | undefined, lang: Lang) => (v == null || !Number.isFinite(v) ? '—' : `${new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)}%`)
export const fmtNum = (v: number | null | undefined, lang: Lang) => (v == null || !Number.isFinite(v) ? '—' : new Intl.NumberFormat(LOCALE[lang]).format(v))
export const fmtData = (iso: string | null | undefined, lang: Lang) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  return lang === 'en' ? `${m}/${d}/${a}` : `${d}/${m}/${a}`
}
export function fmtCelula(v: string | number | null | undefined, tipo: 'texto' | 'moeda' | 'pct' | 'data' | 'numero', lang: Lang): string {
  if (v == null || v === '') return '—'
  if (tipo === 'moeda') return fmtMoeda(Number(v), lang)
  if (tipo === 'pct') return fmtPct(Number(v), lang)
  if (tipo === 'numero') return fmtNum(Number(v), lang)
  if (tipo === 'data') return fmtData(String(v), lang)
  return String(v)
}

// Nome do período e das fontes nos 3 idiomas (o rótulo do motor temporal é só em português)
const PERIODO: Record<string, [string, string, string]> = {
  hoje: ['Hoje', 'Today', 'Hoy'], ontem: ['Ontem', 'Yesterday', 'Ayer'], esta_semana: ['Esta semana', 'This week', 'Esta semana'],
  semana_anterior: ['Semana anterior', 'Previous week', 'Semana anterior'], ultimos_7_dias: ['Últimos 7 dias', 'Last 7 days', 'Últimos 7 días'],
  proximos_7_dias: ['Próximos 7 dias', 'Next 7 days', 'Próximos 7 días'], proximos_30_dias: ['Próximos 30 dias', 'Next 30 days', 'Próximos 30 días'],
  este_mes: ['Este mês', 'This month', 'Este mes'], mes_anterior: ['Mês anterior', 'Previous month', 'Mes anterior'],
  ultimos_30_dias: ['Últimos 30 dias', 'Last 30 days', 'Últimos 30 días'], este_trimestre: ['Este trimestre', 'This quarter', 'Este trimestre'],
  trimestre_anterior: ['Trimestre anterior', 'Previous quarter', 'Trimestre anterior'], este_ano: ['Este ano', 'This year', 'Este año'],
  ano_anterior: ['Ano anterior', 'Previous year', 'Año anterior'], ultimos_12_meses: ['Últimos 12 meses', 'Last 12 months', 'Últimos 12 meses'],
  personalizado: ['Período escolhido', 'Custom period', 'Período elegido'], anterior: ['Período anterior equivalente', 'Equivalent previous period', 'Período anterior equivalente'],
}
export const rotuloPeriodo = (nome: string, inicio: string, fim: string, lang: Lang) =>
  `${(PERIODO[nome] ?? PERIODO.personalizado)[I[lang]]} (${fmtData(inicio, lang)} – ${fmtData(fim, lang)})`
const FONTE: Record<string, [string, string, string]> = {
  contas_receber: ['Contas a Receber', 'Accounts Receivable', 'Cuentas por Cobrar'], contas_pagar: ['Contas a Pagar', 'Accounts Payable', 'Cuentas por Pagar'],
  receitas: ['Receitas', 'Revenue', 'Ingresos'], custos_variaveis: ['Custos Variáveis', 'Variable Costs', 'Costos Variables'], custos_fixos: ['Custos Fixos', 'Fixed Costs', 'Costos Fijos'],
  clientes: ['Clientes', 'Clients', 'Clientes'], fornecedores: ['Fornecedores', 'Suppliers', 'Proveedores'], fluxo_caixa: ['Fluxo de Caixa', 'Cash Flow', 'Flujo de Caja'],
  venda: ['PDV (vendas)', 'POS (sales)', 'PDV (ventas)'], 'venda (PDV)': ['PDV (vendas)', 'POS (sales)', 'PDV (ventas)'], dividas: ['Dívidas', 'Debts', 'Deudas'],
  'DRE por competência': ['DRE por competência', 'Accrual income statement', 'Estado de resultados por devengo'],
  empresa_obrigacoes: ['Obrigações da Empresa', 'Company Obligations', 'Obligaciones de la Empresa'], guias_arrecadacao: ['Guias de impostos', 'Tax slips', 'Guías de impuestos'],
  mei_obrigacoes: ['Obrigações do MEI', 'MEI Obligations', 'Obligaciones del MEI'], turno_caixa: ['Turnos de caixa', 'Cash shifts', 'Turnos de caja'],
  caixa_movimentacao: ['Sangrias e suprimentos', 'Cash withdrawals and deposits', 'Retiros y aportes de caja'],
}
export const nomeFonte = (f: string, lang: Lang) => (FONTE[f] ? FONTE[f][I[lang]] : f)
// Escolha de texto curto nos 3 idiomas, para frases montadas com números
export const L = (lang: Lang, pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)

export const nomePeriodo = (nome: string, lang: Lang) => (PERIODO[nome] ?? PERIODO.personalizado)[I[lang]]

// Rótulos e formatação comuns à tela e ao PDF (os dois mostram os mesmos números)
export function formatarIndicador(i: { valor: number | null; unidade: string }, lang: Lang) {
  if (i.unidade === 'BRL') return fmtMoeda(i.valor, lang)
  if (i.unidade === 'PCT') return fmtPct(i.valor, lang)
  return fmtNum(i.valor, lang)
}
export function dataHoraNoFuso(iso: string, fuso: string, lang: Lang) {
  try { return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { timeZone: fuso, dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso)) } catch { return iso }
}
export const rotuloEstado = (e: EstadoResultado, lang: Lang) => ({
  verificado: L(lang, 'Verificado', 'Verified', 'Verificado'), parcial: L(lang, 'Parcial — veja as limitações', 'Partial — see limitations', 'Parcial — vea las limitaciones'),
  indisponivel: L(lang, 'Indisponível', 'Unavailable', 'No disponible'), erro: L(lang, 'Erro de consulta', 'Query error', 'Error de consulta'), nao_aplicavel: L(lang, 'Não se aplica', 'Not applicable', 'No aplica'),
}[e])
export const rotuloClasse = (c: string, lang: Lang) => ({ fato: L(lang, 'Fato', 'Fact', 'Hecho'), calculo: L(lang, 'Cálculo', 'Calculation', 'Cálculo'), estimativa: L(lang, 'Estimativa', 'Estimate', 'Estimación'), interpretacao: L(lang, 'Interpretação', 'Interpretation', 'Interpretación'), hipotese: L(lang, 'Hipótese', 'Hypothesis', 'Hipótesis') } as Record<string, string>)[c] ?? c
export const rotuloPrioridade = (p: string, lang: Lang) => ({ alta: L(lang, 'Prioridade alta', 'High priority', 'Prioridad alta'), media: L(lang, 'Prioridade média', 'Medium priority', 'Prioridad media'), baixa: L(lang, 'Prioridade baixa', 'Low priority', 'Prioridad baja') } as Record<string, string>)[p] ?? p
export const rotuloConfianca = (c: string, lang: Lang) => ({ alta: L(lang, 'confiança alta', 'high confidence', 'confianza alta'), media: L(lang, 'confiança média', 'medium confidence', 'confianza media'), baixa: L(lang, 'confiança baixa', 'low confidence', 'confianza baja') } as Record<string, string>)[c] ?? c

