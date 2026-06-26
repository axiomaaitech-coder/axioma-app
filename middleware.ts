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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.pluggy.ai https://cdn.pluggy.ai; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://*.pluggy.ai https://api.pluggy.ai https://*.sentry.io https://*.ingest.us.sentry.io; frame-src 'self' https://*.pluggy.ai https://connect.pluggy.ai; worker-src 'self' blob:; frame-ancestors 'none';"
  )
  return response
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') || 'anonymous'

  if (pathname.startsWith('/api/') || pathname === '/login' || pathname === '/cadastro') {
    const limite = pathname.startsWith('/api/ia-chat') ? 30 : 60
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

  const isRotaProtegida =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/receitas') ||
    pathname.startsWith('/custos-fixos') ||
    pathname.startsWith('/custos-variaveis') ||
    pathname.startsWith('/fornecedores') ||
    pathname.startsWith('/endividamento') ||
    pathname.startsWith('/fluxo-caixa') ||
    pathname.startsWith('/dre') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/centros-custo') ||
    pathname.startsWith('/importar-documentos') ||
    pathname.startsWith('/ia-financeira') ||
    pathname.startsWith('/ia-tributaria') ||
    pathname.startsWith('/relatorios') ||
    pathname.startsWith('/empresa') ||
    pathname.startsWith('/metas') ||
    pathname.startsWith('/investimentos') ||
    pathname.startsWith('/simulacoes') ||
    pathname.startsWith('/precificacao') ||
    pathname.startsWith('/contas-receber') ||
    pathname.startsWith('/inadimplencia') ||
    pathname.startsWith('/mei') ||
    pathname.startsWith('/open-finance')

  if (isCallback) {
    return addSecurityHeaders(supabaseResponse)
  }

  if (!user && (isRotaProtegida || isRotaPlanos)) {
    const response = NextResponse.redirect(new URL('/', request.url))
    return addSecurityHeaders(response)
  }

  // ✅ Usuário logado em rota pública — mas deixa passar recuperar/atualizar senha
  if (user && isRotaPublica) {
    if (pathname === '/recuperar-senha' || pathname === '/atualizar-senha') {
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

    if (!perfil || !perfil.plano_ativo) {
      const response = NextResponse.redirect(new URL('/planos', request.url))
      return addSecurityHeaders(response)
    }
  }

  return addSecurityHeaders(supabaseResponse)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-aitech.png|.*\\.svg).*)'],
}