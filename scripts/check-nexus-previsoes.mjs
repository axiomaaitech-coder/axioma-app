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

// Placar resumido
import { resumirPlacar } from '../lib/nexusPrevisoes.ts'
assert.match(resumirPlacar([]), /nenhuma previsão conferida/)
const r = resumirPlacar([
  { serie_codigo: '432', horizonte_dias: 30, status: 'acertou' },
  { serie_codigo: '432', horizonte_dias: 30, status: 'errou' },
  { serie_codigo: '1', horizonte_dias: 90, status: 'acertou' },
  { serie_codigo: '1', horizonte_dias: 90, status: 'aberta' },
])
assert.match(r, /Geral: 2 de 3 \(67%\)/)
assert.match(r, /Selic, 30 dias: 1 de 2 \(50%\)/)
assert.match(r, /Dólar, 90 dias: 1 de 1 \(100%\)/)
console.log('ok — placar resumido')
