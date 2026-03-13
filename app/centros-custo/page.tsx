"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Centro = {
  id: string;
  nome: string;
  descricao: string;
  cor: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

type Lancamento = {
  id: string;
  descricao: string;
  valor: number;
  tipo: "custo" | "receita";
  data: string;
  centro_id: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

export default function CentrosCustoPage() {
  const { t, idioma } = useLanguage();
  const cc = t.centrosCusto;
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCentro, setEditandoCentro] = useState<Centro | null>(null);
  const [nomeCentro, setNomeCentro] = useState("");
  const [descricaoCentro, setDescricaoCentro] = useState("");
  const [corCentro, setCorCentro] = useState("#6ab0ff");
  const [salvandoCentro, setSalvandoCentro] = useState(false);

  const [modalLancamento, setModalLancamento] = useState(false);
  const [descricaoLanc, setDescricaoLanc] = useState("");
  const [valorLanc, setValorLanc] = useState("");
  const [tipoLanc, setTipoLanc] = useState<"custo" | "receita">("custo");
  const [dataLanc, setDataLanc] = useState(new Date().toISOString().split("T")[0]);
  const [centroLanc, setCentroLanc] = useState("");
  const [salvandoLanc, setSalvandoLanc] = useState(false);

  const [busca, setBusca] = useState("");

  const cores = ["#6ab0ff", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee"];

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);

    const { data: centrosData } = await supabase.from("centros_custo").select("*").eq("user_id", user.id).order("created_at", { ascending: true });
    const { data: lancamentosData } = await supabase.from("lancamentos_centro").select("*").eq("user_id", user.id).order("data", { ascending: false });

    setCentros(centrosData || []);
    setLancamentos(lancamentosData || []);
    setLoading(false);
  }

  async function salvarCentro() {
    if (!nomeCentro.trim()) return;
    setSalvandoCentro(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editandoCentro) {
      await supabase.from("centros_custo").update({ nome: nomeCentro, descricao: descricaoCentro, cor: corCentro }).eq("id", editandoCentro.id);
    } else {
      await supabase.from("centros_custo").insert({ nome: nomeCentro, descricao: descricaoCentro, cor: corCentro, user_id: user.id, empresa_id: empresaId });
    }

    setModalCentro(false);
    setNomeCentro("");
    setDescricaoCentro("");
    setCorCentro("#6ab0ff");
    setEditandoCentro(null);
    setSalvandoCentro(false);
    carregarDados();
  }

  async function excluirCentro(id: string) {
    await supabase.from("centros_custo").delete().eq("id", id);
    carregarDados();
  }

  async function salvarLancamento() {
    if (!descricaoLanc.trim() || !valorLanc || !centroLanc) return;
    setSalvandoLanc(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("lancamentos_centro").insert({ descricao: descricaoLanc, valor: parseFloat(valorLanc), tipo: tipoLanc, data: dataLanc, centro_id: centroLanc, user_id: user.id, empresa_id: empresaId });

    setModalLancamento(false);
    setDescricaoLanc("");
    setValorLanc("");
    setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc("");
    setSalvandoLanc(false);
    carregarDados();
  }

  function abrirEditarCentro(centro: Centro) {
    setEditandoCentro(centro);
    setNomeCentro(centro.nome);
    setDescricaoCentro(centro.descricao || "");
    setCorCentro(centro.cor || "#6ab0ff");
    setModalCentro(true);
  }

  function fecharModalCentro() {
    setModalCentro(false);
    setEditandoCentro(null);
    setNomeCentro("");
    setDescricaoCentro("");
    setCorCentro("#6ab0ff");
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

      pdf.setFillColor(2, 8, 16);
      pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.text(`${cc.titulo} - ${new Date().toLocaleDateString(idioma === "en" ? "en-US" : idioma === "es" ? "es-ES" : "pt-BR")}`, pdfWidth - 14, 13, { align: "right" });

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
      pdf.save(`axioma-centros-custo-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const totalCustos = lancamentos.filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const saldoGeral = totalReceitas - totalCustos;

  function getLancamentosPorCentro(centroId: string) { return lancamentos.filter(l => l.centro_id === centroId); }
  function getCustosPorCentro(centroId: string) { return getLancamentosPorCentro(centroId).filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0); }
  function getReceitasPorCentro(centroId: string) { return getLancamentosPorCentro(centroId).filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0); }

  const lancamentosFiltrados = lancamentos.filter(l => l.descricao.toLowerCase().includes(busca.toLowerCase()));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p style={{ color: "#3a5a8a" }}>{t.geral.carregando}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#020810", minHeight: "100vh" }}>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>🏢 {cc.titulo}</h1>
          <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{cc.subtitulo}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportarPDF} disabled={exportando} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-60" style={{ background: "#dc2626", color: "#fff" }}>
            <Download size={16}/>{exportando ? "Gerando..." : "Exportar PDF"}
          </button>
          <button onClick={() => setModalLancamento(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
            + {cc.novoLancamento}
          </button>
          <button onClick={() => setModalCentro(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
            + {cc.novoCentro}
          </button>
        </div>
      </div>

      <div ref={conteudoRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: cc.totalCentros, valor: centros.length.toString(), cor: "#6ab0ff" },
            { label: cc.totalCustos, valor: fmt(totalCustos), cor: "#f87171" },
            { label: cc.totalReceitas, valor: fmt(totalReceitas), cor: "#34d399" },
            { label: cc.saldoGeral, valor: fmt(saldoGeral), cor: saldoGeral >= 0 ? "#34d399" : "#f87171" },
          ].map((card, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
              <p className="text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: "visao", label: cc.abaVisaoGeral },
            { key: "centros", label: cc.abaCentros },
            { key: "lancamentos", label: cc.abaLancamentos },
          ].map((a) => (
            <button key={a.key} onClick={() => setAba(a.key as typeof aba)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}` }}>
              {a.label}
            </button>
          ))}
        </div>

        {aba === "visao" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "#6ab0ff" }}>📊 {cc.comparativo}</h2>
            {centros.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                <p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p>
              </div>
            ) : centros.map((centro) => {
              const custos = getCustosPorCentro(centro.id);
              const receitas = getReceitasPorCentro(centro.id);
              const saldo = receitas - custos;
              const maxVal = Math.max(totalCustos, totalReceitas, 1);
              return (
                <div key={centro.id} className="rounded-2xl p-5" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${centro.cor}25` }}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: centro.cor }} />
                      <span className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: saldo >= 0 ? "#34d399" : "#f87171" }}>{fmt(saldo)}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}><span>{cc.custo}</span><span>{fmt(custos)}</span></div>
                      <div className="rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(custos / maxVal) * 100}%`, background: "#f87171" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1" style={{ color: "#3a5a8a" }}><span>{cc.receita}</span><span>{fmt(receitas)}</span></div>
                      <div className="rounded-full h-1.5" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${(receitas / maxVal) * 100}%`, background: "#34d399" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {aba === "centros" && (
          <div className="space-y-3">
            {centros.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                <p style={{ color: "#3a5a8a" }}>{cc.semCentros}</p>
              </div>
            ) : centros.map((centro) => (
              <div key={centro.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${centro.cor}25` }}>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ background: centro.cor }} />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</p>
                    {centro.descricao && <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro.descricao}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirEditarCentro(centro)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(59,111,212,0.15)", color: "#6ab0ff" }}>{cc.editarCentro}</button>
                  <button onClick={() => excluirCentro(centro.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{cc.excluirCentro}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {aba === "lancamentos" && (
          <div>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cc.buscar} className="w-full px-4 py-2.5 rounded-xl mb-4 text-sm focus:outline-none" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0" }} />
            <div className="space-y-3">
              {lancamentosFiltrados.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                  <p style={{ color: "#3a5a8a" }}>{cc.semLancamentos}</p>
                </div>
              ) : lancamentosFiltrados.map((lanc) => {
                const centro = centros.find(c => c.id === lanc.centro_id);
                return (
                  <div key={lanc.id} className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                    <div className="flex items-center gap-3">
                      {centro && <div className="w-3 h-3 rounded-full" style={{ background: centro.cor }} />}
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{lanc.descricao}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{centro?.nome} • {new Date(lanc.data).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold" style={{ color: lanc.tipo === "receita" ? "#34d399" : "#f87171" }}>
                      {lanc.tipo === "receita" ? "+" : "-"}{fmt(lanc.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {modalCentro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#c8d8f0" }}>{editandoCentro ? cc.editarCentro : cc.novoCentro}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cc.nomeCentro}</label>
                <input value={nomeCentro} onChange={(e) => setNomeCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cc.descricaoCentro}</label>
                <input value={descricaoCentro} onChange={(e) => setDescricaoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.corCentro}</label>
                <div className="flex gap-2 flex-wrap">
                  {cores.map((cor) => (
                    <button key={cor} onClick={() => setCorCentro(cor)} className="w-8 h-8 rounded-full transition-all" style={{ background: cor, border: corCentro === cor ? "3px solid #fff" : "3px solid transparent" }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={fecharModalCentro} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
                <button onClick={salvarCentro} disabled={salvandoCentro} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {salvandoCentro ? "..." : cc.salvarCentro}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalLancamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#c8d8f0" }}>{cc.novoLancamento}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                <input value={descricaoLanc} onChange={(e) => setDescricaoLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{t.geral.valor}</label>
                <input type="number" value={valorLanc} onChange={(e) => setValorLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cc.tipo}</label>
                <div className="flex gap-2">
                  {(["custo", "receita"] as const).map((tipo) => (
                    <button key={tipo} onClick={() => setTipoLanc(tipo)} className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)") : "rgba(59,111,212,0.05)", color: tipoLanc === tipo ? (tipo === "custo" ? "#f87171" : "#34d399") : "#3a5a8a", border: `1px solid ${tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)") : "rgba(59,111,212,0.1)"}` }}>
                      {tipo === "custo" ? cc.custo : cc.receita}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
                <input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cc.centroCusto}</label>
                <select value={centroLanc} onChange={(e) => setCentroLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                  <option value="">-- {cc.centroCusto} --</option>
                  {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalLancamento(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
                <button onClick={salvarLancamento} disabled={salvandoLanc} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {salvandoLanc ? "..." : cc.salvarLancamento}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}