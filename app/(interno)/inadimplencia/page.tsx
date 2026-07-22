'use client'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../lib/LanguageContext'
import { createBrowserClient } from '@supabase/ssr'
import ReactECharts from 'echarts-for-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, AlertTriangle, Share2, Crown, Copy, Users,
  HandCoins, CheckCircle2, Shield, Inbox, Bell, Brain, MessageSquare,
  Plus, Trash2, Pencil, Phone, Sparkles, Calculator, TrendingUp, PiggyBank, BarChart3,
} from 'lucide-react'
import ModuloLayout from '../../../components/ModuloLayout'
import SeletorPeriodo from '../../../components/SeletorPeriodo'
import { gerarPdfTabela } from '../../../lib/gerarPdfTabela'
import { fBRL, fPct, FONTE_EXEC, optBarrasV, optVelocimetro, optRosca, resolverPeriodo, type PeriodoPreset, type Periodo } from '../../../lib/cfoCore'
import { canaisCompartilhamento } from '../../../lib/cfoTextos'
import { calcularImpostoRegime } from '../../../lib/iaTributariaHelpers'
import {
  type ClienteRow, type ContaRow, montarSnapshotsCarteira, type SnapshotCarteira,
  rankingScoreAxiomaCliente, type ScoreAxiomaCliente, calcularKpisRecebimento,
  agingCarteiraRecebiveis, type Idioma3,
} from '../../../lib/clienteIntelHelpers'
import {
  type CobrancaCompromisso, type CobrancaInteracao, type EtapaRegua, CANAIS_REGUA,
  listarCompromissos, criarCompromisso, atualizarStatusCompromisso, atualizarCompromisso,
  listarInteracoes, criarInteracao, listarEtapasRegua, salvarEtapaRegua, excluirEtapaRegua,
} from '../../../lib/cobrancaHelpers'
import {
  montarLinhasRisco, calcularKpisInadimplencia, valorRecuperadoNoPeriodo,
  detectarAlertasInadimplencia, gerarSinaisPrevencao, recomendarEstrategiasRecuperacao,
  etapasEscalonamentoPadrao, nomeEstagioEscalonamento, ORDEM_ESTAGIO_ESCALONAMENTO, COR_ESTAGIO_ESCALONAMENTO,
  simularCenariosRecuperacao, type AlavancasRecuperacao,
  previsaoRecuperacaoMultiHorizonte,
  perdaEsperadaPorFaixaAging, avaliarCustoBeneficioCobranca,
  simularImpactoProvisaoNaDRE, atualizarProvisaoNaDRE,
  curvaABCInadimplencia, evolucaoInadimplencia, agruparInadimplenciaPorCampo, rankingMaiorRecuperacao,
  type LinhaRiscoInadimplencia, type NivelPrioridade, type EstagioEscalonamento,
} from '../../../lib/inadimplenciaHelpers'
import { heatmapInadimplencia } from '../../../lib/previsaoRecebimentoHelpers'

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
const CATEGORIAS_CASO = ['Vendas', 'Serviços', 'Mensalidade', 'Consultoria', 'Outros']

export default function Inadimplencia() {
  const { idioma } = useLanguage()
  const lang = idioma as Idioma3
  const L = (pt: string, en: string, es: string) => (idioma === 'en' ? en : idioma === 'es' ? es : pt)

  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [contas, setContas] = useState<ContaRow[]>([])
  const [compromissos, setCompromissos] = useState<CobrancaCompromisso[]>([])
  const [interacoes, setInteracoes] = useState<CobrancaInteracao[]>([])
  const [etapasRegua, setEtapasRegua] = useState<EtapaRegua[]>([])
  const [caixaDisponivel, setCaixaDisponivel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  const [shareAberto, setShareAberto] = useState(false)

  // ========== FASE 3 — Ponto de Partida automático pro Simulador (leitura só,
  // mesmo padrão já usado no Simulador do Contas a Receber) ==========
  const [receitasRows, setReceitasRows] = useState<{ valor: number; data: string }[]>([])
  const [custosFixosRows, setCustosFixosRows] = useState<{ valor_mensal: number }[]>([])
  const [custosVarRows, setCustosVarRows] = useState<{ valor: number }[]>([])
  const [dividasRows, setDividasRows] = useState<{ valor_total: number; valor_pago: number; taxa_juros: number }[]>([])
  const [regimeTributario, setRegimeTributario] = useState('')
  const [dreHistoricoAtual, setDreHistoricoAtual] = useState<{ id: string; periodo_inicio: string; periodo_fim: string; receita_bruta: number; deducoes: number; custo_variavel: number; custo_fixo: number; despesas_financeiras: number } | null>(null)

  const [descontoAVistaPct, setDescontoAVistaPct] = useState('10')
  const [pctAceitaParcelamento, setPctAceitaParcelamento] = useState('30')
  const [reducaoJurosPct, setReducaoJurosPct] = useState('20')
  const [aumentoPrazoDias, setAumentoPrazoDias] = useState('15')
  const [pctRecuperacaoParcial, setPctRecuperacaoParcial] = useState('20')
  const [pctPerdaTotal, setPctPerdaTotal] = useState('10')
  const [pctAntecipadoSim, setPctAntecipadoSim] = useState('0')
  const [taxaDesagioSim, setTaxaDesagioSim] = useState('2')

  const [custoMedioCobranca, setCustoMedioCobranca] = useState('50')
  const [salvandoProvisao, setSalvandoProvisao] = useState(false)
  const [provisaoSalva, setProvisaoSalva] = useState(false)

  const contaCasoVazio = { cliente_id: '', descricao: '', valor: '', data_vencimento: '', numero_documento: '', categoria: 'Outros', responsavel: '', observacoes: '' }
  const [nc, setNc] = useState({ ...contaCasoVazio })
  const [modalCaso, setModalCaso] = useState(false)
  const [editandoCaso, setEditandoCaso] = useState<ContaRow | null>(null)
  const [salvandoCaso, setSalvandoCaso] = useState(false)

  const [busca, setBusca] = useState('')
  const [filtroPrioridade, setFiltroPrioridade] = useState<'todas' | NivelPrioridade>('todas')

  const [preset, setPreset] = useState<PeriodoPreset>('mes_atual')
  const [personalizado, setPersonalizado] = useState<Periodo>(resolverPeriodo('mes_atual'))
  const periodo = resolverPeriodo(preset, personalizado)

  const [clienteAbertoId, setClienteAbertoId] = useState<string | null>(null)
  const compromissoVazio = { conta_id: '', tipo: 'promessa' as CobrancaCompromisso['tipo'], valor_compromissado: '', data_compromissada: '', condicoes: '', parcelas: '', desconto_pct: '', juros_pct: '', multa_pct: '', responsavel: '' }
  const [novoCompromisso, setNovoCompromisso] = useState({ ...compromissoVazio })
  const [editandoCompromissoId, setEditandoCompromissoId] = useState<string | null>(null)
  const [salvandoCompromisso, setSalvandoCompromisso] = useState(false)

  const contatoVazio = { conta_id: '', tipo: 'contato' as CobrancaInteracao['tipo'], canal: 'telefone', descricao: '' }
  const [novoContato, setNovoContato] = useState({ ...contatoVazio })
  const [salvandoContato, setSalvandoContato] = useState(false)

  const [editandoEtapa, setEditandoEtapa] = useState<Partial<EtapaRegua> | null>(null)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)
    const [
      { data: empresa }, { data: cli }, { data: ct }, comps, interacoesData, etapasData, { data: fc },
      { data: rec }, { data: cf }, { data: cv }, { data: div }, { data: dreRows },
    ] = await Promise.all([
      supabase.from('empresas').select('id, regime_tributario').eq('user_id', user.id).maybeSingle(),
      supabase.from('clientes').select('*').eq('user_id', user.id).order('nome'),
      supabase.from('contas_receber').select('*').eq('user_id', user.id).order('data_vencimento', { ascending: true }),
      listarCompromissos(),
      listarInteracoes(),
      listarEtapasRegua(user.id),
      supabase.from('fluxo_caixa').select('valor, tipo, status').eq('user_id', user.id),
      supabase.from('receitas').select('valor, data').eq('user_id', user.id),
      supabase.from('custos_fixos').select('valor_mensal').eq('user_id', user.id),
      supabase.from('custos_variaveis').select('valor').eq('user_id', user.id),
      supabase.from('dividas').select('valor_total, valor_pago, taxa_juros').eq('user_id', user.id),
      supabase.from('dre_historico').select('*').eq('user_id', user.id).eq('periodo_inicio', resolverPeriodo('mes_atual').inicio).eq('periodo_fim', resolverPeriodo('mes_atual').fim).maybeSingle(),
    ])
    setEmpresaId(empresa?.id || null)
    setRegimeTributario(empresa?.regime_tributario || '')
    setClientes((cli as ClienteRow[]) || [])
    setContas((ct as ContaRow[]) || [])
    setCompromissos(comps)
    setInteracoes(interacoesData)
    setEtapasRegua(etapasData)
    setCaixaDisponivel((fc || []).filter((l: any) => l.status === 'realizado').reduce((s: number, l: any) => s + (l.tipo === 'entrada' ? Number(l.valor || 0) : -Number(l.valor || 0)), 0))
    setReceitasRows(rec || [])
    setCustosFixosRows(cf || [])
    setCustosVarRows(cv || [])
    setDividasRows(div || [])
    setDreHistoricoAtual(dreRows as any || null)
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
  const alertas = useMemo(() => detectarAlertasInadimplencia(lang, carteira, contas, ranking, compromissos, aging), [lang, carteira, contas, ranking, compromissos, aging])
  const sinaisPrevencao = useMemo(() => gerarSinaisPrevencao(lang, carteira, contas, ranking, linhasRisco, compromissos), [lang, carteira, contas, ranking, linhasRisco, compromissos])
  const valorVencidoMedio = linhasRisco.length > 0 ? linhasRisco.reduce((s, l) => s + l.s.valorVencido, 0) / linhasRisco.length : 0
  const etapasEscalonamento = useMemo(() => [...etapasRegua].filter((e) => !!e.estagio).sort((a, b) => a.dias_relativos - b.dias_relativos), [etapasRegua])

  // ========== FASE 3 — PREVISÃO, SIMULADOR, PERDA ESPERADA E ANALYTICS ==========
  // Mesma leitura "Ponto de Partida automático" e mesmas fórmulas já usadas no
  // Simulador do Contas a Receber (Fase 3) — não recalculado do zero, mesma
  // média anual, mesmo cálculo de alíquota efetiva via calcularImpostoRegime.
  const anoAtual = new Date().getFullYear()
  const receitaBrutaAno = receitasRows.filter((r) => r.data && new Date(r.data).getFullYear() === anoAtual).reduce((s, r) => s + (Number(r.valor) || 0), 0)
  const receitaMensalAtual = receitaBrutaAno > 0 ? receitaBrutaAno / 12 : receitasRows.reduce((s, r) => s + (Number(r.valor) || 0), 0) / 12
  const custoFixoMensalAtual = custosFixosRows.reduce((s, c) => s + (Number(c.valor_mensal) || 0), 0)
  const custoVariavelMensalAtual = custosVarRows.reduce((s, c) => s + (Number(c.valor) || 0), 0) / 12
  const despesasFinanceirasMensalAtual = dividasRows.reduce((s, d) => s + Math.max(0, (Number(d.valor_total) || 0) - (Number(d.valor_pago) || 0)) * ((Number(d.taxa_juros) || 0) / 100), 0)
  const impostoMensalEstimado = calcularImpostoRegime(regimeTributario, receitaBrutaAno, receitaMensalAtual)
  const aliquotaEfetivaPct = receitaMensalAtual > 0 ? (impostoMensalEstimado / receitaMensalAtual) * 100 : 0
  const temDadosSimulador = receitaMensalAtual > 0

  const baseSimulador = { receitaMensalAtual, custoFixoMensalAtual, custoVariavelMensalAtual, despesasFinanceirasMensalAtual, aliquotaEfetivaPct, saldoCaixaAtual: caixaDisponivel, valorTotalInadimplente: kpis.valorTotalInadimplente }
  const alavancasSim: AlavancasRecuperacao = {
    descontoAVistaPct: parseFloat(descontoAVistaPct) || 0, pctAceitaParcelamento: parseFloat(pctAceitaParcelamento) || 0,
    reducaoJurosPct: parseFloat(reducaoJurosPct) || 0, aumentoPrazoDias: parseFloat(aumentoPrazoDias) || 0,
    pctRecuperacaoParcial: parseFloat(pctRecuperacaoParcial) || 0, pctPerdaTotal: parseFloat(pctPerdaTotal) || 0,
    pctAntecipado: parseFloat(pctAntecipadoSim) || 0, taxaDesagioAntecipacaoPct: parseFloat(taxaDesagioSim) || 0,
  }
  const cenariosRecuperacao = useMemo(() => simularCenariosRecuperacao(baseSimulador, alavancasSim), [
    receitaMensalAtual, custoFixoMensalAtual, custoVariavelMensalAtual, despesasFinanceirasMensalAtual, aliquotaEfetivaPct, caixaDisponivel, kpis.valorTotalInadimplente,
    descontoAVistaPct, pctAceitaParcelamento, reducaoJurosPct, aumentoPrazoDias, pctRecuperacaoParcial, pctPerdaTotal, pctAntecipadoSim, taxaDesagioSim,
  ])

  const previsaoRecuperacao = useMemo(() => previsaoRecuperacaoMultiHorizonte(linhasRisco), [linhasRisco])
  const perdaPorFaixa = useMemo(() => perdaEsperadaPorFaixaAging(linhasRisco), [linhasRisco])
  const custoBeneficio = useMemo(() => avaliarCustoBeneficioCobranca(linhasRisco, parseFloat(custoMedioCobranca) || 0), [linhasRisco, custoMedioCobranca])
  const naoValeAPena = custoBeneficio.filter((c) => !c.valeAPena)

  const impactoDRE = useMemo(() => {
    if (!dreHistoricoAtual || kpis.perdaProvavel == null) return null
    return simularImpactoProvisaoNaDRE({
      receitaBruta: dreHistoricoAtual.receita_bruta, deducoes: dreHistoricoAtual.deducoes,
      custoVariavel: dreHistoricoAtual.custo_variavel, custoFixo: dreHistoricoAtual.custo_fixo,
      despesasFinanceiras: dreHistoricoAtual.despesas_financeiras,
    }, kpis.perdaProvavel)
  }, [dreHistoricoAtual, kpis.perdaProvavel])

  const heatmapData = useMemo(() => heatmapInadimplencia(carteira), [carteira])
  const curvaABC = useMemo(() => curvaABCInadimplencia(linhasRisco), [linhasRisco])
  const evolucao = useMemo(() => evolucaoInadimplencia(contas), [contas])
  const distribuicaoEstado = useMemo(() => agruparInadimplenciaPorCampo(linhasRisco, lang, 'estado'), [linhasRisco, lang])
  const distribuicaoSegmento = useMemo(() => agruparInadimplenciaPorCampo(linhasRisco, lang, 'segmento'), [linhasRisco, lang])
  const rankingRecuperacao = useMemo(() => rankingMaiorRecuperacao(carteira), [carteira])

  async function salvarProvisaoDRE() {
    if (!userId || !dreHistoricoAtual || kpis.perdaProvavel == null) return
    setSalvandoProvisao(true)
    const r = await atualizarProvisaoNaDRE(userId, dreHistoricoAtual.periodo_inicio, dreHistoricoAtual.periodo_fim, kpis.perdaProvavel)
    setSalvandoProvisao(false)
    setProvisaoSalva(r.atualizado)
  }

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
  function severidadeCor(s: 'positivo' | 'atencao' | 'critico') {
    return s === 'critico' ? VERMELHO : s === 'atencao' ? AMBAR : VERDE
  }
  const alertasCriticos = alertas.filter((a) => a.severidade === 'critico').length
  const alertasAtencao = alertas.filter((a) => a.severidade === 'atencao').length

  const linhasFiltradas = linhasRisco.filter((l) =>
    (filtroPrioridade === 'todas' || l.prioridade === filtroPrioridade) &&
    l.s.cliente.nome.toLowerCase().includes(busca.toLowerCase())
  )
  const rankingPioresScores = useMemo(() => [...linhasRisco].sort((a, b) => a.score.total - b.score.total).slice(0, 8), [linhasRisco])

  const linhaAberta = linhasRisco.find((l) => l.s.cliente.id === clienteAbertoId) || null
  const compromissosCliente = linhaAberta ? compromissos.filter((c) => c.cliente_id === linhaAberta.s.cliente.id).sort((a, b) => b.data_compromissada.localeCompare(a.data_compromissada)) : []
  const titulosVencidosCliente = linhaAberta ? linhaAberta.s.contas.filter((c) => c.status !== 'recebido' && c.data_vencimento < hoje) : []

  const interacoesCliente = linhaAberta ? interacoes.filter((i) => i.cliente_id === linhaAberta.s.cliente.id).sort((a, b) => b.data.localeCompare(a.data)) : []
  const estrategiasCliente = linhaAberta ? recomendarEstrategiasRecuperacao(lang, linhaAberta, valorVencidoMedio) : []
  type ItemTimeline = { data: string; tipo: 'compromisso' | 'interacao'; item: CobrancaCompromisso | CobrancaInteracao }
  const timelineCliente: ItemTimeline[] = linhaAberta ? [
    ...compromissosCliente.map((c) => ({ data: c.data_compromissada, tipo: 'compromisso' as const, item: c })),
    ...interacoesCliente.map((i) => ({ data: i.data, tipo: 'interacao' as const, item: i })),
  ].sort((a, b) => b.data.localeCompare(a.data)) : []

  function abrirNegociacao(l: LinhaRiscoInadimplencia) {
    setClienteAbertoId(l.s.cliente.id)
    setEditandoCompromissoId(null)
    const primeiraVencida = l.s.contas.filter((c) => c.status !== 'recebido' && c.data_vencimento < hoje)[0]
    setNovoCompromisso({
      ...compromissoVazio,
      conta_id: primeiraVencida?.id || '',
      valor_compromissado: primeiraVencida ? String(Math.max(0, (Number(primeiraVencida.valor) || 0) - (Number(primeiraVencida.valor_recebido) || 0)).toFixed(2)) : '',
      responsavel: primeiraVencida?.responsavel || '',
    })
    setNovoContato({ ...contatoVazio, conta_id: primeiraVencida?.id || '' })
  }
  function fecharNegociacao() { setClienteAbertoId(null) }

  async function salvarCompromisso() {
    if (!linhaAberta || !userId || !novoCompromisso.conta_id || !novoCompromisso.valor_compromissado || !novoCompromisso.data_compromissada) return
    setSalvandoCompromisso(true)
    const contaSel = linhaAberta.s.contas.find((c) => c.id === novoCompromisso.conta_id)
    const payload = {
      conta_id: novoCompromisso.conta_id, cliente_id: linhaAberta.s.cliente.id,
      tipo: novoCompromisso.tipo, valor_original: contaSel?.valor ?? null,
      valor_compromissado: parseFloat(novoCompromisso.valor_compromissado), data_compromissada: novoCompromisso.data_compromissada,
      condicoes: novoCompromisso.condicoes || null,
      parcelas: novoCompromisso.parcelas ? parseInt(novoCompromisso.parcelas, 10) : null,
      desconto_pct: novoCompromisso.desconto_pct ? parseFloat(novoCompromisso.desconto_pct) : null,
      juros_pct: novoCompromisso.juros_pct ? parseFloat(novoCompromisso.juros_pct) : null,
      multa_pct: novoCompromisso.multa_pct ? parseFloat(novoCompromisso.multa_pct) : null,
      responsavel: novoCompromisso.responsavel || null,
    }
    if (editandoCompromissoId) {
      await atualizarCompromisso(editandoCompromissoId, payload)
    } else {
      await criarCompromisso(userId, payload)
    }
    setCompromissos(await listarCompromissos())
    setNovoCompromisso({ ...compromissoVazio })
    setEditandoCompromissoId(null)
    setSalvandoCompromisso(false)
  }

  function editarCompromisso(c: CobrancaCompromisso) {
    setEditandoCompromissoId(c.id)
    setNovoCompromisso({
      conta_id: c.conta_id, tipo: c.tipo, valor_compromissado: String(c.valor_compromissado ?? ''),
      data_compromissada: c.data_compromissada, condicoes: c.condicoes || '',
      parcelas: c.parcelas != null ? String(c.parcelas) : '', desconto_pct: c.desconto_pct != null ? String(c.desconto_pct) : '',
      juros_pct: c.juros_pct != null ? String(c.juros_pct) : '', multa_pct: c.multa_pct != null ? String(c.multa_pct) : '',
      responsavel: c.responsavel || '',
    })
  }
  function cancelarEdicaoCompromisso() { setEditandoCompromissoId(null); setNovoCompromisso({ ...compromissoVazio }) }

  async function marcarCompromisso(id: string, status: CobrancaCompromisso['status']) {
    await atualizarStatusCompromisso(id, status)
    setCompromissos(await listarCompromissos())
  }

  async function registrarContato() {
    if (!linhaAberta || !userId || !novoContato.conta_id || !novoContato.descricao.trim()) return
    setSalvandoContato(true)
    await criarInteracao(userId, {
      conta_id: novoContato.conta_id, cliente_id: linhaAberta.s.cliente.id,
      tipo: novoContato.tipo, canal: novoContato.canal, descricao: novoContato.descricao,
      data: new Date().toISOString().slice(0, 10),
    })
    setInteracoes(await listarInteracoes())
    setNovoContato({ ...contatoVazio, conta_id: novoContato.conta_id })
    setSalvandoContato(false)
  }

  // ========== RÉGUA DE RECUPERAÇÃO ESCALONADA ==========
  function abrirNovaEtapa(estagio?: EstagioEscalonamento) {
    setEditandoEtapa({ dias_relativos: 1, canal: 'email', mensagem_modelo: '', ativo: true, ordem: etapasEscalonamento.length, estagio: estagio || 'amigavel' })
  }
  async function salvarEtapa() {
    if (!editandoEtapa || !userId || !editandoEtapa.mensagem_modelo?.trim()) return
    await salvarEtapaRegua(userId, editandoEtapa)
    setEtapasRegua(await listarEtapasRegua(userId))
    setEditandoEtapa(null)
  }
  async function excluirEtapa(id: string) {
    await excluirEtapaRegua(id)
    setEtapasRegua(etapasRegua.filter((e) => e.id !== id))
  }
  async function usarEscalonamentoPadrao() {
    if (!userId) return
    for (const etapa of etapasEscalonamentoPadrao()) await salvarEtapaRegua(userId, etapa)
    setEtapasRegua(await listarEtapasRegua(userId))
  }

  // ========== NOVO CASO — registra manualmente um título vencido que ainda não
  // está no Contas a Receber. Grava DIRETO em contas_receber (a mesma fonte de
  // verdade lida em toda a tela), nunca numa tabela paralela — o "novo caso" É
  // uma conta a receber vencida, não um registro duplicado. Cliente sempre
  // escolhido do cadastro existente, nunca redigitado. ==========
  function abrirNovoCaso() { setEditandoCaso(null); setNc({ ...contaCasoVazio }); setModalCaso(true) }
  function abrirEdicaoCaso(c: ContaRow) {
    setEditandoCaso(c)
    setNc({
      cliente_id: c.cliente_id || '', descricao: c.descricao || '', valor: String(c.valor ?? ''),
      data_vencimento: c.data_vencimento || '', numero_documento: c.numero_documento || '',
      categoria: c.categoria || 'Outros', responsavel: c.responsavel || '', observacoes: c.observacoes || '',
    })
    setModalCaso(true)
  }
  function fecharModalCaso() { setModalCaso(false); setEditandoCaso(null) }

  async function salvarCaso() {
    if (!userId || !nc.cliente_id || !nc.descricao.trim() || !nc.valor || !nc.data_vencimento) return
    setSalvandoCaso(true)
    const payload: any = {
      cliente_id: nc.cliente_id, descricao: nc.descricao, valor: parseFloat(nc.valor),
      data_vencimento: nc.data_vencimento, numero_documento: nc.numero_documento || null,
      categoria: nc.categoria, responsavel: nc.responsavel || null, observacoes: nc.observacoes || null,
      empresa_id: empresaId,
    }
    if (editandoCaso) {
      await supabase.from('contas_receber').update(payload).eq('id', editandoCaso.id)
    } else {
      await supabase.from('contas_receber').insert({ ...payload, status: 'pendente', user_id: userId })
    }
    const { data: ct } = await supabase.from('contas_receber').select('*').eq('user_id', userId).order('data_vencimento', { ascending: true })
    setContas((ct as ContaRow[]) || [])
    fecharModalCaso()
    setSalvandoCaso(false)
  }

  async function excluirCaso(id: string) {
    await supabase.from('contas_receber').delete().eq('id', id)
    setContas(contas.filter((c) => c.id !== id))
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

  // ========== FASE 3 — GRÁFICOS ==========
  function nomeCenario(n: 'conservador' | 'base' | 'otimista' | 'adverso') {
    return { conservador: L('Conservador', 'Conservative', 'Conservador'), base: L('Base', 'Base', 'Base'), otimista: L('Otimista', 'Optimistic', 'Optimista'), adverso: L('Adverso', 'Adverse', 'Adverso') }[n]
  }
  function corCenario(n: 'conservador' | 'base' | 'otimista' | 'adverso') {
    return { conservador: AMBAR, base: AZUL, otimista: VERDE, adverso: VERMELHO }[n]
  }

  const nomesClientesHeatmap = [...new Set(heatmapData.map((c) => c.clienteNome))]
  const heatmapOption = heatmapData.length > 0 ? {
    backgroundColor: 'transparent',
    tooltip: { position: 'top', backgroundColor: 'rgba(10,8,30,0.97)', borderColor: VERMELHO, textStyle: { color: '#e2e8f0', fontSize: 12 }, formatter: (p: any) => `<b>${p.name}</b><br/>${fBRL(p.value[2])}` },
    grid: { left: 100, right: 20, top: 10, bottom: 30 },
    xAxis: { type: 'category', data: ['0-30', '31-60', '61-90', '90+'], splitArea: { show: true }, axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 700 }, axisLine: { lineStyle: { color: 'rgba(148,163,184,0.18)' } } },
    yAxis: { type: 'category', data: nomesClientesHeatmap, splitArea: { show: true }, axisLabel: { color: '#cbd5e1', fontSize: 10 }, axisLine: { show: false } },
    visualMap: { min: 0, max: Math.max(1, ...heatmapData.map((c) => c.valor)), calculable: false, show: false, inRange: { color: ['rgba(248,113,113,0.06)', AMBAR, VERMELHO] } },
    series: [{ type: 'heatmap', data: heatmapData.map((c) => [['0-30', '31-60', '61-90', '90+'].indexOf(c.faixa), nomesClientesHeatmap.indexOf(c.clienteNome), c.valor]), label: { show: false }, itemStyle: { borderColor: '#020810', borderWidth: 2, borderRadius: 4 } }],
  } : null

  const evolucaoOption = evolucao.some((s) => s.value > 0) ? optBarrasV(evolucao.map((s) => s.value), evolucao.map((s) => s.label), VERMELHO, '#fca5a5') : null

  const PALETA_GRUPOS = [INDIGO, VERMELHO, AMBAR, VERDE, AZUL, PLATINA, '#a78bfa', SAFIRA]
  const donutGrupos = (grupos: { chave: string; valor: number }[]) => grupos.length > 0 ? optRosca(
    grupos.slice(0, 8).map((g, i) => ({ name: g.chave, value: g.valor, color: PALETA_GRUPOS[i % PALETA_GRUPOS.length] })),
    INDIGO, L('Total', 'Total', 'Total'),
  ) : null

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

  const labelInput = 'text-[10px] font-semibold tracking-wider uppercase mb-1 block'
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
      onNovo={abrirNovoCaso}
      labelBotao={L('Novo Caso', 'New Case', 'Nuevo Caso')}
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

        {/* ================= PAINEL DE ALERTAS INTELIGENTES ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${alertasCriticos > 0 ? VERMELHO : alertasAtencao > 0 ? AMBAR : VERDE}30` }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: alertasCriticos > 0 ? VERMELHO : VERDE }}>
              <Bell size={14} /> {L('Alertas Inteligentes', 'Smart Alerts', 'Alertas Inteligentes')}
            </p>
            <div className="flex items-center gap-2">
              {alertasCriticos > 0 && <span className="px-2.5 py-1 rounded-lg text-[10px] font-black" style={{ background: `${VERMELHO}20`, color: VERMELHO }}>{alertasCriticos} {L('críticos', 'critical', 'críticos')}</span>}
              {alertasAtencao > 0 && <span className="px-2.5 py-1 rounded-lg text-[10px] font-black" style={{ background: `${AMBAR}20`, color: AMBAR }}>{alertasAtencao} {L('atenção', 'attention', 'atención')}</span>}
            </div>
          </div>
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <CheckCircle2 size={32} style={{ color: VERDE }} className="mb-2" />
              <p className="text-sm" style={{ color: CINZA }}>{L('Nenhum alerta no momento.', 'No alerts right now.', 'Sin alertas por el momento.')}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {alertas.map((a, i) => (
                <motion.button key={i} whileHover={{ scale: 1.005 }}
                  onClick={() => a.clienteId && setClienteAbertoId(a.clienteId)}
                  className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: `${severidadeCor(a.severidade)}0c`, border: `1px solid ${severidadeCor(a.severidade)}30`, cursor: a.clienteId ? 'pointer' : 'default' }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: severidadeCor(a.severidade) }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold" style={{ color: severidadeCor(a.severidade) }}>{a.titulo}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#c8d8f0' }}>{a.descricao}</p>
                    <p className="text-[10px] mt-1 italic" style={{ color: CINZA }}>{L('Ação sugerida', 'Suggested action', 'Acción sugerida')}: {a.acao}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
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

        {/* ================= IA DE PREVENÇÃO ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${INDIGO}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: INDIGO }}>
            <Brain size={14} /> {L('IA de Prevenção', 'Prevention AI', 'IA de Prevención')}
          </p>
          <p className="text-[10px] mb-4 italic" style={{ color: CINZA }}>
            {L('Modo por regras — nenhum texto aqui foi gerado por um modelo de linguagem.', 'Rule-based mode — no text here was generated by a language model.', 'Modo por reglas — ningún texto aquí fue generado por un modelo de lenguaje.')}
          </p>
          {sinaisPrevencao.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes para gerar análise ainda.', 'Not enough data to generate analysis yet.', 'Sin datos suficientes para generar análisis aún.')}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {sinaisPrevencao.map((c, i) => (
                <div key={i} className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${INDIGO}20` }}>
                  <p className="text-xs font-black mb-2" style={{ color: INDIGO }}>{c.tema}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('O que aconteceu', 'What happened', 'Qué pasó')}:</span> {c.oQueAconteceu}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('Por quê', 'Why', 'Por qué')}:</span> {c.porQue}</p>
                  <p className="text-xs mb-1.5" style={{ color: '#c8d8f0' }}><span style={{ color: CINZA }}>{L('Impacto', 'Impact', 'Impacto')}:</span> {c.impacto}</p>
                  <p className="text-xs font-semibold" style={{ color: VERDE }}><span style={{ color: CINZA, fontWeight: 400 }}>{L('Melhor estratégia', 'Best strategy', 'Mejor estrategia')}:</span> {c.acao}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= RÉGUA DE RECUPERAÇÃO ESCALONADA ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${PLATINA}30` }}>
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2" style={{ color: PLATINA }}>
              <MessageSquare size={14} /> {L('Régua de Recuperação Escalonada', 'Escalated Recovery Ladder', 'Regla de Recuperación Escalonada')}
            </p>
            <div className="flex items-center gap-2">
              {etapasEscalonamento.length === 0 && (
                <button onClick={usarEscalonamentoPadrao} className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${PLATINA}15`, color: PLATINA, border: `1px solid ${PLATINA}30` }}>
                  {L('Usar escalonamento padrão', 'Use default ladder', 'Usar escalonamiento predeterminado')}
                </button>
              )}
              <button onClick={() => abrirNovaEtapa()} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: `${INDIGO}20`, color: INDIGO, border: `1px solid ${INDIGO}30` }}>
                <Plus size={12} /> {L('Nova Etapa', 'New Step', 'Nueva Etapa')}
              </button>
            </div>
          </div>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Cobrança amigável → formal → protesto → jurídico → negativação. Só organiza os degraus — nenhuma ação real dispara nesta fase.', 'Friendly → formal → protest → legal → credit blacklist. Only organizes the steps — no real action fires in this phase.', 'Amistoso → formal → protesto → jurídico → negativación. Solo organiza los pasos — ninguna acción real dispara en esta fase.')}</p>
          {etapasEscalonamento.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Nenhuma etapa configurada ainda.', 'No steps configured yet.', 'Ninguna etapa configurada aún.')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {ORDEM_ESTAGIO_ESCALONAMENTO.map((estagio) => {
                const etapa = etapasEscalonamento.find((e) => e.estagio === estagio)
                if (!etapa) return null
                const cor = COR_ESTAGIO_ESCALONAMENTO[estagio]
                return (
                  <div key={etapa.id} className="rounded-xl p-3 min-w-[180px] flex-1" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${etapa.ativo ? cor + '40' : 'rgba(255,255,255,0.08)'}` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black" style={{ color: etapa.ativo ? cor : CINZA }}>{nomeEstagioEscalonamento(lang, estagio)}</span>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setEditandoEtapa(etapa)}><Pencil size={11} style={{ color: AZUL }} /></button>
                        <button onClick={() => excluirEtapa(etapa.id)}><Trash2 size={11} style={{ color: VERMELHO }} /></button>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md inline-block mb-1.5" style={{ background: 'rgba(255,255,255,0.06)', color: CINZA }}>
                      D+{etapa.dias_relativos} · {etapa.canal}
                    </span>
                    <p className="text-[10px] line-clamp-2" style={{ color: '#c8d8f0' }}>{etapa.mensagem_modelo}</p>
                  </div>
                )
              })}
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

        {/* ================= SIMULADOR EXECUTIVO DE RECUPERAÇÃO ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${INDIGO}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: INDIGO }}>
            <Calculator size={14} /> {L('Simulador Executivo de Recuperação', 'Executive Recovery Simulator', 'Simulador Ejecutivo de Recuperación')}
          </p>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Ajuste as alavancas e veja o impacto em caixa, EBITDA e lucro — reaproveita o mesmo motor de DRE de Investimentos/Simulações.', 'Adjust the levers and see the impact on cash, EBITDA and profit — reuses the same DRE engine from Investments/Simulations.', 'Ajuste las palancas y vea el impacto en caja, EBITDA y ganancia — reutiliza el mismo motor de DRE de Inversiones/Simulaciones.')}</p>
          {!temDadosSimulador ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes de Receitas para simular ainda.', 'Not enough Revenue data to simulate yet.', 'Sin datos suficientes de Ingresos para simular aún.')}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('Desconto à Vista %', 'Cash Discount %', 'Descuento al Contado %')}</label><input type="number" value={descontoAVistaPct} onChange={(e) => setDescontoAVistaPct(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('% Aceita Parcelar', '% Accepts Installments', '% Acepta Cuotas')}</label><input type="number" value={pctAceitaParcelamento} onChange={(e) => setPctAceitaParcelamento(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('Redução de Juros %', 'Interest Reduction %', 'Reducción de Interés %')}</label><input type="number" value={reducaoJurosPct} onChange={(e) => setReducaoJurosPct(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('Aumento de Prazo (dias)', 'Extra Term (days)', 'Aumento de Plazo (días)')}</label><input type="number" value={aumentoPrazoDias} onChange={(e) => setAumentoPrazoDias(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('% Recuperação Parcial', '% Partial Recovery', '% Recuperación Parcial')}</label><input type="number" value={pctRecuperacaoParcial} onChange={(e) => setPctRecuperacaoParcial(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('% Perda Total', '% Total Loss', '% Pérdida Total')}</label><input type="number" value={pctPerdaTotal} onChange={(e) => setPctPerdaTotal(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('% Antecipado', '% Anticipated', '% Anticipado')}</label><input type="number" value={pctAntecipadoSim} onChange={(e) => setPctAntecipadoSim(e.target.value)} className={inputCls} style={inputStyle} /></div>
                <div><label className={labelInput} style={{ color: PLATINA }}>{L('Deságio na Antecipação %', 'Anticipation Discount %', 'Descuento en Anticipación %')}</label><input type="number" value={taxaDesagioSim} onChange={(e) => setTaxaDesagioSim(e.target.value)} className={inputCls} style={inputStyle} /></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cenariosRecuperacao.map((c) => (
                  <div key={c.nome} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${corCenario(c.nome)}30` }}>
                    <p className="text-[10px] font-bold uppercase mb-2" style={{ color: corCenario(c.nome) }}>{nomeCenario(c.nome)}</p>
                    <p className="text-[10px]" style={{ color: CINZA }}>{L('Recuperado', 'Recovered', 'Recuperado')}</p>
                    <p className="text-sm font-black mb-1.5" style={{ color: VERDE }}>{fBRL(c.valorRecuperado)}</p>
                    <p className="text-[10px]" style={{ color: CINZA }}>{L('Perda Assumida', 'Assumed Loss', 'Pérdida Asumida')}</p>
                    <p className="text-sm font-black mb-1.5" style={{ color: VERMELHO }}>{fBRL(c.perdaAssumida)}</p>
                    <p className="text-[10px]" style={{ color: CINZA }}>{L('EBITDA Mensal', 'Monthly EBITDA', 'EBITDA Mensual')}</p>
                    <p className="text-xs font-bold mb-1.5" style={{ color: '#c8d8f0' }}>{fBRL(c.ebitdaMensal)}</p>
                    <p className="text-[10px]" style={{ color: CINZA }}>{L('Caixa Projetado', 'Projected Cash', 'Caja Proyectada')}</p>
                    <p className="text-xs font-bold" style={{ color: c.saldoCaixaProjetado >= 0 ? VERDE : VERMELHO }}>{fBRL(c.saldoCaixaProjetado)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ================= PREVISÃO DE RECUPERAÇÃO MULTI-HORIZONTE ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${AZUL}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: AZUL }}>
            <TrendingUp size={14} /> {L('Previsão de Recuperação Multi-Horizonte', 'Multi-Horizon Recovery Forecast', 'Previsión de Recuperación Multi-Horizonte')}
          </p>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Quanto do saldo vencido tende a ser recuperado até cada prazo, por confiança.', 'How much of the overdue balance tends to be recovered by each deadline, by confidence.', 'Cuánto del saldo vencido tiende a recuperarse hasta cada plazo, por confianza.')}</p>
          {kpis.valorTotalInadimplente === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: CINZA }}>{L('Nenhum saldo vencido pra projetar.', 'No overdue balance to project.', 'Ningún saldo vencido para proyectar.')}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {previsaoRecuperacao.map((p) => (
                <div key={p.horizonteDias} className="rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${AZUL}20` }}>
                  <p className="text-[10px] font-black mb-1.5" style={{ color: AZUL }}>{p.horizonteDias} {L('dias', 'days', 'días')}</p>
                  <p className="text-[9px]" style={{ color: VERDE }}>{L('Otimista', 'Optimistic', 'Optimista')}: {fBRL(p.otimista)}</p>
                  <p className="text-[9px]" style={{ color: AZUL }}>{L('Provável', 'Probable', 'Probable')}: {fBRL(p.provavel)}</p>
                  <p className="text-[9px]" style={{ color: AMBAR }}>{L('Conservador', 'Conservative', 'Conservador')}: {fBRL(p.conservador)}</p>
                  <p className="text-[9px]" style={{ color: VERMELHO }}>{L('Improvável', 'Unlikely', 'Improbable')}: {fBRL(p.improvavel)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= PERDA ESPERADA (PCLD) + CUSTO-BENEFÍCIO + IMPACTO NA DRE ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${VERMELHO}25` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2" style={{ color: VERMELHO }}>
            <PiggyBank size={14} /> {L('Perda Esperada — Provisão PCLD', 'Expected Loss — PCLD Provision', 'Pérdida Esperada — Provisión PCLD')}
          </p>
          <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Dos valores vencidos, quanto tende a virar perda — por faixa de aging.', 'Of the overdue amounts, how much tends to become a loss — by aging bucket.', 'De los valores vencidos, cuánto tiende a convertirse en pérdida — por rango de antigüedad.')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {perdaPorFaixa.map((f) => (
              <div key={f.faixa} className="rounded-xl p-3 text-center" style={{ background: `${VERMELHO}0c`, border: `1px solid ${VERMELHO}30` }}>
                <p className="text-[10px] mb-1" style={{ color: CINZA }}>{f.faixa} {L('dias', 'days', 'días')}</p>
                <p className="text-sm font-black" style={{ color: '#c8d8f0' }}>{fBRL(f.valorVencido)}</p>
                <p className="text-xs font-bold mt-1" style={{ color: f.perdaEsperada != null ? VERMELHO : CINZA }}>{f.perdaEsperada != null ? fBRL(f.perdaEsperada) : L('sem dados suficientes', 'not enough data', 'sin datos suficientes')}</p>
              </div>
            ))}
          </div>

          {impactoDRE && (
            <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${INDIGO}25` }}>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: INDIGO }}>{L('Impacto Simulado na DRE (mês atual)', 'Simulated DRE Impact (current month)', 'Impacto Simulado en la DRE (mes actual)')}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px]" style={{ color: CINZA }}>{L('Margem Líquida Atual', 'Current Net Margin', 'Margen Neto Actual')}</p>
                  <p className="text-sm font-black" style={{ color: '#c8d8f0' }}>{fPct(impactoDRE.dreAtual.margemLiquidaPct)}</p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: CINZA }}>{L('Margem com Provisão', 'Margin with Provision', 'Margen con Provisión')}</p>
                  <p className="text-sm font-black" style={{ color: VERMELHO }}>{fPct(impactoDRE.dreComProvisao.margemLiquidaPct)}</p>
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarProvisaoDRE} disabled={salvandoProvisao}
                className="mt-3 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                style={{ background: `${INDIGO}20`, color: INDIGO, border: `1px solid ${INDIGO}30` }}>
                {salvandoProvisao ? '...' : provisaoSalva ? L('Provisão salva na DRE ✓', 'Provision saved to DRE ✓', 'Provisión guardada en la DRE ✓') : L('Salvar provisão na DRE do período', 'Save provision to period DRE', 'Guardar provisión en la DRE del período')}
              </motion.button>
            </div>
          )}

          <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Custo de Cobrança × Valor Recuperável', 'Collection Cost × Recoverable Value', 'Costo de Cobro × Valor Recuperable')}</p>
          <div className="flex items-center gap-2 mb-3">
            <label className="text-xs" style={{ color: CINZA }}>{L('Custo médio estimado por título (R$)', 'Estimated avg. cost per invoice (R$)', 'Costo medio estimado por título (R$)')}:</label>
            <input type="number" value={custoMedioCobranca} onChange={(e) => setCustoMedioCobranca(e.target.value)} className="w-24 px-2 py-1 rounded-lg text-xs" style={inputStyle} />
          </div>
          {naoValeAPena.length === 0 ? (
            <p className="text-xs italic py-3" style={{ color: CINZA }}>{L('Nenhum título sinalizado como "não vale a pena perseguir".', 'No invoice flagged as "not worth pursuing".', 'Ningún título señalado como "no vale la pena perseguir".')}</p>
          ) : (
            <div className="space-y-1.5">
              {naoValeAPena.slice(0, 8).map((c) => (
                <div key={c.linha.s.cliente.id} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: `${VERMELHO}0c`, border: `1px solid ${VERMELHO}20` }}>
                  <span className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{c.linha.s.cliente.nome}</span>
                  <span className="text-[10px]" style={{ color: VERMELHO }}>{L('Custo', 'Cost', 'Costo')} {fBRL(c.custoEstimado)} &gt; {L('recuperável', 'recoverable', 'recuperable')} {fBRL(c.valorRecuperavelEstimado)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= ANÁLISES EXECUTIVAS ================= */}
        <div className="rounded-2xl p-4 md:p-5" style={{ background: BG_CARD, border: `1px solid ${PLATINA}30` }}>
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-2" style={{ color: PLATINA }}>
            <BarChart3 size={14} /> {L('Análises Executivas', 'Executive Analytics', 'Análisis Ejecutivos')}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Heatmap da Inadimplência', 'Delinquency Heatmap', 'Heatmap de Morosidad')}</p>
              {heatmapOption ? <ReactECharts option={heatmapOption} style={{ height: Math.max(160, nomesClientesHeatmap.length * 26) }} notMerge lazyUpdate /> : <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem contas vencidas.', 'No overdue accounts.', 'Sin cuentas vencidas.')}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Evolução Mensal', 'Monthly Evolution', 'Evolución Mensual')}</p>
              {evolucaoOption ? <ReactECharts option={evolucaoOption} style={{ height: 220 }} notMerge lazyUpdate /> : <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes.', 'Not enough data.', 'Sin datos suficientes.')}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Distribuição por Estado', 'Distribution by State', 'Distribución por Estado')}</p>
              {donutGrupos(distribuicaoEstado) ? <ReactECharts option={donutGrupos(distribuicaoEstado)!} style={{ height: 220 }} notMerge lazyUpdate /> : <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes.', 'Not enough data.', 'Sin datos suficientes.')}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Distribuição por Segmento', 'Distribution by Segment', 'Distribución por Segmento')}</p>
              {donutGrupos(distribuicaoSegmento) ? <ReactECharts option={donutGrupos(distribuicaoSegmento)!} style={{ height: 220 }} notMerge lazyUpdate /> : <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes.', 'Not enough data.', 'Sin datos suficientes.')}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Curva ABC da Inadimplência', 'ABC Curve of Delinquency', 'Curva ABC de la Morosidad')}</p>
              {curvaABC.length === 0 ? <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem dados suficientes.', 'Not enough data.', 'Sin datos suficientes.')}</p> : (
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {curvaABC.slice(0, 10).map((c) => (
                    <div key={c.clienteId} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-[11px] truncate" style={{ color: '#c8d8f0' }}>{c.nome}</span>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: c.classe === 'A' ? VERMELHO : c.classe === 'B' ? AMBAR : VERDE }}>{c.classe} · {fBRL(c.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Ranking de Maior Recuperação', 'Top Recovery Ranking', 'Ranking de Mayor Recuperación')}</p>
              {rankingRecuperacao.length === 0 ? <p className="text-xs text-center py-8" style={{ color: CINZA }}>{L('Sem recuperações registradas.', 'No recoveries recorded.', 'Sin recuperaciones registradas.')}</p> : (
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {rankingRecuperacao.map((r, i) => (
                    <div key={r.chave} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-[11px] truncate" style={{ color: '#c8d8f0' }}>{i + 1}. {r.chave}</span>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: VERDE }}>{fBRL(r.valor)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: CENTRAL DE NEGOCIAÇÃO DO CLIENTE ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {linhaAberta && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={fecharNegociacao}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${INDIGO}35`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: INDIGO }}>AXIOMA AI.TECH — {L('Central de Negociação', 'Negotiation Center', 'Central de Negociación')}</p>
                      <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{linhaAberta.s.cliente.nome}</h3>
                      <p className="text-xs mt-1" style={{ color: VERMELHO }}>{fBRL(linhaAberta.s.valorVencido)} · {linhaAberta.s.diasAtrasoAtual} {L('dias em atraso', 'days overdue', 'días de atraso')} · {L('Score', 'Score', 'Score')} <span style={{ color: nivelScoreCor(linhaAberta.score.nivel) }}>{linhaAberta.score.total}</span></p>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharNegociacao} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>

                  {/* Títulos em aberto — editar carrega os dados de volta, sem duplicar */}
                  <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Títulos em Aberto', 'Open Invoices', 'Títulos Abiertos')}</p>
                  <div className="space-y-1.5 mb-4">
                    {titulosVencidosCliente.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${VERMELHO}20` }}>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: '#c8d8f0' }}>{c.numero_documento || c.descricao}</p>
                          <p className="text-[10px]" style={{ color: CINZA }}>{fBRL(Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)))} · {L('venceu em', 'due', 'venció el')} {new Date(c.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => abrirEdicaoCaso(c)} title={L('Editar', 'Edit', 'Editar')}><Pencil size={13} style={{ color: AZUL }} /></button>
                          <button onClick={() => excluirCaso(c.id)} title={L('Excluir', 'Delete', 'Eliminar')}><Trash2 size={13} style={{ color: VERMELHO }} /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estratégia recomendada — destaque da Fase 2 */}
                  {estrategiasCliente.length > 0 && (
                    <div className="mb-4 rounded-xl p-3" style={{ background: `${INDIGO}0c`, border: `1px solid ${INDIGO}30` }}>
                      <p className="text-[10px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: INDIGO }}><Sparkles size={12} /> {L('Estratégia Recomendada', 'Recommended Strategy', 'Estrategia Recomendada')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {estrategiasCliente.map((e) => (
                          <div key={e.tipo} className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                            <p className="text-[11px] font-semibold" style={{ color: '#c8d8f0' }}>{e.label}</p>
                            <p className="text-xs font-black" style={{ color: VERDE }}>~{e.probabilidadeEstimada}% {L('de recuperar', 'to recover', 'de recuperar')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] font-bold uppercase mb-2" style={{ color: CINZA }}>{L('Timeline de Interações', 'Interaction Timeline', 'Cronología de Interacciones')}</p>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1">
                    {timelineCliente.length === 0 ? (
                      <p className="text-xs italic py-3" style={{ color: CINZA }}>{L('Nenhuma interação registrada ainda.', 'No interaction recorded yet.', 'Ninguna interacción registrada aún.')}</p>
                    ) : timelineCliente.map((t) => t.tipo === 'compromisso' ? (() => {
                      const c = t.item as CobrancaCompromisso
                      return (
                        <div key={`c-${c.id}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${corCompromisso(c.status)}25` }}>
                          <div className="min-w-0">
                            <p className="text-xs font-bold" style={{ color: corCompromisso(c.status) }}>{c.tipo === 'acordo' ? L('Acordo', 'Agreement', 'Acuerdo') : L('Promessa', 'Promise', 'Promesa')} · {fBRL(c.valor_compromissado)}{c.parcelas ? ` · ${c.parcelas}x` : ''}</p>
                            <p className="text-[10px]" style={{ color: CINZA }}>{L('Combinado para', 'Committed for', 'Comprometido para')} {new Date(c.data_compromissada + 'T00:00:00').toLocaleDateString('pt-BR')}{c.condicoes ? ` · ${c.condicoes}` : ''}{c.responsavel ? ` · ${c.responsavel}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {c.status === 'pendente' ? (
                              <>
                                <button onClick={() => editarCompromisso(c)} title={L('Editar', 'Edit', 'Editar')}><Pencil size={13} style={{ color: AZUL }} /></button>
                                <button onClick={() => marcarCompromisso(c.id, 'cumprido')} title={L('Cumprido', 'Fulfilled', 'Cumplido')}><CheckCircle2 size={14} style={{ color: VERDE }} /></button>
                                <button onClick={() => marcarCompromisso(c.id, 'quebrado')} title={L('Quebrado', 'Broken', 'Incumplido')}><X size={14} style={{ color: VERMELHO }} /></button>
                              </>
                            ) : <span className="text-[10px] font-bold" style={{ color: corCompromisso(c.status) }}>{c.status === 'cumprido' ? L('Cumprido', 'Fulfilled', 'Cumplido') : L('Quebrado', 'Broken', 'Incumplido')}</span>}
                          </div>
                        </div>
                      )
                    })() : (() => {
                      const it = t.item as CobrancaInteracao
                      return (
                        <div key={`i-${it.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${AZUL}20` }}>
                          <Phone size={12} style={{ color: AZUL }} className="flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{it.descricao}</p>
                            <p className="text-[10px]" style={{ color: CINZA }}>{new Date(it.data + 'T00:00:00').toLocaleDateString('pt-BR')}{it.canal ? ` · ${it.canal}` : ''}</p>
                          </div>
                        </div>
                      )
                    })())}
                  </div>

                  {titulosVencidosCliente.length === 0 ? (
                    <p className="text-xs italic" style={{ color: CINZA }}>{L('Nenhum título vencido em aberto para negociar.', 'No open overdue invoice to negotiate.', 'Ningún título vencido abierto para negociar.')}</p>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      {/* Registrar contato */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase" style={{ color: AZUL }}>{L('Registrar Contato', 'Log Contact', 'Registrar Contacto')}</p>
                        <select value={novoContato.conta_id} onChange={(e) => setNovoContato({ ...novoContato, conta_id: e.target.value })} className={inputCls} style={selectStyle}>
                          {titulosVencidosCliente.map((c) => <option key={c.id} value={c.id}>{c.numero_documento || c.descricao}</option>)}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={novoContato.tipo} onChange={(e) => setNovoContato({ ...novoContato, tipo: e.target.value as CobrancaInteracao['tipo'] })} className={inputCls} style={selectStyle}>
                            <option value="contato">{L('Contato', 'Contact', 'Contacto')}</option>
                            <option value="negociacao">{L('Negociação', 'Negotiation', 'Negociación')}</option>
                            <option value="nota">{L('Nota', 'Note', 'Nota')}</option>
                          </select>
                          <select value={novoContato.canal} onChange={(e) => setNovoContato({ ...novoContato, canal: e.target.value })} className={inputCls} style={selectStyle}>
                            {['telefone', 'email', 'whatsapp', 'presencial', 'carta'].map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <textarea placeholder={L('O que foi tratado...', 'What was discussed...', 'Qué se trató...')} value={novoContato.descricao} onChange={(e) => setNovoContato({ ...novoContato, descricao: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={registrarContato} disabled={salvandoContato}
                          className="w-full py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                          style={{ background: `${AZUL}20`, color: AZUL, border: `1px solid ${AZUL}30` }}>
                          {salvandoContato ? '...' : L('Registrar', 'Log', 'Registrar')}
                        </motion.button>
                      </div>

                      {/* Registrar / editar negociação */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase" style={{ color: INDIGO }}>{editandoCompromissoId ? L('Editar Negociação', 'Edit Negotiation', 'Editar Negociación') : L('Registrar Negociação', 'Register Negotiation', 'Registrar Negociación')}</p>
                        <select value={novoCompromisso.conta_id} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, conta_id: e.target.value })} className={inputCls} style={selectStyle}>
                          {titulosVencidosCliente.map((c) => (
                            <option key={c.id} value={c.id}>{c.numero_documento || c.descricao} · {fBRL(Math.max(0, (Number(c.valor) || 0) - (Number(c.valor_recebido) || 0)))}</option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <select value={novoCompromisso.tipo} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, tipo: e.target.value as CobrancaCompromisso['tipo'] })} className={inputCls} style={selectStyle}>
                            <option value="promessa">{L('Promessa', 'Promise', 'Promesa')}</option>
                            <option value="acordo">{L('Acordo', 'Agreement', 'Acuerdo')}</option>
                          </select>
                          <input type="date" value={novoCompromisso.data_compromissada} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, data_compromissada: e.target.value })} className={inputCls} style={inputStyle} />
                          <input type="number" placeholder={L('Valor (R$)', 'Amount (R$)', 'Monto (R$)')} value={novoCompromisso.valor_compromissado} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, valor_compromissado: e.target.value })} className={inputCls} style={inputStyle} />
                          <input type="number" placeholder={L('Parcelas', 'Installments', 'Cuotas')} value={novoCompromisso.parcelas} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, parcelas: e.target.value })} className={inputCls} style={inputStyle} />
                          <input type="number" placeholder={L('Desconto %', 'Discount %', 'Descuento %')} value={novoCompromisso.desconto_pct} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, desconto_pct: e.target.value })} className={inputCls} style={inputStyle} />
                          <input type="number" placeholder={L('Juros %', 'Interest %', 'Interés %')} value={novoCompromisso.juros_pct} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, juros_pct: e.target.value })} className={inputCls} style={inputStyle} />
                          <input type="number" placeholder={L('Multa %', 'Fine %', 'Multa %')} value={novoCompromisso.multa_pct} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, multa_pct: e.target.value })} className={inputCls} style={inputStyle} />
                          <input placeholder={L('Responsável', 'Owner', 'Responsable')} value={novoCompromisso.responsavel} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, responsavel: e.target.value })} className={inputCls} style={inputStyle} />
                        </div>
                        <input placeholder={L('Condições (opcional)', 'Conditions (optional)', 'Condiciones (opcional)')} value={novoCompromisso.condicoes} onChange={(e) => setNovoCompromisso({ ...novoCompromisso, condicoes: e.target.value })} className={inputCls} style={inputStyle} />
                        <div className="flex gap-2">
                          {editandoCompromissoId && (
                            <button onClick={cancelarEdicaoCompromisso} className="px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: CINZA }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
                          )}
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCompromisso} disabled={salvandoCompromisso}
                            className="flex-1 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                            style={{ background: `linear-gradient(135deg, ${SAFIRA}, ${INDIGO})`, color: '#fff' }}>
                            {salvandoCompromisso ? '...' : editandoCompromissoId ? L('Salvar Alterações', 'Save Changes', 'Guardar Cambios') : L('Salvar Negociação', 'Save Negotiation', 'Guardar Negociación')}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: ETAPA DA RÉGUA DE ESCALONAMENTO ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {editandoEtapa && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setEditandoEtapa(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${PLATINA}35` }}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{L('Etapa de Escalonamento', 'Escalation Step', 'Etapa de Escalonamiento')}</h3>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setEditandoEtapa(null)} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: PLATINA }}>{L('Estágio', 'Stage', 'Etapa')}</label>
                      <select value={editandoEtapa.estagio || 'amigavel'} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, estagio: e.target.value as EstagioEscalonamento })} className={inputCls} style={selectStyle}>
                        {ORDEM_ESTAGIO_ESCALONAMENTO.map((e) => <option key={e} value={e}>{nomeEstagioEscalonamento(lang, e)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: PLATINA }}>{L('Gatilho (dias de atraso)', 'Trigger (days overdue)', 'Disparador (días de atraso)')}</label>
                      <input type="number" value={editandoEtapa.dias_relativos ?? 1} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, dias_relativos: parseInt(e.target.value, 10) || 0 })} className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: PLATINA }}>{L('Canal', 'Channel', 'Canal')}</label>
                      <select value={editandoEtapa.canal || 'email'} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, canal: e.target.value as EtapaRegua['canal'] })} className={inputCls} style={selectStyle}>
                        {CANAIS_REGUA.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: PLATINA }}>{L('Mensagem/ação-modelo', 'Message/action template', 'Mensaje/acción-modelo')}</label>
                      <textarea value={editandoEtapa.mensagem_modelo || ''} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, mensagem_modelo: e.target.value })} rows={3} placeholder="{cliente} {documento} {valor}" className={inputCls} style={inputStyle} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="etapaAtiva" checked={editandoEtapa.ativo ?? true} onChange={(e) => setEditandoEtapa({ ...editandoEtapa, ativo: e.target.checked })} className="w-4 h-4" />
                      <label htmlFor="etapaAtiva" className="text-xs font-semibold" style={{ color: '#c8d8f0' }}>{L('Etapa ativa', 'Step active', 'Etapa activa')}</label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setEditandoEtapa(null)} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: CINZA }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarEtapa}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${SAFIRA}, ${INDIGO})`, color: '#fff' }}>
                      {L('Salvar Etapa', 'Save Step', 'Guardar Etapa')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body,
      )}

      {/* ================= MODAL: NOVO CASO ================= */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {modalCaso && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-20 pb-8 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} onClick={fecharModalCaso}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }} transition={{ duration: 0.22, ease: 'easeOut' }}
                className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-2xl p-6" style={{ background: '#0a1628', border: `1px solid ${INDIGO}35`, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase mb-1" style={{ color: INDIGO }}>AXIOMA AI.TECH</p>
                      <h3 className="text-lg font-bold" style={{ ...FONTE_EXEC, color: '#e2ecf7' }}>{editandoCaso ? L('Editar Caso', 'Edit Case', 'Editar Caso') : L('Novo Caso de Inadimplência', 'New Delinquency Case', 'Nuevo Caso de Morosidad')}</h3>
                    </div>
                    <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={fecharModalCaso} style={{ color: CINZA }}><X size={20} /></motion.button>
                  </div>
                  <p className="text-[10px] mb-4" style={{ color: CINZA }}>{L('Registra um título vencido direto no Contas a Receber — sem cadastro paralelo.', 'Registers an overdue invoice directly in Accounts Receivable — no parallel record.', 'Registra un título vencido directo en Cuentas por Cobrar — sin registro paralelo.')}</p>
                  <div className="space-y-3">
                    <div>
                      <label className={labelInput} style={{ color: PLATINA }}>{L('Cliente', 'Client', 'Cliente')} *</label>
                      <select value={nc.cliente_id} onChange={(e) => setNc({ ...nc, cliente_id: e.target.value })} className={inputCls} style={selectStyle}>
                        <option value="">-- {L('Selecione (cadastre em Clientes se não existir)', 'Select (register in Clients if missing)', 'Seleccione (registre en Clientes si no existe)')} --</option>
                        {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: PLATINA }}>{L('Descrição', 'Description', 'Descripción')} *</label>
                      <input value={nc.descricao} onChange={(e) => setNc({ ...nc, descricao: e.target.value })} className={inputCls} style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelInput} style={{ color: PLATINA }}>{L('Valor (R$)', 'Amount (R$)', 'Monto (R$)')} *</label>
                        <input type="number" value={nc.valor} onChange={(e) => setNc({ ...nc, valor: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: PLATINA }}>{L('Venceu em', 'Due Date', 'Venció el')} *</label>
                        <input type="date" value={nc.data_vencimento} onChange={(e) => setNc({ ...nc, data_vencimento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: PLATINA }}>{L('Nº Documento', 'Doc No.', 'Nº Documento')}</label>
                        <input value={nc.numero_documento} onChange={(e) => setNc({ ...nc, numero_documento: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className={labelInput} style={{ color: PLATINA }}>{L('Categoria', 'Category', 'Categoría')}</label>
                        <select value={nc.categoria} onChange={(e) => setNc({ ...nc, categoria: e.target.value })} className={inputCls} style={selectStyle}>
                          {CATEGORIAS_CASO.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className={labelInput} style={{ color: PLATINA }}>{L('Responsável pela Cobrança', 'Collection Owner', 'Responsable de Cobranza')}</label>
                        <input value={nc.responsavel} onChange={(e) => setNc({ ...nc, responsavel: e.target.value })} className={inputCls} style={inputStyle} />
                      </div>
                    </div>
                    <div>
                      <label className={labelInput} style={{ color: PLATINA }}>{L('Observações', 'Notes', 'Observaciones')}</label>
                      <textarea value={nc.observacoes} onChange={(e) => setNc({ ...nc, observacoes: e.target.value })} rows={2} className={inputCls} style={inputStyle} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button onClick={fecharModalCaso} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.05)', color: CINZA }}>{L('Cancelar', 'Cancel', 'Cancelar')}</button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={salvarCaso} disabled={salvandoCaso}
                        className="flex-1 py-3 rounded-xl text-sm font-bold disabled:opacity-60"
                        style={{ background: `linear-gradient(135deg, ${SAFIRA}, ${INDIGO})`, color: '#fff' }}>
                        {salvandoCaso ? '...' : L('Salvar', 'Save', 'Guardar')}
                      </motion.button>
                    </div>
                  </div>
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
