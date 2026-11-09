// Indicadores de CFO para pessoas: contas conferidas à mão (números da Horizonte de exemplo).
import assert from 'node:assert/strict'
const I = await import('../lib/rhIndicadores')

const r = I.indicadoresPessoas({ pessoas: 2, custoPessoalMensal: 9288, receitaMediaMensal: 8166.79, lucroMedioMensal: 6393.69, folhaForaDaDre: true,
  centros: [{ nome: 'Loja', headcountCadastrado: 3, pessoasRh: 1 }, { nome: 'Escritório', headcountCadastrado: 1, pessoasRh: 1 }, { nome: 'Depósito', headcountCadastrado: null, pessoasRh: 0 }] })
assert.equal(r.pessoal_sobre_faturamento_pct, 113.7) // 9.288,00 ÷ 8.166,79
assert.equal(r.faturamento_por_pessoa, 4083.4)       // 8.166,79 ÷ 2
assert.equal(r.custo_medio_por_pessoa, 4644)         // 9.288,00 ÷ 2
assert.equal(r.lucro_por_pessoa, 3196.85)            // 6.393,69 ÷ 2
assert.deepEqual(r.centros.map((c) => c.confere), [false, true, null])
assert.equal(r.alertas.length, 3)
// sem pessoas ou sem DRE: não divide por zero, não inventa
const v = I.indicadoresPessoas({ pessoas: 0, custoPessoalMensal: 0, receitaMediaMensal: null, lucroMedioMensal: null })
assert.equal(v.faturamento_por_pessoa, null); assert.equal(v.pessoal_sobre_faturamento_pct, null); assert.equal(v.alertas.length, 0)
// IA: perguntas de CFO abrem a porta, nas telas certas
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
const { telaPodeUsarPorta } = await import('../lib/ia/portas')
for (const q of ['quanto da minha receita vai para pessoal?', 'qual o faturamento por funcionário?', 'o headcount dos centros de custo está certo?', 'qual o peso da folha?'])
  assert.ok(planejarConsulta(q, 'rh').portas.includes('rh_indicadores_pessoas'), q)
assert.ok(telaPodeUsarPorta('centros-custo', 'rh_indicadores_pessoas') && telaPodeUsarPorta('ia-tributaria', 'rh_indicadores_pessoas') && !telaPodeUsarPorta('pdv', 'rh_indicadores_pessoas'))
console.log('check-rh-indicadores ok')
