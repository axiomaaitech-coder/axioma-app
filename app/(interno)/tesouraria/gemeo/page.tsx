'use client'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactECharts from 'echarts-for-react'
import { TrendingUp, Building2, Landmark, Wallet } from 'lucide-react'
import ModuloLayout from '../../../../components/ModuloLayout'
import { useLanguage } from '../../../../lib/LanguageContext'
import { obterEmpresaAtiva } from '../../../../lib/empresaHelpers'
import { optLinhaMulti, fBRL2 } from '../../../../lib/cfoCore'
import {
  obterConfigTesouraria, obterPosicaoCaixa, obterFluxoProjetado, obterDividaPendente, obterCapitalDeGiro,
  calcularLiquidityScore, calcularSimulacaoEstresse, STRESS_VARIAVEIS_NEUTRAS,
  type PosicaoCaixa, type FluxoProjetadoResultado, type CapitalDeGiro, type StressVariaveis,
} from '../../../../lib/tesourariaHelpers'

type Idioma3 = 'pt' | 'en' | 'es'
type Mudanca = 'nenhuma' | 'receita30' | 'emprestimo' | 'filial'

const AZUL = '#3b6fd4'
const AZULC = '#6ab0ff'
const ROXO = '#a78bfa'
const VERDE = '#34d399'
const AMARELO = '#fbbf24'
const VERMELHO = '#f87171'
const CINZA = '#5a7a9a'
const TEXTO = '#c8d8f0'
const TITULO = '#e2ecf7'

const CORES_SCORE: Record<string, string> = { vermelho: VERMELHO, amarelo: AMARELO, azul: AZULC, verde: VERDE }
const NIVEL_LABEL: Record<string, { pt: string; en: string; es: string }> = {
  critico: { pt: 'Crítico', en: 'Critical', es: 'Crítico' },
  atencao: { pt: 'Atenção', en: 'Attention', es: 'Atención' },
  bom: { pt: 'Bom', en: 'Good', es: 'Bueno' },
  excelente: { pt: 'Excelente', en: 'Excellent', es: 'Excelente' },
}

function hojeISO(): string { return new Date().toISOString().slice(0, 10) }

export default function TesourariaGemeoPage() {
  const { idioma } = useLanguage()
  const lang = (['pt', 'en', 'es'].includes(idioma) ? idioma : 'pt') as Idioma3
  const L = (pt: string, en: string, es: string) => (lang === 'en' ? en : lang === 'es' ? es : pt)
  const router = useRouter()

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reservaMinima, setReservaMinima] = useState(0)
  const [posicao, setPosicao] = useState<PosicaoCaixa | null>(null)
  const [fluxo, setFluxo] = useState<FluxoProjetadoResultado | null>(null)
  const [dividaPendente, setDividaPendente] = useState(0)
  const [capitalDeGiro, setCapitalDeGiro] = useState<CapitalDeGiro | null>(null)

  const [mudanca, setMudanca] = useState<Mudanca>('nenhuma')
  const [emprestimoValor, setEmprestimoValor] = useState('')
  const [emprestimoParcela, setEmprestimoParcela] = useState('')
  const [filialInvestimento, setFilialInvestimento] = useState('')
  const [filialCustoMensal, setFilialCustoMensal] = useState('')

  useEffect(() => {
    (async () => {
      setLoading(true)
      const empId = await obterEmpresaAtiva()
      setEmpresaId(empId)
      if (!empId) { setLoading(false); return }

      const config = await obterConfigTesouraria(empId)
      const reserva = Number(config?.reserva_minima || 0)
      setReservaMinima(reserva)

      const [pos, flx, divida, giro] = await Promise.all([
        obterPosicaoCaixa(empId, hojeISO(), reserva),
        obterFluxoProjetado(empId, reserva),
        obterDividaPendente(empId),
        obterCapitalDeGiro(empId),
      ])
      setPosicao(pos)
      setFluxo(flx)
      setDividaPendente(divida)
      setCapitalDeGiro(giro)
      setLoading(false)
    })()
  }, [])

  const fluxo30 = fluxo?.pontos.find((p) => p.horizonteDias === 30) || null
  const fluxo90 = fluxo?.pontos.find((p) => p.horizonteDias === 90) || null

  const scoreAtual = useMemo(() => {
    if (!posicao || !fluxo30 || !fluxo90) return null
    return calcularLiquidityScore({
      caixaDisponivel: posicao.totalDisponivel, saidasProximos30Dias: fluxo30.saidasPrevistas.base,
      reservaMinima, saldoProjetadoBase90: fluxo90.saldoProjetado.base,
    })
  }, [posicao, fluxo30, fluxo90, reservaMinima])

  // A "mudança grande" aplicada é o MESMO motor do Stress Simulator — o
  // Digital Twin é o simulador num formato estratégico, não um cálculo novo.
  const variaveis: StressVariaveis = useMemo(() => {
    if (mudanca === 'receita30') return { ...STRESS_VARIAVEIS_NEUTRAS, receitaPct: 30 }
    if (mudanca === 'emprestimo') return { ...STRESS_VARIAVEIS_NEUTRAS, novaDividaValor: Number(emprestimoValor.replace(',', '.')) || 0, novaDividaParcelaMensal: Number(emprestimoParcela.replace(',', '.')) || 0 }
    if (mudanca === 'filial') return { ...STRESS_VARIAVEIS_NEUTRAS, investimentoInicial: Number(filialInvestimento.replace(',', '.')) || 0, novaContratacaoCustoMensal: Number(filialCustoMensal.replace(',', '.')) || 0 }
    return STRESS_VARIAVEIS_NEUTRAS
  }, [mudanca, emprestimoValor, emprestimoParcela, filialInvestimento, filialCustoMensal])

  const simulacao = useMemo(() => {
    if (!fluxo || !posicao) return null
    return calcularSimulacaoEstresse(fluxo, posicao, reservaMinima, variaveis)
  }, [fluxo, posicao, reservaMinima, variaveis])

  const dividaDepois = dividaPendente + (mudanca === 'emprestimo' ? (Number(emprestimoValor.replace(',', '.')) || 0) : 0)

  const chartOption = fluxo && simulacao ? optLinhaMulti(
    [
      { nome: L('Hoje, se nada mudar', 'Today, if nothing changes', 'Hoy, si nada cambia'), dados: fluxo.pontos.map((p) => p.saldoProjetado.base), cor: AZULC, area: mudanca === 'nenhuma' },
      { nome: L('Com a mudança aplicada', 'With the change applied', 'Con el cambio aplicado'), dados: simulacao.pontos.map((p) => p.saldoProjetadoSimulado), cor: ROXO, area: mudanca !== 'nenhuma' },
    ],
    fluxo.pontos.map((p) => `${p.horizonteDias}d`),
    AZULC
  ) : null

  const MUDANCAS: { chave: Mudanca; label: string; icone: any }[] = [
    { chave: 'receita30', label: L('Receita +30%', 'Revenue +30%', 'Ingresos +30%'), icone: TrendingUp },
    { chave: 'emprestimo', label: L('Novo Empréstimo', 'New Loan', 'Nuevo Préstamo'), icone: Landmark },
    { chave: 'filial', label: L('Nova Filial', 'New Branch', 'Nueva Sucursal'), icone: Building2 },
  ]

  return (
    <ModuloLayout
      titulo={L('Gêmeo Financeiro', 'Digital Twin', 'Gemelo Financiero')}
      subtitulo={L('Como sua empresa está agora e como estará em 30/60/90 dias — com ou sem uma mudança grande', 'Where your company stands now and where it will be in 30/60/90 days — with or without one big change', 'Cómo está su empresa ahora y cómo estará en 30/60/90 días — con o sin un cambio grande')}
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
      ) : !empresaId || !posicao || !fluxo || !capitalDeGiro || !scoreAtual || !simulacao ? (
        <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma empresa ativa.', 'No active company.', 'Ninguna empresa activa.')}</p>
      ) : (
        <div className="space-y-6">

          {/* ESTADO ATUAL */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: L('Caixa Disponível', 'Available Cash', 'Caja Disponible'), valor: posicao.totalDisponivel, cor: AZULC, icone: Wallet },
              { label: L('Capital de Giro', 'Working Capital', 'Capital de Trabajo'), valor: capitalDeGiro.capitalDeGiro, cor: capitalDeGiro.capitalDeGiro >= 0 ? VERDE : VERMELHO, icone: TrendingUp },
              { label: L('Dívida Pendente', 'Outstanding Debt', 'Deuda Pendiente'), valor: dividaPendente, cor: AMARELO, icone: Landmark },
              { label: L('Liquidity Score', 'Liquidity Score', 'Liquidity Score'), valor: scoreAtual.total, cor: CORES_SCORE[scoreAtual.cor], icone: Building2, semReais: true },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl p-3 md:p-4" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${k.cor}25` }}>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: CINZA }}>{k.label}</p>
                <p className="text-sm md:text-lg font-bold whitespace-nowrap" style={{ color: k.cor }}>{(k as any).semReais ? k.valor : `R$ ${fBRL2(k.valor)}`}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] -mt-3" style={{ color: CINZA }}>
            {L(`Capital de giro = contas a receber em aberto (R$ ${fBRL2(capitalDeGiro.contasAReceberAberto)}) + estoque (R$ ${fBRL2(capitalDeGiro.valorEstoque)}) − contas a pagar em aberto (R$ ${fBRL2(capitalDeGiro.contasAPagarAberto)}).`,
              `Working capital = open receivables (R$ ${fBRL2(capitalDeGiro.contasAReceberAberto)}) + inventory (R$ ${fBRL2(capitalDeGiro.valorEstoque)}) − open payables (R$ ${fBRL2(capitalDeGiro.contasAPagarAberto)}).`,
              `Capital de trabajo = cuentas por cobrar abiertas (R$ ${fBRL2(capitalDeGiro.contasAReceberAberto)}) + inventario (R$ ${fBRL2(capitalDeGiro.valorEstoque)}) − cuentas por pagar abiertas (R$ ${fBRL2(capitalDeGiro.contasAPagarAberto)}).`)}
          </p>

          {/* SELETOR DE MUDANÇA GRANDE */}
          <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(10,20,36,0.7)', border: `1px solid ${ROXO}30` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: TITULO }}>{L('Aplicar uma mudança grande', 'Apply one big change', 'Aplicar un cambio grande')}</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setMudanca('nenhuma')}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: mudanca === 'nenhuma' ? `${AZULC}25` : 'rgba(255,255,255,0.04)', color: mudanca === 'nenhuma' ? AZULC : CINZA, border: `1px solid ${mudanca === 'nenhuma' ? AZULC : 'rgba(255,255,255,0.08)'}` }}>
                {L('Nenhuma (como está)', 'None (as is)', 'Ninguno (como está)')}
              </button>
              {MUDANCAS.map((m) => {
                const Icone = m.icone
                return (
                  <button key={m.chave} onClick={() => setMudanca(m.chave)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: mudanca === m.chave ? `${ROXO}25` : 'rgba(255,255,255,0.04)', color: mudanca === m.chave ? ROXO : CINZA, border: `1px solid ${mudanca === m.chave ? ROXO : 'rgba(255,255,255,0.08)'}` }}>
                    <Icone size={13} />{m.label}
                  </button>
                )
              })}
            </div>

            {mudanca === 'emprestimo' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px]" style={{ color: CINZA }}>{L('Valor do empréstimo', 'Loan amount', 'Monto del préstamo')}</label>
                  <input type="text" inputMode="decimal" value={emprestimoValor} onChange={(e) => setEmprestimoValor(e.target.value)} placeholder="0"
                    className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${ROXO}30`, color: TEXTO }} />
                </div>
                <div>
                  <label className="text-[10px]" style={{ color: CINZA }}>{L('Parcela mensal', 'Monthly installment', 'Cuota mensual')}</label>
                  <input type="text" inputMode="decimal" value={emprestimoParcela} onChange={(e) => setEmprestimoParcela(e.target.value)} placeholder="0"
                    className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${ROXO}30`, color: TEXTO }} />
                </div>
              </div>
            )}

            {mudanca === 'filial' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <label className="text-[10px]" style={{ color: CINZA }}>{L('Investimento inicial', 'Initial investment', 'Inversión inicial')}</label>
                  <input type="text" inputMode="decimal" value={filialInvestimento} onChange={(e) => setFilialInvestimento(e.target.value)} placeholder="0"
                    className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${ROXO}30`, color: TEXTO }} />
                </div>
                <div>
                  <label className="text-[10px]" style={{ color: CINZA }}>{L('Custo mensal adicional', 'Additional monthly cost', 'Costo mensual adicional')}</label>
                  <input type="text" inputMode="decimal" value={filialCustoMensal} onChange={(e) => setFilialCustoMensal(e.target.value)} placeholder="0"
                    className="w-full px-2 py-2 rounded-lg text-xs focus:outline-none" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${ROXO}30`, color: TEXTO }} />
                </div>
              </div>
            )}

            {chartOption && <ReactECharts option={chartOption} style={{ height: 220, width: '100%' }} notMerge lazyUpdate opts={{ renderer: 'canvas' }} />}
          </div>

          {/* COMPARATIVO ANTES / DEPOIS */}
          <div>
            <h3 className="text-sm font-bold mb-2" style={{ color: TITULO }}>{L('Antes × Depois', 'Before × After', 'Antes × Después')}</h3>
            <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
              <table className="w-full text-xs" style={{ minWidth: 480 }}>
                <thead>
                  <tr style={{ color: CINZA, background: 'rgba(255,255,255,0.03)' }}>
                    <th className="text-left py-2 px-3 font-semibold">{L('Indicador', 'Indicator', 'Indicador')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Hoje', 'Today', 'Hoy')}</th>
                    <th className="text-right py-2 px-3 font-semibold">{L('Com a mudança', 'With the change', 'Con el cambio')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="py-2 px-3 font-semibold" style={{ color: TEXTO }}>{L('Caixa disponível', 'Available cash', 'Caja disponible')}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: CINZA }}>R$ {fBRL2(posicao.totalDisponivel)}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: AZULC }}>R$ {fBRL2(simulacao.caixaDisponivelSimulado)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="py-2 px-3 font-semibold" style={{ color: TEXTO }}>{L('Saldo projetado 90d', 'Projected 90d balance', 'Saldo proyectado 90d')}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: CINZA }}>R$ {fBRL2(fluxo90?.saldoProjetado.base || 0)}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: simulacao.rupturaHorizonte ? VERMELHO : AZULC }}>
                      R$ {fBRL2(simulacao.pontos.find((p) => p.horizonteDias === 90)?.saldoProjetadoSimulado || 0)}
                    </td>
                  </tr>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="py-2 px-3 font-semibold" style={{ color: TEXTO }}>{L('Dívida pendente', 'Outstanding debt', 'Deuda pendiente')}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: CINZA }}>R$ {fBRL2(dividaPendente)}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: dividaDepois > dividaPendente ? AMARELO : AZULC }}>R$ {fBRL2(dividaDepois)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td className="py-2 px-3 font-semibold" style={{ color: TEXTO }}>{L('Liquidity Score', 'Liquidity Score', 'Liquidity Score')}</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap" style={{ color: CORES_SCORE[scoreAtual.cor] }}>{scoreAtual.total} ({NIVEL_LABEL[scoreAtual.nivel][lang]})</td>
                    <td className="text-right py-2 px-3 whitespace-nowrap font-bold" style={{ color: CORES_SCORE[simulacao.liquidityScoreSimulado.cor] }}>
                      {simulacao.liquidityScoreSimulado.total} ({NIVEL_LABEL[simulacao.liquidityScoreSimulado.nivel][lang]})
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {simulacao.rupturaHorizonte != null && (
              <p className="text-xs font-semibold mt-2" style={{ color: VERMELHO }}>
                {L(`Atenção: com essa mudança, o caixa rompe a reserva mínima em ${simulacao.rupturaHorizonte} dias.`,
                  `Careful: with this change, cash breaks the minimum reserve in ${simulacao.rupturaHorizonte} days.`,
                  `Atención: con este cambio, la caja rompe la reserva mínima en ${simulacao.rupturaHorizonte} días.`)}
              </p>
            )}
          </div>
        </div>
      )}
    </ModuloLayout>
  )
}
