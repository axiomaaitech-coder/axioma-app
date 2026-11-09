// Calendário da folha no Fluxo de Caixa: datas e valores conferidos no calendário de 2026/2027.
import assert from 'node:assert/strict'
const F = await import('../lib/rhFolhaCaixa')
const C = await import('../lib/rhCustoPessoal')

// 5º dia útil (sábado conta, domingo não)
assert.equal(F.quintoDiaUtil(2026, 11), '2026-11-06') // 1º/11 é domingo
assert.equal(F.quintoDiaUtil(2026, 12), '2026-12-05') // sábado
assert.equal(F.quintoDiaUtil(2027, 2), '2027-02-05')
// vencimento no fim de semana é antecipado
assert.equal(F.anteciparDiaUtil('2026-12-20'), '2026-12-18') // domingo → sexta
assert.equal(F.anteciparDiaUtil('2027-02-20'), '2027-02-19') // sábado → sexta
assert.equal(F.anteciparDiaUtil('2026-11-30'), '2026-11-30') // segunda fica

// folha de R$ 7.200 + encargos 576 (Simples: só FGTS 8%), 13º do ano 7.200, hoje 09/11/2026, 120 dias (até 09/03/2027)
const r = F.previsaoFolhaCaixa({ salarioMensal: 7200, encargosMensais: 576, decimoTerceiroAno: 7200, hoje: '2026-11-09', folhaJaNosCustosFixos: false })
const em = (d: string) => r.filter((x) => x.data === d).map((x) => x.valor)
assert.deepEqual(em('2026-11-06'), []) // salário de outubro já passou
assert.deepEqual(em('2026-11-20'), [576]) // FGTS de outubro
assert.deepEqual(em('2026-11-30'), [3600]) // 13º 1ª parcela
assert.deepEqual(em('2026-12-05'), [7200]) // salários de novembro
assert.deepEqual(em('2026-12-18').sort(), [3888, 576].sort()) // FGTS de nov + 2ª parcela 3.600 com 8% da 1ª (288)
assert.deepEqual(em('2027-01-06'), [7200])
assert.deepEqual(em('2027-01-20').sort(), [288, 576].sort()) // encargos da 2ª parcela + FGTS de dez
assert.deepEqual(em('2027-03-05'), [7200]); assert.deepEqual(em('2027-03-19'), []) // passou do horizonte
// folha já lançada em Custos Fixos: só o 13º (o custo fixo mensal já está na projeção)
const s = F.previsaoFolhaCaixa({ salarioMensal: 7200, encargosMensais: 576, decimoTerceiroAno: 7200, hoje: '2026-11-09', folhaJaNosCustosFixos: true })
assert.ok(s.length === 3 && s.every((x) => x.rotulo.startsWith('13º')))

// 13º proporcional (Lei 4.090, art. 1º, § 2º): admitido em 16/08 → ago tem 16 dias (≥15) → 5 avos; em 20/08 → 12 dias → 4 avos
assert.equal(C.avos13('2026-08-16', 2026), 5); assert.equal(C.avos13('2026-08-20', 2026), 4)
assert.equal(C.avos13('2025-03-10', 2026), 12); assert.equal(C.avos13('2027-01-02', 2026), 0)
const cp = C.custoPessoal({ contratos: [{ id: 'k', colaborador_id: 'c', cod_categ: '101', departamento_id: null, data_admissao: '2026-08-16' }], salario: new Map([['k', { und_sal_fixo: 5, valor: 2400 }]]), regime: 'simples', departamentos: new Map(), centros: new Map(), ano: 2026 })
assert.equal(cp.decimo_terceiro_ano, 1000) // 2.400 × 5/12
assert.equal(cp.encargos_mensais_sobre_salario, 192) // 8% de 2.400
console.log('check-rh-folha-caixa ok')
