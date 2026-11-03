// Excel dos módulos (gerarExcelTabela): valor em reais vira número, o resto fica como está. Rodar: npx tsx scripts/check-planilha.mts
import assert from 'node:assert/strict'
const { valorPlanilha: v } = await import('../lib/gerarPdfTabela')

const nbsp = ' ' // toLocaleString('pt-BR', { currency: 'BRL' }) usa espaço fixo depois do R$
assert.equal(v(`R$${nbsp}1.234,56`), 1234.56)
assert.equal(v((71300).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })), 71300)
assert.equal(v((-10.5).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })), -10.5)
assert.equal(v('R$ -10,50'), -10.5)
assert.equal(v('R$ 0,00'), 0)
assert.equal(v('R$ 5'), 5)
assert.equal(v('12,5%'), '12,5%', 'porcentagem fica texto')
assert.equal(v('Cliente X'), 'Cliente X')
assert.equal(v('R$ 1.234,56 (atraso)'), 'R$ 1.234,56 (atraso)', 'texto com valor no meio fica texto')
assert.equal(v('03/11/2026'), '03/11/2026', 'data fica como está')
console.log('check-planilha: tudo certo ✔')
