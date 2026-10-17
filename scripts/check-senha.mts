// Senha profissional (2026-10-16): regra mínima, e-mail dentro, e a base pública de senhas vazadas.
// Rodar: npx tsx scripts/check-senha.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

const S = await import('../lib/senhaSegura')
assert.equal(S.regraSenha('Ab1'), 'curta')
assert.equal(S.regraSenha('abcdefgh'), 'fraca', 'só letras')
assert.equal(S.regraSenha('12345678'), 'fraca', 'só números')
assert.equal(S.regraSenha('elias2026x', 'elias@axioma.com'), 'email')
assert.equal(S.regraSenha('Horizonte2026', 'elias@axioma.com'), null)
for (const l of ['pt', 'en', 'es'] as const) for (const p of ['curta', 'fraca', 'email', 'vazada'] as const) assert.ok(S.mensagemSenha(p, l).length > 10)
console.log('OK — regra: 8+ caracteres, letra e número, sem o e-mail; mensagens pt/en/es')

const rota = readFileSync('app/api/senha/vazada/route.ts', 'utf8')
assert.ok(rota.includes('/^[0-9A-F]{5}$/') && rota.includes("'Add-Padding': 'true'"), 'rota só aceita o prefixo de 5 e pede resposta com enchimento')
assert.ok(!/senha['"]?\s*:/.test(rota.replace(/\/\/.*$/gm, '')), 'a rota nunca recebe a senha')
for (const tela of ['app/cadastro/page.tsx', 'app/atualizar-senha/page.tsx', 'app/convite/[token]/page.tsx'])
  assert.ok(readFileSync(tela, 'utf8').includes("senhaSegura'"), `${tela} usa a regra única`)
console.log('OK — rota só com prefixo (k-anonimato); Cadastro, Atualizar senha e Convite usam a mesma regra')

// Ao vivo (precisa de internet): "password123" está na base de vazadas
try {
  const h = createHash('sha1').update('password123').digest('hex').toUpperCase()
  const r = await fetch(`https://api.pwnedpasswords.com/range/${h.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' }, signal: AbortSignal.timeout(8000) })
  const achou = (await r.text()).split('\n').some((l) => { const [s, n] = l.trim().split(':'); return s === h.slice(5) && Number(n) > 0 })
  assert.ok(achou, '"password123" deveria aparecer como vazada')
  console.log('OK — base de vazadas ao vivo: "password123" reconhecida')
} catch (e) {
  if (e instanceof assert.AssertionError) throw e
  console.log('AVISO — sem internet para testar a base ao vivo:', e instanceof Error ? e.message : e)
}
console.log('check-senha: tudo certo ✔')
