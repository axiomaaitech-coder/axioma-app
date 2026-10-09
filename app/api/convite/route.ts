import { NextRequest, NextResponse } from 'next/server'
import { bloqueado, registrarFalha, admin, conferirSenha, vinculo, papelLiberador, podeLiberar, usuarioLogado } from '@/lib/supervisorServidor'
import * as Sentry from '@sentry/nextjs'

// Falha de gravação no servidor: log + Sentry com contexto (nunca calada).
// varredura:service-role — toda gravação daqui usa admin() (sem RLS)
function falhaServidor(etapa: string, motivo: string, extra: Record<string, unknown> = {}) {
  console.error(`[convite] ${etapa}:`, motivo)
  Sentry.captureException(new Error(`[convite] ${etapa}: ${motivo}`), { extra: { rota: 'api/convite', etapa, ...extra } })
}
// Gravação complementar (depois da principal já feita): não desfaz a principal,
// mas falha nunca passa calada — vai pro Sentry pra ser refeita.
async function complementar(etapa: string, q: PromiseLike<{ error: { message: string } | null }>, extra: Record<string, unknown> = {}) {
  const { error } = await q
  if (error) falhaServidor(etapa, error.message, extra)
}

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
  const db = admin()
  const papel = await papelLiberador(db, empresaId, user.id)
  // Pedidos de entrada (convite com e-mail confirmado) pra quem pode aprovar
  let pendentes: { id: string; nome: string; email: string; cpf: string; papel: string; relacao: string | null }[] = []
  if (papel) {
    const { data: cvs } = await db.from('empresa_equipe').select('id, papel, relacao, convidado_nome_termo')
      .eq('empresa_id', empresaId).eq('situacao', 'aguardando_aprovacao').limit(20)
    if (cvs?.length) {
      const { data: tms } = await db.from('empresa_convite_termo').select('convite_id, nome, email, cpf')
        .in('convite_id', cvs.map((c) => c.id)).is('apagado_em', null)
      pendentes = cvs.map((c) => {
        const tm = tms?.find((x) => x.convite_id === c.id)
        const cpf = String(tm?.cpf || '')
        return { id: c.id, nome: tm?.nome || c.convidado_nome_termo || '', email: tm?.email || '', papel: c.papel || 'leitor', relacao: c.relacao,
          cpf: cpf.length === 11 ? `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}` : '' }
      })
    }
  }
  return NextResponse.json({ podeLiberar: !!papel, meuPapel: papel, pendentes })
}

export async function POST(req: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return erro('indisponivel', 503)
  const corpo = await req.json().catch(() => null)
  if (corpo?.acao === 'criar') return criar(corpo)
  if (corpo?.acao === 'conferir') return aceitar(corpo, true)
  if (corpo?.acao === 'aceitar') return aceitar(corpo)
  if (corpo?.acao === 'decidir') return decidir(corpo)
  if (corpo?.acao === 'termo_lixeira' || corpo?.acao === 'termo_apagar') return termo(corpo)
  if (['lixeira_listar', 'convite_lixeira', 'convite_recuperar', 'convite_apagar'].includes(corpo?.acao)) return lixeiraConvite(corpo)
  if (corpo?.acao === 'membro_lixeira') return membroLixeira(corpo)
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
  // Trava (Elias 2026-10-07): CEO, Sócio e Admin convidam direto (papel lido do
  // banco, não do formulário). Qualquer outro precisa da senha de um deles + motivo.
  const papelReal = await papelLiberador(db, empresaId, user.id)
  const liberaDireto = !!papelReal
  const meu = liberaDireto ? null : await vinculo(db, empresaId, user.id)
  if (!liberaDireto && (!meu || meu.papel === 'operador')) return erro('sem_permissao', 403)

  const meuPapelDecl = String(corpo.meuPapel || '') || papelReal || ''
  if (!MEU_PAPEL.includes(meuPapelDecl)) return erro('meu_papel')

  let autorizadoPor = ''
  if (!liberaDireto) {
    if (String(f.motivo_convite || '').trim().length < 5) return erro('motivo')
    const chave = `criar:${user.id}`
    if (bloqueado(chave)) return erro('muitas_tentativas', 429)
    const emailAut = String(corpo.autorizador?.email || '').trim().toLowerCase()
    const idAut = emailAut ? await conferirSenha(emailAut, String(corpo.autorizador?.senha || '')) : null
    if (!idAut || !(await podeLiberar(db, empresaId, idAut))) { registrarFalha(chave); return erro('autorizador', 403) }
    autorizadoPor = emailAut
  }

  // E-mail opcional no envio (Elias 2026-10-07). Se vier, o link só vale pra ele;
  // sem e-mail, a pessoa informa e confirma o dela (código) ao entrar.
  const email = String(f.email_convidado || '').trim().toLowerCase()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('email')
  // Mesmo e-mail com convite ainda valendo: reenvia o mesmo link
  if (email) {
    const { data: pend } = await db.from('empresa_equipe').select('id, token_convite, expira_em')
      .eq('empresa_id', empresaId).eq('convite_aceito', false).ilike('email_convidado', email).limit(1)
    const p = pend?.[0]
    if (p && (!p.expira_em || new Date(p.expira_em) > new Date())) return NextResponse.json({ id: p.id, token: p.token_convite })
    if (p) {
      // Convite vencido do mesmo e-mail: some antes de criar o novo (senão ficariam dois pendentes)
      // varredura:ok — service role (sem RLS); erro checado na linha de baixo
      const { error: eDel } = await db.from('empresa_equipe').delete().eq('id', p.id)
      if (eDel) { falhaServidor('apagar convite vencido', eDel.message, { conviteId: p.id }); return erro('generico', 500) }
    }
  }

  // Limite do plano (decisões do Elias 2026-10-03, blocos 11-12). Operador de caixa e
  // contador/consultor externo ficam fora. Até 7 dias = convidado temporário: não ocupa
  // vaga, mas cada plano dá só 3 (usou, acabou; volta ao subir de plano). 8+ dias ocupa vaga.
  const foraDasContas = papel === 'operador' || relacao === 'contador' || relacao === 'consultor'
  const temporario = dias !== null && dias <= 7
  if (!foraDasContas && temporario) {
    const { data: ct, error: eCt } = await db.rpc('equipe_cota_temporarios', { p_empresa: empresaId })
    const c = Array.isArray(ct) ? ct[0] : ct
    if (eCt) console.error('[convite] cota:', eCt.message)
    else if (c && c.usados >= c.limite) return NextResponse.json({ erro: 'cota_temporarios', limite: c.limite }, { status: 402 })
  }
  const contaNoLimite = !foraDasContas && !temporario
  if (contaNoLimite) {
    const { data: vg, error: eVg } = await db.rpc('equipe_vagas', { p_empresa: empresaId })
    const v = Array.isArray(vg) ? vg[0] : vg
    if (eVg) console.error('[convite] vagas:', eVg.message)
    else if (v && v.ocupadas >= v.limite) return NextResponse.json({ erro: 'limite_plano', limite: v.limite, plano: v.plano || null }, { status: 402 })
  }

  const nomeRemetente = String(user.user_metadata?.nome || user.user_metadata?.full_name || user.email || '')
  const diasLink = Math.min(dias ?? 7, 7) // link do convite vale no máximo 7 dias
  const token = crypto.randomUUID()
  const { data, error } = await db.from('empresa_equipe').insert({
    empresa_id: empresaId, user_id: user.id, token_convite: token, email_convidado: email || null,
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
  if (cv.situacao === 'aprovado' || cv.situacao === 'recusado' || cv.convite_aceito || (soConferir && cv.situacao === 'aguardando_aprovacao')) return erro('usado', 409)
  if (cv.expira_em && new Date(cv.expira_em) < new Date()) return erro('expirado', 410)

  const pedeCpf = true // Elias 2026-10-07: todo convidado informa CPF ao entrar
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
  // Já mandou o aceite e espera a aprovação: não grava de novo
  if (cv.situacao === 'aguardando_aprovacao') {
    return cv.user_id_convidado === userId ? NextResponse.json({ aguardando: true }) : erro('usado', 409)
  }

  const { data: dono } = await db.from('empresas').select('id').eq('id', cv.empresa_id).eq('user_id', userId).maybeSingle()
  if (dono) return erro('ja_dono', 409)

  // Procedimento do Elias (2026-10-08): a pessoa confirma o e-mail e fica aguardando;
  // CEO/Sócio/Admin aprova na Equipe e só então ela entra (acao 'decidir').
  const agora = new Date().toISOString()
  const { data: pend, error: e1 } = await db.from('empresa_equipe').update({
    situacao: 'aguardando_aprovacao', user_id_convidado: userId,
    convidado_nome_termo: nome, convidado_termo_em: agora,
  }).eq('id', cv.id).eq('situacao', cv.situacao).select('id')
  if (e1 || !pend?.length) { console.error('[convite] aguardando:', e1?.message || '0 linhas'); return erro('generico', 500) }
  const { error: e2 } = await db.from('empresa_convite_termo').insert({
    empresa_id: cv.empresa_id, convite_id: cv.id, user_id: userId, nome, cpf: cpf || null, email,
    remetente_nome: cv.remetente_nome, confirmou_remetente: true, aceitou_termos_lgpd: true,
    relacao: cv.relacao, papel: cv.papel, acesso_dias: cv.acesso_dias, motivo_convite: cv.motivo_convite, convidado_em: cv.created_at,
  })
  // Termo de aceite é registro LGPD: falha vai pro Sentry pra ser refeito, não só pro log.
  if (e2) falhaServidor('gravar termo de aceite', e2.message, { conviteId: cv.id, empresaId: cv.empresa_id })

  return NextResponse.json({ aguardando: true })
}

// Termo de convite (Elias 2026-10-08): lixeirinha manda pra Lixeira (60 dias,
// recupera); na Lixeira, "Apagar de vez" tira nome/CPF/e-mail com motivo.
async function termo(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const db = admin()
  const { data: tm } = await db.from('empresa_convite_termo').select('id, empresa_id, saiu_em').eq('id', String(corpo.termoId || '')).is('apagado_em', null).maybeSingle()
  if (!tm) return erro('invalido', 404)
  if (!(await podeLiberar(db, tm.empresa_id, user.id))) return erro('sem_permissao', 403)
  const agora = new Date().toISOString()
  if (corpo.acao === 'termo_lixeira') {
    const { error } = await db.from('empresa_convite_termo').update({ saiu_em: agora }).eq('id', tm.id)
    if (error) { console.error('[termo] lixeira:', error.message); return erro('generico', 500) }
    return NextResponse.json({ ok: true })
  }
  const motivo = String(corpo.motivo || '').trim()
  if (motivo.length < 5) return erro('motivo')
  const { error } = await db.from('empresa_convite_termo').update({
    nome: null, cpf: null, email: null, apagado_em: agora, apagado_por: user.id, motivo_apagado: motivo,
  }).eq('id', tm.id)
  if (error) { console.error('[termo] apagar:', error.message); return erro('generico', 500) }
  return NextResponse.json({ ok: true })
}

// Lixeira de convites (Elias 2026-10-08): convite vai pra lixeira (fica "recusado",
// some da equipe, junto com o termo dele), dá pra recuperar em 60 dias ou apagar de vez.
// ponytail: convite na lixeira há mais de 60 dias só some da lista; limpeza física se pesar.
async function lixeiraConvite(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const db = admin()
  const agora = new Date().toISOString()
  if (corpo.acao === 'lixeira_listar') {
    const empresaId = String(corpo.empresaId || '')
    if (!(await podeLiberar(db, empresaId, user.id))) return erro('sem_permissao', 403)
    const { data, error } = await db.from('empresa_equipe')
      .select('id, nome, email_convidado, convidado_nome_termo, papel, relacao, decidido_em, motivo_recusa, user_id_convidado')
      .eq('empresa_id', empresaId).eq('situacao', 'recusado')
      .gte('decidido_em', new Date(Date.now() - 60 * 86400000).toISOString())
      .order('decidido_em', { ascending: false }).limit(200)
    if (error) { console.error('[lixeira] listar:', error.message); return erro('generico', 500) }
    return NextResponse.json({ itens: data || [] })
  }
  const { data: cv } = await db.from('empresa_equipe').select('id, empresa_id, situacao, convite_aceito, user_id_convidado, aceito_em, papel, acesso_dias').eq('id', String(corpo.conviteId || '')).maybeSingle()
  if (!cv) return erro('invalido', 404)
  if (!(await podeLiberar(db, cv.empresa_id, user.id))) return erro('sem_permissao', 403)

  if (corpo.acao === 'convite_lixeira') {
    if (cv.convite_aceito) return erro('usado', 409) // quem já entrou sai por "Cortar acesso"
    const { error } = await db.from('empresa_equipe').update({
      situacao: 'recusado', decidido_por: user.id, decidido_em: agora, motivo_recusa: 'lixeira',
    }).eq('id', cv.id)
    if (error) { console.error('[lixeira] convite:', error.message); return erro('generico', 500) }
    await complementar('empresa_convite_termo update', db.from('empresa_convite_termo').update({ saiu_em: agora }).eq('convite_id', cv.id).is('saiu_em', null), { conviteId: cv.id })
    return NextResponse.json({ ok: true })
  }
  if (corpo.acao === 'convite_recuperar') {
    if (cv.situacao !== 'recusado') return erro('invalido', 409)
    // Quem já tinha acesso (CEO/Sócio/Admin na Lixeira): volta direto, com justificativa
    if (cv.user_id_convidado && cv.aceito_em) {
      const just = String(corpo.motivo || '').trim()
      if (just.length < 5) return erro('motivo')
      const expira = cv.acesso_dias == null ? null : new Date(Date.now() + cv.acesso_dias * 86400000).toISOString()
      // varredura:ok — service role (sem RLS); erro checado logo abaixo
      const { error: eA } = await db.from('empresa_usuarios').upsert(
        { empresa_id: cv.empresa_id, user_id: cv.user_id_convidado, papel: cv.papel || 'leitor', acesso_expira_em: expira, convite_id: cv.id,
          suspenso_em: null, suspenso_por: null, suspenso_motivo: null },
        { onConflict: 'empresa_id,user_id' })
      if (eA) { console.error('[lixeira] recuperar acesso:', eA.message); return erro('generico', 500) }
      await complementar('empresa_equipe update', db.from('empresa_equipe').update({ situacao: 'aprovado', convite_aceito: true, decidido_por: user.id, decidido_em: agora, motivo_recusa: `Recuperado: ${just}` }).eq('id', cv.id), { conviteId: cv.id })
      await complementar('empresa_convite_termo update', db.from('empresa_convite_termo').update({ saiu_em: null }).eq('convite_id', cv.id).is('apagado_em', null), { conviteId: cv.id })
      return NextResponse.json({ ok: true })
    }
    const { error } = await db.from('empresa_equipe').update({
      situacao: cv.user_id_convidado ? 'aguardando_aprovacao' : 'enviado', decidido_por: null, decidido_em: null, motivo_recusa: null,
    }).eq('id', cv.id)
    if (error) { console.error('[lixeira] recuperar:', error.message); return erro('generico', 500) }
    await complementar('empresa_convite_termo update', db.from('empresa_convite_termo').update({ saiu_em: null }).eq('convite_id', cv.id).is('apagado_em', null), { conviteId: cv.id })
    return NextResponse.json({ ok: true })
  }
  // Apagar de vez: o termo perde nome/CPF/e-mail (fica só quem apagou, quando e por quê) e o convite some.
  // Convite que ainda não deu acesso apaga direto (Elias 2026-10-08: quer de novo, manda do zero).
  if (cv.convite_aceito) return erro('usado', 409)
  const motivo = String(corpo.motivo || '').trim() || 'Convite apagado pelo responsável'
  if (motivo.length < 5) return erro('motivo')
  const { error: eT } = await db.from('empresa_convite_termo').update({
    nome: null, cpf: null, email: null, apagado_em: agora, apagado_por: user.id, motivo_apagado: motivo, convite_id: null,
  }).eq('convite_id', cv.id)
  if (eT) { console.error('[lixeira] termo:', eT.message); return erro('generico', 500) }
  const { error } = await db.from('empresa_equipe').delete().eq('id', cv.id)
  if (error) { console.error('[lixeira] apagar:', error.message); return erro('generico', 500) }
  return NextResponse.json({ ok: true })
}

// Lixeira de quem já entrou (Elias 2026-10-08): tira o acesso na hora. CEO/Sócio/Admin
// vão pra Lixeira (60 dias; Recuperar = volta pra "Aguardando aprovação"); os demais
// saem de vez. Ninguém apaga o Proprietário nem a si mesmo.
// ponytail: CEO/Sócio/Admin só o Proprietário manda pra lixeira; aval entre pares fica no "Cortar acesso".
async function membroLixeira(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const db = admin()
  const empresaId = String(corpo.empresaId || '')
  const alvo = String(corpo.alvoUserId || '')
  if (!alvo || alvo === user.id) return erro('sem_permissao', 403)
  if (!(await podeLiberar(db, empresaId, user.id))) return erro('sem_permissao', 403)
  const { data: emp } = await db.from('empresas').select('user_id').eq('id', empresaId).maybeSingle()
  if (!emp || emp.user_id === alvo) return erro('proprietario', 403)
  const { data: v } = await db.from('empresa_usuarios').select('id, papel, convite_id').eq('empresa_id', empresaId).eq('user_id', alvo).maybeSingle()
  if (!v || v.papel === 'dono') return erro('invalido', 404)
  const { data: cv } = v.convite_id ? await db.from('empresa_equipe').select('id, relacao').eq('id', v.convite_id).maybeSingle() : { data: null }
  const lider = v.papel === 'admin' || cv?.relacao === 'ceo' || cv?.relacao === 'socio'
  if (lider && emp.user_id !== user.id) return erro('sem_permissao', 403)
  const agora = new Date().toISOString()

  const { error: eDel } = await db.from('empresa_usuarios').delete().eq('id', v.id)
  if (eDel) { console.error('[lixeira] membro:', eDel.message); return erro('generico', 500) }
  if (cv) {
    if (lider) {
      await complementar('empresa_equipe update', db.from('empresa_equipe').update({ situacao: 'recusado', convite_aceito: false, decidido_por: user.id, decidido_em: agora, motivo_recusa: 'lixeira' }).eq('id', cv.id), { conviteId: cv.id })
      await complementar('empresa_convite_termo update', db.from('empresa_convite_termo').update({ saiu_em: agora }).eq('convite_id', cv.id).is('saiu_em', null), { conviteId: cv.id })
    } else {
      await complementar('empresa_convite_termo update', db.from('empresa_convite_termo').update({ nome: null, cpf: null, email: null, apagado_em: agora, apagado_por: user.id, motivo_apagado: 'Removido pelo responsável', convite_id: null }).eq('convite_id', cv.id), { conviteId: cv.id })
      await complementar('empresa_equipe delete', db.from('empresa_equipe').delete().eq('id', cv.id), { conviteId: cv.id })
    }
  }
  return NextResponse.json({ ok: true, lixeira: lider })
}

// CEO/Sócio/Admin aprova ou recusa quem já confirmou o e-mail. Aprovar dá o acesso.
async function decidir(corpo: any) {
  const user = await usuarioLogado()
  if (!user) return erro('login', 401)
  const db = admin()
  const { data: cv } = await db.from('empresa_equipe').select('*').eq('id', String(corpo.conviteId || '')).maybeSingle()
  if (!cv || cv.situacao !== 'aguardando_aprovacao' || !cv.user_id_convidado) return erro('invalido', 404)
  if (!(await podeLiberar(db, cv.empresa_id, user.id))) return erro('sem_permissao', 403)
  const agora = new Date().toISOString()

  if (!corpo.aprovar) {
    const { error } = await db.from('empresa_equipe').update({
      situacao: 'recusado', decidido_por: user.id, decidido_em: agora,
      motivo_recusa: String(corpo.motivo || '').trim() || null,
    }).eq('id', cv.id)
    if (error) { console.error('[convite] recusar:', error.message); return erro('generico', 500) }
    return NextResponse.json({ ok: true })
  }

  const expira = cv.acesso_dias == null ? null : new Date(Date.now() + cv.acesso_dias * 86400000).toISOString()
  // varredura:ok — service role (sem RLS); erro checado logo abaixo
  const { error: e1 } = await db.from('empresa_usuarios').upsert(
    { empresa_id: cv.empresa_id, user_id: cv.user_id_convidado, papel: cv.papel || 'leitor', acesso_expira_em: expira, convite_id: cv.id,
      suspenso_em: null, suspenso_por: null, suspenso_motivo: null }, // convite novo aprovado = volta a ter acesso
    { onConflict: 'empresa_id,user_id' })
  if (e1) { console.error('[convite] acesso:', e1.message); return erro('generico', 500) }
  // O acesso já foi dado acima; marcar aprovado tenta 2x (senão o painel mostraria "aguardando" com acesso).
  const marcar = () => db.from('empresa_equipe').update({
    situacao: 'aprovado', convite_aceito: true, aceito_em: agora, decidido_por: user.id, decidido_em: agora,
  }).eq('id', cv.id).select('id')
  let ok = await marcar()
  if (ok.error || !ok.data?.length) ok = await marcar()
  if (ok.error || !ok.data?.length) falhaServidor('marcar convite aprovado', ok.error?.message || '0 linhas', { conviteId: cv.id, empresaId: cv.empresa_id })
  return NextResponse.json({ ok: true })
}
