// 🦅 AXIOMA AI.TECH — PDV Fase 3, Etapa 1 (sub-etapa "abrir turno de caixa").
// Grava de verdade em public.caixa / public.turno_caixa (PDV-FASE3-ETAPA1-
// VENDAS-SQL.sql). Segue o mesmo padrão anti-falha-silenciosa já usado em
// lib/estoqueHelpers.ts: sempre checa {data, error} e trata 0 linhas
// afetadas como falha (RLS pode bloquear e devolver 0 linhas sem `error`).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { criarMovimentacao } from "./estoqueHelpers";

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

// ============================================================================
// SUB-ETAPA "FINALIZAR VENDA" — grava venda + item_venda via RPC
// finalizar_venda (SECURITY DEFINER, PDV-FASE3-ETAPA2-FINALIZAR-VENDA-
// SQL.sql). O client SÓ manda produto_id + quantidade por item — nunca
// preço nem custo, os dois são lidos de public.produtos DENTRO da função.
// Erros da função vêm com código AX0xx (ver cabeçalho do SQL) em vez de só
// texto em português, pra tela poder traduzir sem depender do texto que o
// Postgres devolve — mesmo padrão já usado em aceitarConvite()/
// listarEquipe() (lib/empresaHelpers.ts).
// ============================================================================

export type ItemVendaInput = { produto_id: string; quantidade: number };

export type FinalizarVendaOpcoes = {
  formaPagamento?: string;
  descontoTotal?: number;
  clienteId?: string;
  cpfNota?: string;
};

export async function finalizarVenda(
  turnoCaixaId: string, itens: ItemVendaInput[], opcoes: FinalizarVendaOpcoes = {}
): Promise<{ vendaId?: string; valorTotal?: number; erro?: string; codigo?: string }> {
  const { data, error } = await supabase.rpc("finalizar_venda", {
    p_turno_caixa_id: turnoCaixaId,
    p_itens: itens,
    p_forma_pagamento: opcoes.formaPagamento || null,
    p_desconto_total: opcoes.descontoTotal ?? 0,
    p_cliente_id: opcoes.clienteId || null,
    p_cpf_nota: opcoes.cpfNota || null,
  });

  if (error) {
    const codigo = (error as any).code;
    Sentry.captureException(new Error(`Falha ao finalizar venda: ${error.message}`), { extra: { operacao: "rpc:finalizar_venda", turnoCaixaId, motivo: error.message, codigo } });
    return { erro: error.message, codigo };
  }
  // RETURNS TABLE do Postgres sempre chega como array via supabase-js.
  const linha = Array.isArray(data) ? data[0] : data;
  if (!linha?.venda_id) {
    const motivo = "RPC finalizar_venda não devolveu venda_id";
    Sentry.captureException(new Error(motivo), { extra: { operacao: "rpc:finalizar_venda", turnoCaixaId } });
    return { erro: motivo };
  }
  return { vendaId: linha.venda_id, valorTotal: Number(linha.valor_total) };
}

// ============================================================================
// SUB-ETAPA "BAIXA DE ESTOQUE" — reaproveita criarMovimentacao() já
// existente (lib/estoqueHelpers.ts), sem duplicar lógica de lote/FEFO em
// lugar nenhum. Cada item é tentado individualmente; falha em um não impede
// os outros. estoque_baixado em venda é quem garante que uma venda com
// baixa incompleta nunca se perde — ver PDV-FASE3-ETAPA2-FINALIZAR-VENDA-SQL.sql.
// ============================================================================

export type ItemBaixaEstoque = { produtoId: string; nome: string; quantidade: number };
export type StatusBaixaEstoque = "pendente" | "parcial" | "concluido";

export async function baixarEstoqueVenda(
  empresaId: string, userId: string, vendaId: string, itens: ItemBaixaEstoque[]
): Promise<{ falhas: ItemBaixaEstoque[] }> {
  const falhas: ItemBaixaEstoque[] = [];
  for (const item of itens) {
    const { erro } = await criarMovimentacao(empresaId, userId, {
      produto_id: item.produtoId,
      tipo: "saida",
      quantidade: item.quantidade,
      origem: "pdv",
      documento_ref: vendaId,
    });
    if (erro) falhas.push(item);
  }
  return { falhas };
}

export async function atualizarStatusBaixaEstoque(vendaId: string, status: StatusBaixaEstoque): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("venda").update({ estoque_baixado: status }).eq("id", vendaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    Sentry.captureException(new Error(`Falha ao atualizar estoque_baixado: ${motivo}`), { extra: { tabela: "venda", operacao: "update", vendaId, status, motivo } });
    return { erro: motivo };
  }
  return {};
}

// ============================================================================
// "PREÇO NA HORA DA VENDA" — produto sem preco_venda definido (típico de
// produto cadastrado no Estoque, que só preenche preco_custo/preco_sugerido,
// nunca preco_venda — ver diagnóstico do conflito PDV×Estoque) não pode
// travar a venda. O operador digita o preço no ato; ele é GRAVADO em
// produtos.preco_venda (não é um valor solto por fora) — dali em diante
// finalizar_venda() lê esse preço normalmente, igual a qualquer outro
// produto, e o congela em item_venda.preco_unitario_venda como sempre fez.
// Nenhuma mudança em finalizar_venda nem no schema: só um UPDATE comum,
// sujeito à MESMA RLS de sempre (produtos_multi_tenant) — por isso um
// operador (bloqueado por linha nessa tabela desde a Fase 0) não consegue
// definir preço; só quem tem acesso de escrita a produtos (dono/admin/
// financeiro) consegue. Isso é intencional, não um bug: decidir preço de
// venda é decisão do dono, mesmo quando "na hora".
export async function definirPrecoVenda(produtoId: string, precoVenda: number): Promise<{ erro?: string; semPermissao?: boolean }> {
  const { data, error } = await supabase.from("produtos").update({ preco_venda: precoVenda }).eq("id", produtoId).select("id");
  if (error) {
    Sentry.captureException(new Error(`Falha ao definir preco_venda: ${error.message}`), { extra: { tabela: "produtos", operacao: "update", produtoId, motivo: error.message } });
    return { erro: error.message };
  }
  if (!data || data.length === 0) {
    // 0 linhas sem error = RLS bloqueou silenciosamente — a assinatura
    // exata de um papel sem permissão de escrita em produtos (operador).
    return { semPermissao: true };
  }
  return {};
}
