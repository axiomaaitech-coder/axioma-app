'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterConvitePorToken, definirEmpresaPreferida } from '../../../lib/empresaHelpers'

// Tela de quem RECEBE o convite (pedido do Elias, 2026-10-02): NUNCA passa
// pela tela de login. Abre o link → preenche o formulário (nome, senha nova,
// LGPD; CPF quando o prazo passa de 30 dias ou é indeterminado) → recebe um
// código de 6 dígitos no e-mail do convite (P7: prova que o e-mail é dele) →
// /api/convite libera o acesso → "Seja bem-vindo" → entra.

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

type Estado = 'carregando' | 'invalido' | 'usado' | 'expirado' | 'recusado' | 'pronto' | 'enviando' | 'codigo' | 'bemvindo'
type Convite = NonNullable<Awaited<ReturnType<typeof obterConvitePorToken>>>

const COR = { fundo: '#050d1c', card: '#0a1730', linha: 'rgba(147,166,194,0.16)', menta: '#2ecc9b', tinta: '#04241a', texto: '#e8eef7', sec: '#93a6c2', campo: 'rgba(255,255,255,0.035)', erro: '#f87171' }

export default function AceitarConvite() {
  const params = useParams()
  const { idioma, setIdioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as 'pt' | 'en' | 'es'
  const token = String(params.token || '')
  const supabase = createClient()

  const [estado, setEstado] = useState<Estado>('carregando')
  const [convite, setConvite] = useState<Convite | null>(null)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [empresaId, setEmpresaId] = useState('')
  const [codigo, setCodigo] = useState('')
  // Voltou pelo botão do e-mail (já logado com o e-mail do convite): só falta concluir
  const [voltouPeloEmail, setVoltouPeloEmail] = useState(false)
  const chaveRascunho = `axioma_convite_${token}`

  useEffect(() => {
    (async () => {
      const c = await obterConvitePorToken(token)
      if (!c) { setEstado('invalido'); return }
      setConvite(c)
      if (c.email_convidado) setEmail(c.email_convidado)
      if (c.convite_aceito || c.situacao === 'aprovado') { setEstado('usado'); return }
      if (c.situacao === 'recusado') { setEstado('recusado'); return }
      if (c.expira_em && new Date(c.expira_em) < new Date()) { setEstado('expirado'); return }
      // O botão do e-mail faz login e cai aqui de volta: recupera o formulário (sem a senha)
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email && (!c.email_convidado || user.email.toLowerCase() === c.email_convidado.toLowerCase())) {
        try {
          const r = JSON.parse(localStorage.getItem(chaveRascunho) || 'null')
          if (r) { setNome(r.nome || ''); setCpf(r.cpf || ''); setAceitaTermos(!!r.aceita) }
        } catch {}
        setEmail(user.email)
        setVoltouPeloEmail(true)
      }
      setEstado('pronto')
    })()
  }, [token])

  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const dataHora = (iso?: string | null) => iso ? new Date(iso).toLocaleString(localeData, { dateStyle: 'short', timeStyle: 'short' }) : '—'
  const prazoTexto = (d?: number | null) => d == null ? L('indeterminado', 'indefinite', 'indefinido')
    : d === 1 ? L('24 horas', '24 hours', '24 horas')
    : d === 180 ? L('6 meses', '6 months', '6 meses')
    : d === 365 ? L('1 ano', '1 year', '1 año')
    : L(`${d} dias`, `${d} days`, `${d} días`)
  const remetente = (convite?.remetente_nome || '').replace(/\s*\(.*$/, '') || L('o responsável pela empresa', 'the company owner', 'el responsable de la empresa')

  // CPF só para acesso acima de 30 dias ou indeterminado (regra do Elias)
  const pedeCpf = convite ? (convite.acesso_dias == null || convite.acesso_dias > 30) : false
  const nomeOk = nome.trim().split(/\s+/).length >= 2
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const senhaOk = senha.length >= 6
  const cpfOk = !pedeCpf || cpfValido(cpf)
  const podeEnviar = nomeOk && emailOk && senhaOk && cpfOk && aceitaTermos && estado === 'pronto'

  const MSG: Record<string, string> = {
    nome: L('Digite seu nome completo (nome e sobrenome).', 'Enter your full name (first and last).', 'Escriba su nombre completo (nombre y apellido).'),
    email: L('E-mail inválido.', 'Invalid e-mail.', 'Correo inválido.'),
    email_outro: L('Este convite foi enviado para outro e-mail.', 'This invite was sent to another e-mail.', 'Esta invitación fue enviada a otro correo.'),
    senha_curta: L('A senha precisa de pelo menos 6 caracteres.', 'Password needs at least 6 characters.', 'La contraseña necesita al menos 6 caracteres.'),
    senha_fraca: L('Escolha uma senha mais forte.', 'Choose a stronger password.', 'Elija una contraseña más fuerte.'),
    senha_conta: L('Este e-mail já tem conta no Axioma. Digite a senha dessa conta.', 'This e-mail already has an Axioma account. Type that account\'s password.', 'Este correo ya tiene cuenta en Axioma. Escriba la contraseña de esa cuenta.'),
    cpf: L('CPF inválido. Confira os números.', 'Invalid CPF. Check the numbers.', 'CPF inválido. Revise los números.'),
    lgpd: L('Marque que aceita os Termos e a LGPD.', 'Check that you accept the Terms and LGPD.', 'Marque que acepta los Términos y la LGPD.'),
    codigo: L('Código errado ou vencido. Confira o e-mail ou peça outro.', 'Wrong or expired code. Check the e-mail or ask for another.', 'Código incorrecto o vencido. Revise el correo o pida otro.'),
    envio: L('Não conseguimos enviar o código agora. Espere 1 minuto e tente de novo.', 'We could not send the code now. Wait 1 minute and try again.', 'No pudimos enviar el código ahora. Espere 1 minuto e intente de nuevo.'),
    login: L('Confirme o código enviado ao seu e-mail.', 'Confirm the code sent to your e-mail.', 'Confirme el código enviado a su correo.'),
    usado: L('Este convite já foi utilizado.', 'This invite has already been used.', 'Esta invitación ya fue utilizada.'),
    expirado: L('Este convite expirou. Peça um novo a quem convidou você.', 'This invite has expired. Ask for a new one.', 'Esta invitación expiró. Pida una nueva.'),
    ja_dono: L('Você já é o proprietário desta empresa.', 'You already own this company.', 'Usted ya es el propietario de esta empresa.'),
    muitas_tentativas: L('Muitas tentativas. Aguarde 15 minutos.', 'Too many attempts. Wait 15 minutes.', 'Demasiados intentos. Espere 15 minutos.'),
  }
  const erroPadrao = L('Não deu certo. Tente de novo.', 'Something went wrong. Try again.', 'Algo salió mal. Intente de nuevo.')

  async function enviar() {
    if (!podeEnviar) {
      setErro(!nomeOk ? MSG.nome : !emailOk ? MSG.email : !senhaOk ? MSG.senha_curta : !cpfOk ? MSG.cpf : MSG.lgpd)
      return
    }
    setErro('')
    setEstado('enviando')
    try {
      // 1) servidor confere o formulário e o convite (sem login)
      const resp = await fetch('/api/convite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'conferir', token, nome: nome.trim(), cpf, email: email.trim(), aceita: aceitaTermos }),
      })
      const r = await resp.json().catch(() => ({ erro: 'generico' }))
      if (r.erro || !r.ok) { setErro(MSG[r.erro] || erroPadrao); setEstado('pronto'); return }
      if (voltouPeloEmail) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) { await concluir(user); return }
      }
      try { localStorage.setItem(chaveRascunho, JSON.stringify({ nome: nome.trim(), cpf, aceita: aceitaTermos })) } catch {}
      // 2) código de 6 dígitos no e-mail (Supabase Auth → Resend). Se a pessoa clicar no
      // botão do e-mail em vez de digitar o código, volta pra esta tela (antes ia pro painel
      // sem o vínculo com a empresa e a trava mandava pra tela de planos).
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: {
        shouldCreateUser: true, data: { nome: nome.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/convite/${token}`)}`,
      } })
      if (error) { console.error('[convite] código', error.message); setErro(MSG.envio); setEstado('pronto'); return }
      setCodigo('')
      setEstado('codigo')
    } catch {
      setErro(erroPadrao); setEstado('pronto')
    }
  }

  async function confirmarCodigo() {
    const cod = codigo.replace(/\D/g, '')
    if (cod.length < 6) { setErro(MSG.codigo); return }
    setErro('')
    setEstado('enviando')
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: cod, type: 'email' })
      if (error || !data.user) { setErro(MSG.codigo); setEstado('codigo'); return }
      await concluir(data.user, 'codigo')
    } catch {
      setErro(erroPadrao); setEstado('codigo')
    }
  }

  async function concluir(user: { id: string; created_at: string }, voltarPara: Estado = 'pronto') {
    try {
      const data = { user }
      // Conta nova (criada agora pelo código): grava a senha escolhida. Conta antiga: senha não muda.
      if (Date.now() - new Date(data.user.created_at).getTime() < 15 * 60000) {
        await supabase.auth.updateUser({ password: senha, data: { nome: nome.trim() } })
      }
      const resp = await fetch('/api/convite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aceitar', token, nome: nome.trim(), cpf, aceita: aceitaTermos }),
      })
      const r = await resp.json().catch(() => ({ erro: 'generico' }))
      if (r.erro || !r.empresaId) { setErro(MSG[r.erro] || erroPadrao); setEstado(voltarPara); return }
      definirEmpresaPreferida(data.user.id, r.empresaId)
      try { localStorage.removeItem(chaveRascunho) } catch {}
      setEmpresaId(r.empresaId)
      setEstado('bemvindo')
    } catch {
      setErro(erroPadrao); setEstado(voltarPara)
    }
  }

  const [verSenha, setVerSenha] = useState(false)
  const borda = (ok: boolean, preenchido: boolean) => preenchido ? (ok ? 'rgba(46,204,155,0.55)' : 'rgba(248,113,113,0.6)') : COR.linha
  const entrada = 'w-full mt-1.5 px-3.5 py-3 rounded-xl text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2ecc9b]/60'
  const estiloCampo = (ok: boolean, preenchido: boolean) => ({ background: COR.campo, color: COR.texto, border: `1px solid ${borda(ok, preenchido)}` })
  const Rotulo = ({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) =>
    <label htmlFor={htmlFor} className="text-[13px] font-medium" style={{ color: COR.sec }}>{children}</label>

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-16 pb-10"
      style={{ background: `radial-gradient(ellipse 90% 60% at 50% -10%, #0f2a4a 0%, ${COR.fundo} 55%, #01050c 100%)` }}>

      <div className="w-full max-w-[440px] flex justify-end gap-1.5 mb-10">
        {(['pt', 'en', 'es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)} aria-pressed={idioma === l}
            className="text-xs px-2.5 py-1 rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ecc9b]"
            style={{ background: idioma === l ? 'rgba(46,204,155,0.14)' : 'transparent', color: idioma === l ? COR.menta : COR.sec }}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <motion.main initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[440px] rounded-[28px] px-6 sm:px-9 pt-14 pb-8"
        style={{ background: COR.card, border: `1px solid ${COR.linha}`, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.65)' }}>

        {/* selo do convite */}
        <div className="absolute left-1/2 -top-9 -translate-x-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center"
          style={{ background: COR.fundo, border: '1px solid rgba(46,204,155,0.45)', boxShadow: '0 0 0 6px rgba(46,204,155,0.06), 0 10px 30px rgba(46,204,155,0.18)' }}>
          <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={46} height={46} priority />
        </div>

        {estado === 'carregando' && (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: `${COR.menta} transparent transparent transparent` }} />
          </div>
        )}

        {(estado === 'invalido' || estado === 'usado' || estado === 'expirado' || estado === 'recusado') && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold mb-2" style={{ color: COR.texto }}>
              {estado === 'usado' ? L('Convite já aceito', 'Invite already accepted', 'Invitación ya aceptada')
                : estado === 'expirado' ? L('Convite expirado', 'Invite expired', 'Invitación expirada')
                : estado === 'recusado' ? L('Convite cancelado', 'Invite cancelled', 'Invitación cancelada')
                : L('Link de convite inválido', 'Invalid invite link', 'Enlace de invitación inválido')}
            </p>
            <p className="text-sm leading-relaxed mb-6" style={{ color: COR.sec }}>
              {estado === 'usado' ? L('Para entrar de novo, use seu e-mail e a senha que você criou.', 'To come back, use your e-mail and the password you created.', 'Para volver, use su correo y la contraseña que creó.')
                : estado === 'expirado' ? L('Peça um convite novo a quem convidou você.', 'Ask whoever invited you for a new one.', 'Pida una invitación nueva a quien lo invitó.')
                : estado === 'recusado' ? L('O responsável pela empresa cancelou este convite.', 'The company owner cancelled this invite.', 'El responsable de la empresa canceló esta invitación.')
                : L('Confira se o link foi copiado inteiro.', 'Check that the whole link was copied.', 'Revise si el enlace se copió completo.')}
            </p>
            {estado === 'usado' && (
              <a href="/login" className="inline-block px-6 py-3 rounded-xl text-sm font-bold" style={{ background: COR.menta, color: COR.tinta }}>
                {L('Entrar no Axioma', 'Sign in to Axioma', 'Entrar en Axioma')}
              </a>
            )}
          </div>
        )}

        {convite && (estado === 'pronto' || estado === 'enviando') && (
          <>
            <header className="text-center">
              <p className="text-[15px] leading-snug" style={{ color: COR.sec }}>
                {L(`${remetente} convidou você para entrar em`, `${remetente} invited you to join`, `${remetente} te invitó a entrar en`)}
              </p>
              <h1 className="mt-2 text-[30px] leading-[1.1] font-bold tracking-[-0.02em] break-words" style={{ color: COR.texto }}>{convite.empresa_nome}</h1>
            </header>

            <dl className="mt-7 mb-7 text-sm" style={{ borderTop: `1px solid ${COR.linha}` }}>
              {[
                [L('Função', 'Role', 'Función'), `${convite.relacao ? `${RELACAO_LABEL[lang][convite.relacao] || convite.relacao}, ` : ''}${PAPEL_LABEL[lang][convite.papel] || convite.papel}`],
                [L('Acesso', 'Access', 'Acceso'), `${prazoTexto(convite.acesso_dias)}${convite.acesso_dias == null ? '' : L(', a partir de agora', ', starting now', ', a partir de ahora')}`],
                ...(convite.motivo_convite ? [[L('Motivo', 'Reason', 'Motivo'), convite.motivo_convite]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5" style={{ borderBottom: `1px solid ${COR.linha}` }}>
                  <dt style={{ color: COR.sec }}>{k}</dt>
                  <dd className="text-right font-medium" style={{ color: COR.texto }}>{v}</dd>
                </div>
              ))}
            </dl>

            <form onSubmit={(e) => { e.preventDefault(); enviar() }} className="space-y-4" noValidate>
              <div>
                <Rotulo htmlFor="cv-nome">{L('Nome completo', 'Full name', 'Nombre completo')}</Rotulo>
                <input id="cv-nome" value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} maxLength={120} autoComplete="off"
                  className={entrada} style={estiloCampo(nomeOk, nome.length > 0)} />
              </div>
              {pedeCpf && (
                <div>
                  <Rotulo htmlFor="cv-cpf">CPF</Rotulo>
                  <input id="cv-cpf" value={cpf} onChange={(e) => { setCpf(mascaraCpf(e.target.value)); setErro('') }} inputMode="numeric" placeholder="000.000.000-00"
                    className={entrada} style={estiloCampo(cpfOk, cpf.length > 0)} />
                </div>
              )}
              <div>
                <Rotulo htmlFor="cv-email">E-mail</Rotulo>
                <input id="cv-email" value={email} onChange={(e) => { setEmail(e.target.value); setErro('') }} type="email" autoComplete="email"
                  readOnly={!!convite.email_convidado}
                  className={entrada} style={{ ...estiloCampo(emailOk, email.length > 0), ...(convite.email_convidado ? { opacity: 0.75 } : {}) }} />
              </div>
              <div>
                <Rotulo htmlFor="cv-senha">{L('Crie uma senha', 'Create a password', 'Cree una contraseña')}</Rotulo>
                <div className="relative">
                  <input id="cv-senha" value={senha} onChange={(e) => { setSenha(e.target.value); setErro('') }} type={verSenha ? 'text' : 'password'} autoComplete="new-password"
                    className={`${entrada} pr-16`} style={estiloCampo(senhaOk, senha.length > 0)} />
                  <button type="button" onClick={() => setVerSenha(!verSenha)} className="absolute right-3 top-1/2 -translate-y-[40%] text-xs font-semibold px-1.5 py-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ecc9b]" style={{ color: COR.sec }}>
                    {verSenha ? L('Ocultar', 'Hide', 'Ocultar') : L('Mostrar', 'Show', 'Mostrar')}
                  </button>
                </div>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: COR.sec }}>
                  {L('Mínimo de 6 caracteres. Se este e-mail já tem conta no Axioma, a senha dela continua a mesma.', 'At least 6 characters. If this e-mail already has an Axioma account, its password stays the same.', 'Mínimo 6 caracteres. Si este correo ya tiene cuenta en Axioma, su contraseña sigue igual.')}
                </p>
              </div>

              <label className="flex items-start gap-3 pt-1 cursor-pointer">
                <input type="checkbox" checked={aceitaTermos} onChange={(e) => { setAceitaTermos(e.target.checked); setErro('') }} className="mt-[3px] w-4 h-4 accent-[#2ecc9b] flex-shrink-0" />
                <span className="text-[13px] leading-relaxed" style={{ color: COR.sec }}>
                  {L('Li e aceito os ', 'I accept the ', 'Acepto los ')}
                  <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: COR.texto }}>{L('Termos de Uso', 'Terms of Use', 'Términos de Uso')}</a>
                  {L(' e a ', ' and the ', ' y la ')}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: COR.texto }}>{L('Política de Privacidade (LGPD)', 'Privacy Policy (LGPD)', 'Política de Privacidad (LGPD)')}</a>
                  {L('. Sei que o acesso pode ser encerrado a qualquer momento.', '. I know access can be ended at any time.', '. Sé que el acceso puede cerrarse en cualquier momento.')}
                </span>
              </label>

              {voltouPeloEmail && (
                <p className="text-[13px] font-medium rounded-lg px-3 py-2.5" style={{ color: COR.menta, background: 'rgba(46,204,155,0.08)' }}>
                  {L('E-mail confirmado. Confira os dados, digite a senha e conclua.', 'E-mail confirmed. Check your details, type the password and finish.', 'Correo confirmado. Revise los datos, escriba la contraseña y concluya.')}
                </p>
              )}
              <AnimatePresence>
                {erro && (
                  <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-[13px] font-medium flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ color: COR.erro, background: 'rgba(248,113,113,0.08)' }}>
                    <AlertCircle size={15} className="mt-[2px] flex-shrink-0" />{erro}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={estado === 'enviando'} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] transition-[filter,opacity] hover:brightness-110 disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ecc9b]"
                style={{ background: COR.menta, color: COR.tinta, opacity: podeEnviar || estado === 'enviando' ? 1 : 0.55 }}>
                {estado === 'enviando' ? L('Enviando…', 'Sending…', 'Enviando…') : voltouPeloEmail ? L('Concluir e entrar', 'Finish and enter', 'Concluir y entrar') : L('Receber código no e-mail', 'Get code by e-mail', 'Recibir código por correo')}
              </motion.button>
            </form>

            <p className="mt-6 text-xs text-center leading-relaxed flex items-center justify-center gap-1.5" style={{ color: COR.sec }}>
              <Lock size={12} />
              {L('Seus dados ficam protegidos e só a empresa que convidou vê.', 'Your data is protected and only the inviting company sees it.', 'Sus datos están protegidos y solo la empresa que invitó los ve.')}
            </p>
          </>
        )}

        {estado === 'codigo' && convite && (
          <form onSubmit={(e) => { e.preventDefault(); confirmarCodigo() }} className="text-center py-2" noValidate>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: COR.texto }}>{L('Confira seu e-mail', 'Check your e-mail', 'Revise su correo')}</h1>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: COR.sec }}>
              {L(`Mandamos um código de 6 números para ${email.trim()}. Ele prova que este e-mail é seu.`, `We sent a 6-digit code to ${email.trim()}. It proves this e-mail is yours.`, `Enviamos un código de 6 números a ${email.trim()}. Prueba que este correo es suyo.`)}
            </p>
            <input value={codigo} onChange={(e) => { setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6)); setErro('') }}
              inputMode="numeric" autoComplete="one-time-code" placeholder="000000" aria-label={L('Código', 'Code', 'Código')}
              className={`${entrada} text-center text-2xl tracking-[0.5em] font-bold`} style={estiloCampo(codigo.length === 6, codigo.length > 0)} />
            <AnimatePresence>
              {erro && (
                <motion.p role="alert" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-3 text-[13px] font-medium flex items-start gap-2 rounded-lg px-3 py-2.5 text-left" style={{ color: COR.erro, background: 'rgba(248,113,113,0.08)' }}>
                  <AlertCircle size={15} className="mt-[2px] flex-shrink-0" />{erro}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button type="submit" whileTap={{ scale: 0.98 }}
              className="mt-4 w-full py-3.5 rounded-xl font-bold text-[15px] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ecc9b]"
              style={{ background: COR.menta, color: COR.tinta, opacity: codigo.length === 6 ? 1 : 0.55 }}>
              {L('Confirmar e entrar', 'Confirm and enter', 'Confirmar y entrar')}
            </motion.button>
            <button type="button" onClick={() => { setEstado('pronto'); setErro('') }} className="mt-3 text-xs font-semibold underline underline-offset-2" style={{ color: COR.sec }}>
              {L('Não chegou? Voltar e enviar de novo', 'Did not arrive? Go back and resend', '¿No llegó? Volver y reenviar')}
            </button>
          </form>
        )}

        {estado === 'bemvindo' && convite && (
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }} className="text-center py-2">
            <CheckCircle2 size={44} className="mx-auto mb-4" style={{ color: COR.menta }} />
            <h1 className="text-[26px] font-bold tracking-[-0.02em]" style={{ color: COR.texto }}>{L('Seja bem-vindo ao Axioma', 'Welcome to Axioma', 'Bienvenido a Axioma')}</h1>
            <p className="mt-2 text-[15px] leading-relaxed" style={{ color: COR.sec }}>
              {L(`Seu acesso a ${convite.empresa_nome} está liberado.`, `Your access to ${convite.empresa_nome} is ready.`, `Su acceso a ${convite.empresa_nome} está listo.`)}
            </p>
            <button onClick={() => { if (empresaId) window.location.href = '/dashboard' }}
              className="mt-7 w-full py-3.5 rounded-xl font-bold text-[15px] transition-[filter] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ecc9b]"
              style={{ background: COR.menta, color: COR.tinta }}>
              {L('Acessar a plataforma', 'Access the platform', 'Acceder a la plataforma')}
            </button>
            <p className="mt-4 text-xs leading-relaxed" style={{ color: COR.sec }}>
              {L('Nas próximas vezes, entre com seu e-mail e a senha que você criou.', 'Next time, sign in with your e-mail and the password you created.', 'Las próximas veces, entre con su correo y la contraseña que creó.')}
            </p>
          </motion.div>
        )}
      </motion.main>

      <p className="mt-8 text-xs tracking-wide" style={{ color: 'rgba(147,166,194,0.6)' }}>Axioma AI.Tech · axiomaai.com.br</p>
    </div>
  )
}
