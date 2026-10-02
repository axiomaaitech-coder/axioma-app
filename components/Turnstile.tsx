'use client'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'

// Anti-robô (Cloudflare Turnstile). Sem a chave pública na Vercel
// (NEXT_PUBLIC_TURNSTILE_SITE_KEY) não renderiza nada e o login segue normal —
// assim dá pra publicar antes de ligar a proteção no Supabase
// (Authentication > Attack Protection > Captcha, com a chave secreta).
export const TURNSTILE_ATIVO = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; remove: (id: string) => void } }
}

// resetKey: mude o número DEPOIS de cada envio ao servidor (o token só vale uma vez).
export function Turnstile({ onToken, resetKey = 0 }: { onToken: (token: string | undefined) => void; resetKey?: number }) {
  const { idioma } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)
  const idRef = useRef<string | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const [problema, setProblema] = useState(false)

  useEffect(() => {
    if (!TURNSTILE_ATIVO) return
    onToken(undefined)
    setProblema(false)
    // travou sem resposta em 20s → oferece "Tentar de novo" (nunca deixa a pessoa presa)
    const lento = setTimeout(() => setProblema(true), 20000)
    const desenhar = () => {
      if (!ref.current || !window.turnstile) return false
      if (idRef.current) window.turnstile.remove(idRef.current)
      idRef.current = window.turnstile.render(ref.current, {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
        theme: 'auto',
        // só aparece se precisar de clique; renova sozinha quando vence enquanto a pessoa preenche
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        language: idioma === 'en' ? 'en' : idioma === 'es' ? 'es' : 'pt-br',
        callback: (t: string) => { clearTimeout(lento); setProblema(false); onToken(t) },
        'expired-callback': () => onToken(undefined),
        'error-callback': () => { clearTimeout(lento); setProblema(true); onToken(undefined) },
        'timeout-callback': () => { setProblema(true); onToken(undefined) },
      })
      return true
    }
    const iv = desenhar() ? null : setInterval(() => { if (desenhar() && iv) clearInterval(iv) }, 200)
    return () => {
      clearTimeout(lento)
      if (iv) clearInterval(iv)
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current)
      idRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, tentativa])

  if (!TURNSTILE_ATIVO) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={ref} className="flex justify-center my-2" />
      {problema && (
        <div className="text-center mb-2">
          <button type="button" onClick={() => setTentativa((n) => n + 1)}
            className="text-xs font-bold underline" style={{ color: '#2ecc9b' }}>
            {idioma === 'en' ? 'Security check stuck? Try again' : idioma === 'es' ? '¿Verificación trabada? Intentar de nuevo' : 'Verificação travou? Tentar de novo'}
          </button>
        </div>
      )}
    </>
  )
}
