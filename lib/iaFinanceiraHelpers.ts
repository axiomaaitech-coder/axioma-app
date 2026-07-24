// 🦅 AXIOMA AI.TECH - Helpers IA Financeira
// Motor de inteligência: Score 360°, anomalias, projeções, what-if, benchmarks, plano de ação.
// Funciona com dados reais do Supabase. Chat via Claude API (ou regras se API indisponível).

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// TIPOS
// ============================================================================

export type SnapshotFinanceiro = {
  periodo: string;
  receita_bruta: number;
  custos_fixos: number;
  custos_variaveis: number;
  custos_totais: number;
  lucro_bruto: number;
  lucro_liquido: number;
  margem_bruta: number;
  margem_liquida: number;
  contas_receber: number;
  contas_pagar: number;
  inadimplencia_pct: number;
  total_receitas_6m: number[];
  total_custos_6m: number[];
  qtd_lancamentos: number;
  ticket_medio: number;
  endividamento_total: number;
  setor: string;
  regime: string;
};

export type Dimensao360 = {
  nome: string;
  nome_en: string;
  nome_es: string;
  score: number;
  peso: number;
  cor: string;
  indicadores: { nome: string; valor: string; status: "bom" | "atencao" | "critico" }[];
  sugestao: string;
  sugestao_en: string;
  sugestao_es: string;
};

export type Score360 = {
  total: number;
  nivel: string;
  nivel_en: string;
  nivel_es: string;
  cor: string;
  dimensoes: Dimensao360[];
};

export type Anomalia = {
  tipo: "gasto_alto" | "queda_receita" | "inadimplencia" | "margem_baixa" | "endividamento";
  severidade: "info" | "atencao" | "alerta";
  titulo: string;
  titulo_en: string;
  titulo_es: string;
  descricao: string;
  descricao_en: string;
  descricao_es: string;
  metrica?: string;
};

export type Projecao = {
  mes: string;
  otimista: number;
  realista: number;
  pessimista: number;
};

export type AcaoSugerida = {
  prioridade: number;
  titulo: string;
  titulo_en: string;
  titulo_es: string;
  descricao: string;
  descricao_en: string;
  descricao_es: string;
  impacto_estimado: string;
  categoria: "custo" | "receita" | "cobranca" | "fiscal" | "gestao";
};

export type BenchmarkSetor = {
  setor: string;
  margem_bruta_min: number;
  margem_bruta_max: number;
  margem_liquida_min: number;
  margem_liquida_max: number;
  inadimplencia_max: number;
  custo_sobre_receita_max: number;
  crescimento_anual_medio: number;
};

// ============================================================================
// CARREGAR SNAPSHOT FINANCEIRO (dados reais do mês)
// ============================================================================

export async function carregarSnapshot(userId: string, empresaId: string | null): Promise<SnapshotFinanceiro> {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const inicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(anoAtual, mesAtual, 0).toISOString().slice(0, 10);
  const hojeStr = hoje.toISOString().slice(0, 10);

  // Buscar dados em paralelo
  const [
    { data: receitas },
    { data: custosVar },
    { data: custosFix },
    { data: contasRec },
    { data: contasPag },
    { data: dividas },
    { data: empresa },
  ] = await Promise.all([
    supabase.from("receitas").select("valor, data").gte("data", inicio).lte("data", fim),
    supabase.from("custos_variaveis").select("valor, data, categoria").gte("data", inicio).lte("data", fim),
    supabase.from("custos_fixos").select("valor_mensal, categoria"),
    supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento"),
    supabase.from("contas_pagar").select("valor_total, valor_pago, status, data_vencimento"),
    // Tabela real é "dividas" (a que a página Endividamento usa) — "endividamento" era
    // uma tabela órfã com schema diferente, nunca alimentada pela UI.
    Promise.resolve(supabase.from("dividas").select("valor_total, valor_pago")).catch(() => ({ data: [] })),
    empresaId ? supabase.from("empresas").select("setor, regime_tributario, cnae_principal").eq("id", empresaId).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const receita_bruta = (receitas || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const custos_variaveis = (custosVar || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const custos_fixos = (custosFix || []).reduce((s, r) => s + Number(r.valor_mensal || 0), 0);
  const custos_totais = custos_variaveis + custos_fixos;
  const lucro_bruto = receita_bruta - custos_variaveis;
  const lucro_liquido = receita_bruta - custos_totais;
  const margem_bruta = receita_bruta > 0 ? (lucro_bruto / receita_bruta) * 100 : 0;
  const margem_liquida = receita_bruta > 0 ? (lucro_liquido / receita_bruta) * 100 : 0;

  // Contas a receber/pagar abertas
  const crAberto = (contasRec || []).filter(r => r.status !== "recebido");
  const cpAberto = (contasPag || []).filter(r => r.status !== "pago");
  const contas_receber = crAberto.reduce((s, r) => s + (Number(r.valor || 0) - Number(r.valor_recebido || 0)), 0);
  const contas_pagar = cpAberto.reduce((s, r) => s + (Number(r.valor_total || 0) - Number(r.valor_pago || 0)), 0);

  // Inadimplência
  const totalRec = (contasRec || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const vencidos = (contasRec || []).filter(r => r.status !== "recebido" && r.data_vencimento && r.data_vencimento < hojeStr);
  const totalVencido = vencidos.reduce((s, r) => s + Number(r.valor || 0), 0);
  const inadimplencia_pct = totalRec > 0 ? (totalVencido / totalRec) * 100 : 0;

  // Evolução últimos 6 meses
  const receitas6m: number[] = [];
  const custos6m: number[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anoAtual, mesAtual - 1 - i, 1);
    const mInicio = d.toISOString().slice(0, 10);
    const mFim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
    const { data: mRec } = await supabase.from("receitas").select("valor").gte("data", mInicio).lte("data", mFim);
    const { data: mCv } = await supabase.from("custos_variaveis").select("valor").gte("data", mInicio).lte("data", mFim);
    receitas6m.push((mRec || []).reduce((s, r) => s + Number(r.valor || 0), 0));
    custos6m.push((mCv || []).reduce((s, r) => s + Number(r.valor || 0), 0) + custos_fixos);
  }

  const qtd_lancamentos = (receitas || []).length;
  const ticket_medio = qtd_lancamentos > 0 ? receita_bruta / qtd_lancamentos : 0;
  const endividamento_total = (dividas || []).reduce((s, d: any) => s + Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0)), 0);

  return {
    periodo: `${String(mesAtual).padStart(2, "0")}/${anoAtual}`,
    receita_bruta: Math.round(receita_bruta),
    custos_fixos: Math.round(custos_fixos),
    custos_variaveis: Math.round(custos_variaveis),
    custos_totais: Math.round(custos_totais),
    lucro_bruto: Math.round(lucro_bruto),
    lucro_liquido: Math.round(lucro_liquido),
    margem_bruta: parseFloat(margem_bruta.toFixed(1)),
    margem_liquida: parseFloat(margem_liquida.toFixed(1)),
    contas_receber: Math.round(contas_receber),
    contas_pagar: Math.round(contas_pagar),
    inadimplencia_pct: parseFloat(inadimplencia_pct.toFixed(1)),
    total_receitas_6m: receitas6m,
    total_custos_6m: custos6m,
    qtd_lancamentos,
    ticket_medio: Math.round(ticket_medio),
    endividamento_total: Math.round(endividamento_total),
    setor: empresa?.setor || empresa?.cnae_principal || "Geral",
    regime: empresa?.regime_tributario || "",
  };
}

// ============================================================================
// BENCHMARK SETORIAL
// ============================================================================

export async function carregarBenchmark(setor: string): Promise<BenchmarkSetor | null> {
  // Tenta match por setor
  const { data } = await supabase
    .from("benchmarks_setoriais")
    .select("*")
    .or(`setor.ilike.%${setor}%,cnae_prefixo.eq.${(setor || "").slice(0, 2)}`)
    .limit(1)
    .maybeSingle();

  if (data) return data;

  // Fallback: "Outros / Geral"
  const { data: geral } = await supabase
    .from("benchmarks_setoriais")
    .select("*")
    .ilike("setor", "%Geral%")
    .limit(1)
    .maybeSingle();

  return geral;
}

// ============================================================================
// SCORE EMPRESARIAL 360°
// ============================================================================

export function calcularScore360(snap: SnapshotFinanceiro, bench: BenchmarkSetor | null): Score360 {
  const b = bench || {
    margem_bruta_min: 30, margem_bruta_max: 60,
    margem_liquida_min: 10, margem_liquida_max: 25,
    inadimplencia_max: 10, custo_sobre_receita_max: 75,
    crescimento_anual_medio: 8,
  } as BenchmarkSetor;

  // 1. RENTABILIDADE (25%)
  const scoreMargBruta = Math.min(100, Math.max(0, (snap.margem_bruta / b.margem_bruta_max) * 100));
  const scoreMargLiq = Math.min(100, Math.max(0, (snap.margem_liquida / b.margem_liquida_max) * 100));
  const scoreLucro = snap.lucro_liquido > 0 ? 100 : snap.lucro_liquido === 0 ? 50 : 0;
  const rentabilidade = Math.round((scoreMargBruta * 0.35 + scoreMargLiq * 0.35 + scoreLucro * 0.3));

  // 2. LIQUIDEZ (20%)
  const liquidez_corrente = snap.contas_pagar > 0 ? snap.contas_receber / snap.contas_pagar : (snap.contas_receber > 0 ? 100 : 50);
  const scoreLiquidez = Math.min(100, Math.max(0, liquidez_corrente >= 1.5 ? 100 : liquidez_corrente >= 1 ? 70 : liquidez_corrente >= 0.5 ? 40 : 10));
  const runway = snap.custos_totais > 0 ? snap.contas_receber / snap.custos_totais : 0;
  const scoreRunway = Math.min(100, Math.max(0, runway >= 6 ? 100 : runway >= 3 ? 70 : runway >= 1 ? 40 : 10));
  const liquidezScore = Math.round((scoreLiquidez * 0.6 + scoreRunway * 0.4));

  // 3. EFICIÊNCIA (20%)
  const custoSobreReceita = snap.receita_bruta > 0 ? (snap.custos_totais / snap.receita_bruta) * 100 : 100;
  const scoreEficiencia = Math.min(100, Math.max(0, custoSobreReceita <= b.custo_sobre_receita_max ? 100 : custoSobreReceita <= 90 ? 60 : 20));
  const scoreTicket = snap.ticket_medio > 0 ? Math.min(100, 70) : 30; // base score pra ter dados
  const eficienciaScore = Math.round((scoreEficiencia * 0.7 + scoreTicket * 0.3));

  // 4. CRESCIMENTO (20%)
  const rec6 = snap.total_receitas_6m;
  let crescimento = 0;
  if (rec6.length >= 2 && rec6[0] > 0) {
    crescimento = ((rec6[rec6.length - 1] - rec6[0]) / rec6[0]) * 100;
  }
  const scoreCrescimento = Math.min(100, Math.max(0, crescimento >= 20 ? 100 : crescimento >= 10 ? 80 : crescimento >= 0 ? 60 : crescimento >= -10 ? 30 : 0));

  // 5. RESILIÊNCIA (15%)
  const scoreInadimplencia = Math.min(100, Math.max(0, snap.inadimplencia_pct <= 3 ? 100 : snap.inadimplencia_pct <= b.inadimplencia_max ? 70 : snap.inadimplencia_pct <= 20 ? 30 : 0));
  const patrimonioEstimado = snap.receita_bruta * 6;
  const endividamentoPct = patrimonioEstimado > 0 ? (snap.endividamento_total / patrimonioEstimado) * 100 : 0;
  const scoreEndiv = Math.min(100, Math.max(0, endividamentoPct <= 30 ? 100 : endividamentoPct <= 50 ? 70 : endividamentoPct <= 80 ? 30 : 0));
  const resilienciaScore = Math.round((scoreInadimplencia * 0.5 + scoreEndiv * 0.5));

  const formatPct = (n: number) => `${n.toFixed(1)}%`;
  const formatBRL = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
  const status = (v: number, ok: number, warn: number): "bom" | "atencao" | "critico" => v >= ok ? "bom" : v >= warn ? "atencao" : "critico";

  const dimensoes: Dimensao360[] = [
    {
      nome: "Rentabilidade", nome_en: "Profitability", nome_es: "Rentabilidad",
      score: rentabilidade, peso: 25, cor: "#34d399",
      indicadores: [
        { nome: "Margem Bruta", valor: formatPct(snap.margem_bruta), status: status(snap.margem_bruta, b.margem_bruta_min, b.margem_bruta_min * 0.7) },
        { nome: "Margem Líquida", valor: formatPct(snap.margem_liquida), status: status(snap.margem_liquida, b.margem_liquida_min, 0) },
        { nome: "Lucro Líquido", valor: formatBRL(snap.lucro_liquido), status: snap.lucro_liquido > 0 ? "bom" : "critico" },
      ],
      sugestao: snap.margem_liquida < b.margem_liquida_min ? "Revise precificação e custos variáveis para atingir a margem do setor." : "Margens dentro do benchmark. Continue monitorando.",
      sugestao_en: snap.margem_liquida < b.margem_liquida_min ? "Review pricing and variable costs to reach industry margin." : "Margins within benchmark. Keep monitoring.",
      sugestao_es: snap.margem_liquida < b.margem_liquida_min ? "Revise precios y costos variables para alcanzar el margen del sector." : "Márgenes dentro del benchmark. Siga monitoreando.",
    },
    {
      nome: "Liquidez", nome_en: "Liquidity", nome_es: "Liquidez",
      score: liquidezScore, peso: 20, cor: "#6ab0ff",
      indicadores: [
        { nome: "Liquidez Corrente", valor: liquidez_corrente >= 99 ? "∞" : liquidez_corrente.toFixed(2), status: status(liquidez_corrente, 1.5, 1) },
        { nome: "A Receber", valor: formatBRL(snap.contas_receber), status: "bom" },
        { nome: "A Pagar", valor: formatBRL(snap.contas_pagar), status: snap.contas_pagar > snap.contas_receber ? "atencao" : "bom" },
      ],
      sugestao: liquidez_corrente < 1 ? "Liquidez abaixo de 1.0 — risco de não honrar compromissos. Acelere recebimentos." : "Liquidez saudável. Mantenha reserva de 3-6 meses de custos.",
      sugestao_en: liquidez_corrente < 1 ? "Liquidity below 1.0 — risk of missing payments. Speed up collections." : "Healthy liquidity. Keep 3-6 months reserve.",
      sugestao_es: liquidez_corrente < 1 ? "Liquidez bajo 1.0 — riesgo de no cumplir. Acelere cobros." : "Liquidez saludable. Mantenga reserva de 3-6 meses.",
    },
    {
      nome: "Eficiência", nome_en: "Efficiency", nome_es: "Eficiencia",
      score: eficienciaScore, peso: 20, cor: "#fbbf24",
      indicadores: [
        { nome: "Custo/Receita", valor: formatPct(custoSobreReceita), status: status(100 - custoSobreReceita, 100 - b.custo_sobre_receita_max, 10) },
        { nome: "Ticket Médio", valor: formatBRL(snap.ticket_medio), status: "bom" },
        { nome: "Lançamentos/Mês", valor: String(snap.qtd_lancamentos), status: "bom" },
      ],
      sugestao: custoSobreReceita > b.custo_sobre_receita_max ? "Custos acima do benchmark. Analise cada categoria e negocie fornecedores." : "Eficiência dentro do padrão setorial.",
      sugestao_en: custoSobreReceita > b.custo_sobre_receita_max ? "Costs above benchmark. Analyze each category and negotiate suppliers." : "Efficiency within industry standard.",
      sugestao_es: custoSobreReceita > b.custo_sobre_receita_max ? "Costos sobre el benchmark. Analice categorías y negocie proveedores." : "Eficiencia dentro del estándar.",
    },
    {
      nome: "Crescimento", nome_en: "Growth", nome_es: "Crecimiento",
      score: scoreCrescimento, peso: 20, cor: "#a78bfa",
      indicadores: [
        { nome: "Tendência 6M", valor: `${crescimento >= 0 ? "+" : ""}${crescimento.toFixed(1)}%`, status: status(crescimento, 5, 0) },
        { nome: "Receita Atual", valor: formatBRL(snap.receita_bruta), status: "bom" },
      ],
      sugestao: crescimento < 0 ? "Receita em queda. Invista em captação de clientes e diversificação." : crescimento < 5 ? "Crescimento lento. Avalie novos canais de venda." : "Crescimento forte! Continue investindo.",
      sugestao_en: crescimento < 0 ? "Revenue declining. Invest in client acquisition." : crescimento < 5 ? "Slow growth. Evaluate new sales channels." : "Strong growth! Keep investing.",
      sugestao_es: crescimento < 0 ? "Ingresos en caída. Invierta en captación." : crescimento < 5 ? "Crecimiento lento. Evalúe nuevos canales." : "¡Crecimiento fuerte! Siga invirtiendo.",
    },
    {
      nome: "Resiliência", nome_en: "Resilience", nome_es: "Resiliencia",
      score: resilienciaScore, peso: 15, cor: "#f472b6",
      indicadores: [
        { nome: "Inadimplência", valor: formatPct(snap.inadimplencia_pct), status: status(100 - snap.inadimplencia_pct, 95, 85) },
        { nome: "Endividamento", valor: formatBRL(snap.endividamento_total), status: endividamentoPct > 50 ? "critico" : endividamentoPct > 30 ? "atencao" : "bom" },
      ],
      sugestao: snap.inadimplencia_pct > 10 ? "Inadimplência alta. Ative régua de cobrança em 3 fases." : endividamentoPct > 50 ? "Endividamento elevado. Renegocie antes de novos empréstimos." : "Boa resiliência financeira.",
      sugestao_en: snap.inadimplencia_pct > 10 ? "High delinquency. Activate 3-phase collection." : endividamentoPct > 50 ? "High debt. Renegotiate before new loans." : "Good financial resilience.",
      sugestao_es: snap.inadimplencia_pct > 10 ? "Morosidad alta. Active cobranza en 3 fases." : endividamentoPct > 50 ? "Deuda elevada. Renegocie antes de nuevos préstamos." : "Buena resiliencia financiera.",
    },
  ];

  const total = Math.round(dimensoes.reduce((s, d) => s + (d.score * d.peso / 100), 0));

  let nivel = "Crítico", nivel_en = "Critical", nivel_es = "Crítico", cor = "#f87171";
  if (total >= 80) { nivel = "Excelente"; nivel_en = "Excellent"; nivel_es = "Excelente"; cor = "#34d399"; }
  else if (total >= 60) { nivel = "Bom"; nivel_en = "Good"; nivel_es = "Bueno"; cor = "#6ab0ff"; }
  else if (total >= 40) { nivel = "Regular"; nivel_en = "Fair"; nivel_es = "Regular"; cor = "#fbbf24"; }
  else if (total >= 20) { nivel = "Atenção"; nivel_en = "Caution"; nivel_es = "Atención"; cor = "#fb923c"; }

  return { total, nivel, nivel_en, nivel_es, cor, dimensoes };
}

// ============================================================================
// ANOMALIAS & ALERTAS
// ============================================================================

export function detectarAnomalias(snap: SnapshotFinanceiro, bench: BenchmarkSetor | null): Anomalia[] {
  const anomalias: Anomalia[] = [];
  const b = bench || { margem_liquida_min: 10, inadimplencia_max: 10, custo_sobre_receita_max: 75 } as BenchmarkSetor;

  // Queda de receita MoM
  const rec6 = snap.total_receitas_6m;
  if (rec6.length >= 2 && rec6[rec6.length - 2] > 0) {
    const var_mom = ((rec6[rec6.length - 1] - rec6[rec6.length - 2]) / rec6[rec6.length - 2]) * 100;
    if (var_mom <= -15) {
      anomalias.push({
        tipo: "queda_receita", severidade: "alerta",
        titulo: `Queda de ${Math.abs(var_mom).toFixed(0)}% na receita`,
        titulo_en: `Revenue drop of ${Math.abs(var_mom).toFixed(0)}%`,
        titulo_es: `Caída de ${Math.abs(var_mom).toFixed(0)}% en ingresos`,
        descricao: "Receita caiu significativamente vs mês anterior. Investigue: sazonalidade, perda de clientes ou problemas comerciais.",
        descricao_en: "Revenue dropped significantly vs last month. Investigate: seasonality, client loss or sales issues.",
        descricao_es: "Ingresos cayeron significativamente vs mes anterior. Investigue: estacionalidad, pérdida de clientes o problemas comerciales.",
        metrica: `${var_mom.toFixed(1)}%`,
      });
    } else if (var_mom >= 20) {
      anomalias.push({
        tipo: "queda_receita", severidade: "info",
        titulo: `Receita cresceu ${var_mom.toFixed(0)}%!`,
        titulo_en: `Revenue grew ${var_mom.toFixed(0)}%!`,
        titulo_es: `¡Ingresos crecieron ${var_mom.toFixed(0)}%!`,
        descricao: "Crescimento forte vs mês anterior. Identifique o que funcionou e replique.",
        descricao_en: "Strong growth vs last month. Identify what worked and replicate.",
        descricao_es: "Crecimiento fuerte vs mes anterior. Identifique lo que funcionó y replique.",
        metrica: `+${var_mom.toFixed(1)}%`,
      });
    }
  }

  // Margem abaixo do benchmark
  if (snap.margem_liquida < b.margem_liquida_min && snap.receita_bruta > 0) {
    anomalias.push({
      tipo: "margem_baixa", severidade: "atencao",
      titulo: `Margem líquida (${snap.margem_liquida.toFixed(1)}%) abaixo do setor`,
      titulo_en: `Net margin (${snap.margem_liquida.toFixed(1)}%) below industry`,
      titulo_es: `Margen neto (${snap.margem_liquida.toFixed(1)}%) bajo el sector`,
      descricao: `O benchmark do seu setor é ${b.margem_liquida_min}-${b.margem_liquida_max}%. Revise precificação e custos.`,
      descricao_en: `Industry benchmark is ${b.margem_liquida_min}-${b.margem_liquida_max}%. Review pricing and costs.`,
      descricao_es: `Benchmark del sector es ${b.margem_liquida_min}-${b.margem_liquida_max}%. Revise precios y costos.`,
      metrica: `${snap.margem_liquida.toFixed(1)}%`,
    });
  }

  // Inadimplência
  if (snap.inadimplencia_pct > 5) {
    anomalias.push({
      tipo: "inadimplencia", severidade: snap.inadimplencia_pct > 15 ? "alerta" : "atencao",
      titulo: `Inadimplência em ${snap.inadimplencia_pct.toFixed(1)}%`,
      titulo_en: `Delinquency at ${snap.inadimplencia_pct.toFixed(1)}%`,
      titulo_es: `Morosidad en ${snap.inadimplencia_pct.toFixed(1)}%`,
      descricao: "Ative a régua de cobrança no módulo Inadimplência. Cobranças em 3 fases reduzem até 60% da inadimplência.",
      descricao_en: "Activate collection pipeline in the Delinquency module. 3-phase collections reduce delinquency by up to 60%.",
      descricao_es: "Active la gestión de cobros en el módulo Morosidad. Cobros en 3 fases reducen hasta 60%.",
    });
  }

  // Endividamento alto
  if (snap.endividamento_total > snap.receita_bruta * 3 && snap.receita_bruta > 0) {
    anomalias.push({
      tipo: "endividamento", severidade: "alerta",
      titulo: "Endividamento elevado",
      titulo_en: "High debt level",
      titulo_es: "Endeudamiento elevado",
      descricao: `Dívida de R$ ${snap.endividamento_total.toLocaleString("pt-BR")} supera 3x a receita mensal. Renegocie condições.`,
      descricao_en: `Debt of R$ ${snap.endividamento_total.toLocaleString("pt-BR")} exceeds 3x monthly revenue. Renegotiate terms.`,
      descricao_es: `Deuda de R$ ${snap.endividamento_total.toLocaleString("pt-BR")} supera 3x los ingresos mensuales. Renegocie condiciones.`,
    });
  }

  // Prejuízo
  if (snap.lucro_liquido < 0 && snap.receita_bruta > 0) {
    anomalias.push({
      tipo: "margem_baixa", severidade: "alerta",
      titulo: "Operando no prejuízo",
      titulo_en: "Operating at a loss",
      titulo_es: "Operando con pérdidas",
      descricao: `Prejuízo de R$ ${Math.abs(snap.lucro_liquido).toLocaleString("pt-BR")} no período. Revise custos fixos e precificação urgentemente.`,
      descricao_en: `Loss of R$ ${Math.abs(snap.lucro_liquido).toLocaleString("pt-BR")} in period. Urgently review fixed costs and pricing.`,
      descricao_es: `Pérdida de R$ ${Math.abs(snap.lucro_liquido).toLocaleString("pt-BR")} en el período. Revise costos fijos y precios urgentemente.`,
    });
  }

  // Sem dados
  if (snap.receita_bruta === 0 && snap.custos_totais === 0) {
    anomalias.push({
      tipo: "gasto_alto", severidade: "info",
      titulo: "Sem dados financeiros neste mês",
      titulo_en: "No financial data this month",
      titulo_es: "Sin datos financieros este mes",
      descricao: "Cadastre receitas e custos para ativar a inteligência artificial.",
      descricao_en: "Register revenues and costs to activate AI intelligence.",
      descricao_es: "Registre ingresos y costos para activar la inteligencia artificial.",
    });
  }

  return anomalias;
}

// ============================================================================
// PROJEÇÕES 6 MESES (otimista/realista/pessimista)
// ============================================================================

export function gerarProjecoes(snap: SnapshotFinanceiro): Projecao[] {
  const rec6 = snap.total_receitas_6m;
  const base = rec6[rec6.length - 1] || snap.receita_bruta || 0;
  if (base === 0) return [];

  // Calcula tendência
  let taxaMensal = 0;
  const recComValor = rec6.filter(r => r > 0);
  if (recComValor.length >= 2) {
    taxaMensal = ((recComValor[recComValor.length - 1] - recComValor[0]) / recComValor[0]) / recComValor.length;
  }

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const projecoes: Projecao[] = [];
  const mesAtual = new Date().getMonth();

  for (let i = 1; i <= 6; i++) {
    const mesIdx = (mesAtual + i) % 12;
    const otimista = Math.round(base * Math.pow(1 + taxaMensal * 1.5, i));
    const realista = Math.round(base * Math.pow(1 + taxaMensal, i));
    const pessimista = Math.round(base * Math.pow(1 + taxaMensal * 0.3, i));
    projecoes.push({
      mes: meses[mesIdx],
      otimista: Math.max(0, otimista),
      realista: Math.max(0, realista),
      pessimista: Math.max(0, pessimista),
    });
  }

  return projecoes;
}

// ============================================================================
// WHAT-IF SIMULATOR
// ============================================================================

export function simularWhatIf(
  snap: SnapshotFinanceiro,
  cenario: { tipo: string; valor: number }
): { lucro_antes: number; lucro_depois: number; diferenca: number; margem_antes: number; margem_depois: number } {
  let novaReceita = snap.receita_bruta;
  let novosCustosFixos = snap.custos_fixos;
  let novosCustosVar = snap.custos_variaveis;

  switch (cenario.tipo) {
    case "receita_pct":
      novaReceita = snap.receita_bruta * (1 + cenario.valor / 100);
      novosCustosVar = snap.custos_variaveis * (1 + cenario.valor / 200); // custos var sobem proporcionalmente (metade)
      break;
    case "custos_fixos_pct":
      novosCustosFixos = snap.custos_fixos * (1 + cenario.valor / 100);
      break;
    case "custos_var_pct":
      novosCustosVar = snap.custos_variaveis * (1 + cenario.valor / 100);
      break;
    case "preco_pct":
      novaReceita = snap.receita_bruta * (1 + cenario.valor / 100);
      break;
  }

  const lucro_antes = snap.lucro_liquido;
  const lucro_depois = Math.round(novaReceita - novosCustosFixos - novosCustosVar);
  const margem_antes = snap.margem_liquida;
  const margem_depois = novaReceita > 0 ? parseFloat(((lucro_depois / novaReceita) * 100).toFixed(1)) : 0;

  return { lucro_antes, lucro_depois, diferenca: lucro_depois - lucro_antes, margem_antes, margem_depois };
}

// ============================================================================
// PLANO DE AÇÃO IA (5 ações prioritárias)
// ============================================================================

export function gerarPlanoAcao(snap: SnapshotFinanceiro, score: Score360, anomalias: Anomalia[]): AcaoSugerida[] {
  const acoes: AcaoSugerida[] = [];
  let prioridade = 1;

  // Ação baseada na pior dimensão
  const piorDim = [...score.dimensoes].sort((a, b) => a.score - b.score)[0];

  if (snap.lucro_liquido < 0) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Reverter prejuízo operacional", titulo_en: "Reverse operating loss", titulo_es: "Revertir pérdida operativa",
      descricao: "Analise as 3 maiores categorias de custo e busque reduzir 15-20%. Em paralelo, revise a precificação dos produtos/serviços principais.",
      descricao_en: "Analyze top 3 cost categories and reduce 15-20%. In parallel, review pricing of main products/services.",
      descricao_es: "Analice las 3 mayores categorías de costo y reduzca 15-20%. En paralelo, revise la precificación.",
      impacto_estimado: `+R$ ${Math.abs(snap.lucro_liquido).toLocaleString("pt-BR")}/mês`,
      categoria: "custo",
    });
  }

  if (snap.inadimplencia_pct > 5) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Ativar régua de cobrança", titulo_en: "Activate collection pipeline", titulo_es: "Activar gestión de cobros",
      descricao: "Configure 3 fases: lembrete amigável (D-3), cobrança formal (D+7), negociação (D+15). Reduza inadimplência em até 60%.",
      descricao_en: "Set up 3 phases: friendly reminder (D-3), formal notice (D+7), negotiation (D+15). Reduce delinquency by up to 60%.",
      descricao_es: "Configure 3 fases: recordatorio amigable (D-3), cobro formal (D+7), negociación (D+15). Reduzca morosidad hasta 60%.",
      impacto_estimado: `Recuperar R$ ${Math.round(snap.contas_receber * snap.inadimplencia_pct / 100 * 0.6).toLocaleString("pt-BR")}`,
      categoria: "cobranca",
    });
  }

  if (snap.custos_fixos > snap.receita_bruta * 0.4 && snap.receita_bruta > 0) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Renegociar custos fixos", titulo_en: "Renegotiate fixed costs", titulo_es: "Renegociar costos fijos",
      descricao: "Custos fixos representam mais de 40% da receita. Renegocie aluguel, seguros e contratos recorrentes. Meta: reduzir 10-15%.",
      descricao_en: "Fixed costs exceed 40% of revenue. Renegotiate rent, insurance and recurring contracts. Target: 10-15% reduction.",
      descricao_es: "Costos fijos superan 40% de ingresos. Renegocie alquiler, seguros y contratos. Meta: reducir 10-15%.",
      impacto_estimado: `Economia R$ ${Math.round(snap.custos_fixos * 0.12).toLocaleString("pt-BR")}/mês`,
      categoria: "custo",
    });
  }

  if (piorDim.nome === "Crescimento" && snap.receita_bruta > 0) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Investir em crescimento", titulo_en: "Invest in growth", titulo_es: "Invertir en crecimiento",
      descricao: "Receita estagnada ou em queda. Diversifique canais de venda, lance promoções e invista em marketing digital (2-5% da receita).",
      descricao_en: "Revenue stagnant or declining. Diversify sales channels, launch promotions and invest in digital marketing (2-5% of revenue).",
      descricao_es: "Ingresos estancados o en caída. Diversifique canales, lance promociones e invierta en marketing (2-5% de ingresos).",
      impacto_estimado: `Meta: +${Math.round(snap.receita_bruta * 0.1).toLocaleString("pt-BR")}/mês`,
      categoria: "receita",
    });
  }

  if (snap.regime && !["simples", "mei"].includes(snap.regime.toLowerCase())) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Avaliar regime tributário", titulo_en: "Evaluate tax regime", titulo_es: "Evaluar régimen tributario",
      descricao: "Use a IA Tributária para simular se Simples Nacional seria mais vantajoso para o seu faturamento atual.",
      descricao_en: "Use Tax AI to simulate if Simples Nacional would be more advantageous for your current revenue.",
      descricao_es: "Use la IA Tributaria para simular si Simples Nacional sería más ventajoso para su facturación.",
      impacto_estimado: "Potencial 5-15% economia fiscal",
      categoria: "fiscal",
    });
  }

  // Garantir ao menos 3 ações
  if (acoes.length < 3 && snap.receita_bruta > 0) {
    acoes.push({
      prioridade: prioridade++,
      titulo: "Monitorar KPIs semanalmente", titulo_en: "Monitor KPIs weekly", titulo_es: "Monitorear KPIs semanalmente",
      descricao: "Acompanhe receita, margem e fluxo de caixa toda semana. Empresas que monitoram KPIs crescem 25% mais rápido.",
      descricao_en: "Track revenue, margin and cash flow weekly. Companies that monitor KPIs grow 25% faster.",
      descricao_es: "Siga ingresos, margen y flujo de caja semanalmente. Empresas que monitorean KPIs crecen 25% más rápido.",
      impacto_estimado: "+25% decisões assertivas",
      categoria: "gestao",
    });
  }

  return acoes.slice(0, 5);
}

// ============================================================================
// RESUMO EXECUTIVO NARRADO (texto completo do mês)
// ============================================================================

export function gerarResumoNarrado(snap: SnapshotFinanceiro, score: Score360, bench: BenchmarkSetor | null, idioma: string): string {
  const formatBRL = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;
  const b = bench;

  if (idioma === "en") {
    if (snap.receita_bruta === 0) return "No financial data for this period. Register revenues and costs to generate the executive summary.";
    return [
      `📊 Executive Summary — ${snap.periodo}`,
      ``,
      `Your company generated ${formatBRL(snap.receita_bruta)} in revenue with total costs of ${formatBRL(snap.custos_totais)}, resulting in a net ${snap.lucro_liquido >= 0 ? "profit" : "loss"} of ${formatBRL(Math.abs(snap.lucro_liquido))}.`,
      ``,
      `Net margin stands at ${snap.margem_liquida.toFixed(1)}%${b ? ` (industry benchmark: ${b.margem_liquida_min}-${b.margem_liquida_max}%)` : ""}.`,
      snap.inadimplencia_pct > 5 ? `⚠️ Delinquency at ${snap.inadimplencia_pct.toFixed(1)}% requires attention.` : "",
      snap.endividamento_total > 0 ? `Total debt: ${formatBRL(snap.endividamento_total)}.` : "",
      ``,
      `🏆 Business Score 360°: ${score.total}/100 (${score.nivel_en}).`,
      score.dimensoes.filter(d => d.score < 50).length > 0
        ? `Focus areas: ${score.dimensoes.filter(d => d.score < 50).map(d => d.nome_en).join(", ")}.`
        : "All dimensions performing well.",
    ].filter(Boolean).join("\n");
  }

  if (idioma === "es") {
    if (snap.receita_bruta === 0) return "Sin datos financieros para este período. Registre ingresos y costos para generar el resumen ejecutivo.";
    return [
      `📊 Resumen Ejecutivo — ${snap.periodo}`,
      ``,
      `Su empresa generó ${formatBRL(snap.receita_bruta)} en ingresos con costos totales de ${formatBRL(snap.custos_totais)}, resultando en un ${snap.lucro_liquido >= 0 ? "beneficio" : "pérdida"} neto de ${formatBRL(Math.abs(snap.lucro_liquido))}.`,
      ``,
      `Margen neto: ${snap.margem_liquida.toFixed(1)}%${b ? ` (benchmark del sector: ${b.margem_liquida_min}-${b.margem_liquida_max}%)` : ""}.`,
      snap.inadimplencia_pct > 5 ? `⚠️ Morosidad en ${snap.inadimplencia_pct.toFixed(1)}% requiere atención.` : "",
      snap.endividamento_total > 0 ? `Deuda total: ${formatBRL(snap.endividamento_total)}.` : "",
      ``,
      `🏆 Score Empresarial 360°: ${score.total}/100 (${score.nivel_es}).`,
    ].filter(Boolean).join("\n");
  }

  // PT (default)
  if (snap.receita_bruta === 0) return "Sem dados financeiros neste período. Cadastre receitas e custos para gerar o resumo executivo.";
  return [
    `📊 Resumo Executivo — ${snap.periodo}`,
    ``,
    `Sua empresa faturou ${formatBRL(snap.receita_bruta)} com custos totais de ${formatBRL(snap.custos_totais)}, resultando em ${snap.lucro_liquido >= 0 ? "lucro" : "prejuízo"} líquido de ${formatBRL(Math.abs(snap.lucro_liquido))}.`,
    ``,
    `A margem líquida ficou em ${snap.margem_liquida.toFixed(1)}%${b ? ` (benchmark do setor: ${b.margem_liquida_min}-${b.margem_liquida_max}%)` : ""}.`,
    snap.inadimplencia_pct > 5 ? `⚠️ Inadimplência em ${snap.inadimplencia_pct.toFixed(1)}% requer atenção imediata.` : "",
    snap.endividamento_total > 0 ? `Endividamento total: ${formatBRL(snap.endividamento_total)}.` : "",
    ``,
    `🏆 Score Empresarial 360°: ${score.total}/100 (${score.nivel}).`,
    score.dimensoes.filter(d => d.score < 50).length > 0
      ? `Áreas prioritárias: ${score.dimensoes.filter(d => d.score < 50).map(d => d.nome).join(", ")}.`
      : "Todas as dimensões com desempenho positivo.",
  ].filter(Boolean).join("\n");
}

// ============================================================================
// CHAT — MONTAR PROMPT PRA CLAUDE API
// ============================================================================

export function montarPromptCFO(snap: SnapshotFinanceiro, score: Score360, bench: BenchmarkSetor | null, pergunta: string, idioma: string): string {
  const lang = idioma === "en" ? "English" : idioma === "es" ? "Spanish" : "Portuguese (Brazilian)";
  return `You are Axioma CFO AI — a senior financial analyst specializing in Brazilian small and medium businesses. Answer in ${lang}. Be direct, specific, and actionable. Use the company's REAL data below.

COMPANY DATA (current month: ${snap.periodo}):
- Revenue: R$ ${snap.receita_bruta.toLocaleString("pt-BR")}
- Fixed Costs: R$ ${snap.custos_fixos.toLocaleString("pt-BR")}
- Variable Costs: R$ ${snap.custos_variaveis.toLocaleString("pt-BR")}
- Net Profit: R$ ${snap.lucro_liquido.toLocaleString("pt-BR")}
- Gross Margin: ${snap.margem_bruta.toFixed(1)}%
- Net Margin: ${snap.margem_liquida.toFixed(1)}%
- Accounts Receivable (open): R$ ${snap.contas_receber.toLocaleString("pt-BR")}
- Accounts Payable (open): R$ ${snap.contas_pagar.toLocaleString("pt-BR")}
- Delinquency Rate: ${snap.inadimplencia_pct.toFixed(1)}%
- Total Debt: R$ ${snap.endividamento_total.toLocaleString("pt-BR")}
- Average Ticket: R$ ${snap.ticket_medio.toLocaleString("pt-BR")}
- Entries/month: ${snap.qtd_lancamentos}
- Revenue last 6 months: [${snap.total_receitas_6m.join(", ")}]
- Industry: ${snap.setor}
- Tax Regime: ${snap.regime || "not defined"}

BUSINESS SCORE 360°: ${score.total}/100 (${score.nivel_en})
${score.dimensoes.map(d => `- ${d.nome_en}: ${d.score}/100`).join("\n")}

${bench ? `INDUSTRY BENCHMARK:
- Gross Margin: ${bench.margem_bruta_min}-${bench.margem_bruta_max}%
- Net Margin: ${bench.margem_liquida_min}-${bench.margem_liquida_max}%
- Max Delinquency: ${bench.inadimplencia_max}%
- Max Cost/Revenue: ${bench.custo_sobre_receita_max}%` : ""}

USER QUESTION: ${pergunta}

RULES:
1. Use ONLY the real data above. Never invent numbers.
2. Be specific: mention exact values and percentages.
3. Compare with industry benchmarks when relevant.
4. Suggest 2-3 concrete actions with estimated impact.
5. Keep response under 300 words.
6. If asked about something not in the data, say what data would be needed.`;
}

// ============================================================================
// CHAT — RESPOSTA POR REGRAS (fallback sem Claude API)
// ============================================================================

export function respostaPorRegras(snap: SnapshotFinanceiro, score: Score360, bench: BenchmarkSetor | null, pergunta: string, idioma: string): string {
  const p = pergunta.toLowerCase();
  const formatBRL = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;

  // Sem dados
  if (snap.receita_bruta === 0 && snap.custos_totais === 0) {
    if (idioma === "en") return "I don't have financial data yet. Register revenues and costs to activate personalized analysis.";
    if (idioma === "es") return "Aún no tengo datos financieros. Registre ingresos y costos para activar el análisis personalizado.";
    return "Ainda não tenho dados financeiros. Cadastre receitas e custos para ativar a análise personalizada.";
  }

  // Margem
  if (p.includes("margem") || p.includes("margin") || p.includes("margen")) {
    if (idioma === "en") return `Your gross margin is ${snap.margem_bruta.toFixed(1)}% and net margin is ${snap.margem_liquida.toFixed(1)}%.${bench ? ` Industry benchmark: ${bench.margem_liquida_min}-${bench.margem_liquida_max}%.` : ""} ${snap.margem_liquida < (bench?.margem_liquida_min || 10) ? "Below benchmark — review pricing and costs." : "Within healthy range."}`;
    if (idioma === "es") return `Su margen bruto es ${snap.margem_bruta.toFixed(1)}% y margen neto es ${snap.margem_liquida.toFixed(1)}%.${bench ? ` Benchmark: ${bench.margem_liquida_min}-${bench.margem_liquida_max}%.` : ""}`;
    return `Sua margem bruta é ${snap.margem_bruta.toFixed(1)}% e margem líquida ${snap.margem_liquida.toFixed(1)}%.${bench ? ` Benchmark do setor: ${bench.margem_liquida_min}-${bench.margem_liquida_max}%.` : ""} ${snap.margem_liquida < (bench?.margem_liquida_min || 10) ? "Abaixo do benchmark — revise precificação e custos." : "Dentro da faixa saudável."}`;
  }

  // Custos
  if (p.includes("custo") || p.includes("cost") || p.includes("costo") || p.includes("reduzir") || p.includes("reduce")) {
    if (idioma === "en") return `Your total costs are ${formatBRL(snap.custos_totais)} (Fixed: ${formatBRL(snap.custos_fixos)}, Variable: ${formatBRL(snap.custos_variaveis)}). Costs represent ${snap.receita_bruta > 0 ? ((snap.custos_totais / snap.receita_bruta) * 100).toFixed(1) : "0"}% of revenue. Actions: 1) Renegotiate fixed costs (target -10%); 2) Review variable cost categories; 3) Optimize supplier contracts.`;
    return `Seus custos totais são ${formatBRL(snap.custos_totais)} (Fixos: ${formatBRL(snap.custos_fixos)}, Variáveis: ${formatBRL(snap.custos_variaveis)}). Representam ${snap.receita_bruta > 0 ? ((snap.custos_totais / snap.receita_bruta) * 100).toFixed(1) : "0"}% da receita. Ações: 1) Renegocie custos fixos (meta -10%); 2) Analise categorias de custo variável; 3) Otimize contratos com fornecedores.`;
  }

  // Fluxo de caixa
  if (p.includes("fluxo") || p.includes("cash") || p.includes("caixa") || p.includes("flujo")) {
    if (idioma === "en") return `Cash position: Receivables ${formatBRL(snap.contas_receber)} vs Payables ${formatBRL(snap.contas_pagar)}. Net: ${formatBRL(snap.contas_receber - snap.contas_pagar)}. ${snap.contas_receber > snap.contas_pagar ? "Positive balance." : "Attention: payables exceed receivables."}`;
    return `Posição de caixa: A Receber ${formatBRL(snap.contas_receber)} vs A Pagar ${formatBRL(snap.contas_pagar)}. Saldo: ${formatBRL(snap.contas_receber - snap.contas_pagar)}. ${snap.contas_receber > snap.contas_pagar ? "Saldo positivo." : "Atenção: contas a pagar superam recebíveis."}`;
  }

  // Score
  if (p.includes("score") || p.includes("saúde") || p.includes("saude") || p.includes("health") || p.includes("salud")) {
    if (idioma === "en") return `Your Business Score 360° is ${score.total}/100 (${score.nivel_en}). Dimensions: ${score.dimensoes.map(d => `${d.nome_en}: ${d.score}`).join(", ")}. ${score.dimensoes.filter(d => d.score < 50).length > 0 ? `Priority: improve ${score.dimensoes.filter(d => d.score < 50).map(d => d.nome_en).join(", ")}.` : "All dimensions healthy!"}`;
    return `Seu Score Empresarial 360° é ${score.total}/100 (${score.nivel}). Dimensões: ${score.dimensoes.map(d => `${d.nome}: ${d.score}`).join(", ")}. ${score.dimensoes.filter(d => d.score < 50).length > 0 ? `Prioridade: melhorar ${score.dimensoes.filter(d => d.score < 50).map(d => d.nome).join(", ")}.` : "Todas as dimensões saudáveis!"}`;
  }

  // Receita/faturamento
  if (p.includes("receita") || p.includes("revenue") || p.includes("faturamento") || p.includes("ingreso")) {
    if (idioma === "en") return `Revenue this month: ${formatBRL(snap.receita_bruta)} from ${snap.qtd_lancamentos} entries. Average ticket: ${formatBRL(snap.ticket_medio)}. Last 6 months trend: [${snap.total_receitas_6m.map(r => formatBRL(r)).join(", ")}].`;
    return `Receita do mês: ${formatBRL(snap.receita_bruta)} em ${snap.qtd_lancamentos} lançamentos. Ticket médio: ${formatBRL(snap.ticket_medio)}. Tendência 6 meses: [${snap.total_receitas_6m.map(r => formatBRL(r)).join(", ")}].`;
  }

  // Resposta genérica com resumo dos dados
  if (idioma === "en") return `Based on your data: Revenue ${formatBRL(snap.receita_bruta)}, Net Profit ${formatBRL(snap.lucro_liquido)}, Margin ${snap.margem_liquida.toFixed(1)}%, Score ${score.total}/100. Ask me about margins, costs, cash flow, projections or any specific area.`;
  if (idioma === "es") return `Según sus datos: Ingresos ${formatBRL(snap.receita_bruta)}, Beneficio Neto ${formatBRL(snap.lucro_liquido)}, Margen ${snap.margem_liquida.toFixed(1)}%, Score ${score.total}/100. Pregunte sobre márgenes, costos, flujo de caja, proyecciones o cualquier área.`;
  return `Com base nos seus dados: Receita ${formatBRL(snap.receita_bruta)}, Lucro Líquido ${formatBRL(snap.lucro_liquido)}, Margem ${snap.margem_liquida.toFixed(1)}%, Score ${score.total}/100. Pergunte sobre margens, custos, fluxo de caixa, projeções ou qualquer área específica.`;
}

// ============================================================================
// HISTÓRICO DE CONVERSAS
// ============================================================================

export async function salvarMensagem(userId: string, empresaId: string | null, role: string, mensagem: string, contexto?: any, modelo?: string): Promise<void> {
  await supabase.from("ia_financeira_historico").insert({
    user_id: userId,
    empresa_id: empresaId,
    role,
    mensagem,
    contexto,
    modelo: modelo || "regras",
  });
}

export async function carregarHistorico(userId: string, limit: number = 50): Promise<any[]> {
  const { data } = await supabase
    .from("ia_financeira_historico")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  return data || [];
}

export async function limparHistorico(userId: string): Promise<void> {
  await supabase.from("ia_financeira_historico").delete().not("id", "is", null);
}