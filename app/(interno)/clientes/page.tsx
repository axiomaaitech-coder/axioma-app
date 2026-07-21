"use client";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import {
  Pencil, Trash2, X, Phone, Mail, MapPin, FileText, ChevronRight, ChevronLeft,
  Award, Users, AlertTriangle, Clock, MessageCircle, Send, HeartPulse, Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import { CORES, FONTE_EXEC, optDispersao } from "../../../lib/cfoCore";
import {
  montarSnapshotsCarteira, calcularIVCA, calcularSaudeCliente, detectarSinaisCliente,
  montarConselhoExecutivo, montarNarrativaIVCA, nomeSubscoreIVCA, nomeTipoSinal,
  montarNarrativaSinal, montarTimelineCliente, enviarPerguntaZIA, ordenarSinaisPorSeveridade,
  type ClienteRow, type ContaRow, type InadimplenciaRow, type Idioma3,
} from "../../../lib/clienteIntelHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NIVEL_COR: Record<string, string> = { critico: CORES.vermelho, atencao: CORES.amarelo, bom: CORES.verde, excelente: CORES.verde };
const SEVERIDADE_COR: Record<string, string> = { risco: CORES.vermelho, atencao: CORES.amarelo, positivo: CORES.verde };

const T = {
  pt: {
    abaCarteira: "📊 Carteira", abaCliente: "🧬 Cliente", abaCobrancas: "💳 Cobranças",
    carteiraExecutiva: "Mapa Executivo da Carteira", carteiraSub: "Cada cliente como ativo financeiro — valor, risco e oportunidade em um só lugar.",
    valorCarteira: "Valor da Carteira", ticketMedioCarteira: "Ticket Médio", inadimplenciaCarteira: "Inadimplência da Carteira", concentracaoTop5: "Concentração Top 5",
    distribuicaoIvca: "Distribuição por IVCA", faixaCritico: "Crítico", faixaAtencao: "Atenção", faixaBom: "Saudável", faixaExcelente: "Premium",
    mapaValor: "Mapa de Valor dos Clientes", mapaValorSub: "IVCA (valor) × Segurança (100 = baixo risco). Tamanho do ponto = ticket médio.",
    mapaValorVazio: "Cadastre pelo menos 2 clientes com cobranças para habilitar o Mapa de Valor.",
    listaClientes: "Clientes ordenados por IVCA",
    selecioneCliente: "Selecione um cliente na Carteira para abrir o Digital Twin.",
    voltarCarteira: "Voltar à Carteira",
    tempoDeCasa: "Cliente há",
    meses: "meses",
    ivcaTitulo: "IVCA — Índice de Valor do Cliente Axioma", ivcaSub: "Score proprietário 0-1000, só com dado real: pontualidade, volume, recorrência, tendência e risco.",
    saudeTitulo: "Saúde do Cliente", saudePagamento: "Pagamento", saudeRelacionamento: "Relacionamento", saudeRecorrencia: "Recorrência", saudeComercial: "Comercial",
    radarTitulo: "Radar de Sinais", radarSub: "Oportunidades e riscos detectados automaticamente — sempre com o motivo.",
    radarVazio: "Nenhum sinal crítico detectado para este cliente.",
    conselhoTitulo: "Conselho Executivo do Cliente", conselhoSub: "Cada especialista lê o mesmo dado real sob sua ótica.",
    recomendacaoConsolidada: "Recomendação Consolidada da ZIA",
    ziaTitulo: "Pergunte à ZIA sobre este cliente", ziaSub: "Responde com o dado real deste cliente (modo regras — ativa IA real quando a chave estiver ligada).",
    ziaPlaceholder: "Ex: esse cliente merece desconto?", ziaPensando: "Analisando...",
    timelineTitulo: "Linha do Tempo Financeira", timelineVazio: "Nenhum evento registrado ainda.",
    dadosCadastrais: "Dados Cadastrais", contasDoCliente: "Cobranças deste cliente",
    verTodasCobrancas: "Ver Todas as Cobranças",
  },
  en: {
    abaCarteira: "📊 Portfolio", abaCliente: "🧬 Client", abaCobrancas: "💳 Receivables",
    carteiraExecutiva: "Portfolio Executive Map", carteiraSub: "Every client as a financial asset — value, risk and opportunity in one place.",
    valorCarteira: "Portfolio Value", ticketMedioCarteira: "Avg. Ticket", inadimplenciaCarteira: "Portfolio Default", concentracaoTop5: "Top 5 Concentration",
    distribuicaoIvca: "IVCA Distribution", faixaCritico: "Critical", faixaAtencao: "Attention", faixaBom: "Healthy", faixaExcelente: "Premium",
    mapaValor: "Client Value Map", mapaValorSub: "IVCA (value) × Safety (100 = low risk). Dot size = avg. ticket.",
    mapaValorVazio: "Register at least 2 clients with billing to enable the Value Map.",
    listaClientes: "Clients ranked by IVCA",
    selecioneCliente: "Select a client in the Portfolio to open the Digital Twin.",
    voltarCarteira: "Back to Portfolio",
    tempoDeCasa: "Client for",
    meses: "months",
    ivcaTitulo: "IVCA — Axioma Client Value Index", ivcaSub: "Proprietary 0-1000 score, real data only: punctuality, volume, recurrence, trend and risk.",
    saudeTitulo: "Client Health", saudePagamento: "Payment", saudeRelacionamento: "Relationship", saudeRecorrencia: "Recurrence", saudeComercial: "Commercial",
    radarTitulo: "Signal Radar", radarSub: "Opportunities and risks detected automatically — always with the reason.",
    radarVazio: "No critical signal detected for this client.",
    conselhoTitulo: "Client Executive Board", conselhoSub: "Each specialist reads the same real data from their angle.",
    recomendacaoConsolidada: "ZIA Consolidated Recommendation",
    ziaTitulo: "Ask ZIA about this client", ziaSub: "Answers using this client's real data (rules mode — upgrades to real AI once the key is active).",
    ziaPlaceholder: "E.g.: does this client deserve a discount?", ziaPensando: "Thinking...",
    timelineTitulo: "Financial Timeline", timelineVazio: "No event recorded yet.",
    dadosCadastrais: "Registration Data", contasDoCliente: "This client's billings",
    verTodasCobrancas: "View All Receivables",
  },
  es: {
    abaCarteira: "📊 Cartera", abaCliente: "🧬 Cliente", abaCobrancas: "💳 Cobros",
    carteiraExecutiva: "Mapa Ejecutivo de la Cartera", carteiraSub: "Cada cliente como activo financiero — valor, riesgo y oportunidad en un solo lugar.",
    valorCarteira: "Valor de la Cartera", ticketMedioCarteira: "Ticket Promedio", inadimplenciaCarteira: "Impago de la Cartera", concentracaoTop5: "Concentración Top 5",
    distribuicaoIvca: "Distribución por IVCA", faixaCritico: "Crítico", faixaAtencao: "Atención", faixaBom: "Saludable", faixaExcelente: "Premium",
    mapaValor: "Mapa de Valor de Clientes", mapaValorSub: "IVCA (valor) × Seguridad (100 = bajo riesgo). Tamaño del punto = ticket promedio.",
    mapaValorVazio: "Registre al menos 2 clientes con cobros para habilitar el Mapa de Valor.",
    listaClientes: "Clientes ordenados por IVCA",
    selecioneCliente: "Seleccione un cliente en la Cartera para abrir el Digital Twin.",
    voltarCarteira: "Volver a la Cartera",
    tempoDeCasa: "Cliente hace",
    meses: "meses",
    ivcaTitulo: "IVCA — Índice de Valor del Cliente Axioma", ivcaSub: "Score propietario 0-1000, solo con dato real: puntualidad, volumen, recurrencia, tendencia y riesgo.",
    saudeTitulo: "Salud del Cliente", saudePagamento: "Pago", saudeRelacionamento: "Relación", saudeRecorrencia: "Recurrencia", saudeComercial: "Comercial",
    radarTitulo: "Radar de Señales", radarSub: "Oportunidades y riesgos detectados automáticamente — siempre con el motivo.",
    radarVazio: "Ninguna señal crítica detectada para este cliente.",
    conselhoTitulo: "Consejo Ejecutivo del Cliente", conselhoSub: "Cada especialista lee el mismo dato real desde su óptica.",
    recomendacaoConsolidada: "Recomendación Consolidada de la ZIA",
    ziaTitulo: "Pregúntale a la ZIA sobre este cliente", ziaSub: "Responde con el dato real de este cliente (modo reglas — mejora a IA real cuando la clave esté activa).",
    ziaPlaceholder: "Ej: ¿este cliente merece descuento?", ziaPensando: "Analizando...",
    timelineTitulo: "Línea de Tiempo Financiera", timelineVazio: "Ningún evento registrado todavía.",
    dadosCadastrais: "Datos de Registro", contasDoCliente: "Cobros de este cliente",
    verTodasCobrancas: "Ver Todos los Cobros",
  },
};

export default function ClientesPage() {
  const { t, idioma } = useLanguage();
  const cl = t.clientes;
  const lang = (idioma as Idioma3) || "pt";
  const tt = T[lang];

  const [aba, setAba] = useState<"carteira" | "cliente" | "cobrancas">("carteira");
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [contas, setContas] = useState<ContaRow[]>([]);
  const [inadimplencias, setInadimplencias] = useState<InadimplenciaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [buscaCarteira, setBuscaCarteira] = useState("");
  const [buscaContas, setBuscaContas] = useState("");
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const [modalCliente, setModalCliente] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<ClienteRow | null>(null);
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

  const [inputChat, setInputChat] = useState("");
  const [mensagensChat, setMensagensChat] = useState<{ role: "user" | "assistant"; texto: string }[]>([]);
  const [chatCarregando, setChatCarregando] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: empresa } = await supabase.from("empresas").select("id").eq("user_id", user.id).single();
    setEmpresaId(empresa?.id || null);
    const [{ data: clientesData }, { data: contasData }, { data: inadData }] = await Promise.all([
      supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("contas_receber").select("*").eq("user_id", user.id).order("data_vencimento", { ascending: true }),
      supabase.from("inadimplencia").select("*").eq("user_id", user.id),
    ]);
    setClientes(clientesData || []);
    setContas(contasData || []);
    setInadimplencias(inadData || []);
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
    if (clienteSelecionadoId === id) { setClienteSelecionadoId(null); setAba("carteira"); }
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

  function abrirDigitalTwin(id: string) {
    setClienteSelecionadoId(id); setAba("cliente");
    setMensagensChat([]); setInputChat("");
  }

  function abrirEditarCliente(cliente: ClienteRow) {
    setEditandoCliente(cliente); setNomeCliente(cliente.nome); setEmailCliente(cliente.email || "");
    setTelefoneCliente(cliente.telefone || ""); setDocumentoCliente(cliente.documento || ""); setCidadeCliente(cliente.cidade || "");
    setModalCliente(true);
  }

  function fecharModalCliente() {
    setModalCliente(false); setEditandoCliente(null);
    setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente("");
  }

  const hoje = new Date().toISOString().split("T")[0];
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ═══════════════════════ INTELIGÊNCIA DA CARTEIRA (dado real) ═══════════════════════
  const snapshotCarteira = useMemo(() => montarSnapshotsCarteira(clientes, contas, inadimplencias), [clientes, contas, inadimplencias]);

  const intel = useMemo(() => snapshotCarteira.clientesSnapshot.map((s) => {
    const ivca = calcularIVCA(s, snapshotCarteira);
    const saude = calcularSaudeCliente(s, ivca);
    const sinais = detectarSinaisCliente(s, ivca, snapshotCarteira);
    return { s, ivca, saude, sinais };
  }), [snapshotCarteira]);

  const intelOrdenado = useMemo(() => [...intel].sort((a, b) => b.ivca.total - a.ivca.total), [intel]);
  const intelFiltrado = intelOrdenado.filter((i) => i.s.cliente.nome.toLowerCase().includes(buscaCarteira.toLowerCase()));
  const clienteAtual = intel.find((i) => i.s.cliente.id === clienteSelecionadoId) || null;

  const valorEmAtrasoCarteira = snapshotCarteira.clientesSnapshot.reduce((s, c) => s + c.valorEmAtrasoAtual, 0);
  const inadimplenciaCarteiraPct = snapshotCarteira.valorTotalCarteira > 0 ? (valorEmAtrasoCarteira / snapshotCarteira.valorTotalCarteira) * 100 : 0;
  const top5Valor = [...snapshotCarteira.clientesSnapshot].sort((a, b) => b.valorTotalCobrado - a.valorTotalCobrado).slice(0, 5).reduce((s, c) => s + c.valorTotalCobrado, 0);
  const concentracaoTop5Pct = snapshotCarteira.valorTotalCarteira > 0 ? (top5Valor / snapshotCarteira.valorTotalCarteira) * 100 : 0;

  const distribuicaoNiveis = { critico: 0, atencao: 0, bom: 0, excelente: 0 } as Record<string, number>;
  intel.forEach((i) => { distribuicaoNiveis[i.ivca.nivel]++; });

  const optMapaValor = useMemo(() => {
    const pontos = intel.map((i) => ({
      nome: i.s.cliente.nome, x: i.ivca.total,
      y: i.ivca.subscores.find((s) => s.chave === "risco")?.valor || 0,
      cor: NIVEL_COR[i.ivca.nivel],
      tamanho: 14 + Math.min(30, (i.s.ticketMedio / (snapshotCarteira.ticketMedioCarteira || 1)) * 10),
    }));
    return optDispersao(pontos, "IVCA", lang === "en" ? "Safety" : lang === "es" ? "Seguridad" : "Segurança", 1000);
  }, [intel, snapshotCarteira.ticketMedioCarteira, lang]);

  // ═══════════════════════ COBRANÇAS ═══════════════════════
  const totalReceber = contas.filter(c => c.status === "pendente").reduce((s, c) => s + c.valor, 0);
  const totalRecebido = contas.filter(c => c.status === "recebido").reduce((s, c) => s + (c.valor_recebido ?? c.valor), 0);
  const totalVencido = contas.filter(c => c.status === "pendente" && c.data_vencimento < hoje).reduce((s, c) => s + c.valor, 0);

  const contasFiltradas = clienteSelecionadoId && aba === "cobrancas"
    ? contas.filter(c => c.cliente_id === clienteSelecionadoId)
    : contas.filter(c => {
        const clienteNome = clientes.find(cx => cx.id === c.cliente_id)?.nome || "";
        return c.descricao.toLowerCase().includes(buscaContas.toLowerCase()) ||
          clienteNome.toLowerCase().includes(buscaContas.toLowerCase());
      });

  function getStatusCor(status: string | null | undefined, vencimento: string) {
    if (status === "recebido") return { cor: "#34d399", bg: "rgba(52,211,153,0.1)", label: cl.recebido };
    if (vencimento < hoje) return { cor: "#f87171", bg: "rgba(248,113,113,0.1)", label: cl.vencido };
    return { cor: "#fbbf24", bg: "rgba(251,191,36,0.1)", label: cl.pendente };
  }

  // ═══════════════════════ ZIA ═══════════════════════
  async function perguntarZIA(texto: string) {
    if (!texto.trim() || chatCarregando || !clienteAtual) return;
    const novas: { role: "user" | "assistant"; texto: string }[] = [...mensagensChat, { role: "user", texto }];
    setMensagensChat(novas); setInputChat(""); setChatCarregando(true);
    const { resposta } = await enviarPerguntaZIA(texto, novas, lang, clienteAtual.s, clienteAtual.ivca, clienteAtual.sinais);
    setMensagensChat([...novas, { role: "assistant", texto: resposta }]);
    setChatCarregando(false);
  }

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      if (aba === "cobrancas") {
        gerarPdfTabela({
          titulo: `${cl.titulo} - ${cl.abaContas}`,
          subtitulo: clienteAtual ? clienteAtual.s.cliente.nome : cl.subtitulo,
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
              descricao: c.descricao, cliente: cliNome,
              venc: c.data_vencimento ? new Date(c.data_vencimento + "T00:00:00").toLocaleDateString("pt-BR") : "-",
              status: st, valor: fmtN(c.valor),
            };
          }),
          resumo: [
            { label: cl.totalReceber, valor: `R$ ${fmtN(totalReceber)}` },
            { label: cl.totalRecebido, valor: `R$ ${fmtN(totalRecebido)}` },
            { label: cl.totalVencido, valor: `R$ ${fmtN(totalVencido)}` },
          ],
          nomeArquivo: `axioma-cobrancas-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      } else {
        gerarPdfTabela({
          titulo: `${cl.titulo} - ${tt.carteiraExecutiva}`,
          subtitulo: clienteAtual ? clienteAtual.s.cliente.nome : cl.subtitulo,
          colunas: [
            { header: "Nome", key: "nome", width: 3 },
            { header: "IVCA", key: "ivca", width: 1 },
            { header: "Nível", key: "nivel", width: 2 },
            { header: "Ticket Médio", key: "ticket", width: 2, align: "right" },
            { header: "Status", key: "status", width: 2 },
          ],
          linhas: intelFiltrado.map((i) => ({
            nome: i.s.cliente.nome, ivca: `${i.ivca.total}/1000`, nivel: i.ivca.nivel,
            ticket: fmtN(i.s.ticketMedio), status: i.s.cliente.status === "ativo" ? cl.ativo : cl.inativo,
          })),
          resumo: [
            { label: cl.totalClientes, valor: `${clientes.length}` },
            { label: tt.valorCarteira, valor: `R$ ${fmtN(snapshotCarteira.valorTotalCarteira)}` },
            { label: tt.ticketMedioCarteira, valor: `R$ ${fmtN(snapshotCarteira.ticketMedioCarteira)}` },
            { label: tt.inadimplenciaCarteira, valor: `${fmtN(inadimplenciaCarteiraPct)}%` },
          ],
          nomeArquivo: `axioma-carteira-clientes-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      }
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const botaoCobranca = (
    <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
      onClick={() => setModalConta(true)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cl.novaCobranca}
    </motion.button>
  );

  const timeline = clienteAtual ? montarTimelineCliente(lang, clienteAtual.s) : [];
  const especialistas = clienteAtual ? montarConselhoExecutivo(lang, clienteAtual.s, clienteAtual.ivca, clienteAtual.sinais) : null;

  return (
    <ModuloLayout titulo={`👥 ${cl.titulo}`} subtitulo={cl.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCliente(null); setNomeCliente(""); setEmailCliente(""); setTelefoneCliente(""); setDocumentoCliente(""); setCidadeCliente(""); setModalCliente(true); }}
      labelBotao={cl.novoCliente} botaoExtra={botaoCobranca}>
      <div className="space-y-4">

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[{ key: "carteira", label: tt.abaCarteira }, { key: "cliente", label: tt.abaCliente }, { key: "cobrancas", label: tt.abaCobrancas }].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => { setAba(a.key as typeof aba); setBuscaCarteira(""); setBuscaContas(""); }}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(106,176,255,0.2)" : "rgba(10,20,36,0.7)", color: aba === a.key ? "#6ab0ff" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(106,176,255,0.4)" : "rgba(59,111,212,0.15)"}` }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* ═══════════════════════ ABA CARTEIRA ═══════════════════════ */}
            {aba === "carteira" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: cl.totalClientes, valor: clientes.length.toString(), cor: "#6ab0ff" },
                    { label: tt.valorCarteira, valor: fmt(snapshotCarteira.valorTotalCarteira), cor: "#34d399" },
                    { label: tt.ticketMedioCarteira, valor: fmt(snapshotCarteira.ticketMedioCarteira), cor: "#fbbf24" },
                    { label: tt.inadimplenciaCarteira, valor: `${fmtN(inadimplenciaCarteiraPct)}%`, cor: inadimplenciaCarteiraPct > 15 ? "#f87171" : "#34d399" },
                  ].map((card, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <CanvasBox cor={card.cor}>
                        <p className="text-xs mb-1" style={{ color: "#5a7a9a" }}>{card.label}</p>
                        <p className="text-xl font-black" style={{ color: card.cor }}>{card.valor}</p>
                      </CanvasBox>
                    </motion.div>
                  ))}
                </div>

                <CanvasBox cor="#d4af37">
                  <div className="flex items-center gap-2 mb-1">
                    <Layers size={16} style={{ color: CORES.ouro }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.distribuicaoIvca}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    {[
                      { chave: "excelente", label: tt.faixaExcelente, cor: CORES.verde },
                      { chave: "bom", label: tt.faixaBom, cor: CORES.verde },
                      { chave: "atencao", label: tt.faixaAtencao, cor: CORES.amarelo },
                      { chave: "critico", label: tt.faixaCritico, cor: CORES.vermelho },
                    ].map((f) => (
                      <div key={f.chave} className="rounded-xl p-3 text-center" style={{ background: `${f.cor}10`, border: `1px solid ${f.cor}25` }}>
                        <p className="text-lg font-black" style={{ color: f.cor }}>{distribuicaoNiveis[f.chave]}</p>
                        <p className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{f.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-3" style={{ color: "#64748b" }}>{tt.concentracaoTop5}: <b style={{ color: concentracaoTop5Pct > 50 ? "#f87171" : "#94a3b8" }}>{fmtN(concentracaoTop5Pct)}%</b></p>
                </CanvasBox>

                <CanvasBox cor="#6ab0ff">
                  <div className="flex items-center gap-2 mb-1">
                    <Award size={16} style={{ color: "#6ab0ff" }} />
                    <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.mapaValor}</p>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "#64748b" }}>{tt.mapaValorSub}</p>
                  {intel.length > 1 ? (
                    <ReactECharts option={optMapaValor} style={{ height: 260, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
                  ) : (
                    <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.mapaValorVazio}</p>
                  )}
                </CanvasBox>

                <CanvasBox cor="#3b6fd4">
                  <input value={buscaCarteira} onChange={(e) => setBuscaCarteira(e.target.value)}
                    placeholder={cl.buscar}
                    className="w-full text-sm focus:outline-none bg-transparent py-1"
                    style={{ color: "#c8d8f0" }} />
                </CanvasBox>

                {intelFiltrado.length === 0 ? (
                  <CanvasBox cor="#6ab0ff"><div className="p-8 text-center"><p style={{ color: "#5a7a9a" }}>{cl.semClientes}</p></div></CanvasBox>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {intelFiltrado.map(({ s, ivca, sinais }, i) => {
                      const piorSinal = ordenarSinaisPorSeveridade(sinais)[0];
                      return (
                        <motion.div key={s.cliente.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                          <CanvasBox cor={NIVEL_COR[ivca.nivel]}>
                            <button onClick={() => abrirDigitalTwin(s.cliente.id)} className="w-full text-left">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-base font-black"
                                  style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                                  {s.cliente.nome.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm truncate" style={{ color: "#c8d8f0" }}>{s.cliente.nome}</p>
                                  <p className="text-[10px]" style={{ color: "#5a7a9a" }}>{tt.ticketMedioCarteira}: {fmt(s.ticketMedio)}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <p className="text-lg font-black" style={{ color: NIVEL_COR[ivca.nivel] }}>{ivca.total}</p>
                                  <p className="text-[9px] uppercase" style={{ color: "#64748b" }}>IVCA</p>
                                </div>
                                <ChevronRight size={16} style={{ color: "#5a7a9a" }} />
                              </div>
                              {piorSinal && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block" style={{ background: `${SEVERIDADE_COR[piorSinal.severidade]}18`, color: SEVERIDADE_COR[piorSinal.severidade] }}>
                                  {nomeTipoSinal(lang, piorSinal.tipo)}
                                </span>
                              )}
                            </button>
                          </CanvasBox>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════ ABA CLIENTE (DIGITAL TWIN) ═══════════════════════ */}
            {aba === "cliente" && (
              !clienteAtual ? (
                <CanvasBox cor="#6ab0ff">
                  <div className="p-8 text-center">
                    <p style={{ color: "#5a7a9a" }}>{tt.selecioneCliente}</p>
                    <motion.button whileHover={{ scale: 1.02 }} onClick={() => setAba("carteira")}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                      style={{ background: "rgba(106,176,255,0.12)", color: "#6ab0ff", border: "1px solid rgba(106,176,255,0.3)" }}>
                      <ChevronLeft size={14} /> {tt.voltarCarteira}
                    </motion.button>
                  </div>
                </CanvasBox>
              ) : (
                <div className="space-y-4">
                  {/* Header */}
                  <CanvasBox cor="#6ab0ff">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button onClick={() => setAba("carteira")} style={{ color: "#5a7a9a" }}><ChevronLeft size={20} /></button>
                      <div className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                        {clienteAtual.s.cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base" style={{ color: "#c8d8f0" }}>{clienteAtual.s.cliente.nome}</p>
                        <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.tempoDeCasa} {Math.max(0, Math.round(clienteAtual.s.tempoComoClienteDias / 30))} {tt.meses}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: clienteAtual.s.cliente.status === "ativo" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: clienteAtual.s.cliente.status === "ativo" ? "#34d399" : "#f87171" }}>
                        {clienteAtual.s.cliente.status === "ativo" ? cl.ativo : cl.inativo}
                      </span>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCliente(clienteAtual.s.cliente)} style={{ color: "#6ab0ff" }}><Pencil size={16} /></motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCliente(clienteAtual.s.cliente.id)} style={{ color: "#f87171" }}><Trash2 size={16} /></motion.button>
                    </div>
                  </CanvasBox>

                  {/* IVCA */}
                  <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(10,30,45,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(106,176,255,0.3)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Award size={16} style={{ color: "#6ab0ff" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.ivcaTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.ivcaSub}</p>
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <p className="text-4xl font-black" style={{ color: NIVEL_COR[clienteAtual.ivca.nivel], ...FONTE_EXEC }}>{clienteAtual.ivca.total}</p>
                      <div>
                        <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: `${NIVEL_COR[clienteAtual.ivca.nivel]}18`, color: NIVEL_COR[clienteAtual.ivca.nivel] }}>{clienteAtual.ivca.nivel.toUpperCase()}</span>
                        <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>{montarNarrativaIVCA(lang, clienteAtual.ivca)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {clienteAtual.ivca.subscores.map((sub) => (
                        <div key={sub.chave} className="rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[9px] uppercase tracking-wider" style={{ color: "#64748b" }}>{nomeSubscoreIVCA(lang, sub.chave)}</p>
                          <p className="text-sm font-black" style={{ color: "#93c5fd" }}>{Math.round(sub.valor)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Saúde */}
                  <CanvasBox cor="#34d399">
                    <div className="flex items-center gap-2 mb-3">
                      <HeartPulse size={16} style={{ color: "#34d399" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.saudeTitulo}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: tt.saudePagamento, v: clienteAtual.saude.pagamento },
                        { label: tt.saudeRelacionamento, v: clienteAtual.saude.relacionamento },
                        { label: tt.saudeRecorrencia, v: clienteAtual.saude.recorrencia },
                        { label: tt.saudeComercial, v: clienteAtual.saude.comercial },
                      ].map((g) => {
                        const cor = g.v >= 70 ? CORES.verde : g.v >= 40 ? CORES.amarelo : CORES.vermelho;
                        return (
                          <div key={g.label} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[10px] mb-1.5" style={{ color: "#64748b" }}>{g.label}</p>
                            <p className="text-sm font-black mb-1.5" style={{ color: cor }}>{Math.round(g.v)}/100</p>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div className="h-full rounded-full" style={{ width: `${Math.round(g.v)}%`, background: cor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CanvasBox>

                  {/* Radar de Sinais */}
                  <CanvasBox cor="#f97316">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={16} style={{ color: "#f97316" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.radarTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.radarSub}</p>
                    {clienteAtual.sinais.length === 0 ? (
                      <p className="text-xs font-medium" style={{ color: "#6ee7b7" }}>{tt.radarVazio}</p>
                    ) : (
                      <div className="space-y-2">
                        {ordenarSinaisPorSeveridade(clienteAtual.sinais).map((sinal, i) => {
                          const cor = SEVERIDADE_COR[sinal.severidade];
                          return (
                            <div key={i} className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl flex-wrap" style={{ background: `${cor}10`, border: `1px solid ${cor}25` }}>
                              <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{montarNarrativaSinal(lang, sinal)}</p>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: `${cor}18`, color: cor }}>{nomeTipoSinal(lang, sinal.tipo)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CanvasBox>

                  {/* Conselho Executivo */}
                  {especialistas && (
                    <CanvasBox cor="#d4af37">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={16} style={{ color: CORES.ouro }} />
                        <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.conselhoTitulo}</p>
                      </div>
                      <p className="text-[11px] mb-4" style={{ color: "#64748b" }}>{tt.conselhoSub}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {especialistas.cards.map((e, i) => (
                          <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                            <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{e.papel}</p>
                            <p className="text-xs font-medium" style={{ color: "#e2e8f0" }}>{e.texto}</p>
                          </div>
                        ))}
                      </div>
                      {especialistas.recomendacoes.length > 0 && (
                        <>
                          <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: CORES.ouro }}>{tt.recomendacaoConsolidada}</p>
                          <div className="space-y-1.5">
                            {especialistas.recomendacoes.map((sinal, i) => (
                              <div key={i} className="flex items-start gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#e2e8f0" }}>{montarNarrativaSinal(lang, sinal)}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </CanvasBox>
                  )}

                  {/* ZIA */}
                  <CanvasBox cor="#8b5cf6">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle size={16} style={{ color: CORES.roxo }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.ziaTitulo}</p>
                    </div>
                    <p className="text-xs mb-3" style={{ color: "#64748b" }}>{tt.ziaSub}</p>
                    {mensagensChat.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-72 overflow-y-auto pr-1">
                        {mensagensChat.map((m, i) => (
                          <div key={i} className="px-3 py-2 rounded-xl text-xs md:text-[13px]" style={{
                            background: m.role === "user" ? "rgba(106,176,255,0.1)" : "rgba(139,92,246,0.1)",
                            border: `1px solid ${m.role === "user" ? "rgba(106,176,255,0.25)" : "rgba(139,92,246,0.25)"}`,
                            color: "#e2e8f0", marginLeft: m.role === "user" ? "15%" : 0, marginRight: m.role === "user" ? 0 : "15%",
                          }}>{m.texto}</div>
                        ))}
                        {chatCarregando && <p className="text-xs" style={{ color: "#64748b" }}>{tt.ziaPensando}</p>}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input value={inputChat} onChange={(e) => setInputChat(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && perguntarZIA(inputChat)}
                        placeholder={tt.ziaPlaceholder}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)", color: "#c8d8f0" }} />
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={chatCarregando || !inputChat.trim()}
                        onClick={() => perguntarZIA(inputChat)}
                        className="px-3 rounded-xl flex items-center justify-center" style={{ background: CORES.roxo, color: "#fff" }}>
                        <Send size={16} />
                      </motion.button>
                    </div>
                  </CanvasBox>

                  {/* Linha do Tempo */}
                  <CanvasBox cor="#6ab0ff">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} style={{ color: "#6ab0ff" }} />
                      <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.timelineTitulo}</p>
                    </div>
                    {timeline.length === 0 ? (
                      <p className="text-xs" style={{ color: "#5a7a9a" }}>{tt.timelineVazio}</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {timeline.slice(0, 30).map((ev, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-[10px] flex-shrink-0 pt-0.5" style={{ color: "#5a7a9a", width: 72 }}>{new Date(ev.data + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                            <p className="text-xs" style={{ color: "#c8d8f0" }}>{ev.texto}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CanvasBox>

                  {/* Dados cadastrais + contas */}
                  <CanvasBox cor="#6ab0ff">
                    <p className="text-sm font-black mb-3" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{tt.dadosCadastrais}</p>
                    <div className="space-y-1.5 mb-4">
                      {clienteAtual.s.cliente.email && <div className="flex items-center gap-2"><Mail size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.email}</p></div>}
                      {clienteAtual.s.cliente.telefone && <div className="flex items-center gap-2"><Phone size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.telefone}</p></div>}
                      {clienteAtual.s.cliente.cidade && <div className="flex items-center gap-2"><MapPin size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.cidade}</p></div>}
                      {clienteAtual.s.cliente.documento && <div className="flex items-center gap-2"><FileText size={11} style={{ color: "#5a7a9a" }} /><p className="text-xs" style={{ color: "#5a7a9a" }}>{clienteAtual.s.cliente.documento}</p></div>}
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setAba("cobrancas")}
                      className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                      style={{ background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                      {tt.verTodasCobrancas} <ChevronRight size={14} />
                    </motion.button>
                  </CanvasBox>
                </div>
              )
            )}

            {/* ═══════════════════════ ABA COBRANÇAS ═══════════════════════ */}
            {aba === "cobrancas" && (
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row gap-3 items-start">
                  <div className="flex-1">
                    <CanvasBox cor="#3b6fd4">
                      <input value={buscaContas} onChange={(e) => { setBuscaContas(e.target.value); }}
                        placeholder={idioma === "pt" ? "Buscar por descrição ou cliente..." : "Search..."}
                        className="w-full text-sm focus:outline-none bg-transparent py-1"
                        style={{ color: "#c8d8f0" }} />
                    </CanvasBox>
                  </div>
                  {clienteSelecionadoId && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-2xl flex-shrink-0"
                      style={{ background: "rgba(106,176,255,0.1)", border: "1px solid rgba(106,176,255,0.3)" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                        style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
                        {(clientes.find(c => c.id === clienteSelecionadoId)?.nome || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold" style={{ color: "#6ab0ff" }}>{clientes.find(c => c.id === clienteSelecionadoId)?.nome}</span>
                      <motion.button whileHover={{ scale: 1.1 }} onClick={() => setClienteSelecionadoId(null)} style={{ color: "#5a7a9a" }}><X size={14} /></motion.button>
                    </motion.div>
                  )}
                </div>
                {contasFiltradas.length === 0 ? (
                  <CanvasBox cor="#34d399">
                    <div className="p-8 text-center"><p style={{ color: "#5a7a9a" }}>{cl.semContas}</p></div>
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
                            {clienteDaConta && !clienteSelecionadoId && (
                              <button onClick={() => setClienteSelecionadoId(clienteDaConta.id)} className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: "rgba(106,176,255,0.1)", color: "#6ab0ff" }}>👤 {clienteDaConta.nome}</button>
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
          </>
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
