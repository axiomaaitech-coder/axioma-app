// Conferência dos códigos da guia do DAS (lib/guiaDas.ts). Rodar: npx tsx scripts/check-guia-das.mts
import assert from 'node:assert/strict'
const g = await import('../lib/guiaDas')

// Pix: monta um copia-e-cola e calcula o CRC do jeito do padrão EMV (CRC16-CCITT)
const corpo = '00020101021226830014br.gov.bcb.pix2561qrpix.bb.com.br/pix/v2/cobv/0000000000000000000000000052040000530398654048605802BR5925SECRETARIA DA RECEITA FED6008BRASILIA62070503***6304'
let crc = 0xffff
for (const ch of corpo) { crc ^= ch.charCodeAt(0) << 8; for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff }
const pix = corpo + crc.toString(16).toUpperCase().padStart(4, '0')
assert.equal(g.pixValido(pix), true)
assert.equal(g.pixValido(pix.slice(0, -1) + (pix.endsWith('0') ? '1' : '0')), false) // um dígito trocado no CRC
assert.equal(g.pixValido(pix.replace('8605', '8606')), false)                          // valor adulterado
assert.equal(g.pixValido('abc'), false)

// Código de barras de arrecadação: 4 blocos de 11 + DV (3º dígito 6/7 → módulo 10)
const mod10 = (n: string) => { let s = 0, p = 2; for (let i = n.length - 1; i >= 0; i--) { let x = Number(n[i]) * p; if (x > 9) x = Math.floor(x / 10) + (x % 10); s += x; p = p === 2 ? 1 : 2 } const r = s % 10; return r ? 10 - r : 0 }
const blocos = ['85670000000', '86050328262', '61208260120', '26100001234']
const linha = blocos.map((b) => b + mod10(b)).join('')
assert.equal(g.linhaDigitavelValida(linha), true)
assert.equal(g.linhaDigitavelValida(linha.slice(0, 5) + '9' + linha.slice(6)), false)
assert.equal(g.linhaDigitavelValida('123'), false)

// Conferência da guia lida: o que não fecha vira aviso pra pessoa
const base = { eh_das: true, tipo: 'DAS_MEI' as const, numero_documento: '07202625012345678', cnpj: '12.345.678/0001-90', valor_total: 86.05, data_vencimento: '2026-11-20', competencias: ['2026-10'], codigo_barras: linha, pix_copia_cola: pix, duvidas: [] }
assert.deepEqual(g.conferirGuia(base, '12345678000190'), { ok: true, avisos: [] })
assert.deepEqual(g.conferirGuia({ ...base, cnpj: '99999999000199' }, '12345678000190').avisos, ['cnpj_diferente'])
assert.deepEqual(g.conferirGuia({ ...base, pix_copia_cola: pix.replace('8605', '8606') }).avisos, ['pix_invalido'])
assert.deepEqual(g.conferirGuia({ ...base, competencias: ['10/2026'] }).avisos, ['competencia'])
console.log('check-guia-das OK')
