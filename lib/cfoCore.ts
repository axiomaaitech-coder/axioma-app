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

// ═══════════════════════════════════════════════════════════════
// SÉRIE SEMANAL ROLANTE — base do "13 week cash flow", padrão de
// CFO profissional (Agicap/Float) que nenhum ERP nacional oferece
// pra PME. Semanas de segunda a domingo.
// ═══════════════════════════════════════════════════════════════
function inicioSemana(d: Date): Date {
  const dia = d.getDay(); // 0 = domingo
  const diff = (dia === 0 ? -6 : 1) - dia; // volta pra segunda-feira
  const seg = new Date(d);
  seg.setDate(d.getDate() + diff);
  seg.setHours(0, 0, 0, 0);
  return seg;
}

export type BucketSemanal = { label: string; inicio: string; fim: string; value: number };

export function serieSemanal(itens: Lancamento[], semanas = 13, ateData?: string): BucketSemanal[] {
  const hoje = ateData ? new Date(ateData + "T00:00:00") : new Date();
  const semanaAtual = inicioSemana(hoje);
  const buckets: { inicio: Date; fim: Date; value: number }[] = [];
  for (let i = semanas - 1; i >= 0; i--) {
    const ini = new Date(semanaAtual);
    ini.setDate(semanaAtual.getDate() - i * 7);
    const fim = new Date(ini);
    fim.setDate(ini.getDate() + 6);
    buckets.push({ inicio: ini, fim, value: 0 });
  }
  itens.forEach((it) => {
    if (!it.data) return;
    const d = new Date(it.data + "T00:00:00");
    const b = buckets.find((x) => d >= x.inicio && d <= x.fim);
    if (b) b.value += Number(it.valor) || 0;
  });
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return buckets.map((b) => ({ label: `${b.inicio.getDate()}/${b.inicio.getMonth() + 1}`, inicio: iso(b.inicio), fim: iso(b.fim), value: b.value }));
}

// ═══════════════════════════════════════════════════════════════
// DETECTOR DE RUPTURA DE CAIXA — projeta o saldo dia a dia a partir
// dos eventos previstos (entradas/saídas com data) e aponta a data
// exata em que o caixa ficaria negativo, se nada mudar. Nenhum ERP
// nacional pra PME entrega isso hoje.
// ═══════════════════════════════════════════════════════════════
export type EventoCaixa = { data: string; valor: number };
export type RupturaCaixa = { data: string; diasRestantes: number; saldoProjetado: number };

export function detectarRupturaCaixa(
  saldoAtual: number,
  entradasPrevistas: EventoCaixa[],
  saidasPrevistas: EventoCaixa[],
  horizonteDias = 90
): RupturaCaixa | null {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let saldo = saldoAtual;

  const eventos = [
    ...entradasPrevistas.map((e) => ({ data: new Date(e.data + "T00:00:00"), delta: Number(e.valor) || 0 })),
    ...saidasPrevistas.map((s) => ({ data: new Date(s.data + "T00:00:00"), delta: -(Number(s.valor) || 0) })),
  ]
    .filter((e) => e.data >= hoje)
    .sort((a, b) => a.data.getTime() - b.data.getTime());

  for (const ev of eventos) {
    const dias = Math.round((ev.data.getTime() - hoje.getTime()) / 86400000);
    if (dias > horizonteDias) break;
    saldo += ev.delta;
    if (saldo < 0) {
      return { data: ev.data.toISOString().slice(0, 10), diasRestantes: dias, saldoProjetado: saldo };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// DESVIO HISTÓRICO PREVISTO x REALIZADO — base pra cenários otimista
// /pessimista de verdade (baseados no comportamento real da própria
// empresa), em vez de uma margem fixa arbitrária.
// ═══════════════════════════════════════════════════════════════
export function desvioMedioPrevistoRealizado(itens: { valor: number; status?: string }[]): number {
  const previsto = itens.filter((i) => i.status === "previsto").reduce((a, r) => a + (Number(r.valor) || 0), 0);
  const realizado = itens.filter((i) => i.status === "realizado").reduce((a, r) => a + (Number(r.valor) || 0), 0);
  if (previsto <= 0) return 0;
  return ((realizado - previsto) / previsto) * 100;
}

// ═══════════════════════════════════════════════════════════════
// PROJEÇÃO DE SALDO SEMANAL COM CENÁRIOS — saldo acumulado semana a
// semana a partir de eventos previstos, com banda otimista/pessimista
// derivada do desvio histórico real da empresa. Reutilizável por
// Fluxo de Caixa, Dashboard (prévia) e DRE.
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// RECORRÊNCIA MENSAL — projeta ocorrências futuras de um item que se
// repete todo mês (custo fixo por dia de vencimento, parcela de dívida
// por data da próxima parcela). Base da auto-população do Fluxo de Caixa.
// ═══════════════════════════════════════════════════════════════
export function proximaOcorrenciaDoDia(dia: number): string {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  let d = new Date(hoje.getFullYear(), hoje.getMonth(), dia);
  if (d < hoje) d = new Date(hoje.getFullYear(), hoje.getMonth() + 1, dia);
  return d.toISOString().slice(0, 10);
}

export function projetarRecorrenciaMensal(valor: number, primeiraData: string, horizonteDias: number, maxOcorrencias?: number): EventoCaixa[] {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje); limite.setDate(hoje.getDate() + horizonteDias);
  const out: EventoCaixa[] = [];
  let d = new Date(primeiraData + "T00:00:00");
  let i = 0;
  while (d <= limite && (maxOcorrencias === undefined || i < maxOcorrencias)) {
    if (d >= hoje) out.push({ data: d.toISOString().slice(0, 10), valor });
    d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    i++;
  }
  return out;
}

export function projecaoSaldoComCenarios(
  saldoInicial: number,
  entradasPrevistas: EventoCaixa[],
  saidasPrevistas: EventoCaixa[],
  semanas = 13,
  bandaPct = 15
): { labels: string[]; previsto: number[]; otimista: number[]; pessimista: number[] } {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const labels: string[] = [];
  const previsto: number[] = [];
  const otimista: number[] = [];
  const pessimista: number[] = [];
  let saldo = saldoInicial;

  for (let i = 0; i < semanas; i++) {
    const inicioSem = new Date(hoje); inicioSem.setDate(hoje.getDate() + i * 7);
    const fimSem = new Date(inicioSem); fimSem.setDate(inicioSem.getDate() + 6);

    const entradasSemana = entradasPrevistas
      .filter((e) => { const d = new Date(e.data + "T00:00:00"); return d >= inicioSem && d <= fimSem; })
      .reduce((a, r) => a + (Number(r.valor) || 0), 0);
    const saidasSemana = saidasPrevistas
      .filter((s) => { const d = new Date(s.data + "T00:00:00"); return d >= inicioSem && d <= fimSem; })
      .reduce((a, r) => a + (Number(r.valor) || 0), 0);

    saldo += entradasSemana - saidasSemana;
    labels.push(`${inicioSem.getDate()}/${inicioSem.getMonth() + 1}`);
    previsto.push(Math.round(saldo));
    otimista.push(Math.round(saldo * (1 + bandaPct / 100)));
    pessimista.push(Math.round(saldo * (1 - bandaPct / 100)));
  }

  return { labels, previsto, otimista, pessimista };
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

// Barras verticais com gradiente + valor no topo. coresIndividuais opcional destaca
// barras específicas (ex: meses de "muro de vencimentos") com uma cor sólida diferente.
export function optBarrasV(dados: number[], labels: string[], cor: string, corC: string, coresIndividuais?: (string | null)[]) {
  const gradientePadrao = { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corC }, { offset: 1, color: cor }] };
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
        color: coresIndividuais ? (p: any) => coresIndividuais[p.dataIndex] || gradientePadrao : gradientePadrao,
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
// DRE — DIAGNÓSTICO CFO (cascata, análise vertical/horizontal,
// decomposição de causa raiz, ponte lucro×caixa, semáforo de saúde,
// runway, conselho acionável, projeção). Reutilizável por DRE e
// Relatórios — única fonte de verdade da cascata, nunca duplicar.
// ═══════════════════════════════════════════════════════════════

export type LinhaDRE = { valor: number; avPct: number | null };

export type DRE = {
  receitaBruta: LinhaDRE;
  deducoes: LinhaDRE;
  receitaLiquida: LinhaDRE;
  custoVariavel: LinhaDRE;
  margemContribuicao: LinhaDRE;
  custoFixo: LinhaDRE;
  ebitda: LinhaDRE;
  despesasFinanceiras: LinhaDRE;
  lucroLiquido: LinhaDRE;
  margemContribuicaoPct: number; // sobre receita líquida
  margemLiquidaPct: number;      // sobre receita líquida
};

// Cascata completa. AV% sempre sobre Receita Líquida (base = 100%) — a Receita
// Bruta fica acima da base (deduções ainda não saíram), por isso avPct null nela.
export function montarDRE(p: {
  receitaBruta: number; deducoes: number; custoVariavel: number; custoFixo: number; despesasFinanceiras: number;
}): DRE {
  const receitaLiquida = p.receitaBruta - p.deducoes;
  const mc = margemContribuicao(receitaLiquida, p.custoVariavel);
  const ebitda = mc.valor - p.custoFixo;
  const lucroLiquido = ebitda - p.despesasFinanceiras;
  const base = receitaLiquida > 0 ? receitaLiquida : 0;
  const av = (v: number): number | null => (base > 0 ? (v / base) * 100 : null);

  return {
    receitaBruta: { valor: p.receitaBruta, avPct: null },
    deducoes: { valor: p.deducoes, avPct: av(p.deducoes) },
    receitaLiquida: { valor: receitaLiquida, avPct: base > 0 ? 100 : null },
    custoVariavel: { valor: p.custoVariavel, avPct: av(p.custoVariavel) },
    margemContribuicao: { valor: mc.valor, avPct: av(mc.valor) },
    custoFixo: { valor: p.custoFixo, avPct: av(p.custoFixo) },
    ebitda: { valor: ebitda, avPct: av(ebitda) },
    despesasFinanceiras: { valor: p.despesasFinanceiras, avPct: av(p.despesasFinanceiras) },
    lucroLiquido: { valor: lucroLiquido, avPct: av(lucroLiquido) },
    margemContribuicaoPct: mc.pct,
    margemLiquidaPct: base > 0 ? (lucroLiquido / base) * 100 : 0,
  };
}

// ---------- DECOMPOSIÇÃO DA VARIAÇÃO DO LUCRO (causa raiz) ----------
// Soma dos impactos == variação real do lucro líquido (atual - anterior).
// O primeiro item do array (maior |impacto|) é a causa raiz a apontar antes de sugerir corte.
export type FatorVariacaoLucro = {
  fator: "receita" | "deducoes" | "custoVariavel" | "custoFixo" | "despesasFinanceiras";
  impacto: number;
};

export function decomporVariacaoLucro(atual: DRE, anterior: DRE): FatorVariacaoLucro[] {
  const fatores: FatorVariacaoLucro[] = [
    { fator: "receita", impacto: atual.receitaBruta.valor - anterior.receitaBruta.valor },
    { fator: "deducoes", impacto: -(atual.deducoes.valor - anterior.deducoes.valor) },
    { fator: "custoVariavel", impacto: -(atual.custoVariavel.valor - anterior.custoVariavel.valor) },
    { fator: "custoFixo", impacto: -(atual.custoFixo.valor - anterior.custoFixo.valor) },
    { fator: "despesasFinanceiras", impacto: -(atual.despesasFinanceiras.valor - anterior.despesasFinanceiras.valor) },
  ];
  return fatores.sort((a, b) => Math.abs(b.impacto) - Math.abs(a.impacto));
}

// ---------- PONTE LUCRO × CAIXA ----------
// Detecta "lucrativo no papel mas consome caixa" — nenhum ERP BR pra PME faz essa ponte.
export type PonteLucroCaixa = {
  lucroLiquido: number; caixaRealizado: number; diferenca: number;
  alerta: boolean;
  causaProvavel: "recebiveis" | "amortizacaoDivida" | "indefinida" | null;
};

export function ponteLucroCaixa(p: {
  lucroLiquido: number; caixaRealizado: number;
  variacaoRecebiveisAbertos: number; // aumento de títulos em aberto no período (positivo = mais parado)
  variacaoAmortizacaoDivida: number; // principal pago no período (reduz caixa, não é despesa do DRE)
}): PonteLucroCaixa {
  const diferenca = p.caixaRealizado - p.lucroLiquido;
  const sinalOposto = (p.lucroLiquido > 0 && p.caixaRealizado < 0) || (p.lucroLiquido < 0 && p.caixaRealizado > 0);
  const relevante = p.lucroLiquido !== 0 ? Math.abs(diferenca) > Math.abs(p.lucroLiquido) * 0.15 : Math.abs(diferenca) > 0;
  const alerta = sinalOposto || relevante;
  let causaProvavel: PonteLucroCaixa["causaProvavel"] = null;
  if (alerta) {
    if (p.variacaoRecebiveisAbertos > 0 && p.variacaoRecebiveisAbertos >= p.variacaoAmortizacaoDivida) causaProvavel = "recebiveis";
    else if (p.variacaoAmortizacaoDivida > 0) causaProvavel = "amortizacaoDivida";
    else causaProvavel = "indefinida";
  }
  return { lucroLiquido: p.lucroLiquido, caixaRealizado: p.caixaRealizado, diferenca, alerta, causaProvavel };
}

// ---------- SEMÁFORO DE SAÚDE ----------
// Cada sinal é calculado individualmente (nunca escondido) e a cor geral é a PIOR
// entre eles — o raciocínio completo fica sempre disponível pro usuário conferir.
export type CorSaude = "verde" | "amarelo" | "vermelho";
export type SinalSaude = { chave: "margemLiquida" | "ebitdaQueda" | "pesoCustoFixo" | "concentracao"; cor: CorSaude; valor: number };

export function calcularSinaisSaude(p: {
  margemLiquidaPct: number; mesesQuedaEbitda: number;
  pesoCustoFixoPct: number; pesoCustoFixoBenchmark: number; concentracaoPct: number;
}): SinalSaude[] {
  return [
    { chave: "margemLiquida", valor: p.margemLiquidaPct, cor: p.margemLiquidaPct < 0 ? "vermelho" : p.margemLiquidaPct < 10 ? "amarelo" : "verde" },
    { chave: "ebitdaQueda", valor: p.mesesQuedaEbitda, cor: p.mesesQuedaEbitda >= 3 ? "vermelho" : p.mesesQuedaEbitda >= 1 ? "amarelo" : "verde" },
    { chave: "pesoCustoFixo", valor: p.pesoCustoFixoPct, cor: p.pesoCustoFixoPct > p.pesoCustoFixoBenchmark * 1.2 ? "vermelho" : p.pesoCustoFixoPct > p.pesoCustoFixoBenchmark ? "amarelo" : "verde" },
    { chave: "concentracao", valor: p.concentracaoPct, cor: p.concentracaoPct > 70 ? "vermelho" : p.concentracaoPct > 50 ? "amarelo" : "verde" },
  ];
}

// Genérico o bastante pra qualquer lista de sinais com cor (DRE, Endividamento, futuros módulos).
export function semaforoSaude(sinais: { cor: CorSaude }[]): CorSaude {
  const PIOR: Record<CorSaude, number> = { verde: 0, amarelo: 1, vermelho: 2 };
  return sinais.reduce((pior, s) => (PIOR[s.cor] > PIOR[pior] ? s.cor : pior), "verde" as CorSaude);
}

// Meses consecutivos em queda, contando a partir do mais recente
export function mesesQuedaConsecutiva(serie: number[]): number {
  let count = 0;
  for (let i = serie.length - 1; i > 0; i--) {
    if (serie[i] < serie[i - 1]) count++; else break;
  }
  return count;
}

// ---------- RUNWAY ATÉ SITUAÇÃO CRÍTICA ----------
// Tendência linear simples que ACEITA valores negativos — diferente de preverTendencia
// (que assume séries sempre positivas, tipo receita/custo, e não serve pro lucro líquido).
export function projetarTendenciaLivre(serie: number[], horizonte = 12): number[] {
  if (serie.length === 0) return Array(horizonte).fill(0);
  if (serie.length < 2) return Array(horizonte).fill(serie[0]);
  const ultimos = serie.slice(-3);
  const media = ultimos.reduce((a, b) => a + b, 0) / ultimos.length;
  const tendencia = (serie[serie.length - 1] - serie[0]) / serie.length;
  return Array.from({ length: horizonte }, (_, i) => media + tendencia * (i + 1));
}

// Retorna em quantos meses a projeção do lucro líquido cruza zero, ou null se não cruzar no horizonte
export function runwayCritico(serieLucroLiquido: number[], horizonte = 12): number | null {
  const projecao = projetarTendenciaLivre(serieLucroLiquido, horizonte);
  const idx = projecao.findIndex((v) => v < 0);
  return idx === -1 ? null : idx + 1;
}

// ---------- CONSELHO CFO ACIONÁVEL ----------
// Cada gatilho só dispara com uma condição objetiva real — nunca "corte custos" genérico.
// A frase final (ação + motivo + impacto) é montada no cfoTextos, aqui só o cálculo.
export type GatilhoConselho =
  | { tipo: "renegociarCusto"; descricao: string; impacto: number }
  | { tipo: "revisarCustoFixo"; categoria: string; pesoPct: number; impacto: number }
  | { tipo: "aumentarMargemSeguranca"; margemAtualPct: number; receitaNecessaria: number }
  | { tipo: "cobrarRecebiveis"; valorParado: number };

export function gerarConselhoCFO(p: {
  maiorFatorNegativo: FatorVariacaoLucro | null;
  anomaliaPrincipal: AnomaliaHistorica | null;
  custoFixoPorCategoria: { categoria: string; valor: number }[];
  pesoCustoFixoBenchmark: number;
  custoFixoTotal: number;
  receitaLiquida: number;
  margemSegurancaPct: number | null;
  pontoEquilibrioValor: number | null;
  recebiveisParados: number;
}): GatilhoConselho[] {
  const out: GatilhoConselho[] = [];

  if (p.maiorFatorNegativo?.fator === "custoVariavel" && p.anomaliaPrincipal) {
    out.push({ tipo: "renegociarCusto", descricao: p.anomaliaPrincipal.descricao, impacto: p.anomaliaPrincipal.impacto });
  }

  const pesoAtual = p.receitaLiquida > 0 ? (p.custoFixoTotal / p.receitaLiquida) * 100 : 0;
  if (pesoAtual > p.pesoCustoFixoBenchmark && p.custoFixoPorCategoria.length > 0) {
    const maior = [...p.custoFixoPorCategoria].sort((a, b) => b.valor - a.valor)[0];
    const reducaoNecessaria = p.custoFixoTotal - (p.pesoCustoFixoBenchmark / 100) * p.receitaLiquida;
    out.push({ tipo: "revisarCustoFixo", categoria: maior.categoria, pesoPct: pesoAtual, impacto: Math.max(0, reducaoNecessaria) });
  }

  if (p.margemSegurancaPct !== null && p.margemSegurancaPct < 15 && p.pontoEquilibrioValor !== null) {
    const receitaParaMeta = p.pontoEquilibrioValor / (1 - 0.20); // meta: 20% de margem de segurança
    out.push({ tipo: "aumentarMargemSeguranca", margemAtualPct: p.margemSegurancaPct, receitaNecessaria: Math.max(0, receitaParaMeta - p.receitaLiquida) });
  }

  if (p.recebiveisParados > 0 && p.recebiveisParados > p.receitaLiquida * 0.1) {
    out.push({ tipo: "cobrarRecebiveis", valorParado: p.recebiveisParados });
  }

  return out.slice(0, 4);
}

// ---------- PROJEÇÃO DO DRE (próximos meses) ----------
export function projetarDRE(p: {
  serieReceitaBruta: number[]; serieCustoVariavel: number[]; serieCustoFixo: number[];
  aliquotaEfetivaPct: number; despesasFinanceirasMensal: number; horizonte?: number;
}): DRE[] {
  const horizonte = p.horizonte ?? 3;
  const receitas = preverTendencia(p.serieReceitaBruta, horizonte);
  const custosVar = preverTendencia(p.serieCustoVariavel, horizonte);
  const custosFix = preverTendencia(p.serieCustoFixo, horizonte);
  return Array.from({ length: horizonte }, (_, i) => montarDRE({
    receitaBruta: receitas[i],
    deducoes: receitas[i] * (p.aliquotaEfetivaPct / 100),
    custoVariavel: custosVar[i],
    custoFixo: custosFix[i],
    despesasFinanceiras: p.despesasFinanceirasMensal,
  }));
}

// ---------- GRÁFICO CASCATA (waterfall) — modal único do DRE ----------
export type ItemCascata = { label: string; valor: number; tipo: "subtotal" | "variacao" };

export function optCascata(itens: ItemCascata[], corPositivo: string, corNegativo: string, corSubtotal: string) {
  let acumulado = 0;
  const base: number[] = [];
  const valores: number[] = [];
  const cores: string[] = [];

  itens.forEach((it) => {
    if (it.tipo === "subtotal") {
      base.push(0);
      valores.push(it.valor);
      cores.push(corSubtotal);
      acumulado = it.valor;
    } else {
      const inicio = acumulado;
      const fim = acumulado + it.valor;
      base.push(Math.min(inicio, fim));
      valores.push(Math.abs(it.valor));
      cores.push(it.valor >= 0 ? corPositivo : corNegativo);
      acumulado = fim;
    }
  });

  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 58, right: 16, top: 34, bottom: 56, containLabel: false },
    tooltip: {
      ...tipBase, trigger: "axis",
      formatter: (ps: any[]) => {
        const p = ps.find((x: any) => x.seriesName === "valor");
        if (!p) return "";
        return `<b>${p.axisValue}</b><br/><b style="font-size:15px">${fBRL(itens[p.dataIndex].valor)}</b>`;
      },
    },
    xAxis: {
      type: "category", data: itens.map((it) => it.label),
      axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false },
      axisLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: 700, interval: 0, rotate: 20 },
    },
    yAxis: {
      type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } },
      axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) },
    },
    series: [
      { name: "base", type: "bar", stack: "cascata", itemStyle: { color: "transparent" }, silent: true, data: base },
      {
        name: "valor", type: "bar", stack: "cascata", barWidth: "55%",
        itemStyle: { borderRadius: [6, 6, 2, 2], color: (p: any) => cores[p.dataIndex] },
        label: { show: true, position: "top", color: "#f1f5f9", fontSize: 9, fontWeight: 800, formatter: (p: any) => fK(itens[p.dataIndex].valor) },
        data: valores,
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════════
// ENDIVIDAMENTO — SISTEMA DE SOBREVIVÊNCIA (escada de vencimentos,
// avalanche, indicadores de solvência, simulador de refinanciamento,
// conselho e projeção de quitação). Reutilizável só por Endividamento
// por enquanto, mas segue o mesmo padrão do núcleo de DRE acima.
// ═══════════════════════════════════════════════════════════════

export type DividaBase = {
  descricao: string; tipo?: string; valor_total: number; valor_pago: number;
  parcelas: number; vencimento: string; taxa_juros: number; // taxa_juros em % ao mês
};

// ---------- ESCADA DE VENCIMENTOS (maturity wall) ----------
export type BucketVencimento = { mes: string; label: string; valor: number; muro: boolean };

// Projeta o cronograma de parcelas de TODAS as dívidas (reusa projetarRecorrenciaMensal,
// mesma engine do Fluxo de Caixa) e soma por mês. "Muro" = mês em que a soma das parcelas
// agendadas ultrapassa limiarMuroPct% da capacidade mensal real de pagamento (não um
// múltiplo arbitrário da própria média — ancorado em caixa real).
export function escadaVencimentos(
  dividas: DividaBase[], capacidadeMensalPagamento: number, horizonteMeses = 24, limiarMuroPct = 40
): BucketVencimento[] {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const buckets: BucketVencimento[] = [];
  for (let i = 0; i < horizonteMeses; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    buckets.push({ mes: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${mesesPt[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`, valor: 0, muro: false });
  }
  dividas.forEach((dv) => {
    const saldo = Math.max(0, dv.valor_total - dv.valor_pago);
    const parcelas = Math.max(1, dv.parcelas);
    if (saldo <= 0 || !dv.vencimento) return;
    const valorParcela = saldo / parcelas;
    const eventos = projetarRecorrenciaMensal(valorParcela, dv.vencimento, horizonteMeses * 31, parcelas);
    eventos.forEach((ev) => {
      const d = new Date(ev.data + "T00:00:00");
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const b = buckets.find((x) => x.mes === chave);
      if (b) b.valor += ev.valor;
    });
  });
  // Capacidade <= 0 (EBITDA negativo/zero) = empresa sem fôlego pra pagar nada — qualquer
  // parcela futura já é risco, não só as que passam do limiar percentual.
  return buckets.map((b) => ({
    ...b,
    muro: b.valor > 0 && (capacidadeMensalPagamento <= 0 || (b.valor / capacidadeMensalPagamento) * 100 > limiarMuroPct),
  }));
}

// ---------- MÉTODO AVALANCHE ----------
export type ItemAvalanche = {
  descricao: string; tipo?: string; saldoDevedor: number; taxaJurosAM: number;
  jurosMensalAtual: number; ordem: number; cara: boolean;
};

// Ordena por taxa de juros (custo real), não por valor — quem sai primeiro é quem mais
// economiza. "Cara" = 15% acima da própria média do portfólio de dívidas da empresa.
export function ordenarAvalanche(dividas: DividaBase[]): ItemAvalanche[] {
  const comSaldo = dividas.filter((d) => d.valor_total - d.valor_pago > 0);
  const taxaMedia = comSaldo.length ? comSaldo.reduce((s, d) => s + d.taxa_juros, 0) / comSaldo.length : 0;
  return comSaldo
    .map((d) => {
      const saldoDevedor = d.valor_total - d.valor_pago;
      return {
        descricao: d.descricao, tipo: d.tipo, saldoDevedor, taxaJurosAM: d.taxa_juros,
        jurosMensalAtual: saldoDevedor * (d.taxa_juros / 100),
        cara: taxaMedia > 0 && d.taxa_juros > taxaMedia * 1.15,
        ordem: 0,
      };
    })
    .sort((a, b) => b.taxaJurosAM - a.taxaJurosAM)
    .map((item, i) => ({ ...item, ordem: i + 1 }));
}

// ---------- INDICADORES DE SOLVÊNCIA ----------
// Índice de Cobertura de Juros: quantas vezes o EBITDA cobre a despesa financeira do mês.
// null = sem despesa financeira no período (indicador não se aplica, não é "infinito bom").
export function coberturaJuros(ebitdaMensal: number, despesasFinanceirasMensal: number): number | null {
  if (despesasFinanceirasMensal <= 0) return null;
  return ebitdaMensal / despesasFinanceirasMensal;
}

// Dívida / EBITDA anualizado — clássico múltiplo de alavancagem que bancos e agências de rating usam.
export function dividaEbitda(dividaTotal: number, ebitdaAnualizado: number): number | null {
  if (ebitdaAnualizado <= 0) return null;
  return dividaTotal / ebitdaAnualizado;
}

// Dívida total como % da receita anualizada — comprometimento estrutural.
export function dividaReceita(dividaTotal: number, receitaAnualizada: number): number {
  return receitaAnualizada > 0 ? (dividaTotal / receitaAnualizada) * 100 : 0;
}

// % da receita mensal já comprometida com parcelas de dívida no mês.
export function comprometimentoMensal(parcelaMensalTotal: number, receitaMensal: number): number {
  return receitaMensal > 0 ? (parcelaMensalTotal / receitaMensal) * 100 : 0;
}

// Fluxo de caixa (realizado) sobre dívida total — capacidade real de quitação, não teórica.
export function fluxoCaixaSobreDivida(fluxoCaixaMensal: number, dividaTotal: number): number {
  return dividaTotal > 0 ? (fluxoCaixaMensal / dividaTotal) * 100 : 0;
}

export type SinalSolvencia = {
  chave: "coberturaJuros" | "dividaEbitda" | "dividaReceita" | "comprometimentoMensal" | "fluxoCaixaSobreDivida";
  cor: CorSaude; valor: number | null;
};

// Faixas de referência de mercado (regra geral corporativa — não vêm de benchmarks_setoriais,
// que não tem esses campos; documentado aqui pra ficar claro de onde vem cada corte).
export function calcularSinaisSolvencia(p: {
  coberturaJurosX: number | null; dividaEbitdaX: number | null; dividaReceitaPct: number;
  comprometimentoMensalPct: number; fluxoCaixaSobreDividaPct: number;
}): SinalSolvencia[] {
  const corCobertura: CorSaude = p.coberturaJurosX === null ? "verde" : p.coberturaJurosX < 1.5 ? "vermelho" : p.coberturaJurosX < 3 ? "amarelo" : "verde";
  const corDividaEbitda: CorSaude = p.dividaEbitdaX === null ? "amarelo" : p.dividaEbitdaX > 4 ? "vermelho" : p.dividaEbitdaX > 2 ? "amarelo" : "verde";
  const corDividaReceita: CorSaude = p.dividaReceitaPct > 50 ? "vermelho" : p.dividaReceitaPct > 30 ? "amarelo" : "verde";
  const corComprometimento: CorSaude = p.comprometimentoMensalPct > 20 ? "vermelho" : p.comprometimentoMensalPct > 10 ? "amarelo" : "verde";
  const corFCDivida: CorSaude = p.fluxoCaixaSobreDividaPct < 10 ? "vermelho" : p.fluxoCaixaSobreDividaPct < 20 ? "amarelo" : "verde";
  return [
    { chave: "coberturaJuros", cor: corCobertura, valor: p.coberturaJurosX },
    { chave: "dividaEbitda", cor: corDividaEbitda, valor: p.dividaEbitdaX },
    { chave: "dividaReceita", cor: corDividaReceita, valor: p.dividaReceitaPct },
    { chave: "comprometimentoMensal", cor: corComprometimento, valor: p.comprometimentoMensalPct },
    { chave: "fluxoCaixaSobreDivida", cor: corFCDivida, valor: p.fluxoCaixaSobreDividaPct },
  ];
}

// ---------- SIMULADOR DE REFINANCIAMENTO ----------
// Modelo simplificado (juro flat sobre saldo devedor, igual ao resto do app) — não é uma
// tabela de amortização Price/SAC completa, mas já mostra a direção e a ordem de grandeza real.
export type ResultadoRefinanciamento = {
  jurosMensalAtual: number; jurosMensalNovo: number; economiaJurosMensal: number;
  parcelaAtual: number; parcelaNova: number; liberacaoCaixaMensal: number; economiaJurosTotal: number;
};

export function simularRefinanciamento(p: {
  saldoDevedor: number; taxaJurosAtualAM: number; parcelasRestantesAtual: number;
  novaTaxaAM: number; novoPrazoParcelas: number;
}): ResultadoRefinanciamento {
  const jurosMensalAtual = p.saldoDevedor * (p.taxaJurosAtualAM / 100);
  const parcelaAtual = p.parcelasRestantesAtual > 0 ? p.saldoDevedor / p.parcelasRestantesAtual + jurosMensalAtual : 0;
  const jurosMensalNovo = p.saldoDevedor * (p.novaTaxaAM / 100);
  const parcelaNova = p.novoPrazoParcelas > 0 ? p.saldoDevedor / p.novoPrazoParcelas + jurosMensalNovo : 0;
  return {
    jurosMensalAtual, jurosMensalNovo, economiaJurosMensal: jurosMensalAtual - jurosMensalNovo,
    parcelaAtual, parcelaNova, liberacaoCaixaMensal: parcelaAtual - parcelaNova,
    economiaJurosTotal: jurosMensalAtual * p.parcelasRestantesAtual - jurosMensalNovo * p.novoPrazoParcelas,
  };
}

// ---------- PROJEÇÃO DE QUITAÇÃO (3 cenários) ----------
export type CenarioQuitacao = "minimo" | "avalanche";
export type PontoQuitacao = { mes: number; saldoDevedor: number };

// Simula a carteira de dívidas mês a mês. "minimo" paga só a parcela normal de cada uma.
// "avalanche" direciona qualquer folga extra de caixa pra quitar primeiro a mais cara.
export function projetarQuitacao(
  dividas: DividaBase[], cenario: CenarioQuitacao, horizonteMeses = 60, folgaExtraMensal = 0
): PontoQuitacao[] {
  type Estado = { saldo: number; taxa: number; parcelaBase: number };
  let carteira: Estado[] = dividas
    .filter((d) => d.valor_total - d.valor_pago > 0)
    .map((d) => {
      const saldo = d.valor_total - d.valor_pago;
      const parcelas = Math.max(1, d.parcelas);
      return { saldo, taxa: d.taxa_juros / 100, parcelaBase: saldo / parcelas + saldo * (d.taxa_juros / 100) };
    });

  if (cenario === "avalanche") carteira = [...carteira].sort((a, b) => b.taxa - a.taxa);

  const pontos: PontoQuitacao[] = [{ mes: 0, saldoDevedor: Math.round(carteira.reduce((s, c) => s + c.saldo, 0)) }];

  for (let mes = 1; mes <= horizonteMeses; mes++) {
    let folga = cenario === "avalanche" ? folgaExtraMensal : 0;
    carteira = carteira.map((c) => {
      if (c.saldo <= 0) return c;
      const juros = c.saldo * c.taxa;
      const pagamento = Math.min(c.saldo + juros, c.parcelaBase + folga);
      if (folga > 0) folga = Math.max(0, folga - Math.max(0, pagamento - c.parcelaBase));
      return { ...c, saldo: Math.max(0, c.saldo + juros - pagamento) };
    });
    pontos.push({ mes, saldoDevedor: Math.round(carteira.reduce((s, c) => s + c.saldo, 0)) });
    if (carteira.every((c) => c.saldo <= 0)) break;
  }
  return pontos;
}

// Meses até quitação total no ritmo atual (cenário mínimo) — null = não quita dentro do
// horizonte analisado, sinal vermelho de dívida perpétua/crescente.
export function runwayDivida(dividas: DividaBase[], horizonteMeses = 120): number | null {
  const pontos = projetarQuitacao(dividas, "minimo", horizonteMeses);
  const quitado = pontos.find((p) => p.saldoDevedor <= 0);
  return quitado ? quitado.mes : null;
}

// ---------- CONSELHO CFO DE DÍVIDA ----------
export type GatilhoConselhoDivida =
  | { tipo: "quitarPrimeiro"; descricao: string; taxaJurosAM: number; economiaEstimada: number }
  | { tipo: "refinanciarAntesMuro"; mesMuro: string; valorMuro: number }
  | { tipo: "coberturaJurosBaixa"; coberturaAtual: number }
  | { tipo: "dividaAltaSobreEbitda"; multiplo: number };

export function gerarConselhoDivida(p: {
  avalanche: ItemAvalanche[]; escada: BucketVencimento[];
  coberturaJurosX: number | null; dividaEbitdaX: number | null;
}): GatilhoConselhoDivida[] {
  const out: GatilhoConselhoDivida[] = [];

  const maisCara = p.avalanche[0];
  if (maisCara && maisCara.cara) {
    out.push({ tipo: "quitarPrimeiro", descricao: maisCara.descricao, taxaJurosAM: maisCara.taxaJurosAM, economiaEstimada: maisCara.jurosMensalAtual * 6 });
  }

  const proximoMuro = p.escada.find((b) => b.muro);
  if (proximoMuro) out.push({ tipo: "refinanciarAntesMuro", mesMuro: proximoMuro.label, valorMuro: proximoMuro.valor });

  if (p.coberturaJurosX !== null && p.coberturaJurosX < 1.5) out.push({ tipo: "coberturaJurosBaixa", coberturaAtual: p.coberturaJurosX });

  if (p.dividaEbitdaX !== null && p.dividaEbitdaX > 4) out.push({ tipo: "dividaAltaSobreEbitda", multiplo: p.dividaEbitdaX });

  return out.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════
// METAS SMART AUTOMÁTICAS — ritmo, progresso esperado, projeção de
// fechamento, detector de meta irreal, árvore de dependências,
// conselho CFO. Progresso sempre puxado do dado real, nunca manual.
// ═══════════════════════════════════════════════════════════════

export type TipoMeta = "faturamento" | "lucro" | "margem" | "reducao_custo" | "reducao_divida" | "caixa" | "ticket_medio" | "num_clientes";

// ---------- RITMO NECESSÁRIO (pace) ----------
export type RitmoMeta = { ritmoNecessarioMensal: number; ritmoAtualMensal: number; mesesDecorridos: number; mesesRestantes: number; mesesTotais: number };

export function calcularRitmoMeta(p: {
  valorInicial: number; valorMeta: number; valorAtual: number; dataInicio: string; prazo: string; hoje?: string;
}): RitmoMeta {
  const hoje = p.hoje ? new Date(p.hoje + "T00:00:00") : new Date();
  const inicio = new Date(p.dataInicio + "T00:00:00");
  const fim = new Date(p.prazo + "T00:00:00");
  const diasTotais = Math.max(1, (fim.getTime() - inicio.getTime()) / 86400000);
  const diasDecorridos = Math.min(diasTotais, Math.max(0, (hoje.getTime() - inicio.getTime()) / 86400000));
  const mesesTotais = Math.max(0.1, diasTotais / 30);
  const mesesDecorridos = Math.max(0.1, diasDecorridos / 30);
  const mesesRestantes = Math.max(0, mesesTotais - mesesDecorridos);
  const distanciaTotal = p.valorMeta - p.valorInicial;
  const distanciaPercorrida = p.valorAtual - p.valorInicial;
  return {
    ritmoNecessarioMensal: distanciaTotal / mesesTotais,
    ritmoAtualMensal: distanciaPercorrida / mesesDecorridos,
    mesesDecorridos, mesesRestantes, mesesTotais,
  };
}

// Onde a meta DEVERIA estar hoje se estivesse seguindo o ritmo necessário desde o início (linear).
export function progressoEsperado(valorInicial: number, ritmoNecessarioMensal: number, mesesDecorridos: number): number {
  return valorInicial + ritmoNecessarioMensal * mesesDecorridos;
}

// Onde a meta VAI TERMINAR se o ritmo atual continuar até o prazo.
export function projetarFechamentoMeta(valorAtual: number, ritmoAtualMensal: number, mesesRestantes: number): number {
  return valorAtual + ritmoAtualMensal * mesesRestantes;
}

// % da distância percorrida — mesma fórmula serve pra meta crescente (faturamento) e
// decrescente (redução de dívida/custo), o sinal de distanciaTotal já embute a direção.
export function progressoPercentual(valorInicial: number, valorAtual: number, valorMeta: number): number {
  const distanciaTotal = valorMeta - valorInicial;
  if (distanciaTotal === 0) return valorAtual === valorMeta ? 100 : 0;
  return ((valorAtual - valorInicial) / distanciaTotal) * 100;
}

// ---------- DIREÇÃO DA META (validação, não recálculo — o sinal já embute a direção) ----------
// O usuário declara explicitamente aumentar/reduzir (trava de segurança contra erro de
// digitação no valor-alvo, ex: marcar "Reduzir" mas digitar um alvo maior que o inicial).
// A matemática de ritmo/progresso não muda — ela já é direção-agnóstica por design.
export type DirecaoMeta = "aumentar" | "reduzir";

export function validarDirecaoMeta(direcao: DirecaoMeta, valorInicial: number, valorMeta: number): boolean {
  if (valorMeta === valorInicial) return true; // sem distância ainda, nada pra contradizer
  const cresce = valorMeta > valorInicial;
  return direcao === "aumentar" ? cresce : !cresce;
}

// ---------- RITMO HISTÓRICO (capacidade real demonstrada, base pro detector de meta irreal) ----------
// Média do movimento mensal absoluto numa série histórica (ex: 12 meses de receita, custo,
// clientes ativos...). Não é % de crescimento — é "quanto a empresa costuma mover por mês",
// no mesmo tipo de unidade da meta (R$, %, ou contagem), pra comparar com o ritmo necessário.
export function ritmoHistoricoMedio(serieMensal: number[]): number {
  if (serieMensal.length < 2) return 0;
  let soma = 0;
  for (let i = 1; i < serieMensal.length; i++) soma += serieMensal[i] - serieMensal[i - 1];
  return soma / (serieMensal.length - 1);
}

// ---------- DETECTOR DE META IRREAL (anti goal-gaming) ----------
export type ClassificacaoMeta = "facil" | "impossivel" | "realista";

export function detectarMetaIrreal(p: {
  valorInicial: number; valorMeta: number; ritmoNecessarioMensal: number;
  ritmoHistoricoMedioMensal: number; mesesTotais: number;
}): { classificacao: ClassificacaoMeta; sugestaoAlvo: number | null } {
  const distanciaTotal = p.valorMeta - p.valorInicial;
  const direcao = distanciaTotal >= 0 ? 1 : -1;
  const baseHistorica = Math.abs(p.ritmoHistoricoMedioMensal);

  // Sem histórico suficiente pra julgar (empresa nova) — não classifica, evita falso alarme.
  if (baseHistorica <= 0) return { classificacao: "realista", sugestaoAlvo: null };

  // Fácil demais: pede menos do que a empresa já faz sozinha em meio mês no ritmo histórico.
  if (Math.abs(distanciaTotal) < baseHistorica * 0.5) {
    return { classificacao: "facil", sugestaoAlvo: p.valorInicial + baseHistorica * 1.15 * p.mesesTotais * direcao };
  }
  // Impossível: pede mais que 2,5x o que a empresa já demonstrou ser capaz de fazer por mês.
  if (Math.abs(p.ritmoNecessarioMensal) > baseHistorica * 2.5) {
    return { classificacao: "impossivel", sugestaoAlvo: p.valorInicial + baseHistorica * 1.15 * p.mesesTotais * direcao };
  }
  return { classificacao: "realista", sugestaoAlvo: null };
}

// ---------- SEMÁFORO E MARCOS ----------
export function semaforoMeta(progressoPct: number, progressoEsperadoPct: number): CorSaude {
  if (progressoEsperadoPct <= 0) return "verde"; // ainda no início do prazo, sem base de comparação
  const razao = progressoPct / progressoEsperadoPct;
  if (razao < 0.7) return "vermelho";
  if (razao < 0.95) return "amarelo";
  return "verde";
}

export function marcoAlcancado(progressoPct: number): 0 | 25 | 50 | 75 | 100 {
  if (progressoPct >= 100) return 100;
  if (progressoPct >= 75) return 75;
  if (progressoPct >= 50) return 50;
  if (progressoPct >= 25) return 25;
  return 0;
}

// ---------- TRADUÇÃO EM DINHEIRO ----------
export function traduzirMetaEmDinheiro(valorAtual: number, valorMeta: number): number {
  return Math.abs(valorMeta - valorAtual);
}

// ---------- ÁRVORE DE DEPENDÊNCIAS ----------
// Implícita pelo tipo — nunca um campo pro usuário preencher (reintroduziria a vaguidão).
const DEPENDENCIAS_META: Partial<Record<TipoMeta, TipoMeta[]>> = {
  lucro: ["faturamento", "reducao_custo"],
  caixa: ["faturamento", "reducao_custo", "reducao_divida"],
  margem: ["faturamento", "reducao_custo"],
};

export type ArvoreMeta = { tipoMeta: TipoMeta; dependeDe: TipoMeta[]; dependenciaEmRisco: TipoMeta[] };

export function conectarMetas(metas: { tipoMeta: TipoMeta; corSemaforo: CorSaude }[]): ArvoreMeta[] {
  const porTipo = new Map<TipoMeta, CorSaude[]>();
  metas.forEach((m) => {
    const arr = porTipo.get(m.tipoMeta) || [];
    arr.push(m.corSemaforo);
    porTipo.set(m.tipoMeta, arr);
  });

  const out: ArvoreMeta[] = [];
  metas.forEach((m) => {
    const deps = DEPENDENCIAS_META[m.tipoMeta];
    if (!deps) return;
    const emRisco = deps.filter((d) => {
      const cores = porTipo.get(d);
      return cores && semaforoSaude(cores.map((c) => ({ cor: c }))) !== "verde";
    });
    if (emRisco.length > 0) out.push({ tipoMeta: m.tipoMeta, dependeDe: deps, dependenciaEmRisco: emRisco });
  });
  return out;
}

// ---------- CONSELHO CFO DE METAS ----------
export type GatilhoConselhoMeta =
  | { tipo: "acelerar"; tituloMeta: string; percentualAcelerar: number }
  | { tipo: "retaFinal"; tituloMeta: string; faltam: number }
  | { tipo: "ajustarAlvo"; tituloMeta: string; classificacao: ClassificacaoMeta; sugestaoAlvo: number };

export function gerarConselhoMeta(metas: {
  titulo: string; progressoPct: number; corSemaforo: CorSaude;
  ritmoAtualMensal: number; ritmoNecessarioRestante: number; faltamValor: number;
  classificacao: ClassificacaoMeta; sugestaoAlvo: number | null;
}[]): GatilhoConselhoMeta[] {
  const out: GatilhoConselhoMeta[] = [];
  metas.forEach((m) => {
    if (m.corSemaforo === "vermelho" && m.ritmoAtualMensal !== 0) {
      const percentualAcelerar = (Math.abs(m.ritmoNecessarioRestante) / Math.abs(m.ritmoAtualMensal) - 1) * 100;
      if (percentualAcelerar > 0) out.push({ tipo: "acelerar", tituloMeta: m.titulo, percentualAcelerar });
    }
    if (m.progressoPct >= 90 && m.progressoPct < 100) out.push({ tipo: "retaFinal", tituloMeta: m.titulo, faltam: m.faltamValor });
    if (m.classificacao !== "realista" && m.sugestaoAlvo !== null) out.push({ tipo: "ajustarAlvo", tituloMeta: m.titulo, classificacao: m.classificacao, sugestaoAlvo: m.sugestaoAlvo });
  });
  return out.slice(0, 4);
}

// ═══════════════════════════════════════════════════════════════
// TIPOGRAFIA PREMIUM — padrão executivo do Dashboard (Georgia serif)
// Usar em TODOS os títulos de painel e letreiros dos módulos.
// ═══════════════════════════════════════════════════════════════
export const FONTE_EXEC = { fontFamily: "'Georgia','Times New Roman',serif" };
export const FONTE_EXEC_TITULO = { fontFamily: "'Georgia','Times New Roman',serif", letterSpacing: "0.3px" };