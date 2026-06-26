"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, Pencil, X } from "lucide-react";
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
    setModalAberto(false); setEditando(null);
    setNovo({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" });
  };

  const salvar = async () => {
    if (!novo.nome || !novo.valor_mensal) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { nome: novo.nome, produto_servico: novo.produto_servico, contato: novo.contato, valor_mensal: parseFloat(novo.valor_mensal), categoria: novo.categoria };
    editando
      ? await supabase.from("fornecedores").update(payload).eq("id", editando.id)
      : await supabase.from("fornecedores").insert({ ...payload, user_id: user.id });
    fecharModal(); await carregarFornecedores(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    await supabase.from("fornecedores").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  // PDF preto e branco (relatório/auditoria)
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: t.fornecedores.titulo,
        subtitulo: t.fornecedores.subtitulo,
        colunas: [
          { header: "Nome", key: "nome", width: 3 },
          { header: "Categoria", key: "categoria", width: 2 },
          { header: "Produto/Serviço", key: "produto", width: 3 },
          { header: "Contato", key: "contato", width: 2 },
          { header: "Mensal (R$)", key: "mensal", width: 2, align: "right" },
          { header: "Anual (R$)", key: "anual", width: 2, align: "right" },
        ],
        linhas: fornecedoresFiltrados.map((f) => ({
          nome: f.nome,
          categoria: f.categoria || "-",
          produto: f.produto_servico || "-",
          contato: f.contato || "-",
          mensal: fmtN(f.valor_mensal || 0),
          anual: fmtN((f.valor_mensal || 0) * 12),
        })),
        resumo: [
          { label: t.fornecedores.gastoMensal, valor: `R$ ${fmtN(totalMensal)}` },
          { label: t.fornecedores.gastoAnual, valor: `R$ ${fmtN(totalMensal * 12)}` },
          { label: t.fornecedores.totalFornecedores, valor: `${fornecedores.length}` },
        ],
        nomeArquivo: `axioma-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
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
      onNovo={() => { setEditando(null); setNovo({ nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "" }); setModalAberto(true); }}
      labelBotao={t.fornecedores.novoFornecedor}
    >
      <div className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.fornecedores.gastoMensal, value: `R$ ${totalMensal.toLocaleString("pt-BR")}`, cor: "#f87171" },
            { label: t.fornecedores.gastoAnual, value: `R$ ${(totalMensal * 12).toLocaleString("pt-BR")}`, cor: "#fbbf24" },
            { label: t.fornecedores.totalFornecedores, value: `${fornecedores.length} ${t.fornecedores.ativos}`, cor: "#6ab0ff" },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#5a7a9a" }}>{card.label}</p>
              <p className="text-2xl font-bold" style={{ color: card.cor }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2">
            <Search size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Tabela */}
        <CanvasBox cor="#6ab0ff">
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fornecedoresFiltrados.length === 0 ? (
            <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{t.fornecedores.semFornecedores}</p></div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(59,111,212,0.15)" }}>
                      {[t.fornecedores.nome, t.geral.categoria, t.fornecedores.produto, t.fornecedores.contato, t.geral.mensal, t.geral.anual, t.geral.acoes].map(h => (
                        <th key={h} className="text-left px-4 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fornecedoresFiltrados.map((f, i) => (
                      <motion.tr key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ borderBottom: i < fornecedoresFiltrados.length - 1 ? "1px solid rgba(59,111,212,0.08)" : "none" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                            <span className="text-sm" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span></td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#c8d8f0" }}>{f.produto_servico}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "#5a7a9a" }}>{f.contato}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#f87171" }}>R$ {f.valor_mensal.toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: "#fbbf24" }}>R$ {(f.valor_mensal * 12).toLocaleString("pt-BR")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-3">
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden divide-y" style={{ borderColor: "rgba(59,111,212,0.08)" }}>
                {fornecedoresFiltrados.map((f) => (
                  <div key={f.id} className="py-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0)}</div>
                        <span className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{f.nome}</span>
                      </div>
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs ml-11">
                      <span className="px-2 py-1 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span>
                      <span style={{ color: "#5a7a9a" }}>{f.produto_servico}</span>
                    </div>
                    <div className="flex justify-between ml-11 text-xs">
                      <span style={{ color: "#5a7a9a" }}>{f.contato}</span>
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
        </CanvasBox>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto"
            >
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>
                      {editando ? t.fornecedores.salvarFornecedor : t.fornecedores.novoFornecedor}
                    </h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
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
                      <input type={type} value={(novo as any)[key]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
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
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fornecedores.salvarFornecedor}
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