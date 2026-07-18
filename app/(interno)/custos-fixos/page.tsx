"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, X, Pencil, Share2, TrendingUp, AlertTriangle, Sparkles, Bell, Zap } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  fBRL, fBRL2, CORES, porCategoria, optRosca, optBarrasV,
  radarRenovacoes, detectarDesperdicio, type ItemRenovavel, type ItemDespesa,
} from "../../../lib/cfoCore";
import { cfoT, canaisCompartilhamento } from "../../../lib/cfoTextos";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categorias = ["Aluguel/Imóvel", "Folha de pagamento", "Serviços essenciais", "Sistemas e assinaturas", "Seguros", "Contabilidade", "Outros"];
const CAT_COR: Record<string, string> = {
  "Aluguel/Imóvel": CORES.roxo, "Folha de pagamento": CORES.azul, "Serviços essenciais": CORES.cyan,
  "Sistemas e assinaturas": CORES.laranja, "Seguros": CORES.teal, "Contabilidade": CORES.rosa, "Outros": CORES.amarelo,
};

type CustoFixo = {
  id: string; descricao: string; valor_mensal: number;
  dia_vencimento: number; categoria: string; data_renovacao?: string | null;
};

export default function CustosFixos() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CustoFixo | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", vencimento: "", categoria: categorias[0], renovacao: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => { carregarCustos(); }, []);

  const carregarCustos = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("custos_fixos").select("*").eq("user_id", user.id).order("dia_vencimento", { ascending: true });
    setCustos(data || []);
    setCarregando(false);
  };

  const fecharModal = () => { setModalAberto(false); setEditando(null); setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0], renovacao: "" }); };
  const abrirEdicao = (c: CustoFixo) => { setEditando(c); setNovo({ descricao: c.descricao, valor: String(c.valor_mensal), vencimento: String(c.dia_vencimento), categoria: c.categoria, renovacao: c.data_renovacao || "" }); setModalAberto(true); };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload: any = { descricao: novo.descricao, valor_mensal: parseFloat(novo.valor), dia_vencimento: parseInt(novo.vencimento || "1"), categoria: novo.categoria, data_renovacao: novo.renovacao || null };
    const { error } = editando
      ? await supabase.from("custos_fixos").update(payload).eq("id", editando.id)
      : await supabase.from("custos_fixos").insert({ ...payload, user_id: user.id });
    if (!error) { fecharModal(); await carregarCustos(); }
    setSalvando(false);
  };

  const excluir = async (id: string) => { await supabase.from("custos_fixos").delete().eq("id", id); setCustos(custos.filter(c => c.id !== id)); };

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMensal = custos.reduce((acc, c) => acc + c.valor_mensal, 0);
  const totalAnual = totalMensal * 12;

  // ═══════════ INTELIGÊNCIA CFO (alicerce) ═══════════
  const itensDespesa: ItemDespesa[] = custos.map(c => ({ descricao: c.descricao, valor: c.valor_mensal, categoria: c.categoria }));
  const itensRenov: ItemRenovavel[] = custos.map(c => ({ descricao: c.descricao, valor: c.valor_mensal, data_renovacao: c.data_renovacao, categoria: c.categoria }));
  const composicao = porCategoria(custos.map(c => ({ valor: c.valor_mensal, data: "", categoria: c.categoria })), categorias, CAT_COR);
  const renovacoes = radarRenovacoes(itensRenov, 60);
  const { alertas: alertasDup, economiaPotencial } = detectarDesperdicio(itensDespesa);
  const temDados = custos.length > 0;

  // Próximos vencimentos do mês (por dia_vencimento)
  const diaHoje = new Date().getDate();
  const proximosVenc = [...custos].filter(c => c.dia_vencimento >= diaHoje).sort((a, b) => a.dia_vencimento - b.dia_vencimento).slice(0, 5);

  const insights: { tipo: "alerta" | "positivo"; texto: string }[] = [];
  if (temDados) {
    if (alertasDup.length > 0) insights.push({ tipo: "alerta", texto: cx.alertaDuplicado });
    if (economiaPotencial > 0) insights.push({ tipo: "positivo", texto: `${cx.economiaPotencial}: ${fBRL(economiaPotencial)}/${lang === "en" ? "mo" : lang === "es" ? "mes" : "mês"}` });
    if (custos.length <= 6 && alertasDup.length === 0) insights.push({ tipo: "positivo", texto: cx.positivoEnxuto });
  }

  const rotuloUrg = (u: string) => u === "vencido" ? cx.urgVencido : u === "critico" ? cx.urgCritico : u === "proximo" ? cx.urgProximo : cx.urgFuturo;
  const corUrg = (u: string) => u === "vencido" ? CORES.vermelho : u === "critico" ? CORES.laranja : u === "proximo" ? CORES.amarelo : CORES.cyan;

  // ═══════════ PDF ═══════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: t.custosFixos.titulo, subtitulo: t.custosFixos.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Categoria", key: "categoria", width: 3 },
          { header: "Vencimento", key: "vencimento", width: 2 },
          { header: "Valor Mensal (R$)", key: "mensal", width: 3, align: "right" },
          { header: "Valor Anual (R$)", key: "anual", width: 3, align: "right" },
        ],
        linhas: custosFiltrados.map((c) => ({
          descricao: c.descricao, categoria: c.categoria, vencimento: `Dia ${c.dia_vencimento}`,
          mensal: fBRL2(c.valor_mensal), anual: fBRL2(c.valor_mensal * 12),
        })),
        resumo: [
          { label: "Total Mensal", valor: `R$ ${fBRL2(totalMensal)}` },
          { label: "Total Anual", valor: `R$ ${fBRL2(totalAnual)}` },
          { label: "Itens", valor: `${custos.length}` },
          { label: "Economia Potencial/mês", valor: `R$ ${fBRL2(economiaPotencial)}` },
        ],
        nomeArquivo: `axioma-custos-fixos-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════ COMPARTILHAR ═══════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.custosFixos.titulo}`,
    `📉 ${cx.totalMensal}: ${fBRL(totalMensal)} · ${cx.totalAnual}: ${fBRL(totalAnual)}`,
    economiaPotencial > 0 ? `💸 ${cx.economiaPotencial}: ${fBRL(economiaPotencial)}/mês` : "",
    renovacoes.length > 0 ? `🔔 ${renovacoes.length} ${cx.radarRenovacoes}` : "",
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${t.custosFixos.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  // ═══════════ GRÁFICOS ═══════════
  const optCat = optRosca(composicao, CORES.vermelho, cx.totalMensal.toUpperCase());
  const topCustos = [...custos].sort((a, b) => b.valor_mensal - a.valor_mensal).slice(0, 8);
  const optTop = optBarrasV(topCustos.map(c => c.valor_mensal), topCustos.map(c => c.descricao.length > 8 ? c.descricao.slice(0, 7) + "…" : c.descricao), CORES.laranja, CORES.laranjaC);

  const kpisCFO = [
    { l: cx.totalMensal, v: fBRL(totalMensal), c: CORES.vermelho, i: "📉" },
    { l: cx.totalAnual, v: fBRL(totalAnual), c: CORES.amarelo, i: "📅" },
    { l: t.custosFixos.itens, v: `${custos.length}`, c: CORES.azul, i: "📋" },
    { l: cx.economiaPotencial, v: fBRL(economiaPotencial), c: CORES.verde, i: "💸" },
    { l: cx.radarRenovacoes, v: `${renovacoes.length}`, c: renovacoes.length > 0 ? CORES.laranja : CORES.teal, i: "🔔" },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.totalMensal} ${fBRL(totalMensal)}`, `${cx.totalAnual} ${fBRL(totalAnual)}`,
    `${t.custosFixos.itens} ${custos.length}`,
    economiaPotencial > 0 ? `${cx.economiaPotencial} ${fBRL(economiaPotencial)}` : "",
    renovacoes.length > 0 ? `🔔 ${renovacoes.length} ${cx.radarRenovacoes}` : "",
  ].filter(Boolean);

  const SubChart = ({ titulo, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-[13px] font-black" style={{ color: "#f1f5f9" }}>{titulo}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  const fmtRenov = (r: typeof renovacoes[0]) => {
    if (r.diasRestantes < 0) return `${cx.diasVencido} ${Math.abs(r.diasRestantes)} ${cx.dias}`;
    if (r.diasRestantes === 0) return cx.hoje;
    if (r.diasRestantes === 1) return cx.amanha;
    return `${cx.renovaEm} ${r.diasRestantes} ${cx.dias}`;
  };

  return (
    <ModuloLayout titulo={t.custosFixos.titulo} subtitulo={t.custosFixos.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} labelBotao={t.custosFixos.novoCusto}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0], renovacao: "" }); setModalAberto(true); }}>
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
            { label: t.custosFixos.totalMensal, value: fBRL(totalMensal), cor: "#f87171" },
            { label: t.custosFixos.totalAnual, value: fBRL(totalAnual), cor: "#fbbf24" },
            { label: t.custosFixos.itens, value: `${custos.length}`, cor: "#6ab0ff" },
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
            {/* KPIs CFO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(239,68,68,0.12), rgba(249,115,22,0.10))", border: "1px solid rgba(239,68,68,0.22)" }}>
              <div className="marquee-cf py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#fca5a5" : "#e2e8f0" }}>{m}<span style={{ color: "#ef4444" }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-cf{animation:marqueeCf 30s linear infinite}@keyframes marqueeCf{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-cf:hover{animation-play-state:paused}`}</style>
            </div>

            {/* RADAR DE RENOVAÇÕES — o diferencial mundial */}
            {renovacoes.length > 0 && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(40,20,10,0.6), rgba(10,8,32,0.95))", border: "1px solid rgba(249,115,22,0.25)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Bell size={16} style={{ color: CORES.laranja }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9" }}>{cx.radarRenovacoes}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {renovacoes.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: `${corUrg(r.urgencia)}0e`, border: `1px solid ${corUrg(r.urgencia)}30` }}>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate" style={{ color: "#e2e8f0" }}>{r.descricao}</p>
                        <p className="text-[10px] font-medium" style={{ color: corUrg(r.urgencia) }}>{fmtRenov(r)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-black" style={{ color: corUrg(r.urgencia) }}>{fBRL(r.valor)}</p>
                        <span className="text-[8px] px-1.5 py-0.5 rounded font-black" style={{ background: `${corUrg(r.urgencia)}22`, color: corUrg(r.urgencia) }}>{rotuloUrg(r.urgencia)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODAL ÚNICO — Análise */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#ef4444,#f97316)", boxShadow: "0 0 12px #ef4444" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.analiseAnual}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.composicao} · {cx.economiaPotencial}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <SubChart titulo={cx.composicao} cor={CORES.vermelho} option={optCat} altura={260} />
                  <SubChart titulo={lang === "en" ? "Top Costs" : lang === "es" ? "Mayores Costos" : "Maiores Custos"} cor={CORES.laranja} option={optTop} altura={260} />
                </div>
              </div>
            </div>

            {/* Insights */}
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
                      {ins.tipo === "alerta" ? <AlertTriangle size={15} style={{ color: CORES.vermelho, flexShrink: 0 }} /> : <Zap size={15} style={{ color: CORES.verde, flexShrink: 0 }} />}
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: ins.tipo === "alerta" ? "#fca5a5" : "#6ee7b7" }}>{ins.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <Search size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.custosFixos.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Tabela */}
        <CanvasBox cor="#f87171">
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : (
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                    {[t.geral.descricao, t.geral.categoria, t.custosFixos.vencimento, t.custosFixos.valorMensal, t.custosFixos.valorAnual, t.geral.acoes].map(h => (
                      <th key={h} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {custosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm" style={{ color: "#5a7a9a" }}>{t.custosFixos.semCustos}</td></tr>
                  ) : custosFiltrados.map((c, i) => (
                    <motion.tr key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ backgroundColor: "rgba(248,113,113,0.02)" }}
                      style={{ borderBottom: i < custosFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                      <td className="px-4 md:px-6 py-3 text-sm" style={{ color: "#c8d8f0" }}>{c.descricao}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: `${CAT_COR[c.categoria]}18`, color: CAT_COR[c.categoria] || "#6ab0ff" }}>{c.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#5a7a9a" }}>Dia {c.dia_vencimento}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#f87171" }}>{fBRL(c.valor_mensal)}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#fbbf24" }}>{fBRL(c.valor_mensal * 12)}</td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex items-center gap-3">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(c)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(c.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
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
              <CanvasBox cor="#f87171">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#f87171" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? (lang === "en" ? "Edit Fixed Cost" : lang === "es" ? "Editar Costo Fijo" : "Editar Custo Fixo") : t.custosFixos.novoCusto}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: t.geral.descricao, key: "descricao", type: "text", placeholder: "" },
                    { label: t.custosFixos.valorMensal, key: "valor", type: "number", placeholder: "0,00" },
                    { label: t.custosFixos.vencimento, key: "vencimento", type: "number", placeholder: "Dia 1 a 31" },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                      <input type={type} placeholder={placeholder} value={novo[key as keyof typeof novo]}
                        onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* NOVO: data de renovação (radar) */}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block flex items-center gap-1.5" style={{ color: "#5a8fd4" }}>
                      <Bell size={12} /> {cx.radarRenovacoes} <span style={{ color: "#5a7a9a", textTransform: "none", letterSpacing: 0 }}>({lang === "en" ? "optional" : lang === "es" ? "opcional" : "opcional"})</span>
                    </label>
                    <input type="date" value={novo.renovacao} onChange={(e) => setNovo({ ...novo, renovacao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(249,115,22,0.25)", color: "#c8d8f0" }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60" style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? (lang === "en" ? "Save Changes" : lang === "es" ? "Guardar Cambios" : "Salvar Alterações") : t.custosFixos.salvarCusto}
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