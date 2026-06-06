"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Trash2, X, Pencil } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ModuloLayout from "../../../components/ModuloLayout";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Marketing","Logística","Matéria-prima","Comissões","Embalagens","Outros"];

type CustoVariavel = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
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

export default function CustosVariaveis() {
  const { t, idioma } = useLanguage();
  const [custos, setCustos] = useState<CustoVariavel[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CustoVariavel | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0] });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarCustos(); }, []);

  const carregarCustos = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("custos_variaveis").select("*").eq("user_id", user.id).order("data", { ascending: false });
    setCustos(data || []);
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0] });
  };

  const abrirEdicao = (custo: CustoVariavel) => {
    setEditando(custo);
    setNovo({ descricao: custo.descricao, valor: String(custo.valor), data: custo.data, categoria: custo.categoria });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, valor: parseFloat(novo.valor), data: novo.data || new Date().toISOString().slice(0, 10), categoria: novo.categoria };
    const { error } = editando
      ? await supabase.from("custos_variaveis").update(payload).eq("id", editando.id)
      : await supabase.from("custos_variaveis").insert({ ...payload, user_id: user.id });
    if (!error) { fecharModal(); await carregarCustos(); }
    setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("custos_variaveis").delete().eq("id", id);
    setCustos(custos.filter(c => c.id !== id));
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
      pdf.text(`${t.custosVariaveis.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-custos-variaveis-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMes = custos.reduce((acc, c) => acc + c.valor, 0);
  const maiorCusto = custos.length > 0 ? Math.max(...custos.map(c => c.valor)) : 0;

  return (
    <ModuloLayout
      titulo={t.custosVariaveis.titulo}
      subtitulo={t.custosVariaveis.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      labelBotao={t.custosVariaveis.novoCusto}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0] }); setModalAberto(true); }}
    >
      <div ref={conteudoRef} className="space-y-4">

        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.custosVariaveis.totalMes, value: `R$ ${totalMes.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.custosVariaveis.lancamentos, value: `${custos.length}`, cor: "#6ab0ff" },
            { label: t.custosVariaveis.maiorCusto, value: `R$ ${maiorCusto.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
          ].map((card) => (
            <NeonBox key={card.label} cor={card.cor}>
              <div className="p-3 md:p-5">
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <p className="text-base md:text-2xl font-bold" style={{ color: card.cor }}>{card.value}</p>
              </div>
            </NeonBox>
          ))}
        </div>

        <NeonBox cor="#3b6fd4">
          <div className="flex items-center gap-2 px-4 py-3">
            <Search size={16} style={{ color: "#3a5a8a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosVariaveis.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </NeonBox>

        <NeonBox cor="#6ab0ff">
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                    {[t.geral.descricao, t.geral.categoria, t.geral.data, t.geral.valor, t.geral.acoes].map(h => (
                      <th key={h} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {custosFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color: "#3a5a8a" }}>{t.custosVariaveis.semCustos}</td></tr>
                  ) : custosFiltrados.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}
                    >
                      <td className="px-4 md:px-6 py-3 text-sm" style={{ color: "#c8d8f0" }}>{c.descricao}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{c.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#3a5a8a" }}>{new Date(c.data).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-bold whitespace-nowrap" style={{ color: "#f87171" }}>R$ {c.valor.toLocaleString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(c)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </NeonBox>
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl p-6 md:p-8 relative"
              style={{ background: "rgba(6,15,30,0.98)", border: "1px solid rgba(248,113,113,0.25)", boxShadow: "0 0 60px rgba(248,113,113,0.12)" }}
            >
              <div className="absolute top-0 left-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #f87171, transparent)", boxShadow: "0 0 12px #f87171" }} />
              <div className="absolute top-0 left-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(180deg, #f87171, transparent)", boxShadow: "0 0 12px #f87171" }} />
              <div className="absolute bottom-0 right-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(270deg, #fbbf24, transparent)", boxShadow: "0 0 12px #fbbf24" }} />
              <div className="absolute bottom-0 right-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(0deg, #fbbf24, transparent)", boxShadow: "0 0 12px #fbbf24" }} />

              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Custo Variável" : t.custosVariaveis.novoCusto}</h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
              </div>

              <div className="space-y-4">
                {[
                  { label: t.geral.descricao, key: "descricao", type: "text" },
                  { label: t.geral.valor, key: "valor", type: "number" },
                  { label: t.geral.data, key: "data", type: "date" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                    <input type={type} value={novo[key as keyof typeof novo]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                  <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                    {categorias.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(248,113,113,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={salvar} disabled={salvando}
                  className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}
                >
                  {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.custosVariaveis.salvarCusto}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}