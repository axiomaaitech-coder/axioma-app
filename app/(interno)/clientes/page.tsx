"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Pencil, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  cidade: string;
  status: string;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

type Conta = {
  id: string;
  descricao: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  status: string;
  cliente_id: string | null;
  user_id: string;
  empresa_id: string;
  created_at: string;
};

function NeonBox({ children, cor = "#6ab0ff" }: { children: React.ReactNode; cor?: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      background: "rgba(10,22,40,0.85)",
      border: `1px solid ${cor}30`,
      boxShadow: `0 0 20px ${cor}10, inset 0 1px 0 ${cor}15`,
    }}>
      <motion.div
        animate={{ left: ["-15%", "115%", "-15%"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
        className="absolute top-0 h-[1.5px] w-16 z-10 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${cor}, transparent)`, boxShadow: `0 0 10px ${cor}`, borderRadius: "999px" }}
      />
      <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at top left, ${cor}12 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none" style={{ background: `radial-gradient(circle at bottom right, ${cor}08 0%, transparent 70%)` }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ModalPremium({ aberto, onFechar, cor = "#6ab0ff", titulo, children }: {
  aberto: boolean; onFechar: () => void; cor?: string; titulo: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md rounded-2xl p-6 max-h-screen overflow-y-auto relative"
            style={{ background: "rgba(6,15,30,0.98)", border: `1px solid ${cor}25`, boxShadow: `0 0 60px ${cor}15` }}
          >
            <div className="absolute top-0 left-0 w-20 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${cor}, transparent)`, boxShadow: `0 0 12px ${cor}` }} />
            <div className="absolute top-0 left-0 w-[2px] h-20 rounded-full" style={{ background: `linear-gradient(180deg, ${cor}, transparent)`, boxShadow: `0 0 12px ${cor}` }} />
            <div className="absolute bottom-0 right-0 w-20 h-[2px] rounded-full" style={{ background: "linear-gradient(270deg, #34d399, transparent)", boxShadow: "0 0 12px #34d399" }} />
            <div className="absolute bottom-0 right-0 w-[2px] h-20 rounded-full" style={{ background: "linear-gradient(0deg, #34d399, transparent)", boxShadow: "0 0 12px #34d399" }} />
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h3>
              <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#3a5a8a" }}><X size={20} /></motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ClientesPage() {
  const { t, idioma } = useLanguage();
  const cl = t.clientes;
  const conteudoRef = useRef<HTMLDivElement>(null);

  const [aba, setAba] = useState<"clientes" | "contas">("clientes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [exportando, setExportando] = useState(false);

  const [modalCliente, setModalCliente] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<Cliente | null>(null);
  const [nomeCliente, setNomeCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [documentoCliente, setDocumentoCliente] = useState("");
  const [cidadeCliente, setCidadeCliente] = useState("");
  const [salvandoCliente, setSalvandoCliente] = useState(false);

  const [modalConta, setModalConta] = useState(false);
  const [descricaoConta, setDescricaoConta] = useState("");
  const [valorConta, setValorConta] = useState("");
  const [vencimentoConta, setVencimentoConta] = useState("");
  const [clienteConta, setClienteConta] = useState("");
  const [salvandoConta, setSalvandoConta] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const { data: clientesData } = await supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: contasData } = await supabase.from("contas_receber").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true });
    setClientes(clientesData || []);
    setContas(contasData || []);
    setLoading(false);
  }

  async function salvarCliente() {
    if (!nomeCliente.trim()) return;
    setSalvandoCliente(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    if (editandoCliente) {
      await supabase.from("clientes").update({ nome: nomeCliente, email: emailCliente, telefone: telefoneCliente, documento: documentoCliente, cidade: cidadeCliente }).eq("id", editandoCliente.id);
    } else {
      await supabase.from("clientes").insert({ nome: nomeCliente, email: emailCliente, telefone: telefoneCliente, documento: documentoCliente, cidade: cidadeCliente, status: "ativo", user_id: user.id, empresa_id: empresaId });
    }
    fecharModalCliente();
    setSalvandoCliente(false);
    carregarDados();
  }

  async function excluirCliente(id: string) {
    await supabase.from("clientes").delete().eq("id", id);
    carregarDados();
  }

  async function salvarConta() {
    if (!descricaoConta.trim() || !valorConta || !vencimentoConta) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("contas_receber").insert({ descricao: descricaoConta, valor: parseFloat(valorConta), data_vencimento: vencimentoConta, status: "pendente", cliente_id: clienteConta || null, user_id: user.id, empresa_id: empresaId });
    setModalConta(false);
    setDescricaoConta(""); setValorConta(""); setVencimentoConta(""); setClienteConta("");
    setSalvandoConta(false);
    carregarDados();
  }

  async function marcarRecebido(id: string) {
    await supabase.from("contas_receber").update({ status: "recebido", data_recebimento: new Date().toISOString().split("T")[0] }).eq("id", id);
    carregarDados();
  }

  function abrirEditarCliente(cliente: Cliente) {
    setEditandoCliente(cliente);
    setNomeCliente(cliente.nome);
    setEmailCliente(cliente.email || "");
    setTelefoneCliente(cliente.telefone || "");
    setDocumentoCliente(cliente.documento || "");
    setCidadeCliente(cliente.cidade || "");
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false);
    setEditandoCliente(null);
    setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente("");
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
      pdf.setFillColor(2, 8, 16); pdf.rect(0, 0, pdfWidth, 20, "F");
      pdf.setTextColor(106, 176, 255); pdf.setFontSize(14); pdf.setFont("helvetica", "bold");
      pdf.text("AXIOMA AI.TECH", 14, 13);
      pdf.setTextColor(58, 90, 138); pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
      pdf.text(`${cl.titulo} - ${new Date().toLocaleDateString("pt-BR")}`, pdfWidth - 14, 13, { align: "right" });
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
      pdf.save(`axioma-clientes-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const hoje = new Date().toISOString().split("T")[0];
  const totalReceber = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido").reduce((s, c) => s + c.valor, 0);
  const totalVencido = contas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);
  const clientesFiltrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()));
  const contasFiltradas = contas.filter(c => c.descricao.toLowerCase().includes(busca.toLowerCase()));
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function getStatusCor(status: string, vencimento: string) {
    if (status === "recebido") return { cor: "#34d399", bg: "rgba(52,211,153,0.1)", label: cl.recebido };
    if (vencimento < hoje) return { cor: "#f87171", bg: "rgba(248,113,113,0.1)", label: cl.vencido };
    return { cor: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: cl.pendente };
  }

  const botaoCobranca = (
    <motion.button
      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalConta(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}
    >
      + {cl.novaCobranca}
    </motion.button>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810", minHeight: "100vh" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ModuloLayout
      titulo={`👥 ${cl.titulo}`}
      subtitulo={cl.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={() => { setEditandoCliente(null); setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente(""); setModalCliente(true); }}
      labelBotao={cl.novoCliente}
      botaoExtra={botaoCobranca}
    >
      <div ref={conteudoRef} className="space-y-4">

        {/* Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
            { label: cl.totalReceber, valor: fmt(totalReceber), cor: "#fbbf24" },
            { label: cl.totalRecebido, valor: fmt(totalRecebido), cor: "#34d399" },
            { label: cl.totalVencido, valor: fmt(totalVencido), cor: "#f87171" },
          ].map((card, i) => (
            <NeonBox key={i} cor={card.cor}>
              <div className="p-4">
                <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
                <p className="text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
              </div>
            </NeonBox>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {[{ key: "clientes", label: cl.abaClientes }, { key: "contas", label: cl.abaContas }].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBusca(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}`, boxShadow: aba === a.key ? "0 0 12px rgba(106,176,255,0.15)" : "none" }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* Busca */}
        <NeonBox cor="#3b6fd4">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cl.buscar}
            className="w-full px-4 py-3 text-sm focus:outline-none bg-transparent"
            style={{ color: "#c8d8f0" }} />
        </NeonBox>

        {/* Lista Clientes */}
        {aba === "clientes" && (
          <div className="space-y-3">
            {clientesFiltrados.length === 0 ? (
              <NeonBox cor="#3b6fd4">
                <div className="p-8 text-center"><p style={{ color: "#3a5a8a" }}>{cl.semClientes}</p></div>
              </NeonBox>
            ) : clientesFiltrados.map((cliente, i) => (
              <motion.div key={cliente.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <NeonBox cor="#6ab0ff">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                          style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff", boxShadow: "0 0 12px rgba(106,176,255,0.3)" }}
                        >
                          {cliente.nome.charAt(0).toUpperCase()}
                        </motion.div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{cliente.nome}</p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "#3a5a8a" }}>{cliente.email}{cliente.telefone ? ` • ${cliente.telefone}` : ""}</p>
                          {cliente.cidade && <p className="text-xs" style={{ color: "#3a5a8a" }}>{cliente.cidade}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                          {cliente.status === "ativo" ? cl.ativo : cl.inativo}
                        </span>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCliente(cliente)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCliente(cliente.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                      </div>
                    </div>
                  </div>
                </NeonBox>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lista Contas */}
        {aba === "contas" && (
          <div className="space-y-3">
            {contasFiltradas.length === 0 ? (
              <NeonBox cor="#3b6fd4">
                <div className="p-8 text-center"><p style={{ color: "#3a5a8a" }}>{cl.semContas}</p></div>
              </NeonBox>
            ) : contasFiltradas.map((conta, i) => {
              const cliente = clientes.find(c => c.id === conta.cliente_id);
              const statusInfo = getStatusCor(conta.status, conta.data_vencimento);
              return (
                <motion.div key={conta.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <NeonBox cor={statusInfo.cor}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{conta.descricao}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>
                            {cliente ? `${cliente.nome} • ` : ""}{cl.vencimento}: {new Date(conta.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold" style={{ color: statusInfo.cor }}>{fmt(conta.valor)}</p>
                          <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.cor }}>{statusInfo.label}</span>
                          {conta.status === "pendente" && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                              onClick={() => marcarRecebido(conta.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                              {cl.marcarRecebido}
                            </motion.button>
                          )}
                        </div>
                      </div>
                    </div>
                  </NeonBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      <ModalPremium aberto={modalCliente} onFechar={fecharModalCliente} cor="#6ab0ff" titulo={editandoCliente ? cl.editarCliente : cl.novoCliente}>
        <div className="space-y-3">
          {[
            { label: cl.nome, value: nomeCliente, set: setNomeCliente },
            { label: cl.email, value: emailCliente, set: setEmailCliente },
            { label: cl.telefone, value: telefoneCliente, set: setTelefoneCliente },
            { label: cl.documento, value: documentoCliente, set: setDocumentoCliente },
            { label: cl.cidade, value: cidadeCliente, set: setCidadeCliente },
          ].map((campo) => (
            <div key={campo.label}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
              <input value={campo.value} onChange={(e) => campo.set(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalCliente} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={salvarCliente} disabled={salvandoCliente}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {salvandoCliente ? "..." : cl.salvarCliente}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Conta */}
      <ModalPremium aberto={modalConta} onFechar={() => setModalConta(false)} cor="#34d399" titulo={cl.novaCobranca}>
        <div className="space-y-3">
          {[
            { label: cl.descricao, value: descricaoConta, set: setDescricaoConta, type: "text" },
            { label: cl.valor, value: valorConta, set: setValorConta, type: "number" },
            { label: cl.vencimento, value: vencimentoConta, set: setVencimentoConta, type: "date" },
          ].map((campo) => (
            <div key={campo.label}>
              <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
              <input type={campo.type} value={campo.value} onChange={(e) => campo.set(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.cliente}</label>
            <select value={clienteConta} onChange={(e) => setClienteConta(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
              <option value="">-- {cl.cliente} --</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalConta(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={salvarConta} disabled={salvandoConta}
              className="flex-1 py-3 rounded-xl text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
              {salvandoConta ? "..." : cl.salvarCobranca}
            </motion.button>
          </div>
        </div>
      </ModalPremium>
    </ModuloLayout>
  );
}