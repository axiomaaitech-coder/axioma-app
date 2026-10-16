// AXIOMA VOICE INTELLIGENCE — Fase 2: a voz só lê o que o MOTOR respondeu. O motor assina cada resposta
// (HMAC-SHA256 com segredo só do servidor, ligado à empresa); a rota /api/voz/falar recusa texto sem
// assinatura válida — ninguém usa a voz do Axioma para ler texto qualquer. Só servidor (node:crypto).
import { createHmac, timingSafeEqual } from 'node:crypto'

const segredo = () => process.env.VOZ_SEGREDO || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export function assinarResposta(empresaId: string, texto: string, chave = segredo()): string | null {
  if (!chave) return null
  return createHmac('sha256', chave).update(`${empresaId}|${texto}`).digest('base64url')
}

export function assinaturaValida(empresaId: string, texto: string, assinatura: string, chave = segredo()): boolean {
  const esperada = assinarResposta(empresaId, texto, chave)
  if (!esperada || typeof assinatura !== 'string' || assinatura.length !== esperada.length) return false
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(assinatura))
}
