// 🦅 AXIOMA AI.TECH - Helpers do Centro de Custos (Fase 1: integração com módulos reais)
// Rateio divide UM lançamento existente (de custos_fixos/custos_variaveis/contas_pagar)
// entre vários centros por % — nunca duplica o valor, só a fração de cada centro.

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type OrigemTabela = "custos_fixos" | "custos_variaveis" | "contas_pagar";

export const LABEL_ORIGEM: Record<OrigemTabela, string> = {
  custos_fixos: "Custos Fixos",
  custos_variaveis: "Custos Variáveis",
  contas_pagar: "Contas a Pagar (Fornecedores)",
};

export type LancamentoOrigem = {
  tabela: OrigemTabela;
  id: string;
  descricao: string;
  valor: number;
  centro_custo_id: string | null;
};

export async function carregarLancamentosOrigem(userId: string, tabela: OrigemTabela): Promise<LancamentoOrigem[]> {
  if (tabela === "custos_fixos") {
    const { data } = await supabase.from("custos_fixos").select("id, descricao, valor_mensal, centro_custo_id").eq("user_id", userId).order("descricao");
    return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor_mensal || 0), centro_custo_id: d.centro_custo_id }));
  }
  if (tabela === "custos_variaveis") {
    const { data } = await supabase.from("custos_variaveis").select("id, descricao, valor, centro_custo_id").eq("user_id", userId).order("data", { ascending: false }).limit(200);
    return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor || 0), centro_custo_id: d.centro_custo_id }));
  }
  const { data } = await supabase.from("contas_pagar").select("id, descricao, valor_total, centro_custo_id").eq("user_id", userId).order("data_vencimento", { ascending: false }).limit(200);
  return (data || []).map((d: any) => ({ tabela, id: d.id, descricao: d.descricao, valor: Number(d.valor_total || 0), centro_custo_id: d.centro_custo_id }));
}

export async function carregarTodosLancamentosOrigem(userId: string): Promise<LancamentoOrigem[]> {
  const [cf, cv, cp] = await Promise.all([
    carregarLancamentosOrigem(userId, "custos_fixos"),
    carregarLancamentosOrigem(userId, "custos_variaveis"),
    carregarLancamentosOrigem(userId, "contas_pagar"),
  ]);
  return [...cf, ...cv, ...cp];
}

export type RateioRow = {
  id: string; origem_tabela: OrigemTabela; origem_id: string; centro_custo_id: string;
  percentual: number; base_tipo: string; descricao: string | null; created_at: string;
};

export async function carregarRateios(userId: string): Promise<RateioRow[]> {
  const { data } = await supabase.from("centro_custo_rateio").select("*").eq("user_id", userId);
  return data || [];
}

export async function aplicarRateio(
  userId: string, origemTabela: OrigemTabela, origemId: string, descricao: string, baseTipo: string,
  splits: { centroId: string; percentual: number }[],
): Promise<{ erro?: string }> {
  await supabase.from("centro_custo_rateio").delete().eq("user_id", userId).eq("origem_tabela", origemTabela).eq("origem_id", origemId);
  const linhas = splits.filter(s => s.percentual > 0).map(s => ({
    user_id: userId, origem_tabela: origemTabela, origem_id: origemId,
    centro_custo_id: s.centroId, percentual: s.percentual, base_tipo: baseTipo, descricao,
  }));
  if (linhas.length === 0) return {};
  const { error } = await supabase.from("centro_custo_rateio").insert(linhas);
  return error ? { erro: error.message } : {};
}

export async function removerRateio(userId: string, origemTabela: OrigemTabela, origemId: string): Promise<void> {
  await supabase.from("centro_custo_rateio").delete().eq("user_id", userId).eq("origem_tabela", origemTabela).eq("origem_id", origemId);
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
  const { data } = await supabase.from("centro_custo_orcamento").select("*").eq("user_id", userId);
  return data || [];
}

export async function definirOrcamento(userId: string, centroId: string, periodo: string, valor: number): Promise<{ erro?: string }> {
  const { error } = await supabase.from("centro_custo_orcamento")
    .upsert({ user_id: userId, centro_custo_id: centroId, periodo, valor_orcado: valor }, { onConflict: "centro_custo_id,periodo" });
  return error ? { erro: error.message } : {};
}

export function orcamentoDoPeriodo(orcamentos: OrcamentoRow[], centroId: string, periodo: string, fallback: number): number {
  const registro = orcamentos.find(o => o.centro_custo_id === centroId && o.periodo === periodo);
  return registro ? Number(registro.valor_orcado) : fallback;
}

export async function registrarAuditoriaCentro(params: {
  userId: string; centroId?: string | null; tabela: string; registroId?: string;
  acao: "criar" | "editar" | "excluir"; descricao?: string; valorAntes?: any; valorDepois?: any;
}): Promise<void> {
  await supabase.from("centro_custo_auditoria").insert({
    user_id: params.userId, centro_custo_id: params.centroId, tabela: params.tabela,
    registro_id: params.registroId, acao: params.acao, descricao: params.descricao,
    valor_antes: params.valorAntes, valor_depois: params.valorDepois,
  });
}
