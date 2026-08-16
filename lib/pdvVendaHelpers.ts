// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapa 1 (sub-etapa "abrir turno de caixa").
// Grava de verdade em public.caixa / public.turno_caixa (PDV-FASE3-ETAPA1-
// VENDAS-SQL.sql). Segue o mesmo padrão anti-falha-silenciosa já usado em
// lib/estoqueHelpers.ts: sempre checa {data, error} e trata 0 linhas
// afetadas como falha (RLS pode bloquear e devolver 0 linhas sem `error`).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Caixa = {
  id: string;
  nome: string;
  ativo: boolean;
};

export type TurnoCaixa = {
  id: string;
  empresa_id: string;
  caixa_id: string;
  usuario_id: string;
  status: "aberto" | "fechado";
  valor_abertura: number;
  aberto_em: string;
};

const COLUNAS_TURNO = "id, empresa_id, caixa_id, usuario_id, status, valor_abertura, aberto_em";

export async function listarCaixasAtivos(empresaId: string): Promise<Caixa[]> {
  const { data, error } = await supabase.from("caixa")
    .select("id, nome, ativo").eq("empresa_id", empresaId).eq("ativo", true)
    .order("nome", { ascending: true });
  if (error) {
    Sentry.captureException(new Error(`Falha ao listar caixa: ${error.message}`), { extra: { tabela: "caixa", operacao: "select", empresaId } });
    return [];
  }
  return data || [];
}

// Turno é por CAIXA (ponto de venda físico), não por usuário — outra pessoa
// pode ter aberto o mesmo caixa mais cedo no dia; quem entra depois retoma o
// mesmo turno em vez de tentar abrir um segundo (o índice único do banco
// bloquearia mesmo assim, isso aqui só evita a tentativa e dá a mensagem certa).
export async function buscarTurnoAbertoPorCaixa(caixaId: string): Promise<TurnoCaixa | null> {
  const { data, error } = await supabase.from("turno_caixa")
    .select(COLUNAS_TURNO).eq("caixa_id", caixaId).eq("status", "aberto").maybeSingle();
  if (error) {
    Sentry.captureException(new Error(`Falha ao buscar turno aberto: ${error.message}`), { extra: { tabela: "turno_caixa", operacao: "select", caixaId } });
    return null;
  }
  return data;
}

export async function abrirTurno(
  empresaId: string, caixaId: string, usuarioId: string, valorAbertura: number, observacao?: string
): Promise<{ turno?: TurnoCaixa; erro?: string; jaAberto?: boolean }> {
  const { data, error } = await supabase.from("turno_caixa")
    .insert({ empresa_id: empresaId, caixa_id: caixaId, usuario_id: usuarioId, valor_abertura: valorAbertura, observacao: observacao || null })
    .select(COLUNAS_TURNO).single();

  if (error) {
    // 23505 = unique_violation — outra pessoa abriu o mesmo caixa entre a
    // checagem e este insert (corrida). Não é erro real: quem chamou deve
    // buscar o turno que já existe e retomar, não mostrar falha ao usuário.
    if (error.code === "23505") return { jaAberto: true };
    Sentry.captureException(new Error(`Falha ao abrir turno_caixa: ${error.message}`), { extra: { tabela: "turno_caixa", operacao: "insert", empresaId, caixaId, motivo: error.message } });
    return { erro: error.message };
  }
  if (!data) {
    const motivo = "0 linhas afetadas (RLS?)";
    Sentry.captureException(new Error(`Falha ao abrir turno_caixa: ${motivo}`), { extra: { tabela: "turno_caixa", operacao: "insert", empresaId, caixaId, motivo } });
    return { erro: motivo };
  }
  return { turno: data };
}
