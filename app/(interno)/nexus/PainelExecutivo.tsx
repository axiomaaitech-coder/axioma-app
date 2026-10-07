'use client'
// ═══════════════════════════════════════════════════════════════
// Painel executivo do José (Etapa 7) — síntese diária em 12 cards (3×4),
// logo abaixo dos indicadores. Busca /api/nexus/briefing (1 por dia/idioma,
// guardado pra todos). Cada card: texto robusto e conciso, pontos com número e
// data, e as fontes (Motor de Pesquisa Nexus) com link pra pessoa conferir.
// Botão Atualizar: gera de novo se o painel tiver 3h+ (custo de IA controlado).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { RotateCcw, ChevronDown, ChevronUp, ExternalLink, Search } from 'lucide-react'
import { JosephAvatar } from '../../../components/JosephAvatar'
import AvisoAxioma from '../../../components/AvisoAxioma'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import type { BriefingJose, FonteBriefing, PainelJose } from '../../../lib/nexusBriefing'
import { TITULO_SECAO } from './fonteJose'
import { hojeISO } from '../../../lib/datas'

type Lang = 'pt' | 'en' | 'es'
const BARRA = <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />

type Cores = { titulo: string; texto: string; cinza: string; fundo: string; fundoSolido: string; borda: string; acento: string; claro: boolean; lang: Lang }
const textoL = (lang: Lang) => (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)

function Card({ emoji, rotulo, cores, children }: { emoji: string; rotulo: string; cores: Cores; children: ReactNode }) {
  const [aberto, setAberto] = useState(false)
  const L = textoL(cores.lang)
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col axi-card-premium3d" style={{ background: cores.fundo, border: `1px solid ${cores.borda}` }}>
      {BARRA}
      <p className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: cores.cinza }}>{emoji} {rotulo}</p>
      {/* Recolhido: altura fixa com esmaecido; "Ler mais" mostra tudo (texto, pontos e fontes). */}
      <div className="relative" style={aberto ? undefined : { maxHeight: 190, overflow: 'hidden' }}>
        {children}
        {!aberto && <div className="absolute inset-x-0 bottom-0 h-10 pointer-events-none" style={{ background: `linear-gradient(to bottom, transparent, ${cores.fundoSolido})` }} aria-hidden />}
      </div>
      <button onClick={() => setAberto((v) => !v)} aria-expanded={aberto}
        className="self-end mt-2 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md"
        style={{ color: cores.acento, border: `1px solid ${cores.acento}55` }}>
        {aberto ? <>{L('Recolher', 'Collapse', 'Contraer')}<ChevronUp size={13} aria-hidden /></> : <>{L('Ler mais', 'Read more', 'Leer más')}<ChevronDown size={13} aria-hidden /></>}
      </button>
    </div>
  )
}

// Fontes de um bloco/item: nome, data e link (só links coletados pelo Axioma ou páginas oficiais).
function Fontes({ fontes, cores }: { fontes?: FonteBriefing[]; cores: Cores }) {
  const L = textoL(cores.lang)
  if (!fontes?.length) return null
  const dataFmt = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T12:00:00').toLocaleDateString(cores.lang === 'en' ? 'en-US' : cores.lang === 'es' ? 'es-ES' : 'pt-BR') : d
  return (
    <div className="mt-2 pt-2" style={{ borderTop: `1px dashed ${cores.borda}` }}>
      <p className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: cores.cinza }}>
        <Search size={10} aria-hidden />{L('Fontes — Motor de Pesquisa Nexus', 'Sources — Nexus Search Engine', 'Fuentes — Motor de Búsqueda Nexus')}
      </p>
      <ul className="space-y-0.5">
        {fontes.map((f, i) => (
          <li key={i} className="text-[11px] leading-snug" style={{ color: cores.texto }}>
            {f.url
              ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline font-semibold" style={{ color: cores.acento }}>{f.nome}<ExternalLink size={10} aria-hidden /></a>
              : <span className="font-semibold">{f.nome}</span>}
            {f.data && <span style={{ color: cores.cinza }}> · {dataFmt(f.data)}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

const corGravidade = (g: string, claro: boolean) =>
  g === 'alta' ? (claro ? '#dc3545' : '#f87171') : g === 'media' ? (claro ? '#b45309' : '#2ecc9b') : (claro ? '#16a97d' : '#34d399')

function Lista({ itens, cores }: { itens: BriefingJose['alertas']; cores: Cores }) {
  return (
    <ul className="space-y-3">
      {itens.map((it, i) => (
        <li key={i}>
          <p className="flex items-center gap-1.5 text-sm font-bold leading-snug" style={{ color: cores.titulo }}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: corGravidade(it.gravidade, cores.claro) }} aria-hidden />{it.titulo}
          </p>
          <p className="text-[13px] leading-relaxed mt-0.5" style={{ color: cores.texto }}>{it.texto}</p>
          <Fontes fontes={it.fontes} cores={cores} />
        </li>
      ))}
    </ul>
  )
}

export function PainelExecutivo({ lang, temaClaro }: { lang: Lang; temaClaro: boolean }) {
  const L = textoL(lang)
  const { CIANO, CINZA, TEXTO, TITULO, PAINEL_BG } = PALETA[temaClaro ? 'xms' : 'dark']
  // fundoSolido: cor opaca do card pro esmaecido do texto recolhido (PAINEL_BG do Escuro é translúcido).
  const cores: Cores = { titulo: TITULO, texto: TEXTO, cinza: CINZA, fundo: PAINEL_BG, fundoSolido: temaClaro ? '#f6f7c4' : '#0b1626', borda: `${CIANO}30`, acento: temaClaro ? '#16a97d' : CIANO, claro: temaClaro, lang }
  const [painel, setPainel] = useState<PainelJose | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [tentativa, setTentativa] = useState(0)
  const [atualizando, setAtualizando] = useState(false)
  const [aviso, setAviso] = useState<{ msg: string; tipo: 'ok' | 'erro' | 'info' } | null>(null)
  const avisar = (msg: string, tipo: 'ok' | 'erro' | 'info') => { setAviso({ msg, tipo }); setTimeout(() => setAviso(null), 4000) }

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

  const horaFmt = (iso: string) => new Date(iso).toLocaleTimeString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })
  const bloqueado = !!painel?.podeAtualizarEm && new Date(painel.podeAtualizarEm).getTime() > Date.now()

  async function atualizar() {
    if (atualizando || bloqueado) return
    setAtualizando(true)
    avisar(L('José está lendo os dados mais novos… pode levar até 1 minuto.', 'José is reading the newest data… this may take up to a minute.', 'José está leyendo los datos más nuevos… puede tardar hasta 1 minuto.'), 'info')
    try {
      const res = await fetch('/api/nexus/briefing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, atualizar: true }) })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.painel) throw new Error(String(res.status))
      const novo = json.painel as PainelJose
      const mudou = novo.geradoEm !== painel?.geradoEm
      setPainel(novo); setEstado('ok')
      avisar(mudou
        ? L('Painel atualizado com os dados mais recentes.', 'Briefing updated with the latest data.', 'Panel actualizado con los datos más recientes.')
        : L('O painel já estava atualizado.', 'The briefing was already up to date.', 'El panel ya estaba actualizado.'), 'ok')
    } catch {
      avisar(L('Não foi possível atualizar agora. O painel anterior continua na tela.', 'Could not update now. The previous briefing stays on screen.', 'No fue posible actualizar ahora. El panel anterior sigue en pantalla.'), 'erro')
    }
    setAtualizando(false)
  }

  const dataFmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')
  const chipConfianca = (c: number): CSSProperties => {
    const cor = c >= 60 ? (temaClaro ? '#16a97d' : '#34d399') : c >= 40 ? (temaClaro ? '#b45309' : '#2ecc9b') : (temaClaro ? '#374151' : '#8aa4c2')
    // Claro: sempre azul-marinho com letra branca (padrão pedido pelo Elias); Escuro mantém a cor por faixa.
    return temaClaro ? { background: '#101b3d', color: '#ffffff', border: '1px solid #101b3d' } : { color: cor, border: `1px solid ${cor}80` }
  }

  return (
    <section>
      <AvisoAxioma aviso={aviso} onFechar={() => setAviso(null)} duracao={4000} />
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3 px-1">
        <div>
          <h2 className={TITULO_SECAO} style={{ color: TITULO }}>
            <JosephAvatar tamanho={26} estado={estado === 'carregando' || atualizando ? 'pensando' : 'parado'} />
            {L('Painel executivo do José', "José's executive briefing", 'Panel ejecutivo de José')}
          </h2>
          <p className="text-sm mt-0.5" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.85 }}>
            {L('O que mudou, por que importa e o que fazer — escrito pelo José a partir dos dados oficiais e das reportagens coletadas pelo Motor de Pesquisa Nexus.', 'What changed, why it matters and what to do — written by José from official data and the news collected by the Nexus Search Engine.', 'Qué cambió, por qué importa y qué hacer — escrito por José a partir de datos oficiales y de las noticias recogidas por el Motor de Búsqueda Nexus.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {painel && (
            <p className="text-xs text-right" style={{ color: CINZA }}>
              {painel.data === hojeISO()
                ? (painel.geradoEm ? `${L('Gerado hoje às', 'Generated today at', 'Generado hoy a las')} ${horaFmt(painel.geradoEm)}` : L('Atualizado hoje', 'Updated today', 'Actualizado hoy'))
                : `${L('Painel de', 'Briefing from', 'Panel del')} ${dataFmt(painel.data)}`}
              <br />{L('confiança geral', 'overall confidence', 'confianza general')} {Math.round(painel.conteudo.confianca_geral)}/100
            </p>
          )}
          <button onClick={atualizar} disabled={atualizando || bloqueado || estado === 'carregando'}
            title={bloqueado && painel?.podeAtualizarEm ? `${L('Próxima atualização disponível às', 'Next update available at', 'Próxima actualización disponible a las')} ${horaFmt(painel.podeAtualizarEm)}` : undefined}
            className="flex items-center gap-1.5 text-sm font-bold px-3.5 py-2 rounded-xl disabled:opacity-60"
            style={temaClaro ? VERDE_SOLIDO : { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', border: 'none', color: '#fff' }}>
            <RotateCcw size={14} className={atualizando ? 'animate-spin' : ''} aria-hidden />
            {atualizando ? L('Atualizando…', 'Updating…', 'Actualizando…')
              : bloqueado && painel?.podeAtualizarEm ? `${L('Disponível às', 'Available at', 'Disponible a las')} ${horaFmt(painel.podeAtualizarEm)}`
              : L('Atualizar', 'Update', 'Actualizar')}
          </button>
        </div>
      </div>

      {/* Troca de idioma: mantém o painel anterior na tela até o novo chegar (sem
          encolher/crescer a página = sem tremida); o aviso só aparece na 1ª carga. */}
      {estado === 'carregando' && !painel && (
        <div className="relative overflow-hidden rounded-2xl p-5 flex items-center gap-4 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
          {BARRA}
          <JosephAvatar tamanho={56} estado="pensando" />
          <div>
            <p className="text-sm font-bold" style={{ color: TITULO }}>{L('José preparando o painel de hoje…', "José preparing today's briefing…", 'José preparando el panel de hoy…')}</p>
            <p className="text-xs mt-1" style={{ color: TEXTO, opacity: temaClaro ? 1 : 0.8 }}>{L('Lendo indicadores, eventos e reportagens. Na primeira vez do dia leva até 1 minuto — depois fica pronto para todos.', 'Reading indicators, events and news. The first time each day takes up to a minute — then it is ready for everyone.', 'Leyendo indicadores, eventos y noticias. La primera vez del día tarda hasta un minuto — luego queda listo para todos.')}</p>
          </div>
        </div>
      )}

      {estado === 'erro' && (
        <div className="relative overflow-hidden rounded-2xl p-5 flex flex-wrap items-center gap-3 axi-card-premium3d" style={{ background: PAINEL_BG, border: `1px solid ${CIANO}30` }}>
          {BARRA}
          <p className="text-sm" style={{ color: TEXTO }}>{L('Não foi possível montar o painel agora.', 'Could not build the briefing right now.', 'No fue posible armar el panel ahora.')}</p>
          <button onClick={() => setTentativa((t) => t + 1)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg"
            style={temaClaro ? VERDE_SOLIDO : { background: 'linear-gradient(135deg, #0a4f3b, #0f7d5c)', border: 'none', color: '#fff' }}>
            <RotateCcw size={12} aria-hidden />{L('Tentar de novo', 'Try again', 'Intentar de nuevo')}
          </button>
        </div>
      )}

      {estado !== 'erro' && painel && (() => {
        const c = painel.conteudo
        const pontos = (ps?: string[]) => ps?.length ? (
          <ul className="mt-2 space-y-1">
            {ps.map((p, i) => <li key={i} className="flex gap-1.5 text-[12px] leading-snug" style={{ color: TEXTO }}><span style={{ color: cores.acento }}>▸</span><span>{p}</span></li>)}
          </ul>
        ) : null
        const bloco = (b: BriefingJose['mundo']) => (
          <>
            <p className="text-[15px] font-bold leading-snug mb-1.5" style={{ color: TITULO }}>{b.titulo}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: TEXTO }}>{b.texto}</p>
            {pontos(b.pontos)}
            <Fontes fontes={b.fontes} cores={cores} />
          </>
        )
        const horizonte = (h: BriefingJose['horizonte_12m']) => (
          <>
            <span className="self-start inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2" style={chipConfianca(h.confianca)}>
              {L('confiança', 'confidence', 'confianza')} {Math.round(h.confianca)}/100
            </span>
            <p className="text-[15px] font-bold leading-snug mb-1.5" style={{ color: TITULO }}>{h.titulo}</p>
            <p className="text-[13px] leading-relaxed" style={{ color: TEXTO }}>{h.texto}</p>
            {h.sinais?.length ? <p className="text-[11px] font-black uppercase tracking-wide mt-2" style={{ color: CINZA }}>{L('Sinais para acompanhar', 'Signals to watch', 'Señales a seguir')}</p> : null}
            {pontos(h.sinais)}
          </>
        )
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start transition-opacity duration-300" style={{ opacity: estado === 'carregando' || atualizando ? 0.55 : 1 }}>
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
              <p className="text-[15px] font-bold leading-snug mb-2" style={{ color: TITULO }}>{c.jose_faria.titulo}</p>
              <ol className="space-y-1.5">{c.jose_faria.acoes.map((a, i) => <li key={i} className="text-[13px] leading-relaxed" style={{ color: TEXTO }}><span className="font-bold" style={{ color: cores.acento }}>{i + 1}.</span> {a}</li>)}</ol>
              <p className="text-[11px] italic mt-2 text-right" style={{ color: CINZA }}>— José</p>
            </Card>
            <Card emoji="📌" rotulo={L('De onde veio e limites', 'Sources and limits', 'Fuentes y límites')} cores={cores}>
              <ul className="list-disc pl-4 space-y-1 mb-2">{c.base_usada.map((b, i) => <li key={i} className="text-[12px]" style={{ color: TEXTO }}>{b}</li>)}</ul>
              <p className="text-[11px] font-black uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('O que ainda falta na base', 'What the data still lacks', 'Lo que aún falta en la base')}</p>
              <ul className="list-disc pl-4 space-y-1">{c.limitacoes.map((b, i) => <li key={i} className="text-[12px]" style={{ color: CINZA }}>{b}</li>)}</ul>
            </Card>
          </div>
        )
      })()}
    </section>
  )
}
