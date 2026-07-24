import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Puxa contas + transações dos bancos conectados e salva no Supabase.
// Não depende do webhook — funciona na hora que o cliente conecta ou clica em "Sincronizar".
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Empresa ativa do usuário (dono ou convidado) — mesma ordem de obterEmpresaAtiva() em lib/empresaHelpers.ts.
    let empresaId: string | null = null
    const { data: propria } = await supabase.from('empresas').select('id').eq('user_id', user.id).eq('ativo', true).order('created_at', { ascending: true }).limit(1).maybeSingle()
    if (propria?.id) empresaId = propria.id
    else {
      const { data: vinculo } = await supabase.from('empresa_usuarios').select('empresa_id').eq('user_id', user.id).limit(1).maybeSingle()
      empresaId = vinculo?.empresa_id || null
    }

    // itemId opcional no body — se vier, sincroniza só esse banco
    let itemIdFiltro: string | null = null
    try {
      const body = await request.json()
      if (body?.itemId) itemIdFiltro = String(body.itemId)
    } catch { /* sem body */ }

    // Busca os bancos conectados DESTE usuário
    let q = supabase.from('open_finance').select('item_id')
    if (itemIdFiltro) q = q.eq('item_id', itemIdFiltro)
    const { data: itens } = await q
    if (!itens || itens.length === 0) {
      return NextResponse.json({ total: 0, message: 'Nenhum banco conectado' })
    }

    // Autentica no Pluggy (uma vez)
    const authResponse = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.PLUGGY_CLIENT_ID,
        clientSecret: process.env.PLUGGY_CLIENT_SECRET,
      }),
    })
    if (!authResponse.ok) throw new Error('Erro ao autenticar com Pluggy')
    const { apiKey } = await authResponse.json()

    let totalSalvas = 0

    for (const it of itens) {
      const itemId = it.item_id
      if (!itemId) continue

      // Contas do item
      const accountsResp = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
        headers: { 'X-API-KEY': apiKey },
      })
      const accountsJson = await accountsResp.json()
      const accounts = accountsJson?.results || []

      const novas: any[] = []

      for (const account of accounts) {
        // Transações da conta (até 500)
        const txResp = await fetch(
          `https://api.pluggy.ai/transactions?accountId=${account.id}&pageSize=500`,
          { headers: { 'X-API-KEY': apiKey } }
        )
        const txJson = await txResp.json()
        const transactions = txJson?.results || []

        for (const tx of transactions) {
          novas.push({
            user_id: user.id,
            empresa_id: empresaId,
            item_id: itemId,
            account_id: account.id,
            descricao: tx.description || tx.merchant?.name || 'Transação',
            valor: Math.abs(Number(tx.amount) || 0),
            tipo: tx.type === 'DEBIT' ? 'saida' : 'entrada',
            categoria: tx.category || 'Outros',
            data: tx.date ? String(tx.date).split('T')[0] : null,
          })
        }
      }

      // Substitui as transações desse banco (evita duplicar a cada sincronização)
      await supabase.from('of_transacoes').delete().eq('item_id', itemId)
      if (novas.length > 0) {
        const { error: insErr } = await supabase.from('of_transacoes').insert(novas)
        if (!insErr) totalSalvas += novas.length
      }

      // Marca a conexão como ativa
      await supabase.from('open_finance')
        .update({ status: 'UPDATED', updated_at: new Date().toISOString() })
        .eq('item_id', itemId)
    }

    return NextResponse.json({ total: totalSalvas })
  } catch (error: any) {
    console.error('Pluggy sync error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}