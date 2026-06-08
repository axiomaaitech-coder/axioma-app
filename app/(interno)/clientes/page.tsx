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

type Cliente = {
  id: string; nome: string; email: string; telefone: string;
  documento: string; cidade: string; status: string;
  user_id: string; empresa_id: string; created_at: string;
};

type Conta = {
  id: string; descricao: string; valor: number; data_vencimento: string;
  data_recebimento: string | null; status: string; cliente_id: string | null;
  user_id: string; empresa_id: string; created_at: string;
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
    const chars = "AXIOMA CLIENTES AI TECH R$ 0 1 2 3 4 5 6 7 8 9 % CRM".split(" ").map((c) => ({
      char: c, x: Math.random() * 100, y: Math.random() * 100,
      size: Math.random() * 28 + 14, opacity: Math.random() * 0.06 + 0.02,
      speed: Math.random() * 0.25 + 0.08,
      color: ["#6ab0ff", "#34d399", "#fbbf24", "#a78bfa"][Math.floor(Math.random() * 4)],
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

export default function ClientesPage() {
  const { t, idioma } = useLanguage();
  const cl = t.clientes;
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [aba, setAba] = useState<"clientes" | "contas">("clientes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [exportando, setExportando] = useState(false);

  const [modalCliente, setModalCliente] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [cidadeCliente, setCidadeCliente] = useState("");
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [modalConta, setModalConta] = useState(false);
  const [descricaoConta, setDescricaoConta] = useState("");
  const [valorConta, setValorConta] = useState("");
  const [vencimentoConta, setVencimentoConta] = useState("");
  const [clienteConta, setClienteConta] = useState("");
  const [salvandoConta, setSalvandoConta] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const { data: clientesData } = await supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: contasData } = await supabase.from("contas_receber").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true });
    setClientes(clientesData || []);
    setContas(contasData || []);
    setLoading(false);
  }

  async function salvarCliente() {
    if (!nomeCliente.trim()) return;
    setSalvandoCliente(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editandoCliente) {
      await supabase.from("clientes").update({ nome: nomeCliente, email: emailCliente, telefone: telefoneCliente, documento: documentoCliente, cidade: cidadeCliente }).eq("id", editandoCliente.id);
    } else {
      await supabase.from("clientes").insert({ nome: nomeCliente, email: emailCliente, telefone: telefoneCliente, documento: documentoCliente, cidade: cidadeCliente, status: "ativo", user_id: user.id, empresa_id: empresaId });
    }
    fecharModalCliente(); setSalvandoCliente(false); carregarDados();
  }

  async function excluirCliente(id: string) {
    await supabase.from("clientes").delete().eq("id", id); carregarDados();
  }

  async function salvarConta() {
    if (!descricaoConta.trim() || !valorConta || !vencimentoConta) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("contas_receber").insert({ descricao: descricaoConta, valor: parseFloat(valorConta), data_vencimento: vencimentoConta, status: "pendente", cliente_id: clienteConta || null, user_id: user.id, empresa_id: empresaId });
    setModalConta(false);
    setDescricaoConta(""); setValorConta(""); setVencimentoConta(""); setClienteConta("");
    setSalvandoConta(false); carregarDados();
  }

  async function marcarRecebido(id: string) {
    await supabase.from("contas_receber").update({ status: "recebido", data_recebimento: new Date().toISOString().split("T")[0] }).eq("id", id);
    carregarDados();
  }

  function abrirEditarCliente(cliente: Cliente) {
    setEditandoCliente(cliente); setNomeCliente(cliente.nome); setEmailCliente(cliente.email || "");
    setTelefoneCliente(cliente.telefone || ""); setDocumentoCliente(cliente.documento || ""); setCidadeCliente(cliente.cidade || "");
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false); setEditandoCliente(null);
    setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente("");
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
      pdf.text(`${cl.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-clientes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const hoje = new Date().toISOString().split("T")[0];
  const totalReceber = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido").reduce((s, c) => s + c.valor, 0);
  const totalVencido = contas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);
  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const contasFiltradas = contas.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function getStatusCor(status: string, vencimento: string) {
    if (status === "recebido") return { cor: "#34d399", bg: "rgba(52,211,153,0.1)", label: cl.recebido };
    if (vencimento < hoje) return { cor: "#f87171", bg: "rgba(248,113,113,0.1)", label: cl.vencido };
    return { cor: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: cl.pendente };
  }

  const botaoCobranca = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalConta(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cl.novaCobranca}
    </motion.button>
  );

  return (
    <ModuloLayout titulo={`👥 ${cl.titulo}`} subtitulo={cl.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCliente(null); setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente(""); setModalCliente(true); }}
      labelBotao={cl.novoCliente} botaoExtra={botaoCobranca}>
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
            { label: cl.totalReceber, valor: fmt(totalReceber), cor: "#fbbf24" },
            { label: cl.totalRecebido, valor: fmt(totalRecebido), cor: "#34d399" },
            { label: cl.totalVencido, valor: fmt(totalVencido), cor: "#f87171" },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <CanvasBox cor={card.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <p className="text-xl font-black" style={{ color: card.cor, textShadow: `0 0 20px ${card.cor}60` }}>{card.valor}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {[{ key: "clientes", label: cl.abaClientes }, { key: "contas", label: cl.abaContas }].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBusca(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}`, boxShadow: aba === a.key ? "0 0 12px rgba(106,176,255,0.2)" : "none" }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4" corB="#6ab0ff" corC="#34d399" corD="#a78bfa">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cl.buscar}
            className="w-full text-sm focus:outline-none bg-transparent py-1"
            style={{ color: "#c8d8f0" }} />
        </CanvasBox>

        {/* Lista Clientes */}
        {aba === "clientes" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <CanvasBox cor="#6ab0ff">
                <div className="p-8 text-center"><p style={{ color: "#3a5a8a" }}>{cl.semClientes}</p></div>
              </CanvasBox>
            ) : clientesFiltrados.map((cliente, i) => (
              <motion.div key={cliente.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <motion.div whileHover={{ scale: 1.1 }}
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-black"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 12px rgba(106,176,255,0.3)" }}>
                        {cliente.nome.charAt(0).toUpperCase()}
                      </motion.div>
                      <div className="min-w-0">
                        <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                          className="text-xs font-black tracking-[0.2em] uppercase mb-0.5"
                          style={{ color: "#6ab0ff", fontSize: "9px" }}>AXIOMA AI.TECH</motion.p>
                        <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{cliente.nome}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "#3a5a8a" }}>{cliente.email}{cliente.telefone ? ` • ${cliente.telefone}` : ""}</p>
                        {cliente.cidade && <p className="text-xs" style={{ color: "#3a5a8a" }}>{cliente.cidade}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                        {cliente.status === "ativo" ? cl.ativo : cl.inativo}
                      </span>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCliente(cliente)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                      <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCliente(cliente.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                    </div>
                  </div>
                </CanvasBox>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lista Contas */}
        {aba === "contas" && (
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : contasFiltradas.length === 0 ? (
              <CanvasBox cor="#34d399">
                <div className="p-8 text-center"><p style={{ color: "#3a5a8a" }}>{cl.semContas}</p></div>
              </CanvasBox>
            ) : contasFiltradas.map((conta, i) => {
              const cliente = clientes.find(c => c.id === conta.cliente_id);
              const statusInfo = getStatusCor(conta.status, conta.data_vencimento);
              return (
                <motion.div key={conta.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor={statusInfo.cor} corB="#6ab0ff" corC="#a78bfa" corD="#f472b6">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                          className="text-xs font-black tracking-[0.2em] uppercase mb-0.5"
                          style={{ color: statusInfo.cor, fontSize: "9px" }}>AXIOMA AI.TECH</motion.p>
                        <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{conta.descricao}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>
                          {cliente ? `${cliente.nome} • ` : ""}{cl.vencimento}: {new Date(conta.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black" style={{ color: statusInfo.cor, textShadow: `0 0 10px ${statusInfo.cor}40` }}>{fmt(conta.valor)}</p>
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.cor }}>{statusInfo.label}</span>
                        {conta.status === "pendente" && (
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                            onClick={() => marcarRecebido(conta.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                            {cl.marcarRecebido}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      <AnimatePresence>
        {modalCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff" corB="#34d399" corC="#a78bfa" corD="#f472b6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: "#6ab0ff", textShadow: "0 0 20px #6ab0ff" }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoCliente ? cl.editarCliente : cl.novoCliente}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalCliente} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: cl.nome, value: nomeCliente, set: setNomeCliente },
                    { label: cl.email, value: emailCliente, set: setEmailCliente },
                    { label: cl.telefone, value: telefoneCliente, set: setTelefoneCliente },
                    { label: cl.documento, value: documentoCliente, set: setDocumentoCliente },
                    { label: cl.cidade, value: cidadeCliente, set: setCidadeCliente },
                  ].map((campo) => (
                    <div key={campo.label}>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input value={campo.value} onChange={(e) => campo.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModalCliente} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(106,176,255,0.4)" }} whileTap={{ scale: 0.98 }}
                      onClick={salvarCliente} disabled={salvandoCliente}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {salvandoCliente ? "..." : cl.salvarCliente}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Conta */}
      <AnimatePresence>
        {modalConta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399" corB="#6ab0ff" corC="#a78bfa" corD="#fbbf24">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <motion.p animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity }}
                      className="text-xs font-black tracking-[0.3em] uppercase mb-1"
                      style={{ color: "#34d399", textShadow: "0 0 20px #34d399" }}>AXIOMA AI.TECH</motion.p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cl.novaCobranca}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalConta(false)} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: cl.descricao, value: descricaoConta, set: setDescricaoConta, type: "text" },
                    { label: cl.valor, value: valorConta, set: setValorConta, type: "number" },
                    { label: cl.vencimento, value: vencimentoConta, set: setVencimentoConta, type: "date" },
                  ].map((campo) => (
                    <div key={campo.label}>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input type={campo.type} value={campo.value} onChange={(e) => campo.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.cliente}</label>
                    <select value={clienteConta} onChange={(e) => setClienteConta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {cl.cliente} --</option>
                      {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConta(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(52,211,153,0.4)" }} whileTap={{ scale: 0.98 }}
                      onClick={salvarConta} disabled={salvandoConta}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                      {salvandoConta ? "..." : cl.salvarCobranca}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}