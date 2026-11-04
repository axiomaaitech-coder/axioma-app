// Resumo rápido de contas vencidas (só totais) para o cartão que liga os módulos a Contas Vencidas.
// Leve de propósito (2 leituras, poucas colunas) — mesma regra do motor de vencidos, nada recalculado à parte.
import { createClient } from '../supabase/client'
import { lerTodas } from '../lerTodas'
import { hojeISO } from '../datas'
import { estaVencido, saldoDoTitulo, type Titulo } from './motor'

export type ResumoRapido = { receber: { total: number; qtd: number }; pagar: { total: number; qtd: number }; falhou: boolean }

export async function resumoRapidoVencidos(empresaId: string): Promise<ResumoRapido> {
  const sb = createClient(), hoje = hojeISO()
  const [cr, cp] = await Promise.all([
    lerTodas(() => sb.from('contas_receber').select('id, status, valor, valor_recebido, valor_desconto, data_vencimento').eq('empresa_id', empresaId).lt('data_vencimento', hoje).order('id')),
    lerTodas(() => sb.from('contas_pagar').select('id, status, valor_total, valor_pago, data_vencimento').eq('empresa_id', empresaId).lt('data_vencimento', hoje).order('id')),
  ])
  const somar = (l: Titulo[]) => { const v = l.filter((t) => estaVencido(t, hoje)); return { total: Math.round(v.reduce((s, t) => s + saldoDoTitulo(t, hoje), 0) * 100) / 100, qtd: v.length } }
  return {
    receber: somar((cr.data ?? []).map((c) => ({ id: c.id, empresaId, dominio: 'receber', contraparteId: null, contraparteNome: '', valor: Number(c.valor) || 0, quitado: Number(c.valor_recebido) || 0, desconto: Number(c.valor_desconto) || 0, vencimento: c.data_vencimento, status: c.status }))),
    pagar: somar((cp.data ?? []).map((c) => ({ id: c.id, empresaId, dominio: 'pagar', contraparteId: null, contraparteNome: '', valor: Number(c.valor_total) || 0, quitado: Number(c.valor_pago) || 0, vencimento: c.data_vencimento, status: c.status }))),
    falhou: !!(cr.error || cp.error),
  }
}
