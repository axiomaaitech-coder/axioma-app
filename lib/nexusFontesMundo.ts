// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — fontes mundiais gratuitas (sem mensalidade, sem cadastro):
//  • IPEA Data — petróleo Brent diário (série EIA366_PBRENT366, US$/barril);
//  • Banco Mundial — crescimento do PIB e inflação anuais dos parceiros que
//    mais pesam pro Brasil (EUA, China, Zona do Euro, Argentina, Japão,
//    Reino Unido, Índia, México).
// Só servidor (cron, service_role). Grava em nexus_economic_series (mesma
// tabela do BCB) — o José (chat, painel, plano) passa a enxergar sozinho.
// Cada fonte isolada: uma falhar não derruba a outra nem a coleta do BCB.
// ═══════════════════════════════════════════════════════════════
import type { SupabaseClient } from '@supabase/supabase-js'
import { calcularFreshness } from './nexusFreshness'

type Fonte = { nome: string; tipo: string; provedor: string; endpoint: string; frequencia: string; licenca: string }

async function garantirFonte(supabase: SupabaseClient, f: Fonte): Promise<string> {
  const { data: existente } = await supabase.from('nexus_source').select('source_id').eq('source_name', f.nome).maybeSingle()
  if (existente?.source_id) return existente.source_id as string
  const { data, error } = await supabase.from('nexus_source').insert({
    source_name: f.nome, source_type: f.tipo, provider: f.provedor, country: 'WORLD', endpoint: f.endpoint,
    license: f.licenca, access_type: 'public', auth_type: 'none', update_frequency: f.frequencia, active: true,
  }).select('source_id').single()
  if (error || !data) throw new Error(`cadastro da fonte ${f.nome}: ${error?.message}`)
  return data.source_id as string
}

async function marcar(supabase: SupabaseClient, sourceId: string, ok: boolean) {
  await supabase.from('nexus_source').update(ok ? { last_success: new Date().toISOString() } : { last_failure: new Date().toISOString() }).eq('source_id', sourceId)
}

// ─── Petróleo Brent (IPEA) ───
export const SERIE_BRENT = 'IPEA:BRENT'
const URL_BRENT = "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='EIA366_PBRENT366')"

export async function ingerirBrent(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'IPEA Data', tipo: 'public_dataset', provedor: 'Instituto de Pesquisa Econômica Aplicada (IPEA)',
    endpoint: URL_BRENT, frequencia: 'daily', licenca: 'dados abertos (IPEA)',
  })
  try {
    const res = await fetch(URL_BRENT, { cache: 'no-store', signal: AbortSignal.timeout(30000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json() as { value?: { VALDATA: string; VALVALOR: number | null }[] }
    const pontos = (json.value ?? []).filter((p) => p.VALVALOR != null).slice(-90)
    if (pontos.length === 0) throw new Error('sem pontos')
    const linhas = pontos.map((p) => {
      const data = p.VALDATA.slice(0, 10)
      return {
        source_id: sourceId, serie_codigo: SERIE_BRENT, serie_nome: 'Petróleo Brent (US$/barril)', categoria: 'commodity',
        country: 'WORLD', moeda: 'USD', unidade: 'US$/barril', frequencia: 'diaria', valor: Number(p.VALVALOR), data_referencia: data,
        retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(data, 'diaria'),
      }
    })
    const { error } = await supabase.from('nexus_economic_series').upsert(linhas, { onConflict: 'source_id,serie_codigo,data_referencia' })
    if (error) throw new Error(error.message)
    await marcar(supabase, sourceId, true)
    return `${linhas.length} pontos`
  } catch (err) {
    await marcar(supabase, sourceId, false)
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

// ─── Banco Mundial ───
export const PAISES_BM: { iso: string; nome: string }[] = [
  { iso: 'USA', nome: 'EUA' }, { iso: 'CHN', nome: 'China' }, { iso: 'EMU', nome: 'Zona do Euro' }, { iso: 'ARG', nome: 'Argentina' },
  { iso: 'JPN', nome: 'Japão' }, { iso: 'GBR', nome: 'Reino Unido' }, { iso: 'IND', nome: 'Índia' }, { iso: 'MEX', nome: 'México' },
]
const INDICADORES_BM = [
  { codigo: 'NY.GDP.MKTP.KD.ZG', rotulo: 'crescimento do PIB (% a.a.)', categoria: 'gdp' },
  { codigo: 'FP.CPI.TOTL.ZG', rotulo: 'inflação (% a.a.)', categoria: 'inflation' },
]
export const codigoBM = (iso: string, indicador: string) => `WB:${iso}:${indicador}`

export async function ingerirBancoMundial(supabase: SupabaseClient): Promise<string> {
  const sourceId = await garantirFonte(supabase, {
    nome: 'Banco Mundial', tipo: 'international_org', provedor: 'World Bank Open Data',
    endpoint: 'https://api.worldbank.org/v2/country/{paises}/indicator/{indicador}', frequencia: 'annual', licenca: 'CC BY 4.0',
  })
  let total = 0
  const erros: string[] = []
  for (const ind of INDICADORES_BM) {
    try {
      const url = `https://api.worldbank.org/v2/country/${PAISES_BM.map((p) => p.iso).join(';')}/indicator/${ind.codigo}?format=json&mrv=4&per_page=200`
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json() as [unknown, { countryiso3code: string; date: string; value: number | null }[] | null]
      const linhas = (json[1] ?? []).filter((p) => p.value != null).map((p) => {
        const pais = PAISES_BM.find((x) => x.iso === p.countryiso3code)
        const data = `${p.date}-12-31`
        return {
          source_id: sourceId, serie_codigo: codigoBM(p.countryiso3code, ind.codigo), serie_nome: `${pais?.nome ?? p.countryiso3code} — ${ind.rotulo}`,
          categoria: ind.categoria, country: p.countryiso3code, unidade: '%', frequencia: 'anual', valor: Number(p.value), data_referencia: data,
          retrieved_at: new Date().toISOString(), freshness_status: calcularFreshness(data, 'anual'),
        }
      })
      if (linhas.length) {
        const { error } = await supabase.from('nexus_economic_series').upsert(linhas, { onConflict: 'source_id,serie_codigo,data_referencia' })
        if (error) throw new Error(error.message)
      }
      total += linhas.length
    } catch (err) {
      erros.push(`${ind.codigo}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  await marcar(supabase, sourceId, erros.length === 0)
  return erros.length ? `${total} pontos; erros: ${erros.join(' | ')}` : `${total} pontos`
}
