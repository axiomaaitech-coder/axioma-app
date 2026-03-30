"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Trash2, Pencil, X } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
    setModalAberto(false);
    setEditando(null);
    setNovo({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" });
  };

  const salvarFornecedor = async () => {
    if (!novo.nome || !novo.valor_mensal) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }

    if (editando) {
      await supabase.from("fornecedores").update({
        nome: novo.nome, produto_servico: novo.produto_servico,
        contato: novo.contato, valor_mensal: parseFloat(novo.valor_mensal),
        categoria: novo.categoria,
      }).eq("id", editando.id);
    } else {
      await supabase.from("fornecedores").insert({
        nome: novo.nome, produto_servico: novo.produto_servico,
        contato: novo.contato, valor_mensal: parseFloat(novo.valor_mensal),
        categoria: novo.categoria, user_id: user.id,
      });
    }

    fecharModal();
    await carregarFornecedores();
    setSalvando(false);
  };

  const excluirFornecedor = async (id: string) => {
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
      pdf.text(`${t.fornecedores.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      onNovo={() => setModalAberto(true)}
      labelBotao={t.fornecedores.novoFornecedor}
    >
      <div ref={conteudoRef}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {[
            { label: t.fornecedores.gastoMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, color: "#f87171" },
            { label: t.fornecedores.gastoAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, color: "#fbbf24" },
            { label: t.fornecedores.totalFornecedores, value: `${fornecedores.length} ${t.fornecedores.ativos}`, color: "#6ab0ff" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          <Search size={16} style={{ color: "#3a5a8a" }} />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
          {carregando ? (
            <div className="flex items-center justify-center py-16"><p style={{ color: "#3a5a8a" }}>{t.geral.carregando}</p></div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="text-center py-12"><p style={{ color: "#3a5a8a" }}>{t.fornecedores.semFornecedores}</p></div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                      {[t.fornecedores.nome, t.geral.categoria, t.fornecedores.produto, t.fornecedores.contato, t.geral.mensal, t.geral.anual, t.geral.acoes].map(h => (
                        <th key={h} className="text-left px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#3a5a8a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedoresFiltrados.map((f, i) => (
                      <tr key={f.id} style={{ borderBottom: i < fornecedoresFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                            <span className="text-sm" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span></td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#c8d8f0" }}>{f.produto_servico}</td>
                        <td className="px-6 py-4 text-sm" style={{ color: "#3a5a8a" }}>{f.contato}</td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: "#f87171" }}>R$ {f.valor_mensal.toLocaleString("pt-BR")}</td>
                        <td className="px-6 py-4 text-sm font-bold" style={{ color: "#fbbf24" }}>R$ {(f.valor_mensal * 12).toLocaleString("pt-BR")}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></button>
                            <button onClick={() => excluirFornecedor(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y" style={{ borderColor: "rgba(59,111,212,0.08)" }}>
                {fornecedoresFiltrados.map((f) => (
                  <div key={f.id} className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                        <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></button>
                        <button onClick={() => excluirFornecedor(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></button>
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
        </div>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 md:p-8" style={{ background: "#0a1628", border: "1px solid rgba(59,111,212,0.3)" }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? t.fornecedores.salvarFornecedor : t.fornecedores.novoFornecedor}</h3>
              <button onClick={fecharModal} style={{ color: "#3a5a8a" }}><X size={20} /></button>
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
                  <input type={type} value={(novo as any)[key]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                  {categorias.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={salvarFornecedor} disabled={salvando} className="w-full py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fornecedores.salvarFornecedor}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModuloLayout>
  );
}