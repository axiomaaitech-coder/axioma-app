// Saldo de caixa REALIZADO — conta única do Fluxo de Caixa e do retrato da empresa (IA, Painel de Risco).
// Antes: o Fluxo somava só os últimos 24 meses e o retrato esquecia as vendas do PDV — números diferentes.
// Regra (igual à tela do Fluxo): lançamentos "realizado" até hoje + vendas do PDV finalizadas, não canceladas,
// pagas na hora (crédito é previsão de repasse, não saldo). Recebe o cliente do Supabase (tela ou servidor).
import type { SupabaseClient } from "@supabase/supabase-js";
import { lerTodas } from "./lerTodas";

type Venda = { valor_total: number | null; status: string | null; forma_pagamento: string | null; finalizada_em: string | null; criado_em: string | null; cancelada_em: string | null };

// Pura: soma das vendas do PDV que já viraram dinheiro em caixa até "hoje".
export function pdvRealizadoAte(vendas: Venda[], hoje: string): number {
  return vendas.reduce((s, v) => {
    if (v.cancelada_em || v.status !== "finalizada" || v.forma_pagamento === "credito") return s;
    const dia = String(v.finalizada_em || v.criado_em || "").slice(0, 10);
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
