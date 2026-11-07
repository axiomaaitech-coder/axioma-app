// Valores conferidos à mão contra a lei: LC 123/2006 (tabelas do Simples), Lei 9.249/95 arts. 15 e 20 (presunção),
// LC 224/2025 art. 4º § 5º (presunção 10% maior acima de R$ 5 milhões/ano), Lei 9.430/96 art. 2º (estimativa mensal).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'http://localhost'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'x'
import assert from 'node:assert/strict'
const { calcularAliquotaSimples, calcularLucroPresumido, calcularLucroReal, impostoDaEmpresa, simularRegimes, calcularCargaTributaria } = await import('../lib/iaTributariaHelpers')
const { fK } = await import('../lib/cfoCore')
const perto = (a: number, b: number) => assert.ok(Math.abs(a - b) < 0.005, `${a} deveria ser ${b}`)

perto(calcularAliquotaSimples(1000000, 'I'), 8.45)
perto(calcularAliquotaSimples(1000000, 'III'), 12.436)
perto(calcularAliquotaSimples(1000000, 'IV'), 10.022)
perto(calcularAliquotaSimples(1000000, 'V'), 18.79)

// Presumido: comércio tem CSLL sobre 12%, não 8%
const com = calcularLucroPresumido(100000, 'comercio_industria')
perto(com.irpj, 1200); perto(com.csll, 1080); perto(com.total, 5930)
perto(calcularLucroPresumido(100000, 'servicos', 5).total, 17530)
// Acima de R$ 5 milhões/ano: só o excedente tem a presunção 10% maior
perto(calcularLucroPresumido(1000000, 'comercio_industria').total, 67096.67)

// Lucro Real pelo lucro; sem o lucro, pela estimativa mensal da lei
perto(calcularLucroReal(100000, 30000, 'servicos', 5).total, 22450)
perto(calcularLucroReal(100000, null, 'comercio_industria').total, 11530)
perto(calcularLucroReal(100000, -5000, 'comercio_industria').total, 9250) // prejuízo não gera IRPJ/CSLL

// Todo módulo usa o cadastro da empresa: comércio no Simples é Anexo I, e Real olha o lucro
perto(impostoDaEmpresa({ regime_tributario: 'simples', atividade_fiscal: 'comercio' }, 1000000, 100000), 8450)
perto(impostoDaEmpresa({ regime_tributario: 'lucro_presumido', atividade_fiscal: 'comercio' }, 1200000, 100000), 5930)
perto(impostoDaEmpresa({ regime_tributario: 'lucro_real', atividade_fiscal: 'servico', aliquota_iss_pct: 5 }, 1200000, 100000, 30000), 22450)

// Comércio: Presumido e Real ficam sem ICMS/IPI, então não podem ser apontados como mais baratos que o Simples
const dados = { receita_bruta_12m: 1200000, receita_bruta_mensal: 100000, custos_fixos_mensal: 20000, custos_variaveis_mensal: 50000, lucro_bruto_mensal: 50000,
  regime_atual: 'simples', atividade_fiscal: 'comercio', setor: '', cnae: '', obrigacoes_pendentes: 0, obrigacoes_vencidas: 0, total_obrigacoes: 0 }
const sims = simularRegimes(dados)
for (const s of sims.filter((x) => x.regime === 'presumido' || x.regime === 'real')) { assert.equal(s.parcial, true); assert.equal(s.economia_vs_atual, 0) }
assert.equal(sims.filter((s) => s.elegivel && !s.parcial)[0].regime, 'simples')
perto(calcularCargaTributaria(dados).imposto_mensal, 100000 * calcularAliquotaSimples(1200000, 'I') / 100)
assert.equal(calcularCargaTributaria({ ...dados, regime_atual: 'lucro_real' }).composicao[0].nome, 'IRPJ')

// Eixo de gráfico não pode arredondar a ponto de mudar o valor
assert.equal(fK(1500), 'R$ 1,5k')
assert.ok(fK(6.9).includes('6,90'))
console.log('check-impostos: ok')
