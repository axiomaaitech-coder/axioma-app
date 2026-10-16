import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { comRetentativa } from '@/lib/antiFalha'
import { vozAtivaPara } from '@/lib/voz/servidor'
import { primeiroNome, type IdiomaFala } from '@/lib/voz/textoFala'
import { corpoTokenGemini, fornecedoresTR, MENSAGENS_INICIO, processarInicio, sessaoQwen, setupGemini, DURACAO_MAX_S, SILENCIO_MAX_S, type FornecedorTR } from '@/lib/voz/tempoReal/servidor'

// ═══════════════════════════════════════════════════════════════
// AXIOMA VOICE INTELLIGENCE — PoC CONVERSA AO VIVO. Regra em lib/voz/tempoReal/servidor.ts.
// GET ?empresa_id=          → { fornecedores: [...] } (o painel só aparece com algum liberado)
// POST { empresa_id, lang, fornecedor } → Gemini: token efêmero com a configuração travada
//                                          Qwen: configuração da sessão (a troca SDP passa por ./sdp)
// PUT  { empresa_id, fornecedor, segundos, tokens_entrada, tokens_saida, consultas, motivo } → auditoria do fim
// Chaves só aqui (GEMINI_API_KEY, QWEN_API_KEY). Nada de áudio/texto em log ou auditoria.
// ═══════════════════════════════════════════════════════════════
export const maxDuration = 30
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ENV_VOZ = () => ({ VOZ_ATIVA: process.env.VOZ_ATIVA, VOZ_EMPRESAS_TESTE: process.env.VOZ_EMPRESAS_TESTE })
const DISPONIVEIS = () => fornecedoresTR({ VOZ_TEMPO_REAL: process.env.VOZ_TEMPO_REAL, GEMINI_API_KEY: process.env.GEMINI_API_KEY, QWEN_API_KEY: process.env.QWEN_API_KEY })
const MODELO_GEMINI = () => process.env.GEMINI_LIVE_MODELO || 'gemini-3.1-flash-live-preview'
// Endpoint do token efêmero (v1beta, conforme a documentação do Google em 16/10/2026)
const WS_GEMINI = () => process.env.GEMINI_LIVE_WS || 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained'

async function sessao() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(request: NextRequest) {
  const { user } = await sessao()
  const empresaId = request.nextUrl.searchParams.get('empresa_id') ?? ''
  if (!user || !UUID.test(empresaId) || !vozAtivaPara(empresaId, ENV_VOZ())) return NextResponse.json({ fornecedores: [] })
  return NextResponse.json({ fornecedores: DISPONIVEIS(), duracao_max_s: DURACAO_MAX_S, silencio_max_s: SILENCIO_MAX_S })
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await sessao()
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const empresaId = String(body?.empresa_id ?? '')
  const lang = String(body?.lang ?? 'pt')
  const fornecedor = String(body?.fornecedor ?? '')
  const r = await processarInicio({ usuario: user?.id ?? null, empresaId, lang, fornecedor }, {
    ativa: (id) => vozAtivaPara(id, ENV_VOZ()),
    disponiveis: DISPONIVEIS(),
    acesso: async (id) => {
      const { data, error } = await comRetentativa(() => supabase.rpc('ia_situacao', { p_empresa: id }))
      if (error) { if (/sem acesso/i.test(error.message)) return null; throw new Error(error.message) }
      const d = data as { openai?: { restante?: number }; ilimitada?: boolean } | null
      return d ? { restante: Number(d.openai?.restante ?? 0), ilimitada: !!d.ilimitada } : null
    },
    papel: async (id) => {
      const { data, error } = await comRetentativa(() => supabase.from('empresa_usuarios').select('papel').eq('empresa_id', id).eq('user_id', user!.id).maybeSingle())
      if (error) throw new Error(error.message)
      return (data?.papel as string | undefined) ?? null
    },
  })
  const idioma = (['pt', 'en', 'es'].includes(lang) ? lang : 'pt') as IdiomaFala
  if (r.codigo !== 'ok') return NextResponse.json({ error: r.codigo, mensagem: MENSAGENS_INICIO[r.codigo][idioma] }, { status: r.status })

  const nome = primeiroNome(user!.user_metadata?.nome || user!.user_metadata?.full_name || '')
  after(() => registrarAuditoria({ empresaId, ator: user!.id, acao: 'voz.tempo_real.inicio', entidade: 'voz', parametros: { fornecedor, lang: idioma } }))

  if ((fornecedor as FornecedorTR) === 'qwen') {
    return NextResponse.json({ fornecedor, sessao: sessaoQwen({ lang: idioma, nome, voz: process.env.QWEN_VOZ || undefined }), duracao_max_s: DURACAO_MAX_S, silencio_max_s: SILENCIO_MAX_S })
  }

  // Gemini: token efêmero de 1 uso com o setup inteiro travado no servidor
  const setup = setupGemini({ lang: idioma, nome, modelo: MODELO_GEMINI(), voz: process.env.GEMINI_VOZ || undefined })
  try {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(corpoTokenGemini(setup)),
    })
    if (!res.ok) throw new Error(`gemini token ${res.status}`) // corpo do erro não é lido nem registrado
    const j = await res.json() as { name?: string }
    if (!j.name) throw new Error('gemini token sem nome')
    return NextResponse.json({ fornecedor, ws: WS_GEMINI(), token: j.name, modelo: setup.model, duracao_max_s: DURACAO_MAX_S, silencio_max_s: SILENCIO_MAX_S })
  } catch (err) {
    Sentry.captureMessage('[voz-tempo-real] token gemini falhou', { level: 'warning', extra: { erro: err instanceof Error ? err.message : String(err) } })
    return NextResponse.json({ error: 'fornecedor_indisponivel', mensagem: MENSAGENS_INICIO.fornecedor_indisponivel[idioma] }, { status: 503 })
  }
}

// Fim da sessão: só métricas (duração, tokens, consultas, motivo) — para medir custo e qualidade da PoC
export async function PUT(request: NextRequest) {
  const { user } = await sessao()
  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const empresaId = String(body?.empresa_id ?? '')
  if (!user || !UUID.test(empresaId)) return NextResponse.json({ ok: false }, { status: 400 })
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Math.max(0, Math.round(Number(v))) : 0)
  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'voz.tempo_real.fim', entidade: 'voz',
    parametros: { fornecedor: String(body?.fornecedor ?? '').slice(0, 10), segundos: num(body?.segundos), tokens_entrada: num(body?.tokens_entrada), tokens_saida: num(body?.tokens_saida), consultas: num(body?.consultas), latencia_primeira_fala_ms: num(body?.latencia_primeira_fala_ms), motivo: String(body?.motivo ?? '').slice(0, 30) },
  }))
  return NextResponse.json({ ok: true })
}
