import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { perguntarAoMotor, type Idioma, type MensagemHistorico } from '@/lib/ia/motor'

// POST /api/ia/motor { pergunta, empresa_id, historico?, tela?, lang?, contexto_tela? }
// Porta única do motor de IA (docs/MOTOR-IA.md). A tela manda só a pergunta:
// provedor, modelo e nível são decididos pelo motor (trava — ninguém força
// modelo caro pelo navegador). Empresa: a RLS decide — pedir retrato de
// empresa alheia não acha a empresa e devolve 404.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const pergunta = typeof corpo?.pergunta === 'string' ? corpo.pergunta.trim() : ''
  const empresaId = typeof corpo?.empresa_id === 'string' ? corpo.empresa_id : ''
  const lang: Idioma = corpo?.lang === 'en' || corpo?.lang === 'es' ? corpo.lang : 'pt'
  const tela = typeof corpo?.tela === 'string' ? corpo.tela.slice(0, 40) : undefined
  const historico: MensagemHistorico[] = Array.isArray(corpo?.historico) ? corpo.historico : []
  const contextoTela = typeof corpo?.contexto_tela === 'string' ? corpo.contexto_tela : undefined
  if (!pergunta || !UUID.test(empresaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })

  try {
    const r = await perguntarAoMotor({ supabase, empresaId, pergunta, historico, tela, lang, contextoTela })
    // Auditoria: quem, qual empresa, qual nível/IA e quanto texto saiu — nunca o conteúdo.
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
      parametros: { tela: tela ?? null, nivel: r.nivel, triagem: r.triagem, provedor: r.provedor, modelo: r.modelo, escalou: r.escalou, valores_nao_conferidos: r.valoresNaoConferidos, consultas: r.consultas, setor: r.setor, caracteres_enviados: r.caracteresEnviados, respondeu: !!r.resposta },
    }))
    return NextResponse.json({ resposta: r.resposta, nivel: r.nivel, escalou: r.escalou })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('empresa não encontrada')) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })
    console.error('[ia/motor]', msg)
    Sentry.captureException(err instanceof Error ? err : new Error(msg), { extra: { rota: 'ia/motor' } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
