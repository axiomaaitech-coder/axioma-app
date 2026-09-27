import jsPDF from "jspdf";
import { reportarFalhaLeitura, mensagemFalhaExportacao, type LangUi } from "./erroUiHelpers";

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

  // Nada é cortado: título, subtítulo, resumo e TODA célula quebram em várias
  // linhas dentro da largura (splitTextToSize) e a linha da tabela cresce na
  // altura necessária. Antes o texto longo era truncado com "…" e título/
  // subtítulo passavam da borda da folha — PDF incompleto pro cliente.
  const ALTURA_LINHA = 4.2
  const quebrar = (texto: string, largura: number): string[] => pdf.splitTextToSize(texto, largura) as string[]

  // ---- Cabeçalho ----
  function desenharCabecalho(): number {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("AXIOMA AI.TECH", margin, 16);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(90, 90, 90);
    pdf.text(new Date().toLocaleDateString("pt-BR") + "  " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), pageW - margin, 16, { align: "right" });

    let yc = 24;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    for (const l of quebrar(titulo, usableW)) { pdf.text(l, margin, yc); yc += 5.5; }

    if (subtitulo) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(110, 110, 110);
      for (const l of quebrar(subtitulo, usableW)) { pdf.text(l, margin, yc); yc += ALTURA_LINHA; }
    }

    yc += 1.5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(margin, yc, pageW - margin, yc);
    return yc + 8;
  }

  let y = desenharCabecalho();

  // ---- Resumo (KPIs) ----
  if (resumo && resumo.length > 0) {
    pdf.setFontSize(10);
    resumo.forEach((r) => {
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      const rotulo = `${r.label}:`;
      const w = pdf.getTextWidth(rotulo + " ");
      pdf.text(rotulo, margin, y);
      pdf.setFont("helvetica", "normal");
      const linhasValor = quebrar(r.valor, usableW - w);
      linhasValor.forEach((l, k) => pdf.text(l, margin + w, y + k * 5));
      y += Math.max(1, linhasValor.length) * 5 + 1;
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
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    const cabecalhos = colunas.map((c, i) => quebrar(c.header, larguras[i] - 4));
    const alt = Math.max(...cabecalhos.map((l) => l.length)) * ALTURA_LINHA + 3;
    pdf.setFillColor(235, 235, 235);
    pdf.rect(margin, y - 5, usableW, alt + 1, "F");
    pdf.setTextColor(0, 0, 0);
    colunas.forEach((c, i) => {
      const tx = c.align === "right" ? xPos[i] + larguras[i] - 2 : xPos[i] + 2;
      cabecalhos[i].forEach((l, k) => pdf.text(l, tx, y + k * ALTURA_LINHA, { align: c.align === "right" ? "right" : "left" }));
    });
    y += alt + 1;
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
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    const celulas = colunas.map((c, i) => quebrar(String(linha[c.key] ?? ""), larguras[i] - 4));
    const altLinha = Math.max(1, ...celulas.map((l) => l.length)) * ALTURA_LINHA + 2;

    // quebra de página considerando a altura real da linha
    if (y + altLinha > pageH - 16) {
      pdf.addPage();
      y = 20;
      desenharCabecalhoTabela();
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
    }

    pdf.setTextColor(20, 20, 20);
    colunas.forEach((c, i) => {
      const tx = c.align === "right" ? xPos[i] + larguras[i] - 2 : xPos[i] + 2;
      celulas[i].forEach((l, k) => pdf.text(l, tx, y + k * ALTURA_LINHA, { align: c.align === "right" ? "right" : "left" }));
    });
    y += altLinha;

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
// aoErro é opcional (compatível com todo chamador existente sem mudança) —
// quando passado, a tela mostra um toast em vez de falhar calada. Em
// qualquer caso, a falha SEMPRE vai pro Sentry: antes cada uma das ~30
// telas que chamam essa função tinha seu próprio catch (err) {
// console.error(err) } — falha nunca chegava ao Sentry, só ao console do
// navegador. Corrigido uma vez aqui, vale pra todo chamador, atual e futuro.
export function gerarPdfTabela(args: ArgsPdfTabela, aoErro?: (mensagem: string) => void, lang: LangUi = "pt"): boolean {
  try {
    montarDocumentoPdf(args).save(args.nomeArquivo);
    return true;
  } catch (err) {
    reportarFalhaLeitura(`gerarPdfTabela:${args.nomeArquivo}`, err);
    aoErro?.(mensagemFalhaExportacao(lang));
    return false;
  }
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
export async function compartilharOuBaixarPdf(
  args: ArgsPdfTabela,
  aoConcluir: (baixouComoFallback: boolean) => void,
  aoErro?: (mensagem: string) => void,
  lang: LangUi = "pt",
) {
  let pdf: jsPDF;
  let blob: Blob;
  try {
    pdf = montarDocumentoPdf(args);
    blob = pdf.output("blob");
  } catch (err) {
    reportarFalhaLeitura(`compartilharOuBaixarPdf:montar:${args.nomeArquivo}`, err);
    aoErro?.(mensagemFalhaExportacao(lang));
    return;
  }
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

  try {
    pdf.save(args.nomeArquivo);
    aoConcluir(true);
  } catch (err) {
    reportarFalhaLeitura(`compartilharOuBaixarPdf:fallbackSave:${args.nomeArquivo}`, err);
    aoErro?.(mensagemFalhaExportacao(lang));
  }
}