// 🦅 AXIOMA AI.TECH - Helpers IA Tributária
// Simulador de regime, Score Fiscal, carga tributária, economia estimada, reforma 2026.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { dasMensalPorCategoria } from "./meiHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// TIPOS
// ============================================================================

export type DadosFiscais = {
  receita_bruta_12m: number;
  receita_bruta_mensal: number;
  custos_fixos_mensal: number;
  custos_variaveis_mensal: number;
  folha_pagamento_mensal: number; // estimativa: custos_fixos * 0.4
  lucro_bruto_mensal: number;
  regime_atual: string;
  setor: string;
  cnae: string;
  obrigacoes_pendentes: number;
  obrigacoes_vencidas: number;
  total_obrigacoes: number;
};

export type SimulacaoRegime = {
  regime: string;
  regime_label: string;
  imposto_mensal: number;
  imposto_anual: number;
  aliquota_efetiva: number;
  economia_vs_atual: number;
  detalhamento: string;
  detalhamento_en: string;
  detalhamento_es: string;
  elegivel: boolean;
  motivo_inelegivel?: string;
};

export type ScoreFiscal = {
  score: number;
  nivel: string;
  nivel_en: string;
  nivel_es: string;
  cor: string;
  itens: { label: string; label_en: string; label_es: string; ok: boolean; pontos: number }[];
};

export type AlertaReforma = {
  titulo: string;
  titulo_en: string;
  titulo_es: string;
  descricao: string;
  descricao_en: string;
  descricao_es: string;
  data: string;
  impacto: "positivo" | "neutro" | "negativo";
};

// ============================================================================
// CARREGAR DADOS FISCAIS
// ============================================================================

export async function carregarDadosFiscais(userId: string, empresaId: string | null): Promise<DadosFiscais> {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const inicio = new Date(anoAtual, mesAtual - 1, 1).toISOString().slice(0, 10);
  const fim = new Date(anoAtual, mesAtual, 0).toISOString().slice(0, 10);

  // Últimos 12 meses
  const inicio12m = new Date(anoAtual - 1, mesAtual - 1, 1).toISOString().slice(0, 10);

  const [
    { data: rec12m },
    { data: recMes },
    { data: custosFix },
    { data: custosVar },
    { data: empresa },
    { data: obrigacoes },
  ] = await Promise.all([
    empresaId ? supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicio12m).lte("data", fim) : Promise.resolve({ data: [] }),
    empresaId ? supabase.from("receitas").select("valor").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim) : Promise.resolve({ data: [] }),
    empresaId ? supabase.from("custos_fixos").select("valor_mensal").eq("empresa_id", empresaId) : Promise.resolve({ data: [] }),
    empresaId ? supabase.from("custos_variaveis").select("valor").eq("empresa_id", empresaId).gte("data", inicio).lte("data", fim) : Promise.resolve({ data: [] }),
    empresaId ? supabase.from("empresas").select("regime_tributario, setor, cnae_principal").eq("id", empresaId).maybeSingle() : Promise.resolve({ data: null }),
    Promise.resolve(empresaId ? supabase.from("empresa_obrigacoes").select("status, data_vencimento").eq("empresa_id", empresaId) : { data: [] }).catch(() => ({ data: [] })),
  ]);

  const receita_bruta_12m = (rec12m || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const receita_bruta_mensal = (recMes || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const custos_fixos_mensal = (custosFix || []).reduce((s, r) => s + Number(r.valor_mensal || 0), 0);
  const custos_variaveis_mensal = (custosVar || []).reduce((s, r) => s + Number(r.valor || 0), 0);
  const folha_pagamento_mensal = Math.round(custos_fixos_mensal * 0.4); // estimativa
  const lucro_bruto_mensal = receita_bruta_mensal - custos_variaveis_mensal;

  const hojeStr = hoje.toISOString().slice(0, 10);
  const obrigLista = obrigacoes || [];
  const pendentes = obrigLista.filter((o: any) => o.status === "pendente");
  const vencidas = pendentes.filter((o: any) => o.data_vencimento && o.data_vencimento < hojeStr);

  return {
    receita_bruta_12m: Math.round(receita_bruta_12m),
    receita_bruta_mensal: Math.round(receita_bruta_mensal),
    custos_fixos_mensal: Math.round(custos_fixos_mensal),
    custos_variaveis_mensal: Math.round(custos_variaveis_mensal),
    folha_pagamento_mensal,
    lucro_bruto_mensal: Math.round(lucro_bruto_mensal),
    regime_atual: empresa?.regime_tributario || "",
    setor: empresa?.setor || "",
    cnae: empresa?.cnae_principal || "",
    obrigacoes_pendentes: pendentes.length,
    obrigacoes_vencidas: vencidas.length,
    total_obrigacoes: obrigLista.length,
  };
}

// ============================================================================
// LUCRO PRESUMIDO — FONTE CANÔNICA ÚNICA
// Regra 2026 confirmada: presunção por atividade sobre receita bruta
// (Comércio/Indústria 8%, Serviços 32%, Revenda de combustível 1,6%) — se a
// empresa tiver mais de uma atividade, cada percentual se aplica só à
// receita daquela atividade (fora do escopo desta função: ela recebe uma
// receita já segregada por atividade). Sobre a base presumida: IRPJ 15% +
// adicional de 10% sobre o excedente de R$60.000/TRIMESTRE (aproximado aqui
// por R$20.000/mês — mesma convenção já usada no bloco de Lucro Real deste
// arquivo, que soma por mês; não acumula histórico trimestral real). CSLL
// 9%. PIS/COFINS cumulativo 3,65% direto sobre a receita bruta. ISS só pra
// Serviços, alíquota municipal (2% a 5%) — não existe campo de atividade
// nem de alíquota de ISS no cadastro da empresa hoje (confirmado: `setor`
// é usado só pro benchmark do Dashboard, não é a mesma coisa), por isso os
// dois são parâmetro explícito, nunca lido do banco. Sem eles, os defaults
// abaixo são usados e sinalizados em atividadePresumida/issPresumido — quem
// chama decide se avisa a tela, esta função nunca decide sozinha.
// Usada por simularRegimes, calcularCargaTributaria e calcularImpostoRegime
// — as 3 fórmulas divergentes que existiam viraram uma só.
// ============================================================================

export type AtividadeFiscal = "comercio_industria" | "servicos" | "revenda_combustivel";

export const PRESUNCAO_POR_ATIVIDADE: Record<AtividadeFiscal, number> = {
  comercio_industria: 0.08,
  servicos: 0.32,
  revenda_combustivel: 0.016,
};

const ATIVIDADE_FISCAL_DEFAULT: AtividadeFiscal = "servicos";
const ISS_MUNICIPAL_DEFAULT_PCT = 5; // teto legal comum — mesma referência que já existia antes, agora explícita e sinalizada

export type ResultadoLucroPresumido = {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  iss: number;
  total: number;
  aliquotaEfetivaPct: number;
  atividade: AtividadeFiscal;
  atividadePresumida: boolean; // true = atividade não veio informada, usamos o default
  issPresumido: boolean; // true = alíquota de ISS não veio informada, usamos o default (só relevante se atividade === "servicos")
};

export function calcularLucroPresumido(
  receitaMensal: number,
  atividade?: AtividadeFiscal,
  aliquotaIssMunicipalPct?: number,
  aplicarAdicionalTrimestral: boolean = true,
): ResultadoLucroPresumido {
  const rb = Math.max(0, receitaMensal || 0);
  const atividadePresumida = !atividade;
  const atividadeReal = atividade || ATIVIDADE_FISCAL_DEFAULT;
  const ehServico = atividadeReal === "servicos";
  const issPresumido = ehServico && (aliquotaIssMunicipalPct === undefined || aliquotaIssMunicipalPct === null);
  const issPct = ehServico ? (aliquotaIssMunicipalPct ?? ISS_MUNICIPAL_DEFAULT_PCT) : 0;

  const basePresumida = rb * PRESUNCAO_POR_ATIVIDADE[atividadeReal];
  const limiteMensalAdicional = 60000 / 3; // R$60mil/trimestre aproximado por mês
  const irpj = basePresumida * 0.15 + (aplicarAdicionalTrimestral ? Math.max(0, basePresumida - limiteMensalAdicional) * 0.10 : 0);
  const csll = basePresumida * 0.09;
  const pis = rb * 0.0065;
  const cofins = rb * 0.03;
  const iss = rb * (issPct / 100);
  const total = irpj + csll + pis + cofins + iss;

  return {
    irpj, csll, pis, cofins, iss, total,
    aliquotaEfetivaPct: rb > 0 ? (total / rb) * 100 : 0,
    atividade: atividadeReal,
    atividadePresumida,
    issPresumido,
  };
}

// ============================================================================
// SIMULADOR DE REGIME TRIBUTÁRIO
// ============================================================================

export function simularRegimes(dados: DadosFiscais, atividade?: AtividadeFiscal, aliquotaIssMunicipalPct?: number): SimulacaoRegime[] {
  const rb12 = dados.receita_bruta_12m || dados.receita_bruta_mensal * 12;
  const rbMes = dados.receita_bruta_mensal;
  const resultados: SimulacaoRegime[] = [];

  // Cálculo imposto atual (estimativa)
  const impostoAtual = calcularImpostoRegime(dados.regime_atual, rb12, rbMes);

  // 1. MEI
  const meiElegivel = rb12 <= 144000;
  const meiMensal = dasMensalPorCategoria("Serviços"); // fonte única: lib/meiHelpers.ts
  resultados.push({
    regime: "mei", regime_label: "MEI",
    imposto_mensal: Math.round(meiMensal),
    imposto_anual: Math.round(meiMensal * 12),
    aliquota_efetiva: rbMes > 0 ? parseFloat(((meiMensal / rbMes) * 100).toFixed(2)) : 0,
    economia_vs_atual: Math.round((impostoAtual - meiMensal) * 12),
    detalhamento: `DAS fixo R$ ${meiMensal.toFixed(2)}/mês. Limite: R$ 144K/ano. Sem funcionários.`,
    detalhamento_en: `Fixed DAS R$ ${meiMensal.toFixed(2)}/month. Limit: R$ 144K/year. No employees.`,
    detalhamento_es: `DAS fijo R$ ${meiMensal.toFixed(2)}/mes. Límite: R$ 144K/año. Sin empleados.`,
    elegivel: meiElegivel,
    motivo_inelegivel: meiElegivel ? undefined : "Faturamento acima de R$ 144K/ano",
  });

  // 2. Simples Nacional
  const simplesElegivel = rb12 <= 4800000;
  const simplesAliquota = calcularAliquotaSimples(rb12, "III"); // padrão serviços
  const simplesMensal = rbMes * (simplesAliquota / 100);
  resultados.push({
    regime: "simples", regime_label: "Simples Nacional",
    imposto_mensal: Math.round(simplesMensal),
    imposto_anual: Math.round(simplesMensal * 12),
    aliquota_efetiva: parseFloat(simplesAliquota.toFixed(2)),
    economia_vs_atual: Math.round((impostoAtual - simplesMensal) * 12),
    detalhamento: `Alíquota efetiva ${simplesAliquota.toFixed(2)}%. DAS único. Limite: R$ 4,8M/ano.`,
    detalhamento_en: `Effective rate ${simplesAliquota.toFixed(2)}%. Single DAS. Limit: R$ 4.8M/year.`,
    detalhamento_es: `Alícuota efectiva ${simplesAliquota.toFixed(2)}%. DAS único. Límite: R$ 4,8M/año.`,
    elegivel: simplesElegivel,
    motivo_inelegivel: simplesElegivel ? undefined : "Faturamento acima de R$ 4,8M/ano",
  });

  // 3. Lucro Presumido — fonte canônica calcularLucroPresumido (regra 2026:
  // presunção por atividade, adicional trimestral, ISS parametrizado).
  const presumidoElegivel = rb12 <= 78000000;
  const lp = calcularLucroPresumido(rbMes, atividade, aliquotaIssMunicipalPct);
  resultados.push({
    regime: "presumido", regime_label: "Lucro Presumido",
    imposto_mensal: Math.round(lp.total),
    imposto_anual: Math.round(lp.total * 12),
    aliquota_efetiva: parseFloat(lp.aliquotaEfetivaPct.toFixed(2)),
    economia_vs_atual: Math.round((impostoAtual - lp.total) * 12),
    detalhamento: `IRPJ ${lp.irpj.toFixed(0)} + CSLL ${lp.csll.toFixed(0)} + PIS ${lp.pis.toFixed(0)} + COFINS ${lp.cofins.toFixed(0)}${lp.iss > 0 ? ` + ISS ${lp.iss.toFixed(0)}` : ""}. Presunção: ${lp.atividade === "servicos" ? "Serviços 32%" : lp.atividade === "comercio_industria" ? "Comércio/Indústria 8%" : "Revenda de combustível 1,6%"}${lp.atividadePresumida ? " (não confirmada — confirme a atividade da empresa)" : ""}.`,
    detalhamento_en: `IRPJ ${lp.irpj.toFixed(0)} + CSLL ${lp.csll.toFixed(0)} + PIS ${lp.pis.toFixed(0)} + COFINS ${lp.cofins.toFixed(0)}${lp.iss > 0 ? ` + ISS ${lp.iss.toFixed(0)}` : ""}. Presumption: ${lp.atividade === "servicos" ? "Services 32%" : lp.atividade === "comercio_industria" ? "Trade/Industry 8%" : "Fuel resale 1.6%"}${lp.atividadePresumida ? " (unconfirmed — confirm the company's activity)" : ""}.`,
    detalhamento_es: `IRPJ ${lp.irpj.toFixed(0)} + CSLL ${lp.csll.toFixed(0)} + PIS ${lp.pis.toFixed(0)} + COFINS ${lp.cofins.toFixed(0)}${lp.iss > 0 ? ` + ISS ${lp.iss.toFixed(0)}` : ""}. Presunción: ${lp.atividade === "servicos" ? "Servicios 32%" : lp.atividade === "comercio_industria" ? "Comercio/Industria 8%" : "Reventa de combustible 1,6%"}${lp.atividadePresumida ? " (no confirmada — confirme la actividad de la empresa)" : ""}.`,
    elegivel: presumidoElegivel,
  });

  // 4. Lucro Real
  const lucroReal = dados.lucro_bruto_mensal - dados.custos_fixos_mensal;
  const baseReal = Math.max(0, lucroReal);
  const irpjReal = baseReal * 0.15 + Math.max(0, baseReal - 20000) * 0.10; // adicional 10% acima de 20k
  const csllReal = baseReal * 0.09;
  const pisReal = rbMes * 0.0165; // não-cumulativo
  const cofinsReal = rbMes * 0.076;
  const issReal = rbMes * 0.05;
  const realMensal = irpjReal + csllReal + pisReal + cofinsReal + issReal;
  const aliqReal = rbMes > 0 ? (realMensal / rbMes) * 100 : 0;
  resultados.push({
    regime: "real", regime_label: "Lucro Real",
    imposto_mensal: Math.round(realMensal),
    imposto_anual: Math.round(realMensal * 12),
    aliquota_efetiva: parseFloat(aliqReal.toFixed(2)),
    economia_vs_atual: Math.round((impostoAtual - realMensal) * 12),
    detalhamento: `Base: lucro real R$ ${baseReal.toLocaleString("pt-BR")}. PIS/COFINS não-cumulativo (créditos dedutíveis).`,
    detalhamento_en: `Base: actual profit R$ ${baseReal.toLocaleString("pt-BR")}. Non-cumulative PIS/COFINS (deductible credits).`,
    detalhamento_es: `Base: lucro real R$ ${baseReal.toLocaleString("pt-BR")}. PIS/COFINS no acumulativo (créditos deducibles).`,
    elegivel: true,
  });

  return resultados.sort((a, b) => a.imposto_mensal - b.imposto_mensal);
}

// Exportada para reuso no DRE (calcula a dedução/imposto real da empresa a partir
// do regime tributário, em vez de um percentual fixo chutado).
export function calcularImpostoRegime(
  regime: string,
  rb12: number,
  rbMes: number,
  atividade?: AtividadeFiscal,
  aliquotaIssMunicipalPct?: number,
): number {
  const r = (regime || "").toLowerCase();
  if (r === "mei") return dasMensalPorCategoria("Serviços");
  if (r.includes("simples")) {
    const aliq = calcularAliquotaSimples(rb12, "III");
    return rbMes * (aliq / 100);
  }
  // Fonte canônica calcularLucroPresumido — sem atividade/ISS informados
  // (nenhum dos ~14 chamadores desta função hoje tem isso disponível),
  // usa os mesmos defaults documentados (Serviços 32%, ISS 5%) que o
  // código antigo já assumia, mas agora com o adicional trimestral
  // aplicado corretamente e a mesma fórmula do simulador/carga real.
  if (r.includes("presumido")) return calcularLucroPresumido(rbMes, atividade, aliquotaIssMunicipalPct).total;
  if (r.includes("real")) return rbMes * 0.15;
  // Sem regime: estima como simples
  const aliq = calcularAliquotaSimples(rb12, "III");
  return rbMes * (aliq / 100);
}

export function calcularAliquotaSimples(rb12: number, anexo: string): number {
  // Tabela simplificada Simples Nacional
  const faixas: Record<string, { max: number; aliq: number; ded: number }[]> = {
    "I": [
      { max: 180000, aliq: 4, ded: 0 }, { max: 360000, aliq: 7.3, ded: 5940 },
      { max: 720000, aliq: 9.5, ded: 13860 }, { max: 1800000, aliq: 10.7, ded: 22500 },
      { max: 3600000, aliq: 14.3, ded: 87300 }, { max: 4800000, aliq: 19, ded: 378000 },
    ],
    "III": [
      { max: 180000, aliq: 6, ded: 0 }, { max: 360000, aliq: 11.2, ded: 9360 },
      { max: 720000, aliq: 13.5, ded: 17640 }, { max: 1800000, aliq: 16, ded: 35640 },
      { max: 3600000, aliq: 21, ded: 125640 }, { max: 4800000, aliq: 33, ded: 648000 },
    ],
    "V": [
      { max: 180000, aliq: 15.5, ded: 0 }, { max: 360000, aliq: 18, ded: 4500 },
      { max: 720000, aliq: 19.5, ded: 9900 }, { max: 1800000, aliq: 20.5, ded: 17100 },
      { max: 3600000, aliq: 23, ded: 62100 }, { max: 4800000, aliq: 30.5, ded: 540000 },
    ],
  };
  const tabela = faixas[anexo] || faixas["III"];
  if (rb12 <= 0) return tabela[0].aliq;

  for (const f of tabela) {
    if (rb12 <= f.max) {
      const aliqEfetiva = ((rb12 * f.aliq / 100) - f.ded) / rb12 * 100;
      return Math.max(0, aliqEfetiva);
    }
  }
  return tabela[tabela.length - 1].aliq;
}

// ============================================================================
// CARGA TRIBUTÁRIA REAL
// ============================================================================

export function calcularCargaTributaria(
  dados: DadosFiscais,
  atividade?: AtividadeFiscal,
  aliquotaIssMunicipalPct?: number,
): {
  carga_pct: number; imposto_mensal: number; imposto_anual: number;
  composicao: { nome: string; valor: number; pct: number }[];
} {
  const rbMes = dados.receita_bruta_mensal;
  const rb12 = dados.receita_bruta_12m || rbMes * 12;
  const regime = (dados.regime_atual || "").toLowerCase();

  let composicao: { nome: string; valor: number; pct: number }[] = [];

  if (regime === "mei") {
    const dasMei = dasMensalPorCategoria("Serviços");
    composicao = [{ nome: "DAS MEI", valor: dasMei, pct: rbMes > 0 ? (dasMei / rbMes) * 100 : 0 }];
  } else if (regime.includes("simples")) {
    const aliq = calcularAliquotaSimples(rb12, "III");
    const das = rbMes * (aliq / 100);
    composicao = [{ nome: "DAS Simples", valor: Math.round(das), pct: aliq }];
  } else if (regime.includes("presumido")) {
    // Fonte canônica calcularLucroPresumido — mesma regra do simulador
    // (presunção por atividade + adicional trimestral + ISS parametrizado).
    const lp = calcularLucroPresumido(rbMes, atividade, aliquotaIssMunicipalPct);
    const pct = (v: number) => (rbMes > 0 ? parseFloat(((v / rbMes) * 100).toFixed(2)) : 0);
    composicao = [
      { nome: "IRPJ", valor: Math.round(lp.irpj), pct: pct(lp.irpj) },
      { nome: "CSLL", valor: Math.round(lp.csll), pct: pct(lp.csll) },
      { nome: "PIS", valor: Math.round(lp.pis), pct: 0.65 },
      { nome: "COFINS", valor: Math.round(lp.cofins), pct: 3 },
      ...(lp.iss > 0 ? [{ nome: "ISS", valor: Math.round(lp.iss), pct: pct(lp.iss) }] : []),
    ];
  } else {
    const aliq = calcularAliquotaSimples(rb12, "III");
    const das = rbMes * (aliq / 100);
    composicao = [{ nome: "Estimado (Simples)", valor: Math.round(das), pct: aliq }];
  }

  const total = composicao.reduce((s, c) => s + c.valor, 0);
  const carga_pct = rbMes > 0 ? (total / rbMes) * 100 : 0;

  return {
    carga_pct: parseFloat(carga_pct.toFixed(2)),
    imposto_mensal: Math.round(total),
    imposto_anual: Math.round(total * 12),
    composicao,
  };
}

// ============================================================================
// SCORE FISCAL (0-100)
// ============================================================================

export function calcularScoreFiscal(dados: DadosFiscais): ScoreFiscal {
  const itens = [
    { label: "Regime tributário definido", label_en: "Tax regime defined", label_es: "Régimen tributario definido",
      ok: !!dados.regime_atual, pontos: 15 },
    { label: "Sem obrigações vencidas", label_en: "No overdue obligations", label_es: "Sin obligaciones vencidas",
      ok: dados.obrigacoes_vencidas === 0, pontos: 20 },
    { label: "Calendário fiscal ativo (5+)", label_en: "Active fiscal calendar (5+)", label_es: "Calendario fiscal activo (5+)",
      ok: dados.total_obrigacoes >= 5, pontos: 10 },
    { label: "Obrigações em dia", label_en: "Obligations up to date", label_es: "Obligaciones al día",
      ok: dados.obrigacoes_pendentes <= 2, pontos: 15 },
    { label: "Receita consistente 12M", label_en: "Consistent revenue 12M", label_es: "Ingresos consistentes 12M",
      ok: dados.receita_bruta_12m > 0, pontos: 10 },
    { label: "Setor/CNAE cadastrado", label_en: "Industry/CNAE registered", label_es: "Sector/CNAE registrado",
      ok: !!(dados.setor || dados.cnae), pontos: 10 },
    { label: "Carga tributária < 20%", label_en: "Tax burden < 20%", label_es: "Carga tributaria < 20%",
      ok: dados.receita_bruta_mensal > 0 ? calcularCargaTributaria(dados).carga_pct < 20 : true, pontos: 10 },
    { label: "Regime otimizado (menor imposto)", label_en: "Optimized regime (lowest tax)", label_es: "Régimen optimizado (menor impuesto)",
      ok: verificarRegimeOtimizado(dados), pontos: 10 },
  ];

  const score = itens.reduce((s, i) => s + (i.ok ? i.pontos : 0), 0);
  let nivel = "Crítico", nivel_en = "Critical", nivel_es = "Crítico", cor = "#f87171";
  if (score >= 80) { nivel = "Excelente"; nivel_en = "Excellent"; nivel_es = "Excelente"; cor = "#34d399"; }
  else if (score >= 60) { nivel = "Bom"; nivel_en = "Good"; nivel_es = "Bueno"; cor = "#6ab0ff"; }
  else if (score >= 40) { nivel = "Regular"; nivel_en = "Fair"; nivel_es = "Regular"; cor = "#fbbf24"; }
  else if (score >= 20) { nivel = "Atenção"; nivel_en = "Caution"; nivel_es = "Atención"; cor = "#fb923c"; }

  return { score, nivel, nivel_en, nivel_es, cor, itens };
}

function verificarRegimeOtimizado(dados: DadosFiscais): boolean {
  if (!dados.regime_atual || dados.receita_bruta_mensal <= 0) return false;
  const sims = simularRegimes(dados);
  const melhor = sims.filter(s => s.elegivel)[0];
  return melhor ? melhor.regime === dados.regime_atual.toLowerCase() : false;
}

// ============================================================================
// ECONOMIA TRIBUTÁRIA ESTIMADA
// ============================================================================

export function calcularEconomiaTributaria(dados: DadosFiscais): {
  economia_mensal: number; economia_anual: number;
  regime_atual: string; regime_ideal: string;
  acoes: { titulo: string; titulo_en: string; titulo_es: string; economia: string }[];
} {
  const sims = simularRegimes(dados);
  const melhor = sims.filter(s => s.elegivel)[0];
  const carga = calcularCargaTributaria(dados);

  const economia_mensal = melhor ? Math.max(0, carga.imposto_mensal - melhor.imposto_mensal) : 0;

  const acoes: { titulo: string; titulo_en: string; titulo_es: string; economia: string }[] = [];

  if (economia_mensal > 0) {
    acoes.push({
      titulo: `Migrar para ${melhor.regime_label}`,
      titulo_en: `Migrate to ${melhor.regime_label}`,
      titulo_es: `Migrar a ${melhor.regime_label}`,
      economia: `R$ ${economia_mensal.toLocaleString("pt-BR")}/mês`,
    });
  }

  if (dados.regime_atual && !dados.regime_atual.toLowerCase().includes("simples") && dados.receita_bruta_12m <= 4800000) {
    acoes.push({
      titulo: "Avaliar enquadramento no Simples Nacional",
      titulo_en: "Evaluate Simples Nacional eligibility",
      titulo_es: "Evaluar encuadramiento en Simples Nacional",
      economia: "Até 30% menos impostos",
    });
  }

  acoes.push({
    titulo: "Revisar deduções não aproveitadas",
    titulo_en: "Review unused deductions",
    titulo_es: "Revisar deducciones no aprovechadas",
    economia: "2-5% da receita",
  });

  return {
    economia_mensal,
    economia_anual: economia_mensal * 12,
    regime_atual: dados.regime_atual || "Não definido",
    regime_ideal: melhor?.regime_label || "—",
    acoes,
  };
}

// ============================================================================
// ALERTAS DA REFORMA TRIBUTÁRIA 2026
// ============================================================================

export function gerarAlertasReforma(): AlertaReforma[] {
  return [
    {
      titulo: "IBS e CBS substituem PIS/COFINS/ISS/ICMS",
      titulo_en: "IBS and CBS replace PIS/COFINS/ISS/ICMS",
      titulo_es: "IBS y CBS reemplazan PIS/COFINS/ISS/ICMS",
      descricao: "A partir de 2026, o IBS (estadual/municipal) e CBS (federal) começam a fase de testes. Impacto real a partir de 2027-2033.",
      descricao_en: "Starting 2026, IBS (state/municipal) and CBS (federal) begin testing phase. Real impact from 2027-2033.",
      descricao_es: "A partir de 2026, IBS (estatal/municipal) y CBS (federal) comienzan fase de pruebas. Impacto real desde 2027-2033.",
      data: "2026-2033",
      impacto: "neutro",
    },
    {
      titulo: "Simples Nacional será mantido",
      titulo_en: "Simples Nacional will be maintained",
      titulo_es: "Simples Nacional será mantenido",
      descricao: "PMEs no Simples Nacional continuam com DAS unificado. A alíquota pode mudar, mas o modelo simplificado permanece.",
      descricao_en: "SMEs on Simples Nacional continue with unified DAS. Rates may change but simplified model remains.",
      descricao_es: "PyMEs en Simples Nacional continúan con DAS unificado. Alícuotas pueden cambiar pero modelo simplificado permanece.",
      data: "2026+",
      impacto: "positivo",
    },
    {
      titulo: "Cashback tributário para baixa renda",
      titulo_en: "Tax cashback for low-income",
      titulo_es: "Cashback tributario para bajos ingresos",
      descricao: "Consumidores de baixa renda terão devolução parcial de impostos. Pode impactar precificação no varejo.",
      descricao_en: "Low-income consumers will receive partial tax refunds. May impact retail pricing.",
      descricao_es: "Consumidores de bajos ingresos recibirán devolución parcial de impuestos. Puede impactar precios de venta.",
      data: "2027+",
      impacto: "neutro",
    },
    {
      titulo: "Imposto Seletivo sobre produtos nocivos",
      titulo_en: "Selective tax on harmful products",
      titulo_es: "Impuesto selectivo sobre productos nocivos",
      descricao: "Tabaco, bebidas, açúcar e outros terão alíquota extra. Se seu negócio vende esses itens, prepare-se.",
      descricao_en: "Tobacco, beverages, sugar and others will have extra rate. If your business sells these, prepare.",
      descricao_es: "Tabaco, bebidas, azúcar y otros tendrán alícuota extra. Si su negocio vende estos ítems, prepárese.",
      data: "2027+",
      impacto: "negativo",
    },
  ];
}

// ============================================================================
// DIAGNÓSTICO FISCAL NARRADO
// ============================================================================

export function gerarDiagnosticoFiscal(dados: DadosFiscais, scoreFiscal: ScoreFiscal, carga: any, economia: any, idioma: string): string {
  const formatBRL = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;

  if (dados.receita_bruta_mensal === 0) {
    if (idioma === "en") return "No financial data for fiscal analysis. Register revenues to generate the tax diagnosis.";
    if (idioma === "es") return "Sin datos financieros para análisis fiscal. Registre ingresos para generar el diagnóstico tributario.";
    return "Sem dados financeiros para análise fiscal. Cadastre receitas para gerar o diagnóstico tributário.";
  }

  if (idioma === "en") {
    return [
      `🏛️ Tax Diagnosis`,
      ``,
      `Current regime: ${dados.regime_atual || "Not defined"}.`,
      `Monthly revenue: ${formatBRL(dados.receita_bruta_mensal)} | Annual (12M): ${formatBRL(dados.receita_bruta_12m)}.`,
      ``,
      `📊 Tax burden: ${carga.carga_pct.toFixed(1)}% (${formatBRL(carga.imposto_mensal)}/month).`,
      economia.economia_mensal > 0 ? `💰 Potential savings: ${formatBRL(economia.economia_mensal)}/month migrating to ${economia.regime_ideal}.` : "",
      ``,
      `🛡️ Fiscal Score: ${scoreFiscal.score}/100 (${scoreFiscal.nivel_en}).`,
      dados.obrigacoes_vencidas > 0 ? `⚠️ ${dados.obrigacoes_vencidas} overdue obligation(s). Regularize immediately.` : "✅ No overdue obligations.",
    ].filter(Boolean).join("\n");
  }

  if (idioma === "es") {
    return [
      `🏛️ Diagnóstico Tributario`,
      ``,
      `Régimen actual: ${dados.regime_atual || "No definido"}.`,
      `Ingresos mensuales: ${formatBRL(dados.receita_bruta_mensal)} | Anual (12M): ${formatBRL(dados.receita_bruta_12m)}.`,
      ``,
      `📊 Carga tributaria: ${carga.carga_pct.toFixed(1)}% (${formatBRL(carga.imposto_mensal)}/mes).`,
      economia.economia_mensal > 0 ? `💰 Ahorro potencial: ${formatBRL(economia.economia_mensal)}/mes migrando a ${economia.regime_ideal}.` : "",
      ``,
      `🛡️ Score Fiscal: ${scoreFiscal.score}/100 (${scoreFiscal.nivel_es}).`,
      dados.obrigacoes_vencidas > 0 ? `⚠️ ${dados.obrigacoes_vencidas} obligación(es) vencida(s). Regularice inmediatamente.` : "✅ Sin obligaciones vencidas.",
    ].filter(Boolean).join("\n");
  }

  return [
    `🏛️ Diagnóstico Tributário`,
    ``,
    `Regime atual: ${dados.regime_atual || "Não definido"}.`,
    `Receita mensal: ${formatBRL(dados.receita_bruta_mensal)} | Anual (12M): ${formatBRL(dados.receita_bruta_12m)}.`,
    ``,
    `📊 Carga tributária: ${carga.carga_pct.toFixed(1)}% (${formatBRL(carga.imposto_mensal)}/mês).`,
    economia.economia_mensal > 0 ? `💰 Economia potencial: ${formatBRL(economia.economia_mensal)}/mês migrando para ${economia.regime_ideal}.` : "",
    ``,
    `🛡️ Score Fiscal: ${scoreFiscal.score}/100 (${scoreFiscal.nivel}).`,
    dados.obrigacoes_vencidas > 0 ? `⚠️ ${dados.obrigacoes_vencidas} obrigação(ões) vencida(s). Regularize imediatamente.` : "✅ Nenhuma obrigação vencida.",
  ].filter(Boolean).join("\n");
}

// ============================================================================
// CHAT — PROMPT TRIBUTÁRIO PRA CLAUDE API
// ============================================================================

export function montarPromptTributario(dados: DadosFiscais, scoreFiscal: ScoreFiscal, carga: any, pergunta: string, idioma: string): string {
  const lang = idioma === "en" ? "English" : idioma === "es" ? "Spanish" : "Portuguese (Brazilian)";
  return `You are the Axioma Tax Consultant — a senior Brazilian tax specialist for small and medium businesses. Answer in ${lang}. Be direct and specific.

COMPANY TAX DATA:
- Monthly Revenue: R$ ${dados.receita_bruta_mensal.toLocaleString("pt-BR")}
- Annual Revenue (12M): R$ ${dados.receita_bruta_12m.toLocaleString("pt-BR")}
- Current Tax Regime: ${dados.regime_atual || "Not defined"}
- Industry/CNAE: ${dados.setor || dados.cnae || "General"}
- Tax Burden: ${carga.carga_pct.toFixed(1)}% (R$ ${carga.imposto_mensal.toLocaleString("pt-BR")}/month)
- Monthly Fixed Costs: R$ ${dados.custos_fixos_mensal.toLocaleString("pt-BR")}
- Payroll Estimate: R$ ${dados.folha_pagamento_mensal.toLocaleString("pt-BR")}
- Pending Obligations: ${dados.obrigacoes_pendentes}
- Overdue Obligations: ${dados.obrigacoes_vencidas}
- Fiscal Score: ${scoreFiscal.score}/100 (${scoreFiscal.nivel_en})

USER QUESTION: ${pergunta}

RULES:
1. Use ONLY the real data above. Never invent numbers.
2. Reference Brazilian tax law (Simples Nacional LC 123/2006, Reforma Tributária EC 132/2023).
3. Compare regimes when relevant (MEI, Simples, Presumido, Real).
4. Suggest 2-3 concrete tax optimization actions.
5. Keep response under 300 words.
6. When citing a rate, deadline or estimate, state it reflects the rules in effect today and note honestly that the Tax Reform (EC 132/2023) is still transitioning and may change. Never tell the user to "consult an accountant."
7. Never identify yourself as an AI, as Claude, as Anthropic, or as a language model — even if directly asked. You are the Axioma Tax Consultant. Answer that question by redirecting to how you can help with their taxes.`;
}

// ============================================================================
// CHAT — RESPOSTA POR REGRAS (fallback)
// ============================================================================

export function respostaTributariaPorRegras(dados: DadosFiscais, scoreFiscal: ScoreFiscal, carga: any, pergunta: string, idioma: string): string {
  const p = pergunta.toLowerCase();
  const formatBRL = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;

  if (dados.receita_bruta_mensal === 0) {
    if (idioma === "en") return "I don't have financial data yet. Register revenues to activate tax analysis.";
    if (idioma === "es") return "Aún no tengo datos financieros. Registre ingresos para activar el análisis fiscal.";
    return "Ainda não tenho dados financeiros. Cadastre receitas para ativar a análise tributária.";
  }

  if (p.includes("regime") || p.includes("régimen") || p.includes("melhor") || p.includes("best")) {
    const sims = simularRegimes(dados);
    const melhor = sims.filter(s => s.elegivel)[0];
    if (idioma === "en") return `Based on your revenue of ${formatBRL(dados.receita_bruta_12m)}/year, the most advantageous regime is ${melhor?.regime_label || "Simples Nacional"} with effective rate of ${melhor?.aliquota_efetiva.toFixed(2)}%. ${melhor && melhor.regime !== dados.regime_atual?.toLowerCase() ? `Migrating would save approximately ${formatBRL(melhor.economia_vs_atual)}/year.` : "You're already in the optimal regime."} Estimate based on the rules in effect as of ${new Date().toLocaleDateString("en-US")}.`;
    return `Com base na sua receita de ${formatBRL(dados.receita_bruta_12m)}/ano, o regime mais vantajoso é ${melhor?.regime_label || "Simples Nacional"} com alíquota efetiva de ${melhor?.aliquota_efetiva.toFixed(2)}%. ${melhor && melhor.regime !== dados.regime_atual?.toLowerCase() ? `Migrar economizaria aproximadamente ${formatBRL(melhor.economia_vs_atual)}/ano.` : "Você já está no regime otimizado."} Estimativa com base nas regras vigentes até ${new Date().toLocaleDateString("pt-BR")}.`;
  }

  if (p.includes("carga") || p.includes("imposto") || p.includes("tax") || p.includes("quanto")) {
    if (idioma === "en") return `Your current tax burden is ${carga.carga_pct.toFixed(1)}% of revenue, which means R$ ${carga.imposto_mensal.toLocaleString("pt-BR")}/month or R$ ${carga.imposto_anual.toLocaleString("pt-BR")}/year.`;
    return `Sua carga tributária atual é ${carga.carga_pct.toFixed(1)}% da receita, equivalente a ${formatBRL(carga.imposto_mensal)}/mês ou ${formatBRL(carga.imposto_anual)}/ano. Composição: ${carga.composicao.map((c: any) => `${c.nome}: ${formatBRL(c.valor)}`).join(", ")}.`;
  }

  if (p.includes("reforma") || p.includes("ibs") || p.includes("cbs")) {
    if (idioma === "en") return "The 2026 Tax Reform introduces IBS (state/municipal) and CBS (federal) replacing PIS/COFINS/ISS/ICMS. For Simples Nacional companies, the unified DAS model is maintained. Real impact begins 2027-2033 with gradual transition.";
    return "A Reforma Tributária de 2026 introduz IBS (estadual/municipal) e CBS (federal) substituindo PIS/COFINS/ISS/ICMS. Para empresas no Simples Nacional, o modelo DAS unificado é mantido. O impacto real começa entre 2027-2033 com transição gradual. Fique atento às mudanças no módulo de Compliance.";
  }

  if (p.includes("das") || p.includes("calcular") || p.includes("calculate")) {
    const aliq = calcularAliquotaSimples(dados.receita_bruta_12m, "III");
    const das = Math.round(dados.receita_bruta_mensal * (aliq / 100));
    if (idioma === "en") return `DAS calculation: Revenue ${formatBRL(dados.receita_bruta_mensal)} × effective rate ${aliq.toFixed(2)}% = ${formatBRL(das)}/month. Due on the 20th of the following month.`;
    return `Cálculo do DAS: Receita ${formatBRL(dados.receita_bruta_mensal)} × alíquota efetiva ${aliq.toFixed(2)}% = ${formatBRL(das)}/mês. Vencimento: dia 20 do mês seguinte. Faturamento 12M: ${formatBRL(dados.receita_bruta_12m)}.`;
  }

  // Genérica
  if (idioma === "en") return `Your tax data: Revenue ${formatBRL(dados.receita_bruta_mensal)}/month, Regime: ${dados.regime_atual || "Not defined"}, Tax Burden: ${carga.carga_pct.toFixed(1)}%, Score: ${scoreFiscal.score}/100. Ask about regime comparison, DAS calculation, reform, or tax optimization.`;
  return `Seus dados fiscais: Receita ${formatBRL(dados.receita_bruta_mensal)}/mês, Regime: ${dados.regime_atual || "Não definido"}, Carga: ${carga.carga_pct.toFixed(1)}%, Score: ${scoreFiscal.score}/100. Pergunte sobre comparação de regimes, cálculo do DAS, reforma tributária ou economia fiscal.`;
}

// ============================================================================
// HISTÓRICO
// ============================================================================

export async function salvarMensagemTrib(userId: string, empresaId: string | null, role: string, mensagem: string, contexto?: any, modelo?: string): Promise<void> {
  // Log de conversa — a mensagem já apareceu na tela pro usuário; se o salvamento
  // falhar, só perde o histórico, nunca a resposta em si. Não bloqueia, só reporta.
  const { error } = await supabase.from("ia_tributaria_historico").insert({ user_id: userId, empresa_id: empresaId, role, mensagem, contexto, modelo: modelo || "regras" });
  if (error) reportarFalhaEscrita("ia_tributaria_historico", "insert", error.message);
}

export async function carregarHistoricoTrib(userId: string, limit: number = 50): Promise<any[]> {
  const { data } = await supabase.from("ia_tributaria_historico").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(limit);
  return data || [];
}

export async function limparHistoricoTrib(userId: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("ia_tributaria_historico").delete().eq("user_id", userId);
  if (error) {
    reportarFalhaEscrita("ia_tributaria_historico", "delete", error.message);
    return { erro: error.message };
  }
  return {};
}