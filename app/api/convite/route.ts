import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Convite de equipe (pedido do Elias, 2026-10-02) — tudo no servidor, sem SQL novo.
// - Só Admin, Sócio ou CEO (ou o dono) liberam acesso direto. Qualquer outro
//   membro precisa da senha de um Admin/Sócio/CEO pra convidar.
// - Quem recebe NUNCA passa pela tela de login: abre o link, preenche o
//   formulário (nome, e-mail, LGPD; CPF quando o prazo passa de 30 dias ou é
//   indeterminado), digita o código que chega no e-mail e já entra.
// - Prazo começa a contar no aceite; o dono corta o acesso quando quiser.

const PRAZOS = [1, 3, 7, 30, 60, 90, 180, 365]
const PAPEIS = ['admin', 'financeiro', 'contabil', 'leitor', 'operador']
const RELACOES = ['ceo', 'socio', 'contador', 'funcionario', 'consultor', 'outro']
const MEU_PAPEL = ['ceo', 'socio', 'admin', 'contador', 'funcionario', 'consultor', 'outro']

// ponytail: limite de tentativas de senha em memória (por instância); vira tabela se aparecer abuso.
const falhas = new Map<string, { n: number; ate: number }>()
function bloqueado(chave: string) {
  const f = falhas.get(chave)
  return !!f && f.ate > Date.now() && f.n >= 5
}
function registrarFalha(chave: string) {
  const f = falhas.get(chave)
  const vivo = f && f.ate > Date.now()
  falhas.set(chave, { n: vivo ? f!.n + 1 : 1, ate: vivo ? f!.ate : Date.now() + 15 * 60000 })
}

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

// Confere e-mail + senha sem mexer na sessão de ninguém.
async function conferirSenha(email: string, senha: string): Promise<string | null> {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password: senha })
  return error ? null : data.user?.id ?? null
}

// Dono, Admin, Sócio ou CEO com acesso valendo nesta empresa.
async function podeLiberar(db: SupabaseClient, empresaId: string, userId: string): Promise<boolean> {
  const { data: emp } = await db.from('empresas').select('id').eq('id', empresaId).eq('user_id', userId).maybeSingle()
  if (emp) return true
  const v = await vinculo(db, empresaId, userId)
  if (!v) return false
  if (v.papel === 'dono' || v.papel === 'admin') return true
  if (!v.convite_id) return false
  const { data: cv } = await db.from('empresa_equipe').select('relacao').eq('id', v.convite_id).maybeSingle()
  return cv?.relacao === 'socio' || cv?.relacao === 'ceo'
}

async function vinculo(db: SupabaseClient, empresaId: string, userId: string) {
  const { data } = await db.from('empresa_usuarios').select('papel, convite_id, acesso_expira_em, suspenso_em')
    .eq('empresa_id', empresaId).eq('user_id', userId).maybeSingle()
  // Suspenso (hierarquia da Equipe) ou prazo vencido = sem acesso
  if (!data || data.suspenso_em || (data.acesso_expira_em && new Date(data.acesso_expira_em) < new Date())) return null
  return data
}

async function usuarioLogado() {
  const cookieStore = await cookies()
  const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } })
  const { data: { user } } = await s.auth.getUser()
  return user
}

function cpfValido(c: string): boolean {
  const d = c.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const dv = (n: number) => {
    let s = 0
    for (let i = 0; i < n; i++) s += Number(d[i]) * (n + 1 - i)
    const r = (s * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10])
}

const erro = (codigo: string, status = 400) => NextResponse.json({ erro: codigo }, { status })

// Tela Equipe pergunta: eu libero direto ou preciso da senha de um Admin/Sócio/CEO?
export async function GET(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return erro('indisponivel', 503)
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const empresaId = req.nextUrl.searchParams.get('empresaId') || ''
  return NextResponse.json({ podeLiberar: await podeLiberar(admin(), empresaId, user.id) })
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return erro('indisponivel', 503)
  const corpo = await req.json().catch(() => null)
  if (corpo?.acao === 'criar') return criar(corpo)
  if (corpo?.acao === 'conferir') return aceitar(corpo, true)
  if (corpo?.acao === 'aceitar') return aceitar(corpo)
  return erro('acao')
}

async function criar(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const db = admin()
  const empresaId = String(corpo.empresaId || '')
  const f = corpo.form || {}
  const dias: number | null = f.acesso_dias == null ? null : Number(f.acesso_dias)
  const papel = String(f.papel || 'leitor')
  const relacao = String(f.relacao || 'outro')
  if (!corpo.termoRemetente) return erro('termo')
  if (!PAPEIS.includes(papel) || !RELACOES.includes(relacao)) return erro('dados')
  if (dias !== null && !PRAZOS.includes(dias)) return erro('prazo')
  // Indeterminado só para Admin, Sócio ou CEO (regra do Elias, 2026-10-01)
  if (dias === null && !(papel === 'admin' || relacao === 'socio' || relacao === 'ceo')) return erro('sem_prazo')

  // Quem convida precisa ser da empresa (operador de caixa não convida)
  const souDono = await podeLiberar(db, empresaId, user.id)
  const meu = souDono ? null : await vinculo(db, empresaId, user.id)
  if (!souDono && (!meu || meu.papel === 'operador')) return erro('sem_permissao', 403)

  // Trava: "qual é o seu papel?" declarado no formulário. Admin/Sócio/CEO libera
  // direto SE o banco confirmar; qualquer outro papel (ou declaração que não
  // bate com o banco) exige a senha de um Admin/Sócio/CEO.
  const meuPapelDecl = String(corpo.meuPapel || '')
  if (!MEU_PAPEL.includes(meuPapelDecl)) return erro('meu_papel')
  const liberaDireto = souDono && ['ceo', 'socio', 'admin'].includes(meuPapelDecl)

  let autorizadoPor = ''
  if (!liberaDireto) {
    const chave = `criar:${user.id}`
    if (bloqueado(chave)) return erro('muitas_tentativas', 429)
    const emailAut = String(corpo.autorizador?.email || '').trim().toLowerCase()
    const idAut = emailAut ? await conferirSenha(emailAut, String(corpo.autorizador?.senha || '')) : null
    if (!idAut || !(await podeLiberar(db, empresaId, idAut))) { registrarFalha(chave); return erro('autorizador', 403) }
    autorizadoPor = emailAut
  }

  // P7 (Elias 2026-10-02): convite sempre preso a um e-mail — o link só vale pra ele
  const email = String(f.email_convidado || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('email')
  // Mesmo e-mail com convite ainda valendo: reenvia o mesmo link
  {
    const { data: pend } = await db.from('empresa_equipe').select('id, token_convite, expira_em')
      .eq('empresa_id', empresaId).eq('convite_aceito', false).ilike('email_convidado', email).limit(1)
    const p = pend?.[0]
    if (p && (!p.expira_em || new Date(p.expira_em) > new Date())) return NextResponse.json({ id: p.id, token: p.token_convite })
    if (p) await db.from('empresa_equipe').delete().eq('id', p.id)
  }

  const nomeRemetente = String(user.user_metadata?.nome || user.user_metadata?.full_name || user.email || '')
  const diasLink = Math.min(dias ?? 7, 7) // link do convite vale no máximo 7 dias
  const token = crypto.randomUUID()
  const { data, error } = await db.from('empresa_equipe').insert({
    empresa_id: empresaId, user_id: user.id, token_convite: token, email_convidado: email,
    nome: String(f.nome || '').trim() || null, cargo: String(f.cargo || '').trim() || null,
    papel, relacao, acesso_dias: dias, motivo_convite: String(f.motivo_convite || '').trim() || null,
    remetente_nome: `${nomeRemetente} (${meuPapelDecl})` + (autorizadoPor ? ` — autorizado por ${autorizadoPor}` : ''),
    remetente_termo_em: new Date().toISOString(),
    expira_em: new Date(Date.now() + diasLink * 86400000).toISOString(),
  }).select('id').single()
  if (error) { console.error('[convite] criar:', error.message); return erro('generico', 500) }
  return NextResponse.json({ id: data.id, token })
}

// P7 (Elias 2026-10-02): o convidado prova que o e-mail é dele. A tela pede
// "conferir" (valida o formulário sem login), manda o código pelo
// próprio Supabase Auth (e-mail via Resend), troca o código por sessão e só
// então chama "aceitar" — aqui o e-mail vem da SESSÃO, nunca do formulário.
async function aceitar(corpo: any, soConferir = false) {
  const db = admin()
  const token = String(corpo.token || '')
  const nome = String(corpo.nome || '').trim().replace(/\s+/g, ' ')
  const cpf = String(corpo.cpf || '').replace(/\D/g, '')

  const { data: cv } = await db.from('empresa_equipe').select('*').eq('token_convite', token).maybeSingle()
  if (!cv) return erro('invalido', 404)
  if (cv.situacao === 'aprovado' || cv.situacao === 'recusado' || cv.convite_aceito) return erro('usado', 409)
  if (cv.expira_em && new Date(cv.expira_em) < new Date()) return erro('expirado', 410)

  const pedeCpf = cv.acesso_dias == null || cv.acesso_dias > 30
  if (nome.split(' ').length < 2) return erro('nome')
  if (pedeCpf && !cpfValido(cpf)) return erro('cpf')
  if (!corpo.aceita) return erro('lgpd')

  if (soConferir) {
    const email = String(corpo.email || '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('email')
    if (cv.email_convidado && cv.email_convidado.toLowerCase() !== email) return erro('email_outro')
    return NextResponse.json({ ok: true })
  }

  const user = await usuarioLogado()
  if (!user?.email) return erro('login', 401)
  const email = user.email.toLowerCase()
  if (cv.email_convidado && cv.email_convidado.toLowerCase() !== email) return erro('email_outro', 403)
  const userId = user.id

  const { data: dono } = await db.from('empresas').select('id').eq('id', cv.empresa_id).eq('user_id', userId).maybeSingle()
  if (dono) return erro('ja_dono', 409)

  const expira = cv.acesso_dias == null ? null : new Date(Date.now() + cv.acesso_dias * 86400000).toISOString()
  const agora = new Date().toISOString()
  const { error: e1 } = await db.from('empresa_usuarios').upsert(
    { empresa_id: cv.empresa_id, user_id: userId, papel: cv.papel || 'leitor', acesso_expira_em: expira, convite_id: cv.id,
      suspenso_em: null, suspenso_por: null, suspenso_motivo: null }, // convite novo aceito = volta a ter acesso
    { onConflict: 'empresa_id,user_id' })
  if (e1) { console.error('[convite] acesso:', e1.message); return erro('generico', 500) }
  await db.from('empresa_equipe').update({
    situacao: 'aprovado', convite_aceito: true, aceito_em: agora, user_id_convidado: userId,
    convidado_nome_termo: nome, convidado_termo_em: agora, decidido_em: agora,
  }).eq('id', cv.id)
  const { error: e2 } = await db.from('empresa_convite_termo').insert({
    empresa_id: cv.empresa_id, convite_id: cv.id, user_id: userId, nome, cpf: cpf || null, email,
    remetente_nome: cv.remetente_nome, confirmou_remetente: true, aceitou_termos_lgpd: true,
    relacao: cv.relacao, papel: cv.papel, acesso_dias: cv.acesso_dias, motivo_convite: cv.motivo_convite, convidado_em: cv.created_at,
  })
  if (e2) console.error('[convite] termo:', e2.message)

  const { data: emp } = await db.from('empresas').select('nome').eq('id', cv.empresa_id).maybeSingle()
  return NextResponse.json({ empresaId: cv.empresa_id, empresaNome: emp?.nome || '' })
}
