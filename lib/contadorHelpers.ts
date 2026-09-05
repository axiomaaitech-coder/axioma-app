// 🦅 AXIOMA AI.TECH — Módulo Contador (CFO Intelligence), Rodada 2: Discovery
// Engine + Control Room. Camada de INTELIGÊNCIA sobre o ledger e os engines
// que já existem (Tesouraria, Contas a Pagar, Estoque, cfoCore) — nunca um
// cálculo novo duplicado. Deterministic-first ABSOLUTO: toda descoberta vem
// de dado real (ledger/AP/AR/Tesouraria), nunca de IA (ZIA é fase futura,
// fora deste arquivo). Evidence-first: toda gravação em contador_descoberta
// carrega a evidência que sustenta o achado.
//
// Tabelas usadas (Rodada 1, já aplicada — CONTADOR-RODADA1-SQL.txt):
// contador_descoberta, contador_close, contador_data_trust,
// contador_decisao_journal. RPCs: contador_detectar_variacao_despesa,
// contador_close_readiness. Sem SQL novo nesta rodada — todo INSERT/UPDATE
// daqui em diante é direto do client, coberto pela RLS FOR ALL já criada.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { resolverPeriodo, periodoAnterior, topConcentracao, type Periodo } from "./cfoCore";
import {
  obterConfigTesouraria, obterPosicaoCaixa, obterFluxoProjetado, obterDividaPendente, obterCapitalDeGiro,
  gerarAlertasCandidatos, calcularLiquidityScore, obterPontoFluxoProjetadoAvulso,
  type PosicaoCaixa, type FluxoProjetadoResultado, type CapitalDeGiro, type AlertaCandidato, type LiquidityScoreResultado,
} from "./tesourariaHelpers";
import { detectarDescontosPerdidos, type ContaPagar, type DescontoPerdido } from "./contasPagarHelpers";
import { carregarAvisosEstoque, type AvisoEstoque } from "./estoqueHelpers";
import { listarLancamentos, listarPartidas, type LancamentoContabilRow, type PartidaRow, saldoNatural } from "./contabilidadeRelatoriosHelpers";
import { listarPlanoDeContas, type ContaContabil } from "./contabilidadeHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

export type Idioma3 = "pt" | "en" | "es";
function hojeISO(): string { return new Date().toISOString().slice(0, 10); }

// ============================================================================
// DESCOBERTA — leitura, ações (revisar/resolver/ignorar) e Decision Journal.
// ============================================================================

export type TipoDescoberta = "inconsistencia" | "anomalia" | "oportunidade" | "risco" | "divergencia" | "concentracao" | "classificacao_suspeita" | "tendencia";
export type Prioridade = "P0" | "P1" | "P2" | "P3";
export type Confianca = "fato" | "calculo" | "inferencia" | "previsao" | "cenario";
export type StatusDescoberta = "aberto" | "revisado" | "resolvido" | "ignorado";

export type Descoberta = {
  id: string;
  empresa_id: string;
  tipo: TipoDescoberta;
  prioridade: Prioridade;
  titulo: string;
  descricao: string | null;
  causa: string | null;
  impacto_estimado: number | null;
  evidencia: Record<string, unknown> | null;
  confianca: Confianca;
  status: StatusDescoberta;
  criado_em: string;
  resolvido_em: string | null;
  resolvido_por: string | null;
};

export async function listarDescobertas(empresaId: string): Promise<Descoberta[]> {
  const { data } = await supabase.from("contador_descoberta").select("*")
    .eq("empresa_id", empresaId).order("prioridade", { ascending: true }).order("criado_em", { ascending: false });
  return (data as Descoberta[]) || [];
}

export type ContagemPrioridade = { P0: number; P1: number; P2: number; P3: number; totalAbertas: number };

// Deriva as contagens do que listarDescobertas já trouxe — nunca uma 2ª
// query só pra contar (Regra 4 das 9 regras de escala: nunca N+1).
export function contarPorPrioridade(descobertas: Descoberta[]): ContagemPrioridade {
  const abertas = descobertas.filter((d) => d.status === "aberto");
  return {
    P0: abertas.filter((d) => d.prioridade === "P0").length,
    P1: abertas.filter((d) => d.prioridade === "P1").length,
    P2: abertas.filter((d) => d.prioridade === "P2").length,
    P3: abertas.filter((d) => d.prioridade === "P3").length,
    totalAbertas: abertas.length,
  };
}

// LÁPIS/LIXEIRA não existem aqui de propósito — descoberta é leitura
// calculada, o dono só muda o STATUS dela (nunca edita título/causa/valor).
// Toda mudança de status também grava no Decision Journal (o que foi
// recomendado, o que o dono decidiu, quando) — é o que alimenta o
// aprendizado de "quais recomendações funcionam" (contador_decisao_journal).
export async function atualizarStatusDescoberta(
  descoberta: Descoberta,
  novoStatus: Extract<StatusDescoberta, "revisado" | "resolvido" | "ignorado">,
  userId: string | null
): Promise<{ erro?: string }> {
  const agora = new Date().toISOString();
  const { data, error } = await supabase.from("contador_descoberta")
    .update({ status: novoStatus, resolvido_em: agora, resolvido_por: userId })
    .eq("id", descoberta.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("contador_descoberta", "update status", motivo);
    return { erro: motivo };
  }
  const { error: erroJournal } = await supabase.from("contador_decisao_journal").insert({
    empresa_id: descoberta.empresa_id, descoberta_id: descoberta.id,
    recomendacao: descoberta.titulo, decisao: novoStatus, criado_por: userId, decidido_em: agora,
  });
  if (erroJournal) reportarFalhaEscrita("contador_decisao_journal", "insert", erroJournal.message);
  return {};
}

// ============================================================================
// PRIORITY ENGINE — pontua impacto × probabilidade × materialidade (cada
// 0-100). Abaixo do piso, a regra NÃO grava descoberta nenhuma — é o que
// evita alerta inútil (mais barulho que sinal).
// ============================================================================

const PISO_PONTUACAO = 15;

export function pontuarDescoberta(impacto0a100: number, probabilidade0a100: number, materialidade0a100: number): { pontuacao: number; prioridade: Prioridade | null } {
  const i = Math.max(0, Math.min(100, impacto0a100));
  const p = Math.max(0, Math.min(100, probabilidade0a100));
  const m = Math.max(0, Math.min(100, materialidade0a100));
  const pontuacao = Math.round((i * p * m) / 10000);
  if (pontuacao < PISO_PONTUACAO) return { pontuacao, prioridade: null };
  const prioridade: Prioridade = pontuacao >= 80 ? "P0" : pontuacao >= 55 ? "P1" : pontuacao >= 30 ? "P2" : "P3";
  return { pontuacao, prioridade };
}

// Normaliza um valor em reais pra escala 0-100 contra um teto de referência
// (materialidade relativa, nunca um número absoluto sem contexto).
function normalizarImpactoReais(valorAbsoluto: number, teto: number): number {
  if (teto <= 0) return 0;
  return Math.max(0, Math.min(100, (Math.abs(valorAbsoluto) / teto) * 100));
}

// ============================================================================
// GRAVAÇÃO IDEMPOTENTE — mesmo espírito do CONTAINMENT jsonb da RPC
// contador_detectar_variacao_despesa (Rodada 1): cada regra carimba uma
// "chave" estável na evidência, e antes de gravar checa se já existe uma
// descoberta ABERTA com essa chave. Evita duplicar o mesmo achado a cada
// clique em "Rodar descoberta".
// ============================================================================

async function gravarDescobertaSeNova(d: {
  empresa_id: string; tipo: TipoDescoberta; prioridade: Prioridade; titulo: string; descricao: string;
  causa: string | null; impacto_estimado: number; evidencia: Record<string, unknown> & { chave: string };
  confianca: Confianca;
}): Promise<boolean> {
  const { data: existente } = await supabase.from("contador_descoberta").select("id")
    .eq("empresa_id", d.empresa_id).eq("tipo", d.tipo).eq("status", "aberto")
    .contains("evidencia", { chave: d.evidencia.chave }).limit(1);
  if (existente && existente.length > 0) return false;
  const { error } = await supabase.from("contador_descoberta").insert(d);
  if (error) { reportarFalhaEscrita("contador_descoberta", "insert (discovery engine)", error.message); return false; }
  return true;
}

// ============================================================================
// REGRAS DETERMINÍSTICAS — cada uma lê dado real já existente em outro
// módulo (nunca recalcula do zero) e, se passar do piso do Priority Engine,
// grava em contador_descoberta.
// ============================================================================

// ---- Concentração de fornecedor (lado AP — Tesouraria já cobre banco/cliente) ----
export async function obterConcentracaoFornecedor(empresaId: string): Promise<{ fornecedorId: string; nome: string; percentual: number; totalAberto: number } | null> {
  const { data: cpAbertas } = await supabase.from("contas_pagar").select("fornecedor_id, valor_total, valor_pago")
    .eq("empresa_id", empresaId).neq("status", "pago");
  const abertas = (cpAbertas as { fornecedor_id: string | null; valor_total: number; valor_pago: number | null }[]) || [];
  const porFornecedor = new Map<string, number>();
  abertas.filter((c) => c.fornecedor_id).forEach((c) => {
    const saldo = Math.max(0, Number(c.valor_total) - Number(c.valor_pago || 0));
    porFornecedor.set(c.fornecedor_id as string, (porFornecedor.get(c.fornecedor_id as string) || 0) + saldo);
  });
  const top = topConcentracao(porFornecedor);
  if (!top) return null;
  const { data: forn } = await supabase.from("fornecedores").select("nome").eq("id", top.chave).maybeSingle();
  return { fornecedorId: top.chave, nome: (forn as { nome: string } | null)?.nome || top.chave, percentual: top.percentual, totalAberto: top.total };
}

async function regraConcentracaoFornecedor(empresaId: string, lang: Idioma3, limitePct = 60): Promise<boolean> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const top = await obterConcentracaoFornecedor(empresaId);
  if (!top || top.percentual < limitePct) return false;
  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(top.totalAberto, 30000), 95, top.percentual);
  if (!prioridade) return false;
  return gravarDescobertaSeNova({
    empresa_id: empresaId, tipo: "concentracao", prioridade,
    titulo: L(`${top.nome} concentra ${top.percentual.toFixed(0)}% das suas contas a pagar em aberto`, `${top.nome} holds ${top.percentual.toFixed(0)}% of your open payables`, `${top.nome} concentra ${top.percentual.toFixed(0)}% de sus cuentas por pagar abiertas`),
    descricao: L(`De R$ ${top.totalAberto.toFixed(2)} em contas a pagar ainda em aberto, R$ ${((top.percentual / 100) * top.totalAberto).toFixed(2)} são desse único fornecedor.`,
      `Of R$ ${top.totalAberto.toFixed(2)} in open payables, R$ ${((top.percentual / 100) * top.totalAberto).toFixed(2)} belong to this single supplier.`,
      `De R$ ${top.totalAberto.toFixed(2)} en cuentas por pagar abiertas, R$ ${((top.percentual / 100) * top.totalAberto).toFixed(2)} son de este único proveedor.`),
    causa: null, impacto_estimado: top.totalAberto,
    evidencia: { chave: `concentracao_fornecedor:${top.fornecedorId}`, fornecedorId: top.fornecedorId, percentual: top.percentual, totalAberto: top.totalAberto, pontuacao },
    confianca: "calculo",
  });
}

// ---- Ponte com os alertas que a Tesouraria já calcula (ruptura, caixa
// ocioso, concentração de banco/cliente, dívida alta) — reaproveita
// gerarAlertasCandidatos, nunca recalcula a concentração/ruptura aqui. ----
async function pontuarAlertaTesouraria(a: AlertaCandidato): Promise<{ tipo: TipoDescoberta; impacto: number; probabilidade: number; materialidade: number }> {
  const sev = a.severidade;
  const probabilidade = sev === "critico" ? 100 : sev === "risco" ? 85 : sev === "atencao" ? 60 : 30;
  switch (a.tipo) {
    case "ruptura_caixa": {
      const saldo = Number(a.dado_origem.saldoProjetadoBase ?? 0);
      return { tipo: "risco", impacto: normalizarImpactoReais(Math.abs(saldo) + 1, 20000), probabilidade, materialidade: 100 };
    }
    case "divida_alta": {
      const razao = Number(a.dado_origem.razao ?? 1) * 50;
      return { tipo: "risco", impacto: normalizarImpactoReais(Number(a.dado_origem.dividaPendente ?? 0), 50000), probabilidade, materialidade: Math.min(100, razao) };
    }
    case "concentracao_banco":
    case "concentracao_cliente":
      return { tipo: "concentracao", impacto: Number(a.dado_origem.percentual ?? 0), probabilidade, materialidade: Number(a.dado_origem.percentual ?? 0) };
    case "caixa_ocioso":
      return { tipo: "oportunidade", impacto: normalizarImpactoReais(Number(a.dado_origem.valorOcioso ?? 0), 30000), probabilidade, materialidade: 60 };
  }
}

const TITULO_ALERTA_TESOURARIA: Record<AlertaCandidato["tipo"], Record<Idioma3, (a: AlertaCandidato) => string>> = {
  ruptura_caixa: {
    pt: (a) => `Risco de ruptura de caixa em ${a.dado_origem.horizonteDias} dias`,
    en: (a) => `Cash shortfall risk in ${a.dado_origem.horizonteDias} days`,
    es: (a) => `Riesgo de ruptura de caja en ${a.dado_origem.horizonteDias} días`,
  },
  divida_alta: {
    pt: () => `Dívida pendente alta frente ao caixa disponível`,
    en: () => `Outstanding debt is high relative to available cash`,
    es: () => `Deuda pendiente alta frente a la caja disponible`,
  },
  concentracao_banco: {
    pt: (a) => `${a.dado_origem.banco} concentra ${a.dado_origem.percentual}% do seu caixa`,
    en: (a) => `${a.dado_origem.banco} holds ${a.dado_origem.percentual}% of your cash`,
    es: (a) => `${a.dado_origem.banco} concentra ${a.dado_origem.percentual}% de su caja`,
  },
  concentracao_cliente: {
    pt: (a) => `Um único cliente concentra ${a.dado_origem.percentual}% do seu contas a receber em aberto`,
    en: (a) => `A single customer holds ${a.dado_origem.percentual}% of your open receivables`,
    es: (a) => `Un único cliente concentra ${a.dado_origem.percentual}% de sus cuentas por cobrar abiertas`,
  },
  caixa_ocioso: {
    pt: (a) => `R$ ${Number(a.dado_origem.valorOcioso).toFixed(2)} em caixa parados além do necessário`,
    en: (a) => `R$ ${Number(a.dado_origem.valorOcioso).toFixed(2)} sitting idle beyond what's needed`,
    es: (a) => `R$ ${Number(a.dado_origem.valorOcioso).toFixed(2)} en caja ociosa más allá de lo necesario`,
  },
};

async function regraConcentracaoEBancoECaixa(empresaId: string, lang: Idioma3): Promise<number> {
  const [config, dividaPendente] = await Promise.all([obterConfigTesouraria(empresaId), obterDividaPendente(empresaId)]);
  const reserva = Number(config?.reserva_minima || 0);
  const [posicao, fluxo] = await Promise.all([obterPosicaoCaixa(empresaId, hojeISO(), reserva), obterFluxoProjetado(empresaId, reserva)]);
  const candidatos = await gerarAlertasCandidatos(empresaId, { posicao, fluxo, dividaPendente });
  let novas = 0;
  for (const a of candidatos) {
    const { tipo, impacto, probabilidade, materialidade } = await pontuarAlertaTesouraria(a);
    const { pontuacao, prioridade } = pontuarDescoberta(impacto, probabilidade, materialidade);
    if (!prioridade) continue;
    const gravou = await gravarDescobertaSeNova({
      empresa_id: empresaId, tipo, prioridade,
      titulo: TITULO_ALERTA_TESOURARIA[a.tipo][lang](a),
      descricao: TITULO_ALERTA_TESOURARIA[a.tipo][lang](a),
      causa: null, impacto_estimado: Math.abs(Number(a.dado_origem.valorOcioso ?? a.dado_origem.saldoProjetadoBase ?? a.dado_origem.dividaPendente ?? 0)),
      evidencia: { chave: `tesouraria:${a.tipo}`, ...a.dado_origem, pontuacao },
      confianca: "calculo",
    });
    if (gravou) novas++;
  }
  return novas;
}

// ---- Oportunidades — desconto perdido (Contas a Pagar) + capital parado em estoque ----
async function regraOportunidadesAP(empresaId: string, contasPagar: ContaPagar[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const perdidos = detectarDescontosPerdidos(contasPagar);
  let novas = 0;
  for (const p of perdidos) {
    const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(p.valorPerdido, 3000), 100, Math.min(100, p.percentual * 8));
    if (!prioridade) continue;
    const gravou = await gravarDescobertaSeNova({
      empresa_id: empresaId, tipo: "oportunidade", prioridade,
      titulo: L(`Desconto de ${p.percentual}% perdido em "${p.descricao}"`, `${p.percentual}% discount missed on "${p.descricao}"`, `Descuento de ${p.percentual}% perdido en "${p.descricao}"`),
      descricao: L(`R$ ${p.valorPerdido.toFixed(2)} de desconto por pagamento antecipado deixado na mesa (prazo até ${p.dataLimite}).`,
        `R$ ${p.valorPerdido.toFixed(2)} in early-payment discount left on the table (deadline ${p.dataLimite}).`,
        `R$ ${p.valorPerdido.toFixed(2)} de descuento por pago anticipado quedó sin usar (plazo hasta ${p.dataLimite}).`),
      causa: p.motivo === "pago_apos_limite"
        ? L("Pago depois do prazo do desconto.", "Paid after the discount deadline.", "Pagado después del plazo del descuento.")
        : L("Prazo do desconto expirou e a conta ainda não foi paga.", "Discount deadline expired and the bill is still unpaid.", "El plazo del descuento venció y la cuenta aún no fue pagada."),
      impacto_estimado: p.valorPerdido,
      evidencia: { chave: `desconto_perdido:${p.contaId}`, contaId: p.contaId, fornecedorId: p.fornecedorId, valorPerdido: p.valorPerdido, motivo: p.motivo, pontuacao },
      confianca: "fato",
    });
    if (gravou) novas++;
  }
  return novas;
}

async function regraEstoqueParado(empresaId: string, lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const avisos = await carregarAvisosEstoque(empresaId);
  const parados = avisos.filter((a) => a.capital_parado);
  if (parados.length === 0) return 0;
  const valorParado = parados.reduce((s, a) => s + Number(a.saldo_disponivel) * Number(a.preco_medio || a.preco_custo || 0), 0);
  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(valorParado, 20000), 90, Math.min(100, parados.length * 10));
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaSeNova({
    empresa_id: empresaId, tipo: "oportunidade", prioridade,
    titulo: L(`R$ ${valorParado.toFixed(2)} de capital parado em ${parados.length} produto(s) no estoque`, `R$ ${valorParado.toFixed(2)} in idle capital across ${parados.length} inventory item(s)`, `R$ ${valorParado.toFixed(2)} de capital inmovilizado en ${parados.length} producto(s) del inventario`),
    descricao: L("Produtos com giro baixo/nenhum, empatando capital que poderia estar em caixa.", "Slow/no-turnover items tying up capital that could sit in cash instead.", "Productos de bajo/nulo movimiento inmovilizando capital que podría estar en caja."),
    causa: null, impacto_estimado: valorParado,
    evidencia: { chave: "estoque_capital_parado", qtdProdutos: parados.length, valorParado, produtos: parados.slice(0, 10).map((a) => a.produto_id), pontuacao },
    confianca: "calculo",
  });
  return gravou ? 1 : 0;
}

// ---- Duplicidades — mesmo fornecedor + mesmo valor + vencimento próximo ----
export type Duplicidade = { a: ContaPagar; b: ContaPagar; diasEntre: number };

export function detectarDuplicidadesContasPagar(contas: ContaPagar[]): Duplicidade[] {
  const out: Duplicidade[] = [];
  const grupos = new Map<string, ContaPagar[]>();
  contas.forEach((c) => {
    if (!c.fornecedor_id || !c.valor_total) return;
    const chave = `${c.fornecedor_id}:${c.valor_total.toFixed(2)}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(c);
  });
  grupos.forEach((grupo) => {
    if (grupo.length < 2) return;
    const ordenado = [...grupo].sort((x, y) => (x.data_vencimento || "").localeCompare(y.data_vencimento || ""));
    for (let i = 1; i < ordenado.length; i++) {
      const x = ordenado[i - 1], y = ordenado[i];
      if (!x.data_vencimento || !y.data_vencimento) continue;
      const dias = Math.abs((new Date(y.data_vencimento).getTime() - new Date(x.data_vencimento).getTime()) / 86400000);
      if (dias <= 3) out.push({ a: x, b: y, diasEntre: dias });
    }
  });
  return out;
}

async function regraDuplicidades(empresaId: string, contasPagar: ContaPagar[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const duplicidades = detectarDuplicidadesContasPagar(contasPagar);
  let novas = 0;
  for (const d of duplicidades) {
    const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(d.a.valor_total, 5000), 70, 90);
    if (!prioridade) continue;
    const gravou = await gravarDescobertaSeNova({
      empresa_id: empresaId, tipo: "divergencia", prioridade,
      titulo: L(`Possível duplicidade: "${d.a.descricao}" lançada 2x`, `Possible duplicate: "${d.a.descricao}" entered twice`, `Posible duplicidad: "${d.a.descricao}" registrada 2 veces`),
      descricao: L(`Duas contas a pagar do mesmo fornecedor, mesmo valor (R$ ${d.a.valor_total.toFixed(2)}), com vencimento a ${d.diasEntre.toFixed(0)} dia(s) de diferença.`,
        `Two payables from the same supplier, same amount (R$ ${d.a.valor_total.toFixed(2)}), due ${d.diasEntre.toFixed(0)} day(s) apart.`,
        `Dos cuentas por pagar del mismo proveedor, mismo valor (R$ ${d.a.valor_total.toFixed(2)}), con vencimiento a ${d.diasEntre.toFixed(0)} día(s) de diferencia.`),
      causa: L("Mesmo fornecedor, mesmo valor, vencimentos próximos — confira antes de pagar as duas.", "Same supplier, same amount, close due dates — check before paying both.", "Mismo proveedor, mismo valor, vencimientos cercanos — confirme antes de pagar ambas."),
      impacto_estimado: d.a.valor_total,
      evidencia: { chave: `duplicidade:${d.a.id}:${d.b.id}`, contaIdA: d.a.id, contaIdB: d.b.id, fornecedorId: d.a.fornecedor_id, valor: d.a.valor_total, pontuacao },
      confianca: "calculo",
    });
    if (gravou) novas++;
  }
  return novas;
}

// ---- Classificação suspeita — muito gasto caindo no catch-all "Outros" ----
function limitesCompetencia(competenciaISO: string): { inicio: string; fim: string } {
  const d = new Date(competenciaISO + "T00:00:00");
  const inicio = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { inicio, fim };
}

async function regraClassificacaoSuspeita(empresaId: string, contasPagar: ContaPagar[], competenciaISO: string, lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const { inicio, fim } = limitesCompetencia(competenciaISO);
  const doMes = contasPagar.filter((c) => c.data_vencimento && c.data_vencimento >= inicio && c.data_vencimento <= fim);
  const valorTotal = doMes.reduce((s, c) => s + (Number(c.valor_total) || 0), 0);
  if (valorTotal <= 0) return 0;
  const valorOutros = doMes.filter((c) => c.categoria === "Outros").reduce((s, c) => s + (Number(c.valor_total) || 0), 0);
  const percentual = (valorOutros / valorTotal) * 100;
  if (percentual < 15 || valorOutros < 200) return 0;
  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(valorOutros, 10000), 75, Math.min(100, percentual));
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaSeNova({
    empresa_id: empresaId, tipo: "classificacao_suspeita", prioridade,
    titulo: L(`${percentual.toFixed(0)}% das contas a pagar do mês caíram em "Outros"`, `${percentual.toFixed(0)}% of this month's payables landed in "Other"`, `${percentual.toFixed(0)}% de las cuentas a pagar del mes cayeron en "Otros"`),
    descricao: L(`R$ ${valorOutros.toFixed(2)} de R$ ${valorTotal.toFixed(2)} lançados numa categoria genérica — informação real fica escondida.`,
      `R$ ${valorOutros.toFixed(2)} of R$ ${valorTotal.toFixed(2)} recorded under a generic category — real detail gets lost.`,
      `R$ ${valorOutros.toFixed(2)} de R$ ${valorTotal.toFixed(2)} registrados en una categoría genérica — información real queda oculta.`),
    causa: null, impacto_estimado: valorOutros,
    evidencia: { chave: `classificacao_outros:${competenciaISO.slice(0, 7)}`, competencia: competenciaISO.slice(0, 7), valorOutros, valorTotal, percentual, pontuacao },
    confianca: "calculo",
  });
  return gravou ? 1 : 0;
}

// ---- Anomalia correlacionada — mesmo fornecedor com 2+ sinais ruins juntos ----
async function regraAnomaliaCorrelacionada(empresaId: string, contasPagar: ContaPagar[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const concFornecedor = await obterConcentracaoFornecedor(empresaId);
  if (!concFornecedor || concFornecedor.percentual < 40) return 0;
  const perdidosDoFornecedor = detectarDescontosPerdidos(contasPagar).filter((p) => p.fornecedorId === concFornecedor.fornecedorId);
  if (perdidosDoFornecedor.length === 0) return 0;
  const impactoTotal = perdidosDoFornecedor.reduce((s, p) => s + p.valorPerdido, 0);
  // Correlação é INFERÊNCIA (2 fatos combinados sugerindo um padrão), nunca
  // fato puro — probabilidade mais conservadora que uma regra de fato único.
  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(concFornecedor.totalAberto, 30000), 65, concFornecedor.percentual);
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaSeNova({
    empresa_id: empresaId, tipo: "risco", prioridade,
    titulo: L(`${concFornecedor.nome}: concentração alta + desconto perdido — vale uma checada`, `${concFornecedor.nome}: high concentration + missed discount — worth a look`, `${concFornecedor.nome}: concentración alta + descuento perdido — vale la pena revisar`),
    descricao: L(`Esse fornecedor concentra ${concFornecedor.percentual.toFixed(0)}% das suas contas a pagar em aberto E já perdeu R$ ${impactoTotal.toFixed(2)} em desconto por atraso — dois sinais juntos no mesmo fornecedor.`,
      `This supplier holds ${concFornecedor.percentual.toFixed(0)}% of your open payables AND already lost R$ ${impactoTotal.toFixed(2)} in discounts due to delays — two signals on the same supplier.`,
      `Este proveedor concentra ${concFornecedor.percentual.toFixed(0)}% de sus cuentas por pagar abiertas Y ya perdió R$ ${impactoTotal.toFixed(2)} en descuento por atraso — dos señales juntas en el mismo proveedor.`),
    causa: L("Dependência alta de um fornecedor que também não está sendo pago no prazo ideal.", "High dependency on a supplier that also isn't being paid on the ideal schedule.", "Dependencia alta de un proveedor que tampoco está siendo pagado en el plazo ideal."),
    impacto_estimado: concFornecedor.totalAberto,
    evidencia: { chave: `correlacao_fornecedor:${concFornecedor.fornecedorId}`, fornecedorId: concFornecedor.fornecedorId, concentracaoPct: concFornecedor.percentual, descontosPerdidos: perdidosDoFornecedor.length, impactoDescontos: impactoTotal, pontuacao },
    confianca: "inferencia",
  });
  return gravou ? 1 : 0;
}

// ============================================================================
// ORQUESTRADOR — "Rodar descoberta". Roda todas as regras acima em sequência
// (cada uma lê o que precisa, sem N+1 — as tabelas grandes como contas_pagar
// são buscadas uma vez e reaproveitadas por 3 regras diferentes).
// ============================================================================

export async function rodarDiscoveryEngine(empresaId: string, lang: Idioma3): Promise<{ novasDescobertas: number; erro?: string }> {
  try {
    const competencia = hojeISO();

    // 1) Variação de despesa — RPC da Rodada 1, já grava e é idempotente sozinha.
    const { error: erroVar } = await supabase.rpc("contador_detectar_variacao_despesa", { p_empresa_id: empresaId, p_competencia: competencia });
    if (erroVar) reportarFalhaEscrita("contador_detectar_variacao_despesa", "rpc", erroVar.message);

    // Contas a pagar são a base de 4 regras diferentes — busca uma vez.
    const { data: cpTodas, error: erroCp } = await supabase.from("contas_pagar").select("*").eq("empresa_id", empresaId);
    if (erroCp) reportarFalhaEscrita("contas_pagar", "select (discovery engine)", erroCp.message);
    const contasPagar = (cpTodas as ContaPagar[]) || [];

    const resultados = await Promise.all([
      regraConcentracaoFornecedor(empresaId, lang),
      regraConcentracaoEBancoECaixa(empresaId, lang),
      regraOportunidadesAP(empresaId, contasPagar, lang),
      regraEstoqueParado(empresaId, lang),
      regraDuplicidades(empresaId, contasPagar, lang),
      regraClassificacaoSuspeita(empresaId, contasPagar, competencia, lang),
      regraAnomaliaCorrelacionada(empresaId, contasPagar, lang),
    ]);

    const novasDescobertas = resultados.reduce((s: number, r) => s + (typeof r === "number" ? r : r ? 1 : 0), 0);
    return { novasDescobertas };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    reportarFalhaEscrita("contador_descoberta", "rodarDiscoveryEngine", motivo);
    return { novasDescobertas: 0, erro: motivo };
  }
}

// ============================================================================
// CONTINUOUS CLOSE — lê o que a RPC contador_close_readiness (Rodada 1) já
// calcula. Data Trust fica só leitura nesta rodada (cálculo é commit futuro,
// documentado no próprio SQL da Rodada 1) — se não houver linha ainda, a
// tela mostra "ainda não calculado", nunca inventa um score.
// ============================================================================

export type FechamentoInfo = {
  competencia: string;
  readiness_pct: number;
  pendencias: {
    eventos_nao_contabilizados: number;
    eventos_total_periodo: number;
    contas_pagar_pendentes: { qtd: number; valor_total: number };
    contas_receber_pendentes: { qtd: number; valor_total: number };
  } | null;
  previsao_prazo: number | null;
  calculado_em: string;
};

export async function obterFechamento(empresaId: string, competenciaISO: string): Promise<FechamentoInfo | null> {
  const primeiroDia = new Date(competenciaISO + "T00:00:00");
  const competencia = new Date(primeiroDia.getFullYear(), primeiroDia.getMonth(), 1).toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("contador_close_readiness", { p_empresa_id: empresaId, p_competencia: competencia });
  if (error) { reportarFalhaEscrita("contador_close_readiness", "rpc", error.message); return null; }
  const linha = Array.isArray(data) ? data[0] : data;
  return (linha as FechamentoInfo) || null;
}

export type DataTrust = {
  competencia: string; score: number; completude: number | null; consistencia: number | null;
  atualidade: number | null; conciliacao: number | null; calculado_em: string;
};

// Só leitura — RPC de cálculo é commit futuro (ver Rodada 1). Sem linha
// ainda = "não calculado", nunca um score inventado.
export async function obterDataTrust(empresaId: string, competenciaISO: string): Promise<DataTrust | null> {
  const primeiroDia = new Date(competenciaISO + "T00:00:00");
  const competencia = new Date(primeiroDia.getFullYear(), primeiroDia.getMonth(), 1).toISOString().slice(0, 10);
  const { data } = await supabase.from("contador_data_trust").select("*").eq("empresa_id", empresaId).eq("competencia", competencia).maybeSingle();
  return (data as DataTrust) || null;
}

// ============================================================================
// "SE EU FIZER NADA" — reaproveita o Gêmeo Financeiro da Tesouraria
// (obterFluxoProjetado + obterPontoFluxoProjetadoAvulso pro ponto de 180d
// que o Gêmeo não usa) e o Capital de Giro. Nenhuma RPC nova, nenhum cálculo
// de projeção duplicado — só lê e organiza pra virar narrativa de CFO.
// ============================================================================

export type ProjecaoDoNada = {
  pontos: { horizonteDias: number; saldoProjetadoBase: number; abaixoDaReserva: boolean }[];
  capitalDeGiro: CapitalDeGiro;
  dividaPendente: number;
  liquidityScoreAtual: LiquidityScoreResultado;
  reservaMinima: number;
};

export async function obterProjecaoDoNada(empresaId: string): Promise<ProjecaoDoNada | null> {
  const config = await obterConfigTesouraria(empresaId);
  const reservaMinima = Number(config?.reserva_minima || 0);
  const [posicao, fluxo, capitalDeGiro, dividaPendente] = await Promise.all([
    obterPosicaoCaixa(empresaId, hojeISO(), reservaMinima),
    obterFluxoProjetado(empresaId, reservaMinima),
    obterCapitalDeGiro(empresaId),
    obterDividaPendente(empresaId),
  ]);
  const ponto180 = await obterPontoFluxoProjetadoAvulso(empresaId, 180, reservaMinima, fluxo.fatorAtrasoAP, fluxo.fracaoAtrasoAR);
  const fluxo30 = fluxo.pontos.find((p) => p.horizonteDias === 30);
  const fluxo90 = fluxo.pontos.find((p) => p.horizonteDias === 90);
  if (!fluxo30 || !fluxo90) return null;
  const liquidityScoreAtual = calcularLiquidityScore({
    caixaDisponivel: posicao.totalDisponivel, saidasProximos30Dias: fluxo30.saidasPrevistas.base,
    reservaMinima, saldoProjetadoBase90: fluxo90.saldoProjetado.base,
  });
  return {
    pontos: [...fluxo.pontos, ponto180].map((p) => ({ horizonteDias: p.horizonteDias, saldoProjetadoBase: p.saldoProjetado.base, abaixoDaReserva: p.abaixoDaReserva.base })),
    capitalDeGiro, dividaPendente, liquidityScoreAtual, reservaMinima,
  };
}

// ============================================================================
// "EXPLIQUE MINHA EMPRESA" — narrativa determinística a partir do ledger
// real (nenhum número inventado). A função devolve DADOS; a tela monta as
// frases em PT/EN/ES a partir deles (mesma separação usada no resto do app).
// ============================================================================

export type LinhaExplicacao = { contaId: string; codigo: string; nome: string; valor: number; percentual: number };

export type ExplicacaoEmpresa = {
  periodo: Periodo;
  comoGanha: LinhaExplicacao[];
  receitaTotal: number;
  ondePerde: LinhaExplicacao[];
  despesaTotal: number;
  tendenciaReceitaMoMPct: number | null;
  tendenciaDespesaMoMPct: number | null;
  concentracaoFornecedor: { fornecedorId: string; nome: string; percentual: number } | null;
  caixaDisponivel: number;
  liquidityScore: LiquidityScoreResultado | null;
  riscos: Descoberta[];
  oportunidades: Descoberta[];
};

function somarPorConta(partidas: PartidaRow[], contaPorId: Map<string, ContaContabil>): Map<string, number> {
  const mapa = new Map<string, number>();
  partidas.forEach((p) => {
    const conta = contaPorId.get(p.conta_id);
    if (!conta) return;
    const delta = saldoNatural(conta.natureza, p.tipo === "debito" ? Number(p.valor) : 0, p.tipo === "credito" ? Number(p.valor) : 0);
    mapa.set(p.conta_id, (mapa.get(p.conta_id) || 0) + delta);
  });
  return mapa;
}

function ranquearContas(contas: ContaContabil[], somas: Map<string, number>, total: number, limite: number): LinhaExplicacao[] {
  return contas
    .map((c) => ({ contaId: c.id, codigo: c.codigo, nome: c.nome, valor: somas.get(c.id) || 0, percentual: total > 0 ? ((somas.get(c.id) || 0) / total) * 100 : 0 }))
    .filter((l) => l.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
}

export async function explicarMinhaEmpresa(empresaId: string): Promise<ExplicacaoEmpresa | null> {
  const periodo = resolverPeriodo("mes_atual");
  const anterior = periodoAnterior(periodo);

  const [contas, lancAtual, lancAnterior, descobertas, posicao, config, concFornecedor] = await Promise.all([
    listarPlanoDeContas(empresaId),
    listarLancamentos(empresaId, periodo.inicio, periodo.fim),
    listarLancamentos(empresaId, anterior.inicio, anterior.fim),
    listarDescobertas(empresaId),
    obterPosicaoCaixa(empresaId, hojeISO(), 0),
    obterConfigTesouraria(empresaId),
    obterConcentracaoFornecedor(empresaId),
  ]);
  if (contas.length === 0) return null;

  const [partidasAtual, partidasAnterior] = await Promise.all([
    listarPartidas(empresaId, lancAtual.map((l: LancamentoContabilRow) => l.id)),
    listarPartidas(empresaId, lancAnterior.map((l: LancamentoContabilRow) => l.id)),
  ]);

  const contaPorId = new Map(contas.map((c) => [c.id, c]));
  const somaAtual = somarPorConta(partidasAtual, contaPorId);
  const somaAnterior = somarPorConta(partidasAnterior, contaPorId);

  const receitaContas = contas.filter((c) => c.tipo === "receita");
  const despesaContas = contas.filter((c) => c.tipo === "despesa");

  const receitaTotal = receitaContas.reduce((s, c) => s + (somaAtual.get(c.id) || 0), 0);
  const despesaTotal = despesaContas.reduce((s, c) => s + (somaAtual.get(c.id) || 0), 0);
  const receitaAnteriorTotal = receitaContas.reduce((s, c) => s + (somaAnterior.get(c.id) || 0), 0);
  const despesaAnteriorTotal = despesaContas.reduce((s, c) => s + (somaAnterior.get(c.id) || 0), 0);

  const reservaMinima = Number(config?.reserva_minima || 0);
  const fluxo30SoParaScore = await obterPontoFluxoProjetadoAvulso(empresaId, 30, reservaMinima, 0, 0);

  return {
    periodo,
    comoGanha: ranquearContas(receitaContas, somaAtual, receitaTotal, 5),
    receitaTotal,
    ondePerde: ranquearContas(despesaContas, somaAtual, despesaTotal, 5),
    despesaTotal,
    tendenciaReceitaMoMPct: receitaAnteriorTotal > 0 ? ((receitaTotal - receitaAnteriorTotal) / receitaAnteriorTotal) * 100 : null,
    tendenciaDespesaMoMPct: despesaAnteriorTotal > 0 ? ((despesaTotal - despesaAnteriorTotal) / despesaAnteriorTotal) * 100 : null,
    concentracaoFornecedor: concFornecedor ? { fornecedorId: concFornecedor.fornecedorId, nome: concFornecedor.nome, percentual: concFornecedor.percentual } : null,
    caixaDisponivel: posicao.totalDisponivel,
    liquidityScore: reservaMinima > 0 || posicao.totalDisponivel > 0
      ? calcularLiquidityScore({ caixaDisponivel: posicao.totalDisponivel, saidasProximos30Dias: fluxo30SoParaScore.saidasPrevistas.base, reservaMinima, saldoProjetadoBase90: fluxo30SoParaScore.saldoProjetado.base })
      : null,
    riscos: descobertas.filter((d) => d.status === "aberto" && d.tipo === "risco").slice(0, 3),
    oportunidades: descobertas.filter((d) => d.status === "aberto" && d.tipo === "oportunidade").slice(0, 3),
  };
}
