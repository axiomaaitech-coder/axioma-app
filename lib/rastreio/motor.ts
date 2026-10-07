// 🦅 AXIOMA AI.TECH — MOTOR DE RASTREABILIDADE (2026-10-07)
//
// Cada movimentação de dinheiro (pagamento, recebimento, estorno) vira um RASTRO
// com a lista de DESTINOS que ela precisa atualizar — cada módulo é uma "porta":
//   ap_pagamento   → contabilidade · fluxo de caixa (saída realizada) · DRE gerencial (custo)
//   ar_recebimento → contabilidade · fluxo de caixa (entrada) · DRE gerencial (receita) · inadimplência
//   ap_estorno / ar_estorno → desfaz o que o pagamento/recebimento deixou em cada porta
// Cada destino guarda status próprio (ok / falhou + motivo + tentativas). Se o
// caminho quebrar, o Guardião (guardiao.ts) e o botão "Houve falha?" refazem só
// o que falta — e refazer NUNCA duplica: índice único por rastro em fluxo_caixa,
// receitas, custos_variaveis e por evento em lancamento_contabil.
//
// O rastro nasce ANTES de qualquer destino rodar: se o navegador fechar no meio,
// fica "pendente" com o caminho inteiro anotado e o Guardião termina depois.
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { publicarEvento } from "../eventFabricHelpers";
import { processarEventoContabil } from "../contabilidadeConsumidor";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type TipoRastreio = "ap_pagamento" | "ap_estorno" | "ar_recebimento" | "ar_estorno";
export type Destino = "contabilidade" | "fluxo_caixa" | "dre_gerencial" | "inadimplencia";
export type StatusDestino = "pendente" | "ok" | "falhou" | "nao_aplica";
export type ResolvidoPor = "motor" | "guardiao" | "usuario";

export const DESTINOS_POR_TIPO: Record<TipoRastreio, Destino[]> = {
  ap_pagamento: ["contabilidade", "fluxo_caixa", "dre_gerencial"],
  ap_estorno: ["contabilidade", "fluxo_caixa", "dre_gerencial"],
  ar_recebimento: ["contabilidade", "fluxo_caixa", "dre_gerencial", "inadimplencia"],
  ar_estorno: ["contabilidade", "fluxo_caixa", "dre_gerencial"],
};

// Tudo que os destinos precisam fica gravado no próprio rastro (payload): refazer
// daqui a uma semana usa exatamente os mesmos dados do momento da baixa.
export type PayloadRastreio = {
  descricao: string;
  contraparte?: string | null;   // fornecedor ou cliente (nome)
  contraparte_id?: string | null;
  categoria?: string | null;
  centro_custo_id?: string | null;
  forma?: string | null;          // forma de pagamento/recebimento
  custo_fixo_id?: string | null;  // conta gerada de custo fixo: o custo já está no módulo Custos Fixos
  quitou?: boolean;               // recebimento quitou a conta (fecha promessas de cobrança)
  evento_tipo: string;            // AP_PAID / AR_RECEIVED / AP_PAYMENT_REVERSED / AR_PAYMENT_REVERSED
  evento_payload: Record<string, unknown>;
  // Desconto concedido na quitação: reconhecimento da receita refeito pelo líquido.
  desconto?: { evento_payload: Record<string, unknown> } | null;
};

export type Rastreio = {
  id: string; empresa_id: string; tipo: TipoRastreio; origem_tabela: string; origem_id: string;
  evento_id: string | null; valor: number; encargos: number; data_movimento: string; descricao: string | null;
  payload: PayloadRastreio & { evento_desconto_id?: string | null }; status: "pendente" | "ok" | "falhou";
  usuario_id: string | null; criado_em: string; concluido_em: string | null;
};
export type RastreioDestino = {
  id: string; rastreio_id: string; destino: Destino; status: StatusDestino; tentativas: number;
  ultimo_erro: string | null; resolvido_por: ResolvidoPor | null; executado_em: string | null;
};

function reportar(operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Rastreio: ${operacao}: ${motivo}`), { extra: { operacao, motivo } });
}

const r2 = (v: number) => Math.round(v * 100) / 100;
const ehDuplicado = (e: { code?: string } | null) => e?.code === "23505";

// De-para de categoria entre módulos (cada porta tem a sua lista).
const CATEGORIA_AP_PARA_CUSTO: Record<string, string> = { Produtos: "Matéria-prima", Marketing: "Marketing", "Logística": "Logística" };
const CATEGORIA_AR_PARA_RECEITA: Record<string, string> = {
  Vendas: "Vendas de produtos", "Serviços": "Prestação de serviços", Consultoria: "Prestação de serviços",
  Mensalidade: "Recorrentes", Outros: "Outras",
};

// ============================================================================
// REGISTRAR — cria o evento + o rastro + os destinos e já tenta percorrer.
// ============================================================================
export async function registrarMovimentacao(p: {
  empresaId: string; tipo: TipoRastreio; origemTabela: "contas_pagar" | "contas_receber"; origemId: string;
  valor: number; encargos?: number; data: string; payload: PayloadRastreio;
}): Promise<{ rastreioId?: string; erro?: string }> {
  const evento = await publicarEvento(p.empresaId, p.payload.evento_tipo, p.payload.evento_payload,
    { modulo: p.origemTabela, tabela: p.origemTabela, id: p.origemId });
  // Sem evento o rastro ainda nasce: o destino contabilidade cria o evento ao refazer.
  const { data, error } = await supabase.from("rastreio_movimentacao").insert({
    empresa_id: p.empresaId, tipo: p.tipo, origem_tabela: p.origemTabela, origem_id: p.origemId,
    evento_id: evento.id ?? null, valor: r2(p.valor), encargos: r2(p.encargos ?? 0), data_movimento: p.data,
    descricao: p.payload.descricao, payload: p.payload,
  }).select("id");
  if (error || !data?.length) {
    const motivo = error?.message || "0 linhas (RLS?)";
    reportar("criar rastro", motivo);
    // Fallback: nunca deixa o dinheiro sem contabilidade só porque o rastro falhou.
    if (evento.id) await processarEventoContabil(p.payload.evento_tipo, p.empresaId,
      { modulo: p.origemTabela, tabela: p.origemTabela, id: p.origemId }, p.payload.evento_payload, { eventoId: evento.id });
    return { erro: motivo };
  }
  const rastreioId = data[0].id as string;
  const { error: erroDest } = await supabase.from("rastreio_destino").insert(
    DESTINOS_POR_TIPO[p.tipo].map((destino) => ({ rastreio_id: rastreioId, empresa_id: p.empresaId, destino })),
  );
  if (erroDest) reportar("criar destinos", erroDest.message);
  // Percorre em segundo plano: a tela não espera a contabilidade/fluxo/DRE pra liberar o usuário.
  void percorrerRastreio(rastreioId, "motor");
  return { rastreioId };
}

// ============================================================================
// PERCORRER — roda cada destino que ainda não chegou. Seguro de repetir.
// ============================================================================
export async function percorrerRastreio(rastreioId: string, quem: ResolvidoPor): Promise<{ ok: boolean; falhas: string[] }> {
  const [{ data: r, error: e1 }, { data: dests, error: e2 }] = await Promise.all([
    supabase.from("rastreio_movimentacao").select("*").eq("id", rastreioId).maybeSingle(),
    supabase.from("rastreio_destino").select("*").eq("rastreio_id", rastreioId),
  ]);
  if (e1 || e2 || !r) return { ok: false, falhas: [e1?.message || e2?.message || "rastro não encontrado"] };
  const rastro = r as Rastreio;
  // Destino que faltou criar (falha no insert dos destinos) é recriado aqui.
  const existentes = new Map(((dests || []) as RastreioDestino[]).map((d) => [d.destino, d]));
  const faltando = DESTINOS_POR_TIPO[rastro.tipo].filter((d) => !existentes.has(d));
  if (faltando.length) {
    const { data: novos } = await supabase.from("rastreio_destino")
      .insert(faltando.map((destino) => ({ rastreio_id: rastro.id, empresa_id: rastro.empresa_id, destino }))).select("*");
    for (const d of (novos || []) as RastreioDestino[]) existentes.set(d.destino, d);
  }

  const falhas: string[] = [];
  for (const destino of DESTINOS_POR_TIPO[rastro.tipo]) {
    const d = existentes.get(destino);
    if (!d || d.status === "ok" || d.status === "nao_aplica") continue;
    let resultado: { status: StatusDestino; erro?: string };
    try {
      resultado = await EXECUTORES[destino](rastro);
    } catch (e) {
      resultado = { status: "falhou", erro: e instanceof Error ? e.message : String(e) };
    }
    if (resultado.status === "falhou") falhas.push(`${destino}: ${resultado.erro}`);
    const { data: gravou, error } = await supabase.from("rastreio_destino").update({
      status: resultado.status, tentativas: (d.tentativas || 0) + 1, ultimo_erro: resultado.erro ?? null,
      resolvido_por: resultado.status === "falhou" ? null : quem, executado_em: new Date().toISOString(),
    }).eq("id", d.id).select("id");
    if (error || !gravou?.length) {
      const motivo = error?.message || "0 linhas (RLS?)";
      falhas.push(`${destino}: não gravou o status (${motivo})`); reportar("gravar status do destino", motivo);
    }
  }

  const ok = falhas.length === 0;
  const { data: fechou, error: erroFechar } = await supabase.from("rastreio_movimentacao").update({
    status: ok ? "ok" : "falhou", concluido_em: ok ? new Date().toISOString() : null,
  }).eq("id", rastro.id).select("id");
  // Se não gravou o status, o rastro continua "pendente" e o Guardião passa de novo — seguro.
  if (erroFechar || !fechou?.length) reportar("fechar rastro", erroFechar?.message || "0 linhas (RLS?)");
  if (!ok) reportar(`rastro ${rastro.id} (${rastro.tipo})`, falhas.join(" | "));
  return { ok, falhas };
}

// ============================================================================
// EXECUTORES — um por porta. Cada um: idempotente e diz exatamente o que falhou.
// ============================================================================
type Resultado = { status: StatusDestino; erro?: string };
const EXECUTORES: Record<Destino, (r: Rastreio) => Promise<Resultado>> = {
  contabilidade: executarContabilidade,
  fluxo_caixa: executarFluxoCaixa,
  dre_gerencial: executarDreGerencial,
  inadimplencia: executarInadimplencia,
};

async function garantirEvento(r: Rastreio, tipo: string, payload: Record<string, unknown>, coluna: "evento_id" | "evento_desconto_id"): Promise<string | null> {
  const atual = coluna === "evento_id" ? r.evento_id : r.payload.evento_desconto_id ?? null;
  if (atual) return atual;
  const ev = await publicarEvento(r.empresa_id, tipo, payload, { modulo: r.origem_tabela, tabela: r.origem_tabela, id: r.origem_id });
  if (!ev.id) return null;
  // O evento SÓ vale depois de anotado no rastro: se não anotar, uma nova tentativa
  // criaria outro evento e lançaria em dobro. Sem anotação → para aqui (nada foi lançado).
  const novoPayload = coluna === "evento_id" ? r.payload : { ...r.payload, evento_desconto_id: ev.id };
  const { data: anotou, error } = await supabase.from("rastreio_movimentacao")
    .update(coluna === "evento_id" ? { evento_id: ev.id } : { payload: novoPayload }).eq("id", r.id).select("id");
  if (error || !anotou?.length) { reportar("anotar evento no rastro", error?.message || "0 linhas (RLS?)"); return null; }
  if (coluna === "evento_id") r.evento_id = ev.id; else r.payload = novoPayload;
  return ev.id;
}

async function jaLancado(eventoId: string): Promise<boolean> {
  const { data } = await supabase.from("lancamento_contabil").select("id").eq("evento_id", eventoId).limit(1);
  return !!data?.length;
}

async function executarContabilidade(r: Rastreio): Promise<Resultado> {
  const origem = { modulo: r.origem_tabela, tabela: r.origem_tabela, id: r.origem_id };
  // 1) Desconto concedido na quitação (receber): refaz o reconhecimento pelo líquido.
  if (r.payload.desconto) {
    const evDesc = await garantirEvento(r, "AR_UPDATED", r.payload.desconto.evento_payload, "evento_desconto_id");
    if (!evDesc) return { status: "falhou", erro: "não foi possível registrar o evento do desconto" };
    if (!(await jaLancado(evDesc))) {
      const res = await processarEventoContabil("AR_UPDATED", r.empresa_id, origem, r.payload.desconto.evento_payload, { eventoId: evDesc });
      if (res.erro) return { status: "falhou", erro: res.erro };
    }
  }
  // 2) O fato principal (pagamento, recebimento ou estorno).
  const evId = await garantirEvento(r, r.payload.evento_tipo, r.payload.evento_payload, "evento_id");
  if (!evId) return { status: "falhou", erro: "não foi possível registrar o evento" };
  const ehEstorno = r.tipo === "ap_estorno" || r.tipo === "ar_estorno";
  // O estorno contábil desfaz "todo pagamento ainda não estornado" da conta. Se já
  // houve pagamento DEPOIS deste estorno, refazê-lo às cegas desfaria o pagamento
  // novo — então para e pede revisão em vez de arriscar o dinheiro.
  if (ehEstorno) {
    const { data: posteriores } = await supabase.from("rastreio_movimentacao").select("id")
      .eq("empresa_id", r.empresa_id).eq("origem_tabela", r.origem_tabela).eq("origem_id", r.origem_id)
      .eq("tipo", r.tipo === "ap_estorno" ? "ap_pagamento" : "ar_recebimento").gt("criado_em", r.criado_em).limit(1);
    if (posteriores?.length) return { status: "falhou", erro: "REVISAO_HUMANA: houve nova baixa depois deste estorno; refazer automaticamente desfaria a baixa nova" };
  }
  // Estorno não gera lançamento com o evento (gera espelhos) — é idempotente por
  // natureza: na 2ª vez não acha mais nada sem estorno.
  if (!ehEstorno && (await jaLancado(evId))) return { status: "ok" };
  const res = await processarEventoContabil(r.payload.evento_tipo, r.empresa_id, origem, r.payload.evento_payload, { eventoId: evId });
  return res.erro ? { status: "falhou", erro: res.erro } : { status: "ok" };
}

async function executarFluxoCaixa(r: Rastreio): Promise<Resultado> {
  if (r.tipo === "ap_estorno" || r.tipo === "ar_estorno") return apagarDaOrigem("fluxo_caixa", r);
  const entrada = r.tipo === "ar_recebimento";
  const quem = r.payload.contraparte ? ` — ${r.payload.contraparte}` : "";
  const { error } = await supabase.from("fluxo_caixa").insert({
    empresa_id: r.empresa_id, user_id: r.usuario_id, rastreio_id: r.id,
    origem_tabela: r.origem_tabela, origem_id: r.origem_id,
    descricao: `${entrada ? "Recebido" : "Pago"}: ${r.payload.descricao}${quem}`,
    tipo: entrada ? "entrada" : "saida", valor: r2(r.valor), data: r.data_movimento, status: "realizado",
    categoria: r.payload.categoria ?? null, forma_pagamento: r.payload.forma ?? null,
  });
  if (error && !ehDuplicado(error)) return { status: "falhou", erro: error.message };
  return { status: "ok" };
}

async function executarDreGerencial(r: Rastreio): Promise<Resultado> {
  if (r.tipo === "ap_estorno") return apagarDaOrigem("custos_variaveis", r);
  if (r.tipo === "ar_estorno") return apagarDaOrigem("receitas", r);
  const quem = r.payload.contraparte ? ` — ${r.payload.contraparte}` : "";
  if (r.tipo === "ap_pagamento") {
    // Conta nascida de um Custo Fixo já está somada no módulo Custos Fixos (DRE
    // mensal): lançar de novo como custo variável contaria o mesmo gasto 2 vezes.
    if (r.payload.custo_fixo_id) return { status: "nao_aplica" };
    // Juros/multa por atraso não é custo do produto: fica só na contabilidade (9.01).
    const principal = r2(r.valor - r.encargos);
    if (principal <= 0) return { status: "nao_aplica" };
    const { error } = await supabase.from("custos_variaveis").insert({
      empresa_id: r.empresa_id, user_id: r.usuario_id, rastreio_id: r.id,
      origem_tabela: r.origem_tabela, origem_id: r.origem_id,
      descricao: `${r.payload.descricao}${quem}`, valor: principal, data: r.data_movimento,
      categoria: CATEGORIA_AP_PARA_CUSTO[r.payload.categoria ?? ""] ?? "Outros",
      centro_custo_id: r.payload.centro_custo_id ?? null, forma_pagamento: r.payload.forma ?? null,
    });
    if (error && !ehDuplicado(error)) return { status: "falhou", erro: error.message };
    return { status: "ok" };
  }
  // ar_recebimento → receita do mês (o que entrou de verdade, juros inclusos).
  const { error } = await supabase.from("receitas").insert({
    empresa_id: r.empresa_id, user_id: r.usuario_id, rastreio_id: r.id,
    origem_tabela: r.origem_tabela, origem_id: r.origem_id,
    descricao: `${r.payload.descricao}${quem}`, valor: r2(r.valor), data: r.data_movimento,
    categoria: CATEGORIA_AR_PARA_RECEITA[r.payload.categoria ?? ""] ?? "Outras", status: "recebido",
    cliente_id: r.payload.contraparte_id ?? null, centro_custo_id: r.payload.centro_custo_id ?? null,
    considera_teto_mei: true,
  });
  if (error && !ehDuplicado(error)) return { status: "falhou", erro: error.message };
  return { status: "ok" };
}

async function executarInadimplencia(r: Rastreio): Promise<Resultado> {
  // Conta quitada: promessa/acordo de pagamento pendente vira "cumprido" sozinho.
  if (!r.payload.quitou) return { status: "nao_aplica" };
  // varredura:ok 0 linhas é normal aqui (conta sem promessa de pagamento pendente)
  const { error } = await supabase.from("cobranca_compromissos").update({ status: "cumprido" })
    .eq("empresa_id", r.empresa_id).eq("conta_id", r.origem_id).eq("status", "pendente");
  return error ? { status: "falhou", erro: error.message } : { status: "ok" };
}

// Estorno: tira dos módulos o que os pagamentos/recebimentos ANTERIORES a ele deixaram.
// Só os anteriores: se o Guardião refizer este estorno depois de um novo pagamento,
// o pagamento novo continua intacto.
async function apagarDaOrigem(tabela: "fluxo_caixa" | "receitas" | "custos_variaveis", r: Rastreio): Promise<Resultado> {
  const tipoOriginal = r.tipo === "ap_estorno" ? "ap_pagamento" : "ar_recebimento";
  const { data: anteriores, error: e1 } = await supabase.from("rastreio_movimentacao").select("id")
    .eq("empresa_id", r.empresa_id).eq("origem_tabela", r.origem_tabela).eq("origem_id", r.origem_id)
    .eq("tipo", tipoOriginal).lt("criado_em", r.criado_em);
  if (e1) return { status: "falhou", erro: e1.message };
  const ids = (anteriores || []).map((x) => x.id as string);
  if (!ids.length) return { status: "ok" };
  const { error } = await supabase.from(tabela).delete().eq("empresa_id", r.empresa_id).in("rastreio_id", ids);
  return error ? { status: "falhou", erro: error.message } : { status: "ok" };
}
