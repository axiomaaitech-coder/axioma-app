// 🦅 AXIOMA AI.TECH - Helpers de Relatórios CFO
// Cálculos profissionais com dados reais do Supabase.
// Implementa 12+ indicadores brasileiros, Score CFO 0-100, insights automáticos.

import { saldoCaixaRealizado } from "./caixaSaldo";
import { soVigentes } from "./custoFixoVigente";
import { lerTodas } from "./lerTodas";
import { createBrowserClient } from "@supabase/ssr";
import { calcularImpostoRegime, categoriaMeiDaEmpresa } from "./iaTributariaHelpers";
import { nomeMesPt, mesesPorLang } from "./cfoCore";
import { reportarFalhaLeitura } from "./erroUiHelpers";
import { hojeISO } from "./datas";
export { nomeMesPt };

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// TIPOS
// ============================================================================

export type Periodo = { inicio: string; fim: string; ano: number; mes: number };

export type DRE = {
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custos_variaveis: number;
  margem_contribuicao: number;
  custos_fixos: number;
  lucro_operacional: number;
  despesas_financeiras: number;
  lucro_liquido: number;
  // percentuais sobre receita
  pct_deducoes: number;
  pct_custos_variaveis: number;
  pct_custos_fixos: number;
  pct_margem_contribuicao: number;
  pct_lucro_liquido: number;
};

export type PontoEvolucao = {
  mes: string;
  ano: number;
  mes_num: number;
  receita: number;
  custos: number;
  lucro: number;
  margem: number;
};

export type CategoriaCusto = {
  name: string;
  value: number;
  color: string;
  pct: number;
};

export type Lang3 = "pt" | "en" | "es";
const tr = (lang: Lang3, pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);

export type KPI = {
  chave: string; // identificador fixo (o nome muda com o idioma)
  nome: string;
  valor: string;
  valor_num: number;
  meta: string;
  meta_num: number;
  atingido: boolean;
  unidade: "BRL" | "PCT" | "RATIO" | "MESES" | "SCORE";
  categoria: "rentabilidade" | "liquidez" | "endividamento" | "operacional" | "crescimento";
  descricao: string;
};

export type Insight = {
  tipo: "positivo" | "atencao" | "alerta" | "neutro";
  titulo: string;
  texto: string;
  metrica?: string;
};

// ============================================================================
// HELPERS DE PERÍODO
// ============================================================================

export function montarPeriodo(ano: number, mes: number): Periodo {
  const inicio = new Date(ano, mes - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(ano, mes, 0).toISOString().slice(0, 10);
  return { inicio, fim, ano, mes };
}

// ============================================================================
// DRE GERENCIAL (Demonstração do Resultado do Exercício)
// ============================================================================

// Leitura que falha lança erro: a tela mostra o aviso (tratarFalhaCarregamento) em vez de
// montar relatório com zero no lugar do dado que não veio.
function exigir<T>(r: { data: T | null; error: { message: string } | null }, contexto: string): T | null {
  if (r.error) throw new Error(`[relatorios] ${contexto}: ${r.error.message}`);
  return r.data;
}

export async function carregarDRE(empresaId: string, periodo: Periodo): Promise<DRE> {
  // 1) Receitas do período
  // Todas as leituras em paralelo (antes uma depois da outra).
  const inicio12m = new Date(periodo.ano, periodo.mes - 12, 1).toISOString().slice(0, 10);
  const [rRecs, rCvs, rCfs, rDivs, rEmp, rRec12] = await Promise.all([
    lerTodas(() => supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", periodo.inicio).lte("data", periodo.fim).order("id")),
    lerTodas(() => supabase.from("custos_variaveis").select("valor").eq("empresa_id", empresaId).gte("data", periodo.inicio).lte("data", periodo.fim).order("id")),
    soVigentes(supabase.from("custos_fixos").select("valor_mensal").eq("empresa_id", empresaId)),
    supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("empresa_id", empresaId),
    supabase.from("empresas").select("regime_tributario, mei_dados(categoria_mei)").eq("id", empresaId).maybeSingle(),
    lerTodas(() => supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicio12m).lte("data", periodo.fim).order("id")),
  ]);
  const receitas = exigir(rRecs, "receitas");
  const receita_bruta = (receitas || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

  // 2) Custos variáveis
  const custosVar = exigir(rCvs, "custos_variaveis");
  const custos_variaveis = (custosVar || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

  // 3) Custos fixos (mensais — só os vigentes; encerrado não pesa mais)
  const custosFix = exigir(rCfs, "custos_fixos");
  const custos_fixos = (custosFix || []).reduce((s: number, r: any) => s + Number(r.valor_mensal || 0), 0);

  // 4) Despesas financeiras (juros de endividamento — estimativa simples)
  // Tabela real é "dividas" (a que a página Endividamento usa) — "endividamento" era
  // uma tabela órfã com schema diferente, nunca alimentada pela UI.
  const dividas = exigir(rDivs, "dividas");
  const despesas_financeiras = (dividas || []).reduce((s: number, d: any) => {
    const saldoDevedor = Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0));
    return s + (saldoDevedor * Number(d.taxa_juros || 0) / 100);
  }, 0);

  // 5) Deduções: imposto real da empresa pelo regime tributário (mesmo cálculo do
  // módulo IA Tributária), em vez de um percentual fixo chutado.
  const empresa = exigir(rEmp, "empresa");
  const rec12m = exigir(rRec12, "receitas_12m");
  const receita_bruta_12m = (rec12m || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const deducoes = Math.round(calcularImpostoRegime(empresa?.regime_tributario || "", receita_bruta_12m, receita_bruta, undefined, undefined, categoriaMeiDaEmpresa(empresa)));

  const receita_liquida = receita_bruta - deducoes;
  const margem_contribuicao = receita_liquida - custos_variaveis;
  const lucro_operacional = margem_contribuicao - custos_fixos;
  const lucro_liquido = lucro_operacional - despesas_financeiras;

  const pct = (v: number) => (receita_bruta > 0 ? (v / receita_bruta) * 100 : 0);

  return {
    receita_bruta,
    deducoes,
    receita_liquida,
    custos_variaveis,
    margem_contribuicao,
    custos_fixos,
    lucro_operacional,
    despesas_financeiras,
    lucro_liquido,
    pct_deducoes: pct(deducoes),
    pct_custos_variaveis: pct(custos_variaveis),
    pct_custos_fixos: pct(custos_fixos),
    pct_margem_contribuicao: pct(margem_contribuicao),
    pct_lucro_liquido: pct(lucro_liquido),
  };
}

// ============================================================================
// EVOLUÇÃO ÚLTIMOS 12 MESES
// ============================================================================

export async function carregarEvolucao12Meses(
  empresaId: string,
  referenciaAno: number,
  referenciaMes: number,
  lang: Lang3 = "pt"
): Promise<PontoEvolucao[]> {
  const pontos: PontoEvolucao[] = [];

  // 3 leituras em paralelo (o ano inteiro de uma vez) em vez de 24 em fila — a tela levava 25s+.
  const primeiro = montarPeriodo(new Date(referenciaAno, referenciaMes - 12, 1).getFullYear(), new Date(referenciaAno, referenciaMes - 12, 1).getMonth() + 1);
  const ultimo = montarPeriodo(referenciaAno, referenciaMes);
  const [rCf, rRec, rCv] = await Promise.all([
    soVigentes(supabase.from("custos_fixos").select("valor_mensal").eq("empresa_id", empresaId)),
    lerTodas(() => supabase.from("receitas").select("valor, data").eq("empresa_id", empresaId).gte("data", primeiro.inicio).lte("data", ultimo.fim).order("id")),
    lerTodas(() => supabase.from("custos_variaveis").select("valor, data").eq("empresa_id", empresaId).gte("data", primeiro.inicio).lte("data", ultimo.fim).order("id")),
  ]);
  const custosFix = exigir(rCf, "custos_fixos");
  const rec = exigir(rRec, "receitas_12m") || [];
  const cv = exigir(rCv, "custos_variaveis_12m") || [];
  const custos_fixos_mes = (custosFix || []).reduce((s: number, r: any) => s + Number(r.valor_mensal || 0), 0);
  const somaPorMes = (linhas: any[]) => linhas.reduce((m: Map<string, number>, r: any) => {
    const k = String(r.data || "").slice(0, 7);
    return m.set(k, (m.get(k) || 0) + Number(r.valor || 0));
  }, new Map<string, number>());
  const recMes = somaPorMes(rec);
  const cvMes = somaPorMes(cv);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(referenciaAno, referenciaMes - 1 - i, 1);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const chave = `${ano}-${String(mes).padStart(2, "0")}`;
    const receita = recMes.get(chave) || 0;
    const custos = (cvMes.get(chave) || 0) + custos_fixos_mes;
    const lucro = receita - custos;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    pontos.push({
      mes: mesesPorLang(lang)[mes - 1] || nomeMesPt(mes),
      ano,
      mes_num: mes,
      receita: Math.round(receita),
      custos: Math.round(custos),
      lucro: Math.round(lucro),
      margem: parseFloat(margem.toFixed(1)),
    });
  }
  return pontos;
}

// ============================================================================
// DISTRIBUIÇÃO DE CUSTOS POR CATEGORIA
// ============================================================================

const CORES_CATEGORIA = ["#6ab0ff", "#f87171", "#fbbf24", "#a78bfa", "#34d399", "#fb923c", "#22d3ee", "#f472b6"];

export async function carregarDistribuicaoCustos(
  empresaId: string,
  periodo: Periodo
): Promise<CategoriaCusto[]> {
  const agregado = new Map<string, number>();

  // Mesma base da DRE: custos variáveis do período + custos fixos vigentes.
  // (Contas a pagar NÃO entram: conta paga já vira custo variável pelo motor e conta
  // de custo fixo já está no fixo — somar as duas contava o mesmo gasto 2 vezes.)
  // 1) Custos variáveis por categoria
  const cv = exigir(await lerTodas(() => supabase.from("custos_variaveis").select("valor, categoria").eq("empresa_id", empresaId).gte("data", periodo.inicio).lte("data", periodo.fim).order("id")), "custos_variaveis");
  (cv || []).forEach((r: any) => {
    const cat = r.categoria || "Outros";
    agregado.set(cat, (agregado.get(cat) || 0) + Number(r.valor || 0));
  });

  // 2) Custos fixos (mensal, só vigentes)
  const cf = exigir(await soVigentes(supabase.from("custos_fixos").select("valor_mensal, categoria").eq("empresa_id", empresaId)), "custos_fixos");
  (cf || []).forEach((r: any) => {
    const cat = r.categoria || "Custos Fixos";
    agregado.set(cat, (agregado.get(cat) || 0) + Number(r.valor_mensal || 0));
  });

  const total = Array.from(agregado.values()).reduce((s, v) => s + v, 0);

  const lista: CategoriaCusto[] = Array.from(agregado.entries())
    .map(([name, value], i) => ({
      name,
      value: Math.round(value),
      color: CORES_CATEGORIA[i % CORES_CATEGORIA.length],
      pct: total > 0 ? parseFloat(((value / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // top 8 categorias

  return lista;
}

// ============================================================================
// 12 KPIs BRASILEIROS PROFISSIONAIS
// ============================================================================

function formatBRL(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export async function carregarKPIs(empresaId: string, periodo: Periodo, dre: DRE, lang: Lang3 = "pt"): Promise<KPI[]> {
  const kpis: KPI[] = [];

  // ---- 1. MARGEM BRUTA (sobre receita líquida) ----
  const margemBruta = dre.receita_liquida > 0 ? (dre.margem_contribuicao / dre.receita_liquida) * 100 : 0;
  kpis.push({
    chave: "margem_bruta", nome: tr(lang, "Margem Bruta", "Gross Margin", "Margen Bruto"),
    valor: formatPct(margemBruta),
    valor_num: margemBruta,
    meta: "40%",
    meta_num: 40,
    atingido: margemBruta >= 40,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: tr(lang, "Receita líquida menos custos variáveis, dividido pela receita líquida", "Net revenue minus variable costs, divided by net revenue", "Ingreso neto menos costos variables, dividido por el ingreso neto"),
  });

  // ---- 2. MARGEM LÍQUIDA ----
  const margemLiquida = dre.pct_lucro_liquido;
  kpis.push({
    chave: "margem_liquida", nome: tr(lang, "Margem Líquida", "Net Margin", "Margen Neto"),
    valor: formatPct(margemLiquida),
    valor_num: margemLiquida,
    meta: "15%",
    meta_num: 15,
    atingido: margemLiquida >= 15,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: tr(lang, "Lucro líquido dividido pela receita bruta", "Net profit divided by gross revenue", "Utilidad neta dividida por el ingreso bruto"),
  });

  // ---- 3. MARGEM EBITDA (operacional) ----
  const ebitda = dre.lucro_operacional;
  const margemEbitda = dre.receita_bruta > 0 ? (ebitda / dre.receita_bruta) * 100 : 0;
  kpis.push({
    chave: "margem_ebitda", nome: tr(lang, "Margem EBITDA", "EBITDA Margin", "Margen EBITDA"),
    valor: formatPct(margemEbitda),
    valor_num: margemEbitda,
    meta: "20%",
    meta_num: 20,
    atingido: margemEbitda >= 20,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: tr(lang, "Lucro antes de juros, impostos, depreciação e amortização sobre receita", "Earnings before interest, taxes, depreciation and amortization over revenue", "Utilidad antes de intereses, impuestos, depreciación y amortización sobre ingresos"),
  });

  // ---- 4. PONTO DE EQUILÍBRIO ----
  const pctMargemContrib = dre.receita_liquida > 0 ? dre.margem_contribuicao / dre.receita_liquida : 0;
  const pontoEquilibrio = pctMargemContrib > 0 ? dre.custos_fixos / pctMargemContrib : 0;
  const atingiuBreakEven = dre.receita_bruta > 0 && pontoEquilibrio < dre.receita_bruta;
  kpis.push({
    chave: "ponto_equilibrio", nome: tr(lang, "Ponto de Equilíbrio", "Break-even Point", "Punto de Equilibrio"),
    valor: formatBRL(pontoEquilibrio),
    valor_num: pontoEquilibrio,
    meta: formatBRL(dre.receita_bruta),
    meta_num: dre.receita_bruta,
    atingido: atingiuBreakEven,
    unidade: "BRL",
    categoria: "operacional",
    descricao: tr(lang, "Receita mínima para cobrir todos os custos", "Minimum revenue to cover all costs", "Ingreso mínimo para cubrir todos los costos"),
  });

  // ---- 5. LIQUIDEZ CORRENTE ----
  const [rRecAtiv, rPagAtiv, sc] = await Promise.all([
    lerTodas(() => supabase.from("contas_receber").select("valor, valor_recebido, status").eq("empresa_id", empresaId).neq("status", "recebido").order("id")),
    lerTodas(() => supabase.from("contas_pagar").select("valor_total, valor_pago, status").eq("empresa_id", empresaId).neq("status", "pago").order("id")),
    saldoCaixaRealizado(supabase, empresaId, hojeISO()),
  ]);
  const cRecAtiv = exigir(rRecAtiv, "contas_receber_abertas");
  const cPagAtiv = exigir(rPagAtiv, "contas_pagar_abertas");
  if (sc.erro) throw new Error(`[relatorios] caixa: ${sc.erro}`);
  const ativoCirc = (cRecAtiv || []).reduce((s: number, r: any) => s + (Number(r.valor || 0) - Number(r.valor_recebido || 0)), 0);
  const passivoCirc = (cPagAtiv || []).reduce((s: number, r: any) => s + (Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0);
  const liquidez = passivoCirc > 0 ? ativoCirc / passivoCirc : (ativoCirc > 0 ? 99 : 0);
  kpis.push({
    chave: "liquidez", nome: tr(lang, "Liquidez Corrente", "Current Ratio", "Liquidez Corriente"),
    valor: liquidez >= 99 ? "∞" : liquidez.toFixed(2),
    valor_num: liquidez,
    meta: "1.50",
    meta_num: 1.5,
    atingido: liquidez >= 1.5,
    unidade: "RATIO",
    categoria: "liquidez",
    descricao: tr(lang, "Contas a receber dividido por contas a pagar (acima de 1.5 é saudável)", "Receivables divided by payables (above 1.5 is healthy)", "Cuentas por cobrar divididas por cuentas por pagar (encima de 1.5 es saludable)"),
  });

  // ---- 6. ENDIVIDAMENTO ----
  // Falha na leitura NUNCA vira "0% — saudável" (auditoria 2026-09-28: o erro era
  // engolido e o KPI mostrava a empresa sem dívida). Agora mostra "—" e vai pro Sentry.
  const { data: div, error: erroDividas } = await supabase.from("dividas").select("valor_total, valor_pago").eq("empresa_id", empresaId);
  if (erroDividas) reportarFalhaLeitura("relatorios.kpi.endividamento", new Error(erroDividas.message));
  const totalDividas = (div || []).reduce((s: number, r: any) => s + Math.max(0, Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0);
  const patrimonio = Math.max(dre.receita_bruta * 3, 1); // estimativa: 3x receita do mês
  const endividamento = (totalDividas / patrimonio) * 100;
  kpis.push({
    chave: "endividamento", nome: tr(lang, "Endividamento", "Indebtedness", "Endeudamiento"),
    valor: erroDividas ? "—" : formatPct(endividamento),
    valor_num: endividamento,
    meta: "< 50%",
    meta_num: 50,
    atingido: !erroDividas && endividamento < 50,
    unidade: "PCT",
    categoria: "endividamento",
    descricao: tr(lang, "Dívida total sobre patrimônio estimado (abaixo de 50% é saudável)", "Total debt over estimated equity (below 50% is healthy)", "Deuda total sobre patrimonio estimado (debajo de 50% es saludable)"),
  });

  // ---- 7. INADIMPLÊNCIA ----
  const cRecTodos = exigir(await lerTodas(() => supabase.from("contas_receber").select("valor, status, data_vencimento").eq("empresa_id", empresaId).order("id")), "contas_receber");
  const hoje = hojeISO();
  const vencidos = (cRecTodos || []).filter(
    (r: any) => r.status !== "recebido" && r.data_vencimento && r.data_vencimento < hoje
  );
  const totalRec = (cRecTodos || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const totalVencido = vencidos.reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const inadimplencia = totalRec > 0 ? (totalVencido / totalRec) * 100 : 0;
  kpis.push({
    chave: "inadimplencia", nome: tr(lang, "Inadimplência", "Default", "Morosidad"),
    valor: formatPct(inadimplencia),
    valor_num: inadimplencia,
    meta: "< 5%",
    meta_num: 5,
    atingido: inadimplencia < 5,
    unidade: "PCT",
    categoria: "liquidez",
    descricao: tr(lang, "Recebíveis vencidos sobre total a receber", "Overdue receivables over total receivable", "Cobros vencidos sobre el total por cobrar"),
  });

  // ---- 8. BURN RATE (despesa mensal) ----
  const burnRate = dre.custos_fixos + dre.custos_variaveis + dre.despesas_financeiras;
  kpis.push({
    chave: "burn_rate", nome: tr(lang, "Burn Rate", "Burn Rate", "Burn Rate"),
    valor: formatBRL(burnRate),
    valor_num: burnRate,
    meta: formatBRL(dre.receita_bruta),
    meta_num: dre.receita_bruta,
    atingido: burnRate < dre.receita_bruta,
    unidade: "BRL",
    categoria: "operacional",
    descricao: tr(lang, "Despesa total mensal — deve ser menor que a receita", "Total monthly expense — should be lower than revenue", "Gasto total mensual — debe ser menor que el ingreso"),
  });

  // ---- 9. RUNWAY (meses de caixa) ----
  const caixa = Math.max(0, sc.saldo); // saldo único de caixa (Fluxo + PDV) — antes usava contas a receber como "caixa"
  const runway = burnRate > 0 ? caixa / burnRate : 99;
  kpis.push({
    chave: "runway", nome: tr(lang, "Runway", "Runway", "Runway"),
    valor: runway >= 99 ? "∞" : `${runway.toFixed(1)} ${tr(lang, "meses", "months", "meses")}`,
    valor_num: runway,
    meta: tr(lang, "≥ 6 meses", "≥ 6 months", "≥ 6 meses"),
    meta_num: 6,
    atingido: runway >= 6,
    unidade: "MESES",
    categoria: "liquidez",
    descricao: tr(lang, "Quantos meses a empresa aguenta com o caixa atual", "How many months the company can last on current cash", "Cuántos meses aguanta la empresa con la caja actual"),
  });

  // ---- 10. CRESCIMENTO MoM (Mês contra Mês) ----
  const mesAnterior = montarPeriodo(
    periodo.mes === 1 ? periodo.ano - 1 : periodo.ano,
    periodo.mes === 1 ? 12 : periodo.mes - 1
  );
  const recAnt = exigir(await lerTodas(() => supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", mesAnterior.inicio).lte("data", mesAnterior.fim).order("id")), "receitas_mes_anterior");
  const receitaAnt = (recAnt || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const crescimentoMoM = receitaAnt > 0 ? ((dre.receita_bruta - receitaAnt) / receitaAnt) * 100 : 0;
  kpis.push({
    chave: "crescimento_mom", nome: tr(lang, "Crescimento MoM", "MoM Growth", "Crecimiento MoM"),
    valor: `${crescimentoMoM >= 0 ? "+" : ""}${crescimentoMoM.toFixed(1)}%`,
    valor_num: crescimentoMoM,
    meta: "≥ 5%",
    meta_num: 5,
    atingido: crescimentoMoM >= 5,
    unidade: "PCT",
    categoria: "crescimento",
    descricao: tr(lang, "Variação da receita vs mês anterior", "Revenue change vs previous month", "Variación de ingresos vs mes anterior"),
  });

  // ---- 11. EFICIÊNCIA OPERACIONAL ----
  const eficiencia = burnRate > 0 ? dre.receita_bruta / burnRate : 0;
  kpis.push({
    chave: "eficiencia", nome: tr(lang, "Eficiência", "Efficiency", "Eficiencia"),
    valor: eficiencia.toFixed(2) + "x",
    valor_num: eficiencia,
    meta: "≥ 1.50x",
    meta_num: 1.5,
    atingido: eficiencia >= 1.5,
    unidade: "RATIO",
    categoria: "operacional",
    descricao: tr(lang, "Receita gerada por real gasto (acima de 1.5x é saudável)", "Revenue generated per real spent (above 1.5x is healthy)", "Ingreso generado por real gastado (encima de 1.5x es saludable)"),
  });

  // ---- 12. TICKET MÉDIO ----
  // Só a contagem (head): a lista vinha cortada em 1000 e o ticket médio saía errado.
  const { count: qtdRec, error: erroCount } = await supabase.from("receitas").select("id", { count: "exact", head: true }).eq("empresa_id", empresaId).gte("data", periodo.inicio).lte("data", periodo.fim);
  if (erroCount) throw new Error(`[relatorios] contagem de receitas: ${erroCount.message}`);
  const qtdLanc = qtdRec || 0;
  const ticketMedio = qtdLanc > 0 ? dre.receita_bruta / qtdLanc : 0;
  kpis.push({
    chave: "ticket_medio", nome: tr(lang, "Ticket Médio", "Average Ticket", "Ticket Promedio"),
    valor: formatBRL(ticketMedio),
    valor_num: ticketMedio,
    meta: formatBRL(1000),
    meta_num: 1000,
    atingido: ticketMedio >= 1000,
    unidade: "BRL",
    categoria: "operacional",
    descricao: tr(lang, "Valor médio por venda/lançamento de receita", "Average amount per sale/revenue entry", "Valor promedio por venta/registro de ingreso"),
  });

  return kpis;
}

// ============================================================================
// SCORE CFO (0 a 100)
// Soma normalizada dos KPIs ponderados por importância
// ============================================================================

export function calcularScoreCFO(kpis: KPI[], lang: Lang3 = "pt"): { score: number; nivel: string; cor: string } {
  // Cada KPI atingido vale pontos. Pesos: rentabilidade 40%, liquidez 30%, operacional 20%, crescimento 10%
  const pesos: Record<string, number> = {
    rentabilidade: 40,
    liquidez: 30,
    operacional: 20,
    crescimento: 10,
    endividamento: 30, // entra junto com liquidez
  };

  const grupos: Record<string, { atingidos: number; total: number }> = {};
  for (const k of kpis) {
    const g = k.categoria === "endividamento" ? "liquidez" : k.categoria;
    if (!grupos[g]) grupos[g] = { atingidos: 0, total: 0 };
    grupos[g].total++;
    if (k.atingido) grupos[g].atingidos++;
  }

  let score = 0;
  let pesoTotal = 0;
  for (const [grupo, dados] of Object.entries(grupos)) {
    const peso = pesos[grupo] || 10;
    const taxa = dados.total > 0 ? dados.atingidos / dados.total : 0;
    score += taxa * peso;
    pesoTotal += peso;
  }
  const final = pesoTotal > 0 ? Math.round((score / pesoTotal) * 100) : 0;

  let nivel = tr(lang, "Crítico", "Critical", "Crítico");
  let cor = "#f87171";
  if (final >= 80) { nivel = tr(lang, "Excelente", "Excellent", "Excelente"); cor = "#34d399"; }
  else if (final >= 60) { nivel = tr(lang, "Bom", "Good", "Bueno"); cor = "#6ab0ff"; }
  else if (final >= 40) { nivel = tr(lang, "Regular", "Fair", "Regular"); cor = "#fbbf24"; }
  else if (final >= 20) { nivel = tr(lang, "Atenção", "Attention", "Atención"); cor = "#fb923c"; }

  return { score: final, nivel, cor };
}

// ============================================================================
// INSIGHTS AUTOMÁTICOS (regras simples agora, LLM depois)
// ============================================================================

export function gerarInsights(
  dre: DRE,
  evolucao: PontoEvolucao[],
  kpis: KPI[],
  distribuicao: CategoriaCusto[],
  scoreCFO: { score: number; nivel: string },
  lang: Lang3 = "pt"
): Insight[] {
  const insights: Insight[] = [];

  // ---- Insight de saúde geral ----
  if (scoreCFO.score >= 80) {
    insights.push({
      tipo: "positivo",
      titulo: tr(lang, "Saúde financeira excelente", "Excellent financial health", "Salud financiera excelente"),
      texto: tr(lang, `Seu Score CFO é ${scoreCFO.score}/100 (${scoreCFO.nivel}). Mantenha os indicadores que estão acima da meta.`, `Your CFO Score is ${scoreCFO.score}/100 (${scoreCFO.nivel}). Keep the indicators that are above target.`, `Su Score CFO es ${scoreCFO.score}/100 (${scoreCFO.nivel}). Mantenga los indicadores que están por encima de la meta.`),
    });
  } else if (scoreCFO.score < 40) {
    insights.push({
      tipo: "alerta",
      titulo: tr(lang, "Saúde financeira em alerta", "Financial health on alert", "Salud financiera en alerta"),
      texto: tr(lang, `Seu Score CFO é ${scoreCFO.score}/100 (${scoreCFO.nivel}). Veja os KPIs abaixo da meta e priorize ações corretivas.`, `Your CFO Score is ${scoreCFO.score}/100 (${scoreCFO.nivel}). Check the KPIs below target and prioritize corrective actions.`, `Su Score CFO es ${scoreCFO.score}/100 (${scoreCFO.nivel}). Vea los KPIs debajo de la meta y priorice acciones correctivas.`),
    });
  }

  // ---- Crescimento MoM ----
  if (evolucao.length >= 2) {
    const atual = evolucao[evolucao.length - 1];
    const anterior = evolucao[evolucao.length - 2];
    if (anterior.receita > 0) {
      const variacao = ((atual.receita - anterior.receita) / anterior.receita) * 100;
      if (variacao >= 10) {
        insights.push({
          tipo: "positivo",
          titulo: tr(lang, "Receita em crescimento forte", "Strong revenue growth", "Ingresos en fuerte crecimiento"),
          texto: tr(lang, `Sua receita cresceu ${variacao.toFixed(1)}% em ${atual.mes} vs ${anterior.mes}. Tendência positiva.`, `Your revenue grew ${variacao.toFixed(1)}% in ${atual.mes} vs ${anterior.mes}. Positive trend.`, `Sus ingresos crecieron ${variacao.toFixed(1)}% en ${atual.mes} vs ${anterior.mes}. Tendencia positiva.`),
          metrica: `+${variacao.toFixed(1)}%`,
        });
      } else if (variacao <= -10) {
        insights.push({
          tipo: "alerta",
          titulo: tr(lang, "Queda significativa de receita", "Significant revenue drop", "Caída significativa de ingresos"),
          texto: tr(lang, `Receita caiu ${Math.abs(variacao).toFixed(1)}% em ${atual.mes}. Investigue causas: sazonalidade, perda de clientes ou problemas operacionais.`, `Revenue fell ${Math.abs(variacao).toFixed(1)}% in ${atual.mes}. Look into causes: seasonality, lost clients or operational problems.`, `Los ingresos cayeron ${Math.abs(variacao).toFixed(1)}% en ${atual.mes}. Investigue causas: estacionalidad, pérdida de clientes o problemas operativos.`),
          metrica: `${variacao.toFixed(1)}%`,
        });
      }
    }
  }

  // ---- Margem líquida ----
  if (dre.pct_lucro_liquido < 0) {
    insights.push({
      tipo: "alerta",
      titulo: tr(lang, "Operando no prejuízo", "Operating at a loss", "Operando con pérdida"),
      texto: tr(lang, `Você está com margem líquida negativa (${dre.pct_lucro_liquido.toFixed(1)}%). Revise custos e precificação urgentemente.`, `Your net margin is negative (${dre.pct_lucro_liquido.toFixed(1)}%). Review costs and pricing urgently.`, `Su margen neto es negativo (${dre.pct_lucro_liquido.toFixed(1)}%). Revise costos y precios con urgencia.`),
    });
  } else if (dre.pct_lucro_liquido >= 20) {
    insights.push({
      tipo: "positivo",
      titulo: tr(lang, "Margem líquida saudável", "Healthy net margin", "Margen neto saludable"),
      texto: tr(lang, `Lucro líquido de ${dre.pct_lucro_liquido.toFixed(1)}% sobre receita está acima do benchmark de 15% para PMEs brasileiras.`, `Net profit of ${dre.pct_lucro_liquido.toFixed(1)}% of revenue is above the 15% benchmark for Brazilian SMEs.`, `Una utilidad neta de ${dre.pct_lucro_liquido.toFixed(1)}% sobre ingresos está por encima del benchmark de 15% para pymes brasileñas.`),
    });
  }

  // ---- Top categoria de custo ----
  if (distribuicao.length > 0) {
    const topCat = distribuicao[0];
    if (topCat.pct >= 35) {
      insights.push({
        tipo: "atencao",
        titulo: tr(lang, `Concentração em "${topCat.name}"`, `Concentration in "${topCat.name}"`, `Concentración en "${topCat.name}"`),
        texto: tr(lang, `${topCat.pct.toFixed(1)}% dos seus custos estão em "${topCat.name}" (${formatBRL(topCat.value)}). Avalie se há espaço para renegociação ou diversificação.`, `${topCat.pct.toFixed(1)}% of your costs are in "${topCat.name}" (${formatBRL(topCat.value)}). See if there is room to renegotiate or diversify.`, `${topCat.pct.toFixed(1)}% de sus costos están en "${topCat.name}" (${formatBRL(topCat.value)}). Evalúe si hay espacio para renegociar o diversificar.`),
        metrica: `${topCat.pct.toFixed(1)}%`,
      });
    }
  }

  // ---- Inadimplência alta ----
  const inad = kpis.find((k) => k.chave === "inadimplencia");
  if (inad && inad.valor_num > 10) {
    insights.push({
      tipo: "alerta",
      titulo: tr(lang, "Inadimplência elevada", "High default", "Morosidad elevada"),
      texto: tr(lang, `${inad.valor} dos recebíveis estão vencidos. Reforce a régua de cobrança no módulo Inadimplência.`, `${inad.valor} of receivables are overdue. Strengthen the collection ladder in the Default module.`, `${inad.valor} de los cobros están vencidos. Refuerce la regla de cobro en el módulo Morosidad.`),
      metrica: inad.valor,
    });
  }

  // ---- Runway baixo ----
  const runway = kpis.find((k) => k.chave === "runway");
  if (runway && runway.valor_num < 3 && runway.valor_num > 0) {
    insights.push({
      tipo: "alerta",
      titulo: tr(lang, "Caixa apertado", "Tight cash", "Caja ajustada"),
      texto: tr(lang, `Você tem cerca de ${runway.valor} de caixa no ritmo atual. Acelere recebimentos e revise despesas.`, `You have about ${runway.valor} of cash at the current pace. Speed up collections and review expenses.`, `Tiene cerca de ${runway.valor} de caja al ritmo actual. Acelere cobros y revise gastos.`),
      metrica: runway.valor,
    });
  }

  // ---- Endividamento alto ----
  const div = kpis.find((k) => k.chave === "endividamento");
  if (div && div.valor_num >= 70) {
    insights.push({
      tipo: "alerta",
      titulo: tr(lang, "Endividamento elevado", "High indebtedness", "Endeudamiento elevado"),
      texto: tr(lang, `Seu nível de endividamento está em ${div.valor}. Considere renegociar dívidas ou aumentar receitas antes de novos empréstimos.`, `Your indebtedness is at ${div.valor}. Consider renegotiating debt or increasing revenue before new loans.`, `Su nivel de endeudamiento está en ${div.valor}. Considere renegociar deudas o aumentar ingresos antes de nuevos préstamos.`),
    });
  }

  // ---- Ponto de equilíbrio próximo ----
  const pe = kpis.find((k) => k.nome === "Ponto de Equilíbrio");
  if (pe && dre.receita_bruta > 0) {
    const pctDoBE = (dre.receita_bruta / pe.valor_num) * 100;
    if (pctDoBE >= 90 && pctDoBE < 110) {
      insights.push({
        tipo: "atencao",
        titulo: tr(lang, "Operando próximo ao ponto de equilíbrio", "Operating near break-even", "Operando cerca del punto de equilibrio"),
        texto: tr(lang, `Sua receita está cobrindo apenas ${pctDoBE.toFixed(0)}% do ponto de equilíbrio. Pequenas variações podem gerar prejuízo.`, `Your revenue covers only ${pctDoBE.toFixed(0)}% of break-even. Small changes can cause a loss.`, `Sus ingresos cubren solo ${pctDoBE.toFixed(0)}% del punto de equilibrio. Pequeñas variaciones pueden generar pérdida.`),
      });
    }
  }

  // ---- Caso sem nenhum insight, dar um neutro ----
  if (insights.length === 0) {
    insights.push({
      tipo: "neutro",
      titulo: "Análise concluída",
      texto: "Nenhum alerta crítico identificado neste período. Continue acompanhando os indicadores no Dashboard.",
    });
  }

  return insights;
}