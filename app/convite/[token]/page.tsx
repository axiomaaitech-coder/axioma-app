'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Clock, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterConvitePorToken, aceitarConvite, definirEmpresaPreferida } from '../../../lib/empresaHelpers'

// Tela de quem RECEBE o convite (link do WhatsApp/Gmail/Outlook/Telegram).
// Segurança (EQUIPE-ACESSO-TEMPORARIO-SQL.sql): a pessoa entra com a própria
// conta (e-mail confirmado pelo Axioma), preenche nome + CPF, confirma quem
// convidou e aceita Termos + LGPD → fica "aguardando aprovação". Só entra
// depois que o dono/admin aprovar na tela Equipe.

const PAPEL_LABEL: Record<string, Record<string, string>> = {
  pt: { admin: 'Admin (acesso total)', financeiro: 'Financeiro', contabil: 'Contábil', leitor: 'Leitor (somente visualização)', operador: 'Operador (caixa/PDV)' },
  en: { admin: 'Admin (full access)', financeiro: 'Financial', contabil: 'Accounting', leitor: 'Reader (view only)', operador: 'Operator (cashier/POS)' },
  es: { admin: 'Admin (acceso total)', financeiro: 'Financiero', contabil: 'Contable', leitor: 'Lector (solo visualización)', operador: 'Operador (caja/PDV)' },
}
const RELACAO_LABEL: Record<string, Record<string, string>> = {
  pt: { ceo: 'CEO', socio: 'Sócio', contador: 'Contador', funcionario: 'Funcionário', consultor: 'Consultor (2ª opinião)', outro: 'Outro' },
  en: { ceo: 'CEO', socio: 'Partner', contador: 'Accountant', funcionario: 'Employee', consultor: 'Consultant (2nd opinion)', outro: 'Other' },
  es: { ceo: 'CEO', socio: 'Socio', contador: 'Contador', funcionario: 'Empleado', consultor: 'Consultor (2ª opinión)', outro: 'Otro' },
}

// CPF: dígitos verificadores (barra número inventado/digitado errado)
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
const mascaraCpf = (v: string) => v.replace(/\D/g, '').slice(0, 11)
  .replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')

type Estado = 'carregando' | 'invalido' | 'usado' | 'expirado' | 'precisa_login' | 'email_errado' | 'pronto' | 'enviando' | 'aguardando' | 'recusado' | 'liberado'
type Convite = NonNullable<Awaited<ReturnType<typeof obterConvitePorToken>>>

const COR = { fundo: '#020810', card: 'rgba(8,18,36,0.95)', borda: 'rgba(46,204,155,0.25)', menta: '#2ecc9b', mentaForte: '#16a97d', texto: '#e2e8f0', sec: '#8aa0bf', campo: 'rgba(255,255,255,0.04)', erro: '#f87171' }

export default function AceitarConvite() {
  const params = useParams()
  const { idioma, setIdioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const token = String(params.token || '')
  const supabase = createClient()

  const [estado, setEstado] = useState<Estado>('carregando')
  const [convite, setConvite] = useState<Convite | null>(null)
  const [emailLogado, setEmailLogado] = useState('')
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [confirmaRemetente, setConfirmaRemetente] = useState(false)
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [userId, setUserId] = useState('')
  const [empresaLiberada, setEmpresaLiberada] = useState<string | null>(null)

  // Depois da aprovação: a pessoa já é membro → acha a empresa (RLS só mostra
  // se o acesso estiver valendo) e libera o botão de entrar.
  async function checarLiberacao(uid: string, nomeEmpresa: string): Promise<boolean> {
    const { data } = await supabase.from('empresa_usuarios').select('empresa_id, empresas(nome)').eq('user_id', uid)
    const linha = (data || []).find((l: any) => (Array.isArray(l.empresas) ? l.empresas[0]?.nome : l.empresas?.nome) === nomeEmpresa)
    if (!linha) return false
    setEmpresaLiberada(linha.empresa_id)
    setEstado('liberado')
    return true
  }

  function entrarNaEmpresa() {
    if (!userId || !empresaLiberada) return
    definirEmpresaPreferida(userId, empresaLiberada)
    window.location.href = '/dashboard'
  }

  useEffect(() => {
    (async () => {
      const c = await obterConvitePorToken(token)
      if (!c) { setEstado('invalido'); return }
      setConvite(c)
      const { data: authData } = await supabase.auth.getUser()
      const uid = authData?.user?.id || ''
      setUserId(uid)
      if (c.convite_aceito || c.situacao === 'aprovado') {
        if (uid && await checarLiberacao(uid, c.empresa_nome)) return
        setEstado('usado'); return
      }
      if (c.situacao === 'recusado') { setEstado('recusado'); return }
      if (c.expira_em && new Date(c.expira_em) < new Date()) { setEstado('expirado'); return }
      const emailUsuario = authData?.user?.email || ''
      if (!emailUsuario) { setEstado('precisa_login'); return }
      setEmailLogado(emailUsuario)
      if (c.email_convidado && emailUsuario.toLowerCase() !== c.email_convidado.toLowerCase()) { setEstado('email_errado'); return }
      if (c.situacao === 'aguardando_aprovacao') { setEstado('aguardando'); return }
      setEstado('pronto')
    })()
  }, [token])

  // Aguardando aprovação: confere a cada 8s se o dono/admin já aprovou
  useEffect(() => {
    if (estado !== 'aguardando' || !userId || !convite) return
    const id = setInterval(async () => {
      const c = await obterConvitePorToken(token)
      if (c?.situacao === 'aprovado') { clearInterval(id); await checarLiberacao(userId, c.empresa_nome) }
      else if (c?.situacao === 'recusado') { clearInterval(id); setEstado('recusado') }
    }, 8000)
    return () => clearInterval(id)
  }, [estado, userId, convite])

  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataHora = (iso?: string | null) => iso ? new Date(iso).toLocaleString(localeData, { dateStyle: 'short', timeStyle: 'short' }) : '—'
  const prazoTexto = (d?: number | null) => d == null ? L('sem prazo', 'no time limit', 'sin plazo') : d === 1 ? L('24 horas', '24 hours', '24 horas') : L(`${d} dias`, `${d} days`, `${d} días`)
  const remetente = convite?.remetente_nome || L('o responsável pela empresa', 'the company owner', 'el responsable de la empresa')

  const nomeOk = nome.trim().length >= 5 && nome.trim().includes(' ')
  const cpfOk = cpfValido(cpf)
  const podeEnviar = nomeOk && cpfOk && confirmaRemetente && aceitaTermos && estado === 'pronto'

  async function enviar() {
    if (!podeEnviar) {
      setErro(!nomeOk ? L('Digite seu nome completo (nome e sobrenome).', 'Enter your full name (first and last).', 'Escriba su nombre completo (nombre y apellido).')
        : !cpfOk ? L('CPF inválido. Confira os números.', 'Invalid CPF. Check the numbers.', 'CPF inválido. Revise los números.')
        : L('Confirme quem enviou o convite e aceite os Termos e a LGPD.', 'Confirm who sent the invite and accept the Terms and LGPD.', 'Confirme quién envió la invitación y acepte los Términos y la LGPD.'))
      return
    }
    setErro('')
    setEstado('enviando')
    const r = await aceitarConvite(token, nome.trim(), cpf, emailLogado, confirmaRemetente, aceitaTermos)
    if (r.erro) { setErro(r.erro); setEstado('pronto'); return }
    setEstado('aguardando')
  }

  async function handleSair() {
    await supabase.auth.signOut()
    setEstado('precisa_login')
    setEmailLogado('')
  }

  const linksAuth = `?next=${encodeURIComponent(`/convite/${token}`)}${convite?.email_convidado ? `&email=${encodeURIComponent(convite.email_convidado)}` : ''}`
  const campo = (ok: boolean, preenchido: boolean) => ({
    background: COR.campo, color: COR.texto,
    border: `1px solid ${preenchido ? (ok ? COR.menta : COR.erro) : 'rgba(255,255,255,0.12)'}`,
  })

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4 py-10"
      style={{ background: `radial-gradient(ellipse at 50% 0%, #0a1628 0%, ${COR.fundo} 60%, #000 100%)` }}>

      <div className="absolute top-5 right-5 flex gap-2">
        {(['pt', 'en', 'es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)} className="text-xs px-3 py-1 rounded-full font-bold transition-all"
            style={{ background: idioma === l ? 'rgba(46,204,155,0.2)' : 'transparent', color: idioma === l ? COR.menta : COR.sec, border: '1px solid rgba(46,204,155,0.25)' }}>
            {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md px-6 sm:px-8 py-8 rounded-3xl"
        style={{ background: COR.card, border: `1px solid ${COR.borda}`, boxShadow: '0 0 80px rgba(46,204,155,0.08), 0 30px 60px rgba(0,0,0,0.5)' }}>

        <div className="flex flex-col items-center mb-5">
          <motion.div animate={{ filter: ['drop-shadow(0 0 18px rgba(46,204,155,0.35))', 'drop-shadow(0 0 30px rgba(46,204,155,0.6))', 'drop-shadow(0 0 18px rgba(46,204,155,0.35))'] }} transition={{ duration: 3, repeat: Infinity }}>
            <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={64} height={64} priority />
          </motion.div>
          <p className="text-xs font-black tracking-[0.3em] uppercase mt-3" style={{ color: COR.menta }}>AXIOMA AI.TECH</p>
          <p className="text-lg font-bold mt-1" style={{ color: COR.texto }}>{L('Convite de acesso', 'Access invitation', 'Invitación de acceso')}</p>
        </div>

        {estado === 'carregando' && <p className="text-sm text-center" style={{ color: COR.sec }}>...</p>}

        {(estado === 'invalido' || estado === 'usado' || estado === 'expirado' || estado === 'recusado') && (
          <div className="text-center">
            <div className="text-4xl mb-3">{estado === 'usado' ? '✅' : '🚫'}</div>
            <p className="text-sm mb-5" style={{ color: estado === 'usado' ? COR.texto : COR.erro }}>
              {estado === 'invalido' ? L('Este link de convite não é válido.', 'This invite link is not valid.', 'Este enlace de invitación no es válido.')
                : estado === 'usado' ? L('Este convite já foi utilizado.', 'This invite has already been used.', 'Esta invitación ya fue utilizada.')
                : estado === 'expirado' ? L('Este convite expirou. Peça um novo a quem convidou você.', 'This invite has expired. Ask for a new one.', 'Esta invitación expiró. Pida una nueva.')
                : L('Este convite foi recusado pelo responsável da empresa.', 'This invite was declined by the company owner.', 'Esta invitación fue rechazada por el responsable.')}
            </p>
            <a href="/login" className="text-sm font-bold" style={{ color: COR.menta }}>{L('Ir para o login', 'Go to login', 'Ir al login')}</a>
          </div>
        )}

        {convite && !['carregando', 'invalido', 'usado', 'expirado', 'recusado'].includes(estado) && (
          <div className="rounded-2xl p-4 mb-5 space-y-1.5 text-xs" style={{ background: 'rgba(46,204,155,0.06)', border: '1px solid rgba(46,204,155,0.18)', color: COR.sec }}>
            <p className="text-sm" style={{ color: COR.texto }}>
              <UserCheck size={14} className="inline mr-1.5" style={{ color: COR.menta }} />
              {L('Convidado por', 'Invited by', 'Invitado por')} <strong>{remetente}</strong> {L('em', 'on', 'el')} {dataHora(convite.convidado_em)}
            </p>
            <p>{L('Empresa', 'Company', 'Empresa')}: <strong style={{ color: COR.texto }}>{convite.empresa_nome}</strong></p>
            <p>
              {convite.relacao ? `${RELACAO_LABEL[lang][convite.relacao] || convite.relacao} • ` : ''}
              {PAPEL_LABEL[lang][convite.papel] || convite.papel}
            </p>
            <p><Clock size={12} className="inline mr-1" />{L('Acesso por', 'Access for', 'Acceso por')} <strong style={{ color: COR.texto }}>{prazoTexto(convite.acesso_dias)}</strong>{L(' a partir da aprovação', ' from approval', ' desde la aprobación')}</p>
            {convite.motivo_convite && <p>{L('Motivo', 'Reason', 'Motivo')}: {convite.motivo_convite}</p>}
          </div>
        )}

        {estado === 'precisa_login' && (
          <div className="space-y-3">
            <p className="text-xs text-center" style={{ color: COR.sec }}>
              {L('Para sua segurança, entre ou crie sua conta no Axioma. Seu e-mail será confirmado.', 'For your security, sign in or create your Axioma account. Your e-mail will be confirmed.', 'Por su seguridad, entre o cree su cuenta en Axioma. Su correo será confirmado.')}
            </p>
            <motion.a whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} href={`/login${linksAuth}`}
              className="block w-full py-3 rounded-xl font-bold text-sm text-center tracking-wide"
              style={{ background: `linear-gradient(135deg, ${COR.mentaForte}, ${COR.menta})`, color: '#fff', boxShadow: '0 6px 24px rgba(46,204,155,0.3)' }}>
              {L('Entrar', 'Sign in', 'Entrar')}
            </motion.a>
            <motion.a whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} href={`/cadastro${linksAuth}`}
              className="block w-full py-3 rounded-xl font-bold text-sm text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(46,204,155,0.3)', color: COR.texto }}>
              {L('Criar conta', 'Create account', 'Crear cuenta')}
            </motion.a>
          </div>
        )}

        {estado === 'email_errado' && convite && (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: '#fbbf24' }}>
              {L('Você está logado como', 'You are signed in as', 'Ha iniciado sesión como')} <strong>{emailLogado}</strong>, {L('mas este convite foi enviado para', 'but this invite was sent to', 'pero esta invitación fue enviada a')} <strong>{convite.email_convidado}</strong>.
            </p>
            <button onClick={handleSair} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              {L('Sair e entrar com a conta correta', 'Sign out and use the correct account', 'Salir y entrar con la cuenta correcta')}
            </button>
          </div>
        )}

        {(estado === 'pronto' || estado === 'enviando') && convite && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: COR.sec }}>{L('Nome completo *', 'Full name *', 'Nombre completo *')}</label>
              <input value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} maxLength={120} autoComplete="name"
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:scale-[1.01]" style={campo(nomeOk, nome.length > 0)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: COR.sec }}>CPF *</label>
              <input value={cpf} onChange={(e) => { setCpf(mascaraCpf(e.target.value)); setErro('') }} inputMode="numeric" placeholder="000.000.000-00"
                className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:scale-[1.01]" style={campo(cpfOk, cpf.length > 0)} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider" style={{ color: COR.sec }}>{L('E-mail (da sua conta, já confirmado)', 'E-mail (your account, confirmed)', 'Correo (de su cuenta, confirmado)')}</label>
              <input value={emailLogado} readOnly className="w-full mt-1 px-3 py-2.5 rounded-xl text-sm opacity-80" style={{ ...campo(true, true), cursor: 'not-allowed' }} />
            </div>

            <motion.label whileHover={{ scale: 1.01 }} className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer"
              style={{ background: confirmaRemetente ? 'rgba(46,204,155,0.08)' : COR.campo, border: `1px solid ${confirmaRemetente ? COR.menta : 'rgba(255,255,255,0.1)'}` }}>
              <input type="checkbox" checked={confirmaRemetente} onChange={(e) => { setConfirmaRemetente(e.target.checked); setErro('') }} className="mt-0.5 accent-emerald-500" />
              <span className="text-xs" style={{ color: COR.texto }}>
                {L(`Confirmo que fui convidado(a) por ${remetente} em ${dataHora(convite.convidado_em)} e que conheço essa pessoa.`,
                   `I confirm I was invited by ${remetente} on ${dataHora(convite.convidado_em)} and that I know this person.`,
                   `Confirmo que fui invitado(a) por ${remetente} el ${dataHora(convite.convidado_em)} y que conozco a esta persona.`)}
              </span>
            </motion.label>

            <motion.label whileHover={{ scale: 1.01 }} className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer"
              style={{ background: aceitaTermos ? 'rgba(46,204,155,0.08)' : COR.campo, border: `1px solid ${aceitaTermos ? COR.menta : 'rgba(255,255,255,0.1)'}` }}>
              <input type="checkbox" checked={aceitaTermos} onChange={(e) => { setAceitaTermos(e.target.checked); setErro('') }} className="mt-0.5 accent-emerald-500" />
              <span className="text-xs" style={{ color: COR.texto }}>
                {L('Li e concordo com os ', 'I have read and agree to the ', 'Leí y acepto los ')}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: COR.menta }}>{L('Termos de Uso e Segurança', 'Terms of Use and Security', 'Términos de Uso y Seguridad')}</a>
                {L(' e com a ', ' and the ', ' y la ')}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: COR.menta }}>{L('Política de Privacidade (LGPD)', 'Privacy Policy (LGPD)', 'Política de Privacidad (LGPD)')}</a>
                {L('. Sei que vou acessar dados financeiros e bancários desta empresa, que meu nome, CPF e e-mail ficam registrados e que o acesso pode ser cortado a qualquer momento.',
                   '. I know I will access this company\'s financial and banking data, that my name, CPF and e-mail are recorded and that access can be cut at any time.',
                   '. Sé que accederé a datos financieros y bancarios de esta empresa, que mi nombre, CPF y correo quedan registrados y que el acceso puede cortarse en cualquier momento.')}
              </span>
            </motion.label>

            <AnimatePresence>
              {erro && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs font-semibold flex items-center gap-1.5" style={{ color: COR.erro }}>
                  <AlertCircle size={14} />{erro}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button onClick={enviar} disabled={estado === 'enviando'}
              whileHover={podeEnviar ? { scale: 1.02, y: -2, boxShadow: '0 10px 30px rgba(46,204,155,0.4)' } : { x: [0, -3, 3, 0] }} whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: podeEnviar ? `linear-gradient(135deg, ${COR.mentaForte}, ${COR.menta})` : 'rgba(46,204,155,0.18)', color: '#fff' }}>
              <ShieldCheck size={16} />
              {estado === 'enviando' ? L('Enviando...', 'Sending...', 'Enviando...') : L('Entrar — enviar para aprovação', 'Enter — send for approval', 'Entrar — enviar para aprobación')}
            </motion.button>
            <p className="text-[11px] text-center" style={{ color: COR.sec }}>
              {L(`Por segurança, ${remetente} confirma seus dados antes de liberar o acesso.`, `For security, ${remetente} confirms your data before granting access.`, `Por seguridad, ${remetente} confirma sus datos antes de liberar el acceso.`)}
            </p>
          </motion.div>
        )}

        {estado === 'aguardando' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }} className="inline-block mb-3">
              <CheckCircle2 size={44} style={{ color: COR.menta }} />
            </motion.div>
            <p className="text-sm font-bold mb-1" style={{ color: COR.texto }}>{L('Dados enviados com segurança', 'Data sent securely', 'Datos enviados con seguridad')}</p>
            <p className="text-xs" style={{ color: COR.sec }}>
              {L(`Agora é só aguardar: ${remetente} vai conferir e aprovar seu acesso. Pode deixar esta tela aberta — ela se atualiza sozinha. Se fechar, é só abrir este mesmo link de novo depois.`,
                 `Now just wait: ${remetente} will review and approve your access. You can keep this screen open — it updates by itself. If you close it, just open this same link again later.`,
                 `Ahora solo espere: ${remetente} revisará y aprobará su acceso. Puede dejar esta pantalla abierta — se actualiza sola. Si la cierra, abra este mismo enlace de nuevo más tarde.`)}
            </p>
          </motion.div>
        )}
        {estado === 'liberado' && convite && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }} className="inline-block mb-3">
              <CheckCircle2 size={48} style={{ color: COR.menta }} />
            </motion.div>
            <p className="text-base font-bold mb-1" style={{ color: COR.texto }}>{L('Acesso liberado!', 'Access granted!', '¡Acceso liberado!')}</p>
            <p className="text-xs mb-5" style={{ color: COR.sec }}>
              {L(`${remetente} aprovou seu acesso à empresa ${convite.empresa_nome}.`, `${remetente} approved your access to ${convite.empresa_nome}.`, `${remetente} aprobó su acceso a ${convite.empresa_nome}.`)}
            </p>
            <motion.button onClick={entrarNaEmpresa} whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 30px rgba(46,204,155,0.45)' }} whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide"
              style={{ background: `linear-gradient(135deg, ${COR.mentaForte}, ${COR.menta})`, color: '#fff' }}>
              {L(`Entrar em ${convite.empresa_nome}`, `Enter ${convite.empresa_nome}`, `Entrar en ${convite.empresa_nome}`)}
            </motion.button>
            <p className="text-[11px] mt-3" style={{ color: COR.sec }}>
              {L('Nas próximas vezes, é só entrar no Axioma com seu e-mail e senha.', 'Next time, just sign in to Axioma with your e-mail and password.', 'Las próximas veces, solo entre en Axioma con su correo y contraseña.')}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
