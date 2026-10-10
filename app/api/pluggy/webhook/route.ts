import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'
import * as Sentry from '@sentry/nextjs'

// ═══════════════════════════════════════════════════════════════
// Webhook da Pluggy (Open Finance). Grava com service_role — por isso NUNCA
// confia no corpo recebido (qualquer um na internet consegue chamar esta URL):
//  1. senha no endereço (?token=PLUGGY_WEBHOOK_SECRET), exigida quando configurada
//     (cadastrar na Pluggy o webhook já com ?token=... — etapa de produção);
//  2. só age sobre conexões que JÁ existem no Axioma (criadas pela tela do
//     usuário, com user_id/empresa_id) — nunca cria conexão a partir do aviso;
//  3. status e transações vêm da API da Pluggy com a nossa chave, não do corpo.
// Auditoria 2026-09-28: antes aceitava qualquer POST e fazia upsert do que chegasse.
// ═══════════════════════════════════════════════════════════════
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Webhook assíncrono, sem tela esperando resposta — uma falha de gravação
// aqui nunca aparece pra ninguém em tempo real sem isso (o extrato do banco
// fica desatualizado silenciosamente).
function logFalhaWebhook(tabela: string, operacao: string, motivo: string, contexto: Record<string, unknown>) {
  console.error(`[pluggy webhook] Falha ao ${operacao} em ${tabela}: ${motivo}`, contexto)
  Sentry.captureException(new Error(`[pluggy webhook] Falha ao ${operacao} em ${tabela}: ${motivo}`), { extra: { tabela, operacao, motivo, ...contexto } })
}

function tokenValido(request: NextRequest): boolean {
  const segredo = process.env.PLUGGY_WEBHOOK_SECRET
  if (!segredo) {
    console.warn('[pluggy webhook] PLUGGY_WEBHOOK_SECRET não configurado — aceitando só por existir a conexão (configurar antes da produção)')
    return true
  }
  const recebido = Buffer.from(request.nextUrl.searchParams.get('token') ?? '')
  const esperado = Buffer.from(segredo)
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado)
}

type Transacao = { id?: string | number; description?: string; merchant?: { name?: string }; amount?: number; type?: string; category?: string; date?: string }

export async function POST(request: NextRequest) {
  if (!tokenValido(request)) return NextResponse.json({ error: 'nao autorizado' }, { status: 401 })
  try {
    const body = await request.json().catch(() => null)
    const event: string = typeof body?.event === 'string' ? body.event : ''
    const itemId: string = typeof body?.item?.id === 'string' ? body.item.id : typeof body?.itemId === 'string' ? body.itemId : ''
    // Pagamento Pix de guia do DAS (pagamentos/pix): nunca confia no corpo — consulta a
    // situação na Pluggy com a nossa chave e só grava na guia que JÁ tem esse pedido.
    if (event.startsWith('payment_')) {
      const pedidoId = String(body?.paymentRequestId ?? body?.data?.paymentRequestId ?? body?.paymentRequest?.id ?? '')
      if (!/^[0-9a-f-]{36}$/i.test(pedidoId)) return NextResponse.json({ ok: true })
      const { data: guia } = await supabase.from('guias_arrecadacao').select('id').eq('pagamento_externo_id', pedidoId).maybeSingle()
      if (!guia) return NextResponse.json({ ok: true })
      const auth = await fetch('https://api.pluggy.ai/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: process.env.PLUGGY_CLIENT_ID, clientSecret: process.env.PLUGGY_CLIENT_SECRET }) })
      if (!auth.ok) throw new Error(`auth Pluggy HTTP ${auth.status}`)
      const { apiKey: chave } = await auth.json()
      const pr = await fetch(`https://api.pluggy.ai/payments/requests/${pedidoId}`, { headers: { 'X-API-KEY': chave } })
      if (!pr.ok) throw new Error(`consulta payment request HTTP ${pr.status}`)
      const status = String((await pr.json()).status ?? '')
      const { error: eG } = await supabase.from('guias_arrecadacao').update({ pagamento_externo_status: status }).eq('id', guia.id)
      if (eG) logFalhaWebhook('guias_arrecadacao', 'update status pagamento', eG.message, { pedidoId })
      return NextResponse.json({ ok: true })
    }
    if (!UUID.test(itemId) || !event.startsWith('item/')) return NextResponse.json({ ok: true })

    // Só conexões que o próprio Axioma criou (tela Open Finance, com dono).
    const { data: conexao } = await supabase.from('open_finance').select('user_id, empresa_id').eq('item_id', itemId).maybeSingle()
    if (!conexao?.user_id) return NextResponse.json({ ok: true })

    const authResponse = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: process.env.PLUGGY_CLIENT_ID, clientSecret: process.env.PLUGGY_CLIENT_SECRET }),
    })
    if (!authResponse.ok) throw new Error(`auth Pluggy HTTP ${authResponse.status}`)
    const { apiKey } = await authResponse.json()

    // Status real da conexão, direto da Pluggy (o corpo do aviso não é confiável).
    const itemResp = await fetch(`https://api.pluggy.ai/items/${itemId}`, { headers: { 'X-API-KEY': apiKey } })
    if (!itemResp.ok) return NextResponse.json({ ok: true }) // item não é nosso/não existe na Pluggy
    const item = await itemResp.json()

    const { data: dataStatus, error: erroStatus } = await supabase.from('open_finance')
      .update({ conector_nome: item.connector?.name || '', conector_tipo: item.connector?.type || '', status: item.status || 'UPDATED', updated_at: new Date().toISOString() })
      .eq('item_id', itemId).select('item_id')
    if (erroStatus || !dataStatus?.length) logFalhaWebhook('open_finance', `update status (${event})`, erroStatus?.message || '0 linhas afetadas', { itemId })

    if (item.status !== 'UPDATED') return NextResponse.json({ ok: true })

    const accountsResponse = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, { headers: { 'X-API-KEY': apiKey } })
    const { results: accounts } = await accountsResponse.json()
    let saldoItem = 0

    for (const account of accounts || []) {
      saldoItem += Number(account.balance) || 0
      const txResponse = await fetch(`https://api.pluggy.ai/transactions?accountId=${account.id}&pageSize=100`, { headers: { 'X-API-KEY': apiKey } })
      const { results: transactions } = await txResponse.json()
      const novas = ((transactions || []) as Transacao[])
        .filter((tx) => !!tx.id)
        .map((tx) => ({
          user_id: conexao.user_id,
          empresa_id: conexao.empresa_id,
          item_id: itemId,
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
        const { data, error } = await supabase.from('of_transacoes').upsert(novas, { onConflict: 'pluggy_transaction_id' }).select('id')
        if (error || !data?.length) logFalhaWebhook('of_transacoes', 'upsert', error?.message || '0 linhas afetadas', { itemId, accountId: account.id, totalTransacoes: novas.length })
      }
    }

    const { data: dataSaldo, error: erroSaldo } = await supabase.from('open_finance')
      .update({ saldo_atual: saldoItem, updated_at: new Date().toISOString() })
      .eq('item_id', itemId).select('item_id')
    if (erroSaldo || !dataSaldo?.length) logFalhaWebhook('open_finance', 'update saldo_atual', erroSaldo?.message || '0 linhas afetadas', { itemId })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Pluggy Webhook error:', error)
    Sentry.captureException(error instanceof Error ? error : new Error(String(error)), { extra: { rota: 'pluggy/webhook' } })
    return NextResponse.json({ error: 'erro interno' }, { status: 500 }) // nunca devolve a mensagem interna
  }
}
