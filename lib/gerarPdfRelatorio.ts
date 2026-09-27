import { jsPDF } from "jspdf";

// ═══════════════════════════════════════════════════════════════
// PDF de RELATÓRIO POR SEÇÕES — espelho de um card/modal (mesmos títulos, mesma
// ordem, mesmo conteúdo), não uma tabela. Usado pelo plano do José. Todo texto
// quebra dentro da margem (splitTextToSize) e a página vira sozinha: nada é
// cortado nem resumido. Fundo branco, texto preto — formato de documento.
// ═══════════════════════════════════════════════════════════════

export type ItemRelatorio = { titulo?: string; texto?: string; nota?: string };
export type SecaoRelatorio = { titulo: string; paragrafo?: string; itens?: ItemRelatorio[]; destaque?: boolean };
export type ArgsRelatorio = {
  titulo: string;
  subtitulo?: string;
  numeros?: { rotulo: string; valor: string }[];
  secoes: SecaoRelatorio[];
  rodape?: string;
  nomeArquivo: string;
};

// A fonte padrão do PDF (Helvetica, codificação WinAnsi) não tem setas, ≈, ≤/≥ nem
// emoji — a IA às vezes escreve esses caracteres e eles viravam lixo no documento.
// Troca pelos equivalentes legíveis e descarta o que não tem representação.
const TROCAS: Record<string, string> = { "→": "->", "←": "<-", "↑": "^", "↓": "v", "≈": "~", "≤": "<=", "≥": ">=", "≠": "!=", "×": "x", "−": "-", " ": " " };
const EXTRAS_WINANSI = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ");
export function limparTextoPdf(t: string): string {
  let out = "";
  for (const ch of t) {
    if (TROCAS[ch] !== undefined) out += TROCAS[ch];
    else if (ch.codePointAt(0)! <= 0xff || EXTRAS_WINANSI.has(ch)) out += ch;
  }
  return out.replace(/[ 	]{2,}/g, " ");
}

export function montarPdfRelatorio(a: ArgsRelatorio): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 16;
  const U = W - M * 2;
  let y = 18;

  const quebrar = (t: string, largura: number) => pdf.splitTextToSize(limparTextoPdf(t), largura) as string[];
  const garantir = (altura: number) => { if (y + altura > H - 18) { pdf.addPage(); y = 20; } };
  const escrever = (texto: string, opc: { tam: number; negrito?: boolean; cor?: [number, number, number]; x?: number; largura?: number; entrelinha?: number }) => {
    pdf.setFont("helvetica", opc.negrito ? "bold" : "normal");
    pdf.setFontSize(opc.tam);
    pdf.setTextColor(...(opc.cor ?? [20, 20, 20]));
    const linhas = quebrar(texto, opc.largura ?? U);
    const el = opc.entrelinha ?? opc.tam * 0.45;
    for (const l of linhas) { garantir(el); pdf.text(l, opc.x ?? M, y); y += el; }
  };

  // Cabeçalho
  escrever("AXIOMA AI.TECH", { tam: 15, negrito: true, cor: [0, 0, 0] });
  y += 1;
  escrever(a.titulo, { tam: 13, negrito: true, cor: [0, 0, 0] });
  if (a.subtitulo) escrever(a.subtitulo, { tam: 9, cor: [100, 100, 100] });
  y += 1.5;
  pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3); pdf.line(M, y, W - M, y);
  y += 7;

  // Números (grade de 2 colunas, como os quadrinhos do card)
  if (a.numeros?.length) {
    const colW = U / 2;
    for (let i = 0; i < a.numeros.length; i += 2) {
      garantir(12);
      const par = a.numeros.slice(i, i + 2);
      par.forEach((n, k) => {
        const x = M + k * colW;
        pdf.setFillColor(245, 245, 245); pdf.rect(x, y - 4.5, colW - 3, 11, "F");
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(100, 100, 100);
        pdf.text(quebrar(n.rotulo, colW - 7)[0], x + 2, y - 0.5);
        pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(0, 0, 0);
        pdf.text(quebrar(n.valor, colW - 7)[0], x + 2, y + 4.5);
      });
      y += 14;
    }
    y += 2;
  }

  // Seções
  for (const s of a.secoes) {
    garantir(14);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(0, 0, 0);
    pdf.text(s.titulo, M, y);
    y += 2;
    pdf.setDrawColor(200, 200, 200); pdf.setLineWidth(0.2); pdf.line(M, y, W - M, y);
    y += 5;
    if (s.paragrafo) {
      escrever(s.paragrafo, { tam: s.destaque ? 11 : 9.5, negrito: s.destaque, entrelinha: s.destaque ? 5.2 : 4.4 });
      y += 2;
    }
    for (const it of s.itens ?? []) {
      garantir(8);
      if (it.titulo) escrever(`• ${it.titulo}`, { tam: 9.5, negrito: true, entrelinha: 4.4 });
      if (it.texto) escrever(it.texto, { tam: 9, x: M + 4, largura: U - 4, entrelinha: 4.2 });
      if (it.nota) escrever(it.nota, { tam: 8, x: M + 4, largura: U - 4, cor: [110, 110, 110], entrelinha: 3.8 });
      y += 1.8;
    }
    y += 3;
  }

  // Rodapé com paginação
  const total = pdf.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    pdf.setPage(p);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(7.5); pdf.setTextColor(140, 140, 140);
    pdf.text(quebrar(a.rodape ?? "Axioma AI.Tech — relatório gerado automaticamente", U - 30)[0], M, H - 8);
    pdf.text(`Página ${p} de ${total}`, W - M, H - 8, { align: "right" });
  }
  return pdf;
}

export function gerarPdfRelatorio(a: ArgsRelatorio): boolean {
  try { montarPdfRelatorio(a).save(a.nomeArquivo); return true } catch (err) { console.error("[gerarPdfRelatorio]", err); return false }
}
