// 🦅 AXIOMA AI.TECH — Previsão de Caixa + Simulador Executivo + Analytics
// (Contas a Receber, Fase 3). Reaproveita o núcleo de DRE (montarDRE) e a série
// rolante (serieRolling) já existentes em cfoCore.ts, e o Score Axioma + a
// probabilidade de recebimento já criados nas Fases 1 e 2 — nada recalculado
// do zero, mesma disciplina do resto do alicerce.

import { montarDRE, serieRolling, type Lancamento } from "./cfoCore";
import type { ClienteSnapshot, SnapshotCarteira, ContaRow, ScoreAxiomaCliente, Idioma3 } from "./clienteIntelHelpers";
import { probabilidadeRecebimentoConta } from "./cobrancaHelpers";

function diffDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// ============================================================================
// PREVISÃO DE CAIXA MULTI-HORIZONTE — diferente do Fluxo de Caixa (que usa o
// valor bruto de contas_receber sem classificar confiança), aqui cada real a
// receber é classificado em previsto/provável/em risco/perdido usando o Score
// Axioma e a probabilidade de recebimento por conta já calculados. Puramente
// derivado de `contas` — atualiza sozinho a cada mudança, sem estado próprio.
// ============================================================================

export type ClassificacaoEntrada = "previsto" | "provavel" | "em_risco" | "perdido";

export function classificarEntrada(diasAtraso: number, nivel: ScoreAxiomaCliente["nivel"] | null, prob: number | null): ClassificacaoEntrada {
  if (diasAtraso > 180 || (nivel === "critico" && diasAtraso > 90)) return "perdido";
  if (nivel === "critico" || diasAtraso > 30 || (prob != null && prob < 40)) return "em_risco";
  if (diasAtraso <= 0 && ((prob != null && prob >= 75) || nivel === "excelente" || nivel === "elite")) return "previsto";
  return "provavel";
}

export type PrevisaoHorizonte = { horizonteDias: number; previsto: number; provavel: number; emRisco: number; perdido: number };

export const HORIZONTES_PADRAO = [7, 30, 60, 90, 180, 365];

export function previsaoCaixaMultiHorizonte(
  contas: ContaRow[],
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  horizontes: number[] = HORIZONTES_PADRAO,
): PrevisaoHorizonte[] {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().slice(0, 10);
  const scorePorCliente = new Map(ranking.map((r) => [r.s.cliente.id, r]));
  const pendentes = contas.filter((c) => c.status !== "recebido");

  return horizontes.map((h) => {
    const limite = new Date(hoje); limite.setDate(limite.getDate() + h);
    const limiteStr = limite.toISOString().slice(0, 10);
    const bucket: PrevisaoHorizonte = { horizonteDias: h, previsto: 0, provavel: 0, emRisco: 0, perdido: 0 };
    pendentes.filter((c) => c.data_vencimento <= limiteStr).forEach((c) => {
      const saldo = Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0));
      if (saldo <= 0) return;
      const r = c.cliente_id ? scorePorCliente.get(c.cliente_id) : undefined;
      const diasAtraso = c.data_vencimento < hojeStr ? diffDias(hoje, new Date(c.data_vencimento + "T00:00:00")) : 0;
      const prob = r ? probabilidadeRecebimentoConta(c, r.s) : null;
      const classe = classificarEntrada(diasAtraso, r?.score.nivel ?? null, prob);
      bucket[classe === "em_risco" ? "emRisco" : classe] += saldo;
    });
    return bucket;
  });
}

// ============================================================================
// SIMULADOR EXECUTIVO DE RECEBIMENTOS — reaproveita montarDRE (o núcleo real
// de Investimentos/Simulações), mas com alavancas específicas de Contas a
// Receber. Não usa simularCenariosExecutivos/ChoqueSimulador diretamente
// porque aquele vetor de choque é genérico de receita/custo/dívida, sem
// alavanca de inadimplência/DSO/antecipação — a peça reaproveitada de verdade
// é o motor de DRE em si, mesmo princípio, alavancas diferentes.
// ============================================================================

export type NomeCenarioRecebimento = "conservador" | "base" | "otimista" | "adverso";

export type AlavancasRecebimento = {
  deltaInadimplenciaPct: number;
  reducaoDsoDias: number;
  pctAntecipado: number;
  taxaDesagioAntecipacaoPct: number;
  descontoOferecidoPct: number;
};

export type BaseSimuladorRecebimento = {
  receitaMensalAtual: number; custoFixoMensalAtual: number; custoVariavelMensalAtual: number;
  despesasFinanceirasMensalAtual: number; aliquotaEfetivaPct: number; saldoCaixaAtual: number;
  valorAReceberTotal: number;
};

export type ResultadoCenarioRecebimento = {
  nome: NomeCenarioRecebimento; receitaMensal: number; ebitdaMensal: number; lucroLiquidoMensal: number;
  caixaLiberadoDso: number; saldoCaixaProjetado: number;
};

const FATOR_CENARIO: Record<NomeCenarioRecebimento, number> = { conservador: 0.5, base: 1, otimista: 1.3, adverso: 0 };

export function simularCenariosRecebimento(base: BaseSimuladorRecebimento, alav: AlavancasRecebimento): ResultadoCenarioRecebimento[] {
  const nomes: NomeCenarioRecebimento[] = ["conservador", "base", "otimista", "adverso"];
  return nomes.map((nome) => {
    const f = FATOR_CENARIO[nome];
    // "Adverso" inverte o sinal: as alavancas favoráveis (antecipação, DSO, desconto)
    // não se realizam, e a inadimplência piora 1.5x a estimativa informada —
    // mesmo espírito do cenário adverso de simularCenariosExecutivos (cfoCore.ts).
    const deltaInad = nome === "adverso" ? Math.abs(alav.deltaInadimplenciaPct) * 1.5 : alav.deltaInadimplenciaPct * f;
    const reducaoDso = alav.reducaoDsoDias * f;
    const pctAntecipado = alav.pctAntecipado * f;
    const desconto = nome === "adverso" ? alav.descontoOferecidoPct : alav.descontoOferecidoPct * f;

    const perdaInadimplencia = base.receitaMensalAtual * (deltaInad / 100);
    const custoAntecipacao = base.valorAReceberTotal * (pctAntecipado / 100) * (alav.taxaDesagioAntecipacaoPct / 100);
    const custoDesconto = base.receitaMensalAtual * (desconto / 100);
    const receitaMensal = Math.max(0, base.receitaMensalAtual - perdaInadimplencia - custoDesconto);

    const dre = montarDRE({
      receitaBruta: receitaMensal, deducoes: receitaMensal * (base.aliquotaEfetivaPct / 100),
      custoVariavel: base.custoVariavelMensalAtual, custoFixo: base.custoFixoMensalAtual,
      despesasFinanceiras: base.despesasFinanceirasMensalAtual + custoAntecipacao,
    });

    // Caixa liberado pela redução de DSO — aproximação padrão de capital de giro
    // (dias a menos de recebimento × receita diária média). Mesma honestidade do
    // resto do app: é uma aproximação financeira conhecida, não estatística inventada.
    const caixaLiberadoDso = (reducaoDso / 30) * base.receitaMensalAtual;

    return {
      nome, receitaMensal, ebitdaMensal: dre.ebitda.valor, lucroLiquidoMensal: dre.lucroLiquido.valor,
      caixaLiberadoDso, saldoCaixaProjetado: base.saldoCaixaAtual + dre.lucroLiquido.valor + caixaLiberadoDso - custoAntecipacao,
    };
  });
}

// ============================================================================
// ANTECIPAÇÃO DE RECEBÍVEIS — "você tem R$ X a receber em N dias; antecipando
// a Y% custa Z; sobra W". Cálculo direto, sem modelo, pra decisão rápida de CFO.
// ============================================================================

export type ResultadoAntecipacao = { valorBruto: number; custo: number; valorLiquido: number };

export function calcularAntecipacaoRecebiveis(valorBruto: number, taxaDesagioPct: number): ResultadoAntecipacao {
  const custo = valorBruto * (taxaDesagioPct / 100);
  return { valorBruto, custo, valorLiquido: valorBruto - custo };
}

// ============================================================================
// IMPACTO DO SPLIT PAYMENT (REFORMA TRIBUTÁRIA 2026/2027) NO CAIXA — não existe
// cálculo pronto no módulo MEI pra reaproveitar (aquela tela é conteúdo
// educativo/linha do tempo, sem fórmula de impacto no recebimento); construído
// aqui do zero, mesmo espírito de transparência. No split payment, uma fatia do
// valor pago pelo cliente (o IBS/CBS embutido no preço) é recolhida direto ao
// governo NO MOMENTO da liquidação do pagamento, em vez de cair inteira na
// conta da empresa — o caixa efetivamente recebido fica menor que o valor
// bruto da fatura. Alíquota-teste é uma estimativa pública de transição
// (Emenda Constitucional 132/2023 + LC 214/2025), não assessoria tributária —
// mesmo aviso "consulte um contador" já usado na tela de Reforma do MEI.
// ============================================================================

export type ImpactoSplitPayment = { valorRetidoEstimado: number; valorLiquidoEstimado: number; aliquotaUsadaPct: number };

export function estimarImpactoSplitPayment(valorAReceberTotal: number, aliquotaEstimadaIbsCbsPct = 12): ImpactoSplitPayment {
  const valorRetidoEstimado = valorAReceberTotal * (aliquotaEstimadaIbsCbsPct / 100);
  return { valorRetidoEstimado, valorLiquidoEstimado: valorAReceberTotal - valorRetidoEstimado, aliquotaUsadaPct: aliquotaEstimadaIbsCbsPct };
}

// ============================================================================
// PAINÉIS ANALÍTICOS — só o que dá pra derivar de dado real (contas_receber +
// clientes). "Receita por vendedor/produto" fica fora de propósito: não existe
// vínculo vendedor/produto no schema hoje (mesma honestidade já registrada em
// Clientes/Precificação pra LTV/CAC) — não fingido.
// ============================================================================

export type CelulaHeatmap = { clienteNome: string; faixa: string; valor: number };

export function heatmapInadimplencia(carteira: SnapshotCarteira, topN = 12): CelulaHeatmap[] {
  const hojeStr = new Date().toISOString().slice(0, 10);
  const faixas = ["0-30", "31-60", "61-90", "90+"];
  const clientesOrdenados = [...carteira.clientesSnapshot].filter((s) => s.valorVencido > 0).sort((a, b) => b.valorVencido - a.valorVencido).slice(0, topN);
  const out: CelulaHeatmap[] = [];
  clientesOrdenados.forEach((s) => {
    const porFaixa: Record<string, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    s.contas.filter((c) => c.status !== "recebido" && c.data_vencimento < hojeStr).forEach((c) => {
      const dias = diffDias(new Date(), new Date(c.data_vencimento + "T00:00:00"));
      const saldo = Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0));
      const chave = dias <= 30 ? "0-30" : dias <= 60 ? "31-60" : dias <= 90 ? "61-90" : "90+";
      porFaixa[chave] += saldo;
    });
    faixas.forEach((f) => out.push({ clienteNome: s.cliente.nome, faixa: f, valor: Math.round(porFaixa[f]) }));
  });
  return out;
}

export type ItemCurvaABC = { clienteId: string; nome: string; valor: number; percentual: number; percentualAcumulado: number; classe: "A" | "B" | "C" };

export function curvaABCClientes(carteira: SnapshotCarteira): ItemCurvaABC[] {
  const total = carteira.valorTotalCarteira;
  if (total <= 0) return [];
  let acumulado = 0;
  return [...carteira.clientesSnapshot].sort((a, b) => b.valorTotalCobrado - a.valorTotalCobrado).map((s) => {
    const percentual = (s.valorTotalCobrado / total) * 100;
    acumulado += percentual;
    const classe: ItemCurvaABC["classe"] = acumulado <= 80 ? "A" : acumulado <= 95 ? "B" : "C";
    return { clienteId: s.cliente.id, nome: s.cliente.nome, valor: s.valorTotalCobrado, percentual: Math.round(percentual * 10) / 10, percentualAcumulado: Math.round(acumulado * 10) / 10, classe };
  });
}

export function evolucaoCarteira(contas: ContaRow[]): { cobrado: { label: string; value: number }[]; recebido: { label: string; value: number }[] } {
  const lancCobrado: Lancamento[] = contas.map((c) => ({ valor: c.valor, data: c.data_emissao || c.data_vencimento, categoria: c.categoria || undefined, status: c.status || undefined, descricao: c.descricao }));
  const lancRecebido: Lancamento[] = contas.filter((c) => c.status === "recebido" && c.data_recebimento).map((c) => ({ valor: Number(c.valor_recebido ?? c.valor) || 0, data: c.data_recebimento as string, categoria: c.categoria || undefined, status: c.status || undefined, descricao: c.descricao }));
  return { cobrado: serieRolling(lancCobrado, 12), recebido: serieRolling(lancRecebido, 12) };
}

export type GrupoValor = { chave: string; valor: number };

function rotuloNaoInformado(lang: Idioma3): string {
  return lang === "en" ? "Not informed" : lang === "es" ? "No informado" : "Não informado";
}

export function agruparCarteiraPorCampo(carteira: SnapshotCarteira, lang: Idioma3, campo: "segmento" | "cidade" | "estado"): GrupoValor[] {
  const mapa = new Map<string, number>();
  carteira.clientesSnapshot.forEach((s) => {
    const chave = (s.cliente[campo] as string | null | undefined)?.trim() || rotuloNaoInformado(lang);
    mapa.set(chave, (mapa.get(chave) || 0) + s.valorTotalCobrado);
  });
  return [...mapa.entries()].map(([chave, valor]) => ({ chave, valor })).sort((a, b) => b.valor - a.valor);
}

export function concentracaoTopClientes(carteira: SnapshotCarteira, topN = 5): GrupoValor[] {
  return [...carteira.clientesSnapshot].sort((a, b) => b.valorTotalCobrado - a.valorTotalCobrado).slice(0, topN)
    .map((s) => ({ chave: s.cliente.nome, valor: s.valorTotalCobrado }));
}

// ============================================================================
// BENCHMARK ANÔNIMO DE INADIMPLÊNCIA DA REDE — arquitetura pronta, NÃO
// implementada agora (sem dado de outros usuários disponível/agregado hoje;
// exigiria uma tabela agregada server-side, nunca ler linha de outro user_id
// diretamente — quebraria RLS/privacidade). Quando o Axioma tiver volume de
// clientes suficiente:
// 1. Job agendado (Supabase Edge Function, roda com service_role) calcularia
//    o índice de inadimplência médio POR SETOR entre todos os usuários e
//    gravaria só o agregado anônimo numa tabela pública de benchmark
//    (ex: `benchmarks_setoriais`, que já existe no schema pra outro fim —
//    ver CONTEXTO-AXIOMA.md — reaproveitar o padrão, não duplicar).
// 2. Esta tela leria só esse agregado (nunca dado de outro user_id direto) e
//    mostraria "sua inadimplência é X% vs média do seu setor Y%".
// 3. Nenhuma tabela nova criada agora — fica documentado pra quando o volume
//    de dados da base justificar.
// ============================================================================

// ============================================================================
// INTEGRAÇÕES DA FASE 3 — status real de cada uma, sem fingir integração que
// não existe:
// - Clientes: LEITURA ATIVA (nome, segmento, cidade, estado, condição de
//   pagamento) via montarSnapshotsCarteira, desde a Fase 1.
// - DRE/Investimentos/Simulações: núcleo REAPROVEITADO (montarDRE) no
//   Simulador Executivo desta fase — mesmo motor, não uma cópia.
// - Fluxo de Caixa: sem leitura cruzada aqui de propósito — a Previsão de
//   Caixa desta fase é um produto diferente (classificada por confiança via
//   Score Axioma), não substitui nem duplica a visão de 13 semanas de lá.
// - Metas, Relatórios, IA Financeira: nenhum dos três precisa de mudança
//   nesta fase — já leem/agregam o que cada módulo expõe hoje; nenhum gancho
//   novo foi necessário.
// - Dashboard Principal: DEFERIDO por decisão consciente (aprovada com o
//   Elias) — trocar os números DEMO do Dashboard por reais é uma tarefa que
//   toca o painel inteiro (todos os módulos), não só Contas a Receber; fica
//   registrada como iniciativa própria, não implementada aqui.
// - Precificação: gancho comentado abaixo (`sugestaoCondicaoPagamento`), não
//   ativado — por decisão consciente (aprovada com o Elias), grande demais
//   pra entrar nesta fase.
//
// Gancho futuro (Precificação): cliente com score Axioma crítico/atenção
// poderia sinalizar em Precificação pra sugerir condição de pagamento mais
// curta ou preço sem desconto adicional. Assinatura pronta pra quando for
// implementado — só não é chamada de lugar nenhum ainda:
//
// export function sugestaoCondicaoPagamento(nivel: ScoreAxiomaCliente["nivel"]): string | null {
//   if (nivel === "critico") return "Sugerir pagamento à vista ou antecipado — sem prazo estendido.";
//   if (nivel === "atencao") return "Sugerir prazo padrão, sem desconto adicional.";
//   return null; // score bom/excelente/elite não precisa de tratamento diferenciado
// }
// ============================================================================
