import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { perguntarAoMotor, podeUsarIAFinanceira, TELAS_ANTHROPIC, type Idioma, type MensagemHistorico } from '@/lib/ia/motor'
import { consumirIA, devolverIA, mensagemSemSaldo } from '@/lib/iaSaldo'

// POST /api/ia/motor { pergunta, empresa_id, historico?, tela?, lang?, contexto_tela? }
// Porta única do motor de IA (docs/MOTOR-IA.md). A tela manda só a pergunta:
// provedor, modelo e nível são decididos pelo motor (trava — ninguém força
// modelo caro pelo navegador). Empresa: a RLS decide — pedir retrato de
// empresa alheia não acha a empresa e devolve 404.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxDuration = 120
const SEM_ACESSO: Record<Idioma, string> = {
  pt: 'O seu acesso nesta Empresa é de operador de caixa: a inteligência financeira fica com o dono, sócios e administradores.',
  en: 'Your access in this Company is cashier operator: the financial intelligence is for owners, partners and administrators.',
  es: 'Su acceso en esta Empresa es de operador de caja: la inteligencia financiera es para el dueño, socios y administradores.',
}

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

  // Operador (PDV) não enxerga dado financeiro (RLS empresas_do_usuario_operacional): sem esta
  // trava a IA leria tudo vazio e responderia "sua empresa não tem receita". Antes de gastar saldo.
  const { data: membro } = await supabase.from('empresa_usuarios').select('papel').eq('empresa_id', empresaId).eq('user_id', user.id).maybeSingle()
  if (!podeUsarIAFinanceira(membro?.papel)) return NextResponse.json({ error: 'sem_acesso_financeiro', mensagem: SEM_ACESSO[lang] }, { status: 403 })

  // Saldo de IA da empresa: gasta 1 antes de chamar a IA (telas de análise = Anthropic).
  const saldo = await consumirIA(supabase, empresaId, TELAS_ANTHROPIC.has(tela ?? '') ? 'anthropic' : 'openai')
  if (!saldo.ok) return NextResponse.json({ error: 'sem_saldo_ia', motivo: saldo.motivo, mensagem: mensagemSemSaldo(saldo.motivo, lang) }, { status: 402 })

  try {
    const r = await perguntarAoMotor({ supabase, empresaId, pergunta, historico, tela, lang, contextoTela })
    // Auditoria: quem, qual empresa, qual nível/IA e quanto texto saiu — nunca o conteúdo.
    after(() => registrarAuditoria({
      empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
      parametros: { tela: tela ?? null, nivel: r.nivel, triagem: r.triagem, provedor: r.provedor, modelo: r.modelo, escalou: r.escalou, valores_nao_conferidos: r.valoresNaoConferidos, valores_sem_fonte_servidor: r.valoresSemFonteServidor, consultas: r.consultas, setor: r.setor, caracteres_enviados: r.caracteresEnviados, respondeu: !!r.resposta,
        tokens_entrada: r.uso.tokensEntrada, tokens_saida: r.uso.tokensSaida, tokens_cache_leitura: r.uso.tokensCacheLeitura, tokens_cache_escrita: r.uso.tokensCacheEscrita,
        tokens_openai: r.uso.tokensOpenAI, custo_usd_anthropic: Math.round(r.uso.custoUsdAnthropic * 1e6) / 1e6 },
    }))
    if (!r.resposta) await devolverIA(supabase, saldo.id) // IA não respondeu: não cobra do saldo
    // verificacao: acréscimo compatível (quem lê só resposta/nivel segue igual); a voz usa para falar a ressalva
    return NextResponse.json({ resposta: r.resposta, nivel: r.nivel, escalou: r.escalou, verificacao: { nao_conferidos: r.valoresNaoConferidos, sem_fonte_servidor: r.valoresSemFonteServidor } })
  } catch (err) {
    await devolverIA(supabase, saldo.id)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('empresa não encontrada')) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })
    console.error('[ia/motor]', msg)
    Sentry.captureException(err instanceof Error ? err : new Error(msg), { extra: { rota: 'ia/motor' } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
