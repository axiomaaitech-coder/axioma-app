// 🦅 AXIOMA AI.TECH - Centro de Custos Fase 2: Inteligência Executiva + Automação
// Regra de arquitetura: tudo aqui é LEITURA + CRUZAMENTO dos módulos de origem
// (Custos Fixos, Custos Variáveis, Contas a Pagar/Fornecedores, Receitas). Nenhuma
// função aqui recalcula ou sobrescreve números desses módulos — só interpreta.
// Escrita nova: só auditoria (Fase 1) e planos de ação (Fase 2).

import { createBrowserClient } from "@supabase/ssr";
import {
  detectarAnomaliasHistoricas, type AnomaliaHistorica, type Lancamento,
  detectarDesperdicio, type ItemDespesa,
  fBRL, normalizarTexto,
  type ItemCascata,
  simularCenariosExecutivos, type ChoqueSimulador, type ResultadoCenario,
} from "./cfoCore";
import {
  oportunidadesConsolidacao, precoAcimaMediaInterna, contratosVencendo,
  type FornecedorRow, type ContaPagarRow, type FornecedorContrato,
} from "./fornecedorHelpers";
import { type LancamentoOrigem, type OrigemTabela, type AuditoriaRow, primeiroRegistroAuditoria } from "./centroCustoHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type CentroLeve = { id: string; nome: string };
export type Lang = "pt" | "en" | "es";

const fmtData = (iso: string) => iso ? new Date(iso).toLocaleDateString("pt-BR") : "";

// ============================================================================
// ESCOPO A — MOTOR DE CAUSA RAIZ
// ============================================================================

export type CausaRaizItem = {
  id: string; tabela: OrigemTabela; origemId: string;
  descricao: string; categoria?: string; centroId: string | null; centroNome: string;
  fornecedorNome?: string; tipo: AnomaliaHistorica["tipo"];
  valorAtual: number; valorReferencia: number; impacto: number;
  quando: string; autor: string; explicacao: string;
};

function montarExplicacaoCausaRaiz(a: AnomaliaHistorica, lang: Lang, centroNome?: string, fornecedorNome?: string): string {
  if (a.tipo === "acima_media") {
    const pct = a.valorReferencia > 0 ? (((a.valorAtual / a.valorReferencia) - 1) * 100).toFixed(0) : "0";
    if (lang === "en") {
      const where = centroNome ? ` in center ${centroNome}` : "";
      const who = fornecedorNome ? `, supplier ${fornecedorNome}` : "";
      return `"${a.descricao}"${where}${who} came in at ${fBRL(a.valorAtual)} — ${pct}% above its historical average (${fBRL(a.valorReferencia)}). Impact: ${fBRL(a.impacto)}.`;
    }
    if (lang === "es") {
      const donde = centroNome ? ` en el centro ${centroNome}` : "";
      const quien = fornecedorNome ? `, proveedor ${fornecedorNome}` : "";
      return `"${a.descricao}"${donde}${quien} llegó a ${fBRL(a.valorAtual)} — ${pct}% por encima del promedio histórico (${fBRL(a.valorReferencia)}). Impacto: ${fBRL(a.impacto)}.`;
    }
    const onde = centroNome ? ` no centro ${centroNome}` : "";
    const quem = fornecedorNome ? `, fornecedor ${fornecedorNome}` : "";
    return `"${a.descricao}"${onde}${quem} veio ${fBRL(a.valorAtual)} — ${pct}% acima da média histórica (${fBRL(a.valorReferencia)}). Impacto: ${fBRL(a.impacto)}.`;
  }
  if (lang === "en") {
    const where = centroNome ? ` in center ${centroNome}` : "";
    const who = fornecedorNome ? `, supplier ${fornecedorNome}` : "";
    return `"${a.descricao}"${where}${who} rose in 3 consecutive entries, from ${fBRL(a.valorReferencia)} to ${fBRL(a.valorAtual)}. Accumulated impact: ${fBRL(a.impacto)}.`;
  }
  if (lang === "es") {
    const donde = centroNome ? ` en el centro ${centroNome}` : "";
    const quien = fornecedorNome ? `, proveedor ${fornecedorNome}` : "";
    return `"${a.descricao}"${donde}${quien} subió en 3 movimientos seguidos, de ${fBRL(a.valorReferencia)} a ${fBRL(a.valorAtual)}. Impacto acumulado: ${fBRL(a.impacto)}.`;
  }
  const onde = centroNome ? ` no centro ${centroNome}` : "";
  const quem = fornecedorNome ? `, fornecedor ${fornecedorNome}` : "";
  return `"${a.descricao}"${onde}${quem} subiu em 3 lançamentos seguidos, de ${fBRL(a.valorReferencia)} para ${fBRL(a.valorAtual)}. Impacto acumulado: ${fBRL(a.impacto)}.`;
}

const SEM_CENTRO: Record<Lang, string> = { pt: "Sem centro atribuído", en: "No center assigned", es: "Sin centro asignado" };
const AUTOR_NAO_REGISTRADO: Record<Lang, string> = {
  pt: "Autor não registrado (lançamento anterior à auditoria)",
  en: "Author not recorded (entry predates the audit trail)",
  es: "Autor no registrado (movimiento anterior a la auditoría)",
};
const REGISTRADO_EM: Record<Lang, string> = { pt: "Registrado em", en: "Recorded on", es: "Registrado el" };

// Só Custos Variáveis e Contas a Pagar têm série temporal própria (Custos Fixos é
// 1 linha recorrente, sem histórico de variação a comparar).
export function analisarCausaRaiz(
  origens: LancamentoOrigem[], auditoria: AuditoriaRow[], centros: CentroLeve[], fornecedores: CentroLeve[], lang: Lang = "pt",
): CausaRaizItem[] {
  const elegiveis = origens.filter(o => o.tabela !== "custos_fixos" && o.data);
  const itens: Lancamento[] = elegiveis.map(o => ({ valor: o.valor, data: o.data, categoria: o.categoria, descricao: o.descricao }));
  const anomalias = detectarAnomaliasHistoricas(itens);

  return anomalias.map(a => {
    const grupo = elegiveis.filter(o => normalizarTexto(o.descricao) === normalizarTexto(a.descricao)).sort((x, y) => y.data.localeCompare(x.data));
    const recente = grupo[0];
    const centro = centros.find(c => c.id === recente?.centro_custo_id);
    const fornecedor = recente?.fornecedor_id ? fornecedores.find(f => f.id === recente.fornecedor_id) : undefined;
    const registro = recente ? primeiroRegistroAuditoria(auditoria, recente.tabela, recente.id) : null;
    const autor = registro ? `${REGISTRADO_EM[lang]} ${fmtData(registro.created_at)}` : AUTOR_NAO_REGISTRADO[lang];
    return {
      id: `${recente?.tabela || "custos_variaveis"}:${recente?.id || ""}`, tabela: recente?.tabela || "custos_variaveis", origemId: recente?.id || "",
      descricao: a.descricao, categoria: a.categoria, centroId: centro?.id || null, centroNome: centro?.nome || SEM_CENTRO[lang],
      fornecedorNome: fornecedor?.nome, tipo: a.tipo, valorAtual: a.valorAtual, valorReferencia: a.valorReferencia, impacto: a.impacto,
      quando: recente?.data || "", autor, explicacao: montarExplicacaoCausaRaiz(a, lang, centro?.nome, fornecedor?.nome),
    };
  }).sort((x, y) => y.impacto - x.impacto);
}

// ============================================================================
// ESCOPO B — MOTOR DE OPORTUNIDADES
// ============================================================================

export type TipoOportunidade = "consolidacao" | "preco_alto" | "contrato_vencido" | "duplicado" | "assinatura_esquecida" | "centro_ocioso" | "margem_negativa";

export type Oportunidade = {
  id: string; tipo: TipoOportunidade; titulo: string; descricao: string;
  economiaEstimada: number; centroId?: string | null; centroNome?: string; fornecedorNome?: string;
};

export function identificarOportunidades(p: {
  fornecedores: FornecedorRow[]; contasPagar: ContaPagarRow[]; contratos: FornecedorContrato[];
  custosFixos: LancamentoOrigem[]; custosVariaveis: LancamentoOrigem[];
  centros: CentroLeve[]; custosPorCentro: Record<string, number>; receitasPorCentro: Record<string, number>;
  lang?: Lang;
}): Oportunidade[] {
  const lang = p.lang || "pt";
  const out: Oportunidade[] = [];

  oportunidadesConsolidacao(p.fornecedores, p.contasPagar).forEach(g => {
    if (g.economiaEstimada > 0) out.push({
      id: `consolidacao:${g.categoria}`, tipo: "consolidacao",
      titulo: lang === "en" ? `Consolidate ${g.categoria} suppliers` : lang === "es" ? `Consolidar proveedores de ${g.categoria}` : `Consolidar fornecedores de ${g.categoria}`,
      descricao: lang === "en"
        ? `${g.fornecedores.length} active suppliers in ${g.categoria}. Concentrating on the one with the lowest average ticket, the estimated savings is ${fBRL(g.economiaEstimada)}.`
        : lang === "es"
        ? `${g.fornecedores.length} proveedores activos en ${g.categoria}. Concentrando en el de menor ticket promedio, el ahorro estimado es ${fBRL(g.economiaEstimada)}.`
        : `${g.fornecedores.length} fornecedores ativos em ${g.categoria}. Concentrando no de menor ticket médio, a economia estimada é ${fBRL(g.economiaEstimada)}.`,
      economiaEstimada: g.economiaEstimada,
    });
  });

  precoAcimaMediaInterna(p.fornecedores, p.contasPagar, 20).forEach(f => {
    out.push({
      id: `preco_alto:${f.id}`, tipo: "preco_alto",
      titulo: lang === "en" ? `${f.nome} is ${f.percentualAcima.toFixed(0)}% above the ${f.categoria} average` : lang === "es" ? `${f.nome} está ${f.percentualAcima.toFixed(0)}% por encima del promedio de ${f.categoria}` : `${f.nome} está ${f.percentualAcima.toFixed(0)}% acima da média de ${f.categoria}`,
      descricao: lang === "en"
        ? `Average ticket of ${fBRL(f.ticketMedio)} versus ${fBRL(f.mediaGrupo)} from other suppliers in the same category.`
        : lang === "es"
        ? `Ticket promedio de ${fBRL(f.ticketMedio)} frente a ${fBRL(f.mediaGrupo)} de los demás proveedores de la misma categoría.`
        : `Ticket médio de ${fBRL(f.ticketMedio)} contra ${fBRL(f.mediaGrupo)} dos demais fornecedores da mesma categoria.`,
      economiaEstimada: Math.max(0, f.ticketMedio - f.mediaGrupo), fornecedorNome: f.nome,
    });
  });

  const semDescricao = lang === "en" ? "Contract with no description on file." : lang === "es" ? "Contrato sin descripción registrada." : "Contrato sem descrição cadastrada.";
  const { vencidos, aVencer } = contratosVencendo(p.contratos, 30);
  vencidos.forEach(c => {
    const fornecedor = p.fornecedores.find(f => f.id === c.fornecedor_id);
    out.push({
      id: `contrato:${c.id}`, tipo: "contrato_vencido",
      titulo: (lang === "en" ? "Expired contract" : lang === "es" ? "Contrato vencido" : "Contrato vencido") + (fornecedor ? ` — ${fornecedor.nome}` : ""),
      descricao: c.descricao || semDescricao, economiaEstimada: 0, fornecedorNome: fornecedor?.nome,
    });
  });
  aVencer.forEach(c => {
    const fornecedor = p.fornecedores.find(f => f.id === c.fornecedor_id);
    out.push({
      id: `contrato:${c.id}`, tipo: "contrato_vencido",
      titulo: (lang === "en" ? "Contract expires within 30 days" : lang === "es" ? "Contrato vence en hasta 30 días" : "Contrato vence em até 30 dias") + (fornecedor ? ` — ${fornecedor.nome}` : ""),
      descricao: c.descricao || semDescricao, economiaEstimada: 0, fornecedorNome: fornecedor?.nome,
    });
  });

  const itensDespesa: ItemDespesa[] = [...p.custosFixos, ...p.custosVariaveis].map(o => ({ descricao: o.descricao, valor: o.valor, categoria: o.categoria }));
  const { alertas } = detectarDesperdicio(itensDespesa);
  alertas.filter(a => a.tipo === "duplicado").forEach((a, i) => {
    out.push({
      id: `duplicado:${i}:${normalizarTexto(a.descricao)}`, tipo: "duplicado",
      titulo: (lang === "en" ? "Possible duplicate entry: " : lang === "es" ? "Posible movimiento duplicado: " : "Possível lançamento duplicado: ") + a.descricao,
      descricao: lang === "en" ? "Two similar entries were found — confirm it isn't the same cost entered twice." : lang === "es" ? "Se encontraron dos movimientos parecidos — confirme si no es el mismo costo registrado dos veces." : "Dois lançamentos parecidos foram encontrados — confirme se não é o mesmo custo lançado duas vezes.",
      economiaEstimada: a.valorPotencial,
    });
  });

  p.custosFixos.filter(o => o.categoria === "Sistemas e assinaturas").forEach(o => {
    out.push({
      id: `assinatura:${o.id}`, tipo: "assinatura_esquecida",
      titulo: (lang === "en" ? "Review subscription: " : lang === "es" ? "Revisar suscripción: " : "Revisar assinatura: ") + o.descricao,
      descricao: lang === "en" ? "Recurring cost under Systems & Subscriptions — worth confirming it's still in use." : lang === "es" ? "Costo recurrente en Sistemas y Suscripciones — vale la pena confirmar si todavía se usa." : "Custo recorrente em Sistemas e Assinaturas — vale confirmar se ainda está em uso.",
      economiaEstimada: o.valor, centroId: o.centro_custo_id, centroNome: p.centros.find(c => c.id === o.centro_custo_id)?.nome,
    });
  });

  p.centros.forEach(c => {
    const custo = p.custosPorCentro[c.id] || 0;
    const receita = p.receitasPorCentro[c.id] || 0;
    if (custo < 50 && receita < 50) {
      out.push({
        id: `ocioso:${c.id}`, tipo: "centro_ocioso",
        titulo: lang === "en" ? `Center "${c.nome}" has no activity in the period` : lang === "es" ? `Centro "${c.nome}" sin actividad en el período` : `Centro "${c.nome}" sem atividade no período`,
        descricao: lang === "en" ? "No relevant cost or revenue tagged to this center in the selected period." : lang === "es" ? "Ningún costo o ingreso relevante asignado a este centro en el período seleccionado." : "Nenhum custo ou receita relevante etiquetado neste centro no período selecionado.",
        economiaEstimada: 0, centroId: c.id, centroNome: c.nome,
      });
    }
    if (receita > 0 && receita - custo < 0) {
      out.push({
        id: `margem_neg:${c.id}`, tipo: "margem_negativa",
        titulo: lang === "en" ? `Center "${c.nome}" has negative margin` : lang === "es" ? `Centro "${c.nome}" con margen negativo` : `Centro "${c.nome}" com margem negativa`,
        descricao: lang === "en" ? `Costs (${fBRL(custo)}) exceed revenue (${fBRL(receita)}) in the period.` : lang === "es" ? `Los costos (${fBRL(custo)}) superan el ingreso (${fBRL(receita)}) en el período.` : `Custos (${fBRL(custo)}) maiores que a receita (${fBRL(receita)}) no período.`,
        economiaEstimada: custo - receita, centroId: c.id, centroNome: c.nome,
      });
    }
  });

  return out.sort((a, b) => b.economiaEstimada - a.economiaEstimada);
}

// ============================================================================
// ESCOPO C — PRIORIZADOR EXECUTIVO
// ============================================================================

export type Urgencia = "alta" | "media" | "baixa";
export type Complexidade = "baixa" | "media" | "alta";

export type ItemPriorizado = {
  id: string; titulo: string; descricao: string; tipo: string;
  impacto: number; urgencia: Urgencia; complexidade: Complexidade;
  tempoEstimado: string; retornoEsperado: number; score: number;
  origem: "causa_raiz" | "oportunidade";
};

const URGENCIA_TIPO: Record<string, Urgencia> = {
  contrato_vencido: "alta", aumento_recorrente: "alta", acima_media: "media",
  preco_alto: "media", duplicado: "alta", consolidacao: "baixa",
  assinatura_esquecida: "baixa", centro_ocioso: "media", margem_negativa: "alta",
};
const COMPLEXIDADE_TIPO: Record<string, Complexidade> = {
  contrato_vencido: "media", aumento_recorrente: "media", acima_media: "baixa",
  preco_alto: "alta", duplicado: "baixa", consolidacao: "alta",
  assinatura_esquecida: "baixa", centro_ocioso: "media", margem_negativa: "alta",
};
const PESO_URGENCIA: Record<Urgencia, number> = { alta: 3, media: 2, baixa: 1 };
const PESO_COMPLEXIDADE: Record<Complexidade, number> = { baixa: 3, media: 2, alta: 1 };
const TEMPO_ESTIMADO: Record<Lang, Record<Complexidade, string>> = {
  pt: { baixa: "alguns dias", media: "2 a 4 semanas", alta: "1 a 3 meses" },
  en: { baixa: "a few days", media: "2 to 4 weeks", alta: "1 to 3 months" },
  es: { baixa: "unos días", media: "2 a 4 semanas", alta: "1 a 3 meses" },
};
const INVESTIGAR_AUMENTO: Record<Lang, string> = { pt: "Investigar aumento: ", en: "Investigate increase: ", es: "Investigar aumento: " };

export function priorizar(causas: CausaRaizItem[], oportunidades: Oportunidade[], lang: Lang = "pt"): ItemPriorizado[] {
  const deCausas: ItemPriorizado[] = causas.map(c => {
    const urgencia = URGENCIA_TIPO[c.tipo] || "media";
    const complexidade = COMPLEXIDADE_TIPO[c.tipo] || "media";
    return {
      id: c.id, titulo: INVESTIGAR_AUMENTO[lang] + c.descricao, descricao: c.explicacao, tipo: c.tipo,
      impacto: c.impacto, urgencia, complexidade, tempoEstimado: TEMPO_ESTIMADO[lang][complexidade],
      retornoEsperado: c.impacto, score: Math.max(1, c.impacto) * PESO_URGENCIA[urgencia] * PESO_COMPLEXIDADE[complexidade],
      origem: "causa_raiz",
    };
  });
  const deOportunidades: ItemPriorizado[] = oportunidades.map(o => {
    const urgencia = URGENCIA_TIPO[o.tipo] || "media";
    const complexidade = COMPLEXIDADE_TIPO[o.tipo] || "media";
    return {
      id: o.id, titulo: o.titulo, descricao: o.descricao, tipo: o.tipo,
      impacto: o.economiaEstimada, urgencia, complexidade, tempoEstimado: TEMPO_ESTIMADO[lang][complexidade],
      retornoEsperado: o.economiaEstimada, score: Math.max(1, o.economiaEstimada) * PESO_URGENCIA[urgencia] * PESO_COMPLEXIDADE[complexidade],
      origem: "oportunidade",
    };
  });
  return [...deCausas, ...deOportunidades].sort((a, b) => b.score - a.score);
}

// ============================================================================
// ESCOPO D — SIMULAÇÕES EXECUTIVAS COM EFEITO CASCATA
// ============================================================================

export type TipoCenarioExecutivo =
  | "reduzir_custos" | "expandir_equipe" | "abrir_filial" | "encerrar_centro"
  | "trocar_fornecedor" | "alterar_precos" | "renegociar_contratos" | "variar_inflacao" | "variar_cambio";

export type BaselineSimulacao = { receitaMensal: number; custoFixoMensal: number; custoVariavelMensal: number; caixaAtual: number; capitalGiroAtual: number };

export function montarChoqueExecutivo(
  tipo: TipoCenarioExecutivo, valorPct: number, baseline: BaselineSimulacao,
  centroSelecionado?: { custoFixoShare: number; custoVariavelShare: number },
): ChoqueSimulador {
  const zero: ChoqueSimulador = { receitaPct: 0, custoFixoPct: 0, custoVariavelPct: 0, jurosDividaPontos: 0, aporteCapital: 0, retornoMensalAporte: 0 };
  switch (tipo) {
    case "reduzir_custos": return { ...zero, custoFixoPct: -Math.abs(valorPct), custoVariavelPct: -Math.abs(valorPct) };
    case "expandir_equipe": return { ...zero, custoFixoPct: Math.abs(valorPct) };
    case "abrir_filial": return { ...zero, custoFixoPct: Math.abs(valorPct), receitaPct: Math.abs(valorPct) * 0.5 };
    case "encerrar_centro": {
      const cfPct = baseline.custoFixoMensal > 0 ? -((centroSelecionado?.custoFixoShare || 0) / baseline.custoFixoMensal) * 100 : 0;
      const cvPct = baseline.custoVariavelMensal > 0 ? -((centroSelecionado?.custoVariavelShare || 0) / baseline.custoVariavelMensal) * 100 : 0;
      return { ...zero, custoFixoPct: cfPct, custoVariavelPct: cvPct };
    }
    case "trocar_fornecedor": return { ...zero, custoVariavelPct: valorPct };
    case "alterar_precos": return { ...zero, receitaPct: valorPct };
    case "renegociar_contratos": return { ...zero, custoFixoPct: -Math.abs(valorPct) };
    case "variar_inflacao": return { ...zero, custoVariavelPct: Math.abs(valorPct), custoFixoPct: Math.abs(valorPct) };
    case "variar_cambio": return { ...zero, custoVariavelPct: valorPct };
    default: return zero;
  }
}

export type ResultadoCenarioExecutivo = ResultadoCenario & { margemPct: number; capitalGiroProjetado: number };

export function simularCenarioCascata(baseline: BaselineSimulacao, choque: ChoqueSimulador, horizonteMeses = 12): ResultadoCenarioExecutivo[] {
  const cenarios = simularCenariosExecutivos({
    receitaMensalAtual: baseline.receitaMensal, custoFixoMensalAtual: baseline.custoFixoMensal,
    custoVariavelMensalAtual: baseline.custoVariavelMensal, despesasFinanceirasMensalAtual: 0,
    dividaTotalAtual: 0, aliquotaEfetivaPct: 0, saldoCaixaAtual: baseline.caixaAtual, choque, horizonteMeses,
  });
  return cenarios.map(c => ({
    ...c,
    margemPct: c.receitaMensal > 0 ? (c.lucroLiquidoMensal / c.receitaMensal) * 100 : 0,
    capitalGiroProjetado: baseline.capitalGiroAtual + (c.saldoCaixaProjetado - baseline.caixaAtual),
  }));
}

// Mapa de Impacto (waterfall) — usa optCascata (mesmo motor da DRE) pra visualizar
// o efeito cascata do cenário "base" (o que o usuário configurou, sem o ajuste
// automático de otimismo/pessimismo que os outros 3 cenários recebem).
export function mapaDeImpacto(baseline: BaselineSimulacao, choque: ChoqueSimulador, resultadoBase: ResultadoCenarioExecutivo, lang: Lang = "pt"): ItemCascata[] {
  const custoVariavelSimulado = baseline.custoVariavelMensal * (1 + choque.custoVariavelPct / 100);
  const custoFixoSimulado = baseline.custoFixoMensal * (1 + choque.custoFixoPct / 100);
  const labels = lang === "en"
    ? { receita: "Revenue", custoVar: "Variable Cost", custoFixo: "Fixed Cost", lucro: "Net Profit" }
    : lang === "es"
    ? { receita: "Ingreso", custoVar: "Costo Variable", custoFixo: "Costo Fijo", lucro: "Utilidad Neta" }
    : { receita: "Receita", custoVar: "Custo Variável", custoFixo: "Custo Fixo", lucro: "Lucro Líquido" };
  return [
    { label: labels.receita, valor: resultadoBase.receitaMensal, tipo: "subtotal" },
    { label: labels.custoVar, valor: -custoVariavelSimulado, tipo: "variacao" },
    { label: labels.custoFixo, valor: -custoFixoSimulado, tipo: "variacao" },
    { label: "EBITDA", valor: resultadoBase.ebitdaMensal, tipo: "subtotal" },
    { label: labels.lucro, valor: resultadoBase.lucroLiquidoMensal, tipo: "subtotal" },
  ];
}

// ============================================================================
// ESCOPO E — ORÇAMENTO VIVO COM RE-FORECAST CONTÍNUO
// ============================================================================

export type ReforecastCentro = {
  centroId: string; centroNome: string; orcado: number; gastoAteAgora: number;
  projecaoFechamento: number; desvioProjetado: number; desvioPct: number;
  status: "dentro" | "atencao" | "estouro";
};

// dataReferencia deve ser "hoje" se o período selecionado é o mês corrente (projeta o
// resto do mês pelo ritmo até agora), ou o último dia do mês se o período já fechou
// (aí não é projeção, é o realizado).
export function reforecastOrcamento(
  centros: CentroLeve[], custosPorCentro: Record<string, number>, orcamentoPorCentro: (centroId: string) => number, dataReferencia: Date,
): ReforecastCentro[] {
  const diaAtual = Math.max(1, dataReferencia.getDate());
  const diasNoMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0).getDate();
  return centros.map(c => {
    const orcado = orcamentoPorCentro(c.id);
    const gastoAteAgora = custosPorCentro[c.id] || 0;
    const projecaoFechamento = (gastoAteAgora / diaAtual) * diasNoMes;
    const desvioProjetado = projecaoFechamento - orcado;
    const desvioPct = orcado > 0 ? (desvioProjetado / orcado) * 100 : 0;
    const status: ReforecastCentro["status"] = orcado <= 0 ? "dentro" : desvioPct > 10 ? "estouro" : desvioPct > 0 ? "atencao" : "dentro";
    return { centroId: c.id, centroNome: c.nome, orcado, gastoAteAgora, projecaoFechamento, desvioProjetado, desvioPct, status };
  }).filter(r => r.orcado > 0);
}

// ============================================================================
// SCORE DO MÓDULO — sempre explicável (cada dimensão vem com o número que a gerou)
// ============================================================================

export type DimensaoScoreCentro = { nome: string; score: number; peso: number; cor: string; detalhe: string };
export type ScoreCentroCusto = { total: number; nivel: "excelente" | "bom" | "atencao" | "critico"; cor: string; dimensoes: DimensaoScoreCentro[] };

export function calcularScoreCentroCusto(p: {
  centros: CentroLeve[]; custosPorCentro: Record<string, number>; orcamentoPorCentro: (centroId: string) => number;
  causaRaiz: CausaRaizItem[]; totalCustos: number; oportunidades: Oportunidade[]; idsComPlanoAcao: Set<string>;
  origensSemCentro: number; origensTotais: number; lang?: Lang;
}): ScoreCentroCusto {
  const lang = p.lang || "pt";
  const comOrcamento = p.centros.filter(c => p.orcamentoPorCentro(c.id) > 0);
  const dentroDoOrcamento = comOrcamento.filter(c => (p.custosPorCentro[c.id] || 0) <= p.orcamentoPorCentro(c.id));
  const scoreOrcamento = comOrcamento.length > 0 ? (dentroDoOrcamento.length / comOrcamento.length) * 100 : 100;

  const impactoTotal = p.causaRaiz.reduce((s, c) => s + Math.abs(c.impacto), 0);
  const scoreAnomalias = p.totalCustos > 0 ? Math.max(0, 100 - (impactoTotal / p.totalCustos) * 500) : 100;

  const capturadas = p.oportunidades.filter(o => p.idsComPlanoAcao.has(o.id)).length;
  const scoreOportunidades = p.oportunidades.length > 0 ? (capturadas / p.oportunidades.length) * 100 : 100;

  const scoreCobertura = p.origensTotais > 0 ? ((p.origensTotais - p.origensSemCentro) / p.origensTotais) * 100 : 100;

  const total = Math.round(scoreOrcamento * 0.30 + scoreAnomalias * 0.25 + scoreOportunidades * 0.25 + scoreCobertura * 0.20);
  const nivel: ScoreCentroCusto["nivel"] = total >= 80 ? "excelente" : total >= 60 ? "bom" : total >= 40 ? "atencao" : "critico";
  const cor = total >= 80 ? "#34d399" : total >= 60 ? "#6ab0ff" : total >= 40 ? "#f59e0b" : "#f87171";

  const nomes = {
    orcamentaria: { pt: "Disciplina Orçamentária", en: "Budget Discipline", es: "Disciplina Presupuestaria" },
    anomalias: { pt: "Causa Raiz / Anomalias", en: "Root Cause / Anomalies", es: "Causa Raíz / Anomalías" },
    oportunidades: { pt: "Oportunidades Capturadas", en: "Captured Opportunities", es: "Oportunidades Capturadas" },
    cobertura: { pt: "Cobertura de Atribuição", en: "Tagging Coverage", es: "Cobertura de Asignación" },
  };
  const dentroDoOrcTxt = lang === "en" ? `${dentroDoOrcamento.length}/${comOrcamento.length} centers within budget` : lang === "es" ? `${dentroDoOrcamento.length}/${comOrcamento.length} centros dentro del presupuesto` : `${dentroDoOrcamento.length}/${comOrcamento.length} centros dentro do orçamento`;
  const anomaliasTxt = lang === "en" ? `${p.causaRaiz.length} out-of-pattern increase(s) detected` : lang === "es" ? `${p.causaRaiz.length} aumento(s) fuera de lo normal detectado(s)` : `${p.causaRaiz.length} aumento(s) fora do padrão detectado(s)`;
  const oportunidadesTxt = lang === "en" ? `${capturadas}/${p.oportunidades.length} opportunities with an action plan` : lang === "es" ? `${capturadas}/${p.oportunidades.length} oportunidades con plan de acción` : `${capturadas}/${p.oportunidades.length} oportunidades com plano de ação`;
  const coberturaTxt = lang === "en" ? `${p.origensTotais - p.origensSemCentro}/${p.origensTotais} entries with a center assigned` : lang === "es" ? `${p.origensTotais - p.origensSemCentro}/${p.origensTotais} movimientos con centro asignado` : `${p.origensTotais - p.origensSemCentro}/${p.origensTotais} lançamentos com centro atribuído`;

  return {
    total, nivel, cor,
    dimensoes: [
      { nome: nomes.orcamentaria[lang], score: Math.round(scoreOrcamento), peso: 30, cor: "#a78bfa", detalhe: dentroDoOrcTxt },
      { nome: nomes.anomalias[lang], score: Math.round(scoreAnomalias), peso: 25, cor: "#f87171", detalhe: anomaliasTxt },
      { nome: nomes.oportunidades[lang], score: Math.round(scoreOportunidades), peso: 25, cor: "#34d399", detalhe: oportunidadesTxt },
      { nome: nomes.cobertura[lang], score: Math.round(scoreCobertura), peso: 20, cor: "#6ab0ff", detalhe: coberturaTxt },
    ],
  };
}

// ============================================================================
// ESCOPO F — CENTRAL DE INSIGHTS
// ============================================================================

export type CentralInsights = {
  maioresRiscos: ItemPriorizado[]; maioresOportunidades: Oportunidade[]; maioresDesperdicios: Oportunidade[];
  melhoresResultados: { centroId: string; centroNome: string; resultado: number }[];
  economiaPotencialTotal: number; prioridadesSemana: ItemPriorizado[]; prioridadesMes: ItemPriorizado[];
};

export function montarCentralInsights(p: {
  priorizados: ItemPriorizado[]; oportunidades: Oportunidade[];
  centros: CentroLeve[]; custosPorCentro: Record<string, number>; receitasPorCentro: Record<string, number>;
}): CentralInsights {
  const resultados = p.centros
    .map(c => ({ centroId: c.id, centroNome: c.nome, resultado: (p.receitasPorCentro[c.id] || 0) - (p.custosPorCentro[c.id] || 0) }))
    .sort((a, b) => b.resultado - a.resultado);

  const altaUrgencia = p.priorizados.filter(i => i.urgencia === "alta");
  const mediaUrgencia = p.priorizados.filter(i => i.urgencia === "media");

  return {
    maioresRiscos: p.priorizados.filter(i => i.origem === "causa_raiz").slice(0, 5),
    maioresOportunidades: [...p.oportunidades].sort((a, b) => b.economiaEstimada - a.economiaEstimada).slice(0, 5),
    maioresDesperdicios: p.oportunidades.filter(o => o.tipo === "duplicado" || o.tipo === "assinatura_esquecida").slice(0, 5),
    melhoresResultados: resultados.slice(0, 5),
    economiaPotencialTotal: p.oportunidades.reduce((s, o) => s + o.economiaEstimada, 0),
    prioridadesSemana: altaUrgencia.slice(0, 5),
    prioridadesMes: [...altaUrgencia, ...mediaUrgencia].slice(0, 5),
  };
}

// ============================================================================
// ESCOPO G — COPILOTO CFO (por regras — mesmo padrão de respostaPorRegras da IA Financeira)
// ============================================================================

export type ContextoCopiloto = {
  centros: CentroLeve[]; custosPorCentro: Record<string, number>; receitasPorCentro: Record<string, number>;
  orcamentoPorCentro: (centroId: string) => number; oportunidades: Oportunidade[]; score: ScoreCentroCusto; periodo: string; lang?: Lang;
};

export function respostaPorRegrasCentro(pergunta: string, ctx: ContextoCopiloto): string {
  const lang = ctx.lang || "pt";
  const q = normalizarTexto(pergunta);
  const fonte = lang === "en" ? ` (data from ${ctx.periodo})` : lang === "es" ? ` (datos de ${ctx.periodo})` : ` (dados de ${ctx.periodo})`;

  if (q.includes("consome mais caixa") || q.includes("maior custo") || q.includes("mais caro")
    || q.includes("consumes most cash") || q.includes("highest cost") || q.includes("most expensive")
    || q.includes("consume mas caja") || q.includes("mayor costo") || q.includes("mas caro")) {
    const ranking = ctx.centros.map(c => ({ nome: c.nome, custo: ctx.custosPorCentro[c.id] || 0 })).sort((a, b) => b.custo - a.custo);
    if (ranking.length === 0 || ranking[0].custo === 0) return lang === "en" ? `No center with cost recorded in the period${fonte}.` : lang === "es" ? `Ningún centro con costo registrado en el período${fonte}.` : `Nenhum centro com custo registrado no período${fonte}.`;
    return lang === "en" ? `The center that consumes the most cash is "${ranking[0].nome}", with ${fBRL(ranking[0].custo)}${fonte}.` : lang === "es" ? `El centro que más consume caja es "${ranking[0].nome}", con ${fBRL(ranking[0].custo)}${fonte}.` : `O centro que mais consome caixa é "${ranking[0].nome}", com ${fBRL(ranking[0].custo)}${fonte}.`;
  }
  if (q.includes("reduzir despesa") || q.includes("reduzir custo") || q.includes("cortar")
    || q.includes("reduce expense") || q.includes("reduce cost") || q.includes("cut cost")
    || q.includes("reducir gasto") || q.includes("reducir costo") || q.includes("recortar")) {
    if (ctx.oportunidades.length === 0) return lang === "en" ? `I didn't find any cost-reduction opportunities in the data${fonte}.` : lang === "es" ? `No encontré oportunidades de reducción de costo en los datos${fonte}.` : `Não encontrei oportunidades de redução de custo nos dados${fonte}.`;
    const top3 = [...ctx.oportunidades].sort((a, b) => b.economiaEstimada - a.economiaEstimada).slice(0, 3);
    const lista = top3.map(o => `${o.titulo} (${fBRL(o.economiaEstimada)})`).join("; ");
    return lang === "en" ? `The 3 biggest opportunities found: ${lista}${fonte}.` : lang === "es" ? `Las 3 mayores oportunidades identificadas: ${lista}${fonte}.` : `As 3 maiores oportunidades identificadas: ${lista}${fonte}.`;
  }
  if (q.includes("destroi margem") || q.includes("margem negativa") || q.includes("menos rentavel") || q.includes("projeto")
    || q.includes("destroys margin") || q.includes("negative margin") || q.includes("least profitable") || q.includes("project")
    || q.includes("destruye margen") || q.includes("margen negativo") || q.includes("menos rentable") || q.includes("proyecto")) {
    const negativos = ctx.centros
      .map(c => ({ nome: c.nome, resultado: (ctx.receitasPorCentro[c.id] || 0) - (ctx.custosPorCentro[c.id] || 0) }))
      .filter(c => c.resultado < 0).sort((a, b) => a.resultado - b.resultado);
    if (negativos.length === 0) return lang === "en" ? `No center with negative margin in the period${fonte}.` : lang === "es" ? `Ningún centro con margen negativo en el período${fonte}.` : `Nenhum centro com margem negativa no período${fonte}.`;
    return lang === "en" ? `"${negativos[0].nome}" destroys margin the most, with a result of ${fBRL(negativos[0].resultado)}${fonte}.` : lang === "es" ? `"${negativos[0].nome}" es el que más destruye margen, con un resultado de ${fBRL(negativos[0].resultado)}${fonte}.` : `"${negativos[0].nome}" é o que mais destrói margem, com resultado de ${fBRL(negativos[0].resultado)}${fonte}.`;
  }
  if (q.includes("dentro do orcamento") || q.includes("orcamento")
    || q.includes("within budget") || q.includes("budget")
    || q.includes("dentro del presupuesto") || q.includes("presupuesto")) {
    const comOrc = ctx.centros.filter(c => ctx.orcamentoPorCentro(c.id) > 0);
    const estourados = comOrc.filter(c => (ctx.custosPorCentro[c.id] || 0) > ctx.orcamentoPorCentro(c.id));
    if (comOrc.length === 0) return lang === "en" ? `No center has a budget defined yet.` : lang === "es" ? `Ningún centro tiene presupuesto definido todavía.` : `Nenhum centro tem orçamento definido ainda.`;
    if (estourados.length === 0) return lang === "en" ? `All ${comOrc.length} centers with a budget are within plan${fonte}.` : lang === "es" ? `Los ${comOrc.length} centros con presupuesto están dentro de lo previsto${fonte}.` : `Todos os ${comOrc.length} centros com orçamento estão dentro do previsto${fonte}.`;
    const nomes = estourados.map(c => c.nome).join(", ");
    return lang === "en" ? `${estourados.length} of ${comOrc.length} centers went over budget: ${nomes}${fonte}.` : lang === "es" ? `${estourados.length} de ${comOrc.length} centros superaron el presupuesto: ${nomes}${fonte}.` : `${estourados.length} de ${comOrc.length} centros estouraram o orçamento: ${nomes}${fonte}.`;
  }
  if (q.includes("score") || q.includes("saude") || q.includes("nota") || q.includes("health")) {
    const pior = [...ctx.score.dimensoes].sort((a, b) => a.score - b.score)[0];
    return lang === "en" ? `The module Score is ${ctx.score.total}/100 (${ctx.score.nivel}). Biggest attention point: ${pior.nome} (${pior.detalhe}).` : lang === "es" ? `El Score del módulo es ${ctx.score.total}/100 (${ctx.score.nivel}). Mayor punto de atención: ${pior.nome} (${pior.detalhe}).` : `O Score do módulo é ${ctx.score.total}/100 (${ctx.score.nivel}). Maior ponto de atenção: ${pior.nome} (${pior.detalhe}).`;
  }
  return lang === "en"
    ? `I can't answer that with rules yet. I can help with: which center consumes the most cash, how to reduce expenses, which center destroys margin, and whether spending is within budget.`
    : lang === "es"
    ? `Todavía no sé responder eso con reglas. Puedo ayudar con: qué centro consume más caja, cómo reducir gastos, qué centro destruye margen, y si los gastos están dentro del presupuesto.`
    : `Ainda não sei responder essa pergunta com regras. Posso responder sobre: qual centro consome mais caixa, como reduzir despesas, qual centro destrói margem, e se as despesas estão dentro do orçamento.`;
}

// ============================================================================
// ESCOPO H — PLANEJADOR DE AÇÕES (nunca executa nada sozinho — só registra o plano)
// ============================================================================

export type PlanoAcao = {
  id: string; user_id: string; centro_custo_id: string | null;
  origem_tipo: "causa_raiz" | "oportunidade" | "manual"; origem_id: string | null;
  titulo: string; objetivo: string | null; tarefas: string[] | null; responsavel: string | null; prazo: string | null;
  impacto_esperado: string | null; economia_estimada: number | null;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  created_at: string; updated_at: string;
};

export async function carregarPlanosAcao(userId: string): Promise<PlanoAcao[]> {
  const { data } = await supabase.from("centro_custo_plano_acao").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data || [];
}

export async function criarPlanoAcao(userId: string, plano: {
  centroId?: string | null; origemTipo: "causa_raiz" | "oportunidade" | "manual"; origemId?: string;
  titulo: string; objetivo?: string; tarefas?: string[]; responsavel?: string; prazo?: string;
  impactoEsperado?: string; economiaEstimada?: number;
}): Promise<{ erro?: string }> {
  const { error } = await supabase.from("centro_custo_plano_acao").insert({
    user_id: userId, centro_custo_id: plano.centroId || null, origem_tipo: plano.origemTipo, origem_id: plano.origemId || null,
    titulo: plano.titulo, objetivo: plano.objetivo || null, tarefas: plano.tarefas || null, responsavel: plano.responsavel || null,
    prazo: plano.prazo || null, impacto_esperado: plano.impactoEsperado || null, economia_estimada: plano.economiaEstimada ?? null,
  });
  return error ? { erro: error.message } : {};
}

export async function atualizarPlanoAcao(id: string, dados: Partial<{
  titulo: string; objetivo: string; tarefas: string[]; responsavel: string; prazo: string;
  impactoEsperado: string; economiaEstimada: number; status: PlanoAcao["status"];
}>): Promise<{ erro?: string }> {
  const payload: any = { updated_at: new Date().toISOString() };
  if (dados.titulo !== undefined) payload.titulo = dados.titulo;
  if (dados.objetivo !== undefined) payload.objetivo = dados.objetivo;
  if (dados.tarefas !== undefined) payload.tarefas = dados.tarefas;
  if (dados.responsavel !== undefined) payload.responsavel = dados.responsavel;
  if (dados.prazo !== undefined) payload.prazo = dados.prazo;
  if (dados.impactoEsperado !== undefined) payload.impacto_esperado = dados.impactoEsperado;
  if (dados.economiaEstimada !== undefined) payload.economia_estimada = dados.economiaEstimada;
  if (dados.status !== undefined) payload.status = dados.status;
  const { error } = await supabase.from("centro_custo_plano_acao").update(payload).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function excluirPlanoAcao(id: string): Promise<void> {
  await supabase.from("centro_custo_plano_acao").delete().eq("id", id);
}
