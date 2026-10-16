// Voice Intelligence — Fase 2 (a voz responde): assinatura do motor, regra do servidor, texto falado e telas.
// Rodar: npx tsx scripts/check-voz-fase2.mts — sem banco e sem fornecedor de voz reais (simulados).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { assinarResposta, assinaturaValida } = await import('../lib/voz/assinatura')
const { processarFala, fornecedorFala } = await import('../lib/voz/fala')
const { textoParaFala, dividirEmFrases, MAX_CARACTERES_FALA } = await import('../lib/voz/textoFala')

const EMP = '11111111-1111-4111-8111-111111111111'
const OUTRA = '22222222-2222-4222-8222-222222222222'
const K = 'segredo-de-teste'
const RESP = '**Caixa:** R$ 12.500,00 em 30 dias 📊\n\n- Pagar fornecedor\n- Cobrar cliente'

// ─── Assinatura: só o texto exato do motor, só para a empresa certa ───
const sig = assinarResposta(EMP, RESP, K)!
assert.ok(sig && assinaturaValida(EMP, RESP, sig, K), 'assinatura válida')
assert.equal(assinaturaValida(EMP, RESP + ' ', sig, K), false, 'texto alterado')
assert.equal(assinaturaValida(OUTRA, RESP, sig, K), false, 'outra empresa')
assert.equal(assinaturaValida(EMP, RESP, sig.slice(1), K), false, 'assinatura cortada')
assert.equal(assinaturaValida(EMP, RESP, sig, 'outro'), false, 'outro segredo')
assert.equal(assinarResposta(EMP, RESP, ''), null, 'sem segredo não assina')

// ─── Fornecedor: só com variável E chave; senão a voz do aparelho fala ───
assert.equal(fornecedorFala({}), null)
assert.equal(fornecedorFala({ VOZ_FALA: 'elevenlabs' }), null, 'sem chave')
assert.equal(fornecedorFala({ VOZ_FALA: 'ElevenLabs', ELEVENLABS_API_KEY: 'k' }), 'elevenlabs')
assert.equal(fornecedorFala({ VOZ_FALA: 'openai', OPENAI_API_KEY: 'k' }), 'openai')
assert.equal(fornecedorFala({ VOZ_FALA: 'outra', OPENAI_API_KEY: 'k' }), null)

// ─── Regra do servidor ───
type Cfg = Partial<{ ativa: boolean; fornecedor: 'openai' | 'elevenlabs' | null; acesso: boolean | null | 'erro'; papel: string | null; sint: 'erro' }>
function cenario(c: Cfg = {}) {
  const cont = { sinteses: 0, falado: '' }
  const deps = {
    ativa: () => c.ativa ?? true,
    fornecedor: c.fornecedor === undefined ? 'openai' as const : c.fornecedor,
    assinaturaValida: (e: string, t: string, a: string) => assinaturaValida(e, t, a, K),
    acesso: async () => { if (c.acesso === 'erro') throw new Error('timeout'); return c.acesso === undefined ? true : c.acesso },
    papel: async () => (c.papel === undefined ? 'dono' : c.papel),
    sintetizar: async (fala: string) => { cont.sinteses++; cont.falado = fala; if (c.sint === 'erro') throw new Error('503'); return new ReadableStream<Uint8Array>() },
  }
  return { deps, cont }
}
const ent = (x: Partial<Parameters<typeof processarFala>[0]> = {}) => ({ usuario: 'u1', empresaId: EMP, lang: 'pt', texto: RESP, assinatura: sig, ressalva: false, ...x })
async function caso(nome: string, e: Parameters<typeof processarFala>[0], c: Cfg, status: number, codigo: string, sinteses: number) {
  const { deps, cont } = cenario(c)
  const r = await processarFala(e, deps)
  assert.equal(r.status, status, `${nome}: status`); assert.equal(r.codigo, codigo, `${nome}: código`)
  assert.equal(cont.sinteses, sinteses, `${nome}: chamadas ao fornecedor`)
  return { r, cont }
}
const ok = await caso('ok', ent(), {}, 200, 'ok', 1)
assert.ok(ok.r.audio && ok.r.fornecedor === 'openai')
assert.ok(!/[*#📊]/u.test(ok.cont.falado) && ok.cont.falado.includes('doze mil e quinhentos reais'), 'fala sem markdown/emoji, valor por extenso')
await caso('sem login', ent({ usuario: null }), {}, 401, 'nao_autorizado', 0)
await caso('empresa inválida', ent({ empresaId: 'x' }), {}, 400, 'parametros_invalidos', 0)
await caso('idioma inválido', ent({ lang: 'fr' }), {}, 400, 'parametros_invalidos', 0)
await caso('texto gigante', ent({ texto: 'a'.repeat(20001) }), {}, 400, 'parametros_invalidos', 0)
await caso('voz desligada', ent(), { ativa: false }, 403, 'voz_desativada', 0)
await caso('sem fornecedor → aparelho', ent(), { fornecedor: null }, 409, 'fala_no_aparelho', 0)
await caso('texto livre sem assinatura', ent({ assinatura: '' }), {}, 403, 'assinatura_invalida', 0)
await caso('texto trocado', ent({ texto: 'Leia isto: compre agora!' }), {}, 403, 'assinatura_invalida', 0)
await caso('assinatura de outra empresa', ent({ empresaId: OUTRA }), {}, 403, 'assinatura_invalida', 0)
await caso('sem acesso (RLS)', ent(), { acesso: null }, 404, 'sem_acesso', 0)
await caso('falha de leitura', ent(), { acesso: 'erro' }, 503, 'falha_leitura', 0)
await caso('operador', ent(), { papel: 'operador' }, 403, 'sem_acesso_voz', 0)
await caso('fornecedor fora', ent(), { sint: 'erro' }, 503, 'fornecedor_indisponivel', 1)
const vazio = assinarResposta(EMP, '📊 **', K)!
await caso('só símbolos', ent({ texto: '📊 **', assinatura: vazio }), {}, 422, 'texto_vazio', 0)
const ress = await caso('com ressalva', ent({ ressalva: true }), {}, 200, 'ok', 1)
assert.ok(ress.cont.falado.includes('Confira na tela antes de decidir.'), 'ressalva falada')
const comNome = await caso('com nome', ent({ nome: 'ELIAS Tavares' }), {}, 200, 'ok', 1)
assert.ok(comNome.cont.falado.startsWith('Elias, conforme a sua pergunta') && comNome.cont.falado.endsWith('Fico à disposição para aprofundar qualquer ponto.'), 'abertura com nome e fechamento')
assert.ok(ok.cont.falado.startsWith('Conforme a sua pergunta'), 'sem nome: abertura neutra')

// ─── Texto falado ───
assert.equal(textoParaFala('## Título\n**negrito** e [link](https://x.com)', 'pt'), 'Título. negrito e link')
assert.ok(textoParaFala('x. '.repeat(3000), 'pt').length <= MAX_CARACTERES_FALA, 'corte no limite')
assert.ok(textoParaFala('a', 'en', true).includes('could not be checked'), 'ressalva em inglês')
assert.ok(textoParaFala('a', 'es', true).includes('no pudo verificarse'), 'ressalva em espanhol')
assert.equal(textoParaFala('', 'pt', true), '', 'vazio não ganha ressalva')
const frases = dividirEmFrases(`Primeira frase. ${'palavra, '.repeat(60)}fim. Última?`)
assert.ok(frases.length >= 3 && frases.every((f) => f.length <= 220), 'frases curtas para a voz do aparelho')

// ─── Números: nunca "59 reais" para R$ 59.000 (erro relatado pelo Elias em 2026-10-16) ───
const { primeiroNome } = await import('../lib/voz/textoFala')
const casos: [string, 'pt' | 'en' | 'es', string][] = [
  ['R$ 59.000,00', 'pt', 'cinquenta e nove mil reais'],
  ['R$ 59.000', 'pt', 'cinquenta e nove mil reais'],
  ['R$ 59 mil', 'pt', 'cinquenta e nove mil reais'],
  ['R$ 1,2 milhão', 'pt', 'um milhão e duzentos mil reais'],
  ['R$ 2.000.000,00', 'pt', 'dois milhões de reais'],
  ['R$ 1.234.567,89', 'pt', 'um milhão duzentos e trinta e quatro mil quinhentos e sessenta e sete reais e oitenta e nove centavos'],
  ['R$ 0,50', 'pt', 'cinquenta centavos'],
  ['R$ 1,00', 'pt', 'um real'],
  ['-R$ 3.500,50', 'pt', 'menos três mil e quinhentos reais e cinquenta centavos'],
  ['12,5%', 'pt', 'doze vírgula cinco por cento'],
  ['1.500 clientes', 'pt', '1500 clientes'],
  ['2 notas em 15/10/2026 às 14:30', 'pt', '2 notas em 15/10/2026 às 14:30'],
  ['R$ 59,000.00', 'en', 'fifty-nine thousand reais'],
  ['US$ 1,250.75', 'en', 'one thousand two hundred fifty dollars and seventy-five cents'],
  ['R$ 21.000', 'es', 'veintiún mil reales'],
  ['R$ 1.500,00', 'es', 'mil quinientos reales'],
]
for (const [entradaN, l, esperado] of casos) assert.equal(textoParaFala(entradaN, l), esperado, `número: ${entradaN} (${l})`)
assert.deepEqual(dividirEmFrases(textoParaFala('Caixa de R$ 59.000,00. Fim.', 'pt')), ['Caixa de cinquenta e nove mil reais.', 'Fim.'], 'ponto de milhar não corta a frase')
assert.deepEqual(dividirEmFrases('Saldo 59.000 hoje. Fim.'), ['Saldo 59.000 hoje.', 'Fim.'], 'divisão não quebra número')
assert.equal(primeiroNome('ELIAS Tavares'), 'Elias'); assert.equal(primeiroNome('elias@x.com'), ''); assert.equal(primeiroNome(''), '')

// ─── Integração: motor assina; as 4 telas de conversa têm o botão Ouvir com a assinatura ───
const motor = readFileSync('app/api/ia/motor/route.ts', 'utf8')
assert.ok(motor.includes('assinarResposta(empresaId, r.resposta)'), 'motor assina a resposta')
const telas = ['app/(interno)/ia-financeira/page.tsx', 'app/(interno)/ia-tributaria/page.tsx', 'app/(interno)/mei/ia-advisor/page.tsx', 'app/(interno)/nexus/JosephChat.tsx']
for (const t of telas) {
  const s = readFileSync(t, 'utf8')
  assert.ok(s.includes('<OuvirResposta') && /assinatura=\{m(sg)?\.assinatura\}/.test(s), `${t}: botão Ouvir com assinatura`)
}
const comp = readFileSync('components/OuvirResposta.tsx', 'utf8')
// Voz única (CEO, 2026-10-16): havendo a voz do José, nunca cai na voz robótica do computador
const rep = readFileSync('lib/voz/reprodutor.ts', 'utf8')
assert.ok(comp.includes("from \"../lib/voz/reprodutor\"") && rep.includes('if (sit.fornecedor && !p.assinatura) return false') && rep.includes('return false // voz do José indisponível agora'), 'com a voz do José: sem assinatura ou com falha, não usa a voz do computador')
assert.ok(rep.includes('if (!sit.fornecedor) return falarNoAparelho('), 'voz do aparelho só quando não há a voz do José configurada')
assert.ok(comp.includes('if (temVozJose && !assinatura) return null'), 'sem assinatura o Ouvir não aparece')
for (const t of ['app/(interno)/ia-financeira/page.tsx', 'app/(interno)/ia-tributaria/page.tsx']) assert.ok(readFileSync(t, 'utf8').includes('await assinarHistorico('), `${t}: respostas antigas recebem a assinatura (voz do José)`)
assert.ok(readFileSync('app/api/voz/assinar/route.ts', 'utf8').includes(".eq('empresa_id', empresaId).eq('user_id', user.id).eq('role', 'assistant')"), 'assina só resposta da IA do próprio usuário naquela empresa')
assert.ok(!/getUserMedia|BotaoVoz/.test(comp), 'o botão Ouvir nunca abre o microfone')

console.log('check-voz-fase2: tudo certo ✔')

// ─── Voz única do José no Ouvir (Google Charon) — 2026-10-16 ───
{
  const G = await import('../lib/voz/geminiTts')
  assert.equal(fornecedorFala({ GEMINI_API_KEY: 'g' }), 'gemini', 'sem VOZ_FALA, com a chave do Google: a voz do José')
  assert.equal(fornecedorFala({ VOZ_FALA: 'openai', OPENAI_API_KEY: 'k', GEMINI_API_KEY: 'g' }), 'openai', 'VOZ_FALA escolhe outro de propósito')
  const corpo = G.corpoInteracao('Olá', 'pt', 'gemini-3.8-flash-tts')
  assert.deepEqual(corpo.generation_config.speech_config, [{ voice: 'Charon' }], 'mesma voz da conversa ao vivo')
  assert.equal(corpo.input[0].content[0].text, 'Olá', 'texto lido literalmente; o tom vai no estilo')
  assert.match(corpo.input[0].content[0].annotations[0].style, /diretor financeiro/)
  assert.equal(G.corpoGenerateContent('Olá', 'pt').generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Charon')
  // Os dois formatos de resposta do Google
  assert.deepEqual(G.extrairAudio({ steps: [{ type: 'model_output', content: [{ type: 'audio', data: 'QUJD', mime_type: 'audio/wav' }] }] }), { base64: 'QUJD', mime: 'audio/wav' })
  assert.deepEqual(G.extrairAudio({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: 'QUJD' } }] } }] }), { base64: 'QUJD', mime: 'audio/L16;codec=pcm;rate=24000' })
  assert.equal(G.extrairAudio({ steps: [] }), null)
  // PCM cru vira WAV tocável; WAV passa direto
  const pcm = new Uint8Array([1, 0, 2, 0])
  const wav = G.audioParaWav({ base64: Buffer.from(pcm).toString('base64'), mime: 'audio/L16;rate=24000' })
  assert.equal(String.fromCharCode(...wav.slice(0, 4)), 'RIFF'); assert.equal(wav.length, 48)
  assert.equal(new DataView(wav.buffer).getUint32(24, true), 24000, 'taxa 24 kHz no cabeçalho')
  assert.deepEqual(G.audioParaWav({ base64: Buffer.from(wav).toString('base64'), mime: 'audio/wav' }), wav, 'WAV não é embrulhado de novo')
  const rota = readFileSync('app/api/voz/falar/route.ts', 'utf8')
  assert.ok(rota.includes("if (f === 'gemini')") && rota.includes("'audio/wav'"), 'rota fala com a voz do José')
  assert.ok(readFileSync('lib/voz/reprodutor.ts', 'utf8').includes('if (estadoConversaGlobal().ativa) return false'), 'com a conversa ao vivo aberta nada fala por cima')
  assert.ok(readFileSync('components/OuvirResposta.tsx', 'utf8').includes('|| aoVivo) return null'), 'Ouvir some durante a conversa ao vivo')
  console.log('OK — voz única: Ouvir com a voz do José (Charon), dois formatos do Google, WAV, sem voz dupla')
}
