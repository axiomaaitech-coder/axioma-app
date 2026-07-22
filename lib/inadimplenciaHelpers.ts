// 🦅 AXIOMA AI.TECH — Inadimplência: Centro de Inteligência de Recuperação
// Financeira (Fase 1). NÃO recadastra contas nem clientes — só agrega o que já
// existe em contas_receber/clientes (via clienteIntelHelpers.ts) e em
// cobranca_compromissos (via cobrancaHelpers.ts, já a fonte real de "status de
// negociação"). Nenhuma tabela nova nesta fase.

import type { ClienteSnapshot, ContaRow, SnapshotCarteira, ScoreAxiomaCliente, Idioma3, FaixaAging } from "./clienteIntelHelpers";
import type { CobrancaCompromisso, EtapaRegua, AlertaCobranca, CardExplicativo } from "./cobrancaHelpers";
import { detectarAlertasCobranca, gerarParecerCobranca } from "./cobrancaHelpers";
import { montarDRE, serieRolling, type DRE, type Lancamento } from "./cfoCore";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// ============================================================================
// SIMULADOR EXECUTIVO DE RECUPERAÇÃO (Fase 3) — reaproveita montarDRE (mesmo
// núcleo de Investimentos/Simulações/Contas a Receber), com alavancas próprias
// de recuperação de inadimplência — mesma decisão já tomada em
// previsaoRecebimentoHelpers.ts (simularCenariosRecebimento): o vetor de choque
// genérico de simularCenariosExecutivos não tem alavanca de desconto/parcela/
// juros/prazo/recuperação parcial, então a peça reaproveitada de verdade é o
// motor de DRE em si, não o simulador genérico.
// ============================================================================

export type NomeCenarioRecuperacao = "conservador" | "base" | "otimista" | "adverso";

export type AlavancasRecuperacao = {
  descontoAVistaPct: number;      // desconto oferecido pra quitação imediata
  pctAceitaParcelamento: number;  // % da carteira vencida que aceita parcelar
  reducaoJurosPct: number;        // redução nos juros/multa cobrados, facilita o acordo
  aumentoPrazoDias: number;       // dias a mais concedidos pra pagar
  pctRecuperacaoParcial: number;  // % da carteira vencida recuperada só parcialmente
  pctPerdaTotal: number;          // % da carteira vencida considerada perda definitiva
  pctAntecipado: number;          // % do valor recuperável antecipado
  taxaDesagioAntecipacaoPct: number;
};

export type BaseSimuladorRecuperacao = {
  receitaMensalAtual: number; custoFixoMensalAtual: number; custoVariavelMensalAtual: number;
  despesasFinanceirasMensalAtual: number; aliquotaEfetivaPct: number; saldoCaixaAtual: number;
  valorTotalInadimplente: number;
};

export type ResultadoCenarioRecuperacao = {
  nome: NomeCenarioRecuperacao; valorRecuperado: number; perdaAssumida: number;
  ebitdaMensal: number; lucroLiquidoMensal: number; saldoCaixaProjetado: number;
};

const FATOR_CENARIO_RECUPERACAO: Record<NomeCenarioRecuperacao, number> = { conservador: 0.5, base: 1, otimista: 1.3, adverso: 0 };

export function simularCenariosRecuperacao(base: BaseSimuladorRecuperacao, alav: AlavancasRecuperacao): ResultadoCenarioRecuperacao[] {
  const nomes: NomeCenarioRecuperacao[] = ["conservador", "base", "otimista", "adverso"];
  return nomes.map((nome) => {
    const f = FATOR_CENARIO_RECUPERACAO[nome];
    // Mais prazo concedido reduz a perda total esperada (até 10 p.p.) — cenário adverso não
    // se beneficia, mesma lógica de "alavancas favoráveis não se realizam" do Contas a Receber.
    const alivioPrazo = nome === "adverso" ? 0 : clamp((alav.aumentoPrazoDias / 30) * 2, 0, 10) * f;
    const pctPerdaTotal = clamp((nome === "adverso" ? alav.pctPerdaTotal * 1.5 : alav.pctPerdaTotal * f) - alivioPrazo, 0, 100);
    const pctRecParcial = alav.pctRecuperacaoParcial * (nome === "adverso" ? 0.5 : f);
    const pctParcelamento = alav.pctAceitaParcelamento * (nome === "adverso" ? 0.5 : f);
    const desconto = nome === "adverso" ? alav.descontoAVistaPct : alav.descontoAVistaPct * f;
    const pctAntecipado = alav.pctAntecipado * f;

    const perdaAssumida = base.valorTotalInadimplente * (pctPerdaTotal / 100);
    const baseRecuperavel = Math.max(0, base.valorTotalInadimplente - perdaAssumida);
    const valorComParcelamento = baseRecuperavel * (pctParcelamento / 100);
    const valorComRecuperacaoParcial = baseRecuperavel * (pctRecParcial / 100) * 0.6; // parcial = fração do valor original
    const valorAVista = baseRecuperavel * Math.max(0, 1 - pctParcelamento / 100 - pctRecParcial / 100);
    const custoDesconto = valorAVista * (desconto / 100);
    const valorRecuperado = Math.max(0, valorAVista - custoDesconto + valorComParcelamento + valorComRecuperacaoParcial);

    const custoAntecipacao = valorRecuperado * (pctAntecipado / 100) * (alav.taxaDesagioAntecipacaoPct / 100);
    const alivioJuros = base.despesasFinanceirasMensalAtual * (alav.reducaoJurosPct / 100) * f;

    const dre = montarDRE({
      receitaBruta: base.receitaMensalAtual, deducoes: base.receitaMensalAtual * (base.aliquotaEfetivaPct / 100),
      custoVariavel: base.custoVariavelMensalAtual, custoFixo: base.custoFixoMensalAtual,
      despesasFinanceiras: Math.max(0, base.despesasFinanceirasMensalAtual - alivioJuros) + custoAntecipacao,
    });

    return {
      nome, valorRecuperado, perdaAssumida,
      ebitdaMensal: dre.ebitda.valor, lucroLiquidoMensal: dre.lucroLiquido.valor,
      saldoCaixaProjetado: base.saldoCaixaAtual + valorRecuperado - custoAntecipacao,
    };
  });
}

// ============================================================================
// PREVISÃO DE RECUPERAÇÃO MULTI-HORIZONTE (Fase 3) — mesmo espírito de
// previsaoCaixaMultiHorizonte (Contas a Receber, Fase 3), mas aplicado só ao
// saldo já vencido, usando a probabilidade de recuperação por cliente (Fases
// 1/2). "Quando" o valor tende a ser recuperado é uma regra determinística
// sobre o nível do Score Axioma e o atraso atual — nunca uma previsão de ML.
// ============================================================================

export type ClassificacaoRecuperacao = "provavel" | "otimista" | "conservador" | "improvavel";
export const HORIZONTES_RECUPERACAO = [7, 30, 60, 90, 180, 365];

export type PrevisaoRecuperacaoHorizonte = { horizonteDias: number; provavel: number; otimista: number; conservador: number; improvavel: number };

const HORIZONTE_BASE_POR_NIVEL: Record<ScoreAxiomaCliente["nivel"], number> = { elite: 15, excelente: 20, bom: 30, atencao: 60, critico: 120 };

function classificarRecuperacao(diasAtraso: number, probRecuperacao: number | null): ClassificacaoRecuperacao {
  if (probRecuperacao == null) return "conservador"; // sem dado = nunca otimista sem base real
  if (diasAtraso > 180 || probRecuperacao < 20) return "improvavel";
  if (probRecuperacao >= 70) return "otimista";
  if (probRecuperacao >= 40) return "provavel";
  return "conservador";
}

export function previsaoRecuperacaoMultiHorizonte(linhasRisco: LinhaRiscoInadimplencia[], horizontes: number[] = HORIZONTES_RECUPERACAO): PrevisaoRecuperacaoHorizonte[] {
  return horizontes.map((h) => {
    const bucket: PrevisaoRecuperacaoHorizonte = { horizonteDias: h, provavel: 0, otimista: 0, conservador: 0, improvavel: 0 };
    linhasRisco.forEach((l) => {
      const horizonteEsperado = HORIZONTE_BASE_POR_NIVEL[l.score.nivel] + Math.min(90, l.s.diasAtrasoAtual / 2);
      if (horizonteEsperado > h) return;
      const classe = classificarRecuperacao(l.s.diasAtrasoAtual, l.probabilidadeRecuperacao);
      bucket[classe] += l.s.valorVencido;
    });
    return bucket;
  });
}

// ============================================================================
// PERDA ESPERADA / PROVISÃO PCLD (Fase 3, destaque) — por faixa de aging,
// ponderando o saldo vencido pela probabilidade de perda já calculada (Fases
// 1/2). Faixa sem nenhum cliente com dado real de risco vem null ("sem dados
// suficientes"), nunca um número fabricado.
// ============================================================================

export type PerdaEsperadaFaixa = { faixa: string; valorVencido: number; perdaEsperada: number | null };

export function perdaEsperadaPorFaixaAging(linhasRisco: LinhaRiscoInadimplencia[]): PerdaEsperadaFaixa[] {
  const faixas: { chave: string; min: number; max: number }[] = [
    { chave: "0-30", min: 0, max: 30 }, { chave: "31-60", min: 31, max: 60 },
    { chave: "61-90", min: 61, max: 90 }, { chave: "90+", min: 91, max: Infinity },
  ];
  return faixas.map(({ chave, min, max }) => {
    const doGrupo = linhasRisco.filter((l) => l.s.diasAtrasoAtual >= min && l.s.diasAtrasoAtual <= max);
    const valorVencido = doGrupo.reduce((s, l) => s + l.s.valorVencido, 0);
    const comDado = doGrupo.filter((l) => l.probabilidadePerda != null);
    const perdaEsperada = comDado.length > 0
      ? comDado.reduce((s, l) => s + l.s.valorVencido * ((l.probabilidadePerda as number) / 100), 0)
      : null;
    return { faixa: chave, valorVencido, perdaEsperada };
  });
}

// ============================================================================
// CUSTO DE COBRANÇA × VALOR RECUPERÁVEL — o Axioma não tem tabela de custo real
// de cobrança (tempo do time, taxas de cartório etc.), então o custo médio por
// título é uma PREMISSA que o usuário informa (input editável na tela, nunca
// fingido como dado real do Supabase) — mesmo princípio de transparência das
// alavancas do Simulador.
// ============================================================================

export type AvaliacaoCustoBeneficio = { linha: LinhaRiscoInadimplencia; custoEstimado: number; valorRecuperavelEstimado: number; valeAPena: boolean };

export function avaliarCustoBeneficioCobranca(linhasRisco: LinhaRiscoInadimplencia[], custoMedioPorTitulo: number): AvaliacaoCustoBeneficio[] {
  return linhasRisco.map((l) => {
    const custoEstimado = l.qtdTitulos * custoMedioPorTitulo;
    const prob = l.probabilidadeRecuperacao ?? 50; // sem dado = neutro, mesmo princípio do Score Axioma
    const valorRecuperavelEstimado = l.s.valorVencido * (prob / 100);
    return { linha: l, custoEstimado, valorRecuperavelEstimado, valeAPena: valorRecuperavelEstimado > custoEstimado };
  }).sort((a, b) => (a.valorRecuperavelEstimado - a.custoEstimado) - (b.valorRecuperavelEstimado - b.custoEstimado));
}

// ============================================================================
// INTEGRAÇÃO COM A DRE (Fase 3, destaque) — leitura + escrita controlada,
// decisão tomada com o Elias: nunca cria uma linha nova em dre_historico
// (isso é responsabilidade exclusiva da tela DRE), só ENRIQUECE uma linha do
// período atual que já exista com a coluna opcional `provisao_pcld`. Se a DRE
// ainda não salvou o período, a tela de Inadimplência só mostra o impacto
// simulado (via montarDRE) sem gravar nada — nunca falha, nunca inventa linha.
// ============================================================================

export function simularImpactoProvisaoNaDRE(
  dreBase: { receitaBruta: number; deducoes: number; custoVariavel: number; custoFixo: number; despesasFinanceiras: number },
  perdaEsperadaTotal: number,
): { dreAtual: DRE; dreComProvisao: DRE } {
  const dreAtual = montarDRE(dreBase);
  const dreComProvisao = montarDRE({ ...dreBase, despesasFinanceiras: dreBase.despesasFinanceiras + perdaEsperadaTotal });
  return { dreAtual, dreComProvisao };
}

export async function atualizarProvisaoNaDRE(userId: string, periodoInicio: string, periodoFim: string, provisaoPcld: number): Promise<{ atualizado: boolean; erro?: string }> {
  const { data: existente } = await supabase.from("dre_historico").select("id")
    .eq("user_id", userId).eq("periodo_inicio", periodoInicio).eq("periodo_fim", periodoFim).maybeSingle();
  if (!existente) return { atualizado: false };
  const { error } = await supabase.from("dre_historico").update({ provisao_pcld: provisaoPcld }).eq("id", existente.id);
  return error ? { atualizado: false, erro: error.message } : { atualizado: true };
}

// ============================================================================
// ANÁLISES EXECUTIVAS (Fase 3) — variantes escopadas só à carteira inadimplente
// dos painéis análogos já existentes pra carteira toda inteira em
// previsaoRecebimentoHelpers.ts (curvaABCClientes/evolucaoCarteira/
// agruparCarteiraPorCampo) — mesmo padrão de "gêmeo escopado" que o próprio
// código já usa entre clienteIntelHelpers.ts e previsaoRecebimentoHelpers.ts.
// heatmapInadimplencia (a única que já nasceu escopada à inadimplência) é
// reaproveitada direto da Fase 3 do Contas a Receber, sem cópia nenhuma.
// ============================================================================

export type ItemCurvaABCInadimplencia = { clienteId: string; nome: string; valor: number; percentual: number; percentualAcumulado: number; classe: "A" | "B" | "C" };

export function curvaABCInadimplencia(linhasRisco: LinhaRiscoInadimplencia[]): ItemCurvaABCInadimplencia[] {
  const total = linhasRisco.reduce((s, l) => s + l.s.valorVencido, 0);
  if (total <= 0) return [];
  let acumulado = 0;
  return [...linhasRisco].sort((a, b) => b.s.valorVencido - a.s.valorVencido).map((l) => {
    const percentual = (l.s.valorVencido / total) * 100;
    acumulado += percentual;
    const classe: ItemCurvaABCInadimplencia["classe"] = acumulado <= 80 ? "A" : acumulado <= 95 ? "B" : "C";
    return { clienteId: l.s.cliente.id, nome: l.s.cliente.nome, valor: l.s.valorVencido, percentual: Math.round(percentual * 10) / 10, percentualAcumulado: Math.round(acumulado * 10) / 10, classe };
  });
}

export function evolucaoInadimplencia(contas: ContaRow[]): { label: string; value: number }[] {
  const hojeStr = new Date().toISOString().slice(0, 10);
  // "Ficou inadimplente": venceu e (ainda não foi pago OU foi pago com atraso). Data-base é o
  // vencimento, pra responder "quanto do que venceu em cada mês virou inadimplência" — nunca
  // inventa um snapshot histórico de aging que o Axioma não guarda dia a dia.
  const lanc: Lancamento[] = contas
    .filter((c) => (c.status !== "recebido" ? c.data_vencimento < hojeStr : !!(c.data_recebimento && c.data_recebimento > c.data_vencimento)))
    .map((c) => ({ valor: Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)) || Number(c.valor) || 0, data: c.data_vencimento }));
  return serieRolling(lanc, 12);
}

type GrupoValorInad = { chave: string; valor: number };

function rotuloNaoInformadoInad(lang: Idioma3): string {
  return lang === "en" ? "Not informed" : lang === "es" ? "No informado" : "Não informado";
}

export function agruparInadimplenciaPorCampo(linhasRisco: LinhaRiscoInadimplencia[], lang: Idioma3, campo: "segmento" | "cidade" | "estado"): GrupoValorInad[] {
  const mapa = new Map<string, number>();
  linhasRisco.forEach((l) => {
    const chave = (l.s.cliente[campo] as string | null | undefined)?.trim() || rotuloNaoInformadoInad(lang);
    mapa.set(chave, (mapa.get(chave) || 0) + l.s.valorVencido);
  });
  return [...mapa.entries()].map(([chave, valor]) => ({ chave, valor })).sort((a, b) => b.valor - a.valor);
}

export function rankingMaiorRecuperacao(carteira: SnapshotCarteira, topN = 8): GrupoValorInad[] {
  return carteira.clientesSnapshot.map((s) => {
    const valorRecuperado = s.contas
      .filter((c) => c.status === "recebido" && c.data_recebimento && c.data_recebimento > c.data_vencimento)
      .reduce((sum, c) => sum + (Number(c.valor_recebido ?? c.valor) || 0), 0);
    return { chave: s.cliente.nome, valor: valorRecuperado };
  }).filter((x) => x.valor > 0).sort((a, b) => b.valor - a.valor).slice(0, topN);
}

// ============================================================================
// GANCHO FUTURO — IMPACTO DA REFORMA TRIBUTÁRIA 2026/2027 NA RECUPERAÇÃO — não
// implementado agora. Quando fizer sentido, reaproveitar estimarImpactoSplitPayment
// (lib/previsaoRecebimentoHelpers.ts) aplicado só sobre o valor recuperável
// estimado da carteira inadimplente, mesmo princípio de não duplicar cálculo:
//
// import { estimarImpactoSplitPayment } from "./previsaoRecebimentoHelpers";
// const impacto = estimarImpactoSplitPayment(valorRecuperavelEstimadoTotal);
// ============================================================================

// ============================================================================
// GANCHO FUTURO — OPEN FINANCE — não implementado agora (Pluggy segue em modo
// de teste por decisão do Elias, ver STATUS-AXIOMA.md seção 1). Quando ativo,
// a mesma ideia de conciliação já documentada em contas-receber/page.tsx
// (cruzar of_transacoes × contas_receber pendentes por valor/data/pagador,
// sempre com aprovação manual) se aplicaria também aqui, sem lógica nova.
// ============================================================================
