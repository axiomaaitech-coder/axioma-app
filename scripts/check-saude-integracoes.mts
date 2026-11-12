// Teste das regras do painel Saúde das Integrações: npx tsx scripts/check-saude-integracoes.mts
import assert from 'node:assert/strict'
import { statusIA, statusBanco } from '../lib/saudeIntegracoes'

const agora = Date.parse('2026-11-12T12:00:00Z'), DIA = 86400000
assert.equal(statusIA([]), 'nao_usa')
assert.equal(statusIA([{ provedor: 'openai', respondeu: true }]), 'ok')
assert.equal(statusIA([{ provedor: 'Anthropic' }]), 'ok')
assert.equal(statusIA([{ provedor: 'gemini', respondeu: true }]), 'atencao')
assert.equal(statusIA([{ provedor: 'openai', respondeu: false }, { provedor: 'openai', respondeu: true }]), 'falha')
assert.equal(statusBanco([], agora), 'nao_usa')
assert.equal(statusBanco([{ status: 'UPDATED', updated_at: new Date(agora - DIA).toISOString() }], agora), 'ok')
assert.equal(statusBanco([{ status: 'UPDATED', updated_at: new Date(agora - 4 * DIA).toISOString() }], agora), 'atencao')
assert.equal(statusBanco([{ status: 'UPDATED', updated_at: new Date(agora).toISOString() }, { status: 'login_error', updated_at: null }], agora), 'falha')
assert.equal(statusBanco([{ status: 'UPDATED', updated_at: null }], agora), 'atencao')
console.log('check-saude-integracoes: ok')
