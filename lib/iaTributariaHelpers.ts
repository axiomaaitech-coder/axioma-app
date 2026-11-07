// 🦅 AXIOMA AI.TECH - Helpers IA Tributária
// Simulador de regime, Score Fiscal, carga tributária, economia estimada, reforma 2026.

import { fBRL2 } from "./cfoCore";
import { carregarBaseDRE, type BaseDRE } from "./dreCompetencia";
import { soVigentes } from "./custoFixoVigente";
import { createBrowserClient } from "./supabaseBrowser";
import * as Sentry from "@sentry/nextjs";
import { dasMensalPorCategoria, regraLimiteMEI } from "./meiHelpers";
import { isoDia } from "./datas";
import { registrarLeitura } from "./erroUiHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const r2 = (v: number) => Math.round(v * 100) / 100;

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
  lucro_bruto_mensal: number;
  regime_atual: string;
  categoria_mei?: string | null; // MEI: categoria (o DAS muda: Serviços, Comércio, Transporte...)
  atividade_fiscal?: string | null; // Config → Fiscal: define o anexo do Simples e a presunção
  aliquota_iss_pct?: number | null;
  setor: string;
  cnae: string;
  obrigacoes_pendentes: number;
  obrigacoes_vencidas: number;
  total_obrigacoes: number;
};

export type SimulacaoRegime = {
  parcial?: boolean; // comércio/indústria fora do Simples: falta ICMS/IPI, então não entra como "o melhor regime"
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
  const fim = isoDia(new Date(anoAtual, mesAtual, 0));
  // RBT12: os 12 meses anteriores ao mês corrente (LC 123/2006, art. 18). O mês em curso ainda está incompleto.
  const fimFechado = isoDia(new Date(anoAtual, mesAtual - 1, 0));
  const inicio12m = isoDia(new Date(anoAtual - 1, mesAtual - 1, 1));

  const [
    base,
    { data: custosFix, error: e3 },
    { data: empresa, error: e5 },
    { data: obrigacoes, error: e6 },
  ] = await Promise.all([
    // Mesma base da DRE: receitas, contas a receber por competência e vendas do PDV, sem contar duas vezes.
    empresaId ? carregarBaseDRE(empresaId, inicio12m, fim) : Promise.resolve({ receitas: [], custos: [], falhou: false } as Pick<BaseDRE, "receitas" | "custos" | "falhou">),
    empresaId ? soVigentes(supabase.from("custos_fixos").select("valor_mensal").eq("empresa_id", empresaId)) : Promise.resolve({ data: [], error: null }),
    empresaId ? supabase.from("empresas").select("regime_tributario, setor, cnae_principal, atividade_fiscal, aliquota_iss_pct, mei_dados(categoria_mei)").eq("id", empresaId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    empresaId ? supabase.from("empresa_obrigacoes").select("status, data_vencimento").eq("empresa_id", empresaId) : Promise.resolve({ data: [], error: null }),
  ]);

  // Leitura que falha lança erro: a tela avisa em vez de simular regime/economia com zero.
  if (base.falhou) throw new Error("[ia-tributaria] leitura da base da DRE falhou");
  // Obrigações também: sem esta leitura, a tela daria pontos por "sem obrigações vencidas" sem saber.
  const eLeitura = e3 || e5 || e6;
  if (eLeitura) throw new Error(`[ia-tributaria] leitura falhou: ${eLeitura.message}`);
  const somar = (ls: { valor: number }[]) => ls.reduce((t, l) => t + Number(l.valor || 0), 0);
  const recFechadas = base.receitas.filter((r) => r.data <= fimFechado);
  const custoFechado = base.custos.filter((r) => r.data <= fimFechado);
  // Empresa com menos de 12 meses: média dos meses desde a primeira receita, e RBT12 proporcional (LC 123/2006, art. 18, § 2º).
  // Sem nenhum mês fechado, o mês corrente é o único dado que existe.
  const semMesFechado = recFechadas.length === 0;
  const recBase = semMesFechado ? base.receitas : recFechadas;
  const custoBase = semMesFechado ? base.custos : custoFechado;
  const primeira = recBase.reduce((m, r) => (r.data < m ? r.data : m), fimFechado);
  const mesesBase = semMesFechado ? 1 : Math.min(12, (Number(fimFechado.slice(0, 4)) - Number(primeira.slice(0, 4))) * 12 + Number(fimFechado.slice(5, 7)) - Number(primeira.slice(5, 7)) + 1);
  const receita_bruta_mensal = somar(recBase) / mesesBase;
  const receita_bruta_12m = mesesBase >= 12 ? somar(recBase) : receita_bruta_mensal * 12;
  const custos_fixos_mensal = (custosFix || []).reduce((s, r) => s + Number(r.valor_mensal || 0), 0);
  const custos_variaveis_mensal = somar(custoBase) / mesesBase;
  const lucro_bruto_mensal = receita_bruta_mensal - custos_variaveis_mensal;

  const hojeStr = isoDia(hoje);
  const obrigLista = obrigacoes || [];
  const pendentes = obrigLista.filter((o: any) => o.status === "pendente");
  const vencidas = pendentes.filter((o: any) => o.data_vencimento && o.data_vencimento < hojeStr);

  return {
    receita_bruta_12m: r2(receita_bruta_12m),
    receita_bruta_mensal: r2(receita_bruta_mensal),
    custos_fixos_mensal: r2(custos_fixos_mensal),
    custos_variaveis_mensal: r2(custos_variaveis_mensal),
    lucro_bruto_mensal: r2(lucro_bruto_mensal),
    regime_atual: empresa?.regime_tributario || "",
    categoria_mei: categoriaMeiDaEmpresa(empresa),
    atividade_fiscal: (empresa as { atividade_fiscal?: string | null } | null)?.atividade_fiscal ?? null,
    aliquota_iss_pct: (empresa as { aliquota_iss_pct?: number | null } | null)?.aliquota_iss_pct ?? null,
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

// CSLL tem percentual próprio (Lei 9.249/95, art. 20): 12% no comércio/indústria, não os 8% do IRPJ.
export const PRESUNCAO_CSLL_POR_ATIVIDADE: Record<AtividadeFiscal, number> = {
  comercio_industria: 0.12,
  servicos: 0.32,
  revenda_combustivel: 0.12,
};
// LC 224/2025, art. 4º, § 5º: presunção 10% maior só na parte da receita acima de R$ 5 milhões no ano,
// proporcional ao período de apuração. Aqui o período é o mês. CSLL vale desde 01/04/2026, conforme a nonagesimal.
// ponytail: aplica a regra de hoje também a períodos antigos da tela; separar por data se a DRE de 2025 precisar da regra antiga.
const LIMITE_MENSAL_PRESUNCAO_MAIOR = 5000000 / 12;
const receitaComAcrescimoPresuncao = (rb: number) => Math.min(rb, LIMITE_MENSAL_PRESUNCAO_MAIOR) + Math.max(0, rb - LIMITE_MENSAL_PRESUNCAO_MAIOR) * 1.1;

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

  const receitaAjustada = receitaComAcrescimoPresuncao(rb);
  const basePresumida = receitaAjustada * PRESUNCAO_POR_ATIVIDADE[atividadeReal];
  const baseCsll = receitaAjustada * PRESUNCAO_CSLL_POR_ATIVIDADE[atividadeReal];
  const limiteMensalAdicional = 60000 / 3; // adicional de R$ 60 mil por trimestre, proporcional ao mês
  const irpj = basePresumida * 0.15 + (aplicarAdicionalTrimestral ? Math.max(0, basePresumida - limiteMensalAdicional) * 0.10 : 0);
  const csll = baseCsll * 0.09;
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

// Lucro Real: IRPJ e CSLL sobre o lucro do período. Sem o lucro à mão, usa a base da estimativa mensal da lei
// (Lei 9.430/96, art. 2º: mesmos percentuais de presunção). PIS/COFINS não cumulativos, sem descontar créditos.
export function calcularLucroReal(receitaMensal: number, lucroMensal?: number | null, atividade?: AtividadeFiscal, aliquotaIssMunicipalPct?: number) {
  const rb = Math.max(0, receitaMensal || 0);
  const atividadeReal = atividade || ATIVIDADE_FISCAL_DEFAULT;
  const baseIrpj = lucroMensal != null ? Math.max(0, lucroMensal) : rb * PRESUNCAO_POR_ATIVIDADE[atividadeReal];
  const baseCsll = lucroMensal != null ? Math.max(0, lucroMensal) : rb * PRESUNCAO_CSLL_POR_ATIVIDADE[atividadeReal];
  const irpj = baseIrpj * 0.15 + Math.max(0, baseIrpj - 20000) * 0.10;
  const csll = baseCsll * 0.09;
  const pis = rb * 0.0165;
  const cofins = rb * 0.076;
  const iss = atividadeReal === "servicos" ? rb * ((aliquotaIssMunicipalPct ?? ISS_MUNICIPAL_DEFAULT_PCT) / 100) : 0;
  const total = irpj + csll + pis + cofins + iss;
  return { base: baseIrpj, irpj, csll, pis, cofins, iss, total, aliquotaEfetivaPct: rb > 0 ? (total / rb) * 100 : 0 };
}

export function presuncaoDaAtividade(a: string | null | undefined): AtividadeFiscal | undefined {
  if (a === "comercio" || a === "industria") return "comercio_industria";
  if (a === "servico" || a === "misto") return "servicos"; // misto sem regra própria: base maior, a mais conservadora
  return undefined;
}

export type EmpresaFiscal = { regime_tributario?: string | null; atividade_fiscal?: string | null; aliquota_iss_pct?: number | null; mei_dados?: unknown };
export const COLUNAS_EMPRESA_FISCAL = "regime_tributario, atividade_fiscal, aliquota_iss_pct, mei_dados(categoria_mei)";

// Imposto da empresa pelo cadastro dela: toda tela usa esta conta, para nenhum módulo mostrar um imposto diferente de outro.
export function impostoDaEmpresa(e: EmpresaFiscal | null | undefined, rb12: number, rbMes: number, lucroMensal?: number | null): number {
  return calcularImpostoRegime(
    e?.regime_tributario || "", rb12, rbMes, presuncaoDaAtividade(e?.atividade_fiscal), e?.aliquota_iss_pct ?? undefined,
    categoriaMeiDaEmpresa(e), anexoSimplesDaAtividade(e?.atividade_fiscal).anexo, lucroMensal,
  );
}

// ============================================================================
// SIMULADOR DE REGIME TRIBUTÁRIO
// ============================================================================

export function simularRegimes(dados: DadosFiscais, atividadeInformada?: AtividadeFiscal, issInformado?: number): SimulacaoRegime[] {
  const atividade = atividadeInformada ?? presuncaoDaAtividade(dados.atividade_fiscal);
  const aliquotaIssMunicipalPct = issInformado ?? dados.aliquota_iss_pct ?? undefined;
  const anexoSimples = anexoSimplesDaAtividade(dados.atividade_fiscal).anexo;
  const lucroMensal = dados.lucro_bruto_mensal - dados.custos_fixos_mensal;
  // Comércio/indústria: Simples já traz ICMS no DAS; Presumido e Real não. Sem ICMS na conta, não comparar nem chamar de "economia".
  const semIcms = atividade === "comercio_industria";
  const AVISO_ICMS = { pt: " Não inclui ICMS/IPI, que variam por estado e produto.", en: " Does not include ICMS/IPI, which vary by state and product.", es: " No incluye ICMS/IPI, que varían por estado y producto." };
  const rb12 = dados.receita_bruta_12m || dados.receita_bruta_mensal * 12;
  const rbMes = dados.receita_bruta_mensal;
  const resultados: SimulacaoRegime[] = [];

  // Cálculo imposto atual (estimativa)
  const impostoAtual = calcularImpostoRegime(dados.regime_atual, rb12, rbMes, atividade, aliquotaIssMunicipalPct, dados.categoria_mei, anexoSimples, lucroMensal);

  // 1. MEI
  // Limite legal hoje é R$ 81 mil/ano (LIMITE_ANUAL_MEI). Antes dizia R$ 144K — recomendava
  // MEI pra quem não pode ser. R$ 130K é só proposta (PLP 108/2021), não vale ainda.
  const limiteMei = regraLimiteMEI(dados.categoria_mei, new Date().getFullYear()).anual; // caminhoneiro: R$ 251.600
  const meiElegivel = rb12 <= limiteMei;
  const meiMensal = dasMensalPorCategoria(dados.categoria_mei || "Serviços"); // fonte única: lib/meiHelpers.ts
  resultados.push({
    regime: "mei", regime_label: "MEI",
    imposto_mensal: r2(meiMensal),
    imposto_anual: r2(meiMensal * 12),
    aliquota_efetiva: rbMes > 0 ? parseFloat(((meiMensal / rbMes) * 100).toFixed(2)) : 0,
    economia_vs_atual: r2((impostoAtual - meiMensal) * 12),
    detalhamento: `DAS fixo R$ ${fBRL2(meiMensal)}/mês. Limite: R$ ${limiteMei.toLocaleString("pt-BR")}/ano. Até 1 funcionário.`,
    detalhamento_en: `Fixed DAS R$ ${fBRL2(meiMensal)}/month. Limit: R$ ${limiteMei.toLocaleString("en-US")}/year. Up to 1 employee.`,
    detalhamento_es: `DAS fijo R$ ${fBRL2(meiMensal)}/mes. Límite: R$ ${limiteMei.toLocaleString("es-ES")}/año. Hasta 1 empleado.`,
    elegivel: meiElegivel,
    motivo_inelegivel: meiElegivel ? undefined : `Faturamento acima de R$ ${limiteMei.toLocaleString("pt-BR")}/ano`,
  });

  // 2. Simples Nacional
  const simplesElegivel = rb12 <= 4800000;
  const simplesAliquota = calcularAliquotaSimples(rb12, anexoSimples);
  const simplesMensal = rbMes * (simplesAliquota / 100);
  resultados.push({
    regime: "simples", regime_label: "Simples Nacional",
    imposto_mensal: r2(simplesMensal),
    imposto_anual: r2(simplesMensal * 12),
    aliquota_efetiva: parseFloat(simplesAliquota.toFixed(2)),
    economia_vs_atual: r2((impostoAtual - simplesMensal) * 12),
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
    imposto_mensal: r2(lp.total),
    imposto_anual: r2(lp.total * 12),
    aliquota_efetiva: parseFloat(lp.aliquotaEfetivaPct.toFixed(2)),
    economia_vs_atual: semIcms ? 0 : r2((impostoAtual - lp.total) * 12), parcial: semIcms,
    detalhamento: `IRPJ ${fBRL2(lp.irpj)} + CSLL ${fBRL2(lp.csll)} + PIS ${fBRL2(lp.pis)} + COFINS ${fBRL2(lp.cofins)}${lp.iss > 0 ? ` + ISS ${fBRL2(lp.iss)}` : ""}. Presunção: ${lp.atividade === "servicos" ? "Serviços 32%" : lp.atividade === "comercio_industria" ? "Comércio/Indústria 8%" : "Revenda de combustível 1,6%"}${lp.atividadePresumida ? " (não confirmada — confirme a atividade da empresa)" : ""}.${semIcms ? AVISO_ICMS.pt : ""}`,
    detalhamento_en: `IRPJ ${fBRL2(lp.irpj)} + CSLL ${fBRL2(lp.csll)} + PIS ${fBRL2(lp.pis)} + COFINS ${fBRL2(lp.cofins)}${lp.iss > 0 ? ` + ISS ${fBRL2(lp.iss)}` : ""}. Presumption: ${lp.atividade === "servicos" ? "Services 32%" : lp.atividade === "comercio_industria" ? "Trade/Industry 8%" : "Fuel resale 1.6%"}${lp.atividadePresumida ? " (unconfirmed — confirm the company's activity)" : ""}.${semIcms ? AVISO_ICMS.en : ""}`,
    detalhamento_es: `IRPJ ${fBRL2(lp.irpj)} + CSLL ${fBRL2(lp.csll)} + PIS ${fBRL2(lp.pis)} + COFINS ${fBRL2(lp.cofins)}${lp.iss > 0 ? ` + ISS ${fBRL2(lp.iss)}` : ""}. Presunción: ${lp.atividade === "servicos" ? "Servicios 32%" : lp.atividade === "comercio_industria" ? "Comercio/Industria 8%" : "Reventa de combustible 1,6%"}${lp.atividadePresumida ? " (no confirmada — confirme la actividad de la empresa)" : ""}.${semIcms ? AVISO_ICMS.es : ""}`,
    elegivel: presumidoElegivel,
  });

  // 4. Lucro Real
  const lr = calcularLucroReal(rbMes, lucroMensal, atividade, aliquotaIssMunicipalPct);
  const realMensal = lr.total;
  const baseReal = lr.base;
  const aliqReal = lr.aliquotaEfetivaPct;
  resultados.push({
    regime: "real", regime_label: "Lucro Real",
    imposto_mensal: r2(realMensal),
    imposto_anual: r2(realMensal * 12),
    aliquota_efetiva: parseFloat(aliqReal.toFixed(2)),
    economia_vs_atual: semIcms ? 0 : r2((impostoAtual - realMensal) * 12), parcial: semIcms,
    detalhamento: `Base: lucro real R$ ${fBRL2(baseReal)}. PIS/COFINS não cumulativo, ainda sem descontar créditos.${semIcms ? AVISO_ICMS.pt : ""}`,
    detalhamento_en: `Base: actual profit R$ ${fBRL2(baseReal)}. Non-cumulative PIS/COFINS, before deducting credits.${semIcms ? AVISO_ICMS.en : ""}`,
    detalhamento_es: `Base: lucro real R$ ${fBRL2(baseReal)}. PIS/COFINS no acumulativo, sin descontar créditos todavía.${semIcms ? AVISO_ICMS.es : ""}`,
    elegivel: true,
  });

  // Primeiro o que pode ser escolhido e comparado; dentro disso, do menor imposto para o maior.
  return resultados.sort((a, b) => Number(!a.elegivel) - Number(!b.elegivel) || Number(!!a.parcial) - Number(!!b.parcial) || a.imposto_mensal - b.imposto_mensal);
}

// Exportada para reuso no DRE (calcula a dedução/imposto real da empresa a partir
// do regime tributário, em vez de um percentual fixo chutado).
export function calcularImpostoRegime(
  regime: string,
  rb12: number,
  rbMes: number,
  atividade?: AtividadeFiscal,
  aliquotaIssMunicipalPct?: number,
  categoriaMei?: string | null, // MEI: DAS da categoria (Serviços/Comércio/Indústria/Transporte...) — antes era sempre Serviços
  anexoSimples = "III",          // Simples: anexo pela atividade (anexoSimplesDaAtividade) — antes era sempre III
  lucroMensal?: number | null,   // Lucro Real: lucro do período; sem ele, a base da estimativa mensal da lei
): number {
  const r = (regime || "").toLowerCase();
  if (r === "mei") return dasMensalPorCategoria(categoriaMei || "Serviços");
  if (r.includes("simples")) {
    const aliq = calcularAliquotaSimples(rb12, anexoSimples);
    return rbMes * (aliq / 100);
  }
  // Fonte canônica calcularLucroPresumido — sem atividade/ISS informados
  // (nenhum dos ~14 chamadores desta função hoje tem isso disponível),
  // usa os mesmos defaults documentados (Serviços 32%, ISS 5%) que o
  // código antigo já assumia, mas agora com o adicional trimestral
  // aplicado corretamente e a mesma fórmula do simulador/carga real.
  if (r.includes("presumido")) return calcularLucroPresumido(rbMes, atividade, aliquotaIssMunicipalPct).total;
  if (r.includes("real")) return calcularLucroReal(rbMes, lucroMensal, atividade, aliquotaIssMunicipalPct).total;
  // Sem regime: estima como simples
  const aliq = calcularAliquotaSimples(rb12, anexoSimples);
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
    // Anexo II (indústria) — LC 123/2006, redação da LC 155/2016.
    "II": [
      { max: 180000, aliq: 4.5, ded: 0 }, { max: 360000, aliq: 7.8, ded: 5940 },
      { max: 720000, aliq: 10, ded: 13860 }, { max: 1800000, aliq: 11.2, ded: 22500 },
      { max: 3600000, aliq: 14.7, ded: 85500 }, { max: 4800000, aliq: 30, ded: 720000 },
    ],
    "III": [
      { max: 180000, aliq: 6, ded: 0 }, { max: 360000, aliq: 11.2, ded: 9360 },
      { max: 720000, aliq: 13.5, ded: 17640 }, { max: 1800000, aliq: 16, ded: 35640 },
      { max: 3600000, aliq: 21, ded: 125640 }, { max: 4800000, aliq: 33, ded: 648000 },
    ],
    // Anexo IV: limpeza, vigilância, obras. CPP é paga à parte e não está nesta alíquota.
    "IV": [
      { max: 180000, aliq: 4.5, ded: 0 }, { max: 360000, aliq: 9, ded: 8100 },
      { max: 720000, aliq: 10.2, ded: 12420 }, { max: 1800000, aliq: 14, ded: 39780 },
      { max: 3600000, aliq: 22, ded: 183780 }, { max: 4800000, aliq: 33, ded: 828000 },
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
  // Acima do teto a empresa sai do Simples; a conta segue a última faixa, com a parcela a deduzir, para não saltar de valor.
  const ultima = tabela[tabela.length - 1];
  return ((rb12 * ultima.aliq / 100) - ultima.ded) / rb12 * 100;
}

// ============================================================================
// CARGA TRIBUTÁRIA REAL
// ============================================================================

export function calcularCargaTributaria(
  dados: DadosFiscais,
  atividadeInformada?: AtividadeFiscal,
  issInformado?: number,
): {
  carga_pct: number; imposto_mensal: number; imposto_anual: number;
  composicao: { nome: string; valor: number; pct: number }[];
} {
  const rbMes = dados.receita_bruta_mensal;
  const rb12 = dados.receita_bruta_12m || rbMes * 12;
  const regime = (dados.regime_atual || "").toLowerCase();
  const atividade = atividadeInformada ?? presuncaoDaAtividade(dados.atividade_fiscal);
  const aliquotaIssMunicipalPct = issInformado ?? dados.aliquota_iss_pct ?? undefined;

  let composicao: { nome: string; valor: number; pct: number }[] = [];

  if (regime === "mei") {
    const dasMei = dasMensalPorCategoria(dados.categoria_mei || "Serviços");
    composicao = [{ nome: "DAS MEI", valor: dasMei, pct: rbMes > 0 ? (dasMei / rbMes) * 100 : 0 }];
  } else if (regime.includes("simples")) {
    const aliq = calcularAliquotaSimples(rb12, anexoSimplesDaAtividade(dados.atividade_fiscal).anexo);
    const das = rbMes * (aliq / 100);
    composicao = [{ nome: "DAS Simples", valor: r2(das), pct: aliq }];
  } else if (regime.includes("presumido")) {
    // Fonte canônica calcularLucroPresumido — mesma regra do simulador
    // (presunção por atividade + adicional trimestral + ISS parametrizado).
    const lp = calcularLucroPresumido(rbMes, atividade, aliquotaIssMunicipalPct);
    const pct = (v: number) => (rbMes > 0 ? parseFloat(((v / rbMes) * 100).toFixed(2)) : 0);
    composicao = [
      { nome: "IRPJ", valor: r2(lp.irpj), pct: pct(lp.irpj) },
      { nome: "CSLL", valor: r2(lp.csll), pct: pct(lp.csll) },
      { nome: "PIS", valor: r2(lp.pis), pct: 0.65 },
      { nome: "COFINS", valor: r2(lp.cofins), pct: 3 },
      ...(lp.iss > 0 ? [{ nome: "ISS", valor: r2(lp.iss), pct: pct(lp.iss) }] : []),
    ];
  } else if (regime.includes("real")) {
    const lr = calcularLucroReal(rbMes, dados.lucro_bruto_mensal - dados.custos_fixos_mensal, atividade, aliquotaIssMunicipalPct);
    const pct = (v: number) => (rbMes > 0 ? parseFloat(((v / rbMes) * 100).toFixed(2)) : 0);
    composicao = [
      { nome: "IRPJ", valor: r2(lr.irpj), pct: pct(lr.irpj) },
      { nome: "CSLL", valor: r2(lr.csll), pct: pct(lr.csll) },
      { nome: "PIS", valor: r2(lr.pis), pct: 1.65 },
      { nome: "COFINS", valor: r2(lr.cofins), pct: 7.6 },
      ...(lr.iss > 0 ? [{ nome: "ISS", valor: r2(lr.iss), pct: pct(lr.iss) }] : []),
    ];
  } else {
    const aliq = calcularAliquotaSimples(rb12, anexoSimplesDaAtividade(dados.atividade_fiscal).anexo);
    const das = rbMes * (aliq / 100);
    composicao = [{ nome: "Estimado (Simples)", valor: r2(das), pct: aliq }];
  }

  const total = composicao.reduce((s, c) => s + c.valor, 0);
  const carga_pct = rbMes > 0 ? (total / rbMes) * 100 : 0;

  return {
    carga_pct: parseFloat(carga_pct.toFixed(2)),
    imposto_mensal: r2(total),
    imposto_anual: r2(total * 12),
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
  const melhor = sims.filter(s => s.elegivel && !s.parcial)[0];
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
  const melhor = sims.filter(s => s.elegivel && !s.parcial)[0];
  const carga = calcularCargaTributaria(dados);

  const economia_mensal = melhor ? Math.max(0, carga.imposto_mensal - melhor.imposto_mensal) : 0;

  const acoes: { titulo: string; titulo_en: string; titulo_es: string; economia: string }[] = [];

  if (economia_mensal > 0) {
    acoes.push({
      titulo: `Migrar para ${melhor.regime_label}`,
      titulo_en: `Migrate to ${melhor.regime_label}`,
      titulo_es: `Migrar a ${melhor.regime_label}`,
      economia: `R$ ${fBRL2(economia_mensal)}/mês`,
    });
  }

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
      descricao: "Famílias de baixa renda inscritas no CadÚnico terão devolução de parte da CBS e do IBS (LC 214/2025). Pode impactar precificação no varejo.",
      descricao_en: "Low-income families registered in CadÚnico will get part of the CBS and IBS back (LC 214/2025). May impact retail pricing.",
      descricao_es: "Familias de bajos ingresos inscritas en el CadÚnico recibirán devolución de parte de la CBS y del IBS (LC 214/2025). Puede impactar los precios de venta.",
      data: "2027+",
      impacto: "neutro",
    },
    {
      titulo: "Imposto Seletivo sobre produtos nocivos",
      titulo_en: "Selective tax on harmful products",
      titulo_es: "Impuesto selectivo sobre productos nocivos",
      descricao: "Produtos fumígenos, bebidas alcoólicas e açucaradas, veículos e outros itens da LC 214/2025 terão alíquota extra (valor a ser fixado em lei ordinária). Se seu negócio vende esses itens, prepare-se.",
      descricao_en: "Tobacco products, alcoholic and sugary drinks, vehicles and other items in LC 214/2025 will carry an extra rate (amount to be set by ordinary law). If your business sells these items, prepare.",
      descricao_es: "Productos de tabaco, bebidas alcohólicas y azucaradas, vehículos y otros ítems de la LC 214/2025 tendrán alícuota extra (valor a fijar por ley ordinaria). Si su negocio vende estos ítems, prepárese.",
      data: "2027+",
      impacto: "negativo",
    },
  ];
}

// ============================================================================
// DIAGNÓSTICO FISCAL NARRADO
// ============================================================================

export function gerarDiagnosticoFiscal(dados: DadosFiscais, scoreFiscal: ScoreFiscal, carga: any, economia: any, idioma: string): string {
  const formatBRL = (n: number) => `R$ ${fBRL2(n)}`;

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
// CHAT — RESPOSTA POR REGRAS (fallback)
// ============================================================================

export function respostaTributariaPorRegras(dados: DadosFiscais, scoreFiscal: ScoreFiscal, carga: any, pergunta: string, idioma: string): string {
  const p = pergunta.toLowerCase();
  const formatBRL = (n: number) => `R$ ${fBRL2(n)}`;

  if (dados.receita_bruta_mensal === 0) {
    if (idioma === "en") return "I don't have financial data yet. Register revenues to activate tax analysis.";
    if (idioma === "es") return "Aún no tengo datos financieros. Registre ingresos para activar el análisis fiscal.";
    return "Ainda não tenho dados financeiros. Cadastre receitas para ativar a análise tributária.";
  }

  if (p.includes("regime") || p.includes("régimen") || p.includes("melhor") || p.includes("best")) {
    const sims = simularRegimes(dados);
    const melhor = sims.filter(s => s.elegivel && !s.parcial)[0];
    if (idioma === "en") return `Based on your revenue of ${formatBRL(dados.receita_bruta_12m)}/year, the most advantageous regime is ${melhor?.regime_label || "Simples Nacional"} with effective rate of ${melhor?.aliquota_efetiva.toFixed(2)}%. ${melhor && melhor.regime !== dados.regime_atual?.toLowerCase() ? `Migrating would save approximately ${formatBRL(melhor.economia_vs_atual)}/year.` : "You're already in the optimal regime."} Estimate based on the rules in effect as of ${new Date().toLocaleDateString("en-US")}.`;
    return `Com base na sua receita de ${formatBRL(dados.receita_bruta_12m)}/ano, o regime mais vantajoso é ${melhor?.regime_label || "Simples Nacional"} com alíquota efetiva de ${melhor?.aliquota_efetiva.toFixed(2)}%. ${melhor && melhor.regime !== dados.regime_atual?.toLowerCase() ? `Migrar economizaria aproximadamente ${formatBRL(melhor.economia_vs_atual)}/ano.` : "Você já está no regime otimizado."} Estimativa com base nas regras vigentes até ${new Date().toLocaleDateString("pt-BR")}.`;
  }

  if (p.includes("carga") || p.includes("imposto") || p.includes("tax") || p.includes("quanto")) {
    if (idioma === "en") return `Your current tax burden is ${carga.carga_pct.toFixed(1)}% of revenue, which means R$ ${fBRL2(carga.imposto_mensal)}/month or R$ ${fBRL2(carga.imposto_anual)}/year.`;
    return `Sua carga tributária atual é ${carga.carga_pct.toFixed(1)}% da receita, equivalente a ${formatBRL(carga.imposto_mensal)}/mês ou ${formatBRL(carga.imposto_anual)}/ano. Composição: ${carga.composicao.map((c: any) => `${c.nome}: ${formatBRL(c.valor)}`).join(", ")}.`;
  }

  if (p.includes("reforma") || p.includes("ibs") || p.includes("cbs")) {
    if (idioma === "en") return "The 2026 Tax Reform introduces IBS (state/municipal) and CBS (federal) replacing PIS/COFINS/ISS/ICMS. For Simples Nacional companies, the unified DAS model is maintained. Real impact begins 2027-2033 with gradual transition.";
    return "A Reforma Tributária de 2026 introduz IBS (estadual/municipal) e CBS (federal) substituindo PIS/COFINS/ISS/ICMS. Para empresas no Simples Nacional, o modelo DAS unificado é mantido. O impacto real começa entre 2027-2033 com transição gradual. Fique atento às mudanças no módulo de Compliance.";
  }

  if (p.includes("das") || p.includes("calcular") || p.includes("calculate")) {
    const aliq = calcularAliquotaSimples(dados.receita_bruta_12m, anexoSimplesDaAtividade(dados.atividade_fiscal).anexo);
    const das = r2(dados.receita_bruta_mensal * (aliq / 100));
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
  const data = await registrarLeitura(() => supabase.from("ia_tributaria_historico").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(limit), "iaTributariaHelpers:674");
  return data || [];
}

export async function limparHistoricoTrib(userId: string): Promise<{ erro?: string }> {
  // varredura:ok — erro checado e sobra conferida por contagem logo abaixo
  const { error } = await supabase.from("ia_tributaria_historico").delete().eq("user_id", userId);
  if (error) {
    reportarFalhaEscrita("ia_tributaria_historico", "delete", error.message);
    return { erro: error.message };
  }
  // 0 linhas apagadas pode ser histórico vazio (ok) ou RLS negando: confere se sobrou algo.
  const { count, error: eConf } = await supabase.from("ia_tributaria_historico").select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (eConf) { reportarFalhaEscrita("ia_tributaria_historico", "conferir limpeza", eConf.message); return { erro: eConf.message }; }
  if (count && count > 0) {
    reportarFalhaEscrita("ia_tributaria_historico", "delete", `${count} linha(s) continuam após limpar (RLS?)`);
    return { erro: "historico_nao_apagado" };
  }
  return {};
}
// Lê a categoria do MEI que vem embutida na leitura da empresa:
// supabase.from("empresas").select("regime_tributario, mei_dados(categoria_mei)").
export function categoriaMeiDaEmpresa(emp: unknown): string | null {
  const m = (emp as { mei_dados?: { categoria_mei?: string | null } | { categoria_mei?: string | null }[] | null } | null)?.mei_dados;
  const linha = Array.isArray(m) ? m[0] : m;
  return linha?.categoria_mei ?? null;
}

// Anexo do Simples pela atividade fiscal cadastrada (Config → Fiscal). Serviços pode ser
// III, IV ou V conforme o CNAE e o fator R; misto/sem cadastro também exigem validação.
export function anexoSimplesDaAtividade(atividade: string | null | undefined): { anexo: string; exigeValidacao: boolean } {
  if (atividade === "comercio") return { anexo: "I", exigeValidacao: false };
  if (atividade === "industria") return { anexo: "II", exigeValidacao: false };
  if (atividade === "servico") return { anexo: "III", exigeValidacao: true };
  return { anexo: "III", exigeValidacao: true };
}
