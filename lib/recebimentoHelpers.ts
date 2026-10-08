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
import { publicarEventoNaoBloqueante } from "./contabilidadeConsumidor";
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
  dataReal?: string, // dia em que o dinheiro entrou (extrato/comprovante); padrão = hoje
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
  const dataRecebimento = dataReal && /^\d{4}-\d{2}-\d{2}$/.test(dataReal) ? dataReal : hojeISO();
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

// ============================================================================
// PORTA ÚNICA de criar/editar/excluir conta a receber — Contas a Receber,
// Clientes, Inadimplência e Importar Documentos usam estas (antes cada tela
// gravava direto e várias não avisavam a contabilidade).
//   • A conta SEMPRE nasce sem recebimento: dinheiro recebido só entra por
//     registrarRecebimento (Motor de Rastreabilidade). recebidoNaOrigem = nota
//     que já veio recebida → cria e registra o recebimento pelo caminho oficial.
//   • Editar nunca mexe no já recebido.
//   • Excluir é bloqueado se já houve QUALQUER recebimento (inclusive parcial):
//     precisa estornar antes, senão o recebimento ficaria órfão no Razão.
// ============================================================================
type Linha = Record<string, unknown>;
const COLUNAS_OPCIONAIS = ["responsavel", "prioridade", "projeto"]; // ainda sem ALTER TABLE em todo ambiente

async function gravarComReserva(fazer: (p: Linha) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>, payload: Linha) {
  const r = await fazer(payload);
  if (r.error?.code !== "42703") return { ...r, semColunasOpcionais: false };
  const reduzido = { ...payload };
  COLUNAS_OPCIONAIS.forEach((k) => delete reduzido[k]);
  return { ...(await fazer(reduzido)), semColunasOpcionais: true };
}

export async function criarContaReceber(
  userId: string, empresaId: string, dados: Linha,
  opcoes?: { recebidoNaOrigem?: number; modulo?: string; proveniencia?: Record<string, string | number | null> },
): Promise<{ id?: string; erro?: string; avisoRecebimento?: string; semColunasOpcionais?: boolean }> {
  const total = Number(dados.valor) || 0;
  const status = statusEfetivo(null, total, 0, (dados.data_vencimento as string) ?? null, "recebido");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { valor_recebido: _a, data_recebimento: _b, status: _c, ...resto } = dados;
  const payload = { ...resto, valor: total, valor_recebido: 0, data_recebimento: null, status, user_id: userId, empresa_id: empresaId };
  const { data, error, semColunasOpcionais } = await gravarComReserva((p) => supabase.from("contas_receber").insert(p).select("*").single(), payload);
  const conta = data as (ContaParaReceber & Linha) | null;
  if (error || !conta) {
    reportarFalhaEscrita("contas_receber", "insert", error?.message || "0 linhas (RLS?)");
    return { erro: error?.message || "falha_gravacao" };
  }
  const modulo = opcoes?.modulo ?? "contas_receber";
  // Nascimento da conta vira rastro (Fase 2): de onde veio + contabilidade com status.
  await registrarMovimentacao({
    empresaId, tipo: "ar_criacao", origemTabela: "contas_receber", origemId: conta.id, valor: total,
    data: (dados.data_emissao as string) || hojeISO(),
    payload: {
      descricao: (dados.descricao as string) || "", categoria: (dados.categoria as string) ?? null,
      centro_custo_id: (dados.centro_custo_id as string) ?? null, origem_modulo: modulo, proveniencia: opcoes?.proveniencia ?? null, evento_tipo: "AR_CREATED",
      evento_payload: {
        conta_id: conta.id, cliente_id: (dados.cliente_id as string) ?? null, valor: total,
        descricao: (dados.descricao as string) ?? null, categoria: (dados.categoria as string) ?? null,
        data_emissao: (dados.data_emissao as string) ?? null, competencia: (dados.competencia as string) ?? null,
        centro_custo_id: (dados.centro_custo_id as string) ?? null, proveniencia: opcoes?.proveniencia ?? null,
      },
    },
  });
  const recebido = Number(opcoes?.recebidoNaOrigem) || 0;
  if (recebido > 0) {
    const r = await registrarRecebimento(conta, Math.min(recebido, total), empresaId, modulo);
    return { id: conta.id, avisoRecebimento: r.erro, semColunasOpcionais };
  }
  return { id: conta.id, semColunasOpcionais };
}

export async function editarContaReceber(id: string, dados: Linha, modulo = "contas_receber"): Promise<{ erro?: string; semColunasOpcionais?: boolean }> {
  const { data: antes, error: erroAntes } = await supabase.from("contas_receber")
    .select("valor, valor_recebido, status, categoria, data_vencimento").eq("id", id).maybeSingle();
  if (erroAntes || !antes) return { erro: erroAntes?.message || "conta_nao_encontrada" };
  const total = Number(dados.valor ?? antes.valor) || 0;
  const recebido = Number(antes.valor_recebido) || 0;
  if (total + 0.005 < recebido) return { erro: "abaixo_do_recebido" };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { valor_recebido: _a, data_recebimento: _b, status: _c, ...resto } = dados;
  const venc = (dados.data_vencimento as string) ?? (antes.data_vencimento as string) ?? null;
  const status = recebido >= total - 0.005 && total > 0 ? "recebido" : statusEfetivo(null, total, recebido, venc, "recebido");
  const { data, error, semColunasOpcionais } = await gravarComReserva((p) => supabase.from("contas_receber").update(p).eq("id", id).select("id, empresa_id"), { ...resto, valor: total, status });
  const linhas = data as { id: string; empresa_id: string }[] | null;
  if (error || !linhas?.length) {
    reportarFalhaEscrita("contas_receber", "update", error?.message || "0 linhas (RLS?)");
    return { erro: error?.message || "falha_gravacao" };
  }
  publicarEventoNaoBloqueante(linhas[0].empresa_id, "AR_UPDATED", {
    conta_id: id, campos: Object.keys(resto),
    valor_antes: antes.valor ?? null, valor_depois: total,
    categoria_antes: antes.categoria ?? null, categoria_depois: (dados.categoria as string) ?? antes.categoria ?? null,
    descricao_depois: (dados.descricao as string) ?? null, data_emissao_depois: (dados.data_emissao as string) ?? null,
    centro_custo_id_depois: (dados.centro_custo_id as string) ?? null,
  }, { modulo, tabela: "contas_receber", id });
  return { semColunasOpcionais };
}

export async function excluirContaReceber(id: string, modulo = "contas_receber"): Promise<{ erro?: string }> {
  const { data: antes } = await supabase.from("contas_receber").select("valor_recebido").eq("id", id).maybeSingle();
  if (Number(antes?.valor_recebido) > 0) return { erro: "ja_recebida" };
  const { data, error } = await supabase.from("contas_receber").delete().eq("id", id).select("id, empresa_id");
  if (error || !data?.length) {
    reportarFalhaEscrita("contas_receber", "delete", error?.message || "0 linhas (RLS?)");
    return { erro: error?.message || "falha_gravacao" };
  }
  publicarEventoNaoBloqueante(data[0].empresa_id as string, "AR_DELETED", { conta_id: id }, { modulo, tabela: "contas_receber", id });
  return {};
}
