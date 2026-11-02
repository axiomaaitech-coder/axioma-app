// Trava anti-volta (Acyclic Dependencies Principle — Robert C. Martin; mesma ideia do
// eslint import/no-cycle e do madge --circular, que aqui levariam minutos).
// Lê os import/export estáticos de lib, app e components e falha se algum arquivo
// depende de si mesmo por uma volta (A → B → A). Import só de tipo não conta: o
// TypeScript apaga na compilação. import() dinâmico também não: carrega na hora
// do uso, não na largada do servidor.
// Uso: node scripts/check-ciclos.mjs (roda sozinho antes de todo build — prebuild).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve, relative } from 'node:path'

const RAIZ = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
const PASTAS = ['lib', 'app', 'components']
const EXT = ['.ts', '.tsx', '.mts', '.js', '.mjs']

function arquivos(dir, out = []) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) { if (n !== 'node_modules') arquivos(p, out) }
    else if (EXT.some((e) => n.endsWith(e)) && !n.endsWith('.d.ts')) out.push(p)
  }
  return out
}

function resolver(de, spec) {
  let base
  if (spec.startsWith('@/')) base = join(RAIZ, spec.slice(2))
  else if (spec.startsWith('.')) base = resolve(dirname(de), spec)
  else return null // pacote externo
  for (const c of [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, 'index' + e))])
    if (existsSync(c) && statSync(c).isFile()) return c
  return null
}

// Só tipo: "import type ..." / "export type ..." ou chaves só com "type X".
const soTipo = (clausula) => /^\s*type\s/.test(clausula) ||
  (/^\s*\{[^}]*\}\s*$/.test(clausula) && clausula.replace(/[{}\s]/g, '').split(',').filter(Boolean).every((x) => x.startsWith('type')))

export function grafo() {
  const g = new Map()
  for (const pasta of PASTAS) for (const f of arquivos(join(RAIZ, pasta))) {
    const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
    const deps = new Set()
    for (const m of src.matchAll(/^\s*(?:import|export)\s+([^'"]*?)\s*from\s*['"]([^'"]+)['"]|^\s*import\s+['"]([^'"]+)['"]/gm)) {
      if (m[1] !== undefined && soTipo(m[1])) continue
      const alvo = resolver(f, m[2] ?? m[3])
      if (alvo) deps.add(alvo)
    }
    g.set(f, deps)
  }
  return g
}

// Tarjan: cada componente fortemente conexo com mais de 1 arquivo (ou que importa a si mesmo) é uma volta.
export function voltas(g) {
  let i = 0; const idx = new Map(), low = new Map(), pilha = [], naPilha = new Set(), res = []
  const visitar = (v) => {
    idx.set(v, i); low.set(v, i++); pilha.push(v); naPilha.add(v)
    for (const w of g.get(v) ?? []) {
      if (!g.has(w)) continue
      if (!idx.has(w)) { visitar(w); low.set(v, Math.min(low.get(v), low.get(w))) }
      else if (naPilha.has(w)) low.set(v, Math.min(low.get(v), idx.get(w)))
    }
    if (low.get(v) === idx.get(v)) {
      const c = []; let w
      do { w = pilha.pop(); naPilha.delete(w); c.push(w) } while (w !== v)
      if (c.length > 1 || g.get(v)?.has(v)) res.push(c)
    }
  }
  for (const v of g.keys()) if (!idx.has(v)) visitar(v)
  return res
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(RAIZ, 'scripts', 'check-ciclos.mjs')) {
  // Autoteste: a trava precisa enxergar uma volta de verdade e ignorar caminho sem volta.
  const a = 'a', b = 'b', c = 'c'
  if (voltas(new Map([[a, new Set([b])], [b, new Set([c])], [c, new Set([a])]])).length !== 1) throw new Error('autoteste: volta A→B→C→A não detectada')
  if (voltas(new Map([[a, new Set([b])], [b, new Set([c])], [c, new Set()]])).length !== 0) throw new Error('autoteste: falso alarme')
  if (!soTipo(' { type X, type Y } ') || soTipo(' { type X, y } ') || !soTipo('type { X }')) throw new Error('autoteste: leitura de import de tipo')

  const g = grafo()
  const achadas = voltas(g)
  if (achadas.length) {
    console.error(`✗ ${achadas.length} volta(s) de dependência entre arquivos — quebre separando a parte compartilhada num arquivo próprio:`)
    for (const c of achadas) console.error('  - ' + c.map((f) => relative(RAIZ, f).replace(/\\/g, '/')).join(' ↔ '))
    process.exit(1)
  }
  console.log(`✓ sem voltas de dependência (${g.size} arquivos conferidos)`)
}
