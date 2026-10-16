// AXIOMA VOICE INTELLIGENCE — Fase 2: regra da VOZ QUE RESPONDE no servidor (sem Next, sem banco, sem
// fornecedor: tudo chega por `deps`, testado em scripts/check-voz-fase2.mts). A rota app/api/voz/falar
// só liga esta regra ao Supabase (sessão + RLS) e ao fornecedor de voz escolhido.
//
// Ordem: login → parâmetros → função liberada para a empresa → fornecedor configurado (senão o aparelho
// fala sozinho, de graça) → assinatura do motor (só texto que o MOTOR respondeu, para esta empresa)
// → acesso à empresa (RLS) → papel (operador não tem IA financeira) → síntese.
// Cobrança: NENHUMA por enquanto — a pergunta já foi cobrada pelo motor (decisão do CEO pendente,
// docs/VOICE-INTELLIGENCE.md §11). Texto e áudio nunca vão para log/auditoria.
import { MAX_CARACTERES_FALA, textoParaFala, type IdiomaFala } from './textoFala'

export type Fornecedor = 'openai' | 'elevenlabs'
export const FORNECEDORES: Fornecedor[] = ['openai', 'elevenlabs']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// A resposta assinada é o texto CRU do motor (com markdown); o limite é folgado e a fala é cortada em MAX_CARACTERES_FALA
const MAX_TEXTO_ASSINADO = 20000

export function fornecedorFala(env: { VOZ_FALA?: string; OPENAI_API_KEY?: string; ELEVENLABS_API_KEY?: string }): Fornecedor | null {
  const f = String(env.VOZ_FALA ?? '').trim().toLowerCase()
  if (f === 'elevenlabs' && env.ELEVENLABS_API_KEY) return 'elevenlabs'
  if (f === 'openai' && env.OPENAI_API_KEY) return 'openai'
  return null // sem variável ou sem chave: voz do próprio aparelho (grátis)
}

export type EntradaFala = { usuario: string | null; empresaId: string; lang: string; texto: string; assinatura: string; ressalva: boolean; nome?: string | null }
export type DepsFala = {
  ativa: (empresaId: string) => boolean
  fornecedor: Fornecedor | null
  assinaturaValida: (empresaId: string, texto: string, assinatura: string) => boolean
  // null = sem acesso à empresa (RLS); lança = falha técnica de leitura
  acesso: (empresaId: string) => Promise<boolean | null>
  papel: (empresaId: string) => Promise<string | null>
  sintetizar: (fala: string, lang: IdiomaFala, f: Fornecedor) => Promise<ReadableStream<Uint8Array>>
}
export type CodigoFala = 'ok' | 'nao_autorizado' | 'parametros_invalidos' | 'voz_desativada' | 'fala_no_aparelho'
  | 'assinatura_invalida' | 'sem_acesso' | 'sem_acesso_voz' | 'falha_leitura' | 'fornecedor_indisponivel' | 'texto_vazio'
export type ResultadoFala = { status: number; codigo: CodigoFala; audio?: ReadableStream<Uint8Array>; caracteres?: number; fornecedor?: Fornecedor }

const r = (status: number, codigo: CodigoFala, extra: Partial<ResultadoFala> = {}): ResultadoFala => ({ status, codigo, ...extra })

export async function processarFala(e: EntradaFala, deps: DepsFala): Promise<ResultadoFala> {
  if (!e.usuario) return r(401, 'nao_autorizado')
  if (!UUID.test(e.empresaId) || !['pt', 'en', 'es'].includes(e.lang) || typeof e.texto !== 'string' || typeof e.assinatura !== 'string' || e.texto.length > MAX_TEXTO_ASSINADO) return r(400, 'parametros_invalidos')
  if (!deps.ativa(e.empresaId)) return r(403, 'voz_desativada')
  if (!deps.fornecedor) return r(409, 'fala_no_aparelho')
  if (!e.assinatura || !deps.assinaturaValida(e.empresaId, e.texto, e.assinatura)) return r(403, 'assinatura_invalida')

  let acesso: boolean | null
  try { acesso = await deps.acesso(e.empresaId) } catch { return r(503, 'falha_leitura') }
  if (!acesso) return r(404, 'sem_acesso')
  let papel: string | null
  try { papel = await deps.papel(e.empresaId) } catch { return r(503, 'falha_leitura') }
  if (papel === 'operador') return r(403, 'sem_acesso_voz')

  const fala = textoParaFala(e.texto, e.lang as IdiomaFala, e.ressalva, e.nome ?? null)
  if (!fala) return r(422, 'texto_vazio')
  try {
    const audio = await deps.sintetizar(fala, e.lang as IdiomaFala, deps.fornecedor)
    return { status: 200, codigo: 'ok', audio, caracteres: fala.length, fornecedor: deps.fornecedor }
  } catch { return r(503, 'fornecedor_indisponivel', { caracteres: fala.length, fornecedor: deps.fornecedor }) }
}

export { MAX_CARACTERES_FALA }
