// Importação de colaboradores: colunas, datas e as mesmas regras do banco (sem gravar nada).
import assert from 'node:assert/strict'
const I = await import('../lib/rhImportacao')

const m = I.mapearCabecalho(['Nome', 'Matrícula', 'CPF', 'Data de Admissão', 'Horas semanais', 'Coluna estranha', 'Salário'])
assert.deepEqual(m.mapa, ['nome', 'matricula', 'cpf', 'data_admissao', 'horas_semana', null, 'salario'])
assert.deepEqual(m.desconhecidas, ['Coluna estranha']); assert.deepEqual(m.faltando, [])
assert.deepEqual(I.mapearCabecalho(['nome']).faltando, ['Matrícula', 'Data de admissão'])

assert.equal(I.lerData('03/11/2026'), '2026-11-03'); assert.equal(I.lerData('2026-11-03'), '2026-11-03')
assert.equal(I.lerData(46329), '2026-11-03', 'número de série do Excel'); assert.equal(I.lerData('31/02/2026'), null); assert.equal(I.lerData('xx'), null)

const ctx = { hoje: '2026-11-08', cargos: new Map([['vendedor', 'cg1']]), deps: new Map([['comercial', 'd1']]), categorias: new Set(['101', '103', '111']),
  matriculas: new Set(['m9']), cpfs: new Set<string>(), podePessoais: true, podeSalario: true }
const base = { nome: 'Maria Exemplo', matricula: 'M1', data_admissao: '03/11/2026', horas_semana: '44' }
const r = I.validarLinhas([
  { ...base, cpf: '529.982.247-25', data_nascimento: '10/05/1990', sexo: 'f', cargo: 'Vendedor', departamento: 'Logística', salario: '2.500,00', tipo_contrato: 'experiência', data_termino: '31/01/2027', ja_enviado_esocial: 'Sim' },
  { ...base, matricula: 'M1' },                                              // matrícula repetida na planilha
  { ...base, matricula: 'M9' },                                              // matrícula que já existe
  { ...base, matricula: 'M3', tipo_contrato: 'experiência', data_termino: '05/02/2027' },   // 95 dias
  { ...base, matricula: 'M4', cpf: '52998224724', data_nascimento: '10/05/1990' },        // CPF errado
  { ...base, matricula: 'M5', categoria: '103' },                            // aprendiz indeterminado
  { ...base, matricula: 'M6', situacao: 'desligado' },                       // sem data de desligamento
  { ...base, matricula: 'M7', categoria: '111', horas_semana: '' },          // intermitente sem horas: ok
], ctx)
const ok = r[0].pronta!
assert.equal(r[0].erros.length, 0); assert.equal(ok.contrato.tp_contr, 2); assert.equal(ok.contrato.experiencia, true)
assert.equal(ok.contrato.cargo_id, 'cg1'); assert.equal(ok.contrato.departamento_id, null); assert.equal(r[0].avisos.length, 1, 'departamento não cadastrado vira aviso')
assert.equal(ok.contrato.situacao_esocial, 'enviado_pelo_contador'); assert.equal(ok.pessoal!.cpf, '52998224725'); assert.equal(ok.pessoal!.sexo, 'F'); assert.equal(ok.remuneracao!.valor, 2500)
assert.equal(r[0].linha, 2, 'linha 2 da planilha (a 1 é o cabeçalho)')
for (const i of [1, 2, 3, 4, 5, 6]) assert.ok(r[i].erros.length > 0 && r[i].pronta === null, `linha ${i} deveria ter erro`)
assert.match(r[3].erros[0].pt, /90 dias/); assert.match(r[4].erros[0].pt, /CPF inválido/)
assert.equal(r[7].erros.length, 0); assert.equal(r[7].pronta!.contrato.qtd_hrs_sem, null)

// sem liberação: CPF e salário ficam de fora com aviso, a pessoa entra
const semAcesso = I.validarLinhas([{ ...base, matricula: 'Z1', cpf: '52998224725', data_nascimento: '10/05/1990', salario: '3000' }], { ...ctx, podePessoais: false, podeSalario: false })[0]
assert.equal(semAcesso.erros.length, 0); assert.equal(semAcesso.pronta!.pessoal, null); assert.equal(semAcesso.pronta!.remuneracao, null); assert.equal(semAcesso.avisos.length, 2)
// Excel com CPF/CEP numérico perde o zero da frente: 01234567890 → 1234567890. Tem de voltar.
const zero = I.validarLinhas([{ ...base, matricula: 'Z2', cpf: 1234567890, data_nascimento: '10/05/1990', cep: 1310100 }], { ...ctx, podePessoais: true })[0]
assert.equal(zero.erros.length, 0, 'CPF 012.345.678-90 é válido')
assert.equal(zero.pronta!.pessoal!.cpf, '01234567890'); assert.equal(zero.pronta!.pessoal!.cep, '01310100')
console.log('check-rh-importacao ok')
// Planilha completa: mesmas colunas do modelo, e o que não pode ver sai vazio
{
  const nomes = { cargos: new Map([['cg1', 'Vendedor']]), deps: new Map<string, string>() }
  const c = { nome: 'Ana', situacao: 'ativo' }, k = { matricula: 'M1', cod_categ: '101', data_admissao: '2026-11-03', tp_contr: 2, experiencia: true, data_termino: '2026-12-31', qtd_hrs_sem: 44, cargo_id: 'cg1', situacao_esocial: 'rascunho' }
  const p = { cpf: '52998224725', data_nascimento: '1990-05-10', cep: '01310100' }
  const tudo = I.linhaPlanilha(c, k, p, 2500, nomes, { pessoais: true, salario: true })
  assert.deepEqual(Object.keys(tudo), I.COLUNAS.map((x) => x.titulo))
  assert.equal(tudo['Data de admissão'], '03/11/2026'); assert.equal(tudo['Tipo de contrato'], 'experiência'); assert.equal(tudo['Cargo'], 'Vendedor'); assert.equal(tudo['CPF'], '52998224725'); assert.equal(tudo['Salário mensal (R$)'], 2500)
  const restrito = I.linhaPlanilha(c, k, p, 2500, nomes, { pessoais: false, salario: false })
  assert.equal(restrito['CPF'], ''); assert.equal(restrito['Salário mensal (R$)'], ''); assert.equal(restrito['CEP'], '')
  // ida e volta: a linha exportada passa de novo na conferência da importação (com outra matrícula)
  const mapa = I.mapearCabecalho(Object.keys(tudo)).mapa
  const volta = Object.fromEntries(mapa.map((ch, i) => [ch, Object.values(tudo)[i]]).filter(([ch]) => ch)) as Record<string, unknown>
  const r = I.validarLinhas([{ ...volta, matricula: 'NOVA1' }], ctx)[0]
  assert.equal(r.erros.length, 0, 'planilha exportada volta pela importação sem erro'); assert.equal(r.pronta!.contrato.experiencia, true)
  console.log('planilha completa: ida e volta ok')
}
