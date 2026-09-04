'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactECharts from 'echarts-for-react'
import { CheckCircle2, Settings, ChevronRight, SlidersHorizontal, Building2 } from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import { useLanguage } from '../../../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../../../lib/empresaHelpers'
import { optLinhaMulti, fBRL2 } from '../../../lib/cfoCore'
import {
  obterConfigTesouraria, obterPosicaoCaixa, obterFluxoProjetado, obterDividaPendente,
  calcularLiquidityScore, explicarLiquidityScore, calcularIdleCash,
  gerarAlertasCandidatos, gravarNovosAlertas, listarAlertasAtivos, resolverAlerta,
  descreverAlerta, tituloAlertaLocalizado,
  type PosicaoCaixa, type FluxoProjetadoResultado, type AlertaTesouraria,
} from '../../../lib/tesourariaHelpers'

type Idioma3 = 'pt' | 'en' | 'es'

const AZUL = '#3b6fd4'
const AZULC = '#6ab0ff'
const VERDE = '#34d399'
const AMARELO = '#fbbf24'
const LARANJA = '#fb923c'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const PAPEIS_CONFIG = ['dono', 'admin']

const CORES_SEVERIDADE: Record<string, string> = { normal: VERDE, atencao: AMARELO, risco: LARANJA, critico: VERMELHO }
const EMOJI_SEVERIDADE: Record<string, string> = { normal: '🟢', atencao: '🟡', risco: '🟠', critico: '🔴' }
const CORES_SCORE: Record<string, string> = { vermelho: VERMELHO, amarelo: AMARELO, azul: AZULC, verde: VERDE }
const LABEL_TIPO_LIQUIDEZ: Record<string, { pt: string; en: string; es: string }> = {
  disponivel: { pt: 'Disponível', en: 'Available', es: 'Disponible' },
  aplicado: { pt: 'Aplicado', en: 'Invested', es: 'Aplicado' },
  restrito: { pt: 'Restrito', en: 'Restricted', es: 'Restringido' },
}

function hojeISO(): string { return new Date().toISOString().slice(0, 10) }

export default function TesourariaPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [papel, setPapel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservaMinima, setReservaMinima] = useState(0)
  const [posicao, setPosicao] = useState<PosicaoCaixa | null>(null)
  const [fluxo, setFluxo] = useState<FluxoProjetadoResultado | null>(null)
  const [alertas, setAlertas] = useState<AlertaTesouraria[]>([])

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (!empId) { setLoading(false); return }

      const [meuPapel, config] = await Promise.all([obterMeuPapel(empId), obterConfigTesouraria(empId)])
      setPapel(meuPapel)
      const reserva = Number(config?.reserva_minima || 0)
      setReservaMinima(reserva)

      const [pos, flx, dividaPendente] = await Promise.all([
        obterPosicaoCaixa(empId, hojeISO(), reserva),
        obterFluxoProjetado(empId, reserva),
        obterDividaPendente(empId),
      ])
      setPosicao(pos)
      setFluxo(flx)

      const candidatos = await gerarAlertasCandidatos(empId, { posicao: pos, fluxo: flx, dividaPendente })
      await gravarNovosAlertas(empId, candidatos)
      setAlertas(await listarAlertasAtivos(empId))

      setLoading(false)
    })()
  }, [])

  async function marcarResolvido(id: string) {
    if (!empresaId) return
    const r = await resolverAlerta(id, empresaId)
    if (r.ok) setAlertas((prev) => prev.filter((a) => a.id !== id))
  }

  const podeConfigurar = papel != null && PAPEIS_CONFIG.includes(papel)

  const fluxo30 = fluxo?.pontos.find((p) => p.horizonteDias === 30) || null
  const fluxo90 = fluxo?.pontos.find((p) => p.horizonteDias === 90) || null

  const score = posicao && fluxo30 && fluxo90 ? calcularLiquidityScore({
    caixaDisponivel: posicao.totalDisponivel,
    saidasProximos30Dias: fluxo30.saidasPrevistas.base,
    reservaMinima,
    saldoProjetadoBase90: fluxo90.saldoProjetado.base,
  }) : null

  const idle = posicao && fluxo30 ? calcularIdleCash(posicao.totalDisponivel, reservaMinima, fluxo30.saidasPrevistas.base) : null

  const chartOption = fluxo ? optLinhaMulti(
    [
      { nome: L('Otimista', 'Optimistic', 'Optimista'), dados: fluxo.pontos.map((p) => p.saldoProjetado.otimista), cor: VERDE, tipo: 'dashed' },
      { nome: L('Base', 'Base', 'Base'), dados: fluxo.pontos.map((p) => p.saldoProjetado.base), cor: AZULC, area: true },
      { nome: L('Estressado', 'Stressed', 'Estresado'), dados: fluxo.pontos.map((p) => p.saldoProjetado.estressado), cor: VERMELHO, tipo: 'dashed' },
    ],
    fluxo.pontos.map((p) => `${p.horizonteDias}d`),
    AZULC
  ) : null

  return (
    <ModuloLayout
      titulo={L('Tesouraria', 'Treasury', 'Tesorería')}
      subtitulo={L('Como está o caixa, o que vai acontecer e qual o risco — tudo numa visão só', 'Where cash stands, what happens next, and the risk — one view', 'Cómo está la caja, qué va a pasar y cuál es el riesgo — todo en una vista')}
      botaoExtra={
        <>
          <button onClick={() => router.push('/tesouraria/simulador')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(167,139,250,0.14)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.4)' }}>
            <SlidersHorizontal size={16} />{L('Simulador de Estresse', 'Stress Simulator', 'Simulador de Estrés')}
          </button>
          <button onClick={() => router.push('/tesouraria/gemeo')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(52,211,153,0.14)', color: VERDE, border: `1px solid ${VERDE}40` }}>
            <Building2 size={16} />{L('Gêmeo Financeiro', 'Digital Twin', 'Gemelo Financiero')}
          </button>
          {podeConfigurar && (
            <button onClick={() => router.push('/tesouraria/config')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
              <Settings size={16} />{L('Configurar', 'Settings', 'Configurar')}
            </button>
          )}
        </>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId || !posicao || !fluxo ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-6">

          {/* LIQUIDITY SCORE */}
          {score && (
            <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${CORES_SCORE[score.cor]}30` }}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-4xl md:text-5xl font-black" style={{ color: CORES_SCORE[score.cor] }}>{score.total}</div>
                <div className="flex-1 min-w-[220px]">
                  <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1" style={{ color: CORES_SCORE[score.cor] }}>
                    {L('Liquidity Score', 'Liquidity Score', 'Liquidity Score')}
                  </p>
                  <p className="text-sm" style={{ color: TEXTO }}>{explicarLiquidityScore(score, reservaMinima, lang)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                {(['cobertura', 'reserva', 'folga'] as const).map((k) => (
                  <div key={k} className="rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: CINZA }}>
                      {k === 'cobertura' ? L('Cobertura', 'Coverage', 'Cobertura') : k === 'reserva' ? L('Reserva', 'Reserve', 'Reserva') : L('Folga', 'Slack', 'Holgura')}
                    </p>
                    <p className="text-base font-bold" style={{ color: TITULO }}>{score.subscores[k]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs DE POSIÇÃO */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: L('Total Geral', 'Total', 'Total General'), valor: posicao.totalGeral, cor: AZULC },
              { label: L('Disponível', 'Available', 'Disponible'), valor: posicao.totalDisponivel, cor: VERDE },
              { label: L('Livre de Fato', 'Truly Free', 'Realmente Libre'), valor: posicao.totalLivre, cor: AMARELO },
              { label: L('Aplicado', 'Invested', 'Aplicado'), valor: posicao.totalAplicado, cor: AZUL },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${k.cor}25` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{k.label}</p>
                <p className="text-sm md:text-lg font-bold whitespace-nowrap" style={{ color: k.cor }}>R$ {fBRL2(k.valor)}</p>
              </div>
            ))}
          </div>

          {/* POSIÇÃO DE CAIXA — TABELA */}
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Posição de Caixa', 'Cash Position', 'Posición de Caja')}</h3>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full text-xs" style={{ minWidth: 480 }}>
                <thead>
                  <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left py-2 px-3 font-semibold">{L('Conta', 'Account', 'Cuenta')}</th>
                    <th className="text-left py-2 px-3 font-semibold">{L('Tipo', 'Type', 'Tipo')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Saldo', 'Balance', 'Saldo')}</th>
                    <th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>
                  {posicao.linhas.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center" style={{ color: CINZA }}>{L('Nenhuma conta de tesouraria configurada.', 'No treasury accounts configured.', 'Ninguna cuenta de tesorería configurada.')}</td></tr>
                  )}
                  {posicao.linhas.map((l) => (
                    <tr key={l.conta_id} onClick={() => router.push(`/contabilidade/razao?conta=${l.conta_id}`)}
                      className="cursor-pointer" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td className="py-2 px-3" style={{ color: TEXTO }}>
                        {l.banco_nome || l.conta_nome} <span style={{ color: CINZA }}>({l.conta_codigo})</span>
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: `${AZULC}15`, color: AZULC }}>
                          {LABEL_TIPO_LIQUIDEZ[l.tipo_liquidez][lang]}
                        </span>
                      </td>
                      <td className="text-right py-2 px-3 font-bold whitespace-nowrap" style={{ color: l.saldo >= 0 ? TEXTO : VERMELHO }}>R$ {fBRL2(l.saldo)}</td>
                      <td className="py-2 px-2 text-right"><ChevronRight size={14} style={{ color: CINZA }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* IDLE CASH */}
          {idle && idle.valor > 0 && (
            <div className="rounded-2xl p-4" style={{ background: `${AMARELO}0f`, border: `1px solid ${AMARELO}35` }}>
              <p className="text-sm font-bold" style={{ color: AMARELO }}>
                {L('Caixa Potencialmente Ocioso', 'Potentially Idle Cash', 'Caja Potencialmente Ociosa')}: R$ {fBRL2(idle.valor)}
              </p>
              <p className="text-xs mt-1" style={{ color: TEXTO }}>
                {L(
                  `Disponível (R$ ${fBRL2(idle.caixaDisponivel)}) − reserva mínima (R$ ${fBRL2(idle.reservaMinima)}) − saídas previstas em 30 dias (R$ ${fBRL2(idle.saidasProximos30Dias)}).`,
                  `Available (R$ ${fBRL2(idle.caixaDisponivel)}) − minimum reserve (R$ ${fBRL2(idle.reservaMinima)}) − payments due in 30 days (R$ ${fBRL2(idle.saidasProximos30Dias)}).`,
                  `Disponible (R$ ${fBRL2(idle.caixaDisponivel)}) − reserva mínima (R$ ${fBRL2(idle.reservaMinima)}) − pagos previstos en 30 días (R$ ${fBRL2(idle.saidasProximos30Dias)}).`
                )}
              </p>
            </div>
          )}

          {/* FLUXO PROJETADO */}
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Fluxo Projetado', 'Projected Cash Flow', 'Flujo Proyectado')}</h3>
            {chartOption && <ReactECharts option={chartOption} style={{ height: 240, width: '100%' }} notMerge lazyUpdate opts={{ renderer: 'canvas' }} />}
            <div className="overflow-x-auto rounded-2xl mt-2" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full text-xs" style={{ minWidth: 460 }}>
                <thead>
                  <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left py-2 px-3 font-semibold">{L('Horizonte', 'Horizon', 'Horizonte')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Otimista', 'Optimistic', 'Optimista')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Base', 'Base', 'Base')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Estressado', 'Stressed', 'Estresado')}</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.pontos.map((p) => (
                    <tr key={p.horizonteDias} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <td className="py-2 px-3 font-semibold whitespace-nowrap" style={{ color: TEXTO }}>{p.horizonteDias} {L('dias', 'days', 'días')}</td>
                      <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: VERDE }}>R$ {fBRL2(p.saldoProjetado.otimista)}</td>
                      <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: p.abaixoDaReserva.base ? VERMELHO : AZULC }}>
                        R$ {fBRL2(p.saldoProjetado.base)} {p.abaixoDaReserva.base && '🔴'}
                      </td>
                      <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: p.abaixoDaReserva.estressado ? VERMELHO : LARANJA }}>
                        R$ {fBRL2(p.saldoProjetado.estressado)} {p.abaixoDaReserva.estressado && '🔴'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] mt-2" style={{ color: CINZA }}>
              {fluxo.amostraAtrasoAR > 0 || fluxo.amostraAtrasoAP > 0
                ? L(
                    `Desvio calculado do histórico real: ${(fluxo.fracaoAtrasoAR * 100).toFixed(0)}% do recebido chega atrasado (${fluxo.amostraAtrasoAR} contas), sobretaxa média de atraso em pagamentos de ${(fluxo.fatorAtrasoAP * 100).toFixed(0)}% (${fluxo.amostraAtrasoAP} contas).`,
                    `Deviation from real history: ${(fluxo.fracaoAtrasoAR * 100).toFixed(0)}% of collections arrive late (${fluxo.amostraAtrasoAR} bills), average late-payment surcharge of ${(fluxo.fatorAtrasoAP * 100).toFixed(0)}% (${fluxo.amostraAtrasoAP} bills).`,
                    `Desvío calculado del historial real: ${(fluxo.fracaoAtrasoAR * 100).toFixed(0)}% de lo cobrado llega atrasado (${fluxo.amostraAtrasoAR} cuentas), sobretasa media de atraso en pagos de ${(fluxo.fatorAtrasoAP * 100).toFixed(0)}% (${fluxo.amostraAtrasoAP} cuentas).`
                  )
                : L('Sem histórico suficiente ainda para calcular desvio real — cenários Base e Estressado equivalem ao Otimista até haver mais dado.', 'Not enough history yet to calculate a real deviation — Base and Stressed scenarios match Optimistic until more data exists.', 'Historial insuficiente aún para calcular un desvío real — los escenarios Base y Estresado igualan al Optimista hasta que haya más datos.')}
            </p>
          </div>

          {/* TREASURY RADAR */}
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Treasury Radar', 'Treasury Radar', 'Treasury Radar')}</h3>
            {alertas.length === 0 ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold w-fit" style={{ background: `${VERDE}15`, color: VERDE }}>
                <CheckCircle2 size={14} />{L('Nenhum risco detectado no momento.', 'No risk detected right now.', 'Ningún riesgo detectado por ahora.')}
              </div>
            ) : (
              <div className="space-y-2">
                {alertas.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${CORES_SEVERIDADE[a.severidade]}30` }}>
                    <span className="text-base leading-none">{EMOJI_SEVERIDADE[a.severidade]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: CORES_SEVERIDADE[a.severidade] }}>{tituloAlertaLocalizado(a.tipo, lang)}</p>
                      <p className="text-xs mt-0.5" style={{ color: TEXTO }}>{descreverAlerta(a, lang)}</p>
                    </div>
                    <button onClick={() => marcarResolvido(a.id)}
                      className="text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                      style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                      {L('Resolver', 'Resolve', 'Resolver')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </ModuloLayout>
  )
}
