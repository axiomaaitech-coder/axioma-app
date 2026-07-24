// 🦅 AXIOMA AI.TECH - Helpers do Centro de Custos (Fase 1: integração com módulos reais)
// Rateio divide UM lançamento existente (de custos_fixos/custos_variaveis/contas_pagar)
// entre vários centros por % — nunca duplica o valor, só a fração de cada centro.

import { createBrowserClient } from "@supabase/ssr";
import { calcStatus } from "./fornecedorHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type OrigemTabela = "custos_fixos" | "custos_variaveis" | "contas_pagar";

export const LABEL_ORIGEM: Record<OrigemTabela, { pt: string; en: string; es: string }> = {
  custos_fixos: { pt: "Custos Fixos", en: "Fixed Costs", es: "Costos Fijos" },
  custos_variaveis: { pt: "Custos Variáveis", en: "Variable Costs", es: "Costos Variables" },
  contas_pagar: { pt: "Contas a Pagar (Fornecedores)", en: "Accounts Payable (Suppliers)", es: "Cuentas por Pagar (Proveedores)" },
};

export type LancamentoOrigem = {
  tabela: OrigemTabela;
  id: string;
  descricao: string;
  valor: number;
  data: string;            // "" quando a origem não tem data própria (Custos Fixos = recorrente)
  categoria?: string;
  fornecedor_id?: string | null;
  centro_custo_id: string | null;
  dia_vencimento?: number;   // só custos_fixos
  status?: string;           // só contas_pagar (calculado — nunca editar direto, ver calcStatus em fornecedorHelpers.ts)
  valor_pago?: number;       // só contas_pagar
};

export async function carregarLancamentosOrigem(userId: string, tabela: OrigemTabela): Promise<LancamentoOrigem[]> {
  if (tabela === "custos_fixos") {
    const { data } = await supabase.from("custos_fixos").select("id, descricao, valor_mensal, categoria, centro_custo_id, dia_vencimento").order("descricao");
    return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor_mensal || 0), data: "", categoria: d.categoria, centro_custo_id: d.centro_custo_id, dia_vencimento: d.dia_vencimento }));
  }
  if (tabela === "custos_variaveis") {
    const { data } = await supabase.from("custos_variaveis").select("id, descricao, valor, data, categoria, centro_custo_id").order("data", { ascending: false }).limit(5000);
    return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor || 0), data: d.data || "", categoria: d.categoria, centro_custo_id: d.centro_custo_id }));
  }
  const { data } = await supabase.from("contas_pagar").select("id, descricao, valor_total, valor_pago, categoria, data_vencimento, fornecedor_id, centro_custo_id, status").order("data_vencimento", { ascending: false }).limit(5000);
  return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor_total || 0), data: d.data_vencimento || "", categoria: d.categoria, fornecedor_id: d.fornecedor_id, centro_custo_id: d.centro_custo_id, status: d.status, valor_pago: Number(d.valor_pago || 0) }));
}

export async function carregarTodosLancamentosOrigem(userId: string): Promise<LancamentoOrigem[]> {
  const [cf, cv, cp] = await Promise.all([
    carregarLancamentosOrigem(userId, "custos_fixos"),
    carregarLancamentosOrigem(userId, "custos_variaveis"),
    carregarLancamentosOrigem(userId, "contas_pagar"),
  ]);
  return [...cf, ...cv, ...cp];
}

export type ReceitaOrigem = { id: string; descricao: string; valor: number; data: string; categoria?: string; centro_custo_id: string | null };

export async function carregarReceitasOrigem(userId: string): Promise<ReceitaOrigem[]> {
  const { data } = await supabase.from("receitas").select("id, descricao, valor, data, categoria, centro_custo_id").order("data", { ascending: false }).limit(5000);
  return (data || []).map((d: any) => ({ id: d.id, descricao: d.descricao, valor: Number(d.valor || 0), data: d.data || "", categoria: d.categoria, centro_custo_id: d.centro_custo_id }));
}

export function receitasPorCentroReal(receitas: ReceitaOrigem[]): Record<string, number> {
  const totais: Record<string, number> = {};
  for (const r of receitas) {
    if (r.centro_custo_id) totais[r.centro_custo_id] = (totais[r.centro_custo_id] || 0) + r.valor;
  }
  return totais;
}

export type RateioRow = {
  id: string; origem_tabela: OrigemTabela; origem_id: string; centro_custo_id: string;
  percentual: number; base_tipo: string; descricao: string | null; created_at: string;
};

export async function carregarRateios(userId: string): Promise<RateioRow[]> {
  const { data } = await supabase.from("centro_custo_rateio").select("*");
  return data || [];
}

export async function aplicarRateio(
  userId: string, empresaId: string | null, origemTabela: OrigemTabela, origemId: string, descricao: string, baseTipo: string,
  splits: { centroId: string; percentual: number }[],
): Promise<{ erro?: string }> {
  await supabase.from("centro_custo_rateio").delete().eq("origem_tabela", origemTabela).eq("origem_id", origemId);
  const linhas = splits.filter(s => s.percentual > 0).map(s => ({
    user_id: userId, empresa_id: empresaId, origem_tabela: origemTabela, origem_id: origemId,
    centro_custo_id: s.centroId, percentual: s.percentual, base_tipo: baseTipo, descricao,
  }));
  if (linhas.length === 0) return {};
  const { error } = await supabase.from("centro_custo_rateio").insert(linhas);
  return error ? { erro: error.message } : {};
}

export async function removerRateio(userId: string, origemTabela: OrigemTabela, origemId: string): Promise<void> {
  await supabase.from("centro_custo_rateio").delete().eq("origem_tabela", origemTabela).eq("origem_id", origemId);
}

// Junta o que já está etiquetado direto (centro_custo_id nos 3 módulos) com o que foi
// rateado — um lançamento rateado sai da contagem "direta" pra não contar em dobro.
export function custosPorCentroReal(origens: LancamentoOrigem[], rateios: RateioRow[]): Record<string, number> {
  const totais: Record<string, number> = {};
  const idsComRateio = new Set(rateios.map(r => `${r.origem_tabela}:${r.origem_id}`));
  for (const o of origens) {
    if (idsComRateio.has(`${o.tabela}:${o.id}`)) continue;
    if (o.centro_custo_id) totais[o.centro_custo_id] = (totais[o.centro_custo_id] || 0) + o.valor;
  }
  for (const r of rateios) {
    const origem = origens.find(o => o.tabela === r.origem_tabela && o.id === r.origem_id);
    if (!origem) continue;
    totais[r.centro_custo_id] = (totais[r.centro_custo_id] || 0) + origem.valor * (r.percentual / 100);
  }
  return totais;
}

export function sugerirPercentuaisPorBase(
  centros: { id: string; headcount?: number | null; area_m2?: number | null }[],
  base: "headcount" | "area",
): Record<string, string> {
  const campo = base === "headcount" ? "headcount" : "area_m2";
  const total = centros.reduce((s, c) => s + Number((c as any)[campo] || 0), 0);
  const out: Record<string, string> = {};
  if (total <= 0) return out;
  centros.forEach(c => {
    const v = Number((c as any)[campo] || 0);
    out[c.id] = v > 0 ? String(Number(((v / total) * 100).toFixed(2))) : "0";
  });
  return out;
}

export type OrcamentoRow = { id: string; centro_custo_id: string; periodo: string; valor_orcado: number };

export async function carregarOrcamentos(userId: string): Promise<OrcamentoRow[]> {
  const { data } = await supabase.from("centro_custo_orcamento").select("*");
  return data || [];
}

export async function definirOrcamento(userId: string, empresaId: string | null, centroId: string, periodo: string, valor: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from("centro_custo_orcamento")
    .upsert({ user_id: userId, empresa_id: empresaId, centro_custo_id: centroId, periodo, valor_orcado: valor }, { onConflict: "centro_custo_id,periodo" });
  return error ? { erro: error.message } : {};
}

export function orcamentoDoPeriodo(orcamentos: OrcamentoRow[], centroId: string, periodo: string, fallback: number): number {
  const registro = orcamentos.find(o => o.centro_custo_id === centroId && o.periodo === periodo);
  return registro ? Number(registro.valor_orcado) : fallback;
}

export async function registrarAuditoriaCentro(params: {
  userId: string; empresaId: string | null; centroId?: string | null; tabela: string; registroId?: string;
  acao: "criar" | "editar" | "excluir"; descricao?: string; valorAntes?: any; valorDepois?: any;
}): Promise<void> {
  await supabase.from("centro_custo_auditoria").insert({
    user_id: params.userId, empresa_id: params.empresaId, centro_custo_id: params.centroId, tabela: params.tabela,
    registro_id: params.registroId, acao: params.acao, descricao: params.descricao,
    valor_antes: params.valorAntes, valor_depois: params.valorDepois,
  });
}

export type AuditoriaRow = {
  id: string; centro_custo_id: string | null; tabela: string; registro_id: string | null;
  acao: string; descricao: string | null; created_at: string;
};

export async function carregarAuditoriaCentro(userId: string, limit = 500): Promise<AuditoriaRow[]> {
  const { data } = await supabase.from("centro_custo_auditoria").select("*").order("created_at", { ascending: false }).limit(limit);
  return data || [];
}

// "Quem lançou" só existe pra registros criados DEPOIS que a auditoria passou a existir nos
// 4 módulos de origem — lançamentos antigos não têm essa informação e isso é dito explicitamente,
// nunca inferido.
export function primeiroRegistroAuditoria(auditoria: AuditoriaRow[], tabela: OrigemTabela, registroId: string): AuditoriaRow | null {
  const doRegistro = auditoria.filter(a => a.tabela === tabela && a.registro_id === registroId);
  if (doRegistro.length === 0) return null;
  return doRegistro.reduce((mais_antigo, a) => a.created_at < mais_antigo.created_at ? a : mais_antigo, doRegistro[0]);
}

export type CampoEditavel = "descricao" | "valor" | "categoria" | "data" | "centro_custo_id" | "fornecedor_id" | "dia_vencimento";

const COLUNA_POR_CAMPO: Partial<Record<CampoEditavel, Partial<Record<OrigemTabela, string>>>> = {
  valor: { custos_fixos: "valor_mensal", custos_variaveis: "valor", contas_pagar: "valor_total" },
  data: { custos_variaveis: "data", contas_pagar: "data_vencimento" },
};

// Fase 3 — Planilha: grava a edição de UMA célula direto na tabela de origem do
// lançamento (nunca cria número paralelo) e registra na mesma auditoria da Fase 2.
// Editar o valor de uma conta a pagar recalcula o status com a MESMA regra que a tela
// de Fornecedores usa (calcStatus) — nunca deixa status e valor divergirem.
export async function atualizarCampoOrigem(
  userId: string, empresaId: string | null, tabela: OrigemTabela, id: string, campo: CampoEditavel, valor: any,
  contexto?: { centroId?: string | null; valorPagoAtual?: number; dataVencimentoAtual?: string | null },
): Promise<{ erro?: string }> {
  const coluna = COLUNA_POR_CAMPO[campo]?.[tabela] || campo;
  const payload: any = { [coluna]: valor };

  if (tabela === "contas_pagar" && campo === "valor") {
    payload.status = calcStatus(Number(valor) || 0, contexto?.valorPagoAtual ?? 0, contexto?.dataVencimentoAtual);
  }

  const { error } = await supabase.from(tabela).update(payload).eq("id", id);
  if (error) return { erro: error.message };

  await registrarAuditoriaCentro({
    userId, empresaId, centroId: contexto?.centroId, tabela, registroId: id, acao: "editar",
    descricao: `Editado via Planilha: ${campo} = ${valor}`,
  });
  return {};
}
