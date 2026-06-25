import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

// ============================================================
// PLANOS AXIOMA AI.TECH — preços em centavos (R$)
// ============================================================
const PLANOS = {
  starter: {
    name: 'Starter',
    price: 4700, // R$ 47,00
    description: 'Para MEI e autônomos — 23 módulos completos',
  },
  pro: {
    name: 'Pro',
    price: 9700, // R$ 97,00
    description: 'Para profissionais — IA Financeira Premium',
  },
  business: {
    name: 'Business',
    price: 19700, // R$ 197,00
    description: 'Para empresas em crescimento — IA Tributária Premium',
  },
  enterprise: {
    name: 'Enterprise',
    price: 29700, // R$ 297,00
    description: 'Solução sem limites — ClowdBot autônomo',
  },
}

// Cupom de lançamento (40% nos 3 primeiros meses) — aplicado automaticamente
const CUPOM_LANCAMENTO = 'LANCAMENTO40'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://axiomaai.com.br'

export async function POST(request: NextRequest) {
  try {
    const { plano, email, userId } = await request.json()

    if (!plano || !PLANOS[plano as keyof typeof PLANOS]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const dadosPlano = PLANOS[plano as keyof typeof PLANOS]

    // Monta a sessão de checkout
    const params: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      // Preço definido na hora (não precisa de Price IDs fixos no painel)
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'brl',
            unit_amount: dadosPlano.price,
            recurring: { interval: 'month' },
            product_data: {
              name: `Axioma AI.Tech — Plano ${dadosPlano.name}`,
              description: dadosPlano.description,
            },
          },
        },
      ],
      // Trial de 14 dias COM cartão obrigatório
      subscription_data: {
        trial_period_days: 14,
        metadata: { userId: userId || '', plano },
      },
      payment_method_collection: 'always',
      // Cupom de lançamento aplicado automaticamente (cliente não digita nada)
      discounts: [{ coupon: CUPOM_LANCAMENTO }],
      customer_email: email,
      locale: 'pt-BR',
      success_url: `${SITE_URL}/dashboard?assinatura=sucesso&plano=${plano}`,
      cancel_url: `${SITE_URL}/cadastro?checkout=cancelado`,
      metadata: { userId: userId || '', plano },
      custom_text: {
        submit: {
          message: 'Você não será cobrado durante os 14 dias de teste. Cancele quando quiser. Após o período de teste, a assinatura é renovada automaticamente.',
        },
      },
    }

    const session = await stripe.checkout.sessions.create(params)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro no checkout Stripe:', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}