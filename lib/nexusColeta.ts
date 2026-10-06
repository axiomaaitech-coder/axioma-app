import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import * as Sentry from '@sentry/nextjs'
import crypto from 'crypto'
import { buscarEGravarFeeds, FeedError, CANAIS_FONTES } from '@/lib/nexusNewsIngest'
import { detectarEventosSerie, textoEvento, confirmacaoCruzada, type EventoDetectado } from '@/lib/nexusEventDetector'
import { RESERVA_BCE } from '@/lib/nexusLeitoresFontes'
import { calcularFreshness, calcularConfiancaFonte, concordanciaPct, fonteEmPausa } from '@/lib/nexusFreshness'
import { obterOuGerarAnalise } from '@/lib/nexusJoseph'
import { obterOuGerarBriefing } from '@/lib/nexusBriefing'
import { limparDadosVencidos } from '@/lib/nexusAuditoria'
import { conferirPrevisoes } from '@/lib/nexusPrevisoes'
import { buscarComRetentativa } from '@/lib/nexusRede'
import { ingerirBrent, ingerirBancoMundial, ingerirGdelt, ingerirMoedasBce, ingerirCommodities, ingerirIbge, ingerirAnp, ingerirComex, ingerirOcde, COMBUSTIVEIS_ANP, SERIE_BRENT, SERIE_YUAN, COMMODITIES_FMI, SERIES_IBGE } from '@/lib/nexusFontesMundo'

// ═══════════════════════════════════════════════════════════════
// AXIOMA NEXUS — coleta completa (BCB, fontes mundiais, notícias, detector,
// José). Chamada pelo cron diário (app/api/nexus/ingest/bcb, com IA) e pela
// visita de usuário logado (app/api/nexus/atualizar, sem IA). Era a rota do
// Comitê 02, Parte 2 — ingestão diária do BCB SGS:
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

// O Supabase não lança exceção em erro de banco (devolve { error }): try/catch
// sozinho deixava estas gravações falharem caladas. Toda escrita de controle do
// Nexus passa por aqui — falha vira log + Sentry (a regra de "tentar de novo em
// 6h" depende de last_success/last_failure gravados de verdade).
function avisarFalhaGravacaoNexus(tabela: string, operacao: string, error: { message: string } | null, extra: Record<string, unknown> = {}) {
  if (!error) return
  console.error(`[nexus] falha ao ${operacao} em ${tabela}:`, error.message)
  Sentry.captureException(new Error(`[nexus] falha ao ${operacao} em ${tabela}: ${error.message}`), { extra: { tabela, operacao, ...extra } })
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
    const { error } = await supabase.from('nexus_raw_ingestion').insert({
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
    avisarFalhaGravacaoNexus('nexus_raw_ingestion', 'insert (falha)', error, { sourceId })
  } catch (err) {
    // melhor-esforço — resumo final ({sucesso, falha, detalhes}) já reporta a falha da fonte
    avisarFalhaGravacaoNexus('nexus_raw_ingestion', 'insert (falha)', { message: String(err) }, { sourceId })
  }
  try {
    const { data, error } = await supabase.from('nexus_source').update({ last_failure: new Date().toISOString() }).eq('source_id', sourceId).select('source_id')
    avisarFalhaGravacaoNexus('nexus_source', 'update last_failure', error ?? (data?.length ? null : { message: 'fonte não encontrada' }), { sourceId })
  } catch (err) {
    avisarFalhaGravacaoNexus('nexus_source', 'update last_failure', { message: String(err) }, { sourceId })
  }
}

async function registrarSucesso(
  supabase: SupabaseClient,
  sourceId: string,
  params: { requestTs: string; endpoint: string; httpStatus: number; payloadHash: string; rawPayload: unknown }
) {
  const { error: erroRaw } = await supabase.from('nexus_raw_ingestion').insert({
    source_id: sourceId,
    request_ts: params.requestTs,
    response_ts: new Date().toISOString(),
    endpoint: params.endpoint,
    http_status: params.httpStatus,
    payload_hash: params.payloadHash,
    ingestion_status: 'success',
    raw_payload: params.rawPayload,
  })
  avisarFalhaGravacaoNexus('nexus_raw_ingestion', 'insert (sucesso)', erroRaw, { sourceId })
  const { data: fonte, error: erroFonte } = await supabase.from('nexus_source').update({ last_success: new Date().toISOString() }).eq('source_id', sourceId).select('source_id')
  avisarFalhaGravacaoNexus('nexus_source', 'update last_success', erroFonte ?? (fonte?.length ? null : { message: 'fonte não encontrada' }), { sourceId })
}

export async function executarColeta(opcoes: { comIA: boolean }): Promise<NextResponse> {
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
      const res = await buscarComRetentativa(url, { timeoutMs: 10000 })
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

  // Fontes mundiais gratuitas, em paralelo (cada uma isolada; antes do detector,
  // pra ele já ver o dado do dia). Coleta e notícias vêm ANTES do José: a IA é a
  // parte lenta e, se estourar os 300s, não pode levar a coleta junto.
  // Pausa automática (lib/nexusFreshness.ts): fonte fora do ar há 1+ dia espera 6h entre tentativas.
  const { data: fontesAntes } = await supabase.from('nexus_source').select('source_name, last_success, last_failure')
  const tentar = (nome: string, f: () => Promise<string>) => {
    const fonteAntes = fontesAntes?.find((x) => x.source_name === nome)
    if (fonteAntes && fonteEmPausa(fonteAntes.last_success as string | null, fonteAntes.last_failure as string | null)) return Promise.resolve('em pausa (tenta de novo em até 6h)')
    return f().catch((err) => `erro: ${err instanceof Error ? err.message : String(err)}`)
  }
  const [brent, bancoMundial, yuan, commodities, ibge, gdelt, anp, comex, ocde, noticias] = await Promise.all([
    tentar('IPEA Data', () => ingerirBrent(supabase)), tentar('Banco Mundial', () => ingerirBancoMundial(supabase)),
    tentar('Banco Central Europeu', () => ingerirMoedasBce(supabase)), tentar('FMI', () => ingerirCommodities(supabase)),
    tentar('IBGE Dados Abertos', () => ingerirIbge(supabase)), tentar('GDELT', () => ingerirGdelt(supabase)),
    tentar('ANP', () => ingerirAnp(supabase)), tentar('Comex Stat', () => ingerirComex(supabase)), tentar('OCDE', () => ingerirOcde(supabase)),
    ingestaoNoticias(supabase),
  ])
  const mundo = { brent, bancoMundial, yuan, commodities, ibge, gdelt, anp, comex, ocde }
  // Prazos de guarda (lib/nexusRetencao.ts): apaga plano > 90d, painel > 180d, auditoria > 365d.
  const limpeza = await limparDadosVencidos(supabase)
  const notasFontes = await atualizarNotasFontes(supabase)
  // Etapa 9 — confere as previsões do José com prazo vencido (dado do dia já coletado).
  const previsoes = await conferirPrevisoes(supabase)
  const eventos = await detectarEGravarEventos(supabase, fonte.source_id, catalogo as SerieCatalogo[])
  // IA (análises + painel) só no cron diário — a coleta pela visita não gasta crédito.
  const joseph = opcoes.comIA ? await preGerarAnalisesJoseph(supabase) : { geradas: 0, erro: 'sem IA nesta coleta' }
  // Etapa 7 — painel executivo do José de hoje (PT), depois das análises.
  let painel: string
  try { painel = opcoes.comIA ? (await obterOuGerarBriefing(supabase, 'pt'))?.data ?? 'sem dados' : 'sem IA nesta coleta' }
  catch (err) { painel = err instanceof Error ? err.message : String(err); console.error('[nexus/ingest/bcb] Falha no painel executivo:', painel) }

  return NextResponse.json({ sucesso, falha, detalhes, mundo, previsoes, eventos, joseph, painel, noticias, limpeza, notasFontes })
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

// Série de outra fonte → URL oficial usada como evidência do evento.
const SERIES_EXTERNAS = new Map<string, string>([
  [SERIE_BRENT, "http://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='EIA366_PBRENT366')"],
  [SERIE_YUAN, 'https://data.ecb.europa.eu/data/datasets/EXR'],
  ...COMMODITIES_FMI.map((c) => [c.codigo, 'https://data.imf.org/en/datasets/IMF.RES:PCPS'] as [string, string]),
  ...COMBUSTIVEIS_ANP.map((c) => [c.codigo, 'https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/levantamento-de-precos-de-combustiveis-ultimas-semanas-pesquisadas'] as [string, string]),
  ...SERIES_IBGE.map((s) => [s.codigo, `https://servicodados.ibge.gov.br/api/v3/agregados/${s.q}`] as [string, string]),
])

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

    // Séries de outras fontes (IPEA, BCE, FMI, IBGE) — mesmo detector; evento e evidência
    // apontam pra fonte de origem, não pro BCB.
    const fonteExterna = new Map<string, string>()
    for (const [codigo] of SERIES_EXTERNAS) {
      const { data: linhas } = await supabase
        .from('nexus_economic_series')
        .select('data_referencia, valor, source_id')
        .eq('serie_codigo', codigo)
        .order('data_referencia', { ascending: false })
        .limit(PONTOS_DETECCAO)
      const fonte = (linhas?.[0]?.source_id as string | undefined) ?? null
      if (!fonte) continue
      fonteExterna.set(codigo, fonte)
      const hist = (linhas ?? []).filter((l) => l.valor != null).map((l) => ({ data: l.data_referencia as string, valor: Number(l.valor) }))
      detectados.push(...detectarEventosSerie(codigo, hist))
    }
    const fonteDoEvento = (e: EventoDetectado) => fonteExterna.get(e.subcategory) ?? sourceId
    const urlEvidencia = (e: EventoDetectado) => SERIES_EXTERNAS.get(e.subcategory)
      ?? `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${e.subcategory}/dados?formato=json`

    if (detectados.length === 0) return { detectados: 0, novos: 0 }

    // Confirmação cruzada do câmbio: o BCE viu o mesmo movimento? Sobe a confiança
    // pra 99 e grava a 2ª evidência (só evento novo, como a 1ª).
    const fonteConfirma = new Map<string, string>()
    for (const e of detectados) {
      const bce = e.event_type === 'fx_5d' ? RESERVA_BCE[e.subcategory] : undefined
      if (!bce) continue
      const { data: outra } = await supabase.from('nexus_economic_series').select('data_referencia, valor, source_id')
        .eq('serie_codigo', bce).order('data_referencia', { ascending: false }).limit(PONTOS_DETECCAO)
      const pct = confirmacaoCruzada(e.payload, (outra ?? []).map((l) => ({ data: l.data_referencia as string, valor: Number(l.valor) })))
      if (pct == null) continue
      e.payload.confirmacao = { fonte: 'BCE', variacao: pct }
      e.confidence = 99
      fonteConfirma.set(e.source_event_ref, outra![0].source_id as string)
    }

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
    // 2ª evidência: a série do BCE que confirmou o movimento.
    for (const g of gravados ?? []) {
      const e = porRef.get(g.source_event_ref)!
      const fonteBce = fonteConfirma.get(g.source_event_ref)
      if (jaExiste.has(g.source_event_ref) || !fonteBce || !e.payload.confirmacao) continue
      evidencias.push({
        event_id: g.event_id, source_id: fonteBce, evidence_type: 'official_series',
        referencia: 'https://data.ecb.europa.eu/data/datasets/EXR',
        excerpt: `BCE (R$ por unidade, via euro): ${e.payload.confirmacao.variacao}% no mesmo período`,
        published_at: `${e.data_ref}T00:00:00Z`, retrieved_at: agora, confidence: 99, verification_status: 'official',
      })
    }
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
// Nota de confiança de cada fonte (lib/nexusFreshness.ts calcularConfiancaFonte),
// gravada nas colunas *_score de nexus_source. Consistência: dólar do BCB × dólar
// do BCE na última data em comum. Melhor-esforço.
async function atualizarNotasFontes(supabase: SupabaseClient): Promise<string> {
  try {
    const [{ data: fontes }, { data: bcb }, { data: bce }] = await Promise.all([
      supabase.from('nexus_source').select('source_id, source_name, source_type, last_success, last_failure'),
      supabase.from('nexus_economic_series').select('data_referencia, valor').eq('serie_codigo', '1').order('data_referencia', { ascending: false }).limit(10),
      supabase.from('nexus_economic_series').select('data_referencia, valor').eq('serie_codigo', RESERVA_BCE['1']).order('data_referencia', { ascending: false }).limit(10),
    ])
    const comum = (bcb ?? []).find((l) => (bce ?? []).some((r) => r.data_referencia === l.data_referencia))
    const par = comum ? (bce ?? []).find((r) => r.data_referencia === comum.data_referencia) : undefined
    const concordancia = comum && par ? concordanciaPct(Number(comum.valor), Number(par.valor)) : null
    for (const f of fontes ?? []) {
      const c = calcularConfiancaFonte(f.source_type as string, f.last_success as string | null, f.last_failure as string | null,
        f.source_name === 'BCB SGS' || f.source_name === 'Banco Central Europeu' ? concordancia : null)
      // varredura:ok — service role; a fonte acabou de ser lida acima, erro checado abaixo
      const { error: erroNota } = await supabase.from('nexus_source').update({
        reliability_score: c.nota, authority_score: c.autoridade, freshness_score: c.atualidade, evidence_score: c.consistencia,
      }).eq('source_id', f.source_id)
      avisarFalhaGravacaoNexus('nexus_source', 'update confiabilidade', erroNota, { sourceId: f.source_id })
    }
    return `${fontes?.length ?? 0} fontes; concordância dólar BCB×BCE: ${concordancia ?? 'sem data em comum'}`
  } catch (err) {
    return `erro: ${err instanceof Error ? err.message : String(err)}`
  }
}

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
