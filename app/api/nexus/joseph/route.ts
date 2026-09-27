import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { obterOuGerarAnalise, FalhaJoseph, type IdiomaJoseph } from '@/lib/nexusJoseph'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 4: POST /api/nexus/joseph { event_id, lang }
// Devolve a análise do Joseph pro evento; gera na hora só se ainda não existir
// naquele idioma (depois fica guardada pra todos). Evento é dado público —
// a gravação usa service_role, mas só usuário logado chega até aqui.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // primeira geração com raciocínio pode levar ~1 min

const IDIOMAS: IdiomaJoseph[] = ['pt', 'en', 'es']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* rota só de leitura, não precisa renovar sessão */ } } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const eventId = typeof corpo?.event_id === 'string' ? corpo.event_id : ''
  const lang = IDIOMAS.includes(corpo?.lang) ? (corpo.lang as IdiomaJoseph) : 'pt'
  if (!UUID.test(eventId)) return NextResponse.json({ error: 'event_id inválido' }, { status: 400 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return NextResponse.json({ error: 'indisponivel' }, { status: 503 })

  try {
    const analise = await obterOuGerarAnalise(createClient(url, serviceRole), eventId, lang)
    return NextResponse.json({ analise })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[nexus/joseph] Falha ao obter análise:', motivo)
    Sentry.captureException(err instanceof Error ? err : new Error(motivo), { extra: { rota: 'nexus/joseph', eventId, lang } })
    return NextResponse.json({ error: 'indisponivel' }, { status: err instanceof FalhaJoseph ? 502 : 500 })
  }
}
