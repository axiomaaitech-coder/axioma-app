// Busca com nova tentativa pras fontes do Nexus: fonte oficial às vezes
// engasga (timeout, 429 de limite, 5xx) e volta segundos depois. Tenta até 3
// vezes com espera crescente; 4xx que não seja 429 é erro de verdade e não
// adianta repetir. Cada tentativa tem o próprio timeout.
export async function buscarComRetentativa(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
  esperasMs: number[] = [2000, 5000],
  buscar: typeof fetch = fetch,
): Promise<Response> {
  const { timeoutMs = 20000, ...resto } = init
  let ultimoErro: unknown
  for (let tentativa = 0; tentativa <= esperasMs.length; tentativa++) {
    if (tentativa > 0) await new Promise((r) => setTimeout(r, esperasMs[tentativa - 1]))
    try {
      const res = await buscar(url, { cache: 'no-store', ...resto, signal: AbortSignal.timeout(timeoutMs) })
      if (res.status !== 429 && res.status < 500) return res
      ultimoErro = new Error(`HTTP ${res.status}`)
      if (tentativa === esperasMs.length) return res
    } catch (err) {
      ultimoErro = err
    }
  }
  throw ultimoErro instanceof Error ? ultimoErro : new Error(String(ultimoErro))
}
