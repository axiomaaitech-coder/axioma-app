// 🦅 AXIOMA AI.TECH — Cobrança Inteligente (Contas a Receber, Fase 2)
// Régua configurável, histórico de contato/negociação, promessas/acordos,
// alertas preditivos e o "conselho explicativo" por regra (sem LLM real —
// mesmo padrão de gerarConselhoCFO/gerarConselhoDivida em cfoCore.ts).
// Reaproveita 100% o motor da Fase 1 (clienteIntelHelpers.ts) — nada
// recalculado do zero.

import { createBrowserClient } from "@supabase/ssr";
import type { ClienteSnapshot, ContaRow, SnapshotCarteira, ScoreAxiomaCliente, Idioma3 } from "./clienteIntelHelpers";
import { scoreRecebimento } from "./clienteIntelHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function diffDias(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

// ============================================================================
// TIPOS — LINHAS DO SUPABASE (3 tabelas novas, ver SQL no relatório de entrega)
// ============================================================================

export type CobrancaInteracao = {
  id: string; user_id: string; conta_id: string; cliente_id?: string | null;
  tipo: "contato" | "negociacao" | "nota"; canal?: string | null;
  descricao: string; data: string; created_at: string;
};

export type CobrancaCompromisso = {
  id: string; user_id: string; conta_id: string; cliente_id?: string | null;
  tipo: "promessa" | "acordo";
  valor_original?: number | null; valor_compromissado: number; data_compromissada: string;
  condicoes?: string | null; status: "pendente" | "cumprido" | "quebrado"; created_at: string;
  // Central de Negociação (Inadimplência, Fase 2) — colunas novas, opcionais até o Elias
  // rodar o ALTER TABLE. Undefined/null tratado como "não informado", nunca erro.
  parcelas?: number | null; desconto_pct?: number | null; juros_pct?: number | null;
  multa_pct?: number | null; responsavel?: string | null;
};

export type EtapaRegua = {
  id: string; user_id: string;
  dias_relativos: number; canal: "email" | "sms" | "whatsapp";
  mensagem_modelo: string; ativo: boolean; ordem: number; created_at?: string;
  // Régua de Recuperação Escalonada (Inadimplência, Fase 2) — coluna nova opcional.
  // null/undefined = etapa de lembrete do Contas a Receber (comportamento inalterado);
  // preenchida = etapa de escalonamento da Inadimplência (não duplica a tabela).
  estagio?: "amigavel" | "formal" | "protesto" | "juridico" | "negativacao" | null;
};

export const CANAIS_REGUA = ["email", "sms", "whatsapp"] as const;

// ============================================================================
// CRUD — histórico de contato/negociação
// ============================================================================

export async function listarInteracoes(contaId?: string): Promise<CobrancaInteracao[]> {
  let q = supabase.from("cobranca_interacoes").select("*").order("data", { ascending: false });
  if (contaId) q = q.eq("conta_id", contaId);
  const { data } = await q;
  return data || [];
}

export async function criarInteracao(userId: string, dados: Partial<CobrancaInteracao>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_interacoes").insert({ ...dados, user_id: userId });
  return error ? { erro: error.message } : {};
}

export async function excluirInteracao(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_interacoes").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// CRUD — promessas de pagamento e acordos (mesma tabela, discriminada por tipo:
// uma promessa é "cliente disse que paga até X"; um acordo é "novo valor/nova
// data combinados formalmente" — estruturalmente idênticos, não vale duplicar
// tabela só por causa do rótulo)
// ============================================================================

export async function listarCompromissos(contaId?: string): Promise<CobrancaCompromisso[]> {
  let q = supabase.from("cobranca_compromissos").select("*").order("data_compromissada", { ascending: true });
  if (contaId) q = q.eq("conta_id", contaId);
  const { data } = await q;
  return data || [];
}

export async function criarCompromisso(userId: string, dados: Partial<CobrancaCompromisso>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_compromissos").insert({ ...dados, user_id: userId, status: "pendente" });
  return error ? { erro: error.message } : {};
}

export async function atualizarStatusCompromisso(id: string, status: CobrancaCompromisso["status"]): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_compromissos").update({ status }).eq("id", id);
  return error ? { erro: error.message } : {};
}

export async function atualizarCompromisso(id: string, dados: Partial<CobrancaCompromisso>): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_compromissos").update(dados).eq("id", id);
  return error ? { erro: error.message } : {};
}

// ============================================================================
// CRUD — régua de cobrança configurável (etapas por dias relativos ao
// vencimento, canal e mensagem-modelo). Nesta fase só monta a régua — nenhum
// envio real acontece, ver bloco de arquitetura futura no fim do arquivo.
// ============================================================================

export function etapasReguaPadrao(): Omit<EtapaRegua, "id" | "user_id">[] {
  return [
    { dias_relativos: -3, canal: "whatsapp", mensagem_modelo: "Olá {cliente}, passando para lembrar que sua fatura {documento} de {valor} vence em 3 dias.", ativo: true, ordem: 0 },
    { dias_relativos: 0, canal: "email", mensagem_modelo: "Olá {cliente}, sua fatura {documento} de {valor} vence hoje.", ativo: true, ordem: 1 },
    { dias_relativos: 1, canal: "whatsapp", mensagem_modelo: "Olá {cliente}, identificamos que a fatura {documento} de {valor} venceu ontem. Já está disponível para pagamento.", ativo: true, ordem: 2 },
    { dias_relativos: 7, canal: "email", mensagem_modelo: "Olá {cliente}, sua fatura {documento} está em aberto há 7 dias. Entre em contato para regularizar.", ativo: true, ordem: 3 },
    { dias_relativos: 15, canal: "sms", mensagem_modelo: "{cliente}, fatura {documento} em atraso há 15 dias. Procure nosso time financeiro.", ativo: true, ordem: 4 },
  ];
}

export async function listarEtapasRegua(userId: string): Promise<EtapaRegua[]> {
  const { data } = await supabase.from("cobranca_regua_etapas").select("*").eq("user_id", userId).order("ordem", { ascending: true });
  return data || [];
}

export async function salvarEtapaRegua(userId: string, etapa: Partial<EtapaRegua>): Promise<{ erro?: string }> {
  if (etapa.id) {
    const { error } = await supabase.from("cobranca_regua_etapas").update(etapa).eq("id", etapa.id);
    return error ? { erro: error.message } : {};
  }
  const { error } = await supabase.from("cobranca_regua_etapas").insert({ ...etapa, user_id: userId });
  return error ? { erro: error.message } : {};
}

export async function excluirEtapaRegua(id: string): Promise<{ erro?: string }> {
  const { error } = await supabase.from("cobranca_regua_etapas").delete().eq("id", id);
  return error ? { erro: error.message } : {};
}

// Qual etapa da régua se aplica a uma conta HOJE, dado o vencimento — usado
// pra mostrar "próxima ação sugerida" na Central de Cobrança sem disparar nada.
export function etapaAplicavelHoje(etapas: EtapaRegua[], dataVencimento: string): EtapaRegua | null {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataVencimento + "T00:00:00");
  const diasDesdeVencimento = diffDias(hoje, venc);
  const ativas = etapas.filter((e) => e.ativo).sort((a, b) => b.dias_relativos - a.dias_relativos);
  return ativas.find((e) => e.dias_relativos <= diasDesdeVencimento) || null;
}

export function preencherModeloMensagem(modelo: string, vars: { cliente?: string; documento?: string; valor?: string }): string {
  return modelo
    .replace(/\{cliente\}/g, vars.cliente || "")
    .replace(/\{documento\}/g, vars.documento || "-")
    .replace(/\{valor\}/g, vars.valor || "");
}

// ============================================================================
// PROBABILIDADE DE RECEBIMENTO — mesma função scoreRecebimento já criada na
// Fase 1 (clienteIntelHelpers.ts), só reaproveitada aqui como "% de chance".
// Exige pelo menos 1 recebimento no histórico do cliente — sem isso, null
// (nunca uma % chutada sem base real).
// ============================================================================

export function probabilidadeRecebimentoConta(conta: ContaRow, s: ClienteSnapshot | null): number | null {
  if (!s || s.pctPagoEmDia < 0) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(conta.data_vencimento + "T00:00:00");
  const diasParaVencer = diffDias(venc, hoje);
  return scoreRecebimento(s.pctPagoEmDia, diasParaVencer);
}

// ============================================================================
// MUDANÇA DE COMPORTAMENTO — o destaque preditivo: compara o atraso médio dos
// últimos recebimentos com o histórico anterior do MESMO cliente. Detecta tanto
// piora (early warning, antes de virar inadimplência) quanto melhora. Exige
// pelo menos 4 recebimentos no total (2 recentes + 2 anteriores) — abaixo
// disso não há base suficiente pra comparar duas janelas, fica de fora.
// ============================================================================

export type SinalComportamento = { tipo: "piora" | "melhora"; atrasoRecente: number; atrasoAnterior: number };

export function detectarMudancaComportamento(s: ClienteSnapshot): SinalComportamento | null {
  const recebidas = s.contas
    .filter((c) => c.status === "recebido" && c.data_recebimento)
    .sort((a, b) => (a.data_recebimento as string).localeCompare(b.data_recebimento as string));
  if (recebidas.length < 4) return null;

  const atrasoDe = (c: ContaRow) => Math.max(0, diffDias(new Date(c.data_recebimento! + "T00:00:00"), new Date(c.data_vencimento + "T00:00:00")));
  const janela = Math.min(3, Math.floor(recebidas.length / 2));
  const recentes = recebidas.slice(-janela).map(atrasoDe);
  const anteriores = recebidas.slice(0, recebidas.length - janela).map(atrasoDe);

  const mediaRecente = recentes.reduce((a, b) => a + b, 0) / recentes.length;
  const mediaAnterior = anteriores.reduce((a, b) => a + b, 0) / anteriores.length;

  if (mediaAnterior <= 3 && mediaRecente >= mediaAnterior + 5 && mediaRecente < 25) {
    return { tipo: "piora", atrasoRecente: Math.round(mediaRecente), atrasoAnterior: Math.round(mediaAnterior) };
  }
  if (mediaAnterior >= 8 && mediaRecente <= Math.max(0, mediaAnterior - 5)) {
    return { tipo: "melhora", atrasoRecente: Math.round(mediaRecente), atrasoAnterior: Math.round(mediaAnterior) };
  }
  return null;
}

// ============================================================================
// ALERTAS INTELIGENTES — painel central, mesmo padrão do Painel de Alertas de
// Fornecedores (Fase 4): cada alerta com severidade, título, descrição e ação
// sugerida. Nunca dispara nada sozinho, só avisa.
// ============================================================================

export type SeveridadeAlerta = "positivo" | "atencao" | "critico";
export type AlertaCobranca = {
  tipo: string; severidade: SeveridadeAlerta;
  clienteId?: string; clienteNome?: string; contaId?: string;
  titulo: string; descricao: string; acao: string;
};

export function detectarAlertasCobranca(
  lang: Idioma3,
  carteira: SnapshotCarteira,
  contas: ContaRow[],
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
  compromissos: CobrancaCompromisso[],
): AlertaCobranca[] {
  const alertas: AlertaCobranca[] = [];
  const hojeStr = new Date().toISOString().slice(0, 10);
  const em3dias = new Date(); em3dias.setDate(em3dias.getDate() + 3);
  const em3diasStr = em3dias.toISOString().slice(0, 10);

  const T = {
    proximos: lang === "en" ? "Upcoming due dates" : lang === "es" ? "Vencimientos próximos" : "Recebimentos próximos",
    proximosDesc: (n: number, v: string) => lang === "en" ? `${n} invoice(s) due in the next 3 days, totaling ${v}.` : lang === "es" ? `${n} factura(s) vencen en los próximos 3 días, totalizando ${v}.` : `${n} cobrança(s) vencem nos próximos 3 dias, somando ${v}.`,
    proximosAcao: lang === "en" ? "Confirm the client is aware." : lang === "es" ? "Confirme que el cliente está al tanto." : "Confirmar que o cliente está ciente.",
    reincidente: lang === "en" ? "Repeat late payer" : lang === "es" ? "Pagador reincidente" : "Cliente reincidente",
    reincidenteDesc: (n: number) => lang === "en" ? `Paid late ${n}+ times historically.` : lang === "es" ? `Pagó tarde ${n}+ veces históricamente.` : `Pagou atrasado ${n}+ vezes no histórico.`,
    reincidenteAcao: lang === "en" ? "Consider tighter payment terms." : lang === "es" ? "Considere condiciones de pago más estrictas." : "Considerar condições de pagamento mais rígidas.",
    altoRisco: lang === "en" ? "High risk client" : lang === "es" ? "Cliente de alto riesgo" : "Cliente de alto risco",
    altoRiscoDesc: (n: number) => lang === "en" ? `Axioma Score critical: ${n}/1000.` : lang === "es" ? `Score Axioma crítico: ${n}/1000.` : `Score Axioma crítico: ${n}/1000.`,
    altoRiscoAcao: lang === "en" ? "Prioritize active collection." : lang === "es" ? "Priorizar cobro activo." : "Priorizar cobrança ativa.",
    concentracao: lang === "en" ? "High revenue concentration" : lang === "es" ? "Alta concentración de ingresos" : "Grande concentração de receita",
    concentracaoDesc: (p: number) => lang === "en" ? `Represents ${p}% of the whole portfolio — dependency risk.` : lang === "es" ? `Representa ${p}% de toda la cartera — riesgo de dependencia.` : `Representa ${p}% de toda a carteira — risco de dependência.`,
    concentracaoAcao: lang === "en" ? "Diversify the client base." : lang === "es" ? "Diversificar la cartera de clientes." : "Diversificar a carteira de clientes.",
    queda: lang === "en" ? "Revenue falling" : lang === "es" ? "Ingreso en caída" : "Receita em queda",
    quedaDesc: (p: number) => lang === "en" ? `Billing dropped ${p}% vs. the prior 3 months.` : lang === "es" ? `Facturación cayó ${p}% frente a los 3 meses anteriores.` : `Cobrança caiu ${p}% frente aos 3 meses anteriores.`,
    quedaAcao: lang === "en" ? "Reach out to understand why." : lang === "es" ? "Contactar para entender el motivo." : "Fazer contato para entender o motivo.",
    fluxo: lang === "en" ? "Cash flow compromised" : lang === "es" ? "Flujo de caja comprometido" : "Fluxo comprometido",
    fluxoDesc: (p: number) => lang === "en" ? `${p}% of the receivable balance is overdue.` : lang === "es" ? `${p}% del saldo por cobrar está vencido.` : `${p}% do saldo a receber está vencido.`,
    fluxoAcao: lang === "en" ? "Review working capital needs." : lang === "es" ? "Revisar necesidad de capital de trabajo." : "Revisar necessidade de capital de giro.",
    quebra: lang === "en" ? "Broken promise/agreement" : lang === "es" ? "Promesa/acuerdo incumplido" : "Promessa/acordo quebrado",
    quebraDesc: (d: string) => lang === "en" ? `Committed date (${d}) has passed with no payment.` : lang === "es" ? `La fecha comprometida (${d}) pasó sin pago.` : `Data combinada (${d}) passou sem pagamento.`,
    quebraAcao: lang === "en" ? "Re-negotiate or escalate." : lang === "es" ? "Renegociar o escalar." : "Renegociar ou escalar a cobrança.",
    critica: lang === "en" ? "Critical revenue at risk" : lang === "es" ? "Ingreso crítico en riesgo" : "Receita crítica em risco",
    criticaDesc: (v: string) => lang === "en" ? `High-value client with critical score — ${v} exposed.` : lang === "es" ? `Cliente de alto valor con score crítico — ${v} expuesto.` : `Cliente de alto valor com score crítico — ${v} exposto.`,
    criticaAcao: lang === "en" ? "Direct executive contact recommended." : lang === "es" ? "Se recomienda contacto ejecutivo directo." : "Recomendado contato executivo direto.",
    anomalia: lang === "en" ? "Unusual invoice amount" : lang === "es" ? "Monto de factura inusual" : "Valor de cobrança fora do padrão",
    anomaliaDesc: (v: string, m: string) => lang === "en" ? `${v} vs. this client's usual average of ${m}.` : lang === "es" ? `${v} frente al promedio habitual de ${m} de este cliente.` : `${v} contra a média habitual de ${m} desse cliente.`,
    anomaliaAcao: lang === "en" ? "Double-check the amount before charging." : lang === "es" ? "Verifique el monto antes de cobrar." : "Confirmar o valor antes de cobrar.",
    piora: lang === "en" ? "Starting to fall behind" : lang === "es" ? "Empezando a atrasarse" : "Começando a atrasar",
    pioraDesc: (r: number, a: number) => lang === "en" ? `Used to pay ~${a}d late, now averaging ~${r}d — early warning before it becomes delinquency.` : lang === "es" ? `Solía pagar con ~${a}d de atraso, ahora promedia ~${r}d — alerta temprana antes de la morosidad.` : `Costumava atrasar ~${a}d, agora está em ~${r}d de média — aviso antecipado antes de virar inadimplência.`,
    pioraAcao: lang === "en" ? "Reach out proactively, before it's overdue." : lang === "es" ? "Contactar proactivamente, antes del vencimiento." : "Fazer contato proativo, antes do vencimento.",
  };

  const pendentes = contas.filter((c) => c.status !== "recebido");
  const totalPendente = pendentes.reduce((s, c) => s + Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)), 0);
  const fmtBRL = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);

  // 1. Recebimentos próximos
  const proximos = pendentes.filter((c) => c.data_vencimento >= hojeStr && c.data_vencimento <= em3diasStr);
  if (proximos.length > 0) {
    const soma = proximos.reduce((s, c) => s + Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)), 0);
    alertas.push({ tipo: "proximos", severidade: "positivo", titulo: T.proximos, descricao: T.proximosDesc(proximos.length, fmtBRL(soma)), acao: T.proximosAcao });
  }

  ranking.forEach(({ s, score }) => {
    // 2. Cliente reincidente
    const recebidasAtrasadas = s.contas.filter((c) => c.status === "recebido" && c.data_recebimento && c.data_recebimento > c.data_vencimento).length;
    if (recebidasAtrasadas >= 3) {
      alertas.push({ tipo: "reincidente", severidade: "atencao", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.reincidente}: ${s.cliente.nome}`, descricao: T.reincidenteDesc(recebidasAtrasadas), acao: T.reincidenteAcao });
    }

    // 3. Alto risco
    if (score.nivel === "critico") {
      alertas.push({ tipo: "alto_risco", severidade: "critico", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.altoRisco}: ${s.cliente.nome}`, descricao: T.altoRiscoDesc(score.total), acao: T.altoRiscoAcao });
    }

    // 4. Concentração de receita
    if (carteira.valorTotalCarteira > 0 && s.valorTotalCobrado / carteira.valorTotalCarteira > 0.25) {
      const pct = Math.round((s.valorTotalCobrado / carteira.valorTotalCarteira) * 100);
      alertas.push({ tipo: "concentracao", severidade: "atencao", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.concentracao}: ${s.cliente.nome}`, descricao: T.concentracaoDesc(pct), acao: T.concentracaoAcao });
    }

    // 5. Receita em queda
    if (s.valorTresMesesAnteriores > 0 && s.valorUltimos3Meses < s.valorTresMesesAnteriores * 0.8) {
      const queda = Math.round((1 - s.valorUltimos3Meses / s.valorTresMesesAnteriores) * 100);
      alertas.push({ tipo: "queda", severidade: "atencao", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.queda}: ${s.cliente.nome}`, descricao: T.quedaDesc(queda), acao: T.quedaAcao });
    }

    // 8. Receita crítica (alto risco + alto valor)
    if (score.nivel === "critico" && carteira.ticketMedioCarteira > 0 && s.valorTotalCobrado > carteira.ticketMedioCarteira * 3) {
      alertas.push({ tipo: "critica", severidade: "critico", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.critica}: ${s.cliente.nome}`, descricao: T.criticaDesc(fmtBRL(s.valorPendente)), acao: T.criticaAcao });
    }

    // 9. Anomalia de valor
    if (s.contas.length >= 3) {
      const media = s.valorTotalCobrado / s.contas.length;
      const ultimaPendente = [...s.contas].filter((c) => c.status !== "recebido").sort((a, b) => (b.data_emissao || "").localeCompare(a.data_emissao || ""))[0];
      if (ultimaPendente && media > 0 && (Number(ultimaPendente.valor) || 0) > media * 2) {
        alertas.push({ tipo: "anomalia", severidade: "atencao", clienteId: s.cliente.id, clienteNome: s.cliente.nome, contaId: ultimaPendente.id, titulo: `${T.anomalia}: ${s.cliente.nome}`, descricao: T.anomaliaDesc(fmtBRL(Number(ultimaPendente.valor) || 0), fmtBRL(media)), acao: T.anomaliaAcao });
      }
    }

    // 10. Mudança de comportamento — destaque preditivo
    const mudanca = detectarMudancaComportamento(s);
    if (mudanca?.tipo === "piora") {
      alertas.push({ tipo: "piora", severidade: "atencao", clienteId: s.cliente.id, clienteNome: s.cliente.nome, titulo: `${T.piora}: ${s.cliente.nome}`, descricao: T.pioraDesc(mudanca.atrasoRecente, mudanca.atrasoAnterior), acao: T.pioraAcao });
    }
  });

  // 6. Fluxo comprometido (nível carteira)
  if (totalPendente > 0) {
    const valorVencido = pendentes.filter((c) => c.data_vencimento < hojeStr).reduce((s, c) => s + Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)), 0);
    const pctVencido = (valorVencido / totalPendente) * 100;
    if (pctVencido > 30) {
      alertas.push({ tipo: "fluxo", severidade: pctVencido > 50 ? "critico" : "atencao", titulo: T.fluxo, descricao: T.fluxoDesc(Math.round(pctVencido)), acao: T.fluxoAcao });
    }
  }

  // 7. Promessas/acordos quebrados
  compromissos.filter((c) => c.status === "pendente" && c.data_compromissada < hojeStr).forEach((c) => {
    const s = carteira.clientesSnapshot.find((x) => x.cliente.id === c.cliente_id);
    alertas.push({
      tipo: "quebra", severidade: "critico", clienteId: c.cliente_id || undefined, clienteNome: s?.cliente.nome, contaId: c.conta_id,
      titulo: `${T.quebra}${s ? `: ${s.cliente.nome}` : ""}`,
      descricao: T.quebraDesc(new Date(c.data_compromissada + "T00:00:00").toLocaleDateString(lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR")),
      acao: T.quebraAcao,
    });
  });

  const ORDEM: Record<SeveridadeAlerta, number> = { critico: 0, atencao: 1, positivo: 2 };
  return alertas.sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
}

// ============================================================================
// FILA DE COBRANÇA PRIORIZADA — usa o Score Axioma da Fase 1 pra ordenar quem
// cobrar primeiro: pior score + maior saldo vencido primeiro.
// ============================================================================

export type ItemFilaCobranca = { s: ClienteSnapshot; score: ScoreAxiomaCliente };

export function filaCobrancaPriorizada(ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[]): ItemFilaCobranca[] {
  return ranking
    .filter((r) => r.s.valorVencido > 0)
    .sort((a, b) => (a.score.total - b.score.total) || (b.s.valorVencido - a.s.valorVencido));
}

// ============================================================================
// IA FINANCEIRA EXPLICATIVA (modo por regras) — nunca só mostra o número,
// sempre explica o que aconteceu / por que / impacto / ação. Mesmo padrão de
// gerarConselhoCFO (cfoCore.ts) e montarConselhoExecutivo (clienteIntelHelpers.ts).
// Fio pronto pra Claude real no dia em que a ANTHROPIC_API_KEY for ativada
// (ver STATUS-AXIOMA.md seção 1) — não chama a API agora, decisão do Elias.
// ============================================================================

export type CardExplicativo = { tema: string; oQueAconteceu: string; porQue: string; impacto: string; acao: string };

export function gerarParecerCobranca(
  lang: Idioma3,
  carteira: SnapshotCarteira,
  contas: ContaRow[],
  ranking: { s: ClienteSnapshot; score: ScoreAxiomaCliente }[],
): CardExplicativo[] {
  const fBRLLocal = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n || 0);
  const cards: CardExplicativo[] = [];
  if (ranking.length === 0) return cards;

  const hojeStr = new Date().toISOString().slice(0, 10);
  const pendentes = contas.filter((c) => c.status !== "recebido");
  const vencidas = pendentes.filter((c) => c.data_vencimento < hojeStr);
  const valorVencido = vencidas.reduce((s, c) => s + Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)), 0);
  const valorPendente = pendentes.reduce((s, c) => s + Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)), 0);
  const criticos = ranking.filter((r) => r.score.nivel === "critico");
  const elite = ranking.filter((r) => r.score.nivel === "elite" || r.score.nivel === "excelente");
  const piorando = ranking.map((r) => ({ r, m: detectarMudancaComportamento(r.s) })).filter((x) => x.m?.tipo === "piora");
  const melhorando = ranking.map((r) => ({ r, m: detectarMudancaComportamento(r.s) })).filter((x) => x.m?.tipo === "melhora");
  const recebidas = contas.filter((c) => c.status === "recebido");
  const noPrazo = recebidas.filter((c) => !c.data_recebimento || c.data_recebimento <= c.data_vencimento);
  const pctPontualidade = recebidas.length > 0 ? Math.round((noPrazo.length / recebidas.length) * 100) : null;

  // 1. Risco de inadimplência / clientes de maior risco
  if (criticos.length > 0) {
    const pior = [...criticos].sort((a, b) => a.score.total - b.score.total)[0];
    cards.push({
      tema: lang === "en" ? "Default risk" : lang === "es" ? "Riesgo de impago" : "Risco de inadimplência",
      oQueAconteceu: lang === "en" ? `${criticos.length} client(s) with critical score, worst is ${pior.s.cliente.nome} (${pior.score.total}/1000).` : lang === "es" ? `${criticos.length} cliente(s) con score crítico, el peor es ${pior.s.cliente.nome} (${pior.score.total}/1000).` : `${criticos.length} cliente(s) com score crítico, o pior é ${pior.s.cliente.nome} (${pior.score.total}/1000).`,
      porQue: lang === "en" ? "Low on-time payment history combined with active overdue balance." : lang === "es" ? "Bajo historial de pago puntual combinado con saldo vencido activo." : "Histórico baixo de pontualidade combinado com saldo vencido ativo.",
      impacto: lang === "en" ? `${fBRLLocal(criticos.reduce((s, r) => s + r.s.valorVencido, 0))} in overdue balance concentrated in these clients.` : lang === "es" ? `${fBRLLocal(criticos.reduce((s, r) => s + r.s.valorVencido, 0))} de saldo vencido concentrado en estos clientes.` : `${fBRLLocal(criticos.reduce((s, r) => s + r.s.valorVencido, 0))} em saldo vencido concentrado nesses clientes.`,
      acao: lang === "en" ? "Prioritize these clients at the top of the collection queue." : lang === "es" ? "Priorizar estos clientes al inicio de la cola de cobro." : "Priorizar esses clientes no topo da fila de cobrança.",
    });
  }

  // 2. Tendência de atraso / quem piorou e quem melhorou
  if (piorando.length > 0 || melhorando.length > 0) {
    cards.push({
      tema: lang === "en" ? "Payment behavior trend" : lang === "es" ? "Tendencia de comportamiento de pago" : "Tendência de comportamento de pagamento",
      oQueAconteceu: lang === "en" ? `${piorando.length} client(s) starting to fall behind, ${melhorando.length} improving.` : lang === "es" ? `${piorando.length} cliente(s) empezando a atrasarse, ${melhorando.length} mejorando.` : `${piorando.length} cliente(s) começando a atrasar, ${melhorando.length} melhorando.`,
      porQue: lang === "en" ? "Comparing each client's most recent payments against their own historical average delay." : lang === "es" ? "Comparando los pagos más recientes de cada cliente con su propio atraso histórico promedio." : "Comparando os pagamentos mais recentes de cada cliente com o atraso médio histórico dele mesmo.",
      impacto: lang === "en" ? "Early signal — acting now avoids these becoming full delinquency later." : lang === "es" ? "Señal temprana — actuar ahora evita que se conviertan en morosidad." : "Sinal antecipado — agir agora evita que virem inadimplência mais à frente.",
      acao: lang === "en" ? "Reach out proactively to those worsening, before the due date." : lang === "es" ? "Contactar proactivamente a quienes empeoran, antes del vencimiento." : "Fazer contato proativo com quem está piorando, antes do vencimento.",
    });
  }

  // 3. Concentração de receita
  const maiorCliente = [...ranking].sort((a, b) => b.s.valorTotalCobrado - a.s.valorTotalCobrado)[0];
  if (maiorCliente && carteira.valorTotalCarteira > 0) {
    const pct = Math.round((maiorCliente.s.valorTotalCobrado / carteira.valorTotalCarteira) * 100);
    cards.push({
      tema: lang === "en" ? "Revenue concentration" : lang === "es" ? "Concentración de ingresos" : "Concentração de receita",
      oQueAconteceu: lang === "en" ? `${maiorCliente.s.cliente.nome} represents ${pct}% of the whole billed portfolio.` : lang === "es" ? `${maiorCliente.s.cliente.nome} representa ${pct}% de toda la cartera facturada.` : `${maiorCliente.s.cliente.nome} representa ${pct}% de toda a carteira cobrada.`,
      porQue: lang === "en" ? "Client base is small or billing is unevenly distributed." : lang === "es" ? "La base de clientes es pequeña o la facturación está distribuida de forma desigual." : "Base de clientes pequena ou cobrança concentrada de forma desigual.",
      impacto: pct > 25 ? (lang === "en" ? "Losing this client would meaningfully hurt cash flow." : lang === "es" ? "Perder este cliente afectaría significativamente el flujo de caja." : "Perder esse cliente afetaria de forma relevante o caixa.") : (lang === "en" ? "Within a healthy range for now." : lang === "es" ? "Dentro de un rango saludable por ahora." : "Dentro de uma faixa saudável por enquanto."),
      acao: pct > 25 ? (lang === "en" ? "Actively diversify the client base." : lang === "es" ? "Diversificar activamente la cartera de clientes." : "Diversificar ativamente a carteira de clientes.") : (lang === "en" ? "Keep monitoring, no action needed now." : lang === "es" ? "Seguir monitoreando, sin acción necesaria." : "Continuar monitorando, sem ação necessária agora."),
    });
  }

  // 4. Impacto no fluxo / capital de giro
  if (valorPendente > 0) {
    const pctVencido = Math.round((valorVencido / valorPendente) * 100);
    cards.push({
      tema: lang === "en" ? "Cash flow & working capital impact" : lang === "es" ? "Impacto en flujo de caja y capital de trabajo" : "Impacto no fluxo de caixa e capital de giro",
      oQueAconteceu: lang === "en" ? `${fBRLLocal(valorVencido)} overdue, ${pctVencido}% of the total open balance.` : lang === "es" ? `${fBRLLocal(valorVencido)} vencido, ${pctVencido}% del saldo total abierto.` : `${fBRLLocal(valorVencido)} vencido, ${pctVencido}% do saldo total em aberto.`,
      porQue: lang === "en" ? "Clients paying later than agreed delays cash entering the business." : lang === "es" ? "Clientes pagando más tarde de lo acordado retrasa la entrada de caja." : "Clientes pagando depois do combinado atrasa a entrada de caixa na empresa.",
      impacto: pctVencido > 30 ? (lang === "en" ? "High enough to pressure working capital — may require short-term credit." : lang === "es" ? "Suficientemente alto para presionar el capital de trabajo — puede requerir crédito de corto plazo." : "Alto o bastante pra pressionar o capital de giro — pode exigir crédito de curto prazo.") : (lang === "en" ? "Manageable level for now." : lang === "es" ? "Nivel manejable por ahora." : "Nível administrável por enquanto."),
      acao: lang === "en" ? "Cross-check this against Fluxo de Caixa's 13-week view." : lang === "es" ? "Cruzar esto con la vista de 13 semanas de Flujo de Caja." : "Cruzar isso com a visão de 13 semanas do Fluxo de Caixa.",
    });
  }

  // 5. Clientes estratégicos (score alto)
  if (elite.length > 0) {
    cards.push({
      tema: lang === "en" ? "Strategic clients" : lang === "es" ? "Clientes estratégicos" : "Clientes estratégicos",
      oQueAconteceu: lang === "en" ? `${elite.length} client(s) with Excellent/Elite score — best-quality receivables.` : lang === "es" ? `${elite.length} cliente(s) con score Excelente/Elite — cuentas por cobrar de mejor calidad.` : `${elite.length} cliente(s) com score Excelente/Elite — contas a receber de melhor qualidade.`,
      porQue: lang === "en" ? "Consistent on-time payment and low concentration risk." : lang === "es" ? "Pago puntual constante y bajo riesgo de concentración." : "Pagamento pontual consistente e baixo risco de concentração.",
      impacto: lang === "en" ? "Reliable, predictable cash contribution." : lang === "es" ? "Contribución de caja confiable y predecible." : "Contribuição de caixa confiável e previsível.",
      acao: lang === "en" ? "Good candidates for better payment terms or upsell." : lang === "es" ? "Buenos candidatos para mejores condiciones de pago o upsell." : "Bons candidatos a melhores condições de pagamento ou upsell.",
    });
  }

  // 6. Padrão de pagamento (pontualidade da carteira)
  if (pctPontualidade != null) {
    cards.push({
      tema: lang === "en" ? "Payment pattern" : lang === "es" ? "Patrón de pago" : "Padrão de pagamento",
      oQueAconteceu: lang === "en" ? `${pctPontualidade}% of received invoices were paid on time.` : lang === "es" ? `${pctPontualidade}% de las facturas recibidas se pagaron a tiempo.` : `${pctPontualidade}% das cobranças recebidas foram pagas em dia.`,
      porQue: pctPontualidade >= 80 ? (lang === "en" ? "Portfolio is dominated by reliable payers." : lang === "es" ? "La cartera está dominada por pagadores confiables." : "Carteira dominada por bons pagadores.") : (lang === "en" ? "A meaningful share of clients pay after the due date." : lang === "es" ? "Una parte importante de los clientes paga después del vencimiento." : "Parcela relevante de clientes paga depois do vencimento."),
      impacto: pctPontualidade >= 80 ? (lang === "en" ? "Predictable cash inflow." : lang === "es" ? "Entrada de caja predecible." : "Entrada de caixa previsível.") : (lang === "en" ? "Forecast reliability drops as this percentage falls." : lang === "es" ? "La confiabilidad del pronóstico cae a medida que este porcentaje baja." : "Confiabilidade da previsão cai conforme esse percentual diminui."),
      acao: pctPontualidade >= 80 ? (lang === "en" ? "Maintain current terms." : lang === "es" ? "Mantener las condiciones actuales." : "Manter as condições atuais.") : (lang === "en" ? "Review payment terms and consider the collection ladder for late payers." : lang === "es" ? "Revisar condiciones de pago y considerar la regla de cobro para morosos." : "Revisar condições de pagamento e considerar a régua de cobrança para atrasadores."),
    });
  }

  return cards;
}

// ============================================================================
// ARQUITETURA FUTURA — DISPARO REAL DA RÉGUA (não implementado agora, a pedido
// do Elias: "não disparar envio real ainda"). Fica pronto pro dia em que
// escolherem um provedor:
//
// 1. Um job agendado (cron, Vercel Cron ou Supabase Edge Function) rodaria uma
//    vez por dia, cruzando `contas_receber` pendentes com `cobranca_regua_etapas`
//    via `etapaAplicavelHoje()` (já pronta acima) pra achar quem precisa de
//    mensagem hoje.
// 2. Pra cada match, `preencherModeloMensagem()` (já pronta acima) montaria o
//    texto final substituindo {cliente}/{documento}/{valor}.
// 3. O envio em si dependeria de um provedor (WhatsApp Business API, SendGrid/
//    Resend pra e-mail, Twilio pra SMS) — nenhum está integrado no Axioma hoje.
// 4. Cada disparo seria registrado automaticamente em `cobranca_interacoes`
//    (tipo "contato", canal da etapa) — fecha o loop sem duplicar a tabela que
//    já existe pra contato manual.
// ============================================================================
