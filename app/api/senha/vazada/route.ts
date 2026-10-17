import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

// POST /api/senha/vazada { prefixo } — ponte para a base pública Have I Been Pwned (gratuita, sem chave).
// Recebe só os 5 primeiros caracteres do SHA-1 da senha (k-anonimato): nem o Axioma nem a base veem a
// senha. Devolve a lista de finais de hash; quem compara é o navegador (lib/senhaSegura.ts).
// Sem login de propósito: o cadastro acontece antes de existir conta. "Add-Padding" esconde o tamanho da resposta.
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const corpo = await request.json().catch(() => null)
  const prefixo = typeof corpo?.prefixo === 'string' ? corpo.prefixo.toUpperCase() : ''
  if (!/^[0-9A-F]{5}$/.test(prefixo)) return NextResponse.json({ error: 'parametros invalidos' }, { status: 400 })
  try {
    const r = await fetch(`https://api.pwnedpasswords.com/range/${prefixo}`, { headers: { 'Add-Padding': 'true', 'User-Agent': 'Axioma-AI-Tech' }, signal: AbortSignal.timeout(5000) })
    if (!r.ok) throw new Error(`pwnedpasswords HTTP ${r.status}`)
    return new NextResponse(await r.text(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' } })
  } catch (err) {
    Sentry.captureException(err instanceof Error ? err : new Error(String(err)), { extra: { rota: 'senha/vazada' } })
    return NextResponse.json({ error: 'indisponivel' }, { status: 503 })
  }
}
