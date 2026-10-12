// CATÁLOGO ÚNICO DE PLANOS (Elias 2026-10-11) — preço, pessoas, saldo de IA e recargas.
// Pagamento (Stripe), tela Planos, Uso da IA e página inicial leem daqui. Os limites de IA
// também estão no banco (ia_limite_plano em IA-SALDO-SQL.sql): mudar um = mudar os dois.
// Chaves internas antigas mantidas (starter/pro/business/enterprise) — já gravadas nas empresas.

export type PlanoId = 'starter' | 'pro' | 'business' | 'enterprise'
export type TipoIA = 'openai' | 'anthropic' | 'nota'
type T3 = { pt: string; en: string; es: string }

export const PLANOS: Record<PlanoId, { nome: T3; mensalCentavos: number; anualPorMesCentavos: number; pessoas: number; ia: Record<TipoIA, number> }> = {
  starter:    { nome: { pt: 'MEI', en: 'MEI', es: 'MEI' },                 mensalCentavos: 5990,  anualPorMesCentavos: 4990,  pessoas: 1,  ia: { openai: 150,  anthropic: 20,  nota: 20 } },
  pro:        { nome: { pt: 'Essencial', en: 'Essential', es: 'Esencial' }, mensalCentavos: 14990, anualPorMesCentavos: 12490, pessoas: 2,  ia: { openai: 500,  anthropic: 60,  nota: 60 } },
  business:   { nome: { pt: 'Empresa', en: 'Business', es: 'Empresa' },    mensalCentavos: 29790, anualPorMesCentavos: 24790, pessoas: 5,  ia: { openai: 1000, anthropic: 120, nota: 120 } },
  enterprise: { nome: { pt: 'Premium', en: 'Premium', es: 'Premium' },     mensalCentavos: 59790, anualPorMesCentavos: 49790, pessoas: 10, ia: { openai: 2000, anthropic: 300, nota: 250 } },
}

// Teste grátis: 7 dias com cartão; IA só nos 3 primeiros dias.
export const TESTE = { dias: 7, diasIA: 3, ia: { openai: 20, anthropic: 5, nota: 5 } as Record<TipoIA, number> }

// Inauguração: 30% nos 3 primeiros meses, só as 100 primeiras empresas (o Stripe conta). Recarga sem desconto.
export const INAUGURACAO = { cupom: 'INAUGURACAO30', porcento: 30, meses: 3, vagas: 100 }

export const RECARGAS: Record<TipoIA, { quantidade: number; centavos: number; nome: T3 }> = {
  openai:    { quantidade: 100, centavos: 2990, nome: { pt: '+100 perguntas da IA comum', en: '+100 standard AI questions', es: '+100 preguntas de IA común' } },
  anthropic: { quantidade: 20,  centavos: 1990, nome: { pt: '+20 perguntas da IA avançada', en: '+20 advanced AI questions', es: '+20 preguntas de IA avanzada' } },
  nota:      { quantidade: 20,  centavos: 1490, nome: { pt: '+20 notas lidas pela IA', en: '+20 invoices read by AI', es: '+20 facturas leídas por IA' } },
}

export const ehPlano = (x: unknown): x is PlanoId => typeof x === 'string' && x in PLANOS
export const ehTipoIA = (x: unknown): x is TipoIA => x === 'openai' || x === 'anthropic' || x === 'nota'
export const reais = (centavos: number, lang: 'pt' | 'en' | 'es' = 'pt') =>
  (centavos / 100).toLocaleString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { style: 'currency', currency: 'BRL' })

// O que cada plano traz (só o que existe hoje no Axioma) — tela Planos e página inicial.
export const PLANO_DESCRICAO: Record<PlanoId, T3> = {
  starter: { pt: 'Para MEI e autônomos', en: 'For MEI and freelancers', es: 'Para MEI y autónomos' },
  pro: { pt: 'Para microempresas', en: 'For micro businesses', es: 'Para microempresas' },
  business: { pt: 'Para pequenas empresas', en: 'For small businesses', es: 'Para pequeñas empresas' },
  enterprise: { pt: 'Tudo do Axioma, com inteligência de mercado', en: 'All of Axioma, with market intelligence', es: 'Todo Axioma, con inteligencia de mercado' },
}
export const PLANO_RECURSOS: Record<PlanoId, Record<'pt' | 'en' | 'es', string[]>> = {
  starter: {
    pt: ['Módulo MEI completo (DAS, DASN, abrir empresa)', 'Receitas, custos, Fluxo de Caixa e DRE', 'IA MEI Advisor', 'Português, inglês e espanhol', 'Exportar PDF, Excel e CSV'],
    en: ['Full MEI module (DAS, DASN, open a company)', 'Revenue, costs, Cash Flow and P&L', 'MEI AI Advisor', 'Portuguese, English and Spanish', 'Export PDF, Excel and CSV'],
    es: ['Módulo MEI completo (DAS, DASN, abrir empresa)', 'Ingresos, costos, Flujo de Caja y Estado de Resultados', 'IA MEI Advisor', 'Portugués, inglés y español', 'Exportar PDF, Excel y CSV'],
  },
  pro: {
    pt: ['Tudo do MEI', 'Contabilidade, contas a pagar e a receber, estoque', 'Relatórios', 'IA Financeira', 'Conferência diária entre módulos'],
    en: ['Everything in MEI', 'Accounting, payables and receivables, inventory', 'Reports', 'Financial AI', 'Daily cross-module check'],
    es: ['Todo de MEI', 'Contabilidad, cuentas por pagar y cobrar, inventario', 'Informes', 'IA Financiera', 'Conciliación diaria entre módulos'],
  },
  business: {
    pt: ['Tudo do Essencial', 'IA Tributária', 'PDV (ponto de venda)', 'Centros de Custo', 'Painel de Risco e Métricas do CFO'],
    en: ['Everything in Essential', 'Tax AI', 'POS (point of sale)', 'Cost Centers', 'Risk Panel and CFO Metrics'],
    es: ['Todo de Esencial', 'IA Tributaria', 'PDV (punto de venta)', 'Centros de Costo', 'Panel de Riesgo y Métricas del CFO'],
  },
  enterprise: {
    pt: ['Tudo do Empresa', 'Nexus e o José (inteligência de mercado)', 'Várias empresas na mesma conta', 'Suporte prioritário'],
    en: ['Everything in Business', 'Nexus and José (market intelligence)', 'Several companies in one account', 'Priority support'],
    es: ['Todo de Empresa', 'Nexus y José (inteligencia de mercado)', 'Varias empresas en la misma cuenta', 'Soporte prioritario'],
  },
}
export const ORDEM_PLANOS: PlanoId[] = ['starter', 'pro', 'business', 'enterprise']
