// 🦅 AXIOMA AI.TECH — Inadimplência: Centro de Inteligência de Recuperação
// Financeira (Fase 1). NÃO recadastra contas nem clientes — só agrega o que já
// existe em contas_receber/clientes (via clienteIntelHelpers.ts) e em
// cobranca_compromissos (via cobrancaHelpers.ts, já a fonte real de "status de
// negociação"). Nenhuma tabela nova nesta fase.

import type { ClienteSnapshot, ContaRow, SnapshotCarteira, ScoreAxiomaCliente, Idioma3, FaixaAging } from "./clienteIntelHelpers";
import type { CobrancaCompromisso, EtapaRegua, AlertaCobranca, CardExplicativo } from "./cobrancaHelpers";
import { detectarAlertasCobranca, gerarParecerCobranca } from "./cobrancaHelpers";

function diffDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// ============================================================================
// STATUS DA NEGOCIAÇÃO — lê cobranca_compromissos (Contas a Receber, Fase 2),
// nunca duplica valor/cliente, só referencia pelo cliente_id já existente.
// ============================================================================

export type StatusNegociacao = { compromisso: CobrancaCompromisso | null; label: string; cor: string };

export function statusNegociacaoCliente(lang: Idioma3, clienteId: string, compromissos: CobrancaCompromisso[]): StatusNegociacao {
  const doCliente = [...compromissos]
    .filter((c) => c.cliente_id === clienteId)
    .sort((a, b) => b.data_compromissada.localeCompare(a.data_compromissada));
  const atual = doCliente.find((c) => c.status === "pendente") || doCliente[0] || null;
  if (!atual) {
    return { compromisso: null, label: lang === "en" ? "No negotiation" : lang === "es" ? "Sin negociación" : "Sem negociação", cor: "#5a7a9a" };
  }
  const tipoLabel = atual.tipo === "acordo"
    ? (lang === "en" ? "Agreement" : lang === "es" ? "Acuerdo" : "Acordo")
    : (lang === "en" ? "Promise" : lang === "es" ? "Promesa" : "Promessa");
  const statusLabel = {
    pendente: lang === "en" ? "pending" : lang === "es" ? "pendiente" : "pendente",
    cumprido: lang === "en" ? "fulfilled" : lang === "es" ? "cumplido" : "cumprido",
    quebrado: lang === "en" ? "broken" : lang === "es" ? "roto" : "quebrado",
  }[atual.status];
  const cor = atual.status === "cumprido" ? "#34d399" : atual.status === "quebrado" ? "#f87171" : "#f59e0b";
  return { compromisso: atual, label: `${tipoLabel} · ${statusLabel}`, cor };
}

// ============================================================================
// PRIORIDADE DE COBRANÇA — regra determinística (score + valor exposto),
// mesmo princípio de transparência do resto do Axioma: nunca é heurística oculta.
// ============================================================================

export type NivelPrioridade = "critica" | "alta" | "media" | "baixa";
export const ORDEM_PRIORIDADE: Record<NivelPrioridade, number> = { critica: 0, alta: 1, media: 2, baixa: 3 };

export function prioridadeCobranca(nivelScore: ScoreAxiomaCliente["nivel"], valorVencido: number, valorVencidoMedio: number): NivelPrioridade {
  const altoValor = valorVencidoMedio > 0 && valorVencido >= valorVencidoMedio * 1.5;
  if (nivelScore === "critico" && altoValor) return "critica";
  if (nivelScore === "critico" || altoValor) return "alta";
  if (nivelScore === "atencao") return "media";
  return "baixa";
}

// ============================================================================
// MAPA EXECUTIVO DE RISCO — uma linha por cliente inadimplente (valorVencido > 0),
// só clientes que já estão vencidos hoje no Contas a Receber. Cada coluna citada
// no briefing mapeada pra um campo real já carregado (contas + compromissos).
// ============================================================================

export type LinhaRiscoInadimplencia = {
  s: ClienteSnapshot;
  score: ScoreAxiomaCliente;
  qtdTitulos: number;
  ultimoPagamento: string | null;
  historicoAtrasos: number;
  probabilidadeRecuperacao: number | null;
  probabilidadePerda: number | null;
  prioridade: NivelPrioridade;
  impactoFinanceiroPct: number;
  responsavel: string | null;
  negociacao: StatusNegociacao;
};

export function montarLinhasRisco(
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  compromissos: CobrancaCompromisso[],
  lang: Idioma3,
): LinhaRiscoInadimplencia[] {
  const inadimplentes = ranking.filter((r) => r.s.valorVencido > 0);
  const totalVencido = inadimplentes.reduce((s, r) => s + r.s.valorVencido, 0);
  const valorVencidoMedio = inadimplentes.length > 0 ? totalVencido / inadimplentes.length : 0;
  const hojeStr = new Date().toISOString().slice(0, 10);

  const linhas = inadimplentes.map(({ s, score }) => {
    const vencidas = s.contas.filter((c) => c.status !== "recebido" && c.data_vencimento < hojeStr);
    const recebidas = s.contas.filter((c) => c.status === "recebido" && c.data_recebimento);
    const ultimoPagamento = recebidas.length > 0 ? (recebidas.map((c) => c.data_recebimento as string).sort().slice(-1)[0]) : null;
    const historicoAtrasos = recebidas.filter((c) => (c.data_recebimento as string) > c.data_vencimento).length;

    const riscoCriterio = score.criterios.find((c) => c.chave === "risco");
    const probabilidadeRecuperacao = riscoCriterio && !riscoCriterio.semDados ? Math.round(riscoCriterio.valor as number) : null;
    const probabilidadePerda = probabilidadeRecuperacao != null ? 100 - probabilidadeRecuperacao : null;

    const impactoFinanceiroPct = totalVencido > 0 ? Math.round((s.valorVencido / totalVencido) * 1000) / 10 : 0;

    const contaMaisRelevante = [...vencidas].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0))[0];
    const responsavel = contaMaisRelevante?.responsavel || null;

    return {
      s, score,
      qtdTitulos: vencidas.length,
      ultimoPagamento,
      historicoAtrasos,
      probabilidadeRecuperacao,
      probabilidadePerda,
      prioridade: prioridadeCobranca(score.nivel, s.valorVencido, valorVencidoMedio),
      impactoFinanceiroPct,
      responsavel,
      negociacao: statusNegociacaoCliente(lang, s.cliente.id, compromissos),
    };
  });

  return linhas.sort((a, b) => ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade] || b.s.valorVencido - a.s.valorVencido);
}

// ============================================================================
// KPIs EXECUTIVOS DE RECUPERAÇÃO — cada indicador sem base real vem null
// ("sem dados suficientes" na tela), nunca um número fabricado.
// ============================================================================

export type KpisInadimplencia = {
  valorTotalInadimplente: number;
  qtdClientesInadimplentes: number;
  pctInadimplencia: number | null;
  valorRecuperadoMes: number;
  valorRecuperadoAno: number;
  valorEmNegociacao: number;
  perdaProvavel: number | null;
  dsoAjustado: number | null;
  indiceRecuperacao: number | null;
  tempoMedioRecuperacaoDias: number | null;
  receitaEmRisco: number;
  fluxoCaixaComprometidoPct: number | null;
  impactoLiquidezPct: number | null;
  impactoCapitalGiroPct: number | null;
  scoreMedioCarteiraInadimplente: number | null;
};

export function calcularKpisInadimplencia(
  contas: ContaRow[],
  carteira: SnapshotCarteira,
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  compromissos: CobrancaCompromisso[],
  dsoBase: number | null,
  caixaDisponivel: number,
): KpisInadimplencia {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().slice(0, 10);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const inicioAno = new Date(hoje.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const saldoAberto = (c: ContaRow) => Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0));
  const pendentes = contas.filter((c) => c.status !== "recebido");
  const vencidas = pendentes.filter((c) => c.data_vencimento < hojeStr);
  const valorPendenteTotal = pendentes.reduce((s, c) => s + saldoAberto(c), 0);
  const valorTotalInadimplente = vencidas.reduce((s, c) => s + saldoAberto(c), 0);
  const valorTotalCobrado = contas.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  const qtdClientesInadimplentes = carteira.clientesSnapshot.filter((s) => s.valorVencido > 0).length;
  const pctInadimplencia = valorTotalCobrado > 0 ? Math.round((valorTotalInadimplente / valorTotalCobrado) * 1000) / 10 : null;

  // Recuperado = pago DEPOIS do vencimento (era inadimplente, foi resgatado)
  const pagasComAtraso = contas.filter((c) => c.status === "recebido" && c.data_recebimento && c.data_recebimento > c.data_vencimento);
  const valorRecuperadoMes = pagasComAtraso.filter((c) => c.data_recebimento! >= inicioMes).reduce((s, c) => s + (Number(c.valor_recebido ?? c.valor) || 0), 0);
  const valorRecuperadoAno = pagasComAtraso.filter((c) => c.data_recebimento! >= inicioAno).reduce((s, c) => s + (Number(c.valor_recebido ?? c.valor) || 0), 0);

  const valorEmNegociacao = compromissos.filter((c) => c.status === "pendente").reduce((s, c) => s + (Number(c.valor_compromissado) || 0), 0);

  // Perda provável — só soma quem tem o subcritério "risco" do Score Axioma com dado real
  const comRisco = ranking.filter((r) => {
    const crit = r.score.criterios.find((c) => c.chave === "risco");
    return crit && !crit.semDados && r.s.valorVencido > 0;
  });
  const perdaProvavel = comRisco.length > 0
    ? comRisco.reduce((sum, r) => {
        const riscoValor = r.score.criterios.find((c) => c.chave === "risco")!.valor as number;
        const probPerda = clamp(100 - riscoValor, 0, 100);
        return sum + r.s.valorVencido * (probPerda / 100);
      }, 0)
    : null;

  // DSO ajustado = DSO base do Contas a Receber + atraso médio ponderado da carteira inadimplente
  const inad = carteira.clientesSnapshot.filter((s) => s.valorVencido > 0);
  const totalVInad = inad.reduce((s, x) => s + x.valorVencido, 0);
  const atrasoMedioPonderado = totalVInad > 0 ? inad.reduce((s, x) => s + x.diasAtrasoAtual * x.valorVencido, 0) / totalVInad : 0;
  const dsoAjustado = dsoBase != null ? Math.round(dsoBase + atrasoMedioPonderado) : null;

  const indiceRecuperacao = (valorRecuperadoAno + valorTotalInadimplente) > 0
    ? Math.round((valorRecuperadoAno / (valorRecuperadoAno + valorTotalInadimplente)) * 1000) / 10
    : null;

  const temposRecuperacao = pagasComAtraso.map((c) => diffDias(new Date(c.data_recebimento! + "T00:00:00"), new Date(c.data_vencimento + "T00:00:00")));
  const tempoMedioRecuperacaoDias = temposRecuperacao.length > 0
    ? Math.round(temposRecuperacao.reduce((a, b) => a + b, 0) / temposRecuperacao.length)
    : null;

  const fluxoCaixaComprometidoPct = valorPendenteTotal > 0 ? Math.round((valorTotalInadimplente / valorPendenteTotal) * 1000) / 10 : null;
  const impactoLiquidezPct = caixaDisponivel > 0 ? Math.round((valorTotalInadimplente / caixaDisponivel) * 1000) / 10 : null;
  const impactoCapitalGiroPct = carteira.valorTotalCarteira > 0 ? Math.round((valorTotalInadimplente / carteira.valorTotalCarteira) * 1000) / 10 : null;

  const rankingInad = ranking.filter((r) => r.s.valorVencido > 0);
  const scoreMedioCarteiraInadimplente = rankingInad.length > 0
    ? Math.round(rankingInad.reduce((s, r) => s + r.score.total, 0) / rankingInad.length)
    : null;

  return {
    valorTotalInadimplente, qtdClientesInadimplentes, pctInadimplencia,
    valorRecuperadoMes, valorRecuperadoAno, valorEmNegociacao, perdaProvavel,
    dsoAjustado, indiceRecuperacao, tempoMedioRecuperacaoDias,
    receitaEmRisco: valorTotalInadimplente,
    fluxoCaixaComprometidoPct, impactoLiquidezPct, impactoCapitalGiroPct,
    scoreMedioCarteiraInadimplente,
  };
}

// ============================================================================
// RECUPERADO NO PERÍODO — alimenta o Seletor de Período (padrão transversal dos
// módulos recentes) sem duplicar as métricas fixas de mês/ano acima.
// ============================================================================

export function valorRecuperadoNoPeriodo(contas: ContaRow[], inicio: string, fim: string): number {
  return contas
    .filter((c) => c.status === "recebido" && c.data_recebimento && c.data_recebimento > c.data_vencimento && c.data_recebimento >= inicio && c.data_recebimento <= fim)
    .reduce((s, c) => s + (Number(c.valor_recebido ?? c.valor) || 0), 0);
}

// ============================================================================
// RÉGUA DE RECUPERAÇÃO ESCALONADA (Fase 2) — reaproveita 100% a tabela/CRUD de
// cobranca_regua_etapas (Contas a Receber, Fase 2), só com a coluna nova
// `estagio` marcando os degraus de escalonamento. Etapas sem `estagio` continuam
// sendo os lembretes do Contas a Receber — as duas réguas convivem na mesma
// tabela sem se misturar (o filtro é feito na tela, por `estagio` presente/ausente).
// Nesta fase só monta a régua — nenhum disparo real acontece (mesma decisão já
// tomada no Contas a Receber, ver arquitetura futura no fim de cobrancaHelpers.ts).
// ============================================================================

export type EstagioEscalonamento = "amigavel" | "formal" | "protesto" | "juridico" | "negativacao";

export const ORDEM_ESTAGIO_ESCALONAMENTO: EstagioEscalonamento[] = ["amigavel", "formal", "protesto", "juridico", "negativacao"];

export const COR_ESTAGIO_ESCALONAMENTO: Record<EstagioEscalonamento, string> = {
  amigavel: "#f59e0b", formal: "#fb923c", protesto: "#f87171", juridico: "#ef4444", negativacao: "#dc2626",
};

const NOME_ESTAGIO_ESCALONAMENTO: Record<Idioma3, Record<EstagioEscalonamento, string>> = {
  pt: { amigavel: "Cobrança Amigável", formal: "Cobrança Formal", protesto: "Protesto", juridico: "Jurídico", negativacao: "Negativação" },
  en: { amigavel: "Friendly Collection", formal: "Formal Collection", protesto: "Protest", juridico: "Legal", negativacao: "Credit Blacklist" },
  es: { amigavel: "Cobro Amistoso", formal: "Cobro Formal", protesto: "Protesto", juridico: "Jurídico", negativacao: "Negativación" },
};
export function nomeEstagioEscalonamento(lang: Idioma3, e: EstagioEscalonamento): string {
  return NOME_ESTAGIO_ESCALONAMENTO[lang][e];
}

export function etapasEscalonamentoPadrao(): Omit<EtapaRegua, "id" | "user_id">[] {
  return [
    { dias_relativos: 1, canal: "whatsapp", mensagem_modelo: "Olá {cliente}, identificamos que a fatura {documento} de {valor} está em atraso. Podemos ajudar a regularizar?", ativo: true, ordem: 0, estagio: "amigavel" },
    { dias_relativos: 15, canal: "email", mensagem_modelo: "Prezado(a) {cliente}, a fatura {documento} de {valor} segue em aberto há 15 dias. Solicitamos regularização ou contato com nosso time financeiro.", ativo: true, ordem: 1, estagio: "formal" },
    { dias_relativos: 45, canal: "email", mensagem_modelo: "Aviso: a fatura {documento} de {valor}, em aberto há 45 dias, está sujeita a protesto em cartório caso não seja regularizada.", ativo: true, ordem: 2, estagio: "protesto" },
    { dias_relativos: 75, canal: "email", mensagem_modelo: "Aviso final: a fatura {documento} de {valor} será encaminhada para cobrança jurídica caso não seja regularizada em até 5 dias úteis.", ativo: true, ordem: 3, estagio: "juridico" },
    { dias_relativos: 120, canal: "email", mensagem_modelo: "A fatura {documento} de {valor}, em aberto há mais de 120 dias, será registrada em órgãos de proteção ao crédito.", ativo: true, ordem: 4, estagio: "negativacao" },
  ];
}

// ============================================================================
// ALERTAS INTELIGENTES DA INADIMPLÊNCIA (Fase 2) — reaproveita 100%
// detectarAlertasCobranca (Contas a Receber, Fase 2): mesmos 10 tipos, só tira
// "próximos vencimentos" (é preventivo, pertence ao Contas a Receber, não é
// inadimplência já instalada) e soma 2 alertas exclusivos daqui: aumento
// abrupto da inadimplência (proxy honesto via aging, sem precisar de série
// histórica que o Axioma não guarda) e prazo excessivo (>120 dias).
// ============================================================================

export function detectarAlertasInadimplencia(
  lang: Idioma3,
  carteira: SnapshotCarteira,
  contas: ContaRow[],
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  compromissos: CobrancaCompromisso[],
  aging: FaixaAging[],
): AlertaCobranca[] {
  const base = detectarAlertasCobranca(lang, carteira, contas, ranking, compromissos).filter((a) => a.tipo !== "proximos");
  const extras: AlertaCobranca[] = [];
  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);

  const totalVencido = aging.reduce((s, f) => s + f.valor, 0);
  const faixaRecente = aging.find((f) => f.chave === "d30");
  if (totalVencido > 0 && faixaRecente && faixaRecente.valor / totalVencido > 0.4) {
    const pct = Math.round((faixaRecente.valor / totalVencido) * 100);
    extras.push({
      tipo: "aumento_inadimplencia", severidade: "critico",
      titulo: lang === "en" ? "Sharp rise in new delinquency" : lang === "es" ? "Fuerte aumento de morosidad nueva" : "Grande aumento da inadimplência",
      descricao: lang === "en" ? `${pct}% of the overdue balance became delinquent in the last 30 days.` : lang === "es" ? `${pct}% del saldo vencido se volvió moroso en los últimos 30 días.` : `${pct}% do saldo vencido virou inadimplente nos últimos 30 dias.`,
      acao: lang === "en" ? "Investigate what changed — new client cohort, process failure, or market shift." : lang === "es" ? "Investigar qué cambió — nueva cohorte, falla de proceso o cambio de mercado." : "Investigar o que mudou — nova safra de clientes, falha de processo ou mercado.",
    });
  }

  ranking.forEach(({ s }) => {
    if (s.diasAtrasoAtual > 120) {
      extras.push({
        tipo: "prazo_excessivo", severidade: "critico", clienteId: s.cliente.id, clienteNome: s.cliente.nome,
        titulo: `${lang === "en" ? "Excessive delay" : lang === "es" ? "Plazo excesivo" : "Prazo excessivo"}: ${s.cliente.nome}`,
        descricao: lang === "en" ? `${s.diasAtrasoAtual} days overdue, ${fmtBRL(s.valorVencido)} exposed.` : lang === "es" ? `${s.diasAtrasoAtual} días de atraso, ${fmtBRL(s.valorVencido)} expuesto.` : `${s.diasAtrasoAtual} dias de atraso, ${fmtBRL(s.valorVencido)} exposto.`,
        acao: lang === "en" ? "Evaluate legal collection or write-off." : lang === "es" ? "Evaluar cobro jurídico o pérdida." : "Avaliar cobrança jurídica ou baixa como perda.",
      });
    }
  });

  const ORDEM: Record<AlertaCobranca["severidade"], number> = { critico: 0, atencao: 1, positivo: 2 };
  return [...base, ...extras].sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
}

// ============================================================================
// IA DE PREVENÇÃO (modo por regras, Fase 2) — reaproveita 100% gerarParecerCobranca
// (Contas a Receber, Fase 2: mesmo formato tema/oQueAconteceu/porQue/impacto/ação)
// e soma 3 cards exclusivos de prevenção. Sem chamada a LLM real — mesmo padrão
// de fallback determinístico da IA Financeira/Tributária, fio pronto pra Claude
// no dia em que a ANTHROPIC_API_KEY for ativada (decisão do Elias).
// ============================================================================

export function gerarSinaisPrevencao(
  lang: Idioma3,
  carteira: SnapshotCarteira,
  contas: ContaRow[],
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  linhasRisco: LinhaRiscoInadimplencia[],
  compromissos: CobrancaCompromisso[],
): CardExplicativo[] {
  const base = gerarParecerCobranca(lang, carteira, contas, ranking);
  const extras: CardExplicativo[] = [];
  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  const hojeStr = new Date().toISOString().slice(0, 10);
  const em15dias = new Date(); em15dias.setDate(em15dias.getDate() + 15);
  const em15diasStr = em15dias.toISOString().slice(0, 10);

  const aVencerEmBreve = (s: ClienteSnapshot) => s.contas.filter((c) => c.status !== "recebido" && c.data_vencimento >= hojeStr && c.data_vencimento <= em15diasStr);
  const emRiscoFuturo = ranking.filter(({ s, score }) => (score.nivel === "critico" || score.nivel === "atencao") && aVencerEmBreve(s).length > 0);
  if (emRiscoFuturo.length > 0) {
    const valor = emRiscoFuturo.reduce((sum, { s }) => sum + aVencerEmBreve(s).reduce((x, c) => x + (Number(c.valor) || 0), 0), 0);
    extras.push({
      tema: lang === "en" ? "Likely future delay" : lang === "es" ? "Probable atraso futuro" : "Provável atraso futuro",
      oQueAconteceu: lang === "en" ? `${emRiscoFuturo.length} client(s) with weak score have invoices due in the next 15 days.` : lang === "es" ? `${emRiscoFuturo.length} cliente(s) con score débil tienen facturas por vencer en 15 días.` : `${emRiscoFuturo.length} cliente(s) com score fraco têm cobranças vencendo nos próximos 15 dias.`,
      porQue: lang === "en" ? "Historical payment behavior of these clients suggests low on-time probability." : lang === "es" ? "El comportamiento histórico de pago sugiere baja probabilidad de pago a tiempo." : "O comportamento histórico de pagamento desses clientes sugere baixa chance de pagar em dia.",
      impacto: lang === "en" ? `${fmtBRL(valor)} at risk of becoming overdue.` : lang === "es" ? `${fmtBRL(valor)} en riesgo de volverse vencido.` : `${fmtBRL(valor)} em risco de virar vencido.`,
      acao: lang === "en" ? "Reach out before the due date, not after." : lang === "es" ? "Contactar antes del vencimiento, no después." : "Fazer contato antes do vencimento, não depois.",
    });
  }

  const porCliente = new Map<string, number>();
  compromissos.forEach((c) => { if (c.cliente_id) porCliente.set(c.cliente_id, (porCliente.get(c.cliente_id) || 0) + 1); });
  const reincidentesNegociacao = [...porCliente.entries()].filter(([, n]) => n >= 2);
  if (reincidentesNegociacao.length > 0) {
    extras.push({
      tema: lang === "en" ? "High renegotiation likelihood" : lang === "es" ? "Alta probabilidad de renegociación" : "Alta probabilidade de renegociação",
      oQueAconteceu: lang === "en" ? `${reincidentesNegociacao.length} client(s) have negotiated 2+ times before.` : lang === "es" ? `${reincidentesNegociacao.length} cliente(s) ya negociaron 2+ veces.` : `${reincidentesNegociacao.length} cliente(s) já negociaram 2 ou mais vezes.`,
      porQue: lang === "en" ? "Repeated negotiation is a pattern, not a one-off." : lang === "es" ? "La negociación repetida es un patrón, no un hecho aislado." : "Negociação repetida é um padrão, não um evento isolado.",
      impacto: lang === "en" ? "Expect another renegotiation request before full payment." : lang === "es" ? "Es probable otra solicitud de renegociación antes del pago total." : "Espere outro pedido de renegociação antes do pagamento total.",
      acao: lang === "en" ? "Consider tighter terms or upfront collateral on the next agreement." : lang === "es" ? "Considere condiciones más estrictas o garantía anticipada en el próximo acuerdo." : "Considerar condições mais rígidas ou garantia antecipada no próximo acordo.",
    });
  }

  const riscoPerda = linhasRisco.filter((l) => l.probabilidadePerda != null && l.probabilidadePerda >= 60);
  if (riscoPerda.length > 0) {
    const valor = riscoPerda.reduce((s, l) => s + l.s.valorVencido, 0);
    extras.push({
      tema: lang === "en" ? "Risk of definitive loss" : lang === "es" ? "Riesgo de pérdida definitiva" : "Risco de perda definitiva",
      oQueAconteceu: lang === "en" ? `${riscoPerda.length} client(s) with 60%+ estimated loss probability.` : lang === "es" ? `${riscoPerda.length} cliente(s) con 60%+ de probabilidad estimada de pérdida.` : `${riscoPerda.length} cliente(s) com 60%+ de probabilidade estimada de perda.`,
      porQue: lang === "en" ? "Low reliability subscore combined with active overdue balance." : lang === "es" ? "Bajo subíndice de confiabilidad combinado con saldo vencido activo." : "Subcritério de risco baixo combinado com saldo vencido ativo.",
      impacto: lang === "en" ? `${fmtBRL(valor)} at high risk of write-off.` : lang === "es" ? `${fmtBRL(valor)} en alto riesgo de pérdida.` : `${fmtBRL(valor)} em alto risco de virar perda.`,
      acao: lang === "en" ? "Escalate to legal collection or negotiate an immediate settlement." : lang === "es" ? "Escalar a cobro jurídico o negociar un acuerdo inmediato." : "Escalar para cobrança jurídica ou negociar acordo imediato.",
    });
  }

  return [...base, ...extras];
}

// ============================================================================
// RECOMENDAÇÃO DE ESTRATÉGIA POR CLIENTE (destaque da Fase 2) — regra
// determinística sobre a probabilidade de recuperação já calculada pelo Score
// Axioma do próprio cliente (nunca modelo de ML). Sem dado real de base
// (probabilidadeRecuperacao == null), não sugere nada — mesmo princípio de
// nunca inventar número do resto do Axioma.
// ============================================================================

export type EstrategiaRecuperacao = { tipo: "desconto" | "parcelamento" | "juridico"; label: string; probabilidadeEstimada: number };

export function recomendarEstrategiasRecuperacao(lang: Idioma3, linha: LinhaRiscoInadimplencia, valorVencidoMedio: number): EstrategiaRecuperacao[] {
  const base = linha.probabilidadeRecuperacao;
  if (base == null) return [];
  const descontoPct = linha.s.diasAtrasoAtual > 60 ? 15 : 10;
  const parcelas = valorVencidoMedio > 0 && linha.s.valorVencido > valorVencidoMedio * 1.5 ? 6 : 3;

  const estrategias: EstrategiaRecuperacao[] = [
    {
      tipo: "desconto",
      label: lang === "en" ? `${descontoPct}% cash discount` : lang === "es" ? `${descontoPct}% de descuento al contado` : `Desconto à vista de ${descontoPct}%`,
      probabilidadeEstimada: clamp(base + 15, 0, 95),
    },
    {
      tipo: "parcelamento",
      label: lang === "en" ? `${parcelas}x installment plan` : lang === "es" ? `Plan en ${parcelas}x` : `Parcelamento em ${parcelas}x`,
      probabilidadeEstimada: clamp(base + 25, 0, 95),
    },
  ];
  if (linha.score.nivel === "critico") {
    estrategias.push({
      tipo: "juridico",
      label: lang === "en" ? "Legal collection" : lang === "es" ? "Cobro jurídico" : "Cobrança jurídica",
      probabilidadeEstimada: clamp(base - 20, 5, 60),
    });
  }
  return estrategias.sort((a, b) => b.probabilidadeEstimada - a.probabilidadeEstimada);
}
