// Base real da empresa para o simulador "Contratar ou não" (lê o banco; a conta pura fica em lib/rhSimulacao.ts, testável sem banco).
import type { SupabaseClient } from '@supabase/supabase-js'
import { centavos, reais } from './financeiro/contrato'
import { lerCustoPessoal, regimeDaEmpresa } from './rhCustoPessoal'
import { carregarBaseDRE, custoFixoNoPeriodo } from './dreCompetencia'
import { calcularDre, inicio12, ultimoDia, type EmpresaDre, type DividaDre } from './ia/ferramentaDre'
import { COLUNAS_EMPRESA_FISCAL } from './iaTributariaHelpers'
import { saldoCaixaRealizado } from './caixaSaldo'
import { somaMes, type BaseSimulacao } from './rhSimulacao'

// Tela e IA usam a mesma: DRE dos últimos 12 meses completos, caixa de hoje, custo de pessoal.

// podeSalario: sem a liberação de salário a RLS devolve a lista VAZIA (não erro) — o custo atual viraria zero calado; por isso fica null.
export async function carregarBaseSimulacao(supabase: SupabaseClient, empresaId: string, hoje: string, podeSalario: boolean) {
  const mesFim = somaMes(hoje.slice(0, 7), -1) // último mês completo
  const inicio = inicio12(mesFim), fim = ultimoDia(mesFim)
  const [baseDre, emp, divs, caixa, pessoal] = await Promise.all([
    carregarBaseDRE(empresaId, inicio, fim, supabase as never),
    supabase.from('empresas').select(COLUNAS_EMPRESA_FISCAL).eq('id', empresaId).maybeSingle(),
    supabase.from('dividas').select('valor_total, valor_pago, taxa_juros, created_at').eq('empresa_id', empresaId),
    saldoCaixaRealizado(supabase, empresaId, hoje),
    podeSalario ? lerCustoPessoal(supabase, empresaId, hoje).catch(() => null) : Promise.resolve(null),
  ])
  const limitacoes: string[] = []
  let receitaMediaMensal: number | null = null, lucroMedioMensal: number | null = null, margemContribuicaoPct: number | null = null, receita12: number | null = null, folha12Lancada: number | null = null
  if (baseDre.falhou || emp.error || divs.error) limitacoes.push('DRE não foi lida agora: impacto no lucro e no faturamento ficou de fora')
  else {
    const d = calcularDre(baseDre, emp.data as EmpresaDre | null, (divs.data ?? []) as DividaDre[], inicio, fim)
    if (d.semMovimento) limitacoes.push('sem movimento na DRE dos últimos 12 meses: impacto no lucro não calculado')
    else {
      receitaMediaMensal = reais(Math.round(centavos(d.receitaBruta) / 12)); lucroMedioMensal = reais(Math.round(centavos(d.lucroLiquido) / 12))
      margemContribuicaoPct = d.margemPct ?? null
      // Fator R (LC 123, art. 18): receita bruta menos devoluções e folha lançada em Custos Fixos nos mesmos 12 meses
      receita12 = reais(centavos(d.receitaBruta) - centavos(d.devolucoes))
      folha12Lancada = custoFixoNoPeriodo(baseDre.custosFixos.filter((c) => c.categoria === 'Folha de pagamento'), inicio, fim)
    }
  }
  if (caixa.erro) limitacoes.push('caixa de hoje não foi lido agora')
  if (!pessoal) limitacoes.push(podeSalario ? 'custo de pessoal atual não foi lido agora' : 'sem liberação de salário: o custo de pessoal atual não entra na comparação')
  return {
    base: { receitaMediaMensal, lucroMedioMensal, margemContribuicaoPct, receita12, folha12Lancada, custoPessoalAtual: pessoal ? pessoal.r.custo_total_mensal : null, caixa: caixa.erro ? null : caixa.saldo,
      folhaForaDaDre: !!pessoal?.ponte && (pessoal.ponte.situacao === 'folha_nao_lancada' || pessoal.ponte.situacao === 'lancado_a_menos') } as BaseSimulacao,
    pessoal, regime: pessoal?.regime ?? regimeDaEmpresa((emp.data as { regime_tributario?: string } | null)?.regime_tributario), periodo_dre: { de: inicio, ate: fim }, limitacoes,
  }
}
