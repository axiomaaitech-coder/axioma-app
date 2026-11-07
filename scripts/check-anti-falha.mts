// Sistema anti-falha de leitura (lib/antiFalha + lib/erroUiHelpers + lib/lerTodas).
// Rodar: npx tsx scripts/check-anti-falha.mts — sem banco real (respostas simuladas), esperas encurtadas.
import assert from 'node:assert/strict'
const { comRetentativa } = await import('../lib/antiFalha')
const { exigirLeitura, registrarLeitura } = await import('../lib/erroUiHelpers')
const { lerTodas } = await import('../lib/lerTodas')

type R = { data: unknown; error: { message: string; code?: string } | null }
// Banco falso: devolve as respostas na ordem, conta as tentativas
const banco = (...respostas: (R | Error)[]) => {
  let n = 0
  const f = () => { const r = respostas[Math.min(n, respostas.length - 1)]; n++; return r instanceof Error ? Promise.reject(r) : Promise.resolve(r) }
  return { f, tentativas: () => n }
}
const ok = (data: unknown): R => ({ data, error: null })
const lento: R = { data: null, error: { message: 'canceling statement due to statement timeout', code: '57014' } }
const permissao: R = { data: null, error: { message: 'permission denied for table x', code: '42501' } }

// 1) Banco acordando: falha 2x e responde na 3ª — a pessoa nem percebe
const b1 = banco(lento, lento, ok([1, 2]))
assert.deepEqual((await comRetentativa(b1.f, 3, 1)).data, [1, 2]); assert.equal(b1.tentativas(), 3)
// 2) Rede cai no meio (exceção) e volta
const b2 = banco(new Error('fetch failed'), ok('volta'))
assert.equal((await comRetentativa(b2.f, 3, 1)).data, 'volta')
// 3) Erro permanente (permissão) não insiste: 1 tentativa só
const b3 = banco(permissao, ok('nunca'))
assert.equal((await comRetentativa(b3.f, 3, 1)).error?.code, '42501'); assert.equal(b3.tentativas(), 1)
// 4) Sem erro: 1 tentativa
const b4 = banco(ok('direto')); await comRetentativa(b4.f); assert.equal(b4.tentativas(), 1)
console.log('OK — retentativa: banco acordando, rede caindo, erro permanente e caminho feliz')

// 5) Último caso: exigir LANÇA (cancela a gravação), registrar segue sem o dado — os dois avisam a tela
let avisos = 0
;(globalThis as unknown as { window: EventTarget }).window = new EventTarget()
;(globalThis as unknown as { window: EventTarget }).window.addEventListener('axioma:falha-leitura', () => { avisos++ })
const sempreFalha = banco(lento)
await assert.rejects(() => exigirLeitura(sempreFalha.f as never, 'teste:1'), /leitura falhou \(teste:1\)/)
assert.equal(sempreFalha.tentativas(), 3)
assert.equal(await registrarLeitura(banco(lento).f as never, 'teste:2'), null)
assert.equal(avisos, 2)
assert.deepEqual(await exigirLeitura(banco(lento, ok(['a'])).f as never, 'teste:3'), ['a']) // recuperou: sem aviso
assert.equal(avisos, 2)
console.log('OK — último caso: exigir cancela, registrar segue; aviso só quando falhou de verdade')

// 6) lerTodas (usado no sistema todo) também se recupera sozinho, lote a lote
let chamadas = 0
const lote = (de: number, ate: number) => { chamadas++; return Promise.resolve(chamadas === 1 ? lento : ok(Array.from({ length: Math.min(ate - de + 1, 1500 - de) }, (_, i) => de + i))) }
const r6 = await lerTodas(() => ({ range: lote }) as never)
assert.equal(r6.error, null); assert.equal(r6.data.length, 1500); assert.equal(chamadas, 3) // 1 falha + 2 lotes
console.log('OK — lerTodas: lote que falhou é refeito sozinho e nenhuma linha some')

// 7) Cliente externo criado só no 1º uso (lib/supabaseServico.sobDemanda): carregar o arquivo não cria nada
const { sobDemanda } = await import('../lib/supabaseServico')
let criados = 0
class ClienteFalso { base = 'x'; checkout = { sessions: { criar: (n: number) => n * 2 } }; ping() { return this.base } }
const cli = sobDemanda(() => { criados++; return new ClienteFalso() })
assert.equal(criados, 0) // nada criado ao carregar (antes: sem chave, a montagem do site caía aqui)
assert.equal(cli.ping(), 'x') // método continua ligado ao cliente real
assert.equal(cli.checkout.sessions.criar(21), 42) // cadeia de propriedades (ex.: stripe.checkout.sessions.create)
assert.equal(criados, 1) // criado uma vez só
console.log('OK — cliente sob demanda: nada criado na montagem, métodos e cadeias funcionam, uma instância só')

// 8) Vigia: leitura do banco sem olhar o erro não volta a entrar. Quem falha vira "não existe", "zero" ou "sem permissão".
const { readdirSync, readFileSync, statSync } = await import('node:fs')
const arquivos = (d: string): string[] => readdirSync(d).flatMap((n) => { const c = `${d}/${n}`; return statSync(c).isDirectory() ? arquivos(c) : /\.tsx?$/.test(n) ? [c] : [] })
const semErro = /const \{ *data(: *\w+)? *\} *= *await (?!semFalha)[\w.()]*\.from\(/
const lotePerdido = /const \[(?=[^\]]*\{ *data(?:: *(?!u\b)\w+)? *\})[^\]]*\] *= *await Promise\.all/ // { data: u } = sessão (auth), sem leitura de negócio
const lerTodasSemErro = /const \{ *data(: *\w+)? *\} *= *await lerTodas\(/
const achados = ['app', 'lib', 'components'].flatMap(arquivos).flatMap((f) => readFileSync(f, 'utf8').split('\n').flatMap((l, i) => (semErro.test(l) || lotePerdido.test(l) || lerTodasSemErro.test(l) ? [`${f}:${i + 1}`] : [])))
assert.deepEqual(achados, [], 'leitura do banco que ignora o erro')
const webhook = readFileSync('app/api/stripe/webhook/route.ts', 'utf8')
assert.ok(!webhook.includes('.catch(() => null)'), 'webhook não pode engolir falha da Stripe')
assert.ok((webhook.match(/throw new Error\(/g) ?? []).length >= 7, 'erro do banco no webhook devolve 500 para a Stripe tentar de novo')
console.log('OK — vigia: nenhuma leitura ignora o erro; webhook com nova tentativa da Stripe')

// 9) Valor digitado: ponto de milhar e vírgula, em um lugar só
const { lerValorBR } = await import('../lib/valorBR')
for (const [t, v] of [['1.500,00', 1500], ['1.500', 1500], ['1500', 1500], ['1500,5', 1500.5], ['1500.50', 1500.5], ['12.345.678,90', 12345678.9], ['6,90', 6.9], ['0,5', 0.5], ['1.5', 1.5], ['R$ 1.234,56', 1234.56], ['-1.500,00', -1500]] as const) assert.equal(lerValorBR(t), v, t)
for (const t of ['', '   ', null, undefined, 'abc', '1,2,3']) assert.ok(Number.isNaN(lerValorBR(t)), String(t))
const trocaSoVirgula = /(Number|parseFloat)\([\w.]+\.replace\(\s*["'],["'],\s*["']\.["']\s*\)\)/
const fragil = arquivos('app').concat(arquivos('components')).flatMap((f) => readFileSync(f, 'utf8').split('\n').flatMap((l, i) => (trocaSoVirgula.test(l) && !/estado\.display|aliquotaIss/.test(l) ? [`${f}:${i + 1}`] : [])))
assert.deepEqual(fragil, [], 'campo de valor deve usar lerValorBR')
console.log('OK — valor digitado: 1.500,00 e 1.500 são mil e quinhentos em todo campo')
