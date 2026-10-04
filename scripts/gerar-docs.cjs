// Uso: (numa pasta com `npm i docx@9`) node scripts/gerar-docs.cjs lib/documentos/manual/01-dashboard.ts "<pasta de saída>"
// Gerador de documentos Word do Axioma (termos, privacidade e manuais).
// Uso: node gen.js <arquivo-de-conteudo.js> <pasta-de-saida>
// Conteúdo: { arquivo, titulo, subtitulo, rodape, blocos: [...] }
//   { h1 }, { h2 }, { h3 }, { p }, { lista: [] }, { numerada: [] }, { nota }, { alerta },
//   { tabela: { colunas: [], linhas: [[]] , larguras: [] } }, { quebra: true }
// Texto entre [[ ]] vira campo a preencher (destacado em amarelo).
const fs = require('fs')
const path = require('path')
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Header, Footer,
  PageNumber, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat,
  TableOfContents, PageBreak,
} = require('docx')

const NAVY = '101B3D', MENTA = '0F7D5C', MENTA_C = '2ECC9B', CINZA = '374151', CREME = 'F6F7C4'

function runs(texto, base = {}) {
  // **negrito** e [[campo a preencher]]
  const partes = String(texto).split(/(\*\*[^*]+\*\*|\[\[[^\]]+\]\])/g).filter(Boolean)
  return partes.map((t) => {
    if (t.startsWith('**')) return new TextRun({ ...base, text: t.slice(2, -2), bold: true })
    if (t.startsWith('[[')) return new TextRun({ ...base, text: `[${t.slice(2, -2)}]`, bold: true, highlight: 'yellow' })
    return new TextRun({ ...base, text: t })
  })
}

function caixa(texto, cor, fundo) {
  return new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9026, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: fundo },
      borders: { top: { style: BorderStyle.SINGLE, size: 12, color: cor }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [new Paragraph({ children: runs(texto, { color: CINZA, size: 21 }) })],
    })] })],
  })
}

function tabela({ colunas, linhas, larguras }) {
  const total = 9026
  const w = larguras || colunas.map(() => Math.floor(total / colunas.length))
  const borda = { style: BorderStyle.SINGLE, size: 4, color: 'D0D5DD' }
  const bordas = { top: borda, bottom: borda, left: borda, right: borda }
  const cel = (txt, i, cab, zebra) => new TableCell({
    width: { size: w[i], type: WidthType.DXA }, borders: bordas,
    shading: cab ? { type: ShadingType.CLEAR, color: 'auto', fill: NAVY } : zebra ? { type: ShadingType.CLEAR, color: 'auto', fill: CREME } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: runs(txt, cab ? { bold: true, color: 'FFFFFF', size: 20 } : { color: CINZA, size: 20 }) })],
  })
  return new Table({
    width: { size: w.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: w,
    rows: [new TableRow({ tableHeader: true, children: colunas.map((c, i) => cel(c, i, true)) }),
      ...linhas.map((l, n) => new TableRow({ children: l.map((c, i) => cel(c, i, false, n % 2 === 1)) }))],
  })
}

function gerar(conteudo, saida) {
  const filhos = []
  // Capa
  filhos.push(new Paragraph({ spacing: { before: 1800 }, children: [] }))
  filhos.push(new Table({
    width: { size: 9026, type: WidthType.DXA }, columnWidths: [9026],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: 9026, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: 'auto', fill: NAVY },
      borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.SINGLE, size: 36, color: MENTA_C } },
      margins: { top: 480, bottom: 480, left: 480, right: 480 },
      children: [
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'AXIOMA AI.TECH', bold: true, color: MENTA_C, size: 26, characterSpacing: 120 })] }),
        new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: conteudo.titulo, bold: true, color: 'FFFFFF', size: 52 })] }),
        ...(conteudo.subtitulo ? [new Paragraph({ children: runs(conteudo.subtitulo, { color: 'E6EDF5', size: 24 }) })] : []),
      ],
    })] })],
  }))
  filhos.push(new Paragraph({ spacing: { after: 300 }, children: [] }))
  if (conteudo.info) for (const l of conteudo.info) filhos.push(new Paragraph({ spacing: { after: 80 }, children: runs(l, { color: CINZA, size: 20 }) }))
  if (conteudo.sumario !== false) {
    filhos.push(new Paragraph({ children: [new PageBreak()] }))
    filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: conteudo.tituloSumario || 'Sumário' })] }))
    filhos.push(new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2' }))
  }
  filhos.push(new Paragraph({ children: [new PageBreak()] }))

  for (const b of conteudo.blocos) {
    if (b.h1) filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: b.h1 })] }))
    else if (b.h2) filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: b.h2 })] }))
    else if (b.h3) filhos.push(new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text: b.h3 })] }))
    else if (b.p) filhos.push(new Paragraph({ spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED, children: runs(b.p) }))
    else if (b.lista) for (const it of b.lista) filhos.push(new Paragraph({ numbering: { reference: 'bolinhas', level: 0 }, spacing: { after: 80 }, children: runs(it) }))
    else if (b.numerada) { const ref = `num-${filhos.length}`; numeracoes.push(ref); for (const it of b.numerada) filhos.push(new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 }, children: runs(it) })) }
    else if (b.nota) { filhos.push(caixa(b.nota, MENTA, CREME)); filhos.push(new Paragraph({ children: [] })) }
    else if (b.alerta) { filhos.push(caixa(b.alerta, NAVY, CREME)); filhos.push(new Paragraph({ children: [] })) }
    else if (b.tabela) { filhos.push(tabela(b.tabela)); filhos.push(new Paragraph({ children: [] })) }
    else if (b.quebra) filhos.push(new Paragraph({ children: [new PageBreak()] }))
  }

  const doc = new Document({
    creator: 'Axioma AI.Tech', title: conteudo.titulo,
    styles: {
      default: { document: { run: { font: 'Arial', size: 22, color: CINZA } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: 'Arial', size: 52, bold: true, color: NAVY } },
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: MENTA, space: 4 } } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 26, bold: true, color: NAVY }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: 'Arial', size: 23, bold: true, color: MENTA }, paragraph: { spacing: { before: 180, after: 100 }, outlineLevel: 2 } },
      ],
    },
    numbering: { config: [
      { reference: 'bolinhas', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ...numeracoes.map((ref) => ({ reference: ref, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] })),
    ] },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `AXIOMA AI.TECH  •  ${conteudo.titulo}`, color: MENTA, size: 16, bold: true })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: conteudo.rodape || 'axiomaai.com.br', color: '6B7280', size: 16 }), new TextRun({ text: '   •   Página ', color: '6B7280', size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: '6B7280', size: 16 })] })] }) },
      children: filhos,
    }],
  })
  fs.mkdirSync(saida, { recursive: true })
  const destino = path.join(saida, conteudo.arquivo)
  return Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(destino, buf); console.log('gerado:', destino) })
}

let numeracoes = []
const [, , arqConteudo, saida] = process.argv
const { pathToFileURL } = require('url')
;(async () => {
  const mod = await import(pathToFileURL(path.resolve(arqConteudo)).href)
  const conteudos = mod.default?.default ?? mod.default ?? mod
  for (const c of (Array.isArray(conteudos) ? conteudos : [conteudos])) { numeracoes = []; await gerar(c, saida) }
})()
