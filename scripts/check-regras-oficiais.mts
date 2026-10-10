// Regras oficiais: valores batem com as telas e conferência antiga vira REVISAR.
import assert from 'node:assert/strict'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { textoRegrasOficiais, regrasPrecisamRevisao } = await import('../lib/regrasOficiais')
const t = textoRegrasOficiais('2026-10-10')
assert.ok(t.includes('81.000,00') && t.includes('251.600,00') && t.includes('81,05') && t.includes('194,52'), t)
assert.ok(!t.includes('REVISAR'))
assert.equal(regrasPrecisamRevisao('2026-10-10').length, 0)
assert.ok(textoRegrasOficiais('2027-06-01').includes('REVISAR'))
console.log('check-regras-oficiais OK')
