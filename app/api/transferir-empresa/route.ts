import { NextRequest, NextResponse, after } from 'next/server'
import { randomUUID } from 'crypto'
import * as Sentry from '@sentry/nextjs'
import { bloqueado, registrarFalha, admin, conferirSenha, papelLiberador, usuarioLogado } from '@/lib/supervisorServidor'
import { registrarAuditoria } from '@/lib/nexusAuditoria'
import { checklistDe, docValido, type TipoOperacao, type TipoSocietario } from '@/lib/transferenciaEmpresa'

// Transferir empresa (Elias, 2026-10-09) — passagem da empresa DE VERDADE (venda,
// doação, sucessão, reorganização), diferente do botão da Equipe (que só passa o
// comando do Axioma pra um CEO/Sócio/Admin permanente).
// - Só o Proprietário pede, com a própria senha, motivo e os dados que a lei pede.
// - MEI e Empresário Individual nunca (CNPJ é da pessoa).
// - Quem recebe abre o link, entra com o e-mail indicado e aceita (CPF + declaração + LGPD) em até 7 dias.
// varredura:service-role — toda gravação daqui usa admin() (sem RLS)

const erro = (codigo: string, status = 400) => NextResponse.json({ erro: codigo }, { status })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const OPERACOES: TipoOperacao[] = ['venda', 'doacao', 'sucessao', 'reorganizacao']
const TIPOS: TipoSocietario[] = ['ltda', 'slu', 'sa', 'outra']
const PRAZO_DIAS = 7
const txt = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max)

function falhaServidor(etapa: string, motivo: string, extra: Record<string, unknown> = {}) {
  console.error(`[transferir-empresa] ${etapa}:`, motivo)
  Sentry.captureException(new Error(`[transferir-empresa] ${etapa}: ${motivo}`), { extra: { rota: 'api/transferir-empresa', etapa, ...extra } })
}
async function complementar(etapa: string, q: PromiseLike<{ error: { message: string } | null }>, extra: Record<string, unknown> = {}) {
  const { error } = await q
  if (error) falhaServidor(etapa, error.message, extra)
}

type Db = ReturnType<typeof admin>
// Pedido vencido sem aceite vira "expirada" (libera a empresa pra um pedido novo)
async function expirarVencidas(db: Db, filtro: { empresaId?: string; token?: string }) {
  let q = db.from('empresa_transferencias').update({ situacao: 'expirada' }).eq('situacao', 'aguardando').lt('expira_em', new Date().toISOString())
  if (filtro.empresaId) q = q.eq('empresa_id', filtro.empresaId)
  if (filtro.token) q = q.eq('token', filtro.token)
  await complementar('expirar vencidas', q, filtro)
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return erro('indisponivel', 503)
  const corpo = await req.json().catch(() => null)
  if (corpo?.acao === 'listar') return listar(corpo)
  if (corpo?.acao === 'criar') return criar(corpo)
  if (corpo?.acao === 'cancelar') return cancelar(corpo)
  if (corpo?.acao === 'ver') return ver(corpo)
  if (corpo?.acao === 'aceitar') return aceitar(corpo)
  return erro('acao')
}

async function ehProprietario(db: Db, empresaId: string, userId: string) {
  const { data } = await db.from('empresas').select('id, nome, porte, natureza_juridica').eq('id', empresaId).eq('user_id', userId).maybeSingle()
  return data
}

async function listar(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const empresaId = txt(corpo.empresaId, 36)
  if (!UUID.test(empresaId)) return erro('dados')
  const db = admin()
  // CEO, Sócio e Admin enxergam o histórico; só o Proprietário pede/cancela
  if (!(await papelLiberador(db, empresaId, user.id))) return erro('sem_permissao', 403)
  await expirarVencidas(db, { empresaId })
  const prop = await ehProprietario(db, empresaId, user.id)
  const { data, error } = await db.from('empresa_transferencias')
    .select('id, situacao, cedente_nome, cessionario_nome, cessionario_email, cessionario_doc, tipo_operacao, tipo_societario, junta_protocolo, junta_data, motivo, cedente_fica_admin, expira_em, aceite_em, cancelado_em, cancelado_motivo, created_at, documento_id, token')
    .eq('empresa_id', empresaId).order('created_at', { ascending: false }).limit(50)
  if (error) { falhaServidor('listar', error.message, { empresaId }); return erro('generico', 500) }
  const itens = (data || []).map((t) => {
    const d = String(t.cessionario_doc || '')
    // Link só pro Proprietário e só enquanto aguarda; documento mascarado pra todos
    return { ...t, token: prop && t.situacao === 'aguardando' ? t.token : undefined,
      cessionario_doc: d.length === 11 ? `${d.slice(0, 3)}.***.***-${d.slice(9)}` : d.length === 14 ? `${d.slice(0, 2)}.***.***/****-${d.slice(12)}` : d }
  })
  return NextResponse.json({ itens, souProprietario: !!prop })
}

async function criar(corpo: any) {
  const user = await usuarioLogado()
  if (!user?.email) return erro('login', 401)
  const empresaId = txt(corpo.empresaId, 36)
  if (!UUID.test(empresaId)) return erro('dados')
  const db = admin()
  const emp = await ehProprietario(db, empresaId, user.id)
  if (!emp) return erro('so_proprietario', 403)

  const tipo = txt(corpo.tipoSocietario, 10) as TipoSocietario
  if (!TIPOS.includes(tipo)) return erro('tipo_bloqueado') // MEI/EI nunca chegam aqui
  if (emp.porte === 'MEI') return erro('tipo_bloqueado')
  const operacao = txt(corpo.tipoOperacao, 20) as TipoOperacao
  if (!OPERACOES.includes(operacao)) return erro('dados')

  const cedenteNome = txt(corpo.cedenteNome)
  const cedenteDoc = txt(corpo.cedenteDoc, 20).replace(/\D/g, '')
  const nome = txt(corpo.cessionarioNome)
  const doc = txt(corpo.cessionarioDoc, 20).replace(/\D/g, '')
  const email = txt(corpo.cessionarioEmail).toLowerCase()
  if (cedenteNome.length < 3 || nome.length < 3) return erro('nome')
  if (!docValido(cedenteDoc) || !docValido(doc)) return erro('documento_pessoa')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('email')
  if (email === user.email.toLowerCase()) return erro('mesma_pessoa')

  const protocolo = txt(corpo.juntaProtocolo, 60)
  const juntaData = txt(corpo.juntaData, 10)
  if (protocolo.length < 3) return erro('junta')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(juntaData) || juntaData > new Date().toISOString().slice(0, 10)) return erro('junta_data')

  const motivo = txt(corpo.motivo, 500)
  if (motivo.length < 5) return erro('motivo')

  // Lista da lei: todo item obrigatório marcado
  const marcados: Record<string, boolean> = corpo.checklist && typeof corpo.checklist === 'object' ? corpo.checklist : {}
  const checklist = Object.fromEntries(checklistDe(tipo, operacao).map((i) => [i.id, !!marcados[i.id]]))
  if (checklistDe(tipo, operacao).some((i) => i.obrigatorio && !checklist[i.id])) return erro('checklist')

  // Documento: tem que ser do Cofre desta empresa
  const documentoId = txt(corpo.documentoId, 36)
  if (!UUID.test(documentoId)) return erro('documento')
  const { data: docCofre } = await db.from('empresa_documentos').select('id').eq('id', documentoId).eq('empresa_id', empresaId).maybeSingle()
  if (!docCofre) return erro('documento')

  // Senha do Proprietário (sessão esquecida aberta não transfere nada)
  const chave = `transferir:${user.id}`
  if (bloqueado(chave)) return erro('muitas_tentativas', 429)
  const idSenha = await conferirSenha(user.email, String(corpo.senha || ''))
  if (idSenha !== user.id) { registrarFalha(chave); return erro('senha', 403) }

  await expirarVencidas(db, { empresaId })
  const token = randomUUID()
  const { data: nova, error } = await db.from('empresa_transferencias').insert({
    empresa_id: empresaId, cedente_user_id: user.id, cedente_nome: cedenteNome, cedente_doc: cedenteDoc,
    cessionario_nome: nome, cessionario_doc: doc, cessionario_email: email,
    tipo_operacao: operacao, tipo_societario: tipo, junta_protocolo: protocolo, junta_data: juntaData,
    documento_id: documentoId, checklist, motivo, cedente_fica_admin: corpo.cedenteFicaAdmin !== false,
    token, expira_em: new Date(Date.now() + PRAZO_DIAS * 86400000).toISOString(),
  }).select('id').single()
  if (error) {
    if (error.code === '23505') return erro('ja_existe', 409)
    falhaServidor('criar', error.message, { empresaId }); return erro('generico', 500)
  }
  after(() => registrarAuditoria({ empresaId, ator: user.id, acao: 'empresa.transferencia.pedida', entidade: 'empresa_transferencias', entidadeId: nova.id,
    versaoMotor: 'transferencia-1', parametros: { operacao, tipo, para_email: email, junta_protocolo: protocolo, motivo } }))
  return NextResponse.json({ token })
}

async function cancelar(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const empresaId = txt(corpo.empresaId, 36)
  const id = txt(corpo.id, 36)
  if (!UUID.test(empresaId) || !UUID.test(id)) return erro('dados')
  const motivo = txt(corpo.motivo, 500)
  if (motivo.length < 5) return erro('motivo')
  const db = admin()
  if (!(await ehProprietario(db, empresaId, user.id))) return erro('so_proprietario', 403)
  const { data, error } = await db.from('empresa_transferencias')
    .update({ situacao: 'cancelada', cancelado_em: new Date().toISOString(), cancelado_por: user.id, cancelado_motivo: motivo })
    .eq('id', id).eq('empresa_id', empresaId).eq('situacao', 'aguardando').select('id')
  if (error) { falhaServidor('cancelar', error.message, { id }); return erro('generico', 500) }
  if (!data?.length) return erro('nao_aguarda', 409)
  after(() => registrarAuditoria({ empresaId, ator: user.id, acao: 'empresa.transferencia.cancelada', entidade: 'empresa_transferencias', entidadeId: id, versaoMotor: 'transferencia-1', parametros: { motivo } }))
  return NextResponse.json({ ok: true })
}

// Página de aceite (link com token): mostra o resumo pra quem recebe
async function ver(corpo: any) {
  const token = txt(corpo.token, 36)
  if (!UUID.test(token)) return erro('token', 404)
  const db = admin()
  await expirarVencidas(db, { token })
  const { data: t } = await db.from('empresa_transferencias')
    .select('empresa_id, situacao, cedente_nome, cessionario_nome, cessionario_email, tipo_operacao, tipo_societario, junta_protocolo, junta_data, expira_em, cedente_fica_admin')
    .eq('token', token).maybeSingle()
  if (!t) return erro('token', 404)
  const { data: emp } = await db.from('empresas').select('nome, cnpj').eq('id', t.empresa_id).maybeSingle()
  const user = await usuarioLogado()
  const { empresa_id: _e, ...resto } = t
  return NextResponse.json({ ...resto, empresa_nome: emp?.nome || '', empresa_cnpj: emp?.cnpj || '',
    logado_email: user?.email || null, email_confere: !!user?.email && user.email.toLowerCase() === t.cessionario_email })
}

async function aceitar(corpo: any) {
  const user = await usuarioLogado()
  if (!user?.email) return erro('login', 401)
  const token = txt(corpo.token, 36)
  if (!UUID.test(token)) return erro('token', 404)
  if (!corpo.declaracao || !corpo.lgpd) return erro('termos')
  const cpf = txt(corpo.cpf, 20).replace(/\D/g, '')
  if (cpf.length !== 11 || !docValido(cpf)) return erro('cpf')

  const chave = `aceitar-transf:${user.id}`
  if (bloqueado(chave)) return erro('muitas_tentativas', 429)
  const db = admin()
  await expirarVencidas(db, { token })
  const { data: t } = await db.from('empresa_transferencias').select('*').eq('token', token).maybeSingle()
  if (!t) return erro('token', 404)
  if (t.situacao !== 'aguardando') return erro(t.situacao, 409)
  if (user.email.toLowerCase() !== t.cessionario_email) return erro('email_diferente', 403)
  // Pessoa física recebendo: o CPF tem que ser o informado pelo Proprietário
  if (t.cessionario_doc.length === 11 && t.cessionario_doc !== cpf) { registrarFalha(chave); return erro('cpf_diferente', 403) }

  // 1) Quem pediu ainda é o dono? (nada mudou no meio do caminho)
  const { data: aindaDono } = await db.from('empresas').select('id').eq('id', t.empresa_id).eq('user_id', t.cedente_user_id).maybeSingle()
  if (!aindaDono) return erro('dono_mudou', 409)
  // 2) Novo dono na equipe, sem prazo (antes de rebaixar o antigo: trigger protege o último dono)
  const { error: eDono } = await db.from('empresa_usuarios').upsert(
    { empresa_id: t.empresa_id, user_id: user.id, papel: 'dono', acesso_expira_em: null, suspenso_em: null, suspenso_por: null, suspenso_motivo: null },
    { onConflict: 'empresa_id,user_id' })
  if (eDono) { falhaServidor('novo dono', eDono.message, { id: t.id }); return erro('generico', 500) }
  // 3) Troca o dono da empresa
  const { data: trocou, error: eEmp } = await db.from('empresas').update({ user_id: user.id })
    .eq('id', t.empresa_id).eq('user_id', t.cedente_user_id).select('id')
  if (eEmp || !trocou?.length) { falhaServidor('trocar dono', eEmp?.message || '0 linhas', { id: t.id }); return erro(eEmp ? 'generico' : 'dono_mudou', eEmp ? 500 : 409) }

  // Daqui pra baixo a troca já valeu: falha vai pro Sentry pra ser refeita, sem desfazer
  await complementar('concluir pedido', db.from('empresa_transferencias')
    .update({ situacao: 'concluida', aceite_cpf: cpf, aceite_em: new Date().toISOString(), cessionario_user_id: user.id }).eq('id', t.id), { id: t.id })
  // 4) Quem passou: fica como Admin ou sai
  if (t.cedente_fica_admin) {
    await complementar('cedente admin', db.from('empresa_usuarios').upsert(
      { empresa_id: t.empresa_id, user_id: t.cedente_user_id, papel: 'admin', acesso_expira_em: null, suspenso_em: null },
      { onConflict: 'empresa_id,user_id' }), { id: t.id })
  } else {
    await complementar('cedente sai', db.from('empresa_usuarios').delete().eq('empresa_id', t.empresa_id).eq('user_id', t.cedente_user_id), { id: t.id })
  }
  // 5) Pedidos da Equipe envolvendo os dois perdem o sentido
  await complementar('pedidos equipe', db.from('equipe_pedidos').update({ situacao: 'cancelado', decidido_em: new Date().toISOString() })
    .eq('empresa_id', t.empresa_id).eq('situacao', 'aberto').in('alvo_user_id', [user.id, t.cedente_user_id]), { id: t.id })

  after(() => registrarAuditoria({ empresaId: t.empresa_id, ator: user.id, acao: 'empresa.transferencia.concluida', entidade: 'empresa_transferencias', entidadeId: t.id,
    versaoMotor: 'transferencia-1', parametros: { de: t.cedente_user_id, para: user.id, operacao: t.tipo_operacao, junta_protocolo: t.junta_protocolo, cedente_fica_admin: t.cedente_fica_admin } }))
  return NextResponse.json({ ok: true, empresaId: t.empresa_id })
}
