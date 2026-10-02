// O Supabase devolve no máximo 1000 linhas por pedido: acima disso a tela
// mostraria totais errados sem aviso. Lê em lotes até vir tudo (regra 5 de
// escala, P5 2026-10-02). `montar` recria a consulta a cada lote — precisa ter
// .order() estável pra nenhuma linha pular ou repetir entre lotes.
const LOTE = 1000
const TETO = 50000

type Erro = { message: string } | null

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- linhas sem tipo, igual a supabase.from() sem genérico
export async function lerTodas<T = any>(
  montar: () => { range: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: Erro }> },
): Promise<{ data: T[]; error: Erro }> {
  const tudo: T[] = []
  for (let de = 0; de < TETO; de += LOTE) {
    const { data, error } = await montar().range(de, de + LOTE - 1)
    if (error) return { data: tudo, error }
    tudo.push(...(data || []))
    if (!data || data.length < LOTE) break
  }
  return { data: tudo, error: null }
}
