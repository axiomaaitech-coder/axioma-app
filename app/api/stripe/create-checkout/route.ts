import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const PLANOS = {
  starter: {
    name: 'Starter',
    price: 2900, // R$ 29,00 em centavos
    interval: 'month' as const,
    description: 'Gestão financeira essencial para MEI',
  },
  pro: {
    name: 'Pró',
    price: 9700, // R$ 97,00
    interval: 'month' as const,
    description: 'Acesso completo com IA Financeira',
  },
  business: {
    name: 'Business',
    price: 19700, // R$ 197,00
    interval: 'month' as const,
    description: 'Solução completa para empresas',
  },
}

export async function POST(request: NextRequest) {
  try {
    const { plano, email, userId } = await request.json()

    if (!plano || !PLANOS[plano as keyof typeof PLANOS]) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }

    const dadosPlano = PLANOS[plano as keyof typeof PLANOS]

    // Criar produto no Stripe
    const product = await stripe.products.create({
      name: `Axioma AI.Tech — Plano ${dadosPlano.name}`,
      description: dadosPlano.description,
    })

    // Criar preço
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: dadosPlano.price,
      currency: 'brl',
      recurring: { interval: dadosPlano.interval },
    })

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      mode: 'subscription',
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://axiomaai.com.br'}/dashboard?plano=${plano}&sucesso=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://axiomaai.com.br'}/planos?cancelado=true`,
      metadata: { userId, plano },
      locale: 'pt-BR',
      custom_text: {
        submit: { message: 'Ao assinar você concorda com nossos termos de serviço.' }
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Erro no checkout Stripe:', error)
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500 })
  }
}