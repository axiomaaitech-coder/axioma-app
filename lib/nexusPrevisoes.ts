// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Etapa 9: memória de previsões do José (previsto × realizado).
// 1x por semana o painel executivo (PT) devolve a direção esperada de 6
// indicadores em 30 e 90 dias; aqui grava (valor de partida vem do banco,
// nunca da IA) e, no cron diário, confere as vencidas com o dado oficial.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'

export type TextoTrilingue = { pt: string; en: string; es: string }
export type Direcao = 'sobe' | 'cai' | 'estavel'
export type StatusPrevisao = 'aberta' | 'acertou' | 'errou' | 'sem_dado'

// "estável" = variação dentro da tolerância de cada série (em % do valor ou
// em pontos absolutos). ponytail: tolerância fixa por série; calibrar pela
// volatilidade histórica se o placar mostrar "estável" demais ou de menos.
export const SERIES_PREVISAO: { codigo: string; nome: TextoTrilingue; tolerancia: { rel?: number; abs?: number }; regra: string }[] = [
  { codigo: '1', nome: { pt: 'Dólar', en: 'US Dollar', es: 'Dólar' }, tolerancia: { rel: 1 }, regra: 'estável = variação de até 1%' },
  { codigo: '21619', nome: { pt: 'Euro', en: 'Euro', es: 'Euro' }, tolerancia: { rel: 1 }, regra: 'estável = variação de até 1%' },
  { codigo: '432', nome: { pt: 'Selic', en: 'Selic rate', es: 'Tasa Selic' }, tolerancia: { abs: 0.01 }, regra: 'estável = Selic não muda' },
  { codigo: '433', nome: { pt: 'IPCA (mensal)', en: 'IPCA (monthly inflation)', es: 'IPCA (inflación mensual)' }, tolerancia: { abs: 0.1 }, regra: 'estável = diferença de até 0,10 p.p. no IPCA do mês' },
  { codigo: '24369', nome: { pt: 'Desemprego', en: 'Unemployment', es: 'Desempleo' }, tolerancia: { abs: 0.2 }, regra: 'estável = diferença de até 0,2 p.p.' },
  { codigo: 'IPEA:BRENT', nome: { pt: 'Petróleo Brent', en: 'Brent crude', es: 'Petróleo Brent' }, tolerancia: { rel: 3 }, regra: 'estável = variação de até 3%' },
]
export const HORIZONTES_PREVISAO = [30, 90] as const

// Depois do prazo, espera até 60 dias por um dado novo (IPCA/desemprego saem
// com atraso); sem dado novo nesse tempo, a previsão fica "sem_dado".
const ESPERA_DADO_DIAS = 60

export function direcaoReal(codigo: string, base: number, real: number): Direcao {
  const tol = SERIES_PREVISAO.find((s) => s.codigo === codigo)?.tolerancia ?? { rel: 1 }
  const limite = tol.abs ?? Math.abs(base) * (tol.rel ?? 1) / 100
  const dif = real - base
  if (Math.abs(dif) <= limite + 1e-9) return 'estavel'
  return dif > 0 ? 'sobe' : 'cai'
}

export function avaliarPrevisao(codigo: string, direcao: Direcao, base: number, real: number): 'acertou' | 'errou' {
  return direcaoReal(codigo, base, real) === direcao ? 'acertou' : 'errou'
}

// Segunda-feira (UTC) da semana de `d` — chave de "1 previsão por semana".
export function segundaDaSemana(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7))
  return x.toISOString().slice(0, 10)
}

const somaDias = (iso: string, dias: number) => {
  const x = new Date(`${iso}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + dias); return x.toISOString().slice(0, 10)
}

// Último ponto de cada série previsível — vai no pedido ao José e vira o valor de partida.
export async function ultimosValoresPrevisao(supabase: SupabaseClient): Promise<Map<string, { valor: number; data: string }>> {
  const res = await Promise.all(SERIES_PREVISAO.map((s) =>
    supabase.from('nexus_economic_series').select('valor, data_referencia').eq('serie_codigo', s.codigo).order('data_referencia', { ascending: false }).limit(1).maybeSingle()))
  const mapa = new Map<string, { valor: number; data: string }>()
  res.forEach((r, i) => { if (r.data?.valor != null) mapa.set(SERIES_PREVISAO[i].codigo, { valor: Number(r.data.valor), data: r.data.data_referencia as string }) })
  return mapa
}

export type PrevisaoIA = { serie_codigo: string; horizonte_dias: number; direcao: Direcao; confianca: number; motivo: TextoTrilingue }

// Grava as previsões da semana (a 1ª do dia/semana vence; as seguintes são ignoradas).
export async function registrarPrevisoes(supabase: SupabaseClient, previsoes: PrevisaoIA[], hoje = new Date()): Promise<number> {
  const base = await ultimosValoresPrevisao(supabase)
  const semana = segundaDaSemana(hoje)
  const dataHoje = hoje.toISOString().slice(0, 10)
  const linhas = previsoes
    .filter((p) => base.has(p.serie_codigo) && (HORIZONTES_PREVISAO as readonly number[]).includes(p.horizonte_dias))
    .map((p) => ({
      semana, serie_codigo: p.serie_codigo, horizonte_dias: p.horizonte_dias, direcao: p.direcao,
      confianca: p.confianca, motivo: { pt: p.motivo.pt.slice(0, 400), en: p.motivo.en.slice(0, 400), es: p.motivo.es.slice(0, 400) },
      valor_base: base.get(p.serie_codigo)!.valor, data_base: base.get(p.serie_codigo)!.data,
      data_alvo: somaDias(dataHoje, p.horizonte_dias),
    }))
  if (!linhas.length) return 0
  const { error } = await supabase.from('nexus_previsao').upsert(linhas, { onConflict: 'semana,serie_codigo,horizonte_dias', ignoreDuplicates: true })
  if (error) throw new Error(`gravação de previsões: ${error.message}`)
  return linhas.length
}

// Cron diário: confere as abertas com prazo vencido.
export async function conferirPrevisoes(supabase: SupabaseClient, hoje = new Date()): Promise<{ conferidas: number; erro?: string }> {
  try {
    const dataHoje = hoje.toISOString().slice(0, 10)
    const { data, error } = await supabase.from('nexus_previsao')
      .select('id, serie_codigo, direcao, valor_base, data_base, data_alvo')
      .eq('status', 'aberta').lte('data_alvo', dataHoje).limit(200)
    if (error) throw new Error(error.message)
    const abertas = data ?? []
    if (!abertas.length) return { conferidas: 0 }
    // Uma consulta só pros pontos de todas as séries envolvidas (sem N+1).
    const codigos = [...new Set(abertas.map((p) => p.serie_codigo as string))]
    const desde = abertas.map((p) => p.data_base as string).sort()[0]
    const { data: pontos, error: erroPontos } = await supabase.from('nexus_economic_series').select('serie_codigo, valor, data_referencia')
      .in('serie_codigo', codigos).gt('data_referencia', desde).lte('data_referencia', dataHoje)
      .order('data_referencia', { ascending: false }).limit(5000)
    if (erroPontos) throw new Error(erroPontos.message)
    let conferidas = 0
    for (const p of abertas) {
      // Dado mais recente com referência até a data-alvo (cron atrasado não
      // "vê o futuro") e mais novo que o de partida.
      const ponto = (pontos ?? []).find((l) => l.serie_codigo === p.serie_codigo && l.valor != null
        && (l.data_referencia as string) > (p.data_base as string) && (l.data_referencia as string) <= (p.data_alvo as string))
      let update: Record<string, unknown> | null = null
      if (ponto?.valor != null) {
        update = { status: avaliarPrevisao(p.serie_codigo, p.direcao as Direcao, Number(p.valor_base), Number(ponto.valor)), valor_real: Number(ponto.valor), data_real: ponto.data_referencia }
      } else if (dataHoje > somaDias(p.data_alvo as string, ESPERA_DADO_DIAS)) {
        update = { status: 'sem_dado' }
      }
      if (!update) continue
      const { error: e } = await supabase.from('nexus_previsao').update({ ...update, conferida_em: new Date().toISOString() }).eq('id', p.id)
      if (!e) conferidas++
    }
    return { conferidas }
  } catch (err) {
    return { conferidas: 0, erro: err instanceof Error ? err.message : String(err) }
  }
}

// Placar resumido por série × prazo, em texto pro José (painel e chat) calibrar
// a própria confiança. Só conta as já conferidas (acertou/errou).
export function resumirPlacar(linhas: { serie_codigo: string; horizonte_dias: number; status: string }[]): string {
  const grupos = new Map<string, { a: number; t: number }>()
  for (const l of linhas) {
    if (l.status !== 'acertou' && l.status !== 'errou') continue
    const k = `${l.serie_codigo}|${l.horizonte_dias}`
    const g = grupos.get(k) ?? { a: 0, t: 0 }
    g.t++; if (l.status === 'acertou') g.a++
    grupos.set(k, g)
  }
  if (!grupos.size) return '- nenhuma previsão conferida ainda (placar começa quando vencer o 1º prazo de 30 dias)'
  const total = [...grupos.values()].reduce((s, g) => ({ a: s.a + g.a, t: s.t + g.t }), { a: 0, t: 0 })
  const porSerie = [...grupos.entries()].map(([k, g]) => {
    const [codigo, h] = k.split('|')
    const nome = SERIES_PREVISAO.find((x) => x.codigo === codigo)?.nome.pt ?? codigo
    return `- ${nome}, ${h} dias: ${g.a} de ${g.t} (${Math.round((g.a / g.t) * 100)}%)`
  })
  return `- Geral: ${total.a} de ${total.t} (${Math.round((total.a / total.t) * 100)}%)\n${porSerie.join('\n')}`
}

// ponytail: agrega no app (tabela pequena, ~12 linhas/semana); virar RPC com
// GROUP BY se passar de alguns milhares de previsões conferidas.
export async function textoPlacar(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.from('nexus_previsao').select('serie_codigo, horizonte_dias, status').in('status', ['acertou', 'errou']).limit(5000)
  if (error) return '- placar indisponível'
  return resumirPlacar(data ?? [])
}
