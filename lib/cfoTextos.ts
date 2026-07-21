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
  type GatilhoConselhoInvestimento, type OportunidadeResgate,
  type ResultadoAlocacao, type CategoriaAlocacao, type ResultadoCenario,
  type ImpactoSensibilidade, type ResultadoMonteCarlo, type DriverSensibilidade,
  type ImpactoPreco, type ImpactoDesconto, type ElasticidadeEstimada,
  type OportunidadePrecificacao, type TipoOportunidadePrecificacao, type IPPA,
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
    // Investimentos
    invPainelExecutivo: "Painel Executivo", invPatrimonioTotal: "Patrimônio Total", invCaixaDisponivel: "Caixa Disponível",
    invCapitalInvestido: "Capital Investido", invCapitalOcioso: "Capital Ocioso", invLiquidezImediata: "Liquidez Imediata",
    invLiquidezProjetada: "Liquidez Projetada (12m)", invRentabilidadeConsolidada: "Rentabilidade Líquida Média",
    invRentabilidadeAnualizada: "Rentabilidade Anualizada", invExposicaoRisco: "Exposição a Risco", invDiversificacao: "Diversificação",
    invScoreTitulo: "Score de Investimento", invScoreCritico: "Crítico", invScoreAtencao: "Atenção", invScoreBom: "Bom", invScoreExcelente: "Excelente",
    invIndicadoresMacro: "Indicadores de Mercado (Banco Central)", invSelic: "Selic", invCdi: "CDI", invIpca: "IPCA 12m", invDolar: "Dólar (PTAX)",
    invFonteBcb: "Fonte: Banco Central (SGS), tempo real", invFonteFallback: "API do Banco Central indisponível — usando referência aproximada",
    invCustoOportunidadeTitulo: "Custo de Oportunidade vs Dívida", invSemOportunidade: "Nenhuma aplicação líquida rende menos que sua dívida mais cara no momento.",
    invEscadaLiquidezTitulo: "Escada de Liquidez", invRadarRiscoTitulo: "Radar de Riscos",
    invRiscoConcentracaoTipo: "Concentração por Tipo", invRiscoConcentracaoInstituicao: "Concentração por Instituição",
    invRiscoLiquidez: "Liquidez", invRiscoIliquidezEndividada: "Dívida vs Capacidade", invRiscoVolatilidade: "Volatilidade (Renda Variável/Cripto)",
    invConselhoTitulo: "Conselho CFO", invSemGatilho: "Nenhuma recomendação crítica agora — carteira sob controle.",
    invSemDados: "Nenhum investimento cadastrado — cadastre para ativar a inteligência de alocação de capital.",
    invTipoRendaFixa: "Renda Fixa", invTipoRendaVariavel: "Renda Variável", invTipoCriptomoeda: "Criptomoeda", invTipoImovel: "Imóvel", invTipoOutro: "Outro",
    invLiquidezDiaria: "Diária", invLiquidezCurtoPrazo: "Curto Prazo", invLiquidezLongoPrazo: "Longo Prazo", invLiquidezNoVencimento: "No Vencimento",
    invStatusAtivo: "Ativo", invStatusResgatado: "Resgatado",
    invInstituicaoLabel: "Instituição", invVencimentoLabel: "Vencimento (resgate)", invIndexadorLabel: "Indexador", invLiquidezLabel: "Liquidez", invStatusLabel: "Status",
    invModalAnaliseTitulo: "Análise de Investimentos", invModalAnaliseSub: "Composição · Escada de Liquidez · Custo de Oportunidade",
    invGraficoComposicaoTipo: "Composição por Tipo", invGraficoEscadaLiquidez: "Liquidez ao Longo do Tempo",
    // Fase 2 — Capital Allocation Engine / Simulador Executivo
    invAllocationTitulo: "Capital Allocation Engine", invAllocationSub: "Compare onde alocar o próximo real de capital",
    invRadarOportunidadesTitulo: "Radar de Oportunidades", invAdicionarOpcao: "Adicionar à Comparação",
    invCategoriaLabel: "Categoria", invValorAlocarLabel: "Valor a Alocar", invRetornoMensalLabel: "Retorno % a.m.",
    invGanhoMensalLabel: "Ganho/Economia Mensal Estimado (R$)", invPaybackLabel: "Payback", invRiscoLabel: "Risco",
    invPrioridadeLabel: "Prioridade", invSemOpcoes: "Adicione opções para comparar onde alocar capital.",
    invRiscoBaixo: "Baixo", invRiscoMedio: "Médio", invRiscoAlto: "Alto", invSemPayback: "Não recupera",
    invCatCdb: "CDB", invCatTesouro: "Tesouro Direto", invCatFundos: "Fundos de Investimento", invCatDebentures: "Debêntures",
    invCatExpansao: "Expansão", invCatEquipamento: "Equipamentos", invCatMarketing: "Marketing", invCatContratacao: "Contratação", invCatAutomacao: "Automação", invCatReducaoDivida: "Redução de Dívida",
    invSimuladorTitulo: "Simulador Executivo", invSimuladorSub: "Simule o impacto de decisões antes de tomá-las — cenários conservador, base, otimista e adverso",
    invChoqueReceita: "Receita (%)", invChoqueCustoFixo: "Custo Fixo (%)", invChoqueCustoVariavel: "Custo Variável (%)",
    invChoqueJuros: "Juros da Dívida (pontos, efeito Selic)", invChoqueAporte: "Aporte de Capital (R$)", invChoqueRetornoAporte: "Retorno Mensal Esperado do Aporte (R$)",
    invSimular: "Simular Cenários", invCenarioConservador: "Conservador", invCenarioBase: "Base", invCenarioOtimista: "Otimista", invCenarioAdverso: "Adverso",
    invLucroLiquidoMensal: "Lucro Líquido/Mês", invSaldoProjetado12m: "Saldo de Caixa (12m)", invRunwayCritico: "Runway Crítico",
    invSemRunway: "Sem risco de ruptura", invUsarNaSimulacao: "Simular este cenário",
    // Simulações
    simTitulo: "Simulações Estratégicas", simSubtitulo: "Motor de cenários conectado aos seus dados reais — não é previsão, é inteligência de decisão",
    simPontoPartidaTitulo: "Ponto de Partida (dados reais)", simPontoPartidaSub: "Puxado automaticamente de Receitas, Custos, Dívidas e Fluxo de Caixa",
    simReceitaMensalLabel: "Receita Mensal Média", simCustoFixoMensalLabel: "Custo Fixo Mensal", simCustoVariavelMensalLabel: "Custo Variável Mensal",
    simDividaTotalLabel: "Dívida Total Ativa", simCaixaDisponivelLabel: "Caixa Disponível", simRegimeAtualLabel: "Regime Tributário Atual",
    simObjetivosTitulo: "Objetivos Rápidos", simObjetivosSub: "Cada botão pré-preenche os choques abaixo — regra determinística, não é IA generativa",
    simObjDobrarFaturamento: "Dobrar Faturamento", simObjTriplicarLucro: "Triplicar Lucro", simObjReduzirCustos: "Reduzir Custos",
    simObjMelhorarFluxoCaixa: "Melhorar Fluxo de Caixa", simObjReduzirDivida: "Reduzir Custo da Dívida",
    simPresetCrise: "Cenário de Crise", simPresetExpansao: "Cenário de Expansão",
    simChoqueCambio: "Choque Cambial — Dólar (%)", simExposicaoCambial: "% do Custo Variável Indexado ao Dólar",
    simHorizonteLabel: "Horizonte de Simulação (meses)",
    simSimular: "Rodar Simulação",
    simCenariosTitulo: "Cenários Simulados", simCenariosSub: "Conservador · Base · Otimista · Adverso",
    simSensibilidadeTitulo: "Análise de Sensibilidade", simSensibilidadeSub: "Qual variável mais decide o seu resultado",
    simDriverReceita: "Receita", simDriverCustoFixo: "Custo Fixo", simDriverCustoVariavel: "Custo Variável",
    simDriverJuros: "Juros da Dívida", simDriverCambio: "Câmbio (Dólar)",
    simFavoravel: "Favorável", simDesfavoravel: "Desfavorável", simPeso: "Peso no Risco",
    simMonteCarloTitulo: "Simulação Monte Carlo", simMonteCarloSub: "Milhares de cenários aleatórios dentro dos limites que você definiu",
    simProbLucroPositivo: "Probabilidade de Lucro Positivo", simProbRupturaCaixa: "Probabilidade de Ruptura de Caixa",
    simFaixaLucroP10P90: "Faixa de Lucro Mensal (P10–P90)", simFaixaCaixaP10P90: "Faixa de Saldo de Caixa (P10–P90)",
    simIteracoes: "iterações simuladas", simMediana: "Mediana",
    simTributarioTitulo: "Impacto por Regime Tributário", simTributarioSub: "Mesmo cenário simulado, comparado nos 3 regimes",
    simRegimeSimples: "Simples Nacional", simRegimePresumido: "Lucro Presumido", simRegimeReal: "Lucro Real",
    simImpostoMensalLabel: "Imposto Mensal Estimado", simLucroLiquidoRegimeLabel: "Lucro Líquido no Regime", simRegimeAtualTag: "regime atual", simRegimeMelhorTag: "melhor no cenário",
    simConselhoTitulo: "Conselho Executivo", simConselhoSub: "Resumo, riscos, oportunidades e plano de ação — gerado por regras, não por IA generativa (ver nota de transparência)",
    simResumoLabel: "Resumo Executivo", simRiscosLabel: "Principais Riscos", simOportunidadesLabel: "Principais Oportunidades",
    simPremissasLabel: "Premissas Utilizadas", simLimitacoesLabel: "Limitações desta Projeção", simNivelConfiancaLabel: "Nível de Confiança",
    simPlanoAcaoLabel: "Plano de Ação Recomendado",
    simConfiancaBaixo: "Baixo", simConfiancaMedio: "Médio", simConfiancaAlto: "Alto",
    simLimitacoesTexto: "Projeção determinística/probabilística baseada nos dados cadastrados e nos choques informados. Não considera eventos fora do modelo (ex: mudança regulatória súbita) nem garante resultado futuro.",
    simTransparenciaTexto: "Esta análise é 100% baseada em regras e nos números reais da sua empresa — nenhum texto aqui foi gerado por um modelo de linguagem.",
    simPremissaReceita: "Receita mensal considerada", simPremissaCustoFixo: "Custo fixo mensal considerado", simPremissaCustoVariavel: "Custo variável mensal considerado",
    simPremissaChoque: "Choque testado no cenário base",
    simPlanoAcaoRevisarCusto: "Revisar o driver de maior sensibilidade antes de comprometer caixa com decisões grandes.",
    simPlanoAcaoAumentarReserva: "Aumentar a reserva de caixa antes de executar este cenário — a probabilidade de ruptura simulada está acima do confortável.",
    simPlanoAcaoAproveitarOportunidade: "Cenário otimista mostra ganho relevante de lucro — vale detalhar o que precisa ser verdade pra chegar lá.",
    simPlanoAcaoManterMonitorando: "Nenhum risco crítico detectado neste cenário — manter monitorando os indicadores reais mês a mês.",
    simSemDados: "Cadastre Receitas, Custos Fixos e Custos Variáveis para o motor de simulação usar dados reais como ponto de partida.",
    simUsarPreset: "Carregar neste simulador",
    // Precificação / Engenharia de Valor
    prcTitulo: "Precificação", prcSubtitulo: "Centro de Engenharia de Valor — preço é consequência da inteligência, não ponto de partida",
    prcIppaTitulo: "IPPA — Índice de Poder de Precificação Axioma", prcIppaSub: "0 a 1000 — quanto maior, menos a empresa depende de desconto pra vender",
    prcNivelCritico: "Crítico", prcNivelAtencao: "Atenção", prcNivelBom: "Bom", prcNivelExcelente: "Excelente",
    prcSubMargem: "Margem", prcSubDependenciaDesconto: "Dependência de Desconto", prcSubConcentracao: "Concentração de Receita", prcSubEstabilidade: "Estabilidade de Receita", prcSubCompetitividade: "Competitividade",
    prcRadarTitulo: "Radar de Oportunidades", prcRadarSub: "Produtos que pedem atenção agora",
    prcTipoDestroiMargem: "Destrói Margem", prcTipoSubprecificado: "Subprecificado", prcTipoSobreprecificado: "Sobreprecificado", prcTipoPremium: "Premium", prcTipoSustentaCaixa: "Sustenta o Caixa",
    prcMotorTitulo: "Motor de Precificação por Valor", prcMotorSub: "Veja o impacto real de um novo preço antes de aplicá-lo",
    prcPrecoAtualLabel: "Preço Atual", prcPrecoCandidatoLabel: "Preço Candidato", prcUnidadesVendidasLabel: "Unidades Vendidas/Mês",
    prcImpactoReceitaLabel: "Impacto na Receita", prcImpactoLucroLabel: "Impacto no Lucro Líquido", prcImpactoEbitdaLabel: "Impacto no EBITDA", prcImpactoTributarioLabel: "Impacto Tributário", prcMargemNovaLabel: "Nova Margem de Contribuição",
    prcAplicarPreco: "Aplicar Este Preço",
    prcDescontoTitulo: "Engenharia de Descontos", prcDescontoSub: "Veja o impacto antes de conceder qualquer desconto",
    prcDescontoPctLabel: "Desconto (%)", prcLimiteMaximoLabel: "Limite Máximo Saudável", prcDentroLimite: "Dentro do limite saudável", prcForaLimite: "Acima do limite — prejuízo direto por unidade",
    prcConcorrentesTitulo: "Inteligência Competitiva", prcConcorrentesSub: "Cadastro manual — comparação automática de preço e posicionamento",
    prcConcorrenteNomeLabel: "Nome do Concorrente", prcConcorrentePrecoLabel: "Preço do Concorrente", prcConcorrentePosicionamentoLabel: "Posicionamento",
    prcAdicionarConcorrente: "Adicionar Concorrente", prcSemConcorrentes: "Nenhum concorrente cadastrado para este produto ainda.",
    prcWarRoomTitulo: "War Room — Simulação Estratégica", prcWarRoomSub: "Reaproveita o motor de Simulações — escolha um cenário de guerra e veja o impacto real",
    prcCenarioConcorrenteReduz: "Concorrente Reduz Preço", prcCenarioConcorrenteAumenta: "Concorrente Aumenta Preço", prcCenarioInflacao: "Alta da Inflação", prcCenarioSelic: "Alta da Selic", prcCenarioCambio: "Choque Cambial",
    prcCenarioCrise: "Crise Econômica", prcCenarioMudancaTributaria: "Mudança Tributária", prcCenarioNovoConcorrente: "Novo Concorrente", prcCenarioExplosaoDemanda: "Explosão de Demanda", prcCenarioQuedaVendas: "Queda nas Vendas", prcCenarioMudancaFornecedores: "Mudança de Fornecedores",
    prcPainelEspecialistasTitulo: "Painel de Especialistas", prcPainelEspecialistasSub: "Análise por regras determinísticas — não é IA generativa ainda (ver nota de transparência)",
    prcEspecialistaCFO: "CFO", prcEspecialistaTributario: "Especialista Tributário", prcEspecialistaComercial: "Especialista Comercial/Pricing", prcEspecialistaRisco: "Especialista em Riscos", prcEspecialistaAnalista: "Analista Financeiro",
    prcRecomendacaoConsolidadaTitulo: "Recomendação Consolidada",
    prcElasticidadeTitulo: "Elasticidade de Preço", prcElasticidadeDadosInsuficientes: "Dados insuficientes — registre pelo menos 3 mudanças de preço para este produto para calcular elasticidade real.",
    prcMemoriaTitulo: "Memória Estratégica", prcMemoriaSub: "Toda decisão de preço registrada, com o resultado real conferido depois",
    prcDecisaoAnteriorLabel: "Preço Anterior", prcDecisaoNovaLabel: "Preço Novo", prcMotivoLabel: "Motivo da Decisão", prcResultadoEsperadoLabel: "Resultado Esperado", prcResultadoRealLabel: "Resultado Real",
    prcRegistrarDecisao: "Registrar Decisão", prcSemDecisoes: "Nenhuma decisão registrada ainda.",
    prcNenhumProduto: "Cadastre produtos para o Centro de Engenharia de Valor calcular tudo automaticamente.",
    prcTransparenciaTexto: "O Painel de Especialistas e a Recomendação Consolidada são gerados 100% por regras a partir dos seus dados reais — nenhum texto aqui foi gerado por um modelo de linguagem ainda.",
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
    // Investments
    invPainelExecutivo: "Executive Panel", invPatrimonioTotal: "Total Assets", invCaixaDisponivel: "Available Cash",
    invCapitalInvestido: "Invested Capital", invCapitalOcioso: "Idle Capital", invLiquidezImediata: "Immediate Liquidity",
    invLiquidezProjetada: "Projected Liquidity (12m)", invRentabilidadeConsolidada: "Average Net Return",
    invRentabilidadeAnualizada: "Annualized Return", invExposicaoRisco: "Risk Exposure", invDiversificacao: "Diversification",
    invScoreTitulo: "Investment Score", invScoreCritico: "Critical", invScoreAtencao: "Attention", invScoreBom: "Good", invScoreExcelente: "Excellent",
    invIndicadoresMacro: "Market Indicators (Central Bank)", invSelic: "Selic", invCdi: "CDI", invIpca: "CPI 12m", invDolar: "USD (PTAX)",
    invFonteBcb: "Source: Brazilian Central Bank (SGS), real-time", invFonteFallback: "Central Bank API unavailable — using approximate reference",
    invCustoOportunidadeTitulo: "Opportunity Cost vs Debt", invSemOportunidade: "No liquid investment currently yields less than your most expensive debt.",
    invEscadaLiquidezTitulo: "Liquidity Ladder", invRadarRiscoTitulo: "Risk Radar",
    invRiscoConcentracaoTipo: "Concentration by Type", invRiscoConcentracaoInstituicao: "Concentration by Institution",
    invRiscoLiquidez: "Liquidity", invRiscoIliquidezEndividada: "Debt vs Capacity", invRiscoVolatilidade: "Volatility (Variable Income/Crypto)",
    invConselhoTitulo: "CFO Advice", invSemGatilho: "No critical recommendation right now — portfolio under control.",
    invSemDados: "No investments on record — add one to activate capital allocation intelligence.",
    invTipoRendaFixa: "Fixed Income", invTipoRendaVariavel: "Variable Income", invTipoCriptomoeda: "Cryptocurrency", invTipoImovel: "Real Estate", invTipoOutro: "Other",
    invLiquidezDiaria: "Daily", invLiquidezCurtoPrazo: "Short Term", invLiquidezLongoPrazo: "Long Term", invLiquidezNoVencimento: "At Maturity",
    invStatusAtivo: "Active", invStatusResgatado: "Redeemed",
    invInstituicaoLabel: "Institution", invVencimentoLabel: "Maturity Date", invIndexadorLabel: "Index", invLiquidezLabel: "Liquidity", invStatusLabel: "Status",
    invModalAnaliseTitulo: "Investment Analysis", invModalAnaliseSub: "Composition · Liquidity Ladder · Opportunity Cost",
    invGraficoComposicaoTipo: "Composition by Type", invGraficoEscadaLiquidez: "Liquidity Over Time",
    // Phase 2 — Capital Allocation Engine / Executive Simulator
    invAllocationTitulo: "Capital Allocation Engine", invAllocationSub: "Compare where to allocate the next dollar of capital",
    invRadarOportunidadesTitulo: "Opportunity Radar", invAdicionarOpcao: "Add to Comparison",
    invCategoriaLabel: "Category", invValorAlocarLabel: "Amount to Allocate", invRetornoMensalLabel: "Monthly Return %",
    invGanhoMensalLabel: "Estimated Monthly Gain/Savings ($)", invPaybackLabel: "Payback", invRiscoLabel: "Risk",
    invPrioridadeLabel: "Priority", invSemOpcoes: "Add options to compare where to allocate capital.",
    invRiscoBaixo: "Low", invRiscoMedio: "Medium", invRiscoAlto: "High", invSemPayback: "Never pays back",
    invCatCdb: "CD", invCatTesouro: "Treasury Bonds", invCatFundos: "Investment Funds", invCatDebentures: "Corporate Bonds",
    invCatExpansao: "Expansion", invCatEquipamento: "Equipment", invCatMarketing: "Marketing", invCatContratacao: "Hiring", invCatAutomacao: "Automation", invCatReducaoDivida: "Debt Reduction",
    invSimuladorTitulo: "Executive Simulator", invSimuladorSub: "Simulate the impact of decisions before making them — conservative, base, optimistic and adverse scenarios",
    invChoqueReceita: "Revenue (%)", invChoqueCustoFixo: "Fixed Cost (%)", invChoqueCustoVariavel: "Variable Cost (%)",
    invChoqueJuros: "Debt Interest (points, rate-hike effect)", invChoqueAporte: "Capital Investment ($)", invChoqueRetornoAporte: "Expected Monthly Return on Investment ($)",
    invSimular: "Simulate Scenarios", invCenarioConservador: "Conservative", invCenarioBase: "Base", invCenarioOtimista: "Optimistic", invCenarioAdverso: "Adverse",
    invLucroLiquidoMensal: "Net Profit/Month", invSaldoProjetado12m: "Cash Balance (12m)", invRunwayCritico: "Critical Runway",
    invSemRunway: "No risk of shortfall", invUsarNaSimulacao: "Simulate this scenario",
    // Simulations
    simTitulo: "Strategic Simulations", simSubtitulo: "Scenario engine connected to your real data — not a forecast, a decision intelligence tool",
    simPontoPartidaTitulo: "Starting Point (real data)", simPontoPartidaSub: "Pulled automatically from Revenue, Costs, Debt and Cash Flow",
    simReceitaMensalLabel: "Average Monthly Revenue", simCustoFixoMensalLabel: "Monthly Fixed Cost", simCustoVariavelMensalLabel: "Monthly Variable Cost",
    simDividaTotalLabel: "Total Active Debt", simCaixaDisponivelLabel: "Available Cash", simRegimeAtualLabel: "Current Tax Regime",
    simObjetivosTitulo: "Quick Objectives", simObjetivosSub: "Each button pre-fills the shocks below — deterministic rule, not generative AI",
    simObjDobrarFaturamento: "Double Revenue", simObjTriplicarLucro: "Triple Profit", simObjReduzirCustos: "Reduce Costs",
    simObjMelhorarFluxoCaixa: "Improve Cash Flow", simObjReduzirDivida: "Reduce Debt Cost",
    simPresetCrise: "Crisis Scenario", simPresetExpansao: "Expansion Scenario",
    simChoqueCambio: "FX Shock — USD (%)", simExposicaoCambial: "% of Variable Cost Indexed to USD",
    simHorizonteLabel: "Simulation Horizon (months)",
    simSimular: "Run Simulation",
    simCenariosTitulo: "Simulated Scenarios", simCenariosSub: "Conservative · Base · Optimistic · Adverse",
    simSensibilidadeTitulo: "Sensitivity Analysis", simSensibilidadeSub: "Which variable most decides your result",
    simDriverReceita: "Revenue", simDriverCustoFixo: "Fixed Cost", simDriverCustoVariavel: "Variable Cost",
    simDriverJuros: "Debt Interest", simDriverCambio: "FX (USD)",
    simFavoravel: "Favorable", simDesfavoravel: "Unfavorable", simPeso: "Risk Weight",
    simMonteCarloTitulo: "Monte Carlo Simulation", simMonteCarloSub: "Thousands of random scenarios within the limits you set",
    simProbLucroPositivo: "Probability of Positive Profit", simProbRupturaCaixa: "Probability of Cash Shortfall",
    simFaixaLucroP10P90: "Monthly Profit Range (P10–P90)", simFaixaCaixaP10P90: "Cash Balance Range (P10–P90)",
    simIteracoes: "simulated iterations", simMediana: "Median",
    simTributarioTitulo: "Impact by Tax Regime", simTributarioSub: "Same simulated scenario, compared across 3 regimes",
    simRegimeSimples: "Simples Nacional", simRegimePresumido: "Presumed Profit", simRegimeReal: "Actual Profit",
    simImpostoMensalLabel: "Estimated Monthly Tax", simLucroLiquidoRegimeLabel: "Net Profit under Regime", simRegimeAtualTag: "current regime", simRegimeMelhorTag: "best in scenario",
    simConselhoTitulo: "Executive Advisory", simConselhoSub: "Summary, risks, opportunities and action plan — rule-generated, not generative AI (see transparency note)",
    simResumoLabel: "Executive Summary", simRiscosLabel: "Key Risks", simOportunidadesLabel: "Key Opportunities",
    simPremissasLabel: "Assumptions Used", simLimitacoesLabel: "Limitations of this Projection", simNivelConfiancaLabel: "Confidence Level",
    simPlanoAcaoLabel: "Recommended Action Plan",
    simConfiancaBaixo: "Low", simConfiancaMedio: "Medium", simConfiancaAlto: "High",
    simLimitacoesTexto: "Deterministic/probabilistic projection based on your registered data and the shocks entered. Does not account for events outside the model (e.g. sudden regulatory change) nor guarantee a future outcome.",
    simTransparenciaTexto: "This analysis is 100% rule-based and built from your company's real numbers — no text here was generated by a language model.",
    simPremissaReceita: "Monthly revenue considered", simPremissaCustoFixo: "Monthly fixed cost considered", simPremissaCustoVariavel: "Monthly variable cost considered",
    simPremissaChoque: "Shock tested in the base scenario",
    simPlanoAcaoRevisarCusto: "Review the most sensitive driver before committing cash to major decisions.",
    simPlanoAcaoAumentarReserva: "Increase your cash reserve before acting on this scenario — the simulated shortfall probability is above a comfortable level.",
    simPlanoAcaoAproveitarOportunidade: "The optimistic scenario shows a meaningful profit gain — worth detailing what needs to hold true to get there.",
    simPlanoAcaoManterMonitorando: "No critical risk detected in this scenario — keep tracking the real indicators month by month.",
    simSemDados: "Register Revenue, Fixed Costs and Variable Costs so the simulation engine can use real data as a starting point.",
    simUsarPreset: "Load into this simulator",
    // Pricing / Value Engineering
    prcTitulo: "Pricing", prcSubtitulo: "Value Engineering Center — price is a consequence of intelligence, not a starting point",
    prcIppaTitulo: "IPPA — Axioma Pricing Power Index", prcIppaSub: "0 to 1000 — the higher, the less the company depends on discounts to sell",
    prcNivelCritico: "Critical", prcNivelAtencao: "Attention", prcNivelBom: "Good", prcNivelExcelente: "Excellent",
    prcSubMargem: "Margin", prcSubDependenciaDesconto: "Discount Dependency", prcSubConcentracao: "Revenue Concentration", prcSubEstabilidade: "Revenue Stability", prcSubCompetitividade: "Competitiveness",
    prcRadarTitulo: "Opportunity Radar", prcRadarSub: "Products that need attention now",
    prcTipoDestroiMargem: "Destroys Margin", prcTipoSubprecificado: "Underpriced", prcTipoSobreprecificado: "Overpriced", prcTipoPremium: "Premium", prcTipoSustentaCaixa: "Cash Backbone",
    prcMotorTitulo: "Value-Based Pricing Engine", prcMotorSub: "See the real impact of a new price before applying it",
    prcPrecoAtualLabel: "Current Price", prcPrecoCandidatoLabel: "Candidate Price", prcUnidadesVendidasLabel: "Units Sold/Month",
    prcImpactoReceitaLabel: "Revenue Impact", prcImpactoLucroLabel: "Net Profit Impact", prcImpactoEbitdaLabel: "EBITDA Impact", prcImpactoTributarioLabel: "Tax Impact", prcMargemNovaLabel: "New Contribution Margin",
    prcAplicarPreco: "Apply This Price",
    prcDescontoTitulo: "Discount Engineering", prcDescontoSub: "See the impact before granting any discount",
    prcDescontoPctLabel: "Discount (%)", prcLimiteMaximoLabel: "Healthy Maximum Limit", prcDentroLimite: "Within the healthy limit", prcForaLimite: "Above the limit — direct loss per unit",
    prcConcorrentesTitulo: "Competitive Intelligence", prcConcorrentesSub: "Manual entry — automatic price and positioning comparison",
    prcConcorrenteNomeLabel: "Competitor Name", prcConcorrentePrecoLabel: "Competitor Price", prcConcorrentePosicionamentoLabel: "Positioning",
    prcAdicionarConcorrente: "Add Competitor", prcSemConcorrentes: "No competitors registered for this product yet.",
    prcWarRoomTitulo: "War Room — Strategic Simulation", prcWarRoomSub: "Reuses the Simulations engine — pick a war scenario and see the real impact",
    prcCenarioConcorrenteReduz: "Competitor Cuts Price", prcCenarioConcorrenteAumenta: "Competitor Raises Price", prcCenarioInflacao: "Inflation Spike", prcCenarioSelic: "Interest Rate Hike", prcCenarioCambio: "FX Shock",
    prcCenarioCrise: "Economic Crisis", prcCenarioMudancaTributaria: "Tax Change", prcCenarioNovoConcorrente: "New Competitor", prcCenarioExplosaoDemanda: "Demand Surge", prcCenarioQuedaVendas: "Sales Drop", prcCenarioMudancaFornecedores: "Supplier Change",
    prcPainelEspecialistasTitulo: "Specialist Panel", prcPainelEspecialistasSub: "Rule-based analysis — not generative AI yet (see transparency note)",
    prcEspecialistaCFO: "CFO", prcEspecialistaTributario: "Tax Specialist", prcEspecialistaComercial: "Commercial/Pricing Specialist", prcEspecialistaRisco: "Risk Specialist", prcEspecialistaAnalista: "Financial Analyst",
    prcRecomendacaoConsolidadaTitulo: "Consolidated Recommendation",
    prcElasticidadeTitulo: "Price Elasticity", prcElasticidadeDadosInsuficientes: "Insufficient data — record at least 3 price changes for this product to calculate real elasticity.",
    prcMemoriaTitulo: "Strategic Memory", prcMemoriaSub: "Every pricing decision logged, with the real outcome checked later",
    prcDecisaoAnteriorLabel: "Previous Price", prcDecisaoNovaLabel: "New Price", prcMotivoLabel: "Decision Reason", prcResultadoEsperadoLabel: "Expected Outcome", prcResultadoRealLabel: "Actual Outcome",
    prcRegistrarDecisao: "Log Decision", prcSemDecisoes: "No decisions logged yet.",
    prcNenhumProduto: "Register products for the Value Engineering Center to calculate everything automatically.",
    prcTransparenciaTexto: "The Specialist Panel and Consolidated Recommendation are 100% rule-generated from your real data — no text here was generated by a language model yet.",
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
    // Inversiones
    invPainelExecutivo: "Panel Ejecutivo", invPatrimonioTotal: "Patrimonio Total", invCaixaDisponivel: "Caja Disponible",
    invCapitalInvestido: "Capital Invertido", invCapitalOcioso: "Capital Ocioso", invLiquidezImediata: "Liquidez Inmediata",
    invLiquidezProjetada: "Liquidez Proyectada (12m)", invRentabilidadeConsolidada: "Rentabilidad Neta Media",
    invRentabilidadeAnualizada: "Rentabilidad Anualizada", invExposicaoRisco: "Exposición al Riesgo", invDiversificacao: "Diversificación",
    invScoreTitulo: "Score de Inversión", invScoreCritico: "Crítico", invScoreAtencao: "Atención", invScoreBom: "Bueno", invScoreExcelente: "Excelente",
    invIndicadoresMacro: "Indicadores de Mercado (Banco Central)", invSelic: "Selic", invCdi: "CDI", invIpca: "IPCA 12m", invDolar: "Dólar (PTAX)",
    invFonteBcb: "Fuente: Banco Central de Brasil (SGS), en tiempo real", invFonteFallback: "API del Banco Central no disponible — usando referencia aproximada",
    invCustoOportunidadeTitulo: "Costo de Oportunidad vs Deuda", invSemOportunidade: "Ninguna inversión líquida rinde hoy menos que su deuda más cara.",
    invEscadaLiquidezTitulo: "Escalera de Liquidez", invRadarRiscoTitulo: "Radar de Riesgos",
    invRiscoConcentracaoTipo: "Concentración por Tipo", invRiscoConcentracaoInstituicao: "Concentración por Institución",
    invRiscoLiquidez: "Liquidez", invRiscoIliquidezEndividada: "Deuda vs Capacidad", invRiscoVolatilidade: "Volatilidad (Renta Variable/Cripto)",
    invConselhoTitulo: "Consejo CFO", invSemGatilho: "Ninguna recomendación crítica ahora — cartera bajo control.",
    invSemDados: "Ninguna inversión registrada — agregue una para activar la inteligencia de asignación de capital.",
    invTipoRendaFixa: "Renta Fija", invTipoRendaVariavel: "Renta Variable", invTipoCriptomoeda: "Criptomoneda", invTipoImovel: "Inmueble", invTipoOutro: "Otro",
    invLiquidezDiaria: "Diaria", invLiquidezCurtoPrazo: "Corto Plazo", invLiquidezLongoPrazo: "Largo Plazo", invLiquidezNoVencimento: "Al Vencimiento",
    invStatusAtivo: "Activo", invStatusResgatado: "Rescatado",
    invInstituicaoLabel: "Institución", invVencimentoLabel: "Vencimiento (rescate)", invIndexadorLabel: "Índice", invLiquidezLabel: "Liquidez", invStatusLabel: "Estado",
    invModalAnaliseTitulo: "Análisis de Inversiones", invModalAnaliseSub: "Composición · Escalera de Liquidez · Costo de Oportunidad",
    invGraficoComposicaoTipo: "Composición por Tipo", invGraficoEscadaLiquidez: "Liquidez a lo Largo del Tiempo",
    // Fase 2 — Capital Allocation Engine / Simulador Ejecutivo
    invAllocationTitulo: "Capital Allocation Engine", invAllocationSub: "Compare dónde asignar el próximo real de capital",
    invRadarOportunidadesTitulo: "Radar de Oportunidades", invAdicionarOpcao: "Agregar a la Comparación",
    invCategoriaLabel: "Categoría", invValorAlocarLabel: "Valor a Asignar", invRetornoMensalLabel: "Retorno % mensual",
    invGanhoMensalLabel: "Ganancia/Ahorro Mensual Estimado (R$)", invPaybackLabel: "Payback", invRiscoLabel: "Riesgo",
    invPrioridadeLabel: "Prioridad", invSemOpcoes: "Agregue opciones para comparar dónde asignar capital.",
    invRiscoBaixo: "Bajo", invRiscoMedio: "Medio", invRiscoAlto: "Alto", invSemPayback: "No se recupera",
    invCatCdb: "CDB", invCatTesouro: "Tesoro Directo", invCatFundos: "Fondos de Inversión", invCatDebentures: "Debentures",
    invCatExpansao: "Expansión", invCatEquipamento: "Equipamiento", invCatMarketing: "Marketing", invCatContratacao: "Contratación", invCatAutomacao: "Automatización", invCatReducaoDivida: "Reducción de Deuda",
    invSimuladorTitulo: "Simulador Ejecutivo", invSimuladorSub: "Simule el impacto de decisiones antes de tomarlas — escenarios conservador, base, optimista y adverso",
    invChoqueReceita: "Ingresos (%)", invChoqueCustoFixo: "Costo Fijo (%)", invChoqueCustoVariavel: "Costo Variable (%)",
    invChoqueJuros: "Intereses de la Deuda (puntos, efecto Selic)", invChoqueAporte: "Aporte de Capital (R$)", invChoqueRetornoAporte: "Retorno Mensual Esperado del Aporte (R$)",
    invSimular: "Simular Escenarios", invCenarioConservador: "Conservador", invCenarioBase: "Base", invCenarioOtimista: "Optimista", invCenarioAdverso: "Adverso",
    invLucroLiquidoMensal: "Utilidad Neta/Mes", invSaldoProjetado12m: "Saldo de Caja (12m)", invRunwayCritico: "Runway Crítico",
    invSemRunway: "Sin riesgo de ruptura", invUsarNaSimulacao: "Simular este escenario",
    // Simulaciones
    simTitulo: "Simulaciones Estratégicas", simSubtitulo: "Motor de escenarios conectado a sus datos reales — no es un pronóstico, es inteligencia de decisión",
    simPontoPartidaTitulo: "Punto de Partida (datos reales)", simPontoPartidaSub: "Extraído automáticamente de Ingresos, Costos, Deudas y Flujo de Caja",
    simReceitaMensalLabel: "Ingreso Mensual Promedio", simCustoFixoMensalLabel: "Costo Fijo Mensual", simCustoVariavelMensalLabel: "Costo Variable Mensual",
    simDividaTotalLabel: "Deuda Total Activa", simCaixaDisponivelLabel: "Caja Disponible", simRegimeAtualLabel: "Régimen Tributario Actual",
    simObjetivosTitulo: "Objetivos Rápidos", simObjetivosSub: "Cada botón precompleta los choques abajo — regla determinística, no es IA generativa",
    simObjDobrarFaturamento: "Duplicar Facturación", simObjTriplicarLucro: "Triplicar Utilidad", simObjReduzirCustos: "Reducir Costos",
    simObjMelhorarFluxoCaixa: "Mejorar Flujo de Caja", simObjReduzirDivida: "Reducir Costo de la Deuda",
    simPresetCrise: "Escenario de Crisis", simPresetExpansao: "Escenario de Expansión",
    simChoqueCambio: "Choque Cambiario — Dólar (%)", simExposicaoCambial: "% del Costo Variable Indexado al Dólar",
    simHorizonteLabel: "Horizonte de Simulación (meses)",
    simSimular: "Ejecutar Simulación",
    simCenariosTitulo: "Escenarios Simulados", simCenariosSub: "Conservador · Base · Optimista · Adverso",
    simSensibilidadeTitulo: "Análisis de Sensibilidad", simSensibilidadeSub: "Qué variable decide más su resultado",
    simDriverReceita: "Ingresos", simDriverCustoFixo: "Costo Fijo", simDriverCustoVariavel: "Costo Variable",
    simDriverJuros: "Intereses de la Deuda", simDriverCambio: "Cambio (Dólar)",
    simFavoravel: "Favorable", simDesfavoravel: "Desfavorable", simPeso: "Peso en el Riesgo",
    simMonteCarloTitulo: "Simulación Monte Carlo", simMonteCarloSub: "Miles de escenarios aleatorios dentro de los límites que usted definió",
    simProbLucroPositivo: "Probabilidad de Utilidad Positiva", simProbRupturaCaixa: "Probabilidad de Ruptura de Caja",
    simFaixaLucroP10P90: "Rango de Utilidad Mensual (P10–P90)", simFaixaCaixaP10P90: "Rango de Saldo de Caja (P10–P90)",
    simIteracoes: "iteraciones simuladas", simMediana: "Mediana",
    simTributarioTitulo: "Impacto por Régimen Tributario", simTributarioSub: "Mismo escenario simulado, comparado en los 3 regímenes",
    simRegimeSimples: "Simples Nacional", simRegimePresumido: "Utilidad Presunta", simRegimeReal: "Utilidad Real",
    simImpostoMensalLabel: "Impuesto Mensual Estimado", simLucroLiquidoRegimeLabel: "Utilidad Neta en el Régimen", simRegimeAtualTag: "régimen actual", simRegimeMelhorTag: "mejor en el escenario",
    simConselhoTitulo: "Consejo Ejecutivo", simConselhoSub: "Resumen, riesgos, oportunidades y plan de acción — generado por reglas, no por IA generativa (ver nota de transparencia)",
    simResumoLabel: "Resumen Ejecutivo", simRiscosLabel: "Principales Riesgos", simOportunidadesLabel: "Principales Oportunidades",
    simPremissasLabel: "Premisas Utilizadas", simLimitacoesLabel: "Limitaciones de esta Proyección", simNivelConfiancaLabel: "Nivel de Confianza",
    simPlanoAcaoLabel: "Plan de Acción Recomendado",
    simConfiancaBaixo: "Bajo", simConfiancaMedio: "Medio", simConfiancaAlto: "Alto",
    simLimitacoesTexto: "Proyección determinística/probabilística basada en los datos registrados y los choques ingresados. No considera eventos fuera del modelo (ej. cambio regulatorio súbito) ni garantiza un resultado futuro.",
    simTransparenciaTexto: "Este análisis es 100% basado en reglas y en los números reales de su empresa — ningún texto aquí fue generado por un modelo de lenguaje.",
    simPremissaReceita: "Ingreso mensual considerado", simPremissaCustoFixo: "Costo fijo mensual considerado", simPremissaCustoVariavel: "Costo variable mensual considerado",
    simPremissaChoque: "Choque probado en el escenario base",
    simPlanoAcaoRevisarCusto: "Revisar la variable más sensible antes de comprometer caja en decisiones grandes.",
    simPlanoAcaoAumentarReserva: "Aumentar la reserva de caja antes de ejecutar este escenario — la probabilidad de ruptura simulada está por encima de un nivel cómodo.",
    simPlanoAcaoAproveitarOportunidade: "El escenario optimista muestra una ganancia relevante de utilidad — vale la pena detallar qué debe cumplirse para llegar allí.",
    simPlanoAcaoManterMonitorando: "No se detectó ningún riesgo crítico en este escenario — siga monitoreando los indicadores reales mes a mes.",
    simSemDados: "Registre Ingresos, Costos Fijos y Costos Variables para que el motor de simulación use datos reales como punto de partida.",
    simUsarPreset: "Cargar en este simulador",
    // Precios / Ingeniería de Valor
    prcTitulo: "Precios", prcSubtitulo: "Centro de Ingeniería de Valor — el precio es consecuencia de la inteligencia, no un punto de partida",
    prcIppaTitulo: "IPPA — Índice de Poder de Precificación Axioma", prcIppaSub: "0 a 1000 — cuanto más alto, menos depende la empresa del descuento para vender",
    prcNivelCritico: "Crítico", prcNivelAtencao: "Atención", prcNivelBom: "Bueno", prcNivelExcelente: "Excelente",
    prcSubMargem: "Margen", prcSubDependenciaDesconto: "Dependencia de Descuento", prcSubConcentracao: "Concentración de Ingresos", prcSubEstabilidade: "Estabilidad de Ingresos", prcSubCompetitividade: "Competitividad",
    prcRadarTitulo: "Radar de Oportunidades", prcRadarSub: "Productos que necesitan atención ahora",
    prcTipoDestroiMargem: "Destruye Margen", prcTipoSubprecificado: "Subprecificado", prcTipoSobreprecificado: "Sobreprecificado", prcTipoPremium: "Premium", prcTipoSustentaCaixa: "Sostiene la Caja",
    prcMotorTitulo: "Motor de Precificación por Valor", prcMotorSub: "Vea el impacto real de un nuevo precio antes de aplicarlo",
    prcPrecoAtualLabel: "Precio Actual", prcPrecoCandidatoLabel: "Precio Candidato", prcUnidadesVendidasLabel: "Unidades Vendidas/Mes",
    prcImpactoReceitaLabel: "Impacto en Ingresos", prcImpactoLucroLabel: "Impacto en la Utilidad Neta", prcImpactoEbitdaLabel: "Impacto en el EBITDA", prcImpactoTributarioLabel: "Impacto Tributario", prcMargemNovaLabel: "Nuevo Margen de Contribución",
    prcAplicarPreco: "Aplicar Este Precio",
    prcDescontoTitulo: "Ingeniería de Descuentos", prcDescontoSub: "Vea el impacto antes de conceder cualquier descuento",
    prcDescontoPctLabel: "Descuento (%)", prcLimiteMaximoLabel: "Límite Máximo Saludable", prcDentroLimite: "Dentro del límite saludable", prcForaLimite: "Por encima del límite — pérdida directa por unidad",
    prcConcorrentesTitulo: "Inteligencia Competitiva", prcConcorrentesSub: "Registro manual — comparación automática de precio y posicionamiento",
    prcConcorrenteNomeLabel: "Nombre del Competidor", prcConcorrentePrecoLabel: "Precio del Competidor", prcConcorrentePosicionamentoLabel: "Posicionamiento",
    prcAdicionarConcorrente: "Agregar Competidor", prcSemConcorrentes: "Ningún competidor registrado para este producto aún.",
    prcWarRoomTitulo: "War Room — Simulación Estratégica", prcWarRoomSub: "Reutiliza el motor de Simulaciones — elija un escenario de guerra y vea el impacto real",
    prcCenarioConcorrenteReduz: "Competidor Reduce Precio", prcCenarioConcorrenteAumenta: "Competidor Aumenta Precio", prcCenarioInflacao: "Alza de la Inflación", prcCenarioSelic: "Alza de la Tasa de Interés", prcCenarioCambio: "Choque Cambiario",
    prcCenarioCrise: "Crisis Económica", prcCenarioMudancaTributaria: "Cambio Tributario", prcCenarioNovoConcorrente: "Nuevo Competidor", prcCenarioExplosaoDemanda: "Explosión de Demanda", prcCenarioQuedaVendas: "Caída de Ventas", prcCenarioMudancaFornecedores: "Cambio de Proveedores",
    prcPainelEspecialistasTitulo: "Panel de Especialistas", prcPainelEspecialistasSub: "Análisis basado en reglas determinísticas — todavía no es IA generativa (ver nota de transparencia)",
    prcEspecialistaCFO: "CFO", prcEspecialistaTributario: "Especialista Tributario", prcEspecialistaComercial: "Especialista Comercial/Pricing", prcEspecialistaRisco: "Especialista en Riesgos", prcEspecialistaAnalista: "Analista Financiero",
    prcRecomendacaoConsolidadaTitulo: "Recomendación Consolidada",
    prcElasticidadeTitulo: "Elasticidad de Precio", prcElasticidadeDadosInsuficientes: "Datos insuficientes — registre al menos 3 cambios de precio para este producto para calcular elasticidad real.",
    prcMemoriaTitulo: "Memoria Estratégica", prcMemoriaSub: "Cada decisión de precio registrada, con el resultado real verificado después",
    prcDecisaoAnteriorLabel: "Precio Anterior", prcDecisaoNovaLabel: "Precio Nuevo", prcMotivoLabel: "Motivo de la Decisión", prcResultadoEsperadoLabel: "Resultado Esperado", prcResultadoRealLabel: "Resultado Real",
    prcRegistrarDecisao: "Registrar Decisión", prcSemDecisoes: "Ninguna decisión registrada aún.",
    prcNenhumProduto: "Registre productos para que el Centro de Ingeniería de Valor calcule todo automáticamente.",
    prcTransparenciaTexto: "El Panel de Especialistas y la Recomendación Consolidada se generan 100% por reglas a partir de sus datos reales — ningún texto aquí fue generado por un modelo de lenguaje todavía.",
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

// ═══════════════════════════════════════════════════════════════
// INVESTIMENTOS — NARRATIVAS (custo de oportunidade, caixa ocioso,
// concentração, comparação com CDI). Sempre citando o número real.
// ═══════════════════════════════════════════════════════════════
export function montarNarrativaCustoOportunidade(lang: string, o: OportunidadeResgate): string {
  if (lang === "en") return `"${o.investimentoNome}" yields ${fPct(o.rentabilidadeLiquidaAA)}/yr net while "${o.dividaDescricao}" costs ${fPct(o.taxaJurosAAEquivalente)}/yr — redeeming and paying it off saves about ${fBRL(o.economiaMensalEstimada)}/month.`;
  if (lang === "es") return `"${o.investimentoNome}" rinde ${fPct(o.rentabilidadeLiquidaAA)}/año neto mientras "${o.dividaDescricao}" cuesta ${fPct(o.taxaJurosAAEquivalente)}/año — rescatar y pagarla ahorra cerca de ${fBRL(o.economiaMensalEstimada)}/mes.`;
  return `"${o.investimentoNome}" rende ${fPct(o.rentabilidadeLiquidaAA)}/ano líquido enquanto "${o.dividaDescricao}" custa ${fPct(o.taxaJurosAAEquivalente)}/ano — resgatar e quitar economiza cerca de ${fBRL(o.economiaMensalEstimada)}/mês.`;
}

export function montarNarrativaCaixaOcioso(lang: string, valor: number, custoOportunidadeMensal: number): string {
  if (lang === "en") return `${fBRL(valor)} sits idle above a healthy operating buffer. Investing it at the current CDI could earn about ${fBRL(custoOportunidadeMensal)}/month.`;
  if (lang === "es") return `${fBRL(valor)} está ocioso por encima de una reserva operativa saludable. Invertirlo al CDI actual podría rendir cerca de ${fBRL(custoOportunidadeMensal)}/mes.`;
  return `${fBRL(valor)} está parado acima de uma reserva operacional saudável. Investir isso no CDI atual poderia render cerca de ${fBRL(custoOportunidadeMensal)}/mês.`;
}

export function montarNarrativaConcentracaoInvestimento(lang: string, pct: number, tipo: string): string {
  if (lang === "en") return `${fPct(pct)} of your portfolio is concentrated in ${tipo}. Diversifying reduces exposure to a single asset class.`;
  if (lang === "es") return `${fPct(pct)} de su cartera está concentrado en ${tipo}. Diversificar reduce la exposición a una sola clase de activo.`;
  return `${fPct(pct)} da sua carteira está concentrado em ${tipo}. Diversificar reduz a exposição a uma única classe de ativo.`;
}

export function montarNarrativaAbaixoCDI(lang: string, rentabilidadeLiquidaAA: number, cdiAtual: number): string {
  if (lang === "en") return `Your average net return (${fPct(rentabilidadeLiquidaAA)}/yr) is below the current CDI (${fPct(cdiAtual)}/yr) — review underperforming allocations.`;
  if (lang === "es") return `Su rentabilidad neta media (${fPct(rentabilidadeLiquidaAA)}/año) está por debajo del CDI actual (${fPct(cdiAtual)}/año) — revise las asignaciones de bajo rendimiento.`;
  return `Sua rentabilidade líquida média (${fPct(rentabilidadeLiquidaAA)}/ano) está abaixo do CDI atual (${fPct(cdiAtual)}/ano) — revise as alocações de baixo desempenho.`;
}

export function montarConselhoInvestimento(lang: string, g: GatilhoConselhoInvestimento): string {
  if (g.tipo === "resgatarEQuitar") return montarNarrativaCustoOportunidade(lang, g.oportunidade);
  if (g.tipo === "caixaOcioso") return montarNarrativaCaixaOcioso(lang, g.valor, g.custoOportunidadeMensal);
  if (g.tipo === "concentracaoAlta") return montarNarrativaConcentracaoInvestimento(lang, g.pct, g.tipoConcentrado);
  return montarNarrativaAbaixoCDI(lang, g.rentabilidadeLiquidaAA, g.cdiAtual);
}

// ═══════════════════════════════════════════════════════════════
// CAPITAL ALLOCATION ENGINE / SIMULADOR EXECUTIVO — NARRATIVAS
// ═══════════════════════════════════════════════════════════════
const NOME_CATEGORIA_ALOCACAO: Record<CategoriaAlocacao, keyof CfoTextos> = {
  cdb: "invCatCdb", tesouro: "invCatTesouro", fundos: "invCatFundos", debentures: "invCatDebentures",
  expansao: "invCatExpansao", equipamento: "invCatEquipamento", marketing: "invCatMarketing",
  contratacao: "invCatContratacao", automacao: "invCatAutomacao", reducao_divida: "invCatReducaoDivida",
};

export function nomeCategoriaAlocacao(lang: string, categoria: CategoriaAlocacao): string {
  return cfoT(lang)[NOME_CATEGORIA_ALOCACAO[categoria]] as string;
}

export function montarNarrativaAlocacao(lang: string, r: ResultadoAlocacao): string {
  const cx = cfoT(lang);
  const nome = nomeCategoriaAlocacao(lang, r.categoria);
  const paybackTxt = r.paybackMeses !== null ? `${r.paybackMeses}m` : cx.invSemPayback;
  if (lang === "en") return `${nome}: ${fBRL(r.retornoMensalRS)}/month, ${r.retornoLiquidoVsCapitalMensal >= 0 ? "above" : "below"} the cost of capital (${fPct(r.custoCapitalAnualPct)}/yr) — payback ${paybackTxt}.`;
  if (lang === "es") return `${nome}: ${fBRL(r.retornoMensalRS)}/mes, ${r.retornoLiquidoVsCapitalMensal >= 0 ? "por encima" : "por debajo"} del costo de capital (${fPct(r.custoCapitalAnualPct)}/año) — payback ${paybackTxt}.`;
  return `${nome}: ${fBRL(r.retornoMensalRS)}/mês, ${r.retornoLiquidoVsCapitalMensal >= 0 ? "acima" : "abaixo"} do custo de capital (${fPct(r.custoCapitalAnualPct)}/ano) — payback ${paybackTxt}.`;
}

export function montarNarrativaCenario(lang: string, r: ResultadoCenario): string {
  if (lang === "en") return `Monthly net profit of ${fBRL(r.lucroLiquidoMensal)}, cash balance of ${fBRL(r.saldoCaixaProjetado)} after 12 months${r.runwayMeses !== null ? `, critical runway in ${r.runwayMeses} months if this holds` : ""}.`;
  if (lang === "es") return `Utilidad neta mensual de ${fBRL(r.lucroLiquidoMensal)}, saldo de caja de ${fBRL(r.saldoCaixaProjetado)} después de 12 meses${r.runwayMeses !== null ? `, runway crítico en ${r.runwayMeses} meses si esto se mantiene` : ""}.`;
  return `Lucro líquido mensal de ${fBRL(r.lucroLiquidoMensal)}, saldo de caixa de ${fBRL(r.saldoCaixaProjetado)} após 12 meses${r.runwayMeses !== null ? `, runway crítico em ${r.runwayMeses} meses se isso se mantiver` : ""}.`;
}

// ═══════════════════════════════════════════════════════════════
// SIMULAÇÕES — ANÁLISE DE SENSIBILIDADE / MONTE CARLO / CONSELHO EXECUTIVO
// ═══════════════════════════════════════════════════════════════
const NOME_DRIVER_SENSIBILIDADE: Record<DriverSensibilidade, keyof CfoTextos> = {
  receita: "simDriverReceita", custoFixo: "simDriverCustoFixo", custoVariavel: "simDriverCustoVariavel",
  juros: "simDriverJuros", cambio: "simDriverCambio",
};

export function nomeDriverSensibilidade(lang: string, driver: DriverSensibilidade): string {
  return cfoT(lang)[NOME_DRIVER_SENSIBILIDADE[driver]] as string;
}

export function montarNarrativaSensibilidade(lang: string, impactos: ImpactoSensibilidade[]): string {
  if (impactos.length === 0) return "";
  const top = impactos[0];
  const nome = nomeDriverSensibilidade(lang, top.driver);
  if (lang === "en") return `Your result is most sensitive to ${nome}: monthly net profit swings between ${fBRL(top.impactoDesfavoravelRS)} (unfavorable) and ${fBRL(top.impactoFavoravelRS)} (favorable) — ${fPct(top.pesoPct)} of the simulated risk weight.`;
  if (lang === "es") return `Su resultado es más sensible a ${nome}: la utilidad neta mensual varía entre ${fBRL(top.impactoDesfavoravelRS)} (desfavorable) y ${fBRL(top.impactoFavoravelRS)} (favorable) — ${fPct(top.pesoPct)} del peso de riesgo simulado.`;
  return `Seu resultado é mais sensível a ${nome}: o lucro líquido mensal varia entre ${fBRL(top.impactoDesfavoravelRS)} (desfavorável) e ${fBRL(top.impactoFavoravelRS)} (favorável) — ${fPct(top.pesoPct)} do peso de risco simulado.`;
}

export function montarNarrativaMonteCarlo(lang: string, mc: ResultadoMonteCarlo): string {
  if (lang === "en") return `Across ${mc.iteracoes.toLocaleString("en-US")} simulated scenarios, ${fPct(mc.probabilidadeLucroPositivoPct)} resulted in positive profit and ${fPct(mc.probabilidadeRupturaCaixaPct)} pointed to a cash shortfall within the horizon. Expected monthly profit range: ${fBRL(mc.lucroLiquidoP10)} to ${fBRL(mc.lucroLiquidoP90)} (median ${fBRL(mc.lucroLiquidoP50)}).`;
  if (lang === "es") return `En ${mc.iteracoes.toLocaleString("es-ES")} escenarios simulados, ${fPct(mc.probabilidadeLucroPositivoPct)} resultaron en utilidad positiva y ${fPct(mc.probabilidadeRupturaCaixaPct)} indicaron ruptura de caja dentro del horizonte. Rango de utilidad mensual esperado: ${fBRL(mc.lucroLiquidoP10)} a ${fBRL(mc.lucroLiquidoP90)} (mediana ${fBRL(mc.lucroLiquidoP50)}).`;
  return `Em ${mc.iteracoes.toLocaleString("pt-BR")} cenários simulados, ${fPct(mc.probabilidadeLucroPositivoPct)} resultaram em lucro positivo e ${fPct(mc.probabilidadeRupturaCaixaPct)} indicaram ruptura de caixa dentro do horizonte. Faixa de lucro mensal esperada: ${fBRL(mc.lucroLiquidoP10)} a ${fBRL(mc.lucroLiquidoP90)} (mediana ${fBRL(mc.lucroLiquidoP50)}).`;
}

export function montarNarrativaRiscoRuptura(lang: string, probabilidadeRupturaCaixaPct: number): string {
  if (lang === "en") return `In ${fPct(probabilidadeRupturaCaixaPct)} of the simulated scenarios, cash goes negative within the horizon — build a larger buffer before committing to this plan.`;
  if (lang === "es") return `En ${fPct(probabilidadeRupturaCaixaPct)} de los escenarios simulados, la caja queda negativa dentro del horizonte — construya un colchón mayor antes de comprometerse con este plan.`;
  return `Em ${fPct(probabilidadeRupturaCaixaPct)} dos cenários simulados, o caixa fica negativo dentro do horizonte — construa uma reserva maior antes de se comprometer com esse plano.`;
}

export function montarNarrativaOportunidadeCenario(lang: string, lucroBase: number, lucroOtimista: number): string {
  const ganhoPct = lucroBase !== 0 ? ((lucroOtimista - lucroBase) / Math.abs(lucroBase)) * 100 : 0;
  if (lang === "en") return `In the optimistic scenario, monthly net profit reaches ${fBRL(lucroOtimista)} (vs. ${fBRL(lucroBase)} in the base scenario) — a potential gain of ${fPct(ganhoPct)}.`;
  if (lang === "es") return `En el escenario optimista, la utilidad neta mensual llega a ${fBRL(lucroOtimista)} (vs. ${fBRL(lucroBase)} en el escenario base) — una ganancia potencial de ${fPct(ganhoPct)}.`;
  return `No cenário otimista, o lucro líquido mensal chega a ${fBRL(lucroOtimista)} (vs. ${fBRL(lucroBase)} no cenário base) — um ganho potencial de ${fPct(ganhoPct)}.`;
}

export function montarNarrativaRegimeTributario(lang: string, nomeRegime: string, economiaMensal: number): string {
  if (economiaMensal <= 0) {
    if (lang === "en") return `Under this simulated scenario, your current tax regime remains the most favorable — no switch needed.`;
    if (lang === "es") return `En este escenario simulado, su régimen tributario actual sigue siendo el más favorable — no es necesario cambiar.`;
    return `Nesse cenário simulado, seu regime tributário atual continua o mais favorável — nenhuma troca é necessária.`;
  }
  if (lang === "en") return `Under this simulated scenario, ${nomeRegime} yields the highest net profit — about ${fBRL(economiaMensal)}/month more than your current regime.`;
  if (lang === "es") return `En este escenario simulado, ${nomeRegime} genera la mayor utilidad neta — cerca de ${fBRL(economiaMensal)}/mes más que su régimen actual.`;
  return `Nesse cenário simulado, ${nomeRegime} gera o maior lucro líquido — cerca de ${fBRL(economiaMensal)}/mês a mais que seu regime atual.`;
}

// ═══════════════════════════════════════════════════════════════
// PRECIFICAÇÃO / ENGENHARIA DE VALOR — NARRATIVAS
// ═══════════════════════════════════════════════════════════════
const NOME_TIPO_OPORTUNIDADE_PRECIFICACAO: Record<TipoOportunidadePrecificacao, keyof CfoTextos> = {
  destroiMargem: "prcTipoDestroiMargem", subprecificado: "prcTipoSubprecificado", sobreprecificado: "prcTipoSobreprecificado",
  premium: "prcTipoPremium", sustentaCaixa: "prcTipoSustentaCaixa",
};

export function nomeTipoOportunidadePrecificacao(lang: string, tipo: TipoOportunidadePrecificacao): string {
  return cfoT(lang)[NOME_TIPO_OPORTUNIDADE_PRECIFICACAO[tipo]] as string;
}

export function montarNarrativaOportunidadePrecificacao(lang: string, o: OportunidadePrecificacao): string {
  const nome = `"${o.nome}"`;
  if (lang === "en") {
    if (o.tipo === "destroiMargem") return `${nome} has negative margin (${fPct(o.margemPct)}) — every unit sold loses money.`;
    if (o.tipo === "subprecificado") return `${nome} has margin well below your portfolio average (${fPct(o.margemPct)}) — likely room to raise price.`;
    if (o.tipo === "sobreprecificado") return `${nome} is priced well above the registered competitor — risk of losing sales on price alone.`;
    if (o.tipo === "premium") return `${nome} sustains a high margin (${fPct(o.margemPct)}) without being priced above the competition — genuine pricing power.`;
    return `${nome} accounts for a large share of monthly revenue — protect it before changing its price.`;
  }
  if (lang === "es") {
    if (o.tipo === "destroiMargem") return `${nome} tiene margen negativo (${fPct(o.margemPct)}) — cada unidad vendida genera pérdida.`;
    if (o.tipo === "subprecificado") return `${nome} tiene margen muy por debajo del promedio de su cartera (${fPct(o.margemPct)}) — probablemente hay espacio para subir el precio.`;
    if (o.tipo === "sobreprecificado") return `${nome} está muy por encima del competidor registrado — riesgo de perder ventas solo por precio.`;
    if (o.tipo === "premium") return `${nome} sostiene un margen alto (${fPct(o.margemPct)}) sin estar por encima de la competencia — poder de precificación genuino.`;
    return `${nome} representa una gran parte de los ingresos mensuales — protéjalo antes de cambiar su precio.`;
  }
  if (o.tipo === "destroiMargem") return `${nome} está com margem negativa (${fPct(o.margemPct)}) — cada unidade vendida dá prejuízo.`;
  if (o.tipo === "subprecificado") return `${nome} está com margem bem abaixo da média da sua carteira (${fPct(o.margemPct)}) — provável espaço pra subir o preço.`;
  if (o.tipo === "sobreprecificado") return `${nome} está bem acima do concorrente cadastrado — risco de perder venda só pelo preço.`;
  if (o.tipo === "premium") return `${nome} sustenta margem alta (${fPct(o.margemPct)}) sem estar acima da concorrência — poder de precificação genuíno.`;
  return `${nome} representa uma fatia grande da receita mensal — proteja-o antes de mexer no preço.`;
}

export function montarNarrativaImpactoPreco(lang: string, impacto: ImpactoPreco, precoAtual: number, precoCandidato: number): string {
  if (lang === "en") return `Moving from ${fBRL(precoAtual)} to ${fBRL(precoCandidato)}: net profit ${impacto.deltaLucroLiquidoEmpresa >= 0 ? "grows" : "shrinks"} by ${fBRL(Math.abs(impacto.deltaLucroLiquidoEmpresa))}/month, new contribution margin ${fPct(impacto.margemContribuicaoPct)}.`;
  if (lang === "es") return `Al pasar de ${fBRL(precoAtual)} a ${fBRL(precoCandidato)}: la utilidad neta ${impacto.deltaLucroLiquidoEmpresa >= 0 ? "crece" : "cae"} ${fBRL(Math.abs(impacto.deltaLucroLiquidoEmpresa))}/mes, nuevo margen de contribución ${fPct(impacto.margemContribuicaoPct)}.`;
  return `Ao sair de ${fBRL(precoAtual)} para ${fBRL(precoCandidato)}: o lucro líquido ${impacto.deltaLucroLiquidoEmpresa >= 0 ? "cresce" : "cai"} ${fBRL(Math.abs(impacto.deltaLucroLiquidoEmpresa))}/mês, nova margem de contribuição ${fPct(impacto.margemContribuicaoPct)}.`;
}

export function montarNarrativaImpactoDesconto(lang: string, impacto: ImpactoDesconto, descontoPct: number): string {
  if (!impacto.dentroDoLimite) {
    if (lang === "en") return `${fPct(descontoPct)} discount goes past the healthy limit (${fPct(impacto.limiteMaximoSaudavelPct)}) — you'd be selling below direct cost.`;
    if (lang === "es") return `Un descuento de ${fPct(descontoPct)} pasa el límite saludable (${fPct(impacto.limiteMaximoSaudavelPct)}) — estaría vendiendo por debajo del costo directo.`;
    return `Um desconto de ${fPct(descontoPct)} passa do limite saudável (${fPct(impacto.limiteMaximoSaudavelPct)}) — você estaria vendendo abaixo do custo direto.`;
  }
  if (lang === "en") return `${fPct(descontoPct)} discount stays within the healthy limit (up to ${fPct(impacto.limiteMaximoSaudavelPct)}) — monthly profit impact of ${fBRL(impacto.impactoLucroMensal)}.`;
  if (lang === "es") return `Un descuento de ${fPct(descontoPct)} se mantiene dentro del límite saludable (hasta ${fPct(impacto.limiteMaximoSaudavelPct)}) — impacto mensual en la utilidad de ${fBRL(impacto.impactoLucroMensal)}.`;
  return `Um desconto de ${fPct(descontoPct)} fica dentro do limite saudável (até ${fPct(impacto.limiteMaximoSaudavelPct)}) — impacto mensal no lucro de ${fBRL(impacto.impactoLucroMensal)}.`;
}

export function montarNarrativaElasticidade(lang: string, e: ElasticidadeEstimada): string {
  if (!e.temDadosSuficientes) {
    if (lang === "en") return `Not enough price-change history yet (${e.amostras}/3 needed) — showing no elasticity estimate instead of guessing.`;
    if (lang === "es") return `Aún no hay suficiente historial de cambios de precio (${e.amostras}/3 necesarios) — no se muestra una estimación en lugar de adivinar.`;
    return `Ainda não há histórico suficiente de mudanças de preço (${e.amostras}/3 necessárias) — sem estimativa de elasticidade em vez de chutar um número.`;
  }
  const el = e.elasticidadePct ?? 0;
  if (lang === "en") return `Based on ${e.amostras} real price changes: each 1% price increase moves volume by about ${el.toFixed(1)}%.`;
  if (lang === "es") return `Basado en ${e.amostras} cambios de precio reales: cada 1% de aumento de precio mueve el volumen en cerca de ${el.toFixed(1)}%.`;
  return `Baseado em ${e.amostras} mudanças de preço reais: cada 1% de aumento no preço move o volume em cerca de ${el.toFixed(1)}%.`;
}

export function montarNarrativaIPPA(lang: string, ippa: IPPA): string {
  const pior = [...ippa.subscores].sort((a, b) => a.valor - b.valor)[0];
  const NOME: Record<string, { pt: string; en: string; es: string }> = {
    margem: { pt: "margem abaixo do saudável", en: "below-healthy margin", es: "margen por debajo de lo saludable" },
    dependenciaDesconto: { pt: "dependência de desconto", en: "discount dependency", es: "dependencia de descuentos" },
    concentracao: { pt: "concentração de receita em poucos produtos", en: "revenue concentration in few products", es: "concentración de ingresos en pocos productos" },
    estabilidade: { pt: "instabilidade de receita", en: "revenue instability", es: "inestabilidad de ingresos" },
    competitividade: { pt: "preço sistematicamente abaixo da concorrência", en: "price systematically below competitors", es: "precio sistemáticamente por debajo de la competencia" },
  };
  const fator = NOME[pior.chave]?.[lang as "pt" | "en" | "es"] || NOME[pior.chave]?.pt || pior.chave;
  if (lang === "en") return `Score ${ippa.total}/1000 — the biggest drag right now is ${fator}.`;
  if (lang === "es") return `Puntaje ${ippa.total}/1000 — el mayor freno ahora mismo es ${fator}.`;
  return `Nota ${ippa.total}/1000 — o maior freio agora é ${fator}.`;
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