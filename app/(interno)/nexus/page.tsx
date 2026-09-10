'use client'
import { useEffect, useState } from 'react'
import { Radio, Newspaper, X, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { LetreiroAxioma } from '../../../components/LetreiroAxioma'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { CentroCompartilhamento, BotaoCompartilhar } from '../../../components/CentroCompartilhamento'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterIndicadoresNexus, traduzirFreshness, type IndicadorNexus, type PontoSerie } from '../../../lib/nexusHelpers'
import { CANAIS_NEXUS_DEMO, MANCHETES_TICKER_NEXUS_DEMO, obterNoticiasNexusDemo, type NoticiaNexus } from '../../../lib/nexusNewsDemo'
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
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaNexus | null>(null)

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

  const noticiasCanal = obterNoticiasNexusDemo(canalAtivo)

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

          {/* TV — painel central de médio destaque, com canais */}
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden" style={{ background: 'rgba(6,15,30,0.85)', border: `1px solid ${CIANO}35`, boxShadow: `0 0 40px ${CIANO}10` }}>
            <div className="flex items-center justify-between gap-3 px-4 pt-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio size={16} style={{ color: CIANO }} />
                <p className="text-sm font-black tracking-wide" style={{ color: TITULO }}>{L('Central Nexus', 'Nexus Center', 'Central Nexus')}</p>
              </div>
              <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }}>
                {L('DEMONSTRAÇÃO', 'DEMO', 'DEMOSTRACIÓN')}
              </span>
            </div>

            <div className="flex gap-1.5 px-4 pt-3 pb-1 overflow-x-auto">
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

            {noticiasCanal.length === 0 ? (
              <div className="mx-4 mb-4 rounded-xl px-4 py-3 text-xs font-semibold" style={{ background: `${ROXOTV}15`, border: `1px solid ${ROXOTV}35`, color: ROXOTV }}>
                {L('Nenhuma notícia neste canal no momento.', 'No news on this channel right now.', 'No hay noticias en este canal por el momento.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {noticiasCanal.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setNoticiaAberta(n)}
                    className="text-left rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {n.imagem_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.imagem_url} alt="" className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ROXOTV}25, rgba(6,15,30,0.9))` }}>
                        <Newspaper size={26} style={{ color: ROXOTV }} />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs font-bold leading-snug mb-2 line-clamp-2" style={{ color: TITULO }}>{n.titulo[lang]}</p>
                      <div className="flex items-center justify-between text-[10px]" style={{ color: CINZA }}>
                        <span className="truncate">{n.fonte[lang]}</span>
                        <span className="shrink-0 ml-2">{formatarDataNoticia(n.data, lang, localeData)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* LETREIRO NOVO — exclusivo da TV, só notícias (demo), cor própria (roxo)
                separada do letreiro padrão do módulo acima (cor ciano) */}
            <div className="px-4 pb-4">
              <LetreiroExecutivo cor={ROXOTV} itens={MANCHETES_TICKER_NEXUS_DEMO.map((m) => m[lang])} />
            </div>
          </div>

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
                  <h3 className="text-base font-bold leading-snug" style={{ color: TITULO }}>{noticiaAberta.titulo[lang]}</h3>
                  <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setNoticiaAberta(null)} style={{ color: CINZA }} className="shrink-0">
                    <X size={20} />
                  </motion.button>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold mb-3" style={{ color: CINZA }}>
                  <span>{noticiaAberta.fonte[lang]}</span>
                  <span>•</span>
                  <span>{formatarDataNoticia(noticiaAberta.data, lang, localeData)}</span>
                  <span className="ml-auto text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={{ background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }}>
                    {L('DEMONSTRAÇÃO', 'DEMO', 'DEMOSTRACIÓN')}
                  </span>
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: TEXTO }}>{noticiaAberta.resumo[lang]}</p>
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
