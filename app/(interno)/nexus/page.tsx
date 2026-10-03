'use client'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Radio, Newspaper, X, ExternalLink, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert, Globe2, FlaskConical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactECharts from 'echarts-for-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { LetreiroAxioma } from '../../../components/LetreiroAxioma'
import { LetreiroExecutivo } from '../../../components/LetreiroExecutivo'
import { CentroCompartilhamento, BotaoCompartilhar } from '../../../components/CentroCompartilhamento'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterIndicadoresNexus, obterEventosNexus, obterEventoNexus, obterEconomiaMundial, type EconomiaMundial as TipoEconomiaMundial, traduzirFreshness, type IndicadorNexus, type PontoSerie, type EventoNexus } from '../../../lib/nexusHelpers'
import { textoEvento, travaDaVerdade, fonteDaSerie } from '../../../lib/nexusEventDetector'
import { ramoDoCnae } from '../../../lib/ia/setores'
import { carregarCnaeEmpresa } from '../../../lib/nexusSimulacaoHelpers'
import { variaveisDoEvento } from '../../../lib/nexusSimulacaoMotor'
import Link from 'next/link'
import { JosephAnalise } from './JosephAnalise'
import { CorrenteImpacto, CorrenteMini } from './CorrenteImpacto'
import { FuncoesNexus } from './FuncoesNexus'
import { JosephChat } from './JosephChat'
import { PainelExecutivo } from './PainelExecutivo'
import { DivisorNexus } from './DivisorNexus'
import { EconomiaMundial } from './EconomiaMundial'
import { SaudeFontes } from './SaudeFontes'
import { PlacarJose } from './PlacarJose'
import { CANAIS_NEXUS_DEMO, obterNoticiasNexusDemo, type NoticiaNexus } from '../../../lib/nexusNewsDemo'
import { exportarPdfNexus } from './pdfNexus'
import { tratarFalhaExportacao, tratarFalhaCarregamento } from '../../../lib/erroUiHelpers'
import { useThemeAxioma } from '../../../lib/ThemeContext'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import { TITULO_SECAO } from './fonteJose'
import { ThemeToggle } from '../../../components/ThemeToggle'

type Idioma3 = 'pt' | 'en' | 'es'


// Formato único de exibição — pra tela não precisar saber se a notícia veio
// do RSS real (já em português, string plana) ou do demo (Texto3 pt/en/es)
// — ambos viram isso antes de chegar no player/modal.
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
  const n = ind.valor.toLocaleString('pt-BR', { minimumFractionDigits: ind.casas, maximumFractionDigits: ind.casas })
  if (ind.formato === 'percentual') return `${n}%`
  return ind.formato === 'moeda' ? `R$ ${n}` : n
}

function formatarDataNoticia(iso: string, lang: Idioma3, localeData: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (dias <= 0) return lang === 'pt' ? 'Hoje' : lang === 'en' ? 'Today' : 'Hoy'
  if (dias === 1) return lang === 'pt' ? 'Ontem' : lang === 'en' ? 'Yesterday' : 'Ayer'
  return new Date(iso).toLocaleDateString(localeData)
}

// Sparkline minimalista (sem eixo/legenda) reaproveitando o ECharts já usado
// em DashFinanceiro/DashComercial — nada de lib nova.
function sparklineOption(historico: PontoSerie[], cor: string, temaClaro: boolean) {
  return {
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: historico.map((p) => p.data) },
    yAxis: { type: 'value', show: false, scale: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: temaClaro ? '#ffffff' : 'rgba(10,20,36,0.95)',
      borderColor: cor,
      textStyle: { color: temaClaro ? '#101b3d' : '#e2ecf7', fontSize: 10 },
      formatter: (p: any) => `${p[0].axisValueLabel}<br/>${Number(p[0].value).toLocaleString()}`,
    },
    series: [{
      type: 'line', data: historico.map((p) => p.valor), smooth: true, symbol: 'none',
      lineStyle: { color: cor, width: 2 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${cor}40` }, { offset: 1, color: `${cor}00` }] } },
    }],
  }
}

// Card compacto reaproveitado nos dois lugares que listam "mais notícias"
// (grade abaixo da TV e o modal da lista ampliada de Reforma Tributária) —
// mesmo visual, sem duplicar JSX.
// Mesma caixa dos cards de indicador (CARD_NEXUS) — as duas grades 2x4 da
// tela ficam com a mesma largura e altura.
const CARD_NEXUS = 'relative overflow-hidden rounded-2xl p-4 min-h-40 flex flex-col'
// Faixa verde do efeito premium3d (aparece no hover) — em TODO card do Nexus, nos 2 temas.
const BARRA_EFEITO = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />

// compacto = versão da lista ampliada (modal), sem a altura fixa da grade.
function CardMiniNoticia({ noticia, lang, localeData, onClick, temaClaro, compacto }: { noticia: NoticiaExibicao; lang: Idioma3; localeData: string; onClick: () => void; temaClaro: boolean; compacto?: boolean }) {
  const { CIANO, ROXOTV, CINZA, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  const caixa = compacto ? 'relative overflow-hidden rounded-2xl p-4 flex flex-col' : CARD_NEXUS
  return (
    <button
      onClick={onClick}
      className={`${caixa} text-left w-full transition-colors focus-visible:outline focus-visible:outline-2 axi-card-premium3d`}
      style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}
    >
      {BARRA_EFEITO}
      <p className="flex items-center gap-1.5 text-xs font-bold mb-2 min-w-0" style={{ color: CINZA }}>
        <Newspaper size={13} className="shrink-0" style={{ color: ROXOTV }} aria-hidden />
        <span className="truncate">{noticia.fonte}</span>
      </p>
      <h4 className="text-sm font-bold leading-snug line-clamp-3" style={{ color: TITULO }}>{noticia.titulo}</h4>
      <span className="text-[10px] mt-auto pt-2" style={{ color: CINZA }}>{formatarDataNoticia(noticia.data, lang, localeData)}</span>
    </button>
  )
}

// Natureza do evento — cor e nome fixos por tipo, pra Fato/Sinal/Decisão
// nunca se confundirem visualmente (regra do Push 03: "não misturar").
// No Claro o selo é preenchido (fundo sólido + texto escuro/branco) — o pill
// translúcido do Escuro some sobre o creme. Pares fundo/texto de
// tema-tokens.md: sucesso #16a97d/#fff, alerta #f5a623/#2b1900, bloco
// estrutural #101b3d/#fff (decisão oficial = institucional).
type Nome3 = [string, string, string]
type EstiloSelo = { cor: string; escuroTexto?: string; claroFundo: string; claroTexto: string; nome: Nome3 }
const NATUREZA_EVENTO: Record<string, EstiloSelo> = {
  fact: { cor: '#6ab0ff', escuroTexto: '#ffffff', claroFundo: '#16a97d', claroTexto: '#ffffff', nome: ['Fato', 'Fact', 'Hecho'] },
  signal: { cor: '#fbbf24', claroFundo: '#f5a623', claroTexto: '#2b1900', nome: ['Sinal de mercado', 'Market signal', 'Señal de mercado'] },
  official_decision: { cor: '#a78bfa', claroFundo: '#101b3d', claroTexto: '#ffffff', nome: ['Decisão oficial', 'Official decision', 'Decisión oficial'] },
}
const NATUREZA_DESCONHECIDA: EstiloSelo = { cor: '#5a7a9a', claroFundo: '#6b7280', claroTexto: '#ffffff', nome: ['Não classificado', 'Unclassified', 'No clasificado'] }

// Impacto no Claro fica contornado (não preenchido) pra não competir com o
// selo de natureza ao lado; tons escuros o bastante pra ler sobre o creme.
function impactoEvento(severity: number | null): EstiloSelo {
  const s = severity ?? 0
  if (s >= 70) return { cor: '#f87171', claroFundo: 'transparent', claroTexto: '#dc3545', nome: ['Impacto alto', 'High impact', 'Impacto alto'] }
  if (s >= 45) return { cor: '#fbbf24', claroFundo: 'transparent', claroTexto: '#b45309', nome: ['Impacto médio', 'Medium impact', 'Impacto medio'] }
  return { cor: '#34d399', claroFundo: 'transparent', claroTexto: '#374151', nome: ['Impacto baixo', 'Low impact', 'Impacto bajo'] }
}

function estiloSelo(s: EstiloSelo, temaClaro: boolean, alpha = '1f'): CSSProperties {
  // Escuro: azul sobre fundo azul não lê — Fato leva letra branca (pedido do Elias).
  if (!temaClaro) return { background: `${s.cor}${s.escuroTexto ? '40' : alpha}`, color: s.escuroTexto ?? s.cor }
  // Claro: todo selo (natureza e impacto) em azul-marinho com letra branca — padrão
  // do "Decisão oficial", sem marrom/âmbar sobre o bege (pedido do Elias, 2026-09-28).
  return { background: '#101b3d', color: '#ffffff' }
}

// Selo de atualidade do indicador: no Claro, preenchido com par de tema-tokens.
function estiloFreshness(status: string | null, corEscuro: string, temaClaro: boolean): CSSProperties {
  if (!temaClaro) return { background: `${corEscuro}20`, color: corEscuro }
  if (status === 'live' || status === 'fresh') return { background: '#2ecc9b', color: '#101b3d' }
  if (status === 'recent') return { background: '#f5a623', color: '#2b1900' }
  if (status) return { background: '#ff5a6b', color: '#2b0007' }
  return { background: 'rgba(16,27,61,0.08)', color: '#374151' } // aguardando 1ª coleta
}

const INTERVALO_TROCA_MS = 6000
const MAX_CARDS_INLINE = 8 // 2x4 embaixo da TV, igual à grade de indicadores (Reforma: resto no "Ver mais")

export default function NexusPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const { tema } = useThemeAxioma()
  const temaClaro = tema === 'xms'
  const { AZULC, CIANO, ROXOTV, CINZA, TEXTO, TITULO, PAINEL_BG, MODAL_BG, NESTED_BG, NESTED_BORDA } = PALETA[tema]
  const classePremium3d = ' axi-card-premium3d' // efeito nos 2 temas (pedido 2026-09-27)
  // Portal pro body mantendo o data-theme (fora da árvore do wrapper da página).
  const [montado, setMontado] = useState(false)
  useEffect(() => { setMontado(true) }, [])
  const naRaiz = (conteudo: ReactNode) => !montado ? null : createPortal(
    <div data-theme={tema} className="nexus-escala" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>{conteudo}</div>,
    document.body,
  )
  const hoverCard = ' axi-card-premium3d'
  // Selo "DEMONSTRAÇÃO" / avisos neutros — no Claro, navy sobre bege translúcido.
  const seloNeutro: CSSProperties = temaClaro
    ? { background: 'rgba(16,27,61,0.08)', color: '#101b3d', border: '1px solid rgba(16,27,61,0.15)' }
    : { background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }
  const avisoNeutro: CSSProperties = temaClaro
    ? { background: NESTED_BG, border: `1px solid ${NESTED_BORDA}`, color: '#101b3d' }
    : { background: `${ROXOTV}15`, border: `1px solid ${ROXOTV}35`, color: ROXOTV }
  const corTrava = (nivel: string) => ({
    // Claro: ícone colorido + texto azul-marinho (verde-menta em texto miúdo não lê no creme).
    icone: nivel === 'oficial' ? (temaClaro ? '#16a97d' : '#34d399') : (temaClaro ? '#b45309' : '#2ecc9b'),
    texto: temaClaro ? '#101b3d' : (nivel === 'oficial' ? '#34d399' : '#fbbf24'),
  })

  const [loading, setLoading] = useState(true)
  const [indicadores, setIndicadores] = useState<IndicadorNexus[]>([])
  const [mundo, setMundo] = useState<TipoEconomiaMundial | null>(null)
  const [avisoCarregamento, setAvisoCarregamento] = useState<string | null>(null)
  const [canalAtivo, setCanalAtivo] = useState(CANAIS_NEXUS_DEMO[0].id)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaExibicao | null>(null)
  const [listaAmpliadaAberta, setListaAmpliadaAberta] = useState(false)

  const [noticiasCanal, setNoticiasCanal] = useState<NoticiaExibicao[]>([])
  const [noticiasIsDemo, setNoticiasIsDemo] = useState(true)
  const [precisaAvisoDemo, setPrecisaAvisoDemo] = useState(false)
  const [carregandoNoticias, setCarregandoNoticias] = useState(true)
  // Esqueleto só na 1ª carga: ao trocar idioma/canal a TV mantém a lista atual
  // até a nova chegar — nada encolhe e cresce de novo (sem tremida na tela).
  const semNoticiaAinda = carregandoNoticias && noticiasCanal.length === 0
  const [indiceAtivo, setIndiceAtivo] = useState(0)

  const [eventos, setEventos] = useState<EventoNexus[]>([])
  const [paginaEventos, setPaginaEventos] = useState(0)
  const [temMaisEventos, setTemMaisEventos] = useState(false)
  const [carregandoEventos, setCarregandoEventos] = useState(true)
  const [erroEventos, setErroEventos] = useState(false)
  const [eventoAberto, setEventoAberto] = useState<EventoNexus | null>(null)
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      obterEconomiaMundial().then(setMundo).catch(() => setMundo(null))
      const { indicadores: dados, erro } = await obterIndicadoresNexus()
      setIndicadores(dados)
      if (erro) setAvisoCarregamento(tratarFalhaCarregamento('nexus.carregarIndicadores', new Error('falha ao ler nexus_economic_series'), lang))
      setLoading(false)
      // GANCHO FUTURO (JOSEPH, Etapa 4) — a leitura interpretada entra em
      // cima dos eventos já detectados (seção "Eventos detectados", abaixo).
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function carregarEventos(pagina: number) {
    setCarregandoEventos(true)
    const r = await obterEventosNexus(pagina)
    setErroEventos(r.erro)
    setEventos((atual) => (pagina === 0 ? r.eventos : [...atual, ...r.eventos]))
    setTemMaisEventos(r.temMais)
    setPaginaEventos(pagina)
    setCarregandoEventos(false)
  }
  useEffect(() => { carregarEventos(0) }, [])
  const [seriesDoRamo, setSeriesDoRamo] = useState<string[]>([])
  useEffect(() => { carregarCnaeEmpresa().then((c) => setSeriesDoRamo(ramoDoCnae(c)?.series ?? [])).catch(() => {}) }, [])

  // Coleta pela visita: se a última tem mais de 3h, o servidor coleta de novo
  // (sem IA) e a tela recarrega os números em silêncio quando termina.
  useEffect(() => {
    fetch('/api/nexus/atualizar', { method: 'POST' })
      .then((r) => (r.ok ? r.json() : null))
      .then(async (j: { atualizou?: boolean } | null) => {
        if (!j?.atualizou) return
        obterEconomiaMundial().then(setMundo).catch(() => {})
        const { indicadores: dados, erro } = await obterIndicadoresNexus()
        if (!erro) setIndicadores(dados)
        carregarEventos(0)
      })
      .catch(() => {})
  }, [])

  // Vindo do card flutuante (Radar Global): /nexus?evento=<id> abre direto no modal.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('evento')
    if (!id) return
    obterEventoNexus(id).then((ev) => { if (ev) setEventoAberto(ev) })
  }, [])

  // Esc fecha qualquer modal aberto da tela (evento, notícia, lista ampliada).
  useEffect(() => {
    if (!eventoAberto && !noticiaAberta && !listaAmpliadaAberta) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setEventoAberto(null); setNoticiaAberta(null); setListaAmpliadaAberta(false)
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [eventoAberto, noticiaAberta, listaAmpliadaAberta])

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
      const ok = await exportarPdfNexus({ lang, indicadores, mundo, eventos, seriesDoRamo, formatarIndicador: formatarValorIndicador, rotuloImpacto: (s) => L(...impactoEvento(s).nome) })
      if (!ok) throw new Error('falha ao montar o PDF do Nexus')
    } catch (err) {
      setAvisoCarregamento(tratarFalhaExportacao('nexus.exportarPDF', err, lang))
    }
    setExportando(false)
  }

  return (
    <div data-theme={tema} className="nexus-escala" style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
    <ModuloLayout
      titulo={L('Nexus', 'Nexus', 'Nexus')}
      subtitulo={L('Inteligência econômica que atravessa toda a empresa — câmbio, juros e o cenário que move suas decisões.', "Economic intelligence that cuts across your whole company — FX, rates, and the backdrop shaping your decisions.", 'Inteligencia económica que atraviesa toda la empresa — cambio, tasas y el escenario que mueve sus decisiones.')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      headerFundo={temaClaro ? 'linear-gradient(180deg, #0a1628 0%, #101b3d 55%, #17406e 100%)' : undefined}
      corExportar={temaClaro ? 'linear-gradient(135deg, #16a97d, #2ecc9b)' : undefined}
      botaoExtra={
        <>
          <BotaoCompartilhar onClick={() => setShareAberto(true)} texto={L('Compartilhar', 'Share', 'Compartir')} cor={CIANO} corTexto={CIANO} solido={temaClaro} />
          <Link href="/nexus/simulacoes" className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold"
            style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}26`, border: `1px solid ${CIANO}66`, color: CIANO }}>
            <FlaskConical size={16} aria-hidden />{L('Minhas Simulações', 'My Simulations', 'Mis Simulaciones')}
          </Link>
          <ThemeToggle />
        </>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : (
        <div className="space-y-6">

          {/* LETREIRO PADRÃO DO MÓDULO — mesmo componente/lugar dos demais módulos, com dado real deste módulo (os indicadores) */}
          <LetreiroAxioma id="nexus" cor={CIANO} solido={temaClaro} corDestaque="#2ecc9b" itens={indicadores.map((ind) => `${ind.nome[lang]}: ${formatarValorIndicador(ind)}`)} />

          {avisoCarregamento && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={temaClaro ? avisoNeutro : { background: `${CIANO}15`, border: `1px solid ${CIANO}35`, color: CIANO }}>
              {avisoCarregamento}
            </div>
          )}

          {/* 12 INDICADORES — dado real de nexus_economic_series, com mini-histórico (grade 3x4, mesma caixa dos cards de notícia) */}
          <div className="px-1">
            <h2 className={TITULO_SECAO} style={{ color: TITULO }}>🇧🇷 {L('Indicadores do Brasil', 'Brazil indicators', 'Indicadores de Brasil')}</h2>
            <p className="text-xs mt-0.5" style={{ color: TEXTO }}>{L('Câmbio, juros, inflação, emprego e atividade — dados oficiais do Banco Central, do IBGE e do Banco Central Europeu, atualizados todo dia.', 'Exchange rates, interest, inflation, jobs and activity — official data from the Central Bank, IBGE and the European Central Bank, updated daily.', 'Cambio, tasas, inflación, empleo y actividad — datos oficiales del Banco Central, del IBGE y del Banco Central Europeo, actualizados a diario.')}</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {indicadores.map((ind) => {
              const fresh = traduzirFreshness(ind.freshness, lang)
              return (
                <div key={ind.codigo} className={`${CARD_NEXUS}${classePremium3d}`} style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
                  {BARRA_EFEITO}
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: CINZA }}>{ind.emoji} {ind.nome[lang]}</p>
                  </div>
                  <p className="text-2xl font-black leading-none mb-2" style={{ color: TITULO }}>{formatarValorIndicador(ind)}</p>
                  {ind.historico.length >= 2 && (
                    <div className="mb-2" style={{ height: 40 }}>
                      <ReactECharts option={sparklineOption(ind.historico, CIANO, temaClaro)} style={{ height: 40, width: '100%' }} notMerge lazyUpdate opts={{ renderer: 'svg' }} />
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px]" style={{ color: CINZA }}>
                      {ind.dataReferencia ? new Date(ind.dataReferencia + 'T00:00:00').toLocaleDateString(localeData) : '—'}
                      {ind.fonteReserva && <span title={L('O Banco Central do Brasil atrasou; valor do Banco Central Europeu (fonte reserva).', 'The Central Bank of Brazil is late; value from the European Central Bank (backup source).', 'El Banco Central de Brasil se atrasó; valor del Banco Central Europeo (fuente de respaldo).')}> · {L('reserva BCE', 'ECB backup', 'respaldo BCE')}</span>}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={estiloFreshness(ind.freshness, fresh.cor, temaClaro)}>
                      {fresh.texto}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <DivisorNexus />

          {/* ECONOMIA MUNDIAL — petróleo (IPEA) e PIB/inflação dos parceiros (Banco Mundial) */}
          <EconomiaMundial lang={lang} temaClaro={temaClaro} dados={mundo} />

          <DivisorNexus />

          {/* PAINEL EXECUTIVO DO JOSÉ — Etapa 7: síntese diária logo abaixo dos indicadores. */}
          <PainelExecutivo lang={lang} temaClaro={temaClaro} />

          <DivisorNexus />

          {/* PLACAR DO JOSÉ — Etapa 9: previsto × realizado, conferido com dado oficial. */}
          <PlacarJose lang={lang} temaClaro={temaClaro} />

          <DivisorNexus />

          {/* EVENTOS DETECTADOS — Etapa 3: o que mudou de verdade nas séries
              oficiais, com natureza (fato/sinal/decisão) e Trava da Verdade. */}
          {/* Sem caixa em volta: os cards ficam soltos na mesma grade 2x4 dos
              indicadores e das notícias — mesma largura e altura (CARD_NEXUS). */}
          <section>
            <div className="mb-3 px-1">
              <h2 className={TITULO_SECAO} style={{ color: TITULO }}>
                <Globe2 size={17} style={{ color: temaClaro ? '#16a97d' : CIANO }} aria-hidden />
                José · {L('Radar Global Axioma', 'Axioma Global Radar', 'Radar Global Axioma')}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>
                {L('A inteligência mundial do seu CFO — mudanças relevantes nos indicadores oficiais, percebidas automaticamente. Clique num evento para ver a leitura do José.', "Your CFO's global intelligence — relevant changes in official indicators, picked up automatically. Click an event to see José's reading.", 'La inteligencia mundial de su CFO — cambios relevantes en los indicadores oficiales, detectados automáticamente. Haga clic en un evento para ver la lectura de José.')}
              </p>
            </div>

            {erroEventos && eventos.length === 0 ? (
              <p className="text-sm" style={{ color: TEXTO }}>{L('Não foi possível carregar os eventos agora. Recarregue a página em instantes.', 'Could not load events right now. Reload the page in a moment.', 'No fue posible cargar los eventos ahora. Recargue la página en unos instantes.')}</p>
            ) : !carregandoEventos && eventos.length === 0 ? (
              <p className="text-sm" style={{ color: TEXTO }}>{L('Nenhuma mudança relevante nos indicadores oficiais por enquanto. O José verifica todos os dias e avisa aqui quando algo se mover.', 'No relevant changes in official indicators yet. José checks every day and will flag it here when something moves.', 'Ningún cambio relevante en los indicadores oficiales por ahora. José revisa todos los días y avisará aquí cuando algo se mueva.')}</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {eventos.map((ev) => {
                  const nat = NATUREZA_EVENTO[ev.natureza] ?? NATUREZA_DESCONHECIDA
                  const imp = impactoEvento(ev.severity)
                  const trava = travaDaVerdade(ev.evidenceLevel, lang)
                  const texto = ev.payload ? textoEvento(ev.payload, lang) : { titulo: ev.tituloPt, descricao: ev.descricaoPt ?? '' }
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setEventoAberto(ev)}
                      className={`${CARD_NEXUS} text-left w-full transition-colors focus-visible:outline focus-visible:outline-2${hoverCard}`}
                      style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30`, borderTop: temaClaro ? '2px solid #16a97d' : `3px solid ${nat.cor}` }}
                    >
                      {BARRA_EFEITO}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={estiloSelo(nat, temaClaro)}>{L(...nat.nome)}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={estiloSelo(imp, temaClaro, '1a')}>{L(...imp.nome)}</span>
                        {ev.payload && seriesDoRamo.includes(ev.payload.serie) && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={temaClaro ? { background: '#101b3d', color: '#ffffff' } : { background: `${CIANO}22`, color: TEXTO, border: `1px solid ${CIANO}55` }}>{L('Mexe com o seu ramo', 'Affects your industry', 'Afecta a su sector')}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold leading-snug line-clamp-3" style={{ color: TITULO }}>{texto.titulo}</h4>
                      {ev.payload && <CorrenteMini payload={ev.payload} lang={lang} temaClaro={temaClaro} />}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-2">
                        <span className="flex items-center gap-1 text-[10px] font-semibold min-w-0" style={{ color: corTrava(trava.nivel).texto }}>
                          {trava.nivel === 'oficial' ? <ShieldCheck size={12} className="shrink-0" style={{ color: corTrava(trava.nivel).icone }} aria-hidden /> : <ShieldAlert size={12} className="shrink-0" style={{ color: corTrava(trava.nivel).icone }} aria-hidden />}
                          <span className="truncate">{trava.texto}</span>
                        </span>
                        {ev.publicadoEm && (
                          <span className="text-[10px] shrink-0" style={{ color: CINZA }}>{new Date(ev.publicadoEm).toLocaleDateString(localeData, { timeZone: 'UTC' })}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {temMaisEventos && (
              <button
                onClick={() => carregarEventos(paginaEventos + 1)}
                disabled={carregandoEventos}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg focus-visible:outline focus-visible:outline-2 axi-card-premium3d axi-card-faixa"
                style={{ ...(temaClaro ? VERDE_SOLIDO : { color: CIANO, background: `${CIANO}14`, border: `1px solid ${CIANO}40` }), opacity: carregandoEventos ? 0.6 : 1 }}
              >
                {carregandoEventos ? L('Carregando...', 'Loading...', 'Cargando...') : L('Ver eventos anteriores', 'Show earlier events', 'Ver eventos anteriores')}
              </button>
            )}
          </section>

          <DivisorNexus />

          {/* CHAT DO JOSÉ — logo acima da TV, à vista (pedido do Elias). */}
          <JosephChat lang={lang} temaClaro={temaClaro} indicadores={indicadores} eventos={eventos} mundo={mundo} />

          <DivisorNexus />

          {/* TV — player grande de notícia em destaque, com canais */}
          {/* No Claro a moldura da TV vira card creme; a "tela" (player) segue
              escura de propósito — é vídeo/foto com tarja de telejornal. */}
          <div className={`relative max-w-3xl mx-auto rounded-2xl overflow-hidden${classePremium3d}`} style={{ background: temaClaro ? PAINEL_BG : 'rgba(6,15,30,0.85)', border: `1px solid ${CIANO}35`, boxShadow: temaClaro ? undefined : `0 0 40px ${CIANO}10` }}>
            {BARRA_EFEITO}
            <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Radio size={16} style={{ color: CIANO }} />
                <h2 className={TITULO_SECAO} style={{ color: TITULO }}>{L('Central Nexus', 'Nexus Center', 'Central Nexus')}</h2>
              </div>
              {/* só depois de carregar — senão o selo pisca em toda abertura, mesmo com notícia real */}
              {noticiasIsDemo && !semNoticiaAinda && (
                <span className="text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={seloNeutro}>
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
                  style={temaClaro ? {
                    // Claro: ativo = verde-menta sólido (regra 2), inativo = neutro navy.
                    background: canalAtivo === c.id ? '#2ecc9b' : 'rgba(16,27,61,0.06)',
                    color: canalAtivo === c.id ? '#101b3d' : '#374151',
                    border: canalAtivo === c.id ? '1px solid #2ecc9b' : '1px solid rgba(16,27,61,0.12)',
                  } : {
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
              <div className="mx-4 mb-3 rounded-xl px-4 py-2.5 text-xs font-semibold" style={avisoNeutro}>
                {L('Notícia em tempo real ainda não disponível — mostrando conteúdo de demonstração.', 'Real-time news not available yet — showing demo content.', 'Noticia en tiempo real aún no disponible — mostrando contenido de demostración.')}
              </div>
            )}

            {/* PLAYER — 16:9, uma manchete em destaque por vez */}
            <div className="px-4">
              {semNoticiaAinda ? (
                <div className="w-full aspect-video rounded-xl animate-pulse" style={{ background: temaClaro ? 'rgba(16,27,61,0.08)' : 'rgba(255,255,255,0.05)' }} />
              ) : !noticiaAtual ? (
                <div className="w-full aspect-video rounded-xl flex items-center justify-center text-xs font-semibold" style={avisoNeutro}>
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
              <LetreiroExecutivo cor={temaClaro ? '#101b3d' : ROXOTV} solido={temaClaro} corDestaque="#2ecc9b" textoBase={temaClaro ? '#ffffff' : undefined} itens={noticiasCanal.map((n) => n.titulo)} />
            </div>
          </div>

          {/* CARDS ABAIXO DA TV — demais manchetes do canal ativo (além da que
              está no player), pro módulo não ficar vazio embaixo. Mesmo modal
              da TV ao clicar; mesmo padrão visual (cartão escuro/ciano). No
              canal reforma-tributaria a lista inline para em MAX_CARDS_INLINE
              — o resto mora no botão "Ver mais"
              abaixo, que abre a lista ampliada dentro do próprio Axioma. */}
          {!semNoticiaAinda && noticiasCanal.length > 1 && (() => {
            const outras = noticiasCanal.filter((_, i) => i !== indiceAtivo)
            const cardsInline = outras.slice(0, MAX_CARDS_INLINE)
            return (
              <div className="space-y-3">
                <h2 className={`${TITULO_SECAO} px-1`} style={{ color: TITULO }}>
                  📰 {L('Mais notícias deste canal', 'More headlines in this channel', 'Más noticias de este canal')}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {cardsInline.map((n) => (
                    <CardMiniNoticia key={n.id} noticia={n} lang={lang} localeData={localeData} temaClaro={temaClaro} onClick={() => setNoticiaAberta(n)} />
                  ))}
                </div>
              </div>
            )
          })()}

          {/* BOTÃO "VER MAIS / REFORMA TRIBUTÁRIA" — abre lista ampliada
              DENTRO do Axioma (nunca linka direto pra página que exige
              login, ex: gov.br/fazenda). Independente do gate acima: precisa
              aparecer mesmo com 0/1 notícia, pra sempre existir um jeito de
              tentar de novo e ver o estado vazio traduzido. */}
          {!semNoticiaAinda && canalAtivo === 'reforma-tributaria' && (
            <div className="max-w-3xl mx-auto">
              <button
                onClick={() => setListaAmpliadaAberta(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01]"
                style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}15`, border: `1px solid ${CIANO}35`, color: CIANO }}
              >
                <Newspaper size={13} />
                {L('Ver mais / Reforma Tributária', 'See more / Tax Reform', 'Ver más / Reforma Tributaria')}
              </button>
            </div>
          )}

          <DivisorNexus />

          {/* O QUE O NEXUS FAZ POR VOCÊ — vitrine das funções que moram atrás de um
              clique; sem ela ninguém descobre o José, o E se...? e o Radar. */}
          <FuncoesNexus lang={lang} temaClaro={temaClaro} eventoRecente={eventos[0] ?? null} onAbrirEvento={setEventoAberto} />

          <DivisorNexus />

          {/* SAÚDE DAS FONTES — se a coleta diária de cada fonte oficial deu certo. */}
          <SaudeFontes lang={lang} temaClaro={temaClaro} />

        </div>
      )}

      {/* MODAL DO EVENTO — fato confirmado em cima, leitura do José embaixo
          (Etapa 4: interpretação, cenários, o que fazer — ./JosephAnalise.tsx). */}
      {/* Modais renderizados na raiz (portal): dentro do ModuloLayout eles ficam presos
          no contexto de camadas da animação de entrada e o menu fixo do topo passa por cima. */}
      {naRaiz(<>
      <AnimatePresence>
        {eventoAberto && (() => {
          const ev = eventoAberto
          const nat = NATUREZA_EVENTO[ev.natureza] ?? NATUREZA_DESCONHECIDA
          const imp = impactoEvento(ev.severity)
          const trava = travaDaVerdade(ev.evidenceLevel, lang)
          const texto = ev.payload ? textoEvento(ev.payload, lang) : { titulo: ev.tituloPt, descricao: ev.descricaoPt ?? '' }
          return (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 flex items-center justify-center z-[70] p-4"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
              onClick={() => setEventoAberto(null)}
            >
              <motion.div
                role="dialog" aria-modal="true" aria-labelledby="nexus-evento-titulo"
                initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-2xl rounded-2xl p-5 h-[85vh] overflow-y-auto"
                style={{ background: MODAL_BG, border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : `${nat.cor}50`}`, borderTop: temaClaro ? '2px solid #16a97d' : `3px solid ${nat.cor}` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={estiloSelo(nat, temaClaro)}>{L(...nat.nome)}</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={estiloSelo(imp, temaClaro, '1a')}>{L(...imp.nome)}</span>
                  </div>
                  <button onClick={() => setEventoAberto(null)} aria-label={L('Fechar', 'Close', 'Cerrar')} className={`p-1 rounded-lg shrink-0 ${temaClaro ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}>
                    <X size={18} style={{ color: CINZA }} />
                  </button>
                </div>
                <h3 id="nexus-evento-titulo" className="text-lg font-black leading-snug mb-2" style={{ color: TITULO }}>{texto.titulo}</h3>
                {texto.descricao && <p className="text-sm leading-relaxed mb-4" style={{ color: TEXTO }}>{texto.descricao}</p>}
                <div className="rounded-xl p-3 space-y-1.5" style={{ background: NESTED_BG, border: `1px solid ${NESTED_BORDA}` }}>
                  <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: corTrava(trava.nivel).texto }}>
                    {trava.nivel === 'oficial' ? <ShieldCheck size={14} style={{ color: corTrava(trava.nivel).icone }} aria-hidden /> : <ShieldAlert size={14} style={{ color: corTrava(trava.nivel).icone }} aria-hidden />}
                    {trava.texto}
                  </p>
                  {ev.confidence != null && (
                    <p className="text-xs" style={{ color: TEXTO }}>{L('Confiabilidade do dado', 'Data reliability', 'Fiabilidad del dato')}: {Math.round(ev.confidence)}/100{trava.nivel === 'oficial' && ` — ${L('série oficial', 'official series', 'serie oficial')}: ${fonteDaSerie(ev.payload?.serie ?? '', lang)}${ev.payload?.confirmacao ? '' : ` ${L('(uma fonte)', '(single source)', '(una fuente)')}`}.`}</p>
                  )}
                  {ev.payload?.confirmacao && (
                    <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: corTrava('oficial').texto }}>
                      <ShieldCheck size={14} style={{ color: corTrava('oficial').icone }} aria-hidden />
                      {L('Confirmado também pelo Banco Central Europeu', 'Also confirmed by the European Central Bank', 'Confirmado también por el Banco Central Europeo')}: {ev.payload.confirmacao.variacao.toLocaleString(localeData, { maximumFractionDigits: 1 })}% {L('no mesmo período', 'in the same period', 'en el mismo período')}
                    </p>
                  )}
                  {ev.publicadoEm && (
                    <p className="text-xs" style={{ color: TEXTO }}>{L('Data de referência', 'Reference date', 'Fecha de referencia')}: {new Date(ev.publicadoEm).toLocaleDateString(localeData, { timeZone: 'UTC' })}</p>
                  )}
                </div>
                {ev.payload && <CorrenteImpacto payload={ev.payload} lang={lang} temaClaro={temaClaro} fundo={NESTED_BG} borda={NESTED_BORDA} />}
                {ev.payload && variaveisDoEvento(ev.payload.serie, ev.payload.variacao) && (
                  <Link
                    href={`/nexus/simulacoes?serie=${encodeURIComponent(ev.payload.serie)}&variacao=${ev.payload.variacao}&titulo=${encodeURIComponent(texto.titulo)}`}
                    className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold"
                    style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}18`, border: `1px solid ${CIANO}50`, color: CIANO }}
                  >
                    <FlaskConical size={15} aria-hidden />{L('Simular este evento na minha empresa', 'Simulate this event on my company', 'Simular este evento en mi empresa')}
                  </Link>
                )}
                <JosephAnalise eventId={ev.id} lang={lang} temaClaro={temaClaro} />
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>

      {/* MODAL DA NOTÍCIA — mesmo padrão de overlay do Centro de Compartilhamento */}
      <AnimatePresence>
        {noticiaAberta && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[70] p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setNoticiaAberta(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: MODAL_BG, border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : `${ROXOTV}40`}` }}
              onClick={(e) => e.stopPropagation()}
            >
              {noticiaAberta.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={noticiaAberta.imagem_url} alt="" className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-32 flex items-center justify-center" style={{ background: temaClaro ? 'linear-gradient(135deg, #101b3d, #17406e)' : `linear-gradient(135deg, ${ROXOTV}30, rgba(6,15,30,0.95))` }}>
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
                    <span className="ml-auto text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full" style={seloNeutro}>
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
                  style={temaClaro ? VERDE_SOLIDO : { background: `${ROXOTV}18`, border: `1px solid ${ROXOTV}55`, color: ROXOTV }}
                >
                  <ExternalLink size={15} />
                  {L('Ler matéria completa', 'Read full article', 'Leer la noticia completa')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LISTA AMPLIADA — Reforma Tributária. Sempre dentro do Axioma: cada
          card abre o mesmo modal de notícia acima, cujo "Ler matéria
          completa" aponta pra fonte aberta (Agência Senado/Brasil), nunca
          uma página que exija login. Link de "fonte oficial" no rodapé usa
          a página pública de destaques do Senado — não o gov.br/fazenda,
          que pede login. */}
      <AnimatePresence>
        {listaAmpliadaAberta && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-[70] p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setListaAmpliadaAberta(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-lg rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
              style={{ background: MODAL_BG, border: `1px solid ${temaClaro ? 'rgba(16,27,61,0.12)' : `${CIANO}40`}` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start gap-3 p-5 pb-3 shrink-0">
                <h3 className="text-base font-bold leading-snug" style={{ color: TITULO }}>
                  {L('Reforma Tributária — todas as notícias', 'Tax Reform — all headlines', 'Reforma Tributaria — todas las noticias')}
                </h3>
                <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setListaAmpliadaAberta(false)} style={{ color: CINZA }} className="shrink-0">
                  <X size={20} />
                </motion.button>
              </div>

              <div className="px-5 pb-5 overflow-y-auto">
                {noticiasCanal.length === 0 ? (
                  <p className="text-sm text-center py-10" style={{ color: CINZA }}>
                    {L('Sem novas notícias de Reforma Tributária agora — volte em breve.', 'No new Tax Reform headlines right now — check back soon.', 'Sin noticias nuevas de Reforma Tributaria por ahora — vuelva pronto.')}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {noticiasCanal.map((n) => (
                      <CardMiniNoticia
                        key={n.id}
                        noticia={n}
                        lang={lang}
                        localeData={localeData}
                        temaClaro={temaClaro}
                        compacto
                        onClick={() => { setListaAmpliadaAberta(false); setNoticiaAberta(n) }}
                      />
                    ))}
                  </div>
                )}

                <a
                  href="https://www12.senado.leg.br/noticias/destaques/reforma-tributaria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-[1.01]"
                  style={temaClaro ? VERDE_SOLIDO : { background: `${ROXOTV}15`, border: `1px solid ${ROXOTV}35`, color: ROXOTV }}
                >
                  <ExternalLink size={13} />
                  {L('Página oficial do Senado sobre a Reforma Tributária', "Senate's official Tax Reform page", 'Página oficial del Senado sobre la Reforma Tributaria')}
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </>)}

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
    </div>
  )
}
