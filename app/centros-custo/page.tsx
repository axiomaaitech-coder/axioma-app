"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";

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
  const { t } = useLanguage();
  const cc = t.centrosCusto;

  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

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

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const eid = empresa?.id || null;
    setEmpresaId(eid);

    const { data: centrosData } = await supabase
      .from("centros_custo")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const { data: lancamentosData } = await supabase
      .from("lancamentos_centro")
      .select("*")
      .eq("user_id", user.id)
      .order("data", { ascending: false });

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
      await supabase.from("centros_custo").update({
        nome: nomeCentro,
        descricao: descricaoCentro,
        cor: corCentro,
      }).eq("id", editandoCentro.id);
    } else {
      await supabase.from("centros_custo").insert({
        nome: nomeCentro,
        descricao: descricaoCentro,
        cor: corCentro,
        user_id: user.id,
        empresa_id: empresaId,
      });
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

    await supabase.from("lancamentos_centro").insert({
      descricao: descricaoLanc,
      valor: parseFloat(valorLanc),
      tipo: tipoLanc,
      data: dataLanc,
      centro_id: centroLanc,
      user_id: user.id,
      empresa_id: empresaId,
    });

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

  const totalCustos = lancamentos.filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = lancamentos.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const saldoGeral = totalReceitas - totalCustos;

  function getLancamentosPorCentro(centroId: string) {
    return lancamentos.filter(l => l.centro_id === centroId);
  }

  function getCustosPorCentro(centroId: string) {
    return getLancamentosPorCentro(centroId).filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  }

  function getReceitasPorCentro(centroId: string) {
    return getLancamentosPorCentro(centroId).filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  }

  const lancamentosFiltrados = lancamentos.filter(l =>
    l.descricao.toLowerCase().includes(busca.toLowerCase())
  );

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p style={{ color: "#3a5a8a" }}>Carregando...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#020810", minHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>🏢 {cc.titulo}</h1>
          <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{cc.subtitulo}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setModalLancamento(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
            + {cc.novoLancamento}
          </button>
          <button onClick={() => setModalCentro(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
            + {cc.novoCentro}
          </button>
        </div>
      </div>

      {/* Cards KPI */}
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

      {/* Abas */}
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

      {/* ABA: VISÃO GERAL */}
      {aba === "visao" && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#6ab0ff" }}>📊 {cc.comparativo}</h2>
          {centros.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style