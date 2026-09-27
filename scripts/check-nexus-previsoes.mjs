// Self-check da conferência de previsões do José: node scripts/check-nexus-previsoes.mjs
import assert from 'node:assert/strict'
import { direcaoReal, avaliarPrevisao, segundaDaSemana } from '../lib/nexusPrevisoes.ts'

// Dólar: tolerância 1%
assert.equal(direcaoReal('1', 5.0, 5.04), 'estavel')
assert.equal(direcaoReal('1', 5.0, 5.06), 'sobe')
assert.equal(direcaoReal('1', 5.0, 4.9), 'cai')
// Selic: qualquer mudança conta
assert.equal(direcaoReal('432', 15, 15), 'estavel')
assert.equal(direcaoReal('432', 15, 14.75), 'cai')
// IPCA mensal: até 0,10 p.p. é estável
assert.equal(direcaoReal('433', 0.4, 0.5), 'estavel')
assert.equal(direcaoReal('433', 0.4, 0.56), 'sobe')
assert.equal(avaliarPrevisao('432', 'cai', 15, 14.75), 'acertou')
assert.equal(avaliarPrevisao('432', 'estavel', 15, 14.75), 'errou')
// Semana começa na segunda (27/09/2026 é domingo → 21/09)
assert.equal(segundaDaSemana(new Date('2026-09-27T12:00:00Z')), '2026-09-21')
assert.equal(segundaDaSemana(new Date('2026-09-21T00:00:00Z')), '2026-09-21')
console.log('ok — previsões')
