'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '../lib/LanguageContext'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const { t, idioma, setIdioma } = useLanguage()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const supabase = createClient()

  const mensagemErro = {
    pt: 'Email ou senha incorretos.',
    en: 'Invalid email or password.',
    es: 'Email o contraseña incorrectos.',
  }

  const carregandoMsg = {
    pt: 'Entrando...',
    en: 'Signing in...',
    es: 'Entrando...',
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
    <div className="min-h-screen flex items-center justify-center" style={{background: '#020810'}}>
      <div className="w-full max-w-md px-8 py-10 rounded-3xl" style={{background: 'rgba(10,22,40,0.95)', border: '1px solid rgba(59,111,212,0.15)'}}>
        
        <div className="flex justify-end gap-2 mb-6">
          {['pt','en','es'].map((l) => (
            <button key={l} onClick={() => setIdioma(l as 'pt'|'en'|'es')} className="text-xs px-3 py-1 rounded-full font-bold transition-all" style={{background: idioma === l ? 'rgba(59,111,212,0.3)' : 'transparent', color: idioma === l ? '#6ab0ff' : '#3a5a8a', border: '1px solid rgba(59,111,212,0.2)'}}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center mb-8">
          <div style={{filter: 'drop-shadow(0 0 20px rgba(59,111,212,0.4))'}}>
            <Image src="/logo-aitech.png" alt="Axioma" width={80} height={80}/>
          </div>
          <h1 className="text-2xl font-black mt-4 tracking-tight" style={{color: '#c8d8f0'}}>AXIOMA</h1>
          <p className="text-sm mt-1" style={{color: '#3a5a8a'}}>
            {idioma === 'pt' ? 'Inteligência Financeira com IA' : idioma === 'en' ? 'Financial Intelligence with AI' : 'Inteligencia Financiera con IA'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold tracking-wider uppercase" style={{color: '#3a5a8a'}}>{t.login.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full mt-2 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0'}}
              placeholder="email@empresa.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold tracking-wider uppercase" style={{color: '#3a5a8a'}}>{t.login.senha}</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="w-full mt-2 px-4 py-3 rounded-xl focus:outline-none text-sm"
              style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(59,111,212,0.2)', color: '#c8d8f0'}}
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p className="text-xs text-center" style={{color: '#f87171'}}>{erro}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={carregando}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 mt-2"
            style={{background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff', opacity: carregando ? 0.7 : 1}}
          >
            {carregando ? carregandoMsg[idioma] : t.login.entrar}
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{color: '#3a5a8a'}}>
          {idioma === 'pt' ? 'Plataforma segura com criptografia de ponta' : idioma === 'en' ? 'Secure platform with end-to-end encryption' : 'Plataforma segura con cifrado de extremo a extremo'}
        </p>
      </div>
    </div>
  )
}