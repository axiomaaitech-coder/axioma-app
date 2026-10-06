// Varredura de falhas silenciosas (regra do Elias, 2026-10-06): lista, por arquivo,
// gravações no Supabase que não conferem o erro ou as linhas afetadas, e catch vazio.
// Uso: node scripts/varrer-falhas.cjs [pasta ou arquivo ...]   (padrão: app components lib)
const fs = require('fs')
const path = require('path')

const alvos = process.argv.slice(2).length ? process.argv.slice(2) : ['app', 'components', 'lib']
const arquivos = []
const andar = (p) => {
  if (!fs.existsSync(p)) return
  const st = fs.statSync(p)
  if (st.isDirectory()) { if (!/node_modules|\.next|documentos/.test(p)) for (const f of fs.readdirSync(p)) andar(path.join(p, f)) }
  else if (/\.(tsx?|jsx?)$/.test(p)) arquivos.push(p)
}
alvos.forEach(andar)

// Fim do comando que começa em `ini`: primeiro ";" ou quebra de linha com parênteses fechados.
function fimDoComando(txt, ini) {
  let nivel = 0
  for (let i = ini; i < txt.length; i++) {
    const c = txt[i]
    if (c === '(' || c === '{' || c === '[') nivel++
    else if (c === ')' || c === '}' || c === ']') { if (nivel === 0) return i; nivel-- }
    else if (c === ';' && nivel === 0) return i
    // quebra de linha só encerra se a próxima linha não continua a cadeia (.eq/.select...)
    else if (c === '\n' && nivel === 0 && !/^\s*\./.test(txt.slice(i + 1, i + 200))) return i
  }
  return txt.length
}

const achados = []
for (const arq of arquivos) {
  const txt = fs.readFileSync(arq, 'utf8')
  const linhaDe = (i) => txt.slice(0, i).split('\n').length
  const re = /\.from\(\s*["'`][\w-]+["'`]\s*\)\s*\.(insert|update|upsert|delete)\(/g
  let m
  while ((m = re.exec(txt))) {
    // Início do comando: volta até ; { } ou início da linha com await/const/return
    let ini = m.index
    while (ini > 0 && !/[;{}\n]/.test(txt[ini - 1])) ini--
    let inicioLinha = txt.lastIndexOf('\n', m.index) + 1
    // Cadeia quebrada em várias linhas ("const { error } = await supabase\n  .from(...)"): sobe até a linha que começa o comando
    while (inicioLinha > 0 && /^\s*(\.|$)/.test(txt.slice(inicioLinha, m.index + 1))) inicioLinha = txt.lastIndexOf('\n', inicioLinha - 2) + 1
    const antes = txt.slice(inicioLinha, m.index)
    const comando = txt.slice(m.index, fimDoComando(txt, m.index))
    const atribuido = /(const|let|var)\s*[{\[\w]|=\s*await|return\b|\.then\(|Promise\.all|\[\s*$|,\s*$|\(\s*$/.test(antes) || /^\s*$/.test(antes) && /\n\s*(const|let)[^\n]*=\s*await\s*$/.test(txt.slice(Math.max(0, inicioLinha - 200), inicioLinha))
    const confereLinhas = /\.select\(/.test(comando)
    if (!atribuido) achados.push({ arq, linha: linhaDe(m.index), tipo: 'RESULTADO IGNORADO', op: m[1] })
    else if (!confereLinhas && m[1] !== 'insert') achados.push({ arq, linha: linhaDe(m.index), tipo: 'sem .select (0 linhas/RLS passa calado)', op: m[1] })
  }
  const reCatch = /catch\s*(\([^)]*\))?\s*\{\s*\}/g
  while ((m = reCatch.exec(txt))) achados.push({ arq, linha: linhaDe(m.index), tipo: 'catch vazio', op: '' })
}

const porArquivo = {}
for (const a of achados) (porArquivo[a.arq] ??= []).push(a)
for (const [arq, lista] of Object.entries(porArquivo).sort()) {
  console.log(`\n${arq}`)
  for (const a of lista) console.log(`  L${a.linha}  ${a.tipo}${a.op ? ` (${a.op})` : ''}`)
}
console.log(`\nTotal: ${achados.length} pontos em ${Object.keys(porArquivo).length} arquivos`)
