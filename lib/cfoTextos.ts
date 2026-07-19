// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — cfoTextos.ts
// Traduções da camada CFO, centralizadas. Editar aqui = muda em
// todos os módulos. NÃO substitui o LanguageContext (que segue
// alimentando os textos próprios de cada módulo). Complementar.
// Uso: const cx = cfoT(lang);  cx.mrr
// ═══════════════════════════════════════════════════════════════

import { fBRL, fPct } from "./cfoCore";

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