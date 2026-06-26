"use client";
import { useState, useEffect } from "react";
import { Search, Trash2, Pencil, X, Building2, FileText, CheckCircle2 } from "lucide-react";
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
const formasPagamento = ["PIX", "Crédito", "Débito", "Boleto", "Dinheiro", "Transferência"];

type Fornecedor = {
  id: string;
  nome: string;
  produto_servico: string;
  contato: string;
  valor_mensal: number;
  categoria?: string;
  tipo_pessoa?: string;
  documento?: string;
  razao_social?: string;
  nome_fantasia?: string;
  inscricao_estadual?: string;
  email?: string;
  telefone?: string;
  responsavel?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  chave_pix?: string;
  condicao_pagamento?: string;
  status?: string;
  observacoes?: string;
};

type ContaPagar = {
  id: string;
  fornecedor_id: string | null;
  descricao: string;
  numero_nota?: string;
  categoria?: string;
  valor_total: number;
  valor_pago: number;
  forma_pagamento?: string;
  parcelas?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status?: string;
  observacoes?: string;
};

const fornVazio = {
  nome: "", categoria: categorias[0], produto_servico: "", contato: "", valor_mensal: "",
  tipo_pessoa: "PJ", documento: "", razao_social: "", nome_fantasia: "", inscricao_estadual: "",
  email: "", telefone: "", responsavel: "", cep: "", endereco: "", numero: "", complemento: "",
  bairro: "", cidade: "", uf: "", banco: "", agencia: "", conta: "", chave_pix: "",
  condicao_pagamento: "", status: "ativo", observacoes: "",
};

const contaVazia = {
  fornecedor_id: "", descricao: "", numero_nota: "", categoria: categorias[0],
  valor_total: "", valor_pago: "", forma_pagamento: formasPagamento[0], parcelas: "1",
  data_emissao: "", data_vencimento: "", observacoes: "",
};

export default function Fornecedores() {
  const { t, idioma } = useLanguage();
  const [aba, setAba] = useState<"fornecedores" | "contas">("fornecedores");
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [buscaContas, setBuscaContas] = useState("");
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  // Modal Fornecedor
  const [modalForn, setModalForn] = useState(false);
  const [editandoForn, setEditandoForn] = useState<Fornecedor | null>(null);
  const [nf, setNf] = useState({ ...fornVazio });
  const [salvandoForn, setSalvandoForn] = useState(false);

  // Modal Conta
  const [modalConta, setModalConta] = useState(false);
  const [editandoConta, setEditandoConta] = useState<ContaPagar | null>(null);
  const [nc, setNc] = useState({ ...contaVazia });
  const [salvandoConta, setSalvandoConta] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).maybeSingle();
    setEmpresaId(empresa?.id || null);
    const { data: forn } = await supabase.from("fornecedores").select("*").eq("user_id", user.id).order("nome", { ascending: true });
    const { data: cp } = await supabase.from("contas_pagar").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true });
    setFornecedores(forn || []);
    setContas(cp || []);
    setCarregando(false);
  };

  // ---------- FORNECEDOR ----------
  const abrirNovoForn = () => { setEditandoForn(null); setNf({ ...fornVazio }); setModalForn(true); };

  const abrirEdicaoForn = (f: Fornecedor) => {
    setEditandoForn(f);
    setNf({
      nome: f.nome || "", categoria: f.categoria || categorias[0], produto_servico: f.produto_servico || "",
      contato: f.contato || "", valor_mensal: String(f.valor_mensal || ""),
      tipo_pessoa: f.tipo_pessoa || "PJ", documento: f.documento || "", razao_social: f.razao_social || "",
      nome_fantasia: f.nome_fantasia || "", inscricao_estadual: f.inscricao_estadual || "",
      email: f.email || "", telefone: f.telefone || "", responsavel: f.responsavel || "",
      cep: f.cep || "", endereco: f.endereco || "", numero: f.numero || "", complemento: f.complemento || "",
      bairro: f.bairro || "", cidade: f.cidade || "", uf: f.uf || "", banco: f.banco || "",
      agencia: f.agencia || "", conta: f.conta || "", chave_pix: f.chave_pix || "",
      condicao_pagamento: f.condicao_pagamento || "", status: f.status || "ativo", observacoes: f.observacoes || "",
    });
    setModalForn(true);
  };

  const fecharModalForn = () => { setModalForn(false); setEditandoForn(null); setNf({ ...fornVazio }); };

  const salvarForn = async () => {
    if (!nf.nome) return;
    setSalvandoForn(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoForn(false); return; }
    const payload: any = {
      nome: nf.nome, categoria: nf.categoria, produto_servico: nf.produto_servico, contato: nf.contato,
      valor_mensal: parseFloat(nf.valor_mensal || "0"),
      tipo_pessoa: nf.tipo_pessoa, documento: nf.documento, razao_social: nf.razao_social,
      nome_fantasia: nf.nome_fantasia, inscricao_estadual: nf.inscricao_estadual,
      email: nf.email, telefone: nf.telefone, responsavel: nf.responsavel,
      cep: nf.cep, endereco: nf.endereco, numero: nf.numero, complemento: nf.complemento,
      bairro: nf.bairro, cidade: nf.cidade, uf: nf.uf, banco: nf.banco, agencia: nf.agencia,
      conta: nf.conta, chave_pix: nf.chave_pix, condicao_pagamento: nf.condicao_pagamento,
      status: nf.status, observacoes: nf.observacoes,
    };
    if (editandoForn) {
      await supabase.from("fornecedores").update(payload).eq("id", editandoForn.id);
    } else {
      await supabase.from("fornecedores").insert({ ...payload, user_id: user.id });
    }
    fecharModalForn(); await carregarDados(); setSalvandoForn(false);
  };

  const excluirForn = async (id: string) => {
    await supabase.from("fornecedores").delete().eq("id", id);
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  // ---------- CONTA A PAGAR ----------
  const calcStatus = (total: number, pago: number, venc?: string) => {
    if (pago >= total && total > 0) return "pago";
    if (pago > 0 && pago < total) return "parcial";
    const hj = new Date().toISOString().split("T")[0];
    if (venc && venc < hj) return "vencido";
    return "pendente";
  };

  const abrirNovaConta = () => { setEditandoConta(null); setNc({ ...contaVazia }); setModalConta(true); };

  const abrirEdicaoConta = (c: ContaPagar) => {
    setEditandoConta(c);
    setNc({
      fornecedor_id: c.fornecedor_id || "", descricao: c.descricao || "", numero_nota: c.numero_nota || "",
      categoria: c.categoria || categorias[0], valor_total: String(c.valor_total || ""),
      valor_pago: String(c.valor_pago || ""), forma_pagamento: c.forma_pagamento || formasPagamento[0],
      parcelas: String(c.parcelas || "1"), data_emissao: c.data_emissao || "",
      data_vencimento: c.data_vencimento || "", observacoes: c.observacoes || "",
    });
    setModalConta(true);
  };

  const fecharModalConta = () => { setModalConta(false); setEditandoConta(null); setNc({ ...contaVazia }); };

  const salvarConta = async () => {
    if (!nc.descricao || !nc.valor_total) return;
    setSalvandoConta(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoConta(false); return; }
    const total = parseFloat(nc.valor_total || "0");
    const pago = parseFloat(nc.valor_pago || "0");
    const status = calcStatus(total, pago, nc.data_vencimento);
    const payload: any = {
      fornecedor_id: nc.fornecedor_id || null, descricao: nc.descricao, numero_nota: nc.numero_nota,
      categoria: nc.categoria, valor_total: total, valor_pago: pago, forma_pagamento: nc.forma_pagamento,
      parcelas: parseInt(nc.parcelas || "1"), data_emissao: nc.data_emissao || null,
      data_vencimento: nc.data_vencimento || null,
      data_pagamento: status === "pago" ? new Date().toISOString().split("T")[0] : null,
      status, observacoes: nc.observacoes, empresa_id: empresaId,
    };
    if (editandoConta) {
      await supabase.from("contas_pagar").update(payload).eq("id", editandoConta.id);
    } else {
      await supabase.from("contas_pagar").insert({ ...payload, user_id: user.id });
    }
    fecharModalConta(); await carregarDados(); setSalvandoConta(false);
  };

  const excluirConta = async (id: string) => {
    await supabase.from("contas_pagar").delete().eq("id", id);
    setContas(contas.filter(c => c.id !== id));
  };

  const quitarConta = async (c: ContaPagar) => {
    await supabase.from("contas_pagar").update({
      valor_pago: c.valor_total, status: "pago", data_pagamento: new Date().toISOString().split("T")[0],
    }).eq("id", c.id);
    await carregarDados();
  };

  // ---------- Cálculos ----------
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const hoje = new Date().toISOString().split("T")[0];

  const fornecedoresFiltrados = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (f.documento || "").toLowerCase().includes(busca.toLowerCase()) ||
    (f.nome_fantasia || "").toLowerCase().includes(busca.toLowerCase())
  );

  const contasFiltradas = contas.filter(c => {
    const fnome = fornecedores.find(f => f.id === c.fornecedor_id)?.nome || "";
    return c.descricao.toLowerCase().includes(buscaContas.toLowerCase()) ||
      fnome.toLowerCase().includes(buscaContas.toLowerCase());
  });

  const totalPago = contas.reduce((s, c) => s + (c.valor_pago || 0), 0);
  const totalEmAberto = contas.reduce((s, c) => s + Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0)), 0);
  const totalVencido = contas.filter(c => c.status !== "pago" && c.data_vencimento && c.data_vencimento < hoje)
    .reduce((s, c) => s + Math.max(0, (c.valor_total || 0) - (c.valor_pago || 0)), 0);

  function statusLabel(s?: string) {
    if (s === "pago") return idioma === "pt" ? "Pago" : "Paid";
    if (s === "parcial") return idioma === "pt" ? "Parcial" : "Partial";
    if (s === "vencido") return idioma === "pt" ? "Vencido" : "Overdue";
    return idioma === "pt" ? "Pendente" : "Pending";
  }
  function statusCor(s?: string) {
    if (s === "pago") return "#34d399";
    if (s === "parcial") return "#6ab0ff";
    if (s === "vencido") return "#f87171";
    return "#fbbf24";
  }

  // ---------- PDF ----------
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      if (aba === "fornecedores") {
        gerarPdfTabela({
          titulo: t.fornecedores.titulo,
          subtitulo: t.fornecedores.subtitulo,
          colunas: [
            { header: "Nome", key: "nome", width: 3 },
            { header: "CNPJ/CPF", key: "doc", width: 3 },
            { header: "Categoria", key: "cat", width: 2 },
            { header: "Contato", key: "contato", width: 3 },
            { header: "PIX", key: "pix", width: 3 },
            { header: "Status", key: "status", width: 2 },
          ],
          linhas: fornecedoresFiltrados.map((f) => ({
            nome: f.nome,
            doc: f.documento || "-",
            cat: f.categoria || "-",
            contato: f.telefone || f.contato || "-",
            pix: f.chave_pix || "-",
            status: (f.status || "ativo") === "ativo" ? "Ativo" : "Inativo",
          })),
          resumo: [
            { label: "Total de Fornecedores", valor: `${fornecedores.length}` },
            { label: "A Pagar (em aberto)", valor: `R$ ${fmtN(totalEmAberto)}` },
            { label: "Total Pago", valor: `R$ ${fmtN(totalPago)}` },
          ],
          nomeArquivo: `axioma-fornecedores-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      } else {
        gerarPdfTabela({
          titulo: `${t.fornecedores.titulo} - Contas a Pagar`,
          subtitulo: t.fornecedores.subtitulo,
          colunas: [
            { header: "Descrição", key: "desc", width: 3 },
            { header: "Fornecedor", key: "forn", width: 3 },
            { header: "Vencimento", key: "venc", width: 2 },
            { header: "Forma", key: "forma", width: 2 },
            { header: "Status", key: "status", width: 2 },
            { header: "Total (R$)", key: "total", width: 2, align: "right" },
            { header: "Pago (R$)", key: "pago", width: 2, align: "right" },
            { header: "Resta (R$)", key: "resta", width: 2, align: "right" },
          ],
          linhas: contasFiltradas.map((c) => ({
            desc: c.descricao,
            forn: fornecedores.find(f => f.id === c.fornecedor_id)?.nome || "-",
            venc: c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-",
            forma: c.forma_pagamento || "-",
            status: statusLabel(c.status),
            total: fmtN(c.valor_total),
            pago: fmtN(c.valor_pago),
            resta: fmtN(Math.max(0, c.valor_total - c.valor_pago)),
          })),
          resumo: [
            { label: "Total das Contas", valor: `R$ ${fmtN(contas.reduce((s, c) => s + c.valor_total, 0))}` },
            { label: "Total Pago", valor: `R$ ${fmtN(totalPago)}` },
            { label: "A Pagar (em aberto)", valor: `R$ ${fmtN(totalEmAberto)}` },
            { label: "Vencido", valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-contas-pagar-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      }
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const labelInput = "text-xs font-semibold tracking-wider uppercase mb-2 block";
  const inputCls = "w-full px-4 py-3 rounded-xl focus:outline-none text-sm";
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };
  const selectStyle = { background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" };

  const botaoNovaConta = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={abrirNovaConta}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
      + {idioma === "pt" ? "Nova Conta a Pagar" : "New Bill"}
    </motion.button>
  );

  return (
    <ModuloLayout
      titulo={t.fornecedores.titulo}
      subtitulo={t.fornecedores.subtitulo}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      onNovo={abrirNovoForn}
      labelBotao={t.fornecedores.novoFornecedor}
      botaoExtra={botaoNovaConta}
    >
      <div className="space-y-4">

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: idioma === "pt" ? "Fornecedores" : "Suppliers", value: `${fornecedores.length}`, cor: "#6ab0ff" },
            { label: idioma === "pt" ? "A Pagar (aberto)" : "Payable", value: fmt(totalEmAberto), cor: "#fbbf24" },
            { label: idioma === "pt" ? "Total Pago" : "Total Paid", value: fmt(totalPago), cor: "#34d399" },
            { label: idioma === "pt" ? "Vencido" : "Overdue", value: fmt(totalVencido), cor: "#f87171" },
          ].map((card) => (
            <CanvasBox key={card.label} cor={card.cor}>
              <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
              <p className="text-xl font-bold" style={{ color: card.cor }}>{card.value}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Abas */}
        <div className="flex gap-2">
          {[
            { key: "fornecedores", label: idioma === "pt" ? "Fornecedores" : "Suppliers", Icon: Building2 },
            { key: "contas", label: idioma === "pt" ? "Contas a Pagar" : "Payables", Icon: FileText },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBusca(""); setBuscaContas(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,20,36,0.7)", color: aba === a.key ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}` }}>
              <a.Icon size={15} /> {a.label}
            </motion.button>
          ))}
        </div>

        {/* ====== ABA FORNECEDORES ====== */}
        {aba === "fornecedores" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <div className="flex items-center gap-2">
                <Search size={16} style={{ color: "#5a7a9a" }} />
                <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={t.fornecedores.buscar} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
              </div>
            </CanvasBox>

            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fornecedoresFiltrados.length === 0 ? (
              <CanvasBox cor="#6ab0ff">
                <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{t.fornecedores.semFornecedores}</p></div>
              </CanvasBox>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fornecedoresFiltrados.map((f, i) => {
                  const contasForn = contas.filter(c => c.fornecedor_id === f.id);
                  const aberto = contasForn.reduce((s, c) => s + Math.max(0, c.valor_total - c.valor_pago), 0);
                  return (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor="#6ab0ff">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold" style={{ background: "rgba(59,111,212,0.2)", color: "#6ab0ff" }}>{f.nome.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{f.nome}</p>
                              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(59,111,212,0.1)", color: "#6ab0ff" }}>{f.categoria || "-"}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: (f.status || "ativo") === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: (f.status || "ativo") === "ativo" ? "#34d399" : "#f87171" }}>
                                  {(f.status || "ativo") === "ativo" ? (idioma === "pt" ? "Ativo" : "Active") : (idioma === "pt" ? "Inativo" : "Inactive")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoForn(f)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirForn(f.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </div>
                        <div className="space-y-1 text-xs" style={{ color: "#5a7a9a" }}>
                          {f.documento && <p>📄 {f.documento}</p>}
                          {(f.telefone || f.contato) && <p>📞 {f.telefone || f.contato}</p>}
                          {f.email && <p className="truncate">✉️ {f.email}</p>}
                          {f.chave_pix && <p className="truncate">🔑 PIX: {f.chave_pix}</p>}
                          {f.produto_servico && <p>📦 {f.produto_servico}</p>}
                        </div>
                        {contasForn.length > 0 && (
                          <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: "1px solid rgba(59,111,212,0.1)" }}>
                            <div className="text-center rounded-xl p-2" style={{ background: "rgba(251,191,36,0.08)" }}>
                              <p className="text-xs font-black" style={{ color: "#fbbf24" }}>{fmt(aberto)}</p>
                              <p style={{ color: "#5a7a9a", fontSize: "9px" }}>{idioma === "pt" ? "Em aberto" : "Open"}</p>
                            </div>
                            <div className="text-center rounded-xl p-2" style={{ background: "rgba(106,176,255,0.08)" }}>
                              <p className="text-xs font-black" style={{ color: "#6ab0ff" }}>{contasForn.length}</p>
                              <p style={{ color: "#5a7a9a", fontSize: "9px" }}>{idioma === "pt" ? "Contas" : "Bills"}</p>
                            </div>
                          </div>
                        )}
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ====== ABA CONTAS A PAGAR ====== */}
        {aba === "contas" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <div className="flex items-center gap-2">
                <Search size={16} style={{ color: "#5a7a9a" }} />
                <input value={buscaContas} onChange={(e) => setBuscaContas(e.target.value)} placeholder={idioma === "pt" ? "Buscar por descrição ou fornecedor..." : "Search..."} className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
              </div>
            </CanvasBox>

            {carregando ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : contasFiltradas.length === 0 ? (
              <CanvasBox cor="#fbbf24">
                <div className="text-center py-12"><p style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhuma conta a pagar cadastrada." : "No payables yet."}</p></div>
              </CanvasBox>
            ) : (
              <div className="space-y-3">
                {contasFiltradas.map((c, i) => {
                  const fnome = fornecedores.find(f => f.id === c.fornecedor_id)?.nome;
                  const resta = Math.max(0, c.valor_total - c.valor_pago);
                  const prog = c.valor_total > 0 ? (c.valor_pago / c.valor_total) * 100 : 0;
                  const cor = statusCor(c.status);
                  return (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CanvasBox cor={cor}>
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{c.descricao}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-1">
                              {fnome && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>🏭 {fnome}</span>}
                              {c.forma_pagamento && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>{c.forma_pagamento}</span>}
                              {c.numero_nota && <span className="text-xs" style={{ color: "#5a7a9a" }}>NF: {c.numero_nota}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: `${cor}15`, color: cor }}>{statusLabel(c.status)}</span>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoConta(c)} style={{ color: "#6ab0ff" }}><Pencil size={15} /></motion.button>
                            <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirConta(c.id)} style={{ color: "#f87171" }}><Trash2 size={15} /></motion.button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: idioma === "pt" ? "Total" : "Total", val: fmt(c.valor_total), cor: "#c8d8f0" },
                            { label: idioma === "pt" ? "Pago" : "Paid", val: fmt(c.valor_pago), cor: "#34d399" },
                            { label: idioma === "pt" ? "Resta" : "Remaining", val: fmt(resta), cor: "#fbbf24" },
                          ].map((s) => (
                            <div key={s.label}>
                              <p className="text-xs mb-0.5" style={{ color: "#5a7a9a" }}>{s.label}</p>
                              <p className="text-sm font-black" style={{ color: s.cor }}>{s.val}</p>
                            </div>
                          ))}
                        </div>
                        <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(59,111,212,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(prog, 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full" style={{ background: `linear-gradient(90deg, #1a3a8f, ${cor})` }} />
                        </div>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <span className="text-xs" style={{ color: "#5a7a9a" }}>
                            {c.data_vencimento ? `${idioma === "pt" ? "Vence" : "Due"}: ${new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR")}` : ""}
                            {c.parcelas && c.parcelas > 1 ? ` · ${c.parcelas}x` : ""}
                          </span>
                          {c.status !== "pago" && (
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => quitarConta(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                              style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                              <CheckCircle2 size={13} /> {idioma === "pt" ? "Quitar" : "Settle"}
                            </motion.button>
                          )}
                        </div>
                      </CanvasBox>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== MODAL FORNECEDOR (cadastro completo) ====== */}
      <AnimatePresence>
        {modalForn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4 py-8"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-2xl max-h-full overflow-y-auto">
              <CanvasBox cor="#6ab0ff">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#6ab0ff" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoForn ? (idioma === "pt" ? "Editar Fornecedor" : "Edit Supplier") : t.fornecedores.novoFornecedor}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalForn} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>

                <div className="space-y-5">
                  {/* Identificação */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#6ab0ff" }}>{idioma === "pt" ? "Identificação" : "Identification"}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Tipo de Pessoa" : "Type"}</label>
                        <select value={nf.tipo_pessoa} onChange={(e) => setNf({ ...nf, tipo_pessoa: e.target.value })} className={inputCls} style={selectStyle}>
                          <option value="PJ">{idioma === "pt" ? "Pessoa Jurídica" : "Company"}</option>
                          <option value="PF">{idioma === "pt" ? "Pessoa Física" : "Individual"}</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{nf.tipo_pessoa === "PF" ? "CPF" : "CNPJ"}</label>
                        <input value={nf.documento} onChange={(e) => setNf({ ...nf, documento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Nome / Apelido" : "Name"} *</label>
                        <input value={nf.nome} onChange={(e) => setNf({ ...nf, nome: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Razão Social" : "Legal Name"}</label>
                        <input value={nf.razao_social} onChange={(e) => setNf({ ...nf, razao_social: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Nome Fantasia" : "Trade Name"}</label>
                        <input value={nf.nome_fantasia} onChange={(e) => setNf({ ...nf, nome_fantasia: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Inscrição Estadual" : "State Reg."}</label>
                        <input value={nf.inscricao_estadual} onChange={(e) => setNf({ ...nf, inscricao_estadual: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#34d399" }}>{idioma === "pt" ? "Contato" : "Contact"}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Responsável" : "Contact Person"}</label>
                        <input value={nf.responsavel} onChange={(e) => setNf({ ...nf, responsavel: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Telefone" : "Phone"}</label>
                        <input value={nf.telefone} onChange={(e) => setNf({ ...nf, telefone: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>E-mail</label>
                        <input value={nf.email} onChange={(e) => setNf({ ...nf, email: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#a78bfa" }}>{idioma === "pt" ? "Endereço" : "Address"}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>CEP</label><input value={nf.cep} onChange={(e) => setNf({ ...nf, cep: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div className="col-span-2"><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Endereço" : "Street"}</label><input value={nf.endereco} onChange={(e) => setNf({ ...nf, endereco: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Nº" : "No."}</label><input value={nf.numero} onChange={(e) => setNf({ ...nf, numero: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Bairro" : "District"}</label><input value={nf.bairro} onChange={(e) => setNf({ ...nf, bairro: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Cidade" : "City"}</label><input value={nf.cidade} onChange={(e) => setNf({ ...nf, cidade: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>UF</label><input value={nf.uf} onChange={(e) => setNf({ ...nf, uf: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Compl." : "Compl."}</label><input value={nf.complemento} onChange={(e) => setNf({ ...nf, complemento: e.target.value })} className={inputCls} style={inputStyle} /></div>
                    </div>
                  </div>

                  {/* Dados bancários */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#fbbf24" }}>{idioma === "pt" ? "Dados Bancários" : "Banking"}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Banco" : "Bank"}</label><input value={nf.banco} onChange={(e) => setNf({ ...nf, banco: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Agência" : "Branch"}</label><input value={nf.agencia} onChange={(e) => setNf({ ...nf, agencia: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Conta" : "Account"}</label><input value={nf.conta} onChange={(e) => setNf({ ...nf, conta: e.target.value })} className={inputCls} style={inputStyle} /></div>
                      <div><label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Chave PIX" : "PIX Key"}</label><input value={nf.chave_pix} onChange={(e) => setNf({ ...nf, chave_pix: e.target.value })} className={inputCls} style={inputStyle} /></div>
                    </div>
                  </div>

                  {/* Comercial */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#f472b6" }}>{idioma === "pt" ? "Comercial" : "Commercial"}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Categoria" : "Category"}</label>
                        <select value={nf.categoria} onChange={(e) => setNf({ ...nf, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                          {categorias.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Produto/Serviço" : "Product/Service"}</label>
                        <input value={nf.produto_servico} onChange={(e) => setNf({ ...nf, produto_servico: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Gasto Mensal (R$)" : "Monthly (R$)"}</label>
                        <input type="number" value={nf.valor_mensal} onChange={(e) => setNf({ ...nf, valor_mensal: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Condição de Pagamento" : "Payment Terms"}</label>
                        <input value={nf.condicao_pagamento} onChange={(e) => setNf({ ...nf, condicao_pagamento: e.target.value })} placeholder={idioma === "pt" ? "ex: 30 dias" : "e.g. 30 days"} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>Status</label>
                        <select value={nf.status} onChange={(e) => setNf({ ...nf, status: e.target.value })} className={inputCls} style={selectStyle}>
                          <option value="ativo">{idioma === "pt" ? "Ativo" : "Active"}</option>
                          <option value="inativo">{idioma === "pt" ? "Inativo" : "Inactive"}</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Observações" : "Notes"}</label>
                        <textarea value={nf.observacoes} onChange={(e) => setNf({ ...nf, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModalForn} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarForn} disabled={salvandoForn}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                      {salvandoForn ? t.geral.carregando : (idioma === "pt" ? "Salvar Fornecedor" : "Save Supplier")}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MODAL CONTA A PAGAR ====== */}
      <AnimatePresence>
        {modalConta && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4 py-8"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-lg max-h-full overflow-y-auto">
              <CanvasBox cor="#fbbf24">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#fbbf24" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{editandoConta ? (idioma === "pt" ? "Editar Conta a Pagar" : "Edit Bill") : (idioma === "pt" ? "Nova Conta a Pagar" : "New Bill")}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalConta} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Fornecedor" : "Supplier"}</label>
                    <select value={nc.fornecedor_id} onChange={(e) => setNc({ ...nc, fornecedor_id: e.target.value })} className={inputCls} style={selectStyle}>
                      <option value="">-- {idioma === "pt" ? "Selecione" : "Select"} --</option>
                      {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Descrição" : "Description"} *</label>
                    <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Valor Total (R$)" : "Total (R$)"} *</label>
                      <input type="number" value={nc.valor_total} onChange={(e) => setNc({ ...nc, valor_total: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Valor Pago (R$)" : "Paid (R$)"}</label>
                      <input type="number" value={nc.valor_pago} onChange={(e) => setNc({ ...nc, valor_pago: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Forma de Pagamento" : "Payment Method"}</label>
                      <select value={nc.forma_pagamento} onChange={(e) => setNc({ ...nc, forma_pagamento: e.target.value })} className={inputCls} style={selectStyle}>
                        {formasPagamento.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Parcelas" : "Installments"}</label>
                      <input type="number" value={nc.parcelas} onChange={(e) => setNc({ ...nc, parcelas: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Emissão" : "Issue Date"}</label>
                      <input type="date" value={nc.data_emissao} onChange={(e) => setNc({ ...nc, data_emissao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Vencimento" : "Due Date"}</label>
                      <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Nº Nota Fiscal" : "Invoice No."}</label>
                      <input value={nc.numero_nota} onChange={(e) => setNc({ ...nc, numero_nota: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Categoria" : "Category"}</label>
                      <select value={nc.categoria} onChange={(e) => setNc({ ...nc, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                        {categorias.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelInput} style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Observações" : "Notes"}</label>
                    <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModalConta} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarConta} disabled={salvandoConta}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: "linear-gradient(135deg, #92400e, #f59e0b)", color: "#fff" }}>
                      {salvandoConta ? t.geral.carregando : (idioma === "pt" ? "Salvar Conta" : "Save Bill")}
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