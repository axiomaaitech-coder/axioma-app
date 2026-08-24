// 🦅 AXIOMA AI.TECH — Contas a Pagar, Entrega 1 (Etapa 2): helpers do módulo
// dedicado. Mesmo padrão de CRUD/storage já usado em lib/fornecedorHelpers.ts
// (funções puras + supabase direto, sem RPC nova, retorno { erro? }).
// calcStatus é REAPROVEITADO de fornecedorHelpers.ts — não duplicado aqui.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { calcStatus } from "./fornecedorHelpers";
import { sugerirClassificacoes, normalizarPadraoChave } from "./importarHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export { calcStatus };

// ============================================================================
// TIPOS
// ============================================================================

export type ContaPagar = {
  id: string;
  fornecedor_id: string | null;
  descricao: string;
  numero_nota?: string | null;
  categoria?: string | null;
  valor_total: number;
  valor_pago: number;
  forma_pagamento?: string | null;
  parcelas?: number | null;
  data_emissao?: string | null;
  data_vencimento?: string | null;
  data_pagamento?: string | null;
  status?: string | null;
  observacoes?: string | null;
  centro_custo_id?: string | null;
  custo_fixo_id?: string | null;
  user_id?: string;
  empresa_id?: string | null;
  created_at?: string;
};

export type ContaPagarDocumento = {
  id: string;
  contas_pagar_id: string;
  empresa_id: string;
  user_id?: string | null;
  nome: string;
  tipo?: string | null;
  storage_path: string;
  mime_type?: string | null;
  tamanho_bytes?: number | null;
  criado_em: string;
};

export type FiltrosContasPagar = {
  status?: string;
  fornecedor_id?: string;
  categoria?: string;
  vencimento_de?: string;
  vencimento_ate?: string;
};

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// CRUD — CONTAS A PAGAR
// ============================================================================

export async function listarContasPagar(filtros: FiltrosContasPagar = {}): Promise<ContaPagar[]> {
  let q = supabase.from("contas_pagar").select("*").order("data_vencimento", { ascending: true, nullsFirst: false });
  if (filtros.status) q = q.eq("status", filtros.status);
  if (filtros.fornecedor_id) q = q.eq("fornecedor_id", filtros.fornecedor_id);
  if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
  if (filtros.vencimento_de) q = q.gte("data_vencimento", filtros.vencimento_de);
  if (filtros.vencimento_ate) q = q.lte("data_vencimento", filtros.vencimento_ate);
  const { data } = await q;
  return (data as ContaPagar[]) || [];
}

export async function criarContaPagar(userId: string, empresaId: string | null, dados: Partial<ContaPagar>): Promise<{ id?: string; erro?: string }> {
  const total = Number(dados.valor_total) || 0;
  const pago = Number(dados.valor_pago) || 0;
  const status = calcStatus(total, pago, dados.data_vencimento);
  const payload = {
    ...dados, valor_total: total, valor_pago: pago, status,
    data_pagamento: status === "pago" ? (dados.data_pagamento || new Date().toISOString().split("T")[0]) : null,
    user_id: userId, empresa_id: empresaId,
  };
  const { data, error } = await supabase.from("contas_pagar").insert(payload).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "insert", motivo);
    return { erro: motivo };
  }
  return { id: data.id };
}

export async function editarContaPagar(id: string, dados: Partial<ContaPagar>): Promise<{ erro?: string }> {
  const total = Number(dados.valor_total) || 0;
  const pago = Number(dados.valor_pago) || 0;
  const status = calcStatus(total, pago, dados.data_vencimento);
  const payload = {
    ...dados, valor_total: total, valor_pago: pago, status,
    data_pagamento: status === "pago" ? (dados.data_pagamento || new Date().toISOString().split("T")[0]) : null,
  };
  const { data, error } = await supabase.from("contas_pagar").update(payload).eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "update", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function darBaixaContaPagar(conta: ContaPagar, valorPago: number, dataPagamento: string, formaPagamento: string): Promise<{ erro?: string }> {
  const status = calcStatus(conta.valor_total, valorPago, conta.data_vencimento);
  const { data, error } = await supabase.from("contas_pagar")
    .update({ valor_pago: valorPago, data_pagamento: dataPagamento, forma_pagamento: formaPagamento, status })
    .eq("id", conta.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "update baixa", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function estornarBaixaContaPagar(conta: ContaPagar): Promise<{ erro?: string }> {
  const status = calcStatus(conta.valor_total, 0, conta.data_vencimento);
  const { data, error } = await supabase.from("contas_pagar")
    .update({ valor_pago: 0, data_pagamento: null, status })
    .eq("id", conta.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "update estorno", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function excluirContaPagar(id: string, statusAtual?: string | null): Promise<{ erro?: string }> {
  if (statusAtual === "pago") return { erro: "conta_paga" };
  const { data, error } = await supabase.from("contas_pagar").delete().eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "delete", motivo);
    return { erro: motivo };
  }
  return {};
}

// ============================================================================
// GERAR DE CUSTO FIXO — cria uma contas_pagar vinculada (custo_fixo_id), uma
// por (custo_fixo, mês). Idempotente: se já existe conta desse custo fixo
// nesse mês, não duplica — devolve jaExiste:true.
// ============================================================================

export async function gerarContaDeCustoFixo(
  userId: string, empresaId: string | null,
  custoFixo: { id: string; descricao: string; valor_mensal: number; dia_vencimento: number; categoria?: string | null; centro_custo_id?: string | null },
  mesReferencia: string, // "YYYY-MM"
): Promise<{ id?: string; erro?: string; jaExiste?: boolean }> {
  const { data: existente } = await supabase.from("contas_pagar").select("id")
    .eq("custo_fixo_id", custoFixo.id)
    .gte("data_vencimento", `${mesReferencia}-01`)
    .lte("data_vencimento", `${mesReferencia}-31`)
    .maybeSingle();
  if (existente) return { id: existente.id, jaExiste: true };

  const dia = String(Math.min(28, Math.max(1, custoFixo.dia_vencimento || 1))).padStart(2, "0");
  const dataVencimento = `${mesReferencia}-${dia}`;
  const payload = {
    fornecedor_id: null, descricao: custoFixo.descricao, categoria: custoFixo.categoria || "Outros",
    valor_total: custoFixo.valor_mensal, valor_pago: 0, data_vencimento: dataVencimento,
    status: "pendente", centro_custo_id: custoFixo.centro_custo_id || null,
    custo_fixo_id: custoFixo.id, user_id: userId, empresa_id: empresaId,
  };
  const { data, error } = await supabase.from("contas_pagar").insert(payload).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar", "insert (gerar de custo fixo)", motivo);
    return { erro: motivo };
  }
  return { id: data.id };
}

// ============================================================================
// DOCUMENTOS (anexo de boleto/NF) — mesmo padrão inline de fornecedorHelpers.ts,
// bucket próprio "contas-pagar-documentos".
// ============================================================================

export async function listarDocumentos(contasPagarId: string): Promise<ContaPagarDocumento[]> {
  const { data } = await supabase.from("contas_pagar_documentos").select("*")
    .eq("contas_pagar_id", contasPagarId).order("criado_em", { ascending: false });
  return (data as ContaPagarDocumento[]) || [];
}

export async function anexarDocumento(
  file: File, contasPagarId: string, userId: string, empresaId: string, tipo: string,
): Promise<{ id?: string; erro?: string }> {
  const timestamp = Date.now();
  const nomeArquivo = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${empresaId}/${contasPagarId}/${timestamp}-${nomeArquivo}`;
  const { error: erroUpload } = await supabase.storage.from("contas-pagar-documentos")
    .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream" });
  if (erroUpload) {
    reportarFalhaEscrita("contas-pagar-documentos (storage)", "upload", erroUpload.message);
    return { erro: erroUpload.message };
  }
  const { data, error } = await supabase.from("contas_pagar_documentos").insert({
    contas_pagar_id: contasPagarId, empresa_id: empresaId, user_id: userId,
    nome: file.name, tipo, storage_path: path, mime_type: file.type || null, tamanho_bytes: file.size,
  }).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar_documentos", "insert", motivo);
    return { erro: motivo };
  }
  return { id: data.id };
}

export async function excluirDocumento(doc: ContaPagarDocumento): Promise<{ erro?: string }> {
  if (doc.storage_path) await supabase.storage.from("contas-pagar-documentos").remove([doc.storage_path]);
  const { data, error } = await supabase.from("contas_pagar_documentos").delete().eq("id", doc.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contas_pagar_documentos", "delete", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function gerarUrlDocumento(path: string, segundos: number = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from("contas-pagar-documentos").createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

// ============================================================================
// CLASSIFICAÇÃO AUTOMÁTICA — reaproveita 100% o motor de aprendizado do
// Importar Documentos (sugerirClassificacoes), sem duplicar a lógica.
// ============================================================================

export async function classificarCategoria(empresaId: string | null, descricao: string): Promise<string | null> {
  if (!empresaId || !descricao.trim()) return null;
  const mapa = await sugerirClassificacoes(empresaId, [descricao]);
  return mapa.get(normalizarPadraoChave(descricao))?.categoria || null;
}

// ============================================================================
// ANTI-DUPLICAÇÃO — checa se a NF-e já entrou pelo PDV (estoque_nfe_importadas)
// antes de virar conta a pagar, pra não duplicar a mesma compra nos dois lados.
// ============================================================================

export type NfeJaImportada = { id: string; numero_nf: string | null; fornecedor_id: string | null; created_at: string };

export async function checarNfeJaImportadaNoPdv(empresaId: string, chaveAcesso: string): Promise<NfeJaImportada | null> {
  if (!chaveAcesso) return null;
  const { data } = await supabase.from("estoque_nfe_importadas").select("id, numero_nf, fornecedor_id, created_at")
    .eq("empresa_id", empresaId).eq("chave_acesso", chaveAcesso).maybeSingle();
  return (data as NfeJaImportada) || null;
}

// ============================================================================
// ENTREGA 2 — INTELIGÊNCIA BÁSICA
// ============================================================================

// ----------------------------------------------------------------------------
// CONFIG AP — 1 linha por empresa (empresa_config_ap). Sem linha ainda =
// usa os mesmos defaults do banco (nunca trava a empresa por falta de config).
// ----------------------------------------------------------------------------

export type ConfigAp = {
  limite_aprovacao_automatica: number;
  aprovadores: string[];
  bloquear_duplicata: boolean;
  dias_janela_duplicata: number;
};

const CONFIG_AP_PADRAO: ConfigAp = {
  limite_aprovacao_automatica: 500, aprovadores: [], bloquear_duplicata: true, dias_janela_duplicata: 30,
};

export async function obterConfigAp(empresaId: string): Promise<ConfigAp> {
  const { data } = await supabase.from("empresa_config_ap")
    .select("limite_aprovacao_automatica, aprovadores, bloquear_duplicata, dias_janela_duplicata")
    .eq("empresa_id", empresaId).maybeSingle();
  if (!data) return { ...CONFIG_AP_PADRAO };
  return {
    limite_aprovacao_automatica: Number(data.limite_aprovacao_automatica) || CONFIG_AP_PADRAO.limite_aprovacao_automatica,
    aprovadores: data.aprovadores || [],
    bloquear_duplicata: data.bloquear_duplicata ?? CONFIG_AP_PADRAO.bloquear_duplicata,
    dias_janela_duplicata: Number(data.dias_janela_duplicata) || CONFIG_AP_PADRAO.dias_janela_duplicata,
  };
}

export async function salvarConfigAp(empresaId: string, config: ConfigAp): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("empresa_config_ap")
    .upsert({ empresa_id: empresaId, ...config, atualizado_em: new Date().toISOString() }, { onConflict: "empresa_id" })
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("empresa_config_ap", "upsert", motivo);
    return { erro: motivo };
  }
  return {};
}

// ----------------------------------------------------------------------------
// DETECÇÃO DE DUPLICIDADE — RPC ap_detectar_duplicata (mesmo fornecedor +
// valor ±1% na janela, ou mesmo número de nota). Score >=70 = aviso,
// score >=90 (+ bloquear_duplicata) = trava por padrão no client (Commit 2).
// ----------------------------------------------------------------------------

export type DuplicataDetectada = {
  contas_pagar_id: string; descricao: string; numero_nota: string | null;
  valor_total: number; data_emissao: string | null; data_vencimento: string | null; score: number;
};

export async function detectarDuplicata(params: {
  empresaId: string; fornecedorId: string | null; valorTotal: number; dataEmissao: string; numeroNota?: string | null; diasJanela?: number;
}): Promise<{ duplicatas: DuplicataDetectada[]; erro?: string }> {
  const { data, error } = await supabase.rpc("ap_detectar_duplicata", {
    p_empresa_id: params.empresaId, p_fornecedor_id: params.fornecedorId, p_valor_total: params.valorTotal,
    p_data_emissao: params.dataEmissao, p_numero_nota: params.numeroNota || null, p_dias_janela: params.diasJanela ?? 30,
  });
  if (error) {
    reportarFalhaEscrita("ap_detectar_duplicata", "rpc", error.message);
    return { duplicatas: [], erro: error.message };
  }
  return { duplicatas: (data as DuplicataDetectada[]) || [] };
}

// ----------------------------------------------------------------------------
// AUDITORIA MANUAL — eventos que não são INSERT/UPDATE/DELETE de verdade
// (o trigger já cobre criou/editou/baixou/estornou/excluiu sozinho).
// ----------------------------------------------------------------------------

export async function registrarAuditoriaAp(contasPagarId: string, acao: string, antes?: any, depois?: any): Promise<{ erro?: string }> {
  const { error } = await supabase.rpc("ap_registrar_auditoria", {
    p_contas_pagar_id: contasPagarId, p_acao: acao, p_antes: antes ?? null, p_depois: depois ?? null,
  });
  if (error) {
    reportarFalhaEscrita("ap_registrar_auditoria", "rpc", error.message);
    return { erro: error.message };
  }
  return {};
}
