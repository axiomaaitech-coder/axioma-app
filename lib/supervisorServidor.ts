// Conferências de SERVIDOR compartilhadas por quem exige um supervisor da empresa
// (convite da Equipe, autorização de exclusão). Supervisor = dono/CEO, Sócio ou Admin
// com acesso valendo. Nunca importar no navegador (usa a chave de serviço).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ponytail: limite de tentativas de senha em memória (por instância); vira tabela se aparecer abuso.
const falhas = new Map<string, { n: number; ate: number }>()
export function bloqueado(chave: string) {
  const f = falhas.get(chave)
  return !!f && f.ate > Date.now() && f.n >= 5
}
export function registrarFalha(chave: string) {
  const f = falhas.get(chave)
  const vivo = f && f.ate > Date.now()
  falhas.set(chave, { n: vivo ? f!.n + 1 : 1, ate: vivo ? f!.ate : Date.now() + 15 * 60000 })
}

export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
}

// Confere e-mail + senha sem mexer na sessão de ninguém.
export async function conferirSenha(email: string, senha: string): Promise<string | null> {
  const c = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { data, error } = await c.auth.signInWithPassword({ email, password: senha })
  return error ? null : data.user?.id ?? null
}

export async function vinculo(db: SupabaseClient, empresaId: string, userId: string) {
  const { data } = await db.from('empresa_usuarios').select('papel, convite_id, acesso_expira_em, suspenso_em')
    .eq('empresa_id', empresaId).eq('user_id', userId).maybeSingle()
  // Suspenso (hierarquia da Equipe) ou prazo vencido = sem acesso
  if (!data || data.suspenso_em || (data.acesso_expira_em && new Date(data.acesso_expira_em) < new Date())) return null
  return data
}

// CEO, Sócio ou Admin desta empresa (o supervisor). Devolve o papel real, lido do banco.
export async function papelLiberador(db: SupabaseClient, empresaId: string, userId: string): Promise<'ceo' | 'socio' | 'admin' | null> {
  const { data: emp } = await db.from('empresas').select('id').eq('id', empresaId).eq('user_id', userId).maybeSingle()
  if (emp) return 'ceo'
  const v = await vinculo(db, empresaId, userId)
  if (!v) return null
  if (v.papel === 'dono') return 'ceo'
  if (v.convite_id) {
    const { data: cv } = await db.from('empresa_equipe').select('relacao').eq('id', v.convite_id).maybeSingle()
    if (cv?.relacao === 'socio' || cv?.relacao === 'ceo') return cv.relacao
  }
  return v.papel === 'admin' ? 'admin' : null
}
export const podeLiberar = async (db: SupabaseClient, empresaId: string, userId: string) => !!(await papelLiberador(db, empresaId, userId))

export async function usuarioLogado() {
  const cookieStore = await cookies()
  const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } })
  const { data: { user } } = await s.auth.getUser()
  return user
}
