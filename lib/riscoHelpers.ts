// 🦅 PAINEL DE RISCO (Financial Core 2.6 — bloco A3, Elias 2026-10-10)
//
// Regras puras: cada risco vira uma nota de 0 a 100 (100 = sem risco) com nível e a
// explicação em números, a partir do MESMO retrato que a IA usa (lib/ia/retratoEmpresa),
// pra o painel e a IA nunca falarem números diferentes. Sem dado = "sem_dado", nunca nota inventada.
import type { NumerosRetrato } from "./ia/retratoEmpresa";

export type Idioma3 = "pt" | "en" | "es";
export type NivelRisco = "ok" | "atencao" | "risco" | "sem_dado";
export type ChaveRisco = "liquidez" | "credito" | "concentracao" | "margem" | "endividamento" | "atrasos";
export type ItemRisco = { chave: ChaveRisco; nota: number | null; nivel: NivelRisco; titulo: string; explicacao: string; rota: string };

// Faixas: valor ≤ (ou ≥) cada degrau dá 100 / 70 / 40, senão 15.
function porFaixa(v: number, degraus: [number, number, number], menorMelhor: boolean): number {
  const [a, b, c] = degraus;
  if (menorMelhor) return v <= a ? 100 : v <= b ? 70 : v <= c ? 40 : 15;
  return v >= a ? 100 : v >= b ? 70 : v >= c ? 40 : 15;
}
export const nivelDaNota = (n: number | null): NivelRisco => (n == null ? "sem_dado" : n >= 70 ? (n === 100 ? "ok" : "atencao") : "risco");

export function avaliarRiscos(x: NumerosRetrato, lang: Idioma3): ItemRisco[] {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const brl = (v: number) => v.toLocaleString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const pct = (v: number) => `${v.toFixed(0)}%`;
  const item = (chave: ChaveRisco, nota: number | null, titulo: string, explicacao: string, rota: string): ItemRisco =>
    ({ chave, nota, nivel: nivelDaNota(nota), titulo, explicacao, rota });

  // 1) Liquidez: o caixa cobre o que vence em 30 dias?
  const cobertura = x.aPagar30d > 0 ? x.caixa / x.aPagar30d : null;
  const liquidez = item("liquidez", x.aPagar30d > 0 ? porFaixa(cobertura!, [1.5, 1, 0.5], false) : x.caixa >= 0 ? 100 : 15,
    L("Liquidez (caixa × contas dos próximos 30 dias)", "Liquidity (cash × bills due in 30 days)", "Liquidez (caja × cuentas de los próximos 30 días)"),
    x.aPagar30d > 0
      ? L(`Caixa ${brl(x.caixa)} para ${brl(x.aPagar30d)} a pagar em 30 dias — cobre ${cobertura!.toFixed(1)}x.`, `Cash ${brl(x.caixa)} for ${brl(x.aPagar30d)} due in 30 days — covers ${cobertura!.toFixed(1)}x.`, `Caja ${brl(x.caixa)} para ${brl(x.aPagar30d)} a pagar en 30 días — cubre ${cobertura!.toFixed(1)}x.`)
      : L(`Nada a pagar nos próximos 30 dias; caixa ${brl(x.caixa)}.`, `Nothing due in the next 30 days; cash ${brl(x.caixa)}.`, `Nada a pagar en los próximos 30 días; caja ${brl(x.caixa)}.`),
    "/tesouraria");

  // 2) Crédito: quanto do a receber já venceu.
  const credito = item("credito", x.inadimplenciaPct == null ? null : porFaixa(x.inadimplenciaPct, [5, 15, 30], true),
    L("Clientes atrasando (inadimplência)", "Late customers (delinquency)", "Clientes atrasados (morosidad)"),
    x.inadimplenciaPct == null
      ? L("Nenhuma conta a receber em aberto.", "No open receivables.", "Ninguna cuenta por cobrar abierta.")
      : L(`${brl(x.aReceberVencido)} vencidos de ${brl(x.aReceberAberto)} a receber (${pct(x.inadimplenciaPct)}).`, `${brl(x.aReceberVencido)} overdue out of ${brl(x.aReceberAberto)} receivable (${pct(x.inadimplenciaPct)}).`, `${brl(x.aReceberVencido)} vencidos de ${brl(x.aReceberAberto)} por cobrar (${pct(x.inadimplenciaPct)}).`),
    "/inadimplencia");

  // 3) Concentração: dependência do maior cliente no a receber.
  const concentracao = item("concentracao", x.concentracaoTopClientePct == null ? null : porFaixa(x.concentracaoTopClientePct, [20, 40, 60], true),
    L("Dependência do maior cliente", "Reliance on the largest customer", "Dependencia del mayor cliente"),
    x.concentracaoTopClientePct == null
      ? L("Sem contas a receber com cliente informado.", "No receivables with a customer set.", "Sin cuentas por cobrar con cliente informado.")
      : L(`O maior cliente é ${pct(x.concentracaoTopClientePct)} de tudo que há para receber.`, `The largest customer is ${pct(x.concentracaoTopClientePct)} of everything receivable.`, `El mayor cliente es ${pct(x.concentracaoTopClientePct)} de todo lo por cobrar.`),
    "/clientes");

  // 4) Margem: lucro sobre a receita (média mensal 12 meses).
  const margem = item("margem", x.margemPct == null ? null : porFaixa(x.margemPct, [15, 5, 0], false),
    L("Margem de lucro", "Profit margin", "Margen de ganancia"),
    x.margemPct == null
      ? L("Sem receita lançada nos últimos 12 meses.", "No revenue recorded in the last 12 months.", "Sin ingresos en los últimos 12 meses.")
      : L(`Lucro ${brl(x.lucroMensal)}/mês sobre receita ${brl(x.receitaMensal)}/mês (margem ${pct(x.margemPct)}).`, `Profit ${brl(x.lucroMensal)}/mo on revenue ${brl(x.receitaMensal)}/mo (margin ${pct(x.margemPct)}).`, `Ganancia ${brl(x.lucroMensal)}/mes sobre ingresos ${brl(x.receitaMensal)}/mes (margen ${pct(x.margemPct)}).`),
    "/dre");

  // 5) Endividamento: saldo devedor sobre a receita do ano.
  const endividamento = item("endividamento", x.dividaSobreReceitaAnualPct == null ? (x.dividaTotal > 0 ? 15 : null) : porFaixa(x.dividaSobreReceitaAnualPct, [20, 50, 100], true),
    L("Dívida pesando", "Debt load", "Peso de la deuda"),
    x.dividaTotal <= 0
      ? L("Nenhuma dívida em aberto.", "No open debt.", "Ninguna deuda abierta.")
      : L(`Saldo devedor ${brl(x.dividaTotal)}${x.dividaSobreReceitaAnualPct != null ? ` = ${pct(x.dividaSobreReceitaAnualPct)} da receita do ano` : " sem receita para pagar"}; juros ${brl(x.jurosMensal)}/mês.`, `Debt balance ${brl(x.dividaTotal)}${x.dividaSobreReceitaAnualPct != null ? ` = ${pct(x.dividaSobreReceitaAnualPct)} of yearly revenue` : " with no revenue to pay it"}; interest ${brl(x.jurosMensal)}/mo.`, `Saldo deudor ${brl(x.dividaTotal)}${x.dividaSobreReceitaAnualPct != null ? ` = ${pct(x.dividaSobreReceitaAnualPct)} de los ingresos del año` : " sin ingresos para pagarla"}; intereses ${brl(x.jurosMensal)}/mes.`),
    "/endividamento");

  // 6) Atrasos da própria empresa: contas a pagar e obrigações fiscais vencidas.
  const pctAtraso = x.aPagarAberto > 0 ? (x.aPagarVencido / x.aPagarAberto) * 100 : 0;
  const notaAtraso = Math.min(porFaixa(pctAtraso, [0, 10, 30], true), x.obrigacoesAtrasadas > 0 ? 40 : 100);
  const atrasos = item("atrasos", notaAtraso,
    L("Contas e impostos atrasados", "Overdue bills and taxes", "Cuentas e impuestos atrasados"),
    L(`${brl(x.aPagarVencido)} a pagar já vencidos${x.obrigacoesAtrasadas ? ` · ${x.obrigacoesAtrasadas} obrigação(ões) fiscal(is) atrasada(s)` : ""}.`, `${brl(x.aPagarVencido)} payable already overdue${x.obrigacoesAtrasadas ? ` · ${x.obrigacoesAtrasadas} overdue tax obligation(s)` : ""}.`, `${brl(x.aPagarVencido)} por pagar ya vencidos${x.obrigacoesAtrasadas ? ` · ${x.obrigacoesAtrasadas} obligación(es) fiscal(es) atrasada(s)` : ""}.`),
    "/contas-pagar");

  // ponytail: concentração de FORNECEDOR (spec 2.6) fica fora — o retrato não traz; usar concentracaoFornecedores() se pedirem.
  return [liquidez, credito, concentracao, margem, endividamento, atrasos];
}

// Nota geral = média das notas com dado; o pior risco aparece primeiro na tela.
export function notaGeral(itens: ItemRisco[]): number | null {
  const com = itens.filter((i) => i.nota != null).map((i) => i.nota as number);
  return com.length ? Math.round(com.reduce((s, n) => s + n, 0) / com.length) : null;
}

// ============================================================================
// MÉTRICAS DO CFO (bloco A4): prazos médios e quanto tempo o caixa aguenta.
// ============================================================================
const DIA = 86400000;
// Prazo médio em dias, ponderado pelo valor (conta grande pesa mais). Ignora linha sem datas
// ou com data final antes da inicial (lançamento inconsistente não puxa a média).
export function prazoMedioDias(itens: { inicio: string | null; fim: string | null; valor: number }[]): number | null {
  let soma = 0, peso = 0;
  for (const i of itens) {
    if (!i.inicio || !i.fim || !(i.valor > 0)) continue;
    const d = (Date.parse(`${i.fim.slice(0, 10)}T12:00:00Z`) - Date.parse(`${i.inicio.slice(0, 10)}T12:00:00Z`)) / DIA;
    if (!Number.isFinite(d) || d < 0) continue;
    soma += d * i.valor; peso += i.valor;
  }
  return peso > 0 ? Math.round(soma / peso) : null;
}
// Meses que o caixa paga as saídas do mês sem entrar nenhuma venda.
export function mesesDeCaixa(caixa: number, saidaMensal: number): number | null {
  if (!(saidaMensal > 0)) return null;
  return caixa <= 0 ? 0 : Math.round((caixa / saidaMensal) * 10) / 10;
}
