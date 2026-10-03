// ═══════════════════════════════════════════════════════════════
// Auditoria de uso de IA com dados da empresa + limpeza automática por prazo.
// Só servidor. Grava em nexus_audit_log com service_role (ninguém escreve o
// próprio log; a empresa só LÊ o que é dela — RLS da tabela). Guarda o QUE foi
// feito (quem, quando, qual empresa, qual IA, quanto dado foi enviado) —
// nunca o conteúdo dos números da empresa nem a pergunta completa.
// ═══════════════════════════════════════════════════════════════
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DIAS_GUARDA_PLANO, DIAS_GUARDA_PAINEL, DIAS_GUARDA_AUDITORIA, DIAS_LIXEIRA_HISTORICO_AP, DIAS_LIXEIRA_TERMOS, dataLimite } from './nexusRetencao'

function clienteServico(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY
  return url && chave ? createClient(url, chave) : null
}

export type RegistroAuditoria = {
  empresaId: string | null
  ator: string | null
  acao: string // ex.: 'jose.plano', 'ia.chat'
  entidade?: string
  entidadeId?: string | null
  parametros?: Record<string, unknown>
  resultado?: Record<string, unknown>
  versaoMotor?: string
}

// Melhor-esforço: falha de auditoria é logada, mas nunca derruba a resposta ao usuário.
export async function registrarAuditoria(r: RegistroAuditoria): Promise<void> {
  const supabase = clienteServico()
  if (!supabase) { console.error('[auditoria] SUPABASE_SERVICE_ROLE_KEY ausente — registro não gravado', r.acao); return }
  const { error } = await supabase.from('nexus_audit_log').insert({
    empresa_id: r.empresaId, ator: r.ator, acao: r.acao, entidade: r.entidade ?? null, entidade_id: r.entidadeId ?? null,
    parametros: r.parametros ?? null, resultado: r.resultado ?? null, versao_motor: r.versaoMotor ?? null,
  })
  if (error) console.error('[auditoria] falha ao gravar', r.acao, error.message)
}

// Apaga o que passou do prazo de guarda (roda no cron diário). Cada tabela isolada.
export async function limparDadosVencidos(supabase: SupabaseClient): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {}
  const passos: [string, string, string, number][] = [
    ['nexus_plano_empresa', 'gerado_em', 'planos', DIAS_GUARDA_PLANO],
    ['nexus_briefing', 'gerado_em', 'paineis', DIAS_GUARDA_PAINEL],
    ['nexus_audit_log', 'created_at', 'auditoria', DIAS_GUARDA_AUDITORIA],
    // lixeira do Histórico de Contas a Pagar: só linha com excluido_em preenchido entra no .lt()
    ['contas_pagar_auditoria', 'excluido_em', 'lixeira_historico_ap', DIAS_LIXEIRA_HISTORICO_AP],
    // termo de aceite de quem saiu da empresa: 60 dias na lixeira, depois some de vez
    ['empresa_convite_termo', 'saiu_em', 'lixeira_termos_convite', DIAS_LIXEIRA_TERMOS],
  ]
  for (const [tabela, coluna, rotulo, dias] of passos) {
    const { count, error } = await supabase.from(tabela).delete({ count: 'exact' }).lt(coluna, dataLimite(dias))
    resultado[rotulo] = error ? `erro: ${error.message}` : `${count ?? 0} apagado(s)`
  }
  return resultado
}
