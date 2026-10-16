import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { assinarResposta } from '@/lib/voz/assinatura'

// ═══════════════════════════════════════════════════════════════
// POST /api/voz/assinar { empresa_id, tela, ids } → { assinaturas: { [id]: assinatura } }
// Voz única do José (CEO, 2026-10-16): as respostas ANTIGAS da IA Financeira/Tributária (carregadas do
// histórico) não tinham assinatura e caíam na voz robótica do computador. Aqui o servidor confere, com o
// acesso da própria pessoa (RLS por empresa), que cada id é uma resposta da IA (role assistant) daquela
// empresa e daquele usuário, e assina o texto guardado — nunca um texto vindo do navegador.
// ═══════════════════════════════════════════════════════════════
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TABELAS: Record<string, string> = { 'ia-financeira': 'ia_financeira_historico', 'ia-tributaria': 'ia_tributaria_historico' }

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } },
  })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ assinaturas: {} }, { status: 401 })
  const body = await request.json().catch(() => null) as { empresa_id?: unknown; tela?: unknown; ids?: unknown } | null
  const empresaId = String(body?.empresa_id ?? '')
  const tabela = TABELAS[String(body?.tela ?? '')]
  const ids = (Array.isArray(body?.ids) ? body!.ids : []).map(String).filter((i) => i.length > 0 && i.length <= 64).slice(0, 100)
  if (!UUID.test(empresaId) || !tabela || !ids.length) return NextResponse.json({ assinaturas: {} }, { status: 400 })
  const { data, error } = await supabase.from(tabela).select('id, mensagem')
    .in('id', ids).eq('empresa_id', empresaId).eq('user_id', user.id).eq('role', 'assistant')
  if (error) return NextResponse.json({ assinaturas: {} }, { status: 503 })
  const assinaturas: Record<string, string> = {}
  for (const l of (data ?? []) as { id: unknown; mensagem: unknown }[]) {
    const a = typeof l.mensagem === 'string' && l.mensagem.length <= 20000 ? assinarResposta(empresaId, l.mensagem) : null
    if (a) assinaturas[String(l.id)] = a
  }
  return NextResponse.json({ assinaturas })
}
