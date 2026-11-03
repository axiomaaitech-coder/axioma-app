'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: false,
      capture_pageleave: true,
      // App financeiro (Camada 3 de segurança, 2026-11-03): clique e tela nunca levam texto, valor,
      // nome de cliente nem atributo de campo para o PostHog; gravação de sessão desligada.
      // Sem cookie nem armazenamento no navegador (Política de Privacidade §cookies: só o estritamente necessário)
      persistence: 'memory',
      mask_all_text: true,
      mask_all_element_attributes: true,
      disable_session_recording: true,
      session_recording: { maskAllInputs: true, maskTextSelector: '*' },
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
