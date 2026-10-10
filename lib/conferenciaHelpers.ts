// 🦅 CONFERÊNCIA ENTRE MÓDULOS + PRÉVIAS DE REPROCESSAMENTO (2026-10-10)
//
// SÓ LEITURA. Compara, mês a mês, pares que usam o MESMO critério (senão a diferença é
// do critério, não erro):
//   competência: DRE gerencial (lib/dreCompetencia) × Contabilidade (contas 6, 7, 8)
//   caixa:       contas pagas (Contas a Pagar)     × saídas do Fluxo vindas delas
//   caixa:       contas recebidas (Contas a Receber) × entradas do Fluxo vindas delas
// E monta a PRÉVIA dos casos históricos (D3 pagamento sem rastro, D4 baixa sem rastro,
// D5 receita fora da Contabilidade, D7 receita pendente sem conta a receber): registros,
// IDs, antes × depois, impacto por módulo e risco de duplicidade. Nada é executado aqui.
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { lerTodas } from "./lerTodas";
import { carregarBaseDRE, custoFixoDoMes, mesesEntre, somaNoPeriodo } from "./dreCompetencia";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const r2 = (v: number) => Math.round(v * 100) / 100;
const TOLERANCIA = 0.01;

export type Par = { a: number; b: number; diferenca: number; ok: boolean };
const par = (a: number, b: number): Par => ({ a: r2(a), b: r2(b), diferenca: r2(a - b), ok: Math.abs(a - b) <= TOLERANCIA });

export type LinhaConferencia = {
  mes: string;
  receitaDreXContabil: Par; custoDreXContabil: Par;
  pagoXFluxo: Par; recebidoXFluxo: Par;
};

export type CasoReprocessar = {
  codigo: "D3" | "D4" | "D5" | "D7";
  id: string; tabela: string; descricao: string; data: string | null;
  antes: string; depois: string;
  impacto: { modulo: string; efeito: string }[];
  risco: string | null; // possível duplicidade encontrada
};

type Partida = { valor: number; tipo: string; plano_de_contas: { codigo: string }; lancamento_contabil: { data: string } };

// ---------------------------------------------------------------- regras puras
export function somaContabil(partidas: Partida[], prefixos: string[], natureza: "credito" | "debito", inicio: string, fim: string): number {
  return r2(partidas.filter((p) => p.lancamento_contabil.data >= inicio && p.lancamento_contabil.data <= fim && prefixos.some((x) => p.plano_de_contas.codigo.startsWith(x)))
    .reduce((s, p) => s + (p.tipo === natureza ? 1 : -1) * Number(p.valor), 0));
}

// Quanto do pagamento de cada conta chegou ao motor (pagamentos − estornos).
export function rastreadoPorConta(rastros: { origem_id: string; tipo: string; valor: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rastros) {
    const sinal = r.tipo.endsWith("_estorno") ? -1 : 1;
    m.set(r.origem_id, r2((m.get(r.origem_id) ?? 0) + sinal * Number(r.valor)));
  }
  return m;
}

// ---------------------------------------------------------------- leitura
export async function carregarConferencia(empresaId: string, inicio: string, fim: string, lang: "pt" | "en" | "es" = "pt"): Promise<{ meses: LinhaConferencia[]; casos: CasoReprocessar[]; falhou: boolean }> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const [base, partidas, cp, cr, fc, rastros, receitasPend, receitasManuais] = await Promise.all([
    carregarBaseDRE(empresaId, inicio, fim),
    lerTodas(() => supabase.from("lancamento_contabil_partida").select("valor, tipo, plano_de_contas!inner(codigo), lancamento_contabil!inner(data, empresa_id)")
      .eq("lancamento_contabil.empresa_id", empresaId).gte("lancamento_contabil.data", inicio).lte("lancamento_contabil.data", fim).order("id")),
    lerTodas(() => supabase.from("contas_pagar").select("id, descricao, valor_pago, data_pagamento, status, mei_obrigacao_id").eq("empresa_id", empresaId).gt("valor_pago", 0).order("id")),
    lerTodas(() => supabase.from("contas_receber").select("id, descricao, valor_recebido, data_recebimento").eq("empresa_id", empresaId).gt("valor_recebido", 0).order("id")),
    lerTodas(() => supabase.from("fluxo_caixa").select("id, tipo, valor, data, status, descricao, origem_tabela, origem_id").eq("empresa_id", empresaId).eq("status", "realizado").order("id")),
    lerTodas(() => supabase.from("rastreio_movimentacao").select("id, origem_tabela, origem_id, tipo, valor").eq("empresa_id", empresaId).order("id")),
    lerTodas(() => supabase.from("receitas").select("id, descricao, valor, data, cliente_id").eq("empresa_id", empresaId).eq("status", "pendente").is("origem_tabela", null).order("id")),
    lerTodas(() => supabase.from("receitas").select("id, descricao, valor, data, status").eq("empresa_id", empresaId).is("origem_tabela", null).gte("data", inicio).lte("data", fim).order("id")),
  ]);
  const erros = [partidas.error, cp.error, cr.error, fc.error, rastros.error, receitasPend.error, receitasManuais.error].filter(Boolean);
  for (const e of erros) Sentry.captureException(new Error(`[conferência] leitura: ${e!.message}`));
  const P = partidas.data as unknown as Partida[];
  const fluxo = fc.data as { id: string; tipo: string; valor: number; data: string; descricao: string; origem_tabela: string | null; origem_id: string | null }[];
  const rastro = rastros.data as { id: string; origem_tabela: string; origem_id: string; tipo: string; valor: number }[];

  // ---- pares mês a mês
  const meses = mesesEntre(inicio, fim).map((mes) => {
    const i = `${mes}-01`, f = `${mes}-31`;
    const receitaDre = somaNoPeriodo(base.receitas, i, f) - somaNoPeriodo(base.devolucoes, i, f);
    const custoDre = somaNoPeriodo(base.custos, i, f) + custoFixoDoMes(base.custosFixos, mes);
    const pago = (cp.data as { valor_pago: number; data_pagamento: string | null }[]).filter((c) => c.data_pagamento && c.data_pagamento >= i && c.data_pagamento <= f).reduce((s, c) => s + Number(c.valor_pago), 0);
    const recebido = (cr.data as { valor_recebido: number; data_recebimento: string | null }[]).filter((c) => c.data_recebimento && c.data_recebimento >= i && c.data_recebimento <= f).reduce((s, c) => s + Number(c.valor_recebido), 0);
    const fluxoDe = (tabela: string, tipo: string) => fluxo.filter((x) => x.origem_tabela === tabela && x.tipo === tipo && x.data >= i && x.data <= f).reduce((s, x) => s + Number(x.valor), 0);
    return {
      mes,
      receitaDreXContabil: par(receitaDre, somaContabil(P, ["6"], "credito", i, f)),
      custoDreXContabil: par(custoDre, somaContabil(P, ["7", "8"], "debito", i, f)),
      pagoXFluxo: par(pago, fluxoDe("contas_pagar", "saida")),
      recebidoXFluxo: par(recebido, fluxoDe("contas_receber", "entrada")),
    };
  });

  // ---- prévias (D3/D4 pagamento sem rastro, D5 receita fora da Contabilidade, D7 pendente sem conta)
  const casos: CasoReprocessar[] = [];
  const fmt = (v: number) => v.toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { style: "currency", currency: "BRL" });
  const rastreado = rastreadoPorConta(rastro.filter((r) => r.origem_tabela === "contas_pagar" && (r.tipo === "ap_pagamento" || r.tipo === "ap_estorno")));
  for (const c of cp.data as { id: string; descricao: string; valor_pago: number; data_pagamento: string | null; mei_obrigacao_id: string | null }[]) {
    if (c.mei_obrigacao_id) continue; // DAS tem motor próprio
    const falta = r2(Number(c.valor_pago) - (rastreado.get(c.id) ?? 0));
    if (falta <= TOLERANCIA) continue;
    const semNada = !rastreado.has(c.id);
    const parecido = fluxo.find((x) => x.tipo === "saida" && !x.origem_tabela && Math.abs(Number(x.valor) - falta) <= TOLERANCIA && x.data === c.data_pagamento);
    casos.push({
      codigo: semNada ? "D3" : "D4", id: c.id, tabela: "contas_pagar", descricao: c.descricao, data: c.data_pagamento,
      antes: L(`Pago ${fmt(Number(c.valor_pago))}; chegou ao Fluxo/Contabilidade ${fmt(rastreado.get(c.id) ?? 0)}`, `Paid ${fmt(Number(c.valor_pago))}; reached Cash Flow/Accounting ${fmt(rastreado.get(c.id) ?? 0)}`, `Pagado ${fmt(Number(c.valor_pago))}; llegó al Flujo/Contabilidad ${fmt(rastreado.get(c.id) ?? 0)}`),
      depois: L(`Registrar no motor o pagamento que falta: ${fmt(falta)} em ${c.data_pagamento ?? "—"}`, `Record the missing payment in the engine: ${fmt(falta)} on ${c.data_pagamento ?? "—"}`, `Registrar en el motor el pago que falta: ${fmt(falta)} el ${c.data_pagamento ?? "—"}`),
      impacto: [
        { modulo: L("Fluxo de Caixa", "Cash Flow", "Flujo de Caja"), efeito: L(`+1 saída realizada de ${fmt(falta)}`, `+1 actual outflow of ${fmt(falta)}`, `+1 salida realizada de ${fmt(falta)}`) },
        { modulo: L("Contabilidade", "Accounting", "Contabilidad"), efeito: L(`baixa de ${fmt(falta)} em Fornecedores (3.01) contra Caixa/Banco`, `${fmt(falta)} settlement in Suppliers (3.01) against Cash/Bank`, `baja de ${fmt(falta)} en Proveedores (3.01) contra Caja/Banco`) },
        { modulo: "DRE", efeito: L("nenhum (a DRE por competência já conta a conta pela emissão)", "none (accrual P&L already counts the bill by issue date)", "ninguno (el EERR por devengo ya cuenta la cuenta por emisión)") },
      ],
      risco: parecido ? L(`Já existe no Fluxo uma saída manual de ${fmt(Number(parecido.valor))} no mesmo dia ("${parecido.descricao}") — pode ser o mesmo dinheiro.`, `There is already a manual outflow of ${fmt(Number(parecido.valor))} on the same day ("${parecido.descricao}") — it may be the same money.`, `Ya existe una salida manual de ${fmt(Number(parecido.valor))} el mismo día ("${parecido.descricao}") — puede ser el mismo dinero.`) : null,
    });
  }
  const receitasComRastro = new Set(rastro.filter((r) => r.origem_tabela === "receitas").map((r) => r.origem_id));
  for (const r of receitasManuais.data as { id: string; descricao: string; valor: number; data: string; status: string }[]) {
    if (r.status !== "recebido" || receitasComRastro.has(r.id)) continue;
    const noFluxo = fluxo.find((x) => x.tipo === "entrada" && Math.abs(Number(x.valor) - Number(r.valor)) <= TOLERANCIA && x.data === r.data);
    casos.push({
      codigo: "D5", id: r.id, tabela: "receitas", descricao: r.descricao, data: r.data,
      antes: L(`Receita de ${fmt(Number(r.valor))} sem lançamento na Contabilidade`, `${fmt(Number(r.valor))} revenue with no Accounting entry`, `Ingreso de ${fmt(Number(r.valor))} sin asiento en Contabilidad`),
      depois: L(`Lançar ${fmt(Number(r.valor))} na Contabilidade (receita contra Caixa/Banco) em ${r.data}`, `Post ${fmt(Number(r.valor))} to Accounting (revenue against Cash/Bank) on ${r.data}`, `Registrar ${fmt(Number(r.valor))} en Contabilidad (ingreso contra Caja/Banco) el ${r.data}`),
      impacto: [
        { modulo: L("Contabilidade", "Accounting", "Contabilidad"), efeito: L(`+${fmt(Number(r.valor))} de receita`, `+${fmt(Number(r.valor))} revenue`, `+${fmt(Number(r.valor))} de ingreso`) },
        { modulo: L("Fluxo de Caixa", "Cash Flow", "Flujo de Caja"), efeito: noFluxo ? L("nenhum — já existe a entrada no Fluxo (só a Contabilidade será lançada)", "none — the Cash Flow entry already exists (only Accounting is posted)", "ninguno — ya existe la entrada en el Flujo (solo se registra Contabilidad)") : L(`+1 entrada realizada de ${fmt(Number(r.valor))}`, `+1 actual inflow of ${fmt(Number(r.valor))}`, `+1 entrada realizada de ${fmt(Number(r.valor))}`) },
        { modulo: "DRE", efeito: L("nenhum (já está na DRE)", "none (already in the P&L)", "ninguno (ya está en el EERR)") },
      ],
      risco: noFluxo ? L(`Entrada igual já no Fluxo ("${noFluxo.descricao}"): reprocessar SÓ a Contabilidade, senão o caixa duplica.`, `Same inflow already in Cash Flow ("${noFluxo.descricao}"): reprocess ONLY Accounting, otherwise cash doubles.`, `Entrada igual ya en el Flujo ("${noFluxo.descricao}"): reprocesar SOLO Contabilidad, si no la caja se duplica.`) : null,
    });
  }
  const { data: contasCliente } = await supabase.from("contas_receber").select("valor, cliente_id, descricao").eq("empresa_id", empresaId);
  for (const r of receitasPend.data as { id: string; descricao: string; valor: number; data: string; cliente_id: string | null }[]) {
    const parecida = (contasCliente || []).find((c) => Math.abs(Number(c.valor) - Number(r.valor)) <= TOLERANCIA && (!r.cliente_id || c.cliente_id === r.cliente_id));
    casos.push({
      codigo: "D7", id: r.id, tabela: "receitas", descricao: r.descricao, data: r.data,
      antes: L(`Receita "pendente" de ${fmt(Number(r.valor))} sem conta a receber — o caixa nunca espera esse dinheiro`, `"Pending" revenue of ${fmt(Number(r.valor))} with no receivable — cash never expects it`, `Ingreso "pendiente" de ${fmt(Number(r.valor))} sin cuenta por cobrar — la caja nunca lo espera`),
      depois: L(`Criar conta a receber de ${fmt(Number(r.valor))} (vencimento a definir por você) ligada a esta receita`, `Create a ${fmt(Number(r.valor))} receivable (due date set by you) linked to this revenue`, `Crear cuenta por cobrar de ${fmt(Number(r.valor))} (vencimiento definido por usted) vinculada a este ingreso`),
      impacto: [
        { modulo: L("Contas a Receber", "Receivables", "Cuentas por Cobrar"), efeito: L(`+1 conta de ${fmt(Number(r.valor))}`, `+1 bill of ${fmt(Number(r.valor))}`, `+1 cuenta de ${fmt(Number(r.valor))}`) },
        { modulo: L("Fluxo de Caixa", "Cash Flow", "Flujo de Caja"), efeito: L("+1 entrada PREVISTA no vencimento", "+1 FORECAST inflow on the due date", "+1 entrada PREVISTA en el vencimiento") },
        { modulo: "DRE", efeito: L("a receita sai das receitas digitadas e passa a contar pela conta a receber (mesmo valor, sem duplicar)", "revenue moves from typed revenue to the receivable (same amount, no duplicate)", "el ingreso pasa de los ingresos digitados a la cuenta por cobrar (mismo valor, sin duplicar)") },
      ],
      risco: parecida ? L(`Já existe conta a receber de valor igual ("${parecida.descricao}") — talvez já esteja lançada.`, `A receivable with the same amount exists ("${parecida.descricao}") — it may already be recorded.`, `Ya existe cuenta por cobrar de igual valor ("${parecida.descricao}") — quizá ya esté registrada.`) : L("Confirme se o cliente ainda não pagou antes de criar a conta.", "Confirm the customer has not paid yet before creating the bill.", "Confirme que el cliente aún no pagó antes de crear la cuenta."),
    });
  }
  return { meses, casos, falhou: base.falhou || erros.length > 0 };
}
