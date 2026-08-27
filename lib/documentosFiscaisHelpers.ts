// AXIOMA — Central de Documentos Fiscais (MEI Imposto de Renda, Fase 1).
// Metadados na tabela documentos_fiscais; arquivo real via
// lib/documentoStorageAdapter.ts (bucket privado + signed URL).

import { createBrowserClient } from "@supabase/ssr";
import * as Sentry from "@sentry/nextjs";
import { comprimirImagem } from "./imagemHelpers";
import { uploadArquivoStorage, gerarUrlAssinada, removerArquivoStorage } from "./documentoStorageAdapter";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// RLS pode bloquear update/delete e devolver 0 linhas SEM error do Postgres —
// .select("id") é o que permite enxergar essa falha silenciosa.
function reportarFalhaEscrita(tabela: string, operacao: string, motivo: string) {
  Sentry.captureException(new Error(`Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo } });
}

export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB, mesmo teto do plano aprovado

export type TipoDocumentoFiscal = "comprovante_despesa" | "recibo" | "informe_rendimento" | "nota_fiscal" | "das_pago" | "outro";

export const TIPOS_DOCUMENTO_FISCAL: TipoDocumentoFiscal[] = [
  "comprovante_despesa", "recibo", "informe_rendimento", "nota_fiscal", "das_pago", "outro",
];

// Documentos que o IRPF do MEI costuma pedir — base do checklist inteligente.
// "outro" fica fora de propósito (não é um item que o checklist cobra).
export const TIPOS_ESPERADOS_IRPF: TipoDocumentoFiscal[] = [
  "informe_rendimento", "comprovante_despesa", "recibo", "das_pago",
];

export type DocumentoFiscal = {
  id: string;
  empresa_id: string;
  user_id: string | null;
  ano: number;
  tipo: TipoDocumentoFiscal;
  descricao: string | null;
  nome_arquivo: string;
  path_storage: string;
  tamanho_bytes: number;
  created_at: string;
};

export async function listarDocumentosFiscais(): Promise<DocumentoFiscal[]> {
  const { data } = await supabase
    .from("documentos_fiscais")
    .select("*")
    .order("ano", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  return (data as DocumentoFiscal[]) || [];
}

export async function uploadDocumentoFiscal(params: {
  file: File;
  empresaId: string;
  userId: string;
  ano: number;
  tipo: TipoDocumentoFiscal;
  descricao?: string;
}): Promise<{ erro?: "tipo_invalido" | "tamanho_excedido" | string }> {
  let arquivo: File | Blob = params.file;

  if (params.file.type.startsWith("image/")) {
    arquivo = await comprimirImagem(params.file);
  } else if (params.file.type !== "application/pdf") {
    return { erro: "tipo_invalido" };
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) return { erro: "tamanho_excedido" };

  const nomeArquivo = params.file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${params.empresaId}/${params.ano}/${Date.now()}-${nomeArquivo}`;

  const up = await uploadArquivoStorage(path, arquivo);
  if (up.erro) return { erro: up.erro };

  const { error } = await supabase.from("documentos_fiscais").insert({
    empresa_id: params.empresaId,
    user_id: params.userId,
    ano: params.ano,
    tipo: params.tipo,
    descricao: params.descricao || null,
    nome_arquivo: params.file.name,
    path_storage: path,
    tamanho_bytes: arquivo.size,
  });
  if (error) {
    await removerArquivoStorage(path); // não deixa arquivo órfão sem metadado
    return { erro: error.message };
  }
  return {};
}

export async function atualizarDocumentoFiscal(id: string, dados: { tipo?: TipoDocumentoFiscal; descricao?: string }): Promise<{ erro?: string }> {
  const { data, error } = await supabase.from("documentos_fiscais").update(dados).eq("id", id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("documentos_fiscais", "update", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function excluirDocumentoFiscal(doc: DocumentoFiscal): Promise<{ erro?: string }> {
  await removerArquivoStorage(doc.path_storage);
  const { data, error } = await supabase.from("documentos_fiscais").delete().eq("id", doc.id).select("id");
  if (error || !data || data.length === 0) {
    const motivo = error?.message || "0 linhas afetadas (RLS?)";
    reportarFalhaEscrita("documentos_fiscais", "delete", motivo);
    return { erro: motivo };
  }
  return {};
}

export async function urlDocumentoFiscal(path: string): Promise<string | null> {
  return gerarUrlAssinada(path);
}
