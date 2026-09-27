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
