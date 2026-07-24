"use client";
import { useState, useEffect } from "react";
import { Share2, AlertTriangle, Sparkles, Zap, MessageSquareText, History, X, ShieldCheck, Clock } from "lucide-react";
import { useLanguage } from "../../../lib/LanguageContext";
import { createBrowserClient } from "@supabase/ssr";
import ModuloLayout from "../../../components/ModuloLayout";
import { CanvasBox } from "../../../components/CanvasBox";
import { gerarPdfTabela } from "../../../lib/gerarPdfTabela";
import { motion, AnimatePresence } from "framer-motion";
import ReactECharts from "echarts-for-react";
import SeletorPeriodo from "../../../components/SeletorPeriodo";
import {
  fBRL, fPct, CORES, FONTE_EXEC,
  serieRolling, concentracao,
  pontoEquilibrio, margemSeguranca, pesoSobreReceita,
  resolverPeriodo, periodoAnterior, filtrarPorPeriodo, compararPeriodosPorCategoria, detectarAnomaliasHistoricas,
  montarDRE, decomporVariacaoLucro, ponteLucroCaixa, calcularSinaisSaude, semaforoSaude,
  mesesQuedaConsecutiva, runwayCritico, gerarConselhoCFO, projetarDRE, optCascata,
  type Lancamento, type Periodo, type PeriodoPreset, type DRE,
  type FatorVariacaoLucro, type AnomaliaHistorica, type ItemCascata, type CorSaude,
} from "../../../lib/cfoCore";
import {
  cfoT, canaisCompartilhamento, montarNarrativaCausaRaiz, montarNarrativaPonte,
  montarNarrativaRunway, montarConselhoCFO,
} from "../../../lib/cfoTextos";
import { obterEmpresaAtiva } from "../../../lib/empresaHelpers";
import { carregarBenchmark, type BenchmarkSetor } from "../../../lib/iaFinanceiraHelpers";
import { calcularImpostoRegime } from "../../../lib/iaTributariaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const categoriasReceita = ["Vendas de produtos", "Prestação de serviços", "Recorrentes", "Eventuais", "Outras"];
const categoriasCustoFixo = ["Aluguel/Imóvel", "Folha de pagamento", "Serviços essenciais", "Sistemas e assinaturas", "Seguros", "Contabilidade", "Outros"];

// Presets "fecháveis" — únicos que geram snapshot no histórico. "Últimos 12 meses" é
// janela rolante (nunca fecha) e "Personalizado" é arbitrário — nenhum dos dois vira arquivo.
const PRESETS_FECHAVEIS: PeriodoPreset[] = ["mes_atual", "mes_anterior", "trimestre_atual", "ano_atual"];

function isoHoje(): string { return new Date().toISOString().slice(0, 10); }

// Janela de 24 meses pra trás — cobre os 12 meses de série histórica (semáforo/runway/
// projeção) mais os 12 meses adicionais que a série rolante pode precisar de contexto.
function inicioJanelaHistorica(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 23, 1).toISOString().slice(0, 10);
}

// Receita bruta dos últimos 12 meses terminando no fim do período — base da faixa do Simples Nacional.
function inicioRolling12(fimPeriodo: string): string {
  const fim = new Date(fimPeriodo + "T00:00:00");
  return new Date(fim.getFullYear(), fim.getMonth() - 11, 1).toISOString().slice(0, 10);
}

function mesesNoPeriodo(periodo: Periodo): number {
  const ini = new Date(periodo.inicio + "T00:00:00");
  const fim = new Date(periodo.fim + "T00:00:00");
  const dias = (fim.getTime() - ini.getTime()) / 86400000;
  return Math.max(1, Math.round(dias / 30));
}

type ReceitaRow = { valor: number; data: string; categoria: string };
type CustoVarRow = { descricao: string; valor: number; data: string; categoria: string };
type CustoFixoRow = { descricao: string; valor_mensal: number; categoria: string };
type DividaRow = { valor_total: number; valor_pago: number; parcelas: number; taxa_juros: number };
type FluxoCaixaRow = { tipo: string; valor: number; data: string; status: string };
type ContaReceberRow = { valor: number; valor_recebido: number; status: string; data_vencimento: string };
type HistoricoRow = {
  id: string; periodo_inicio: string; periodo_fim: string; periodo_label: string;
  receita_bruta: number; deducoes: number; receita_liquida: number; custo_variavel: number;
  margem_contribuicao: number; custo_fixo: number; ebitda: number; despesas_financeiras: number;
  lucro_liquido: number; margem_bruta_pct: number; margem_liquida_pct: number; semaforo_cor: CorSaude;
  resultado_completo: any;
};

const CorSemaforo = ({ cor, size = 12 }: { cor: CorSaude; size?: number }) => (
  <span
    className="inline-block rounded-full flex-shrink-0"
    style={{
      width: size, height: size,
      background: cor === "verde" ? CORES.verde : cor === "amarelo" ? CORES.amarelo : CORES.vermelho,
      boxShadow: `0 0 10px ${cor === "verde" ? CORES.verde : cor === "amarelo" ? CORES.amarelo : CORES.vermelho}`,
    }}
  />
);

export default function DREPage() {
  const { t, idioma } = useLanguage();
  const lang = (idioma as "pt" | "en" | "es") || "pt";
  const cx = cfoT(lang);
  const d = t.dre;

  const [carregando, setCarregando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [shareAberto, setShareAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [snapshotSelecionado, setSnapshotSelecionado] = useState<HistoricoRow | null>(null);

  const [receitasRows, setReceitasRows] = useState<ReceitaRow[]>([]);
  const [custosVarRows, setCustosVarRows] = useState<CustoVarRow[]>([]);
  const [custosFixosRows, setCustosFixosRows] = useState<CustoFixoRow[]>([]);
  const [dividasRows, setDividasRows] = useState<DividaRow[]>([]);
  const [fluxoCaixaRows, setFluxoCaixaRows] = useState<FluxoCaixaRow[]>([]);
  const [contasReceberRows, setContasReceberRows] = useState<ContaReceberRow[]>([]);
  const [regimeTributario, setRegimeTributario] = useState("");
  const [benchmark, setBenchmark] = useState<BenchmarkSetor | null>(null);
  const [historico, setHistorico] = useState<HistoricoRow[]>([]);

  const [presetPeriodo, setPresetPeriodo] = useState<PeriodoPreset>("mes_atual");
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo("mes_atual"));
  const periodo = resolverPeriodo(presetPeriodo, personalizado);
  const periodoAnt = periodoAnterior(periodo);

  useEffect(() => { carregarTudo(); }, [presetPeriodo, personalizado.inicio, personalizado.fim]);
  useEffect(() => { if (userId) carregarHistorico(userId); }, [userId]);

  async function carregarTudo() {
    setCarregando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setCarregando(false); return; }
    setUserId(user.id);
    const empId = await obterEmpresaAtiva();
    setEmpresaId(empId);

    const inicioHist = inicioJanelaHistorica(periodo.fim);

    const [{ data: rec }, { data: cv }, { data: cf }, { data: dv }, { data: fc }, { data: cr }, { data: emp }] = await Promise.all([
      supabase.from("receitas").select("valor, data, categoria").gte("data", inicioHist).lte("data", periodo.fim),
      supabase.from("custos_variaveis").select("descricao, valor, data, categoria").gte("data", inicioHist).lte("data", periodo.fim),
      supabase.from("custos_fixos").select("descricao, valor_mensal, categoria"),
      // Leitura só (SELECT) — base das despesas financeiras (juros) e da amortização estimada. Nunca escreve em "dividas".
      supabase.from("dividas").select("valor_total, valor_pago, parcelas, taxa_juros"),
      // Leitura só (SELECT) — caixa realmente movimentado no período, base da Ponte Lucro x Caixa.
      supabase.from("fluxo_caixa").select("tipo, valor, data, status").gte("data", periodo.inicio).lte("data", periodo.fim),
      // Leitura só (SELECT) — recebíveis parados, base da Ponte Lucro x Caixa e do Conselho CFO.
      supabase.from("contas_receber").select("valor, valor_recebido, status, data_vencimento").neq("status", "recebido"),
      empId ? supabase.from("empresas").select("regime_tributario, setor, cnae_principal").eq("id", empId).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    setReceitasRows(rec || []);
    setCustosVarRows(cv || []);
    setCustosFixosRows(cf || []);
    setDividasRows(dv || []);
    setFluxoCaixaRows(fc || []);
    setContasReceberRows(cr || []);
    setRegimeTributario(emp?.regime_tributario || "");
    const setor = emp?.setor || emp?.cnae_principal || "";
    const bm = await carregarBenchmark(setor);
    setBenchmark(bm);
    setCarregando(false);
  }

  async function carregarHistorico(uid: string) {
    const { data } = await supabase.from("dre_historico").select("*").order("periodo_fim", { ascending: false }).limit(24);
    setHistorico((data as HistoricoRow[]) || []);
  }

  const temDados = receitasRows.length > 0 || custosVarRows.length > 0;

  // ═══════════════════════ CASCATA DO PERÍODO ATUAL × ANTERIOR ═══════════════════════
  const receitasItens: Lancamento[] = receitasRows.map(r => ({ valor: r.valor, data: r.data, categoria: r.categoria }));
  const custoVarItens: Lancamento[] = custosVarRows.map(c => ({ valor: c.valor, data: c.data, categoria: c.categoria, descricao: c.descricao }));

  const receitasNoPeriodo = filtrarPorPeriodo(receitasItens, periodo);
  const receitasNoPeriodoAnt = filtrarPorPeriodo(receitasItens, periodoAnt);
  const custoVarNoPeriodo = filtrarPorPeriodo(custoVarItens, periodo);
  const custoVarNoPeriodoAnt = filtrarPorPeriodo(custoVarItens, periodoAnt);

  const somaValor = (arr: Lancamento[]) => arr.reduce((a, r) => a + (Number(r.valor) || 0), 0);

  const receitaBrutaAtual = somaValor(receitasNoPeriodo);
  const receitaBrutaAnt = somaValor(receitasNoPeriodoAnt);
  const custoVarAtual = somaValor(custoVarNoPeriodo);
  const custoVarAnt = somaValor(custoVarNoPeriodoAnt);

  const meses = mesesNoPeriodo(periodo);
  const mesesAnt = mesesNoPeriodo(periodoAnt);

  const custoFixoMensalTotal = custosFixosRows.reduce((s, c) => s + Number(c.valor_mensal || 0), 0);
  const custoFixoAtual = custoFixoMensalTotal * meses;
  const custoFixoAnt = custoFixoMensalTotal * mesesAnt;

  // Despesas financeiras = juros sobre o saldo devedor das dívidas (mesma fórmula do Relatórios,
  // única fonte de verdade). Aproximação: usa o saldo devedor atual pra ambos os períodos —
  // não há histórico de saldo devedor dia a dia.
  const despesasFinanceirasMensal = dividasRows.reduce((s, dvv) => {
    const saldoDevedor = Math.max(0, Number(dvv.valor_total || 0) - Number(dvv.valor_pago || 0));
    return s + saldoDevedor * (Number(dvv.taxa_juros || 0) / 100);
  }, 0);
  const despesasFinanceirasAtual = despesasFinanceirasMensal * meses;
  const despesasFinanceirasAnt = despesasFinanceirasMensal * mesesAnt;

  // Imposto real pelo regime tributário da empresa (IA Tributária) — nunca mais um % fixo chutado.
  const inicioRb12 = inicioRolling12(periodo.fim);
  const rb12 = somaValor(receitasItens.filter(r => r.data >= inicioRb12 && r.data <= periodo.fim));
  const receitaMensalMedia = receitaBrutaAtual / meses;
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, rb12, receitaMensalMedia);
  const aliquotaEfetivaPct = receitaMensalMedia > 0 ? (impostoMensalEstimado / receitaMensalMedia) * 100 : 0;
  const deducoesAtual = impostoMensalEstimado * meses;
  const deducoesAnt = impostoMensalEstimado * mesesAnt; // aproximação: mesma alíquota efetiva do período atual

  const dreAtual: DRE = montarDRE({ receitaBruta: receitaBrutaAtual, deducoes: deducoesAtual, custoVariavel: custoVarAtual, custoFixo: custoFixoAtual, despesasFinanceiras: despesasFinanceirasAtual });
  const dreAnterior: DRE = montarDRE({ receitaBruta: receitaBrutaAnt, deducoes: deducoesAnt, custoVariavel: custoVarAnt, custoFixo: custoFixoAnt, despesasFinanceiras: despesasFinanceirasAnt });

  // ═══════════════════════ SÉRIE HISTÓRICA (semáforo, runway, projeção) ═══════════════════════
  const serieReceitaHist = serieRolling(receitasItens, 12, periodo.fim);
  const serieCustoVarHist = serieRolling(custoVarItens, 12, periodo.fim);
  const serieDREHist: DRE[] = serieReceitaHist.map((b, i) => montarDRE({
    receitaBruta: b.value,
    deducoes: calcularImpostoRegime(regimeTributario, rb12, b.value),
    custoVariavel: serieCustoVarHist[i]?.value || 0,
    custoFixo: custoFixoMensalTotal,
    despesasFinanceiras: despesasFinanceirasMensal,
  }));
  const serieEbitdaHist = serieDREHist.map(dd => dd.ebitda.valor);
  const serieLucroLiquidoHist = serieDREHist.map(dd => dd.lucroLiquido.valor);
  const mesesQuedaEbitda = mesesQuedaConsecutiva(serieEbitdaHist);
  const runwayMeses = runwayCritico(serieLucroLiquidoHist, 12);

  const projecaoDRE = projetarDRE({
    serieReceitaBruta: serieReceitaHist.map(b => b.value),
    serieCustoVariavel: serieCustoVarHist.map(b => b.value),
    serieCustoFixo: Array(12).fill(custoFixoMensalTotal),
    aliquotaEfetivaPct, despesasFinanceirasMensal, horizonte: 3,
  });

  // ═══════════════════════ SEMÁFORO DE SAÚDE ═══════════════════════
  const concentracaoPct = concentracao(receitasNoPeriodo, 0.2);
  const pesoCustoFixoPct = pesoSobreReceita(dreAtual.custoFixo.valor, dreAtual.receitaLiquida.valor);
  const pesoCustoFixoBenchmark = benchmark?.custo_sobre_receita_max ?? 40;
  const sinaisSaude = calcularSinaisSaude({
    margemLiquidaPct: dreAtual.margemLiquidaPct, mesesQuedaEbitda, pesoCustoFixoPct, pesoCustoFixoBenchmark, concentracaoPct,
  });
  const corSaude: CorSaude = semaforoSaude(sinaisSaude);
  const SINAL_LABEL: Record<string, string> = {
    margemLiquida: cx.sinalMargemLiquida, ebitdaQueda: cx.sinalEbitdaQueda, pesoCustoFixo: cx.sinalPesoCustoFixo, concentracao: cx.sinalConcentracao,
  };

  // ═══════════════════════ PONTE LUCRO × CAIXA ═══════════════════════
  const caixaRealizadoPeriodo = fluxoCaixaRows.filter(l => l.status === "realizado")
    .reduce((s, l) => s + (l.tipo === "entrada" ? Number(l.valor || 0) : -Number(l.valor || 0)), 0);

  const recebiveisVencidosNaoRecebidos = contasReceberRows
    .filter(c => c.data_vencimento && c.data_vencimento <= periodo.fim)
    .reduce((s, c) => s + Math.max(0, Number(c.valor || 0) - Number(c.valor_recebido || 0)), 0);

  const amortizacaoDividaEstimada = dividasRows.reduce((s, dvv) => {
    const parcelas = Math.max(1, Number(dvv.parcelas || 1));
    return s + (Number(dvv.valor_total || 0) / parcelas) * meses;
  }, 0);

  const ponte = ponteLucroCaixa({
    lucroLiquido: dreAtual.lucroLiquido.valor,
    caixaRealizado: caixaRealizadoPeriodo,
    variacaoRecebiveisAbertos: recebiveisVencidosNaoRecebidos,
    variacaoAmortizacaoDivida: amortizacaoDividaEstimada,
  });
  const narrativaPonte = temDados ? montarNarrativaPonte(lang, ponte) : "";

  // ═══════════════════════ DIAGNÓSTICO — CAUSA RAIZ ═══════════════════════
  const fatoresVariacao = decomporVariacaoLucro(dreAtual, dreAnterior);
  const fatorPrincipal: FatorVariacaoLucro | null = fatoresVariacao[0] || null;
  const maiorFatorNegativo = fatoresVariacao.find(f => f.impacto < 0) || null;
  const variacaoLucroTotal = dreAtual.lucroLiquido.valor - dreAnterior.lucroLiquido.valor;
  const narrativaCausaRaiz = temDados && fatorPrincipal ? montarNarrativaCausaRaiz(lang, variacaoLucroTotal, fatorPrincipal) : "";

  // Proxy de "mudança de mix" — sem dado de mix por produto/SKU, usa categoria de receita.
  const comparativoCategoriaReceita = compararPeriodosPorCategoria(receitasNoPeriodo, receitasNoPeriodoAnt, categoriasReceita);
  const categoriaReceitaPrincipal = fatorPrincipal?.fator === "receita" ? comparativoCategoriaReceita[0] : null;

  const narrativaRunway = temDados ? montarNarrativaRunway(lang, runwayMeses) : "";

  // ═══════════════════════ CONSELHO CFO ACIONÁVEL ═══════════════════════
  const anomaliasCV: AnomaliaHistorica[] = detectarAnomaliasHistoricas(custoVarItens);
  const anomaliaPrincipal: AnomaliaHistorica | null = anomaliasCV[0] || null;

  const custoFixoPorCategoria = categoriasCustoFixo.map(cat => ({
    categoria: cat,
    valor: custosFixosRows.filter(c => c.categoria === cat).reduce((s, c) => s + Number(c.valor_mensal || 0), 0) * meses,
  })).filter(c => c.valor > 0);

  const pe = pontoEquilibrio(dreAtual.custoFixo.valor, dreAtual.margemContribuicaoPct);
  const ms = margemSeguranca(dreAtual.receitaLiquida.valor, pe);

  const gatilhosConselho = gerarConselhoCFO({
    maiorFatorNegativo, anomaliaPrincipal, custoFixoPorCategoria,
    pesoCustoFixoBenchmark, custoFixoTotal: dreAtual.custoFixo.valor,
    receitaLiquida: dreAtual.receitaLiquida.valor, margemSegurancaPct: ms, pontoEquilibrioValor: pe,
    recebiveisParados: recebiveisVencidosNaoRecebidos,
  });
  const conselhos = gatilhosConselho.map(g => montarConselhoCFO(lang, g));

  // ═══════════════════════ HISTÓRICO — SNAPSHOT AUTOMÁTICO ═══════════════════════
  useEffect(() => {
    if (carregando || !userId || !temDados) return;
    if (!PRESETS_FECHAVEIS.includes(presetPeriodo)) return;
    salvarSnapshotHistorico();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, userId, presetPeriodo, periodo.inicio, periodo.fim]);

  async function salvarSnapshotHistorico() {
    if (!userId || !empresaId) return;
    const periodoJaFechado = periodo.fim < isoHoje();
    const { data: existente } = await supabase.from("dre_historico").select("id")
      .eq("periodo_inicio", periodo.inicio).eq("periodo_fim", periodo.fim).maybeSingle();
    if (existente && periodoJaFechado) return; // período fechado — nunca sobrescreve, fica congelado

    const labelPeriodo = presetPeriodo === "mes_atual" ? cx.periodoMesAtual
      : presetPeriodo === "mes_anterior" ? cx.periodoMesAnterior
      : presetPeriodo === "trimestre_atual" ? cx.periodoTrimestreAtual : cx.periodoAnoAtual;

    const payload = {
      user_id: userId, empresa_id: empresaId, periodo_inicio: periodo.inicio, periodo_fim: periodo.fim, periodo_label: labelPeriodo,
      receita_bruta: dreAtual.receitaBruta.valor, deducoes: dreAtual.deducoes.valor, receita_liquida: dreAtual.receitaLiquida.valor,
      custo_variavel: dreAtual.custoVariavel.valor, margem_contribuicao: dreAtual.margemContribuicao.valor, custo_fixo: dreAtual.custoFixo.valor,
      ebitda: dreAtual.ebitda.valor, despesas_financeiras: dreAtual.despesasFinanceiras.valor, lucro_liquido: dreAtual.lucroLiquido.valor,
      margem_bruta_pct: dreAtual.margemContribuicaoPct, margem_liquida_pct: dreAtual.margemLiquidaPct,
      semaforo_cor: corSaude,
      resultado_completo: { fatoresVariacao, ponte, sinaisSaude, gatilhosConselho, runwayMeses },
      updated_at: new Date().toISOString(),
    };
    if (existente) await supabase.from("dre_historico").update(payload).eq("id", existente.id);
    else await supabase.from("dre_historico").insert(payload);
    carregarHistorico(userId);
  }

  // ═══════════════════════ PDF ═══════════════════════
  const linhasCascataTabela = [
    { label: cx.dreReceitaBruta, linha: dreAtual.receitaBruta, ant: dreAnterior.receitaBruta.valor },
    { label: cx.dreDeducoes, linha: dreAtual.deducoes, ant: dreAnterior.deducoes.valor },
    { label: cx.dreReceitaLiquida, linha: dreAtual.receitaLiquida, ant: dreAnterior.receitaLiquida.valor },
    { label: cx.dreCustoVariavel, linha: dreAtual.custoVariavel, ant: dreAnterior.custoVariavel.valor },
    { label: cx.dreMargemContribuicao, linha: dreAtual.margemContribuicao, ant: dreAnterior.margemContribuicao.valor },
    { label: cx.dreCustoFixo, linha: dreAtual.custoFixo, ant: dreAnterior.custoFixo.valor },
    { label: cx.dreEbitda, linha: dreAtual.ebitda, ant: dreAnterior.ebitda.valor },
    { label: cx.dreDespesasFinanceiras, linha: dreAtual.despesasFinanceiras, ant: dreAnterior.despesasFinanceiras.valor },
    { label: cx.dreLucroLiquido, linha: dreAtual.lucroLiquido, ant: dreAnterior.lucroLiquido.valor },
  ].map(r => ({
    ...r,
    ah: r.ant !== 0 ? ((r.linha.valor - r.ant) / Math.abs(r.ant)) * 100 : (r.linha.valor !== 0 ? 100 : 0),
  }));

  const exportarPDF = async () => {
    setExportando(true);
    try {
      gerarPdfTabela({
        titulo: d.titulo,
        subtitulo: d.subtitulo,
        colunas: [
          { header: "Conta", key: "conta", width: 4 },
          { header: "Valor (R$)", key: "valor", width: 2, align: "right" },
          { header: "AV%", key: "av", width: 1, align: "right" },
          { header: "AH%", key: "ah", width: 1, align: "right" },
        ],
        linhas: linhasCascataTabela.map(l => ({
          conta: l.label,
          valor: fBRL(l.linha.valor),
          av: l.linha.avPct !== null ? fPct(l.linha.avPct) : "—",
          ah: fPct(l.ah),
        })),
        resumo: [
          { label: cx.dreMargemContribuicao, valor: fPct(dreAtual.margemContribuicaoPct) },
          { label: cx.dreMargemLiquida, valor: fPct(dreAtual.margemLiquidaPct) },
          { label: cx.dreEbitda, valor: fBRL(dreAtual.ebitda.valor) },
          { label: cx.dreLucroLiquido, valor: fBRL(dreAtual.lucroLiquido.valor) },
          ...(narrativaCausaRaiz ? [{ label: cx.causaRaizTitulo, valor: narrativaCausaRaiz }] : []),
        ],
        nomeArquivo: `axioma-dre-${new Date().toISOString().slice(0, 10)}.pdf`,
      });
    } catch (err) { console.error(err); }
    setExportando(false);
  };

  // ═══════════════════════ COMPARTILHAR ═══════════════════════
  const textoShare = [
    `🚀 AXIOMA AI.TECH — ${d.titulo}`,
    `💰 ${cx.dreLucroLiquido}: ${fBRL(dreAtual.lucroLiquido.valor)}`,
    `📈 ${cx.dreEbitda}: ${fBRL(dreAtual.ebitda.valor)}`,
    `🎯 ${cx.dreMargemLiquida}: ${fPct(dreAtual.margemLiquidaPct)}`,
    narrativaCausaRaiz ? `💬 ${narrativaCausaRaiz}` : "",
    narrativaPonte && ponte.alerta ? `⚠️ ${narrativaPonte}` : "",
    `_axiomaai.com.br_`,
  ].filter(Boolean).join("\n");
  const canais = canaisCompartilhamento(textoShare, `${d.titulo} — Axioma`);
  const copiar = async () => { try { await navigator.clipboard.writeText(textoShare); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {} };

  // ═══════════════════════ GRÁFICO CASCATA (waterfall) ═══════════════════════
  const itensCascata: ItemCascata[] = [
    { label: cx.dreReceitaBruta, valor: dreAtual.receitaBruta.valor, tipo: "subtotal" },
    { label: cx.dreDeducoes, valor: -dreAtual.deducoes.valor, tipo: "variacao" },
    { label: cx.dreReceitaLiquida, valor: dreAtual.receitaLiquida.valor, tipo: "subtotal" },
    { label: cx.dreCustoVariavel, valor: -dreAtual.custoVariavel.valor, tipo: "variacao" },
    { label: cx.dreMargemContribuicao, valor: dreAtual.margemContribuicao.valor, tipo: "subtotal" },
    { label: cx.dreCustoFixo, valor: -dreAtual.custoFixo.valor, tipo: "variacao" },
    { label: cx.dreEbitda, valor: dreAtual.ebitda.valor, tipo: "subtotal" },
    { label: cx.dreDespesasFinanceiras, valor: -dreAtual.despesasFinanceiras.valor, tipo: "variacao" },
    { label: cx.dreLucroLiquido, valor: dreAtual.lucroLiquido.valor, tipo: "subtotal" },
  ];
  const optWaterfall = optCascata(itensCascata, CORES.verde, CORES.vermelho, CORES.teal);

  const kpisCFO = [
    { l: cx.dreLucroLiquido, v: fBRL(dreAtual.lucroLiquido.valor), c: dreAtual.lucroLiquido.valor >= 0 ? CORES.verde : CORES.vermelho, i: "💰" },
    { l: cx.dreEbitda, v: fBRL(dreAtual.ebitda.valor), c: dreAtual.ebitda.valor >= 0 ? CORES.teal : CORES.vermelho, i: "📈" },
    { l: cx.dreMargemLiquida, v: fPct(dreAtual.margemLiquidaPct), c: dreAtual.margemLiquidaPct >= 10 ? CORES.verde : dreAtual.margemLiquidaPct >= 0 ? CORES.amarelo : CORES.vermelho, i: "🎯" },
    { l: cx.dreMargemContribuicao, v: fPct(dreAtual.margemContribuicaoPct), c: CORES.cyan, i: "📊" },
    { l: cx.margemSeguranca, v: ms !== null ? fPct(ms) : "—", c: ms === null ? CORES.rosa : ms < 15 ? CORES.vermelho : ms < 30 ? CORES.amarelo : CORES.verde, i: "🛡️" },
    { l: cx.runwayTitulo, v: runwayMeses !== null ? `${runwayMeses}m` : "—", c: runwayMeses !== null ? CORES.vermelho : CORES.verde, i: "⏳" },
  ];

  const marquee = [
    `🚀 AXIOMA AI.TECH`, `${cx.dreLucroLiquido} ${fBRL(dreAtual.lucroLiquido.valor)}`,
    `${cx.dreEbitda} ${fBRL(dreAtual.ebitda.valor)}`, `${cx.dreMargemLiquida} ${fPct(dreAtual.margemLiquidaPct)}`,
    `${cx.semaforoSaudeTitulo}: ${corSaude.toUpperCase()}`,
  ].filter(Boolean);

  const SubChart = ({ titulo, cor, option, altura }: { titulo: string; cor: string; option: any; altura: number }) => (
    <div className="rounded-xl p-3 md:p-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${cor}20` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1 h-4 rounded-full" style={{ background: cor, boxShadow: `0 0 8px ${cor}` }} />
        <p className="text-[13px] font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{titulo}</p>
      </div>
      <ReactECharts option={option} style={{ height: altura, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
    </div>
  );

  return (
    <ModuloLayout titulo={`📈 ${d.titulo}`} subtitulo={d.subtitulo} onExportarPDF={exportarPDF} exportando={exportando}>
      <div className="space-y-4">

        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo
            preset={presetPeriodo} onChangePreset={setPresetPeriodo}
            personalizado={personalizado} onChangePersonalizado={setPersonalizado}
            cor={CORES.verde} lang={lang}
          />
          <div className="flex gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setHistoricoAberto(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "rgba(20,184,166,0.15)", border: "1px solid rgba(20,184,166,0.4)", color: "#5eead4" }}>
              <History size={16} /> {cx.verHistorico}
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => setShareAberto(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
              <Share2 size={16} /> {cx.compartilhar}
            </motion.button>
          </div>
        </div>

        {/* Cards originais */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { label: cx.dreReceitaBruta, value: fBRL(dreAtual.receitaBruta.valor), cor: CORES.verde },
            { label: cx.dreLucroLiquido, value: fBRL(dreAtual.lucroLiquido.valor), cor: dreAtual.lucroLiquido.valor >= 0 ? CORES.teal : CORES.vermelho },
            { label: cx.dreMargemLiquida, value: fPct(dreAtual.margemLiquidaPct), cor: CORES.verde },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <CanvasBox cor={card.cor}>
                <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "#5a7a9a" }}>{card.label}</p>
                <p className="text-base md:text-2xl font-black" style={{ color: card.cor, ...FONTE_EXEC }}>{card.value}</p>
              </CanvasBox>
            </motion.div>
          ))}
        </div>

        {!temDados ? (
          <CanvasBox cor={CORES.verde}>
            <p className="text-sm text-center py-8" style={{ color: "#5a7a9a" }}>{d.semDados}</p>
          </CanvasBox>
        ) : (
          <>
            {/* SEMÁFORO DE SAÚDE */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${corSaude === "verde" ? "rgba(16,185,129,0.3)" : corSaude === "amarelo" ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.3)"}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} style={{ color: CORES.verde }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.semaforoSaudeTitulo}</p>
                <CorSemaforo cor={corSaude} size={14} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sinaisSaude.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <CorSemaforo cor={s.cor} size={9} />
                    <p className="text-xs font-medium" style={{ color: "#cbd5e1" }}>{SINAL_LABEL[s.chave]}</p>
                  </div>
                ))}
              </div>
            </div>

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
            <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.14), rgba(20,184,166,0.10))", border: "1px solid rgba(16,185,129,0.24)" }}>
              <div className="marquee-dre py-2.5 whitespace-nowrap" style={{ display: "inline-block" }}>
                {[0, 1].map(rep => (
                  <span key={rep} className="text-[13px] font-bold tracking-wide" style={{ fontFamily: "'Georgia',serif" }} aria-hidden={rep === 1}>
                    {marquee.map((m, i) => (<span key={i} style={{ color: i === 0 ? "#6ee7b7" : "#e2e8f0" }}>{m}<span style={{ color: CORES.verde }}>{"  •  "}</span></span>))}
                  </span>
                ))}
              </div>
              <style>{`.marquee-dre{animation:marqueeDre 30s linear infinite}@keyframes marqueeDre{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}.marquee-dre:hover{animation-play-state:paused}`}</style>
            </div>

            {/* DIAGNÓSTICO DE LUCRATIVIDADE — causa raiz */}
            {narrativaCausaRaiz && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquareText size={16} style={{ color: CORES.verde }} />
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.diagnosticoTitulo}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#e2e8f0" }}>
                  {narrativaCausaRaiz}
                  {categoriaReceitaPrincipal && ` (${lang === "en" ? "mainly" : lang === "es" ? "principalmente" : "principalmente"} ${categoriaReceitaPrincipal.categoria})`}
                </p>
              </div>
            )}

            {/* PONTE LUCRO × CAIXA */}
            {narrativaPonte && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: ponte.alerta ? "linear-gradient(160deg, rgba(40,20,10,0.6), rgba(10,8,32,0.95))" : "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${ponte.alerta ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.2)"}` }}>
                <div className="flex items-center gap-2 mb-2">
                  {ponte.alerta ? <AlertTriangle size={16} style={{ color: CORES.vermelho }} /> : <ShieldCheck size={16} style={{ color: CORES.verde }} />}
                  <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.ponteLucroCaixaTitulo}</p>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: ponte.alerta ? "#fca5a5" : "#e2e8f0" }}>{narrativaPonte}</p>
              </div>
            )}

            {/* MODAL ÚNICO — Cascata + AV/AH + Projeção */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.94), rgba(10,8,32,0.97))", border: "1px solid rgba(99,102,241,0.15)", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
              <div className="p-4 md:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 rounded-full" style={{ background: "linear-gradient(180deg,#10b981,#14b8a6)", boxShadow: "0 0 12px #10b981" }} />
                  <div>
                    <p className="text-sm md:text-base font-black" style={{ color: "#f1f5f9", fontFamily: "'Georgia',serif" }}>{cx.cascataDRE}</p>
                    <p className="text-[10px] font-medium" style={{ color: "#64748b" }}>{cx.analiseVertical} · {cx.analiseHorizontal}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <SubChart titulo={cx.cascataDRE} cor={CORES.verde} option={optWaterfall} altura={300} />
                </div>

                {/* Tabela AV% / AH% */}
                <div className="overflow-x-auto rounded-xl mb-4" style={{ background: "rgba(8,6,24,0.5)", border: `1px solid ${CORES.verde}20` }}>
                  <table className="w-full min-w-[480px]">
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(16,185,129,0.15)" }}>
                        {[t.geral.descricao, t.geral.valor, "AV%", "AH%"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold tracking-wider uppercase" style={{ color: "#5a7a9a" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {linhasCascataTabela.map((l, i) => (
                        <tr key={i} style={{ borderBottom: i < linhasCascataTabela.length - 1 ? "1px solid rgba(59,111,212,0.06)" : "none" }}>
                          <td className="px-4 py-2.5 text-sm" style={{ color: "#c8d8f0" }}>{l.label}</td>
                          <td className="px-4 py-2.5 text-sm font-bold whitespace-nowrap" style={{ color: l.linha.valor >= 0 ? "#e2e8f0" : CORES.vermelho }}>{fBRL(l.linha.valor)}</td>
                          <td className="px-4 py-2.5 text-sm whitespace-nowrap" style={{ color: "#64748b" }}>{l.linha.avPct !== null ? fPct(l.linha.avPct) : "—"}</td>
                          <td className="px-4 py-2.5 text-sm font-bold whitespace-nowrap" style={{ color: Math.abs(l.ah) < 1 ? "#64748b" : l.ah > 0 ? CORES.verde : CORES.vermelho }}>
                            {Math.abs(l.ah) < 1 ? cx.periodoEstavel : `${l.ah > 0 ? "▲" : "▼"} ${fPct(Math.abs(l.ah))}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Projeção 3 meses */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {projecaoDRE.map((proj, i) => (
                    <div key={i} className="rounded-xl p-3" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: CORES.verde }}>{cx.previsao} +{i + 1}</p>
                      <p className="text-base font-black" style={{ color: proj.lucroLiquido.valor >= 0 ? "#e2e8f0" : CORES.vermelho }}>{fBRL(proj.lucroLiquido.valor)}</p>
                      <p className="text-[10px]" style={{ color: "#64748b" }}>{cx.dreLucroLiquido}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CONSELHO CFO */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: "1px solid rgba(212,175,55,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} style={{ color: CORES.ouro }} />
                <p className="text-sm font-black" style={{ color: "#f1f5f9", ...FONTE_EXEC }}>{cx.conselhoCfoTitulo}</p>
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
                <p className="text-xs md:text-[13px] font-medium" style={{ color: "#6ee7b7" }}>{cx.semGatilhoConselho}</p>
              )}
            </div>

            {/* Runway */}
            <div className="rounded-2xl p-4 md:p-5 flex items-center gap-3" style={{ background: "linear-gradient(160deg, rgba(20,15,55,0.9), rgba(10,8,32,0.95))", border: `1px solid ${runwayMeses !== null ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.2)"}` }}>
              <Clock size={18} style={{ color: runwayMeses !== null ? CORES.vermelho : CORES.verde, flexShrink: 0 }} />
              <p className="text-sm" style={{ color: runwayMeses !== null ? "#fca5a5" : "#e2e8f0" }}>{narrativaRunway}</p>
            </div>
          </>
        )}
      </div>

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

      {/* Histórico de Resultados */}
      <AnimatePresence>
        {historicoAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-16 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }} onClick={() => { setHistoricoAberto(false); setSnapshotSelecionado(null); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22 }} className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <CanvasBox cor={CORES.teal}>
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <p className="text-xs font-black tracking-[0.3em] uppercase mb-1" style={{ color: "#5eead4" }}>AXIOMA AI.TECH</p>
                    <h3 className="text-lg font-bold" style={{ color: "#c8d8f0" }}>{cx.historicoTitulo}</h3>
                  </div>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => { setHistoricoAberto(false); setSnapshotSelecionado(null); }} style={{ color: "#5a7a9a" }}><X size={20} /></motion.button>
                </div>

                {!snapshotSelecionado ? (
                  historico.length === 0 ? (
                    <p className="text-sm text-center py-10" style={{ color: "#5a7a9a" }}>{cx.historicoVazio}</p>
                  ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                      {historico.map(h => (
                        <button key={h.id} onClick={() => setSnapshotSelecionado(h)} className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left transition-all hover:scale-[1.01]" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.18)" }}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <CorSemaforo cor={h.semaforo_cor} />
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate" style={{ color: "#e2e8f0" }}>{h.periodo_label} — {new Date(h.periodo_fim + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR", { month: "short", year: "numeric" })}</p>
                              <p className="text-[11px]" style={{ color: h.periodo_fim < isoHoje() ? "#64748b" : "#5eead4" }}>{h.periodo_fim < isoHoje() ? cx.periodoFechado : cx.periodoAberto}</p>
                            </div>
                          </div>
                          <p className="text-sm font-black flex-shrink-0" style={{ color: h.lucro_liquido >= 0 ? CORES.verde : CORES.vermelho }}>{fBRL(h.lucro_liquido)}</p>
                        </button>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <button onClick={() => setSnapshotSelecionado(null)} className="text-xs font-bold" style={{ color: "#5eead4" }}>← {cx.verHistorico}</button>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { l: cx.dreReceitaBruta, v: fBRL(snapshotSelecionado.receita_bruta) },
                        { l: cx.dreReceitaLiquida, v: fBRL(snapshotSelecionado.receita_liquida) },
                        { l: cx.dreMargemContribuicao, v: fBRL(snapshotSelecionado.margem_contribuicao) },
                        { l: cx.dreEbitda, v: fBRL(snapshotSelecionado.ebitda) },
                        { l: cx.dreLucroLiquido, v: fBRL(snapshotSelecionado.lucro_liquido) },
                        { l: cx.dreMargemLiquida, v: fPct(snapshotSelecionado.margem_liquida_pct) },
                      ].map((c, i) => (
                        <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)" }}>
                          <p className="text-[10px] uppercase tracking-wider" style={{ color: "#64748b" }}>{c.l}</p>
                          <p className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{c.v}</p>
                        </div>
                      ))}
                    </div>
                    {snapshotSelecionado.resultado_completo?.gatilhosConselho?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-black" style={{ color: CORES.ouro }}>{cx.conselhoCfoTitulo}</p>
                        {snapshotSelecionado.resultado_completo.gatilhosConselho.map((g: any, i: number) => (
                          <p key={i} className="text-xs" style={{ color: "#f0d878" }}>{montarConselhoCFO(lang, g)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CanvasBox>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModuloLayout>
  );
}
