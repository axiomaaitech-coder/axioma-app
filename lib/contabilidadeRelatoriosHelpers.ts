// Leitura pura do ledger contábil (lancamento_contabil + partida) — nunca
// escreve. Base compartilhada pelas 3 telas de Contabilidade (Razão,
// Balancete, DRE): elas só formatam e agrupam o que sai daqui.

import { createBrowserClient } from "@supabase/ssr";
import type { NaturezaContabil } from "./contabilidadeHelpers";
import * as Sentry from "@sentry/nextjs";
import { lerTodas } from "./lerTodas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type LancamentoContabilRow = {
  id: string;
  data: string;
  descricao: string;
  origem_tabela: string | null;
  origem_id: string | null;
  evento_id: string | null;
  estornado_por_id: string | null;
};

export type PartidaRow = {
  id: string;
  lancamento_id: string;
  conta_id: string;
  tipo: "debito" | "credito";
  valor: number;
  centro_custo_id: string | null;
};

// Falha de leitura NUNCA vira "nenhum lançamento" calado: a tela pergunta leituraLedgerFalhou()
// depois de carregar e avisa. (Antes: sem lotes — cortava em 1000 linhas — e sem erro.)
let falhouLeitura = false;
function marcarFalha(onde: string, msg: string) {
  falhouLeitura = true;
  Sentry.captureException(new Error(`[ledger] ${onde}: ${msg}`));
}
export function leituraLedgerFalhou(): boolean { const f = falhouLeitura; falhouLeitura = false; return f; }

export async function listarLancamentos(empresaId: string, inicio?: string, fim?: string): Promise<LancamentoContabilRow[]> {
  const { data, error } = await lerTodas(() => {
    let q = supabase.from("lancamento_contabil")
      .select("id, data, descricao, origem_tabela, origem_id, evento_id, estornado_por_id")
      .eq("empresa_id", empresaId);
    if (inicio) q = q.gte("data", inicio);
    if (fim) q = q.lte("data", fim);
    return q.order("data").order("id");
  });
  if (error) marcarFalha("lancamentos", error.message);
  return (data as LancamentoContabilRow[]) || [];
}

// Em blocos de 150 ids (limite de tamanho do endereço) e cada bloco lido em lotes (sem corte em 1000).
// ponytail: muitos milhares de lançamentos → trocar por view/RPC agregada no banco.
export async function listarPartidas(empresaId: string, lancamentoIds: string[], contaId?: string): Promise<PartidaRow[]> {
  const tudo: PartidaRow[] = [];
  for (let i = 0; i < lancamentoIds.length; i += 150) {
    const bloco = lancamentoIds.slice(i, i + 150);
    const { data, error } = await lerTodas(() => {
      let q = supabase.from("lancamento_contabil_partida")
        .select("id, lancamento_id, conta_id, tipo, valor, centro_custo_id")
        .eq("empresa_id", empresaId)
        .in("lancamento_id", bloco);
      if (contaId) q = q.eq("conta_id", contaId);
      return q.order("id");
    });
    if (error) marcarFalha("partidas", error.message);
    tudo.push(...((data as PartidaRow[]) || []));
  }
  return tudo;
}

// Saldo "natural" de uma conta: cresce com débito se devedora, cresce com
// crédito se credora (mesma regra contábil documentada no schema).
export function saldoNatural(natureza: NaturezaContabil, totalDebito: number, totalCredito: number): number {
  return natureza === "devedora" ? totalDebito - totalCredito : totalCredito - totalDebito;
}

export function diaAnterior(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

const ORIGEM_LABEL: Record<string, { pt: string; en: string; es: string }> = {
  contas_pagar: { pt: "Contas a Pagar", en: "Accounts Payable", es: "Cuentas por Pagar" },
  contas_receber: { pt: "Contas a Receber", en: "Accounts Receivable", es: "Cuentas por Cobrar" },
  estoque_movimentacoes: { pt: "Estoque", en: "Inventory", es: "Inventario" },
  caixa_movimentacao: { pt: "Caixa", en: "Cash Register", es: "Caja" },
  venda: { pt: "Venda PDV", en: "POS Sale", es: "Venta POS" },
  receitas: { pt: "Receitas", en: "Revenue", es: "Ingresos" },
  custos_variaveis: { pt: "Custos Variáveis", en: "Variable Costs", es: "Costos Variables" },
  fluxo_caixa: { pt: "Fluxo de Caixa", en: "Cash Flow", es: "Flujo de Caja" },
  dividas: { pt: "Dívidas", en: "Debts", es: "Deudas" },
  mei_obrigacoes: { pt: "MEI — DAS", en: "MEI — DAS", es: "MEI — DAS" },
  manual: { pt: "Lançamento manual", en: "Manual entry", es: "Asiento manual" },
};

export function origemLabel(origemTabela: string | null, lang: "pt" | "en" | "es"): string {
  if (!origemTabela) return { pt: "Lançamento Manual", en: "Manual Entry", es: "Asiento Manual" }[lang];
  return ORIGEM_LABEL[origemTabela]?.[lang] || origemTabela;
}

// Grupo da DRE a partir do código ("6.03" -> "6", "10.01" -> "10").
export function grupoDre(codigo: string): "6" | "7" | "8" | "9" | "10" | null {
  const raiz = codigo.split(".")[0];
  return raiz === "6" || raiz === "7" || raiz === "8" || raiz === "9" || raiz === "10" ? raiz : null;
}
