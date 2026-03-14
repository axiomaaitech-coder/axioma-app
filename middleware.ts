import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
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

  const rotasPublicas = ['/', '/cadastro', '/recuperar-senha', '/atualizar-senha']
  const isRotaPublica = rotasPublicas.some(rota => request.nextUrl.pathname === rota)

  const isRotaProtegida =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/receitas') ||
    request.nextUrl.pathname.startsWith('/custos-fixos') ||
    request.nextUrl.pathname.startsWith('/custos-variaveis') ||
    request.nextUrl.pathname.startsWith('/fornecedores') ||
    request.nextUrl.pathname.startsWith('/endividamento') ||
    request.nextUrl.pathname.startsWith('/fluxo-caixa') ||
    request.nextUrl.pathname.startsWith('/dre') ||
    request.nextUrl.pathname.startsWith('/clientes') ||
    request.nextUrl.pathname.startsWith('/centros-custo') ||
    request.nextUrl.pathname.startsWith('/importar-documentos') ||
    request.nextUrl.pathname.startsWith('/ia-financeira') ||
    request.nextUrl.pathname.startsWith('/ia-tributaria') ||
    request.nextUrl.pathname.startsWith('/relatorios') ||
    request.nextUrl.pathname.startsWith('/empresa')

  if (!user && isRotaProtegida) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (user && isRotaPublica) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo-aitech.png|.*\\.svg).*)'],
}