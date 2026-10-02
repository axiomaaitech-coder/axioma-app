'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Clock, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterConvitePorToken, definirEmpresaPreferida } from '../../../lib/empresaHelpers'

// Tela de quem RECEBE o convite (pedido do Elias, 2026-10-02): NUNCA passa
// pela tela de login. Abre o link → preenche o formulário (nome, e-mail,
// senha nova, LGPD; CPF quando o prazo passa de 30 dias ou é indeterminado)
// → /api/convite cria a conta e libera o acesso → "Seja bem-vindo" → entra.

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

type Estado = 'carregando' | 'invalido' | 'usado' | 'expirado' | 'recusado' | 'pronto' | 'enviando' | 'bemvindo'
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
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [aceitaTermos, setAceitaTermos] = useState(false)
  const [empresaId, setEmpresaId] = useState('')

  useEffect(() => {
    (async () => {
      const c = await obterConvitePorToken(token)
      if (!c) { setEstado('invalido'); return }
      setConvite(c)
      if (c.email_convidado) setEmail(c.email_convidado)
      if (c.convite_aceito || c.situacao === 'aprovado') { setEstado('usado'); return }
      if (c.situacao === 'recusado') { setEstado('recusado'); return }
      if (c.expira_em && new Date(c.expira_em) < new Date()) { setEstado('expirado'); return }
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
  const remetente = convite?.remetente_nome || L('o responsável pela empresa', 'the company owner', 'el responsable de la empresa')

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
      const resp = await fetch('/api/convite', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'aceitar', token, nome: nome.trim(), cpf, email: email.trim(), senha, aceita: aceitaTermos }),
      })
      const r = await resp.json().catch(() => ({ erro: 'generico' }))
      if (r.erro || !r.empresaId) { setErro(MSG[r.erro] || erroPadrao); setEstado('pronto'); return }
      // entra direto, sem tela de login
      if (r.tokenHash) {
        const { data } = await supabase.auth.verifyOtp({ token_hash: r.tokenHash, type: 'email' })
        if (data.user) definirEmpresaPreferida(data.user.id, r.empresaId)
      }
      setEmpresaId(r.empresaId)
      setEstado('bemvindo')
    } catch {
      setErro(erroPadrao); setEstado('pronto')
    }
  }

  const campo = (ok: boolean, preenchido: boolean) => ({
    background: COR.campo, color: COR.texto,
    border: `1px solid ${preenchido ? (ok ? COR.menta : COR.erro) : 'rgba(255,255,255,0.12)'}`,
  })
  const rotulo = 'text-[10px] uppercase tracking-wider'
  const entrada = 'w-full mt-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:scale-[1.01]'

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
                : estado === 'usado' ? L('Este convite já foi utilizado. Para entrar de novo, use seu e-mail e senha.', 'This invite has already been used. To come back, use your e-mail and password.', 'Esta invitación ya fue utilizada. Para volver, use su correo y contraseña.')
                : estado === 'expirado' ? MSG.expirado
                : L('Este convite foi recusado pelo responsável da empresa.', 'This invite was declined by the company owner.', 'Esta invitación fue rechazada por el responsable.')}
            </p>
            {estado === 'usado' && <a href="/login" className="text-sm font-bold" style={{ color: COR.menta }}>{L('Entrar no Axioma', 'Sign in to Axioma', 'Entrar en Axioma')}</a>}
          </div>
        )}

        {convite && (estado === 'pronto' || estado === 'enviando') && (
          <>
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
              <p><Clock size={12} className="inline mr-1" />{L('Acesso por', 'Access for', 'Acceso por')} <strong style={{ color: COR.texto }}>{prazoTexto(convite.acesso_dias)}</strong>{L(' a partir de agora', ' starting now', ' a partir de ahora')}</p>
              {convite.motivo_convite && <p>{L('Motivo', 'Reason', 'Motivo')}: {convite.motivo_convite}</p>}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div>
                <label className={rotulo} style={{ color: COR.sec }}>{L('Nome completo *', 'Full name *', 'Nombre completo *')}</label>
                <input value={nome} onChange={(e) => { setNome(e.target.value); setErro('') }} maxLength={120} autoComplete="name"
                  className={entrada} style={campo(nomeOk, nome.length > 0)} />
              </div>
              {pedeCpf && (
                <div>
                  <label className={rotulo} style={{ color: COR.sec }}>CPF *</label>
                  <input value={cpf} onChange={(e) => { setCpf(mascaraCpf(e.target.value)); setErro('') }} inputMode="numeric" placeholder="000.000.000-00"
                    className={entrada} style={campo(cpfOk, cpf.length > 0)} />
                </div>
              )}
              <div>
                <label className={rotulo} style={{ color: COR.sec }}>{L('E-mail *', 'E-mail *', 'Correo *')}</label>
                <input value={email} onChange={(e) => { setEmail(e.target.value); setErro('') }} type="email" autoComplete="email"
                  readOnly={!!convite.email_convidado}
                  className={entrada} style={{ ...campo(emailOk, email.length > 0), ...(convite.email_convidado ? { opacity: 0.8, cursor: 'not-allowed' } : {}) }} />
              </div>
              <div>
                <label className={rotulo} style={{ color: COR.sec }}>{L('Crie uma senha * (para as próximas vezes)', 'Create a password * (for next time)', 'Cree una contraseña * (para las próximas veces)')}</label>
                <input value={senha} onChange={(e) => { setSenha(e.target.value); setErro('') }} type="password" autoComplete="new-password"
                  className={entrada} style={campo(senhaOk, senha.length > 0)} />
                <p className="text-[10px] mt-1" style={{ color: COR.sec }}>{L('Já tem conta no Axioma com este e-mail? Use a mesma senha.', 'Already have an Axioma account with this e-mail? Use the same password.', '¿Ya tiene cuenta en Axioma con este correo? Use la misma contraseña.')}</p>
              </div>

              <motion.label whileHover={{ scale: 1.01 }} className="flex items-start gap-2.5 p-3 rounded-xl cursor-pointer"
                style={{ background: aceitaTermos ? 'rgba(46,204,155,0.08)' : COR.campo, border: `1px solid ${aceitaTermos ? COR.menta : 'rgba(255,255,255,0.1)'}` }}>
                <input type="checkbox" checked={aceitaTermos} onChange={(e) => { setAceitaTermos(e.target.checked); setErro('') }} className="mt-0.5 accent-emerald-500" />
                <span className="text-xs" style={{ color: COR.texto }}>
                  {L('Li e concordo com os ', 'I have read and agree to the ', 'Leí y acepto los ')}
                  <a href="/termos" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: COR.menta }}>{L('Termos de Uso', 'Terms of Use', 'Términos de Uso')}</a>
                  {L(' e com a ', ' and the ', ' y la ')}
                  <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="underline font-semibold" style={{ color: COR.menta }}>{L('Política de Privacidade (LGPD)', 'Privacy Policy (LGPD)', 'Política de Privacidad (LGPD)')}</a>
                  {L(`. Fui convidado(a) por ${remetente}. Meus dados ficam registrados e o acesso pode ser encerrado a qualquer momento.`,
                     `. I was invited by ${remetente}. My data is recorded and access can be ended at any time.`,
                     `. Fui invitado(a) por ${remetente}. Mis datos quedan registrados y el acceso puede cerrarse en cualquier momento.`)}
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
                {estado === 'enviando' ? L('Entrando...', 'Entering...', 'Entrando...') : L(`Aceitar e entrar em ${convite.empresa_nome}`, `Accept and enter ${convite.empresa_nome}`, `Aceptar y entrar en ${convite.empresa_nome}`)}
              </motion.button>
            </motion.div>
          </>
        )}

        {estado === 'bemvindo' && convite && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }} className="inline-block mb-3">
              <CheckCircle2 size={48} style={{ color: COR.menta }} />
            </motion.div>
            <p className="text-base font-bold mb-1" style={{ color: COR.texto }}>{L('Seja bem-vindo(a) ao Axioma!', 'Welcome to Axioma!', '¡Bienvenido(a) a Axioma!')}</p>
            <p className="text-xs mb-5" style={{ color: COR.sec }}>
              {L(`Seu acesso à empresa ${convite.empresa_nome} está liberado.`, `Your access to ${convite.empresa_nome} is granted.`, `Su acceso a ${convite.empresa_nome} está liberado.`)}
            </p>
            <motion.button onClick={() => { if (empresaId) window.location.href = '/dashboard' }}
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 10px 30px rgba(46,204,155,0.45)' }} whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-xl font-black text-sm tracking-wide"
              style={{ background: `linear-gradient(135deg, ${COR.mentaForte}, ${COR.menta})`, color: '#fff' }}>
              {L('Acessar a plataforma', 'Access the platform', 'Acceder a la plataforma')}
            </motion.button>
            <p className="text-[11px] mt-3" style={{ color: COR.sec }}>
              {L('Nas próximas vezes, é só entrar no Axioma com seu e-mail e a senha que você criou.', 'Next time, just sign in to Axioma with your e-mail and the password you created.', 'Las próximas veces, solo entre en Axioma con su correo y la contraseña que creó.')}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
