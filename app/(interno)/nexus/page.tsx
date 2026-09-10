'use client'
import { useEffect, useState } from 'react'
import { Radio } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { LetreiroAxioma } from '../../../components/LetreiroAxioma'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { CentroCompartilhamento, BotaoCompartilhar } from '../../../components/CentroCompartilhamento'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterIndicadoresNexus, traduzirFreshness, type IndicadorNexus } from '../../../lib/nexusHelpers'
import { CANAIS_NEXUS_DEMO, MANCHETES_TICKER_NEXUS_DEMO } from '../../../lib/nexusNewsDemo'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { tratarFalhaExportacao, tratarFalhaCarregamento } from '../../../lib/erroUiHelpers'
import { fBRL2 } from '../../../lib/cfoCore'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const CIANO = '#22d3ee'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

function formatarValorIndicador(ind: IndicadorNexus): string {
  if (ind.valor == null) return '—'
  return ind.formatoPercentual ? `${ind.valor.toFixed(2)}%` : `R$ ${fBRL2(ind.valor)}`
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

  const canal = CANAIS_NEXUS_DEMO.find((c) => c.id === canalAtivo) || CANAIS_NEXUS_DEMO[0]

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

          {/* 4 INDICADORES — dado real de nexus_economic_series */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {indicadores.map((ind) => {
              const fresh = traduzirFreshness(ind.freshness, lang)
              return (
                <div key={ind.codigo} className="rounded-2xl p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${CIANO}30` }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: CINZA }}>{ind.emoji} {ind.nome[lang]}</p>
                  </div>
                  <p className="text-2xl font-black leading-none mb-2" style={{ color: TITULO }}>{formatarValorIndicador(ind)}</p>
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

            <div className="p-4 space-y-2">
              {canal.manchetes.map((m, i) => (
                <div key={i} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs" style={{ color: TEXTO }}>{m.titulo[lang]}</p>
                </div>
              ))}
            </div>

            {/* LETREIRO NOVO — exclusivo da TV, só notícias (demo), separado do letreiro padrão do módulo acima */}
            <div className="px-4 pb-4">
              <LetreiroExecutivo cor={CIANO} itens={MANCHETES_TICKER_NEXUS_DEMO.map((m) => m.titulo[lang])} />
            </div>
          </div>

        </div>
      )}

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
