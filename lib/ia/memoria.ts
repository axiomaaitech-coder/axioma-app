// ═══════════════════════════════════════════════════════════════
// MEMÓRIA DE APRENDIZAGEM da Inteligência Axioma (aprovada pelo CEO em 2026-10-16).
// Tabela public.ia_memoria_empresa (RLS por empresa, sem DELETE: errado é ARQUIVADO).
//   • A IA só SUGERE ("Quer que eu lembre disso?") — marcador [[LEMBRAR: …]] no fim da resposta,
//     retirado pelo servidor antes de mostrar/assinar. Quem grava é a pessoa, no navegador, com o próprio
//     acesso (RLS). Só vale depois de CONFIRMADA.
//   • "Está errado?" grava a correção da pessoa (já confirmada: foi ela quem escreveu).
//   • O motor lê as memórias confirmadas da área da tela (+ gerais) e usa como dado informado pela empresa.
// Funções puras aqui (testadas em scripts/check-ia-memoria.mts); acesso ao banco em memoriaCliente.ts
// (navegador) e em carregarMemoria (servidor, com o cliente do usuário).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'

export type AreaMemoria = 'financeira' | 'tributaria' | 'mei' | 'geral'
export type TipoMemoria = 'fato' | 'parametro' | 'preferencia' | 'sazonalidade' | 'correcao'
export type Memoria = { id: string; area: AreaMemoria; tipo: TipoMemoria; titulo: string; conteudo: string; valor: number | null; status: 'pendente' | 'confirmada' | 'arquivada'; vale_ate: string | null; confirmado_em: string | null; created_at: string }
export type SugestaoMemoria = { titulo: string; conteudo: string; tipo: TipoMemoria; area: AreaMemoria }

export const MAX_MEMORIAS_NO_PROMPT = 40
const TIPOS: TipoMemoria[] = ['fato', 'parametro', 'preferencia', 'sazonalidade', 'correcao']

export function areaDaTela(tela?: string | null): AreaMemoria {
  const t = String(tela ?? '')
  if (t === 'ia-tributaria' || t.includes('tribut') || t === 'mei-reforma') return 'tributaria'
  if (t.startsWith('mei')) return 'mei'
  if (t === 'ia-financeira' || t.startsWith('nexus') || t) return 'financeira'
  return 'geral'
}
// Áreas lidas em cada tela: a própria + gerais (MEI também lê tributária: DAS e Reforma são assunto do MEI)
export const areasLidas = (area: AreaMemoria): AreaMemoria[] => (area === 'mei' ? ['mei', 'tributaria', 'geral'] : [area, 'geral'])

// ─── Sugestão da IA: [[LEMBRAR: título | conteúdo | tipo]] (no máximo uma, sempre no fim) ───
const RE_LEMBRAR = /\[\[\s*LEMBRAR\s*:\s*([^|\]]{3,120})\|([^|\]]{3,1000})(?:\|\s*([a-z]+)\s*)?\]\]/i
export function extrairSugestao(texto: string, area: AreaMemoria): { texto: string; sugestao: SugestaoMemoria | null } {
  const m = texto.match(RE_LEMBRAR)
  const limpo = texto.replace(/\[\[\s*LEMBRAR\s*:[^\]]*\]\]/gi, '').replace(/\n{3,}/g, '\n\n').trim()
  if (!m) return { texto: limpo, sugestao: null }
  const tipo = (TIPOS.includes(String(m[3] ?? '').toLowerCase() as TipoMemoria) ? String(m[3]).toLowerCase() : 'fato') as TipoMemoria
  const titulo = m[1].trim(), conteudo = m[2].trim()
  if (titulo.length < 3 || conteudo.length < 3) return { texto: limpo, sugestao: null }
  return { texto: limpo, sugestao: { titulo: titulo.slice(0, 120), conteudo: conteudo.slice(0, 1000), tipo: tipo === 'correcao' ? 'fato' : tipo, area } }
}

// ─── Texto para o prompt do motor (só confirmadas e dentro da validade) ───
export function textoMemoria(memorias: Pick<Memoria, 'tipo' | 'titulo' | 'conteudo' | 'valor' | 'confirmado_em' | 'vale_ate'>[], hoje: string): string {
  const validas = memorias.filter((m) => !m.vale_ate || m.vale_ate >= hoje).slice(0, MAX_MEMORIAS_NO_PROMPT)
  if (!validas.length) return ''
  const linhas = validas.map((m) => {
    const quando = m.confirmado_em ? ` (confirmado em ${m.confirmado_em.slice(8, 10)}/${m.confirmado_em.slice(5, 7)}/${m.confirmado_em.slice(0, 4)})` : ''
    const rotulo = m.tipo === 'correcao' ? 'CORREÇÃO FEITA PELA EMPRESA' : m.tipo
    const valor = m.valor != null ? ` [valor: R$ ${Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}]` : ''
    return `- (${rotulo}) ${m.titulo}: ${m.conteudo}${valor}${quando}`
  })
  return `MEMÓRIA CONFIRMADA PELA EMPRESA (informações que o próprio usuário confirmou; use como dado da empresa e diga "conforme você informou"; se um dado do sistema contradisser a memória, mostre os dois e pergunte qual vale; CORREÇÕES têm prioridade e não podem ser repetidas como erro):\n${linhas.join('\n')}`
}

export const REGRA_SUGERIR_MEMORIA = `- Memória: se a pessoa informar um dado estável da empresa que NÃO está nos dados (ex.: pró-labore, salários, nº de funcionários, regime/anexo, sazonalidade, meta, preferência de como quer as respostas), responda normalmente e termine com UMA linha exatamente assim: [[LEMBRAR: título curto | o dado em 1 frase, com valor e data quando houver | fato ou parametro ou preferencia ou sazonalidade]]. No máximo uma por resposta; nunca para dado que já está no sistema, nunca para senha, documento pessoal ou dado de terceiros.`

// ─── Servidor: memórias confirmadas da empresa para a tela (cliente do usuário → RLS) ───
export async function carregarMemoria(supabase: SupabaseClient, empresaId: string, tela: string | null | undefined, hoje: string): Promise<{ texto: string; quantidade: number; falhou: boolean }> {
  const { data, error } = await supabase.from('ia_memoria_empresa')
    .select('tipo, titulo, conteudo, valor, confirmado_em, vale_ate')
    .eq('empresa_id', empresaId).eq('status', 'confirmada').in('area', areasLidas(areaDaTela(tela)))
    .order('confirmado_em', { ascending: false }).limit(MAX_MEMORIAS_NO_PROMPT)
  if (error) return { texto: '', quantidade: 0, falhou: true } // leitura falhou: segue sem memória (nunca inventa)
  const lista = (data ?? []) as Pick<Memoria, 'tipo' | 'titulo' | 'conteudo' | 'valor' | 'confirmado_em' | 'vale_ate'>[]
  return { texto: textoMemoria(lista, hoje), quantidade: lista.length, falhou: false }
}
