// Cálculo da rescisão (verbas rescisórias) — decisão do Elias (09/11/2026): "o Axioma calcula a rescisão".
// Sem IA: regras com fonte, valores da lei vindos de rh_regras (vigência). Testado em scripts/check-rh-rescisao.mts.
// Fontes: CLT arts. 130, 146, 147, 477, 479, 480, 484, 484-A, 487 e 502; Lei 12.506/2011 (aviso proporcional);
// Lei 4.090/1962 (13º); CF art. 7º XVII (1/3 de férias); Súmulas TST 14, 171, 261 e 305; Lei 8.036/1990 art. 18 e
// Decreto 99.684/1990 art. 14 (multa do FGTS); Lei 7.713/1988 art. 6º V (indenizações isentas de IR); Lei 9.430/1996 art. 67;
// Portaria Interministerial MPS/MF nº 13/2026 (INSS 2026); Receita Federal — tabela 2026 e redução da Lei 15.270/2025.
// ponytail: não calcula médias de variáveis sozinho (o usuário informa a média), nem intermitente, nem pensão alimentícia.

export type FaixaInss = { ate: number; aliq: number }
export type FaixaIrrf = { ate: number | null; aliq: number; deduzir: number }
export type RegrasFolha = {
  inss: FaixaInss[]              // progressiva; a última faixa termina no teto
  irrf: FaixaIrrf[]              // tabela mensal
  irrfDependente: number         // dedução mensal por dependente
  irrfSimplificado: number       // desconto simplificado mensal (alternativa às deduções legais)
  reducao: { isentoAte: number; faixaAte: number; a: number; b: number } // Lei 15.270: até isentoAte zera; até faixaAte reduz a − b×renda
  irrfMinimo: number             // retenção igual ou abaixo disto é dispensada (Lei 9.430/1996 art. 67)
  fonte: string
}

export type Motivo = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '17' | '26' | '27' | '33' | '38' | '41' | '42' | '47' | '48' | '49'
type Regra = { aviso: 'empregador' | 'empregado' | 'metade' | 'nenhum'; decimo: number; ferias: number; multa: 0 | 20 | 40; art479?: boolean; art480?: boolean }
const R = (aviso: Regra['aviso'], decimo: number, ferias: number, multa: Regra['multa'], extra: Partial<Regra> = {}): Regra => ({ aviso, decimo, ferias, multa, ...extra })
/** Regras por motivo (Tabela 19). decimo/ferias = fração devida dos proporcionais (1 = integral, 0.5 = metade, 0 = perde). */
export const REGRAS_MOTIVO: Record<Motivo, Regra & { nome: string }> = {
  '01': { ...R('nenhum', 0, 0, 0), nome: 'Justa causa (CLT art. 482)' },                                   // Lei 4.090 art. 3º e CLT art. 146 p.ú.: perde proporcionais
  '02': { ...R('empregador', 1, 1, 40), nome: 'Dispensa sem justa causa' },
  '03': { ...R('nenhum', 1, 1, 40, { art479: true }), nome: 'Rescisão antecipada do contrato a termo pela empresa (CLT art. 479)' },
  '04': { ...R('nenhum', 1, 1, 0, { art480: true }), nome: 'Rescisão antecipada do contrato a termo pelo empregado (CLT art. 480)' },
  '05': { ...R('metade', 0.5, 0.5, 20), nome: 'Culpa recíproca (CLT art. 484 e Súmula 14 TST)' },
  '06': { ...R('nenhum', 1, 1, 0), nome: 'Término do contrato a termo' },
  '07': { ...R('empregado', 1, 1, 0), nome: 'Pedido de demissão (Súmula 261 TST: férias proporcionais devidas)' },
  '08': { ...R('nenhum', 1, 1, 0), nome: 'Iniciativa do empregado — CLT arts. 394 e 483 § 1º' },
  '09': { ...R('nenhum', 1, 1, 0), nome: 'Opção do empregado por falecimento do empregador individual (CLT art. 483 § 2º)' },
  '10': { ...R('nenhum', 1, 1, 0), nome: 'Falecimento do empregado' },
  '17': { ...R('empregador', 1, 1, 40), nome: 'Rescisão indireta (CLT art. 483)' },
  '26': { ...R('empregador', 1, 1, 40), nome: 'Paralisação por ato de autoridade (CLT art. 486)' },
  '27': { ...R('nenhum', 1, 1, 20), nome: 'Força maior (CLT art. 502)' },
  '33': { ...R('metade', 1, 1, 20), nome: 'Acordo entre as partes (CLT art. 484-A)' },
  '38': { ...R('nenhum', 1, 1, 0), nome: 'Aposentadoria (a pedido)' },
  '41': { ...R('nenhum', 1, 1, 0), nome: 'Aprendiz: desempenho insuficiente ou inadaptação (CLT art. 433 I)' },
  '42': { ...R('nenhum', 1, 1, 0), nome: 'Aprendiz: ausência injustificada à escola (CLT art. 433 III)' },
  '47': { ...R('empregador', 1, 1, 40), nome: 'Encerramento da empresa ou estabelecimento' },
  '48': { ...R('empregador', 1, 1, 40), nome: 'Falecimento do empregador individual sem continuação' },
  '49': { ...R('empregador', 1, 1, 40), nome: 'Falecimento do empregador doméstico sem continuação' },
}

export type EntradaRescisao = {
  motivo: Motivo
  admissao: string; desligamento: string               // desligamento = último dia trabalhado
  codCateg: string; tpContr: number; dataTermino?: string | null; clauAssec?: boolean | null
  salarioMensal: number                                 // salário fixo convertido para mês (ver salarioMensalDe)
  mediaVariaveis?: number                               // média mensal de horas extras/comissões dos últimos 12 meses (opcional)
  aviso?: 'indenizado' | 'trabalhado' | 'descontado' | 'dispensado' // empregador: indenizado/trabalhado; pedido: trabalhado/descontado/dispensado
  feriasVencidas?: number                               // períodos aquisitivos completos ainda não gozados (0, 1 ou 2)
  faltasPeriodoAtual?: number                           // faltas injustificadas no período aquisitivo atual (CLT art. 130)
  dependentesIR?: number
  adiantamento13?: number                               // 1ª parcela do 13º já paga no ano
  descontar480?: boolean                                // pedido antecipado do contrato a termo: descontar a indenização do art. 480
  saldoFgts?: number | null                             // saldo do extrato do FGTS (para a multa); vazio = sem estimativa
}

export type Verba = {
  nat: string; nome: string; qtd?: number; valor: number; tipo: 'provento' | 'desconto'
  cp: 'mensal' | '13' | null; ir: 'mensal' | '13' | 'isento' | null; fgts: 'mensal' | '13' | 'aviso' | null
}
export type ResultadoRescisao = {
  motivo: string; verbas: Verba[]; bruto: number; descontos: number; liquido: number
  avisoDias: number; avisoIndenizadoDias: number; projecao: string; prazoPagamento: string
  inss: { mensal: number; decimo: number }; irrf: { mensal: number; decimo: number }
  fgts: { aliquota: number; base: number; deposito: number; multaPct: number; multa: number | null }
  avisos: string[]
}

// ---------- datas (tudo em UTC, sem fuso) ----------
const d = (iso: string) => new Date(iso + 'T00:00:00Z')
const iso = (x: Date) => x.toISOString().slice(0, 10)
const addDias = (s: string, n: number) => iso(new Date(d(s).getTime() + n * 86400000))
const addAnos = (s: string, n: number) => { const x = d(s); x.setUTCFullYear(x.getUTCFullYear() + n); return iso(x) }
const addMeses = (s: string, n: number) => { const x = d(s); const dia = x.getUTCDate(); x.setUTCDate(1); x.setUTCMonth(x.getUTCMonth() + n); const ult = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate(); x.setUTCDate(Math.min(dia, ult)); return iso(x) }
const diasEntre = (a: string, b: string) => Math.round((d(b).getTime() - d(a).getTime()) / 86400000) // b − a
// centavos exatos: 121,575 → 121,58 (sem o erro de ponto flutuante 121,57499…)
const r2 = (n: number) => Math.round(Number((n * 100).toFixed(6))) / 100

/** Anos completos de serviço entre a admissão e a data. */
export function anosCompletos(admissao: string, data: string): number {
  let n = 0
  while (addAnos(admissao, n + 1) <= addDias(data, 1)) n++
  return n
}
/** Aviso prévio proporcional (Lei 12.506/2011): 30 dias + 3 por ano completo, até 90. */
export const diasAvisoProporcional = (admissao: string, desligamento: string) => Math.min(90, 30 + 3 * anosCompletos(admissao, desligamento))

/** Avos do 13º no ano de `fim`: meses com 15 dias ou mais trabalhados (Lei 4.090/1962 art. 1º § 2º). */
export function avos13(admissao: string, fim: string): number {
  const ano = d(fim).getUTCFullYear()
  let n = 0
  for (let m = 0; m < 12; m++) {
    const ini = iso(new Date(Date.UTC(ano, m, 1))), ult = iso(new Date(Date.UTC(ano, m + 1, 0)))
    const de = admissao > ini ? admissao : ini, ate = fim < ult ? fim : ult
    if (ate >= de && diasEntre(de, ate) + 1 >= 15) n++
  }
  return n
}
/** Avos de férias proporcionais no período aquisitivo que começa em `inicio`: mês completo ou fração de 15 dias ou mais (CLT art. 146 p.ú.). */
export function avosFerias(inicio: string, fim: string): number {
  if (fim < inicio) return 0
  let n = 0, cur = inicio
  while (n < 12) {
    const prox = addMeses(cur, 1)
    if (addDias(prox, -1) <= fim) { n++; cur = prox; continue }
    if (diasEntre(cur, fim) + 1 >= 15) n++
    break
  }
  return n
}
/** Dias de férias pelo número de faltas injustificadas (CLT art. 130). */
export const diasFeriasPorFaltas = (faltas: number) => (faltas <= 5 ? 30 : faltas <= 14 ? 24 : faltas <= 23 ? 18 : faltas <= 32 ? 12 : 0)

/** INSS do empregado: progressivo por faixa até o teto (Portaria MPS/MF nº 13/2026). */
export function inssProgressivo(base: number, faixas: FaixaInss[]): number {
  let total = 0, de = 0
  for (const f of faixas) { const ate = Math.min(base, f.ate); if (ate > de) total += (ate - de) * f.aliq; de = f.ate; if (base <= f.ate) break }
  return r2(total)
}
/** IRRF com a tabela progressiva e a redução da Lei 15.270 (sobre o rendimento bruto), limitada ao imposto. */
export function irrf(bruto: number, deducoes: number, regras: RegrasFolha, permiteSimplificado: boolean): number {
  const ded = permiteSimplificado ? Math.max(deducoes, regras.irrfSimplificado) : deducoes
  const base = Math.max(0, bruto - ded)
  const f = regras.irrf.find((x) => x.ate === null || base <= x.ate)!
  const imposto = Math.max(0, base * f.aliq - f.deduzir)
  const red = bruto <= regras.reducao.isentoAte ? imposto : bruto <= regras.reducao.faixaAte ? Math.max(0, regras.reducao.a - regras.reducao.b * bruto) : 0
  const v = r2(Math.max(0, imposto - Math.min(imposto, red)))
  return v <= regras.irrfMinimo ? 0 : v
}
/** Salário fixo convertido para mês (horista: horas semanais × 5; diarista × 30; semanal ÷ 7 × 30; quinzenal × 2). */
export function salarioMensalDe(und: number, valor: number, horasSemana?: number | null): number | null {
  switch (und) {
    case 5: return valor
    case 1: return horasSemana ? r2(valor * horasSemana * 5) : null
    case 2: return r2(valor * 30)
    case 3: return r2((valor / 7) * 30)
    case 4: return r2(valor * 2)
    default: return null // tarefa/variável: o usuário informa a média
  }
}

export function calcularRescisao(e: EntradaRescisao, regras: RegrasFolha): ResultadoRescisao {
  const regra = REGRAS_MOTIVO[e.motivo]
  if (!regra) throw new Error(`Motivo ${e.motivo} não é calculado pelo Axioma`)
  if (e.desligamento < e.admissao) throw new Error('Desligamento antes da admissão')
  const avisos: string[] = []
  const base = r2(e.salarioMensal + (e.mediaVariaveis ?? 0))
  const dia = base / 30
  const verbas: Verba[] = []
  const add = (v: Verba) => { if (v.valor > 0) verbas.push({ ...v, valor: r2(v.valor) }) }

  // contrato a termo com cláusula assecuratória (CLT art. 481): segue as regras do prazo indeterminado
  let r: Regra = regra
  if ((e.motivo === '03' || e.motivo === '04') && e.clauAssec) { r = e.motivo === '03' ? REGRAS_MOTIVO['02'] : REGRAS_MOTIVO['07']; avisos.push('Contrato com cláusula assecuratória (CLT art. 481): aplicadas as regras do prazo indeterminado.') }

  // aviso prévio
  const proporcional = diasAvisoProporcional(e.admissao, e.desligamento)
  let avisoDias = 0, indenizados = 0
  if (r.aviso === 'empregador') {
    avisoDias = proporcional
    if ((e.aviso ?? 'indenizado') === 'indenizado') indenizados = proporcional
    else { indenizados = proporcional - 30; avisos.push('Aviso trabalhado: os 30 dias entram no saldo; os dias proporcionais além de 30 são indenizados (Nota Técnica MTE 184/2012).') }
  } else if (r.aviso === 'metade') {
    avisoDias = proporcional; indenizados = Math.floor(proporcional / 2)
  } else if (r.aviso === 'empregado') {
    avisoDias = 30 // proporcionalidade só beneficia o empregado (Lei 12.506 e Nota Técnica MTE 184/2012)
    if (e.aviso === 'descontado') add({ nat: '6901', nome: 'Desconto do aviso prévio não cumprido (CLT art. 487 § 2º)', qtd: 30, valor: dia * 30, tipo: 'desconto', cp: null, ir: null, fgts: null })
  }
  const projecao = addDias(e.desligamento, indenizados)
  if (indenizados > 0) add({ nat: '6003', nome: `Aviso prévio indenizado (${indenizados} dias)`, qtd: indenizados, valor: dia * indenizados, tipo: 'provento', cp: null, ir: 'isento', fgts: 'aviso' })

  // saldo de salário: dias trabalhados no mês do desligamento (mês comercial de 30 dias)
  const fimMes = iso(new Date(Date.UTC(d(e.desligamento).getUTCFullYear(), d(e.desligamento).getUTCMonth() + 1, 0)))
  const inicioMes = e.desligamento.slice(0, 8) + '01'
  const de = e.admissao > inicioMes ? e.admissao : inicioMes
  const diasSaldo = e.desligamento === fimMes && de === inicioMes ? 30 : Math.min(30, diasEntre(de, e.desligamento) + 1)
  add({ nat: '6000', nome: `Saldo de salário (${diasSaldo} dias)`, qtd: diasSaldo, valor: dia * diasSaldo, tipo: 'provento', cp: 'mensal', ir: 'mensal', fgts: 'mensal' })

  // 13º proporcional (+ avos da projeção do aviso indenizado)
  if (r.decimo > 0) {
    const real = avos13(e.admissao, e.desligamento)
    let proj = 0
    if (projecao > e.desligamento) {
      const fimAno = `${e.desligamento.slice(0, 4)}-12-31`
      proj = avos13(e.admissao, projecao < fimAno ? projecao : fimAno) - real
      if (projecao > fimAno) proj += avos13(e.admissao, projecao) // virou o ano
    }
    add({ nat: '6002', nome: `13º salário proporcional (${real}/12)`, qtd: real, valor: (base / 12) * real * r.decimo, tipo: 'provento', cp: '13', ir: '13', fgts: '13' })
    add({ nat: '6001', nome: `13º sobre o aviso prévio indenizado (${proj}/12)`, qtd: proj, valor: (base / 12) * proj * r.decimo, tipo: 'provento', cp: '13', ir: '13', fgts: '13' })
  }
  // 1ª parcela do 13º já paga no ano: desconta sempre (na justa causa o 13º proporcional não é devido)
  add({ nat: '9214', nome: '13º salário — desconto da 1ª parcela já adiantada', valor: e.adiantamento13 ?? 0, tipo: 'desconto', cp: null, ir: null, fgts: null })

  // férias vencidas (dobro se passou o prazo concessivo — CLT art. 137) e proporcionais (+1/3 — CF art. 7º XVII)
  const completos = anosCompletos(e.admissao, e.desligamento)
  const vencidas = Math.min(e.feriasVencidas ?? 0, completos)
  for (let i = 0; i < vencidas; i++) {
    const fimAquisitivo = addDias(addAnos(e.admissao, completos - vencidas + i + 1), -1)
    const dobro = e.desligamento > addAnos(fimAquisitivo, 1)
    add({ nat: dobro ? '6004' : '6007', nome: `Férias ${dobro ? 'em dobro (CLT art. 137)' : 'vencidas'} + 1/3 — período até ${fimAquisitivo.split('-').reverse().join('/')}`, qtd: 30, valor: base * (dobro ? 2 : 1) * (4 / 3), tipo: 'provento', cp: null, ir: 'isento', fgts: null })
  }
  if ((e.feriasVencidas ?? 0) > completos) avisos.push('Mais períodos vencidos do que anos completos de contrato: considerados só os possíveis.')
  if (r.ferias > 0) {
    const inicioAtual = addAnos(e.admissao, anosCompletos(e.admissao, projecao))
    const avos = avosFerias(inicioAtual, projecao)
    const diasDireito = diasFeriasPorFaltas(e.faltasPeriodoAtual ?? 0)
    add({ nat: '6006', nome: `Férias proporcionais + 1/3 (${avos}/12${diasDireito < 30 ? `, ${diasDireito} dias pelas faltas` : ''})`, qtd: avos, valor: dia * diasDireito * (avos / 12) * (4 / 3) * r.ferias, tipo: 'provento', cp: null, ir: 'isento', fgts: null })
  }

  // contrato a termo: art. 479 (empresa paga metade do restante) / art. 480 (empregado indeniza, até o mesmo limite)
  if ((r.art479 || r.art480) && e.dataTermino && e.dataTermino > e.desligamento) {
    const restantes = diasEntre(e.desligamento, e.dataTermino)
    if (r.art479) add({ nat: '6104', nome: `Indenização do art. 479 da CLT (metade de ${restantes} dias)`, qtd: restantes, valor: dia * restantes / 2, tipo: 'provento', cp: null, ir: 'isento', fgts: null })
    if (r.art480 && e.descontar480) add({ nat: '6904', nome: `Indenização do art. 480 da CLT (até metade de ${restantes} dias)`, qtd: restantes, valor: dia * restantes / 2, tipo: 'desconto', cp: null, ir: null, fgts: null })
  }

  // INSS (mensal e 13º separados) e IRRF (mensal e 13º, exclusivo na fonte)
  const soma = (f: (v: Verba) => boolean) => r2(verbas.filter(f).reduce((s, v) => s + (v.tipo === 'provento' ? v.valor : 0), 0))
  const baseCpMensal = soma((v) => v.cp === 'mensal'), baseCp13 = soma((v) => v.cp === '13')
  const inssMensal = inssProgressivo(baseCpMensal, regras.inss), inss13 = inssProgressivo(baseCp13, regras.inss)
  const dep = (e.dependentesIR ?? 0) * regras.irrfDependente
  const irMensal = irrf(soma((v) => v.ir === 'mensal'), inssMensal + dep, regras, true)
  const ir13 = irrf(soma((v) => v.ir === '13'), inss13 + dep, regras, false)
  add({ nat: '9201', nome: 'INSS sobre o saldo de salário', valor: inssMensal, tipo: 'desconto', cp: 'mensal', ir: null, fgts: null })
  add({ nat: '9201', nome: 'INSS sobre o 13º', valor: inss13, tipo: 'desconto', cp: '13', ir: null, fgts: null })
  add({ nat: '9203', nome: 'Imposto de Renda sobre o saldo', valor: irMensal, tipo: 'desconto', cp: null, ir: 'mensal', fgts: null })
  add({ nat: '9203', nome: 'Imposto de Renda sobre o 13º', valor: ir13, tipo: 'desconto', cp: null, ir: '13', fgts: null })

  // FGTS: depósito do mês da rescisão (8%; aprendiz 2% — Lei 8.036 art. 15) e multa (40% ou 20%) sobre saldo + depósito
  const aliq = e.codCateg === '103' ? 0.02 : 0.08
  const baseFgts = soma((v) => v.fgts !== null)
  const deposito = r2(baseFgts * aliq)
  const multaPct = e.codCateg === '104' ? 0 : r.multa
  if (e.codCateg === '104' && r.multa) avisos.push('Doméstico: a indenização do FGTS (3,2% ao mês, LC 150/2015 art. 22) já foi recolhida mês a mês; não há multa na rescisão.')
  const multa = multaPct && e.saldoFgts != null ? r2((e.saldoFgts + deposito) * multaPct / 100) : null
  if (multaPct && e.saldoFgts == null) avisos.push(`Multa de ${multaPct}% do FGTS: informe o saldo do extrato do FGTS para calcular. Ela é recolhida pela guia do FGTS Digital, não entra no termo de rescisão.`)

  const bruto = r2(verbas.filter((v) => v.tipo === 'provento').reduce((s, v) => s + v.valor, 0))
  const descontos = r2(verbas.filter((v) => v.tipo === 'desconto').reduce((s, v) => s + v.valor, 0))
  return {
    motivo: regra.nome, verbas, bruto, descontos, liquido: r2(bruto - descontos),
    avisoDias, avisoIndenizadoDias: indenizados, projecao, prazoPagamento: addDias(e.desligamento, 10), // CLT art. 477 § 6º
    inss: { mensal: inssMensal, decimo: inss13 }, irrf: { mensal: irMensal, decimo: ir13 },
    fgts: { aliquota: aliq, base: baseFgts, deposito, multaPct, multa }, avisos,
  }
}

/** Regras de 2026 (as mesmas gravadas em rh_regras) — usadas nos testes e como reserva se a leitura falhar. */
export const REGRAS_2026: RegrasFolha = {
  inss: [{ ate: 1621.0, aliq: 0.075 }, { ate: 2902.84, aliq: 0.09 }, { ate: 4354.27, aliq: 0.12 }, { ate: 8475.55, aliq: 0.14 }],
  irrf: [{ ate: 2428.8, aliq: 0, deduzir: 0 }, { ate: 2826.65, aliq: 0.075, deduzir: 182.16 }, { ate: 3751.05, aliq: 0.15, deduzir: 394.16 }, { ate: 4664.68, aliq: 0.225, deduzir: 675.49 }, { ate: null, aliq: 0.275, deduzir: 908.73 }],
  irrfDependente: 189.59, irrfSimplificado: 607.2,
  reducao: { isentoAte: 5000, faixaAte: 7350, a: 978.62, b: 0.133145 },
  irrfMinimo: 10,
  fonte: 'Portaria Interministerial MPS/MF nº 13/2026 (INSS) · Receita Federal, Tributação de 2026 e Lei 15.270/2025 (IRRF)',
}
