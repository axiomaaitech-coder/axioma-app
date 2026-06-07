"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Centro = {
  id: string; nome: string; descricao: string; cor: string;
  user_id: string; empresa_id: string; created_at: string;
};
type Lancamento = {
  id: string; descricao: string; valor: number; tipo: "custo" | "receita";
  data: string; centro_id: string; user_id: string; empresa_id: string; created_at: string;
};

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
    const floaters = "AXIOMA CENTROS CUSTO AI TECH FINANCE".split("").map((char) => ({
      char, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#6ab0ff", "#34d399", "#a78bfa"][Math.floor(Math.random() * 3)],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      floaters.forEach(f => {
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
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  );
}

function ModalPremium({ aberto, onFechar, titulo, cor = "#6ab0ff", children }: {
  aberto: boolean; onFechar: () => void; titulo: string; cor?: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md max-h-screen overflow-y-auto">
            <CanvasBox cor={cor} corB="#34d399" corC="#a78bfa" corD="#f472b6">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                    className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                    style={{ color: cor, textShadow: `0 0 20px ${cor}` }}>AXIOMA AI.TECH</motion.p>
                  <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
              </div>
              {children}
            </CanvasBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CentrosCustoPage() {
  const { t, idioma } = useLanguage();
  const cc = t.centrosCusto;
  const conteudoRef = useRef<HTMLDivElement>(null);
  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCentro, setEditandoCentro] = useState<Centro | null>(null);
  const [nomeCentro, setNomeCentro] = useState("");
  const [descricaoCentro, setDescricaoCentro] = useState("");
  const [corCentro, setCorCentro] = useState("#6ab0ff");
  const [salvandoCentro, setSalvandoCentro] = useState(false);
  const [modalLancamento, setModalLancamento] = useState(false);
  const [descricaoLanc, setDescricaoLanc] = useState("");
  const [valorLanc, setValorLanc] = useState("");
  const [tipoLanc, setTipoLanc] = useState<"custo" | "receita">("custo");
  const [dataLanc, setDataLanc] = useState(new Date().toISOString().split("T")[0]);
  const [centroLanc, setCentroLanc] = useState("");
  const [salvandoLanc, setSalvandoLanc] = useState(false);
  const [busca, setBusca] = useState("");
  const cores = ["#6ab0ff", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee"];

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const { data: centrosData } = await supabase.from("centros_custo").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    const { data: lancamentosData } = await supabase.from("lancamentos_centro").select("*").eq("user_id", user.id).order("data", { ascending: false });
    setCentros(centrosData || []);
    setLancamentos(lancamentosData || []);
    setLoading(false);
  }

  async function salvarCentro() {
    if (!nomeCentro.trim()) return;
    setSalvandoCentro(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editandoCentro) {
      await supabase.from("centros_custo").update({ nome: nomeCentro, descricao: descricaoCentro, cor: corCentro }).eq("id", editandoCentro.id);
    } else {
      await supabase.from("centros_custo").insert({ nome: nomeCentro, descricao: descricaoCentro, cor: corCentro, user_id: user.id, empresa_id: empresaId });
    }
    fecharModalCentro(); setSalvandoCentro(false); carregarDados();
  }

  async function excluirCentro(id: string) {
    await supabase.from("centros_custo").delete().eq("id", id); carregarDados();
  }

  async function salvarLancamento() {
    if (!descricaoLanc.trim() || !valorLanc || !centroLanc) return;
    setSalvandoLanc(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("lancamentos_centro").insert({ descricao: descricaoLanc, valor: parseFloat(valorLanc), tipo: tipoLanc, data: dataLanc, centro_id: centroLanc, user_id: user.id, empresa_id: empresaId });
    setModalLancamento(false); setDescricaoLanc(""); setValorLanc(""); setTipoLanc("custo"); setDataLanc(new Date().toISOString().split("T")[0]); setCentroLanc("");
    setSalvandoLanc(false); carregarDados();
  }

  function abrirEditarCentro(centro: Centro) {
    setEditandoCentro(centro); setNomeCentro(centro.nome); setDescricaoCentro(centro.descricao || ""); setCorCentro(centro.cor || "#6ab0ff"); setModalCentro(true);
  }

  function fecharModalCentro() {
    setModalCentro(false); setEditandoCentro(null); setNomeCentro(""); setDescricaoCentro(""); setCorCentro("#6ab0ff");
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
      pdf.text(`${cc.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-centros-custo-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const totalCustos = lancamentos.filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const saldoGeral = totalReceitas - totalCustos;
  const getCustos = (id: string) => lancamentos.filter(l => l.centro_id === id && l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const getReceitas = (id: string) => lancamentos.filter(l => l.centro_id === id && l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const lancFiltrados = lancamentos.filter(l => l.descricao.toLowerCase().includes(busca.toLowerCase()));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const botaoLancamento = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalLancamento(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cc.novoLancamento}
    </motion.button>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810", minHeight: "100vh" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ModuloLayout titulo={`🗂️ ${cc.titulo}`} subtitulo={cc.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCentro(null); setNomeCentro(""); setDescricaoCentro(""); setCorCentro("#6ab0ff"); setModalCentro(true); }}
      labelBotao={cc.novoCentro} botaoExtra={botaoLancamento}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cc.totalCentros, valor: centros.length.toString(), cor: "#6ab0ff" },
            { label: cc.totalCustos, valor: fmt(totalCustos), cor: "#f87171" },
            { label: cc.totalReceitas, valor: fmt(totalReceitas), cor: "#34d399" },
            { label: cc.saldoGeral, valor: fmt(saldoGeral), cor: saldoGeral >= 0 ? "#34d399" : "#f87171" },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
              <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <p className="text-xl font-bold" style={{ color: card.cor, textShadow: `0 0 15px ${card.cor}60` }}>{card.valor}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "visao", label: cc.abaVisaoGeral },
            { key: "centros", label: cc.abaCentros },
            { key: "lancamentos", label: cc.abaLancamentos },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAba(a.key as typeof aba)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}`, boxShadow: aba === a.key ? "0 0 12px rgba(106,176,255,0.15)" : "none" }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* Aba Visão Geral */}
        {aba === "visao" && (
          <div className="space-y-4">
            {centros.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => {
              const custos = getCustos(centro.id);
              const receitas = getReceitas(centro.id);
              const saldo = receitas - custos;
              const maxVal = Math.max(totalCustos, totalReceitas, 1);
              return (
                <motion.div key={centro.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor={centro.cor} corB="#34d399" corC="#a78bfa" corD="#f472b6">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: centro.cor, boxShadow: `0 0 8px ${centro.cor}` }} />
                        <span className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: saldo >= 0 ? "#34d399" : "#f87171" }}>{fmt(saldo)}</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: cc.custo, valor: custos, cor: "#f87171" },
                        { label: cc.receita, valor: receitas, cor: "#34d399" },
                      ].map(item => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}>
                            <span>{item.label}</span><span>{fmt(item.valor)}</span>
                          </div>
                          <div className="rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(item.valor / maxVal) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-1.5 rounded-full" style={{ background: item.cor, boxShadow: `0 0 6px ${item.cor}` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Aba Centros */}
        {aba === "centros" && (
          <div className="space-y-3">
            {centros.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => (
              <motion.div key={centro.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CanvasBox cor={centro.cor} corB="#34d399" corC="#a78bfa" corD="#f472b6">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ background: centro.cor, boxShadow: `0 0 10px ${centro.cor}` }} />
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</p>
                        {centro.descricao && <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro.descricao}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCentro(centro)}>
                        <Pencil size={15} style={{ color: "#6ab0ff" }} />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCentro(centro.id)}>
                        <Trash2 size={15} style={{ color: "#f87171" }} />
                      </motion.button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        )}

        {/* Aba Lançamentos */}
        {aba === "lancamentos" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cc.buscar}
                className="w-full text-sm focus:outline-none bg-transparent" style={{ color: "#c8d8f0" }} />
            </CanvasBox>
            {lancFiltrados.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#3a5a8a" }}>{cc.semLancamentos}</p></div></CanvasBox>
            ) : lancFiltrados.map((lanc, i) => {
              const centro = centros.find(c => c.id === lanc.centro_id);
              return (
                <motion.div key={lanc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={lanc.tipo === "receita" ? "#34d399" : "#f87171"} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {centro && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: centro.cor, boxShadow: `0 0 8px ${centro.cor}` }} />}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{lanc.descricao}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro?.nome} · {new Date(lanc.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: lanc.tipo === "receita" ? "#34d399" : "#f87171" }}>
                        {lanc.tipo === "receita" ? "+" : "-"}{fmt(lanc.valor)}
                      </span>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Centro */}
      <ModalPremium aberto={modalCentro} onFechar={fecharModalCentro} titulo={editandoCentro ? cc.editarCentro : cc.novoCentro} cor="#6ab0ff">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.nomeCentro}</label>
            <input value={nomeCentro} onChange={(e) => setNomeCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.descricaoCentro}</label>
            <input value={descricaoCentro} onChange={(e) => setDescricaoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.corCentro}</label>
            <div className="flex gap-2 flex-wrap">
              {cores.map((cor) => (
                <motion.button key={cor} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => setCorCentro(cor)}
                  className="w-8 h-8 rounded-full"
                  style={{ background: cor, boxShadow: corCentro === cor ? `0 0 12px ${cor}` : "none", border: corCentro === cor ? "3px solid #fff" : "3px solid transparent" }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalCentro} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCentro} disabled={salvandoCentro}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {salvandoCentro ? "..." : cc.salvarCentro}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Lançamento */}
      <ModalPremium aberto={modalLancamento} onFechar={() => setModalLancamento(false)} titulo={cc.novoLancamento} cor="#34d399">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
            <input value={descricaoLanc} onChange={(e) => setDescricaoLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.valor}</label>
            <input type="number" value={valorLanc} onChange={(e) => setValorLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.tipo}</label>
            <div className="flex gap-2">
              {(["custo", "receita"] as const).map((tipo) => (
                <motion.button key={tipo} whileTap={{ scale: 0.97 }} onClick={() => setTipoLanc(tipo)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)") : "rgba(59,111,212,0.05)", color: tipoLanc === tipo ? (tipo === "custo" ? "#f87171" : "#34d399") : "#3a5a8a", border: `1px solid ${tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)") : "rgba(59,111,212,0.1)"}` }}>
                  {tipo === "custo" ? cc.custo : cc.receita}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
            <input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.centroCusto}</label>
            <select value={centroLanc} onChange={(e) => setCentroLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
              <option value="">-- {cc.centroCusto} --</option>
              {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalLancamento(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarLancamento} disabled={salvandoLanc}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
              {salvandoLanc ? "..." : cc.salvarLancamento}
            </motion.button>
          </div>
        </div>
      </ModalPremium>
    </ModuloLayout>
  );
}