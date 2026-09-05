'use client'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { RefreshCw, X, CheckCircle2, XCircle, Eye, CalendarClock, Settings, ScrollText, AlertTriangle } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../lib/empresaHelpers'
import {
  listarDescobertasFiscais, contarPorPrioridade, atualizarStatusDescobertaFiscal, rodarFiscalRadar,
  obterFiscalHealth, explicarFiscalHealth, obterObrigacoesProximas, corRiscoObrigacao,
  obterConfigFiscal, alertasReformaRelevantes,
  type DescobertaFiscal, type StatusDescoberta, type TipoDescoberta, type Confianca,
  type FiscalHealth, type ObrigacaoProxima, type ConfigFiscal,
} from '../../../lib/fiscalHelpers'
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
const ROXO = '#a78bfa'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const COR_PRIORIDADE: Record<string, string> = { P0: VERMELHO, P1: LARANJA, P2: AMARELO, P3: CINZA }
const COR_TIPO: Record<TipoDescoberta, string> = {
  risco: VERMELHO, inconsistencia: LARANJA, divergencia: LARANJA, concentracao: AMARELO,
  classificacao_suspeita: AMARELO, anomalia: AMARELO, oportunidade: VERDE, tendencia: ROXO,
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

const COR_CONFIANCA: Record<Confianca, string> = { fato: VERDE, calculo: AZULC, inferencia: AMARELO, previsao: ROXO, cenario: ROXO }

const LABEL_STATUS: Record<StatusDescoberta, Record<Idioma3, string>> = {
  aberto: { pt: 'Aberta', en: 'Open', es: 'Abierta' },
  revisado: { pt: 'Revisada', en: 'Reviewed', es: 'Revisada' },
  resolvido: { pt: 'Resolvida', en: 'Resolved', es: 'Resuelta' },
  ignorado: { pt: 'Ignorada', en: 'Ignored', es: 'Ignorada' },
}

const COR_RISCO_OBRIGACAO: Record<string, string> = { atrasada: VERMELHO, urgente: LARANJA, atencao: AMARELO, folga: VERDE }
const EMOJI_RISCO_OBRIGACAO: Record<string, string> = { atrasada: '🔴', urgente: '🟠', atencao: '🟡', folga: '🟢' }

function formatarChaveEvidencia(chave: string): string {
  return chave.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
}

function formatarValorEvidencia(v: unknown): string {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2)
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (v === null || v === undefined) return '—'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function hojeISO(): string { return new Date().toISOString().slice(0, 10) }

export default function FiscalPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const localeData = lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-BR'
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [rodando, setRodando] = useState(false)
  const [descobertas, setDescobertas] = useState<DescobertaFiscal[]>([])
  const [health, setHealth] = useState<FiscalHealth | null>(null)
  const [obrigacoesProximas, setObrigacoesProximas] = useState<ObrigacaoProxima[]>([])
  const [config, setConfig] = useState<ConfigFiscal | null>(null)
  const [mostrarTodas, setMostrarTodas] = useState(false)
  const [selecionada, setSelecionada] = useState<DescobertaFiscal | null>(null)
  const [processandoAcao, setProcessandoAcao] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  const carregar = useCallback(async (empId: string) => {
    const [desc, h, obrig, cfg] = await Promise.all([
      listarDescobertasFiscais(empId),
      obterFiscalHealth(empId, hojeISO()),
      obterObrigacoesProximas(empId, 30),
      obterConfigFiscal(empId),
    ])
    setDescobertas(desc)
    setHealth(h)
    setObrigacoesProximas(obrig)
    setConfig(cfg)
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
    if (!empresaId || !userId || rodando) return
    setRodando(true)
    setMensagem(null)
    const { novasDescobertas, erro } = await rodarFiscalRadar(empresaId, userId, lang)
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
    const { erro } = await atualizarStatusDescobertaFiscal(selecionada, status, userId)
    if (erro) setMensagem(L('Não foi possível salvar. Tente de novo.', 'Could not save. Try again.', 'No se pudo guardar. Intente de nuevo.'))
    else await carregar(empresaId)
    setProcessandoAcao(false)
    setSelecionada(null)
  }

  const contagem = contarPorPrioridade(descobertas)
  const emDia = contagem.P0 === 0 && contagem.P1 === 0
  const previsoes = descobertas.filter((d) => d.status === 'aberto' && (d.confianca === 'previsao' || d.confianca === 'cenario')).length
  const proximosSete = obrigacoesProximas.filter((o) => o.dias_restantes <= 7).length
  const visiveis = mostrarTodas ? descobertas : descobertas.filter((d) => d.status === 'aberto')
  const reforma = alertasReformaRelevantes(config?.regime_tributario || null)

  const TILES: { emoji: string; label: string; valor: number | string; cor: string }[] = [
    { emoji: '🔴', label: L('Crítico', 'Critical', 'Crítico'), valor: contagem.P0, cor: VERMELHO },
    { emoji: '🟠', label: L('Atenção', 'Attention', 'Atención'), valor: contagem.P1, cor: LARANJA },
    { emoji: '🟡', label: L('Pendências', 'Pending', 'Pendientes'), valor: contagem.P2, cor: AMARELO },
    { emoji: '🟢', label: L('Em Dia', 'On Time', 'Al Día'), valor: emDia ? L('Sim', 'Yes', 'Sí') : L('Não', 'No', 'No'), cor: emDia ? VERDE : CINZA },
    { emoji: '📅', label: L('Próx. Obrigações (7d)', 'Upcoming (7d)', 'Próx. Obligaciones (7d)'), valor: proximosSete, cor: AZULC },
    { emoji: '🔮', label: L('Previsões', 'Forecasts', 'Previsiones'), valor: previsoes, cor: ROXO },
    { emoji: '🧠', label: L('Descobertas', 'Findings', 'Hallazgos'), valor: contagem.totalAbertas, cor: AZULC },
  ]

  return (
    <ModuloLayout
      titulo={L('Fiscal', 'Tax', 'Fiscal')}
      subtitulo={L('Status fiscal da sua empresa — obrigações, descobertas e o Health Score explicado, não um formulário.', "Your company's tax status — obligations, findings, and the Health Score explained, not a form.", 'Estado fiscal de su empresa — obligaciones, hallazgos y el Health Score explicado, no un formulario.')}
      botaoExtra={
        <>
          <button onClick={() => router.push('/fiscal/obrigacoes')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: `${AZULC}18`, color: AZULC, border: `1px solid ${AZULC}40` }}>
            <CalendarClock size={15} />{L('Calendário', 'Calendar', 'Calendario')}
          </button>
          <button onClick={() => router.push('/fiscal/config')} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', color: TEXTO, border: '1px solid rgba(255,255,255,0.12)' }}>
            <Settings size={15} />{L('Atividade Fiscal', 'Tax Activity', 'Actividad Fiscal')}
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

          {!config?.atividade_fiscal && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3" style={{ background: `${AMARELO}12`, border: `1px solid ${AMARELO}35` }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: AMARELO }} />
                <p className="text-xs font-semibold" style={{ color: TEXTO }}>
                  {L('Atividade fiscal não definida — o cálculo de imposto está usando um default (Serviços) avisado.', 'Tax activity not defined — tax calculation is using a flagged default (Services).', 'Actividad fiscal no definida — el cálculo de impuestos usa un valor por defecto (Servicios) avisado.')}
                </p>
              </div>
              <button onClick={() => router.push('/fiscal/config')} className="text-[11px] font-bold whitespace-nowrap" style={{ color: AMARELO }}>
                {L('Definir agora →', 'Set it now →', 'Definir ahora →')}
              </button>
            </div>
          )}

          {/* FISCAL HEALTH SCORE — sempre explicado */}
          {health && (
            <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${AZULC}30` }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: CINZA }}>{L('Fiscal Health Score', 'Fiscal Health Score', 'Fiscal Health Score')}</p>
              <div className="flex flex-wrap items-baseline gap-3 mb-1">
                <span className="text-4xl font-black leading-none" style={{ color: health.score >= 750 ? VERDE : health.score >= 500 ? AMARELO : VERMELHO }}>{health.score}</span>
                <span className="text-xs" style={{ color: CINZA }}>/ 1000</span>
              </div>
              <p className="text-xs" style={{ color: TEXTO }}>{explicarFiscalHealth(health, lang)}</p>
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

          {/* PRÓXIMAS OBRIGAÇÕES — prévia, calendário completo em /fiscal/obrigacoes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold" style={{ color: TITULO }}>{L('Próximas Obrigações', 'Upcoming Obligations', 'Próximas Obligaciones')}</h3>
              <button onClick={() => router.push('/fiscal/obrigacoes')} className="text-[11px] font-semibold" style={{ color: AZULC }}>
                {L('Ver calendário completo →', 'See full calendar →', 'Ver calendario completo →')}
              </button>
            </div>
            {obrigacoesProximas.length === 0 ? (
              <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(10,20,36,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs" style={{ color: CINZA }}>{L('Nenhuma obrigação vencendo nos próximos 30 dias.', 'No obligation due in the next 30 days.', 'Ninguna obligación vence en los próximos 30 días.')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-xs" style={{ minWidth: 480 }}>
                  <tbody>
                    {obrigacoesProximas.slice(0, 5).map((o) => {
                      const risco = corRiscoObrigacao(o)
                      return (
                        <tr key={o.id} className="cursor-pointer hover:bg-white/[0.02]" onClick={() => router.push('/fiscal/obrigacoes')} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <td className="py-2 px-3 whitespace-nowrap">{EMOJI_RISCO_OBRIGACAO[risco]}</td>
                          <td className="py-2 px-3" style={{ color: TEXTO }}>{o.nome}</td>
                          <td className="py-2 px-3 whitespace-nowrap" style={{ color: CINZA }}>{new Date(o.data_vencimento + 'T00:00:00').toLocaleDateString(localeData)}</td>
                          <td className="py-2 px-3 whitespace-nowrap text-right font-semibold" style={{ color: COR_RISCO_OBRIGACAO[risco] }}>
                            {risco === 'atrasada' ? L('atrasada', 'overdue', 'atrasada') : L(`${o.dias_restantes}d`, `${o.dias_restantes}d`, `${o.dias_restantes}d`)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* LISTA DE DESCOBERTAS — densa, hierárquica, sem card decorativo por item */}
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
                  {L('Nenhuma descoberta ainda. Clique em "Rodar descoberta" pra a Axioma vasculhar suas obrigações e impostos.', 'No findings yet. Click "Run discovery" for Axioma to scan your obligations and taxes.', 'Ningún hallazgo aún. Haga clic en "Ejecutar descubrimiento" para que Axioma revise sus obligaciones e impuestos.')}
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

          {/* REFORMA TRIBUTÁRIA — informativo, determinístico (gerarAlertasReforma) */}
          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: TITULO }}>
              <ScrollText size={15} style={{ color: CINZA }} />{L('Reforma Tributária', 'Tax Reform', 'Reforma Tributaria')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {reforma.slice(0, 2).map((a, i) => (
                <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(10,20,36,0.6)', border: `1px solid ${a.impacto === 'negativo' ? VERMELHO : a.impacto === 'positivo' ? VERDE : CINZA}30` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold" style={{ color: TEXTO }}>{lang === 'en' ? a.titulo_en : lang === 'es' ? a.titulo_es : a.titulo}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>{a.data}</span>
                  </div>
                  <p className="text-[11px]" style={{ color: CINZA }}>{lang === 'en' ? a.descricao_en : lang === 'es' ? a.descricao_es : a.descricao}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-2" style={{ color: CINZA }}>
              {L('Educativo — regras ainda em transição, podem mudar. Fonte: pesquisa interna da Axioma sobre a Reforma Tributária 2026+.', 'Educational — rules still in transition, may change. Source: Axioma internal research on the 2026+ Tax Reform.', 'Educativo — reglas aún en transición, pueden cambiar. Fuente: investigación interna de Axioma sobre la Reforma Tributaria 2026+.')}
            </p>
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
