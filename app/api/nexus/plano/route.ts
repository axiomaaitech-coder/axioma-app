import { NextRequest, NextResponse, after } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'
import { obterOuGerarPlano, FalhaPlano, type HorizontePlano } from '@/lib/nexusPlanoEmpresa'
import { MODELO_JOSEPH, type IdiomaJoseph } from '@/lib/nexusJoseph'
import { registrarAuditoria } from '@/lib/nexusAuditoria'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 8: POST /api/nexus/plano { empresa_id, horizonte, lang }
// Plano do José pra empresa (sobreviver + crescer). Tudo com a sessão do
// usuário: a RLS por empresa decide o que ele pode ler e gravar — pedir o
// plano de uma empresa que não é dele simplesmente não acha a empresa.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const HORIZONTES: HorizontePlano[] = ['1-3', '4-7', '8-10']
const IDIOMAS: IdiomaJoseph[] = ['pt', 'en', 'es']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* rota não renova sessão */ } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const empresaId = typeof corpo?.empresa_id === 'string' ? corpo.empresa_id : ''
  const horizonte = HORIZONTES.includes(corpo?.horizonte) ? (corpo.horizonte as HorizontePlano) : null
  const lang = IDIOMAS.includes(corpo?.lang) ? (corpo.lang as IdiomaJoseph) : 'pt'
  if (!UUID.test(empresaId) || !horizonte) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })

  try {
    const { origem, caracteresEnviados, modelo, ...plano } = await obterOuGerarPlano(supabase, empresaId, horizonte, lang, user.id)
    // Auditoria: quem pediu, qual empresa, se a IA foi acionada e quanto dado saiu (nunca o conteúdo).
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'jose.plano', entidade: 'nexus_plano_empresa',
      parametros: { horizonte, lang, origem, provedor: modelo ? (modelo.startsWith('claude') ? 'anthropic' : 'openai') : null, modelo, caracteres_enviados: caracteresEnviados },
      versaoMotor: modelo ?? MODELO_JOSEPH,
    }))
    return NextResponse.json({ plano })
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[nexus/plano] Falha:', motivo)
    Sentry.captureException(err instanceof Error ? err : new Error(motivo), { extra: { rota: 'nexus/plano', horizonte, lang } })
    return NextResponse.json({ error: 'indisponivel' }, { status: err instanceof FalhaPlano ? 502 : 500 })
  }
}
