'use client'
// ═══════════════════════════════════════════════════════════════
// "Pergunte ao José: como sua empresa pode estar em…" (Etapa 8).
// 3 cards (1-3, 4-7, 8-10 anos) dentro do painel do José. Clique → /api/nexus/plano
// (Anthropic, números reais da empresa × economia do Brasil e do mundo) →
// modal com o plano: veredito, sobrevivência, economizar, cortar, crescer,
// metas e gatilhos. Guardado por empresa/horizonte/dia (RLS por empresa).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, RotateCcw } from 'lucide-react'
import { JosephAvatar } from '../../../components/JosephAvatar'
import { PALETA, VERDE_SOLIDO } from '../../../lib/nexusTema'
import type { HorizontePlano, PlanoJose as TipoPlano, NumerosEmpresa } from '../../../lib/nexusPlanoEmpresa'

type Lang = 'pt' | 'en' | 'es'
type Nome3 = [string, string, string]
const fBRL = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n || 0)

const HORIZONTES: { id: HorizontePlano; emoji: string; titulo: Nome3; sub: Nome3 }[] = [
  { id: '1-3', emoji: '🌱', titulo: ['1 a 3 anos', '1 to 3 years', '1 a 3 años'], sub: ['Sobreviver e se fortalecer', 'Survive and get stronger', 'Sobrevivir y fortalecerse'] },
  { id: '4-7', emoji: '🌳', titulo: ['4 a 7 anos', '4 to 7 years', '4 a 7 años'], sub: ['Consolidar e crescer', 'Consolidate and grow', 'Consolidar y crecer'] },
  { id: '8-10', emoji: '🏛️', titulo: ['8 a 10 anos', '8 to 10 years', '8 a 10 años'], sub: ['Preparar o longo prazo', 'Prepare for the long run', 'Preparar el largo plazo'] },
]

const ETAPAS: Nome3[] = [
  ['Lendo o caixa da sua empresa', "Reading your company's cash", 'Leyendo la caja de su empresa'],
  ['Lendo seus custos, um por um', 'Reading your costs, one by one', 'Leyendo sus costos, uno por uno'],
  ['Cruzando com a economia do Brasil e do mundo', 'Cross-checking with the Brazilian and world economy', 'Cruzando con la economía de Brasil y del mundo'],
  ['Montando o plano para economizar', 'Building the savings plan', 'Armando el plan para ahorrar'],
  ['Montando o plano para crescer', 'Building the growth plan', 'Armando el plan para crecer'],
  ['Definindo metas e gatilhos', 'Setting goals and triggers', 'Definiendo metas y disparadores'],
]

type Resultado = { data: string; plano: TipoPlano; numeros: NumerosEmpresa }

export function PlanoJose({ lang, temaClaro, empresaId, aliquotaPct }: { lang: Lang; temaClaro: boolean; empresaId: string | null; aliquotaPct: number }) {
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const L3 = (n: Nome3) => L(...n)
  const tema = temaClaro ? 'xms' : 'dark'
  const { CIANO, CINZA, TEXTO, TITULO, MODAL_BG, NESTED_BG } = PALETA[tema]
  const ACENTO = temaClaro ? '#16a97d' : CIANO
  const [aberto, setAberto] = useState<HorizontePlano | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'ok' | 'erro'>('carregando')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [etapa, setEtapa] = useState(0)
  const [montado, setMontado] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMontado(true) }, [])

  async function pedir(h: HorizontePlano) {
    if (!empresaId) return
    setAberto(h); setEstado('carregando'); setResultado(null); setEtapa(0)
    try {
      const res = await fetch('/api/nexus/plano', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresa_id: empresaId, horizonte: h, lang, aliquota_pct: aliquotaPct }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.plano) { setResultado(json.plano); setEstado('ok') } else setEstado('erro')
    } catch { setEstado('erro') }
  }

  // Etapas da microinteração avançam enquanto carrega (param na última).
  useEffect(() => {
    if (!aberto || estado !== 'carregando') return
    const t = setInterval(() => setEtapa((e) => Math.min(e + 1, ETAPAS.length - 1)), 6000)
    return () => clearInterval(t)
  }, [aberto, estado])

  useEffect(() => {
    if (!aberto) return
    const f = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(null) }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [aberto])

  const caixa: CSSProperties = temaClaro ? { background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(16,27,61,0.12)' } : { background: NESTED_BG, border: '1px solid rgba(255,255,255,0.08)' }
  const corPrio = (p: string) => p === 'alta' ? (temaClaro ? '#dc3545' : '#f87171') : p === 'media' ? (temaClaro ? '#b45309' : '#fbbf24') : (temaClaro ? '#374151' : '#8aa4c2')
  const nomePrio = (p: string) => p === 'alta' ? L('prioridade alta', 'high priority', 'prioridad alta') : p === 'media' ? L('prioridade média', 'medium priority', 'prioridad media') : L('prioridade baixa', 'low priority', 'prioridad baja')
  const corRisco = (r: string) => r === 'alto' ? (temaClaro ? '#dc3545' : '#f87171') : r === 'medio' ? (temaClaro ? '#b45309' : '#fbbf24') : (temaClaro ? '#16a97d' : '#34d399')
  const titulo = (t: string) => <p className="text-xs font-bold mb-2" style={{ color: CINZA }}>{t}</p>
  const horizonteAtual = HORIZONTES.find((x) => x.id === aberto)

  const listaAcoes = (itens: TipoPlano['economizar'], emoji: string, rotulo: string): ReactNode => (
    <div className="rounded-xl p-3" style={caixa}>
      {titulo(`${emoji} ${rotulo}`)}
      <ul className="space-y-2.5">
        {itens.map((a, i) => (
          <li key={i}>
            <p className="text-sm font-bold leading-snug" style={{ color: TITULO }}>{a.titulo}</p>
            <p className="text-xs leading-relaxed mt-0.5" style={{ color: TEXTO }}>{a.detalhe}</p>
            <p className="text-[11px] mt-1" style={{ color: CINZA }}>
              <span className="font-bold" style={{ color: corPrio(a.prioridade) }}>{nomePrio(a.prioridade)}</span> · {L('impacto', 'impact', 'impacto')}: {a.impacto}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="mt-3 rounded-xl p-3" style={{ background: temaClaro ? 'rgba(46,204,155,0.10)' : 'rgba(46,204,155,0.07)', border: '1px solid rgba(46,204,155,0.35)' }}>
      <p className="text-sm font-bold mb-0.5" style={{ color: TITULO }}>🔮 {L('Pergunte ao José: como sua empresa pode estar em…', 'Ask José: where could your company be in…', 'Pregunte a José: ¿cómo puede estar su empresa en…')}</p>
      <p className="text-[11px] mb-2.5" style={{ color: TEXTO, opacity: 0.85 }}>
        {L('Ele lê o seu caixa e os seus custos, cruza com a economia do Brasil e do mundo e monta um plano para sobreviver, economizar e crescer.', 'He reads your cash and costs, cross-checks with the Brazilian and world economy and builds a plan to survive, save and grow.', 'Lee su caja y sus costos, cruza con la economía de Brasil y del mundo y arma un plan para sobrevivir, ahorrar y crecer.')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {HORIZONTES.map((h) => (
          <button key={h.id} onClick={() => pedir(h.id)} disabled={!empresaId}
            className="relative overflow-hidden rounded-xl p-3 text-left axi-card-premium3d disabled:opacity-50"
            style={temaClaro ? { background: '#ffffff', border: '1px solid rgba(16,27,61,0.14)' } : { background: 'rgba(10,22,40,0.9)', border: `1px solid ${CIANO}30` }}>
            <div className="axi-card-premium3d-bar absolute top-0 left-0 right-0 h-[3px] pointer-events-none" style={{ background: '#2ecc9b' }} aria-hidden />
            <p className="text-lg leading-none mb-1">{h.emoji}</p>
            <p className="text-sm font-black" style={{ color: TITULO }}>{L3(h.titulo)}</p>
            <p className="text-[11px]" style={{ color: TEXTO, opacity: 0.85 }}>{L3(h.sub)}</p>
          </button>
        ))}
      </div>
      {!empresaId && <p className="text-[11px] mt-2" style={{ color: CINZA }}>{L('Cadastre sua empresa para receber o plano.', 'Register your company to get the plan.', 'Registre su empresa para recibir el plan.')}</p>}

      {montado && createPortal(
        <div data-theme={tema} style={{ fontFamily: 'var(--font-geist-sans), Arial, sans-serif' }}>
          <AnimatePresence>
            {aberto && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
                onClick={() => setAberto(null)}>
                <motion.div role="dialog" aria-modal="true" aria-labelledby="plano-jose-titulo"
                  initial={{ scale: 0.96, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0, y: 14 }} transition={{ duration: 0.22 }}
                  className="w-full max-w-4xl h-[88vh] overflow-y-auto rounded-2xl p-5"
                  style={{ background: MODAL_BG, border: '1px solid rgba(46,204,155,0.45)', borderTop: '3px solid #2ecc9b' }}
                  onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <JosephAvatar tamanho={48} estado={estado === 'carregando' ? 'pensando' : 'parado'} />
                      <div>
                        <h3 id="plano-jose-titulo" className="text-lg font-black" style={{ color: TITULO }}>
                          {L('Plano do José para sua empresa', "José's plan for your company", 'Plan de José para su empresa')} — {horizonteAtual ? L3(horizonteAtual.titulo) : ''}
                        </h3>
                        {resultado && <p className="text-[11px]" style={{ color: CINZA }}>{L('Gerado em', 'Generated on', 'Generado el')} {new Date(resultado.data + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR')} · {L('confiança', 'confidence', 'confianza')} {Math.round(resultado.plano.confianca)}/100 · {L('não é recomendação de investimento', 'not investment advice', 'no es recomendación de inversión')}</p>}
                      </div>
                    </div>
                    <button onClick={() => setAberto(null)} aria-label={L('Fechar', 'Close', 'Cerrar')} className={`p-1 rounded-lg ${temaClaro ? 'hover:bg-black/5' : 'hover:bg-white/10'}`}><X size={18} style={{ color: CINZA }} /></button>
                  </div>

                  {estado === 'carregando' && (
                    <div className="py-10 flex flex-col items-center text-center" role="status">
                      <JosephAvatar tamanho={96} estado="pensando" />
                      <AnimatePresence mode="wait">
                        <motion.p key={etapa} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="text-base font-bold mt-5" style={{ color: TITULO }}>{L3(ETAPAS[etapa])}…</motion.p>
                      </AnimatePresence>
                      <div className="flex gap-1 mt-3" aria-hidden>
                        {ETAPAS.map((_, i) => <span key={i} className="h-1 rounded-full transition-all" style={{ width: i === etapa ? 20 : 6, background: i <= etapa ? ACENTO : `${CINZA}40` }} />)}
                      </div>
                      <p className="text-xs mt-3" style={{ color: TEXTO, opacity: 0.8 }}>{L('Uma análise completa leva até 1 minuto. Fica guardada pelo resto do dia.', 'A full analysis takes up to a minute. It stays saved for the rest of the day.', 'Un análisis completo tarda hasta un minuto. Queda guardado el resto del día.')}</p>
                    </div>
                  )}

                  {estado === 'erro' && (
                    <div className="py-10 flex flex-col items-center gap-3 text-center">
                      <p className="text-sm" style={{ color: TEXTO }}>{L('Não foi possível montar o plano agora.', 'Could not build the plan right now.', 'No fue posible armar el plan ahora.')}</p>
                      <button onClick={() => aberto && pedir(aberto)} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg" style={VERDE_SOLIDO}>
                        <RotateCcw size={12} aria-hidden />{L('Tentar de novo', 'Try again', 'Intentar de nuevo')}
                      </button>
                    </div>
                  )}

                  {estado === 'ok' && resultado && (() => {
                    const p = resultado.plano, n = resultado.numeros
                    return (
                      <div className="space-y-4">
                        <div className="rounded-xl p-4" style={{ ...caixa, borderLeft: `4px solid ${corRisco(p.sobrevivencia.risco)}` }}>
                          <p className="text-base font-black leading-snug" style={{ color: TITULO }}>{p.veredito}</p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {[
                            { l: L('Receita por mês', 'Revenue per month', 'Ingresos por mes'), v: fBRL(n.receitaMensal) },
                            { l: L('Lucro por mês', 'Profit per month', 'Beneficio por mes'), v: `${fBRL(n.lucroMensal)}${n.margemPct != null ? ` (${n.margemPct.toFixed(1)}%)` : ''}` },
                            { l: L('Caixa disponível', 'Available cash', 'Caja disponible'), v: fBRL(n.caixa) },
                            { l: L('Fôlego de caixa', 'Cash runway', 'Autonomía de caja'), v: n.folegoMeses != null ? `${n.folegoMeses} ${L('meses', 'months', 'meses')}` : n.lucroMensal >= 0 ? L('no azul', 'profitable', 'en positivo') : '—' },
                          ].map((k) => (
                            <div key={k.l} className="rounded-xl p-3" style={caixa}>
                              <p className="text-[11px]" style={{ color: CINZA }}>{k.l}</p>
                              <p className="text-sm font-black" style={{ color: TITULO }}>{k.v}</p>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="rounded-xl p-3" style={caixa}>{titulo(L('Onde a empresa está hoje', 'Where the company stands today', 'Dónde está la empresa hoy'))}<p className="text-xs leading-relaxed" style={{ color: TEXTO }}>{p.situacao_hoje}</p></div>
                          <div className="rounded-xl p-3" style={caixa}>{titulo(L('O que a economia sinaliza no período', 'What the economy signals for the period', 'Lo que la economía señala en el período'))}<p className="text-xs leading-relaxed" style={{ color: TEXTO }}>{p.cenario_periodo}</p></div>
                          <div className="rounded-xl p-3" style={caixa}>
                            {titulo(L('Sobrevivência', 'Survival', 'Supervivencia'))}
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5" style={{ color: corRisco(p.sobrevivencia.risco), border: `1px solid ${corRisco(p.sobrevivencia.risco)}` }}>
                              {L('risco', 'risk', 'riesgo')} {p.sobrevivencia.risco === 'alto' ? L('alto', 'high', 'alto') : p.sobrevivencia.risco === 'medio' ? L('médio', 'medium', 'medio') : L('baixo', 'low', 'bajo')}
                            </span>
                            <p className="text-xs leading-relaxed" style={{ color: TEXTO }}>{p.sobrevivencia.texto}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {listaAcoes(p.economizar, '💡', L('Onde economizar', 'Where to save', 'Dónde ahorrar'))}
                          {listaAcoes(p.cortar, '✂️', L('O que cortar', 'What to cut', 'Qué recortar'))}
                          {listaAcoes(p.crescer, '📈', L('Como crescer', 'How to grow', 'Cómo crecer'))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="rounded-xl p-3" style={caixa}>
                            {titulo(`🎯 ${L('Metas de indicadores', 'Indicator goals', 'Metas de indicadores')}`)}
                            <ul className="space-y-1.5">
                              {p.metas.map((m, i) => (
                                <li key={i} className="text-xs" style={{ color: TEXTO }}>
                                  <span className="font-bold" style={{ color: TITULO }}>{m.indicador}:</span> {m.hoje} → <span className="font-bold" style={{ color: ACENTO }}>{m.meta}</span> <span style={{ color: CINZA }}>({m.prazo})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-xl p-3" style={caixa}>
                            {titulo(`🚦 ${L('Gatilhos para vigiar', 'Triggers to watch', 'Disparadores a vigilar')}`)}
                            <ul className="space-y-1.5">
                              {p.gatilhos.map((g, i) => (
                                <li key={i} className="text-xs leading-relaxed" style={{ color: TEXTO }}>
                                  <span className="font-bold" style={{ color: TITULO }}>{L('Se', 'If', 'Si')}</span> {g.se} — <span className="font-bold" style={{ color: ACENTO }}>{L('então', 'then', 'entonces')}</span> {g.entao}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-xl p-3" style={caixa}>
                          {titulo(L('O que ainda falta para o José enxergar melhor', 'What José still needs to see better', 'Lo que aún le falta a José para ver mejor'))}
                          <ul className="list-disc pl-4 space-y-0.5">{p.limitacoes.map((l, i) => <li key={i} className="text-[11px]" style={{ color: CINZA }}>{l}</li>)}</ul>
                        </div>
                      </div>
                    )
                  })()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>,
        document.body,
      )}
    </div>
  )
}
