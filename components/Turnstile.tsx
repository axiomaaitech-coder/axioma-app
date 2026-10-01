'use client'
import Script from 'next/script'
import { useEffect, useRef } from 'react'

// Anti-robô (Cloudflare Turnstile). Sem a chave pública na Vercel
// (NEXT_PUBLIC_TURNSTILE_SITE_KEY) não renderiza nada e o login segue normal —
// assim dá pra publicar antes de ligar a proteção no Supabase
// (Authentication > Attack Protection > Captcha, com a chave secreta).
export const TURNSTILE_ATIVO = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void } }
}

// resetKey: mude o número depois de cada tentativa (o token só vale uma vez).
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string | undefined) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const idRef = useRef<string | null>(null)

  useEffect(() => {
    if (!TURNSTILE_ATIVO) return
    onToken(undefined)
    const desenhar = () => {
      if (!ref.current || !window.turnstile) return false
      if (idRef.current) window.turnstile.remove(idRef.current)
      idRef.current = window.turnstile.render(ref.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'auto',
        callback: (t: string) => onToken(t),
        'expired-callback': () => onToken(undefined),
        'error-callback': () => onToken(undefined),
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
  }, [resetKey])

  if (!TURNSTILE_ATIVO) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={ref} className="flex justify-center my-2 min-h-[65px]" />
    </>
  )
}
