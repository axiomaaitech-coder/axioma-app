// Self-check da régua de saúde das fontes: node scripts/check-nexus-saude-fontes.mjs
import assert from 'node:assert/strict'
import { calcularSaudeFonte } from '../lib/nexusFreshness.ts'

const agora = new Date('2026-09-27T12:00:00Z')
assert.equal(calcularSaudeFonte(false, '2026-09-27T06:00:00Z', null, agora), 'desligada')
assert.equal(calcularSaudeFonte(true, null, null, agora), 'nunca')
assert.equal(calcularSaudeFonte(true, null, '2026-09-27T06:00:00Z', agora), 'falhou')
assert.equal(calcularSaudeFonte(true, '2026-09-27T06:00:00Z', null, agora), 'ok')
assert.equal(calcularSaudeFonte(true, '2026-09-27T06:00:00Z', '2026-09-26T06:00:00Z', agora), 'ok')
assert.equal(calcularSaudeFonte(true, '2026-09-26T06:00:00Z', '2026-09-27T06:00:00Z', agora), 'falhou')
assert.equal(calcularSaudeFonte(true, '2026-09-25T06:00:00Z', null, agora), 'parada')
console.log('ok — saúde das fontes')

// Nota de confiança da fonte
const { calcularConfiancaFonte, concordanciaPct, fonteEmPausa } = await import('../lib/nexusFreshness.ts')
assert.equal(calcularConfiancaFonte('central_bank', '2026-09-27T06:00:00Z', null, 100, agora).nota, 98) // 47,5+30+20
assert.equal(calcularConfiancaFonte('news_source', '2026-09-27T06:00:00Z', null, null, agora).nota, 76) // 30+30+16
assert.equal(calcularConfiancaFonte('central_bank', '2026-09-26T06:00:00Z', '2026-09-27T06:00:00Z', null, agora).atualidade, 70) // falhou por último: -30
assert.equal(calcularConfiancaFonte('international_org', null, '2026-09-27T06:00:00Z', null, agora).nota, 61) // nunca funcionou
assert.equal(concordanciaPct(5.20, 5.21), 100)
assert.equal(concordanciaPct(5.20, 5.25), 80)
assert.equal(concordanciaPct(5.00, 5.30), 40)
console.log('OK — nota de confiança da fonte')

// Pausa: só quem falha há mais de 1 dia (ou nunca funcionou); volta a tentar 6h depois da última falha
assert.equal(fonteEmPausa('2026-09-27T06:00:00Z', null, agora), false)
assert.equal(fonteEmPausa('2026-09-26T06:00:00Z', '2026-09-27T06:00:00Z', agora), false) // falhou há pouco: tenta
assert.equal(fonteEmPausa(null, new Date(agora.getTime() - 2 * 3600000).toISOString(), agora), true) // nunca funcionou, falhou há 2h: espera
assert.equal(fonteEmPausa(null, new Date(agora.getTime() - 7 * 3600000).toISOString(), agora), false) // 7h depois: tenta de novo
console.log('OK — pausa automática')
