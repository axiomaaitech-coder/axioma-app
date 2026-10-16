import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { comRetentativa } from '@/lib/antiFalha'
import { vozAtivaPara } from '@/lib/voz/servidor'
import { fornecedoresTR, processarInicio } from '@/lib/voz/tempoReal/servidor'

// ═══════════════════════════════════════════════════════════════
// PoC CONVERSA AO VIVO — ponte da troca SDP do WebRTC com o Qwen Omni Realtime.
// POST ?empresa_id=&lang=  (corpo: oferta SDP, application/sdp) → resposta SDP.
// A chave (QWEN_API_KEY) só vai nesta chamada servidor → Alibaba; o áudio vai direto
// navegador ↔ Alibaba pelo WebRTC (nada passa por aqui, nada é guardado).
// Mesma regra de início da sessão (login, liberação, empresa pela RLS, papel, saldo).
// ═══════════════════════════════════════════════════════════════
export const maxDuration = 30
const HOST = () => process.env.QWEN_REALTIME_HOST || 'dashscope-intl.aliyuncs.com' // região Singapura
const MODELO = () => process.env.QWEN_REALTIME_MODELO || 'qwen3.8-omni-flash-realtime'
const MAX_SDP = 20000

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  const empresaId = request.nextUrl.searchParams.get('empresa_id') ?? ''
  const lang = request.nextUrl.searchParams.get('lang') ?? 'pt'
  const r = await processarInicio({ usuario: user?.id ?? null, empresaId, lang, fornecedor: 'qwen' }, {
    ativa: (id) => vozAtivaPara(id, { VOZ_ATIVA: process.env.VOZ_ATIVA, VOZ_EMPRESAS_TESTE: process.env.VOZ_EMPRESAS_TESTE }),
    disponiveis: fornecedoresTR({ VOZ_TEMPO_REAL: process.env.VOZ_TEMPO_REAL, GEMINI_API_KEY: process.env.GEMINI_API_KEY, QWEN_API_KEY: process.env.QWEN_API_KEY }),
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
  if (r.codigo !== 'ok') return NextResponse.json({ error: r.codigo }, { status: r.status })

  const oferta = await request.text()
  if (!oferta.startsWith('v=') || oferta.length > MAX_SDP) return NextResponse.json({ error: 'sdp_invalido' }, { status: 400 })
  try {
    const res = await fetch(`https://${HOST()}/api/v1/webrtc/realtime?model=${encodeURIComponent(MODELO())}`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${process.env.QWEN_API_KEY}`, 'Content-Type': 'application/sdp' },
      body: oferta,
    })
    if (!res.ok) throw new Error(`qwen sdp ${res.status}`)
    const resposta = await res.text()
    return new Response(resposta, { headers: { 'Content-Type': 'application/sdp', 'Cache-Control': 'no-store' } })
  } catch (err) {
    Sentry.captureMessage('[voz-tempo-real] sdp qwen falhou', { level: 'warning', extra: { erro: err instanceof Error ? err.message : String(err) } })
    return NextResponse.json({ error: 'fornecedor_indisponivel' }, { status: 503 })
  }
}
