// ═══════════════════════════════════════════════════════════════
// CÁLCULOS FINANCEIROS DETERMINÍSTICOS (Plano 3, Tarefa 1). Puros: recebem linhas do banco e devolvem números
// — mesmas entradas, mesmo resultado — testados com dados sintéticos em scripts/check-financeiro.mts.
// Somas em centavos inteiros (lib/financeiro/contrato). Regras iguais às telas (citadas em cada função).
// ═══════════════════════════════════════════════════════════════
import { centavos, reais } from './contrato'
import { balde, dentro, diasEntre, type Granularidade } from './periodos'

type Faixa = { inicio: string; fim: string }
const cancelado = (status: unknown) => /cancel/i.test(String(status ?? ''))
const r2 = (v: number) => Math.round(v * 100) / 100

// ─── Títulos (contas a receber / a pagar) ───
export type TituloReceber = { id: string; valor: number | null; valor_recebido?: number | null; valor_desconto?: number | null; taxa_multa?: number | null; taxa_juros?: number | null; data_vencimento: string | null; data_emissao?: string | null; data_recebimento?: string | null; status?: string | null; cliente_id?: string | null; descricao?: string | null; categoria?: string | null; numero_documento?: string | null; competencia?: string | null }
export type TituloPagar = { id: string; valor_total: number | null; valor_pago?: number | null; data_vencimento: string | null; data_emissao?: string | null; data_pagamento?: string | null; status?: string | null; fornecedor_id?: string | null; descricao?: string | null; categoria?: string | null; numero_nota?: string | null; chave_acesso?: string | null }

// Mesma conta da tela Contas a Receber (calcularLinha): principal = valor − desconto − recebido;
// atualizado soma multa (uma vez) e juros proporcionais aos dias de atraso.
export function saldoReceber(c: TituloReceber, hoje: string) {
  const dias = c.data_vencimento && c.data_vencimento < hoje ? diasEntre(c.data_vencimento, hoje) - 1 : 0
  const desconto = centavos(c.valor_desconto), valor = centavos(c.valor), recebido = centavos(c.valor_recebido)
  const principal = Math.max(0, valor - desconto - recebido)
  const base = Math.max(0, valor - recebido)
  const multa = dias > 0 && base > 0 ? Math.round(base * ((Number(c.taxa_multa) || 0) / 100)) : 0
  const juros = dias > 0 && base > 0 ? Math.round(base * ((Number(c.taxa_juros) || 0) / 100) * (dias / 30)) : 0
  return { principal: reais(principal), atualizado: reais(Math.max(0, valor - desconto + multa + juros - recebido)), dias }
}
export const saldoPagar = (c: TituloPagar) => reais(Math.max(0, centavos(c.valor_total) - centavos(c.valor_pago)))

export type Totais = { aberto: number; vencido: number; a_vencer: number; titulos_abertos: number; titulos_vencidos: number; cancelados_ignorados: number }
// Posição de hoje. Com `faixa`, só títulos com VENCIMENTO dentro dela (ex.: "vence esta semana").
export function totalizarReceber(lista: TituloReceber[], hoje: string, faixa?: Faixa): Totais & { aberto_atualizado: number } {
  let ab = 0, ve = 0, at = 0, nAb = 0, nVe = 0, canc = 0
  for (const c of lista) {
    if (cancelado(c.status)) { canc++; continue }
    if (faixa && !dentro(c.data_vencimento, faixa)) continue
    const s = saldoReceber(c, hoje)
    if (s.principal <= 0) continue
    ab += centavos(s.principal); at += centavos(s.atualizado); nAb++
    if (c.data_vencimento && c.data_vencimento < hoje) { ve += centavos(s.principal); nVe++ }
  }
  return { aberto: reais(ab), aberto_atualizado: reais(at), vencido: reais(ve), a_vencer: reais(ab - ve), titulos_abertos: nAb, titulos_vencidos: nVe, cancelados_ignorados: canc }
}
export function totalizarPagar(lista: TituloPagar[], hoje: string, faixa?: Faixa): Totais {
  let ab = 0, ve = 0, nAb = 0, nVe = 0, canc = 0
  for (const c of lista) {
    if (cancelado(c.status)) { canc++; continue }
    if (faixa && !dentro(c.data_vencimento, faixa)) continue
    const s = centavos(saldoPagar(c))
    if (s <= 0) continue
    ab += s; nAb++
    if (c.data_vencimento && c.data_vencimento < hoje) { ve += s; nVe++ }
  }
  return { aberto: reais(ab), vencido: reais(ve), a_vencer: reais(ab - ve), titulos_abertos: nAb, titulos_vencidos: nVe, cancelados_ignorados: canc }
}

// ─── Movimentos REALIZADOS (caixa) no período: pela data do recebimento/pagamento ───
export type Venda = { valor_total: number | null; status?: string | null; forma_pagamento?: string | null; finalizada_em?: string | null; criado_em?: string | null; cancelada_em?: string | null }
export function movimentosRealizados(receber: TituloReceber[], pagar: TituloPagar[], vendasDia: { dia: string; valor: number; forma: string | null; cancelada: boolean }[], faixa: Faixa) {
  let rec = 0, pag = 0, pdv = 0, nRec = 0, nPag = 0, nPdv = 0, semDataRec = 0, semDataPag = 0
  for (const c of receber) {
    if (cancelado(c.status) || centavos(c.valor_recebido) <= 0) continue
    if (!c.data_recebimento) { semDataRec++; continue }
    if (dentro(c.data_recebimento, faixa)) { rec += centavos(c.valor_recebido); nRec++ }
  }
  for (const c of pagar) {
    if (cancelado(c.status) || centavos(c.valor_pago) <= 0) continue
    if (!c.data_pagamento) { semDataPag++; continue }
    if (dentro(c.data_pagamento, faixa)) { pag += centavos(c.valor_pago); nPag++ }
  }
  // PDV pago na hora entra no dia; crédito é previsão de repasse (mesma regra do lib/caixaSaldo)
  for (const v of vendasDia) if (!v.cancelada && v.forma !== 'credito' && dentro(v.dia, faixa)) { pdv += centavos(v.valor); nPdv++ }
  return { recebido_clientes: reais(rec), recebido_pdv: reais(pdv), recebido_total: reais(rec + pdv), pago_fornecedores: reais(pag), saldo_do_periodo: reais(rec + pdv - pag),
    registros: nRec + nPag + nPdv, recebimentos_sem_data: semDataRec, pagamentos_sem_data: semDataPag }
}

// ─── Séries e comparação ───
export function serie(itens: { valor: number; data: string }[], faixa: Faixa, g: Granularidade) {
  const m = new Map<string, number>()
  for (const i of itens) if (dentro(i.data, faixa)) m.set(balde(i.data, g), (m.get(balde(i.data, g)) ?? 0) + centavos(i.valor))
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([chave, c]) => ({ chave, valor: reais(c) }))
}
export function somaFaixa(itens: { valor: number; data: string }[], faixa: Faixa) {
  let c = 0, n = 0
  for (const i of itens) if (dentro(i.data, faixa)) { c += centavos(i.valor); n++ }
  return { valor: reais(c), registros: n }
}
// Variação contra o período anterior; sem registros no anterior = sem base para comparar (nunca "infinito %")
export function comparar(atual: { valor: number; registros: number }, anterior: { valor: number; registros: number }) {
  const dif = reais(centavos(atual.valor) - centavos(anterior.valor))
  if (anterior.registros === 0) return { diferenca: dif, variacao_pct: null, cobertura_anterior: false }
  return { diferenca: dif, variacao_pct: anterior.valor !== 0 ? r2((dif / Math.abs(anterior.valor)) * 100) : null, cobertura_anterior: true }
}

// ─── Agrupamentos ───
export function agrupar<T>(itens: T[], chave: (i: T) => string, valor: (i: T) => number, limite = 15) {
  const m = new Map<string, { c: number; n: number }>()
  for (const i of itens) { const k = chave(i) || 'Sem classificação'; const a = m.get(k) ?? { c: 0, n: 0 }; a.c += centavos(valor(i)); a.n++; m.set(k, a) }
  const lista = [...m.entries()].sort((a, b) => b[1].c - a[1].c)
  const total = lista.reduce((s, [, v]) => s + v.c, 0)
  return { total: reais(total), grupos: lista.slice(0, limite).map(([nome, v]) => ({ nome, valor: reais(v.c), registros: v.n, pct: total ? r2((v.c / total) * 100) : 0 })), outros_grupos: Math.max(0, lista.length - limite) }
}

// ─── Custos fixos: ativos × encerrados no mês (mesma vigência da DRE) ───
export type CustoFixo = { id: string; descricao?: string | null; categoria?: string | null; valor_mensal: number | null; data_inicio?: string | null; data_fim?: string | null; created_at?: string | null }
export function custosFixosNoMes(lista: CustoFixo[], mes: string) {
  const inicio = (c: CustoFixo) => (c.data_inicio || String(c.created_at || '').slice(0, 10) || '1900-01-01').slice(0, 7)
  const ativos = lista.filter((c) => inicio(c) <= mes && (!c.data_fim || c.data_fim.slice(0, 7) >= mes))
  const encerrados = lista.filter((c) => c.data_fim && c.data_fim.slice(0, 7) < mes)
  const futuros = lista.filter((c) => inicio(c) > mes)
  const soma = (l: CustoFixo[]) => reais(l.reduce((s, c) => s + centavos(c.valor_mensal), 0))
  return { mes, total_ativo: soma(ativos), ativos: ativos.length, encerrados: encerrados.length, total_encerrado_nao_conta: soma(encerrados), futuros: futuros.length, sem_data_inicio: lista.filter((c) => !c.data_inicio).length }
}
