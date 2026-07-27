// 🦅 AXIOMA AI.TECH - Helpers do módulo Estoque (Fase 1 — fundação operacional)
// Saldo (disponível/reservado/trânsito) e custo médio móvel são mantidos por
// trigger no banco (ver ESTOQUE-FASE1-SQL.sql) — este arquivo nunca soma isso
// no navegador, só lê o que a trigger já calculou.

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// TIPOS
// ============================================================================

export type Produto = {
  id: string;
  empresa_id: string;
  user_id: string;
  codigo_interno: string | null;
  codigo_barras: string | null;
  sku: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  subcategoria: string | null;
  marca: string | null;
  fabricante: string | null;
  fornecedor_id: string | null;
  unidade: string;
  peso: number | null;
  altura: number | null;
  largura: number | null;
  comprimento: number | null;
  volume: number | null;
  cor: string | null;
  modelo: string | null;
  rua: string | null;
  prateleira: string | null;
  nivel: string | null;
  posicao: string | null;
  centro_custo_id: string | null;
  conta_contabil: string | null;
  preco_custo: number;
  preco_medio: number;
  preco_medio_anterior: number;
  preco_sugerido: number | null;
  preco_minimo: number | null;
  preco_promocional: number | null;
  margem: number | null;
  markup: number | null;
  ncm: string | null;
  cest: string | null;
  cfop_padrao: string | null;
  ipi: number | null;
  icms: number | null;
  pis: number | null;
  cofins: number | null;
  iss: number | null;
  estoque_minimo: number;
  estoque_maximo: number | null;
  status: "ativo" | "inativo";
  imagem_principal: string | null;
  observacoes: string | null;
  saldo_disponivel: number;
  saldo_reservado: number;
  saldo_transito: number;
  created_at: string;
  updated_at: string;
};

export type TipoMovimentacao = "entrada" | "saida" | "transferencia" | "perda" | "ajuste" | "inventario" | "devolucao";
export type OrigemMovimentacao = "manual" | "nfe" | "pdv" | "importacao";

export type EstoqueMovimentacao = {
  id: string;
  empresa_id: string;
  user_id: string;
  produto_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  custo_unitario: number | null;
  valor_total: number | null;
  lote_id: string | null;
  status_recebimento: "confirmada" | "em_transito";
  destino_saldo: "disponivel" | "reservado";
  data_hora: string;
  motivo: string | null;
  origem: OrigemMovimentacao;
  documento_ref: string | null;
  created_at: string;
};

export type EstoqueLote = {
  id: string;
  empresa_id: string;
  produto_id: string;
  numero_lote: string | null;
  data_fabricacao: string | null;
  data_validade: string | null;
  quantidade_atual: number;
  custo_unitario: number | null;
  fornecedor_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AvisoEstoque = {
  produto_id: string; empresa_id: string; nome: string; codigo_interno: string | null; categoria: string | null;
  saldo_disponivel: number; estoque_minimo: number; estoque_maximo: number | null;
  preco_medio: number; preco_medio_anterior: number; preco_custo: number;
  ruptura: boolean; baixo_estoque: boolean; capital_parado: boolean; custo_subindo: boolean;
};

export type SeveridadeValidade = "vencido" | "ultimo_dia" | "critico_7" | "atencao_30" | "aviso_60" | "monitorar_90" | "ok";

export type AvisoValidade = {
  lote_id: string; empresa_id: string; produto_id: string; produto_nome: string;
  numero_lote: string | null; data_validade: string; quantidade_atual: number;
  dias_para_vencer: number; severidade: SeveridadeValidade;
};

export type KpisEstoque = {
  valor_total_estoque: number;
  produtos_ativos: number;
  produtos_inativos: number;
  qtd_ruptura: number;
  qtd_baixo_estoque: number;
  qtd_capital_parado: number;
  qtd_custo_subindo: number;
};

export type ComposicaoItem = { chave: string; valor_total: number; quantidade_total: number };
export type EvolucaoMes = { periodo: string; entradas_qtd: number; saidas_qtd: number; entradas_valor: number; saidas_valor: number };

// ============================================================================
// PRODUTOS — CRUD + busca paginada
// ============================================================================

export const PAGE_SIZE = 30;

export async function listarProdutos(empresaId: string, opts: { pagina?: number; busca?: string; status?: "ativo" | "inativo" | "todos" } = {}): Promise<{ dados: Produto[]; total: number }> {
  const pagina = opts.pagina ?? 0;
  const de = pagina * PAGE_SIZE;
  const ate = de + PAGE_SIZE - 1;

  let query = supabase.from("produtos").select("*", { count: "exact" }).eq("empresa_id", empresaId);
  if (opts.status && opts.status !== "todos") query = query.eq("status", opts.status);
  if (opts.busca && opts.busca.trim()) {
    const termo = opts.busca.trim();
    query = query.or(
      `nome.ilike.%${termo}%,codigo_interno.ilike.%${termo}%,codigo_barras.ilike.%${termo}%,sku.ilike.%${termo}%,categoria.ilike.%${termo}%,marca.ilike.%${termo}%`
    );
  }
  const { data, count, error } = await query.order("nome", { ascending: true }).range(de, ate);
  if (error) return { dados: [], total: 0 };
  return { dados: data || [], total: count || 0 };
}

export async function buscarProdutoPorCodigo(empresaId: string, codigo: string): Promise<Produto | null> {
  const { data } = await supabase.from("produtos").select("*").eq("empresa_id", empresaId)
    .or(`codigo_barras.eq.${codigo},codigo_interno.eq.${codigo},sku.eq.${codigo}`).limit(1).maybeSingle();
  return data;
}

export async function criarProduto(empresaId: string, userId: string, dados: Partial<Produto>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("produtos")
    .insert({ ...dados, empresa_id: empresaId, user_id: userId }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarProduto(id: string, dados: Partial<Produto>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("produtos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

// Exclusão real só é segura sem movimentação nenhuma (senão perde a base do
// CMV histórico). Com movimentação, inativa em vez de apagar.
export async function excluirProduto(id: string): Promise<{ erro?: string; inativadoEmVezDeExcluir?: boolean }> {
  const { count } = await supabase.from("estoque_movimentacoes").select("id", { count: "exact", head: true }).eq("produto_id", id);
  if ((count || 0) > 0) {
    const { error } = await supabase.from("produtos").update({ status: "inativo" }).eq("id", id);
    return error ? { erro: error.message } : { inativadoEmVezDeExcluir: true };
  }
  const { error } = await supabase.from("produtos").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function uploadImagemProduto(file: File, empresaId: string, produtoId: string): Promise<{ path?: string; erro?: string }> {
  const nomeArquivo = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${empresaId}/${produtoId}/${Date.now()}-${nomeArquivo}`;
  const { error } = await supabase.storage.from("produto-imagens").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) return { erro: error.message };
  return { path };
}

export function urlImagemProduto(path: string): string {
  const { data } = supabase.storage.from("produto-imagens").getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================================
// MOVIMENTAÇÕES — CRUD + confirmação de recebimento
// ============================================================================

export type MovimentacaoComProduto = EstoqueMovimentacao & { produto_nome: string; produto_codigo: string | null };

export async function listarMovimentacoes(empresaId: string, opts: { pagina?: number; produtoId?: string; tipo?: TipoMovimentacao } = {}): Promise<{ dados: MovimentacaoComProduto[]; total: number }> {
  const pagina = opts.pagina ?? 0;
  const de = pagina * PAGE_SIZE;
  const ate = de + PAGE_SIZE - 1;

  let query = supabase.from("estoque_movimentacoes")
    .select("*, produtos(nome, codigo_interno)", { count: "exact" }).eq("empresa_id", empresaId);
  if (opts.produtoId) query = query.eq("produto_id", opts.produtoId);
  if (opts.tipo) query = query.eq("tipo", opts.tipo);
  const { data, count, error } = await query.order("data_hora", { ascending: false }).range(de, ate);
  if (error) return { dados: [], total: 0 };
  const dados = (data || []).map((d: any) => ({ ...d, produto_nome: d.produtos?.nome || "—", produto_codigo: d.produtos?.codigo_interno || null }));
  return { dados, total: count || 0 };
}

export type NovaMovimentacao = {
  produto_id: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  custo_unitario?: number | null;
  status_recebimento?: "confirmada" | "em_transito";
  destino_saldo?: "disponivel" | "reservado";
  motivo?: string;
  origem?: OrigemMovimentacao;
  documento_ref?: string;
  data_hora?: string;
  // dados de lote (opcional) — se informado, cria/atualiza o lote e vincula à movimentação
  // (uso típico: entrada com validade nova)
  lote?: { numero_lote: string; data_fabricacao?: string; data_validade?: string; fornecedor_id?: string };
  // vincula a um lote JÁ EXISTENTE (uso típico: saída consumindo um lote via FEFO)
  lote_id?: string | null;
};

export async function criarMovimentacao(empresaId: string, userId: string, mov: NovaMovimentacao): Promise<{ id?: string; erro?: string }> {
  let loteId: string | null = mov.lote_id ?? null;
  if (mov.lote?.numero_lote) {
    const r = await obterOuCriarLote(empresaId, mov.produto_id, mov.lote);
    if (r.erro) return { erro: r.erro };
    loteId = r.id || null;
  }

  const { data, error } = await supabase.from("estoque_movimentacoes").insert({
    empresa_id: empresaId,
    user_id: userId,
    produto_id: mov.produto_id,
    tipo: mov.tipo,
    quantidade: mov.quantidade,
    custo_unitario: mov.custo_unitario ?? null,
    lote_id: loteId,
    status_recebimento: mov.status_recebimento ?? "confirmada",
    destino_saldo: mov.destino_saldo ?? "disponivel",
    motivo: mov.motivo || null,
    origem: mov.origem ?? "manual",
    documento_ref: mov.documento_ref || null,
    data_hora: mov.data_hora || new Date().toISOString(),
  }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

export async function atualizarMovimentacao(id: string, dados: Partial<NovaMovimentacao>): Promise<{ erro?: string }> {
  const { lote, ...resto } = dados;
  const { error } = await supabase.from("estoque_movimentacoes").update(resto).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirMovimentacao(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("estoque_movimentacoes").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function confirmarRecebimento(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("estoque_movimentacoes").update({ status_recebimento: "confirmada" }).eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// LOTES — FEFO (First Expired, First Out)
// ============================================================================

export async function listarLotesProduto(produtoId: string): Promise<EstoqueLote[]> {
  const { data } = await supabase.from("estoque_lotes").select("*")
    .eq("produto_id", produtoId).gt("quantidade_atual", 0)
    .order("data_validade", { ascending: true, nullsFirst: false });
  return data || [];
}

// Sugestão FEFO: dado quanto se quer dar saída, devolve de quais lotes tirar
// (o mais próximo do vencimento primeiro), sem forçar — o usuário pode trocar.
export function sugerirConsumoFefo(lotes: EstoqueLote[], quantidadeDesejada: number): { lote: EstoqueLote; quantidade: number }[] {
  const sugestao: { lote: EstoqueLote; quantidade: number }[] = [];
  let restante = quantidadeDesejada;
  for (const lote of lotes) {
    if (restante <= 0) break;
    const usar = Math.min(lote.quantidade_atual, restante);
    if (usar > 0) { sugestao.push({ lote, quantidade: usar }); restante -= usar; }
  }
  return sugestao;
}

async function obterOuCriarLote(empresaId: string, produtoId: string, lote: { numero_lote: string; data_fabricacao?: string; data_validade?: string; fornecedor_id?: string }): Promise<{ id?: string; erro?: string }> {
  const { data: existente } = await supabase.from("estoque_lotes").select("id")
    .eq("produto_id", produtoId).eq("numero_lote", lote.numero_lote).maybeSingle();
  if (existente?.id) return { id: existente.id };

  const { data, error } = await supabase.from("estoque_lotes").insert({
    empresa_id: empresaId, produto_id: produtoId, numero_lote: lote.numero_lote,
    data_fabricacao: lote.data_fabricacao || null, data_validade: lote.data_validade || null,
    fornecedor_id: lote.fornecedor_id || null,
  }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

// ============================================================================
// CENTRO DE AVISOS + DASHBOARD — sempre lendo views agregadas no banco
// ============================================================================

export async function carregarAvisosEstoque(empresaId: string): Promise<AvisoEstoque[]> {
  const { data } = await supabase.from("vw_estoque_avisos").select("*").eq("empresa_id", empresaId)
    .or("ruptura.eq.true,baixo_estoque.eq.true,capital_parado.eq.true,custo_subindo.eq.true");
  return data || [];
}

export async function carregarAvisosValidade(empresaId: string): Promise<AvisoValidade[]> {
  const { data } = await supabase.from("vw_estoque_avisos_validade").select("*").eq("empresa_id", empresaId)
    .neq("severidade", "ok").order("dias_para_vencer", { ascending: true });
  return data || [];
}

export async function carregarKpisEstoque(empresaId: string): Promise<KpisEstoque> {
  const { data } = await supabase.from("vw_estoque_kpis").select("*").eq("empresa_id", empresaId).maybeSingle();
  return data || {
    valor_total_estoque: 0, produtos_ativos: 0, produtos_inativos: 0,
    qtd_ruptura: 0, qtd_baixo_estoque: 0, qtd_capital_parado: 0, qtd_custo_subindo: 0,
  };
}

export async function carregarComposicaoPorCategoria(empresaId: string): Promise<ComposicaoItem[]> {
  const { data } = await supabase.from("vw_estoque_por_categoria").select("categoria, valor_total, quantidade_total").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ chave: d.categoria, valor_total: Number(d.valor_total || 0), quantidade_total: Number(d.quantidade_total || 0) }));
}

export async function carregarComposicaoPorFornecedor(empresaId: string): Promise<ComposicaoItem[]> {
  const { data } = await supabase.from("vw_estoque_por_fornecedor").select("fornecedor_nome, valor_total, quantidade_total").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ chave: d.fornecedor_nome || "—", valor_total: Number(d.valor_total || 0), quantidade_total: Number(d.quantidade_total || 0) }));
}

export async function carregarEvolucaoEstoque(empresaId: string, meses: number = 6): Promise<EvolucaoMes[]> {
  const desde = new Date();
  desde.setMonth(desde.getMonth() - (meses - 1));
  const desdeIso = new Date(desde.getFullYear(), desde.getMonth(), 1).toISOString();
  const { data } = await supabase.from("vw_estoque_evolucao").select("*").eq("empresa_id", empresaId).gte("periodo", desdeIso).order("periodo", { ascending: true });
  return (data || []).map((d: any) => ({
    periodo: d.periodo, entradas_qtd: Number(d.entradas_qtd || 0), saidas_qtd: Number(d.saidas_qtd || 0),
    entradas_valor: Number(d.entradas_valor || 0), saidas_valor: Number(d.saidas_valor || 0),
  }));
}

// ============================================================================
// LISTAS AUXILIARES (dropdowns)
// ============================================================================

export async function listarFornecedoresParaDropdown(empresaId: string): Promise<{ id: string; nome: string }[]> {
  const { data } = await supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresaId).order("nome", { ascending: true });
  return data || [];
}

export async function listarCentrosCustoParaDropdown(empresaId: string): Promise<{ id: string; nome: string }[]> {
  const { data } = await supabase.from("centros_custo").select("id, nome").eq("empresa_id", empresaId).order("nome", { ascending: true });
  return data || [];
}
