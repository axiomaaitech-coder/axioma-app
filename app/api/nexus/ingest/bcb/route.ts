import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import crypto from 'crypto'

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
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // catálogo de hoje (4 séries) roda em segundos; se crescer muito, vira lote — ver nota no fim

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
  const piso = frequencia === 'mensal' ? 70 : 35
  return Math.max(janelaCatalogo || 35, piso)
}

function calcularFreshness(dataReferenciaISO: string, frequencia: string | null): string {
  const hoje = new Date()
  const ref = new Date(`${dataReferenciaISO}T00:00:00Z`)
  const dias = Math.floor((Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()) - ref.getTime()) / 86400000)
  const ehDiaria = frequencia === 'diaria' || frequencia === 'event_driven'
  if (ehDiaria) {
    if (dias <= 1) return 'live'
    if (dias <= 3) return 'fresh'
    if (dias <= 7) return 'recent'
    if (dias <= 30) return 'stale'
    return 'expired'
  }
  if (dias <= 35) return 'live'
  if (dias <= 45) return 'fresh'
  if (dias <= 60) return 'recent'
  if (dias <= 90) return 'stale'
  return 'expired'
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

  return NextResponse.json({ sucesso, falha, detalhes })
}

// Sem tela nenhuma nesta rota (JSON puro, consumido pelo cron) — regra de
// i18n PT/EN/ES não se aplica, não há texto visível pra usuário final.
//
// Se o catálogo crescer muito (dezenas/centenas de séries), 30s de
// maxDuration deixa de ser confortável — aí vira processamento em lote
// (ex: cron dispara N chamadas menores, ou fila), não mais um loop único
// aqui dentro. Não implementado agora porque hoje são 4 séries.
