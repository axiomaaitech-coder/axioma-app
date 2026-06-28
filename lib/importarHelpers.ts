// 🦅 AXIOMA AI.TECH - Helpers de Importação
// Versão profissional: builders específicos por tabela, sem retry, sem omissão silenciosa.
// Cada destino tem um builder que monta o payload EXATO pra aquela tabela.

import CryptoJS from "crypto-js";
import { createBrowserClient } from "@supabase/ssr";
import type { DestinoTabela, LinhaImportada, ResultadoParse } from "./importarParsers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  // ENDIVIDAMENTO
  // Schema (criado pelo SQL de schema-fix): descricao*, valor_original*,
  //              credor, valor_atual, taxa_juros, parcelas, data_contratacao,
  //              status, categoria, user_id, empresa_id
  // -------------------------------------------------------------------------
  endividamento: (linha, userId, empresaId) => {
    if (linha.valor === undefined || linha.valor === null || isNaN(linha.valor))
      return { erro: "Valor original obrigatorio" };
    return {
      payload: {
        user_id: userId,
        empresa_id: empresaId,
        descricao: linha.descricao || "Endividamento importado",
        credor: linha.descricao || null,
        valor_original: linha.valor,
        valor_atual: linha.valor,
        data_contratacao: linha.data || null,
        status: "ativo",
        categoria: linha.categoria || null,
      },
    };
  },
};

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
    .eq("user_id", userId)
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
  destino: DestinoTabela
): Promise<boolean[]> {
  const hashesNovos = linhas.map(hashLinha);
  if (hashesNovos.length === 0) return [];

  const { data: linhasExistentes } = await supabase
    .from("importacao_linhas")
    .select("hash_linha")
    .eq("user_id", userId)
    .eq("destino_tabela", destino)
    .eq("status", "importada")
    .in("hash_linha", hashesNovos);

  const setExistente = new Set((linhasExistentes || []).map((l: any) => l.hash_linha));
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

export async function gerarUrlAssinada(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 3600);
  return data?.signedUrl || null;
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
  return data.id;
}

// ============================================================================
// GRAVAR LINHAS NOS DESTINOS REAIS + importacao_linhas (auditoria)
// SEM RETRY, SEM REMOÇÃO SILENCIOSA. Cada erro é registrado com clareza.
// ============================================================================

export type ResultadoGravacao = {
  importadas: number;
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
  destino: DestinoTabela;
}): Promise<ResultadoGravacao> {
  const { userId, empresaId, importacaoId, linhas, selecionadas, duplicadas, destino } = params;

  const builder = BUILDERS[destino];
  if (!builder) {
    throw new Error(`Destino nao suportado: ${destino}`);
  }

  const resultado: ResultadoGravacao = {
    importadas: 0,
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

    // 3) Montar payload via builder específico do destino
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

    // 4) Inserir no destino (uma tentativa, sem retry)
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

  return resultado;
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
    .select("id, destino_tabela, destino_id")
    .eq("importacao_id", importacaoId)
    .eq("user_id", userId)
    .eq("status", "importada");

  const erros: string[] = [];
  let removidas = 0;

  const porTabela = new Map<string, string[]>();
  (linhas || []).forEach((l: any) => {
    if (!l.destino_id) return;
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
        .eq("user_id", userId);

      if (error) {
        erros.push(`${tabela}: ${error.message}`);
      } else {
        removidas += count || chunk.length;
      }
    }
  }

  await supabase
    .from("importacao_linhas")
    .update({ status: "revertida" })
    .eq("importacao_id", importacaoId)
    .eq("user_id", userId)
    .eq("status", "importada");

  await supabase
    .from("importacoes")
    .update({
      status: "revertido",
      revertido_em: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", importacaoId)
    .eq("user_id", userId);

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
    .eq("user_id", userId)
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
    .eq("user_id", userId)
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