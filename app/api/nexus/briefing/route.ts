import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { obterOuGerarBriefing } from '@/lib/nexusBriefing'
import type { IdiomaJoseph } from '@/lib/nexusJoseph'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 7: POST /api/nexus/briefing { lang }
// Painel executivo do José de hoje (gera 1x por dia/idioma se ainda não
// existir; o cron adianta o de PT). Só usuário logado; grava com service_role.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const IDIOMAS: IdiomaJoseph[] = ['pt', 'en', 'es']

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
  const lang = IDIOMAS.includes(corpo?.lang) ? (corpo.lang as IdiomaJoseph) : 'pt'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return NextResponse.json({ error: 'indisponivel' }, { status: 503 })

  try {
    const painel = await obterOuGerarBriefing(createClient(url, serviceRole), lang)
    return NextResponse.json({ painel })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[nexus/briefing] Falha:', motivo)
    Sentry.captureException(err instanceof Error ? err : new Error(motivo), { extra: { rota: 'nexus/briefing', lang } })
    return NextResponse.json({ error: 'indisponivel' }, { status: 502 })
  }
}
