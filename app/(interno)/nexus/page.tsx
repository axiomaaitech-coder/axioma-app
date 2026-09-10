'use client'
import { useEffect, useState } from 'react'
import { Radio, Newspaper, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { LetreiroAxioma } from '../../../components/LetreiroAxioma'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { CentroCompartilhamento, BotaoCompartilhar } from '../../../components/CentroCompartilhamento'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterIndicadoresNexus, traduzirFreshness, type IndicadorNexus, type PontoSerie } from '../../../lib/nexusHelpers'
import { CANAIS_NEXUS_DEMO, obterNoticiasNexusDemo, type NoticiaNexus } from '../../../lib/nexusNewsDemo'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { tratarFalhaExportacao, tratarFalhaCarregamento } from '../../../lib/erroUiHelpers'
import { fBRL2 } from '../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const CIANO = '#22d3ee'
const ROXOTV = '#a78bfa'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

// Formato único de exibição — pra tela não precisar saber se a notícia veio
// da Currents (real, já em string plana no idioma buscado) ou do demo
// (Texto3 pt/en/es) — ambos viram isso antes de chegar no player/modal.
type NoticiaExibicao = {
  id: string
  titulo: string
  resumo: string
  imagem_url: string | null
  fonte: string
  url_original: string
  data: string
  isDemo: boolean
}

function mapDemoParaExibicao(n: NoticiaNexus, lang: Idioma3): NoticiaExibicao {
  return {
    id: n.id,
    titulo: n.titulo[lang],
    resumo: n.resumo[lang],
    imagem_url: n.imagem_url,
    fonte: n.fonte[lang],
    url_original: n.url_original,
    data: n.data,
    isDemo: true,
  }
}

function formatarValorIndicador(ind: IndicadorNexus): string {
  if (ind.valor == null) return '—'
  return ind.formatoPercentual ? `${ind.valor.toFixed(2)}%` : `R$ ${fBRL2(ind.valor)}`
}

function formatarDataNoticia(iso: string, lang: Idioma3, localeData: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return lang === 'pt' ? 'Hoje' : lang === 'en' ? 'Today' : 'Hoy'
  if (dias === 1) return lang === 'pt' ? 'Ontem' : lang === 'en' ? 'Yesterday' : 'Ayer'
  return new Date(iso).toLocaleDateString(localeData)
}

// Sparkline minimalista (sem eixo/legenda) reaproveitando o ECharts já usado
// em DashFinanceiro/DashComercial — nada de lib nova.
function sparklineOption(historico: PontoSerie[], cor: string) {
  return {
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: historico.map((p) => p.data) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(10,20,36,0.95)',
      borderColor: cor,
      textStyle: { color: '#e2ecf7', fontSize: 10 },
      formatter: (p: any) => `${p[0].axisValueLabel}<br/>${Number(p[0].value).toLocaleString()}`,
    },
    series: [{
      type: 'line', data: historico.map((p) => p.valor), smooth: true, symbol: 'none',
      lineStyle: { color: cor, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${cor}40` }, { offset: 1, color: `${cor}00` }] } },
    }],
  }
}

const INTERVALO_TROCA_MS = 6000

export default function NexusPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'

  const [loading, setLoading] = useState(true)
  const [indicadores, setIndicadores] = useState<IndicadorNexus[]>([])
  const [avisoCarregamento, setAvisoCarregamento] = useState<string | null>(null)
  const [canalAtivo, setCanalAtivo] = useState(CANAIS_NEXUS_DEMO[0].id)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaExibicao | null>(null)

  const [noticiasCanal, setNoticiasCanal] = useState<NoticiaExibicao[]>([])
  const [noticiasIsDemo, setNoticiasIsDemo] = useState(true)
  const [precisaAvisoDemo, setPrecisaAvisoDemo] = useState(false)
  const [carregandoNoticias, setCarregandoNoticias] = useState(true)
  const [indiceAtivo, setIndiceAtivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { indicadores: dados, erro } = await obterIndicadoresNexus()
      setIndicadores(dados)
      if (erro) setAvisoCarregamento(tratarFalhaCarregamento('nexus.carregarIndicadores', new Error('falha ao ler nexus_economic_series'), lang))
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Notícia do canal ativo — API própria (cache-aside em nexus_news); cai
  // pro demo local sozinha se a API/banco não tiverem nada ainda (nunca
  // fica sem conteúdo, nunca mistura demo com selo de real).
  useEffect(() => {
    let cancelado = false
    setIndiceAtivo(0)
    setCarregandoNoticias(true)
    const demoDoCanal = () => obterNoticiasNexusDemo(canalAtivo).map((n) => mapDemoParaExibicao(n, lang))

    ;(async () => {
      try {
        const res = await fetch(`/api/nexus/news?canal=${canalAtivo}`)
        const json = await res.json()
        if (cancelado) return
        if (json?.fonte === 'real' && Array.isArray(json.noticias) && json.noticias.length > 0) {
          setNoticiasCanal(json.noticias.map((n: any) => ({ ...n, isDemo: false })))
          setNoticiasIsDemo(false)
          setPrecisaAvisoDemo(false)
        } else {
          if (json?.motivo) console.warn(`[nexus] notícia real indisponível pro canal ${canalAtivo}: ${json.motivo}`)
          setNoticiasCanal(demoDoCanal())
          setNoticiasIsDemo(true)
          setPrecisaAvisoDemo(!!json?.motivo)
        }
      } catch {
        if (cancelado) return
        setNoticiasCanal(demoDoCanal())
        setNoticiasIsDemo(true)
        setPrecisaAvisoDemo(true)
      } finally {
        if (!cancelado) setCarregandoNoticias(false)
      }
    })()

    return () => { cancelado = true }
  }, [canalAtivo, lang])

  // TV rodando manchete sozinha a cada 6s — pausa com o mouse em cima.
  useEffect(() => {
    if (pausado || noticiasCanal.length <= 1) return
    const t = setInterval(() => setIndiceAtivo((i) => (i + 1) % noticiasCanal.length), INTERVALO_TROCA_MS)
    return () => clearInterval(t)
  }, [pausado, noticiasCanal.length])

  const irPara = (i: number) => {
    if (noticiasCanal.length === 0) return
    setIndiceAtivo(((i % noticiasCanal.length) + noticiasCanal.length) % noticiasCanal.length)
  }
  const noticiaAtual = noticiasCanal[indiceAtivo] ?? null

  async function exportarPDF() {
    setExportando(true)
    try {
      gerarPdfTabela({
        titulo: L('Nexus — Inteligência Econômica', 'Nexus — Economic Intelligence', 'Nexus — Inteligencia Económica'),
        subtitulo: L('Indicadores econômicos reais, atualizados diariamente pelo Banco Central', 'Real economic indicators, updated daily by the Central Bank', 'Indicadores económicos reales, actualizados diariamente por el Banco Central'),
        colunas: [
          { header: L('Indicador', 'Indicator', 'Indicador'), key: 'nome', width: 3 },
          { header: L('Valor', 'Value', 'Valor'), key: 'valor', width: 2, align: 'right' },
          { header: L('Data de referência', 'Reference date', 'Fecha de referencia'), key: 'data', width: 2 },
          { header: L('Status', 'Status', 'Estado'), key: 'status', width: 2 },
        ],
        linhas: indicadores.map((ind) => ({
          nome: ind.nome[lang],
          valor: formatarValorIndicador(ind),
          data: ind.dataReferencia ? new Date(ind.dataReferencia + 'T00:00:00').toLocaleDateString(localeData) : '—',
          status: traduzirFreshness(ind.freshness, lang).texto,
        })),
        nomeArquivo: `axioma-nexus-${new Date().toISOString().slice(0, 10)}.pdf`,
      }, (msg) => setAvisoCarregamento(msg), lang)
    } catch (err) {
      setAvisoCarregamento(tratarFalhaExportacao('nexus.exportarPDF', err, lang))
    }
    setExportando(false)
  }

  return (
    <ModuloLayout
      titulo={L('Nexus', 'Nexus', 'Nexus')}
      subtitulo={L('Inteligência econômica que atravessa toda a empresa — câmbio, juros e o cenário que move suas decisões.', "Economic intelligence that cuts across your whole company — FX, rates, and the backdrop shaping your decisions.", 'Inteligencia económica que atraviesa toda la empresa — cambio, tasas y el escenario que mueve sus decisiones.')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      botaoExtra={<BotaoCompartilhar onClick={() => setShareAberto(true)} texto={L('Compartilhar', 'Share', 'Compartir')} cor={CIANO} corTexto={CIANO} />}
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : (
        <div className="space-y-6">

          {/* LETREIRO PADRÃO DO MÓDULO — mesmo componente/lugar dos demais módulos, com dado real deste módulo (os 4 indicadores) */}
          <LetreiroAxioma id="nexus" cor={CIANO} itens={indicadores.map((ind) => `${ind.nome[lang]}: ${formatarValorIndicador(ind)}`)} />

          {avisoCarregamento && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: `${CIANO}15`, border: `1px solid ${CIANO}35`, color: CIANO }}>
              {avisoCarregamento}
            </div>
          )}

          {/* 4 INDICADORES — dado real de nexus_economic_series, com mini-histórico */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {indicadores.map((ind) => {
              const fresh = traduzirFreshness(ind.freshness, lang)
              return (
                <div key={ind.codigo} className="rounded-2xl p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${CIANO}30` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: CINZA }}>{ind.emoji} {ind.nome[lang]}</p>
                  </div>
                  <p className="text-2xl font-black leading-none mb-2" style={{ color: TITULO }}>{formatarValorIndicador(ind)}</p>
                  {ind.historico.length >= 2 && (
                    <div className="mb-2" style={{ height: 40 }}>
                      <ReactECharts option={sparklineOption(ind.historico, CIANO)} style={{ height: 40, width: '100%' }} notMerge lazyUpdate opts={{ renderer: 'svg' }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: CINZA }}>
                      {ind.dataReferencia ? new Date(ind.dataReferencia + 'T00:00:00').toLocaleDateString(localeData) : '—'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${fresh.cor}20`, color: fresh.cor }}>
                      {fresh.texto}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* TV — player grande de notícia em destaque, com canais */}
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'rgba(6,15,30,0.85)', border: `1px solid ${CIANO}35`, boxShadow: `0 0 40px ${CIANO}10` }}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio size={16} style={{ color: CIANO }} />
                <p className="text-sm font-black tracking-wide" style={{ color: TITULO }}>{L('Central Nexus', 'Nexus Center', 'Central Nexus')}</p>
              </div>
              {noticiasIsDemo && (
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }}>
                  {L('DEMONSTRAÇÃO', 'DEMO', 'DEMOSTRACIÓN')}
                </span>
              )}
            </div>

            <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto">
              {CANAIS_NEXUS_DEMO.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCanalAtivo(c.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
                  style={{
                    background: canalAtivo === c.id ? `${CIANO}25` : 'rgba(255,255,255,0.05)',
                    color: canalAtivo === c.id ? CIANO : CINZA,
                    border: canalAtivo === c.id ? `1px solid ${CIANO}50` : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {c.label[lang]}
                </button>
              ))}
            </div>

            {precisaAvisoDemo && (
              <div className="mx-4 mb-3 rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: `${ROXOTV}15`, border: `1px solid ${ROXOTV}35`, color: ROXOTV }}>
                {L('Notícia em tempo real ainda não disponível — mostrando conteúdo de demonstração.', 'Real-time news not available yet — showing demo content.', 'Noticia en tiempo real aún no disponible — mostrando contenido de demostración.')}
              </div>
            )}

            {/* PLAYER — 16:9, uma manchete em destaque por vez */}
            <div className="px-4">
              {carregandoNoticias ? (
                <div className="w-full aspect-video rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
              ) : !noticiaAtual ? (
                <div className="w-full aspect-video rounded-xl flex items-center justify-center text-xs font-semibold" style={{ background: `${ROXOTV}15`, border: `1px solid ${ROXOTV}35`, color: ROXOTV }}>
                  {L('Nenhuma notícia neste canal no momento.', 'No news on this channel right now.', 'No hay noticias en este canal por el momento.')}
                </div>
              ) : (
                <div
                  onMouseEnter={() => setPausado(true)}
                  onMouseLeave={() => setPausado(false)}
                  onClick={() => setNoticiaAberta(noticiaAtual)}
                  role="button"
                  tabIndex={0}
                  className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer select-none"
                  style={{ background: '#05070f' }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={noticiaAtual.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      {noticiaAtual.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={noticiaAtual.imagem_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ROXOTV}30, rgba(6,15,30,0.95))` }}>
                          <Newspaper size={48} style={{ color: ROXOTV }} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* degradê escuro — "tarja de telejornal" */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 55%, transparent 100%)' }} />

                  {noticiasIsDemo && (
                    <span className="absolute top-3 right-3 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.55)', color: AZULC, border: `1px solid ${AZULC}55` }}>
                      {L('DEMONSTRAÇÃO', 'DEMO', 'DEMOSTRACIÓN')}
                    </span>
                  )}

                  {noticiasCanal.length > 1 && (
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); irPara(indiceAtivo - 1) }}
                        aria-label={L('Manchete anterior', 'Previous headline', 'Titular anterior')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all hover:scale-110"
                        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); irPara(indiceAtivo + 1) }}
                        aria-label={L('Próxima manchete', 'Next headline', 'Siguiente titular')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all hover:scale-110"
                        style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5">
                    {noticiasCanal.length > 1 && (
                      <div className="flex gap-1.5 mb-2">
                        {noticiasCanal.map((_, i) => (
                          <button
                            key={i}
                            onClick={(e) => { e.stopPropagation(); irPara(i) }}
                            aria-label={`${i + 1}/${noticiasCanal.length}`}
                            className="h-1.5 rounded-full transition-all"
                            style={{ width: i === indiceAtivo ? 20 : 6, background: i === indiceAtivo ? ROXOTV : 'rgba(255,255,255,0.4)' }}
                          />
                        ))}
                      </div>
                    )}
                    <h3 className="font-black leading-snug mb-1 line-clamp-2 text-sm md:text-lg" style={{ color: '#fff' }}>{noticiaAtual.titulo}</h3>
                    <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      <span className="truncate">{noticiaAtual.fonte}</span>
                      <span>•</span>
                      <span className="shrink-0">{formatarDataNoticia(noticiaAtual.data, lang, localeData)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LETREIRO NOVO — exclusivo da TV, cor própria (roxo) separada do
                letreiro padrão do módulo acima (ciano); mesmas manchetes do
                canal ativo, real ou demo (nunca uma fonte diferente do player). */}
            <div className="px-4 py-4">
              <LetreiroExecutivo cor={ROXOTV} itens={noticiasCanal.map((n) => n.titulo)} />
            </div>
          </div>

          {/* CARDS ABAIXO DA TV — demais manchetes do canal ativo (além da que
              está no player), pro módulo não ficar vazio embaixo. Mesmo modal
              da TV ao clicar; mesmo padrão visual (cartão escuro/ciano). */}
          {!carregandoNoticias && noticiasCanal.length > 1 && (
            <div className="max-w-3xl mx-auto space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide px-1" style={{ color: CINZA }}>
                {L('Mais notícias deste canal', 'More headlines in this channel', 'Más noticias de este canal')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {noticiasCanal.filter((_, i) => i !== indiceAtivo).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNoticiaAberta(n)}
                    className="flex gap-3 rounded-xl p-3 text-left transition-all hover:scale-[1.01]"
                    style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${CIANO}20` }}
                  >
                    <div className="shrink-0 rounded-lg overflow-hidden" style={{ width: 84, height: 60, background: 'rgba(255,255,255,0.05)' }}>
                      {n.imagem_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={n.imagem_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper size={18} style={{ color: ROXOTV }} />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold leading-snug line-clamp-2 mb-1" style={{ color: TITULO }}>{n.titulo}</h4>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: CINZA }}>
                        <span className="truncate">{n.fonte}</span>
                        <span>•</span>
                        <span className="shrink-0">{formatarDataNoticia(n.data, lang, localeData)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {canalAtivo === 'reforma-tributaria' && (
                <a
                  href="https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/reforma-tributaria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01]"
                  style={{ background: `${CIANO}15`, border: `1px solid ${CIANO}35`, color: CIANO }}
                >
                  <ExternalLink size={13} />
                  {L('Ver mais sobre Reforma Tributária', 'See more on Tax Reform', 'Ver más sobre Reforma Tributaria')}
                </a>
              )}
            </div>
          )}

        </div>
      )}

      {/* MODAL DA NOTÍCIA — mesmo padrão de overlay do Centro de Compartilhamento */}
      <AnimatePresence>
        {noticiaAberta && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setNoticiaAberta(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: 'linear-gradient(135deg, #0a1628 0%, #060f1e 100%)', border: `1px solid ${ROXOTV}40` }}
              onClick={(e) => e.stopPropagation()}
            >
              {noticiaAberta.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={noticiaAberta.imagem_url} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ROXOTV}30, rgba(6,15,30,0.95))` }}>
                  <Newspaper size={34} style={{ color: ROXOTV }} />
                </div>
              )}
              <div className="p-5">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h3 className="text-base font-bold leading-snug" style={{ color: TITULO }}>{noticiaAberta.titulo}</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setNoticiaAberta(null)} style={{ color: CINZA }} className="shrink-0">
                    <X size={20} />
                  </motion.button>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold mb-3" style={{ color: CINZA }}>
                  <span>{noticiaAberta.fonte}</span>
                  <span>•</span>
                  <span>{formatarDataNoticia(noticiaAberta.data, lang, localeData)}</span>
                  {noticiaAberta.isDemo && (
                    <span className="ml-auto text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }}>
                      {L('DEMONSTRAÇÃO', 'DEMO', 'DEMOSTRACIÓN')}
                    </span>
                  )}
                </div>
                {noticiaAberta.resumo && (
                  <p className="text-sm leading-relaxed mb-5" style={{ color: TEXTO }}>{noticiaAberta.resumo}</p>
                )}
                <a
                  href={noticiaAberta.url_original}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                  style={{ background: `${ROXOTV}18`, border: `1px solid ${ROXOTV}55`, color: ROXOTV }}
                >
                  <ExternalLink size={15} />
                  {L('Ler matéria completa', 'Read full article', 'Leer la noticia completa')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CentroCompartilhamento
        aberto={shareAberto}
        onFechar={() => setShareAberto(false)}
        lang={lang}
        textoResumo={[
          `🚀 AXIOMA AI.TECH — ${L('Nexus', 'Nexus', 'Nexus')}`,
          ...indicadores.map((ind) => `${ind.emoji} ${ind.nome[lang]}: ${formatarValorIndicador(ind)}`),
        ].join('\n')}
        assunto={`${L('Nexus', 'Nexus', 'Nexus')} — Axioma`}
        cor={CIANO}
      />
    </ModuloLayout>
  )
}
