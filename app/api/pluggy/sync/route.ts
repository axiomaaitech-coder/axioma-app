import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import * as Sentry from '@sentry/nextjs'

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
    if (!empresaId) return NextResponse.json({ error: 'Nenhuma empresa ativa' }, { status: 400 })

    // itemId opcional no body — se vier, sincroniza só esse banco
    let itemIdFiltro: string | null = null
    try {
      const body = await request.json()
      if (body?.itemId) itemIdFiltro = String(body.itemId)
    } catch { /* sem body */ }

    // Busca os bancos conectados DESTA empresa (nunca de outra empresa do
    // mesmo usuário, num cenário multi-empresa/multi-tenant).
    let q = supabase.from('open_finance').select('item_id').eq('empresa_id', empresaId)
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
    const erros: string[] = []

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
      let saldoItem = 0

      for (const account of accounts) {
        saldoItem += Number(account.balance) || 0

        // Transações da conta (até 500)
        const txResp = await fetch(
          `https://api.pluggy.ai/transactions?accountId=${account.id}&pageSize=500`,
          { headers: { 'X-API-KEY': apiKey } }
        )
        const txJson = await txResp.json()
        const transactions = txJson?.results || []

        for (const tx of transactions) {
          // Chave estável: id da própria transação na Pluggy. Sem ela não dá
          // pra fazer UPSERT de verdade (é o que evita duplicidade e evita
          // perder o vínculo de conciliação a cada nova sincronização).
          if (!tx.id) continue
          novas.push({
            user_id: user.id,
            empresa_id: empresaId,
            item_id: itemId,
            account_id: account.id,
            pluggy_transaction_id: String(tx.id),
            descricao: tx.description || tx.merchant?.name || 'Transação',
            valor: Math.abs(Number(tx.amount) || 0),
            tipo: tx.type === 'DEBIT' ? 'saida' : 'entrada',
            categoria: tx.category || 'Outros',
            data: tx.date ? String(tx.date).split('T')[0] : null,
          })
        }
      }

      // UPSERT pela chave estável — nunca duplica a mesma transação e NUNCA
      // sobrescreve lancamento_id/lancamento_tabela (não fazem parte deste
      // payload, então o Supabase preserva o valor já gravado na linha
      // existente em vez de resetar).
      if (novas.length > 0) {
        const { data: salvas, error: upsertErr } = await supabase
          .from('of_transacoes')
          .upsert(novas, { onConflict: 'pluggy_transaction_id' })
          .select('id')
        if (upsertErr || !salvas || salvas.length < novas.length) {
          const motivo = upsertErr?.message || `${novas.length - (salvas?.length || 0)} de ${novas.length} transação(ões) não foram gravadas (RLS?)`
          Sentry.captureException(new Error(`Falha ao upsert em of_transacoes: ${motivo}`), { extra: { tabela: 'of_transacoes', operacao: 'upsert', itemId, motivo } })
          erros.push(`${itemId}: ${motivo}`)
          totalSalvas += salvas?.length || 0
        } else {
          totalSalvas += novas.length
        }
      }

      // Marca a conexão como ativa e atualiza o saldo (soma das contas do item)
      const { error: erroStatus } = await supabase.from('open_finance')
        .update({ status: 'UPDATED', saldo_atual: saldoItem, updated_at: new Date().toISOString() })
        .eq('item_id', itemId)
        .eq('empresa_id', empresaId)
      if (erroStatus) {
        Sentry.captureException(new Error(`Falha ao update em open_finance: ${erroStatus.message}`), { extra: { tabela: 'open_finance', operacao: 'update', itemId } })
      }
    }

    return NextResponse.json({ total: totalSalvas, erros: erros.length > 0 ? erros : undefined })
  } catch (error: any) {
    console.error('Pluggy sync error:', error)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'pluggy/sync' } })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
