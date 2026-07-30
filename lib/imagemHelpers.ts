// 🦅 AXIOMA AI.TECH - Compressão de imagem no navegador (evita pesar storage/banda)
// Aceita qualquer formato que o navegador saiba decodificar (jpg, png, webp, gif,
// bmp, e heic/heif onde o navegador suportar nativamente) e sempre devolve um
// JPEG leve e redimensionado — assim o upload nunca esbarra em restrição de tipo
// no bucket, e nunca sobe um arquivo grande demais.
export async function comprimirImagem(file: File, opts: { ladoMaximo?: number; qualidade?: number } = {}): Promise<File> {
  const ladoMaximo = opts.ladoMaximo ?? 1200;
  const qualidade = opts.qualidade ?? 0.85;

  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), "image/jpeg", qualidade);
  });

  const nomeBase = file.name.replace(/\.[^.]+$/, "") || "imagem";
  return new File([blob], `${nomeBase}.jpg`, { type: "image/jpeg" });
}
