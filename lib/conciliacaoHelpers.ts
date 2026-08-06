// 🦅 AXIOMA AI.TECH — Motor de Conciliação do Open Finance (Fase 2A, Peça 1)
// Determinístico, por REGRA. Zero IA, zero token. Recebe dados já carregados
// (transações do extrato + receitas + custos variáveis da empresa) e devolve
// os 3 baldes (conciliado/pendente/atípico) + os KPIs executivos — sempre
// calculado na hora, nunca armazenado, pra nunca ficar desatualizado se um
// lançamento for editado depois.

import { detectarAnomaliasHistoricas, normalizarTexto, type Lancamento } from "./cfoCore";

export const JANELA_DIAS_CONCILIACAO = 3;
export const JANELA_DIAS_DUPLICIDADE = 2;
export const MIN_HISTORICO_DEBITO_NOVO = 30;
export const MAX_ATIPICOS_DESTAQUE = 10;
const TOLERANCIA_VALOR = 0.01;

export type TipoTransacao = "entrada" | "saida";

export type TransacaoOF = {
  id: string;
  item_id: string;
  account_id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  categoria: string;
  data: string; // ISO YYYY-MM-DD
  pluggy_transaction_id: string | null;
  lancamento_id: string | null;
  lancamento_tabela: "receitas" | "custos_variaveis" | null;
};

export type LancamentoConciliavel = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
};

export type BaldeConciliacao = "conciliado" | "pendente" | "atipico";
export type MotivoAtipico = "duplicidade" | "fora_padrao" | "debito_novo";

export type CandidatoLancamento = LancamentoConciliavel & { diffDias: number };

export type TransacaoClassificada = TransacaoOF & {
  balde: BaldeConciliacao;
  lancamentoCasado?: LancamentoConciliavel | null;
  candidatos?: CandidatoLancamento[];
  motivoAtipico?: MotivoAtipico | null;
  categoriaSugerida?: string | null;
};

function diffDias(dataA: string, dataB: string): number {
  const a = new Date(dataA + "T00:00:00").getTime();
  const b = new Date(dataB + "T00:00:00").getTime();
  return Math.round(Math.abs(a - b) / 86400000);
}

function valorBate(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCIA_VALOR;
}

// ============================================================================
// CASAMENTO 1:1 — bipartido por unicidade mútua. Uma transação só casa
// automaticamente com um lançamento se: (a) esse é o ÚNICO lançamento
// candidato pra ela, E (b) ela é a ÚNICA transação candidata pra esse
// lançamento. Sem essa dupla checagem, duas transações de R$50 na mesma
// semana poderiam "roubar" o mesmo lançamento de R$50 cada uma vendo, cada
// uma isoladamente, só 1 candidato — e ainda assim estariam competindo pelo
// mesmo lançamento. Ambíguo nos dois lados = fica pendente, nunca concilia
// no escuro (conciliação silenciosa errada é pior que pendência honesta).
// ============================================================================
export function parearTransacoesComLancamentos(
  transacoes: TransacaoOF[],
  lancamentosDisponiveis: LancamentoConciliavel[]
): {
  casadas: Map<string, { lancamento: LancamentoConciliavel; diffDias: number }>;
  ambiguas: Map<string, CandidatoLancamento[]>;
} {
  const edgesPorTx = new Map<string, CandidatoLancamento[]>();
  const txsPorLancamento = new Map<string, string[]>();

  transacoes.forEach((tx) => {
    const candidatos = lancamentosDisponiveis
      .filter((l) => valorBate(l.valor, tx.valor) && diffDias(l.data, tx.data) <= JANELA_DIAS_CONCILIACAO)
      .map((l) => ({ ...l, diffDias: diffDias(l.data, tx.data) }))
      .sort((a, b) => a.diffDias - b.diffDias);
    if (candidatos.length > 0) {
      edgesPorTx.set(tx.id, candidatos);
      candidatos.forEach((c) => {
        const lista = txsPorLancamento.get(c.id) || [];
        lista.push(tx.id);
        txsPorLancamento.set(c.id, lista);
      });
    }
  });

  const casadas = new Map<string, { lancamento: LancamentoConciliavel; diffDias: number }>();
  const ambiguas = new Map<string, CandidatoLancamento[]>();

  edgesPorTx.forEach((candidatos, txId) => {
    const unicoLadoLancamento = (txsPorLancamento.get(candidatos[0].id) || []).length === 1;
    if (candidatos.length === 1 && unicoLadoLancamento) {
      casadas.set(txId, { lancamento: candidatos[0], diffDias: candidatos[0].diffDias });
    } else {
      ambiguas.set(txId, candidatos);
    }
  });

  return { casadas, ambiguas };
}

// Sugere categoria olhando o histórico REAL da própria empresa (receitas ou
// custos variáveis já lançados com descrição parecida) — nunca um dicionário
// genérico. Sem histórico parecido, devolve null (usuário escolhe).
export function sugerirCategoriaPorHistorico(descricaoTransacao: string, historico: LancamentoConciliavel[]): string | null {
  const termo = normalizarTexto(descricaoTransacao || "");
  if (!termo) return null;
  const contagem = new Map<string, number>();
  historico.forEach((l) => {
    const termoLanc = normalizarTexto(l.descricao || "");
    if (!termoLanc || !l.categoria) return;
    if (termo.includes(termoLanc) || termoLanc.includes(termo)) {
      contagem.set(l.categoria, (contagem.get(l.categoria) || 0) + 1);
    }
  });
  let melhor: string | null = null;
  let max = 0;
  contagem.forEach((n, cat) => { if (n > max) { max = n; melhor = cat; } });
  return melhor;
}

// Cobrança duplicada: mesmo valor + mesma descrição normalizada em até
// JANELA_DIAS_DUPLICIDADE dias — sinal clássico de cobrança em duplicidade
// (maquininha, débito automático repetido).
export function detectarCobrancaDuplicada(transacoes: TransacaoOF[]): Set<string> {
  const flagged = new Set<string>();
  const saidas = transacoes.filter((t) => t.tipo === "saida");
  for (let i = 0; i < saidas.length; i++) {
    for (let j = i + 1; j < saidas.length; j++) {
      const a = saidas[i], b = saidas[j];
      if (
        valorBate(a.valor, b.valor) &&
        normalizarTexto(a.descricao) === normalizarTexto(b.descricao) &&
        normalizarTexto(a.descricao) !== "" &&
        diffDias(a.data, b.data) <= JANELA_DIAS_DUPLICIDADE
      ) {
        flagged.add(a.id);
        flagged.add(b.id);
      }
    }
  }
  return flagged;
}

// Débito novo nunca visto — só entra em jogo quando já existe histórico
// suficiente (anti-fadiga da primeira importação: sem histórico, TUDO é
// "inédito", e isso encheria o balde Atípico de falso alarme logo na
// primeira sincronização). Sem histórico suficiente, a regra fica desligada
// e a transação segue pro fluxo normal (Pendente).
export function detectarDebitosNovosNuncaVistos(
  transacoesPeriodo: TransacaoOF[],
  descricoesHistoricasSaidas: Set<string>,
  totalHistoricoSaidas: number
): Set<string> {
  if (totalHistoricoSaidas < MIN_HISTORICO_DEBITO_NOVO) return new Set();
  const flagged = new Set<string>();
  transacoesPeriodo
    .filter((t) => t.tipo === "saida")
    .forEach((t) => {
      const termo = normalizarTexto(t.descricao);
      if (termo && !descricoesHistoricasSaidas.has(termo)) flagged.add(t.id);
    });
  return flagged;
}

// Valor fora do padrão histórico da categoria — reaproveita
// detectarAnomaliasHistoricas() do cfoCore (mesma fórmula usada no resto do
// sistema: último valor > 1,4x a média do próprio grupo), sem inventar novo
// cálculo. Compara cada transação com o histórico de lançamentos de
// descrição igual.
export function detectarForaDoPadrao(transacoesPeriodo: TransacaoOF[], historicoLancamentos: LancamentoConciliavel[]): Set<string> {
  const flagged = new Set<string>();
  transacoesPeriodo.forEach((tx) => {
    const termo = normalizarTexto(tx.descricao);
    if (!termo) return;
    const historicoMesmoGrupo = historicoLancamentos.filter((l) => normalizarTexto(l.descricao || "") === termo);
    if (historicoMesmoGrupo.length < 2) return;
    const itens: Lancamento[] = [
      ...historicoMesmoGrupo.map((l) => ({ valor: l.valor, data: l.data, descricao: l.descricao, categoria: l.categoria })),
      { valor: tx.valor, data: tx.data, descricao: tx.descricao, categoria: tx.categoria },
    ];
    const anomalias = detectarAnomaliasHistoricas(itens);
    const bateComATransacao = anomalias.some((a) => valorBate(a.valorAtual, tx.valor) && normalizarTexto(a.descricao) === termo);
    if (bateComATransacao) flagged.add(tx.id);
  });
  return flagged;
}

export type ResultadoClassificacao = {
  conciliadas: TransacaoClassificada[];
  pendentes: TransacaoClassificada[];
  atipicas: TransacaoClassificada[];
};

export function classificarTransacoes(params: {
  transacoes: TransacaoOF[];
  receitas: LancamentoConciliavel[];
  custosVariaveis: LancamentoConciliavel[];
  descricoesHistoricasSaidas: Set<string>;
  totalHistoricoSaidas: number;
}): ResultadoClassificacao {
  const { transacoes, receitas, custosVariaveis, descricoesHistoricasSaidas, totalHistoricoSaidas } = params;

  const jaVinculados = new Set(
    transacoes.filter((t) => t.lancamento_id && t.lancamento_tabela).map((t) => `${t.lancamento_tabela}:${t.lancamento_id}`)
  );

  const semVinculo = transacoes.filter((t) => !t.lancamento_id);
  const entradas = semVinculo.filter((t) => t.tipo === "entrada");
  const saidas = semVinculo.filter((t) => t.tipo === "saida");

  const receitasDisponiveis = receitas.filter((r) => !jaVinculados.has(`receitas:${r.id}`));
  const custosDisponiveis = custosVariaveis.filter((c) => !jaVinculados.has(`custos_variaveis:${c.id}`));

  const { casadas: casadasEntrada, ambiguas: ambiguasEntrada } = parearTransacoesComLancamentos(entradas, receitasDisponiveis);
  const { casadas: casadasSaida, ambiguas: ambiguasSaida } = parearTransacoesComLancamentos(saidas, custosDisponiveis);

  const duplicadas = detectarCobrancaDuplicada(semVinculo);
  const debitosNovos = detectarDebitosNovosNuncaVistos(saidas, descricoesHistoricasSaidas, totalHistoricoSaidas);
  const foraDoPadrao = detectarForaDoPadrao(semVinculo, [...receitas, ...custosVariaveis]);

  const conciliadas: TransacaoClassificada[] = [];
  const pendentesTemp: TransacaoClassificada[] = [];
  const atipicasTemp: TransacaoClassificada[] = [];

  const historicoPorTipo = (tipo: TipoTransacao) => (tipo === "entrada" ? receitas : custosVariaveis);

  transacoes.forEach((tx) => {
    if (tx.lancamento_id && tx.lancamento_tabela) {
      const fonte = tx.lancamento_tabela === "receitas" ? receitas : custosVariaveis;
      const lancamento = fonte.find((l) => l.id === tx.lancamento_id) || null;
      conciliadas.push({ ...tx, balde: "conciliado", lancamentoCasado: lancamento });
      return;
    }

    const casado = tx.tipo === "entrada" ? casadasEntrada.get(tx.id) : casadasSaida.get(tx.id);
    if (casado) {
      conciliadas.push({ ...tx, balde: "conciliado", lancamentoCasado: casado.lancamento });
      return;
    }

    const ambiguo = tx.tipo === "entrada" ? ambiguasEntrada.get(tx.id) : ambiguasSaida.get(tx.id);
    if (ambiguo) {
      pendentesTemp.push({
        ...tx, balde: "pendente", candidatos: ambiguo,
        categoriaSugerida: sugerirCategoriaPorHistorico(tx.descricao, historicoPorTipo(tx.tipo)),
      });
      return;
    }

    let motivo: MotivoAtipico | null = null;
    if (duplicadas.has(tx.id)) motivo = "duplicidade";
    else if (foraDoPadrao.has(tx.id)) motivo = "fora_padrao";
    else if (debitosNovos.has(tx.id)) motivo = "debito_novo";

    if (motivo) {
      atipicasTemp.push({ ...tx, balde: "atipico", motivoAtipico: motivo });
      return;
    }

    pendentesTemp.push({
      ...tx, balde: "pendente",
      categoriaSugerida: sugerirCategoriaPorHistorico(tx.descricao, historicoPorTipo(tx.tipo)),
    });
  });

  // Anti-fadiga: no máximo MAX_ATIPICOS_DESTAQUE, priorizando maior valor —
  // mesma lógica do letreiro do Cockpit (prioriza e limita, nunca spamma).
  // O resto some do Atípico mas não desaparece: vira Pendente honesto.
  atipicasTemp.sort((a, b) => Math.abs(b.valor) - Math.abs(a.valor));
  const atipicas = atipicasTemp.slice(0, MAX_ATIPICOS_DESTAQUE);
  const rebaixadas: TransacaoClassificada[] = atipicasTemp.slice(MAX_ATIPICOS_DESTAQUE).map((t) => ({
    ...t, balde: "pendente", motivoAtipico: null,
    categoriaSugerida: sugerirCategoriaPorHistorico(t.descricao, historicoPorTipo(t.tipo)),
  }));

  return { conciliadas, pendentes: [...pendentesTemp, ...rebaixadas], atipicas };
}

// ============================================================================
// SALDO DO SISTEMA — FONTE ÚNICA. Usada pelo KPI, pelo letreiro e pelo PDF,
// sempre a mesma conta: soma de receitas com status "recebido" menos soma de
// custos variáveis, desde o início da empresa no Axioma (sem filtro de
// período — comparável 1:1 com o saldo do banco, que também é a conta
// inteira, não só um mês). Custos fixos ficam de fora de propósito: aquela
// tabela não é um livro-razão por pagamento (não tem uma linha por mês
// pago), então somar seria estimar, não somar dado real — decisão explícita
// do Elias, não uma omissão.
// ============================================================================
export function calcularSaldoSistema(receitasRecebidas: { valor: number }[], custosVariaveis: { valor: number }[]): number {
  const totalReceitas = receitasRecebidas.reduce((s, r) => s + (Number(r.valor) || 0), 0);
  const totalCustos = custosVariaveis.reduce((s, c) => s + (Number(c.valor) || 0), 0);
  return totalReceitas - totalCustos;
}

export type KPIsOpenFinance = {
  saldoBanco: number;
  saldoSistema: number;
  divergencia: number;
  dinheiroNaoExplicado: number;
  percentualConciliado: number;
};

export function calcularKPIsOpenFinance(params: {
  saldoBanco: number;
  saldoSistema: number;
  resultado: ResultadoClassificacao;
}): KPIsOpenFinance {
  const { saldoBanco, saldoSistema, resultado } = params;
  const naoConciliadas = [...resultado.pendentes, ...resultado.atipicas];
  const dinheiroNaoExplicado = naoConciliadas.filter((t) => t.tipo === "saida").reduce((s, t) => s + Math.abs(t.valor), 0);

  const todas = [...resultado.conciliadas, ...naoConciliadas];
  const totalValor = todas.reduce((s, t) => s + Math.abs(t.valor), 0);
  const valorConciliado = resultado.conciliadas.reduce((s, t) => s + Math.abs(t.valor), 0);
  const percentualConciliado = totalValor > 0 ? (valorConciliado / totalValor) * 100 : 100;

  return {
    saldoBanco, saldoSistema, divergencia: saldoBanco - saldoSistema,
    dinheiroNaoExplicado, percentualConciliado,
  };
}
