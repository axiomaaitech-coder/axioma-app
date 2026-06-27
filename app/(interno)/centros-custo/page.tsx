"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { Pencil, Trash2, X, Split } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Centro = {
  id: string; nome: string; tipo: string; descricao: string; ativo: boolean;
  orcamento_mensal?: number; meta_receita?: number; responsavel?: string; codigo?: string;
  user_id: string; created_at: string;
};
type Lancamento = {
  id: string; descricao: string; valor: number; tipo: string;
  data: string; centro_custo_id: string; categoria: string;
  user_id: string; created_at: string;
};

const CORES_CENTRO = ["#6ab0ff", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee"];
const getCor = (index: number) => CORES_CENTRO[index % CORES_CENTRO.length];

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };
const selectStyle = { background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };

function ModalPremium({ aberto, onFechar, titulo, cor = "#6ab0ff", children }: {
  aberto: boolean; onFechar: () => void; titulo: string; cor?: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md">
            <CanvasBox cor={cor}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: cor }}>AXIOMA AI.TECH</p>
                  <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
              </div>
              {children}
            </CanvasBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CentrosCustoPage() {
  const { t, idioma } = useLanguage();
  const cc = t.centrosCusto;
  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));

  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCentro, setEditandoCentro] = useState<Centro | null>(null);
  const [nomeCentro, setNomeCentro] = useState("");
  const [tipoCentro, setTipoCentro] = useState("operacional");
  const [descricaoCentro, setDescricaoCentro] = useState("");
  const [orcamentoCentro, setOrcamentoCentro] = useState("");
  const [metaCentro, setMetaCentro] = useState("");
  const [responsavelCentro, setResponsavelCentro] = useState("");
  const [codigoCentro, setCodigoCentro] = useState("");
  const [salvandoCentro, setSalvandoCentro] = useState(false);

  const [modalLancamento, setModalLancamento] = useState(false);
  const [editandoLanc, setEditandoLanc] = useState<Lancamento | null>(null);
  const [descricaoLanc, setDescricaoLanc] = useState("");
  const [valorLanc, setValorLanc] = useState("");
  const [tipoLanc, setTipoLanc] = useState("custo");
  const [dataLanc, setDataLanc] = useState(new Date().toISOString().split("T")[0]);
  const [centroLanc, setCentroLanc] = useState("");
  const [categoriaLanc, setCategoriaLanc] = useState("");
  const [salvandoLanc, setSalvandoLanc] = useState(false);
  const [busca, setBusca] = useState("");

  // Rateio
  const [modalRateio, setModalRateio] = useState(false);
  const [rateioDesc, setRateioDesc] = useState("");
  const [rateioValor, setRateioValor] = useState("");
  const [rateioData, setRateioData] = useState(new Date().toISOString().split("T")[0]);
  const [rateioPercentuais, setRateioPercentuais] = useState<Record<string, string>>({});
  const [processandoRateio, setProcessandoRateio] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
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
    if (!user) { setSalvandoCentro(false); return; }
    const payload: any = {
      nome: nomeCentro, tipo: tipoCentro, descricao: descricaoCentro,
      orcamento_mensal: parseFloat(orcamentoCentro || "0"),
      meta_receita: parseFloat(metaCentro || "0"),
      responsavel: responsavelCentro, codigo: codigoCentro,
    };
    if (editandoCentro) {
      await supabase.from("centros_custo").update(payload).eq("id", editandoCentro.id);
    } else {
      await supabase.from("centros_custo").insert({ ...payload, user_id: user.id, ativo: true });
    }
    fecharModalCentro(); setSalvandoCentro(false); carregarDados();
  }

  async function excluirCentro(id: string) {
    await supabase.from("centros_custo").delete().eq("id", id); carregarDados();
  }

  async function salvarLancamento() {
    if (!descricaoLanc.trim() || !valorLanc) return;
    setSalvandoLanc(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoLanc(false); return; }
    const payload: any = {
      descricao: descricaoLanc, valor: parseFloat(valorLanc), tipo: tipoLanc,
      data: dataLanc, categoria: categoriaLanc || null,
      centro_custo_id: centroLanc || null,
    };
    if (editandoLanc) {
      const { error } = await supabase.from("lancamentos_centro").update(payload).eq("id", editandoLanc.id);
      if (error) { console.error("Erro ao editar lançamento:", error.message, error); alert("Erro ao editar: " + error.message); setSalvandoLanc(false); return; }
    } else {
      const { error } = await supabase.from("lancamentos_centro").insert({ ...payload, user_id: user.id });
      if (error) { console.error("Erro ao salvar lançamento:", error.message, error); alert("Erro ao salvar: " + error.message); setSalvandoLanc(false); return; }
    }
    fecharModalLancamento();
    carregarDados(); setSalvandoLanc(false);
  }

  function abrirNovoLancamento() {
    setEditandoLanc(null);
    setDescricaoLanc(""); setValorLanc(""); setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc(""); setCategoriaLanc("");
    setModalLancamento(true);
  }

  function abrirEditarLancamento(lanc: Lancamento) {
    setEditandoLanc(lanc);
    setDescricaoLanc(lanc.descricao || "");
    setValorLanc(String(lanc.valor || ""));
    setTipoLanc(lanc.tipo || "custo");
    setDataLanc(lanc.data || new Date().toISOString().split("T")[0]);
    setCentroLanc(lanc.centro_custo_id || "");
    setCategoriaLanc(lanc.categoria || "");
    setModalLancamento(true);
  }

  function fecharModalLancamento() {
    setModalLancamento(false); setEditandoLanc(null);
    setDescricaoLanc(""); setValorLanc(""); setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc(""); setCategoriaLanc("");
  }

  async function excluirLancamento(id: string) {
    await supabase.from("lancamentos_centro").delete().eq("id", id);
    carregarDados();
  }

  function abrirEditarCentro(centro: Centro) {
    setEditandoCentro(centro); setNomeCentro(centro.nome);
    setTipoCentro(centro.tipo || "operacional"); setDescricaoCentro(centro.descricao || "");
    setOrcamentoCentro(String(centro.orcamento_mensal || ""));
    setMetaCentro(String(centro.meta_receita || ""));
    setResponsavelCentro(centro.responsavel || ""); setCodigoCentro(centro.codigo || "");
    setModalCentro(true);
  }

  function fecharModalCentro() {
    setModalCentro(false); setEditandoCentro(null);
    setNomeCentro(""); setTipoCentro("operacional"); setDescricaoCentro("");
    setOrcamentoCentro(""); setMetaCentro(""); setResponsavelCentro(""); setCodigoCentro("");
  }

  // ---------- RATEIO ----------
  function abrirRateio() {
    setRateioDesc(""); setRateioValor(""); setRateioData(new Date().toISOString().split("T")[0]);
    setRateioPercentuais({}); setModalRateio(true);
  }

  const somaPercentuais = Object.values(rateioPercentuais).reduce((s, v) => s + parseFloat(v || "0"), 0);
  const restanteRateio = 100 - somaPercentuais;

  function distribuirIgualmente() {
    if (centros.length === 0) return;
    const base = Math.floor((100 / centros.length) * 100) / 100; // 2 casas
    const novo: Record<string, string> = {};
    centros.forEach((c, idx) => {
      // o último recebe o ajuste pra fechar exatamente 100%
      if (idx === centros.length - 1) {
        const resto = Number((100 - base * (centros.length - 1)).toFixed(2));
        novo[c.id] = String(resto);
      } else {
        novo[c.id] = String(base);
      }
    });
    setRateioPercentuais(novo);
  }

  async function confirmarRateio() {
    if (!rateioDesc.trim() || !rateioValor) return;
    if (Math.abs(restanteRateio) > 0.5) return; // precisa somar 100%
    setProcessandoRateio(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProcessandoRateio(false); return; }
    const total = parseFloat(rateioValor || "0");
    const linhas = centros
      .filter(c => parseFloat(rateioPercentuais[c.id] || "0") > 0)
      .map(c => ({
        descricao: `${rateioDesc} (Rateio ${rateioPercentuais[c.id]}%)`,
        valor: Number((total * (parseFloat(rateioPercentuais[c.id]) / 100)).toFixed(2)),
        tipo: "custo", data: rateioData, categoria: "Rateio",
        centro_custo_id: c.id, user_id: user.id,
      }));
    if (linhas.length > 0) {
      const { error } = await supabase.from("lancamentos_centro").insert(linhas);
      if (error) {
        console.error("Erro ao aplicar rateio:", error.message, error);
        alert("Erro ao aplicar rateio: " + error.message);
        setProcessandoRateio(false);
        return;
      }
    }
    setModalRateio(false); setProcessandoRateio(false); carregarDados();
  }

  // ---------- CÁLCULOS (período selecionado) ----------
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const noPeriodo = (l: Lancamento) => (l.data || "").slice(0, 7) === periodo;
  const lancPeriodo = lancamentos.filter(noPeriodo);

  const totalCustos = lancPeriodo.filter(l => l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = lancPeriodo.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const totalOrcado = centros.reduce((s, c) => s + (c.orcamento_mensal || 0), 0);
  const resultadoGeral = totalReceitas - totalCustos;

  const getCustos = (id: string) => lancPeriodo.filter(l => l.centro_custo_id === id && l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const getReceitas = (id: string) => lancPeriodo.filter(l => l.centro_custo_id === id && l.tipo === "receita").reduce((s, l) => s + l.valor, 0);

  const lancFiltrados = lancamentos.filter(l => l.descricao.toLowerCase().includes(busca.toLowerCase()));

  const L = {
    orcado: idioma === "pt" ? "Orçado" : idioma === "en" ? "Budget" : "Presupuesto",
    realizado: idioma === "pt" ? "Realizado" : idioma === "en" ? "Actual" : "Realizado",
    variancia: idioma === "pt" ? "Variância" : idioma === "en" ? "Variance" : "Variación",
    resultado: idioma === "pt" ? "Resultado" : idioma === "en" ? "Result" : "Resultado",
    margem: idioma === "pt" ? "Margem" : idioma === "en" ? "Margin" : "Margen",
    participacao: idioma === "pt" ? "Participação" : idioma === "en" ? "Share" : "Participación",
    responsavel: idioma === "pt" ? "Responsável" : idioma === "en" ? "Manager" : "Responsable",
    periodo: idioma === "pt" ? "Período" : idioma === "en" ? "Period" : "Período",
    rateio: idioma === "pt" ? "Ratear Custo" : idioma === "en" ? "Allocate Cost" : "Distribuir Costo",
    dentroOrc: idioma === "pt" ? "dentro do orçamento" : idioma === "en" ? "within budget" : "dentro del presupuesto",
    estourou: idioma === "pt" ? "acima do orçamento" : idioma === "en" ? "over budget" : "sobre presupuesto",
  };

  const botaoLancamento = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={abrirNovoLancamento}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cc.novoLancamento}
    </motion.button>
  );

  const botaoRateio = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={abrirRateio}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
      <Split size={15} /> {L.rateio}
    </motion.button>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810", minHeight: "100vh" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ModuloLayout titulo={cc.titulo} subtitulo={cc.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCentro(null); fecharModalCentro(); setModalCentro(true); }}
      labelBotao={cc.novoCentro} botaoExtra={<div className="flex gap-2 flex-wrap">{botaoLancamento}{botaoRateio}</div>}>
      <div className="space-y-4">

        {/* Seletor de período */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{L.periodo}:</span>
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cc.totalCentros, valor: centros.length.toString(), cor: "#6ab0ff" },
            { label: L.orcado, valor: fmt(totalOrcado), cor: "#a78bfa" },
            { label: L.realizado + " (custo)", valor: fmt(totalCustos), cor: "#f87171" },
            { label: L.resultado, valor: fmt(resultadoGeral), cor: resultadoGeral >= 0 ? "#34d399" : "#f87171" },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{card.label}</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "visao", label: cc.abaVisaoGeral },
            { key: "centros", label: cc.abaCentros },
            { key: "lancamentos", label: cc.abaLancamentos },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAba(a.key as typeof aba)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}` }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* ===== VISÃO GERAL (orçado vs realizado + resultado/margem) ===== */}
        {aba === "visao" && (
          <div className="space-y-4">
            {centros.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => {
              const custos = getCustos(centro.id);
              const receitas = getReceitas(centro.id);
              const resultado = receitas - custos;
              const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;
              const orcado = centro.orcamento_mensal || 0;
              const usoOrc = orcado > 0 ? (custos / orcado) * 100 : 0;
              const variancia = orcado - custos;
              const participacao = totalCustos > 0 ? (custos / totalCustos) * 100 : 0;
              const meta = centro.meta_receita || 0;
              const usoMeta = meta > 0 ? (receitas / meta) * 100 : 0;
              const corMeta = usoMeta >= 100 ? "#34d399" : usoMeta >= 70 ? "#6ab0ff" : "#fbbf24";
              const cor = getCor(i);
              const corOrc = usoOrc > 100 ? "#f87171" : usoOrc > 85 ? "#fbbf24" : "#34d399";
              return (
                <motion.div key={centro.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-3 h-3 rounded-full" style={{ background: cor }} />
                        <span className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</span>
                        {centro.codigo && <span className="text-xs" style={{ color: "#5a7a9a" }}>{centro.codigo}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: `${cor}20`, color: cor }}>{centro.tipo}</span>
                        {centro.responsavel && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>👤 {centro.responsavel}</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-black" style={{ color: resultado >= 0 ? "#34d399" : "#f87171" }}>{fmt(resultado)}</span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCentro(centro)}>
                          <Pencil size={15} style={{ color: "#6ab0ff" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCentro(centro.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Orçado vs Realizado */}
                    {orcado > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#5a7a9a" }}>{L.orcado}: {fmt(orcado)} · {L.realizado}: {fmt(custos)}</span>
                          <span style={{ color: corOrc, fontWeight: 700 }}>{usoOrc.toFixed(0)}%</span>
                        </div>
                        <div className="rounded-full h-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usoOrc, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full" style={{ background: corOrc }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: corOrc }}>
                          {variancia >= 0 ? `${fmt(variancia)} ${L.dentroOrc}` : `${fmt(Math.abs(variancia))} ${L.estourou}`}
                        </p>
                      </div>
                    )}

                    {/* Meta vs Realizado de Receita */}
                    {meta > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#5a7a9a" }}>
                            {idioma === "pt" ? "Meta Receita" : "Revenue Target"}: {fmt(meta)} · {L.realizado}: {fmt(receitas)}
                          </span>
                          <span style={{ color: corMeta, fontWeight: 700 }}>{usoMeta.toFixed(0)}%</span>
                        </div>
                        <div className="rounded-full h-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usoMeta, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full" style={{ background: corMeta }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: corMeta }}>
                          {usoMeta >= 100
                            ? (idioma === "pt" ? "🎯 Meta atingida!" : "🎯 Target reached!")
                            : `${fmt(meta - receitas)} ${idioma === "pt" ? "para bater a meta" : "to reach target"}`}
                        </p>
                      </div>
                    )}

                    {/* Resultado / Margem / Participação */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2" style={{ borderTop: "1px solid rgba(59,111,212,0.1)" }}>
                      {[
                        { label: cc.receita, val: fmt(receitas), cor: "#34d399" },
                        { label: cc.custo, val: fmt(custos), cor: "#f87171" },
                        { label: L.margem, val: `${margem.toFixed(1)}%`, cor: margem >= 0 ? "#34d399" : "#f87171" },
                        { label: L.participacao, val: `${participacao.toFixed(1)}%`, cor: "#a78bfa" },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-xs mb-0.5" style={{ color: "#5a7a9a" }}>{s.label}</p>
                          <p className="text-sm font-bold" style={{ color: s.cor }}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ===== CENTROS ===== */}
        {aba === "centros" && (
          <div className="space-y-3">
            {centros.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => {
              const cor = getCor(i);
              return (
                <motion.div key={centro.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ background: cor }} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</p>
                            {centro.codigo && <span className="text-xs" style={{ color: "#5a7a9a" }}>{centro.codigo}</span>}
                          </div>
                          <p className="text-xs mt-0.5 capitalize" style={{ color: "#5a7a9a" }}>
                            {centro.tipo}{centro.responsavel ? ` · 👤 ${centro.responsavel}` : ""}
                            {centro.orcamento_mensal ? ` · ${idioma === "pt" ? "Orçamento" : "Budget"}: ${fmt(centro.orcamento_mensal)}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCentro(centro)}>
                          <Pencil size={15} style={{ color: "#6ab0ff" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCentro(centro.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ===== LANÇAMENTOS ===== */}
        {aba === "lancamentos" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cc.buscar}
                className="w-full text-sm focus:outline-none bg-transparent" style={{ color: "#c8d8f0" }} />
            </CanvasBox>
            {lancFiltrados.length === 0 ? (
              <CanvasBox cor="#6ab0ff"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semLancamentos}</p></div></CanvasBox>
            ) : lancFiltrados.map((lanc, i) => {
              const centro = centros.find(c => c.id === lanc.centro_custo_id);
              const idxCentro = centros.findIndex(c => c.id === lanc.centro_custo_id);
              const cor = idxCentro >= 0 ? getCor(idxCentro) : "#6ab0ff";
              return (
                <motion.div key={lanc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <CanvasBox cor={lanc.tipo === "receita" ? "#34d399" : "#f87171"}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cor }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{lanc.descricao}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{centro?.nome || (idioma === "pt" ? "Sem centro" : "No center")} · {new Date(lanc.data + "T00:00:00").toLocaleDateString("pt-BR")}{lanc.categoria ? ` · ${lanc.categoria}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color: lanc.tipo === "receita" ? "#34d399" : "#f87171" }}>
                          {lanc.tipo === "receita" ? "+" : "-"}{fmt(lanc.valor)}
                        </span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarLancamento(lanc)}>
                          <Pencil size={15} style={{ color: "#6ab0ff" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirLancamento(lanc.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Centro */}
      <ModalPremium aberto={modalCentro} onFechar={fecharModalCentro} titulo={editandoCentro ? cc.editarCentro : cc.novoCentro} cor="#6ab0ff">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.nomeCentro}</label>
            <input value={nomeCentro} onChange={(e) => setNomeCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Código" : "Code"}</label>
              <input value={codigoCentro} onChange={(e) => setCodigoCentro(e.target.value)} placeholder="CC-001" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{L.responsavel}</label>
              <input value={responsavelCentro} onChange={(e) => setResponsavelCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {["operacional", "administrativo", "comercial", "financeiro"].map(tp => (
                <motion.button key={tp} whileTap={{ scale: 0.97 }} onClick={() => setTipoCentro(tp)}
                  className="py-2 rounded-xl text-xs font-semibold capitalize"
                  style={{ background: tipoCentro === tp ? "rgba(106,176,255,0.2)" : "rgba(59,111,212,0.05)", color: tipoCentro === tp ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${tipoCentro === tp ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.1)"}` }}>
                  {tp}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Orçamento Mensal (R$)" : "Monthly Budget (R$)"}</label>
              <input type="number" value={orcamentoCentro} onChange={(e) => setOrcamentoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Meta Receita (R$)" : "Revenue Target (R$)"}</label>
              <input type="number" value={metaCentro} onChange={(e) => setMetaCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.descricaoCentro}</label>
            <input value={descricaoCentro} onChange={(e) => setDescricaoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalCentro} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCentro} disabled={salvandoCentro}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {salvandoCentro ? "..." : cc.salvarCentro}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Lançamento */}
      <ModalPremium aberto={modalLancamento} onFechar={fecharModalLancamento} titulo={editandoLanc ? (idioma === "pt" ? "Editar Lançamento" : "Edit Entry") : cc.novoLancamento} cor="#34d399">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
            <input value={descricaoLanc} onChange={(e) => setDescricaoLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.valor}</label>
            <input type="number" value={valorLanc} onChange={(e) => setValorLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.tipo}</label>
            <div className="flex gap-2">
              {["custo", "receita"].map((tipo) => (
                <motion.button key={tipo} whileTap={{ scale: 0.97 }} onClick={() => setTipoLanc(tipo)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)") : "rgba(59,111,212,0.05)", color: tipoLanc === tipo ? (tipo === "custo" ? "#f87171" : "#34d399") : "#5a7a9a", border: `1px solid ${tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)") : "rgba(59,111,212,0.1)"}` }}>
                  {tipo === "custo" ? cc.custo : cc.receita}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
            <input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.centroCusto} <span style={{ color: "#5a7a9a" }}>(opcional)</span></label>
            <select value={centroLanc} onChange={(e) => setCentroLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={selectStyle}>
              <option value="">-- {idioma === "pt" ? "Sem centro" : "No center"} --</option>
              {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>Categoria <span style={{ color: "#5a7a9a" }}>(opcional)</span></label>
            <input value={categoriaLanc} onChange={(e) => setCategoriaLanc(e.target.value)} placeholder="Ex: Marketing, RH, TI..." className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalLancamento} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarLancamento} disabled={salvandoLanc}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
              {salvandoLanc ? "..." : cc.salvarLancamento}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Rateio */}
      <ModalPremium aberto={modalRateio} onFechar={() => setModalRateio(false)} titulo={L.rateio} cor="#a78bfa">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "#5a7a9a" }}>
            {idioma === "pt" ? "Distribua um custo compartilhado (ex: aluguel, energia) entre vários centros por %." : "Distribute a shared cost across centers by %."}
          </p>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Descrição do Custo" : "Cost Description"}</label>
            <input value={rateioDesc} onChange={(e) => setRateioDesc(e.target.value)} placeholder={idioma === "pt" ? "Ex: Aluguel da sede" : "e.g. Office rent"} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Valor Total (R$)" : "Total (R$)"}</label>
              <input type="number" value={rateioValor} onChange={(e) => setRateioValor(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
              <input type="date" value={rateioData} onChange={(e) => setRateioData(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Distribuição (%)" : "Distribution (%)"}</label>
              {centros.length > 0 && (
                <button onClick={distribuirIgualmente} className="text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                  {idioma === "pt" ? "Distribuir igualmente (100%)" : "Distribute equally"}
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {centros.length === 0 ? (
                <p className="text-xs" style={{ color: "#5a7a9a" }}>{cc.semCentros}</p>
              ) : centros.map((c, i) => {
                const pctStr = rateioPercentuais[c.id] || "";
                const pct = parseFloat(pctStr || "0");
                const valorCentro = (parseFloat(rateioValor || "0") * pct) / 100;
                return (
                  <div key={c.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: getCor(i) }} />
                    <span className="text-xs flex-1 truncate" style={{ color: "#c8d8f0" }}>{c.nome}</span>
                    {pct > 0 && <span className="text-xs" style={{ color: "#34d399" }}>{fmt(valorCentro)}</span>}
                    <input type="number" value={pctStr} onChange={(e) => setRateioPercentuais({ ...rateioPercentuais, [c.id]: e.target.value })}
                      placeholder="0" className="w-16 px-2 py-1.5 rounded-lg text-xs text-right focus:outline-none" style={inputStyle} />
                    <span className="text-xs" style={{ color: "#5a7a9a" }}>%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex justify-between items-center px-3 py-2 rounded-xl" style={{ background: Math.abs(restanteRateio) < 0.5 ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)" }}>
            <span className="text-xs" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Total distribuído" : "Distributed"}: {somaPercentuais.toFixed(1)}%</span>
            <span className="text-xs font-bold" style={{ color: Math.abs(restanteRateio) < 0.5 ? "#34d399" : "#fbbf24" }}>
              {idioma === "pt" ? "Restante" : "Remaining"}: {restanteRateio.toFixed(1)}%
            </span>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalRateio(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRateio}
              disabled={processandoRateio || Math.abs(restanteRateio) > 0.5 || !rateioDesc.trim() || !rateioValor}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5b21b6, #8b5cf6)", color: "#fff" }}>
              {processandoRateio ? "..." : (idioma === "pt" ? "Aplicar Rateio" : "Apply")}
            </motion.button>
          </div>
        </div>
      </ModalPremium>
    </ModuloLayout>
  );

  // ---------- PDF ----------
  function exportarPDF() {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: cc.titulo,
        subtitulo: `${cc.subtitulo} · ${L.periodo}: ${periodo}`,
        colunas: [
          { header: "Centro", key: "centro", width: 3 },
          { header: "Tipo", key: "tipo", width: 2 },
          { header: L.orcado + " (R$)", key: "orcado", width: 2, align: "right" },
          { header: L.realizado + " (R$)", key: "real", width: 2, align: "right" },
          { header: L.variancia + " (R$)", key: "var", width: 2, align: "right" },
          { header: cc.receita + " (R$)", key: "rec", width: 2, align: "right" },
          { header: L.resultado + " (R$)", key: "res", width: 2, align: "right" },
          { header: L.margem, key: "margem", width: 2, align: "right" },
        ],
        linhas: centros.map((c) => {
          const custos = getCustos(c.id);
          const receitas = getReceitas(c.id);
          const resultado = receitas - custos;
          const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;
          const orcado = c.orcamento_mensal || 0;
          return {
            centro: c.nome, tipo: c.tipo,
            orcado: fmtN(orcado), real: fmtN(custos), var: fmtN(orcado - custos),
            rec: fmtN(receitas), res: fmtN(resultado), margem: `${margem.toFixed(1)}%`,
          };
        }),
        resumo: [
          { label: L.orcado + " Total", valor: `R$ ${fmtN(totalOrcado)}` },
          { label: L.realizado + " (Custos)", valor: `R$ ${fmtN(totalCustos)}` },
          { label: cc.receita, valor: `R$ ${fmtN(totalReceitas)}` },
          { label: L.resultado + " Geral", valor: `R$ ${fmtN(resultadoGeral)}` },
        ],
        nomeArquivo: `axioma-centros-custo-${periodo}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  }
}