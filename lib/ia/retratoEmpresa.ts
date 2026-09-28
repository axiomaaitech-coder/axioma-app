// ═══════════════════════════════════════════════════════════════
// MOTOR DE IA — Nível 0: RETRATO DA EMPRESA (sem IA).
// Junta os números de todos os módulos numa foto só, calculados pelo
// Axioma com as fórmulas do alicerce (montarDRE, calcularImpostoRegime) —
// a IA só interpreta, nunca calcula. Usado por todo o motor (IA Financeira,
// IA Tributária, José, demais módulos): um lugar só, sem duplicar consulta.
//
// Só servidor, com o cliente DO USUÁRIO (sessão + RLS por empresa): pedir o
// retrato de empresa alheia simplesmente não acha a empresa.
// ponytail: agrega no servidor com teto de 5000 linhas por tabela; mover as
// somas pra RPC no banco quando algum cliente passar desse volume.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { montarDRE } from '../cfoCore'
import { calcularImpostoRegime, simularRegimes } from '../iaTributariaHelpers'
import { setorDaEmpresa, type Setor } from './setores'
import { nomeSerie } from '../nexusEventDetector'

export type NumerosRetrato = {
  receitaMensal: number
  receitas6m: number[] // 6 últimos meses FECHADOS, mais antigo → mais recente (mês corrente fica fora: está pela metade)
  custoFixoMensal: number
  custoVariavelMensal: number
  aliquotaEfetivaPct: number
  impostoMensal: number
  jurosMensal: number
  lucroMensal: number
  margemPct: number | null
  custoFixoSobreReceitaPct: number | null
  pontoEquilibrioMensal: number | null
  caixa: number
  folegoMeses: number | null // só quando dá prejuízo
  dividaTotal: number
  dividaSobreReceitaAnualPct: number | null
  aReceberAberto: number
  aReceberVencido: number
  aReceber30d: number
  inadimplenciaPct: number | null
  aPagarAberto: number
  aPagarVencido: number
  aPagar30d: number
  concentracaoTopClientePct: number | null
  estoqueRuptura: number
  estoqueBaixo: number
  estoqueParado: number
  obrigacoesAtrasadas: number
}

export type Retrato = {
  empresaId: string
  nome: string
  regime: string | null
  porte: string | null
  cnae: string | null
  setor: Setor | null
  numeros: NumerosRetrato
  alertas: string[] // situação da empresa em frases curtas (pt), já priorizadas
  temDados: boolean
  texto: string // versão compacta pro prompt
}

const LIMITE = 5000
type Linha = Record<string, unknown>
const n = (v: unknown) => Number(v || 0)
const soma = (ls: Linha[], c: string) => ls.reduce((t, l) => t + n(l[c]), 0)
export const fBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0)
const pct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

// Maiores itens por nome (custos/receitas), pra IA citar PELO NOME.
function maiores(ls: Linha[], campo: string, divisor: number, qtd = 8): string {
  const m = new Map<string, number>()
  for (const l of ls) { const k = String(l.descricao || l.categoria || 'sem descrição'); m.set(k, (m.get(k) || 0) + n(l[campo]) / divisor) }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, qtd).map(([k, v]) => `${k} ${fBRL(v)}`).join('; ')
}

export async function montarRetrato(supabase: SupabaseClient, empresaId: string): Promise<Retrato> {
  const hoje = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const hojeIso = iso(hoje)
  const em30 = iso(new Date(hoje.getTime() + 30 * 86400000))
  const inicio12 = iso(new Date(hoje.getFullYear(), hoje.getMonth() - 12, hoje.getDate()))
  const [emp, rec, cf, cv, dv, fc, cr, cp, est, obr] = await Promise.all([
    supabase.from('empresas').select('nome_fantasia, razao_social, regime_tributario, porte, setor, cnae_principal, cnae_descricao').eq('id', empresaId).maybeSingle(),
    supabase.from('receitas').select('descricao, categoria, valor, data').eq('empresa_id', empresaId).gte('data', inicio12).limit(LIMITE),
    supabase.from('custos_fixos').select('descricao, categoria, valor_mensal').eq('empresa_id', empresaId).limit(LIMITE),
    supabase.from('custos_variaveis').select('descricao, categoria, valor, data').eq('empresa_id', empresaId).gte('data', inicio12).limit(LIMITE),
    supabase.from('dividas').select('descricao, valor_total, valor_pago, taxa_juros').eq('empresa_id', empresaId).limit(LIMITE),
    supabase.from('fluxo_caixa').select('tipo, valor, status').eq('empresa_id', empresaId).eq('status', 'realizado').limit(LIMITE),
    supabase.from('contas_receber').select('cliente_id, valor, valor_recebido, data_vencimento').eq('empresa_id', empresaId).limit(LIMITE),
    supabase.from('contas_pagar').select('valor_total, valor_pago, data_vencimento').eq('empresa_id', empresaId).limit(LIMITE),
    supabase.from('vw_estoque_avisos').select('ruptura, baixo_estoque, capital_parado').eq('empresa_id', empresaId).limit(LIMITE),
    supabase.from('empresa_obrigacoes').select('status, data_vencimento').eq('empresa_id', empresaId).limit(LIMITE),
  ])
  if (!emp.data) throw new Error('empresa não encontrada ou sem acesso')
  const e = emp.data as Linha
  const L = (r: { data: unknown }) => (r.data ?? []) as Linha[] // tabela ausente/erro = módulo sem dado, nunca derruba o retrato

  // Receita: média 12m + série dos 6 últimos meses fechados
  const receitas = L(rec)
  const receita12 = soma(receitas, 'valor')
  const receitaMensal = receita12 / 12
  const receitas6m = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 6 + i, 1)
    const chave = iso(d).slice(0, 7)
    return Math.round(receitas.filter((r) => String(r.data).startsWith(chave)).reduce((t, r) => t + n(r.valor), 0))
  })
  const custoFixoMensal = soma(L(cf), 'valor_mensal')
  const custoVariavelMensal = soma(L(cv), 'valor') / 12
  const regime = (e.regime_tributario as string | null) || null
  const impostoMensal = receitaMensal > 0 ? calcularImpostoRegime(regime || '', receita12, receitaMensal) : 0
  const aliquotaEfetivaPct = receitaMensal > 0 ? (impostoMensal / receitaMensal) * 100 : 0

  const dividas = L(dv)
  const saldoDiv = (d: Linha) => Math.max(0, n(d.valor_total) - n(d.valor_pago))
  const dividaTotal = dividas.reduce((t, d) => t + saldoDiv(d), 0)
  const jurosMensal = dividas.reduce((t, d) => t + saldoDiv(d) * (n(d.taxa_juros) / 100), 0)
  const dre = montarDRE({ receitaBruta: receitaMensal, deducoes: impostoMensal, custoVariavel: custoVariavelMensal, custoFixo: custoFixoMensal, despesasFinanceiras: jurosMensal })
  const lucroMensal = dre.lucroLiquido.valor
  const caixa = L(fc).reduce((t, l) => t + (l.tipo === 'entrada' ? n(l.valor) : -n(l.valor)), 0)

  // Contas a receber/pagar: saldo em aberto = valor − já pago (não depende do texto do status)
  type Aberto = Linha & { saldo: number }
  const abertoR: Aberto[] = L(cr).map((c) => ({ ...c, saldo: Math.max(0, n(c.valor) - n(c.valor_recebido)) })).filter((c) => c.saldo > 0)
  const abertoP: Aberto[] = L(cp).map((c) => ({ ...c, saldo: Math.max(0, n(c.valor_total) - n(c.valor_pago)) })).filter((c) => c.saldo > 0)
  const somaSaldo = (ls: { saldo: number }[]) => ls.reduce((t, c) => t + c.saldo, 0)
  const venc = <T extends Linha>(ls: T[]) => ls.filter((c) => c.data_vencimento && String(c.data_vencimento) < hojeIso)
  const prox30 = <T extends Linha>(ls: T[]) => ls.filter((c) => c.data_vencimento && String(c.data_vencimento) >= hojeIso && String(c.data_vencimento) <= em30)
  const aReceberAberto = somaSaldo(abertoR), aReceberVencido = somaSaldo(venc(abertoR))
  const porCliente = new Map<string, number>()
  for (const c of abertoR) if (c.cliente_id) porCliente.set(String(c.cliente_id), (porCliente.get(String(c.cliente_id)) || 0) + c.saldo)
  const topCliente = Math.max(0, ...porCliente.values())

  const estoque = L(est)
  const obrigacoes = L(obr)
  const margemBrutaContrib = receitaMensal > 0 ? (receitaMensal - custoVariavelMensal - impostoMensal) / receitaMensal : 0
  const numeros: NumerosRetrato = {
    receitaMensal, receitas6m, custoFixoMensal, custoVariavelMensal, aliquotaEfetivaPct, impostoMensal, jurosMensal, lucroMensal,
    margemPct: receitaMensal > 0 ? (lucroMensal / receitaMensal) * 100 : null,
    custoFixoSobreReceitaPct: receitaMensal > 0 ? (custoFixoMensal / receitaMensal) * 100 : null,
    pontoEquilibrioMensal: margemBrutaContrib > 0 ? (custoFixoMensal + jurosMensal) / margemBrutaContrib : null,
    caixa, folegoMeses: lucroMensal < 0 && caixa > 0 ? Math.floor(caixa / Math.abs(lucroMensal)) : null,
    dividaTotal, dividaSobreReceitaAnualPct: receita12 > 0 ? (dividaTotal / receita12) * 100 : null,
    aReceberAberto, aReceberVencido, aReceber30d: somaSaldo(prox30(abertoR)),
    inadimplenciaPct: aReceberAberto > 0 ? (aReceberVencido / aReceberAberto) * 100 : null,
    aPagarAberto: somaSaldo(abertoP), aPagarVencido: somaSaldo(venc(abertoP)), aPagar30d: somaSaldo(prox30(abertoP)),
    concentracaoTopClientePct: aReceberAberto > 0 && topCliente > 0 ? (topCliente / aReceberAberto) * 100 : null,
    estoqueRuptura: estoque.filter((x) => x.ruptura).length, estoqueBaixo: estoque.filter((x) => x.baixo_estoque).length, estoqueParado: estoque.filter((x) => x.capital_parado).length,
    obrigacoesAtrasadas: obrigacoes.filter((o) => o.status === 'atrasada' || (o.status === 'pendente' && o.data_vencimento && String(o.data_vencimento) < hojeIso)).length,
  }
  const setor = setorDaEmpresa(e.cnae_principal as string | null, e.setor as string | null)
  const alertas = detectarAlertas(numeros)
  const temDados = receitaMensal > 0 || custoFixoMensal > 0 || custoVariavelMensal > 0
  const nome = String(e.nome_fantasia || e.razao_social || 'sem nome')
  const cnae = e.cnae_principal ? `${e.cnae_principal}${e.cnae_descricao ? ` - ${e.cnae_descricao}` : ''}` : null

  const x = numeros
  const texto = `EMPRESA: ${nome} · regime ${regime ?? 'não informado'}${e.porte ? ` · porte ${e.porte}` : ''} · CNAE ${cnae ?? 'não cadastrado'}
SETOR: ${setor ? setor.nome.pt : 'não identificado (sem CNAE) — trate como empresa típica e sugira cadastrar o CNAE'}
NÚMEROS (calculados pelo Axioma — use-os, não recalcule; médias mensais dos últimos 12 meses):
- Receita ${fBRL(x.receitaMensal)}/mês; últimos 6 meses fechados: ${x.receitas6m.map(fBRL).join(' → ')}
- Custo fixo ${fBRL(x.custoFixoMensal)}/mês (${pct(x.custoFixoSobreReceitaPct)} da receita) · custo variável ${fBRL(x.custoVariavelMensal)}/mês
- Impostos ${fBRL(x.impostoMensal)}/mês (alíquota efetiva ${x.aliquotaEfetivaPct.toFixed(1)}%) · juros de dívidas ${fBRL(x.jurosMensal)}/mês
- Lucro ${fBRL(x.lucroMensal)}/mês (margem ${pct(x.margemPct)}) · ponto de equilíbrio ${x.pontoEquilibrioMensal != null ? `${fBRL(x.pontoEquilibrioMensal)}/mês` : 'não calculável (margem de contribuição ≤ 0)'}
- Caixa realizado ${fBRL(x.caixa)}${x.folegoMeses != null ? ` · fôlego ${x.folegoMeses} meses mantido o prejuízo` : ''}
- Dívida ${fBRL(x.dividaTotal)} (${pct(x.dividaSobreReceitaAnualPct)} da receita anual)
- A receber ${fBRL(x.aReceberAberto)} (vencido ${fBRL(x.aReceberVencido)}, inadimplência ${pct(x.inadimplenciaPct)}; próximos 30 dias ${fBRL(x.aReceber30d)})${x.concentracaoTopClientePct != null ? ` · maior cliente = ${pct(x.concentracaoTopClientePct)} do a receber` : ''}
- A pagar ${fBRL(x.aPagarAberto)} (vencido ${fBRL(x.aPagarVencido)}; próximos 30 dias ${fBRL(x.aPagar30d)})
- Estoque: ${x.estoqueRuptura} em ruptura, ${x.estoqueBaixo} baixos, ${x.estoqueParado} com capital parado · obrigações fiscais atrasadas: ${x.obrigacoesAtrasadas}
MAIORES CUSTOS FIXOS: ${maiores(L(cf), 'valor_mensal', 1) || 'nenhum cadastrado'}
MAIORES CUSTOS VARIÁVEIS (média/mês): ${maiores(L(cv), 'valor', 12) || 'nenhum'}
MAIORES FONTES DE RECEITA (média/mês): ${maiores(receitas, 'valor', 12) || 'nenhuma'}
DÍVIDAS: ${dividas.map((d) => `${d.descricao || 'dívida'} saldo ${fBRL(saldoDiv(d))} juros ${d.taxa_juros ?? '?'}%`).join('; ') || 'nenhuma'}
ALERTAS DA SITUAÇÃO: ${alertas.join(' | ') || 'nenhum'}`

  return { empresaId, nome, regime, porte: (e.porte as string | null) ?? null, cnae, setor, numeros, alertas, temDados, texto }
}

// Situação da empresa em frases (ordem = prioridade). Regras fixas e explicáveis.
export function detectarAlertas(x: NumerosRetrato): string[] {
  const a: string[] = []
  if (x.receitaMensal <= 0 && x.custoFixoMensal + x.custoVariavelMensal <= 0) return ['sem receitas e custos cadastrados — números insuficientes']
  if (x.caixa < 0) a.push('caixa realizado negativo')
  if (x.folegoMeses != null && x.folegoMeses <= 6) a.push(`caixa aguenta só ${x.folegoMeses} meses no ritmo atual`)
  if (x.lucroMensal < 0) a.push('empresa dando prejuízo')
  else if (x.margemPct != null && x.margemPct < 5) a.push('margem líquida abaixo de 5%')
  if (x.aPagarVencido > 0) a.push(`contas a pagar vencidas (${fBRL(x.aPagarVencido)})`)
  if (x.aPagar30d > x.caixa + x.aReceber30d) a.push('a pagar nos próximos 30 dias maior que caixa + a receber no período')
  if (x.inadimplenciaPct != null && x.inadimplenciaPct >= 10) a.push(`inadimplência alta (${x.inadimplenciaPct.toFixed(0)}% do a receber vencido)`)
  if (x.concentracaoTopClientePct != null && x.concentracaoTopClientePct >= 30) a.push(`um cliente concentra ${x.concentracaoTopClientePct.toFixed(0)}% do a receber`)
  if (x.dividaSobreReceitaAnualPct != null && x.dividaSobreReceitaAnualPct >= 50) a.push('dívida acima de 50% da receita anual')
  if (x.lucroMensal > 0 && x.jurosMensal > x.lucroMensal * 0.5) a.push('juros consomem mais da metade do lucro')
  if (x.custoFixoSobreReceitaPct != null && x.custoFixoSobreReceitaPct >= 40) a.push('custo fixo acima de 40% da receita')
  const [r1, , , , , r6] = x.receitas6m
  if (r1 > 0 && r6 < r1 * 0.8) a.push('receita do último mês fechado 20%+ abaixo de 6 meses atrás')
  if (x.estoqueRuptura > 0) a.push(`${x.estoqueRuptura} produtos em ruptura`)
  if (x.estoqueParado > 0) a.push(`${x.estoqueParado} produtos com capital parado`)
  if (x.obrigacoesAtrasadas > 0) a.push(`${x.obrigacoesAtrasadas} obrigações fiscais atrasadas`)
  return a
}

// Manual do setor pro prompt: o que pesa naquele negócio + indicadores do Nexus que mexem com ele.
export function textoSetor(setor: Setor | null): string {
  if (!setor) return 'MANUAL DO SETOR: CNAE não cadastrado — responda para uma empresa típica e cite nas limitações que cadastrar o CNAE na tela Empresa deixa a análise mais precisa.'
  return `MANUAL DO SETOR (${setor.nome.pt}): ${setor.foco}
INDICADORES QUE MAIS PESAM NESTE SETOR: ${setor.series.map((c) => nomeSerie(c, 'pt')).join(', ')}.`
}

// Comparação de regimes (mesma simulação da tela IA Tributária) — entra no prompt
// quando o manual tributário é escolhido. Estimativa pelas regras vigentes hoje.
export function textoFiscal(r: Retrato): string {
  const x = r.numeros
  if (x.receitaMensal <= 0) return 'COMPARAÇÃO DE REGIMES: sem receita cadastrada — não dá para comparar.'
  const sims = simularRegimes({
    receita_bruta_12m: x.receitaMensal * 12, receita_bruta_mensal: x.receitaMensal,
    custos_fixos_mensal: x.custoFixoMensal, custos_variaveis_mensal: x.custoVariavelMensal,
    folha_pagamento_mensal: x.custoFixoMensal * 0.4, // mesma estimativa da tela IA Tributária
    lucro_bruto_mensal: x.receitaMensal - x.custoVariavelMensal,
    regime_atual: r.regime ?? '', setor: r.setor?.id ?? '', cnae: r.cnae ?? '',
    obrigacoes_pendentes: 0, obrigacoes_vencidas: x.obrigacoesAtrasadas, total_obrigacoes: 0,
  })
  const linhas = sims.map((s) => `${s.regime_label}: ${fBRL(s.imposto_mensal)}/mês (${s.aliquota_efetiva.toFixed(1)}%)${s.elegivel ? '' : ` — não elegível: ${s.motivo_inelegivel ?? ''}`}${s.elegivel && s.economia_vs_atual > 0 ? ` — economia estimada de ${fBRL(s.economia_vs_atual)}/ano vs atual` : ''}`)
  return `COMPARAÇÃO DE REGIMES (estimativa pelas regras vigentes em ${new Date().toISOString().slice(0, 10)}; Reforma Tributária em transição 2026-2033, pode mudar; folha estimada em 40% do custo fixo):\n- ${linhas.join('\n- ')}`
}
