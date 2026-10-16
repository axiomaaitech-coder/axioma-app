// PoC Conversa ao vivo (tempo real): regras do servidor, configuração travada, áudio PCM e o fluxo do
// Gemini simulado (ferramenta → motor do Axioma, interrupção, encerramento). Sem rede, microfone ou
// fornecedor reais. Rodar: npx tsx scripts/check-voz-tempo-real.mts
// NÃO prova: qualidade da voz, português, latência real, WebRTC do Qwen (exige chave e aparelho).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const S = await import('../lib/voz/tempoReal/servidor')
const C = await import('../lib/voz/tempoReal/cliente')

// ─── Liberação: variável E chave ───
assert.deepEqual(S.fornecedoresTR({}), [])
assert.deepEqual(S.fornecedoresTR({ VOZ_TEMPO_REAL: 'gemini,qwen' }), [], 'sem chave nada liga')
assert.deepEqual(S.fornecedoresTR({ VOZ_TEMPO_REAL: 'gemini, qwen', GEMINI_API_KEY: 'g' }), ['gemini'])
assert.deepEqual(S.fornecedoresTR({ VOZ_TEMPO_REAL: 'Gemini;Qwen', GEMINI_API_KEY: 'g', QWEN_API_KEY: 'q' }), ['gemini', 'qwen'])
console.log('OK — liberação por variável + chave')

// ─── Início de sessão ───
const EMP = '11111111-1111-4111-8111-111111111111'
type Cfg = Partial<{ ativa: boolean; disp: ('gemini' | 'qwen')[]; acesso: { restante: number; ilimitada: boolean } | null | 'erro'; papel: string | null | 'erro' }>
const deps = (c: Cfg = {}) => ({
  ativa: () => c.ativa ?? true,
  disponiveis: c.disp ?? ['gemini', 'qwen'],
  acesso: async () => { if (c.acesso === 'erro') throw new Error('x'); return c.acesso === undefined ? { restante: 5, ilimitada: false } : c.acesso },
  papel: async () => { if (c.papel === 'erro') throw new Error('x'); return c.papel === undefined ? 'dono' : c.papel },
})
const ent = (x = {}) => ({ usuario: 'u1', empresaId: EMP, lang: 'pt', fornecedor: 'gemini', ...x })
const casos: [string, ReturnType<typeof ent>, Cfg, number, string][] = [
  ['ok', ent(), {}, 200, 'ok'],
  ['sem login', ent({ usuario: null }), {}, 401, 'nao_autorizado'],
  ['fornecedor inventado', ent({ fornecedor: 'outro' }), {}, 400, 'parametros_invalidos'],
  ['idioma inválido', ent({ lang: 'fr' }), {}, 400, 'parametros_invalidos'],
  ['voz desligada p/ empresa', ent(), { ativa: false }, 403, 'voz_desativada'],
  ['fornecedor sem chave', ent({ fornecedor: 'qwen' }), { disp: ['gemini'] }, 409, 'fornecedor_indisponivel'],
  ['outra empresa (RLS)', ent(), { acesso: null }, 404, 'sem_acesso'],
  ['operador', ent(), { papel: 'operador' }, 403, 'sem_acesso_voz'],
  ['sem saldo', ent(), { acesso: { restante: 0, ilimitada: false } }, 402, 'sem_saldo'],
  ['ilimitada', ent(), { acesso: { restante: 0, ilimitada: true } }, 200, 'ok'],
  ['leitura falhou', ent(), { acesso: 'erro' }, 503, 'falha_leitura'],
  ['papel ilegível', ent(), { papel: 'erro' }, 503, 'falha_leitura'],
]
for (const [nome, e, c, status, codigo] of casos) {
  const r = await S.processarInicio(e as never, deps(c))
  assert.deepEqual([r.status, r.codigo], [status, codigo], nome)
}
console.log('OK — início: login, liberação, fornecedor, outra empresa, operador, saldo, falha de leitura')

// ─── Configuração: cérebro = motor do Axioma, travada no servidor ───
const setup = S.setupGemini({ lang: 'pt', nome: 'Elias', modelo: 'gemini-3.1-flash-live-preview' })
assert.equal(setup.model, 'models/gemini-3.1-flash-live-preview')
assert.deepEqual(setup.tools, [{ functionDeclarations: [S.FERRAMENTA_AXIOMA] }], 'uma única ferramenta: o motor')
assert.equal(setup.generationConfig.speechConfig.languageCode, 'pt-BR')
assert.equal(setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon', 'voz masculina padrão')
const instr = setup.systemInstruction.parts[0].text
assert.match(instr, /Nunca diga um número que não veio dessa ferramenta/)
assert.match(instr, /TODOS os avisos/)
assert.match(instr, /Correção .* nova consulta/)
assert.match(instr, /Nunca execute nem prometa pagamento/)
assert.match(instr, /Elias/)
const corpo = S.corpoTokenGemini(setup, Date.parse('2026-10-16T12:00:00Z'))
assert.equal(corpo.uses, 1, 'token de um uso')
assert.equal(corpo.newSessionExpireTime, '2026-10-16T12:01:00.000Z', 'precisa começar em até 60 s')
assert.equal(corpo.expireTime, '2026-10-16T12:11:00.000Z', 'vale só a sessão (10 min + folga)')
assert.ok(!('fieldMask' in corpo), 'sem fieldMask: configuração inteira vem do servidor (navegador não troca instruções/ferramentas)')
assert.deepEqual(corpo.bidiGenerateContentSetup, setup)
const qwen = S.sessaoQwen({ lang: 'es', nome: '', voz: 'Ethan' })
assert.equal(qwen.tools.length, 1); assert.equal(qwen.tools[0].function.name, 'perguntar_ao_axioma')
assert.match(qwen.instructions, /español/); assert.equal(qwen.voice, 'Ethan')
assert.ok(!('voice' in S.sessaoQwen({ lang: 'pt', nome: '' })), 'sem voz configurada: padrão do fornecedor')
console.log('OK — configuração: só a ferramenta do motor, regras de fidelidade, token de 1 uso e curto')
// Quem se apresenta em cada tela (Opção A do CEO; José mantido no Nexus)
assert.match(S.instrucoesJose('pt', 'Elias'), /^Você é José, o diretor financeiro digital do Axioma/, 'Nexus: José (texto aprovado)')
assert.match(S.instrucoesJose('pt', 'Elias', 'ia-financeira'), /^Você é a Inteligência Axioma, diretora financeira digital do Axioma/)
assert.match(S.instrucoesJose('pt', 'Elias', 'ia-tributaria'), /^Você é a Inteligência Axioma, especialista tributária do Axioma[\s\S]*Reforma Tributária[\s\S]*nunca diga apenas "consulte um contador"/)
assert.match(S.instrucoesJose('en', '', 'ia-tributaria'), /Fale sempre em English[\s\S]*você é a Inteligência Axioma, do Axioma\.$/)
assert.ok(S.setupGemini({ lang: 'pt', nome: '', modelo: 'm', tela: 'ia-financeira' }).systemInstruction.parts[0].text.includes('diretora financeira digital'), 'token travado com a identidade da tela')
for (const [arq, tela] of [['app/(interno)/ia-financeira/page.tsx', 'ia-financeira'], ['app/(interno)/ia-tributaria/page.tsx', 'ia-tributaria']]) {
  const src = readFileSync(arq, 'utf8')
  assert.ok(src.includes(`<ConversaAoVivo`) && src.includes(`tela="${tela}"`) && src.includes(`perguntarAoAxioma({ pergunta, empresaId, tela: "${tela}"`), `${arq}: conversa ao vivo ligada ao motor desta tela`)
}
assert.ok(readFileSync('app/api/voz/tempo-real/route.ts', 'utf8').includes("(TELAS_TR as readonly string[]).includes(String(body?.tela))"), 'rota só aceita telas conhecidas')
console.log('OK — identidade por tela: José (Nexus), Diretora Financeira Digital, Especialista Tributária; painéis ligados ao motor')

// ─── Áudio PCM ───
const amostras = new Float32Array([0, 0.5, -0.5, 1, -1, 2, -2])
const volta = C.pcm16Base64ParaFloat(C.floatParaPcm16Base64(amostras))
const esperado = [0, 0.5, -0.5, 1, -1, 1, -1]
volta.forEach((v, i) => assert.ok(Math.abs(v - esperado[i]) < 0.001, `pcm ${i}`))
console.log('OK — áudio PCM 16 bits ida e volta (com corte de pico)')

// ─── Fluxo Gemini simulado: ferramenta → motor, interrupção, fim e métricas ───
const g = globalThis as unknown as Record<string, unknown>
const enviados: Record<string, unknown>[] = []
let wsAtual: { onopen?: () => void; onmessage?: (e: { data: string }) => Promise<void> | void; onclose?: () => void; readyState: number; send: (s: string) => void; close: () => void; url: string } | null = null
g.WebSocket = class { readyState = 1; url: string; onopen?: () => void; onmessage?: (e: { data: string }) => void; onclose?: () => void
  constructor(u: string) { this.url = u; wsAtual = this as never; setTimeout(() => this.onopen?.(), 0) }
  send(s: string) { enviados.push(JSON.parse(s)) } close() { this.readyState = 3 } }
let fontesParadas = 0, fontesTocando = 0
class Ctx { currentTime = 0; destination = {}; constructor(_o?: unknown) {}
  createMediaStreamSource() { return { connect() {} } }
  createScriptProcessor() { return { connect() {}, disconnect() {}, onaudioprocess: null } }
  createGain() { return { gain: { value: 1 }, connect() {} } }
  createBuffer(_c: number, n: number) { return { duration: n / 24000, copyToChannel() {} } }
  createBufferSource() { return { buffer: null, connect() {}, start() { fontesTocando++ }, stop() { fontesParadas++ }, onended: null } }
  close() { return Promise.resolve() } }
g.AudioContext = Ctx
const trilhas = { paradas: 0 }
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [{ stop: () => { trilhas.paradas++ } }], getAudioTracks: () => [] }) } } })
const puts: Record<string, unknown>[] = []
const fetchOriginal = globalThis.fetch
globalThis.fetch = (async (url: unknown, init?: { method?: string; body?: string }) => {
  if (String(url) === '/api/voz/tempo-real' && init?.method === 'POST') return new Response(JSON.stringify({ fornecedor: 'gemini', ws: 'wss://exemplo/ws', token: 'auth_tokens/abc', modelo: 'models/x', duracao_max_s: 600, silencio_max_s: 60 }))
  if (init?.method === 'PUT') { puts.push(JSON.parse(String(init.body))); return new Response('{}') }
  return new Response('{}', { status: 404 })
}) as typeof fetch
const estados: string[] = [], falas: [string, string][] = [], perguntas: string[] = []
const s = await C.iniciarConversaAoVivo({
  fornecedor: 'gemini', empresaId: EMP, lang: 'pt',
  consultar: async (p) => { perguntas.push(p); return 'Fato: R$ 4.500 a receber, todo vencido.' },
  eventos: { estado: (e) => estados.push(e), fala: (q, t) => falas.push([q, t]), erro: () => {} },
})
await new Promise((ok) => setTimeout(ok, 5))
assert.ok(wsAtual!.url.endsWith('?access_token=auth_tokens%2Fabc'), 'conecta com o token efêmero (nunca a chave)')
assert.deepEqual(enviados[0], { setup: { model: 'models/x' } }, 'setup mínimo: o resto está travado no token')
const msg = (m: unknown) => wsAtual!.onmessage!({ data: JSON.stringify(m) })
await msg({ setupComplete: {} })
assert.equal(estados.at(-1), 'ouvindo')
await msg({ serverContent: { inputTranscription: { text: 'Quanto temos a receber?' } } })
await msg({ toolCall: { functionCalls: [{ id: 'c1', name: 'perguntar_ao_axioma', args: { pergunta: 'contas a receber em aberto' } }] } })
assert.deepEqual(perguntas, ['contas a receber em aberto'], 'a pergunta foi ao motor do Axioma')
assert.deepEqual(enviados.at(-1), { toolResponse: { functionResponses: [{ id: 'c1', name: 'perguntar_ao_axioma', response: { resultado: 'Fato: R$ 4.500 a receber, todo vencido.' } }] } }, 'resposta do motor volta para a voz')
const pedaco = C.floatParaPcm16Base64(new Float32Array(2400))
await msg({ serverContent: { modelTurn: { parts: [{ inlineData: { mimeType: 'audio/pcm;rate=24000', data: pedaco } }, { inlineData: { mimeType: 'audio/pcm;rate=24000', data: pedaco } }] }, outputTranscription: { text: 'Temos quatro mil e quinhentos reais.' } } })
assert.equal(fontesTocando, 2); assert.equal(estados.at(-1), 'falando')
await msg({ serverContent: { interrupted: true } })
assert.equal(fontesParadas, 2, 'interrupção corta todo o áudio na fila')
await msg({ toolCall: { functionCalls: [{ id: 'c2', name: 'outra_coisa', args: {} }] } })
assert.equal(perguntas.length, 1, 'ferramenta desconhecida não chega ao motor')
await msg({ serverContent: { turnComplete: true } })
assert.deepEqual(falas, [['voce', 'Quanto temos a receber?'], ['jose', 'Temos quatro mil e quinhentos reais.']], 'falas completas vão para o chat')
await msg({ usageMetadata: { promptTokenCount: 100, responseTokenCount: 50 } })
s!.encerrar('usuario')
await new Promise((ok) => setTimeout(ok, 5))
assert.equal(estados.at(-1), 'encerrada'); assert.equal(trilhas.paradas, 1, 'microfone liberado no fim')
assert.equal(puts.length, 1); assert.equal(puts[0].consultas, 2); assert.equal(puts[0].tokens_entrada, 100); assert.equal(puts[0].motivo, 'usuario')
assert.ok(!JSON.stringify(puts[0]).includes('receber'), 'métricas sem texto da conversa')
s!.encerrar('usuario'); assert.equal(puts.length, 1, 'encerrar 2x não registra 2x')
globalThis.fetch = fetchOriginal
console.log('OK — Gemini simulado: token efêmero, ferramenta → motor, áudio em fila, interrupção, falas no chat, fim com métricas')

// ─── Segurança dos arquivos ───
const rota = readFileSync('app/api/voz/tempo-real/route.ts', 'utf8')
const sdp = readFileSync('app/api/voz/tempo-real/sdp/route.ts', 'utf8')
const cli = readFileSync('lib/voz/tempoReal/cliente.ts', 'utf8') + readFileSync('components/ConversaAoVivo.tsx', 'utf8')
assert.ok(!/process\.env/.test(cli), 'nada de variável de ambiente no navegador')
assert.ok((rota + sdp).split('\n').filter((l) => /NextResponse\.json|new Response/.test(l)).every((l) => !/API_KEY/.test(l)), 'chave nunca vai na resposta ao navegador')
assert.ok(rota.includes('processarInicio(') && sdp.includes('processarInicio('), 'as duas portas usam a mesma regra de acesso')
assert.ok(!/SERVICE_ROLE|supabaseServico/.test(rota + sdp), 'sem chave de serviço')
assert.ok(readFileSync('middleware.ts', 'utf8').includes("connect-src 'self' wss://generativelanguage.googleapis.com"), 'CSP libera só o WebSocket do Gemini')
assert.ok(readFileSync('app/(interno)/nexus/JosephChat.tsx', 'utf8').includes('consultar={consultarAoVivo}'), 'José ligado ao motor')
console.log('check-voz-tempo-real: tudo certo ✔')

// ─── Conversa que CONTINUA ao trocar de tela (sessaoGlobal) ───
{
  const G = await import('../lib/voz/tempoReal/sessaoGlobal')
  const motorPerguntas: Record<string, unknown>[] = []
  enviados.length = 0
  globalThis.fetch = (async (url: unknown, init?: { method?: string; body?: string }) => {
    const u = String(url)
    if (u === '/api/voz/tempo-real' && init?.method === 'POST') { const b = JSON.parse(String(init.body)); assert.equal(b.tela, 'mei-ia-advisor', 'a tela vai para o servidor'); return new Response(JSON.stringify({ fornecedor: 'gemini', ws: 'wss://exemplo/ws', token: 't', modelo: 'models/x', duracao_max_s: 600, silencio_max_s: 60 })) }
    if (u === '/api/ia/motor') { motorPerguntas.push(JSON.parse(String(init?.body))); return new Response(JSON.stringify({ resposta: 'Fato: limite usado 40%.', nivel: 'rotina' })) }
    return new Response('{}')
  }) as typeof fetch
  const noChat: string[] = []
  const tela = { aoFalar: (q: string, t: string) => { noChat.push(`${q}:${t}`) } }
  const sair = G.registrarTela('mei-ia-advisor', tela)
  await G.iniciarConversaGlobal({ fornecedor: 'gemini', empresaId: EMP, lang: 'pt', tela: 'mei-ia-advisor', caminho: '/mei/ia-advisor', tela_aberta: tela })
  await new Promise((ok) => setTimeout(ok, 5))
  const m2 = (m: unknown) => wsAtual!.onmessage!({ data: JSON.stringify(m) })
  await m2({ setupComplete: {} })
  assert.equal(G.estadoConversaGlobal().ativa, true)
  await m2({ serverContent: { inputTranscription: { text: 'Quanto do limite usei?' } } })
  await m2({ serverContent: { turnComplete: true } })
  assert.deepEqual(noChat, ['voce:Quanto do limite usei?'], 'tela aberta recebe a fala')
  sair() // a pessoa foi conferir Custos Fixos
  await m2({ toolCall: { functionCalls: [{ id: 'k1', name: 'perguntar_ao_axioma', args: { pergunta: 'limite de faturamento usado' } }] } })
  assert.equal(motorPerguntas.length, 1, 'com a tela fechada a consulta continua indo ao motor')
  assert.equal(motorPerguntas[0].tela, 'mei-ia-advisor'); assert.deepEqual(motorPerguntas[0].historico, [{ role: 'user', content: 'Quanto do limite usei?' }], 'histórico desta conversa')
  await m2({ serverContent: { outputTranscription: { text: 'Você usou 40% do limite.' } } })
  await m2({ serverContent: { turnComplete: true } })
  assert.equal(G.estadoConversaGlobal().ativa, true, 'a conversa NÃO encerrou ao sair da tela')
  assert.equal(G.estadoConversaGlobal().ultimaFala?.texto, 'Você usou 40% do limite.', 'a barra fixa mostra a última fala')
  assert.deepEqual(noChat, ['voce:Quanto do limite usei?'], 'fora da tela nada é jogado num chat fechado')
  G.registrarTela('mei-ia-advisor', tela) // voltou para a tela
  assert.deepEqual(noChat, ['voce:Quanto do limite usei?', 'jose:Você usou 40% do limite.'], 'ao voltar, as falas pendentes entram no chat')
  G.encerrarConversaGlobal()
  await new Promise((ok) => setTimeout(ok, 5))
  assert.equal(G.estadoConversaGlobal().ativa, false)
  globalThis.fetch = fetchOriginal
  for (const [arq, txt] of [['app/(interno)/layout.tsx', '<BarraVozGlobal />'], ['app/(interno)/mei/ia-advisor/page.tsx', 'tela="mei-ia-advisor"'], ['components/OuvirResposta.tsx', 'Trocar de tela NÃO para a leitura']]) assert.ok(readFileSync(arq, 'utf8').includes(txt), `${arq}`)
  assert.ok(!readFileSync('components/ConversaAoVivo.tsx', 'utf8').includes("encerrar(\"saiu_da_tela\")"), 'o painel não encerra ao sair da tela')
  assert.match(S.instrucoesJose('pt', '', 'mei-ia-advisor'), /^Você é a Inteligência Axioma, consultora do MEI do Axioma/)
  console.log('OK — conversa continua fora da tela: consulta ao motor, barra fixa, falas pendentes entregues ao voltar; MEI com a Consultora do MEI')
}
