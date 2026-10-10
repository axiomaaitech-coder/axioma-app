import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Pagar a guia do DAS (MEI ou Simples/ME) com Pix pelo Axioma — Pluggy Payment Initiation.
//   POST { guia_id }      → cria o pedido de pagamento e devolve o link (a pessoa escolhe o
//                            banco e autoriza no app dele; o Axioma nunca vê senha/dinheiro)
//   GET  ?guia_id=...     → consulta a situação na Pluggy e grava na guia
// Desligado até PLUGGY_PAGAMENTOS_ATIVO=on (a Pluggy precisa liberar pagamentos pra conta).
// A BAIXA não acontece aqui: com o pagamento COMPLETED, a tela registra pelo motor de
// obrigações com a chave "pluggy:<id>" (repetir não duplica).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const API = 'https://api.pluggy.ai'

async function clienteSupabase() {
  const cookieStore = await cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() { /* só leitura */ } } })
}
async function chavePluggy(): Promise<string> {
  const r = await fetch(`${API}/auth`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId: process.env.PLUGGY_CLIENT_ID, clientSecret: process.env.PLUGGY_CLIENT_SECRET }) })
  if (!r.ok) throw new Error(`auth Pluggy HTTP ${r.status}`)
  return (await r.json()).apiKey as string
}
const ativo = () => process.env.PLUGGY_PAGAMENTOS_ATIVO === 'on'

export async function POST(request: NextRequest) {
  if (!ativo()) return NextResponse.json({ error: 'desligado' }, { status: 503 })
  const supabase = await clienteSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const body = await request.json().catch(() => null)
  const guiaId = String(body?.guia_id ?? '')
  if (!UUID.test(guiaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  // RLS: só acha a guia quem tem acesso à empresa dela.
  const { data: guia } = await supabase.from('guias_arrecadacao').select('id, empresa_id, valor_total, pix_copia_cola, status, competencias, pagamento_externo_id, pagamento_externo_url, pagamento_externo_status').eq('id', guiaId).maybeSingle()
  if (!guia) return NextResponse.json({ error: 'guia nao encontrada' }, { status: 404 })
  if (guia.status === 'paga') return NextResponse.json({ error: 'ja_paga' }, { status: 409 })
  if (!guia.pix_copia_cola) return NextResponse.json({ error: 'sem_pix' }, { status: 422 })
  // Pedido já criado e ainda em aberto: devolve o mesmo link (clique repetido não cria 2 pagamentos).
  if (guia.pagamento_externo_id && guia.pagamento_externo_url && !['ERROR', 'CANCELED', 'EXPIRED', 'REFUSED'].includes(String(guia.pagamento_externo_status))) {
    return NextResponse.json({ url: guia.pagamento_externo_url, reaproveitado: true })
  }
  try {
    const apiKey = await chavePluggy()
    const h = { 'Content-Type': 'application/json', 'X-API-KEY': apiKey }
    const sandbox = process.env.PLUGGY_PAGAMENTOS_SANDBOX === 'on'
    const rec = await fetch(`${API}/payments/recipients/pix-qr`, { method: 'POST', headers: h, body: JSON.stringify({ pixQrCode: guia.pix_copia_cola }) })
    if (!rec.ok) throw new Error(`recipient pix-qr HTTP ${rec.status}: ${(await rec.text()).slice(0, 200)}`)
    const recipientId = (await rec.json()).id as string
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://axioma-app.vercel.app'
    const volta = `${site}/mei/das?guia=${guia.id}&pix=`
    const req = await fetch(`${API}/payments/requests`, { method: 'POST', headers: h, body: JSON.stringify({
      amount: Number(guia.valor_total), description: `DAS ${(guia.competencias as string[]).join(', ')}`, recipientId, isSandbox: sandbox,
      callbackUrls: { success: `${volta}ok`, error: `${volta}erro`, pending: `${volta}pendente` },
    }) })
    if (!req.ok) throw new Error(`payment request HTTP ${req.status}: ${(await req.text()).slice(0, 200)}`)
    const pr = await req.json() as { id: string; paymentUrl: string; status: string }
    const { error } = await supabase.from('guias_arrecadacao').update({
      pagamento_externo_id: pr.id, pagamento_externo_url: pr.paymentUrl, pagamento_externo_status: pr.status, pagamento_externo_em: new Date().toISOString(),
    }).eq('id', guia.id)
    if (error) Sentry.captureException(new Error(`[pix] gravar pedido na guia: ${error.message}`))
    return NextResponse.json({ url: pr.paymentUrl })
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'pagamentos/pix', guiaId } })
    return NextResponse.json({ error: 'falhou' }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = await clienteSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const guiaId = request.nextUrl.searchParams.get('guia_id') ?? ''
  if (!UUID.test(guiaId)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  const { data: guia } = await supabase.from('guias_arrecadacao').select('id, pagamento_externo_id, pagamento_externo_status').eq('id', guiaId).maybeSingle()
  if (!guia) return NextResponse.json({ error: 'guia nao encontrada' }, { status: 404 })
  if (!guia.pagamento_externo_id || !ativo()) return NextResponse.json({ status: guia.pagamento_externo_status ?? null })
  try {
    const apiKey = await chavePluggy()
    const r = await fetch(`${API}/payments/requests/${encodeURIComponent(guia.pagamento_externo_id)}`, { headers: { 'X-API-KEY': apiKey } })
    if (!r.ok) throw new Error(`consulta payment request HTTP ${r.status}`)
    const status = String((await r.json()).status ?? '')
    if (status && status !== guia.pagamento_externo_status) await supabase.from('guias_arrecadacao').update({ pagamento_externo_status: status }).eq('id', guia.id)
    return NextResponse.json({ status })
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'pagamentos/pix GET', guiaId } })
    return NextResponse.json({ status: guia.pagamento_externo_status ?? null, aviso: 'consulta_falhou' })
  }
}
