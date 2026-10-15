// Clientes externos criados no 1º USO, não ao carregar o arquivo. Antes, rota que criava o cliente
// no topo do arquivo (Supabase com chave de serviço, Stripe) derrubava a MONTAGEM do site inteiro
// (next build: "supabaseKey is required" / "Neither apiKey nor config.authenticator provided") se a
// chave faltasse no ambiente. Agora, sem a chave, só a própria rota falha ao ser chamada — o resto
// do Axioma é publicado normalmente. Só servidor.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function sobDemanda<T extends object>(criar: () => T): T {
  let real: T | null = null
  return new Proxy({} as T, {
    get(_alvo, prop) {
      const c = (real ??= criar())
      const v = Reflect.get(c, prop, c)
      return typeof v === 'function' ? v.bind(c) : v
    },
  })
}

// Supabase com a chave de SERVIÇO (ignora RLS).
export const clienteServicoSobDemanda = (): SupabaseClient =>
  sobDemanda(() => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }))
