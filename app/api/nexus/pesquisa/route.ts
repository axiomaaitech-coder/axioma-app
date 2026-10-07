import { NextRequest, NextResponse, after } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { usoZerado } from '@/lib/ia/motor'
import { pesquisarNexus } from '@/lib/nexusPesquisa'
import type { IdiomaJoseph } from '@/lib/nexusJoseph'

// POST /api/nexus/pesquisa { tema, lang } — Motor de Pesquisa Nexus (lib/nexusPesquisa.ts).
// Só usuário logado; dados do Nexus são globais (lidos com service_role). Auditado sem conteúdo.
export const dynamic = 'force-dynamic'
export const maxDuration = 120
const IDIOMAS: IdiomaJoseph[] = ['pt', 'en', 'es']

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const auth = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } })
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const tema = typeof corpo?.tema === 'string' ? corpo.tema.slice(0, 80) : ''
  const lang = IDIOMAS.includes(corpo?.lang) ? (corpo.lang as IdiomaJoseph) : 'pt'
  if (!tema) return NextResponse.json({ error: 'tema invalido' }, { status: 400 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return NextResponse.json({ error: 'indisponivel' }, { status: 503 })

  try {
    const uso = usoZerado()
    const r = await pesquisarNexus(createClient(url, serviceRole), tema, lang, uso)
    after(() => registrarAuditoria({
      empresaId: null, ator: user.id, acao: 'jose.pesquisa', entidade: 'motor-pesquisa-nexus', versaoMotor: 'pesquisa-1',
      parametros: { tema, lang, assinatura: r.assinatura, materias: r.materias.length, dados: r.dados.length, tokens_openai: uso.tokensOpenAI, custo_usd_anthropic: Math.round(uso.custoUsdAnthropic * 1e6) / 1e6 },
    }))
    return NextResponse.json({ pesquisa: r })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    if (motivo === 'tema desconhecido') return NextResponse.json({ error: 'tema desconhecido' }, { status: 400 })
    Sentry.captureException(err instanceof Error ? err : new Error(motivo), { extra: { rota: 'nexus/pesquisa', tema } })
    return NextResponse.json({ error: 'indisponivel' }, { status: 500 })
  }
}
