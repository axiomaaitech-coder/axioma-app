import { NextRequest, NextResponse, after } from 'next/server'
import { bloqueado, registrarFalha, admin, conferirSenha, vinculo, podeLiberar, usuarioLogado } from '@/lib/supervisorServidor'
import { registrarAuditoria } from '@/lib/nexusAuditoria'

// POST /api/autorizar-exclusao { empresaId, motivo, oQue, tabela, registroId, autorizador: { email, senha } }
// Regra do Elias (2026-10-08): nenhum módulo apaga dado da empresa sem avisar e sem
// a autorização de um SUPERVISOR (dono/CEO, Sócio ou Admin). Até o próprio supervisor
// confirma com a senha (sessão esquecida aberta não apaga nada). Toda autorização
// fica na auditoria: quem pediu, quem autorizou, motivo e o que foi apagado.
const erro = (codigo: string, status = 400) => NextResponse.json({ erro: codigo }, { status })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return erro('indisponivel', 503)
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const corpo = await req.json().catch(() => ({}))
  const empresaId = String(corpo.empresaId || '')
  if (!UUID.test(empresaId)) return erro('dados')
  const motivo = String(corpo.motivo || '').trim().slice(0, 500)
  if (motivo.length < 5) return erro('motivo')

  const db = admin()
  // Quem pede precisa ser da empresa (dono ou membro com acesso valendo).
  const { data: dono } = await db.from('empresas').select('id').eq('id', empresaId).eq('user_id', user.id).maybeSingle()
  if (!dono && !(await vinculo(db, empresaId, user.id))) return erro('sem_permissao', 403)

  const chave = `excluir:${user.id}`
  if (bloqueado(chave)) return erro('muitas_tentativas', 429)
  const email = String(corpo.autorizador?.email || '').trim().toLowerCase()
  const idAut = email ? await conferirSenha(email, String(corpo.autorizador?.senha || '')) : null
  if (!idAut || !(await podeLiberar(db, empresaId, idAut))) { registrarFalha(chave); return erro('autorizador', 403) }

  after(() => registrarAuditoria({
    empresaId, ator: user.id, acao: 'exclusao.autorizada', entidade: String(corpo.tabela || '').slice(0, 60) || undefined,
    entidadeId: UUID.test(String(corpo.registroId || '')) ? String(corpo.registroId) : null, versaoMotor: 'exclusao-1',
    parametros: { o_que: String(corpo.oQue || '').slice(0, 200), motivo, autorizado_por: email, autorizador_id: idAut, proprio_supervisor: idAut === user.id },
  }))
  return NextResponse.json({ ok: true, autorizadoPor: email })
}
