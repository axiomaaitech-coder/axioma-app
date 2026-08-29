// 🦅 AXIOMA AI.TECH — Contas a Pagar: Motor de Match, Nível Base (2-way).
// 100% determinístico — compara números que já existem em nfe_itens,
// estoque_movimentacoes e contas_pagar. Nenhum valor "adivinhado".
// Reaproveitado sem mudança: obterConfigAp (contasPagarHelpers.ts).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { obterConfigAp } from "./contasPagarHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

export type TipoDivergencia =
  // nível base (2-way)
  | "valor" | "quantidade" | "nao_recebido" | "recebido_sem_nota" | "sem_conta"
  // nível 3-way (Pedido de Compra)
  | "sem_pedido" | "pedido_nao_faturado" | "divergencia_pedido"
  // nível 4-way (inspeção de qualidade) — schema preparado, sem lógica ativa ainda
  | "reprovado_inspecao";

export type DivergenciaEncontrada = {
  nfeItemId: string | null;
  tipo: TipoDivergencia;
  esperado: number | null;
  encontrado: number | null;
  descricaoItem: string;
};

export type ResultadoConferencia = {
  matchResultadoId?: string;
  status: "ok" | "excecao";
  score: number;
  divergencias: DivergenciaEncontrada[];
  erro?: string;
};

// % de diferença entre o que a nota diz e o que foi encontrado. esperado=0 é
// caso especial (não dá pra dividir por zero): 0 contra 0 é "bateu", 0 contra
// qualquer outra coisa é divergência máxima (100) — nunca NaN/Infinity.
export function diferencaPct(esperado: number, encontrado: number): number {
  if (esperado === 0) return encontrado === 0 ? 0 : 100;
  return (Math.abs(encontrado - esperado) / Math.abs(esperado)) * 100;
}

// Confere UMA NF-e: fatura × recebimento (linha a linha) + fatura × conta a
// pagar. Grava (ou atualiza, se já existia) 1 linha em match_resultado e
// substitui as divergências antigas pelas atuais. Idempotente — rodar de
// novo na mesma nota não duplica nada (índice único empresa_id+nfe_importada_id).
export async function conferirNfe(empresaId: string, nfeImportadaId: string): Promise<ResultadoConferencia> {
  const { data: nfe, error: erroNfe } = await supabase.from("estoque_nfe_importadas")
    .select("id, chave_acesso, valor_total, numero_nf, fornecedor_id")
    .eq("empresa_id", empresaId).eq("id", nfeImportadaId).maybeSingle();
  if (erroNfe || !nfe) return { status: "excecao", score: 0, divergencias: [], erro: erroNfe?.message || "NF-e não encontrada" };

  const { data: itensNota, error: erroItens } = await supabase.from("nfe_itens")
    .select("id, descricao, quantidade, valor_total, pedido_compra_item_id")
    .eq("empresa_id", empresaId).eq("nfe_importada_id", nfeImportadaId)
    .order("numero_linha", { ascending: true });
  if (erroItens) return { status: "excecao", score: 0, divergencias: [], erro: erroItens.message };
  const itens = itensNota || [];

  // Nível 3-way (Pedido de Compra) — só entra em jogo se o fornecedor desta
  // nota estiver marcado nivel_match='3way'. Fornecedor '2way' (ou nota sem
  // fornecedor resolvido) pula tudo isto: nível base roda idêntico a antes.
  let nivel: "2way" | "3way" = "2way";
  const pedidoItensPorId = new Map<string, { id: string; pedido_compra_id: string; descricao: string; quantidade: number; valor_total: number }>();
  if (nfe.fornecedor_id) {
    const { data: fornecedor } = await supabase.from("fornecedores").select("nivel_match").eq("empresa_id", empresaId).eq("id", nfe.fornecedor_id).maybeSingle();
    if (fornecedor?.nivel_match === "3way") {
      nivel = "3way";
      const idsPedidoItem = itens.map((i: any) => i.pedido_compra_item_id).filter(Boolean);
      if (idsPedidoItem.length > 0) {
        const { data: pedidoItens } = await supabase.from("pedido_compra_itens")
          .select("id, pedido_compra_id, descricao, quantidade, valor_total")
          .eq("empresa_id", empresaId).in("id", idsPedidoItem);
        for (const pi of pedidoItens || []) pedidoItensPorId.set(pi.id, pi as any);
      }
    }
  }

  // Recebimento por item — soma em memória (uma nota real não tem volume que
  // justifique agregação no banco aqui; a query em si já é 1 única por nota,
  // via IN, não 1-por-item).
  const idsItens = itens.map((i) => i.id);
  const recebidoPorItem = new Map<string, { quantidade: number; valor: number }>();
  if (idsItens.length > 0) {
    const { data: movs, error: erroMovs } = await supabase.from("estoque_movimentacoes")
      .select("nfe_item_id, quantidade, custo_unitario")
      .eq("empresa_id", empresaId).in("nfe_item_id", idsItens);
    if (erroMovs) return { status: "excecao", score: 0, divergencias: [], erro: erroMovs.message };
    for (const m of movs || []) {
      if (!m.nfe_item_id) continue;
      const atual = recebidoPorItem.get(m.nfe_item_id) || { quantidade: 0, valor: 0 };
      atual.quantidade += Number(m.quantidade) || 0;
      atual.valor += (Number(m.quantidade) || 0) * (Number(m.custo_unitario) || 0);
      recebidoPorItem.set(m.nfe_item_id, atual);
    }
  }

  // Recebimento "órfão" desta nota — chegou vinculado à mesma chave de
  // acesso (documento_ref) mas sem item específico. Hoje o caminho único de
  // gravação (registrarNfeComItens) sempre preenche nfe_item_id, então isso
  // só aparece se algo fora desse caminho gravar um recebimento manual
  // citando a mesma chave — defensivo, não um caso comum.
  const { data: orfaos, error: erroOrfaos } = await supabase.from("estoque_movimentacoes")
    .select("id, produtos(nome)")
    .eq("empresa_id", empresaId).eq("origem", "nfe").eq("documento_ref", nfe.chave_acesso).is("nfe_item_id", null);
  if (erroOrfaos) return { status: "excecao", score: 0, divergencias: [], erro: erroOrfaos.message };

  const { data: conta, error: erroConta } = await supabase.from("contas_pagar")
    .select("id, valor_total")
    .eq("empresa_id", empresaId).eq("chave_acesso", nfe.chave_acesso)
    .order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (erroConta) return { status: "excecao", score: 0, divergencias: [], erro: erroConta.message };

  const config = await obterConfigAp(empresaId);

  const divergencias: DivergenciaEncontrada[] = [];
  let checks = 0;
  let falhas = 0;

  for (const item of itens) {
    checks++;
    const recebido = recebidoPorItem.get(item.id);
    if (!recebido) {
      divergencias.push({ nfeItemId: item.id, tipo: "nao_recebido", esperado: item.quantidade, encontrado: 0, descricaoItem: item.descricao });
      falhas++;
      continue;
    }
    let itemDivergiu = false;
    if (diferencaPct(item.quantidade, recebido.quantidade) > config.match_tolerancia_quantidade_pct) {
      divergencias.push({ nfeItemId: item.id, tipo: "quantidade", esperado: item.quantidade, encontrado: recebido.quantidade, descricaoItem: item.descricao });
      itemDivergiu = true;
    }
    if (diferencaPct(item.valor_total, recebido.valor) > config.match_tolerancia_valor_pct) {
      divergencias.push({ nfeItemId: item.id, tipo: "valor", esperado: item.valor_total, encontrado: Math.round(recebido.valor * 100) / 100, descricaoItem: item.descricao });
      itemDivergiu = true;
    }
    if (itemDivergiu) falhas++;

    // Pedido × Recebimento × Fatura (3-way) — pula inteiro pra fornecedor 2way.
    if (nivel === "3way") {
      checks++;
      const pedidoItemId = (item as any).pedido_compra_item_id as string | null;
      if (!pedidoItemId) {
        divergencias.push({ nfeItemId: item.id, tipo: "sem_pedido", esperado: null, encontrado: null, descricaoItem: item.descricao });
        falhas++;
      } else {
        const pedidoItem = pedidoItensPorId.get(pedidoItemId);
        if (pedidoItem) {
          const divergiuQtd = diferencaPct(pedidoItem.quantidade, item.quantidade) > config.match_tolerancia_quantidade_pct;
          const divergiuValor = diferencaPct(pedidoItem.valor_total, item.valor_total) > config.match_tolerancia_valor_pct;
          if (divergiuQtd || divergiuValor) {
            divergencias.push({ nfeItemId: item.id, tipo: "divergencia_pedido", esperado: pedidoItem.valor_total, encontrado: item.valor_total, descricaoItem: item.descricao });
            falhas++;
          }
        }
      }
    }
  }

  for (const orfao of orfaos || []) {
    checks++;
    falhas++;
    divergencias.push({ nfeItemId: null, tipo: "recebido_sem_nota", esperado: null, encontrado: null, descricaoItem: (orfao as any).produtos?.nome || "—" });
  }

  checks++; // fatura × conta a pagar
  if (!conta) {
    divergencias.push({ nfeItemId: null, tipo: "sem_conta", esperado: nfe.valor_total, encontrado: null, descricaoItem: `NF-e ${nfe.numero_nf || ""}` });
    falhas++;
  } else if (diferencaPct(nfe.valor_total ?? 0, conta.valor_total ?? 0) > config.match_tolerancia_valor_pct) {
    divergencias.push({ nfeItemId: null, tipo: "valor", esperado: nfe.valor_total, encontrado: conta.valor_total, descricaoItem: `NF-e ${nfe.numero_nf || ""} × conta a pagar` });
    falhas++;
  }

  // Pedido(s) tocados por esta nota — linhas do pedido que NUNCA foram
  // faturadas por nenhuma nota (não só esta) viram 'pedido_nao_faturado', e
  // o status do pedido é recalculado pra refletir o que já foi de fato
  // faturado até agora (aberto/parcial/faturado — nunca reativa um cancelado).
  const pedidosAfetados = Array.from(new Set(Array.from(pedidoItensPorId.values()).map((pi) => pi.pedido_compra_id)));
  let pedidoCompraIdParaResultado: string | null = pedidosAfetados[0] || null;
  if (nivel === "3way" && pedidosAfetados.length > 0) {
    const { data: itensDosPedidos } = await supabase.from("pedido_compra_itens")
      .select("id, descricao, quantidade, valor_total, pedido_compra_id")
      .eq("empresa_id", empresaId).in("pedido_compra_id", pedidosAfetados);
    const idsItensPedido = (itensDosPedidos || []).map((p: any) => p.id);
    const faturadosSet = new Set<string>();
    if (idsItensPedido.length > 0) {
      const { data: vinculados } = await supabase.from("nfe_itens")
        .select("pedido_compra_item_id").eq("empresa_id", empresaId).in("pedido_compra_item_id", idsItensPedido);
      for (const v of vinculados || []) if (v.pedido_compra_item_id) faturadosSet.add(v.pedido_compra_item_id);
    }
    for (const pi of itensDosPedidos || []) {
      checks++;
      if (!faturadosSet.has(pi.id)) {
        divergencias.push({ nfeItemId: null, tipo: "pedido_nao_faturado", esperado: pi.quantidade, encontrado: 0, descricaoItem: pi.descricao });
        falhas++;
      }
    }

    for (const pedidoId of pedidosAfetados) {
      const itensDoPedido = (itensDosPedidos || []).filter((p: any) => p.pedido_compra_id === pedidoId);
      const totalItens = itensDoPedido.length;
      const faturados = itensDoPedido.filter((p: any) => faturadosSet.has(p.id)).length;
      const { data: pedidoAtual } = await supabase.from("pedido_compra").select("status").eq("empresa_id", empresaId).eq("id", pedidoId).maybeSingle();
      if (!pedidoAtual || pedidoAtual.status === "cancelado") continue;
      const novoStatus = totalItens > 0 && faturados === totalItens ? "faturado" : faturados > 0 ? "parcial" : "aberto";
      if (pedidoAtual.status !== novoStatus) {
        const { error: erroStatusPedido } = await supabase.from("pedido_compra").update({ status: novoStatus }).eq("empresa_id", empresaId).eq("id", pedidoId);
        if (erroStatusPedido) reportarFalhaEscrita("pedido_compra", "update status", erroStatusPedido.message);
      }
    }
  }

  const score = checks === 0 ? 100 : Math.max(0, Math.min(100, Math.round((100 * (checks - falhas)) / checks)));
  const status: "ok" | "excecao" = divergencias.length === 0 ? "ok" : "excecao";

  const payloadResultado = {
    empresa_id: empresaId, nfe_importada_id: nfeImportadaId, contas_pagar_id: conta?.id || null,
    pedido_compra_id: pedidoCompraIdParaResultado,
    nivel, status, score,
    resumo: {
      itens_total: itens.length, itens_com_divergencia: new Set(divergencias.filter((d) => d.nfeItemId).map((d) => d.nfeItemId)).size,
      tem_conta: !!conta, tolerancia_valor_pct: config.match_tolerancia_valor_pct, tolerancia_quantidade_pct: config.match_tolerancia_quantidade_pct,
    },
    tolerancia_valor_pct: config.match_tolerancia_valor_pct, tolerancia_quantidade_pct: config.match_tolerancia_quantidade_pct,
  };

  const { data: resultado, error: erroResultado } = await supabase.from("match_resultado")
    .upsert(payloadResultado, { onConflict: "empresa_id,nfe_importada_id" })
    .select("id").single();
  if (erroResultado || !resultado) {
    const motivo = erroResultado?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("match_resultado", "upsert", motivo);
    return { status, score, divergencias, erro: motivo };
  }
  const matchResultadoId = resultado.id as string;

  // Regravação idempotente: some com as divergências da rodada anterior
  // antes de gravar as atuais — nunca acumula histórico duplicado.
  const { error: erroLimpeza } = await supabase.from("match_divergencias").delete().eq("match_resultado_id", matchResultadoId);
  if (erroLimpeza) {
    reportarFalhaEscrita("match_divergencias", "delete (regravação)", erroLimpeza.message);
    return { matchResultadoId, status, score, divergencias, erro: erroLimpeza.message };
  }

  if (divergencias.length > 0) {
    const linhas = divergencias.map((d) => ({
      empresa_id: empresaId, match_resultado_id: matchResultadoId, nfe_item_id: d.nfeItemId,
      tipo: d.tipo, esperado: d.esperado, encontrado: d.encontrado, descricao_item: d.descricaoItem,
    }));
    const { error: erroDivergencias } = await supabase.from("match_divergencias").insert(linhas);
    if (erroDivergencias) {
      reportarFalhaEscrita("match_divergencias", "insert", erroDivergencias.message);
      return { matchResultadoId, status, score, divergencias, erro: erroDivergencias.message };
    }
  }

  return { matchResultadoId, status, score, divergencias };
}

// ============================================================================
// FILA DE EXCEÇÃO — leitura pra tela + decisão humana (aprovar/rejeitar).
// O motor (conferirNfe acima) só sugere; quem decide é sempre uma pessoa.
// ============================================================================

export type MatchResultadoListado = {
  id: string;
  nfeImportadaId: string;
  contasPagarId: string | null;
  status: string;
  score: number | null;
  nivel: string;
  criadoEm: string;
  chaveAcesso: string | null;
  numeroNf: string | null;
  valorNota: number | null;
  fornecedorNome: string | null;
  contaDescricao: string | null;
  contaValor: number | null;
  divergenciasCount: number;
};

// 3 queries no total, não importa quantas notas existam (nenhuma por linha):
// resultados, fornecedores distintos (por id) e contagem de divergências.
export async function listarMatchResultados(empresaId: string, filtroStatus?: string): Promise<MatchResultadoListado[]> {
  let q = supabase.from("match_resultado")
    .select("id, status, score, nivel, contas_pagar_id, nfe_importada_id, criado_em, nfe:estoque_nfe_importadas(chave_acesso, numero_nf, valor_total, fornecedor_id), conta:contas_pagar(descricao, valor_total)")
    .eq("empresa_id", empresaId)
    .order("criado_em", { ascending: false });
  if (filtroStatus) q = q.eq("status", filtroStatus);
  const { data, error } = await q;
  if (error || !data) return [];

  const fornecedorIds = Array.from(new Set(data.map((r: any) => r.nfe?.fornecedor_id).filter(Boolean)));
  const nomesPorFornecedor = new Map<string, string>();
  if (fornecedorIds.length > 0) {
    const { data: forns } = await supabase.from("fornecedores").select("id, nome").eq("empresa_id", empresaId).in("id", fornecedorIds);
    for (const f of forns || []) nomesPorFornecedor.set(f.id, f.nome);
  }

  const matchIds = data.map((r: any) => r.id);
  const contagemPorMatch = new Map<string, number>();
  if (matchIds.length > 0) {
    const { data: divs } = await supabase.from("match_divergencias").select("match_resultado_id").eq("empresa_id", empresaId).in("match_resultado_id", matchIds);
    for (const d of divs || []) contagemPorMatch.set(d.match_resultado_id, (contagemPorMatch.get(d.match_resultado_id) || 0) + 1);
  }

  return data.map((r: any) => ({
    id: r.id, nfeImportadaId: r.nfe_importada_id, contasPagarId: r.contas_pagar_id,
    status: r.status, score: r.score, nivel: r.nivel, criadoEm: r.criado_em,
    chaveAcesso: r.nfe?.chave_acesso || null, numeroNf: r.nfe?.numero_nf || null, valorNota: r.nfe?.valor_total ?? null,
    fornecedorNome: r.nfe?.fornecedor_id ? (nomesPorFornecedor.get(r.nfe.fornecedor_id) || null) : null,
    contaDescricao: r.conta?.descricao || null, contaValor: r.conta?.valor_total ?? null,
    divergenciasCount: contagemPorMatch.get(r.id) || 0,
  }));
}

export type DivergenciaListada = {
  id: string;
  nfeItemId: string | null;
  tipo: TipoDivergencia;
  esperado: number | null;
  encontrado: number | null;
  descricaoItem: string;
};

export async function listarDivergencias(empresaId: string, matchResultadoId: string): Promise<DivergenciaListada[]> {
  const { data, error } = await supabase.from("match_divergencias")
    .select("id, tipo, esperado, encontrado, descricao_item, nfe_item_id")
    .eq("empresa_id", empresaId).eq("match_resultado_id", matchResultadoId)
    .order("criado_em", { ascending: true });
  if (error || !data) return [];
  return data.map((d: any) => ({ id: d.id, tipo: d.tipo, esperado: d.esperado, encontrado: d.encontrado, descricaoItem: d.descricao_item, nfeItemId: d.nfe_item_id }));
}

// Decisão é sempre humana — o motor nunca aprova/rejeita sozinho. Registra
// quem e quando; a auditoria em contas_pagar_auditoria (quando a nota tem
// conta) fica por conta de quem chama isso (a tela já tem registrarAuditoriaAp).
export async function decidirMatchResultado(empresaId: string, matchResultadoId: string, decisao: "aprovado" | "rejeitado", userId: string): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("match_resultado")
    .update({ status: decisao, decidido_por: userId, decidido_em: new Date().toISOString() })
    .eq("empresa_id", empresaId).eq("id", matchResultadoId)
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("match_resultado", `update (${decisao})`, motivo);
    return { erro: motivo };
  }
  return {};
}
