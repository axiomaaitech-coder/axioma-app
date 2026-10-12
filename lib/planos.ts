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

// O que cada plano traz (sem limitar por porte; Open Finance/Pluggy listado a pedido do Elias — ele liga a produção) — tela Planos e página inicial.
export const PLANO_DESCRICAO: Record<PlanoId, T3> = {
  starter: { pt: 'Para MEI e autônomos', en: 'For MEI and freelancers', es: 'Para MEI y autónomos' },
  pro: { pt: 'Financeiro, contabilidade e operação completos, com IA Financeira', en: 'Complete finance, accounting and operations, with Financial AI', es: 'Finanzas, contabilidad y operación completas, con IA Financiera' },
  business: { pt: 'Gestão completa com IA Tributária, PDV e Painel de Risco', en: 'Complete management with Tax AI, POS and Risk Panel', es: 'Gestión completa con IA Tributaria, PDV y Panel de Riesgo' },
  enterprise: { pt: 'Tudo do Axioma, com inteligência de mercado', en: 'All of Axioma, with market intelligence', es: 'Todo Axioma, con inteligencia de mercado' },
}
export const PLANO_RECURSOS: Record<PlanoId, Record<'pt' | 'en' | 'es', string[]>> = {
  starter: {
    pt: ['Módulo MEI completo: DAS, DASN, limite de faturamento e documentos para o contador', 'Abrir MEI ou ME e pagar o DAS por dentro do Axioma (guia lida pela IA)', 'Receitas, custos fixos e variáveis, Fluxo de Caixa e DRE', 'Precificação e Imposto de Renda do MEI', 'IA MEI Advisor com as regras oficiais vigentes', 'Português, inglês e espanhol · PDF, Excel e CSV'],
    en: ['Full MEI module: DAS, DASN, revenue limit and documents for the accountant', 'Open an MEI or ME and pay the DAS from inside Axioma (slip read by AI)', 'Revenue, fixed and variable costs, Cash Flow and P&L', 'Pricing and MEI Income Tax', 'MEI AI Advisor with the current official rules', 'Portuguese, English and Spanish · PDF, Excel and CSV'],
    es: ['Módulo MEI completo: DAS, DASN, límite de facturación y documentos para el contador', 'Abrir MEI o ME y pagar el DAS desde dentro de Axioma (guía leída por IA)', 'Ingresos, costos fijos y variables, Flujo de Caja y Estado de Resultados', 'Precios e Impuesto a la Renta del MEI', 'IA MEI Advisor con las reglas oficiales vigentes', 'Portugués, inglés y español · PDF, Excel y CSV'],
  },
  pro: {
    pt: ['Tudo do MEI', 'Contabilidade completa: Livro Razão, Balancete, DRE contábil, Fiscal e área do contador', 'Contas a pagar e a receber, clientes, fornecedores, inadimplência e estoque', 'Pagar contas por dentro de Contas a Pagar', 'Tesouraria, endividamento, metas, investimentos e simulações', 'Open Finance (Pluggy): conexão com o banco e conciliação do extrato', 'Importar documentos: NF-e, extrato, PDF e foto lidos pela IA', 'IA Financeira que confere cada número com os seus dados', 'Conferência diária entre módulos e rastreabilidade de cada valor', 'Equipe com hierarquia e permissões'],
    en: ['Everything in MEI', 'Full accounting: General Ledger, Trial Balance, accounting P&L, Tax and accountant area', 'Payables and receivables, customers, suppliers, defaults and inventory', 'Pay bills from inside Accounts Payable', 'Treasury, debt, goals, investments and simulations', 'Open Finance (Pluggy): bank connection and statement reconciliation', 'Import documents: e-invoices, statements, PDF and photos read by AI', 'Financial AI that checks every number against your data', 'Daily cross-module check and traceability of every amount', 'Team with hierarchy and permissions'],
    es: ['Todo de MEI', 'Contabilidad completa: Libro Mayor, Balance de Comprobación, Estado de Resultados contable, Fiscal y área del contador', 'Cuentas por pagar y cobrar, clientes, proveedores, morosidad e inventario', 'Pagar cuentas desde dentro de Cuentas por Pagar', 'Tesorería, endeudamiento, metas, inversiones y simulaciones', 'Open Finance (Pluggy): conexión con el banco y conciliación del extracto', 'Importar documentos: NF-e, extractos, PDF y fotos leídos por IA', 'IA Financiera que verifica cada número con sus datos', 'Conciliación diaria entre módulos y trazabilidad de cada valor', 'Equipo con jerarquía y permisos'],
  },
  business: {
    pt: ['Tudo do Essencial', 'IA Tributária e Reforma Tributária com fonte oficial', 'PDV (ponto de venda) ligado ao estoque e ao financeiro', 'Centros de Custo e relatórios gerenciais', 'Painel de Risco e Métricas do CFO'],
    en: ['Everything in Essential', 'Tax AI and Tax Reform with official sources', 'POS (point of sale) linked to inventory and finance', 'Cost Centers and management reports', 'Risk Panel and CFO Metrics'],
    es: ['Todo de Esencial', 'IA Tributaria y Reforma Tributaria con fuente oficial', 'PDV (punto de venta) conectado al inventario y a las finanzas', 'Centros de Costo e informes de gestión', 'Panel de Riesgo y Métricas del CFO'],
  },
  enterprise: {
    pt: ['Tudo do Empresa', 'Nexus e o José: economia, mercado e notícias cruzados com a sua empresa', 'Várias empresas na mesma conta', 'Suporte prioritário'],
    en: ['Everything in Business', 'Nexus and José: economy, markets and news matched to your company', 'Several companies in one account', 'Priority support'],
    es: ['Todo de Empresa', 'Nexus y José: economía, mercado y noticias cruzados con su empresa', 'Varias empresas en la misma cuenta', 'Soporte prioritario'],
  },
}
export const ORDEM_PLANOS: PlanoId[] = ['starter', 'pro', 'business', 'enterprise']
