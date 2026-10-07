import { NextRequest, NextResponse } from 'next/server'

// GET /api/hora — relógio oficial do Axioma (lib/datas.ts). Devolve a hora do servidor
// (sincronizada por NTP na Vercel) e o fuso/país da conexão (cabeçalhos de geolocalização
// por IP que a Vercel já manda, sem pedir nada à pessoa). Público e sem dado pessoal:
// a tela de login também usa. Nunca guardado em cache.
export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const fuso = request.headers.get('x-vercel-ip-timezone')
  const pais = request.headers.get('x-vercel-ip-country')
  return NextResponse.json(
    { agora: Date.now(), fuso: fuso || null, pais: pais || null },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  )
}
