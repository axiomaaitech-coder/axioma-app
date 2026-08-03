// AXIOMA — Adaptador de storage para documentos sensíveis (fiscal, e
// futuramente outros). Ponto único de configuração: hoje usa Supabase
// Storage (bucket PRIVADO + signed URL). Trocar para Cloudflare R2
// (S3-compatible) no futuro é reimplementar só as 3 funções abaixo com o SDK
// do R2 — nenhum chamador (lib/documentosFiscaisHelpers.ts) muda.
//
// GANCHO R2 (não implementado agora, só o ponto de entrada preparado):
//
// import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
// const r2 = new S3Client({
//   region: "auto",
//   endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
//   credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! },
// });
// export async function uploadArquivoStorage(path, file) {
//   await r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: path, Body: await file.arrayBuffer(), ContentType: file.type }));
//   return {};
// }
// (mesma troca pra gerarUrlAssinada via getSignedUrl(GetObjectCommand) e removerArquivoStorage via DeleteObjectCommand)

import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BUCKET_DOCUMENTOS_FISCAIS = "documentos-fiscais";

export async function uploadArquivoStorage(path: string, file: File | Blob): Promise<{ erro?: string }> {
  const { error } = await supabase.storage
    .from(BUCKET_DOCUMENTOS_FISCAIS)
    .upload(path, file, { upsert: false, contentType: (file as File).type || "application/octet-stream" });
  return error ? { erro: error.message } : {};
}

export async function gerarUrlAssinada(path: string, segundos: number = 3600): Promise<string | null> {
  const { data } = await supabase.storage.from(BUCKET_DOCUMENTOS_FISCAIS).createSignedUrl(path, segundos);
  return data?.signedUrl || null;
}

export async function removerArquivoStorage(path: string): Promise<void> {
  await supabase.storage.from(BUCKET_DOCUMENTOS_FISCAIS).remove([path]);
}
