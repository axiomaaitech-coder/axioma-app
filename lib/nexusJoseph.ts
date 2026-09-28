// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 4: JOSEPH, a inteligência interpretadora do Nexus.
// Só servidor (usa ANTHROPIC_API_KEY e service_role) — nunca importar em
// componente de tela.
//
// Um evento → uma análise por idioma, gerada UMA vez e guardada em
// nexus_global_event.joseph_analise ({ pt: {...}, en: {...} }) — todos os
// clientes leem a mesma, custo não cresce com o número de usuários.
//
// Regras do Push 03 que vão no prompt (e não só na tela): nunca inventar
// dado/fonte, nunca afirmar certeza ("isso acontecerá"), sempre expor
// confiança + porquê + incertezas, fato ≠ interpretação. José observa,
// interpreta e recomenda — não executa nada (isso é a ZIA, com aprovação).
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { textoEvento, fonteDaSerie, type PayloadEvento } from './nexusEventDetector'

export const MODELO_JOSEPH = 'claude-opus-5'
export type IdiomaJoseph = 'pt' | 'en' | 'es'

export type AnaliseJoseph = {
  resumo: string
  leitura: string
  impacto_brasil: string
  impacto_global: string
  impacto_setores: { setor: string; efeito: string; direcao: 'positivo' | 'negativo' | 'misto' }[]
  impacto_empresa: string
  cenarios: { tipo: 'base' | 'favoravel' | 'adverso' | 'choque'; titulo: string; descricao: string; probabilidade: number }[]
  o_que_fazer: { acao: string; prioridade: 'alta' | 'media' | 'baixa'; horizonte: string }[]
  risco: string
  oportunidade: string
  confianca: number
  porque_confianca: string[]
  incertezas: string[]
  horizonte: string
}

const txt = { type: 'string' }
// Structured outputs: todo objeto com additionalProperties:false e todos os
// campos em required — a resposta sempre cabe exatamente nas seções da tela.
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumo', 'leitura', 'impacto_brasil', 'impacto_global', 'impacto_setores', 'impacto_empresa', 'cenarios', 'o_que_fazer', 'risco', 'oportunidade', 'confianca', 'porque_confianca', 'incertezas', 'horizonte'],
  properties: {
    resumo: txt,
    leitura: txt,
    impacto_brasil: txt,
    impacto_global: txt,
    impacto_setores: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['setor', 'efeito', 'direcao'],
        properties: { setor: txt, efeito: txt, direcao: { type: 'string', enum: ['positivo', 'negativo', 'misto'] } },
      },
    },
    impacto_empresa: txt,
    cenarios: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['tipo', 'titulo', 'descricao', 'probabilidade'],
        properties: { tipo: { type: 'string', enum: ['base', 'favoravel', 'adverso', 'choque'] }, titulo: txt, descricao: txt, probabilidade: { type: 'integer' } },
      },
    },
    o_que_fazer: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['acao', 'prioridade', 'horizonte'],
        properties: { acao: txt, prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] }, horizonte: txt },
      },
    },
    risco: txt,
    oportunidade: txt,
    confianca: { type: 'integer' },
    porque_confianca: { type: 'array', items: txt },
    incertezas: { type: 'array', items: txt },
    horizonte: txt,
  },
}

const NOME_IDIOMA: Record<IdiomaJoseph, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }

// Prompt estável (cacheável): identidade + regras. O que varia (evento,
// indicadores, data) vai só na mensagem do usuário.
const SISTEMA = `Você é José, a inteligência interpretadora do Axioma Nexus — o módulo que observa a economia e traduz acontecimentos em decisões para donos de pequenas e médias empresas brasileiras.

Sua tarefa: interpretar UM evento econômico detectado a partir de uma série oficial (Banco Central do Brasil, IPEA, BCE, FMI ou IBGE) e explicar o que ele significa para o Brasil, para os setores e para uma empresa típica, com cenários e ações.

Regras invioláveis:
- Use SOMENTE os dados fornecidos na mensagem (o evento e os indicadores atuais). Nunca invente número, data, fonte, lei, notícia ou declaração de autoridade. Se precisar de algo que não foi fornecido, diga que é uma limitação.
- Nunca afirme certeza sobre o futuro. Não escreva "isso vai acontecer"; escreva "dadas as evidências atuais, o cenário mais provável é...".
- Separe fato de interpretação: "resumo" é só o fato confirmado; "leitura" e o resto é interpretação sua.
- Correlação não é causalidade comprovada: quando ligar causas e efeitos, trate como mecanismo provável, não como prova.
- Cenários: de 3 a 4, sempre um "base", um "favoravel" e um "adverso" ("choque" só se fizer sentido). As probabilidades são inteiros que somam 100.
- "o_que_fazer": exatamente 3 ações práticas e prudentes que um dono de empresa consegue executar (ex.: revisar preços, renegociar dívida, proteger caixa). Nada de recomendação de investimento em ativo específico.
- "impacto_setores": de 2 a 4 setores mais afetados.
- "confianca" (0 a 100) mede o quanto a SUA interpretação se sustenta, não o dado (o dado é oficial). "porque_confianca": 2 a 4 motivos curtos. "incertezas": 2 a 4 fatores que podem mudar o quadro.
- "horizonte": o período a que a análise se refere (ex.: "próximos 12 meses").
- Linguagem simples, direta, de CFO conversando com um empresário. Frases curtas. Sem jargão sem explicação.
- Nunca se identifique como IA, modelo de linguagem, Claude, Anthropic ou qualquer outro provedor. Você é o José, do Axioma.
- Escreva todos os textos no idioma pedido na mensagem.`

type LinhaSerie = { serie_codigo: string; serie_nome: string | null; valor: number; data_referencia: string }

async function indicadoresAtuais(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase
    .from('nexus_economic_series')
    .select('serie_codigo, serie_nome, valor, data_referencia')
    .order('data_referencia', { ascending: false })
    .limit(400)
  const ultimo = new Map<string, LinhaSerie>()
  for (const l of (data ?? []) as LinhaSerie[]) if (!ultimo.has(l.serie_codigo)) ultimo.set(l.serie_codigo, l)
  return [...ultimo.values()].map((l) => `- ${l.serie_nome ?? l.serie_codigo}: ${l.valor} (referência ${l.data_referencia})`).join('\n')
}

export class FalhaJoseph extends Error {}

export async function gerarAnaliseJoseph(
  supabase: SupabaseClient,
  evento: { natureza: string; category: string | null; payload: PayloadEvento },
  lang: IdiomaJoseph,
): Promise<AnaliseJoseph> {
  if (!process.env.ANTHROPIC_API_KEY) throw new FalhaJoseph('ANTHROPIC_API_KEY ausente')
  const client = new Anthropic()
  const indicadores = await indicadoresAtuais(supabase)
  const fato = textoEvento(evento.payload, 'pt')

  const mensagem = `Idioma da resposta: ${NOME_IDIOMA[lang]}.
Data de hoje: ${new Date().toISOString().slice(0, 10)}.

EVENTO (natureza: ${evento.natureza}; categoria: ${evento.category ?? 'não informada'}; fonte: série oficial — ${fonteDaSerie(evento.payload.serie, 'pt')})
${fato.titulo}. ${fato.descricao}
Dados brutos: ${JSON.stringify(evento.payload)}

INDICADORES OFICIAIS MAIS RECENTES (Banco Central / IBGE)
${indicadores || '- (indisponíveis no momento)'}`

  // fallbacks "default": se o modelo recusar por política, a própria API
  // refaz a chamada num modelo reserva (beta server-side-fallback-2026-07-01).
  const params = {
    model: MODELO_JOSEPH,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    output_config: { format: { type: 'json_schema', schema: SCHEMA } },
    messages: [{ role: 'user', content: mensagem }],
  }
  // `fallbacks` ainda não está nos tipos do SDK instalado (0.104) — cast só aqui.
  const resposta = await client.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)

  if (resposta.stop_reason === 'refusal') throw new FalhaJoseph('recusa do modelo')
  if (resposta.stop_reason === 'max_tokens') throw new FalhaJoseph('resposta cortada (max_tokens)')
  const bloco = resposta.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new FalhaJoseph('resposta sem texto')
  try {
    return JSON.parse(bloco.text) as AnaliseJoseph
  } catch {
    throw new FalhaJoseph('JSON inválido na resposta')
  }
}

// Lê a análise guardada; se não houver no idioma pedido, gera, grava e devolve.
// Merge por idioma: gerar 'en' não apaga o 'pt' já existente.
export async function obterOuGerarAnalise(supabase: SupabaseClient, eventId: string, lang: IdiomaJoseph): Promise<AnaliseJoseph> {
  const { data: ev, error } = await supabase
    .from('nexus_global_event')
    .select('event_id, natureza, category, payload, joseph_analise')
    .eq('event_id', eventId)
    .maybeSingle()
  if (error) throw new FalhaJoseph(`leitura do evento: ${error.message}`)
  if (!ev) throw new FalhaJoseph('evento não encontrado')
  const existentes = (ev.joseph_analise ?? {}) as Partial<Record<IdiomaJoseph, AnaliseJoseph>>
  if (existentes[lang]) return existentes[lang]!
  if (!ev.payload) throw new FalhaJoseph('evento sem payload (anterior à Etapa 3)')

  const analise = await gerarAnaliseJoseph(supabase, { natureza: ev.natureza, category: ev.category, payload: ev.payload as PayloadEvento }, lang)
  const { error: erroGravar } = await supabase
    .from('nexus_global_event')
    .update({ joseph_analise: { ...existentes, [lang]: analise }, joseph_gerado_em: new Date().toISOString(), joseph_modelo: MODELO_JOSEPH })
    .eq('event_id', eventId)
  if (erroGravar) throw new FalhaJoseph(`gravação da análise: ${erroGravar.message}`)
  return analise
}
