"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Trash2 } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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

export default function Endividamento() {
  const { t, idioma } = useLanguage();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarDividas(); }, []);

  const carregarDividas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase
      .from("dividas")
      .select("*")
      .eq("user_id", user.id)
      .order("vencimento", { ascending: true });
    setDividas(data || []);
    setCarregando(false);
  };

  const adicionarDivida = async () => {
    if (!novo.descricao || !novo.valor_total) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const { error } = await supabase.from("dividas").insert({
      descricao: novo.descricao,
      tipo: novo.tipo,
      valor_total: parseFloat(novo.valor_total),
      valor_pago: parseFloat(novo.valor_pago || "0"),
      parcelas: parseInt(novo.parcelas || "1"),
      vencimento: novo.vencimento,
      taxa_juros: parseFloat(novo.taxa_juros || "0"),
      user_id: user.id,
    });
    if (!error) {
      setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
      setModalAberto(false);
      await carregarDividas();
    }
    setSalvando(false);
  };

  const excluirDivida = async (id: string) => {
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

      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${t.endividamento.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });

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
      pdf.save(`axioma-endividamento-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const dividasFiltradas = dividas.filter(d =>
    d.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const totalDivida = dividas.reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = dividas.reduce((acc, d) => acc + d.valor_pago, 0);
  const totalRestante = totalDivida - totalPago;

  return (
    <ModuloLayout
      titulo={t.endividamento.titulo}
      subtitulo={t.endividamento.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => setModalAberto(true)}
      labelBotao={t.endividamento.novaDivida}
    >
      <div ref={conteudoRef}>
        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t.endividamento.totalDividas, value: `R$ ${totalDivida.toLocaleString("pt-BR")}`, color: "#f87171" },
            { label: t.endividamento.totalPago, value: `R$ ${totalPago.toLocaleString("pt-BR")}`, color: "#34d399" },
            { label: t.endividamento.saldoRestante, value: `R$ ${totalRestante.toLocaleString("pt-BR")}`, color: "#fbbf24" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <Search size={16} style={{ color: "#3a5a8a" }} />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t.endividamento.buscar}
            className="bg-transparent flex-1 focus:outline-none text-sm"
            style={{ color: "#c8d8f0" }}
          />
        </div>

        {/* Lista */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <p style={{ color: "#3a5a8a" }}>{t.geral.carregando}</p>
          </div>
        ) : dividasFiltradas.length === 0 ? (
          <div className="text-center py-12" style={{ color: "#3a5a8a" }}>{t.endividamento.semDividas}</div>
        ) : (
          <div className="space-y-4">
            {dividasFiltradas.map((d) => {
              const progresso = (d.valor_pago / d.valor_total) * 100;
              const restante = d.valor_total - d.valor_pago;
              return (
                <div key={d.id} className="rounded-2xl p-4 md:p-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
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
                      <button onClick={() => excluirDivida(d.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{t.endividamento.valorTotal}</p>
                      <p className="font-bold text-sm" style={{ color: "#f87171" }}>R$ {d.valor_total.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{t.endividamento.jaPago}</p>
                      <p className="font-bold text-sm" style={{ color: "#34d399" }}>R$ {d.valor_pago.toLocaleString("pt-BR")}</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{t.endividamento.restante}</p>
                      <p className="font-bold text-sm" style={{ color: "#fbbf24" }}>R$ {restante.toLocaleString("pt-BR")}</p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.progresso}</span>
                      <span className="text-xs font-bold" style={{ color: "#6ab0ff" }}>{progresso.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                      <div className="h-2 rounded-full" style={{ width: `${Math.min(progresso, 100)}%`, background: "linear-gradient(90deg, #1a3a8f, #2a5fd4)" }} />
                    </div>
                  </div>

                  <div className="flex justify-between mt-3 flex-wrap gap-1">
                    <span className="text-xs" style={{ color: "#3a5a8a" }}>{t.endividamento.vencimento}: {new Date(d.vencimento).toLocaleDateString("pt-BR")}</span>
                    <span className="text-xs" style={{ color: "#3a5a8a" }}>{d.parcelas}x {t.endividamento.parcelas}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 md:p-8 max-h-screen overflow-y-auto" style={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{t.endividamento.novaDivida}</h3>
              <button onClick={() => setModalAberto(false)} style={{ color: "#3a5a8a" }}>✕</button>
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
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.valorTotal}</label>
                  <input type="number" value={novo.valor_total} onChange={(e) => setNovo({ ...novo, valor_total: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.jaPago}</label>
                  <input type="number" value={novo.valor_pago} onChange={(e) => setNovo({ ...novo, valor_pago: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.parcelas}</label>
                  <input type="number" value={novo.parcelas} onChange={(e) => setNovo({ ...novo, parcelas: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.taxaJuros}</label>
                  <input type="number" value={novo.taxa_juros} onChange={(e) => setNovo({ ...novo, taxa_juros: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.vencimento}</label>
                <input type="date" value={novo.vencimento} onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <button onClick={adicionarDivida} disabled={salvando} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {salvando ? t.geral.carregando : t.endividamento.salvarDivida}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}