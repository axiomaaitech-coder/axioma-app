// ═══════════════════════════════════════════════════════════════
// AXIOMA OVERDUE INTELLIGENCE — Fase 1: motor determinístico (sem banco, sem IA).
// Mesmas entradas → mesmo resultado; testado em scripts/check-vencidos.mts. Decisões e metodologia em docs/VENCIDOS.md.
//
// Reuso (nada recalculado do zero, regra "não duplicar"):
//   • saldo do título = saldoReceber/saldoPagar (lib/financeiro/calculos) — mesma regra das telas;
//   • dias = diasEntre (lib/financeiro/periodos), igual ao saldoReceber;
//   • valores em centavos inteiros (lib/financeiro/contrato).
// Dois domínios que compartilham infraestrutura sem misturar saldos: RECEBER (recuperar o que clientes devem)
// e PAGAR (obrigações vencidas da empresa). Nada aqui grava, liquida, apaga, concede desconto ou aciona medida
// jurídica (protesto, negativação, remissão): só calcula, explica e recomenda.
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from '../financeiro/contrato'
import { diasEntre } from '../financeiro/periodos'
import { saldoPagar, saldoReceber } from '../financeiro/calculos'
import { somarDiasISO } from '../datas'

// Metodologia dos scores/previsão — versionada: mudar pesos = subir a versão (registrada junto da foto da previsão).
export const VERSAO_METODOLOGIA = 'overdue-v1.1-2026-11-02'

export const FECHADOS = new Set(['pago', 'recebido', 'cancelado', 'cancelada'])
export type Dominio = 'receber' | 'pagar'
export type Relacao = 'b2b' | 'b2c'
export const CAUSAS = ['financeiro', 'liquidez', 'entrega', 'qualidade', 'divergencia_comercial', 'nota_fiscal', 'documental', 'erro_administrativo', 'contestacao_contratual', 'pagamento', 'esquecimento', 'insolvencia', 'desconhecido'] as const
export type Causa = (typeof CAUSAS)[number]

export type Titulo = {
  id: string; empresaId: string; dominio: Dominio
  contraparteId: string | null; contraparteNome: string; documento?: string | null
  valor: number; quitado: number; desconto?: number | null
  vencimento: string; emissao?: string | null; quitacao?: string | null; status?: string | null
  taxaMultaPct?: number | null; taxaJurosMesPct?: number | null
  descricao?: string | null; responsavel?: string | null
}
export type Caso = {
  tituloId: string; causa?: string | null; causaConfirmada?: boolean | null; causaOrigem?: string | null
  disputaStatus?: string | null; disputaValor?: number | null; relacao?: Relacao | null
  criticidade?: 'critica' | 'alta' | 'media' | 'baixa' | null; riscoInterrupcao?: boolean | null
  impactoProducao?: boolean | null; impactoVendas?: boolean | null; dependencia?: 'alto' | 'medio' | 'baixo' | null
}
export type Promessa = {
  id: string; tituloId: string; valor: number; data: string; status?: string | null; tipo?: string | null
  recebidoNaPromessa?: number | null; renegociadaDe?: string | null
}
export type Fator = { chave: string; pontos: number; texto: string }
export type Score = { score: number | null; fatores: Fator[]; dadosSuficientes: boolean; aviso: string | null; versao: string }

export const diasAtraso = (vencimento: string, hoje: string) => Math.max(0, diasEntre(vencimento, hoje) - 1)
const r2 = (v: number) => Math.round(v * 100) / 100
const lim = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const chaveContraparte = (t: Titulo) => t.contraparteId ?? `sem:${t.contraparteNome}`

// ─── Saldo e situação de cada título (regra única das telas) ───
export function saldoDoTitulo(t: Titulo, hoje: string): number {
  return t.dominio === 'receber'
    ? saldoReceber({ id: t.id, valor: t.valor, valor_recebido: t.quitado, valor_desconto: t.desconto ?? 0, data_vencimento: t.vencimento }, hoje).principal
    : saldoPagar({ id: t.id, valor_total: t.valor, valor_pago: t.quitado, data_vencimento: t.vencimento })
}
export const emAberto = (t: Titulo, hoje: string) => !!t.vencimento && !FECHADOS.has(String(t.status ?? '').toLowerCase()) && saldoDoTitulo(t, hoje) > 0.004
// Liquidado (saldo zero) ou cancelado nunca aparece como vencido
export const estaVencido = (t: Titulo, hoje: string) => emAberto(t, hoje) && t.vencimento < hoje

// Entrada sempre de UMA empresa (dado de empresas diferentes nunca se mistura) e sem título repetido.
export function conferirEntrada(titulos: Titulo[]): Titulo[] {
  const empresas = new Set(titulos.map((t) => t.empresaId))
  if (empresas.size > 1) throw new Error('vencidos: títulos de mais de uma empresa na mesma análise')
  const vistos = new Map<string, Titulo>()
  for (const t of titulos) vistos.set(`${t.dominio}:${t.id}`, t)
  return [...vistos.values()]
}

// Disputa: o valor contestado sai da cobrança; o incontroverso continua sendo cobrado. Título nunca é apagado.
export function separarDisputa(saldo: number, caso?: Caso | null) {
  const aberta = !!caso?.disputaStatus && ['aberta', 'em_analise'].includes(caso.disputaStatus)
  const contestado = aberta ? Math.min(saldo, Math.max(0, Number(caso?.disputaValor) || 0)) : 0
  return { contestado: r2(contestado), incontroverso: r2(saldo - contestado), aberta }
}

// Recuperado no período = o que foi pago DEPOIS de vencer, com a quitação dentro do período (regra única,
// também usada pela Inadimplência). Pagamento em dia não é "recuperação".
export function recuperadoNoPeriodo(titulos: Titulo[], inicio: string, fim: string): number {
  return reais(conferirEntrada(titulos)
    .filter((t) => !/cancel/i.test(String(t.status ?? '')) && t.quitacao && t.quitacao > t.vencimento && t.quitacao >= inicio && t.quitacao <= fim)
    .reduce((s, t) => s + centavos(t.quitado), 0))
}

// ─── ENCARGOS (juros, multa, atualização) — Lei 14.905/2024 e CDC, conferidos no planalto.gov.br em 2026-11-02 ───
// • Sem índice no contrato: atualização pelo IPCA (CC art. 389, parágrafo único).
// • Sem juros no contrato: taxa legal = Selic − IPCA, nunca negativa (CC art. 406 e § 3º) — vem de fora (BCB), mensal.
// • B2C: multa de mora até 2% (CDC art. 52 § 1º). B2B: multa até o valor da obrigação (CC art. 412).
// • Decreto 22.626/33 (usura) não vale entre pessoas jurídicas (Lei 14.905/2024 art. 3º, I); em B2C só AVISA.
// O contrato prevalece (taxas do título vêm primeiro). Cálculo para conferência — nada é cobrado sozinho.
export type ParametrosLegais = { taxaLegalMesPct?: number | null; ipcaMesesPct?: number[] | null; multaPadraoPct?: number | null; jurisdicao?: 'BR' }
export function relacaoDe(documento?: string | null, caso?: Caso | null): Relacao | null {
  if (caso?.relacao) return caso.relacao
  const d = String(documento ?? '').replace(/\D/g, '')
  return d.length === 11 ? 'b2c' : d.length === 14 ? 'b2b' : null
}
export function encargos(t: Titulo, hoje: string, p: ParametrosLegais = {}, caso?: Caso | null) {
  const avisos: string[] = [], fontes: string[] = []
  if (p.jurisdicao && p.jurisdicao !== 'BR') throw new Error('vencidos: jurisdição sem regra cadastrada')
  const saldo = centavos(saldoDoTitulo(t, hoje)), dias = diasAtraso(t.vencimento, hoje)
  const relacao = relacaoDe(t.documento, caso)
  if (!estaVencido(t, hoje)) return { multa: 0, juros: 0, atualizacao: 0, total: reais(saldo), dias: 0, relacao, avisos, fontes }
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

// ─── AGING configurável (+ faixa "a vencer") ───
export const FAIXAS_PADRAO = [7, 15, 30, 45, 60, 90, 120, 180, 360]
export type FaixaAging = { rotulo: string; de: number; ate: number | null; qtd: number; original: number; saldo: number; encargos: number; pctSaldo: number }

export function rotulosFaixas(limites: number[]): { de: number; ate: number | null; rotulo: string }[] {
  const l = [...new Set(limites.filter((n) => Number.isInteger(n) && n > 0))].sort((a, b) => a - b)
  if (!l.length) throw new Error('vencidos: faixas de aging vazias')
  return [...l.map((ate, i) => ({ de: i ? l[i - 1] + 1 : 1, ate, rotulo: `${i ? l[i - 1] + 1 : 1}–${ate}` })), { de: l[l.length - 1] + 1, ate: null, rotulo: `${l[l.length - 1]}+` }]
}
export const faixaDe = (dias: number, limites: number[]) => { const f = rotulosFaixas(limites); const i = f.findIndex((x) => x.ate === null || dias <= x.ate); return i < 0 ? f.length - 1 : i }

export function aging(titulos: Titulo[], hoje: string, limites = FAIXAS_PADRAO, legais: ParametrosLegais = {}) {
  const faixas: FaixaAging[] = rotulosFaixas(limites).map((f) => ({ ...f, qtd: 0, original: 0, saldo: 0, encargos: 0, pctSaldo: 0 }))
  const aVencer = { qtd: 0, original: 0, saldo: 0 }
  const porContraparte = new Map<string, number>()
  let total = 0
  for (const t of conferirEntrada(titulos)) {
    if (!emAberto(t, hoje)) continue
    const s = centavos(saldoDoTitulo(t, hoje))
    if (t.vencimento >= hoje) { aVencer.qtd++; aVencer.original += centavos(t.valor); aVencer.saldo += s; continue }
    const f = faixas[faixaDe(diasAtraso(t.vencimento, hoje), limites)]
    f.qtd++; f.original += centavos(t.valor); f.saldo += s; total += s
    f.encargos += centavos(encargos(t, hoje, legais).total) - s
    porContraparte.set(chaveContraparte(t), (porContraparte.get(chaveContraparte(t)) ?? 0) + s)
  }
  for (const f of faixas) { f.pctSaldo = total ? r2((f.saldo / total) * 100) : 0; f.original = reais(f.original); f.saldo = reais(f.saldo); f.encargos = reais(f.encargos) }
  const fatias = [...porContraparte.values()].map((v) => v / (total || 1))
  return {
    aVencer: { qtd: aVencer.qtd, original: reais(aVencer.original), saldo: reais(aVencer.saldo) },
    faixas, total: reais(total), qtdVencidos: faixas.reduce((s, f) => s + f.qtd, 0),
    // Concentração: maior devedor (%) e HHI (0–10000; acima de 2500 = carteira concentrada)
    maiorPct: r2(Math.max(0, ...fatias) * 100), hhi: Math.round(fatias.reduce((s, p) => s + (p * 100) ** 2, 0)),
  }
}

// Migração entre faixas: a faixa de um título só depende do vencimento e da data, então a foto de
// qualquer data passada é reconstruída sem tabela extra. Deterioração = saldo que entrou ou mudou de faixa pior.
export function migracaoAging(titulos: Titulo[], dataAnterior: string, hoje: string, limites = FAIXAS_PADRAO) {
  let entraram = 0, pioraram = 0, qtdPioraram = 0, base = 0
  for (const t of conferirEntrada(titulos).filter((x) => estaVencido(x, hoje))) {
    const s = centavos(saldoDoTitulo(t, hoje)); base += s
    if (t.vencimento >= dataAnterior) { entraram += s; continue }
    if (faixaDe(diasAtraso(t.vencimento, hoje), limites) > faixaDe(diasAtraso(t.vencimento, dataAnterior), limites)) { pioraram += s; qtdPioraram++ }
  }
  return { entraramNoVencido: reais(entraram), mudaramParaFaixaPior: reais(pioraram), qtdMudaramParaFaixaPior: qtdPioraram, indiceDeterioracaoPct: base ? r2(((entraram + pioraram) / base) * 100) : 0 }
}

// ─── PROMISE-TO-PAY — promessa nunca é caixa; cumprimento = o que entrou DEPOIS da promessa ───
export type SituacaoPromessa = 'pendente' | 'confirmada' | 'parcialmente_cumprida' | 'cumprida' | 'descumprida' | 'renegociada' | 'cancelada'
export function situacaoPromessa(pr: Promessa, t: Titulo | undefined, hoje: string, renegociadas = new Set<string>()): { situacao: SituacaoPromessa; recebidoDepois: number; falta: number } {
  const depois = t ? Math.max(0, centavos(t.quitado) - centavos(pr.recebidoNaPromessa ?? 0)) : 0
  const prometido = centavos(pr.valor), falta = reais(Math.max(0, prometido - depois))
  const r = (situacao: SituacaoPromessa) => ({ situacao, recebidoDepois: reais(depois), falta })
  if (pr.status === 'cancelado') return r('cancelada')
  if (renegociadas.has(pr.id)) return r('renegociada')
  // conta quitada também cumpre: acordo pode incluir juros/multa que a baixa trata à parte (Contas a Receber)
  const quitada = !!t && FECHADOS.has(String(t.status ?? '').toLowerCase()) && !/cancel/i.test(String(t.status))
  if (pr.status === 'cumprido' || quitada || (prometido > 0 && depois >= prometido)) return { situacao: 'cumprida', recebidoDepois: reais(depois), falta: 0 }
  if (pr.status === 'quebrado' || (hoje > pr.data && depois === 0)) return r('descumprida')
  if (depois > 0) return r('parcialmente_cumprida')
  return r(pr.status === 'confirmado' ? 'confirmada' : 'pendente')
}
export function placarPromessas(promessas: Promessa[], titulos: Titulo[], hoje: string) {
  const porId = new Map(titulos.map((t) => [t.id, t]))
  const reneg = new Set(promessas.map((p) => p.renegociadaDe).filter(Boolean) as string[])
  const s = promessas.map((p) => situacaoPromessa(p, porId.get(p.tituloId), hoje, reneg).situacao)
  const n = (...k: SituacaoPromessa[]) => s.filter((x) => k.includes(x)).length
  const cumpridas = n('cumprida'), descumpridas = n('descumprida')
  return { total: s.length, cumpridas, descumpridas, parciais: n('parcialmente_cumprida'), pendentes: n('pendente', 'confirmada'), renegociadas: n('renegociada'), canceladas: n('cancelada'), taxaCumprimento: cumpridas + descumpridas ? r2(cumpridas / (cumpridas + descumpridas)) : null }
}

// ─── CUSTOMER FINANCIAL BEHAVIOUR DNA (também serve ao fornecedor, no a pagar) ───
// Só com dado da própria contraparte nesta empresa. Abaixo de 4 títulos quitados: sem classificação.
export type DNA = {
  amostra: number; suficiente: boolean; atrasoMedio: number | null; frequenciaAtrasoPct: number | null
  regularidadeDesvio: number | null; prazoMedioPagamento: number | null; valorMedioRecebido: number | null
  pagamentosParciais: number; acordos: number
  recenteAtraso: number | null; anteriorAtraso: number | null; recentePrazo: number | null; anteriorPrazo: number | null
  amostraRecente: number; amostraAnterior: number
  tendencia: 'piora' | 'melhora' | 'estavel' | 'indefinida'; recuperacaoAnteriorPct: number | null
  promessas: ReturnType<typeof placarPromessas>; conclusoes: { texto: string; tipo: 'fato' | 'inferencia' }[]
}
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null)
export function dnaFinanceiro(historico: Titulo[], promessas: Promessa[], hoje: string, mesesRecentes = 6): DNA {
  const lista = conferirEntrada(historico)
  const quitados = lista.filter((t) => t.quitacao && centavos(t.quitado) > 0 && centavos(t.quitado) >= centavos(t.valor) - centavos(t.desconto ?? 0)).sort((a, b) => a.quitacao!.localeCompare(b.quitacao!))
  const parciais = lista.filter((t) => centavos(t.quitado) > 0 && emAberto(t, hoje)).length
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
  // Mudança relevante: +5 dias E +30% no atraso (ou no prazo de pagamento, quando há data de emissão)
  const piorou = (r: number | null, a: number | null) => r != null && a != null && r >= a + 5 && r >= a * 1.3
  const melhorou = (r: number | null, a: number | null) => r != null && a != null && r <= a - 5 && r <= a * 0.7
  const tendencia: DNA['tendencia'] = !janelasOk ? 'indefinida' : piorou(recA, antA) || piorou(recP, antP) ? 'piora' : melhorou(recA, antA) || melhorou(recP, antP) ? 'melhora' : 'estavel'
  const venceramAntes = lista.filter((t) => t.vencimento < hoje && (t.quitacao ? t.quitacao > t.vencimento : true))
  const recuperados = venceramAntes.filter((t) => t.quitacao && centavos(t.quitado) > 0)
  const ids = new Set(lista.map((t) => t.id))
  const minhas = promessas.filter((p) => ids.has(p.tituloId))
  const rd = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10)
  const conclusoes: DNA['conclusoes'] = []
  if (quitados.length) conclusoes.push({ tipo: 'fato', texto: `${quitados.length} título(s) quitado(s); atraso médio de ${Math.round(m!)} dia(s).` })
  if (janelasOk && recP != null && antP != null) conclusoes.push({ tipo: 'fato', texto: `Prazo médio de pagamento: ${Math.round(antP)} dias antes, ${Math.round(recP)} dias nos últimos ${mesesRecentes} meses.` })
  if (tendencia === 'piora') conclusoes.push({ tipo: 'inferencia', texto: 'Deterioração do comportamento de pagamento: acompanhar de perto antes de virar inadimplência.' })
  if (tendencia === 'melhora') conclusoes.push({ tipo: 'inferencia', texto: 'Comportamento de pagamento melhorando.' })
  if (quitados.length < 4) conclusoes.push({ tipo: 'fato', texto: 'Histórico insuficiente (menos de 4 títulos quitados): sem classificação.' })
  return {
    amostra: quitados.length, suficiente: quitados.length >= 4, atrasoMedio: rd(m),
    frequenciaAtrasoPct: quitados.length ? r2((atrasos.filter((a) => a > 0).length / quitados.length) * 100) : null,
    regularidadeDesvio: rd(desvio), prazoMedioPagamento: rd(media(prazos(quitados))),
    valorMedioRecebido: quitados.length ? r2(media(quitados.map((t) => t.quitado))!) : null,
    pagamentosParciais: parciais, acordos: minhas.filter((p) => p.tipo === 'acordo').length,
    recenteAtraso: rd(recA), anteriorAtraso: rd(antA), recentePrazo: rd(recP), anteriorPrazo: rd(antP), tendencia,
    amostraRecente: rec.length, amostraAnterior: ant.length,
    recuperacaoAnteriorPct: venceramAntes.length >= 2 ? r2((recuperados.length / venceramAntes.length) * 100) : null,
    promessas: placarPromessas(minhas, lista, hoje), conclusoes,
  }
}

// Linha do tempo do DNA: cada título quitado da contraparte, na ordem da quitação, com os dias de atraso
// (0 = pago em dia) — os pontos que sustentam a tendência. Só os últimos `max` para caber na tela.
export function linhaDoTempo(historico: Titulo[], max = 24) {
  return conferirEntrada(historico)
    .filter((t) => t.quitacao && centavos(t.quitado) > 0)
    .sort((a, b) => a.quitacao!.localeCompare(b.quitacao!))
    .slice(-max)
    .map((t) => ({ data: t.quitacao!, dias: Math.max(0, diasEntre(t.vencimento, t.quitacao!) - 1), valor: t.quitado }))
}

// ─── ROOT CAUSE — sugestão por regra (inferência até a pessoa confirmar); a IA entra pela mesma porta (origem 'ia') ───
const PISTAS: [Causa, RegExp][] = [
  ['insolvencia', /recupera[çc][aã]o judicial|fal[eê]ncia|insolv/i], ['nota_fiscal', /\bnota\b|nf-?e|danfe|cfop|xml/i],
  ['documental', /documento|comprovante|cadastro|contrato assinado/i], ['entrega', /entrega|frete|transport|n[aã]o recebi/i],
  ['qualidade', /defeito|qualidade|avaria|quebrad/i], ['divergencia_comercial', /diverg|pre[çc]o errado|pedido/i],
  ['contestacao_contratual', /cl[aá]usula|contesta/i], ['pagamento', /boleto|pix|cart[aã]o|banco|n[aã]o compensou/i],
  ['esquecimento', /esque[cç]/i], ['liquidez', /caixa|sem dinheiro|aperto|liquidez/i], ['financeiro', /dificuldade|crise/i],
]
export function sugerirCausa(texto: string, caso?: Caso | null): { causa: Causa; tipo: 'fato' | 'inferencia'; motivo: string } {
  if (caso?.causa && caso.causa !== 'desconhecido' && (CAUSAS as readonly string[]).includes(caso.causa))
    return { causa: caso.causa as Causa, tipo: caso.causaConfirmada ? 'fato' : 'inferencia', motivo: caso.causaConfirmada ? 'confirmada por pessoa' : `sugerida (${caso.causaOrigem ?? 'regra'}) — confirmar` }
  const achou = PISTAS.find(([, re]) => re.test(texto))
  return achou ? { causa: achou[0], tipo: 'inferencia', motivo: 'pista no texto do título/contato — confirmar' } : { causa: 'desconhecido', tipo: 'inferencia', motivo: 'sem pista suficiente' }
}

// ─── COLLECTION SCORES (0–1000) — risco de NÃO receber ≠ prioridade de atuação; fatores sempre visíveis ───
// Histórico insuficiente → score null + aviso (nunca número arbitrário apresentado como previsão).
export function riscoRecuperacao(t: Titulo, dna: DNA, hoje: string, caso?: Caso | null): Score {
  const f: Fator[] = []
  const dias = diasAtraso(t.vencimento, hoje)
  if (!dna.suficiente) return { score: null, fatores: [{ chave: 'dias_atraso', pontos: 0, texto: `${dias} dia(s) em atraso` }], dadosSuficientes: false, aviso: `histórico insuficiente (${dna.amostra} título(s) quitado(s); mínimo 4) — sem score de risco`, versao: VERSAO_METODOLOGIA }
  f.push({ chave: 'dias_atraso', pontos: Math.round(lim(dias / 180, 0, 1) * 300), texto: `${dias} dia(s) em atraso` })
  f.push({ chave: 'historico_atraso', pontos: Math.round(lim((dna.atrasoMedio ?? 0) / 60, 0, 1) * 150), texto: `atraso médio histórico de ${dna.atrasoMedio} dia(s)` })
  f.push({ chave: 'frequencia_atraso', pontos: Math.round(((dna.frequenciaAtrasoPct ?? 0) / 100) * 100), texto: `${dna.frequenciaAtrasoPct}% dos pagamentos com atraso` })
  if (dna.tendencia === 'piora') f.push({ chave: 'deterioracao', pontos: 120, texto: 'pagamentos piorando nos últimos meses' })
  if (dna.tendencia === 'melhora') f.push({ chave: 'melhora', pontos: -60, texto: 'pagamentos melhorando nos últimos meses' })
  if (dna.promessas.descumpridas) f.push({ chave: 'promessas_descumpridas', pontos: Math.min(150, dna.promessas.descumpridas * 50), texto: `${dna.promessas.descumpridas} promessa(s) descumprida(s)` })
  if (dna.recuperacaoAnteriorPct != null) f.push({ chave: 'recuperacao_anterior', pontos: Math.round((1 - dna.recuperacaoAnteriorPct / 100) * 100), texto: `${dna.recuperacaoAnteriorPct}% dos atrasos anteriores foram pagos` })
  const saldo = saldoDoTitulo(t, hoje)
  if (dna.valorMedioRecebido && saldo > dna.valorMedioRecebido * 2) f.push({ chave: 'exposicao', pontos: 60, texto: 'saldo acima do dobro do valor médio pago' })
  if (separarDisputa(saldo, caso).aberta) f.push({ chave: 'disputa', pontos: 80, texto: 'há divergência comercial aberta' })
  const causa = sugerirCausa('', caso).causa
  if (causa === 'insolvencia') f.push({ chave: 'insolvencia', pontos: 250, texto: 'insolvência informada' })
  if (causa === 'esquecimento' || causa === 'pagamento') f.push({ chave: 'causa_operacional', pontos: -80, texto: 'atraso por esquecimento/falha de pagamento costuma se resolver rápido' })
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f, dadosSuficientes: true, aviso: null, versao: VERSAO_METODOLOGIA }
}

export function prioridadeCobranca(t: Titulo, risco: number | null, hoje: string, ctx: { maiorSaldo: number; exposicaoContraparte?: number; maiorExposicao?: number; promessaDescumprida?: boolean; caixaPressionado?: boolean; historicoAtraso?: boolean; limites?: number[] }, caso?: Caso | null): Score {
  const f: Fator[] = []
  const d = separarDisputa(saldoDoTitulo(t, hoje), caso)
  f.push({ chave: 'valor', pontos: Math.round(lim(d.incontroverso / (ctx.maiorSaldo || 1), 0, 1) * 250), texto: 'peso do saldo incontroverso na carteira' })
  if (ctx.exposicaoContraparte && ctx.maiorExposicao) f.push({ chave: 'exposicao_total', pontos: Math.round(lim(ctx.exposicaoContraparte / ctx.maiorExposicao, 0, 1) * 120), texto: 'exposição total do cliente' })
  // Risco intermediário rende mais cobrar já (ainda recuperável); risco extremo pede análise especializada
  if (risco != null) f.push({ chave: 'recuperavel', pontos: Math.round((1 - Math.abs(risco - 450) / 550) * 200), texto: `probabilidade de a ação mudar o resultado (risco ${risco})` })
  else f.push({ chave: 'sem_historico', pontos: 80, texto: 'cliente sem histórico suficiente: acompanhar de perto' })
  const dias = diasAtraso(t.vencimento, hoje), limites = ctx.limites ?? FAIXAS_PADRAO
  f.push({ chave: 'dias_atraso', pontos: Math.round(lim(dias / 120, 0, 1) * 100), texto: `${dias} dia(s) em atraso` })
  const prox = rotulosFaixas(limites)[faixaDe(dias, limites)].ate
  if (prox != null && prox - dias <= 3) f.push({ chave: 'vai_mudar_faixa', pontos: 80, texto: `muda de faixa em ${prox - dias + 1} dia(s)` })
  if (ctx.promessaDescumprida) f.push({ chave: 'promessa_descumprida', pontos: 150, texto: 'promessa venceu sem pagamento' })
  if (ctx.historicoAtraso) f.push({ chave: 'historico_atraso', pontos: 70, texto: 'cliente com histórico de atrasos: acompanhamento mais próximo' })
  if (ctx.caixaPressionado) f.push({ chave: 'caixa', pontos: 130, texto: 'caixa da empresa abaixo da reserva' })
  const causa = sugerirCausa('', caso).causa
  if (['entrega', 'qualidade'].includes(causa)) f.push({ chave: 'causa_operacional', pontos: -60, texto: 'causa está na operação: resolver antes de cobrar' })
  if (d.aberta) f.push({ chave: 'disputa', pontos: -100, texto: 'resolver a divergência antes de cobrar o contestado' })
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f, dadosSuficientes: true, aviso: null, versao: VERSAO_METODOLOGIA }
}

// ─── SUPPLIER PAYMENT PRIORITY — obrigação menor pode vir antes se o fornecedor é essencial ───
export function prioridadeFornecedor(t: Titulo, hoje: string, ctx: { caixaDisponivel: number; totalVencidoPagar: number; maiorSaldo?: number }, caso?: Caso | null): Score {
  const f: Fator[] = []
  const saldo = saldoDoTitulo(t, hoje), dias = diasAtraso(t.vencimento, hoje)
  const crit = { critica: 280, alta: 190, media: 100, baixa: 30 }[caso?.criticidade ?? 'media']
  f.push({ chave: 'essencialidade', pontos: crit, texto: `essencialidade do fornecedor: ${caso?.criticidade ?? 'média (não informada)'}` })
  if (caso?.riscoInterrupcao) f.push({ chave: 'risco_operacional', pontos: 160, texto: 'risco de interromper fornecimento' })
  if (caso?.impactoProducao) f.push({ chave: 'producao', pontos: 120, texto: 'atraso afeta a produção' })
  if (caso?.impactoVendas) f.push({ chave: 'vendas', pontos: 100, texto: 'atraso afeta as vendas' })
  if (caso?.dependencia) f.push({ chave: 'relacao_comercial', pontos: { alto: 80, medio: 40, baixo: 0 }[caso.dependencia], texto: `dependência do fornecedor: ${caso.dependencia}` })
  const juros = Number(t.taxaJurosMesPct) || 0, multa = Number(t.taxaMultaPct) || 0
  f.push({ chave: 'juros', pontos: Math.round(lim(juros / 5, 0, 1) * 100), texto: juros ? `juros de ${juros}% ao mês` : 'sem juros informados' })
  if (multa) f.push({ chave: 'multa', pontos: Math.round(lim(multa / 10, 0, 1) * 50), texto: `multa de ${multa}%` })
  f.push({ chave: 'atraso', pontos: Math.round(lim(dias / 90, 0, 1) * 80), texto: `${dias} dia(s) em atraso` })
  if (ctx.maiorSaldo) f.push({ chave: 'valor', pontos: Math.round(lim(saldo / ctx.maiorSaldo, 0, 1) * 60), texto: 'peso do valor (não decide sozinho)' })
  if (separarDisputa(saldo, caso).aberta) f.push({ chave: 'contestado', pontos: -150, texto: 'cobrança contestada: pagar só o incontroverso' })
  if (ctx.caixaDisponivel < ctx.totalVencidoPagar) { const cabe = ctx.caixaDisponivel >= saldo; f.push({ chave: 'caixa', pontos: cabe ? 50 : -80, texto: cabe ? 'cabe no caixa atual' : 'caixa não cobre este título hoje' }) }
  return { score: Math.round(lim(f.reduce((s, x) => s + x.pontos, 0), 0, 1000)), fatores: f, dadosSuficientes: true, aviso: caso?.criticidade ? null : 'essencialidade não informada: considerada média', versao: VERSAO_METODOLOGIA }
}

// ─── NEGOTIATION ENGINE — simulação; toda concessão precisa de aprovação (IA nunca concede) ───
export type OpcaoNegociacao = { tipo: 'integral' | 'entrada_parcelas' | 'parcial' | 'desconto' | 'novo_vencimento' | 'renegociacao'; descontoPct?: number; entradaPct?: number; parcelas?: number; intervaloDias?: number; prazoDias?: number; valorParcial?: number; dispensarEncargos?: boolean }
export function simularNegociacao(saldo: number, op: OpcaoNegociacao, ctx: { custoCapitalMesPct: number; probabilidadeBase: number; encargos?: number; limiteDescontoSemAprovacaoPct?: number }) {
  const s = centavos(saldo), enc = op.dispensarEncargos ? 0 : centavos(ctx.encargos ?? 0)
  const devido = s + enc, desc = lim(op.descontoPct ?? 0, 0, 100)
  let total = Math.round(devido * (1 - desc / 100))
  if (op.tipo === 'parcial') total = Math.min(total, centavos(op.valorParcial ?? 0))
  const fluxo: { dia: number; valor: number }[] = []
  if (op.tipo === 'entrada_parcelas' || op.tipo === 'renegociacao') {
    const n = Math.max(1, Math.round(op.parcelas ?? 1)), entrada = Math.round(total * lim(op.entradaPct ?? 0, 0, 100) / 100)
    if (entrada) fluxo.push({ dia: 0, valor: entrada })
    const resto = total - entrada, parc = Math.floor(resto / n)
    for (let i = 1; i <= n; i++) fluxo.push({ dia: i * (op.intervaloDias ?? 30), valor: i === n ? resto - parc * (n - 1) : parc })
  } else fluxo.push({ dia: op.tipo === 'novo_vencimento' ? op.prazoDias ?? 30 : 0, valor: total })
  const vp = Math.round(fluxo.reduce((a, x) => a + x.valor / (1 + ctx.custoCapitalMesPct / 100) ** (x.dia / 30), 0))
  // Concessão aumenta a chance de pagar (heurística declarada na metodologia): até +25 p.p.
  const ganho = op.tipo === 'integral' ? 0 : Math.min(0.25, desc / 100 + (op.parcelas ? 0.08 : 0) + (op.tipo === 'novo_vencimento' ? 0.05 : 0) + (op.dispensarEncargos ? 0.03 : 0))
  const prob = lim(ctx.probabilidadeBase + ganho, 0, 1)
  const ate = (d: number) => reais(fluxo.filter((x) => x.dia <= d).reduce((a, x) => a + x.valor, 0))
  const concede = desc > (ctx.limiteDescontoSemAprovacaoPct ?? 0) || op.tipo !== 'integral' || !!op.dispensarEncargos
  return {
    tipo: op.tipo, saldo: reais(s), encargos: reais(enc), devido: reais(devido), desconto: reais(devido - total), totalNegociado: reais(total),
    // pagamento parcial deixa o resto em aberto; nas demais o que não é pago é desconto concedido (se aprovado)
    restanteEmAberto: reais(op.tipo === 'parcial' ? devido - total : 0),
    prazoFinalDias: Math.max(...fluxo.map((x) => x.dia)), valorPresente: reais(vp), custoOportunidade: reais(total - vp),
    probabilidade: r2(prob), valorLiquidoRecuperavel: reais(Math.round(vp * prob)),
    impactoLiquidez: { d30: ate(30), d60: ate(60), d90: ate(90) }, parcelas: fluxo.map((x) => ({ dia: x.dia, valor: reais(x.valor) })),
    precisaAprovacao: concede, aprovadores: concede ? ['dono', 'socio', 'admin'] : [], simulacao: true as const, versao: VERSAO_METODOLOGIA,
  }
}

// Recomendação entre alternativas: maior valor líquido esperado (valor presente × chance de pagar);
// no empate (até 1%), a que não exige concessão. A decisão continua sendo de dono/sócio/admin.
export function recomendarNegociacao<T extends ReturnType<typeof simularNegociacao>>(alternativas: T[]): { indice: number; motivo: 'maior_recuperacao' | 'sem_concessao' } | null {
  if (!alternativas.length) return null
  let melhor = 0
  for (let k = 1; k < alternativas.length; k++) {
    const a = alternativas[k], b = alternativas[melhor]
    const empate = Math.abs(a.valorLiquidoRecuperavel - b.valorLiquidoRecuperavel) <= Math.max(1, b.valorLiquidoRecuperavel * 0.01)
    if (empate ? !a.precisaAprovacao && b.precisaAprovacao : a.valorLiquidoRecuperavel > b.valorLiquidoRecuperavel) melhor = k
  }
  const m = alternativas[melhor]
  const empatou = alternativas.some((x, k) => k !== melhor && Math.abs(x.valorLiquidoRecuperavel - m.valorLiquidoRecuperavel) <= Math.max(1, m.valorLiquidoRecuperavel * 0.01))
  return { indice: melhor, motivo: empatou && !m.precisaAprovacao ? 'sem_concessao' : 'maior_recuperacao' }
}

// ─── RECOVERY FORECAST (7/15/30/60/90) — separado em prometido, negociação, disputa, esperado e sem previsão confiável ───
export const HORIZONTES = [7, 15, 30, 60, 90] as const
export const METODO_PREVISAO = 'heuristica-v1: pFinal=(1000-risco)/1000; curva 1-e^(-h/tau), tau=20+dias/2'
export type ItemPrevisao = { titulo: Titulo; risco: number | null; caso?: Caso | null; prometido?: number; emNegociacao?: boolean }
export function previsaoRecuperacao(itens: ItemPrevisao[], hoje: string) {
  const fotos: Record<string, number> = {}
  let base = 0, prometido = 0, negociacao = 0, disputa = 0, semPrevisao = 0
  const porH = HORIZONTES.map((h) => ({ horizonteDias: h, valor: 0 }))
  for (const { titulo, risco, caso, prometido: prom, emNegociacao } of itens) {
    if (!estaVencido(titulo, hoje)) continue
    const saldo = saldoDoTitulo(titulo, hoje)
    fotos[titulo.id] = saldo; base += centavos(saldo)
    const d = separarDisputa(saldo, caso)
    disputa += centavos(d.contestado); prometido += Math.min(centavos(prom ?? 0), centavos(d.incontroverso))
    if (emNegociacao) negociacao += centavos(d.incontroverso)
    // sem histórico suficiente → não entra na previsão (vai para "sem previsão confiável")
    if (risco == null) { semPrevisao += centavos(d.incontroverso); continue }
    const inc = centavos(d.incontroverso), pFinal = lim((1000 - risco) / 1000, 0, 1), tau = 20 + diasAtraso(titulo.vencimento, hoje) / 2
    for (const x of porH) x.valor += Math.round(inc * pFinal * (1 - Math.exp(-x.horizonteDias / tau)))
  }
  const comBase = itens.filter((i) => i.risco != null).length
  return {
    horizontes: porH.map((x) => ({ horizonteDias: x.horizonteDias, valor: reais(x.valor) })),
    composicao: { vencido: reais(base), prometido: reais(prometido), emNegociacao: reais(negociacao), emDisputa: reais(disputa), semPrevisaoConfiavel: reais(semPrevisao) },
    saldoBase: reais(base), titulos: fotos, metodo: METODO_PREVISAO, versao: VERSAO_METODOLOGIA, ehCaixa: false as const,
    confianca: comBase >= 20 ? 'media' : comBase > 0 ? 'baixa' : 'sem_dados',
    limitacoes: ['previsão, não caixa disponível; promessa também não é caixa', 'título de cliente sem histórico suficiente fica fora da previsão', 'pagamento parcial sem data por parcela: o realizado é medido pela variação do saldo', 'calibração melhora com o histórico de precisão'],
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

// ─── SIMULADOR DE RECUPERAÇÃO e IMPACTO NA TESOURARIA — vencido nunca é caixa; simulação nunca grava ───
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
    folgaSobreReserva: reais(caixaFinal - centavos(base.reservaMinima)), abaixoDaReserva: caixaFinal < centavos(base.reservaMinima),
  }
}
// Regularização de contas a pagar: caixa antes/depois de pagar as escolhidas (simulação, não grava)
export function simularPagamentos(base: BaseTesouraria, valores: number[]) {
  const pag = valores.reduce((t, v) => t + centavos(v), 0), antes = centavos(base.caixaDisponivel), depois = antes - pag
  return { simulacao: true as const, pagamento: reais(pag), caixaAntes: reais(antes), caixaDepois: reais(depois), folgaSobreReserva: reais(depois - centavos(base.reservaMinima)), abaixoDaReserva: depois < centavos(base.reservaMinima) }
}
// A pagar / a receber que vencem dentro do prazo do cenário (a partir de hoje), pela regra única de saldo
export function noPrazo(titulos: Titulo[], hoje: string, prazoDias: number): number {
  const ate = somarDiasISO(hoje, prazoDias)
  return reais(conferirEntrada(titulos).filter((t) => emAberto(t, hoje) && t.vencimento >= hoje && t.vencimento <= ate).reduce((s, t) => s + centavos(saldoDoTitulo(t, hoje)), 0))
}

// Cenário de recuperação (simulação, nunca grava): o vencido a receber é separado em prometido, em negociação e
// o restante, para não contar o mesmo dinheiro 2×. Recuperado = restante × % + prometido × (1 − % descumprido)
// + negociação (inteira se antecipada, senão × %). Mesmo caixa/cobertura/reserva de simularRecuperacao.
export type Cenario = { pct: number; prazoDias: number; prometido: number; emNegociacao: number; pctDescumpre: number; anteciparNegociacao: boolean }
export function simularCenarioRecuperacao(base: BaseTesouraria, c: Cenario) {
  if (!(c.pct >= 0 && c.pct <= 100) || !(c.pctDescumpre >= 0 && c.pctDescumpre <= 100)) throw new Error('vencidos: percentuais entre 0 e 100')
  const venc = centavos(base.vencidoReceber)
  const prom = Math.min(centavos(c.prometido), venc), neg = Math.min(centavos(c.emNegociacao), venc - prom)
  const resto = venc - prom - neg
  const daPromessa = Math.round(prom * (1 - c.pctDescumpre / 100))
  const daNegociacao = c.anteciparNegociacao ? neg : Math.round(neg * c.pct / 100)
  const doResto = Math.round(resto * c.pct / 100)
  const rec = doResto + daPromessa + daNegociacao
  const caixa = centavos(base.caixaDisponivel) + rec + centavos(base.aReceberNoPrazo) - centavos(base.aPagarNoPrazo) - centavos(base.vencidoPagar)
  const obrig = centavos(base.vencidoPagar) + centavos(base.aPagarNoPrazo)
  return {
    simulacao: true as const, ...c, recuperado: reais(rec), composicao: { doRestante: reais(doResto), dasPromessas: reais(daPromessa), dasNegociacoes: reais(daNegociacao) },
    aindaVencido: reais(venc - rec), caixaProjetado: reais(caixa), liquidezImediata: reais(centavos(base.caixaDisponivel) + rec - centavos(base.vencidoPagar)),
    coberturaObrigacoes: obrig ? r2((centavos(base.caixaDisponivel) + rec + centavos(base.aReceberNoPrazo)) / obrig) : null,
    capitalDeGiro: base.capitalDeGiro ?? null, folgaSobreReserva: reais(caixa - centavos(base.reservaMinima)),
    riscoRuptura: caixa < 0 ? 'alto' as const : caixa < centavos(base.reservaMinima) ? 'medio' as const : 'baixo' as const,
  }
}

export function impactoFinanceiro(base: BaseTesouraria, esperado30: number) {
  const caixa30 = centavos(base.caixaDisponivel) + centavos(esperado30) + centavos(base.aReceberNoPrazo) - centavos(base.aPagarNoPrazo) - centavos(base.vencidoPagar)
  const obrig = centavos(base.vencidoPagar) + centavos(base.aPagarNoPrazo)
  return {
    exposicaoInadimplencia: base.vencidoReceber, recuperacaoEsperada30: esperado30, obrigacoesCriticas: base.pagarCritico,
    liquidezAposVencidos: reais(centavos(base.caixaDisponivel) - centavos(base.vencidoPagar)),
    coberturaObrigacoes30: obrig ? r2((centavos(base.caixaDisponivel) + centavos(esperado30) + centavos(base.aReceberNoPrazo)) / obrig) : null,
    pressaoCapitalDeGiro: reais(Math.max(0, obrig - centavos(base.aReceberNoPrazo) - centavos(esperado30))),
    caixaProjetado30: reais(caixa30), folgaSobreReserva30: reais(caixa30 - centavos(base.reservaMinima)),
    riscoRuptura: caixa30 < 0 ? 'alto' : caixa30 < centavos(base.reservaMinima) ? 'medio' : 'baixo',
  }
}

// ─── ORQUESTRADOR — escolhe UMA próxima ação a partir da causa, risco, promessa, histórico e caixa; nunca executa ───
export type Acao = 'solicitar_pagamento' | 'reenviar_meio_pagamento' | 'resolver_divergencia' | 'solicitar_documentacao' | 'encaminhar_operacao' | 'criar_promessa' | 'propor_negociacao' | 'escalonar_cobranca' | 'acompanhar' | 'analise_especializada' | 'seguir_regua'
  | 'pagar_agora' | 'pagar_incontroverso' | 'negociar_prazo_fornecedor' | 'aguardar_caixa'
export function proximaAcao(e: { titulo: Titulo; hoje: string; risco: number | null; dna: DNA; caso?: Caso | null; promessa?: SituacaoPromessa | null; caixaDisponivel?: number; etapaRegua?: string | null }): { acao: Acao; justificativa: string; consideracoes: string[] } {
  const { titulo: t, hoje, risco, caso } = e
  const dias = diasAtraso(t.vencimento, hoje), saldo = saldoDoTitulo(t, hoje), d = separarDisputa(saldo, caso)
  const causa = sugerirCausa('', caso).causa
  const c = [`${dias} dia(s) de atraso`, risco == null ? 'sem score (histórico insuficiente)' : `risco ${risco}/1000`, `causa: ${causa}`]
  if (t.dominio === 'pagar') {
    if (d.aberta) return { acao: 'pagar_incontroverso', justificativa: `Cobrança contestada: o incontroverso (R$ ${d.incontroverso}) pode ser pago; o contestado espera a solução.`, consideracoes: c }
    if ((e.caixaDisponivel ?? Infinity) < saldo) return { acao: caso?.criticidade === 'critica' || caso?.riscoInterrupcao || caso?.impactoProducao ? 'negociar_prazo_fornecedor' : 'aguardar_caixa', justificativa: 'Caixa não cobre o título hoje: negociar prazo com fornecedor essencial; os demais aguardam a ordem de prioridade.', consideracoes: c }
    return { acao: 'pagar_agora', justificativa: 'Caixa cobre e o atraso gera custo e risco de relacionamento.', consideracoes: c }
  }
  if (d.aberta) return { acao: 'resolver_divergencia', justificativa: 'Há divergência aberta: cobrar o contestado agora desgasta e não recebe. Resolver primeiro; o incontroverso segue cobrado.', consideracoes: c }
  if (['nota_fiscal', 'documental', 'erro_administrativo'].includes(causa)) return { acao: 'solicitar_documentacao', justificativa: 'Atraso por problema fiscal/documental: corrigir ou reenviar o documento costuma destravar o pagamento.', consideracoes: c }
  if (['entrega', 'qualidade'].includes(causa)) return { acao: 'encaminhar_operacao', justificativa: 'Atraso causado por entrega/qualidade: a solução está na operação, não na cobrança.', consideracoes: c }
  if (causa === 'insolvencia') return { acao: 'analise_especializada', justificativa: 'Insolvência informada: avaliar habilitação de crédito com especialista (nenhuma medida jurídica é automática).', consideracoes: c }
  if (causa === 'pagamento') return { acao: 'reenviar_meio_pagamento', justificativa: 'Falha no meio de pagamento: reenviar boleto/Pix atualizado.', consideracoes: c }
  if (e.promessa === 'descumprida') return { acao: risco != null && risco >= 700 ? 'escalonar_cobranca' : 'propor_negociacao', justificativa: 'Promessa venceu sem pagamento: registrar e decidir o próximo nível.', consideracoes: c }
  if (e.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(e.promessa)) return { acao: 'acompanhar', justificativa: 'Há promessa em prazo: acompanhar até a data (promessa não é caixa).', consideracoes: c }
  if (risco != null && risco >= 850 && dias > 90) return { acao: 'analise_especializada', justificativa: 'Risco muito alto e atraso longo: avaliar com especialista (nenhuma medida jurídica é automática).', consideracoes: c }
  if (['liquidez', 'financeiro'].includes(causa) || (dias > 30 && risco != null && risco >= 500)) return { acao: 'propor_negociacao', justificativa: 'Falta de caixa do cliente: negociar aumenta a recuperação esperada (simular antes; concessão exige aprovação).', consideracoes: c }
  if (dias > 15 && e.dna.tendencia === 'piora') return { acao: 'criar_promessa', justificativa: 'Pagador piorando: fechar data e valor comprometidos.', consideracoes: c }
  if (causa === 'esquecimento' || dias <= 7) return { acao: 'solicitar_pagamento', justificativa: 'Atraso recente/esquecimento: lembrete cordial com o meio de pagamento.', consideracoes: c }
  if (e.etapaRegua) return { acao: 'seguir_regua', justificativa: `Etapa da régua de cobrança de hoje: ${e.etapaRegua}.`, consideracoes: c }
  return { acao: dias > 60 ? 'escalonar_cobranca' : 'solicitar_pagamento', justificativa: dias > 60 ? 'Atraso longo sem resposta: subir o nível da cobrança.' : 'Pedido de pagamento.', consideracoes: c }
}

// ─── ALERTAS (só avisam; nada é disparado para fora) ───
// Divergência parada: aberta com prazo vencido ou sem nenhuma atualização há `dias` dias (padrão 15)
export function disputaParada(d: { status?: string | null; prazo?: string | null; atualizadoEm?: string | null }, hoje: string, dias = 15): { parada: boolean; prazoVencido: boolean; diasSemAtualizar: number | null } {
  const aberta = !!d.status && ['aberta', 'em_analise'].includes(d.status)
  const prazoVencido = aberta && !!d.prazo && d.prazo < hoje
  const sem = d.atualizadoEm ? Math.max(0, diasEntre(d.atualizadoEm.slice(0, 10), hoje) - 1) : null
  return { parada: aberta && (prazoVencido || (sem != null && sem >= dias)), prazoVencido, diasSemAtualizar: sem }
}

// Níveis (etapa 12): normal (só acompanhar) · atencao · alto (risco alto) · critico (agir hoje)
export type NivelAlerta = 'normal' | 'atencao' | 'alto' | 'critico'
export const NIVEIS_ALERTA: NivelAlerta[] = ['critico', 'alto', 'atencao', 'normal']
export type TipoAlerta = 'promessa_descumprida' | 'deterioracao' | 'migracao_faixa' | 'disputa_prazo' | 'fornecedor_essencial' | 'ruptura_caixa' | 'risco_alto' | 'sem_acompanhamento' | 'promessa_no_prazo'
// `chave` identifica o alerta para marcar como tratado; `dados` monta o texto nos 3 idiomas na tela (o `texto` em pt vai para as IAs)
export type AlertaVencido = { chave: string; tipo: TipoAlerta; severidade: NivelAlerta; tituloId?: string; dominio?: Dominio; texto: string; dados: { nome?: string; de?: number | null; para?: number | null; pct?: number; dias?: number; risco?: number } }
export function alertasVencidos(e: { itens: { titulo: Titulo; dna: DNA; promessa: SituacaoPromessa | null; caso?: Caso | null; disputaPrazo?: string | null; risco?: number | null; ultimoContato?: string | null }[]; hoje: string; migracao: ReturnType<typeof migracaoAging>; impacto: ReturnType<typeof impactoFinanceiro> }): AlertaVencido[] {
  const a: AlertaVencido[] = []
  const vistos = new Set<string>()
  const add = (x: Omit<AlertaVencido, 'chave'>) => a.push({ ...x, chave: `${x.tipo}:${x.tituloId ?? 'geral'}` })
  for (const i of e.itens) {
    const nome = i.titulo.contraparteNome ?? '', base = { tituloId: i.titulo.id, dominio: i.titulo.dominio }
    const dias = diasAtraso(i.titulo.vencimento, e.hoje)
    if (i.promessa === 'descumprida') add({ ...base, tipo: 'promessa_descumprida', severidade: 'alto', texto: `${nome}: promessa de pagamento descumprida`, dados: { nome } })
    else if (i.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(i.promessa)) add({ ...base, tipo: 'promessa_no_prazo', severidade: 'normal', texto: `${nome}: promessa de pagamento no prazo — acompanhar até a data`, dados: { nome } })
    const k = chaveContraparte(i.titulo)
    if (i.dna.tendencia === 'piora' && !vistos.has(k)) { vistos.add(k); const de = i.dna.anteriorPrazo ?? i.dna.anteriorAtraso, para = i.dna.recentePrazo ?? i.dna.recenteAtraso; add({ ...base, tipo: 'deterioracao', severidade: 'atencao', texto: `${nome}: prazo de pagamento piorou (${de} → ${para} dias)`, dados: { nome, de, para } }) }
    if (i.disputaPrazo && i.disputaPrazo < e.hoje && separarDisputa(1, i.caso).aberta) add({ ...base, tipo: 'disputa_prazo', severidade: 'atencao', texto: `${nome}: prazo da divergência vencido`, dados: { nome } })
    if (i.titulo.dominio === 'pagar' && (i.caso?.criticidade === 'critica' || i.caso?.riscoInterrupcao)) add({ ...base, tipo: 'fornecedor_essencial', severidade: 'critico', texto: `${nome}: fornecedor essencial com pagamento vencido`, dados: { nome } })
    if (i.titulo.dominio === 'receber' && i.risco != null && i.risco >= 700 && dias > 0) add({ ...base, tipo: 'risco_alto', severidade: 'alto', texto: `${nome}: nota de risco ${i.risco}/1000`, dados: { nome, risco: i.risco } })
    // vencida há mais de 30 dias sem contato registrado nos últimos 15 dias
    if (i.titulo.dominio === 'receber' && dias > 30 && i.promessa == null && (!i.ultimoContato || diasEntre(i.ultimoContato.slice(0, 10), e.hoje) - 1 > 15)) add({ ...base, tipo: 'sem_acompanhamento', severidade: 'atencao', texto: `${nome}: ${dias} dias de atraso sem contato nos últimos 15 dias`, dados: { nome, dias } })
  }
  const pct = e.migracao.indiceDeterioracaoPct
  if (pct >= 30) add({ tipo: 'migracao_faixa', severidade: pct >= 50 ? 'alto' : 'atencao', texto: `${pct}% do vencido entrou ou piorou de faixa em 30 dias`, dados: { pct } })
  if (e.impacto.riscoRuptura !== 'baixo') add({ tipo: 'ruptura_caixa', severidade: e.impacto.riscoRuptura === 'alto' ? 'critico' : 'alto', texto: e.impacto.riscoRuptura === 'alto' ? 'caixa projetado em 30 dias negativo' : 'caixa projetado em 30 dias abaixo da reserva mínima', dados: {} })
  return a.sort((x, y) => NIVEIS_ALERTA.indexOf(x.severidade) - NIVEIS_ALERTA.indexOf(y.severidade))
}

// ─── PILOTO AUTOMÁTICO SUPERVISIONADO (etapa 13) ───
// Monta a fila de ações do dia a partir das regras; NADA sai sozinho: cada ação abre a conta para a pessoa enviar/decidir.
// Some da fila quando a pessoa registra o contato (o último contato passa a ser recente).
export type RegraPiloto = 'lembrete_inicio' | 'confirmar_promessa' | 'promessa_descumprida' | 'sem_contato' | 'fornecedor_essencial' | 'divergencia_parada'
export const REGRAS_PILOTO: RegraPiloto[] = ['fornecedor_essencial', 'promessa_descumprida', 'divergencia_parada', 'sem_contato', 'confirmar_promessa', 'lembrete_inicio']
export type AcaoPiloto = { chave: string; regra: RegraPiloto; tituloId: string; dominio: Dominio; nome: string; saldo: number; dias: number }
export function filaDoDia(itens: { titulo: Titulo; saldo: number; promessa: SituacaoPromessa | null; caso?: Caso | null; ultimoContato?: string | null; disputaParada?: boolean }[], hoje: string, ligadas: RegraPiloto[] = REGRAS_PILOTO): AcaoPiloto[] {
  const on = new Set(ligadas), fila: AcaoPiloto[] = []
  const semContato = (u: string | null | undefined, d: number) => !u || diasEntre(u.slice(0, 10), hoje) - 1 > d
  for (const i of itens) {
    const t = i.titulo, dias = diasAtraso(t.vencimento, hoje)
    if (dias <= 0 || i.saldo <= 0) continue
    const disputa = separarDisputa(i.saldo, i.caso).aberta
    let regra: RegraPiloto | null = null
    if (t.dominio === 'pagar') { if (i.caso?.criticidade === 'critica' || i.caso?.riscoInterrupcao) regra = 'fornecedor_essencial' }
    else if (disputa) { if (i.disputaParada) regra = 'divergencia_parada' }
    else if (i.promessa === 'descumprida') regra = 'promessa_descumprida'
    else if (i.promessa && ['pendente', 'confirmada', 'parcialmente_cumprida'].includes(i.promessa)) { if (semContato(i.ultimoContato, 3)) regra = 'confirmar_promessa' }
    else if (dias > 30 && semContato(i.ultimoContato, 15)) regra = 'sem_contato'
    else if (dias <= 7 && (!i.ultimoContato || i.ultimoContato.slice(0, 10) < t.vencimento)) regra = 'lembrete_inicio'
    if (regra && on.has(regra)) fila.push({ chave: `${regra}:${t.id}`, regra, tituloId: t.id, dominio: t.dominio, nome: t.contraparteNome ?? '', saldo: i.saldo, dias })
  }
  return fila.sort((a, b) => REGRAS_PILOTO.indexOf(a.regra) - REGRAS_PILOTO.indexOf(b.regra) || b.saldo - a.saldo)
}
