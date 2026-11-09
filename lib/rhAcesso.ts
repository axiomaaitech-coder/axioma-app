// RH · leitura das liberações (rh_pode) que se defende sozinha (docs/ANTI-FALHA.md): tenta 3 vezes; se a conexão falhar
// em todas, devolve null — a tela diz "não foi possível conferir" em vez do falso "você não tem acesso".
import type { SupabaseClient } from '@supabase/supabase-js'

export async function lerPodeRh<A extends string>(supabase: SupabaseClient, empresaId: string, acoes: A[]): Promise<Record<A, boolean> | null> {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    if (tentativa) await new Promise((r) => setTimeout(r, 700 * tentativa))
    const r = await Promise.all(acoes.map((a) => supabase.rpc('rh_pode', { p_empresa: empresaId, p_acao: a })))
    if (r.every((x) => !x.error)) return Object.fromEntries(acoes.map((a, i) => [a, !!r[i].data])) as Record<A, boolean>
  }
  return null
}

export const TEXTO_FALHA_ACESSO = {
  pt: 'Não foi possível conferir o seu acesso ao RH agora (falha de conexão). Toque em Tentar de novo.',
  en: 'Could not check your HR access right now (connection failure). Tap Try again.',
  es: 'No se pudo verificar su acceso a RR. HH. ahora (falla de conexión). Toque Intentar de nuevo.',
}
