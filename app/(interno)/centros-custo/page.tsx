"use client";
import { useState, useEffect } from "react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { Pencil, Trash2, X, Split } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { consultarCEP, validarCPF, formatarCPF, formatarCEP } from "../../../lib/enderecoHelpers";
import { validarCNPJ, formatarCNPJ } from "../../../lib/empresaHelpers";
import { optCascata } from "../../../lib/cfoCore";
import ReactECharts from "echarts-for-react";
import {
  type OrigemTabela, LABEL_ORIGEM, type LancamentoOrigem, carregarTodosLancamentosOrigem,
  type RateioRow, carregarRateios, aplicarRateio, removerRateio, custosPorCentroReal, sugerirPercentuaisPorBase,
  type OrcamentoRow, carregarOrcamentos, definirOrcamento, orcamentoDoPeriodo, registrarAuditoriaCentro,
  type ReceitaOrigem, carregarReceitasOrigem, receitasPorCentroReal,
  type AuditoriaRow, carregarAuditoriaCentro,
} from "../../../lib/centroCustoHelpers";
import {
  analisarCausaRaiz, type CausaRaizItem, identificarOportunidades, type Oportunidade,
  priorizar, type ItemPriorizado, montarChoqueExecutivo, simularCenarioCascata, mapaDeImpacto,
  type TipoCenarioExecutivo, type BaselineSimulacao, reforecastOrcamento, calcularScoreCentroCusto,
  montarCentralInsights, respostaPorRegrasCentro, carregarPlanosAcao, criarPlanoAcao, atualizarPlanoAcao,
  excluirPlanoAcao, type PlanoAcao,
} from "../../../lib/centroCustoInteligenciaHelpers";
import {
  type FornecedorRow, type ContaPagarRow, type FornecedorContrato,
} from "../../../lib/fornecedorHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Centro = {
  id: string; nome: string; tipo: string; descricao: string; ativo: boolean;
  orcamento_mensal?: number; meta_receita?: number; responsavel?: string; codigo?: string;
  tipo_pessoa?: string | null; documento?: string | null; pais?: string | null;
  cep?: string | null; endereco?: string | null; numero?: string | null; complemento?: string | null;
  bairro?: string | null; cidade?: string | null; uf?: string | null;
  headcount?: number | null; area_m2?: number | null;
  user_id: string; created_at: string;
};
type Lancamento = {
  id: string; descricao: string; valor: number; tipo: string;
  data: string; centro_custo_id: string; categoria: string;
  user_id: string; created_at: string;
};

const CORES_CENTRO = ["#9f1239", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee"];
const getCor = (index: number) => CORES_CENTRO[index % CORES_CENTRO.length];

const inputStyle = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(159,18,57,0.2)", color: "#c8d8f0" };
const selectStyle = { background: "rgba(10,22,40,0.95)", border: "1px solid rgba(159,18,57,0.2)", color: "#c8d8f0" };

function ModalPremium({ aberto, onFechar, titulo, cor = "#9f1239", children }: {
  aberto: boolean; onFechar: () => void; titulo: string; cor?: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {aberto && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-md">
            <CanvasBox cor={cor}>
              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#881337" }}>AXIOMA AI.TECH</p>
                  <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{titulo}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onFechar} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
              </div>
              {children}
            </CanvasBox>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CentrosCustoPage() {
  const { t, idioma } = useLanguage();
  const cc = t.centrosCusto;
  const [aba, setAba] = useState<"visao" | "centros" | "lancamentos" | "insights" | "causaRaiz" | "oportunidades" | "simulador" | "copiloto" | "acoes">("visao");
  const [centros, setCentros] = useState<Centro[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));

  const [modalCentro, setModalCentro] = useState(false);
  const [editandoCentro, setEditandoCentro] = useState<Centro | null>(null);
  const [nomeCentro, setNomeCentro] = useState("");
  const [tipoCentro, setTipoCentro] = useState("operacional");
  const [descricaoCentro, setDescricaoCentro] = useState("");
  const [orcamentoCentro, setOrcamentoCentro] = useState("");
  const [metaCentro, setMetaCentro] = useState("");
  const [responsavelCentro, setResponsavelCentro] = useState("");
  const [codigoCentro, setCodigoCentro] = useState("");
  const [salvandoCentro, setSalvandoCentro] = useState(false);

  // Cadastro enterprise (documento, endereço, base de rateio)
  const [tipoPessoaCentro, setTipoPessoaCentro] = useState("PJ");
  const [documentoCentro, setDocumentoCentro] = useState("");
  const [cepCentro, setCepCentro] = useState("");
  const [enderecoCentro, setEnderecoCentro] = useState("");
  const [numeroCentro, setNumeroCentro] = useState("");
  const [complementoCentro, setComplementoCentro] = useState("");
  const [bairroCentro, setBairroCentro] = useState("");
  const [cidadeCentro, setCidadeCentro] = useState("");
  const [ufCentro, setUfCentro] = useState("");
  const [headcountCentro, setHeadcountCentro] = useState("");
  const [areaCentro, setAreaCentro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erroDocCentro, setErroDocCentro] = useState("");

  // Integração com módulos reais (Fase 1)
  const [lancamentosOrigem, setLancamentosOrigem] = useState<LancamentoOrigem[]>([]);
  const [rateios, setRateios] = useState<RateioRow[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [orcamentoEditId, setOrcamentoEditId] = useState<string | null>(null);
  const [orcamentoEditValor, setOrcamentoEditValor] = useState("");
  const [salvandoOrcamento, setSalvandoOrcamento] = useState(false);

  // Fase 2 — Inteligência Executiva: dados cruzados dos módulos de origem (só leitura)
  const [receitasOrigem, setReceitasOrigem] = useState<ReceitaOrigem[]>([]);
  const [fornecedoresF2, setFornecedoresF2] = useState<FornecedorRow[]>([]);
  const [contasPagarF2, setContasPagarF2] = useState<ContaPagarRow[]>([]);
  const [contratosF2, setContratosF2] = useState<FornecedorContrato[]>([]);
  const [auditoria, setAuditoria] = useState<AuditoriaRow[]>([]);
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([]);

  // Simulador (Escopo D)
  const [simTipo, setSimTipo] = useState<TipoCenarioExecutivo>("reduzir_custos");
  const [simValorPct, setSimValorPct] = useState("10");
  const [simCentroId, setSimCentroId] = useState("");
  const [simHorizonte, setSimHorizonte] = useState("12");

  // Copiloto (Escopo G)
  const [chatMensagens, setChatMensagens] = useState<{ role: "user" | "assistant"; texto: string }[]>([
    { role: "assistant", texto: idioma === "en"
      ? "Hello! I'm the Cost Center copilot. Ask me which center consumes the most cash, how to reduce expenses, which center destroys margin, or whether you're within budget."
      : idioma === "es"
      ? "¡Hola! Soy el copiloto de Centro de Costos. Pregúntame qué centro consume más caja, cómo reducir gastos, qué centro destruye margen, o si está dentro del presupuesto."
      : "Olá! Sou o copiloto do Centro de Custos. Pergunte sobre qual centro mais consome caixa, como reduzir despesas, qual centro destrói margem, ou se está dentro do orçamento." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatCarregando, setChatCarregando] = useState(false);

  // Planejador de Ações (Escopo H)
  const [modalPlano, setModalPlano] = useState(false);
  const [editandoPlanoId, setEditandoPlanoId] = useState<string | null>(null);
  const [planoOrigem, setPlanoOrigem] = useState<{ tipo: "causa_raiz" | "oportunidade" | "manual"; id?: string; centroId?: string | null } | null>(null);
  const [planoTitulo, setPlanoTitulo] = useState("");
  const [planoObjetivo, setPlanoObjetivo] = useState("");
  const [planoTarefas, setPlanoTarefas] = useState("");
  const [planoResponsavel, setPlanoResponsavel] = useState("");
  const [planoPrazo, setPlanoPrazo] = useState("");
  const [planoImpacto, setPlanoImpacto] = useState("");
  const [planoEconomia, setPlanoEconomia] = useState("");
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  const [modalLancamento, setModalLancamento] = useState(false);
  const [editandoLanc, setEditandoLanc] = useState<Lancamento | null>(null);
  const [descricaoLanc, setDescricaoLanc] = useState("");
  const [valorLanc, setValorLanc] = useState("");
  const [tipoLanc, setTipoLanc] = useState("custo");
  const [dataLanc, setDataLanc] = useState(new Date().toISOString().split("T")[0]);
  const [centroLanc, setCentroLanc] = useState("");
  const [categoriaLanc, setCategoriaLanc] = useState("");
  const [salvandoLanc, setSalvandoLanc] = useState(false);
  const [busca, setBusca] = useState("");

  // Rateio — divide UM lançamento existente (Custos Fixos/Variáveis/Contas a Pagar) entre centros por %
  const [modalRateio, setModalRateio] = useState(false);
  const [rateioTabela, setRateioTabela] = useState<OrigemTabela>("custos_fixos");
  const [rateioOrigemId, setRateioOrigemId] = useState("");
  const [rateioPercentuais, setRateioPercentuais] = useState<Record<string, string>>({});
  const [processandoRateio, setProcessandoRateio] = useState(false);

  useEffect(() => { carregarDados(); }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);
    const [
      { data: centrosData }, { data: lancamentosData }, origensData, rateiosData, orcamentosData,
      receitasData, { data: fornecedoresData }, { data: contasPagarData }, { data: contratosData },
      auditoriaData, planosData,
    ] = await Promise.all([
      supabase.from("centros_custo").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
      supabase.from("lancamentos_centro").select("*").eq("user_id", user.id).order("data", { ascending: false }),
      carregarTodosLancamentosOrigem(user.id),
      carregarRateios(user.id),
      carregarOrcamentos(user.id),
      carregarReceitasOrigem(user.id),
      supabase.from("fornecedores").select("id, nome, status, categoria, nivel_qualidade, classificacao_risco, uf, cidade, created_at, tipo_pessoa, regime_tributario, contribuinte_icms, valor_mensal, centro_custo_id").eq("user_id", user.id),
      supabase.from("contas_pagar").select("id, fornecedor_id, descricao, categoria, valor_total, valor_pago, data_emissao, data_vencimento, data_pagamento, status").eq("user_id", user.id),
      supabase.from("fornecedor_contratos").select("*").eq("user_id", user.id),
      carregarAuditoriaCentro(user.id),
      carregarPlanosAcao(user.id),
    ]);
    setCentros(centrosData || []);
    setLancamentos(lancamentosData || []);
    setLancamentosOrigem(origensData);
    setRateios(rateiosData);
    setOrcamentos(orcamentosData);
    setReceitasOrigem(receitasData);
    setFornecedoresF2(fornecedoresData || []);
    setContasPagarF2(contasPagarData || []);
    setContratosF2(contratosData || []);
    setAuditoria(auditoriaData);
    setPlanosAcao(planosData);
    setLoading(false);
  }

  async function salvarCentro() {
    if (!nomeCentro.trim()) return;
    if (documentoCentro.trim()) {
      const ok = tipoPessoaCentro === "PF" ? validarCPF(documentoCentro) : validarCNPJ(documentoCentro);
      if (!ok) { setErroDocCentro(tipoPessoaCentro === "PF" ? "CPF inválido" : "CNPJ inválido"); return; }
    }
    setErroDocCentro("");
    setSalvandoCentro(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoCentro(false); return; }
    const payload: any = {
      nome: nomeCentro, tipo: tipoCentro, descricao: descricaoCentro,
      orcamento_mensal: parseFloat(orcamentoCentro || "0"),
      meta_receita: parseFloat(metaCentro || "0"),
      responsavel: responsavelCentro, codigo: codigoCentro,
      tipo_pessoa: tipoPessoaCentro, documento: documentoCentro || null, pais: "BR",
      cep: cepCentro || null, endereco: enderecoCentro || null, numero: numeroCentro || null,
      complemento: complementoCentro || null, bairro: bairroCentro || null, cidade: cidadeCentro || null, uf: ufCentro || null,
      headcount: headcountCentro ? parseInt(headcountCentro) : null, area_m2: areaCentro ? parseFloat(areaCentro) : null,
    };
    if (editandoCentro) {
      await supabase.from("centros_custo").update(payload).eq("id", editandoCentro.id);
      await registrarAuditoriaCentro({ userId: user.id, centroId: editandoCentro.id, tabela: "centros_custo", registroId: editandoCentro.id, acao: "editar", descricao: `Centro editado: ${nomeCentro}`, valorAntes: editandoCentro, valorDepois: payload });
    } else {
      const { data } = await supabase.from("centros_custo").insert({ ...payload, user_id: user.id, ativo: true }).select("id").single();
      await registrarAuditoriaCentro({ userId: user.id, centroId: data?.id, tabela: "centros_custo", registroId: data?.id, acao: "criar", descricao: `Centro criado: ${nomeCentro}`, valorDepois: payload });
    }
    fecharModalCentro(); setSalvandoCentro(false); carregarDados();
  }

  async function excluirCentro(id: string) {
    if (!userId) return;
    const centro = centros.find(c => c.id === id);
    await supabase.from("centros_custo").delete().eq("id", id);
    await registrarAuditoriaCentro({ userId, centroId: id, tabela: "centros_custo", registroId: id, acao: "excluir", descricao: `Centro excluído: ${centro?.nome || id}` });
    carregarDados();
  }

  async function salvarLancamento() {
    if (!descricaoLanc.trim() || !valorLanc) return;
    setSalvandoLanc(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvandoLanc(false); return; }
    const payload: any = {
      descricao: descricaoLanc, valor: parseFloat(valorLanc), tipo: tipoLanc,
      data: dataLanc, categoria: categoriaLanc || null,
      centro_custo_id: centroLanc || null,
    };
    if (editandoLanc) {
      const { error } = await supabase.from("lancamentos_centro").update(payload).eq("id", editandoLanc.id);
      if (error) { console.error("Erro ao editar lançamento:", error.message, error); alert("Erro ao editar: " + error.message); setSalvandoLanc(false); return; }
    } else {
      const { error } = await supabase.from("lancamentos_centro").insert({ ...payload, user_id: user.id });
      if (error) { console.error("Erro ao salvar lançamento:", error.message, error); alert("Erro ao salvar: " + error.message); setSalvandoLanc(false); return; }
    }
    fecharModalLancamento();
    carregarDados(); setSalvandoLanc(false);
  }

  function abrirNovoLancamento() {
    setEditandoLanc(null);
    setDescricaoLanc(""); setValorLanc(""); setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc(""); setCategoriaLanc("");
    setModalLancamento(true);
  }

  function abrirEditarLancamento(lanc: Lancamento) {
    setEditandoLanc(lanc);
    setDescricaoLanc(lanc.descricao || "");
    setValorLanc(String(lanc.valor || ""));
    setTipoLanc(lanc.tipo || "custo");
    setDataLanc(lanc.data || new Date().toISOString().split("T")[0]);
    setCentroLanc(lanc.centro_custo_id || "");
    setCategoriaLanc(lanc.categoria || "");
    setModalLancamento(true);
  }

  function fecharModalLancamento() {
    setModalLancamento(false); setEditandoLanc(null);
    setDescricaoLanc(""); setValorLanc(""); setTipoLanc("custo");
    setDataLanc(new Date().toISOString().split("T")[0]);
    setCentroLanc(""); setCategoriaLanc("");
  }

  async function excluirLancamento(id: string) {
    await supabase.from("lancamentos_centro").delete().eq("id", id);
    carregarDados();
  }

  function abrirEditarCentro(centro: Centro) {
    setEditandoCentro(centro); setNomeCentro(centro.nome);
    setTipoCentro(centro.tipo || "operacional"); setDescricaoCentro(centro.descricao || "");
    setOrcamentoCentro(String(centro.orcamento_mensal || ""));
    setMetaCentro(String(centro.meta_receita || ""));
    setResponsavelCentro(centro.responsavel || ""); setCodigoCentro(centro.codigo || "");
    setTipoPessoaCentro(centro.tipo_pessoa || "PJ"); setDocumentoCentro(centro.documento || "");
    setCepCentro(centro.cep || ""); setEnderecoCentro(centro.endereco || ""); setNumeroCentro(centro.numero || "");
    setComplementoCentro(centro.complemento || ""); setBairroCentro(centro.bairro || ""); setCidadeCentro(centro.cidade || ""); setUfCentro(centro.uf || "");
    setHeadcountCentro(centro.headcount != null ? String(centro.headcount) : ""); setAreaCentro(centro.area_m2 != null ? String(centro.area_m2) : "");
    setErroDocCentro("");
    setModalCentro(true);
  }

  function fecharModalCentro() {
    setModalCentro(false); setEditandoCentro(null);
    setNomeCentro(""); setTipoCentro("operacional"); setDescricaoCentro("");
    setOrcamentoCentro(""); setMetaCentro(""); setResponsavelCentro(""); setCodigoCentro("");
    setTipoPessoaCentro("PJ"); setDocumentoCentro(""); setCepCentro(""); setEnderecoCentro("");
    setNumeroCentro(""); setComplementoCentro(""); setBairroCentro(""); setCidadeCentro(""); setUfCentro("");
    setHeadcountCentro(""); setAreaCentro(""); setErroDocCentro("");
  }

  async function buscarCepCentro(cep: string) {
    setCepCentro(cep);
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    setBuscandoCep(true);
    const r = await consultarCEP(limpo);
    if (!("erro" in r)) {
      setCepCentro(r.cep || cep); setEnderecoCentro(r.logradouro || ""); setBairroCentro(r.bairro || "");
      setCidadeCentro(r.cidade || ""); setUfCentro(r.uf || "");
    }
    setBuscandoCep(false);
  }

  // ---------- RATEIO — divide UM lançamento existente entre centros por % ----------
  function abrirRateio() {
    setRateioTabela("custos_fixos"); setRateioOrigemId(""); setRateioPercentuais({}); setModalRateio(true);
  }

  const opcoesRateio = lancamentosOrigem.filter(o => o.tabela === rateioTabela);
  const origemSelecionada = opcoesRateio.find(o => o.id === rateioOrigemId) || null;
  const rateioExistente = rateioOrigemId ? rateios.filter(r => r.origem_tabela === rateioTabela && r.origem_id === rateioOrigemId) : [];

  const somaPercentuais = Object.values(rateioPercentuais).reduce((s, v) => s + parseFloat(v || "0"), 0);
  const restanteRateio = 100 - somaPercentuais;

  function distribuirIgualmente() {
    if (centros.length === 0) return;
    const base = Math.floor((100 / centros.length) * 100) / 100; // 2 casas
    const novo: Record<string, string> = {};
    centros.forEach((c, idx) => {
      // o último recebe o ajuste pra fechar exatamente 100%
      if (idx === centros.length - 1) {
        const resto = Number((100 - base * (centros.length - 1)).toFixed(2));
        novo[c.id] = String(resto);
      } else {
        novo[c.id] = String(base);
      }
    });
    setRateioPercentuais(novo);
  }

  function distribuirPorBase(base: "headcount" | "area") {
    const sugestao = sugerirPercentuaisPorBase(centros, base);
    if (Object.keys(sugestao).length > 0) setRateioPercentuais(sugestao);
  }

  async function confirmarRateio() {
    if (!origemSelecionada || !userId) return;
    if (Math.abs(restanteRateio) > 0.5) return; // precisa somar 100%
    setProcessandoRateio(true);
    const splits = centros
      .filter(c => parseFloat(rateioPercentuais[c.id] || "0") > 0)
      .map(c => ({ centroId: c.id, percentual: parseFloat(rateioPercentuais[c.id]) }));
    const { erro } = await aplicarRateio(userId, rateioTabela, origemSelecionada.id, origemSelecionada.descricao, "manual", splits);
    if (erro) {
      alert("Erro ao aplicar rateio: " + erro);
      setProcessandoRateio(false);
      return;
    }
    setModalRateio(false); setProcessandoRateio(false); carregarDados();
  }

  async function excluirRateioAtual() {
    if (!userId || !rateioOrigemId) return;
    await removerRateio(userId, rateioTabela, rateioOrigemId);
    setRateioPercentuais({});
    carregarDados();
  }

  const custosPorCentroIntegrados = custosPorCentroReal(lancamentosOrigem, rateios);
  const receitasPorCentroIntegradas = receitasPorCentroReal(receitasOrigem);

  // ---------- CÁLCULOS (período selecionado) ----------
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const noPeriodo = (l: Lancamento) => (l.data || "").slice(0, 7) === periodo;
  const lancPeriodo = lancamentos.filter(noPeriodo);

  // ponytail: totais integrados (Custos Fixos/Variáveis/Contas a Pagar/Receitas) não filtram por
  // período — Custos Fixos já é sempre recorrente mensal em todo o Axioma; refinar por data se
  // precisar granularidade por mês nos demais.
  const getOrcamento = (c: Centro) => orcamentoDoPeriodo(orcamentos, c.id, periodo, c.orcamento_mensal || 0);
  const getCustos = (id: string) =>
    lancPeriodo.filter(l => l.centro_custo_id === id && l.tipo === "custo").reduce((s, l) => s + l.valor, 0)
    + (custosPorCentroIntegrados[id] || 0);
  const getReceitas = (id: string) =>
    lancPeriodo.filter(l => l.centro_custo_id === id && l.tipo === "receita").reduce((s, l) => s + l.valor, 0)
    + (receitasPorCentroIntegradas[id] || 0);

  const totalCustos = centros.reduce((s, c) => s + getCustos(c.id), 0) + lancPeriodo.filter(l => !l.centro_custo_id && l.tipo === "custo").reduce((s, l) => s + l.valor, 0);
  const totalReceitas = centros.reduce((s, c) => s + getReceitas(c.id), 0) + lancPeriodo.filter(l => !l.centro_custo_id && l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const totalOrcado = centros.reduce((s, c) => s + getOrcamento(c), 0);
  const resultadoGeral = totalReceitas - totalCustos;

  const lancFiltrados = lancamentos.filter(l => l.descricao.toLowerCase().includes(busca.toLowerCase()));

  // ========================================================================
  // FASE 2 — INTELIGÊNCIA EXECUTIVA (tudo derivado do que já foi carregado, nenhuma escrita)
  // ========================================================================
  const centrosLeves = centros.map(c => ({ id: c.id, nome: c.nome }));
  const fornecedoresLeves = fornecedoresF2.map(f => ({ id: f.id, nome: f.nome }));

  const langF2 = (idioma === "en" ? "en" : idioma === "es" ? "es" : "pt") as "pt" | "en" | "es";
  const causaRaiz: CausaRaizItem[] = analisarCausaRaiz(lancamentosOrigem, auditoria, centrosLeves, fornecedoresLeves, langF2);

  const oportunidades: Oportunidade[] = identificarOportunidades({
    fornecedores: fornecedoresF2, contasPagar: contasPagarF2, contratos: contratosF2,
    custosFixos: lancamentosOrigem.filter(o => o.tabela === "custos_fixos"),
    custosVariaveis: lancamentosOrigem.filter(o => o.tabela === "custos_variaveis"),
    centros: centrosLeves,
    custosPorCentro: Object.fromEntries(centros.map(c => [c.id, getCustos(c.id)])),
    receitasPorCentro: Object.fromEntries(centros.map(c => [c.id, getReceitas(c.id)])),
    lang: langF2,
  });

  const priorizados: ItemPriorizado[] = priorizar(causaRaiz, oportunidades, langF2);

  const idsComPlanoAcao = new Set(planosAcao.filter(p => p.status !== "cancelado").map(p => p.origem_id).filter(Boolean) as string[]);
  const origensSemCentro = lancamentosOrigem.filter(o => !o.centro_custo_id).length;
  const scoreModulo = calcularScoreCentroCusto({
    centros: centrosLeves, custosPorCentro: Object.fromEntries(centros.map(c => [c.id, getCustos(c.id)])),
    orcamentoPorCentro: (id) => getOrcamento(centros.find(c => c.id === id)!),
    causaRaiz, totalCustos, oportunidades, idsComPlanoAcao,
    origensSemCentro, origensTotais: lancamentosOrigem.length, lang: langF2,
  });

  const insights = montarCentralInsights({
    priorizados, oportunidades, centros: centrosLeves,
    custosPorCentro: Object.fromEntries(centros.map(c => [c.id, getCustos(c.id)])),
    receitasPorCentro: Object.fromEntries(centros.map(c => [c.id, getReceitas(c.id)])),
  });

  const hoje = new Date();
  const periodoEhMesAtual = periodo === hoje.toISOString().slice(0, 7);
  const dataRefReforecast = periodoEhMesAtual ? hoje : new Date(Number(periodo.slice(0, 4)), Number(periodo.slice(5, 7)), 0);
  const reforecast = reforecastOrcamento(centrosLeves, Object.fromEntries(centros.map(c => [c.id, getCustos(c.id)])), (id) => getOrcamento(centros.find(c => c.id === id)!), dataRefReforecast);

  // ---------- Simulador (Escopo D) ----------
  const contasPagarEmAberto = contasPagarF2.filter(c => c.status !== "pago").reduce((s, c) => s + (c.valor_total - (c.valor_pago || 0)), 0);
  const custoFixoShareCentro = simCentroId ? lancamentosOrigem.filter(o => o.tabela === "custos_fixos" && o.centro_custo_id === simCentroId).reduce((s, o) => s + o.valor, 0) : 0;
  const custoVariavelShareCentro = simCentroId ? lancamentosOrigem.filter(o => o.tabela === "custos_variaveis" && o.centro_custo_id === simCentroId && o.data.slice(0, 7) === periodo).reduce((s, o) => s + o.valor, 0) : 0;
  const baselineSimulacao: BaselineSimulacao = {
    receitaMensal: totalReceitas,
    custoFixoMensal: lancamentosOrigem.filter(o => o.tabela === "custos_fixos").reduce((s, o) => s + o.valor, 0),
    custoVariavelMensal: lancamentosOrigem.filter(o => o.tabela === "custos_variaveis" && o.data.slice(0, 7) === periodo).reduce((s, o) => s + o.valor, 0),
    caixaAtual: 0,
    capitalGiroAtual: -contasPagarEmAberto,
  };
  const choqueSim = montarChoqueExecutivo(simTipo, parseFloat(simValorPct || "0"), baselineSimulacao, simTipo === "encerrar_centro" ? { custoFixoShare: custoFixoShareCentro, custoVariavelShare: custoVariavelShareCentro } : undefined);
  const resultadosSim = simularCenarioCascata(baselineSimulacao, choqueSim, parseInt(simHorizonte || "12"));
  const resultadoBaseSim = resultadosSim.find(r => r.nome === "base") || resultadosSim[0];
  const itensCascataSim = mapaDeImpacto(baselineSimulacao, choqueSim, resultadoBaseSim, langF2);
  const optMapaImpacto = optCascata(itensCascataSim, "#34d399", "#f87171", "#a78bfa");

  // ---------- Copiloto (Escopo G) ----------
  async function enviarMensagemCopiloto(texto: string) {
    if (!texto.trim() || chatCarregando) return;
    const novas: typeof chatMensagens = [...chatMensagens, { role: "user", texto }];
    setChatMensagens(novas);
    setChatInput("");
    setChatCarregando(true);
    const ctx = {
      centros: centrosLeves, custosPorCentro: Object.fromEntries(centros.map(c => [c.id, getCustos(c.id)])),
      receitasPorCentro: Object.fromEntries(centros.map(c => [c.id, getReceitas(c.id)])),
      orcamentoPorCentro: (id: string) => getOrcamento(centros.find(c => c.id === id)!),
      oportunidades, score: scoreModulo, periodo, lang: langF2,
    };
    let resposta = "";
    try {
      const res = await fetch("/api/ia-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagem: `Você é o copiloto do módulo Centro de Custos da Axioma AI.Tech. Responda só com base nestes dados reais: ${JSON.stringify(ctx)}. Pergunta: ${texto}`,
          historico: novas.slice(-8).map(m => ({ role: m.role, content: m.texto })),
        }),
      });
      if (res.ok) { const data = await res.json(); resposta = data.resposta || ""; }
    } catch {}
    if (!resposta) resposta = respostaPorRegrasCentro(texto, ctx);
    setChatMensagens([...novas, { role: "assistant", texto: resposta }]);
    setChatCarregando(false);
  }

  // ---------- Planejador de Ações (Escopo H) ----------
  function abrirPlanoDeAcao(origemTipo: "causa_raiz" | "oportunidade" | "manual", origemId?: string, centroId?: string | null, tituloSugerido?: string, economiaSugerida?: number, impactoSugerido?: string) {
    setEditandoPlanoId(null);
    setPlanoOrigem({ tipo: origemTipo, id: origemId, centroId });
    setPlanoTitulo(tituloSugerido || "");
    setPlanoObjetivo(""); setPlanoTarefas(""); setPlanoResponsavel(""); setPlanoPrazo("");
    setPlanoImpacto(impactoSugerido || ""); setPlanoEconomia(economiaSugerida != null ? String(economiaSugerida) : "");
    setModalPlano(true);
  }

  function abrirEdicaoPlano(plano: PlanoAcao) {
    setEditandoPlanoId(plano.id);
    setPlanoOrigem({ tipo: plano.origem_tipo, id: plano.origem_id || undefined, centroId: plano.centro_custo_id });
    setPlanoTitulo(plano.titulo); setPlanoObjetivo(plano.objetivo || "");
    setPlanoTarefas((plano.tarefas || []).join("\n")); setPlanoResponsavel(plano.responsavel || "");
    setPlanoPrazo(plano.prazo || ""); setPlanoImpacto(plano.impacto_esperado || "");
    setPlanoEconomia(plano.economia_estimada != null ? String(plano.economia_estimada) : "");
    setModalPlano(true);
  }

  async function salvarPlano() {
    if (!userId || !planoTitulo.trim() || !planoOrigem) return;
    setSalvandoPlano(true);
    const tarefas = planoTarefas ? planoTarefas.split("\n").map(t => t.trim()).filter(Boolean) : undefined;
    const { erro } = editandoPlanoId
      ? await atualizarPlanoAcao(editandoPlanoId, {
          titulo: planoTitulo, objetivo: planoObjetivo, tarefas, responsavel: planoResponsavel, prazo: planoPrazo,
          impactoEsperado: planoImpacto, economiaEstimada: planoEconomia ? parseFloat(planoEconomia) : undefined,
        })
      : await criarPlanoAcao(userId, {
          centroId: planoOrigem.centroId, origemTipo: planoOrigem.tipo, origemId: planoOrigem.id,
          titulo: planoTitulo, objetivo: planoObjetivo || undefined, tarefas,
          responsavel: planoResponsavel || undefined, prazo: planoPrazo || undefined,
          impactoEsperado: planoImpacto || undefined, economiaEstimada: planoEconomia ? parseFloat(planoEconomia) : undefined,
        });
    if (erro) { alert("Erro ao salvar plano: " + erro); setSalvandoPlano(false); return; }
    setModalPlano(false); setSalvandoPlano(false); carregarDados();
  }

  async function mudarStatusPlano(id: string, status: PlanoAcao["status"]) {
    await atualizarPlanoAcao(id, { status });
    carregarDados();
  }

  async function removerPlano(id: string) {
    await excluirPlanoAcao(id);
    carregarDados();
  }

  const L = {
    orcado: idioma === "pt" ? "Orçado" : idioma === "en" ? "Budget" : "Presupuesto",
    realizado: idioma === "pt" ? "Realizado" : idioma === "en" ? "Actual" : "Realizado",
    variancia: idioma === "pt" ? "Variância" : idioma === "en" ? "Variance" : "Variación",
    resultado: idioma === "pt" ? "Resultado" : idioma === "en" ? "Result" : "Resultado",
    margem: idioma === "pt" ? "Margem" : idioma === "en" ? "Margin" : "Margen",
    participacao: idioma === "pt" ? "Participação" : idioma === "en" ? "Share" : "Participación",
    responsavel: idioma === "pt" ? "Responsável" : idioma === "en" ? "Manager" : "Responsable",
    periodo: idioma === "pt" ? "Período" : idioma === "en" ? "Period" : "Período",
    rateio: idioma === "pt" ? "Ratear Custo" : idioma === "en" ? "Allocate Cost" : "Distribuir Costo",
    dentroOrc: idioma === "pt" ? "dentro do orçamento" : idioma === "en" ? "within budget" : "dentro del presupuesto",
    estourou: idioma === "pt" ? "acima do orçamento" : idioma === "en" ? "over budget" : "sobre presupuesto",
  };

  const botaoLancamento = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={abrirNovoLancamento}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
      + {cc.novoLancamento}
    </motion.button>
  );

  const botaoRateio = (
    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
      onClick={abrirRateio}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
      style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
      <Split size={15} /> {L.rateio}
    </motion.button>
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: "#020810", minHeight: "100vh" }}>
      <div className="w-10 h-10 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <ModuloLayout titulo={cc.titulo} subtitulo={cc.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditandoCentro(null); fecharModalCentro(); setModalCentro(true); }}
      labelBotao={cc.novoCentro} botaoExtra={<div className="flex gap-2 flex-wrap">{botaoLancamento}{botaoRateio}</div>}>
      <div className="space-y-4">

        {/* Seletor de período */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{L.periodo}:</span>
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm focus:outline-none" style={inputStyle} />
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: cc.totalCentros, valor: centros.length.toString(), cor: "#9f1239" },
            { label: L.orcado, valor: fmt(totalOrcado), cor: "#a78bfa" },
            { label: L.realizado + " (custo)", valor: fmt(totalCustos), cor: "#f87171" },
            { label: L.resultado, valor: fmt(resultadoGeral), cor: resultadoGeral >= 0 ? "#34d399" : "#f87171" },
          ].map((card, i) => (
            <CanvasBox key={i} cor={card.cor}>
              <p className="text-xs mb-1 uppercase tracking-wider" style={{ color: "#5a7a9a" }}>{card.label}</p>
              <p className="text-lg md:text-xl font-bold" style={{ color: card.cor }}>{card.valor}</p>
            </CanvasBox>
          ))}
        </div>

        {/* Score do módulo (Fase 2) — sempre explicável, cada dimensão mostra o número que a gerou */}
        <CanvasBox cor={scoreModulo.cor}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl md:text-3xl font-black" style={{ color: scoreModulo.cor }}>{scoreModulo.total}<span className="text-sm" style={{ color: "#5a7a9a" }}>/100</span></div>
              <div>
                <p className="text-sm font-bold capitalize" style={{ color: "#c8d8f0" }}>{idioma === "pt" ? "Score do Módulo" : idioma === "es" ? "Score del Módulo" : "Module Score"} — {
                  { excelente: { pt: "excelente", en: "excellent", es: "excelente" }, bom: { pt: "bom", en: "good", es: "bueno" }, atencao: { pt: "atenção", en: "needs attention", es: "atención" }, critico: { pt: "crítico", en: "critical", es: "crítico" } }[scoreModulo.nivel][idioma === "en" ? "en" : idioma === "es" ? "es" : "pt"]
                }</p>
                <p className="text-[11px]" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Disciplina orçamentária, anomalias, oportunidades capturadas e cobertura de atribuição." : idioma === "es" ? "Disciplina presupuestaria, anomalías, oportunidades capturadas y cobertura de asignación." : "Budget discipline, anomalies, captured opportunities and tagging coverage."}</p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {scoreModulo.dimensoes.map(d => (
                <div key={d.nome} className="text-center px-2">
                  <p className="text-sm font-black" style={{ color: d.cor }}>{d.score}</p>
                  <p className="text-[9px] max-w-[90px]" style={{ color: "#5a7a9a" }} title={d.detalhe}>{d.nome}</p>
                </div>
              ))}
            </div>
          </div>
        </CanvasBox>

        {/* Abas */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "visao", label: cc.abaVisaoGeral },
            { key: "centros", label: cc.abaCentros },
            { key: "lancamentos", label: cc.abaLancamentos },
            { key: "insights", label: "Insights" },
            { key: "causaRaiz", label: idioma === "pt" ? "Causa Raiz" : idioma === "es" ? "Causa Raíz" : "Root Cause" },
            { key: "oportunidades", label: idioma === "pt" ? "Oportunidades" : idioma === "es" ? "Oportunidades" : "Opportunities" },
            { key: "simulador", label: idioma === "pt" ? "Simulador" : idioma === "es" ? "Simulador" : "Simulator" },
            { key: "copiloto", label: idioma === "pt" ? "Copiloto" : idioma === "es" ? "Copiloto" : "Copilot" },
            { key: "acoes", label: idioma === "pt" ? "Ações" : idioma === "es" ? "Acciones" : "Actions" },
          ].map((a) => (
            <motion.button key={a.key} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setAba(a.key as typeof aba)}
              className="px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: aba === a.key ? "rgba(159,18,57,0.25)" : "rgba(10,22,40,0.8)", color: aba === a.key ? "#9f1239" : "#5a7a9a", border: `1px solid ${aba === a.key ? "rgba(159,18,57,0.5)" : "rgba(159,18,57,0.1)"}` }}>
              {a.label}
            </motion.button>
          ))}
        </div>

        {/* ===== VISÃO GERAL (orçado vs realizado + resultado/margem) ===== */}
        {aba === "visao" && (
          <div className="space-y-4">
            {centros.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => {
              const custos = getCustos(centro.id);
              const receitas = getReceitas(centro.id);
              const resultado = receitas - custos;
              const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;
              const orcado = getOrcamento(centro);
              const usoOrc = orcado > 0 ? (custos / orcado) * 100 : 0;
              const variancia = orcado - custos;
              const participacao = totalCustos > 0 ? (custos / totalCustos) * 100 : 0;
              const meta = centro.meta_receita || 0;
              const usoMeta = meta > 0 ? (receitas / meta) * 100 : 0;
              const corMeta = usoMeta >= 100 ? "#34d399" : usoMeta >= 70 ? "#6ab0ff" : "#fbbf24";
              const cor = getCor(i);
              const corOrc = usoOrc > 100 ? "#f87171" : usoOrc > 85 ? "#fbbf24" : "#34d399";
              return (
                <motion.div key={centro.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-3 h-3 rounded-full" style={{ background: cor }} />
                        <span className="font-bold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</span>
                        {centro.codigo && <span className="text-xs font-semibold" style={{ color: "#b87333" }}>{centro.codigo}</span>}
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: `${cor}20`, color: cor }}>{centro.tipo}</span>
                        {centro.responsavel && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(159,18,57,0.1)", color: "#9f1239" }}>👤 {centro.responsavel}</span>}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-black" style={{ color: resultado >= 0 ? "#34d399" : "#f87171" }}>{fmt(resultado)}</span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCentro(centro)}>
                          <Pencil size={15} style={{ color: "#9f1239" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCentro(centro.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>

                    {/* Orçado vs Realizado (por período — sobrescreve o padrão do centro se definido) */}
                    <div className="mb-3">
                      {orcamentoEditId === centro.id ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input type="number" autoFocus value={orcamentoEditValor} onChange={(e) => setOrcamentoEditValor(e.target.value)}
                            placeholder={idioma === "pt" ? "Orçamento deste mês" : idioma === "es" ? "Presupuesto de este mes" : "Budget this month"}
                            className="flex-1 px-3 py-1.5 rounded-lg text-xs focus:outline-none" style={inputStyle} />
                          <button disabled={salvandoOrcamento} onClick={async () => {
                              if (!userId) return;
                              setSalvandoOrcamento(true);
                              await definirOrcamento(userId, centro.id, periodo, parseFloat(orcamentoEditValor || "0"));
                              setSalvandoOrcamento(false); setOrcamentoEditId(null); carregarDados();
                            }} className="text-xs font-bold px-2 py-1.5 rounded-lg" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                            {idioma === "pt" ? "Salvar" : idioma === "es" ? "Guardar" : "Save"}
                          </button>
                          <button onClick={() => setOrcamentoEditId(null)} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: "#5a7a9a" }}>✕</button>
                        </div>
                      ) : orcado > 0 ? (
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#5a7a9a" }}>
                            {L.orcado}: {fmt(orcado)} · {L.realizado}: {fmt(custos)}
                            <button onClick={() => { setOrcamentoEditId(centro.id); setOrcamentoEditValor(String(orcado)); }} className="ml-1.5 underline" style={{ color: "#9f1239" }}>
                              {idioma === "pt" ? "editar" : idioma === "es" ? "editar" : "edit"}
                            </button>
                          </span>
                          <span style={{ color: corOrc, fontWeight: 700 }}>{usoOrc.toFixed(0)}%</span>
                        </div>
                      ) : (
                        <button onClick={() => { setOrcamentoEditId(centro.id); setOrcamentoEditValor(""); }} className="text-xs underline mb-1" style={{ color: "#9f1239" }}>
                          + {idioma === "pt" ? "Definir orçamento deste mês" : idioma === "es" ? "Definir presupuesto de este mes" : "Set budget this month"}
                        </button>
                      )}
                      {orcado > 0 && orcamentoEditId !== centro.id && (
                        <>
                          <div className="rounded-full h-2" style={{ background: "rgba(159,18,57,0.1)" }}>
                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usoOrc, 100)}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-2 rounded-full" style={{ background: corOrc }} />
                          </div>
                          <p className="text-xs mt-1" style={{ color: corOrc }}>
                            {variancia >= 0 ? `${fmt(variancia)} ${L.dentroOrc}` : `${fmt(Math.abs(variancia))} ${L.estourou}`}
                          </p>
                        </>
                      )}
                    </div>

                    {/* Meta vs Realizado de Receita */}
                    {meta > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span style={{ color: "#5a7a9a" }}>
                            {idioma === "pt" ? "Meta Receita" : idioma === "es" ? "Meta de Ingresos" : "Revenue Target"}: {fmt(meta)} · {L.realizado}: {fmt(receitas)}
                          </span>
                          <span style={{ color: corMeta, fontWeight: 700 }}>{usoMeta.toFixed(0)}%</span>
                        </div>
                        <div className="rounded-full h-2" style={{ background: "rgba(159,18,57,0.1)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(usoMeta, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full" style={{ background: corMeta }} />
                        </div>
                        <p className="text-xs mt-1" style={{ color: corMeta }}>
                          {usoMeta >= 100
                            ? (idioma === "pt" ? "🎯 Meta atingida!" : idioma === "es" ? "🎯 ¡Meta alcanzada!" : "🎯 Target reached!")
                            : `${fmt(meta - receitas)} ${idioma === "pt" ? "para bater a meta" : idioma === "es" ? "para alcanzar la meta" : "to reach target"}`}
                        </p>
                      </div>
                    )}

                    {/* Resultado / Margem / Participação */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2" style={{ borderTop: "1px solid rgba(159,18,57,0.1)" }}>
                      {[
                        { label: cc.receita, val: fmt(receitas), cor: "#34d399" },
                        { label: cc.custo, val: fmt(custos), cor: "#f87171" },
                        { label: L.margem, val: `${margem.toFixed(1)}%`, cor: margem >= 0 ? "#34d399" : "#f87171" },
                        { label: L.participacao, val: `${participacao.toFixed(1)}%`, cor: "#a78bfa" },
                      ].map((s) => (
                        <div key={s.label}>
                          <p className="text-xs mb-0.5" style={{ color: "#5a7a9a" }}>{s.label}</p>
                          <p className="text-sm font-bold" style={{ color: s.cor }}>{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ===== CENTROS ===== */}
        {aba === "centros" && (
          <div className="space-y-3">
            {centros.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semCentros}</p></div></CanvasBox>
            ) : centros.map((centro, i) => {
              const cor = getCor(i);
              return (
                <motion.div key={centro.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={cor}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ background: cor }} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm" style={{ color: "#c8d8f0" }}>{centro.nome}</p>
                            {centro.codigo && <span className="text-xs font-semibold" style={{ color: "#b87333" }}>{centro.codigo}</span>}
                          </div>
                          <p className="text-xs mt-0.5 capitalize" style={{ color: "#5a7a9a" }}>
                            {centro.tipo}{centro.responsavel ? ` · 👤 ${centro.responsavel}` : ""}
                            {centro.orcamento_mensal ? ` · ${idioma === "pt" ? "Orçamento" : idioma === "es" ? "Presupuesto" : "Budget"}: ${fmt(centro.orcamento_mensal)}` : ""}
                            {centro.cidade ? ` · ${centro.cidade}${centro.uf ? "/" + centro.uf : ""}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarCentro(centro)}>
                          <Pencil size={15} style={{ color: "#9f1239" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirCentro(centro.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ===== LANÇAMENTOS ===== */}
        {aba === "lancamentos" && (
          <div className="space-y-3">
            <CanvasBox cor="#3b6fd4">
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={cc.buscar}
                className="w-full text-sm focus:outline-none bg-transparent" style={{ color: "#c8d8f0" }} />
            </CanvasBox>
            {lancFiltrados.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{cc.semLancamentos}</p></div></CanvasBox>
            ) : lancFiltrados.map((lanc, i) => {
              const centro = centros.find(c => c.id === lanc.centro_custo_id);
              const idxCentro = centros.findIndex(c => c.id === lanc.centro_custo_id);
              const cor = idxCentro >= 0 ? getCor(idxCentro) : "#9f1239";
              return (
                <motion.div key={lanc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <CanvasBox cor={lanc.tipo === "receita" ? "#34d399" : "#f87171"}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cor }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#c8d8f0" }}>{lanc.descricao}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#5a7a9a" }}>{centro?.nome || (idioma === "pt" ? "Sem centro" : idioma === "es" ? "Sin centro" : "No center")} · {new Date(lanc.data + "T00:00:00").toLocaleDateString("pt-BR")}{lanc.categoria ? ` · ${lanc.categoria}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-bold" style={{ color: lanc.tipo === "receita" ? "#34d399" : "#f87171" }}>
                          {lanc.tipo === "receita" ? "+" : "-"}{fmt(lanc.valor)}
                        </span>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEditarLancamento(lanc)}>
                          <Pencil size={15} style={{ color: "#9f1239" }} />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluirLancamento(lanc.id)}>
                          <Trash2 size={15} style={{ color: "#f87171" }} />
                        </motion.button>
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ===== INSIGHTS (Escopo F — Central de Insights) ===== */}
        {aba === "insights" && (
          <div className="space-y-4">
            <CanvasBox cor="#34d399">
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Economia Potencial Total" : idioma === "es" ? "Ahorro Potencial Total" : "Total Potential Savings"}</p>
              <p className="text-2xl font-black" style={{ color: "#34d399" }}>{fmt(insights.economiaPotencialTotal)}</p>
            </CanvasBox>
            {[
              { titulo: idioma === "pt" ? "5 Maiores Riscos" : idioma === "es" ? "5 Mayores Riesgos" : "Top 5 Risks", cor: "#f87171", itens: insights.maioresRiscos.map(i => ({ id: i.id, titulo: i.titulo, sub: `${i.urgencia} · ${fmt(i.impacto)}` })) },
              { titulo: idioma === "pt" ? "5 Maiores Oportunidades" : idioma === "es" ? "5 Mayores Oportunidades" : "Top 5 Opportunities", cor: "#34d399", itens: insights.maioresOportunidades.map(o => ({ id: o.id, titulo: o.titulo, sub: fmt(o.economiaEstimada) })) },
              { titulo: idioma === "pt" ? "5 Maiores Desperdícios" : idioma === "es" ? "5 Mayores Desperdicios" : "Top 5 Waste", cor: "#fbbf24", itens: insights.maioresDesperdicios.map(o => ({ id: o.id, titulo: o.titulo, sub: fmt(o.economiaEstimada) })) },
              { titulo: idioma === "pt" ? "5 Melhores Resultados" : idioma === "es" ? "5 Mejores Resultados" : "Top 5 Results", cor: "#6ab0ff", itens: insights.melhoresResultados.map(r => ({ id: r.centroId, titulo: r.centroNome, sub: fmt(r.resultado) })) },
            ].map(bloco => (
              <CanvasBox key={bloco.titulo} cor={bloco.cor}>
                <p className="text-sm font-bold mb-2" style={{ color: bloco.cor }}>{bloco.titulo}</p>
                {bloco.itens.length === 0 ? <p className="text-xs" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nada encontrado nos dados atuais." : idioma === "es" ? "No se encontró nada en los datos actuales." : "Nothing found in the current data."}</p> : (
                  <div className="space-y-1.5">
                    {bloco.itens.map((it, i) => (
                      <div key={it.id + i} className="flex justify-between text-xs gap-2">
                        <span className="truncate" style={{ color: "#c8d8f0" }}>{it.titulo}</span>
                        <span className="flex-shrink-0" style={{ color: bloco.cor }}>{it.sub}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CanvasBox>
            ))}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { titulo: idioma === "pt" ? "Prioridades da Semana" : idioma === "es" ? "Prioridades de la Semana" : "This Week", itens: insights.prioridadesSemana },
                { titulo: idioma === "pt" ? "Prioridades do Mês" : idioma === "es" ? "Prioridades del Mes" : "This Month", itens: insights.prioridadesMes },
              ].map(bloco => (
                <CanvasBox key={bloco.titulo} cor="#a78bfa">
                  <p className="text-sm font-bold mb-2" style={{ color: "#a78bfa" }}>{bloco.titulo}</p>
                  {bloco.itens.length === 0 ? <p className="text-xs" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhuma prioridade urgente agora." : idioma === "es" ? "Ninguna prioridad urgente por ahora." : "No urgent priority now."}</p> : (
                    <div className="space-y-1.5">
                      {bloco.itens.map((it, i) => <p key={it.id + i} className="text-xs truncate" style={{ color: "#c8d8f0" }}>• {it.titulo}</p>)}
                    </div>
                  )}
                </CanvasBox>
              ))}
            </div>
          </div>
        )}

        {/* ===== CAUSA RAIZ (Escopo A) ===== */}
        {aba === "causaRaiz" && (
          <div className="space-y-3">
            {causaRaiz.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhum aumento fora do padrão detectado nos dados atuais." : idioma === "es" ? "No se detectó ningún aumento fuera de lo normal en los datos actuales." : "No out-of-pattern increase detected."}</p></div></CanvasBox>
            ) : causaRaiz.map((c) => (
              <CanvasBox key={c.id} cor="#f87171">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>{c.tipo === "acima_media" ? (idioma === "pt" ? "Acima da média" : idioma === "es" ? "Por encima del promedio" : "Above average") : (idioma === "pt" ? "Aumento recorrente" : idioma === "es" ? "Aumento recurrente" : "Recurring increase")}</span>
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>{c.centroNome}{c.fornecedorNome ? ` · ${c.fornecedorNome}` : ""}</span>
                    </div>
                    <p className="text-sm" style={{ color: "#c8d8f0" }}>{c.explicacao}</p>
                    <p className="text-[11px] mt-1" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Quando" : idioma === "es" ? "Cuándo" : "When"}: {c.quando ? new Date(c.quando + "T00:00:00").toLocaleDateString("pt-BR") : "-"} · {c.autor}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="text-sm font-black" style={{ color: "#f87171" }}>{fmt(c.impacto)}</span>
                    <button onClick={() => abrirPlanoDeAcao("causa_raiz", c.id, c.centroId, `Investigar: ${c.descricao}`, c.impacto, c.explicacao)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                      {idioma === "pt" ? "Gerar plano de ação" : idioma === "es" ? "Generar plan de acción" : "Create action plan"}
                    </button>
                  </div>
                </div>
              </CanvasBox>
            ))}
          </div>
        )}

        {/* ===== OPORTUNIDADES (Escopo B + C + E) ===== */}
        {aba === "oportunidades" && (
          <div className="space-y-3">
            {reforecast.length > 0 && (
              <CanvasBox cor="#fbbf24">
                <p className="text-sm font-bold mb-2" style={{ color: "#fbbf24" }}>{idioma === "pt" ? "Orçamento Vivo — Projeção de Fechamento" : idioma === "es" ? "Presupuesto Vivo — Proyección de Cierre" : "Live Budget — Closing Projection"}</p>
                <div className="space-y-1.5">
                  {reforecast.map(r => (
                    <div key={r.centroId} className="flex justify-between text-xs gap-2">
                      <span style={{ color: "#c8d8f0" }}>{r.centroNome}</span>
                      <span style={{ color: r.status === "estouro" ? "#f87171" : r.status === "atencao" ? "#fbbf24" : "#34d399" }}>
                        {idioma === "pt" ? "projeta" : idioma === "es" ? "proyecta" : "projects"} {fmt(r.projecaoFechamento)} {idioma === "pt" ? "vs orçado" : idioma === "es" ? "vs presupuestado" : "vs budget"} {fmt(r.orcado)} ({r.desvioPct >= 0 ? "+" : ""}{r.desvioPct.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
                {!periodoEhMesAtual && <p className="text-[10px] mt-2" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Período selecionado não é o mês corrente — mostrando o realizado do mês, não uma projeção." : idioma === "es" ? "El período seleccionado no es el mes actual — mostrando lo realizado, no una proyección." : "Selected period isn't the current month — showing the actual, not a projection."}</p>}
              </CanvasBox>
            )}
            {oportunidades.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhuma oportunidade identificada nos dados atuais." : idioma === "es" ? "Ninguna oportunidad identificada en los datos actuales." : "No opportunity identified."}</p></div></CanvasBox>
            ) : oportunidades.map((o) => (
              <CanvasBox key={o.id} cor="#34d399">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{o.titulo}</p>
                    <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{o.descricao}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {o.economiaEstimada > 0 && <span className="text-sm font-black" style={{ color: "#34d399" }}>{fmt(o.economiaEstimada)}</span>}
                    <button onClick={() => abrirPlanoDeAcao("oportunidade", o.id, o.centroId, o.titulo, o.economiaEstimada, o.descricao)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                      {idioma === "pt" ? "Gerar plano de ação" : idioma === "es" ? "Generar plan de acción" : "Create action plan"}
                    </button>
                  </div>
                </div>
              </CanvasBox>
            ))}
          </div>
        )}

        {/* ===== SIMULADOR (Escopo D — cenários com efeito cascata + Mapa de Impacto) ===== */}
        {aba === "simulador" && (
          <div className="space-y-4">
            <CanvasBox cor="#a78bfa">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Cenário" : idioma === "es" ? "Escenario" : "Scenario"}</label>
                  <select value={simTipo} onChange={(e) => setSimTipo(e.target.value as TipoCenarioExecutivo)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={selectStyle}>
                    <option value="reduzir_custos">{idioma === "pt" ? "Reduzir custos" : idioma === "es" ? "Reducir costos" : "Reduce costs"}</option>
                    <option value="expandir_equipe">{idioma === "pt" ? "Expandir equipe" : idioma === "es" ? "Expandir equipo" : "Expand team"}</option>
                    <option value="abrir_filial">{idioma === "pt" ? "Abrir filial" : idioma === "es" ? "Abrir sucursal" : "Open branch"}</option>
                    <option value="encerrar_centro">{idioma === "pt" ? "Encerrar centro/projeto" : idioma === "es" ? "Cerrar centro/proyecto" : "Close center/project"}</option>
                    <option value="trocar_fornecedor">{idioma === "pt" ? "Trocar fornecedor" : idioma === "es" ? "Cambiar proveedor" : "Switch supplier"}</option>
                    <option value="alterar_precos">{idioma === "pt" ? "Alterar preços" : idioma === "es" ? "Cambiar precios" : "Change prices"}</option>
                    <option value="renegociar_contratos">{idioma === "pt" ? "Renegociar contratos" : idioma === "es" ? "Renegociar contratos" : "Renegotiate contracts"}</option>
                    <option value="variar_inflacao">{idioma === "pt" ? "Variar inflação" : idioma === "es" ? "Variar inflación" : "Inflation shift"}</option>
                    <option value="variar_cambio">{idioma === "pt" ? "Variar câmbio" : idioma === "es" ? "Variar tipo de cambio" : "FX shift"}</option>
                  </select>
                </div>
                {simTipo === "encerrar_centro" ? (
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Centro" : idioma === "es" ? "Centro" : "Center"}</label>
                    <select value={simCentroId} onChange={(e) => setSimCentroId(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={selectStyle}>
                      <option value="">-- {idioma === "pt" ? "Selecione" : idioma === "es" ? "Seleccione" : "Select"} --</option>
                      {centros.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Percentual (%)" : idioma === "es" ? "Porcentaje (%)" : "Percent (%)"}</label>
                    <input type="number" value={simValorPct} onChange={(e) => setSimValorPct(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Horizonte (meses)" : idioma === "es" ? "Horizonte (meses)" : "Horizon (months)"}</label>
                  <input type="number" value={simHorizonte} onChange={(e) => setSimHorizonte(e.target.value)} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div className="flex items-end">
                  <p className="text-[10px]" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Recalcula automaticamente com base nos dados reais de Receitas, Custos Fixos e Custos Variáveis do período." : idioma === "es" ? "Recalcula automáticamente con base en los datos reales de Ingresos, Costos Fijos y Costos Variables del período." : "Recalculates automatically from real Revenue, Fixed and Variable Costs of the period."}</p>
                </div>
              </div>
            </CanvasBox>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {resultadosSim.map(r => (
                <CanvasBox key={r.nome} cor={r.nome === "base" ? "#a78bfa" : r.nome === "otimista" ? "#34d399" : r.nome === "adverso" ? "#f87171" : "#6ab0ff"}>
                  <p className="text-xs font-black uppercase tracking-wider mb-2 capitalize" style={{ color: r.nome === "base" ? "#a78bfa" : r.nome === "otimista" ? "#34d399" : r.nome === "adverso" ? "#f87171" : "#6ab0ff" }}>{r.nome}</p>
                  {[
                    { l: idioma === "pt" ? "Receita" : idioma === "es" ? "Ingreso" : "Revenue", v: fmt(r.receitaMensal) },
                    { l: "EBITDA", v: fmt(r.ebitdaMensal) },
                    { l: idioma === "pt" ? "Lucro Líquido" : idioma === "es" ? "Utilidad Neta" : "Net Profit", v: fmt(r.lucroLiquidoMensal) },
                    { l: idioma === "pt" ? "Margem" : idioma === "es" ? "Margen" : "Margin", v: `${r.margemPct.toFixed(1)}%` },
                    { l: idioma === "pt" ? "Capital de Giro" : idioma === "es" ? "Capital de Trabajo" : "Working Capital", v: fmt(r.capitalGiroProjetado) },
                    { l: idioma === "pt" ? "Caixa Projetado" : idioma === "es" ? "Caja Proyectada" : "Projected Cash", v: fmt(r.saldoCaixaProjetado) },
                  ].map(m => (
                    <div key={m.l} className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#5a7a9a" }}>{m.l}</span>
                      <span style={{ color: "#c8d8f0" }}>{m.v}</span>
                    </div>
                  ))}
                </CanvasBox>
              ))}
            </div>

            <CanvasBox cor="#9f1239">
              <p className="text-sm font-bold mb-2" style={{ color: "#9f1239" }}>{idioma === "pt" ? "Mapa de Impacto (cenário base)" : idioma === "es" ? "Mapa de Impacto (escenario base)" : "Impact Map (base scenario)"}</p>
              <ReactECharts option={optMapaImpacto} style={{ height: 280, width: "100%" }} notMerge lazyUpdate />
            </CanvasBox>
          </div>
        )}

        {/* ===== COPILOTO (Escopo G) ===== */}
        {aba === "copiloto" && (
          <CanvasBox cor="#a78bfa">
            <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto">
              {chatMensagens.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm" style={{ background: m.role === "user" ? "rgba(159,18,57,0.15)" : "rgba(167,139,250,0.1)", color: "#c8d8f0" }}>
                    {m.texto}
                  </div>
                </div>
              ))}
              {chatCarregando && <p className="text-xs" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Pensando..." : idioma === "es" ? "Pensando..." : "Thinking..."}</p>}
            </div>
            <div className="flex gap-2">
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") enviarMensagemCopiloto(chatInput); }}
                placeholder={idioma === "pt" ? "Pergunte sobre seus centros de custo..." : idioma === "es" ? "Pregunte sobre sus centros de costo..." : "Ask about your cost centers..."}
                className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none" style={inputStyle} />
              <button onClick={() => enviarMensagemCopiloto(chatInput)} disabled={chatCarregando}
                className="px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-50" style={{ background: "linear-gradient(135deg, #5b21b6, #8b5cf6)", color: "#fff" }}>
                {idioma === "pt" ? "Enviar" : idioma === "es" ? "Enviar" : "Send"}
              </button>
            </div>
          </CanvasBox>
        )}

        {/* ===== PLANOS DE AÇÃO (Escopo H) ===== */}
        {aba === "acoes" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => abrirPlanoDeAcao("manual")} className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ background: "rgba(52,211,153,0.15)", color: "#34d399" }}>
                + {idioma === "pt" ? "Novo Plano" : idioma === "es" ? "Nuevo Plan" : "New Plan"}
              </button>
            </div>
            {planosAcao.length === 0 ? (
              <CanvasBox cor="#9f1239"><div className="py-12 text-center"><p style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Nenhum plano de ação criado ainda." : idioma === "es" ? "Ningún plan de acción creado todavía." : "No action plan yet."}</p></div></CanvasBox>
            ) : planosAcao.map(p => {
              const corStatus = p.status === "concluido" ? "#34d399" : p.status === "cancelado" ? "#5a7a9a" : p.status === "em_andamento" ? "#9f1239" : "#fbbf24";
              return (
                <CanvasBox key={p.id} cor={corStatus}>
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold capitalize" style={{ background: `${corStatus}20`, color: corStatus }}>
                          {{ pendente: { pt: "Pendente", en: "Pending", es: "Pendiente" }, em_andamento: { pt: "Em andamento", en: "In progress", es: "En curso" }, concluido: { pt: "Concluído", en: "Done", es: "Concluido" }, cancelado: { pt: "Cancelado", en: "Cancelled", es: "Cancelado" } }[p.status][idioma === "en" ? "en" : idioma === "es" ? "es" : "pt"]}
                        </span>
                        <p className="text-sm font-semibold" style={{ color: "#c8d8f0" }}>{p.titulo}</p>
                      </div>
                      {p.objetivo && <p className="text-xs mt-1" style={{ color: "#5a7a9a" }}>{p.objetivo}</p>}
                      {p.tarefas && p.tarefas.length > 0 && (
                        <ul className="text-xs mt-1 list-disc list-inside" style={{ color: "#5a7a9a" }}>
                          {p.tarefas.map((tf, i) => <li key={i}>{tf}</li>)}
                        </ul>
                      )}
                      <p className="text-[11px] mt-1" style={{ color: "#5a7a9a" }}>
                        {p.responsavel ? `${idioma === "pt" ? "Responsável" : idioma === "es" ? "Responsable" : "Owner"}: ${p.responsavel} · ` : ""}
                        {p.prazo ? `${idioma === "pt" ? "Prazo" : idioma === "es" ? "Plazo" : "Due"}: ${new Date(p.prazo + "T00:00:00").toLocaleDateString("pt-BR")} · ` : ""}
                        {p.economia_estimada ? `${idioma === "pt" ? "Economia" : idioma === "es" ? "Ahorro" : "Savings"}: ${fmt(p.economia_estimada)}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={p.status} onChange={(e) => mudarStatusPlano(p.id, e.target.value as PlanoAcao["status"])} className="text-xs px-2 py-1.5 rounded-lg focus:outline-none" style={selectStyle}>
                        <option value="pendente">{idioma === "pt" ? "Pendente" : idioma === "es" ? "Pendiente" : "Pending"}</option>
                        <option value="em_andamento">{idioma === "pt" ? "Em andamento" : idioma === "es" ? "En curso" : "In progress"}</option>
                        <option value="concluido">{idioma === "pt" ? "Concluído" : idioma === "es" ? "Concluido" : "Done"}</option>
                        <option value="cancelado">{idioma === "pt" ? "Cancelado" : idioma === "es" ? "Cancelado" : "Cancelled"}</option>
                      </select>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicaoPlano(p)}><Pencil size={15} style={{ color: "#9f1239" }} /></motion.button>
                      <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => removerPlano(p.id)}><Trash2 size={15} style={{ color: "#f87171" }} /></motion.button>
                    </div>
                  </div>
                </CanvasBox>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Centro */}
      <ModalPremium aberto={modalCentro} onFechar={fecharModalCentro} titulo={editandoCentro ? cc.editarCentro : cc.novoCentro} cor="#9f1239">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.nomeCentro}</label>
            <input value={nomeCentro} onChange={(e) => setNomeCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Código" : idioma === "es" ? "Código" : "Code"}</label>
              <input value={codigoCentro} onChange={(e) => setCodigoCentro(e.target.value)} placeholder="CC-001" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{L.responsavel}</label>
              <input value={responsavelCentro} onChange={(e) => setResponsavelCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {["operacional", "administrativo", "comercial", "financeiro"].map(tp => (
                <motion.button key={tp} whileTap={{ scale: 0.97 }} onClick={() => setTipoCentro(tp)}
                  className="py-2 rounded-xl text-xs font-semibold capitalize"
                  style={{ background: tipoCentro === tp ? "rgba(159,18,57,0.2)" : "rgba(159,18,57,0.05)", color: tipoCentro === tp ? "#9f1239" : "#5a7a9a", border: `1px solid ${tipoCentro === tp ? "rgba(159,18,57,0.4)" : "rgba(159,18,57,0.1)"}` }}>
                  {tp}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Orçamento Mensal (R$)" : idioma === "es" ? "Presupuesto Mensual (R$)" : "Monthly Budget (R$)"}</label>
              <input type="number" value={orcamentoCentro} onChange={(e) => setOrcamentoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Meta Receita (R$)" : idioma === "es" ? "Meta de Ingresos (R$)" : "Revenue Target (R$)"}</label>
              <input type="number" value={metaCentro} onChange={(e) => setMetaCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.descricaoCentro}</label>
            <input value={descricaoCentro} onChange={(e) => setDescricaoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>

          <div className="pt-2" style={{ borderTop: "1px solid rgba(159,18,57,0.1)" }}>
            <p className="text-xs font-black uppercase tracking-wider mb-3 mt-3" style={{ color: "#5a7a9a" }}>
              {idioma === "pt" ? "Cadastro (opcional)" : idioma === "es" ? "Registro (opcional)" : "Registration (optional)"}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Tipo" : idioma === "es" ? "Tipo" : "Type"}</label>
                <div className="flex gap-2">
                  {["PJ", "PF"].map(tp => (
                    <button key={tp} onClick={() => setTipoPessoaCentro(tp)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                      style={{ background: tipoPessoaCentro === tp ? "rgba(159,18,57,0.2)" : "rgba(159,18,57,0.05)", color: tipoPessoaCentro === tp ? "#9f1239" : "#5a7a9a", border: `1px solid ${tipoPessoaCentro === tp ? "rgba(159,18,57,0.4)" : "rgba(159,18,57,0.1)"}` }}>
                      {tp === "PJ" ? (idioma === "pt" ? "Jurídica" : idioma === "es" ? "Jurídica" : "Company") : (idioma === "pt" ? "Física" : idioma === "es" ? "Física" : "Individual")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{tipoPessoaCentro === "PF" ? "CPF" : "CNPJ"}</label>
                <input value={documentoCentro} onChange={(e) => setDocumentoCentro(tipoPessoaCentro === "PF" ? formatarCPF(e.target.value) : formatarCNPJ(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
                {erroDocCentro && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{erroDocCentro}</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>CEP</label>
                <input value={cepCentro} onChange={(e) => buscarCepCentro(formatarCEP(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} placeholder={buscandoCep ? "..." : ""} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Endereço" : idioma === "es" ? "Dirección" : "Address"}</label>
                <input value={enderecoCentro} onChange={(e) => setEnderecoCentro(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <input value={numeroCentro} onChange={(e) => setNumeroCentro(e.target.value)} placeholder={idioma === "pt" ? "Número" : idioma === "es" ? "Número" : "Number"} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              <input value={complementoCentro} onChange={(e) => setComplementoCentro(e.target.value)} placeholder={idioma === "pt" ? "Compl." : idioma === "es" ? "Compl." : "Compl."} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              <input value={bairroCentro} onChange={(e) => setBairroCentro(e.target.value)} placeholder={idioma === "pt" ? "Bairro" : idioma === "es" ? "Barrio" : "District"} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              <input value={cidadeCentro} onChange={(e) => setCidadeCentro(e.target.value)} placeholder={idioma === "pt" ? "Cidade" : idioma === "es" ? "Ciudad" : "City"} className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <input value={ufCentro} onChange={(e) => setUfCentro(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF" className="px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              <div>
                <input type="number" value={headcountCentro} onChange={(e) => setHeadcountCentro(e.target.value)} placeholder="Headcount" className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              </div>
              <div>
                <input type="number" value={areaCentro} onChange={(e) => setAreaCentro(e.target.value)} placeholder={idioma === "pt" ? "Área (m²)" : idioma === "es" ? "Área (m²)" : "Area (m²)"} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
              </div>
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#5a7a9a" }}>
              {idioma === "pt" ? "Headcount e área servem de base para o rateio automático (\"Ratear Custo\")." : idioma === "es" ? "Headcount y área sirven de base para el reparto automático (\"Distribuir Costo\")." : "Headcount and area feed the automatic cost allocation (\"Allocate Cost\")."}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalCentro} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(159,18,57,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCentro} disabled={salvandoCentro}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1a3a8f, #2a5fd4)", color: "#fff" }}>
              {salvandoCentro ? "..." : cc.salvarCentro}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Lançamento */}
      <ModalPremium aberto={modalLancamento} onFechar={fecharModalLancamento} titulo={editandoLanc ? (idioma === "pt" ? "Editar Lançamento" : idioma === "es" ? "Editar Movimiento" : "Edit Entry") : cc.novoLancamento} cor="#34d399">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.descricao}</label>
            <input value={descricaoLanc} onChange={(e) => setDescricaoLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.valor}</label>
            <input type="number" value={valorLanc} onChange={(e) => setValorLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.tipo}</label>
            <div className="flex gap-2">
              {["custo", "receita"].map((tipo) => (
                <motion.button key={tipo} whileTap={{ scale: 0.97 }} onClick={() => setTipoLanc(tipo)} className="flex-1 py-2 rounded-xl text-sm font-semibold"
                  style={{ background: tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)") : "rgba(159,18,57,0.05)", color: tipoLanc === tipo ? (tipo === "custo" ? "#f87171" : "#34d399") : "#5a7a9a", border: `1px solid ${tipoLanc === tipo ? (tipo === "custo" ? "rgba(248,113,113,0.3)" : "rgba(52,211,153,0.3)") : "rgba(159,18,57,0.1)"}` }}>
                  {tipo === "custo" ? cc.custo : cc.receita}
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{t.geral.data}</label>
            <input type="date" value={dataLanc} onChange={(e) => setDataLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{cc.centroCusto} <span style={{ color: "#5a7a9a" }}>(opcional)</span></label>
            <select value={centroLanc} onChange={(e) => setCentroLanc(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={selectStyle}>
              <option value="">-- {idioma === "pt" ? "Sem centro" : idioma === "es" ? "Sin centro" : "No center"} --</option>
              {centros.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>Categoria <span style={{ color: "#5a7a9a" }}>(opcional)</span></label>
            <input value={categoriaLanc} onChange={(e) => setCategoriaLanc(e.target.value)} placeholder="Ex: Marketing, RH, TI..." className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={fecharModalLancamento} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(159,18,57,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarLancamento} disabled={salvandoLanc}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
              {salvandoLanc ? "..." : cc.salvarLancamento}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Rateio */}
      <ModalPremium aberto={modalRateio} onFechar={() => setModalRateio(false)} titulo={L.rateio} cor="#a78bfa">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: "#5a7a9a" }}>
            {idioma === "pt" ? "Escolha um lançamento já existente (ex: aluguel em Custos Fixos) e divida o mesmo valor entre vários centros por % — não cria um custo novo, só reparte o que já existe." : idioma === "es" ? "Elija un movimiento ya existente (ej: alquiler en Costos Fijos) y divida el mismo valor entre varios centros por % — no crea un costo nuevo, solo reparte lo que ya existe." : "Pick an existing entry and split its value across centers by % — doesn't create a new cost, only reallocates the existing one."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Onde está o lançamento" : idioma === "es" ? "Dónde está el movimiento" : "Source"}</label>
              <select value={rateioTabela} onChange={(e) => { setRateioTabela(e.target.value as OrigemTabela); setRateioOrigemId(""); setRateioPercentuais({}); }} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={selectStyle}>
                {(Object.keys(LABEL_ORIGEM) as OrigemTabela[]).map(k => <option key={k} value={k}>{LABEL_ORIGEM[k][langF2]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Lançamento" : idioma === "es" ? "Movimiento" : "Entry"}</label>
              <select value={rateioOrigemId} onChange={(e) => { setRateioOrigemId(e.target.value); setRateioPercentuais({}); }} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={selectStyle}>
                <option value="">-- {idioma === "pt" ? "Selecione" : idioma === "es" ? "Seleccione" : "Select"} --</option>
                {opcoesRateio.map(o => <option key={o.id} value={o.id}>{o.descricao} — {fmt(o.valor)}</option>)}
              </select>
            </div>
          </div>
          {rateioExistente.length > 0 && (
            <div className="rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)" }}>
              <p className="text-xs mb-1" style={{ color: "#fbbf24" }}>{idioma === "pt" ? "Já rateado:" : idioma === "es" ? "Ya distribuido:" : "Already allocated:"} {rateioExistente.map(r => `${centros.find(c => c.id === r.centro_custo_id)?.nome || "?"} (${r.percentual}%)`).join(", ")}</p>
              <button onClick={excluirRateioAtual} className="text-xs underline" style={{ color: "#f87171" }}>{idioma === "pt" ? "Remover rateio atual" : idioma === "es" ? "Eliminar distribución actual" : "Remove current allocation"}</button>
            </div>
          )}
          {origemSelecionada && (
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                <label className="text-xs font-semibold block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Distribuição (%)" : idioma === "es" ? "Distribución (%)" : "Distribution (%)"}</label>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={distribuirIgualmente} className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>
                    {idioma === "pt" ? "Igualmente" : idioma === "es" ? "Equitativamente" : "Equally"}
                  </button>
                  <button onClick={() => distribuirPorBase("headcount")} className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(159,18,57,0.15)", color: "#9f1239", border: "1px solid rgba(159,18,57,0.3)" }}>
                    {idioma === "pt" ? "Por headcount" : idioma === "es" ? "Por headcount" : "By headcount"}
                  </button>
                  <button onClick={() => distribuirPorBase("area")} className="text-xs font-semibold px-2 py-1 rounded-lg"
                    style={{ background: "rgba(52,211,153,0.15)", color: "#34d399", border: "1px solid rgba(52,211,153,0.3)" }}>
                    {idioma === "pt" ? "Por área (m²)" : idioma === "es" ? "Por área (m²)" : "By area (m²)"}
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {centros.length === 0 ? (
                  <p className="text-xs" style={{ color: "#5a7a9a" }}>{cc.semCentros}</p>
                ) : centros.map((c, i) => {
                  const pctStr = rateioPercentuais[c.id] || "";
                  const pct = parseFloat(pctStr || "0");
                  const valorCentro = (origemSelecionada.valor * pct) / 100;
                  return (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: getCor(i) }} />
                      <span className="text-xs flex-1 truncate" style={{ color: "#c8d8f0" }}>{c.nome}</span>
                      {pct > 0 && <span className="text-xs" style={{ color: "#34d399" }}>{fmt(valorCentro)}</span>}
                      <input type="number" value={pctStr} onChange={(e) => setRateioPercentuais({ ...rateioPercentuais, [c.id]: e.target.value })}
                        placeholder="0" className="w-16 px-2 py-1.5 rounded-lg text-xs text-right focus:outline-none" style={inputStyle} />
                      <span className="text-xs" style={{ color: "#5a7a9a" }}>%</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center px-3 py-2 rounded-xl mt-2" style={{ background: Math.abs(restanteRateio) < 0.5 ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)" }}>
                <span className="text-xs" style={{ color: "#5a7a9a" }}>{idioma === "pt" ? "Total distribuído" : idioma === "es" ? "Total distribuido" : "Distributed"}: {somaPercentuais.toFixed(1)}%</span>
                <span className="text-xs font-bold" style={{ color: Math.abs(restanteRateio) < 0.5 ? "#34d399" : "#fbbf24" }}>
                  {idioma === "pt" ? "Restante" : idioma === "es" ? "Restante" : "Remaining"}: {restanteRateio.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalRateio(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(159,18,57,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmarRateio}
              disabled={processandoRateio || !origemSelecionada || Math.abs(restanteRateio) > 0.5}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5b21b6, #8b5cf6)", color: "#fff" }}>
              {processandoRateio ? "..." : (idioma === "pt" ? "Aplicar Rateio" : idioma === "es" ? "Aplicar Distribución" : "Apply")}
            </motion.button>
          </div>
        </div>
      </ModalPremium>

      {/* Modal Plano de Ação (Escopo H) */}
      <ModalPremium aberto={modalPlano} onFechar={() => setModalPlano(false)} titulo={editandoPlanoId ? (idioma === "pt" ? "Editar Plano de Ação" : idioma === "es" ? "Editar Plan de Acción" : "Edit Action Plan") : (idioma === "pt" ? "Novo Plano de Ação" : idioma === "es" ? "Nuevo Plan de Acción" : "New Action Plan")} cor="#a78bfa">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Título / Objetivo" : idioma === "es" ? "Título / Objetivo" : "Title / Goal"}</label>
            <input value={planoTitulo} onChange={(e) => setPlanoTitulo(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Objetivo detalhado" : idioma === "es" ? "Objetivo detallado" : "Detailed goal"}</label>
            <textarea value={planoObjetivo} onChange={(e) => setPlanoObjetivo(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Tarefas (uma por linha)" : idioma === "es" ? "Tareas (una por línea)" : "Tasks (one per line)"}</label>
            <textarea value={planoTarefas} onChange={(e) => setPlanoTarefas(e.target.value)} rows={3} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Responsável" : idioma === "es" ? "Responsable" : "Owner"}</label>
              <input value={planoResponsavel} onChange={(e) => setPlanoResponsavel(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Prazo" : idioma === "es" ? "Fecha límite" : "Due date"}</label>
              <input type="date" value={planoPrazo} onChange={(e) => setPlanoPrazo(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Impacto esperado" : idioma === "es" ? "Impacto esperado" : "Expected impact"}</label>
            <input value={planoImpacto} onChange={(e) => setPlanoImpacto(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-2 block" style={{ color: "#5a8fd4" }}>{idioma === "pt" ? "Economia estimada (R$)" : idioma === "es" ? "Ahorro estimado (R$)" : "Estimated savings (R$)"}</label>
            <input type="number" value={planoEconomia} onChange={(e) => setPlanoEconomia(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm" style={inputStyle} />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalPlano(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(159,18,57,0.1)", color: "#5a7a9a" }}>{t.geral.cancelar}</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarPlano} disabled={salvandoPlano || !planoTitulo.trim()}
              className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #5b21b6, #8b5cf6)", color: "#fff" }}>
              {salvandoPlano ? "..." : (idioma === "pt" ? "Salvar Plano" : idioma === "es" ? "Guardar Plan" : "Save Plan")}
            </motion.button>
          </div>
        </div>
      </ModalPremium>
    </ModuloLayout>
  );

  // ---------- PDF ----------
  function exportarPDF() {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: cc.titulo,
        subtitulo: `${cc.subtitulo} · ${L.periodo}: ${periodo}`,
        colunas: [
          { header: "Centro", key: "centro", width: 3 },
          { header: "Tipo", key: "tipo", width: 2 },
          { header: L.orcado + " (R$)", key: "orcado", width: 2, align: "right" },
          { header: L.realizado + " (R$)", key: "real", width: 2, align: "right" },
          { header: L.variancia + " (R$)", key: "var", width: 2, align: "right" },
          { header: cc.receita + " (R$)", key: "rec", width: 2, align: "right" },
          { header: L.resultado + " (R$)", key: "res", width: 2, align: "right" },
          { header: L.margem, key: "margem", width: 2, align: "right" },
        ],
        linhas: centros.map((c) => {
          const custos = getCustos(c.id);
          const receitas = getReceitas(c.id);
          const resultado = receitas - custos;
          const margem = receitas > 0 ? (resultado / receitas) * 100 : 0;
          const orcado = c.orcamento_mensal || 0;
          return {
            centro: c.nome, tipo: c.tipo,
            orcado: fmtN(orcado), real: fmtN(custos), var: fmtN(orcado - custos),
            rec: fmtN(receitas), res: fmtN(resultado), margem: `${margem.toFixed(1)}%`,
          };
        }),
        resumo: [
          { label: L.orcado + " Total", valor: `R$ ${fmtN(totalOrcado)}` },
          { label: L.realizado + " (Custos)", valor: `R$ ${fmtN(totalCustos)}` },
          { label: cc.receita, valor: `R$ ${fmtN(totalReceitas)}` },
          { label: L.resultado + " Geral", valor: `R$ ${fmtN(resultadoGeral)}` },
        ],
        nomeArquivo: `axioma-centros-custo-${periodo}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  }
}