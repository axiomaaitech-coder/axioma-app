"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { Pencil, Trash2, X, Phone, Mail, MapPin, FileText, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Cliente = {
  id: string; nome: string; email: string; telefone: string;
  documento: string; cidade: string; status: string;
  user_id: string; empresa_id: string; created_at: string;
};

type Conta = {
  id: string; descricao: string; valor: number; data_vencimento: string;
  data_recebimento: string | null; status: string; cliente_id: string | null;
  user_id: string; empresa_id: string; created_at: string;
};

export default function ClientesPage() {
  const { t, idioma } = useLanguage();
  const cl = t.clientes;

  const [aba, setAba] = useState<"clientes" | "contas">("clientes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [buscaClientes, setBuscaClientes] = useState("");
  const [buscaContas, setBuscaContas] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
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
    fecharModalCliente(); setSalvandoCliente(false); carregarDados();
  }

  async function excluirCliente(id: string) {
    await supabase.from("clientes").delete().eq("id", id);
    if (clienteSelecionado?.id === id) setClienteSelecionado(null);
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
    setSalvandoConta(false); carregarDados();
  }

  async function marcarRecebido(id: string) {
    await supabase.from("contas_receber").update({ status: "recebido", data_recebimento: new Date().toISOString().split("T")[0] }).eq("id", id);
    carregarDados();
  }

  function verContasCliente(cliente: Cliente) {
    setClienteSelecionado(cliente); setAba("contas"); setBuscaContas("");
  }

  function abrirEditarCliente(cliente: Cliente) {
    setEditandoCliente(cliente); setNomeCliente(cliente.nome); setEmailCliente(cliente.email || "");
    setTelefoneCliente(cliente.telefone || ""); setDocumentoCliente(cliente.documento || ""); setCidadeCliente(cliente.cidade || "");
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false); setEditandoCliente(null);
    setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente("");
  }

  // PDF preto e branco (relatório/auditoria) — exporta a aba ativa
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (aba === "clientes") {
        gerarPdfTabela({
          titulo: cl.titulo,
          subtitulo: cl.subtitulo,
          colunas: [
            { header: "Nome", key: "nome", width: 3 },
            { header: "E-mail", key: "email", width: 3 },
            { header: "Telefone", key: "telefone", width: 2 },
            { header: "Cidade", key: "cidade", width: 2 },
            { header: "Status", key: "status", width: 2 },
          ],
          linhas: clientesFiltrados.map((c) => ({
            nome: c.nome,
            email: c.email || "-",
            telefone: c.telefone || "-",
            cidade: c.cidade || "-",
            status: c.status === "ativo" ? cl.ativo : cl.inativo,
          })),
          resumo: [
            { label: cl.totalClientes, valor: `${clientes.length}` },
            { label: cl.totalReceber, valor: `R$ ${fmtN(totalReceber)}` },
            { label: cl.totalRecebido, valor: `R$ ${fmtN(totalRecebido)}` },
            { label: cl.totalVencido, valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-clientes-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      } else {
        gerarPdfTabela({
          titulo: `${cl.titulo} - ${cl.abaContas}`,
          subtitulo: clienteSelecionado ? clienteSelecionado.nome : cl.subtitulo,
          colunas: [
            { header: "Descrição", key: "descricao", width: 4 },
            { header: "Cliente", key: "cliente", width: 3 },
            { header: "Vencimento", key: "venc", width: 2 },
            { header: "Status", key: "status", width: 2 },
            { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
          ],
          linhas: contasFiltradas.map((c) => {
            const cliNome = clientes.find(x => x.id === c.cliente_id)?.nome || "-";
            const st = c.status === "recebido" ? cl.recebido : (c.data_vencimento < hoje ? cl.vencido : cl.pendente);
            return {
              descricao: c.descricao,
              cliente: cliNome,
              venc: c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-",
              status: st,
              valor: fmtN(c.valor),
            };
          }),
          resumo: [
            { label: cl.totalReceber, valor: `R$ ${fmtN(totalReceber)}` },
            { label: cl.totalRecebido, valor: `R$ ${fmtN(totalRecebido)}` },
            { label: cl.totalVencido, valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-contas-receber-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      }
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const hoje = new Date().toISOString().split("T")[0];
  const totalReceber = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido").reduce((s, c) => s + c.valor, 0);
  const totalVencido = contas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(buscaClientes.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(buscaClientes.toLowerCase())
  );

  const contasFiltradas = clienteSelecionado
    ? contas.filter(c => c.cliente_id === clienteSelecionado.id)
    : contas.filter(c => {
        const clienteNome = clientes.find(cl => cl.id === c.cliente_id)?.nome || "";
        return c.descricao.toLowerCase().includes(buscaContas.toLowerCase()) ||
          clienteNome.toLowerCase().includes(buscaContas.toLowerCase());
      });

  function getStatusCor(status: string, vencimento: string) {
    if (status === "recebido") return { cor: "#34d399", bg: "rgba(52,211,153,0.1)", label: cl.recebido };
    if (vencimento < hoje) return { cor: "#f87171", bg: "rgba(248,113,113,0.1)", label: cl.vencido };
    return { cor: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: cl.pendente };
  }

  const botaoCobranca = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalConta(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cl.novaCobranca}
    </motion.button>
  );

  return (
    <ModuloLayout titulo={`👥 ${cl.titulo}`} subtitulo={cl.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCliente(null); setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente(""); setModalCliente(true); }}
      labelBotao={cl.novoCliente} botaoExtra={botaoCobranca}>
      <div className="space-y-4">

        {/* Cards totais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
            { label: cl.totalReceber, valor: fmt(totalReceber), cor: "#fbbf24" },
            { label: cl.totalRecebido, valor: fmt(totalRecebido), cor: "#34d399" },
            { label: cl.totalVencido, valor: fmt(totalVencido), cor: "#f87171" },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-xl font-black" style={{ color: card.cor }}>{card.valor}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {[{ key: "clientes", label: cl.abaClientes }, { key: "contas", label: cl.abaContas }].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBuscaClientes(""); setBuscaContas(""); setClienteSelecionado(null); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,20,36,0.7)", color: aba === a.key ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}` }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* ABA CLIENTES */}
        {aba === "clientes" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <input value={buscaClientes} onChange={(e) => setBuscaClientes(e.target.value)}
                placeholder={cl.buscar}
                className="w-full text-sm focus:outline-none bg-transparent py-1"
                style={{ color: "#c8d8f0" }} />
            </CanvasBox>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <CanvasBox cor="#6ab0ff">
                <div className="p-8 text-center"><p style={{ color: "#5a7a9a" }}>{cl.semClientes}</p></div>
              </CanvasBox>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clientesFiltrados.map((cliente, i) => {
                  const contasCliente = contas.filter(c => c.cliente_id === cliente.id);
                  const aReceber = contasCliente.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
                  const recebido = contasCliente.filter(c => c.status === "recebido").reduce((s, c) => s + c.valor, 0);
                  const vencido = contasCliente.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);
                  return (
                    <motion.div key={cliente.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor="#6ab0ff">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-black"
                            style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                            {cliente.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{cliente.nome}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                              {cliente.status === "ativo" ? cl.ativo : cl.inativo}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCliente(cliente)} style={{ color: "#6ab0ff" }}><Pencil size={14} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCliente(cliente.id)} style={{ color: "#f87171" }}><Trash2 size={14} /></motion.button>
                          </div>
                        </div>
                        <div className="space-y-1 mb-3">
                          {cliente.email && <div className="flex items-center gap-2"><Mail size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs truncate" style={{ color: "#5a7a9a" }}>{cliente.email}</p></div>}
                          {cliente.telefone && <div className="flex items-center gap-2"><Phone size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{cliente.telefone}</p></div>}
                          {cliente.cidade && <div className="flex items-center gap-2"><MapPin size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{cliente.cidade}</p></div>}
                          {cliente.documento && <div className="flex items-center gap-2"><FileText size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{cliente.documento}</p></div>}
                        </div>
                        {contasCliente.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            {[
                              { label: idioma === "pt" ? "A Receber" : "Receivable", val: fmt(aReceber), cor: "#fbbf24" },
                              { label: idioma === "pt" ? "Recebido" : "Received", val: fmt(recebido), cor: "#34d399" },
                              { label: idioma === "pt" ? "Vencido" : "Overdue", val: fmt(vencido), cor: "#f87171" },
                            ].map((stat, si) => (
                              <div key={si} className="rounded-xl p-2 text-center" style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}25` }}>
                                <p className="text-xs font-black" style={{ color: stat.cor }}>{stat.val}</p>
                                <p style={{ color: "#5a7a9a", fontSize: "9px" }}>{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => verContasCliente(cliente)}
                          className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                          style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                          {idioma === "pt" ? "Ver Contas a Receber" : "View Receivables"} <ChevronRight size={14} />
                        </motion.button>
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ABA CONTAS */}
        {aba === "contas" && (
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-start">
              <div className="flex-1">
                <CanvasBox cor="#3b6fd4">
                  <input value={buscaContas} onChange={(e) => { setBuscaContas(e.target.value); setClienteSelecionado(null); }}
                    placeholder={idioma === "pt" ? "Buscar por descrição ou cliente..." : "Search..."}
                    className="w-full text-sm focus:outline-none bg-transparent py-1"
                    style={{ color: "#c8d8f0" }} />
                </CanvasBox>
              </div>
              {clienteSelecionado && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl flex-shrink-0"
                  style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.3)" }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                    {clienteSelecionado.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#6ab0ff" }}>{clienteSelecionado.nome}</span>
                  <motion.button whileHover={{ scale: 1.1 }} onClick={() => setClienteSelecionado(null)} style={{ color: "#5a7a9a" }}><X size={14} /></motion.button>
                </motion.div>
              )}
            </div>
            {clienteSelecionado && (
              <CanvasBox cor="#6ab0ff">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: idioma === "pt" ? "Total Contas" : "Total Bills", val: contasFiltradas.length, cor: "#6ab0ff" },
                    { label: idioma === "pt" ? "A Receber" : "Receivable", val: fmt(contasFiltradas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0)), cor: "#fbbf24" },
                    { label: idioma === "pt" ? "Recebido" : "Received", val: fmt(contasFiltradas.filter(c => c.status === "recebido").reduce((s, c) => s + c.valor, 0)), cor: "#34d399" },
                    { label: idioma === "pt" ? "Vencido" : "Overdue", val: fmt(contasFiltradas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0)), cor: "#f87171" },
                  ].map((stat, i) => (
                    <div key={i} className="text-center p-2 rounded-xl" style={{ background: `${stat.cor}10`, border: `1px solid ${stat.cor}25` }}>
                      <p className="text-sm font-black" style={{ color: stat.cor }}>{stat.val}</p>
                      <p className="text-xs" style={{ color: "#5a7a9a" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </CanvasBox>
            )}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : contasFiltradas.length === 0 ? (
              <CanvasBox cor="#34d399">
                <div className="p-8 text-center">
                  <p style={{ color: "#5a7a9a" }}>{clienteSelecionado ? `${idioma === "pt" ? "Nenhuma conta para" : "No bills for"} ${clienteSelecionado.nome}` : cl.semContas}</p>
                </div>
              </CanvasBox>
            ) : contasFiltradas.map((conta, i) => {
              const clienteDaConta = clientes.find(c => c.id === conta.cliente_id);
              const statusInfo = getStatusCor(conta.status, conta.data_vencimento);
              return (
                <motion.div key={conta.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={statusInfo.cor}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{conta.descricao}</p>
                        {clienteDaConta && !clienteSelecionado && (
                          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>👤 {clienteDaConta.nome}</span>
                        )}
                        <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{cl.vencimento}: {new Date(conta.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-black" style={{ color: statusInfo.cor }}>{fmt(conta.valor)}</p>
                        <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.cor }}>{statusInfo.label}</span>
                        {conta.status === "pendente" && (
                          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                            onClick={() => marcarRecebido(conta.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                            {cl.marcarRecebido}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Cliente */}
      <AnimatePresence>
        {modalCliente && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoCliente ? cl.editarCliente : cl.novoCliente}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalCliente} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
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
                      <input value={campo.value} onChange={(e) => campo.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModalCliente} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvarCliente} disabled={salvandoCliente}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {salvandoCliente ? "..." : cl.salvarCliente}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Conta */}
      <AnimatePresence>
        {modalConta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-screen overflow-y-auto">
              <CanvasBox cor="#34d399">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#34d399" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cl.novaCobranca}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setModalConta(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  {[
                    { label: cl.descricao, value: descricaoConta, set: setDescricaoConta, type: "text" },
                    { label: cl.valor, value: valorConta, set: setValorConta, type: "number" },
                    { label: cl.vencimento, value: vencimentoConta, set: setVencimentoConta, type: "date" },
                  ].map((campo) => (
                    <div key={campo.label}>
                      <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{campo.label}</label>
                      <input type={campo.type} value={campo.value} onChange={(e) => campo.set(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.cliente}</label>
                    <select value={clienteConta} onChange={(e) => setClienteConta(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      <option value="">-- {cl.cliente} --</option>
                      {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setModalConta(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvarConta} disabled={salvandoConta}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                      {salvandoConta ? "..." : cl.salvarCobranca}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}