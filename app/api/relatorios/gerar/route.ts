import { NextRequest, NextResponse, after } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { podeUsarIAFinanceira } from '@/lib/ia/motor'
import { comRetentativa } from '@/lib/antiFalha'
import { fusoDaEmpresa } from '@/lib/datas'
import { gerarRelatorio, validarPedido } from '@/lib/financeiro/relatorios'

// POST /api/relatorios/gerar { empresa_id, tipo, periodo, inicio?, fim?, comparar?, lang? }
// Relatório executivo (Plano 3, Tarefa 2): números das consultas do motor financeiro, com a sessão do
// usuário (RLS). Não chama IA, então não gasta saldo de IA. Empresa alheia = 404; operador = 403.
// Auditoria guarda só metadados (tipo, período, estado, contagens) — nunca valores.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const maxDuration = 60
const SEM_ACESSO = {
  pt: 'O seu acesso nesta Empresa é de operador de caixa: relatórios financeiros ficam com o dono, sócios e administradores.',
  en: 'Your access in this Company is cashier operator: financial reports are for owners, partners and administrators.',
  es: 'Su acceso en esta Empresa es de operador de caja: los informes financieros son para el dueño, socios y administradores.',
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const empresaId = typeof corpo?.empresa_id === 'string' ? corpo.empresa_id : ''
  const pedido = validarPedido(corpo)
  if (!pedido || !UUID.test(empresaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  const lang = pedido.lang ?? 'pt'

  // A RLS decide: empresa alheia não aparece (404). Falha de leitura = 503, nunca "passa".
  const emp = await comRetentativa(() => supabase.from('empresas').select('id, uf, cidade').eq('id', empresaId).maybeSingle())
  if (emp.error) return NextResponse.json({ error: 'falha_leitura' }, { status: 503 })
  if (!emp.data) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })
  const pap = await comRetentativa(() => supabase.from('empresa_usuarios').select('papel').eq('empresa_id', empresaId).eq('user_id', user.id).maybeSingle())
  if (pap.error) return NextResponse.json({ error: 'falha_leitura' }, { status: 503 })
  if (!podeUsarIAFinanceira((pap.data?.papel as string | undefined) ?? null)) return NextResponse.json({ error: 'sem_acesso_financeiro', mensagem: SEM_ACESSO[lang] }, { status: 403 })

  const inicio = Date.now()
  const fuso = fusoDaEmpresa(emp.data.uf as string | null, emp.data.cidade as string | null) ?? 'America/Sao_Paulo'
  let rel
  try { rel = await gerarRelatorio({ supabase, empresaId, fuso }, pedido) } catch (err) {
    Sentry.captureException(err, { extra: { rota: 'relatorios/gerar', tipo: pedido.tipo } })
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
  if ('erro' in rel) return NextResponse.json({ error: 'relatorio_indisponivel', mensagem: rel.erro }, { status: 422 })
  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'relatorio.gerar', entidade: 'relatorio-cfo', versaoMotor: 'relatorios-1',
    parametros: { tipo: rel.tipo, periodo: rel.periodo ? `${rel.periodo.inicio}..${rel.periodo.fim}` : null, comparar: !!rel.comparado_com, lang, estado: rel.estado,
      secoes: rel.secoes.length, achados: rel.achados.length, limitacoes: rel.limitacoes.length, consultas: rel.refs.length, latencia_ms: Date.now() - inicio },
  }))
  return NextResponse.json({ relatorio: rel })
}
