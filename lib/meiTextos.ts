// AXIOMA AI.TECH — meiTextos.ts
// Traduções compartilhadas das strings NOVAS da Fase 1 CFO do MEI
// (radar do teto, fluxo traduzido, score, detector pessoal x empresa,
// central de obrigações, badge). Strings que já existiam em cada tela
// continuam nos objetos `txt` locais — não foram re-escritas aqui.
// Uso: const mx = meiT(lang); mx.radarTeto

export type MeiLang = "pt" | "en" | "es";

const TEXTOS = {
  pt: {
    // Radar do teto
    radarTeto: "Radar do Teto",
    semaforoVerde: "Confortável",
    semaforoAmarelo: "Atenção",
    semaforoVermelho: "Risco de estouro",
    projecaoEstoura: "No seu ritmo atual, você atinge o teto em",
    projecaoMeses: "meses",
    consequenciaEstouro: "Se ultrapassar R$ 81.000/ano, você deixa de ser MEI e vira ME — o imposto sobe de um valor fixo mensal para uma % da sua receita.",
    sugestaoSegurar: "Segurar o faturamento até o fim do ano (recusar/adiar novos contratos)",
    sugestaoMigrar: "Preparar a migração para ME com antecedência (menos surpresa, mais planejamento)",
    considerandoTodasReceitas: "Considera as receitas marcadas como faturamento MEI.",

    // Detector pessoal x empresa
    detectorTitulo: "Gastos que parecem pessoais",
    detectorAviso: "Separar gasto pessoal do da empresa protege você numa fiscalização — a Receita cruza CPF e CNPJ cada vez mais. Detecção automática em tempo real chega numa fase futura.",
    detectorVazio: "Nenhum gasto com cara de pessoal neste período.",

    // Fluxo traduzido
    fluxoTitulo: "Seu dinheiro em 3 linhas",
    entrou: "Entrou",
    saiu: "Saiu",
    sobra: "Sobra",
    atencaoDas: "Atenção: dia 20 vence o DAS",
    diasParaDas: "dias para o DAS",

    // Score
    scoreSaude: "Score de Saúde do MEI",
    subFinanceiro: "Financeiro",
    subFiscal: "Fiscal",
    subTeto: "Teto",
    subFluxo: "Fluxo",
    subFinanceiroDesc: "Sua receita está crescendo mês a mês.",
    subFiscalDesc: "Suas obrigações (DAS, DASN, IR) estão em dia.",
    subTetoDesc: "Distância até o limite anual de R$ 81.000.",
    subFluxoDesc: "Sobra dinheiro depois de pagar os custos do mês.",

    // Central de obrigações
    obrigacoes: "Central de Obrigações",
    vencePrazo: "Vence em",
    diasAtraso: "dias em atraso",
    marcarEntregue: "Marcar como entregue",
    statusPendente: "Pendente",
    statusEntregue: "Entregue",
    statusAtrasado: "Atrasado",
    statusNaoObrigatorio: "Não obrigatório",

    // Badge
    badgeLabel: "PRO",
  },
  en: {
    radarTeto: "Cap Radar",
    semaforoVerde: "Comfortable",
    semaforoAmarelo: "Attention",
    semaforoVermelho: "Risk of exceeding",
    projecaoEstoura: "At your current pace, you reach the cap in",
    projecaoMeses: "months",
    consequenciaEstouro: "If you exceed R$ 81,000/year, you stop being MEI and become ME — tax goes from a fixed monthly amount to a % of your revenue.",
    sugestaoSegurar: "Hold off revenue until year-end (decline/postpone new contracts)",
    sugestaoMigrar: "Prepare the migration to ME in advance (less surprise, more planning)",
    considerandoTodasReceitas: "Considers revenues marked as MEI revenue.",

    detectorTitulo: "Expenses that look personal",
    detectorAviso: "Separating personal from business expenses protects you in an audit — tax authorities increasingly cross-check personal and company IDs. Real-time automatic detection is coming in a future phase.",
    detectorVazio: "No expense looks personal in this period.",

    fluxoTitulo: "Your money in 3 lines",
    entrou: "In",
    saiu: "Out",
    sobra: "Left over",
    atencaoDas: "Attention: DAS is due on the 20th",
    diasParaDas: "days until DAS",

    scoreSaude: "MEI Health Score",
    subFinanceiro: "Financial",
    subFiscal: "Tax",
    subTeto: "Cap",
    subFluxo: "Cash Flow",
    subFinanceiroDesc: "Your revenue is growing month over month.",
    subFiscalDesc: "Your obligations (DAS, DASN, IR) are up to date.",
    subTetoDesc: "Distance to the annual cap of R$ 81,000.",
    subFluxoDesc: "Money left over after paying this month's costs.",

    obrigacoes: "Obligations Center",
    vencePrazo: "Due in",
    diasAtraso: "days overdue",
    marcarEntregue: "Mark as filed",
    statusPendente: "Pending",
    statusEntregue: "Filed",
    statusAtrasado: "Overdue",
    statusNaoObrigatorio: "Not required",

    badgeLabel: "PRO",
  },
  es: {
    radarTeto: "Radar del Límite",
    semaforoVerde: "Cómodo",
    semaforoAmarelo: "Atención",
    semaforoVermelho: "Riesgo de superar",
    projecaoEstoura: "A su ritmo actual, alcanza el límite en",
    projecaoMeses: "meses",
    consequenciaEstouro: "Si supera R$ 81.000/año, deja de ser MEI y pasa a ME — el impuesto pasa de un valor fijo mensual a un % de sus ingresos.",
    sugestaoSegurar: "Frenar la facturación hasta fin de año (rechazar/posponer nuevos contratos)",
    sugestaoMigrar: "Preparar la migración a ME con antelación (menos sorpresa, más planificación)",
    considerandoTodasReceitas: "Considera los ingresos marcados como facturación MEI.",

    detectorTitulo: "Gastos que parecen personales",
    detectorAviso: "Separar el gasto personal del de la empresa lo protege en una fiscalización — Hacienda cruza cada vez más CPF y CNPJ. La detección automática en tiempo real llega en una fase futura.",
    detectorVazio: "Ningún gasto parece personal en este período.",

    fluxoTitulo: "Su dinero en 3 líneas",
    entrou: "Entró",
    saiu: "Salió",
    sobra: "Sobra",
    atencaoDas: "Atención: el DAS vence el día 20",
    diasParaDas: "días para el DAS",

    scoreSaude: "Score de Salud del MEI",
    subFinanceiro: "Financiero",
    subFiscal: "Fiscal",
    subTeto: "Límite",
    subFluxo: "Flujo de Caja",
    subFinanceiroDesc: "Sus ingresos están creciendo mes a mes.",
    subFiscalDesc: "Sus obligaciones (DAS, DASN, IR) están al día.",
    subTetoDesc: "Distancia hasta el límite anual de R$ 81.000.",
    subFluxoDesc: "Dinero que sobra tras pagar los costos del mes.",

    obrigacoes: "Central de Obligaciones",
    vencePrazo: "Vence en",
    diasAtraso: "días de atraso",
    marcarEntregue: "Marcar como entregado",
    statusPendente: "Pendiente",
    statusEntregue: "Entregado",
    statusAtrasado: "Atrasado",
    statusNaoObrigatorio: "No obligatorio",

    badgeLabel: "PRO",
  },
};

export type MeiTextos = typeof TEXTOS.pt;

export function meiT(lang: string): MeiTextos {
  return TEXTOS[(lang as MeiLang)] || TEXTOS.pt;
}
