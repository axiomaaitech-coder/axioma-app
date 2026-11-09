// ═══════════════════════════════════════════════════════════════
// RH · Simulador "Contratar ou não" (2026-11-09). Antes de contratar: quanto custa de verdade (mesma conta do custo de
// pessoal — lib/rhCustoPessoal), quanto o lucro médio cai, quanto pesa no faturamento e o caixa mês a mês no 1º ano.
// Só simula: não grava nada. Caixa (previsão, regra da folha):
//   salário da competência pago até o 5º dia útil do mês seguinte (CLT art. 459, § 1º);
//   FGTS e INSS patronal da competência no dia 20 do mês seguinte (Lei 8.036, art. 15; Lei 8.212, art. 30, I, b);
//   13º: 1ª parcela até 30/11 e 2ª até 20/12, proporcional aos meses do ano (Lei 4.749/1965, arts. 1º e 2º);
//   encargos do 13º no mês seguinte a cada parcela (simplificação mostrada na tela); férias só depois de 12 meses (fora da janela).
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'
import { custoMensalContrato, inssPatronalPct, type Regime } from './rhCustoPessoal'

export const somaMes = (mes: string, n: number) => { const [a, m] = mes.split('-').map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` }

// folhaForaDaDre: a ponte RH ↔ financeiro achou a folha não lançada (ou lançada a menos) em Custos Fixos — o lucro médio da DRE está maior que o real
export type BaseSimulacao = { receitaMediaMensal: number | null; lucroMedioMensal: number | null; custoPessoalAtual: number | null; caixa: number | null; folhaForaDaDre?: boolean }

export function simularContratacao(p: { salario: number; quantidade: number; codCateg: '101' | '103'; regime: Regime; mesInicio: string; base: BaseSimulacao }) {
  const qtd = Math.max(1, Math.floor(p.quantidade))
  const per = custoMensalContrato({ id: 'sim', colaborador_id: 'sim', cod_categ: p.codCateg, departamento_id: null }, { und_sal_fixo: 5, valor: p.salario }, p.regime)
  if (!per || !(p.salario > 0)) return null
  const mensal = per.total * qtd
  const sal = per.salario * qtd
  const fgtsPct = p.codCateg === '103' ? 2 : 8
  const patPct = inssPatronalPct(p.regime, p.codCateg).pct ?? 0
  const encargos = (v: number) => Math.round((v * fgtsPct) / 100) + Math.round((v * patPct) / 100)

  // caixa: 13 meses a partir do início (o salário do último mês sai no mês seguinte)
  const meses = Array.from({ length: 13 }, (_, i) => somaMes(p.mesInicio, i))
  const caixa = new Map<string, { rotulo: string; valor: number }[]>(meses.map((m) => [m, []]))
  const add = (mes: string, rotulo: string, valor: number) => { if (caixa.has(mes) && valor) caixa.get(mes)!.push({ rotulo, valor }) }
  const competencias = meses.slice(0, 12)
  for (const c of competencias) {
    add(somaMes(c, 1), `salário de ${c} (5º dia útil)`, sal)
    add(somaMes(c, 1), `FGTS${patPct ? ' e INSS patronal' : ''} de ${c} (dia 20)`, encargos(sal))
  }
  for (const ano of [...new Set(competencias.map((c) => c.slice(0, 4)))]) {
    const avos = competencias.filter((c) => c.slice(0, 4) === ano).length
    if (!competencias.includes(`${ano}-12`)) continue // o 13º desse ano cai fora da janela
    const total = Math.round((sal * avos) / 12)
    const p1 = competencias.includes(`${ano}-11`) ? Math.round(total / 2) : 0
    add(`${ano}-11`, `13º — 1ª parcela (${avos}/12, até 30/11)`, p1)
    add(`${ano}-12`, `13º — 2ª parcela (até 20/12)`, total - p1)
    add(`${ano}-12`, '13º — encargos da 1ª parcela', encargos(p1))
    add(somaMes(`${ano}-12`, 1), '13º — encargos da 2ª parcela', encargos(total - p1))
  }
  const fluxo = meses.map((m) => { const itens = caixa.get(m)!; return { mes: m, valor: reais(itens.reduce((s, x) => s + x.valor, 0)), itens: itens.map((x) => ({ rotulo: x.rotulo, valor: reais(x.valor) })) } })
  const totalCaixa = fluxo.reduce((s, x) => s + centavos(x.valor), 0)

  const b = p.base
  const pessoalDepois = b.custoPessoalAtual != null ? centavos(b.custoPessoalAtual) + mensal : null
  const pct = (v: number | null) => (v != null && b.receitaMediaMensal ? Math.round((v / centavos(b.receitaMediaMensal)) * 1000) / 10 : null)
  const lucroDepois = b.lucroMedioMensal != null ? reais(centavos(b.lucroMedioMensal) - mensal) : null
  const tresMeses = fluxo.slice(0, 4).reduce((s, x) => s + centavos(x.valor), 0)
  const alertas: string[] = []
  if (b.folhaForaDaDre) alertas.push('a folha atual não está (toda) lançada em Custos Fixos: o lucro médio da DRE está MAIOR que o real e o impacto desta contratação é pior do que parece')
  if (pessoalDepois != null && b.receitaMediaMensal && pessoalDepois > centavos(b.receitaMediaMensal)) alertas.push('o custo de pessoal passa do faturamento médio mensal')
  if (lucroDepois != null && lucroDepois < 0) alertas.push('com essa contratação o lucro médio mensal fica NEGATIVO')
  else if (lucroDepois != null && b.lucroMedioMensal != null && b.lucroMedioMensal > 0 && lucroDepois < b.lucroMedioMensal * 0.5) alertas.push('a contratação consome mais da metade do lucro médio mensal')
  if (b.caixa != null && centavos(b.caixa) < tresMeses) alertas.push('o caixa de hoje não cobre os primeiros meses dessa contratação')
  if (fluxo.some((x) => x.itens.some((i) => i.rotulo.startsWith('13º')))) alertas.push('novembro e dezembro têm o 13º: o caixa precisa de folga nesses meses')
  return {
    quantidade: qtd, regime: p.regime, base_inss_patronal: inssPatronalPct(p.regime, p.codCateg).base,
    por_pessoa: { salario: reais(per.salario), fgts: reais(per.fgts), provisoes_13_ferias: reais(per.provisoes), inss_patronal: reais(per.inss_patronal), custo_mensal: reais(per.total) },
    custo_mensal_total: reais(mensal), custo_12_meses: reais(mensal * 12), caixa_primeiro_ano: reais(totalCaixa), fluxo,
    impacto: {
      lucro_medio_mensal_antes: b.lucroMedioMensal, lucro_medio_mensal_depois: lucroDepois,
      pessoal_sobre_faturamento_antes_pct: pct(b.custoPessoalAtual != null ? centavos(b.custoPessoalAtual) : null), pessoal_sobre_faturamento_depois_pct: pct(pessoalDepois),
      faturamento_medio_mensal: b.receitaMediaMensal, caixa_hoje: b.caixa,
      meses_de_folego_no_caixa: b.caixa != null && mensal > 0 ? Math.floor(centavos(b.caixa) / mensal) : null,
    },
    alertas,
    premissas: ['custo pela mesma conta do custo de pessoal do RH (salário + FGTS + provisões + INSS patronal pelo regime)', 'sem horas extras, benefícios, RAT×FAP e terceiros',
      'caixa: salário no 5º dia útil e FGTS/INSS no dia 20 do mês seguinte; 13º em 30/11 e 20/12; encargos do 13º no mês seguinte a cada parcela; primeiras férias só depois de 12 meses',
      'lucro e faturamento médios dos últimos 12 meses completos da DRE (competência)'],
  }
}

