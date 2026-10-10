// Conferência das regras do Painel de Risco. Rodar: npx tsx scripts/check-risco.mts
import assert from 'node:assert/strict'
import { avaliarRiscos, notaGeral, nivelDaNota } from '../lib/riscoHelpers'
import type { NumerosRetrato } from '../lib/ia/retratoEmpresa'

const base: NumerosRetrato = {
  receitaMensal: 100000, receitas6m: [], custoFixoMensal: 30000, custoVariavelMensal: 40000, aliquotaEfetivaPct: 6, impostoMensal: 6000,
  jurosMensal: 1000, lucroMensal: 20000, margemPct: 20, custoFixoSobreReceitaPct: 30, pontoEquilibrioMensal: 60000,
  caixa: 150000, folegoMeses: null, dividaTotal: 100000, dividaSobreReceitaAnualPct: 8.3,
  aReceberAberto: 50000, aReceberVencido: 1000, aReceber30d: 20000, inadimplenciaPct: 2,
  aPagarAberto: 80000, aPagarVencido: 0, aPagar30d: 60000, concentracaoTopClientePct: 15,
  estoqueRuptura: 0, estoqueBaixo: 0, estoqueParado: 0, obrigacoesAtrasadas: 0,
}
const nota = (x: NumerosRetrato, k: string) => avaliarRiscos(x, 'pt').find((i) => i.chave === k)!.nota

// Empresa saudável: tudo 100
assert.deepEqual(avaliarRiscos(base, 'pt').map((i) => i.nota), [100, 100, 100, 100, 100, 100])
assert.equal(notaGeral(avaliarRiscos(base, 'pt')), 100)
// Caixa cobre só metade do que vence em 30 dias → 40 (risco)
assert.equal(nota({ ...base, caixa: 30000 }, 'liquidez'), 40)
assert.equal(nivelDaNota(40), 'risco')
// Caixa negativo sem nada a pagar → 15
assert.equal(nota({ ...base, caixa: -10, aPagar30d: 0 }, 'liquidez'), 15)
// Sem a receber → sem dado (não inventa nota) e fica fora da média
const semReceber = { ...base, inadimplenciaPct: null, concentracaoTopClientePct: null }
assert.equal(nota(semReceber, 'credito'), null)
assert.equal(avaliarRiscos(semReceber, 'pt').find((i) => i.chave === 'credito')!.nivel, 'sem_dado')
assert.equal(notaGeral(avaliarRiscos(semReceber, 'pt')), 100)
// Prejuízo → margem 15; dívida sem receita → 15
assert.equal(nota({ ...base, margemPct: -5 }, 'margem'), 15)
assert.equal(nota({ ...base, dividaSobreReceitaAnualPct: null }, 'endividamento'), 15)
// Obrigação fiscal atrasada derruba "atrasos" pra 40 mesmo sem conta vencida
assert.equal(nota({ ...base, obrigacoesAtrasadas: 1 }, 'atrasos'), 40)
// 70 é "atenção", 100 é "ok"
assert.equal(nivelDaNota(70), 'atencao'); assert.equal(nivelDaNota(100), 'ok')
console.log('check-risco: ok')

const { prazoMedioDias, mesesDeCaixa } = await import('../lib/riscoHelpers')
// 10 dias (R$ 100) e 30 dias (R$ 300) → ponderado = 25
assert.equal(prazoMedioDias([{ inicio: '2026-01-01', fim: '2026-01-11', valor: 100 }, { inicio: '2026-01-01', fim: '2026-01-31', valor: 300 }]), 25)
// linha sem data ou com data invertida não entra
assert.equal(prazoMedioDias([{ inicio: null, fim: '2026-01-11', valor: 100 }, { inicio: '2026-02-10', fim: '2026-02-01', valor: 50 }]), null)
assert.equal(mesesDeCaixa(30000, 10000), 3)
assert.equal(mesesDeCaixa(-5, 10000), 0)
assert.equal(mesesDeCaixa(1000, 0), null)
console.log('check-risco métricas: ok')
