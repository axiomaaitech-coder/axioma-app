// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: importação de XML de NF-e
// Camada de dados dedicada — nada aqui duplica lógica de outro módulo.
// Reaproveitados sem mudança: parseXMLNFe (lib/importarParsers.ts),
// buscarProdutoPorCodigo/criarProduto/atualizarProduto/criarMovimentacao
// (lib/estoqueHelpers.ts).

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// ANTI-DUPLICIDADE — chave de acesso real da NF-e (estoque_nfe_importadas)
// ============================================================================

export async function nfeJaImportada(empresaId: string, chaveAcesso: string): Promise<boolean> {
  if (!chaveAcesso) return false;
  const { data } = await supabase.from("estoque_nfe_importadas").select("id")
    .eq("empresa_id", empresaId).eq("chave_acesso", chaveAcesso).maybeSingle();
  return !!data;
}

export async function registrarNfeImportada(empresaId: string, userId: string, dados: {
  chaveAcesso: string; numeroNf?: string; fornecedorId?: string | null; valorTotal?: number; qtdItens: number;
}): Promise<{ erro?: string }> {
  const { error } = await supabase.from("estoque_nfe_importadas").insert({
    empresa_id: empresaId, user_id: userId, chave_acesso: dados.chaveAcesso,
    numero_nf: dados.numeroNf || null, fornecedor_id: dados.fornecedorId || null,
    valor_total: dados.valorTotal ?? null, qtd_itens: dados.qtdItens,
  });
  return error ? { erro: error.message } : {};
}

// ============================================================================
// FORNECEDOR — busca por CNPJ, cria automático se não existir
// ============================================================================

export type FornecedorMinimo = { id: string; nome: string };

export async function buscarFornecedorPorCnpj(empresaId: string, cnpj: string): Promise<FornecedorMinimo | null> {
  const limpo = (cnpj || "").replace(/\D/g, "");
  if (!limpo) return null;
  const { data } = await supabase.from("fornecedores").select("id, nome")
    .eq("empresa_id", empresaId).eq("documento", limpo).maybeSingle();
  return data;
}

// Mesmos campos-padrão que o cadastro manual do módulo Fornecedores já grava
// pra um fornecedor novo (produto_servico/contato/valor_mensal vazios,
// completáveis depois na tela de Fornecedores) — não inventa estrutura nova.
export async function criarFornecedorDaNfe(empresaId: string, userId: string, dados: {
  cnpj: string; razaoSocial?: string; fantasia?: string;
}): Promise<{ id?: string; erro?: string }> {
  const limpo = (dados.cnpj || "").replace(/\D/g, "");
  const nome = dados.fantasia || dados.razaoSocial || limpo;
  const { data, error } = await supabase.from("fornecedores").insert({
    empresa_id: empresaId, user_id: userId,
    nome, razao_social: dados.razaoSocial || null, nome_fantasia: dados.fantasia || null,
    documento: limpo, tipo_pessoa: "juridica", status: "ativo",
    categoria: "Outros", produto_servico: "", contato: "", valor_mensal: 0,
  }).select("id").single();
  if (error) return { erro: error.message };
  return { id: data.id };
}

// ============================================================================
// VÍNCULO POR FORNECEDOR — "código X do fornecedor = nosso produto Y"
// Ganho composto: na próxima nota do mesmo fornecedor, reconhece sozinho.
// ============================================================================

export async function buscarVinculoFornecedor(fornecedorId: string, codigoFornecedor: string): Promise<string | null> {
  if (!codigoFornecedor) return null;
  const { data } = await supabase.from("fornecedor_produtos").select("produto_id")
    .eq("fornecedor_id", fornecedorId).eq("codigo_fornecedor", codigoFornecedor).maybeSingle();
  return data?.produto_id || null;
}

export async function salvarVinculoFornecedor(fornecedorId: string, userId: string, empresaId: string | null, produtoId: string, codigoFornecedor: string): Promise<{ erro?: string }> {
  if (!codigoFornecedor) return {};
  const { error } = await supabase.from("fornecedor_produtos").upsert(
    { fornecedor_id: fornecedorId, user_id: userId, empresa_id: empresaId, produto_id: produtoId, codigo_fornecedor: codigoFornecedor, descricao: "" },
    { onConflict: "fornecedor_id,codigo_fornecedor" }
  );
  return error ? { erro: error.message } : {};
}

// ============================================================================
// CONVERSÃO FARDO/UNIDADE e MARGEM — funções puras, sem banco
// ============================================================================

// "1 fardo = X unidades": a nota vem em fardo (quantidade e custo por fardo),
// a venda é por unidade — converte os dois antes de gravar.
export function converterFardoParaUnidade(qtdFardos: number, unidadesPorFardo: number, custoFardo: number): { quantidadeUnidades: number; custoUnitario: number } {
  const un = Math.max(1, unidadesPorFardo || 1);
  return { quantidadeUnidades: qtdFardos * un, custoUnitario: custoFardo / un };
}

// Margem é sempre SUGESTÃO — quem grava o preço de venda é o dono, clicando
// salvar depois de ver o número (nunca grava sozinho).
export function precoComMargem(custo: number, margemPct: number): number {
  return custo * (1 + margemPct / 100);
}
