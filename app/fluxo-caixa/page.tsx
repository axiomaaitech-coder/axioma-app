"use client";
import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Pencil, Trash2, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const dadosMensais = [
  { mes: "Jan", entradas: 42000, saidas: 31000, saldo: 11000 },
  { mes: "Fev", entradas: 48000, saidas: 33000, saldo: 15000 },
  { mes: "Mar", entradas: 45000, saidas: 29000, saldo: 16000 },
  { mes: "Abr", entradas: 53000, saidas: 35000, saldo: 18000 },
  { mes: "Mai", entradas: 58000, saidas: 38000, saldo: 20000 },
  { mes: "Jun", entradas: 62000, saidas: 40000, saldo: 22000 },
];

const previsao = [
  { mes: "Jul", previsto: 65000, pessimista: 52000, otimista: 78000 },
  { mes: "Ago", previsto: 68000, pessimista: 54000, otimista: 82000 },
  { mes: "Set", previsto: 71000, pessimista: 56000, otimista: 86000 },
];

type Lancamento = {
  id: string;
  descricao: string;
  tipo: string;
  valor: number;
  data: string;
  status: string;
};

export default function FluxoCaixa() {
  const { t, idioma } = useLanguage();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Lancamento | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarLancamentos(); }, []);

  const carregarLancamentos = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase
      .from("fluxo_caixa")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false });
    setLancamentos(data || []);
    setCarregando(false);
  };

  const abrirEdicao = (l: Lancamento) => {
    setEditando(l);
    setNovo({ descricao: l.descricao, tipo: l.tipo, valor: String(l.valor), data: l.data, status: l.status });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
    setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  };

  const salvarLancamento = async () => {
    if (!novo.descricao || !novo.valor || !novo.data) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    if (editando) {
      await supabase.from("fluxo_caixa").update({
        descricao: novo.descricao,
        tipo: novo.tipo,
        valor: parseFloat(novo.valor),
        data: novo.data,
        status: novo.status,
      }).eq("id", editando.id);
    } else {
      await supabase.from("fluxo_caixa").insert({
        descricao: novo.descricao,
        tipo: novo.tipo,
        valor: parseFloat(novo.valor),
        data: novo.data,
        status: novo.status,
        user_id: user.id,
      });
    }

    fecharModal();
    await carregarLancamentos();
    setSalvando(false);
  };

  const excluirLancamento = async (id: string) => {
    await supabase.from("fluxo_caixa").delete().eq("id", id);
    setLancamentos(lancamentos.filter(l => l.id !== id));
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
      pdf.text(`${t.fluxoCaixa.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-fluxo-caixa-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const totalEntradas = lancamentos.filter(l => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const totalSaidas = lancamentos.filter(l => l.tipo === "saida").reduce((acc, l) => acc + l.valor, 0);
  const saldoAtual = totalEntradas - totalSaidas;

  return (
    <ModuloLayout
      titulo={t.fluxoCaixa.titulo}
      subtitulo={t.fluxoCaixa.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => setModalAberto(true)}
      labelBotao={t.fluxoCaixa.novoLancamento}
    >
      <div ref={conteudoRef}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t.fluxoCaixa.totalEntradas, value: `R$ ${totalEntradas.toLocaleString("pt-BR")}`, color: "#34d399", icon: TrendingUp },
            { label: t.fluxoCaixa.totalSaidas, value: `R$ ${totalSaidas.toLocaleString("pt-BR")}`, color: "#f87171", icon: TrendingDown },
            { label: t.fluxoCaixa.saldoAtual, value: `R$ ${saldoAtual.toLocaleString("pt-BR")}`, color: saldoAtual >= 0 ? "#34d399" : "#f87171", icon: saldoAtual >= 0 ? TrendingUp : AlertTriangle },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <card.icon size={16} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl p-4 md:p-6 mb-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#c8d8f0" }}>{t.fluxoCaixa.historico}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)" />
              <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#3a5a8a" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0" }} />
              <Legend />
              <Bar dataKey="entradas" fill="#3b6fd4" radius={[4, 4, 0, 0]} name={t.fluxoCaixa.totalEntradas} />
              <Bar dataKey="saidas" fill="#f87171" radius={[4, 4, 0, 0]} name={t.fluxoCaixa.totalSaidas} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-4 md:p-6 mb-6" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <h3 className="text-sm font-semibold mb-1" style={{ color: "#c8d8f0" }}>{t.fluxoCaixa.previsao}</h3>
          <p className="text-xs mb-4" style={{ color: "#3a5a8a" }}>{t.fluxoCaixa.cenarios}</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={previsao}>
              <defs>
                <linearGradient id="otimista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="pessimista" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,111,212,0.1)" />
              <XAxis dataKey="mes" stroke="#3a5a8a" tick={{ fontSize: 11 }} />
              <YAxis stroke="#3a5a8a" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)", borderRadius: "12px", color: "#c8d8f0" }} />
              <Legend />
              <Area type="monotone" dataKey="otimista" stroke="#34d399" fill="url(#otimista)" strokeWidth={2} name="Otimista" />
              <Area type="monotone" dataKey="previsto" stroke="#3b6fd4" strokeWidth={2} fill="none" name="Previsto" />
              <Area type="monotone" dataKey="pessimista" stroke="#f87171" fill="url(#pessimista)" strokeWidth={2} name="Pessimista" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <div className="px-4 md:px-6 py-4 border-b" style={{ borderColor: "rgba(59,111,212,0.15)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{t.fluxoCaixa.lancamentos}</h3>
          </div>
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <p style={{ color: "#3a5a8a" }}>{t.geral.carregando}</p>
            </div>
          ) : lancamentos.length === 0 ? (
            <div className="text-center py-12">
              <p style={{ color: "#3a5a8a" }}>{t.fluxoCaixa.semLancamentos}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                      {[t.geral.descricao, "Tipo", t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                        <th key={i} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lancamentos.map((l, i) => (
                      <tr key={l.id} style={{ borderBottom: i < lancamentos.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                        <td className="px-6 py-4 text-sm" style={{ color: "#c8d8f0" }}>{l.descricao}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                            {l.tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#3a5a8a" }}>{new Date(l.data).toLocaleDateString("pt-BR")}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? "#34d399" : "#fbbf24" }}>
                            {l.status === "realizado" ? t.fluxoCaixa.realizado : t.fluxoCaixa.previsto}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                          {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => abrirEdicao(l)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></button>
                            <button onClick={() => excluirLancamento(l.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y" style={{ borderColor: "rgba(59,111,212,0.08)" }}>
                {lancamentos.map((l) => (
                  <div key={l.id} className="p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{l.descricao}</span>
                      <span className="text-sm font-bold" style={{ color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                        {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? "#34d399" : "#f87171" }}>
                        {l.tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? "#34d399" : "#fbbf24" }}>
                        {l.status === "realizado" ? t.fluxoCaixa.realizado : t.fluxoCaixa.previsto}
                      </span>
                      <span className="text-xs" style={{ color: "#3a5a8a" }}>{new Date(l.data).toLocaleDateString("pt-BR")}</span>
                      <div className="ml-auto flex gap-2">
                        <button onClick={() => abrirEdicao(l)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></button>
                        <button onClick={() => excluirLancamento(l.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 md:p-8 max-h-screen overflow-y-auto" style={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>
                {editando ? "Editar Lançamento" : t.fluxoCaixa.novoLancamento}
              </h3>
              <button onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>Tipo</label>
                <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                  <option value="entrada">{t.fluxoCaixa.entrada}</option>
                  <option value="saida">{t.fluxoCaixa.saida}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.valor}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({ ...novo, valor: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
                <input type="date" value={novo.data} onChange={(e) => setNovo({ ...novo, data: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.status}</label>
                <select value={novo.status} onChange={(e) => setNovo({ ...novo, status: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                  <option value="previsto">{t.fluxoCaixa.previsto}</option>
                  <option value="realizado">{t.fluxoCaixa.realizado}</option>
                </select>
              </div>
              <button onClick={salvarLancamento} disabled={salvando} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fluxoCaixa.salvarLancamento}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}