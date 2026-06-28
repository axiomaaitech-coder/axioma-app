// 🦅 AXIOMA AI.TECH - Helpers de Importação
// Hash SHA-256, deduplicação, upload Storage, gravação nos destinos e rollback

import CryptoJS from "crypto-js";
import { createBrowserClient } from "@supabase/ssr";
import type { DestinoTabela, LinhaImportada, ResultadoParse } from "./importarParsers";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================================================
// MAPEAMENTO DE COLUNAS POR DESTINO
// Se algum nome de coluna divergir, ajustar AQUI (linha única).
// ============================================================================

type ColunasDestino = {
  data: string;
  valor: string;
  descricao: string;
  categoria?: string;
  tipo?: string; // pra fluxo_caixa
  extras?: Record<string, any>;
};

const MAPA_DESTINOS: Record<DestinoTabela, ColunasDestino> = {
  fluxo_caixa: { data: "data", valor: "valor", descricao: "descricao", categoria: "categoria", tipo: "tipo" },
  receitas: { data: "data", valor: "valor", descricao: "descricao", categoria: "categoria" },
  custos_fixos: { data: "data", valor: "valor", descricao: "descricao", categoria: "categoria" },
  custos_variaveis: { data: "data", valor: "valor", descricao: "descricao", categoria: "categoria" },
  contas_pagar: { data: "vencimento", valor: "valor", descricao: "descricao", categoria: "categoria" },
  contas_receber: { data: "vencimento", valor: "valor", descricao: "descricao", categoria: "categoria" },
  fornecedores: { data: "created_at", valor: "valor", descricao: "razao_social" },
  endividamento: { data: "data_contratacao", valor: "valor", descricao: "descricao", categoria: "tipo" },
};

// ============================================================================
// HASH
// ============================================================================

export async function hashArquivo(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  // Converte pra WordArray do crypto-js
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
  // Busca hashes de linhas já importadas pro mesmo destino
  const hashesNovos = linhas.map(hashLinha);

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

  if (error) throw new Error(`Erro ao criar importação: ${error.message}`);
  return data.id;
}

// ============================================================================
// GRAVAR LINHAS NOS DESTINOS REAIS + importacao_linhas (auditoria)
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
  const cols = MAPA_DESTINOS[destino];

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

    // 1) Linha desmarcada → ignorada
    if (!selecionadas[i]) {
      resultado.ignoradas++;
      auditoriaRows.push({
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
        hash_linha: hashLinha(linha),
        status: "ignorada",
      });
      continue;
    }

    // 2) Linha duplicada → marca, não grava
    if (duplicadas[i]) {
      resultado.duplicadas++;
      auditoriaRows.push({
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
        hash_linha: hashLinha(linha),
        status: "duplicada",
        mensagem: "Lançamento já existia no sistema",
      });
      continue;
    }

    // 3) Validação mínima
    if (!linha.data || linha.valor === undefined || linha.valor === null) {
      resultado.erro++;
      auditoriaRows.push({
        importacao_id: importacaoId,
        user_id: userId,
        empresa_id: empresaId,
        linha_numero: numLinha,
        dados_brutos: linha.raw,
        destino_tabela: destino,
        data_lancamento: linha.data,
        valor: linha.valor,
        descricao: linha.descricao,
        hash_linha: hashLinha(linha),
        status: "erro",
        mensagem: "Data ou valor ausente",
      });
      continue;
    }

    // 4) Monta payload pro destino
    const payload: any = {
      user_id: userId,
      empresa_id: empresaId,
      [cols.data]: linha.data,
      [cols.valor]: linha.valor,
      [cols.descricao]: linha.descricao || "Lançamento importado",
    };
    if (cols.categoria && linha.categoria) {
      payload[cols.categoria] = linha.categoria;
    }
    if (cols.tipo && linha.tipo) {
      payload[cols.tipo] = linha.tipo;
    }

    // 5) Insere no destino
    const { data: inserido, error } = await supabase
      .from(destino)
      .insert(payload)
      .select("id")
      .single();

    if (error || !inserido) {
      resultado.erro++;
      const msg = error?.message || "Erro desconhecido";
      resultado.mensagens_erro.push(`Linha ${numLinha}: ${msg}`);
      auditoriaRows.push({
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
        hash_linha: hashLinha(linha),
        status: "erro",
        mensagem: msg,
      });
      continue;
    }

    // 6) Sucesso: grava auditoria
    resultado.importadas++;
    resultado.valor_total += linha.valor;
    auditoriaRows.push({
      importacao_id: importacaoId,
      user_id: userId,
      empresa_id: empresaId,
      linha_numero: numLinha,
      dados_brutos: linha.raw,
      destino_tabela: destino,
      destino_id: inserido.id,
      data_lancamento: linha.data,
      valor: linha.valor,
      descricao: linha.descricao,
      categoria: linha.categoria,
      hash_linha: hashLinha(linha),
      status: "importada",
    });
  }

  // Insere auditoria em lote (chunks de 500 pra não estourar limites)
  for (let i = 0; i < auditoriaRows.length; i += 500) {
    const chunk = auditoriaRows.slice(i, i + 500);
    await supabase.from("importacao_linhas").insert(chunk);
  }

  // Atualiza cabeçalho com totais e status
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

export async function reverterImportacao(importacaoId: string, userId: string): Promise<{
  removidas: number;
  erros: string[];
}> {
  // Busca todas as linhas importadas com sucesso
  const { data: linhas } = await supabase
    .from("importacao_linhas")
    .select("id, destino_tabela, destino_id")
    .eq("importacao_id", importacaoId)
    .eq("user_id", userId)
    .eq("status", "importada");

  const erros: string[] = [];
  let removidas = 0;

  // Agrupa por destino_tabela pra deletar em lote
  const porTabela = new Map<string, string[]>();
  (linhas || []).forEach((l: any) => {
    if (!l.destino_id) return;
    const arr = porTabela.get(l.destino_tabela) || [];
    arr.push(l.destino_id);
    porTabela.set(l.destino_tabela, arr);
  });

  for (const [tabela, ids] of porTabela.entries()) {
    // Deleta em chunks
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

  // Marca linhas como revertidas
  await supabase
    .from("importacao_linhas")
    .update({ status: "revertida" })
    .eq("importacao_id", importacaoId)
    .eq("user_id", userId)
    .eq("status", "importada");

  // Atualiza cabeçalho
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
    horas_economizadas: Math.round((totalLinhas * 30) / 3600), // 30s por linha manual
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