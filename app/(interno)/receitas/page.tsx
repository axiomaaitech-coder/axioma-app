"use client";
import { useState, useEffect, useRef } from "react";
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

const categorias = ["Vendas de produtos", "Prestação de serviços", "Recorrentes", "Eventuais", "Outras"];

type Receita = {
  id: string; descricao: string; valor: number;
  data: string; categoria: string; status: string;
};

export default function Receitas() {
  const { t, idioma } = useLanguage();
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  const carregarReceitas = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("receitas").select("*").eq("user_id", user.id).order("data", { ascending: false });
    setReceitas(data || []);
    setCarregando(false);
  };

  useEffect(() => { carregarReceitas(); }, []);

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" });
  };

  const abrirEdicao = (r: Receita) => {
    setEditando(r);
    setNovo({ descricao: r.descricao, valor: String(r.valor), data: r.data, categoria: r.categoria, status: r.status });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, valor: parseFloat(novo.valor), data: novo.data || new Date().toISOString().slice(0, 10), categoria: novo.categoria, status: novo.status };
    const { error } = editando
      ? await supabase.from("receitas").update(payload).eq("id", editando.id)
      : await supabase.from("receitas").insert({ ...payload, user_id: user.id });
    if (!error) { fecharModal(); await carregarReceitas(); }
    setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("receitas").delete().eq("id", id);
    setReceitas(receitas.filter(r => r.id !== id));
  };

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: t.receitas.titulo,
        subtitulo: t.receitas.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Categoria", key: "categoria", width: 3 },
          { header: "Data", key: "data", width: 2 },
          { header: "Status", key: "status", width: 2 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
        ],
        linhas: receitasFiltradas.map((r) => ({
          descricao: r.descricao,
          categoria: r.categoria,
          data: r.data ? new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR") : "-",
          status: r.status === "recebido" ? "Recebido" : "Pendente",
          valor: fmt(r.valor),
        })),
        resumo: [
          { label: "Total de Receitas", valor: `R$ ${fmt(totalReceitas)}` },
          { label: "Recebido", valor: `R$ ${fmt(totalRecebido)}` },
          { label: "Pendente", valor: `R$ ${fmt(totalPendente)}` },
        ],
        nomeArquivo: `axioma-receitas-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
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
    <ModuloLayout titulo={t.receitas.titulo} subtitulo={t.receitas.subtitulo} onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", data: "", categoria: categorias[0], status: "recebido" }); setModalAberto(true); }}
      labelBotao={t.receitas.novaReceita}>
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.receitas.totalReceitas, value: `R$ ${totalReceitas.toLocaleString("pt-BR")}`, cor: "#6ab0ff" },
            { label: t.receitas.recebido, value: `R$ ${totalRecebido.toLocaleString("pt-BR")}`, cor: "#34d399" },
            { label: t.receitas.pendente, value: `R$ ${totalPendente.toLocaleString("pt-BR")}`, cor: "#fbbf24" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-base md:text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <CanvasBox cor="#3b6fd4">
            <div className="flex items-center gap-2 py-1">
              <Search size={16} style={{ color: "#5a7a9a" }} />
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.receitas.buscar}
                className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0", minWidth: "200px" }} />
            </div>
          </CanvasBox>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-4 py-3 rounded-2xl focus:outline-none text-sm"
            style={{ background: "rgba(10,20,36,0.7)", border: "1px solid rgba(59,111,212,0.25)", color: "#c8d8f0" }}>
            <option value="todas">{t.geral.todas}</option>
            {categorias.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <CanvasBox cor="#6ab0ff">
          <div className="overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
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
                      <td className="px-4 md:px-6 py-3 text-sm" style={{ color: "#c8d8f0" }}>{r.descricao}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{r.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#5a7a9a" }}>{new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full" style={{ background: r.status === "recebido" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: r.status === "recebido" ? "#34d399" : "#fbbf24" }}>{r.status === "recebido" ? t.receitas.recebido : t.receitas.pendente}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#34d399" }}>R$ {r.valor.toLocaleString("pt-BR")}</td>
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

      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Receita" : t.receitas.novaReceita}</h3>
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
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.receitas.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.receitas.status}</label>
                    <div className="flex gap-2">
                      {["recebido", "pendente"].map((s) => (
                        <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, status: s })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.status === s ? (s === "recebido" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)") : "rgba(59,111,212,0.05)", color: novo.status === s ? (s === "recebido" ? "#34d399" : "#fbbf24") : "#5a7a9a", border: `1px solid ${novo.status === s ? (s === "recebido" ? "rgba(52,211,153,0.4)" : "rgba(251,191,36,0.4)") : "rgba(59,111,212,0.1)"}` }}>
                          {s === "recebido" ? t.receitas.recebido : t.receitas.pendente}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.receitas.salvarReceita}
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