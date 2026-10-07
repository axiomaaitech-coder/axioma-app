// Recebimento de conta a receber — regra ÚNICA usada por Contas a Receber e
// Inadimplência (antes cada tela tinha a sua e a de Inadimplência ignorava o
// desconto, lançando como recebido dinheiro que não entrou).
//   • Desconto concedido só se concretiza na quitação: a conta passa a valer o
//     líquido e a receita é reconhecida pelo líquido (AR_UPDATED). Sem isso o
//     desconto ficaria "a receber" pra sempre no Dashboard, na IA e na Tesouraria.
//   • O que passar do que faltava do principal é juros/multa: vai pra
//     6.04 Receitas Financeiras, nunca crédito extra em Clientes.
import { createBrowserClient } from "@supabase/ssr";
import { registrarMovimentacao } from "./rastreio/motor";
import * as Sentry from "@sentry/nextjs";
import { statusEfetivo } from "./fornecedorHelpers";
import { hojeISO } from "./datas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type ContaParaReceber = {
  id: string; empresa_id?: string | null; valor: number | null; valor_recebido?: number | null; valor_desconto?: number | null;
  data_vencimento: string | null; forma_recebimento?: string | null; categoria?: string | null; descricao?: string | null;
  data_emissao?: string | null; centro_custo_id?: string | null; cliente_id?: string | null;
};

export type ResultadoRecebimento =
  | { erro: "valor_invalido" | "falha_gravacao" }
  | { erro?: undefined; status: string; valorRecebido: number; valor: number; valorDesconto: number; dataRecebimento: string };

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

const r2 = (v: number) => Math.round(v * 100) / 100;

// Quanto falta pra quitar (líquido de desconto, sem juros) — o "receber tudo" usa isto.
export function faltaReceber(c: ContaParaReceber): number {
  return Math.max(0, r2(Number(c.valor || 0) - Number(c.valor_desconto || 0) - Number(c.valor_recebido || 0)));
}

export async function registrarRecebimento(
  c: ContaParaReceber, incremento: number, empresaId: string | null, modulo: string,
): Promise<ResultadoRecebimento> {
  const valorIncremento = r2(incremento);
  if (!Number.isFinite(valorIncremento) || valorIncremento < 0.01) return { erro: "valor_invalido" };
  const jaRecebido = Number(c.valor_recebido || 0);
  const desconto = Number(c.valor_desconto || 0);
  const valorBruto = Number(c.valor || 0);
  const devidoLiquido = Math.max(0, r2(valorBruto - desconto));
  const novoRecebido = r2(jaRecebido + valorIncremento);
  const quitou = novoRecebido >= devidoLiquido - 0.005;
  const encargos = Math.max(0, r2(valorIncremento - Math.max(0, devidoLiquido - jaRecebido)));
  const aplicarDesconto = quitou && desconto > 0;
  const dataRecebimento = hojeISO();
  const status = quitou ? "recebido" : statusEfetivo(null, devidoLiquido, novoRecebido, c.data_vencimento, "recebido");
  const valorFinal = aplicarDesconto ? devidoLiquido : valorBruto;
  const descontoFinal = aplicarDesconto ? 0 : desconto;

  const { data, error } = await supabase.from("contas_receber").update({
    valor_recebido: novoRecebido, status, data_recebimento: dataRecebimento,
    ...(aplicarDesconto ? { valor: devidoLiquido, valor_desconto: 0 } : {}),
  }).eq("id", c.id).select("id");
  if (error || !data || data.length === 0) {
    reportarFalhaEscrita("contas_receber", `recebimento (${modulo})`, error?.message || "0 linhas afetadas (RLS?)");
    return { erro: "falha_gravacao" };
  }

  const emp = c.empresa_id ?? empresaId;
  if (emp) {
    // Motor de Rastreabilidade: o recebimento vira um rastro que leva o dinheiro até
    // contabilidade, Fluxo de Caixa, Receitas/DRE e Inadimplência — cada porta com status.
    await registrarMovimentacao({
      empresaId: emp, tipo: "ar_recebimento", origemTabela: "contas_receber", origemId: c.id,
      valor: valorIncremento, encargos, data: dataRecebimento,
      payload: {
        descricao: c.descricao || "Conta a receber", contraparte: await nomeCliente(c.cliente_id), contraparte_id: c.cliente_id ?? null,
        categoria: c.categoria ?? null, centro_custo_id: c.centro_custo_id ?? null, forma: c.forma_recebimento ?? null,
        quitou, evento_tipo: "AR_RECEIVED",
        // valor_incremento = só o que entrou NESTA baixa (uma 2ª parcial não duplica a 1ª).
        evento_payload: {
          conta_id: c.id, valor_recebido: novoRecebido, valor_incremento: valorIncremento, valor_encargos: encargos,
          data_recebimento: dataRecebimento, forma_recebimento: c.forma_recebimento ?? null,
        },
        desconto: aplicarDesconto ? {
          evento_payload: {
            conta_id: c.id, campos: ["valor", "valor_desconto"],
            valor_antes: valorBruto, valor_depois: devidoLiquido,
            categoria_antes: c.categoria ?? null, categoria_depois: c.categoria ?? null,
            descricao_depois: c.descricao ?? null, data_emissao_depois: c.data_emissao || null,
            centro_custo_id_depois: c.centro_custo_id || null,
          },
        } : null,
      },
    });
  }

  return { status, valorRecebido: novoRecebido, valor: valorFinal, valorDesconto: descontoFinal, dataRecebimento };
}

// Estorno do recebimento (a tela já zerou valor_recebido na conta): o rastro tira
// da contabilidade, do Fluxo e das Receitas o que os recebimentos anteriores deixaram.
export async function registrarEstornoRecebimento(c: ContaParaReceber, valorEstornado: number, motivo: string, empresaId: string | null): Promise<void> {
  const emp = c.empresa_id ?? empresaId;
  if (!emp) return;
  await registrarMovimentacao({
    empresaId: emp, tipo: "ar_estorno", origemTabela: "contas_receber", origemId: c.id,
    valor: valorEstornado, data: hojeISO(),
    payload: {
      descricao: `Estorno: ${c.descricao || "Conta a receber"}`, contraparte: await nomeCliente(c.cliente_id), contraparte_id: c.cliente_id ?? null,
      categoria: c.categoria ?? null, evento_tipo: "AR_PAYMENT_REVERSED",
      evento_payload: { conta_id: c.id, valor: valorEstornado, motivo },
    },
  });
}

async function nomeCliente(id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const { data } = await supabase.from("clientes").select("nome").eq("id", id).maybeSingle();
  return (data?.nome as string) ?? null;
}
