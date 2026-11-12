// ═══════════════════════════════════════════════════════════════
// Ferramenta "dre" da Inteligência Axioma (2026-10-16): a IA consulta a DRE de qualquer mês ou período
// pelo MESMO cálculo da tela DRE (regime de competência — lib/dreCompetencia.ts): receitas + contas a
// receber + PDV, devoluções, impostos pelo regime (mesma função da IA Tributária), custos variáveis +
// contas a pagar, custo fixo só nos meses de vigência, juros pagos (conta 9.01) + juros estimados das
// dívidas. Só leitura, cliente do usuário (RLS). Antes não existia e a IA dizia que não tinha DRE.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { carregarBaseDRE, custoFixoNoPeriodo, mesesEntre, somaNoPeriodo, type BaseDRE, jurosEstimadosNoPeriodo } from '../dreCompetencia'
import { impostoDaEmpresa, COLUNAS_EMPRESA_FISCAL, somarReceitaServicos } from '../iaTributariaHelpers'
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
export type EmpresaDre = { regime_tributario?: string | null; atividade_fiscal?: string | null; aliquota_iss_pct?: number | null; mei_dados?: unknown }
export type DividaDre = { valor_total: number; valor_pago: number; taxa_juros: number; created_at?: string | null }
export function calcularDre(base: BaseDRE, e: EmpresaDre | null, divs: DividaDre[], inicio: string, fim: string) {
  const meses = mesesEntre(inicio, fim).length
  const receitaBruta = somaNoPeriodo(base.receitas, inicio, fim)
  const devolucoes = somaNoPeriodo(base.devolucoes, inicio, fim)
  const custosVariaveis = somaNoPeriodo(base.custos, inicio, fim)
  const custosFixos = custoFixoNoPeriodo(base.custosFixos, inicio, fim)
  const rb12 = somaNoPeriodo(base.receitas, inicio12(fim.slice(0, 7)), fim)
  const regime = e?.regime_tributario || ''
  // Mesma função de imposto da tela DRE e da IA Tributária (MEI: DAS da categoria por mês)
  const servicos = somarReceitaServicos(base.receitas.filter((r) => r.data >= inicio && r.data <= fim))
  const impostoMes = impostoDaEmpresa(e, rb12, receitaBruta / meses, (receitaBruta - devolucoes - custosVariaveis - custosFixos) / meses, servicos / meses)
  const deducoes = r2(impostoMes * meses)
  const jurosPagos = somaNoPeriodo(base.jurosPagos, inicio, fim)
  const jurosEstimados = jurosEstimadosNoPeriodo(divs, inicio, fim)
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
    supabase.from('empresas').select(COLUNAS_EMPRESA_FISCAL).eq('id', empresaId).maybeSingle(),
    supabase.from('dividas').select('valor_total, valor_pago, taxa_juros, created_at').eq('empresa_id', empresaId),
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

// ─── Fator R do Simples Nacional (LC 123/2006, art. 18, §§ 5º-J, 5º-K, 5º-M e 24) ───
// Fator R = folha de salários paga nos 12 meses ANTERIORES ao mês de apuração (salários, pró-labore, INSS patronal e FGTS)
// ÷ receita bruta dos mesmos 12 meses. 28% ou mais → Anexo III; abaixo → Anexo V. Só vale para os serviços do § 5º-I
// (depende do CNAE): o Axioma calcula e mostra, nunca troca o anexo sozinho. Folha = Custos Fixos "Folha de pagamento"
// (o lançado, mesma fonte da DRE); a estimativa do RH não entra (seria inventar folha que não foi paga).
export function fatorR(folha12: number, receita12: number): { pct: number; anexo: 'III' | 'V' } | null {
  if (!(receita12 > 0) || !(folha12 > 0)) return null
  // decide pelo número exato (27,999% é Anexo V); só o que aparece é arredondado
  return { pct: Math.floor((folha12 / receita12) * 10000) / 100, anexo: folha12 * 100 >= receita12 * 28 ? 'III' : 'V' }
}
export async function consultarFatorR(supabase: SupabaseClient, empresaId: string, fuso: string): Promise<Record<string, unknown>> {
  const pa = hojeISO(new Date(), fuso).slice(0, 7)
  const [a, m] = pa.split('-').map(Number)
  const t = a * 12 + (m - 1) - 1
  const mesFim = `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
  const inicio = inicio12(mesFim), fim = ultimoDia(mesFim)
  const [base, emp] = await Promise.all([carregarBaseDRE(empresaId, inicio, fim, supabase as never), supabase.from('empresas').select('regime_tributario, atividade_fiscal').eq('id', empresaId).maybeSingle()])
  if (base.falhou || emp.error) return { erro: 'não foi possível calcular o Fator R agora (leitura falhou)' }
  const receita12 = r2(somaNoPeriodo(base.receitas, inicio, fim) - somaNoPeriodo(base.devolucoes, inicio, fim))
  const folha = base.custosFixos.filter((c) => c.categoria === 'Folha de pagamento')
  const folha12 = custoFixoNoPeriodo(folha, inicio, fim)
  const mesesComReceita = new Set(base.receitas.filter((r) => r.data >= inicio && r.data <= fim).map((r) => r.data.slice(0, 7))).size
  const f = fatorR(folha12, receita12)
  const e = (emp.data ?? {}) as { regime_tributario?: string | null; atividade_fiscal?: string | null }
  const premissas = ['folha = Custos Fixos na categoria "Folha de pagamento" (salários, pró-labore, INSS patronal e FGTS devem estar lançados ali)', 'receita = receita bruta da DRE por competência menos devoluções']
  if (mesesComReceita < 12) premissas.push(`só ${mesesComReceita} dos 12 meses têm receita: para empresa com menos de 13 meses a lei usa regra proporcional (Resolução CGSN nº 140/2018), o número pode diferir`)
  if (!/simples/i.test(e.regime_tributario ?? '')) premissas.push('a empresa não está cadastrada no Simples Nacional: o Fator R só vale no Simples')
  return {
    indicador: 'fator_r', estado: !f ? 'sem_dado' : mesesComReceita < 12 ? 'parcial' : 'verificado',
    fonte: 'LC 123/2006, art. 18, §§ 5º-J, 5º-K, 5º-M e 24', mes_apuracao: pa, periodo: { de: inicio, ate: fim },
    folha_12_meses: folha12, receita_bruta_12_meses: receita12, fator_r_pct: f?.pct ?? null,
    anexo_indicado: f ? `Anexo ${f.anexo} (${f.anexo === 'III' ? '28% ou mais' : 'abaixo de 28%'})` : null,
    folha_que_faltaria_para_28pct: f && f.anexo === 'V' ? r2(receita12 * 0.28 - folha12) : null,
    atividade_fiscal: e.atividade_fiscal ?? null, regime: e.regime_tributario ?? null,
    aviso: !f ? (receita12 > 0 ? 'Não há folha lançada em Custos Fixos ("Folha de pagamento") nos 12 meses: sem ela o Fator R não pode ser calculado. Lance a folha em Custos Fixos.' : 'Sem receita nos 12 meses anteriores: sem base para o Fator R.')
      : 'Vale só para os serviços sujeitos ao Fator R (§ 5º-I, pelo CNAE). O Axioma mostra a conta; o anexo usado no DAS é o que a empresa declara no PGDAS-D.',
    premissas,
  }
}
