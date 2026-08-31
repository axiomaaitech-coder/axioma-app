// 🦅 AXIOMA AI.TECH — CFO Core, Fase 1, Commit 5: Accounting Core, consumidor
// automático. De-para aprovado com o Elias em 2026-08-30:
//   AP_CREATED  → débito despesa (por categoria) / crédito Fornecedores
//                 (regime de competência: a despesa é reconhecida na hora
//                 que a conta nasce, não quando o dinheiro sai).
//   AP_PAID     → débito Fornecedores / crédito Caixa-Banco-Cartão (por
//                 forma de pagamento) — nunca toca despesa de novo, ela já
//                 foi reconhecida no AP_CREATED. Cartão de crédito credita
//                 "Cartão de Crédito a Pagar" (passivo), nunca Caixa/Banco:
//                 pagar no cartão troca uma dívida por outra, não é saída
//                 de caixa. Fatura de cartão em si fica inerte até existir
//                 evento de pagamento de fatura (não inventado agora).
//   AP_PAYMENT_REVERSED / AP_DELETED / AP_UPDATED (valor ou categoria
//   mudando) → nunca edita um lançamento existente (ledger imutável por
//                 desenho) — sempre estorna (lançamento espelho, débito/
//                 crédito invertidos) e, se for edição, lança de novo com
//                 os dados certos.
//
// PAPEL, não tipo de evento: o lançamento a estornar é encontrado pelo LADO
// em que ele mexe na conta Fornecedores (3.01) — crédito = reconhecimento
// de despesa (papel do AP_CREATED), débito = quitação (papel do AP_PAID).
// Isso é o que faz um relançamento originado por AP_UPDATED (evento
// diferente de AP_CREATED) ainda ser encontrado certo se a conta for paga
// ou excluída depois — rastrear por "quem criou" quebraria nesse caso.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { registrarLancamentoContabil, type PartidaContabilInput } from "./contabilidadeHelpers";
import { type CategoriaDespesa } from "./categoriasDespesa";
import type { OrigemEvento } from "./eventFabricHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// DE-PARA — único lugar do código que decide qual conta contábil corresponde
// a cada categoria/forma de pagamento do app. Os dois enums (categorias de
// despesa, formas de pagamento) são fechados — sem "adivinhação" nenhuma.
// ============================================================================

const CODIGO_FORNECEDORES = "3.01";

const CATEGORIA_PARA_CODIGO: Record<CategoriaDespesa, string> = {
  "Produtos": "7.01",
  "Marketing": "8.03",
  "Logística": "8.07",
  "Tecnologia": "8.06",
  "Serviços": "8.08",
  "Outros": "8.02",
};
const CODIGO_DESPESA_PADRAO = "8.02"; // categoria fora do enum conhecido — não deveria acontecer, enum é fechado

const FORMA_PAGAMENTO_PARA_CODIGO: Record<string, string> = {
  "Dinheiro": "1.01",
  "PIX": "1.02",
  "Boleto": "1.02",
  "Transferência": "1.02",
  "Cartão de Débito": "1.02",
  "Cartão de Crédito": "3.06",
};
const CODIGO_ATIVO_PADRAO = "1.02"; // forma de pagamento fora do enum conhecido

// ============================================================================
// MAPA DO PLANO DE CONTAS — resolve código → id. Busca tudo de uma vez (o
// plano tem ~45 linhas) em vez de uma query por conta.
// ============================================================================

async function mapaContasPorCodigo(empresaId: string): Promise<Record<string, string>> {
  const { data } = await supabase.from("plano_de_contas").select("id, codigo").eq("empresa_id", empresaId);
  const mapa: Record<string, string> = {};
  for (const c of (data as { id: string; codigo: string }[]) || []) mapa[c.codigo] = c.id;
  return mapa;
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================================
// ESTORNO POR PAPEL
// ============================================================================

async function estornarLancamentosPorPapel(
  empresaId: string,
  origemId: string,
  contaFornecedoresId: string,
  ladoNaFornecedores: "debito" | "credito",
  descricao: string,
): Promise<void> {
  const { data: cabecalhos, error: erroCabecalhos } = await supabase
    .from("lancamento_contabil")
    .select("id")
    .eq("empresa_id", empresaId).eq("origem_tabela", "contas_pagar").eq("origem_id", origemId)
    .is("estornado_por_id", null);
  if (erroCabecalhos) {
    reportarFalhaEscrita("lancamento_contabil", "buscar lançamentos p/ estorno automático", erroCabecalhos.message);
    return;
  }
  if (!cabecalhos || cabecalhos.length === 0) return;

  const idsCandidatos = cabecalhos.map((c) => c.id);
  const { data: partidasFornecedores, error: erroPartidas } = await supabase
    .from("lancamento_contabil_partida")
    .select("lancamento_id")
    .in("lancamento_id", idsCandidatos)
    .eq("conta_id", contaFornecedoresId).eq("tipo", ladoNaFornecedores);
  if (erroPartidas) {
    reportarFalhaEscrita("lancamento_contabil_partida", "buscar partidas p/ estorno automático", erroPartidas.message);
    return;
  }

  const idsAlvo = Array.from(new Set((partidasFornecedores || []).map((p: { lancamento_id: string }) => p.lancamento_id)));
  for (const lancamentoId of idsAlvo) {
    const { error: erroRpc } = await supabase.rpc("contabil_estornar_lancamento", {
      p_lancamento_id: lancamentoId, p_data: hojeISO(), p_descricao: descricao,
    });
    if (erroRpc) reportarFalhaEscrita("lancamento_contabil", "rpc contabil_estornar_lancamento", erroRpc.message);
  }
}

// ============================================================================
// GERADORES — um por PAPEL de lançamento, reaproveitado por mais de um
// evento (AP_UPDATED chama o mesmo gerador de reconhecimento de despesa que
// AP_CREATED usa, ao relançar).
// ============================================================================

async function gerarReconhecimentoDespesa(
  empresaId: string,
  origemId: string,
  categoria: string | null | undefined,
  valor: number,
  descricaoConta: string | null | undefined,
  dataCompetencia: string,
  centroCustoId?: string | null,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoDespesa = CATEGORIA_PARA_CODIGO[categoria as CategoriaDespesa] ?? CODIGO_DESPESA_PADRAO;
  const contaDespesaId = contas[codigoDespesa];
  const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
  if (!contaDespesaId || !contaFornecedoresId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AP_CREATED)", `código ${codigoDespesa} ou ${CODIGO_FORNECEDORES} não encontrado na empresa ${empresaId}`);
    return;
  }
  // centro_custo_id só entra na ponta de despesa — a dimensão de rateio é do
  // impacto no resultado, não de qual conta de passivo/ativo é afetada.
  const partidas: PartidaContabilInput[] = [
    { contaId: contaDespesaId, tipo: "debito", valor, centroCustoId: centroCustoId ?? null },
    { contaId: contaFornecedoresId, tipo: "credito", valor },
  ];
  const descricao = descricaoConta ? `Conta a pagar: ${descricaoConta}` : "Conta a pagar";
  const { erro } = await registrarLancamentoContabil(empresaId, dataCompetencia, descricao, partidas, {
    origemTabela: "contas_pagar", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar reconhecimento de despesa (AP_CREATED)", erro);
}

async function gerarQuitacao(
  empresaId: string,
  origemId: string,
  formaPagamento: string | null | undefined,
  valor: number,
  dataPagamento: string,
): Promise<void> {
  if (!(valor > 0)) return;
  const contas = await mapaContasPorCodigo(empresaId);
  const codigoAtivo = FORMA_PAGAMENTO_PARA_CODIGO[formaPagamento ?? ""] ?? CODIGO_ATIVO_PADRAO;
  const contaAtivoId = contas[codigoAtivo];
  const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
  if (!contaAtivoId || !contaFornecedoresId) {
    reportarFalhaEscrita("plano_de_contas", "resolver conta do de-para (AP_PAID)", `código ${codigoAtivo} ou ${CODIGO_FORNECEDORES} não encontrado na empresa ${empresaId}`);
    return;
  }
  const partidas: PartidaContabilInput[] = [
    { contaId: contaFornecedoresId, tipo: "debito", valor },
    { contaId: contaAtivoId, tipo: "credito", valor },
  ];
  const { erro } = await registrarLancamentoContabil(empresaId, dataPagamento, "Pagamento de conta a pagar", partidas, {
    origemTabela: "contas_pagar", origemId,
  });
  if (erro) reportarFalhaEscrita("lancamento_contabil", "gerar quitação (AP_PAID)", erro);
}

// ============================================================================
// CONSUMIDOR — chamado por contasPagarHelpers.ts logo depois que o evento é
// publicado com sucesso em eventos_negocio. Só trata origem "contas_pagar";
// outros módulos que um dia publicarem eventos ficam de fora até terem seu
// próprio de-para revisado (nunca improvisado aqui).
// ============================================================================

export async function processarEventoContabil(
  tipo: string,
  empresaId: string,
  origem: OrigemEvento,
  payload: Record<string, unknown>,
): Promise<void> {
  if (origem.tabela !== "contas_pagar" || !origem.id) return;
  const origemId = origem.id;

  try {
    switch (tipo) {
      case "AP_CREATED": {
        const dataCompetencia = (payload.data_emissao as string) || hojeISO();
        await gerarReconhecimentoDespesa(
          empresaId, origemId, payload.categoria as string | null,
          Number(payload.valor) || 0, payload.descricao as string | null, dataCompetencia,
          payload.centro_custo_id as string | null,
        );
        break;
      }
      case "AP_PAID": {
        const incremento = Number(payload.valor_incremento) || 0;
        await gerarQuitacao(
          empresaId, origemId, payload.forma_pagamento as string | null,
          incremento, (payload.data_pagamento as string) || hojeISO(),
        );
        break;
      }
      case "AP_PAYMENT_REVERSED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        // Papel do AP_PAID = débito em Fornecedores (quitação) — reverte todo
        // pagamento ainda não estornado, cobre também baixas parciais.
        await estornarLancamentosPorPapel(empresaId, origemId, contaFornecedoresId, "debito", "Estorno de pagamento");
        break;
      }
      case "AP_DELETED": {
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        // Papel do AP_CREATED = crédito em Fornecedores (reconhecimento) —
        // sem isto, excluir uma conta em aberto deixava despesa fantasma no Razão.
        await estornarLancamentosPorPapel(empresaId, origemId, contaFornecedoresId, "credito", "Estorno por exclusão da conta");
        break;
      }
      case "AP_UPDATED": {
        const valorMudou = payload.valor_antes != null && payload.valor_depois != null
          && Number(payload.valor_antes) !== Number(payload.valor_depois);
        const categoriaMudou = payload.categoria_antes !== undefined && payload.categoria_depois !== undefined
          && payload.categoria_antes !== payload.categoria_depois;
        if (!valorMudou && !categoriaMudou) break;
        const contas = await mapaContasPorCodigo(empresaId);
        const contaFornecedoresId = contas[CODIGO_FORNECEDORES];
        if (!contaFornecedoresId) break;
        await estornarLancamentosPorPapel(empresaId, origemId, contaFornecedoresId, "credito", "Estorno por edição (valor/categoria alterados)");
        const dataCompetencia = (payload.data_emissao_depois as string) || hojeISO();
        await gerarReconhecimentoDespesa(
          empresaId, origemId, payload.categoria_depois as string | null,
          Number(payload.valor_depois) || 0, payload.descricao_depois as string | null, dataCompetencia,
          payload.centro_custo_id_depois as string | null,
        );
        break;
      }
      default:
        return; // demais eventos são sinal de workflow, não fato financeiro
    }
  } catch (e) {
    reportarFalhaEscrita("lancamento_contabil", `consumidor ${tipo}`, e instanceof Error ? e.message : String(e));
  }
}
