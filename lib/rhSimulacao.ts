// ═══════════════════════════════════════════════════════════════
// RH · Simulador "Contratar ou não" (2026-11-09; padrão CFO 2026-11-12). Antes de contratar: quanto custa de verdade
// (salário + adicionais + variáveis + provisões + encargos + benefícios), quanto o lucro médio cai, quanto pesa no
// faturamento, o caixa mês a mês no 1º ano, o retorno esperado (ponto de equilíbrio, prazo para se pagar, ROI), o efeito
// no Fator R e quanto custaria desligar depois de 12 meses. Só simula: não grava nada. Regras (conferidas em 12/11/2026):
//   salário da competência pago até o 5º dia útil do mês seguinte (CLT art. 459, § 1º);
//   FGTS e INSS patronal da competência no dia 20 do mês seguinte (Lei 8.036, art. 15; Lei 8.212, art. 30, I, b);
//   13º: 1ª parcela até 30/11 e 2ª até 20/12, proporcional (Lei 4.749/1965, arts. 1º e 2º); férias só depois de 12 meses;
//   hora = salário ÷ (jornada semanal × 5) (220 h para 44 h); hora extra com no mínimo 50% (CF art. 7º, XVI) e reflexo no
//   descanso semanal ≈ 1/6 (Lei 605/1949; Súmula 172 TST); adicional noturno 20% (CLT art. 73); periculosidade 30% do
//   salário-base (CLT art. 193, § 1º); insalubridade 10/20/40% do salário mínimo (CLT art. 192);
//   vale-transporte: a Empresa paga o que passar de 6% do salário-base (Lei 7.418/1985, art. 4º, parágrafo único);
//   lucro presumido/real: INSS 20% + RAT 1–3% × FAP 0,5–2,0 (Lei 8.212, art. 22, I e II; Lei 10.666, art. 10) + terceiros
//   (Sistema S, salário-educação, Incra — varia pelo FPAS; a pessoa confere na DCTFWeb). No Simples (exceto Anexo IV)
//   tudo isso já está no DAS (LC 123, art. 13, VI).
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'
import { inssPatronalPct, type Regime } from './rhCustoPessoal'
import { calcularRescisao, REGRAS_2026 } from './rhRescisao'

export const somaMes = (mes: string, n: number) => { const [a, m] = mes.split('-').map(Number); const t = a * 12 + (m - 1) + n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}` }
// Salário mínimo 2026 = 1ª faixa do INSS da Portaria Interministerial MPS/MF nº 13/2026 (mesma fonte das regras da folha)
export const SALARIO_MINIMO = REGRAS_2026.inss[0].ate

// folhaForaDaDre: a ponte RH ↔ financeiro achou a folha não lançada (ou lançada a menos) em Custos Fixos — o lucro médio da DRE está maior que o real
export type BaseSimulacao = {
  receitaMediaMensal: number | null; lucroMedioMensal: number | null; custoPessoalAtual: number | null; caixa: number | null; folhaForaDaDre?: boolean
  margemContribuicaoPct?: number | null; folha12Lancada?: number | null; receita12?: number | null
}
// Tudo opcional: a IA pode simular só com salário e quantidade; a tela preenche o resto.
export type ExtrasSimulacao = {
  jornadaSemanal?: number
  periculosidade?: boolean; insalubridadeGrau?: 0 | 10 | 20 | 40
  horasExtrasMes?: number; adicionalHEPct?: number; horasNoturnasMes?: number; comissaoMedia?: number
  valeTransporteMes?: number; refeicaoMes?: number; saudeMes?: number; outrosBeneficiosMes?: number
  ratPct?: number; fap?: number; terceirosPct?: number
  custoEntrada?: { recrutamento?: number; exames?: number; equipamentos?: number; treinamento?: number }
  rampaMeses?: number; receitaAdicionalMes?: number; margemPct?: number
}

const pct = (v: number, p: number) => Math.round((v * p) / 100)
const lim = (v: number | undefined, a: number, b: number, padrao: number) => (v == null || !isFinite(v) ? padrao : Math.min(b, Math.max(a, v)))

/** Custo mensal de UMA pessoa, em centavos, com cada parte separada. */
export function custoPorPessoa(salario: number, codCateg: '101' | '103', regime: Regime, x: ExtrasSimulacao = {}) {
  const s = centavos(salario)
  const jornada = lim(x.jornadaSemanal, 1, 44, 44)
  const divisor = jornada * 5
  const hora = s / divisor
  const peric = x.periculosidade ? pct(s, 30) : 0
  const insal = x.insalubridadeGrau ? pct(centavos(SALARIO_MINIMO), x.insalubridadeGrau) : 0
  const he = Math.round(lim(x.horasExtrasMes, 0, 200, 0) * hora * (1 + lim(x.adicionalHEPct, 50, 200, 50) / 100))
  const dsr = Math.round(he / 6)
  const noturno = Math.round(lim(x.horasNoturnasMes, 0, 300, 0) * hora * 0.2)
  const comissao = centavos(Math.max(0, x.comissaoMedia ?? 0))
  const remun = s + peric + insal + he + dsr + noturno + comissao // base de FGTS/INSS
  const prov13 = Math.round(remun / 12), provFerias = Math.round((remun * 4) / 3 / 12)
  const baseEnc = remun + prov13 + provFerias
  const fgts = pct(baseEnc, codCateg === '103' ? 2 : 8)
  const inss = inssPatronalPct(regime, codCateg)
  const patronal = inss.pct == null ? 0 : pct(baseEnc, inss.pct)
  const foraDoSimples = regime === 'presumido' || regime === 'real'
  const ratFap = foraDoSimples ? Math.round((baseEnc * lim(x.ratPct, 0, 3, 2) * lim(x.fap, 0.5, 2, 1)) / 100) : 0
  const terceiros = foraDoSimples ? Math.round((baseEnc * lim(x.terceirosPct, 0, 10, 5.8)) / 100) : 0
  const vt = Math.max(0, centavos(Math.max(0, x.valeTransporteMes ?? 0)) - pct(s, 6))
  const beneficios = vt + centavos(Math.max(0, x.refeicaoMes ?? 0)) + centavos(Math.max(0, x.saudeMes ?? 0)) + centavos(Math.max(0, x.outrosBeneficiosMes ?? 0))
  const total = remun + prov13 + provFerias + fgts + patronal + ratFap + terceiros + beneficios
  return { s, peric, insal, he, dsr, noturno, comissao, remun, prov13, provFerias, fgts, patronal, ratFap, terceiros, vt, beneficios, total, jornada, divisor, patronalCalculado: inss.pct != null, foraDoSimples,
    // encargos que saem no dia 20 sobre a remuneração do mês (sem as provisões, que saem quando o 13º/férias são pagos)
    encargosMes: pct(remun, codCateg === '103' ? 2 : 8) + (inss.pct == null ? 0 : pct(remun, inss.pct)) + (foraDoSimples ? Math.round((remun * lim(x.ratPct, 0, 3, 2) * lim(x.fap, 0.5, 2, 1)) / 100) + Math.round((remun * lim(x.terceirosPct, 0, 10, 5.8)) / 100) : 0) }
}

export function simularContratacao(p: { salario: number; quantidade: number; codCateg: '101' | '103'; regime: Regime; mesInicio: string; base: BaseSimulacao; extras?: ExtrasSimulacao }) {
  const qtd = Math.max(1, Math.floor(p.quantidade))
  if (!(p.salario > 0)) return null
  const x = p.extras ?? {}
  const per = custoPorPessoa(p.salario, p.codCateg, p.regime, x)
  const mensal = per.total * qtd
  const remun = per.remun * qtd
  const encMes = per.encargosMes * qtd
  const benef = per.beneficios * qtd
  const ent = x.custoEntrada ?? {}
  const entrada = centavos(Math.max(0, (ent.recrutamento ?? 0) + (ent.exames ?? 0) + (ent.equipamentos ?? 0) + (ent.treinamento ?? 0))) * qtd

  // caixa: 13 meses a partir do início (o salário do último mês sai no mês seguinte)
  const meses = Array.from({ length: 13 }, (_, i) => somaMes(p.mesInicio, i))
  const caixa = new Map<string, { rotulo: string; valor: number }[]>(meses.map((m) => [m, []]))
  const add = (mes: string, rotulo: string, valor: number) => { if (caixa.has(mes) && valor) caixa.get(mes)!.push({ rotulo, valor }) }
  const competencias = meses.slice(0, 12)
  add(p.mesInicio, 'custos de entrada (recrutamento, exames, equipamentos, treinamento)', entrada)
  for (const c of competencias) {
    add(c, `benefícios de ${c} (vale-transporte, refeição, saúde, outros)`, benef)
    add(somaMes(c, 1), `remuneração de ${c} (5º dia útil)`, remun)
    add(somaMes(c, 1), `FGTS${per.patronalCalculado && (per.patronal || per.foraDoSimples) ? ', INSS e encargos' : ''} de ${c} (dia 20)`, encMes)
  }
  for (const ano of [...new Set(competencias.map((c) => c.slice(0, 4)))]) {
    const avos = competencias.filter((c) => c.slice(0, 4) === ano).length
    if (!competencias.includes(`${ano}-12`)) continue // o 13º desse ano cai fora da janela
    const total = Math.round((remun * avos) / 12)
    const p1 = competencias.includes(`${ano}-11`) ? Math.round(total / 2) : 0
    const encPct = per.remun ? per.encargosMes / per.remun : 0
    add(`${ano}-11`, `13º — 1ª parcela (${avos}/12, até 30/11)`, p1)
    add(`${ano}-12`, `13º — 2ª parcela (até 20/12)`, total - p1)
    add(`${ano}-12`, '13º — encargos da 1ª parcela', Math.round(p1 * encPct))
    add(somaMes(`${ano}-12`, 1), '13º — encargos da 2ª parcela', Math.round((total - p1) * encPct))
  }
  const fluxo = meses.map((m) => { const itens = caixa.get(m)!; return { mes: m, valor: reais(itens.reduce((s, i) => s + i.valor, 0)), itens: itens.map((i) => ({ rotulo: i.rotulo, valor: reais(i.valor) })) } })
  const totalCaixa = fluxo.reduce((s, i) => s + centavos(i.valor), 0)

  // retorno esperado: receita nova × margem, crescendo em linha reta até a produtividade plena
  const b = p.base
  const margem = x.margemPct != null && x.margemPct > 0 ? Math.min(100, x.margemPct) : b.margemContribuicaoPct != null && b.margemContribuicaoPct > 0 ? b.margemContribuicaoPct : null
  const receitaNova = centavos(Math.max(0, x.receitaAdicionalMes ?? 0)) * qtd
  const rampa = Math.round(lim(x.rampaMeses, 0, 12, 0))
  let retorno: null | { receita_adicional_mensal: number; margem_pct: number; margem_origem: 'informada' | 'dre'; contribuicao_mensal_plena: number; resultado_mensal_pleno: number; prazo_para_se_pagar_meses: number | null; roi_12_meses_pct: number; resultado_12_meses: number } = null
  if (receitaNova > 0 && margem != null) {
    const plena = Math.round((receitaNova * margem) / 100)
    let acum = -entrada, pago: number | null = null, contrib12 = 0
    for (let i = 1; i <= 24; i++) {
      const c = rampa > 0 ? Math.round((plena * Math.min(i, rampa)) / rampa) : plena
      if (i <= 12) contrib12 += c
      acum += c - mensal
      if (pago == null && acum >= 0) pago = i
    }
    const custo12 = mensal * 12 + entrada
    retorno = { receita_adicional_mensal: reais(receitaNova), margem_pct: margem, margem_origem: x.margemPct ? 'informada' : 'dre', contribuicao_mensal_plena: reais(plena), resultado_mensal_pleno: reais(plena - mensal),
      prazo_para_se_pagar_meses: pago, roi_12_meses_pct: custo12 ? Math.round(((contrib12 - custo12) / custo12) * 1000) / 10 : 0, resultado_12_meses: reais(contrib12 - custo12) }
  }
  const receitaEquilibrio = margem ? reais(Math.round((mensal * 100) / margem)) : null

  // Fator R (só no Simples): folha lançada nos 12 meses + esta contratação em 12 meses (salário, encargos e FGTS — LC 123, art. 18, § 24)
  let fatorR: null | { antes_pct: number | null; depois_pct: number; anexo_antes: 'III' | 'V' | null; anexo_depois: 'III' | 'V' } = null
  if (p.regime === 'simples' && b.receita12 && b.receita12 > 0) {
    const folhaAntes = centavos(b.folha12Lancada ?? 0), rec = centavos(b.receita12)
    const folhaNova = (per.remun + per.prov13 + per.provFerias + per.fgts + per.patronal) * qtd * 12
    const f = (fol: number) => ({ pctv: Math.floor((fol / rec) * 10000) / 100, anexo: (fol * 100 >= rec * 28 ? 'III' : 'V') as 'III' | 'V' })
    const a = folhaAntes > 0 ? f(folhaAntes) : null, d = f(folhaAntes + folhaNova)
    fatorR = { antes_pct: a?.pctv ?? null, depois_pct: d.pctv, anexo_antes: a?.anexo ?? null, anexo_depois: d.anexo }
  }

  // Se não der certo: desligar sem justa causa depois de 12 meses (aviso indenizado, multa de 40% sobre o FGTS depositado)
  let desligamento: null | { custo_por_pessoa: number; verbas: number; multa_fgts: number; aviso_dias: number } = null
  try {
    const adm = `${p.mesInicio}-01`
    const fim = `${somaMes(p.mesInicio, 12)}-01`
    const ultimo = new Date(Date.parse(fim + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10)
    const fixo = reais(per.s + per.peric + per.insal), variaveis = reais(per.he + per.dsr + per.noturno + per.comissao)
    const saldoFgts = reais(pct(per.remun, p.codCateg === '103' ? 2 : 8) * 12 + pct(per.remun, p.codCateg === '103' ? 2 : 8))
    const r = calcularRescisao({ motivo: '02', admissao: adm, desligamento: ultimo, codCateg: p.codCateg, tpContr: 1, salarioMensal: fixo, mediaVariaveis: variaveis, aviso: 'indenizado', saldoFgts, adiantamento13: 0 }, REGRAS_2026)
    desligamento = { custo_por_pessoa: reais(centavos(r.bruto) + centavos(r.fgts.multa ?? 0)), verbas: r.bruto, multa_fgts: r.fgts.multa ?? 0, aviso_dias: r.avisoDias }
  } catch { desligamento = null }

  const pessoalDepois = b.custoPessoalAtual != null ? centavos(b.custoPessoalAtual) + mensal : null
  const pctFat = (v: number | null) => (v != null && b.receitaMediaMensal ? Math.round((v / centavos(b.receitaMediaMensal)) * 1000) / 10 : null)
  const lucroDepois = b.lucroMedioMensal != null ? reais(centavos(b.lucroMedioMensal) - mensal + (retorno ? centavos(retorno.contribuicao_mensal_plena) : 0)) : null
  const quatroMeses = fluxo.slice(0, 4).reduce((s, i) => s + centavos(i.valor), 0)
  const alertas: string[] = []
  if (b.folhaForaDaDre) alertas.push('a folha atual não está (toda) lançada em Custos Fixos: o lucro médio da DRE está MAIOR que o real e o impacto desta contratação é pior do que parece')
  if (pessoalDepois != null && b.receitaMediaMensal && pessoalDepois > centavos(b.receitaMediaMensal)) alertas.push('o custo de pessoal passa do faturamento médio mensal')
  if (lucroDepois != null && lucroDepois < 0) alertas.push('com essa contratação o lucro médio mensal fica NEGATIVO')
  else if (lucroDepois != null && b.lucroMedioMensal != null && b.lucroMedioMensal > 0 && lucroDepois < b.lucroMedioMensal * 0.5) alertas.push('a contratação consome mais da metade do lucro médio mensal')
  if (b.caixa != null && centavos(b.caixa) < quatroMeses) alertas.push('o caixa de hoje não cobre os primeiros meses dessa contratação')
  if (retorno && retorno.resultado_mensal_pleno < 0) alertas.push('mesmo com a receita esperada a contratação não se paga: a contribuição mensal fica abaixo do custo')
  else if (retorno && retorno.prazo_para_se_pagar_meses == null) alertas.push('a contratação não se paga em 24 meses com a receita e a rampa informadas')
  if (x.horasExtrasMes && x.horasExtrasMes > 44) alertas.push('mais de 2 horas extras por dia útil em média: a CLT limita a 2 horas por dia (art. 59) — risco trabalhista')
  if (fatorR && fatorR.anexo_antes === 'V' && fatorR.anexo_depois === 'III') alertas.push('a contratação leva o Fator R a 28% ou mais: se a atividade estiver sujeita ao Fator R, o Simples pode passar do Anexo V para o III (imposto menor)')
  if (fluxo.some((i) => i.itens.some((t) => t.rotulo.startsWith('13º')))) alertas.push('novembro e dezembro têm o 13º: o caixa precisa de folga nesses meses')

  const hTrab = per.jornada * 52 / 12
  return {
    quantidade: qtd, regime: p.regime, base_inss_patronal: inssPatronalPct(p.regime, p.codCateg).base,
    por_pessoa: {
      salario: reais(per.s), adicionais: reais(per.peric + per.insal + per.noturno), variaveis: reais(per.he + per.dsr + per.comissao), remuneracao: reais(per.remun),
      provisoes_13_ferias: reais(per.prov13 + per.provFerias), fgts: reais(per.fgts), inss_patronal: reais(per.patronal), rat_fap: reais(per.ratFap), terceiros: reais(per.terceiros),
      beneficios: reais(per.beneficios), vale_transporte_empresa: reais(per.vt), custo_mensal: reais(per.total),
      multiplicador: per.s ? Math.round((per.total / per.s) * 100) / 100 : null, custo_hora_trabalhada: reais(Math.round(per.total / hTrab)),
      detalhe: { periculosidade: reais(per.peric), insalubridade: reais(per.insal), adicional_noturno: reais(per.noturno), horas_extras: reais(per.he), reflexo_dsr: reais(per.dsr), comissao: reais(per.comissao), divisor_horas: per.divisor },
    },
    custo_mensal_total: reais(mensal), custo_entrada: reais(entrada), custo_12_meses: reais(mensal * 12 + entrada), caixa_primeiro_ano: reais(totalCaixa), fluxo,
    impacto: {
      lucro_medio_mensal_antes: b.lucroMedioMensal, lucro_medio_mensal_depois: lucroDepois,
      pessoal_sobre_faturamento_antes_pct: pctFat(b.custoPessoalAtual != null ? centavos(b.custoPessoalAtual) : null), pessoal_sobre_faturamento_depois_pct: pctFat(pessoalDepois),
      faturamento_medio_mensal: b.receitaMediaMensal, caixa_hoje: b.caixa,
      meses_de_folego_no_caixa: b.caixa != null && mensal > 0 ? Math.floor(centavos(b.caixa) / mensal) : null,
      receita_minima_para_se_pagar: receitaEquilibrio, margem_usada_pct: margem,
    },
    retorno, fator_r: fatorR, desligamento_apos_12_meses: desligamento,
    alertas,
    premissas: [
      'remuneração = salário + adicionais (periculosidade, insalubridade, noturno) + horas extras com reflexo no descanso (≈ 1/6) + comissão média; provisões de 13º e férias + 1/3 sobre ela',
      p.regime === 'presumido' || p.regime === 'real' ? `encargos: INSS 20% + RAT ${lim(x.ratPct, 0, 3, 2)}% × FAP ${lim(x.fap, 0.5, 2, 1)} + terceiros ${lim(x.terceirosPct, 0, 10, 5.8)}% — confira RAT, FAP e terceiros (FPAS) na sua DCTFWeb` : 'Simples Nacional: INSS patronal, RAT e terceiros já estão no DAS (Anexo IV paga à parte)',
      'vale-transporte: a Empresa paga só o que passar de 6% do salário-base; benefícios não entram na base de encargos',
      'caixa: remuneração no 5º dia útil e encargos no dia 20 do mês seguinte; benefícios no próprio mês; 13º em 30/11 e 20/12; custos de entrada no 1º mês; primeiras férias só depois de 12 meses',
      'lucro, faturamento e margem de contribuição: médias dos últimos 12 meses completos da DRE (competência); com receita esperada, o lucro "depois" já soma a contribuição dela',
      'desligamento: sem justa causa depois de 12 meses, aviso indenizado, multa de 40% sobre o FGTS depositado na simulação',
    ],
  }
}
