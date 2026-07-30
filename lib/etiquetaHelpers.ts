// 🦅 AXIOMA AI.TECH - Etiquetas de Produto (código de barras/QR) do Estoque
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { fBRL } from "./cfoCore";

export type ProdutoParaEtiqueta = {
  nome: string;
  codigo_interno?: string | null;
  codigo_barras?: string | null;
  preco_venda?: number | null;
  preco_sugerido?: number | null;
};

// Grade compatível com etiqueta adesiva padrão 3 colunas × 7 linhas (tipo Pimaco 6180) em A4.
export async function gerarEtiquetasPDF(produtos: ProdutoParaEtiqueta[]) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 7;
  const labelW = 63.5, labelH = 38.1;
  const cols = 3, rows = 7;
  let col = 0, row = 0;

  for (const p of produtos) {
    if (row >= rows) { row = 0; col = 0; pdf.addPage(); }
    const x = margin + col * labelW;
    const y = margin + row * labelH;

    pdf.setDrawColor(210, 210, 210);
    pdf.setLineWidth(0.1);
    pdf.rect(x, y, labelW, labelH);

    const codigo = p.codigo_barras || p.codigo_interno || p.nome;
    try {
      const qrDataUrl = await QRCode.toDataURL(codigo, { margin: 0, width: 160 });
      pdf.addImage(qrDataUrl, "PNG", x + 2, y + 2, 26, 26);
    } catch {
      // ponytail: se a geração do QR falhar (código vazio/inválido), a etiqueta
      // ainda sai com nome/preço — só sem o QR.
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(p.nome.length > 30 ? p.nome.slice(0, 29) + "…" : p.nome, x + 30, y + 8, { maxWidth: labelW - 32 });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(90, 90, 90);
    if (p.codigo_interno) pdf.text(p.codigo_interno, x + 30, y + 13);

    const preco = p.preco_venda ?? p.preco_sugerido;
    if (preco != null) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text(fBRL(preco), x + 30, y + 22);
    }

    col++;
    if (col >= cols) { col = 0; row++; }
  }

  pdf.save("axioma-estoque-etiquetas.pdf");
}
