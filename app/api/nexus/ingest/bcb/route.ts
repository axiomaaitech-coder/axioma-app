import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import crypto from 'crypto'
import { buscarEGravarFeeds, FeedError, CANAIS_FONTES } from '@/lib/nexusNewsIngest'
import { detectarEventosSerie, textoEvento, type EventoDetectado } from '@/lib/nexusEventDetector'
import { calcularFreshness } from '@/lib/nexusFreshness'
import { obterOuGerarAnalise } from '@/lib/nexusJoseph'
import { obterOuGerarBriefing } from '@/lib/nexusBriefing'
import { limparDadosVencidos } from '@/lib/nexusAuditoria'
import { ingerirBrent, ingerirBancoMundial, SERIE_BRENT } from '@/lib/nexusFontesMundo'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — Comitê 02, Parte 2: ingestão diária do BCB SGS
// GET /api/nexus/ingest/bcb — chamada 1x/dia pelo Vercel Cron (Hobby:
// 1 job/dia, só GET, só UTC, sem retry, sem alerta — por isso cada série é
// isolada e tolerante a falha: se uma quebrar hoje, amanhã recupera sozinha,
// sem duplicar (upsert idempotente) e sem travar as outras séries do lote.
//
// Protegida por CRON_SECRET: a Vercel injeta automaticamente o header
// "Authorization: Bearer <CRON_SECRET>" quando ela mesma dispara o cron —
// isso exige a env var CRON_SECRET configurada no projeto Vercel. Pra
// disparo manual (teste), o header precisa ser montado à mão com o mesmo
// valor (ver comentário de teste no final do arquivo).
//
// Desde 26/03/2025 o BCB SGS exige dataInicial/dataFinal — nunca chamamos
// o endpoint puro. Cada série usa janela móvel (hoje − janela_dias) com um
// piso mínimo por cadência (ver janelaEfetivaDias) pra séries mensais não
// perderem o dado mais recente por causa do atraso normal de publicação.
//
// Também dispara aqui (mesmo cron, não um novo — plano Hobby só permite 1/
// dia) o refresh forçado dos 4 canais de notícia RSS, ignorando o cache de
// 4h — assim a TV sempre tem manchete atualizada pelo menos 1x/dia mesmo
// que ninguém abra a tela nesse meio tempo. Cada canal é isolado (um falhar
// não afeta o resumo do BCB nem os outros canais) — ver ingestaoNoticias().
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // catálogo BCB (9 séries) + detector + até 3 análises do Joseph + 4 canais de notícia

type BcbPonto = { data: string; valor: string }

type SerieCatalogo = {
  serie_codigo: string
  serie_nome: string | null
  categoria: string | null
  country: string
  frequencia: string | null
  janela_dias: number
}

type DetalheSerie = {
  serie: string
  status: 'sucesso' | 'falha'
  pontos?: number
  erro?: string
}

function logFalhaIngestao(serieCodigo: string, motivo: string, contexto: Record<string, unknown>) {
  console.error(`[nexus/ingest/bcb] Falha na série ${serieCodigo}: ${motivo}`, contexto)
  Sentry.captureException(new Error(`[nexus/ingest/bcb] Falha na série ${serieCodigo}: ${motivo}`), {
    extra: { serieCodigo, motivo, ...contexto },
  })
}

// Formata em UTC (dd/MM/aaaa, formato exigido pelo BCB) — nunca hora local
// do processo, pra não deslocar a data num fuso diferente de onde ele roda.
function formatarDataBR(data: Date): string {
  const dd = String(data.getUTCDate()).padStart(2, '0')
  const mm = String(data.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = data.getUTCFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function dataBRparaISO(dataBR: string): string {
  const [dd, mm, yyyy] = dataBR.split('/')
  return `${yyyy}-${mm}-${dd}`
}

// IPCA (e qualquer série mensal futura) é publicado ~10 dias do mês
// seguinte ao de referência — o ponto mais recente disponível pode ficar
// até ~70 dias distante de data_referencia pouco antes do próximo
// lançamento. Um catálogo com janela_dias menor que isso perderia
// exatamente o dado mais novo na segunda metade do ciclo. Piso aplicado
// aqui, no código — não depende de o valor no catálogo estar "certo".
function janelaEfetivaDias(janelaCatalogo: number, frequencia: string | null): number {
  // mensal_defasada = série mensal publicada ~2-3 meses depois do mês de
  // referência (desemprego/PNAD, IBC-Br) — precisa de janela maior ainda.
  const piso = frequencia === 'mensal_defasada' ? 130 : frequencia === 'mensal' ? 70 : 35
  return Math.max(janelaCatalogo || 35, piso)
}

// Grava a falha em nexus_raw_ingestion + last_failure na fonte, sempre em
// modo melhor-esforço: se essa própria escrita falhar, não pode derrubar o
// loop — o resumo final da rota já carrega a falha real de qualquer jeito.
async function registrarFalha(
  supabase: SupabaseClient,
  sourceId: string,
  params: {
    requestTs: string
    endpoint: string | null
    httpStatus?: number | null
    payloadHash?: string | null
    error: string
    rawPayload?: unknown
  }
) {
  try {
    await supabase.from('nexus_raw_ingestion').insert({
      source_id: sourceId,
      request_ts: params.requestTs,
      response_ts: new Date().toISOString(),
      endpoint: params.endpoint,
      http_status: params.httpStatus ?? null,
      payload_hash: params.payloadHash ?? null,
      ingestion_status: 'failed',
      error: params.error,
      raw_payload: params.rawPayload ?? null,
    })
  } catch {
    // melhor-esforço — resumo final ({sucesso, falha, detalhes}) já reporta essa falha
  }
  try {
    await supabase.from('nexus_source').update({ last_failure: new Date().toISOString() }).eq('source_id', sourceId)
  } catch {
    // idem
  }
}

async function registrarSucesso(
  supabase: SupabaseClient,
  sourceId: string,
  params: { requestTs: string; endpoint: string; httpStatus: number; payloadHash: string; rawPayload: unknown }
) {
  await supabase.from('nexus_raw_ingestion').insert({
    source_id: sourceId,
    request_ts: params.requestTs,
    response_ts: new Date().toISOString(),
    endpoint: params.endpoint,
    http_status: params.httpStatus,
    payload_hash: params.payloadHash,
    ingestion_status: 'success',
    raw_payload: params.rawPayload,
  })
  await supabase.from('nexus_source').update({ last_success: new Date().toISOString() }).eq('source_id', sourceId)
}

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurada no servidor — adicionar nas env vars da Vercel' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY não configurada no servidor — adicionar nas env vars da Vercel' },
      { status: 500 }
    )
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const { data: fonte, error: erroFonte } = await supabase
    .from('nexus_source')
    .select('source_id, active')
    .eq('source_name', 'BCB SGS')
    .maybeSingle()

  if (erroFonte || !fonte) {
    return NextResponse.json({ error: 'Fonte BCB SGS não encontrada em nexus_source' }, { status: 500 })
  }
  if (!fonte.active) {
    return NextResponse.json({ sucesso: 0, falha: 0, detalhes: [], aviso: 'Fonte BCB SGS está com active=false — nenhuma série processada' })
  }

  const { data: catalogo, error: erroCatalogo } = await supabase
    .from('nexus_series_catalog')
    .select('serie_codigo, serie_nome, categoria, country, frequencia, janela_dias')
    .eq('source_id', fonte.source_id)
    .eq('active', true)

  if (erroCatalogo) {
    return NextResponse.json({ error: `Falha ao ler nexus_series_catalog: ${erroCatalogo.message}` }, { status: 500 })
  }
  if (!catalogo || catalogo.length === 0) {
    return NextResponse.json({ sucesso: 0, falha: 0, detalhes: [], aviso: 'Nenhuma série ativa no catálogo BCB' })
  }

  const detalhes: DetalheSerie[] = []
  let sucesso = 0
  let falha = 0

  for (const serie of catalogo as SerieCatalogo[]) {
    const requestTs = new Date().toISOString()
    const hoje = new Date()
    const janela = janelaEfetivaDias(serie.janela_dias, serie.frequencia)
    const inicio = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate() - janela))
    const dataInicial = formatarDataBR(inicio)
    const dataFinal = formatarDataBR(hoje)
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serie.serie_codigo}/dados?formato=json&dataInicial=${dataInicial}&dataFinal=${dataFinal}`

    try {
      const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) })
      const httpStatus = res.status
      const bodyText = await res.text()
      const hash = crypto.createHash('sha256').update(bodyText).digest('hex')

      if (!res.ok) {
        await registrarFalha(supabase, fonte.source_id, {
          requestTs, endpoint: url, httpStatus, payloadHash: hash, error: `HTTP ${httpStatus}`, rawPayload: bodyText.slice(0, 2000),
        })
        logFalhaIngestao(serie.serie_codigo, `HTTP ${httpStatus}`, { url })
        falha++
        detalhes.push({ serie: serie.serie_codigo, status: 'falha', erro: `HTTP ${httpStatus}` })
        continue
      }

      let pontos: BcbPonto[] = []
      try {
        pontos = JSON.parse(bodyText)
      } catch {
        pontos = []
      }

      if (!Array.isArray(pontos) || pontos.length === 0) {
        await registrarFalha(supabase, fonte.source_id, {
          requestTs, endpoint: url, httpStatus, payloadHash: hash, error: 'resposta sem pontos de dado', rawPayload: pontos,
        })
        logFalhaIngestao(serie.serie_codigo, 'resposta sem pontos de dado', { url })
        falha++
        detalhes.push({ serie: serie.serie_codigo, status: 'falha', erro: 'resposta vazia' })
        continue
      }

      const linhas = pontos
        .map((p) => {
          const dataReferencia = dataBRparaISO(p.data)
          const valor = parseFloat(String(p.valor).replace(',', '.'))
          return {
            source_id: fonte.source_id,
            serie_codigo: serie.serie_codigo,
            serie_nome: serie.serie_nome,
            categoria: serie.categoria,
            country: serie.country,
            frequencia: serie.frequencia,
            valor,
            data_referencia: dataReferencia,
            retrieved_at: new Date().toISOString(),
            freshness_status: calcularFreshness(dataReferencia, serie.frequencia),
          }
        })
        .filter((linha) => !Number.isNaN(linha.valor))

      if (linhas.length === 0) {
        await registrarFalha(supabase, fonte.source_id, {
          requestTs, endpoint: url, httpStatus, payloadHash: hash, error: 'todos os pontos vieram com valor inválido', rawPayload: pontos,
        })
        logFalhaIngestao(serie.serie_codigo, 'todos os pontos vieram com valor inválido', { url })
        falha++
        detalhes.push({ serie: serie.serie_codigo, status: 'falha', erro: 'valores inválidos' })
        continue
      }

      const { data: upsertData, error: upsertError } = await supabase
        .from('nexus_economic_series')
        .upsert(linhas, { onConflict: 'source_id,serie_codigo,data_referencia' })
        .select('id')

      if (upsertError || !upsertData || upsertData.length === 0) {
        const motivo = upsertError?.message || '0 linhas afetadas'
        await registrarFalha(supabase, fonte.source_id, {
          requestTs, endpoint: url, httpStatus, payloadHash: hash, error: motivo, rawPayload: pontos,
        })
        logFalhaIngestao(serie.serie_codigo, motivo, { url, pontosRecebidos: linhas.length })
        falha++
        detalhes.push({ serie: serie.serie_codigo, status: 'falha', erro: motivo })
        continue
      }

      await registrarSucesso(supabase, fonte.source_id, { requestTs, endpoint: url, httpStatus, payloadHash: hash, rawPayload: pontos })
      sucesso++
      detalhes.push({ serie: serie.serie_codigo, status: 'sucesso', pontos: linhas.length })
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err)
      await registrarFalha(supabase, fonte.source_id, { requestTs, endpoint: url, error: motivo })
      logFalhaIngestao(serie.serie_codigo, motivo, { url })
      falha++
      detalhes.push({ serie: serie.serie_codigo, status: 'falha', erro: motivo })
    }
  }

  // Fontes mundiais gratuitas (antes do detector, pra ele já ver o petróleo do dia).
  const mundo: Record<string, string> = {}
  try { mundo.brent = await ingerirBrent(supabase) } catch (err) { mundo.brent = `erro: ${err instanceof Error ? err.message : String(err)}` }
  try { mundo.bancoMundial = await ingerirBancoMundial(supabase) } catch (err) { mundo.bancoMundial = `erro: ${err instanceof Error ? err.message : String(err)}` }
  const eventos = await detectarEGravarEventos(supabase, fonte.source_id, catalogo as SerieCatalogo[])
  const joseph = await preGerarAnalisesJoseph(supabase)
  // Etapa 7 — painel executivo do José de hoje (PT), depois das análises.
  let painel: string
  try { painel = (await obterOuGerarBriefing(supabase, 'pt'))?.data ?? 'sem dados' }
  catch (err) { painel = err instanceof Error ? err.message : String(err); console.error('[nexus/ingest/bcb] Falha no painel executivo:', painel) }
  const noticias = await ingestaoNoticias(supabase)
  // Prazos de guarda (lib/nexusRetencao.ts): apaga plano > 90d, painel > 180d, auditoria > 365d.
  const limpeza = await limparDadosVencidos(supabase)

  return NextResponse.json({ sucesso, falha, detalhes, mundo, eventos, joseph, painel, noticias, limpeza })
}

// Etapa 4 — adianta a análise do Joseph (em português, idioma da maioria)
// dos eventos mais recentes ainda sem análise, pra ninguém esperar ao abrir.
// Teto de 3 por rodada: custo e tempo previsíveis; o resto é gerado sob
// demanda por /api/nexus/joseph. Melhor-esforço, evento a evento.
const MAX_ANALISES_POR_RODADA = 2 // cabe no maxDuration de 300s junto com o painel executivo (Etapa 7)

async function preGerarAnalisesJoseph(supabase: SupabaseClient): Promise<{ geradas: number; erro?: string }> {
  try {
    const { data, error } = await supabase
      .from('nexus_global_event')
      .select('event_id')
      .is('joseph_analise', null)
      .not('payload', 'is', null)
      .order('published_at', { ascending: false })
      .limit(MAX_ANALISES_POR_RODADA)
    if (error) throw new Error(error.message)
    let geradas = 0
    for (const ev of data ?? []) {
      try {
        await obterOuGerarAnalise(supabase, ev.event_id as string, 'pt')
        geradas++
      } catch (err) {
        const motivo = err instanceof Error ? err.message : String(err)
        console.error(`[nexus/ingest/bcb] Joseph falhou no evento ${ev.event_id}:`, motivo)
        Sentry.captureException(new Error(`[nexus/ingest/bcb] Joseph falhou: ${motivo}`), { extra: { eventId: ev.event_id } })
      }
    }
    return { geradas }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[nexus/ingest/bcb] Falha na pré-geração do Joseph:', motivo)
    return { geradas: 0, erro: motivo }
  }
}

// Etapa 3 — roda o detector (lib/nexusEventDetector.ts) em cima do histórico
// JÁ gravado de cada série e faz upsert em nexus_global_event pela chave
// determinística source_event_ref (índice único, NEXUS-ETAPA3-EVENTOS-SQL.txt).
// Evidência (URL oficial do BCB) só é gravada pra evento novo — re-rodar o
// cron não duplica prova. Melhor-esforço: falha aqui não derruba a resposta
// da ingestão, só vira log/Sentry e aparece no resumo.
const PONTOS_DETECCAO = 60

async function detectarEGravarEventos(supabase: SupabaseClient, sourceId: string, catalogo: SerieCatalogo[]): Promise<{ detectados: number; novos: number; erro?: string }> {
  try {
    const detectados: EventoDetectado[] = []
    for (const serie of catalogo) {
      const { data, error } = await supabase
        .from('nexus_economic_series')
        .select('data_referencia, valor')
        .eq('source_id', sourceId)
        .eq('serie_codigo', serie.serie_codigo)
        .order('data_referencia', { ascending: false })
        .limit(PONTOS_DETECCAO)
      if (error) throw new Error(`leitura da série ${serie.serie_codigo}: ${error.message}`)
      const historico = (data ?? [])
        .filter((l) => l.valor != null)
        .map((l) => ({ data: l.data_referencia as string, valor: Number(l.valor) }))
      detectados.push(...detectarEventosSerie(serie.serie_codigo, historico))
    }

    // Petróleo Brent (IPEA) — outra fonte, mesmo detector; evento e evidência apontam pro IPEA.
    const { data: brent } = await supabase
      .from('nexus_economic_series')
      .select('data_referencia, valor, source_id')
      .eq('serie_codigo', SERIE_BRENT)
      .order('data_referencia', { ascending: false })
      .limit(PONTOS_DETECCAO)
    const fonteBrent = (brent?.[0]?.source_id as string | undefined) ?? null
    if (fonteBrent) {
      const hist = (brent ?? []).filter((l) => l.valor != null).map((l) => ({ data: l.data_referencia as string, valor: Number(l.valor) }))
      detectados.push(...detectarEventosSerie(SERIE_BRENT, hist))
    }
    const fonteDoEvento = (e: EventoDetectado) => (e.subcategory === SERIE_BRENT && fonteBrent ? fonteBrent : sourceId)
    const urlEvidencia = (e: EventoDetectado) => e.subcategory === SERIE_BRENT
      ? "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='EIA366_PBRENT366')"
      : `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${e.subcategory}/dados?formato=json`

    if (detectados.length === 0) return { detectados: 0, novos: 0 }

    const refs = detectados.map((e) => e.source_event_ref)
    const { data: existentes, error: erroExistentes } = await supabase
      .from('nexus_global_event')
      .select('source_event_ref')
      .in('source_event_ref', refs)
    if (erroExistentes) throw new Error(`leitura de eventos existentes: ${erroExistentes.message}`)
    const jaExiste = new Set((existentes ?? []).map((e) => e.source_event_ref))

    const agora = new Date().toISOString()
    const linhas = detectados.map((e) => {
      const texto = textoEvento(e.payload, 'pt')
      return {
        title: texto.titulo,
        description: texto.descricao,
        event_type: e.event_type,
        category: e.category,
        subcategory: e.subcategory,
        country: 'BR',
        source_id: fonteDoEvento(e),
        source_event_ref: e.source_event_ref,
        natureza: e.natureza,
        published_at: `${e.data_ref}T00:00:00Z`,
        observed_at: agora,
        severity: e.severity,
        relevance: e.severity,
        confidence: e.confidence,
        evidence_level: e.evidence_level,
        status: 'active',
        payload: e.payload,
        updated_at: agora,
      }
    })

    const { data: gravados, error: erroUpsert } = await supabase
      .from('nexus_global_event')
      .upsert(linhas, { onConflict: 'source_event_ref' })
      .select('event_id, source_event_ref')
    if (erroUpsert) throw new Error(`upsert de eventos: ${erroUpsert.message}`)

    const porRef = new Map(detectados.map((e) => [e.source_event_ref, e]))
    const evidencias = (gravados ?? [])
      .filter((g) => !jaExiste.has(g.source_event_ref))
      .map((g) => {
        const e = porRef.get(g.source_event_ref)!
        return {
          event_id: g.event_id,
          source_id: fonteDoEvento(e),
          evidence_type: 'official_series',
          referencia: urlEvidencia(e),
          excerpt: `${e.payload.data_ref_anterior}: ${e.payload.valor_anterior} → ${e.payload.data_ref}: ${e.payload.valor_atual}`,
          published_at: `${e.data_ref}T00:00:00Z`,
          retrieved_at: agora,
          confidence: e.confidence,
          verification_status: 'official',
        }
      })
    if (evidencias.length > 0) {
      const { error: erroEvidencia } = await supabase.from('nexus_event_evidence').insert(evidencias)
      if (erroEvidencia) throw new Error(`gravação de evidências: ${erroEvidencia.message}`)
    }

    return { detectados: detectados.length, novos: evidencias.length }
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    console.error('[nexus/ingest/bcb] Falha no detector de eventos:', motivo)
    Sentry.captureException(new Error(`[nexus/ingest/bcb] Falha no detector de eventos: ${motivo}`))
    return { detectados: 0, novos: 0, erro: motivo }
  }
}

// Força o refresh dos 4 canais de notícia (ignora cache) — melhor-esforço,
// canal por canal: um canal sem nenhum feed no ar não derruba os outros nem
// o resumo do BCB acima. FeedError('sem_resultado') é esperado sempre que o
// filtro de palavra-chave (moedas/reforma-tributária) não achar nada nessa
// rodada — não é uma falha de verdade, só não tinha manchete nova agora.
async function ingestaoNoticias(supabase: SupabaseClient): Promise<Record<string, string>> {
  const resultado: Record<string, string> = {}
  for (const canal of Object.keys(CANAIS_FONTES)) {
    try {
      await buscarEGravarFeeds(supabase, canal)
      resultado[canal] = 'sucesso'
    } catch (err) {
      const motivo = err instanceof FeedError ? err.motivo : err instanceof Error ? err.message : String(err)
      resultado[canal] = motivo
      console.error(`[nexus/ingest/bcb] Falha atualizando notícia do canal ${canal}:`, motivo)
    }
  }
  return resultado
}

// Sem tela nenhuma nesta rota (JSON puro, consumido pelo cron) — regra de
// i18n PT/EN/ES não se aplica, não há texto visível pra usuário final.
//
// Se o catálogo crescer muito (dezenas/centenas de séries), 30s de
// maxDuration deixa de ser confortável — aí vira processamento em lote
// (ex: cron dispara N chamadas menores, ou fila), não mais um loop único
// aqui dentro. Não implementado agora porque hoje são 9 séries.
