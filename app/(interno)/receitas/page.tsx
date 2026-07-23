"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, X, Pencil, Share2, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  fBRL, fBRL2, CORES, mesesPorLang, serieMensal, crescimentoMoM, ticketMedio,
  concentracao, percentualRecorrente, mrrArr, porCategoria, preverProximosMeses,
  gerarInsights, optBarrasV, optRosca, optLinhaPrevisao, type Lancamento,
} from "../../../lib/cfoCore";
import { cfoT, textoInsight, canaisCompartilhamento } from "../../../lib/cfoTextos";
import { registrarAuditoriaCentro } from "../../../lib/centroCustoHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Vendas de produtos", "Prestação de serviços", "Recorrentes", "Eventuais", "Outras"];
const CATEGORIAS_RECORRENTES = ["Recorrentes"];
const CAT_COR: Record<string, string> = {
  "Vendas de produtos": CORES.ouro, "Prestação de serviços": CORES.roxo,
  "Recorrentes": CORES.cyan, "Eventuais": CORES.laranja, "Outras": CORES.teal,
};

type Receita = { id: string; descricao: string; valor: number; data: string; categoria: string; status: string; cliente_id: string | null; centro_custo_id?: string | null; };
type ClienteOpcao = { id: string; nome: string };

export default function Receitas() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);
  const meses = mesesPorLang(lang);

  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [clientesOpcoes, setClientesOpcoes] = useState<ClienteOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido", cliente_id: "", centro_custo_id: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [centrosCusto, setCentrosCusto] = useState<{ id: string; nome: string }[]>([]);

  const carregarReceitas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const [{ data }, { data: clientesData }, { data: centrosData }] = await Promise.all([
      supabase.from("receitas").select("*").eq("user_id", user.id).order("data", { ascending: false }),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id).order("nome", { ascending: true }),
      supabase.from("centros_custo").select("id, nome").eq("user_id", user.id),
    ]);
    setReceitas(data || []);
    setClientesOpcoes(clientesData || []);
    setCentrosCusto(centrosData || []);
    setCarregando(false);
  };
  useEffect(() => { carregarReceitas(); }, []);

  const fecharModal = () => { setModalAberto(false); setEditando(null); setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido", cliente_id: "", centro_custo_id: "" }); };
  const abrirEdicao = (r: Receita) => { setEditando(r); setNovo({ descricao: r.descricao, valor: String(r.valor), data: r.data, categoria: r.categoria, status: r.status, cliente_id: r.cliente_id || "", centro_custo_id: r.centro_custo_id || "" }); setModalAberto(true); };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, valor: parseFloat(novo.valor), data: novo.data || new Date().toISOString().slice(0, 10), categoria: novo.categoria, status: novo.status, cliente_id: novo.cliente_id || null, centro_custo_id: novo.centro_custo_id || null };
    if (editando) {
      const { error } = await supabase.from("receitas").update(payload).eq("id", editando.id);
      if (!error) {
        await registrarAuditoriaCentro({ userId: user.id, centroId: novo.centro_custo_id || null, tabela: "receitas", registroId: editando.id, acao: "editar", descricao: `Receita editada: ${novo.descricao}` });
        fecharModal(); await carregarReceitas();
      }
    } else {
      const { data, error } = await supabase.from("receitas").insert({ ...payload, user_id: user.id }).select("id").single();
      if (!error && data) {
        await registrarAuditoriaCentro({ userId: user.id, centroId: novo.centro_custo_id || null, tabela: "receitas", registroId: data.id, acao: "criar", descricao: `Receita criada: ${novo.descricao}` });
        fecharModal(); await carregarReceitas();
      }
    }
    setSalvando(false);
  };
  const excluir = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const receita = receitas.find(r => r.id === id);
    await supabase.from("receitas").delete().eq("id", id);
    if (user) await registrarAuditoriaCentro({ userId: user.id, centroId: receita?.centro_custo_id || null, tabela: "receitas", registroId: id, acao: "excluir", descricao: `Receita excluída: ${receita?.descricao || id}` });
    setReceitas(receitas.filter(r => r.id !== id));
  };

  const receitasFiltradas = receitas.filter(r =>
    r.descricao.toLowerCase().includes(busca.toLowerCase()) &&
    (filtroCategoria === "todas" || r.categoria === filtroCategoria)
  );

  const totalReceitas = receitas.reduce((acc, r) => acc + r.valor, 0);
  const totalRecebido = receitas.filter(r => r.status === "recebido").reduce((acc, r) => acc + r.valor, 0);
  const totalPendente = receitas.filter(r => r.status === "pendente").reduce((acc, r) => acc + r.valor, 0);

  // ═══════════ INTELIGÊNCIA CFO — tudo vindo do alicerce ═══════════
  const lancamentos: Lancamento[] = receitas.map(r => ({ valor: r.valor, data: r.data, categoria: r.categoria, status: r.status }));
  const mesAtual = new Date().getMonth();
  const serie12 = serieMensal(lancamentos);
  const cresc = crescimentoMoM(serie12, mesAtual);
  const { mrr, arr } = mrrArr(lancamentos, CATEGORIAS_RECORRENTES);
  const tkt = ticketMedio(lancamentos);
  const recPct = percentualRecorrente(lancamentos, CATEGORIAS_RECORRENTES);
  const conc = concentracao(lancamentos, 0.2);
  const composicao = porCategoria(lancamentos, categorias, CAT_COR);
  const previsao = preverProximosMeses(serie12, mesAtual, 3);
  const temMesAnterior = mesAtual > 0 && serie12[mesAtual - 1] > 0;
  const insights = gerarInsights({ concentracao: conc, crescimentoMoM: cresc, recorrenciaPct: recPct, temMesAnterior });
  const temDados = receitas.length > 0;

  // ═══════════ PDF ═══════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: t.receitas.titulo, subtitulo: t.receitas.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Categoria", key: "categoria", width: 3 },
          { header: "Data", key: "data", width: 2 },
          { header: "Status", key: "status", width: 2 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
        ],
        linhas: receitasFiltradas.map((r) => ({
          descricao: r.descricao, categoria: r.categoria,
          data: r.data ? new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR") : "-",
          status: r.status === "recebido" ? "Recebido" : "Pendente", valor: fBRL2(r.valor),
        })),
        resumo: [
          { label: "Total de Receitas", valor: `R$ ${fBRL2(totalReceitas)}` },
          { label: "Recebido", valor: `R$ ${fBRL2(totalRecebido)}` },
          { label: "Pendente", valor: `R$ ${fBRL2(totalPendente)}` },
          { label: "MRR (Recorrente)", valor: `R$ ${fBRL2(mrr)}` },
          { label: "ARR (Anual)", valor: `R$ ${fBRL2(arr)}` },
        ],
        nomeArquivo: `axioma-receitas-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════ COMPARTILHAR ═══════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.receitas.titulo}`,
    `💰 ${t.receitas.totalReceitas}: ${fBRL(totalReceitas)}`,
    `📈 MRR: ${fBRL(mrr)} · ARR: ${fBRL(arr)}`,
    `📊 ${cx.crescimentoMoM}: ${cresc >= 0 ? "▲" : "▼"} ${Math.abs(cresc).toFixed(1)}%`,
    `_axiomaai.com.br_`,
  ].join("\n");
  const canais = canaisCompartilhamento(textoShare, `${t.receitas.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  // ═══════════ GRÁFICOS (options do alicerce) ═══════════
  const optEvol = optBarrasV(serie12, meses, CORES.roxo, CORES.roxoC);
  const optCat = optRosca(composicao, CORES.ouro, (t.receitas.totalReceitas || cx.total).toUpperCase());
  const histInicio = Math.max(0, mesAtual - 2);
  const optPrev = optLinhaPrevisao(
    [...serie12.slice(histInicio, mesAtual + 1), null, null, null],
    previsao,
    [...meses.slice(histInicio, mesAtual + 1), "+1", "+2", "+3"],
    cx.realizado, cx.projetado, CORES.verde, CORES.cyan
  );

  const kpisCFO = [
    { l: cx.mrr, v: fBRL(mrr), c: CORES.cyan, i: "🔄" },
    { l: cx.arr, v: fBRL(arr), c: CORES.roxo, i: "📅" },
    { l: cx.crescimentoMoM, v: `${cresc >= 0 ? "▲" : "▼"} ${Math.abs(cresc).toFixed(1)}%`, c: cresc >= 0 ? CORES.verde : CORES.vermelho, i: "📈" },
    { l: cx.ticketMedio, v: fBRL(tkt), c: CORES.ouro, i: "🎫" },
    { l: cx.recorrenciaPct, v: `${recPct.toFixed(0)}%`, c: CORES.teal, i: "♻️" },
    { l: cx.concentracao, v: `${conc.toFixed(0)}%`, c: conc > 70 ? CORES.laranja : CORES.verde, i: "🎯" },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${t.receitas.totalReceitas} ${fBRL(totalReceitas)}`,
    `MRR ${fBRL(mrr)}`, `ARR ${fBRL(arr)}`,
    `${cx.crescimentoMoM} ${cresc >= 0 ? "▲" : "▼"}${Math.abs(cresc).toFixed(1)}%`,
    `${cx.ticketMedio} ${fBRL(tkt)}`, `${t.receitas.recebido} ${fBRL(totalRecebido)}`,
  ];

  const SubChart = ({ titulo, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-[13px] font-black" style={{ color: "#f1f5f9" }}>{titulo}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  return (
    <ModuloLayout titulo={t.receitas.titulo} subtitulo={t.receitas.subtitulo} onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido", cliente_id: "", centro_custo_id: "" }); setModalAberto(true); }}
      labelBotao={t.receitas.novaReceita}>
      <div className="space-y-4">

        <div className="flex justify-end">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* KPIs originais */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.receitas.totalReceitas, value: fBRL(totalReceitas), cor: "#6ab0ff" },
            { label: t.receitas.recebido, value: fBRL(totalRecebido), cor: "#34d399" },
            { label: t.receitas.pendente, value: fBRL(totalPendente), cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-[10px] md:text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-sm md:text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* CAMADA CFO */}
        {temDados && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-3 md:p-4"
                  style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c }}>{k.v}</p>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
                </motion.div>
              ))}
            </div>

            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.12), rgba(6,182,212,0.10))", border: "1px solid rgba(139,92,246,0.22)" }}>
              <div className="marquee-rec py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#c4b5fd" : "#e2e8f0" }}>{m}<span style={{ color: "#8b5cf6" }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-rec{animation:marqueeRec 30s linear infinite}@keyframes marqueeRec{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-rec:hover{animation-play-state:paused}`}</style>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#8b5cf6,#06b6d4)", boxShadow: "0 0 12px #8b5cf6" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.analiseAnual}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.subAnalise}</p>
                  </div>
                </div>
                <div className="mb-4"><SubChart titulo={cx.evolucao} cor={CORES.roxo} option={optEvol} altura={260} /></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SubChart titulo={cx.composicao} cor={CORES.ouro} option={optCat} altura={240} />
                  <SubChart titulo={cx.previsao} cor={CORES.cyan} option={optPrev} altura={240} />
                </div>
              </div>
            </div>

            {insights.length > 0 && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: CORES.ouro }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9" }}>{cx.insights}</p>
                </div>
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: ins.tipo === "alerta" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${ins.tipo === "alerta" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                      {ins.tipo === "alerta" ? <AlertTriangle size={15} style={{ color: CORES.vermelho, flexShrink: 0 }} /> : <TrendingUp size={15} style={{ color: CORES.verde, flexShrink: 0 }} />}
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: ins.tipo === "alerta" ? "#fca5a5" : "#6ee7b7" }}>{textoInsight(lang, ins.chave)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Busca + filtro */}
        <div className="flex flex-col md:flex-row gap-3">
          <CanvasBox cor="#3b6fd4">
            <div className="flex items-center gap-2 py-1">
              <Search size={16} style={{ color: "#5a7a9a" }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.receitas.buscar}
                className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0", minWidth: "160px" }} />
            </div>
          </CanvasBox>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-3 rounded-2xl focus:outline-none text-sm"
            style={{ background: "rgba(10,20,36,0.7)", border: "1px solid rgba(59,111,212,0.25)", color: "#c8d8f0" }}>
            <option value="todas">{t.geral.todas}</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Tabela */}
        <CanvasBox cor="#6ab0ff">
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                    {[t.geral.descricao, t.geral.categoria, t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                      <th key={i} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {receitasFiltradas.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#5a7a9a" }}>{t.receitas.semReceitas}</td></tr>
                  ) : receitasFiltradas.map((r, i) => (
                    <motion.tr key={r.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ backgroundColor: "rgba(106,176,255,0.03)" }}
                      style={{ borderBottom: i < receitasFiltradas.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                      <td className="px-4 md:px-6 py-3 text-sm" style={{ color: "#c8d8f0" }}>
                        {r.descricao}
                        {r.cliente_id && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full ml-2" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>
                            👤 {clientesOpcoes.find(c => c.id === r.cliente_id)?.nome || "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: `${CAT_COR[r.categoria]}18`, color: CAT_COR[r.categoria] || "#6ab0ff" }}>{r.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#5a7a9a" }}>{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: r.status === "recebido" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: r.status === "recebido" ? "#34d399" : "#fbbf24" }}>{r.status === "recebido" ? t.receitas.recebido : t.receitas.pendente}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#34d399" }}>{fBRL(r.valor)}</td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(r)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(r.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CanvasBox>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }} className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? (lang === "en" ? "Edit Revenue" : lang === "es" ? "Editar Ingreso" : "Editar Receita") : t.receitas.novaReceita}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t.receitas.descricao, key: "descricao", type: "text" },
                    { label: t.receitas.valor, key: "valor", type: "number" },
                    { label: t.receitas.data, key: "data", type: "date" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                      <input type={type} value={novo[key as keyof typeof novo]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.receitas.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.clientes.cliente} <span style={{ color: "#5a7a9a", textTransform: "none" }}>({lang === "en" ? "optional" : lang === "es" ? "opcional" : "opcional"})</span></label>
                    <select value={novo.cliente_id} onChange={(e) => setNovo({ ...novo, cliente_id: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {t.clientes.cliente} --</option>
                      {clientesOpcoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>
                      {lang === "en" ? "Cost Center" : lang === "es" ? "Centro de Costo" : "Centro de Custo"} <span style={{ color: "#5a7a9a", textTransform: "none" }}>({lang === "en" ? "optional" : lang === "es" ? "opcional" : "opcional"})</span>
                    </label>
                    <select value={novo.centro_custo_id} onChange={(e) => setNovo({ ...novo, centro_custo_id: e.target.value })} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {lang === "en" ? "No cost center" : lang === "es" ? "Sin centro de costo" : "Sem centro de custo"} --</option>
                      {centrosCusto.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.receitas.status}</label>
                    <div className="flex gap-2">
                      {["recebido", "pendente"].map((s) => (
                        <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, status: s })} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.status === s ? (s === "recebido" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)") : "rgba(59,111,212,0.05)", color: novo.status === s ? (s === "recebido" ? "#34d399" : "#fbbf24") : "#5a7a9a", border: `1px solid ${novo.status === s ? (s === "recebido" ? "rgba(52,211,153,0.4)" : "rgba(251,191,36,0.4)") : "rgba(59,111,212,0.1)"}` }}>
                          {s === "recebido" ? t.receitas.recebido : t.receitas.pendente}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvar} disabled={salvando} className="w-full py-4 rounded-xl font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? (lang === "en" ? "Save Changes" : lang === "es" ? "Guardar Cambios" : "Salvar Alterações") : t.receitas.salvarReceita}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centro de Compartilhamento */}
      <AnimatePresence>
        {shareAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor="#8b5cf6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#c4b5fd" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canais.map(c => (
                    <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>{c.nome}</a>
                  ))}
                  <button onClick={copiar} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>{copiado ? cx.copiado : cx.copiar}</button>
                  <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>PDF</button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}