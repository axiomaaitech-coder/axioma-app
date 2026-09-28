import { NextRequest, NextResponse } from 'next/server'
import { executarColeta } from '@/lib/nexusColeta'

// GET /api/nexus/ingest/bcb — coleta completa do Nexus, 1x/dia pelo Vercel Cron
// (vercel.json). Protegida por CRON_SECRET: a Vercel manda
// "Authorization: Bearer <CRON_SECRET>" quando ela mesma dispara o cron.
// O trabalho em si mora em lib/nexusColeta.ts (também usado pela coleta da visita).
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurada no servidor — adicionar nas env vars da Vercel' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  return executarColeta({ comIA: true })
}
