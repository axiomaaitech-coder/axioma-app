// Conferência do motor de IA (partes sem IA): triagem, conferência de números,
// setores, manuais e alertas. Rodar: npx tsx scripts/check-ia-motor.mts
import assert from 'node:assert/strict'
import type { NumerosRetrato } from '../lib/ia/retratoEmpresa'
// O cálculo de imposto cria o cliente do Supabase ao carregar: valores falsos bastam (nada aqui acessa a rede).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { triagemPorRegra, conferirNumeros } = await import('../lib/ia/motor')
const { setorDaEmpresa, SETORES } = await import('../lib/ia/setores')
const { escolherManuais } = await import('../lib/ia/manuais')
const { detectarAlertas } = await import('../lib/ia/retratoEmpresa')

// Triagem: nível sai da pergunta
assert.equal(triagemPorRegra('Quanto faturei este mês?', 1), 'rotina')
assert.equal(triagemPorRegra('Por que meu lucro caiu?', 1), 'analise')
assert.equal(triagemPorRegra('Monte um plano para os próximos 3 anos', 1), 'estrategica')
assert.equal(triagemPorRegra('Vale a pena abrir uma nova loja?', 1), 'estrategica')
assert.equal(triagemPorRegra('bom dia', 0), null) // dúvida → IA classifica
console.log('OK — triagem por regra')

// Conferência: número do retrato passa; inventado é pego; estimativa marcada passa
const base = 'Receita R$ 50.000/mês · custo fixo R$ 12.345/mês'
assert.deepEqual(conferirNumeros('Sua receita é R$ 50.000 e o fixo R$ 12.345.', base), [])
assert.deepEqual(conferirNumeros('Seu lucro foi R$ 99.999.', base), ['R$ 99.999'])
assert.deepEqual(conferirNumeros('Economia estimada de R$ 1.234 por mês.', base), [])
// Valores vindos das ferramentas de consulta (números puros) passam na conferência
const { reaisDasConsultas } = await import('../lib/ia/motor')
const consulta = reaisDasConsultas(['{"itens":[{"saldo":4321.5}]}'])
assert.deepEqual(conferirNumeros('A maior conta é de R$ 4.321,50.', `${base}\n${consulta}`), [])
console.log('OK — conferência de números (inclusive vindos das ferramentas)')

// Ferramentas: esquema estrito válido (todo campo obrigatório, nada extra)
const { FERRAMENTAS } = await import('../lib/ia/ferramentas')
for (const f of FERRAMENTAS) {
  assert.equal(f.input_schema.additionalProperties, false, f.name)
  assert.deepEqual([...f.input_schema.required].sort(), Object.keys(f.input_schema.properties).sort(), f.name)
}
assert.equal(new Set(FERRAMENTAS.map((f) => f.name)).size, FERRAMENTAS.length)
console.log(`OK — ${FERRAMENTAS.length} ferramentas de consulta com esquema estrito`)

// Setores: todas as divisões CNAE de 01 a 99 que existem caem em algum setor
const DIVISOES = [1,2,3,5,6,7,8,9,...Array.from({length:24},(_,i)=>10+i),35,36,37,38,39,41,42,43,45,46,47,49,50,51,52,53,55,56,58,59,60,61,62,63,64,65,66,68,69,70,71,72,73,74,75,77,78,79,80,81,82,84,85,86,87,88,90,91,92,93,94,95,96,97,99]
for (const d of DIVISOES) assert.ok(setorDaEmpresa(String(d).padStart(2, '0') + '11-1/00'), `divisão ${d} sem setor`)
assert.equal(setorDaEmpresa('24.21-1-00')?.id, 'metalurgia')
assert.equal(setorDaEmpresa('0115-6/00')?.id, 'agro')
assert.equal(setorDaEmpresa(null, 'Loja de roupas')?.id, 'varejo') // vende roupa = comércio
assert.equal(setorDaEmpresa(null, 'Confecção de roupas')?.id, 'textil_vestuario') // fabrica roupa = indústria
assert.equal(new Set(SETORES.map((s) => s.id)).size, SETORES.length) // ids únicos
console.log(`OK — setores (${SETORES.length} setores, ${DIVISOES.length} divisões CNAE cobertas)`)

// Manuais: pergunta + tela, no máximo 3
assert.deepEqual(escolherManuais('quanto pago de imposto?', 'ia-financeira').map((m) => m.id), ['tributario', 'caixa', 'custos'])
assert.ok(escolherManuais('a b c d e f g', 'nexus').length <= 3)
console.log('OK — manuais')

// Alertas
const zero: NumerosRetrato = { receitaMensal: 10000, receitas6m: [10000, 9000, 9000, 8000, 8000, 7000], custoFixoMensal: 5000, custoVariavelMensal: 6000, aliquotaEfetivaPct: 6, impostoMensal: 600, jurosMensal: 0, lucroMensal: -1600, margemPct: -16, custoFixoSobreReceitaPct: 50, pontoEquilibrioMensal: null, caixa: 4000, folegoMeses: 2, dividaTotal: 0, dividaSobreReceitaAnualPct: 0, aReceberAberto: 0, aReceberVencido: 0, aReceber30d: 0, inadimplenciaPct: null, aPagarAberto: 0, aPagarVencido: 0, aPagar30d: 0, concentracaoTopClientePct: null, estoqueRuptura: 0, estoqueBaixo: 0, estoqueParado: 0, obrigacoesAtrasadas: 0 }
const al = detectarAlertas(zero)
assert.ok(al[0].includes('2 meses') && al.includes('empresa dando prejuízo') && al.some((a) => a.includes('20%')))
console.log('OK — alertas da situação')
