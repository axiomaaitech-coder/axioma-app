import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // ✅ 1. Checkout concluído — ativa o plano pela primeira vez
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plano = session.metadata?.plano
        if (userId && plano) {
          await supabase.from('perfis').upsert({
            user_id: userId,
            plano: plano,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plano_ativo: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
        }
        break
      }

      // ✅ 2. Fatura paga — CRÍTICO: renova acesso mensalmente
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string
        if (customerId && subscriptionId) {
          await supabase.from('perfis')
            .update({
              plano_ativo: true,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // ✅ 3. Pagamento falhou — marca plano como inativo
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (customerId) {
          await supabase.from('perfis')
            .update({
              plano_ativo: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }

      // ✅ 4. Ação obrigatória — notifica falha de autenticação
      case 'invoice.payment_action_required': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('Autenticação necessária para cliente:', invoice.customer)
        break
      }

      // ✅ 5. Assinatura cancelada — remove acesso
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        if (customerId) {
          await supabase.from('perfis')
            .update({
              plano: 'starter',
              plano_ativo: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}