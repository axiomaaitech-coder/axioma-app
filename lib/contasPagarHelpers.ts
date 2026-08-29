// 🦅 AXIOMA AI.TECH — Contas a Pagar, Entrega 1 (Etapa 2): helpers do módulo
// dedicado. Mesmo padrão de CRUD/storage já usado em lib/fornecedorHelpers.ts
// (funções puras + supabase direto, sem RPC nova, retorno { erro? }).
// calcStatus é REAPROVEITADO de fornecedorHelpers.ts — não duplicado aqui.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { calcStatus, precoAcimaMediaInterna, listarContratos, type FornecedorRow, type FornecedorPrecoAlto, type FornecedorContrato } from "./fornecedorHelpers";
import { sugerirClassificacoes, normalizarPadraoChave } from "./importarHelpers";
import { detectarRupturaCaixa, proximaOcorrenciaDoDia, projetarRecorrenciaMensal, normalizarTexto, fBRL, type EventoCaixa, type RupturaCaixa, type AnomaliaHistorica } from "./cfoCore";
import { registrarAuditoriaCentro } from "./centroCustoHelpers";

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
  chave_acesso?: string | null;
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
  desconto_disponivel_pct?: number | null;
  desconto_data_limite?: string | null;
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
type ContaPagaParaFatorAtraso = { valor_total: number; valor_pago: number; data_pagamento: string | null; data_vencimento: string | null; taxa_multa_mensal: number | null };

function calcularFatorAtrasoHistorico(contasPagas: ContaPagaParaFatorAtraso[]): { fator: number; amostra: number } {
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

// Núcleo puro do forecast — extraído pra ser o ÚNICO motor de cálculo de
// caixa do módulo. calcularForecastAp usa direto; a simulação de
// antecipação em conjunto (avaliarAntecipacaoConjunta, mais abaixo) também
// usa, só com a série de saídas de contas_pagar remontada — nunca um
// segundo cálculo de caixa que poderia discordar deste.
function computarPontosForecast(
  saldoAtual: number,
  entradas: EventoCaixa[],
  saidasContasPagar: EventoCaixa[],
  saidasCustosFixos: EventoCaixa[],
  fatorAtraso: number,
  hoje: string,
): { pontos: PontoForecastAp[]; rupturaNoMax: RupturaCaixa | null } {
  const maxHorizonte = Math.max(...HORIZONTES_FORECAST_AP);
  const saidasComPagamentos = [...saidasContasPagar, ...saidasCustosFixos];

  // Um único cálculo no horizonte máximo — a primeira ruptura encontrada
  // dentro de 90d também é a primeira dentro de qualquer horizonte menor
  // que a contenha; não precisa rodar detectarRupturaCaixa 4 vezes.
  const rupturaNoMax = detectarRupturaCaixa(saldoAtual, entradas, saidasComPagamentos, maxHorizonte);

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

  return { pontos, rupturaNoMax };
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

  const { fator: fatorAtraso, amostra: amostraAtraso } = calcularFatorAtrasoHistorico((cpPagas as ContaPagaParaFatorAtraso[]) || []);

  const { pontos } = computarPontosForecast(saldoAtual, entradas, saidasContasPagar, saidasCustosFixos, fatorAtraso, hoje);

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

// ----------------------------------------------------------------------------
// ENTREGA 3, COMMIT 3 — RECURRING EXPENSE INTELLIGENCE. Função pura sobre as
// contas já carregadas pela tela (mesmo padrão de priorizarPagamentos, sem
// fetch próprio). Agrupa por fornecedor + normalizarPadraoChave(descricao) —
// mesma normalização de texto do motor de aprendizado do Importar Documentos
// (importarHelpers.ts), reaproveitada aqui pra não reescrever a lógica de
// "que texto é essa a mesma despesa" duas vezes. Conta sem fornecedor, sem
// vencimento, sem valor ou já vinculada a um custo_fixo_id fica de fora —
// já é recorrência conhecida ou não tem dado suficiente pra afirmar nada.
// ----------------------------------------------------------------------------

const OCORRENCIAS_MINIMAS_RECORRENCIA = 3;
// ±10% — cobre a variação normal de conta de consumo (água/luz) sem deixar
// passar duas despesas de valor bem diferente como se fossem o mesmo padrão.
const TOLERANCIA_VALOR_RECORRENCIA_PCT = 0.10;

export type PeriodicidadeRecorrencia = "semanal" | "quinzenal" | "mensal" | "trimestral" | "outra";

// custos_fixos (tabela reaproveitada) só modela recorrência MENSAL
// (valor_mensal + dia_vencimento). Virar Custo Fixo só é oferecido pra quem
// bate nessa janela — do contrário uma despesa trimestral vinculada ali
// passaria a gerar conta TODO mês (3x o valor real), um bug silencioso.
// Suportar outras periodicidades exige campo novo em custos_fixos (schema).
function classificarPeriodicidade(intervaloMedioDias: number): PeriodicidadeRecorrencia {
  if (intervaloMedioDias >= 6 && intervaloMedioDias <= 8) return "semanal";
  if (intervaloMedioDias >= 13 && intervaloMedioDias <= 16) return "quinzenal";
  if (intervaloMedioDias >= 27 && intervaloMedioDias <= 33) return "mensal";
  if (intervaloMedioDias >= 85 && intervaloMedioDias <= 95) return "trimestral";
  return "outra";
}

export type PadraoRecorrenteDetectado = {
  fornecedorId: string;
  descricaoExemplo: string;
  categoria: string | null;
  centroCustoId: string | null;
  ocorrencias: number;
  valorMedio: number;
  intervaloMedioDias: number;
  periodicidade: PeriodicidadeRecorrencia;
  podeVirarCustoFixo: boolean;
  idsContas: string[];
  ultimaConta: ContaPagar;
};

export function detectarDespesasRecorrentes(contas: ContaPagar[]): PadraoRecorrenteDetectado[] {
  const elegiveis = contas.filter((c) =>
    c.fornecedor_id && !c.custo_fixo_id && c.data_vencimento && Number(c.valor_total) > 0
  );

  const grupos = new Map<string, ContaPagar[]>();
  elegiveis.forEach((c) => {
    const chaveDescricao = normalizarPadraoChave(c.descricao || "");
    if (!chaveDescricao) return; // sem texto suficiente pra afirmar "é o mesmo padrão"
    const chave = `${c.fornecedor_id}|${chaveDescricao}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(c);
  });

  const padroes: PadraoRecorrenteDetectado[] = [];
  grupos.forEach((lista) => {
    if (lista.length < OCORRENCIAS_MINIMAS_RECORRENCIA) return;

    const ordenadas = [...lista].sort((a, b) => (a.data_vencimento || "").localeCompare(b.data_vencimento || ""));
    const valores = ordenadas.map((c) => Number(c.valor_total));
    const valorMedio = valores.reduce((s, v) => s + v, 0) / valores.length;
    if (valorMedio <= 0) return;
    const valorRegular = valores.every((v) => Math.abs(v - valorMedio) / valorMedio <= TOLERANCIA_VALOR_RECORRENCIA_PCT);
    if (!valorRegular) return;

    const intervalos: number[] = [];
    for (let i = 1; i < ordenadas.length; i++) {
      const dias = Math.round(
        (new Date(ordenadas[i].data_vencimento + "T00:00:00").getTime() - new Date(ordenadas[i - 1].data_vencimento + "T00:00:00").getTime()) / 86400000
      );
      intervalos.push(dias);
    }
    const intervaloMedio = intervalos.reduce((s, v) => s + v, 0) / intervalos.length;
    if (intervaloMedio <= 0) return;
    // Tolera vencimento caindo em fim de semana / mês de 28 a 31 dias — não
    // exige intervalo exato ao dia, só que não fuja demais da própria média.
    const toleranciaDias = Math.max(5, intervaloMedio * 0.2);
    const intervaloRegular = intervalos.every((d) => Math.abs(d - intervaloMedio) <= toleranciaDias);
    if (!intervaloRegular) return;

    const ultimaConta = ordenadas[ordenadas.length - 1];
    const periodicidade = classificarPeriodicidade(intervaloMedio);
    padroes.push({
      fornecedorId: ultimaConta.fornecedor_id as string,
      descricaoExemplo: ultimaConta.descricao,
      categoria: ultimaConta.categoria || null,
      centroCustoId: ultimaConta.centro_custo_id || null,
      ocorrencias: ordenadas.length,
      valorMedio,
      intervaloMedioDias: Math.round(intervaloMedio),
      periodicidade,
      podeVirarCustoFixo: periodicidade === "mensal",
      idsContas: ordenadas.map((c) => c.id),
      ultimaConta,
    });
  });

  return padroes.sort((a, b) => b.valorMedio - a.valorMedio);
}

// ----------------------------------------------------------------------------
// TRANSFORMAR PADRÃO EM CUSTO FIXO — sempre por confirmação explícita do
// dono (é sugestão, nunca ação automática). Cria a linha em custos_fixos
// (mesmo formato de payload da tela Custos Fixos), audita via
// registrarAuditoriaCentro (reaproveitado de centroCustoHelpers.ts, mesma
// trilha que a tela de Custos Fixos já usa), vincula as contas de origem ao
// novo custo_fixo_id (pra não sugerir de novo o que já virou custo fixo, e
// pra não gerar duplicata no mês corrente — mesma regra de
// gerarContaDeCustoFixo) e por fim gera a conta do mês corrente reaproveitando
// gerarContaDeCustoFixo (já existe, já dedupa por mês — nenhuma função nova
// de geração de custo fixo).
// ----------------------------------------------------------------------------

export type NovoCustoFixoDePadrao = {
  descricao: string;
  valorMensal: number;
  diaVencimento: number;
  categoria?: string | null;
  centroCustoId?: string | null;
};

export async function transformarPadraoEmCustoFixo(
  userId: string,
  empresaId: string,
  dados: NovoCustoFixoDePadrao,
  idsContasOrigem: string[],
  mesReferencia: string, // "YYYY-MM"
): Promise<{ custoFixoId?: string; contaGeradaId?: string; erro?: string }> {
  const payload = {
    descricao: dados.descricao,
    valor_mensal: dados.valorMensal,
    dia_vencimento: dados.diaVencimento,
    categoria: dados.categoria || "Outros",
    centro_custo_id: dados.centroCustoId || null,
    user_id: userId,
    empresa_id: empresaId,
  };
  const { data, error } = await supabase.from("custos_fixos").insert(payload).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("custos_fixos", "insert (transformar padrão recorrente)", motivo);
    return { erro: motivo };
  }
  const custoFixoId = data.id as string;

  const auditoria = await registrarAuditoriaCentro({
    userId, empresaId, centroId: dados.centroCustoId || null, tabela: "custos_fixos", registroId: custoFixoId,
    acao: "criar", descricao: `Custo fixo criado a partir de padrão recorrente detectado: ${dados.descricao}`,
  });
  if (auditoria.erro) reportarFalhaEscrita("centro_custo_auditoria", "insert (padrão recorrente)", auditoria.erro);

  if (idsContasOrigem.length > 0) {
    const { data: vinculadas, error: erroVinculo } = await supabase.from("contas_pagar")
      .update({ custo_fixo_id: custoFixoId }).eq("empresa_id", empresaId).in("id", idsContasOrigem).select("id");
    if (erroVinculo || !vinculadas || vinculadas.length === 0) {
      // Não bloqueia o fluxo — o custo fixo já foi criado; só o vínculo
      // retroativo falhou, e por isso precisa ficar registrado (senão essas
      // contas antigas voltam a aparecer como "sugestão" no próximo cálculo).
      reportarFalhaEscrita("contas_pagar", "update (vincular histórico ao custo fixo)", erroVinculo?.message || "0 linhas afetadas (RLS?)");
    }
  }

  const resultado = await gerarContaDeCustoFixo(
    userId, empresaId,
    { id: custoFixoId, descricao: dados.descricao, valor_mensal: dados.valorMensal, dia_vencimento: dados.diaVencimento, categoria: dados.categoria, centro_custo_id: dados.centroCustoId },
    mesReferencia,
  );
  if (resultado.erro) return { custoFixoId, erro: resultado.erro };
  return { custoFixoId, contaGeradaId: resultado.id };
}

// ----------------------------------------------------------------------------
// ENTREGA 3, COMMIT 4 — VALUE RECOVERY (parte 1). Três detecções, todas
// conservadoras: preferem não apontar a arriscar um falso positivo (acusar o
// dono de um erro que ele não cometeu). Nenhuma escreve nada — é sempre
// sugestão de revisão, o dono decide. Sem RPC nova, sem tabela nova.
// ----------------------------------------------------------------------------

// 1) COBRANÇAS ACIMA DA MÉDIA HISTÓRICA — reaproveita 100% precoAcimaMediaInterna
// (fornecedorHelpers.ts, já em produção em Fornecedores), só adiciona o piso de
// amostra mínima (um fornecedor com 1 compra não tem "média" que signifique
// nada) e converte o percentual em valor estimado recuperável.
const AMOSTRA_MINIMA_COBRANCA_ACIMA_MEDIA = 3;

export type CobrancaAcimaMedia = FornecedorPrecoAlto & { qtdCompras: number; valorRecuperavelEstimado: number };

export function detectarCobrancasAcimaMedia(fornecedores: FornecedorRow[], contas: ContaPagar[]): CobrancaAcimaMedia[] {
  return precoAcimaMediaInterna(fornecedores, contas)
    .map((f) => {
      const qtdCompras = contas.filter((c) => c.fornecedor_id === f.id).length;
      const valorRecuperavelEstimado = Math.round(Math.max(0, f.ticketMedio - f.mediaGrupo) * qtdCompras * 100) / 100;
      return { ...f, qtdCompras, valorRecuperavelEstimado };
    })
    .filter((f) => f.qtdCompras >= AMOSTRA_MINIMA_COBRANCA_ACIMA_MEDIA)
    .sort((a, b) => b.valorRecuperavelEstimado - a.valorRecuperavelEstimado);
}

// 2) MULTAS EVITÁVEIS — só marca como evitável quando o caixa REALIZADO
// acumulado até a data de vencimento (soma de todo fluxo_caixa "realizado"
// até aquele dia, a mesma noção de saldo usada no AP Forecast) já cobria o
// valor da conta. Sem essa prova, não marca — nunca estima "podia ter pago".
// Valor da multa = mesma fórmula de calcularFatorAtrasoHistorico (sobretaxa
// real paga = valor_pago - valor_total), não um percentual chutado.
export type MultaEvitavel = {
  contaId: string;
  descricao: string;
  fornecedorId: string | null;
  dataVencimento: string;
  dataPagamento: string;
  diasAtraso: number;
  valorMulta: number;
  saldoNaData: number;
};

export async function detectarMultasEvitaveis(empresaId: string): Promise<{ multas: MultaEvitavel[]; totalRecuperavel: number }> {
  const [{ data: cp }, { data: fc }] = await Promise.all([
    supabase.from("contas_pagar")
      .select("id, descricao, fornecedor_id, valor_total, valor_pago, data_vencimento, data_pagamento, taxa_multa_mensal")
      .eq("empresa_id", empresaId).eq("status", "pago"),
    supabase.from("fluxo_caixa").select("data, valor, tipo").eq("empresa_id", empresaId).eq("status", "realizado"),
  ]);

  const linhasCaixa = ((fc as { data: string; valor: number; tipo: string }[]) || [])
    .filter((l) => l.data)
    .sort((a, b) => a.data.localeCompare(b.data));

  // Saldo acumulado realizado até (e incluindo) uma data — mesma soma
  // entrada/saída do AP Forecast, só que travada num ponto do passado em vez
  // de "hoje".
  function saldoAte(data: string): number {
    return linhasCaixa
      .filter((l) => l.data <= data)
      .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);
  }

  type ContaPagaComMulta = {
    id: string; descricao: string; fornecedor_id: string | null;
    valor_total: number; valor_pago: number; data_vencimento: string | null; data_pagamento: string | null;
    taxa_multa_mensal: number | null;
  };
  const multas: MultaEvitavel[] = [];
  ((cp as ContaPagaComMulta[]) || []).forEach((c) => {
    if (!c.data_pagamento || !c.data_vencimento) return;
    if (c.data_pagamento <= c.data_vencimento) return; // não atrasou
    if (!(Number(c.taxa_multa_mensal) > 0)) return; // sem multa combinada, nada a recuperar aqui
    const valorMulta = Number(c.valor_pago || 0) - Number(c.valor_total || 0);
    if (valorMulta <= 0) return; // multa combinada mas não efetivamente cobrada

    const saldoNaData = saldoAte(c.data_vencimento);
    if (saldoNaData < Number(c.valor_total || 0)) return; // sem prova de caixa disponível — não marca

    const diasAtraso = Math.round(
      (new Date(c.data_pagamento + "T00:00:00").getTime() - new Date(c.data_vencimento + "T00:00:00").getTime()) / 86400000
    );
    multas.push({
      contaId: c.id, descricao: c.descricao, fornecedorId: c.fornecedor_id,
      dataVencimento: c.data_vencimento, dataPagamento: c.data_pagamento, diasAtraso,
      valorMulta: Math.round(valorMulta * 100) / 100, saldoNaData: Math.round(saldoNaData * 100) / 100,
    });
  });

  multas.sort((a, b) => b.valorMulta - a.valorMulta);
  const totalRecuperavel = Math.round(multas.reduce((s, m) => s + m.valorMulta, 0) * 100) / 100;
  return { multas, totalRecuperavel };
}

// 3) DUPLICIDADES PASSADAS — varredura no que já está gravado (não é checagem
// no ato de lançar, essa já existe desde a Entrega 2 via ap_detectar_duplicata).
// Mesmo peso de score do RPC (60 base + 25 nº nota + 15 mesmo dia de emissão)
// pra manter a leitura do score consistente em todo o módulo. Conta já
// vinculada a um custo_fixo_id nunca entra no par com OUTRA conta do MESMO
// custo fixo — isso já é recorrência conhecida (Commit 3), não duplicata.
const TOLERANCIA_VALOR_DUPLICATA_PASSADA_PCT = 0.01; // ±1%, igual ap_detectar_duplicata
const JANELA_DIAS_DUPLICATA_PASSADA = 30; // igual ao default de ap_detectar_duplicata

export type ParDuplicidadePassada = {
  contaA: ContaPagar;
  contaB: ContaPagar;
  score: number;
  motivos: string[];
};

export function detectarDuplicidadesPassadas(contas: ContaPagar[]): ParDuplicidadePassada[] {
  const elegiveis = contas.filter((c) => c.fornecedor_id && c.data_emissao && Number(c.valor_total) > 0);

  // Agrupa por fornecedor primeiro — duplicata só existe dentro do mesmo
  // fornecedor, então nunca precisa comparar entre fornecedores diferentes.
  const porFornecedor = new Map<string, ContaPagar[]>();
  elegiveis.forEach((c) => {
    const key = c.fornecedor_id as string;
    if (!porFornecedor.has(key)) porFornecedor.set(key, []);
    porFornecedor.get(key)!.push(c);
  });

  const pares: ParDuplicidadePassada[] = [];
  porFornecedor.forEach((lista) => {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const a = lista[i], b = lista[j];
        // Mesmo custo fixo = recorrência já conhecida (Commit 3), nunca duplicata.
        if (a.custo_fixo_id && a.custo_fixo_id === b.custo_fixo_id) continue;

        const diasEntre = Math.abs(
          (new Date(a.data_emissao + "T00:00:00").getTime() - new Date(b.data_emissao + "T00:00:00").getTime()) / 86400000
        );
        if (diasEntre > JANELA_DIAS_DUPLICATA_PASSADA) continue;

        const notaBate = !!(a.numero_nota && b.numero_nota && a.numero_nota === b.numero_nota);
        const valorBate = Math.abs(a.valor_total - b.valor_total) <= a.valor_total * TOLERANCIA_VALOR_DUPLICATA_PASSADA_PCT;
        if (!valorBate && !notaBate) continue;

        let score = 60;
        const motivos: string[] = [];
        if (valorBate) motivos.push("valor_igual");
        if (notaBate) { score += 25; motivos.push("mesma_nota"); }
        if (a.data_emissao === b.data_emissao) { score += 15; motivos.push("mesma_data_emissao"); }

        pares.push({ contaA: a, contaB: b, score, motivos });
      }
    }
  });

  return pares.sort((x, y) => y.score - x.score);
}

// ----------------------------------------------------------------------------
// ENTREGA 3, COMMIT 5 — VALUE RECOVERY (parte 2): DESCONTO POR PAGAMENTO
// ANTECIPADO. Usa as 2 colunas já aplicadas em contas_pagar
// (desconto_disponivel_pct, desconto_data_limite — ambas nullable, ver
// CONTAS-A-PAGAR-ENTREGA3-SQL.txt). "Foi usado?" é 100% derivado de
// status + data_pagamento vs desconto_data_limite — nunca um campo próprio
// (evita estado duplicado que dessincroniza, ex: numa baixa estornada).
// Funções puras sobre as contas já carregadas pela tela, mesmo padrão de
// priorizarPagamentos/detectarDespesasRecorrentes — sem fetch próprio.
// ----------------------------------------------------------------------------

// Conta sem desconto_data_limite preenchida não entra em NENHUMA das duas
// funções abaixo — sem prazo não dá pra dizer se ainda dá tempo ou se já
// passou ("sem prazo definido", nunca quebra, nunca chuta).

export type DescontoAproveitavel = {
  contaId: string;
  descricao: string;
  fornecedorId: string | null;
  valorTotal: number;
  percentual: number;
  dataLimite: string;
  diasRestantes: number;
  valorDesconto: number;
};

// Oportunidade FUTURA: conta ainda não paga, com desconto negociado e prazo
// que ainda não venceu. Ordenado por urgência (prazo mais próximo primeiro).
export function detectarDescontosAproveitaveis(contas: ContaPagar[]): DescontoAproveitavel[] {
  const hoje = new Date().toISOString().slice(0, 10);
  return contas
    .filter((c) => c.status !== "pago" && Number(c.desconto_disponivel_pct) > 0 && !!c.desconto_data_limite && (c.desconto_data_limite as string) >= hoje)
    .map((c) => {
      const percentual = Number(c.desconto_disponivel_pct);
      const dataLimite = c.desconto_data_limite as string;
      const valorDesconto = Math.round(c.valor_total * (percentual / 100) * 100) / 100;
      const diasRestantes = Math.round(
        (new Date(dataLimite + "T00:00:00").getTime() - new Date(hoje + "T00:00:00").getTime()) / 86400000
      );
      return { contaId: c.id, descricao: c.descricao, fornecedorId: c.fornecedor_id, valorTotal: c.valor_total, percentual, dataLimite, diasRestantes, valorDesconto };
    })
    .sort((a, b) => a.dataLimite.localeCompare(b.dataLimite));
}

export type DescontoPerdido = {
  contaId: string;
  descricao: string;
  fornecedorId: string | null;
  valorTotal: number;
  percentual: number;
  dataLimite: string;
  valorPerdido: number;
  motivo: "pago_apos_limite" | "prazo_expirado_pendente";
};

// Desconto que já era: pagou depois do prazo (pago_apos_limite), ou o prazo
// passou sem a conta ter sido paga ainda (prazo_expirado_pendente). Sempre
// informação/sugestão — nunca acusação; o dono decide se valia a pena.
export function detectarDescontosPerdidos(contas: ContaPagar[]): DescontoPerdido[] {
  const hoje = new Date().toISOString().slice(0, 10);
  const out: DescontoPerdido[] = [];
  contas.forEach((c) => {
    if (!(Number(c.desconto_disponivel_pct) > 0) || !c.desconto_data_limite) return;
    const dataLimite = c.desconto_data_limite as string;
    let motivo: DescontoPerdido["motivo"] | null = null;
    if (c.status === "pago" && c.data_pagamento && c.data_pagamento > dataLimite) motivo = "pago_apos_limite";
    else if (c.status !== "pago" && dataLimite < hoje) motivo = "prazo_expirado_pendente";
    if (!motivo) return;
    const percentual = Number(c.desconto_disponivel_pct);
    const valorPerdido = Math.round(c.valor_total * (percentual / 100) * 100) / 100;
    out.push({ contaId: c.id, descricao: c.descricao, fornecedorId: c.fornecedor_id, valorTotal: c.valor_total, percentual, dataLimite, valorPerdido, motivo });
  });
  return out.sort((a, b) => b.valorPerdido - a.valorPerdido);
}

// ----------------------------------------------------------------------------
// ENTREGA 4, COMMIT 2 — DYNAMIC DISCOUNT ENGINE. Fecha o loop do Commit 5:
// em vez de mostrar o desconto isolado, cruza com calcularForecastAp (já
// existe, Entrega 3 Commit 1) pra dizer se dá pra antecipar sem apertar o
// caixa. Nenhuma função de forecast nova — só correlaciona 2 saídas que já
// existem: o horizonte que cobre o prazo do desconto (saldoProjetadoPessimista)
// e a ruptura geral em 90 dias (ambos já calculados por calcularForecastAp).
//
// Avaliação SEMPRE ISOLADA (uma conta por vez, contra o forecast já
// calculado com todas as contas nas datas originais) — nunca cumulativa.
// Antecipar várias contas ao mesmo tempo tem efeito combinado maior do que
// cada uma isolada sugere; simular esse efeito exigiria remontar a série de
// eventos do forecast (função nova), fora do escopo deste commit. A tela
// deixa esse limite explícito pro dono.
// ----------------------------------------------------------------------------

export type VeredictoAntecipacao = "seguro" | "aperta_caixa" | "sem_dados";
export type MotivoSemDadosDesconto = "carregando" | "sem_historico_caixa" | "prazo_fora_do_forecast";

export type DescontoComForecast = DescontoAproveitavel & {
  veredicto: VeredictoAntecipacao;
  motivoSemDados: MotivoSemDadosDesconto | null;
  saldoProjetadoNoPrazo: number | null;
};

export function avaliarDescontosComForecast(
  descontos: DescontoAproveitavel[],
  forecast: ForecastAp | null,
): DescontoComForecast[] {
  if (!forecast) {
    return descontos.map((d) => ({ ...d, veredicto: "sem_dados", motivoSemDados: "carregando", saldoProjetadoNoPrazo: null }));
  }
  // saldoAtual = 0 é o mesmo sinal de "sem histórico de caixa real ainda"
  // usado no resto do módulo — não dá pra avaliar segurança de antecipar
  // pagamento sem saber de onde parte o caixa hoje.
  const semHistoricoCaixa = forecast.saldoAtual === 0;
  const rupturaGeral = forecast.pontos.find((p) => p.horizonteDias === 90)?.ruptura ?? null;

  return descontos.map((d) => {
    if (semHistoricoCaixa) {
      return { ...d, veredicto: "sem_dados", motivoSemDados: "sem_historico_caixa", saldoProjetadoNoPrazo: null };
    }
    const horizonte = HORIZONTES_FORECAST_AP.find((h) => h >= d.diasRestantes);
    if (!horizonte) {
      // Prazo do desconto vai além do maior horizonte do forecast (90 dias)
      // — raro (a maioria dos descontos por antecipação é de dias, não meses).
      return { ...d, veredicto: "sem_dados", motivoSemDados: "prazo_fora_do_forecast", saldoProjetadoNoPrazo: null };
    }
    const ponto = forecast.pontos.find((p) => p.horizonteDias === horizonte)!;
    const rupturaAntesDoPrazo = rupturaGeral !== null && rupturaGeral.diasRestantes <= d.diasRestantes;
    const saldoOk = ponto.saldoProjetadoPessimista >= 0;
    const veredicto: VeredictoAntecipacao = !rupturaAntesDoPrazo && saldoOk ? "seguro" : "aperta_caixa";
    return { ...d, veredicto, motivoSemDados: null, saldoProjetadoNoPrazo: ponto.saldoProjetadoPessimista };
  });
}

// ----------------------------------------------------------------------------
// ENTREGA 4, COMMIT 3 — EVIDENCE GRAPH V1. Rastreabilidade de uma conta:
// Fornecedor → Contrato → [Pedido] → [Recebimento] → Fatura → Pagamento →
// Banco. Monta com dado que já existe — reaproveita listarContratos
// (fornecedorHelpers.ts, corrigido nesta mesma entrega pra filtrar por
// empresa), listarDocumentos e listarAuditoriaConta (já existem neste
// arquivo). Pedido e Recebimento não têm tabela hoje (decisão PO-first
// pendente, ver Commit 4 futuro) — aparecem como "não capturado", nunca
// inventados. Zero schema novo, zero escrita.
// ----------------------------------------------------------------------------

export type EvidenciaFornecedor = { presente: boolean; nome: string };
export type EvidenciaContrato = { status: "ativo" | "encerrado" | "sem_contrato"; descricao?: string | null; dataFim?: string | null; valorContratado?: number | null };
export type EvidenciaNaoCapturada = { status: "nao_capturado" };
export type EvidenciaFatura = { numeroNota: string | null; valorTotal: number; qtdDocumentosAnexados: number };
export type EvidenciaPagamento = { status: "pago" | "pendente"; dataPagamento: string | null; valorPago: number; qtdEventosAuditoria: number };
export type EvidenciaBanco = {
  status: "reconciliado" | "nao_reconciliado" | "nao_conectado";
  transacao: { descricao: string; valor: number; data: string } | null;
};

export type EvidenceGraphAp = {
  contaId: string;
  fornecedor: EvidenciaFornecedor;
  contrato: EvidenciaContrato;
  pedido: EvidenciaNaoCapturada;
  recebimento: EvidenciaNaoCapturada;
  fatura: EvidenciaFatura;
  pagamento: EvidenciaPagamento;
  banco: EvidenciaBanco;
};

export async function montarEvidenceGraph(
  conta: ContaPagar,
  fornecedorNome: string | null,
  empresaId: string,
): Promise<EvidenceGraphAp> {
  const [contratos, documentos, auditoria, conexaoOF, transacaoLigada] = await Promise.all([
    conta.fornecedor_id ? listarContratos(conta.fornecedor_id, empresaId) : Promise.resolve([] as FornecedorContrato[]),
    listarDocumentos(conta.id, empresaId),
    listarAuditoriaConta(conta.id, empresaId),
    supabase.from("open_finance").select("id").eq("empresa_id", empresaId).limit(1),
    supabase.from("of_transacoes").select("descricao, valor, data")
      .eq("empresa_id", empresaId).eq("lancamento_tabela", "contas_pagar").eq("lancamento_id", conta.id).maybeSingle(),
  ]);

  const hoje = new Date().toISOString().slice(0, 10);
  // listarContratos já devolve ordenado por data_fim asc com indefinidos
  // (data_fim null) por último — o último item da lista é o contrato mais
  // relevante pra representar aqui (vigente, ou o mais recente encerrado).
  const contratoRelevante = contratos[contratos.length - 1] || null;
  const contrato: EvidenciaContrato = !contratoRelevante
    ? { status: "sem_contrato" }
    : {
        status: !contratoRelevante.data_fim || contratoRelevante.data_fim >= hoje ? "ativo" : "encerrado",
        descricao: contratoRelevante.descricao, dataFim: contratoRelevante.data_fim, valorContratado: contratoRelevante.valor_contratado,
      };

  const temConexaoOF = !!(conexaoOF.data && conexaoOF.data.length > 0);
  const banco: EvidenciaBanco = !temConexaoOF
    ? { status: "nao_conectado", transacao: null }
    : transacaoLigada.data
    ? { status: "reconciliado", transacao: { descricao: transacaoLigada.data.descricao, valor: Number(transacaoLigada.data.valor) || 0, data: transacaoLigada.data.data } }
    : { status: "nao_reconciliado", transacao: null };

  return {
    contaId: conta.id,
    fornecedor: { presente: !!conta.fornecedor_id, nome: fornecedorNome || "—" },
    contrato,
    pedido: { status: "nao_capturado" },
    recebimento: { status: "nao_capturado" },
    fatura: { numeroNota: conta.numero_nota || null, valorTotal: conta.valor_total, qtdDocumentosAnexados: documentos.length },
    pagamento: {
      status: conta.status === "pago" ? "pago" : "pendente",
      dataPagamento: conta.data_pagamento || null,
      valorPago: conta.valor_pago || 0,
      qtdEventosAuditoria: auditoria.length,
    },
    banco,
  };
}

// ----------------------------------------------------------------------------
// ENTREGA 4, COMMIT DE MELHORIA — IMPACTO CUMULATIVO DO DYNAMIC DISCOUNT
// ENGINE. Fecha a limitação declarada no Commit 2 (veredito isolado): avalia
// antecipar VÁRIAS contas selecionadas ao mesmo tempo, com efeito real
// cumulativo no caixa — remontando a série de eventos (saídas de
// contas_pagar com a data antecipada pro prazo do desconto, só das
// selecionadas) e rodando pelo MESMO computarPontosForecast que
// calcularForecastAp usa. Nenhum cálculo de caixa paralelo.
// ----------------------------------------------------------------------------

export type ResultadoAntecipacaoConjunta = {
  qtdSelecionadas: number;
  economiaTotal: number;
  // Ids selecionados cujo desconto_data_limite passa dos 90 dias do
  // forecast — a economia entra no total, mas o impacto no caixa dessa
  // conta específica não pôde ser avaliado (permanece na data original
  // na simulação).
  contasForaDoHorizonte: string[];
  saldoResultantePessimista: number | null;
  saldoResultanteOtimista: number | null;
  horizonteCriticoDias: HorizonteForecastDias | null;
  dataCritica: string | null; // prazo de desconto mais distante entre as selecionadas dentro do horizonte
  rupturaCausada: RupturaCaixa | null;
  motivoSemDados: "sem_historico_caixa" | null;
};

export async function avaliarAntecipacaoConjunta(empresaId: string, contaIds: string[]): Promise<ResultadoAntecipacaoConjunta> {
  const vazio: ResultadoAntecipacaoConjunta = {
    qtdSelecionadas: 0, economiaTotal: 0, contasForaDoHorizonte: [],
    saldoResultantePessimista: null, saldoResultanteOtimista: null,
    horizonteCriticoDias: null, dataCritica: null, rupturaCausada: null, motivoSemDados: null,
  };
  if (contaIds.length === 0) return vazio;

  const hoje = new Date().toISOString().split("T")[0];
  const maxHorizonte = Math.max(...HORIZONTES_FORECAST_AP);
  const selecionadas = new Set(contaIds);

  const [{ data: fc }, { data: cr }, { data: cp }, { data: cf }, { data: cpPagas }] = await Promise.all([
    supabase.from("fluxo_caixa").select("valor, tipo, status").eq("empresa_id", empresaId),
    supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento").eq("empresa_id", empresaId).neq("status", "recebido"),
    supabase.from("contas_pagar").select("id, valor_total, valor_pago, status, data_vencimento, custo_fixo_id, desconto_disponivel_pct, desconto_data_limite").eq("empresa_id", empresaId),
    supabase.from("custos_fixos").select("id, valor_mensal, dia_vencimento").eq("empresa_id", empresaId),
    supabase.from("contas_pagar").select("valor_total, valor_pago, data_pagamento, data_vencimento, taxa_multa_mensal").eq("empresa_id", empresaId).eq("status", "pago"),
  ]);

  type ContaPagarParaAntecipacao = {
    id: string; valor_total: number; valor_pago: number; status: string | null; data_vencimento: string | null;
    custo_fixo_id: string | null; desconto_disponivel_pct: number | null; desconto_data_limite: string | null;
  };
  type CustoFixoParaForecast = { id: string; valor_mensal: number; dia_vencimento: number };
  type FluxoCaixaLinha = { valor: number; tipo: string; status: string };
  type ContaReceberParaForecast = { valor: number; valor_recebido: number; status: string; data_vencimento: string | null };

  const fcTipado = (fc as FluxoCaixaLinha[]) || [];
  const cpTipado = (cp as ContaPagarParaAntecipacao[]) || [];
  const cfTipado = (cf as CustoFixoParaForecast[]) || [];
  const crTipado = (cr as ContaReceberParaForecast[]) || [];

  const saldoAtual = fcTipado.filter((l) => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);

  // Economia total conta independente de o forecast dar veredito — mesmo
  // sem prova de caixa, o valor do desconto em si é um fato determinístico.
  let economiaTotal = 0;
  cpTipado.forEach((c) => {
    if (!selecionadas.has(c.id) || !c.desconto_data_limite || !(Number(c.desconto_disponivel_pct) > 0)) return;
    economiaTotal += Number(c.valor_total || 0) * (Number(c.desconto_disponivel_pct) / 100);
  });
  economiaTotal = Math.round(economiaTotal * 100) / 100;

  // Mesmo sinal de "sem histórico de caixa real" do Commit 2 — sem saber de
  // onde parte o caixa, não dá pra avaliar segurança de antecipar nada.
  if (saldoAtual === 0) {
    return { ...vazio, qtdSelecionadas: contaIds.length, economiaTotal, motivoSemDados: "sem_historico_caixa" };
  }

  const entradas: EventoCaixa[] = crTipado
    .filter((c) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c) => ({ data: c.data_vencimento as string, valor: Math.max(0, Number(c.valor || 0) - Number(c.valor_recebido || 0)) }))
    .filter((e) => e.valor > 0);

  const contasForaDoHorizonte: string[] = [];
  let maxDiasCritico: number | null = null;
  let dataCriticaStr: string | null = null;

  // Mesma montagem de saídas de calcularForecastAp, só que a data de cada
  // conta SELECIONADA é substituída pelo prazo do próprio desconto — é
  // isso que torna o efeito cumulativo real (2 pagamentos que ANTES caíam
  // em semanas diferentes agora podem cair na MESMA semana).
  const saidasContasPagar: EventoCaixa[] = cpTipado
    .filter((c) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c) => {
      const resta = Math.max(0, Number(c.valor_total || 0) - Number(c.valor_pago || 0));
      let dataEfetiva: string = c.data_vencimento as string;
      if (selecionadas.has(c.id) && c.desconto_data_limite && Number(c.desconto_disponivel_pct) > 0) {
        const diasAteLimite = Math.round(
          (new Date(c.desconto_data_limite + "T00:00:00").getTime() - new Date(hoje + "T00:00:00").getTime()) / 86400000
        );
        if (diasAteLimite <= maxHorizonte) {
          dataEfetiva = c.desconto_data_limite;
          if (maxDiasCritico === null || diasAteLimite > maxDiasCritico) { maxDiasCritico = diasAteLimite; dataCriticaStr = c.desconto_data_limite; }
        } else {
          contasForaDoHorizonte.push(c.id);
        }
      }
      return { data: dataEfetiva, valor: resta };
    })
    .filter((e) => e.valor > 0);

  const mesesJaGerados = new Set(
    cpTipado.filter((c) => c.custo_fixo_id && c.data_vencimento).map((c) => `${c.custo_fixo_id}|${String(c.data_vencimento).slice(0, 7)}`)
  );
  const saidasCustosFixos: EventoCaixa[] = cfTipado.flatMap((c) => {
    if (!c.valor_mensal || !c.dia_vencimento) return [];
    const proxima = proximaOcorrenciaDoDia(Number(c.dia_vencimento));
    return projetarRecorrenciaMensal(Number(c.valor_mensal), proxima, maxHorizonte)
      .filter((ev) => !mesesJaGerados.has(`${c.id}|${ev.data.slice(0, 7)}`));
  });

  const { fator: fatorAtraso } = calcularFatorAtrasoHistorico((cpPagas as ContaPagaParaFatorAtraso[]) || []);

  const { pontos, rupturaNoMax } = computarPontosForecast(saldoAtual, entradas, saidasContasPagar, saidasCustosFixos, fatorAtraso, hoje);

  // Horizonte crítico: o menor bucket (7/30/60/90) que cobre a data-limite
  // mais distante entre as selecionadas dentro do alcance do forecast —
  // é o ponto em que TODAS as antecipações já teriam saído do caixa.
  const horizonteCritico = maxDiasCritico !== null ? HORIZONTES_FORECAST_AP.find((h) => h >= (maxDiasCritico as number)) || null : null;
  const pontoCritico = horizonteCritico ? pontos.find((p) => p.horizonteDias === horizonteCritico) || null : null;

  return {
    qtdSelecionadas: contaIds.length,
    economiaTotal,
    contasForaDoHorizonte,
    saldoResultantePessimista: pontoCritico?.saldoProjetadoPessimista ?? null,
    saldoResultanteOtimista: pontoCritico?.saldoProjetadoOtimista ?? null,
    horizonteCriticoDias: horizonteCritico,
    dataCritica: dataCriticaStr,
    rupturaCausada: rupturaNoMax,
    motivoSemDados: null,
  };
}

// ----------------------------------------------------------------------------
// ENTREGA 4, COMMIT 5 — CFO AP BRIEFING V1 + NATURAL LANGUAGE CFO V1.
// Determinístico, sem IA/LLM real — mesmo molde já em produção em Centro de
// Custos: montarCentralInsights (agrupa/prioriza achados) e
// respostaPorRegrasCentro/respostaZIAPorRegras (copiloto por palavra-chave).
// Funções PURAS sobre dado já calculado pela tela — zero fetch, zero
// duplicação dos motores (forecast, spend analytics, value recovery,
// anomalias) que já existem. Ponto único de geração de texto: no dia em
// que a ANTHROPIC_API_KEY for ativada, é só trocar o corpo desta função
// por uma chamada a /api/ia-chat (mesmo padrão ZIA de
// clienteIntelHelpers.ts) — a tela não muda uma linha.
// ----------------------------------------------------------------------------

// ============================================================================
// PARTE 1 — CFO AP BRIEFING V1
// ============================================================================

export type SeveridadeBriefingAp = "critico" | "atencao" | "info";
export type AbaAlvoBriefingAp = "central" | "inteligencia" | "aprovacoes";

export type ItemBriefingAp = {
  severidade: SeveridadeBriefingAp;
  texto: string;
  abaAlvo: AbaAlvoBriefingAp;
  filtroStatus?: string; // reaproveita o filtro de status já existente na aba Central
  impacto: number; // só pra ordenar dentro da mesma severidade, nunca exibido
};

export type ContextoBriefingAp = {
  lang: "pt" | "en" | "es";
  forecastAp: ForecastAp | null;
  totalVencido: number;
  totalVencendo7: number;
  aprovacoesPendentesQtd: number;
  aprovacoesPendentesValor: number;
  totalRecuperacaoEstimada: number;
  duplicidadesPassadas: ParDuplicidadePassada[];
  anomalias: AnomaliaHistorica[];
};

// Score de "alta confiança" reaproveitado do mesmo limiar já usado na UI de
// Recuperação de Valor (>=85 = vermelho/alta confiança) — não inventa um
// novo corte aqui.
const SCORE_DUPLICATA_ALTA_CONFIANCA = 85;

export function montarBriefingAp(ctx: ContextoBriefingAp): ItemBriefingAp[] {
  const L = (pt: string, en: string, es: string) => (ctx.lang === "en" ? en : ctx.lang === "es" ? es : pt);
  const itens: ItemBriefingAp[] = [];

  // 1) Ruptura de caixa à vista — o dado mais grave que a tela conhece.
  const ruptura = ctx.forecastAp?.pontos.find((p) => p.horizonteDias === 90)?.ruptura ?? null;
  if (ruptura) {
    itens.push({
      severidade: "critico",
      texto: L(`Seu caixa fica negativo em ${ruptura.diasRestantes} dias (${new Date(ruptura.data + "T00:00:00").toLocaleDateString("pt-BR")}), projetado em ${fBRL(ruptura.saldoProjetado)}.`,
        `Your cash goes negative in ${ruptura.diasRestantes} days (${new Date(ruptura.data + "T00:00:00").toLocaleDateString("en-US")}), projected at ${fBRL(ruptura.saldoProjetado)}.`,
        `Su caja queda negativa en ${ruptura.diasRestantes} días (${new Date(ruptura.data + "T00:00:00").toLocaleDateString("es-ES")}), proyectada en ${fBRL(ruptura.saldoProjetado)}.`),
      abaAlvo: "inteligencia",
      impacto: 100000 - ruptura.diasRestantes,
    });
  }

  // 2) Contas vencidas
  if (ctx.totalVencido > 0) {
    itens.push({
      severidade: "critico",
      texto: L(`${fBRL(ctx.totalVencido)} em contas vencidas agora.`, `${fBRL(ctx.totalVencido)} in overdue bills right now.`, `${fBRL(ctx.totalVencido)} en cuentas vencidas ahora.`),
      abaAlvo: "central", filtroStatus: "vencido", impacto: ctx.totalVencido,
    });
  }

  // 3) Aprovações pendentes
  if (ctx.aprovacoesPendentesQtd > 0) {
    itens.push({
      severidade: ctx.aprovacoesPendentesQtd >= 3 ? "atencao" : "info",
      texto: L(`${ctx.aprovacoesPendentesQtd} conta(s) aguardando sua aprovação, totalizando ${fBRL(ctx.aprovacoesPendentesValor)}.`,
        `${ctx.aprovacoesPendentesQtd} bill(s) awaiting your approval, totaling ${fBRL(ctx.aprovacoesPendentesValor)}.`,
        `${ctx.aprovacoesPendentesQtd} cuenta(s) esperando su aprobación, totalizando ${fBRL(ctx.aprovacoesPendentesValor)}.`),
      abaAlvo: "aprovacoes", impacto: ctx.aprovacoesPendentesValor,
    });
  }

  // 4) Duplicidade de alta confiança
  const duplicatasAltas = ctx.duplicidadesPassadas.filter((p) => p.score >= SCORE_DUPLICATA_ALTA_CONFIANCA);
  if (duplicatasAltas.length > 0) {
    itens.push({
      severidade: "atencao",
      texto: L(`${duplicatasAltas.length} par(es) de lançamento com alta chance de duplicidade — vale revisar.`,
        `${duplicatasAltas.length} pair(s) of entries with a high chance of being duplicates — worth reviewing.`,
        `${duplicatasAltas.length} par(es) de lanzamientos con alta probabilidad de duplicidad — vale revisar.`),
      abaAlvo: "inteligencia", impacto: duplicatasAltas.length * 1000,
    });
  }

  // 5) Pontos de atenção (anomalias)
  if (ctx.anomalias.length > 0) {
    itens.push({
      severidade: "atencao",
      texto: L(`${ctx.anomalias.length} ponto(s) de atenção detectado(s) nos lançamentos — pode ter explicação legítima, mas vale revisar.`,
        `${ctx.anomalias.length} point(s) to review found in your bills — may have a legitimate explanation, but worth checking.`,
        `${ctx.anomalias.length} punto(s) de atención detectado(s) en los lanzamientos — puede tener explicación legítima, pero vale revisar.`),
      abaAlvo: "inteligencia", impacto: ctx.anomalias.length * 800,
    });
  }

  // 6) Recuperação de valor (total agregado das 5 fontes já calculadas)
  if (ctx.totalRecuperacaoEstimada > 0) {
    itens.push({
      severidade: "info",
      texto: L(`Até ${fBRL(ctx.totalRecuperacaoEstimada)} em oportunidades de recuperação de valor detectadas — sugestões a revisar, não valores confirmados.`,
        `Up to ${fBRL(ctx.totalRecuperacaoEstimada)} in value-recovery opportunities detected — suggestions to review, not confirmed values.`,
        `Hasta ${fBRL(ctx.totalRecuperacaoEstimada)} en oportunidades de recuperación de valor detectadas — sugerencias a revisar, no valores confirmados.`),
      abaAlvo: "inteligencia", impacto: ctx.totalRecuperacaoEstimada,
    });
  }

  // 7) Vencendo em 7 dias — o item mais "operacional", menor severidade.
  if (ctx.totalVencendo7 > 0) {
    itens.push({
      severidade: "info",
      texto: L(`${fBRL(ctx.totalVencendo7)} vencendo nos próximos 7 dias.`, `${fBRL(ctx.totalVencendo7)} due in the next 7 days.`, `${fBRL(ctx.totalVencendo7)} venciendo en los próximos 7 días.`),
      abaAlvo: "central", impacto: ctx.totalVencendo7,
    });
  }

  const rankSeveridade: Record<SeveridadeBriefingAp, number> = { critico: 0, atencao: 1, info: 2 };
  return itens.sort((a, b) => rankSeveridade[a.severidade] - rankSeveridade[b.severidade] || b.impacto - a.impacto);
}

// ============================================================================
// PARTE 2 — NATURAL LANGUAGE CFO V1 (por regra/palavra-chave)
// ============================================================================

export type ContextoCfoAp = {
  lang: "pt" | "en" | "es";
  forecastAp: ForecastAp | null;
  spendPorCategoria: { label: string; valor: number; pct: number }[];
  spendPorFornecedor: { nome: string; valor: number }[];
  duplicidadesPassadas: ParDuplicidadePassada[];
  descontosComForecast: DescontoComForecast[];
  multasEvitaveis: MultaEvitavel[];
  anomalias: AnomaliaHistorica[];
  aprovacoesPendentesQtd: number;
};

const TOPICOS_SUPORTADOS_PT = "quanto você vai pagar em X dias, onde está gastando mais, se tem conta duplicada, se tem desconto pra aproveitar, se seu caixa aguenta, multas evitáveis, pontos de atenção e aprovações pendentes";
const TOPICOS_SUPORTADOS_EN = "how much you'll pay in X days, where you're spending the most, whether you have duplicate bills, whether there's a discount to grab, whether your cash can handle it, avoidable late fees, points to review, and pending approvals";
const TOPICOS_SUPORTADOS_ES = "cuánto va a pagar en X días, dónde está gastando más, si tiene cuentas duplicadas, si hay descuento para aprovechar, si su caja aguanta, multas evitables, puntos de atención y aprobaciones pendientes";

export function responderPerguntaApPorRegra(pergunta: string, ctx: ContextoCfoAp): string {
  const lang = ctx.lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const q = normalizarTexto(pergunta);
  const semForecast = () => L("Ainda não tenho um forecast de caixa calculado — abra a aba Inteligência primeiro.", "I don't have a cash forecast calculated yet — open the Intelligence tab first.", "Todavía no tengo un forecast de caja calculado — abra la pestaña Inteligencia primero.");

  // 1) Quanto vou pagar em N dias
  if (q.includes("quanto vou pagar") || q.includes("quanto vai pagar") || q.includes("quanto pagar") || q.includes("quanto tenho que pagar")
    || q.includes("how much will i pay") || q.includes("how much to pay") || q.includes("how much do i pay")
    || q.includes("cuanto voy a pagar") || q.includes("cuanto tengo que pagar") || q.includes("cuanto pagar")) {
    if (!ctx.forecastAp) return semForecast();
    const horizontesMencionados = HORIZONTES_FORECAST_AP.filter((h) => pergunta.includes(String(h)));
    const horizonte = horizontesMencionados[0] || 30;
    const ponto = ctx.forecastAp.pontos.find((p) => p.horizonteDias === horizonte);
    if (!ponto) return semForecast();
    // Derivado dos 2 campos que já existem (nunca um cálculo novo de caixa):
    // "sem pagamentos" menos "otimista" = exatamente o total de saídas de
    // contas_pagar previstas nesse horizonte.
    const totalAPagar = Math.max(0, ponto.saldoProjetadoSemPagamentos - ponto.saldoProjetadoOtimista);
    return L(`Você tem ${fBRL(totalAPagar)} previstos em contas a pagar nos próximos ${horizonte} dias.`,
      `You have ${fBRL(totalAPagar)} in accounts payable expected over the next ${horizonte} days.`,
      `Tiene ${fBRL(totalAPagar)} previstos en cuentas por pagar en los próximos ${horizonte} días.`);
  }

  // 2) Onde estou gastando mais
  if ((q.includes("onde") && (q.includes("gastando") || q.includes("gasto"))) || (q.includes("where") && q.includes("spend")) || (q.includes("donde") && (q.includes("gastando") || q.includes("gasto")))) {
    if (ctx.spendPorCategoria.length === 0) return L("Ainda não tenho gasto suficiente registrado pra apontar uma categoria.", "I don't have enough recorded spend yet to point to a category.", "Todavía no tengo gasto suficiente registrado para señalar una categoría.");
    const top = ctx.spendPorCategoria[0];
    return L(`Sua maior categoria de gasto é "${top.label}", com ${fBRL(top.valor)} (${top.pct}% do total).`,
      `Your biggest spending category is "${top.label}", at ${fBRL(top.valor)} (${top.pct}% of the total).`,
      `Su mayor categoría de gasto es "${top.label}", con ${fBRL(top.valor)} (${top.pct}% del total).`);
  }

  // 3) Tem conta duplicada
  if (q.includes("duplicad") || q.includes("duplicate") || q.includes("lancada 2x") || q.includes("lancado 2x")) {
    if (ctx.duplicidadesPassadas.length === 0) return L("Não encontrei nenhum par de lançamentos parecido no que já foi gravado.", "I didn't find any pair of similar bills in what's already recorded.", "No encontré ningún par de lanzamientos parecidos en lo que ya está registrado.");
    const top = ctx.duplicidadesPassadas[0];
    return L(`Encontrei ${ctx.duplicidadesPassadas.length} par(es) de lançamentos parecidos — o mais forte: "${top.contaA.descricao}" e "${top.contaB.descricao}" (score ${top.score}). Revise antes de assumir que é erro.`,
      `I found ${ctx.duplicidadesPassadas.length} pair(s) of similar bills — the strongest: "${top.contaA.descricao}" and "${top.contaB.descricao}" (score ${top.score}). Review before assuming it's a mistake.`,
      `Encontré ${ctx.duplicidadesPassadas.length} par(es) de lanzamientos parecidos — el más fuerte: "${top.contaA.descricao}" y "${top.contaB.descricao}" (score ${top.score}). Revise antes de asumir que es un error.`);
  }

  // 4) Algum desconto pra aproveitar
  if (q.includes("desconto") || q.includes("discount") || q.includes("descuento")) {
    if (ctx.descontosComForecast.length === 0) return L("Nenhum desconto por pagamento antecipado em aberto no momento.", "No open early-payment discount right now.", "Ningún descuento por pago anticipado abierto en este momento.");
    const totalEconomia = ctx.descontosComForecast.reduce((s, d) => s + d.valorDesconto, 0);
    const seguros = ctx.descontosComForecast.filter((d) => d.veredicto === "seguro").length;
    return L(`Você tem ${ctx.descontosComForecast.length} desconto(s) por pagamento antecipado em aberto, até ${fBRL(totalEconomia)} de economia — ${seguros} deles com caixa confirmado seguro pra antecipar.`,
      `You have ${ctx.descontosComForecast.length} open early-payment discount(s), up to ${fBRL(totalEconomia)} in savings — ${seguros} of them with cash confirmed safe to move up.`,
      `Tiene ${ctx.descontosComForecast.length} descuento(s) por pago anticipado abierto(s), hasta ${fBRL(totalEconomia)} de ahorro — ${seguros} de ellos con caja confirmada segura para anticipar.`);
  }

  // 5) Meu caixa aguenta
  if ((q.includes("caixa") && (q.includes("aguenta") || q.includes("aguent"))) || (q.includes("cash") && q.includes("handle")) || (q.includes("caja") && q.includes("aguanta"))) {
    if (!ctx.forecastAp) return semForecast();
    const ruptura90 = ctx.forecastAp.pontos.find((p) => p.horizonteDias === 90)?.ruptura ?? null;
    if (!ruptura90) return L("Sim — não há ruptura de caixa prevista nos próximos 90 dias, no cenário atual.", "Yes — no cash shortfall is expected in the next 90 days, in the current scenario.", "Sí — no hay ruptura de caja prevista en los próximos 90 días, en el escenario actual.");
    return L(`Atenção: seu caixa fica negativo em ${ruptura90.diasRestantes} dias (${new Date(ruptura90.data + "T00:00:00").toLocaleDateString("pt-BR")}), projetado em ${fBRL(ruptura90.saldoProjetado)}.`,
      `Careful: your cash goes negative in ${ruptura90.diasRestantes} days (${new Date(ruptura90.data + "T00:00:00").toLocaleDateString("en-US")}), projected at ${fBRL(ruptura90.saldoProjetado)}.`,
      `Atención: su caja queda negativa en ${ruptura90.diasRestantes} días (${new Date(ruptura90.data + "T00:00:00").toLocaleDateString("es-ES")}), proyectada en ${fBRL(ruptura90.saldoProjetado)}.`);
  }

  // 6) Multas evitáveis
  if (q.includes("multa") || q.includes("late fee") || q.includes("penalty")) {
    if (ctx.multasEvitaveis.length === 0) return L("Nenhuma multa evitável identificada no histórico.", "No avoidable late fee found in the history.", "Ninguna multa evitable identificada en el historial.");
    const total = ctx.multasEvitaveis.reduce((s, m) => s + m.valorMulta, 0);
    return L(`Encontrei ${ctx.multasEvitaveis.length} multa(s) que provavelmente dava pra evitar (tinha caixa pra pagar em dia), somando ${fBRL(total)}.`,
      `I found ${ctx.multasEvitaveis.length} late fee(s) that could likely have been avoided (cash was available to pay on time), totaling ${fBRL(total)}.`,
      `Encontré ${ctx.multasEvitaveis.length} multa(s) que probablemente se podían evitar (había caja para pagar a tiempo), sumando ${fBRL(total)}.`);
  }

  // 7) Anomalia / algo estranho
  if (q.includes("anomalia") || q.includes("estranho") || q.includes("unusual") || q.includes("anomaly") || q.includes("extrano") || q.includes("raro") || q.includes("suspeito")) {
    if (ctx.anomalias.length === 0) return L("Nada fora do padrão nos lançamentos até agora.", "Nothing out of pattern in your bills so far.", "Nada fuera de patrón en los lanzamientos hasta ahora.");
    return L(`${ctx.anomalias.length} ponto(s) de atenção detectado(s) nos lançamentos — dá pra ver os detalhes na aba Inteligência, em "Pontos de Atenção".`,
      `${ctx.anomalias.length} point(s) to review found in your bills — see the details in the Intelligence tab, under "Points to Review".`,
      `${ctx.anomalias.length} punto(s) de atención detectado(s) en los lanzamientos — puede ver los detalles en la pestaña Inteligencia, en "Puntos de Atención".`);
  }

  // 8) Aprovação pendente
  if (q.includes("aprova") || q.includes("approv")) {
    if (ctx.aprovacoesPendentesQtd === 0) return L("Nenhuma aprovação pendente no momento.", "No pending approval right now.", "Ninguna aprobación pendiente en este momento.");
    return L(`${ctx.aprovacoesPendentesQtd} conta(s) aguardando aprovação.`, `${ctx.aprovacoesPendentesQtd} bill(s) awaiting approval.`, `${ctx.aprovacoesPendentesQtd} cuenta(s) esperando aprobación.`);
  }

  return L(
    `Ainda não sei responder isso — essa é a V1 por regra, a inteligência completa chega depois. Posso ajudar com: ${TOPICOS_SUPORTADOS_PT}.`,
    `I can't answer that yet — this is the rule-based V1, full intelligence comes later. I can help with: ${TOPICOS_SUPORTADOS_EN}.`,
    `Todavía no sé responder eso — esta es la V1 por regla, la inteligencia completa llega después. Puedo ayudar con: ${TOPICOS_SUPORTADOS_ES}.`
  );
}
