// Base real dos indicadores de CFO para pessoas (lê o banco; a conta pura fica em lib/rhIndicadores.ts).
// Mesma base do simulador (DRE dos últimos 12 meses completos, custo de pessoal do RH) + headcount digitado nos Centros de Custo.
import type { SupabaseClient } from '@supabase/supabase-js'
import { carregarBaseSimulacao } from './rhSimulacaoBase'
import { indicadoresPessoas } from './rhIndicadores'

export async function carregarIndicadoresPessoas(supabase: SupabaseClient, empresaId: string, hoje: string, podeSalario: boolean) {
  const [b, cc] = await Promise.all([
    carregarBaseSimulacao(supabase, empresaId, hoje, podeSalario),
    supabase.from('centros_custo').select('id, nome, headcount, ativo').eq('empresa_id', empresaId),
  ])
  const porCentro = b.pessoal?.r.pessoas_por_centro ?? {}
  const centros = cc.error ? [] : ((cc.data ?? []) as { nome: string; headcount: number | null; ativo: boolean | null }[])
    .filter((c) => c.ativo !== false && (c.headcount != null || porCentro[c.nome]))
    .map((c) => ({ nome: c.nome, headcountCadastrado: c.headcount, pessoasRh: porCentro[c.nome] ?? 0 }))
  const limitacoes = [...b.limitacoes]
  if (cc.error) limitacoes.push('Centros de Custo não foram lidos agora: a comparação de headcount ficou de fora')
  const ind = indicadoresPessoas({ pessoas: b.pessoal?.r.pessoas_ativas ?? 0, custoPessoalMensal: b.base.custoPessoalAtual, receitaMediaMensal: b.base.receitaMediaMensal,
    lucroMedioMensal: b.base.lucroMedioMensal, folhaForaDaDre: b.base.folhaForaDaDre, centros })
  return { ...ind, periodo_dre: b.periodo_dre, limitacoes, sem_salario: !podeSalario }
}
