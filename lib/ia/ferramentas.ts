// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Fase 3: FERRAMENTAS DE CONSULTA (tool use da Anthropic).
// A IA pede o detalhe que precisa (quais contas vencem, quem mais deve,
// que produto está em falta) em vez de receber tudo de uma vez no prompt.
// Regras: só LEITURA, só da empresa do retrato, com o cliente do usuário
// (RLS). Nomes e esquemas estáveis — são a futura interface de um servidor
// MCP do Axioma (mesmas ferramentas, outro transporte).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { hojeISO } from '../datas'

type Esquema = { type: 'object'; additionalProperties: false; properties: Record<string, unknown>; required: string[] }
export type Ferramenta = { name: string; description: string; input_schema: Esquema; strict: true }

const limite = { type: 'integer', description: 'Quantos itens devolver (1 a 30).' }
const obj = (properties: Record<string, unknown>): Esquema => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })

export const FERRAMENTAS: Ferramenta[] = [
  { name: 'contas_a_pagar', strict: true, description: 'Contas a pagar em aberto (saldo = valor − já pago), com fornecedor, categoria e vencimento, maiores primeiro. Use para o que vence, o que está atrasado ou a quem a empresa deve.',
    input_schema: obj({ situacao: { type: 'string', enum: ['vencidas', 'proximos_30_dias', 'todas_abertas'] }, limite }) },
  { name: 'contas_a_receber', strict: true, description: 'Contas a receber em aberto (saldo = valor − já recebido), com cliente e vencimento, maiores primeiro. Use para inadimplência, quem deve e o que entra em breve.',
    input_schema: obj({ situacao: { type: 'string', enum: ['vencidas', 'proximos_30_dias', 'todas_abertas'] }, limite }) },
  { name: 'custos', strict: true, description: 'Custos fixos (valor mensal cadastrado) ou variáveis (média mensal dos últimos 12 meses), agrupados por descrição, maiores primeiro.',
    input_schema: obj({ tipo: { type: 'string', enum: ['fixos', 'variaveis'] }, limite }) },
  { name: 'receitas_por_mes', strict: true, description: 'Receita total por mês (mês corrente incluso, parcial), do mais antigo ao mais recente.',
    input_schema: obj({ meses: { type: 'integer', description: 'Quantos meses (1 a 24).' } }) },
  { name: 'estoque_avisos', strict: true, description: 'Produtos ativos com aviso de estoque: ruptura (saldo ≤ 0), baixo_estoque, capital_parado (acima do máximo) ou custo_subindo.',
    input_schema: obj({ tipo: { type: 'string', enum: ['ruptura', 'baixo_estoque', 'capital_parado', 'custo_subindo'] }, limite }) },
  { name: 'dividas', strict: true, description: 'Dívidas e financiamentos com saldo devedor, juros ao mês, parcelas e vencimento, maior juro primeiro (ordem de quitação avalanche).',
    input_schema: obj({ limite }) },
  { name: 'maiores_fornecedores', strict: true, description: 'Fornecedores com mais valor em contas a pagar (total lançado e saldo em aberto), maiores primeiro.',
    input_schema: obj({ limite }) },
  { name: 'maiores_devedores', strict: true, description: 'Clientes com mais saldo em aberto a receber (e quanto disso está vencido), maiores primeiro.',
    input_schema: obj({ limite }) },
]

type Linha = Record<string, unknown>
const n = (v: unknown) => Number(v || 0)
const r2 = (v: number) => Math.round(v * 100) / 100
// "Hoje" no fuso da empresa da consulta (parâmetro, nunca variável global: no servidor
// várias empresas consultam ao mesmo tempo).
const hojeIso = (fuso: string) => hojeISO(new Date(), fuso)
const em30 = (fuso: string) => hojeISO(new Date(Date.now() + 30 * 86400000), fuso)
const lim = (v: unknown) => Math.min(30, Math.max(1, Math.floor(n(v)) || 10))

async function nomes(supabase: SupabaseClient, tabela: 'clientes' | 'fornecedores', ids: unknown[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.filter(Boolean).map(String))]
  if (!unicos.length) return new Map()
  const { data } = await supabase.from(tabela).select('id, nome').in('id', unicos)
  return new Map(((data ?? []) as Linha[]).map((l) => [String(l.id), String(l.nome ?? '')]))
}
function filtrarSituacao<T extends Linha>(ls: T[], situacao: unknown, fuso: string): T[] {
  const h = hojeIso(fuso), f = em30(fuso)
  if (situacao === 'vencidas') return ls.filter((c) => c.data_vencimento && String(c.data_vencimento) < h)
  if (situacao === 'proximos_30_dias') return ls.filter((c) => c.data_vencimento && String(c.data_vencimento) >= h && String(c.data_vencimento) <= f)
  return ls
}

// Executa uma ferramenta e devolve JSON compacto (texto) — nunca lança: erro vira {"erro": ...}.
export async function executarFerramenta(supabase: SupabaseClient, empresaId: string, nome: string, input: Linha, fuso = 'America/Sao_Paulo'): Promise<string> {
  try {
    const q = (t: string, cols: string) => supabase.from(t).select(cols).eq('empresa_id', empresaId).limit(5000)
    switch (nome) {
      case 'contas_a_pagar': {
        const { data } = await q('contas_pagar', 'descricao, categoria, fornecedor_id, valor_total, valor_pago, data_vencimento')
        const abertas = ((data ?? []) as unknown as Linha[]).map((c): Linha & { saldo: number } => ({ ...c, saldo: r2(Math.max(0, n(c.valor_total) - n(c.valor_pago))) })).filter((c) => c.saldo > 0)
        const sel = filtrarSituacao(abertas, input.situacao, fuso).sort((a, b) => b.saldo - a.saldo).slice(0, lim(input.limite))
        const forn = await nomes(supabase, 'fornecedores', sel.map((c) => c.fornecedor_id))
        return JSON.stringify({ total_saldo: r2(sel.reduce((t, c) => t + c.saldo, 0)), itens: sel.map((c) => ({ descricao: c.descricao, fornecedor: forn.get(String(c.fornecedor_id)) ?? null, categoria: c.categoria ?? null, saldo: c.saldo, vencimento: c.data_vencimento ?? null })) })
      }
      case 'contas_a_receber': {
        const { data } = await q('contas_receber', 'cliente_id, valor, valor_recebido, data_vencimento')
        const abertas = ((data ?? []) as unknown as Linha[]).map((c): Linha & { saldo: number } => ({ ...c, saldo: r2(Math.max(0, n(c.valor) - n(c.valor_recebido))) })).filter((c) => c.saldo > 0)
        const sel = filtrarSituacao(abertas, input.situacao, fuso).sort((a, b) => b.saldo - a.saldo).slice(0, lim(input.limite))
        const cli = await nomes(supabase, 'clientes', sel.map((c) => c.cliente_id))
        return JSON.stringify({ total_saldo: r2(sel.reduce((t, c) => t + c.saldo, 0)), itens: sel.map((c) => ({ cliente: cli.get(String(c.cliente_id)) ?? null, saldo: c.saldo, vencimento: c.data_vencimento ?? null })) })
      }
      case 'custos': {
        const fixos = input.tipo === 'fixos'
        const inicio = new Date(new Date().getFullYear(), new Date().getMonth() - 12, new Date().getDate()).toISOString().slice(0, 10)
        const base = fixos ? q('custos_fixos', 'descricao, categoria, valor_mensal') : q('custos_variaveis', 'descricao, categoria, valor').gte('data', inicio)
        const { data } = await base
        const m = new Map<string, { categoria: unknown; valor: number }>()
        for (const l of (data ?? []) as unknown as Linha[]) {
          const k = String(l.descricao || l.categoria || 'sem descrição')
          const atual = m.get(k) ?? { categoria: l.categoria ?? null, valor: 0 }
          atual.valor += fixos ? n(l.valor_mensal) : n(l.valor) / 12
          m.set(k, atual)
        }
        const itens = [...m.entries()].sort((a, b) => b[1].valor - a[1].valor).slice(0, lim(input.limite))
        return JSON.stringify({ tipo: fixos ? 'fixos (valor mensal)' : 'variaveis (media mensal 12m)', itens: itens.map(([descricao, v]) => ({ descricao, categoria: v.categoria, valor_mensal: r2(v.valor) })) })
      }
      case 'receitas_por_mes': {
        const meses = Math.min(24, Math.max(1, Math.floor(n(input.meses)) || 6))
        const hoje = new Date()
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1, 1).toISOString().slice(0, 10)
        const { data } = await q('receitas', 'valor, data').gte('data', inicio)
        const soma = new Map<string, number>()
        for (let i = 0; i < meses; i++) soma.set(new Date(hoje.getFullYear(), hoje.getMonth() - meses + 1 + i, 1).toISOString().slice(0, 7), 0)
        for (const l of (data ?? []) as unknown as Linha[]) { const k = String(l.data).slice(0, 7); if (soma.has(k)) soma.set(k, soma.get(k)! + n(l.valor)) }
        return JSON.stringify({ meses: [...soma.entries()].map(([mes, total]) => ({ mes, total: r2(total) })), obs: 'o último mês é o corrente (parcial)' })
      }
      case 'estoque_avisos': {
        const col = ['ruptura', 'baixo_estoque', 'capital_parado', 'custo_subindo'].includes(String(input.tipo)) ? String(input.tipo) : 'ruptura'
        const { data } = await supabase.from('vw_estoque_avisos').select('nome, categoria, saldo_disponivel, estoque_minimo, estoque_maximo, preco_custo, preco_medio_anterior').eq('empresa_id', empresaId).eq(col, true).limit(lim(input.limite))
        return JSON.stringify({ tipo: col, itens: data ?? [] })
      }
      case 'dividas': {
        const { data } = await q('dividas', 'descricao, tipo, valor_total, valor_pago, parcelas, vencimento, taxa_juros')
        const itens = ((data ?? []) as unknown as Linha[]).map((d) => ({ descricao: d.descricao, tipo: d.tipo ?? null, saldo: r2(Math.max(0, n(d.valor_total) - n(d.valor_pago))), juros_mes_pct: d.taxa_juros ?? null, parcelas: d.parcelas ?? null, vencimento: d.vencimento ?? null }))
          .filter((d) => d.saldo > 0).sort((a, b) => n(b.juros_mes_pct) - n(a.juros_mes_pct)).slice(0, lim(input.limite))
        return JSON.stringify({ itens })
      }
      case 'maiores_fornecedores': {
        const { data } = await q('contas_pagar', 'fornecedor_id, valor_total, valor_pago')
        const m = new Map<string, { total: number; saldo: number }>()
        for (const c of (data ?? []) as unknown as Linha[]) {
          if (!c.fornecedor_id) continue
          const k = String(c.fornecedor_id), a = m.get(k) ?? { total: 0, saldo: 0 }
          a.total += n(c.valor_total); a.saldo += Math.max(0, n(c.valor_total) - n(c.valor_pago)); m.set(k, a)
        }
        const top = [...m.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, lim(input.limite))
        const forn = await nomes(supabase, 'fornecedores', top.map(([id]) => id))
        return JSON.stringify({ itens: top.map(([id, v]) => ({ fornecedor: forn.get(id) ?? null, total_lancado: r2(v.total), saldo_aberto: r2(v.saldo) })) })
      }
      case 'maiores_devedores': {
        const { data } = await q('contas_receber', 'cliente_id, valor, valor_recebido, data_vencimento')
        const h = hojeIso(fuso), m = new Map<string, { saldo: number; vencido: number }>()
        for (const c of (data ?? []) as unknown as Linha[]) {
          const saldo = Math.max(0, n(c.valor) - n(c.valor_recebido))
          if (!c.cliente_id || saldo <= 0) continue
          const k = String(c.cliente_id), a = m.get(k) ?? { saldo: 0, vencido: 0 }
          a.saldo += saldo; if (c.data_vencimento && String(c.data_vencimento) < h) a.vencido += saldo; m.set(k, a)
        }
        const top = [...m.entries()].sort((a, b) => b[1].saldo - a[1].saldo).slice(0, lim(input.limite))
        const cli = await nomes(supabase, 'clientes', top.map(([id]) => id))
        return JSON.stringify({ itens: top.map(([id, v]) => ({ cliente: cli.get(id) ?? null, saldo_aberto: r2(v.saldo), vencido: r2(v.vencido) })) })
      }
      default: return JSON.stringify({ erro: `ferramenta desconhecida: ${nome}` })
    }
  } catch (err) {
    return JSON.stringify({ erro: err instanceof Error ? err.message : String(err) })
  }
}
