"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Trash2, X, Pencil } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tipos = ["Empréstimo bancário","Cartão de crédito","Cheque especial","Financiamento","Carta de crédito","Outros"];

type Divida = {
  id: string; descricao: string; tipo: string; valor_total: number;
  valor_pago: number; parcelas: number; vencimento: string; taxa_juros: number;
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
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#f87171"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }));
    const chars = "AXIOMA DIVIDA JUROS AI TECH R$ 0 1 2 3 4 5 6 7 8 9 % PARCELA".split(" ").map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#f87171", "#6ab0ff", "#fbbf24", "#a78bfa"][Math.floor(Math.random() * 4)],
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
      <div className="relative z-10 p-4 md:p-5">{children}</div>
    </div>
  );
}

export default function Endividamento() {
  const { t } = useLanguage();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarDividas(); }, []);

  const carregarDividas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("dividas").select("*").eq("user_id", user.id).order("vencimento", { ascending: true });
    setDividas(data || []);
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  };

  const abrirEdicao = (d: Divida) => {
    setEditando(d);
    setNovo({ descricao: d.descricao, tipo: d.tipo, valor_total: String(d.valor_total), valor_pago: String(d.valor_pago), parcelas: String(d.parcelas), vencimento: d.vencimento, taxa_juros: String(d.taxa_juros) });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor_total) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = {
      descricao: novo.descricao, tipo: novo.tipo,
      valor_total: parseFloat(novo.valor_total),
      valor_pago: parseFloat(novo.valor_pago || "0"),
      parcelas: parseInt(novo.parcelas || "1"),
      vencimento: novo.vencimento,
      taxa_juros: parseFloat(novo.taxa_juros || "0"),
    };
    editando
      ? await supabase.from("dividas").update(payload).eq("id", editando.id)
      : await supabase.from("dividas").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarDividas(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("dividas").delete().eq("id", id);
    setDividas(dividas.filter(d => d.id !== id));
  };

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
      pdf.text(`${t.endividamento.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-endividamento-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const dividasFiltradas = dividas.filter(d => d.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalDivida = dividas.reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = dividas.reduce((acc, d) => acc + d.valor_pago, 0);
  const totalRestante = totalDivida - totalPago;

  return (
    <ModuloLayout titulo={t.endividamento.titulo} subtitulo={t.endividamento.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" }); setModalAberto(true); }}
      labelBotao={t.endividamento.novaDivida}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.endividamento.totalDividas, value: `R$ ${totalDivida.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.endividamento.totalPago, value: `R$ ${totalPago.toLocaleString("pt-BR")}`, cor: "#34d399" },
            { label: t.endividamento.saldoRestante, value: `R$ ${totalRestante.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
          <div className="flex items-center gap-2 py-1">
            <Search size={16} style={{ color: "#3a5a8a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.endividamento.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Lista dívidas */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dividasFiltradas.length === 0 ? (
          <CanvasBox cor="#f87171">
            <div className="text-center py-8"><p style={{ color: "#3a5a8a" }}>{t.endividamento.semDividas}</p></div>
          </CanvasBox>
        ) : (
          <div className="space-y-4">
            {dividasFiltradas.map((d, i) => {
              const progresso = (d.valor_pago / d.valor_total) * 100;
              const restante = d.valor_total - d.valor_pago;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <CanvasBox cor="#f87171" corB="#fbbf24" corC="#6ab0ff" corD="#a78bfa">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                          className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                          style={{ color: "#f87171", textShadow: "0 0 15px #f87171" }}>AXIOMA AI.TECH</motion.p>
                        <h3 className="font-bold mb-1" style={{ color: "#c8d8f0" }}>{d.descricao}</h3>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{d.tipo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{t.endividamento.taxaJuros}</p>
                          <p className="font-black text-sm" style={{ color: "#fbbf24", textShadow: "0 0 10px rgba(251,191,36,0.4)" }}>{d.taxa_juros}% a.m.</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(d)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(d.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                      {[
                        { label: t.endividamento.valorTotal, value: `R$ ${d.valor_total.toLocaleString("pt-BR")}`, cor: "#f87171" },
                        { label: t.endividamento.jaPago, value: `R$ ${d.valor_pago.toLocaleString("pt-BR")}`, cor: "#34d399" },
                        { label: t.endividamento.restante, value: `R$ ${restante.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{item.label}</p>
                          <p className="font-black text-sm" style={{ color: item.cor, textShadow: `0 0 10px ${item.cor}40` }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.progresso}</span>
                        <span className="text-xs font-black" style={{ color: "#6ab0ff" }}>{progresso.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progresso, 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.3 + i * 0.1 }}
                          className="h-2 rounded-full"
                          style={{ background: `linear-gradient(90deg, #1a3a8f, #6ab0ff)`, boxShadow: "0 0 8px rgba(106,176,255,0.6)" }} />
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 flex-wrap gap-1">
                      <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.vencimento}: {new Date(d.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      <span className="text-xs" style={{ color: "#3a5a8a" }}>{d.parcelas}x {t.endividamento.parcelas}</span>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#f87171" corB="#fbbf24" corC="#a78bfa" corD="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: "#f87171", textShadow: "0 0 20px #f87171" }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Dívida" : t.endividamento.novaDivida}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                    <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {tipos.map(tp => <option key={tp}>{tp}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t.endividamento.valorTotal, key: "valor_total" },
                      { label: t.endividamento.jaPago, key: "valor_pago" },
                      { label: t.endividamento.parcelas, key: "parcelas" },
                      { label: t.endividamento.taxaJuros, key: "taxa_juros" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                        <input type="number" value={novo[key as keyof typeof novo]}
                          onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.vencimento}</label>
                    <input type="date" value={novo.vencimento} onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(248,113,113,0.4)" }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.endividamento.salvarDivida}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}