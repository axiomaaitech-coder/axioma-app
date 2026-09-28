'use client'
// ═══════════════════════════════════════════════════════════════
// Painel executivo do José (Etapa 7) — síntese diária em 12 cards (3×4),
// logo abaixo dos indicadores. Busca /api/nexus/briefing (1 por dia/idioma,
// guardado pra todos). Horizontes longos mostram a confiança baixa declarada.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { JosephAvatar } from '../../../components/JosephAvatar'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import type { BriefingJose } from '../../../lib/nexusBriefing'
import { cinzel } from './fonteJose'

type Lang = 'pt' | 'en' | 'es'
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />

type Cores = { titulo: string; texto: string; cinza: string; fundo: string; fundoSolido: string; borda: string; acento: string; claro: boolean; lang: Lang }

function Card({ emoji, rotulo, cores, children }: { emoji: string; rotulo: string; cores: Cores; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const L = (pt: string, en: string, es: string) => (cores.lang === 'en' ? en : cores.lang === 'es' ? es : pt)
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col axi-card-premium3d" style={{ background: cores.fundo, border: `1px solid ${cores.borda}` }}>
      {BARRA}
      <p className="text-[11px] font-bold mb-1.5" style={{ color: cores.cinza }}>{emoji} {rotulo}</p>
      {/* Recolhido: mesma altura dos outros cards do Nexus, com esmaecido no fim do texto. */}
      <div className="relative" style={aberto ? undefined : { maxHeight: 118, overflow: 'hidden' }}>
        {children}
        {!aberto && <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent, ${cores.fundoSolido})` }} aria-hidden />}
      </div>
      <button onClick={() => setAberto((v) => !v)} aria-expanded={aberto}
        className="self-end mt-2 flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md"
        style={{ color: cores.acento, border: `1px solid ${cores.acento}55` }}>
        {aberto ? <>{L('Recolher', 'Collapse', 'Contraer')}<ChevronUp size={12} aria-hidden /></> : <>{L('Ler mais', 'Read more', 'Leer más')}<ChevronDown size={12} aria-hidden /></>}
      </button>
    </div>
  )
}

const corGravidade = (g: string, claro: boolean) =>
  g === 'alta' ? (claro ? '#dc3545' : '#f87171') : g === 'media' ? (claro ? '#b45309' : '#fbbf24') : (claro ? '#16a97d' : '#34d399')

function Lista({ itens, cores }: { itens: { titulo: string; texto: string; gravidade: string }[]; cores: Cores }) {
  return (
    <ul className="space-y-2">
      {itens.map((it, i) => (
        <li key={i}>
          <p className="flex items-center gap-1.5 text-xs font-bold leading-snug" style={{ color: cores.titulo }}>
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: corGravidade(it.gravidade, cores.claro) }} aria-hidden />{it.titulo}
          </p>
          <p className="text-[11px] leading-relaxed mt-0.5" style={{ color: cores.texto }}>{it.texto}</p>
        </li>
      ))}
    </ul>
  )
}

export function PainelExecutivo({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  // fundoSolido: cor opaca do card pro esmaecido do texto recolhido (PAINEL_BG do Escuro é translúcido).
  const cores: Cores = { titulo: TITULO, texto: TEXTO, cinza: CINZA, fundo: PAINEL_BG, fundoSolido: temaClaro ? '#f6f7c4' : '#0b1626', borda: `${CIANO}30`, acento: temaClaro ? '#16a97d' : CIANO, claro: temaClaro, lang }
  const [painel, setPainel] = useState<{ data: string; conteudo: BriefingJose } | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    // Volta pro estado de carregando a cada nova tentativa/idioma antes de buscar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEstado('carregando')
    fetch('/api/nexus/briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang }) })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (cancelado) return
        if (res.ok && json?.painel) { setPainel(json.painel); setEstado('ok') } else setEstado('erro')
      })
      .catch(() => { if (!cancelado) setEstado('erro') })
    return () => { cancelado = true }
  }, [lang, tentativa])

  const hoje = new Date().toISOString().slice(0, 10)
  const dataFmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')
  const chipConfianca = (c: number): CSSProperties => {
    const cor = c >= 60 ? (temaClaro ? '#16a97d' : '#34d399') : c >= 40 ? (temaClaro ? '#b45309' : '#fbbf24') : (temaClaro ? '#374151' : '#8aa4c2')
    return temaClaro ? { background: cor, color: '#fff', border: `1px solid ${cor}` } : { color: cor, border: `1px solid ${cor}80` }
  }

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2 mb-3 px-1">
        <div>
          <h2 className={`${cinzel.className} flex items-center gap-2 text-lg md:text-xl font-bold tracking-wide`} style={{ color: TITULO }}>
            <JosephAvatar tamanho={26} estado={estado === 'carregando' ? 'pensando' : 'parado'} />
            {L('Painel executivo do José', "José's executive briefing", 'Panel ejecutivo de José')}
          </h2>
          <p className="text-xs mt-0.5" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>
            {L('Tudo o que mudou e o que fazer, resumido pelo José uma vez por dia a partir dos dados oficiais e das notícias coletadas.', 'Everything that changed and what to do, summarized by José once a day from official data and collected news.', 'Todo lo que cambió y qué hacer, resumido por José una vez al día a partir de datos oficiales y noticias recogidas.')}
          </p>
        </div>
        {painel && (
          <p className="text-[11px]" style={{ color: CINZA }}>
            {painel.data === hoje ? L('Atualizado hoje', 'Updated today', 'Actualizado hoy') : `${L('Painel de', 'Briefing from', 'Panel del')} ${dataFmt(painel.data)}`} · {L('confiança geral', 'overall confidence', 'confianza general')} {Math.round(painel.conteudo.confianca_geral)}/100
          </p>
        )}
      </div>

      {/* Troca de idioma: mantém o painel anterior na tela até o novo chegar (sem
          encolher/crescer a página = sem tremida); o aviso só aparece na 1ª carga. */}
      {estado === 'carregando' && !painel && (
        <div className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
          {BARRA}
          <JosephAvatar tamanho={56} estado="pensando" />
          <div>
            <p className="text-sm font-bold" style={{ color: TITULO }}>{L('José preparando o painel de hoje…', "José preparing today's briefing…", 'José preparando el panel de hoy…')}</p>
            <p className="text-xs mt-1" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>{L('Lendo indicadores, eventos e manchetes. Na primeira vez do dia leva até 1 minuto — depois fica pronto para todos.', 'Reading indicators, events and headlines. The first time each day takes up to a minute — then it is ready for everyone.', 'Leyendo indicadores, eventos y titulares. La primera vez del día tarda hasta un minuto — luego queda listo para todos.')}</p>
          </div>
        </div>
      )}

      {estado === 'erro' && (
        <div className="relative overflow-hidden rounded-2xl p-5 flex flex-wrap items-center gap-3 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
          {BARRA}
          <p className="text-sm" style={{ color: TEXTO }}>{L('Não foi possível montar o painel agora.', 'Could not build the briefing right now.', 'No fue posible armar el panel ahora.')}</p>
          <button onClick={() => setTentativa((t) => t + 1)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={temaClaro ? VERDE_SOLIDO : { background: `${CIANO}18`, border: `1px solid ${CIANO}50`, color: CIANO }}>
            <RotateCcw size={12} aria-hidden />{L('Tentar de novo', 'Try again', 'Intentar de nuevo')}
          </button>
        </div>
      )}

      {estado !== 'erro' && painel && (() => {
        const c = painel.conteudo
        const bloco = (b: { titulo: string; texto: string }) => (
          <>
            <p className="text-sm font-bold leading-snug mb-1" style={{ color: TITULO }}>{b.titulo}</p>
            <p className="text-xs leading-relaxed" style={{ color: TEXTO }}>{b.texto}</p>
          </>
        )
        const horizonte = (h: BriefingJose['horizonte_12m']) => (
          <>
            <span className="self-start text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1.5" style={chipConfianca(h.confianca)}>
              {L('confiança', 'confidence', 'confianza')} {Math.round(h.confianca)}/100
            </span>
            {bloco(h)}
          </>
        )
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start transition-opacity duration-300" style={{ opacity: estado === 'carregando' ? 0.55 : 1 }}>
            <Card emoji="🌎" rotulo={L('O Mundo', 'The World', 'El Mundo')} cores={cores}>{bloco(c.mundo)}</Card>
            <Card emoji="🇧🇷" rotulo={L('Brasil', 'Brazil', 'Brasil')} cores={cores}>{bloco(c.brasil)}</Card>
            <Card emoji="🚨" rotulo={L('Alertas', 'Alerts', 'Alertas')} cores={cores}><Lista itens={c.alertas} cores={cores} /></Card>
            <Card emoji="⚠️" rotulo={L('Riscos', 'Risks', 'Riesgos')} cores={cores}><Lista itens={c.riscos} cores={cores} /></Card>
            <Card emoji="💰" rotulo={L('Oportunidades', 'Opportunities', 'Oportunidades')} cores={cores}><Lista itens={c.oportunidades} cores={cores} /></Card>
            <Card emoji="🔮" rotulo={L('Próximos 12 meses', 'Next 12 months', 'Próximos 12 meses')} cores={cores}>{horizonte(c.horizonte_12m)}</Card>
            <Card emoji="🔮" rotulo={L('3 anos', '3 years', '3 años')} cores={cores}>{horizonte(c.horizonte_3a)}</Card>
            <Card emoji="🔮" rotulo={L('5 anos', '5 years', '5 años')} cores={cores}>{horizonte(c.horizonte_5a)}</Card>
            <Card emoji="🔭" rotulo={L('10 anos', '10 years', '10 años')} cores={cores}>{horizonte(c.horizonte_10a)}</Card>
            <Card emoji="👁️" rotulo={L('O que você pode não estar vendo', 'What you may not be seeing', 'Lo que quizá no está viendo')} cores={cores}>{bloco(c.nao_estou_vendo)}</Card>
            <Card emoji="🧠" rotulo={L('O que o José faria', 'What José would do', 'Lo que haría José')} cores={cores}>
              <p className="text-sm font-bold leading-snug mb-1.5" style={{ color: TITULO }}>{c.jose_faria.titulo}</p>
              <ol className="space-y-1">{c.jose_faria.acoes.map((a, i) => <li key={i} className="text-xs leading-relaxed" style={{ color: TEXTO }}><span className="font-bold">{i + 1}.</span> {a}</li>)}</ol>
            </Card>
            <Card emoji="📌" rotulo={L('De onde veio e limites', 'Sources and limits', 'Fuentes y límites')} cores={cores}>
              <ul className="list-disc pl-4 space-y-0.5 mb-2">{c.base_usada.map((b, i) => <li key={i} className="text-[11px]" style={{ color: TEXTO }}>{b}</li>)}</ul>
              <p className="text-[11px] font-bold mb-0.5" style={{ color: CINZA }}>{L('O que ainda falta na base', 'What the data still lacks', 'Lo que aún falta en la base')}</p>
              <ul className="list-disc pl-4 space-y-0.5">{c.limitacoes.map((b, i) => <li key={i} className="text-[11px]" style={{ color: CINZA }}>{b}</li>)}</ul>
            </Card>
          </div>
        )
      })()}
    </section>
  )
}
