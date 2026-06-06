"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Trash2, Pencil, X } from "lucide-react";
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

const categorias = ["Produtos", "Marketing", "Logística", "Tecnologia", "Serviços", "Outros"];

type Fornecedor = {
  id: string;
  nome: string;
  produto_servico: string;
  contato: string;
  valor_mensal: number;
  categoria?: string;
};

function CanvasNeural() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 0.5,
      color: ["#6ab0ff", "#34d399", "#a78bfa", "#f472b6", "#fbbf24"][Math.floor(Math.random() * 5)],
      opacity: Math.random() * 0.6 + 0.2,
    }));
    const floaters = "AXIOMA FORNECEDORES SUPPLY AI TECH FINANCE".split("").map((char) => ({
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
      background: "rgba(4,10,22,0.97)",
      border: `1px solid ${cor}30`,
      boxShadow: `0 0 60px ${cor}10`,
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
      <motion.div
        animate={{ left: ["-5%", "105%", "-5%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, #fff, ${cor}, transparent)`, boxShadow: `0 0 20px #fff, 0 0 40px ${cor}`, borderRadius: "999px" }}
      />
      <motion.div
        animate={{ right: ["-5%", "105%", "-5%"] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 h-[2.5px] w-24 z-20 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${corB}, #fff, transparent)`, boxShadow: `0 0 20px ${corB}`, borderRadius: "999px", position: "absolute" }}
      />
      <div className="relative z-10 p-4 md:p-6">{children}</div>
    </div>
  );
}

export default function Fornecedores() {
  const { t, idioma } = useLanguage();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [novo, setNovo] = useState({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarFornecedores(); }, []);

  const carregarFornecedores = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("fornecedores").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    setFornecedores(data || []);
    setCarregando(false);
  };

  const abrirEdicao = (f: Fornecedor) => {
    setEditando(f);
    setNovo({ nome: f.nome, categoria: f.categoria || categorias[0], produto_servico: f.produto_servico, contato: f.contato, valor_mensal: String(f.valor_mensal) });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" });
  };

  const salvar = async () => {
    if (!novo.nome || !novo.valor_mensal) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { nome: novo.nome, produto_servico: novo.produto_servico, contato: novo.contato, valor_mensal: parseFloat(novo.valor_mensal), categoria: novo.categoria };
    editando
      ? await supabase.from("fornecedores").update(payload).eq("id", editando.id)
      : await supabase.from("fornecedores").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarFornecedores(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("fornecedores").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
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
      pdf.text(`${t.fornecedores.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const fornecedoresFiltrados = fornecedores.filter(f => f.nome.toLowerCase().includes(busca.toLowerCase()));
  const totalMensal = fornecedores.reduce((acc, f) => acc + f.valor_mensal, 0);

  return (
    <ModuloLayout
      titulo={t.fornecedores.titulo}
      subtitulo={t.fornecedores.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" }); setModalAberto(true); }}
      labelBotao={t.fornecedores.novoFornecedor}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.fornecedores.gastoMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.fornecedores.gastoAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, cor: "#fbbf24" },
            { label: t.fornecedores.totalFornecedores, value: `${fornecedores.length} ${t.fornecedores.ativos}`, cor: "#6ab0ff" },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor} corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
          <div className="flex items-center gap-2">
            <Search size={16} style={{ color: "#3a5a8a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Tabela */}
        <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="text-center py-12"><p style={{ color: "#3a5a8a" }}>{t.fornecedores.semFornecedores}</p></div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                      {[t.fornecedores.nome, t.geral.categoria, t.fornecedores.produto, t.fornecedores.contato, t.geral.mensal, t.geral.anual, t.geral.acoes].map(h => (
                        <th key={h} className="text-left px-4 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedoresFiltrados.map((f, i) => (
                      <motion.tr key={f.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ borderBottom: i < fornecedoresFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                            <span className="text-sm" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span></td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#c8d8f0" }}>{f.produto_servico}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#3a5a8a" }}>{f.contato}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#f87171" }}>R$ {f.valor_mensal.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#fbbf24" }}>R$ {(f.valor_mensal * 12).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y" style={{ borderColor: "rgba(59,111,212,0.08)" }}>
                {fornecedoresFiltrados.map((f) => (
                  <div key={f.id} className="py-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                        <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                      </div>
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs ml-11">
                      <span className="px-2 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span>
                      <span style={{ color: "#3a5a8a" }}>{f.produto_servico}</span>
                    </div>
                    <div className="flex justify-between ml-11 text-xs">
                      <span style={{ color: "#3a5a8a" }}>{f.contato}</span>
                      <div className="flex gap-3">
                        <span className="font-bold" style={{ color: "#f87171" }}>R$ {f.valor_mensal.toLocaleString("pt-BR")}/mês</span>
                        <span className="font-bold" style={{ color: "#fbbf24" }}>R$ {(f.valor_mensal * 12).toLocaleString("pt-BR")}/ano</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CanvasBox>
      </div>

      {/* Modal Premium */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto"
            >
              <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>
                      AXIOMA AI.TECH
                    </motion.p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>
                      {editando ? t.fornecedores.salvarFornecedor : t.fornecedores.novoFornecedor}
                    </h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t.fornecedores.nome, key: "nome", type: "text" },
                    { label: t.fornecedores.produto, key: "produto_servico", type: "text" },
                    { label: t.fornecedores.contato, key: "contato", type: "text" },
                    { label: t.fornecedores.valorMensal, key: "valor_mensal", type: "number" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                      <input type={type} value={(novo as any)[key]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(106,176,255,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fornecedores.salvarFornecedor}
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