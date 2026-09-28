// ═══════════════════════════════════════════════════════════════
// MOTOR DE ORQUESTRAÇÃO DE IA DO AXIOMA — documento: docs/MOTOR-IA.md
//
// Hierarquia (regra fixa do Elias, 2026-09-28 — rotina na OpenAI, complexo
// na Anthropic, com TRAVA no código):
//   0. Retrato da empresa (sem IA)          → ./retratoEmpresa.ts
//   1. Triagem: regra fixa; em dúvida, OpenAI barata classifica
//   2. Executor por nível:
//        rotina      → OpenAI (modelo barato)
//        analise     → Claude Sonnet 5.5
//        estrategica → Claude Opus 5.5
//   3. Conferência dos números citados contra o retrato (sem IA)
// Rotina que não dá conta "passa pra cima" (escala pra análise). Anthropic
// fora do ar → OpenAI responde; tudo fora → quem chamou usa as regras.
//
// TRAVA: quem chama NUNCA escolhe provedor nem modelo — só manda a pergunta.
// O nível sai daqui (triagem) e só pode SUBIR, nunca descer.
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { montarRetrato, textoSetor, textoFiscal, type Retrato } from './retratoEmpresa'
import { escolherManuais } from './manuais'
import { montarContextoMundo } from '../nexusBriefing'

export type Nivel = 'rotina' | 'analise' | 'estrategica'
export type Idioma = 'pt' | 'en' | 'es'
export type MensagemHistorico = { role: 'user' | 'assistant'; content: string }

// Modelos por nível — o ÚNICO lugar do Axioma que decide isso.
export const MODELOS: Record<Nivel, { provedor: 'openai' | 'anthropic'; modelo: string; esforco?: 'low' | 'medium' | 'high' }> = {
  rotina: { provedor: 'openai', modelo: 'gpt-5.6-luna' }, // tier mais barato (mesmo de lib/axiomaChat.ts)
  analise: { provedor: 'anthropic', modelo: 'claude-sonnet-5-5', esforco: 'medium' },
  estrategica: { provedor: 'anthropic', modelo: 'claude-opus-5-5', esforco: 'high' },
}
const OPENAI_RESERVA = 'gpt-4o-mini' // se o modelo barato principal falhar
const ORDEM: Nivel[] = ['rotina', 'analise', 'estrategica']
const subir = (a: Nivel, b: Nivel): Nivel => (ORDEM.indexOf(a) >= ORDEM.indexOf(b) ? a : b)

export const AVISO_IDENTIDADE = 'Nunca se identifique como uma IA, como Claude, como Anthropic, como ChatGPT, como GPT, como OpenAI, ou como um modelo de linguagem — mesmo se perguntado diretamente. Você é a inteligência do Axioma. Se perguntarem o que você é, responda que é o consultor/CFO digital do Axioma, e redirecione pra como pode ajudar.'
const NOME_IDIOMA: Record<Idioma, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
const SINAL_ESCALAR = '[[ESCALAR]]'

// ─── 1. TRIAGEM POR REGRA (grátis, determinística) ───
const RE_ESTRATEGICA = /plano|estrat[eé]g|reestrutur|cen[aá]rio|proje[çc]|pr[oó]ximos?\s+\d+\s+(anos|meses)|\d+\s+anos|longo prazo|m[eé]dio prazo|expandir|expans[aã]o|abrir (uma )?(nova|outra) (loja|unidade|filial)|contratar|demitir|mudar de regime|trocar de regime|vender a empresa|valuation|sociedade|s[oó]cio|investir em|vale a pena (investir|abrir|comprar|financiar)|plan\b|strateg|forecast|restructur|expand|estrateg|proyecc|reestructur/i
const RE_ANALISE = /por ?que|porque|causa|motivo|analis|compar|melhor(ar)?|reduzir|cortar|economizar|o que (devo|fazer|posso)|devo |deveria|vale a pena|risco|problema|preocup|aument|diminu|caiu|subiu|piorou|tend[eê]ncia|why|analy[sz]|compare|should|risk|improve|reduce|por qu[eé]|analiz|deber[ií]a|riesgo|mejorar/i
const RE_ROTINA = /^(quanto|qual|quais|quando|onde|o que [eé]|o que significa|me (mostra|mostre|diga|lista)|liste|mostre|total|defin|explique o que|how much|what is|when|list|show|cu[aá]nto|qu[eé] es|cu[aá]ndo|muestra)/i

export function triagemPorRegra(pergunta: string, qtdManuais: number): Nivel | null {
  const p = pergunta.trim()
  if (RE_ESTRATEGICA.test(p) || p.length > 600 || qtdManuais >= 3 && p.length > 250) return 'estrategica'
  if (RE_ANALISE.test(p)) return 'analise'
  if (RE_ROTINA.test(p) && p.length <= 160) return 'rotina'
  return null // dúvida → OpenAI classifica
}

// ─── 3. CONFERÊNCIA DOS NÚMEROS (sem IA) ───
// Todo "R$ X" citado precisa existir no retrato (±1%) ou estar marcado como
// estimativa/meta/cálculo. Devolve os valores que não bateram.
const RE_REAIS = /R\$\s?-?\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|R\$\s?-?\d+(?:,\d{1,2})?/g
const RE_MARCA_ESTIMATIVA = /estim|aprox|cerca de|por volta|~|≈|meta|objetivo|economia de|potencial|at[eé]|entre|se |caso|simula|projet|hipot|a medir|estimat|approx|around|target|goal|up to|meta|objetivo|aproximad/i
export const lerReais = (t: string) => Number(t.replace(/R\$\s?/, '').replace(/\./g, '').replace(',', '.'))
export function conferirNumeros(resposta: string, textoBase: string): string[] {
  const conhecidos = [...textoBase.matchAll(RE_REAIS)].map((m) => Math.abs(lerReais(m[0])))
  const ruins: string[] = []
  for (const frase of resposta.split(/(?<=[.!?\n])\s+/)) {
    if (RE_MARCA_ESTIMATIVA.test(frase)) continue
    for (const m of frase.matchAll(RE_REAIS)) {
      const v = Math.abs(lerReais(m[0]))
      if (!Number.isFinite(v) || v < 1) continue
      if (!conhecidos.some((k) => Math.abs(k - v) <= Math.max(1, k * 0.01))) ruins.push(m[0])
    }
  }
  return ruins
}

// ─── Prompt (estável primeiro → cache da Anthropic aproveita) ───
const REGRAS = `Você é a inteligência do Axioma — o CFO digital de empresas brasileiras, experiente, direto e prático.
Regras invioláveis:
- Use SOMENTE os dados da empresa e da economia enviados. Os números já vêm calculados pelo Axioma: use-os, não recalcule diferente. Nunca invente número, cliente, fornecedor, lei ou notícia.
- Se fizer uma conta nova (ex.: economia de um corte), mostre a conta e marque como estimativa.
- Cite custos, receitas, dívidas e alertas PELO NOME quando recomendar algo.
- Leve em conta o SETOR da empresa (manual do setor) e os ALERTAS DA SITUAÇÃO — comece pelo mais urgente.
- Termine com 1 a 3 ações práticas, com impacto esperado quando der pra estimar.
- Nunca afirme certeza sobre o futuro; fale em cenário mais provável. Não recomende compra/venda de investimento específico.
- Se faltar dado para responder, diga exatamente qual dado cadastrar e em qual tela.
- Reforma Tributária: premissa + data + aviso de que pode mudar; nunca apenas "consulte um contador".
- ${AVISO_IDENTIDADE}`

const REGRA_ROTINA = `- Você responde perguntas DIRETAS e rápidas (um número, uma data, uma definição) em até 4 frases. Se a pergunta pedir análise, diagnóstico, comparação, plano ou recomendação que exija raciocínio sobre vários números, responda APENAS ${SINAL_ESCALAR} e nada mais.`

type Contexto = { retrato: Retrato; manuais: string; mundo: string | null }
function montarSistema(ctx: Contexto, nivel: Nivel, lang: Idioma): { fixo: string; empresa: string } {
  return {
    fixo: `${REGRAS}${nivel === 'rotina' ? `\n${REGRA_ROTINA}` : ''}`,
    empresa: `${ctx.retrato.texto}\n${textoSetor(ctx.retrato.setor)}\n\nMANUAIS ESPECIALISTAS PARA ESTA PERGUNTA:\n${ctx.manuais}${ctx.mundo ? `\n\nECONOMIA (Axioma Nexus — dados oficiais e manchetes marcadas como jornalísticas):\n${ctx.mundo}` : ''}\n\nHoje: ${new Date().toISOString().slice(0, 10)}. Responda em ${NOME_IDIOMA[lang]}.`,
  }
}

// ─── Chamadas aos provedores (nunca lançam: falha = null) ───
async function chamarOpenAI(sistema: string, msgs: MensagemHistorico[], modelo: string, maxTokens: number, json = false): Promise<string | null> {
  const chave = process.env.OPENAI_API_KEY
  if (!chave) return null
  for (const m of [modelo, OPENAI_RESERVA]) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(45000),
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, max_completion_tokens: maxTokens, messages: [{ role: 'system', content: sistema }, ...msgs], ...(json ? { response_format: { type: 'json_object' } } : {}) }),
      })
      if (!res.ok) { console.error('[motor-ia] OpenAI', m, res.status, (await res.text()).slice(0, 300)); continue }
      const texto = (await res.json())?.choices?.[0]?.message?.content
      if (typeof texto === 'string' && texto.trim()) return texto.trim()
    } catch (err) { console.error('[motor-ia] OpenAI rede', m, err) }
  }
  return null
}

async function chamarClaude(sistema: { fixo: string; empresa: string }, msgs: MensagemHistorico[], nivel: Nivel): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const cfg = MODELOS[nivel]
  try {
    const params = {
      model: cfg.modelo, max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', // recusa do modelo → a Anthropic reroda em outro modelo
      output_config: { effort: cfg.esforco ?? 'medium' },
      system: [
        { type: 'text', text: sistema.fixo, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: sistema.empresa, cache_control: { type: 'ephemeral' } },
      ],
      messages: msgs,
    }
    // `fallbacks` ainda não está nos tipos do SDK instalado — cast só aqui (mesmo padrão do plano do José).
    const r = await new Anthropic().beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
    if (r.stop_reason === 'refusal') return null
    const bloco = r.content.find((b) => b.type === 'text')
    return bloco && bloco.type === 'text' && bloco.text.trim() ? bloco.text.trim() : null
  } catch (err) {
    console.error('[motor-ia] Anthropic', cfg.modelo, err instanceof Error ? err.message : err)
    return null
  }
}

// Triagem por IA barata quando a regra fica em dúvida. Falha → 'analise' (lado seguro).
async function triagemPorIA(pergunta: string): Promise<Nivel> {
  const r = await chamarOpenAI(
    'Classifique a pergunta de um dono de empresa para o CFO digital. Responda JSON {"nivel": "rotina"|"analise"|"estrategica"}. rotina = fato direto (um valor, uma data, uma definição). analise = entender causa, comparar, decidir algo do dia a dia. estrategica = plano, projeção, cenário de longo prazo, decisão grande (investir, expandir, reestruturar).',
    [{ role: 'user', content: pergunta.slice(0, 1500) }], MODELOS.rotina.modelo, 300, true)
  try { const n = JSON.parse(r ?? '{}').nivel; return ORDEM.includes(n) ? n : 'analise' } catch { return 'analise' }
}

export type RespostaMotor = {
  resposta: string | null // null = motor inteiro falhou → quem chamou usa as regras
  nivel: Nivel
  provedor: 'openai' | 'anthropic' | null
  modelo: string | null
  escalou: boolean
  triagem: 'regra' | 'ia'
  valoresNaoConferidos: number
  setor: string | null
  caracteresEnviados: number
}

export async function perguntarAoMotor(args: {
  supabase: SupabaseClient; empresaId: string; pergunta: string; historico?: MensagemHistorico[]; tela?: string; lang?: Idioma; nivelMinimo?: Nivel
}): Promise<RespostaMotor> {
  const lang = args.lang ?? 'pt'
  const pergunta = args.pergunta.trim().slice(0, 4000)
  const manuais = escolherManuais(pergunta, args.tela)
  const porRegra = triagemPorRegra(pergunta, manuais.length)
  let nivel = subir(porRegra ?? await triagemPorIA(pergunta), args.nivelMinimo ?? 'rotina')
  const triagem = porRegra ? 'regra' : 'ia'

  const precisaMundo = nivel === 'estrategica' || manuais.some((m) => m.id === 'economia')
  const [retrato, mundo] = await Promise.all([
    montarRetrato(args.supabase, args.empresaId),
    precisaMundo ? montarContextoMundo(args.supabase).catch(() => null) : Promise.resolve(null),
  ])
  // Pergunta tributária leva a comparação de regimes (mesma simulação da tela IA Tributária).
  const fiscal = manuais.some((m) => m.id === 'tributario') ? `\n${textoFiscal(retrato)}` : ''
  const ctx: Contexto = { retrato, manuais: (manuais.map((m) => m.texto).join('\n') || 'nenhum específico — responda como CFO generalista') + fiscal, mundo }
  // Histórico: só texto, últimas 8 falas, sem a pergunta atual (vai no fim, uma vez só).
  const msgs: MensagemHistorico[] = [...(args.historico ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()).slice(-8), { role: 'user', content: pergunta }]
  const base = { triagem, setor: retrato.setor?.nome.pt ?? null } as const
  // Base da conferência: retrato + economia + o que o próprio usuário citou.
  const textoConferencia = [retrato.texto, mundo ?? '', ...msgs.map((m) => m.content)].join('\n')
  let escalou = false

  const executar = async (n: Nivel): Promise<{ texto: string | null; provedor: 'openai' | 'anthropic'; modelo: string; enviados: number }> => {
    const sistema = montarSistema(ctx, n, lang)
    const enviados = sistema.fixo.length + sistema.empresa.length + msgs.reduce((t, m) => t + m.content.length, 0)
    if (MODELOS[n].provedor === 'openai') return { texto: await chamarOpenAI(`${sistema.fixo}\n\n${sistema.empresa}`, msgs, MODELOS[n].modelo, 2000), provedor: 'openai', modelo: MODELOS[n].modelo, enviados }
    const texto = await chamarClaude(sistema, msgs, n)
    if (texto) return { texto, provedor: 'anthropic', modelo: MODELOS[n].modelo, enviados }
    // Anthropic fora do ar: a OpenAI responde no lugar (sem a regra de escalar), melhor que nada.
    const reserva = await chamarOpenAI(`${sistema.fixo}\n\n${sistema.empresa}`, msgs, OPENAI_RESERVA, 3000)
    return { texto: reserva, provedor: 'openai', modelo: OPENAI_RESERVA, enviados }
  }

  let r = await executar(nivel)
  // Rotina que não dá conta (ou inventou número) passa pra cima.
  if (nivel === 'rotina' && (!r.texto || r.texto.includes(SINAL_ESCALAR) || conferirNumeros(r.texto, textoConferencia).length > 0)) {
    nivel = 'analise'; escalou = true
    r = await executar(nivel)
  }
  if (r.texto?.includes(SINAL_ESCALAR)) r.texto = null
  const naoConferidos = r.texto ? conferirNumeros(r.texto, textoConferencia) : []
  return { ...base, resposta: r.texto, nivel, provedor: r.texto ? r.provedor : null, modelo: r.texto ? r.modelo : null, escalou, valoresNaoConferidos: naoConferidos.length, caracteresEnviados: r.enviados }
}
