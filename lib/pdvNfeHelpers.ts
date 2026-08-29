// 🦅 AXIOMA AI.TECH — PDV Fase 2.1: importação de XML de NF-e
// Camada de dados dedicada — nada aqui duplica lógica de outro módulo.
// Reaproveitados sem mudança: parseXMLNFe (lib/importarParsers.ts),
// buscarProdutoPorCodigo/criarProduto/atualizarProduto/criarMovimentacao
// (lib/estoqueHelpers.ts).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import type { ItemNFe } from "./importarParsers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear a escrita e devolver 0 linhas SEM error do Postgres —
// .select("id") é o que permite enxergar essa falha silenciosa.
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// ANTI-DUPLICIDADE — chave de acesso real da NF-e (estoque_nfe_importadas)
// ============================================================================

export async function nfeJaImportada(empresaId: string, chaveAcesso: string): Promise<boolean> {
  if (!chaveAcesso) return false;
  const { data } = await supabase.from("estoque_nfe_importadas").select("id")
    .eq("empresa_id", empresaId).eq("chave_acesso", chaveAcesso).maybeSingle();
  return !!data;
}

// Caminho ÚNICO de gravação de NF-e — PDV (importar-nfe) e Contas a Pagar
// chamam esta mesma função, nunca gravam estoque_nfe_importadas/nfe_itens
// por conta própria. Cabeçalho + linha-a-linha (nfe_itens) na mesma chamada,
// pra o motor de match sempre ter o detalhe da nota disponível, não importa
// por qual tela ela entrou.
export async function registrarNfeComItens(empresaId: string, userId: string, dados: {
  chaveAcesso: string; numeroNf?: string; fornecedorId?: string | null; valorTotal?: number; itens: ItemNFe[];
}): Promise<{ id?: string; itensIds?: (string | null)[]; erro?: string }> {
  const { data: nfe, error: erroNfe } = await supabase.from("estoque_nfe_importadas").insert({
    empresa_id: empresaId, user_id: userId, chave_acesso: dados.chaveAcesso,
    numero_nf: dados.numeroNf || null, fornecedor_id: dados.fornecedorId || null,
    valor_total: dados.valorTotal ?? null, qtd_itens: dados.itens.length,
  }).select("id").single();
  if (erroNfe || !nfe) {
    const motivo = erroNfe?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("estoque_nfe_importadas", "insert", motivo);
    return { erro: motivo };
  }

  if (dados.itens.length === 0) return { id: nfe.id, itensIds: [] };

  const linhas = dados.itens.map((item, i) => ({
    empresa_id: empresaId, nfe_importada_id: nfe.id, numero_linha: i + 1,
    codigo_fornecedor: item.codigoFornecedor || null, ean: item.ean || null, descricao: item.descricao,
    ncm: item.ncm || null, cfop: item.cfop || null, unidade: item.unidade || null,
    quantidade: item.quantidade, valor_unitario: item.valorUnitario, valor_total: item.valorTotal,
    numero_lote: item.numeroLote || null, data_validade: item.dataValidade || null,
  }));
  const { data: itensGravados, error: erroItens } = await supabase.from("nfe_itens").insert(linhas).select("id, numero_linha");
  if (erroItens || !itensGravados || itensGravados.length !== linhas.length) {
    const motivo = erroItens?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("nfe_itens", "insert", motivo);
    return { id: nfe.id, erro: motivo };
  }
  // Mapeia por numero_linha em vez de confiar na ordem de retorno do insert —
  // o Postgres não garante ordem de linhas pra um INSERT multi-valores.
  const porLinha = new Map(itensGravados.map((r: any) => [r.numero_linha, r.id as string]));
  const itensIds = dados.itens.map((_, i) => porLinha.get(i + 1) ?? null);
  return { id: nfe.id, itensIds };
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
  const { data, error } = await supabase.from("fornecedor_produtos").upsert(
    { fornecedor_id: fornecedorId, user_id: userId, empresa_id: empresaId, produto_id: produtoId, codigo_fornecedor: codigoFornecedor, descricao: "" },
    { onConflict: "fornecedor_id,codigo_fornecedor" }
  ).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("fornecedor_produtos", "upsert (vínculo NF-e)", motivo);
    return { erro: motivo };
  }
  return {};
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
