"use client";
import { useState, useEffect } from "react";
import { Target, Trash2, X, Pencil, Share2, Sparkles, GitBranch, Archive, ArchiveRestore, Trophy } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import {
  fBRL, fPct, CORES, FONTE_EXEC,
  filtrarPorPeriodo, montarDRE, ticketMedio, serieRolling, optRosca, optLinhaMulti,
  calcularRitmoMeta, progressoEsperado, projetarFechamentoMeta, progressoPercentual,
  detectarMetaIrreal, semaforoMeta, marcoAlcancado, traduzirMetaEmDinheiro,
  conectarMetas, gerarConselhoMeta, ritmoHistoricoMedio, validarDirecaoMeta,
  type Lancamento, type Periodo, type TipoMeta, type CorSaude, type DirecaoMeta,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento, nomeTipoMeta,
  montarNarrativaRitmo, montarNarrativaProjecaoMeta, montarNarrativaMetaIrreal,
  montarConselhoMeta, montarNarrativaDependencia,
} from "../../../lib/cfoTextos";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIPOS_META: TipoMeta[] = ["faturamento", "lucro", "margem", "reducao_custo", "reducao_divida", "caixa", "ticket_medio", "num_clientes"];

type MetaRow = {
  id: string; titulo: string; tipo_meta: TipoMeta | null;
  valor_meta: number; valor_inicial: number; valor_atual: number;
  data_inicio: string; prazo: string | null; status: string; created_at?: string;
  direcao: DirecaoMeta | null; responsavel: string | null; descricao: string | null;
};

const DIRECAO_PADRAO: Record<TipoMeta, DirecaoMeta> = {
  faturamento: "aumentar", lucro: "aumentar", margem: "aumentar", caixa: "aumentar",
  ticket_medio: "aumentar", num_clientes: "aumentar",
  reducao_custo: "reduzir", reducao_divida: "reduzir",
};

// ═══════════════════════ HELPERS DE DATA (mesmo padrão do DRE/Endividamento) ═══════════════════════
function hojeISO(): string { return new Date().toISOString().slice(0, 10); }

function inicioJanela24m(ate: string): string {
  const d = new Date(ate + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() - 23, 1).toISOString().slice(0, 10);
}
function inicioRolling12(ate: string): string {
  const d = new Date(ate + "T00:00:00");
  return new Date(d.getFullYear(), d.getMonth() - 11, 1).toISOString().slice(0, 10);
}
function mesesNoPeriodo(periodo: Periodo): number {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const dias = (fim.getTime() - ini.getTime()) / 86400000;
  return Math.max(1, Math.round(dias / 30));
}
function trailing(ate: string, dias: number): Periodo {
  const fim = new Date(ate + "T00:00:00");
  const ini = new Date(fim.getTime() - dias * 86400000);
  return { inicio: ini.toISOString().slice(0, 10), fim: ate };
}
function diasEntre(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}
function fmtData(lang: string, iso: string): string {
  const locale = lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
  return new Date(iso + "T00:00:00").toLocaleDateString(locale);
}
function formatarValorMeta(tipo: TipoMeta | null, valor: number): string {
  if (tipo === "margem") return fPct(valor);
  if (tipo === "num_clientes") return Math.round(valor).toLocaleString("pt-BR");
  return fBRL(valor);
}

// ═══════════════════════ MOTOR DE DADOS REAL POR TIPO DE META ═══════════════════════
// A IA sempre mostra o raciocínio: cada valor vem acompanhado de onde foi buscado.
type CtxMeta = {
  receitas: Lancamento[]; custosVar: Lancamento[]; custoFixoMensalTotal: number;
  dividas: { valor_total: number; valor_pago: number; taxa_juros: number }[];
  despesasFinanceirasMensal: number;
  fluxo: { tipo: string; valor: number; data: string; status: string }[];
  clientes: { status: string; created_at: string }[];
  regimeTributario: string;
};

function raciocinioFluxo(lang: string, n: number, origemLabel: string, desde: string, ate: string): string {
  const d1 = fmtData(lang, desde), d2 = fmtData(lang, ate);
  if (lang === "en") return `Sum of ${n} entries in ${origemLabel} between ${d1} and ${d2}.`;
  if (lang === "es") return `Suma de ${n} registros en ${origemLabel} entre ${d1} y ${d2}.`;
  return `Soma de ${n} lançamentos em ${origemLabel} entre ${d1} e ${d2}.`;
}
function raciocinioNivel(lang: string, origemLabel: string, ate: string): string {
  const d = fmtData(lang, ate);
  if (lang === "en") return `Current snapshot of ${origemLabel} as of ${d}.`;
  if (lang === "es") return `Estado actual de ${origemLabel} al ${d}.`;
  return `Estado atual de ${origemLabel} em ${d}.`;
}

// dataInicioFluxo só é usado pelos tipos de fluxo (faturamento/lucro) — acumulam desde o início da
// meta até `ate`. Os tipos de nível (margem/custo/dívida/caixa/ticket/clientes) sempre olham o
// estado ATUAL em `ate` — por isso o valor_inicial é capturado uma única vez, na criação da meta.
function valorMetrica(tipo: TipoMeta, ate: string, dataInicioFluxo: string, ctx: CtxMeta, lang: string, origemLabels: Record<TipoMeta, string>): { valor: number; raciocinio: string } {
  switch (tipo) {
    case "faturamento": {
      const itens = filtrarPorPeriodo(ctx.receitas, { inicio: dataInicioFluxo, fim: ate });
      return { valor: itens.reduce((s, r) => s + r.valor, 0), raciocinio: raciocinioFluxo(lang, itens.length, origemLabels.faturamento, dataInicioFluxo, ate) };
    }
    case "lucro":
    case "margem": {
      const periodo = { inicio: dataInicioFluxo, fim: ate };
      const meses = mesesNoPeriodo(periodo);
      const itensReceita = filtrarPorPeriodo(ctx.receitas, periodo);
      const receitaBruta = itensReceita.reduce((s, r) => s + r.valor, 0);
      const custoVar = filtrarPorPeriodo(ctx.custosVar, periodo).reduce((s, r) => s + r.valor, 0);
      const custoFixo = ctx.custoFixoMensalTotal * meses;
      const despFin = ctx.despesasFinanceirasMensal * meses;
      const rb12 = ctx.receitas.filter(r => r.data >= inicioRolling12(ate) && r.data <= ate).reduce((s, r) => s + r.valor, 0);
      const receitaMensalMedia = receitaBruta / meses;
      const imposto = calcularImpostoRegime(ctx.regimeTributario, rb12, receitaMensalMedia) * meses;
      const dre = montarDRE({ receitaBruta, deducoes: imposto, custoVariavel: custoVar, custoFixo, despesasFinanceiras: despFin });
      if (tipo === "lucro") return { valor: dre.lucroLiquido.valor, raciocinio: raciocinioFluxo(lang, itensReceita.length, origemLabels.lucro, dataInicioFluxo, ate) };
      return { valor: dre.margemLiquidaPct, raciocinio: raciocinioNivel(lang, origemLabels.margem, ate) };
    }
    case "reducao_custo": {
      const custoVarMedio = filtrarPorPeriodo(ctx.custosVar, trailing(ate, 90)).reduce((s, r) => s + r.valor, 0) / 3;
      return { valor: ctx.custoFixoMensalTotal + custoVarMedio, raciocinio: raciocinioNivel(lang, origemLabels.reducao_custo, ate) };
    }
    case "reducao_divida": {
      const valor = ctx.dividas.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago), 0);
      return { valor, raciocinio: raciocinioNivel(lang, origemLabels.reducao_divida, ate) };
    }
    case "caixa": {
      const valor = ctx.fluxo.filter(f => f.status === "realizado" && f.data <= ate)
        .reduce((s, f) => s + (f.tipo === "entrada" ? Number(f.valor || 0) : -Number(f.valor || 0)), 0);
      return { valor, raciocinio: raciocinioNivel(lang, origemLabels.caixa, ate) };
    }
    case "ticket_medio": {
      const valor = ticketMedio(filtrarPorPeriodo(ctx.receitas, trailing(ate, 30)));
      return { valor, raciocinio: raciocinioNivel(lang, origemLabels.ticket_medio, ate) };
    }
    case "num_clientes": {
      const valor = ctx.clientes.filter(c => c.status === "ativo" && c.created_at <= ate + "T23:59:59").length;
      return { valor, raciocinio: raciocinioNivel(lang, origemLabels.num_clientes, ate) };
    }
  }
}

// Série mensal aproximada — só pra alimentar o detector de meta irreal (ritmo histórico).
// lucro/margem usam uma alíquota efetiva única pra série toda (aproximação suficiente pro classificador).
function serieHistoricaMetrica(tipo: TipoMeta, ctx: CtxMeta, ate: string, mesesJanela = 12): number[] {
  switch (tipo) {
    case "faturamento": return serieRolling(ctx.receitas, mesesJanela, ate).map(b => b.value);
    case "reducao_custo": return serieRolling(ctx.custosVar, mesesJanela, ate).map(b => b.value + ctx.custoFixoMensalTotal);
    case "caixa": {
      const entradas = serieRolling(ctx.fluxo.filter(f => f.tipo === "entrada" && f.status === "realizado").map(f => ({ valor: f.valor, data: f.data })), mesesJanela, ate).map(b => b.value);
      const saidas = serieRolling(ctx.fluxo.filter(f => f.tipo === "saida" && f.status === "realizado").map(f => ({ valor: f.valor, data: f.data })), mesesJanela, ate).map(b => b.value);
      return entradas.map((v, i) => v - (saidas[i] || 0));
    }
    case "lucro":
    case "margem": {
      const receitaSerie = serieRolling(ctx.receitas, mesesJanela, ate).map(b => b.value);
      const custoVarSerie = serieRolling(ctx.custosVar, mesesJanela, ate).map(b => b.value);
      const rb12 = ctx.receitas.filter(r => r.data >= inicioRolling12(ate) && r.data <= ate).reduce((s, r) => s + r.valor, 0);
      const mediaMensalAtual = receitaSerie.reduce((a, b) => a + b, 0) / (receitaSerie.length || 1);
      const aliquota = mediaMensalAtual > 0 ? calcularImpostoRegime(ctx.regimeTributario, rb12, mediaMensalAtual) / mediaMensalAtual : 0;
      const lucroSerie = receitaSerie.map((r, i) => r - (custoVarSerie[i] || 0) - ctx.custoFixoMensalTotal - ctx.despesasFinanceirasMensal - r * aliquota);
      return tipo === "lucro" ? lucroSerie : lucroSerie.map((l, i) => receitaSerie[i] > 0 ? (l / receitaSerie[i]) * 100 : 0);
    }
    default: return [];
  }
}

// ═══════════════════════ GRÁFICO LOCAL — barras agrupadas (Real × Esperado) ═══════════════════════
function optProgressoMetas(labels: string[], real: number[], esperado: number[], labelReal: string, labelEsperado: string) {
  return {
    backgroundColor: "transparent", animationDuration: 900,
    grid: { left: 44, right: 16, top: 34, bottom: 44, containLabel: false },
    legend: { top: 0, right: 0, itemWidth: 14, itemHeight: 9, itemGap: 14, textStyle: { color: "#cbd5e1", fontSize: 11, fontWeight: 700 } },
    tooltip: {
      backgroundColor: "rgba(10,8,30,0.97)", borderWidth: 1, borderColor: CORES.roxo, padding: [10, 14],
      textStyle: { color: "#e2e8f0", fontSize: 13 }, extraCssText: "border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.6);",
      trigger: "axis", axisPointer: { type: "shadow" },
      formatter: (ps: any[]) => `<b>${ps[0].axisValue}</b><br/>` + ps.map((p) => `${p.marker} ${p.seriesName}: <b>${Number(p.value).toFixed(0)}%</b>`).join("<br/>"),
    },
    xAxis: { type: "category", data: labels, axisLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } }, axisTick: { show: false }, axisLabel: { color: "#cbd5e1", fontSize: 10, fontWeight: 700, interval: 0, rotate: labels.length > 4 ? 20 : 0 } },
    yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.06)", type: "dashed" } }, axisLabel: { color: "#64748b", fontSize: 10, formatter: (v: number) => `${v}%` } },
    series: [
      { name: labelReal, type: "bar", barGap: "10%", itemStyle: { borderRadius: [4, 4, 0, 0], color: CORES.roxo }, data: real },
      { name: labelEsperado, type: "bar", itemStyle: { borderRadius: [4, 4, 0, 0], color: CORES.ouro }, data: esperado },
    ],
  };
}

export default function Metas() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);

  const [metas, setMetas] = useState<MetaRow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<MetaRow | null>(null);
  const [titulo, setTitulo] = useState("");
  const [tipoMetaSel, setTipoMetaSel] = useState<TipoMeta>("faturamento");
  const [valorMeta, setValorMeta] = useState("");
  const [valorInicialInput, setValorInicialInput] = useState("");
  const [direcaoSel, setDirecaoSel] = useState<DirecaoMeta>("aumentar");
  const [responsavelInput, setResponsavelInput] = useState("");
  const [descricaoInput, setDescricaoInput] = useState("");
  const [prazo, setPrazo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number; data: string }[]>([]);
  const [dividasRows, setDividasRows] = useState<{ valor_total: number; valor_pago: number; taxa_juros: number }[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<{ tipo: string; valor: number; data: string; status: string }[]>([]);
  const [clientesRows, setClientesRows] = useState<{ status: string; created_at: string }[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");

  const txt = {
    titulo: idioma === "pt" ? "Metas" : idioma === "en" ? "Goals" : "Metas",
    subtitulo: idioma === "pt" ? "O antídoto contra meta vaga e esquecida" : idioma === "en" ? "The antidote to vague, forgotten goals" : "El antídoto contra la meta vaga y olvidada",
    novo: idioma === "pt" ? "Nova Meta" : idioma === "en" ? "New Goal" : "Nueva Meta",
    editar: idioma === "pt" ? "Editar Meta" : idioma === "en" ? "Edit Goal" : "Editar Meta",
    salvar: idioma === "pt" ? "Salvar Meta" : idioma === "en" ? "Save Goal" : "Guardar Meta",
    cancelar: idioma === "pt" ? "Cancelar" : idioma === "en" ? "Cancel" : "Cancelar",
    semMetas: idioma === "pt" ? "Nenhuma meta cadastrada. Toda meta séria começa com prazo e número — crie a primeira." : idioma === "en" ? "No goals yet. Every serious goal starts with a deadline and a number — create the first one." : "Sin metas aún. Toda meta seria empieza con plazo y número — cree la primera.",
    nomeMeta: idioma === "pt" ? "Nome da Meta" : idioma === "en" ? "Goal Name" : "Nombre",
    valorAlvoLabel: idioma === "pt" ? "Valor Alvo" : idioma === "en" ? "Target Value" : "Valor Objetivo",
    prazoLabel: idioma === "pt" ? "Prazo" : idioma === "en" ? "Deadline" : "Plazo",
    tipoLabel: idioma === "pt" ? "Vincular a" : idioma === "en" ? "Linked to" : "Vincular a",
    totalMetas: idioma === "pt" ? "Total de Metas" : idioma === "en" ? "Total Goals" : "Total de Metas",
    concluidas: idioma === "pt" ? "Concluídas" : idioma === "en" ? "Completed" : "Completadas",
    buscar: idioma === "pt" ? "Buscar meta..." : idioma === "en" ? "Search goal..." : "Buscar meta...",
    tipoTravado: idioma === "pt" ? "O tipo não muda depois de criada — ele define de onde o progresso é lido." : idioma === "en" ? "Type can't change after creation — it defines where progress is read from." : "El tipo no cambia después de creada — define de dónde se lee el progreso.",
  };

  useEffect(() => { carregarTudo(); }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }

    const hoje = hojeISO();
    const inicioHist = inicioJanela24m(hoje);

    const [{ data: mt }, { data: rec }, { data: cf }, { data: cv }, { data: dv }, { data: fc }, { data: cli }, { data: emp }] = await Promise.all([
      supabase.from("metas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("receitas").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", hoje),
      supabase.from("custos_fixos").select("valor_mensal").eq("user_id", user.id),
      supabase.from("custos_variaveis").select("valor, data").eq("user_id", user.id).gte("data", inicioHist).lte("data", hoje),
      supabase.from("dividas").select("valor_total, valor_pago, taxa_juros").eq("user_id", user.id),
      supabase.from("fluxo_caixa").select("tipo, valor, data, status").eq("user_id", user.id).gte("data", inicioHist).lte("data", hoje),
      supabase.from("clientes").select("status, created_at").eq("user_id", user.id),
      supabase.from("empresas").select("regime_tributario").eq("user_id", user.id).limit(1).maybeSingle(),
    ]);

    const custoFixoMensalTotal = (cf || []).reduce((s, c) => s + Number(c.valor_mensal || 0), 0);
    const despesasFinanceirasMensal = (dv || []).reduce((s, d) => s + Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0)) * (Number(d.taxa_juros || 0) / 100), 0);

    const ctx: CtxMeta = {
      receitas: (rec || []).map(r => ({ valor: Number(r.valor || 0), data: r.data })),
      custosVar: (cv || []).map(c => ({ valor: Number(c.valor || 0), data: c.data })),
      custoFixoMensalTotal, despesasFinanceirasMensal,
      dividas: dv || [], fluxo: fc || [], clientes: cli || [],
      regimeTributario: emp?.regime_tributario || "",
    };

    const origemLabels: Record<TipoMeta, string> = {
      faturamento: t.receitas?.titulo || "Receitas", lucro: cx.dreLucroLiquido, margem: cx.dreMargemLiquida,
      reducao_custo: t.custosFixos?.titulo || "Custos", reducao_divida: t.endividamento?.titulo || "Dívidas",
      caixa: cx.saldoAtual, ticket_medio: cx.ticketMedio, num_clientes: t.clientes?.titulo || "Clientes",
    };

    // Sincroniza valor_atual (e promove status pra "concluida" automaticamente) — mesma tabela
    // que qualquer outro módulo (Dashboard/Relatórios/IA Financeira) poderá ler no futuro, sem
    // duplicar essa lógica em outro lugar (a lição do bug dividas/endividamento).
    const metasBrutas: MetaRow[] = (mt || []).map((m: any) => ({
      id: m.id, titulo: m.titulo, tipo_meta: m.tipo_meta || null,
      valor_meta: Number(m.valor_meta || 0), valor_inicial: Number(m.valor_inicial || 0), valor_atual: Number(m.valor_atual || 0),
      data_inicio: m.data_inicio || hoje, prazo: m.prazo || null,
      status: m.status === "em_andamento" ? "ativa" : (m.status || "ativa"),
      direcao: (m.direcao as DirecaoMeta) || (m.tipo_meta ? DIRECAO_PADRAO[m.tipo_meta as TipoMeta] : null),
      responsavel: m.responsavel || null, descricao: m.descricao || null,
    }));

    const atualizacoes: { id: string; valor_atual: number; status?: string }[] = [];
    const metasFinal = metasBrutas.map((m) => {
      if (!m.tipo_meta) return m;
      const { valor } = valorMetrica(m.tipo_meta, hoje, m.data_inicio, ctx, lang, origemLabels);
      const progressoPct = progressoPercentual(m.valor_inicial, valor, m.valor_meta);
      const novoStatus = m.status === "arquivada" ? "arquivada" : progressoPct >= 100 ? "concluida" : (m.status === "concluida" ? "concluida" : "ativa");
      if (valor !== m.valor_atual || novoStatus !== m.status) atualizacoes.push({ id: m.id, valor_atual: valor, status: novoStatus });
      return { ...m, valor_atual: valor, status: novoStatus };
    });

    if (atualizacoes.length > 0) {
      const resultados = await Promise.all(atualizacoes.map(a => supabase.from("metas").update({ valor_atual: a.valor_atual, status: a.status }).eq("id", a.id)));
      const erroSync = resultados.find(r => r.error)?.error;
      if (erroSync) console.error("Falha ao sincronizar valor_atual/status de metas:", erroSync.message);
    }

    setMetas(metasFinal);
    setReceitasRows(rec || []);
    setCustosFixosRows(cf || []);
    setCustosVarRows(cv || []);
    setDividasRows(dv || []);
    setFluxoCaixaRows(fc || []);
    setClientesRows(cli || []);
    setRegimeTributario(emp?.regime_tributario || "");
    setCarregando(false);
  };

  const ctxAtual: CtxMeta = {
    receitas: receitasRows.map(r => ({ valor: Number(r.valor || 0), data: r.data })),
    custosVar: custosVarRows.map(c => ({ valor: Number(c.valor || 0), data: c.data })),
    custoFixoMensalTotal: custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0),
    despesasFinanceirasMensal: dividasRows.reduce((s, d) => s + Math.max(0, d.valor_total - d.valor_pago) * (d.taxa_juros / 100), 0),
    dividas: dividasRows, fluxo: fluxoCaixaRows, clientes: clientesRows, regimeTributario,
  };
  const origemLabels: Record<TipoMeta, string> = {
    faturamento: t.receitas?.titulo || "Receitas", lucro: cx.dreLucroLiquido, margem: cx.dreMargemLiquida,
    reducao_custo: t.custosFixos?.titulo || "Custos", reducao_divida: t.endividamento?.titulo || "Dívidas",
    caixa: cx.saldoAtual, ticket_medio: cx.ticketMedio, num_clientes: t.clientes?.titulo || "Clientes",
  };

  const preencherValorInicialLive = (tipo: TipoMeta) => {
    const hoje = hojeISO();
    const v = valorMetrica(tipo, hoje, hoje, ctxAtual, lang, origemLabels).valor;
    setValorInicialInput(String(Math.round(v * 100) / 100));
    setDirecaoSel(DIRECAO_PADRAO[tipo]);
  };

  const abrirNovo = () => {
    setEditando(null); setTitulo(""); setTipoMetaSel("faturamento"); setValorMeta("");
    setPrazo(""); setResponsavelInput(""); setDescricaoInput(""); setErroModal(null);
    preencherValorInicialLive("faturamento");
    setModalAberto(true);
  };
  const abrirEdicao = (m: MetaRow) => {
    setEditando(m); setTitulo(m.titulo); setTipoMetaSel(m.tipo_meta || "faturamento");
    setValorMeta(String(m.valor_meta || "")); setPrazo(m.prazo || "");
    setResponsavelInput(m.responsavel || ""); setDescricaoInput(m.descricao || "");
    setErroModal(null);
    if (m.tipo_meta) {
      setValorInicialInput(String(m.valor_inicial)); setDirecaoSel(m.direcao || DIRECAO_PADRAO[m.tipo_meta]);
    } else {
      preencherValorInicialLive("faturamento"); // meta antiga sem tipo — reclassificando agora
    }
    setModalAberto(true);
  };
  const trocarTipoModal = (tipo: TipoMeta) => {
    setTipoMetaSel(tipo);
    if (!editando || !editando.tipo_meta) preencherValorInicialLive(tipo); // só recalcula em criação/reclassificação — meta já ativa mantém o tipo travado
  };
  const fecharModal = () => { setModalAberto(false); setEditando(null); setErroModal(null); };

  const direcaoInconsistente = valorMeta && valorInicialInput
    ? !validarDirecaoMeta(direcaoSel, parseFloat(valorInicialInput), parseFloat(valorMeta))
    : false;

  const salvar = async () => {
    if (!titulo || !valorMeta || !prazo || !valorInicialInput) return;
    setSalvando(true);
    setErroModal(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSalvando(false); setErroModal("Sessão expirada — faça login de novo."); return; }

    const camposComuns = {
      titulo, valor_meta: parseFloat(valorMeta), prazo, direcao: direcaoSel,
      responsavel: responsavelInput.trim() || null, descricao: descricaoInput.trim() || null,
    };

    let error;
    if (editando) {
      const payload: any = { ...camposComuns, valor_inicial: parseFloat(valorInicialInput) };
      if (!editando.tipo_meta) { // meta antiga sendo reclassificada agora — vira meta moderna
        payload.tipo_meta = tipoMetaSel;
        payload.data_inicio = hojeISO();
      }
      ({ error } = await supabase.from("metas").update(payload).eq("id", editando.id));
    } else {
      const hoje = hojeISO();
      ({ error } = await supabase.from("metas").insert({
        ...camposComuns, tipo_meta: tipoMetaSel, valor_inicial: parseFloat(valorInicialInput),
        valor_atual: parseFloat(valorInicialInput), data_inicio: hoje, status: "ativa", user_id: user.id,
      }));
    }

    setSalvando(false);
    if (error) { setErroModal(`${cx.metaErroSalvar} ${error.message}`); return; } // mantém o modal aberto com os dados preenchidos — nada se perde
    fecharModal(); await carregarTudo();
  };

  const excluir = async (id: string) => {
    const { error } = await supabase.from("metas").delete().eq("id", id);
    if (error) { console.error("Erro ao excluir meta:", error.message); return; }
    carregarTudo();
  };
  const arquivar = async (m: MetaRow) => {
    const { error } = await supabase.from("metas").update({ status: m.status === "arquivada" ? "ativa" : "arquivada" }).eq("id", m.id);
    if (error) { console.error("Erro ao arquivar meta:", error.message); return; }
    carregarTudo();
  };

  // ═══════════════════════ INTELIGÊNCIA CFO ═══════════════════════
  const hoje = hojeISO();
  const metasVisiveis = metas.filter(m => m.status !== "arquivada");
  const temDados = metasVisiveis.some(m => m.tipo_meta);

  const metasComputadas = metasVisiveis.filter(m => m.tipo_meta).map((m) => {
    const tipo = m.tipo_meta as TipoMeta;
    const { raciocinio } = valorMetrica(tipo, hoje, m.data_inicio, ctxAtual, lang, origemLabels);
    const ritmo = calcularRitmoMeta({ valorInicial: m.valor_inicial, valorMeta: m.valor_meta, valorAtual: m.valor_atual, dataInicio: m.data_inicio, prazo: m.prazo || hoje, hoje });
    const progReal = progressoPercentual(m.valor_inicial, m.valor_atual, m.valor_meta);
    const progEspValor = progressoEsperado(m.valor_inicial, ritmo.ritmoNecessarioMensal, ritmo.mesesDecorridos);
    const progEspPct = progressoPercentual(m.valor_inicial, progEspValor, m.valor_meta);
    const semaforo: CorSaude = semaforoMeta(progReal, progEspPct);
    const marco = marcoAlcancado(Math.min(100, Math.max(0, progReal)));
    const fechamentoValor = projetarFechamentoMeta(m.valor_atual, ritmo.ritmoAtualMensal, ritmo.mesesRestantes);
    const fechamentoPct = progressoPercentual(m.valor_inicial, fechamentoValor, m.valor_meta);
    const serieHist = serieHistoricaMetrica(tipo, ctxAtual, hoje, 12);
    const ritmoHist = ritmoHistoricoMedio(serieHist);
    const classificacao = detectarMetaIrreal({ valorInicial: m.valor_inicial, valorMeta: m.valor_meta, ritmoNecessarioMensal: ritmo.ritmoNecessarioMensal, ritmoHistoricoMedioMensal: ritmoHist, mesesTotais: ritmo.mesesTotais });
    const faltamValor = traduzirMetaEmDinheiro(m.valor_atual, m.valor_meta);
    const ritmoNecessarioRestante = ritmo.mesesRestantes > 0.1 ? (m.valor_meta - m.valor_atual) / ritmo.mesesRestantes : (m.valor_meta - m.valor_atual);
    const diasRestantes = m.prazo ? diasEntre(hoje, m.prazo) : null;
    return { ...m, tipo, raciocinio, ritmo, progReal, progEspPct, semaforo, marco, fechamentoPct, classificacao, faltamValor, ritmoNecessarioRestante, diasRestantes };
  });

  const legado = metasVisiveis.filter(m => !m.tipo_meta);

  // KPIs
  const noRitmo = metasComputadas.filter(m => m.semaforo === "verde" && m.status === "ativa").length;
  const emRisco = metasComputadas.filter(m => m.semaforo === "vermelho" && m.status === "ativa").length;
  const valorEmJogo = metasComputadas.filter(m => m.status === "ativa").reduce((s, m) => s + Math.abs(m.faltamValor), 0);
  const totalHistorico = metas.length;
  const taxaSucesso = totalHistorico > 0 ? (metas.filter(m => m.status === "concluida").length / totalHistorico) * 100 : 0;
  const proximaPrazo = metasComputadas.filter(m => m.status === "ativa" && m.diasRestantes !== null).sort((a, b) => (a.diasRestantes! - b.diasRestantes!))[0];
  const marcosConquistados = metasComputadas.filter(m => m.marco >= 25).length;

  const kpisCFO = [
    { l: cx.metaKpiNoRitmo, v: String(noRitmo), c: CORES.verde, i: "🎯" },
    { l: cx.metaKpiEmRisco, v: String(emRisco), c: CORES.vermelho, i: "⚠️" },
    { l: cx.metaKpiValorEmJogo, v: fBRL(valorEmJogo), c: CORES.roxo, i: "💎" },
    { l: cx.metaKpiTaxaSucesso, v: fPct(taxaSucesso), c: taxaSucesso >= 60 ? CORES.verde : taxaSucesso >= 30 ? CORES.amarelo : CORES.vermelho, i: "📈" },
    { l: cx.metaKpiProximaPrazo, v: proximaPrazo ? `${proximaPrazo.diasRestantes}d` : "—", c: CORES.ouro, i: "⏳" },
    { l: cx.metaKpiMarcos, v: String(marcosConquistados), c: CORES.ouroC, i: "🏆" },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.metaKpiNoRitmo}: ${noRitmo}`, `${cx.metaKpiEmRisco}: ${emRisco}`,
    `${cx.metaKpiValorEmJogo}: ${fBRL(valorEmJogo)}`, `${cx.metaKpiTaxaSucesso}: ${fPct(taxaSucesso)}`,
  ];

  // Árvore de dependência
  const arvore = conectarMetas(metasComputadas.map(m => ({ tipoMeta: m.tipo, corSemaforo: m.semaforo })));
  const narrativasDependencia = arvore.map(a => {
    const match = metasComputadas.find(m => m.tipo === a.tipoMeta);
    return match ? montarNarrativaDependencia(lang, match.titulo, a) : null;
  }).filter(Boolean) as string[];

  // Conselho CFO
  const gatilhos = gerarConselhoMeta(metasComputadas.filter(m => m.status === "ativa").map(m => ({
    titulo: m.titulo, progressoPct: m.progReal, corSemaforo: m.semaforo,
    ritmoAtualMensal: m.ritmo.ritmoAtualMensal, ritmoNecessarioRestante: m.ritmoNecessarioRestante,
    faltamValor: m.faltamValor, classificacao: m.classificacao.classificacao, sugestaoAlvo: m.classificacao.sugestaoAlvo ?? 0,
  })));
  const conselhos = gatilhos.map(g => montarConselhoMeta(lang, g));

  // Gráficos
  const metasAtivasComputadas = metasComputadas.filter(m => m.status === "ativa");
  const optProgresso = optProgressoMetas(
    metasAtivasComputadas.map(m => m.titulo.length > 12 ? m.titulo.slice(0, 11) + "…" : m.titulo),
    metasAtivasComputadas.map(m => Math.round(Math.min(140, Math.max(-20, m.progReal)))),
    metasAtivasComputadas.map(m => Math.round(Math.min(140, Math.max(-20, m.progEspPct)))),
    cx.metaProgressoReal, cx.metaProgressoEsperadoLabel
  );

  const statusRosca = [
    { name: cx.metaSemaforoVerde, value: metasAtivasComputadas.filter(m => m.semaforo === "verde").length, color: CORES.verde },
    { name: cx.metaSemaforoAmarelo, value: metasAtivasComputadas.filter(m => m.semaforo === "amarelo").length, color: CORES.amarelo },
    { name: cx.metaSemaforoVermelho, value: metasAtivasComputadas.filter(m => m.semaforo === "vermelho").length, color: CORES.vermelho },
  ].filter(s => s.value > 0);
  const optStatus = optRosca(statusRosca, CORES.roxo, cx.total);

  // Evolução da meta em destaque (mais próxima do prazo) — real até hoje vs trajetória necessária
  const metaDestaque = proximaPrazo;
  let optEvolucao: any = null;
  if (metaDestaque) {
    const serieReal = serieHistoricaMetrica(metaDestaque.tipo, ctxAtual, hoje, 12);
    const labelsEvolucao = Array.from({ length: serieReal.length }, (_, i) => `M${i - serieReal.length + 1}`);
    const necessarioLinha = Array.from({ length: serieReal.length }, (_, i) =>
      metaDestaque.valor_inicial + metaDestaque.ritmo.ritmoNecessarioMensal * (metaDestaque.ritmo.mesesDecorridos - (serieReal.length - 1 - i))
    );
    optEvolucao = optLinhaMulti([
      { nome: cx.metaProgressoReal, dados: serieReal, cor: CORES.roxo, area: true },
      { nome: cx.metaRitmoNecessario, dados: necessarioLinha, cor: CORES.ouro, tipo: "dashed" },
    ], labelsEvolucao, CORES.roxo);
  }

  // ═══════════════════════ PDF ═══════════════════════
  const exportarPDF = async () => {
    setExportando(true);
    try {
      const fmtN = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      gerarPdfTabela({
        titulo: txt.titulo, subtitulo: txt.subtitulo,
        colunas: [
          { header: "Meta", key: "meta", width: 4 }, { header: "Tipo", key: "tipo", width: 3 },
          { header: "Prazo", key: "prazo", width: 2 }, { header: "Status", key: "status", width: 2 },
          { header: "Alvo (R$)", key: "alvo", width: 2, align: "right" }, { header: "Atual (R$)", key: "atual", width: 2, align: "right" },
        ],
        linhas: metasVisiveis.map((m) => ({
          meta: m.titulo, tipo: m.tipo_meta ? nomeTipoMeta(lang, m.tipo_meta) : "—",
          prazo: m.prazo ? fmtData(lang, m.prazo) : "-", status: m.status,
          alvo: fmtN(m.valor_meta), atual: fmtN(m.valor_atual),
        })),
        resumo: [
          { label: txt.totalMetas, valor: `${metasVisiveis.length}` },
          { label: cx.metaKpiNoRitmo, valor: `${noRitmo}` },
          { label: cx.metaKpiEmRisco, valor: `${emRisco}` },
          { label: cx.metaKpiTaxaSucesso, valor: fPct(taxaSucesso) },
        ],
        nomeArquivo: `axioma-metas-${hoje}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${txt.titulo}`,
    `🎯 ${cx.metaKpiNoRitmo}: ${noRitmo}  ⚠️ ${cx.metaKpiEmRisco}: ${emRisco}`,
    `📈 ${cx.metaKpiTaxaSucesso}: ${fPct(taxaSucesso)}`,
    conselhos[0] ? `✨ ${conselhos[0]}` : "",
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${txt.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  const metasFiltradas = metasVisiveis.filter(m => m.titulo.toLowerCase().includes(busca.toLowerCase()));

  const SubChart = ({ titulo: t2, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-[13px] font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{t2}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  return (
    <ModuloLayout titulo={txt.titulo} subtitulo={txt.subtitulo}
      onExportarPDF={exportarPDF} exportando={exportando} onNovo={abrirNovo} labelBotao={txt.novo}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-end gap-3">
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            <Share2 size={16} /> {cx.compartilhar}
          </motion.button>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: txt.totalMetas, value: String(metasVisiveis.length), cor: CORES.roxo },
            { label: txt.concluidas, value: String(metas.filter(m => m.status === "concluida").length), cor: CORES.verde },
            { label: cx.metaKpiValorEmJogo, value: fBRL(valorEmJogo), cor: CORES.ouro },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-2xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {!temDados ? (
          <CanvasBox cor={CORES.roxo}>
            <div className="flex flex-col items-center justify-center py-16">
              <Target size={48} style={{ color: CORES.roxo, opacity: 0.5 }} className="mb-4" />
              <p className="text-sm text-center" style={{ color: "#5a7a9a" }}>{txt.semMetas}</p>
            </div>
          </CanvasBox>
        ) : (
          <>
            {/* KPIs CFO */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {kpisCFO.map((k, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="rounded-2xl p-3 md:p-4"
                  style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${k.c}25`, boxShadow: "0 4px 20px rgba(0,0,0,0.35)" }}>
                  <div className="flex items-center justify-between mb-1.5"><span className="text-base">{k.i}</span></div>
                  <p className="text-sm md:text-lg font-black tracking-tight" style={{ color: k.c, ...FONTE_EXEC }}>{k.v}</p>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-wider font-bold mt-0.5" style={{ color: "#64748b" }}>{k.l}</p>
                </motion.div>
              ))}
            </div>

            {/* Letreiro */}
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.14), rgba(212,175,55,0.10))", border: "1px solid rgba(139,92,246,0.24)" }}>
              <div className="marquee-meta py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#c4b5fd" : "#e2e8f0" }}>{m}<span style={{ color: CORES.roxo }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-meta{animation:marqueeMeta 30s linear infinite}@keyframes marqueeMeta{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-meta:hover{animation-play-state:paused}`}</style>
            </div>

            {/* ÁRVORE DE DEPENDÊNCIA */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={16} style={{ color: CORES.roxo }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.metaArvoreTitulo}</p>
              </div>
              {narrativasDependencia.length > 0 ? (
                <div className="space-y-2">
                  {narrativasDependencia.map((n, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <GitBranch size={14} style={{ color: CORES.vermelho, flexShrink: 0 }} />
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: "#fca5a5" }}>{n}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-[13px]" style={{ color: "#6ee7b7" }}>{cx.metaSemDependencia}</p>
              )}
            </div>

            {/* MODAL ÚNICO — Progresso, Status, Evolução */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#8b5cf6,#d4af37)", boxShadow: "0 0 12px #8b5cf6" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.metaModalAnaliseTitulo}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.metaModalAnaliseSub}</p>
                  </div>
                </div>

                {optEvolucao && (
                  <div className="mb-4">
                    <SubChart titulo={`${cx.metaGraficoEvolucao} — ${metaDestaque!.titulo}`} cor={CORES.roxo} option={optEvolucao} altura={260} />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metasAtivasComputadas.length > 0 && <SubChart titulo={cx.metaGraficoProgresso} cor={CORES.roxo} option={optProgresso} altura={240} />}
                  {statusRosca.length > 0 && <SubChart titulo={cx.metaGraficoStatus} cor={CORES.ouro} option={optStatus} altura={240} />}
                </div>
              </div>
            </div>

            {/* CONSELHO CFO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.metaConselhoTitulo}</p>
              </div>
              {conselhos.length > 0 ? (
                <div className="space-y-2">
                  {conselhos.map((s, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                      <Sparkles size={15} style={{ color: CORES.ouro, flexShrink: 0 }} />
                      <p className="text-xs md:text-[13px] font-medium" style={{ color: "#f0d878" }}>{s}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{cx.metaSemGatilho}</p>
              )}
            </div>
          </>
        )}

        {legado.length > 0 && (
          <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", color: "#fde68a" }}>
            {cx.metaSemTipoAviso}
          </div>
        )}

        {/* Busca */}
        <CanvasBox cor="#3b6fd4">
          <div className="flex items-center gap-2 py-1">
            <Target size={16} style={{ color: "#5a7a9a" }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={txt.buscar}
              className="bg-transparent flex-1 focus:outline-none text-sm" style={{ color: "#c8d8f0" }} />
          </div>
        </CanvasBox>

        {/* Cards de meta */}
        {carregando ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : metasFiltradas.length === 0 ? (
          <CanvasBox cor={CORES.roxo}>
            <div className="text-center py-8"><p style={{ color: "#5a7a9a" }}>{txt.semMetas}</p></div>
          </CanvasBox>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {metasFiltradas.map((m, i) => {
              const c = metasComputadas.find(x => x.id === m.id);
              const concluida = m.status === "concluida";
              const arquivada = m.status === "arquivada";
              const corSemaforo = c ? (c.semaforo === "verde" ? CORES.verde : c.semaforo === "amarelo" ? CORES.amarelo : CORES.vermelho) : "#6ab0ff";
              return (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <CanvasBox cor={concluida ? CORES.ouro : corSemaforo}>
                    <div style={{ opacity: arquivada ? 0.6 : 1 }}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="min-w-0 mr-2">
                          <h3 className="font-bold text-sm mb-1 truncate" style={{ color: "#c8d8f0" }}>{m.titulo}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.12)", color: CORES.roxoC, border: "1px solid rgba(139,92,246,0.25)" }}>
                              {m.tipo_meta ? nomeTipoMeta(lang, m.tipo_meta) : "—"}
                            </span>
                            {c && !concluida && !arquivada && (
                              <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: `${corSemaforo}18`, color: corSemaforo }}>
                                <span className="inline-block rounded-full" style={{ width: 6, height: 6, background: corSemaforo }} />
                                {c.semaforo === "verde" ? cx.metaSemaforoVerde : c.semaforo === "amarelo" ? cx.metaSemaforoAmarelo : cx.metaSemaforoVermelho}
                              </span>
                            )}
                            {c && c.classificacao.classificacao !== "realista" && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(234,179,8,0.12)", color: CORES.amarelo }}>
                                {c.classificacao.classificacao === "facil" ? cx.metaClassificacaoFacil : cx.metaClassificacaoImpossivel}
                              </span>
                            )}
                            {m.responsavel && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(148,163,184,0.1)", color: "#cbd5e1" }}>
                                👤 {m.responsavel}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirEdicao(m)}><Pencil size={16} style={{ color: "#6ab0ff" }} /></motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => arquivar(m)}>
                            {arquivada ? <ArchiveRestore size={16} style={{ color: "#34d399" }} /> : <Archive size={16} style={{ color: "#94a3b8" }} />}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => excluir(m.id)}><Trash2 size={16} style={{ color: "#f87171" }} /></motion.button>
                        </div>
                      </div>

                      <p className="text-2xl font-black mb-0.5" style={{ color: concluida ? CORES.ouro : "#e2e8f0" }}>
                        {formatarValorMeta(m.tipo_meta, m.valor_meta)}
                      </p>
                      <p className="text-[11px] mb-1" style={{ color: "#5a7a9a" }}>
                        {cx.metaDeParaLabel} {formatarValorMeta(m.tipo_meta, m.valor_inicial)} {cx.metaParaLabel} {formatarValorMeta(m.tipo_meta, m.valor_meta)}
                      </p>
                      {m.descricao && <p className="text-xs mb-2 italic" style={{ color: "#94a3b8" }}>{m.descricao}</p>}

                      {c && (
                        <>
                          <div className="mb-3">
                            <div className="flex justify-between text-xs mb-1" style={{ color: "#5a7a9a" }}>
                              <span>{formatarValorMeta(m.tipo_meta, m.valor_atual)}</span>
                              <span>{c.progReal.toFixed(0)}% {cx.metaProgressoReal.toLowerCase()} · {c.progEspPct.toFixed(0)}% {cx.metaProgressoEsperadoLabel.toLowerCase()}</span>
                            </div>
                            <div className="relative w-full h-2 rounded-full" style={{ background: "rgba(59,111,212,0.1)" }}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100, c.progReal))}%` }}
                                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + i * 0.06 }}
                                className="h-2 rounded-full" style={{ background: concluida ? `linear-gradient(90deg, ${CORES.ouro}, ${CORES.ouroC})` : `linear-gradient(90deg, ${corSemaforo}, ${corSemaforo}cc)` }} />
                              <span className="absolute top-0 h-2 w-0.5" style={{ left: `${Math.max(0, Math.min(100, c.progEspPct))}%`, background: "#fff", opacity: 0.6 }} />
                            </div>
                          </div>

                          {!concluida && !arquivada && (
                            <p className="text-xs leading-relaxed mb-2" style={{ color: "#94a3b8" }}>
                              {montarNarrativaRitmo(lang, {
                                necessarioFmt: formatarValorMeta(m.tipo_meta, Math.abs(c.ritmoNecessarioRestante)),
                                atualFmt: formatarValorMeta(m.tipo_meta, Math.abs(c.ritmo.ritmoAtualMensal)),
                                faltaFmt: null,
                              })}
                            </p>
                          )}
                          {!concluida && !arquivada && (
                            <p className="text-xs leading-relaxed mb-2" style={{ color: c.fechamentoPct >= 100 ? "#6ee7b7" : "#fca5a5" }}>
                              {montarNarrativaProjecaoMeta(lang, c.fechamentoPct)}
                            </p>
                          )}
                          {!concluida && c.classificacao.classificacao !== "realista" && c.classificacao.sugestaoAlvo !== null && (
                            <p className="text-xs leading-relaxed mb-2" style={{ color: CORES.amarelo }}>
                              {montarNarrativaMetaIrreal(lang, c.classificacao.classificacao as "facil" | "impossivel", formatarValorMeta(m.tipo_meta, c.classificacao.sugestaoAlvo))}
                            </p>
                          )}
                          <details className="text-xs mb-2">
                            <summary className="cursor-pointer select-none" style={{ color: "#64748b" }}>{cx.metaRaciocinioTitulo}</summary>
                            <p className="mt-1" style={{ color: "#94a3b8" }}>{c.raciocinio}</p>
                          </details>
                        </>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs" style={{ color: "#3a6090" }}>{m.prazo ? fmtData(lang, m.prazo) : "—"}</p>
                        {concluida && <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "rgba(212,175,55,0.15)", color: CORES.ouro }}><Trophy size={11} /> {cx.metaConcluidaAuto}</span>}
                        {arquivada && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(148,163,184,0.12)", color: "#94a3b8" }}>{cx.metaArquivada}</span>}
                      </div>
                    </div>
                  </CanvasBox>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal criar/editar */}
      <AnimatePresence>
        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
              <CanvasBox cor={CORES.roxo}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: CORES.roxoC }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0", ...FONTE_EXEC }}>{editando ? txt.editar : txt.novo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModal} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.nomeMeta}</label>
                    <input value={titulo} onChange={e => setTitulo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.tipoLabel}</label>
                    <select value={tipoMetaSel} onChange={e => trocarTipoModal(e.target.value as TipoMeta)}
                      disabled={!!editando && !!editando.tipo_meta}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm disabled:opacity-50"
                      style={{ background: "rgba(10,22,40,0.9)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }}>
                      {TIPOS_META.map(tp => <option key={tp} value={tp}>{nomeTipoMeta(lang, tp)}</option>)}
                    </select>
                    {!!editando && !!editando.tipo_meta && <p className="text-[10px] mt-1.5" style={{ color: "#64748b" }}>{txt.tipoTravado}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.metaValorInicialLabel}</label>
                      <input type="number" value={valorInicialInput} onChange={e => setValorInicialInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.valorAlvoLabel}</label>
                      <input type="number" value={valorMeta} onChange={e => setValorMeta(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                    </div>
                  </div>
                  <p className="text-[10px] -mt-2" style={{ color: "#64748b" }}>{cx.metaValorInicialAjuda}</p>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.metaDirecaoLabel}</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["aumentar", "reduzir"] as DirecaoMeta[]).map(d => (
                        <motion.button key={d} type="button" whileTap={{ scale: 0.97 }} onClick={() => setDirecaoSel(d)}
                          className="py-2.5 rounded-xl text-xs font-semibold"
                          style={{ background: direcaoSel === d ? "rgba(139,92,246,0.2)" : "rgba(59,111,212,0.05)", color: direcaoSel === d ? CORES.roxoC : "#5a7a9a", border: `1px solid ${direcaoSel === d ? "rgba(139,92,246,0.4)" : "rgba(59,111,212,0.1)"}` }}>
                          {d === "aumentar" ? cx.metaDirecaoAumentar : cx.metaDirecaoReduzir}
                        </motion.button>
                      ))}
                    </div>
                    {direcaoInconsistente && <p className="text-[11px] mt-1.5" style={{ color: CORES.amarelo }}>{cx.metaDirecaoInconsistente}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{txt.prazoLabel}</label>
                    <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.metaResponsavelLabel}</label>
                    <input value={responsavelInput} onChange={e => setResponsavelInput(e.target.value)} placeholder={cx.metaResponsavelPlaceholder}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: "#5a8fd4" }}>{cx.metaDescricaoLabel}</label>
                    <textarea value={descricaoInput} onChange={e => setDescricaoInput(e.target.value)} placeholder={cx.metaDescricaoPlaceholder} rows={2}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(59,111,212,0.2)", color: "#c8d8f0" }} />
                  </div>
                  {erroModal && (
                    <div className="rounded-xl px-3 py-2.5 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
                      {erroModal}
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={fecharModal} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(59,111,212,0.1)", color: "#5a7a9a" }}>{txt.cancelar}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={salvar} disabled={salvando}
                      className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                      style={{ background: `linear-gradient(135deg, #4c1d95, ${CORES.roxo})`, color: "#fff" }}>
                      {salvando ? "..." : txt.salvar}
                    </motion.button>
                  </div>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centro de Compartilhamento */}
      <AnimatePresence>
        {shareAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => setShareAberto(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor="#8b5cf6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#c4b5fd" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.centroCompart}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canais.map(c => (
                    <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                      style={{ background: `${c.cor}18`, border: `1px solid ${c.cor}50`, color: c.cor }}>{c.nome}</a>
                  ))}
                  <button onClick={copiar} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.4)", color: "#cbd5e1" }}>{copiado ? cx.copiado : cx.copiar}</button>
                  <button onClick={() => { setShareAberto(false); exportarPDF(); }} className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-105" style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.4)", color: "#fdba74" }}>PDF</button>
                </div>
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}
