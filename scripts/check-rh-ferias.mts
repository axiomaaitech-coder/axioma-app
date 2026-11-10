// Controle de férias: períodos, dobra e regras da CLT, conferidos à mão no calendário (hoje = 09/11/2026).
import assert from 'node:assert/strict'
const F = await import('../lib/rhFerias')
const hoje = '2026-11-09'

// art. 130: dias pelas faltas
assert.deepEqual([0, 5, 6, 14, 15, 23, 24, 32, 33].map(F.diasPorFaltas), [30, 30, 24, 24, 18, 18, 12, 12, 0])

// admitida em 10/03/2025: 1º período fechou em 09/03/2026, prazo até 09/03/2027 (120 dias); 2º período em aquisição
let p = F.periodosFerias({ dataAdmissao: '2025-03-10', hoje, partes: [] })
assert.equal(p.length, 2)
assert.deepEqual([p[0].aquisitivo_fim, p[0].concessivo_fim, p[0].status, p[0].dias_para_vencer, p[0].saldo], ['2026-03-09', '2027-03-09', 'a_conceder', 120, 30])
assert.equal(p[1].status, 'em_aquisicao')

// admitido em 02/01/2024: 1º período venceu em 01/01/2026 sem férias → 30 dias em dobro; 2º vence em 01/01/2027 (53 dias)
p = F.periodosFerias({ dataAdmissao: '2024-01-02', hoje, partes: [] })
assert.deepEqual([p[0].status, p[0].dias_em_dobro], ['vencida', 30])
assert.deepEqual([p[1].status, p[1].dias_para_vencer], ['a_conceder', 53])
assert.equal(F.valorDobra(3000, 30), 4000) // 3.000 ÷ 30 × 30 × 4/3

// parte que atravessa o fim do prazo: 20/12/2025 a 08/01/2026, prazo 01/01/2026 → 7 dias em dobro; saldo 10 vencido → 17 no total
p = F.periodosFerias({ dataAdmissao: '2024-01-02', hoje, partes: [{ aquisitivo_inicio: '2024-01-02', gozo_inicio: '2025-12-20', dias: 20, abono_dias: 0 }] })
assert.deepEqual([p[0].partes[0].fim, p[0].partes[0].em_dobro, p[0].saldo, p[0].status, p[0].dias_em_dobro], ['2026-01-08', 7, 10, 'vencida', 17])
assert.equal(p[0].partes[0].pagamento_ate, '2025-12-18') // art. 145: 2 dias antes

// pagamento das férias: 20 dias + 10 vendidos de R$ 3.000 → 3.000 ÷ 30 × 30 × 4/3 = 4.000
assert.equal(F.valorFerias(3000, 20, 10), 4000)

// conferir parte nova no período 02/01/2025–01/01/2026 (prazo até 01/01/2027)
const per = F.periodosFerias({ dataAdmissao: '2024-01-02', hoje, partes: [] })[1]
let c = F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-01', dias: 10, abono_dias: 0 }, hoje)
assert.deepEqual(c.erros, []); assert.ok(c.avisos.some((a) => /30 dias/.test(a))) // 22 dias até o início
assert.ok(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-01', dias: 4, abono_dias: 0 }, hoje).erros.some((e) => /menos de 5/.test(e)))
assert.ok(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-01', dias: 19, abono_dias: 11 }, hoje).erros.some((e) => /1\/3/.test(e)))
assert.deepEqual(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-01', dias: 20, abono_dias: 10 }, hoje).erros, [])
assert.ok(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2025-12-15', dias: 20, abono_dias: 0 }, hoje).erros.some((e) => /período aquisitivo/.test(e)))
assert.ok(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-04', dias: 20, abono_dias: 0 }, hoje).avisos.some((a) => /sexta ou no sábado/.test(a))) // 04/12/2026 é sexta
assert.ok(F.conferirParte(per, { aquisitivo_inicio: per.aquisitivo_inicio, gozo_inicio: '2026-12-21', dias: 20, abono_dias: 0 }, hoje).avisos.some((a) => /dobro/.test(a))) // termina 09/01/2027
// 3 partes de 10: nenhuma com 14 → erro na 3ª; 2 partes de 10 com 10 sobrando: também não dá mais para ter 14
const comDuas = F.periodosFerias({ dataAdmissao: '2024-01-02', hoje, partes: [
  { id: 'a', aquisitivo_inicio: '2025-01-02', gozo_inicio: '2026-01-05', dias: 10, abono_dias: 0 }] })[1]
assert.ok(F.conferirParte(comDuas, { aquisitivo_inicio: '2025-01-02', gozo_inicio: '2026-12-01', dias: 10, abono_dias: 0 }, hoje).erros.some((e) => /14 dias/.test(e)))
assert.deepEqual(F.conferirParte(comDuas, { aquisitivo_inicio: '2025-01-02', gozo_inicio: '2026-12-01', dias: 20, abono_dias: 0 }, hoje).erros, [])
// sobreposição com outra parte
assert.ok(F.conferirParte(comDuas, { aquisitivo_inicio: '2025-01-02', gozo_inicio: '2026-01-10', dias: 14, abono_dias: 0 }, hoje).erros.some((e) => /coincide/.test(e)))
// desligado: períodos param no desligamento
assert.equal(F.periodosFerias({ dataAdmissao: '2024-01-02', hoje, dataDesligamento: '2025-06-30', partes: [] }).length, 2)
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
for (const q of ['quem está com férias vencendo?', 'tenho férias em dobro?']) assert.ok(planejarConsulta(q, 'rh').portas.includes('rh_ferias'), q)
console.log('check-rh-ferias ok')
