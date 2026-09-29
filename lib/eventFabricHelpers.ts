// 🦅 AXIOMA AI.TECH — CFO Core, Fase 1, Commit 1: Event Fabric (capacidade).
// publicarEvento() é o único ponto de escrita em eventos_negocio. Nenhum
// módulo chama isso ainda (publisher liga no Commit 2) — este arquivo só
// entrega a capacidade + o tipo do evento.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear o insert e devolver 0 linhas SEM error do Postgres —
// .select("id") é o que permite enxergar essa falha silenciosa (mesmo padrão
// já usado em contasPagarHelpers.ts, empresaHelpers.ts, etc.).
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// TIPOS
// ============================================================================

// União dos tipos de evento já previstos no desenho da Fase 1, mas o campo
// "tipo" no banco é text livre (sem CHECK) — o `(string & {})` mantém
// autocomplete pros conhecidos sem travar módulo novo que precise de um tipo
// que ainda não está nesta lista.
export type TipoEventoConhecido =
  | "SALE_CREATED"
  | "AP_CREATED"
  | "AP_UPDATED"
  | "AP_PAID"
  | "AP_PAYMENT_REVERSED"
  | "AP_DELETED"
  | "AP_APPROVED"
  | "AP_REJECTED"
  | "AP_DUPLICATE_DETECTED"
  | "AP_DUPLICATE_IGNORED"
  | "AR_OVERDUE"
  | "INVOICE_APPROVED"
  | "BANK_RECONCILED"
  | "ACCOUNTING_ENTRY_CREATED"
  | "STOCK_ENTRY_MANUAL"
  | "STOCK_ADJUSTMENT"
  | "STOCK_LOSS"
  | "CASH_WITHDRAWAL"
  | "CASH_DEPOSIT"
  | "CASH_MOVEMENT_UPDATED"
  | "CASH_MOVEMENT_DELETED";

export type TipoEvento = TipoEventoConhecido | (string & {});

export type OrigemEvento = {
  modulo: string; // 'pdv' | 'contas_pagar' | 'contas_receber' | 'open_finance' | ...
  tabela?: string; // tabela de origem do evento (ex: 'contas_pagar')
  id?: string; // id da linha de origem nessa tabela
};

// ============================================================================
// PUBLICAR EVENTO
// ============================================================================

export async function publicarEvento(
  empresaId: string,
  tipo: TipoEvento,
  payload: Record<string, unknown>,
  origem: OrigemEvento,
): Promise<{ id?: string; erro?: string }> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("eventos_negocio").insert({
    empresa_id: empresaId,
    tipo,
    origem_modulo: origem.modulo,
    origem_tabela: origem.tabela ?? null,
    origem_id: origem.id ?? null,
    payload,
    usuario_id: authData?.user?.id ?? null,
    versao: 1,
  }).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("eventos_negocio", "insert", motivo);
    return { erro: motivo };
  }
  return { id: data[0].id };
}
