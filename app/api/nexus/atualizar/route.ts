import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { executarColeta } from '@/lib/nexusColeta'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — POST /api/nexus/atualizar: coleta pela visita.
// A Vercel gratuita só permite 1 cron por dia; quando um usuário logado abre o
// Nexus e a última coleta tem mais de 3 horas, a tela chama esta rota e os
// dados são coletados de novo (mesmo código do cron, SEM IA — não gasta crédito).
// ponytail: dois usuários abrindo no mesmo minuto podem rodar 2 coletas —
// inofensivo (tudo é upsert); trava de verdade só se virar custo.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const INTERVALO_HORAS = 3

export async function POST() {
  const cookieStore = await cookies()
  const auth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* rota não renova sessão */ } } }
  )
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return NextResponse.json({ error: 'indisponivel' }, { status: 503 })

  // Última coleta = último sucesso do BCB (roda em toda coleta).
  const { data: bcb } = await createClient(url, serviceRole).from('nexus_source').select('last_success').eq('source_name', 'BCB SGS').maybeSingle()
  const ultima = bcb?.last_success ? new Date(bcb.last_success as string).getTime() : 0
  if (Date.now() - ultima < INTERVALO_HORAS * 3600000) return NextResponse.json({ atualizou: false, ultima: bcb?.last_success ?? null })

  const res = await executarColeta({ comIA: false })
  return NextResponse.json({ atualizou: res.ok })
}
