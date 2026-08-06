import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/dashboard'
  // Quem está aceitando um convite não pode ganhar uma "Minha Empresa" automática
  // aqui — isso faria a ordem dono→convidado (obterEmpresaAtiva) escolher a empresa
  // errada depois. O próprio fluxo de convite cria o vínculo certo (empresa_usuarios).
  const emFluxoDeConvite = next.startsWith('/convite/')

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  // Fluxo 1 — token_hash (recovery de senha via template customizado)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      // Momento determinístico de garantir a empresa do usuário (dono, convidado
      // ou "Minha Empresa" criada agora) — idempotente, seguro rodar sempre aqui.
      if (!emFluxoDeConvite) await supabase.rpc('obter_ou_criar_empresa_padrao')
      // Se for recovery, manda para atualizar-senha
      // Se for outro tipo (signup, etc), manda para o next ou dashboard
      const destino = type === 'recovery' ? '/atualizar-senha' : next
      return NextResponse.redirect(new URL(destino, requestUrl.origin))
    }
    // Erro no verifyOtp
    return NextResponse.redirect(new URL('/?erro=callback', requestUrl.origin))
  }

  // Fluxo 2 — code (OAuth ou magic link padrão)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      if (!emFluxoDeConvite) await supabase.rpc('obter_ou_criar_empresa_padrao')
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Fallback — algo deu errado
  return NextResponse.redirect(new URL('/?erro=callback', requestUrl.origin))
}