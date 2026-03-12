"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";

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

export default function ClientesPage() {
  const { t } = useLanguage();
  const cl = t.clientes;

  const [aba, setAba] = useState<"clientes" | "contas">("clientes");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

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
    setDescricaoConta("");
    setValorConta("");
    setVencimentoConta("");
    setClienteConta("");
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
    setNomeCliente("");
    setEmailCliente("");
    setTelefoneCliente("");
    setDocumentoCliente("");
    setCidadeCliente("");
  }

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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#020810", minHeight: "100vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c8d8f0" }}>👥 {cl.titulo}</h1>
          <p className="text-sm mt-1" style={{ color: "#3a5a8a" }}>{cl.subtitulo}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalConta(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
            + {cl.novaCobranca}
          </button>
          <button onClick={() => setModalCliente(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
            + {cl.novoCliente}
          </button>
        </div>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
          { label: cl.totalReceber, valor: fmt(totalReceber), cor: "#fbbf24" },
          { label: cl.totalRecebido, valor: fmt(totalRecebido), cor: "#34d399" },
          { label: cl.totalVencido, valor: fmt(totalVencido), cor: "#f87171" },
        ].map((card, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
            <p className="text-xs mb-1" style={{ color: "#3a5a8a" }}>{card.label}</p>
            <p className="text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
          </div>
        ))}
      </div>

      {/* Abas */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "clientes", label: cl.abaClientes },
          { key: "contas", label: cl.abaContas },
        ].map((a) => (
          <button key={a.key} onClick={() => { setAba(a.key as typeof aba); setBusca(""); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: aba === a.key ? "rgba(59,111,212,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#6ab0ff" : "#3a5a8a", border: `1px solid ${aba === a.key ? "rgba(59,111,212,0.5)" : "rgba(59,111,212,0.1)"}` }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cl.buscar} className="w-full px-4 py-2.5 rounded-xl mb-4 text-sm focus:outline-none" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)", color: "#c8d8f0" }} />

      {/* ABA CLIENTES */}
      {aba === "clientes" && (
        <div className="space-y-3">
          {clientesFiltrados.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style={{ color: "#3a5a8a" }}>{cl.semClientes}</p>
            </div>
          ) : (
            clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {cliente.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{cliente.nome}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>{cliente.email} {cliente.telefone ? `• ${cliente.telefone}` : ""}</p>
                      {cliente.cidade && <p className="text-xs" style={{ color: "#3a5a8a" }}>{cliente.cidade}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                      {cliente.status === "ativo" ? cl.ativo : cl.inativo}
                    </span>
                    <button onClick={() => abrirEditarCliente(cliente)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(59,111,212,0.15)", color: "#6ab0ff" }}>{cl.editarCliente}</button>
                    <button onClick={() => excluirCliente(cliente.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{cl.excluirCliente}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ABA CONTAS A RECEBER */}
      {aba === "contas" && (
        <div className="space-y-3">
          {contasFiltradas.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(10,22,40,0.8)", border: "1px solid rgba(59,111,212,0.15)" }}>
              <p style={{ color: "#3a5a8a" }}>{cl.semContas}</p>
            </div>
          ) : (
            contasFiltradas.map((conta) => {
              const cliente = clientes.find(c => c.id === conta.cliente_id);
              const statusInfo = getStatusCor(conta.status, conta.data_vencimento);
              return (
                <div key={conta.id} className="rounded-2xl p-4" style={{ background: "rgba(10,22,40,0.8)", border: `1px solid ${statusInfo.cor}25` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{conta.descricao}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#3a5a8a" }}>
                        {cliente ? `${cliente.nome} • ` : ""}{cl.vencimento}: {new Date(conta.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-base font-bold" style={{ color: statusInfo.cor }}>{fmt(conta.valor)}</p>
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: statusInfo.bg, color: statusInfo.cor }}>{statusInfo.label}</span>
                      {conta.status === "pendente" && (
                        <button onClick={() => marcarRecebido(conta.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                          {cl.marcarRecebido}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODAL CLIENTE */}
      {modalCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#c8d8f0" }}>{editandoCliente ? cl.editarCliente : cl.novoCliente}</h3>
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
                <button onClick={salvarCliente} disabled={salvandoCliente} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {salvandoCliente ? "..." : cl.salvarCliente}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONTA */}
      {modalConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: "rgba(10,22,40,0.98)", border: "1px solid rgba(59,111,212,0.3)" }}>
            <h3 className="text-lg font-bold mb-4" style={{ color: "#c8d8f0" }}>{cl.novaCobranca}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.descricao}</label>
                <input value={descricaoConta} onChange={(e) => setDescricaoConta(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.valor}</label>
                <input type="number" value={valorConta} onChange={(e) => setValorConta(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.vencimento}</label>
                <input type="date" value={vencimentoConta} onChange={(e) => setVencimentoConta(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "#5a8fd4" }}>{cl.cliente}</label>
                <select value={clienteConta} onChange={(e) => setClienteConta(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={{ background: "rgba(10,22,40,0.95)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                  <option value="">-- {cl.cliente} --</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModalConta(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#3a5a8a" }}>{t.geral.cancelar}</button>
                <button onClick={salvarConta} disabled={salvandoConta} className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                  {salvandoConta ? "..." : cl.salvarCobranca}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}