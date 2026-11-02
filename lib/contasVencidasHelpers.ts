// Contas Vencidas (Elias 2026-11-02): a pagar e a receber atrasadas numa tela só, com o caminho
// até a baixa em Contas a Pagar / Contas a Receber. Só leitura. Mesma regra de "em aberto" das
// telas de origem: a pagar = não paga/cancelada com saldo; a receber = não recebida/cancelada com saldo.
import { createClient } from './supabase/client'
import { comRetentativa } from './antiFalha'
import { reportarFalhaLeitura } from './erroUiHelpers'
import { hojeISO } from './datas'

export type ContaVencida = { id: string; tipo: 'pagar' | 'receber'; descricao: string; nome: string; vencimento: string; dias: number; saldo: number }
export type ResumoVencidas = { pagar: ContaVencida[]; receber: ContaVencida[]; totalPagar: number; totalReceber: number; falhou: boolean }

type Linha = { id: string; descricao: string | null; status: string | null; data_vencimento: string | null; total: number; quitado: number; nome: string | null }
const FECHADOS = new Set(['pago', 'recebido', 'cancelado', 'cancelada'])

const diasEntre = (de: string, ate: string) => Math.floor((new Date(`${ate}T00:00:00`).getTime() - new Date(`${de}T00:00:00`).getTime()) / 86400000)

// Pura (testada em scripts/check-contas-vencidas.mts): o que está vencido e quanto falta, mais antigas primeiro.
export function separarVencidas(linhas: Linha[], tipo: ContaVencida['tipo'], hoje: string): ContaVencida[] {
  return linhas
    .filter((l) => l.data_vencimento && l.data_vencimento < hoje && !FECHADOS.has(l.status ?? '') && l.total - l.quitado > 0.004)
    .map((l) => ({ id: l.id, tipo, descricao: l.descricao || '—', nome: l.nome || '', vencimento: l.data_vencimento!, dias: diasEntre(l.data_vencimento!, hoje), saldo: Math.round((l.total - l.quitado) * 100) / 100 }))
    .sort((a, b) => b.dias - a.dias || b.saldo - a.saldo)
}

const nomeDe = (r: { nome?: string | null; nome_fantasia?: string | null; razao_social?: string | null } | null) => r?.nome_fantasia || r?.nome || r?.razao_social || null

export async function carregarContasVencidas(empresaId: string): Promise<ResumoVencidas> {
  const sb = createClient()
  const hoje = hojeISO()
  const [cp, cr] = await Promise.all([
    comRetentativa(() => sb.from('contas_pagar').select('id, descricao, status, data_vencimento, valor_total, valor_pago, fornecedores(nome, nome_fantasia, razao_social)').eq('empresa_id', empresaId).lt('data_vencimento', hoje).limit(1000)),
    comRetentativa(() => sb.from('contas_receber').select('id, descricao, status, data_vencimento, valor, valor_recebido, clientes(nome, nome_fantasia, razao_social)').eq('empresa_id', empresaId).lt('data_vencimento', hoje).limit(1000)),
  ])
  if (cp.error) reportarFalhaLeitura('contas-vencidas:pagar', new Error(cp.error.message))
  if (cr.error) reportarFalhaLeitura('contas-vencidas:receber', new Error(cr.error.message))
  type Rel = { nome?: string | null; nome_fantasia?: string | null; razao_social?: string | null }
  const um = (r: Rel | Rel[] | null | undefined) => (Array.isArray(r) ? r[0] ?? null : r ?? null)
  const pagar = separarVencidas((cp.data ?? []).map((c) => ({ id: c.id, descricao: c.descricao, status: c.status, data_vencimento: c.data_vencimento, total: Number(c.valor_total) || 0, quitado: Number(c.valor_pago) || 0, nome: nomeDe(um(c.fornecedores as Rel | Rel[] | null)) })), 'pagar', hoje)
  const receber = separarVencidas((cr.data ?? []).map((c) => ({ id: c.id, descricao: c.descricao, status: c.status, data_vencimento: c.data_vencimento, total: Number(c.valor) || 0, quitado: Number(c.valor_recebido) || 0, nome: nomeDe(um(c.clientes as Rel | Rel[] | null)) })), 'receber', hoje)
  const soma = (l: ContaVencida[]) => Math.round(l.reduce((s, c) => s + c.saldo, 0) * 100) / 100
  return { pagar, receber, totalPagar: soma(pagar), totalReceber: soma(receber), falhou: !!(cp.error || cr.error) }
}
