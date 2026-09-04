// 🦅 AXIOMA — Treasury Intelligence, Rodada 2: engines determinísticos do
// Command Center (/tesouraria). Lê a fundação da Rodada 1 (tabelas
// tesouraria_* + RPCs tesouraria_posicao/tesouraria_fluxo_projetado, já
// aplicadas no banco) — nenhuma escrita nova de schema aqui. Determinístico
// 100%: nada de IA nesta rodada (ZIA é Rodada 3).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { calcularFatorAtrasoHistorico, type ContaPagaParaFatorAtraso } from "./contasPagarHelpers";
import { normalizarTexto } from "./cfoCore";
import { carregarKpisEstoque } from "./estoqueHelpers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

export type Idioma3 = "pt" | "en" | "es";

// ============================================================================
// CONFIG (tesouraria_config) — reserva mínima + dias de alerta de ruptura.
// ============================================================================

export type TesourariaConfig = {
  id: string;
  empresa_id: string;
  reserva_minima: number;
  dias_alerta_ruptura: number;
};

export async function obterConfigTesouraria(empresaId: string): Promise<TesourariaConfig | null> {
  const { data } = await supabase.from("tesouraria_config").select("id, empresa_id, reserva_minima, dias_alerta_ruptura").eq("empresa_id", empresaId).maybeSingle();
  return (data as TesourariaConfig) || null;
}

export async function salvarConfigTesouraria(empresaId: string, reservaMinima: number, diasAlertaRuptura: number): Promise<{ ok: boolean; erro?: string }> {
  const { data, error } = await supabase.from("tesouraria_config")
    .update({ reserva_minima: reservaMinima, dias_alerta_ruptura: diasAlertaRuptura, atualizado_em: new Date().toISOString() })
    .eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_config", "update", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

// ============================================================================
// CONTAS DE TESOURARIA (tesouraria_conta) — Config: dar nome amigável ao banco.
// ============================================================================

export type ContaTesouraria = {
  id: string;
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  tipo_liquidez: "disponivel" | "aplicado" | "restrito";
  banco_nome: string | null;
  ativo: boolean;
};

export async function listarContasTesouraria(empresaId: string): Promise<ContaTesouraria[]> {
  const { data } = await supabase.from("tesouraria_conta")
    .select("id, conta_id, tipo_liquidez, banco_nome, ativo, plano_de_contas!inner(codigo, nome)")
    .eq("empresa_id", empresaId).order("tipo_liquidez");
  return ((data as any[]) || []).map((r) => ({
    id: r.id, conta_id: r.conta_id, tipo_liquidez: r.tipo_liquidez, banco_nome: r.banco_nome, ativo: r.ativo,
    conta_codigo: r.plano_de_contas.codigo, conta_nome: r.plano_de_contas.nome,
  }));
}

export async function salvarBancoNomeConta(id: string, empresaId: string, bancoNome: string): Promise<{ ok: boolean; erro?: string }> {
  const { data, error } = await supabase.from("tesouraria_conta")
    .update({ banco_nome: bancoNome || null }).eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_conta", "update (banco_nome)", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

// ============================================================================
// POSIÇÃO DE CAIXA — chama a RPC tesouraria_posicao (fonte: o ledger, mesma
// base do Razão/Balancete). Nunca recalcula saldo aqui — só agrupa o que a
// RPC já devolveu pronto.
// ============================================================================

export type LinhaPosicao = {
  conta_id: string;
  conta_codigo: string;
  conta_nome: string;
  tipo_liquidez: "disponivel" | "aplicado" | "restrito";
  banco_nome: string | null;
  saldo: number;
};

export type PosicaoCaixa = {
  linhas: LinhaPosicao[];
  totalDisponivel: number;
  totalAplicado: number;
  totalRestrito: number;
  totalGeral: number;
  reservaMinima: number;
  totalLivre: number; // disponível − reserva mínima, nunca negativo
};

export async function obterPosicaoCaixa(empresaId: string, data: string, reservaMinima: number): Promise<PosicaoCaixa> {
  const { data: linhas, error } = await supabase.rpc("tesouraria_posicao", { p_empresa_id: empresaId, p_data: data });
  if (error) reportarFalhaEscrita("tesouraria_posicao", "rpc select", error.message);
  const l = (linhas as LinhaPosicao[]) || [];
  const somaTipo = (t: string) => l.filter((x) => x.tipo_liquidez === t).reduce((s, x) => s + Number(x.saldo), 0);
  const totalDisponivel = somaTipo("disponivel");
  const totalAplicado = somaTipo("aplicado");
  const totalRestrito = somaTipo("restrito");
  return {
    linhas: l,
    totalDisponivel, totalAplicado, totalRestrito,
    totalGeral: totalDisponivel + totalAplicado + totalRestrito,
    reservaMinima,
    totalLivre: Math.max(0, totalDisponivel - reservaMinima),
  };
}

// ============================================================================
// FLUXO PROJETADO — 3 cenários sobre a MESMA RPC tesouraria_fluxo_projetado.
// OTIMISTA é a RPC pura (recebe/paga tudo em dia, zero ajuste). BASE e
// ESTRESSADO aplicam fatores de desvio REAIS, calculados do histórico da
// própria empresa (nunca um percentual inventado):
//   - fatorAtrasoAP: sobretaxa média (juros/multa) que a empresa JÁ pagou em
//     contas quitadas com atraso — mesmo cálculo de calcularForecastAp em
//     contasPagarHelpers.ts (reaproveitado, não reimplementado).
//   - fracaoAtrasoAR: fração do valor histórico de contas_receber que chegou
//     DEPOIS do vencimento — mesmo espírito, lado do recebimento (não existe
//     ainda em nenhum outro arquivo, por isso calculada aqui).
// BASE aplica metade do desvio observado (cenário médio entre o otimista e
// o estressado); ESTRESSADO aplica o desvio observado inteiro. Sem amostra
// suficiente (menos de 3 contas quitadas/recebidas com atraso), o fator fica
// 0 — sem dado real não penaliza, mesmo princípio do Score Axioma.
// ============================================================================

export const HORIZONTES_TESOURARIA = [7, 30, 60, 90] as const;
export type HorizonteTesouraria = (typeof HORIZONTES_TESOURARIA)[number];

const AMOSTRA_MINIMA_ATRASO_AR = 3;

type ContaRecebidaParaFator = { valor: number; data_vencimento: string | null; data_recebimento: string | null };

function calcularFracaoAtrasoRecebimento(contasRecebidas: ContaRecebidaParaFator[]): { fracao: number; amostra: number } {
  const validas = contasRecebidas.filter((c) => c.data_recebimento && c.data_vencimento && Number(c.valor) > 0);
  if (validas.length < AMOSTRA_MINIMA_ATRASO_AR) return { fracao: 0, amostra: 0 };
  const totalValor = validas.reduce((s, c) => s + Number(c.valor), 0);
  const valorAtrasado = validas.filter((c) => (c.data_recebimento as string) > (c.data_vencimento as string)).reduce((s, c) => s + Number(c.valor), 0);
  return { fracao: totalValor > 0 ? valorAtrasado / totalValor : 0, amostra: validas.length };
}

export type PontoFluxoProjetado = {
  horizonteDias: HorizonteTesouraria;
  saldoAtual: number;
  entradasPrevistas: { otimista: number; base: number; estressado: number };
  saidasPrevistas: { otimista: number; base: number; estressado: number };
  saldoProjetado: { otimista: number; base: number; estressado: number };
  abaixoDaReserva: { otimista: boolean; base: boolean; estressado: boolean };
};

export type FluxoProjetadoResultado = {
  pontos: PontoFluxoProjetado[];
  fatorAtrasoAP: number; // 0..1
  fracaoAtrasoAR: number; // 0..1
  amostraAtrasoAP: number;
  amostraAtrasoAR: number;
};

export async function obterFluxoProjetado(empresaId: string, reservaMinima: number): Promise<FluxoProjetadoResultado> {
  const [rpcResultados, { data: cpPagas }, { data: crRecebidas }] = await Promise.all([
    Promise.all(HORIZONTES_TESOURARIA.map((dias) => supabase.rpc("tesouraria_fluxo_projetado", { p_empresa_id: empresaId, p_dias: dias }))),
    supabase.from("contas_pagar").select("valor_total, valor_pago, data_pagamento, data_vencimento, taxa_multa_mensal").eq("empresa_id", empresaId).eq("status", "pago"),
    supabase.from("contas_receber").select("valor, data_vencimento, data_recebimento").eq("empresa_id", empresaId).eq("status", "recebido"),
  ]);

  rpcResultados.forEach((r, i) => {
    if (r.error) reportarFalhaEscrita("tesouraria_fluxo_projetado", `rpc select (${HORIZONTES_TESOURARIA[i]}d)`, r.error.message);
  });

  const { fator: fatorAtrasoAP, amostra: amostraAtrasoAP } = calcularFatorAtrasoHistorico((cpPagas as ContaPagaParaFatorAtraso[]) || []);
  const { fracao: fracaoAtrasoAR, amostra: amostraAtrasoAR } = calcularFracaoAtrasoRecebimento((crRecebidas as ContaRecebidaParaFator[]) || []);

  const pontos: PontoFluxoProjetado[] = HORIZONTES_TESOURARIA.map((horizonteDias, i) => {
    const linha = rpcResultados[i].data?.[0] as { saldo_atual: number; entradas_previstas: number; saidas_previstas: number } | undefined;
    const saldoAtual = Number(linha?.saldo_atual || 0);
    const entradasOtimista = Number(linha?.entradas_previstas || 0);
    const saidasOtimista = Number(linha?.saidas_previstas || 0);

    const entradas = {
      otimista: entradasOtimista,
      base: entradasOtimista * (1 - fracaoAtrasoAR / 2),
      estressado: entradasOtimista * (1 - fracaoAtrasoAR),
    };
    const saidas = {
      otimista: saidasOtimista,
      base: saidasOtimista * (1 + fatorAtrasoAP / 2),
      estressado: saidasOtimista * (1 + fatorAtrasoAP),
    };
    const saldoProjetado = {
      otimista: saldoAtual + entradas.otimista - saidas.otimista,
      base: saldoAtual + entradas.base - saidas.base,
      estressado: saldoAtual + entradas.estressado - saidas.estressado,
    };
    return {
      horizonteDias, saldoAtual, entradasPrevistas: entradas, saidasPrevistas: saidas, saldoProjetado,
      abaixoDaReserva: {
        otimista: saldoProjetado.otimista < reservaMinima,
        base: saldoProjetado.base < reservaMinima,
        estressado: saldoProjetado.estressado < reservaMinima,
      },
    };
  });

  return { pontos, fatorAtrasoAP, fracaoAtrasoAR, amostraAtrasoAP, amostraAtrasoAR };
}

// ============================================================================
// LIQUIDITY SCORE (0-1000, determinístico, sempre explicado). 3 componentes:
//   - cobertura: caixa disponível ÷ saídas dos próximos 30 dias, em MESES —
//     meta de 3 meses = 100 pts (padrão de reserva de caixa saudável).
//   - reserva: tem ou não a reserva mínima configurada em caixa disponível.
//   - folga: saldo projetado (cenário BASE, 90 dias) em relação à reserva —
//     dobrar a reserva = 100 pts, ficar abaixo dela = 0.
// ============================================================================

export type LiquidityScoreResultado = {
  total: number;
  nivel: "critico" | "atencao" | "bom" | "excelente";
  cor: "vermelho" | "amarelo" | "azul" | "verde";
  coberturaMeses: number;
  subscores: { cobertura: number; reserva: number; folga: number };
};

const MESES_COBERTURA_IDEAL = 3;

export function calcularLiquidityScore(p: {
  caixaDisponivel: number;
  saidasProximos30Dias: number;
  reservaMinima: number;
  saldoProjetadoBase90: number;
}): LiquidityScoreResultado {
  const coberturaMeses = p.saidasProximos30Dias > 0 ? p.caixaDisponivel / p.saidasProximos30Dias : (p.caixaDisponivel > 0 ? MESES_COBERTURA_IDEAL : 0);
  const scoreCobertura = Math.max(0, Math.min(100, (coberturaMeses / MESES_COBERTURA_IDEAL) * 100));

  const scoreReserva = p.reservaMinima <= 0 ? 100 : Math.max(0, Math.min(100, (p.caixaDisponivel / p.reservaMinima) * 100));

  let scoreFolga: number;
  if (p.reservaMinima <= 0) {
    scoreFolga = p.saldoProjetadoBase90 >= 0 ? 100 : 0;
  } else {
    const razao = (p.saldoProjetadoBase90 - p.reservaMinima) / p.reservaMinima; // 0 na reserva, 1 no dobro
    scoreFolga = Math.max(0, Math.min(100, razao * 100));
  }

  const total = Math.round((scoreCobertura * 0.45 + scoreReserva * 0.3 + scoreFolga * 0.25) * 10);
  const nivel: LiquidityScoreResultado["nivel"] = total < 400 ? "critico" : total < 650 ? "atencao" : total < 850 ? "bom" : "excelente";
  const cor: LiquidityScoreResultado["cor"] = total < 400 ? "vermelho" : total < 650 ? "amarelo" : total < 850 ? "azul" : "verde";

  return { total, nivel, cor, coberturaMeses, subscores: { cobertura: Math.round(scoreCobertura), reserva: Math.round(scoreReserva), folga: Math.round(scoreFolga) } };
}

export function explicarLiquidityScore(r: LiquidityScoreResultado, reservaMinima: number, lang: Idioma3): string {
  const meses = r.coberturaMeses.toFixed(1);
  if (lang === "en") {
    const cobertura = r.coberturaMeses >= MESES_COBERTURA_IDEAL ? `at or above the ${MESES_COBERTURA_IDEAL}-month target` : `below the ${MESES_COBERTURA_IDEAL}-month target`;
    return `${r.total} — your cash covers ${meses} months of upcoming bills; ${cobertura}.` + (reservaMinima > 0 ? (r.subscores.reserva >= 100 ? " Minimum reserve is fully covered." : " Minimum reserve is not fully covered.") : "");
  }
  if (lang === "es") {
    const cobertura = r.coberturaMeses >= MESES_COBERTURA_IDEAL ? `en o por encima de la meta de ${MESES_COBERTURA_IDEAL} meses` : `por debajo de la meta de ${MESES_COBERTURA_IDEAL} meses`;
    return `${r.total} — su caja cubre ${meses} meses de cuentas; ${cobertura}.` + (reservaMinima > 0 ? (r.subscores.reserva >= 100 ? " La reserva mínima está totalmente cubierta." : " La reserva mínima no está totalmente cubierta.") : "");
  }
  const cobertura = r.coberturaMeses >= MESES_COBERTURA_IDEAL ? `dentro (ou acima) do ideal de ${MESES_COBERTURA_IDEAL} meses` : `abaixo do ideal de ${MESES_COBERTURA_IDEAL} meses`;
  return `${r.total} — seu caixa cobre ${meses} meses de contas; ${cobertura}.` + (reservaMinima > 0 ? (r.subscores.reserva >= 100 ? " Reserva mínima coberta." : " Reserva mínima ainda não coberta.") : "");
}

// ============================================================================
// IDLE CASH DETECTOR — disponível − reserva mínima − saídas previstas 30d.
// Só sinaliza, nunca recomenda investir automaticamente.
// ============================================================================

export type IdleCashResultado = {
  valor: number; // sempre >= 0
  caixaDisponivel: number;
  reservaMinima: number;
  saidasProximos30Dias: number;
};

export function calcularIdleCash(caixaDisponivel: number, reservaMinima: number, saidasProximos30Dias: number): IdleCashResultado {
  const valor = Math.max(0, caixaDisponivel - reservaMinima - saidasProximos30Dias);
  return { valor, caixaDisponivel, reservaMinima, saidasProximos30Dias };
}

// ============================================================================
// TREASURY RADAR — calcula riscos a partir de dado já carregado pela tela
// (posição + fluxo + dívidas) e grava em tesouraria_alerta. Dedup: não grava
// um novo alerta do mesmo tipo se já existe um ATIVO (resolvido_em NULL) —
// evita empilhar alerta repetido a cada abertura da tela.
// ============================================================================

export type TipoAlertaTesouraria = "ruptura_caixa" | "concentracao_banco" | "concentracao_cliente" | "divida_alta" | "caixa_ocioso";
export type SeveridadeAlerta = "normal" | "atencao" | "risco" | "critico";

export type AlertaCandidato = {
  tipo: TipoAlertaTesouraria;
  severidade: SeveridadeAlerta;
  dado_origem: Record<string, number | string | boolean | null>;
};

const CONCENTRACAO_MAXIMA_PADRAO = 70; // % — usado só se a empresa não tiver política própria configurada

export async function gerarAlertasCandidatos(empresaId: string, p: {
  posicao: PosicaoCaixa;
  fluxo: FluxoProjetadoResultado;
  dividaPendente: number;
}): Promise<AlertaCandidato[]> {
  const candidatos: AlertaCandidato[] = [];

  // Ruptura de caixa — pega a PRIMEIRA quebra (cenário BASE) na ordem dos
  // horizontes; severidade escala com a proximidade.
  const rupturaBase = p.fluxo.pontos.find((pt) => pt.abaixoDaReserva.base);
  if (rupturaBase) {
    candidatos.push({
      tipo: "ruptura_caixa",
      severidade: rupturaBase.horizonteDias <= 7 ? "critico" : rupturaBase.horizonteDias <= 30 ? "risco" : "atencao",
      dado_origem: { horizonteDias: rupturaBase.horizonteDias, saldoProjetadoBase: rupturaBase.saldoProjetado.base, reservaMinima: p.posicao.reservaMinima },
    });
  }

  // Caixa ocioso.
  const fluxo30 = p.fluxo.pontos.find((pt) => pt.horizonteDias === 30);
  const idle = calcularIdleCash(p.posicao.totalDisponivel, p.posicao.reservaMinima, Number(fluxo30?.saidasPrevistas.base || 0));
  if (idle.valor > 0) {
    candidatos.push({ tipo: "caixa_ocioso", severidade: "atencao", dado_origem: { valorOcioso: idle.valor, caixaDisponivel: idle.caixaDisponivel, reservaMinima: idle.reservaMinima, saidas30Dias: idle.saidasProximos30Dias } });
  }

  // Concentração bancária — maior banco vs total disponível+aplicado.
  const limiteConcentracao = await obterLimiteConcentracao(empresaId);
  const totalContas = p.posicao.totalDisponivel + p.posicao.totalAplicado;
  if (totalContas > 0) {
    const porBanco = new Map<string, number>();
    p.posicao.linhas.filter((l) => l.tipo_liquidez !== "restrito").forEach((l) => {
      const chave = l.banco_nome || l.conta_nome;
      porBanco.set(chave, (porBanco.get(chave) || 0) + l.saldo);
    });
    const maiorBanco = [...porBanco.entries()].sort((a, b) => b[1] - a[1])[0];
    if (maiorBanco) {
      const pct = (maiorBanco[1] / totalContas) * 100;
      if (pct > limiteConcentracao) {
        candidatos.push({
          tipo: "concentracao_banco",
          severidade: pct > 90 ? "critico" : pct > 80 ? "risco" : "atencao",
          dado_origem: { banco: maiorBanco[0], percentual: Math.round(pct * 10) / 10, limite: limiteConcentracao },
        });
      }
    }
  }

  // Concentração de cliente — maior cliente vs total de contas_receber em aberto.
  const { data: crAbertas } = await supabase.from("contas_receber").select("cliente_id, valor, valor_recebido").eq("empresa_id", empresaId).neq("status", "recebido");
  const abertas = (crAbertas as { cliente_id: string | null; valor: number; valor_recebido: number | null }[]) || [];
  const totalAberto = abertas.reduce((s, c) => s + Math.max(0, Number(c.valor) - Number(c.valor_recebido || 0)), 0);
  if (totalAberto > 0) {
    const porCliente = new Map<string, number>();
    abertas.filter((c) => c.cliente_id).forEach((c) => {
      const saldo = Math.max(0, Number(c.valor) - Number(c.valor_recebido || 0));
      porCliente.set(c.cliente_id as string, (porCliente.get(c.cliente_id as string) || 0) + saldo);
    });
    const maiorCliente = [...porCliente.entries()].sort((a, b) => b[1] - a[1])[0];
    if (maiorCliente) {
      const pct = (maiorCliente[1] / totalAberto) * 100;
      if (pct > limiteConcentracao) {
        candidatos.push({
          tipo: "concentracao_cliente",
          severidade: pct > 90 ? "critico" : pct > 80 ? "risco" : "atencao",
          dado_origem: { clienteId: maiorCliente[0], percentual: Math.round(pct * 10) / 10, limite: limiteConcentracao },
        });
      }
    }
  }

  // Dívida alta — pendente de `dividas` comparada ao caixa da tesouraria.
  if (p.dividaPendente > 0 && totalContas > 0) {
    const razao = p.dividaPendente / totalContas;
    if (razao > 1) {
      candidatos.push({
        tipo: "divida_alta",
        severidade: razao > 2 ? "critico" : "risco",
        dado_origem: { dividaPendente: p.dividaPendente, caixaTotal: totalContas, razao: Math.round(razao * 100) / 100 },
      });
    }
  }

  return candidatos;
}

async function obterLimiteConcentracao(empresaId: string): Promise<number> {
  const { data } = await supabase.from("tesouraria_politica").select("valor").eq("empresa_id", empresaId).eq("tipo", "concentracao_maxima").eq("ativo", true).maybeSingle();
  const v = data ? Number((data as { valor: number }).valor) : null;
  return v && v > 0 ? v : CONCENTRACAO_MAXIMA_PADRAO;
}

export type AlertaTesouraria = {
  id: string;
  tipo: TipoAlertaTesouraria;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string | null;
  dado_origem: Record<string, unknown> | null;
  criado_em: string;
  resolvido_em: string | null;
};

export async function listarAlertasAtivos(empresaId: string): Promise<AlertaTesouraria[]> {
  const { data } = await supabase.from("tesouraria_alerta").select("id, tipo, severidade, titulo, descricao, dado_origem, criado_em, resolvido_em")
    .eq("empresa_id", empresaId).is("resolvido_em", null).order("criado_em", { ascending: false });
  return (data as AlertaTesouraria[]) || [];
}

const TITULO_ALERTA_PT: Record<TipoAlertaTesouraria, string> = {
  ruptura_caixa: "Risco de ruptura de caixa",
  concentracao_banco: "Concentração bancária alta",
  concentracao_cliente: "Concentração de cliente alta",
  divida_alta: "Dívida alta frente ao caixa",
  caixa_ocioso: "Caixa potencialmente ocioso",
};

// Grava só os tipos ainda sem alerta ativo (dedup) — titulo fica em PT como
// registro de auditoria (rastreável no banco); a tela SEMPRE renderiza o
// texto localizado a partir de tipo+dado_origem via descreverAlerta(),
// nunca lê titulo/descricao pra exibir (evita travar o alerta num idioma só).
export async function gravarNovosAlertas(empresaId: string, candidatos: AlertaCandidato[]): Promise<void> {
  if (candidatos.length === 0) return;
  const ativos = await listarAlertasAtivos(empresaId);
  const tiposAtivos = new Set(ativos.map((a) => a.tipo));
  const novos = candidatos.filter((c) => !tiposAtivos.has(c.tipo));
  if (novos.length === 0) return;

  const linhas = novos.map((c) => ({
    empresa_id: empresaId, tipo: c.tipo, severidade: c.severidade,
    titulo: TITULO_ALERTA_PT[c.tipo], descricao: null, dado_origem: c.dado_origem,
  }));
  const { error } = await supabase.from("tesouraria_alerta").insert(linhas);
  if (error) reportarFalhaEscrita("tesouraria_alerta", "insert", error.message);
}

// Texto 100% localizado pra exibição — reconstrói a frase a partir de
// tipo+dado_origem (nunca do titulo/descricao gravados, que ficam só em PT).
export function descreverAlerta(a: Pick<AlertaTesouraria, "tipo" | "dado_origem">, lang: Idioma3): string {
  const d = (a.dado_origem || {}) as Record<string, number | string>;
  const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  switch (a.tipo) {
    case "ruptura_caixa":
      if (lang === "en") return `Projected balance goes below the minimum reserve within ${d.horizonteDias} days (projected: ${brl(Number(d.saldoProjetadoBase))}, reserve: ${brl(Number(d.reservaMinima))}).`;
      if (lang === "es") return `El saldo proyectado queda por debajo de la reserva mínima en ${d.horizonteDias} días (proyectado: ${brl(Number(d.saldoProjetadoBase))}, reserva: ${brl(Number(d.reservaMinima))}).`;
      return `Saldo projetado fica abaixo da reserva mínima em ${d.horizonteDias} dias (projetado: ${brl(Number(d.saldoProjetadoBase))}, reserva: ${brl(Number(d.reservaMinima))}).`;
    case "caixa_ocioso":
      if (lang === "en") return `${brl(Number(d.valorOcioso))} potentially idle — available (${brl(Number(d.caixaDisponivel))}) minus reserve (${brl(Number(d.reservaMinima))}) minus next-30-day payments (${brl(Number(d.saidas30Dias))}).`;
      if (lang === "es") return `${brl(Number(d.valorOcioso))} potencialmente ocioso — disponible (${brl(Number(d.caixaDisponivel))}) menos reserva (${brl(Number(d.reservaMinima))}) menos pagos de 30 días (${brl(Number(d.saidas30Dias))}).`;
      return `${brl(Number(d.valorOcioso))} potencialmente ocioso — disponível (${brl(Number(d.caixaDisponivel))}) menos reserva (${brl(Number(d.reservaMinima))}) menos saídas dos próximos 30 dias (${brl(Number(d.saidas30Dias))}).`;
    case "concentracao_banco":
      if (lang === "en") return `${d.banco} holds ${d.percentual}% of total cash (limit: ${d.limite}%).`;
      if (lang === "es") return `${d.banco} concentra ${d.percentual}% del caja total (límite: ${d.limite}%).`;
      return `${d.banco} concentra ${d.percentual}% do caixa total (limite: ${d.limite}%).`;
    case "concentracao_cliente":
      if (lang === "en") return `One client accounts for ${d.percentual}% of open receivables (limit: ${d.limite}%).`;
      if (lang === "es") return `Un cliente concentra ${d.percentual}% de las cuentas por cobrar abiertas (límite: ${d.limite}%).`;
      return `Um cliente concentra ${d.percentual}% das contas a receber em aberto (limite: ${d.limite}%).`;
    case "divida_alta":
      if (lang === "en") return `Outstanding debt (${brl(Number(d.dividaPendente))}) is ${d.razao}x the treasury cash (${brl(Number(d.caixaTotal))}).`;
      if (lang === "es") return `La deuda pendiente (${brl(Number(d.dividaPendente))}) es ${d.razao}x el caja de tesorería (${brl(Number(d.caixaTotal))}).`;
      return `Dívida pendente (${brl(Number(d.dividaPendente))}) é ${d.razao}x o caixa de tesouraria (${brl(Number(d.caixaTotal))}).`;
  }
}

export function tituloAlertaLocalizado(tipo: TipoAlertaTesouraria, lang: Idioma3): string {
  const label: Record<Idioma3, Record<TipoAlertaTesouraria, string>> = {
    pt: TITULO_ALERTA_PT,
    en: {
      ruptura_caixa: "Cash rupture risk", concentracao_banco: "High bank concentration",
      concentracao_cliente: "High client concentration", divida_alta: "Debt high vs. cash", caixa_ocioso: "Potentially idle cash",
    },
    es: {
      ruptura_caixa: "Riesgo de ruptura de caja", concentracao_banco: "Concentración bancaria alta",
      concentracao_cliente: "Concentración de cliente alta", divida_alta: "Deuda alta frente al caja", caixa_ocioso: "Caja potencialmente ociosa",
    },
  };
  return label[lang][tipo];
}

export async function resolverAlerta(id: string, empresaId: string): Promise<{ ok: boolean; erro?: string }> {
  const { data, error } = await supabase.from("tesouraria_alerta").update({ resolvido_em: new Date().toISOString() }).eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_alerta", "update (resolvido_em)", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

// ============================================================================
// DÍVIDA PENDENTE — leitura simples de `dividas` (mesma tabela real usada
// por Endividamento/DRE/Fluxo de Caixa; "endividamento" é órfã, não usada).
// ============================================================================

export async function obterDividaPendente(empresaId: string): Promise<number> {
  const { data } = await supabase.from("dividas").select("valor_total, valor_pago").eq("empresa_id", empresaId);
  return ((data as { valor_total: number; valor_pago: number }[]) || []).reduce((s, d) => s + Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0)), 0);
}

// ============================================================================
// STRESS SIMULATOR (Rodada 3) — recálculo determinístico sobre o Fluxo
// Projetado (obterFluxoProjetado) já carregado: aplica a variação sobre o
// cenário BASE real (que já embute o desvio histórico da própria empresa),
// nunca inventa um número novo. Função pura/síncrona — recalcula a cada
// mudança de slider, sem round-trip ao banco. Reaproveitada também pelo
// Digital Twin ("aplicar 1 mudança grande" é o mesmo motor).
//   - receitaPct / despesasPct: multiplicador sobre entradas/saídas BASE.
//   - atrasoDiasRecebimento: fração de entradas empurrada pra fora da janela
//     do horizonte — min(1, atrasoDias / horizonteDias); o mesmo atraso pesa
//     mais em horizontes curtos (efeito real de fluxo de caixa).
//   - novaDividaValor: entra no caixa no dia 0 (empréstimo tomado agora).
//   - novaDividaParcelaMensal / novaContratacaoCustoMensal: saída recorrente,
//     escalada por horizonteDias/30 (meses cobertos pela janela).
//   - investimentoInicial: sai do caixa no dia 0 (capex — ex.: nova filial).
// ============================================================================

export type StressVariaveis = {
  receitaPct: number;
  atrasoDiasRecebimento: number;
  despesasPct: number;
  novaDividaValor: number;
  novaDividaParcelaMensal: number;
  novaContratacaoCustoMensal: number;
  investimentoInicial: number;
};

export const STRESS_VARIAVEIS_NEUTRAS: StressVariaveis = {
  receitaPct: 0, atrasoDiasRecebimento: 0, despesasPct: 0,
  novaDividaValor: 0, novaDividaParcelaMensal: 0, novaContratacaoCustoMensal: 0, investimentoInicial: 0,
};

export type PontoSimulado = {
  horizonteDias: HorizonteTesouraria;
  saldoProjetadoBase: number;
  saldoProjetadoSimulado: number;
  delta: number;
  abaixoDaReserva: boolean;
};

export type SimulacaoEstresseResultado = {
  pontos: PontoSimulado[];
  caixaDisponivelSimulado: number;
  liquidityScoreSimulado: LiquidityScoreResultado;
  rupturaHorizonte: HorizonteTesouraria | null;
};

export function calcularSimulacaoEstresse(
  fluxo: FluxoProjetadoResultado,
  posicao: PosicaoCaixa,
  reservaMinima: number,
  v: StressVariaveis
): SimulacaoEstresseResultado {
  const injecaoCaixa = (v.novaDividaValor || 0) - (v.investimentoInicial || 0);
  const saidasExtrasMensais = (v.novaDividaParcelaMensal || 0) + (v.novaContratacaoCustoMensal || 0);

  const pontos: PontoSimulado[] = fluxo.pontos.map((p) => {
    const saldoAtualSimulado = p.saldoAtual + injecaoCaixa;
    const fracaoAtraso = p.horizonteDias > 0 ? Math.min(1, Math.max(0, v.atrasoDiasRecebimento || 0) / p.horizonteDias) : 0;
    const entradasSimuladas = p.entradasPrevistas.base * (1 + (v.receitaPct || 0) / 100) * (1 - fracaoAtraso);
    const meses = p.horizonteDias / 30;
    const saidasSimuladas = p.saidasPrevistas.base * (1 + (v.despesasPct || 0) / 100) + saidasExtrasMensais * meses;
    const saldoProjetadoSimulado = saldoAtualSimulado + entradasSimuladas - saidasSimuladas;
    return {
      horizonteDias: p.horizonteDias,
      saldoProjetadoBase: p.saldoProjetado.base,
      saldoProjetadoSimulado,
      delta: saldoProjetadoSimulado - p.saldoProjetado.base,
      abaixoDaReserva: saldoProjetadoSimulado < reservaMinima,
    };
  });

  const caixaDisponivelSimulado = Math.max(0, posicao.totalDisponivel + injecaoCaixa);
  const ponto30Base = fluxo.pontos.find((p) => p.horizonteDias === 30);
  const ponto90Simulado = pontos.find((p) => p.horizonteDias === 90);
  const saidas30Simuladas = ponto30Base
    ? ponto30Base.saidasPrevistas.base * (1 + (v.despesasPct || 0) / 100) + saidasExtrasMensais
    : 0;

  const liquidityScoreSimulado = calcularLiquidityScore({
    caixaDisponivel: caixaDisponivelSimulado,
    saidasProximos30Dias: saidas30Simuladas,
    reservaMinima,
    saldoProjetadoBase90: ponto90Simulado?.saldoProjetadoSimulado ?? 0,
  });

  const rupturaHorizonte = pontos.find((p) => p.abaixoDaReserva)?.horizonteDias ?? null;

  return { pontos, caixaDisponivelSimulado, liquidityScoreSimulado, rupturaHorizonte };
}

// ============================================================================
// CENÁRIOS SALVOS (tesouraria_cenario) — o dono grava as variáveis do
// simulador pra reabrir depois. Tabela e RLS FOR ALL já existem da Rodada 1
// (ver CFO-TESOURARIA-RODADA1-SQL.txt, Parte 4) — nenhuma coluna nova aqui.
// ============================================================================

export type CenarioTesouraria = {
  id: string;
  nome: string;
  tipo: "base" | "otimista" | "estressado" | "custom";
  variaveis: StressVariaveis;
  criado_em: string;
};

export async function listarCenarios(empresaId: string): Promise<CenarioTesouraria[]> {
  const { data } = await supabase.from("tesouraria_cenario")
    .select("id, nome, tipo, variaveis, criado_em").eq("empresa_id", empresaId).order("criado_em", { ascending: false });
  return (data as CenarioTesouraria[]) || [];
}

export async function salvarCenario(empresaId: string, nome: string, variaveis: StressVariaveis): Promise<{ ok: boolean; erro?: string }> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("tesouraria_cenario")
    .insert({ empresa_id: empresaId, nome, tipo: "custom", variaveis, criado_por: authData?.user?.id || null })
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_cenario", "insert", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

export async function atualizarCenario(id: string, empresaId: string, nome: string, variaveis: StressVariaveis): Promise<{ ok: boolean; erro?: string }> {
  const { data, error } = await supabase.from("tesouraria_cenario")
    .update({ nome, variaveis }).eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_cenario", "update", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

export async function excluirCenario(id: string, empresaId: string): Promise<{ ok: boolean; erro?: string }> {
  const { data, error } = await supabase.from("tesouraria_cenario").delete().eq("id", id).eq("empresa_id", empresaId).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("tesouraria_cenario", "delete", motivo);
    return { ok: false, erro: motivo };
  }
  return { ok: true };
}

// ============================================================================
// CAPITAL DE GIRO (Digital Twin) — AR em aberto + valor de estoque
// (reaproveita carregarKpisEstoque de estoqueHelpers.ts, não recalcula) − AP
// em aberto. Mesmo espírito da consulta de concentração de cliente já usada
// no Treasury Radar (gerarAlertasCandidatos), lado do capital de giro.
// ============================================================================

export type CapitalDeGiro = {
  contasAReceberAberto: number;
  valorEstoque: number;
  contasAPagarAberto: number;
  capitalDeGiro: number;
};

export async function obterCapitalDeGiro(empresaId: string): Promise<CapitalDeGiro> {
  const [{ data: crAbertas }, { data: cpAbertas }, kpisEstoque] = await Promise.all([
    supabase.from("contas_receber").select("valor, valor_recebido").eq("empresa_id", empresaId).neq("status", "recebido"),
    supabase.from("contas_pagar").select("valor_total, valor_pago").eq("empresa_id", empresaId).neq("status", "pago"),
    carregarKpisEstoque(empresaId),
  ]);
  const contasAReceberAberto = ((crAbertas as { valor: number; valor_recebido: number | null }[]) || [])
    .reduce((s, c) => s + Math.max(0, Number(c.valor) - Number(c.valor_recebido || 0)), 0);
  const contasAPagarAberto = ((cpAbertas as { valor_total: number; valor_pago: number | null }[]) || [])
    .reduce((s, c) => s + Math.max(0, Number(c.valor_total) - Number(c.valor_pago || 0)), 0);
  const valorEstoque = Number(kpisEstoque.valor_total_estoque || 0);
  return { contasAReceberAberto, valorEstoque, contasAPagarAberto, capitalDeGiro: contasAReceberAberto + valorEstoque - contasAPagarAberto };
}

// ============================================================================
// ZIA COPILOT DE TESOURARIA (Rodada 3) — V1 por regra, mesmo molde de
// responderPerguntaApPorRegra (contasPagarHelpers.ts): função pura sobre dado
// já carregado pela tela do Command Center — zero fetch, zero motor novo.
// Ponto único de geração de texto, pronto pra virar IA real (troca só o
// corpo por /api/ia-chat, mesmo padrão do chat de AP) sem mexer na tela.
// Pergunta fora do roteiro: admite honestamente que não sabe, nunca inventa.
// ============================================================================

export type ContextoZiaTesouraria = {
  lang: Idioma3;
  posicao: PosicaoCaixa | null;
  fluxo: FluxoProjetadoResultado | null;
  score: LiquidityScoreResultado | null;
  idle: IdleCashResultado | null;
  alertas: AlertaTesouraria[];
  reservaMinima: number;
};

const TOPICOS_ZIA_PT = "como está seu caixa, se tem dinheiro ocioso, qual seu maior risco, se seu caixa aguenta 30 dias, e se você pode contratar alguém";
const TOPICOS_ZIA_EN = "how your cash looks, whether you have idle cash, your biggest risk, whether your cash can handle 30 days, and whether you can afford a new hire";
const TOPICOS_ZIA_ES = "cómo está su caja, si tiene dinero ocioso, cuál es su mayor riesgo, si su caja aguanta 30 días, y si puede contratar a alguien";

export function responderZiaTesourariaPorRegra(pergunta: string, ctx: ContextoZiaTesouraria): string {
  const lang = ctx.lang;
  const L = (pt: string, en: string, es: string) => (lang === "en" ? en : lang === "es" ? es : pt);
  const brl = (n: number) => `R$ ${Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const q = normalizarTexto(pergunta);
  const semDado = () => L("Ainda não tenho esse dado calculado — abra a tela de Tesouraria primeiro.", "I don't have that data calculated yet — open the Treasury screen first.", "Todavía no tengo ese dato calculado — abra la pantalla de Tesorería primero.");

  // 1) Como está meu caixa
  if (q.includes("caixa") && (q.includes("como esta") || q.includes("situacao") || q.includes("status"))) {
    if (!ctx.posicao || !ctx.score) return semDado();
    return L(`Seu caixa total é ${brl(ctx.posicao.totalGeral)}, sendo ${brl(ctx.posicao.totalDisponivel)} disponível. Liquidity Score: ${ctx.score.total} (${ctx.score.nivel}).`,
      `Your total cash is ${brl(ctx.posicao.totalGeral)}, with ${brl(ctx.posicao.totalDisponivel)} available. Liquidity Score: ${ctx.score.total} (${ctx.score.nivel}).`,
      `Su caja total es ${brl(ctx.posicao.totalGeral)}, con ${brl(ctx.posicao.totalDisponivel)} disponible. Liquidity Score: ${ctx.score.total} (${ctx.score.nivel}).`);
  }

  // 2) Dinheiro ocioso
  if (q.includes("ocios") || q.includes("idle")) {
    if (!ctx.idle) return semDado();
    if (ctx.idle.valor <= 0) return L("Não — todo o caixa disponível já está comprometido com a reserva mínima e as saídas dos próximos 30 dias.", "No — all available cash is already committed to the minimum reserve and the next 30 days of payments.", "No — toda la caja disponible ya está comprometida con la reserva mínima y los pagos de los próximos 30 días.");
    return L(`Sim — ${brl(ctx.idle.valor)} potencialmente ocioso (disponível menos reserva mínima menos saídas dos próximos 30 dias).`,
      `Yes — ${brl(ctx.idle.valor)} potentially idle (available minus minimum reserve minus the next 30 days of payments).`,
      `Sí — ${brl(ctx.idle.valor)} potencialmente ocioso (disponible menos reserva mínima menos pagos de los próximos 30 días).`);
  }

  // 3) Maior risco
  if (q.includes("risco") || q.includes("risk")) {
    if (ctx.alertas.length === 0) return L("Nenhum risco detectado no momento.", "No risk detected right now.", "Ningún riesgo detectado por ahora.");
    const ordem: Record<string, number> = { critico: 4, risco: 3, atencao: 2, normal: 1 };
    const top = [...ctx.alertas].sort((a, b) => (ordem[b.severidade] || 0) - (ordem[a.severidade] || 0))[0];
    return `${tituloAlertaLocalizado(top.tipo, lang)}: ${descreverAlerta(top, lang)}`;
  }

  // 4) Caixa aguenta 30 dias
  if ((q.includes("aguenta") || q.includes("aguent") || q.includes("handle")) && q.includes("30")) {
    if (!ctx.fluxo) return semDado();
    const p30 = ctx.fluxo.pontos.find((p) => p.horizonteDias === 30);
    if (!p30) return semDado();
    if (!p30.abaixoDaReserva.base) return L("Sim — o saldo projetado em 30 dias fica acima da reserva mínima, no cenário base.", "Yes — the projected 30-day balance stays above the minimum reserve, in the base scenario.", "Sí — el saldo proyectado a 30 días queda por encima de la reserva mínima, en el escenario base.");
    return L(`Atenção: no cenário base, o saldo projetado em 30 dias (${brl(p30.saldoProjetado.base)}) fica abaixo da reserva mínima (${brl(ctx.reservaMinima)}).`,
      `Careful: in the base scenario, the projected 30-day balance (${brl(p30.saldoProjetado.base)}) falls below the minimum reserve (${brl(ctx.reservaMinima)}).`,
      `Atención: en el escenario base, el saldo proyectado a 30 días (${brl(p30.saldoProjetado.base)}) queda por debajo de la reserva mínima (${brl(ctx.reservaMinima)}).`);
  }

  // 5) Posso contratar alguém
  if (q.includes("contrat") || q.includes("hire")) {
    if (!ctx.idle || !ctx.score) return semDado();
    if (ctx.idle.valor > 0 && ctx.score.nivel !== "critico") {
      return L(`Com cautela — você tem ${brl(ctx.idle.valor)} de caixa ocioso e Liquidity Score ${ctx.score.total} (${ctx.score.nivel}). Use o Simulador de Estresse pra testar o custo mensal exato antes de decidir.`,
        `With caution — you have ${brl(ctx.idle.valor)} of idle cash and a Liquidity Score of ${ctx.score.total} (${ctx.score.nivel}). Use the Stress Simulator to test the exact monthly cost before deciding.`,
        `Con cautela — tiene ${brl(ctx.idle.valor)} de caja ociosa y Liquidity Score ${ctx.score.total} (${ctx.score.nivel}). Use el Simulador de Estrés para probar el costo mensual exacto antes de decidir.`);
    }
    return L(`Não é o melhor momento — Liquidity Score ${ctx.score.total} (${ctx.score.nivel}) e sem caixa ocioso confirmado. Teste o cenário no Simulador de Estresse antes de decidir.`,
      `Not the best time — Liquidity Score ${ctx.score.total} (${ctx.score.nivel}) with no confirmed idle cash. Test the scenario in the Stress Simulator before deciding.`,
      `No es el mejor momento — Liquidity Score ${ctx.score.total} (${ctx.score.nivel}) y sin caja ociosa confirmada. Pruebe el escenario en el Simulador de Estrés antes de decidir.`);
  }

  return L(`Ainda não sei responder isso — essa é a V1 por regra, a inteligência completa chega depois. Posso ajudar com: ${TOPICOS_ZIA_PT}.`,
    `I can't answer that yet — this is the rule-based V1, full intelligence comes later. I can help with: ${TOPICOS_ZIA_EN}.`,
    `Todavía no sé responder eso — esta es la V1 por regla, la inteligencia completa llega después. Puedo ayudar con: ${TOPICOS_ZIA_ES}.`);
}
