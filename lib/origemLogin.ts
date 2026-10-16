// Para onde o login com Google volta. Produção: sempre o site principal (endereço fixo, à prova de golpe).
// Prévias da Vercel do PRÓPRIO projeto (axioma-…-axiomaaitech-coders-projects.vercel.app) e o computador
// de desenvolvimento voltam para o próprio endereço — senão o teste na prévia era impossível com conta Google.
// O Supabase só aceita o retorno se o endereço estiver na lista "Redirect URLs" (Authentication → URL Configuration).
const PRODUCAO = 'https://axioma-app.vercel.app'
const PREVIA = /^axioma-[a-z0-9-]+-axiomaaitech-coders-projects\.vercel\.app$/
export function origemDoLogin(local: { hostname: string; origin: string } | null = typeof window !== 'undefined' ? window.location : null): string {
  if (!local) return PRODUCAO
  if (PREVIA.test(local.hostname) || local.hostname === 'localhost' || local.hostname === '127.0.0.1') return local.origin
  return PRODUCAO
}
