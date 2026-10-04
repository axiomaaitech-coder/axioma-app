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
import { escolherManuais, textoManual } from './manuais'
import { montarContextoMundo } from '../nexusBriefing'
import { FERRAMENTAS, executarFerramenta } from './ferramentas'

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
// Regra do Elias (2026-10-03): a Anthropic (paga) só atende IA Financeira, IA Tributária,
// José/Nexus e relatórios complexos. Em qualquer outra tela, análise e estratégia vão
// para o modelo forte da OpenAI. (O José usa lib/nexusJoseph/Briefing/Plano direto.)
export const TELAS_ANTHROPIC = new Set(['ia-financeira', 'ia-tributaria', 'nexus', 'nexus-simulacoes', 'relatorios'])
const OPENAI_FORTE = 'gpt-4o'

// ─── Medição de consumo (B2 — painel de custo) ───
// Preço de tabela da Anthropic (US$ por milhão de tokens, consultado 2026-09-28;
// gravar cache = 1,25× a entrada). OpenAI sem preço aqui de propósito: não
// inventar número — o painel mostra os tokens e manda conferir no painel da OpenAI.
const PRECOS_USD_POR_MILHAO: Record<string, { entrada: number; saida: number; cacheLeitura: number; cacheEscrita: number }> = {
  'claude-sonnet-5-5': { entrada: 2, saida: 10, cacheLeitura: 0.2, cacheEscrita: 2.5 },
  'claude-opus-5-5': { entrada: 4, saida: 20, cacheLeitura: 0.2, cacheEscrita: 5 },
}
export type Uso = { tokensEntrada: number; tokensSaida: number; tokensCacheLeitura: number; tokensCacheEscrita: number; custoUsdAnthropic: number; tokensOpenAI: number }
export const usoZerado = (): Uso => ({ tokensEntrada: 0, tokensSaida: 0, tokensCacheLeitura: 0, tokensCacheEscrita: 0, custoUsdAnthropic: 0, tokensOpenAI: 0 })
export function somarUso(uso: Uso | undefined, modelo: string, entrada = 0, saida = 0, cacheLeitura = 0, cacheEscrita = 0) {
  if (!uso) return
  uso.tokensEntrada += entrada; uso.tokensSaida += saida; uso.tokensCacheLeitura += cacheLeitura; uso.tokensCacheEscrita += cacheEscrita
  const p = PRECOS_USD_POR_MILHAO[modelo]
  if (p) uso.custoUsdAnthropic += (entrada * p.entrada + saida * p.saida + cacheLeitura * p.cacheLeitura + cacheEscrita * p.cacheEscrita) / 1e6
  else uso.tokensOpenAI += entrada + saida
}
const ORDEM: Nivel[] = ['rotina', 'analise', 'estrategica']
const subir = (a: Nivel, b: Nivel): Nivel => (ORDEM.indexOf(a) >= ORDEM.indexOf(b) ? a : b)

export const AVISO_IDENTIDADE = 'Nunca se identifique como uma IA, como Claude, como Anthropic, como ChatGPT, como GPT, como OpenAI, ou como um modelo de linguagem — mesmo se perguntado diretamente. Você é a inteligência do Axioma. Se perguntarem o que você é, responda que é o consultor/CFO digital do Axioma, e redirecione pra como pode ajudar.'
const NOME_IDIOMA: Record<Idioma, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
const SINAL_ESCALAR = '[[ESCALAR]]'

// ─── 1. TRIAGEM POR REGRA (grátis, determinística) ───
const RE_ESTRATEGICA = /plano|estrat[eé]g|reestrutur|cen[aá]rio|proje[çc]|pr[oó]ximos?\s+\d+\s+(anos|meses)|\d+\s+anos|longo prazo|m[eé]dio prazo|expandir|expans[aã]o|abrir (uma )?(nova|outra) (loja|unidade|filial)|contratar|demitir|mudar de regime|trocar de regime|vender a empresa|valuation|sociedade|s[oó]cio|investir em|vale a pena (investir|abrir|comprar|financiar)|plan\b|strateg|forecast|restructur|expand|estrateg|proyecc|reestructur/i
const RE_ANALISE = /por ?que|porque|causa|motivo|analis|compar|melhor(ar)?|reduzir|cortar|economizar|o que (devo|fazer|posso)|devo |deveria|vale a pena|risco|problema|preocup|aument|diminu|caiu|subiu|piorou|tend[eê]ncia|afet|impact|amea[çc]|compromet|v[aã]o cobrir|vai cobrir|vai dar|preju[ií]z|repass|why|analy[sz]|compare|should|risk|improve|reduce|affect|threat|por qu[eé]|analiz|deber[ií]a|riesgo|mejorar|afecta/i
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
- Quando precisar de detalhe além do retrato (quais contas, quais clientes, quais produtos, mês a mês), use as ferramentas de consulta, se estiverem disponíveis.
- Se faltar dado para responder, diga exatamente qual dado cadastrar e em qual tela.
- Reforma Tributária: premissa + data + aviso de que pode mudar; nunca apenas "consulte um contador".
- Escreva em texto simples (a tela não lê markdown): nada de **, #, tabelas ou crases; listas com "1." ou "-" em linhas separadas; parágrafos curtos.
- ${AVISO_IDENTIDADE}`

const REGRA_ROTINA = `- Você responde perguntas DIRETAS e rápidas (um número, uma data, uma definição) em até 4 frases. Se a pergunta pedir análise, diagnóstico, comparação, plano ou recomendação que exija raciocínio sobre vários números — ou uma LISTA/detalhe que não aparece nos dados acima (quais contas, quais clientes, quais produtos) —, responda APENAS ${SINAL_ESCALAR} e nada mais.`

type Contexto = { retrato: Retrato; manuais: string; mundo: string | null; tela: string | null }
function montarSistema(ctx: Contexto, nivel: Nivel, lang: Idioma): { fixo: string; empresa: string } {
  // Dados/instruções da tela vêm DEPOIS de tudo que é estável (não quebram o cache
  // da parte da empresa) e nunca derrubam as regras invioláveis.
  const tela = ctx.tela ? `\n\nINSTRUÇÕES E DADOS DESTA TELA (calculados pelo Axioma na tela de origem — siga o formato pedido aqui, sem violar as regras invioláveis):\n${ctx.tela}` : ''
  return {
    fixo: `${REGRAS}${nivel === 'rotina' ? `\n${REGRA_ROTINA}` : ''}`,
    empresa: `${ctx.retrato.texto}\n${textoSetor(ctx.retrato.setor)}\n\nMANUAIS ESPECIALISTAS PARA ESTA PERGUNTA:\n${ctx.manuais}${ctx.mundo ? `\n\nECONOMIA (Axioma Nexus — dados oficiais e manchetes marcadas como jornalísticas):\n${ctx.mundo}` : ''}${tela}\n\nHoje: ${new Date().toISOString().slice(0, 10)}. Responda em ${NOME_IDIOMA[lang]}.`,
  }
}

// ─── Chamadas aos provedores (nunca lançam: falha = null) ───
// Tarefa curta e estruturada de servidor (extrair/classificar, resposta em JSON),
// sem retrato de empresa — ex.: sugestão de produto por código de barras. Regra
// fixa: rotina = OpenAI, pelo MESMO modelo de rotina do motor (nunca outro provedor).
export async function tarefaDeRotina(sistema: string, entrada: string, opcoes: { maxTokens: number; timeoutMs: number }): Promise<string | null> {
  return chamarOpenAI(`${sistema}\n${AVISO_IDENTIDADE}`, [{ role: 'user', content: entrada }], MODELOS.rotina.modelo, opcoes.maxTokens, true, opcoes.timeoutMs)
}

// Leitura de documento (PDF ou foto) com visão — B3, nota fiscal sem XML. Ler
// nota com tabela, parcelas e impostos é tarefa de ANÁLISE (Claude), nunca
// rotina. Resposta presa num esquema JSON (structured outputs). Falha = null.
export type ArquivoVisao = { base64: string; mediaType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' }
// `diag.motivo` diz por que voltou null (sem conteúdo do documento) — a rota manda pro Sentry.
// Claude primeiro; se falhar (sem crédito, fora do ar, recusa), a OpenAI lê no lugar.
export async function lerDocumentoComVisao(arquivo: ArquivoVisao, instrucao: string, esquema: Record<string, unknown>, uso?: Uso, diag?: { motivo?: string }): Promise<{ dados: unknown; modelo: string } | null> {
  // Leitura de nota (PDF/foto) é OpenAI desde 2026-10-03 (regra do Elias); Claude só de reserva.
  const openai = await lerDocumentoComOpenAI(arquivo, instrucao, esquema, uso)
  if (openai) return openai
  const claude = await lerDocumentoComClaude(arquivo, instrucao, esquema, uso, diag)
  if (claude) return claude
  if (diag) diag.motivo = `${diag.motivo ?? '?'} | OpenAI e reserva Claude falharam`
  return null
}

const OPENAI_VISAO = ['gpt-4o', 'gpt-4o-mini']

async function lerDocumentoComOpenAI(arquivo: ArquivoVisao, instrucao: string, esquema: Record<string, unknown>, uso?: Uso): Promise<{ dados: unknown; modelo: string } | null> {
  const chave = process.env.OPENAI_API_KEY
  if (!chave) return null
  const dataUrl = `data:${arquivo.mediaType};base64,${arquivo.base64}`
  const bloco = arquivo.mediaType === 'application/pdf'
    ? { type: 'file', file: { filename: 'documento.pdf', file_data: dataUrl } }
    : { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } }
  for (const m of OPENAI_VISAO) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(50000), // 2 tentativas cabem nos 120s da rota
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: m, max_completion_tokens: 8000,
          response_format: { type: 'json_schema', json_schema: { name: 'nota', strict: true, schema: esquema } },
          messages: [
            { role: 'system', content: `${instrucao}
${AVISO_IDENTIDADE}` },
            { role: 'user', content: [bloco, { type: 'text', text: 'Leia este documento e devolva os dados no formato pedido.' }] },
          ],
        }),
      })
      if (!res.ok) { console.error('[motor-ia] visão OpenAI', m, res.status, (await res.text()).slice(0, 300)); continue }
      const dados = await res.json()
      somarUso(uso, m, dados?.usage?.prompt_tokens, dados?.usage?.completion_tokens)
      const texto = dados?.choices?.[0]?.message?.content
      if (typeof texto === 'string' && texto.trim()) return { dados: JSON.parse(texto), modelo: m }
    } catch (err) { console.error('[motor-ia] visão OpenAI rede', m, err instanceof Error ? err.message : err) }
  }
  return null
}

async function lerDocumentoComClaude(arquivo: ArquivoVisao, instrucao: string, esquema: Record<string, unknown>, uso?: Uso, diag?: { motivo?: string }): Promise<{ dados: unknown; modelo: string } | null> {
  if (!process.env.ANTHROPIC_API_KEY) { if (diag) diag.motivo = 'sem_chave'; return null }
  const cfg = MODELOS.analise
  const bloco = arquivo.mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: arquivo.mediaType, data: arquivo.base64 } }
    : { type: 'image', source: { type: 'base64', media_type: arquivo.mediaType, data: arquivo.base64 } }
  try {
    const params = {
      model: cfg.modelo, max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: esquema } },
      system: `${instrucao}\n${AVISO_IDENTIDADE}`,
      messages: [{ role: 'user', content: [bloco, { type: 'text', text: 'Leia este documento e devolva os dados no formato pedido.' }] }],
    }
    // `fallbacks` ainda não está nos tipos do SDK instalado — cast só aqui (mesmo padrão de chamarClaude).
    const r = await new Anthropic().beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
    somarUso(uso, cfg.modelo, r.usage?.input_tokens ?? 0, r.usage?.output_tokens ?? 0, r.usage?.cache_read_input_tokens ?? 0, r.usage?.cache_creation_input_tokens ?? 0)
    if (r.stop_reason === 'refusal' || r.stop_reason === 'max_tokens') { if (diag) diag.motivo = r.stop_reason; return null }
    const texto = r.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('').trim()
    if (!texto && diag) diag.motivo = 'resposta_vazia'
    return texto ? { dados: JSON.parse(texto), modelo: cfg.modelo } : null
  } catch (err) {
    console.error('[motor-ia] visão', cfg.modelo, err instanceof Error ? err.message : err)
    if (diag) diag.motivo = err instanceof Anthropic.APIError ? `api_${err.status}: ${err.message.slice(0, 300)}` : `erro: ${err instanceof Error ? err.message.slice(0, 300) : 'desconhecido'}`
    return null
  }
}

async function chamarOpenAI(sistema: string, msgs: MensagemHistorico[], modelo: string, maxTokens: number, json = false, timeoutMs = 45000, uso?: Uso): Promise<string | null> {
  const chave = process.env.OPENAI_API_KEY
  if (!chave) return null
  for (const m of [modelo, OPENAI_RESERVA]) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST', signal: AbortSignal.timeout(timeoutMs),
        headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: m, max_completion_tokens: maxTokens, messages: [{ role: 'system', content: sistema }, ...msgs], ...(json ? { response_format: { type: 'json_object' } } : {}) }),
      })
      if (!res.ok) { console.error('[motor-ia] OpenAI', m, res.status, (await res.text()).slice(0, 300)); continue }
      const dados = await res.json()
      somarUso(uso, m, dados?.usage?.prompt_tokens, dados?.usage?.completion_tokens)
      const texto = dados?.choices?.[0]?.message?.content
      if (typeof texto === 'string' && texto.trim()) return texto.trim()
    } catch (err) { console.error('[motor-ia] OpenAI rede', m, err) }
  }
  return null
}

// Claude com as ferramentas de consulta (fase 3): até MAX_CONSULTAS rodadas; na
// última, tool_choice "none" obriga a responder com o que já tem. O conteúdo de
// cada resposta volta inteiro no histórico (blocos de raciocínio inclusive).
const MAX_CONSULTAS = 4
type ConsultaClaude = { texto: string | null; dadosConsultados: string[] }
async function chamarClaude(sistema: { fixo: string; empresa: string }, msgs: MensagemHistorico[], nivel: Nivel, consulta: { supabase: SupabaseClient; empresaId: string }, uso?: Uso): Promise<ConsultaClaude> {
  const dadosConsultados: string[] = []
  if (!process.env.ANTHROPIC_API_KEY) return { texto: null, dadosConsultados }
  const cfg = MODELOS[nivel]
  const client = new Anthropic()
  const conversa: Anthropic.Beta.BetaMessageParam[] = msgs.map((m) => ({ role: m.role, content: m.content }))
  try {
    for (let rodada = 0; rodada <= MAX_CONSULTAS; rodada++) {
      const params = {
        model: cfg.modelo, max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default', // recusa do modelo → a Anthropic reroda em outro modelo
        output_config: { effort: cfg.esforco ?? 'medium' },
        tools: FERRAMENTAS,
        tool_choice: { type: rodada === MAX_CONSULTAS ? 'none' : 'auto' },
        system: [
          { type: 'text', text: sistema.fixo, cache_control: { type: 'ephemeral' } },
          { type: 'text', text: sistema.empresa, cache_control: { type: 'ephemeral' } },
        ],
        messages: conversa,
      }
      // `fallbacks` ainda não está nos tipos do SDK instalado — cast só aqui (mesmo padrão do plano do José).
      const r = await client.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
      somarUso(uso, cfg.modelo, r.usage?.input_tokens ?? 0, r.usage?.output_tokens ?? 0, r.usage?.cache_read_input_tokens ?? 0, r.usage?.cache_creation_input_tokens ?? 0)
      if (r.stop_reason === 'refusal') return { texto: null, dadosConsultados }
      const pedidos = r.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use')
      if (r.stop_reason !== 'tool_use' || !pedidos.length) {
        const texto = r.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('\n').trim()
        return { texto: texto || null, dadosConsultados }
      }
      conversa.push({ role: 'assistant', content: r.content })
      // Consultas em paralelo; todos os resultados voltam numa mensagem só.
      const resultados = await Promise.all(pedidos.map(async (p) => {
        const saida = await executarFerramenta(consulta.supabase, consulta.empresaId, p.name, (p.input ?? {}) as Record<string, unknown>)
        dadosConsultados.push(saida)
        return { type: 'tool_result' as const, tool_use_id: p.id, content: saida, is_error: saida.startsWith('{"erro"') }
      }))
      conversa.push({ role: 'user', content: resultados })
    }
    return { texto: null, dadosConsultados }
  } catch (err) {
    console.error('[motor-ia] Anthropic', cfg.modelo, err instanceof Error ? err.message : err)
    return { texto: null, dadosConsultados }
  }
}

// Números puros vindos das ferramentas viram "R$ x" conhecidos na conferência.
const RE_NUMERO_JSON = /-?\d+(?:\.\d+)?/g
export function reaisDasConsultas(dados: string[]): string {
  return dados.flatMap((d) => [...d.matchAll(RE_NUMERO_JSON)].map((m) => Number(m[0])))
    .filter((v) => Number.isFinite(v) && Math.abs(v) >= 1)
    .map((v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`).join(' ')
}

// Triagem por IA barata quando a regra fica em dúvida. Falha → 'analise' (lado seguro).
async function triagemPorIA(pergunta: string, uso?: Uso): Promise<Nivel> {
  const r = await chamarOpenAI(
    'Classifique a pergunta de um dono de empresa para o CFO digital. Responda JSON {"nivel": "rotina"|"analise"|"estrategica"}. rotina = fato direto (um valor, uma data, uma definição). analise = entender causa, comparar, decidir algo do dia a dia. estrategica = plano, projeção, cenário de longo prazo, decisão grande (investir, expandir, reestruturar).',
    [{ role: 'user', content: pergunta.slice(0, 1500) }], MODELOS.rotina.modelo, 300, true, 45000, uso)
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
  consultas: number // quantas ferramentas de consulta a IA usou
  uso: Uso // tokens e custo desta pergunta (painel de custo)
  setor: string | null
  caracteresEnviados: number
}

export async function perguntarAoMotor(args: {
  supabase: SupabaseClient; empresaId: string; pergunta: string; historico?: MensagemHistorico[]; tela?: string; lang?: Idioma; nivelMinimo?: Nivel
  contextoTela?: string // números e formato pedidos pela tela de origem (ex.: dados do DAS no MEI)
}): Promise<RespostaMotor> {
  const lang = args.lang ?? 'pt'
  const pergunta = args.pergunta.trim().slice(0, 4000)
  const manuais = escolherManuais(pergunta, args.tela)
  const porRegra = triagemPorRegra(pergunta, manuais.length)
  const uso = usoZerado()
  let nivel = subir(porRegra ?? await triagemPorIA(pergunta, uso), args.nivelMinimo ?? 'rotina')
  const triagem = porRegra ? 'regra' : 'ia'

  const precisaMundo = nivel === 'estrategica' || manuais.some((m) => m.id === 'economia')
  const [retrato, mundo] = await Promise.all([
    montarRetrato(args.supabase, args.empresaId),
    precisaMundo ? montarContextoMundo(args.supabase).catch(() => null) : Promise.resolve(null),
  ])
  // Pergunta tributária leva a comparação de regimes (mesma simulação da tela IA Tributária).
  const fiscal = manuais.some((m) => m.id === 'tributario') ? `\n${textoFiscal(retrato)}` : ''
  const contextoTela = args.contextoTela?.trim().slice(0, 12000) || null
  const ctx: Contexto = { retrato, manuais: (manuais.map(textoManual).join('\n') || 'nenhum específico — responda como CFO generalista') + fiscal, mundo, tela: contextoTela }
  // Histórico: só texto, últimas 8 falas, sem a pergunta atual (vai no fim, uma vez só).
  const msgs: MensagemHistorico[] = [...(args.historico ?? []).filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim()).slice(-8), { role: 'user', content: pergunta }]
  const base = { triagem, setor: retrato.setor?.nome.pt ?? null } as const
  // Base da conferência: retrato + economia + o que o próprio usuário citou.
  const textoConferencia = [retrato.texto, mundo ?? '', contextoTela ?? '', ...msgs.map((m) => m.content)].join('\n')
  let escalou = false

  const executar = async (n: Nivel): Promise<{ texto: string | null; provedor: 'openai' | 'anthropic'; modelo: string; enviados: number; consultas?: string[] }> => {
    const sistema = montarSistema(ctx, n, lang)
    const enviados = sistema.fixo.length + sistema.empresa.length + msgs.reduce((t, m) => t + m.content.length, 0)
    if (MODELOS[n].provedor === 'openai') return { texto: await chamarOpenAI(`${sistema.fixo}\n\n${sistema.empresa}`, msgs, MODELOS[n].modelo, 2000, false, 45000, uso), provedor: 'openai', modelo: MODELOS[n].modelo, enviados }
    if (!TELAS_ANTHROPIC.has(args.tela ?? '')) return { texto: await chamarOpenAI(`${sistema.fixo}\n\n${sistema.empresa}`, msgs, OPENAI_FORTE, 3000, false, 45000, uso), provedor: 'openai', modelo: OPENAI_FORTE, enviados }
    const { texto, dadosConsultados } = await chamarClaude(sistema, msgs, n, { supabase: args.supabase, empresaId: args.empresaId }, uso)
    if (texto) return { texto, provedor: 'anthropic', modelo: MODELOS[n].modelo, enviados: enviados + dadosConsultados.join('').length, consultas: dadosConsultados }
    // Anthropic fora do ar: a OpenAI responde no lugar (sem a regra de escalar), melhor que nada.
    const reserva = await chamarOpenAI(`${sistema.fixo}\n\n${sistema.empresa}`, msgs, OPENAI_RESERVA, 3000, false, 45000, uso)
    return { texto: reserva, provedor: 'openai', modelo: OPENAI_RESERVA, enviados }
  }

  let r = await executar(nivel)
  // Rotina que não dá conta (ou inventou número) passa pra cima.
  if (nivel === 'rotina' && (!r.texto || r.texto.includes(SINAL_ESCALAR) || conferirNumeros(r.texto, textoConferencia).length > 0)) {
    nivel = 'analise'; escalou = true
    r = await executar(nivel)
  }
  if (r.texto?.includes(SINAL_ESCALAR)) r.texto = null
  // Valores trazidos pelas ferramentas de consulta também contam como dado real.
  const naoConferidos = r.texto ? conferirNumeros(r.texto, `${textoConferencia}\n${reaisDasConsultas(r.consultas ?? [])}`) : []
  return { ...base, resposta: r.texto, nivel, provedor: r.texto ? r.provedor : null, modelo: r.texto ? r.modelo : null, escalou, valoresNaoConferidos: naoConferidos.length, consultas: r.consultas?.length ?? 0, caracteresEnviados: r.enviados, uso }
}
