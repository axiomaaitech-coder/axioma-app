// RH na Central Intelligence: contas das portas "Pessoas" (sem banco).
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
import assert from 'node:assert/strict'
const { resumirPessoas, somarSalarios, contratoAtual, FERRAMENTAS_RH } = await import('../lib/rhIA')
const { indicador } = await import('../lib/financeiro/semantica')
const { planejarConsulta } = await import('../lib/ia/planoConsulta')
const { PORTAS, telaPodeUsarPorta } = await import('../lib/ia/portas')

const hoje = '2026-11-08'
const colabs = [
  { id: 'a', nome: 'Ana', situacao: 'ativo' }, { id: 'b', nome: 'Bruno', nome_social: 'Bia', situacao: 'ativo' },
  { id: 'c', nome: 'Caio', situacao: 'ativo' }, { id: 'd', nome: 'Davi', situacao: 'desligado' },
]
const k = (id: string, col: string, p: Partial<Record<string, unknown>> = {}) => ({ id, colaborador_id: col, cargo_id: null, departamento_id: null, data_admissao: '2026-01-01', data_termino: null, experiencia: false, data_desligamento: null, ...p }) as never
const contratos = [
  k('k1', 'a', { cargo_id: 'cg1', departamento_id: 'd1', data_admissao: '2026-10-20', experiencia: true, data_termino: '2026-11-20' }),
  k('k2', 'b', { departamento_id: 'd1', experiencia: true, data_termino: '2026-11-01' }),
  k('k3', 'c', { cargo_id: 'cg1' }),
  k('k4old', 'c', { data_admissao: '2025-01-01', departamento_id: 'd1' }),      // contrato antigo da mesma pessoa
  k('k5', 'd', { data_desligamento: '2026-11-05' }),
]
const nomes = { cargos: new Map([['cg1', 'Vendedor']]), deps: new Map([['d1', 'Comercial']]) }
const r = resumirPessoas(colabs as never, contratos, nomes, hoje)
assert.equal(r.ativos, 3); assert.deepEqual(r.por_situacao, { ativo: 3, desligado: 1 })
assert.equal((contratoAtual(contratos as { id: string; colaborador_id: string; data_admissao: string }[] as never[]).get('c') as unknown as { id: string }).id, 'k3', 'vale o contrato mais recente')
assert.deepEqual(r.ativos_por_departamento, { Comercial: 2, 'sem departamento': 1 })
assert.deepEqual(r.ativos_por_cargo, { Vendedor: 2, 'sem cargo': 1 })
assert.deepEqual(r.experiencia_termina_em_30_dias, [{ nome: 'Ana', termina_em: '2026-11-20', dias: 12 }])
assert.deepEqual(r.experiencia_vencida, [{ nome: 'Bia', terminou_em: '2026-11-01' }], 'nome social quando houver')
assert.equal(r.admissoes_ultimos_30_dias, 1); assert.equal(r.desligamentos_ultimos_30_dias, 1)

// Salários: vigente hoje (futuro não conta), só mensais somam, centavos exatos
const remun = [
  { contrato_id: 'k1', vigencia_inicio: '2026-10-20', und_sal_fixo: 5, valor: 2500.1 },
  { contrato_id: 'k1', vigencia_inicio: '2026-12-01', und_sal_fixo: 5, valor: 9999 },     // reajuste futuro: fora
  { contrato_id: 'k2', vigencia_inicio: '2026-01-01', und_sal_fixo: 5, valor: 1621.2 },
  { contrato_id: 'k3', vigencia_inicio: '2026-01-01', und_sal_fixo: 1, valor: 15 },       // por hora: fora da soma
]
const s = somarSalarios([contratos[0], contratos[1], contratos[2]] as never, remun, nomes.deps, hoje)
assert.equal(s.soma_mensal, 4121.3); assert.equal(s.contratos_mensais, 2); assert.equal(s.media_mensal, 2060.65)
assert.equal(s.nao_mensais, 1); assert.deepEqual(s.por_departamento, { Comercial: 4121.3 })
assert.equal(somarSalarios([k('z', 'z')], [], nomes.deps, hoje).sem_salario_cadastrado, 1)

// Catálogo, plano e portas
assert.equal(indicador('funcionarios')?.indisponivel, undefined); assert.equal(indicador('funcionarios')?.ferramenta, 'rh_pessoas')
assert.equal(indicador('folha')?.indisponivel, true, 'folha completa continua indisponível (encargos e provisões: Fase 4)')
assert.equal(indicador('salarios_base')?.ferramenta, 'rh_salarios')
const p = planejarConsulta('Quantos funcionários ativos temos?')
assert.deepEqual(p.portas, ['rh_pessoas']); assert.deepEqual(p.indisponiveis, [])
const f = planejarConsulta('Quanto pago de folha de pagamento?')
assert.ok(f.portas.includes('rh_salarios')); assert.deepEqual(f.indisponiveis, ['folha'], 'avisa que a folha completa não existe e mostra o salário-base')
for (const n of FERRAMENTAS_RH.map((x) => x.name)) { assert.ok(PORTAS[n], `porta ${n}`); assert.ok(telaPodeUsarPorta('rh-colaboradores', n)); assert.ok(telaPodeUsarPorta('rh-estrutura', n)) }
assert.equal(telaPodeUsarPorta('ia-tributaria', 'rh_salarios'), false, 'IA Tributária não abre salário de ninguém')
assert.ok(telaPodeUsarPorta('rh', 'rh_alertas')); assert.ok(planejarConsulta('Tem algum risco trabalhista no RH?').portas.includes('rh_alertas'))
assert.equal(indicador('rh_alertas')?.ferramenta, 'rh_alertas')
console.log('check-rh-ia ok')
