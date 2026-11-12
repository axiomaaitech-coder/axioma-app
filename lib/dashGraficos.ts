// ═══════════════════════════════════════════════════════════════
// Options ECharts compartilhadas pelos 2 painéis do Dashboard principal
// (components/DashFinanceiro.tsx e DashComercial.tsx) — antes cada um tinha
// uma cópia idêntica de tip/barrasV/rosca.
//
// `claro` é opt-in (false = exatamente o visual de sempre, tema Escuro). No
// tema Claro segue public/referencias/tema-tokens.md: roscas na sequência
// oficial chart-1..5 (cada fatia distinta — o mapa central corTema viraria
// quase tudo verde-menta), barra de valor em R$ azul-marinho (mesmo padrão
// dos módulos Financeiro), eixos/legendas #374151, tooltip branco.
// ═══════════════════════════════════════════════════════════════

export const fBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
export const fK = (n: number) => Math.abs(n) >= 1000 ? `R$ ${(n / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : fBRL(n);

export const tip = {
  backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
  textStyle: { color: "#e2e8f0", fontSize: 13 },
  extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
};
export const tipClaro = { ...tip, backgroundColor: "#ffffff", textStyle: { color: "#101b3d", fontSize: 13 }, extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(16,27,61,0.18);" };

export const SEQ_CLARO = ["#2ecc9b", "#101b3d", "#34d399", "#6b7280", "#122b54"];

export const EIXO = (claro: boolean) => ({
  linha: claro ? "rgba(16,27,61,0.15)" : "rgba(148,163,184,0.18)",
  linhaTempo: claro ? "rgba(16,27,61,0.15)" : "rgba(148,163,184,0.2)",
  grade: claro ? "rgba(16,27,61,0.08)" : "rgba(148,163,184,0.06)",
  rotulo: claro ? "#374151" : "#cbd5e1",
  rotuloTempo: claro ? "#374151" : "#94a3b8",
  rotuloFraco: claro ? "#374151" : "#64748b",
  valor: claro ? "#101b3d" : "#f1f5f9",
  bordaPonto: claro ? "#f6f7c4" : "#0a0820",
});

// unidade "qtd": contagem (clientes, pessoas) — sem "R$" no rótulo, no eixo e na dica
export function barrasV(dados: number[], meses: string[], corEscuro: string, corCEscuro: string, claro = false, unidade: "brl" | "qtd" = "brl") {
  const fv = (v: number) => (unidade === "qtd" ? v.toLocaleString("pt-BR") : fK(v)), fvDica = (v: number) => (unidade === "qtd" ? v.toLocaleString("pt-BR") : fBRL(v))
  const cor = claro ? "#101b3d" : corEscuro, corC = claro ? "#122b54" : corCEscuro, e = EIXO(claro);
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    tooltip: { ...(claro ? tipClaro : tip), trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${corC}">${fvDica(p.value)}</b>` },
    xAxis: { type: "category", data: meses,
      axisLine: { lineStyle: { color: e.linha } }, axisTick: { show: false },
      axisLabel: { color: e.rotulo, fontSize: 12, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: e.grade, type: "dashed" } },
      minInterval: unidade === "qtd" ? 1 : undefined,
      axisLabel: { color: e.rotuloFraco, fontSize: 12, formatter: (v: number) => fv(v) } },
    series: [{
      // largura fixa e igual (padrão Power BI): com poucas categorias "60%" virava barra gigante
      type: "bar", barMaxWidth: 48, barCategoryGap: "14%", // barra ≈ 85% da coluna (Power BI); 48px cabe em 12 meses, então todo gráfico fica com a mesma largura
      itemStyle: {
        borderRadius: [8, 8, 2, 2],
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corC }, { offset: 1, color: cor }] },
        shadowColor: cor + "60", shadowBlur: claro ? 4 : 12,
      },
      label: { show: true, position: "top", distance: 6, color: e.valor, fontSize: 12, fontWeight: 800, formatter: (p: any) => (Number(p.value) ? fv(p.value) : "") }, // mês zerado sem rótulo (padrão Power BI)
      emphasis: { itemStyle: { shadowBlur: 24 } },
      data: dados,
    }],
  };
}

export function rosca(dadosEscuro: { name: string; value: number; color: string }[], corEscuro: string, centro: string, claro = false) {
  const dados = claro ? dadosEscuro.map((d, i) => ({ ...d, color: SEQ_CLARO[i % SEQ_CLARO.length] })) : dadosEscuro;
  const cor = claro ? "#2ecc9b" : corEscuro, e = EIXO(claro);
  const total = dados.reduce((a, b) => a + b.value, 0);
  return {
    backgroundColor: "transparent", animationDuration: 1000,
    tooltip: { ...(claro ? tipClaro : tip), trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${fBRL(p.value)}</b> <span style="color:${claro ? "#16a97d" : cor}">${p.percent}%</span>` },
    legend: { orient: "vertical", right: 4, top: "center", itemWidth: 11, itemHeight: 11, itemGap: 12, icon: "circle",
      textStyle: { color: e.rotulo, fontSize: 12, fontWeight: 600 },
      formatter: (name: string) => { const d = dados.find(x => x.name === name); const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0; return `${name}  ${pct}%`; } },
    series: [{ type: "pie", radius: ["54%", "80%"], center: ["34%", "52%"], avoidLabelOverlap: false,
      itemStyle: { borderColor: claro ? "#ffffff" : "rgba(10,8,32,0.95)", borderWidth: 3, borderRadius: 5 },
      label: { show: false }, labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 26, shadowColor: cor + "80" } },
      data: dados.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })) }],
    graphic: [
      { type: "text", left: "34%", top: "45%", style: { text: fK(total), textAlign: "center", fill: e.valor, fontSize: 18, fontWeight: 900 }, z: 10 },
      { type: "text", left: "34%", top: "55%", style: { text: centro, textAlign: "center", fill: e.rotuloFraco, fontSize: 12, fontWeight: 700 }, z: 10 },
    ],
  };
}

// Metas vs. Realizado (Dashboard): % atingido de cada meta, linha de 100% = a meta. Funciona para meta em R$, % ou
// número de clientes. O realizado é o valor_atual que a tela Metas calcula e grava (fonte única, não recalcula aqui).
export function barrasProgressoMetas(nomes: string[], pcts: number[], rotuloMeta: string, claro = false) {
  const e = EIXO(claro), cor = claro ? "#101b3d" : "#2ecc9b", corOk = claro ? "#0f7a5a" : "#34d399"
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 8, right: 56, top: 18, bottom: 8, containLabel: true },
    tooltip: { ...(claro ? tipClaro : tip), trigger: "item", borderColor: cor, formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px">${Math.round(p.value)}%</b> ${rotuloMeta}` },
    xAxis: { type: "value", max: (v: { max: number }) => Math.max(110, Math.ceil(v.max / 10) * 10), axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: e.grade, type: "dashed" } }, axisLabel: { color: e.rotuloFraco, fontSize: 12, formatter: (v: number) => `${v}%` } },
    yAxis: { type: "category", data: nomes, inverse: true, axisLine: { lineStyle: { color: e.linha } }, axisTick: { show: false },
      axisLabel: { color: e.rotulo, fontSize: 12, fontWeight: 700, width: 150, overflow: "truncate" } },
    series: [{
      type: "bar", barMaxWidth: 28, barCategoryGap: "30%",
      itemStyle: { borderRadius: [2, 8, 8, 2], color: (p: any) => (p.value >= 100 ? corOk : cor) },
      label: { show: true, position: "right", color: e.valor, fontSize: 12, fontWeight: 800, formatter: (p: any) => `${Math.round(p.value)}%` },
      markLine: { silent: true, symbol: "none", lineStyle: { color: claro ? "#6b7280" : "#94a3b8", type: "dashed", width: 1.5 }, label: { formatter: rotuloMeta, position: "start", color: e.rotuloFraco, fontSize: 11 }, data: [{ xAxis: 100 }] },
      data: pcts.map((v) => Math.max(0, v)),
    }],
  };
}

// Rótulos dos últimos N meses terminando no mês atual (mesma janela de serieRolling): "Dez/25 … Nov/26".
// Antes os gráficos reais usavam Jan…Dez fixo e o valor de novembro aparecia embaixo de "Dez".
export function mesesRolling(nomes: string[], n = 12, hoje = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => { const d = new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1); return `${nomes[d.getMonth()]}/${String(d.getFullYear()).slice(2)}` })
}
