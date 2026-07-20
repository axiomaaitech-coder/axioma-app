// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — cfoTextos.ts
// Traduções da camada CFO, centralizadas. Editar aqui = muda em
// todos os módulos. NÃO substitui o LanguageContext (que segue
// alimentando os textos próprios de cada módulo). Complementar.
// Uso: const cx = cfoT(lang);  cx.mrr
// ═══════════════════════════════════════════════════════════════

import {
  fBRL, fPct, type FatorVariacaoLucro, type PonteLucroCaixa, type GatilhoConselho,
  type BucketVencimento, type GatilhoConselhoDivida, type GatilhoConselhoMeta, type ArvoreMeta, type TipoMeta,
} from "./cfoCore";

export type CfoLang = "pt" | "en" | "es";

const TEXTOS = {
  pt: {
    // KPIs CFO
    mrr: "Receita Recorrente (MRR)", arr: "Receita Anual (ARR)",
    crescimentoMoM: "Crescimento no Mês", ticketMedio: "Ticket Médio",
    concentracao: "Concentração Top 20%", recorrenciaPct: "% Recorrente",
    // Painel
    analiseAnual: "Análise Anual", subAnalise: "Evolução · Composição · Previsão IA",
    evolucao: "Evolução Mensal", composicao: "Composição por Categoria",
    previsao: "Previsão (próx. 3 meses)", realizado: "Realizado", projetado: "Projeção IA",
    // Insights
    insights: "Insights Inteligentes", semDados: "Adicione dados para ver a inteligência CFO",
    alertaConcentracao: "Alta concentração: poucos lançamentos representam a maior parte.",
    alertaQueda: "Queda em relação ao mês anterior. Atenção ao fluxo.",
    alertaRecorrencia: "Baixa recorrência: dependência de itens eventuais aumenta o risco.",
    positivoCrescimento: "Crescimento consistente. Continue acelerando.",
    positivoRecorrencia: "Boa base recorrente: resultado previsível e saudável.",
    // Compartilhamento
    compartilhar: "Compartilhar", centroCompart: "Centro de Compartilhamento",
    copiar: "Copiar", copiado: "Copiado!", fechar: "Fechar",
    // Genéricos CFO
    // Custos / Renovações
    totalMensal: "Total Mensal", totalAnual: "Total Anual", pesoReceita: "Peso na Receita",
    economiaPotencial: "Economia Potencial", desperdicioDetectado: "Desperdício Detectado",
    radarRenovacoes: "Radar de Renovações", nenhumaRenovacao: "Nenhuma renovação próxima",
    renovaEm: "renova em", diasVencido: "vencido há", dias: "dias", hoje: "hoje", amanha: "amanhã",
    duplicadoDetectado: "Possível custo duplicado detectado",
    urgVencido: "Vencido", urgCritico: "Crítico", urgProximo: "Próximo", urgFuturo: "Futuro",
    alertaDuplicado: "Custos com nomes muito parecidos — verifique duplicidade.",
    alertaPeso: "Custos fixos consomem grande parte da receita. Avalie cortes.",
    positivoEnxuto: "Estrutura de custos enxuta e saudável.",
    total: "TOTAL", visaoCFO: "Visão CFO",
    // Custos Variáveis — Margem/Break-even
    margemContribuicao: "Margem de Contribuição", pontoEquilibrio: "Ponto de Equilíbrio",
    margemSeguranca: "Margem de Segurança", volatilidade: "Volatilidade",
    custoVariavelMes: "Custo Variável do Mês", semBreakeven: "Sem equilíbrio possível",
    analiseMargem: "Análise de Margem", subAnaliseMargem: "Receita · Custo Variável · Ponto de Equilíbrio",
    alertaSemBreakeven: "Custo variável consome toda a receita — não há ponto de equilíbrio possível nessa estrutura. Revise preço ou custo com urgência.",
    alertaMargemBaixa: "Margem de segurança baixa: pouca folga até o prejuízo se a receita cair.",
    alertaVolatilidade: "Custos variáveis muito instáveis mês a mês — dificulta previsão de caixa.",
    alertaSangriaMargem: "Custo variável crescendo mais rápido que a receita — a margem está sendo corroída.",
    positivoMargemSaudavel: "Margem de segurança saudável — boa folga até o ponto de equilíbrio.",
    // Seletor de período
    periodoMesAtual: "Mês atual", periodoMesAnterior: "Mês anterior", periodoTrimestreAtual: "Trimestre atual",
    periodoAnoAtual: "Ano atual", periodoUltimos12: "Últimos 12 meses", periodoPersonalizado: "Personalizado",
    vsPeriodoAnterior: "vs período anterior", periodoEstavel: "estável",
    // Narrativa e sugestões
    narrativaTitulo: "O que mudou", sugestoesTitulo: "Sugestões da IA", anomaliasTitulo: "Anomalias Detectadas",
    puxadoPor: "puxado por", subiram: "subiram", cairam: "caíram", ficaramEstaveis: "ficaram estáveis",
    acimaPropriaMedia: "acima da própria média histórica", economiaPotencialSugestao: "Economia potencial",
    itemRenegociar: "subiu de forma consistente nos últimos meses. Vale renegociar.",
    itemAcimaMedia: "veio bem acima do que costuma custar — vale conferir o motivo.",
    // Fluxo de Caixa
    visaoSemanal: "Visão Semanal (13 semanas)", visaoMensal: "Visão Mensal",
    rupturaCaixaTitulo: "Alerta de Ruptura de Caixa", saldoProjetado: "Saldo Projetado",
    semRupturaPrevista: "Nenhuma ruptura de caixa prevista no horizonte analisado — fôlego saudável.",
    cenarioOtimista: "Otimista", cenarioPessimista: "Pessimista", cenarioPrevisto: "Previsto",
    saldoAtual: "Saldo Atual", entradasPrevistas: "Entradas Previstas", saidasPrevistas: "Saídas Previstas",
    precisaoPrevisao: "Precisão da Previsão",
    previstosAutomaticos: "Previstos Automáticos", subPrevistosAutomaticos: "Puxado direto de outros módulos — não precisa lançar de novo aqui",
    origemContasReceber: "Contas a Receber", origemContasPagar: "Contas a Pagar", origemCustosFixos: "Custos Fixos", origemDividas: "Parcelas de Dívidas",
    incluirPrevistosAuto: "Incluir previstos automáticos na projeção", avisoDuplicidade: "Se você já lança esses itens manualmente aqui, desative pra não contar em dobro.",
    // DRE — cascata
    dreReceitaBruta: "Receita Bruta", dreDeducoes: "(-) Deduções e Impostos", dreReceitaLiquida: "Receita Líquida",
    dreCustoVariavel: "(-) Custos Variáveis", dreMargemContribuicao: "Margem de Contribuição", dreCustoFixo: "(-) Custos Fixos",
    dreEbitda: "EBITDA", dreDespesasFinanceiras: "(-) Despesas Financeiras (Juros)", dreLucroLiquido: "Lucro Líquido", dreMargemLiquida: "Margem Líquida",
    cascataDRE: "Cascata do Resultado", analiseVertical: "Análise Vertical (% da Receita Líquida)", analiseHorizontal: "Análise Horizontal (vs período anterior)",
    // DRE — diagnóstico
    diagnosticoTitulo: "Diagnóstico de Lucratividade", causaRaizTitulo: "Causa Raiz da Variação",
    ponteLucroCaixaTitulo: "Ponte Lucro × Caixa", semaforoSaudeTitulo: "Semáforo de Saúde", runwayTitulo: "Runway",
    conselhoCfoTitulo: "Conselho CFO", runwaySaudavel: "Nenhum risco de deterioração crítica no horizonte analisado.",
    semGatilhoConselho: "Nenhuma recomendação crítica no momento — resultado sob controle.",
    fatorReceita: "Receita", fatorDeducoes: "Impostos", fatorCustoVariavel: "Custos Variáveis", fatorCustoFixo: "Custos Fixos", fatorDespesasFinanceiras: "Despesas Financeiras",
    sinalMargemLiquida: "Margem Líquida", sinalEbitdaQueda: "EBITDA em Queda", sinalPesoCustoFixo: "Peso do Custo Fixo", sinalConcentracao: "Concentração de Clientes",
    // DRE — histórico
    historicoTitulo: "Histórico de Resultados", historicoVazio: "Nenhum período fechado ainda — volte no fim do mês.",
    periodoFechado: "Fechado", periodoAberto: "Em andamento", verHistorico: "Ver Histórico",
    // Endividamento
    escadaVencimentosTitulo: "Escada de Vencimentos", muroDetectado: "Muro de vencimentos",
    semMuro: "Nenhum muro de vencimentos no horizonte analisado.",
    avalancheTitulo: "Método Avalanche", dividaCaraTag: "Cara", quitarPrimeiroLabel: "Quitar primeiro",
    indicadoresSolvenciaTitulo: "Indicadores de Solvência",
    coberturaJurosLabel: "Cobertura de Juros", dividaEbitdaLabel: "Dívida / EBITDA", dividaReceitaLabel: "Dívida / Receita",
    comprometimentoMensalLabel: "Comprometimento Mensal", fluxoCaixaSobreDividaLabel: "Fluxo de Caixa / Dívida",
    semJuros: "Sem despesa financeira", semEbitda: "EBITDA insuficiente",
    simuladorTitulo: "Simulador de Refinanciamento", novaTaxaLabel: "Nova taxa (% a.m.)", novoPrazoLabel: "Novo prazo (parcelas)",
    economiaJurosLabel: "Economia de Juros", liberacaoCaixaLabel: "Libera de Caixa/Mês",
    radarPrevencaoTitulo: "Radar de Prevenção de Quebra", runwayDividaTitulo: "Runway da Dívida",
    conselhoDividaTitulo: "Conselho CFO", semGatilhoDivida: "Nenhuma recomendação crítica no momento — endividamento sob controle.",
    projecaoQuitacaoTitulo: "Projeção de Quitação", cenarioMinimoLabel: "Ritmo Atual", cenarioAvalancheLabel: "Avalanche",
    semDividaTitulo: "Nenhuma dívida cadastrada — estrutura de capital livre de endividamento.",
    regraOuroNegociar: "Regra de ouro: negocie antes de atrasar — depois do atraso, você perde poder de barganha.",
    quitacaoEm: "quita em", naoQuitaHorizonte: "não quita no horizonte analisado",
    // Metas
    metaKpiNoRitmo: "No Ritmo", metaKpiEmRisco: "Em Risco", metaKpiValorEmJogo: "Valor em Jogo",
    metaKpiTaxaSucesso: "Taxa de Sucesso Histórica", metaKpiProximaPrazo: "Mais Próxima do Prazo", metaKpiMarcos: "Marcos Conquistados",
    metaTipoFaturamento: "Faturamento", metaTipoLucro: "Lucro", metaTipoMargem: "Margem",
    metaTipoReducaoCusto: "Redução de Custo", metaTipoReducaoDivida: "Redução de Dívida",
    metaTipoCaixa: "Saldo de Caixa", metaTipoTicketMedio: "Ticket Médio", metaTipoNumClientes: "Nº de Clientes Ativos",
    metaSemaforoVerde: "No Ritmo", metaSemaforoAmarelo: "Atenção", metaSemaforoVermelho: "Em Risco",
    metaClassificacaoFacil: "Fácil demais", metaClassificacaoImpossivel: "Fora de alcance", metaClassificacaoRealista: "Realista",
    metaRitmoNecessario: "Ritmo Necessário", metaRitmoAtual: "Ritmo Atual",
    metaProgressoReal: "Progresso Real", metaProgressoEsperadoLabel: "Progresso Esperado",
    metaFaltam: "faltam", metaPorMes: "/mês",
    metaArvoreTitulo: "Árvore de Dependência entre Metas", metaSemDependencia: "Nenhuma meta depende de outra em risco no momento.",
    metaRaciocinioTitulo: "De onde veio esse número", metaRankingRitmoTitulo: "Ritmo Necessário vs Ritmo Atual",
    metaMarco25: "1/4 do caminho andado", metaMarco50: "Metade da meta conquistada", metaMarco75: "Reta final — 3/4 andados", metaMarco100: "Meta batida",
    metaConselhoTitulo: "Conselho CFO", metaSemGatilho: "Nenhuma recomendação crítica agora — metas sob controle.",
    metaModalAnaliseTitulo: "Análise de Metas", metaModalAnaliseSub: "Progresso Real × Esperado · Evolução · Status",
    metaGraficoProgresso: "Progresso: Real vs Esperado", metaGraficoEvolucao: "Evolução até a Meta", metaGraficoStatus: "Metas por Semáforo",
    metaSemTipoAviso: "Metas antigas sem tipo vinculado a dado real — reclassifique-as para ativar o acompanhamento automático.",
    metaValorInicial: "Valor Inicial", metaValorAlvo: "Valor Alvo", metaValorAtual: "Valor Atual",
    metaConcluidaAuto: "Concluída", metaArquivada: "Arquivada", metaAtiva: "Ativa", metaArquivar: "Arquivar",
    metaValorInicialLabel: "Valor Inicial", metaValorInicialAjuda: "Ponto de partida — pré-preenchido com o valor real de hoje, você pode ajustar.",
    metaDirecaoLabel: "Direção", metaDirecaoAumentar: "Aumentar", metaDirecaoReduzir: "Reduzir",
    metaDirecaoInconsistente: "A direção não bate com os valores: confira o valor inicial e o valor-alvo.",
    metaResponsavelLabel: "Responsável", metaResponsavelPlaceholder: "Quem é o dono dessa meta?",
    metaDescricaoLabel: "Estratégia (como vai bater essa meta)", metaDescricaoPlaceholder: "Ex: renegociar os 3 maiores fornecedores até março",
    metaDeParaLabel: "de", metaParaLabel: "para", metaErroSalvar: "Não foi possível salvar a meta. Detalhe do erro:",
  },
  en: {
    mrr: "Recurring Revenue (MRR)", arr: "Annual Revenue (ARR)",
    crescimentoMoM: "Month Growth", ticketMedio: "Avg Ticket",
    concentracao: "Top 20% Concentration", recorrenciaPct: "% Recurring",
    analiseAnual: "Annual Analysis", subAnalise: "Evolution · Composition · AI Forecast",
    evolucao: "Monthly Evolution", composicao: "Composition by Category",
    previsao: "Forecast (next 3 months)", realizado: "Actual", projetado: "AI Forecast",
    insights: "Smart Insights", semDados: "Add data to see CFO intelligence",
    alertaConcentracao: "High concentration: few entries represent most of the total.",
    alertaQueda: "Drop vs last month. Watch cash flow.",
    alertaRecorrencia: "Low recurrence: dependence on one-off items raises risk.",
    positivoCrescimento: "Consistent growth. Keep accelerating.",
    positivoRecorrencia: "Good recurring base: predictable, healthy result.",
    compartilhar: "Share", centroCompart: "Sharing Center",
    copiar: "Copy", copiado: "Copied!", fechar: "Close",
    totalMensal: "Monthly Total", totalAnual: "Annual Total", pesoReceita: "Weight on Revenue",
    economiaPotencial: "Potential Savings", desperdicioDetectado: "Waste Detected",
    radarRenovacoes: "Renewal Radar", nenhumaRenovacao: "No upcoming renewals",
    renovaEm: "renews in", diasVencido: "overdue by", dias: "days", hoje: "today", amanha: "tomorrow",
    duplicadoDetectado: "Possible duplicate cost detected",
    urgVencido: "Overdue", urgCritico: "Critical", urgProximo: "Upcoming", urgFuturo: "Future",
    alertaDuplicado: "Costs with very similar names — check for duplicates.",
    alertaPeso: "Fixed costs consume a large share of revenue. Consider cuts.",
    positivoEnxuto: "Lean and healthy cost structure.",
    total: "TOTAL", visaoCFO: "CFO View",
    margemContribuicao: "Contribution Margin", pontoEquilibrio: "Break-Even Point",
    margemSeguranca: "Margin of Safety", volatilidade: "Volatility",
    custoVariavelMes: "Variable Cost this Month", semBreakeven: "No break-even possible",
    analiseMargem: "Margin Analysis", subAnaliseMargem: "Revenue · Variable Cost · Break-Even Point",
    alertaSemBreakeven: "Variable cost consumes all revenue — no break-even is possible with this cost structure. Review pricing or cost urgently.",
    alertaMargemBaixa: "Low margin of safety: little room before a loss if revenue drops.",
    alertaVolatilidade: "Variable costs are very unstable month to month — makes cash forecasting harder.",
    alertaSangriaMargem: "Variable cost growing faster than revenue — margin is being eroded.",
    positivoMargemSaudavel: "Healthy margin of safety — good room above the break-even point.",
    periodoMesAtual: "Current month", periodoMesAnterior: "Previous month", periodoTrimestreAtual: "Current quarter",
    periodoAnoAtual: "Current year", periodoUltimos12: "Last 12 months", periodoPersonalizado: "Custom",
    vsPeriodoAnterior: "vs previous period", periodoEstavel: "stable",
    narrativaTitulo: "What changed", sugestoesTitulo: "AI Suggestions", anomaliasTitulo: "Detected Anomalies",
    puxadoPor: "driven by", subiram: "went up", cairam: "went down", ficaramEstaveis: "stayed stable",
    acimaPropriaMedia: "above its own historical average", economiaPotencialSugestao: "Potential savings",
    itemRenegociar: "has been rising consistently over the last months. Worth renegotiating.",
    itemAcimaMedia: "came in well above what it usually costs — worth checking why.",
    visaoSemanal: "Weekly View (13 weeks)", visaoMensal: "Monthly View",
    rupturaCaixaTitulo: "Cash Flow Gap Alert", saldoProjetado: "Projected Balance",
    semRupturaPrevista: "No cash flow gap predicted in the analyzed horizon — healthy runway.",
    cenarioOtimista: "Optimistic", cenarioPessimista: "Pessimistic", cenarioPrevisto: "Forecast",
    saldoAtual: "Current Balance", entradasPrevistas: "Projected Inflows", saidasPrevistas: "Projected Outflows",
    precisaoPrevisao: "Forecast Accuracy",
    previstosAutomaticos: "Automatic Forecasts", subPrevistosAutomaticos: "Pulled directly from other modules — no need to log it again here",
    origemContasReceber: "Receivables", origemContasPagar: "Payables", origemCustosFixos: "Fixed Costs", origemDividas: "Debt Installments",
    incluirPrevistosAuto: "Include automatic forecasts in projection", avisoDuplicidade: "If you already log these items manually here, turn this off to avoid double-counting.",
    dreReceitaBruta: "Gross Revenue", dreDeducoes: "(-) Deductions & Taxes", dreReceitaLiquida: "Net Revenue",
    dreCustoVariavel: "(-) Variable Costs", dreMargemContribuicao: "Contribution Margin", dreCustoFixo: "(-) Fixed Costs",
    dreEbitda: "EBITDA", dreDespesasFinanceiras: "(-) Financial Expenses (Interest)", dreLucroLiquido: "Net Profit", dreMargemLiquida: "Net Margin",
    cascataDRE: "Income Waterfall", analiseVertical: "Vertical Analysis (% of Net Revenue)", analiseHorizontal: "Horizontal Analysis (vs previous period)",
    diagnosticoTitulo: "Profitability Diagnosis", causaRaizTitulo: "Root Cause of Variation",
    ponteLucroCaixaTitulo: "Profit × Cash Bridge", semaforoSaudeTitulo: "Health Signal", runwayTitulo: "Runway",
    conselhoCfoTitulo: "CFO Advice", runwaySaudavel: "No risk of critical deterioration in the analyzed horizon.",
    semGatilhoConselho: "No critical recommendation right now — result under control.",
    fatorReceita: "Revenue", fatorDeducoes: "Taxes", fatorCustoVariavel: "Variable Costs", fatorCustoFixo: "Fixed Costs", fatorDespesasFinanceiras: "Financial Expenses",
    sinalMargemLiquida: "Net Margin", sinalEbitdaQueda: "EBITDA Declining", sinalPesoCustoFixo: "Fixed Cost Weight", sinalConcentracao: "Customer Concentration",
    historicoTitulo: "Results History", historicoVazio: "No closed period yet — check back at month end.",
    periodoFechado: "Closed", periodoAberto: "In progress", verHistorico: "View History",
    escadaVencimentosTitulo: "Maturity Wall", muroDetectado: "Maturity wall",
    semMuro: "No maturity wall in the analyzed horizon.",
    avalancheTitulo: "Avalanche Method", dividaCaraTag: "Expensive", quitarPrimeiroLabel: "Pay off first",
    indicadoresSolvenciaTitulo: "Solvency Indicators",
    coberturaJurosLabel: "Interest Coverage", dividaEbitdaLabel: "Debt / EBITDA", dividaReceitaLabel: "Debt / Revenue",
    comprometimentoMensalLabel: "Monthly Commitment", fluxoCaixaSobreDividaLabel: "Cash Flow / Debt",
    semJuros: "No financial expense", semEbitda: "Insufficient EBITDA",
    simuladorTitulo: "Refinancing Simulator", novaTaxaLabel: "New rate (% monthly)", novoPrazoLabel: "New term (installments)",
    economiaJurosLabel: "Interest Savings", liberacaoCaixaLabel: "Cash Freed/Month",
    radarPrevencaoTitulo: "Bankruptcy Prevention Radar", runwayDividaTitulo: "Debt Runway",
    conselhoDividaTitulo: "CFO Advice", semGatilhoDivida: "No critical recommendation right now — debt under control.",
    projecaoQuitacaoTitulo: "Payoff Projection", cenarioMinimoLabel: "Current Pace", cenarioAvalancheLabel: "Avalanche",
    semDividaTitulo: "No debt on record — debt-free capital structure.",
    regraOuroNegociar: "Golden rule: negotiate before falling behind — once overdue, you lose bargaining power.",
    quitacaoEm: "pays off in", naoQuitaHorizonte: "doesn't pay off within the analyzed horizon",
    // Goals
    metaKpiNoRitmo: "On Pace", metaKpiEmRisco: "At Risk", metaKpiValorEmJogo: "Value at Stake",
    metaKpiTaxaSucesso: "Historical Success Rate", metaKpiProximaPrazo: "Closest to Deadline", metaKpiMarcos: "Milestones Hit",
    metaTipoFaturamento: "Revenue", metaTipoLucro: "Profit", metaTipoMargem: "Margin",
    metaTipoReducaoCusto: "Cost Reduction", metaTipoReducaoDivida: "Debt Reduction",
    metaTipoCaixa: "Cash Balance", metaTipoTicketMedio: "Average Ticket", metaTipoNumClientes: "Active Customers",
    metaSemaforoVerde: "On Pace", metaSemaforoAmarelo: "Attention", metaSemaforoVermelho: "At Risk",
    metaClassificacaoFacil: "Too easy", metaClassificacaoImpossivel: "Out of reach", metaClassificacaoRealista: "Realistic",
    metaRitmoNecessario: "Required Pace", metaRitmoAtual: "Current Pace",
    metaProgressoReal: "Actual Progress", metaProgressoEsperadoLabel: "Expected Progress",
    metaFaltam: "remaining", metaPorMes: "/month",
    metaArvoreTitulo: "Goal Dependency Tree", metaSemDependencia: "No goal currently depends on another that's at risk.",
    metaRaciocinioTitulo: "Where this number came from", metaRankingRitmoTitulo: "Required Pace vs Current Pace",
    metaMarco25: "1/4 of the way there", metaMarco50: "Halfway to the goal", metaMarco75: "Home stretch — 3/4 there", metaMarco100: "Goal hit",
    metaConselhoTitulo: "CFO Advice", metaSemGatilho: "No critical recommendation right now — goals under control.",
    metaModalAnaliseTitulo: "Goal Analysis", metaModalAnaliseSub: "Actual × Expected Progress · Evolution · Status",
    metaGraficoProgresso: "Progress: Actual vs Expected", metaGraficoEvolucao: "Evolution Toward the Goal", metaGraficoStatus: "Goals by Signal",
    metaSemTipoAviso: "Old goals with no type linked to real data — reclassify them to enable automatic tracking.",
    metaValorInicial: "Starting Value", metaValorAlvo: "Target Value", metaValorAtual: "Current Value",
    metaConcluidaAuto: "Completed", metaArquivada: "Archived", metaAtiva: "Active", metaArquivar: "Archive",
    metaValorInicialLabel: "Starting Value", metaValorInicialAjuda: "Starting point — pre-filled with today's real value, you can adjust it.",
    metaDirecaoLabel: "Direction", metaDirecaoAumentar: "Increase", metaDirecaoReduzir: "Decrease",
    metaDirecaoInconsistente: "Direction doesn't match the values: check the starting value and the target.",
    metaResponsavelLabel: "Owner", metaResponsavelPlaceholder: "Who owns this goal?",
    metaDescricaoLabel: "Strategy (how you'll hit this goal)", metaDescricaoPlaceholder: "E.g.: renegotiate the top 3 suppliers by March",
    metaDeParaLabel: "from", metaParaLabel: "to", metaErroSalvar: "Couldn't save the goal. Error detail:",
  },
  es: {
    mrr: "Ingresos Recurrentes (MRR)", arr: "Ingresos Anuales (ARR)",
    crescimentoMoM: "Crecimiento del Mes", ticketMedio: "Ticket Medio",
    concentracao: "Concentración Top 20%", recorrenciaPct: "% Recurrente",
    analiseAnual: "Análisis Anual", subAnalise: "Evolución · Composición · Previsión IA",
    evolucao: "Evolución Mensual", composicao: "Composición por Categoría",
    previsao: "Previsión (próx. 3 meses)", realizado: "Realizado", projetado: "Previsión IA",
    insights: "Insights Inteligentes", semDados: "Agregue datos para ver la inteligencia CFO",
    alertaConcentracao: "Alta concentración: pocos registros representan la mayor parte.",
    alertaQueda: "Caída vs el mes anterior. Atención al flujo.",
    alertaRecorrencia: "Baja recurrencia: la dependencia de ítems eventuales aumenta el riesgo.",
    positivoCrescimento: "Crecimiento consistente. Sigue acelerando.",
    positivoRecorrencia: "Buena base recurrente: resultado predecible y saludable.",
    compartilhar: "Compartir", centroCompart: "Centro de Compartir",
    copiar: "Copiar", copiado: "¡Copiado!", fechar: "Cerrar",
    totalMensal: "Total Mensual", totalAnual: "Total Anual", pesoReceita: "Peso en Ingresos",
    economiaPotencial: "Ahorro Potencial", desperdicioDetectado: "Desperdicio Detectado",
    radarRenovacoes: "Radar de Renovaciones", nenhumaRenovacao: "Sin renovaciones próximas",
    renovaEm: "renueva en", diasVencido: "vencido hace", dias: "días", hoje: "hoy", amanha: "mañana",
    duplicadoDetectado: "Posible costo duplicado detectado",
    urgVencido: "Vencido", urgCritico: "Crítico", urgProximo: "Próximo", urgFuturo: "Futuro",
    alertaDuplicado: "Costos con nombres muy similares — verifique duplicados.",
    alertaPeso: "Los costos fijos consumen gran parte de los ingresos. Evalúe recortes.",
    positivoEnxuto: "Estructura de costos ágil y saludable.",
    total: "TOTAL", visaoCFO: "Visión CFO",
    margemContribuicao: "Margen de Contribución", pontoEquilibrio: "Punto de Equilibrio",
    margemSeguranca: "Margen de Seguridad", volatilidade: "Volatilidad",
    custoVariavelMes: "Costo Variable del Mes", semBreakeven: "Sin equilibrio posible",
    analiseMargem: "Análisis de Margen", subAnaliseMargem: "Ingresos · Costo Variable · Punto de Equilibrio",
    alertaSemBreakeven: "El costo variable consume todos los ingresos — no hay punto de equilibrio posible con esta estructura. Revise precio o costo con urgencia.",
    alertaMargemBaixa: "Margen de seguridad bajo: poco margen antes de pérdidas si caen los ingresos.",
    alertaVolatilidade: "Costos variables muy inestables mes a mes — dificulta la previsión de caja.",
    alertaSangriaMargem: "El costo variable crece más rápido que los ingresos — el margen se está erosionando.",
    positivoMargemSaudavel: "Margen de seguridad saludable — buen margen sobre el punto de equilibrio.",
    periodoMesAtual: "Mes actual", periodoMesAnterior: "Mes anterior", periodoTrimestreAtual: "Trimestre actual",
    periodoAnoAtual: "Año actual", periodoUltimos12: "Últimos 12 meses", periodoPersonalizado: "Personalizado",
    vsPeriodoAnterior: "vs período anterior", periodoEstavel: "estable",
    narrativaTitulo: "Qué cambió", sugestoesTitulo: "Sugerencias de la IA", anomaliasTitulo: "Anomalías Detectadas",
    puxadoPor: "impulsado por", subiram: "subieron", cairam: "cayeron", ficaramEstaveis: "se mantuvieron estables",
    acimaPropriaMedia: "por encima de su propio promedio histórico", economiaPotencialSugestao: "Ahorro potencial",
    itemRenegociar: "subió de forma consistente en los últimos meses. Vale la pena renegociar.",
    itemAcimaMedia: "costó bastante más de lo habitual — vale la pena revisar el motivo.",
    visaoSemanal: "Vista Semanal (13 semanas)", visaoMensal: "Vista Mensual",
    rupturaCaixaTitulo: "Alerta de Ruptura de Caja", saldoProjetado: "Saldo Proyectado",
    semRupturaPrevista: "Ninguna ruptura de caja prevista en el horizonte analizado — buen margen.",
    cenarioOtimista: "Optimista", cenarioPessimista: "Pesimista", cenarioPrevisto: "Previsto",
    saldoAtual: "Saldo Actual", entradasPrevistas: "Entradas Previstas", saidasPrevistas: "Salidas Previstas",
    precisaoPrevisao: "Precisión del Pronóstico",
    previstosAutomaticos: "Previstos Automáticos", subPrevistosAutomaticos: "Traído directo de otros módulos — no hace falta registrar de nuevo aquí",
    origemContasReceber: "Cuentas por Cobrar", origemContasPagar: "Cuentas por Pagar", origemCustosFixos: "Costos Fijos", origemDividas: "Cuotas de Deudas",
    incluirPrevistosAuto: "Incluir previstos automáticos en la proyección", avisoDuplicidade: "Si ya registra estos ítems manualmente aquí, desactive para no contar dos veces.",
    dreReceitaBruta: "Ingresos Brutos", dreDeducoes: "(-) Deducciones e Impuestos", dreReceitaLiquida: "Ingresos Netos",
    dreCustoVariavel: "(-) Costos Variables", dreMargemContribuicao: "Margen de Contribución", dreCustoFixo: "(-) Costos Fijos",
    dreEbitda: "EBITDA", dreDespesasFinanceiras: "(-) Gastos Financieros (Intereses)", dreLucroLiquido: "Utilidad Neta", dreMargemLiquida: "Margen Neto",
    cascataDRE: "Cascada del Resultado", analiseVertical: "Análisis Vertical (% de Ingresos Netos)", analiseHorizontal: "Análisis Horizontal (vs período anterior)",
    diagnosticoTitulo: "Diagnóstico de Rentabilidad", causaRaizTitulo: "Causa Raíz de la Variación",
    ponteLucroCaixaTitulo: "Puente Utilidad × Caja", semaforoSaudeTitulo: "Semáforo de Salud", runwayTitulo: "Runway",
    conselhoCfoTitulo: "Consejo CFO", runwaySaudavel: "Ningún riesgo de deterioro crítico en el horizonte analizado.",
    semGatilhoConselho: "Ninguna recomendación crítica por ahora — resultado bajo control.",
    fatorReceita: "Ingresos", fatorDeducoes: "Impuestos", fatorCustoVariavel: "Costos Variables", fatorCustoFixo: "Costos Fijos", fatorDespesasFinanceiras: "Gastos Financieros",
    sinalMargemLiquida: "Margen Neto", sinalEbitdaQueda: "EBITDA en Caída", sinalPesoCustoFixo: "Peso del Costo Fijo", sinalConcentracao: "Concentración de Clientes",
    historicoTitulo: "Historial de Resultados", historicoVazio: "Ningún período cerrado todavía — vuelva a fin de mes.",
    periodoFechado: "Cerrado", periodoAberto: "En curso", verHistorico: "Ver Historial",
    escadaVencimentosTitulo: "Muro de Vencimientos", muroDetectado: "Muro de vencimientos",
    semMuro: "Ningún muro de vencimientos en el horizonte analizado.",
    avalancheTitulo: "Método Avalancha", dividaCaraTag: "Cara", quitarPrimeiroLabel: "Pagar primero",
    indicadoresSolvenciaTitulo: "Indicadores de Solvencia",
    coberturaJurosLabel: "Cobertura de Intereses", dividaEbitdaLabel: "Deuda / EBITDA", dividaReceitaLabel: "Deuda / Ingresos",
    comprometimentoMensalLabel: "Compromiso Mensual", fluxoCaixaSobreDividaLabel: "Flujo de Caja / Deuda",
    semJuros: "Sin gasto financiero", semEbitda: "EBITDA insuficiente",
    simuladorTitulo: "Simulador de Refinanciación", novaTaxaLabel: "Nueva tasa (% mensual)", novoPrazoLabel: "Nuevo plazo (cuotas)",
    economiaJurosLabel: "Ahorro de Intereses", liberacaoCaixaLabel: "Libera de Caja/Mes",
    radarPrevencaoTitulo: "Radar de Prevención de Quiebra", runwayDividaTitulo: "Runway de la Deuda",
    conselhoDividaTitulo: "Consejo CFO", semGatilhoDivida: "Ninguna recomendación crítica por ahora — endeudamiento bajo control.",
    projecaoQuitacaoTitulo: "Proyección de Pago", cenarioMinimoLabel: "Ritmo Actual", cenarioAvalancheLabel: "Avalancha",
    semDividaTitulo: "Ninguna deuda registrada — estructura de capital libre de endeudamiento.",
    regraOuroNegociar: "Regla de oro: negocie antes de atrasarse — después del atraso, pierde poder de negociación.",
    quitacaoEm: "se paga en", naoQuitaHorizonte: "no se paga dentro del horizonte analizado",
    // Metas
    metaKpiNoRitmo: "En Ritmo", metaKpiEmRisco: "En Riesgo", metaKpiValorEmJogo: "Valor en Juego",
    metaKpiTaxaSucesso: "Tasa de Éxito Histórica", metaKpiProximaPrazo: "Más Cerca del Plazo", metaKpiMarcos: "Hitos Conquistados",
    metaTipoFaturamento: "Facturación", metaTipoLucro: "Utilidad", metaTipoMargem: "Margen",
    metaTipoReducaoCusto: "Reducción de Costo", metaTipoReducaoDivida: "Reducción de Deuda",
    metaTipoCaixa: "Saldo de Caja", metaTipoTicketMedio: "Ticket Medio", metaTipoNumClientes: "Nº de Clientes Activos",
    metaSemaforoVerde: "En Ritmo", metaSemaforoAmarelo: "Atención", metaSemaforoVermelho: "En Riesgo",
    metaClassificacaoFacil: "Demasiado fácil", metaClassificacaoImpossivel: "Fuera de alcance", metaClassificacaoRealista: "Realista",
    metaRitmoNecessario: "Ritmo Necesario", metaRitmoAtual: "Ritmo Actual",
    metaProgressoReal: "Progreso Real", metaProgressoEsperadoLabel: "Progreso Esperado",
    metaFaltam: "faltan", metaPorMes: "/mes",
    metaArvoreTitulo: "Árbol de Dependencia entre Metas", metaSemDependencia: "Ninguna meta depende de otra en riesgo por ahora.",
    metaRaciocinioTitulo: "De dónde vino este número", metaRankingRitmoTitulo: "Ritmo Necesario vs Ritmo Actual",
    metaMarco25: "1/4 del camino recorrido", metaMarco50: "Mitad de la meta conquistada", metaMarco75: "Recta final — 3/4 recorridos", metaMarco100: "Meta alcanzada",
    metaConselhoTitulo: "Consejo CFO", metaSemGatilho: "Ninguna recomendación crítica ahora — metas bajo control.",
    metaModalAnaliseTitulo: "Análisis de Metas", metaModalAnaliseSub: "Progreso Real × Esperado · Evolución · Estado",
    metaGraficoProgresso: "Progreso: Real vs Esperado", metaGraficoEvolucao: "Evolución hacia la Meta", metaGraficoStatus: "Metas por Semáforo",
    metaSemTipoAviso: "Metas antiguas sin tipo vinculado a datos reales — reclasifíquelas para activar el seguimiento automático.",
    metaValorInicial: "Valor Inicial", metaValorAlvo: "Valor Objetivo", metaValorAtual: "Valor Actual",
    metaConcluidaAuto: "Completada", metaArquivada: "Archivada", metaAtiva: "Activa", metaArquivar: "Archivar",
    metaValorInicialLabel: "Valor Inicial", metaValorInicialAjuda: "Punto de partida — prellenado con el valor real de hoy, puede ajustarlo.",
    metaDirecaoLabel: "Dirección", metaDirecaoAumentar: "Aumentar", metaDirecaoReduzir: "Reducir",
    metaDirecaoInconsistente: "La dirección no coincide con los valores: revise el valor inicial y el objetivo.",
    metaResponsavelLabel: "Responsable", metaResponsavelPlaceholder: "¿Quién es el dueño de esta meta?",
    metaDescricaoLabel: "Estrategia (cómo va a lograr esta meta)", metaDescricaoPlaceholder: "Ej: renegociar los 3 principales proveedores antes de marzo",
    metaDeParaLabel: "de", metaParaLabel: "a", metaErroSalvar: "No se pudo guardar la meta. Detalle del error:",
  },
};

export type CfoTextos = typeof TEXTOS.pt;

export function cfoT(lang: string): CfoTextos {
  return TEXTOS[(lang as CfoLang)] || TEXTOS.pt;
}

// Mapa chave->texto para insights (usado com Insight.chave do cfoCore)
export function textoInsight(lang: string, chave: string): string {
  const t = cfoT(lang) as any;
  return t[chave] || "";
}

// ═══════════════════════════════════════════════════════════════
// CANAIS DE COMPARTILHAMENTO — padrão único Axioma
// (WhatsApp, Telegram, Gmail, Outlook — sem "Email Padrão"/mailto)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// NARRATIVA AUTOMÁTICA DE VARIAÇÃO — a IA "mostra o raciocínio":
// sempre cita a categoria/item que puxou o número, nunca solto.
// ═══════════════════════════════════════════════════════════════
export function montarNarrativaVariacao(lang: string, p: {
  metrica: string; pct: number; categoriaPrincipal?: string; valorCategoriaPrincipal?: number;
}): string {
  const cx = cfoT(lang);
  const direcaoTxt = Math.abs(p.pct) < 1 ? cx.ficaramEstaveis : p.pct > 0 ? cx.subiram : cx.cairam;
  const pctTxt = fPct(Math.abs(p.pct));
  let frase = `${p.metrica} ${direcaoTxt} ${pctTxt}`;
  if (Math.abs(p.pct) >= 1 && p.categoriaPrincipal && p.valorCategoriaPrincipal) {
    frase += `, ${cx.puxadoPor} ${p.categoriaPrincipal} (${p.valorCategoriaPrincipal > 0 ? "+" : ""}${fBRL(p.valorCategoriaPrincipal)})`;
  }
  return frase + ".";
}

export function montarNarrativaMargem(lang: string, pctAntes: number, pctDepois: number): string {
  const cx = cfoT(lang);
  const diff = pctDepois - pctAntes;
  if (Math.abs(diff) < 0.5) return `${cx.margemContribuicao} ${cx.ficaramEstaveis} em ${fPct(pctDepois)}.`;
  const verbo = diff > 0 ? cx.subiram : cx.cairam;
  return `${cx.margemContribuicao} ${verbo} de ${fPct(pctAntes)} para ${fPct(pctDepois)}.`;
}

// ═══════════════════════════════════════════════════════════════
// SUGESTÕES ACIONÁVEIS — sempre amarradas a uma anomalia real,
// nunca genéricas. Espelha AnomaliaHistorica do cfoCore.
// ═══════════════════════════════════════════════════════════════
export function montarSugestao(lang: string, anomalia: { tipo: "acima_media" | "aumento_recorrente"; descricao: string; impacto: number }): string {
  const cx = cfoT(lang);
  const base = anomalia.tipo === "aumento_recorrente" ? cx.itemRenegociar : cx.itemAcimaMedia;
  return `"${anomalia.descricao}" ${base} ${cx.economiaPotencialSugestao}: ${fBRL(Math.abs(anomalia.impacto))}.`;
}

// ═══════════════════════════════════════════════════════════════
// RUPTURA DE CAIXA — frase com a data exata, formatada por idioma
// ═══════════════════════════════════════════════════════════════
export function montarNarrativaRuptura(lang: string, dataISO: string, diasRestantes: number): string {
  const d = new Date(dataISO + "T00:00:00");
  const localeMap: Record<string, string> = { pt: "pt-BR", en: "en-US", es: "es-ES" };
  const dataFmt = d.toLocaleDateString(localeMap[lang] || "pt-BR", { day: "2-digit", month: "long" });
  if (lang === "en") return `If nothing changes, your cash balance goes negative on ${dataFmt} (in ${diasRestantes} days).`;
  if (lang === "es") return `Si nada cambia, su saldo de caja queda negativo el ${dataFmt} (en ${diasRestantes} días).`;
  return `Se nada mudar, seu saldo de caixa fica negativo em ${dataFmt} (daqui a ${diasRestantes} dias).`;
}

// ═══════════════════════════════════════════════════════════════
// DRE — NARRATIVAS (causa raiz, ponte lucro×caixa, runway, conselho CFO)
// Sempre citando o fator/valor real por trás do número, nunca solto.
// ═══════════════════════════════════════════════════════════════
const NOMES_FATOR: Record<CfoLang, Record<FatorVariacaoLucro["fator"], keyof CfoTextos>> = {
  pt: { receita: "fatorReceita", deducoes: "fatorDeducoes", custoVariavel: "fatorCustoVariavel", custoFixo: "fatorCustoFixo", despesasFinanceiras: "fatorDespesasFinanceiras" },
  en: { receita: "fatorReceita", deducoes: "fatorDeducoes", custoVariavel: "fatorCustoVariavel", custoFixo: "fatorCustoFixo", despesasFinanceiras: "fatorDespesasFinanceiras" },
  es: { receita: "fatorReceita", deducoes: "fatorDeducoes", custoVariavel: "fatorCustoVariavel", custoFixo: "fatorCustoFixo", despesasFinanceiras: "fatorDespesasFinanceiras" },
};

export function montarNarrativaCausaRaiz(lang: string, variacaoLucro: number, fatorPrincipal: FatorVariacaoLucro): string {
  const l = (lang as CfoLang) in NOMES_FATOR ? (lang as CfoLang) : "pt";
  const cx = cfoT(l);
  const nomeFator = cx[NOMES_FATOR[l][fatorPrincipal.fator]] as string;
  const subiu = variacaoLucro >= 0;
  if (l === "en") return `Net profit ${subiu ? "went up" : "went down"} ${fBRL(Math.abs(variacaoLucro))}, mainly driven by ${nomeFator} (${fBRL(Math.abs(fatorPrincipal.impacto))} impact).`;
  if (l === "es") return `La utilidad neta ${subiu ? "subió" : "cayó"} ${fBRL(Math.abs(variacaoLucro))}, impulsada principalmente por ${nomeFator} (impacto de ${fBRL(Math.abs(fatorPrincipal.impacto))}).`;
  return `O lucro líquido ${subiu ? "subiu" : "caiu"} ${fBRL(Math.abs(variacaoLucro))}, puxado principalmente por ${nomeFator} (impacto de ${fBRL(Math.abs(fatorPrincipal.impacto))}).`;
}

const CAUSA_PONTE: Record<"recebiveis" | "amortizacaoDivida" | "indefinida", Record<CfoLang, string>> = {
  recebiveis: { pt: "recebíveis parados", en: "receivables stuck in receivables", es: "cuentas por cobrar detenidas" },
  amortizacaoDivida: { pt: "amortização de dívida (reduz caixa, mas não é despesa no DRE)", en: "debt principal payments (reduce cash but aren't a P&L expense)", es: "amortización de deuda (reduce la caja, pero no es un gasto en el estado de resultados)" },
  indefinida: { pt: "variação de capital de giro", en: "working capital variation", es: "variación de capital de trabajo" },
};

export function montarNarrativaPonte(lang: string, ponte: PonteLucroCaixa): string {
  const l = (lang as CfoLang) in CAUSA_PONTE.recebiveis ? (lang as CfoLang) : "pt";
  const causa = ponte.causaProvavel ? CAUSA_PONTE[ponte.causaProvavel][l] : null;
  const moveu = ponte.caixaRealizado >= 0;
  if (l === "en") return `You had a profit of ${fBRL(ponte.lucroLiquido)} but cash ${moveu ? "only moved" : "dropped"} ${fBRL(ponte.caixaRealizado)}${causa ? ` — likely cause: ${causa}` : ""}.`;
  if (l === "es") return `Tuvo una utilidad de ${fBRL(ponte.lucroLiquido)} pero la caja ${moveu ? "solo se movió" : "cayó"} ${fBRL(ponte.caixaRealizado)}${causa ? ` — causa probable: ${causa}` : ""}.`;
  return `Você teve lucro de ${fBRL(ponte.lucroLiquido)} mas o caixa ${moveu ? "só se moveu" : "caiu"} ${fBRL(ponte.caixaRealizado)}${causa ? ` — causa provável: ${causa}` : ""}.`;
}

export function montarNarrativaRunway(lang: string, meses: number | null): string {
  const cx = cfoT(lang);
  if (meses === null) return cx.runwaySaudavel;
  if (lang === "en") return `If the current trend continues, the result becomes critical in ${meses} month${meses > 1 ? "s" : ""}.`;
  if (lang === "es") return `Si la tendencia actual continúa, el resultado se vuelve crítico en ${meses} mes${meses > 1 ? "es" : ""}.`;
  return `Se a tendência atual continuar, o resultado fica crítico em ${meses} ${meses > 1 ? "meses" : "mês"}.`;
}

export function montarConselhoCFO(lang: string, g: GatilhoConselho): string {
  if (g.tipo === "renegociarCusto") {
    if (lang === "en") return `Renegotiate "${g.descricao}": it has been rising and impacting ${fBRL(Math.abs(g.impacto))}. Recovering it restores margin.`;
    if (lang === "es") return `Renegocie "${g.descricao}": viene subiendo e impacta ${fBRL(Math.abs(g.impacto))}. Recuperarlo restaura margen.`;
    return `Renegocie "${g.descricao}": vem subindo e impacta ${fBRL(Math.abs(g.impacto))}. Recuperar isso restaura margem.`;
  }
  if (g.tipo === "revisarCustoFixo") {
    if (lang === "en") return `Review the "${g.categoria}" fixed cost category: it's ${fPct(g.pesoPct)} of net revenue, above the sector benchmark. Trimming it recovers about ${fBRL(g.impacto)}.`;
    if (lang === "es") return `Revise la categoría de costo fijo "${g.categoria}": representa ${fPct(g.pesoPct)} de los ingresos netos, por encima del benchmark del sector. Reducirla recupera cerca de ${fBRL(g.impacto)}.`;
    return `Revise a categoria de custo fixo "${g.categoria}": representa ${fPct(g.pesoPct)} da receita líquida, acima do benchmark do setor. Reduzir isso recupera cerca de ${fBRL(g.impacto)}.`;
  }
  if (g.tipo === "aumentarMargemSeguranca") {
    if (lang === "en") return `Margin of safety is only ${fPct(g.margemAtualPct)}. Growing revenue by ${fBRL(g.receitaNecessaria)} brings it to a healthier 20%.`;
    if (lang === "es") return `El margen de seguridad es de solo ${fPct(g.margemAtualPct)}. Crecer los ingresos en ${fBRL(g.receitaNecessaria)} lo lleva a un 20% más saludable.`;
    return `A margem de segurança está em apenas ${fPct(g.margemAtualPct)}. Crescer a receita em ${fBRL(g.receitaNecessaria)} leva a um patamar mais saudável de 20%.`;
  }
  if (lang === "en") return `There's ${fBRL(g.valorParado)} in pending receivables. Collecting it turns paper profit into real cash.`;
  if (lang === "es") return `Hay ${fBRL(g.valorParado)} en cuentas por cobrar pendientes. Cobrarlas convierte la utilidad en caja real.`;
  return `Há ${fBRL(g.valorParado)} em recebíveis parados. Cobrar isso converte lucro de papel em caixa de verdade.`;
}

// ═══════════════════════════════════════════════════════════════
// ENDIVIDAMENTO — NARRATIVAS (muro de vencimentos, avalanche, runway,
// conselho CFO de dívida). Mesma regra: sempre citar o número/origem real.
// ═══════════════════════════════════════════════════════════════
export function montarNarrativaMuro(lang: string, bucket: BucketVencimento): string {
  if (lang === "en") return `You have ${fBRL(bucket.valor)} coming due in ${bucket.label}. Start renegotiating now, while you still have bargaining power.`;
  if (lang === "es") return `Tiene ${fBRL(bucket.valor)} venciendo en ${bucket.label}. Empiece a renegociar ahora, mientras tiene poder de negociación.`;
  return `Você tem ${fBRL(bucket.valor)} vencendo em ${bucket.label}. Comece a renegociar agora, enquanto tem poder de barganha.`;
}

export function montarNarrativaRunwayDivida(lang: string, meses: number | null): string {
  const cx = cfoT(lang);
  if (meses === null) return cx.naoQuitaHorizonte;
  if (lang === "en") return `At the current pace, you become debt-free in ${meses} month${meses > 1 ? "s" : ""}.`;
  if (lang === "es") return `Al ritmo actual, queda libre de deudas en ${meses} mes${meses > 1 ? "es" : ""}.`;
  return `No ritmo atual, você fica livre de dívidas em ${meses} ${meses > 1 ? "meses" : "mês"}.`;
}

export function montarConselhoDivida(lang: string, g: GatilhoConselhoDivida): string {
  if (g.tipo === "quitarPrimeiro") {
    if (lang === "en") return `Pay off "${g.descricao}" first (${fPct(g.taxaJurosAM)}/mo): it's the most expensive debt in your portfolio. Prioritizing it saves about ${fBRL(g.economiaEstimada)} over 6 months.`;
    if (lang === "es") return `Pague primero "${g.descricao}" (${fPct(g.taxaJurosAM)}/mes): es la deuda más cara de su cartera. Priorizarla ahorra cerca de ${fBRL(g.economiaEstimada)} en 6 meses.`;
    return `Quite primeiro "${g.descricao}" (${fPct(g.taxaJurosAM)}/mês): é a dívida mais cara do seu portfólio. Priorizá-la economiza cerca de ${fBRL(g.economiaEstimada)} em 6 meses.`;
  }
  if (g.tipo === "refinanciarAntesMuro") {
    if (lang === "en") return `Refinance before ${g.mesMuro}: ${fBRL(g.valorMuro)} in installments come due that month — a maturity wall risking cash flow.`;
    if (lang === "es") return `Refinancie antes de ${g.mesMuro}: ${fBRL(g.valorMuro)} en cuotas vencen ese mes — un muro de vencimientos que arriesga el flujo de caja.`;
    return `Refinancie antes de ${g.mesMuro}: ${fBRL(g.valorMuro)} em parcelas vencem nesse mês — um muro de vencimentos que arrisca o caixa.`;
  }
  if (g.tipo === "coberturaJurosBaixa") {
    if (lang === "en") return `Interest coverage is only ${g.coberturaAtual.toFixed(1)}x — EBITDA barely covers financial expenses. Any drop in results risks default.`;
    if (lang === "es") return `La cobertura de intereses es de solo ${g.coberturaAtual.toFixed(1)}x — el EBITDA apenas cubre los gastos financieros. Cualquier caída en el resultado arriesga el incumplimiento.`;
    return `A cobertura de juros está em apenas ${g.coberturaAtual.toFixed(1)}x — o EBITDA mal cobre as despesas financeiras. Qualquer queda no resultado arrisca calote.`;
  }
  if (lang === "en") return `Debt is ${g.multiplo.toFixed(1)}x EBITDA — above the healthy 4x ceiling. New debt should wait until this ratio comes down.`;
  if (lang === "es") return `La deuda es ${g.multiplo.toFixed(1)}x el EBITDA — por encima del techo saludable de 4x. Nueva deuda debería esperar hasta que este ratio baje.`;
  return `A dívida está em ${g.multiplo.toFixed(1)}x o EBITDA — acima do teto saudável de 4x. Nova dívida deveria esperar esse múltiplo cair.`;
}

// ═══════════════════════════════════════════════════════════════
// METAS — NARRATIVAS (ritmo, projeção, meta irreal, marco, conselho,
// árvore de dependência). Sempre citando o número real por trás.
// ═══════════════════════════════════════════════════════════════
const NOMES_TIPO_META: Record<TipoMeta, keyof CfoTextos> = {
  faturamento: "metaTipoFaturamento", lucro: "metaTipoLucro", margem: "metaTipoMargem",
  reducao_custo: "metaTipoReducaoCusto", reducao_divida: "metaTipoReducaoDivida",
  caixa: "metaTipoCaixa", ticket_medio: "metaTipoTicketMedio", num_clientes: "metaTipoNumClientes",
};

export function nomeTipoMeta(lang: string, tipo: TipoMeta): string {
  return cfoT(lang)[NOMES_TIPO_META[tipo]] as string;
}

// p.necessarioFmt/atualFmt/faltaFmt já vêm formatados pelo chamador (R$, % ou nº — a unidade varia por tipo).
export function montarNarrativaRitmo(lang: string, p: { necessarioFmt: string; atualFmt: string; faltaFmt: string | null }): string {
  if (lang === "en") return `To hit the goal you need ${p.necessarioFmt}/month. You're doing ${p.atualFmt}/month${p.faltaFmt ? ` — ${p.faltaFmt}/month short` : ""}.`;
  if (lang === "es") return `Para lograr la meta necesita ${p.necessarioFmt}/mes. Está haciendo ${p.atualFmt}/mes${p.faltaFmt ? ` — faltan ${p.faltaFmt}/mes` : ""}.`;
  return `Para bater a meta, você precisa de ${p.necessarioFmt}/mês. Está fazendo ${p.atualFmt}/mês${p.faltaFmt ? ` — faltam ${p.faltaFmt}/mês` : ""}.`;
}

export function montarNarrativaProjecaoMeta(lang: string, projecaoPct: number): string {
  const pct = fPct(Math.max(0, projecaoPct));
  if (projecaoPct >= 100) {
    if (lang === "en") return `At the current pace, you beat this goal — projected at ${pct}.`;
    if (lang === "es") return `Al ritmo actual, supera esta meta — proyectado en ${pct}.`;
    return `No ritmo atual, você bate esta meta — projeção de ${pct}.`;
  }
  if (lang === "en") return `At the current pace you don't hit this goal — projected to close at ${pct}. Accelerate or extend the deadline.`;
  if (lang === "es") return `Al ritmo actual no logra esta meta — proyectado a cerrar en ${pct}. Acelere o extienda el plazo.`;
  return `No ritmo atual você não bate esta meta — projeção de fechamento em ${pct}. Precisa acelerar ou estender o prazo.`;
}

export function montarNarrativaMetaIrreal(lang: string, classificacao: "facil" | "impossivel", sugestaoFmt: string): string {
  if (classificacao === "facil") {
    if (lang === "en") return `This goal is below what the business already does on its own. Consider raising the target to ${sugestaoFmt}.`;
    if (lang === "es") return `Esta meta está por debajo de lo que el negocio ya hace por sí solo. Considere subir el objetivo a ${sugestaoFmt}.`;
    return `Essa meta está abaixo do que a empresa já faz sozinha. Considere subir o alvo para ${sugestaoFmt}.`;
  }
  if (lang === "en") return `This goal is far beyond the pace the business has ever shown. A realistic ambitious target would be ${sugestaoFmt}.`;
  if (lang === "es") return `Esta meta está muy por encima del ritmo que el negocio ya demostró. Un objetivo ambicioso pero realista sería ${sugestaoFmt}.`;
  return `Essa meta está muito acima do ritmo que a empresa já demonstrou. Um alvo ambicioso e realista seria ${sugestaoFmt}.`;
}

export function montarNarrativaMarco(lang: string, marco: 25 | 50 | 75 | 100, titulo: string): string {
  const cx = cfoT(lang);
  const chave = marco === 25 ? "metaMarco25" : marco === 50 ? "metaMarco50" : marco === 75 ? "metaMarco75" : "metaMarco100";
  return `"${titulo}" — ${cx[chave as keyof CfoTextos]}.`;
}

export function montarConselhoMeta(lang: string, g: GatilhoConselhoMeta): string {
  if (g.tipo === "acelerar") {
    if (lang === "en") return `Accelerate "${g.tituloMeta}": at the current pace you need to speed up ${fPct(g.percentualAcelerar)} to hit the deadline.`;
    if (lang === "es") return `Acelere "${g.tituloMeta}": al ritmo actual necesita acelerar ${fPct(g.percentualAcelerar)} para llegar al plazo.`;
    return `Acelere "${g.tituloMeta}": no ritmo atual, você precisa acelerar ${fPct(g.percentualAcelerar)} pra bater o prazo.`;
  }
  if (g.tipo === "retaFinal") {
    if (lang === "en") return `"${g.tituloMeta}" is in the home stretch — ${fBRL(g.faltam)} left to close it out.`;
    if (lang === "es") return `"${g.tituloMeta}" está en la recta final — faltan ${fBRL(g.faltam)} para cerrarla.`;
    return `"${g.tituloMeta}" está na reta final — faltam ${fBRL(g.faltam)} pra fechar.`;
  }
  const classTxt = cfoT(lang)[g.classificacao === "facil" ? "metaClassificacaoFacil" : "metaClassificacaoImpossivel"];
  if (lang === "en") return `"${g.tituloMeta}" was flagged as "${classTxt}" — suggested target: ${fBRL(g.sugestaoAlvo)}.`;
  if (lang === "es") return `"${g.tituloMeta}" fue marcada como "${classTxt}" — objetivo sugerido: ${fBRL(g.sugestaoAlvo)}.`;
  return `"${g.tituloMeta}" foi sinalizada como "${classTxt}" — alvo sugerido: ${fBRL(g.sugestaoAlvo)}.`;
}

export function montarNarrativaDependencia(lang: string, tituloMeta: string, arvore: ArvoreMeta): string {
  const nomes = arvore.dependenciaEmRisco.map((t) => nomeTipoMeta(lang, t)).join(", ");
  if (lang === "en") return `"${tituloMeta}" depends on ${nomes} — currently at risk, which threatens this goal too.`;
  if (lang === "es") return `"${tituloMeta}" depende de ${nomes} — actualmente en riesgo, lo que amenaza también esta meta.`;
  return `"${tituloMeta}" depende de ${nomes} — em risco no momento, o que ameaça essa meta também.`;
}

export function canaisCompartilhamento(texto: string, assunto: string) {
  const enc = encodeURIComponent(texto);
  const encAssunto = encodeURIComponent(assunto);
  return [
    { nome: "WhatsApp", cor: "#25D366", url: `https://wa.me/?text=${enc}` },
    { nome: "Telegram", cor: "#0088cc", url: `https://t.me/share/url?url=axiomaai.com.br&text=${enc}` },
    { nome: "Gmail", cor: "#EA4335", url: `https://mail.google.com/mail/?view=cm&fs=1&su=${encAssunto}&body=${enc}` },
    { nome: "Outlook", cor: "#0078D4", url: `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encAssunto}&body=${enc}` },
  ];
}