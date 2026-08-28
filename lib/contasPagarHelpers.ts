// 🦅 AXIOMA AI.TECH — Contas a Pagar, Entrega 1 (Etapa 2): helpers do módulo
// dedicado. Mesmo padrão de CRUD/storage já usado em lib/fornecedorHelpers.ts
// (funções puras + supabase direto, sem RPC nova, retorno { erro? }).
// calcStatus é REAPROVEITADO de fornecedorHelpers.ts — não duplicado aqui.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { calcStatus } from "./fornecedorHelpers";
import { sugerirClassificacoes, normalizarPadraoChave } from "./importarHelpers";
import { detectarRupturaCaixa, proximaOcorrenciaDoDia, projetarRecorrenciaMensal, type EventoCaixa, type RupturaCaixa } from "./cfoCore";

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
  taxa_multa_mensal?: number | null;
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

export async function listarContasPagar(empresaId: string, filtros: FiltrosContasPagar = {}): Promise<ContaPagar[]> {
  let q = supabase.from("contas_pagar").select("*").eq("empresa_id", empresaId).order("data_vencimento", { ascending: true, nullsFirst: false });
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
  if (conta.status === "aguardando_aprovacao") return { erro: "aguardando_aprovacao" };
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
  let qExistente = supabase.from("contas_pagar").select("id")
    .eq("custo_fixo_id", custoFixo.id)
    .gte("data_vencimento", `${mesReferencia}-01`)
    .lte("data_vencimento", `${mesReferencia}-31`);
  if (empresaId) qExistente = qExistente.eq("empresa_id", empresaId);
  const { data: existente } = await qExistente.maybeSingle();
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

export async function listarDocumentos(contasPagarId: string, empresaId: string): Promise<ContaPagarDocumento[]> {
  const { data } = await supabase.from("contas_pagar_documentos").select("*")
    .eq("contas_pagar_id", contasPagarId).eq("empresa_id", empresaId).order("criado_em", { ascending: false });
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

// ----------------------------------------------------------------------------
// ENTREGA 3, COMMIT 1 — AP FORECAST MULTI-HORIZONTE (7/30/60/90 dias).
// Generaliza a antiga calcularImpactoCaixa (Entrega 2, horizonte único de
// 30d) num array de horizontes, reaproveitando 100% o mesmo motor do Fluxo
// de Caixa (cfoCore.ts: detectarRupturaCaixa/projetarRecorrenciaMensal) e o
// dedup de custo fixo da Entrega 1. Nenhuma RPC — mesmo motivo de
// diagnóstico da Entrega 2 (regra de negócio fica só em TS, nunca duplicada
// em SQL).
//
// Cenário pessimista: NÃO é margem arbitrária. É o fator real de sobretaxa
// que a PRÓPRIA empresa já pagou historicamente em contas quitadas com
// atraso E com taxa_multa_mensal configurada — (valor_pago - valor_total) /
// valor_total, média das ocorrências reais. Sem amostra (empresa nova, ou
// nunca atrasou com multa combinada), o fator fica 0 e o pessimista some no
// otimista — nunca inventa um número. Cenário otimista = o valor agendado
// exato (pagamento em dia, sem multa) — não usa desconto_disponivel_pct
// aqui (isso é Value Recovery, Commit 5; misturar os dois nesta função
// duplicaria a mesma leitura de dado em dois lugares diferentes).
// ----------------------------------------------------------------------------

export type HorizonteForecastDias = 7 | 30 | 60 | 90;
export const HORIZONTES_FORECAST_AP: HorizonteForecastDias[] = [7, 30, 60, 90];

export type PontoForecastAp = {
  horizonteDias: HorizonteForecastDias;
  saldoProjetadoOtimista: number;
  saldoProjetadoPessimista: number;
  saldoProjetadoSemPagamentos: number;
  ruptura: RupturaCaixa | null;
};

export type ForecastAp = {
  saldoAtual: number;
  fatorAtrasoHistoricoPct: number;
  amostraAtrasoHistorico: number;
  amostraAtrasoSuficiente: boolean;
  pontos: PontoForecastAp[];
};

// Mesmo critério de "amostra suficiente pra confiar num número" já usado em
// scoreMedioCarteiraAxioma (fornecedorHelpers.ts) — menos que isso, o dado é
// real mas raso demais pra virar um percentual exibido com confiança.
const AMOSTRA_MINIMA_ATRASO = 3;

// Sobretaxa real média que a empresa já pagou em contas quitadas com atraso
// E com multa combinada (taxa_multa_mensal preenchida). Ignora contas sem
// esses dois dados — "sem dado não penaliza", mesmo princípio do Score
// Axioma de Fornecedores e da Entrega 2.
function calcularFatorAtrasoHistorico(contasPagas: { valor_total: number; valor_pago: number; data_pagamento: string | null; data_vencimento: string | null; taxa_multa_mensal: number | null }[]): { fator: number; amostra: number } {
  const atrasadasComMulta = contasPagas.filter((c) =>
    c.data_pagamento && c.data_vencimento && c.data_pagamento > c.data_vencimento &&
    Number(c.taxa_multa_mensal) > 0 && Number(c.valor_total) > 0
  );
  if (atrasadasComMulta.length === 0) return { fator: 0, amostra: 0 };
  const soma = atrasadasComMulta.reduce((s, c) => {
    const sobretaxa = (Number(c.valor_pago) - Number(c.valor_total)) / Number(c.valor_total);
    return s + Math.max(0, sobretaxa);
  }, 0);
  return { fator: soma / atrasadasComMulta.length, amostra: atrasadasComMulta.length };
}

export async function calcularForecastAp(empresaId: string): Promise<ForecastAp> {
  const hoje = new Date().toISOString().split("T")[0];
  const maxHorizonte = Math.max(...HORIZONTES_FORECAST_AP);

  const [{ data: fc }, { data: cr }, { data: cp }, { data: cf }, { data: cpPagas }] = await Promise.all([
    supabase.from("fluxo_caixa").select("valor, tipo, status").eq("empresa_id", empresaId),
    supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento").eq("empresa_id", empresaId).neq("status", "recebido"),
    supabase.from("contas_pagar").select("valor_total, valor_pago, status, data_vencimento, custo_fixo_id").eq("empresa_id", empresaId),
    supabase.from("custos_fixos").select("id, valor_mensal, dia_vencimento").eq("empresa_id", empresaId),
    supabase.from("contas_pagar").select("valor_total, valor_pago, data_pagamento, data_vencimento, taxa_multa_mensal").eq("empresa_id", empresaId).eq("status", "pago"),
  ]);

  const saldoAtual = (fc || []).filter((l: any) => l.status === "realizado")
    .reduce((s: number, l: any) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);

  const entradas: EventoCaixa[] = (cr || [])
    .filter((c: any) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c: any) => ({ data: c.data_vencimento, valor: Math.max(0, Number(c.valor || 0) - Number(c.valor_recebido || 0)) }))
    .filter((e: EventoCaixa) => e.valor > 0);

  const saidasContasPagar: EventoCaixa[] = (cp || [])
    .filter((c: any) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c: any) => ({ data: c.data_vencimento, valor: Math.max(0, Number(c.valor_total || 0) - Number(c.valor_pago || 0)) }))
    .filter((e: EventoCaixa) => e.valor > 0);

  // Mesma regra de dedup do Fluxo de Caixa: custo fixo do mês que já virou
  // contas_pagar não entra 2x (uma vez como conta a pagar, outra como
  // projeção do custo fixo).
  const mesesJaGerados = new Set(
    (cp || []).filter((c: any) => c.custo_fixo_id && c.data_vencimento).map((c: any) => `${c.custo_fixo_id}|${String(c.data_vencimento).slice(0, 7)}`)
  );
  const saidasCustosFixos: EventoCaixa[] = (cf || []).flatMap((c: any) => {
    if (!c.valor_mensal || !c.dia_vencimento) return [];
    const proxima = proximaOcorrenciaDoDia(Number(c.dia_vencimento));
    return projetarRecorrenciaMensal(Number(c.valor_mensal), proxima, maxHorizonte)
      .filter((ev) => !mesesJaGerados.has(`${c.id}|${ev.data.slice(0, 7)}`));
  });

  const saidasComPagamentos = [...saidasContasPagar, ...saidasCustosFixos];

  // Um único cálculo no horizonte máximo — a primeira ruptura encontrada
  // dentro de 90d também é a primeira dentro de qualquer horizonte menor
  // que a contenha; não precisa rodar detectarRupturaCaixa 4 vezes.
  const rupturaNoMax = detectarRupturaCaixa(saldoAtual, entradas, saidasComPagamentos, maxHorizonte);

  const { fator: fatorAtraso, amostra: amostraAtraso } = calcularFatorAtrasoHistorico((cpPagas as any[]) || []);

  const dentroDoHorizonte = (e: EventoCaixa, horizonteDias: number) => {
    const dias = Math.round((new Date(e.data + "T00:00:00").getTime() - new Date(hoje + "T00:00:00").getTime()) / 86400000);
    return dias >= 0 && dias <= horizonteDias;
  };
  const somaNoHorizonte = (eventos: EventoCaixa[], horizonteDias: number) =>
    eventos.filter((e) => dentroDoHorizonte(e, horizonteDias)).reduce((s, e) => s + e.valor, 0);

  const pontos: PontoForecastAp[] = HORIZONTES_FORECAST_AP.map((horizonteDias) => {
    const totalEntradas = somaNoHorizonte(entradas, horizonteDias);
    const totalSaidasCustosFixos = somaNoHorizonte(saidasCustosFixos, horizonteDias);
    const totalSaidasContasPagar = somaNoHorizonte(saidasContasPagar, horizonteDias);
    const saldoOtimista = saldoAtual + totalEntradas - totalSaidasCustosFixos - totalSaidasContasPagar;
    // Só as saídas de contas_pagar levam a sobretaxa de atraso — custo fixo
    // recorrente não carrega multa (é o mesmo valor todo mês, por natureza).
    const saldoPessimista = saldoOtimista - totalSaidasContasPagar * fatorAtraso;
    return {
      horizonteDias,
      saldoProjetadoOtimista: saldoOtimista,
      saldoProjetadoPessimista: saldoPessimista,
      saldoProjetadoSemPagamentos: saldoAtual + totalEntradas - totalSaidasCustosFixos,
      ruptura: rupturaNoMax && rupturaNoMax.diasRestantes <= horizonteDias ? rupturaNoMax : null,
    };
  });

  return {
    saldoAtual,
    fatorAtrasoHistoricoPct: Math.round(fatorAtraso * 1000) / 10,
    amostraAtrasoHistorico: amostraAtraso,
    amostraAtrasoSuficiente: amostraAtraso >= AMOSTRA_MINIMA_ATRASO,
    pontos,
  };
}

// ----------------------------------------------------------------------------
// PRIORIDADE DE PAGAMENTO — mesmo padrão de filaCobrancaPriorizada
// (cobrancaHelpers.ts): função pura sobre dados já carregados pela tela,
// sem fetch/RPC próprios. Score = proximidade_vencimento (40%) +
// juros_por_atraso (30%, taxa_multa_mensal — sem dado = 0, nunca inventado)
// + criticidade_fornecedor (20%, nivel_dependencia='alto') + valor_alto (10%,
// relativo à maior conta pendente do lote).
// ----------------------------------------------------------------------------

export type ItemPrioridadePagamento = { conta: ContaPagar; score: number; explicacao: string };

export function priorizarPagamentos(
  contas: ContaPagar[],
  fornecedores: { id: string; nivel_dependencia?: string | null }[],
  lang: "pt" | "en" | "es" = "pt",
): ItemPrioridadePagamento[] {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const pendentes = contas.filter((c) => c.status !== "pago" && c.status !== "aguardando_aprovacao");
  if (pendentes.length === 0) return [];

  const hoje = new Date().toISOString().slice(0, 10);
  const maiorValor = Math.max(...pendentes.map((c) => c.valor_total || 0), 1);
  const fornecedorDe = (id?: string | null) => fornecedores.find((f) => f.id === id) || null;

  return pendentes.map((c) => {
    const diasParaVencer = c.data_vencimento
      ? Math.round((new Date(c.data_vencimento + "T00:00:00").getTime() - new Date(hoje + "T00:00:00").getTime()) / 86400000)
      : 999;
    const fatorVencimento = diasParaVencer <= 0 ? 100 : Math.max(0, 100 - (Math.min(diasParaVencer, 30) / 30) * 100);
    const taxaMulta = Number(c.taxa_multa_mensal) || 0;
    const fatorJuros = Math.min(100, taxaMulta * 20);
    const nivelDep = fornecedorDe(c.fornecedor_id)?.nivel_dependencia;
    const fatorCriticidade = nivelDep === "alto" ? 100 : nivelDep === "medio" ? 50 : 0;
    const fatorValor = ((c.valor_total || 0) / maiorValor) * 100;
    const score = Math.round(fatorVencimento * 0.4 + fatorJuros * 0.3 + fatorCriticidade * 0.2 + fatorValor * 0.1);

    const motivos: string[] = [];
    if (diasParaVencer < 0) motivos.push(L(`vencida há ${Math.abs(diasParaVencer)} dias`, `overdue by ${Math.abs(diasParaVencer)} days`, `vencida hace ${Math.abs(diasParaVencer)} días`));
    else if (diasParaVencer <= 7) motivos.push(L(`vence em ${diasParaVencer} dias`, `due in ${diasParaVencer} days`, `vence en ${diasParaVencer} días`));
    if (taxaMulta > 0) motivos.push(L(`juros ${taxaMulta}%/mês`, `${taxaMulta}%/mo. interest`, `interés ${taxaMulta}%/mes`));
    if (nivelDep === "alto") motivos.push(L("fornecedor essencial", "essential supplier", "proveedor esencial"));
    if (fatorValor >= 80) motivos.push(L("valor alto", "high amount", "monto alto"));

    return { conta: c, score, explicacao: motivos.join(" + ") || L("prioridade baixa", "low priority", "prioridad baja") };
  }).sort((a, b) => b.score - a.score);
}

// ----------------------------------------------------------------------------
// CONFIGURAÇÃO AP — CRUD já coberto por obterConfigAp/salvarConfigAp acima.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// APROVAÇÃO — RPCs ap_solicitar_aprovacao / ap_decidir_aprovacao. O status da
// contas_pagar (pendente ↔ aguardando_aprovacao) é resolvido dentro das
// próprias RPCs (ver SQL da Entrega 2) — o client só chama e recarrega.
// ----------------------------------------------------------------------------

export async function solicitarAprovacao(contasPagarId: string): Promise<{ status?: string; erro?: string }> {
  const { data, error } = await supabase.rpc("ap_solicitar_aprovacao", { p_contas_pagar_id: contasPagarId });
  if (error) {
    reportarFalhaEscrita("ap_solicitar_aprovacao", "rpc", error.message);
    return { erro: error.message };
  }
  const linha = Array.isArray(data) ? data[0] : data;
  return { status: linha?.status };
}

export type AprovacaoPendente = {
  id: string; contas_pagar_id: string; empresa_id: string; solicitante_id: string; aprovador_id: string | null;
  valor: number; status: string; motivo: string | null; decidido_em: string | null; criado_em: string;
  contas_pagar?: { descricao: string; valor_total: number; data_vencimento: string | null; fornecedor_id: string | null } | null;
};

export async function listarAprovacoesPendentes(empresaId: string): Promise<AprovacaoPendente[]> {
  const { data } = await supabase.from("contas_pagar_aprovacao")
    .select("*, contas_pagar(descricao, valor_total, data_vencimento, fornecedor_id)")
    .eq("empresa_id", empresaId).eq("status", "pendente").order("criado_em", { ascending: true });
  return (data as AprovacaoPendente[]) || [];
}

export async function decidirAprovacao(aprovacaoId: string, decisao: "aprovada" | "rejeitada", motivo?: string): Promise<{ erro?: string }> {
  const { error } = await supabase.rpc("ap_decidir_aprovacao", { p_aprovacao_id: aprovacaoId, p_decisao: decisao, p_motivo: motivo || null });
  if (error) {
    reportarFalhaEscrita("ap_decidir_aprovacao", "rpc", error.message);
    return { erro: error.message };
  }
  return {};
}

// ----------------------------------------------------------------------------
// AUDITORIA — leitura da timeline por conta (o trigger já grava tudo
// automaticamente, ver Entrega 2 SQL Parte 6; RLS já filtra por empresa).
// ----------------------------------------------------------------------------

export type AuditoriaAp = {
  id: string; contas_pagar_id: string; empresa_id: string; usuario_id: string | null;
  acao: string; antes: any; depois: any; ip: string | null; criado_em: string;
};

export async function listarAuditoriaConta(contasPagarId: string, empresaId: string): Promise<AuditoriaAp[]> {
  const { data } = await supabase.from("contas_pagar_auditoria").select("*")
    .eq("contas_pagar_id", contasPagarId).eq("empresa_id", empresaId).order("criado_em", { ascending: false });
  return (data as AuditoriaAp[]) || [];
}
