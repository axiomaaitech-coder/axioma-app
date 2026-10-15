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
