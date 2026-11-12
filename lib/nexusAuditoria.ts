// ═══════════════════════════════════════════════════════════════
// Auditoria de uso de IA com dados da empresa + limpeza automática por prazo.
// Só servidor. Grava em nexus_audit_log com service_role (ninguém escreve o
// próprio log; a empresa só LÊ o que é dela — RLS da tabela). Guarda o QUE foi
// feito (quem, quando, qual empresa, qual IA, quanto dado foi enviado) —
// nunca o conteúdo dos números da empresa nem a pergunta completa.
// ═══════════════════════════════════════════════════════════════
import * as Sentry from '@sentry/nextjs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { DIAS_GUARDA_PLANO, DIAS_GUARDA_PAINEL, DIAS_GUARDA_AUDITORIA, DIAS_LIXEIRA_HISTORICO_AP, DIAS_LIXEIRA_TERMOS, DIAS_LIXEIRA_RH, dataLimite } from './nexusRetencao'

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
  if (!supabase) { console.error('[auditoria] SUPABASE_SERVICE_ROLE_KEY ausente — registro não gravado', r.acao); Sentry.captureException(new Error(`[auditoria] sem chave do servidor: ${r.acao} não gravado`)); return }
  const { error } = await supabase.from('nexus_audit_log').insert({
    empresa_id: r.empresaId, ator: r.ator, acao: r.acao, entidade: r.entidade ?? null, entidade_id: r.entidadeId ?? null,
    parametros: r.parametros ?? null, resultado: r.resultado ?? null, versao_motor: r.versaoMotor ?? null,
  })
  if (error) {
    console.error('[auditoria] falha ao gravar', r.acao, error.message)
    Sentry.captureException(new Error(`[auditoria] falha ao gravar ${r.acao}: ${error.message}`))
  }
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
    // lixeira do RH (90 dias). Ordem importa: cargo antes de departamento, filial depois.
    ['rh_colaboradores', 'excluido_em', 'lixeira_rh_colaboradores', DIAS_LIXEIRA_RH], // leva junto dados pessoais, contratos e salários (cascata)
    ['rh_cargos', 'excluido_em', 'lixeira_rh_cargos', DIAS_LIXEIRA_RH],
    ['rh_departamentos', 'excluido_em', 'lixeira_rh_departamentos', DIAS_LIXEIRA_RH],
    ['rh_lotacoes', 'excluido_em', 'lixeira_rh_lotacoes', DIAS_LIXEIRA_RH],
    ['rh_estabelecimentos', 'excluido_em', 'lixeira_rh_estabelecimentos', DIAS_LIXEIRA_RH],
    ['rh_rubricas', 'excluido_em', 'lixeira_rh_rubricas', DIAS_LIXEIRA_RH],
    ['rh_empregador', 'excluido_em', 'lixeira_rh_empregador', DIAS_LIXEIRA_RH],
    ['rh_dependentes', 'excluido_em', 'lixeira_rh_dependentes', DIAS_LIXEIRA_RH],
    ['rh_remuneracoes', 'excluido_em', 'lixeira_rh_salarios', DIAS_LIXEIRA_RH],
    ['rh_ferias', 'excluido_em', 'lixeira_rh_ferias', DIAS_LIXEIRA_RH],
    // simulações de contratação salvas: 30 dias para comparar, depois somem (RH-22)
    ['rh_simulacoes', 'criado_em', 'simulacoes_rh', 30],
  ]
  // arquivos da admissão de quem sai da lixeira hoje: tirar do cofre ANTES da cascata apagar o caminho.
  // Com falha ou com sobra (mais de 1000), as pessoas ficam para o cron seguinte — nenhum arquivo fica perdido no cofre.
  {
    const LOTE = 1000
    const { data, error } = await supabase.from('rh_admissao_itens').select('arquivo_path, rh_colaboradores!inner(excluido_em)')
      .not('arquivo_path', 'is', null).lt('rh_colaboradores.excluido_em', dataLimite(DIAS_LIXEIRA_RH)).limit(LOTE)
    const paths = ((data ?? []) as { arquivo_path: string }[]).map((x) => x.arquivo_path)
    let falha = error?.message
    for (let i = 0; !falha && i < paths.length; i += 100) falha = (await supabase.storage.from('rh-documentos').remove(paths.slice(i, i + 100))).error?.message
    resultado.lixeira_rh_arquivos = falha ? `erro: ${falha}` : `${paths.length} apagado(s)`
    if (falha || paths.length === LOTE) passos.splice(passos.findIndex((p) => p[0] === 'rh_colaboradores'), 1)
  }
  // arquivo anexado por engano (só o arquivo foi para a lixeira): apaga do cofre e limpa o item; o item continua
  {
    const { data, error } = await supabase.from('rh_admissao_itens').select('id, arquivo_path').not('arquivo_excluido_em', 'is', null)
      .lt('arquivo_excluido_em', dataLimite(DIAS_LIXEIRA_RH)).limit(1000)
    const itens = (data ?? []) as { id: string; arquivo_path: string }[]
    let falha = error?.message
    for (let i = 0; !falha && i < itens.length; i += 100) {
      const lote = itens.slice(i, i + 100)
      falha = (await supabase.storage.from('rh-documentos').remove(lote.map((x) => x.arquivo_path))).error?.message
      if (!falha) falha = (await supabase.from('rh_admissao_itens').update({ arquivo_path: null, arquivo_nome: null, arquivo_mime: null, arquivo_bytes: null, arquivo_excluido_em: null }).in('id', lote.map((x) => x.id))).error?.message
    }
    resultado.lixeira_rh_anexos = falha ? `erro: ${falha}` : `${itens.length} apagado(s)`
  }
  for (const [tabela, coluna, rotulo, dias] of passos) {
    const { count, error } = await supabase.from(tabela).delete({ count: 'exact' }).lt(coluna, dataLimite(dias))
    resultado[rotulo] = error ? `erro: ${error.message}` : `${count ?? 0} apagado(s)`
  }
  return resultado
}
