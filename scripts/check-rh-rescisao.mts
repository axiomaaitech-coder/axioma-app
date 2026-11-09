// Teste do cálculo da rescisão (lib/rhRescisao.ts) com casos conferidos à mão. Rodar: npx tsx scripts/check-rh-rescisao.mts
import assert from 'node:assert/strict'
import { calcularRescisao, REGRAS_2026 as R, inssProgressivo, irrf, diasAvisoProporcional, avos13, avosFerias, diasFeriasPorFaltas, salarioMensalDe } from '../lib/rhRescisao'

const v = (res: ReturnType<typeof calcularRescisao>, nat: string, nome?: RegExp) => res.verbas.filter((x) => x.nat === nat && (!nome || nome.test(x.nome))).reduce((s, x) => s + x.valor, 0)

// peças
assert.equal(inssProgressivo(1621, R.inss), 121.58, '7,5% até o salário mínimo')
assert.equal(inssProgressivo(10000, R.inss), inssProgressivo(8475.55, R.inss), 'para no teto')
assert.equal(irrf(6000, 0, R, true), 394.54, 'exemplo oficial da Receita: R$ 6.000 → 574,29 − 179,75')
assert.equal(irrf(4900, 0, R, true), 0, 'até R$ 5.000 zera')
assert.equal(diasAvisoProporcional('2024-03-01', '2026-11-20'), 36)
assert.equal(diasAvisoProporcional('2000-01-01', '2026-11-20'), 90, 'teto de 90 dias')
assert.equal(avos13('2026-02-16', '2026-11-10'), 8, 'fevereiro com 13 dias e novembro com 10 não contam')
assert.equal(avosFerias('2026-02-16', '2026-11-10'), 9)
assert.deepEqual([0, 5, 6, 14, 15, 23, 24, 32, 33].map(diasFeriasPorFaltas), [30, 30, 24, 24, 18, 18, 12, 12, 0])
assert.equal(salarioMensalDe(1, 10, 44), 2200, 'horista 44h = 220 horas')

// A) dispensa sem justa causa, 2 anos e 8 meses, aviso indenizado de 36 dias, saldo do FGTS R$ 5.000
const a = calcularRescisao({ motivo: '02', admissao: '2024-03-01', desligamento: '2026-11-20', codCateg: '101', tpContr: 1, salarioMensal: 3000, aviso: 'indenizado', saldoFgts: 5000 }, R)
assert.equal(a.avisoIndenizadoDias, 36); assert.equal(a.projecao, '2026-12-26')
assert.equal(v(a, '6003'), 3600); assert.equal(v(a, '6000'), 2000); assert.equal(v(a, '6002'), 2750); assert.equal(v(a, '6001'), 250)
assert.equal(v(a, '6006'), 3333.33, 'férias proporcionais 10/12 + 1/3 com a projeção do aviso')
assert.equal(a.inss.mensal, 155.69); assert.equal(a.inss.decimo, 248.6); assert.equal(a.irrf.mensal, 0); assert.equal(a.irrf.decimo, 0)
assert.equal(a.bruto, 11933.33); assert.equal(a.descontos, 404.29); assert.equal(a.liquido, 11529.04)
assert.equal(a.fgts.deposito, 688); assert.equal(a.fgts.multa, 2275.2); assert.equal(a.prazoPagamento, '2026-11-30')

// B) justa causa, 1 período de férias vencido (no prazo), 1ª parcela do 13º já paga
const b = calcularRescisao({ motivo: '01', admissao: '2025-01-10', desligamento: '2026-11-20', codCateg: '101', tpContr: 1, salarioMensal: 2400, feriasVencidas: 1, adiantamento13: 500 }, R)
assert.equal(v(b, '6000'), 1600); assert.equal(v(b, '6007'), 3200); assert.equal(v(b, '6002') + v(b, '6006') + v(b, '6003'), 0, 'justa causa perde 13º e férias proporcionais e não tem aviso')
assert.equal(v(b, '9214'), 500); assert.equal(b.inss.mensal, 120); assert.equal(b.liquido, 4180); assert.equal(b.fgts.multaPct, 0)

// C) pedido de demissão sem cumprir o aviso (desconto de 30 dias)
const c = calcularRescisao({ motivo: '07', admissao: '2026-02-16', desligamento: '2026-11-10', codCateg: '101', tpContr: 1, salarioMensal: 2000, aviso: 'descontado' }, R)
assert.equal(v(c, '6901'), 2000); assert.equal(v(c, '6000'), 666.67); assert.equal(v(c, '6002'), 1333.33); assert.equal(v(c, '6006'), 2000)
assert.equal(c.bruto, 4000); assert.equal(c.descontos, 2150); assert.equal(c.liquido, 1850)

// D) acordo (art. 484-A), 6 anos, R$ 8.000, 2 dependentes: metade do aviso, multa 20%, IR mensal com deduções legais
const d = calcularRescisao({ motivo: '33', admissao: '2020-01-02', desligamento: '2026-06-30', codCateg: '101', tpContr: 1, salarioMensal: 8000, dependentesIR: 2, saldoFgts: 40000 }, R)
assert.equal(d.avisoDias, 48); assert.equal(d.avisoIndenizadoDias, 24); assert.equal(v(d, '6003'), 6400); assert.equal(v(d, '6000'), 8000)
assert.equal(v(d, '6002'), 4000); assert.equal(v(d, '6001'), 666.67); assert.equal(v(d, '6006'), 6222.22)
assert.equal(d.inss.mensal, 921.51); assert.equal(d.irrf.mensal, 933.58); assert.equal(d.inss.decimo, 454.85); assert.equal(d.irrf.decimo, 0)
assert.equal(d.fgts.multaPct, 20)

// E) contrato de experiência rompido pela empresa: art. 479 (metade dos dias restantes) + multa 40%
const e = calcularRescisao({ motivo: '03', admissao: '2026-09-01', desligamento: '2026-10-15', codCateg: '101', tpContr: 2, dataTermino: '2026-11-29', salarioMensal: 3000, saldoFgts: 400 }, R)
assert.equal(v(e, '6104'), 2250, '45 dias restantes ÷ 2 × R$ 100'); assert.equal(e.fgts.multaPct, 40); assert.equal(v(e, '6003'), 0)
// com cláusula assecuratória vira dispensa comum (aviso, sem art. 479)
const e2 = calcularRescisao({ motivo: '03', admissao: '2026-09-01', desligamento: '2026-10-15', codCateg: '101', tpContr: 2, dataTermino: '2026-11-29', clauAssec: true, salarioMensal: 3000 }, R)
assert.equal(v(e2, '6104'), 0); assert.ok(v(e2, '6003') > 0)

// F) culpa recíproca: metade do aviso, do 13º e das férias proporcionais; doméstico sem multa na rescisão
const f = calcularRescisao({ motivo: '05', admissao: '2024-03-01', desligamento: '2026-11-20', codCateg: '101', tpContr: 1, salarioMensal: 3000 }, R)
assert.equal(v(f, '6002'), 1375); assert.equal(f.fgts.multaPct, 20)
assert.equal(calcularRescisao({ motivo: '02', admissao: '2024-03-01', desligamento: '2026-11-20', codCateg: '104', tpContr: 1, salarioMensal: 1621 }, R).fgts.multaPct, 0)
assert.equal(calcularRescisao({ motivo: '06', admissao: '2026-01-05', desligamento: '2027-01-04', codCateg: '103', tpContr: 2, dataTermino: '2027-01-04', salarioMensal: 1200 }, R).fgts.aliquota, 0.02, 'aprendiz: FGTS 2%')
assert.throws(() => calcularRescisao({ motivo: '11' as never, admissao: '2024-01-01', desligamento: '2026-01-01', codCateg: '101', tpContr: 1, salarioMensal: 2000 }, R))
console.log('check-rh-rescisao ok')
