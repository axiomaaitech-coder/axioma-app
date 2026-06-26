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

const categorias = ["Aluguel/Imóvel","Folha de pagamento","Serviços essenciais","Sistemas e assinaturas","Seguros","Contabilidade","Outros"];

type CustoFixo = {
  id: string; descricao: string; valor_mensal: number;
  dia_vencimento: number; categoria: string;
};

export default function CustosFixos() {
  const { t } = useLanguage();
  const [custos, setCustos] = useState<CustoFixo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<CustoFixo | null>(null);
  const [novo, setNovo] = useState({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);

  useEffect(() => { carregarCustos(); }, []);

  const carregarCustos = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data } = await supabase.from("custos_fixos").select("*").eq("user_id", user.id).order("dia_vencimento", { ascending: true });
    setCustos(data || []);
    setCarregando(false);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] });
  };

  const abrirEdicao = (c: CustoFixo) => {
    setEditando(c);
    setNovo({ descricao: c.descricao, valor: String(c.valor_mensal), vencimento: String(c.dia_vencimento), categoria: c.categoria });
    setModalAberto(true);
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, valor_mensal: parseFloat(novo.valor), dia_vencimento: parseInt(novo.vencimento || "1"), categoria: novo.categoria };
    const { error } = editando
      ? await supabase.from("custos_fixos").update(payload).eq("id", editando.id)
      : await supabase.from("custos_fixos").insert({ ...payload, user_id: user.id });
    if (!error) { fecharModal(); await carregarCustos(); }
    setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("custos_fixos").delete().eq("id", id);
    setCustos(custos.filter(c => c.id !== id));
  };

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: t.custosFixos.titulo,
        subtitulo: t.custosFixos.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 },
          { header: "Categoria", key: "categoria", width: 3 },
          { header: "Vencimento", key: "vencimento", width: 2 },
          { header: "Valor Mensal (R$)", key: "mensal", width: 3, align: "right" },
          { header: "Valor Anual (R$)", key: "anual", width: 3, align: "right" },
        ],
        linhas: custosFiltrados.map((c) => ({
          descricao: c.descricao,
          categoria: c.categoria,
          vencimento: `Dia ${c.dia_vencimento}`,
          mensal: fmt(c.valor_mensal),
          anual: fmt(c.valor_mensal * 12),
        })),
        resumo: [
          { label: "Total Mensal", valor: `R$ ${fmt(totalMensal)}` },
          { label: "Total Anual", valor: `R$ ${fmt(totalMensal * 12)}` },
          { label: "Itens", valor: `${custos.length}` },
        ],
        nomeArquivo: `axioma-custos-fixos-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const custosFiltrados = custos.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const totalMensal = custos.reduce((acc, c) => acc + c.valor_mensal, 0);

  return (
    <ModuloLayout titulo={t.custosFixos.titulo} subtitulo={t.custosFixos.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} labelBotao={t.custosFixos.novoCusto}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", valor: "", vencimento: "", categoria: categorias[0] }); setModalAberto(true); }}>
      <div className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: t.custosFixos.totalMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.custosFixos.totalAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, cor: "#fbbf24" },
            { label: t.custosFixos.itens, value: `${custos.length}`, cor: "#6ab0ff" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-base md:text-2xl font-black" style={{ color: card.cor }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

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
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
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
                      <td className="px-4 md:px-6 py-3"><span className="text-xs px-2 py-1 rounded-full whitespace-nowrap" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{c.categoria}</span></td>
                      <td className="px-4 md:px-6 py-3 text-sm whitespace-nowrap" style={{ color: "#5a7a9a" }}>Dia {c.dia_vencimento}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#f87171" }}>R$ {c.valor_mensal.toLocaleString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-black whitespace-nowrap" style={{ color: "#fbbf24" }}>R$ {(c.valor_mensal * 12).toLocaleString("pt-BR")}</td>
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

      {/* Modal */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#f87171">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#f87171" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editando ? "Editar Custo Fixo" : t.custosFixos.novoCusto}</h3>
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
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.categoria}</label>
                    <select value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {categorias.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.custosFixos.salvarCusto}
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