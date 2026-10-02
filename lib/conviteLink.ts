import { createClient } from '@supabase/supabase-js'

// Dados públicos do convite pro cartão do link (WhatsApp/Telegram/e-mail).
export async function lerConvite(token: string): Promise<{ empresa: string; remetente: string } | null> {
  try {
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
    const { data } = await db.rpc('obter_convite_por_token', { p_token: token })
    const c = Array.isArray(data) ? data[0] : data
    if (!c) return null
    return { empresa: c.empresa_nome || 'Axioma', remetente: String(c.remetente_nome || '').replace(/\s*\(.*$/, '') }
  } catch {
    return null
  }
}
