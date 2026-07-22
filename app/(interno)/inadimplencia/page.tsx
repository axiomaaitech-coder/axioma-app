'use client'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import ReactECharts from 'echarts-for-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, AlertTriangle, Share2, Crown, Copy, Users,
  HandCoins, CheckCircle2, Shield, Inbox,
} from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import SeletorPeriodo from '../../../components/SeletorPeriodo'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { fBRL, fPct, FONTE_EXEC, optBarrasV, optVelocimetro, resolverPeriodo, type PeriodoPreset, type Periodo } from '../../../lib/cfoCore'
import { canaisCompartilhamento } from '../../../lib/cfoTextos'
import {
  type ClienteRow, type ContaRow, montarSnapshotsCarteira, type SnapshotCarteira,
  rankingScoreAxiomaCliente, type ScoreAxiomaCliente, calcularKpisRecebimento,
  agingCarteiraRecebiveis, type Idioma3,
} from '../../../lib/clienteIntelHelpers'
import { type CobrancaCompromisso, listarCompromissos, criarCompromisso, atualizarStatusCompromisso } from '../../../lib/cobrancaHelpers'
import {
  montarLinhasRisco, calcularKpisInadimplencia, valorRecuperadoNoPeriodo,
  type LinhaRiscoInadimplencia, type NivelPrioridade,
} from '../../../lib/inadimplenciaHelpers'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============================================================================
// TEMA — Índigo/Safira profundo + acabamento platina (só em detalhes finos:
// borda de card premium, ícone de score Elite). Vermelho/âmbar/verde/azul
// continuam com o significado padrão do Axioma (perda/atenção/recuperado/neutro)
// — o índigo é identidade do módulo, nunca substitui essas cores de significado.
// ============================================================================
const INDIGO = '#4f46e5'
const SAFIRA = '#3730a3'
const PLATINA = '#c0c5ce'
const VERMELHO = '#f87171'
const AMBAR = '#f59e0b'
const VERDE = '#34d399'
const AZUL = '#6ab0ff'
const CINZA = '#5a7a9a'
const BG_CARD = 'rgba(10,22,40,0.8)'

export default function Inadimplencia() {
  const { idioma } = useLanguage()
  const lang = idioma as Idioma3
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)

  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [contas, setContas] = useState<ContaRow[]>([])
  const [compromissos, setCompromissos] = useState<CobrancaCompromisso[]>([])
  const [caixaDisponivel, setCaixaDisponivel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState<'todas' | NivelPrioridade>('todas')

  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [clienteAbertoId, setClienteAbertoId] = useState<string | null>(null)
  const [novoCompromisso, setNovoCompromisso] = useState({ conta_id: '', tipo: 'promessa' as CobrancaCompromisso['tipo'], valor_compromissado: '', data_compromissada: '', condicoes: '' })
  const [salvandoCompromisso, setSalvandoCompromisso] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const [{ data: cli }, { data: ct }, comps, { data: fc }] = await Promise.all([
      supabase.from('clientes').select('*').eq('user_id', user.id).order('nome'),
      supabase.from('contas_receber').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true }),
      listarCompromissos(),
      supabase.from('fluxo_caixa').select('valor, tipo, status').eq('user_id', user.id),
    ])
    setClientes((cli as ClienteRow[]) || [])
    setContas((ct as ContaRow[]) || [])
    setCompromissos(comps)
    setCaixaDisponivel((fc || []).filter((l: any) => l.status === 'realizado').reduce((s: number, l: any) => s + (l.tipo === 'entrada' ? Number(l.valor || 0) : -Number(l.valor || 0)), 0))
    setLoading(false)
  }

  // ========== MOTOR — 100% reaproveitado do Contas a Receber (lib/clienteIntelHelpers.ts,
  // lib/cobrancaHelpers.ts). Nada recalculado do zero, nenhuma tabela nova. ==========
  const carteira: SnapshotCarteira = useMemo(() => montarSnapshotsCarteira(clientes, contas, []), [clientes, contas])
  const ranking = useMemo(() => rankingScoreAxiomaCliente(carteira), [carteira])
  const aging = useMemo(() => agingCarteiraRecebiveis(contas), [contas])
  const kpisRecebimento = useMemo(() => calcularKpisRecebimento(contas, carteira, ranking), [contas, carteira, ranking])
  const linhasRisco = useMemo(() => montarLinhasRisco(ranking, compromissos, lang), [ranking, compromissos, lang])
  const kpis = useMemo(
    () => calcularKpisInadimplencia(contas, carteira, ranking, compromissos, kpisRecebimento.dso, caixaDisponivel),
    [contas, carteira, ranking, compromissos, kpisRecebimento.dso, caixaDisponivel]
  )
  const recuperadoPeriodo = useMemo(() => valorRecuperadoNoPeriodo(contas, periodo.inicio, periodo.fim), [contas, periodo])

  const hoje = new Date().toISOString().slice(0, 10)

  function nivelScoreLabel(n: ScoreAxiomaCliente['nivel']) {
    return { critico: L('Crítico', 'Critical', 'Crítico'), atencao: L('Atenção', 'Attention', 'Atención'), bom: L('Bom', 'Good', 'Bueno'), excelente: L('Excelente', 'Excellent', 'Excelente'), elite: 'Elite' }[n]
  }
  function nivelScoreCor(n: ScoreAxiomaCliente['nivel']) {
    return { critico: VERMELHO, atencao: AMBAR, bom: VERDE, excelente: VERDE, elite: VERDE }[n]
  }
  function prioridadeLabel(p: NivelPrioridade) {
    return { critica: L('Crítica', 'Critical', 'Crítica'), alta: L('Alta', 'High', 'Alta'), media: L('Média', 'Medium', 'Media'), baixa: L('Baixa', 'Low', 'Baja') }[p]
  }
  function prioridadeCor(p: NivelPrioridade) {
    return { critica: VERMELHO, alta: '#fb923c', media: AMBAR, baixa: AZUL }[p]
  }
  function corCompromisso(status: CobrancaCompromisso['status']) {
    return status === 'cumprido' ? VERDE : status === 'quebrado' ? VERMELHO : AMBAR
  }

  const linhasFiltradas = linhasRisco.filter((l) =>
    (filtroPrioridade === 'todas' || l.prioridade === filtroPrioridade) &&
    l.s.cliente.nome.toLowerCase().includes(busca.toLowerCase())
  )
  const rankingPioresScores = useMemo(() => [...linhasRisco].sort((a, b) => a.score.total - b.score.total).slice(0, 8), [linhasRisco])

  const linhaAberta = linhasRisco.find((l) => l.s.cliente.id === clienteAbertoId) || null
  const compromissosCliente = linhaAberta ? compromissos.filter((c) => c.cliente_id === linhaAberta.s.cliente.id).sort((a, b) => b.data_compromissada.localeCompare(a.data_compromissada)) : []
  const titulosVencidosCliente = linhaAberta ? linhaAberta.s.contas.filter((c) => c.status !== 'recebido' && c.data_vencimento < hoje) : []

  function abrirNegociacao(l: LinhaRiscoInadimplencia) {
    setClienteAbertoId(l.s.cliente.id)
    const primeiraVencida = l.s.contas.filter((c) => c.status !== 'recebido' && c.data_vencimento < hoje)[0]
    setNovoCompromisso({
      conta_id: primeiraVencida?.id || '', tipo: 'promessa',
      valor_compromissado: primeiraVencida ? String(Math.max(0, (Number(primeiraVencida.valor) || 0) - (Number(primeiraVencida.valor_recebido) || 0)).toFixed(2)) : '',
      data_compromissada: '', condicoes: '',
    })
  }
  function fecharNegociacao() { setClienteAbertoId(null) }

  async function salvarCompromisso() {
    if (!linhaAberta || !userId || !novoCompromisso.conta_id || !novoCompromisso.valor_compromissado || !novoCompromisso.data_compromissada) return
    setSalvandoCompromisso(true)
    const contaSel = linhaAberta.s.contas.find((c) => c.id === novoCompromisso.conta_id)
    await criarCompromisso(userId, {
      conta_id: novoCompromisso.conta_id, cliente_id: linhaAberta.s.cliente.id,
      tipo: novoCompromisso.tipo, valor_original: contaSel?.valor ?? null,
      valor_compromissado: parseFloat(novoCompromisso.valor_compromissado), data_compromissada: novoCompromisso.data_compromissada,
      condicoes: novoCompromisso.condicoes || null,
    })
    setCompromissos(await listarCompromissos())
    setNovoCompromisso({ conta_id: '', tipo: 'promessa', valor_compromissado: '', data_compromissada: '', condicoes: '' })
    setSalvandoCompromisso(false)
  }

  async function marcarCompromisso(id: string, status: CobrancaCompromisso['status']) {
    await atualizarStatusCompromisso(id, status)
    setCompromissos(await listarCompromissos())
  }

  // ========== KPIs (15, drill honesto — sem dado vira "sem dados suficientes") ==========
  type KpiTile = { key: string; label: string; valor: string; cor: string; vazio: boolean }
  const semContas = contas.length === 0
  const kpiTiles: KpiTile[] = [
    { key: 'total', label: L('Valor Total Inadimplente', 'Total Delinquent', 'Total Moroso'), valor: fBRL(kpis.valorTotalInadimplente), cor: VERMELHO, vazio: semContas },
    { key: 'qtd', label: L('Clientes Inadimplentes', 'Delinquent Clients', 'Clientes Morosos'), valor: String(kpis.qtdClientesInadimplentes), cor: VERMELHO, vazio: semContas },
    { key: 'pct', label: L('% de Inadimplência', 'Delinquency Rate', '% de Morosidad'), valor: kpis.pctInadimplencia != null ? fPct(kpis.pctInadimplencia) : '', cor: AMBAR, vazio: kpis.pctInadimplencia == null },
    { key: 'recMes', label: L('Recuperado no Mês', 'Recovered this Month', 'Recuperado este Mes'), valor: fBRL(kpis.valorRecuperadoMes), cor: VERDE, vazio: false },
    { key: 'recAno', label: L('Recuperado no Ano', 'Recovered this Year', 'Recuperado este Año'), valor: fBRL(kpis.valorRecuperadoAno), cor: VERDE, vazio: false },
    { key: 'negociacao', label: L('Em Negociação', 'In Negotiation', 'En Negociación'), valor: fBRL(kpis.valorEmNegociacao), cor: AZUL, vazio: kpis.valorEmNegociacao === 0 },
    { key: 'perda', label: L('Perda Provável', 'Probable Loss', 'Pérdida Probable'), valor: kpis.perdaProvavel != null ? fBRL(kpis.perdaProvavel) : '', cor: VERMELHO, vazio: kpis.perdaProvavel == null },
    { key: 'dso', label: L('DSO Ajustado', 'Adjusted DSO', 'DSO Ajustado'), valor: kpis.dsoAjustado != null ? `${kpis.dsoAjustado} ${L('dias', 'days', 'días')}` : '', cor: INDIGO, vazio: kpis.dsoAjustado == null },
    { key: 'indice', label: L('Índice de Recuperação', 'Recovery Index', 'Índice de Recuperación'), valor: kpis.indiceRecuperacao != null ? fPct(kpis.indiceRecuperacao) : '', cor: VERDE, vazio: kpis.indiceRecuperacao == null },
    { key: 'tempoRec', label: L('Tempo Médio de Recuperação', 'Avg. Recovery Time', 'Tiempo Medio de Recuperación'), valor: kpis.tempoMedioRecuperacaoDias != null ? `${kpis.tempoMedioRecuperacaoDias} ${L('dias', 'days', 'días')}` : '', cor: AZUL, vazio: kpis.tempoMedioRecuperacaoDias == null },
    { key: 'risco', label: L('Receita em Risco', 'Revenue at Risk', 'Ingreso en Riesgo'), valor: fBRL(kpis.receitaEmRisco), cor: VERMELHO, vazio: semContas },
    { key: 'fluxo', label: L('Fluxo de Caixa Comprometido', 'Cash Flow Compromised', 'Flujo de Caja Comprometido'), valor: kpis.fluxoCaixaComprometidoPct != null ? fPct(kpis.fluxoCaixaComprometidoPct) : '', cor: AMBAR, vazio: kpis.fluxoCaixaComprometidoPct == null },
    { key: 'liquidez', label: L('Impacto na Liquidez', 'Liquidity Impact', 'Impacto en Liquidez'), valor: kpis.impactoLiquidezPct != null ? fPct(kpis.impactoLiquidezPct) : '', cor: AMBAR, vazio: kpis.impactoLiquidezPct == null },
    { key: 'giro', label: L('Impacto no Capital de Giro', 'Working Capital Impact', 'Impacto en Capital de Trabajo'), valor: kpis.impactoCapitalGiroPct != null ? fPct(kpis.impactoCapitalGiroPct) : '', cor: AMBAR, vazio: kpis.impactoCapitalGiroPct == null },
    { key: 'scoreMedio', label: L('Score Médio da Carteira Inadimplente', 'Avg. Delinquent Portfolio Score', 'Score Medio de Cartera Morosa'), valor: kpis.scoreMedioCarteiraInadimplente != null ? `${kpis.scoreMedioCarteiraInadimplente}/1000` : '', cor: INDIGO, vazio: kpis.scoreMedioCarteiraInadimplente == null },
  ]

  const agingLabels = [L('0-30 dias', '0-30 days', '0-30 días'), L('31-60 dias', '31-60 days', '31-60 días'), L('61-90 dias', '61-90 days', '61-90 días'), L('90+ dias', '90+ days', '90+ días')]
  const agingCores = [AMBAR, '#f59e0b', '#ef4444', VERMELHO]
  const agingOption = aging.some((f) => f.valor > 0) ? optBarrasV(aging.map((f) => f.valor), agingLabels, VERMELHO, '#fca5a5', agingCores) : null

  const gaugeOption = optVelocimetro(kpis.scoreMedioCarteiraInadimplente ?? 0, 1000, [
    { ate: 400, cor: VERMELHO }, { ate: 600, cor: AMBAR }, { ate: 750, cor: VERDE }, { ate: 900, cor: VERDE }, { ate: 1000, cor: VERDE },
  ])

  const textoCompartilhar = `${L('Central de Recuperação Axioma', 'Axioma Recovery Center', 'Centro de Recuperación Axioma')}: ${L('inadimplente', 'delinquent', 'moroso')} ${fBRL(kpis.valorTotalInadimplente)}, ${L('recuperado no ano', 'recovered this year', 'recuperado este año')} ${fBRL(kpis.valorRecuperadoAno)}.`
  const canais = canaisCompartilhamento(textoCompartilhar, L('Inadimplência — Axioma', 'Delinquency — Axioma', 'Morosidad — Axioma'))

  const exportarPDF = async () => {
    setExportando(true)
    try {
      gerarPdfTabela({
        titulo: L('Inadimplência — Mapa Executivo de Risco', 'Delinquency — Executive Risk Map', 'Morosidad — Mapa Ejecutivo de Riesgo'),
        subtitulo: L('Centro de Inteligência de Recuperação Financeira', 'Financial Recovery Intelligence Center', 'Centro de Inteligencia de Recuperación Financiera'),
        colunas: [
          { header: 'Cliente', key: 'cliente', width: 3 },
          { header: 'Valor Devido (R$)', key: 'valor', width: 2, align: 'right' },
          { header: 'Dias Atraso', key: 'dias', width: 1, align: 'right' },
          { header: 'Score', key: 'score', width: 1, align: 'right' },
          { header: 'Prioridade', key: 'prioridade', width: 1 },
          { header: 'Status Negociação', key: 'negociacao', width: 2 },
          { header: 'Responsável', key: 'responsavel', width: 2 },
        ],
        linhas: linhasFiltradas.map((l) => ({
          cliente: l.s.cliente.nome,
          valor: l.s.valorVencido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          dias: String(l.s.diasAtrasoAtual),
          score: `${l.score.total} (${nivelScoreLabel(l.score.nivel)})`,
          prioridade: prioridadeLabel(l.prioridade),
          negociacao: l.negociacao.label,
          responsavel: l.responsavel || '-',
        })),
        resumo: [
          { label: L('Total Inadimplente', 'Total Delinquent', 'Total Moroso'), valor: fBRL(kpis.valorTotalInadimplente) },
          { label: L('Clientes Inadimplentes', 'Delinquent Clients', 'Clientes Morosos'), valor: String(kpis.qtdClientesInadimplentes) },
          { label: L('Perda Provável', 'Probable Loss', 'Pérdida Probable'), valor: kpis.perdaProvavel != null ? fBRL(kpis.perdaProvavel) : '—' },
          { label: L('Recuperado no Ano', 'Recovered this Year', 'Recuperado este Año'), valor: fBRL(kpis.valorRecuperadoAno) },
        ],
        nomeArquivo: `axioma-inadimplencia-${new Date().toISOString().slice(0, 10)}.pdf`,
      })
    } catch (err) { console.error(err) }
    setExportando(false)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl focus:outline-none text-xs'
  const inputStyle = { background: 'rgba(255,255,255,0.04)', border: `1px solid ${INDIGO}30`, color: '#c8d8f0' }
  const selectStyle = { background: 'rgba(10,22,40,0.9)', border: `1px solid ${INDIGO}30`, color: '#c8d8f0' }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#020810' }}>
      <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: INDIGO, borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <ModuloLayout
      titulo={L('Inadimplência', 'Delinquency', 'Morosidad')}
      subtitulo={L('Centro de Inteligência de Recuperação Financeira — lê o Contas a Receber, não duplica dado', 'Financial Recovery Intelligence Center — reads Accounts Receivable, never duplicates data', 'Centro de Inteligencia de Recuperación Financiera — lee Cuentas por Cobrar, no duplica datos')}
      onExportarPDF={exportarPDF}
      exportando={exportando}
      botaoExtra={
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} onClick={() => setShareAberto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: `linear-gradient(135deg, ${INDIGO}, ${SAFIRA})`, color: '#fff' }}>
          <Share2 size={16} /> {L('Compartilhar', 'Share', 'Compartir')}
        </motion.button>
      }
    >
      <div className="space-y-4">

        {/* ================= TOPO: PERÍODO + BUSCA + FILTRO ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SeletorPeriodo preset={preset} onChangePreset={setPreset} personalizado={personalizado} onChangePersonalizado={setPersonalizado} cor={INDIGO} lang={lang} />
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm px-3 py-2 rounded-xl" style={{ background: BG_CARD, border: `1px solid ${INDIGO}25` }}>
            <Search size={14} style={{ color: CINZA }} />
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={L('Buscar cliente...', 'Search client...', 'Buscar cliente...')} className="bg-transparent flex-1 focus:outline-none text-xs" style={{ color: '#c8d8f0' }} />
          </div>
          <select value={filtroPrioridade} onChange={(e) => setFiltroPrioridade(e.target.value as any)} className="px-3 py-2 rounded-xl text-xs font-bold" style={selectStyle}>
            <option value="todas">{L('Todas Prioridades', 'All Priorities', 'Todas Prioridades')}</option>
            <option value="critica">{prioridadeLabel('critica')}</option>
            <option value="alta">{prioridadeLabel('alta')}</option>
            <option value="media">{prioridadeLabel('media')}</option>
            <option value="baixa">{prioridadeLabel('baixa')}</option>
          </select>
        </div>

        <p className="text-[10px] italic" style={{ color: CINZA }}>
          {L('Recuperado no período selecionado', 'Recovered in the selected period', 'Recuperado en el período seleccionado')}: <span className="font-bold" style={{ color: VERDE }}>{fBRL(recuperadoPeriodo)}</span>
        </p>

        {/* ================= DASHBOARD EXECUTIVO — 15 KPIs ================= */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiTiles.map((k) => (
            <div key={k.key} className="rounded-2xl p-4 relative overflow-hidden" style={{ background: BG_CARD, border: `1px solid ${k.cor}30` }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${k.cor}80, transparent)` }} />
              <p className="text-[10px] font-semibold tracking-wider uppercase mb-2" style={{ color: CINZA }}>{k.label}</p>
              {k.vazio ? (
                <p className="text-xs italic" style={{ color: CINZA }}>{L('Sem dados suficientes', 'Not enough data', 'Sin datos suficientes')}</p>
              ) : (
                <p className="text-lg md:text-xl font-black" style={{ ...FONTE_EXEC, color: k.cor }}>{k.valor}</p>
              )}
            </div>
          ))}
        </div>

        {/* ================= AGING DA INADIMPLÊNCIA ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${VERMELHO}25` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4" style={{ color: VERMELHO }}>
            {L('Aging da Inadimplência', 'Delinquency Aging', 'Antigüedad de la Morosidad')}
          </p>
          {aging.every((f) => f.valor === 0) ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 size={36} style={{ color: VERDE }} className="mb-2" />
              <p className="text-sm" style={{ color: CINZA }}>{L('Nenhuma conta vencida — carteira em dia.', 'No overdue accounts — portfolio on time.', 'Sin cuentas vencidas — cartera al día.')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="grid grid-cols-2 gap-3">
                {aging.map((f, i) => (
                  <div key={f.chave} className="rounded-xl p-3 text-center" style={{ background: `${agingCores[i]}12`, border: `1px solid ${agingCores[i]}35` }}>
                    <p className="text-base font-black" style={{ color: agingCores[i] }}>{fBRL(f.valor)}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: CINZA }}>{agingLabels[i]} · {f.qtdContas} {L('títulos', 'invoices', 'títulos')}</p>
                  </div>
                ))}
              </div>
              {agingOption && <ReactECharts option={agingOption} style={{ height: 220 }} notMerge lazyUpdate />}
            </div>
          )}
        </div>

        {/* ================= SCORE DE RISCO AXIOMA ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${PLATINA}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2" style={{ color: PLATINA }}>
            <Shield size={14} /> {L('Score de Risco Axioma', 'Axioma Risk Score', 'Score de Riesgo Axioma')}
          </p>
          {ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Users size={36} style={{ color: '#1a3a5a' }} className="mb-2" />
              <p className="text-sm" style={{ color: CINZA }}>{L('Sem clientes com cobranças ainda.', 'No clients with billing yet.', 'Sin clientes con cobros aún.')}</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              <div className="flex flex-col items-center justify-center">
                <ReactECharts option={gaugeOption} style={{ height: 200, width: '100%' }} notMerge lazyUpdate />
                <p className="text-sm font-black" style={{ ...FONTE_EXEC, color: kpis.scoreMedioCarteiraInadimplente != null ? INDIGO : CINZA }}>
                  {L('Média da Carteira Inadimplente', 'Delinquent Portfolio Average', 'Promedio de Cartera Morosa')}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase mb-1" style={{ color: CINZA }}>{L('Ranking dos Maiores Riscos', 'Highest Risk Ranking', 'Ranking de Mayores Riesgos')}</p>
                {rankingPioresScores.length === 0 ? (
                  <p className="text-xs italic py-4 text-center" style={{ color: CINZA }}>{L('Nenhum cliente inadimplente.', 'No delinquent clients.', 'Ningún cliente moroso.')}</p>
                ) : rankingPioresScores.map((l, i) => (
                  <motion.button key={l.s.cliente.id} whileHover={{ scale: 1.01 }} onClick={() => abrirNegociacao(l)}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left"
                    style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${nivelScoreCor(l.score.nivel)}25` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold w-4 flex-shrink-0" style={{ color: CINZA }}>{i + 1}</span>
                      {l.score.nivel === 'elite' && <Crown size={12} style={{ color: PLATINA }} className="flex-shrink-0" />}
                      <span className="text-xs font-semibold truncate" style={{ color: '#c8d8f0' }}>{l.s.cliente.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] font-bold" style={{ color: nivelScoreCor(l.score.nivel) }}>{nivelScoreLabel(l.score.nivel)}</span>
                      <span className="text-xs font-black w-10 text-right" style={{ color: nivelScoreCor(l.score.nivel) }}>{l.score.total}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================= MAPA EXECUTIVO DE RISCO ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${INDIGO}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: INDIGO }}>
            <AlertTriangle size={14} /> {L('Mapa Executivo de Risco', 'Executive Risk Map', 'Mapa Ejecutivo de Riesgo')}
          </p>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Um cliente por linha — todo saldo vencido vem direto do Contas a Receber.', 'One client per row — all overdue balance comes directly from Accounts Receivable.', 'Un cliente por línea — todo el saldo vencido viene directo de Cuentas por Cobrar.')}</p>

          {linhasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Inbox size={48} style={{ color: '#1a3a5a' }} className="mb-4" />
              <p className="text-sm" style={{ color: CINZA }}>{linhasRisco.length === 0 ? L('Nenhum cliente inadimplente no momento.', 'No delinquent clients right now.', 'Ningún cliente moroso por el momento.') : L('Nenhum resultado para o filtro atual.', 'No results for the current filter.', 'Ningún resultado para el filtro actual.')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs border-separate" style={{ borderSpacing: '0 6px', minWidth: 1400 }}>
                <thead>
                  <tr>
                    {[
                      L('Cliente', 'Client', 'Cliente'), L('Valor Devido', 'Amount Due', 'Valor Debido'), L('Dias Atraso', 'Days Late', 'Días Atraso'),
                      L('Nº Títulos', 'Invoices', 'Nº Títulos'), L('Último Pagamento', 'Last Payment', 'Último Pago'), L('Hist. Atrasos', 'Late History', 'Hist. Atrasos'),
                      L('Prob. Recuperação', 'Recovery Prob.', 'Prob. Recuperación'), L('Prob. Perda', 'Loss Prob.', 'Prob. Pérdida'), L('Score Axioma', 'Axioma Score', 'Score Axioma'),
                      L('Prioridade', 'Priority', 'Prioridad'), L('Impacto Fin.', 'Fin. Impact', 'Impacto Fin.'), L('Responsável', 'Owner', 'Responsable'),
                      L('Negociação', 'Negotiation', 'Negociación'), '',
                    ].map((h) => (
                      <th key={h} className="text-left px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: CINZA }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linhasFiltradas.map((l, i) => (
                    <motion.tr key={l.s.cliente.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.02 }} style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <td className="px-2 py-2.5 rounded-l-xl whitespace-nowrap font-semibold" style={{ color: '#c8d8f0' }}>{l.s.cliente.nome}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap font-black" style={{ color: VERMELHO }}>{fBRL(l.s.valorVencido)}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: l.s.diasAtrasoAtual > 0 ? VERMELHO : CINZA }}>{l.s.diasAtrasoAtual || '—'}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: '#c8d8f0' }}>{l.qtdTitulos}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{l.ultimoPagamento ? new Date(l.ultimoPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: l.historicoAtrasos > 0 ? AMBAR : CINZA }}>{l.historicoAtrasos}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: l.probabilidadeRecuperacao != null ? VERDE : CINZA }}>{l.probabilidadeRecuperacao != null ? `${l.probabilidadeRecuperacao}%` : L('sem dados', 'no data', 'sin datos')}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap font-bold" style={{ color: l.probabilidadePerda != null ? VERMELHO : CINZA }}>{l.probabilidadePerda != null ? `${l.probabilidadePerda}%` : L('sem dados', 'no data', 'sin datos')}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap">
                        <span className="font-black" style={{ color: nivelScoreCor(l.score.nivel) }}>{l.score.total}</span>{' '}
                        <span className="text-[10px] font-bold" style={{ color: nivelScoreCor(l.score.nivel) }}>({nivelScoreLabel(l.score.nivel)})</span>
                      </td>
                      <td className="px-2 py-2.5 whitespace-nowrap"><span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${prioridadeCor(l.prioridade)}15`, color: prioridadeCor(l.prioridade) }}>{prioridadeLabel(l.prioridade)}</span></td>
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: '#c8d8f0' }}>{fPct(l.impactoFinanceiroPct)}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap" style={{ color: CINZA }}>{l.responsavel || '—'}</td>
                      <td className="px-2 py-2.5 whitespace-nowrap"><span className="px-2 py-0.5 rounded-lg text-[10px] font-bold" style={{ background: `${l.negociacao.cor}15`, color: l.negociacao.cor }}>{l.negociacao.label}</span></td>
                      <td className="px-2 py-2.5 rounded-r-xl whitespace-nowrap">
                        <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={() => abrirNegociacao(l)} title={L('Negociação', 'Negotiation', 'Negociación')}>
                          <HandCoins size={14} style={{ color: INDIGO }} />
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: NEGOCIAÇÃO DO CLIENTE ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {linhaAberta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={fecharNegociacao}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${INDIGO}35`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: INDIGO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{linhaAberta.s.cliente.nome}</h3>
                      <p className="text-xs mt-1" style={{ color: VERMELHO }}>{fBRL(linhaAberta.s.valorVencido)} · {linhaAberta.s.diasAtrasoAtual} {L('dias em atraso', 'days overdue', 'días de atraso')} · {L('Score', 'Score', 'Score')} <span style={{ color: nivelScoreCor(linhaAberta.score.nivel) }}>{linhaAberta.score.total}</span></p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharNegociacao} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>

                  <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Histórico de Negociação', 'Negotiation History', 'Historial de Negociación')}</p>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                    {compromissosCliente.length === 0 ? (
                      <p className="text-xs italic py-3" style={{ color: CINZA }}>{L('Nenhuma negociação registrada ainda.', 'No negotiation recorded yet.', 'Ninguna negociación registrada aún.')}</p>
                    ) : compromissosCliente.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${corCompromisso(c.status)}25` }}>
                        <div className="min-w-0">
                          <p className="text-xs font-bold" style={{ color: corCompromisso(c.status) }}>{c.tipo === 'acordo' ? L('Acordo', 'Agreement', 'Acuerdo') : L('Promessa', 'Promise', 'Promesa')} · {fBRL(c.valor_compromissado)}</p>
                          <p className="text-[10px]" style={{ color: CINZA }}>{L('Combinado para', 'Committed for', 'Comprometido para')} {new Date(c.data_compromissada + 'T00:00:00').toLocaleDateString('pt-BR')}{c.condicoes ? ` · ${c.condicoes}` : ''}</p>
                        </div>
                        {c.status === 'pendente' ? (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={() => marcarCompromisso(c.id, 'cumprido')} title={L('Cumprido', 'Fulfilled', 'Cumplido')}><CheckCircle2 size={14} style={{ color: VERDE }} /></button>
                            <button onClick={() => marcarCompromisso(c.id, 'quebrado')} title={L('Quebrado', 'Broken', 'Incumplido')}><X size={14} style={{ color: VERMELHO }} /></button>
                          </div>
                        ) : <span className="text-[10px] font-bold flex-shrink-0" style={{ color: corCompromisso(c.status) }}>{c.status === 'cumprido' ? L('Cumprido', 'Fulfilled', 'Cumplido') : L('Quebrado', 'Broken', 'Incumplido')}</span>}
                      </div>
                    ))}
                  </div>

                  {titulosVencidosCliente.length === 0 ? (
                    <p className="text-xs italic" style={{ color: CINZA }}>{L('Nenhum título vencido em aberto para negociar.', 'No open overdue invoice to negotiate.', 'Ningún título vencido abierto para negociar.')}</p>
                  ) : (
                    <div className="space-y-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-[10px] font-bold uppercase" style={{ color: INDIGO }}>{L('Registrar Negociação', 'Register Negotiation', 'Registrar Negociación')}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={novoCompromisso.conta_id} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, conta_id: e.target.value })} className={inputCls + ' col-span-2'} style={selectStyle}>
                          {titulosVencidosCliente.map((c) => (
                            <option key={c.id} value={c.id}>{c.numero_documento || c.descricao} · {fBRL(Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)))}</option>
                          ))}
                        </select>
                        <select value={novoCompromisso.tipo} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, tipo: e.target.value as CobrancaCompromisso['tipo'] })} className={inputCls} style={selectStyle}>
                          <option value="promessa">{L('Promessa', 'Promise', 'Promesa')}</option>
                          <option value="acordo">{L('Acordo', 'Agreement', 'Acuerdo')}</option>
                        </select>
                        <input type="date" value={novoCompromisso.data_compromissada} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, data_compromissada: e.target.value })} className={inputCls} style={inputStyle} />
                        <input type="number" placeholder={L('Valor combinado (R$)', 'Committed amount (R$)', 'Monto acordado (R$)')} value={novoCompromisso.valor_compromissado} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, valor_compromissado: e.target.value })} className={inputCls + ' col-span-2'} style={inputStyle} />
                        <input placeholder={L('Condições (opcional)', 'Conditions (optional)', 'Condiciones (opcional)')} value={novoCompromisso.condicoes} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, condicoes: e.target.value })} className={inputCls + ' col-span-2'} style={inputStyle} />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCompromisso} disabled={salvandoCompromisso}
                        className="w-full py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
                        style={{ background: `linear-gradient(135deg, ${SAFIRA}, ${INDIGO})`, color: '#fff' }}>
                        {salvandoCompromisso ? '...' : L('Salvar Negociação', 'Save Negotiation', 'Guardar Negociación')}
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= CENTRO DE COMPARTILHAMENTO ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {shareAberto && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-24 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setShareAberto(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${INDIGO}35` }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{L('Compartilhar', 'Share', 'Compartir')}</h3>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setShareAberto(false)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-2">
                    {canais.map((c) => (
                      <a key={c.nome} href={c.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                        style={{ background: `${c.cor}15`, color: c.cor, border: `1px solid ${c.cor}30` }}>
                        {c.nome}
                      </a>
                    ))}
                    <button onClick={() => { navigator.clipboard.writeText(textoCompartilhar); setShareAberto(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
                      style={{ background: 'rgba(255,255,255,0.05)', color: CINZA, border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Copy size={16} /> {L('Copiar texto', 'Copy text', 'Copiar texto')}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}
    </ModuloLayout>
  )
}
