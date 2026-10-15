// SISTEMA ANTI-FALHA DE LEITURA (Elias 2026-10-15: "primeiro o sistema se defende sozinho, o aviso
// é o último caso"). Banco acordando, rede oscilando ou tempo esgotado → tenta de novo sozinho, até
// 3 vezes (espera 0,4s e 1,2s). Erro que não muda tentando de novo (regra/permissão/dado inválido:
// 42xxx, 23xxx, 22xxx, PGRST1xx) volta na hora. Só LEITURA: gravação repetida poderia duplicar.
// Quem decide o último caso (cancelar/avisar) é lib/erroUiHelpers (exigirLeitura/registrarLeitura).
export type ErroBanco = { message: string; code?: string }

const ERRO_PERMANENTE = /^(42|23|22|PGRST1)/
const esperar = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

export async function comRetentativa<R extends { error: ErroBanco | null }>(executar: () => PromiseLike<R>, tentativas = 3, pausaMs = 400): Promise<R> {
  let r!: R
  for (let i = 0; i < tentativas; i++) {
    if (i > 0) await esperar(pausaMs * 3 ** (i - 1))
    try { r = await executar() }
    catch (e) { r = { data: null, error: { message: e instanceof Error ? e.message : String(e) } } as unknown as R } // rede caiu no meio
    if (!r.error || ERRO_PERMANENTE.test(String(r.error.code ?? ''))) return r
  }
  return r
}
