'use client'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { RefreshCw, X, CheckCircle2, XCircle, Eye, BookOpenText, TrendingDown, ClipboardCheck } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import {
  listarDescobertas, contarPorPrioridade, atualizarStatusDescoberta, rodarDiscoveryEngine,
  type Descoberta, type StatusDescoberta, type TipoDescoberta, type Confianca,
} from '../../../lib/contadorHelpers'
import { fBRL2 } from '../../../lib/cfoCore'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Idioma3 = 'pt' | 'en' | 'es'

const VERMELHO = '#f87171'
const LARANJA = '#fb923c'
const AMARELO = '#fbbf24'
const VERDE = '#34d399'
const AZULC = '#6ab0ff'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const COR_PRIORIDADE: Record<string, string> = { P0: VERMELHO, P1: LARANJA, P2: AMARELO, P3: CINZA }
const COR_TIPO: Record<TipoDescoberta, string> = {
  risco: VERMELHO, inconsistencia: LARANJA, divergencia: LARANJA, concentracao: AMARELO,
  classificacao_suspeita: AMARELO, anomalia: AMARELO, oportunidade: VERDE, tendencia: AZULC,
}

const LABEL_TIPO: Record<TipoDescoberta, Record<Idioma3, string>> = {
  inconsistencia: { pt: 'Inconsistência', en: 'Inconsistency', es: 'Inconsistencia' },
  anomalia: { pt: 'Anomalia', en: 'Anomaly', es: 'Anomalía' },
  oportunidade: { pt: 'Oportunidade', en: 'Opportunity', es: 'Oportunidad' },
  risco: { pt: 'Risco', en: 'Risk', es: 'Riesgo' },
  divergencia: { pt: 'Divergência', en: 'Discrepancy', es: 'Divergencia' },
  concentracao: { pt: 'Concentração', en: 'Concentration', es: 'Concentración' },
  classificacao_suspeita: { pt: 'Classificação Suspeita', en: 'Suspicious Classification', es: 'Clasificación Sospechosa' },
  tendencia: { pt: 'Tendência', en: 'Trend', es: 'Tendencia' },
}

const LABEL_CONFIANCA: Record<Confianca, Record<Idioma3, string>> = {
  fato: { pt: 'Fato', en: 'Fact', es: 'Hecho' },
  calculo: { pt: 'Cálculo', en: 'Calculation', es: 'Cálculo' },
  inferencia: { pt: 'Inferência', en: 'Inference', es: 'Inferencia' },
  previsao: { pt: 'Previsão', en: 'Forecast', es: 'Previsión' },
  cenario: { pt: 'Cenário', en: 'Scenario', es: 'Escenario' },
}

const COR_CONFIANCA: Record<Confianca, string> = { fato: VERDE, calculo: AZULC, inferencia: AMARELO, previsao: '#a78bfa', cenario: '#a78bfa' }

const LABEL_STATUS: Record<StatusDescoberta, Record<Idioma3, string>> = {
  aberto: { pt: 'Aberta', en: 'Open', es: 'Abierta' },
  revisado: { pt: 'Revisada', en: 'Reviewed', es: 'Revisada' },
  resolvido: { pt: 'Resolvida', en: 'Resolved', es: 'Resuelta' },
  ignorado: { pt: 'Ignorada', en: 'Ignored', es: 'Ignorada' },
}

function formatarChaveEvidencia(chave: string): string {
  return chave.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function formatarValorEvidencia(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export default function ContadorPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rodando, setRodando] = useState(false)
  const [descobertas, setDescobertas] = useState<Descoberta[]>([])
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [selecionada, setSelecionada] = useState<Descoberta | null>(null)
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const carregar = useCallback(async (empId: string) => {
    setDescobertas(await listarDescobertas(empId))
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
      if (empId) await carregar(empId)
      setLoading(false)
    })()
  }, [carregar])

  async function rodarAgora() {
    if (!empresaId || rodando) return
    setRodando(true)
    setMensagem(null)
    const { novasDescobertas, erro } = await rodarDiscoveryEngine(empresaId, lang)
    setMensagem(erro
      ? L('Não foi possível concluir a rodada agora. Tente de novo.', 'Could not finish the run right now. Try again.', 'No se pudo completar la ronda ahora. Intente de nuevo.')
      : novasDescobertas > 0
        ? L(`${novasDescobertas} descoberta(s) nova(s).`, `${novasDescobertas} new finding(s).`, `${novasDescobertas} hallazgo(s) nuevo(s).`)
        : L('Nada novo — tudo já mapeado.', 'Nothing new — everything already mapped.', 'Nada nuevo — todo ya mapeado.'))
    await carregar(empresaId)
    setRodando(false)
  }

  async function aplicarAcao(status: 'revisado' | 'resolvido' | 'ignorado') {
    if (!selecionada || !empresaId) return
    setProcessandoAcao(true)
    const { erro } = await atualizarStatusDescoberta(selecionada, status, userId)
    if (erro) setMensagem(L('Não foi possível salvar. Tente de novo.', 'Could not save. Try again.', 'No se pudo guardar. Intente de nuevo.'))
    else await carregar(empresaId)
    setProcessandoAcao(false)
    setSelecionada(null)
  }

  const contagem = contarPorPrioridade(descobertas)
  const normal = contagem.P0 === 0 && contagem.P1 === 0
  const oportunidades = descobertas.filter((d) => d.status === 'aberto' && d.tipo === 'oportunidade').length
  const previsoes = descobertas.filter((d) => d.status === 'aberto' && (d.confianca === 'previsao' || d.confianca === 'cenario')).length
  const visiveis = mostrarTodas ? descobertas : descobertas.filter((d) => d.status === 'aberto')

  const TILES: { emoji: string; label: string; valor: number | string; cor: string }[] = [
    { emoji: '🔴', label: L('Riscos Críticos', 'Critical Risks', 'Riesgos Críticos'), valor: contagem.P0, cor: VERMELHO },
    { emoji: '🟠', label: L('Atenção', 'Attention', 'Atención'), valor: contagem.P1, cor: LARANJA },
    { emoji: '🟡', label: L('Pendências', 'Pending', 'Pendientes'), valor: contagem.P2, cor: AMARELO },
    { emoji: '🟢', label: L('Normal', 'Normal', 'Normal'), valor: normal ? L('Sim', 'Yes', 'Sí') : L('Não', 'No', 'No'), cor: normal ? VERDE : CINZA },
    { emoji: '📈', label: L('Oportunidades', 'Opportunities', 'Oportunidades'), valor: oportunidades, cor: VERDE },
    { emoji: '🔮', label: L('Previsões', 'Forecasts', 'Previsiones'), valor: previsoes, cor: '#a78bfa' },
    { emoji: '🧠', label: L('Descobertas da Axioma', "Axioma's Findings", 'Hallazgos de Axioma'), valor: contagem.totalAbertas, cor: AZULC },
  ]

  return (
    <ModuloLayout
      titulo={L('Contador', 'Accountant', 'Contador')}
      subtitulo={L('O que a Axioma descobriu sozinha nos seus números — não é balanço, é status de inteligência.', "What Axioma found on its own in your numbers — not a balance sheet, an intelligence status.", 'Lo que Axioma descubrió sola en sus números — no es un balance, es un estado de inteligencia.')}
      botaoExtra={
        <>
          <button onClick={() => router.push('/contador/explicar')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(52,211,153,0.14)', color: VERDE, border: `1px solid ${VERDE}40` }}>
            <BookOpenText size={15} />{L('Explique minha empresa', 'Explain my company', 'Explique mi empresa')}
          </button>
          <button onClick={() => router.push('/contador/projecao')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(167,139,250,0.14)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}>
            <TrendingDown size={15} />{L('Se eu fizer nada', 'If I do nothing', 'Si no hago nada')}
          </button>
          <button onClick={() => router.push('/contador/fechamento')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: `${AZULC}18`, color: AZULC, border: `1px solid ${AZULC}40` }}>
            <ClipboardCheck size={15} />{L('Fechamento', 'Close', 'Cierre')}
          </button>
          <button onClick={rodarAgora} disabled={rodando || !empresaId}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #1a3a8f, #2a5fd4)', color: '#fff' }}>
            <RefreshCw size={16} className={rodando ? 'animate-spin' : ''} />
            {rodando ? L('Rodando...', 'Running...', 'Ejecutando...') : L('Rodar descoberta', 'Run discovery', 'Ejecutar descubrimiento')}
          </button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-6">

          {mensagem && (
            <div className="rounded-xl px-4 py-2.5 text-xs font-semibold" style={{ background: `${AZULC}15`, border: `1px solid ${AZULC}35`, color: AZULC }}>
              {mensagem}
            </div>
          )}

          {/* STATUS DE INTELIGÊNCIA */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {TILES.map((t) => (
              <div key={t.label} className="rounded-xl p-3" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${t.cor}30` }}>
                <p className="text-lg leading-none mb-1.5">{t.emoji}</p>
                <p className="text-lg font-black leading-none" style={{ color: t.cor }}>{t.valor}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide mt-1" style={{ color: CINZA }}>{t.label}</p>
              </div>
            ))}
          </div>

          {/* LISTA — densa, hierárquica, sem card decorativo por item */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: TITULO }}>{L('Descobertas', 'Findings', 'Hallazgos')}</h3>
              <button onClick={() => setMostrarTodas((v) => !v)} className="text-[11px] font-semibold" style={{ color: AZULC }}>
                {mostrarTodas ? L('Mostrar só abertas', 'Show only open', 'Mostrar solo abiertas') : L('Mostrar todas', 'Show all', 'Mostrar todas')}
              </button>
            </div>

            {visiveis.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ background: 'rgba(10,20,36,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: CINZA }}>
                  {L('Nenhuma descoberta ainda. Clique em "Rodar descoberta" pra a Axioma vasculhar seus dados.', 'No findings yet. Click "Run discovery" for Axioma to scan your data.', 'Ningún hallazgo aún. Haga clic en "Ejecutar descubrimiento" para que Axioma revise sus datos.')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-xs" style={{ minWidth: 640 }}>
                  <thead>
                    <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">{L('Prioridade', 'Priority', 'Prioridad')}</th>
                      <th className="text-left py-2 px-3 font-semibold">{L('Descoberta', 'Finding', 'Hallazgo')}</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap hidden sm:table-cell">{L('Tipo', 'Type', 'Tipo')}</th>
                      <th className="text-right py-2 px-3 font-semibold whitespace-nowrap hidden md:table-cell">{L('Impacto', 'Impact', 'Impacto')}</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap hidden lg:table-cell">{L('Confiança', 'Confidence', 'Confianza')}</th>
                      <th className="text-left py-2 px-3 font-semibold whitespace-nowrap">{L('Status', 'Status', 'Estado')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((d) => (
                      <tr key={d.id} onClick={() => setSelecionada(d)} className="cursor-pointer hover:bg-white/[0.02]" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: `${COR_PRIORIDADE[d.prioridade]}20`, color: COR_PRIORIDADE[d.prioridade] }}>
                            {d.prioridade}
                          </span>
                        </td>
                        <td className="py-2.5 px-3" style={{ color: TEXTO }}>{d.titulo}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap hidden sm:table-cell" style={{ color: COR_TIPO[d.tipo] }}>{LABEL_TIPO[d.tipo][lang]}</td>
                        <td className="text-right py-2.5 px-3 whitespace-nowrap hidden md:table-cell" style={{ color: TEXTO }}>
                          {d.impacto_estimado != null ? `R$ ${fBRL2(Number(d.impacto_estimado))}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap hidden lg:table-cell">
                          <span style={{ color: COR_CONFIANCA[d.confianca] }}>{LABEL_CONFIANCA[d.confianca][lang]}</span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: d.status === 'aberto' ? TEXTO : CINZA }}>{LABEL_STATUS[d.status][lang]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXPLAIN THIS DECISION — evidência completa, rastreável */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selecionada && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-16 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => !processandoAcao && setSelecionada(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${COR_PRIORIDADE[selecionada.prioridade]}35`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black" style={{ background: `${COR_PRIORIDADE[selecionada.prioridade]}20`, color: COR_PRIORIDADE[selecionada.prioridade] }}>
                          {selecionada.prioridade}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: COR_TIPO[selecionada.tipo] }}>{LABEL_TIPO[selecionada.tipo][lang]}</span>
                      </div>
                      <h3 className="text-base font-bold" style={{ color: TITULO }}>{selecionada.titulo}</h3>
                    </div>
                    <button onClick={() => setSelecionada(null)} style={{ color: CINZA }}><X size={20} /></button>
                  </div>

                  {selecionada.descricao && <p className="text-xs mb-3" style={{ color: TEXTO }}>{selecionada.descricao}</p>}

                  {selecionada.causa && (
                    <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Por quê', 'Why', 'Por qué')}</p>
                      <p className="text-xs" style={{ color: TEXTO }}>{selecionada.causa}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mb-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Confiança', 'Confidence', 'Confianza')}</p>
                      <p className="text-sm font-bold" style={{ color: COR_CONFIANCA[selecionada.confianca] }}>{LABEL_CONFIANCA[selecionada.confianca][lang]}</p>
                    </div>
                    {selecionada.impacto_estimado != null && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Impacto', 'Impact', 'Impacto')}</p>
                        <p className="text-sm font-bold" style={{ color: TEXTO }}>R$ {fBRL2(Number(selecionada.impacto_estimado))}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>{L('Encontrada em', 'Found on', 'Encontrada el')}</p>
                      <p className="text-sm font-bold" style={{ color: TEXTO }}>{new Date(selecionada.criado_em).toLocaleDateString(localeData)}</p>
                    </div>
                  </div>

                  {selecionada.evidencia && Object.keys(selecionada.evidencia).filter((k) => k !== 'chave').length > 0 && (
                    <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5" style={{ color: CINZA }}><Eye size={11} />{L('Evidência (dados e cálculo usados)', 'Evidence (data and calculation used)', 'Evidencia (datos y cálculo usados)')}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {Object.entries(selecionada.evidencia).filter(([k]) => k !== 'chave').map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-2 text-[11px]">
                            <span style={{ color: CINZA }}>{formatarChaveEvidencia(k)}</span>
                            <span className="font-semibold text-right" style={{ color: TEXTO }}>{formatarValorEvidencia(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ações — só muda STATUS. Sem lápis/lixeira: descoberta é leitura calculada. */}
                  {selecionada.status === 'aberto' ? (
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => aplicarAcao('resolvido')} disabled={processandoAcao}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: `${VERDE}20`, color: VERDE, border: `1px solid ${VERDE}40` }}>
                        <CheckCircle2 size={14} />{L('Marcar como resolvida', 'Mark as resolved', 'Marcar como resuelta')}
                      </button>
                      <button onClick={() => aplicarAcao('revisado')} disabled={processandoAcao}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: `${AZULC}20`, color: AZULC, border: `1px solid ${AZULC}40` }}>
                        <Eye size={14} />{L('Marcar como revisada', 'Mark as reviewed', 'Marcar como revisada')}
                      </button>
                      <button onClick={() => aplicarAcao('ignorado')} disabled={processandoAcao}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-60"
                        style={{ background: 'rgba(255,255,255,0.06)', color: CINZA, border: '1px solid rgba(255,255,255,0.12)' }}>
                        <XCircle size={14} />{L('Ignorar', 'Ignore', 'Ignorar')}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold" style={{ color: CINZA }}>
                      {L('Status', 'Status', 'Estado')}: {LABEL_STATUS[selecionada.status][lang]}
                      {selecionada.resolvido_em && ` — ${new Date(selecionada.resolvido_em).toLocaleDateString(localeData)}`}
                    </p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </ModuloLayout>
  )
}
