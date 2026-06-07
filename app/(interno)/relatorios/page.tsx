"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }));
    const chars = "AXIOMA RELATORIOS AI TECH 0 1 2 3 4 5 6 7 8 9 R$ % DRE ROI".split(" ").map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#6ab0ff", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"][Math.floor(Math.random() * 5)],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      chars.forEach(f => {
        ctx.save(); ctx.font = `900 ${f.size}px Arial`;
        ctx.fillStyle = f.color; ctx.globalAlpha = f.opacity;
        ctx.fillText(f.char, (f.x / 100) * canvas.width, (f.y / 100) * canvas.height);
        ctx.restore(); f.y -= f.speed; if (f.y < -5) f.y = 105;
      });
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.save(); ctx.globalAlpha = (1 - dist / 110) * 0.12;
            ctx.strokeStyle = p.color; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); ctx.restore();
          }
        });
        ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color;
        ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.7 }} />;
}

function CanvasBox({ children, cor = "#6ab0ff", corB = "#34d399", corC = "#a78bfa", corD = "#f472b6" }: {
  children: React.ReactNode; cor?: string; corB?: string; corC?: string; corD?: string;
}) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(4,10,22,0.97)", border: `1px solid ${cor}30`, boxShadow: `0 0 60px ${cor}10`,
    }}>
      <CanvasNeural />
      {[
        { pos: "top-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${cor}, transparent)`, glow: cor },
        { pos: "top-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corB}, transparent)`, glow: corB },
        { pos: "top-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(180deg, ${corB}, transparent)`, glow: corB },
        { pos: "bottom-0 left-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(90deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 left-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corC}, transparent)`, glow: corC },
        { pos: "bottom-0 right-0", w: "w-20 h-[2.5px]", bg: `linear-gradient(270deg, ${corD}, transparent)`, glow: corD },
        { pos: "bottom-0 right-0", w: "w-[2.5px] h-20", bg: `linear-gradient(0deg, ${corD}, transparent)`, glow: corD },
      ].map((b, i) => (
        <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 14px ${b.glow}`, borderRadius: "999px" }} />
      ))}
      <motion.div animate={{ left: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: "999px" }} />
      <motion.div animate={{ right: ["-5%", "105%", "-5%"] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: "999px", position: "absolute" }} />
      <div className="relative z-10 p-4 md:p-6">{children}</div>
    </div>
  );
}

const dadosDRE = {
  pt: [
    { label: "Receita Bruta", valor: 62000, tipo: "receita" },
    { label: "Deduções", valor: -4340, tipo: "deducao" },
    { label: "Receita Líquida", valor: 57660, tipo: "subtotal" },
    { label: "Custos Fixos", valor: -16249, tipo: "custo" },
    { label: "Custos Variáveis", valor: -9350, tipo: "custo" },
    { label: "Lucro Bruto", valor: 32061, tipo: "subtotal" },
    { label: "Despesas Operacionais", valor: -860, tipo: "custo" },
    { label: "Lucro Líquido", valor: 31201, tipo: "lucro" },
  ],
  en: [
    { label: "Gross Revenue", valor: 62000, tipo: "receita" },
    { label: "Deductions", valor: -4340, tipo: "deducao" },
    { label: "Net Revenue", valor: 57660, tipo: "subtotal" },
    { label: "Fixed Costs", valor: -16249, tipo: "custo" },
    { label: "Variable Costs", valor: -9350, tipo: "custo" },
    { label: "Gross Profit", valor: 32061, tipo: "subtotal" },
    { label: "Operating Expenses", valor: -860, tipo: "custo" },
    { label: "Net Profit", valor: 31201, tipo: "lucro" },
  ],
  es: [
    { label: "Ingreso Bruto", valor: 62000, tipo: "receita" },
    { label: "Deducciones", valor: -4340, tipo: "deducao" },
    { label: "Ingreso Neto", valor: 57660, tipo: "subtotal" },
    { label: "Costos Fijos", valor: -16249, tipo: "custo" },
    { label: "Costos Variables", valor: -9350, tipo: "custo" },
    { label: "Beneficio Bruto", valor: 32061, tipo: "subtotal" },
    { label: "Gastos Operativos", valor: -860, tipo: "custo" },
    { label: "Beneficio Neto", valor: 31201, tipo: "lucro" },
  ],
};

const dadosEvolucao = [
  { mes: "Jan", receita: 42000, custos: 28000, lucro: 14000 },
  { mes: "Fev", receita: 48000, custos: 31000, lucro: 17000 },
  { mes: "Mar", receita: 45000, custos: 29000, lucro: 16000 },
  { mes: "Abr", receita: 53000, custos: 33000, lucro: 20000 },
  { mes: "Mai", receita: 58000, custos: 35000, lucro: 23000 },
  { mes: "Jun", receita: 62000, custos: 38000, lucro: 24000 },
];

const dadosPizza = {
  pt: [
    { name: "Custos Fixos", value: 16249, color: "#6ab0ff" },
    { name: "Custos Variáveis", value: 9350, color: "#f87171" },
    { name: "Fornecedores", value: 7150, color: "#fbbf24" },
    { name: "Impostos", value: 4340, color: "#a78bfa" },
    { name: "Outros", value: 860, color: "#34d399" },
  ],
  en: [
    { name: "Fixed Costs", value: 16249, color: "#6ab0ff" },
    { name: "Variable Costs", value: 9350, color: "#f87171" },
    { name: "Suppliers", value: 7150, color: "#fbbf24" },
    { name: "Taxes", value: 4340, color: "#a78bfa" },
    { name: "Others", value: 860, color: "#34d399" },
  ],
  es: [
    { name: "Costos Fijos", value: 16249, color: "#6ab0ff" },
    { name: "Costos Variables", value: 9350, color: "#f87171" },
    { name: "Proveedores", value: 7150, color: "#fbbf24" },
    { name: "Impuestos", value: 4340, color: "#a78bfa" },
    { name: "Otros", value: 860, color: "#34d399" },
  ],
};

const indicadores = {
  pt: [
    { nome: "Margem Bruta", valor: "51.7%", meta: "50%", atingido: true },
    { nome: "Margem Líquida", valor: "50.3%", meta: "45%", atingido: true },
    { nome: "ROI", valor: "38.7%", meta: "30%", atingido: true },
    { nome: "Ponto de Equilíbrio", valor: "R$ 31.599", meta: "R$ 35.000", atingido: true },
    { nome: "Ticket Médio", valor: "R$ 3.100", meta: "R$ 3.000", atingido: true },
    { nome: "Score Financeiro", valor: "87/100", meta: "80/100", atingido: true },
  ],
  en: [
    { nome: "Gross Margin", valor: "51.7%", meta: "50%", atingido: true },
    { nome: "Net Margin", valor: "50.3%", meta: "45%", atingido: true },
    { nome: "ROI", valor: "38.7%", meta: "30%", atingido: true },
    { nome: "Break Even", valor: "R$ 31.599", meta: "R$ 35.000", atingido: true },
    { nome: "Average Ticket", valor: "R$ 3.100", meta: "R$ 3.000", atingido: true },
    { nome: "Financial Score", valor: "87/100", meta: "80/100", atingido: true },
  ],
  es: [
    { nome: "Margen Bruto", valor: "51.7%", meta: "50%", atingido: true },
    { nome: "Margen Neto", valor: "50.3%", meta: "45%", atingido: true },
    { nome: "ROI", valor: "38.7%", meta: "30%", atingido: true },
    { nome: "Punto de Equilibrio", valor: "R$ 31.599", meta: "R$ 35.000", atingido: true },
    { nome: "Ticket Promedio", valor: "R$ 3.100", meta: "R$ 3.000", atingido: true },
    { nome: "Score Financiero", valor: "87/100", meta: "80/100", atingido: true },
  ],
};

const tooltipStyle = { background: "#040a16", border: "1px solid rgba(106,176,255,0.3)", borderRadius: "12px", color: "#c8d8f0" };

export default function Relatorios() {
  const { t, idioma } = useLanguage();
  const [aba, setAba] = useState("dre");
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  const dreAtual = dadosDRE[idioma];
  const pizzaAtual = dadosPizza[idioma];
  const indicadoresAtual = indicadores[idioma];

  const exportarPDF = async () => {
    if (!conteudoRef.current) return;
    setExportando(true);
    try {
      const canvas = await html2canvas(conteudoRef.current, { backgroundColor: "#020810", scale: 2, useCORS: true });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
      pdf.text(`${t.relatorios.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
      let position = 22; let remaining = pdfHeight;
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining);
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight);
        const sourceH = sliceHeight * (canvas.height / pdfHeight);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width; sliceCanvas.height = sourceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#020810"; ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight);
        remaining -= sliceHeight; position = 0;
        if (remaining > 0) { pdf.addPage(); position = 0; }
      }
      pdf.save(`axioma-relatorio-${aba}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const botaoAbas = (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "dre", label: t.relatorios.dre },
        { key: "evolucao", label: t.relatorios.evolucao },
        { key: "distribuicao", label: t.relatorios.distribuicao },
        { key: "indicadores", label: t.relatorios.indicadores },
      ].map((a) => (
        <motion.button key={a.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
          onClick={() => setAba(a.key)}
          className="px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}`, boxShadow: aba === a.key ? "0 0 12px rgba(106,176,255,0.2)" : "none" }}>
          {a.label}
        </motion.button>
      ))}
    </div>
  );

  return (
    <ModuloLayout titulo={t.relatorios.titulo} subtitulo={t.relatorios.subtitulo} onExportarPDF={exportarPDF} exportando={exportando} botaoExtra={botaoAbas}>
      <div ref={conteudoRef} className="space-y-4">

        {/* DRE */}
        {aba === "dre" && (
          <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
            <div className="mb-4">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                AXIOMA AI.TECH
              </motion.p>
              <h3 className="font-bold text-sm md:text-base" style={{ color: "#c8d8f0" }}>
                {idioma === "pt" ? "Demonstração do Resultado — Março 2026" : idioma === "en" ? "Income Statement — March 2026" : "Estado de Resultados — Marzo 2026"}
              </h3>
            </div>
            <div className="space-y-1">
              {dreAtual.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                  className="flex justify-between items-center py-2.5 px-3 rounded-xl"
                  style={{ background: item.tipo === "subtotal" || item.tipo === "lucro" ? "rgba(106,176,255,0.05)" : "transparent" }}>
                  <span className="text-sm" style={{ color: item.tipo === "subtotal" || item.tipo === "lucro" ? "#c8d8f0" : "#5a7a9a", fontWeight: item.tipo === "subtotal" || item.tipo === "lucro" ? 700 : 400, paddingLeft: item.tipo === "custo" || item.tipo === "deducao" ? "12px" : 0 }}>
                    {item.label}
                  </span>
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 + 0.2 }}
                    className="font-bold" style={{ color: item.valor > 0 ? "#34d399" : "#f87171", fontSize: item.tipo === "lucro" ? "16px" : "14px", textShadow: (item.tipo === "lucro" || item.tipo === "subtotal") ? `0 0 20px ${item.valor > 0 ? "#34d399" : "#f87171"}60` : "none" }}>
                    {item.valor > 0 ? "+" : ""}R$ {Math.abs(item.valor).toLocaleString("pt-BR")}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </CanvasBox>
        )}

        {/* Evolução */}
        {aba === "evolucao" && (
          <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#fbbf24">
            <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
              AXIOMA AI.TECH
            </motion.p>
            <h3 className="font-bold mb-6" style={{ color: "#c8d8f0" }}>
              {idioma === "pt" ? "Evolução Financeira 2026" : idioma === "en" ? "Financial Evolution 2026" : "Evolución Financiera 2026"}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosEvolucao}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ab0ff" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6ab0ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradLucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} />
                <YAxis stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="receita" stroke="#6ab0ff" fill="url(#gradReceita)" strokeWidth={2} name={idioma === "pt" ? "Receita" : idioma === "en" ? "Revenue" : "Ingresos"} />
                <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#gradLucro)" strokeWidth={2} name={idioma === "pt" ? "Lucro" : idioma === "en" ? "Profit" : "Beneficio"} />
              </AreaChart>
            </ResponsiveContainer>
          </CanvasBox>
        )}

        {/* Distribuição */}
        {aba === "distribuicao" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CanvasBox cor="#a78bfa" corB="#6ab0ff" corC="#34d399" corD="#f472b6">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#a78bfa", textShadow: "0 0 20px #a78bfa" }}>
                AXIOMA AI.TECH
              </motion.p>
              <h3 className="font-bold mb-4" style={{ color: "#c8d8f0" }}>
                {idioma === "pt" ? "Distribuição de Custos" : idioma === "en" ? "Cost Distribution" : "Distribución de Costos"}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pizzaAtual} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                    {pizzaAtual.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                </PieChart>
              </ResponsiveContainer>
            </CanvasBox>
            <CanvasBox cor="#fbbf24" corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
              <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#fbbf24", textShadow: "0 0 20px #fbbf24" }}>
                AXIOMA AI.TECH
              </motion.p>
              <h3 className="font-bold mb-4" style={{ color: "#c8d8f0" }}>
                {idioma === "pt" ? "Detalhamento" : idioma === "en" ? "Details" : "Detalle"}
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={pizzaAtual} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(106,176,255,0.08)" />
                  <XAxis type="number" stroke="#3a5a8a" tick={{ fontSize: 11, fill: "#3a5a8a" }} />
                  <YAxis dataKey="name" type="category" stroke="#3a5a8a" tick={{ fontSize: 10, fill: "#3a5a8a" }} width={90} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {pizzaAtual.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CanvasBox>
          </div>
        )}

        {/* Indicadores */}
        {aba === "indicadores" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {indicadoresAtual.map((ind, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <CanvasBox cor={ind.atingido ? "#34d399" : "#f87171"} corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                  <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{ind.nome}</p>
                  <p className="text-2xl md:text-3xl font-black mb-2" style={{ color: ind.atingido ? "#34d399" : "#f87171", textShadow: `0 0 20px ${ind.atingido ? "#34d399" : "#f87171"}60` }}>
                    {ind.valor}
                  </p>
                  <motion.span
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ background: ind.atingido ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)", color: ind.atingido ? "#34d399" : "#f87171" }}>
                    {ind.atingido ? t.relatorios.acimaMeta : t.relatorios.abaixoMeta}
                  </motion.span>
                  <p className="text-xs mt-2" style={{ color: "#3a5a8a" }}>{t.relatorios.meta}: {ind.meta}</p>
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </ModuloLayout>
  );
}