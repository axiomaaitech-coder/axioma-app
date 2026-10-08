import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ✅ Apenas conta admin para testes
const CONTAS_LIBERADAS = [
  'aitrainersuporte@gmail.com',
]

// ✅ Rate limiting simples em memória
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

// ✅ Headers de segurança
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://challenges.cloudflare.com https://*.pluggy.ai https://cdn.pluggy.ai; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https:; font-src 'self' data:; connect-src 'self' https://challenges.cloudflare.com https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://*.pluggy.ai https://api.pluggy.ai https://*.sentry.io https://*.ingest.us.sentry.io https://viacep.com.br https://servicodados.ibge.gov.br ws://localhost:* wss://localhost:*; frame-src 'self' https://challenges.cloudflare.com https://*.pluggy.ai https://connect.pluggy.ai; worker-src 'self' blob:; frame-ancestors 'none';"
  )
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') || 'anonymous'

  if (pathname.startsWith('/api/') || pathname === '/login' || pathname === '/cadastro') {
    const limite = pathname.startsWith('/api/ia/') ? 30 : 60
    if (!checkRateLimit(`${ip}:${pathname}`, limite, 60000)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Retry-After': '60', 'Content-Type': 'text/plain' }
      })
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const rotasPublicas = [
    '/',
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/atualizar-senha',
    '/auth/callback',
    '/privacidade',
    '/termos',
  ]

  const isRotaPublica = rotasPublicas.some(rota => pathname === rota)
  const isCallback = pathname.startsWith('/auth/')
  const isRotaPlanos = pathname.startsWith('/planos')

  // Protegido POR PADRÃO (auditoria 2026-09-28): antes era uma lista à mão e PDV,
  // Estoque e Equipe tinham ficado de fora (abriam sem login e sem plano). Agora só
  // fica aberto o que é público de propósito: páginas públicas, auth, planos,
  // convite (tem o próprio fluxo de login), rotas de API (cada uma confere a sua
  // própria sessão/assinatura) e arquivos estáticos (imagem, vídeo, ícone).
  const isArquivoEstatico = /\.[a-z0-9]{2,5}$/i.test(pathname)
  const isRotaProtegida =
    !isRotaPublica && !isCallback && !isRotaPlanos && !isArquivoEstatico &&
    !pathname.startsWith('/api/') && !pathname.startsWith('/convite/')

  if (isCallback) {
    return addSecurityHeaders(supabaseResponse)
  }

  if (!user && (isRotaProtegida || isRotaPlanos)) {
    const response = NextResponse.redirect(new URL('/', request.url))
    return addSecurityHeaders(response)
  }

  // ✅ Usuário logado em rota pública — mas deixa passar recuperar/atualizar senha
  if (user && isRotaPublica) {
    if (pathname === '/recuperar-senha' || pathname === '/atualizar-senha' || pathname === '/termos' || pathname === '/privacidade') {
      return addSecurityHeaders(supabaseResponse)
    }
    const response = NextResponse.redirect(new URL('/dashboard', request.url))
    return addSecurityHeaders(response)
  }

  if (user && isRotaProtegida) {
    const email = user.email || ''

    if (CONTAS_LIBERADAS.includes(email)) {
      return addSecurityHeaders(supabaseResponse)
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('plano_ativo')
      .eq('user_id', user.id)
      .maybeSingle()

    // Convidado da equipe não paga plano: entra enquanto o acesso estiver valendo.
    // ponytail: não confere o plano do dono da empresa — conferir na etapa F (planos).
    let membro = false
    if (!perfil?.plano_ativo) {
      const { data: vinculo } = await supabase
        .from('empresa_usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .neq('papel', 'dono') // dono da própria empresa continua precisando de plano
        .or(`acesso_expira_em.is.null,acesso_expira_em.gt.${new Date().toISOString()}`)
        .limit(1)
      membro = !!vinculo?.length
    }

    // Assinatura é da empresa (2026-10-03): dono de empresa com plano ativo entra
    // (cobre quem recebeu a empresa por transferência de propriedade).
    if (!membro && !perfil?.plano_ativo) {
      const { data: empAtiva } = await supabase.from('empresas').select('id').eq('user_id', user.id).eq('plano_ativo', true).limit(1)
      membro = !!empAtiva?.length
    }

    if (!membro && (!perfil || !perfil.plano_ativo)) {
      // Convidado que confirmou o e-mail mas o aceite ainda não gravou: volta pro
      // convite (aceita sozinho lá), nunca pra tela de planos.
      const conviteToken = user.user_metadata?.convite_token
      if (typeof conviteToken === 'string' && /^[0-9a-f-]{36}$/i.test(conviteToken)) {
        return addSecurityHeaders(NextResponse.redirect(new URL(`/convite/${conviteToken}`, request.url)))
      }
      const response = NextResponse.redirect(new URL('/planos', request.url))
      return addSecurityHeaders(response)
    }
  }

  return addSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-aitech.png|.*\\.svg).*)'],
}