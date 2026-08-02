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

    // Compartilhar (Fase 2, todas as 7 telas)
    compartilhar: "Compartilhar",
    toastBaixado: "PDF pronto — baixado.",

    // Cofre Inteligente
    cofreTitulo: "O que é seu de verdade",
    cofreExplicacao: "Da sobra do mês, isto aqui já tem dono — o resto é seu pró-labore seguro.",
    cofreDas: "DAS do mês — não é seu, vence dia 20",
    cofreIrpf: "Reserva de IRPF — guardando pro ano",
    cofreCompromissos: "Contas a pagar do período — já tem dono",
    cofreReserva: "Reserva de emergência",
    cofreProLabore: "Seu pró-labore seguro este mês",

    // Reserva automática de imposto
    reservarDeste: "Guarde deste valor",
    reservaAcumuladaTitulo: "Você deveria ter guardado até agora",

    // Detector de retirada perigosa
    retiradaTitulo: "Retirada acima do seguro",
    retiradaAvisoSeguroNegativo: "Sua sobra não cobre nem DAS, IRPF e compromissos deste mês — evite retirar pró-labore agora.",
    retiradaAvisoGastoAlto: "Os gastos que parecem pessoais já passam do seu pró-labore seguro este mês.",

    // Guardião da Reserva
    guardiaoTitulo: "Guardião da Reserva",
    guardiaoConsumiu: "Você usou ~R$X da reserva do DAS",
    guardiaoBaseadoEm: "Baseado nos lançamentos registrados no sistema, não no saldo real do banco.",
    guardiaoDiasRestantes: "dias pra repor até o vencimento",
    guardiaoConsequencia: "Se não repor até o vencimento, o atraso gera",
    guardiaoEstimativa: "Estimativa com base nas regras vigentes (multa 0,33%/dia, teto 20%, + juros Selic).",

    // Comparação com o pró-labore desejado (Configurar MEI)
    proLaboreComparativo: "Você queria retirar {desejado} — hoje o pró-labore seguro real é {seguro}.",

    // Análise Axioma (MEI Advisor)
    iaRespondendoPorRegra: "Respondendo com base em regras — tente novamente em instantes.",

    // Gráficos analíticos do Painel
    evolucaoGanhos: "Evolução de Ganhos",
    fluxoCaixaVisual: "Fluxo de Caixa Visual",
    composicaoCofre: "Composição do Cofre",
    progressoTeto: "Progresso do Teto no Tempo",
    acimaMedia: "acima da sua média",
    abaixoMedia: "abaixo da sua média",
    semHistoricoSuficiente: "Ainda faltam meses de histórico pra essa comparação.",
    ticketMedio: "Ticket médio",
    nRecebimentos: "Recebimentos no mês",
    maiorReceita: "Maior receita do mês",
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

    compartilhar: "Share",
    toastBaixado: "PDF ready — downloaded.",

    cofreTitulo: "What's really yours",
    cofreExplicacao: "Of this month's leftover, this part already has an owner — the rest is your safe pro-labore.",
    cofreDas: "This month's DAS — not yours, due on the 20th",
    cofreIrpf: "IRPF reserve — saving for the year",
    cofreCompromissos: "Bills due this period — already spoken for",
    cofreReserva: "Emergency reserve",
    cofreProLabore: "Your safe pro-labore this month",

    reservarDeste: "Set aside from this",
    reservaAcumuladaTitulo: "You should have saved by now",

    retiradaTitulo: "Withdrawal above safe limit",
    retiradaAvisoSeguroNegativo: "Your leftover doesn't even cover this month's DAS, IRPF and bills — avoid withdrawing pro-labore now.",
    retiradaAvisoGastoAlto: "Expenses that look personal already exceed your safe pro-labore this month.",

    guardiaoTitulo: "Reserve Guardian",
    guardiaoConsumiu: "You've used ~R$X of the DAS reserve",
    guardiaoBaseadoEm: "Based on entries recorded in the system, not your actual bank balance.",
    guardiaoDiasRestantes: "days to replace it before the due date",
    guardiaoConsequencia: "If not replaced by the due date, the delay generates",
    guardiaoEstimativa: "Estimate based on current rules (0.33%/day fine, 20% cap, + Selic interest).",

    proLaboreComparativo: "You wanted to withdraw {desejado} — today the real safe pro-labore is {seguro}.",

    iaRespondendoPorRegra: "Answering based on rules — try again shortly.",

    evolucaoGanhos: "Revenue Evolution",
    fluxoCaixaVisual: "Visual Cash Flow",
    composicaoCofre: "Vault Composition",
    progressoTeto: "Cap Progress Over Time",
    acimaMedia: "above your average",
    abaixoMedia: "below your average",
    semHistoricoSuficiente: "Still need more months of history for this comparison.",
    ticketMedio: "Average ticket",
    nRecebimentos: "Payments this month",
    maiorReceita: "Largest revenue this month",
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

    compartilhar: "Compartir",
    toastBaixado: "PDF listo — descargado.",

    cofreTitulo: "Lo que es realmente suyo",
    cofreExplicacao: "De la sobra del mes, esto ya tiene dueño — el resto es su pro-labore seguro.",
    cofreDas: "DAS del mes — no es suyo, vence el día 20",
    cofreIrpf: "Reserva de IRPF — guardando para el año",
    cofreCompromissos: "Cuentas por pagar del período — ya tienen dueño",
    cofreReserva: "Reserva de emergencia",
    cofreProLabore: "Su pro-labore seguro este mes",

    reservarDeste: "Guarde de este valor",
    reservaAcumuladaTitulo: "Debería haber guardado hasta ahora",

    retiradaTitulo: "Retiro por encima del límite seguro",
    retiradaAvisoSeguroNegativo: "Su sobra no cubre ni el DAS, IRPF y cuentas de este mes — evite retirar pro-labore ahora.",
    retiradaAvisoGastoAlto: "Los gastos que parecen personales ya superan su pro-labore seguro este mes.",

    guardiaoTitulo: "Guardián de la Reserva",
    guardiaoConsumiu: "Usó ~R$X de la reserva del DAS",
    guardiaoBaseadoEm: "Basado en los movimientos registrados en el sistema, no en el saldo real del banco.",
    guardiaoDiasRestantes: "días para reponer antes del vencimiento",
    guardiaoConsequencia: "Si no repone antes del vencimiento, el atraso genera",
    guardiaoEstimativa: "Estimación con base en las reglas vigentes (multa 0,33%/día, tope 20%, + intereses Selic).",

    proLaboreComparativo: "Quería retirar {desejado} — hoy el pro-labore seguro real es {seguro}.",

    iaRespondendoPorRegra: "Respondiendo con base en reglas — intente de nuevo en instantes.",

    evolucaoGanhos: "Evolución de Ingresos",
    fluxoCaixaVisual: "Flujo de Caja Visual",
    composicaoCofre: "Composición de la Caja Fuerte",
    progressoTeto: "Progreso del Límite en el Tiempo",
    acimaMedia: "por encima de su promedio",
    abaixoMedia: "por debajo de su promedio",
    semHistoricoSuficiente: "Aún faltan meses de historial para esta comparación.",
    ticketMedio: "Ticket promedio",
    nRecebimentos: "Cobros en el mes",
    maiorReceita: "Mayor ingreso del mes",
  },
};

export type MeiTextos = typeof TEXTOS.pt;

export function meiT(lang: string): MeiTextos {
  return TEXTOS[(lang as MeiLang)] || TEXTOS.pt;
}
