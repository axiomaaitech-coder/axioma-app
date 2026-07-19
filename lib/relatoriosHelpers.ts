// 🦅 AXIOMA AI.TECH - Helpers de Relatórios CFO
// Cálculos profissionais com dados reais do Supabase.
// Implementa 12+ indicadores brasileiros, Score CFO 0-100, insights automáticos.

import { createBrowserClient } from "@supabase/ssr";
import { calcularImpostoRegime } from "./iaTributariaHelpers";

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

export type KPI = {
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

export function nomeMesPt(mes: number): string {
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return nomes[mes - 1] || "";
}

// ============================================================================
// DRE GERENCIAL (Demonstração do Resultado do Exercício)
// ============================================================================

export async function carregarDRE(userId: string, periodo: Periodo): Promise<DRE> {
  // 1) Receitas do período
  const { data: receitas } = await supabase
    .from("receitas")
    .select("valor")
    .eq("user_id", userId)
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim);
  const receita_bruta = (receitas || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

  // 2) Custos variáveis
  const { data: custosVar } = await supabase
    .from("custos_variaveis")
    .select("valor")
    .eq("user_id", userId)
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim);
  const custos_variaveis = (custosVar || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);

  // 3) Custos fixos (mensais — todos cadastrados)
  const { data: custosFix } = await supabase
    .from("custos_fixos")
    .select("valor_mensal")
    .eq("user_id", userId);
  const custos_fixos = (custosFix || []).reduce((s: number, r: any) => s + Number(r.valor_mensal || 0), 0);

  // 4) Despesas financeiras (juros de endividamento — estimativa simples)
  // Tabela real é "dividas" (a que a página Endividamento usa) — "endividamento" era
  // uma tabela órfã com schema diferente, nunca alimentada pela UI.
  let despesas_financeiras = 0;
  try {
    const { data: dividas } = await supabase
      .from("dividas")
      .select("valor_total, valor_pago, taxa_juros")
      .eq("user_id", userId);
    if (dividas) {
      despesas_financeiras = dividas.reduce((s: number, d: any) => {
        const saldoDevedor = Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0));
        return s + (saldoDevedor * Number(d.taxa_juros || 0) / 100);
      }, 0);
    }
  } catch {
    // mantém 0 se a consulta falhar por qualquer motivo
  }

  // 5) Deduções: imposto real da empresa pelo regime tributário (mesmo cálculo do
  // módulo IA Tributária), em vez de um percentual fixo chutado.
  const inicio12m = new Date(periodo.ano, periodo.mes - 12, 1).toISOString().slice(0, 10);
  const [{ data: empresa }, { data: rec12m }] = await Promise.all([
    supabase.from("empresas").select("regime_tributario").eq("user_id", userId).limit(1).maybeSingle(),
    supabase.from("receitas").select("valor").eq("user_id", userId).gte("data", inicio12m).lte("data", periodo.fim),
  ]);
  const receita_bruta_12m = (rec12m || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const deducoes = Math.round(calcularImpostoRegime(empresa?.regime_tributario || "", receita_bruta_12m, receita_bruta));

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
  userId: string,
  referenciaAno: number,
  referenciaMes: number
): Promise<PontoEvolucao[]> {
  const pontos: PontoEvolucao[] = [];

  // Custos fixos são recorrentes — totaliza uma vez
  const { data: custosFix } = await supabase
    .from("custos_fixos")
    .select("valor_mensal")
    .eq("user_id", userId);
  const custos_fixos_mes = (custosFix || []).reduce((s: number, r: any) => s + Number(r.valor_mensal || 0), 0);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(referenciaAno, referenciaMes - 1 - i, 1);
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const periodo = montarPeriodo(ano, mes);

    const [{ data: rec }, { data: cv }] = await Promise.all([
      supabase.from("receitas").select("valor").eq("user_id", userId).gte("data", periodo.inicio).lte("data", periodo.fim),
      supabase.from("custos_variaveis").select("valor").eq("user_id", userId).gte("data", periodo.inicio).lte("data", periodo.fim),
    ]);

    const receita = (rec || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
    const custos_var = (cv || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
    const custos = custos_var + custos_fixos_mes;
    const lucro = receita - custos;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    pontos.push({
      mes: nomeMesPt(mes),
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
  userId: string,
  periodo: Periodo
): Promise<CategoriaCusto[]> {
  const agregado = new Map<string, number>();

  // 1) Custos variáveis por categoria
  const { data: cv } = await supabase
    .from("custos_variaveis")
    .select("valor, categoria")
    .eq("user_id", userId)
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim);
  (cv || []).forEach((r: any) => {
    const cat = r.categoria || "Outros";
    agregado.set(cat, (agregado.get(cat) || 0) + Number(r.valor || 0));
  });

  // 2) Custos fixos (mensal)
  const { data: cf } = await supabase
    .from("custos_fixos")
    .select("valor_mensal, categoria")
    .eq("user_id", userId);
  (cf || []).forEach((r: any) => {
    const cat = r.categoria || "Custos Fixos";
    agregado.set(cat, (agregado.get(cat) || 0) + Number(r.valor_mensal || 0));
  });

  // 3) Contas a pagar do período (despesas operacionais)
  const { data: cp } = await supabase
    .from("contas_pagar")
    .select("valor_total, categoria")
    .eq("user_id", userId)
    .gte("data_vencimento", periodo.inicio)
    .lte("data_vencimento", periodo.fim);
  (cp || []).forEach((r: any) => {
    const cat = r.categoria || "Fornecedores";
    agregado.set(cat, (agregado.get(cat) || 0) + Number(r.valor_total || 0));
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

export async function carregarKPIs(userId: string, periodo: Periodo, dre: DRE): Promise<KPI[]> {
  const kpis: KPI[] = [];

  // ---- 1. MARGEM BRUTA (sobre receita líquida) ----
  const margemBruta = dre.receita_liquida > 0 ? (dre.margem_contribuicao / dre.receita_liquida) * 100 : 0;
  kpis.push({
    nome: "Margem Bruta",
    valor: formatPct(margemBruta),
    valor_num: margemBruta,
    meta: "40%",
    meta_num: 40,
    atingido: margemBruta >= 40,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: "Receita líquida menos custos variáveis, dividido pela receita líquida",
  });

  // ---- 2. MARGEM LÍQUIDA ----
  const margemLiquida = dre.pct_lucro_liquido;
  kpis.push({
    nome: "Margem Líquida",
    valor: formatPct(margemLiquida),
    valor_num: margemLiquida,
    meta: "15%",
    meta_num: 15,
    atingido: margemLiquida >= 15,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: "Lucro líquido dividido pela receita bruta",
  });

  // ---- 3. MARGEM EBITDA (operacional) ----
  const ebitda = dre.lucro_operacional;
  const margemEbitda = dre.receita_bruta > 0 ? (ebitda / dre.receita_bruta) * 100 : 0;
  kpis.push({
    nome: "Margem EBITDA",
    valor: formatPct(margemEbitda),
    valor_num: margemEbitda,
    meta: "20%",
    meta_num: 20,
    atingido: margemEbitda >= 20,
    unidade: "PCT",
    categoria: "rentabilidade",
    descricao: "Lucro antes de juros, impostos, depreciação e amortização sobre receita",
  });

  // ---- 4. PONTO DE EQUILÍBRIO ----
  const pctMargemContrib = dre.receita_liquida > 0 ? dre.margem_contribuicao / dre.receita_liquida : 0;
  const pontoEquilibrio = pctMargemContrib > 0 ? dre.custos_fixos / pctMargemContrib : 0;
  const atingiuBreakEven = dre.receita_bruta > 0 && pontoEquilibrio < dre.receita_bruta;
  kpis.push({
    nome: "Ponto de Equilíbrio",
    valor: formatBRL(pontoEquilibrio),
    valor_num: pontoEquilibrio,
    meta: formatBRL(dre.receita_bruta),
    meta_num: dre.receita_bruta,
    atingido: atingiuBreakEven,
    unidade: "BRL",
    categoria: "operacional",
    descricao: "Receita mínima para cobrir todos os custos",
  });

  // ---- 5. LIQUIDEZ CORRENTE ----
  const [{ data: cRecAtiv }, { data: cPagAtiv }] = await Promise.all([
    supabase.from("contas_receber").select("valor, valor_recebido, status").eq("user_id", userId).neq("status", "recebido"),
    supabase.from("contas_pagar").select("valor_total, valor_pago, status").eq("user_id", userId).neq("status", "pago"),
  ]);
  const ativoCirc = (cRecAtiv || []).reduce((s: number, r: any) => s + (Number(r.valor || 0) - Number(r.valor_recebido || 0)), 0);
  const passivoCirc = (cPagAtiv || []).reduce((s: number, r: any) => s + (Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0);
  const liquidez = passivoCirc > 0 ? ativoCirc / passivoCirc : (ativoCirc > 0 ? 99 : 0);
  kpis.push({
    nome: "Liquidez Corrente",
    valor: liquidez >= 99 ? "∞" : liquidez.toFixed(2),
    valor_num: liquidez,
    meta: "1.50",
    meta_num: 1.5,
    atingido: liquidez >= 1.5,
    unidade: "RATIO",
    categoria: "liquidez",
    descricao: "Contas a receber dividido por contas a pagar (acima de 1.5 é saudável)",
  });

  // ---- 6. ENDIVIDAMENTO ----
  let totalDividas = 0;
  try {
    const { data: div } = await supabase.from("dividas").select("valor_total, valor_pago").eq("user_id", userId);
    totalDividas = (div || []).reduce((s: number, r: any) => s + Math.max(0, Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0);
  } catch {}
  const patrimonio = Math.max(dre.receita_bruta * 3, 1); // estimativa: 3x receita do mês
  const endividamento = (totalDividas / patrimonio) * 100;
  kpis.push({
    nome: "Endividamento",
    valor: formatPct(endividamento),
    valor_num: endividamento,
    meta: "< 50%",
    meta_num: 50,
    atingido: endividamento < 50,
    unidade: "PCT",
    categoria: "endividamento",
    descricao: "Dívida total sobre patrimônio estimado (abaixo de 50% é saudável)",
  });

  // ---- 7. INADIMPLÊNCIA ----
  const { data: cRecTodos } = await supabase
    .from("contas_receber")
    .select("valor, status, data_vencimento")
    .eq("user_id", userId);
  const hoje = new Date().toISOString().slice(0, 10);
  const vencidos = (cRecTodos || []).filter(
    (r: any) => r.status !== "recebido" && r.data_vencimento && r.data_vencimento < hoje
  );
  const totalRec = (cRecTodos || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const totalVencido = vencidos.reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const inadimplencia = totalRec > 0 ? (totalVencido / totalRec) * 100 : 0;
  kpis.push({
    nome: "Inadimplência",
    valor: formatPct(inadimplencia),
    valor_num: inadimplencia,
    meta: "< 5%",
    meta_num: 5,
    atingido: inadimplencia < 5,
    unidade: "PCT",
    categoria: "liquidez",
    descricao: "Recebíveis vencidos sobre total a receber",
  });

  // ---- 8. BURN RATE (despesa mensal) ----
  const burnRate = dre.custos_fixos + dre.custos_variaveis + dre.despesas_financeiras;
  kpis.push({
    nome: "Burn Rate",
    valor: formatBRL(burnRate),
    valor_num: burnRate,
    meta: formatBRL(dre.receita_bruta),
    meta_num: dre.receita_bruta,
    atingido: burnRate < dre.receita_bruta,
    unidade: "BRL",
    categoria: "operacional",
    descricao: "Despesa total mensal — deve ser menor que a receita",
  });

  // ---- 9. RUNWAY (meses de caixa) ----
  const caixa = ativoCirc; // proxy: contas a receber em aberto
  const runway = burnRate > 0 ? caixa / burnRate : 99;
  kpis.push({
    nome: "Runway",
    valor: runway >= 99 ? "∞" : `${runway.toFixed(1)} meses`,
    valor_num: runway,
    meta: "≥ 6 meses",
    meta_num: 6,
    atingido: runway >= 6,
    unidade: "MESES",
    categoria: "liquidez",
    descricao: "Quantos meses a empresa aguenta com o caixa atual",
  });

  // ---- 10. CRESCIMENTO MoM (Mês contra Mês) ----
  const mesAnterior = montarPeriodo(
    periodo.mes === 1 ? periodo.ano - 1 : periodo.ano,
    periodo.mes === 1 ? 12 : periodo.mes - 1
  );
  const { data: recAnt } = await supabase
    .from("receitas")
    .select("valor")
    .eq("user_id", userId)
    .gte("data", mesAnterior.inicio)
    .lte("data", mesAnterior.fim);
  const receitaAnt = (recAnt || []).reduce((s: number, r: any) => s + Number(r.valor || 0), 0);
  const crescimentoMoM = receitaAnt > 0 ? ((dre.receita_bruta - receitaAnt) / receitaAnt) * 100 : 0;
  kpis.push({
    nome: "Crescimento MoM",
    valor: `${crescimentoMoM >= 0 ? "+" : ""}${crescimentoMoM.toFixed(1)}%`,
    valor_num: crescimentoMoM,
    meta: "≥ 5%",
    meta_num: 5,
    atingido: crescimentoMoM >= 5,
    unidade: "PCT",
    categoria: "crescimento",
    descricao: "Variação da receita vs mês anterior",
  });

  // ---- 11. EFICIÊNCIA OPERACIONAL ----
  const eficiencia = burnRate > 0 ? dre.receita_bruta / burnRate : 0;
  kpis.push({
    nome: "Eficiência",
    valor: eficiencia.toFixed(2) + "x",
    valor_num: eficiencia,
    meta: "≥ 1.50x",
    meta_num: 1.5,
    atingido: eficiencia >= 1.5,
    unidade: "RATIO",
    categoria: "operacional",
    descricao: "Receita gerada por real gasto (acima de 1.5x é saudável)",
  });

  // ---- 12. TICKET MÉDIO ----
  const { data: recCount } = await supabase
    .from("receitas")
    .select("valor", { count: "exact" })
    .eq("user_id", userId)
    .gte("data", periodo.inicio)
    .lte("data", periodo.fim);
  const qtdLanc = (recCount || []).length;
  const ticketMedio = qtdLanc > 0 ? dre.receita_bruta / qtdLanc : 0;
  kpis.push({
    nome: "Ticket Médio",
    valor: formatBRL(ticketMedio),
    valor_num: ticketMedio,
    meta: formatBRL(1000),
    meta_num: 1000,
    atingido: ticketMedio >= 1000,
    unidade: "BRL",
    categoria: "operacional",
    descricao: "Valor médio por venda/lançamento de receita",
  });

  return kpis;
}

// ============================================================================
// SCORE CFO (0 a 100)
// Soma normalizada dos KPIs ponderados por importância
// ============================================================================

export function calcularScoreCFO(kpis: KPI[]): { score: number; nivel: string; cor: string } {
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

  let nivel = "Crítico";
  let cor = "#f87171";
  if (final >= 80) { nivel = "Excelente"; cor = "#34d399"; }
  else if (final >= 60) { nivel = "Bom"; cor = "#6ab0ff"; }
  else if (final >= 40) { nivel = "Regular"; cor = "#fbbf24"; }
  else if (final >= 20) { nivel = "Atenção"; cor = "#fb923c"; }

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
  scoreCFO: { score: number; nivel: string }
): Insight[] {
  const insights: Insight[] = [];

  // ---- Insight de saúde geral ----
  if (scoreCFO.score >= 80) {
    insights.push({
      tipo: "positivo",
      titulo: "Saúde financeira excelente",
      texto: `Seu Score CFO é ${scoreCFO.score}/100 (${scoreCFO.nivel}). Mantenha os indicadores que estão acima da meta.`,
    });
  } else if (scoreCFO.score < 40) {
    insights.push({
      tipo: "alerta",
      titulo: "Saúde financeira em alerta",
      texto: `Seu Score CFO é ${scoreCFO.score}/100 (${scoreCFO.nivel}). Veja os KPIs abaixo da meta e priorize ações corretivas.`,
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
          titulo: "Receita em crescimento forte",
          texto: `Sua receita cresceu ${variacao.toFixed(1)}% em ${atual.mes} vs ${anterior.mes}. Tendência positiva.`,
          metrica: `+${variacao.toFixed(1)}%`,
        });
      } else if (variacao <= -10) {
        insights.push({
          tipo: "alerta",
          titulo: "Queda significativa de receita",
          texto: `Receita caiu ${Math.abs(variacao).toFixed(1)}% em ${atual.mes}. Investigue causas: sazonalidade, perda de clientes ou problemas operacionais.`,
          metrica: `${variacao.toFixed(1)}%`,
        });
      }
    }
  }

  // ---- Margem líquida ----
  if (dre.pct_lucro_liquido < 0) {
    insights.push({
      tipo: "alerta",
      titulo: "Operando no prejuízo",
      texto: `Você está com margem líquida negativa (${dre.pct_lucro_liquido.toFixed(1)}%). Revise custos e precificação urgentemente.`,
    });
  } else if (dre.pct_lucro_liquido >= 20) {
    insights.push({
      tipo: "positivo",
      titulo: "Margem líquida saudável",
      texto: `Lucro líquido de ${dre.pct_lucro_liquido.toFixed(1)}% sobre receita está acima do benchmark de 15% para PMEs brasileiras.`,
    });
  }

  // ---- Top categoria de custo ----
  if (distribuicao.length > 0) {
    const topCat = distribuicao[0];
    if (topCat.pct >= 35) {
      insights.push({
        tipo: "atencao",
        titulo: `Concentração em "${topCat.name}"`,
        texto: `${topCat.pct.toFixed(1)}% dos seus custos estão em "${topCat.name}" (${formatBRL(topCat.value)}). Avalie se há espaço para renegociação ou diversificação.`,
        metrica: `${topCat.pct.toFixed(1)}%`,
      });
    }
  }

  // ---- Inadimplência alta ----
  const inad = kpis.find((k) => k.nome === "Inadimplência");
  if (inad && inad.valor_num > 10) {
    insights.push({
      tipo: "alerta",
      titulo: "Inadimplência elevada",
      texto: `${inad.valor} dos recebíveis estão vencidos. Reforce a régua de cobrança no módulo Inadimplência.`,
      metrica: inad.valor,
    });
  }

  // ---- Runway baixo ----
  const runway = kpis.find((k) => k.nome === "Runway");
  if (runway && runway.valor_num < 3 && runway.valor_num > 0) {
    insights.push({
      tipo: "alerta",
      titulo: "Caixa apertado",
      texto: `Você tem cerca de ${runway.valor} de caixa no ritmo atual. Acelere recebimentos e revise despesas.`,
      metrica: runway.valor,
    });
  }

  // ---- Endividamento alto ----
  const div = kpis.find((k) => k.nome === "Endividamento");
  if (div && div.valor_num >= 70) {
    insights.push({
      tipo: "alerta",
      titulo: "Endividamento elevado",
      texto: `Seu nível de endividamento está em ${div.valor}. Considere renegociar dívidas ou aumentar receitas antes de novos empréstimos.`,
    });
  }

  // ---- Ponto de equilíbrio próximo ----
  const pe = kpis.find((k) => k.nome === "Ponto de Equilíbrio");
  if (pe && dre.receita_bruta > 0) {
    const pctDoBE = (dre.receita_bruta / pe.valor_num) * 100;
    if (pctDoBE >= 90 && pctDoBE < 110) {
      insights.push({
        tipo: "atencao",
        titulo: "Operando próximo ao ponto de equilíbrio",
        texto: `Sua receita está cobrindo apenas ${pctDoBE.toFixed(0)}% do ponto de equilíbrio. Pequenas variações podem gerar prejuízo.`,
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