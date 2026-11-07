// Saldo de caixa REALIZADO — conta única do Fluxo de Caixa e do retrato da empresa (IA, Painel de Risco).
// Antes: o Fluxo somava só os últimos 24 meses e o retrato esquecia as vendas do PDV — números diferentes.
// Regra (igual à tela do Fluxo): lançamentos "realizado" até hoje + vendas do PDV finalizadas, não canceladas,
// pagas na hora (crédito é previsão de repasse, não saldo). Recebe o cliente do Supabase (tela ou servidor).
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerTodas } from "./lerTodas";
import { hojeISO } from "./datas";

type Venda = { valor_total: number | null; status: string | null; forma_pagamento: string | null; finalizada_em: string | null; criado_em: string | null; cancelada_em: string | null };

// Pura: soma das vendas do PDV que já viraram dinheiro em caixa até "hoje".
// O horário vem em UTC: o dia é o do fuso da empresa (venda depois das 21h ficava fora do caixa até virar o dia).
export function pdvRealizadoAte(vendas: Venda[], hoje: string, fuso = "America/Sao_Paulo"): number {
  return vendas.reduce((s, v) => {
    if (v.cancelada_em || v.status !== "finalizada" || v.forma_pagamento === "credito") return s;
    const quando = v.finalizada_em || v.criado_em;
    const dia = quando ? hojeISO(new Date(quando), fuso) : "";
    return dia && dia <= hoje ? s + (Number(v.valor_total) || 0) : s;
  }, 0);
}

// ponytail: soma no navegador/servidor lendo tudo; empresa com muitos anos de PDV → trocar por RPC de soma no banco.
export async function saldoCaixaRealizado(db: SupabaseClient, empresaId: string, hoje: string): Promise<{ saldo: number; erro?: string }> {
  const [fc, vd] = await Promise.all([
    lerTodas(() => db.from("fluxo_caixa").select("tipo, valor").eq("empresa_id", empresaId).eq("status", "realizado").lte("data", hoje).order("id")),
    lerTodas(() => db.from("venda").select("valor_total, status, forma_pagamento, finalizada_em, criado_em, cancelada_em").eq("empresa_id", empresaId).eq("status", "finalizada").order("id")),
  ]);
  const fluxo = ((fc.data || []) as { tipo: string; valor: number }[]).reduce((s, l) => s + (l.tipo === "entrada" ? 1 : -1) * (Number(l.valor) || 0), 0);
  const saldo = Math.round((fluxo + pdvRealizadoAte((vd.data || []) as Venda[], hoje)) * 100) / 100;
  return { saldo, erro: fc.error?.message || vd.error?.message };
}

// Quanto foi comprado no cartão de crédito e ainda não saiu do caixa: saldo da conta 3.06 na Contabilidade.
export async function saldoCartaoAPagar(db: SupabaseClient, empresaId: string): Promise<{ saldo: number; erro?: string }> {
  const { data, error } = await lerTodas(() => db.from("lancamento_contabil_partida").select("tipo, valor, plano_de_contas!inner(codigo)")
    .eq("empresa_id", empresaId).eq("plano_de_contas.codigo", "3.06").order("id"));
  const linhas = (data || []) as unknown as { tipo: string; valor: number }[];
  const saldo = linhas.reduce((s, l) => s + (l.tipo === "credito" ? 1 : -1) * (Number(l.valor) || 0), 0);
  return { saldo: Math.round(saldo * 100) / 100, erro: error?.message };
}
