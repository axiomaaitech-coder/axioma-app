// Detector de manual desatualizado (engenharia de documentação: a doc acompanha o código).
// Para cada manual, compara a data do último commit da TELA (e das libs principais dela) com a do
// último commit do MANUAL. Tela mudou depois do manual = DESATUALIZADO. Também lista manual só em pt.
// Rodar: node scripts/check-manuais.mjs   (sai com código 1 se houver manual desatualizado)
import { execSync } from 'node:child_process'
import { readFileSync, existsSync, readdirSync } from 'node:fs'

const ultimoCommit = (caminho) => {
  try { return Number(execSync(`git log -1 --format=%ct -- "${caminho}"`, { encoding: 'utf8' }).trim()) || 0 } catch { return 0 }
}

// Rota → arquivo da tela, a partir do mapa ROTAS do índice dos manuais (fonte única).
const indice = readFileSync('lib/documentos/manual/index.ts', 'utf8')
const rotas = [...indice.matchAll(/\["(\/[^"]*)", "(\d\d)"\]/g)].map((m) => ({ rota: m[1], num: m[2] }))
const arquivosManual = readdirSync('lib/documentos/manual').filter((f) => /^\d\d-.*\.ts$/.test(f))

const linhas = []
let desatualizados = 0
for (const { rota, num } of rotas) {
  const manual = arquivosManual.find((f) => f.startsWith(`${num}-`))
  if (!manual) continue
  const tela = rota === '/manual' ? null : [`app/(interno)${rota}/page.tsx`, `app${rota}/page.tsx`].find(existsSync)
  const tManual = ultimoCommit(`lib/documentos/manual/${manual}`)
  const tTela = tela ? ultimoCommit(tela) : 0
  const conteudo = readFileSync(`lib/documentos/manual/${manual}`, 'utf8')
  const trilingue = /DocTrilingue/.test(conteudo)
  const atrasado = tTela > tManual
  if (atrasado || !trilingue) desatualizados++
  linhas.push(`${atrasado ? 'DESATUALIZADO' : 'em dia       '} ${trilingue ? '3 idiomas' : 'só pt    '}  ${num} ${manual.padEnd(32)} tela: ${tela ?? '—'}${atrasado ? `  (tela mudou ${new Date(tTela * 1000).toISOString().slice(0, 10)}, manual ${new Date(tManual * 1000).toISOString().slice(0, 10)})` : ''}`)
}
console.log(linhas.join('\n'))
console.log(`\n${desatualizados} manual(is) a atualizar (desatualizado ou só em português).`)
process.exit(desatualizados ? 1 : 0)
