// SALDO DE IA POR EMPRESA (Elias 2026-10-11) — só servidor. Cada chamada de IA pedida
// pelo usuário gasta 1 do saldo (plano do mês → recarga) ANTES de chamar a IA; se a IA
// falhar, devolve. Regras e limites no banco (IA-SALDO-SQL.sql): ia_consumir/ia_devolver.
import type { SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'

export type TipoIA = 'openai' | 'anthropic' | 'nota'
type Lang = 'pt' | 'en' | 'es'

const MENSAGEM: Record<string, Record<Lang, string>> = {
  sem_saldo: {
    pt: 'O saldo de IA deste mês acabou. Para continuar agora, recarregue em Config → Uso da IA (o saldo do plano volta cheio no próximo mês).',
    en: 'This month\'s AI balance has run out. To keep going now, top up in Settings → AI Usage (your plan balance refills next month).',
    es: 'El saldo de IA de este mes se agotó. Para seguir ahora, recarga en Config → Uso de la IA (el saldo del plan vuelve completo el próximo mes).',
  },
  teste_ia_encerrada: {
    pt: 'A IA do período de teste (3 primeiros dias) terminou. O Axioma segue liberado até o fim do teste; a IA volta ao assinar o plano.',
    en: 'The trial AI (first 3 days) has ended. Axioma stays open until the trial ends; AI comes back when you subscribe.',
    es: 'La IA del período de prueba (primeros 3 días) terminó. Axioma sigue abierto hasta el fin de la prueba; la IA vuelve al suscribirte.',
  },
}

export const mensagemSemSaldo = (motivo: string, lang: Lang) => (MENSAGEM[motivo] ?? MENSAGEM.sem_saldo)[lang]

// ok:true → seguir com a IA (guardar o id pra devolver se falhar). ok:false → não chamar a IA.
export async function consumirIA(supabase: SupabaseClient, empresaId: string, tipo: TipoIA): Promise<{ ok: true; id: string } | { ok: false; motivo: string }> {
  const { data, error } = await supabase.rpc('ia_consumir', { p_empresa: empresaId, p_tipo: tipo })
  if (error) {
    // Falha da trava não pode virar IA de graça calada nem travar o cliente sem motivo: registra e recusa.
    Sentry.captureException(new Error(`[iaSaldo] ia_consumir falhou: ${error.message}`), { extra: { empresaId, tipo } })
    return { ok: false, motivo: 'sem_saldo' }
  }
  return data?.ok ? { ok: true, id: String(data.id) } : { ok: false, motivo: String(data?.motivo ?? 'sem_saldo') }
}

export async function devolverIA(supabase: SupabaseClient, consumoId: string): Promise<void> {
  const { error } = await supabase.rpc('ia_devolver', { p_consumo: consumoId })
  if (error) Sentry.captureException(new Error(`[iaSaldo] ia_devolver falhou: ${error.message}`), { extra: { consumoId } })
}
