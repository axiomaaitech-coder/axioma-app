"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, X, Pencil } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const tipos = ["Empréstimo bancário","Cartão de crédito","Cheque especial","Financiamento","Carta de crédito","Outros"];

type Divida = {
  id: string; descricao: string; tipo: string; valor_total: number;
  valor_pago: number; parcelas: number; vencimento: string; taxa_juros: number;
};

export default function Endividamento() {
  const { t } = useLanguage();
  const [dividas, setDividas] = useState<Divida[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Divida | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarDividas(); }, []);

  const carregarDividas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("dividas").select("*").eq("user_id", user.id).order("vencimento", { ascending: true });
    setDividas(data || []);
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" });
  };

  const abrirEdicao = (d: Divida) => {
    setEditando(d);
    setNovo({ descricao: d.descricao, tipo: d.tipo, valor_total: String(d.valor_total), valor_pago: String(d.valor_pago), parcelas: String(d.parcelas), vencimento: d.vencimento, taxa_juros: String(d.taxa_juros) });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor_total) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = {
      descricao: novo.descricao, tipo: novo.tipo,
      valor_total: parseFloat(novo.valor_total),
      valor_pago: parseFloat(novo.valor_pago || "0"),
      parcelas: parseInt(novo.parcelas || "1"),
      vencimento: novo.vencimento,
      taxa_juros: parseFloat(novo.taxa_juros || "0"),
    };
    editando
      ? await supabase.from("dividas").update(payload).eq("id", editando.id)
      : await supabase.from("dividas").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarDividas(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("dividas").delete().eq("id", id);
    setDividas(dividas.filter(d => d.id !== id));
  };

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: t.endividamento.titulo,
        subtitulo: t.endividamento.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Tipo", key: "tipo", width: 3 },
          { header: "Total (R$)", key: "total", width: 2, align: "right" },
          { header: "Pago (R$)", key: "pago", width: 2, align: "right" },
          { header: "Restante (R$)", key: "restante", width: 2, align: "right" },
          { header: "Juros", key: "juros", width: 2, align: "right" },
        ],
        linhas: dividasFiltradas.map((d) => ({
          descricao: d.descricao,
          tipo: d.tipo,
          total: fmtN(d.valor_total),
          pago: fmtN(d.valor_pago),
          restante: fmtN(d.valor_total - d.valor_pago),
          juros: `${d.taxa_juros}% a.m.`,
        })),
        resumo: [
          { label: "Total de Dívidas", valor: `R$ ${fmtN(totalDivida)}` },
          { label: "Total Pago", valor: `R$ ${fmtN(totalPago)}` },
          { label: "Saldo Restante", valor: `R$ ${fmtN(totalRestante)}` },
        ],
        nomeArquivo: `axioma-endividamento-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const dividasFiltradas = dividas.filter(d => d.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalDivida = dividas.reduce((acc, d) => acc + d.valor_total, 0);
  const totalPago = dividas.reduce((acc, d) => acc + d.valor_pago, 0);
  const totalRestante = totalDivida - totalPago;

  return (
    <ModuloLayout titulo={t.endividamento.titulo} subtitulo={t.endividamento.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: tipos[0], valor_total: "", valor_pago: "", parcelas: "", vencimento: "", taxa_juros: "" }); setModalAberto(true); }}
      labelBotao={t.endividamento.novaDivida}>
      <div className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.endividamento.totalDividas, value: `R$ ${totalDivida.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.endividamento.totalPago, value: `R$ ${totalPago.toLocaleString("pt-BR")}`, cor: "#34d399" },
            { label: t.endividamento.saldoRestante, value: `R$ ${totalRestante.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <Search size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.endividamento.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Lista dívidas */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dividasFiltradas.length === 0 ? (
          <CanvasBox cor="#f87171">
            <div className="text-center py-8"><p style={{ color: "#5a7a9a" }}>{t.endividamento.semDividas}</p></div>
          </CanvasBox>
        ) : (
          <div className="space-y-4">
            {dividasFiltradas.map((d, i) => {
              const progresso = (d.valor_pago / d.valor_total) * 100;
              const restante = d.valor_total - d.valor_pago;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <CanvasBox cor="#f87171">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold mb-1" style={{ color: "#c8d8f0" }}>{d.descricao}</h3>
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(248,113,113,0.1)", color: "#f87171" }}>{d.tipo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{t.endividamento.taxaJuros}</p>
                          <p className="font-black text-sm" style={{ color: "#fbbf24" }}>{d.taxa_juros}% a.m.</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(d)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(d.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                      {[
                        { label: t.endividamento.valorTotal, value: `R$ ${d.valor_total.toLocaleString("pt-BR")}`, cor: "#f87171" },
                        { label: t.endividamento.jaPago, value: `R$ ${d.valor_pago.toLocaleString("pt-BR")}`, cor: "#34d399" },
                        { label: t.endividamento.restante, value: `R$ ${restante.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{item.label}</p>
                          <p className="font-black text-sm" style={{ color: item.cor }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs" style={{ color: "#5a7a9a" }}>{t.endividamento.progresso}</span>
                        <span className="text-xs font-black" style={{ color: "#6ab0ff" }}>{progresso.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(progresso, 100)}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.08 }}
                          className="h-2 rounded-full"
                          style={{ background: `linear-gradient(90deg, #1a3a8f, #6ab0ff)` }} />
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 flex-wrap gap-1">
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{t.endividamento.vencimento}: {new Date(d.vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{d.parcelas}x {t.endividamento.parcelas}</span>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#f87171">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#f87171" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Dívida" : t.endividamento.novaDivida}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
                    <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.tipo} onChange={(e) => setNovo({ ...novo, tipo: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {tipos.map(tp => <option key={tp}>{tp}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t.endividamento.valorTotal, key: "valor_total" },
                      { label: t.endividamento.jaPago, key: "valor_pago" },
                      { label: t.endividamento.parcelas, key: "parcelas" },
                      { label: t.endividamento.taxaJuros, key: "taxa_juros" },
                    ].map(({ label, key }) => (
                      <div key={key}>
                        <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{label}</label>
                        <input type="number" value={novo[key as keyof typeof novo]}
                          onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.endividamento.vencimento}</label>
                    <input type="date" value={novo.vencimento} onChange={(e) => setNovo({ ...novo, vencimento: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.endividamento.salvarDivida}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}