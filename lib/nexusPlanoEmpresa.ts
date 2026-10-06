// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 8: plano do José para a empresa (1-3, 4-7, 8-10 anos).
// O propósito do Axioma em uma tela: ler o caixa e os números DESTA empresa,
// cruzar com a economia do Brasil e do mundo, e dizer como ela sobrevive
// (economizar, cortar) e cresce (mais lucro), com metas e gatilhos.
// Só servidor. Análise complexa, pessoal e rara → Anthropic.
// Lê e grava com o cliente DO USUÁRIO (sessão + RLS por empresa) — nunca
// service_role: a RLS garante que ninguém vê o plano de outra empresa.
// Cache: 1 plano por empresa × horizonte × idioma × dia.
// ═══════════════════════════════════════════════════════════════
import Anthropic from '@anthropic-ai/sdk'
import type { SupabaseClient } from '@supabase/supabase-js'
import { MODELO_JOSEPH, type IdiomaJoseph } from './nexusJoseph'
import { montarContextoMundo } from './nexusBriefing'
import { montarRetrato, textoSetor } from './ia/retratoEmpresa'

export type HorizontePlano = '1-3' | '4-7' | '8-10'

export type NumerosEmpresa = {
  receitaMensal: number
  custoFixoMensal: number
  custoVariavelMensal: number
  lucroMensal: number
  margemPct: number | null
  custoFixoSobreReceitaPct: number | null
  caixa: number
  dividaTotal: number
  folegoMeses: number | null // só quando dá prejuízo: quantos meses o caixa aguenta
}

type Acao = { titulo: string; detalhe: string; impacto: string; prioridade: 'alta' | 'media' | 'baixa' }
export type PlanoJose = {
  veredito: string
  situacao_hoje: string
  cenario_periodo: string
  sobrevivencia: { risco: 'alto' | 'medio' | 'baixo'; texto: string }
  economizar: Acao[]
  cortar: Acao[]
  crescer: Acao[]
  metas: { indicador: string; hoje: string; meta: string; prazo: string }[]
  gatilhos: { se: string; entao: string }[]
  confianca: number
  limitacoes: string[]
}

const s = { type: 'string' }
const acao = { type: 'object', additionalProperties: false, required: ['titulo', 'detalhe', 'impacto', 'prioridade'], properties: { titulo: s, detalhe: s, impacto: s, prioridade: { type: 'string', enum: ['alta', 'media', 'baixa'] } } }
const SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['veredito', 'situacao_hoje', 'cenario_periodo', 'sobrevivencia', 'economizar', 'cortar', 'crescer', 'metas', 'gatilhos', 'confianca', 'limitacoes'],
  properties: {
    veredito: s, situacao_hoje: s, cenario_periodo: s,
    sobrevivencia: { type: 'object', additionalProperties: false, required: ['risco', 'texto'], properties: { risco: { type: 'string', enum: ['alto', 'medio', 'baixo'] }, texto: s } },
    economizar: { type: 'array', items: acao }, cortar: { type: 'array', items: acao }, crescer: { type: 'array', items: acao },
    metas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['indicador', 'hoje', 'meta', 'prazo'], properties: { indicador: s, hoje: s, meta: s, prazo: s } } },
    gatilhos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['se', 'entao'], properties: { se: s, entao: s } } },
    confianca: { type: 'integer' },
    limitacoes: { type: 'array', items: s },
  },
}

const NOME_IDIOMA: Record<IdiomaJoseph, string> = { pt: 'português do Brasil', en: 'English', es: 'español' }
const DESC_HORIZONTE: Record<HorizontePlano, string> = {
  '1-3': 'de 1 a 3 anos (curto prazo: sobreviver e se fortalecer)',
  '4-7': 'de 4 a 7 anos (médio prazo: consolidar e crescer)',
  '8-10': 'de 8 a 10 anos (longo prazo: tendências estruturais — alta incerteza)',
}

const SISTEMA = `Você é José, a inteligência do Axioma Nexus — inspirado em José do Egito, que leu os sinais, guardou nos anos de fartura e salvou o Egito nos anos de seca. Você é o CFO digital desta empresa brasileira. Sua missão: dizer, com os números REAIS dela e o cenário econômico do Brasil e do mundo, como ela SOBREVIVE (economizar, cortar) e como CRESCE (mais lucro) no horizonte pedido.

Regras invioláveis:
- Use SOMENTE os dados da mensagem. Cite os custos e receitas da empresa PELO NOME quando recomendar cortar/economizar. Nunca invente número, custo, cliente, lei ou notícia.
- Os números calculados (margem, fôlego, custo fixo sobre receita) já vêm prontos — use-os, não recalcule diferente.
- Impacto de cada ação: estimativa em R$/mês ou % quando der pra derivar dos números dados; se não der, diga "a medir".
- Nunca afirme certeza sobre o futuro. Horizonte longo = tendência estrutural e hipótese.
- "economizar": 2 a 4 ações (gastar melhor sem cortar o essencial). "cortar": 1 a 3 itens concretos da lista de custos (ou diga honestamente que não há corte óbvio). "crescer": 2 a 4 ações realistas para o porte da empresa.
- "metas": 3 a 5 indicadores com valor de hoje e meta (ex.: margem líquida, custo fixo/receita, fôlego de caixa, dívida/receita).
- PESO POR RAMO: priorize nos gatilhos, no cenário e nas ações os indicadores listados em RAMO — são os que mais mexem com custo e venda desse tipo de negócio.
- "gatilhos": 3 a 5 regras "se X acontecer na economia/no caixa, então faça Y" (câmbio, juros, inflação, petróleo, vendas) — só com o que está nos dados.
- "sobrevivencia.risco": alto se o caixa acaba no horizonte mantido o ritmo, médio se aperta, baixo se folgado. Explique em "texto".
- "confianca" (0-100) cai com o prazo (1-3 anos ~65, 4-7 ~45, 8-10 ~25) e com a falta de dados da empresa. "limitacoes": 2 a 4 itens do que falta.
- Se a empresa não tiver dados suficientes (receita zerada etc.), diga isso claramente no veredito e dê o plano para organizar os números primeiro.
- Linguagem simples, direta, de CFO conversando com o dono. Cada texto curto (até 50 palavras).
- Não recomende investimento em ativo específico. Nunca se identifique como IA, Claude ou Anthropic. Você é o José, do Axioma.
- Escreva no idioma pedido.`

// Números e texto da empresa = retrato do motor de IA (lib/ia/retratoEmpresa.ts):
// mesma foto usada pela IA Financeira, IA Tributária e chat — imposto calculado
// no servidor pelo regime (calcularImpostoRegime), nunca vindo do navegador.
export async function coletarEmpresa(supabase: SupabaseClient, empresaId: string): Promise<{ numeros: NumerosEmpresa; texto: string }> {
  const r = await montarRetrato(supabase, empresaId)
  const x = r.numeros
  const numeros: NumerosEmpresa = {
    receitaMensal: x.receitaMensal, custoFixoMensal: x.custoFixoMensal, custoVariavelMensal: x.custoVariavelMensal,
    lucroMensal: x.lucroMensal, margemPct: x.margemPct, custoFixoSobreReceitaPct: x.custoFixoSobreReceitaPct,
    caixa: x.caixa, dividaTotal: x.dividaTotal, folegoMeses: x.folegoMeses,
  }
  return { numeros, texto: `${r.texto}
${textoSetor(r.setor)}` }
}

export class FalhaPlano extends Error {}

async function gerarPlano(supabase: SupabaseClient, empresaId: string, horizonte: HorizontePlano, lang: IdiomaJoseph): Promise<{ plano: PlanoJose; numeros: NumerosEmpresa; caracteresEnviados: number }> {
  if (!process.env.ANTHROPIC_API_KEY) throw new FalhaPlano('ANTHROPIC_API_KEY ausente')
  const [{ numeros, texto }, mundo] = await Promise.all([coletarEmpresa(supabase, empresaId), montarContextoMundo(supabase)])
  const client = new Anthropic()
  const mensagem = `Idioma da resposta: ${NOME_IDIOMA[lang]}.\nHoje: ${new Date().toISOString().slice(0, 10)}.\nHORIZONTE PEDIDO: ${DESC_HORIZONTE[horizonte]}.\n\n${texto}\n\nCENÁRIO ECONÔMICO (Brasil e mundo):\n${mundo}`
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
  const r = await client.beta.messages.create(params as unknown as Anthropic.Beta.MessageCreateParamsNonStreaming)
  if (r.stop_reason === 'refusal') throw new FalhaPlano('recusa do modelo')
  if (r.stop_reason === 'max_tokens') throw new FalhaPlano('resposta cortada (max_tokens)')
  const bloco = r.content.find((b) => b.type === 'text')
  if (!bloco || bloco.type !== 'text') throw new FalhaPlano('resposta sem texto')
  try { return { plano: JSON.parse(bloco.text) as PlanoJose, numeros, caracteresEnviados: mensagem.length } } catch { throw new FalhaPlano('JSON inválido') }
}

// Plano de hoje pra empresa/horizonte/idioma; gera e grava se não houver.
// Sem conseguir ler a tabela (SQL da Etapa 8 não rodado), NÃO gera (evita gasto repetido).
export async function obterOuGerarPlano(supabase: SupabaseClient, empresaId: string, horizonte: HorizontePlano, lang: IdiomaJoseph, userId: string) {
  const hoje = new Date().toISOString().slice(0, 10)
  const { data: salvo, error } = await supabase.from('nexus_plano_empresa').select('data, conteudo')
    .eq('empresa_id', empresaId).eq('horizonte', horizonte).eq('lang', lang).eq('data', hoje).maybeSingle()
  if (error) throw new FalhaPlano(`leitura de nexus_plano_empresa: ${error.message}`)
  if (salvo) return { data: salvo.data as string, origem: 'guardado' as const, caracteresEnviados: 0, ...(salvo.conteudo as { plano: PlanoJose; numeros: NumerosEmpresa }) }
  const { caracteresEnviados, ...conteudo } = await gerarPlano(supabase, empresaId, horizonte, lang)
  // varredura:ok — service role; erro checado logo abaixo
  const { error: erroGravar } = await supabase.from('nexus_plano_empresa').upsert(
    { empresa_id: empresaId, horizonte, lang, data: hoje, conteudo, modelo: MODELO_JOSEPH, criado_por: userId, gerado_em: new Date().toISOString() },
    { onConflict: 'empresa_id,horizonte,lang,data' },
  )
  if (erroGravar) throw new FalhaPlano(`gravação do plano: ${erroGravar.message}`)
  return { data: hoje, origem: 'gerado' as const, caracteresEnviados, ...conteudo }
}
