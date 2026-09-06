// 🦅 AXIOMA AI.TECH — CFO Core, Fase 1, Commit 4: Accounting Core (gravação
// de lançamento). O de-para "evento → débito/crédito" (qual conta lançar pra
// cada tipo de evento) NÃO mora aqui ainda — é lógica de negócio revisada à
// parte antes de ligar o consumidor automático. Este arquivo só entrega a
// CAPACIDADE de gravar um lançamento já validado, determinística, sem IA.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// TIPOS
// ============================================================================

export type TipoContaContabil = "ativo" | "passivo" | "patrimonio" | "receita" | "despesa";
export type NaturezaContabil = "devedora" | "credora";

export type ContaContabil = {
  id: string; empresa_id: string; codigo: string; nome: string;
  tipo: TipoContaContabil; natureza: NaturezaContabil;
  conta_pai_id: string | null; codigo_referencial_rfb: string | null;
  ativo: boolean; criado_em: string;
};

export type PartidaContabilInput = {
  contaId: string;
  tipo: "debito" | "credito";
  valor: number;
  centroCustoId?: string | null;
};

export type OrigemLancamento = {
  eventoId?: string | null;
  origemTabela?: string | null;
  origemId?: string | null;
};

// ============================================================================
// CAMADA 1 DE DEFESA — valida ANTES de qualquer chamada ao banco. Testável
// isoladamente (função pura). A CAMADA 2 (trigger trg_partida_dobrada, que
// dispara no COMMIT da transação) é a última linha — nunca a única.
// ============================================================================

export function validarPartidaDobrada(partidas: PartidaContabilInput[]): { ok: boolean; erro?: string } {
  if (partidas.length < 2) {
    return { ok: false, erro: "Lançamento precisa de pelo menos 2 partidas (débito e crédito)." };
  }
  if (partidas.some((p) => !(p.valor > 0))) {
    return { ok: false, erro: "Toda partida precisa ter valor maior que zero." };
  }
  // Soma em centavos (inteiro) — soma de numeric em ponto flutuante pode
  // divergir por erro de arredondamento (ex: 0.1 + 0.2 !== 0.3 em JS).
  const centavos = (v: number) => Math.round(v * 100);
  const debito = partidas.filter((p) => p.tipo === "debito").reduce((s, p) => s + centavos(p.valor), 0);
  const credito = partidas.filter((p) => p.tipo === "credito").reduce((s, p) => s + centavos(p.valor), 0);
  if (debito !== credito) {
    return { ok: false, erro: `Partida não fechada: débito=${(debito / 100).toFixed(2)} crédito=${(credito / 100).toFixed(2)}.` };
  }
  return { ok: true };
}

// ============================================================================
// GRAVAR LANÇAMENTO — chama a RPC contabil_registrar_lancamento (SQL em
// CFO-CORE-FASE1-ACCOUNTING-RPC-SEED-SQL.txt, pendente de revisão/aplicação)
// que insere cabeçalho + todas as partidas numa ÚNICA transação — exigência
// do trigger trg_partida_dobrada, que só fecha a conta depois que TODAS as
// linhas do lançamento já foram inseridas. Client nunca insere linha por
// linha via requests soltos: sempre por aqui.
// ============================================================================

export async function registrarLancamentoContabil(
  empresaId: string,
  data: string,
  descricao: string,
  partidas: PartidaContabilInput[],
  origem?: OrigemLancamento,
): Promise<{ id?: string; erro?: string }> {
  const validacao = validarPartidaDobrada(partidas);
  if (!validacao.ok) return { erro: validacao.erro };

  const { data: novoId, error } = await supabase.rpc("contabil_registrar_lancamento", {
    p_empresa_id: empresaId,
    p_data: data,
    p_descricao: descricao,
    p_partidas: partidas.map((p) => ({
      conta_id: p.contaId, tipo: p.tipo, valor: p.valor, centro_custo_id: p.centroCustoId ?? null,
    })),
    p_evento_id: origem?.eventoId ?? null,
    p_origem_tabela: origem?.origemTabela ?? null,
    p_origem_id: origem?.origemId ?? null,
  });
  if (error || !novoId) {
    const motivo = error?.message || "RPC não devolveu id do lançamento";
    reportarFalhaEscrita("lancamento_contabil", "rpc contabil_registrar_lancamento", motivo);
    return { erro: motivo };
  }
  return { id: novoId as string };
}

// ============================================================================
// LEITURA DO PLANO DE CONTAS
// ============================================================================

export async function listarPlanoDeContas(empresaId: string): Promise<ContaContabil[]> {
  const { data } = await supabase.from("plano_de_contas").select("*").eq("empresa_id", empresaId).order("codigo");
  return (data as ContaContabil[]) || [];
}

// ============================================================================
// ESTORNO — único jeito de "corrigir" um lançamento (ledger imutável por
// desenho: nunca UPDATE/DELETE). O contador escolhe o lançamento errado, a
// RPC contabil_estornar_lancamento (já usada pelo estorno automático de
// AP/AR/Estoque/Caixa em lib/contabilidadeConsumidor.ts) gera o espelho —
// débito/crédito invertidos — e marca o original via estornado_por_id.
// Faltava só um wrapper PÚBLICO pra uso manual/humano; a RPC em si já existe
// e já está em produção.
// ============================================================================

export async function estornarLancamentoContabil(
  lancamentoId: string,
  descricao: string,
): Promise<{ id?: string; erro?: string }> {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: novoId, error } = await supabase.rpc("contabil_estornar_lancamento", {
    p_lancamento_id: lancamentoId, p_data: hoje, p_descricao: descricao,
  });
  if (error || !novoId) {
    const motivo = error?.message || "RPC não devolveu id do estorno";
    reportarFalhaEscrita("lancamento_contabil", "rpc contabil_estornar_lancamento (manual)", motivo);
    return { erro: motivo };
  }
  return { id: novoId as string };
}
