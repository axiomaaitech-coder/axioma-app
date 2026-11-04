// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — leitura do mundo (só DADO, nenhuma IA aqui).
// Indicadores oficiais, eventos, manchetes, Banco Mundial e geopolítica num texto só,
// usado pelo cérebro das IAs (lib/ia/motor.ts), pelo painel do José e pelo plano da
// empresa. Fica separada de propósito: quem chama a IA depende desta leitura, e esta
// leitura nunca depende de quem chama a IA — assim não existe volta entre os arquivos
// (verificado em todo build por scripts/check-ciclos.mjs).
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { CANAL_GEOPOLITICA } from './nexusFontesMundo'
import { lerTodas } from './lerTodas'

export async function montarContextoMundo(supabase: SupabaseClient): Promise<string> {
  const desde30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  const desde3 = new Date(Date.now() - 3 * 86400000).toISOString()

  const lidas = await Promise.all([
    lerTodas(() => supabase.from('nexus_economic_series').select('serie_codigo, serie_nome, valor, data_referencia').gte('data_referencia', new Date(Date.now() - 140 * 86400000).toISOString().slice(0, 10)).order('data_referencia', { ascending: true }).order('id')),
    supabase.from('nexus_global_event').select('title, description, natureza, published_at, joseph_analise').gte('published_at', desde30).order('published_at', { ascending: false }).limit(15),
    supabase.from('nexus_news').select('title, publication_date, canal, canonical_url, nexus_source(source_name)').gte('publication_date', desde3).or(`canal.is.null,canal.neq.${CANAL_GEOPOLITICA}`).order('publication_date', { ascending: false }).limit(14),
    // GDELT separado: senão as manchetes de geopolítica (muitas) tomam o lugar das brasileiras.
    // Banco Mundial é anual (referência 31/12) — fica fora da janela de 140 dias acima.
    supabase.from('nexus_economic_series').select('serie_codigo, serie_nome, valor, data_referencia').like('serie_codigo', 'WB:%').order('data_referencia', { ascending: false }).limit(200),
    supabase.from('nexus_news').select('title, publication_date, canonical_url, nexus_source(source_name)').eq('canal', CANAL_GEOPOLITICA).gte('publication_date', desde3).order('publication_date', { ascending: false }).limit(10),
  ])
  // Sem indicadores ou manchetes por FALHA de leitura o José escreveria o painel do dia sem base (e ele fica
  // gravado para todos): para aqui — quem chama devolve o último painel bom. Eventos/Banco Mundial/GDELT são
  // complemento: a falha fica registrada e o painel segue sem eles.
  const [{ data: series, error: eSeries }, { data: eventos, error: eEventos }, { data: noticias, error: eNoticias }, { data: bm, error: eBm }, { data: geo, error: eGeo }] = lidas
  if (eSeries || eNoticias) throw new FalhaBriefing(`leitura do mundo: ${(eSeries ?? eNoticias)!.message}`)
  for (const [nome, e] of [['eventos', eEventos], ['banco mundial', eBm], ['geopolítica', eGeo]] as const) if (e) console.error(`[nexusBriefing] ${nome} não lido:`, e.message)

  // Indicador: valor mais recente e o de ~30 dias antes (mesma série).
  const porSerie = new Map<string, { nome: string; pontos: { data: string; valor: number }[] }>()
  for (const l of (series ?? []) as { serie_codigo: string; serie_nome: string | null; valor: number; data_referencia: string }[]) {
    const g = porSerie.get(l.serie_codigo) ?? { nome: l.serie_nome ?? l.serie_codigo, pontos: [] }
    g.pontos.push({ data: l.data_referencia, valor: Number(l.valor) })
    porSerie.set(l.serie_codigo, g)
  }
  const indicadores = [...porSerie.values()].map((g) => {
    const atual = g.pontos[g.pontos.length - 1]
    const antes = [...g.pontos].reverse().find((p) => p.data <= desde30)
    return `- ${g.nome}: ${atual.valor} (ref. ${atual.data})${antes ? `; ~30 dias antes: ${antes.valor} (ref. ${antes.data})` : ''}`
  }).join('\n')

  const evs = ((eventos ?? []) as { title: string; description: string | null; natureza: string; published_at: string; joseph_analise: Record<string, { leitura?: string }> | null }[])
    .map((e) => `- ${e.published_at.slice(0, 10)} [${e.natureza}] ${e.title}. ${e.description ?? ''}${e.joseph_analise?.pt?.leitura ? `\n  Leitura do José: ${e.joseph_analise.pt.leitura.slice(0, 500)}` : ''}`).join('\n')

  const news = ((noticias ?? []) as unknown as { title: string; publication_date: string; canal: string | null; canonical_url: string | null; nexus_source: { source_name: string } | null }[])
    .map((n) => `- ${n.publication_date?.slice(0, 10)} (${n.canal ?? 'geral'}, ${n.nexus_source?.source_name ?? 'fonte jornalística'}): ${n.title}${n.canonical_url ? ` — ${n.canonical_url}` : ''}`).join('\n')

  // Mais recente de cada série do Banco Mundial (lista já vem do mais novo pro mais antigo).
  const bmUltimo = new Map<string, string>()
  for (const l of (bm ?? []) as { serie_codigo: string; serie_nome: string | null; valor: number; data_referencia: string }[])
    if (!bmUltimo.has(l.serie_codigo)) bmUltimo.set(l.serie_codigo, `- ${l.serie_nome ?? l.serie_codigo}: ${Number(l.valor).toFixed(1)}% (ano ${l.data_referencia.slice(0, 4)})`)
  const bancoMundial = [...bmUltimo.values()].join('\n')

  const geopolitica = ((geo ?? []) as unknown as { title: string; publication_date: string; canonical_url: string | null; nexus_source: { source_name: string } | null }[])
    .map((n) => `- ${n.publication_date?.slice(0, 10)} (${n.nexus_source?.source_name ?? 'fonte jornalística'}): ${n.title}${n.canonical_url ? ` — ${n.canonical_url}` : ''}`).join('\n')

  return `INDICADORES OFICIAIS (Banco Central / IBGE):\n${indicadores || '- indisponíveis'}\n\nEVENTOS DETECTADOS (últimos 30 dias):\n${evs || '- nenhum'}\n\nMANCHETES COLETADAS (últimos 3 dias — fonte jornalística, não confirmado oficialmente):\n${news || '- nenhuma'}\n\nECONOMIA DOS PARCEIROS (Banco Mundial, oficial, anual):\n${bancoMundial || '- indisponível'}\n\nGEOPOLÍTICA E COMÉRCIO MUNDIAL (GDELT, BBC World, ONU News e Al Jazeera — manchetes internacionais em inglês dos últimos 3 dias, fonte jornalística, não confirmado oficialmente):\n${geopolitica || '- nenhuma'}`
}

export class FalhaBriefing extends Error {}
