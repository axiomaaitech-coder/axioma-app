import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook roda com service role (sem RLS) — mas uma gravação ainda pode
// falhar (erro real, ou 0 linhas por não achar o customer_id/user_id) e
// isso NUNCA aparece pra ninguém em tempo real (é assíncrono, sem tela
// esperando resposta) — sem isso, cliente pagou e o Axioma nunca liberou o
// acesso, e ninguém saberia até o cliente reclamar.
function logFalhaWebhook(tabela: string, operacao: string, motivo: string, contexto: Record<string, unknown>) {
  console.error(`[stripe webhook] Falha ao ${operacao} em ${tabela}: ${motivo}`, contexto)
  Sentry.captureException(new Error(`[stripe webhook] Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo, ...contexto } })
}

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
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'stripe/webhook', etapa: 'verificacao_assinatura' } })
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
          const { data, error } = await supabase.from('perfis').upsert({
            user_id: userId,
            plano: plano,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plano_ativo: true,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' }).select('user_id')
          if (error || !data || data.length === 0) {
            logFalhaWebhook('perfis', 'upsert (checkout.session.completed)', error?.message || '0 linhas afetadas', { userId, plano })
          }
        }
        break
      }

      // ✅ 2. Fatura paga — CRÍTICO: renova acesso mensalmente
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        // Na API 2026-05-27.dahlia, invoice.subscription foi movido pra invoice.parent.subscription_details.subscription
        const subscriptionId = invoice.parent?.subscription_details?.subscription
        if (customerId && subscriptionId) {
          const { data, error } = await supabase.from('perfis')
            .update({
              plano_ativo: true,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId).select('user_id')
          if (error || !data || data.length === 0) {
            logFalhaWebhook('perfis', 'update (invoice.paid)', error?.message || '0 linhas afetadas', { customerId, subscriptionId })
          }
        }
        break
      }

      // ✅ 3. Pagamento falhou — marca plano como inativo
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        if (customerId) {
          const { data, error } = await supabase.from('perfis')
            .update({
              plano_ativo: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId).select('user_id')
          if (error || !data || data.length === 0) {
            logFalhaWebhook('perfis', 'update (invoice.payment_failed)', error?.message || '0 linhas afetadas', { customerId })
          }
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
          const { data, error } = await supabase.from('perfis')
            .update({
              plano: 'starter',
              plano_ativo: false,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId).select('user_id')
          if (error || !data || data.length === 0) {
            logFalhaWebhook('perfis', 'update (customer.subscription.deleted)', error?.message || '0 linhas afetadas', { customerId })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook:', error)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'stripe/webhook' } })
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}