import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, item } = body

    console.log('Pluggy Webhook:', event, item?.id)

    if (!item?.id) {
      return NextResponse.json({ ok: true })
    }

    // Atualiza status da conexão bancária
    if (event === 'item/updated' || event === 'item/created') {
      await supabase
        .from('open_finance')
        .upsert({
          item_id: item.id,
          conector_nome: item.connector?.name || '',
          conector_tipo: item.connector?.type || '',
          status: item.status || 'UPDATED',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'item_id' })
    }

    // Busca e salva transações quando item atualizado
    if (event === 'item/updated' && item.status === 'UPDATED') {
      // Busca API Key
      const authResponse = await fetch('https://api.pluggy.ai/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: process.env.PLUGGY_CLIENT_ID,
          clientSecret: process.env.PLUGGY_CLIENT_SECRET,
        }),
      })
      const { apiKey } = await authResponse.json()

      // Busca contas do item
      const accountsResponse = await fetch(
        `https://api.pluggy.ai/accounts?itemId=${item.id}`,
        { headers: { 'X-API-KEY': apiKey } }
      )
      const { results: accounts } = await accountsResponse.json()

      // Para cada conta busca transações
      for (const account of accounts || []) {
        const txResponse = await fetch(
          `https://api.pluggy.ai/transactions?accountId=${account.id}&pageSize=100`,
          { headers: { 'X-API-KEY': apiKey } }
        )
        const { results: transactions } = await txResponse.json()

        // Busca user_id pelo item_id
        const { data: ofItem } = await supabase
          .from('open_finance')
          .select('user_id')
          .eq('item_id', item.id)
          .maybeSingle()

        if (!ofItem?.user_id) continue

        // Salva transações
        for (const tx of transactions || []) {
          await supabase.from('of_transacoes').upsert({
            user_id: ofItem.user_id,
            item_id: item.id,
            account_id: account.id,
            descricao: tx.description || tx.merchant?.name || '',
            valor: Math.abs(tx.amount),
            tipo: tx.type === 'DEBIT' ? 'saida' : 'entrada',
            categoria: tx.category || 'Outros',
            data: tx.date?.split('T')[0],
          }, { onConflict: 'id' })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Pluggy Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}