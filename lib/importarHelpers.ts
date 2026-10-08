// 🦅 AXIOMA AI.TECH - Helpers de Importação
// Versão profissional: builders específicos por tabela, sem retry, sem omissão silenciosa.
// Cada destino tem um builder que monta o payload EXATO pra aquela tabela.

import CryptoJS from "crypto-js";
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import type { DestinoTabela, LinhaImportada, ResultadoParse } from "./importarParsers";
import { criarContaPagar, editarContaPagar, darBaixaContaPagar, type ContaPagar } from "./contasPagarHelpers";
import { criarContaReceber, editarContaReceber, registrarRecebimento, type ContaParaReceber } from "./recebimentoHelpers";
import { hojeISO } from "./datas";
import { avaliarDuplicidade, acharObrigacaoParaPagamento, type EstadoMatch, type Idioma, type Lancamento } from "./motorDuplicidade";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear update/delete e devolver 0 linhas SEM error do Postgres —
// .select("id") é o que permite enxergar essa falha silenciosa.
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

// ============================================================================
// BUILDERS DE PAYLOAD POR DESTINO
// Cada função sabe EXATAMENTE quais colunas existem na tabela alvo e
// monta o payload correto. Sem chute, sem retry, sem perda de dado.
// ============================================================================

type Builder = (
  linha: LinhaImportada,
  userId: string,
  empresaId: string | null
) => { payload: Record<string, any> } | { erro: string };

function validarObrigatorios(linha: LinhaImportada): string | null {
  if (!linha.data) return "Data ausente";
  if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
    return "Valor ausente ou inválido";
  return null;
}

const BUILDERS: Record<DestinoTabela, Builder> = {
  // -------------------------------------------------------------------------
  // FLUXO DE CAIXA
  // Schema real: data*, valor*, descricao*, tipo* (NOT NULL), categoria,
  //              forma_pagamento, documento, status, user_id, empresa_id
  // -------------------------------------------------------------------------
  fluxo_caixa: (linha, userId, empresaId) => {
    const erro = validarObrigatorios(linha);
    if (erro) return { erro };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        data: linha.data,
        data_hora: linha.dataHora || null,
        valor: linha.valor,
        descricao: linha.descricao || "Lançamento importado",
        tipo: linha.tipo === "saida" ? "saida" : "entrada",
        categoria: linha.categoria || null,
        documento: linha.documento || null,
        status: "confirmado",
      },
    };
  },

  // -------------------------------------------------------------------------
  // RECEITAS
  // Schema real: data*, valor*, descricao*, categoria, status, user_id,
  //              forma_recebimento, documento, empresa_id
  // -------------------------------------------------------------------------
  receitas: (linha, userId, empresaId) => {
    const erro = validarObrigatorios(linha);
    if (erro) return { erro };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        data: linha.data,
        data_hora: linha.dataHora || null,
        valor: linha.valor,
        descricao: linha.descricao || "Receita importada",
        categoria: linha.categoria || null,
        status: "recebido",
        documento: linha.documento || null,
      },
    };
  },

  // -------------------------------------------------------------------------
  // CUSTOS VARIÁVEIS
  // Schema real: data*, valor*, descricao*, categoria, user_id, empresa_id,
  //              forma_pagamento, documento
  // -------------------------------------------------------------------------
  custos_variaveis: (linha, userId, empresaId) => {
    const erro = validarObrigatorios(linha);
    if (erro) return { erro };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        data: linha.data,
        data_hora: linha.dataHora || null,
        valor: linha.valor,
        descricao: linha.descricao || "Custo importado",
        categoria: linha.categoria || null,
        documento: linha.documento || null,
      },
    };
  },

  // -------------------------------------------------------------------------
  // CUSTOS FIXOS (cadastro de recorrentes — não é lançamento)
  // Schema real: descricao*, valor_mensal*, dia_vencimento (int 1-31),
  //              categoria, user_id, empresa_id
  // -------------------------------------------------------------------------
  custos_fixos: (linha, userId, empresaId) => {
    if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
      return { erro: "Valor ausente - necessario para custo fixo" };
    const dia = linha.data ? new Date(linha.data + "T00:00:00").getDate() : 1;
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Custo fixo importado",
        valor_mensal: linha.valor,
        dia_vencimento: Math.max(1, Math.min(31, dia)),
        categoria: linha.categoria || null,
      },
    };
  },

  // -------------------------------------------------------------------------
  // CONTAS A PAGAR
  // Schema real: descricao*, valor_total*, valor_pago* (default 0),
  //              data_vencimento, data_emissao, data_pagamento, status,
  //              numero_nota, categoria, forma_pagamento, parcelas,
  //              fornecedor_id, user_id, empresa_id, observacoes
  // -------------------------------------------------------------------------
  contas_pagar: (linha, userId, empresaId) => {
    if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
      return { erro: "Valor ausente" };
    // NF-e traz o vencimento real (duplicata) e o que já foi quitado na emissão —
    // antes o vencimento era sempre a data de emissão e a conta nascia em aberto.
    const pago = Math.min(Math.max(linha.valorPago ?? 0, 0), linha.valor);
    const status = pago >= linha.valor - 0.005 ? "pago" : pago > 0 ? "parcial" : "pendente";
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Conta a pagar importada",
        valor_total: linha.valor,
        valor_pago: pago,
        data_emissao: linha.data || null,
        data_vencimento: linha.vencimento || linha.data || null,
        data_pagamento: status === "pago" ? linha.data || null : null,
        data_hora: linha.dataHora || null,
        status,
        categoria: linha.categoria || null,
        numero_nota: linha.documento || null,
        chave_acesso: linha.chaveAcesso || null,
        forma_pagamento: linha.forma || null,
        fornecedor_id: linha.fornecedorId || null,
      },
    };
  },

  // -------------------------------------------------------------------------
  // CONTAS A RECEBER
  // Schema real: descricao*, valor*, data_vencimento* (NOT NULL),
  //              data_emissao, data_recebimento, status, cliente_id,
  //              valor_recebido, forma_recebimento, numero_documento,
  //              categoria, parcelas, taxa_juros, taxa_multa, user_id,
  //              empresa_id, observacoes
  // -------------------------------------------------------------------------
  contas_receber: (linha, userId, empresaId) => {
    if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
      return { erro: "Valor ausente" };
    // NF-e de venda parcelada traz o vencimento real de cada duplicata (linha.vencimento).
    if (!linha.data && !linha.vencimento) return { erro: "Data de vencimento obrigatoria para Contas a Receber" };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Conta a receber importada",
        valor: linha.valor,
        data_vencimento: linha.vencimento || linha.data,
        data_emissao: linha.data || linha.vencimento,
        data_hora: linha.dataHora || null,
        status: "pendente",
        categoria: linha.categoria || null,
        numero_documento: linha.documento || null,
      },
    };
  },

  // -------------------------------------------------------------------------
  // FORNECEDORES (cadastro)
  // Schema real: nome* (NOT NULL), contato, produto_servico, valor_mensal,
  //              categoria, user_id, empresa_id, tipo_pessoa, documento,
  //              razao_social, nome_fantasia, email, telefone, etc.
  // -------------------------------------------------------------------------
  fornecedores: (linha, userId, empresaId) => {
    const nome = (linha.descricao || "").trim();
    if (!nome) return { erro: "Nome do fornecedor obrigatorio (use a coluna descricao)" };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        nome: nome,
        razao_social: nome,
        documento: linha.cnpj || null,
        tipo_pessoa: linha.cnpj && linha.cnpj.length > 14 ? "PJ" : "PF",
        categoria: linha.categoria || null,
        valor_mensal: linha.valor || 0,
        status: "ativo",
      },
    };
  },

  // -------------------------------------------------------------------------
  // DÍVIDAS (tabela real usada pelo módulo Endividamento — "endividamento" é
  // órfã, nunca lida pela UI, ver CONTEXTO-AXIOMA.md seção "armadilha conhecida")
  // Schema real: descricao*, tipo, valor_total*, valor_pago, parcelas,
  //              vencimento, taxa_juros, user_id, empresa_id
  // -------------------------------------------------------------------------
  dividas: (linha, userId, empresaId) => {
    if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
      return { erro: "Valor obrigatorio" };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Dívida importada",
        tipo: linha.categoria || "Outros",
        valor_total: linha.valor,
        valor_pago: 0,
        parcelas: 1,
        vencimento: linha.data || null,
        taxa_juros: 0,
      },
    };
  },
};

// ============================================================================
// POSSÍVEL DUPLICATA — Motor Antiduplicidade (lib/motorDuplicidade.ts)
// Camada A MAIS além da duplicata exata por hash (marcarDuplicatasPorLinha):
// regra (chave/nº da nota, fornecedor, parcela, forma de pagamento, horário)
// → Inteligência do Axioma → pergunta ao humano. Nada some sem ele ver.
// ============================================================================

const LABEL_TABELA: Record<DestinoTabela, string> = {
  fluxo_caixa: "Fluxo de Caixa",
  receitas: "Receitas",
  custos_fixos: "Custos Fixos",
  custos_variaveis: "Custos Variáveis",
  fornecedores: "Fornecedores",
  contas_pagar: "Contas a Pagar",
  contas_receber: "Contas a Receber",
  dividas: "Endividamento",
};

// Tabelas que são LANÇAMENTO datado (custos_fixos e fornecedores são cadastro).
// Reaproveitado tanto pra gravar "Somar" (soma no registro existente em vez
// de inserir um novo) quanto pra reverter (subtrai de volta o que foi somado).
const COLUNA_VALOR_DESTINO: Partial<Record<DestinoTabela, string>> = {
  fluxo_caixa: "valor", receitas: "valor", custos_variaveis: "valor",
  contas_pagar: "valor_total", contas_receber: "valor", dividas: "valor_total",
};

// Lê o valor atual de uma coluna cujo NOME é dinâmico (vem de
// COLUNA_VALOR_DESTINO, não de input externo) sem confiar cegamente no
// shape do retorno do Supabase. null é 0 legítimo (saldo nunca populado —
// começa a somar do zero). Qualquer outro caso (chave ausente, tipo
// inesperado) devolve null pra quem chama CANCELAR a operação em vez de
// gravar um saldo possivelmente errado — gravar errado é pior que falhar.
function lerValorColunaDinamica(atual: unknown, colValor: string): number | null {
  if (!atual || typeof atual !== "object" || !(colValor in atual)) return null;
  const bruto = (atual as Record<string, unknown>)[colValor];
  if (bruto === null) return 0;
  return typeof bruto === "number" ? bruto : null;
}

export type CandidatoDuplicata = {
  tabela: DestinoTabela | "lote";
  id: string;
  descricao: string;
  valor: number;
  data: string;
  modulo: string;
};

export type PossivelDuplicata = {
  candidato: CandidatoDuplicata;
  // "duplicata" = o motor provou (ou a IA tem certeza) que já existe → linha nasce em "Pular".
  // "perguntar" = dúvida real → o humano decide, com a explicação e a pergunta da IA.
  // "baixar" = é o PAGAMENTO de uma conta em aberto → linha nasce em "Dar baixa".
  decisao: "duplicata" | "perguntar" | "baixar";
  // Conta em aberto que este pagamento quita (Motor de Baixa). Em "perguntar" com
  // baixa, a tela oferece o botão "Dar baixa nesta conta".
  baixa?: { tabela: "contas_pagar" | "contas_receber"; id: string; estado: EstadoMatch; descricao: string; saldo: number };
  motivo: string;
  pergunta: string | null;
  porIA: boolean;
};

// Porta única: Motor Antiduplicidade (lib/motorDuplicidade.ts) — regra → IA → humano.
// Índice do retorno = índice da linha; null = sem suspeita (ou a IA conferiu que é outra conta).
export async function detectarPossiveisDuplicatas(
  empresaId: string | null,
  linhas: LinhaImportada[],
  destinos: DestinoTabela[],
  lang: Idioma = "pt"
): Promise<(PossivelDuplicata | null)[]> {
  if (!empresaId) return linhas.map(() => null);
  const idx = linhas.map((l, i) => i).filter((i) => linhas[i].valor !== undefined && !isNaN(Number(linhas[i].valor)) && !!COLUNA_VALOR_DESTINO[destinos[i]]);
  const lancs: Lancamento[] = idx.map((i) => {
    const l = linhas[i];
    const entrada = destinos[i] === "receitas" || destinos[i] === "contas_receber" || (destinos[i] === "fluxo_caixa" && l.tipo !== "saida");
    return {
      valor: Number(l.valor), data: l.data ?? null, dataHora: l.dataHora ?? null, vencimento: l.vencimento ?? null,
      descricao: l.descricao ?? null, documento: l.documento ?? null, chaveAcesso: l.chaveAcesso ?? null, forma: l.forma ?? null,
      contraparteId: l.fornecedorId ?? null, contraparteDoc: l.cnpj ?? null, entrada, destino: destinos[i],
    };
  });
  // Dinheiro que já se moveu (extrato, comprovante, caixa) pode ser o PAGAMENTO de
  // uma conta aberta: o Motor de Baixa procura antes de virar lançamento solto.
  const ehPagamento = (k: number) => ["fluxo_caixa", "custos_variaveis", "receitas"].includes(destinos[idx[k]]);
  const kPag = idx.map((_, k) => k).filter(ehPagamento);
  const [avaliacoes, baixas] = await Promise.all([
    avaliarDuplicidade(empresaId, lancs, lang),
    acharObrigacaoParaPagamento(empresaId, kPag.map((k) => lancs[k]), lang),
  ]);
  const baixaDe = new Map(kPag.map((k, j) => [k, baixas[j]]));
  const resultado: (PossivelDuplicata | null)[] = linhas.map(() => null);
  idx.forEach((i, k) => {
    const a = avaliacoes[k];
    const top = a.suspeitas[0];
    const b = baixaDe.get(k);
    // Duplicata provada vence; senão, pagamento de conta aberta vence a dúvida.
    if (b && b.obrigacao && b.estado !== "UNMATCHED" && a.decisao !== "duplicata") {
      const o = b.obrigacao;
      resultado[i] = {
        candidato: { tabela: o.tabela, id: o.id, descricao: o.descricao, valor: o.saldo, data: o.vencimento || "", modulo: LABEL_TABELA[o.tabela] },
        decisao: b.estado === "POSSIBLE_MATCH" ? "perguntar" : "baixar", motivo: b.motivo, pergunta: b.estado === "POSSIBLE_MATCH" ? ({ pt: "Este pagamento quita essa conta?", en: "Does this payment settle that bill?", es: "¿Este pago liquida esa cuenta?" })[lang] : null, porIA: false,
        baixa: { tabela: o.tabela, id: o.id, estado: b.estado, descricao: o.descricao, saldo: o.saldo },
      };
      return;
    }
    if (a.decisao === "segue" || !top) return;
    const c = top.candidato;
    resultado[i] = {
      candidato: { tabela: c.tabela === "lote" ? "lote" : (c.tabela as DestinoTabela), id: c.id, descricao: c.descricao || "", valor: c.valor, data: c.data || c.vencimento || "", modulo: c.modulo[lang] },
      decisao: a.decisao, motivo: a.explicacao, pergunta: a.pergunta, porIA: a.porIA,
    };
  });
  return resultado;
}

// ============================================================================
// TIMELINE — histórico de eventos por importação (Fase 1)
// ============================================================================

export async function registrarEventoTimeline(params: {
  empresaId: string | null;
  userId: string;
  importacaoId: string;
  evento: string;
  descricao?: string;
  dados?: any;
}): Promise<void> {
  if (!params.empresaId) return;
  const { error } = await supabase.from("importacao_timeline").insert({
    empresa_id: params.empresaId,
    user_id: params.userId,
    importacao_id: params.importacaoId,
    evento: params.evento,
    descricao: params.descricao || null,
    dados: params.dados || null,
  });
  // Log de timeline não bloqueia nem avisa o usuário (dispara várias vezes por
  // importação, avisar cada falha seria ruído) — só reporta pro Sentry.
  if (error) reportarFalhaEscrita("importacao_timeline", "insert", error.message);
}

export async function listarTimeline(importacaoId: string, empresaId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_timeline")
    .select("*")
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });
  return data || [];
}

// ============================================================================
// FILA DE EXCEÇÕES — o que o sistema não decidiu sozinho (Fase 1)
// ============================================================================

async function abrirExcecoes(params: {
  empresaId: string | null;
  userId: string;
  importacaoId: string;
  itens: { linhaNumero: number; tipo: string; motivo: string; dadosOriginais?: any }[];
}): Promise<void> {
  if (!params.empresaId || params.itens.length === 0) return;
  const rows = params.itens.map((it) => ({
    empresa_id: params.empresaId,
    user_id: params.userId,
    importacao_id: params.importacaoId,
    linha_numero: it.linhaNumero,
    tipo: it.tipo,
    motivo: it.motivo,
    dados_originais: it.dadosOriginais || null,
    status: "pendente",
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from("importacao_excecoes").insert(rows.slice(i, i + 500));
    if (error) reportarFalhaEscrita("importacao_excecoes", "insert", error.message);
  }
}

// Chamar depois de parseArquivo() quando o layout da Reforma Tributária vier
// incoerente (ver validarFormatoReforma em importarParsers.ts) — abre 1
// exceção pro documento inteiro pra revisão humana, não bloqueia a importação.
export async function abrirExcecaoFormatoReforma(params: {
  empresaId: string | null;
  userId: string;
  importacaoId: string;
  resultado: ResultadoParse;
}): Promise<void> {
  const problemas = params.resultado.metadados?.problemas_formato_reforma as string[] | undefined;
  if (!problemas || problemas.length === 0) return;
  await abrirExcecoes({
    empresaId: params.empresaId,
    userId: params.userId,
    importacaoId: params.importacaoId,
    itens: [{ linhaNumero: 1, tipo: "formato_reforma_incoerente", motivo: problemas.join("; "), dadosOriginais: params.resultado.metadados }],
  });
  await registrarEventoTimeline({
    empresaId: params.empresaId,
    userId: params.userId,
    importacaoId: params.importacaoId,
    evento: "excecao_aberta",
    descricao: "Layout da Reforma Tributária (CFOP/CST/NCM/IBS-CBS) com formato incoerente — revisar antes de confirmar",
  });
}

export async function listarExcecoes(importacaoId: string, empresaId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_excecoes")
    .select("*")
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function resolverExcecao(excecaoId: string, empresaId: string, resolucao: string): Promise<{ erro: string | null }> {
  const { data, error } = await supabase
    .from("importacao_excecoes")
    .update({ status: "resolvida", resolucao, resolvido_em: new Date().toISOString() })
    .eq("id", excecaoId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacao_excecoes", "update (resolver)", motivo);
    return { erro: motivo };
  }
  return { erro: null };
}

// ============================================================================
// MOTOR DE APRENDIZADO — lembra como uma descrição parecida já foi
// classificada, pra SUGERIR (nunca decidir sozinho) da próxima vez (Fase 1).
// Números/datas somem da chave porque mudam a cada lançamento; o que
// identifica o padrão é o texto (ex: "UBER *TRIP 04/02" e "UBER *TRIP 05/03"
// viram a mesma chave "uber trip").
// ============================================================================

export function normalizarPadraoChave(descricao: string): string {
  return (descricao || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

// Lote único (1 select + 1 upsert) por gravação — nunca 1 consulta por linha.
async function atualizarPadroesClassificacao(
  empresaId: string,
  destino: DestinoTabela,
  linhas: { descricao?: string; categoria?: string }[]
): Promise<void> {
  if (!empresaId || linhas.length === 0) return;

  const contagem = new Map<string, { categoria: string | null; qtd: number }>();
  linhas.forEach((l) => {
    const chave = normalizarPadraoChave(l.descricao || "");
    if (!chave) return;
    const atual = contagem.get(chave);
    if (atual) atual.qtd++;
    else contagem.set(chave, { categoria: l.categoria || null, qtd: 1 });
  });
  if (contagem.size === 0) return;

  const chaves = Array.from(contagem.keys());
  const { data: existentes } = await supabase
    .from("importacao_padroes_classificacao")
    .select("padrao_chave, ocorrencias")
    .eq("empresa_id", empresaId)
    .eq("destino_tabela", destino)
    .in("padrao_chave", chaves);

  const ocorrenciasExistentes = new Map((existentes || []).map((e: any) => [e.padrao_chave, e.ocorrencias]));

  const linhasUpsert = chaves.map((chave) => {
    const info = contagem.get(chave)!;
    return {
      empresa_id: empresaId,
      padrao_chave: chave,
      destino_tabela: destino,
      categoria: info.categoria,
      ocorrencias: (ocorrenciasExistentes.get(chave) || 0) + info.qtd,
      ultima_vez_usado: new Date().toISOString(),
    };
  });

  // varredura:ok — upsert de aprendizado; erro checado abaixo (não bloqueia a importação)
  const { error } = await supabase
    .from("importacao_padroes_classificacao")
    .upsert(linhasUpsert, { onConflict: "empresa_id,padrao_chave,destino_tabela" });
  // Cache de sugestão — se falhar, só perde o aprendizado desta leva (a
  // importação em si já terminou); não bloqueia nem avisa o usuário.
  if (error) reportarFalhaEscrita("importacao_padroes_classificacao", "upsert", error.message);
}

export type SugestaoClassificacao = { destino: DestinoTabela; categoria: string | null; confianca: number };

// 1 consulta só, pra todas as descrições novas de um arquivo de uma vez —
// a UI usa pra pré-sugerir categoria/destino, sem decidir por conta própria.
export async function sugerirClassificacoes(
  empresaId: string | null,
  descricoes: string[]
): Promise<Map<string, SugestaoClassificacao>> {
  const mapa = new Map<string, SugestaoClassificacao>();
  if (!empresaId) return mapa;

  const chaves = Array.from(new Set(descricoes.map(normalizarPadraoChave).filter(Boolean)));
  if (chaves.length === 0) return mapa;

  const { data } = await supabase
    .from("importacao_padroes_classificacao")
    .select("padrao_chave, destino_tabela, categoria, ocorrencias")
    .eq("empresa_id", empresaId)
    .in("padrao_chave", chaves);

  (data || []).forEach((p: any) => {
    const atual = mapa.get(p.padrao_chave);
    if (!atual || p.ocorrencias > atual.confianca) {
      mapa.set(p.padrao_chave, { destino: p.destino_tabela, categoria: p.categoria, confianca: p.ocorrencias });
    }
  });

  return mapa;
}

// ============================================================================
// HASH
// ============================================================================

export async function hashArquivo(file: File): Promise<string> {
  // Navegador com leitura de arquivo travada (visto 2026-10-02) deixava o
  // "Verificando duplicatas..." girando pra sempre — vira erro com aviso.
  const buffer = await Promise.race([
    file.arrayBuffer(),
    new Promise<never>((_, rej) => setTimeout(() => rej(new Error("leitura do arquivo travou (navegador)")), 15000)),
  ]);
  const bytes = new Uint8Array(buffer);
  const wordArray = CryptoJS.lib.WordArray.create(bytes as any);
  return CryptoJS.SHA256(wordArray).toString(CryptoJS.enc.Hex);
}

export function hashLinha(linha: LinhaImportada): string {
  const chave = `${linha.data || ""}_${linha.valor || 0}_${(linha.descricao || "").trim().toLowerCase()}`;
  return CryptoJS.SHA256(chave).toString(CryptoJS.enc.Hex);
}

// ============================================================================
// DUPLICATA GLOBAL: arquivo inteiro já foi importado?
// ============================================================================

export async function buscarImportacaoPorHash(
  empresaId: string,
  hash: string
): Promise<any | null> {
  const { data } = await supabase
    .from("importacoes")
    .select("id, nome_arquivo, created_at, status, linhas_importadas")
    .eq("empresa_id", empresaId)
    .eq("hash_arquivo", hash)
    .neq("status", "revertido")
    .maybeSingle();
  return data;
}

// ============================================================================
// DUPLICATA POR LINHA: marca cada linha que já existe no destino
// ============================================================================

export async function marcarDuplicatasPorLinha(
  empresaId: string,
  linhas: LinhaImportada[],
  destinos: DestinoTabela[]
): Promise<boolean[]> {
  const hashesNovos = linhas.map(hashLinha);
  if (hashesNovos.length === 0) return [];

  // 1 consulta por destino distinto presente no lote — nunca 1 por linha,
  // mesmo com destinos diferentes dentro do mesmo arquivo (extrato misto).
  const hashesPorDestino = new Map<DestinoTabela, string[]>();
  destinos.forEach((d, i) => {
    const arr = hashesPorDestino.get(d) || [];
    arr.push(hashesNovos[i]);
    hashesPorDestino.set(d, arr);
  });

  const setExistente = new Set<string>();
  await Promise.all(
    Array.from(hashesPorDestino.entries()).map(async ([destino, hashes]) => {
      const { data } = await supabase
        .from("importacao_linhas")
        .select("hash_linha")
        .eq("empresa_id", empresaId)
        .eq("destino_tabela", destino)
        .eq("status", "importada")
        .in("hash_linha", hashes);
      (data || []).forEach((l: any) => setExistente.add(l.hash_linha));
    })
  );

  return hashesNovos.map((h) => setExistente.has(h));
}

// ============================================================================
// UPLOAD PRO STORAGE: documentos/{user_id}/{ano}/{mes}/{hash}.ext
// ============================================================================

export async function uploadArquivo(
  file: File,
  userId: string,
  hash: string
): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase();
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const path = `${userId}/${ano}/${mes}/${hash}.${ext}`;

  const { error } = await supabase.storage
    .from("documentos")
    .upload(path, file, { upsert: true, contentType: file.type || "application/octet-stream" });

  if (error) throw new Error(`Upload falhou: ${error.message}`);
  return path;
}

export async function gerarUrlAssinada(path: string, segundos: number = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from("documentos").createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

// ============================================================================
// EXCLUIR REGISTRO DE IMPORTAÇÃO (só para importações com erro ou revertidas)
// Remove a linha da auditoria e do histórico. Não toca em destinos —
// nessas importações nada foi efetivamente gravado nos lançamentos finais.
// ============================================================================

export async function excluirRegistroImportacao(
  importacaoId: string,
  userId: string,
  empresaId: string
): Promise<{ erro: string | null }> {
  // 1) Valida que a importação existe e pertence à empresa ativa (userId
  // era recebido mas nunca usado pra travar nada — a chave de posse aqui é
  // a empresa, não a pessoa, senão um colega de equipe não conseguiria
  // limpar um registro com erro que outro colega enviou).
  const { data: imp, error: errBusca } = await supabase
    .from("importacoes")
    .select("id, status, linhas_importadas")
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (errBusca) return { erro: errBusca.message };
  if (!imp) return { erro: "Importacao nao encontrada" };

  // 2) Só permite exclusão de erro/revertido/cancelado (segurança)
  const statusPermitidos = ["erro", "revertido", "falhou"];
  if (!statusPermitidos.includes(imp.status)) {
    return {
      erro: `Nao e possivel excluir registro com status '${imp.status}'. Desfaça a importacao primeiro.`,
    };
  }

  // 3) Deleta as linhas de auditoria (FK CASCADE já faria, mas explicitamos)
  // varredura:ok — 0 linhas é possível (importação sem linhas); erro checado abaixo
  const { error: errLinhas } = await supabase
    .from("importacao_linhas")
    .delete()
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId);

  if (errLinhas) {
    reportarFalhaEscrita("importacao_linhas", "delete (excluir registro de importação)", errLinhas.message);
    return { erro: `Erro ao limpar linhas: ${errLinhas.message}` };
  }

  // 4) Deleta o cabeçalho
  const { data: impApagada, error: errImp } = await supabase
    .from("importacoes")
    .delete()
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId)
    .select("id");

  if (errImp || !impApagada?.length) {
    // 0 linhas = RLS negou: antes a tela dizia "excluído" e o registro continuava lá.
    const motivo = errImp?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacoes", "delete (excluir registro de importação)", motivo);
    return { erro: `Erro ao remover registro: ${motivo}` };
  }

  return { erro: null };
}

// ============================================================================
// CRIAR REGISTRO DE IMPORTAÇÃO (cabeçalho)
// ============================================================================

export async function criarImportacao(params: {
  userId: string;
  empresaId: string | null;
  nomeArquivo: string;
  hash: string;
  storagePath: string;
  tipoArquivo: string;
  mimeType: string;
  tamanhoBytes: number;
  tipoDocumento: string;
  destino: DestinoTabela;
  totalLinhas: number;
  mapeamentoUsado?: any;
}): Promise<string> {
  const { data, error } = await supabase
    .from("importacoes")
    .insert({
      user_id: params.userId,
      empresa_id: params.empresaId,
      nome_arquivo: params.nomeArquivo,
      hash_arquivo: params.hash,
      storage_path: params.storagePath,
      tipo_arquivo: params.tipoArquivo,
      mime_type: params.mimeType,
      tamanho_bytes: params.tamanhoBytes,
      tipo_documento: params.tipoDocumento,
      destino: params.destino,
      total_linhas: params.totalLinhas,
      status: "aguardando_revisao",
      mapeamento_usado: params.mapeamentoUsado,
    })
    .select("id")
    .single();

  if (error) {
    reportarFalhaEscrita("importacoes", "insert (criar importação)", error.message);
    throw new Error(`Erro ao criar importacao: ${error.message}`);
  }

  await registrarEventoTimeline({
    empresaId: params.empresaId,
    userId: params.userId,
    importacaoId: data.id,
    evento: "criada",
    descricao: `Arquivo "${params.nomeArquivo}" enviado (${params.totalLinhas} linhas, destino ${params.destino})`,
  });

  return data.id;
}

// ============================================================================
// GRAVAR LINHAS NOS DESTINOS REAIS + importacao_linhas (auditoria)
// SEM RETRY, SEM REMOÇÃO SILENCIOSA. Cada erro é registrado com clareza.
// ============================================================================

export type ResultadoGravacao = {
  importadas: number;
  somadas: number;
  baixadas: number; // pagamentos que deram baixa numa conta em aberto (sem lançamento novo)
  duplicadas: number;
  ignoradas: number;
  erro: number;
  valor_total: number;
  mensagens_erro: string[];
  // Registros criados nos destinos (B3 item 4: ligar a conta a pagar da nota
  // ao custo fixo que o usuário pediu pra criar a partir dela).
  inseridos: { tabela: DestinoTabela; id: string }[];
};

// Baixa de 1 conta pela importação: lê a conta (da empresa ativa) e usa a MESMA
// porta das telas — darBaixaContaPagar / registrarRecebimento — na data real do pagamento.
async function baixarContaPelaImportacao(
  empresaId: string, alvo: { tabela: "contas_pagar" | "contas_receber"; id: string }, linha: LinhaImportada,
): Promise<{ erro?: string }> {
  const valor = Math.round((Number(linha.valor) || 0) * 100) / 100;
  if (!(valor > 0)) return { erro: "valor inválido" };
  const data = linha.data || hojeISO();
  const { data: conta, error } = await supabase.from(alvo.tabela).select("*").eq("id", alvo.id).eq("empresa_id", empresaId).maybeSingle();
  if (error || !conta) return { erro: error?.message || "conta não encontrada nesta empresa" };
  if (alvo.tabela === "contas_pagar") {
    const r = await darBaixaContaPagar(conta as ContaPagar, Number(conta.valor_pago || 0) + valor, data, linha.forma || "Outros");
    return { erro: r.erro };
  }
  const r = await registrarRecebimento(conta as ContaParaReceber, valor, empresaId, "importar_documentos", data);
  return { erro: r.erro };
}

export async function gravarLinhas(params: {
  userId: string;
  empresaId: string | null;
  importacaoId: string;
  linhas: LinhaImportada[];
  selecionadas: boolean[];
  duplicadas: boolean[];
  // Destino por linha (não por arquivo inteiro) — distribuição automática
  // (sugerida pelo parser, confirmada/trocada pelo usuário na tela).
  destinos: DestinoTabela[];
  // Simulador (Fase 1): roda o MESMO caminho — mesmos builders, mesma
  // validação — mas nunca grava no destino real nem em auditoria/timeline/
  // exceções/padrões. É por isso que não existe uma função de simulação
  // separada: o risco de simular e importar de verdade divergirem é zero.
  dryRun?: boolean;
  // Confirmação de possível duplicata: quando a linha[i] veio marcada
  // "Somar", soma no registro existente (que pode estar em OUTRA tabela,
  // por isso tabela+id) em vez de inserir uma linha nova.
  somarAlvo?: ({ tabela: DestinoTabela; id: string } | null)[];
  // Motor de Baixa: a linha é o pagamento desta conta em aberto → dá baixa nela.
  baixarAlvo?: ({ tabela: "contas_pagar" | "contas_receber"; id: string } | null)[];
}): Promise<ResultadoGravacao> {
  const { userId, empresaId, importacaoId, linhas, selecionadas, duplicadas, destinos, dryRun, somarAlvo, baixarAlvo } = params;

  const resultado: ResultadoGravacao = {
    importadas: 0,
    somadas: 0,
    baixadas: 0,
    duplicadas: 0,
    ignoradas: 0,
    erro: 0,
    valor_total: 0,
    mensagens_erro: [],
    inseridos: [],
  };

  const auditoriaRows: any[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const numLinha = i + 1;
    const hashLn = hashLinha(linha);
    const destino = destinos[i];

    const auditoriaBase = {
      importacao_id: importacaoId,
      user_id: userId,
      empresa_id: empresaId,
      linha_numero: numLinha,
      dados_brutos: linha.raw,
      destino_tabela: destino,
      data_lancamento: linha.data,
      valor: linha.valor,
      descricao: linha.descricao,
      categoria: linha.categoria,
      hash_linha: hashLn,
    };

    // 1) Linha desmarcada → ignorada
    if (!selecionadas[i]) {
      resultado.ignoradas++;
      auditoriaRows.push({ ...auditoriaBase, status: "ignorada" });
      continue;
    }

    // 2) Linha duplicada → marca, não grava
    if (duplicadas[i]) {
      resultado.duplicadas++;
      auditoriaRows.push({
        ...auditoriaBase,
        status: "duplicada",
        mensagem: "Lancamento ja existia no sistema",
      });
      continue;
    }

    // 3) Montar payload via builder específico do destino DESTA linha
    const builder = BUILDERS[destino];
    if (!builder) {
      resultado.erro++;
      const msg = `Destino nao suportado: ${destino}`;
      resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
      auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: msg });
      continue;
    }
    const build = builder(linha, userId, empresaId);
    if ("erro" in build) {
      resultado.erro++;
      resultado.mensagens_erro.push(`Linha ${numLinha}: ${build.erro}`);
      auditoriaRows.push({
        ...auditoriaBase,
        status: "erro",
        mensagem: build.erro,
      });
      continue;
    }

    const alvoSomar = somarAlvo?.[i] || null;
    const alvoBaixar = baixarAlvo?.[i] || null;

    // 4) dryRun (Simulador): mesma validação acima, mas não toca no banco —
    // conta como se tivesse dado certo, sem gravar nada real.
    if (dryRun) {
      resultado.importadas++;
      if (alvoSomar) resultado.somadas++;
      if (alvoBaixar) resultado.baixadas++;
      resultado.valor_total += linha.valor || 0;
      auditoriaRows.push({ ...auditoriaBase, status: alvoSomar ? "somada" : "importada" });
      continue;
    }

    // 4a) Pagamento de conta em aberto (Motor de Baixa): baixa pela porta oficial —
    // o rastro leva o dinheiro a Contabilidade, Fluxo, DRE, Inadimplência e Fornecedor.
    // Nenhum lançamento novo é criado (seria o mesmo dinheiro 2 vezes). Desfazer =
    // Estornar na própria conta (a reversão da importação não mexe em baixa).
    if (alvoBaixar) {
      const r = empresaId ? await baixarContaPelaImportacao(empresaId, alvoBaixar, linha) : { erro: "Empresa ativa não identificada" };
      if (r.erro) {
        resultado.erro++;
        resultado.mensagens_erro.push(`Linha ${numLinha}: baixa não feita — ${r.erro}`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: `Baixa não feita: ${r.erro}` });
        continue;
      }
      resultado.baixadas++;
      resultado.valor_total += linha.valor || 0;
      auditoriaRows.push({
        ...auditoriaBase, destino_tabela: alvoBaixar.tabela, destino_id: alvoBaixar.id, status: "ignorada",
        mensagem: `Pagamento usado para dar baixa na conta já existente em ${LABEL_TABELA[alvoBaixar.tabela]} (sem lançamento novo)`,
      });
      continue;
    }

    // 4b) Confirmação de possível duplicata = "Somar": soma no registro
    // existente (que pode estar em outra tabela) em vez de criar um novo.
    // Sem empresa ativa confirmada, não há como garantir de quem é o registro
    // — bloqueia em vez de arriscar somar em cima de dado de outra empresa.
    if (alvoSomar) {
      if (!empresaId) {
        resultado.erro++;
        resultado.mensagens_erro.push(`Linha ${numLinha}: empresa ativa não identificada, não é possível confirmar o dono do registro para somar`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: "Empresa ativa não identificada" });
        continue;
      }
      const colValor = COLUNA_VALOR_DESTINO[alvoSomar.tabela];
      if (!colValor) {
        resultado.erro++;
        resultado.mensagens_erro.push(`Linha ${numLinha}: destino "${alvoSomar.tabela}" não suporta somar`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: "Destino sem coluna de valor conhecida para somar" });
        continue;
      }
      // Filtro por empresa_id no SELECT e no UPDATE: garante que o registro
      // alvo pertence à empresa ativa ANTES de ler/gravar — nunca soma em
      // cima de lançamento de outra empresa, mesmo que o id seja válido.
      const { data: atual, error: errBusca } = await supabase
        .from(alvoSomar.tabela)
        .select(colValor)
        .eq("id", alvoSomar.id)
        .eq("empresa_id", empresaId)
        .maybeSingle();
      if (errBusca || !atual) {
        resultado.erro++;
        const msg = errBusca?.message || "Registro para somar não encontrado nesta empresa";
        resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: msg });
        continue;
      }
      const valorAtual = lerValorColunaDinamica(atual, colValor);
      if (valorAtual === null) {
        resultado.erro++;
        const msg = `Linha ${numLinha}: coluna de valor "${colValor}" não veio como número em ${alvoSomar.tabela} — operação de somar cancelada por segurança`;
        resultado.mensagens_erro.push(msg);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: msg });
        reportarFalhaEscrita(alvoSomar.tabela, "somar importação (leitura de valor atual)", `coluna ${colValor} ausente ou com tipo inesperado`);
        continue;
      }
      const novoValor = valorAtual + (linha.valor || 0);
      // Conta a pagar/receber: soma pela porta única — a contabilidade refaz o
      // reconhecimento pelo valor novo (AP_UPDATED/AR_UPDATED). Antes o valor mudava
      // aqui e o Razão ficava com o valor antigo.
      const viaPorta = alvoSomar.tabela === "contas_pagar" ? await editarContaPagar(alvoSomar.id, { valor_total: novoValor })
        : alvoSomar.tabela === "contas_receber" ? await editarContaReceber(alvoSomar.id, { valor: novoValor }, "importar_documentos")
        : null;
      const { data: somado, error: errUpdate } = viaPorta
        ? { data: viaPorta.erro ? [] : [{ id: alvoSomar.id }], error: viaPorta.erro ? { message: viaPorta.erro } : null }
        : await supabase.from(alvoSomar.tabela).update({ [colValor]: novoValor }).eq("id", alvoSomar.id).eq("empresa_id", empresaId).select("id");
      if (errUpdate || !somado || somado.length === 0) {
        const msg = errUpdate?.message || "0 linhas afetadas (RLS?)";
        resultado.erro++;
        resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: msg });
        reportarFalhaEscrita(alvoSomar.tabela, "update (somar importação)", msg);
        continue;
      }
      resultado.importadas++;
      resultado.somadas++;
      resultado.valor_total += linha.valor || 0;
      auditoriaRows.push({
        ...auditoriaBase,
        destino_tabela: alvoSomar.tabela,
        destino_id: alvoSomar.id,
        status: "somada",
        mensagem: `Somado ao lançamento já existente em ${LABEL_TABELA[alvoSomar.tabela]}`,
      });
      continue;
    }

    // 4c) Inserir no destino de verdade (uma tentativa, sem retry). Conta a pagar/
    // receber vai pela porta única: contabilidade, alçada de aprovação e — se a nota
    // já veio quitada — a baixa oficial pelo Motor de Rastreabilidade. Antes nascia
    // "paga" direto no banco, sem o pagamento existir em contabilidade/fluxo/DRE.
    const { data: inserido, error } = await (async () => {
      if (destino !== "contas_pagar" && destino !== "contas_receber") {
        return supabase.from(destino).insert(build.payload).select("id").single();
      }
      if (!empresaId) return { data: null, error: { message: "Empresa ativa não identificada" } };
      const p = build.payload as Record<string, unknown>;
      const r = destino === "contas_pagar"
        ? await criarContaPagar(userId, empresaId, p as Partial<ContaPagar>,
            Number(p.valor_pago) > 0 ? { origem: "importar_documentos", pagoNaOrigem: { valor: Number(p.valor_pago), data: (p.data_emissao as string) || hojeISO(), forma: (p.forma_pagamento as string) || "Outros" } } : { origem: "importar_documentos" })
        : await criarContaReceber(userId, empresaId, p, { modulo: "importar_documentos" });
      return r.id ? { data: { id: r.id }, error: null } : { data: null, error: { message: r.erro || "falha ao criar a conta" } };
    })();

    if (error || !inserido) {
      resultado.erro++;
      const msg = error?.message || "Erro desconhecido ao inserir";
      resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
      reportarFalhaEscrita(destino, "insert (gravar linha importada)", msg);
      auditoriaRows.push({
        ...auditoriaBase,
        status: "erro",
        mensagem: msg,
      });
      continue;
    }

    // 5) Sucesso
    resultado.importadas++;
    resultado.inseridos.push({ tabela: destino, id: inserido.id });
    resultado.valor_total += linha.valor || 0;
    auditoriaRows.push({
      ...auditoriaBase,
      destino_id: inserido.id,
      status: "importada",
    });
  }

  if (dryRun) return resultado;

  // Insere auditoria em lote (chunks de 500) — trilha da importação; se
  // falhar, os lançamentos já foram gravados nos destinos reais acima, então
  // não bloqueia, só avisa (mensagens_erro já é mostrado na tela de resultado).
  for (let i = 0; i < auditoriaRows.length; i += 500) {
    const chunk = auditoriaRows.slice(i, i + 500);
    const { error: erroAuditoria } = await supabase.from("importacao_linhas").insert(chunk);
    if (erroAuditoria) {
      reportarFalhaEscrita("importacao_linhas", "insert", erroAuditoria.message);
      resultado.mensagens_erro.push(`Trilha de auditoria: ${erroAuditoria.message}`);
    }
  }

  // Atualiza cabeçalho com status final
  let statusFinal = "concluido";
  if (resultado.importadas === 0 && resultado.erro > 0) statusFinal = "erro";
  else if (resultado.erro > 0 || resultado.duplicadas > 0) statusFinal = "parcialmente";

  // varredura:ok — .select("id") e conferência de linhas logo abaixo
  let qCabecalho = supabase
    .from("importacoes")
    .update({
      status: statusFinal,
      linhas_importadas: resultado.importadas,
      linhas_duplicadas: resultado.duplicadas,
      linhas_ignoradas: resultado.ignoradas,
      linhas_erro: resultado.erro,
      valor_total_importado: resultado.valor_total,
      mensagem_erro: resultado.mensagens_erro.slice(0, 5).join(" | ") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId);
  if (empresaId) qCabecalho = qCabecalho.eq("empresa_id", empresaId);
  const { data: cabecalhoAtualizado, error: erroCabecalho } = await qCabecalho.select("id");
  if (erroCabecalho || !cabecalhoAtualizado || cabecalhoAtualizado.length === 0) {
    const motivo = erroCabecalho?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacoes", "update (status final)", motivo);
    resultado.mensagens_erro.push(`Status final da importação não foi salvo: ${motivo}`);
  }

  // Fila de exceções: toda linha que deu erro (parser recusou ou builder
  // rejeitou) vira 1 item pra revisão humana, em vez de só uma mensagem
  // perdida no cabeçalho.
  const itensExcecao = auditoriaRows
    .map((row, idx) => ({ row, idx }))
    .filter(({ row }) => row.status === "erro")
    .map(({ row, idx }) => ({
      linhaNumero: idx + 1,
      tipo: "linha_invalida",
      motivo: row.mensagem || "Erro ao processar linha",
      dadosOriginais: row.dados_brutos,
    }));
  await abrirExcecoes({ empresaId, userId, importacaoId, itens: itensExcecao });

  // Motor de aprendizado: só aprende com o que realmente foi gravado —
  // agrupado por destino (um lote pode ter linhas em tabelas diferentes).
  if (empresaId) {
    const gravadasPorDestino = new Map<DestinoTabela, LinhaImportada[]>();
    linhas.forEach((linha, i) => {
      if (!selecionadas[i] || duplicadas[i] || auditoriaRows[i]?.status !== "importada") return;
      const arr = gravadasPorDestino.get(destinos[i]) || [];
      arr.push(linha);
      gravadasPorDestino.set(destinos[i], arr);
    });
    await Promise.all(
      Array.from(gravadasPorDestino.entries()).map(([dest, lns]) =>
        atualizarPadroesClassificacao(empresaId!, dest, lns)
      )
    );
  }

  await registrarEventoTimeline({
    empresaId,
    userId,
    importacaoId,
    evento: "linhas_gravadas",
    descricao: `${resultado.importadas} importadas (${resultado.somadas} somadas a lançamentos existentes), ${resultado.baixadas} baixas em contas abertas, ${resultado.duplicadas} duplicadas, ${resultado.ignoradas} ignoradas, ${resultado.erro} com erro`,
    dados: {
      importadas: resultado.importadas,
      somadas: resultado.somadas,
      baixadas: resultado.baixadas,
      duplicadas: resultado.duplicadas,
      ignoradas: resultado.ignoradas,
      erro: resultado.erro,
    },
  });

  return resultado;
}

// ============================================================================
// LISTAR LINHAS DE UMA IMPORTAÇÃO (para o histórico expandido)
// ============================================================================

export async function listarLinhasImportacao(
  importacaoId: string,
  empresaId: string
): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_linhas")
    .select("*")
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId)
    .order("linha_numero", { ascending: true });
  return data || [];
}

// ============================================================================
// EDITAR UMA LINHA JÁ IMPORTADA (atualiza destino real + auditoria)
// ============================================================================

export async function editarLinhaImportada(
  linhaAuditoriaId: string,
  userId: string,
  empresaId: string,
  novosDados: {
    data?: string;
    valor?: number;
    descricao?: string;
    categoria?: string;
  }
): Promise<{ erro: string | null; avisoTrilha?: string }> {
  // 1) Busca auditoria — filtrada pela empresa ativa: se a linha for de outra
  // empresa, o filtro já devolve "não encontrada" (nunca chega a editar).
  const { data: aud, error: errBusca } = await supabase
    .from("importacao_linhas")
    .select("destino_tabela, destino_id, importacao_id, empresa_id")
    .eq("id", linhaAuditoriaId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (errBusca) return { erro: errBusca.message };
  if (!aud || !aud.destino_id) return { erro: "Linha nao encontrada ou ja foi removida" };

  const destino = aud.destino_tabela as DestinoTabela;

  // 2) Monta payload de UPDATE específico para o destino
  const payload: Record<string, any> = {};

  if (destino === "fluxo_caixa" || destino === "receitas" || destino === "custos_variaveis") {
    if (novosDados.data !== undefined) payload.data = novosDados.data;
    if (novosDados.valor !== undefined) payload.valor = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.descricao = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.categoria = novosDados.categoria;
  } else if (destino === "custos_fixos") {
    if (novosDados.valor !== undefined) payload.valor_mensal = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.descricao = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.categoria = novosDados.categoria;
    if (novosDados.data !== undefined) {
      const dia = new Date(novosDados.data + "T00:00:00").getDate();
      payload.dia_vencimento = Math.max(1, Math.min(31, dia));
    }
  } else if (destino === "contas_pagar") {
    if (novosDados.data !== undefined) payload.data_vencimento = novosDados.data;
    if (novosDados.valor !== undefined) payload.valor_total = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.descricao = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.categoria = novosDados.categoria;
  } else if (destino === "contas_receber") {
    if (novosDados.data !== undefined) payload.data_vencimento = novosDados.data;
    if (novosDados.valor !== undefined) payload.valor = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.descricao = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.categoria = novosDados.categoria;
  } else if (destino === "fornecedores") {
    if (novosDados.valor !== undefined) payload.valor_mensal = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.nome = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.categoria = novosDados.categoria;
  } else if (destino === "dividas") {
    if (novosDados.data !== undefined) payload.vencimento = novosDados.data;
    if (novosDados.valor !== undefined) payload.valor_total = novosDados.valor;
    if (novosDados.descricao !== undefined) payload.descricao = novosDados.descricao;
    if (novosDados.categoria !== undefined) payload.tipo = novosDados.categoria;
  }

  if (Object.keys(payload).length === 0) {
    return { erro: "Nenhum campo para atualizar" };
  }

  // 3) UPDATE no destino real — trava dupla de empresa (a linha de auditoria
  // já foi confirmada da empresa ativa acima; aqui filtra de novo, direto na
  // tabela de destino, defesa em profundidade caso as duas divirjam).
  // Conta a pagar/receber: edita pela porta única (contabilidade acompanha o valor novo).
  const viaPorta = destino === "contas_pagar" ? await editarContaPagar(aud.destino_id, payload)
    : destino === "contas_receber" ? await editarContaReceber(aud.destino_id, payload, "importar_documentos")
    : null;
  const { data: editado, error: errUpdate } = viaPorta
    ? { data: viaPorta.erro ? [] : [{ id: aud.destino_id }], error: viaPorta.erro ? { message: viaPorta.erro } : null }
    : await supabase.from(destino).update(payload).eq("id", aud.destino_id).eq("empresa_id", empresaId).select("id");

  if (errUpdate || !editado || editado.length === 0) {
    const motivo = errUpdate?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita(destino, "update (editar linha importada)", motivo);
    return { erro: motivo };
  }

  // 4) UPDATE na auditoria
  const auditUpdate: Record<string, any> = {
    mensagem: `Editada em ${new Date().toLocaleString("pt-BR")}`,
  };
  if (novosDados.data !== undefined) auditUpdate.data_lancamento = novosDados.data;
  if (novosDados.valor !== undefined) auditUpdate.valor = novosDados.valor;
  if (novosDados.descricao !== undefined) auditUpdate.descricao = novosDados.descricao;
  if (novosDados.categoria !== undefined) auditUpdate.categoria = novosDados.categoria;

  let avisoTrilha: string | undefined;

  const { data: linhaAtualizada, error: erroAuditUpdate } = await supabase
    .from("importacao_linhas")
    .update(auditUpdate)
    .eq("id", linhaAuditoriaId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (erroAuditUpdate || !linhaAtualizada || linhaAtualizada.length === 0) {
    const motivo = erroAuditUpdate?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacao_linhas", "update (edição)", motivo);
    avisoTrilha = motivo;
  }

  // 5) Recalcula totais da importação
  const { erro: erroRecalculo } = await recalcularTotaisImportacao(aud.importacao_id, empresaId);
  if (erroRecalculo) avisoTrilha = avisoTrilha ? `${avisoTrilha}; ${erroRecalculo}` : erroRecalculo;

  await registrarEventoTimeline({
    empresaId: aud.empresa_id,
    userId,
    importacaoId: aud.importacao_id,
    evento: "linha_editada",
    descricao: `Linha ${linhaAuditoriaId} editada`,
  });

  return { erro: null, avisoTrilha };
}

// ============================================================================
// DELETAR UMA LINHA JÁ IMPORTADA (remove do destino + marca auditoria)
// ============================================================================

export async function deletarLinhaImportada(
  linhaAuditoriaId: string,
  userId: string,
  empresaId: string
): Promise<{ erro: string | null; avisoTrilha?: string }> {
  // 1) Busca auditoria — filtrada pela empresa ativa: se a linha for de outra
  // empresa, o filtro já devolve "não encontrada" (nunca chega a excluir).
  const { data: aud, error: errBusca } = await supabase
    .from("importacao_linhas")
    .select("destino_tabela, destino_id, importacao_id, empresa_id")
    .eq("id", linhaAuditoriaId)
    .eq("empresa_id", empresaId)
    .maybeSingle();

  if (errBusca) return { erro: errBusca.message };
  if (!aud || !aud.destino_id) return { erro: "Linha nao encontrada ou ja foi removida" };

  // 2) Deleta no destino real — trava dupla de empresa (defesa em
  // profundidade, mesmo já tendo confirmado a dona da linha de auditoria acima).
  const { data: deletado, error: errDel } = await supabase
    .from(aud.destino_tabela)
    .delete()
    .eq("id", aud.destino_id)
    .eq("empresa_id", empresaId)
    .select("id");

  if (errDel || !deletado || deletado.length === 0) {
    const motivo = errDel?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita(aud.destino_tabela, "delete (linha importada)", motivo);
    return { erro: motivo };
  }

  let avisoTrilha: string | undefined;

  // 3) Marca auditoria como revertida
  const { data: linhaMarcada, error: erroMarcar } = await supabase
    .from("importacao_linhas")
    .update({
      status: "revertida",
      mensagem: `Removida em ${new Date().toLocaleString("pt-BR")}`,
    })
    .eq("id", linhaAuditoriaId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (erroMarcar || !linhaMarcada || linhaMarcada.length === 0) {
    const motivo = erroMarcar?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacao_linhas", "update (marcar revertida)", motivo);
    avisoTrilha = motivo;
  }

  // 4) Recalcula totais da importação
  const { erro: erroRecalculo } = await recalcularTotaisImportacao(aud.importacao_id, empresaId);
  if (erroRecalculo) avisoTrilha = avisoTrilha ? `${avisoTrilha}; ${erroRecalculo}` : erroRecalculo;

  await registrarEventoTimeline({
    empresaId: aud.empresa_id,
    userId,
    importacaoId: aud.importacao_id,
    evento: "linha_excluida",
    descricao: `Linha ${linhaAuditoriaId} removida do destino`,
  });

  return { erro: null, avisoTrilha };
}

// ============================================================================
// RECALCULAR TOTAIS DE UMA IMPORTAÇÃO (após edição ou exclusão de linha)
// ============================================================================

async function recalcularTotaisImportacao(importacaoId: string, empresaId: string): Promise<{ erro?: string }> {
  const { data: linhasImp } = await supabase
    .from("importacao_linhas")
    .select("valor, status")
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId);

  const lista = linhasImp || [];
  const importadas = lista.filter((l: any) => l.status === "importada").length;
  const duplicadas = lista.filter((l: any) => l.status === "duplicada").length;
  const ignoradas = lista.filter((l: any) => l.status === "ignorada").length;
  const erro = lista.filter((l: any) => l.status === "erro").length;
  const valorTotal = lista
    .filter((l: any) => l.status === "importada")
    .reduce((s: number, l: any) => s + (Number(l.valor) || 0), 0);

  const { data, error: erroUpdate } = await supabase
    .from("importacoes")
    .update({
      linhas_importadas: importadas,
      linhas_duplicadas: duplicadas,
      linhas_ignoradas: ignoradas,
      linhas_erro: erro,
      valor_total_importado: valorTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (erroUpdate || !data || data.length === 0) {
    const motivo = erroUpdate?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacoes", "update (recalcular totais)", motivo);
    return { erro: motivo };
  }
  return {};
}

// ============================================================================
// ROLLBACK: desfaz uma importação (remove todas as linhas dos destinos)
// ============================================================================

export async function reverterImportacao(
  importacaoId: string,
  userId: string,
  empresaId: string
): Promise<{ removidas: number; erros: string[] }> {
  // Filtrado pela empresa ativa: linha de outra empresa nem entra na lista
  // do que será desfeito.
  const { data: linhas } = await supabase
    .from("importacao_linhas")
    .select("id, destino_tabela, destino_id, empresa_id, valor, status")
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId)
    .in("status", ["importada", "somada"]);

  const erros: string[] = [];
  let removidas = 0;

  const paraDeletar = (linhas || []).filter((l: any) => l.status === "importada" && l.destino_id);
  const paraSubtrair = (linhas || []).filter((l: any) => l.status === "somada" && l.destino_id);

  const porTabela = new Map<string, string[]>();
  paraDeletar.forEach((l: any) => {
    const arr = porTabela.get(l.destino_tabela) || [];
    arr.push(l.destino_id);
    porTabela.set(l.destino_tabela, arr);
  });

  for (const [tabela, ids] of porTabela.entries()) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { error, count } = await supabase
        .from(tabela)
        .delete({ count: "exact" })
        .in("id", chunk)
        .eq("empresa_id", empresaId);

      const qtdRemovida = count ?? 0;
      if (error || qtdRemovida < chunk.length) {
        const motivo = error?.message || `${chunk.length - qtdRemovida} de ${chunk.length} não foram removidos (RLS?)`;
        erros.push(`${tabela}: ${motivo}`);
        reportarFalhaEscrita(tabela, "delete (reverter importação)", motivo);
        removidas += qtdRemovida;
      } else {
        removidas += qtdRemovida;
      }
    }
  }

  // Linhas "somada": não existe registro próprio pra deletar — desfaz
  // subtraindo de volta o valor que foi somado no registro existente
  // (que pode viver em outra tabela, por isso não entrou no loop acima).
  for (const l of paraSubtrair) {
    const colValor = COLUNA_VALOR_DESTINO[l.destino_tabela as DestinoTabela];
    if (!colValor) {
      erros.push(`${l.destino_tabela}: sem coluna de valor conhecida para desfazer soma`);
      continue;
    }
    const { data: atual, error: errBusca } = await supabase
      .from(l.destino_tabela)
      .select(colValor)
      .eq("id", l.destino_id)
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (errBusca || !atual) {
      erros.push(`${l.destino_tabela}: registro ${l.destino_id} não encontrado pra desfazer soma`);
      continue;
    }
    const valorAtual = lerValorColunaDinamica(atual, colValor);
    if (valorAtual === null) {
      erros.push(`${l.destino_tabela}: coluna de valor "${colValor}" não veio como número — reversão da soma cancelada por segurança`);
      reportarFalhaEscrita(l.destino_tabela, "desfazer soma na reversão (leitura de valor atual)", `coluna ${colValor} ausente ou com tipo inesperado`);
      continue;
    }
    const novoValor = valorAtual - Number(l.valor || 0);
    const { data: subtraido, error: errUpdate } = await supabase.from(l.destino_tabela).update({ [colValor]: novoValor }).eq("id", l.destino_id).eq("empresa_id", empresaId).select("id");
    if (errUpdate || !subtraido || subtraido.length === 0) {
      const motivo = errUpdate?.message || "0 linhas afetadas (RLS?)";
      erros.push(`${l.destino_tabela}: ${motivo}`);
      reportarFalhaEscrita(l.destino_tabela, "update (desfazer soma na reversão)", motivo);
      continue;
    }
    removidas++;
  }

  // varredura:ok — 0 linhas é possível (nada importado/somado); erro checado abaixo
  const { error: erroStatusLinhas } = await supabase
    .from("importacao_linhas")
    .update({ status: "revertida" })
    .eq("importacao_id", importacaoId)
    .eq("empresa_id", empresaId)
    .in("status", ["importada", "somada"]);
  if (erroStatusLinhas) {
    reportarFalhaEscrita("importacao_linhas", "update (status revertida)", erroStatusLinhas.message);
    erros.push(`importacao_linhas: ${erroStatusLinhas.message}`);
  }

  const { data: impRevertida, error: erroStatusImportacao } = await supabase
    .from("importacoes")
    .update({
      status: "revertido",
      revertido_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId)
    .eq("empresa_id", empresaId)
    .select("id");
  if (erroStatusImportacao || !impRevertida?.length) {
    // Sem isto a importação ficava "concluída" na lista mesmo depois de desfeita.
    const motivo = erroStatusImportacao?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacoes", "update (status revertido)", motivo);
    erros.push(`importacoes: ${motivo}`);
  }

  await registrarEventoTimeline({
    empresaId,
    userId,
    importacaoId,
    evento: "revertida",
    descricao: `${removidas} lançamento(s) removidos do(s) destino(s)${erros.length > 0 ? `, ${erros.length} com falha` : ""}`,
    dados: { removidas, erros },
  });

  // Se algum destino falhou ao reverter, abre exceção — não deixa o usuário
  // achar que reverteu tudo quando sobrou lançamento pra trás.
  if (erros.length > 0) {
    await abrirExcecoes({
      empresaId,
      userId,
      importacaoId,
      itens: erros.map((msg, idx) => ({
        linhaNumero: idx + 1,
        tipo: "falha_reversao",
        motivo: msg,
      })),
    });
  }

  return { removidas, erros };
}

// ============================================================================
// ESTATÍSTICAS DO MÊS (Dashboard CFO)
// ============================================================================

export type StatsMes = {
  total_importado: number;
  docs_processados: number;
  docs_total: number;
  taxa_sucesso: number;
  duplicadas_evitadas: number;
  tempo_medio_seg: number;
  horas_economizadas: number;
};

export async function carregarStatsMes(empresaId: string): Promise<StatsMes> {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

  const { data } = await supabase
    .from("importacoes")
    .select("status, valor_total_importado, linhas_importadas, linhas_duplicadas, tempo_processamento_ms")
    .eq("empresa_id", empresaId)
    .gte("created_at", inicioMes);

  const lista = data || [];
  const total = lista.length;
  const sucesso = lista.filter((i: any) => i.status === "concluido" || i.status === "parcialmente").length;
  const totalImportado = lista.reduce((s: number, i: any) => s + (Number(i.valor_total_importado) || 0), 0);
  const totalLinhas = lista.reduce((s: number, i: any) => s + (Number(i.linhas_importadas) || 0), 0);
  const duplicadas = lista.reduce((s: number, i: any) => s + (Number(i.linhas_duplicadas) || 0), 0);
  const tempoTotal = lista.reduce((s: number, i: any) => s + (Number(i.tempo_processamento_ms) || 0), 0);

  return {
    total_importado: totalImportado,
    docs_processados: sucesso,
    docs_total: total,
    taxa_sucesso: total > 0 ? Math.round((sucesso / total) * 100) : 0,
    duplicadas_evitadas: duplicadas,
    tempo_medio_seg: total > 0 ? Math.round(tempoTotal / total / 1000) : 0,
    horas_economizadas: Math.round((totalLinhas * 30) / 3600),
  };
}

// ============================================================================
// TEMPLATES
// ============================================================================

export async function carregarTemplates(empresaId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_templates")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("ultimo_uso", { ascending: false, nullsFirst: false });
  return data || [];
}

export async function salvarTemplate(params: {
  userId: string;
  empresaId: string | null;
  nome: string;
  tipoArquivo: string;
  destinoPadrao: string;
  mapeamento: any;
}): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("importacao_templates").insert({
    user_id: params.userId,
    empresa_id: params.empresaId,
    nome: params.nome,
    tipo_arquivo: params.tipoArquivo,
    destino_padrao: params.destinoPadrao,
    mapeamento: params.mapeamento,
    ultimo_uso: new Date().toISOString(),
    vezes_usado: 1,
  }).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("importacao_templates", "insert", motivo);
    return { erro: motivo };
  }
  return {};
}
// ============================================================================
// B3 item 4 — lançar a parte "custo" de uma nota de COMPRA em Custos Variáveis
// (é o que entra no DRE do mês). Só roda depois de o humano responder "sim" na
// conferência. Contas a pagar NÃO entra no DRE, então isto não conta 2 vezes.
// Mesmo builder do Importar (mesma validação de campos obrigatórios).
// ============================================================================
export async function lancarCustoVariavelDaNota(
  userId: string,
  empresaId: string,
  dados: { data: string; valor: number; descricao: string; categoria: string; documento?: string },
): Promise<{ id?: string; erro?: string }> {
  const build = BUILDERS.custos_variaveis({ data: dados.data, valor: dados.valor, descricao: dados.descricao, categoria: dados.categoria, documento: dados.documento, raw: {} }, userId, empresaId);
  if ("erro" in build) return { erro: build.erro };
  const { data, error } = await supabase.from("custos_variaveis").insert(build.payload).select("id").single();
  if (error || !data) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("custos_variaveis", "insert (custo da nota importada)", motivo);
    return { erro: motivo };
  }
  return { id: data.id };
}
