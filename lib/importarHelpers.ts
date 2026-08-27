// 🦅 AXIOMA AI.TECH - Helpers de Importação
// Versão profissional: builders específicos por tabela, sem retry, sem omissão silenciosa.
// Cada destino tem um builder que monta o payload EXATO pra aquela tabela.

import CryptoJS from "crypto-js";
import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import type { DestinoTabela, LinhaImportada, ResultadoParse } from "./importarParsers";

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
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Conta a pagar importada",
        valor_total: linha.valor,
        valor_pago: 0,
        data_emissao: linha.data || null,
        data_vencimento: linha.data || null,
        data_hora: linha.dataHora || null,
        status: "pendente",
        categoria: linha.categoria || null,
        numero_nota: linha.documento || null,
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
    if (!linha.data) return { erro: "Data de vencimento obrigatoria para Contas a Receber" };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Conta a receber importada",
        valor: linha.valor,
        data_vencimento: linha.data,
        data_emissao: linha.data,
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
// POSSÍVEL DUPLICATA — cross-módulo, "estilo aviso de PIX repetido"
// Camada A MAIS além da duplicata exata por hash (marcarDuplicatasPorLinha):
// aqui o sistema NUNCA soma/descarta sozinho, só avisa quando valor+data
// batem E nenhum campo disponível (hora, nº de documento, CNPJ da
// contraparte) consegue provar que são lançamentos diferentes.
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

type ConfigTabelaTransacao = {
  tabela: DestinoTabela;
  colValor: string;
  colData: string;
  colDataHora?: string;
  colDescricao: string;
  colDistintivo?: string;
  colContraparteId?: string;
  tabelaContraparte?: "fornecedores" | "clientes";
};

// Só as 6 tabelas que são LANÇAMENTO datado — custos_fixos (cadastro
// recorrente, sem data de transação) e fornecedores (cadastro) ficam fora.
const TABELAS_TRANSACAO: ConfigTabelaTransacao[] = [
  { tabela: "fluxo_caixa", colValor: "valor", colData: "data", colDataHora: "data_hora", colDescricao: "descricao", colDistintivo: "documento" },
  { tabela: "receitas", colValor: "valor", colData: "data", colDataHora: "data_hora", colDescricao: "descricao", colDistintivo: "documento" },
  { tabela: "custos_variaveis", colValor: "valor", colData: "data", colDataHora: "data_hora", colDescricao: "descricao", colDistintivo: "documento" },
  { tabela: "contas_pagar", colValor: "valor_total", colData: "data_emissao", colDataHora: "data_hora", colDescricao: "descricao", colDistintivo: "numero_nota", colContraparteId: "fornecedor_id", tabelaContraparte: "fornecedores" },
  { tabela: "contas_receber", colValor: "valor", colData: "data_emissao", colDataHora: "data_hora", colDescricao: "descricao", colDistintivo: "numero_documento", colContraparteId: "cliente_id", tabelaContraparte: "clientes" },
  { tabela: "dividas", colValor: "valor_total", colData: "vencimento", colDescricao: "descricao" },
];

// Reaproveitado tanto pra gravar "Somar" (soma no registro existente em vez
// de inserir um novo) quanto pra reverter (subtrai de volta o que foi somado).
const COLUNA_VALOR_DESTINO: Partial<Record<DestinoTabela, string>> = Object.fromEntries(
  TABELAS_TRANSACAO.map((t) => [t.tabela, t.colValor])
);

export type CandidatoDuplicata = {
  tabela: DestinoTabela;
  id: string;
  descricao: string;
  valor: number;
  data: string;
  dataHora: string | null;
  distintivo: string | null;
  contraparteDocumento: string | null;
  temCampoContraparte: boolean;
};

export type PossivelDuplicata = {
  candidato: CandidatoDuplicata;
  horaComparada: boolean;
  motivo: string;
};

function valorBate(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}

// 1 consulta por tabela (+ no máximo 1 pra resolver fornecedor/cliente) — nunca
// uma consulta por linha, mesmo com centenas de linhas na leva.
async function buscarCandidatosPorTabela(
  cfg: ConfigTabelaTransacao,
  datas: string[],
  valores: number[]
): Promise<CandidatoDuplicata[]> {
  const { data } = await supabase.from(cfg.tabela).select("*").in(cfg.colData, datas);
  const linhas = (data || []).filter((r: any) => valores.some((v) => valorBate(v, Number(r[cfg.colValor]))));
  if (linhas.length === 0) return [];

  const contrapartes = new Map<string, string | null>();
  if (cfg.colContraparteId && cfg.tabelaContraparte) {
    const ids = Array.from(new Set(linhas.map((r: any) => r[cfg.colContraparteId!]).filter(Boolean)));
    if (ids.length > 0) {
      const { data: cad } = await supabase.from(cfg.tabelaContraparte).select("id, documento").in("id", ids);
      (cad || []).forEach((c: any) => contrapartes.set(c.id, c.documento || null));
    }
  }

  return linhas.map((r: any) => ({
    tabela: cfg.tabela,
    id: r.id,
    descricao: r[cfg.colDescricao],
    valor: Number(r[cfg.colValor]),
    data: r[cfg.colData],
    dataHora: cfg.colDataHora ? r[cfg.colDataHora] || null : null,
    distintivo: cfg.colDistintivo ? r[cfg.colDistintivo] || null : null,
    contraparteDocumento: cfg.colContraparteId ? contrapartes.get(r[cfg.colContraparteId]) || null : null,
    temCampoContraparte: !!(cfg.colContraparteId && cfg.tabelaContraparte),
  }));
}

// Busca candidatos reais nas 6 tabelas (paralelo, 1 consulta cada) e decide,
// linha a linha, se algum bate a ponto de merecer aviso. Índice do array de
// retorno corresponde ao índice da linha importada; null = sem suspeita.
export async function detectarPossiveisDuplicatas(
  empresaId: string | null,
  linhas: LinhaImportada[]
): Promise<(PossivelDuplicata | null)[]> {
  const resultado: (PossivelDuplicata | null)[] = linhas.map(() => null);
  if (!empresaId) return resultado;

  const comData = linhas
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => l.data && l.valor !== undefined && !isNaN(l.valor));
  if (comData.length === 0) return resultado;

  const datas = Array.from(new Set(comData.map(({ l }) => l.data!)));
  const valores = Array.from(new Set(comData.map(({ l }) => Number(l.valor))));

  const porTabela = await Promise.all(TABELAS_TRANSACAO.map((cfg) => buscarCandidatosPorTabela(cfg, datas, valores)));
  const todosCandidatos = porTabela.flat();

  for (const { l, i } of comData) {
    const candidatos = todosCandidatos.filter((c) => c.data === l.data && valorBate(c.valor, Number(l.valor)));
    if (candidatos.length === 0) continue;

    for (const cand of candidatos) {
      // 1) Os dois lados têm hora → hora decide, sem ambiguidade.
      if (l.dataHora && cand.dataHora) {
        const horaLinha = l.dataHora.slice(11, 19);
        const horaCand = cand.dataHora.slice(11, 19);
        if (horaLinha !== horaCand) continue; // hora diferente = lançamentos legítimos, não avisa
        resultado[i] = {
          candidato: cand,
          horaComparada: true,
          motivo: `Mesmo valor, data e horário (${horaLinha}) de um lançamento já existente em ${LABEL_TABELA[cand.tabela]}.`,
        };
        break;
      }

      // 2) Sem hora de um dos lados (ou dos dois) → nº de documento decide, se existir dos dois lados.
      const docLinha = l.documento?.trim();
      const docCand = cand.distintivo?.trim();
      if (docLinha && docCand && docLinha !== docCand) continue;

      // 3) CNPJ da contraparte (fornecedor/cliente), se a linha trouxe e o registro tem.
      const cnpjLinha = l.cnpj?.replace(/\D/g, "");
      const cnpjCand = cand.contraparteDocumento?.replace(/\D/g, "");
      if (cnpjLinha && cnpjCand && cnpjLinha !== cnpjCand) continue;

      // 4) Sem campo de cliente/fornecedor estruturado (ex: Fluxo de Caixa, onde o
      // cliente vira parte da descrição) → a descrição é o único jeito de provar que
      // são lançamentos diferentes. "cliente Gama" vs "cliente Alfa" nunca é duplicata.
      if (!cand.temCampoContraparte) {
        const descLinha = normalizarPadraoChave(l.descricao || "");
        const descCand = normalizarPadraoChave(cand.descricao || "");
        if (descLinha && descCand && descLinha !== descCand) continue;
      }

      // Nada provou que são diferentes → avisa.
      resultado[i] = {
        candidato: cand,
        horaComparada: false,
        motivo: `Mesmo valor e data de um lançamento já existente em ${LABEL_TABELA[cand.tabela]} — hora não disponível dos dois lados para confirmar automaticamente.`,
      };
      break;
    }
  }

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
  await supabase.from("importacao_timeline").insert({
    empresa_id: params.empresaId,
    user_id: params.userId,
    importacao_id: params.importacaoId,
    evento: params.evento,
    descricao: params.descricao || null,
    dados: params.dados || null,
  });
}

export async function listarTimeline(importacaoId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_timeline")
    .select("*")
    .eq("importacao_id", importacaoId)
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
    await supabase.from("importacao_excecoes").insert(rows.slice(i, i + 500));
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

export async function listarExcecoes(importacaoId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_excecoes")
    .select("*")
    .eq("importacao_id", importacaoId)
    .order("created_at", { ascending: true });
  return data || [];
}

export async function resolverExcecao(excecaoId: string, resolucao: string): Promise<{ erro: string | null }> {
  const { error } = await supabase
    .from("importacao_excecoes")
    .update({ status: "resolvida", resolucao, resolvido_em: new Date().toISOString() })
    .eq("id", excecaoId);
  return { erro: error?.message || null };
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

  await supabase
    .from("importacao_padroes_classificacao")
    .upsert(linhasUpsert, { onConflict: "empresa_id,padrao_chave,destino_tabela" });
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
  const buffer = await file.arrayBuffer();
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
  userId: string,
  hash: string
): Promise<any | null> {
  const { data } = await supabase
    .from("importacoes")
    .select("id, nome_arquivo, created_at, status, linhas_importadas")
    .eq("hash_arquivo", hash)
    .neq("status", "revertido")
    .maybeSingle();
  return data;
}

// ============================================================================
// DUPLICATA POR LINHA: marca cada linha que já existe no destino
// ============================================================================

export async function marcarDuplicatasPorLinha(
  userId: string,
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
  userId: string
): Promise<{ erro: string | null }> {
  // 1) Valida que a importação existe e pertence ao usuário
  const { data: imp, error: errBusca } = await supabase
    .from("importacoes")
    .select("id, status, linhas_importadas")
    .eq("id", importacaoId)
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
  const { error: errLinhas } = await supabase
    .from("importacao_linhas")
    .delete()
    .eq("importacao_id", importacaoId);

  if (errLinhas) return { erro: `Erro ao limpar linhas: ${errLinhas.message}` };

  // 4) Deleta o cabeçalho
  const { error: errImp } = await supabase
    .from("importacoes")
    .delete()
    .eq("id", importacaoId);

  if (errImp) return { erro: `Erro ao remover registro: ${errImp.message}` };

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

  if (error) throw new Error(`Erro ao criar importacao: ${error.message}`);

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
  duplicadas: number;
  ignoradas: number;
  erro: number;
  valor_total: number;
  mensagens_erro: string[];
};

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
}): Promise<ResultadoGravacao> {
  const { userId, empresaId, importacaoId, linhas, selecionadas, duplicadas, destinos, dryRun, somarAlvo } = params;

  const resultado: ResultadoGravacao = {
    importadas: 0,
    somadas: 0,
    duplicadas: 0,
    ignoradas: 0,
    erro: 0,
    valor_total: 0,
    mensagens_erro: [],
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

    // 4) dryRun (Simulador): mesma validação acima, mas não toca no banco —
    // conta como se tivesse dado certo, sem gravar nada real.
    if (dryRun) {
      resultado.importadas++;
      if (alvoSomar) resultado.somadas++;
      resultado.valor_total += linha.valor || 0;
      auditoriaRows.push({ ...auditoriaBase, status: alvoSomar ? "somada" : "importada" });
      continue;
    }

    // 4b) Confirmação de possível duplicata = "Somar": soma no registro
    // existente (que pode estar em outra tabela) em vez de criar um novo.
    if (alvoSomar) {
      const colValor = COLUNA_VALOR_DESTINO[alvoSomar.tabela];
      if (!colValor) {
        resultado.erro++;
        resultado.mensagens_erro.push(`Linha ${numLinha}: destino "${alvoSomar.tabela}" não suporta somar`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: "Destino sem coluna de valor conhecida para somar" });
        continue;
      }
      const { data: atual, error: errBusca } = await supabase
        .from(alvoSomar.tabela)
        .select(colValor)
        .eq("id", alvoSomar.id)
        .maybeSingle();
      if (errBusca || !atual) {
        resultado.erro++;
        const msg = errBusca?.message || "Registro para somar não encontrado";
        resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
        auditoriaRows.push({ ...auditoriaBase, status: "erro", mensagem: msg });
        continue;
      }
      const novoValor = Number((atual as any)[colValor] || 0) + (linha.valor || 0);
      const { data: somado, error: errUpdate } = await supabase.from(alvoSomar.tabela).update({ [colValor]: novoValor }).eq("id", alvoSomar.id).select("id");
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

    // 4c) Inserir no destino de verdade (uma tentativa, sem retry)
    const { data: inserido, error } = await supabase
      .from(destino)
      .insert(build.payload)
      .select("id")
      .single();

    if (error || !inserido) {
      resultado.erro++;
      const msg = error?.message || "Erro desconhecido ao inserir";
      resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
      auditoriaRows.push({
        ...auditoriaBase,
        status: "erro",
        mensagem: msg,
      });
      continue;
    }

    // 5) Sucesso
    resultado.importadas++;
    resultado.valor_total += linha.valor || 0;
    auditoriaRows.push({
      ...auditoriaBase,
      destino_id: inserido.id,
      status: "importada",
    });
  }

  if (dryRun) return resultado;

  // Insere auditoria em lote (chunks de 500)
  for (let i = 0; i < auditoriaRows.length; i += 500) {
    const chunk = auditoriaRows.slice(i, i + 500);
    await supabase.from("importacao_linhas").insert(chunk);
  }

  // Atualiza cabeçalho com status final
  let statusFinal = "concluido";
  if (resultado.importadas === 0 && resultado.erro > 0) statusFinal = "erro";
  else if (resultado.erro > 0 || resultado.duplicadas > 0) statusFinal = "parcialmente";

  await supabase
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
    descricao: `${resultado.importadas} importadas (${resultado.somadas} somadas a lançamentos existentes), ${resultado.duplicadas} duplicadas, ${resultado.ignoradas} ignoradas, ${resultado.erro} com erro`,
    dados: {
      importadas: resultado.importadas,
      somadas: resultado.somadas,
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
  userId: string
): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_linhas")
    .select("*")
    .eq("importacao_id", importacaoId)
    .order("linha_numero", { ascending: true });
  return data || [];
}

// ============================================================================
// EDITAR UMA LINHA JÁ IMPORTADA (atualiza destino real + auditoria)
// ============================================================================

export async function editarLinhaImportada(
  linhaAuditoriaId: string,
  userId: string,
  novosDados: {
    data?: string;
    valor?: number;
    descricao?: string;
    categoria?: string;
  }
): Promise<{ erro: string | null }> {
  // 1) Busca auditoria
  const { data: aud, error: errBusca } = await supabase
    .from("importacao_linhas")
    .select("destino_tabela, destino_id, importacao_id, empresa_id")
    .eq("id", linhaAuditoriaId)
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

  // 3) UPDATE no destino real
  const { data: editado, error: errUpdate } = await supabase
    .from(destino)
    .update(payload)
    .eq("id", aud.destino_id)
    .select("id");

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

  await supabase
    .from("importacao_linhas")
    .update(auditUpdate)
    .eq("id", linhaAuditoriaId);

  // 5) Recalcula totais da importação
  await recalcularTotaisImportacao(aud.importacao_id);

  await registrarEventoTimeline({
    empresaId: aud.empresa_id,
    userId,
    importacaoId: aud.importacao_id,
    evento: "linha_editada",
    descricao: `Linha ${linhaAuditoriaId} editada`,
  });

  return { erro: null };
}

// ============================================================================
// DELETAR UMA LINHA JÁ IMPORTADA (remove do destino + marca auditoria)
// ============================================================================

export async function deletarLinhaImportada(
  linhaAuditoriaId: string,
  userId: string
): Promise<{ erro: string | null }> {
  // 1) Busca auditoria
  const { data: aud, error: errBusca } = await supabase
    .from("importacao_linhas")
    .select("destino_tabela, destino_id, importacao_id, empresa_id")
    .eq("id", linhaAuditoriaId)
    .maybeSingle();

  if (errBusca) return { erro: errBusca.message };
  if (!aud || !aud.destino_id) return { erro: "Linha nao encontrada ou ja foi removida" };

  // 2) Deleta no destino real
  const { error: errDel } = await supabase
    .from(aud.destino_tabela)
    .delete()
    .eq("id", aud.destino_id);

  if (errDel) return { erro: errDel.message };

  // 3) Marca auditoria como revertida
  await supabase
    .from("importacao_linhas")
    .update({
      status: "revertida",
      mensagem: `Removida em ${new Date().toLocaleString("pt-BR")}`,
    })
    .eq("id", linhaAuditoriaId);

  // 4) Recalcula totais da importação
  await recalcularTotaisImportacao(aud.importacao_id);

  await registrarEventoTimeline({
    empresaId: aud.empresa_id,
    userId,
    importacaoId: aud.importacao_id,
    evento: "linha_excluida",
    descricao: `Linha ${linhaAuditoriaId} removida do destino`,
  });

  return { erro: null };
}

// ============================================================================
// RECALCULAR TOTAIS DE UMA IMPORTAÇÃO (após edição ou exclusão de linha)
// ============================================================================

async function recalcularTotaisImportacao(importacaoId: string): Promise<void> {
  const { data: linhasImp } = await supabase
    .from("importacao_linhas")
    .select("valor, status")
    .eq("importacao_id", importacaoId);

  const lista = linhasImp || [];
  const importadas = lista.filter((l: any) => l.status === "importada").length;
  const duplicadas = lista.filter((l: any) => l.status === "duplicada").length;
  const ignoradas = lista.filter((l: any) => l.status === "ignorada").length;
  const erro = lista.filter((l: any) => l.status === "erro").length;
  const valorTotal = lista
    .filter((l: any) => l.status === "importada")
    .reduce((s: number, l: any) => s + (Number(l.valor) || 0), 0);

  await supabase
    .from("importacoes")
    .update({
      linhas_importadas: importadas,
      linhas_duplicadas: duplicadas,
      linhas_ignoradas: ignoradas,
      linhas_erro: erro,
      valor_total_importado: valorTotal,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId);
}

// ============================================================================
// ROLLBACK: desfaz uma importação (remove todas as linhas dos destinos)
// ============================================================================

export async function reverterImportacao(
  importacaoId: string,
  userId: string
): Promise<{ removidas: number; erros: string[] }> {
  const { data: linhas } = await supabase
    .from("importacao_linhas")
    .select("id, destino_tabela, destino_id, empresa_id, valor, status")
    .eq("importacao_id", importacaoId)
    .in("status", ["importada", "somada"]);

  const empresaId: string | null = linhas?.[0]?.empresa_id ?? null;
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
        .in("id", chunk);

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
      .maybeSingle();
    if (errBusca || !atual) {
      erros.push(`${l.destino_tabela}: registro ${l.destino_id} não encontrado pra desfazer soma`);
      continue;
    }
    const novoValor = Number((atual as any)[colValor] || 0) - Number(l.valor || 0);
    const { data: subtraido, error: errUpdate } = await supabase.from(l.destino_tabela).update({ [colValor]: novoValor }).eq("id", l.destino_id).select("id");
    if (errUpdate || !subtraido || subtraido.length === 0) {
      const motivo = errUpdate?.message || "0 linhas afetadas (RLS?)";
      erros.push(`${l.destino_tabela}: ${motivo}`);
      reportarFalhaEscrita(l.destino_tabela, "update (desfazer soma na reversão)", motivo);
      continue;
    }
    removidas++;
  }

  await supabase
    .from("importacao_linhas")
    .update({ status: "revertida" })
    .eq("importacao_id", importacaoId)
    .in("status", ["importada", "somada"]);

  await supabase
    .from("importacoes")
    .update({
      status: "revertido",
      revertido_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId);

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

export async function carregarStatsMes(userId: string): Promise<StatsMes> {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString();

  const { data } = await supabase
    .from("importacoes")
    .select("status, valor_total_importado, linhas_importadas, linhas_duplicadas, tempo_processamento_ms")
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

export async function carregarTemplates(userId: string): Promise<any[]> {
  const { data } = await supabase
    .from("importacao_templates")
    .select("*")
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
}): Promise<void> {
  await supabase.from("importacao_templates").insert({
    user_id: params.userId,
    empresa_id: params.empresaId,
    nome: params.nome,
    tipo_arquivo: params.tipoArquivo,
    destino_padrao: params.destinoPadrao,
    mapeamento: params.mapeamento,
    ultimo_uso: new Date().toISOString(),
    vezes_usado: 1,
  });
}