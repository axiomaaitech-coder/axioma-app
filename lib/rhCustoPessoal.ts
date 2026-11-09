// ═══════════════════════════════════════════════════════════════
// RH ↔ FINANCEIRO · Custo de pessoal estimado (2026-11-09, pedido do Elias: interligar o RH com o financeiro para a IA).
// O RH é a fonte do "quanto a folha deveria custar"; o financeiro (Custos Fixos, Contas a Pagar, Fluxo, DRE) continua
// sendo o que foi LANÇADO/PAGO. Nada aqui grava em módulo financeiro: a ponte compara os dois e mostra a diferença
// (sem contar duas vezes). Estimativa mensal por contrato ativo, só salário mensal:
//   salário + FGTS + provisões (13º e férias + 1/3) + INSS patronal conforme o regime.
// Regras conferidas em planalto.gov.br em 09/11/2026:
//   FGTS 8% (aprendiz 2%) — Lei 8.036/1990, art. 15 e § 7º; incide também sobre 13º e férias.
//   13º = 1/12 por mês (Lei 4.090/1962); férias + 1/3 = 1/12 × 4/3 por mês (CF art. 7º, XVII).
//   INSS patronal 20% — Lei 8.212/1991, art. 22, I (Lucro Presumido/Real). RAT×FAP e terceiros NÃO são calculados
//     (dependem do CNAE/FPAS de cada lotação) — ficam como limitação, nunca estimados no escuro.
//   Simples Nacional: a contribuição patronal já está no DAS (LC 123, art. 13, VI), exceto Anexo IV (art. 18, § 5º-C).
//   MEI com empregado: 3% sobre o salário (LC 123, art. 18-C, § 1º, III).
//   Doméstico (categoria 104): 8% INSS + 0,8% seguro acidente + 8% FGTS + 3,2% indenização (LC 150/2015, art. 34).
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './financeiro/contrato'

export type ContratoCusto = { id: string; colaborador_id: string; cod_categ: string; departamento_id: string | null }
export type SalarioVigente = { und_sal_fixo: number; valor: number }
export type Regime = 'mei' | 'simples' | 'presumido' | 'real' | null

export function regimeDaEmpresa(r: string | null | undefined): Regime {
  const x = String(r ?? '').toLowerCase()
  if (!x) return null
  if (x === 'mei') return 'mei'
  if (x.includes('simples')) return 'simples'
  if (x.includes('presumido')) return 'presumido'
  if (x.includes('real')) return 'real'
  return null
}

// Percentual de INSS patronal (sobre salário + 13º + férias) e o que fica de fora, por regime e categoria.
export function inssPatronalPct(regime: Regime, codCateg: string): { pct: number | null; base: string } {
  if (codCateg === '104') return { pct: 8.8, base: 'LC 150/2015, art. 34 (8% INSS + 0,8% seguro acidente)' }
  if (regime === 'mei') return { pct: 3, base: 'LC 123, art. 18-C, § 1º, III (MEI: 3%)' }
  if (regime === 'simples') return { pct: 0, base: 'LC 123, art. 13, VI (já está no DAS; Anexo IV paga à parte)' }
  if (regime === 'presumido' || regime === 'real') return { pct: 20, base: 'Lei 8.212/1991, art. 22, I (20%; RAT×FAP e terceiros não incluídos)' }
  return { pct: null, base: 'regime tributário não informado (Config → Empresa)' }
}

export function custoMensalContrato(k: ContratoCusto, sal: SalarioVigente | undefined, regime: Regime) {
  if (!sal || Number(sal.und_sal_fixo) !== 5) return null
  const s = centavos(sal.valor)
  const fgtsPct = k.cod_categ === '103' ? 2 : 8
  const prov13 = Math.round(s / 12)
  const provFerias = Math.round((s * 4) / 3 / 12)
  const fgts = Math.round(((s + prov13 + provFerias) * fgtsPct) / 100)
  const indenizDomestico = k.cod_categ === '104' ? Math.round(((s + prov13 + provFerias) * 3.2) / 100) : 0
  const inss = inssPatronalPct(regime, k.cod_categ)
  const patronal = inss.pct == null ? 0 : Math.round(((s + prov13 + provFerias) * inss.pct) / 100)
  return { salario: s, fgts: fgts + indenizDomestico, provisoes: prov13 + provFerias, inss_patronal: patronal, patronal_calculado: inss.pct != null, total: s + fgts + indenizDomestico + prov13 + provFerias + patronal }
}

export function custoPessoal(p: {
  contratos: ContratoCusto[]; salario: Map<string, SalarioVigente>; regime: Regime; atividadeFiscal?: string | null
  departamentos: Map<string, { nome: string; centro_custo_id: string | null }>; centros: Map<string, string>
}) {
  let sal = 0, fgts = 0, prov = 0, inss = 0, contados = 0, naoMensais = 0, semSalario = 0, semPatronal = 0
  const porDep = new Map<string, { custo: number; pessoas: number }>(), porCc = new Map<string, { custo: number; pessoas: number }>()
  const soma = (m: Map<string, { custo: number; pessoas: number }>, k: string, v: number) => { const x = m.get(k) ?? { custo: 0, pessoas: 0 }; x.custo += v; x.pessoas++; m.set(k, x) }
  for (const k of p.contratos) {
    const sv = p.salario.get(k.id)
    if (!sv) { semSalario++; continue }
    const c = custoMensalContrato(k, sv, p.regime)
    if (!c) { naoMensais++; continue }
    contados++; sal += c.salario; fgts += c.fgts; prov += c.provisoes; inss += c.inss_patronal
    if (!c.patronal_calculado) semPatronal++
    const dep = k.departamento_id ? p.departamentos.get(k.departamento_id) : undefined
    soma(porDep, dep?.nome ?? 'sem departamento', c.total)
    soma(porCc, (dep?.centro_custo_id && p.centros.get(dep.centro_custo_id)) || 'sem centro de custo', c.total)
  }
  const lista = (m: Map<string, { custo: number; pessoas: number }>) => [...m.entries()].sort((a, b) => b[1].custo - a[1].custo).map(([nome, v]) => ({ nome, custo_mensal: reais(v.custo), pessoas: v.pessoas }))
  const limitacoes: string[] = ['estimativa mensal pelo cadastro do RH: não inclui horas extras, adicionais, comissões, faltas, benefícios (VT, VR, plano de saúde) nem a folha calculada']
  if (p.regime === 'presumido' || p.regime === 'real') limitacoes.push('INSS patronal 20% incluído; RAT×FAP (1% a 3%) e terceiros (Sistema S, salário-educação) não incluídos — dependem do CNAE e do FPAS da lotação')
  if (p.regime === 'simples') limitacoes.push(p.atividadeFiscal === 'servico' || !p.atividadeFiscal ? 'Simples: patronal considerado dentro do DAS; se a atividade for do Anexo IV (construção, vigilância, limpeza, advocacia), há 20% de INSS patronal à parte' : 'Simples: patronal considerado dentro do DAS')
  if (semPatronal) limitacoes.push(`${semPatronal} contrato(s) sem INSS patronal calculado: regime tributário não informado em Config → Empresa`)
  if (naoMensais) limitacoes.push(`${naoMensais} contrato(s) pago(s) por hora, dia, semana, tarefa ou só variável ficaram fora (não viram mês sem jornada e produção)`)
  if (semSalario) limitacoes.push(`${semSalario} contrato(s) ativo(s) sem salário cadastrado ficaram fora`)
  return {
    pessoas_contadas: contados, nao_mensais: naoMensais, sem_salario: semSalario,
    salarios: reais(sal), fgts: reais(fgts), provisoes_13_ferias: reais(prov), inss_patronal: reais(inss), custo_total_mensal: reais(sal + fgts + prov + inss),
    regime: p.regime, base_inss_patronal: inssPatronalPct(p.regime, '101').base,
    por_departamento: lista(porDep), por_centro_custo: lista(porCc), limitacoes,
  }
}

// Ponte com o financeiro: o que está LANÇADO em Custos Fixos como "Folha de pagamento" no mês × a estimativa do RH.
// Não soma um no outro (a DRE usa só o lançado); a diferença vira aviso para a pessoa conferir.
export function compararComFinanceiro(rhTotal: number, folhaLancada: number) {
  const dif = reais(centavos(rhTotal) - centavos(folhaLancada))
  const situacao = folhaLancada === 0 && rhTotal > 0 ? 'folha_nao_lancada' : Math.abs(dif) <= Math.max(1, rhTotal * 0.05) ? 'confere' : dif > 0 ? 'lancado_a_menos' : 'lancado_a_mais'
  const texto = {
    folha_nao_lancada: 'O RH estima custo de pessoal, mas Custos Fixos não tem nada em "Folha de pagamento" neste mês: a DRE e o Fluxo não estão vendo a folha.',
    confere: 'O lançado em Custos Fixos ("Folha de pagamento") confere com a estimativa do RH (diferença até 5%).',
    lancado_a_menos: 'Custos Fixos ("Folha de pagamento") está abaixo da estimativa do RH: pode faltar encargo, provisão ou pessoa.',
    lancado_a_mais: 'Custos Fixos ("Folha de pagamento") está acima da estimativa do RH: pode haver pessoa fora do RH, benefício ou lançamento antigo.',
  }[situacao]
  return { estimativa_rh: reais(centavos(rhTotal)), lancado_custos_fixos_folha: reais(centavos(folhaLancada)), diferenca: dif, situacao, texto }
}
