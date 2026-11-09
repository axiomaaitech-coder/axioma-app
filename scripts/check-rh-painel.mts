// Painel do RH e Radar de Risco: cada alerta só aparece quando o dado mostra; cotas pela lei.
import assert from 'node:assert/strict'
const P = await import('../lib/rhPainel')

assert.equal(P.cotaPcd(99), 0); assert.equal(P.cotaPcd(100), 2); assert.equal(P.cotaPcd(201), 7); assert.equal(P.cotaPcd(1001), 51)

const hoje = '2026-11-08'
const colabs = [
  { id: 'a', nome: 'Ana', situacao: 'ativo' }, { id: 'b', nome: 'Bruno', situacao: 'ativo' }, { id: 'c', nome: 'Caio', situacao: 'ativo' },
  { id: 'd', nome: 'Davi', situacao: 'desligado' }, { id: 'e', nome: 'Eva', situacao: 'pre_admissao' },
]
const k = (id: string, col: string, p: Record<string, unknown> = {}) => ({ id, colaborador_id: col, cargo_id: 'cg', departamento_id: 'd1', data_admissao: '2026-01-10', data_termino: null, experiencia: false, data_desligamento: null, situacao_esocial: 'enviado_pelo_contador', cod_categ: '101', estabelecimento_id: 'e1', ...p }) as never
const contratos = [
  k('k1', 'a', { experiencia: true, data_admissao: '2026-08-01', data_termino: '2026-10-29' }),           // experiência vencida
  k('k2', 'b', { experiencia: true, data_admissao: '2026-10-01', data_termino: '2026-11-15', cargo_id: null }),  // termina em 7 dias; sem cargo
  k('k3', 'c', { data_admissao: '2026-11-03', situacao_esocial: 'rascunho' }),                                // começou e não foi ao eSocial
  k('k4', 'd', { data_desligamento: '2026-11-05' }),
  k('k5', 'e', { data_admissao: '2026-12-01', situacao_esocial: 'rascunho' }),                                // começa em dezembro: ainda não alerta
]
const itens = [{ colaborador_id: 'a', tipo: 'aso_admissional', categoria: 'exame', situacao: 'entregue' }]
const base = { hoje, colabs: colabs as never, contratos, itens, salarioPorContrato: new Map([['k1', 2500], ['k3', 1621.2]]), obrigatorios: { documento: ['contrato_assinado'], exame: ['aso_admissional'] }, podeDocs: true, podeSaude: true }
const r = P.painelRh(base)
assert.equal(r.kpis.ativos, 3); assert.equal(r.kpis.admissoes_mes, 1); assert.equal(r.kpis.desligamentos_mes, 1)
assert.equal(r.kpis.rotatividade_mes_pct, 33.33, '((1+1)/2)/3 = 33,33%'); assert.equal(r.kpis.salarios_base_mensais, 4121.2)
const id = (x: string) => r.alertas.find((a) => a.id === x)
assert.deepEqual(id('experiencia_vencida')!.pessoas, ['Ana (29/10/2026)']); assert.equal(id('experiencia_vencida')!.nivel, 'critico')
assert.deepEqual(id('experiencia_terminando')!.pessoas, ['Bruno (7 d)'])
assert.deepEqual(id('esocial_admissao')!.pessoas, ['Caio'], 'quem começa só em dezembro ainda não entra')
assert.deepEqual(id('sem_aso')!.pessoas, ['Bruno', 'Caio']); assert.deepEqual(id('sem_cargo')!.pessoas, ['Bruno']); assert.deepEqual(id('sem_salario')!.pessoas, ['Bruno'])
assert.equal(r.alertas[0].nivel, 'critico', 'críticos primeiro')
assert.equal(id('ponto'), undefined, 'com 4 pessoas não há obrigação de ponto')
// sem liberação de saúde/dados: esses alertas somem (não viram "zero pendências")
const restrito = P.painelRh({ ...base, itens: null, salarioPorContrato: null, podeDocs: false, podeSaude: false })
assert.equal(restrito.alertas.find((a) => a.id === 'sem_aso'), undefined); assert.equal(restrito.kpis.salarios_base_mensais, null)
// tamanho: 21 empregados num estabelecimento → ponto obrigatório; 98 → aviso de que falta pouco para a cota
const muitos = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, nome: `P${i}`, situacao: 'ativo' }))
const ks = (n: number) => Array.from({ length: n }, (_, i) => k(`q${i}`, `p${i}`))
assert.ok(P.painelRh({ ...base, colabs: muitos(21) as never, contratos: ks(21), itens: [] }).alertas.some((a) => a.id === 'ponto'))
const r98 = P.painelRh({ ...base, colabs: muitos(98) as never, contratos: ks(98), itens: [] })
assert.ok(!r98.alertas.some((a) => a.id === 'cota_pcd')); assert.ok(r98.proximos.some((x) => /cota PCD/.test(x.pt)))
assert.ok(P.painelRh({ ...base, colabs: muitos(150) as never, contratos: ks(150), itens: [] }).alertas.some((a) => a.id === 'cota_pcd' && /3 vaga/.test(a.titulo.pt)))
// empregador: sem cadastro = crítico com os vivos; com cadastro ou não conferido = nada
const semEmp = P.painelRh({ ...base, temEmpregador: false }).alertas.find((a) => a.id === 'sem_empregador')
assert.ok(semEmp && semEmp.nivel === 'critico' && semEmp.total >= 3 && semEmp.acao.rota === '/rh/estrutura?aba=empregador' && semEmp.ids.length === semEmp.pessoas.length)
assert.equal(P.painelRh({ ...base, temEmpregador: true }).alertas.find((a) => a.id === 'sem_empregador'), undefined)
assert.equal(r.alertas.find((a) => a.id === 'sem_empregador'), undefined, 'não conferido não acusa')
// preparado ou recusado também está fora do prazo enquanto o contador não envia
const ksPrep = (contratos as Record<string, unknown>[]).map((x) => (x.id === 'k3' ? { ...x, situacao_esocial: 'preparado' } : x)) as never
assert.deepEqual(P.painelRh({ ...base, contratos: ksPrep }).alertas.find((a) => a.id === 'esocial_admissao')!.pessoas, ['Caio'], 'preparado sem envio alerta')
const ksAceito = (contratos as Record<string, unknown>[]).map((x) => (x.id === 'k3' ? { ...x, situacao_esocial: 'aceito' } : x)) as never
assert.equal(P.painelRh({ ...base, contratos: ksAceito }).alertas.find((a) => a.id === 'esocial_admissao'), undefined, 'aceito não alerta')
// auditoria 09/11: todo alerta tem destino próprio (nenhum volta para /rh) e cada nome tem a ficha (ids na mesma ordem)
for (const a of r.alertas) { assert.notEqual(a.acao.rota, '/rh', a.id); assert.equal(a.ids.length, a.pessoas.length, a.id) }
assert.deepEqual(id('sem_aso')!.ids, ['b', 'c']); assert.equal(id('sem_aso')!.acao.rota, '/rh/exames'); assert.equal(id('experiencia_vencida')!.acao.rota, '/rh/contratos')
// exame só agendado ainda não libera (NR-7); dispensado libera
const comAgenda = [...itens, { colaborador_id: 'b', tipo: 'aso_admissional', categoria: 'exame', situacao: 'agendado' }, { colaborador_id: 'c', tipo: 'aso_admissional', categoria: 'exame', situacao: 'dispensado' }]
assert.deepEqual(P.painelRh({ ...base, itens: comAgenda }).alertas.find((a) => a.id === 'sem_aso')!.pessoas, ['Bruno'])
// porte: pré-admissão não conta; aprendiz (103) contado
const porte = P.porteRh(colabs.filter((c) => c.situacao !== 'desligado') as never, new Map([['a', k('x1', 'a')], ['b', k('x2', 'b', { cod_categ: '103' })], ['e', k('x3', 'e')]]) as never)
assert.equal(porte.empregados, 2); assert.equal(porte.aprendizes, 1); assert.equal(porte.maiorEstab, 2)
console.log('check-rh-painel ok')
