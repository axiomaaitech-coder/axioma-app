// Voice Intelligence — Fase D: confiabilidade das respostas financeiras (consulta obrigatória, falha ≠ zero,
// vazio ≠ erro, avisos fixos, isolamento, papel, saldo sem cobrança dupla).
// Rodar: npx tsx scripts/check-voz-faseD.mts — sem banco e sem IA reais (simulados).
// NÃO prova o comportamento do modelo de linguagem (o que ele escreve): isso só com a IA real (ver relatório).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://teste.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= 'teste'
const M = await import('../lib/ia/motor')
const { processarPerguntaMotor } = await import('../lib/ia/rotaMotor')
const { textoParaFala } = await import('../lib/voz/textoFala')
type Msg = { role: 'user' | 'assistant'; content: string }
const u = (content: string): Msg => ({ role: 'user', content })
const a = (content: string): Msg => ({ role: 'assistant', content })

// ─── Casos 1–7: quando a consulta é OBRIGATÓRIA (e quando não é) ───
const exige: [string, Msg[], boolean, string][] = [
  ['Quanto temos para receber esta semana?', [], true, '1 recebimentos da semana'],
  ['Quanto está vencido?', [], true, '2 vencidos'],
  ['E quanto disso está atrasado?', [u('Quanto temos para receber esta semana?'), a('…')], true, '3 continuação'],
  ['Analise o faturamento de agosto.', [], true, '4a período'],
  ['Na verdade, quero setembro.', [u('Analise o faturamento de agosto.'), a('…')], true, '4b correção refaz a consulta'],
  ['Quais são meus custos fixos hoje?', [], true, '5 custos'],
  ['Quem são meus maiores fornecedores?', [], true, '6a fornecedores'],
  ['Quais clientes mais me devem?', [], true, '6b devedores (deve)'],
  ['E se metade desses recebimentos atrasar mais uma semana?', [u('Quanto temos para receber esta semana?'), a('…')], true, '7 simulação usa o dado real como base'],
  ['Qual é a minha dívida com o banco?', [], true, 'dívidas'],
  ['O que significa EBITDA?', [], false, 'pergunta geral não força ferramenta'],
  ['Obrigado, José!', [], false, 'conversa não força ferramenta'],
  ['Na verdade, obrigado.', [u('O que significa EBITDA?'), a('…')], false, 'continuação de assunto geral não força'],
  ['What about September?', [u('Analyze August revenue.'), a('…')], true, 'inglês'],
  ['¿Y cuánto de eso está vencido?', [u('¿Cuánto tenemos por cobrar esta semana?'), a('…')], true, 'espanhol'],
]
for (const [p, h, esperado, nome] of exige) assert.equal(M.exigeConsulta(p, h), esperado, `exigeConsulta: ${nome}`)
console.log('OK — casos 1–7: consulta obrigatória para dado da empresa (pt/en/es); conversa geral responde direto')

// ─── O modelo é OBRIGADO a consultar na 1ª rodada quando a pergunta exige ───
process.env.OPENAI_API_KEY = 'teste'
const fetchOriginal = globalThis.fetch
const corpos: { tool_choice: string }[] = []
let respostas: unknown[] = []
globalThis.fetch = (async (_u: unknown, init?: { body?: string }) => {
  corpos.push(JSON.parse(String(init?.body)))
  return new Response(JSON.stringify(respostas[corpos.length - 1] ?? { choices: [{ message: { content: 'fim' } }] }))
}) as typeof fetch
const pedido = (id: string, nome: string, args = '{}') => ({ id, type: 'function', function: { name: nome, arguments: args } })
const base = { supabase: {} as never, empresaId: '11111111-1111-4111-8111-111111111111', fuso: 'America/Sao_Paulo' }

respostas = [{ choices: [{ message: { content: null, tool_calls: [pedido('1', 'ferramenta_x')] } }] }, { choices: [{ message: { content: 'ok' } }] }]
let reg: import('../lib/ia/motor').RegistroFerramenta[] = []
await M.chamarOpenAIComFerramentas('s', [u('Quanto temos para receber esta semana?')], 'gpt-4o', { ...base, registro: reg, exige: true })
assert.equal(corpos[0].tool_choice, 'required', 'exige → 1ª rodada obrigada a consultar')
assert.equal(corpos[1].tool_choice, 'auto', 'depois da 1ª consulta, livre')
corpos.length = 0
await M.chamarOpenAIComFerramentas('s', [u('O que é EBITDA?')], 'gpt-4o', { ...base, registro: [], exige: false })
assert.equal(corpos[0].tool_choice, 'auto', 'pergunta geral: modelo decide')
console.log('OK — consulta forçada só quando a pergunta exige (OpenAI "required"; Claude "any" no código)')
assert.ok(readFileSync('lib/ia/motor.ts', 'utf8').includes("consulta.exige && rodada === 0 ? 'any' : 'auto'"), 'Claude também obrigado')

// ─── Casos 11–12: falha ≠ vazio ≠ ok; falha nunca vira sucesso ───
assert.equal(M.statusDaSaida('{"erro":"não foi possível consultar agora: timeout"}'), 'erro')
assert.equal(M.statusDaSaida('{"total_saldo":0,"itens":[]}'), 'vazio')
assert.equal(M.statusDaSaida('{"meses":[{"mes":"2026-09","total":0}]}'), 'vazio')
assert.equal(M.statusDaSaida('{"total_saldo":4500,"itens":[{"cliente":"X","saldo":4500}]}'), 'ok')
assert.equal(M.statusDaSaida('lixo'), 'erro', 'saída ilegível conta como falha')
// a ferramenta que falha fica registrada como erro (o nome é desconhecido → executarFerramenta devolve {"erro"})
reg = []
respostas = [{ choices: [{ message: { content: null, tool_calls: [pedido('1', 'ferramenta_x')] } }] }, { choices: [{ message: { content: 'Fato: R$ 4.500 a receber.' } }] }]
corpos.length = 0
await M.chamarOpenAIComFerramentas('s', [u('Quanto temos a receber?')], 'gpt-4o', { ...base, registro: reg, exige: true })
assert.equal(reg.length, 1); assert.equal(reg[0].status, 'erro'); assert.ok(reg[0].ms >= 0)
globalThis.fetch = fetchOriginal

const av = (x: Partial<Parameters<typeof M.avisosDaResposta>[0]>) => M.avisosDaResposta({ lang: 'pt', exige: true, registro: [], naoConferidos: 0, ...x })
assert.match(av({ registro: [{ nome: 'contas_a_receber', status: 'erro', ms: 5 }] }).join(' '), /não foi possível consultar agora: contas a receber\. .*não são zero/, '11 falha avisada, não vira zero')
assert.deepEqual(av({ registro: [{ nome: 'contas_a_receber', status: 'vazio', ms: 5 }] }), [], '12 vazio é resposta válida ("não há registros"), sem aviso de falha')
assert.match(av({ registro: [] }).join(' '), /consulta detalhada não pôde ser feita/, 'pergunta de dado respondida sem consulta → aviso fixo')
assert.deepEqual(av({ exige: false, registro: [] }), [], 'pergunta geral sem consulta: sem aviso')
assert.match(av({ registro: [{ nome: 'dividas', status: 'ok', ms: 1 }], naoConferidos: 2 }).join(' '), /não foi encontrado nos dados consultados/, 'valor inventado nunca sai como confirmado')
assert.match(M.avisosDaResposta({ lang: 'en', exige: true, registro: [{ nome: 'dividas', status: 'erro', ms: 1 }], naoConferidos: 0 }).join(' '), /not possible to check right now: debts/)
assert.match(M.avisosDaResposta({ lang: 'es', exige: true, registro: [], naoConferidos: 1 }).join(' '), /no se encontró en los datos consultados/)
// a voz não repete o aviso que já está no texto
const comAviso = `Fato: R$ 10.\n\n${M.AVISO_NAO_CONFERIDO.pt}`
assert.equal(textoParaFala(comAviso, 'pt', true).match(/Confira na tela antes de decidir/g)?.length, 1, 'aviso falado uma vez só')
console.log('OK — casos 11–12: falha ≠ vazio ≠ zero; aviso fixo quando falha, quando não consultou e quando há valor não encontrado')

// ─── Casos 8–10, 7: regras no prompt (o texto do modelo só se prova com a IA real) ───
const src = readFileSync('lib/ia/motor.ts', 'utf8')
assert.ok(/DRE de um mês por competência, impostos\/obrigações de um período específico e folha de pagamento/.test(src), '8–10 sem ferramenta: dizer que não está disponível e indicar a tela')
assert.ok(/nunca como dado atualizado: em continuação ou correção/.test(src), 'histórico não é fonte; correção consulta de novo')
assert.ok(/"Estimativa:" ou "Cenário:", com a conta e a fonte/.test(src), '7 cálculo e simulação marcados, com fonte')
console.log('OK — casos 7–10: regras no prompt (comportamento real do modelo: PENDENTE de teste com IA real)')

// ─── Casos 13–15: isolamento, papel, saldo e cobrança ───
type Cfg = Partial<{ acesso: true | null | 'erro'; papel: string | null | 'erro'; saldo: boolean; resposta: string | null | 'erro' | 'alheia' }>
function cenario(c: Cfg = {}) {
  const cont = { consumos: 0, devolucoes: 0, perguntas: 0 }
  const deps = {
    podeUsar: M.podeUsarIAFinanceira,
    acesso: async () => { if (c.acesso === 'erro') throw new Error('timeout'); return c.acesso === undefined ? true as const : c.acesso },
    papel: async () => { if (c.papel === 'erro') throw new Error('timeout'); return c.papel === undefined ? 'dono' : c.papel },
    consumir: async () => { cont.consumos++; return c.saldo === false ? { ok: false as const, motivo: 'sem_saldo' } : { ok: true as const, id: 'c1' } },
    devolver: async () => { cont.devolucoes++ },
    perguntar: async () => {
      cont.perguntas++
      if (c.resposta === 'erro') throw new Error('rede')
      if (c.resposta === 'alheia') throw new Error('empresa não encontrada')
      return { resposta: c.resposta === undefined ? 'Fato: ok.' : c.resposta } as Awaited<ReturnType<typeof M.perguntarAoMotor>>
    },
  }
  return { deps, cont }
}
const E = { usuario: 'u1', empresaId: '11111111-1111-4111-8111-111111111111', pergunta: 'Quanto temos a receber?', lang: 'pt' as const }
async function caso(nome: string, c: Cfg, status: number, consumos: number, devolucoes: number, perguntas: number, e = E) {
  const { deps, cont } = cenario(c)
  const r = await processarPerguntaMotor(e, deps)
  assert.equal(r.status, status, `${nome}: status`)
  assert.deepEqual([cont.consumos, cont.devolucoes, cont.perguntas], [consumos, devolucoes, perguntas], `${nome}: cobranças/devoluções/perguntas`)
  return r
}
await caso('13 outra empresa (RLS)', { acesso: null }, 404, 0, 0, 0)
await caso('13b empresa some no meio', { resposta: 'alheia' }, 404, 1, 1, 1)
await caso('14 operador', { papel: 'operador' }, 403, 0, 0, 0)
await caso('papel ilegível não vira dono', { papel: 'erro' }, 503, 0, 0, 0)
await caso('acesso ilegível', { acesso: 'erro' }, 503, 0, 0, 0)
await caso('15 saldo insuficiente', { saldo: false }, 402, 1, 0, 0)
const ok = await caso('sucesso cobra 1', {}, 200, 1, 0, 1)
assert.equal(ok.cobrado, true)
const semResp = await caso('IA não respondeu: devolve 1 vez', { resposta: null }, 200, 1, 1, 1)
assert.equal(semResp.cobrado, false)
await caso('erro no motor: devolve 1 vez', { resposta: 'erro' }, 500, 1, 1, 1)
await caso('sem login', {}, 401, 0, 0, 0, { ...E, usuario: null as unknown as string })
await caso('empresa inválida', {}, 400, 0, 0, 0, { ...E, empresaId: 'x' })
for (const papel of ['dono', 'admin', 'financeiro', 'contabil', 'leitor', null]) await caso(`papel ${papel} usa`, { papel }, 200, 1, 0, 1)
console.log('OK — casos 13–15: outra empresa 404 sem cobrar, operador 403, leitura falha 503, saldo 402, devolução no máximo 1 vez')

// ─── Caso 16 e integração ───
const rota = readFileSync('app/api/ia/motor/route.ts', 'utf8')
assert.ok(rota.includes('processarPerguntaMotor(') && rota.includes("supabase.rpc('ia_situacao'"), 'rota usa a regra testada e a RLS')
assert.ok(rota.includes('ferramentas: r.ferramentas') && rota.includes('sem_consulta_exigida') && rota.includes('latencia_ms'), 'auditoria: consultas, falta de consulta e latência')
assert.ok(!/resposta: r\.resposta,\s*pergunta|parametros: \{[^}]*pergunta:/.test(rota), 'auditoria sem o texto da pergunta/resposta')
assert.ok(!rota.includes('SERVICE_ROLE') && !rota.includes('supabaseServico'), 'sem chave de serviço na rota')
console.log('OK — caso 16 coberto por check-voz-faseB (interrupção/cancelamento); rota e auditoria conferidas')
console.log('check-voz-faseD: tudo certo ✔')
