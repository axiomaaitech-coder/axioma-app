// 🦅 AXIOMA — Treasury Intelligence, Rodada 2: engines determinísticos do
// Command Center (/tesouraria). Lê a fundação da Rodada 1 (tabelas
// tesouraria_* + RPCs tesouraria_posicao/tesouraria_fluxo_projetado, já
// aplicadas no banco) — nenhuma escrita nova de schema aqui. Determinístico
// 100%: nada de IA nesta rodada (ZIA é Rodada 3).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { calcularFatorAtrasoHistorico, type ContaPagaParaFatorAtraso } from "./contasPagarHelpers";

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

// Grava só os tipos ainda sem alerta ativo (dedup) — titulo/descricao ficam
// em PT como registro de auditoria; a tela SEMPRE renderiza o texto
// localizado a partir de tipo+dado_origem via descreverAlerta(), nunca lê
// titulo/descricao pra exibir (evita travar o alerta num idioma só).
export async function gravarNovosAlertas(empresaId: string, candidatos: AlertaCandidato[], tituloPt: Record<TipoAlertaTesouraria, string>): Promise<void> {
  if (candidatos.length === 0) return;
  const ativos = await listarAlertasAtivos(empresaId);
  const tiposAtivos = new Set(ativos.map((a) => a.tipo));
  const novos = candidatos.filter((c) => !tiposAtivos.has(c.tipo));
  if (novos.length === 0) return;

  const linhas = novos.map((c) => ({
    empresa_id: empresaId, tipo: c.tipo, severidade: c.severidade,
    titulo: tituloPt[c.tipo], descricao: null, dado_origem: c.dado_origem,
  }));
  const { error } = await supabase.from("tesouraria_alerta").insert(linhas);
  if (error) reportarFalhaEscrita("tesouraria_alerta", "insert", error.message);
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
