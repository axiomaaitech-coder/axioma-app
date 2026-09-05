// 🦅 AXIOMA AI.TECH — Módulo Fiscal (Axioma Fiscal Intelligence), Rodada 2:
// Control Room + engines determinísticos. Camada de INTELIGÊNCIA sobre o que
// já existe (empresa_obrigacoes, iaTributariaHelpers, cadastro da empresa) —
// nunca um cálculo de imposto duplicado. Deterministic-first ABSOLUTO: toda
// descoberta vem de regra/fórmula, nunca de IA (ZIA/Copilot fiscal é fase
// futura, fora deste arquivo). Evidence-first: toda gravação em
// fiscal_descoberta carrega a evidência que sustenta o achado.
//
// Tabelas/RPCs usadas (Rodada 1, já aplicada — FISCAL-RODADA1-SQL.txt):
// fiscal_descoberta, fiscal_health, empresas.atividade_fiscal/aliquota_iss_pct,
// empresa_obrigacoes (campos novos: competencia/risco/evidencia/responsavel/
// origem). RPCs: fiscal_health_calcular, fiscal_obrigacoes_proximas. Sem SQL
// novo nesta rodada — todo INSERT/UPDATE daqui em diante é direto do client,
// coberto pela RLS já criada.
//
// Reaproveita, não duplica: empresa_obrigacoes continua sendo A lista de
// obrigações (edição completa fica na aba Compliance de /empresa — aqui só
// leitura + ação rápida de status). calcularImpostoRegime/calcularEconomia
// Tributaria/gerarAlertasReforma vêm de lib/iaTributariaHelpers.ts, fonte
// canônica única — nunca recalculados aqui.

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { registrarAuditoria } from "./empresaHelpers";
import {
  pontuarDescoberta, contarPorPrioridade,
  type Idioma3, type TipoDescoberta, type Prioridade, type Confianca, type StatusDescoberta, type ContagemPrioridade,
} from "./contadorHelpers";
import {
  carregarDadosFiscais, calcularImpostoRegime, calcularEconomiaTributaria, gerarAlertasReforma,
  type AtividadeFiscal as AtividadeFiscalPresuncao, type AlertaReforma,
} from "./iaTributariaHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

function hojeISO(): string { return new Date().toISOString().slice(0, 10); }

export type { Idioma3, TipoDescoberta, Prioridade, Confianca, StatusDescoberta, ContagemPrioridade };
export { contarPorPrioridade };

// ============================================================================
// DESCOBERTA FISCAL — leitura e ações (revisar/resolver/ignorar). Mesmo
// desenho do Contador (contador_descoberta), tabela própria fiscal_descoberta
// — ver decisão registrada em FISCAL-RODADA1-SQL.txt.
// ============================================================================

export type DescobertaFiscal = {
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

export async function listarDescobertasFiscais(empresaId: string): Promise<DescobertaFiscal[]> {
  const { data } = await supabase.from("fiscal_descoberta").select("*")
    .eq("empresa_id", empresaId).order("prioridade", { ascending: true }).order("criado_em", { ascending: false });
  return (data as DescobertaFiscal[]) || [];
}

// LÁPIS/LIXEIRA não existem aqui de propósito — descoberta é leitura
// calculada, o dono só muda o STATUS dela (nunca edita título/causa/valor).
export async function atualizarStatusDescobertaFiscal(
  descoberta: DescobertaFiscal,
  novoStatus: Extract<StatusDescoberta, "revisado" | "resolvido" | "ignorado">,
  userId: string | null
): Promise<{ erro?: string }> {
  const agora = new Date().toISOString();
  const { data, error } = await supabase.from("fiscal_descoberta")
    .update({ status: novoStatus, resolvido_em: agora, resolvido_por: userId })
    .eq("id", descoberta.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("fiscal_descoberta", "update status", motivo);
    return { erro: motivo };
  }
  return {};
}

// Gravação idempotente — mesmo espírito do Discovery Engine do Contador:
// cada regra carimba uma "chave" estável na evidência, e antes de gravar
// checa se já existe uma descoberta ABERTA com essa chave. Evita duplicar o
// mesmo achado a cada clique em "Rodar descoberta".
async function gravarDescobertaFiscalSeNova(d: {
  empresa_id: string; tipo: TipoDescoberta; prioridade: Prioridade; titulo: string; descricao: string;
  causa: string | null; impacto_estimado: number; evidencia: Record<string, unknown> & { chave: string };
  confianca: Confianca;
}): Promise<boolean> {
  const { data: existente } = await supabase.from("fiscal_descoberta").select("id")
    .eq("empresa_id", d.empresa_id).eq("tipo", d.tipo).eq("status", "aberto")
    .contains("evidencia", { chave: d.evidencia.chave }).limit(1);
  if (existente && existente.length > 0) return false;
  const { error } = await supabase.from("fiscal_descoberta").insert(d);
  if (error) { reportarFalhaEscrita("fiscal_descoberta", "insert (fiscal radar)", error.message); return false; }
  return true;
}

// ============================================================================
// FISCAL HEALTH SCORE — lê o que a RPC fiscal_health_calcular (Rodada 1) já
// calcula e explica. Nunca inventa score no client.
// ============================================================================

export type FiscalHealth = {
  competencia: string;
  score: number;
  obrigacoes_em_dia_pct: number | null;
  divergencias: number | null;
  documentos_pendentes: number | null;
  exposicao: number | null;
  qualidade_dados: number | null;
  detalhe: {
    obrigacoes_em_dia_pct: number; obrigacoes_total: number; obrigacoes_em_dia: number;
    qualidade_dados_pct: number; campos_ok: number; campos_esperados: number; divergencias_abertas: number;
  } | null;
  calculado_em: string;
};

export async function obterFiscalHealth(empresaId: string, competenciaISO: string): Promise<FiscalHealth | null> {
  const primeiroDia = new Date(competenciaISO + "T00:00:00");
  const competencia = new Date(primeiroDia.getFullYear(), primeiroDia.getMonth(), 1).toISOString().slice(0, 10);
  const { data, error } = await supabase.rpc("fiscal_health_calcular", { p_empresa_id: empresaId, p_competencia: competencia });
  if (error) { reportarFalhaEscrita("fiscal_health_calcular", "rpc", error.message); return null; }
  const linha = Array.isArray(data) ? data[0] : data;
  return (linha as FiscalHealth) || null;
}

// Frase determinística explicando o número — o Health Score SEMPRE se
// explica, nunca aparece "pelado" na tela (regra explícita da Rodada 2).
export function explicarFiscalHealth(h: FiscalHealth, lang: Idioma3): string {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const det = h.detalhe;
  if (!det) return L(`${h.score} — cálculo indisponível no momento.`, `${h.score} — calculation unavailable right now.`, `${h.score} — cálculo no disponible en este momento.`);
  const atrasadas = det.obrigacoes_total - det.obrigacoes_em_dia;
  if (atrasadas === 0 && det.divergencias_abertas === 0 && det.qualidade_dados_pct >= 90) {
    return L(`${h.score} — todas as obrigações do mês em dia, dados completos, nenhuma divergência aberta.`,
      `${h.score} — every obligation this month is on time, data complete, no open discrepancies.`,
      `${h.score} — todas las obligaciones del mes al día, datos completos, ninguna divergencia abierta.`);
  }
  const partes: string[] = [];
  if (atrasadas > 0) partes.push(L(`${atrasadas} obrigação(ões) atrasada(s) de ${det.obrigacoes_total}`, `${atrasadas} obligation(s) late out of ${det.obrigacoes_total}`, `${atrasadas} obligación(es) atrasada(s) de ${det.obrigacoes_total}`));
  if (det.divergencias_abertas > 0) partes.push(L(`${det.divergencias_abertas} divergência(s) aberta(s)`, `${det.divergencias_abertas} open discrepancy(ies)`, `${det.divergencias_abertas} divergencia(s) abierta(s)`));
  if (det.qualidade_dados_pct < 90) partes.push(L(`cadastro fiscal ${det.qualidade_dados_pct.toFixed(0)}% completo`, `tax setup ${det.qualidade_dados_pct.toFixed(0)}% complete`, `registro fiscal ${det.qualidade_dados_pct.toFixed(0)}% completo`));
  return `${h.score} — ${partes.join(", ")}.`;
}

// ============================================================================
// ATIVIDADE FISCAL / CONFIGURAÇÃO — fecha o gap documentado em
// lib/iaTributariaHelpers.ts:138-144 (não existe atividade nem alíquota de
// ISS no cadastro hoje). Grava direto em empresas.
// ============================================================================

export type AtividadeFiscalConfig = "comercio" | "industria" | "servico" | "misto";

export type ConfigFiscal = {
  regime_tributario: string | null;
  cnae_principal: string | null;
  atividade_fiscal: AtividadeFiscalConfig | null;
  aliquota_iss_pct: number | null;
};

export async function obterConfigFiscal(empresaId: string): Promise<ConfigFiscal | null> {
  const { data, error } = await supabase.from("empresas")
    .select("regime_tributario, cnae_principal, atividade_fiscal, aliquota_iss_pct")
    .eq("id", empresaId).maybeSingle();
  if (error) { reportarFalhaEscrita("empresas", "select config fiscal", error.message); return null; }
  return (data as ConfigFiscal) || null;
}

// empresas é owner-only por RLS (empresas_own — decisão do MIGRACAO-
// MULTITENANT.sql, não mexida aqui). Um admin não-dono pode VER esta tela,
// mas o UPDATE é bloqueado pela RLS (0 linhas, sem erro) — detectamos isso
// explicitamente em vez de reportar "salvo" pra uma escrita que não
// aconteceu (anti-falha-silenciosa).
export async function salvarConfigFiscal(
  empresaId: string, userId: string,
  dados: { atividade_fiscal: AtividadeFiscalConfig; aliquota_iss_pct: number | null }
): Promise<{ erro?: string; bloqueadoPorRls?: boolean }> {
  const { data, error } = await supabase.from("empresas")
    .update({ atividade_fiscal: dados.atividade_fiscal, aliquota_iss_pct: dados.aliquota_iss_pct })
    .eq("id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS — só o dono da empresa pode alterar este cadastro)";
    reportarFalhaEscrita("empresas", "update atividade_fiscal/aliquota_iss_pct", motivo);
    return { erro: motivo, bloqueadoPorRls: !error };
  }
  await registrarAuditoria({
    empresaId, userId, tabela: "empresas", registroId: empresaId, acao: "editar",
    valorDepois: dados, descricao: `Atividade fiscal definida: ${dados.atividade_fiscal}${dados.aliquota_iss_pct != null ? `, ISS ${dados.aliquota_iss_pct}%` : ""}`,
  });
  return {};
}

// Mapeia a atividade do cadastro (comercio/industria/servico/misto) pra
// atividade de presunção que calcularLucroPresumido/simularRegimes esperam
// (comercio_industria/servicos/revenda_combustivel) — de-para simples,
// "misto" sem regra própria de presunção cai em serviços (mais conservador:
// alíquota de presunção maior), documentado aqui pra não virar mistério.
export function atividadeFiscalParaPresuncao(a: AtividadeFiscalConfig | null): AtividadeFiscalPresuncao | undefined {
  if (a === "comercio" || a === "industria") return "comercio_industria";
  if (a === "servico" || a === "misto") return "servicos";
  return undefined;
}

// ============================================================================
// CALENDÁRIO DE OBRIGAÇÕES — lê a RPC fiscal_obrigacoes_proximas (Rodada 1),
// que já lê empresa_obrigacoes (a lista real, gerada por regime em
// gerarObrigacoesPadrao). Edição completa continua na aba Compliance de
// /empresa — aqui só leitura + cor de risco calculada no client (não
// persistida, pra nunca ficar desatualizada entre a tela e o hoje real).
// ============================================================================

export type ObrigacaoProxima = {
  id: string;
  tipo: string;
  nome: string;
  data_vencimento: string;
  status: string;
  risco: string | null;
  valor_estimado: number | null;
  dias_restantes: number;
};

export async function obterObrigacoesProximas(empresaId: string, dias = 60): Promise<ObrigacaoProxima[]> {
  const { data, error } = await supabase.rpc("fiscal_obrigacoes_proximas", { p_empresa_id: empresaId, p_dias: dias });
  if (error) { reportarFalhaEscrita("fiscal_obrigacoes_proximas", "rpc", error.message); return []; }
  return (data as ObrigacaoProxima[]) || [];
}

export type CorRisco = "atrasada" | "urgente" | "atencao" | "folga";

// atrasada: já venceu. urgente: vence em até 3 dias. atenção: até 7 dias.
// folga: o resto. Puramente derivado de dias_restantes — nunca uma coluna
// que pode dessincronizar do calendário real.
export function corRiscoObrigacao(o: ObrigacaoProxima): CorRisco {
  if (o.dias_restantes < 0 || o.status === "atrasada") return "atrasada";
  if (o.dias_restantes <= 3) return "urgente";
  if (o.dias_restantes <= 7) return "atencao";
  return "folga";
}

// ============================================================================
// FISCAL RADAR (Discovery Engine) — Priority Engine reaproveitado do
// Contador (pontuarDescoberta: impacto × probabilidade × materialidade,
// piso 15 — evita alerta inútil). Cada regra lê dado real já existente
// (empresa_obrigacoes, iaTributariaHelpers) e, se passar do piso, grava em
// fiscal_descoberta.
// ============================================================================

function normalizarImpactoReais(valorAbsoluto: number, teto: number): number {
  if (teto <= 0) return 0;
  return Math.max(0, Math.min(100, (Math.abs(valorAbsoluto) / teto) * 100));
}

type ObrigacaoRow = {
  id: string; tipo: string; nome: string; data_vencimento: string | null; status: string;
  valor_estimado: number | null; competencia: string | null;
};

// ---- (a) Obrigação atrasada — risco de multa. Multa de mora federal (DAS/
// DCTF/etc): 0,33%/dia de atraso, teto 20% (regra Receita Federal, fonte:
// Lei 9.430/96 art. 61 — mesma alíquota já usada como referência única aqui,
// nunca recalculada de outra forma). Estimativa, não a multa oficial exata
// (pode variar por tributo/SELIC) — sinalizado na descrição. ----
async function regraObrigacaoAtrasada(empresaId: string, obrigacoes: ObrigacaoRow[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const hoje = hojeISO();
  const atrasadas = obrigacoes.filter((o) => o.data_vencimento && o.data_vencimento < hoje && o.status !== "paga" && o.status !== "dispensada");
  let novas = 0;
  for (const o of atrasadas) {
    const diasAtraso = Math.round((new Date(hoje).getTime() - new Date(o.data_vencimento!).getTime()) / 86400000);
    const valor = Number(o.valor_estimado || 0);
    const multaPct = Math.min(20, diasAtraso * 0.33);
    const multaEstimada = valor > 0 ? valor * (multaPct / 100) : 0;
    const { pontuacao, prioridade } = pontuarDescoberta(
      normalizarImpactoReais(valor > 0 ? multaEstimada : diasAtraso * 100, valor > 0 ? 1000 : 3000),
      100, Math.min(100, diasAtraso * 5)
    );
    if (!prioridade) continue;
    const gravou = await gravarDescobertaFiscalSeNova({
      empresa_id: empresaId, tipo: "risco", prioridade,
      titulo: L(`${o.nome} está atrasada há ${diasAtraso} dia(s)`, `${o.nome} is ${diasAtraso} day(s) overdue`, `${o.nome} está atrasada hace ${diasAtraso} día(s)`),
      descricao: valor > 0
        ? L(`Multa de mora estimada: R$ ${multaEstimada.toFixed(2)} (${multaPct.toFixed(1)}% sobre R$ ${valor.toFixed(2)} — 0,33%/dia, teto 20%). Estimativa, confirme o valor oficial na guia.`,
            `Estimated late-payment penalty: R$ ${multaEstimada.toFixed(2)} (${multaPct.toFixed(1)}% of R$ ${valor.toFixed(2)} — 0.33%/day, 20% cap). Estimate — confirm the official amount on the tax slip.`,
            `Multa por mora estimada: R$ ${multaEstimada.toFixed(2)} (${multaPct.toFixed(1)}% sobre R$ ${valor.toFixed(2)} — 0,33%/día, tope 20%). Estimación — confirme el valor oficial en la guía.`)
        : L(`Atraso de ${diasAtraso} dia(s), sem valor estimado cadastrado pra calcular a multa.`, `${diasAtraso} day(s) overdue, no estimated amount on file to calculate the penalty.`, `Atraso de ${diasAtraso} día(s), sin valor estimado registrado para calcular la multa.`),
      causa: L("Vencimento já passou e a obrigação ainda não foi marcada como paga.", "Due date has passed and the obligation is still not marked as paid.", "El vencimiento ya pasó y la obligación aún no fue marcada como pagada."),
      impacto_estimado: multaEstimada || diasAtraso * 50,
      evidencia: { chave: `obrigacao_atrasada:${o.id}`, obrigacaoId: o.id, tipo: o.tipo, diasAtraso, valor, multaPct: Number(multaPct.toFixed(2)), multaEstimada: Number(multaEstimada.toFixed(2)), pontuacao },
      confianca: "calculo",
    });
    if (gravou) novas++;
  }
  return novas;
}

// ---- (b) Obrigação vencendo sem preparação — status ainda 'pendente' e
// vence em até 7 dias, mas ainda não atrasada. ----
async function regraObrigacaoSemPreparacao(empresaId: string, obrigacoes: ObrigacaoRow[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const hoje = hojeISO();
  const proximas = obrigacoes.filter((o) => {
    if (!o.data_vencimento || o.status !== "pendente") return false;
    const dias = Math.round((new Date(o.data_vencimento).getTime() - new Date(hoje).getTime()) / 86400000);
    return dias >= 0 && dias <= 7;
  });
  let novas = 0;
  for (const o of proximas) {
    const dias = Math.round((new Date(o.data_vencimento!).getTime() - new Date(hoje).getTime()) / 86400000);
    const { pontuacao, prioridade } = pontuarDescoberta(70, Math.max(20, 100 - dias * 10), 60);
    if (!prioridade) continue;
    const gravou = await gravarDescobertaFiscalSeNova({
      empresa_id: empresaId, tipo: "risco", prioridade,
      titulo: L(`${o.nome} vence em ${dias} dia(s) e ainda não foi preparada`, `${o.nome} is due in ${dias} day(s) and hasn't been prepared yet`, `${o.nome} vence en ${dias} día(s) y aún no fue preparada`),
      descricao: L(`Status ainda "pendente" — nenhuma indicação de que o pagamento/envio foi iniciado.`, `Status still "pending" — no indication that payment/filing has started.`, `Estado aún "pendiente" — ninguna indicación de que el pago/envío fue iniciado.`),
      causa: null, impacto_estimado: Number(o.valor_estimado || 0),
      evidencia: { chave: `sem_preparacao:${o.id}`, obrigacaoId: o.id, tipo: o.tipo, diasRestantes: dias, pontuacao },
      confianca: "fato",
    });
    if (gravou) novas++;
  }
  return novas;
}

// ---- (c) Divergência entre imposto calculado e o valor cadastrado na
// obrigação (DAS/DAS-MEI/DEFIS mais recente com valor_estimado > 0). Usa
// calcularImpostoRegime (fonte canônica, lib/iaTributariaHelpers.ts) com a
// atividade_fiscal/aliquota_iss_pct reais da empresa quando cadastradas —
// exatamente o gap que a config da Rodada 2 fecha. ----
async function regraDivergenciaImposto(
  empresaId: string, obrigacoes: ObrigacaoRow[], userId: string, lang: Idioma3
): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const candidatas = obrigacoes
    .filter((o) => /^DAS/i.test(o.tipo) && Number(o.valor_estimado || 0) > 0 && o.data_vencimento)
    .sort((a, b) => (b.data_vencimento! < a.data_vencimento! ? -1 : 1));
  const maisRecente = candidatas[0];
  if (!maisRecente) return 0;

  const [dadosFiscais, config] = await Promise.all([carregarDadosFiscais(userId, empresaId), obterConfigFiscal(empresaId)]);
  if (!dadosFiscais.regime_atual) return 0;

  const atividade = atividadeFiscalParaPresuncao(config?.atividade_fiscal || null);
  const impostoCalculado = calcularImpostoRegime(
    dadosFiscais.regime_atual, dadosFiscais.receita_bruta_12m, dadosFiscais.receita_bruta_mensal,
    atividade, config?.aliquota_iss_pct ?? undefined
  );
  const valorCadastrado = Number(maisRecente.valor_estimado || 0);
  if (impostoCalculado <= 0 || valorCadastrado <= 0) return 0;
  const diffPct = Math.abs(impostoCalculado - valorCadastrado) / valorCadastrado * 100;
  if (diffPct < 15) return 0;

  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(Math.abs(impostoCalculado - valorCadastrado), 2000), 70, Math.min(100, diffPct));
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaFiscalSeNova({
    empresa_id: empresaId, tipo: "divergencia", prioridade,
    titulo: L(`${maisRecente.nome}: valor cadastrado diverge ${diffPct.toFixed(0)}% do imposto calculado`, `${maisRecente.nome}: recorded amount diverges ${diffPct.toFixed(0)}% from the calculated tax`, `${maisRecente.nome}: valor registrado diverge ${diffPct.toFixed(0)}% del impuesto calculado`),
    descricao: L(`Cadastrado: R$ ${valorCadastrado.toFixed(2)}. Calculado pela regra do regime (${dadosFiscais.regime_atual}) sobre a receita do mês: R$ ${impostoCalculado.toFixed(2)}.${!config?.atividade_fiscal ? " Atividade fiscal ainda não definida — o cálculo usa um default (Serviços). Defina em Fiscal > Atividade Fiscal pra ficar mais preciso." : ""}`,
      `Recorded: R$ ${valorCadastrado.toFixed(2)}. Calculated from the regime rule (${dadosFiscais.regime_atual}) on this month's revenue: R$ ${impostoCalculado.toFixed(2)}.${!config?.atividade_fiscal ? " Tax activity not defined yet — the calculation uses a default (Services). Set it under Tax > Tax Activity for more accuracy." : ""}`,
      `Registrado: R$ ${valorCadastrado.toFixed(2)}. Calculado por la regla del régimen (${dadosFiscais.regime_atual}) sobre los ingresos del mes: R$ ${impostoCalculado.toFixed(2)}.${!config?.atividade_fiscal ? " Actividad fiscal aún no definida — el cálculo usa un valor por defecto (Servicios). Defínala en Fiscal > Actividad Fiscal para más precisión." : ""}`),
    causa: null, impacto_estimado: Math.abs(impostoCalculado - valorCadastrado),
    evidencia: { chave: `divergencia_imposto:${maisRecente.id}`, obrigacaoId: maisRecente.id, valorCadastrado, impostoCalculado, diffPct: Number(diffPct.toFixed(1)), atividadeDefinida: !!config?.atividade_fiscal, pontuacao },
    confianca: "calculo",
  });
  return gravou ? 1 : 0;
}

// ---- (d) Exposição fiscal — valor de obrigação tipo DAS crescendo mês a
// mês (últimos 3 meses vs. o mais recente), lido direto do histórico real
// de empresa_obrigacoes (mesma filosofia "último vs. média" do
// contador_detectar_variacao_despesa) — nenhum cálculo de receita paralelo. ----
async function regraExposicaoFiscal(empresaId: string, obrigacoes: ObrigacaoRow[], lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const dasComValor = obrigacoes
    .filter((o) => /^DAS/i.test(o.tipo) && Number(o.valor_estimado || 0) > 0 && o.data_vencimento)
    .sort((a, b) => (a.data_vencimento! < b.data_vencimento! ? -1 : 1));
  if (dasComValor.length < 4) return 0;

  const atual = dasComValor[dasComValor.length - 1];
  const historico = dasComValor.slice(-4, -1);
  const media = historico.reduce((s, o) => s + Number(o.valor_estimado || 0), 0) / historico.length;
  const valorAtual = Number(atual.valor_estimado || 0);
  if (media <= 0) return 0;
  const variacaoPct = ((valorAtual - media) / media) * 100;
  if (variacaoPct < 20) return 0;

  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(valorAtual - media, 1500), 65, Math.min(100, variacaoPct));
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaFiscalSeNova({
    empresa_id: empresaId, tipo: "tendencia", prioridade,
    titulo: L(`Carga tributária subindo: ${atual.nome} ${variacaoPct.toFixed(0)}% acima da média`, `Tax burden rising: ${atual.nome} ${variacaoPct.toFixed(0)}% above average`, `Carga tributaria subiendo: ${atual.nome} ${variacaoPct.toFixed(0)}% por encima del promedio`),
    descricao: L(`R$ ${valorAtual.toFixed(2)} contra uma média de R$ ${media.toFixed(2)} nas 3 competências anteriores — receita crescendo (ou enquadramento mudando) mais rápido do que parece no dia a dia.`,
      `R$ ${valorAtual.toFixed(2)} against a R$ ${media.toFixed(2)} average over the previous 3 periods — revenue growing (or bracket shifting) faster than it feels day to day.`,
      `R$ ${valorAtual.toFixed(2)} contra un promedio de R$ ${media.toFixed(2)} en las 3 competencias anteriores — ingresos creciendo (o cambio de tramo) más rápido de lo que parece en el día a día.`),
    causa: null, impacto_estimado: valorAtual - media,
    evidencia: { chave: `exposicao_fiscal:${atual.tipo}`, valorAtual, media, variacaoPct: Number(variacaoPct.toFixed(1)), mesesHistorico: historico.length, pontuacao },
    confianca: "calculo",
  });
  return gravou ? 1 : 0;
}

// ---- (e) Oportunidade — regime tributário talvez não ideal. Só sinaliza,
// nunca afirma (confiança = inferência) — reaproveita calcularEconomia
// Tributaria (fonte canônica), nenhuma simulação de regime nova aqui. ----
async function regraOportunidadeRegime(empresaId: string, userId: string, lang: Idioma3): Promise<number> {
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const dadosFiscais = await carregarDadosFiscais(userId, empresaId);
  if (!dadosFiscais.regime_atual || dadosFiscais.receita_bruta_mensal <= 0) return 0;
  const economia = calcularEconomiaTributaria(dadosFiscais);
  if (economia.economia_mensal < 200) return 0;

  const { pontuacao, prioridade } = pontuarDescoberta(normalizarImpactoReais(economia.economia_anual, 30000), 50, 60);
  if (!prioridade) return 0;
  const gravou = await gravarDescobertaFiscalSeNova({
    empresa_id: empresaId, tipo: "oportunidade", prioridade,
    titulo: L(`Regime tributário pode não ser o ideal — vale simular`, `Tax regime may not be ideal — worth simulating`, `El régimen tributario puede no ser el ideal — vale la pena simular`),
    descricao: L(`Simulação aponta possível economia de R$ ${economia.economia_mensal.toFixed(2)}/mês migrando de ${economia.regime_atual} para ${economia.regime_ideal}. Isto é uma SUGESTÃO baseada em receita/custos atuais, não uma recomendação definitiva — confirme com o simulador completo em IA Tributária antes de decidir.`,
      `Simulation points to a possible R$ ${economia.economia_mensal.toFixed(2)}/month saving migrating from ${economia.regime_atual} to ${economia.regime_ideal}. This is a SUGGESTION based on current revenue/costs, not a final recommendation — confirm with the full simulator under Tax AI before deciding.`,
      `La simulación indica un posible ahorro de R$ ${economia.economia_mensal.toFixed(2)}/mes migrando de ${economia.regime_atual} a ${economia.regime_ideal}. Esto es una SUGERENCIA basada en ingresos/costos actuales, no una recomendación definitiva — confirme con el simulador completo en IA Tributaria antes de decidir.`),
    causa: null, impacto_estimado: economia.economia_anual,
    evidencia: { chave: "oportunidade_regime", regimeAtual: economia.regime_atual, regimeIdeal: economia.regime_ideal, economiaMensal: economia.economia_mensal, economiaAnual: economia.economia_anual, pontuacao },
    confianca: "inferencia",
  });
  return gravou ? 1 : 0;
}

// ============================================================================
// ORQUESTRADOR — "Rodar descoberta". empresa_obrigacoes é base de 4 das 5
// regras — busca uma vez, reaproveita (nunca N+1).
// ============================================================================

export async function rodarFiscalRadar(empresaId: string, userId: string, lang: Idioma3): Promise<{ novasDescobertas: number; erro?: string }> {
  try {
    const { data: obrigData, error: erroObrig } = await supabase.from("empresa_obrigacoes")
      .select("id, tipo, nome, data_vencimento, status, valor_estimado, competencia")
      .eq("empresa_id", empresaId);
    if (erroObrig) reportarFalhaEscrita("empresa_obrigacoes", "select (fiscal radar)", erroObrig.message);
    const obrigacoes = (obrigData as ObrigacaoRow[]) || [];

    const resultados = await Promise.all([
      regraObrigacaoAtrasada(empresaId, obrigacoes, lang),
      regraObrigacaoSemPreparacao(empresaId, obrigacoes, lang),
      regraDivergenciaImposto(empresaId, obrigacoes, userId, lang),
      regraExposicaoFiscal(empresaId, obrigacoes, lang),
      regraOportunidadeRegime(empresaId, userId, lang),
    ]);

    const novasDescobertas = resultados.reduce((s, r) => s + r, 0);
    return { novasDescobertas };
  } catch (e) {
    const motivo = e instanceof Error ? e.message : String(e);
    reportarFalhaEscrita("fiscal_descoberta", "rodarFiscalRadar", motivo);
    return { novasDescobertas: 0, erro: motivo };
  }
}

// ============================================================================
// REFORMA TRIBUTÁRIA — reaproveita gerarAlertasReforma (lib/
// iaTributariaHelpers.ts), nenhuma alíquota/data nova inventada aqui. Só
// ordena o alerta mais relevante pro regime atual da empresa pro topo.
// ============================================================================

export function alertasReformaRelevantes(regimeAtual: string | null): AlertaReforma[] {
  const alertas = gerarAlertasReforma();
  if (!regimeAtual) return alertas;
  const r = regimeAtual.toLowerCase();
  return [...alertas].sort((a, b) => {
    const aRelevante = r.includes("simples") && a.titulo.includes("Simples") ? 1 : 0;
    const bRelevante = r.includes("simples") && b.titulo.includes("Simples") ? 1 : 0;
    return bRelevante - aRelevante;
  });
}
