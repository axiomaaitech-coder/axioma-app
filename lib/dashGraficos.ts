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

export const fBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
export const fK = (n: number) => Math.abs(n) >= 1000 ? `R$ ${(n / 1000).toFixed(0)}k` : `R$ ${Math.round(n)}`;

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

export function barrasV(dados: number[], meses: string[], corEscuro: string, corCEscuro: string, claro = false) {
  const cor = claro ? "#101b3d" : corEscuro, corC = claro ? "#122b54" : corCEscuro, e = EIXO(claro);
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    tooltip: { ...(claro ? tipClaro : tip), trigger: "item", borderColor: cor,
      formatter: (p: any) => `<b>${p.name}</b><br/><b style="font-size:15px;color:${corC}">${fBRL(p.value)}</b>` },
    xAxis: { type: "category", data: meses,
      axisLine: { lineStyle: { color: e.linha } }, axisTick: { show: false },
      axisLabel: { color: e.rotulo, fontSize: 11, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: e.grade, type: "dashed" } },
      axisLabel: { color: e.rotuloFraco, fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [{
      type: "bar", barWidth: "60%",
      itemStyle: {
        borderRadius: [8, 8, 2, 2],
        color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: corC }, { offset: 1, color: cor }] },
        shadowColor: cor + "60", shadowBlur: claro ? 4 : 12,
      },
      label: { show: true, position: "top", distance: 6, color: e.valor, fontSize: 10, fontWeight: 800, formatter: (p: any) => fK(p.value) },
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
      textStyle: { color: e.rotulo, fontSize: 11, fontWeight: 600 },
      formatter: (name: string) => { const d = dados.find(x => x.name === name); const pct = d && total > 0 ? Math.round((d.value / total) * 100) : 0; return `${name}  ${pct}%`; } },
    series: [{ type: "pie", radius: ["54%", "80%"], center: ["34%", "52%"], avoidLabelOverlap: false,
      itemStyle: { borderColor: claro ? "#ffffff" : "rgba(10,8,32,0.95)", borderWidth: 3, borderRadius: 5 },
      label: { show: false }, labelLine: { show: false },
      emphasis: { scale: true, scaleSize: 7, itemStyle: { shadowBlur: 26, shadowColor: cor + "80" } },
      data: dados.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } })) }],
    graphic: [
      { type: "text", left: "34%", top: "45%", style: { text: fK(total), textAlign: "center", fill: e.valor, fontSize: 18, fontWeight: 900 }, z: 10 },
      { type: "text", left: "34%", top: "55%", style: { text: centro, textAlign: "center", fill: e.rotuloFraco, fontSize: 9, fontWeight: 700 }, z: 10 },
    ],
  };
}
