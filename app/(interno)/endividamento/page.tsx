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
  id: string;
  descricao: string;
  tipo: string;
  valor_total: number;
  valor_pago: number;
  parcelas: number;
  vencimento: string;
  taxa_juros: number;
};

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

export default function Endividamento() {
  const { t, idioma } = useLanguage();
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
    setModalAberto(false);
    setEditando(null);
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
    fecharModal();
    await carregarDividas();
    setSalvando(false);
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
    <ModuloLayout
      titulo={t.endividamento.titulo}
      subtitulo={t.endividamento.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" }); setModalAberto(true); }}
      labelBotao={t.endividamento.novaDivida}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.endividamento.totalDividas, value: `R$ ${totalDivida.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.endividamento.totalPago, value: `R$ ${totalPago.toLocaleString("pt-BR")}`, cor: "#34d399" },
            { label: t.endividamento.saldoRestante, value: `R$ ${totalRestante.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
          ].map((card) => (
            <NeonBox key={card.label} cor={card.cor}>
              <div className="p-5">
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <p className="text-2xl font-bold" style={{ color: card.cor }}>{card.value}</p>
              </div>
            </NeonBox>
          ))}
        </div>

        {/* Busca */}
        <NeonBox cor="#3b6fd4">
          <div className="flex items-center gap-2 px-4 py-3">
            <Search size={16} style={{ color: "#3a5a8a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.endividamento.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </NeonBox>

        {/* Lista */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dividasFiltradas.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#3a5a8a" }}>{t.endividamento.semDividas}</div>
        ) : (
          <div className="space-y-4">
            {dividasFiltradas.map((d, i) => {
              const progresso = (d.valor_pago / d.valor_total) * 100;
              const restante = d.valor_total - d.valor_pago;
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <NeonBox cor="#f87171">
                    <div className="p-4 md:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold mb-1" style={{ color: "#c8d8f0" }}>{d.descricao}</h3>
                          <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{d.tipo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{t.endividamento.taxaJuros}</p>
                            <p className="font-bold text-sm" style={{ color: "#fbbf24" }}>{d.taxa_juros}% a.m.</p>
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
                            <p className="font-bold text-sm" style={{ color: item.cor }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.progresso}</span>
                          <span className="text-xs font-bold" style={{ color: "#6ab0ff" }}>{progresso.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progresso, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full"
                            style={{ background: "linear-gradient(90deg, #1a3a8f, #2a5fd4)" }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between mt-3 flex-wrap gap-1">
                        <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.vencimento}: {new Date(d.vencimento).toLocaleDateString("pt-BR")}</span>
                        <span className="text-xs" style={{ color: "#3a5a8a" }}>{d.parcelas}x {t.endividamento.parcelas}</span>
                      </div>
                    </div>
                  </NeonBox>
                </motion.div>
              );
            })}
          </div>
        )}
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
              className="w-full max-w-md rounded-2xl p-6 md:p-8 max-h-screen overflow-y-auto relative"
              style={{ background: "rgba(6,15,30,0.98)", border: "1px solid rgba(248,113,113,0.25)", boxShadow: "0 0 60px rgba(248,113,113,0.12)" }}
            >
              <div className="absolute top-0 left-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #f87171, transparent)", boxShadow: "0 0 12px #f87171" }} />
              <div className="absolute top-0 left-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(180deg, #f87171, transparent)", boxShadow: "0 0 12px #f87171" }} />
              <div className="absolute bottom-0 right-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(270deg, #fbbf24, transparent)", boxShadow: "0 0 12px #fbbf24" }} />
              <div className="absolute bottom-0 right-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(0deg, #fbbf24, transparent)", boxShadow: "0 0 12px #fbbf24" }} />

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Dívida" : t.endividamento.novaDivida}</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                  <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                  <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
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
                      <input type="number" value={novo[key as keyof typeof novo]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.vencimento}</label>
                  <input type="date" value={novo.vencimento} onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(248,113,113,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={salvar} disabled={salvando}
                  className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}
                >
                  {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.endividamento.salvarDivida}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}