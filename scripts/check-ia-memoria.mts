// Memória de aprendizagem da Inteligência Axioma: sugestão ([[LEMBRAR]]), texto para o motor, áreas,
// gravação só com o "sim" da pessoa e nada apagado. Rodar: npx tsx scripts/check-ia-memoria.mts
// Sem banco real (a tabela e a RLS foram conferidas no Supabase em 2026-10-16).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const M = await import('../lib/ia/memoria')

// ─── Áreas ───
assert.equal(M.areaDaTela('ia-financeira'), 'financeira'); assert.equal(M.areaDaTela('ia-tributaria'), 'tributaria')
assert.equal(M.areaDaTela('mei-ia-advisor'), 'mei'); assert.equal(M.areaDaTela('mei-reforma'), 'tributaria')
assert.equal(M.areaDaTela('nexus'), 'financeira'); assert.equal(M.areaDaTela(''), 'geral')
assert.deepEqual(M.areasLidas('mei'), ['mei', 'tributaria', 'geral']); assert.deepEqual(M.areasLidas('financeira'), ['financeira', 'geral'])
console.log('OK — áreas por tela (MEI também lê tributária)')

// ─── Sugestão: sai do texto, no máximo uma, tipo validado ───
let r = M.extrairSugestao('Fato: lucro médio R$ 10.000 por mês.\n\n[[LEMBRAR: Pró-labore | R$ 8.000 por mês desde jan/2026 | parametro]]', 'financeira')
assert.equal(r.texto, 'Fato: lucro médio R$ 10.000 por mês.', 'marcador retirado da resposta')
assert.deepEqual(r.sugestao, { titulo: 'Pró-labore', conteudo: 'R$ 8.000 por mês desde jan/2026', tipo: 'parametro', area: 'financeira' })
r = M.extrairSugestao('Resposta. [[LEMBRAR: Sazonalidade | dezembro vende o dobro]]', 'mei')
assert.equal(r.sugestao?.tipo, 'fato', 'sem tipo → fato'); assert.equal(r.texto, 'Resposta.')
r = M.extrairSugestao('Resposta. [[LEMBRAR: X | correção forçada | correcao]]', 'financeira')
assert.equal(r.sugestao, null, 'título curto demais não vira sugestão'); assert.equal(r.texto, 'Resposta.')
r = M.extrairSugestao('Resposta. [[LEMBRAR: Regime | Simples Nacional anexo III | correcao]]', 'tributaria')
assert.equal(r.sugestao?.tipo, 'fato', 'a IA não cria "correção" — só a pessoa')
r = M.extrairSugestao('Resposta sem marcador.', 'financeira')
assert.equal(r.sugestao, null); assert.equal(r.texto, 'Resposta sem marcador.')
r = M.extrairSugestao('A [[LEMBRAR: Primeiro | primeiro dado aqui | fato]] B [[LEMBRAR: Segundo | segundo dado aqui | fato]]', 'financeira')
assert.equal(r.sugestao?.titulo, 'Primeiro', 'só a primeira'); assert.ok(!r.texto.includes('LEMBRAR'), 'todas saem do texto')
console.log('OK — sugestão: retirada do texto, uma só, tipo validado, IA não cria correção')

// ─── Texto para o motor ───
const base = { valor: null, confirmado_em: '2026-10-16T12:00:00Z', vale_ate: null }
const t = M.textoMemoria([
  { ...base, tipo: 'parametro', titulo: 'Pró-labore', conteudo: 'R$ 8.000 por mês', valor: 8000 },
  { ...base, tipo: 'correcao', titulo: 'Correção: folha', conteudo: 'são 3 funcionários, não 5' },
  { ...base, tipo: 'fato', titulo: 'Contrato antigo', conteudo: 'vencido', vale_ate: '2026-01-31' },
], '2026-10-16')
assert.match(t, /^MEMÓRIA CONFIRMADA PELA EMPRESA/)
assert.match(t, /Pró-labore: R\$ 8\.000 por mês \[valor: R\$ 8\.000,00\] \(confirmado em 16\/10\/2026\)/)
assert.match(t, /\(CORREÇÃO FEITA PELA EMPRESA\) Correção: folha: são 3 funcionários, não 5/)
assert.ok(!t.includes('Contrato antigo'), 'memória vencida não entra')
assert.equal(M.textoMemoria([], '2026-10-16'), '', 'sem memória, nada no prompt')
const muitas = Array.from({ length: 60 }, (_, i) => ({ ...base, tipo: 'fato' as const, titulo: `Item ${i}`, conteudo: 'dado qualquer' }))
assert.equal(M.textoMemoria(muitas, '2026-10-16').split('\n').length - 1, M.MAX_MEMORIAS_NO_PROMPT, 'limite no prompt')
console.log('OK — texto para o motor: confirmadas, validade, correções com prioridade, limite')

// ─── Motor, rota, gravação e telas ───
const motor = readFileSync('lib/ia/motor.ts', 'utf8')
assert.ok(motor.includes('${REGRA_SUGERIR_MEMORIA}'), 'regra de sugerir no prompt')
assert.ok(motor.indexOf('extrairSugestao(r.texto, areaDaTela') < motor.indexOf('const naoConferidos = r.texto ? conferirNumeros'), 'marcador sai ANTES da conferência final')
assert.ok(motor.includes("conferirNumeros(extrairSugestao(r.texto, 'geral').texto"), 'escalada da rotina ignora o valor da sugestão de memória')
assert.ok(motor.includes('carregarMemoria(args.supabase, args.empresaId'), 'memória lida com o cliente do usuário (RLS)')
assert.match(M.REGRA_SUGERIR_MEMORIA, /nunca para senha, documento pessoal ou dado de terceiros/)
const rota = readFileSync('app/api/ia/motor/route.ts', 'utf8')
assert.ok(rota.includes('sugestao_memoria: r.sugestaoMemoria') && rota.includes('memorias_usadas: r.memorias'), 'rota devolve sugestão e audita uso (sem conteúdo)')
assert.ok(rota.indexOf('assinarResposta(empresaId, r.resposta)') > 0, 'assinatura é do texto já sem o marcador')
const cli = readFileSync('lib/ia/memoriaCliente.ts', 'utf8')
assert.ok(/insert\(\{ empresa_id: empresaId, \.\.\.item, status: 'pendente' \}\)/.test(cli) && cli.includes("status: 'confirmada', confirmado_por"), 'grava pendente e confirma com quem confirmou')
assert.ok(!/\.delete\(/.test(cli), 'nada é apagado (esquecer = arquivar)')
assert.ok(cli.includes("status: 'arquivada'"))
for (const [arq, area] of [['app/(interno)/ia-financeira/page.tsx', 'financeira'], ['app/(interno)/ia-tributaria/page.tsx', 'tributaria'], ['app/(interno)/mei/ia-advisor/page.tsx', 'mei']]) {
  const s = readFileSync(arq, 'utf8')
  assert.ok(s.includes(`<PainelMemoriaIA`) && s.includes(`area="${area}"`) && s.includes('<AcoesMemoria'), `${arq}: memória ligada`)
}
console.log('check-ia-memoria: tudo certo ✔')
