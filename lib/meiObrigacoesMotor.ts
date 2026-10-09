// 🦅 MOTOR CANÔNICO DE OBRIGAÇÕES MEI (DAS) — Rodada 1, 2026-10-09
//
// Fonte única de obrigações e pagamentos do DAS-MEI. Toda tela (MEI, Contas a Pagar,
// Fluxo, Tesouraria, DRE, alertas) lê daqui ou do banco por estas funções — nunca
// recalcula sozinha. Banco: MEI-MOTOR-OBRIGACOES-SQL.sql.
//
//   obrigação (mei_obrigacoes) ── 1:1 ── conta a pagar (contas_pagar.mei_obrigacao_id)
//        ▲ alocação (pagamento_alocacoes) ── pagamento (pagamentos_obrigacao) ── guia (guias_arrecadacao)
//
// Pagamento = 1 transação no banco (mei_registrar_pagamento: trava, chave anti-duplo-
// clique, saldo). Depois, o dinheiro segue pela porta que já existe: Motor de
// Rastreabilidade (ap_pagamento) → Contabilidade (10.01 / juros 9.01), Fluxo realizado.
// DRE gerencial NÃO recebe o DAS como custo (já deduz o imposto do regime).
//
// Projeção (ano sem regra oficial) nunca vira conta a pagar nem dívida.
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { registrarMovimentacao } from "./rastreio/motor";
import { criarContaPagar } from "./contasPagarHelpers";
import { hojeISO } from "./datas";

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export type SituacaoObrigacao = "previsto" | "pendente" | "parcial" | "pago" | "aguardando_conciliacao" | "cancelado" | "retificado";
export type NaturezaObrigacao = "oficial" | "projecao";
export type MetodoPagamento = "pix" | "boleto" | "debito_automatico" | "cartao" | "transferencia" | "outro";
export type OrigemPagamento = "manual" | "extrato" | "comprovante_ia" | "integra_contador" | "pix_axioma";

export type ObrigacaoDAS = {
  id: string; competencia: string; data_vencimento: string; valor_esperado: number | null;
  natureza: NaturezaObrigacao; situacao: SituacaoObrigacao | null; premissa: string | null; regra_id: string | null;
};
export type LinhaResumo = { situacao: SituacaoObrigacao; natureza: NaturezaObrigacao; quantidade: number; valor_esperado: number; valor_pago: number; encargos_pagos: number; saldo: number; saldo_vencido: number };
export type ResumoAno = {
  pago: number; encargosPagos: number;              // pagamentos válidos (estornos fora)
  pendenteOficial: number; vencido: number;         // dívida confirmada (só obrigação oficial)
  aguardandoConciliacao: number;                    // marcado como pago sem pagamento registrado
  projecao: number;                                 // estimativa — nunca somada à dívida
  linhas: LinhaResumo[];
};

const r2 = (v: number) => Math.round(v * 100) / 100;
function reportar(op: string, motivo: string, extra?: Record<string, unknown>) {
  Sentry.captureException(new Error(`[motor MEI] ${op}: ${motivo}`), { extra });
}

// ============================================================================
// REGRAS PURAS (espelho das funções do banco — testadas em scripts/check-mei-obrigacoes.mts)
// ============================================================================

// Ano pelo VENCIMENTO: vencimento em jan/AAAA = competência dez/(AAAA-1).
export function competenciaDoVencimento(ano: number, mesVencimento: number): string {
  const d = new Date(ano, mesVencimento - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Os 12 períodos de um ano (por vencimento). Mesmo cálculo de mei_gerar_periodos_das.
export function periodosDoAno(ano: number, diaVencimento = 20, dataAbertura?: string | null): { competencia: string; vencimento: string }[] {
  const dia = Math.min(28, Math.max(1, Math.trunc(diaVencimento) || 20));
  const inicio = dataAbertura ? dataAbertura.slice(0, 7) : null;
  const out: { competencia: string; vencimento: string }[] = [];
  for (let m = 1; m <= 12; m++) {
    const competencia = competenciaDoVencimento(ano, m);
    if (inicio && competencia < inicio) continue;
    out.push({ competencia, vencimento: `${ano}-${String(m).padStart(2, "0")}-${String(dia).padStart(2, "0")}` });
  }
  return out;
}

export type ParametrosRegra = { salario_minimo: number; inss_pct: number; inss_pct_tac: number; icms: number; iss: number };
// Valor do DAS pela regra e categoria do MEI (mesma conta do banco).
export function valorDAS(p: ParametrosRegra, categoria: string | null | undefined): number {
  const cat = categoria || "Serviços";
  const icms = ["Comércio", "Indústria", "Transporte", "Comércio e Serviços"].includes(cat);
  const iss = ["Serviços", "Comércio e Serviços"].includes(cat);
  const pct = cat === "Transporte" ? p.inss_pct_tac : p.inss_pct; // "Transporte" no Axioma = MEI caminhoneiro (12%)
  return r2(r2(p.salario_minimo * pct / 100) + (icms ? p.icms : 0) + (iss ? p.iss : 0));
}

// Situação pelo que foi pago (espelho de mei_situacao_obrigacao).
export function situacaoPorValores(o: { natureza: NaturezaObrigacao; situacao?: SituacaoObrigacao | null; valor_esperado: number | null }, pago: number): SituacaoObrigacao {
  if (o.situacao === "cancelado" || o.situacao === "retificado") return o.situacao;
  if (o.natureza === "projecao") return "previsto";
  if (pago > 0 && o.valor_esperado != null && pago + 0.005 >= o.valor_esperado) return "pago";
  if (pago > 0) return "parcial";
  if (o.situacao === "aguardando_conciliacao") return "aguardando_conciliacao";
  return "pendente";
}

// Divide um pagamento entre obrigações em aberto, da mais antiga pra mais nova
// (guia com vários meses). O que sobra depois de quitar tudo NÃO some: volta como
// `excedente` pra pessoa dizer se é multa/juros (encargos) — nunca aceito calado.
export function planejarAlocacao(valor: number, abertas: { id: string; data_vencimento: string; saldo: number }[]): { alocacoes: { obrigacao_id: string; valor: number; encargos: number }[]; excedente: number } {
  let resto = r2(valor);
  const alocacoes: { obrigacao_id: string; valor: number; encargos: number }[] = [];
  for (const o of [...abertas].sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))) {
    if (resto <= 0) break;
    const parte = r2(Math.min(resto, o.saldo));
    if (parte > 0) { alocacoes.push({ obrigacao_id: o.id, valor: parte, encargos: 0 }); resto = r2(resto - parte); }
  }
  return { alocacoes, excedente: resto };
}

// Junta as linhas do resumo do banco em números com significado separado.
export function consolidarResumo(linhas: LinhaResumo[]): ResumoAno {
  const n = (v: unknown) => Number(v) || 0;
  const soma = (f: (l: LinhaResumo) => boolean, campo: keyof LinhaResumo) => r2(linhas.filter(f).reduce((s, l) => s + n(l[campo]), 0));
  return {
    pago: soma(() => true, "valor_pago"),
    encargosPagos: soma(() => true, "encargos_pagos"),
    pendenteOficial: soma((l) => l.natureza === "oficial" && (l.situacao === "pendente" || l.situacao === "parcial"), "saldo"),
    vencido: soma(() => true, "saldo_vencido"),
    aguardandoConciliacao: soma((l) => l.situacao === "aguardando_conciliacao", "valor_esperado"),
    projecao: soma((l) => l.natureza === "projecao", "valor_esperado"),
    linhas,
  };
}

// Conciliação com o extrato: SÓ é vínculo confiável com nº da guia no texto ou valor
// idêntico ao de uma guia emitida na mesma janela. "Parece DAS" com valor igual vira
// SUGESTÃO pra pessoa confirmar — nunca baixa sozinha.
export type CandidatoConciliacao = { transacaoId: string; guiaId?: string; obrigacaoIds: string[]; confianca: "vinculo" | "sugestao"; motivo: string };
export function conciliarExtrato(
  transacoes: { id: string; descricao: string; valor: number; data: string }[],
  guias: { id: string; numero_documento: string | null; valor_total: number; data_vencimento: string | null; competencias: string[]; status: string }[],
  abertas: { id: string; competencia: string; saldo: number }[],
): CandidatoConciliacao[] {
  const out: CandidatoConciliacao[] = [];
  const pareceDAS = (t: string) => /\b(das|simples nacional|pgmei|receita federal|rfb)\b/i.test(t);
  const dias = (a: string, b: string) => Math.abs((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / 86400000);
  for (const t of transacoes) {
    const v = r2(Math.abs(t.valor));
    const digitos = t.descricao.replace(/\D/g, "");
    const porNumero = guias.find((g) => g.status === "emitida" && g.numero_documento && g.numero_documento.replace(/\D/g, "").length >= 8 && digitos.includes(g.numero_documento.replace(/\D/g, "")));
    const porValor = guias.find((g) => g.status === "emitida" && Math.abs(g.valor_total - v) < 0.005 && (!g.data_vencimento || dias(g.data_vencimento, t.data) <= 10));
    const guia = porNumero ?? (pareceDAS(t.descricao) ? porValor : undefined);
    if (guia) {
      out.push({ transacaoId: t.id, guiaId: guia.id, obrigacaoIds: abertas.filter((o) => guia.competencias.includes(o.competencia)).map((o) => o.id),
        confianca: porNumero ? "vinculo" : "sugestao", motivo: porNumero ? "nº da guia no extrato" : "valor igual ao de uma guia emitida" });
      continue;
    }
    if (!pareceDAS(t.descricao)) continue;
    const mesmaQuantia = abertas.filter((o) => Math.abs(o.saldo - v) < 0.005);
    if (mesmaQuantia.length) out.push({ transacaoId: t.id, obrigacaoIds: [mesmaQuantia[0].id], confianca: "sugestao", motivo: "texto de DAS com valor igual ao de um mês em aberto" });
  }
  return out;
}

// ============================================================================
// SERVIÇOS (banco) — a empresa é conferida nas funções SQL, nunca só aqui
// ============================================================================

export async function gerarPeriodosDAS(empresaId: string, ano: number): Promise<{ alterados?: number; erro?: string }> {
  const { data, error } = await supabase.rpc("mei_gerar_periodos_das", { p_empresa: empresaId, p_ano: ano });
  if (error) { reportar("gerar períodos", error.message, { ano }); return { erro: error.message }; }
  return { alterados: Number(data) || 0 };
}

export async function lerObrigacoesDAS(empresaId: string, ano: number): Promise<{ data: ObrigacaoDAS[]; erro?: string }> {
  const { data, error } = await supabase.from("mei_obrigacoes")
    .select("id, competencia, data_vencimento, valor_esperado, natureza, situacao, premissa, regra_id")
    .eq("empresa_id", empresaId).eq("tipo", "DAS").gte("data_vencimento", `${ano}-01-01`).lte("data_vencimento", `${ano}-12-31`)
    .order("data_vencimento");
  if (error) { reportar("ler obrigações", error.message, { ano }); return { data: [], erro: error.message }; }
  return { data: (data || []).map((o) => ({ ...o, valor_esperado: o.valor_esperado == null ? null : Number(o.valor_esperado) })) as ObrigacaoDAS[] };
}

export async function resumoObrigacoes(empresaId: string, ano: number): Promise<{ data?: ResumoAno; erro?: string }> {
  const { data, error } = await supabase.rpc("mei_resumo_obrigacoes", { p_empresa: empresaId, p_ano: ano });
  if (error) { reportar("resumo", error.message, { ano }); return { erro: error.message }; }
  return { data: consolidarResumo((data || []) as LinhaResumo[]) };
}

// Garante a conta a pagar da obrigação OFICIAL (Contas a Pagar, Tesouraria, aviso de 7
// dias passam a ver o DAS). Idempotente: o índice único em contas_pagar.mei_obrigacao_id
// faz a 2ª tentativa (outra aba, clique repetido) falhar e reaproveitar a 1ª.
export async function garantirContaPagarDAS(userId: string, empresaId: string, o: ObrigacaoDAS): Promise<{ contaId?: string; erro?: string }> {
  if (o.natureza !== "oficial" || o.valor_esperado == null || o.situacao === "cancelado" || o.situacao === "retificado") return {};
  const existente = await supabase.from("contas_pagar").select("id").eq("empresa_id", empresaId).eq("mei_obrigacao_id", o.id).maybeSingle();
  if (existente.error) return { erro: existente.error.message };
  if (existente.data) return { contaId: existente.data.id as string };
  const ref = `${o.competencia.slice(5, 7)}/${o.competencia.slice(0, 4)}`;
  const r = await criarContaPagar(userId, empresaId, {
    descricao: `DAS-MEI — ref. ${ref}`, categoria: "Impostos", valor_total: o.valor_esperado,
    data_emissao: `${o.competencia}-01`, data_vencimento: o.data_vencimento, mei_obrigacao_id: o.id, fornecedor_id: null,
  }, { origem: "mei_das", dispensarAprovacao: true, proveniencia: { tipo: "DAS-MEI", competencia: o.competencia, regra_id: o.regra_id } });
  if (r.erro) {
    // Corrida com outra aba: a conta já nasceu lá — reaproveita.
    const de_novo = await supabase.from("contas_pagar").select("id").eq("empresa_id", empresaId).eq("mei_obrigacao_id", o.id).maybeSingle();
    if (de_novo.data) return { contaId: de_novo.data.id as string };
    reportar("criar conta do DAS", r.erro, { obrigacao: o.id });
    return { erro: r.erro };
  }
  return { contaId: r.id };
}

type ResultadoAlocacao = { obrigacao_id: string; competencia?: string; situacao: SituacaoObrigacao; saldo?: number; valor: number; encargos: number; conta_pagar_id: string | null };

// Leva cada alocação ao Motor de Rastreabilidade (Contabilidade + Fluxo realizado),
// pela MESMA porta das baixas de Contas a Pagar. Só marca rastreio_ok se todas foram.
async function levarAoRastreio(empresaId: string, pagamentoId: string, alocs: ResultadoAlocacao[], data: string, metodo: string): Promise<{ erro?: string }> {
  let falhou = false;
  for (const a of alocs) {
    if (!a.conta_pagar_id) continue; // obrigação sem conta (não deveria acontecer: registrarPagamentoDAS garante antes)
    const total = r2(a.valor + a.encargos);
    const r = await registrarMovimentacao({
      empresaId, tipo: "ap_pagamento", origemTabela: "contas_pagar", origemId: a.conta_pagar_id, valor: total, encargos: a.encargos, data,
      payload: {
        descricao: `DAS-MEI — ref. ${(a.competencia ?? "").slice(5, 7)}/${(a.competencia ?? "").slice(0, 4)}`, categoria: "Impostos", forma: metodo,
        origem_modulo: "mei_das", evento_tipo: "AP_PAID",
        evento_payload: { conta_id: a.conta_pagar_id, data_pagamento: data, forma_pagamento: metodo, valor_incremento: total, valor_encargos: a.encargos, pagamento_obrigacao_id: pagamentoId },
      },
    });
    if (r.erro) falhou = true;
  }
  if (falhou) return { erro: "rastreio" };
  const { error } = await supabase.rpc("mei_marcar_rastreio_ok", { p_empresa: empresaId, p_pagamento: pagamentoId });
  if (error) reportar("marcar rastreio ok", error.message, { pagamentoId });
  return {};
}

export type ErroPagamento = "sem_permissao" | "excede_saldo" | "obrigacao_projecao" | "obrigacao_sem_valor" | "alocacao_nao_bate" | "data_invalida" | "valor_invalido" | "outro";
function traduzirErro(msg: string): ErroPagamento {
  for (const e of ["sem_permissao", "excede_saldo", "obrigacao_projecao", "obrigacao_sem_valor", "alocacao_nao_bate", "data_invalida", "valor_invalido"] as const) if (msg.includes(e)) return e;
  return "outro";
}

// REGISTRAR PAGAMENTO (baixa). `chave` vem da tela (crypto.randomUUID() ao abrir a
// janela) ou do provedor (id do Pix na Pluggy, nº de autenticação): repetir a chamada
// com a mesma chave devolve o mesmo pagamento, nunca grava 2 vezes.
export async function registrarPagamentoDAS(p: {
  userId: string; empresaId: string; chave: string; valor: number; data: string; metodo: MetodoPagamento; origem: OrigemPagamento;
  alocacoes: { obrigacao_id: string; valor: number; encargos?: number }[]; referencia?: string | null; guiaId?: string | null; evidencia?: string | null;
}): Promise<{ pagamentoId?: string; jaExistia?: boolean; alocacoes?: ResultadoAlocacao[]; erro?: ErroPagamento; avisoRastreio?: boolean }> {
  // Toda obrigação paga precisa da sua conta a pagar ANTES (é por ela que o dinheiro chega na Contabilidade/Fluxo).
  const ids = p.alocacoes.map((a) => a.obrigacao_id);
  const { data: obrs, error: e1 } = await supabase.from("mei_obrigacoes")
    .select("id, competencia, data_vencimento, valor_esperado, natureza, situacao, premissa, regra_id").eq("empresa_id", p.empresaId).in("id", ids);
  if (e1 || !obrs || obrs.length !== ids.length) { reportar("ler obrigações p/ pagamento", e1?.message || "obrigação não encontrada"); return { erro: "outro" }; }
  for (const o of obrs) {
    const c = await garantirContaPagarDAS(p.userId, p.empresaId, { ...(o as ObrigacaoDAS), valor_esperado: o.valor_esperado == null ? null : Number(o.valor_esperado) });
    if (c.erro) return { erro: "outro" };
  }
  const { data, error } = await supabase.rpc("mei_registrar_pagamento", {
    p_empresa: p.empresaId, p_valor: r2(p.valor), p_data: p.data, p_metodo: p.metodo, p_origem: p.origem, p_chave: p.chave,
    p_alocacoes: p.alocacoes.map((a) => ({ obrigacao_id: a.obrigacao_id, valor: r2(a.valor), encargos: r2(a.encargos ?? 0) })),
    p_referencia: p.referencia ?? null, p_guia: p.guiaId ?? null, p_evidencia: p.evidencia ?? null,
  });
  if (error) { const e = traduzirErro(error.message); if (e === "outro") reportar("registrar pagamento", error.message); return { erro: e }; }
  const res = data as { pagamento_id: string; ja_existia: boolean; alocacoes?: ResultadoAlocacao[] };
  if (res.ja_existia) return { pagamentoId: res.pagamento_id, jaExistia: true };
  const r = await levarAoRastreio(p.empresaId, res.pagamento_id, res.alocacoes ?? [], p.data, p.metodo);
  return { pagamentoId: res.pagamento_id, jaExistia: false, alocacoes: res.alocacoes, avisoRastreio: !!r.erro };
}

// ESTORNAR — o pagamento original fica, marcado; nasce a linha de estorno. Na
// Contabilidade/Fluxo, o estorno de conta a pagar desfaz TODAS as baixas da conta
// (regra do motor), então o que continuar pago nela (outro pagamento válido) é
// relançado em seguida — o saldo final bate com o banco.
export async function estornarPagamentoDAS(empresaId: string, pagamentoId: string, motivo: string): Promise<{ estornoId?: string; erro?: string; avisoRastreio?: boolean }> {
  const { data, error } = await supabase.rpc("mei_estornar_pagamento", { p_empresa: empresaId, p_pagamento: pagamentoId, p_motivo: motivo });
  if (error) { if (!/sem_permissao|motivo_obrigatorio|ja_estornado/.test(error.message)) reportar("estornar", error.message); return { erro: error.message }; }
  const res = data as { estorno_id: string; alocacoes: ResultadoAlocacao[] };
  let falhou = false;
  const hoje = hojeISO();
  for (const a of res.alocacoes) {
    if (!a.conta_pagar_id) continue;
    const r1 = await registrarMovimentacao({
      empresaId, tipo: "ap_estorno", origemTabela: "contas_pagar", origemId: a.conta_pagar_id, valor: r2(a.valor + a.encargos), data: hoje,
      payload: { descricao: "Estorno: DAS-MEI", categoria: "Impostos", evento_tipo: "AP_PAYMENT_REVERSED", evento_payload: { conta_id: a.conta_pagar_id, motivo, pagamento_obrigacao_id: pagamentoId } },
    });
    if (r1.erro) { falhou = true; continue; }
    const { data: conta } = await supabase.from("contas_pagar").select("valor_pago, forma_pagamento, data_pagamento").eq("id", a.conta_pagar_id).maybeSingle();
    const resta = r2(Number(conta?.valor_pago) || 0);
    if (resta > 0) {
      const r2_ = await registrarMovimentacao({
        empresaId, tipo: "ap_pagamento", origemTabela: "contas_pagar", origemId: a.conta_pagar_id, valor: resta, data: (conta?.data_pagamento as string) || hoje,
        payload: { descricao: "DAS-MEI (relançado após estorno parcial)", categoria: "Impostos", forma: (conta?.forma_pagamento as string) ?? null, origem_modulo: "mei_das", evento_tipo: "AP_PAID",
          evento_payload: { conta_id: a.conta_pagar_id, valor_incremento: resta, valor_encargos: 0, data_pagamento: conta?.data_pagamento ?? hoje } },
      });
      if (r2_.erro) falhou = true;
    }
  }
  return { estornoId: res.estorno_id, avisoRastreio: falhou };
}

// Conserto: pagamento gravado cujo caminho até Contabilidade/Fluxo não terminou (aba
// fechada no meio). Chamado pelo Guardião; não duplica porque só pega rastreio_ok = false.
export async function completarRastrosPendentes(empresaId: string): Promise<{ consertados: number }> {
  const { data } = await supabase.from("pagamentos_obrigacao").select("id, data_pagamento, metodo")
    .eq("empresa_id", empresaId).eq("rastreio_ok", false).is("estorno_de", null).is("estornado_em", null)
    .lt("criado_em", new Date(Date.now() - 2 * 60_000).toISOString()).limit(20);
  let n = 0;
  for (const p of data || []) {
    // Já existe rastro desta baixa? (marcar ok falhou, mas o dinheiro chegou) — só marca.
    const { data: ja } = await supabase.from("rastreio_movimentacao").select("id").eq("empresa_id", empresaId).eq("tipo", "ap_pagamento")
      .contains("payload", { evento_payload: { pagamento_obrigacao_id: p.id } }).limit(1);
    if (ja?.length) { await supabase.rpc("mei_marcar_rastreio_ok", { p_empresa: empresaId, p_pagamento: p.id }); n++; continue; }
    const { data: alocs } = await supabase.from("pagamento_alocacoes").select("obrigacao_id, valor, encargos, mei_obrigacoes(competencia)").eq("pagamento_id", p.id);
    const lista: ResultadoAlocacao[] = [];
    for (const a of alocs || []) {
      const { data: c } = await supabase.from("contas_pagar").select("id").eq("mei_obrigacao_id", a.obrigacao_id).maybeSingle();
      const comp = (a as unknown as { mei_obrigacoes?: { competencia?: string } }).mei_obrigacoes?.competencia;
      lista.push({ obrigacao_id: a.obrigacao_id as string, competencia: comp, situacao: "pago", valor: Number(a.valor), encargos: Number(a.encargos), conta_pagar_id: (c?.id as string) ?? null });
    }
    const r = await levarAoRastreio(empresaId, p.id as string, lista, p.data_pagamento as string, p.metodo as string);
    if (!r.erro) n++;
  }
  return { consertados: n };
}
