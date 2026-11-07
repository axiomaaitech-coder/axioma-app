// 🦅 AXIOMA AI.TECH - Etiquetas de Produto (QR Code com o código) do Estoque
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { fBRL2 } from "./cfoCore";

export type ProdutoParaEtiqueta = {
  nome: string;
  codigo_interno?: string | null;
  codigo_barras?: string | null;
  preco_venda?: number | null;
  preco_sugerido?: number | null;
};

// O que saiu incompleto: a tela avisa, a etiqueta nunca falha calada.
export type ResultadoEtiquetas = { semCodigo: string[]; semPreco: string[] };

// Preço com centavos: o formato curto arredondava (R$ 6,90 saía como R$ 7).
export const precoEtiqueta = (preco: number) => `R$ ${fBRL2(preco)}`;
// O QR guarda o mesmo código que o leitor do caixa procura. Nome do produto no QR não é encontrado por ninguém.
export const codigoEtiqueta = (p: ProdutoParaEtiqueta) => p.codigo_barras || p.codigo_interno || "";

// Grade de 3 colunas × 7 linhas (etiqueta de 63,5 × 38,1 mm) em A4.
export async function gerarEtiquetasPDF(produtos: ProdutoParaEtiqueta[]): Promise<ResultadoEtiquetas> {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 7;
  const labelW = 63.5, labelH = 38.1;
  const cols = 3, rows = 7;
  let col = 0, row = 0;
  const resultado: ResultadoEtiquetas = { semCodigo: [], semPreco: [] };

  for (const p of produtos) {
    if (row >= rows) { row = 0; col = 0; pdf.addPage(); }
    const x = margin + col * labelW;
    const y = margin + row * labelH;

    pdf.setDrawColor(210, 210, 210);
    pdf.setLineWidth(0.1);
    pdf.rect(x, y, labelW, labelH);

    const codigo = codigoEtiqueta(p);
    let comQr = false;
    if (codigo) {
      try {
        // Desenhado como vetor: nítido em qualquer impressora e leve (como imagem, 100 etiquetas passavam de 100 MB).
        const { modules } = QRCode.create(codigo, { errorCorrectionLevel: "M" });
        const lado = 26 / modules.size;
        pdf.setFillColor(0, 0, 0);
        // Quadrados vizinhos viram um bloco só e levemente sobrepostos: sem isso apareciam linhas brancas entre eles.
        const emenda = 0.04;
        for (let l = 0; l < modules.size; l++) {
          for (let c = 0; c < modules.size; c++) {
            if (!modules.get(l, c)) continue;
            let fim = c;
            while (fim + 1 < modules.size && modules.get(l, fim + 1)) fim++;
            pdf.rect(x + 2.5 + c * lado, y + 2.5 + l * lado, (fim - c + 1) * lado, lado + (l + 1 < modules.size ? emenda : 0), "F");
            c = fim;
          }
        }
        comQr = true;
      } catch {
        // cai no aviso abaixo: a etiqueta sai sem QR e a tela diz qual produto
      }
    }
    if (!comQr) resultado.semCodigo.push(p.nome);

    // Número legível embaixo do QR: confere com o cadastro e pode ser digitado se o leitor falhar.
    if (codigo) {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(codigo.length > 14 ? 7 : 9);
      pdf.setTextColor(0, 0, 0);
      pdf.text(codigo, x + 15.5, y + 33, { align: "center", maxWidth: 29 });
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const linhas = pdf.splitTextToSize(p.nome, labelW - 33) as string[];
    const nomeEtiqueta = linhas.slice(0, 3);
    if (linhas.length > 3) nomeEtiqueta[2] = `${nomeEtiqueta[2].trimEnd()}…`; // nome maior que a etiqueta: mostra que continua
    pdf.text(nomeEtiqueta, x + 31, y + 7);

    const preco = p.preco_venda ?? p.preco_sugerido;
    if (preco != null) {
      pdf.setFont("helvetica", "bold");
      const textoPreco = precoEtiqueta(Number(preco));
      pdf.setFontSize(textoPreco.length > 11 ? 12 : 15); // preço grande não passa da etiqueta
      pdf.text(textoPreco, x + 31, y + 30);
    } else resultado.semPreco.push(p.nome);

    col++;
    if (col >= cols) { col = 0; row++; }
  }

  pdf.save("axioma-estoque-etiquetas.pdf");
  return resultado;
}
