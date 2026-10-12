import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { PLANOS, TESTE, INAUGURACAO, ehPlano } from '@/lib/planos'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})


// Cupom de inauguração criado no Stripe na 1ª vez (30% por 3 meses, 100 usos). Esgotado = segue sem desconto.
async function cupomInauguracao(): Promise<string | null> {
  try {
    const c = await stripe.coupons.retrieve(INAUGURACAO.cupom).catch(async () => stripe.coupons.create({
      id: INAUGURACAO.cupom, percent_off: INAUGURACAO.porcento, duration: 'repeating', duration_in_months: INAUGURACAO.meses,
      max_redemptions: INAUGURACAO.vagas, name: `Inauguração ${INAUGURACAO.porcento}%`,
    }))
    return c.valid ? c.id : null
  } catch (e) {
    Sentry.captureException(e instanceof Error ? e : new Error(String(e)), { extra: { rota: 'stripe/create-checkout', etapa: 'cupom' } })
    return null
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axiomaai.com.br'

export async function POST(request: NextRequest) {
  // Identidade SEMPRE da sessão, nunca do corpo (auditoria 2026-09-28): antes o
  // userId vinha do navegador — alguém podia ligar a própria assinatura à conta de
  // outra pessoa e, ao cancelar, desativar o plano dela.
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const userId = user.id
  const email = user.email
  try {
    const { plano, periodo } = await request.json()
    if (!ehPlano(plano)) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    const anual = periodo === 'anual'
    const dadosPlano = PLANOS[plano]

    // Teste grátis só na 1ª assinatura (quem já assinou antes não ganha outro teste).
    const { data: perfil } = await supabase.from('perfis').select('stripe_customer_id').eq('user_id', userId).maybeSingle()
    const primeiraVez = !perfil?.stripe_customer_id
    const cupom = await cupomInauguracao()

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      // Preço definido na hora (não precisa de Price IDs fixos no painel). Anual = 10 meses (2 grátis).
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'brl',
          unit_amount: anual ? dadosPlano.anualPorMesCentavos * 12 : dadosPlano.mensalCentavos,
          recurring: { interval: anual ? 'year' : 'month' },
          product_data: { name: `Axioma AI.Tech — Plano ${dadosPlano.nome.pt}${anual ? ' (anual)' : ''}` },
        },
      }],
      // Teste de 7 dias COM cartão obrigatório
      subscription_data: { ...(primeiraVez ? { trial_period_days: TESTE.dias } : {}), metadata: { userId, plano, periodo: anual ? 'anual' : 'mensal' } },
      payment_method_collection: 'always',
      ...(cupom ? { discounts: [{ coupon: cupom }] } : {}),
      ...(perfil?.stripe_customer_id ? { customer: perfil.stripe_customer_id } : { customer_email: email }),
      locale: 'pt-BR',
      success_url: `${SITE_URL}/dashboard?assinatura=sucesso&plano=${plano}`,
      cancel_url: `${SITE_URL}/cadastro?checkout=cancelado`,
      metadata: { userId, plano },
      custom_text: {
        submit: {
          message: primeiraVez
            ? `Você não será cobrado durante os ${TESTE.dias} dias de teste (IA liberada nos ${TESTE.diasIA} primeiros dias). Cancele quando quiser. Depois do teste, a assinatura é renovada automaticamente.`
            : 'A assinatura é renovada automaticamente. Cancele quando quiser.',
        },
      },
    }

    const session = await stripe.checkout.sessions.create(params)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro no checkout Stripe:', error)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'stripe/create-checkout' } })
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}