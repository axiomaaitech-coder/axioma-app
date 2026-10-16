// ═══════════════════════════════════════════════════════════════
// RECONCILIAÇÃO E CONSISTÊNCIA (Plano 3, Tarefa 1). Só LÊ e aponta: nada é corrigido nem apagado aqui.
// Cada achado traz a classificação, o motivo e os ids envolvidos (para rastrear na tela).
// Mesmo valor sozinho NUNCA é duplicidade: precisa de identificador (chave da NF-e, nº do documento) para
// "confirmada"; valor + data + contraparte + descrição iguais = "possível".
// ═══════════════════════════════════════════════════════════════
import { centavos } from './contrato'
import type { TituloPagar, TituloReceber } from './calculos'

export type Classe = 'correspondencia_confirmada' | 'possivel_correspondencia' | 'divergencia' | 'informacao_insuficiente'
export type Achado = { tipo: string; classe: Classe; motivo: string; ids: string[]; valor?: number }

const norm = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const cancelado = (s: unknown) => /cancel/i.test(String(s ?? ''))

function grupos<T extends { id: string }>(lista: T[], chave: (t: T) => string | null) {
  const m = new Map<string, string[]>()
  for (const t of lista) { const k = chave(t); if (!k) continue; m.set(k, [...(m.get(k) ?? []), t.id]) }
  return [...m.values()].filter((ids) => ids.length > 1)
}

export function duplicidadesPagar(lista: TituloPagar[]): Achado[] {
  const vivos = lista.filter((c) => !cancelado(c.status))
  const out: Achado[] = []
  const confirmados = new Set<string>()
  for (const ids of grupos(vivos, (c) => (c.chave_acesso ? `ch:${c.chave_acesso}` : null))) { ids.forEach((i) => confirmados.add(i)); out.push({ tipo: 'duplicidade_conta_pagar', classe: 'correspondencia_confirmada', motivo: 'mesma chave de acesso da NF-e lançada mais de uma vez', ids }) }
  for (const ids of grupos(vivos, (c) => (c.numero_nota && c.fornecedor_id ? `nf:${c.fornecedor_id}:${norm(c.numero_nota)}` : null))) {
    if (ids.every((i) => confirmados.has(i))) continue
    ids.forEach((i) => confirmados.add(i)); out.push({ tipo: 'duplicidade_conta_pagar', classe: 'correspondencia_confirmada', motivo: 'mesmo fornecedor e mesmo número de nota', ids })
  }
  for (const ids of grupos(vivos, (c) => (c.fornecedor_id && c.data_vencimento ? `p:${c.fornecedor_id}:${centavos(c.valor_total)}:${c.data_vencimento}:${norm(c.descricao)}` : null))) {
    if (ids.every((i) => confirmados.has(i))) continue
    out.push({ tipo: 'duplicidade_conta_pagar', classe: 'possivel_correspondencia', motivo: 'mesmo fornecedor, valor, vencimento e descrição (sem número de nota para confirmar)', ids })
  }
  return out
}

export function duplicidadesReceber(lista: TituloReceber[]): Achado[] {
  const vivos = lista.filter((c) => !cancelado(c.status))
  const out: Achado[] = []
  const conf = new Set<string>()
  for (const ids of grupos(vivos, (c) => (c.numero_documento && c.cliente_id ? `d:${c.cliente_id}:${norm(c.numero_documento)}` : null))) { ids.forEach((i) => conf.add(i)); out.push({ tipo: 'duplicidade_conta_receber', classe: 'correspondencia_confirmada', motivo: 'mesmo cliente e mesmo número de documento', ids }) }
  for (const ids of grupos(vivos, (c) => (c.cliente_id && c.data_vencimento ? `p:${c.cliente_id}:${centavos(c.valor)}:${c.data_vencimento}:${norm(c.descricao)}` : null))) {
    if (ids.every((i) => conf.has(i))) continue
    out.push({ tipo: 'duplicidade_conta_receber', classe: 'possivel_correspondencia', motivo: 'mesmo cliente, valor, vencimento e descrição (sem número de documento para confirmar)', ids })
  }
  return out
}

// Status × valores × datas
export function coerenciaPagar(lista: TituloPagar[]): Achado[] {
  const out: Achado[] = []
  for (const c of lista) {
    if (cancelado(c.status)) continue
    const saldo = centavos(c.valor_total) - centavos(c.valor_pago)
    if (/^pago$/i.test(String(c.status)) && saldo > 0) out.push({ tipo: 'status_pago_com_saldo', classe: 'divergencia', motivo: 'marcada como paga, mas o valor pago é menor que o total', ids: [c.id], valor: saldo / 100 })
    if (/pendente/i.test(String(c.status)) && centavos(c.valor_total) > 0 && saldo <= 0) out.push({ tipo: 'status_pendente_quitada', classe: 'divergencia', motivo: 'marcada como pendente, mas já está totalmente paga', ids: [c.id] })
    if (centavos(c.valor_pago) > 0 && !c.data_pagamento) out.push({ tipo: 'pagamento_sem_data', classe: 'informacao_insuficiente', motivo: 'tem valor pago sem data do pagamento (não entra no caixa do período)', ids: [c.id] })
    if (c.data_emissao && c.data_vencimento && c.data_vencimento < c.data_emissao) out.push({ tipo: 'vencimento_antes_da_emissao', classe: 'divergencia', motivo: 'vencimento anterior à emissão', ids: [c.id] })
    if (!String(c.categoria ?? '').trim()) out.push({ tipo: 'sem_categoria', classe: 'informacao_insuficiente', motivo: 'conta a pagar sem categoria (some dos agrupamentos por categoria)', ids: [c.id] })
  }
  return out
}
export function coerenciaReceber(lista: TituloReceber[]): Achado[] {
  const out: Achado[] = []
  for (const c of lista) {
    if (cancelado(c.status)) continue
    const saldo = centavos(c.valor) - centavos(c.valor_desconto) - centavos(c.valor_recebido)
    if (/^recebido$/i.test(String(c.status)) && saldo > 0) out.push({ tipo: 'status_recebido_com_saldo', classe: 'divergencia', motivo: 'marcada como recebida, mas ainda há saldo', ids: [c.id], valor: saldo / 100 })
    if (centavos(c.valor_recebido) > 0 && !c.data_recebimento) out.push({ tipo: 'recebimento_sem_data', classe: 'informacao_insuficiente', motivo: 'tem valor recebido sem data do recebimento', ids: [c.id] })
    if (c.data_emissao && c.data_vencimento && c.data_vencimento < c.data_emissao) out.push({ tipo: 'vencimento_antes_da_emissao', classe: 'divergencia', motivo: 'vencimento anterior à emissão', ids: [c.id] })
  }
  return out
}

// Receitas × contas a receber × fluxo × PDV
export type LinhaReceitaRec = { id: string; valor: number | null; status?: string | null; origem_tabela?: string | null; origem_id?: string | null; data?: string | null }
export type LinhaFluxoRec = { id: string; status?: string | null; tipo?: string | null; valor: number | null }
export function cruzamentos(p: { receitas: LinhaReceitaRec[]; fluxo: LinhaFluxoRec[]; vendasSemData: string[] }): Achado[] {
  const out: Achado[] = []
  const pendRec = p.receitas.filter((r) => /pendente/i.test(String(r.status)) && r.origem_tabela === 'contas_receber')
  if (pendRec.length) out.push({ tipo: 'receita_pendente_de_conta_a_receber', classe: 'divergencia', motivo: 'receita "pendente" criada a partir de conta a receber: a mesma venda pode aparecer duas vezes conforme a tela (a DRE ignora; o resumo de 12 meses pode somar)', ids: pendRec.map((r) => r.id), valor: pendRec.reduce((s, r) => s + centavos(r.valor), 0) / 100 })
  const conf = p.fluxo.filter((f) => /confirmado/i.test(String(f.status)))
  if (conf.length) out.push({ tipo: 'fluxo_status_confirmado', classe: 'informacao_insuficiente', motivo: 'lançamentos do Fluxo de Caixa com status "confirmado" ficam fora do caixa realizado — falta definir se são dinheiro realizado', ids: conf.map((f) => f.id), valor: conf.reduce((s, f) => s + (f.tipo === 'saida' ? -1 : 1) * centavos(f.valor), 0) / 100 })
  if (p.vendasSemData.length) out.push({ tipo: 'venda_pdv_sem_data', classe: 'informacao_insuficiente', motivo: 'venda finalizada sem data de finalização (usa a data de criação)', ids: p.vendasSemData })
  return out
}

export function resumoAchados(achados: Achado[]) {
  const por = (c: Classe) => achados.filter((a) => a.classe === c).length
  return { total: achados.length, confirmadas: por('correspondencia_confirmada'), possiveis: por('possivel_correspondencia'), divergencias: por('divergencia'), insuficientes: por('informacao_insuficiente') }
}
