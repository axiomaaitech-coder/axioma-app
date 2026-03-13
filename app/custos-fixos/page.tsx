"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ArrowLeft, Trash2, X, Download } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Aluguel/Imóvel","Folha de pagamento","Serviços essenciais","Sistemas e assinaturas","Seguros","Contabilidade","Outros"];

type CustoFixo = {
  id: string;
  descricao: string;
  valor_mensal: number;
  dia_vencimento: number;
  categoria: string;
};

export default function CustosFixos() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [novo, setNovo] = useState({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarCustos(); }, []);

  const carregarCustos = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase
      .from("custos_fixos")
      .select("*")
      .eq("user_id", user.id)
      .order("dia_vencimento", { ascending: true });
    setCustos(data || []);
    setCarregando(false);
  };

  const adicionarCusto = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const { error } = await supabase.from("custos_fixos").insert({
      descricao: novo.descricao,
      valor_mensal: parseFloat(novo.valor),
      dia_vencimento: parseInt(novo.vencimento || "1"),
      categoria: novo.categoria,
      user_id: user.id,
    });
    if (!error) {
      setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
      setModalAberto(false);
      await carregarCustos();
    }
    setSalvando(false);
  };

  const excluirCusto = async (id: string) => {
    await supabase.from("custos_fixos").delete().eq("id", id);
    setCustos(custos.filter(c => c.id !== id));
  };

  const exportarPDF = () => {
    setExportando(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();

      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        `${t.custosFixos.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`,
        pdfWidth - 14, 13, { align: "right" }
      );

      pdf.setFontSize(10);
      pdf.setTextColor(200, 216, 240);
      pdf.text(`Total Mensal: R$ ${totalMensal.toLocaleString("pt-BR")}`, 14, 30);
      pdf.text(`Total Anual: R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, 14, 37);
      pdf.text(`Itens: ${custos.length}`, 14, 44);

      autoTable(pdf, {
        startY: 50,
        head: [[t.geral.descricao, t.geral.categoria, t.custosFixos.vencimento, t.custosFixos.valorMensal, t.custosFixos.valorAnual]],
        body: custosFiltrados.map(c => [
          c.descricao,
          c.categoria,
          `Dia ${c.dia_vencimento}`,
          `R$ ${c.valor_mensal.toLocaleString("pt-BR")}`,
          `R$ ${(c.valor_mensal * 12).toLocaleString("pt-BR")}`,
        ]),
        styles: { fontSize: 9, textColor: [200, 216, 240], fillColor: [10, 22, 40] },
        headStyles: { fillColor: [26, 58, 143], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [15, 30, 55] },
        theme: "grid",
      });

      pdf.save(`axioma-custos-fixos-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const custosFiltrados = custos.filter(c =>
    c.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const totalMensal = custos.reduce((acc, c) => acc + c.valor_mensal, 0);

  return (
    <div className="min-h-screen p-8 overflow-auto" style={{background: "#020810"}}>
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button onClick={() => router.push("/dashboard")} style={{color: "#3a5a8a"}}><ArrowLeft size={20}/></button>
            <h2 className="text-2xl font-bold" style={{color: "#c8d8f0"}}>{t.custosFixos.titulo}</h2>
          </div>
          <p className="text-sm" style={{color: "#3a5a8a"}}>{t.custosFixos.subtitulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-60" style={{background: "#dc2626", color: "#fff"}}>
            <Download size={18}/>{exportando ? "Gerando..." : "Exportar PDF"}
          </button>
          <button onClick={() => setModalAberto(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all hover:scale-105" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
            <Plus size={18}/>{t.custosFixos.novoCusto}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: t.custosFixos.totalMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
          { label: t.custosFixos.totalAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, color: "#fbbf24" },
          { label: t.custosFixos.itens, value: `${custos.length}`, color: "#6ab0ff" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
            <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{color: "#3a5a8a"}}>{card.label}</p>
            <p className="text-2xl font-bold" style={{color: card.color}}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6 px-4 py-3 rounded-xl" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        <Search size={16} style={{color: "#3a5a8a"}}/>
        <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosFixos.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{color: "#c8d8f0"}}/>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)"}}>
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <p style={{color: "#3a5a8a"}}>{t.geral.carregando}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{borderBottom: "1px solid rgba(59,111,212,0.15)"}}>
                {[t.geral.descricao, t.geral.categoria, t.custosFixos.vencimento, t.custosFixos.valorMensal, t.custosFixos.valorAnual, t.geral.acoes].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{color: "#3a5a8a"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {custosFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12" style={{color: "#3a5a8a"}}>{t.custosFixos.semCustos}</td></tr>
              ) : custosFiltrados.map((c, i) => (
                <tr key={c.id} style={{borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none"}}>
                  <td className="px-6 py-4 text-sm" style={{color: "#c8d8f0"}}>{c.descricao}</td>
                  <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{background: "rgba(59,111,212,0.1)", color: "#6ab0ff"}}>{c.categoria}</span></td>
                  <td className="px-6 py-4 text-sm" style={{color: "#3a5a8a"}}>Dia {c.dia_vencimento}</td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: "#f87171"}}>R$ {c.valor_mensal.toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4 text-sm font-bold" style={{color: "#fbbf24"}}>R$ {(c.valor_mensal * 12).toLocaleString("pt-BR")}</td>
                  <td className="px-6 py-4"><button onClick={() => excluirCusto(c.id)} style={{color: "#f87171"}}><Trash2 size={16}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{background: "rgba(0,0,0,0.7)"}}>
          <div className="w-full max-w-md rounded-2xl p-8" style={{background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)"}}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{color: "#c8d8f0"}}>{t.custosFixos.novoCusto}</h3>
              <button onClick={() => setModalAberto(false)} style={{color: "#3a5a8a"}}><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.descricao}</label>
                <input value={novo.descricao} onChange={(e) => setNovo({...novo, descricao: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.custosFixos.valorMensal}</label>
                <input type="number" value={novo.valor} onChange={(e) => setNovo({...novo, valor: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.custosFixos.vencimento}</label>
                <input type="number" value={novo.vencimento} onChange={(e) => setNovo({...novo, vencimento: e.target.value})} placeholder="1-31" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}/>
              </div>
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{color: "#5a8fd4"}}>{t.geral.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({...novo, categoria: e.target.value})} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0"}}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={adicionarCusto} disabled={salvando} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60" style={{background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff"}}>
                {salvando ? t.geral.carregando : t.custosFixos.salvarCusto}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}