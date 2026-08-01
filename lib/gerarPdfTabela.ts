import jsPDF from "jspdf";

export type ColunaPDF = {
  header: string;
  key: string;
  // peso relativo da largura da coluna (ex: 4 = quatro vezes mais larga que 1)
  width?: number;
  align?: "left" | "right";
};

export type ResumoPDF = { label: string; valor: string };

export type ArgsPdfTabela = {
  titulo: string;
  subtitulo?: string;
  colunas: ColunaPDF[];
  linhas: Record<string, string>[];
  resumo?: ResumoPDF[];
  nomeArquivo: string;
};

// Monta o documento (mesmo motor usado por gerarPdfTabela e compartilharOuBaixarPdf) —
// PDF LIMPO, fundo branco e texto preto — formato relatório/auditoria.
function montarDocumentoPdf({ titulo, subtitulo, colunas, linhas, resumo }: ArgsPdfTabela): jsPDF {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const usableW = pageW - margin * 2;

  // ---- Cabeçalho ----
  function desenharCabecalho() {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("AXIOMA AI.TECH", margin, 16);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(90, 90, 90);
    pdf.text(new Date().toLocaleDateString("pt-BR") + "  " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), pageW - margin, 16, { align: "right" });

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(titulo, margin, 24);

    if (subtitulo) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(110, 110, 110);
      pdf.text(subtitulo, margin, 29);
    }

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 32, pageW - margin, 32);
  }

  desenharCabecalho();
  let y = 40;

  // ---- Resumo (KPIs) ----
  if (resumo && resumo.length > 0) {
    pdf.setFontSize(10);
    resumo.forEach((r) => {
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${r.label}:`, margin, y);
      const w = pdf.getTextWidth(`${r.label}:`);
      pdf.setFont("helvetica", "normal");
      pdf.text(` ${r.valor}`, margin + w, y);
      y += 6;
    });
    y += 3;
  }

  // ---- Cálculo de larguras das colunas ----
  const totalPeso = colunas.reduce((s, c) => s + (c.width || 1), 0);
  const larguras = colunas.map((c) => ((c.width || 1) / totalPeso) * usableW);
  const xPos: number[] = [];
  let acc = margin;
  for (let i = 0; i < colunas.length; i++) {
    xPos.push(acc);
    acc += larguras[i];
  }

  // ---- Cabeçalho da tabela ----
  function desenharCabecalhoTabela() {
    pdf.setFillColor(235, 235, 235);
    pdf.rect(margin, y - 5, usableW, 8, "F");
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    colunas.forEach((c, i) => {
      const tx = c.align === "right" ? xPos[i] + larguras[i] - 2 : xPos[i] + 2;
      pdf.text(c.header, tx, y, { align: c.align === "right" ? "right" : "left" });
    });
    y += 6;
  }

  desenharCabecalhoTabela();

  // ---- Linhas ----
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  if (linhas.length === 0) {
    pdf.setTextColor(130, 130, 130);
    pdf.text("Nenhum registro encontrado.", margin + 2, y + 2);
  }

  linhas.forEach((linha) => {
    // quebra de página
    if (y > pageH - 18) {
      pdf.addPage();
      y = 20;
      desenharCabecalhoTabela();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }

    pdf.setTextColor(20, 20, 20);
    colunas.forEach((c, i) => {
      let texto = String(linha[c.key] ?? "");
      // trunca textos muito longos para caber na coluna
      const maxChars = Math.floor(larguras[i] / 1.8);
      if (texto.length > maxChars && maxChars > 3) texto = texto.slice(0, maxChars - 1) + "…";
      const tx = c.align === "right" ? xPos[i] + larguras[i] - 2 : xPos[i] + 2;
      pdf.text(texto, tx, y, { align: c.align === "right" ? "right" : "left" });
    });
    y += 6;

    // linha separadora clara
    pdf.setDrawColor(225, 225, 225);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y - 4, pageW - margin, y - 4);
  });

  // ---- Rodapé com paginação ----
  const totalPaginas = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(140, 140, 140);
    pdf.text(`Axioma AI.Tech — Relatório gerado automaticamente`, margin, pageH - 8);
    pdf.text(`Página ${p} de ${totalPaginas}`, pageW - margin, pageH - 8, { align: "right" });
  }

  return pdf;
}

// Gera e baixa o PDF direto (comportamento original, usado pelo botão "Exportar PDF").
export function gerarPdfTabela(args: ArgsPdfTabela) {
  montarDocumentoPdf(args).save(args.nomeArquivo);
}

// Deriva o texto de compartilhamento (resumo/detalhado) do mesmo ArgsPdfTabela
// já usado pra gerar o PDF — uma fonte só, sem escrever resumo à mão por tela.
export function textoResumoPdf(args: ArgsPdfTabela, maxLinhas = 6): string {
  const linhas = args.linhas.slice(0, maxLinhas).map((l) =>
    args.colunas.map((c) => l[c.key]).filter(Boolean).join(" — ")
  );
  return [`🚀 AXIOMA AI.TECH — ${args.titulo}`, args.subtitulo, ...linhas].filter(Boolean).join("\n");
}

export function textoDetalhadoPdf(args: ArgsPdfTabela): string {
  const linhas = args.linhas.map((l) =>
    args.colunas.map((c) => `${c.header}: ${l[c.key]}`).join(" | ")
  );
  return [`🚀 AXIOMA AI.TECH — ${args.titulo}`, args.subtitulo, ...linhas].filter(Boolean).join("\n");
}

// Gera o PDF e tenta abrir o menu nativo de compartilhamento (mobile, via Web Share API
// com arquivo). Onde não tem suporte (a maioria dos desktops), baixa o arquivo e avisa
// pelo callback — o botão "Compartilhar" nunca fica sem fazer nada.
export async function compartilharOuBaixarPdf(args: ArgsPdfTabela, aoConcluir: (baixouComoFallback: boolean) => void) {
  const pdf = montarDocumentoPdf(args);
  const blob = pdf.output("blob");
  const arquivo = new File([blob], args.nomeArquivo, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };
  if (nav.canShare && nav.share && nav.canShare({ files: [arquivo] })) {
    try {
      await nav.share({ files: [arquivo], title: args.titulo });
      aoConcluir(false);
      return;
    } catch (err) {
      // usuário cancelou o menu de compartilhamento — não é erro, não faz nada
      if (err instanceof DOMException && err.name === "AbortError") return;
      // qualquer outra falha do share nativo (ex.: SO sem app compatível) cai no fallback abaixo
    }
  }

  pdf.save(args.nomeArquivo);
  aoConcluir(true);
}