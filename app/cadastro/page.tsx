'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '../../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'

export default function Cadastro() {
  const router = useRouter()
  const { idioma, setIdioma } = useLanguage()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  const handleCadastro = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      setErro(idioma === 'pt' ? 'Preencha todos os campos.' : idioma === 'en' ? 'Fill in all fields.' : 'Complete todos los campos.')
      return
    }
    if (senha !== confirmarSenha) {
      setErro(idioma === 'pt' ? 'As senhas nao coincidem.' : idioma === 'en' ? 'Passwords do not match.' : 'Las contrasenas no coinciden.')
      return
    }
    if (senha.length < 6) {
      setErro(idioma === 'pt' ? 'A senha deve ter pelo menos 6 caracteres.' : idioma === 'en' ? 'Password must be at least 6 characters.' : 'La contrasena debe tener al menos 6 caracteres.')
      return
    }

    setCarregando(true)
    setErro('')

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: { data: { nome } }
    })

    if (error) {
      setErro(error.message)
      setCarregando(false)
    } else {
      setSucesso(true)
      setCarregando(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #020810 60%, #000 100%)' }}>
        <div className="w-full max-w-md px-10 py-12 rounded-3xl flex flex-col items-center text-center"
          style={{ background: 'rgba(8,18,36,0.95)', border: '1px solid rgba(59,111,212,0.2)', boxShadow: '0 0 80px rgba(59,111,212,0.1)' }}>
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#c8d8f0' }}>
            {idioma === 'pt' ? 'Conta criada!' : idioma === 'en' ? 'Account created!' : 'Cuenta creada!'}
          </h2>
          <p className="text-sm mb-8" style={{ color: '#3a6090' }}>
            {idioma === 'pt' ? 'Verifique seu email para confirmar o cadastro.' : idioma === 'en' ? 'Check your email to confirm your account.' : 'Revisa tu email para confirmar tu cuenta.'}
          </p>
          <button onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase"
            style={{ background: 'linear-gradient(135deg, #1a3a8f 0%, #2a5fd4 100%)', color: '#fff', boxShadow: '0 4px 30px rgba(42,95,212,0.4)' }}>
            {idioma === 'pt' ? 'Ir para o Login' : idioma === 'en' ? 'Go to Login' : 'Ir al Login'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #020810 60%, #000 100%)' }}>

      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="absolute top-6 right-8 flex gap-2">
        {(['pt', 'en', 'es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)}
            className="text-xs px-3 py-1 rounded-full font-bold transition-all"
            style={{ background: idioma === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: idioma === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)' }}>
            {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md px-10 py-12 rounded-3xl flex flex-col items-center"
        style={{ background: 'rgba(8,18,36,0.95)', border: '1px solid rgba(59,111,212,0.2)', boxShadow: '0 0 80px rgba(59,111,212,0.1), 0 30px 60px rgba(0,0,0,0.5)' }}>

        <div className="flex flex-col items-center mb-8" style={{ filter: 'drop-shadow(0 0 40px rgba(59,111,212,0.6))' }}>
          <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={100} height={100} priority />
          <div className="mt-4 flex flex-col items-center">
            <span className="font-black tracking-[0.3em] text-3xl"
              style={{ background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AXIOMA
            </span>
            <span className="text-xs tracking-[0.4em] mt-1 font-semibold" style={{ color: '#3a5a8a' }}>AI.TECH</span>
          </div>
        </div>

        <p className="text-sm mb-6 text-center" style={{ color: '#3a6090' }}>
          {idioma === 'pt' ? 'Criar nova conta' : idioma === 'en' ? 'Create new account' : 'Crear nueva cuenta'}
        </p>

        <div className="w-full space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: '#3a5a8a' }}>
              {idioma === 'pt' ? 'NOME COMPLETO' : idioma === 'en' ? 'FULL NAME' : 'NOMBRE COMPLETO'}
            </label>
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)}
              placeholder={idioma === 'pt' ? 'Seu nome' : idioma === 'en' ? 'Your name' : 'Tu nombre'}
              className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: '#3a5a8a' }}>EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
              className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: '#3a5a8a' }}>
              {idioma === 'pt' ? 'SENHA' : idioma === 'en' ? 'PASSWORD' : 'CONTRASENA'}
            </label>
            <div className="relative">
              <input type={verSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm pr-12"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
              <button type="button" onClick={() => setVerSenha(!verSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: '#3a5a8a' }}>
                {verSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: '#3a5a8a' }}>
              {idioma === 'pt' ? 'CONFIRMAR SENHA' : idioma === 'en' ? 'CONFIRM PASSWORD' : 'CONFIRMAR CONTRASENA'}
            </label>
            <div className="relative">
              <input type={verConfirmar ? 'text' : 'password'} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCadastro()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm pr-12"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0' }} />
              <button type="button" onClick={() => setVerConfirmar(!verConfirmar)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
                style={{ color: '#3a5a8a' }}>
                {verConfirmar ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-xs text-center py-2 rounded-lg" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>
              {erro}
            </p>
          )}

          <button onClick={handleCadastro} disabled={carregando}
            className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 mt-2"
            style={{ background: 'linear-gradient(135deg, #1a3a8f 0%, #2a5fd4 100%)', color: '#fff', opacity: carregando ? 0.7 : 1, boxShadow: '0 4px 30px rgba(42,95,212,0.4)' }}>
            {carregando ? (idioma === 'pt' ? 'Criando...' : 'Creating...') : (idioma === 'pt' ? 'Criar Conta' : idioma === 'en' ? 'Create Account' : 'Crear Cuenta')}
          </button>

          <p className="text-center text-xs mt-2" style={{ color: '#3a5a8a' }}>
            {idioma === 'pt' ? 'Ja tem conta?' : idioma === 'en' ? 'Already have an account?' : 'Ya tienes cuenta?'}{' '}
            <a href="/" className="font-bold" style={{ color: '#6ab0ff' }}>
              {idioma === 'pt' ? 'Entrar' : idioma === 'en' ? 'Sign in' : 'Iniciar sesion'}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}