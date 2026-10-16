// Voice Intelligence — Fase 1 (ditado): regra do servidor, cobrança, gravador e integração nas 8 telas.
// Rodar: npx tsx scripts/check-voz-fase1.mts — sem banco, sem OpenAI e sem microfone reais (simulados).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const { processarDitado, vozAtivaPara, mensagemVoz, MAX_BYTES, TELAS_VOZ } = await import('../lib/voz/servidor')
const { GravadorVoz, juntarTexto, escolherFormato, LIMITE_MS, SILENCIO_MS } = await import('../lib/voz/gravador')

// ─── Servidor: dependências simuladas, contando cobranças e chamadas à OpenAI ───
const EMP = '11111111-1111-4111-8111-111111111111'
type Cfg = Partial<{ ativa: boolean; sit: { restante: number; ilimitada: boolean } | null | 'erro'; papel: string | null; transc: { texto: string; duracao: number } | 'erro'; consumo: 'ok' | 'sem_saldo' | 'erro' }>
function cenario(c: Cfg = {}) {
  const cont = { cobrancas: 0, transcricoes: 0 }
  const deps = {
    ativa: () => c.ativa ?? true,
    situacao: async () => { if (c.sit === 'erro') throw new Error('timeout'); return c.sit === undefined ? { restante: 10, ilimitada: false } : c.sit },
    papel: async () => (c.papel === undefined ? 'dono' : c.papel),
    transcrever: async () => { cont.transcricoes++; if (c.transc === 'erro') throw new Error('OpenAI 503'); return c.transc ?? { texto: 'conta de luz da Enel, 320 reais', duracao: 4.2 } },
    consumir: async () => { cont.cobrancas++; if (c.consumo === 'erro') throw new Error('rede'); return c.consumo === 'sem_saldo' ? { ok: false as const, motivo: 'sem_saldo' } : { ok: true as const } },
  }
  return { deps, cont }
}
const audio = (tamanho = 50_000, tipo = 'audio/webm;codecs=opus') => ({ tipo, tamanho, bytes: new Blob(['x']) })
const entrada = (x: Partial<Parameters<typeof processarDitado>[0]> = {}) => ({ usuario: 'u1', empresaId: EMP, tela: 'ia-financeira', lang: 'pt', arquivo: audio(), ...x })
async function caso(nome: string, e: Parameters<typeof processarDitado>[0], c: Cfg, status: number, codigo: string, cobrancas: number) {
  const { deps, cont } = cenario(c)
  const r = await processarDitado(e, deps)
  assert.equal(r.status, status, `${nome}: status`); assert.equal(r.codigo, codigo, `${nome}: código`)
  assert.equal(cont.cobrancas, cobrancas, `${nome}: cobranças`); assert.equal(r.cobrado, codigo === 'ok', `${nome}: cobrado`)
  if (codigo !== 'ok') assert.equal(r.texto, undefined, `${nome}: não pode devolver texto`)
  return { r, cont }
}
await caso('sem login', entrada({ usuario: null }), {}, 401, 'nao_autorizado', 0)
await caso('empresa inválida', entrada({ empresaId: 'abc' }), {}, 400, 'parametros_invalidos', 0)
await caso('idioma não permitido', entrada({ lang: 'fr' }), {}, 400, 'parametros_invalidos', 0)
await caso('tela fora da Fase 1', entrada({ tela: 'dre' }), {}, 400, 'parametros_invalidos', 0)
await caso('função desligada (clientes)', entrada(), { ativa: false }, 403, 'voz_desativada', 0)
await caso('sem arquivo', entrada({ arquivo: null }), {}, 400, 'audio_vazio', 0)
await caso('formato inválido', entrada({ arquivo: audio(1000, 'application/pdf') }), {}, 415, 'formato_invalido', 0)
await caso('arquivo vazio', entrada({ arquivo: audio(0) }), {}, 400, 'audio_vazio', 0)
await caso('acima de 2 MB', entrada({ arquivo: audio(MAX_BYTES + 1) }), {}, 413, 'audio_grande', 0)
await caso('sem acesso à empresa (RLS)', entrada(), { sit: null }, 404, 'sem_acesso', 0)
await caso('falha ao ler o acesso', entrada(), { sit: 'erro' }, 503, 'falha_leitura', 0)
await caso('operador fora do PDV', entrada(), { papel: 'operador' }, 403, 'sem_acesso_voz', 0)
await caso('operador na busca do PDV', entrada({ tela: 'pdv' }), { papel: 'operador' }, 200, 'ok', 1)
await caso('saldo zerado (antes de transcrever)', entrada(), { sit: { restante: 0, ilimitada: false } }, 402, 'sem_saldo', 0)
await caso('saldo ilimitado (empresa de teste)', entrada(), { sit: { restante: 0, ilimitada: true } }, 200, 'ok', 1)
const forn = await caso('fornecedor indisponível', entrada(), { transc: 'erro' }, 503, 'fornecedor_indisponivel', 0)
assert.equal(forn.cont.transcricoes, 1)
await caso('áudio acima de 60 s (duração do fornecedor)', entrada(), { transc: { texto: 'longo', duracao: 75 } }, 413, 'audio_longo', 0)
await caso('duração ausente não passa', entrada(), { transc: { texto: 'x', duracao: Number.NaN } }, 413, 'audio_longo', 0)
await caso('transcrição vazia', entrada(), { transc: { texto: '   ', duracao: 3 } }, 422, 'transcricao_vazia', 0)
await caso('saldo acabou no meio (corrida)', entrada(), { consumo: 'sem_saldo' }, 402, 'sem_saldo', 1) // tentou cobrar 1x, NÃO entrega o texto
await caso('falha ao cobrar', entrada(), { consumo: 'erro' }, 503, 'falha_leitura', 1)
const ok = await caso('sucesso', entrada(), {}, 200, 'ok', 1)
assert.equal(ok.r.texto, 'conta de luz da Enel, 320 reais'); assert.equal(ok.cont.transcricoes, 1)
console.log('OK — servidor: login, empresa, papel, saldo, formato, tamanho, duração, fornecedor, vazio; cobra 1x só no sucesso')

// Liberação e mensagens (3 idiomas, sem detalhe técnico)
assert.equal(vozAtivaPara(EMP, {}), false)
assert.equal(vozAtivaPara(EMP, { VOZ_ATIVA: 'on' }), true)
assert.equal(vozAtivaPara(EMP, { VOZ_EMPRESAS_TESTE: ` x , ${EMP.toUpperCase()} ` }), true)
for (const c of ['nao_autorizado', 'voz_desativada', 'sem_saldo', 'fornecedor_indisponivel', 'transcricao_vazia', 'audio_longo', 'sem_acesso_voz'] as const)
  for (const l of ['pt', 'en', 'es']) { const m = mensagemVoz(c, l); assert.ok(m.length > 10 && !/openai|whisper|api key|http/i.test(m), `${c}/${l}`) }
console.log('OK — liberação desligada por padrão; mensagens nos 3 idiomas sem expor fornecedor')

// ─── Gravador (navegador simulado) ───
assert.equal(juntarTexto('Quanto vou pagar', 'em 30 dias?'), 'Quanto vou pagar em 30 dias?')
assert.equal(juntarTexto('', 'novo'), 'novo'); assert.equal(juntarTexto('texto   ', ''), 'texto   ')
assert.equal(escolherFormato((t) => t === 'audio/mp4'), 'audio/mp4') // Safari/iPhone
assert.equal(escolherFormato(() => false), null)
let paradas = 0
function ambiente(o: { negar?: string; tamanho?: number; nivel?: number } = {}) {
  let agora = 0; const tarefas: (() => void)[] = []
  class Faixa { stop() { paradas++ } }
  const stream = { getTracks: () => [new Faixa(), new Faixa()] } as unknown as MediaStream
  class Rec {
    state = 'inactive'; ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null; onerror = null
    static isTypeSupported = (t: string) => t.startsWith('audio/webm')
    start() { this.state = 'recording' }
    stop() { if (this.state === 'inactive') return; this.state = 'inactive'; this.ondataavailable?.({ data: new Blob([new Uint8Array(o.tamanho ?? 4000)]) }); this.onstop?.() }
  }
  class Ctx { createAnalyser() { return { fftSize: 0, getByteTimeDomainData: (a: Uint8Array) => a.fill(128 + Math.round((o.nivel ?? 0) * 127)) } } createMediaStreamSource() { return { connect() {} } } close() { return Promise.resolve() } }
  return {
    amb: {
      getUserMedia: async () => { if (o.negar) throw Object.assign(new Error('x'), { name: o.negar }); return stream },
      MediaRecorder: Rec as never, AudioContext: Ctx as never, agora: () => agora,
      aCada: (fn: () => void) => { tarefas.push(fn); return 1 }, pararACada: () => { tarefas.length = 0 },
    },
    avancar: (ms: number) => { for (let t = 0; t < ms; t += 200) { agora += 200; tarefas.forEach((f) => f()) } },
  }
}
// 1) gravar e parar: entrega o áudio e libera o microfone (2 faixas)
paradas = 0; { const a = ambiente({ nivel: 0.5 }); const g = new GravadorVoz(a.amb); const { final } = await g.iniciar(); g.parar(); assert.ok((await final).size > 0); assert.equal(paradas, 2) }
// 2) cancelar: descarta e libera
paradas = 0; { const a = ambiente(); const g = new GravadorVoz(a.amb); const { final } = await g.iniciar(); g.cancelar(); await assert.rejects(final); assert.equal(paradas, 2) }
// 3) limite de 60 s para sozinho
paradas = 0; { const a = ambiente({ nivel: 0.5 }); const g = new GravadorVoz(a.amb); const { final } = await g.iniciar(); a.avancar(LIMITE_MS + 400); assert.ok((await final).size > 0); assert.equal(paradas, 2) }
// 4) silêncio depois de falar para sozinho (nível 0 desde o início: só para pelo limite → testa que fala anterior conta)
paradas = 0; { const a = ambiente({ nivel: 0 }); const g = new GravadorVoz(a.amb); const { final } = await g.iniciar(); a.avancar(SILENCIO_MS + 400); let acabou = false; final.then(() => { acabou = true }, () => { acabou = true }); await new Promise((r) => setTimeout(r, 5)); assert.equal(acabou, false, 'sem fala ainda: não para no silêncio'); g.cancelar() }
// 5) acima de 2 MB: recusa e libera
paradas = 0; { const a = ambiente({ tamanho: 2 * 1024 * 1024 + 10 }); const g = new GravadorVoz(a.amb); const { final } = await g.iniciar(); g.parar(); await assert.rejects(final, (e) => e === 'grande_demais'); assert.equal(paradas, 2) }
// 6) microfone negado / inexistente: erro claro, nada fica aberto
await assert.rejects(new GravadorVoz(ambiente({ negar: 'NotAllowedError' }).amb).iniciar(), (e) => e === 'negado')
await assert.rejects(new GravadorVoz(ambiente({ negar: 'NotFoundError' }).amb).iniciar(), (e) => e === 'sem_microfone')
assert.equal(GravadorVoz.suportado({}), false)
console.log('OK — gravador: parar, cancelar, 60 s, silêncio, 2 MB, microfone negado/inexistente; microfone sempre liberado')

// ─── Integração nas 8 telas: botão presente, só preenche (nunca envia), chave nunca no navegador ───
const TELAS: [string, string][] = [
  ['app/(interno)/nexus/JosephChat.tsx', 'nexus'], ['app/(interno)/ia-financeira/page.tsx', 'ia-financeira'],
  ['app/(interno)/ia-tributaria/page.tsx', 'ia-tributaria'], ['app/(interno)/mei/ia-advisor/page.tsx', 'mei-ia-advisor'],
  ['app/(interno)/contas-pagar/page.tsx', 'contas-pagar'], ['app/(interno)/importar-documentos/page.tsx', 'importar-documentos'],
  ['app/(interno)/pdv/venda/page.tsx', 'pdv'], ['app/(interno)/contas-receber/page.tsx', 'contas-receber'],
]
assert.deepEqual(TELAS.map(([, t]) => t).sort(), [...TELAS_VOZ].sort())
for (const [arq, tela] of TELAS) {
  const s = readFileSync(arq, 'utf8')
  // Recorta cada <BotaoVoz ... /> inteiro e o corpo do onTexto com chaves balanceadas
  const usos: [string, string, string][] = []
  for (const m of s.matchAll(/<BotaoVoz\s/g)) {
    const el = s.slice(m.index!, s.indexOf('/>', m.index!) + 2)
    const i = el.indexOf('onTexto={') + 'onTexto={'.length; let n = 1, j = i
    while (n && j < el.length) { if (el[j] === '{') n++; else if (el[j] === '}') n--; j++ }
    usos.push([el, (el.match(/tela="([^"]+)"/) ?? [])[1] ?? '', el.slice(i, j - 1)])
  }
  assert.ok(usos.length >= 1, `${arq}: botão de voz ausente`)
  for (const u of usos) {
    assert.equal(u[1], tela, `${arq}: tela errada`)
    // Exceção única (Fase B, 2026-10-16): no José, com o "Conversa por voz" LIGADO pela pessoa, a fala vira a pergunta.
    // Desligado (padrão), continua só preenchendo o campo. Nunca salva nem grava nada.
    const corpo = u[2].replace(/modoConversa \? enviar\([^)]*\)\)? : /, '')
    assert.ok(/juntarTexto/.test(corpo) && !/enviar|perguntar|salvar|submit|insert|criar/i.test(corpo), `${arq}: onTexto só pode preencher o campo`)
    if (u[2] !== corpo) assert.equal(arq, 'app/(interno)/nexus/JosephChat.tsx', 'envio direto pela voz só no José, com o modo conversa')
  }
}
for (const arq of ['components/BotaoVoz.tsx', 'lib/voz/gravador.ts', ...TELAS.map(([a]) => a)]) {
  const s = readFileSync(arq, 'utf8')
  assert.ok(!/OPENAI_API_KEY|api\.openai\.com/.test(s), `${arq}: chave/fornecedor no navegador`)
}
const rota = readFileSync('app/api/voz/transcrever/route.ts', 'utf8')
const auditoria = rota.slice(rota.indexOf('registrarAuditoria({'), rota.indexOf('}))', rota.indexOf('registrarAuditoria({')))
assert.ok(!/texto|audio\b|bytes:\s*arquivo\b/.test(auditoria.replace(/bytes: arquivo instanceof Blob \? arquivo\.size : 0/, '')), 'auditoria não pode levar texto/áudio')
assert.ok(!/captureException|captureMessage\([^)]*texto/.test(rota.replace(/captureMessage\(`\[voz\] \$\{resultado\.codigo\}`/, '')), 'Sentry sem texto/áudio')
assert.ok(!/console\.(log|error)\([^)]*texto/.test(rota), 'log sem texto')
console.log('OK — 8 telas: botão presente, só preenche o campo, sem chave no navegador; auditoria e Sentry sem áudio/texto')
