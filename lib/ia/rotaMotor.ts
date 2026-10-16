// ═══════════════════════════════════════════════════════════════
// Regra da porta do motor (POST /api/ia/motor) SEM Next e SEM banco: tudo chega por `deps`, para ser
// testado em scripts/check-voz-faseD.mts. A rota só liga isto ao Supabase (sessão do usuário + RLS).
//
// Ordem (nada é cobrado antes de saber que a pessoa pode perguntar sobre ESTA empresa):
//   login → parâmetros → acesso à empresa (RLS; alheia = 404, sem cobrar) → papel (operador = 403)
//   → cobra 1 do saldo (atômico) → motor → sem resposta ou erro = DEVOLVE (1 vez só).
// Falha ao ler acesso/papel = 503 (antes, a leitura que falhava virava "dono" e passava).
// ═══════════════════════════════════════════════════════════════
import type { Idioma, RespostaMotor } from './motor'

export type DepsRotaMotor = {
  // true = tem acesso; null = empresa alheia/inexistente (RLS); lança = falha técnica de leitura
  acesso: (empresaId: string) => Promise<true | null>
  // papel na empresa (null = dono sem linha em empresa_usuarios); lança = falha de leitura
  papel: (empresaId: string) => Promise<string | null>
  consumir: (empresaId: string) => Promise<{ ok: true; id: string } | { ok: false; motivo: string }>
  devolver: (consumoId: string) => Promise<void>
  perguntar: () => Promise<RespostaMotor>
}
export type ResultadoRotaMotor =
  | { status: 200; r: RespostaMotor; cobrado: boolean }
  | { status: 400 | 401 | 403 | 404 | 402 | 500 | 503; erro: string; motivo?: string; cobrado: false }

export async function processarPerguntaMotor(e: { usuario: string | null; empresaId: string; pergunta: string; lang: Idioma }, deps: DepsRotaMotor & { podeUsar: (papel: string | null) => boolean }): Promise<ResultadoRotaMotor> {
  if (!e.usuario) return { status: 401, erro: 'nao_autorizado', cobrado: false }
  if (!e.pergunta || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.empresaId)) return { status: 400, erro: 'parametros_invalidos', cobrado: false }
  try {
    if (!(await deps.acesso(e.empresaId))) return { status: 404, erro: 'empresa_nao_encontrada', cobrado: false }
    if (!deps.podeUsar(await deps.papel(e.empresaId))) return { status: 403, erro: 'sem_acesso_financeiro', cobrado: false }
  } catch { return { status: 503, erro: 'falha_leitura', cobrado: false } }

  const saldo = await deps.consumir(e.empresaId)
  if (!saldo.ok) return { status: 402, erro: 'sem_saldo_ia', motivo: saldo.motivo, cobrado: false }
  try {
    const r = await deps.perguntar()
    if (!r.resposta) { await deps.devolver(saldo.id); return { status: 200, r, cobrado: false } } // IA não respondeu: não cobra
    return { status: 200, r, cobrado: true }
  } catch (err) {
    await deps.devolver(saldo.id)
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('empresa não encontrada')) return { status: 404, erro: 'empresa_nao_encontrada', cobrado: false }
    return { status: 500, erro: msg.slice(0, 200), cobrado: false }
  }
}
