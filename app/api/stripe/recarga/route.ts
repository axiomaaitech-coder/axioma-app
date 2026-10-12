import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { RECARGAS, ehTipoIA } from '@/lib/planos'

// POST /api/stripe/recarga { empresa_id, tipo } — recarga de IA (pagamento avulso, cartão).
// O saldo entra quando o Stripe confirma o pagamento (webhook → ia_creditar_recarga), nunca aqui.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axiomaai.com.br'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const corpo = await request.json().catch(() => null)
  const empresaId = String(corpo?.empresa_id ?? '')
  const tipo = corpo?.tipo
  if (!UUID.test(empresaId) || !ehTipoIA(tipo)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  // RLS: só acha a empresa quem faz parte dela.
  const { data: emp } = await supabase.from('empresas').select('id').eq('id', empresaId).maybeSingle()
  if (!emp) return NextResponse.json({ error: 'empresa nao encontrada' }, { status: 404 })

  try {
    const r = RECARGAS[tipo]
    const { data: perfil } = await supabase.from('perfis').select('stripe_customer_id').eq('user_id', user.id).maybeSingle()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ quantity: 1, price_data: { currency: 'brl', unit_amount: r.centavos, product_data: { name: `Axioma AI.Tech — Recarga de IA: ${r.nome.pt}` } } }],
      ...(perfil?.stripe_customer_id ? { customer: perfil.stripe_customer_id } : { customer_email: user.email }),
      locale: 'pt-BR',
      success_url: `${SITE_URL}/uso-ia?recarga=sucesso`,
      cancel_url: `${SITE_URL}/uso-ia?recarga=cancelada`,
      metadata: { recarga: '1', empresa_id: empresaId, tipo, quantidade: String(r.quantidade), userId: user.id },
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'stripe/recarga' } })
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}
