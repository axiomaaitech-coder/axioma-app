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

      // Busca user_id/empresa_id pelo item_id (conexão já criada no fluxo de connect)
      const { data: ofItem } = await supabase
        .from('open_finance')
        .select('user_id, empresa_id')
        .eq('item_id', item.id)
        .maybeSingle()

      if (!ofItem?.user_id) return NextResponse.json({ ok: true })

      let saldoItem = 0

      // Para cada conta busca transações
      for (const account of accounts || []) {
        saldoItem += Number(account.balance) || 0

        const txResponse = await fetch(
          `https://api.pluggy.ai/transactions?accountId=${account.id}&pageSize=100`,
          { headers: { 'X-API-KEY': apiKey } }
        )
        const { results: transactions } = await txResponse.json()

        const novas = (transactions || [])
          .filter((tx: any) => !!tx.id)
          .map((tx: any) => ({
            user_id: ofItem.user_id,
            empresa_id: ofItem.empresa_id,
            item_id: item.id,
            account_id: account.id,
            pluggy_transaction_id: String(tx.id),
            descricao: tx.description || tx.merchant?.name || '',
            valor: Math.abs(Number(tx.amount) || 0),
            tipo: tx.type === 'DEBIT' ? 'saida' : 'entrada',
            categoria: tx.category || 'Outros',
            data: tx.date ? String(tx.date).split('T')[0] : null,
          }))

        // UPSERT pela chave estável da Pluggy — nunca pelo "id" interno (que
        // é sempre novo a cada insert e nunca bateria com uma linha
        // existente). lancamento_id/lancamento_tabela ficam de fora do
        // payload, então nunca são resetados por aqui.
        if (novas.length > 0) {
          await supabase.from('of_transacoes').upsert(novas, { onConflict: 'pluggy_transaction_id' })
        }
      }

      await supabase.from('open_finance')
        .update({ saldo_atual: saldoItem, updated_at: new Date().toISOString() })
        .eq('item_id', item.id)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Pluggy Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
