// Gerador de PDF dos documentos do Axioma (termos, privacidade e manuais), nos 3
// idiomas, a partir do mesmo conteúdo do site (lib/documentos). Monta um HTML e
// imprime com o Edge. Uso: node scripts/gerar-pdf.cjs "<pasta-de-saida>"
// Saída: Termos de Uso/ · Política de Privacidade/ · "NN - Módulo"/ (um PDF por idioma).
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync } = require('child_process')
const { pathToFileURL } = require('url')

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p))

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// **negrito** e [[campo a preencher]]
const runs = (t) => esc(t)
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/\[\[([^\]]+)\]\]/g, '<mark>[$1]</mark>')

function bloco(b, ids) {
  if (b.h1) { const id = `s${ids.length}`; ids.push({ id, nivel: 1, t: b.h1 }); return `<h1 id="${id}">${esc(b.h1)}</h1>` }
  if (b.h2) { const id = `s${ids.length}`; ids.push({ id, nivel: 2, t: b.h2 }); return `<h2 id="${id}">${esc(b.h2)}</h2>` }
  if (b.h3) return `<h3>${esc(b.h3)}</h3>`
  if (b.p) return `<p>${runs(b.p)}</p>`
  if (b.lista) return `<ul>${b.lista.map((i) => `<li>${runs(i)}</li>`).join('')}</ul>`
  if (b.numerada) return `<ol>${b.numerada.map((i) => `<li>${runs(i)}</li>`).join('')}</ol>`
  if (b.nota) return `<div class="caixa nota">${runs(b.nota)}</div>`
  if (b.alerta) return `<div class="caixa alerta">${runs(b.alerta)}</div>`
  if (b.tabela) {
    const { colunas, linhas, larguras } = b.tabela
    const tot = larguras ? larguras.reduce((a, c) => a + c, 0) : 0
    const col = larguras ? `<colgroup>${larguras.map((w) => `<col style="width:${(w / tot * 100).toFixed(1)}%">`).join('')}</colgroup>` : ''
    return `<table>${col}<thead><tr>${colunas.map((c) => `<th>${runs(c)}</th>`).join('')}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((c) => `<td>${runs(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`
  }
  if (b.quebra) return '<div class="quebra"></div>'
  return ''
}

const ROTULO = {
  pt: { idioma: 'Português', sumario: 'Sumário', pagina: 'Página' },
  en: { idioma: 'English', sumario: 'Contents', pagina: 'Page' },
  es: { idioma: 'Español', sumario: 'Índice', pagina: 'Página' },
}

function html(c, lang) {
  const r = ROTULO[lang]
  const ids = []
  const corpo = c.blocos.map((b) => bloco(b, ids)).join('\n')
  const sumario = c.sumario === false || !ids.length ? '' : `<section class="sumario"><h1>${esc(c.tituloSumario || r.sumario)}</h1><ul>${ids.map((s) => `<li class="n${s.nivel}"><a href="#${s.id}">${esc(s.t)}</a></li>`).join('')}</ul></section>`
  return `<!doctype html><html lang="${lang === 'pt' ? 'pt-BR' : lang}"><head><meta charset="utf-8"><title>${esc(c.titulo)}</title><style>
@page { size: A4; margin: 22mm 20mm 20mm;
  @top-right { content: "AXIOMA AI.TECH  •  ${esc(c.titulo).replace(/"/g, '')}"; color: #0F7D5C; font: bold 8pt Arial, sans-serif; }
  @bottom-center { content: "${esc(c.rodape || 'axiomaai.com.br')}   •   Página " counter(page); color: #6B7280; font: 8pt Arial, sans-serif; } }
@page :first { @top-right { content: none } }
* { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
body { font: 11pt/1.55 Arial, sans-serif; color: #374151; margin: 0; }
.capa { margin-top: 60mm; background: #101B3D; border-bottom: 6px solid #2ECC9B; padding: 34px; }
.capa .marca { color: #2ECC9B; font-weight: bold; letter-spacing: 3px; font-size: 13pt; margin-bottom: 10px; }
.capa .titulo { color: #fff; font-weight: bold; font-size: 26pt; line-height: 1.2; margin-bottom: 10px; }
.capa .sub { color: #E6EDF5; font-size: 12pt; }
.info { margin-top: 18px; font-size: 10pt; } .info p { margin: 0 0 4px; }
.sumario, .conteudo { break-before: page; }
.sumario ul { list-style: none; padding: 0; } .sumario li { margin: 3px 0; } .sumario li.n2 { padding-left: 18px; font-size: 10pt; }
.sumario a { color: #101B3D; text-decoration: none; }
h1 { color: #101B3D; font-size: 16pt; border-bottom: 1.5px solid #0F7D5C; padding-bottom: 4px; margin: 22px 0 10px; break-after: avoid; }
h2 { color: #101B3D; font-size: 13pt; margin: 16px 0 8px; break-after: avoid; }
h3 { color: #0F7D5C; font-size: 11.5pt; margin: 12px 0 6px; break-after: avoid; }
p { text-align: justify; margin: 0 0 8px; } li { margin-bottom: 4px; }
mark { background: #FFF200; font-weight: bold; color: #374151; }
.caixa { background: #F6F7C4; border-top: 2.5px solid; padding: 10px 14px; margin: 10px 0 14px; break-inside: avoid; }
.nota { border-color: #0F7D5C; } .alerta { border-color: #101B3D; }
table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 10pt; }
th, td { border: 1px solid #D0D5DD; padding: 5px 8px; text-align: left; vertical-align: top; }
th { background: #101B3D; color: #fff; } tbody tr:nth-child(even) td { background: #F6F7C4; }
tr { break-inside: avoid; } thead { display: table-header-group; }
.quebra { break-after: page; }
</style></head><body>
<div class="capa"><div class="marca">AXIOMA AI.TECH</div><div class="titulo">${esc(c.titulo)}</div>${c.subtitulo ? `<div class="sub">${runs(c.subtitulo)}</div>` : ''}</div>
${c.info ? `<div class="info">${c.info.map((l) => `<p>${runs(l)}</p>`).join('')}</div>` : ''}
${sumario}
<section class="conteudo">${corpo}</section>
</body></html>`
}

;(async () => {
  const saida = path.resolve(process.argv[2] || '')
  if (!process.argv[2]) throw new Error('informe a pasta de saída')
  if (!EDGE) throw new Error('Edge/Chrome não encontrado')
  const raiz = path.join(__dirname, '..', 'lib', 'documentos')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'axioma-pdf-'))
  const limpo = (t) => t.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim()
  let total = 0
  const imprimir = (c, lang, pasta, nome) => {
    fs.mkdirSync(pasta, { recursive: true })
    const h = path.join(tmp, 'doc.html')
    fs.writeFileSync(h, html(c, lang))
    const destino = path.join(pasta, `${limpo(nome)} - ${ROTULO[lang].idioma}.pdf`)
    execFileSync(EDGE, ['--headless', '--disable-gpu', '--no-pdf-header-footer', `--user-data-dir=${path.join(tmp, 'perfil')}`, `--print-to-pdf=${destino}`, pathToFileURL(h).href], { stdio: 'ignore' })
    total++
  }
  const carregar = async (arq) => { const mod = await import(pathToFileURL(arq).href); return mod.default?.default ?? mod.default ?? mod }
  const LANGS = ['pt', 'en', 'es']

  // Termos e Privacidade: uma pasta cada, com os 3 idiomas.
  for (const [base, pastaNome] of [['termos', 'Termos de Uso'], ['privacidade', 'Política de Privacidade']]) {
    for (const lang of LANGS) {
      const c = await carregar(path.join(raiz, `${base}.${lang}.ts`))
      imprimir(c, lang, path.join(saida, pastaNome), c.titulo)
    }
    console.log('ok:', pastaNome)
  }
  // Manuais: uma pasta por módulo ("NN - Nome"), com um PDF por idioma.
  const arquivos = fs.readdirSync(path.join(raiz, 'manual')).filter((f) => /^\d\d-.*\.ts$/.test(f)).sort()
  for (const f of arquivos) {
    const d = await carregar(path.join(raiz, 'manual', f))
    const tri = d.pt && d.en && d.es ? d : { pt: d, en: d, es: d }
    const num = f.slice(0, 2)
    const nomeDe = (c) => c.titulo.replace(/^[^—]*—\s*/, '')
    const pasta = path.join(saida, `${num} - ${limpo(nomeDe(tri.pt))}`)
    for (const lang of LANGS) imprimir(tri[lang], lang, pasta, `${num} - ${nomeDe(tri[lang])}`)
    console.log('ok:', path.basename(pasta))
  }
  fs.rmSync(tmp, { recursive: true, force: true })
  console.log(`gerados ${total} PDFs em ${saida}`)
})()
