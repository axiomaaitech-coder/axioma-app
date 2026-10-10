// 🦅 BASE DA DRE GERENCIAL — REGIME DE COMPETÊNCIA (2026-10-10)
//
// A DRE mostra o resultado do MÊS EM QUE O FATO ACONTECEU (nota emitida, venda feita,
// conta lançada), não do dia em que o dinheiro entrou/saiu — isso é o Fluxo de Caixa.
// Nenhum lançamento é criado aqui: só LÊ as fontes canônicas e escolhe, para cada fato,
// UMA origem (sem contar 2x):
//
//   RECEITA   receitas digitadas (Receitas/Faturamento MEI)            → data da receita
//             contas a receber (não canceladas)                         → competência/emissão
//             vendas do PDV finalizadas                                 → dia da venda
//             (linhas de receitas criadas pelo motor ao RECEBER uma conta a receber são
//              ignoradas: a própria conta a receber já representa a receita)
//   DEVOLUÇÃO vendas do PDV canceladas                                  → dia do cancelamento
//   CUSTO     custos variáveis digitados e custo de nota lançado na importação → data
//             contas a pagar (exceto custo fixo, imposto, DAS e nota já lançada) → emissão
//             (linhas de custos variáveis criadas pelo motor ao PAGAR uma conta são
//              ignoradas: a própria conta a pagar já representa o custo)
//   FIXO      custos fixos só nos meses de vigência (início → término), nunca no futuro
//   JUROS     pagos = conta contábil 9.01 (real) · estimados = dívidas × taxa (separado)
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { lerTodas } from "./lerTodas";
import { hojeISO } from "./datas";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type OrigemItem = "receita_manual" | "conta_receber" | "pdv" | "pdv_cancelada" | "custo_manual" | "custo_nota" | "conta_pagar";
export type ItemDRE = { valor: number; data: string; categoria?: string; descricao?: string; origem: OrigemItem; id: string };
export type CustoFixoVigencia = { id: string; valor_mensal: number; inicio: string; fim: string | null; descricao?: string; categoria?: string };

const r2 = (v: number) => Math.round(v * 100) / 100;
const mesDe = (iso: string) => iso.slice(0, 7);

// ---------------------------------------------------------------- regras puras
export type LinhaReceita = { id: string; valor: number; data: string; categoria?: string | null; descricao?: string | null; origem_tabela?: string | null };
export type LinhaContaReceber = { id: string; valor: number; valor_desconto?: number | null; status?: string | null; competencia?: string | null; data_emissao?: string | null; data_vencimento?: string | null; categoria?: string | null; descricao?: string | null };
export type LinhaVenda = { id: string; valor_total: number; status?: string | null; finalizada_em?: string | null; criado_em?: string | null; cancelada_em?: string | null };
export type LinhaCustoVar = { id: string; valor: number; data: string; categoria?: string | null; descricao?: string | null; origem_tabela?: string | null; origem_id?: string | null; rastreio_id?: string | null };
export type LinhaContaPagar = { id: string; valor_total: number; status?: string | null; data_emissao?: string | null; data_vencimento?: string | null; categoria?: string | null; descricao?: string | null; custo_fixo_id?: string | null; mei_obrigacao_id?: string | null; chave_acesso?: string | null; numero_nota?: string | null; fornecedor_id?: string | null };

const CANCELADA = ["cancelado", "cancelada"];
// Data do fato num fuso só (timestamp → dia no Brasil). "2026-10-09T23:30:00-03:00" é dia 09.
export function diaDoTimestamp(ts: string | null | undefined, fuso = "America/Sao_Paulo"): string | null {
  if (!ts) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(ts)) return ts;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function itensReceita(receitas: LinhaReceita[], contasReceber: LinhaContaReceber[], vendas: LinhaVenda[]): { receitas: ItemDRE[]; devolucoes: ItemDRE[] } {
  const out: ItemDRE[] = [];
  for (const r of receitas) {
    if (r.origem_tabela === "contas_receber") continue; // nasceu do recebimento: a conta a receber já conta
    out.push({ id: r.id, valor: Number(r.valor) || 0, data: r.data, categoria: r.categoria ?? undefined, descricao: r.descricao ?? undefined, origem: "receita_manual" });
  }
  for (const c of contasReceber) {
    if (CANCELADA.includes(String(c.status || ""))) continue;
    const data = c.competencia || c.data_emissao || c.data_vencimento;
    if (!data) continue;
    out.push({ id: c.id, valor: r2((Number(c.valor) || 0) - (Number(c.valor_desconto) || 0)), data, categoria: c.categoria ?? undefined, descricao: c.descricao ?? undefined, origem: "conta_receber" });
  }
  const devolucoes: ItemDRE[] = [];
  for (const v of vendas) {
    const dia = diaDoTimestamp(v.finalizada_em || v.criado_em);
    if (!dia || !(v.status === "finalizada" || v.cancelada_em)) continue; // só venda que chegou a fechar
    out.push({ id: v.id, valor: Number(v.valor_total) || 0, data: dia, categoria: "Vendas PDV", origem: "pdv" });
    const diaCanc = diaDoTimestamp(v.cancelada_em);
    if (diaCanc) devolucoes.push({ id: v.id, valor: Number(v.valor_total) || 0, data: diaCanc, categoria: "Venda PDV cancelada", origem: "pdv_cancelada" });
  }
  return { receitas: out, devolucoes };
}

// Contas a pagar cujo custo a nota de compra JÁ lançou em Custos Variáveis na importação
// (mesma regra do motor: mesma chave de acesso, ou mesmo nº de nota + fornecedor).
function contasComCustoDaNota(contas: LinhaContaPagar[], custos: LinhaCustoVar[]): Set<string> {
  const lancadas = new Set(custos.filter((c) => c.origem_tabela === "contas_pagar" && !c.rastreio_id && c.origem_id).map((c) => c.origem_id!));
  const chaveDe = (c: LinhaContaPagar) => c.chave_acesso ? `k:${c.chave_acesso}` : c.numero_nota && c.fornecedor_id ? `n:${c.numero_nota}:${c.fornecedor_id}` : `id:${c.id}`;
  const gruposLancados = new Set(contas.filter((c) => lancadas.has(c.id)).map(chaveDe));
  return new Set(contas.filter((c) => lancadas.has(c.id) || gruposLancados.has(chaveDe(c))).map((c) => c.id));
}

export function itensCusto(custos: LinhaCustoVar[], contas: LinhaContaPagar[]): ItemDRE[] {
  const out: ItemDRE[] = [];
  for (const c of custos) {
    if (c.origem_tabela === "contas_pagar" && c.rastreio_id) continue; // nasceu do pagamento: a conta a pagar já conta
    out.push({ id: c.id, valor: Number(c.valor) || 0, data: c.data, categoria: c.categoria ?? undefined, descricao: c.descricao ?? undefined, origem: c.origem_tabela === "contas_pagar" ? "custo_nota" : "custo_manual" });
  }
  const daNota = contasComCustoDaNota(contas, custos);
  for (const c of contas) {
    if (CANCELADA.includes(String(c.status || "")) || c.custo_fixo_id || c.mei_obrigacao_id || c.categoria === "Impostos" || daNota.has(c.id)) continue;
    const data = c.data_emissao || c.data_vencimento;
    if (!data) continue;
    out.push({ id: c.id, valor: Number(c.valor_total) || 0, data, categoria: c.categoria ?? undefined, descricao: c.descricao ?? undefined, origem: "conta_pagar" });
  }
  return out;
}

// Custo fixo só nos meses em que vigorava e nunca depois do mês atual.
export function mesesEntre(inicio: string, fim: string): string[] {
  const out: string[] = [];
  let [a, m] = [Number(inicio.slice(0, 4)), Number(inicio.slice(5, 7))];
  const [af, mf] = [Number(fim.slice(0, 4)), Number(fim.slice(5, 7))];
  while (a < af || (a === af && m <= mf)) { out.push(`${a}-${String(m).padStart(2, "0")}`); m++; if (m > 12) { m = 1; a++; } }
  return out;
}
export function custoFixoDoMes(cfs: CustoFixoVigencia[], mes: string, hoje = hojeISO()): number {
  if (mes > mesDe(hoje)) return 0; // não presume despesa futura
  return r2(cfs.filter((c) => mesDe(c.inicio) <= mes && (!c.fim || mesDe(c.fim) >= mes)).reduce((s, c) => s + (Number(c.valor_mensal) || 0), 0));
}
export function custoFixoNoPeriodo(cfs: CustoFixoVigencia[], inicio: string, fim: string, hoje = hojeISO()): number {
  return r2(mesesEntre(inicio, fim).reduce((s, m) => s + custoFixoDoMes(cfs, m, hoje), 0));
}

export const somaNoPeriodo = (itens: { valor: number; data: string }[], inicio: string, fim: string) =>
  r2(itens.filter((i) => i.data >= inicio && i.data <= fim).reduce((s, i) => s + (Number(i.valor) || 0), 0));

// ---------------------------------------------------------------- leitura
export type BaseDRE = {
  receitas: ItemDRE[]; devolucoes: ItemDRE[]; custos: ItemDRE[]; custosFixos: CustoFixoVigencia[];
  jurosPagos: { data: string; valor: number }[]; falhou: boolean; premissas: string[];
};

export async function carregarBaseDRE(empresaId: string, inicio: string, fim: string): Promise<BaseDRE> {
  const premissas: string[] = [];
  const [rec, cr, vd, cv, cp, cf, juros] = await Promise.all([
    lerTodas(() => supabase.from("receitas").select("id, valor, data, categoria, descricao, origem_tabela").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim).order("id")),
    lerTodas(() => supabase.from("contas_receber").select("id, valor, valor_desconto, status, competencia, data_emissao, data_vencimento, categoria, descricao").eq("empresa_id", empresaId).order("id")),
    lerTodas(() => supabase.from("venda").select("id, valor_total, status, finalizada_em, criado_em, cancelada_em").eq("empresa_id", empresaId).gte("criado_em", `${inicio}T00:00:00-03:00`).order("id")),
    lerTodas(() => supabase.from("custos_variaveis").select("id, valor, data, categoria, descricao, origem_tabela, origem_id, rastreio_id").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim).order("id")),
    lerTodas(() => supabase.from("contas_pagar").select("id, valor_total, status, data_emissao, data_vencimento, categoria, descricao, custo_fixo_id, mei_obrigacao_id, chave_acesso, numero_nota, fornecedor_id").eq("empresa_id", empresaId).order("id")),
    supabase.from("custos_fixos").select("*").eq("empresa_id", empresaId),
    lerTodas(() => supabase.from("lancamento_contabil_partida").select("valor, tipo, plano_de_contas!inner(codigo), lancamento_contabil!inner(data, empresa_id)")
      .eq("plano_de_contas.codigo", "9.01").eq("lancamento_contabil.empresa_id", empresaId).gte("lancamento_contabil.data", inicio).lte("lancamento_contabil.data", fim).order("id")),
  ]);
  const erros = [rec.error, cr.error, vd.error, cv.error, cp.error, cf.error, juros.error].filter(Boolean);
  for (const e of erros) Sentry.captureException(new Error(`[DRE competência] leitura: ${e!.message}`));
  const { receitas, devolucoes } = itensReceita(rec.data as LinhaReceita[], cr.data as LinhaContaReceber[], vd.data as LinhaVenda[]);
  const custos = itensCusto(cv.data as LinhaCustoVar[], cp.data as LinhaContaPagar[]);
  // Vigência do custo fixo: início = data_inicio (se a coluna existir) ou o dia do cadastro.
  const custosFixos: CustoFixoVigencia[] = ((cf.data || []) as Record<string, unknown>[]).map((c) => ({
    id: String(c.id), valor_mensal: Number(c.valor_mensal) || 0, descricao: c.descricao as string, categoria: c.categoria as string,
    inicio: (c.data_inicio as string) || String(c.created_at || hojeISO()).slice(0, 10), fim: (c.data_fim as string) || null,
  }));
  if (custosFixos.some((c) => !(c as unknown as { data_inicio?: string }).data_inicio)) premissas.push("custo_fixo_inicio_cadastro");
  const jurosPagos = ((juros.data || []) as unknown as { valor: number; tipo: string; lancamento_contabil: { data: string } }[])
    .map((p) => ({ data: p.lancamento_contabil.data, valor: (p.tipo === "debito" ? 1 : -1) * Number(p.valor) }));
  return { receitas, devolucoes, custos, custosFixos, jurosPagos, falhou: erros.length > 0, premissas };
}

// ---------------------------------------------------------------- PDV no Fluxo de Caixa
// Vendas do PDV viram linhas SÓ DE LEITURA no Fluxo (nada é gravado em fluxo_caixa —
// a venda é a fonte). Dinheiro/débito/Pix/outro = realizado no dia; crédito = previsto
// D+30 (a maquininha repassa depois — premissa mostrada na tela). Cancelada não entra.
export type LinhaVendaFluxo = LinhaVenda & { forma_pagamento?: string | null };
export type LancamentoPdvFluxo = { id: string; descricao: string; tipo: "entrada"; valor: number; data: string; status: "realizado" | "previsto"; origem_tabela: "venda"; categoria: string };
export function lancamentosPdvFluxo(vendas: LinhaVendaFluxo[], diasCredito = 30): LancamentoPdvFluxo[] {
  const grupos = new Map<string, LancamentoPdvFluxo>();
  for (const v of vendas) {
    if (v.cancelada_em || v.status !== "finalizada") continue;
    const dia = diaDoTimestamp(v.finalizada_em || v.criado_em);
    if (!dia) continue;
    const credito = v.forma_pagamento === "credito";
    const data = credito ? new Date(new Date(`${dia}T12:00:00Z`).getTime() + diasCredito * 86400000).toISOString().slice(0, 10) : dia;
    const chave = `${credito ? "c" : "r"}:${data}`;
    const atual = grupos.get(chave) ?? {
      id: `pdv-${chave}`, tipo: "entrada", valor: 0, data, status: credito ? "previsto" : "realizado", origem_tabela: "venda", categoria: "receita",
      descricao: credito ? `Vendas PDV no crédito de ${dia.slice(8, 10)}/${dia.slice(5, 7)} (previsão de repasse)` : `Vendas PDV ${dia.slice(8, 10)}/${dia.slice(5, 7)}`,
    };
    atual.valor = r2(atual.valor + (Number(v.valor_total) || 0));
    grupos.set(chave, atual);
  }
  return [...grupos.values()].sort((a, b) => b.data.localeCompare(a.data));
}

export async function lerVendasPdv(empresaId: string, inicio: string, fim: string): Promise<{ data: LinhaVendaFluxo[]; erro?: string }> {
  const { data, error } = await lerTodas(() => supabase.from("venda").select("id, valor_total, status, forma_pagamento, finalizada_em, criado_em, cancelada_em")
    .eq("empresa_id", empresaId).gte("criado_em", `${inicio}T00:00:00-03:00`).lte("criado_em", `${fim}T23:59:59-03:00`).order("id"));
  if (error) { Sentry.captureException(new Error(`[PDV no Fluxo] leitura: ${error.message}`)); return { data: [], erro: error.message }; }
  return { data: data as LinhaVendaFluxo[] };
}
