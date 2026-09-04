'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Pencil, Trash2, RotateCcw, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva, obterMeuPapel } from '../../../../lib/empresaHelpers'
import { fBRL2 } from '../../../../lib/cfoCore'
import {
  obterConfigTesouraria, obterPosicaoCaixa, obterFluxoProjetado,
  calcularSimulacaoEstresse, STRESS_VARIAVEIS_NEUTRAS,
  listarCenarios, salvarCenario, atualizarCenario, excluirCenario,
  type PosicaoCaixa, type FluxoProjetadoResultado, type StressVariaveis, type CenarioTesouraria,
} from '../../../../lib/tesourariaHelpers'

type Idioma3 = 'pt' | 'en' | 'es'

const AZULC = '#6ab0ff'
const ROXO = '#a78bfa'
const VERDE = '#34d399'
const AMARELO = '#fbbf24'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const PAPEIS_CONFIG = ['dono', 'admin']

function hojeISO(): string { return new Date().toISOString().slice(0, 10) }

export default function TesourariaSimuladorPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [podeSalvar, setPodeSalvar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reservaMinima, setReservaMinima] = useState(0)
  const [posicao, setPosicao] = useState<PosicaoCaixa | null>(null)
  const [fluxo, setFluxo] = useState<FluxoProjetadoResultado | null>(null)

  const [vars, setVars] = useState<StressVariaveis>(STRESS_VARIAVEIS_NEUTRAS)
  const [cenarios, setCenarios] = useState<CenarioTesouraria[]>([])
  const [nomeCenario, setNomeCenario] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; tipo: 'erro' | 'ok' } | null>(null)

  function mostrarToast(msg: string, tipo: 'erro' | 'ok' = 'erro') {
    setToast({ msg, tipo })
    setTimeout(() => setToast(null), 4000)
  }

  async function carregarCenarios(empId: string) {
    setCenarios(await listarCenarios(empId))
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (!empId) { setLoading(false); return }

      const [papel, config] = await Promise.all([obterMeuPapel(empId), obterConfigTesouraria(empId)])
      setPodeSalvar(papel != null && PAPEIS_CONFIG.includes(papel))
      const reserva = Number(config?.reserva_minima || 0)
      setReservaMinima(reserva)

      const [pos, flx] = await Promise.all([
        obterPosicaoCaixa(empId, hojeISO(), reserva),
        obterFluxoProjetado(empId, reserva),
      ])
      setPosicao(pos)
      setFluxo(flx)
      await carregarCenarios(empId)
      setLoading(false)
    })()
  }, [])

  // Recálculo 100% síncrono a cada mudança de slider — nenhum round-trip ao
  // banco, sempre em cima do fluxo/posição REAIS já carregados.
  const simulacao = useMemo(() => {
    if (!fluxo || !posicao) return null
    return calcularSimulacaoEstresse(fluxo, posicao, reservaMinima, vars)
  }, [fluxo, posicao, reservaMinima, vars])

  function setVar<K extends keyof StressVariaveis>(k: K, valor: number) {
    setVars((prev) => ({ ...prev, [k]: valor }))
  }

  function resetar() {
    setVars(STRESS_VARIAVEIS_NEUTRAS)
    setNomeCenario('')
    setEditandoId(null)
  }

  function carregarCenarioNosControles(c: CenarioTesouraria) {
    setVars({ ...STRESS_VARIAVEIS_NEUTRAS, ...c.variaveis })
    setNomeCenario(c.nome)
    setEditandoId(c.id)
  }

  async function handleSalvar() {
    if (!empresaId) return
    const nome = nomeCenario.trim()
    if (!nome) { mostrarToast(L('Dê um nome ao cenário antes de salvar.', 'Give the scenario a name before saving.', 'Dele un nombre al escenario antes de guardar.')); return }
    setSalvando(true)
    const r = editandoId
      ? await atualizarCenario(editandoId, empresaId, nome, vars)
      : await salvarCenario(empresaId, nome, vars)
    setSalvando(false)
    if (!r.ok) { mostrarToast(L('Não foi possível salvar — tente novamente.', 'Could not save — try again.', 'No se pudo guardar — intente de nuevo.')); return }
    mostrarToast(L('Cenário salvo.', 'Scenario saved.', 'Escenario guardado.'), 'ok')
    setNomeCenario('')
    setEditandoId(null)
    await carregarCenarios(empresaId)
  }

  async function handleExcluir(id: string) {
    if (!empresaId) return
    setExcluindoId(id)
    const r = await excluirCenario(id, empresaId)
    setExcluindoId(null)
    setConfirmandoExclusao(null)
    if (!r.ok) { mostrarToast(L('Não foi possível excluir — tente novamente.', 'Could not delete — try again.', 'No se pudo eliminar — intente de nuevo.')); return }
    mostrarToast(L('Cenário excluído.', 'Scenario deleted.', 'Escenario eliminado.'), 'ok')
    if (editandoId === id) { setEditandoId(null); setNomeCenario('') }
    await carregarCenarios(empresaId)
  }

  const CONTROLES: { chave: keyof StressVariaveis; label: string; min: number; max: number; step: number; sufixo: string; tipo: 'slider' | 'valor' }[] = [
    { chave: 'receitaPct', label: L('Receita', 'Revenue', 'Ingresos'), min: -50, max: 50, step: 1, sufixo: '%', tipo: 'slider' },
    { chave: 'atrasoDiasRecebimento', label: L('Atraso dos recebimentos', 'Collections delay', 'Atraso de los cobros'), min: 0, max: 60, step: 1, sufixo: L(' dias', ' days', ' días'), tipo: 'slider' },
    { chave: 'despesasPct', label: L('Despesas', 'Expenses', 'Gastos'), min: -50, max: 50, step: 1, sufixo: '%', tipo: 'slider' },
  ]

  return (
    <ModuloLayout
      titulo={L('Simulador de Estresse', 'Stress Simulator', 'Simulador de Estrés')}
      subtitulo={L('Ajuste as variáveis e veja o impacto no caixa, ao vivo — sempre em cima do fluxo projetado real', 'Adjust the variables and see the cash impact live — always on top of the real projected cash flow', 'Ajuste las variables y vea el impacto en la caja, en vivo — siempre sobre el flujo proyectado real')}
      botaoExtra={
        <button onClick={() => router.push('/tesouraria')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(59,111,212,0.14)', color: AZULC, border: `1px solid ${AZULC}40` }}>
          {L('Voltar ao Command Center', 'Back to Command Center', 'Volver al Command Center')}
        </button>
      }
    >
      {loading ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Carregando...', 'Loading...', 'Cargando...')}</p>
      ) : !empresaId || !posicao || !fluxo || !simulacao ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* CONTROLES */}
          <div className="space-y-5">
            <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: '1px solid rgba(106,176,255,0.16)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold" style={{ color: TITULO }}>{L('Variáveis', 'Variables', 'Variables')}</h3>
                <button onClick={resetar} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: CINZA }}>
                  <RotateCcw size={12} />{L('Zerar', 'Reset', 'Restablecer')}
                </button>
              </div>

              <div className="space-y-4">
                {CONTROLES.map((c) => (
                  <div key={c.chave}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold" style={{ color: CINZA }}>{c.label}</label>
                      <span className="text-xs font-bold" style={{ color: AZULC }}>
                        {vars[c.chave] > 0 && c.min < 0 ? '+' : ''}{vars[c.chave]}{c.sufixo}
                      </span>
                    </div>
                    <input type="range" min={c.min} max={c.max} step={c.step} value={vars[c.chave]}
                      onChange={(e) => setVar(c.chave, Number(e.target.value))}
                      className="w-full accent-current" style={{ accentColor: AZULC }} />
                  </div>
                ))}

                <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: TITULO }}>{L('Nova Dívida', 'New Debt', 'Nueva Deuda')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px]" style={{ color: CINZA }}>{L('Valor (entra hoje)', 'Amount (in today)', 'Valor (entra hoy)')}</label>
                      <input type="text" inputMode="decimal" value={vars.novaDividaValor || ''} placeholder="0"
                        onChange={(e) => setVar('novaDividaValor', Number(e.target.value.replace(',', '.')) || 0)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                    </div>
                    <div>
                      <label className="text-[10px]" style={{ color: CINZA }}>{L('Parcela mensal', 'Monthly installment', 'Cuota mensual')}</label>
                      <input type="text" inputMode="decimal" value={vars.novaDividaParcelaMensal || ''} placeholder="0"
                        onChange={(e) => setVar('novaDividaParcelaMensal', Number(e.target.value.replace(',', '.')) || 0)}
                        className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold mb-2" style={{ color: TITULO }}>{L('Nova Contratação', 'New Hire', 'Nueva Contratación')}</p>
                  <label className="text-[10px]" style={{ color: CINZA }}>{L('Custo mensal', 'Monthly cost', 'Costo mensual')}</label>
                  <input type="text" inputMode="decimal" value={vars.novaContratacaoCustoMensal || ''} placeholder="0"
                    onChange={(e) => setVar('novaContratacaoCustoMensal', Number(e.target.value.replace(',', '.')) || 0)}
                    className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${AZULC}30`, color: TEXTO }} />
                </div>
              </div>
            </div>

            {/* SALVAR / EDITAR CENÁRIO */}
            {podeSalvar && (
              <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${ROXO}30` }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: TITULO }}>
                  {editandoId ? L('Editar Cenário', 'Edit Scenario', 'Editar Escenario') : L('Salvar Cenário', 'Save Scenario', 'Guardar Escenario')}
                </h3>
                <div className="flex gap-2">
                  <input type="text" value={nomeCenario} onChange={(e) => setNomeCenario(e.target.value)}
                    placeholder={L('Nome do cenário', 'Scenario name', 'Nombre del escenario')}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${ROXO}30`, color: TEXTO }} />
                  <button onClick={handleSalvar} disabled={salvando}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-60"
                    style={{ background: 'rgba(167,139,250,0.2)', color: ROXO, border: `1px solid ${ROXO}50` }}>
                    <Save size={14} />{salvando ? L('Salvando...', 'Saving...', 'Guardando...') : L('Salvar', 'Save', 'Guardar')}
                  </button>
                  {editandoId && (
                    <button onClick={resetar} className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                      <X size={14} />
                    </button>
                  )}
                </div>

                {cenarios.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {cenarios.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-xs font-semibold truncate" style={{ color: TEXTO }}>{c.nome}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => carregarCenarioNosControles(c)} className="p-1.5 rounded-lg" style={{ color: AZULC }} title={L('Editar', 'Edit', 'Editar')}>
                            <Pencil size={13} />
                          </button>
                          {confirmandoExclusao === c.id ? (
                            <>
                              <button onClick={() => handleExcluir(c.id)} disabled={excluindoId === c.id}
                                className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ background: `${VERMELHO}20`, color: VERMELHO }}>
                                {L('Confirmar', 'Confirm', 'Confirmar')}
                              </button>
                              <button onClick={() => setConfirmandoExclusao(null)} className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: CINZA }}>
                                {L('Cancelar', 'Cancel', 'Cancelar')}
                              </button>
                            </>
                          ) : (
                            <button onClick={() => setConfirmandoExclusao(c.id)} className="p-1.5 rounded-lg" style={{ color: VERMELHO }} title={L('Excluir', 'Delete', 'Eliminar')}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RESULTADO */}
          <div className="space-y-4">
            {simulacao.rupturaHorizonte != null && (
              <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: `${VERMELHO}15`, border: `1px solid ${VERMELHO}40` }}>
                <AlertTriangle size={16} style={{ color: VERMELHO, flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs font-semibold" style={{ color: VERMELHO }}>
                  {L(`Neste cenário, o caixa rompe a reserva mínima em ${simulacao.rupturaHorizonte} dias.`,
                    `In this scenario, cash breaks the minimum reserve in ${simulacao.rupturaHorizonte} days.`,
                    `En este escenario, la caja rompe la reserva mínima en ${simulacao.rupturaHorizonte} días.`)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${AZULC}25` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Caixa Disponível', 'Available Cash', 'Caja Disponible')}</p>
                <p className="text-sm md:text-lg font-bold whitespace-nowrap" style={{ color: AZULC }}>R$ {fBRL2(simulacao.caixaDisponivelSimulado)}</p>
                <p className="text-[10px]" style={{ color: CINZA }}>{L('era', 'was', 'era')} R$ {fBRL2(posicao.totalDisponivel)}</p>
              </div>
              <div className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${simulacao.liquidityScoreSimulado.cor === 'verde' ? VERDE : simulacao.liquidityScoreSimulado.cor === 'azul' ? AZULC : simulacao.liquidityScoreSimulado.cor === 'amarelo' ? AMARELO : VERMELHO}25` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{L('Liquidity Score', 'Liquidity Score', 'Liquidity Score')}</p>
                <p className="text-sm md:text-lg font-bold" style={{ color: simulacao.liquidityScoreSimulado.cor === 'verde' ? VERDE : simulacao.liquidityScoreSimulado.cor === 'azul' ? AZULC : simulacao.liquidityScoreSimulado.cor === 'amarelo' ? AMARELO : VERMELHO }}>
                  {simulacao.liquidityScoreSimulado.total}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Impacto no Saldo Projetado', 'Impact on Projected Balance', 'Impacto en el Saldo Proyectado')}</h3>
              <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                <table className="w-full text-xs" style={{ minWidth: 420 }}>
                  <thead>
                    <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                      <th className="text-left py-2 px-3 font-semibold">{L('Horizonte', 'Horizon', 'Horizonte')}</th>
                      <th className="text-right py-2 px-3 font-semibold">{L('Antes', 'Before', 'Antes')}</th>
                      <th className="text-right py-2 px-3 font-semibold">{L('Simulado', 'Simulated', 'Simulado')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulacao.pontos.map((p) => (
                      <tr key={p.horizonteDias} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <td className="py-2 px-3 font-semibold whitespace-nowrap" style={{ color: TEXTO }}>{p.horizonteDias} {L('dias', 'days', 'días')}</td>
                        <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: CINZA }}>R$ {fBRL2(p.saldoProjetadoBase)}</td>
                        <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: p.abaixoDaReserva ? VERMELHO : (p.delta >= 0 ? VERDE : AMARELO) }}>
                          R$ {fBRL2(p.saldoProjetadoSimulado)} {p.abaixoDaReserva && '🔴'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] mt-2" style={{ color: CINZA }}>
                {L('Tudo determinístico: a variação é aplicada sobre o cenário Base real (fluxo do ledger/AP/AR), nunca inventado.',
                  'Fully deterministic: the variation is applied on top of the real Base scenario (ledger/AP/AR cash flow), never invented.',
                  'Todo determinístico: la variación se aplica sobre el escenario Base real (flujo del libro/CP/CC), nunca inventado.')}
              </p>
            </div>

            {simulacao.rupturaHorizonte == null && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold w-fit" style={{ background: `${VERDE}15`, color: VERDE }}>
                <CheckCircle2 size={14} />{L('Sem ruptura de caixa neste cenário.', 'No cash rupture in this scenario.', 'Sin ruptura de caja en este escenario.')}
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
          style={{ background: toast.tipo === 'ok' ? `${VERDE}20` : `${VERMELHO}20`, color: toast.tipo === 'ok' ? VERDE : VERMELHO, border: `1px solid ${toast.tipo === 'ok' ? VERDE : VERMELHO}40` }}>
          {toast.msg}
        </div>
      )}
    </ModuloLayout>
  )
}
