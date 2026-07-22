// 🦅 AXIOMA AI.TECH — Inadimplência: Centro de Inteligência de Recuperação
// Financeira (Fase 1). NÃO recadastra contas nem clientes — só agrega o que já
// existe em contas_receber/clientes (via clienteIntelHelpers.ts) e em
// cobranca_compromissos (via cobrancaHelpers.ts, já a fonte real de "status de
// negociação"). Nenhuma tabela nova nesta fase.

import type { ClienteSnapshot, ContaRow, SnapshotCarteira, ScoreAxiomaCliente, Idioma3 } from "./clienteIntelHelpers";
import type { CobrancaCompromisso } from "./cobrancaHelpers";

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
