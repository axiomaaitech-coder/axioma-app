"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Vendas de produtos","Prestação de serviços","Recorrentes","Eventuais","Outras"];

type Receita = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  status: string;
};

export default function Receitas() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const conteudoRef = useRef<HTMLDivElement>(null);

  useEffect(() => { carregarReceitas(); }, []);

  const carregarReceitas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("receitas").select("*").eq("user_id", user.id).order("data", { ascending: false });
    setReceitas(data || []);
    setCarregando(false);
  };

  const adicionarReceita = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const { error } = await supabase.from("receitas").insert({
      descricao: novo.descricao, valor: parseFloat(novo.valor),
      data: novo.data || new Date().toISOString().slice(0, 10),
      categoria: novo.categoria, status: novo.status, user_id: user.id,
    });
    if (!error) {
      setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
      setModalAberto(false);
      await carregarReceitas();
    }
    setSalvando(false);
  };

  const excluirReceita = async (id: string) => {
    await supabase.from("receitas").delete().eq("id", id);
    setReceitas(receitas.filter(r => r.id !== id));
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
      pdf.text(`${t.receitas.titulo} — ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-receitas-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const receitasFiltradas = receitas.filter(r =>
    r.descricao.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroCategoria === "todas" || r.categoria === filtroCategoria)
  );

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalRecebido = receitas.filter(r => r.status === "recebido").reduce((acc, r) => acc + r.valor, 0);
  const totalPendente = receitas.filter(r => r.status === "pendente").reduce((acc, r) => acc + r.valor, 0);

  return (
    <div className="min-h-screen p-4 md:p-8 overflow-auto" style={{background: "#020810"}}>

      {/* Header mobile-friendly */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
          <h2 className="text-xl md:text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.receitas.titulo}</h2>
        </div>
        <p className="text-sm ml-7" style={{color: "#3a5a8a"}}>{t.receitas.subtitulo}</p>
        <div className="flex gap-2 mt-4 flex-wrap">
          <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-60" style={{background: "#dc2626", color: "#fff"}}>
            <Download size={16}/>{exportando ? "Gerando..." : "Exportar PDF"}
          </button>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={16}/>{t.receitas.novaReceita}
          </button>
        </div>
      </div>

      <div ref={conteudoRef}>
        {/* Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          {[
            { label: t.receitas.totalReceitas, value: `R$ ${totalReceitas.toLocaleString("pt-BR")}`, color: "#6ab0ff" },
            { label: t.receitas.recebido, value: `R$ ${totalRecebido.toLocaleString("pt-BR")}`, color: "#34d399" },
            { label: t.receitas.pendente, value: `R$ ${totalPendente.toLocaleString("pt-BR")}`, color: "#fbbf24" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-3 md:p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{color: "#3a5a8a"}}>{card.label}</p>
              <p className="text-base md:text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex items-center gap-2 flex-1 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <Search size={16} style={{color: "#3a5a8a"}}/>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.receitas.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
          </div>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0"}}>
            <option value="todas">{t.geral.todas}</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Tabela — scroll horizontal no mobile */}
        <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <p style={{color: "#3a5a8a"}}>{t.geral.carregando}</p>
              </div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
                    {[t.geral.descricao, t.geral.categoria, t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                      <th key={i} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receitasFiltradas.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm" style={{color: "#3a5a8a"}}>{t.receitas.semReceitas}</td></tr>
                  ) : receitasFiltradas.map((r, i) => (
                    <tr key={r.id} style={{borderBottom: i < receitasFiltradas.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                      <td className="px-4 md:px-6 py-3 text-sm" style={{color: "#c8d8f0"}}>{r.descricao}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{r.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{color: "#3a5a8a"}}>{new Date(r.data).toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{background: r.status === "recebido" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: r.status === "recebido" ? "#34d399" : "#fbbf24"}}>{r.status === "recebido" ? t.receitas.recebido : t.receitas.pendente}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm font-bold whitespace-nowrap" style={{color: "#34d399"}}>R$ {r.valor.toLocaleString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3"><button onClick={() => excluirReceita(r.id)} style={{color: "#f87171"}}><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-6 md:p-8 max-h-screen overflow-y-auto" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.receitas.novaReceita}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.valor}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.data}</label>
                <input type="date" value={novo.data} onChange={(e) => setNovo({...novo, data: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.receitas.status}</label>
                <select value={novo.status} onChange={(e) => setNovo({...novo, status: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  <option value="recebido">{t.receitas.recebido}</option>
                  <option value="pendente">{t.receitas.pendente}</option>
                </select>
              </div>
              <button onClick={adicionarReceita} disabled={salvando} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {salvando ? t.geral.carregando : t.receitas.salvarReceita}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}