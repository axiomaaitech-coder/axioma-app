// ═══════════════════════════════════════════════════════════════
// AXIOMA AI.TECH — cfoCore.ts
// Núcleo de inteligência CFO. Funções puras, reutilizáveis por
// QUALQUER módulo e pelo Dashboard principal. Escrito uma vez.
// Sem dependência de React, Supabase ou UI — só cálculo.
// ═══════════════════════════════════════════════════════════════

export type Lancamento = {
  valor: number;
  data: string;        // ISO "YYYY-MM-DD"
  categoria?: string;
  status?: string;
  descricao?: string;
};

// ---------- FORMATADORES ----------
export const fBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);

export const fBRL2 = (n: number) =>
  (n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fK = (n: number) =>
  Math.abs(n) >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${Math.round(n)}`;

export const fPct = (n: number, casas = 1) => `${(n || 0).toFixed(casas)}%`;

export const mesesPt = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
export const mesesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const mesesEs = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const mesesPorLang = (lang: string) => lang === "en" ? mesesEn : lang === "es" ? mesesEs : mesesPt;

// ---------- SÉRIE MENSAL (12 meses do ano corrente) ----------
export function serieMensal(itens: Lancamento[], ano?: number): number[] {
  const y = ano ?? new Date().getFullYear();
  const serie = Array(12).fill(0);
  itens.forEach((it) => {
    if (!it.data) return;
    const d = new Date(it.data + "T00:00:00");
    if (d.getFullYear() === y) serie[d.getMonth()] += Number(it.valor) || 0;
  });
  return serie;
}

// Série dos últimos N meses (rolling), independente do ano.
// ateData opcional (ISO "YYYY-MM-DD") — permite ancorar em qualquer período
// selecionado, não só em "hoje". Sem ateData, comportamento igual a antes.
export function serieRolling(itens: Lancamento[], meses = 12, ateData?: string): { label: string; value: number }[] {
  const hoje = ateData ? new Date(ateData + "T00:00:00") : new Date();
  const buckets: { ano: number; mes: number; value: number }[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    buckets.push({ ano: d.getFullYear(), mes: d.getMonth(), value: 0 });
  }
  itens.forEach((it) => {
    if (!it.data) return;
    const d = new Date(it.data + "T00:00:00");
    const b = buckets.find((x) => x.ano === d.getFullYear() && x.mes === d.getMonth());
    if (b) b.value += Number(it.valor) || 0;
  });
  return buckets.map((b) => ({ label: mesesPt[b.mes], value: b.value }));
}

// ---------- CRESCIMENTO MÊS-A-MÊS ----------
export function crescimentoMoM(serie: number[], mesRef?: number): number {
  const m = mesRef ?? new Date().getMonth();
  const atual = serie[m] || 0;
  const anterior = m > 0 ? serie[m - 1] || 0 : 0;
  if (anterior <= 0) return 0;
  return ((atual - anterior) / anterior) * 100;
}

// ---------- TICKET MÉDIO ----------
export function ticketMedio(itens: Lancamento[]): number {
  if (!itens.length) return 0;
  return itens.reduce((a, r) => a + (Number(r.valor) || 0), 0) / itens.length;
}

// ---------- CONCENTRAÇÃO (top X% dos lançamentos = quanto % do total) ----------
export function concentracao(itens: Lancamento[], topPct = 0.2): number {
  const total = itens.reduce((a, r) => a + (Number(r.valor) || 0), 0);
  if (total <= 0) return 0;
  const ord = [...itens].sort((a, b) => (Number(b.valor) || 0) - (Number(a.valor) || 0));
  const n = Math.max(1, Math.ceil(ord.length * topPct));
  const soma = ord.slice(0, n).reduce((a, r) => a + (Number(r.valor) || 0), 0);
  return (soma / total) * 100;
}

// ---------- RECORRÊNCIA (% do total que vem de categoria(s) recorrente(s)) ----------
export function percentualRecorrente(itens: Lancamento[], categoriasRecorrentes: string[]): number {
  const total = itens.reduce((a, r) => a + (Number(r.valor) || 0), 0);
  if (total <= 0) return 0;
  const rec = itens.filter((r) => r.categoria && categoriasRecorrentes.includes(r.categoria)).reduce((a, r) => a + (Number(r.valor) || 0), 0);
  return (rec / total) * 100;
}

// ---------- MRR / ARR ----------
export function mrrArr(itens: Lancamento[], categoriasRecorrentes: string[]): { mrr: number; arr: number } {
  const arr = itens.filter((r) => r.categoria && categoriasRecorrentes.includes(r.categoria)).reduce((a, r) => a + (Number(r.valor) || 0), 0);
  return { mrr: arr / 12, arr };
}

// ---------- COMPOSIÇÃO POR CATEGORIA ----------
export function porCategoria(
  itens: Lancamento[],
  categorias: string[],
  cores: Record<string, string>
): { name: string; value: number; color: string }[] {
  return categorias
    .map((c) => ({
      name: c,
      value: itens.filter((r) => r.categoria === c).reduce((a, r) => a + (Number(r.valor) || 0), 0),
      color: cores[c] || "#8b5cf6",
    }))
    .filter((x) => x.value > 0);
}

// ---------- PREVISÃO IA (média móvel + tendência linear) ----------
// Núcleo reutilizável: projeta os próximos N valores a partir de qualquer série
// histórica já ordenada (mais antigo → mais recente), sem depender de calendário.
// Serve tanto pra serieMensal (ano corrente) quanto serieRolling (qualquer janela).
export function preverTendencia(serieHistorica: number[], horizonte = 3): number[] {
  const comDados = serieHistorica.filter((v) => v > 0);
  if (!comDados.length) return Array(horizonte).fill(0);
  const ultimos = comDados.slice(-3);
  const media = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
  const tendencia = comDados.length >= 2 ? (comDados[comDados.length - 1] - comDados[0]) / comDados.length : 0;
  return Array.from({ length: horizonte }, (_, i) => Math.max(0, media + tendencia * (i + 1)));
}

// Mantido por compatibilidade com módulos que já usam serieMensal (ano calendário atual)
export function preverProximosMeses(serie: number[], mesRef?: number, horizonte = 3): number[] {
  const m = mesRef ?? new Date().getMonth();
  return preverTendencia(serie.slice(0, m + 1), horizonte);
}

// ---------- INSIGHTS AUTOMÁTICOS ----------
export type Insight = { tipo: "alerta" | "positivo"; chave: string };

export function gerarInsights(params: {
  concentracao: number;
  crescimentoMoM: number;
  recorrenciaPct: number;
  temMesAnterior: boolean;
}): Insight[] {
  const out: Insight[] = [];
  const { concentracao, crescimentoMoM, recorrenciaPct, temMesAnterior } = params;
  if (concentracao > 70) out.push({ tipo: "alerta", chave: "alertaConcentracao" });
  if (crescimentoMoM < 0 && temMesAnterior) out.push({ tipo: "alerta", chave: "alertaQueda" });
  if (recorrenciaPct < 20) out.push({ tipo: "alerta", chave: "alertaRecorrencia" });
  if (crescimentoMoM > 5) out.push({ tipo: "positivo", chave: "positivoCrescimento" });
  if (recorrenciaPct >= 40) out.push({ tipo: "positivo", chave: "positivoRecorrencia" });
  return out;
}

// ---------- PALETA PADRÃO (alto luxo) ----------
export const CORES = {
  ouro: "#d4af37", ouroC: "#f0d878",
  roxo: "#8b5cf6", roxoC: "#c4b5fd",
  cyan: "#06b6d4", cyanC: "#67e8f9",
  verde: "#10b981", verdeC: "#6ee7b7",
  vermelho: "#ef4444", vermelhoC: "#fca5a5",
  laranja: "#f97316", laranjaC: "#fdba74",
  rosa: "#ec4899", rosaC: "#f9a8d4",
  azul: "#3b82f6", azulC: "#93c5fd",
  indigo: "#6366f1", teal: "#14b8a6", amarelo: "#eab308", amareloC: "#fde68a",
};

// ---------- OPTIONS ECharts REUTILIZÁVEIS ----------
const tipBase = {
  backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
  textStyle: { color: "#e2e8f0", fontSize: 13 },
  extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
};

// Barras verticais com gradiente + valor no topo
export function optBarrasV(dados: number[], labels: string[], cor: string, corC: string) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    tooltip: { ...tipBase, trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${corC}">${fBRL(p.value)}</b>` },
    xAxis: { type: "category", data: labels,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false },
      axisLabel: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [{
      type: "bar", barWidth: "58%",
      itemStyle: { borderRadius: [8, 8, 2, 2],
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corC }, { offset: 1, color: cor }] },
        shadowColor: cor + "55", shadowBlur: 12 },
      label: { show: true, position: "top", distance: 6, color: "#f1f5f9", fontSize: 9, fontWeight: 800, formatter: (p: any) => p.value > 0 ? fK(p.value) : "" },
      emphasis: { itemStyle: { shadowBlur: 24 } }, data: dados,
    }],
  };
}

// Rosca com total no centro
export function optRosca(dados: { name: string; value: number; color: string }[], cor: string, centro: string) {
  const total = dados.reduce((a, b) => a + b.value, 0);
  return {
    backgroundColor: "transparent", animationDuration: 1000,
    tooltip: { ...tipBase, trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b> <span style="color:${cor}">${p.percent}%</span>` },
    legend: { orient: "vertical", right: 4, top: "center", itemWidth: 11, itemHeight: 11, itemGap: 12, icon: "circle",
      textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 600 },
      formatter: (name: string) => { const d = dados.find((x) => x.name === name); const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0; return `${name.length > 14 ? name.slice(0, 13) + "…" : name}  ${pct}%`; } },
    series: [{ type: "pie", radius: ["54%", "80%"], center: ["32%", "52%"], avoidLabelOverlap: false,
      itemStyle: { borderColor: "rgba(10,8,32,0.95)", borderWidth: 3, borderRadius: 5 },
      label: { show: false }, labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 26 } },
      data: dados.map((d) => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })) }],
    graphic: [
      { type: "text", left: "32%", top: "45%", style: { text: fK(total), textAlign: "center", fill: "#f1f5f9", fontSize: 18, fontWeight: 900 }, z: 10 },
      { type: "text", left: "32%", top: "55%", style: { text: centro, textAlign: "center", fill: "#64748b", fontSize: 9, fontWeight: 700 }, z: 10 },
    ],
  };
}

// Linha realizado + previsão
export function optLinhaPrevisao(
  historico: (number | null)[], previsao: number[], labels: string[],
  labelReal: string, labelProj: string, corReal: string, corProj: string
) {
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 52, right: 16, top: 20, bottom: 28, containLabel: false },
    tooltip: { ...tipBase, trigger: "axis", borderColor: corProj,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.filter((p) => p.value != null).map((p) => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    legend: { top: 0, right: 0, itemWidth: 14, itemHeight: 9, itemGap: 14, textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 }, data: [labelReal, labelProj] },
    xAxis: { type: "category", boundaryGap: false, data: labels,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: labelReal, type: "line", smooth: true, symbol: "circle", symbolSize: 7,
        lineStyle: { width: 4, color: corReal, shadowColor: corReal + "80", shadowBlur: 12 },
        itemStyle: { color: corReal, borderColor: "#0a0820", borderWidth: 2 },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corReal + "55" }, { offset: 1, color: corReal + "00" }] } },
        data: historico },
      { name: labelProj, type: "line", smooth: true, symbol: "emptyCircle", symbolSize: 7,
        lineStyle: { width: 3, color: corProj, type: "dotted", shadowColor: corProj + "70", shadowBlur: 10 },
        itemStyle: { color: corProj, borderColor: "#0a0820", borderWidth: 2 },
        data: [...Array(Math.max(0, historico.filter((v) => v != null).length - 1)).fill(null), historico.filter((v) => v != null).slice(-1)[0], ...previsao] },
    ],
  };
}

// Linha multi-séries (ex: saldo devedor + amortização + juros / metas + realizado + projeção)
export function optLinhaMulti(
  series: { nome: string; dados: (number | null)[]; cor: string; tipo?: "solid" | "dashed" | "dotted"; area?: boolean }[],
  labels: string[], corBorda: string
) {
  return {
    backgroundColor: "transparent", animationDuration: 1100,
    grid: { left: 58, right: 24, top: 40, bottom: 30, containLabel: false },
    legend: { top: 2, right: 0, itemWidth: 16, itemHeight: 10, itemGap: 18, icon: "roundRect",
      textStyle: { color: "#cbd5e1", fontSize: 12, fontWeight: 700 }, data: series.map((s) => s.nome) },
    tooltip: { ...tipBase, trigger: "axis", borderColor: corBorda,
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.filter((p) => p.value != null).map((p) => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", boundaryGap: false, data: labels,
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.2)" } }, axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: series.map((s) => ({
      name: s.nome, type: "line", smooth: true,
      symbol: "circle", symbolSize: 7,
      lineStyle: { width: 3.5, color: s.cor, type: s.tipo === "dashed" ? "dashed" : s.tipo === "dotted" ? "dotted" : "solid", shadowColor: s.cor + "80", shadowBlur: 12 },
      itemStyle: { color: s.cor, borderColor: "#0a0820", borderWidth: 2 },
      ...(s.area ? { areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: s.cor + "55" }, { offset: 1, color: s.cor + "00" }] } } } : {}),
      data: s.dados,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// RADAR DE RENOVAÇÕES — detecta contratos/assinaturas próximos de renovar
// Reutilizável: custos fixos, fornecedores, assinaturas, e-commerce
// ═══════════════════════════════════════════════════════════════
export type ItemRenovavel = {
  descricao: string;
  valor: number;
  data_renovacao?: string | null; // ISO "YYYY-MM-DD"
  categoria?: string;
};

export type Renovacao = {
  descricao: string; valor: number; categoria?: string;
  data: string; diasRestantes: number;
  urgencia: "vencido" | "critico" | "proximo" | "futuro";
};

export function radarRenovacoes(itens: ItemRenovavel[], janelaDias = 60): Renovacao[] {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const out: Renovacao[] = [];
  itens.forEach((it) => {
    if (!it.data_renovacao) return;
    const d = new Date(it.data_renovacao + "T00:00:00");
    const dias = Math.round((d.getTime() - hoje.getTime()) / 86400000);
    if (dias > janelaDias) return;
    const urgencia: Renovacao["urgencia"] =
      dias < 0 ? "vencido" : dias <= 7 ? "critico" : dias <= 30 ? "proximo" : "futuro";
    out.push({ descricao: it.descricao, valor: it.valor, categoria: it.categoria, data: it.data_renovacao, diasRestantes: dias, urgencia });
  });
  return out.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

// ═══════════════════════════════════════════════════════════════
// DETECTOR DE DESPERDÍCIO — encontra duplicados e economia potencial
// A "medalha de ouro": nenhum ERP BR tem isso para PME
// ═══════════════════════════════════════════════════════════════
export type ItemDespesa = { descricao: string; valor: number; categoria?: string };
export type Desperdicio = {
  tipo: "duplicado" | "concentracao";
  descricao: string; valorPotencial: number;
};

// Normaliza texto p/ comparação (minúsculo, sem acento, sem espaços extras)
export function normalizarTexto(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}

export function detectarDesperdicio(itens: ItemDespesa[]): { alertas: Desperdicio[]; economiaPotencial: number } {
  const alertas: Desperdicio[] = [];
  let economia = 0;

  // 1) Duplicados: descrições muito parecidas (mesmo prefixo) OU mesma categoria+valor próximo
  const vistos: { chave: string; valor: number; descricao: string }[] = [];
  itens.forEach((it) => {
    const chave = normalizarTexto(it.descricao).slice(0, 12); // prefixo
    const dup = vistos.find((v) => v.chave === chave && chave.length >= 4);
    if (dup) {
      const menor = Math.min(dup.valor, it.valor);
      economia += menor;
      alertas.push({ tipo: "duplicado", descricao: it.descricao, valorPotencial: menor });
    } else {
      vistos.push({ chave, valor: it.valor, descricao: it.descricao });
    }
  });

  return { alertas, economiaPotencial: economia };
}

// Peso do custo sobre a receita (indicador de saúde) — em %
export function pesoSobreReceita(custoTotal: number, receitaTotal: number): number {
  if (receitaTotal <= 0) return 0;
  return (custoTotal / receitaTotal) * 100;
}

// ═══════════════════════════════════════════════════════════════
// MARGEM DE CONTRIBUIÇÃO / PONTO DE EQUILÍBRIO — reutilizável por
// Custos Variáveis, DRE, Precificação e Dashboard.
// ═══════════════════════════════════════════════════════════════

// Margem de contribuição: quanto sobra da receita depois do custo variável
export function margemContribuicao(receita: number, custoVariavel: number): { valor: number; pct: number } {
  const valor = receita - custoVariavel;
  const pct = receita > 0 ? (valor / receita) * 100 : 0;
  return { valor, pct };
}

// Ponto de equilíbrio (R$ de faturamento mínimo). Retorna null quando a margem
// de contribuição é zero ou negativa — nessa estrutura de custo não existe
// equilíbrio possível, é preciso revisar preço/custo antes de calcular.
export function pontoEquilibrio(custoFixoTotal: number, margemContribuicaoPct: number): number | null {
  if (margemContribuicaoPct <= 0) return null;
  return custoFixoTotal / (margemContribuicaoPct / 100);
}

// Margem de segurança: quanto a receita atual pode cair antes do prejuízo (%)
export function margemSeguranca(receitaAtual: number, pontoEquilibrioValor: number | null): number | null {
  if (pontoEquilibrioValor === null || receitaAtual <= 0) return null;
  return ((receitaAtual - pontoEquilibrioValor) / receitaAtual) * 100;
}

// Coeficiente de variação (desvio padrão / média, em %) — mede o quão instável
// é uma série de valores mês a mês. Quanto maior, menos previsível o custo.
export function coeficienteVariacao(serie: number[]): number {
  const vals = serie.filter((v) => v > 0);
  if (vals.length < 2) return 0;
  const media = vals.reduce((a, b) => a + b, 0) / vals.length;
  if (media <= 0) return 0;
  const variancia = vals.reduce((a, b) => a + Math.pow(b - media, 2), 0) / vals.length;
  return (Math.sqrt(variancia) / media) * 100;
}

// ═══════════════════════════════════════════════════════════════
// SELETOR DE PERÍODO — base reutilizável para comparativos, narrativa
// e projeção em qualquer módulo. Datas sempre ISO "YYYY-MM-DD".
// ═══════════════════════════════════════════════════════════════
export type PeriodoPreset = "mes_atual" | "mes_anterior" | "trimestre_atual" | "ano_atual" | "ultimos_12_meses" | "personalizado";
export type Periodo = { inicio: string; fim: string };

function isoData(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function resolverPeriodo(preset: PeriodoPreset, personalizado?: Periodo): Periodo {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = hoje.getMonth();
  switch (preset) {
    case "mes_atual":
      return { inicio: isoData(new Date(y, m, 1)), fim: isoData(new Date(y, m + 1, 0)) };
    case "mes_anterior":
      return { inicio: isoData(new Date(y, m - 1, 1)), fim: isoData(new Date(y, m, 0)) };
    case "trimestre_atual": {
      const qStart = m - (m % 3);
      return { inicio: isoData(new Date(y, qStart, 1)), fim: isoData(new Date(y, qStart + 3, 0)) };
    }
    case "ano_atual":
      return { inicio: isoData(new Date(y, 0, 1)), fim: isoData(new Date(y, 11, 31)) };
    case "ultimos_12_meses":
      return { inicio: isoData(new Date(y, m - 11, 1)), fim: isoData(new Date(y, m + 1, 0)) };
    case "personalizado":
      return personalizado ?? { inicio: isoData(new Date(y, m, 1)), fim: isoData(new Date(y, m + 1, 0)) };
  }
}

// Período anterior equivalente (mesma duração, imediatamente antes) — base do comparativo
export function periodoAnterior(periodo: Periodo): Periodo {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const duracaoDias = Math.round((fim.getTime() - ini.getTime()) / 86400000) + 1;
  const novoFim = new Date(ini.getTime() - 86400000);
  const novoIni = new Date(novoFim.getTime() - (duracaoDias - 1) * 86400000);
  return { inicio: isoData(novoIni), fim: isoData(novoFim) };
}

export function filtrarPorPeriodo(itens: Lancamento[], periodo: Periodo): Lancamento[] {
  return itens.filter((it) => it.data && it.data >= periodo.inicio && it.data <= periodo.fim);
}

// ═══════════════════════════════════════════════════════════════
// COMPARATIVO ENTRE PERÍODOS (variance analysis) — reutilizável
// por qualquer módulo que já tenha Lancamento[] filtrado por período.
// ═══════════════════════════════════════════════════════════════
export type ComparativoPeriodo = {
  atual: number; anterior: number; variacaoValor: number; variacaoPct: number;
  direcao: "alta" | "baixa" | "estavel";
};

function somaLancamentos(itens: Lancamento[]): number {
  return itens.reduce((a, r) => a + (Number(r.valor) || 0), 0);
}

export function compararPeriodos(itensAtual: Lancamento[], itensAnterior: Lancamento[]): ComparativoPeriodo {
  const atual = somaLancamentos(itensAtual);
  const anterior = somaLancamentos(itensAnterior);
  const variacaoValor = atual - anterior;
  const variacaoPct = anterior > 0 ? (variacaoValor / anterior) * 100 : atual > 0 ? 100 : 0;
  const direcao: ComparativoPeriodo["direcao"] = Math.abs(variacaoPct) < 1 ? "estavel" : variacaoValor > 0 ? "alta" : "baixa";
  return { atual, anterior, variacaoValor, variacaoPct, direcao };
}

export type ComparativoCategoria = { categoria: string; atual: number; anterior: number; variacaoValor: number; variacaoPct: number };

// Comparativo quebrado por categoria, ordenado pelo maior impacto (em módulo) —
// é o que permite a narrativa dizer QUAL categoria puxou a variação, nunca um número solto.
export function compararPeriodosPorCategoria(itensAtual: Lancamento[], itensAnterior: Lancamento[], categorias: string[]): ComparativoCategoria[] {
  return categorias
    .map((cat) => {
      const atual = somaLancamentos(itensAtual.filter((i) => i.categoria === cat));
      const anterior = somaLancamentos(itensAnterior.filter((i) => i.categoria === cat));
      const variacaoValor = atual - anterior;
      const variacaoPct = anterior > 0 ? (variacaoValor / anterior) * 100 : atual > 0 ? 100 : 0;
      return { categoria: cat, atual, anterior, variacaoValor, variacaoPct };
    })
    .filter((c) => c.atual > 0 || c.anterior > 0)
    .sort((a, b) => Math.abs(b.variacaoValor) - Math.abs(a.variacaoValor));
}

// ═══════════════════════════════════════════════════════════════
// ANOMALIAS HISTÓRICAS / PRICE CREEP — detecta item muito acima da
// própria média e aumentos silenciosos recorrentes (mesmo fornecedor
// subindo aos poucos). Reutiliza normalizarTexto do detector de desperdício.
// ═══════════════════════════════════════════════════════════════
export type AnomaliaHistorica = {
  tipo: "acima_media" | "aumento_recorrente";
  descricao: string; categoria?: string; valorAtual: number; valorReferencia: number; impacto: number;
};

export function detectarAnomaliasHistoricas(itens: Lancamento[]): AnomaliaHistorica[] {
  const grupos = new Map<string, { descricao: string; categoria?: string; ocorrencias: { valor: number; data: string }[] }>();
  itens.forEach((it) => {
    const chave = normalizarTexto(it.descricao || "");
    if (!chave) return;
    if (!grupos.has(chave)) grupos.set(chave, { descricao: it.descricao || "", categoria: it.categoria, ocorrencias: [] });
    grupos.get(chave)!.ocorrencias.push({ valor: Number(it.valor) || 0, data: it.data });
  });

  const anomalias: AnomaliaHistorica[] = [];
  grupos.forEach((g) => {
    if (g.ocorrencias.length < 2) return;
    const valores = [...g.ocorrencias].sort((a, b) => a.data.localeCompare(b.data)).map((o) => o.valor);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    const ultimo = valores[valores.length - 1];

    if (media > 0 && ultimo > media * 1.4) {
      anomalias.push({ tipo: "acima_media", descricao: g.descricao, categoria: g.categoria, valorAtual: ultimo, valorReferencia: media, impacto: ultimo - media });
    }

    if (valores.length >= 3) {
      const ultimas3 = valores.slice(-3);
      const subindoSempre = ultimas3[1] > ultimas3[0] && ultimas3[2] > ultimas3[1];
      if (subindoSempre) {
        anomalias.push({ tipo: "aumento_recorrente", descricao: g.descricao, categoria: g.categoria, valorAtual: ultimas3[2], valorReferencia: ultimas3[0], impacto: ultimas3[2] - ultimas3[0] });
      }
    }
  });

  return anomalias.sort((a, b) => b.impacto - a.impacto);
}

// ═══════════════════════════════════════════════════════════════
// TIPOGRAFIA PREMIUM — padrão executivo do Dashboard (Georgia serif)
// Usar em TODOS os títulos de painel e letreiros dos módulos.
// ═══════════════════════════════════════════════════════════════
export const FONTE_EXEC = { fontFamily: "'Georgia','Times New Roman',serif" };
export const FONTE_EXEC_TITULO = { fontFamily: "'Georgia','Times New Roman',serif", letterSpacing: "0.3px" };