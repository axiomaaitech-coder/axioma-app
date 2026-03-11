'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '../lib/LanguageContext'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const { idioma, setIdioma } = useLanguage()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [verSenha, setVerSenha] = useState(false)

  const mensagemErro = {
    pt: 'Email ou senha incorretos.',
    en: 'Invalid email or password.',
    es: 'Email o contraseña incorrectos.',
  }

  const handleLogin = async () => {
    if (!email || !senha) return
    setCarregando(true)
    setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) {
      setErro(mensagemErro[idioma])
      setCarregando(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{background: 'radial-gradient(ellipse at 50% 0%, #0a1628 0%, #020810 60%, #000 100%)'}}>

      <div style={{position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,111,212,0.08) 0%, transparent 70%)', pointerEvents: 'none'}}/>

      <div className="absolute top-6 right-8 flex gap-2">
        {(['pt','en','es'] as const).map((l) => (
          <button key={l} onClick={() => setIdioma(l)}
            className="text-xs px-3 py-1 rounded-full font-bold transition-all"
            style={{background: idioma === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: idioma === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)'}}>
            {l === 'pt' ? '🇧🇷 PT' : l === 'en' ? '🇺🇸 EN' : '🇪🇸 ES'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md px-10 py-12 rounded-3xl flex flex-col items-center"
        style={{background: 'rgba(8,18,36,0.95)', border: '1px solid rgba(59,111,212,0.2)', boxShadow: '0 0 80px rgba(59,111,212,0.1), 0 30px 60px rgba(0,0,0,0.5)'}}>

        <div className="flex flex-col items-center mb-10" style={{filter: 'drop-shadow(0 0 40px rgba(59,111,212,0.6))'}}>
          <Image src="/logo-aitech.png" alt="Axioma AI.Tech" width={140} height={140} priority/>
          <div className="mt-4 flex flex-col items-center">
            <span className="font-black tracking-[0.3em] text-4xl"
              style={{background: 'linear-gradient(135deg, #c8d8f0 0%, #6ab0ff 40%, #ffffff 60%, #3b6fd4 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              AXIOMA
            </span>
            <span className="text-xs tracking-[0.4em] mt-1 font-semibold" style={{color: '#3a5a8a'}}>AI.TECH</span>
          </div>
        </div>

        <p className="text-sm mb-8 text-center" style={{color: '#3a6090'}}>
          {idioma === 'pt' ? 'Inteligência Financeira com IA' : idioma === 'en' ? 'Financial Intelligence with AI' : 'Inteligencia Financiera con IA'}
        </p>

        <div className="w-full space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{color: '#3a5a8a'}}>
              {idioma === 'pt' ? 'E-MAIL' : 'EMAIL'}
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="email@empresa.com"
              className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0'}}/>
          </div>

          <div>
            <label className="text-xs font-semibold tracking-widest uppercase block mb-2" style={{color: '#3a5a8a'}}>
              {idioma === 'pt' ? 'SENHA' : idioma === 'en' ? 'PASSWORD' : 'CONTRASEÑA'}
            </label>
            <div className="relative">
              <input type={verSenha ? 'text' : 'password'} value={senha} onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm pr-12"
                style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0'}}/>
              <button type="button" onClick={() => setVerSenha(!verSenha)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-lg"
                style={{color: '#3a5a8a'}}>
                {verSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {erro && (
            <p className="text-xs text-center py-2 rounded-lg" style={{color: '#f87171', background: 'rgba(248,113,113,0.1)'}}>
              {erro}
            </p>
          )}

          <button onClick={handleLogin} disabled={carregando}
            className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 mt-2"
            style={{background: 'linear-gradient(135deg, #1a3a8f 0%, #2a5fd4 100%)', color: '#fff', opacity: carregando ? 0.7 : 1, boxShadow: '0 4px 30px rgba(42,95,212,0.4)'}}>
            {carregando ? (idioma === 'pt' ? 'Entrando...' : idioma === 'en' ? 'Signing in...' : 'Entrando...') : (idioma === 'pt' ? 'Entrar na Plataforma' : idioma === 'en' ? 'Sign In' : 'Iniciar Sesión')}
          </button>

          <div className="flex justify-between items-center text-xs mt-2">
            <a href="/recuperar-senha" style={{color: '#3a5a8a'}} className="hover:underline">
              {idioma === 'pt' ? 'Esqueceu a senha?' : idioma === 'en' ? 'Forgot password?' : '¿Olvidó su contraseña?'}
            </a>
            <a href="/cadastro" className="font-bold" style={{color: '#6ab0ff'}}>
              {idioma === 'pt' ? 'Criar conta grátis' : idioma === 'en' ? 'Create free account' : 'Crear cuenta gratis'}
            </a>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{color: '#1e3a5a'}}>
          🔒 {idioma === 'pt' ? 'Plataforma segura com criptografia de ponta' : idioma === 'en' ? 'Secure platform with end-to-end encryption' : 'Plataforma segura con cifrado de extremo a extremo'}
        </p>
      </div>
    </div>
  )
}