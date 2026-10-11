// Cliente do Supabase no navegador — ponto ÚNICO de criação (todas as telas importam daqui).
// Por quê: o login usa uma trava ("lock") e, por padrão, espera só 5s pela vez; depois "rouba"
// a vez de quem estava usando, e essa chamada morre com "Lock broken by another request with
// the 'steal' option" — a tela ficava presa em "Carregando..." para sempre. Com o banco
// acordando devagar (~4-5s), isso acontecia de verdade. Aqui a espera passa para 30s.
import { createBrowserClient as criarClienteSsr } from "@supabase/ssr";
import { navigatorLock } from "@supabase/supabase-js";

const ESPERA_TRAVA_MS = 30_000;

export function createBrowserClient(url: string, chave: string) {
  const temTrava = typeof globalThis !== "undefined" && !!globalThis.navigator?.locks;
  return criarClienteSsr<any, "public">(url, chave, temTrava ? {
    auth: { lock: <R,>(nome: string, _espera: number, fn: () => Promise<R>) => navigatorLock(nome, ESPERA_TRAVA_MS, fn) },
  } : undefined);
}
