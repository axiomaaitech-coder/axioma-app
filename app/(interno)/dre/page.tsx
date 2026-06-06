"use client";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Pencil, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Canvas com efeito neural/matrix igual à landing page
function DRECanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Partículas
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6"][Math.floor(Math.random() * 4)],
      opacity: Math.random() * 0.6 + 0.2,
    }));

    // Letras flutuantes
    const letters = "AXIOMA DRE AI TECH FINANCE".split(" ").flatMap(w => w.split(""));
    const floaters = Array.from({ length: 20 }, (_, i) => ({
      char: letters[i % letters.length],
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 32 + 16,
      opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.3 + 0.1,
      color: ["#6ab0ff", "#34d399", "#a78bfa"][Math.floor(Math.random() * 3)],
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Letras flutuantes
      floaters.forEach(f => {
        ctx.save();
        ctx.font = `900 ${f.size}px Arial`;
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.opacity;
        ctx.fillText(f.char, f.x, f.y);
        ctx.restore();
        f.y -= f.speed;
        if (f.y < -50) { f.y = canvas.height + 50; f.x = Math.random() * canvas.width; }
      });

      // Conexões entre partículas próximas
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach(q => {
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.save();
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            ctx.restore();
          }
        });
      });

      // Partículas
      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
}

function NeonBox({ children, cor = "#6ab0ff" }: { children: React.ReactNode; cor?: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(10,22,40,0.85)",
      border: `1px solid ${cor}30`,
      boxShadow: `0 0 20px ${cor}10, inset 0 1px 0 ${cor}15`,
    }}>
      <motion.div
        animate={{ left: ["-15%", "115%", "-15%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
        className="absolute top-0 h-[1.5px] w-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)`, boxShadow: `0 0 10px ${cor}`, borderRadius: "999px" }}
      />
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at top left, ${cor}12 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at bottom right, ${cor}08 0%, transparent 70%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

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
    let inicio = "", fim = "";
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
    const meses = periodo === "mes" ? 1 : periodo === "trimestre" ? 3 : 12;
    const { data: rec } = await supabase.from("receitas").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
    const { data: cf } = await supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id);
    const { data: cv } = await supabase.from("custos_variaveis").select("valor").eq("user_id", user.id).gte("data", inicio).lte("data", fim);
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
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
      pdf.text(`${d.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
    { label: d.receitaLiquida, valor: receitaLiquida, nivel: 0, destaque: true, cor: "#c8d8f0", sep: true },
    { label: d.custosVariaveis, valor: -custosVariaveis, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.lucroBruto, valor: lucroBruto, nivel: 0, destaque: true, cor: lucroBruto >= 0 ? "#34d399" : "#f87171", sep: true },
    { label: d.custosFixos, valor: -custosFixos, nivel: 1, destaque: false, cor: "#f87171" },
    { label: d.ebitda, valor: ebitda, nivel: 0, destaque: true, cor: ebitda >= 0 ? "#34d399" : "#f87171", sep: true },
    { label: d.lucroLiquido, valor: lucroLiquido, nivel: 0, destaque: true, cor: lucroLiquido >= 0 ? "#34d399" : "#f87171", sep: true },
  ];

  const botaoPeriodo = (
    <div className="flex gap-2 flex-wrap">
      {[
        { key: "mes", label: d.mesAtual },
        { key: "trimestre", label: d.trimestre },
        { key: "ano", label: d.anoAtual },
      ].map((p) => (
        <motion.button
          key={p.key}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setPeriodo(p.key)}
          className="px-3 py-2 rounded-xl text-sm font-semibold"
          style={{
            background: periodo === p.key ? "rgba(59,111,212,0.3)" : "rgba(10,22,40,0.8)",
            color: periodo === p.key ? "#6ab0ff" : "#3a5a8a",
            border: `1px solid ${periodo === p.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.15)"}`,
            boxShadow: periodo === p.key ? "0 0 12px rgba(106,176,255,0.2)" : "none",
          }}
        >
          {p.label}
        </motion.button>
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
          <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div ref={conteudoRef} className="flex flex-col gap-6">

          {/* TABELA DRE com Canvas animado */}
          <div className="relative rounded-2xl overflow-hidden" style={{
            background: "rgba(4,10,22,0.97)",
            border: "1px solid rgba(106,176,255,0.2)",
            boxShadow: "0 0 80px rgba(106,176,255,0.08), 0 0 40px rgba(52,211,153,0.04)",
            minHeight: "500px",
          }}>
            {/* Canvas neural animado */}
            <DRECanvas />

            {/* Bordas neon nos cantos */}
            {[
              { pos: "top-0 left-0", w: "w-24 h-[2.5px]", bg: "linear-gradient(90deg, #6ab0ff, transparent)", glow: "#6ab0ff" },
              { pos: "top-0 left-0", w: "w-[2.5px] h-24", bg: "linear-gradient(180deg, #6ab0ff, transparent)", glow: "#6ab0ff" },
              { pos: "top-0 right-0", w: "w-24 h-[2.5px]", bg: "linear-gradient(270deg, #34d399, transparent)", glow: "#34d399" },
              { pos: "top-0 right-0", w: "w-[2.5px] h-24", bg: "linear-gradient(180deg, #34d399, transparent)", glow: "#34d399" },
              { pos: "bottom-0 left-0", w: "w-24 h-[2.5px]", bg: "linear-gradient(90deg, #a78bfa, transparent)", glow: "#a78bfa" },
              { pos: "bottom-0 left-0", w: "w-[2.5px] h-24", bg: "linear-gradient(0deg, #a78bfa, transparent)", glow: "#a78bfa" },
              { pos: "bottom-0 right-0", w: "w-24 h-[2.5px]", bg: "linear-gradient(270deg, #f472b6, transparent)", glow: "#f472b6" },
              { pos: "bottom-0 right-0", w: "w-[2.5px] h-24", bg: "linear-gradient(0deg, #f472b6, transparent)", glow: "#f472b6" },
            ].map((b, i) => (
              <div key={i} className={`absolute ${b.pos} ${b.w} z-10`} style={{ background: b.bg, boxShadow: `0 0 16px ${b.glow}, 0 0 32px ${b.glow}60`, borderRadius: "999px" }} />
            ))}

            {/* Partícula correndo no topo */}
            <motion.div
              animate={{ left: ["-5%", "105%", "-5%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 h-[2.5px] w-28 z-20 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, #fff, #6ab0ff, transparent)", boxShadow: "0 0 24px #fff, 0 0 48px #6ab0ff", borderRadius: "999px" }}
            />
            <motion.div
              animate={{ right: ["-5%", "105%", "-5%"] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
              className="absolute bottom-0 h-[2.5px] w-28 z-20 pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, #34d399, #fff, transparent)", boxShadow: "0 0 24px #34d399", borderRadius: "999px", position: "absolute" }}
            />

            {/* Header */}
            <div className="relative z-10 px-4 md:px-6 py-5" style={{ borderBottom: "1px solid rgba(106,176,255,0.1)" }}>
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-xs font-black tracking-[0.3em] uppercase"
                    style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}
                  >
                    AXIOMA AI.TECH
                  </motion.p>
                  <p className="text-xs mt-1" style={{ color: "#3a5a8a" }}>
                    {d.periodo}: {periodo === "mes" ? d.mesAtual : periodo === "trimestre" ? d.trimestre : d.anoAtual}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 rounded-full border opacity-40"
                  style={{ borderColor: "#6ab0ff", borderTopColor: "transparent", borderRightColor: "#34d399" }}
                />
              </div>
            </div>

            {/* Linhas DRE */}
            <div className="relative z-10 p-4 md:p-6 space-y-1">
              {linhas.map((linha, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  {linha.sep && <div className="my-3" style={{ borderTop: "1px solid rgba(106,176,255,0.08)" }} />}
                  <motion.div
                    whileHover={{ x: 6, backgroundColor: "rgba(106,176,255,0.05)" }}
                    transition={{ duration: 0.15 }}
                    className="flex justify-between items-center py-3 rounded-xl px-3 cursor-default"
                    style={{ paddingLeft: linha.nivel === 1 ? "2rem" : "0.75rem" }}
                  >
                    <span className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`} style={{ color: linha.destaque ? "#c8d8f0" : "#5a7a9a" }}>
                      {linha.label}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 + 0.3 }}
                      className={`text-sm ${linha.destaque ? "font-bold" : "font-normal"}`}
                      style={{ color: linha.cor, textShadow: linha.destaque ? `0 0 20px ${linha.cor}80` : "none" }}
                    >
                      {fmt(linha.valor)}
                    </motion.span>
                  </motion.div>
                  {linha.destaque && receitas > 0 && (
                    <div className="mx-3 h-1 rounded-full mb-1" style={{ background: "rgba(59,111,212,0.08)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, (Math.abs(linha.valor) / receitas) * 100))}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: i * 0.07 + 0.4 }}
                        className="h-1 rounded-full"
                        style={{ background: linha.cor, boxShadow: `0 0 6px ${linha.cor}` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Cards de margem */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: d.margemBruta, value: `${margemBruta}%`, cor: Number(margemBruta) >= 0 ? "#34d399" : "#f87171", pct: Number(margemBruta) },
              { label: d.margemLiquida, value: `${margemLiquida}%`, cor: Number(margemLiquida) >= 0 ? "#34d399" : "#f87171", pct: Number(margemLiquida) },
              { label: d.lucroLiquido, value: fmt(lucroLiquido), cor: lucroLiquido >= 0 ? "#34d399" : "#f87171", pct: null },
              { label: d.ebitda, value: fmt(ebitda), cor: ebitda >= 0 ? "#6ab0ff" : "#f87171", pct: null },
            ].map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                <NeonBox cor={card.cor}>
                  <div className="p-5">
                    <p className="text-xs font-semibold mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
                    <p className="text-xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
                    {card.pct !== null && (
                      <div className="mt-3 rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, card.pct))}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
                          className="h-1.5 rounded-full"
                          style={{ background: card.cor, boxShadow: `0 0 8px ${card.cor}` }}
                        />
                      </div>
                    )}
                  </div>
                </NeonBox>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}