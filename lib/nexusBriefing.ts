// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 7: painel executivo do José (síntese diária).
// Só servidor (ANTHROPIC_API_KEY + service_role). Uma síntese por dia e idioma,
// gerada 1x e lida por todos (nexus_briefing, UNIQUE(data, lang)).
// Complexa e rara → Anthropic (regra de roteamento de IA do Axioma).
// Entrada só com dado do próprio Axioma: indicadores oficiais (atual e 30 dias
// antes), eventos dos últimos 30 dias, leituras do José e manchetes coletadas
// (marcadas como fonte jornalística). Horizontes longos = tendência estrutural
// com confiança baixa declarada, nunca previsão.
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MODELO_JOSEPH, type IdiomaJoseph } from './nexusJoseph'
import { CANAL_GEOPOLITICA } from './nexusFontesMundo'
import { SERIES_PREVISAO, HORIZONTES_PREVISAO, ultimosValoresPrevisao, registrarPrevisoes, textoPlacar, type PrevisaoIA } from './nexusPrevisoes'

type Bloco = { titulo: string; texto: string }
type Item = { titulo: string; texto: string; gravidade: 'alta' | 'media' | 'baixa' }
type Horizonte = { titulo: string; texto: string; confianca: number }

export type BriefingJose = {
  mundo: Bloco
  brasil: Bloco
  alertas: Item[]
  riscos: Item[]
  oportunidades: Item[]
  horizonte_12m: Horizonte
  horizonte_3a: Horizonte
  horizonte_5a: Horizonte
  horizonte_10a: Horizonte
  nao_estou_vendo: Bloco
  jose_faria: { titulo: string; acoes: string[] }
  confianca_geral: number
  base_usada: string[]
  limitacoes: string[]
  previsoes?: PrevisaoIA[] // só no PT (Etapa 9 — memória de previsões)
}

const s = { type: 'string' }
const bloco = { type: 'object', additionalProperties: false, required: ['titulo', 'texto'], properties: { titulo: s, texto: s } }
const item = { type: 'object', additionalProperties: false, required: ['titulo', 'texto', 'gravidade'], properties: { titulo: s, texto: s, gravidade: { type: 'string', enum: ['alta', 'media', 'baixa'] } } }
const horizonte = { type: 'object', additionalProperties: false, required: ['titulo', 'texto', 'confianca'], properties: { titulo: s, texto: s, confianca: { type: 'integer' } } }
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['mundo', 'brasil', 'alertas', 'riscos', 'oportunidades', 'horizonte_12m', 'horizonte_3a', 'horizonte_5a', 'horizonte_10a', 'nao_estou_vendo', 'jose_faria', 'confianca_geral', 'base_usada', 'limitacoes'],
  properties: {
    mundo: bloco, brasil: bloco,
    alertas: { type: 'array', items: item }, riscos: { type: 'array', items: item }, oportunidades: { type: 'array', items: item },
    horizonte_12m: horizonte, horizonte_3a: horizonte, horizonte_5a: horizonte, horizonte_10a: horizonte,
    nao_estou_vendo: bloco,
    jose_faria: { type: 'object', additionalProperties: false, required: ['titulo', 'acoes'], properties: { titulo: s, acoes: { type: 'array', items: s } } },
    confianca_geral: { type: 'integer' },
    base_usada: { type: 'array', items: s },
    limitacoes: { type: 'array', items: s },
  },
}

// PT ganha as previsões conferíveis (direção em 30/90 dias) — uma lista só, não
// uma por idioma, pra o placar não contar a mesma previsão 3 vezes. O motivo
// já vem nos 3 idiomas (sistema trilíngue, regra inegociável).
const PREVISAO = {
  type: 'object', additionalProperties: false, required: ['serie_codigo', 'horizonte_dias', 'direcao', 'confianca', 'motivo'],
  properties: {
    serie_codigo: { type: 'string', enum: SERIES_PREVISAO.map((x) => x.codigo) },
    horizonte_dias: { type: 'integer', enum: [...HORIZONTES_PREVISAO] },
    direcao: { type: 'string', enum: ['sobe', 'cai', 'estavel'] },
    confianca: { type: 'integer' },
    motivo: { type: 'object', additionalProperties: false, required: ['pt', 'en', 'es'], properties: { pt: s, en: s, es: s } },
  },
}
const SCHEMA_PT = { ...SCHEMA, required: [...SCHEMA.required, 'previsoes'], properties: { ...SCHEMA.properties, previsoes: { type: 'array', items: PREVISAO } } }

async function pedidoPrevisoes(supabase: SupabaseClient): Promise<string> {
  const [ultimos, placar] = await Promise.all([ultimosValoresPrevisao(supabase), textoPlacar(supabase)])
  const linhas = SERIES_PREVISAO.filter((x) => ultimos.has(x.codigo))
    .map((x) => `- ${x.codigo} | ${x.nome.pt}: ${ultimos.get(x.codigo)!.valor} (ref. ${ultimos.get(x.codigo)!.data}) — ${x.regra}`).join('\n')
  return `\n\nPREVISÕES CONFERÍVEIS ("previsoes"): para CADA série abaixo, uma previsão em 30 e outra em 90 dias: direção do último dado publicado na data-alvo em relação ao valor atual (sobe/cai/estavel, pela regra de estável de cada série), confiança 0-100 honesta e motivo em até 25 palavras escrito em português (pt), inglês (en) e espanhol (es). Elas serão conferidas com o dado oficial e viram o seu placar público de acertos — prefira "estavel" quando não houver sinal claro.\n${linhas}\n\nSEU PLACAR ATÉ AQUI (previsões já conferidas com o dado oficial):\n${placar}\nCalibre: onde você errou mais, use confiança menor e prefira "estavel"; nunca dê confiança acima da sua taxa de acerto naquela série quando já houver 5 ou mais conferidas.`
}

const NOME_IDIOMA: Record<IdiomaJoseph, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }

const SISTEMA = `Você é José, a inteligência do Radar Global do Axioma Nexus — inspirado em José do Egito, que leu os sinais e preparou o Egito para os anos de fartura e de seca. Todo dia você escreve o PAINEL EXECUTIVO para donos de pequenas e médias empresas brasileiras: o que mudou, o que pode afetar a empresa e o que fazer.

Regras invioláveis:
- Use SOMENTE os dados fornecidos na mensagem. Nunca invente número, data, lei, declaração de autoridade ou notícia. Manchetes são "relatado por fonte jornalística" — nunca trate como fato oficial confirmado.
- Dado oficial de outros países na base: petróleo Brent (diário) e PIB/inflação anuais dos parceiros (Banco Mundial). Manchetes brasileiras e internacionais (GDELT) são fonte jornalística. Em "mundo", cruze os dois, deixe claro o que é oficial e o que é relatado, e diga quando o quadro global é limitado.
- Nunca afirme certeza sobre o futuro. 12 meses: cenário mais provável com base nos dados. 3 anos: tendências prováveis. 5 e 10 anos: só transformações estruturais plausíveis, com confiança baixa (abaixo de 40) e escrito como hipótese.
- "confianca" de cada horizonte (0-100) cai quanto mais longe o horizonte.
- "alertas" = o que pede atenção agora (1 a 3). "riscos" e "oportunidades" = 2 a 3 cada. Se não houver algo relevante, diga isso num item honesto em vez de inventar.
- "nao_estou_vendo": um ponto cego útil que o empresário provavelmente não está considerando, derivado dos dados (ex.: juro real alto mesmo com Selic caindo).
- "jose_faria": exatamente 3 ações práticas e prudentes para a empresa. Nada de recomendar investimento específico.
- "base_usada": 3 a 6 itens curtos citando o que você usou (ex.: "Selic 13,75% (BCB, 17/09)"). "limitacoes": 2 a 4 itens sobre o que falta na base.
- Cada "texto": no máximo 45 palavras, linguagem simples de CFO conversando com empresário.
- Nunca se identifique como IA, modelo de linguagem, Claude ou Anthropic. Você é o José, do Axioma.
- Escreva no idioma pedido.`

// Exportada: o plano da empresa (lib/nexusPlanoEmpresa.ts) reaproveita a mesma leitura do mundo.
export async function montarContextoMundo(supabase: SupabaseClient): Promise<string> {
  const desde30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const desde3 = new Date(Date.now() - 3 * 86400000).toISOString()

  const [{ data: series }, { data: eventos }, { data: noticias }, { data: bm }, { data: geo }] = await Promise.all([
    supabase.from('nexus_economic_series').select('serie_codigo, serie_nome, valor, data_referencia').gte('data_referencia', new Date(Date.now() - 140 * 86400000).toISOString().slice(0, 10)).order('data_referencia', { ascending: true }).limit(2000),
    supabase.from('nexus_global_event').select('title, description, natureza, published_at, joseph_analise').gte('published_at', desde30).order('published_at', { ascending: false }).limit(15),
    supabase.from('nexus_news').select('title, publication_date, canal, nexus_source(source_name)').gte('publication_date', desde3).or(`canal.is.null,canal.neq.${CANAL_GEOPOLITICA}`).order('publication_date', { ascending: false }).limit(14),
    // GDELT separado: senão as manchetes de geopolítica (muitas) tomam o lugar das brasileiras.
    // Banco Mundial é anual (referência 31/12) — fica fora da janela de 140 dias acima.
    supabase.from('nexus_economic_series').select('serie_codigo, serie_nome, valor, data_referencia').like('serie_codigo', 'WB:%').order('data_referencia', { ascending: false }).limit(200),
    supabase.from('nexus_news').select('title, publication_date').eq('canal', CANAL_GEOPOLITICA).gte('publication_date', desde3).order('publication_date', { ascending: false }).limit(10),
  ])

  // Indicador: valor mais recente e o de ~30 dias antes (mesma série).
  const porSerie = new Map<string, { nome: string; pontos: { data: string; valor: number }[] }>()
  for (const l of (series ?? []) as { serie_codigo: string; serie_nome: string | null; valor: number; data_referencia: string }[]) {
    const g = porSerie.get(l.serie_codigo) ?? { nome: l.serie_nome ?? l.serie_codigo, pontos: [] }
    g.pontos.push({ data: l.data_referencia, valor: Number(l.valor) })
    porSerie.set(l.serie_codigo, g)
  }
  const indicadores = [...porSerie.values()].map((g) => {
    const atual = g.pontos[g.pontos.length - 1]
    const antes = [...g.pontos].reverse().find((p) => p.data <= desde30)
    return `- ${g.nome}: ${atual.valor} (ref. ${atual.data})${antes ? `; ~30 dias antes: ${antes.valor} (ref. ${antes.data})` : ''}`
  }).join('\n')

  const evs = ((eventos ?? []) as { title: string; description: string | null; natureza: string; published_at: string; joseph_analise: Record<string, { leitura?: string }> | null }[])
    .map((e) => `- ${e.published_at.slice(0, 10)} [${e.natureza}] ${e.title}. ${e.description ?? ''}${e.joseph_analise?.pt?.leitura ? `\n  Leitura do José: ${e.joseph_analise.pt.leitura.slice(0, 500)}` : ''}`).join('\n')

  const news = ((noticias ?? []) as unknown as { title: string; publication_date: string; canal: string | null; nexus_source: { source_name: string } | null }[])
    .map((n) => `- ${n.publication_date?.slice(0, 10)} (${n.canal ?? 'geral'}, ${n.nexus_source?.source_name ?? 'fonte jornalística'}): ${n.title}`).join('\n')

  // Mais recente de cada série do Banco Mundial (lista já vem do mais novo pro mais antigo).
  const bmUltimo = new Map<string, string>()
  for (const l of (bm ?? []) as { serie_codigo: string; serie_nome: string | null; valor: number; data_referencia: string }[])
    if (!bmUltimo.has(l.serie_codigo)) bmUltimo.set(l.serie_codigo, `- ${l.serie_nome ?? l.serie_codigo}: ${Number(l.valor).toFixed(1)}% (ano ${l.data_referencia.slice(0, 4)})`)
  const bancoMundial = [...bmUltimo.values()].join('\n')

  const geopolitica = ((geo ?? []) as { title: string; publication_date: string }[]).map((n) => `- ${n.publication_date?.slice(0, 10)}: ${n.title}`).join('\n')

  return `INDICADORES OFICIAIS (Banco Central / IBGE):\n${indicadores || '- indisponíveis'}\n\nEVENTOS DETECTADOS (últimos 30 dias):\n${evs || '- nenhum'}\n\nMANCHETES COLETADAS (últimos 3 dias — fonte jornalística, não confirmado oficialmente):\n${news || '- nenhuma'}\n\nECONOMIA DOS PARCEIROS (Banco Mundial, oficial, anual):\n${bancoMundial || '- indisponível'}\n\nGEOPOLÍTICA E COMÉRCIO MUNDIAL (GDELT — manchetes internacionais em inglês dos últimos 3 dias, fonte jornalística, não confirmado oficialmente):\n${geopolitica || '- nenhuma'}`
}

export class FalhaBriefing extends Error {}

export async function gerarBriefing(supabase: SupabaseClient, lang: IdiomaJoseph): Promise<BriefingJose> {
  if (!process.env.ANTHROPIC_API_KEY) throw new FalhaBriefing('ANTHROPIC_API_KEY ausente')
  const client = new Anthropic()
  const entrada = await montarContextoMundo(supabase) + (lang === 'pt' ? await pedidoPrevisoes(supabase) : '')
  const params = {
    model: MODELO_JOSEPH,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [{ type: 'text', text: SISTEMA, cache_control: { type: 'ephemeral' } }],
    output_config: { format: { type: 'json_schema', schema: lang === 'pt' ? SCHEMA_PT : SCHEMA } },
    messages: [{ role: 'user', content: `Idioma da resposta: ${NOME_IDIOMA[lang]}.\nData de hoje: ${new Date().toISOString().slice(0, 10)}.\n\n${entrada}` }],
  }
  // `fallbacks` ainda não está nos tipos do SDK instalado (0.104) — cast só aqui.
  const r = await client.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
  if (r.stop_reason === 'refusal') throw new FalhaBriefing('recusa do modelo')
  if (r.stop_reason === 'max_tokens') throw new FalhaBriefing('resposta cortada (max_tokens)')
  const bloco = r.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new FalhaBriefing('resposta sem texto')
  try { return JSON.parse(bloco.text) as BriefingJose } catch { throw new FalhaBriefing('JSON inválido') }
}

const hoje = () => new Date().toISOString().slice(0, 10)

// Devolve o painel de hoje; se não existir, gera e grava (upsert por data+idioma).
// Se a geração falhar, devolve o último painel disponível (marcado com a data dele).
export async function obterOuGerarBriefing(supabase: SupabaseClient, lang: IdiomaJoseph): Promise<{ data: string; conteudo: BriefingJose } | null> {
  const { data: ultimo, error: erroLeitura } = await supabase.from('nexus_briefing').select('data, conteudo').eq('lang', lang).order('data', { ascending: false }).limit(1).maybeSingle()
  // Sem conseguir ler a tabela (ex.: SQL da Etapa 7 ainda não rodado), NÃO gera:
  // geraria na IA e não conseguiria guardar — gasto repetido a cada abertura.
  if (erroLeitura) throw new FalhaBriefing(`leitura de nexus_briefing: ${erroLeitura.message}`)
  if (ultimo?.data === hoje()) return { data: ultimo.data as string, conteudo: ultimo.conteudo as BriefingJose }
  try {
    const conteudo = await gerarBriefing(supabase, lang)
    const { error } = await supabase.from('nexus_briefing').upsert({ data: hoje(), lang, conteudo, modelo: MODELO_JOSEPH, gerado_em: new Date().toISOString() }, { onConflict: 'data,lang' })
    if (error) throw new FalhaBriefing(`gravação: ${error.message}`)
    // Melhor-esforço: sem a tabela da Etapa 9 (SQL não rodado) o painel segue normal.
    if (conteudo.previsoes?.length) await registrarPrevisoes(supabase, conteudo.previsoes).catch((e) => console.error('[nexusBriefing] previsões não gravadas:', e instanceof Error ? e.message : e))
    return { data: hoje(), conteudo }
  } catch (err) {
    if (ultimo) return { data: ultimo.data as string, conteudo: ultimo.conteudo as BriefingJose }
    throw err
  }
}
