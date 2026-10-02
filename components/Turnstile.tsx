'use client'
import Script from 'next/script'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'

// Anti-robô (Cloudflare Turnstile). Sem a chave pública na Vercel
// (NEXT_PUBLIC_TURNSTILE_SITE_KEY) não faz nada e o login segue normal.
// Proteção ligada no Supabase: Authentication > Attack Protection > Captcha.
//
// Só roda quando a pessoa clica no botão (execution: 'execute') — antes
// disso nada aparece nem atrapalha o preenchimento (pedido do Elias).
export const TURNSTILE_ATIVO = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, o: Record<string, unknown>) => string
      remove: (id: string) => void
      reset: (id: string) => void
      execute: (id: string) => void
    }
  }
}

// Uso: const turnstile = useTurnstile()
//      no clique, depois de validar os campos: const captchaToken = await turnstile.pegarToken()
//      na tela: {turnstile.elemento}
export function useTurnstile() {
  const { idioma } = useLanguage()
  const idRef = useRef<string | null>(null)
  const resolver = useRef<((t?: string) => void) | null>(null)
  const [problema, setProblema] = useState(false)
  // Caixinha dentro de janela (Contas a Pagar, PDV) some e volta: redesenha a
  // cada vez que aparece — antes ficava presa à caixinha antiga e travava.
  const [el, setEl] = useState<HTMLDivElement | null>(null)

  const terminar = (t?: string) => { resolver.current?.(t); resolver.current = null }

  useEffect(() => {
    if (!TURNSTILE_ATIVO || !el) return
    const desenhar = () => {
      if (!window.turnstile) return false
      idRef.current = window.turnstile.render(el, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'auto',
        appearance: 'interaction-only',
        execution: 'execute',
        language: idioma === 'en' ? 'en' : idioma === 'es' ? 'es' : 'pt-br',
        callback: (t: string) => { setProblema(false); terminar(t) },
        'error-callback': () => { setProblema(true); terminar(undefined) },
        'timeout-callback': () => { setProblema(true); terminar(undefined) },
      })
      return true
    }
    const iv = desenhar() ? null : setInterval(() => { if (desenhar() && iv) clearInterval(iv) }, 200)
    return () => {
      if (iv) clearInterval(iv)
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current)
      idRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el])

  const pegarToken = useCallback(() => new Promise<string | undefined>((resolve) => {
    if (!TURNSTILE_ATIVO || !idRef.current || !window.turnstile) { resolve(undefined); return }
    resolver.current = resolve
    setProblema(false)
    window.turnstile.reset(idRef.current) // token vale uma vez: cada clique gera um novo
    window.turnstile.execute(idRef.current)
    setTimeout(() => { if (resolver.current === resolve) { setProblema(true); terminar(undefined) } }, 30000)
  }), [])

  const elemento = TURNSTILE_ATIVO ? (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={setEl} className="flex justify-center my-2" />
      {problema && (
        <p className="text-xs text-center mb-2" style={{ color: '#f87171' }}>
          {idioma === 'en' ? 'Could not confirm you are not a robot. Please click again.'
            : idioma === 'es' ? 'No se pudo confirmar que no es un robot. Haga clic de nuevo.'
            : 'Não foi possível confirmar que você não é um robô. Clique de novo.'}
        </p>
      )}
    </>
  ) : null

  return { elemento, pegarToken }
}
