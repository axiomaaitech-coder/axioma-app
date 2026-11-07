// Portas da Central Intelligence (Etapa 2): papel no servidor, tempo limite, disjuntor e confiabilidade. Rodar: npx tsx scripts/check-portas.mts
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const { PORTAS, passarPelaPorta, statusDaSaida, confiabilidadeDaResposta } = await import('../lib/ia/portas')
const { FERRAMENTAS } = await import('../lib/ia/ferramentas')
const { PAPEIS_FINANCEIROS } = await import('../lib/financeiro/semantica')
const M = await import('../lib/ia/motor')

// Toda ferramenta tem porta e toda porta tem ferramenta: nada entra por fora
assert.deepEqual(Object.keys(PORTAS).sort(), FERRAMENTAS.map((f) => f.name).sort())
for (const [nome, p] of Object.entries(PORTAS)) {
  assert.ok(p.modulo, `${nome}: sem módulo`)
  assert.ok(p.tempoMs > 0 && p.tempoMs <= 60000, `${nome}: tempo fora do razoável (a rota tem 120 s)`)
  assert.ok(!p.papeis.includes('operador'), `${nome}: operador de caixa não vê dado financeiro`)
}
const motor = readFileSync('lib/ia/motor.ts', 'utf8')
assert.equal(motor.match(/executarFerramenta\(/g)?.length, 1, 'o motor só executa ferramenta em um lugar')
assert.ok(/passarPelaPorta\(\{[^}]*executar: \(\) => executarFerramenta\(/.test(motor), 'esse lugar passa pela porta')
assert.ok(readFileSync('app/api/ia/motor/route.ts', 'utf8').includes('papel: papelSessao'), 'o papel vem da sessão no servidor, nunca do navegador')

const portasMod = await import('../lib/ia/portas')
const E = '11111111-1111-4111-8111-111111111111', OK = JSON.stringify({ itens: [{ a: 1 }] })
const ERRO = JSON.stringify({ erro: 'não foi possível consultar agora: banco fora' })
let chamadas = 0
const exec = (s: string) => async () => { chamadas++; return s }

// ─── Papel ───
for (const papel of [...PAPEIS_FINANCEIROS, null]) assert.equal((await passarPelaPorta({ empresaId: E, papel, nome: 'dividas', executar: exec(OK) })).saida, OK, `${papel} entra`)
for (const papel of ['operador', 'inventado', '']) {
  chamadas = 0
  const r = await passarPelaPorta({ empresaId: E, papel, nome: 'dividas', executar: exec(OK) })
  assert.equal(statusDaSaida(r.saida), 'negado', `${papel} não entra`)
  assert.equal(chamadas, 0, 'negado não chega a ler o banco')
  assert.match(r.saida, /não estime/)
}
for (const nome of ['ferramenta_x', 'constructor', '__proto__']) assert.equal(statusDaSaida((await passarPelaPorta({ empresaId: E, papel: 'dono', nome, executar: exec(OK) })).saida), 'erro', `${nome} sem porta`)

// ─── Tempo limite: vira falha explícita, nunca zero ───
const lenta = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'custos', tempoMs: 5, executar: () => new Promise((ok) => setTimeout(() => ok(OK), 200)) })
assert.equal(lenta.motivo, 'tempo'); assert.equal(statusDaSaida(lenta.saida), 'erro'); assert.match(lenta.saida, /não significa que o valor seja zero/)
const quebrou = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'dre', executar: async () => { throw new Error('caiu') } })
assert.equal(statusDaSaida(quebrou.saida), 'erro', 'exceção vira falha, não derruba a resposta')

// ─── Disjuntor: 3 falhas seguidas suspendem 1 minuto, só desta empresa e desta porta ───
let t = 1000; const agora = () => t
const tentar = (empresaId = E, nome = 'titulos', s = ERRO) => passarPelaPorta({ empresaId, papel: 'dono', nome, executar: exec(s), agora })
chamadas = 0
for (let i = 0; i < 3; i++) assert.equal((await tentar()).motivo, undefined, `falha ${i + 1} ainda tenta`)
assert.equal(chamadas, 3)
const suspensa = await tentar()
assert.equal(suspensa.motivo, 'suspensa'); assert.equal(chamadas, 3, 'suspensa não chega a ler o banco'); assert.match(suspensa.saida, /não significa que o valor seja zero/)
assert.equal((await tentar('22222222-2222-4222-8222-222222222222')).motivo, undefined, 'outra Empresa não é afetada')
assert.equal((await tentar(E, 'faturamento')).motivo, undefined, 'outra porta não é afetada')
t += 61000
assert.equal((await tentar(E, 'titulos', OK)).saida, OK, 'depois do minuto tenta de novo e volta')
for (let i = 0; i < 2; i++) await tentar(E, 'titulos')
await tentar(E, 'titulos', OK) // acerto zera a contagem
for (let i = 0; i < 2; i++) await tentar(E, 'titulos')
assert.equal((await tentar(E, 'titulos', OK)).saida, OK, 'falhas com acerto no meio não suspendem')
for (const s of [JSON.stringify({ itens: [] }), JSON.stringify({ erro: 'período inválido' })]) for (let i = 0; i < 4; i++) assert.equal((await tentar(E, 'dividas', s)).motivo, undefined, 'vazio e pedido inválido não abrem o disjuntor')

// ─── Estados ───
assert.equal(statusDaSaida(JSON.stringify({ estado: 'parcial', registros: 3 })), 'parcial')
assert.equal(statusDaSaida(JSON.stringify({ estado: 'verificado', registros: 3 })), 'ok')
assert.equal(statusDaSaida(JSON.stringify({ estado: 'parcial', registros: 0 })), 'vazio')

// ─── Confiabilidade ───
const reg = (...s: ('ok' | 'vazio' | 'parcial' | 'erro' | 'negado')[]) => s.map((status) => ({ nome: 'x', status, ms: 1 }))
const c = (x: Partial<Parameters<typeof confiabilidadeDaResposta>[0]>) => confiabilidadeDaResposta({ respondeu: true, exige: true, registro: reg('ok'), naoConferidos: 0, ...x })
assert.equal(c({}), 'completo')
assert.equal(c({ registro: reg('vazio') }), 'completo', '"não há registros" é resposta completa')
assert.equal(c({ exige: false, registro: [] }), 'completo', 'pergunta geral')
assert.equal(c({ registro: reg('ok', 'erro') }), 'parcial')
assert.equal(c({ registro: reg('parcial') }), 'parcial')
assert.equal(c({ registro: reg('ok', 'negado') }), 'parcial')
assert.equal(c({ naoConferidos: 1 }), 'inconsistente')
assert.equal(c({ registro: reg('erro') }), 'indisponivel')
assert.equal(c({ registro: [] }), 'indisponivel', 'pedia dado e respondeu só pelo resumo')
assert.equal(c({ registro: reg('negado') }), 'indisponivel')
assert.equal(c({ respondeu: false }), 'indisponivel')

// Aviso nunca mostra nome técnico: toda porta tem nome nos 3 idiomas
for (const nome of Object.keys(PORTAS)) assert.ok(M.NOME_FERRAMENTA[nome]?.pt && M.NOME_FERRAMENTA[nome]?.en && M.NOME_FERRAMENTA[nome]?.es, `${nome} sem nome no aviso`)

// ─── Avisos nos 3 idiomas ───
for (const [lang, re] of [['pt', /não dá acesso/], ['en', /does not give access/], ['es', /no da acceso/]] as const) {
  const av = M.avisosDaResposta({ lang, exige: true, registro: [{ nome: 'dividas', status: 'negado', ms: 0 }], naoConferidos: 0 })
  assert.match(av.join(' '), re)
  assert.equal(av.length, 1, 'negado não soma aviso de consulta que falhou')
}
// ─── Reserva do Gemini: modelo sobrecarregado não deixa a pergunta sem resposta ───
{
  const prov = { nome: 'gemini' as const, url: 'https://gemini.teste', chave: 'k' }
  const consulta = { supabase: {} as never, empresaId: E, papel: 'dono', fuso: 'America/Sao_Paulo' }
  const original = globalThis.fetch, erroOriginal = console.error
  console.error = () => {}
  const ok = (t: string) => new Response(JSON.stringify({ choices: [{ message: { content: t } }] }))
  const rodar = async (roteiro: (Response | Error)[]) => {
    const modelos: string[] = []
    globalThis.fetch = (async (_u: unknown, init?: { body?: string }) => {
      modelos.push(JSON.parse(String(init?.body)).model)
      const x = roteiro.shift() ?? ok('sobrou')
      if (x instanceof Error) throw x
      return x
    }) as typeof fetch
    const r = await M.chamarOpenAIComFerramentas('s', [{ role: 'user', content: 'p' }], 'gemini-3.6-flash', consulta, undefined, prov)
    return { r, modelos }
  }
  const erro = (s: number) => new Response('{}', { status: s })
  let x = await rodar([ok('oi')])
  assert.deepEqual(x.modelos, ['gemini-3.6-flash'], 'sem falha não troca')
  x = await rodar([erro(503), ok('oi')])
  assert.deepEqual([x.r.texto, x.r.modelo, x.modelos.length], ['oi', 'gemini-3.5-flash-lite', 2], '503 vai para a reserva estável')
  x = await rodar([new Error('timeout'), erro(429), ok('oi')])
  assert.deepEqual([x.r.texto, x.r.modelo, x.modelos.length], ['oi', 'gemini-3-flash-preview', 3], 'tempo esgotado e limite também')
  x = await rodar([erro(503), erro(503), erro(503)])
  assert.deepEqual([x.r.texto, x.modelos.length], [null, 3], 'todos fora: desiste, sem repetir para sempre')
  x = await rodar([erro(400)])
  assert.deepEqual([x.r.texto, x.modelos.length], [null, 1], 'pedido inválido não troca de modelo')
  globalThis.fetch = original; console.error = erroOriginal
}
// ─── Etapa 5: cada tela só com as portas da sua finalidade ───
{
  const { portasDaTela, telaPodeUsarPorta, telaPodePedirRelatorio } = portasMod
  for (const tela of ['ia-tributaria', 'contas-pagar', 'contas-receber', 'contas-vencidas', 'clientes', 'centros-custo', 'tesouraria', 'pdv', 'importar-documentos', 'mei-ia-advisor', 'mei-das']) {
    const lista = portasDaTela(tela); assert.ok(lista?.length, `${tela}: sem portas`)
    for (const n of lista!) assert.ok(Object.hasOwn(PORTAS, n), `${tela}: porta inexistente ${n}`)
    assert.ok(lista!.includes('relatorio') && lista!.includes('resumo_financeiro'), `${tela}: visão geral e relatório valem em toda tela`)
  }
  assert.equal(telaPodeUsarPorta('ia-tributaria', 'cadastros'), false, 'IA Tributária não abre clientes')
  assert.equal(telaPodeUsarPorta('ia-tributaria', 'obrigacoes_fiscais'), true)
  assert.equal(telaPodeUsarPorta('mei-das', 'obrigacoes_fiscais'), true); assert.equal(telaPodeUsarPorta('mei-das', 'cadastros'), false)
  assert.equal(telaPodeUsarPorta('pdv', 'dividas'), false)
  for (const tela of ['ia-financeira', 'relatorios', 'nexus', 'tela-nova', null, undefined, 'constructor']) { assert.equal(portasDaTela(tela), null, `${tela}: vê todas`); assert.equal(telaPodeUsarPorta(tela, 'cadastros'), true) }
  assert.equal(telaPodePedirRelatorio('ia-tributaria', 'contas_receber'), false, 'relatório de clientes não sai pela IA Tributária'); assert.equal(telaPodePedirRelatorio('ia-tributaria', 'tributario'), true)
  assert.equal(telaPodePedirRelatorio('ia-financeira', 'contas_receber'), true)
  chamadas = 0
  const fora = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'cadastros', tela: 'ia-tributaria', executar: exec(OK) })
  assert.equal(chamadas, 0, 'fora da área nem lê o banco'); assert.ok(JSON.parse(fora.saida).negado && /IA Financeira/.test(fora.saida), 'orienta para onde ir')
  const relFora = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'relatorio', tela: 'ia-tributaria', entrada: { tipo: 'contas_receber' }, executar: exec(OK) })
  assert.equal(chamadas, 0); assert.ok(JSON.parse(relFora.saida).negado)
  assert.equal((await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'relatorio', tela: 'ia-tributaria', entrada: { tipo: 'tributario' }, executar: exec(OK) })).saida, OK)
  assert.ok(JSON.parse((await passarPelaPorta({ empresaId: E, papel: 'operador', nome: 'dividas', tela: 'ia-financeira', executar: exec(OK) })).saida).negado, 'tela nunca libera o que o papel barra')
  assert.ok(!/FERRAMENTAS\.filter/.test(motor), 'o modelo vê todas as ferramentas: sem elas, afirmava que o dado não existe'); assert.ok(/existe no Axioma/.test(fora.saida) && /não diga que o dado não existe/.test(fora.saida), 'a recusa não deixa negar o dado')
  assert.equal(fora.motivo, 'fora_da_area')
  assert.deepEqual(M.avisosDaResposta({ lang: 'pt', exige: true, registro: [{ nome: 'cadastros', status: 'negado', ms: 1, motivo: 'fora_da_area' }], naoConferidos: 0 }), [], 'fora da área não diz sem permissão')
  assert.equal(M.avisosDaResposta({ lang: 'pt', exige: false, registro: [{ nome: 'cadastros', status: 'negado', ms: 1 }], naoConferidos: 0 }).length, 1, 'papel barrado segue avisando')
  console.log('OK — Etapa 5: cada tela só com as portas da sua finalidade')
}

// ─── Plano de consulta, pergunta ambígua, cancelamento e consolidação ───
{
  const P = await import('../lib/ia/planoConsulta')
  const C = await import('../lib/ia/consolidacao')
  const planoRh = P.planejarConsulta('Quantos funcionários ativos temos?')
  assert.deepEqual(planoRh.indisponiveis, ['funcionarios']); assert.deepEqual(planoRh.portas, [], 'nada do RH: nenhuma porta aberta à toa'); assert.equal(planoRh.execucao, 'nenhuma')
  const dois = P.planejarConsulta('Quanto temos a receber e quanto temos a pagar?')
  assert.deepEqual(dois.intencoes, ['a_receber', 'a_pagar']); assert.deepEqual(dois.portas, ['titulos'])
  const tres = P.planejarConsulta('Qual o faturamento, o lucro e o estoque?')
  assert.deepEqual(tres.portas, ['faturamento', 'dre', 'estoque_resumo']); assert.equal(tres.execucao, 'paralela')
  assert.deepEqual(P.planejarConsulta('Qual é a nossa situação financeira geral?').portas, ['resumo_financeiro'], 'com ou sem acento')
  const foraTrib = P.planejarConsulta('Quantos clientes eu tenho?', 'ia-tributaria')
  assert.deepEqual(foraTrib.portas, []); assert.deepEqual(foraTrib.fora_da_tela, ['cadastros'], 'o plano registra o que é de outra tela')
  for (const n of P.planejarConsulta('caixa faturamento despesa lucro imposto estoque divida vencido relatorio pdv pedido de compra quantos clientes a receber situacao geral').portas) assert.ok(Object.hasOwn(PORTAS, n), `plano citou porta inexistente: ${n}`)
  assert.deepEqual(P.portasNaoConsultadas(tres, ['faturamento']), ['dre', 'estoque_resumo'])
  assert.deepEqual(P.portasNaoConsultadas(dois, ['contas_a_receber']), [], 'mesma informação por outra porta não é falta')
  assert.ok(readFileSync('app/api/ia/motor/route.ts', 'utf8').includes("acao: 'ia.motor.bloqueado'"), 'tentativa barrada fica registrada')
  // Ambígua
  for (const t of ['Quanto temos?', 'quanto eu tenho', 'Qual é o saldo?', 'saldo', 'How much do we have?', '¿Cuánto tenemos?'.replace('¿', '')]) assert.equal(P.perguntaAmbigua(t, false), true, t)
  for (const t of ['Quanto temos a receber?', 'Qual o saldo em caixa?', 'Quanto tenho em estoque?', 'Qual o valor do DAS?']) assert.equal(P.perguntaAmbigua(t, false), false, t)
  assert.equal(P.perguntaAmbigua('e o saldo', true), false); assert.equal(P.perguntaAmbigua('saldo', true), false, 'na conversa, o assunto já está dado')
  for (const l of ['pt', 'en', 'es'] as const) assert.ok(P.PEDIDO_ESCLARECIMENTO[l].length > 20)
  const semIA = await M.perguntarAoMotor({ supabase: {} as never, empresaId: E, papel: 'dono', pergunta: 'Quanto temos?', lang: 'pt' })
  assert.equal(semIA.resposta, P.PEDIDO_ESCLARECIMENTO.pt); assert.equal(semIA.semCusto, true, 'pergunta de volta sem gastar saldo'); assert.equal(semIA.provedor, null)
  // Cancelada: nenhuma consulta abre
  chamadas = 0; const ab = new AbortController(); ab.abort()
  const canc = await passarPelaPorta({ empresaId: E, papel: 'dono', nome: 'dividas', sinal: ab.signal, executar: exec(OK) })
  assert.equal(chamadas, 0); assert.equal(canc.motivo, 'cancelada')
  // Consolidação
  const res = (o: Record<string, unknown>) => JSON.stringify({ moeda: 'BRL', fontes: ['x'], consultado_em: '2026-11-07T10:00:00Z', estado: 'verificado', ...o })
  const div = C.consolidar([
    { nome: 'resumo_financeiro', saida: res({ indicador: 'resumo_financeiro', detalhes: { caixa_realizado: 100 }, consultado_em: '2026-11-07T10:00:01Z' }) },
    { nome: 'caixa_tesouraria', saida: res({ indicador: 'caixa_posicao', detalhes: { disponivel: 150 }, consultado_em: '2026-11-07T10:00:03Z' }) },
  ])
  assert.equal(div.divergencias.length, 1); assert.deepEqual([div.divergencias[0].a, div.divergencias[0].b, div.divergencias[0].diferenca], [100, 150, 50], 'mostra os dois, não escolhe')
  assert.deepEqual(div.coleta, { de: '2026-11-07T10:00:01Z', ate: '2026-11-07T10:00:03Z', fontes: 2 })
  const av = C.avisosDaConsolidacao(div, 'pt'); assert.ok(/R\$ 100,00/.test(av[0]) && /R\$ 150,00/.test(av[0]))
  for (const l of ['en', 'es'] as const) assert.ok(C.avisosDaConsolidacao(div, l)[0].length > 20 && !/Atenção: o caixa/.test(C.avisosDaConsolidacao(div, l)[0]))
  assert.equal(C.consolidar([{ nome: 'resumo_financeiro', saida: res({ indicador: 'resumo_financeiro', detalhes: { caixa_realizado: 100 } }) }, { nome: 'caixa_tesouraria', saida: res({ indicador: 'caixa_posicao', detalhes: { disponivel: 100.005 } }) }]).divergencias.length, 0, 'igual até o centavo')
  const per = { inicio: '2026-11-01', fim: '2026-11-30' }
  assert.equal(C.consolidar([{ nome: 'faturamento', saida: res({ indicador: 'faturamento_competencia', valor: 100, periodo: per }) }, { nome: 'pdv_resumo', saida: res({ indicador: 'pdv_vendas', valor: 300, periodo: per }) }]).divergencias[0].assunto, 'pdv_maior_que_faturamento')
  assert.equal(C.consolidar([{ nome: 'faturamento', saida: res({ indicador: 'faturamento_competencia', valor: 100, periodo: per }) }, { nome: 'pdv_resumo', saida: res({ indicador: 'pdv_vendas', valor: 300, periodo: { inicio: '2026-10-01', fim: '2026-10-31' } }) }]).divergencias.length, 0, 'períodos diferentes não se comparam')
  // Origem: consulta antiga ganha módulo e horário; erro não vira dado; sem origem é apontado
  assert.deepEqual(JSON.parse(C.comOrigem('{"itens":[1]}', 'Estoque', () => 'T')), { itens: [1], origem: { modulo: 'Estoque', consultado_em: 'T' } })
  assert.equal(C.comOrigem('{"erro":"x"}', 'Estoque'), '{"erro":"x"}'); assert.equal(C.comOrigem('texto', 'Estoque'), 'texto')
  assert.deepEqual(C.consolidar([{ nome: 'x', saida: '{"itens":[]}' }]).sem_origem, ['x']); assert.deepEqual(C.consolidar([{ nome: 'x', saida: C.comOrigem('{"itens":[]}', 'Estoque') }]).sem_origem, [])
  assert.deepEqual(C.consolidar([{ nome: 'x', saida: '{"erro":"fora"}' }]).coleta, null, 'consulta que falhou não entra na coleta')
  assert.equal(C.avisosDaConsolidacao(C.consolidar([{ nome: 'a', saida: res({ moeda: 'BRL' }) }, { nome: 'b', saida: res({ moeda: 'USD' }) }]), 'pt').length, 1, 'moedas diferentes avisam')
  console.log('OK — plano de consulta, pergunta ambígua, cancelamento, origem e consolidação')
}

console.log('check-portas: papel, tempo limite, disjuntor, confiabilidade e reserva do Gemini, tudo certo ✔')
