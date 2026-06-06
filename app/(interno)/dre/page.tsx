"use client";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DREPage() {
  const { t, idioma } = useLanguage();
  const d = t.dre;
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes");
  const [receitas, setReceitas] = useState(0);
  const [custosFixos, setCustosFixos] = useState(0);
  const [custosVariaveis, setCustosVariaveis] = useState(0);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarDados(); }, [periodo]);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const hoje = new Date();
    let inicio = "";
    let fim = "";

    if (periodo === "mes") {
      inicio = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
      fim = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-31`;
    } else if (periodo === "trimestre") {
      const trimInicio = Math.floor(hoje.getMonth() / 3) * 3;
      inicio = `${hoje.getFullYear()}-${String(trimInicio + 1).padStart(2, "0")}-01`;
      fim = `${hoje.getFullYear()}-${String(trimInicio + 3).padStart(2, "0")}-31`;
    } else {
      inicio = `${hoje.getFullYear()}-01-01`;
      fim = `${hoje.getFullYear()}-12-31`;
    }

    const { data: rec } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
    const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id);
    const { data: cv } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);

    const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : 12;

    setReceitas(rec?.reduce((s, r) => s + (r.valor || 0), 0) || 0);
    setCustosFixos((cf?.reduce((s, r) => s + (r.valor_mensal || 0), 0) || 0) * meses);
    setCustosVariaveis(cv?.reduce((s, r) => s + (r.valor || 0), 0) || 0);
    setLoading(false);
  }

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
      pdf.text(`${d.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });

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
      pdf.save(`axioma-dre-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const impostos = receitas * 0.06;
  const receitaLiquida = receitas - impostos;
  const lucroBruto = receitaLiquida - custosVariaveis;
  const ebitda = lucroBruto - custosFixos;
  const lucroLiquido = ebitda;
  const margemBruta = receitas > 0 ? ((lucroBruto / receitas) * 100).toFixed(1) : "0";
  const margemLiquida = receitas > 0 ? ((lucroLiquido / receitas) * 100).toFixed(1) : "0";

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const linhas = [
    { label: d.receitaBruta, valor: receitas, nivel: 0, destaque: true, cor: "#6ab0ff" },
    { label: d.deducoes, valor: -impostos, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.receitaLiquida, valor: receitaLiquida, nivel: 0, destaque: true, cor: "#c8d8f0", separador: true },
    { label: d.custosVariaveis, valor: -custosVariaveis, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.lucroBruto, valor: lucroBruto, nivel: 0, destaque: true, cor: lucroBruto >= 0 ? "#34d399" : "#f87171", separador: true },
    { label: d.custosFixos, valor: -custosFixos, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.ebitda, valor: ebitda, nivel: 0, destaque: true, cor: ebitda >= 0 ? "#34d399" : "#f87171", separador: true },
    { label: d.lucroLiquido, valor: lucroLiquido, nivel: 0, destaque: true, cor: lucroLiquido >= 0 ? "#34d399" : "#f87171", separador: true },
  ];

  // Botão de período como botaoExtra
  const botaoPeriodo = (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "mes", label: d.mesAtual },
        { key: "trimestre", label: d.trimestre },
        { key: "ano", label: d.anoAtual },
      ].map((p) => (
        <button
          key={p.key}
          onClick={() => setPeriodo(p.key)}
          className="px-3 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            background: periodo === p.key ? "rgba(59,111,212,0.3)" : "rgba(10,22,40,0.8)",
            color: periodo === p.key ? "#6ab0ff" : "#3a5a8a",
            border: `1px solid ${periodo === p.key ? "rgba(59,111,212,0.4)" : "rgba(59,111,212,0.15)"}`,
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );

  return (
    <ModuloLayout
      titulo={`📈 ${d.titulo}`}
      subtitulo={d.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      botaoExtra={botaoPeriodo}
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div ref={conteudoRef} className="flex flex-col gap-6">

          {/* Tabela DRE */}
          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <div className="px-4 md:px-6 py-4" style={{ borderBottom: "1px solid rgba(59,111,212,0.1)" }}>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#3a5a8a" }}>
                {d.periodo}: {periodo === "mes" ? d.mesAtual : periodo === "trimestre" ? d.trimestre : d.anoAtual}
              </p>
            </div>
            <div className="p-4 md:p-6 space-y-1">
              {linhas.map((linha, i) => (
                <div key={i}>
                  {linha.separador && (
                    <div className="my-3" style={{ borderTop: "1px solid rgba(59,111,212,0.1)" }} />
                  )}
                  <div
                    className="flex justify-between items-center py-2.5 rounded-xl transition-all hover:bg-white/5"
                    style={{ paddingLeft: linha.nivel === 1 ? "1.5rem" : "0.75rem", paddingRight: "0.75rem" }}
                  >
                    <span className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`} style={{ color: linha.destaque ? "#c8d8f0" : "#5a7a9a" }}>
                      {linha.label}
                    </span>
                    <span className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`} style={{ color: linha.cor }}>
                      {fmt(linha.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cards de margem — grid responsivo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#3a5a8a" }}>{d.margemBruta}</p>
              <p className="text-2xl font-black" style={{ color: Number(margemBruta) >= 0 ? "#34d399" : "#f87171" }}>{margemBruta}%</p>
              <div className="mt-3 rounded-full h-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(margemBruta)))}%`, background: Number(margemBruta) >= 0 ? "#34d399" : "#f87171" }} />
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#3a5a8a" }}>{d.margemLiquida}</p>
              <p className="text-2xl font-black" style={{ color: Number(margemLiquida) >= 0 ? "#34d399" : "#f87171" }}>{margemLiquida}%</p>
              <div className="mt-3 rounded-full h-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                <div className="h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(0, Number(margemLiquida)))}%`, background: Number(margemLiquida) >= 0 ? "#34d399" : "#f87171" }} />
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: lucroLiquido >= 0 ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${lucroLiquido >= 0 ? "rgba(52,211,153,0.25)" : "rgba(248,113,113,0.25)"}` }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#3a5a8a" }}>{d.lucroLiquido}</p>
              <p className="text-xl font-black" style={{ color: lucroLiquido >= 0 ? "#34d399" : "#f87171" }}>{fmt(lucroLiquido)}</p>
              <p className="text-xs mt-2" style={{ color: lucroLiquido >= 0 ? "#34d399" : "#f87171" }}>
                {lucroLiquido >= 0 ? "Resultado positivo" : "Resultado negativo"}
              </p>
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#3a5a8a" }}>{d.ebitda}</p>
              <p className="text-xl font-black" style={{ color: ebitda >= 0 ? "#6ab0ff" : "#f87171" }}>{fmt(ebitda)}</p>
            </div>
          </div>

        </div>
      )}
    </ModuloLayout>
  );
}