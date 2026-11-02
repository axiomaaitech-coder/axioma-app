// ═══════════════════════════════════════════════════════════════
// AXIOMA OVERDUE INTELLIGENCE — Fase 1: motor determinístico (sem banco, sem IA).
// Mesmas entradas → mesmo resultado; testado em scripts/check-vencidos.mts. Decisões em docs/VENCIDOS.md.
//
// Reuso (nada recalculado do zero, regra "não duplicar"):
//   • saldo do título = saldoReceber/saldoPagar (lib/financeiro/calculos) — mesma regra das telas;
//   • dias = diasEntre (lib/financeiro/periodos), igual ao saldoReceber;
//   • "em aberto" = mesmo conjunto FECHADOS de Contas Vencidas;
//   • valores em centavos inteiros (lib/financeiro/contrato).
// Dois domínios: RECEBER (recuperar o que clientes devem) e PAGAR (obrigações vencidas da empresa).
// Nada aqui grava, liquida, apaga, concede desconto ou aciona medida jurídica: só calcula e recomenda.
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from '../financeiro/contrato'
import { diasEntre } from '../financeiro/periodos'
import { saldoPagar, saldoReceber } from '../financeiro/calculos'
import { somarDiasISO } from '../datas'

export const FECHADOS = new Set(['pago', 'recebido', 'cancelado', 'cancelada'])
export type Dominio = 'receber' | 'pagar'
export type Relacao = 'b2b' | 'b2c'

export type Titulo = {
  id: string; empresaId: string; dominio: Dominio
  contraparteId: string | null; contraparteNome: string; documento?: string | null
  valor: number; quitado: number; desconto?: number | null
  vencimento: string; emissao?: string | null; quitacao?: string | null; status?: string | null
  taxaMultaPct?: number | null; taxaJurosMesPct?: number | null
}
export type Caso = {
  tituloId: string; causa?: string | null; causaConfirmada?: boolean | null; causaOrigem?: string | null
  disputaStatus?: string | null; disputaValor?: number | null; relacao?: Relacao | null
  criticidade?: 'critica' | 'alta' | 'media' | 'baixa' | null; riscoInterrupcao?: boolean | null
}
export type Promessa = {
  id: string; tituloId: string; valor: number; data: string; status?: string | null
  recebidoNaPromessa?: number | null; renegociadaDe?: string | null
}
export type Fator = { chave: string; pontos: number; texto: string }

const diasAtraso = (vencimento: string, hoje: string) => Math.max(0, diasEntre(vencimento, hoje) - 1)
const r2 = (v: number) => Math.round(v * 100) / 100
const lim = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// ─── Saldo e situação de cada título (regra única das telas) ───
export function saldoDoTitulo(t: Titulo, hoje: string): number {
  return t.dominio === 'receber'
    ? saldoReceber({ id: t.id, valor: t.valor, valor_recebido: t.quitado, valor_desconto: t.desconto ?? 0, data_vencimento: t.vencimento }, hoje).principal
    : saldoPagar({ id: t.id, valor_total: t.valor, valor_pago: t.quitado, data_vencimento: t.vencimento })
}
export const estaVencido = (t: Titulo, hoje: string) =>
  !!t.vencimento && t.vencimento < hoje && !FECHADOS.has(String(t.status ?? '').toLowerCase()) && saldoDoTitulo(t, hoje) > 0.004

// Entrada sempre de UMA empresa (dado de empresas diferentes nunca se mistura) e sem título repetido.
export function conferirEntrada(titulos: Titulo[]): Titulo[] {
  const empresas = new Set(titulos.map((t) => t.empresaId))
  if (empresas.size > 1) throw new Error('vencidos: títulos de mais de uma empresa na mesma análise')
  const vistos = new Map<string, Titulo>()
  for (const t of titulos) vistos.set(`${t.dominio}:${t.id}`, t)
  return [...vistos.values()]
}

// Disputa: o valor contestado sai da cobrança; o incontroverso continua sendo cobrado.
export function separarDisputa(saldo: number, caso?: Caso | null) {
  const aberta = !!caso?.disputaStatus && ['aberta', 'em_analise'].includes(caso.disputaStatus)
  const contestado = aberta ? Math.min(saldo, Math.max(0, Number(caso?.disputaValor) || 0)) : 0
  return { contestado: r2(contestado), incontroverso: r2(saldo - contestado), aberta }
}

// ─── 5. AGING configurável ───
export const FAIXAS_PADRAO = [7, 15, 30, 45, 60, 90, 120, 180, 360]
export type FaixaAging = { rotulo: string; de: number; ate: number | null; qtd: number; original: number; saldo: number; pctSaldo: number }

export function rotulosFaixas(limites: number[]): { de: number; ate: number | null; rotulo: string }[] {
  const l = [...new Set(limites.filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
  if (!l.length) throw new Error('vencidos: faixas de aging vazias')
  return [...l.map((ate, i) => ({ de: i ? l[i - 1] + 1 : 1, ate, rotulo: `${i ? l[i - 1] + 1 : 1}–${ate}` })), { de: l[l.length - 1] + 1, ate: null, rotulo: `${l[l.length - 1]}+` }]
}
export const faixaDe = (dias: number, limites: number[]) => { const f = rotulosFaixas(limites); const i = f.findIndex((x) => x.ate === null || dias <= x.ate); return i < 0 ? f.length - 1 : i }

export function aging(titulos: Titulo[], hoje: string, limites = FAIXAS_PADRAO) {
  const faixas: FaixaAging[] = rotulosFaixas(limites).map((f) => ({ ...f, qtd: 0, original: 0, saldo: 0, pctSaldo: 0 }))
  const porContraparte = new Map<string, number>()
  let total = 0
  for (const t of conferirEntrada(titulos).filter((x) => estaVencido(x, hoje))) {
    const s = centavos(saldoDoTitulo(t, hoje))
    const f = faixas[faixaDe(diasAtraso(t.vencimento, hoje), limites)]
    f.qtd++; f.original += centavos(t.valor); f.saldo += s; total += s
    const k = t.contraparteId ?? `sem:${t.contraparteNome}`
    porContraparte.set(k, (porContraparte.get(k) ?? 0) + s)
  }
  for (const f of faixas) { f.pctSaldo = total ? r2((f.saldo / total) * 100) : 0; f.original = reais(f.original); f.saldo = reais(f.saldo) }
  const fatias = [...porContraparte.values()].map((v) => v / (total || 1))
  // Concentração: maior devedor (%) e HHI (0–10000; acima de 2500 = carteira concentrada)
  return { faixas, total: reais(total), maiorPct: r2(Math.max(0, ...fatias) * 100), hhi: Math.round(fatias.reduce((s, p) => s + (p * 100) ** 2, 0)) }
}

// Migração entre faixas: a faixa de um título só depende do vencimento e da data, então a foto de
// qualquer data passada é reconstruída sem tabela extra. Deterioração = saldo que mudou de faixa pior.
export function migracaoAging(titulos: Titulo[], dataAnterior: string, hoje: string, limites = FAIXAS_PADRAO) {
  let entraram = 0, pioraram = 0, qtdPioraram = 0, base = 0
  for (const t of conferirEntrada(titulos).filter((x) => estaVencido(x, hoje))) {
    const s = centavos(saldoDoTitulo(t, hoje)); base += s
    if (t.vencimento >= dataAnterior) { entraram += s; continue }
    if (faixaDe(diasAtraso(t.vencimento, hoje), limites) > faixaDe(diasAtraso(t.vencimento, dataAnterior), limites)) { pioraram += s; qtdPioraram++ }
  }
  return { entraramNoVencido: reais(entraram), mudaramParaFaixaPior: reais(pioraram), qtdMudaramParaFaixaPior: qtdPioraram, indiceDeterioracaoPct: base ? r2(((entraram + pioraram) / base) * 100) : 0 }
}

// ─── 18. ENCARGOS (juros, multa, atualização) — Lei 14.905/2024 e CDC, conferidos no planalto.gov.br em 2026-11-02 ───
// • Sem índice no contrato: atualização pelo IPCA (CC art. 389, parágrafo único).
// • Sem juros no contrato: taxa legal = Selic − IPCA, nunca negativa (CC art. 406 e § 3º) — vem de fora (BCB), mensal.
// • B2C: multa de mora até 2% (CDC art. 52 § 1º). B2B: multa até o valor da obrigação (CC art. 412).
// • Lei de Usura (Decreto 22.626/33) não vale entre pessoas jurídicas (Lei 14.905/2024 art. 3º, I); em B2C só AVISA.
// Nada aqui é cobrado sozinho: é cálculo para conferência; o contrato prevalece (taxas do título vêm primeiro).
export type ParametrosLegais = { taxaLegalMesPct?: number | null; ipcaMesesPct?: number[] | null; multaPadraoPct?: number | null; jurisdicao?: 'BR' }
export function relacaoDe(documento?: string | null, caso?: Caso | null): Relacao | null {
  if (caso?.relacao) return caso.relacao
  const d = String(documento ?? '').replace(/\D/g, '')
  return d.length === 11 ? 'b2c' : d.length === 14 ? 'b2b' : null
}
export function encargos(t: Titulo, hoje: string, p: ParametrosLegais = {}, caso?: Caso | null) {
  const avisos: string[] = [], fontes: string[] = []
  const saldo = centavos(saldoDoTitulo(t, hoje)), dias = diasAtraso(t.vencimento, hoje)
  if (!estaVencido(t, hoje)) return { multa: 0, juros: 0, atualizacao: 0, total: reais(saldo), dias: 0, relacao: relacaoDe(t.documento, caso), avisos, fontes }
  const relacao = relacaoDe(t.documento, caso)
  if (!relacao) avisos.push('relação B2B/B2C desconhecida (documento sem CPF/CNPJ): limites legais aplicados como B2C, o mais protetivo')
  let multaPct = Number(t.taxaMultaPct ?? p.multaPadraoPct ?? 0) || 0
  if (relacao !== 'b2b' && multaPct > 2) { avisos.push(`multa de ${multaPct}% reduzida para 2% (CDC art. 52 § 1º)`); multaPct = 2 }
  fontes.push(relacao === 'b2b' ? 'CC art. 412 (multa até o valor da obrigação)' : 'CDC art. 52 § 1º (multa até 2%)')
  const multa = Math.min(saldo, Math.round(saldo * multaPct / 100))
  let jurosMes = Number(t.taxaJurosMesPct) || 0
  if (!jurosMes) {
    if (p.taxaLegalMesPct == null) avisos.push('sem juros no contrato e sem taxa legal informada (Selic − IPCA): juros não calculados')
    else { jurosMes = Math.max(0, p.taxaLegalMesPct); fontes.push('CC art. 406 (taxa legal = Selic − IPCA, mínimo zero)') }
  } else if (relacao !== 'b2b' && p.taxaLegalMesPct != null && jurosMes > 2 * Math.max(0, p.taxaLegalMesPct))
    avisos.push('juros do contrato acima do dobro da taxa legal: conferir Decreto 22.626/33 (não vale entre pessoas jurídicas — Lei 14.905/2024 art. 3º)')
  const juros = Math.round(saldo * (jurosMes / 100) * (dias / 30))
  let fator = 1
  if (p.ipcaMesesPct?.length) { for (const m of p.ipcaMesesPct) fator *= 1 + m / 100; fontes.push('CC art. 389 parágrafo único (IPCA)') }
  else avisos.push('atualização monetária não calculada: série do IPCA do período não informada')
  const atualizacao = Math.round(saldo * (fator - 1))
  return { multa: reais(multa), juros: reais(juros), atualizacao: reais(atualizacao), total: reais(saldo + multa + juros + atualizacao), dias, relacao, avisos, fontes }
}

// ─── 10. PROMESSAS — nunca são caixa; cumprimento = o que entrou DEPOIS da promessa ───
export type SituacaoPromessa = 'pendente' | 'cumprida' | 'parcial' | 'vencida_sem_pagamento' | 'quebrada' | 'renegociada'
export function situacaoPromessa(pr: Promessa, t: Titulo | undefined, hoje: string, renegociadas = new Set<string>()): { situacao: SituacaoPromessa; recebidoDepois: number } {
  if (renegociadas.has(pr.id)) return { situacao: 'renegociada', recebidoDepois: 0 }
  const depois = t ? Math.max(0, centavos(t.quitado) - centavos(pr.recebidoNaPromessa ?? 0)) : 0
  const prometido = centavos(pr.valor)
  if (pr.status === 'cumprido' || (prometido > 0 && depois >= prometido)) return { situacao: 'cumprida', recebidoDepois: reais(depois) }
  if (pr.status === 'quebrado') return { situacao: 'quebrada', recebidoDepois: reais(depois) }
  if (hoje > pr.data) return { situacao: depois > 0 ? 'parcial' : 'vencida_sem_pagamento', recebidoDepois: reais(depois) }
  return { situacao: depois > 0 ? 'parcial' : 'pendente', recebidoDepois: reais(depois) }
}
export function placarPromessas(promessas: Promessa[], titulos: Titulo[], hoje: string) {
  const porId = new Map(titulos.map((t) => [t.id, t]))
  const reneg = new Set(promessas.map((p) => p.renegociadaDe).filter(Boolean) as string[])
  const s = promessas.map((p) => situacaoPromessa(p, porId.get(p.tituloId), hoje, reneg).situacao)
  const cumpridas = s.filter((x) => x === 'cumprida').length, quebradas = s.filter((x) => x === 'quebrada' || x === 'vencida_sem_pagamento').length
  return { total: s.length, cumpridas, quebradas, pendentes: s.filter((x) => x === 'pendente' || x === 'parcial').length, taxaCumprimento: cumpridas + quebradas ? r2(cumpridas / (cumpridas + quebradas)) : null }
}

// ─── 8. DNA FINANCEIRO DO CLIENTE (ou do fornecedor, no a pagar) ───
// Só com dado da própria contraparte nesta empresa. Abaixo de 4 títulos quitados não há conclusão categórica.
export type DNA = {
  amostra: number; suficiente: boolean; atrasoMedio: number | null; frequenciaAtrasoPct: number | null
  regularidadeDesvio: number | null; prazoMedioPagamento: number | null; ticketMedio: number | null
  recenteAtraso: number | null; anteriorAtraso: number | null; recentePrazo: number | null; anteriorPrazo: number | null
  tendencia: 'piora' | 'melhora' | 'estavel' | 'indefinida'; recuperacaoAnteriorPct: number | null
  promessas: ReturnType<typeof placarPromessas>; conclusoes: { texto: string; tipo: 'fato' | 'inferencia' }[]
}
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
export function dnaFinanceiro(historico: Titulo[], promessas: Promessa[], hoje: string, mesesRecentes = 6): DNA {
  const lista = conferirEntrada(historico)
  const quitados = lista.filter((t) => t.quitacao && centavos(t.quitado) > 0).sort((a, b) => a.quitacao!.localeCompare(b.quitacao!))
  const atraso = (t: Titulo) => Math.max(0, diasEntre(t.vencimento, t.quitacao!) - 1)
  const prazo = (t: Titulo) => (t.emissao ? Math.max(0, diasEntre(t.emissao, t.quitacao!) - 1) : null)
  const corte = somarDiasISO(hoje, -30 * mesesRecentes)
  const rec = quitados.filter((t) => t.quitacao! >= corte), ant = quitados.filter((t) => t.quitacao! < corte)
  const atrasos = quitados.map(atraso)
  const m = media(atrasos)
  const desvio = m == null ? null : Math.sqrt(media(atrasos.map((a) => (a - m) ** 2))!)
  const prazos = (l: Titulo[]) => l.map(prazo).filter((x): x is number => x != null)
  const recA = media(rec.map(atraso)), antA = media(ant.map(atraso)), recP = media(prazos(rec)), antP = media(prazos(ant))
  const janelasOk = rec.length >= 2 && ant.length >= 2
  // Mudança relevante: +5 dias e +30% no atraso (ou no prazo de pagamento, quando há data de emissão)
  const piorou = (r: number | null, a: number | null) => r != null && a != null && r >= a + 5 && r >= a * 1.3
  const melhorou = (r: number | null, a: number | null) => r != null && a != null && r <= a - 5 && r <= a * 0.7
  const tendencia: DNA['tendencia'] = !janelasOk ? 'indefinida' : piorou(recA, antA) || piorou(recP, antP) ? 'piora' : melhorou(recA, antA) || melhorou(recP, antP) ? 'melhora' : 'estavel'
  const venceramAntes = lista.filter((t) => t.vencimento < hoje && (t.quitacao ? t.quitacao > t.vencimento : true))
  const recuperados = venceramAntes.filter((t) => t.quitacao && centavos(t.quitado) > 0)
  const conclusoes: DNA['conclusoes'] = []
  if (quitados.length) conclusoes.push({ tipo: 'fato', texto: `${quitados.length} título(s) quitado(s); atraso médio de ${Math.round(m!)} dia(s).` })
  if (janelasOk && recP != null && antP != null) conclusoes.push({ tipo: 'fato', texto: `Prazo médio de pagamento: ${Math.round(antP)} dias antes, ${Math.round(recP)} dias nos últimos ${mesesRecentes} meses.` })
  if (tendencia === 'piora') conclusoes.push({ tipo: 'inferencia', texto: 'Comportamento de pagamento piorando: acompanhar de perto antes de virar inadimplência.' })
  if (tendencia === 'melhora') conclusoes.push({ tipo: 'inferencia', texto: 'Comportamento de pagamento melhorando.' })
  if (quitados.length < 4) conclusoes.push({ tipo: 'fato', texto: 'Histórico curto: menos de 4 títulos quitados — sem conclusão categórica.' })
  const rd = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10)
  return {
    amostra: quitados.length, suficiente: quitados.length >= 4, atrasoMedio: rd(m),
    frequenciaAtrasoPct: quitados.length ? r2((atrasos.filter((a) => a > 0).length / quitados.length) * 100) : null,
    regularidadeDesvio: rd(desvio), prazoMedioPagamento: rd(media(prazos(quitados))),
    ticketMedio: quitados.length ? r2(media(quitados.map((t) => t.valor))!) : null,
    recenteAtraso: rd(recA), anteriorAtraso: rd(antA), recentePrazo: rd(recP), anteriorPrazo: rd(antP), tendencia,
    recuperacaoAnteriorPct: venceramAntes.length >= 2 ? r2((recuperados.length / venceramAntes.length) * 100) : null,
    promessas: placarPromessas(promessas, lista, hoje), conclusoes,
  }
}

// ─── 9. SCORES (0–1000) — risco de NÃO receber ≠ prioridade de cobrança; fatores sempre visíveis ───
export function riscoRecuperacao(t: Titulo, dna: DNA, hoje: string, caso?: Caso | null) {
  const f: Fator[] = []
  const dias = diasAtraso(t.vencimento, hoje)
  f.push({ chave: 'dias_atraso', pontos: Math.round(lim(dias / 180, 0, 1) * 300), texto: `${dias} dia(s) em atraso` })
  if (dna.suficiente) {
    f.push({ chave: 'historico_atraso', pontos: Math.round(lim((dna.atrasoMedio ?? 0) / 60, 0, 1) * 150), texto: `atraso médio histórico de ${dna.atrasoMedio} dia(s)` })
    f.push({ chave: 'frequencia_atraso', pontos: Math.round(((dna.frequenciaAtrasoPct ?? 0) / 100) * 100), texto: `${dna.frequenciaAtrasoPct}% dos pagamentos com atraso` })
  } else f.push({ chave: 'historico_insuficiente', pontos: 125, texto: 'histórico curto: risco neutro (sem base para melhorar ou piorar)' })
  if (dna.tendencia === 'piora') f.push({ chave: 'deterioracao', pontos: 120, texto: 'pagamentos piorando nos últimos meses' })
  if (dna.tendencia === 'melhora') f.push({ chave: 'melhora', pontos: -60, texto: 'pagamentos melhorando nos últimos meses' })
  const pr = dna.promessas
  if (pr.quebradas) f.push({ chave: 'promessas_quebradas', pontos: Math.min(150, pr.quebradas * 50), texto: `${pr.quebradas} promessa(s) não cumprida(s)` })
  if (dna.recuperacaoAnteriorPct != null) f.push({ chave: 'recuperacao_anterior', pontos: Math.round((1 - dna.recuperacaoAnteriorPct / 100) * 100), texto: `${dna.recuperacaoAnteriorPct}% dos atrasos anteriores foram pagos` })
  const saldo = saldoDoTitulo(t, hoje)
  if (dna.ticketMedio && saldo > dna.ticketMedio * 2) f.push({ chave: 'exposicao', pontos: 60, texto: 'saldo acima do dobro do ticket médio' })
  if (separarDisputa(saldo, caso).aberta) f.push({ chave: 'disputa', pontos: 80, texto: 'há divergência comercial aberta' })
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f }
}

export function prioridadeCobranca(t: Titulo, risco: number, hoje: string, ctx: { maiorSaldo: number; promessaVencida?: boolean; caixaPressionado?: boolean; limites?: number[] }, caso?: Caso | null) {
  const f: Fator[] = []
  const saldo = separarDisputa(saldoDoTitulo(t, hoje), caso).incontroverso
  f.push({ chave: 'valor', pontos: Math.round(lim(saldo / (ctx.maiorSaldo || 1), 0, 1) * 350), texto: 'peso do saldo incontroverso na carteira' })
  // Risco intermediário rende mais cobrar já (ainda recuperável); risco extremo pede análise especializada
  f.push({ chave: 'recuperavel', pontos: Math.round((1 - Math.abs(risco - 450) / 550) * 250), texto: 'chance de a ação mudar o resultado' })
  const dias = diasAtraso(t.vencimento, hoje), limites = ctx.limites ?? FAIXAS_PADRAO
  const prox = rotulosFaixas(limites)[faixaDe(dias, limites)].ate
  if (prox != null && prox - dias <= 3) f.push({ chave: 'vai_mudar_faixa', pontos: 120, texto: `muda de faixa em ${prox - dias + 1} dia(s)` })
  if (ctx.promessaVencida) f.push({ chave: 'promessa_vencida', pontos: 150, texto: 'promessa venceu sem pagamento' })
  if (ctx.caixaPressionado) f.push({ chave: 'caixa', pontos: 130, texto: 'caixa da empresa pressionado' })
  if (separarDisputa(saldoDoTitulo(t, hoje), caso).aberta) f.push({ chave: 'disputa', pontos: -100, texto: 'resolver a divergência antes de cobrar o contestado' })
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f }
}

// ─── 15. SUPPLIER PAYMENT PRIORITY — não é só valor ou antiguidade ───
export function prioridadeFornecedor(t: Titulo, hoje: string, ctx: { caixaDisponivel: number; totalVencidoPagar: number }, caso?: Caso | null) {
  const f: Fator[] = []
  const crit = { critica: 320, alta: 220, media: 120, baixa: 40 }[caso?.criticidade ?? 'media']
  f.push({ chave: 'criticidade', pontos: crit, texto: `importância operacional: ${caso?.criticidade ?? 'média (não informada)'}` })
  if (caso?.riscoInterrupcao) f.push({ chave: 'interrupcao', pontos: 200, texto: 'risco de interromper fornecimento' })
  const custoMes = (Number(t.taxaJurosMesPct) || 0) + (Number(t.taxaMultaPct) || 0) / Math.max(1, diasAtraso(t.vencimento, hoje) / 30)
  f.push({ chave: 'custo_financeiro', pontos: Math.round(lim(custoMes / 5, 0, 1) * 180), texto: custoMes ? `custo de atraso ≈ ${r2(custoMes)}% ao mês` : 'sem juros/multa informados' })
  f.push({ chave: 'atraso', pontos: Math.round(lim(diasAtraso(t.vencimento, hoje) / 90, 0, 1) * 120), texto: `${diasAtraso(t.vencimento, hoje)} dia(s) em atraso` })
  if (separarDisputa(saldoDoTitulo(t, hoje), caso).aberta) f.push({ chave: 'contestado', pontos: -150, texto: 'cobrança contestada: pagar só o incontroverso' })
  const cabe = ctx.caixaDisponivel >= saldoDoTitulo(t, hoje)
  if (ctx.caixaDisponivel < ctx.totalVencidoPagar) f.push({ chave: 'caixa', pontos: cabe ? 60 : -80, texto: cabe ? 'cabe no caixa atual' : 'caixa não cobre este título hoje' })
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f }
}

// ─── 6. CAUSA RAIZ — sugestão por regra (inferência, nunca fato até a pessoa confirmar) ───
const PISTAS: [string, RegExp][] = [
  ['nota_fiscal', /nota|nf-?e|danfe|cfop|xml/i], ['entrega', /entrega|frete|transport|não recebi|nao recebi/i],
  ['qualidade', /defeito|qualidade|avaria|quebrad/i], ['divergencia_comercial', /diverg|preço errado|preco errado|pedido/i],
  ['contestacao_contratual', /contrato|cláusula|clausula/i], ['pagamento', /boleto|pix|cartão|cartao|banco/i],
  ['liquidez', /caixa|sem dinheiro|aperto|liquidez/i], ['financeiro', /recuperação judicial|recuperacao judicial|falência|falencia|dificuldade/i],
]
export function sugerirCausa(texto: string, caso?: Caso | null): { causa: string; tipo: 'fato' | 'inferencia'; motivo: string } {
  if (caso?.causa && caso.causa !== 'desconhecido') return { causa: caso.causa, tipo: caso.causaConfirmada ? 'fato' : 'inferencia', motivo: caso.causaConfirmada ? 'confirmada por pessoa' : `sugerida (${caso.causaOrigem ?? 'regra'})` }
  const achou = PISTAS.find(([, re]) => re.test(texto))
  return achou ? { causa: achou[0], tipo: 'inferencia', motivo: 'pista no texto do título/contato — confirmar' } : { causa: 'desconhecido', tipo: 'inferencia', motivo: 'sem pista suficiente' }
}

// ─── 12. NEGOCIAÇÃO — simulador; toda concessão precisa de aprovação (IA nunca concede) ───
export type OpcaoNegociacao = { tipo: 'integral' | 'entrada_parcelas' | 'desconto' | 'novo_vencimento' | 'acordo'; descontoPct?: number; entradaPct?: number; parcelas?: number; intervaloDias?: number; prazoDias?: number }
export function simularNegociacao(saldo: number, op: OpcaoNegociacao, ctx: { custoCapitalMesPct: number; probabilidadeBase: number; limiteDescontoSemAprovacaoPct?: number }) {
  const s = centavos(saldo), desc = lim(op.descontoPct ?? 0, 0, 100)
  const total = Math.round(s * (1 - desc / 100))
  const fluxo: { dia: number; valor: number }[] = []
  if (op.tipo === 'entrada_parcelas' || op.tipo === 'acordo') {
    const n = Math.max(1, Math.round(op.parcelas ?? 1)), entrada = Math.round(total * lim(op.entradaPct ?? 0, 0, 100) / 100)
    if (entrada) fluxo.push({ dia: 0, valor: entrada })
    const resto = total - entrada, parc = Math.floor(resto / n)
    for (let i = 1; i <= n; i++) fluxo.push({ dia: i * (op.intervaloDias ?? 30), valor: i === n ? resto - parc * (n - 1) : parc })
  } else fluxo.push({ dia: op.tipo === 'novo_vencimento' ? op.prazoDias ?? 30 : 0, valor: total })
  const vp = fluxo.reduce((a, x) => a + x.valor / (1 + ctx.custoCapitalMesPct / 100) ** (x.dia / 30), 0)
  // Concessão aumenta a chance de pagar (heurística v1, declarada): desconto/parcelamento até +25 p.p.
  const ganho = op.tipo === 'integral' ? 0 : Math.min(0.25, desc / 100 + (op.parcelas ? 0.08 : 0) + (op.tipo === 'novo_vencimento' ? 0.05 : 0))
  const prob = lim(ctx.probabilidadeBase + ganho, 0, 1)
  const ate = (d: number) => reais(fluxo.filter((x) => x.dia <= d).reduce((a, x) => a + x.valor, 0))
  const concede = desc > (ctx.limiteDescontoSemAprovacaoPct ?? 0) || op.tipo !== 'integral'
  return {
    tipo: op.tipo, totalNegociado: reais(total), custoDesconto: reais(s - total), prazoFinalDias: Math.max(...fluxo.map((x) => x.dia)),
    valorPresente: reais(Math.round(vp)), probabilidade: r2(prob), recuperacaoEsperada: reais(Math.round(vp * prob)),
    caixa30: ate(30), caixa60: ate(60), caixa90: ate(90), parcelas: fluxo.map((x) => ({ dia: x.dia, valor: reais(x.valor) })),
    precisaAprovacao: concede, aprovadores: concede ? ['dono', 'socio', 'admin'] : [], simulacao: true as const,
  }
}

// ─── 13. PREVISÃO DE RECUPERAÇÃO (7/15/30/60/90) — heurística v1 declarada; promessa e previsão nunca viram caixa ───
export const HORIZONTES = [7, 15, 30, 60, 90] as const
export const METODO_PREVISAO = 'heuristica-v1: p_final=(1000-risco)/1000; curva 1-e^(-h/tau), tau=20+dias/2; contestado fora'
export function previsaoRecuperacao(itens: { titulo: Titulo; risco: number; caso?: Caso | null }[], hoje: string) {
  const fotos: Record<string, number> = {}
  let base = 0
  const porH = HORIZONTES.map((h) => ({ horizonteDias: h, valor: 0 }))
  for (const { titulo, risco, caso } of itens) {
    if (!estaVencido(titulo, hoje)) continue
    const saldo = saldoDoTitulo(titulo, hoje)
    fotos[titulo.id] = saldo; base += centavos(saldo)
    const inc = centavos(separarDisputa(saldo, caso).incontroverso)
    const pFinal = lim((1000 - risco) / 1000, 0, 1), tau = 20 + diasAtraso(titulo.vencimento, hoje) / 2
    for (const x of porH) x.valor += Math.round(inc * pFinal * (1 - Math.exp(-x.horizonteDias / tau)))
  }
  const confianca = itens.length >= 20 ? 'media' : 'baixa'
  return {
    horizontes: porH.map((x) => ({ horizonteDias: x.horizonteDias, valor: reais(x.valor) })), saldoBase: reais(base), titulos: fotos,
    metodo: METODO_PREVISAO, confianca, ehCaixa: false as const,
    limitacoes: ['previsão, não caixa disponível', 'pagamento parcial sem data por parcela: o realizado é medido pela variação do saldo', 'calibração melhora com o histórico de precisão'],
  }
}
// Previsto x realizado: realizado = quanto o saldo de cada título da foto caiu até hoje (só o que entrou).
export function precisaoPrevisao(previsto: number, fotoTitulos: Record<string, number>, saldosHoje: Map<string, number>) {
  let real = 0
  for (const [id, saldoBase] of Object.entries(fotoTitulos)) {
    const agora = saldosHoje.get(id)
    if (agora == null) continue // título sumiu/cancelado: não conta como recuperado
    real += Math.max(0, centavos(saldoBase) - centavos(agora))
  }
  const realizado = reais(real), maior = Math.max(previsto, realizado)
  return { previsto, realizado, erro: r2(realizado - previsto), acertoPct: maior ? r2((1 - Math.abs(realizado - previsto) / maior) * 100) : 100 }
}

// ─── 14/16. SIMULADOR DE RECUPERAÇÃO e IMPACTO NA TESOURARIA — sempre marcado como simulação ───
export type BaseTesouraria = { caixaDisponivel: number; reservaMinima: number; vencidoReceber: number; vencidoPagar: number; pagarCritico: number; aPagarNoPrazo: number; aReceberNoPrazo: number; capitalDeGiro?: number | null }
export function simularRecuperacao(base: BaseTesouraria, pct: number, prazoDias: number) {
  if (!(pct >= 0 && pct <= 100)) throw new Error('vencidos: percentual de recuperação entre 0 e 100')
  const rec = Math.round(centavos(base.vencidoReceber) * pct / 100)
  const caixaFinal = centavos(base.caixaDisponivel) + rec + centavos(base.aReceberNoPrazo) - centavos(base.aPagarNoPrazo) - centavos(base.vencidoPagar)
  const obrig = centavos(base.vencidoPagar) + centavos(base.aPagarNoPrazo)
  return {
    simulacao: true as const, pct, prazoDias, recuperado: reais(rec), aindaVencido: reais(centavos(base.vencidoReceber) - rec),
    caixaProjetado: reais(caixaFinal), coberturaObrigacoes: obrig ? r2((centavos(base.caixaDisponivel) + rec + centavos(base.aReceberNoPrazo)) / obrig) : null,
    // capital de giro não muda: recebível vira caixa dentro do mesmo ativo circulante; muda a LIQUIDEZ
    capitalDeGiro: base.capitalDeGiro ?? null,
    abaixoDaReserva: caixaFinal < centavos(base.reservaMinima),
  }
}
export function impactoFinanceiro(base: BaseTesouraria, esperado30: number) {
  const liquidezHoje = centavos(base.caixaDisponivel) - centavos(base.vencidoPagar)
  const pressao = centavos(base.vencidoPagar) + centavos(base.aPagarNoPrazo) - centavos(base.aReceberNoPrazo) - centavos(esperado30)
  const caixa30 = centavos(base.caixaDisponivel) + centavos(esperado30) + centavos(base.aReceberNoPrazo) - centavos(base.aPagarNoPrazo) - centavos(base.vencidoPagar)
  return {
    exposicaoInadimplencia: base.vencidoReceber, recuperacaoEsperada30: esperado30, obrigacoesCriticas: base.pagarCritico,
    liquidezAposVencidos: reais(liquidezHoje), pressaoCapitalDeGiro: reais(Math.max(0, pressao)),
    caixaProjetado30: reais(caixa30), riscoRuptura: caixa30 < 0 ? 'alto' : caixa30 < centavos(base.reservaMinima) ? 'medio' : 'baixo',
  }
}

// ─── 17. ORQUESTRADOR — escolhe UMA próxima ação, com justificativa; nunca executa nada ───
export type Acao = 'solicitar_pagamento' | 'resolver_divergencia' | 'solicitar_documentacao' | 'criar_promessa' | 'propor_negociacao' | 'escalonar_cobranca' | 'acompanhar' | 'analise_especializada' | 'seguir_regua'
  | 'pagar_agora' | 'pagar_incontroverso' | 'negociar_prazo_fornecedor' | 'aguardar_caixa'
export function proximaAcao(e: { titulo: Titulo; hoje: string; risco: number; dna: DNA; caso?: Caso | null; promessa?: SituacaoPromessa | null; caixaDisponivel?: number; etapaRegua?: string | null }): { acao: Acao; justificativa: string; consideracoes: string[] } {
  const { titulo: t, hoje, risco, caso } = e
  const dias = diasAtraso(t.vencimento, hoje), saldo = saldoDoTitulo(t, hoje), d = separarDisputa(saldo, caso)
  const causa = sugerirCausa('', caso).causa
  const c = [`${dias} dia(s) de atraso`, `risco ${risco}/1000`, `causa: ${causa}`]
  if (t.dominio === 'pagar') {
    if (d.aberta) return { acao: 'pagar_incontroverso', justificativa: `Cobrança contestada: o incontroverso (R$ ${d.incontroverso}) pode ser pago; o contestado espera a solução.`, consideracoes: c }
    if ((e.caixaDisponivel ?? Infinity) < saldo) return { acao: caso?.criticidade === 'critica' || caso?.riscoInterrupcao ? 'negociar_prazo_fornecedor' : 'aguardar_caixa', justificativa: 'Caixa não cobre o título hoje: negociar prazo com fornecedor crítico; os demais aguardam a ordem de prioridade.', consideracoes: c }
    return { acao: 'pagar_agora', justificativa: 'Caixa cobre e o atraso gera custo e risco de relacionamento.', consideracoes: c }
  }
  if (d.aberta) return { acao: 'resolver_divergencia', justificativa: 'Há divergência aberta: cobrar o contestado agora desgasta e não recebe. Resolver primeiro; o incontroverso segue cobrado.', consideracoes: c }
  if (['nota_fiscal', 'erro_administrativo'].includes(causa)) return { acao: 'solicitar_documentacao', justificativa: 'Atraso por problema documental: corrigir/reenviar o documento costuma destravar o pagamento.', consideracoes: c }
  if (e.promessa === 'vencida_sem_pagamento') return { acao: risco >= 700 ? 'escalonar_cobranca' : 'propor_negociacao', justificativa: 'Promessa venceu sem pagamento.', consideracoes: c }
  if (e.promessa === 'pendente' || e.promessa === 'parcial') return { acao: 'acompanhar', justificativa: 'Há promessa em prazo: acompanhar até a data (promessa não é caixa).', consideracoes: c }
  if (risco >= 850 && dias > 90) return { acao: 'analise_especializada', justificativa: 'Risco muito alto e atraso longo: avaliar com especialista (nenhuma medida jurídica é automática).', consideracoes: c }
  if (['liquidez', 'financeiro'].includes(causa) || (dias > 30 && risco >= 500)) return { acao: 'propor_negociacao', justificativa: 'Dificuldade financeira do cliente: negociar aumenta a recuperação esperada (simular antes; concessão exige aprovação).', consideracoes: c }
  if (dias > 15 && e.dna.tendencia === 'piora') return { acao: 'criar_promessa', justificativa: 'Pagador piorando: fechar data e valor comprometidos.', consideracoes: c }
  if (e.etapaRegua) return { acao: 'seguir_regua', justificativa: `Etapa da régua de cobrança de hoje: ${e.etapaRegua}.`, consideracoes: c }
  return { acao: dias > 60 ? 'escalonar_cobranca' : 'solicitar_pagamento', justificativa: dias > 60 ? 'Atraso longo sem resposta: subir o nível da cobrança.' : 'Atraso recente: lembrete/pedido de pagamento.', consideracoes: c }
}
