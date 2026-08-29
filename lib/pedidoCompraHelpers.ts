// 🦅 AXIOMA AI.TECH — Contas a Pagar: Pedido de Compra (Match Engine, Nível
// 3-way). CRUD mínimo + vínculo automático com os itens de uma NF-e recém
// gravada. Reaproveitado sem mudança: normalizarTexto (cfoCore.ts).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { normalizarTexto } from "./cfoCore";

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

export type PedidoCompra = {
  id: string;
  fornecedor_id: string | null;
  numero: string;
  status: string;
  valor_total: number | null;
  data_emissao: string | null;
  observacao: string | null;
  criado_em: string;
};

export type PedidoCompraListado = PedidoCompra & { fornecedorNome: string | null };

export type PedidoCompraItemInput = {
  descricao: string;
  codigo_fornecedor?: string | null;
  ean?: string | null;
  ncm?: string | null;
  unidade?: string | null;
  quantidade: number;
  valor_unitario: number;
};

export type PedidoCompraItem = {
  id: string;
  descricao: string;
  codigo_fornecedor: string | null;
  ean: string | null;
  ncm: string | null;
  unidade: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
};

// ============================================================================
// CRUD — CABEÇALHO + ITENS (tela mínima: edição substitui os itens inteiros,
// sem diff linha a linha)
// ============================================================================

export async function listarPedidosCompra(empresaId: string, filtroStatus?: string): Promise<PedidoCompraListado[]> {
  let q = supabase.from("pedido_compra")
    .select("id, fornecedor_id, numero, status, valor_total, data_emissao, observacao, criado_em, fornecedores(nome)")
    .eq("empresa_id", empresaId).order("criado_em", { ascending: false });
  if (filtroStatus) q = q.eq("status", filtroStatus);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id, fornecedor_id: p.fornecedor_id, numero: p.numero, status: p.status,
    valor_total: p.valor_total, data_emissao: p.data_emissao, observacao: p.observacao, criado_em: p.criado_em,
    fornecedorNome: p.fornecedores?.nome || null,
  }));
}

export async function listarItensPedido(empresaId: string, pedidoCompraId: string): Promise<PedidoCompraItem[]> {
  const { data, error } = await supabase.from("pedido_compra_itens")
    .select("id, descricao, codigo_fornecedor, ean, ncm, unidade, quantidade, valor_unitario, valor_total")
    .eq("empresa_id", empresaId).eq("pedido_compra_id", pedidoCompraId)
    .order("criado_em", { ascending: true });
  if (error || !data) return [];
  return data as PedidoCompraItem[];
}

export async function criarPedidoCompra(userId: string, empresaId: string, dados: {
  fornecedorId: string; numero: string; dataEmissao?: string | null; observacao?: string | null; itens: PedidoCompraItemInput[];
}): Promise<{ id?: string; erro?: string }> {
  const valorTotal = dados.itens.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0);
  const { data: pedido, error: erroPedido } = await supabase.from("pedido_compra").insert({
    empresa_id: empresaId, fornecedor_id: dados.fornecedorId, numero: dados.numero, status: "aberto",
    valor_total: valorTotal, data_emissao: dados.dataEmissao || null, observacao: dados.observacao || null, criado_por: userId,
  }).select("id").single();
  if (erroPedido || !pedido) {
    const motivo = erroPedido?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("pedido_compra", "insert", motivo);
    return { erro: motivo };
  }

  if (dados.itens.length > 0) {
    const linhas = dados.itens.map((it) => ({
      empresa_id: empresaId, pedido_compra_id: pedido.id, descricao: it.descricao,
      codigo_fornecedor: it.codigo_fornecedor || null, ean: it.ean || null, ncm: it.ncm || null, unidade: it.unidade || null,
      quantidade: it.quantidade, valor_unitario: it.valor_unitario, valor_total: it.quantidade * it.valor_unitario,
    }));
    const { error: erroItens } = await supabase.from("pedido_compra_itens").insert(linhas);
    if (erroItens) {
      reportarFalhaEscrita("pedido_compra_itens", "insert", erroItens.message);
      return { id: pedido.id, erro: erroItens.message };
    }
  }

  // Criar um pedido de compra PRA este fornecedor é o gesto que liga o
  // nível 3-way — não existe tela separada em Fornecedores só pra isso.
  // Best-effort: se falhar, o pedido já foi salvo; o motor só não vai casar
  // até o nível ficar '3way' (fica reportado, não silencioso).
  const { error: erroNivel } = await supabase.from("fornecedores")
    .update({ nivel_match: "3way" }).eq("empresa_id", empresaId).eq("id", dados.fornecedorId);
  if (erroNivel) reportarFalhaEscrita("fornecedores", "update nivel_match (ativação 3-way)", erroNivel.message);

  return { id: pedido.id };
}

export async function editarPedidoCompra(empresaId: string, pedidoCompraId: string, dados: {
  numero: string; dataEmissao?: string | null; observacao?: string | null; itens: PedidoCompraItemInput[];
}): Promise<{ erro?: string }> {
  const valorTotal = dados.itens.reduce((s, it) => s + it.quantidade * it.valor_unitario, 0);
  const { data, error } = await supabase.from("pedido_compra")
    .update({ numero: dados.numero, data_emissao: dados.dataEmissao || null, observacao: dados.observacao || null, valor_total: valorTotal })
    .eq("empresa_id", empresaId).eq("id", pedidoCompraId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("pedido_compra", "update", motivo);
    return { erro: motivo };
  }

  // Substitui os itens inteiros — tela mínima, sem diff item a item. Um
  // nfe_item que apontava pra um item removido cai pra null (ON DELETE SET
  // NULL); a próxima conferência volta a marcar 'sem_pedido' pra ele, o que
  // é o comportamento correto (o pedido mudou, o vínculo antigo não vale mais).
  const { error: erroDelete } = await supabase.from("pedido_compra_itens")
    .delete().eq("empresa_id", empresaId).eq("pedido_compra_id", pedidoCompraId);
  if (erroDelete) {
    reportarFalhaEscrita("pedido_compra_itens", "delete (edição)", erroDelete.message);
    return { erro: erroDelete.message };
  }

  if (dados.itens.length > 0) {
    const linhas = dados.itens.map((it) => ({
      empresa_id: empresaId, pedido_compra_id: pedidoCompraId, descricao: it.descricao,
      codigo_fornecedor: it.codigo_fornecedor || null, ean: it.ean || null, ncm: it.ncm || null, unidade: it.unidade || null,
      quantidade: it.quantidade, valor_unitario: it.valor_unitario, valor_total: it.quantidade * it.valor_unitario,
    }));
    const { error: erroInsert } = await supabase.from("pedido_compra_itens").insert(linhas);
    if (erroInsert) {
      reportarFalhaEscrita("pedido_compra_itens", "insert (edição)", erroInsert.message);
      return { erro: erroInsert.message };
    }
  }
  return {};
}

// Só deixa excluir um pedido que ainda não recebeu nenhuma nota — apagar um
// pedido 'parcial'/'faturado' desligaria vínculos reais em silêncio.
export async function excluirPedidoCompra(empresaId: string, pedidoCompraId: string, statusAtual: string): Promise<{ erro?: string }> {
  if (statusAtual === "parcial" || statusAtual === "faturado") return { erro: "tem_nota_vinculada" };
  const { data, error } = await supabase.from("pedido_compra")
    .delete().eq("empresa_id", empresaId).eq("id", pedidoCompraId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("pedido_compra", "delete", motivo);
    return { erro: motivo };
  }
  return {};
}

// ============================================================================
// VÍNCULO PEDIDO × NOTA — chamado pelo caminho único de gravação de NF-e
// (registrarNfeComItens, lib/pdvNfeHelpers.ts) logo depois de gravar
// nfe_itens. Fornecedor '2way' sai na primeira linha, sem nenhuma query a
// mais — nível base roda idêntico ao de hoje.
// ============================================================================

export type ItemGravadoParaVinculo = { id: string; codigoFornecedor?: string | null; ean?: string | null; descricao: string };

export async function vincularItensAoPedidoAberto(empresaId: string, fornecedorId: string, itensGravados: ItemGravadoParaVinculo[]): Promise<void> {
  if (itensGravados.length === 0) return;

  const { data: fornecedor } = await supabase.from("fornecedores").select("nivel_match").eq("empresa_id", empresaId).eq("id", fornecedorId).maybeSingle();
  if (fornecedor?.nivel_match !== "3way") return;

  const { data: pedidosAbertos } = await supabase.from("pedido_compra")
    .select("id").eq("empresa_id", empresaId).eq("fornecedor_id", fornecedorId).in("status", ["aberto", "parcial"]);
  const pedidoIds = (pedidosAbertos || []).map((p: any) => p.id);
  if (pedidoIds.length === 0) return; // sem pedido aberto — a conferência vai marcar 'sem_pedido'

  const { data: itensPedido } = await supabase.from("pedido_compra_itens")
    .select("id, codigo_fornecedor, ean, descricao").eq("empresa_id", empresaId).in("pedido_compra_id", pedidoIds);

  // Um pedido 'parcial' ainda tem linhas JÁ faturadas por uma nota anterior —
  // essas não podem voltar a casar com uma nota nova (double-counting da
  // mesma linha do pedido em duas notas diferentes).
  const idsCandidatos = (itensPedido || []).map((p: any) => p.id);
  const jaVinculados = new Set<string>();
  if (idsCandidatos.length > 0) {
    const { data: vinculos } = await supabase.from("nfe_itens").select("pedido_compra_item_id").eq("empresa_id", empresaId).in("pedido_compra_item_id", idsCandidatos);
    for (const v of vinculos || []) if (v.pedido_compra_item_id) jaVinculados.add(v.pedido_compra_item_id);
  }
  const disponiveis = (itensPedido || []).filter((p: any) => !jaVinculados.has(p.id));

  // Casamento determinístico, em ordem de confiança: código do fornecedor >
  // EAN > descrição normalizada. Cada item de pedido só casa com UM item da
  // nota (consumido da lista de disponíveis) — sem fracionamento.
  const atualizacoes: { id: string; pedido_compra_item_id: string }[] = [];
  for (const item of itensGravados) {
    let idx = -1;
    if (item.codigoFornecedor) idx = disponiveis.findIndex((p: any) => p.codigo_fornecedor && p.codigo_fornecedor === item.codigoFornecedor);
    if (idx === -1 && item.ean) idx = disponiveis.findIndex((p: any) => p.ean && p.ean === item.ean);
    if (idx === -1) idx = disponiveis.findIndex((p: any) => normalizarTexto(p.descricao) === normalizarTexto(item.descricao));
    if (idx === -1) continue;
    atualizacoes.push({ id: item.id, pedido_compra_item_id: disponiveis[idx].id });
    disponiveis.splice(idx, 1);
  }

  if (atualizacoes.length > 0) {
    const { error } = await supabase.from("nfe_itens").upsert(atualizacoes, { onConflict: "id" });
    if (error) reportarFalhaEscrita("nfe_itens", "upsert (vínculo pedido)", error.message);
  }
}
