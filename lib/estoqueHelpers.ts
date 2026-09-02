// 🦅 AXIOMA AI.TECH - Helpers do módulo Estoque (Fase 1 — fundação operacional)
// Saldo (disponível/reservado/trânsito) e custo médio móvel são mantidos por
// trigger no banco (ver ESTOQUE-FASE1-SQL.sql) — este arquivo nunca soma isso
// no navegador, só lê o que a trigger já calculou.

import { createBrowserClient } from "@supabase/ssr";
import * as XLSX from "xlsx";
import * as Sentry from "@sentry/nextjs";
import { publicarEventoNaoBloqueante } from "./contabilidadeConsumidor";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear update/delete e devolver 0 linhas SEM error do Postgres — a
// mesma causa raiz do bug real do atualizarEmpresa ("salvava sem salvar").
// .select("id") é o que permite enxergar essa falha silenciosa.
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

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
  segmento: string | null;
  atributos_nicho: Record<string, any>;
  lead_time_dias: number | null;
  preco_venda: number | null;
  // false só em produtos/serviços do PDV Fase 2 com nicho de modo serviço —
  // some da ruptura/baixo estoque/curva ABC/giro (PDV-FASE2-CONTROLA-ESTOQUE-SQL.sql).
  // Default true no banco: todo produto do Estoque já é true, sem exceção.
  controla_estoque: boolean;
  created_at: string;
  updated_at: string;
};

// Lista fechada dos campos reais de Produto — `satisfies` garante em tempo
// de compilação que todo nome aqui é uma chave de Produto (typo vira erro
// de build, não bug silencioso). Usada como guarda em runtime por quem
// monta payload de update por chave dinâmica (ex.: edição em lote no
// Estoque) — TypeScript sozinho não protege em runtime, essa lista sim.
export const CAMPOS_PRODUTO = [
  "id", "empresa_id", "user_id", "codigo_interno", "codigo_barras", "sku", "nome", "descricao",
  "categoria", "subcategoria", "marca", "fabricante", "fornecedor_id", "unidade", "peso", "altura",
  "largura", "comprimento", "volume", "cor", "modelo", "rua", "prateleira", "nivel", "posicao",
  "centro_custo_id", "conta_contabil", "preco_custo", "preco_medio", "preco_medio_anterior",
  "preco_sugerido", "preco_minimo", "preco_promocional", "margem", "markup", "ncm", "cest",
  "cfop_padrao", "ipi", "icms", "pis", "cofins", "iss", "estoque_minimo", "estoque_maximo", "status",
  "imagem_principal", "observacoes", "saldo_disponivel", "saldo_reservado", "saldo_transito",
  "segmento", "atributos_nicho", "lead_time_dias", "preco_venda", "controla_estoque",
  "created_at", "updated_at",
] as const satisfies readonly (keyof Produto)[];

// Atribui payload[k] = v com o tipo correto (K correlacionado a Produto[K]
// dentro da função genérica — por isso não precisa de as any) E valida k
// contra CAMPOS_PRODUTO antes de gravar. Chave fora da lista não é
// atribuída e reporta pro Sentry — na dúvida, não grava, nunca assume.
export function setCampoProduto<K extends keyof Produto>(payload: Partial<Produto>, k: K, v: Produto[K]) {
  if (!(CAMPOS_PRODUTO as readonly string[]).includes(k as string)) {
    reportarFalhaEscrita("produtos", "montar payload de edição em lote", `campo "${String(k)}" fora da lista de campos válidos de Produto`);
    return;
  }
  payload[k] = v;
}

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

export async function listarProdutos(empresaId: string, opts: { pagina?: number; busca?: string; status?: "ativo" | "inativo" | "todos"; limite?: number; segmento?: string; segmentoPadraoEmpresa?: string | null } = {}): Promise<{ dados: Produto[]; total: number }> {
  const tamanhoPagina = opts.limite ?? PAGE_SIZE;
  const pagina = opts.pagina ?? 0;
  const de = pagina * tamanhoPagina;
  const ate = de + tamanhoPagina - 1;

  let query = supabase.from("produtos").select("*", { count: "exact" }).eq("empresa_id", empresaId);
  if (opts.status && opts.status !== "todos") query = query.eq("status", opts.status);
  if (opts.segmento && opts.segmento !== "todos") {
    // Produto sem segmento próprio herda o padrão da empresa (mesma regra da
    // tela de cadastro) — se o segmento filtrado é o padrão da empresa (ou,
    // na falta de padrão, o "generico"), inclui também quem está em branco.
    const cobreSegmentoEmBranco = opts.segmento === opts.segmentoPadraoEmpresa || (!opts.segmentoPadraoEmpresa && opts.segmento === "generico");
    if (cobreSegmentoEmBranco) query = query.or(`segmento.eq.${opts.segmento},segmento.is.null`);
    else query = query.eq("segmento", opts.segmento);
  }
  if (opts.busca && opts.busca.trim()) {
    const termo = opts.busca.trim();
    const camposDiretos = `nome.ilike.%${termo}%,codigo_interno.ilike.%${termo}%,codigo_barras.ilike.%${termo}%,sku.ilike.%${termo}%,categoria.ilike.%${termo}%,marca.ilike.%${termo}%,rua.ilike.%${termo}%,prateleira.ilike.%${termo}%,nivel.ilike.%${termo}%,posicao.ilike.%${termo}%`;
    // Fornecedor mora em outra tabela — resolve os IDs que batem com o nome primeiro
    // (1 consulta pequena, não é N+1) e inclui no mesmo OR.
    const { data: fornecedoresBatidos } = await supabase.from("fornecedores").select("id").eq("empresa_id", empresaId).ilike("nome", `%${termo}%`);
    const idsFornecedor = (fornecedoresBatidos || []).map((f) => f.id);
    const clausulaFornecedor = idsFornecedor.length > 0 ? `,fornecedor_id.in.(${idsFornecedor.join(",")})` : "";
    query = query.or(camposDiretos + clausulaFornecedor);
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

// Usado pelo PDV Fase 2 quando o aviso de nome duplicado (sem código de
// barras) oferece "abrir o existente" — busca por id, não por código.
export async function buscarProdutoPorId(id: string): Promise<Produto | null> {
  const { data } = await supabase.from("produtos").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function criarProduto(empresaId: string, userId: string, dados: Partial<Produto>): Promise<{ id?: string; erro?: string }> {
  const { data, error } = await supabase.from("produtos")
    .insert({ ...dados, empresa_id: empresaId, user_id: userId }).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("produtos", "insert", motivo);
    return { erro: motivo };
  }
  return { id: data.id };
}

export async function atualizarProduto(id: string, dados: Partial<Produto>): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("produtos").update(dados).eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("produtos", "update", motivo);
    return { erro: motivo };
  }
  return {};
}

// Produto com venda registrada nunca é excluído nem inativado por aqui — tem
// que continuar visível/rastreável pro histórico fiscal (item_venda.produto_id
// é RESTRICT no banco, ver PDV-FASE3-ETAPA1-VENDAS-SQL.sql; checar antes evita
// o erro cru de foreign key chegando na tela). Exclusão real só é segura sem
// movimentação nenhuma (senão perde a base do CMV histórico); com
// movimentação mas sem venda, inativa em vez de apagar.
export async function excluirProduto(id: string): Promise<{ erro?: string; inativadoEmVezDeExcluir?: boolean; temVenda?: boolean }> {
  const { count: countVenda } = await supabase.from("item_venda").select("id", { count: "exact", head: true }).eq("produto_id", id);
  if ((countVenda || 0) > 0) return { temVenda: true };
  const { count } = await supabase.from("estoque_movimentacoes").select("id", { count: "exact", head: true }).eq("produto_id", id);
  if ((count || 0) > 0) {
    const { data, error } = await supabase.from("produtos").update({ status: "inativo" }).eq("id", id).select("id");
    if (error || !data || data.length === 0) {
      const motivo = error?.message || "0 linhas afetadas (RLS?)";
      reportarFalhaEscrita("produtos", "update (inativar)", motivo);
      return { erro: motivo };
    }
    return { inativadoEmVezDeExcluir: true };
  }
  const { data, error } = await supabase.from("produtos").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("produtos", "delete", motivo);
    return { erro: motivo };
  }
  return {};
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
  // linha da NF-e que gerou esta movimentação (motor de match Contas a Pagar) —
  // null quando a movimentação não veio de importação de nota.
  nfe_item_id?: string | null;
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
    nfe_item_id: mov.nfe_item_id ?? null,
    data_hora: mov.data_hora || new Date().toISOString(),
  }).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_movimentacoes", "insert", motivo);
    return { erro: motivo };
  }
  // COMMIT 11 — liga ao ledger contábil, só nos 3 casos que não duplicam
  // outro lançamento já existente: entrada manual (sem NF-e), ajuste e
  // perda/quebra. NF-e (origem "nfe") já é reconhecida pelo contas_pagar da
  // nota (AP_CREATED); saída de venda (origem "pdv") já sai pelo CMV da
  // própria venda (SALE_CREATED) — nenhum dos dois pode lançar de novo aqui,
  // senão conta a mesma coisa 2x. Ver nota completa em contabilidadeConsumidor.ts.
  const origemMov = mov.origem ?? "manual";
  const statusRecebimento = mov.status_recebimento ?? "confirmada";
  const destinoSaldo = mov.destino_saldo ?? "disponivel";
  let tipoEventoEstoque: "STOCK_ENTRY_MANUAL" | "STOCK_ADJUSTMENT" | "STOCK_LOSS" | null = null;
  if (mov.tipo === "entrada" && origemMov === "manual" && statusRecebimento === "confirmada") tipoEventoEstoque = "STOCK_ENTRY_MANUAL";
  else if ((mov.tipo === "ajuste" || mov.tipo === "inventario") && destinoSaldo === "disponivel") tipoEventoEstoque = "STOCK_ADJUSTMENT";
  else if (mov.tipo === "perda") tipoEventoEstoque = "STOCK_LOSS";
  if (tipoEventoEstoque) {
    publicarEventoNaoBloqueante(empresaId, tipoEventoEstoque,
      { produto_id: mov.produto_id, quantidade: mov.quantidade, custo_unitario: mov.custo_unitario ?? null, data_hora: mov.data_hora || new Date().toISOString(), motivo: mov.motivo ?? null },
      { modulo: "estoque", tabela: "estoque_movimentacoes", id: data.id });
  }
  return { id: data.id };
}

export async function atualizarMovimentacao(id: string, dados: Partial<NovaMovimentacao>): Promise<{ erro?: string }> {
  const { lote, ...resto } = dados;
  const { data, error } = await supabase.from("estoque_movimentacoes").update(resto).eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_movimentacoes", "update", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function excluirMovimentacao(id: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("estoque_movimentacoes").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_movimentacoes", "delete", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function confirmarRecebimento(id: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("estoque_movimentacoes").update({ status_recebimento: "confirmada" }).eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_movimentacoes", "update (confirmar recebimento)", motivo);
    return { erro: motivo };
  }
  return {};
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
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_lotes", "insert", motivo);
    return { erro: motivo };
  }
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

// ============================================================================
// CADASTRO CAMALEÃO — config da empresa (segmento padrão + campos personalizados)
// ============================================================================

export type CampoPersonalizadoEmpresa = { chave: string; nome: string; tipo: "text" | "number" | "date" };
export const MAX_CAMPOS_PERSONALIZADOS = 3;

export async function carregarConfigEstoqueEmpresa(empresaId: string): Promise<{ segmentoPadrao: string | null; camposPersonalizados: CampoPersonalizadoEmpresa[] }> {
  const { data } = await supabase.from("empresas").select("segmento_padrao, campos_personalizados_estoque").eq("id", empresaId).maybeSingle();
  return { segmentoPadrao: data?.segmento_padrao || null, camposPersonalizados: data?.campos_personalizados_estoque || [] };
}

// .select() força o retorno das linhas afetadas — sem isso, um UPDATE que a
// RLS bloqueia silenciosamente (0 linhas, sem erro do Postgres) parecia
// sucesso. Ver STATUS-AXIOMA: bug da política de "empresas" só olhar
// user_id, não empresa_usuarios.
export async function definirSegmentoPadraoEmpresa(empresaId: string, segmento: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("empresas").update({ segmento_padrao: segmento }).eq("id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    reportarFalhaEscrita("empresas", "update (segmento_padrao)", error?.message || "0 linhas afetadas (RLS?)");
    return { erro: error ? error.message : "SEM_PERMISSAO_ESCRITA" };
  }
  return {};
}

export async function adicionarCampoPersonalizado(empresaId: string, atuais: CampoPersonalizadoEmpresa[], novo: CampoPersonalizadoEmpresa): Promise<{ erro?: string }> {
  if (atuais.length >= MAX_CAMPOS_PERSONALIZADOS) return { erro: `Limite de ${MAX_CAMPOS_PERSONALIZADOS} campos personalizados atingido` };
  const { data, error } = await supabase.from("empresas").update({ campos_personalizados_estoque: [...atuais, novo] }).eq("id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    reportarFalhaEscrita("empresas", "update (campos_personalizados_estoque)", error?.message || "0 linhas afetadas (RLS?)");
    return { erro: error ? error.message : "SEM_PERMISSAO_ESCRITA" };
  }
  return {};
}

// Remove a definição do campo (empresas.campos_personalizados_estoque) E a
// chave de dentro de atributos_nicho de TODOS os produtos da empresa, numa
// função de banco (ver ESTOQUE-FASE2-REORGANIZACAO-SQL.sql) — nunca em loop
// linha a linha aqui no app.
export async function removerCampoPersonalizado(empresaId: string, chave: string): Promise<{ erro?: string }> {
  const { error } = await supabase.rpc("remover_campo_personalizado_estoque", { p_empresa_id: empresaId, p_chave: chave });
  return error ? { erro: error.message } : {};
}

// ============================================================================
// CONTAGEM POR SEGMENTO — chips dinâmicos da aba Produtos, agregado no banco.
// ============================================================================

export type ContagemSegmento = { segmento: string; qtd_ativo: number; qtd_inativo: number; qtd_total: number };

export async function carregarContagemPorSegmento(empresaId: string): Promise<ContagemSegmento[]> {
  const { data } = await supabase.from("vw_estoque_por_segmento").select("*").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ segmento: d.segmento, qtd_ativo: Number(d.qtd_ativo || 0), qtd_inativo: Number(d.qtd_inativo || 0), qtd_total: Number(d.qtd_total || 0) }));
}

// ============================================================================
// GRADE/VARIAÇÕES — GANCHO, NÃO IMPLEMENTADO NESTA FASE
// ============================================================================
// Produto-pai com variações (tamanho/cor etc, cada uma com seu próprio saldo/
// código de barras) fica pra um prompt dedicado. O único preparo feito aqui é
// não travar nada que impeça isso depois: produtos já tem id próprio por SKU/
// código de barras, então um "produto-pai" futuro poderia referenciar produtos
// filhos via uma FK produto_pai_id nullable (não criada ainda) sem precisar
// remodelar as tabelas existentes.
// export type Variacao = { produtoFilhoId: string; atributos: Record<string,string> };

// ============================================================================
// INTELIGÊNCIA (Fase 2) — tudo lido de views agregadas no banco
// ============================================================================

export type ItemGiro = {
  produto_id: string; nome: string; categoria: string | null; saldo_disponivel: number; preco_medio: number;
  lead_time_dias: number | null; saida_qtd_90d: number; saida_valor_90d: number; velocidade_consumo_diaria: number; giro_90d: number | null;
};

export async function carregarGiroEstoque(empresaId: string): Promise<ItemGiro[]> {
  const { data } = await supabase.from("vw_estoque_giro").select("*").eq("empresa_id", empresaId).order("giro_90d", { ascending: false, nullsFirst: false });
  return data || [];
}

export type ItemCurvaABC = { produto_id: string; nome: string; categoria: string | null; valor_saida_90d: number; pct_acumulado: number; classe_abc: "A" | "B" | "C" | "sem_giro" };

export async function carregarCurvaABC(empresaId: string): Promise<ItemCurvaABC[]> {
  const { data } = await supabase.from("vw_estoque_curva_abc").select("*").eq("empresa_id", empresaId).order("valor_saida_90d", { ascending: false });
  return data || [];
}

export type ItemCapitalImobilizado = {
  produto_id: string; nome: string; categoria: string | null; saldo_disponivel: number; preco_medio: number;
  capital_imobilizado: number; ultima_movimentacao: string | null; dias_sem_movimento: number | null;
};

export async function carregarCapitalImobilizado(empresaId: string): Promise<ItemCapitalImobilizado[]> {
  const { data } = await supabase.from("vw_estoque_capital_imobilizado").select("*").eq("empresa_id", empresaId).order("capital_imobilizado", { ascending: false });
  return data || [];
}

export type ItemRentabilidade = { chave: string; margem_media: number | null; markup_medio: number | null; capital_no_grupo: number };

export async function carregarRentabilidadePorCategoria(empresaId: string): Promise<ItemRentabilidade[]> {
  const { data } = await supabase.from("vw_estoque_rentabilidade_categoria").select("*").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ chave: d.categoria, margem_media: d.margem_media, markup_medio: d.markup_medio, capital_no_grupo: Number(d.capital_no_grupo || 0) }));
}

export async function carregarRentabilidadePorFornecedor(empresaId: string): Promise<ItemRentabilidade[]> {
  const { data } = await supabase.from("vw_estoque_rentabilidade_fornecedor").select("*").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ chave: d.fornecedor_nome || "—", margem_media: d.margem_media, markup_medio: d.markup_medio, capital_no_grupo: Number(d.capital_no_grupo || 0) }));
}

export async function carregarRentabilidadePorMarca(empresaId: string): Promise<ItemRentabilidade[]> {
  const { data } = await supabase.from("vw_estoque_rentabilidade_marca").select("*").eq("empresa_id", empresaId);
  return (data || []).map((d: any) => ({ chave: d.marca, margem_media: d.margem_media, markup_medio: d.markup_medio, capital_no_grupo: Number(d.capital_no_grupo || 0) }));
}

export type FornecedorComparativo = { fornecedor_id: string; fornecedor_nome: string; preco_medio_compra: number | null; frequencia_entregas: number; ultima_entrada: string | null };

export async function carregarComparativoFornecedores(empresaId: string): Promise<FornecedorComparativo[]> {
  const { data } = await supabase.from("vw_estoque_fornecedores_comparativo").select("*").eq("empresa_id", empresaId).order("frequencia_entregas", { ascending: false });
  return data || [];
}

// Última entrada real (tipo "entrada", já confirmada, com custo preenchido)
// de um produto específico — base da sugestão de custo de compra do PDV
// Cadastro. produto_id é FK obrigatória em estoque_movimentacoes, então só
// existe resultado pra produto que já foi salvo pelo menos uma vez.
export type UltimaCompraProduto = { custoUnitario: number; dataHora: string };

export async function buscarUltimaCompraProduto(empresaId: string, produtoId: string): Promise<UltimaCompraProduto | null> {
  const { data } = await supabase.from("estoque_movimentacoes")
    .select("custo_unitario, data_hora")
    .eq("empresa_id", empresaId).eq("produto_id", produtoId).eq("tipo", "entrada").eq("status_recebimento", "confirmada")
    .not("custo_unitario", "is", null)
    .order("data_hora", { ascending: false }).limit(1).maybeSingle();
  if (!data || data.custo_unitario == null) return null;
  return { custoUnitario: Number(data.custo_unitario), dataHora: data.data_hora };
}

// Ponto de reposição e previsão de ruptura — cálculo simples em cima de dados
// já agregados no banco (vw_estoque_giro), não é soma de tabela crua.
export type AlertaReposicao = { produto_id: string; nome: string; saldo_disponivel: number; velocidade_consumo_diaria: number; leadTimeDias: number; pontoReposicao: number; diasRestantes: number | null; emRisco: boolean };

export function calcularAlertasReposicao(itens: ItemGiro[]): AlertaReposicao[] {
  return itens
    .filter((i) => i.lead_time_dias != null && i.velocidade_consumo_diaria > 0)
    .map((i) => {
      const leadTimeDias = i.lead_time_dias as number;
      const pontoReposicao = Math.ceil(i.velocidade_consumo_diaria * leadTimeDias);
      const diasRestantes = i.velocidade_consumo_diaria > 0 ? Math.floor(i.saldo_disponivel / i.velocidade_consumo_diaria) : null;
      return { produto_id: i.produto_id, nome: i.nome, saldo_disponivel: i.saldo_disponivel, velocidade_consumo_diaria: i.velocidade_consumo_diaria, leadTimeDias, pontoReposicao, diasRestantes, emRisco: diasRestantes != null && diasRestantes < leadTimeDias };
    })
    .filter((a) => a.emRisco)
    .sort((a, b) => (a.diasRestantes ?? 0) - (b.diasRestantes ?? 0));
}

// ============================================================================
// AUTOMAÇÕES — edição em lote + Excel/CSV
// ============================================================================

export async function atualizarProdutosEmLote(ids: string[], dados: Partial<Produto>): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("produtos").update(dados).in("id", ids).select("id");
  if (error || !data || data.length < ids.length) {
    const motivo = error?.message || `${ids.length - (data?.length || 0)} de ${ids.length} produto(s) não foram atualizados (RLS?)`;
    reportarFalhaEscrita("produtos", "update em lote", motivo);
    return { erro: motivo };
  }
  return {};
}

const COLUNAS_EXCEL = (p: Produto) => ({
  Nome: p.nome, "Código Interno": p.codigo_interno || "", "Código de Barras": p.codigo_barras || "",
  SKU: p.sku || "", Categoria: p.categoria || "", Marca: p.marca || "", Fornecedor: "", Unidade: p.unidade,
  Saldo: p.saldo_disponivel, "Preço Médio": p.preco_medio, "Preço Sugerido": p.preco_sugerido ?? "",
  "Estoque Mínimo": p.estoque_minimo, "Estoque Máximo": p.estoque_maximo ?? "", Status: p.status,
});

export function exportarProdutosExcel(produtos: Produto[]) {
  const ws = XLSX.utils.json_to_sheet(produtos.map(COLUNAS_EXCEL));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Produtos");
  XLSX.writeFile(wb, "axioma-estoque-produtos.xlsx");
}

export function exportarProdutosCsv(produtos: Produto[]) {
  const ws = XLSX.utils.json_to_sheet(produtos.map(COLUNAS_EXCEL));
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "axioma-estoque-produtos.csv"; a.click();
  URL.revokeObjectURL(url);
}

export async function importarProdutosArquivo(file: File, empresaId: string, userId: string): Promise<{ ok: number; erro?: string }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const linhas = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  if (linhas.length === 0) return { ok: 0, erro: "Planilha vazia" };

  const pega = (l: Record<string, any>, ...chaves: string[]) => {
    for (const c of chaves) if (l[c] !== undefined && l[c] !== "") return l[c];
    return "";
  };

  const registros = linhas.map((l) => ({
    empresa_id: empresaId, user_id: userId,
    nome: String(pega(l, "Nome", "nome")).trim(),
    codigo_interno: String(pega(l, "Código Interno", "codigo_interno")) || null,
    codigo_barras: String(pega(l, "Código de Barras", "codigo_barras")) || null,
    sku: String(pega(l, "SKU", "sku")) || null,
    categoria: String(pega(l, "Categoria", "categoria")) || null,
    marca: String(pega(l, "Marca", "marca")) || null,
    unidade: String(pega(l, "Unidade", "unidade")) || "UN",
    estoque_minimo: Number(pega(l, "Estoque Mínimo", "estoque_minimo")) || 0,
    status: "ativo" as const,
  })).filter((r) => r.nome);

  if (registros.length === 0) return { ok: 0, erro: "Nenhuma linha com nome válido" };
  const { data, error } = await supabase.from("produtos").insert(registros).select("id");
  if (error || !data || data.length < registros.length) {
    const motivo = error?.message || `só ${data?.length || 0} de ${registros.length} linha(s) foram gravadas (RLS?)`;
    reportarFalhaEscrita("produtos", "insert em lote (importar planilha)", motivo);
    return { ok: data?.length || 0, erro: motivo };
  }
  return { ok: registros.length };
}

// ============================================================================
// AUTO-CADASTRO POR EAN (Cosmos Bluesoft) — o token nunca chega aqui, este
// helper só fala com a nossa própria rota (app/api/produto/consulta-ean),
// que é quem guarda o COSMOS_API_TOKEN no servidor.
// ============================================================================

export type ConsultaEanResposta =
  | { status: "nao_configurado" }
  | { status: "nao_encontrado" }
  | { status: "erro"; mensagem?: string }
  | {
      status: "ok";
      nome?: string; marca?: string; categoria?: string; ncm?: string;
      peso?: number; altura?: number; largura?: number; comprimento?: number;
      ipi?: number; icms?: number; pis?: number; cofins?: number;
      precoSugerido?: number;
      imagemBase64?: string;
    };

export async function consultarEan(ean: string): Promise<ConsultaEanResposta> {
  try {
    const resp = await fetch(`/api/produto/consulta-ean?ean=${encodeURIComponent(ean)}`);
    const dados = await resp.json();
    return dados;
  } catch {
    return { status: "erro" };
  }
}
