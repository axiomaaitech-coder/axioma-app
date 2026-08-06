'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterConvitePorToken, aceitarConvite } from '../../../lib/empresaHelpers'

const PAPEL_LABEL: Record<string, Record<string, string>> = {
  pt: { admin: '👑 Admin (acesso total)', financeiro: '💰 Financeiro', contabil: '📊 Contábil', leitor: '👁️ Leitor (somente visualização)' },
  en: { admin: '👑 Admin (full access)', financeiro: '💰 Financial', contabil: '📊 Accounting', leitor: '👁️ Reader (view only)' },
  es: { admin: '👑 Admin (acceso total)', financeiro: '💰 Financiero', contabil: '📊 Contable', leitor: '👁️ Lector (solo visualización)' },
}

type Estado = 'carregando' | 'invalido' | 'usado' | 'precisa_login' | 'email_errado' | 'pronto' | 'aceitando' | 'aceito'

export default function AceitarConvite() {
  const params = useParams()
  const router = useRouter()
  const { idioma, setIdioma } = useLanguage()
  const token = String(params.token || '')
  const supabase = createClient()

  const [estado, setEstado] = useState<Estado>('carregando')
  const [convite, setConvite] = useState<{ empresa_nome: string; email_convidado: string; papel: string; cargo: string | null } | null>(null)
  const [emailLogado, setEmailLogado] = useState('')
  const [erro, setErro] = useState('')

  useEffect(() => {
    (async () => {
      const c = await obterConvitePorToken(token)
      if (!c) { setEstado('invalido'); return }
      if (c.convite_aceito) { setEstado('usado'); return }
      setConvite(c)

      const { data: authData } = await supabase.auth.getUser()
      const emailUsuario = authData?.user?.email || ''
      if (!emailUsuario) { setEstado('precisa_login'); return }
      setEmailLogado(emailUsuario)
      if (emailUsuario.toLowerCase() !== c.email_convidado.toLowerCase()) { setEstado('email_errado'); return }
      setEstado('pronto')
    })()
  }, [token])

  async function handleAceitar() {
    setEstado('aceitando')
    setErro('')
    const r = await aceitarConvite(token)
    if (r.erro) {
      setErro(r.erro)
      setEstado('pronto')
      return
    }
    setEstado('aceito')
    setTimeout(() => { router.push('/dashboard'); router.refresh() }, 1500)
  }

  async function handleSair() {
    await supabase.auth.signOut()
    setEstado('precisa_login')
    setEmailLogado('')
  }

  const t = {
    pt: {
      titulo: 'Convite para a equipe', invalido: 'Este link de convite não é válido.', usado: 'Este convite já foi utilizado.',
      convidadoPara: (empresa: string) => `Você foi convidado para ajudar em`, papelLabel: 'Papel:', cargoLabel: 'Cargo:',
      entrar: 'Entrar', criarConta: 'Criar Conta', comEmail: 'com o e-mail',
      logadoComo: 'Você está logado como', conviteEnviadoPara: 'mas este convite foi enviado para',
      sairEEntrar: 'Sair e entrar com a conta correta', aceitar: '✓ Aceitar Convite', aceitando: 'Aceitando...',
      aceito: '✅ Convite aceito! Levando você pro Axioma...', voltarLogin: 'Ir para o login',
    },
    en: {
      titulo: 'Team invitation', invalido: 'This invite link is not valid.', usado: 'This invite has already been used.',
      convidadoPara: (empresa: string) => `You were invited to help with`, papelLabel: 'Role:', cargoLabel: 'Position:',
      entrar: 'Sign In', criarConta: 'Create Account', comEmail: 'with the email',
      logadoComo: 'You are signed in as', conviteEnviadoPara: 'but this invite was sent to',
      sairEEntrar: 'Sign out and sign in with the correct account', aceitar: '✓ Accept Invite', aceitando: 'Accepting...',
      aceito: '✅ Invite accepted! Taking you to Axioma...', voltarLogin: 'Go to login',
    },
    es: {
      titulo: 'Invitación al equipo', invalido: 'Este enlace de invitación no es válido.', usado: 'Esta invitación ya fue utilizada.',
      convidadoPara: (empresa: string) => `Fuiste invitado a ayudar en`, papelLabel: 'Rol:', cargoLabel: 'Cargo:',
      entrar: 'Entrar', criarConta: 'Crear Cuenta', comEmail: 'con el correo',
      logadoComo: 'Has iniciado sesión como', conviteEnviadoPara: 'pero esta invitación fue enviada a',
      sairEEntrar: 'Salir e iniciar sesión con la cuenta correcta', aceitar: '✓ Aceptar Invitación', aceitando: 'Aceptando...',
      aceito: '✅ ¡Invitación aceptada! Llevándote a Axioma...', voltarLogin: 'Ir al login',
    },
  }[idioma]

  const linksAuth = convite ? `?next=${encodeURIComponent(`/convite/${token}`)}&email=${encodeURIComponent(convite.email_convidado)}` : ''

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #020810 60%, #000 100%)' }}>

      <div className="absolute top-6 right-8 flex gap-2">
        {(['pt', 'en', 'es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)}
            className="text-xs px-3 py-1 rounded-full font-bold transition-all"
            style={{ background: idioma === l ? 'rgba(167,139,250,0.3)' : 'transparent', color: idioma === l ? '#a78bfa' : '#3a5a8a', border: '1px solid rgba(167,139,250,0.2)' }}>
            {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md px-10 py-12 rounded-3xl flex flex-col items-center text-center"
        style={{ background: 'rgba(8,18,36,0.95)', border: '1px solid rgba(167,139,250,0.2)', boxShadow: '0 0 80px rgba(167,139,250,0.1), 0 30px 60px rgba(0,0,0,0.5)' }}>

        <div className="flex flex-col items-center mb-6" style={{ filter: 'drop-shadow(0 0 40px rgba(167,139,250,0.5))' }}>
          <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={80} height={80} priority />
          <span className="font-black tracking-[0.3em] text-2xl mt-3"
            style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #a78bfa 40%, #ffffff 60%, #6d28d9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AXIOMA
          </span>
        </div>

        {estado === 'carregando' && (
          <p className="text-sm" style={{ color: '#3a6090' }}>...</p>
        )}

        {estado === 'invalido' && (
          <>
            <div className="text-4xl mb-3">🚫</div>
            <p className="text-sm" style={{ color: '#f87171' }}>{t.invalido}</p>
          </>
        )}

        {estado === 'usado' && (
          <>
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm mb-6" style={{ color: '#c8d8f0' }}>{t.usado}</p>
            <a href="/login" className="text-sm font-bold" style={{ color: '#a78bfa' }}>{t.voltarLogin}</a>
          </>
        )}

        {convite && (estado === 'precisa_login' || estado === 'email_errado' || estado === 'pronto' || estado === 'aceitando' || estado === 'aceito') && (
          <>
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#5a7a9a' }}>{t.titulo}</p>
            <p className="text-sm mb-1" style={{ color: '#c8d8f0' }}>{t.convidadoPara(convite.empresa_nome)}</p>
            <p className="text-xl font-bold mb-4" style={{ color: '#a78bfa' }}>{convite.empresa_nome}</p>
            <div className="w-full rounded-xl p-4 mb-6 text-left space-y-1" style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <p className="text-xs" style={{ color: '#5a7a9a' }}>{t.papelLabel} <span style={{ color: '#c8d8f0' }}>{PAPEL_LABEL[idioma][convite.papel] || convite.papel}</span></p>
              {convite.cargo && <p className="text-xs" style={{ color: '#5a7a9a' }}>{t.cargoLabel} <span style={{ color: '#c8d8f0' }}>{convite.cargo}</span></p>}
            </div>
          </>
        )}

        {estado === 'precisa_login' && convite && (
          <div className="w-full space-y-3">
            <p className="text-xs mb-2" style={{ color: '#5a7a9a' }}>{t.comEmail} <strong style={{ color: '#c8d8f0' }}>{convite.email_convidado}</strong></p>
            <a href={`/login${linksAuth}`} className="block w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase"
              style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)', color: '#fff', boxShadow: '0 4px 30px rgba(109,40,217,0.4)' }}>
              {t.entrar}
            </a>
            <a href={`/cadastro${linksAuth}`} className="block w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(167,139,250,0.3)', color: '#c8d8f0' }}>
              {t.criarConta}
            </a>
          </div>
        )}

        {estado === 'email_errado' && convite && (
          <div className="w-full space-y-3">
            <p className="text-xs mb-2" style={{ color: '#fbbf24' }}>
              {t.logadoComo} <strong>{emailLogado}</strong>, {t.conviteEnviadoPara} <strong>{convite.email_convidado}</strong>.
            </p>
            <button onClick={handleSair} className="w-full py-3 rounded-xl font-bold text-sm"
              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
              {t.sairEEntrar}
            </button>
          </div>
        )}

        {(estado === 'pronto' || estado === 'aceitando') && (
          <div className="w-full">
            {erro && <p className="text-xs mb-3" style={{ color: '#f87171' }}>{erro}</p>}
            <button onClick={handleAceitar} disabled={estado === 'aceitando'}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #6d28d9 0%, #a78bfa 100%)', color: '#fff', boxShadow: '0 4px 30px rgba(109,40,217,0.4)' }}>
              {estado === 'aceitando' ? t.aceitando : t.aceitar}
            </button>
          </div>
        )}

        {estado === 'aceito' && (
          <p className="text-sm" style={{ color: '#34d399' }}>{t.aceito}</p>
        )}
      </div>
    </div>
  )
}
