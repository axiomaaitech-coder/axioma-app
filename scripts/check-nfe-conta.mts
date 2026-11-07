// A conta a pagar da nota sai só do XML e soma sempre o total da nota.
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
import assert from 'node:assert/strict'
const { planoContasDaNota } = await import('../lib/pdvNfeHelpers')
const base = { numeroNf: '10', razaoSocial: 'Fornecedor', dataEmissao: '2026-11-01', valorTotal: 1000 }
const pix = { codigo: '17', meio: 'PIX', valor: 1000, aPrazo: false, quitado: true }
const soma = (l: { valor_total: number }[]) => Math.round(l.reduce((t, c) => t + c.valor_total, 0) * 100) / 100

// Três duplicatas: uma conta por vencimento, sem pagamento presumido
const tres = planoContasDaNota({ ...base, pagamentos: [], parcelas: [{ valor: 333.33, vencimento: '2026-12-01' }, { valor: 333.33, vencimento: '2027-01-01' }, { valor: 333.34, vencimento: '2027-02-01' }] })
assert.equal(tres.length, 3); assert.equal(soma(tres), 1000); assert.equal(tres[1].data_vencimento, '2027-01-01'); assert.equal(tres[0].pago, undefined)

// À vista: a nota diz que foi quitada
const vista = planoContasDaNota({ ...base, parcelas: [], pagamentos: [pix] })
assert.equal(vista.length, 1); assert.deepEqual(vista[0].pago, { valor: 1000, data: '2026-11-01', forma: 'PIX' })

// Sem forma de pagamento no XML: fica em aberto, nunca presume pago
const semPag = planoContasDaNota({ ...base, parcelas: [], pagamentos: [] })
assert.equal(semPag[0].pago, undefined); assert.equal(semPag[0].forma, null)

// Entrada + duplicatas: soma o total e só a entrada está paga
const entrada = planoContasDaNota({ ...base, pagamentos: [{ ...pix, valor: 200 }], parcelas: [{ valor: 800, vencimento: '2026-12-01' }] })
assert.equal(entrada.length, 2); assert.equal(soma(entrada), 1000); assert.equal(entrada[0].pago?.valor, 200); assert.equal(entrada[1].pago, undefined)

// Sem total: não cria nada
assert.deepEqual(planoContasDaNota({ ...base, valorTotal: 0, parcelas: [], pagamentos: [] }), [])
console.log('check-nfe-conta: ok')
