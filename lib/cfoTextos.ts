// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — cfoTextos.ts
// Traduções da camada CFO, centralizadas. Editar aqui = muda em
// todos os módulos. NÃO substitui o LanguageContext (que segue
// alimentando os textos próprios de cada módulo). Complementar.
// Uso: const cx = cfoT(lang);  cx.mrr
// ═══════════════════════════════════════════════════════════════

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
    total: "TOTAL", visaoCFO: "Visão CFO",
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
    total: "TOTAL", visaoCFO: "CFO View",
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
    total: "TOTAL", visaoCFO: "Visión CFO",
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