// ═══════════════════════════════════════════════════════════════
// Ferramenta "dre" da Inteligência Axioma (2026-10-16): a IA consulta a DRE de qualquer mês ou período
// pelo MESMO cálculo da tela DRE (regime de competência — lib/dreCompetencia.ts): receitas + contas a
// receber + PDV, devoluções, impostos pelo regime (mesma função da IA Tributária), custos variáveis +
// contas a pagar, custo fixo só nos meses de vigência, juros pagos (conta 9.01) + juros estimados das
// dívidas. Só leitura, cliente do usuário (RLS). Antes não existia e a IA dizia que não tinha DRE.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { carregarBaseDRE, custoFixoNoPeriodo, mesesEntre, somaNoPeriodo, type BaseDRE } from '../dreCompetencia'
import { anexoSimplesDaAtividade, calcularImpostoRegime, categoriaMeiDaEmpresa } from '../iaTributariaHelpers'
import { hojeISO } from '../datas'

const r2 = (v: number) => Math.round(v * 100) / 100
const MES = /^\d{4}-(0[1-9]|1[0-2])$/
export const ultimoDia = (mes: string) => { const [a, m] = mes.split('-').map(Number); return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}` }
// 12 meses terminando no mês do fim (para a receita bruta de 12 meses do Simples)
export const inicio12 = (mesFim: string) => { const [a, m] = mesFim.split('-').map(Number); const t = a * 12 + (m - 1) - 11; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}-01` }

// Período pedido pela IA (AAAA-MM); sem período = mês corrente; mais de 24 meses = recusa
export function periodoDre(mesInicio: unknown, mesFim: unknown, fuso: string): { inicio: string; fim: string; meses: string[] } | { erro: string } {
  const atual = hojeISO(new Date(), fuso).slice(0, 7)
  const mi = MES.test(String(mesInicio ?? '')) ? String(mesInicio) : atual
  const mf = MES.test(String(mesFim ?? '')) ? String(mesFim) : mi
  if (mf < mi) return { erro: 'mês final antes do inicial' }
  const meses = mesesEntre(`${mi}-01`, `${mf}-01`)
  if (meses.length > 24) return { erro: 'período maior que 24 meses' }
  return { inicio: `${mi}-01`, fim: ultimoDia(mf), meses }
}

type Item = { valor: number; categoria?: string; data: string }
const porCategoria = (itens: Item[], inicio: string, fim: string, limite = 8) => {
  const m = new Map<string, number>()
  for (const i of itens) if (i.data >= inicio && i.data <= fim) m.set(i.categoria || 'Sem categoria', (m.get(i.categoria || 'Sem categoria') ?? 0) + (Number(i.valor) || 0))
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, limite).map(([categoria, valor]) => ({ categoria, valor: r2(valor) }))
}

// Conta da DRE de um período a partir da base já lida — ÚNICA para a IA, o Relatório CFO, a parte antiga da
// tela Relatórios (DRE do mês, evolução 12 meses, distribuição de custos) e o resumo que a IA lê.
// A base precisa começar 12 meses antes do fim (receita de 12 meses do Simples).
export type EmpresaDre = { regime_tributario?: string | null; atividade_fiscal?: string | null; mei_dados?: unknown }
export type DividaDre = { valor_total: number; valor_pago: number; taxa_juros: number }
export function calcularDre(base: BaseDRE, e: EmpresaDre | null, divs: DividaDre[], inicio: string, fim: string) {
  const meses = mesesEntre(inicio, fim).length
  const receitaBruta = somaNoPeriodo(base.receitas, inicio, fim)
  const devolucoes = somaNoPeriodo(base.devolucoes, inicio, fim)
  const custosVariaveis = somaNoPeriodo(base.custos, inicio, fim)
  const custosFixos = custoFixoNoPeriodo(base.custosFixos, inicio, fim)
  const rb12 = somaNoPeriodo(base.receitas, inicio12(fim.slice(0, 7)), fim)
  const regime = e?.regime_tributario || ''
  const ehMei = regime.toLowerCase() === 'mei'
  // Mesma função de imposto da tela DRE e da IA Tributária (MEI: DAS da categoria por mês)
  const impostoMes = calcularImpostoRegime(regime, rb12, receitaBruta / meses, undefined, undefined, ehMei ? categoriaMeiDaEmpresa(e as never) : undefined, anexoSimplesDaAtividade(e?.atividade_fiscal).anexo)
  const deducoes = r2(impostoMes * meses)
  const jurosPagos = somaNoPeriodo(base.jurosPagos, inicio, fim)
  const jurosMensais = divs.reduce((s, d) => s + Math.max(0, Number(d.valor_total || 0) - Number(d.valor_pago || 0)) * (Number(d.taxa_juros || 0) / 100), 0)
  const jurosEstimados = r2(jurosMensais * meses)
  const receitaLiquida = r2(receitaBruta - devolucoes - deducoes)
  const margem = r2(receitaLiquida - custosVariaveis)
  const resultadoOperacional = r2(margem - custosFixos)
  const lucroLiquido = r2(resultadoOperacional - jurosPagos - jurosEstimados)
  const pct = (v: number) => (receitaBruta > 0 ? r2((v / receitaBruta) * 100) : null)
  return { meses, regime, receitaBruta: r2(receitaBruta), devolucoes: r2(devolucoes), deducoes, receitaLiquida, custosVariaveis: r2(custosVariaveis), margem, margemPct: pct(margem),
    custosFixos, resultadoOperacional, jurosPagos: r2(jurosPagos), jurosEstimados, lucroLiquido, lucroPct: pct(lucroLiquido),
    semMovimento: receitaBruta === 0 && custosVariaveis === 0 && custosFixos === 0 }
}

export async function consultarDRE(supabase: SupabaseClient, empresaId: string, input: Record<string, unknown>, fuso: string): Promise<Record<string, unknown>> {
  const p = periodoDre(input.mes_inicio, input.mes_fim, fuso)
  if ('erro' in p) return { erro: p.erro }
  const [base, emp, divs] = await Promise.all([
    carregarBaseDRE(empresaId, inicio12(p.fim.slice(0, 7)) < p.inicio ? inicio12(p.fim.slice(0, 7)) : p.inicio, p.fim, supabase as never),
    supabase.from('empresas').select('regime_tributario, atividade_fiscal, mei_dados(categoria_mei)').eq('id', empresaId).maybeSingle(),
    supabase.from('dividas').select('valor_total, valor_pago, taxa_juros').eq('empresa_id', empresaId),
  ])
  if (base.falhou || emp.error || divs.error) return { erro: 'não foi possível consultar a DRE agora (leitura falhou)' }
  const d = calcularDre(base, emp.data as EmpresaDre | null, (divs.data ?? []) as DividaDre[], p.inicio, p.fim)
  const meses = d.meses
  return {
    indicador: 'lucro_competencia', estado: d.semMovimento ? 'parcial' : 'verificado', criterio_data: 'competência (mês do fato)', registros: base.receitas.length + base.custos.length,
    fonte: 'DRE gerencial por competência — mesmo cálculo da tela DRE do Axioma',
    periodo: { de: p.inicio, ate: p.fim, meses },
    regime_tributario: d.regime || 'não informado',
    receita_bruta: d.receitaBruta, devolucoes: d.devolucoes,
    impostos_deducoes: d.deducoes, impostos_tipo: 'estimativa pelo regime (a guia real pode diferir)',
    receita_liquida: d.receitaLiquida, custos_variaveis: d.custosVariaveis, margem_contribuicao: d.margem, margem_contribuicao_pct: d.margemPct,
    custos_fixos: d.custosFixos, resultado_operacional: d.resultadoOperacional,
    juros_pagos: d.jurosPagos, juros_estimados_dividas: d.jurosEstimados,
    lucro_liquido: d.lucroLiquido, lucro_liquido_pct: d.lucroPct,
    receitas_por_categoria: porCategoria(base.receitas, p.inicio, p.fim),
    custos_variaveis_por_categoria: porCategoria(base.custos, p.inicio, p.fim),
    custos_fixos_vigentes: base.custosFixos.filter((c) => c.inicio.slice(0, 7) <= p.fim.slice(0, 7) && (!c.fim || c.fim.slice(0, 7) >= p.inicio.slice(0, 7)))
      .sort((a, b) => b.valor_mensal - a.valor_mensal).slice(0, 10).map((c) => ({ descricao: c.descricao ?? c.categoria ?? 'custo fixo', valor_mensal: r2(c.valor_mensal) })),
    premissas: [...base.premissas, ...(meses > 1 ? ['valores somados no período'] : []), 'custo fixo não é presumido em meses futuros'],
    sem_movimento: d.semMovimento,
  }
}
