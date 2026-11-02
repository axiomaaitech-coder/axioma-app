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
import { jsonDoJose } from './ia/motor'
import type { SupabaseClient } from '@supabase/supabase-js'
import { type IdiomaJoseph } from './nexusJoseph'
import { montarContextoMundo, FalhaBriefing } from './nexusContextoMundo'
export { montarContextoMundo, FalhaBriefing }
import { SERIES_PREVISAO, HORIZONTES_PREVISAO, ultimosValoresPrevisao, registrarPrevisoes, textoPlacar, type PrevisaoIA } from './nexusPrevisoes'
import { hojeISO } from './datas'
import { paginaDaFonte } from './nexusFontesLinks'

// Procedência de cada afirmação: nome da fonte, data e link (só links que o Axioma
// coletou de verdade — o servidor apaga qualquer outro). Opcionais no tipo porque
// painéis guardados antes de 2026-10-06 não têm.
export type FonteBriefing = { nome: string; data: string; url: string }
type Bloco = { titulo: string; texto: string; pontos?: string[]; fontes?: FonteBriefing[] }
type Item = { titulo: string; texto: string; gravidade: 'alta' | 'media' | 'baixa'; fontes?: FonteBriefing[] }
type Horizonte = { titulo: string; texto: string; confianca: number; sinais?: string[] }

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
const fonte = { type: 'object', additionalProperties: false, required: ['nome', 'data', 'url'], properties: { nome: s, data: s, url: s } }
const listaTexto = { type: 'array', items: s }
const listaFontes = { type: 'array', items: fonte }
const bloco = { type: 'object', additionalProperties: false, required: ['titulo', 'texto', 'pontos', 'fontes'], properties: { titulo: s, texto: s, pontos: listaTexto, fontes: listaFontes } }
const item = { type: 'object', additionalProperties: false, required: ['titulo', 'texto', 'gravidade', 'fontes'], properties: { titulo: s, texto: s, gravidade: { type: 'string', enum: ['alta', 'media', 'baixa'] }, fontes: listaFontes } }
const horizonte = { type: 'object', additionalProperties: false, required: ['titulo', 'texto', 'confianca', 'sinais'], properties: { titulo: s, texto: s, confianca: { type: 'integer' }, sinais: listaTexto } }
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

const SISTEMA = `Você é José, a inteligência do Radar Global do Axioma Nexus — inspirado em José do Egito, que leu os sinais e preparou o Egito para os anos de fartura e de seca. Todo dia você escreve o PAINEL EXECUTIVO para donos de empresas brasileiras: o que mudou, o que pode afetar a empresa e o que fazer.

Regras invioláveis:
- Use SOMENTE os dados fornecidos na mensagem. Nunca invente número, data, lei, declaração de autoridade ou notícia. Manchetes são "relatado por fonte jornalística" — nunca trate como fato oficial confirmado.
- Dado oficial de outros países na base: petróleo Brent (diário) e PIB/inflação anuais dos parceiros (Banco Mundial). Manchetes brasileiras e internacionais (GDELT, BBC World, ONU News, Al Jazeera) são fonte jornalística. Em "mundo", cruze os dois, deixe claro o que é oficial e o que é relatado, e diga quando o quadro global é limitado.
- Nunca afirme certeza sobre o futuro. 12 meses: cenário mais provável com base nos dados. 3 anos: tendências prováveis. 5 e 10 anos: só transformações estruturais plausíveis, com confiança baixa (abaixo de 40) e escrito como hipótese.
- "confianca" de cada horizonte (0-100) cai quanto mais longe o horizonte.
- "alertas" = o que pede atenção agora (1 a 3). "riscos" e "oportunidades" = 2 a 3 cada. Se não houver algo relevante, diga isso num item honesto em vez de inventar.
- Coerência de datas: notícia publicada depois do mês de um dado oficial não explica esse dado; trate como perspectiva e deixe as datas claras.
- "nao_estou_vendo": um ponto cego útil que o empresário provavelmente não está considerando, derivado dos dados (ex.: juro real alto mesmo com Selic caindo).
- "jose_faria": exatamente 3 ações práticas e prudentes para a empresa. Nada de recomendar investimento específico.
- "base_usada": 3 a 6 itens curtos citando o que você usou (ex.: "Selic 13,75% (BCB, 17/09)"). "limitacoes": 2 a 4 itens sobre o que falta na base.
- Cada "texto": 50 a 90 palavras — robusto e conciso: o fato, por que importa para a empresa e o efeito provável. Linguagem simples de CFO conversando com empresário, sem enrolação.
- "pontos" (em mundo, brasil, nao_estou_vendo): 2 a 4 itens curtos, cada um com o número e a data do dado (ex.: "IPCA de agosto: -0,32% (IBGE)").
- "sinais" (horizontes): 2 a 3 sinais concretos para acompanhar, que confirmariam ou mudariam o cenário.
- "fontes" (em blocos e itens): 1 a 3, de onde veio a informação — nome da fonte ou veículo como aparece nos dados, data (AAAA-MM-DD) e "url" COPIADA EXATAMENTE da lista de manchetes; para dado oficial sem link na lista, url "". Nunca invente link, veículo ou matéria.
- Nunca se identifique como IA, modelo de linguagem, Claude ou Anthropic. Você é o José, do Axioma.
- Escreva no idioma pedido.`


// Fonte honesta: link que NÃO veio da lista de manchetes coletadas é apagado (a IA não
// pode inventar endereço); dado oficial sem link ganha a página pública do órgão.
const OFICIAIS: [RegExp, string][] = [
  [/bcb|banco central do brasil|copom|selic/i, 'BCB SGS'], [/ibge|ipca|pnad/i, 'IBGE Dados Abertos'], [/ipea/i, 'IPEA Data'],
  [/bce|banco central europeu|ecb/i, 'Banco Central Europeu'], [/fmi|imf/i, 'FMI'], [/banco mundial|world bank/i, 'Banco Mundial'],
  [/comex|mdic|secex/i, 'Comex Stat'], [/anp/i, 'ANP'], [/ocde|oecd/i, 'OCDE'],
]
function conferirFontes(c: BriefingJose, contexto: string): BriefingJose {
  const permitidos = new Set(contexto.match(/https?:\/\/[^\s)]+/g) ?? [])
  const limpar = (fs?: FonteBriefing[]) => (fs ?? []).map((f) => {
    if (f.url && permitidos.has(f.url)) return f
    const oficial = OFICIAIS.find(([re]) => re.test(f.nome))
    return { ...f, url: oficial ? paginaDaFonte(oficial[1]) ?? '' : '' }
  })
  const b = <T extends { fontes?: FonteBriefing[] }>(x: T): T => ({ ...x, fontes: limpar(x.fontes) })
  return { ...c, mundo: b(c.mundo), brasil: b(c.brasil), nao_estou_vendo: b(c.nao_estou_vendo), alertas: c.alertas.map(b), riscos: c.riscos.map(b), oportunidades: c.oportunidades.map(b) }
}

export async function gerarBriefing(supabase: SupabaseClient, lang: IdiomaJoseph): Promise<{ conteudo: BriefingJose; modelo: string }> {
  const entrada = await montarContextoMundo(supabase) + (lang === 'pt' ? await pedidoPrevisoes(supabase) : '')
  const mensagem = `Idioma da resposta: ${NOME_IDIOMA[lang]}.
Data de hoje: ${hojeISO()}.

${entrada}`
  // Claude → OpenAI forte → OpenAI reserva (motor). Se as 3 falharem, quem chama devolve o último painel guardado.
  try {
    const { texto, modelo } = await jsonDoJose({ sistema: SISTEMA, mensagem, esquema: lang === 'pt' ? SCHEMA_PT : SCHEMA, rotulo: 'painel executivo' })
    return { conteudo: conferirFontes(JSON.parse(texto) as BriefingJose, entrada), modelo }
  } catch (err) {
    throw new FalhaBriefing(err instanceof Error ? err.message : String(err))
  }
}

const hoje = () => hojeISO()

// Devolve o painel de hoje; se não existir, gera e grava (upsert por data+idioma).
// Se a geração falhar, devolve o último painel disponível (marcado com a data dele).
// Atualizar sob demanda: o painel é um só pra todos os clientes (custo de IA), então
// gerar de novo no mesmo dia só depois de 3 horas do anterior.
export const INTERVALO_ATUALIZAR_MS = 3 * 3600000
export type PainelJose = { data: string; conteudo: BriefingJose; geradoEm: string | null; podeAtualizarEm: string | null }

export async function obterOuGerarBriefing(supabase: SupabaseClient, lang: IdiomaJoseph, opcoes: { forcar?: boolean } = {}): Promise<PainelJose | null> {
  const { data: ultimo, error: erroLeitura } = await supabase.from('nexus_briefing').select('data, conteudo, gerado_em').eq('lang', lang).order('data', { ascending: false }).limit(1).maybeSingle()
  // Sem conseguir ler a tabela (ex.: SQL da Etapa 7 ainda não rodado), NÃO gera:
  // geraria na IA e não conseguiria guardar — gasto repetido a cada abertura.
  if (erroLeitura) throw new FalhaBriefing(`leitura de nexus_briefing: ${erroLeitura.message}`)
  const geradoEm = (ultimo?.gerado_em as string | null) ?? null
  const liberadoEm = geradoEm ? new Date(new Date(geradoEm).getTime() + INTERVALO_ATUALIZAR_MS) : null
  const podeAtualizar = !liberadoEm || liberadoEm.getTime() <= Date.now()
  const doUltimo = (): PainelJose => ({ data: ultimo!.data as string, conteudo: ultimo!.conteudo as BriefingJose, geradoEm, podeAtualizarEm: podeAtualizar ? null : liberadoEm!.toISOString() })
  if (ultimo?.data === hoje() && !(opcoes.forcar && podeAtualizar)) return doUltimo()
  try {
    const { conteudo, modelo } = await gerarBriefing(supabase, lang)
    // varredura:ok — service role; erro checado logo abaixo
    const { error } = await supabase.from('nexus_briefing').upsert({ data: hoje(), lang, conteudo, modelo, gerado_em: new Date().toISOString() }, { onConflict: 'data,lang' })
    if (error) throw new FalhaBriefing(`gravação: ${error.message}`)
    // Melhor-esforço: sem a tabela da Etapa 9 (SQL não rodado) o painel segue normal.
    if (conteudo.previsoes?.length) await registrarPrevisoes(supabase, conteudo.previsoes).catch((e) => console.error('[nexusBriefing] previsões não gravadas:', e instanceof Error ? e.message : e))
    const agoraIso = new Date().toISOString()
    return { data: hoje(), conteudo, geradoEm: agoraIso, podeAtualizarEm: new Date(Date.now() + INTERVALO_ATUALIZAR_MS).toISOString() }
  } catch (err) {
    if (ultimo) return doUltimo()
    throw err
  }
}
