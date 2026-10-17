// Cliente do Supabase no navegador — ponto ÚNICO de criação (todas as telas importam daqui).
// Trava do login POR ABA (processLock), não entre abas (navigatorLock): com a trava entre abas, uma aba do
// Axioma travada (ex.: Nexus pesado) prendia o login de TODAS as outras abas — telas paradas em
// "Carregando…", dados zerados e nada salvo ("Lock broken by another request with the 'steal' option").
// Agora cada aba só espera a si mesma. A espera continua longa (30s) para o banco que acorda devagar (~4-5s).
import { createBrowserClient as criarClienteSsr } from "@supabase/ssr";
import { processLock } from "@supabase/supabase-js";

const ESPERA_TRAVA_MS = 30_000;

export function createBrowserClient(url: string, chave: string) {
  return criarClienteSsr<any, "public">(url, chave, {
    auth: { lock: <R,>(nome: string, _espera: number, fn: () => Promise<R>) => processLock(nome, ESPERA_TRAVA_MS, fn) },
  });
}
