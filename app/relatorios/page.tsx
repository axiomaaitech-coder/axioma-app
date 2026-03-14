"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const dadosDRE = {
  pt: [
    { label: "Receita Bruta", valor: 62000, tipo: "receita" },
    { label: "Deducoes", valor: -4340, tipo: "deducao" },
    { label: "Receita Liquida", valor: 57660, tipo: "subtotal" },
    { label: "Custos Fixos", valor: -16249, tipo: "custo" },
    { label: "Custos Variaveis", valor: -9350, tipo: "custo" },
    { label: "Lucro Bruto", valor: 32061, tipo: "subtotal" },
    { label: "Despesas Operacionais", valor: -860, tipo: "custo" },
    { label: "Lucro Liquido", valor: 31201, tipo: "lucro" },
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
    { name: "Custos Fixos", value: 16249, color: "#3b6fd4" },
    { name: "Custos Variaveis", value: 9350, color: "#f87171" },
    { name: "Fornecedores", value: 7150, color: "#fbbf24" },
    { name: "Impostos", value: 4340, color: "#a78bfa" },
    { name: "Outros", value: 860, color: "#34d399" },
  ],
  en: [
    { name: "Fixed Costs", value: 16249, color: "#3b6fd4" },
    { name: "Variable Costs", value: 9350, color: "#f87171" },
    { name: "Suppliers", value: 7150, color: "#fbbf24" },
    { name: "Taxes", value: 4340, color: "#a78bfa" },
    { name: "Others", value: 860, color: "#34d399" },
  ],
  es: [
    { name: "Costos Fijos", value: 16249, color: "#3b6fd4" },
    { name: "Costos Variables", value: 9350, color: "#f87171" },
    { name: "Proveedores", value: 7150, color: "#fbbf24" },
    { name: "Impuestos", value: 4340, color: "#a78bfa" },
    { name: "Otros", value: 860, color: "#34d399" },
  ],
};

const indicadores = {
  pt: [
    { nome: "Margem Bruta", valor: "51.7%", meta: "50%", atingido: true },
    { nome: "Margem Liquida", valor: "50.3%", meta: "45%", atingido: true },
    { nome: "ROI", valor: "38.7%", meta: "30%", atingido: true },
    { nome: "Ponto de Equilibrio", valor: "R$ 31.599", meta: "R$ 35.000", atingido: true },
    { nome: "Ticket Medio", valor: "R$ 3.100", meta: "R$ 3.000", atingido: true },
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

const renderLabel = (props: { name?: string; percent?: number }) => {
  const name = props.name ?? "";
  const percent = props.percent ?? 0;
  return `${name} ${(percent * 100).toFixed(0)}%`;
};

const dreTitle = { pt: "Demonstracao do Resultado - Marco 2026", en: "Income Statement - March 2026", es: "Estado de Resultados - Marzo 2026" };
const evolTitle = { pt: "Evolucao Financeira 2026", en: "Financial Evolution 2026", es: "Evolucion Financiera 2026" };
const distTitle = { pt: "Distribuicao de Custos", en: "Cost Distribution", es: "Distribucion de Costos" };
const detTitle = { pt: "Detalhamento", en: "Details", es: "Detalle" };
const textoExportar = { pt: "Exportar PDF", en: "Export PDF", es: "Exportar PDF" };
const textoExportando = { pt: "Gerando PDF...", en: "Generating PDF...", es: "Generando PDF..." };

export default function Relatorios() {
  const router = useRouter();
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
      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t.relatorios.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
      let position = 22;
      let remaining = pdfHeight;
      while (remaining > 0) {
        const sliceHeight = Math.min(pageHeight - position, remaining);
        const sourceY = (pdfHeight - remaining) * (canvas.height / pdfHeight);
        const sourceH = sliceHeight * (canvas.height / pdfHeight);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceH;
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.fillStyle = "#020810";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH);
        pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 0, position, pdfWidth, sliceHeight);
        remaining -= sliceHeight;
        position = 0;
        if (remaining > 0) { pdf.addPage(); position = 0; }
      }
      pdf.save(`axioma-relatorio-${aba}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{ background: "#020810" }}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#3a5a8a" }}><ArrowLeft size={20} /></button>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>{t.relatorios.titulo}</h2>
            <p className="text-sm" style={{ color: "#3a5a8a" }}>{t.relatorios.subtitulo}</p>
          </div>
        </div>
        <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "#dc2626", color: "#fff" }}>
          <Download size={18}/>{exportando ? textoExportando[idioma] : textoExportar[idioma]}
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        {[
          { key: "dre", label: t.relatorios.dre },
          { key: "evolucao", label: t.relatorios.evolucao },
          { key: "distribuicao", label: t.relatorios.distribuicao },
          { key: "indicadores", label: t.relatorios.indicadores },
        ].map((a) => (
          <button key={a.key} onClick={() => setAba(a.key)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: aba === a.key ? "rgba(59,111,212,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.3)" : "rgba(59,111,212,0.15)"}` }}>
            {a.label}
          </button>
        ))}
      </div>

      <div ref={conteudoRef}>
        {aba === "dre" && (
          <div className="rounded-2xl overflow-hidden max-w-2xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
              <h3 className="font-bold" style={{ color: "#c8d8f0" }}>{dreTitle[idioma]}</h3>
            </div>
            {dreAtual.map((item, i) => (
              <div key={i} className="flex justify-between items-center px-6 py-4" style={{ borderBottom: i < dreAtual.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none", background: item.tipo === "subtotal" || item.tipo === "lucro" ? "rgba(59,111,212,0.05)" : "transparent" }}>
                <span className="text-sm font-medium" style={{ color: item.tipo === "subtotal" || item.tipo === "lucro" ? "#c8d8f0" : "#8aaad4", paddingLeft: item.tipo === "subtotal" || item.tipo === "lucro" ? 0 : "16px" }}>{item.label}</span>
                <span className="font-bold" style={{ color: item.valor > 0 ? "#34d399" : "#f87171", fontSize: item.tipo === "lucro" ? "18px" : "14px" }}>
                  {item.valor > 0 ? "+" : ""}R$ {Math.abs(item.valor).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}

        {aba === "evolucao" && (
          <div className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <h3 className="font-bold mb-6" style={{ color: "#c8d8f0" }}>{evolTitle[idioma]}</h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={dadosEvolucao}>
                <defs>
                  <linearGradient id="receita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b6fd4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b6fd4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lucro" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)" />
                <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#3a5a8a" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0" }} />
                <Legend />
                <Area type="monotone" dataKey="receita" stroke="#3b6fd4" fill="url(#receita)" strokeWidth={2} name={idioma === "pt" ? "Receita" : idioma === "en" ? "Revenue" : "Ingresos"} />
                <Area type="monotone" dataKey="lucro" stroke="#34d399" fill="url(#lucro)" strokeWidth={2} name={idioma === "pt" ? "Lucro" : idioma === "en" ? "Profit" : "Beneficio"} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {aba === "distribuicao" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <h3 className="font-bold mb-6" style={{ color: "#c8d8f0" }}>{distTitle[idioma]}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pizzaAtual} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={renderLabel}>
                    {pizzaAtual.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0" }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <h3 className="font-bold mb-6" style={{ color: "#c8d8f0" }}>{detTitle[idioma]}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={pizzaAtual} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)" />
                  <XAxis type="number" stroke="#3a5a8a" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" stroke="#3a5a8a" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0" }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {pizzaAtual.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {aba === "indicadores" && (
          <div className="grid grid-cols-3 gap-4">
            {indicadoresAtual.map((ind, i) => (
              <div key={i} className="rounded-2xl p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{ind.nome}</p>
                <p className="text-3xl font-black mb-2" style={{ color: ind.atingido ? "#34d399" : "#f87171" }}>{ind.valor}</p>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: ind.atingido ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: ind.atingido ? "#34d399" : "#f87171" }}>
                  {ind.atingido ? t.relatorios.acimaMeta : t.relatorios.abaixoMeta}
                </span>
                <p className="text-xs mt-2" style={{ color: "#3a5a8a" }}>{t.relatorios.meta}: {ind.meta}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}