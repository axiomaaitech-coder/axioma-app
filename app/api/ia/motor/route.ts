import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { perguntarAoMotor, podeUsarIAFinanceira, historicoSeguro, TELAS_ANTHROPIC, type Idioma } from '@/lib/ia/motor'
import { consumirIA, devolverIA, mensagemSemSaldo } from '@/lib/iaSaldo'
import { processarPerguntaMotor } from '@/lib/ia/rotaMotor'
import { comRetentativa } from '@/lib/antiFalha'
import { assinarResposta } from '@/lib/voz/assinatura'

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
  const historico = historicoSeguro(corpo?.historico)
  // Conversa (Voice Intelligence, Fase B): id da conversa vindo da tela só para AGRUPAR na auditoria;
  // correlação gerada aqui para cruzar auditoria e Sentry. Nenhum dos dois decide empresa ou permissão.
  const conversaId = typeof corpo?.conversa_id === 'string' && UUID.test(corpo.conversa_id) ? corpo.conversa_id : null
  const correlacao = crypto.randomUUID()
  const inicio = Date.now()
  const contextoTela = typeof corpo?.contexto_tela === 'string' ? corpo.contexto_tela : undefined
  if (!pergunta || !UUID.test(empresaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })


  // Regra testada em lib/ia/rotaMotor.ts (scripts/check-voz-faseD.mts): acesso (RLS) → papel → cobra → motor → devolve se falhar.
  // Operador (PDV) não enxerga dado financeiro (RLS empresas_do_usuario_operacional): sem a trava de papel
  // a IA leria tudo vazio e responderia "sua empresa não tem receita". Empresa alheia: 404 sem cobrar.
  const res = await processarPerguntaMotor({ usuario: user.id, empresaId, pergunta, lang }, {
    podeUsar: podeUsarIAFinanceira,
    acesso: async (id) => {
      const { data, error } = await comRetentativa(() => supabase.rpc('ia_situacao', { p_empresa: id }))
      if (error) { if (/sem acesso/i.test(error.message)) return null; throw new Error(error.message) }
      return data ? true : null
    },
    papel: async (id) => {
      const { data, error } = await comRetentativa(() => supabase.from('empresa_usuarios').select('papel').eq('empresa_id', id).eq('user_id', user.id).maybeSingle())
      if (error) throw new Error(error.message)
      return (data?.papel as string | undefined) ?? null
    },
    // Saldo de IA da empresa: gasta 1 antes de chamar a IA (telas de análise = Anthropic).
    consumir: (id) => consumirIA(supabase, id, TELAS_ANTHROPIC.has(tela ?? '') ? 'anthropic' : 'openai'),
    devolver: (consumoId) => devolverIA(supabase, consumoId),
    perguntar: () => perguntarAoMotor({ supabase, empresaId, pergunta, historico, tela, lang, contextoTela }),
  })

  if (res.status !== 200) {
    if (res.status === 403) return NextResponse.json({ error: 'sem_acesso_financeiro', mensagem: SEM_ACESSO[lang] }, { status: 403 })
    if (res.status === 402) return NextResponse.json({ error: 'sem_saldo_ia', motivo: res.motivo, mensagem: mensagemSemSaldo(res.motivo ?? 'sem_saldo', lang) }, { status: 402 })
    if (res.status === 404) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })
    if (res.status === 500 || res.status === 503) {
      console.error('[ia/motor]', res.erro)
      Sentry.captureException(new Error(`[ia/motor] ${res.erro}`), { extra: { rota: 'ia/motor', correlacao } })
      return NextResponse.json({ error: res.status === 503 ? 'falha_leitura' : 'Erro interno do servidor' }, { status: res.status })
    }
    return NextResponse.json({ error: res.erro }, { status: res.status })
  }
  const r = res.r
  // Auditoria: quem, qual empresa, qual nível/IA, o que foi consultado e quanto texto saiu — nunca o conteúdo.
  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'ia.motor', entidade: 'motor-ia', versaoMotor: 'motor-ia-1',
    parametros: { tela: tela ?? null, conversa_id: conversaId, correlacao, nivel: r.nivel, triagem: r.triagem, provedor: r.provedor, modelo: r.modelo, escalou: r.escalou, valores_nao_conferidos: r.valoresNaoConferidos, valores_sem_fonte_servidor: r.valoresSemFonteServidor, consultas: r.consultas, setor: r.setor, caracteres_enviados: r.caracteresEnviados, respondeu: !!r.resposta,
      // Fase D: o que foi consultado (nome, ok/vazio/erro, ms), se a pergunta exigia dado e se respondeu sem consultar
      exige_consulta: r.exigeConsulta, ferramentas: r.ferramentas, sem_consulta_exigida: r.semConsultaExigida, latencia_ms: Date.now() - inicio, cobrado: res.cobrado,
      tokens_entrada: r.uso.tokensEntrada, tokens_saida: r.uso.tokensSaida, tokens_cache_leitura: r.uso.tokensCacheLeitura, tokens_cache_escrita: r.uso.tokensCacheEscrita,
      tokens_openai: r.uso.tokensOpenAI, custo_usd_anthropic: Math.round(r.uso.custoUsdAnthropic * 1e6) / 1e6 },
  }))
  // verificacao: acréscimo compatível (quem lê só resposta/nivel segue igual); a voz usa para a ressalva
  return NextResponse.json({ resposta: r.resposta, nivel: r.nivel, escalou: r.escalou, correlacao, assinatura: r.resposta ? assinarResposta(empresaId, r.resposta) : null, verificacao: { nao_conferidos: r.valoresNaoConferidos, sem_fonte_servidor: r.valoresSemFonteServidor } })
}
