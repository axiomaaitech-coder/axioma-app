import { createBrowserClient } from "@supabase/ssr";
import { obterEmpresaAtiva } from "./empresaHelpers";
import { montarDRE, simularCenariosExecutivos, type ResultadoCenario, type ChoqueSimulador } from "./cfoCore";
import { calcularImpostoRegime } from "./iaTributariaHelpers";
import { macroParaChoque, type VariaveisMacro } from "./nexusSimulacaoMotor";
import { reportarFalhaLeitura as reportarFalhaEscrita } from "./erroUiHelpers"; // mesmo envio ao Sentry; nome local deixa claro que é escrita

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 5: Minhas Simulações (nexus_simulation, empresa_id +
// RLS por empresas_do_usuario). Ponto de partida com as MESMAS fórmulas do
// módulo Simulações (app/(interno)/simulacoes/page.tsx): últimos 12 meses de
// receita/custo variável, custo fixo mensal cadastrado, saldo devedor ×
// taxa das dívidas, caixa realizado do Fluxo de Caixa, alíquota pelo regime.
// Leitura dos módulos da empresa é só SELECT — nunca escreve neles.
// ═══════════════════════════════════════════════════════════════

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type PontoPartida = {
  receitaMensal: number;
  custoFixoMensal: number;
  custoVariavelMensal: number;
  dividaTotal: number;
  despesasFinanceirasMensal: number;
  aliquotaEfetivaPct: number;
  caixaDisponivel: number;
  lucroMensal: number;
  temDados: boolean;
  cnae: string | null; // "código - descrição", do cadastro da Empresa
};

const MESES_JANELA = 12;

export async function carregarPontoPartida(): Promise<{ ponto: PontoPartida | null; empresaId: string | null; erro: boolean }> {
  const empresaId = await obterEmpresaAtiva();
  if (!empresaId) return { ponto: null, empresaId: null, erro: false };
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - MESES_JANELA, hoje.getDate()).toISOString().slice(0, 10);
  const fim = hoje.toISOString().slice(0, 10);

  const [rec, cf, cv, dv, fc, emp] = await Promise.all([
    supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim),
    supabase.from("custos_fixos").select("valor_mensal").eq("empresa_id", empresaId),
    supabase.from("custos_variaveis").select("valor").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim),
    supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("empresa_id", empresaId),
    supabase.from("fluxo_caixa").select("tipo, valor, status").eq("empresa_id", empresaId),
    supabase.from("empresas").select("regime_tributario, cnae_principal, cnae_descricao").eq("id", empresaId).maybeSingle(),
  ]);
  const erro = [rec, cf, cv, dv, fc].some((r) => r.error);

  const soma = (linhas: { [k: string]: unknown }[] | null, campo: string) => (linhas ?? []).reduce((s, l) => s + Number(l[campo] || 0), 0);
  const receita12m = soma(rec.data, "valor");
  const receitaMensal = receita12m / MESES_JANELA;
  const custoVariavelMensal = soma(cv.data, "valor") / MESES_JANELA;
  const custoFixoMensal = soma(cf.data, "valor_mensal");
  const dividas = (dv.data ?? []) as { valor_total: number; valor_pago: number; taxa_juros: number }[];
  const saldo = (d: { valor_total: number; valor_pago: number }) => Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0));
  const dividaTotal = dividas.reduce((s, d) => s + saldo(d), 0);
  const despesasFinanceirasMensal = dividas.reduce((s, d) => s + saldo(d) * (Number(d.taxa_juros || 0) / 100), 0);
  const imposto = calcularImpostoRegime(emp.data?.regime_tributario || "", receita12m, receitaMensal);
  const aliquotaEfetivaPct = receitaMensal > 0 ? (imposto / receitaMensal) * 100 : 0;
  const caixaDisponivel = ((fc.data ?? []) as { tipo: string; valor: number; status: string }[])
    .filter((l) => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);
  const lucroMensal = montarDRE({
    receitaBruta: receitaMensal, deducoes: receitaMensal * (aliquotaEfetivaPct / 100),
    custoVariavel: custoVariavelMensal, custoFixo: custoFixoMensal, despesasFinanceiras: despesasFinanceirasMensal,
  }).lucroLiquido.valor;

  return {
    empresaId, erro,
    ponto: {
      receitaMensal, custoFixoMensal, custoVariavelMensal, dividaTotal, despesasFinanceirasMensal,
      aliquotaEfetivaPct, caixaDisponivel, lucroMensal, temDados: receitaMensal > 0 || custoFixoMensal > 0,
      cnae: emp.data?.cnae_principal ? `${emp.data.cnae_principal}${emp.data.cnae_descricao ? ` - ${emp.data.cnae_descricao}` : ""}` : null,
    },
  };
}

export type ResultadoSimulacao = { choque: ChoqueSimulador; cenarios: ResultadoCenario[]; lucroAtualMensal: number; explicacao?: string };

export function rodarSimulacao(p: PontoPartida, v: VariaveisMacro, horizonteMeses: number): ResultadoSimulacao {
  const choque = macroParaChoque(v);
  const cenarios = simularCenariosExecutivos({
    receitaMensalAtual: p.receitaMensal, custoFixoMensalAtual: p.custoFixoMensal, custoVariavelMensalAtual: p.custoVariavelMensal,
    despesasFinanceirasMensalAtual: p.despesasFinanceirasMensal, dividaTotalAtual: p.dividaTotal,
    aliquotaEfetivaPct: p.aliquotaEfetivaPct, saldoCaixaAtual: p.caixaDisponivel, choque, horizonteMeses,
  });
  return { choque, cenarios, lucroAtualMensal: p.lucroMensal };
}

// ─── Persistência ───

export type SimulacaoSalva = {
  id: string;
  nome: string;
  descricao: string | null;
  variaveis: VariaveisMacro;
  horizonteMeses: number;
  resultado: ResultadoSimulacao | null;
  status: "draft" | "running" | "completed" | "archived" | "deleted";
  favorita: boolean;
  atualizadoEm: string;
};

type LinhaSim = {
  id: string; simulation_name: string; description: string | null; variables: VariaveisMacro; horizon: string | null;
  result: ResultadoSimulacao | null; status: SimulacaoSalva["status"]; favorita: boolean | null; updated_at: string;
};
const paraSim = (l: LinhaSim): SimulacaoSalva => ({
  id: l.id, nome: l.simulation_name, descricao: l.description, variaveis: l.variables, horizonteMeses: Number(l.horizon || 12),
  resultado: l.result, status: l.status, favorita: !!l.favorita, atualizadoEm: l.updated_at,
});
const COLUNAS = "id, simulation_name, description, variables, horizon, result, status, favorita, updated_at";

export const POR_PAGINA_SIM = 12;

// Paginação real (.range) — a lista cresce com o uso.
export async function listarSimulacoes(empresaId: string, arquivadas: boolean, pagina = 0): Promise<{ lista: SimulacaoSalva[]; temMais: boolean; erro: boolean }> {
  const inicio = pagina * POR_PAGINA_SIM;
  const { data, error } = await supabase
    .from("nexus_simulation")
    .select(COLUNAS)
    .eq("empresa_id", empresaId)
    .eq("status", arquivadas ? "archived" : "completed")
    .order("favorita", { ascending: false })
    .order("updated_at", { ascending: false })
    .range(inicio, inicio + POR_PAGINA_SIM);
  if (error) return { lista: [], temMais: false, erro: true };
  const linhas = (data ?? []) as LinhaSim[];
  return { lista: linhas.slice(0, POR_PAGINA_SIM).map(paraSim), temMais: linhas.length > POR_PAGINA_SIM, erro: false };
}

export async function salvarSimulacao(p: {
  empresaId: string; id?: string; nome: string; descricao: string | null; variaveis: VariaveisMacro;
  horizonteMeses: number; resultado: ResultadoSimulacao; ponto: PontoPartida;
}): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  const linha = {
    empresa_id: p.empresaId, simulation_name: p.nome, description: p.descricao, variables: p.variaveis,
    assumptions: { ponto_partida: p.ponto }, horizon: String(p.horizonteMeses), result: p.resultado,
    status: "completed", updated_at: new Date().toISOString(),
  };
  // varredura:ok — .select().maybeSingle() e conferência de linha logo abaixo
  const q = p.id
    ? supabase.from("nexus_simulation").update(linha).eq("id", p.id).eq("empresa_id", p.empresaId).select("id").maybeSingle()
    : supabase.from("nexus_simulation").insert({ ...linha, criado_por: user?.id ?? null }).select("id").maybeSingle();
  const { data, error } = await q;
  if (error || !data) { reportarFalhaEscrita("nexus.salvarSimulacao", error ?? new Error("0 linhas afetadas")); return null; }
  return data.id as string;
}

// Excluir = soft delete (status 'deleted'): some da tela, fica pra auditoria.
export async function mudarStatusSimulacao(empresaId: string, id: string, status: "completed" | "archived" | "deleted"): Promise<boolean> {
  const { data, error } = await supabase.from("nexus_simulation")
    .update({ status, archived_at: status === "archived" ? new Date().toISOString() : null, updated_at: new Date().toISOString() })
    .eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data?.length) { reportarFalhaEscrita("nexus.mudarStatusSimulacao", error ?? new Error("0 linhas afetadas")); return false; }
  return true;
}

export async function favoritarSimulacao(empresaId: string, id: string, favorita: boolean): Promise<boolean> {
  const { data, error } = await supabase.from("nexus_simulation").update({ favorita }).eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data?.length) { reportarFalhaEscrita("nexus.favoritarSimulacao", error ?? new Error("0 linhas afetadas")); return false; }
  return true;
}

// Arquiva sozinho o que não é mexido há 90 dias (e não é favorito) — a lista
// não enche de rascunho velho; nada é apagado (Push 03: workspace ≠ auditoria).
export const DIAS_AUTO_ARQUIVAR = 90;
export async function autoArquivarAntigas(empresaId: string): Promise<void> {
  const limite = new Date(Date.now() - DIAS_AUTO_ARQUIVAR * 86400000).toISOString();
  // varredura:ok — 0 linhas é normal (nada antigo pra arquivar); erro de verdade vai pro Sentry
  const { error } = await supabase.from("nexus_simulation")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("empresa_id", empresaId).eq("status", "completed").eq("favorita", false).lt("updated_at", limite);
  if (error) reportarFalhaEscrita("nexus.autoArquivarAntigas", error);
}

// Quantas simulações ativas a empresa tem — pro card "Minhas Simulações" em /nexus.
export async function contarSimulacoes(empresaId: string): Promise<number> {
  const { count } = await supabase.from("nexus_simulation").select("id", { count: "exact", head: true })
    .eq("empresa_id", empresaId).eq("status", "completed");
  return count ?? 0;
}

// CNAE da empresa ativa, pro selo "seu ramo" nos eventos do Nexus (1 SELECT leve).
export async function carregarCnaeEmpresa(): Promise<string | null> {
  const empresaId = await obterEmpresaAtiva();
  if (!empresaId) return null;
  const { data } = await supabase.from("empresas").select("cnae_principal").eq("id", empresaId).maybeSingle();
  return data?.cnae_principal ?? null;
}
