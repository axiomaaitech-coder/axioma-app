"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, Pencil, Trash2, X, Share2, Sparkles, Zap, ShieldAlert, MessageSquareText } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { AnimatedNumber } from "../../../components/AnimatedNumber";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { tratarFalhaExportacao } from "../../../lib/erroUiHelpers";
import { lerTodas } from "../../../lib/lerTodas";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import Paginacao, { usePagina } from "../../../components/Paginacao";
import {
  fBRL, fBRL2, fPct, fK, CORES, corTema, serieRolling, serieSemanal, optLinhaMulti,
  resolverPeriodo, periodoAnterior, filtrarPorPeriodo, compararPeriodos,
  detectarRupturaCaixa, desvioMedioPrevistoRealizado, projecaoSaldoComCenarios,
  proximaOcorrenciaDoDia, projetarRecorrenciaMensal, FONTE_EXEC,
  type Lancamento, type Periodo, type PeriodoPreset, type ComparativoPeriodo, type EventoCaixa, irParaDestino } from "../../../lib/cfoCore";
import { cfoT, montarNarrativaVariacao, montarNarrativaRuptura } from "../../../lib/cfoTextos";
import { CentroCompartilhamento } from "../../../components/CentroCompartilhamento";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";
import { useThemeAxioma } from "../../../lib/ThemeContext";
import { ThemeToggle } from "../../../components/ThemeToggle";
import AvisoAxioma from "../../../components/AvisoAxioma";
import { hojeISO } from "../../../lib/datas";

const PAINEL_ESCURO_FUNDO = "linear-gradient(160deg, rgba(16,32,58,0.92), rgba(10,22,40,0.96))";
const PAINEL_ESCURO_FUNDO_B = "linear-gradient(160deg, rgba(16,32,58,0.95), rgba(10,22,40,0.98))";
// Creme #f6f7c4 — valor final aprovado no rollout do Painel MEI, nunca
// escurecer/saturar mais (ver memória do rollout Claro).
const PAINEL_CLARO_FUNDO = "#f6f7c4";
// Alerta de ruptura de caixa é risco real (regra 4, exceção de alerta) —
// mantém o tingimento vermelho de aviso, nunca vira creme neutro.
const RUPTURA_PAINEL_ESCURO = "linear-gradient(160deg, rgba(60,10,10,0.7), rgba(10,22,40,0.95))";
const RUPTURA_PAINEL_CLARO = "linear-gradient(160deg, #fdecec, #f7f8fc)";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type LancamentoFC = {
  id: string; descricao: string; tipo: string;
  valor: number; data: string; status: string;
};

function isoHoje(): string { return hojeISO(); }

// Janela de histórico buscada — 24 meses pra trás (comparativo/precisão) e até
// 120 dias pra frente (previstos futuros, base da ruptura de caixa e da projeção).
// Nunca busca o histórico inteiro de uma vez, escala pra empresa de qualquer idade.
function inicioJanelaHistorica(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 23, 1).toISOString().slice(0, 10);
}
function fimJanelaFutura(fimPeriodo: string): string {
  const hoje = new Date();
  const futuro = new Date(hoje); futuro.setDate(hoje.getDate() + 120);
  const fimSel = new Date(fimPeriodo + "T00:00:00");
  return (futuro > fimSel ? futuro : fimSel).toISOString().slice(0, 10);
}

const tip = {
  backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, padding: [10, 14],
  textStyle: { color: "#e2e8f0", fontSize: 13 },
  extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
};

// Barras agrupadas Entradas x Saídas — específico dessa visão, não genérico o bastante pro alicerce
function optEntradasSaidas(labels: string[], entradas: number[], saidas: number[], cxE: string, cxS: string, corVerde: string, corVermelho: string, temaClaro?: boolean) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 52, right: 16, top: 34, bottom: 28, containLabel: false },
    legend: { top: 0, right: 0, itemWidth: 14, itemHeight: 9, itemGap: 14, textStyle: { color: temaClaro ? "#6b7280" : "#cbd5e1", fontSize: 11, fontWeight: 700 }, data: [cxE, cxS] },
    tooltip: { ...tip, trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.map((p) => `${p.marker} ${p.seriesName}: <b>${fBRL(p.value)}</b>`).join("<br/>") },
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false }, axisLabel: { color: temaClaro ? "#6b7280" : "#cbd5e1", fontSize: 10, fontWeight: 700 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } }, axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => fK(v) } },
    series: [
      { name: cxE, type: "bar", barGap: "10%", itemStyle: { borderRadius: [4, 4, 0, 0], color: corVerde }, data: entradas },
      { name: cxS, type: "bar", itemStyle: { borderRadius: [4, 4, 0, 0], color: corVermelho }, data: saidas },
    ],
  };
}

export default function FluxoCaixa() {
  const router = useRouter();
  const { t, idioma } = useLanguage();
  const { tema } = useThemeAxioma();
  const temaClaro = tema === "xms";
  const ct = (hex: string) => corTema(hex, temaClaro);
  const painelFundo = temaClaro ? PAINEL_CLARO_FUNDO : PAINEL_ESCURO_FUNDO;
  const painelFundoB = temaClaro ? PAINEL_CLARO_FUNDO : PAINEL_ESCURO_FUNDO_B;
  const rupturaFundo = temaClaro ? RUPTURA_PAINEL_CLARO : RUPTURA_PAINEL_ESCURO;
  const campoFundo = temaClaro ? "#ffffff" : "rgba(255,255,255,0.04)";
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);
  // Efeito do Claro (borda + faixa verde-menta no topo) também no Escuro — pedido do Elias 2026-10-03
  const cartaoTema = temaClaro ? { fundo: PAINEL_CLARO_FUNDO, premium3d: true } : { premium3d: true };
  const classePremium3d = " axi-card-premium3d axi-card-faixa";
  const TEXTO_SEC = temaClaro ? "#374151" : "#a3b1c2";
  const NESTED_BG = temaClaro ? "rgba(255,255,255,0.5)" : "rgba(2,8,16,0.5)";
  const NESTED_BORDA = temaClaro ? "rgba(16,27,61,0.12)" : undefined;
  const LETREIRO_BG = "#101b3d";
  const LETREIRO_BORDA = temaClaro ? "#101b3d" : "rgba(46,204,155,0.35)";
  const LETREIRO_TEXTO = "#ffffff";
  const LETREIRO_DESTAQUE = "#2ecc9b";

  const [toast, setToast] = useState<{ msg: string; tipo: "erro" | "ok" } | null>(null);
  function showToast(msg: string, tipo: "erro" | "ok" = "erro") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 4000);
  }
  // Reporta falha de escrita no Supabase (erro real, ou RLS bloqueando em
  // silêncio — 0 linhas afetadas sem erro do Postgres) pro Sentry, com
  // contexto útil, sem travar a tela.
  function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
    Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
  }
  const txt = {
    erroSalvarLancamento: idioma === "pt" ? "Não foi possível salvar o lançamento. Tente novamente." : idioma === "en" ? "Could not save the entry. Try again." : "No se pudo guardar el movimiento. Intente de nuevo.",
    erroExcluirLancamento: idioma === "pt" ? "Não foi possível excluir o lançamento. Tente novamente." : idioma === "en" ? "Could not delete the entry. Try again." : "No se pudo eliminar el movimiento. Intente de nuevo.",
  };

  const [lancamentos, setLancamentos] = useState<LancamentoFC[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<LancamentoFC | null>(null);
  const [novo, setNovo] = useState({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  const [salvando, setSalvando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [visaoSemanal, setVisaoSemanal] = useState(true);
  const [previstosAutoAtivo, setPrevistosAutoAtivo] = useState(true);

  // Previstos automáticos — puxados (só leitura) de outros módulos
  const [contasReceberRows, setContasReceberRows] = useState<any[]>([]);
  const [contasPagarRows, setContasPagarRows] = useState<any[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<any[]>([]);
  const [dividasRows, setDividasRows] = useState<any[]>([]);

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));

  const periodo = resolverPeriodo(presetPeriodo, personalizado);
  const periodoAnt = periodoAnterior(periodo);

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    const empresaId = await obterEmpresaAtiva();
    if (!empresaId) { setCarregando(false); return; }

    const [{ data: fc }, { data: cr }, { data: cp }, { data: cf }, { data: dv }] = await Promise.all([
      // lerTodas: o Supabase corta em 1000 linhas por pedido — empresa grande perdia lançamento
      lerTodas(() => supabase.from("fluxo_caixa").select("*").eq("empresa_id", empresaId)
        .gte("data", inicioJanelaHistorica(periodo.fim)).lte("data", fimJanelaFutura(periodo.fim))
        .order("data", { ascending: false }).order("id")),
      // Leitura só (SELECT) — base dos previstos automáticos. Nunca escreve nessas tabelas.
      lerTodas(() => supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento").eq("empresa_id", empresaId).neq("status", "recebido").order("id")),
      // Sem .neq("status","pago") aqui: contas pagas continuam entrando (resta = 0,
      // já cai fora de saidasAutoContasPagar pelo filtro de valor abaixo) — precisamos
      // delas TAMBÉM quando pagas, pra saber que o custo fixo do mês já virou conta
      // a pagar e não duplicar a saída na projeção de custos fixos logo adiante.
      lerTodas(() => supabase.from("contas_pagar").select("valor_total, valor_pago, status, data_vencimento, custo_fixo_id").eq("empresa_id", empresaId).order("id")),
      supabase.from("custos_fixos").select("id, valor_mensal, dia_vencimento").eq("empresa_id", empresaId),
      supabase.from("dividas").select("valor_total, valor_pago, parcelas, vencimento").eq("empresa_id", empresaId),
    ]);

    setLancamentos(fc || []);
    setContasReceberRows(cr || []);
    setContasPagarRows(cp || []);
    setCustosFixosRows(cf || []);
    setDividasRows(dv || []);
    setCarregando(false);
  };

  const abrirEdicao = (l: LancamentoFC) => {
    setEditando(l);
    setNovo({ descricao: l.descricao, tipo: l.tipo, valor: String(l.valor), data: l.data, status: l.status });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false); setEditando(null);
    setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" });
  };

  const salvar = async () => {
    if (!novo.descricao || !novo.valor || !novo.data) return;
    setSalvando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); return; }
    const payload = { descricao: novo.descricao, tipo: novo.tipo, valor: parseFloat(novo.valor), data: novo.data, status: novo.status };
    if (editando) {
      const { data, error } = await supabase.from("fluxo_caixa").update(payload).eq("id", editando.id).select("id");
      if (error || !data || data.length === 0) {
        showToast(txt.erroSalvarLancamento, "erro");
        reportarFalhaEscrita("fluxo_caixa", "update", error?.message || "0 linhas afetadas (RLS?)");
        setSalvando(false);
        return;
      }
    } else {
      const empresaId = await obterEmpresaAtiva();
      if (!empresaId) { setSalvando(false); return; }
      const { data, error } = await supabase.from("fluxo_caixa").insert({ ...payload, user_id: user.id, empresa_id: empresaId }).select("id");
      if (error || !data || data.length === 0) {
        showToast(txt.erroSalvarLancamento, "erro");
        reportarFalhaEscrita("fluxo_caixa", "insert", error?.message || "0 linhas afetadas (RLS?)");
        setSalvando(false);
        return;
      }
    }
    fecharModal(); await carregarTudo(); setSalvando(false);
  };

  const excluir = async (id: string) => {
    const { data, error } = await supabase.from("fluxo_caixa").delete().eq("id", id).select("id");
    if (error || !data || data.length === 0) {
      showToast(txt.erroExcluirLancamento, "erro");
      reportarFalhaEscrita("fluxo_caixa", "delete", error?.message || "0 linhas afetadas (RLS?)");
      return;
    }
    await carregarTudo();
  };

  // Tabela e totais do topo respeitam o período escolhido (antes somavam a janela inteira carregada: 12 meses + futuro)
  const lancamentosPeriodo = lancamentos.filter(l => l.data && l.data >= periodo.inicio && l.data <= periodo.fim);
  const paginaLanc = usePagina(lancamentosPeriodo);
  const totalEntradas = lancamentosPeriodo.filter(l => l.tipo === "entrada").reduce((acc, l) => acc + l.valor, 0);
  const totalSaidas = lancamentosPeriodo.filter(l => l.tipo === "saida").reduce((acc, l) => acc + l.valor, 0);
  const temDados = lancamentos.length > 0;

  // ═══════════════════════════ INTELIGÊNCIA CFO ═══════════════════════════
  const entradasItens: Lancamento[] = lancamentos.filter(l => l.tipo === "entrada").map(l => ({ valor: l.valor, data: l.data, status: l.status, descricao: l.descricao }));
  const saidasItens: Lancamento[] = lancamentos.filter(l => l.tipo === "saida").map(l => ({ valor: l.valor, data: l.data, status: l.status, descricao: l.descricao }));

  const entradasNoPeriodo = filtrarPorPeriodo(entradasItens, periodo);
  const entradasNoPeriodoAnt = filtrarPorPeriodo(entradasItens, periodoAnt);
  const saidasNoPeriodo = filtrarPorPeriodo(saidasItens, periodo);
  const saidasNoPeriodoAnt = filtrarPorPeriodo(saidasItens, periodoAnt);

  const comparativoEntradas: ComparativoPeriodo = compararPeriodos(entradasNoPeriodo, entradasNoPeriodoAnt);
  const comparativoSaidas: ComparativoPeriodo = compararPeriodos(saidasNoPeriodo, saidasNoPeriodoAnt);

  const saldoPeriodoAtual = comparativoEntradas.atual - comparativoSaidas.atual;
  const saldoPeriodoAnterior = comparativoEntradas.anterior - comparativoSaidas.anterior;
  const comparativoSaldo: ComparativoPeriodo = (() => {
    const variacaoValor = saldoPeriodoAtual - saldoPeriodoAnterior;
    const variacaoPct = saldoPeriodoAnterior !== 0 ? (variacaoValor / Math.abs(saldoPeriodoAnterior)) * 100 : (saldoPeriodoAtual !== 0 ? 100 : 0);
    const direcao: ComparativoPeriodo["direcao"] = Math.abs(variacaoPct) < 1 ? "estavel" : variacaoValor > 0 ? "alta" : "baixa";
    return { atual: saldoPeriodoAtual, anterior: saldoPeriodoAnterior, variacaoValor, variacaoPct, direcao };
  })();

  // Saldo real de caixa hoje (só o que já foi realizado, não o previsto)
  const saldoAtualReal = entradasItens.filter(e => e.status === "realizado").reduce((a, r) => a + r.valor, 0)
    - saidasItens.filter(s => s.status === "realizado").reduce((a, r) => a + r.valor, 0);

  const hoje = isoHoje();
  const entradasManualPrevistas: EventoCaixa[] = entradasItens.filter(e => e.status === "previsto" && e.data >= hoje).map(e => ({ data: e.data, valor: e.valor }));
  const saidasManualPrevistas: EventoCaixa[] = saidasItens.filter(s => s.status === "previsto" && s.data >= hoje).map(s => ({ data: s.data, valor: s.valor }));

  // ═══════════════════════ PREVISTOS AUTOMÁTICOS (cross-módulo) ═══════════════════════
  // Contas a Receber em aberto — cada título vira uma entrada prevista na data de vencimento
  const entradasAutoContasReceber: EventoCaixa[] = contasReceberRows
    .filter((c: any) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c: any) => ({ data: c.data_vencimento, valor: Math.max(0, Number(c.valor || 0) - Number(c.valor_recebido || 0)) }))
    .filter((e) => e.valor > 0);

  // Contas a Pagar em aberto — cada título vira uma saída prevista na data de vencimento
  const saidasAutoContasPagar: EventoCaixa[] = contasPagarRows
    .filter((c: any) => c.data_vencimento && c.data_vencimento >= hoje)
    .map((c: any) => ({ data: c.data_vencimento, valor: Math.max(0, Number(c.valor_total || 0) - Number(c.valor_pago || 0)) }))
    .filter((e) => e.valor > 0);

  // Custos Fixos — recorrentes todo mês, projetados pelo dia de vencimento.
  // DEDUP: quando o botão "Gerar de Custo Fixo" (Contas a Pagar) já criou a
  // conta do mês (custo_fixo_id preenchido), essa saída já está contada em
  // saidasAutoContasPagar acima — contar as duas somaria a mesma obrigação
  // 2x. Aqui removemos SÓ a ocorrência do mês que já virou conta a pagar
  // (a projeção dos meses seguintes continua, pois ainda não foi gerada).
  const mesesJaGeradosPorCustoFixo = new Set(
    contasPagarRows.filter((c: any) => c.custo_fixo_id && c.data_vencimento).map((c: any) => `${c.custo_fixo_id}|${String(c.data_vencimento).slice(0, 7)}`)
  );
  const saidasAutoCustosFixos: EventoCaixa[] = custosFixosRows.flatMap((c: any) => {
    if (!c.valor_mensal || !c.dia_vencimento) return [];
    const proxima = proximaOcorrenciaDoDia(Number(c.dia_vencimento));
    return projetarRecorrenciaMensal(Number(c.valor_mensal), proxima, 120)
      .filter((ev) => !mesesJaGeradosPorCustoFixo.has(`${c.id}|${ev.data.slice(0, 7)}`));
  });

  // Dívidas — parcelas restantes projetadas a partir da próxima data de vencimento
  const saidasAutoDividas: EventoCaixa[] = dividasRows.flatMap((d: any) => {
    const saldo = Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0));
    const parcelas = Math.max(1, Number(d.parcelas || 1));
    if (saldo <= 0 || !d.vencimento) return [];
    const valorParcela = saldo / parcelas;
    return projetarRecorrenciaMensal(valorParcela, d.vencimento, 120, parcelas);
  });

  const totalAutoEntradas = entradasAutoContasReceber.reduce((a, e) => a + e.valor, 0);
  const totalAutoSaidas = [...saidasAutoContasPagar, ...saidasAutoCustosFixos, ...saidasAutoDividas].reduce((a, e) => a + e.valor, 0);

  const entradasFuturasPrevistas: EventoCaixa[] = previstosAutoAtivo ? [...entradasManualPrevistas, ...entradasAutoContasReceber] : entradasManualPrevistas;
  const saidasFuturasPrevistas: EventoCaixa[] = previstosAutoAtivo ? [...saidasManualPrevistas, ...saidasAutoContasPagar, ...saidasAutoCustosFixos, ...saidasAutoDividas] : saidasManualPrevistas;

  const ruptura = detectarRupturaCaixa(saldoAtualReal, entradasFuturasPrevistas, saidasFuturasPrevistas, 90);

  const desvioEntradas = desvioMedioPrevistoRealizado(entradasItens);
  const desvioSaidas = desvioMedioPrevistoRealizado(saidasItens);
  const precisaoPrevisao = Math.max(0, 100 - Math.min(100, (Math.abs(desvioEntradas) + Math.abs(desvioSaidas)) / 2));
  const bandaCenario = Math.min(50, Math.max(5, (Math.abs(desvioEntradas) + Math.abs(desvioSaidas)) / 2));

  const narrativaSaldo = temDados ? montarNarrativaVariacao(lang, {
    metrica: lang === "en" ? "Inflows minus outflows" : lang === "es" ? "Las entradas menos salidas" : "As entradas menos saídas",
    pct: comparativoSaldo.variacaoPct,
  }) : "";
  const narrativaRuptura = ruptura ? montarNarrativaRuptura(lang, ruptura.data, ruptura.diasRestantes) : "";

  const insights: { tipo: "alerta" | "positivo"; texto: string }[] = [];
  if (temDados) {
    if (ruptura) insights.push({ tipo: "alerta", texto: narrativaRuptura });
    if (comparativoSaidas.direcao === "alta" && comparativoEntradas.direcao !== "alta" && comparativoSaidas.variacaoPct > 10) {
      insights.push({ tipo: "alerta", texto: lang === "en" ? "Outflows growing faster than inflows this period." : lang === "es" ? "Las salidas crecen más rápido que las entradas en este período." : "Saídas crescendo mais rápido que entradas neste período." });
    }
    if (!ruptura && saldoAtualReal > 0 && comparativoSaldo.direcao === "alta") insights.push({ tipo: "positivo", texto: cx.semRupturaPrevista });
  }

  // ═══════════════════════════ GRÁFICOS ═══════════════════════════
  const serieVisao = visaoSemanal ? serieSemanal(entradasNoPeriodo, 13, periodo.fim) : serieRolling(entradasNoPeriodo, 12, periodo.fim);
  const serieSaidasVisao = visaoSemanal ? serieSemanal(saidasNoPeriodo, 13, periodo.fim) : serieRolling(saidasNoPeriodo, 12, periodo.fim);
  const optBarras = optEntradasSaidas(serieVisao.map(b => b.label), serieVisao.map(b => b.value), serieSaidasVisao.map(b => b.value), t.fluxoCaixa.totalEntradas, t.fluxoCaixa.totalSaidas, ct(CORES.verde), ct(CORES.vermelho), temaClaro);

  const projecao = projecaoSaldoComCenarios(saldoAtualReal, entradasFuturasPrevistas, saidasFuturasPrevistas, 13, bandaCenario);
  const optProjecao = optLinhaMulti(
    [
      { nome: cx.cenarioOtimista, dados: projecao.otimista, cor: ct(CORES.verde), tipo: "dashed" as const },
      { nome: cx.cenarioPrevisto, dados: projecao.previsto, cor: ct(CORES.cyan), area: true },
      { nome: cx.cenarioPessimista, dados: projecao.pessimista, cor: ct(CORES.vermelho), tipo: "dashed" as const },
    ],
    projecao.labels, ct(CORES.cyan), temaClaro
  );

  const kpisCFO = [
    { l: cx.saldoAtual, v: fBRL(saldoAtualReal), c: saldoAtualReal >= 0 ? ct(CORES.cyan) : ct(CORES.vermelho), i: "💰", delta: null as ComparativoPeriodo | null, invertido: false },
    { l: t.fluxoCaixa.totalEntradas, v: fBRL(comparativoEntradas.atual), c: ct(CORES.verde), i: "📈", delta: comparativoEntradas, invertido: false },
    { l: t.fluxoCaixa.totalSaidas, v: fBRL(comparativoSaidas.atual), c: ct(CORES.vermelho), i: "📉", delta: comparativoSaidas, invertido: true },
    { l: lang === "en" ? "Period Balance" : lang === "es" ? "Saldo del Período" : "Saldo do Período", v: fBRL(saldoPeriodoAtual), c: saldoPeriodoAtual >= 0 ? ct(CORES.verde) : ct(CORES.vermelho), i: "⚖️", delta: comparativoSaldo, invertido: false },
    { l: cx.rupturaCaixaTitulo, v: ruptura ? `${ruptura.diasRestantes}d` : "—", c: ruptura ? ct(CORES.vermelho) : ct(CORES.verde), i: "🚨", delta: null, invertido: false },
    { l: cx.precisaoPrevisao, v: fPct(precisaoPrevisao), c: precisaoPrevisao >= 80 ? ct(CORES.verde) : precisaoPrevisao >= 60 ? ct(CORES.amarelo) : ct(CORES.vermelho), i: "🎯", delta: null, invertido: false },
  ];
  // destino de cada indicador acima (mesma ordem) — card nunca é só enfeite
  const DESTINOS_CFO = ["/tesouraria", "/receitas", "/custos-variaveis", "/tesouraria", "#ruptura-caixa", "#previstos-caixa"];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.saldoAtual} ${fBRL(saldoAtualReal)}`,
    `${t.fluxoCaixa.totalEntradas} ${fBRL(comparativoEntradas.atual)}`, `${t.fluxoCaixa.totalSaidas} ${fBRL(comparativoSaidas.atual)}`,
    ruptura ? `${cx.rupturaCaixaTitulo}: ${ruptura.diasRestantes}d` : cx.semRupturaPrevista,
  ].filter(Boolean);

  const DeltaBadge = ({ comp, invertido }: { comp: ComparativoPeriodo; invertido: boolean }) => {
    if (comp.direcao === "estavel") return <span className="text-xs font-bold" style={{ color: ct("#64748b") }}>{cx.periodoEstavel}</span>;
    const bom = invertido ? comp.direcao === "baixa" : comp.direcao === "alta";
    const cor = bom ? ct(CORES.verde) : ct(CORES.vermelho);
    const seta = comp.direcao === "alta" ? "▲" : "▼";
    return <span className="text-xs font-bold" style={{ color: cor }}>{seta} {fPct(Math.abs(comp.variacaoPct))} {cx.vsPeriodoAnterior}</span>;
  };

  const SubChart = ({ titulo, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4 axi-card-premium3d axi-card-faixa" style={{ background: NESTED_BG, border: `1px solid ${temaClaro ? NESTED_BORDA : cor + "20"}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-sm font-black" style={{ color: ct("#f1f5f9"), ...FONTE_EXEC }}>{titulo}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  // ═══════════════════════════ PDF ═══════════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: t.fluxoCaixa.titulo, subtitulo: t.fluxoCaixa.subtitulo,
        colunas: [
          { header: "Descrição", key: "descricao", width: 4 }, { header: "Tipo", key: "tipo", width: 2 },
          { header: "Data", key: "data", width: 2 }, { header: "Status", key: "status", width: 2 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
        ],
        linhas: lancamentosPeriodo.map((l) => ({
          descricao: l.descricao, tipo: l.tipo === "entrada" ? "Entrada" : "Saída",
          data: l.data ? new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR") : "-",
          status: l.status === "realizado" ? "Realizado" : "Previsto",
          valor: `${l.tipo === "entrada" ? "+" : "-"} ${fBRL2(l.valor)}`,
        })),
        resumo: [
          { label: "Total de Entradas", valor: `R$ ${fBRL2(totalEntradas)}` },
          { label: "Total de Saídas", valor: `R$ ${fBRL2(totalSaidas)}` },
          { label: "Saldo Atual (realizado)", valor: `R$ ${fBRL2(saldoAtualReal)}` },
          { label: cx.rupturaCaixaTitulo, valor: ruptura ? `${ruptura.data} (${ruptura.diasRestantes}d)` : "—" },
        ],
        nomeArquivo: `axioma-fluxo-caixa-${hojeISO()}.pdf`,
      }, (msg) => showToast(msg, "erro"), lang);
    } catch (err) { showToast(tratarFalhaExportacao("fluxo-caixa.exportarPDF", err, lang), "erro"); }
    setExportando(false);
  };

  // ═══════════════════════════ COMPARTILHAR ═══════════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${t.fluxoCaixa.titulo}`,
    `💰 ${cx.saldoAtual}: R$ ${fBRL2(saldoAtualReal)}`,
    `📈 ${t.fluxoCaixa.totalEntradas}: R$ ${fBRL2(comparativoEntradas.atual)}`,
    `📉 ${t.fluxoCaixa.totalSaidas}: R$ ${fBRL2(comparativoSaidas.atual)}`,
    ruptura ? `🚨 ${narrativaRuptura}` : `✅ ${cx.semRupturaPrevista}`,
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");

  const textoDetalhado = [
    `🚀 AXIOMA AI.TECH — ${t.fluxoCaixa.titulo} (detalhado)`,
    ...lancamentosPeriodo.map((l) =>
      `${l.data ? new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR") : "-"} | ${l.descricao} | ${l.tipo === "entrada" ? "Entrada" : "Saída"} | ${l.status === "realizado" ? "Realizado" : "Previsto"} | R$ ${fBRL2(l.valor)}`
    ),
    `_axiomaai.com.br_`,
  ].join("\n");

  return (
    <div data-theme={tema} style={{ fontFamily: "var(--font-geist-sans), Arial, sans-serif" }}>
    <ModuloLayout titulo={t.fluxoCaixa.titulo} subtitulo={t.fluxoCaixa.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando}
      onNovo={() => { setEditando(null); setNovo({ descricao: "", tipo: "entrada", valor: "", data: "", status: "previsto" }); setModalAberto(true); }}
      labelBotao={t.fluxoCaixa.novoLancamento}
      headerFundo={temaClaro ? "linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)" : undefined}
      corExportar="linear-gradient(135deg, #16a97d, #2ecc9b)"
      corNovo="linear-gradient(135deg, #16a97d, #2ecc9b)"
      botaoExtra={<ThemeToggle />}>
      <AvisoAxioma aviso={toast} onFechar={() => setToast(null)} />
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={presetPeriodo} onChangePreset={setPresetPeriodo} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={ct(CORES.cyan)} lang={lang} temaClaro={temaClaro} />
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg, #16a97d, #2ecc9b)", border: "none", color: "#fff" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: t.fluxoCaixa.totalEntradas, value: `R$ ${totalEntradas.toLocaleString("pt-BR")}`, cor: ct("#34d399"), Icon: TrendingUp, ir: "/receitas" },
            { label: t.fluxoCaixa.totalSaidas, value: `R$ ${totalSaidas.toLocaleString("pt-BR")}`, cor: ct("#f87171"), Icon: TrendingDown, ir: "/custos-variaveis" },
            { label: t.fluxoCaixa.saldoAtual, value: `R$ ${saldoAtualReal.toLocaleString("pt-BR")}`, cor: saldoAtualReal >= 0 ? ct("#34d399") : ct("#f87171"), Icon: saldoAtualReal >= 0 ? TrendingUp : AlertTriangle, ir: "/tesouraria" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} className="cursor-pointer" onClick={() => irParaDestino(card.ir, router)}>
              <CanvasBox cor={card.cor} destaque {...cartaoTema}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>{card.label}</p>
                  <card.Icon size={16} style={{ color: card.cor }} />
                </div>
                <p className="text-2xl font-black" style={{ color: card.cor }}><AnimatedNumber value={card.value} /></p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {/* CAMADA CFO */}
        {temDados && (
          <>
            <div id="ruptura-caixa" className="scroll-mt-28" />
            {/* ALERTA DE RUPTURA — o diferencial mundial, sempre visível quando existe */}
            {ruptura && (
              <div className="rounded-2xl p-4 md:p-5 axi-card-premium3d axi-card-faixa" style={{ background: rupturaFundo, border: "1px solid rgba(239,68,68,0.4)" }}>
                <div className="flex items-center gap-3">
                  <ShieldAlert size={22} style={{ color: ct(CORES.vermelho), flexShrink: 0 }} />
                  <div>
                    <p className="text-sm font-black" style={{ color: ct("#fca5a5"), ...FONTE_EXEC }}>{cx.rupturaCaixaTitulo}</p>
                    <p className="text-xs md:text-sm mt-1" style={{ color: ct("#fecaca") }}>{narrativaRuptura}</p>
                  </div>
                </div>
              </div>
            )}

            {/* KPIs CFO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={() => irParaDestino(DESTINOS_CFO[i] || "#", router)}
                  className={`rounded-2xl p-3 md:p-4 cursor-pointer${classePremium3d}`}
                  style={{ background: painelFundo, border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c, ...FONTE_EXEC }}>{k.v}</p>
                  <p className="text-xs uppercase tracking-wider font-bold mt-0.5" style={{ color: TEXTO_SEC }}>{k.l}</p>
                  {k.delta && <div className="mt-1"><DeltaBadge comp={k.delta} invertido={k.invertido} /></div>}
                </motion.div>
              ))}
            </div>

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: LETREIRO_BG, border: `1px solid ${LETREIRO_BORDA}` }}>
              <div className="marquee-fc py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-sm font-bold tracking-wide" aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? LETREIRO_DESTAQUE : LETREIRO_TEXTO }}>{m}<span style={{ color: LETREIRO_DESTAQUE }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-fc{animation:marqueeFc 30s linear infinite}@keyframes marqueeFc{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-fc:hover{animation-play-state:paused}`}</style>
            </div>

            {/* NARRATIVA */}
            {narrativaSaldo && (
              <div className={`rounded-2xl p-4 md:p-5${classePremium3d}`} style={{ background: painelFundo, border: "1px solid rgba(46,204,155,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText size={16} style={{ color: ct(CORES.cyan) }} />
                  <p className="text-sm font-black" style={{ color: ct("#f1f5f9"), ...FONTE_EXEC }}>{cx.narrativaTitulo}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: ct("#e2e8f0") }}>{narrativaSaldo}</p>
              </div>
            )}

            <div id="previstos-caixa" className="scroll-mt-28" />
            {/* PREVISTOS AUTOMÁTICOS — cross-módulo */}
            {(totalAutoEntradas > 0 || totalAutoSaidas > 0) && (
              <div className={`rounded-2xl p-4 md:p-5${classePremium3d}`} style={{ background: painelFundo, border: "1px solid rgba(46,204,155,0.2)" }}>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: ct("#f1f5f9"), ...FONTE_EXEC }}>{cx.previstosAutomaticos}</p>
                    <p className="text-xs font-medium" style={{ color: TEXTO_SEC }}>{cx.subPrevistosAutomaticos}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold" style={{ color: previstosAutoAtivo ? ct(CORES.cyan) : TEXTO_SEC }}>
                    <input type="checkbox" checked={previstosAutoAtivo} onChange={(e) => setPrevistosAutoAtivo(e.target.checked)} className="accent-cyan-500" />
                    {cx.incluirPrevistosAuto}
                  </label>
                </div>
                {/* Decomposição por origem — grid de valores, sempre bege
                    neutro (regra 4), nunca tingido pela cor da categoria;
                    só o número mantém a cor de identificação. */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { l: cx.origemContasReceber, v: entradasAutoContasReceber.reduce((a, e) => a + e.valor, 0), c: ct(CORES.verde) },
                    { l: cx.origemContasPagar, v: saidasAutoContasPagar.reduce((a, e) => a + e.valor, 0), c: ct(CORES.vermelho) },
                    { l: cx.origemCustosFixos, v: saidasAutoCustosFixos.reduce((a, e) => a + e.valor, 0), c: ct(temaClaro ? CORES.verde : CORES.laranja) },
                    { l: cx.origemDividas, v: saidasAutoDividas.reduce((a, e) => a + e.valor, 0), c: ct(temaClaro ? CORES.cyan : CORES.rosa) },
                  ].map((o) => (
                    <div key={o.l} className={`rounded-xl px-3 py-2.5${classePremium3d}`} style={{ background: temaClaro ? NESTED_BG : `${o.c}0c`, border: `1px solid ${temaClaro ? NESTED_BORDA : o.c + "25"}` }}>
                      <p className="text-xs uppercase tracking-wider font-bold" style={{ color: TEXTO_SEC }}>{o.l}</p>
                      <p className="text-sm font-black" style={{ color: o.c }}>{fBRL(o.v)}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-3" style={{ color: TEXTO_SEC }}>{cx.avisoDuplicidade}</p>
              </div>
            )}

            {/* MODAL ÚNICO */}
            <div className={`rounded-2xl overflow-hidden${classePremium3d}`} style={{ background: painelFundoB, border: "1px solid rgba(46,204,155,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#2ecc9b,#2ecc9b)", boxShadow: "0 0 12px #2ecc9b" }} />
                    <div>
                      <p className="text-sm md:text-base font-black" style={{ color: ct("#f1f5f9") }}>{cx.previsao}</p>
                      <p className="text-xs font-medium" style={{ color: ct("#64748b") }}>{cx.cenarioOtimista} · {cx.cenarioPrevisto} · {cx.cenarioPessimista}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 rounded-xl p-1" style={{ background: temaClaro ? "#ffffff" : "rgba(10,22,40,0.8)", border: `1px solid ${temaClaro ? "rgba(16,185,129,0.2)" : "rgba(46,204,155,0.2)"}` }}>
                    {[{ v: true, l: cx.visaoSemanal }, { v: false, l: cx.visaoMensal }].map((opt) => (
                      <button key={opt.l} onClick={() => setVisaoSemanal(opt.v)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{ background: visaoSemanal === opt.v ? (temaClaro ? "rgba(16,185,129,0.3)" : "rgba(46,204,155,0.3)") : "transparent", color: visaoSemanal === opt.v ? ct(temaClaro ? CORES.verde : CORES.cyan) : TEXTO_SEC }}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <SubChart titulo={cx.previsao} cor={ct(CORES.cyan)} option={optProjecao} altura={280} />
                </div>

                <SubChart titulo={`${t.fluxoCaixa.totalEntradas} × ${t.fluxoCaixa.totalSaidas}`} cor={ct(CORES.azul)} option={optBarras} altura={260} />
              </div>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <div className={`rounded-2xl p-4 md:p-5${classePremium3d}`} style={{ background: painelFundo, border: "1px solid rgba(46,204,155,0.15)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} style={{ color: ct(temaClaro ? CORES.verde : CORES.ouro) }} />
                  <p className="text-sm font-black" style={{ color: ct(temaClaro ? CORES.verde : "#f1f5f9"), ...FONTE_EXEC }}>{cx.insights}</p>
                </div>
                <div className="space-y-2">
                  {insights.map((ins, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl axi-card-premium3d axi-card-faixa"
                      style={{ background: ins.tipo === "alerta" ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${ins.tipo === "alerta" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                      {ins.tipo === "alerta" ? <AlertTriangle size={15} style={{ color: ct(CORES.vermelho), flexShrink: 0 }} /> : <Zap size={15} style={{ color: ct(CORES.verde), flexShrink: 0 }} />}
                      <p className="text-xs font-medium" style={{ color: ins.tipo === "alerta" ? ct("#fca5a5") : ct("#6ee7b7") }}>{ins.texto}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tabela lançamentos */}
        <CanvasBox cor={ct("#2ecc9b")} {...cartaoTema}>
          <div className="mb-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--axi-text-primary)" }}>{t.fluxoCaixa.lancamentos}</h3>
          </div>
          {carregando ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : lancamentosPeriodo.length === 0 ? (
            <div className="text-center py-12"><p style={{ color: TEXTO_SEC }}>{t.fluxoCaixa.semLancamentos}</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: temaClaro ? `1px solid ${NESTED_BORDA}` : "1px solid rgba(163,177,194,0.15)" }}>
                    {[t.geral.descricao, "Tipo", t.geral.data, t.geral.status, t.geral.valor, t.geral.acoes].map((h, i) => (
                      <th key={i} className="text-left px-4 md:px-6 py-4 text-xs font-semibold tracking-wider uppercase" style={{ color: TEXTO_SEC }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginaLanc.fatia.map((l, i) => (
                    <motion.tr key={l.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      whileHover={{ backgroundColor: temaClaro ? "rgba(16,27,61,0.03)" : "rgba(46,204,155,0.02)" }}
                      style={{ borderBottom: i < paginaLanc.fatia.length - 1 ? `1px solid ${temaClaro ? NESTED_BORDA : "rgba(163,177,194,0.08)"}` : "none" }}>
                      <td className="px-4 md:px-6 py-4 text-sm" style={{ color: "var(--axi-text-primary)" }}>{l.descricao}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.tipo === "entrada" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", color: l.tipo === "entrada" ? ct("#34d399") : ct("#f87171") }}>
                          {l.tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm" style={{ color: TEXTO_SEC }}>{new Date(l.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span className="text-xs px-3 py-1 rounded-full" style={{ background: l.status === "realizado" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)", color: l.status === "realizado" ? ct("#34d399") : ct("#2ecc9b") }}>
                          {l.status === "realizado" ? t.fluxoCaixa.realizado : t.fluxoCaixa.previsto}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-sm font-black" style={{ color: l.tipo === "entrada" ? ct("#34d399") : ct("#f87171") }}>
                        {l.tipo === "entrada" ? "+" : "-"} R$ {l.valor.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex gap-3">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(l)} style={{ color: ct("#2ecc9b") }}><Pencil size={15} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(l.id)} style={{ color: ct("#f87171") }}><Trash2 size={15} /></motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <Paginacao pagina={paginaLanc.pagina} total={paginaLanc.total} onMudar={paginaLanc.setPagina} lang={lang} temaClaro={temaClaro} />
            </div>
          )}
        </CanvasBox>
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-8 px-4 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md">
              <CanvasBox cor={ct("#34d399")} {...cartaoTema}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: ct("#34d399") }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "var(--axi-text-primary)" }}>{editando ? "Editar Lançamento" : t.fluxoCaixa.novoLancamento}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: TEXTO_SEC }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: ct("#5a8fd4") }}>{t.geral.descricao}</label>
                    <input value={novo.descricao} onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: campoFundo, border: "1px solid rgba(163,177,194,0.2)", color: "var(--axi-text-primary)" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: ct("#5a8fd4") }}>Tipo</label>
                    <div className="flex gap-2">
                      {["entrada", "saida"].map((tipo) => (
                        <motion.button key={tipo} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, tipo })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.tipo === tipo ? (tipo === "entrada" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)") : "rgba(163,177,194,0.05)", color: novo.tipo === tipo ? (tipo === "entrada" ? ct("#34d399") : ct("#f87171")) : TEXTO_SEC, border: `1px solid ${novo.tipo === tipo ? (tipo === "entrada" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)") : "rgba(163,177,194,0.1)"}` }}>
                          {tipo === "entrada" ? t.fluxoCaixa.entrada : t.fluxoCaixa.saida}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  {[
                    { label: t.geral.valor, key: "valor", type: "number" },
                    { label: t.geral.data, key: "data", type: "date" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: ct("#5a8fd4") }}>{label}</label>
                      <input type={type} value={novo[key as keyof typeof novo]} onChange={(e) => setNovo({ ...novo, [key]: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: campoFundo, border: "1px solid rgba(163,177,194,0.2)", color: "var(--axi-text-primary)" }} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: ct("#5a8fd4") }}>{t.geral.status}</label>
                    <div className="flex gap-2">
                      {["previsto", "realizado"].map((s) => (
                        <motion.button key={s} whileTap={{ scale: 0.97 }} onClick={() => setNovo({ ...novo, status: s })}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                          style={{ background: novo.status === s ? "rgba(46,204,155,0.2)" : "rgba(163,177,194,0.05)", color: novo.status === s ? ct("#2ecc9b") : TEXTO_SEC, border: `1px solid ${novo.status === s ? "rgba(46,204,155,0.4)" : "rgba(163,177,194,0.1)"}` }}>
                          {s === "previsto" ? t.fluxoCaixa.previsto : t.fluxoCaixa.realizado}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={salvar} disabled={salvando}
                    className="w-full py-4 rounded-xl font-bold disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #064e3b, #059669)", color: "#fff" }}>
                    {salvando ? t.geral.carregando : editando ? "Salvar Alterações" : t.fluxoCaixa.salvarLancamento}
                  </motion.button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={textoShare}
        textoDetalhado={textoDetalhado}
        assunto={`${t.fluxoCaixa.titulo} — Axioma`}
        onExportarPDF={exportarPDF}
        cor="#2ecc9b"
      />
    </ModuloLayout>
    </div>
  );
}
